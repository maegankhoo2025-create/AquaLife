<script setup>
// RouterView displays the page selected by Vue Router.
// useRoute lets us read information about the current page.
import { watchEffect } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppNavbar from './components/AppNavbar.vue'
import { game, toast } from './stores/game'

// Keep track of the current route so the template can check its settings.
const route = useRoute()

// Profile setting: add a class to <html> that switches off all animations.
watchEffect(() => {
  document.documentElement.classList.toggle('al-reduce-motion', game.settings.reduceMotion)
})
</script>

<template>
  <div>
    <!-- Only show the navbar (with the logout button) on pages that require authentication. -->
    <AppNavbar v-if="route.meta.requiresAuth" />

    <!-- Vue Router displays the current page here. -->
    <RouterView />

    <!-- Short confirmation messages, e.g. after buying a fish. Screen readers announce it. -->
    <div class="al-toast" :class="{ 'al-toast--bad': toast.bad }" role="status" :hidden="!toast.text">
      {{ toast.text }}
    </div>
  </div>
</template>
