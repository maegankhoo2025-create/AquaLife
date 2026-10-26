require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })

const mongoose = require('mongoose')
const Product = require('./models/Product-model')
const preparedFish = require('./data/shopFish-api.json')

async function main() {
  if (
    preparedFish.length !== 50 ||
    new Set(preparedFish.map(fish => fish.id)).size !== 50 ||
    new Set(preparedFish.map(fish => fish.sci)).size !== 50
  ) {
    throw new Error('Expected exactly 50 unique fish.')
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const operations = []

  for (const fish of preparedFish) {
    const validRange = range =>
      Array.isArray(range) &&
      range.length === 2 &&
      range.every(Number.isFinite) &&
      range[0] <= range[1]

    if (
      !validRange(fish.temp) ||
      !validRange(fish.ph) ||
      !fish.conditionsSource ||
      !fish.conditionsSourceUrl ||
      !fish.conditionsFetchedAt ||
      !fish.photos?.length
    ) {
      throw new Error(`Incomplete API data for ${fish.name}`)
    }

    const existing = await Product.findOne({ id: fish.id }).lean()

    if (existing && existing.category !== 'fish') {
      throw new Error(`Product ID conflict: ${fish.id}`)
    }

    const updates = {
      category: 'fish',
      name: fish.name,
      sci: fish.sci,
      temp: fish.temp,
      ph: fish.ph,
      conditionsSource: fish.conditionsSource,
      conditionsSourceUrl: fish.conditionsSourceUrl,
      conditionsFetchedAt: fish.conditionsFetchedAt,
      photos: fish.photos,
      ...(Number.isFinite(fish.size) && fish.size > 0 ? {
      size: fish.size,
      sizeType: fish.sizeType ?? '',
    }
  : {}),
    }

    // Validate before writing. Preserve existing care information and prices.
    await new Product({
      ...fish,
      ...existing,
      ...updates,
    }).validate()

    operations.push({
      updateOne: {
        filter: { id: fish.id },
        update: {
          $set: updates,
          $setOnInsert: {
            id: fish.id,
            price: fish.price,
          },
        },
        upsert: true,
      },
    })
  }

  // Save the whole batch together.
  const result = await mongoose.connection.transaction(session =>
    Product.bulkWrite(operations, { session })
  )

  console.log(`Added ${result.upsertedCount} new fish.`)
  console.log(`Updated ${result.modifiedCount} existing fish.`)
  console.log(
    `Total fish in MongoDB: ${
      await Product.countDocuments({ category: 'fish' })
    }`
  )
}

main()
  .catch(error => {
    console.error('Import failed:', error.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())