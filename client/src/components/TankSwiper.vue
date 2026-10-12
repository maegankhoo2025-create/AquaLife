<script setup>
// Shows one tank at a time and lets the user move between tanks:
// swipe on a touch screen, arrow buttons with a mouse, dots on both.
//
// It uses the browser's own horizontal scrolling with CSS scroll-snap, so
// there is no swipe library and no touch-event code to maintain.
//   <TankSwiper v-model="game.currentTankId" :tanks="game.tanks" />
import { nextTick, onMounted, ref, watch } from 'vue'
import TankScene from './TankScene.vue'

const props = defineProps({
  tanks: { type: Array, required: true },
  modelValue: { type: String, required: true }, // id of the tank being shown
  // true on the tank page: fish can be tapped and decorations moved
  interactive: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const track = ref(null)

function indexOfCurrent() {
  return Math.max(
    0,
    props.tanks.findIndex((tank) => tank.id === props.modelValue),
  )
}

function scrollToIndex(index, smooth = true) {
  if (!track.value) return
  track.value.scrollTo({
    left: index * track.value.clientWidth,
    behavior: smooth ? 'smooth' : 'instant',
  })
}

function go(step) {
  const index = indexOfCurrent() + step
  if (index >= 0 && index < props.tanks.length) emit('update:modelValue', props.tanks[index].id)
}

// After the user stops swiping, work out which tank is in view and report it.
// Waiting for the scrolling to stop avoids reporting tanks we are only passing.
let scrollTimer
function onScroll() {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    const index = Math.round(track.value.scrollLeft / track.value.clientWidth)
    const tank = props.tanks[index]
    if (tank && tank.id !== props.modelValue) emit('update:modelValue', tank.id)
  }, 120)
}

// When the current tank changes from outside (arrows, dots, another page), scroll to it.
watch(
  () => props.modelValue,
  () => scrollToIndex(indexOfCurrent()),
)

onMounted(async () => {
  await nextTick()
  scrollToIndex(indexOfCurrent(), false)
})
</script>

<template>
  <section class="swiper" aria-label="Your tanks">
    <div ref="track" class="swiper__track" @scroll.passive="onScroll">
      <div v-for="tank in tanks" :key="tank.id" class="swiper__slide">
        <TankScene :tank="tank" :interactive="interactive" />
      </div>
    </div>

    <button
      class="swiper__arrow swiper__arrow--prev"
      type="button"
      aria-label="Previous tank"
      :disabled="indexOfCurrent() === 0"
      @click="go(-1)"
    >
      ‹
    </button>
    <button
      class="swiper__arrow swiper__arrow--next"
      type="button"
      aria-label="Next tank"
      :disabled="indexOfCurrent() === tanks.length - 1"
      @click="go(1)"
    >
      ›
    </button>

    <div class="swiper__dots">
      <button
        v-for="tank in tanks"
        :key="tank.id"
        type="button"
        :aria-label="`Show ${tank.name}`"
        :aria-current="tank.id === modelValue"
        @click="emit('update:modelValue', tank.id)"
      >
        <span></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.swiper {
  position: relative;
}

.swiper__track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* hide the scrollbar; the dots show the position */
  border-radius: var(--al-radius-lg);
}

.swiper__track::-webkit-scrollbar {
  display: none;
}

.swiper__slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
}

/* Arrows are for mouse users only; touch users swipe instead */
.swiper__arrow {
  display: none;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border: 1px solid var(--al-border);
  border-radius: 50%;
  background: var(--al-surface-2);
  color: var(--al-text);
  font-size: 1.8rem;
  line-height: 1;
}

.swiper__arrow--prev {
  left: 0.75rem;
}

.swiper__arrow--next {
  right: 0.75rem;
}

.swiper__arrow:disabled {
  opacity: 0.35;
}

@media (hover: hover) {
  .swiper__arrow {
    display: block;
  }

  .swiper__arrow:hover:not(:disabled) {
    border-color: var(--al-aqua);
    box-shadow: var(--al-glow);
  }
}

.swiper__dots {
  display: flex;
  justify-content: center;
}

/* Each dot is a 44px button with a small circle drawn inside it */
.swiper__dots button {
  display: grid;
  place-items: center;
  width: var(--al-tap);
  height: var(--al-tap);
  border: 0;
  background: none;
}

.swiper__dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--al-surface-3);
}

.swiper__dots button[aria-current='true'] span {
  background: var(--al-aqua);
  box-shadow: var(--al-glow);
}
</style>
