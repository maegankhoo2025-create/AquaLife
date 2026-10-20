// Lazy, fixed-minute game simulation. Reads carry the unfinished minute forward.
const { getSpecies } = require('../data/species')
const { getItem } = require('../data/items')
const { CARE_RULES, THERMAL_RULES, PLANT_REDUCTION, PLANT_MAX_COUNTED } = require('../data/equipment')

const HOUR = 60 * 60 * 1000
const MINUTE = 60 * 1000
const MAX_ELAPSED = 7 * 24 * HOUR
const WATER_CHANGE_DURATION = 30 * MINUTE
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const timestamp = (value, fallback = 0) => value ? new Date(value).getTime() : fallback

function itemCounts(tank, at) {
  const counts = new Map()
  for (const decoration of tank.decorations || []) {
    if (timestamp(decoration.addedAt || decoration.installedAt) <= at) {
      counts.set(decoration.itemId, (counts.get(decoration.itemId) || 0) + 1)
    }
  }
  return counts
}

function wasteRate(counts, fishCount) {
  let plants = 0
  for (const [id, count] of counts) if (getItem(id)?.category === 'plant') plants += count
  return (0.5 + 0.1 * fishCount) * (1 - PLANT_REDUCTION * Math.min(PLANT_MAX_COUNTED, plants))
}

function conditionMethod(condition, value, target, counts) {
  let rate = 0
  const sources = []
  for (const [id, rule] of Object.entries(CARE_RULES)) {
    const count = Math.min(rule.maxCount, counts.get(id) || 0)
    if (!count || rule.condition !== condition) continue
    sources.push({ id, name: getItem(id)?.name || id, count })
    rate += rule.ratePerHour * count
  }
  return { rate, sources }
}

function temperatureMethod(value, target, counts) {
  const { roomTemperature: room, ambientPerHour: coefficient, tolerance } = THERMAL_RULES
  const heater = CARE_RULES['aquarium-heater']
  const fan = CARE_RULES['cooling-fan']
  const hasHeater = (counts.get('aquarium-heater') || 0) > 0
  const hasFan = (counts.get('cooling-fan') || 0) > 0
  const floor = Math.max(fan.limit, room - THERMAL_RULES.fanBelowRoom)
  const ambient = coefficient * (room - value)
  const atGoal = Math.abs(value - target) <= tolerance
  let power = 0
  let holding = false
  let heaterRunning = false
  let fanRunning = false
  if (atGoal) {
    if (ambient < 0 && hasHeater && target <= heater.limit) {
      power = heater.ratePerHour
      holding = ambient + power >= 0
    } else if (ambient > 0 && hasFan && target >= floor) {
      power = fan.ratePerHour
      holding = ambient + power <= 0
    } else holding = Math.abs(ambient) < 1e-12
  } else if (value < target && hasHeater && value <= heater.limit) {
    power = heater.ratePerHour
    heaterRunning = value < heater.limit - tolerance
  } else if (value > target && hasFan && value >= floor - tolerance) {
    power = fan.ratePerHour
    holding = Math.abs(value - floor) <= tolerance && ambient + power <= 0
    fanRunning = value > floor + tolerance
  }
  const lower = hasFan ? Math.max(floor, room + fan.ratePerHour / coefficient) : room
  const upper = hasHeater ? Math.min(heater.limit, room + heater.ratePerHour / coefficient) : room
  return {
    coefficient: holding ? 0 : coefficient,
    equilibrium: holding ? value : room + power / coefficient,
    rate: holding ? 0 : ambient + power,
    endpoint: clamp(target, lower, upper),
    boundaries: [target, floor, heater.limit],
    sources: conditionMethod('temperature', value, target, counts).sources,
    fanRunning: !holding && fanRunning, heaterRunning: !holding && heaterRunning,
  }
}

function phMethod(value, counts) {
  let coefficient = 0
  let weightedLimit = 0
  let total = 0
  let totalWeightedLimit = 0
  const boundaries = []
  const sources = []
  for (const [id, rule] of Object.entries(CARE_RULES)) {
    const count = Math.min(rule.maxCount, counts.get(id) || 0)
    if (!count || rule.condition !== 'ph') continue
    const strength = Math.abs(rule.ratePerHour) * count
    sources.push({ id, name: getItem(id)?.name || id, count })
    total += strength
    totalWeightedLimit += strength * rule.limit
    boundaries.push(rule.limit)
    if (rule.ratePerHour < 0 ? value >= rule.limit : value <= rule.limit) {
      coefficient += strength
      weightedLimit += strength * rule.limit
    }
  }
  const equilibrium = coefficient ? weightedLimit / coefficient : value
  let endpoint = total ? totalWeightedLimit / total : value
  // Materials only act on their own side of the limit; they do not undo overshoot.
  if (total && sources.every((source) => CARE_RULES[source.id].ratePerHour < 0)) endpoint = Math.min(value, endpoint)
  if (total && sources.every((source) => CARE_RULES[source.id].ratePerHour > 0)) endpoint = Math.max(value, endpoint)
  return { coefficient, equilibrium, rate: coefficient * (equilibrium - value), endpoint, boundaries, sources }
}

function crossingTime(value, target, method) {
  if (!method.coefficient || value === method.equilibrium) return null
  const ratio = (target - method.equilibrium) / (value - method.equilibrium)
  return ratio > 0 && ratio < 1 ? -Math.log(ratio) / method.coefficient : null
}

// A trajectory has only the thermostat/material boundaries, not a fish simulation.
function nextBoundary(value, method) {
  let result = null
  for (const boundary of method.boundaries) {
    if (Math.abs(boundary - value) < 1e-10) continue
    const hours = crossingTime(value, boundary, method)
    if (hours !== null && (!result || hours < result.hours)) result = { value: boundary, hours }
  }
  return result
}

function conditionStep(value, hours, methodFor) {
  for (let phase = 0; phase < 6 && hours > 0; phase++) {
    const method = methodFor(value)
    const boundary = nextBoundary(value, method)
    if (!boundary || boundary.hours >= hours) {
      return method.equilibrium + (value - method.equilibrium) * Math.exp(-method.coefficient * hours)
    }
    value = boundary.value
    hours -= boundary.hours
  }
  return value
}

function conditionHours(value, target, methodFor) {
  let elapsed = 0
  for (let phase = 0; phase < 6; phase++) {
    const method = methodFor(value)
    const hours = crossingTime(value, target, method)
    const boundary = nextBoundary(value, method)
    if (hours !== null && (!boundary || hours <= boundary.hours)) return elapsed + hours
    if (!boundary) return null
    value = boundary.value
    elapsed += boundary.hours
  }
  return null
}

function hourlyDamage(hunger, conditions, species) {
  let damage = hunger >= 100 ? 3 : hunger >= 70 ? 1 : 0
  damage += conditions.waterQuality < 40 ? 2 : conditions.waterQuality < 70 ? 1 : 0
  if (species) {
    if (conditions.temperature < species.temp[0] || conditions.temperature > species.temp[1]) damage += 2
    if (conditions.ph < species.ph[0] || conditions.ph > species.ph[1]) damage += 1
  }
  return damage
}

function waterChangeRate(job) {
  return job?.startedAt && job?.endsAt && job.amount > 0
    ? job.amount / ((timestamp(job.endsAt) - timestamp(job.startedAt)) / HOUR)
    : 0
}

function waterStep(value, target, filter, waste, supply, hours) {
  const rate = filter + supply - waste
  if (value > target) return Math.max(target, value - waste * hours)
  if (rate >= 0) return Math.min(target, value + rate * hours)
  return Math.max(0, value + rate * hours)
}

// settle is used only at state changes, so new goals/items never affect old elapsed time.
function simulateTank(tank, now = new Date(), { settle = false } = {}) {
  const end = timestamp(now)
  const previous = timestamp(tank.lastSimulatedAt, end)
  if (end <= previous) return false
  const elapsed = end - previous
  const until = settle ? end : previous + Math.floor(elapsed / MINUTE) * MINUTE
  if (until <= previous) return false
  const start = Math.max(previous, until - MAX_ELAPSED)
  const counts = itemCounts(tank, start)
  const fish = (tank.fish || []).map((entry) => ({
    entry, species: getSpecies(entry.speciesId), addedAt: timestamp(entry.addedAt),
  }))
  let fishCount = fish.filter((entry) => entry.addedAt <= start).length
  const events = []
  for (const decoration of tank.decorations || []) {
    const at = timestamp(decoration.addedAt || decoration.installedAt)
    if (at > start && at < until) events.push({ at, id: decoration.itemId })
  }
  for (const entry of fish) if (entry.addedAt > start && entry.addedAt < until) events.push({ at: entry.addedAt, fish: true })
  const job = tank.maintenance?.waterChange
  for (const at of [timestamp(job?.startedAt), timestamp(job?.endsAt)]) {
    if (at > start && at < until) events.push({ at })
  }
  events.sort((a, b) => a.at - b.at)
  let eventIndex = 0
  let waste = wasteRate(counts, fishCount)
  const conditions = tank.conditions
  let waterMethod = conditionMethod('waterQuality', conditions.waterQuality, tank.targets?.waterQuality ?? 100, counts)
  const temperatureTarget = tank.targets?.temperature ?? 25
  for (let at = start; at < until;) {
    let changedItems = false
    while (events[eventIndex]?.at <= at) {
      const event = events[eventIndex++]
      if (event.id) { counts.set(event.id, (counts.get(event.id) || 0) + 1); changedItems = true }
      if (event.fish) fishCount++
      waste = wasteRate(counts, fishCount)
    }
    if (changedItems) waterMethod = conditionMethod('waterQuality', conditions.waterQuality, tank.targets?.waterQuality ?? 100, counts)
    const nextMinute = start + (Math.floor((at - start) / MINUTE) + 1) * MINUTE
    const next = Math.min(until, nextMinute, events[eventIndex]?.at ?? Infinity)
    const hours = (next - at) / HOUR
    for (const { entry, species, addedAt } of fish) {
      if (entry.health <= 0 || addedAt > at) continue
      entry.hunger = clamp(entry.hunger + 2 * hours, 0, 100)
      const damage = hourlyDamage(entry.hunger, conditions, species)
      if (damage > 0) entry.health = clamp(entry.health - damage * hours, 0, 100)
      else if (entry.hunger < 50) entry.health = clamp(entry.health + 2 * hours, 0, 100)
      if (species && entry.health >= 70 && entry.hunger < 70) {
        entry.size = Math.min(species.size, (entry.size || 0) + species.size / (7 * 24) * hours)
      }
    }
    conditions.temperature = conditionStep(conditions.temperature, hours, (value) => temperatureMethod(value, temperatureTarget, counts))
    conditions.ph = conditionStep(conditions.ph, hours, (value) => phMethod(value, counts))
    let supply = 0
    if (job && timestamp(job.startedAt) <= at && timestamp(job.endsAt) > at) {
      const delivered = Math.min(Math.max(0, job.amount - (job.delivered || 0)), waterChangeRate(job) * hours)
      job.delivered = (job.delivered || 0) + delivered
      supply = delivered / hours
    }
    conditions.waterQuality = waterStep(conditions.waterQuality, tank.targets?.waterQuality ?? 100,
      waterMethod.rate, waste, supply, hours)
    at = next
  }
  tank.lastSimulatedAt = new Date(until)
  return true
}

function forecast(value, target, methodFor, asOf, field) {
  const method = methodFor(value)
  const tolerance = field === 'temperature' ? THERMAL_RULES.tolerance : 1e-8
  const reached = Math.abs(value - target) <= tolerance
  const holding = reached && Math.abs(method.rate) < 1e-10
  const hours = reached ? null : conditionHours(value, target, methodFor)
  const seconds = hours === null ? null : Math.ceil(hours * 60 - 1e-8) * 60
  const continues = Math.abs(method.endpoint - target) > tolerance
  let message
  if (field === 'temperature') {
    const room = `${THERMAL_RULES.roomTemperature}°C room`
    if (holding) message = method.sources.length ? `At your goal. The thermostat balances drift toward the ${room} automatically.` : `At your goal, matching the ${room}.`
    else if (hours !== null && !continues) message = `Room drift and automatic equipment control are included in this estimate. The room is ${THERMAL_RULES.roomTemperature}°C.`
    else if (hours !== null || reached) message = `Water can pass this goal, but the installed equipment cannot hold it against the ${room}.`
    else message = `Water settles near ${method.endpoint.toFixed(1)}°C with the ${room} and installed equipment. This goal is not crossed, so there is no arrival estimate.`
  } else if (holding) {
    message = method.sources.length ? 'The installed materials are balanced at your goal.' : 'At your goal. No installed material is changing pH.'
  } else if ((hours !== null || reached) && continues) {
    message = `Installed materials continue past your goal toward a balance near pH ${method.endpoint.toFixed(2)}. Remove or rebalance them to stop further change.`
  } else if (hours !== null) {
    message = 'The estimate includes buffering and opposing materials; effects slow near their limits.'
  } else if (!method.sources.length) {
    message = 'No installed material is changing pH. Removing a material does not undo the pH already reached.'
  } else if (Math.abs(method.rate) < 1e-10) {
    message = `Installed materials are balanced or at their limits near pH ${method.endpoint.toFixed(2)}. They cannot move toward this goal.`
  } else {
    message = `Installed materials move toward a balance near pH ${method.endpoint.toFixed(2)}, not your goal. A balance is approached gradually, not crossed.`
  }
  return {
    status: holding ? 'holding' : hours !== null || reached && Math.abs(method.rate) > 1e-10 ? 'changing' : method.sources.length || Math.abs(method.rate) > 1e-10 ? 'limited' : 'idle',
    ratePerHour: method.rate,
    target, effectiveTarget: method.endpoint,
    etaSeconds: seconds,
    estimatedAt: seconds === null ? null : new Date(asOf + seconds * 1000).toISOString(),
    sources: method.sources, message,
    ...(field === 'temperature' ? { fanRunning: method.fanRunning, heaterRunning: method.heaterRunning } : {}),
  }
}

function tankProgression(tank) {
  const asOf = timestamp(tank.lastSimulatedAt, Date.now())
  const counts = itemCounts(tank, asOf)
  const conditions = tank.conditions
  const targets = { temperature: tank.targets?.temperature ?? 25, ph: tank.targets?.ph ?? 7, waterQuality: tank.targets?.waterQuality ?? 100 }
  const result = { asOf: new Date(asOf).toISOString() }
  result.temperature = forecast(conditions.temperature, targets.temperature,
    (value) => temperatureMethod(value, targets.temperature, counts), asOf, 'temperature')
  result.ph = forecast(conditions.ph, targets.ph, (value) => phMethod(value, counts), asOf, 'ph')
  const target = targets.waterQuality
  const value = conditions.waterQuality
  const method = conditionMethod('waterQuality', value, target, counts)
  const waste = wasteRate(counts, (tank.fish || []).filter((fish) => timestamp(fish.addedAt) <= asOf).length)
  const job = tank.maintenance?.waterChange
  const remainingHours = Math.max(0, (timestamp(job?.endsAt) - asOf) / HOUR)
  const supplyRate = remainingHours && timestamp(job?.startedAt) <= asOf ? waterChangeRate(job) : 0
  const supplyHours = supplyRate ? Math.min(remainingHours, Math.max(0, job.amount - (job.delivered || 0)) / supplyRate) : 0
  const active = supplyHours > 0
  const baseRate = method.rate - waste
  const netRate = value > target ? -waste : baseRate + (active ? supplyRate : 0)
  const currentRate = value <= 0 && netRate < 0 ? 0 : netRate
  const endpoint = waterStep(value, target, method.rate, waste, active ? supplyRate : 0, supplyHours)
  let hours = null
  if (value > target && waste > 0) hours = (value - target) / waste
  else if (value < target) {
    if (active && currentRate > 0 && (target - value) / currentRate <= supplyHours) hours = (target - value) / currentRate
    else if (baseRate > 0) hours = supplyHours + (target - endpoint) / baseRate
  }
  const reached = Math.abs(value - target) < 1e-8
  let seconds = hours === null ? null : Math.ceil(hours * 60 - 1e-8) * 60
  if (seconds !== null && active && hours <= remainingHours && seconds > remainingHours * 3600) {
    seconds = Math.ceil(remainingHours * 3600)
  }
  const sources = [...method.sources]
  let plantsLeft = PLANT_MAX_COUNTED
  for (const [id, count] of counts) {
    const item = getItem(id)
    if (item?.category === 'plant' && plantsLeft > 0) {
      const counted = Math.min(plantsLeft, count)
      sources.push({ id, name: item.name, count: counted })
      plantsLeft -= counted
    }
  }
  if (active) sources.push({ id: 'water-change', name: 'Partial water change', count: 1 })
  let message
  if (value <= 0 && netRate <= 0) message = 'Water quality is at its lower limit. Cleaning needs to outpace waste to raise it.'
  else if (reached && currentRate >= 0) message = 'At your goal. Cleaning is keeping up with waste.'
  else if (hours !== null) message = 'The net rate includes waste and filtration.'
  else if (active) message = `This partial change is expected to finish near ${endpoint.toFixed(1)}%. More cleaning is needed to reach your goal.`
  else if (method.rate > 0) message = 'Waste builds up at least as fast as this filter cleans. Reduce waste or start a water change.'
  else message = 'Waste is building up. Install a filter or start a partial water change.'
  result.waterQuality = {
    status: reached && currentRate >= 0 ? 'holding' : hours !== null ? 'changing' : active || method.rate > 0 ? 'limited' : 'idle',
    ratePerHour: reached && currentRate >= 0 ? 0 : currentRate,
    target, effectiveTarget: hours !== null || reached && currentRate >= 0 ? target : active ? endpoint : baseRate < 0 ? 0 : value,
    etaSeconds: seconds, estimatedAt: seconds === null ? null : new Date(asOf + seconds * 1000).toISOString(),
    sources, message,
  }
  return result
}

// Fresh transactional reads prevent simulation saves from overwriting care or inventory changes.
async function loadOwnedTank(id, owner) {
  const Tank = require('../models/Tank-model')
  return Tank.db.transaction(async (session) => {
    const tank = await Tank.findOne({ _id: id, owner }).session(session)
    if (tank && simulateTank(tank)) await tank.save({ session })
    return tank
  })
}

module.exports = { simulateTank, tankProgression, loadOwnedTank, WATER_CHANGE_DURATION }
