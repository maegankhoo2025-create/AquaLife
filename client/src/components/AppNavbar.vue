<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { LOW_PEARLS, useGameStore } from '../stores/game'
import LogoutButton from './LogoutButton.vue'
import PearlCount from './PearlCount.vue'
import AppIcon from './AppIcon.vue'
import AquaLogo from './AquaLogo.vue'
import UserAvatar from './UserAvatar.vue'

const gameStore = useGameStore()
const game = gameStore.game
const { lowOnPearls } = storeToRefs(gameStore)

const links = [
  { to: { name: 'dashboard' }, label: 'Dashboard' },
  { to: { name: 'main-tank' }, label: 'My Tank' },
  { to: { name: 'browse' }, label: 'Shop' },
  { to: { name: 'quiz' }, label: 'Quiz' },
  { to: { name: 'history' }, label: 'History' },
  { to: { name: 'friends' }, label: 'Friends' },
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
        <AquaLogo :size="34" /> AquaLife
      </RouterLink>

      <!-- On small screens the pearl balance sits beside the hamburger button -->
      <div class="d-flex align-items-center gap-2 gap-sm-3 order-lg-last">
        <!-- Turns orange when the balance is below LOW_PEARLS -->
        <span
          class="pearl-pill"
          :class="{ 'pearl-pill--low': lowOnPearls }"
          :title="lowOnPearls ? `Running out of pearls (under ${LOW_PEARLS}). Do care tasks and the quiz to earn more.` : 'Your pearls'"
        >
          <PearlCount :amount="game.pearls" />
        </span>
        <RouterLink class="profile-link" :to="{ name: 'profile' }" aria-label="Open profile">
          <UserAvatar :src="game.user.avatar" :name="game.user.name" :size="30" />
          <span class="d-none d-sm-inline">Profile</span>
        </RouterLink>
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
            <!-- Tapping the current page does not change the route, so close the menu here too. -->
            <RouterLink class="nav-link" active-class="active" :to="link.to" @click="menuOpen = false">
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
  background: color-mix(in srgb, var(--al-surface-1) 88%, transparent);
  backdrop-filter: blur(10px);
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

.profile-link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: var(--al-tap);
  padding: 0.25rem 0.55rem;
  border: 1px solid var(--al-border);
  border-radius: 999px;
  color: var(--al-text);
  font-weight: 700;
  text-decoration: none;
}

.pearl-pill {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 0.75rem;
  border: 1px solid var(--al-border);
  border-radius: 999px;
  background: var(--al-surface-2);
}

.pearl-pill--low {
  border-color: var(--al-warn);
  color: var(--al-warn);
}

/* Keeps the logo, balance, profile and menu button on one row on small phones */
@media (max-width: 575.98px) {
  .navbar-brand {
    margin-right: 0.5rem;
  }
}

@media (hover: hover) {
  .nav-link:hover {
    color: var(--al-text);
  }

  .profile-link:hover {
    border-color: var(--al-aqua);
    color: var(--al-aqua);
  }
}
</style>
