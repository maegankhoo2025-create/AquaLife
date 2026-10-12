// Buying from the shop. Used by POST /api/game/buy and by
// POST /api/tanks/:id/fish, so a fish can never be added without paying for it.

const { getSpecies } = require('../data/species')
const { checkCompatibility } = require('./compatibility')
const { changePearls } = require('./gamification')

const DECOR_FLOOR_Y = 85 // new decorations start on the tank floor (same as game.js)
const MAX_QUANTITY = 10

// Checks compatibility and pearls, then adds the item to the tank and charges the user.
// Returns { status, body } for the route to send back.
// Fish that do not suit the tank are refused with 409 unless force is true.
async function purchase({ user, tank, item, quantity = 1, force = false, nickname = '' }) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return { status: 400, body: { message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.` } }
  }

  let compatibility = { ok: true, reasons: [] }
  if (item.category === 'fish') {
    compatibility = checkCompatibility(getSpecies(item.id), tank)
    if (!compatibility.ok && force !== true) {
      return {
        status: 409,
        body: {
          message: `${item.name} may not be happy in ${tank.name}.`,
          compatible: false,
          reasons: compatibility.reasons,
        },
      }
    }
  }

  const cost = item.price * quantity
  if (cost > user.pearls) {
    return { status: 400, body: { message: `Not enough pearls. You need ${cost - user.pearls} more.` } }
  }

  for (let i = 0; i < quantity; i++) {
    if (item.category === 'fish') {
      tank.fish.push({ speciesId: item.id, nickname })
    } else {
      // Spread out along the floor so new items do not stack on each other.
      const x = 15 + ((tank.decorations.length * 23) % 70)
      tank.decorations.push({ itemId: item.id, x, y: DECOR_FLOOR_Y })
    }
  }
  await tank.save()
  await changePearls(user, {
    type: 'purchase',
    label: `${quantity} × ${item.name} for ${tank.name}`,
    amount: -cost,
  })

  return {
    status: 201,
    body: {
      message: `Added ${quantity} × ${item.name} to ${tank.name}.`,
      pearls: user.pearls,
      tank,
      compatible: compatibility.ok,
      reasons: compatibility.reasons,
    },
  }
}

module.exports = { purchase }
