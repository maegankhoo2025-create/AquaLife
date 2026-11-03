<script setup>
// A round profile picture. Shows the first letter of the name when there is no picture.
// Every screen uses this one component, so a new picture shows up everywhere at once:
//   <UserAvatar :src="game.user.avatar" :name="game.user.name" :size="40" />
import { computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  name: { type: String, default: '' },
  size: { type: Number, default: 40 },
})

const initial = computed(() => (props.name.charAt(0) || '?').toUpperCase())
</script>

<template>
  <span
    class="user-avatar"
    data-testid="user-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.42}px` }"
    aria-hidden="true"
  >
    <img v-if="src" :src="src" alt="" data-testid="user-avatar-image" />
    <span v-else>{{ initial }}</span>
  </span>
</template>

<style scoped>
.user-avatar {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--al-aqua), #3b8ee8);
  color: var(--al-bg);
  font-weight: 900;
  line-height: 1;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
