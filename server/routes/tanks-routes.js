

const express = require('express')
const mongoose = require('mongoose')
const Tank = require('../models/Tank-model')
const User = require('../models/User-model')
const { getSpecies } = require('../data/species')
const Product = require('../models/Product-model')
const { checkCompatibility, idealConditions, isFreshTank, resetTank } = require('../logic/compatibility')
const Transaction = require('../models/Transaction-model')
const { purchase } = require('../logic/shop')
const { simulateTank, loadOwnedTank } = require('../logic/simulation')

const router = express.Router()

// Reject malformed IDs before Mongoose tries to cast them.
for (const field of ['id', 'fishId', 'decorationId']) {
  router.param(field, (req, res, next, value) => {
    if (!mongoose.isValidObjectId(value)) {
      return res.status(400).json({ message: 'Please choose a valid tank or item.' })
    }
    next()
  })
}

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Please log in first.' })
    return false
  }
  return true
}



// GET /api/tanks -> list my tanks (Tank 1, Tank 2, ...)
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const tanks = await Tank.db.transaction(async (session) => {
      const owned = await Tank.find({ owner: req.session.userId }).sort({ createdAt: 1 }).session(session)
      const now = new Date()
      for (const tank of owned) {
        if (simulateTank(tank, now)) await tank.save({ session })
      }
      return owned
    })
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
    const tank = await loadOwnedTank(req.params.id, req.session.userId)
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
    const tank = await loadOwnedTank(req.params.id, req.session.userId)
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })

    const { ok, reasons } = checkCompatibility(species, tank)
    return res.status(200).json({ compatible: ok, reasons })
  } catch (error) {
    console.error('Compatibility check failed:', error)
    return res.status(500).json({ message: 'Unable to check compatibility. Please try again.' })
  }
})


// POST /api/tanks  body: { name, forItemId? } -> create a tank
router.post('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  const name = req.body.name
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Please enter a tank name.' })
  }
  if (name.trim().length > 40) {
    return res.status(400).json({ message: 'Tank names can have up to 40 characters.' })
  }

  // Optional: forItemId sets up the new tank for one fish species,
  // with its water and goals in the middle of that fish's safe range.
  const newTank = { owner: req.session.userId, name: name.trim() }
  if (req.body.forItemId !== undefined) {
    const species = getSpecies(req.body.forItemId)
    if (!species) return res.status(400).json({ message: 'Unknown fish species.' })
    newTank.conditions = idealConditions(species)
    newTank.targets = idealConditions(species)
  }

  try {
    const tank = await Tank.createTank(newTank)
    return res.status(201).json({ message: 'Tank created.', tank })
  } catch (error) {
    console.error('Create tank failed:', error)
    return res.status(500).json({ message: 'Unable to create the tank. Please try again.' })
  }
})


// PATCH /api/tanks/:id/targets -> chosen goals, not the actual water conditions
router.patch('/:id/targets', async (req, res) => {
  if (!requireLogin(req, res)) return

  const limits = {
    temperature: [15, 35],
    ph: [5, 9],
    waterQuality: [0, 100],
  }
  const updates = {}
  for (const field of Object.keys(limits)) {
    if (req.body[field] === undefined) continue
    const value = req.body[field]
    const [min, max] = limits[field]
    if (!Number.isFinite(value) || value < min || value > max) {
      return res.status(400).json({ message: `${field} must be a number from ${min} to ${max}.` })
    }
    updates['targets.' + field] = value
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No targets to update.' })
  }

  try {
    const tank = await Tank.db.transaction(async (session) => {
      const current = await Tank.findOne({ _id: req.params.id, owner: req.session.userId }).session(session)
      if (!current) return null
      simulateTank(current, new Date(), { settle: true })
      for (const [field, value] of Object.entries(updates)) current.set(field, value)
      await current.save({ session })
      return current
    })
    if (!tank) return res.status(404).json({ message: 'Tank not found.' })
    return res.status(200).json({ message: 'Targets updated.', tank })
  } catch (error) {
    console.error('Update targets failed:', error)
    return res.status(500).json({ message: 'Unable to update the targets. Please try again.' })
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
  if (nickname !== undefined && (typeof nickname !== 'string' || nickname.trim().length > 20)) {
    return res.status(400).json({ message: 'Nicknames must be text with up to 20 characters.' })
  }

  // Same slug as the shop, e.g. 'guppy'
  const item = await Product.getProductBySlug(speciesId.trim())
  if (!item || item.category !== 'fish') return res.status(400).json({ message: 'Unknown fish species.' })

  try {
    const user = await User.findById(req.session.userId)
    const tank = await Tank.getTankById(req.params.id, req.session.userId)
    if (!user || !tank) return res.status(404).json({ message: 'Tank not found.' })

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

router.patch('/:id/fish/:fishId', async (req, res) => {
  if (!requireLogin(req, res)) return
  const updates = {}
  if (req.body.nickname !== undefined) {
    if (typeof req.body.nickname !== 'string' || req.body.nickname.trim().length > 20) {
      return res.status(400).json({ message: 'Nicknames must be text with up to 20 characters.' })
    }
    updates['fish.$.nickname'] = req.body.nickname.trim()
  }
  if (req.body.notes !== undefined) {
    if (typeof req.body.notes !== 'string' || req.body.notes.length > 2000) {
      return res.status(400).json({ message: 'Notes must be text with up to 2000 characters.' })
    }
    updates['fish.$.notes'] = req.body.notes
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Please enter a nickname or notes to save.' })
  }
  try {
    const tank = await Tank.db.transaction(async (session) => {
      const current = await Tank.findOne({ _id: req.params.id, owner: req.session.userId }).session(session)
      if (!current) return null
      simulateTank(current, new Date(), { settle: true })
      const fish = current.fish.id(req.params.fishId)
      if (!fish) return null
      if (updates['fish.$.nickname'] !== undefined) fish.nickname = updates['fish.$.nickname']
      if (updates['fish.$.notes'] !== undefined) fish.notes = updates['fish.$.notes']
      await current.save({ session })
      return current
    })
    if (!tank) return res.status(404).json({ message: 'Fish not found.' })
    return res.json({ tank })
  } catch (error) {
    return res.status(400).json({ message: 'Unable to save the fish details.' })
  }
})

router.patch('/:id/decorations/:decorationId', async (req, res) => {
  if (!requireLogin(req, res)) return
  const { x, y } = req.body
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 6 || x > 94 || y < 25 || y > 90) {
    return res.status(400).json({ message: 'Invalid decoration position.' })
  }
  try {
    const tank = await Tank.db.transaction(async (session) => {
      const current = await Tank.findOne({ _id: req.params.id, owner: req.session.userId }).session(session)
      if (!current) return null
      simulateTank(current, new Date(), { settle: true })
      const decoration = current.decorations.id(req.params.decorationId)
      if (!decoration) return null
      decoration.x = x
      decoration.y = y
      await current.save({ session })
      return current
    })
    if (!tank) return res.status(404).json({ message: 'Decoration not found.' })
    return res.json({ tank })
  } catch (error) {
    return res.status(400).json({ message: 'Unable to save the decoration position.' })
  }
})


// DELETE /api/tanks/:id/fish/:fishId -> remove a fish
// A living fish is sold back: its shop price is refunded in pearls.
// A dead fish (health 0) is just removed, with no refund.
router.delete('/:id/fish/:fishId', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const result = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      const tank = await Tank.findOne({ _id: req.params.id, owner: req.session.userId }).session(session)
      if (!user || !tank) return { status: 404, body: { message: 'Tank not found.' } }

      // A fish that died while the user was away has no resale value.
      simulateTank(tank, new Date(), { settle: true })
      const fish = tank.fish.id(req.params.fishId)
      if (!fish) return { status: 404, body: { message: 'Fish not found.' } }
      const item = await Product.findOne({ id: fish.speciesId }).session(session)
      const refund = fish.health > 0 && item ? item.price : 0

      fish.deleteOne()
      // Nothing left alive and nothing changing the water: start again like a new tank.
      if (isFreshTank(tank)) resetTank(tank)
      await tank.save({ session })
      let pearls = user.pearls
      if (refund > 0) {
        const refundedUser = await User.findByIdAndUpdate(
          user._id, { $inc: { pearls: refund } }, { new: true, session },
        )
        pearls = refundedUser.pearls
        await Transaction.create([{
          user: user._id,
          type: 'refund',
          label: `${item.name} removed from ${tank.name}`,
          amount: refund,
        }], { session })
      }
      return { status: 200, body: { message: 'Fish removed.', tank, refund, pearls } }
    })
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Remove fish failed:', error)
    return res.status(500).json({ message: 'Unable to remove the fish. Please try again.' })
  }
})

// DELETE /api/tanks/:id/decorations/:decorationId -> remove a plant or decoration
// It is sold back: its shop price is refunded in pearls, the same as a living fish.
router.delete('/:id/decorations/:decorationId', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const result = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      const tank = await Tank.findOne({ _id: req.params.id, owner: req.session.userId }).session(session)
      if (!user || !tank) return { status: 404, body: { message: 'Tank not found.' } }

      // Keep the pH reached so far, then stop this item's future effects.
      simulateTank(tank, new Date(), { settle: true })
      const decoration = tank.decorations.id(req.params.decorationId)
      if (!decoration) return { status: 404, body: { message: 'Decoration not found.' } }
      const item = await Product.findOne({ id: decoration.itemId }).session(session)
      const refund = item ? item.price : 0
      const name = item ? item.name : 'Decoration'

      decoration.deleteOne()
      if (isFreshTank(tank)) resetTank(tank)
      await tank.save({ session })
      let pearls = user.pearls
      if (refund > 0) {
        const refundedUser = await User.findByIdAndUpdate(
          user._id, { $inc: { pearls: refund } }, { new: true, session },
        )
        pearls = refundedUser.pearls
        await Transaction.create([{
          user: user._id,
          type: 'refund',
          label: `${name} removed from ${tank.name}`,
          amount: refund,
        }], { session })
      }
      return { status: 200, body: { message: `${name} removed.`, tank, refund, pearls } }
    })
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Remove decoration failed:', error)
    return res.status(500).json({ message: 'Unable to remove the decoration. Please try again.' })
  }
})

// DELETE /api/tanks/:id -> delete a tank
// Every account keeps its first (oldest) tank, and a tank with living fish cannot be
// deleted. Installed plants, equipment and decorations are refunded at their shop
// price; dead fish are removed with no refund.
router.delete('/:id', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const result = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      const owned = await Tank.find({ owner: req.session.userId }).sort({ createdAt: 1 }).session(session)
      const tank = owned.find((entry) => entry._id.equals(req.params.id))
      if (!user || !tank) return { status: 404, body: { message: 'Tank not found.' } }
      if (tank._id.equals(owned[0]._id)) {
        return { status: 400, body: { message: 'Your first tank cannot be deleted.' } }
      }

      // A fish that died while the user was away no longer blocks the delete.
      simulateTank(tank, new Date(), { settle: true })
      if (tank.fish.some((fish) => fish.health > 0)) {
        return { status: 409, body: { message: 'Remove the living fish before deleting this tank.' } }
      }

      let refund = 0
      for (const decoration of tank.decorations) {
        const item = await Product.findOne({ id: decoration.itemId }).session(session)
        if (item) refund += item.price
      }

      await Tank.deleteOne({ _id: tank._id }).session(session)
      let pearls = user.pearls
      if (refund > 0) {
        const refundedUser = await User.findByIdAndUpdate(
          user._id, { $inc: { pearls: refund } }, { new: true, session },
        )
        pearls = refundedUser.pearls
        await Transaction.create([{
          user: user._id,
          type: 'refund',
          label: `Items refunded from ${tank.name} (tank deleted)`,
          amount: refund,
        }], { session })
      }
      return { status: 200, body: { message: `${tank.name} deleted.`, refund, pearls } }
    })
    return res.status(result.status).json(result.body)
  } catch (error) {
    console.error('Delete tank failed:', error)
    return res.status(500).json({ message: 'Unable to delete the tank. Please try again.' })
  }
})

module.exports = router