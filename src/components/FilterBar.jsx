function FilterBar({ options, value, onChange, label = 'Filter by status', className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            className={`min-h-10 rounded-xl border px-3.5 text-sm font-medium transition-colors focus-visible:outline-offset-2 ${
              selected
                ? 'border-cyan-200 bg-cyan-50 text-cyan-900 shadow-sm'
                : 'border-transparent bg-white/55 text-slate-600 hover:border-sky-100 hover:bg-white/85 hover:text-slate-900'
            }`}
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default FilterBar
