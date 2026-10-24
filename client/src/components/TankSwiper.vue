<script setup>
// Uses native horizontal scrolling with scroll-snap for touch swipes.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { game } from '../stores/game'
import TankScene from './TankScene.vue'
import AppIcon from './AppIcon.vue'

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
    behavior: smooth && !game.settings.reduceMotion &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
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

// Keep the scene in sync with button presses and changes from another page.
watch(
  () => [props.modelValue, props.tanks.length],
  async () => {
    await nextTick()
    scrollToIndex(indexOfCurrent())
  },
)

onMounted(async () => {
  await nextTick()
  scrollToIndex(indexOfCurrent(), false)
})

onBeforeUnmount(() => clearTimeout(scrollTimer))
</script>

<template>
  <section class="swiper" aria-label="Your tanks">
    <div
      ref="track"
      class="swiper__track"
      role="group"
      aria-label="Tank scenes"
      tabindex="0"
      @scroll.passive="onScroll"
      @keydown.left.self.prevent="go(-1)"
      @keydown.right.self.prevent="go(1)"
    >
      <div
        v-for="tank in tanks"
        :key="tank.id"
        class="swiper__slide"
        :inert="tank.id !== tanks[indexOfCurrent()]?.id"
      >
        <TankScene :tank="tank" :interactive="interactive" :active="tank.id === tanks[indexOfCurrent()]?.id" />
      </div>
    </div>

    <div class="swiper__navigation" role="group" aria-label="Tank navigation">
      <button
        v-if="tanks.length > 1"
        class="swiper__arrow"
        type="button"
        aria-label="Previous tank"
        :disabled="indexOfCurrent() === 0"
        @click="go(-1)"
      >
        <AppIcon name="chevron-left" :size="20" />
      </button>
      <p class="swiper__label" aria-live="polite" aria-atomic="true">
        <span>{{ tanks[indexOfCurrent()]?.name }}</span>
        <span v-if="tanks.length > 1" class="small text-muted-al">{{ indexOfCurrent() + 1 }} / {{ tanks.length }}</span>
      </p>
      <button
        v-if="tanks.length > 1"
        class="swiper__arrow"
        type="button"
        aria-label="Next tank"
        :disabled="indexOfCurrent() >= tanks.length - 1"
        @click="go(1)"
      >
        <AppIcon name="chevron-right" :size="20" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.swiper__track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  /* No rounded corners here: they clipped the Decorate button. Each tank scene rounds its own corners. */
}

.swiper__track::-webkit-scrollbar {
  display: none;
}

.swiper__slide {
  flex: 0 0 100%;
  scroll-snap-align: center;
}

.swiper__navigation {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 0.75rem;
}

.swiper__arrow {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--al-tap);
  height: var(--al-tap);
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
  color: var(--al-text);
}

.swiper__arrow:disabled {
  opacity: 0.35;
}

.swiper__arrow:hover:not(:disabled) {
  border-color: var(--al-aqua);
}

.swiper__label {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.25rem 0.75rem;
  min-width: 0;
  margin: 0;
  font-weight: 700;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
