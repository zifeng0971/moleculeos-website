import './TaskProgress.css'

type TaskProgressProps = {
  percent: number
}

export function TaskProgress({ percent }: TaskProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className="task-progress"
      role="progressbar"
      aria-label="Task Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className="task-progress-row">
        <p className="task-progress-label">Task Progress</p>
        <p className="task-progress-value">{clamped}%</p>
      </div>
      <div className="task-progress-track">
        <div
          className="task-progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
