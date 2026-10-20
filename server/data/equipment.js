const EQUIPMENT = [
  {
    id: 'aquarium-heater', category: 'equipment', name: 'Thermostatic heater', price: 45,
    blurb: 'An immersion heater with a thermostat.',
  },
  {
    id: 'cooling-fan', category: 'equipment', name: 'Cooling fan', price: 35,
    blurb: 'A fan for cooling aquarium water.',
  },
  {
    id: 'sponge-filter', category: 'equipment', name: 'Sponge filter', price: 30,
    blurb: 'An air-driven sponge filter.',
  },
]

const THERMAL_RULES = { roomTemperature: 24, ambientPerHour: 0.1, fanBelowRoom: 3, tolerance: 0.0001 }
const CARE_RULES = {
  'aquarium-heater': { condition: 'temperature', ratePerHour: 0.5, limit: 32, maxCount: 1 },
  'cooling-fan': { condition: 'temperature', ratePerHour: -0.4, limit: 20, maxCount: 1 },
  'sponge-filter': { condition: 'waterQuality', ratePerHour: 2, limit: 100, maxCount: 1 },
  driftwood: { condition: 'ph', ratePerHour: -0.02, limit: 6.5, maxCount: 3 },
  'almond-leaves': { condition: 'ph', ratePerHour: -0.03, limit: 6.5, maxCount: 3 },
  'crushed-coral': { condition: 'ph', ratePerHour: 0.02, limit: 8, maxCount: 3 },
}
const PLANT_REDUCTION = 0.1
const PLANT_MAX_COUNTED = 4

function productEffect(item) {
  const rule = CARE_RULES[item.id]
  if (rule) {
    const pieces = rule.maxCount === 1 ? 'One per tank.' : `Up to ${rule.maxCount} pieces count.`
    let summary
    let detail
    if (item.id === 'aquarium-heater') {
      summary = 'Automatically warms water below your temperature goal.'
      detail = `Adds 0.5°C/hour while heating, opposed by heat loss to the ${THERMAL_RULES.roomTemperature}°C room. Natural heat exchange is ${THERMAL_RULES.ambientPerHour}°C/hour per 1°C of difference from the room. Stops at the goal or ${rule.limit}°C; goals at or above 29°C cannot be reached from below in this room. ${pieces}`
    } else if (item.id === 'cooling-fan') {
      summary = 'Automatically cools water above your temperature goal.'
      detail = `Adds up to 0.4°C/hour of evaporative cooling, alongside natural room-temperature drift. Stops at the goal or ${Math.max(rule.limit, THERMAL_RULES.roomTemperature - THERMAL_RULES.fanBelowRoom)}°C (${THERMAL_RULES.fanBelowRoom}°C below the ${THERMAL_RULES.roomTemperature}°C room). Lower goals are out of reach. ${pieces}`
    } else if (rule.condition === 'ph') {
      const acid = rule.ratePerHour < 0
      summary = `${acid ? 'Gradually acidifies water' : 'Gradually buffers water upward'}, even past your pH goal.`
      detail = `Per piece: ${Math.abs(rule.ratePerHour)} pH/hour for each 1 pH ${acid ? 'above' : 'below'} ${rule.limit}. The effect slows toward pH ${rule.limit}; opposing materials balance together. Removing it stops future effects without undoing the current pH. ${pieces}`
    } else {
      summary = 'Raises water quality toward your goal.'
      detail = `${rule.ratePerHour} quality points/hour. Waste reduces the net cleaning rate. ${pieces}`
    }
    return { ...rule, summary, detail }
  }
  if (item.category === 'plant') return {
    summary: 'Slows waste buildup.',
    detail: `Each plant reduces waste buildup by ${PLANT_REDUCTION * 100}%, up to ${PLANT_MAX_COUNTED} plants (${PLANT_REDUCTION * PLANT_MAX_COUNTED * 100}%). Plants do not change pH.`,
    condition: 'waterQuality', ratePerHour: null, limit: PLANT_REDUCTION * PLANT_MAX_COUNTED, maxCount: PLANT_MAX_COUNTED,
  }
  if (item.category === 'decor') return {
    summary: 'Decoration only.', detail: 'This item does not change water conditions.',
    condition: null, ratePerHour: 0, limit: null, maxCount: null,
  }
  return null
}

module.exports = { EQUIPMENT, CARE_RULES, THERMAL_RULES, PLANT_REDUCTION, PLANT_MAX_COUNTED, productEffect }
