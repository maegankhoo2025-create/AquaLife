<script setup>
// Click or tap an illustration to open the item's details.
import { computed } from 'vue'
import { checkCompatibility } from '../stores/game'
import PearlCount from './PearlCount.vue'
import ItemVisual from './ItemVisual.vue'

const props = defineProps({
  item: { type: Object, required: true },
  tank: { type: Object, required: true }, // the tank the user is shopping for
})
const emit = defineEmits(['open'])

const compatibility = computed(() => checkCompatibility(props.item, props.tank))


</script>

<template>
  <article
    class="al-card item-card h-100"
    :class="{ 'item-card--conflict': !compatibility.ok }"
  >
    <button class="item-card__main" type="button" aria-haspopup="dialog" @click="emit('open', item)">
      <span class="al-ph item-card__photo">
        <ItemVisual :item="item" />
      </span>

      <span class="d-block fw-bold mt-2">{{ item.name }}</span>
      <span v-if="item.sci" class="d-block small fst-italic text-muted-al">{{ item.sci }}</span>
      <span v-if="item.effect" class="d-block small item-card__effect mt-2" :title="item.effect.detail">
        {{ item.effect.summary }}
      </span>

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

.item-card__effect {
  color: var(--al-muted);
  font-weight: 400;
  line-height: 1.4;
}

</style>
