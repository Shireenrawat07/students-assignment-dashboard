import { useId } from 'react'
import { Search } from 'lucide-react'

function SearchBar({
  value,
  onChange,
  placeholder = 'Search',
  label = 'Search',
  name = 'search',
  className = '',
}) {
  const inputId = useId()

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
        size={18}
      />
      <input
        className="min-h-11 w-full rounded-xl border border-sky-100 bg-white/75 py-2.5 pr-4 pl-10 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 hover:border-sky-200 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
        id={inputId}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default SearchBar
