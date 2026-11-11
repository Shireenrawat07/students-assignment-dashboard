function StatCard({ icon, label, value, detail, className = '' }) {
  return (
    <article className={`glass-surface flex min-w-0 items-start gap-4 rounded-2xl p-5 ${className}`}>
      {icon && (
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-800 [&>svg]:size-5"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
      </div>
    </article>
  )
}

export default StatCard
