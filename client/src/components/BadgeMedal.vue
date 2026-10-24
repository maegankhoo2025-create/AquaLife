<script setup>
// One achievement badge drawn as a medal. Its look depends on the tier reached:
//   0 Locked   - grey outline
//   1 Bronze   - bronze medal
//   2 Silver   - silver medal with an inner ring
//   3 Gold     - gold medal, inner ring and a soft glow
//   4 Platinum - platinum medal, brighter glow
//   5 Diamond  - diamond medal with a moving shine
// Usage: <BadgeMedal :badge="badge" :size="64" stars />
import AppIcon from './AppIcon.vue'

defineProps({
  badge: { type: Object, required: true },
  size: { type: Number, default: 56 },
  stars: { type: Boolean, default: false }, // show one star per tier under the medal
})
</script>

<template>
  <span class="medal-wrap" :title="`${badge.name}: ${badge.tierName}`">
    <span
      class="medal"
      :class="`medal--tier-${badge.tier}`"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <AppIcon :name="badge.icon" :size="Math.round(size * 0.48)" />
    </span>
    <span v-if="stars" class="medal-stars" :aria-label="`${badge.tier} of 5 tiers`">
      <span v-for="n in 5" :key="n" :class="{ 'medal-stars__on': n <= badge.tier }">★</span>
    </span>
  </span>
</template>

<style scoped>
.medal-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

/* Each tier only changes these colours; the shape stays the same. */
.medal {
  --medal-light: var(--al-surface-3);
  --medal-dark: var(--al-surface-2);
  --medal-glow: transparent;
  --medal-icon: var(--al-muted);
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--medal-light), var(--medal-dark));
  color: var(--medal-icon);
  box-shadow: 0 0 0 3px var(--medal-dark), 0 0 18px var(--medal-glow);
}

/* Silver and up: a thin inner ring, like a real medal. */
.medal--tier-2::before,
.medal--tier-3::before,
.medal--tier-4::before,
.medal--tier-5::before {
  content: '';
  position: absolute;
  inset: 12%;
  border: 2px solid rgb(255 255 255 / 45%);
  border-radius: 50%;
}

.medal--tier-0 {
  box-shadow: 0 0 0 2px var(--al-border);
  opacity: 0.6;
}

.medal--tier-1 {
  --medal-light: #f0b27a;
  --medal-dark: #a0602b;
  --medal-icon: #3d1f05;
}

.medal--tier-2 {
  --medal-light: #f4f7fb;
  --medal-dark: #8c9bb0;
  --medal-icon: #26324a;
}

.medal--tier-3 {
  --medal-light: #ffe58a;
  --medal-dark: #d29a12;
  --medal-glow: rgb(255 207 74 / 45%);
  --medal-icon: #4a3200;
}

.medal--tier-4 {
  --medal-light: #e6fffd;
  --medal-dark: #4fb8c9;
  --medal-glow: rgb(127 243 240 / 60%);
  --medal-icon: #073a44;
}

.medal--tier-5 {
  --medal-light: #f2e6ff;
  --medal-dark: #7b5cff;
  --medal-glow: rgb(180 140 255 / 75%);
  --medal-icon: #ffffff;
}

/* Diamond only: a band of light slides across the medal. */
.medal--tier-5::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgb(255 255 255 / 55%) 50%, transparent 65%);
  animation: medal-shine 3s ease-in-out infinite;
}

@keyframes medal-shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.medal :deep(.app-icon) {
  position: relative; /* keeps the icon above the inner ring */
}

.medal-stars {
  display: flex;
  gap: 1px;
  font-size: 0.7rem;
  line-height: 1;
  color: var(--al-surface-3);
}

.medal-stars__on {
  color: var(--al-warn);
}
</style>
