// Marca: una "K" trazada como pista de circuito, sobre un chip con la esquina cortada del sitio.
export default function LogoMark() {
  return (
    <svg className="logo-symbol" viewBox="0 0 32 32" aria-hidden="true">
      <path className="logo-chip" d="M0 0H24L32 8V32H0Z" />
      <path className="logo-trace" d="M9.5 8V24M9.5 16H12.5L20.5 8M12.5 16L20.5 24" />
      <circle className="logo-pad" cx="21" cy="24.5" r="3" />
    </svg>
  )
}
