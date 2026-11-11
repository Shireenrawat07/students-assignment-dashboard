import { CalendarDays, ExternalLink, FileText, Send } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'

const statusStyles = {
  neutral: 'bg-slate-100 text-slate-700',
  cyan: 'bg-cyan-50 text-cyan-800',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-amber-50 text-amber-800',
  overdue: 'bg-rose-50 text-rose-800',
}

function AssignmentCard({
  title,
  subject,
  description,
  dueDate,
  status,
  statusTone = 'neutral',
  progress,
  externalLink,
  onSubmit,
  isOverdue = false,
  className = '',
  style,
}) {
  const toneClass = statusStyles[statusTone] || statusStyles.neutral

  return (
    <article
      className={`glass-surface flex h-full flex-col rounded-2xl p-5 ${isOverdue ? 'border-amber-200/80' : ''} ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-800">
          <FileText aria-hidden="true" size={19} />
        </span>
        {status && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
            {status}
          </span>
        )}
      </div>
      <div className="mt-4">
        {subject && <p className="text-xs font-semibold tracking-wide text-cyan-800">{subject}</p>}
        <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {progress && (
        <ProgressBar
          className="mt-5"
          label={progress.label}
          value={progress.value}
          max={progress.max}
        />
      )}
      {dueDate && (
        <p className={`mt-auto flex items-center gap-2 pt-5 text-sm ${isOverdue ? 'font-medium text-amber-800' : 'text-slate-600'}`}>
          <CalendarDays aria-hidden="true" size={16} className="text-cyan-700" />
          <span>{dueDate}</span>
        </p>
      )}
      {externalLink && (
        <a
          className="mt-4 inline-flex min-h-10 items-center gap-2 self-start rounded-lg px-2 text-sm font-medium text-cyan-800 transition-colors hover:bg-cyan-50 hover:text-cyan-950 focus-visible:outline-offset-2"
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>View Assignment</span>
          <ExternalLink aria-hidden="true" size={15} />
        </a>
      )}
      {onSubmit && (
        <button
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-800"
          type="button"
          onClick={onSubmit}
        >
          <Send aria-hidden="true" size={16} />
          <span>Yes, I have submitted</span>
        </button>
      )}
    </article>
  )
}

export default AssignmentCard
