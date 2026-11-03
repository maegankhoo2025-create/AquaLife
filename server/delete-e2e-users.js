require('dotenv').config()
const mongoose = require('mongoose')

// Same address shape client/e2e/helpers.js signUpFreshUser generates.
// A renamed profile email still matches. Display name is not used.
const FRESH_TEST_EMAIL = /^e2e-[0-9a-f-]{36}@example\.com$/

async function deleteE2eUsers() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to server/.env.')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  try {
    const users = mongoose.connection.collection('users')
    const matches = await users.find(
      { email: FRESH_TEST_EMAIL },
      { projection: { email: 1 } },
    ).toArray()

    const refused = matches.filter((user) => !FRESH_TEST_EMAIL.test(user.email))
    if (refused.length) {
      throw new Error('Refusing to delete a user whose email is not an e2e test address.')
    }

    if (!matches.length) {
      console.log('No E2E test profiles to delete.')
      return
    }

    const safeIds = matches.map((user) => user._id)
    const idStrings = safeIds.map((id) => id.toString())

    const tanks = await mongoose.connection.collection('tanks').deleteMany({ owner: { $in: safeIds } })
    const transactions = await mongoose.connection.collection('transactions').deleteMany({ user: { $in: safeIds } })
    const friendships = await mongoose.connection.collection('friendships').deleteMany({ members: { $in: safeIds } })
    const messages = await mongoose.connection.collection('socialmessages').deleteMany({
      $or: [{ sender: { $in: safeIds } }, { recipient: { $in: safeIds } }],
    })
    const sessions = await mongoose.connection.collection('sessions').deleteMany({
      $or: idStrings.flatMap((id) => [
        { 'session.userId': id },
        { session: new RegExp(`"userId":"${id}"`) },
      ]),
    })
    const deletedUsers = await users.deleteMany({
      _id: { $in: safeIds },
      email: FRESH_TEST_EMAIL,
    })

    console.log(`Deleted ${deletedUsers.deletedCount} E2E test profiles`)
    console.log(`Deleted ${tanks.deletedCount} tanks`)
    console.log(`Deleted ${transactions.deletedCount} transactions`)
    console.log(`Deleted ${friendships.deletedCount} friendships`)
    console.log(`Deleted ${messages.deletedCount} social messages`)
    console.log(`Deleted ${sessions.deletedCount} sessions`)
  } finally {
    await mongoose.disconnect()
  }
}

deleteE2eUsers().catch((err) => {
  console.error(err)
  process.exit(1)
})
