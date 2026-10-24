// The game store: one reactive object holding the player's pearls, tanks,
// history and quiz progress, plus the functions that change them.
//
// Pages never call the backend directly. They import from this file, and the
// functions here talk to the Express server through LoginApi.

import { computed, reactive, watch } from 'vue'
import LoginApi from '../LoginApi'
import { DAILY_TASKS } from '../data/mock'

// Starts empty. loadShop() fills this from GET /api/products after login.
const shopItems = reactive([])

const STORAGE_KEY = 'aqualife-prefs-v1'
const XP_PER_LEVEL = 200
const POSITION_SAVE_DELAY = 400

// Display and goal-input limits match server/models/Tank-model.js.
export const CONDITION_LIMITS = {
  temperature: { min: 15, max: 35, step: 1, unit: '°C', label: 'Temperature' },
  ph: { min: 5, max: 9, step: 0.1, unit: '', label: 'pH' },
  waterQuality: { min: 0, max: 100, step: 1, unit: '%', label: 'Water quality' },
}

export function conditionReading(value, condition) {
  if (!Number.isFinite(value)) return 'Unavailable'
  return Number(value.toFixed(condition === 'ph' ? 2 : 1))
}
const SAFE_WATER_QUALITY = [70, 100]

// Decorations are placed in percentages of the tank (0 = left/top, 100 = right/bottom).
// The limits stop them being dragged out of view.
const DECOR_LIMITS = { minX: 6, maxX: 94, minY: 25, maxY: 90 }

// Everything except settings and the selected tank comes from the server.
function freshState() {
  return {
    user: { id: null, name: 'Aquarist', email: '', avatar: '' },
    pearls: 0,
    xp: 0,
    currentTankId: null,
    tanks: [],
    history: [],
    tasksDone: [], // "taskId:tankId" for each daily task already rewarded today
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

// ---- Low pearl warning ----
// Below this balance the navbar turns orange and the player gets a warning.
export const LOW_PEARLS = 100
export const lowOnPearls = computed(() => game.user.id !== null && game.pearls < LOW_PEARLS)

// Warn once, at the moment the balance drops below LOW_PEARLS (for example after buying).
watch(
  () => game.pearls,
  (newPearls, oldPearls) => {
    if (oldPearls >= LOW_PEARLS && newPearls < LOW_PEARLS) {
      notify("Oh no, you're running out of pearls! Do your care tasks and the daily quiz to earn more.", true)
    }
  },
)

// The server's message for a failed request, or a general one if the server is unreachable.
function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

// ---- User ----
// Called by the router guard with the user returned by GET /auth/session.
export function setUser(user) {
  if (user) game.user = { id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' }
}
export async function saveProfile(changes) {
  const { data } = await LoginApi.patch('/auth/profile', changes)
  setUser(data.user)
  return data
}


const pendingPositions = {}
let tankRevision = 0
let pendingTankWrites = 0
const tankRefreshes = {}
const lastTankRefresh = {}

function beginTankWrite() {
  tankRevision += 1
  pendingTankWrites += 1
}

function endTankWrite() {
  pendingTankWrites -= 1
}
// ---- Loading from the server ----
// MongoDB ids are called _id. Pages use .id, so copy it across once here.
function fromServer(tank) {
  return {
    ...tank,
    conditions: { ...tank.conditions },
    targets: { ...tank.targets },
    id: tank._id,
    fish: tank.fish.map((fish) => ({
      ...fish,
      id: fish._id,
    })),
    decorations: tank.decorations.map((decoration) => ({
      ...decoration,
      id: decoration._id,
      ...pendingPositions[decoration._id],
    })),
  }
}

// Replace one tank with the updated copy the server sent back.
function putTank(serverTank) {
  tankRevision += 1
  const tank = fromServer(serverTank)
  const index = game.tanks.findIndex((t) => t.id === tank.id)
  if (index >= 0) game.tanks[index] = tank
  else game.tanks.push(tank)
}

function applyStats(me) {
  game.pearls = me.pearls
  game.xp = me.xp
  game.tasksDone = me.tasksDone || []
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
  const revision = tankRevision
  const [me, tanks, history] = await Promise.all([
    LoginApi.get('/api/game/me'),
    LoginApi.get('/api/tanks'),
    LoginApi.get('/api/game/history'),
    loadShop(),
  ])

  let tankList = tanks.data.tanks
  if (tankList.length === 0) {
    const created = await LoginApi.post('/api/tanks', { name: 'Tank 1' })
    tankList = [created.data.tank]
  }

  applyStats(me.data)
  applyHistory(history.data.history)
  if (revision === tankRevision && !pendingTankWrites) {
    game.tanks = tankList.map(fromServer)
    tankRevision += 1
  }
  if (!game.tanks.some((tank) => tank.id === game.currentTankId)) {
    game.currentTankId = game.tanks[0]?.id || null
  }
}

export const care = reactive({ userId: null, today: null, percent: 0, streak: 0, windowDays: 14, days: [] })

// Reads the server's saved daily snapshots so progress reflects days and weeks.
export async function loadCare() {
  const userId = game.user.id
  if (!userId) return
  if (care.userId !== userId) {
    Object.assign(care, { userId, today: null, percent: 0, streak: 0, windowDays: 14, days: [] })
  }
  const { data } = await LoginApi.get('/api/game/care')
  if (game.user.id !== userId) return
  care.today = data.today
  care.percent = data.percent
  care.streak = data.streak
  care.windowDays = data.windowDays
  care.days = data.days
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

//code to get shop item data from mongodb
// Turn one Mongo product into the shape the shop pages already use.
function forShop(product) {
  return {
    id: product.id, // slug like 'neon-tetra', not Mongo's _id
    category: product.category,
    name: product.name,
    sci: product.sci,
    price: product.price,
    temperament: product.temperament,
    effect: product.effect ?? null,
    care: product.care,
    temp: product.temp,
    ph: product.ph,
    size: product.size,
    blurb: product.blurb,
  }
}

// Ask the server for every shop item and put them in shopItems.
export async function loadShop() {
  try {
    const response = await LoginApi.get('/api/products')
    const products = response.data.products || []

    // Empty the old list, then add each product.
    shopItems.splice(0, shopItems.length)

    for (let i = 0; i < products.length; i++) {
      shopItems.push(forShop(products[i]))
    }
  } catch (error) {
    console.error('Unable to load the shop:', error)
  }
}
//end of code to get shop data from MongoDB

export function getItems() {
  return shopItems
}

export function getItem(id) {
  return shopItems.find(item => item.id === id)
}

export async function loadSpeciesInfo() {
  const fishItems = shopItems.filter(item => item.category === 'fish')

  for (const item of fishItems) {
    if (item.speciesInfo) continue

    try {
      const { data } = await LoginApi.get('/api/species', {
        params: { name: item.sci },
      })

      item.speciesInfo = data
    } catch (error) {
      console.error(`Unable to load ${item.sci}:`, error)
    }
  }
}

// ---- Tanks ----
export const currentTank = computed(
  () => game.tanks.find((tank) => tank.id === game.currentTankId) || game.tanks[0],
)

export function getTank(id) {
  return game.tanks.find((tank) => tank.id === id)
}

// Only refresh the visible tank. A read started before an edit must not replace it.
export async function refreshTank(tankId, { force = false } = {}) {
  if (!tankId || tankId !== currentTank.value?.id || pendingTankWrites || tankRefreshes[tankId]) return
  if (typeof document !== 'undefined' && document.hidden) return
  if (!force && Date.now() - (lastTankRefresh[tankId] || 0) < 60000) return
  lastTankRefresh[tankId] = Date.now()
  const revision = tankRevision
  const userId = game.user.id
  tankRefreshes[tankId] = true
  try {
    const { data } = await LoginApi.get(`/api/tanks/${tankId}`)
    if (revision === tankRevision && !pendingTankWrites && userId === game.user.id) putTank(data.tank)
  } catch (error) {
    console.error('Unable to refresh the tank:', error)
  } finally {
    delete tankRefreshes[tankId]
  }
}

// The first free "Tank N" name, e.g. "Tank 2" when the player has one tank.
export function nextTankName() {
  let number = game.tanks.length + 1
  while (game.tanks.some((tank) => tank.name === `Tank ${number}`)) number += 1
  return `Tank ${number}`
}

// forItemId (optional): set the new tank's water up for this fish species.
// Returns { ok, tankId } or { ok: false, message }.
export async function createTank(name, forItemId) {
  beginTankWrite()
  try {
    const body = { name: name.trim() }
    if (forItemId) body.forItemId = forItemId
    const { data } = await LoginApi.post('/api/tanks', body)
    putTank(data.tank)
    game.currentTankId = data.tank._id
    return { ok: true, tankId: data.tank._id }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to create the tank.') }
  } finally {
    endTankWrite()
  }
}

// The different species living in a tank (each species listed once).
// Dead fish (health 0) are left out: they cannot clash with new fish.
export function tankSpecies(tank) {
  const living = tank.fish.filter((fish) => fish.health > 0)
  const ids = [...new Set(living.map((fish) => fish.speciesId))]
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

// Saving a goal changes the plan, never the current reading.
export async function saveGoals(tankId, goals) {
  beginTankWrite()
  try {
    const { data } = await LoginApi.patch(`/api/tanks/${tankId}/targets`, goals)
    putTank(data.tank)
    return { ok: true }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to save the tank goals.') }
  } finally {
    endTankWrite()
  }
}

export async function saveFish(tankId, fishId, changes) {
  beginTankWrite()
  try {
    const { data } = await LoginApi.patch(`/api/tanks/${tankId}/fish/${fishId}`, changes)
    putTank(data.tank)
    return { ok: true }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to save the fish details.') }
  } finally {
    endTankWrite()
  }
}

// Removes a fish from a tank for good (DELETE /api/tanks/:id/fish/:fishId).
// The server sends back the tank without that fish. A living fish is refunded
// its shop price; a dead one is not. Returns { ok, message, refund }.
export async function removeFish(tankId, fishId) {
  beginTankWrite()
  try {
    const { data } = await LoginApi.delete(`/api/tanks/${tankId}/fish/${fishId}`)
    putTank(data.tank)
    game.pearls = data.pearls
    // Achievements count the fish, and a refund adds to the history.
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return { ok: true, message: data.message, refund: data.refund }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to remove the fish.') }
  } finally {
    endTankWrite()
  }
}

// Removes a plant or decoration from a tank (DELETE /api/tanks/:id/decorations/:decorationId).
// Its shop price is refunded. Returns { ok, message, refund }.
export async function removeDecoration(tankId, decorationId) {
  beginTankWrite()
  try {
    const { data } = await LoginApi.delete(`/api/tanks/${tankId}/decorations/${decorationId}`)
    putTank(data.tank)
    game.pearls = data.pearls
    // A refund adds to the history.
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return { ok: true, message: data.message, refund: data.refund }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to remove the decoration.') }
  } finally {
    endTankWrite()
  }
}

// Removes every dead fish (health 0) from a tank, one DELETE request per fish.
// Returns { ok, message, removed } where removed is how many were taken out.
export async function removeDeadFish(tankId) {
  beginTankWrite()
  const dead = getTank(tankId).fish.filter((fish) => fish.health <= 0)
  let removed = 0
  try {
    for (const fish of dead) {
      const { data } = await LoginApi.delete(`/api/tanks/${tankId}/fish/${fish.id}`)
      putTank(data.tank)
      game.pearls = data.pearls
      removed += 1
    }
    return { ok: true, message: `Removed ${removed} dead fish.`, removed }
  } catch (error) {
    return { ok: false, message: errorMessage(error, 'Unable to remove the dead fish.'), removed }
  } finally {
    endTankWrite()
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
  }
}

// Save the final position after dragging stops.
const positionTimers = {}

export function moveDecoration(tankId, decorationId, x, y) {
  const decoration = getTank(tankId).decorations.find((d) => d.id === decorationId)
  if (!decoration) return
  const changes = {
    x: Math.round(Math.min(DECOR_LIMITS.maxX, Math.max(DECOR_LIMITS.minX, x))),
    y: Math.round(Math.min(DECOR_LIMITS.maxY, Math.max(DECOR_LIMITS.minY, y))),
  }
  Object.assign(decoration, changes)
  pendingPositions[decorationId] = changes
  tankRevision += 1
  clearTimeout(positionTimers[decorationId])
  positionTimers[decorationId] = setTimeout(async () => {
    beginTankWrite()
    try {
      await LoginApi.patch(`/api/tanks/${tankId}/decorations/${decorationId}`, changes)
    } catch (error) {
      notify(errorMessage(error, 'Unable to save the decoration position.'), true)
    } finally {
      endTankWrite()
      if (pendingPositions[decorationId] === changes) delete pendingPositions[decorationId]
      tankRevision += 1
    }
  }, POSITION_SAVE_DELAY)
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
      `${tank.name} is ${conditionReading(temperature, 'temperature')}°C, but ${item.name} needs ${item.temp[0]}–${item.temp[1]}°C.`,
    )
  }
  if (ph < item.ph[0] || ph > item.ph[1]) {
    reasons.push(`${tank.name} has pH ${conditionReading(ph, 'ph')}, but ${item.name} needs pH ${item.ph[0]}–${item.ph[1]}.`)
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

// ---- Care items ----
// Shop items that move a condition in one direction, e.g. careItems('ph', 'lower').
// The server describes each item's effect: which condition it changes and by how much per hour.
// A positive rate raises the condition and a negative rate lowers it.
// Plants have no rate (null) but help water quality, so they count as "raise".
export function careItems(condition, direction) {
  return shopItems.filter((item) => {
    const effect = item.effect
    if (!effect || effect.condition !== condition) return false
    if (direction === 'raise') return effect.ratePerHour === null || effect.ratePerHour > 0
    return effect.ratePerHour < 0
  })
}

// How many of this item are already in the tank (equipment is limited to one).
export function countInTank(tank, itemId) {
  return tank.decorations.filter((decoration) => decoration.itemId === itemId).length
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
  beginTankWrite()
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
  } finally {
    endTankWrite()
  }
}

// ---- Daily care tasks ----
// The four daily tasks for one tank. Each tank has its own, so feeding
// Tank 1 does not count for Tank 2. done = already rewarded today for this tank.
export function getTasks(tankId) {
  return DAILY_TASKS.map((task) => ({ ...task, done: game.tasksDone.includes(`${task.id}:${tankId}`) }))
}

// Only tanks with living fish earn pearls for care, so only they have tasks to do.
export function tanksNeedingCare() {
  return game.tanks.filter((tank) => tank.fish.some((fish) => fish.health > 0))
}

// The care animation playing right now (food dropping, bubbles, thermometer).
// TankScene.vue watches this and draws it over the matching tank.
// "run" goes up by one each time, so doing the same task twice restarts the animation.
const EFFECT_TIME = 2600 // ms; a little longer than the longest animation in TankScene.vue
export const tankEffect = reactive({ tankId: null, type: null, run: 0 })
let effectTimer

function playEffect(tankId, type) {
  tankEffect.tankId = tankId
  tankEffect.type = type // 'feed', 'clean' or 'temp' (same as the task ids)
  tankEffect.run += 1
  clearTimeout(effectTimer)
  effectTimer = setTimeout(() => (tankEffect.type = null), EFFECT_TIME)
}

// Feed, start a water change or check temperature. Rewards are paid once a day.
// Returns the pearls earned, or null if the request failed.
export async function doTask(taskId, tankId) {
  beginTankWrite()
  try {
    const { data } = await LoginApi.post(`/api/game/tasks/${taskId}`, { tankId })
    putTank(data.tank)
    if (taskId !== 'ph') playEffect(tankId, taskId)
    game.pearls = data.pearls
    game.xp = data.xp
    refreshStats().catch((error) => console.error('Unable to refresh stats:', error))
    return data.reward
  } catch (error) {
    notify(errorMessage(error, 'Unable to do that task.'), true)
    return null
  } finally {
    endTankWrite()
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
