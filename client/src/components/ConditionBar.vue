<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { conditionReading } from '../stores/game'
import AlModal from './AlModal.vue'
import AppIcon from './AppIcon.vue'

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
})

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
  if (!props.safe) return { text: 'No shared range', chip: 'al-chip--warn' }
  if (props.actual < props.safe[0]) return { text: 'Too low', chip: 'al-chip--bad' }
  if (props.actual > props.safe[1]) return { text: 'Too high', chip: 'al-chip--bad' }
  if (!props.hasLivingFish && props.id !== 'condition-waterQuality') return { text: 'No fish yet', chip: '' }
  return { text: 'In range', chip: 'al-chip--ok' }
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
const showShop = computed(() => props.forecast?.status === 'idle' || props.forecast?.status === 'limited')
const showTips = ref(false)
const tipSections = computed(() => {
  if (!props.tips) return []
  if (props.safe && props.actual > props.safe[1]) return [props.tips.lower]
  if (props.safe && props.actual < props.safe[0]) return [props.tips.raise]
  return [props.tips.raise, props.tips.lower]
})
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
    <p class="small mb-1">{{ eta || effectStatus }}</p>
    <RouterLink v-if="showShop" class="small" :to="{ name: 'browse' }">Care items</RouterLink>

    <AlModal v-if="tips" :open="showTips" :title="`${label} in a real tank`" @close="showTips = false">
      <p class="d-flex align-items-center flex-wrap gap-2">
        <span class="al-chip" :class="status.chip">{{ status.text }}</span>
        <span>Now {{ reading(actual) }}{{ unit }}<template v-if="safe"> · {{ !hasLivingFish && id !== 'condition-waterQuality' ? 'game limits' : 'shared safe range' }}: {{ reading(safe[0]) }} to {{ reading(safe[1]) }}{{ unit }}</template></span>
      </p>
      <section v-if="forecast" class="mb-3">
        <h3 class="h6 fw-bold">In your tank</h3>
        <p class="small mb-1">{{ effectStatus }}<template v-if="rate"> · {{ rate }}</template><template v-if="sources"> · {{ sources }}</template></p>
        <p v-if="forecast.message" class="small mb-0">{{ forecast.message }}</p>
      </section>
      <p>{{ tips.why }}</p>
      <section v-for="section in tipSections" :key="section.title" class="mb-3">
        <h3 class="h6 fw-bold">{{ section.title }}</h3>
        <ul class="mb-0"><li v-for="step in section.steps" :key="step">{{ step }}</li></ul>
      </section>
      <h3 class="h6 fw-bold">How to check it</h3>
      <p>{{ tips.check }}</p>
      <p class="small text-muted-al mb-0">{{ tips.caution }}</p>
    </AlModal>
  </div>
</template>

<style scoped>
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
