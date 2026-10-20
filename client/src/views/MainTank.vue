<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CONDITION_LIMITS,
  createTank,
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
  setTarget,
} from '../stores/game'
import AlModal from '../components/AlModal.vue'
import ConditionSlider from '../components/ConditionSlider.vue'
import { CARE_TIPS } from '../data/careTips'
import TankSwiper from '../components/TankSwiper.vue'
import AppIcon from '../components/AppIcon.vue'
import ItemVisual from '../components/ItemVisual.vue'

const tank = currentTank
const safe = computed(() => safeRange(tank.value))
const tasks = computed(() => getTasks())
const showCreateTank = ref(false)
const tankName = ref('')
const creatingTank = ref(false)
const createError = ref('')

async function submitTank() {
  if (creatingTank.value) return
  creatingTank.value = true
  createError.value = ''
  const result = await createTank(tankName.value)
  creatingTank.value = false
  if (!result.ok) createError.value = result.message
  else {
    showCreateTank.value = false
    tankName.value = ''
    notify('Tank created and selected.')
  }
}

function targetReached(key) {
  const actual = tank.value.conditions[key]
  const target = tank.value.targets[key]
  return key === 'waterQuality' ? actual >= target : Math.abs(actual - target) < 0.005
}

function careMethod(key) {
  const actual = tank.value.conditions[key]
  const target = tank.value.targets[key]
  if (targetReached(key)) {
    return key === 'waterQuality'
      ? 'Target met or exceeded. A water change will not deliberately dirty clean water; monitor waste and test regularly.'
      : 'Target reached. Keep monitoring the actual reading; moving a target never changes the water by itself.'
  }
  if (key === 'temperature') {
    return `Next: use the ${actual < target ? 'heater' : 'cooler'} step. Each care action moves actual temperature by up to 1°C toward the target. Real heaters and coolers need time; avoid sudden changes.`
  }
  if (key === 'waterQuality') {
    return 'Next: a partial water change raises actual water quality by up to 25 points toward the target. In a real tank, use conditioned, temperature-matched water and check ammonia, nitrite and nitrate.'
  }
  const lowering = actual > target
  const itemIds = lowering ? ['driftwood', 'almond-leaves'] : ['crushed-coral']
  const hasMethod = tank.value.decorations.some((item) => itemIds.includes(item.itemId))
  const method = lowering
    ? 'Driftwood lowers pH by 0.02 per piece/hour; almond leaves by 0.03, down to pH 6.5.'
    : 'Crushed coral raises pH by 0.02 per piece/hour, up to pH 8.'
  const beyondLimit = lowering ? target < 6.5 : target > 8
  return `${hasMethod ? 'Installed natural items work over time.' : `Next: add ${lowering ? 'driftwood or almond leaves' : 'crushed coral'} from the shop.`} ${method} Up to 3 pieces of each count; effects stop at the target or item limit. ${beyondLimit ? 'This target is beyond those items’ physical limit; choose an achievable safe target. ' : ''}Neutral decorations and plants do not adjust pH. Natural changes take hours to days; re-open the tank to see elapsed-time changes.`
}

function taskLabel(task) {
  if (task.id === 'temp') return 'Heater / cooler step'
  if (task.id === 'clean') return 'Partial water change'
  return task.label
}

// Each fish in the tank together with its species details, for the fish list.
const fishList = computed(() =>
  tank.value.fish.map((fish) => {
    const species = getItem(fish.speciesId)
    return {
      id: fish.id,
      item: species || { category: 'fish' },
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
  driftwood: 'Lowers pH 0.02 per piece/hour; minimum 6.5',
  'almond-leaves': 'Lowers pH 0.03 per piece/hour; minimum 6.5',
  'crushed-coral': 'Raises pH 0.02 per piece/hour; maximum 8',
}

// Each plant or decoration in the tank, for the decorations list.
const decorList = computed(() =>
  tank.value.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      id: decoration.id,
      item,
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
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
      <h1 class="al-title">My aquarium</h1>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-ghost" type="button" @click="showCreateTank = true">Create tank</button>
        <RouterLink class="btn btn-aqua" :to="{ name: 'browse' }">
          <AppIcon name="plus" /> Add fish or decorations
        </RouterLink>
      </div>
    </div>

    <div class="row g-3">
      <!-- Tank on the left (full width below lg) -->
      <section class="col-12 col-lg-8">
        <TankSwiper v-model="game.currentTankId" :tanks="game.tanks" interactive />

        <div class="row g-2">
          <div v-for="task in tasks" :key="task.id" class="col-12 col-sm-4">
            <button class="btn btn-ghost w-100 h-100" type="button" @click="runTask(task)">
              <AppIcon :name="task.icon" />
              {{ taskLabel(task) }}
              <span class="d-block small text-muted-al">
                {{ task.done ? 'Rewarded today' : `+${task.reward} pearls` }}
              </span>
              <span v-if="task.id !== 'feed'" class="d-block small text-muted-al">
                {{ targetReached(task.id === 'temp' ? 'temperature' : 'waterQuality') ? 'Target reached; monitor conditions' : task.id === 'temp' ? 'Up to 1°C toward target' : 'Up to +25 quality toward target' }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <!-- Conditions panel on the right; drops under the tank below lg -->
      <aside class="col-12 col-lg-4" aria-label="Tank conditions">
        <div class="al-card mb-3">
          <h2 class="h5">Conditions</h2>
          <p class="small text-muted-al">Actual readings describe your water now. Sliders save targets only; use care actions or natural items to change the water.</p>
          <p v-if="!tank.fish.some((fish) => fish.health > 0)" class="small text-muted-al">No living fish: the displayed temperature and pH ranges are game limits, not a species recommendation. Check a fish’s requirements before buying.</p>
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
              :actual="tank.conditions[key]"
              :model-value="tank.targets[key]"
              :method="careMethod(key)"
              :reached="targetReached(key)"
              @update:model-value="setTarget(tank.id, key, $event)"
            />
          </div>
        </div>

        <div class="al-card">
          <h2 class="h5">Fish ({{ fishList.length }})</h2>
          <p v-if="fishList.length" class="small text-muted-al">Tap a fish in the aquarium to edit its nickname and care notes.</p>
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
              <span class="tank-item-art"><ItemVisual :item="fish.item" /></span>
              <span class="al-grow">
                {{ fish.name }}
                <span v-if="fish.name !== fish.species" class="d-block small text-muted-al">{{ fish.species }}</span>
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
              <span class="tank-item-art"><ItemVisual :item="decor.item" /></span>
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


    <AlModal :open="showCreateTank" title="Create a tank" @close="showCreateTank = false">
      <form @submit.prevent="submitTank">
        <label for="new-tank-name" class="form-label">Tank name</label>
        <input id="new-tank-name" v-model="tankName" class="form-control mb-3" type="text" required />
        <p class="small text-muted-al">A new tank starts empty. Check its actual readings and species requirements before adding fish.</p>
        <p v-if="createError" class="small" role="alert">{{ createError }}</p>
        <button class="btn btn-aqua" type="submit" :disabled="creatingTank || !tankName.trim()">
          {{ creatingTank ? 'Creating…' : 'Create and select tank' }}
        </button>
      </form>
    </AlModal>

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

<style scoped>
.tank-item-art {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 8px;
  background: var(--al-surface-2);
}
</style>
