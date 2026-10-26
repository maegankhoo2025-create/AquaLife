// Fish compatibility check.
// Server copy of checkCompatibility / safeRange in client/src/stores/game.js.

const { getSpecies } = require('../data/species')

// Same limits as the condition bars in server/models/Tank-model.js.
const CONDITION_LIMITS = {
  temperature: { min: 15, max: 35 },
  ph: { min: 5, max: 9 },
}
const SAFE_WATER_QUALITY = [70, 100]

// The different species living in a tank (each species listed once).
// Dead fish (health 0) are left out: they cannot clash with new fish.
function tankSpecies(tank) {
  const living = tank.fish.filter((fish) => fish.health > 0)
  const ids = [...new Set(living.map((fish) => fish.speciesId))]
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
function checkCompatibility(species, tank, quantity = 1) {
  const reasons = []

  if (!species) {
    return {
      ok: false,
      reasons: ['Fish information is unavailable. Please refresh and try again.'],
    }
  }

  const { temperature, ph } = tank.conditions

  if (temperature < species.temp[0] || temperature > species.temp[1]) {
    reasons.push(
      `${tank.name} is ${Number(temperature.toFixed(1))}°C, but ${species.name} needs ${species.temp[0]}–${species.temp[1]}°C.`
    )
  }

  if (ph < species.ph[0] || ph > species.ph[1]) {
    reasons.push(
      `${tank.name} has pH ${Number(ph.toFixed(2))}, but ${species.name} needs pH ${species.ph[0]}–${species.ph[1]}.`
    )
  }

  const hasFlag = (fish, flag) =>
    fish.behaviourFlags?.includes(flag) ?? false

  const tankMates = tankSpecies(tank)
  const otherSpecies = tankMates.filter(mate => mate.id !== species.id)

  // Keep the existing aggressive-fish warnings.
  if (species.temperament === 'aggressive') {
    const victims = otherSpecies.filter(
      mate => mate.temperament !== 'aggressive'
    )

    if (victims.length > 0) {
      reasons.push(
        `${species.name} is aggressive and may attack: ${
          victims.map(mate => mate.name).join(', ')
        }.`
      )
    }
  } else {
    const bullies = otherSpecies.filter(
      mate => mate.temperament === 'aggressive'
    )

    if (bullies.length > 0) {
      reasons.push(
        `${species.name} may be attacked by aggressive tank mates: ${
          bullies.map(mate => mate.name).join(', ')
        }.`
      )
    }
  }

  // Predation is separate from the temperament label.
  // This is a caution, not a prediction based on actual fish sizes.
  if (
    hasFlag(species, 'may-eat-small-fish') &&
    otherSpecies.length > 0
  ) {
    reasons.push(
      `${species.name} may eat smaller fish. Review sizes before combining with: ${
        otherSpecies.map(mate => mate.name).join(', ')
      }.`
    )
  }

  const predators = otherSpecies.filter(
    mate => hasFlag(mate, 'may-eat-small-fish')
  )

  if (predators.length > 0) {
    reasons.push(
      `Review sizes before adding ${species.name}: ${
        predators.map(mate => mate.name).join(', ')
      } may eat smaller fish.`
    )
  }

  // Do not skip warnings just because both fish are the same species.
  const existingCount = tank.fish.filter(
    fish => fish.health > 0 && fish.speciesId === species.id
  ).length

  if (
    hasFlag(species, 'same-species-danger') &&
    existingCount + quantity > 1
  ) {
    reasons.push(
      `Keeping multiple ${species.name} together can cause serious fighting, especially between males. Separate tanks are recommended.`
    )
  }

  return { ok: reasons.length === 0, reasons }
}

module.exports = { checkCompatibility, safeRange, tankSpecies }
