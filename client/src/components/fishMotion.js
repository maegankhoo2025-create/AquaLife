// Positions and speeds are pixels and pixels/second, outside Vue's render state.
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function random(state) {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0
  return state.seed / 4294967296
}

export function createFishMotion(id) {
  let seed = 2166136261
  for (const character of String(id)) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0
  const state = { seed, x: 0, y: 0, vx: 0, vy: 0, initialized: false }
  state.startX = 0.08 + random(state) * 0.84
  state.startY = 0.12 + random(state) * 0.76
  state.cruise = 18 + random(state) * 26
  state.direction = random(state) < 0.5 ? -1 : 1
  state.facing = -state.direction // The original artwork faces left.
  state.tilt = 0
  state.speed = state.cruise * (0.6 + random(state) * 0.65)
  state.depth = random(state)
  state.decisionIn = 1 + random(state) * 4
  state.pausing = false
  return state
}

export function fitFishMotion(state, width, height, fishWidth, fishHeight, dead) {
  // Leave room for the full artwork, its small tilt, the frame and the substrate.
  const angle = 9 * Math.PI / 180
  const halfWidth = (fishWidth * Math.cos(angle) + fishHeight * Math.sin(angle)) / 2
  const halfHeight = (fishHeight * Math.cos(angle) + fishWidth * Math.sin(angle)) / 2
  const minX = Math.min(width / 2, 10 + halfWidth)
  const minY = Math.min(height / 2, 25 + halfHeight)
  const maxX = Math.max(minX, width - 10 - halfWidth)
  const maxY = Math.max(minY, height * 0.76 - halfHeight)
  const previous = state.bounds
  if (!state.initialized) {
    state.x = minX + (maxX - minX) * state.startX
    state.y = minY + (maxY - minY) * state.startY
    state.initialized = true
  } else if (previous && (previous.width !== width || previous.height !== height)) {
    // Preserve relative positions when the glass changes shape.
    const relativeX = (state.x - previous.minX) / (previous.maxX - previous.minX || 1)
    const relativeY = (state.y - previous.minY) / (previous.maxY - previous.minY || 1)
    state.x = minX + (maxX - minX) * relativeX
    state.y = minY + (maxY - minY) * relativeY
  }
  state.bounds = { minX, minY, maxX, maxY, width, height }
  state.x = clamp(state.x, minX, maxX)
  state.y = dead ? minY : clamp(state.y, minY, maxY)
  state.dead = dead
  if (dead) {
    state.vx = 0
    state.vy = 0
    state.tilt = 0
  }
}

export function stepFishMotion(state, seconds) {
  if (!state.bounds || state.dead || seconds <= 0) return
  const dt = Math.min(seconds, 0.1)
  const { minX, minY, maxX, maxY } = state.bounds
  state.decisionIn -= dt
  if (state.decisionIn <= 0) {
    const wasPausing = state.pausing
    state.pausing = !wasPausing && random(state) < 0.19
    state.decisionIn = state.pausing ? 0.8 + random(state) * 2.4 : 2.5 + random(state) * 5.5
    state.speed = state.pausing ? 0 : state.cruise * (0.45 + random(state) * 0.95)
    state.depth = 0.06 + random(state) * 0.88
    if (!state.pausing && random(state) < 0.3) state.direction *= -1
  }

  // Turn before reaching a wall, allowing time to slow down and face back in.
  const room = maxX - minX
  const lookAhead = Math.min(room * 0.32, 22 + Math.abs(state.vx) * 1.8)
  if (state.direction < 0 && state.x - minX < lookAhead) state.direction = 1
  else if (state.direction > 0 && maxX - state.x < lookAhead) state.direction = -1
  const targetX = state.direction * Math.min(state.speed, room * 0.45)
  const targetDepth = minY + (maxY - minY) * state.depth
  const targetY = state.pausing ? 0 : clamp((targetDepth - state.y) * 0.35, -10, 10)
  const response = 1.25
  const blend = 1 - Math.exp(-response * dt)
  // Integrate the eased velocity so acceleration does not depend on frame rate.
  state.x += targetX * dt + (state.vx - targetX) * blend / response
  state.y += targetY * dt + (state.vy - targetY) * blend / response
  state.vx += (targetX - state.vx) * blend
  state.vy += (targetY - state.vy) * blend
  state.x = clamp(state.x, minX, maxX)
  state.y = clamp(state.y, minY, maxY)
  if ((state.x === minX && state.vx < 0) || (state.x === maxX && state.vx > 0)) state.vx = 0
  if ((state.y === minY && state.vy < 0) || (state.y === maxY && state.vy > 0)) state.vy = 0
  // Compress through a turn instead of abruptly flipping the colored artwork.
  const facing = Math.abs(state.vx) > 1 ? -Math.sign(state.vx) : state.facing
  state.facing += (facing - state.facing) * (1 - Math.exp(-5 * dt))
  const tilt = clamp(state.vy * -state.facing * 0.7, -9, 9)
  state.tilt += (tilt - state.tilt) * (1 - Math.exp(-3 * dt))
}
