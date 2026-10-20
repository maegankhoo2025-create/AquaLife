<script setup>
// Targets are plans, not direct changes to actual tank conditions.
// The safe band and advice help the player choose a target and care method.
import { computed, ref } from 'vue'
import AlModal from './AlModal.vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  actual: { type: Number, required: true },
  method: { type: String, required: true },
  reached: { type: Boolean, default: false },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  // [low, high], or null when the fish in the tank have no range in common
  safe: { type: Array, default: null },
  // Real-life advice from data/careTips.js: { why, raise, lower, check, caution }
  tips: { type: Object, default: null },
})
defineEmits(['update:modelValue'])

// Where a value sits along the slider, as a percentage of its width.
function percent(value) {
  return ((value - props.min) / (props.max - props.min)) * 100
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
  return { text: 'In range', chip: 'al-chip--ok' }
})

// Show slow simulation changes rather than rounding actual values to a slider step.
const displayValue = computed(() => Number(props.actual.toFixed(2)))
const targetValue = computed(() => Number(props.modelValue.toFixed(2)))
const targetUnsafe = computed(() => !props.safe || props.modelValue < props.safe[0] || props.modelValue > props.safe[1])

const showTips = ref(false)
const outOfRange = computed(() => status.value.text === 'Too low' || status.value.text === 'Too high')

// Only the advice the player needs right now: how to lower it when too high, how to raise it when too low, and both when it is in range.
const tipSections = computed(() => {
  if (!props.tips) return []
  if (status.value.text === 'Too high') return [props.tips.lower]
  if (status.value.text === 'Too low') return [props.tips.raise]
  return [props.tips.raise, props.tips.lower]
})
</script>

<template>
  <div class="condition">
    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <button
        v-if="tips"
        class="btn btn-link condition__title fw-bold p-0"
        type="button"
        :aria-label="`${label}: tips for a real tank`"
        @click="showTips = true"
      >
        {{ label }} <AppIcon class="condition__info" name="info" :size="16" />
      </button>
      <span v-else class="fw-bold">{{ label }}</span>
      <span class="d-flex align-items-center gap-2">
        <span class="fw-bold">Actual {{ displayValue }}{{ unit }}</span>
        <span class="al-chip" :class="status.chip">{{ status.text }}</span>
      </span>
    </div>

    <label :for="id" class="small mt-2">
      Target: <strong>{{ targetValue }}{{ unit }}</strong>
      <span v-if="reached" class="al-chip al-chip--ok ms-1">Target reached</span>
    </label>

    <div class="condition__slider">
      <div class="condition__track" aria-hidden="true">
        <div v-if="bandStyle" class="condition__band" :style="bandStyle"></div>
      </div>
      <input
        :id="id"
        :aria-label="`${label} target`"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
      />
    </div>

    <p class="small text-muted-al mb-0">
      <template v-if="safe">Safe range: {{ safe[0] }}–{{ safe[1] }}{{ unit }}</template>
      <template v-else>Your fish need different ranges. Consider moving some to another tank.</template>
    </p>
    <p v-if="targetUnsafe" class="small mb-1">This target is outside the shared safe range. Choose a target that suits every living fish.</p>
    <p class="small mt-1 mb-0">{{ method }}</p>

    <AlModal
      v-if="tips"
      :open="showTips"
      :title="`${label} in a real tank`"
      @close="showTips = false"
    >
      <p class="d-flex align-items-center flex-wrap gap-2">
        <span class="al-chip" :class="status.chip">{{ status.text }}</span>
        <span>
          Now {{ displayValue }}{{ unit }}<template v-if="safe">
            · safe for your fish: {{ safe[0] }}–{{ safe[1] }}{{ unit }}</template
          >
        </span>
      </p>
      <p>{{ tips.why }}</p>

      <section v-for="(section, index) in tipSections" :key="section.title" class="mb-3">
        <h3 class="h6 fw-bold d-flex align-items-center flex-wrap gap-2">
          {{ section.title }}
          <span v-if="index === 0 && outOfRange" class="al-chip al-chip--warn">Relevant to the actual reading</span>
        </h3>
        <ul class="mb-0">
          <li v-for="step in section.steps" :key="step">{{ step }}</li>
        </ul>
      </section>

      <h3 class="h6 fw-bold">How to check it</h3>
      <p>{{ tips.check }}</p>
      <p class="small text-muted-al mb-0"><strong>Go slowly:</strong> {{ tips.caution }}</p>
    </AlModal>
  </div>
</template>

<style scoped>
.condition {
  --thumb: 24px;
}

.condition__title {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: inherit;
  text-decoration: none;
}

.condition__title:hover .condition__info,
.condition__title:focus-visible .condition__info {
  color: var(--al-aqua);
}

.condition__info {
  color: var(--al-muted);
}

.condition__slider {
  position: relative;
  height: var(--al-tap);
}

/* The track is inset by half a thumb so the band lines up with the thumb centre */
.condition__track {
  position: absolute;
  left: calc(var(--thumb) / 2);
  right: calc(var(--thumb) / 2);
  top: 50%;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 999px;
  background: var(--al-surface-3);
}

.condition__band {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: var(--al-ok);
  opacity: 0.7;
}

/* The real <input> sits on top with an invisible track, so only its thumb shows */
input[type='range'] {
  position: relative;
  width: 100%;
  height: var(--al-tap);
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

input[type='range']::-webkit-slider-runnable-track {
  height: var(--thumb);
  background: transparent;
}

input[type='range']::-moz-range-track {
  height: var(--thumb);
  background: transparent;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: var(--thumb);
  height: var(--thumb);
  border: 3px solid var(--al-aqua);
  border-radius: 50%;
  background: var(--al-text);
}

input[type='range']::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--thumb);
  height: var(--thumb);
  border: 3px solid var(--al-aqua);
  border-radius: 50%;
  background: var(--al-text);
}
</style>
