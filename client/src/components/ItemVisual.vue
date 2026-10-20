<script setup>
import AquariumItemIcon from './AquariumItemIcon.vue'
import FishIcon from './FishIcon.vue'

defineProps({
  item: { type: Object, default: null },
  fanRunning: { type: Boolean, default: false },
})
</script>

<template>
  <span class="item-visual">
    <FishIcon v-if="item?.category === 'fish'" :species-id="item.id" />
    <AquariumItemIcon v-else :item-id="item?.id" :category="item?.category" :fan-running="fanRunning" />
  </span>
</template>

<style scoped>
.item-visual {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  color: var(--al-aqua);
}
.item-visual :deep(svg) {
  max-width: 65%;
  max-height: 65%;
}
.item-visual :deep(.aquarium-item-icon svg) {
  max-width: 100%;
  max-height: 100%;
}
.item-visual :deep(.fish-icon),
.item-visual :deep(.aquarium-item-icon) {
  width: 80%;
  height: 80%;
  max-width: 128px;
  max-height: 128px;
}
</style>
