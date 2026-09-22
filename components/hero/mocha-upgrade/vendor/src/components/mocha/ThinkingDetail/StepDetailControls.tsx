import { useState } from 'react'
import type { DetailControl } from '../../../data/mochaFlow'
import './StepDetailControls.css'

type StepDetailControlsProps = {
  controls: DetailControl[]
}

export function StepDetailControls({ controls }: StepDetailControlsProps) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      controls
        .filter((control) => control.type === 'toggle')
        .map((control) => [control.id, control.defaultOn]),
    ),
  )
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      controls
        .filter((control) => control.type === 'choice')
        .map((control) => [control.id, control.defaultValue]),
    ),
  )
  const [sliders, setSliders] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      controls
        .filter((control) => control.type === 'slider')
        .map((control) => [control.id, control.defaultValue]),
    ),
  )

  return (
    <div className="step-detail-controls">
      {controls.map((control) => {
        if (control.type === 'readout') {
          return (
            <div key={control.label} className="step-detail-field">
              <p className="step-detail-label">{control.label}</p>
              <p className="step-detail-readout">{control.value}</p>
            </div>
          )
        }

        if (control.type === 'toggle') {
          const on = toggles[control.id]
          return (
            <button
              key={control.id}
              type="button"
              className={
                on
                  ? 'step-detail-toggle step-detail-toggle-on'
                  : 'step-detail-toggle'
              }
              aria-pressed={on}
              onClick={() =>
                setToggles((current) => ({
                  ...current,
                  [control.id]: !current[control.id],
                }))
              }
            >
              <span className="step-detail-toggle-mark" aria-hidden />
              <span>{control.label}</span>
            </button>
          )
        }

        if (control.type === 'choice') {
          return (
            <div key={control.id} className="step-detail-field">
              <p className="step-detail-label">{control.label}</p>
              <div className="step-detail-choices">
                {control.options.map((option) => {
                  const selected = choices[control.id] === option
                  return (
                    <button
                      key={option}
                      type="button"
                      className={
                        selected
                          ? 'step-detail-choice step-detail-choice-selected'
                          : 'step-detail-choice'
                      }
                      aria-pressed={selected}
                      onClick={() =>
                        setChoices((current) => ({
                          ...current,
                          [control.id]: option,
                        }))
                      }
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }

        if (control.type === 'slider') {
          const value = sliders[control.id]
          return (
            <div key={control.id} className="step-detail-field">
              <div className="step-detail-slider-head">
                <p className="step-detail-label">{control.label}</p>
                <p className="step-detail-slider-value">
                  {value}
                  {control.unit ? ` ${control.unit}` : ''}
                </p>
              </div>
              <input
                className="step-detail-slider"
                type="range"
                min={control.min}
                max={control.max}
                value={value}
                onChange={(event) =>
                  setSliders((current) => ({
                    ...current,
                    [control.id]: Number(event.target.value),
                  }))
                }
              />
            </div>
          )
        }

        return (
          <button key={control.label} type="button" className="step-detail-button">
            {control.label}
          </button>
        )
      })}
    </div>
  )
}
