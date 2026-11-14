# Frontend de KernelStore

Aplicación React (Vite + TypeScript) con el sitio público y el panel de
administración. La instalación, las variables y los scripts están en el
[README principal](../README.md); las pantallas, en el
[diagrama de navegación](../docs/diagrama-de-navegacion.md).

```bash
npm install
npm run dev     # http://localhost:5173; llama al backend en VITE_API_URL
npm run build   # verifica tipos y genera dist/
npm run lint
```

La URL del backend se define con `VITE_API_URL` (ver `.env.example`); si no se
define, se usa `http://localhost:8080`.
