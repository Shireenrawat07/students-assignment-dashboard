import test from 'node:test'
import assert from 'node:assert/strict'
import { seedAssignments } from '../src/data/seedData.js'
import {
  createCourseRecord,
  deleteCourseRecord,
  GENERAL_COURSE,
} from '../src/utils/courseRules.js'
import {
  ASSIGNMENTS_STORAGE_KEY,
  COURSES_STORAGE_KEY,
  SUBMISSION_STORAGE_KEY,
  getInitialAssignmentState,
  persistCourseAndAssignmentChanges,
  persistCourses,
} from '../src/utils/storage.js'

const professor = { id: 'admin-sharma', role: 'admin' }

function withMemoryStorage(run) {
  const originalWindow = globalThis.window
  const values = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  }
  try {
    run(values)
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

test('legacy seed assignments load under General without mutating seed data', () => {
  withMemoryStorage(() => {
    const state = getInitialAssignmentState()
    assert.equal(state.courses[0].id, GENERAL_COURSE.id)
    assert.equal(state.courses.length, 1)
    assert.equal(state.assignments.length, seedAssignments.length)
    assert.ok(state.assignments.every((assignment) => assignment.courseId === GENERAL_COURSE.id))
    assert.ok(seedAssignments.every((assignment) => !Object.hasOwn(assignment, 'courseId')))
  })
})

test('course removal persists a safe reassignment and keeps existing assignment records', () => {
  withMemoryStorage((values) => {
    values.set(SUBMISSION_STORAGE_KEY, JSON.stringify({
      [seedAssignments[0].id]: { 'student-aarav': 'submitted' },
    }))
    const initial = getInitialAssignmentState()
    const created = createCourseRecord(
      { name: 'Data Science', code: 'DS-210', description: 'Analysis and modeling.' },
      professor,
      initial.courses,
    )
    const courses = [...initial.courses, created.course]
    assert.equal(persistCourses(courses).success, true)

    const assignments = initial.assignments.map((assignment, index) =>
      index === 0 ? { ...assignment, courseId: created.course.id } : assignment,
    )
    const assignedState = { ...initial, assignments }
    assert.equal(persistCourseAndAssignmentChanges(courses, assignedState).success, true)

    const deletion = deleteCourseRecord(created.course.id, professor, courses, assignments)
    assert.equal(deletion.success, true)
    assert.equal(
      persistCourseAndAssignmentChanges(deletion.courses, {
        ...assignedState,
        courses: deletion.courses,
        assignments: deletion.assignments,
      }).success,
      true,
    )

    const restored = getInitialAssignmentState()
    assert.equal(restored.courses.some((course) => course.id === created.course.id), false)
    assert.equal(restored.assignments.length, seedAssignments.length)
    assert.equal(restored.assignments[0].courseId, GENERAL_COURSE.id)
    assert.deepEqual(restored.assignments[0].submissions, seedAssignments[0].submissions)
    assert.deepEqual(restored.updates[seedAssignments[0].id], { 'student-aarav': 'submitted' })
    assert.equal(JSON.parse(values.get(ASSIGNMENTS_STORAGE_KEY)).assignments.length, seedAssignments.length)
    assert.equal(JSON.parse(values.get(COURSES_STORAGE_KEY)).some((course) => course.id === created.course.id), false)
  })
})

test('invalid course references and duplicate stored courses fall back safely', () => {
  withMemoryStorage((values) => {
    values.set(COURSES_STORAGE_KEY, JSON.stringify([
      { id: 'course-one', name: 'Networks', code: 'NET-201', description: '', creatorId: professor.id },
      { id: 'course-duplicate', name: 'networks', code: 'NET-202', description: '', creatorId: professor.id },
      { id: 'course-invalid', name: 42, code: 'BAD', description: '', creatorId: professor.id },
    ]))
    values.set(ASSIGNMENTS_STORAGE_KEY, JSON.stringify({
      assignments: [{ ...seedAssignments[0], courseId: 'course-duplicate' }],
      deletedIds: [],
    }))

    const state = getInitialAssignmentState()
    assert.equal(state.courses.filter((course) => course.name.toLowerCase() === 'networks').length, 1)
    assert.equal(state.assignments[0].courseId, GENERAL_COURSE.id)
    assert.equal(JSON.parse(values.get(ASSIGNMENTS_STORAGE_KEY)).assignments[0].courseId, GENERAL_COURSE.id)
  })
})
