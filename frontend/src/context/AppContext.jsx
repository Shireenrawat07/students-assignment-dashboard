import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  createAssignmentRecord,
  deleteAssignmentRecord,
  createRegisteredAccount,
  createSubmissionUpdate,
  authenticateUser,
  updateAssignmentRecord,
} from '../utils/assignmentRules.js'
import {
  GENERAL_COURSE,
  GENERAL_COURSE_ID,
  isValidCourse,
  createCourseRecord,
  deleteCourseRecord,
  updateCourseRecord,
} from '../utils/courseRules.js'
import { seedAssignments } from '../data/seedData.js'
import {
  clearSession,
  getAllUsers,
  getInitialAssignmentState,
  getStoredUser,
  persistAssignmentChanges,
  persistCourseAndAssignmentChanges,
  persistCourses,
  saveSession,
  saveRegisteredUser,
  saveSubmissionUpdates,
} from '../utils/storage.js'

const AppContext = createContext(null)

function getSafeInitialState() {
  const initial = getInitialAssignmentState()
  const savedCourses = Array.isArray(initial.courses)
    ? initial.courses.filter(isValidCourse)
    : []
  const courses = [
    GENERAL_COURSE,
    ...savedCourses.filter((course) => course.id !== GENERAL_COURSE_ID),
  ]
  const courseIds = new Set(courses.map((course) => course.id))
  const sourceAssignments = Array.isArray(initial.assignments)
    ? initial.assignments
    : seedAssignments
  const assignments = sourceAssignments
    .filter((assignment) => assignment && typeof assignment === 'object')
    .map((assignment) => ({
      ...assignment,
      courseId: courseIds.has(assignment.courseId) ? assignment.courseId : GENERAL_COURSE_ID,
    }))

  return {
    ...initial,
    courses,
    assignments,
    deletedIds: Array.isArray(initial.deletedIds) ? initial.deletedIds : [],
    updates: initial.updates && typeof initial.updates === 'object' ? initial.updates : {},
    storageError: typeof initial.storageError === 'string' ? initial.storageError : '',
  }
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getStoredUser)
  const [users, setUsers] = useState(getAllUsers)
  const [state, setState] = useState(getSafeInitialState)

  const login = useCallback((email, password) => {
    const user = authenticateUser(email, password, getAllUsers())
    if (!user) {
      return { success: false, error: 'The email or password is incorrect. Check the demo accounts and try again.' }
    }

    const result = saveSession(user)
    if (!result.success) return result

    setCurrentUser(user)
    return { success: true, user }
  }, [])

  const register = useCallback((details) => {
    const creation = createRegisteredAccount(details, getAllUsers())
    if (!creation.success) return creation

    const result = saveRegisteredUser(creation.user)
    if (!result.success) return result
    setUsers(getAllUsers())
    return { success: true, user: creation.user }
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
    const creation = createAssignmentRecord(details, currentUser, state.courses, users)
    if (!creation.success) return creation

    const nextState = {
      ...state,
      assignments: [...state.assignments, creation.assignment],
      deletedIds: state.deletedIds.filter((id) => id !== creation.assignment.id),
    }
    const result = persistAssignmentChanges(nextState)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state, users])

  const updateAssignment = useCallback((assignmentId, details) => {
    const update = updateAssignmentRecord(
      state.assignments,
      state.updates,
      assignmentId,
      details,
      currentUser,
      state.courses,
      users,
    )
    if (!update.success) return update
    const nextState = { ...state, assignments: update.assignments, updates: update.updates }
    const result = persistAssignmentChanges(nextState, true)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state, users])

  const deleteAssignment = useCallback((assignmentId) => {
    const deletion = deleteAssignmentRecord(
      state.assignments,
      state.updates,
      state.deletedIds,
      assignmentId,
      currentUser,
    )
    if (!deletion.success) return deletion
    const nextState = {
      ...state,
      assignments: deletion.assignments,
      deletedIds: deletion.deletedIds,
      updates: deletion.updates,
    }
    const result = persistAssignmentChanges(nextState, true)
    if (result.success) setState(nextState)
    return result
  }, [currentUser, state])

  const createCourse = useCallback((details) => {
    const creation = createCourseRecord(details, currentUser, state.courses)
    if (!creation.success) return creation

    const courses = [...state.courses, creation.course]
    const result = persistCourses(courses)
    if (result.success) setState((current) => ({ ...current, courses }))
    return result.success ? { ...result, course: creation.course } : result
  }, [currentUser, state.courses])

  const updateCourse = useCallback((courseId, details) => {
    const update = updateCourseRecord(courseId, details, currentUser, state.courses)
    if (!update.success) return update

    const result = persistCourses(update.courses)
    if (result.success) setState((current) => ({ ...current, courses: update.courses }))
    return result
  }, [currentUser, state.courses])

  const deleteCourse = useCallback((courseId) => {
    const deletion = deleteCourseRecord(courseId, currentUser, state.courses, state.assignments)
    if (!deletion.success) return deletion

    const nextState = { ...state, courses: deletion.courses, assignments: deletion.assignments }
    const result = persistCourseAndAssignmentChanges(deletion.courses, nextState)
    if (result.success) setState(nextState)
    return result.success ? { ...result, reassignedCount: deletion.reassignedCount } : result
  }, [currentUser, state])

  const value = useMemo(
    () => ({
      currentUser,
      users,
      isAuthenticated: Boolean(currentUser),
      login,
      register,
      logout,
      courses: state.courses,
      assignments: state.assignments,
      updates: state.updates,
      storageError: state.storageError,
      markSubmitted,
      createAssignment,
      updateAssignment,
      deleteAssignment,
      createCourse,
      updateCourse,
      deleteCourse,
    }),
    [currentUser, users, state, login, register, logout, markSubmitted, createAssignment, updateAssignment, deleteAssignment, createCourse, updateCourse, deleteCourse],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within an AppProvider.')
  return context
}
