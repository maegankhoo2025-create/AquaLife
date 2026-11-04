<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { conditionReading, xpPerLevel, useGameStore } from '../stores/game'
import BadgeMedal from '../components/BadgeMedal.vue'
import UserAvatar from '../components/UserAvatar.vue'

const gameStore = useGameStore()
const game = gameStore.game
const { achievements, level, xpInLevel, xpPercent } = storeToRefs(gameStore)
const { saveProfile } = gameStore

const earnedBadges = computed(() => achievements.value.filter((badge) => badge.earned))
const lockedBadges = computed(() => achievements.value.filter((badge) => !badge.earned))
// The badge with the highest tier is pinned to the corner of the profile picture.
const topBadge = computed(() => {
  let best = null
  for (const badge of earnedBadges.value) {
    if (!best || badge.tier > best.tier) best = badge
  }
  return best
})
const name = ref(game.user.name)
const email = ref(game.user.email)
const isReadingPicture = ref(false)
const isSaving = ref(false)
const message = ref('')
const messageIsError = ref(false)
const pictureMessage = ref('')
const pictureIsError = ref(false)

// How far along the badge is towards its next tier, from 0 to 100.
function nextTierPercent(badge) {
  if (!badge.nextTarget) return 100
  return Math.min(100, (badge.progress / badge.nextTarget) * 100)
}

// Saves only the picture, straight away, so the navbar and every other screen update at once.
async function savePicture(newAvatar) {
  isSaving.value = true
  try {
    await saveProfile({ avatar: newAvatar })
    pictureMessage.value = newAvatar ? 'Profile picture updated.' : 'Profile picture removed.'
  } catch (error) {
    pictureMessage.value = error.response?.data?.message || 'Unable to save the picture. Please try again.'
    pictureIsError.value = true
  } finally {
    isSaving.value = false
  }
}

async function choosePicture(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || isSaving.value || isReadingPicture.value) return
  pictureMessage.value = ''
  pictureIsError.value = false
  isReadingPicture.value = true
  let sourceUrl
  try {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      throw new Error('Choose a PNG, JPEG or WebP image no larger than 5 MB.')
    }
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const png = file.type === 'image/png' && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
    const jpeg = file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    const webp = file.type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    if (!png && !jpeg && !webp) throw new Error('This file is not a valid PNG, JPEG or WebP image.')
    sourceUrl = URL.createObjectURL(file)
    const image = new Image()
    image.src = sourceUrl
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This image could not be read.')
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    const crop = Math.min(image.naturalWidth, image.naturalHeight)
    context.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, 128, 128)
    const thumbnail = canvas.toDataURL('image/png')
    if (thumbnail.length > 90000) throw new Error('This thumbnail is too large. Choose a simpler image.')
    isReadingPicture.value = false
    await savePicture(thumbnail)
  } catch (error) {
    pictureMessage.value = error.message || 'This image could not be read. Choose another picture.'
    pictureIsError.value = true
  } finally {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    isReadingPicture.value = false
  }
}

async function removePicture() {
  if (isSaving.value || isReadingPicture.value) return
  pictureMessage.value = ''
  pictureIsError.value = false
  await savePicture('')
}

async function handleSave() {
  if (isSaving.value || isReadingPicture.value) return
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
    <!-- Header: picture with the top badge pinned on it, name, earned badge medals and level -->
    <section class="al-card profile-head mb-3">
      <div class="profile-head__picture">
        <UserAvatar :src="game.user.avatar" :name="game.user.name" :size="112" class="profile-head__avatar" />
        <BadgeMedal v-if="topBadge" :badge="topBadge" :size="38" class="profile-head__top-badge" />
      </div>
      <div class="al-grow">
        <h1 class="al-title">{{ game.user.name }}</h1>
        <p class="text-muted-al mb-2">{{ game.user.email }}</p>
        <ul v-if="earnedBadges.length" class="profile-head__medals" aria-label="Badges earned">
          <li v-for="badge in earnedBadges" :key="badge.id">
            <BadgeMedal :badge="badge" :size="30" />
            <span class="small">
              <strong class="d-block">{{ badge.title }}</strong>
              <span class="text-muted-al">{{ badge.tierName }} {{ badge.name }}</span>
            </span>
          </li>
        </ul>
        <p v-else class="small text-muted-al mb-2">No badges yet. Add fish or take the daily quiz to earn your first.</p>
        <div class="d-flex align-items-center gap-2 mt-3">
          <span class="al-chip al-chip--aqua">Level {{ level }}</span>
          <span class="small text-muted-al">{{ xpInLevel }} / {{ xpPerLevel }} XP</span>
        </div>
        <div class="al-progress mt-2 profile-head__xp" role="progressbar" aria-label="XP towards next level" :aria-valuenow="xpInLevel" aria-valuemin="0" :aria-valuemax="xpPerLevel">
          <div :style="{ width: `${xpPercent}%` }"></div>
        </div>
      </div>
    </section>

    <!-- Badges earned so far, then the ones still locked -->
    <section class="al-card mb-3" aria-labelledby="badges-title">
      <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
        <h2 id="badges-title" class="h5 mb-0">My badges</h2>
        <span class="small text-muted-al">{{ earnedBadges.length }} of {{ achievements.length }} earned · each badge has 5 tiers: Bronze, Silver, Gold, Platinum, Diamond</span>
      </div>
      <ul class="badge-grid">
        <li v-for="badge in [...earnedBadges, ...lockedBadges]" :key="badge.id" class="badge-card" :class="`badge-card--tier-${badge.tier}`">
          <BadgeMedal :badge="badge" :size="64" stars />
          <div class="al-grow">
            <span class="badge-card__tier">{{ badge.tierName }}</span>
            <strong class="d-block">{{ badge.name }}</strong>
            <span class="d-block small text-muted-al">{{ badge.earned ? badge.title : `Unlock: ${badge.title}` }}</span>
            <template v-if="badge.nextTarget">
              <div class="badge-progress" role="progressbar" :aria-valuenow="badge.progress" aria-valuemin="0" :aria-valuemax="badge.nextTarget" :aria-label="`${badge.name} progress to ${badge.nextTierName}`">
                <span :style="{ width: `${nextTierPercent(badge)}%` }"></span>
              </div>
              <span class="small text-muted-al">{{ badge.progress }} / {{ badge.nextTarget }} {{ badge.unit }} for {{ badge.nextTierName }}</span>
            </template>
            <span v-else class="small fw-bold">Highest tier reached!</span>
          </div>
        </li>
      </ul>
    </section>

    <div class="row g-3">
      <section class="col-12 col-md-6">
        <div class="al-card h-100">
          <h2 class="h5">Account</h2>
          <div class="picture-field mb-3">
            <UserAvatar :src="game.user.avatar" :name="game.user.name" :size="72" />
            <div class="al-grow">
              <label for="profile-picture" class="form-label mb-1">Profile picture</label>
              <input id="profile-picture" type="file" accept="image/png,image/jpeg,image/webp" class="form-control picture-input" :disabled="isSaving || isReadingPicture" @change="choosePicture" />
              <p class="small text-muted-al mt-1 mb-1">PNG, JPEG or WebP up to 5 MB. It is saved straight away.</p>
              <p v-if="isReadingPicture" class="small text-muted-al mb-1" role="status">Preparing picture…</p>
              <p v-if="pictureMessage" class="small mb-1" :class="pictureIsError ? 'text-danger' : 'text-muted-al'" :role="pictureIsError ? 'alert' : 'status'">{{ pictureMessage }}</p>
              <button type="button" class="btn btn-ghost btn-sm" :disabled="!game.user.avatar || isSaving || isReadingPicture" @click="removePicture">Remove picture</button>
            </div>
          </div>
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
            <button class="btn btn-aqua" type="submit" :disabled="isSaving || isReadingPicture">
              {{ isSaving ? 'Saving…' : 'Save name and email' }}
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
                  {{ tank.fish.length }} fish · {{ conditionReading(tank.conditions.temperature, 'temperature') }}°C · pH
                  {{ conditionReading(tank.conditions.ph, 'ph') }}
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
            <span>Reduce motion</span>
          </label>
        </div>
      </section>
    </div>

  </main>
</template>

<style scoped>
.profile-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  background:
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--al-aqua) 18%, transparent), transparent 55%),
    var(--al-surface-1);
}

.profile-head .al-grow {
  flex-basis: 16rem;
}

.profile-head__picture {
  position: relative;
  flex-shrink: 0;
}

.profile-head__avatar {
  box-shadow: 0 0 0 4px var(--al-surface-1), 0 0 0 6px var(--al-aqua);
}

/* The top badge sits on the bottom-right edge of the picture */
.profile-head__top-badge {
  position: absolute;
  right: -6px;
  bottom: -6px;
}

.profile-head__medals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0;
  margin: 0.5rem 0 0;
  list-style: none;
}

.profile-head__medals li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-head__xp {
  max-width: 28rem;
}

/* The "Choose file" button fills the whole bar; the "No file chosen" text is pushed out of view */
.picture-input {
  padding: 0;
  overflow: hidden;
}

.picture-input::file-selector-button {
  width: 100%;
  min-height: var(--al-tap);
  margin: 0;
  border: 0;
  font-weight: 700;
}

.picture-field {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: 0.85rem;
  padding: 0;
  margin: 1rem 0 0;
  list-style: none;
}

.badge-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--al-border);
  border-radius: var(--al-radius);
  background: var(--al-surface-2);
}

.badge-card--tier-0 {
  background: transparent;
  border-style: dashed;
}

.badge-card__tier {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--al-muted);
}

.badge-card--tier-1 .badge-card__tier { color: #f0b27a; }
.badge-card--tier-2 .badge-card__tier { color: #dfe6ef; }
.badge-card--tier-3 .badge-card__tier { color: #ffd65c; }
.badge-card--tier-4 .badge-card__tier { color: #7ff3f0; }
.badge-card--tier-5 .badge-card__tier { color: #c9b3ff; }

.badge-progress {
  height: 6px;
  margin: 0.5rem 0 0.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--al-surface-3);
}

.badge-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--al-aqua);
  transition: width 180ms ease;
}
</style>
