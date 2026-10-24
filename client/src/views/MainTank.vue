<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
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
  refreshTank,
  removeDeadFish,
  removeDecoration,
  removeFish,
  safeRange,
  saveGoals,
} from '../stores/game'
import AlModal from '../components/AlModal.vue'
import ConditionBar from '../components/ConditionBar.vue'
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

const now = ref(Date.now())
const goalDraft = reactive({})
const goalTankId = ref(null)
const savingGoals = ref(false)
const goalError = ref('')
const busyTask = ref(null)
const hasLivingFish = computed(() => tank.value.fish.some((fish) => fish.health > 0))
const waterChange = computed(() => tank.value.maintenance?.waterChange)
const changingWater = computed(() => Boolean(waterChange.value && new Date(waterChange.value.endsAt).getTime() > new Date(tank.value.progression?.asOf || 0).getTime()))
const waterChangeCountdown = computed(() => {
  if (!changingWater.value) return ''
  const seconds = Math.max(0, Math.ceil((new Date(waterChange.value.endsAt).getTime() - now.value) / 1000))
  if (!seconds) return 'Finishing…'
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`
})

watch(() => tank.value.id, (id) => {
  goalTankId.value = id
  Object.assign(goalDraft, tank.value.targets)
  goalError.value = ''
  fishToRemove.value = null
  decorToRemove.value = null
})

async function submitGoals() {
  if (savingGoals.value) return
  const id = tank.value.id
  savingGoals.value = true
  goalError.value = ''
  const result = await saveGoals(id, { ...goalDraft })
  savingGoals.value = false
  if (tank.value.id !== id) return
  if (!result.ok) goalError.value = result.message
  else notify('Goals saved.')
}

let countdownTimer
let refreshTimer
function stopTimers() {
  clearInterval(countdownTimer)
  clearInterval(refreshTimer)
}
function startTimers({ force = false } = {}) {
  stopTimers()
  if (document.hidden) return
  now.value = Date.now()
  refreshTank(tank.value.id, { force })
  countdownTimer = setInterval(() => { now.value = Date.now() }, 1000)
  refreshTimer = setInterval(() => { refreshTank(tank.value.id) }, 60000)
}
function onVisibilityChange() {
  if (document.hidden) stopTimers()
  else startTimers({ force: true })
}
watch(() => tank.value.id, () => startTimers())
onMounted(() => {
  goalTankId.value = tank.value.id
  Object.assign(goalDraft, tank.value.targets)
  startTimers()
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onUnmounted(() => {
  stopTimers()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
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


function taskLabel(task) {
  if (task.id === 'temp') return 'Check temperature'
  if (task.id === 'ph') return 'Check pH'
  if (task.id === 'clean') return 'Partial change'
  return 'Feed fish'
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
  if (busyTask.value || (task.id === 'clean' && changingWater.value)) return
  busyTask.value = task.id
  const id = tank.value.id
  const earned = await doTask(task.id, id)
  busyTask.value = null
  if (earned === null) return
  const label = taskLabel(task)
  notify(task.id === 'clean'
    ? `Water change started.${earned > 0 ? ` +${earned} pearls` : ''}`
    : earned > 0 ? `${label}: +${earned} pearls` : `${label}: done`)
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

// Installed plants, equipment and decorations share the tank's item list.
const decorList = computed(() =>
  tank.value.decorations.map((decoration) => {
    const item = getItem(decoration.itemId)
    return {
      id: decoration.id,
      item,
      name: item?.name ?? 'Item unavailable',
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

// Dead fish remain in the tank until removed.
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
        <button class="btn btn-ghost" type="button" @click="showCreateTank = true">New tank</button>
        <RouterLink class="btn btn-aqua" :to="{ name: 'browse' }">
          <AppIcon name="plus" /> Shop
        </RouterLink>
      </div>
    </div>

    <div class="row g-3">
      <!-- Tank on the left (full width below lg) -->
      <section class="col-12 col-lg-8">
        <TankSwiper v-model="game.currentTankId" :tanks="game.tanks" interactive />

        <section class="al-card installed-items mb-3" aria-labelledby="installed-items-title">
          <h2 id="installed-items-title" class="h5">Installed items ({{ decorList.length }})</h2>
          <div v-if="decorList.length === 0" class="installed-items__empty">
            <AppIcon name="plus" :size="28" />
            <p class="mb-0"><RouterLink :to="{ name: 'browse' }">Add items from the shop</RouterLink></p>
          </div>
          <ul v-else class="installed-items__list">
            <li v-for="decor in decorList" :key="decor.id" :title="decor.item?.effect?.detail">
              <span class="installed-item-art"><ItemVisual :item="decor.item" /></span>
              <span class="al-grow">
                <strong>{{ decor.name }}</strong>
              </span>
              <button class="btn btn-ghost btn-sm" type="button" :aria-label="`Remove ${decor.name}`" @click="decorToRemove = decor">
                Remove
              </button>
            </li>
          </ul>
        </section>

        <div class="row g-2">
          <div v-for="task in tasks" :key="task.id" class="col-12 col-sm-4">
            <button class="btn btn-ghost w-100 h-100" type="button" :disabled="busyTask !== null || (task.id === 'clean' && changingWater)" @click="runTask(task)">
              <AppIcon :name="task.icon" />
              {{ taskLabel(task) }}
              <span class="d-block small text-muted-al">
                {{ task.done ? 'Rewarded today' : `+${task.reward} pearls` }}
              </span>
              <span v-if="task.id === 'clean'" class="d-block small text-muted-al">
                {{ changingWater ? waterChangeCountdown : '30 minutes' }}
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
            <ConditionBar
              v-for="(limits, key) in CONDITION_LIMITS"
              :id="`condition-${key}`"
              :key="key"
              :label="limits.label"
              :min="limits.min"
              :max="limits.max"
              :unit="limits.unit"
              :safe="safe[key]"
              :tips="CARE_TIPS[key]"
              :actual="tank.conditions[key]"
              :goal="tank.targets[key]"
              :forecast="tank.progression?.[key]"
              :now="now"
              :has-living-fish="hasLivingFish"
            />
          </div>
          <p v-if="tank.progression?.asOf" class="small text-muted-al mt-3 mb-0" title="Readings refresh about once a minute while this page is visible.">
            Updated {{ new Date(tank.progression.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </p>
          <details class="goal-form mt-3 pt-3">
            <summary class="fw-semibold">Goals</summary>
            <form class="mt-3" @submit.prevent="submitGoals">
              <p class="small text-muted-al">pH materials keep working after the goal.</p>
            <div class="row g-2">
              <div v-for="(limits, key) in CONDITION_LIMITS" :key="key" class="col-4">
                <label :for="`goal-${key}`" class="form-label small">{{ limits.label }}{{ limits.unit ? ` (${limits.unit})` : '' }}</label>
                <input :id="`goal-${key}`" v-model.number="goalDraft[key]" type="number" class="form-control" :min="limits.min" :max="limits.max" :step="limits.step" :disabled="savingGoals" required />
              </div>
            </div>
            <p v-if="goalError" class="small mt-2 mb-0" role="alert">{{ goalError }}</p>
            <button class="btn btn-ghost btn-sm mt-3" type="submit" :disabled="savingGoals || goalTankId !== tank.id">{{ savingGoals ? 'Saving…' : 'Save goals' }}</button>
          </form>
          </details>
        </div>

        <div class="al-card">
          <h2 class="h5">Fish ({{ fishList.length }})</h2>
          <p v-if="fishList.length" class="small text-muted-al">Select a fish in the tank for notes.</p>
          <p v-if="fishList.length === 0" class="text-muted-al mb-0">
            Add fish from the shop.
          </p>
          <div v-if="deadCount > 0" class="d-flex align-items-center gap-2 flex-wrap mb-2">
            <span class="al-chip al-chip--bad">{{ deadCount }} dead</span>
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
          <template v-if="decorToRemove.item?.effect?.condition"> Its water effect stops when removed.</template>
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
.installed-items__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.installed-items__list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-2);
}
.installed-item-art {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}
.installed-items__empty {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 64px;
  color: var(--al-muted);
}
.goal-form {
  border-top: 1px solid var(--al-border);
}
</style>
