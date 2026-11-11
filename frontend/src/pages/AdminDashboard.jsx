import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownWideNarrow, ClipboardList, FileCheck2, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import AssignmentCard from '../components/AssignmentCard.jsx'
import AssignmentModal from '../components/AssignmentModal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Navbar from '../components/Navbar.jsx'
import SearchBar from '../components/SearchBar.jsx'
import StatCard from '../components/StatCard.jsx'
import { demoUsers } from '../data/seedData.js'
import {
  getAdminAssignmentProgress,
  getAssignmentsForAdmin,
  matchesAdminAssignmentFilter,
} from '../utils/assignmentRules.js'

const students = demoUsers.filter((user) => user.role === 'student')
const filters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

function getToday() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function createEmptyForm() {
  return {
    title: '',
    description: '',
    dueDate: '',
    driveLink: '',
    assignedStudentIds: [],
  }
}

function formatDueDate(dateString) {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00Z`))
}

function AdminDashboard({ theme, onToggleTheme }) {
  const { currentUser, logout, assignments, updates, storageError, createAssignment, updateAssignment, deleteAssignment } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('earliest')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [form, setForm] = useState(createEmptyForm)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [notice, setNotice] = useState('')
  const today = getToday()

  const adminAssignments = useMemo(
    () =>
      getAssignmentsForAdmin(assignments, currentUser)
        .map((assignment) => ({
          ...assignment,
          ...getAdminAssignmentProgress(assignment, updates, today),
        })),
    [assignments, currentUser, today, updates],
  )

  const assignedStudentCount = new Set(
    adminAssignments.flatMap((assignment) => assignment.assignedStudentIds),
  ).size
  const submittedCount = adminAssignments.reduce((total, assignment) => total + assignment.submittedCount, 0)
  const assignedCount = adminAssignments.reduce((total, assignment) => total + assignment.totalStudents, 0)
  const pendingCount = adminAssignments.reduce(
    (total, assignment) => total + assignment.pendingSubmissionCount,
    0,
  )
  const overallCompletion = assignedCount ? Math.round((submittedCount / assignedCount) * 100) : 0

  const visibleAssignments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return adminAssignments
      .filter((assignment) =>
        `${assignment.title} ${assignment.description}`.toLowerCase().includes(query),
      )
      .filter((assignment) => matchesAdminAssignmentFilter(assignment, filter))
      .sort((first, second) =>
        sortOrder === 'earliest'
          ? first.dueDate.localeCompare(second.dueDate)
          : second.dueDate.localeCompare(first.dueDate),
      )
  }, [adminAssignments, filter, search, sortOrder])

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  function handleSwitchAccount() {
    logout()
    navigate('/', { replace: true })
  }

  function openCreateForm() {
    setEditingAssignment(null)
    setForm(createEmptyForm())
    setFormError('')
    setNotice('')
    setIsFormOpen(true)
  }

  function openEditForm(assignment) {
    setEditingAssignment(assignment)
    setForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      driveLink: assignment.driveLink,
      assignedStudentIds: [...assignment.assignedStudentIds],
    })
    setFormError('')
    setNotice('')
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingAssignment(null)
    setFormError('')
  }

  function toggleAllStudents(checked) {
    setForm((current) => ({
      ...current,
      assignedStudentIds: checked ? students.map((student) => student.id) : [],
    }))
  }

  function toggleStudent(studentId, checked) {
    setForm((current) => ({
      ...current,
      assignedStudentIds: checked
        ? [...new Set([...current.assignedStudentIds, studentId])]
        : current.assignedStudentIds.filter((id) => id !== studentId),
    }))
  }

  function validateForm() {
    if (!form.title.trim() || !form.description.trim() || !form.dueDate || !form.driveLink.trim()) {
      return 'Complete all required fields.'
    }
    if (form.assignedStudentIds.length === 0) {
      return 'Select at least one student.'
    }
    if (form.dueDate < today) {
      return 'Choose a due date that is today or later.'
    }
    try {
      const url = new URL(form.driveLink.trim())
      if (
        url.protocol !== 'https:' ||
        !['drive.google.com', 'docs.google.com'].includes(url.hostname)
      ) {
        return 'Enter a valid HTTPS Google Drive or Google Docs URL.'
      }
    } catch {
      return 'Enter a valid HTTPS Google Drive or Google Docs URL.'
    }
    return ''
  }

  function handleSave(event) {
    event.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    const details = {
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate,
      driveLink: form.driveLink.trim(),
      assignedStudentIds: form.assignedStudentIds,
    }
    const result = editingAssignment
      ? updateAssignment(editingAssignment.id, details)
      : createAssignment(details)

    if (!result.success) {
      setFormError(result.error)
      return
    }

    setNotice(editingAssignment ? 'Assignment updated.' : 'Assignment created.')
    closeForm()
  }

  function confirmDelete() {
    const result = deleteAssignment(deleteTarget.id)
    if (!result.success) {
      setDeleteError(result.error)
      return
    }
    setDeleteTarget(null)
    setDeleteError('')
    setNotice('Assignment deleted.')
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <Navbar
        userName={currentUser.name}
        userRole="Admin"
        role="admin"
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
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="animate-enter">
            <p className="text-sm font-semibold text-cyan-800">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Welcome, {currentUser.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Create assignments, manage student access, and follow class progress.
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-800 sm:self-auto"
            type="button"
            onClick={openCreateForm}
          >
            <Plus aria-hidden="true" size={18} />
            Create assignment
          </button>
        </section>

        {notice && (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
            {notice}
          </p>
        )}

        <section className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin statistics">
          <StatCard icon={<ClipboardList />} label="Assignments created" value={adminAssignments.length} />
          <StatCard icon={<Users />} label="Students assigned" value={assignedStudentCount} detail="Unique students" />
          <StatCard icon={<FileCheck2 />} label="Submitted" value={submittedCount} detail={`of ${assignedCount} assigned submissions`} />
          <StatCard icon={<ArrowDownWideNarrow />} label="Pending" value={pendingCount} detail={`${overallCompletion}% class completion`} />
        </section>

        <section className="glass-surface mt-5 rounded-2xl p-5 sm:p-6" aria-label="Overall class progress">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Overall submission progress</h2>
              <p className="mt-1 text-sm text-slate-600">{submittedCount}/{assignedCount} assigned submissions received</p>
            </div>
            <span className="text-2xl font-semibold tabular-nums text-cyan-800">{overallCompletion}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-sky-100"
            role="progressbar"
            aria-label="Overall class submission progress"
            aria-valuemin={0}
            aria-valuemax={assignedCount || 1}
            aria-valuenow={submittedCount}
            aria-valuetext={`${overallCompletion}% complete`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-[width] duration-500 ease-out"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
        </section>

        <section className="mt-9" aria-labelledby="manage-assignments-heading">
          <div>
            <h2 className="text-xl font-semibold text-slate-900" id="manage-assignments-heading">
              Assignment management
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage your assignments and view progress for their assigned students.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchBar
              className="w-full lg:max-w-sm"
              value={search}
              onChange={setSearch}
              label="Search assignments by title or description"
              placeholder="Search your assignments"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <FilterBar
                options={filters}
                value={filter}
                onChange={setFilter}
                label="Filter assignments by completion"
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

          <div className="mt-5 space-y-5">
            {adminAssignments.length === 0 ? (
              <EmptyState
                title="No assignments created yet"
                description="Create an assignment to share work with your students and track submissions."
                action={
                  <button
                    className="min-h-11 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-800"
                    type="button"
                    onClick={openCreateForm}
                  >
                    Create your first assignment
                  </button>
                }
              />
            ) : visibleAssignments.length === 0 ? (
              <EmptyState
                title="No matching assignments"
                description="Try a different title or completion filter."
              />
            ) : (
              visibleAssignments.map((assignment) => {
                const status = assignment.isOverdue
                  ? 'Overdue'
                  : assignment.completionState === 'unassigned'
                    ? 'No students assigned'
                  : assignment.completionState === 'completed'
                    ? 'Complete'
                    : assignment.completionState === 'in-progress'
                      ? 'In progress'
                      : 'Pending'
                const tone = assignment.isOverdue
                  ? 'overdue'
                  : assignment.completionState === 'unassigned'
                    ? 'neutral'
                  : assignment.completionState === 'completed'
                    ? 'success'
                    : assignment.completionState === 'in-progress'
                      ? 'cyan'
                      : 'neutral'

                return (
                  <article className="glass-surface rounded-2xl p-4 sm:p-5" key={assignment.id}>
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <AssignmentCard
                          title={assignment.title}
                          description={assignment.description}
                          dueDate={`Due ${formatDueDate(assignment.dueDate)}`}
                          status={status}
                          statusTone={tone}
                          isOverdue={assignment.isOverdue}
                          externalLink={assignment.driveLink}
                          progress={{
                            label: `${assignment.submittedCount}/${assignment.totalStudents} submitted`,
                            value: assignment.submittedCount,
                            max: assignment.totalStudents,
                          }}
                          className="border-0 bg-transparent p-0 shadow-none backdrop-blur-none hover:border-0 hover:shadow-none"
                        />
                      </div>
                      <div className="flex shrink-0 gap-2 xl:pt-1">
                        <button
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white/75 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-cyan-50 hover:text-cyan-900 sm:flex-none"
                          type="button"
                          onClick={() => openEditForm(assignment)}
                          aria-label={`Edit ${assignment.title}`}
                        >
                          <Pencil aria-hidden="true" size={16} />
                          Edit
                        </button>
                        <button
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white/75 px-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 sm:flex-none"
                          type="button"
                          onClick={() => {
                            setDeleteTarget(assignment)
                            setDeleteError('')
                          }}
                          aria-label={`Delete ${assignment.title}`}
                        >
                          <Trash2 aria-hidden="true" size={16} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <section className="mt-5 border-t border-sky-100/80 pt-4" aria-label={`Student tracking for ${assignment.title}`}>
                      <h3 className="mb-3 text-sm font-semibold text-slate-800">
                        Student submissions <span className="font-normal text-slate-500">({assignment.totalStudents} assigned)</span>
                      </h3>
                      <div className="hidden lg:block">
                        <table className="w-full table-fixed text-left text-sm">
                          <thead>
                            <tr className="border-b border-sky-100 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                              <th className="w-[30%] pb-2 pr-3">Student</th>
                              <th className="w-[40%] pb-2 pr-3">Email</th>
                              <th className="w-[30%] pb-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sky-100/70">
                            {assignment.assignedStudentIds.map((studentId) => {
                              const student = students.find((user) => user.id === studentId)
                              const submitted =
                                (updates[assignment.id]?.[studentId] ?? assignment.submissions[studentId]) === 'submitted'
                              return (
                                <tr key={studentId}>
                                  <td className="py-2.5 pr-3 font-medium text-slate-800">{student?.name}</td>
                                  <td className="break-all py-2.5 pr-3 text-slate-600">{student?.email}</td>
                                  <td className="py-2.5">
                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${submitted ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                      {submitted ? 'Submitted' : 'Pending'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:hidden">
                        {assignment.assignedStudentIds.map((studentId) => {
                          const student = students.find((user) => user.id === studentId)
                          const submitted =
                            (updates[assignment.id]?.[studentId] ?? assignment.submissions[studentId]) === 'submitted'
                          return (
                            <li className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-white/55 px-3 py-2.5" key={studentId}>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-slate-800">{student?.name}</span>
                                <span className="block break-all text-xs text-slate-500">{student?.email}</span>
                              </span>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${submitted ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                                {submitted ? 'Submitted' : 'Pending'}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </main>

      <AssignmentModal
        open={isFormOpen}
        title={editingAssignment ? 'Edit assignment' : 'Create assignment'}
        description="Add assignment details and choose which students can access it."
        onClose={closeForm}
        actions={
          <>
            <button
              className="min-h-11 rounded-xl border border-sky-100 bg-white/80 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50"
              type="button"
              onClick={closeForm}
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-800"
              type="submit"
              form="assignment-form"
            >
              {editingAssignment ? 'Save changes' : 'Create assignment'}
            </button>
          </>
        }
      >
        <form className="space-y-4" id="assignment-form" onSubmit={handleSave} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="assignment-title">
              Assignment title <span aria-hidden="true">*</span>
            </label>
            <input
              className="min-h-11 w-full rounded-xl border border-sky-100 bg-white/80 px-3.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
              id="assignment-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="assignment-description">
              Description <span aria-hidden="true">*</span>
            </label>
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-sky-100 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
              id="assignment-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="assignment-due-date">
                Due date <span aria-hidden="true">*</span>
              </label>
              <input
                className="min-h-11 w-full rounded-xl border border-sky-100 bg-white/80 px-3.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                id="assignment-due-date"
                type="date"
                min={today}
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="assignment-drive-link">
                Google Drive link <span aria-hidden="true">*</span>
              </label>
              <input
                className="min-h-11 w-full rounded-xl border border-sky-100 bg-white/80 px-3.5 text-sm text-slate-900 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100"
                id="assignment-drive-link"
                type="url"
                inputMode="url"
                placeholder="https://drive.google.com/..."
                value={form.driveLink}
                onChange={(event) => setForm((current) => ({ ...current, driveLink: event.target.value }))}
                required
              />
            </div>
          </div>
          <fieldset className="rounded-xl border border-sky-100 p-3.5">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Assign students <span aria-hidden="true">*</span>
            </legend>
            <label className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium text-slate-800 hover:bg-cyan-50">
              <input
                className="size-4 accent-cyan-700"
                type="checkbox"
                checked={form.assignedStudentIds.length === students.length}
                onChange={(event) => toggleAllStudents(event.target.checked)}
              />
              Assign to all five students
            </label>
            <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {students.map((student) => (
                <label className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-2 text-sm text-slate-700 hover:bg-cyan-50" key={student.id}>
                  <input
                    className="size-4 shrink-0 accent-cyan-700"
                    type="checkbox"
                    checked={form.assignedStudentIds.includes(student.id)}
                    onChange={(event) => toggleStudent(student.id, event.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800">{student.name}</span>
                    <span className="block break-all text-xs text-slate-500">{student.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {formError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800" role="alert">
              {formError}
            </p>
          )}
        </form>
      </AssignmentModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete assignment?"
        description={
          deleteError ||
          (deleteTarget
            ? `Delete “${deleteTarget.title}”? This also removes it from the assigned students’ lists and cannot be undone.`
            : '')
        }
        confirmLabel="Delete assignment"
        cancelLabel="Keep assignment"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError('')
        }}
      />
    </div>
  )
}

export default AdminDashboard
