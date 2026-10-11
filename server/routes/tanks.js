

const express = require('express')
const Tank = require('../models/Tank')

const router = express.Router()

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.json({ message: 'Please log in first.' })
    return false
  }
  return true
}

// Helper: find a tank that belongs to the logged-in user
async function findMyTank(req) {
  return Tank.findOne({ _id: req.params.id, owner: req.session.userId })
}

// GET /api/tanks -> list my tanks (Tank 1, Tank 2, ...)
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tanks = await Tank.find({ owner: req.session.userId }).sort({ createdAt: 1 })
    return res.json({ tanks: tanks })
  } catch (error) {
    console.error('Get tanks failed:', error)
    return res.json({ message: 'Unable to load your tanks. Please try again.' })
  }
})

// GET /api/tanks/:id -> one tank
router.get('/:id', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tank = await findMyTank(req)
    if (!tank) return res.json({ message: 'Tank not found.' })
    return res.json({ tank: tank })
  } catch (error) {
    console.error('Get tank failed:', error)
    return res.json({ message: 'Tank not found.' })
  }
})

// POST /api/tanks  body: { name } -> create a tank
router.post('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  const name = req.body.name
  if (typeof name !== 'string' || !name.trim()) {
    return res.json({ message: 'Please enter a tank name.' })
  }

  try {
    // temperature, pH and water quality get default values from Tank.js
    const tank = new Tank({ owner: req.session.userId, name: name.trim() })
    await tank.save()
    return res.json({ message: 'Tank created.', tank: tank })
  } catch (error) {
    console.error('Create tank failed:', error)
    return res.json({ message: 'Unable to create the tank. Please try again.' })
  }
})

// PATCH /api/tanks/:id/conditions  body: { temperature?, ph?, waterQuality? }
router.patch('/:id/conditions', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tank = await findMyTank(req)
    if (!tank) return res.json({ message: 'Tank not found.' })

    // Only update the values that were sent
    const fields = ['temperature', 'ph', 'waterQuality']
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field])
        if (Number.isNaN(value)) {
          return res.json({ message: field + ' must be a number.' })
        }
        tank.conditions[field] = value
      }
    }

    await tank.save() // Tank.js min/max rules are checked here
    return res.json({ message: 'Conditions updated.', tank: tank })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.json({ message: 'That value is outside the allowed range.' })
    }
    console.error('Update conditions failed:', error)
    return res.json({ message: 'Unable to update the conditions. Please try again.' })
  }
})

// POST /api/tanks/:id/fish  body: { speciesId, nickname? } -> add a fish
router.post('/:id/fish', async (req, res) => {
  if (!requireLogin(req, res)) return

  const speciesId = req.body.speciesId
  const nickname = req.body.nickname
  if (typeof speciesId !== 'string' || !speciesId.trim()) {
    return res.json({ message: 'Please choose a fish species.' })
  }

  try {
    const tank = await findMyTank(req)
    if (!tank) return res.json({ message: 'Tank not found.' })

    // Later: Jaimin's compatibility check can run here before adding
    tank.fish.push({
      speciesId: speciesId.trim(),
      nickname: typeof nickname === 'string' ? nickname.trim() : '',
    })
    await tank.save()
    return res.json({ message: 'Fish added.', tank: tank })
  } catch (error) {
    console.error('Add fish failed:', error)
    return res.json({ message: 'Unable to add the fish. Please try again.' })
  }
})

// DELETE /api/tanks/:id/fish/:fishId -> remove a fish
router.delete('/:id/fish/:fishId', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tank = await findMyTank(req)
    if (!tank) return res.json({ message: 'Tank not found.' })

    const fish = tank.fish.id(req.params.fishId)
    if (!fish) return res.json({ message: 'Fish not found.' })

    fish.deleteOne()
    await tank.save()
    return res.json({ message: 'Fish removed.', tank: tank })
  } catch (error) {
    console.error('Remove fish failed:', error)
    return res.json({ message: 'Unable to remove the fish. Please try again.' })
  }
})

// DELETE /api/tanks/:id -> delete a tank
router.delete('/:id', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const result = await Tank.deleteOne({ _id: req.params.id, owner: req.session.userId })
    if (result.deletedCount === 0) return res.json({ message: 'Tank not found.' })
    return res.json({ message: 'Tank deleted.' })
  } catch (error) {
    console.error('Delete tank failed:', error)
    return res.json({ message: 'Unable to delete the tank. Please try again.' })
  }
})

module.exports = router