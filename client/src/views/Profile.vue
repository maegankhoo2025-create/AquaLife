<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { achievements, game, level, saveProfile, xpInLevel, xpPerLevel } from '../stores/game'
import AppIcon from '../components/AppIcon.vue'

// First letter of the name, shown inside the avatar circle.
const initial = computed(() => game.user.name.charAt(0).toUpperCase())
const earnedBadges = computed(() => achievements.value.filter((badge) => badge.earned))
const name = ref(game.user.name)
const email = ref(game.user.email)
const isSaving = ref(false)
const message = ref('')
const messageIsError = ref(false)

async function handleSave() {
  if (isSaving.value) return
  message.value = ''
  messageIsError.value = false
  isSaving.value = true

  try {
    const data = await saveProfile({ name: name.value, email: email.value })
    name.value = data.user.name
    email.value = data.user.email
    message.value = data.message
  } catch (error) {
    message.value = error.response?.data?.message || 'Unable to update your profile. Please try again.'
    messageIsError.value = true
  } finally {
    isSaving.value = false
  }
}

function selectTank(tankId) {
  game.currentTankId = tankId
}
</script>

<template>
  <main class="container al-page">
    <section class="al-card profile-head mb-3">
      <div class="profile-head__body">
        <div class="avatar" aria-hidden="true">{{ initial }}</div>
        <div class="al-grow">
          <h1 class="al-title">{{ game.user.name }}</h1>
          <p class="text-muted-al mb-2">
            Level {{ level }} · {{ xpInLevel }} / {{ xpPerLevel }} XP
          </p>
          <p class="text-muted-al mb-0">
            {{ earnedBadges.length }} / {{ achievements.length }} achievement badges earned
          </p>
        </div>
      </div>
    </section>

    <div class="row g-3">
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Account</h2>
          <form @submit.prevent="handleSave">
            <div class="mb-3">
              <label for="profile-name" class="form-label">Name</label>
              <input
                id="profile-name"
                v-model="name"
                class="form-control"
                type="text"
                autocomplete="name"
                :disabled="isSaving"
                required
              />
            </div>
            <div class="mb-3">
              <label for="profile-email" class="form-label">Email address</label>
              <input
                id="profile-email"
                v-model="email"
                class="form-control"
                type="email"
                autocomplete="email"
                :disabled="isSaving"
                required
              />
            </div>
            <p
              v-if="message"
              :class="messageIsError ? 'text-danger' : 'text-muted-al'"
              :role="messageIsError ? 'alert' : 'status'"
            >
              {{ message }}
            </p>
            <button class="btn btn-aqua" type="submit" :disabled="isSaving">
              {{ isSaving ? 'Saving…' : 'Save profile' }}
            </button>
          </form>
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

      <section class="col-12">
        <div class="al-card">
          <h2 class="h5">Achievement badges</h2>
          <ul class="badge-grid">
            <li
              v-for="badge in achievements"
              :key="badge.id"
              class="profile-badge"
              :class="{ 'profile-badge--earned': badge.earned }"
            >
              <AppIcon :name="badge.icon" :size="36" class="profile-badge__icon" />
              <div>
                <span class="profile-badge__name">{{ badge.name }}</span>
                <span class="d-block small text-muted-al">
                  {{ badge.earned ? 'Earned' : 'Not yet earned' }}
                </span>
              </div>
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
            <span>Reduce motion</span>
          </label>
        </div>
      </section>
    </div>

    <p class="small text-muted-al mt-4 mb-0">
      Fish artwork:
      <a href="https://www.svgrepo.com/collection/line-fish-vectors/" target="_blank" rel="noopener noreferrer">Agus Dahmiko / SVG Repo</a>,
      <a href="https://www.svgrepo.com/page/licensing/#CC%20Attribution" target="_blank" rel="noopener noreferrer">CC Attribution</a>.
      Recolored and adapted.
    </p>
    <p class="small text-muted-al mt-2 mb-0">
      Plants and decorations:
      <a href="https://www.svgrepo.com/" target="_blank" rel="noopener noreferrer">SVG Repo</a> (CC0),
      with fern and rubble icons by
      <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer">Delapouite / Game-icons.net</a>
      (<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>).
      Recolored; moss proportions adapted.
    </p>
  </main>
</template>

<style scoped>
.profile-head {
  padding: 0;
  overflow: hidden;
}

.profile-head__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: clamp(0.9rem, 0.6rem + 1.2vw, 1.5rem);
}

.avatar {
  display: grid;
  place-items: center;
  width: clamp(72px, 14vw, 104px);
  aspect-ratio: 1;
  border: 4px solid var(--al-surface-1);
  border-radius: 50%;
  background: var(--al-aqua);
  color: var(--al-bg);
  font-size: clamp(1.8rem, 1.2rem + 2.5vw, 2.6rem);
  font-weight: 900;
}

.profile-head__body .al-grow {
  flex-basis: 12rem;
}
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.85rem;
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
}

.profile-badge {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--al-border);
  border-radius: 1rem;
}

.profile-badge--earned {
  border-color: var(--al-aqua);
}

.profile-badge__icon {
  flex-shrink: 0;
}

.profile-badge--earned .profile-badge__icon {
  color: var(--al-aqua);
}

.profile-badge__name {
  display: block;
  overflow-wrap: anywhere;
  font-weight: 700;
}

</style>
