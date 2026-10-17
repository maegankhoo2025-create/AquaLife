

const express = require('express')
const Tank = require('../models/Tank-model')
const User = require('../models/User-model')
const { getSpecies } = require('../data/species')
const Product = require('../models/Product-model')
const { checkCompatibility } = require('../logic/compatibility')
const { changePearls } = require('../logic/gamification')
const { purchase } = require('../logic/shop')
const { simulateTank } = require('../logic/simulation')

const router = express.Router()

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.json({ message: 'Please log in first.' })
    return false
  }
  return true
}

// Helper: catch a tank up on the time that passed since it was last loaded
// (hunger, health, water quality) and save it if anything changed
async function simulateAndSave(tank) {
  if (tank && simulateTank(tank)) await tank.save()
  return tank
}


// GET /api/tanks -> list my tanks (Tank 1, Tank 2, ...)
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tanks = await Tank.getAllTanks(req.session.userId)
    for (const tank of tanks) await simulateAndSave(tank)
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
    const tank = await simulateAndSave(await Tank.getTankById(req.params.id, req.session.userId))
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(200).json({ tank })
  } catch (error) {
    console.error('Get tank failed:', error)
    return res.status(500).json({ message: 'Unable to load the tank. Please try again.' })
  }
})

// GET /api/tanks/:id/compatibility/:speciesId -> would this fish suit this tank?
router.get('/:id/compatibility/:speciesId', async (req, res) => {
  if (!requireLogin(req, res)) return

  const species = getSpecies(req.params.speciesId)
  if (!species) return res.status(400).json({ message: 'Unknown fish species.' })

  try {
    const tank = await Tank.getTankById(req.params.id, req.session.userId)
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })

    const { ok, reasons } = checkCompatibility(species, tank)
    return res.status(200).json({ compatible: ok, reasons })
  } catch (error) {
    console.error('Compatibility check failed:', error)
    return res.status(500).json({ message: 'Unable to check compatibility. Please try again.' })
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

    // Catch the tank up first, so the hours before this change are simulated with the old conditions rather than the new ones.
    await simulateAndSave(await Tank.getTankById(req.params.id, req.session.userId))

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

// POST /api/tanks/:id/fish  body: { speciesId, nickname?, force? } -> buy a fish for this tank
// The fish costs pearls (its shop price), the same as POST /api/game/buy.
// If it does not suit the tank, nothing is bought and the reasons are sent back
// with status 409. Send force: true to buy it anyway ("Add anyway" in ConflictModal.vue).
router.post('/:id/fish', async (req, res) => {
  if (!requireLogin(req, res)) return

  const speciesId = req.body.speciesId
  const nickname = req.body.nickname
  if (typeof speciesId !== 'string' || !speciesId.trim()) {
    return res.status(400).json({ message: 'Please choose a fish species.' })
  }

  // Same slug as the shop, e.g. 'guppy'
  const item = await Product.getProductBySlug(speciesId.trim())
  if (!item || item.category !== 'fish') return res.status(400).json({ message: 'Unknown fish species.' })

  try {
    const user = await User.findById(req.session.userId)
    const tank = await Tank.getTankById(req.params.id, req.session.userId)
    if (!user || !tank) return res.status(404).json({ message: 'Tank not found.' })
    simulateTank(tank)

    const { status, body } = await purchase({
      user,
      tank,
      item,
      force: req.body.force,
      nickname: typeof nickname === 'string' ? nickname.trim() : '',
    })
    return res.status(status).json(body)
  } catch (error) {
    console.error('Add fish failed:', error)
    return res.status(500).json({ message: 'Unable to add the fish. Please try again.' })
  }
})


// DELETE /api/tanks/:id/fish/:fishId -> remove a fish
// A living fish is sold back: its shop price is refunded in pearls.
// A dead fish (health 0) is just removed, with no refund.
router.delete('/:id/fish/:fishId', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const user = await User.findById(req.session.userId)
    const before = await Tank.getTankById(req.params.id, req.session.userId)
    if (!user || !before) return res.status(404).json({ message: 'Tank not found.' })

    // Catch the tank up first, so a fish that died while the user was away is not refunded.
    await simulateAndSave(before)

    const fish = before.fish.id(req.params.fishId)
    if (!fish) return res.status(404).json({ message: 'Fish not found.' })

    // Price comes from MongoDB so a Compass price change is refunded correctly
    const item = await Product.getProductBySlug(fish.speciesId)
    const refund = fish.health > 0 && item ? item.price : 0
    
    const tank = await Tank.removeFish(req.params.id, req.session.userId, req.params.fishId)
    if (refund > 0) {
      await changePearls(user, {
        type: 'refund',
        label: `${item.name} removed from ${before.name}`,
        amount: refund,
      })
    }

    return res.status(200).json({ message: 'Fish removed.', tank, refund, pearls: user.pearls })
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