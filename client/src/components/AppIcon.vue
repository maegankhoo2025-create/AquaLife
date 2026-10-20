<script setup>
// Lucide icons, ISC licensed: https://lucide.dev
import {
  ArrowRight, BookOpen, Bubbles, Camera, Check, ChevronLeft,
  ChevronRight, Coins, Dna, Droplets, Fish, Flame, FlaskConical, History,
  Image as ImageIcon, Info, Leaf, LogOut, Menu, Microscope, Mountain,
  Plus, Settings, Thermometer, Trophy, UserRound, Utensils, Waves, X,
} from '@lucide/vue'

defineProps({
  name: { type: String, default: 'image' },
  size: { type: [Number, String], default: 20 },
})

const icons = {
  fish: Fish, aquarium: Waves, leaf: Leaf, rock: Mountain,
  food: Utensils, clean: Bubbles,
  thermometer: Thermometer, flask: FlaskConical, book: BookOpen, trophy: Trophy,
  check: Check, flame: Flame, coins: Coins, user: UserRound, plus: Plus, x: X,
  menu: Menu, 'log-out': LogOut, history: History, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, info: Info, settings: Settings,
  camera: Camera, dna: Dna, microscope: Microscope, image: ImageIcon,
  'arrow-right': ArrowRight, water: Droplets,
}
</script>

<template>
  <component :is="icons[name] || ImageIcon" :size="size" :stroke-width="1.75" aria-hidden="true" class="app-icon" />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: -0.2em;
}
</style>
