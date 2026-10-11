<script setup>
// A slider for one tank condition (temperature, pH or water quality).
// The green band behind the slider shows the range that is safe for the fish.
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  // [low, high], or null when the fish in the tank have no range in common
  safe: { type: Array, default: null },
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
  if (props.modelValue < props.safe[0]) return { text: 'Too low', chip: 'al-chip--bad' }
  if (props.modelValue > props.safe[1]) return { text: 'Too high', chip: 'al-chip--bad' }
  return { text: 'In range', chip: 'al-chip--ok' }
})
</script>

<template>
  <div class="condition">
    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <label :for="id" class="fw-bold">{{ label }}</label>
      <span class="d-flex align-items-center gap-2">
        <span class="fw-bold">{{ modelValue }}{{ unit }}</span>
        <span class="al-chip" :class="status.chip">{{ status.text }}</span>
      </span>
    </div>

    <div class="condition__slider">
      <div class="condition__track" aria-hidden="true">
        <div v-if="bandStyle" class="condition__band" :style="bandStyle"></div>
      </div>
      <input
        :id="id"
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
  </div>
</template>

<style scoped>
.condition {
  --thumb: 24px;
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
  box-shadow: var(--al-glow);
}

input[type='range']::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--thumb);
  height: var(--thumb);
  border: 3px solid var(--al-aqua);
  border-radius: 50%;
  background: var(--al-text);
  box-shadow: var(--al-glow);
}
</style>
