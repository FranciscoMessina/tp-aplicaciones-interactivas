#!/usr/bin/env node
/**
 * Herramienta segura para asociar fotos verificadas a los productos de ejemplo.
 * Nunca ejecuta el seed ni modifica nada distinto del campo images.
 * Ejecutar desde backend (para leer .env y public/catalog).
 */
import 'dotenv/config'
import { readFile, readdir, mkdir, writeFile, rename, stat } from 'node:fs/promises'
import { join, resolve, extname, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

const backendDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const manifestPath = join(backendDir, 'scripts', 'catalog-photos.json')
const catalogDir = join(backendDir, 'public', 'catalog')
const backupDir = join(backendDir, '.photo-backups')
const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/FranciscoMessina/tp-aplicaciones-interactivas/main/backend/public/catalog/'
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
const MAX_FILE_BYTES = 5 * 1024 * 1024
const argv = process.argv.slice(2)

function usage() {
  console.log(`Uso desde backend:
  npm run photos:plan
  npm run photos:download
  npm run photos:gallery
  npm run photos:apply -- --confirm
  npm run photos:apply -- --confirm --allow-partial
  node scripts/update-catalog-photos.mjs --restore .photo-backups/archivo.json --confirm

Opcional para --apply: --base-url https://servidor-publico/catalog/

PASOS: completar scripts/catalog-photos.json, descargar fotos, revisar cada una,
subir public/catalog a main y recién entonces aplicar. Los cambios en MongoDB
se limitan al campo images; se genera una copia de seguridad antes de escribir.`)
}
function err(message) { throw new Error(message) }
function isRealImage(data, extension) {
  if ((extension === '.jpg' || extension === '.jpeg') && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return true
  if (extension === '.png' && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return true
  if (extension === '.webp' && data.toString('latin1',0,4)==='RIFF' && data.toString('latin1',8,12)==='WEBP') return true
  if (extension === '.gif' && ['GIF87a','GIF89a'].includes(data.toString('latin1',0,6))) return true
  return false
}
function validFileBase(value) {
  return typeof value === 'string' && /^\d{3}-[a-z0-9][a-z0-9-]*$/.test(value) && value.length <= 95
}
function safeSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && Boolean(url.hostname) && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname) }
  catch { return false }
}
async function readManifest() {
  const data = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (!Array.isArray(data) || data.length !== 108) err('El manifiesto debe contener exactamente los 108 productos del seed.')
  const names = new Set(), files = new Set()
  for (const p of data) {
    if (typeof p.name !== 'string' || typeof p.category !== 'string' || !validFileBase(p.filename) || typeof p.sourceUrl !== 'string') err('Registro inválido en catalog-photos.json')
    if (names.has(p.name) || files.has(p.filename)) err(`Nombre o archivo duplicado: ${p.name}`)
    names.add(p.name); files.add(p.filename)
    if (p.sourceUrl && !safeSourceUrl(p.sourceUrl)) err(`sourceUrl inválida para ${p.name}: debe ser una URL HTTPS pública`)
  }
  return data
}
async function scanFiles(data) {
  await mkdir(catalogDir, { recursive: true })
  const existing = await readdir(catalogDir)
  const allFiles = new Map()
  for (const p of data) {
    const matches = existing.filter(n => EXTENSIONS.has(extname(n).toLowerCase()) && n.slice(0,-extname(n).length) === p.filename)
    if (matches.length > 1) err(`Hay fotos duplicadas para ${p.name}: ${matches.join(', ')}`)
    allFiles.set(p.name, matches[0] ?? null)
  }
  return allFiles
}
async function plan(data, files) {
  const ready = data.filter(p => files.get(p.name))
  const pending = data.filter(p => !files.get(p.name))
  console.log(`\nCatálogo: ${data.length} productos | ${ready.length} fotos presentes | ${pending.length} pendientes`)
  if (pending.length) {
    console.log('\nFotos pendientes:')
    for (const p of pending) console.log(`  [${p.category}] ${p.name}  →  ${p.filename}.{jpg/png/webp}`)
  }
  if (ready.length) console.log('\nFotos presentes:',ready.map(p => p.filename).join(', '))
  return { ready, pending }
}
function extensionFromImage(response, bytes) {
  const type = (response.headers.get('content-type') ?? '').split(';')[0].toLowerCase()
  if (type === 'image/jpeg' && isRealImage(bytes,'.jpg')) return '.jpg'
  if (type === 'image/png' && isRealImage(bytes,'.png')) return '.png'
  if (type === 'image/webp' && isRealImage(bytes,'.webp')) return '.webp'
  if (type === 'image/gif' && isRealImage(bytes,'.gif')) return '.gif'
  // Algunos servidores declaran un content-type genérico. Verificamos la firma.
  for (const ext of ['.jpg','.png','.webp','.gif']) if (isRealImage(bytes,ext)) return ext
  return null
}
async function download(data, files) {
  let done=0, failures=0, noUrl=0
  for (const p of data) {
    if (files.get(p.name)) continue
    if (!p.sourceUrl) { noUrl++; continue }
    try {
      const response = await fetch(p.sourceUrl, { signal: AbortSignal.timeout(18000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechStore-classroom-demo/1.0)' }, redirect: 'follow' })
      if (!response.ok) err(`HTTP ${response.status}`)
      if (!safeSourceUrl(response.url)) err('La URL final no es HTTPS pública')
      const announcedSize = Number(response.headers.get('content-length') || 0)
      if (announcedSize > MAX_FILE_BYTES) err('Archivo superior a 5 MB')
      const bytes = Buffer.from(await response.arrayBuffer())
      if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) err('Imagen vacía o superior a 5 MB')
      const extension = extensionFromImage(response, bytes)
      if (!extension) err('El archivo descargado no es JPG/PNG/WEBP/GIF válido')
      const path = join(catalogDir, p.filename + extension)
      const temporary = path + '.tmp'
      await writeFile(temporary, bytes, { flag: 'wx' }); await rename(temporary,path)
      console.log(`OK   ${p.name} → ${p.filename+extension}`)
      done++
    } catch (e) { console.error(`ERROR  ${p.name}: ${e.message}`); failures++ }
  }
  console.log(`\nDescargadas: ${done}; sin URL: ${noUrl}; errores: ${failures}. No se modificó MongoDB.`)
  if (failures > 0) process.exitCode = 1
}
async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) err('Falta MONGODB_URI en backend/.env')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 })
  console.log('MongoDB conectado.')
  return mongoose.connection.collection('products')
}
async function validateFiles(data, files) {
  for (const p of data) {
    const name = files.get(p.name)
    if (!name) continue
    const path = join(catalogDir, name)
    const info = await stat(path)
    if (!info.isFile() || info.size < 12 || info.size > MAX_FILE_BYTES) err(`Foto fuera de rango (de 12 bytes a 5 MB): ${name}`)
    const bytes = await readFile(path)
    if (!isRealImage(bytes, extname(name).toLowerCase())) err(`Foto corrupta o extensión incorrecta: ${name}`)
  }
}
function htmlEscape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char])
}
async function gallery(data, files) {
  await validateFiles(data,files)
  await mkdir(backupDir,{recursive:true})
  const cards = data.map(p => {
    const name = files.get(p.name)
    const image = name ? `<img src="../public/catalog/${encodeURIComponent(name)}" alt="${htmlEscape(p.name)}">` : '<div class="missing">Falta imagen</div>'
    return `<div class="card">${image}<div class="info"><small>${htmlEscape(p.category)}</small><h2>${htmlEscape(p.name)}</h2><code>${htmlEscape(name??p.filename)}</code></div></div>`
  }).join('\n')
  const output = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Revisión de fotos TechStore</title><style>body{font:14px system-ui;background:#f5f7fb;color:#172033;margin:24px}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px}.card{background:white;border-radius:12px;border:1px solid #d4ddea;overflow:hidden}.card img,.missing{width:100%;height:210px;object-fit:contain;background:#fff}.missing{display:grid;place-items:center;background:#f9e9e9;color:#a32323}.info{padding:14px}small{color:#315b94}h2{font-size:16px}code{font-size:10px;word-break:break-all}</style></head><body><h1>Revisión local de fotos — ${data.length} productos</h1><p>Esta galería no actualiza la base. Verificá visualmente cada imagen antes de subirlas a GitHub.</p><div class="grid">${cards}</div></body></html>`
  const path=join(backupDir,'catalog-gallery.html')
  await writeFile(path,output)
  console.log(`Galería generada: ${path}`)
}

function backupName() { return `product-images-${new Date().toISOString().replace(/[:.]/g,'-')}.json` }
async function apply(data, files) {
  if (!argv.includes('--confirm')) err('Para escribir en la base, agregá --confirm. Antes hacé un respaldo de los archivos y mergeá las fotos.')
  await validateFiles(data,files)
  const subset = data.filter(p => files.get(p.name))
  if (!subset.length) err('No hay fotos locales para aplicar')
  if (subset.length !== data.length && !argv.includes('--allow-partial')) err(`Solo hay ${subset.length}/${data.length} fotos. Falta completar el catálogo; si querés aplicar una parte, agregá --allow-partial.`)
  const rawUrl = argv.includes('--base-url') ? argv[argv.indexOf('--base-url') + 1] : DEFAULT_BASE_URL
  if (!rawUrl || !safeSourceUrl(rawUrl)) err('--base-url debe ser una URL HTTPS pública')
  const baseUrl = rawUrl.endsWith('/') ? rawUrl : rawUrl+'/'
  // Evita guardar URL rotas si aún no se subieron y mergearon las fotos.
  const probes = [subset[0],subset[Math.floor(subset.length/2)],subset[subset.length-1]]
  for (const p of probes) {
    const testUrl = new URL(encodeURIComponent(files.get(p.name)), baseUrl).toString()
    try {
      const response = await fetch(testUrl, { method: 'HEAD', signal: AbortSignal.timeout(12000) })
      if (!response.ok) err(`HTTP ${response.status}`)
    } catch(e) { err(`La foto todavía no es accesible en el servidor público: ${p.name}. ${e.message}. Primero mergeá las fotos en main.`) }
  }
  const db = await connect()
  try {
    const existing = await db.find({ name: { $in: subset.map(p=>p.name) } }, { projection: {name:1,images:1} }).toArray()
    const found = new Map()
    for (const product of existing) {
      if (found.has(product.name)) err(`Hay nombres de producto duplicados en MongoDB: ${product.name}`)
      found.set(product.name,product)
    }
    const missing = subset.filter(p=>!found.has(p.name))
    if (missing.length) err(`No se encontraron ${missing.length} productos en MongoDB: ${missing.map(p=>p.name).join('; ')}`)
    const updates = subset.map(p=>({ current:found.get(p.name), newImages: [new URL(encodeURIComponent(files.get(p.name)), baseUrl).toString()] }))
      .filter(({current,newImages})=>JSON.stringify(current.images??[])!==JSON.stringify(newImages))
    if (!updates.length) { console.log('Las imágenes de estos productos ya están actualizadas.'); return }
    await mkdir(backupDir,{recursive:true})
    const backupFile=join(backupDir,backupName())
    await writeFile(backupFile,JSON.stringify({createdAt:new Date().toISOString(),updated:updates.map(({current,newImages})=>({_id:String(current._id),name:current.name,oldImages:current.images??[],newImages}))},null,2)+'\n',{flag:'wx'})
    console.log(`Respaldo ANTES de actualizar: ${backupFile}`)
    const res=await db.bulkWrite(updates.map(({current,newImages})=>({updateOne:{filter:{_id:current._id},update:{$set:{images:newImages}}}})),{ordered:true})
    console.log(`Listo. Productos modificados: ${res.modifiedCount}. No se modificaron otros campos.`)
  } finally {await mongoose.disconnect()}
}
async function restore(backupPath) {
  if (!argv.includes('--confirm')) err('Restaurar requiere --confirm')
  if (!backupPath) err('Indicá el archivo de respaldo después de --restore')
  const path=resolve(backendDir,backupPath)
  const relativeBackup = relative(backupDir, path)
  if (!relativeBackup || relativeBackup.startsWith('..') || isAbsolute(relativeBackup)) err('Por seguridad, el respaldo debe estar dentro de backend/.photo-backups/')
  const backup=JSON.parse(await readFile(path,'utf8'))
  if (!Array.isArray(backup.updated)||!backup.updated.every(x=>typeof x._id==='string'&&Array.isArray(x.oldImages))) err('Respaldo inválido')
  const db=await connect()
  try {
    const res=await db.bulkWrite(backup.updated.map(p=>({updateOne:{filter:{_id:new mongoose.Types.ObjectId(p._id),name:p.name},update:{$set:{images:p.oldImages}}}})),{ordered:true})
    console.log(`Imágenes restauradas en ${res.modifiedCount} publicaciones.`)
  } finally {await mongoose.disconnect()}
}
async function main() {
  if(argv.includes('--help') || argv.length===0){usage();return}
  if(argv.includes('--restore')) { await restore(argv[argv.indexOf('--restore')+1]); return }
  const data=await readManifest();const files=await scanFiles(data)
  if(argv.includes('--plan')) await plan(data,files)
  else if(argv.includes('--download')) await download(data,files)
  else if(argv.includes('--gallery')) await gallery(data,files)
  else if(argv.includes('--apply')) await apply(data,files)
  else usage()
}
main().catch(error=>{ console.error('ERROR:',error.message); process.exitCode=1 })
