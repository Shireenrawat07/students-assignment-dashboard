import { useMemo, useState } from 'react'
import { ArrowDownWideNarrow, CheckCircle2, Clock3, FileCheck2, ListTodo } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AssignmentCard from '../components/AssignmentCard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Navbar from '../components/Navbar.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import StatCard from '../components/StatCard.jsx'
import { useApp } from '../context/AppContext.jsx'
import { getAssignmentsForStudent } from '../utils/assignmentRules.js'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
]

function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDueDate(dateString) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00Z`))
}

function StudentDashboard({ theme, onToggleTheme }) {
  const { currentUser, logout, assignments, updates, storageError, markSubmitted } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('earliest')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
  const [confirmationStep, setConfirmationStep] = useState(0)
  const [submissionError, setSubmissionError] = useState('')
  const today = getToday()

  const studentAssignments = useMemo(
    () =>
      getAssignmentsForStudent(assignments, currentUser)
        .map((assignment) => {
          const status =
            updates[assignment.id]?.[currentUser.id] ??
            assignment.submissions[currentUser.id] ??
            'pending'
          const isOverdue = status !== 'submitted' && assignment.dueDate < today
          return { ...assignment, status, isOverdue }
        }),
    [assignments, currentUser, today, updates],
  )

  const submittedCount = studentAssignments.filter((assignment) => assignment.status === 'submitted').length
  const totalCount = studentAssignments.length
  const pendingCount = totalCount - submittedCount
  const completion = totalCount ? Math.round((submittedCount / totalCount) * 100) : 0

  const visibleAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return studentAssignments
      .filter((assignment) =>
        `${assignment.title} ${assignment.description}`.toLowerCase().includes(query),
      )
      .filter((assignment) => {
        if (filter === 'submitted') return assignment.status === 'submitted'
        if (filter === 'overdue') return assignment.isOverdue
        if (filter === 'pending') return assignment.status !== 'submitted' && !assignment.isOverdue
        return true
      })
      .sort((first, second) =>
        sortOrder === 'earliest'
          ? first.dueDate.localeCompare(second.dueDate)
          : second.dueDate.localeCompare(first.dueDate),
      )
  }, [filter, search, sortOrder, studentAssignments])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleSwitchAccount() {
    logout()
    navigate('/', { replace: true })
  }

  function closeConfirmation() {
    setSelectedAssignmentId(null)
    setConfirmationStep(0)
    setSubmissionError('')
  }

  function requestSubmission(assignmentId) {
    setSelectedAssignmentId(assignmentId)
    setConfirmationStep(1)
    setSubmissionError('')
  }

  function advanceConfirmation() {
    if (confirmationStep === 1) {
      setConfirmationStep(2)
      return
    }

    const result = markSubmitted(selectedAssignmentId, currentUser.id)
    if (!result.success) {
      setSubmissionError(result.error)
      return
    }
    closeConfirmation()
  }

  const selectedAssignment = studentAssignments.find(
    (assignment) => assignment.id === selectedAssignmentId,
  )
  const confirmationTitle =
    confirmationStep === 2 ? 'Final confirmation' : 'Confirm your submission'
  const confirmationDescription =
    confirmationStep === 2
      ? `Final check: mark “${selectedAssignment?.title}” as submitted? This cannot be undone.`
      : `Have you finished and submitted “${selectedAssignment?.title}”? You will be asked to confirm one more time.`

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <Navbar
        userName={currentUser.name}
        userRole="Student"
        role="student"
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="mx-auto w-full max-w-7xl px-0 py-8 sm:py-10">
        {storageError && (
          <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {storageError}
          </p>
        )}
        <section className="animate-enter">
          <p className="text-sm font-semibold text-cyan-800">Student dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Welcome, {currentUser.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep track of your assignments, due dates, and submissions in one place.
          </p>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Assignment statistics">
          <StatCard icon={<ListTodo />} label="Total assigned" value={totalCount} />
          <StatCard icon={<CheckCircle2 />} label="Submitted" value={submittedCount} />
          <StatCard icon={<Clock3 />} label="Pending" value={pendingCount} detail="Includes overdue work" />
          <StatCard icon={<FileCheck2 />} label="Completion" value={`${completion}%`} />
        </section>

        <section className="glass-surface mt-5 rounded-2xl p-5 sm:p-6" aria-label="Overall progress">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Overall progress</h2>
              <p className="mt-1 text-sm text-slate-600">
                {submittedCount} of {totalCount} assignments submitted
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums text-cyan-800">{completion}%</span>
          </div>
          <ProgressBar label="Assignment completion" value={submittedCount} max={totalCount || 100} showValue={false} />
        </section>

        <section className="mt-9" aria-labelledby="assignments-heading">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900" id="assignments-heading">
                Your assignments
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Review due dates and update your submission status.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SearchBar
                className="w-full lg:max-w-sm"
                value={search}
                onChange={setSearch}
                label="Search assignments by title or description"
                placeholder="Search assignments"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <FilterBar
                  options={filters}
                  value={filter}
                  onChange={setFilter}
                  label="Filter assignments by status"
                />
                <label className="flex min-h-10 items-center gap-2 self-start rounded-xl border border-sky-100 bg-white/70 px-3 text-sm text-slate-600 sm:self-auto">
                  <ArrowDownWideNarrow aria-hidden="true" size={16} className="text-cyan-800" />
                  <span className="sr-only">Sort by due date</span>
                  <select
                    className="min-h-9 bg-transparent text-sm text-slate-700 focus:outline-none"
                    aria-label="Sort by due date"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value)}
                  >
                    <option value="earliest">Due date: earliest</option>
                    <option value="latest">Due date: latest</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {studentAssignments.length === 0 ? (
              <EmptyState
                title="No assignments yet"
                description="There are no assignments assigned to your account right now."
              />
            ) : visibleAssignments.length === 0 ? (
              <EmptyState
                title="No matching assignments"
                description="Try changing your search or status filter to find an assignment."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleAssignments.map((assignment, index) => {
                  const status = assignment.status === 'submitted'
                    ? 'Submitted'
                    : assignment.isOverdue
                      ? 'Overdue'
                      : 'Pending'
                  const tone = assignment.status === 'submitted'
                    ? 'success'
                    : assignment.isOverdue
                      ? 'overdue'
                      : 'cyan'

                  return (
                    <AssignmentCard
                      key={assignment.id}
                      className="animate-enter"
                      style={{ animationDelay: `${index * 45}ms` }}
                      title={assignment.title}
                      description={assignment.description}
                      dueDate={`Due ${formatDueDate(assignment.dueDate)}`}
                      status={status}
                      statusTone={tone}
                      isOverdue={assignment.isOverdue}
                      externalLink={assignment.driveLink}
                      onSubmit={
                        assignment.status === 'submitted'
                          ? undefined
                          : () => requestSubmission(assignment.id)
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <ConfirmDialog
        open={Boolean(selectedAssignment)}
        title={confirmationTitle}
        description={submissionError || confirmationDescription}
        confirmLabel={confirmationStep === 2 ? 'Confirm submission' : 'Yes, continue'}
        cancelLabel="Cancel"
        onConfirm={advanceConfirmation}
        onCancel={closeConfirmation}
      />
    </div>
  )
}

export default StudentDashboard
