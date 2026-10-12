// Quiz questions: a few general fish-care questions (copied from
// client/src/data/mock.js) plus questions generated from the real species
// data in species.js, so new species automatically get new questions.
//
// Every question has an id, and its answer order is fixed by that id,
// so the server can mark an answer without remembering what it sent.

const { SPECIES } = require('./species')

const QUIZ_LENGTH = 5

const GENERAL_QUESTIONS = [
  {
    id: 'goldfish-temp',
    emoji: '🐠',
    question: 'Which water temperature suits a goldfish best?',
    answers: ['16–24°C', '26–30°C', '30–34°C', '8–12°C'],
    correct: 0,
    fact: 'Goldfish are cool-water fish. Warm tropical tanks stress them and shorten their lives.',
  },
  {
    id: 'schooling',
    emoji: '🐟',
    question: 'Neon tetras are schooling fish. What does that mean for your tank?',
    answers: ['Keep only one per tank', 'Keep them in a group', 'They need salt water', 'They must live with large fish'],
    correct: 1,
    fact: 'Schooling fish feel safe in numbers. A group of six or more shows brighter colours and less stress.',
  },
  {
    id: 'ph-meaning',
    emoji: '🧪',
    question: 'What does pH measure in aquarium water?',
    answers: ['How warm it is', 'How much oxygen it holds', 'How acidic or alkaline it is', 'How salty it is'],
    correct: 2,
    fact: 'pH 7 is neutral. Most community fish do well between 6.5 and 7.5, and sudden swings are more harmful than a slightly off value.',
  },
  {
    id: 'oscar-guppy',
    emoji: '🐡',
    question: 'Why should an Oscar not share a tank with guppies?',
    answers: ['Guppies need colder water', 'Oscars are large predators and will eat them', 'They need different lighting', 'Guppies are too aggressive'],
    correct: 1,
    fact: 'Temperament and adult size matter as much as water conditions when choosing tank mates.',
  },
  {
    id: 'water-changes',
    emoji: '🧽',
    question: 'What is the safest routine for keeping water clean?',
    answers: ['Replace all the water once a year', 'Never change the water', 'Change part of the water regularly', 'Add more fish to eat the waste'],
    correct: 2,
    fact: 'Small, regular water changes remove waste without shocking the fish or wiping out helpful bacteria.',
  },
]

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

// Shuffles a question's answers and moves "correct" to follow the right one.
function withShuffledAnswers(question) {
  const right = question.answers[question.correct]
  const answers = shuffle(question.answers, question.id)
  return { ...question, answers, correct: answers.indexOf(right) }
}

function rangeText(range, unit = '') {
  return `${range[0]}–${range[1]}${unit}`
}

function temperatureQuestion(species) {
  const right = rangeText(species.temp, '°C')
  const wrong = [...new Set(SPECIES.map((s) => rangeText(s.temp, '°C')))].filter((text) => text !== right)
  return withShuffledAnswers({
    id: 'temp-' + species.id,
    emoji: '🌡️',
    question: `Which water temperature suits a ${species.name} (${species.sci})?`,
    answers: [right, ...shuffle(wrong, 'temp-' + species.id).slice(0, 3)],
    correct: 0,
    fact: `${species.name} needs ${right}. Outside its range a fish gets stressed and slowly loses health.`,
  })
}

const TEMPERAMENT_FACTS = {
  peaceful: 'It gets along with other peaceful fish of a similar size.',
  'semi-aggressive': 'It may nip or chase some tank mates, so choose its companions carefully.',
  aggressive: 'It may attack or eat smaller fish, so it should not share a tank with peaceful species.',
}

function temperamentQuestion(species) {
  return {
    id: 'temperament-' + species.id,
    emoji: '🐟',
    question: `How would you describe the temperament of a ${species.name}?`,
    answers: ['Peaceful', 'Semi-aggressive', 'Aggressive'],
    correct: ['peaceful', 'semi-aggressive', 'aggressive'].indexOf(species.temperament),
    fact: `The ${species.name} is ${species.temperament}. ${TEMPERAMENT_FACTS[species.temperament]}`,
  }
}

const ALL_QUESTIONS = [
  ...GENERAL_QUESTIONS.map(withShuffledAnswers),
  ...SPECIES.map(temperatureQuestion),
  ...SPECIES.map(temperamentQuestion),
]

function getQuestion(id) {
  return ALL_QUESTIONS.find((question) => question.id === id)
}

// The same QUIZ_LENGTH questions for everyone on a given day (YYYY-MM-DD).
function questionsForDay(day) {
  return shuffle(ALL_QUESTIONS, 'quiz-' + day).slice(0, QUIZ_LENGTH)
}

module.exports = { QUIZ_LENGTH, getQuestion, questionsForDay }
