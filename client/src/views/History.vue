<script setup>
import { computed, ref } from 'vue'
import { formatDate, game, totals } from '../stores/game'
import PearlCount from '../components/PearlCount.vue'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'reward', label: 'Rewards' },
  { value: 'refund', label: 'Refunds' },
]

// How each kind of entry is labelled and coloured.
const TYPES = {
  purchase: { label: 'Purchase', chip: 'al-chip--aqua' },
  reward: { label: 'Reward', chip: 'al-chip--ok' },
  refund: { label: 'Refund', chip: 'al-chip--warn' },
}
const filter = ref('all')

const entries = computed(() =>
  game.history.filter((entry) => filter.value === 'all' || entry.type === filter.value),
)
</script>

<template>
  <main class="container al-page">
    <h1 class="al-title mb-3">History</h1>

    <!-- Summary tiles -->
    <div class="row g-3 mb-3">
      <div class="col-12 col-sm-4">
        <div class="al-card al-card--raised h-100">
          <p class="small text-muted-al mb-1">Balance</p>
          <p class="tile-value mb-0"><PearlCount :amount="game.pearls" /></p>
        </div>
      </div>
      <div class="col-6 col-sm-4">
        <div class="al-card h-100">
          <p class="small text-muted-al mb-1">Earned</p>
          <p class="tile-value text-earned mb-0"><PearlCount :amount="totals.earned" /></p>
        </div>
      </div>
      <div class="col-6 col-sm-4">
        <div class="al-card h-100">
          <p class="small text-muted-al mb-1">Spent</p>
          <p class="tile-value text-spent mb-0"><PearlCount :amount="totals.spent" /></p>
        </div>
      </div>
    </div>

    <div class="al-pills mb-3" role="group" aria-label="Filter history">
      <button
        v-for="option in filters"
        :key="option.value"
        type="button"
        :aria-pressed="filter === option.value"
        @click="filter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="entries.length === 0" class="al-card text-center text-muted-al">Nothing here yet.</p>

    <template v-else>
      <!-- Table from the md breakpoint up -->
      <div class="al-card d-none d-md-block">
        <table class="table history-table mb-0">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Activity</th>
              <th scope="col">Type</th>
              <th scope="col" class="text-end">Pearls</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in entries" :key="entry.id">
              <td class="text-nowrap">{{ formatDate(entry.date) }}</td>
              <td>{{ entry.label }}</td>
              <td>
                <span class="al-chip" :class="TYPES[entry.type].chip">
                  {{ TYPES[entry.type].label }}
                </span>
              </td>
              <td class="text-end" :class="entry.amount > 0 ? 'text-earned' : 'text-spent'">
                <PearlCount :amount="entry.amount" signed />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stacked rows on phones -->
      <ul class="al-card al-list d-md-none">
        <li v-for="entry in entries" :key="entry.id">
          <span class="al-grow">
            {{ entry.label }}
            <span class="d-block small text-muted-al">
              {{ formatDate(entry.date) }} · {{ TYPES[entry.type].label }}
            </span>
          </span>
          <span :class="entry.amount > 0 ? 'text-earned' : 'text-spent'">
            <PearlCount :amount="entry.amount" signed />
          </span>
        </li>
      </ul>
    </template>
  </main>
</template>

<style scoped>
.tile-value {
  font-size: clamp(1.2rem, 1rem + 1.2vw, 1.8rem);
}

.text-earned {
  color: var(--al-ok);
}

.text-spent {
  color: var(--al-warn);
}

.history-table {
  --bs-table-bg: transparent;
  --bs-table-color: var(--al-text);
  --bs-table-border-color: var(--al-border);
  vertical-align: middle;
}

.history-table th {
  color: var(--al-muted);
  font-weight: 700;
}
</style>
