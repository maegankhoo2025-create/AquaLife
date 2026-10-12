// Fish-care simulation.
// Fish get hungry and the water gets dirty as real time passes. Fish lose health when they are hungry or the water does not suit them, and slowlyrecover when they are well looked after.
// The server does not run a timer. Instead, whenever a tank is loaded, simulateTank() catches it up from tank.lastSimulatedAt to now, one hour at a time.

const { getSpecies } = require('../data/species')

const HOUR = 60 * 60 * 1000
const MAX_HOURS = 7 * 24 // a tank left alone for months only simulates its last week

// Per hour
const HUNGER_PER_HOUR = 2 // unfed fish go from full (0) to starving (100) in about two days
const DIRT_PER_HOUR = 0.5 // water quality lost per hour in an empty tank
const DIRT_PER_FISH_PER_HOUR = 0.1 // plus this much for every fish in it
const HEALTH_RECOVERY_PER_HOUR = 2

// Growth: a well-cared-for fish goes from 0 cm to its adult size (species.size) in about a week.
// Hours where it is unhealthy or hungry do not count, so neglect stunts it.
const HOURS_TO_FULLY_GROW = 7 * 24
const GROW_MIN_HEALTH = 70
const GROW_MAX_HUNGER = 70

// Health lost per hour for each problem a fish has
const DAMAGE = {
  hungry: 1, // hunger 70+
  starving: 3, // hunger 100
  dirtyWater: 1, // water quality below 70
  veryDirtyWater: 2, // water quality below 40
  wrongTemperature: 2,
  wrongPh: 1,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Health lost in one hour by a fish with this hunger in a tank with these conditions.
function hourlyDamage(hunger, conditions, species) {
  let damage = 0

  if (hunger >= 100) damage += DAMAGE.starving
  else if (hunger >= 70) damage += DAMAGE.hungry

  if (conditions.waterQuality < 40) damage += DAMAGE.veryDirtyWater
  else if (conditions.waterQuality < 70) damage += DAMAGE.dirtyWater

  // Unknown species (not in server/data/species.js) skip the range checks
  if (species) {
    const { temperature, ph } = conditions
    if (temperature < species.temp[0] || temperature > species.temp[1]) damage += DAMAGE.wrongTemperature
    if (ph < species.ph[0] || ph > species.ph[1]) damage += DAMAGE.wrongPh
  }

  return damage
}

// Brings a tank up to date. Changes the tank in place and returns true if
// anything changed (so the caller knows whether to save it).
function simulateTank(tank, now = new Date()) {
  const last = tank.lastSimulatedAt ? new Date(tank.lastSimulatedAt) : now
  const hoursPassed = Math.floor((now - last) / HOUR)
  if (hoursPassed < 1) return false

  const hours = Math.min(hoursPassed, MAX_HOURS)
  const conditions = tank.conditions
  const dirtPerHour = DIRT_PER_HOUR + DIRT_PER_FISH_PER_HOUR * tank.fish.length

  for (let i = 0; i < hours; i++) {
    for (const fish of tank.fish) {
      if (fish.health <= 0) continue // dead fish stay dead

      fish.hunger = clamp(fish.hunger + HUNGER_PER_HOUR, 0, 100)

      const species = getSpecies(fish.speciesId)
      const damage = hourlyDamage(fish.hunger, conditions, species)
      if (damage > 0) fish.health = clamp(fish.health - damage, 0, 100)
      else if (fish.hunger < 50) fish.health = clamp(fish.health + HEALTH_RECOVERY_PER_HOUR, 0, 100)

      if (species && fish.health >= GROW_MIN_HEALTH && fish.hunger < GROW_MAX_HUNGER) {
        fish.size = (fish.size || 0) + species.size / HOURS_TO_FULLY_GROW
        if (fish.size > species.size - 0.001) fish.size = species.size // fully grown (avoids 3.9999…)
      }
    }
    conditions.waterQuality = clamp(conditions.waterQuality - dirtPerHour, 0, 100)
  }

  conditions.waterQuality = Math.round(conditions.waterQuality)

  // Only move the clock forward by whole hours, so the leftover minutes count next time.
  // After a very long break, jump straight to now.
  tank.lastSimulatedAt = hoursPassed > MAX_HOURS ? now : new Date(last.getTime() + hours * HOUR)
  return true
}

module.exports = { simulateTank }
