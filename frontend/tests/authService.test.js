import test from 'node:test'
import assert from 'node:assert/strict'
import {
  authenticateDemoUser,
  authenticateUser,
  canAccessRole,
  createRegisteredAccount,
} from '../src/utils/assignmentRules.js'
import { demoUsers } from '../src/data/seedData.js'
import {
  getAllUsers,
  getStoredUser,
  REGISTERED_USERS_KEY,
  saveRegisteredUser,
  saveSession,
  SESSION_KEY,
} from '../src/utils/storage.js'

test('demo account list contains two admins and five students', () => {
  assert.equal(demoUsers.filter((user) => user.role === 'admin').length, 2)
  assert.equal(demoUsers.filter((user) => user.role === 'student').length, 5)
})

test('login accepts a matching demo account and rejects incorrect credentials', () => {
  assert.equal(authenticateDemoUser(' SHARMA@COLLEGE.COM ', 'Sharma@123').id, 'admin-sharma')
  assert.equal(authenticateDemoUser('sharma@college.com', 'wrong-password'), null)
  assert.equal(authenticateDemoUser('unknown@college.com', 'Sharma@123'), null)
})

test('role access is limited to the matching dashboard', () => {
  const admin = demoUsers.find((user) => user.role === 'admin')
  const student = demoUsers.find((user) => user.role === 'student')

  assert.equal(canAccessRole(admin, 'admin'), true)
  assert.equal(canAccessRole(admin, 'student'), false)
  assert.equal(canAccessRole(student, 'student'), true)
  assert.equal(canAccessRole(student, 'admin'), false)
  assert.equal(canAccessRole(null, 'student'), false)
})

test('students and professors can register with normalized names and email addresses', () => {
  for (const role of ['student', 'admin']) {
    const result = createRegisteredAccount({
      name: '  New User  ',
      email: `  new-${role}@college.com  `,
      password: 'secure-pass-1',
      role,
    })

    assert.equal(result.success, true)
    assert.equal(result.user.name, 'New User')
    assert.equal(result.user.email, `new-${role}@college.com`)
    assert.equal(result.user.role, role)
    assert.equal(authenticateUser(result.user.email, 'secure-pass-1', [result.user]).id, result.user.id)
  }
})

test('registration rejects duplicate emails, invalid addresses, short passwords, and unsupported roles', () => {
  assert.equal(
    createRegisteredAccount({
      name: 'Duplicate',
      email: ' SHARMA@COLLEGE.COM ',
      password: 'secure-pass-1',
      role: 'student',
    }).success,
    false,
  )
  assert.equal(
    createRegisteredAccount({
      name: 'Invalid email',
      email: 'not-an-email',
      password: 'secure-pass-1',
      role: 'student',
    }).success,
    false,
  )
  assert.equal(
    createRegisteredAccount({
      name: 'Short password',
      email: 'short@college.com',
      password: 'short',
      role: 'student',
    }).success,
    false,
  )
  assert.equal(
    createRegisteredAccount({
      name: 'Invalid role',
      email: 'role@college.com',
      password: 'secure-pass-1',
      role: 'owner',
    }).success,
    false,
  )
})

test('registered accounts persist locally and can restore a signed-in session without changing seed accounts', () => {
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
    const creation = createRegisteredAccount({
      name: 'New Student',
      email: 'new-student@college.com',
      password: 'secure-pass-1',
      role: 'student',
    })
    assert.equal(creation.success, true)
    assert.equal(saveRegisteredUser(creation.user).success, true)
    assert.equal(saveSession(creation.user).success, true)
    assert.equal(getAllUsers().some((user) => user.id === creation.user.id), true)
    assert.equal(getStoredUser().id, creation.user.id)
    assert.equal(JSON.parse(values.get(REGISTERED_USERS_KEY)).length, 1)
    assert.equal(values.get(SESSION_KEY), creation.user.email)
    assert.equal(demoUsers.length, 7)
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
})
