<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { achievements, game, level, xpInLevel, xpPerLevel } from '../stores/game'
import LogoutButton from '../components/LogoutButton.vue'

// First letter of the name, shown inside the avatar circle.
const initial = computed(() => game.user.name.charAt(0).toUpperCase())
const earnedBadges = computed(() => achievements.value.filter((badge) => badge.earned))

function selectTank(tankId) {
  game.currentTankId = tankId
}
</script>

<template>
  <main class="container al-page">
    <!-- Cover, avatar, level and badges -->
    <section class="al-card profile-head mb-3">
      <div class="profile-cover al-water" aria-hidden="true"></div>
      <div class="profile-head__body">
        <div class="avatar" aria-hidden="true">{{ initial }}</div>
        <div class="al-grow">
          <h1 class="al-title">{{ game.user.name }}</h1>
          <p class="text-muted-al mb-2">
            Level {{ level }} · {{ xpInLevel }} / {{ xpPerLevel }} XP
          </p>
          <div class="d-flex flex-wrap gap-2">
            <span v-for="badge in earnedBadges" :key="badge.id" class="al-chip">
              <span aria-hidden="true">{{ badge.emoji }}</span> {{ badge.name }}
            </span>
          </div>
        </div>
        <!-- Log out in the header on desktop only -->
        <div class="d-none d-lg-block">
          <LogoutButton />
        </div>
      </div>
    </section>

    <div class="row g-3">
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Account</h2>
          <div class="mb-3">
            <label for="profile-name" class="form-label">Name</label>
            <input id="profile-name" class="form-control" type="text" :value="game.user.name" readonly />
          </div>
          <div>
            <label for="profile-email" class="form-label">Email address</label>
            <input
              id="profile-email"
              class="form-control"
              type="email"
              :value="game.user.email"
              readonly
            />
          </div>
        </div>
      </section>

      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">My tanks</h2>
          <ul class="al-list">
            <li v-for="tank in game.tanks" :key="tank.id">
              <span class="al-grow">
                {{ tank.name }}
                <span class="d-block small text-muted-al">
                  {{ tank.fish.length }} fish · {{ tank.conditions.temperature }}°C · pH
                  {{ tank.conditions.ph }}
                </span>
              </span>
              <RouterLink class="btn btn-ghost" :to="{ name: 'main-tank' }" @click="selectTank(tank.id)">
                Open
              </RouterLink>
            </li>
          </ul>
        </div>
      </section>

      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Notifications</h2>
          <label class="form-check form-switch al-check">
            <input
              v-model="game.settings.dailyReminder"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />
            <span>Daily care reminder</span>
          </label>
          <label class="form-check form-switch al-check">
            <input
              v-model="game.settings.quizReminder"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />
            <span>Quiz reminder</span>
          </label>
        </div>
      </section>

      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Display</h2>
          <label class="form-check form-switch al-check">
            <input
              v-model="game.settings.reduceMotion"
              class="form-check-input"
              type="checkbox"
              role="switch"
            />
            <span>Reduce motion (turn off animations)</span>
          </label>
        </div>
      </section>
    </div>

    <!-- Log out at the bottom on mobile and tablet -->
    <div class="d-lg-none mt-4">
      <LogoutButton />
    </div>
  </main>
</template>

<style scoped>
.profile-head {
  padding: 0;
  overflow: hidden;
}

.profile-cover {
  height: clamp(90px, 18vw, 180px);
}

.profile-head__body {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  padding: 0 clamp(0.9rem, 0.6rem + 1.2vw, 1.5rem) clamp(0.9rem, 0.6rem + 1.2vw, 1.5rem);
}

/* The avatar overlaps the bottom edge of the cover */
.avatar {
  display: grid;
  place-items: center;
  width: clamp(72px, 14vw, 104px);
  aspect-ratio: 1;
  margin-top: calc(clamp(72px, 14vw, 104px) / -2);
  border: 4px solid var(--al-surface-1);
  border-radius: 50%;
  background: var(--al-aqua);
  color: var(--al-bg);
  font-size: clamp(1.8rem, 1.2rem + 2.5vw, 2.6rem);
  font-weight: 900;
}

.profile-head__body .al-grow {
  flex-basis: 12rem;
  padding-top: 0.75rem;
}

.profile-head__body > .d-lg-block {
  padding-top: 0.75rem;
}
</style>
