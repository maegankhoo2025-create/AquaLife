<script setup>
// One shop item in the grid.
// - With a mouse: hovering zooms the card and cycles its photos; clicking opens the details.
// - On a touch screen (no hover): the first tap expands the card in place,
//   and a "View details" button inside opens the details.
import { computed, onUnmounted, ref } from 'vue'
import { checkCompatibility } from '../stores/game'
import PearlCount from './PearlCount.vue'

const props = defineProps({
  item: { type: Object, required: true },
  tank: { type: Object, required: true }, // the tank the user is shopping for
})
const emit = defineEmits(['open'])

const compatibility = computed(() => checkCompatibility(props.item, props.tank))

// ---- Photo cycling on hover ----
const photoIndex = ref(0)
const photo = computed(() => props.item.photos?.[photoIndex.value])
let photoTimer

function startCycle() {
  if (!props.item.photos || props.item.photos.length < 2) return
  photoTimer = setInterval(() => {
    photoIndex.value = (photoIndex.value + 1) % props.item.photos.length
  }, 900)
}

function stopCycle() {
  clearInterval(photoTimer)
  photoIndex.value = 0
}

onUnmounted(stopCycle)

// ---- Tap to expand on touch screens ----
const expanded = ref(false)

function onMainClick() {
  // "(hover: hover)" is true for a mouse or trackpad and false for a touch screen.
  if (window.matchMedia('(hover: hover)').matches) emit('open', props.item)
  else expanded.value = !expanded.value
}
</script>

<template>
  <article
    class="al-card item-card h-100"
    :class="{ 'item-card--conflict': !compatibility.ok }"
    @mouseenter="startCycle"
    @mouseleave="stopCycle"
  >
    <button class="item-card__main" type="button" :aria-expanded="expanded" @click="onMainClick">
      <span class="al-ph item-card__photo">
        <img v-if="photo" :src="photo" :alt="item.name" loading="lazy" />
        <span v-else aria-hidden="true">{{ item.emoji }}</span>
      </span>

      <span class="d-block fw-bold mt-2">{{ item.name }}</span>
      <span v-if="item.sci" class="d-block small fst-italic text-muted-al">{{ item.sci }}</span>

      <span class="d-flex flex-wrap align-items-center gap-2 mt-2">
        <PearlCount :amount="item.price" />
        <span v-if="!compatibility.ok" class="al-chip al-chip--bad">Conflict</span>
      </span>
    </button>

    <div v-if="expanded" class="mt-2">
      <p class="small mb-2">{{ item.blurb }}</p>
      <button class="btn btn-aqua w-100" type="button" @click="emit('open', item)">
        View details
      </button>
    </div>
  </article>
</template>

<style scoped>
.item-card {
  padding: 0.75rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.item-card--conflict {
  border-color: var(--al-bad);
}

/* The clickable part is a real <button> so it works with the keyboard too */
.item-card__main {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  border-radius: var(--al-radius-sm);
}

.item-card__photo {
  aspect-ratio: 4 / 3;
  width: 100%;
}

/* Hover effects only on devices that can really hover */
@media (hover: hover) {
  .item-card:hover {
    transform: scale(1.04);
    box-shadow: var(--al-glow);
  }
}
</style>
