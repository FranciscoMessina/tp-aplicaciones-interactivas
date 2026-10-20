// Marca: una "T" trazada como pista de circuito, sobre un chip con la esquina cortada del sitio.
export default function LogoMark() {
  return (
    <svg className="logo-symbol" viewBox="0 0 32 32" aria-hidden="true">
      <path className="logo-chip" d="M0 0H24L32 8V32H0Z" />
      <path className="logo-trace" d="M7 10H23M15 10V17.5L20.5 23" />
      <circle className="logo-pad" cx="21.5" cy="24" r="3.25" />
    </svg>
  )
}
