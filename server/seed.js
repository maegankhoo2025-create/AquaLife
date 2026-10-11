require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')
const Tank = require('./models/Tank-model')

const STARTER_TANKS = [
  {
    name: 'Tank 1',
    conditions: { temperature: 25, ph: 6.8, waterQuality: 86 },
    fish: [
      { speciesId: 'neon-tetra', nickname: 'Blip', health: 100, hunger: 20 },
      { speciesId: 'neon-tetra', nickname: 'Dash', health: 100, hunger: 20 },
      { speciesId: 'guppy', nickname: 'Sunny', health: 90, hunger: 35 },
      { speciesId: 'corydoras', nickname: 'Pepper', health: 100, hunger: 10 },
    ],
    decorations: [
      { itemId: 'java-fern', x: 22, y: 84 },
      { itemId: 'driftwood', x: 68, y: 86 },
    ],
  },
  {
    name: 'Tank 2',
    conditions: { temperature: 21, ph: 7.4, waterQuality: 92 },
    fish: [
      { speciesId: 'goldfish', nickname: 'Nugget', health: 100, hunger: 30 },
      { speciesId: 'zebra-danio', nickname: 'Zip', health: 95, hunger: 15 },
    ],
    decorations: [{ itemId: 'anubias', x: 40, y: 84 }],
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

// Use an account you already signed up with in the app by doing this:
//SEED_USER_EMAIL=
//paste the line above into your .env file
//
  const email = (process.env.SEED_USER_EMAIL || 'test@example.com').toLowerCase()
  const user = await User.findOne({ email })

  if (!user) {
    console.error('No user with email', email)
    console.error('Sign up in the app first, or set SEED_USER_EMAIL in server/.env')
    process.exit(1)
  }

  await Tank.deleteMany({ owner: user._id })
  console.log('Cleared tanks for', email)

  const docs = STARTER_TANKS.map((tank) => ({ ...tank, owner: user._id }))
  const created = await Tank.insertMany(docs)
  console.log(`Inserted ${created.length} tanks:`)
  created.forEach((t) => console.log(' -', t.name, t._id.toString()))

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})