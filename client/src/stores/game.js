// The game store: one reactive object holding the player's pearls, tanks,
// history and quiz progress, plus the functions that change them.
//
// Pages never call the backend directly. They import from this file, and the
// functions here talk to the Express server through LoginApi.

import { computed, reactive, watch } from 'vue'
import LoginApi from '../LoginApi'
import { DAILY_TASKS, ITEMS } from '../data/mock'

const STORAGE_KEY = 'aqualife-prefs-v1'
const XP_PER_LEVEL = 200
const CONDITION_SAVE_DELAY = 400 // ms to wait after the last slider move before saving

// Limits for the condition sliders (same min/max as server/models/Tank-model.js).
export const CONDITION_LIMITS = {
  temperature: { min: 15, max: 35, step: 1, unit: '°C', label: 'Temperature' },
  ph: { min: 5, max: 9, step: 0.1, unit: '', label: 'pH' },
  waterQuality: { min: 0, max: 100, step: 1, unit: '%', label: 'Water quality' },
}
const SAFE_WATER_QUALITY = [70, 100]

// Decorations are placed in percentages of the tank (0 = left/top, 100 = right/bottom).
// The limits stop them being dragged out of view.
const DECOR_LIMITS = { minX: 6, maxX: 94, minY: 25, maxY: 90 }

// Everything except settings and the selected tank comes from the server.
function freshState() {
  return {
    user: { id: null, name: 'Aquarist', email: '' },
    pearls: 0,
    xp: 0,
    currentTankId: null,
    tanks: [],
    history: [],
    tasksDone: [], // ids of the daily tasks already rewarded today
    quiz: { streak: 0, doneToday: false, scores: [] },
    achievements: [],
    settings: { dailyReminder: true, quizReminder: true, reduceMotion: false },
  }
}

// Start from fresh data, then copy over the preferences saved in this browser.
function loadState() {
  const state = freshState()
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved) {
      if (saved.settings) Object.assign(state.settings, saved.settings)
      if (saved.currentTankId) state.currentTankId = saved.currentTankId
    }
  } catch (error) {
    console.error('Unable to read the saved preferences:', error)
  }
  return state
}

export const game = reactive(loadState())

// Only preferences are kept in the browser; the game itself lives in MongoDB.
watch(
  () => ({ settings: game.settings, currentTankId: game.currentTankId }),
  (prefs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch (error) {
      console.error('Unable to save the preferences:', error)
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

// The server's message for a failed request, or a general one if the server is unreachable.
function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

// ---- User ----
// Called by the router guard with the user returned by GET /auth/session.
export function setUser(user) {
  if (user) game.user = { id: user.id, name: user.name, email: user.email }
}

// ---- Loading from the server ----
// MongoDB ids are called _id. Pages use .id, so copy it across once here.
function fromServer(tank) {
  return {
    ...tank,
    id: tank._id,
    fish: tank.fish.map((fish) => ({ ...fish, id: fish._id })),
    decorations: tank.decorations.map((decoration) => ({ ...decoration, id: decoration._id })),
  }
}

// Replace one tank with the updated copy the server sent back.
function putTank(serverTank) {
  const tank = fromServer(serverTank)
  const index = game.tanks.findIndex((t) => t.id === tank.id)
  if (index >= 0) game.tanks[index] = tank
  else game.tanks.push(tank)
}

function applyStats(me) {
  game.pearls = me.pearls
  game.xp = me.xp
  game.tasksDone = me.tasks.filter((task) => task.done).map((task) => task.id)
  game.quiz = me.quiz
  game.achievements = me.achievements
}

function applyHistory(history) {
  game.history = history.map((entry) => ({ ...entry, id: entry._id }))
}

// Pearls, achievements and history after something changed.
async function refreshStats() {
  const [me, history] = await Promise.all([
    LoginApi.get('/api/game/me'),
    LoginApi.get('/api/game/history'),
  ])
  applyStats(me.data)
  applyHistory(history.data.history)
}

// Loads everything for the logged-in user. A brand-new account gets its first tank.
export async function loadGame() {
  const [me, tanks, history] = await Promise.all([
    LoginApi.get('/api/game/me'),
    LoginApi.get('/api/tanks'),
    LoginApi.get('/api/game/history'),
  ])

  let tankList = tanks.data.tanks
  if (tankList.length === 0) {
    const created = await LoginApi.post('/api/tanks', { name: 'Tank 1' })
    tankList = [created.data.tank]
  }

  applyStats(me.data)
  applyHistory(history.data.history)
  game.tanks = tankList.map(fromServer)
  if (!game.tanks.some((tank) => tank.id === game.currentTankId)) {
    game.currentTankId = game.tanks[0].id
  }
}

// Called by the router guard on every page change. The first time (or after a
// different user logs in) it waits for the data; after that it refreshes in the
// background so hunger and health stay up to date.
let loadedFor = null

export async function syncGame() {
  if (loadedFor === game.user.id) {
    loadGame().catch((error) => console.error('Unable to refresh the game:', error))
    return
  }
  await loadGame()
  loadedFor = game.user.id
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

// The slider moves straight away; the new value is saved once the user stops dragging.
const conditionTimers = {}

export function setCondition(tankId, key, value) {
  getTank(tankId).conditions[key] = value

  clearTimeout(conditionTimers[tankId])
  conditionTimers[tankId] = setTimeout(async () => {
    try {
      await LoginApi.patch(`/api/tanks/${tankId}/conditions`, getTank(tankId).conditions)
    } catch (error) {
      notify(errorMessage(error, 'Unable to save the tank conditions.'), true)
    }
  }, CONDITION_SAVE_DELAY)
}

// Not saved to the server yet: there is no route for nicknames.
export function renameFish(tankId, fishId, nickname) {
  const fish = getTank(tankId).fish.find((f) => f.id === fishId)
  if (fish) fish.nickname = nickname.trim().slice(0, 20)
}

// Decorate mode: remember where a decoration was dropped.
// Not saved to the server yet: there is no route for decoration positions.
export function moveDecoration(tankId, decorationId, x, y) {
  const decoration = getTank(tankId).decorations.find((d) => d.id === decorationId)
  if (!decoration) return
  decoration.x = Math.round(Math.min(DECOR_LIMITS.maxX, Math.max(DECOR_LIMITS.minX, x)))
  decoration.y = Math.round(Math.min(DECOR_LIMITS.maxY, Math.max(DECOR_LIMITS.minY, y)))
}

export function healthLabel(health) {
  if (health <= 0) return { text: 'Dead', chip: 'al-chip--bad' }
  if (health >= 70) return { text: 'Healthy', chip: 'al-chip--ok' }
  if (health >= 40) return { text: 'Weak', chip: 'al-chip--warn' }
  return { text: 'Sick', chip: 'al-chip--bad' }
}

// ---- Compatibility ----
// Would this shop item be happy in this tank? Returns { ok, reasons } where
// reasons is a list of sentences explaining each problem.
// The server runs the same check when a fish is bought; this copy lets the shop
// filter and warn instantly without asking the server about every item.
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
// Returns { ok, message }, or { ok: false, conflict: true, reasons } when the
// server says the fish does not suit the tank. Send force to buy it anyway.
export async function buyItem(item, tankId, quantity = 1, force = false) {
  try {
    const { data } = await LoginApi.post('/api/game/buy', { itemId: item.id, tankId, quantity, force })
    putTank(data.tank)
    game.pearls = data.pearls
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return { ok: true, message: data.message }
  } catch (error) {
    if (error.response?.status === 409) {
      return { ok: false, conflict: true, message: error.response.data.message, reasons: error.response.data.reasons }
    }
    return { ok: false, message: errorMessage(error, 'Unable to complete the purchase.') }
  }
}

// ---- Daily care tasks ----
export function getTasks() {
  return DAILY_TASKS.map((task) => ({ ...task, done: game.tasksDone.includes(task.id) }))
}

// Feed, clean or adjust the temperature of a tank. The action always happens,
// but pearls are only paid the first time each day.
// Returns the pearls earned, or null if the request failed.
export async function doTask(taskId, tankId) {
  try {
    const { data } = await LoginApi.post(`/api/game/tasks/${taskId}`, { tankId })
    putTank(data.tank)
    game.pearls = data.pearls
    game.xp = data.xp
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return data.reward
  } catch (error) {
    notify(errorMessage(error, 'Unable to do that task.'), true)
    return null
  }
}

// ---- Quiz ----
// Today's questions, without their answers.
export async function getQuizQuestions() {
  const { data } = await LoginApi.get('/api/quiz')
  return data.questions
}

// Checks one answer. Returns { chosen, correct, isCorrect, fact }.
// Only the first answer to each question counts.
export async function answerQuestion(questionId, answer) {
  const { data } = await LoginApi.post('/api/quiz/answer', { questionId, answer })
  return data
}

export const quizDoneToday = computed(() => game.quiz.doneToday)

// Marks the finished quiz on the server. Pearls are only paid for the first
// quiz of the day, so replaying is just practice.
// Returns { score, total, reward }, or null if the request failed.
export async function finishQuiz() {
  try {
    const { data } = await LoginApi.post('/api/quiz/submit')
    game.pearls = data.pearls
    game.xp = data.xp
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return data
  } catch (error) {
    notify(errorMessage(error, 'Unable to mark the quiz.'), true)
    return null
  }
}

// ---- Achievements ----
// Worked out by the server (GET /api/game/me).
export const achievements = computed(() => game.achievements)

// ---- Formatting helper ----
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}
