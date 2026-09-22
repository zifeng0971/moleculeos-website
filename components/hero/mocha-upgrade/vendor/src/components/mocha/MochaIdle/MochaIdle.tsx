import { Icon } from '../Icon/Icon'
import iconStructure from '../../../assets/mocha/icon-fn-structure.svg'
import iconRedesign from '../../../assets/mocha/icon-fn-redesign.svg'
import iconMutation from '../../../assets/mocha/icon-fn-mutation.svg'
import iconAffinity from '../../../assets/mocha/icon-fn-affinity.svg'
import './MochaIdle.css'

const icons = [iconStructure, iconAffinity, iconRedesign, iconMutation]

export type MochaIdleItem = { id: string; title: string; description: string }

export function MochaIdle({
  banner,
  prompt,
  sectionLabel,
  items,
  onSelect,
}: {
  banner: string
  prompt: string
  sectionLabel: string
  items: MochaIdleItem[]
  onSelect?: (id: string) => void
}) {
  return (
    <div className="mocha-idle" aria-label="Mocha welcome">
      <div className="mocha-idle-intro">
        <div className="mocha-idle-greeting">
          <p className="mocha-idle-banner-text">
            {banner}
          </p>
          <p className="mocha-idle-prompt">
            {prompt}
          </p>
        </div>
        <p className="mocha-idle-section-label">
          {sectionLabel}
        </p>
      </div>

      <div className="mocha-idle-grid">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="mocha-idle-starter"
            onClick={() => onSelect?.(item.id)}
          >
            <span className="mocha-idle-starter-head">
              <span className="mocha-idle-starter-icon" aria-hidden>
                <Icon src={icons[index % icons.length]} width={16} height={16} />
              </span>
              <span className="mocha-idle-starter-title">{item.title}</span>
            </span>
            <span className="mocha-idle-starter-desc">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
