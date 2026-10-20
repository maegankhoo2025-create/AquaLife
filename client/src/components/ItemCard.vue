<script setup>
// One shop item: hover cycles photos; click or tap opens its details.
import { computed, onUnmounted, ref } from 'vue'
import { checkCompatibility } from '../stores/game'
import PearlCount from './PearlCount.vue'
import ItemVisual from './ItemVisual.vue'

const props = defineProps({
  item: { type: Object, required: true },
  tank: { type: Object, required: true }, // the tank the user is shopping for
})
const emit = defineEmits(['open'])

const compatibility = computed(() => checkCompatibility(props.item, props.tank))

// ---- Photo cycling on hover ----
const photoIndex = ref(0)
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

</script>

<template>
  <article
    class="al-card item-card h-100"
    :class="{ 'item-card--conflict': !compatibility.ok }"
    @mouseenter="startCycle"
    @mouseleave="stopCycle"
  >
    <button class="item-card__main" type="button" aria-haspopup="dialog" @click="emit('open', item)">
      <span class="al-ph item-card__photo">
        <ItemVisual :item="item" :photo-index="photoIndex" />
      </span>

      <span class="d-block fw-bold mt-2">{{ item.name }}</span>
      <span v-if="item.sci" class="d-block small fst-italic text-muted-al">{{ item.sci }}</span>

      <span class="d-flex flex-wrap align-items-center gap-2 mt-2">
        <PearlCount :amount="item.price" />
        <span v-if="!compatibility.ok" class="al-chip al-chip--bad">Conflict</span>
      </span>
    </button>

  </article>
</template>

<style scoped>
.item-card {
  padding: 0.75rem;
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

.item-card .item-card__photo :deep(.fish-icon),
.item-card .item-card__photo :deep(.aquarium-item-icon) {
  width: clamp(48px, 5vw, 64px);
  height: clamp(48px, 5vw, 64px);
  max-width: none;
  max-height: none;
}

</style>
