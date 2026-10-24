// Gamification routes: player stats, daily care tasks, the shop and history.

const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User-model')
const Tank = require('../models/Tank-model')
const Friendship = require('../models/Friendship-model')
const Transaction = require('../models/Transaction-model')
const Product = require('../models/Product-model')
const { purchase } = require('../logic/shop')
const { getSpecies } = require('../data/species')
const { safeRange } = require('../logic/compatibility')
const { simulateTank, WATER_CHANGE_DURATION } = require('../logic/simulation')
const {
  DAILY_TASKS,
  QUIZ_STREAK_BONUSES,
  dayKey,
  levelInfo,
  tasksDoneToday,
  currentStreak,
  achievements,
} = require('../logic/gamification')

const router = express.Router()

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Please log in first.' })
    return false
  }
  return true
}

// Purchase reloads the tank inside its transaction before applying elapsed care.
async function findMyTank(tankId, userId) {
  if (!mongoose.isValidObjectId(tankId)) return null
  return Tank.getTankById(tankId, userId)
}

// GET /api/game/me -> pearls, level, tasks done today, quiz streak and achievements
router.get('/me', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const [tanks, friendCount] = await Promise.all([
      Tank.getAllTanks(user._id),
      Friendship.countDocuments({ members: user._id, status: 'accepted' }),
    ])
    for (const tank of tanks) simulateTank(tank) // stats preview only; /tanks owns lazy persistence

    return res.status(200).json({
      pearls: user.pearls,
      xp: user.xp,
      ...levelInfo(user.xp),
      tasks: DAILY_TASKS.map((task) => ({ ...task, done: tasksDoneToday(user).includes(task.id) })),
      quiz: {
        streak: currentStreak(user),
        doneToday: user.quiz.lastDay === dayKey(),
        scores: user.quiz.scores.slice().reverse(), // newest first
        milestones: Object.entries(QUIZ_STREAK_BONUSES).map(([days, reward]) => ({
          days: Number(days), reward,
        })),
      },
      achievements: achievements(user, tanks, friendCount),
    })
  } catch (error) {
    console.error('Get player stats failed:', error)
    return res.status(500).json({ message: 'Unable to load your progress. Please try again.' })
  }
})

const CARE_WINDOW_DAYS = 14

// The same seven checks shown on the dashboard, computed from saved tanks.
function careChecks(user, tanks, today) {
  let fishCount = 0
  let livingCount = 0
  let healthyCount = 0
  let fedCount = 0
  let stockedCount = 0
  let safeTemperatureCount = 0
  let safePhCount = 0
  let cleanCount = 0
  let compatibleCount = 0

  for (const tank of tanks) {
    const living = tank.fish.filter((fish) => fish.health > 0)
    const species = living.map((fish) => getSpecies(fish.speciesId))
    fishCount += tank.fish.length
    livingCount += living.length
    healthyCount += tank.fish.filter((fish) => fish.health >= 70).length
    fedCount += living.filter((fish) => fish.hunger < 50).length
    if (!living.length) continue

    stockedCount += 1
    const known = species.every(Boolean)
    const range = safeRange(tank)
    if (known && range.temperature && tank.conditions.temperature >= range.temperature[0] &&
        tank.conditions.temperature <= range.temperature[1]) safeTemperatureCount += 1
    if (known && range.ph && tank.conditions.ph >= range.ph[0] && tank.conditions.ph <= range.ph[1]) safePhCount += 1
    if (tank.conditions.waterQuality >= 70) cleanCount += 1
    // Aggressive fish cannot share a stocked tank with non-aggressive fish.
    const aggressive = species.filter((entry) => entry?.temperament === 'aggressive').length
    if (known && (aggressive === 0 || aggressive === species.length)) compatibleCount += 1
  }

  const tracking = livingCount > 0
  const checkedToday = user.tasks.day === today && user.tasks.done.includes('temp')
  return [
    { id: 'health', label: 'Healthy fish', met: tracking && healthyCount === fishCount, evidence: `${healthyCount} / ${fishCount} fish at 70% health or higher.` },
    { id: 'fed', label: 'Fish fed', met: tracking && fedCount === livingCount, evidence: `${fedCount} / ${livingCount} living fish below 50% hunger.` },
    { id: 'temperature', label: 'Suitable temperature', met: tracking && safeTemperatureCount === stockedCount, evidence: `${safeTemperatureCount} / ${stockedCount} stocked tanks in range.` },
    { id: 'ph', label: 'Suitable pH', met: tracking && safePhCount === stockedCount, evidence: `${safePhCount} / ${stockedCount} stocked tanks in range.` },
    { id: 'water', label: 'Clean water', met: tracking && cleanCount === stockedCount, evidence: `${cleanCount} / ${stockedCount} stocked tanks at 70% water quality or higher.` },
    { id: 'tankmates', label: 'Compatible tankmates', met: tracking && compatibleCount === stockedCount, evidence: `${compatibleCount} / ${stockedCount} stocked tanks without aggressive and peaceful fish mixed.` },
    { id: 'daily', label: 'Daily check', met: tracking && checkedToday, evidence: checkedToday ? 'Thermometer checked today.' : 'Check the thermometer today.' },
  ]
}

// Daily snapshots make progress about consistency over two weeks, not one visit.
function careHistory(user, today) {
  const saved = new Map(user.careLog.map((entry) => [entry.day, entry]))
  const days = []
  const cursor = new Date(`${today}T00:00:00+08:00`)
  for (let index = CARE_WINDOW_DAYS - 1; index >= 0; index--) {
    const day = dayKey(new Date(cursor.getTime() - index * 24 * 60 * 60 * 1000))
    const entry = saved.get(day)
    days.push({ day, met: entry?.met ?? 0, total: entry?.total ?? 7, recorded: Boolean(entry) })
  }
  const percent = Math.round(days.reduce((sum, entry) => sum + entry.met / entry.total, 0) / days.length * 100)
  let streak = 0
  for (let index = days.length - 1; index >= 0 && days[index].recorded && days[index].met === days[index].total; index--) streak += 1
  return { windowDays: CARE_WINDOW_DAYS, percent, streak, days }
}

function recordCareDay(user, tanks, now) {
  const today = dayKey(now)
  const checks = careChecks(user, tanks, today)
  const met = checks.filter((check) => check.met).length
  const previous = user.careLog.find((entry) => entry.day === today)
  if (!previous || previous.met !== met || previous.total !== checks.length) {
    user.careLog = [
      ...user.careLog.filter((entry) => entry.day !== today),
      { day: today, met, total: checks.length },
    ].sort((a, b) => a.day.localeCompare(b.day)).slice(-31)
  }
  return { today: { day: today, met, total: checks.length, checks }, ...careHistory(user, today) }
}

// GET /api/game/care -> today's checks plus the persisted 14-day consistency window
router.get('/care', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const result = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      if (!user) return null
      const now = new Date()
      const tanks = await Tank.find({ owner: user._id }).session(session)
      for (const tank of tanks) simulateTank(tank, now)
      const progress = recordCareDay(user, tanks, now)
      if (user.isModified()) await user.save({ session })
      return progress
    })
    if (!result) return res.status(404).json({ message: 'User not found.' })
    return res.status(200).json(result)
  } catch (error) {
    console.error('Get care progress failed:', error)
    return res.status(500).json({ message: 'Unable to load care progress. Please try again.' })
  }
})

// POST /api/game/tasks/:taskId  body: { tankId }  (taskId: feed, clean, temp or ph)
// The action always happens, but pearls are only paid the first time each day.
router.post('/tasks/:taskId', async (req, res) => {
  if (!requireLogin(req, res)) return

  const task = DAILY_TASKS.find((t) => t.id === req.params.taskId)
  if (!task) return res.status(400).json({ message: 'Unknown task.' })

  try {
    if (!mongoose.isValidObjectId(req.body.tankId)) {
      return res.status(404).json({ message: 'Tank not found.' })
    }
    const result = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      const tank = await Tank.findOne({ _id: req.body.tankId, owner: req.session.userId }).session(session)
      if (!user || !tank) return null
      const now = new Date()
      simulateTank(tank, now, { settle: true })

      let message
      if (task.id === 'feed') {
        if (!tank.fish.some((fish) => fish.health > 0)) {
          return { status: 400, message: 'There are no living fish to feed in this tank.', tank }
        }
        for (const fish of tank.fish) if (fish.health > 0) fish.hunger = 0
        message = `Fed the fish in ${tank.name}.`
      } else if (task.id === 'clean') {
        const currentJob = tank.maintenance?.waterChange
        if (currentJob?.endsAt && new Date(currentJob.endsAt) > now) {
          return { status: 409, message: 'A water change is already running. Wait for it to finish.', tank }
        }
        const amount = Math.min(25, tank.targets.waterQuality - tank.conditions.waterQuality)
        if (amount <= 0) {
          return { status: 400, message: 'Water quality is already at or above your goal.', tank }
        }
        tank.set('maintenance.waterChange', {
          startedAt: now, endsAt: new Date(now.getTime() + WATER_CHANGE_DURATION), amount, delivered: 0,
        })
        message = `Started a 30-minute partial water change in ${tank.name}.`
      } else if (task.id === 'temp') {
        message = `Checked ${tank.name}: ${tank.conditions.temperature.toFixed(1)}°C. Installed equipment controls temperature.`
      } else {
        message = `Checked ${tank.name}: pH ${tank.conditions.ph.toFixed(2)}.`
      }
      await tank.save({ session })

      let reward = 0
      const today = dayKey(now)
      if (user.tasks.day !== today || !user.tasks.done.includes(task.id)) {
        if (user.tasks.day !== today) user.tasks = { day: today, done: [] }
        user.tasks.done.push(task.id)
        reward = task.reward
        user.pearls += reward
        user.xp += reward
        await Transaction.create([{
          user: user._id, type: 'reward', label: task.label, amount: reward,
        }], { session })
      }
      const tanks = await Tank.find({ owner: user._id }).session(session)
      for (const ownedTank of tanks) simulateTank(ownedTank, now)
      recordCareDay(user, tanks, now)
      if (user.isModified()) await user.save({ session })
      return { message, reward, pearls: user.pearls, xp: user.xp, tank }
    })
    if (!result) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(result.status || 200).json(result)
  } catch (error) {
    console.error('Task failed:', error)
    return res.status(500).json({ message: 'Unable to do that task. Please try again.' })
  }
})

// POST /api/game/buy  body: { itemId, tankId, quantity?, force? }
// Fish that do not suit the tank are refused with status 409 and the reasons,
// unless force: true is sent ("Add anyway" in ConflictModal.vue).
router.post('/buy', async (req, res) => {
  if (!requireLogin(req, res)) return

  // Look up the shop item in MongoDB by its slug, e.g. 'neon-tetra'
  const item = await Product.getProductBySlug(req.body.itemId)
  if (!item) return res.status(400).json({ message: 'Unknown shop item.' })

  const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity)

  try {
    const user = await User.findById(req.session.userId)
    const tank = await findMyTank(req.body.tankId, req.session.userId)
    if (!user || !tank) return res.status(404).json({ message: 'Tank not found.' })

    const { status, body } = await purchase({ user, tank, item, quantity, force: req.body.force })
    return res.status(status).json(body)
  } catch (error) {
    console.error('Buy failed:', error)
    return res.status(500).json({ message: 'Unable to complete the purchase. Please try again.' })
  }
})

// GET /api/game/history -> my purchases and rewards, newest first
router.get('/history', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const history = await Transaction.find({ user: req.session.userId }).sort({ date: -1 }).limit(200)
    return res.status(200).json({ history })
  } catch (error) {
    console.error('Get history failed:', error)
    return res.status(500).json({ message: 'Unable to load your history. Please try again.' })
  }
})

module.exports = router
