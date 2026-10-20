<script setup>
import AppIcon from './AppIcon.vue'
import javaFern from '../assets/aquarium-items/java-fern.svg'
import anubias from '../assets/aquarium-items/anubias.svg'
import amazonSword from '../assets/aquarium-items/amazon-sword.svg'
import javaMoss from '../assets/aquarium-items/java-moss.svg'
import driftwood from '../assets/aquarium-items/driftwood.svg'
import almondLeaves from '../assets/aquarium-items/almond-leaves.svg'
import crushedCoral from '../assets/aquarium-items/crushed-coral.svg'
import rockCave from '../assets/aquarium-items/rock-cave.svg'
import castle from '../assets/aquarium-items/castle.svg'
import treasureChest from '../assets/aquarium-items/treasure-chest.svg'
import aquariumHeater from '../assets/aquarium-items/aquarium-heater.svg'
import coolingFan from '../assets/aquarium-items/cooling-fan.svg'
import coolingFanArtwork from '../assets/aquarium-items/cooling-fan.svg?raw'
import spongeFilter from '../assets/aquarium-items/sponge-filter.svg'

defineProps({
  itemId: { type: String, default: '' },
  category: { type: String, default: '' },
  fanRunning: { type: Boolean, default: false },
})

const icons = {
  'java-fern': javaFern, anubias, 'amazon-sword': amazonSword,
  'java-moss': javaMoss, driftwood, 'almond-leaves': almondLeaves,
  'crushed-coral': crushedCoral, 'rock-cave': rockCave, castle,
  'treasure-chest': treasureChest,
  'aquarium-heater': aquariumHeater, 'cooling-fan': coolingFan, 'sponge-filter': spongeFilter,
}
</script>

<template>
  <span
    v-if="itemId === 'cooling-fan' && fanRunning"
    class="aquarium-item-icon aquarium-item-icon--running"
    aria-hidden="true"
    v-html="coolingFanArtwork"
  ></span>
  <img
    v-else-if="icons[itemId]"
    class="aquarium-item-icon"
    :src="icons[itemId]"
    alt=""
    aria-hidden="true"
  />
  <AppIcon v-else :name="category === 'plant' ? 'leaf' : 'rock'" :size="40" />
</template>

<style scoped>
.aquarium-item-icon {
  display: inline-block;
  flex-shrink: 0;
  object-fit: contain;
}
.aquarium-item-icon--running :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
}
.aquarium-item-icon--running :deep(.fan-blades) {
  transform-box: fill-box;
  transform-origin: center;
  animation: fan-spin 0.65s linear infinite;
}
@keyframes fan-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .aquarium-item-icon--running :deep(.fan-blades) {
    animation: none;
  }
}
</style>
