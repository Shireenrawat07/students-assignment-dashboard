import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { demoUsers, getDashboardPath } from '../data/seedData.js'
import { ThemeToggle } from '../components/Navbar.jsx'

function Login({ theme, onToggleTheme }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useApp()
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const result = login(email, password)
    if (!result.success) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
      return
    }

    navigate(getDashboardPath(result.user.role), { replace: true })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-14 sm:px-6">
      <ThemeToggle
        theme={theme}
        onToggle={onToggleTheme}
        className="absolute top-4 right-4 sm:top-6 sm:right-6"
      />
      <section className="glass-surface animate-enter w-full max-w-md rounded-3xl p-6 sm:p-9">
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-cyan-100 text-cyan-800">
            <LockKeyhole aria-hidden="true" size={25} />
          </span>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-800 uppercase">
            Student Assignment &amp; Review Dashboard
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to your assignment workspace.</p>
        </div>

        <div className="login-notice mb-6 flex gap-3 rounded-xl p-3.5 text-sm" role="note">
          <ShieldCheck className="login-notice-icon mt-0.5 shrink-0" aria-hidden="true" size={18} />
          <div>
            <p className="login-notice-title m-0 font-semibold">Demo environment</p>
            <p className="login-notice-description mt-0.5 mb-0 leading-5">
              Use the demo accounts provided below. No real authentication is required.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="login-label mb-1.5 block text-sm font-medium text-slate-700" htmlFor="login-email">
              Email address
            </label>
            <input
              className="login-input min-h-12 w-full rounded-xl border border-sky-100 bg-white/80 px-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-sky-200 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@college.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="login-label mb-1.5 block text-sm font-medium text-slate-700" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                className="login-input min-h-12 w-full rounded-xl border border-sky-100 bg-white/80 py-2.5 pr-12 pl-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 hover:border-sky-200 focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className="login-password-toggle absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-cyan-50 hover:text-cyan-800"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword
                  ? <EyeOff aria-hidden="true" size={18} />
                  : <Eye aria-hidden="true" size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="login-error rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="min-h-12 w-full rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <details className="group mt-6 rounded-xl border border-sky-100 bg-white/45">
          <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white/70 focus-visible:outline-offset-2">
            View demo accounts
          </summary>
          <div className="space-y-3 border-t border-sky-100 px-4 py-4">
            <p className="m-0 text-xs text-slate-600">
              Each demo account has its own password.
            </p>
            <ul className="m-0 max-h-48 list-none space-y-2 overflow-y-auto p-0">
              {demoUsers.map((user) => (
                <li className="flex flex-col gap-1 rounded-lg bg-white/60 p-2.5 text-sm" key={user.id}>
                  <span className="font-medium text-slate-800">{user.name} · {user.role}</span>
                  <span className="break-all text-xs text-slate-600">{user.email}</span>
                  <span className="text-xs text-slate-600">
                    Password: <code className="rounded bg-cyan-50 px-1.5 py-0.5 font-mono text-cyan-900">{user.password}</code>
                  </span>
                  <button
                    className="mt-1 min-h-9 self-start rounded-lg px-2 text-xs font-semibold text-cyan-800 transition-colors hover:bg-cyan-50"
                    type="button"
                    onClick={() => {
                      setEmail(user.email)
                      setPassword(user.password)
                      setErrorMessage('')
                    }}
                  >
                    Use this account
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </section>
    </main>
  )
}

export default Login
