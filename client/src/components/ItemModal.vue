<script setup>
// Quick-view dialog for one shop item: gallery, care stats, compatibility
// with each tank, quantity and an "Add" button.
// It only asks to add; the Browse page decides what happens (buy or show a conflict).
import { computed, ref, watch } from 'vue'
import { checkCompatibility, game } from '../stores/game'
import AlModal from './AlModal.vue'
import PearlCount from './PearlCount.vue'

const props = defineProps({
  item: { type: Object, default: null }, // null means the dialog is closed
  tank: { type: Object, required: true },
})
const emit = defineEmits(['close', 'add'])

const quantity = ref(1)
const photoIndex = ref(0)

// Start again from 1 and the first photo each time a different item is opened.
watch(
  () => props.item,
  () => {
    quantity.value = 1
    photoIndex.value = 0
  },
)

const stats = computed(() => {
  const item = props.item
  const list = [{ label: 'Care level', value: item.care }]
  if (item.category === 'fish') {
    list.push(
      { label: 'Temperament', value: item.temperament },
      { label: 'Temperature', value: `${item.temp[0]}–${item.temp[1]}°C` },
      { label: 'pH', value: `${item.ph[0]}–${item.ph[1]}` },
      { label: 'Adult size', value: `${item.size} cm` },
    )
  }
  return list
})

// One line per tank saying whether the item fits there.
const tankChecks = computed(() =>
  game.tanks.map((tank) => ({ tank, ...checkCompatibility(props.item, tank) })),
)

const total = computed(() => props.item.price * quantity.value)
</script>

<template>
  <AlModal :open="item !== null" :title="item ? item.name : ''" @close="emit('close')">
    <div v-if="item" class="row g-3">
      <div class="col-12 col-sm-5">
        <div class="al-ph gallery">
          <img v-if="item.photos[photoIndex]" :src="item.photos[photoIndex]" :alt="item.name" />
          <span v-else aria-hidden="true">{{ item.emoji }}</span>
        </div>
        <div v-if="item.photos.length > 1" class="d-flex gap-2 mt-2">
          <button
            v-for="(url, index) in item.photos.slice(0, 4)"
            :key="url"
            class="al-ph gallery__thumb"
            type="button"
            :aria-label="`Photo ${index + 1}`"
            :aria-current="index === photoIndex"
            @click="photoIndex = index"
          >
            <img :src="url" alt="" />
          </button>
        </div>
      </div>

      <div class="col-12 col-sm-7">
        <p v-if="item.sci" class="fst-italic text-muted-al mb-1">{{ item.sci }}</p>
        <p>{{ item.blurb }}</p>

        <dl class="row g-2 mb-0">
          <div v-for="stat in stats" :key="stat.label" class="col-6">
            <dt class="small text-muted-al fw-normal">{{ stat.label }}</dt>
            <dd class="fw-bold text-capitalize mb-0">{{ stat.value }}</dd>
          </div>
        </dl>
      </div>

      <div class="col-12">
        <h3 class="h6">Compatibility</h3>
        <ul class="al-list">
          <li v-for="check in tankChecks" :key="check.tank.id" class="align-items-start">
            <span class="al-chip" :class="check.ok ? 'al-chip--ok' : 'al-chip--bad'">
              {{ check.ok ? 'Fits' : 'Conflict' }}
            </span>
            <span class="al-grow">
              <strong>{{ check.tank.name }}</strong>
              <span v-for="reason in check.reasons" :key="reason" class="d-block small text-muted-al">
                {{ reason }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <div class="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2">
          <button
            class="btn btn-ghost qty"
            type="button"
            aria-label="Decrease quantity"
            :disabled="quantity <= 1"
            @click="quantity--"
          >
            −
          </button>
          <span class="fw-bold qty__value" aria-live="polite">{{ quantity }}</span>
          <button
            class="btn btn-ghost qty"
            type="button"
            aria-label="Increase quantity"
            :disabled="quantity >= 9"
            @click="quantity++"
          >
            +
          </button>
        </div>

        <button
          class="btn btn-aqua flex-grow-1"
          type="button"
          :disabled="total > game.pearls"
          @click="emit('add', { item, quantity })"
        >
          Add to {{ tank.name }} · <PearlCount :amount="total" />
        </button>
      </div>
      <p v-if="total > game.pearls" class="col-12 small mb-0" role="status">
        <span class="al-chip al-chip--warn">Not enough pearls</span>
        You have <PearlCount :amount="game.pearls" />.
      </p>
    </div>
  </AlModal>
</template>

<style scoped>
.gallery {
  aspect-ratio: 4 / 3;
  width: 100%;
}

.gallery__thumb {
  width: var(--al-tap);
  height: var(--al-tap);
  padding: 0;
  border: 2px solid transparent;
}

.gallery__thumb[aria-current='true'] {
  border-color: var(--al-aqua);
}

.qty {
  width: var(--al-tap);
  padding: 0;
  font-size: 1.25rem;
}

.qty__value {
  min-width: 1.5rem;
  text-align: center;
}
</style>
