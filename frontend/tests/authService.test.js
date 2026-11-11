import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticateDemoUser, canAccessRole } from '../src/utils/assignmentRules.js'
import { demoUsers } from '../src/data/seedData.js'

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
