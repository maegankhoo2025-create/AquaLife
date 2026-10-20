<script setup>
// The live picture of one tank: fish swim from side to side and decorations
// sit where the user placed them.
//
// When "interactive" is on (the tank page):
//   - tapping a fish opens a card about it
//   - the Decorate button lets the user drag decorations to a new spot
// On the dashboard it is a preview only, so "interactive" is off.
import { computed, ref, watch } from 'vue'
import { getItem, healthLabel, moveDecoration, saveFish, tankEffect } from '../stores/game'
import AlModal from './AlModal.vue'
import AppIcon from './AppIcon.vue'
import ItemVisual from './ItemVisual.vue'

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
      visual: species || { category: 'fish', name: 'Species unavailable' },
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

const decorations = computed(() =>
  props.tank.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      decoration,
      item,
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
  <div v-if="interactive" class="scene__tools">
    <button
      class="btn"
      :class="decorating ? 'btn-aqua' : 'btn-ghost'"
      type="button"
      :aria-pressed="decorating"
      @click="decorating = !decorating"
    >
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
          interactive ? `${entry.name}${entry.dead ? ', dead' : ''}` : null
        "
        :aria-hidden="interactive ? null : 'true'"
        @click="selectedFishId = entry.fish.id"
      >
        <span class="swim__bob"><ItemVisual :item="entry.visual" /></span>
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
      <ItemVisual :item="entry.item" />
    </button>

    <div class="scene__floor" aria-hidden="true"></div>

    <!-- Care animations. :key restarts the animation when the same task is done again. -->
    <div v-if="effect" :key="tankEffect.run" class="fx" :class="`fx--${effect}`" aria-hidden="true">
      <template v-if="effect === 'feed'">
        <span v-for="(pellet, index) in pellets" :key="index" class="fx__pellet" :style="pellet"></span>
      </template>

      <template v-else-if="effect === 'clean'">
        <span class="fx__bubbles"><AppIcon name="clean" :size="40" /></span>
      </template>

      <template v-else>
        <span class="fx__thermo"><AppIcon name="thermometer" /> {{ tank.conditions.temperature }}°C</span>
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

        <p v-if="selected.species?.speciesInfo?.photo" class="small text-muted-al">
          Photo:
          <a :href="selected.species.speciesInfo.photo.sourceUrl" target="_blank" rel="noopener noreferrer">
            {{ selected.species.speciesInfo.photo.attribution }}
          </a>
        </p>

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
.scene {
  --fish-size: clamp(44px, 5vw, 64px);
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
  width: calc(var(--fish-size) * var(--scale) * 1.25);
  height: calc(var(--fish-size) * var(--scale));
  padding: 0;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
  pointer-events: auto;
  /* step-end: jump straight to the next keyframe instead of turning slowly */
  animation: face var(--swim-time) step-end var(--swim-delay) infinite;
}

.swim__bob {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
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

/* Turn the fish artwork when it changes swimming direction. */
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
  width: clamp(44px, 6vw, 64px);
  height: clamp(44px, 6vw, 64px);
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
