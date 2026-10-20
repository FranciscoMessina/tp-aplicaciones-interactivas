import type { ReactNode } from 'react'
import Icon from './Icon'
import type { IconName } from './Icon'

interface Props {
  icon: IconName
  title: string
  children: ReactNode
  action?: ReactNode
  isError?: boolean
}

// Estado vacío o de error de una sección del panel: qué pasó y qué se puede hacer.
export default function AdminEmpty({ icon, title, children, action, isError = false }: Props) {
  return (
    <div className={`admin-empty${isError ? ' is-error' : ''}`} role={isError ? 'alert' : undefined}>
      <Icon name={icon} />
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  )
}
