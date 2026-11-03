import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

// The client has no database driver, so borrow the server's copies, as helpers.js does.
const serverRequire = createRequire(new URL('../../server/package.json', import.meta.url))
const mongoose = serverRequire('mongoose')
const dotenv = serverRequire('dotenv')

const SERVER_ENV = new URL('../../server/.env', import.meta.url)
// Same address shape signUpFreshUser generates.
const FRESH_TEST_EMAIL = /^e2e-[0-9a-f-]{36}@example\.com$/

function mongoUri() {
  const { MONGODB_URI } = dotenv.parse(readFileSync(SERVER_ENV))
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is missing from server/.env, so the test account cannot be deleted.')
  }
  return MONGODB_URI
}

function trackedEmails(accounts) {
  return [...new Set(accounts.map((account) => (
    typeof account === 'string' ? account : account?.email
  )).filter((email) => typeof email === 'string' && email))]
}

// Remember one account returned by signUpFreshUser. The array is deleted in afterAll.
export function trackAccount(accounts, user) {
  const email = user?.email
  if (typeof email !== 'string' || !FRESH_TEST_EMAIL.test(email)) {
    throw new Error('Refusing to track an email that is not an e2e test address.')
  }
  accounts.push({ email })
}

// Registers the file's afterAll hook. Pass the same array trackAccount writes to.
export function installCleanup(test, accounts) {
  test.afterAll(async () => {
    await deleteTrackedAccounts(accounts)
  })
}

// Deletes the tracked accounts and the rows that belong to them.
// Looks up those exact emails, then deletes only by the matching user ids.
export async function deleteTrackedAccounts(accounts) {
  const emails = trackedEmails(accounts)
  if (!emails.length) return

  if (emails.some((email) => !FRESH_TEST_EMAIL.test(email))) {
    throw new Error('Refusing to delete a user whose email is not an e2e test address.')
  }

  const connection = await mongoose.createConnection(mongoUri()).asPromise()
  try {
    const databaseName = connection.db?.databaseName || connection.name
    if (!databaseName?.startsWith('aqualife_test_')) {
      throw new Error(`Refusing to delete from database "${databaseName || ''}".`)
    }

    const users = connection.collection('users')
    const matches = await users.find(
      { email: { $in: emails } },
      { projection: { email: 1 } },
    ).toArray()

    if (matches.some((user) => !FRESH_TEST_EMAIL.test(user.email))) {
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
  } finally {
    await connection.close()
  }
}
