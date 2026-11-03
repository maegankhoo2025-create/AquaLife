<script setup>
import { computed, ref } from 'vue'
import { conditionReading, useGameStore } from '../stores/game'
import AlModal from './AlModal.vue'
import AppIcon from './AppIcon.vue'
import ItemVisual from './ItemVisual.vue'
import PearlCount from './PearlCount.vue'

const gameStore = useGameStore()
const game = gameStore.game
const { buyItem, careItems, countInTank, notify } = gameStore

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  actual: { type: Number, required: true },
  goal: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  unit: { type: String, default: '' },
  safe: { type: Array, default: null },
  tips: { type: Object, default: null },
  forecast: { type: Object, default: null },
  now: { type: Number, required: true },
  hasLivingFish: { type: Boolean, default: true },
  tank: { type: Object, default: null }, // the tank to buy care items for
})

// 'condition-ph' -> 'ph' (same keys as CONDITION_LIMITS and CARE_TIPS)
const conditionKey = computed(() => props.id.replace('condition-', ''))

function percent(value) {
  return Math.min(100, Math.max(0, ((value - props.min) / (props.max - props.min)) * 100))
}
function reading(value) {
  return conditionReading(value, props.id === 'condition-ph' ? 'ph' : 'temperature')
}
const bandStyle = computed(() => {
  if (!props.safe) return null
  const left = percent(props.safe[0])
  return { left: `${left}%`, width: `${percent(props.safe[1]) - left}%` }
})
const status = computed(() => {
  // tone colours the guide's status box: ok (green), warn (orange), bad (red) or none.
  if (!props.safe) return { text: 'No shared range', chip: 'al-chip--warn', tone: 'warn' }
  if (props.actual < props.safe[0]) return { text: 'Too low', chip: 'al-chip--bad', tone: 'bad' }
  if (props.actual > props.safe[1]) return { text: 'Too high', chip: 'al-chip--bad', tone: 'bad' }
  if (!props.hasLivingFish && props.id !== 'condition-waterQuality') return { text: 'No fish yet', chip: '', tone: 'none' }
  return { text: 'In range', chip: 'al-chip--ok', tone: 'ok' }
})
const goalUnsafe = computed(() => !props.safe || props.goal < props.safe[0] || props.goal > props.safe[1])
const effectStatus = computed(() => ({ changing: 'Changing', holding: 'Holding', idle: 'No active method', limited: 'Limited' })[props.forecast?.status] || 'Reading available')
const sources = computed(() => (props.forecast?.sources || []).map((source) => `${source.name}${source.count > 1 ? ` ×${source.count}` : ''}`).join(', '))
const rate = computed(() => {
  const value = props.forecast?.ratePerHour
  if (typeof value !== 'number' || Math.abs(value) < 0.0005) return ''
  const unit = props.id === 'condition-waterQuality' ? ' points' : props.unit ? props.unit : ' pH'
  return `${value > 0 ? '+' : ''}${Number(value.toFixed(3))}${unit}/hour`
})
const eta = computed(() => {
  if (!props.forecast?.estimatedAt) return ''
  const seconds = Math.max(0, Math.ceil((new Date(props.forecast.estimatedAt).getTime() - props.now) / 1000))
  if (!seconds) return 'Updating…'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return seconds < 60 ? 'Goal in under 1m' : `Goal in ${hours ? `${hours}h ` : ''}${minutes}m`
})
// Out of range (or no range that suits every fish): this is when the player needs to act.
const needsFixing = computed(() => status.value.tone === 'bad' || status.value.tone === 'warn')
// The line under the bar: a countdown while something is changing the water,
// otherwise the equipment status ("No active method" etc.), but only when out of range.
const effectLine = computed(() => {
  if (eta.value) return eta.value
  return needsFixing.value ? effectStatus.value : ''
})
const showTips = ref(false)

// Which advice to show: only "raise" when too low, only "lower" when too high, otherwise both.
// direction is kept so we can look up matching shop items.
const tipSections = computed(() => {
  if (!props.tips) return []
  const raise = { direction: 'raise', ...props.tips.raise }
  const lower = { direction: 'lower', ...props.tips.lower }
  if (props.safe && props.actual > props.safe[1]) return [lower]
  if (props.safe && props.actual < props.safe[0]) return [raise]
  return [raise, lower]
})

// The label inside a sentence: "temperature", "water quality", but "pH" keeps its capital H.
const labelInSentence = computed(() => (props.label === 'pH' ? 'pH' : props.label.toLowerCase()))

// One short sentence telling the player what to do right now.
const summary = computed(() => {
  if (!props.safe) return 'Your fish need different conditions. Move some fish to another tank.'
  const range = `${reading(props.safe[0])} and ${reading(props.safe[1])}${props.unit}`
  if (props.actual < props.safe[0]) return `Raise the ${labelInSentence.value} to between ${range}.`
  if (props.actual > props.safe[1]) return `Lower the ${labelInSentence.value} to between ${range}.`
  return `Looking good. Keep it between ${range}.`
})

// Shop items that help with each direction shown above.
// Water quality's "lower" list is about what to avoid, so it has no items.
const shopSections = computed(() =>
  tipSections.value
    .filter((section) => !(conditionKey.value === 'waterQuality' && section.direction === 'lower'))
    .map((section) => ({
      direction: section.direction,
      heading: `To ${section.direction} ${labelInSentence.value}`,
      items: careItems(conditionKey.value, section.direction),
    }))
    .filter((section) => section.items.length > 0),
)

// What the buy button for one item should say, and whether it can be pressed.
function buyState(item) {
  const owned = props.tank ? countInTank(props.tank, item.id) : 0
  if (item.category === 'equipment' && owned > 0) return { label: 'Installed', disabled: true, owned }
  if (item.price > game.pearls) return { label: `Need ${item.price - game.pearls} more`, disabled: true, owned }
  return { label: 'Buy', disabled: false, owned }
}

const buyingId = ref(null)

async function buy(item) {
  if (!props.tank || buyingId.value) return
  buyingId.value = item.id
  const result = await buyItem(item, props.tank.id)
  buyingId.value = null
  notify(result.message, !result.ok)
}
</script>

<template>
  <div class="condition">
    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <button v-if="tips" class="btn btn-link condition__title fw-bold p-0" type="button" :aria-label="`${label}: advice for a real tank`" @click="showTips = true">
        {{ label }} <AppIcon class="condition__info" name="info" :size="16" />
      </button>
      <span v-else class="fw-bold">{{ label }}</span>
      <span class="d-flex align-items-center gap-2">
        <strong>{{ reading(actual) }}{{ unit }}</strong>
        <span class="al-chip" :class="status.chip">{{ status.text }}</span>
      </span>
    </div>
    <div :id="id" class="condition__bar" role="meter" :aria-label="`${label}, actual reading`" :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="actual" :aria-valuetext="`${reading(actual)}${unit}; goal ${reading(goal)}${unit}`">
      <div class="condition__track" aria-hidden="true">
        <span v-if="bandStyle" class="condition__band" :style="bandStyle"></span>
        <span class="condition__goal" :style="{ left: `${percent(goal)}%` }"></span>
        <span class="condition__actual" :style="{ left: `${percent(actual)}%` }"></span>
      </div>
    </div>
    <p class="small text-muted-al mb-1">
      Goal {{ reading(goal) }}{{ unit }} ·
      <template v-if="safe">{{ !hasLivingFish && id !== 'condition-waterQuality' ? 'Limits' : 'Safe' }} {{ reading(safe[0]) }} to {{ reading(safe[1]) }}{{ unit }}</template>
      <template v-else>No shared range. Separate fish.</template>
    </p>
    <p v-if="goalUnsafe" class="small mb-1">Goal outside the safe range.</p>
    <p v-if="effectLine" class="small mb-1">{{ effectLine }}</p>
    <!-- Only when something is wrong: opens the guide with the items to buy -->
    <button v-if="tips && needsFixing" class="btn btn-ghost btn-sm mt-1" type="button" @click="showTips = true">
      How to fix it
    </button>

    <AlModal v-if="tips" :open="showTips" :title="`${label} care guide`" @close="showTips = false">
      <!-- 1. Where the tank is now, and what to do -->
      <div class="guide-status" :class="`guide-status--${status.tone}`">
        <div class="guide-status__reading">
          <span class="small text-muted-al">Now</span>
          <strong>{{ reading(actual) }}{{ unit }}</strong>
        </div>
        <div class="al-grow">
          <span class="al-chip mb-1" :class="status.chip">{{ status.text }}</span>
          <p class="fw-bold mb-1">{{ summary }}</p>
          <p class="small text-muted-al mb-0">
            Goal {{ reading(goal) }}{{ unit }}<template v-if="safe"> · Safe {{ reading(safe[0]) }}–{{ reading(safe[1]) }}{{ unit }}</template>
            <template v-if="effectLine"> · {{ effectLine }}<template v-if="rate"> ({{ rate }})</template></template>
          </p>
        </div>
      </div>

      <!-- 2. Shop items that fix it, bought straight into this tank -->
      <section v-for="section in shopSections" :key="section.direction" class="mb-3">
        <h3 class="guide-heading"><AppIcon name="plus" :size="16" /> Buy for {{ tank?.name || 'this tank' }}: {{ section.heading }}</h3>
        <ul class="guide-items">
          <li v-for="item in section.items" :key="item.id">
            <span class="guide-items__art"><ItemVisual :item="item" /></span>
            <span class="al-grow">
              <strong class="d-block">{{ item.name }}</strong>
              <span class="d-block small text-muted-al">{{ item.effect.summary }}</span>
              <span v-if="buyState(item).owned && item.category !== 'equipment'" class="small">×{{ buyState(item).owned }} in tank</span>
            </span>
            <button
              class="btn btn-sm"
              :class="buyState(item).disabled ? 'btn-ghost' : 'btn-aqua'"
              type="button"
              :disabled="!tank || buyState(item).disabled || buyingId !== null"
              :aria-label="`Buy ${item.name} for ${item.price} pearls`"
              @click="buy(item)"
            >
              <template v-if="buyingId === item.id">Buying…</template>
              <template v-else-if="buyState(item).disabled">{{ buyState(item).label }}</template>
              <template v-else>Buy · <PearlCount :amount="item.price" /></template>
            </button>
          </li>
        </ul>
      </section>

      <!-- 3. Real-life steps: bold action first, short detail after -->
      <section v-for="section in tipSections" :key="section.title" class="mb-3">
        <h3 class="guide-heading">{{ section.title }}</h3>
        <ol class="guide-steps">
          <li v-for="step in section.steps" :key="step.tip">
            <strong>{{ step.tip }}</strong>
            <span class="d-block small text-muted-al">{{ step.detail }}</span>
          </li>
        </ol>
      </section>

      <!-- 4. Two quick reminders side by side -->
      <div class="guide-notes">
        <p class="mb-0"><AppIcon name="check" :size="16" /> <strong>Check:</strong> {{ tips.check }}</p>
        <p class="guide-notes__caution mb-0"><AppIcon name="info" :size="16" /> <strong>Careful:</strong> {{ tips.caution }}</p>
      </div>

      <details class="mt-3">
        <summary class="small fw-bold">Why does {{ labelInSentence }} matter?</summary>
        <p class="small mt-2 mb-0">{{ tips.why }}</p>
        <p v-if="forecast?.message" class="small mt-2 mb-0">{{ forecast.message }}</p>
        <p v-if="sources" class="small mt-2 mb-0">Working in your tank: {{ sources }}</p>
      </details>
    </AlModal>
  </div>
</template>

<style scoped>
.guide-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--al-border);
  border-left: 4px solid var(--al-muted);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-1);
}
.guide-status--ok { border-left-color: var(--al-ok); }
.guide-status--warn { border-left-color: var(--al-warn); }
.guide-status--bad { border-left-color: var(--al-bad); }
.guide-status__reading {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
}
.guide-status__reading strong {
  font-size: 1.6rem;
  line-height: 1.1;
}
.guide-heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--al-aqua);
}
.guide-items {
  display: grid;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}
.guide-items li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-1);
}
.guide-items__art {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.guide-steps {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-left: 1.4rem;
}
.guide-steps li::marker {
  color: var(--al-aqua);
  font-weight: 800;
}
.guide-notes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.5rem;
  font-size: 0.875rem;
}
.guide-notes p {
  padding: 0.75rem;
  border-radius: var(--al-radius-sm);
  background: var(--al-surface-1);
}
.guide-notes__caution {
  border-left: 3px solid var(--al-warn);
}
.condition__title {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: inherit;
  text-decoration: none;
}
.condition__info { color: var(--al-muted); }
.condition__title:hover .condition__info,
.condition__title:focus-visible .condition__info { color: var(--al-aqua); }
.condition__bar { padding: 17px 9px; }
.condition__track {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: var(--al-surface-3);
}
.condition__band {
  position: absolute;
  inset-block: 0;
  border-radius: 999px;
  background: var(--al-ok);
  opacity: 0.65;
}
.condition__goal {
  position: absolute;
  top: -6px;
  height: 21px;
  width: 2px;
  background: var(--al-text);
  transform: translateX(-50%);
}
.condition__actual {
  position: absolute;
  top: 50%;
  width: 17px;
  height: 17px;
  transform: translate(-50%, -50%);
  border: 3px solid var(--al-aqua);
  border-radius: 50%;
  background: var(--al-surface-1);
}
</style>
