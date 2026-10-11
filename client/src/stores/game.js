// The game store: one reactive object holding the player's pearls, tanks,
// history and quiz progress, plus the functions that change them.
//
// Pages never touch the mock data directly. They import from this file, so when
// the backend is ready each function here can be rewritten to call the API
// (for example LoginApi.get('/api/tanks')) without changing any page.

import { computed, reactive, watch } from 'vue'
import {
  DAILY_TASKS,
  ITEMS,
  QUIZ_QUESTIONS,
  STARTER_HISTORY,
  STARTER_QUIZ_SCORES,
  STARTER_TANKS,
} from '../data/mock'

const STORAGE_KEY = 'aqualife-game-v1'
const XP_PER_LEVEL = 200
const PEARLS_PER_CORRECT_ANSWER = 10
const XP_PER_CORRECT_ANSWER = 15

// Limits for the condition sliders (same min/max as server/models/Tank.js).
export const CONDITION_LIMITS = {
  temperature: { min: 15, max: 35, step: 1, unit: '°C', label: 'Temperature' },
  ph: { min: 5, max: 9, step: 0.1, unit: '', label: 'pH' },
  waterQuality: { min: 0, max: 100, step: 1, unit: '%', label: 'Water quality' },
}
const SAFE_WATER_QUALITY = [70, 100]

// Decorations are placed in percentages of the tank (0 = left/top, 100 = right/bottom).
// New ones start on the floor; the limits stop them being dragged out of view.
const DECOR_FLOOR_Y = 85
const DECOR_LIMITS = { minX: 6, maxX: 94, minY: 25, maxY: 90 }

// Local date as YYYY-MM-DD. Used to reset the daily tasks and quiz each day.
function dayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function yesterdayKey() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return dayKey(date)
}

let idCounter = 0
function newId(prefix) {
  idCounter += 1
  return `${prefix}-${Date.now()}-${idCounter}`
}

function freshState() {
  return {
    user: { name: 'Aquarist', email: '' },
    pearls: 240,
    xp: 320,
    currentTankId: STARTER_TANKS[0].id,
    tanks: structuredClone(STARTER_TANKS),
    history: structuredClone(STARTER_HISTORY),
    day: dayKey(),
    tasksDone: [], // ids of the daily tasks already rewarded today
    quiz: { streak: 2, lastDay: yesterdayKey(), scores: structuredClone(STARTER_QUIZ_SCORES) },
    settings: { dailyReminder: true, quizReminder: true, reduceMotion: false },
  }
}

// Start from fresh data, then copy over anything saved in this browser.
function loadState() {
  const state = freshState()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved) Object.assign(state, saved)
  } catch (error) {
    console.error('Unable to read the saved game:', error)
  }

  // Older saves stored a decoration as just an item id. Give those a position.
  for (const tank of state.tanks) {
    tank.decorations = tank.decorations.map((decoration, index) =>
      typeof decoration === 'string'
        ? { id: newId('d'), itemId: decoration, x: 20 + ((index * 25) % 70), y: DECOR_FLOOR_Y }
        : decoration,
    )
  }

  // A new day: the daily tasks become available again.
  if (state.day !== dayKey()) {
    state.day = dayKey()
    state.tasksDone = []
  }
  // The streak is lost if a whole day went by without a quiz.
  if (state.quiz.lastDay !== dayKey() && state.quiz.lastDay !== yesterdayKey()) {
    state.quiz.streak = 0
  }
  return state
}

export const game = reactive(loadState())

// Save after every change. The user is left out because it comes from the login session.
watch(
  game,
  () => {
    try {
      const { user, ...toSave } = game
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.error('Unable to save the game:', error)
    }
  },
  { deep: true },
)

// ---- Toast message (shown by App.vue) ----
export const toast = reactive({ text: '', bad: false })
let toastTimer

export function notify(text, bad = false) {
  toast.text = text
  toast.bad = bad
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.text = ''), 3500)
}

// ---- User ----
// Called by the router guard with the user returned by GET /auth/session.
export function setUser(user) {
  if (user) game.user = { name: user.name, email: user.email }
}

// ---- Level and XP ----
export const level = computed(() => Math.floor(game.xp / XP_PER_LEVEL) + 1)
export const xpInLevel = computed(() => game.xp % XP_PER_LEVEL)
export const xpPercent = computed(() => (xpInLevel.value / XP_PER_LEVEL) * 100)
export const xpPerLevel = XP_PER_LEVEL

// ---- Shop items ----
export function getItems() {
  return ITEMS
}

export function getItem(id) {
  return ITEMS.find((item) => item.id === id)
}

// ---- Tanks ----
export const currentTank = computed(
  () => game.tanks.find((tank) => tank.id === game.currentTankId) || game.tanks[0],
)

export function getTank(id) {
  return game.tanks.find((tank) => tank.id === id)
}

// The different species living in a tank (each species listed once).
export function tankSpecies(tank) {
  const ids = [...new Set(tank.fish.map((fish) => fish.speciesId))]
  return ids.map(getItem).filter(Boolean)
}

// The range of each condition that suits every fish in the tank at once.
// A value is null when the fish have no range in common.
export function safeRange(tank) {
  const species = tankSpecies(tank)

  function overlap(key) {
    const limits = CONDITION_LIMITS[key]
    const low = Math.max(limits.min, ...species.map((s) => s[key === 'temperature' ? 'temp' : 'ph'][0]))
    const high = Math.min(limits.max, ...species.map((s) => s[key === 'temperature' ? 'temp' : 'ph'][1]))
    return low <= high ? [low, high] : null
  }

  return {
    temperature: overlap('temperature'),
    ph: overlap('ph'),
    waterQuality: SAFE_WATER_QUALITY,
  }
}

export function setCondition(tankId, key, value) {
  getTank(tankId).conditions[key] = value
}

export function renameFish(tankId, fishId, nickname) {
  const fish = getTank(tankId).fish.find((f) => f.id === fishId)
  if (fish) fish.nickname = nickname.trim().slice(0, 20)
}

// Decorate mode: remember where a decoration was dropped.
export function moveDecoration(tankId, decorationId, x, y) {
  const decoration = getTank(tankId).decorations.find((d) => d.id === decorationId)
  if (!decoration) return
  decoration.x = Math.round(Math.min(DECOR_LIMITS.maxX, Math.max(DECOR_LIMITS.minX, x)))
  decoration.y = Math.round(Math.min(DECOR_LIMITS.maxY, Math.max(DECOR_LIMITS.minY, y)))
}

export function healthLabel(health) {
  if (health >= 70) return { text: 'Healthy', chip: 'al-chip--ok' }
  if (health >= 40) return { text: 'Weak', chip: 'al-chip--warn' }
  return { text: 'Sick', chip: 'al-chip--bad' }
}

// ---- Compatibility ----
// Would this shop item be happy in this tank? Returns { ok, reasons } where
// reasons is a list of sentences explaining each problem.
export function checkCompatibility(item, tank) {
  const reasons = []
  if (item.category !== 'fish') return { ok: true, reasons }

  const { temperature, ph } = tank.conditions
  if (temperature < item.temp[0] || temperature > item.temp[1]) {
    reasons.push(
      `${tank.name} is ${temperature}°C, but ${item.name} needs ${item.temp[0]}–${item.temp[1]}°C.`,
    )
  }
  if (ph < item.ph[0] || ph > item.ph[1]) {
    reasons.push(`${tank.name} has pH ${ph}, but ${item.name} needs pH ${item.ph[0]}–${item.ph[1]}.`)
  }

  // An aggressive fish cannot share a tank with fish that are not aggressive.
  const tankMates = tankSpecies(tank).filter((species) => species.id !== item.id)
  if (item.temperament === 'aggressive') {
    const victims = tankMates.filter((species) => species.temperament !== 'aggressive')
    if (victims.length > 0) {
      const names = victims.map((species) => species.name).join(', ')
      reasons.push(`${item.name} is aggressive and may attack: ${names}.`)
    }
  } else {
    const bullies = tankMates.filter((species) => species.temperament === 'aggressive')
    if (bullies.length > 0) {
      const names = bullies.map((species) => species.name).join(', ')
      reasons.push(`${item.name} may be attacked by aggressive tank mates: ${names}.`)
    }
  }

  return { ok: reasons.length === 0, reasons }
}

// Another tank where the item fits, or undefined if there is none.
export function suggestTank(item, exceptTankId) {
  return game.tanks.find(
    (tank) => tank.id !== exceptTankId && checkCompatibility(item, tank).ok,
  )
}

// ---- History ----
function addHistory(type, label, amount) {
  game.history.unshift({ id: newId('h'), date: new Date().toISOString(), type, label, amount })
}

export const totals = computed(() => {
  let earned = 0
  let spent = 0
  for (const entry of game.history) {
    if (entry.amount > 0) earned += entry.amount
    else spent -= entry.amount
  }
  return { earned, spent }
})

// ---- Buying ----
// Returns { ok, message } so the page can show what happened.
export function buyItem(item, tankId, quantity = 1) {
  const tank = getTank(tankId)
  const cost = item.price * quantity

  if (cost > game.pearls) {
    return { ok: false, message: `Not enough pearls. You need ${cost - game.pearls} more.` }
  }

  game.pearls -= cost
  for (let i = 0; i < quantity; i++) {
    if (item.category === 'fish') {
      tank.fish.push({ id: newId('f'), speciesId: item.id, nickname: '', health: 100, hunger: 0 })
    } else {
      // Start on the tank floor, spread out so new items do not stack on each other.
      const x = 15 + ((tank.decorations.length * 23) % 70)
      tank.decorations.push({ id: newId('d'), itemId: item.id, x, y: DECOR_FLOOR_Y })
    }
  }
  addHistory('purchase', `${quantity} × ${item.name} for ${tank.name}`, -cost)

  return { ok: true, message: `Added ${quantity} × ${item.name} to ${tank.name}.` }
}

// ---- Daily care tasks ----
export function getTasks() {
  return DAILY_TASKS.map((task) => ({ ...task, done: game.tasksDone.includes(task.id) }))
}

// Feed, clean or adjust the temperature of a tank. The action always happens,
// but pearls are only paid the first time each day. Returns the pearls earned.
export function doTask(taskId, tankId) {
  const tank = getTank(tankId)
  const task = DAILY_TASKS.find((t) => t.id === taskId)

  if (taskId === 'feed') {
    for (const fish of tank.fish) fish.hunger = 0
  } else if (taskId === 'clean') {
    tank.conditions.waterQuality = 100
  } else if (taskId === 'temp') {
    // Move to the middle of the range that suits every fish, if there is one.
    const range = safeRange(tank).temperature
    if (range) tank.conditions.temperature = Math.round((range[0] + range[1]) / 2)
  }

  if (game.tasksDone.includes(taskId)) return 0

  game.tasksDone.push(taskId)
  game.pearls += task.reward
  game.xp += task.reward
  addHistory('reward', task.label, task.reward)
  return task.reward
}

// ---- Quiz ----
export function getQuizQuestions() {
  return QUIZ_QUESTIONS
}

export const quizDoneToday = computed(() => game.quiz.lastDay === game.day)

// Records a finished quiz. Pearls are only paid for the first quiz of the day,
// so replaying is just practice. Returns the pearls earned.
export function finishQuiz(score, total) {
  if (quizDoneToday.value) return 0

  const reward = score * PEARLS_PER_CORRECT_ANSWER
  game.pearls += reward
  game.xp += score * XP_PER_CORRECT_ANSWER
  game.quiz.streak += 1
  game.quiz.lastDay = game.day
  game.quiz.scores.unshift({ date: new Date().toISOString(), score, total, reward })
  addHistory('reward', `Daily quiz: ${score}/${total} correct`, reward)
  return reward
}

// ---- Achievements ----
export const achievements = computed(() => {
  const fishCount = game.tanks.reduce((sum, tank) => sum + tank.fish.length, 0)
  return [
    { id: 'first-fish', emoji: '🐟', name: 'First fish', earned: fishCount >= 1 },
    { id: 'school', emoji: '🐠', name: 'School of 10', earned: fishCount >= 10 },
    { id: 'streak', emoji: '🔥', name: '3-day quiz streak', earned: game.quiz.streak >= 3 },
    { id: 'saver', emoji: '💎', name: '500 pearls saved', earned: game.pearls >= 500 },
    {
      id: 'carer',
      emoji: '🧽',
      name: 'All tasks done today',
      earned: game.tasksDone.length === DAILY_TASKS.length,
    },
  ]
})

// ---- Formatting helper ----
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}
