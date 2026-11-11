import { BookOpenCheck, LayoutDashboard, LogOut, Moon, Sun, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboardPath } from '../data/seedData.js'

export function ThemeToggle({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark'

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white/70 px-3 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50 ${className}`}
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun aria-hidden="true" size={17} /> : <Moon aria-hidden="true" size={17} />}
      <span className="hidden sm:inline">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function Navbar({
  brandName = 'Student Assignment & Review Dashboard',
  userName,
  userRole,
  role,
  avatarUrl,
  onLogout,
  onSwitchAccount,
  theme,
  onToggleTheme,
}) {
  const dashboardPath = getDashboardPath(role)

  return (
    <header className="glass-surface mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6">
      <Link
        className="flex min-w-0 items-center gap-3 rounded-xl text-inherit no-underline"
        to={dashboardPath}
        aria-label={`${brandName} home`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-800">
          <BookOpenCheck aria-hidden="true" size={21} />
        </span>
        <span className="max-w-56 text-sm leading-tight font-semibold text-slate-900 sm:max-w-none sm:text-base">
          {brandName}
        </span>
      </Link>

      <nav className="order-3 flex w-full items-center border-t border-sky-100/80 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label="Main navigation">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-50 px-3 text-sm font-medium text-cyan-800 transition-colors hover:bg-cyan-100 focus-visible:outline-offset-2"
          to={dashboardPath}
        >
          <LayoutDashboard aria-hidden="true" size={17} />
          <span>{role === 'admin' ? 'Admin area' : 'Student area'}</span>
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <div className="flex min-w-0 items-center gap-2.5">
          {avatarUrl ? (
            <img
              className="size-10 rounded-full border border-white object-cover shadow-sm"
              src={avatarUrl}
              alt=""
            />
          ) : (
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 text-xs font-semibold text-cyan-900"
              aria-hidden="true"
            >
              {userName ? getInitials(userName) : '?'}
            </span>
          )}
          <span className="block min-w-0">
            <span className="block max-w-24 truncate text-xs font-semibold text-slate-800 sm:max-w-40 sm:text-sm">
              {userName || 'Account'}
            </span>
            <span className="block text-[10px] text-slate-500 sm:text-xs">{userRole || 'Role not set'}</span>
          </span>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white/70 px-3 text-sm font-medium text-slate-700 transition-colors hover:border-cyan-200 hover:bg-cyan-50"
          type="button"
          onClick={onSwitchAccount}
          aria-label="Switch account"
          title="Switch account"
        >
          <UserRound aria-hidden="true" size={17} />
          <span className="hidden sm:inline">Switch account</span>
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white/70 px-3 text-sm font-medium text-slate-600 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900 disabled:cursor-not-allowed disabled:opacity-55"
          type="button"
          onClick={onLogout}
          disabled={!onLogout}
          title={onLogout ? undefined : 'Available when authentication is implemented'}
        >
          <LogOut aria-hidden="true" size={17} />
          <span className="hidden sm:inline">Log out</span>
          <span className="sr-only sm:hidden">Log out</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
