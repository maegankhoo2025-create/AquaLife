<script setup>
// A reusable pop-up dialog. The parent decides when it is open:
//   <AlModal :open="showIt" title="Hello" @close="showIt = false"> ... </AlModal>
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
})
const emit = defineEmits(['close'])

const titleId = useId()
const panel = ref(null)

// Esc closes the dialog even when focus has left it (e.g. a clicked button became disabled).
function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (isOpen) => {
    // Stop the page behind the dialog from scrolling while it is open.
    document.body.classList.toggle('overflow-hidden', isOpen)
    if (isOpen) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
    if (isOpen) {
      // Move keyboard focus into the dialog so Esc and Tab work from inside it.
      await nextTick()
      panel.value?.focus()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.classList.remove('overflow-hidden')
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <!-- Teleport moves the dialog to <body> so it always sits above the page -->
  <Teleport to="body">
    <div v-if="open" class="al-modal" @click.self="$emit('close')">
      <div
        ref="panel"
        class="al-modal__panel al-card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
      >
        <header class="d-flex align-items-center justify-content-between gap-3 mb-3">
          <h2 :id="titleId" class="h5 mb-0">{{ title }}</h2>
          <button class="btn btn-ghost" type="button" aria-label="Close" @click="$emit('close')">
            <AppIcon name="x" :size="20" />
          </button>
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.al-modal {
  position: fixed;
  inset: 0;
  z-index: 1060;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--al-bg) 80%, transparent);
}

.al-modal__panel {
  width: min(100%, 640px);
  max-height: calc(100dvh - 1.5rem);
  overflow-y: auto;
  background: var(--al-surface-2);
}

</style>
