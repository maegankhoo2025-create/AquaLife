const Product = require('../models/Product-model')

// Keep the same array so other modules, including the quiz,
// can continue using their existing reference.
const SPECIES = []

async function loadSpeciesCatalogue() {
  const fish = await Product.find({ category: 'fish' }).lean()

  if (fish.length === 0) {
    throw new Error('No fish found in the MongoDB product catalogue.')
  }

  for (const species of fish) {
    const validRange = range =>
      Array.isArray(range) &&
      range.length === 2 &&
      range.every(Number.isFinite) &&
      range[0] <= range[1]

    if (!validRange(species.temp) || !validRange(species.ph)) {
      throw new Error(
        `Missing or invalid conditions for ${species.name}.`
      )
    }
  }

  // Only replace the catalogue after every fish has passed validation.
  SPECIES.splice(0, SPECIES.length, ...fish)

  console.log(`Loaded ${SPECIES.length} fish species from MongoDB.`)
}

function getSpecies(id) {
  return SPECIES.find(species => species.id === id)
}

module.exports = {
  SPECIES,
  getSpecies,
  loadSpeciesCatalogue,
}