<script setup>
// Shows an amount of pearls (the game currency) next to the pearl icon.
// "signed" adds a + in front of positive amounts, for the history page.
import AppIcon from './AppIcon.vue'

defineProps({
  amount: { type: Number, required: true },
  signed: { type: Boolean, default: false },
})
</script>

<template>
  <span class="pearl-count">
    <AppIcon name="coins" :size="18" />
    <span>{{ signed && amount > 0 ? '+' : '' }}{{ amount.toLocaleString() }}</span>
    <span class="visually-hidden">pearls</span>
  </span>
</template>

<style scoped>
.pearl-count {
  /* Keeps the hidden "pearls" label anchored here. Without this, a pearl count
     inside a sideways-scrolling row would stretch the whole page. */
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-weight: 800;
  white-space: nowrap;
}
</style>
