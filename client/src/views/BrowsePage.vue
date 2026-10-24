<script setup>

import { computed, ref, onMounted } from 'vue'
import {
  buyItem,
  checkCompatibility,
  createTank,
  currentTank,
  game,
  loadSpeciesInfo,
  getItems,
  LOW_PEARLS,
  notify,
} from '../stores/game'
import ConflictModal from '../components/ConflictModal.vue'
import ItemCard from '../components/ItemCard.vue'
import ItemModal from '../components/ItemModal.vue'
import AlModal from '../components/AlModal.vue'

const items = getItems()
const tank = currentTank
onMounted(loadSpeciesInfo)

// ---- Filters ----
const categories = [
  { value: 'all', label: 'All' },
  { value: 'fish', label: 'Fish' },
  { value: 'plant', label: 'Plants' },
  { value: 'decor', label: 'Decor' },
  { value: 'equipment', label: 'Equipment' },
]
const temperamentOptions = ['peaceful', 'semi-aggressive', 'aggressive']
const careOptions = ['easy', 'moderate', 'hard']

const category = ref('all')
const onlyFits = ref(false)
const temperaments = ref([]) // empty means "any"
const careLevels = ref([])

const filteredItems = computed(() =>
  items.filter((item) => {
    if (category.value !== 'all' && item.category !== category.value) return false
    if (onlyFits.value && !checkCompatibility(item, tank.value).ok) return false
    if (temperaments.value.length > 0 && !temperaments.value.includes(item.temperament)) return false
    if (careLevels.value.length > 0 && !careLevels.value.includes(item.care)) return false
    return true
  }),
)

function clearFilters() {
  category.value = 'all'
  onlyFits.value = false
  temperaments.value = []
  careLevels.value = []
}

// ---- Item details and the conflict flow ----
const selectedItem = ref(null) // item shown in the quick-view dialog
const pendingConflict = ref(null) // { item, quantity } waiting for the user's decision
const pendingPearlPurchase = ref(null)

function onAdd({ item, quantity }) {
  selectedItem.value = null
  if (checkCompatibility(item, tank.value).ok) {
    buy(item, tank.value.id, quantity)
  } else {
    pendingConflict.value = { item, quantity }
  }
}

function onConflictChoice(tankId) {
  const { item, quantity } = pendingConflict.value
  pendingConflict.value = null
  buy(item, tankId, quantity, true) // the user chose: a better tank, or "add anyway"
}

// "Create Tank N for this fish": make a new tank with water that suits the fish, then buy it there.
async function onConflictNewTank(name) {
  const { item, quantity } = pendingConflict.value
  pendingConflict.value = null
  const created = await createTank(name, item.id)
  if (!created.ok) {
    notify(created.message, true)
    return
  }
  buy(item, created.tankId, quantity)
}

async function buy(item, tankId, quantity, force = false, confirmedLowBalance = false) {
  if (confirmedLowBalance) pendingPearlPurchase.value = null
  const remaining = game.pearls - item.price * quantity
  if (!confirmedLowBalance && remaining < LOW_PEARLS) {
    pendingPearlPurchase.value = { item, tankId, quantity, force, remaining }
    return
  }

  const result = await buyItem(item, tankId, quantity, force)
  // The server can still spot a conflict (e.g. conditions changed elsewhere): ask the user.
  if (result.conflict) {
    pendingConflict.value = { item, quantity }
    return
  }
  const conditionNames = {
    temperature: 'temperature',
    ph: 'pH',
    waterQuality: 'water quality',
  }
  const condition = item.effect?.condition
  const reminder = result.ok && conditionNames[condition]
    ? ` Remember to review your ${conditionNames[condition]} goal.`
    : ''
  notify(`${result.message}${reminder}`, !result.ok)
  // Follow the fish: if it went to another tank, show that tank next.
  if (result.ok) game.currentTankId = tankId
}
</script>

<template>
  <main class="container al-page">
    <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
      <h1 class="al-title">Shop</h1>
      <div class="shop-for">
        <label for="shop-tank" class="small text-muted-al">Shopping for</label>
        <select id="shop-tank" v-model="game.currentTankId" class="form-select">
          <option v-for="t in game.tanks" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
    </div>

    <div class="shop-layout">
      <!--
        Filters. "offcanvas-lg" is a Bootstrap class that makes this a normal
        sidebar from 992px up, and a slide-up sheet (opened by the button below)
        on smaller screens.
      -->
      <div>
        <button
          class="btn btn-ghost w-100 d-lg-none"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#shop-filters"
          aria-controls="shop-filters"
        >
          Filters
        </button>

        <div
          id="shop-filters"
          class="offcanvas-lg offcanvas-bottom filters"
          tabindex="-1"
          aria-labelledby="filters-title"
        >
          <div class="offcanvas-header justify-content-between">
            <h2 id="filters-title" class="h5 mb-0">Filters</h2>
            <button
              class="btn btn-ghost d-lg-none"
              type="button"
              data-bs-dismiss="offcanvas"
              data-bs-target="#shop-filters"
            >
              Done
            </button>
          </div>

          <div class="offcanvas-body d-block">
            <h3 class="h6">Category</h3>
            <div class="al-pills mb-3">
              <button
                v-for="option in categories"
                :key="option.value"
                type="button"
                :aria-pressed="category === option.value"
                @click="category = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <label class="form-check al-check mb-3">
              <input v-model="onlyFits" class="form-check-input" type="checkbox" />
              <span>Only fits {{ tank.name }}</span>
            </label>

            <fieldset class="mb-3">
              <legend class="h6">Temperament</legend>
              <label v-for="option in temperamentOptions" :key="option" class="form-check al-check">
                <input
                  v-model="temperaments"
                  class="form-check-input"
                  type="checkbox"
                  :value="option"
                />
                <span class="text-capitalize">{{ option }}</span>
              </label>
            </fieldset>

            <fieldset class="mb-3">
              <legend class="h6">Care level</legend>
              <label v-for="option in careOptions" :key="option" class="form-check al-check">
                <input
                  v-model="careLevels"
                  class="form-check-input"
                  type="checkbox"
                  :value="option"
                />
                <span class="text-capitalize">{{ option }}</span>
              </label>
            </fieldset>

            <button class="btn btn-ghost w-100" type="button" @click="clearFilters">
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <section aria-label="Shop items">
        <p class="small text-muted-al" role="status">{{ filteredItems.length }} items</p>
        <div class="shop-grid">
          <div v-for="item in filteredItems" :key="item.id">
            <ItemCard :item="item" :tank="tank" @open="selectedItem = $event" />
          </div>
        </div>
        <p v-if="filteredItems.length === 0" class="al-card text-center">
          Nothing matches these filters.
          <button class="btn btn-link" type="button" @click="clearFilters">Clear filters</button>
        </p>
      </section>
    </div>

    <ItemModal :item="selectedItem" :tank="tank" @close="selectedItem = null" @add="onAdd" />
    <ConflictModal
      :pending="pendingConflict"
      :tank="tank"
      @close="pendingConflict = null"
      @add="onConflictChoice"
      @new-tank="onConflictNewTank"
    />
    <AlModal
      :open="pendingPearlPurchase !== null"
      title="Running low on pearls?"
      @close="pendingPearlPurchase = null"
    >
      <template v-if="pendingPearlPurchase">
        <p>
          Oh no, you're running low on pearls! Are you sure you want to purchase
          <strong>{{ pendingPearlPurchase.item.name }}</strong>?
        </p>
        <p class="text-muted-al">
          You'll have {{ Math.max(0, pendingPearlPurchase.remaining) }} pearls left after this purchase.
        </p>
        <div class="d-grid gap-2">
          <button
            class="btn btn-aqua"
            type="button"
            @click="buy(
              pendingPearlPurchase.item,
              pendingPearlPurchase.tankId,
              pendingPearlPurchase.quantity,
              pendingPearlPurchase.force,
              true
            )"
          >
            Yes, purchase item
          </button>
          <button class="btn btn-ghost" type="button" @click="pendingPearlPurchase = null">
            Keep my pearls
          </button>
        </div>
      </template>
    </AlModal>
 
  </main>
</template>

<style scoped>
.shop-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .shop-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.shop-for {
  min-width: min(100%, 12rem);
}

.filters {
  --bs-offcanvas-bg: var(--al-surface-1);
  --bs-offcanvas-height: min(80dvh, 620px);
}

/* From lg the filters are a sidebar, so the sheet's header button is not needed */
@media (min-width: 992px) {
  .shop-layout {
    grid-template-columns: 15rem minmax(0, 1fr);
  }

  .filters .offcanvas-header {
    display: flex;
    padding: 0 0 0.75rem;
  }
}
</style>
