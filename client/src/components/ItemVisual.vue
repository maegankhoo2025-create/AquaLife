<script setup>
import { computed, ref } from 'vue'
import AquariumItemIcon from './AquariumItemIcon.vue'
import FishIcon from './FishIcon.vue'

const props = defineProps({
  item: { type: Object, default: null },
  photoIndex: { type: Number, default: 0 },
})
const failedPhoto = ref('')
const photo = computed(() => {
  const entry = props.item?.photos?.[props.photoIndex]
  return typeof entry === 'string' ? entry : entry?.url
})
</script>

<template>
  <span class="item-visual">
    <img
      v-if="photo && failedPhoto !== photo"
      :src="photo"
      :alt="item?.name || 'Aquarium item'"
      loading="lazy"
      @error="failedPhoto = photo"
    />
    <FishIcon v-else-if="item?.category === 'fish'" :species-id="item.id" />
    <AquariumItemIcon v-else :item-id="item?.id" :category="item?.category" />
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
.item-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-visual :deep(svg) {
  max-width: 65%;
  max-height: 65%;
}
.item-visual :deep(.fish-icon),
.item-visual :deep(.aquarium-item-icon) {
  width: 80%;
  height: 80%;
  max-width: 128px;
  max-height: 128px;
}
</style>
