// Gamification routes: player stats, daily care tasks, the shop and history.

const express = require('express')
const mongoose = require('mongoose')
const User = require('../models/User')
const Tank = require('../models/Tank-model')
const Transaction = require('../models/Transaction')
const Product = require('../models/Product')
const { safeRange } = require('../logic/compatibility')
const { purchase } = require('../logic/shop')
const { simulateTank } = require('../logic/simulation')
const {
  DAILY_TASKS,
  dayKey,
  levelInfo,
  tasksDoneToday,
  currentStreak,
  changePearls,
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

// Helper: one of my tanks, caught up on the time that passed since it was last loaded
async function findMyTank(tankId, userId) {
  if (!mongoose.isValidObjectId(tankId)) return null
  const tank = await Tank.getTankById(tankId, userId)
  if (tank) simulateTank(tank)
  return tank
}

// GET /api/game/me -> pearls, level, tasks done today, quiz streak and achievements
router.get('/me', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const tanks = await Tank.getAllTanks(user._id)
    for (const tank of tanks) if (simulateTank(tank)) await tank.save()

    return res.status(200).json({
      pearls: user.pearls,
      xp: user.xp,
      ...levelInfo(user.xp),
      tasks: DAILY_TASKS.map((task) => ({ ...task, done: tasksDoneToday(user).includes(task.id) })),
      quiz: {
        streak: currentStreak(user),
        doneToday: user.quiz.lastDay === dayKey(),
        scores: user.quiz.scores.slice().reverse(), // newest first
      },
      achievements: achievements(user, tanks),
    })
  } catch (error) {
    console.error('Get player stats failed:', error)
    return res.status(500).json({ message: 'Unable to load your progress. Please try again.' })
  }
})

// POST /api/game/tasks/:taskId  body: { tankId }  (taskId: feed, clean or temp)
// The action always happens, but pearls are only paid the first time each day.
router.post('/tasks/:taskId', async (req, res) => {
  if (!requireLogin(req, res)) return

  const task = DAILY_TASKS.find((t) => t.id === req.params.taskId)
  if (!task) return res.status(400).json({ message: 'Unknown task.' })

  try {
    const user = await User.findById(req.session.userId)
    const tank = await findMyTank(req.body.tankId, req.session.userId)
    if (!user || !tank) return res.status(404).json({ message: 'Tank not found.' })

    let message
    if (task.id === 'feed') {
      for (const fish of tank.fish) if (fish.health > 0) fish.hunger = 0
      message = `Fed the fish in ${tank.name}.`
    } else if (task.id === 'clean') {
      tank.conditions.waterQuality = 100
      message = `${tank.name} is sparkling clean.`
    } else {
      // Move to the middle of the range that suits every fish, if there is one.
      const range = safeRange(tank).temperature
      if (range) {
        tank.conditions.temperature = Math.round((range[0] + range[1]) / 2)
        message = `${tank.name} is now ${tank.conditions.temperature}°C.`
      } else {
        message = `No temperature suits every fish in ${tank.name}. Try moving some fish to another tank.`
      }
    }
    await tank.save()

    let reward = 0
    if (!tasksDoneToday(user).includes(task.id)) {
      if (user.tasks.day !== dayKey()) user.tasks = { day: dayKey(), done: [] }
      user.tasks.done.push(task.id)
      reward = task.reward
      await changePearls(user, { type: 'reward', label: task.label, amount: reward, xp: reward })
    }

    return res.status(200).json({ message, reward, pearls: user.pearls, xp: user.xp, tank })
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
