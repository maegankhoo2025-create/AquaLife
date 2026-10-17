// Fish compatibility check.
// Server copy of checkCompatibility / safeRange in client/src/stores/game.js.

const { getSpecies } = require('../data/species')

// Same limits as the condition sliders in server/models/Tank-model.js
const CONDITION_LIMITS = {
  temperature: { min: 15, max: 35 },
  ph: { min: 5, max: 9 },
}
const SAFE_WATER_QUALITY = [70, 100]

// The different species living in a tank (each species listed once).
function tankSpecies(tank) {
  const ids = [...new Set(tank.fish.map((fish) => fish.speciesId))]
  return ids.map(getSpecies).filter(Boolean)
}

// The range of each condition that suits every fish in the tank at once.
// A value is null when the fish have no range in common.
function safeRange(tank) {
  const species = tankSpecies(tank)

  function overlap(key, rangeField) {
    const limits = CONDITION_LIMITS[key]
    const low = Math.max(limits.min, ...species.map((s) => s[rangeField][0]))
    const high = Math.min(limits.max, ...species.map((s) => s[rangeField][1]))
    return low <= high ? [low, high] : null
  }

  return {
    temperature: overlap('temperature', 'temp'),
    ph: overlap('ph', 'ph'),
    waterQuality: SAFE_WATER_QUALITY,
  }
}

// Would this species be happy in this tank?
// Returns { ok, reasons } where reasons is a list of sentences explaining each problem.
function checkCompatibility(species, tank) {
  const reasons = []

  const { temperature, ph } = tank.conditions
  if (temperature < species.temp[0] || temperature > species.temp[1]) {
    reasons.push(
      `${tank.name} is ${temperature}°C, but ${species.name} needs ${species.temp[0]}–${species.temp[1]}°C.`,
    )
  }
  if (ph < species.ph[0] || ph > species.ph[1]) {
    reasons.push(`${tank.name} has pH ${ph}, but ${species.name} needs pH ${species.ph[0]}–${species.ph[1]}.`)
  }

  // An aggressive fish cannot share a tank with fish that are not aggressive.
  const tankMates = tankSpecies(tank).filter((mate) => mate.id !== species.id)
  if (species.temperament === 'aggressive') {
    const victims = tankMates.filter((mate) => mate.temperament !== 'aggressive')
    if (victims.length > 0) {
      const names = victims.map((mate) => mate.name).join(', ')
      reasons.push(`${species.name} is aggressive and may attack: ${names}.`)
    }
  } else {
    const bullies = tankMates.filter((mate) => mate.temperament === 'aggressive')
    if (bullies.length > 0) {
      const names = bullies.map((mate) => mate.name).join(', ')
      reasons.push(`${species.name} may be attacked by aggressive tank mates: ${names}.`)
    }
  }

  return { ok: reasons.length === 0, reasons }
}

module.exports = { checkCompatibility, safeRange, tankSpecies }
