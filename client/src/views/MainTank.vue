<script setup>
import { computed, ref } from 'vue'
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
  removeDeadFish,
  removeDecoration,
  removeFish,
  safeRange,
  setCondition,
} from '../stores/game'
import AlModal from '../components/AlModal.vue'
import ConditionSlider from '../components/ConditionSlider.vue'
import { CARE_TIPS } from '../data/careTips'
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
      emoji: species?.emoji ?? '?',
      name: fish.nickname || species?.name || 'Species unavailable',
      species: species?.name ?? 'Species unavailable',
      health: healthLabel(fish.health),
      // Removing a living fish gives its shop price back; a dead fish gives nothing.
      refund: fish.health > 0 ? (species?.price ?? null) : 0,
    }
  }),
)

async function runTask(task) {
  const earned = await doTask(task.id, tank.value.id)
  if (earned === null) return // doTask already showed the error
  notify(earned > 0 ? `${task.label}: +${earned} pearls` : `${task.label}: done`)
}

// The fish waiting for a "Remove this fish?" answer, or null when the dialog is closed.
const fishToRemove = ref(null)
const isRemoving = ref(false)

async function confirmRemove() {
  const target = fishToRemove.value
  if (!target || isRemoving.value) return
  isRemoving.value = true
  const result = await removeFish(tank.value.id, target.id)
  isRemoving.value = false
  if (!result.ok) notify(result.message, true)
  else if (result.refund > 0) notify(`${target.name} was removed: +${result.refund} pearls`)
  else notify(`${target.name} was removed.`)
  if (fishToRemove.value === target) fishToRemove.value = null
}

// What each item does to the water over time (see server/logic/simulation.js).
const DECOR_EFFECTS = {
  driftwood: 'Lowers pH slowly',
  'almond-leaves': 'Lowers pH',
  'crushed-coral': 'Raises pH',
}

// Each plant or decoration in the tank, for the decorations list.
const decorList = computed(() =>
  tank.value.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      id: decoration.id,
      emoji: item?.emoji ?? '?',
      name: item?.name ?? 'Item unavailable',
      effect: item
        ? (DECOR_EFFECTS[decoration.itemId] ?? (item.category === 'plant' ? 'Keeps water cleaner' : ''))
        : '',
      refund: item?.price ?? null,
    }
  }),
)

// The decoration waiting for a "Remove this?" answer, or null when the dialog is closed.
const decorToRemove = ref(null)

async function confirmRemoveDecoration() {
  const target = decorToRemove.value
  if (!target || isRemoving.value) return
  isRemoving.value = true
  const result = await removeDecoration(tank.value.id, target.id)
  isRemoving.value = false
  if (!result.ok) notify(result.message, true)
  else if (result.refund > 0) notify(`${target.name} was removed: +${result.refund} pearls`)
  else notify(`${target.name} was removed.`)
  if (decorToRemove.value === target) decorToRemove.value = null
}

// Fish die (health 0) after about three days with no feeding or cleaning.
// They stay in the tank until the user clears them out.
const deadCount = computed(() => tank.value.fish.filter((fish) => fish.health <= 0).length)

async function clearDeadFish() {
  isRemoving.value = true
  const result = await removeDeadFish(tank.value.id)
  isRemoving.value = false
  notify(result.message, !result.ok)
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
              :tips="CARE_TIPS[key]"
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
          <div v-if="deadCount > 0" class="d-flex align-items-center gap-2 flex-wrap mb-2">
            <span class="al-chip al-chip--bad">{{ deadCount }} dead</span>
            <span class="al-grow small text-muted-al">Fish die after about 3 days without care.</span>
            <button class="btn btn-ghost btn-sm" type="button" :disabled="isRemoving" @click="clearDeadFish">
              Remove dead fish
            </button>
          </div>
          <ul v-if="fishList.length > 0" class="al-list">
            <li v-for="fish in fishList" :key="fish.id">
              <span aria-hidden="true">{{ fish.emoji }}</span>
              <span class="al-grow">
                {{ fish.name }}
                <span class="d-block small text-muted-al">{{ fish.species }}</span>
              </span>
              <span class="al-chip" :class="fish.health.chip">{{ fish.health.text }}</span>
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                :aria-label="`Remove ${fish.name}`"
                @click="fishToRemove = fish"
              >
                Remove
              </button>
            </li>
          </ul>
        </div>

        <div class="al-card mt-3">
          <h2 class="h5">Plants and decorations ({{ decorList.length }})</h2>
          <p v-if="decorList.length === 0" class="text-muted-al mb-0">
            No plants or decorations yet. Some change the water: driftwood lowers pH and plants keep it
            cleaner.
          </p>
          <ul v-else class="al-list">
            <li v-for="decor in decorList" :key="decor.id">
              <span aria-hidden="true">{{ decor.emoji }}</span>
              <span class="al-grow">
                {{ decor.name }}
                <span v-if="decor.effect" class="d-block small text-muted-al">{{ decor.effect }}</span>
              </span>
              <button
                class="btn btn-ghost btn-sm"
                type="button"
                :aria-label="`Remove ${decor.name}`"
                @click="decorToRemove = decor"
              >
                Remove
              </button>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <RouterLink class="al-fab" :to="{ name: 'browse' }" aria-label="Add fish or decorations">
      +
    </RouterLink>

    <!-- Ask before removing: the fish is deleted from the database -->
    <AlModal :open="fishToRemove !== null" title="Remove this fish?" @close="fishToRemove = null">
      <template v-if="fishToRemove">
        <p>
          <strong>{{ fishToRemove.name }}</strong> will be removed from {{ tank.name }} for good.
        </p>
        <p v-if="fishToRemove.refund > 0">
          You will get <strong>{{ fishToRemove.refund }} pearls</strong> back.
        </p>
        <p v-else-if="fishToRemove.refund === null" class="text-muted-al">Refund details unavailable.</p>
        <p v-else class="text-muted-al">This fish has died, so there is no refund.</p>
        <div class="d-grid gap-2">
          <button class="btn btn-aqua" type="button" :disabled="isRemoving" @click="confirmRemove">
            {{ isRemoving ? 'Removing…' : 'Remove fish' }}
          </button>
          <button class="btn btn-ghost" type="button" @click="fishToRemove = null">Cancel</button>
        </div>
      </template>
    </AlModal>

    <AlModal :open="decorToRemove !== null" title="Remove this item?" @close="decorToRemove = null">
      <template v-if="decorToRemove">
        <p>
          <strong>{{ decorToRemove.name }}</strong> will be removed from {{ tank.name }}.
          <template v-if="decorToRemove.effect"> Its effect ({{ decorToRemove.effect.toLowerCase() }}) stops.</template>
        </p>
        <p v-if="decorToRemove.refund > 0">
          You will get <strong>{{ decorToRemove.refund }} pearls</strong> back.
        </p>
        <p v-else-if="decorToRemove.refund === null" class="text-muted-al">Refund details unavailable.</p>
        <div class="d-grid gap-2">
          <button class="btn btn-aqua" type="button" :disabled="isRemoving" @click="confirmRemoveDecoration">
            {{ isRemoving ? 'Removing…' : 'Remove item' }}
          </button>
          <button class="btn btn-ghost" type="button" @click="decorToRemove = null">Cancel</button>
        </div>
      </template>
    </AlModal>
  </main>
</template>
