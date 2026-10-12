<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CONDITION_LIMITS,
  currentTank,
  doTask,
  game,
  getItem,
  getTasks,
  healthLabel,
  notify,
  safeRange,
  setCondition,
} from '../stores/game'
import ConditionSlider from '../components/ConditionSlider.vue'
import TankSwiper from '../components/TankSwiper.vue'

const tank = currentTank
const safe = computed(() => safeRange(tank.value))
const tasks = computed(() => getTasks())

// Each fish in the tank together with its species details, for the fish list.
const fishList = computed(() =>
  tank.value.fish.map((fish) => {
    const species = getItem(fish.speciesId)
    return {
      id: fish.id,
      emoji: species.emoji,
      name: fish.nickname || species.name,
      species: species.name,
      health: healthLabel(fish.health),
    }
  }),
)

async function runTask(task) {
  const earned = await doTask(task.id, tank.value.id)
  if (earned === null) return // doTask already showed the error
  notify(earned > 0 ? `${task.label}: +${earned} pearls` : `${task.label}: done`)
}
</script>

<template>
  <main class="container al-page">
    <h1 class="al-title mb-3">{{ tank.name }}</h1>

    <div class="row g-3">
      <!-- Tank on the left (full width below lg) -->
      <section class="col-12 col-lg-8">
        <TankSwiper v-model="game.currentTankId" :tanks="game.tanks" interactive />

        <div class="row g-2">
          <div v-for="task in tasks" :key="task.id" class="col-12 col-sm-4">
            <button class="btn btn-ghost w-100 h-100" type="button" @click="runTask(task)">
              <span aria-hidden="true">{{ task.emoji }}</span>
              {{ task.label }}
              <span class="d-block small text-muted-al">
                {{ task.done ? 'Rewarded today' : `+${task.reward} pearls` }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- Conditions panel on the right; drops under the tank below lg -->
      <aside class="col-12 col-lg-4" aria-label="Tank conditions">
        <div class="al-card mb-3">
          <h2 class="h5">Conditions</h2>
          <div class="d-grid gap-3">
            <ConditionSlider
              v-for="(limits, key) in CONDITION_LIMITS"
              :id="`condition-${key}`"
              :key="key"
              :label="limits.label"
              :min="limits.min"
              :max="limits.max"
              :step="limits.step"
              :unit="limits.unit"
              :safe="safe[key]"
              :model-value="tank.conditions[key]"
              @update:model-value="setCondition(tank.id, key, $event)"
            />
          </div>
        </div>

        <div class="al-card">
          <h2 class="h5">Fish ({{ fishList.length }})</h2>
          <p v-if="fishList.length === 0" class="text-muted-al mb-0">
            This tank is empty. Add your first fish from the shop.
          </p>
          <ul v-else class="al-list">
            <li v-for="fish in fishList" :key="fish.id">
              <span aria-hidden="true">{{ fish.emoji }}</span>
              <span class="al-grow">
                {{ fish.name }}
                <span class="d-block small text-muted-al">{{ fish.species }}</span>
              </span>
              <span class="al-chip" :class="fish.health.chip">{{ fish.health.text }}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <RouterLink class="al-fab" :to="{ name: 'browse' }" aria-label="Add fish or decorations">
      +
    </RouterLink>
  </main>
</template>
