const fs = require('node:fs/promises')
const path = require('node:path')
const fishCatalogue = require('./data/shopFish')

const BASE_URL = 'http://localhost:8000'

async function main() {
  const prepared = new Array(fishCatalogue.length)
  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (nextIndex < fishCatalogue.length) {
      const index = nextIndex++
      const fish = fishCatalogue[index]

      const url = new URL('/api/species', BASE_URL)
      url.searchParams.set('name', fish.sci)

      const response = await fetch(url, {
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        throw new Error(`${fish.name}: HTTP ${response.status}`)
      }

      const data = await response.json()
      const conditions = data.conditions
      const temperature = conditions?.temperature
      const ph = conditions?.ph

      const validRange = range =>
        Number.isFinite(range?.min) &&
        Number.isFinite(range?.max) &&
        range.min <= range.max

      if (
        conditions?.dataType !== 'live-api' ||
        !validRange(temperature) ||
        !validRange(ph) ||
        ph.min < 0 ||
        ph.max > 14
      ) {
        throw new Error(`${fish.name}: missing valid live API conditions`)
      }

      const allowedLicenses = [
        'cc0', 'pd', 'cc-by', 'cc-by-sa',
        'cc-by-nc', 'cc-by-nc-sa',
        'cc-by-nd', 'cc-by-nc-nd',
      ]

      if (
        !data.photo?.url?.startsWith('https://') ||
        !data.photo?.attribution ||
        !data.photo?.sourceUrl ||
        !allowedLicenses.includes(data.photo?.license?.toLowerCase())
      ) {
        throw new Error(`${fish.name}: missing usable licensed photo`)
      }

      prepared[index] = {
        ...fish,
        temp: [temperature.min, temperature.max],
        ph: [ph.min, ph.max],
        conditionsSource: conditions.source,
        conditionsSourceUrl: conditions.sourceUrl,
        conditionsFetchedAt: new Date().toISOString(),
        photos: [data.photo],
        size: data.size,
        sizeType: data.sizeType ?? '',
      }

      completed++
      console.log(
        `[${completed}/${fishCatalogue.length}] Prepared ${fish.name}`
      )
    }
  }

  // Allow both workers to finish before reporting any failure.
  const outcomes = await Promise.allSettled([worker(), worker()])
  const failure = outcomes.find(result => result.status === 'rejected')

  if (failure) throw failure.reason

  const outputPath = path.join(__dirname, 'data', 'shopFish-api.json')

  await fs.writeFile(
    outputPath,
    JSON.stringify(prepared, null, 2),
    'utf8'
  )

  console.log(`\nPrepared ${prepared.length} fish successfully.`)
  console.log('Saved to server/data/shopFish-api.json')
  console.log('MongoDB has NOT been changed.')
}

main().catch(error => {
  console.error('Preparation failed:', error.message)
  process.exitCode = 1
})