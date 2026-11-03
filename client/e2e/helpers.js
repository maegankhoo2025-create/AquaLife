import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, test as base } from '@playwright/test'

// The client has no database driver, so borrow the server's copies, as date-rollover.spec.js does.
const serverRequire = createRequire(new URL('../../server/package.json', import.meta.url))
const mongoose = serverRequire('mongoose')
const dotenv = serverRequire('dotenv')

const SERVER_ENV = new URL('../../server/.env', import.meta.url)
// Same address shape signUpFreshUser generates. A renamed profile email still matches.
const FRESH_TEST_EMAIL = /^e2e-[0-9a-f-]{36}@example\.com$/

function mongoUri() {
  const { MONGODB_URI } = dotenv.parse(readFileSync(SERVER_ENV))
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from server/.env, so the test account cannot be deleted.')
  }
  return MONGODB_URI
}

// Removes one test's accounts and the rows that point at them.
// Refuses any user whose email is not an address this suite created.
async function deleteTestAccounts(connection, accounts) {
  const emails = [...new Set(accounts.map((account) => account.email).filter((email) => FRESH_TEST_EMAIL.test(email)))]
  const objectIds = [...new Set(accounts.map((account) => account.id).filter((id) => /^[0-9a-f]{24}$/i.test(id)))]
    .map((id) => new mongoose.Types.ObjectId(id))
  if (!emails.length && !objectIds.length) return

  const clauses = []
  if (emails.length) clauses.push({ email: { $in: emails } })
  if (objectIds.length) clauses.push({ _id: { $in: objectIds } })

  const users = connection.collection('users')
  const matches = await users.find(
    { $or: clauses },
    { projection: { email: 1 } },
  ).toArray()

  const refused = matches.filter((user) => !FRESH_TEST_EMAIL.test(user.email))
  if (refused.length) {
    throw new Error('Refusing to delete a user whose email is not an e2e test address.')
  }

  const safeIds = matches.map((user) => user._id)
  if (!safeIds.length) return

  const idStrings = safeIds.map((id) => id.toString())
  await connection.collection('tanks').deleteMany({ owner: { $in: safeIds } })
  await connection.collection('transactions').deleteMany({ user: { $in: safeIds } })
  await connection.collection('friendships').deleteMany({ members: { $in: safeIds } })
  await connection.collection('socialmessages').deleteMany({
    $or: [{ sender: { $in: safeIds } }, { recipient: { $in: safeIds } }],
  })
  await connection.collection('sessions').deleteMany({
    $or: idStrings.flatMap((id) => [
      { 'session.userId': id },
      { session: new RegExp(`"userId":"${id}"`) },
    ]),
  })
  await users.deleteMany({ _id: { $in: safeIds } })
}

function rememberAccount(account) {
  const accounts = base.info().e2eAccounts
  if (!Array.isArray(accounts)) {
    throw new Error('Import { test } from ./helpers.js so test accounts are deleted afterwards.')
  }
  accounts.push(account)
}

// Specs must import this test. The auto fixture then deletes the accounts that test created.
export const test = base.extend({
  e2eMongo: [async ({}, use) => {
    const connection = await mongoose.createConnection(mongoUri()).asPromise()
    try {
      await use(connection)
    } finally {
      await connection.close()
    }
  }, { scope: 'worker' }],

  e2eAccountCleanup: [async ({ e2eMongo }, use, testInfo) => {
    testInfo.e2eAccounts = []
    try {
      await use()
    } finally {
      await deleteTestAccounts(e2eMongo, testInfo.e2eAccounts)
    }
  }, { auto: true }],
})

function isSignupFor(response, email) {
  if (response.request().method() !== 'POST') return false
  if (new URL(response.url()).pathname !== '/auth/signup') return false
  try {
    return response.request().postDataJSON()?.email === email
  } catch {
    return false
  }
}

export async function signUpFreshUser(page) {
  const user = {
    name: 'E2E Tester',
    email: `e2e-${randomUUID()}@example.com`,
    password: 'AquaLifeTest123!',
  }

  // Record the address before signup, so a failed test still removes the account.
  rememberAccount({ email: user.email })

  await page.goto('/login')

  await page.getByRole('button', {
    name: "Don't have an account? Sign up",
    exact: true,
  }).click()

  await page.getByRole('textbox', {
    name: 'Name',
    exact: true,
  }).fill(user.name)

  await page.getByRole('textbox', {
    name: 'Email address',
    exact: true,
  }).fill(user.email)

  await page.getByRole('textbox', {
    name: 'Password',
    exact: true,
  }).fill(user.password)

  const signupResponse = page.waitForResponse((response) => isSignupFor(response, user.email))

  await page.getByRole('button', {
    name: 'Create account',
    exact: true,
  }).click()

  const payload = await (await signupResponse).json()
  const id = payload?.user?.id
  if (typeof id !== 'string' || !/^[0-9a-f]{24}$/i.test(id)) {
    throw new Error('Sign-up did not return a test user id, so the account cannot be deleted afterwards.')
  }
  // The id still matches after a profile test changes the email.
  rememberAccount({ id })

  await expect(page).toHaveURL(/\/dashboard\/?$/)

  return user
}
