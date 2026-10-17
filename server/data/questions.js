// Quiz questions built from live species data (the APIs in our proposal):
//   - GBIF: family and scientific name questions
//   - iNaturalist: "Which fish is in this photo?" questions and common names
//   - Aquarist Atlas, falling back to stored FishBase values: temperature and pH questions
// The lookups go through getSpecies() in routes/species.js for every fish in the shop.
//
// Results are cached for a day. If the APIs are down when the cache expires,
// the last questions that were fetched keep being used.

const { SPECIES } = require('./species')
const { getSpecies: lookupSpecies } = require('../routes/species-routes')

const QUIZ_LENGTH = 5
const CACHE_HOURS = 24
const MAX_TEMP_RANGE = 15 // °C: wider ranges are treated as bad data and skipped

// A simple seeded random number generator: the same seed always gives the
// same sequence, so shuffles can be repeated exactly.
function seededRandom(seedText) {
  let seed = 0
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  return function () {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(list, seedText) {
  const random = seededRandom(seedText)
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Builds a multiple-choice question: the right answer plus up to 3 different
// wrong ones, in a shuffled order. Returns null if there are not enough wrong answers.
function makeQuestion({ id, emoji, question, right, wrongPool, fact, photo = null }) {
  const wrong = shuffle([...new Set(wrongPool)].filter((text) => text && text !== right), id).slice(0, 3)
  if (wrong.length < 3) return null
  const answers = shuffle([right, ...wrong], id + '-answers')
  return { id, emoji, question, answers, correct: answers.indexOf(right), fact, photo }
}

function rangeText(range, unit = '') {
  return `${range.min}–${range.max}${unit}`
}

// The common name from iNaturalist, or the shop name if iNaturalist has none.
function displayName(fish) {
  return fish.api.commonName || fish.name
}

function temperatureQuestion(fish, all) {
  const temp = fish.api.conditions?.temperature
  if (!temp || temp.max - temp.min > MAX_TEMP_RANGE) return null
  return makeQuestion({
    id: 'temp-' + fish.id,
    emoji: '🌡️',
    question: `Which water temperature suits a ${displayName(fish)} (${fish.api.canonicalName})?`,
    right: rangeText(temp, '°C'),
    wrongPool: all
      .map((other) => other.api.conditions?.temperature)
      .filter((t) => t && t.max - t.min <= MAX_TEMP_RANGE)
      .map((t) => rangeText(t, '°C')),
    fact: `${displayName(fish)} needs ${rangeText(temp, '°C')} (source: ${fish.api.conditions.source}). Outside its range a fish gets stressed and slowly loses health.`,
  })
}

function phQuestion(fish, all) {
  const ph = fish.api.conditions?.ph
  if (!ph) return null
  return makeQuestion({
    id: 'ph-' + fish.id,
    emoji: '🧪',
    question: `Which pH range suits a ${displayName(fish)}?`,
    right: 'pH ' + rangeText(ph),
    wrongPool: all.map((other) => other.api.conditions?.ph).filter(Boolean).map((p) => 'pH ' + rangeText(p)),
    fact: `${displayName(fish)} does best at pH ${rangeText(ph)} (source: ${fish.api.conditions.source}). Sudden pH swings are more harmful than a slightly off value.`,
  })
}

function familyQuestion(fish, all) {
  if (!fish.api.family) return null
  return makeQuestion({
    id: 'family-' + fish.id,
    emoji: '🧬',
    question: `Which family does the ${displayName(fish)} belong to?`,
    right: fish.api.family,
    wrongPool: all.map((other) => other.api.family),
    fact: `${displayName(fish)} (${fish.api.canonicalName}) is in the family ${fish.api.family}, according to GBIF.`,
  })
}

function scientificNameQuestion(fish, all) {
  return makeQuestion({
    id: 'sci-' + fish.id,
    emoji: '🔬',
    question: `What is the scientific name of the ${displayName(fish)}?`,
    right: fish.api.canonicalName,
    wrongPool: all.map((other) => other.api.canonicalName),
    fact: `Scientists call the ${displayName(fish)} ${fish.api.canonicalName}. Its genus is ${fish.api.genus || fish.api.canonicalName.split(' ')[0]} (source: GBIF).`,
  })
}

function photoQuestion(fish, all) {
  if (!fish.api.photo) return null
  return makeQuestion({
    id: 'photo-' + fish.id,
    emoji: '📷',
    question: 'Which fish is in this photo?',
    right: displayName(fish),
    wrongPool: all.map(displayName),
    fact: `This is a ${displayName(fish)} (${fish.api.canonicalName}). Photo: ${fish.api.photo.attribution}, via iNaturalist.`,
    photo: { url: fish.api.photo.url, attribution: fish.api.photo.attribution, sourceUrl: fish.api.photo.sourceUrl },
  })
}

const QUESTION_MAKERS = [temperatureQuestion, phQuestion, familyQuestion, scientificNameQuestion, photoQuestion]

// Looks up every shop fish and turns the results into questions.
async function buildPool() {
  const results = await Promise.allSettled(SPECIES.map((species) => lookupSpecies(species.sci)))
  const fishWithData = SPECIES.map((species, i) =>
    results[i].status === 'fulfilled' ? { ...species, api: results[i].value } : null,
  ).filter(Boolean)

  return fishWithData
    .flatMap((fish) => QUESTION_MAKERS.map((make) => make(fish, fishWithData)))
    .filter(Boolean)
}

let cache = { pool: null, builtAt: 0 }
let building = null

// All the questions we can ask right now (cached; see top of file).
async function getQuestionPool() {
  const fresh = cache.pool && Date.now() - cache.builtAt < CACHE_HOURS * 60 * 60 * 1000
  if (fresh) return cache.pool

  if (!building) {
    building = buildPool()
      .then((pool) => {
        if (pool.length >= QUIZ_LENGTH) cache = { pool, builtAt: Date.now() }
        else console.error(`Only ${pool.length} quiz questions could be built from the species APIs.`)
      })
      .catch((error) => console.error('Building quiz questions failed:', error.message))
      .finally(() => (building = null))
  }
  await building

  if (!cache.pool) throw new Error('The species APIs are unavailable')
  return cache.pool // the new pool, or the last good one if this refresh failed
}

// The same QUIZ_LENGTH questions for everyone on a given day (YYYY-MM-DD).
function questionsForDay(pool, day) {
  return shuffle(pool, 'quiz-' + day).slice(0, QUIZ_LENGTH)
}

module.exports = { QUIZ_LENGTH, getQuestionPool, questionsForDay }
