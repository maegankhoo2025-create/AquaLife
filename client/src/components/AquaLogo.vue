<script setup>
// The AquaLife logo: a white fish in a round tank with sand and bubbles, drawn with an SVG.
// Usage: <AquaLogo :size="32" />
import { useId } from 'vue'

defineProps({
  size: { type: Number, default: 32 },
})

// Each logo needs its own gradient id, otherwise two logos on one page would clash.
const id = useId()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" class="aqua-logo">
    <defs>
      <radialGradient :id="`${id}-water`" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#2bb3c9" />
        <stop offset="1" stop-color="#123a6b" />
      </radialGradient>
    </defs>
    <!-- round tank with an aqua rim -->
    <circle cx="32" cy="32" r="30" :fill="`url(#${id}-water)`" />
    <circle cx="32" cy="32" r="30" fill="none" stroke="#7ff3f0" stroke-width="2" />
    <!-- sand at the bottom -->
    <path d="M8 46 Q20 40 32 46 T56 46 L56 52 Q44 62 32 62 Q20 62 8 52 Z" fill="#e6c992" opacity="0.9" />
    <!-- fish: tail, body, eye -->
    <path d="M20 30 L11 23 Q14 30 11 37 Z" fill="#ffd58a" />
    <path d="M18 30 C24 20 40 19 48 30 C40 41 24 40 18 30 Z" fill="#ffffff" />
    <circle cx="42" cy="28" r="2" fill="#0a1628" />
    <!-- two bubbles -->
    <circle cx="48" cy="16" r="3" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.5" />
    <circle cx="53" cy="10" r="2" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="1.5" />
  </svg>
</template>

<style scoped>
.aqua-logo {
  flex-shrink: 0;
}
</style>
