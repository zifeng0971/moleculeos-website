import { Icon } from '../Icon/Icon'
import iconMocha from '../../../assets/mocha/icon-mocha.svg'
import iconAnnotationPlus from '../../../assets/mocha/icon-annotation-plus.svg'
import './MochaHeader.css'

type MochaHeaderProps = {
  title?: string
}

export function MochaHeader({ title = 'Mocha' }: MochaHeaderProps) {
  return (
    <header className="mocha-header">
      <div className="mocha-header-left">
        <div className="mocha-header-brand">
          <span className="mocha-header-logo">
            <Icon src={iconMocha} width={16} height={20} />
          </span>
          <p className="mocha-header-title">{title}</p>
        </div>
      </div>
      <Icon src={iconAnnotationPlus} width={16} height={16} />
    </header>
  )
}
