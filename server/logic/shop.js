// Buying from the shop. Used by POST /api/game/buy and by
// POST /api/tanks/:id/fish, so a fish can never be added without paying for it.

const User = require('../models/User-model')
const Tank = require('../models/Tank-model')
const Transaction = require('../models/Transaction-model')
const { getSpecies } = require('../data/species')
const { checkCompatibility } = require('./compatibility')
const { simulateTank } = require('./simulation')

const DECOR_FLOOR_Y = 85 // new decorations start on the tank floor (same as game.js)
const MAX_QUANTITY = 10
const EQUIPMENT_POSITIONS = {
  'aquarium-heater': { x: 90, y: 45 },
  'cooling-fan': { x: 75, y: 25 },
  'sponge-filter': { x: 12, y: 60 },
}

// Checks compatibility and pearls, then adds the item to the tank and charges the user.
// Returns { status, body } for the route to send back.
// Fish that do not suit the tank are refused with 409 unless force is true.
async function purchase({ user, tank, item, quantity = 1, force = false, nickname = '' }) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return { status: 400, body: { message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.` } }
  }

  const cost = item.price * quantity
  return User.db.transaction(async (session) => {
    const freshUser = await User.findById(user._id).session(session)
    const freshTank = await Tank.findOne({ _id: tank._id, owner: user._id }).session(session)
    if (!freshUser || !freshTank) return { status: 404, body: { message: 'Tank not found.' } }
    const now = new Date()
    simulateTank(freshTank, now, { settle: true })
    if (item.category === 'equipment' && (quantity !== 1 || freshTank.decorations.some((entry) => entry.itemId === item.id))) {
      return { status: 400, body: { message: 'Only one of each equipment item can be installed in a tank.' } }
    }

    let compatibility = { ok: true, reasons: [] }
    if (item.category === 'fish') {
      compatibility = checkCompatibility(
         getSpecies(item.id),
         freshTank,
        quantity )
      if (!compatibility.ok && force !== true) {
        return {
          status: 409,
          body: {
            message: `${item.name} may not be happy in ${freshTank.name}.`,
            compatible: false,
            reasons: compatibility.reasons,
          },
        }
      }
    }

    const paidUser = await User.findOneAndUpdate(
      { _id: freshUser._id, pearls: { $gte: cost } },
      { $inc: { pearls: -cost } },
      { new: true, session },
    )
    if (!paidUser) {
      return { status: 400, body: { message: `Not enough pearls. You need ${cost - freshUser.pearls} more.` } }
    }

    for (let i = 0; i < quantity; i++) {
      if (item.category === 'fish') {
        freshTank.fish.push({ speciesId: item.id, nickname, addedAt: now })
      } else {
        // Spread out along the floor so new items do not stack on each other.
        const x = 15 + ((freshTank.decorations.length * 23) % 70)
        const position = EQUIPMENT_POSITIONS[item.id] || { x, y: DECOR_FLOOR_Y }
        freshTank.decorations.push({ itemId: item.id, ...position, addedAt: now, installedAt: now })
      }
    }
    await freshTank.save({ session })
    await Transaction.create([{
      user: freshUser._id,
      type: 'purchase',
      label: `${quantity} × ${item.name} for ${freshTank.name}`,
      amount: -cost,
    }], { session })

    return {
      status: 201,
      body: {
        message: `Added ${quantity} × ${item.name} to ${freshTank.name}.`,
        pearls: paidUser.pearls,
        tank: freshTank,
        compatible: compatibility.ok,
        reasons: compatibility.reasons,
      },
    }
  })
}

module.exports = { purchase }
