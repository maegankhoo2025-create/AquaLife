<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { game } from '../stores/game'
import LogoutButton from './LogoutButton.vue'
import PearlCount from './PearlCount.vue'
import AppIcon from './AppIcon.vue'

const links = [
  { to: { name: 'dashboard' }, label: 'Dashboard' },
  { to: { name: 'main-tank' }, label: 'My Tank' },
  { to: { name: 'browse' }, label: 'Shop' },
  { to: { name: 'quiz' }, label: 'Quiz' },
  { to: { name: 'history' }, label: 'History' },
  { to: { name: 'friends' }, label: 'Friends' },
  { to: { name: 'profile' }, label: 'Profile' },
]

// Whether the hamburger menu is open (only matters below the lg breakpoint).
const menuOpen = ref(false)

// Close the menu whenever the user moves to another page.
const route = useRoute()
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)
</script>

<template>
  <!-- navbar-expand-lg: full links from 992px, hamburger menu below that -->
  <nav class="navbar navbar-expand-lg sticky-top app-navbar" aria-label="Main">
    <div class="container">
      <RouterLink class="navbar-brand" :to="{ name: 'dashboard' }">
        <AppIcon name="fish" :size="26" /> AquaLife
      </RouterLink>

      <!-- On small screens the pearl balance sits beside the hamburger button -->
      <div class="d-flex align-items-center gap-3 order-lg-last">
        <PearlCount :amount="game.pearls" />
        <!-- From lg up there is no hamburger, so Log out sits here, right of the pearls -->
        <LogoutButton class="d-none d-lg-block" />
        <button
          class="navbar-toggler"
          type="button"
          aria-controls="main-menu"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <AppIcon :name="menuOpen ? 'x' : 'menu'" />
        </button>
      </div>

      <div id="main-menu" class="collapse navbar-collapse" :class="{ show: menuOpen }">
        <ul class="navbar-nav me-auto">
          <li v-for="link in links" :key="link.label" class="nav-item">
            <RouterLink class="nav-link" active-class="active" :to="link.to">
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
        <!-- Below lg, Log out stays inside the hamburger menu -->
        <div class="d-lg-none py-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.app-navbar {
  background: var(--al-surface-1);
  border-bottom: 1px solid var(--al-border);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: var(--al-tap);
  font-weight: 900;
  color: var(--al-aqua);
}

.nav-link {
  display: flex;
  align-items: center;
  min-height: var(--al-tap);
  font-weight: 700;
  color: var(--al-muted);
}

.nav-link.active {
  color: var(--al-aqua);
}

.navbar-toggler {
  display: grid;
  place-items: center;
  min-width: var(--al-tap);
  min-height: var(--al-tap);
  border-color: var(--al-border);
}

@media (hover: hover) {
  .nav-link:hover {
    color: var(--al-text);
  }
}
</style>
