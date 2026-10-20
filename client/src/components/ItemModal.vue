<script setup>
// Quick-view dialog for one shop item: gallery, care stats, compatibility
// with each tank, quantity and an "Add" button.
// It only asks to add; the Browse page decides what happens (buy or show a conflict).
import { computed, ref, watch } from 'vue'
import { checkCompatibility, conditionReading, game } from '../stores/game'
import AlModal from './AlModal.vue'
import PearlCount from './PearlCount.vue'
import ItemVisual from './ItemVisual.vue'

const props = defineProps({
  item: { type: Object, default: null }, // null means the dialog is closed
  tank: { type: Object, required: true },
})
const emit = defineEmits(['close', 'add'])

const quantity = ref(1)

// Reset quantity when a different item opens.
watch(
  () => props.item,
  () => {
    quantity.value = 1
  },
)

const stats = computed(() => {
  const item = props.item
  const list = item.care ? [{ label: 'Care level', value: item.care }] : []
  if (item.category === 'fish') {
    list.push(
      { label: 'Temperament', value: item.temperament },
     
      
      { label: 'Adult size', value: Number.isFinite(item.size) ? `${conditionReading(item.size, 'size')} cm` : 'Unavailable' },
    )
  }
  return list
})

// One line per tank saying whether the item fits there.
const tankChecks = computed(() =>
  game.tanks.map((tank) => ({ tank, ...checkCompatibility(props.item, tank) })),
)

const total = computed(() => props.item.price * quantity.value)
const maxQuantity = computed(() => props.item?.category === 'equipment' ? 1 : 9)
const installed = computed(() => props.item?.category === 'equipment'
  && props.tank.decorations.some((entry) => entry.itemId === props.item.id))
</script>

<template>
  <AlModal :open="item !== null" :title="item ? item.name : ''" @close="emit('close')">
    <div v-if="item" class="row g-3">
      <div class="col-12 col-sm-5">
        <div class="al-ph gallery">
          <ItemVisual :item="item" />
        </div>
      </div>

      <div class="col-12 col-sm-7">
        <p v-if="item.sci" class="fst-italic text-muted-al mb-1">{{ item.sci }}</p>
        <p>{{ item.blurb }}</p>
        <section v-if="item.effect" class="item-effect mb-3">
          <h3 class="h6 mb-1">Effect on your tank</h3>
          <p class="small mb-0">{{ item.effect.detail }}</p>
        </section>
        <template v-if="item.speciesInfo">
  <p>Family: {{ item.speciesInfo.family || 'Unavailable' }}</p>
  <p>Genus: {{ item.speciesInfo.genus || 'Unavailable' }}</p>

  <div v-if="item.speciesInfo.conditions">
    <p>
      Species temperature range:
      {{ conditionReading(item.speciesInfo.conditions.temperature.min, 'temperature') }}–{{ conditionReading(item.speciesInfo.conditions.temperature.max, 'temperature') }}°C
    </p>
    <p>
      Species pH range:
      {{ conditionReading(item.speciesInfo.conditions.ph.min, 'ph') }}–{{ conditionReading(item.speciesInfo.conditions.ph.max, 'ph') }}
    </p>
    <a
      :href="item.speciesInfo.conditions.sourceUrl"
      target="_blank"
      rel="noopener noreferrer"
    >
      Source: {{ item.speciesInfo.conditions.source }}
    </a>
  </div>
  <p v-else>Species conditions unavailable.</p>
</template>

        <dl v-if="stats.length" class="row g-2 mb-0">
          <div v-for="stat in stats" :key="stat.label" class="col-6">
            <dt class="small text-muted-al fw-normal">{{ stat.label }}</dt>
            <dd class="fw-bold text-capitalize mb-0">{{ stat.value }}</dd>
          </div>
        </dl>
      </div>

      <div v-if="item.category === 'fish'" class="col-12">
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
            :disabled="quantity >= maxQuantity"
            @click="quantity++"
          >
            +
          </button>
        </div>

        <button
          class="btn btn-aqua flex-grow-1"
          type="button"
          :disabled="total > game.pearls || installed"
          @click="emit('add', { item, quantity })"
        >
          <template v-if="installed">Already installed</template>
          <template v-else>Add to {{ tank.name }} · <PearlCount :amount="total" /></template>
        </button>
      </div>
      <div v-if="total > game.pearls" class="col-12">
        <div class="purchase-balance" role="status">
          <span class="al-chip al-chip--warn">Not enough pearls</span>
          <span class="purchase-balance__amount">Balance: <PearlCount :amount="game.pearls" /></span>
        </div>
      </div>
    </div>
  </AlModal>
</template>

<style scoped>
.item-effect {
  border-left: 3px solid var(--al-aqua);
  padding-left: 0.75rem;
}

.purchase-balance {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}

.purchase-balance__amount {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  font-size: 0.875rem;
}

.gallery {
  aspect-ratio: 4 / 3;
  width: 100%;
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
