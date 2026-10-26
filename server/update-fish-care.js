const path = require('node:path')

require('dotenv').config({
  path: path.join(__dirname, '.env'),
})

const mongoose = require('mongoose')
const Product = require('./models/Product-model')
const profiles = require('./data/fishCareProfiles')

async function main() {
  const apply = process.argv.includes('--apply')

  if (
    profiles.length !== 50 ||
    new Set(profiles.map(profile => profile.id)).size !== 50
  ) {
    throw new Error('Expected 50 unique fish profiles.')
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const operations = []

  for (const profile of profiles) {
    const existing = await Product.findOne({
      id: profile.id,
      category: 'fish',
    }).lean()

    if (!existing) {
      throw new Error(`Fish not found: ${profile.id}`)
    }

    if (existing.sci !== profile.sci) {
      throw new Error(`Scientific name mismatch: ${profile.name}`)
    }

    const updates = {
      care: profile.care,
      temperament: profile.temperament,
      careNote: profile.careNote,
      temperamentNote: profile.temperamentNote,
      behaviourFlags: profile.behaviourFlags,
      careProfileProvenance: profile.provenance,
    }

    await new Product({
      ...existing,
      ...updates,
    }).validate()

    operations.push({
      updateOne: {
        filter: {
          id: profile.id,
          sci: profile.sci,
          category: 'fish',
        },
        update: { $set: updates },
        upsert: false,
      },
    })
  }

  if (!apply) {
    console.log('CHECK PASSED: all 50 profiles match MongoDB.')
    console.log('Labels, notes and sources passed model validation.')
    console.log('MongoDB has NOT been changed.')
    return
  }

  const result = await mongoose.connection.transaction(
    async session => {
      const saved = await Product.bulkWrite(operations, { session })

      if (saved.matchedCount !== 50) {
        throw new Error('Not all 50 fish matched. Update cancelled.')
      }

      return saved
    }
  )

  console.log(`Matched ${result.matchedCount} fish.`)
  console.log(`Updated ${result.modifiedCount} fish.`)
}

main()
  .catch(error => {
    console.error('Care update failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())