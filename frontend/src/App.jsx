import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext.jsx'
import { getDashboardPath } from './data/seedData.js'
import { canAccessRole } from './utils/assignmentRules.js'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'

const THEME_STORAGE_KEY = 'student-assignment-board-theme-v1'

function getInitialTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  } catch (error) {
    console.error('Unable to restore the appearance preference from local storage.', error)
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const { currentUser } = useApp()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.error('Unable to save the appearance preference to local storage.', error)
    }
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Routes>
      <Route
        path="/"
        element={currentUser
          ? <Navigate to={getDashboardPath(currentUser.role)} replace />
          : <Login theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route
        path="/admin/dashboard"
        element={canAccessRole(currentUser, 'admin')
          ? <AdminDashboard theme={theme} onToggleTheme={toggleTheme} />
          : <Navigate to={currentUser ? getDashboardPath(currentUser.role) : '/'} replace />}
      />
      <Route
        path="/student/dashboard"
        element={canAccessRole(currentUser, 'student')
          ? <StudentDashboard theme={theme} onToggleTheme={toggleTheme} />
          : <Navigate to={currentUser ? getDashboardPath(currentUser.role) : '/'} replace />}
      />
      <Route path="*" element={<Navigate to={currentUser ? getDashboardPath(currentUser.role) : '/'} replace />} />
    </Routes>
  )
}

export default App
