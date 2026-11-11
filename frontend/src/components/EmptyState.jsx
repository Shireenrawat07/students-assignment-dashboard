import { Inbox } from 'lucide-react'

function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <section className={`glass-surface flex flex-col items-center px-6 py-12 text-center sm:px-10 ${className}`}>
      <span
        className="mb-4 grid size-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-800 [&>svg]:size-7"
        aria-hidden="true"
      >
        {icon || <Inbox aria-hidden="true" />}
      </span>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </section>
  )
}

export default EmptyState
