<script setup>
import { computed } from 'vue'
import { checkCompatibility } from '../stores/game'
import PearlCount from './PearlCount.vue'
import ItemVisual from './ItemVisual.vue'

const props = defineProps({
  item: { type: Object, required: true },
  tank: { type: Object, required: true },
})

const emit = defineEmits(['open'])

const compatibility = computed(() =>
  checkCompatibility(props.item, props.tank)
)
</script>

<template>
  <article
    class="al-card item-card h-100"
    :class="{ 'item-card--conflict': !compatibility.ok }"
  >
    <button
      class="item-card__main"
      type="button"
      aria-haspopup="dialog"
      @click="emit('open', item)"
    >
      <span class="al-ph item-card__photo">
        <ItemVisual :item="item" />
      </span>

      <span class="d-block fw-bold mt-2">
        {{ item.name }}
      </span>

      <span
        v-if="item.sci"
        class="d-block small fst-italic text-muted-al"
      >
        {{ item.sci }}
      </span>

      <span
        v-if="item.effect"
        class="d-block small item-card__effect mt-2"
        :title="item.effect.detail"
      >
        {{ item.effect.summary }}
      </span>

      <span class="d-flex flex-wrap align-items-center gap-2 mt-2">
        <PearlCount :amount="item.price" />
        <span v-if="!compatibility.ok" class="al-chip al-chip--bad">
          Conflict
        </span>
      </span>
    </button>
  </article>
</template>

<style scoped>
.item-card {
  display: flex;
  padding: 0;
}

.item-card--conflict {
  border-color: var(--al-bad);
}

.item-card__main {
  display: block;
  flex: 1;
  width: 100%;
  padding: 0.75rem;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  border-radius: inherit;
  cursor: pointer;
}

.item-card__main:focus-visible {
  outline: 2px solid var(--al-aqua);
  outline-offset: 2px;
}

.item-card__photo {
  display: flex;
  align-items: center;
  justify-content: center;
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