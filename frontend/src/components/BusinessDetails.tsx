import type { BusinessInfo } from '../types/business'

function socialLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('facebook')) return 'Facebook'
    if (host.includes('tiktok')) return 'TikTok'
    if (host.includes('linkedin')) return 'LinkedIn'
    if (host.includes('x.com') || host.includes('twitter')) return 'X / Twitter'
    return host
  } catch {
    return 'Red social'
  }
}

function safeSocialUrl(url: string): boolean {
  try {
    return ['https:', 'http:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

export default function BusinessDetails({ info }: { info: BusinessInfo }) {
  const networks = info.socialNetworks.filter(safeSocialUrl)
  return (
    <div className="business-detail-grid">
      <div className="business-detail-card">
        <h3>Dirección</h3>
        <p>{info.address}</p>
      </div>
      <div className="business-detail-card">
        <h3>Teléfono</h3>
        <p><a href={`tel:${info.phone.replace(/[^\d+]/g, '')}`}>{info.phone}</a></p>
      </div>
      <div className="business-detail-card">
        <h3>Horarios</h3>
        {info.openingHours.length > 0 ? (
          <ul>{info.openingHours.map((hours, index) => <li key={`${index}-${hours}`}>{hours}</li>)}</ul>
        ) : <p>Horarios no informados.</p>}
      </div>
      <div className="business-detail-card">
        <h3>Redes sociales</h3>
        {networks.length > 0 ? (
          <ul>{networks.map((url) => (
            <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{socialLabel(url)} ↗</a></li>
          ))}</ul>
        ) : <p>Redes sociales no informadas.</p>}
      </div>
    </div>
  )
}
