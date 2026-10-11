<script setup>
import { computed, ref } from 'vue'
import {
  buyItem,
  checkCompatibility,
  currentTank,
  game,
  getItems,
  notify,
} from '../stores/game'
import ConflictModal from '../components/ConflictModal.vue'
import ItemCard from '../components/ItemCard.vue'
import ItemModal from '../components/ItemModal.vue'

const items = getItems()
const tank = currentTank

// ---- Filters ----
const categories = [
  { value: 'all', label: 'All' },
  { value: 'fish', label: 'Fish' },
  { value: 'plant', label: 'Plants' },
  { value: 'decor', label: 'Decor' },
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

// Fish that suit the current tank, for the "Recommended" row.
const recommended = computed(() =>
  items
    .filter((item) => item.category === 'fish' && checkCompatibility(item, tank.value).ok)
    .slice(0, 6),
)

// ---- Item details and the conflict flow ----
const selectedItem = ref(null) // item shown in the quick-view dialog
const pendingConflict = ref(null) // { item, quantity } waiting for the user's decision

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
  buy(item, tankId, quantity)
}

function buy(item, tankId, quantity) {
  const result = buyItem(item, tankId, quantity)
  notify(result.message, !result.ok)
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

    <!-- Recommended row: scrolls sideways inside its own box, never the page -->
    <section v-if="recommended.length > 0" class="mb-4" aria-labelledby="recommended-title">
      <h2 id="recommended-title" class="h5">Recommended for {{ tank.name }}</h2>
      <div class="carousel-row">
        <div v-for="item in recommended" :key="item.id" class="carousel-row__item">
          <ItemCard :item="item" :tank="tank" @open="selectedItem = $event" />
        </div>
      </div>
    </section>

    <div class="row g-3">
      <!--
        Filters. "offcanvas-lg" is a Bootstrap class that makes this a normal
        sidebar from 992px up, and a slide-up sheet (opened by the button below)
        on smaller screens.
      -->
      <div class="col-12 col-lg-3">
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

      <!-- Card grid: 2 per row on phones, 3 from md, 4 from xl -->
      <section class="col-12 col-lg-9" aria-label="Shop items">
        <p class="small text-muted-al" role="status">{{ filteredItems.length }} items</p>
        <div class="row g-3">
          <div v-for="item in filteredItems" :key="item.id" class="col-6 col-md-4 col-xl-3">
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
    />
  </main>
</template>

<style scoped>
.shop-for {
  min-width: min(100%, 12rem);
}

.carousel-row {
  position: relative;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  /* room so the hover zoom and glow are not cut off by the scrolling box */
  padding: 0.75rem 0.5rem;
  margin-inline: -0.5rem;
}

.carousel-row__item {
  flex: 0 0 clamp(150px, 42vw, 220px);
  scroll-snap-align: start;
}

.filters {
  --bs-offcanvas-bg: var(--al-surface-1);
  --bs-offcanvas-height: min(80dvh, 620px);
}

/* From lg the filters are a sidebar, so the sheet's header button is not needed */
@media (min-width: 992px) {
  .filters .offcanvas-header {
    display: flex;
    padding: 0 0 0.75rem;
  }
}
</style>
