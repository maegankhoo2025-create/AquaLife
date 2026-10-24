<script setup>
// Shown when the user tries to add a fish that does not suit the chosen tank.
// It explains why, offers a tank where the fish does fit (or a brand-new tank set up
// for it), and still lets the user go ahead with the original tank if they insist.
import { computed } from 'vue'
import { checkCompatibility, nextTankName, suggestTank } from '../stores/game'
import AlModal from './AlModal.vue'

const props = defineProps({
  // { item, quantity } while the dialog is open, null when it is closed
  pending: { type: Object, default: null },
  tank: { type: Object, required: true },
})
// "add" sends the id of the tank the user chose.
// "new-tank" sends the name for a new tank to create for this fish.
const emit = defineEmits(['close', 'add', 'new-tank'])
const newTankName = computed(() => nextTankName())

const reasons = computed(() =>
  props.pending ? checkCompatibility(props.pending.item, props.tank).reasons : [],
)
const betterTank = computed(() =>
  props.pending ? suggestTank(props.pending.item, props.tank.id) : undefined,
)
</script>

<template>
  <AlModal :open="pending !== null" title="This fish may not be happy here" @close="emit('close')">
    <template v-if="pending">
      <p>
        <span class="al-chip al-chip--bad">Conflict</span>
        <strong class="ms-2">{{ pending.item.name }}</strong> does not suit {{ tank.name }}:
      </p>
      <ul>
        <li v-for="reason in reasons" :key="reason">{{ reason }}</li>
      </ul>

      <p v-if="betterTank" class="al-card mb-3">
        <span class="al-chip al-chip--ok">Fits</span>
        {{ betterTank.name }} has the right conditions for this fish.
      </p>
      <p v-else class="text-muted-al">
        None of your tanks suit this fish right now. You can set up a new tank for it.
      </p>

      <div class="d-grid gap-2">
        <button
          v-if="betterTank"
          class="btn btn-aqua"
          type="button"
          @click="emit('add', betterTank.id)"
        >
          Add to {{ betterTank.name }}
        </button>
        <button
          class="btn"
          :class="betterTank ? 'btn-ghost' : 'btn-aqua'"
          type="button"
          @click="emit('new-tank', newTankName)"
        >
          Create {{ newTankName }} for this fish
        </button>
        <button class="btn btn-ghost" type="button" @click="emit('close')">Cancel</button>
        <button class="btn btn-link" type="button" @click="emit('add', tank.id)">
          Add to {{ tank.name }} anyway
        </button>
      </div>
    </template>
  </AlModal>
</template>
