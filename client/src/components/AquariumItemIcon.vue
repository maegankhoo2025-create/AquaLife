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

defineProps({
  itemId: { type: String, default: '' },
  category: { type: String, default: '' },
})

const icons = {
  'java-fern': javaFern, anubias, 'amazon-sword': amazonSword,
  'java-moss': javaMoss, driftwood, 'almond-leaves': almondLeaves,
  'crushed-coral': crushedCoral, 'rock-cave': rockCave, castle,
  'treasure-chest': treasureChest,
}
</script>

<template>
  <span
    v-if="icons[itemId]"
    class="aquarium-item-icon"
    :style="{ maskImage: `url(${JSON.stringify(icons[itemId])})` }"
    aria-hidden="true"
  ></span>
  <AppIcon v-else :name="category === 'plant' ? 'leaf' : 'rock'" :size="40" />
</template>

<style scoped>
.aquarium-item-icon {
  display: inline-block;
  flex-shrink: 0;
  background-color: currentColor;
  mask-mode: alpha;
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
}
</style>
