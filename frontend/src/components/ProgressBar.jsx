import { useId } from 'react'

function ProgressBar({ label, value, max = 100, showValue = true, className = '' }) {
  const labelId = useId()
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0
  const percentage = Math.round((safeValue / safeMax) * 100)

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700" id={labelId}>
          {label}
        </span>
        {showValue && <span className="text-sm font-semibold tabular-nums text-cyan-800">{percentage}%</span>}
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-sky-100"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percentage}% complete`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-[width] duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
