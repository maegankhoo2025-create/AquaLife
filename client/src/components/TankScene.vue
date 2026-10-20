<script setup>
// The live picture of one tank: fish swim from side to side and decorations
// sit where the user placed them.
//
// When "interactive" is on (the tank page):
//   - tapping a fish opens a card about it
//   - the Decorate button lets the user drag decorations to a new spot
// On the dashboard it is a preview only, so "interactive" is off.
import { computed, ref } from 'vue'
import { getItem, healthLabel, moveDecoration, renameFish, tankEffect } from '../stores/game'
import AlModal from './AlModal.vue'

const props = defineProps({
  tank: { type: Object, required: true },
  interactive: { type: Boolean, default: false },
})

// ---- Fish ----
// The swimming itself is done by CSS animations (see the styles below). Here we
// only give each fish its own lane, speed and starting point. These come from
// the fish's place in the list, so they do not change each time the page redraws.
const fishInScene = computed(() =>
  props.tank.fish.map((fish, index) => {
    const species = getItem(fish.speciesId)
    // Bigger species are drawn bigger: up to 6 cm, up to 15 cm, and larger.
    const scale = species ? (species.size <= 6 ? 1 : species.size <= 15 ? 1.3 : 1.6) : 1
    const dead = fish.health <= 0
    return {
      fish,
      species,
      dead,
      name: fish.nickname || species?.name || 'Species unavailable',
      style: {
        // A dead fish floats belly-up near the surface instead of swimming in its lane.
        top: dead ? '14%' : `${20 + ((index * 29) % 46)}%`,
        '--swim-time': `${14 + ((index * 5) % 12)}s`,
        '--swim-delay': `${index * -3.7}s`,
        '--rest': `${(index * 37) % 90}%`, // where the fish sits if animations are off
        '--scale': scale,
      },
    }
  }),
)

const selectedFishId = ref(null)
const selected = computed(() =>
  fishInScene.value.find((entry) => entry.fish.id === selectedFishId.value),
)

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

// Sparkles left behind by the sponge, appearing from left to right.
const sparkles = Array.from({ length: 8 }, (_, index) => ({
  left: `${10 + index * 11}%`,
  top: `${25 + ((index * 37) % 50)}%`,
  '--spark-delay': `${0.25 + index * 0.2}s`,
}))

// ---- Decorations ----
const scene = ref(null) // the tank element, used to measure its size
const decorating = ref(false)
const draggingId = ref(null)

const decorations = computed(() =>
  props.tank.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      decoration,
      emoji: item?.emoji ?? '?',
      name: item?.name ?? 'Item unavailable',
      // zIndex: items lower in the tank are drawn in front of items higher up
      style: { left: `${decoration.x}%`, top: `${decoration.y}%`, zIndex: decoration.y },
    }
  }),
)

function startDrag(event, decoration) {
  if (!decorating.value) return
  draggingId.value = decoration.id
  // Pointer capture keeps sending us move events even if the finger or mouse
  // slips off the item. Pointer events cover mouse, touch and pen with one set of code.
  event.currentTarget.setPointerCapture(event.pointerId)
}

function onDrag(event, decoration) {
  if (draggingId.value !== decoration.id) return
  // Turn the pointer's pixel position into a percentage of the tank's size.
  const box = scene.value.getBoundingClientRect()
  const x = ((event.clientX - box.left) / box.width) * 100
  const y = ((event.clientY - box.top) / box.height) * 100
  moveDecoration(props.tank.id, decoration.id, x, y)
}

function endDrag() {
  draggingId.value = null
}

// Keyboard users can move the focused decoration with the arrow keys.
const KEY_STEPS = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }

function onDecorationKey(event, decoration) {
  const step = KEY_STEPS[event.key]
  if (!decorating.value || !step) return
  event.preventDefault() // stop the arrow key scrolling the page
  moveDecoration(props.tank.id, decoration.id, decoration.x + step[0], decoration.y + step[1])
}
</script>

<template>
  <div
    ref="scene"
    class="scene al-water"
    :class="{ 'scene--decorating': decorating }"
    :role="interactive ? 'group' : 'img'"
    :aria-label="`${tank.name} with ${tank.fish.length} fish`"
  >
    <!-- Fish: the outer element swims across, the inner one turns round and bobs -->
    <div
      v-for="entry in fishInScene"
      :key="entry.fish.id"
      class="swim"
      :class="{ 'swim--dead': entry.dead }"
      :style="entry.style"
    >
      <component
        :is="interactive ? 'button' : 'span'"
        class="swim__fish"
        :type="interactive ? 'button' : null"
        :aria-label="
          interactive ? `${entry.name}, ${entry.species?.name ?? 'Species unavailable'}${entry.dead ? ', dead' : ''}` : null
        "
        :aria-hidden="interactive ? null : 'true'"
        @click="selectedFishId = entry.fish.id"
      >
        <span class="swim__bob">{{ entry.species?.emoji ?? '?' }}</span>
      </component>
    </div>

    <!-- Decorations -->
    <button
      v-for="entry in decorations"
      :key="entry.decoration.id"
      class="decor"
      :class="{ 'decor--dragging': draggingId === entry.decoration.id }"
      type="button"
      :style="entry.style"
      :tabindex="decorating ? 0 : -1"
      :aria-hidden="decorating ? null : 'true'"
      :aria-label="`Move ${entry.name}. Drag, or use the arrow keys.`"
      @pointerdown="startDrag($event, entry.decoration)"
      @pointermove="onDrag($event, entry.decoration)"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @keydown="onDecorationKey($event, entry.decoration)"
    >
      {{ entry.emoji }}
    </button>

    <div class="scene__floor" aria-hidden="true"></div>

    <!-- Care animations. :key restarts the animation when the same task is done again. -->
    <div v-if="effect" :key="tankEffect.run" class="fx" :class="`fx--${effect}`" aria-hidden="true">
      <template v-if="effect === 'feed'">
        <span v-for="(pellet, index) in pellets" :key="index" class="fx__pellet" :style="pellet"></span>
      </template>

      <template v-else-if="effect === 'clean'">
        <span class="fx__sponge">🧽</span>
        <span v-for="(sparkle, index) in sparkles" :key="index" class="fx__sparkle" :style="sparkle">
          ✨
        </span>
      </template>

      <template v-else>
        <span class="fx__glow"></span>
        <span class="fx__thermo">🌡️ {{ tank.conditions.temperature }}°C</span>
      </template>
    </div>

    <div class="scene__label">
      <span class="al-chip">{{ tank.name }}</span>
      <span class="al-chip al-chip--aqua">{{ tank.fish.length }} fish</span>
    </div>

    <template v-if="interactive">
      <button
        class="btn scene__decorate"
        :class="decorating ? 'btn-aqua' : 'btn-ghost'"
        type="button"
        :aria-pressed="decorating"
        @click="decorating = !decorating"
      >
        {{ decorating ? 'Done' : 'Decorate' }}
      </button>

      <p v-if="decorating" class="scene__hint al-chip" role="status">
        {{
          decorations.length > 0
            ? 'Drag an item to move it'
            : 'No decorations yet. Buy some in the shop.'
        }}
      </p>
    </template>

    <!-- Fish card -->
    <AlModal
      v-if="interactive"
      :open="selected !== undefined"
      :title="selected ? selected.name : ''"
      @close="selectedFishId = null"
    >
      <template v-if="selected">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="al-ph fish-card__photo" aria-hidden="true">{{ selected.species?.emoji ?? '?' }}</div>
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
            <dd class="fw-bold mb-0">{{ selected.fish.health }}%</dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Hunger</dt>
            <dd class="fw-bold mb-0">{{ selected.fish.hunger }}%</dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Needs temperature</dt>
            <dd class="fw-bold mb-0">
              <template v-if="selected.species?.temp">{{ selected.species.temp[0] }}–{{ selected.species.temp[1] }}°C</template>
              <template v-else>Unavailable</template>
            </dd>
          </div>
          <div class="col-6">
            <dt class="small text-muted-al fw-normal">Needs pH</dt>
            <dd class="fw-bold mb-0">
              <template v-if="selected.species?.ph">{{ selected.species.ph[0] }}–{{ selected.species.ph[1] }}</template>
              <template v-else>Unavailable</template>
            </dd>
          </div>
        </dl>

        <label :for="`nickname-${selected.fish.id}`" class="form-label">Nickname</label>
        <input
          :id="`nickname-${selected.fish.id}`"
          class="form-control"
          type="text"
          maxlength="20"
          :placeholder="selected.species?.name ?? 'Species unavailable'"
          :value="selected.fish.nickname"
          @change="renameFish(tank.id, selected.fish.id, $event.target.value)"
        />
      </template>
    </AlModal>
  </div>
</template>

<style scoped>
.scene {
  --fish-size: clamp(1.4rem, 1rem + 2vw, 2.2rem);
  position: relative;
  /* clamp(): never shorter than 220px, never taller than 440px, 52vw in between */
  height: clamp(220px, 52vw, 440px);
  overflow: hidden;
  border-radius: var(--al-radius-lg);
  border: 1px solid var(--al-border);
}

/*
  Swimming uses three small animations that share one length (--swim-time):
    .swim       slides right, then back left
    .swim__fish faces right for the first half, left for the second half
    .swim__bob  drifts gently up and down
  The lane is the tank's width minus room for the fish, so translateX(100%)
  (100% of the lane's own width) stops exactly at the right-hand wall.
*/
.swim {
  position: absolute;
  left: 0;
  width: calc(100% - var(--fish-size) * 2);
  height: 0;
  pointer-events: none; /* the lane is invisible and must not block taps */
  transform: translateX(var(--rest));
  animation: swim var(--swim-time) ease-in-out var(--swim-delay) infinite;
}

.swim__fish {
  display: grid;
  place-items: center;
  /* at least 44px so a small fish is still easy to tap */
  min-width: var(--al-tap);
  min-height: var(--al-tap);
  width: max-content;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  font-size: calc(var(--fish-size) * var(--scale));
  line-height: 1;
  pointer-events: auto;
  /* step-end: jump straight to the next keyframe instead of turning slowly */
  animation: face var(--swim-time) step-end var(--swim-delay) infinite;
}

.swim__bob {
  animation: bob 3s ease-in-out infinite alternate;
}

@keyframes swim {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(100%);
  }
}

/* The fish emoji faces left, so it is mirrored while swimming to the right */
@keyframes face {
  0% {
    transform: scaleX(-1);
  }
  50%,
  100% {
    transform: scaleX(1);
  }
}

@keyframes bob {
  from {
    transform: translateY(-5px);
  }
  to {
    transform: translateY(5px);
  }
}

/* ---- Dead fish: grey, belly-up and still, floating near the surface ---- */
.swim--dead {
  animation: none;
}

.swim--dead .swim__fish {
  animation: none;
  transform: scaleY(-1);
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

/* Clean: a sponge wipes across the glass and leaves sparkles behind it */
.fx__sponge {
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

.fx__sparkle {
  position: absolute;
  font-size: 1.3rem;
  opacity: 0;
  animation: sparkle 0.9s ease-out var(--spark-delay) forwards;
}

@keyframes sparkle {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* Temperature: the water glows for a moment and the new temperature rises up */
.fx__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, var(--al-warn), transparent 70%);
  opacity: 0;
  animation: glow 2.2s ease-in-out forwards;
}

@keyframes glow {
  0%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 0.3;
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
  padding: 0.1rem;
  border: 2px dashed transparent;
  border-radius: var(--al-radius-sm);
  background: none;
  font-size: clamp(1.8rem, 1.2rem + 3vw, 3.2rem);
  line-height: 1;
  pointer-events: none; /* only movable in Decorate mode */
}

.scene__floor {
  position: absolute;
  inset: auto 0 0 0;
  height: 10px;
  background: var(--al-surface-3);
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
  box-shadow: var(--al-glow);
}

.scene__label {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 101;
  display: flex;
  gap: 0.4rem;
}

.scene__decorate {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 101;
}

.scene__hint {
  position: absolute;
  left: 50%;
  /* under the labels, so it never covers decorations on the tank floor */
  top: 3.75rem;
  z-index: 101;
  transform: translateX(-50%);
  max-width: calc(100% - 1.5rem);
  margin: 0;
  white-space: normal;
  text-align: center;
  pointer-events: none;
}

.fish-card__photo {
  width: clamp(72px, 20vw, 110px);
  aspect-ratio: 1;
  flex-shrink: 0;
}
</style>
