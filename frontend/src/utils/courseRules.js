export const GENERAL_COURSE_ID = 'course-general'

export const GENERAL_COURSE = {
  id: GENERAL_COURSE_ID,
  name: 'General course',
  code: 'GEN',
  description: 'Existing assignments that have not been placed in another course.',
  creatorId: 'system',
  isDefault: true,
}

export function isValidCourse(course) {
  return Boolean(
    course &&
      typeof course.id === 'string' &&
      typeof course.name === 'string' &&
      typeof course.code === 'string' &&
      typeof course.description === 'string' &&
      typeof course.creatorId === 'string',
  )
}

export function isCourseAvailableToProfessor(courseId, courses, professor) {
  const course = courses.find((item) => item.id === courseId)
  return Boolean(
    course &&
      professor?.role === 'admin' &&
      (course.id === GENERAL_COURSE_ID || course.creatorId === professor.id),
  )
}

function validateCourseDetails(details, courses, currentCourseId = '') {
  const name = typeof details.name === 'string' ? details.name.trim() : ''
  const code = typeof details.code === 'string' ? details.code.trim().toUpperCase() : ''
  const description = typeof details.description === 'string' ? details.description.trim() : ''

  if (!name || !code) {
    return { success: false, error: 'Enter both a course name and course code.' }
  }
  if (!/^[A-Z0-9][A-Z0-9-]{1,11}$/.test(code)) {
    return { success: false, error: 'Use 2–12 letters, numbers, or hyphens for the course code.' }
  }
  const duplicate = courses.find((course) =>
    course.id !== currentCourseId &&
    (course.name.toLowerCase() === name.toLowerCase() ||
      course.code.toLowerCase() === code.toLowerCase()),
  )
  if (duplicate) {
    return { success: false, error: 'A course with this name or code already exists.' }
  }
  return { success: true, details: { name, code, description } }
}

export function createCourseRecord(details, currentUser, courses) {
  if (currentUser?.role !== 'admin') {
    return { success: false, error: 'Only professors can create courses.' }
  }
  const validation = validateCourseDetails(details, courses)
  if (!validation.success) return validation

  return {
    success: true,
    course: {
      ...validation.details,
      id: crypto.randomUUID(),
      creatorId: currentUser.id,
    },
  }
}

export function updateCourseRecord(courseId, details, currentUser, courses) {
  const existing = courses.find((course) => course.id === courseId)
  if (
    currentUser?.role !== 'admin' ||
    !existing ||
    existing.id === GENERAL_COURSE_ID ||
    existing.creatorId !== currentUser.id
  ) {
    return { success: false, error: 'You can only edit courses you created.' }
  }

  const validation = validateCourseDetails(details, courses, courseId)
  if (!validation.success) return validation
  return {
    success: true,
    courses: courses.map((course) =>
      course.id === courseId ? { ...course, ...validation.details } : course,
    ),
  }
}

export function deleteCourseRecord(courseId, currentUser, courses, assignments) {
  const course = courses.find((item) => item.id === courseId)
  if (
    currentUser?.role !== 'admin' ||
    !course ||
    course.id === GENERAL_COURSE_ID ||
    course.creatorId !== currentUser.id
  ) {
    return { success: false, error: 'You can only delete courses you created.' }
  }

  const reassignedCount = assignments.filter((assignment) => assignment.courseId === courseId).length
  return {
    success: true,
    courses: courses.filter((item) => item.id !== courseId),
    assignments: assignments.map((assignment) =>
      assignment.courseId === courseId
        ? { ...assignment, courseId: GENERAL_COURSE_ID }
        : assignment,
    ),
    reassignedCount,
  }
}
