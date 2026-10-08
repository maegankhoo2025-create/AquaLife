<script setup>
// RouterView displays the page selected by Vue Router.
// useRoute lets us read information about the current page.
import { RouterView, useRoute } from 'vue-router'

// Import the logout button component we just created.
import LogoutButton from './components/LogoutButton.vue'

// Keep track of the current route so the template can check its settings.
const route = useRoute()
</script>

<template>
  <div>
    <!-- Only show the logout button on pages that require authentication. -->
    <header
      v-if="route.meta.requiresAuth"
      class="container d-flex justify-content-end py-3"
    >
      <LogoutButton />
    </header>

    <!-- Vue Router displays the current page here. -->
    <RouterView />
  </div>
</template>

<style scoped></style>
