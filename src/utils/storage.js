import { seedAssignments, demoUsers } from '../data/seedData.js'

export const SESSION_KEY = 'student-assignment-board-demo-user'
export const ASSIGNMENTS_STORAGE_KEY = 'student-assignment-board-assignments-v1'
export const SUBMISSION_STORAGE_KEY = 'student-assignment-board-submissions-v1'

const LEGACY_SEEDED_ASSIGNMENT_IDS = {
  'assignment-data-structures': 'react-fundamentals',
  'assignment-database-design': 'javascript-es6-concepts',
  'assignment-os-scheduling': 'database-management',
  'assignment-network-security': 'data-structures-algorithms',
  'assignment-software-engineering': 'web-development-project',
}

function getCanonicalAssignmentId(assignmentId) {
  return LEGACY_SEEDED_ASSIGNMENT_IDS[assignmentId] ?? assignmentId
}

function isValidAssignment(assignment) {
  return Boolean(
    assignment &&
      typeof assignment.id === 'string' &&
      typeof assignment.title === 'string' &&
      typeof assignment.description === 'string' &&
      typeof assignment.dueDate === 'string' &&
      typeof assignment.driveLink === 'string' &&
      typeof assignment.creatorId === 'string' &&
      Array.isArray(assignment.assignedStudentIds) &&
      assignment.assignedStudentIds.every((studentId) =>
        demoUsers.some((user) => user.id === studentId && user.role === 'student'),
      ) &&
      assignment.submissions &&
      typeof assignment.submissions === 'object',
  )
}

function mergeDuplicateAssignments(existing, incoming) {
  const assignedStudentIds = [...new Set([
    ...existing.assignedStudentIds,
    ...incoming.assignedStudentIds,
  ])]
  const submissions = { ...existing.submissions }
  Object.entries(incoming.submissions).forEach(([studentId, status]) => {
    if (status === 'submitted' || submissions[studentId] === undefined) {
      submissions[studentId] = status
    }
  })

  return {
    ...existing,
    ...incoming,
    assignedStudentIds,
    submissions,
  }
}

export function getStoredUser() {
  try {
    const email = window.localStorage.getItem(SESSION_KEY)
    return demoUsers.find((user) => user.email === email) || null
  } catch (error) {
    console.error('Unable to restore the demo session from local storage.', error)
    return null
  }
}

export function saveSession(user) {
  try {
    window.localStorage.setItem(SESSION_KEY, user.email)
    return { success: true }
  } catch (error) {
    console.error('Unable to save the demo session to local storage.', error)
    return {
      success: false,
      error: 'Your session could not be saved in this browser. Check your storage settings and try again.',
    }
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Unable to clear the demo session from local storage.', error)
  }
}

function getStoredAssignments() {
  try {
    const stored = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)
    if (!stored) return { assignments: seedAssignments, deletedIds: [], error: '' }

    const parsed = JSON.parse(stored)
    if (!parsed || !Array.isArray(parsed.assignments) || !Array.isArray(parsed.deletedIds)) {
      throw new TypeError('Stored assignment data has an invalid format.')
    }

    const seedAssignmentsById = new Map(seedAssignments.map((assignment) => [assignment.id, assignment]))
    let didMigrate = false
    const assignmentsById = new Map(seedAssignments.map((assignment) => [assignment.id, assignment]))
    const storedAssignmentsById = new Map()
    const invalidStoredAssignments = []
    parsed.assignments.forEach((assignment) => {
      if (!isValidAssignment(assignment)) {
        invalidStoredAssignments.push(assignment)
        return
      }

      const originalId = assignment.id
      const canonicalId = getCanonicalAssignmentId(originalId)
      const seedAssignment = seedAssignmentsById.get(canonicalId)
      const normalizedAssignment = seedAssignment
        ? {
            ...assignment,
            id: canonicalId,
            title: seedAssignment.title,
            description: seedAssignment.description,
            driveLink: seedAssignment.driveLink,
          }
        : assignment
      const previousStoredAssignment = storedAssignmentsById.get(canonicalId)

      if (
        originalId !== canonicalId ||
        (seedAssignment &&
          (assignment.title !== seedAssignment.title ||
            assignment.description !== seedAssignment.description ||
            assignment.driveLink !== seedAssignment.driveLink)) ||
        previousStoredAssignment
      ) {
        didMigrate = true
      }

      const mergedAssignment = previousStoredAssignment
        ? mergeDuplicateAssignments(previousStoredAssignment, normalizedAssignment)
        : normalizedAssignment
      storedAssignmentsById.set(canonicalId, mergedAssignment)
      assignmentsById.set(canonicalId, mergedAssignment)
    })

    const deletedIds = [...new Set(
      parsed.deletedIds
        .filter((id) => typeof id === 'string')
        .map(getCanonicalAssignmentId),
    )]
    parsed.deletedIds.forEach((id) => {
      if (getCanonicalAssignmentId(id) !== id) didMigrate = true
    })
    deletedIds.forEach((id) => assignmentsById.delete(id))

    if (didMigrate) {
      try {
        window.localStorage.setItem(
          ASSIGNMENTS_STORAGE_KEY,
          JSON.stringify({
            ...parsed,
            assignments: [...storedAssignmentsById.values(), ...invalidStoredAssignments],
            deletedIds,
          }),
        )
      } catch (error) {
        console.error('Unable to migrate seeded assignments in local storage.', error)
      }
    }

    return { assignments: [...assignmentsById.values()], deletedIds, error: '' }
  } catch (error) {
    console.error('Unable to restore assignments from local storage.', error)
    return {
      assignments: seedAssignments,
      deletedIds: [],
      error: 'Saved assignments could not be loaded. Seed data is shown instead.',
    }
  }
}

function getStoredUpdates(assignments) {
  try {
    const stored = window.localStorage.getItem(SUBMISSION_STORAGE_KEY)
    if (!stored) return { updates: {}, error: '' }

    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new TypeError('Stored submission data must be an object.')
    }

    let didMigrate = false
    const migratedUpdates = {}
    Object.entries(parsed).forEach(([storedAssignmentId, studentStatuses]) => {
      const assignmentId = getCanonicalAssignmentId(storedAssignmentId)
      if (assignmentId !== storedAssignmentId) didMigrate = true
      const assignment = assignments.find((item) => item.id === assignmentId)
      if (!assignment || !studentStatuses || typeof studentStatuses !== 'object') return
      const validStatuses = Object.fromEntries(
        Object.entries(studentStatuses).filter(
          ([studentId, status]) =>
            assignment.assignedStudentIds.includes(studentId) && status === 'submitted',
        ),
      )
      if (!Object.keys(validStatuses).length) return

      const existingStatuses = migratedUpdates[assignmentId] ?? {}
      migratedUpdates[assignmentId] = { ...existingStatuses, ...validStatuses }
    })

    if (didMigrate) {
      try {
        window.localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(migratedUpdates))
      } catch (error) {
        console.error('Unable to migrate seeded assignment submissions in local storage.', error)
      }
    }

    return { updates: migratedUpdates, error: '' }
  } catch (error) {
    console.error('Unable to restore assignment submissions from local storage.', error)
    return {
      updates: {},
      error: 'Saved submission updates could not be loaded. Submission progress may be incomplete.',
    }
  }
}

export function getInitialAssignmentState() {
  const { assignments, deletedIds, error: assignmentError } = getStoredAssignments()
  const { updates, error: submissionError } = getStoredUpdates(assignments)
  return {
    assignments,
    deletedIds,
    updates,
    storageError: [assignmentError, submissionError].filter(Boolean).join(' '),
  }
}

export function saveSubmissionUpdates(updates) {
  try {
    window.localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(updates))
    return { success: true }
  } catch (error) {
    console.error('Unable to save the assignment submission to local storage.', error)
    return {
      success: false,
      error: 'Your submission could not be saved. Check your browser storage and try again.',
    }
  }
}

export function persistAssignmentChanges(nextState, shouldSaveUpdates = false) {
  let oldAssignments
  let oldUpdates
  try {
    oldAssignments = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)
    oldUpdates = shouldSaveUpdates
      ? window.localStorage.getItem(SUBMISSION_STORAGE_KEY)
      : null
  } catch (error) {
    console.error('Unable to access assignment storage before saving changes.', error)
    return { success: false, error: 'Browser storage is unavailable. Check your storage settings and try again.' }
  }

  try {
    window.localStorage.setItem(
      ASSIGNMENTS_STORAGE_KEY,
      JSON.stringify({
        assignments: nextState.assignments,
        deletedIds: nextState.deletedIds,
      }),
    )
    if (shouldSaveUpdates) {
      window.localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(nextState.updates))
    }
    return { success: true }
  } catch (error) {
    console.error('Unable to save assignment changes to local storage.', error)
    try {
      if (oldAssignments === null) window.localStorage.removeItem(ASSIGNMENTS_STORAGE_KEY)
      else window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, oldAssignments)
      if (shouldSaveUpdates) {
        if (oldUpdates === null) window.localStorage.removeItem(SUBMISSION_STORAGE_KEY)
        else window.localStorage.setItem(SUBMISSION_STORAGE_KEY, oldUpdates)
      }
    } catch (rollbackError) {
      console.error('Unable to restore assignment storage after a failed save.', rollbackError)
    }
    return { success: false, error: 'Changes could not be saved. Check your browser storage and try again.' }
  }
}
