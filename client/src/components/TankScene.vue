<script setup>
// One tank, with independent fish movement and movable decorations.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { conditionReading, healthLabel, useGameStore } from '../stores/game'
import { createFishMotion, fitFishMotion, stepFishMotion } from './fishMotion'
import AlModal from './AlModal.vue'
import AppIcon from './AppIcon.vue'
import ItemVisual from './ItemVisual.vue'
import FishIcon from './FishIcon.vue'

const gameStore = useGameStore()
const game = gameStore.game
const tankEffect = gameStore.tankEffect
const { getItem, moveDecoration, saveFish } = gameStore

const props = defineProps({
  tank: { type: Object, required: true },
  interactive: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
})

// ---- Fish ----
const fishInScene = computed(() =>
  props.tank.fish.map((fish) => {
    const species = getItem(fish.speciesId)
    // Bigger species are drawn bigger: up to 6 cm, up to 15 cm, and larger.
    const scale = species ? (species.size <= 6 ? 1 : species.size <= 15 ? 1.3 : 1.6) : 1
    const dead = fish.health <= 0
    return {
      fish,
      species,
      visual: species || { category: 'fish', name: 'Species unavailable' },
      dead,
      name: fish.nickname || species?.name || 'Species unavailable',
      style: { '--scale': scale },
    }
  }),
)

const selectedFishId = ref(null)
const selected = computed(() =>
  fishInScene.value.find((entry) => entry.fish.id === selectedFishId.value),
)
const nickname = ref('')
const notes = ref('')
const savingFish = ref(false)
const fishMessage = ref('')

watch(selectedFishId, () => {
  nickname.value = selected.value?.fish.nickname || ''
  notes.value = selected.value?.fish.notes || ''
  fishMessage.value = ''
})

async function saveDetails() {
  if (!selected.value || savingFish.value) return
  const fishId = selected.value.fish.id
  savingFish.value = true
  const result = await saveFish(props.tank.id, fishId, {
    nickname: nickname.value.trim(),
    notes: notes.value,
  })
  savingFish.value = false
  if (selectedFishId.value === fishId) fishMessage.value = result.ok ? 'Fish details saved.' : result.message
}

// ---- Care animations ----
// The store sets tankEffect when a daily task is done (see doTask in game.js).
// Only the tank the task was done on plays it.
const effect = computed(() => (tankEffect.tankId === props.tank.id ? tankEffect.type : null))

// Twelve food pellets spread across the tank, each falling at its own speed.
const pellets = Array.from({ length: 12 }, (_, index) => ({
  left: `${8 + ((index * 31) % 84)}%`,
  '--fall-delay': `${(index % 4) * 0.15}s`,
  '--fall-depth': `${55 + ((index * 17) % 30)}%`,
}))


// ---- Decorations ----
const scene = ref(null) // the tank element, used to measure its size
const decorating = ref(false)
const draggingId = ref(null)
const decorationElements = new Map()
let drag = null

// Motion lives in a plain Map. A frame only updates DOM transforms, not Vue state.
const swimmers = new Map()
const fishElements = new Map()
const focusedFishId = ref(null)
const hoveredFishId = ref(null)
const heldFishId = ref(null)
const fishLabel = ref(null)
const labeledFish = computed(() =>
  fishInScene.value.find((entry) => entry.fish.id === (hoveredFishId.value || focusedFishId.value)),
)
const inView = ref(false)
const pageVisible = ref(!document.hidden)
const systemReduceMotion = ref(false)
const reduceMotion = computed(() => systemReduceMotion.value || game.settings.reduceMotion)
const fanRunning = computed(() =>
  props.active && inView.value && pageVisible.value && !reduceMotion.value &&
  !decorating.value && props.tank.progression?.temperature?.fanRunning === true,
)
let resizeObserver
let intersectionObserver
let motionQuery
let frameId = null
let previousFrame = null
let mounted = false

function setFishElement(id, element) {
  const previous = fishElements.get(id)
  if (previous === element) return
  if (previous) resizeObserver?.unobserve(previous)
  if (element) {
    fishElements.set(id, element)
    resizeObserver?.observe(element)
  } else {
    fishElements.delete(id)
  }
}
function positionFishLabel() {
  const label = fishLabel.value
  const state = swimmers.get(labeledFish.value?.fish.id)
  if (!label || !state?.initialized || !scene.value) return
  const width = scene.value.clientWidth
  const height = scene.value.clientHeight
  const left = Math.max(8, Math.min(width - label.offsetWidth - 8, state.x - label.offsetWidth / 2))
  let top = state.y - state.element.offsetHeight / 2 - label.offsetHeight - 6
  if (top < 8) top = state.y + state.element.offsetHeight / 2 + 6
  label.style.left = `${left}px`
  label.style.top = `${Math.max(8, Math.min(height - label.offsetHeight - 8, top))}px`
}


function drawFish(state) {
  if (!state.element || !state.initialized) return
  state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`
  state.artwork.style.transform = state.dead
    ? 'scaleY(-1)'
    : `rotate(${state.tilt}deg) scaleX(${state.facing})`
}

function measureFish() {
  if (!mounted || !scene.value) return
  const width = scene.value.clientWidth
  const height = scene.value.clientHeight
  if (!width || !height) return
  for (const [id, state] of swimmers) {
    const element = fishElements.get(id)
    if (!element) continue
    state.element = element
    state.artwork = element.firstElementChild.firstElementChild
    fitFishMotion(state, width, height, element.offsetWidth, element.offsetHeight, state.dead)
    drawFish(state)
  }
  updateAnimation()
  positionFishLabel()
}

function reconcileFish() {
  const present = new Set()
  for (const entry of fishInScene.value) {
    const id = entry.fish.id
    present.add(id)
    let state = swimmers.get(id)
    if (!state) {
      state = createFishMotion(id)
      swimmers.set(id, state)
    }
    state.dead = entry.dead
  }
  for (const id of swimmers.keys()) {
    if (!present.has(id)) swimmers.delete(id)
  }
  if (selectedFishId.value && !present.has(selectedFishId.value)) selectedFishId.value = null
  if (focusedFishId.value && !present.has(focusedFishId.value)) focusedFishId.value = null
  if (hoveredFishId.value && !present.has(hoveredFishId.value)) hoveredFishId.value = null
  if (heldFishId.value && !present.has(heldFishId.value)) heldFishId.value = null
  measureFish()
}

function fishPaused(id) {
  return id === focusedFishId.value || id === hoveredFishId.value ||
    id === heldFishId.value || id === selectedFishId.value
}

function canAnimate() {
  return mounted && props.active && inView.value && pageVisible.value &&
    !reduceMotion.value && !decorating.value
}

function hasMovingFish() {
  for (const [id, state] of swimmers) {
    if (state.initialized && !state.dead && !fishPaused(id)) return true
  }
  return false
}

function animate(timestamp) {
  frameId = null
  if (!canAnimate()) {
    previousFrame = null
    return
  }
  const seconds = previousFrame === null ? 0 : (timestamp - previousFrame) / 1000
  previousFrame = timestamp
  for (const [id, state] of swimmers) {
    if (state.dead || fishPaused(id)) continue
    stepFishMotion(state, seconds)
    drawFish(state)
  }
  if (hasMovingFish()) frameId = requestAnimationFrame(animate)
  else previousFrame = null
}

function updateAnimation() {
  if (canAnimate() && hasMovingFish()) {
    if (frameId === null) {
      previousFrame = null
      frameId = requestAnimationFrame(animate)
    }
  } else {
    if (frameId !== null) cancelAnimationFrame(frameId)
    frameId = null
    previousFrame = null
  }
}

function onVisibilityChange() {
  pageVisible.value = !document.hidden
  if (document.hidden) {
    hoveredFishId.value = null
    endDrag()
    heldFishId.value = null
  }
}

function onMotionChange(event) {
  systemReduceMotion.value = event.matches
}

function openFish(id) {
  if (props.interactive && !decorating.value) selectedFishId.value = id
}

watch(fishInScene, reconcileFish, { flush: 'post' })
watch(labeledFish, positionFishLabel, { flush: 'post' })
watch([decorating, () => props.active, () => props.tank.id], () => {
  endDrag()
  if (!props.active) {
    decorating.value = false
    selectedFishId.value = null
    focusedFishId.value = null
    hoveredFishId.value = null
    heldFishId.value = null
  }
})
watch(
  [() => props.active, inView, pageVisible, reduceMotion, decorating,
    focusedFishId, hoveredFishId, heldFishId, selectedFishId],
  updateAnimation,
  { flush: 'sync' },
)
watch(reduceMotion, (reduced) => {
  if (!reduced) return
  for (const state of swimmers.values()) {
    state.facing = -state.direction
    state.tilt = 0
    drawFish(state)
  }
}, { flush: 'sync' })
watch(() => props.interactive, (interactive) => {
  if (!interactive) {
    decorating.value = false
    selectedFishId.value = null
    focusedFishId.value = null
    hoveredFishId.value = null
    heldFishId.value = null
  }
})

onMounted(() => {
  mounted = true
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  systemReduceMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  resizeObserver = new ResizeObserver(() => {
    measureFish()
    measureDecorations()
  })
  resizeObserver.observe(scene.value)
  for (const element of fishElements.values()) resizeObserver.observe(element)
  for (const element of decorationElements.values()) resizeObserver.observe(element)
  intersectionObserver = new IntersectionObserver(([entry]) => {
    inView.value = entry.isIntersecting && entry.intersectionRatio > 0
  })
  intersectionObserver.observe(scene.value)
  reconcileFish()
  measureDecorations()
})

onBeforeUnmount(() => {
  mounted = false
  endDrag()
  if (frameId !== null) cancelAnimationFrame(frameId)
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  swimmers.clear()
  fishElements.clear()
  decorationElements.clear()
})

const decorations = computed(() =>
  props.tank.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      decoration,
      item,
      name: item?.name ?? 'Item unavailable',
      sizeClass: item?.category === 'plant'
        ? `decor--plant decor--${item.id}`
        : `${item?.category === 'equipment' ? 'decor--equipment ' : ''}decor--${item?.id || 'unknown'}`,
      // zIndex: items lower in the tank are drawn in front of items higher up
      style: {
        left: `clamp(var(--decor-inset-x, 0px), ${decoration.x}%, calc(100% - var(--decor-inset-x, 0px)))`,
        top: `clamp(var(--decor-inset-y, 0px), ${decoration.y}%, calc(100% - var(--decor-inset-y, 0px)))`,
        zIndex: Math.round(decoration.y),
      },
    }
  }),
)

function setDecorationElement(id, element) {
  const previous = decorationElements.get(id)
  if (previous === element) return
  if (previous) resizeObserver?.unobserve(previous)
  if (element) {
    decorationElements.set(id, element)
    resizeObserver?.observe(element)
  } else {
    if (drag?.decorationId === id) endDrag()
    decorationElements.delete(id)
  }
}

function measureDecorations() {
  for (const element of decorationElements.values()) {
    element.style.setProperty('--decor-inset-x', `${element.offsetWidth / 2 + 8}px`)
    element.style.setProperty('--decor-inset-y', `${element.offsetHeight / 2 + 8}px`)
  }
}

function moveWithinScene(decoration, element, x, y) {
  const width = scene.value.clientWidth
  const height = scene.value.clientHeight
  if (!width || !height) return
  // Round inward because the store saves whole percentages.
  const insetX = Math.ceil(((element.offsetWidth / 2 + 8) / width) * 100)
  const insetY = Math.ceil(((element.offsetHeight / 2 + 8) / height) * 100)
  moveDecoration(props.tank.id, decoration.id,
    Math.max(insetX, Math.min(100 - insetX, x)),
    Math.max(insetY, Math.min(100 - insetY, y)),
  )
}

function startDrag(event, decoration) {
  if (!props.interactive || !props.active || !decorating.value || drag ||
      !event.isPrimary || event.button !== 0) return
  event.preventDefault()
  const element = event.currentTarget
  const box = element.getBoundingClientRect()
  drag = {
    decorationId: decoration.id,
    pointerId: event.pointerId,
    element,
    offsetX: event.clientX - (box.left + box.width / 2),
    offsetY: event.clientY - (box.top + box.height / 2),
  }
  draggingId.value = decoration.id
  element.focus({ preventScroll: true })
  // Capture touch, pen and mouse movement without starting a tank swipe.
  element.setPointerCapture(event.pointerId)
}

function onDrag(event, decoration) {
  if (!drag || drag.decorationId !== decoration.id || drag.pointerId !== event.pointerId) return
  event.preventDefault()
  const box = scene.value.getBoundingClientRect()
  const x = ((event.clientX - box.left - scene.value.clientLeft - drag.offsetX) / scene.value.clientWidth) * 100
  const y = ((event.clientY - box.top - scene.value.clientTop - drag.offsetY) / scene.value.clientHeight) * 100
  moveWithinScene(decoration, drag.element, x, y)
}

function endDrag(event) {
  if (!drag || (event && event.pointerId !== drag.pointerId)) return
  const { element, pointerId } = drag
  drag = null
  draggingId.value = null
  if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
}

// Keyboard users can move the focused decoration with the arrow keys.
const KEY_STEPS = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }

function onDecorationKey(event, decoration) {
  const step = KEY_STEPS[event.key]
  if (!props.interactive || !props.active || !decorating.value || !step) return
  event.preventDefault() // stop the arrow key scrolling the page
  event.stopPropagation()
  const element = event.currentTarget
  const box = element.getBoundingClientRect()
  const tankBox = scene.value.getBoundingClientRect()
  const x = ((box.left + box.width / 2 - tankBox.left - scene.value.clientLeft) / scene.value.clientWidth) * 100
  const y = ((box.top + box.height / 2 - tankBox.top - scene.value.clientTop) / scene.value.clientHeight) * 100
  moveWithinScene(decoration, element, x + step[0], y + step[1])
}
</script>

<template>
  <div v-if="interactive" class="scene__tools">
    <button
      class="btn"
      :class="decorating ? 'btn-aqua' : 'btn-ghost'"
      type="button"
      :aria-pressed="decorating"
      @click="decorating = !decorating"
    >
      <AppIcon :name="decorating ? 'check' : 'leaf'" :size="18" />
      {{ decorating ? 'Done decorating' : 'Decorate' }}
    </button>
    <p v-if="decorating" class="scene__hint small text-muted-al" role="status">
      {{ decorations.length ? 'Drag an item or use its arrow keys to move it.' : 'Buy decorations in the shop to arrange your tank.' }}
    </p>
  </div>
  <div
    ref="scene"
    class="scene al-water"
    :class="{ 'scene--decorating': decorating }"
    role="group"
    :aria-label="`${tank.name} with ${tank.fish.length} fish`"
  >
    <div class="scene__environment" aria-hidden="true">
      <div class="scene__waterline"></div>
      <svg class="scene__substrate" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path fill="#c9bb9d" d="M0 16 Q180 4 360 24 T700 20 T1000 12 V200 H0Z" />
        <path fill="#b5a587" d="M0 151 Q240 143 470 156 T1000 150 V200 H0Z" />
        <g fill="#a59578">
          <ellipse cx="65" cy="64" rx="5" ry="3" />
          <ellipse cx="157" cy="115" rx="3" ry="3" />
          <ellipse cx="284" cy="75" rx="4" ry="2" />
          <ellipse cx="410" cy="131" rx="5" ry="3" />
          <ellipse cx="552" cy="87" rx="3" ry="2" />
          <ellipse cx="686" cy="120" rx="4" ry="3" />
          <ellipse cx="804" cy="60" rx="5" ry="2" />
          <ellipse cx="936" cy="102" rx="4" ry="3" />
        </g>
        <g fill="#e0d5bc">
          <ellipse cx="112" cy="86" rx="6" ry="3" />
          <ellipse cx="338" cy="112" rx="4" ry="2" />
          <ellipse cx="602" cy="61" rx="5" ry="3" />
          <ellipse cx="864" cy="133" rx="6" ry="3" />
        </g>
      </svg>
    </div>

    <!-- The hit target stays level while the artwork turns inside it. -->
    <div
      v-for="entry in fishInScene"
      :key="entry.fish.id"
      :ref="(element) => setFishElement(entry.fish.id, element)"
      class="swim"
      :class="{ 'swim--dead': entry.dead }"
      :style="entry.style"
    >
      <component
        :is="interactive ? 'button' : 'span'"
        class="swim__fish"
        :type="interactive ? 'button' : null"
        :tabindex="!decorating ? 0 : -1"
        :role="interactive ? null : 'img'"
        :aria-label="`${entry.name}${entry.dead ? ', dead' : ''}`"
        @click="openFish(entry.fish.id)"
        @focus="focusedFishId = entry.fish.id"
        @blur="focusedFishId = null"
        @pointerenter="hoveredFishId = entry.fish.id"
        @pointerleave="hoveredFishId = null; heldFishId = null"
        @pointerdown="interactive && (heldFishId = entry.fish.id)"
        @pointerup="heldFishId = null"
        @pointercancel="heldFishId = null"
      >
        <span class="swim__artwork"><FishIcon :species-id="entry.fish.speciesId" /></span>
      </component>
    </div>
    <span
      v-if="labeledFish && !decorating && active"
      ref="fishLabel"
      class="scene__fish-label"
      aria-hidden="true"
    >{{ labeledFish.name }}</span>

    <!-- Decorations -->
    <button
      v-for="entry in decorations"
      :key="entry.decoration.id"
      :ref="(element) => setDecorationElement(entry.decoration.id, element)"
      class="decor"
      :class="[entry.sizeClass, { 'decor--dragging': draggingId === entry.decoration.id }]"
      type="button"
      :style="entry.style"
      :tabindex="decorating ? 0 : -1"
      :aria-hidden="decorating ? null : 'true'"
      :aria-label="`Move ${entry.name}. Drag, or use the arrow keys.`"
      @pointerdown="startDrag($event, entry.decoration)"
      @pointermove="onDrag($event, entry.decoration)"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="endDrag"
      @dragstart.prevent
      @keydown="onDecorationKey($event, entry.decoration)"
    >
      <ItemVisual :item="entry.item" :fan-running="fanRunning" />
    </button>

    <!-- Care animations. :key restarts the animation when the same task is done again. -->
    <div v-if="effect && !reduceMotion" :key="tankEffect.run" class="fx" :class="`fx--${effect}`" aria-hidden="true">
      <template v-if="effect === 'feed'">
        <span v-for="(pellet, index) in pellets" :key="index" class="fx__pellet" :style="pellet"></span>
      </template>

      <template v-else-if="effect === 'clean'">
        <span class="fx__bubbles"><AppIcon name="clean" :size="40" /></span>
      </template>

      <template v-else>
        <span class="fx__thermo"><AppIcon name="thermometer" /> {{ conditionReading(tank.conditions.temperature, 'temperature') }}°C</span>
      </template>
    </div>



    <!-- Fish card -->
    <AlModal
      v-if="interactive"
      :open="selected !== undefined"
      :title="selected ? selected.name : ''"
      @close="selectedFishId = null"
    >
      <template v-if="selected">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="al-ph fish-card__photo"><ItemVisual :item="selected.visual" /></div>
          <div class="al-grow">
            <p class="fw-bold mb-0">{{ selected.species?.name ?? 'Species unavailable' }}</p>
            <p class="small fst-italic text-muted-al mb-1">{{ selected.species?.sci ?? 'Scientific name unavailable' }}</p>
            <span class="al-chip" :class="healthLabel(selected.fish.health).chip">
              {{ healthLabel(selected.fish.health).text }}
            </span>
          </div>
        </div>

        <dl class="row g-2">
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Health</dt>
            <dd class="fw-bold mb-0">{{ conditionReading(selected.fish.health, 'health') }}%</dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Hunger</dt>
            <dd class="fw-bold mb-0">{{ conditionReading(selected.fish.hunger, 'hunger') }}%</dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Needs temperature</dt>
            <dd class="fw-bold mb-0">
              <template v-if="selected.species?.temp">{{ conditionReading(selected.species.temp[0], 'temperature') }}–{{ conditionReading(selected.species.temp[1], 'temperature') }}°C</template>
              <template v-else>Unavailable</template>
            </dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Needs pH</dt>
            <dd class="fw-bold mb-0">
              <template v-if="selected.species?.ph">{{ conditionReading(selected.species.ph[0], 'ph') }}–{{ conditionReading(selected.species.ph[1], 'ph') }}</template>
              <template v-else>Unavailable</template>
            </dd>
          </div>
        </dl>


        <form @submit.prevent="saveDetails">
          <label :for="`nickname-${selected.fish.id}`" class="form-label">Nickname</label>
          <input
            :id="`nickname-${selected.fish.id}`"
            v-model="nickname"
            class="form-control mb-3"
            type="text"
            maxlength="20"
            :placeholder="selected.species?.name ?? 'Species unavailable'"
          />
          <label :for="`notes-${selected.fish.id}`" class="form-label">Care notes</label>
          <textarea
            :id="`notes-${selected.fish.id}`"
            v-model="notes"
            class="form-control"
            rows="4"
            maxlength="2000"
            placeholder="Record feeding, behaviour or observations about this fish."
          ></textarea>
          <p class="small text-muted-al">{{ notes.length }} / 2000 characters</p>
          <button class="btn btn-aqua" type="submit" :disabled="savingFish">
            {{ savingFish ? 'Saving…' : 'Save fish details' }}
          </button>
          <p v-if="fishMessage" class="small mt-2 mb-0" role="status">{{ fishMessage }}</p>
        </form>
      </template>
    </AlModal>
  </div>
</template>

<style scoped>
.scene__fish-label {
  position: absolute;
  z-index: 110;
  max-width: calc(100% - 16px);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
  color: var(--al-text);
  font-size: 0.8rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
  pointer-events: none;
}

.scene {
  --fish-size: clamp(44px, 5vw, 64px);
  position: relative;
  /* clamp(): never shorter than 220px, never taller than 440px, 52vw in between */
  height: clamp(220px, 52vw, 440px);
  overflow: hidden;
  isolation: isolate;
  border-radius: 12px;
  border: 2px solid #718d8b;
  background: #c9dcd8;
}

.scene__environment {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.scene__environment::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 6px solid #b4cbc7;
  border-top: 8px solid #e0eae5;
  border-bottom: 7px solid #718d8b;
}

.scene__waterline {
  position: absolute;
  inset: 17px 7px auto;
  height: 6px;
  border-top: 2px solid #91b1ad;
  border-bottom: 1px solid #e8efea;
}

.scene__substrate {
  position: absolute;
  inset: auto 6px 7px;
  width: calc(100% - 12px);
  height: 24%;
}

.swim {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 50;
  width: calc(var(--fish-size) * var(--scale) * 1.25);
  height: calc(var(--fish-size) * var(--scale));
  max-width: calc(100% - 24px);
  min-width: 44px;
  min-height: 44px;
  pointer-events: none;
}


.swim__fish {
  display: grid;
  place-items: center;
  min-width: 44px;
  min-height: 44px;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: var(--al-radius-sm);
  background: transparent;
  pointer-events: auto;
}

.swim__fish:focus-visible,
.decor:focus-visible {
  outline: 2px solid #204d56;
  outline-offset: 2px;
}

.swim:focus-within {
  z-index: 99;
}

.swim__artwork :deep(.fish-icon) {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
}

.swim__artwork {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  pointer-events: none;
}

.swim--dead .swim__artwork {
  filter: grayscale(1);
  opacity: 0.6;
}

/* ---- Care animations (feed, clean, temperature) ---- */
.fx {
  position: absolute;
  inset: 0;
  z-index: 100; /* above fish and decorations, below the labels and buttons */
  pointer-events: none; /* never blocks taps on the fish underneath */
}

/* Feed: pellets drop from the surface, slow down in the water and fade as they are eaten */
.fx__pellet {
  position: absolute;
  top: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d9a066;
  opacity: 0;
  animation: fall 2.2s ease-out var(--fall-delay) forwards;
}

@keyframes fall {
  0% {
    top: 0;
    opacity: 1;
  }
  75% {
    opacity: 1;
  }
  100% {
    top: var(--fall-depth);
    opacity: 0;
  }
}

/* Clean: washing bubbles move across the glass. */
.fx__bubbles {
  position: absolute;
  top: 45%;
  left: 0;
  font-size: clamp(2rem, 1.4rem + 3vw, 3.4rem);
  line-height: 1;
  opacity: 0;
  animation: wipe 2.2s ease-in-out forwards;
}

@keyframes wipe {
  0% {
    left: -10%;
    top: 30%;
    opacity: 1;
  }
  25% {
    top: 60%;
  }
  50% {
    top: 30%;
  }
  75% {
    top: 60%;
  }
  100% {
    left: 100%;
    top: 40%;
    opacity: 1;
  }
}


.fx__thermo {
  position: absolute;
  left: 50%;
  top: 55%;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  background: var(--al-surface-2);
  border: 1px solid var(--al-border);
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  animation: rise 2.2s ease-out forwards;
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  20%,
  75% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -40px);
  }
}

/* ---- Decorations ---- */
.decor {
  position: absolute;
  /* left/top mark the centre of the item, not its corner */
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  min-width: var(--al-tap);
  min-height: var(--al-tap);
  width: clamp(64px, 11vw, 120px);
  height: clamp(56px, 10vw, 104px);
  max-width: calc(100% - 16px);
  max-height: 26%;
  padding: 0;
  border: 2px dashed transparent;
  border-radius: var(--al-radius-sm);
  background: none;
  font-size: clamp(1.8rem, 1.2rem + 3vw, 3.2rem);
  line-height: 1;
  user-select: none;
  pointer-events: none; /* only movable in Decorate mode */
}

.decor :deep(.aquarium-item-icon) {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
}

.decor--plant {
  width: clamp(70px, 11vw, 124px);
  height: clamp(88px, 15vw, 144px);
  max-height: 28%;
}

.decor--anubias,
.decor--java-moss {
  width: clamp(74px, 12vw, 132px);
  height: clamp(56px, 9vw, 96px);
  max-height: 24%;
}

.decor--driftwood {
  width: clamp(88px, 16vw, 168px);
}

.decor--almond-leaves,
.decor--crushed-coral {
  width: clamp(60px, 9vw, 96px);
  height: clamp(44px, 6vw, 64px);
}

.decor--equipment {
  width: clamp(56px, 8vw, 88px);
  height: clamp(64px, 12vw, 112px);
  max-height: 30%;
}

.decor--aquarium-heater {
  width: clamp(44px, 7vw, 70px);
  height: clamp(92px, 18vw, 150px);
  max-height: 40%;
}

.decor--cooling-fan {
  height: clamp(60px, 9vw, 96px);
}

/* ---- Decorate mode ---- */
.scene--decorating .swim {
  opacity: 0.35;
}

.scene--decorating .swim__fish {
  pointer-events: none;
}

.scene--decorating .decor {
  border-color: var(--al-aqua);
  pointer-events: auto;
  cursor: grab;
  /* tell the browser not to scroll or swipe while this item is being dragged */
  touch-action: none;
}

.scene--decorating .decor--dragging {
  cursor: grabbing;
  background: color-mix(in srgb, var(--al-aqua) 20%, transparent);
}


.scene__tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.scene__hint {
  flex: 1 1 12rem;
  margin: 0;
}

.fish-card__photo {
  width: clamp(72px, 20vw, 110px);
  aspect-ratio: 1;
  flex-shrink: 0;
}
</style>
