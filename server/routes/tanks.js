

const express = require('express')
const Tank = require('../models/Tank-model')

const router = express.Router()

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.json({ message: 'Please log in first.' })
    return false
  }
  return true
}



// GET /api/tanks -> list my tanks (Tank 1, Tank 2, ...)
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tanks = await Tank.getAllTanks(req.session.userId)
    return res.status(200).json({ tanks })
  } catch (error) {
    console.error('Get tanks failed:', error)
    return res.status(500).json({ message: 'Unable to load your tanks. Please try again.' })
  }
})

// GET /api/tanks/:id -> one tank
router.get('/:id', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tank = await Tank.getTankById(req.params.id, req.session.userId)
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(200).json({ tank })
  } catch (error) {
    console.error('Get tank failed:', error)
    return res.status(500).json({ message: 'Unable to load the tank. Please try again.' })
  }
})


// POST /api/tanks  body: { name } -> create a tank
router.post('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  const name = req.body.name
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Please enter a tank name.' })
  }

  try {
    const tank = await Tank.createTank({
      owner: req.session.userId,
      name: name.trim(),
    })
    return res.status(201).json({ message: 'Tank created.', tank })
  } catch (error) {
    console.error('Create tank failed:', error)
    return res.status(500).json({ message: 'Unable to create the tank. Please try again.' })
  }
})


// PATCH /tanks/:id/conditions
// Updates one or more water conditions (temperature, pH, water quality) of a tank.
// PATCH means "partial update": the frontend only sends the fields it wants to change.
router.patch('/:id/conditions', async (req, res) => {
  // Stop here if the user isn't logged in.
  // requireLogin sends the error response itself, so we just return.
  if (!requireLogin(req, res)) return

  try {
    // The only fields this route is allowed to change.
    // Anything else in the request body (e.g. "name" or "owner") is ignored.
    const fields = ['temperature', 'ph', 'waterQuality']

    // We'll collect the changes here before saving them.
    const updates = {}

    // Go through each allowed field one at a time.
    for (const field of fields) {
      // Only handle fields the frontend actually sent.
      if (req.body[field] !== undefined) {
        // Convert the value to a number (e.g. "25" from a form becomes 25).
        const value = Number(req.body[field])

        // If it can't be turned into a number (e.g. "abc"), reject the request.
        if (Number.isNaN(value)) {
          return res.status(400).json({ message: field + ' must be a number.' })
        }

        // conditions is a nested object in the schema, so we use "dot notation"
        // ('conditions.temperature') to update just that one field inside it.
        // Writing { conditions: { temperature: 25 } } instead would wipe out ph and waterQuality.
        updates['conditions.' + field] = value
      }
    }

    // Nothing valid was sent, so there's nothing to update.
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No conditions to update.' })
    }

    // Save the changes to MongoDB. This only updates the tank if it has this id
    // AND belongs to the logged-in user (req.session.userId).
    // It returns the updated tank, or null if no matching tank was found.
    const tank = await Tank.updateTank(req.params.id, req.session.userId, updates)

    // No tank found: wrong id, or the tank belongs to someone else.
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })

    // Success: send back a message plus the updated tank so the frontend can refresh.
    return res.status(200).json({ message: 'Conditions updated.', tank })
  } catch (error) {
    // The schema has min/max rules (e.g. pH between 0 and 14).
    // If a value breaks those rules, Mongoose throws a ValidationError.
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'That value is outside the allowed range.' })
    }

    // Any other unexpected problem (e.g. database down): log it for us, and give the user a general message.
    console.error('Update conditions failed:', error)
    return res.status(500).json({ message: 'Unable to update the conditions. Please try again.' })
  }
})

// POST /api/tanks/:id/fish  body: { speciesId, nickname? } -> add a fish
router.post('/:id/fish', async (req, res) => {
  if (!requireLogin(req, res)) return

  const speciesId = req.body.speciesId
  const nickname = req.body.nickname
  if (typeof speciesId !== 'string' || !speciesId.trim()) {
    return res.status(400).json({ message: 'Please choose a fish species.' })
  }
      // Later: Jaimin's compatibility check can run here before adding the fish
  try {
    const tank = await Tank.addFish(req.params.id, req.session.userId, {
      speciesId: speciesId.trim(),
      nickname: typeof nickname === 'string' ? nickname.trim() : '',
    })
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(201).json({ message: 'Fish added.', tank })
  } catch (error) {
    console.error('Add fish failed:', error)
    return res.status(500).json({ message: 'Unable to add the fish. Please try again.' })
  }
})


// DELETE /api/tanks/:id/fish/:fishId -> remove a fish
router.delete('/:id/fish/:fishId', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const before = await Tank.getTankById(req.params.id, req.session.userId)
    if (!before) return res.status(404).json({ message: 'Tank not found.' })

    const fish = before.fish.id(req.params.fishId)
    if (!fish) return res.status(404).json({ message: 'Fish not found.' })

    const tank = await Tank.removeFish(req.params.id, req.session.userId, req.params.fishId)
    return res.status(200).json({ message: 'Fish removed.', tank })
  } catch (error) {
    console.error('Remove fish failed:', error)
    return res.status(500).json({ message: 'Unable to remove the fish. Please try again.' })
  }
})

// DELETE /api/tanks/:id -> delete a tank
router.delete('/:id', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tank = await Tank.deleteTank(req.params.id, req.session.userId)
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(200).json({ message: 'Tank deleted.' })
  } catch (error) {
    console.error('Delete tank failed:', error)
    return res.status(500).json({ message: 'Unable to delete the tank. Please try again.' })
  }
})

module.exports = router