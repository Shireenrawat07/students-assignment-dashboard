import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { demoUsers } from '../data/seedData.js'
import {
  canManageAssignment,
  createAssignmentRecord,
  createSubmissionUpdate,
  authenticateDemoUser,
} from '../utils/assignmentRules.js'
import {
  clearSession,
  getInitialAssignmentState,
  getStoredUser,
  persistAssignmentChanges,
  saveSession,
  saveSubmissionUpdates,
} from '../utils/storage.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser)
  const [state, setState] = useState(getInitialAssignmentState)

  const login = useCallback((email, password) => {
    const user = authenticateDemoUser(email, password)
    if (!user) {
      return { success: false, error: 'The email or password is incorrect. Check the demo accounts and try again.' }
    }

    const result = saveSession(user)
    if (!result.success) return result

    setCurrentUser(user)
    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setCurrentUser(null)
  }, [])

  const markSubmitted = useCallback((assignmentId, studentId) => {
    const assignment = state.assignments.find((item) => item.id === assignmentId)
    const submission = createSubmissionUpdate(assignment, state.updates, studentId, currentUser)
    if (!submission.success) return submission

    const result = saveSubmissionUpdates(submission.updates)
    if (!result.success) return result

    setState({ ...state, updates: submission.updates })
    return { success: true }
  }, [currentUser, state])

  const createAssignment = useCallback((details) => {
    const creation = createAssignmentRecord(details, currentUser)
    if (!creation.success) return creation

    const nextState = {
      ...state,
      assignments: [...state.assignments, creation.assignment],
      deletedIds: state.deletedIds.filter((id) => id !== creation.assignment.id),
    }
    const result = persistAssignmentChanges(nextState)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state])

  const updateAssignment = useCallback((assignmentId, details) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only admins can edit assignments.' }
    }
    const existing = state.assignments.find((assignment) => assignment.id === assignmentId)
    if (!canManageAssignment(existing, currentUser)) {
      return { success: false, error: 'You can only edit assignments you created.' }
    }

    const studentIds = [...new Set(details.assignedStudentIds)]
    if (!studentIds.length) return { success: false, error: 'Select at least one student.' }
    if (studentIds.some((id) => !demoUsers.some((user) => user.id === id && user.role === 'student'))) {
      return { success: false, error: 'The student selection is invalid.' }
    }

    const submissions = Object.fromEntries(
      studentIds.map((studentId) => [
        studentId,
        existing.assignedStudentIds.includes(studentId)
          ? state.updates[assignmentId]?.[studentId] ?? existing.submissions[studentId] ?? 'pending'
          : 'pending',
      ]),
    )
    const updated = { ...existing, ...details, assignedStudentIds: studentIds, submissions }
    const nextState = {
      ...state,
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId ? updated : assignment,
      ),
      updates: { ...state.updates },
    }
    delete nextState.updates[assignmentId]
    const result = persistAssignmentChanges(nextState, true)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state])

  const deleteAssignment = useCallback((assignmentId) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only admins can delete assignments.' }
    }
    const existing = state.assignments.find((assignment) => assignment.id === assignmentId)
    if (!canManageAssignment(existing, currentUser)) {
      return { success: false, error: 'You can only delete assignments you created.' }
    }

    const nextState = {
      ...state,
      assignments: state.assignments.filter((assignment) => assignment.id !== assignmentId),
      deletedIds: [...new Set([...state.deletedIds, assignmentId])],
      updates: { ...state.updates },
    }
    delete nextState.updates[assignmentId]
    const result = persistAssignmentChanges(nextState, true)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state])

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      login,
      logout,
      assignments: state.assignments,
      updates: state.updates,
      storageError: state.storageError,
      markSubmitted,
      createAssignment,
      updateAssignment,
      deleteAssignment,
    }),
    [currentUser, state, login, logout, markSubmitted, createAssignment, updateAssignment, deleteAssignment],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within an AppProvider.')
  return context
}
