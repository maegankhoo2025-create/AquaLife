<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import PearlCount from '../components/PearlCount.vue'
import TankScene from '../components/TankScene.vue'
import UserAvatar from '../components/UserAvatar.vue'
import { conditionReading, formatDate, game, getItem } from '../stores/game'
import {
  social, loadSocial, loadInvitation, requestFriend, answerRequest, acceptInvitation,
  visitFriend, giftPearls, remindFriend, commentOnTank, canDeleteComment, deleteComment, markRead, invitationUrl, copyInvitation,
  searchUsers, cancelFriendRequest,
} from '../stores/social'

const route = useRoute()
const router = useRouter()
const searchText = ref('')
const searchResults = ref([])
const searchMessage = ref('Type at least 2 letters to search.')
const busyUserId = ref('')
// Goes up on every keystroke, so a slow old answer cannot overwrite a newer one.
let searchNumber = 0
const giftAmount = ref(10)
const giftMessage = ref('')
const comment = ref('')
const selectedTankId = ref('')
const inviteToken = computed(() => typeof route.query.invite === 'string' ? route.query.invite : '')
const shareUrl = computed(() => invitationUrl())
const shareText = 'Join me on AquaLife to visit my aquarium. Follow this link and accept my friend invitation.'
const whatsappUrl = computed(() => `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl.value}`)}`)
const telegramUrl = computed(() => `https://t.me/share/url?url=${encodeURIComponent(shareUrl.value)}&text=${encodeURIComponent(shareText)}`)
const invitedFriend = computed(() => social.friends.some((entry) => entry.user.id === social.inviter?.id))
const selectedTank = computed(() => social.visit?.tanks.find((tank) => tank.id === selectedTankId.value))
const tankComments = computed(() => social.visit?.comments.filter((entry) => String(entry.tank?._id ?? entry.tank) === selectedTankId.value) || [])
const unreadCount = computed(() => social.inbox.filter((entry) => !entry.readAt).length)

onMounted(loadSocial)
watch(inviteToken, (token) => loadInvitation(token), { immediate: true })

// Accepting or cancelling from another card changes these counts.
// Search again so this list matches.
watch(
  () => social.friends.length + social.incoming.length + social.outgoing.length,
  () => {
    onSearchInput()
  },
)

// incoming means they asked me. sent means I already asked them.
function requestStatus(person) {
  for (let i = 0; i < social.incoming.length; i++) {
    if (social.incoming[i].user.id === person.id) {
      return 'incoming'
    }
  }

  for (let i = 0; i < social.outgoing.length; i++) {
    if (social.outgoing[i].user.id === person.id) {
      return 'sent'
    }
  }

  return 'none'
}

function searchButtonLabel(person) {
  const status = requestStatus(person)
  if (status === 'incoming') {
    return 'Accept'
  }
  if (status === 'sent') {
    return 'Request sent'
  }
  return 'Send request'
}

function searchButtonClass(person) {
  const status = requestStatus(person)
  if (status === 'sent') {
    return 'btn-sent'
  }
  return 'btn-aqua'
}

// Runs on every change in the box. v-model has already stored the new text.
async function onSearchInput() {
  const typed = searchText.value.trim()

  searchNumber = searchNumber + 1
  const thisSearch = searchNumber

  if (typed.length < 2) {
    searchResults.value = []
    searchMessage.value = 'Type at least 2 letters to search.'
    return
  }

  try {
    const data = await searchUsers(typed)

    // The user kept typing, so throw this answer away.
    if (thisSearch !== searchNumber) {
      return
    }

    if (Array.isArray(data.users)) {
      searchResults.value = data.users
    } else {
      searchResults.value = []
    }

    if (searchResults.value.length === 0) {
      if (data.message) {
        searchMessage.value = data.message
      } else {
        searchMessage.value = 'No users found.'
      }
    } else {
      searchMessage.value = ''
    }
  } catch (error) {
    console.error('User search failed:', error)
    if (thisSearch !== searchNumber) {
      return
    }
    searchResults.value = []
    searchMessage.value = 'Unable to search for users. Please try again.'
  }
}

// Send, cancel, or accept. The button stays disabled until the server answers.
async function onSearchButton(person) {
  if (busyUserId.value !== '') {
    return
  }
  if (social.busy) {
    return
  }

  busyUserId.value = person.id

  try {
    const status = requestStatus(person)

    if (status === 'incoming') {
      let requestId = ''
      for (let i = 0; i < social.incoming.length; i++) {
        if (social.incoming[i].user.id === person.id) {
          requestId = social.incoming[i].id
        }
      }
      await answerRequest(requestId, 'accept')
    } else if (status === 'sent') {
      let requestId = ''
      for (let i = 0; i < social.outgoing.length; i++) {
        if (social.outgoing[i].user.id === person.id) {
          requestId = social.outgoing[i].id
        }
      }
      await cancelFriendRequest(requestId)
    } else {
      await requestFriend(person.email)
    }

    busyUserId.value = ''
    await onSearchInput()
  } catch (error) {
    console.error('Friend request button failed:', error)
    busyUserId.value = ''
    await onSearchInput()
  }
}

async function acceptLink() {
  if (await acceptInvitation(inviteToken.value)) {
    await router.replace({ query: { ...route.query, invite: undefined } })
  }
}

async function openVisit(id) {
  comment.value = ''
  giftMessage.value = ''
  if (await visitFriend(id)) selectedTankId.value = social.visit.tanks[0]?.id || ''
}

async function sendGift() {
  if (await giftPearls(social.visit.friend.id, giftAmount.value, giftMessage.value)) giftMessage.value = ''
}

async function sendComment() {
  if (await commentOnTank(social.visit.friend.id, selectedTankId.value, comment.value)) comment.value = ''
}
</script>

<template>
  <main class="container al-page">
    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
      <div>
        <h1 class="al-title mb-1">Friends</h1>
        <p class="text-muted-al mb-0">Share your aquarium, visit friends and help each other care for fish.</p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="social.loading || social.busy" @click="loadSocial">
        {{ social.loading ? 'Refreshing…' : 'Refresh friends and inbox' }}
      </button>
    </div>

    <p v-if="social.error" class="al-card text-danger" role="alert">{{ social.error }}</p>

    <section v-if="inviteToken" class="al-card mb-3" aria-labelledby="invitation-heading">
      <h2 id="invitation-heading" class="h5">Friend invitation</h2>
      <p v-if="social.inviteError" class="mb-0" role="alert">{{ social.inviteError }}</p>
      <template v-else-if="social.inviter">
        <p v-if="social.inviter.id === game.user.id" class="mb-0">This is your invitation. Share the link with someone you want to add.</p>
        <p v-else-if="invitedFriend" class="mb-0">You and {{ social.inviter.name }} are already friends.</p>
        <template v-else>
          <p>{{ social.inviter.name }} invited you to be friends. Accept to visit each other's tanks and exchange pearl gifts, reminders and comments.</p>
          <button type="button" class="btn btn-aqua" :disabled="social.busy" @click="acceptLink">Accept invitation</button>
        </template>
      </template>
      <p v-else class="mb-0" role="status">Loading invitation…</p>
    </section>

    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <section class="al-card h-100" aria-labelledby="add-friend-heading">
          <h2 id="add-friend-heading" class="h5"><AppIcon name="user" /> Add a friend</h2>
          <p class="small text-muted-al">Find someone by their name or email. You can visit and interact once they accept.</p>
          <label class="mb-1" for="friend-search">Search by name or email</label>
          <input
            id="friend-search"
            v-model="searchText"
            type="text"
            class="form-control"
            maxlength="254"
            autocomplete="off"
            @input="onSearchInput"
          />
          <p v-if="searchResults.length === 0" class="small text-muted-al mt-2 mb-0" role="status">{{ searchMessage }}</p>
          <ul v-else class="al-list search-results mt-2 mb-0" aria-label="Matching users">
            <li v-for="person in searchResults" :key="person.id">
              <div class="al-grow">
                <div class="search-name">{{ person.name }}</div>
                <div class="search-email">{{ person.email }}</div>
              </div>
              <!-- A sent request shows a status label with its own Unsend button beside it. -->
              <div v-if="requestStatus(person) === 'sent'" class="d-flex flex-wrap justify-content-end gap-2">
                <span class="btn btn-sent sent-label">Request sent</span>
                <button
                  type="button"
                  class="btn btn-ghost"
                  :disabled="social.busy || busyUserId === person.id"
                  @click="onSearchButton(person)"
                >
                  Unsend request
                </button>
              </div>
              <button
                v-else
                type="button"
                class="btn"
                :class="searchButtonClass(person)"
                :disabled="social.busy || busyUserId === person.id"
                @click="onSearchButton(person)"
              >
                {{ searchButtonLabel(person) }}
              </button>
            </li>
          </ul>
        </section>
      </div>
      <div class="col-12 col-lg-6">
        <section class="al-card h-100" aria-labelledby="share-heading">
          <h2 id="share-heading" class="h5">Invite with a link</h2>
          <p class="small text-muted-al">Anyone with this link can choose to accept and become your friend. Share it only with people you want to add.</p>
          <template v-if="shareUrl">
            <label for="invitation-link" class="small mb-1">Your invitation link</label>
            <input id="invitation-link" class="form-control mb-2" :value="shareUrl" readonly @focus="$event.target.select()" />
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-ghost" @click="copyInvitation">Copy link</button>
              <a class="btn btn-ghost" :href="whatsappUrl" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a class="btn btn-ghost" :href="telegramUrl" target="_blank" rel="noopener noreferrer">Telegram</a>
            </div>
          </template>
          <p v-else class="mb-0 text-muted-al">{{ social.loading ? 'Loading your invitation…' : 'Refresh to load your invitation link.' }}</p>
        </section>
      </div>
    </div>

    <!-- Requests sent to me (left) and requests I sent that are not accepted yet (right) -->
    <div class="row g-3 mb-3">
      <div class="col-12 col-lg-6">
        <section class="al-card h-100" aria-labelledby="requests-heading">
          <h2 id="requests-heading" class="h5">Friend requests <span class="small text-muted-al">{{ social.incoming.length }}</span></h2>
          <p v-if="!social.incoming.length" class="text-muted-al mb-0">No incoming requests.</p>
          <ul v-else class="al-list mb-0">
            <li v-for="entry in social.incoming" :key="entry.id" class="d-flex flex-wrap align-items-center gap-2">
              <UserAvatar :src="entry.user.avatar" :name="entry.user.name" :size="36" />
              <span class="al-grow">{{ entry.user.name }} wants to be your friend.</span>
              <button type="button" class="btn btn-aqua" :disabled="social.busy" @click="answerRequest(entry.id, 'accept')">Accept</button>
              <button type="button" class="btn btn-ghost" :disabled="social.busy" @click="answerRequest(entry.id, 'reject')">Reject</button>
            </li>
          </ul>
        </section>
      </div>
      <div class="col-12 col-lg-6">
        <section class="al-card h-100" aria-labelledby="sent-heading">
          <h2 id="sent-heading" class="h5">Sent requests <span class="small text-muted-al">{{ social.outgoing.length }}</span></h2>
          <p v-if="!social.outgoing.length" class="text-muted-al mb-0">No requests waiting. People appear here until they accept.</p>
          <ul v-else class="al-list mb-0">
            <li v-for="entry in social.outgoing" :key="entry.id">
              <UserAvatar :src="entry.user.avatar" :name="entry.user.name" :size="36" />
              <span class="al-grow fw-bold">{{ entry.user.name }}</span>
              <span class="al-chip al-chip--warn">Waiting</span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <section class="al-card mb-3" aria-labelledby="friends-heading">
      <h2 id="friends-heading" class="h5">Your friends <span class="small text-muted-al">{{ social.friends.length }}</span></h2>
      <p v-if="!social.friends.length" class="text-muted-al mb-0">No friends yet. Send a request or share your invitation above.</p>
      <ul v-else class="al-list mb-0">
        <li v-for="entry in social.friends" :key="entry.id" class="d-flex flex-wrap align-items-center gap-2">
          <UserAvatar :src="entry.user.avatar" :name="entry.user.name" :size="36" />
          <span class="al-grow fw-bold">{{ entry.user.name }}</span>
          <button type="button" class="btn btn-ghost" :disabled="social.visiting || social.busy" @click="openVisit(entry.user.id)">
            Visit tanks <AppIcon name="arrow-right" :size="16" />
          </button>
        </li>
      </ul>
    </section>

    <p v-if="social.visiting" class="al-card" role="status">Loading your friend’s aquarium…</p>
    <section v-else-if="social.visit" class="al-card mb-3" aria-labelledby="visit-heading">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h2 id="visit-heading" class="h4 mb-0 d-flex align-items-center gap-2">
          <UserAvatar :src="social.visit.friend.avatar" :name="social.visit.friend.name" :size="40" />
          {{ social.visit.friend.name }}’s aquarium
        </h2>
        <button type="button" class="btn btn-ghost" :disabled="social.busy" @click="social.visit = null">Close visit</button>
      </div>
      <p class="small text-muted-al">You can look around, but only the owner can feed fish, change goals or rearrange the aquarium.</p>
      <template v-if="social.visit.tanks.length">
        <label for="friend-tank" class="mb-1">Choose a tank</label>
        <select id="friend-tank" v-model="selectedTankId" class="form-select mb-3" :disabled="social.busy" @change="comment = ''">
          <option v-for="tank in social.visit.tanks" :key="tank.id" :value="tank.id">{{ tank.name }}</option>
        </select>
        <template v-if="selectedTank">
          <TankScene :tank="selectedTank" :interactive="false" />
          <p class="small text-muted-al mt-2">
            {{ selectedTank.fish.length }} fish · {{ conditionReading(selectedTank.conditions.temperature, 'temperature') }}°C · pH {{ conditionReading(selectedTank.conditions.ph, 'ph') }} · Water quality {{ conditionReading(selectedTank.conditions.waterQuality, 'waterQuality') }}%
          </p>
          <ul v-if="selectedTank.fish.length" class="al-list friend-fish mb-3" aria-label="Friend’s fish">
            <li v-for="fish in selectedTank.fish" :key="fish.id">
              <span class="al-grow">{{ fish.nickname || getItem(fish.speciesId)?.name || 'Fish' }}</span>
              <span v-if="fish.nickname" class="small text-muted-al">{{ getItem(fish.speciesId)?.name }}</span>
            </li>
          </ul>
          <button type="button" class="btn btn-ghost mb-3" :disabled="social.busy" @click="remindFriend(social.visit.friend.id, selectedTank.id)">
            <AppIcon name="food" /> Send feed reminder
          </button>
          <p class="small text-muted-al">Reminders go to your friend's AquaLife inbox. They do not feed fish or send notifications outside the app.</p>
          <h3 class="h5">Tank comments</h3>
          <p v-if="!tankComments.length" class="text-muted-al small">No comments on this tank yet.</p>
          <ul v-else class="comment-list">
            <li v-for="entry in tankComments" :key="entry._id">
              <strong>{{ entry.sender?.name || 'Former aquarist' }}</strong>
              <span class="small text-muted-al"> · {{ formatDate(entry.createdAt) }}</span>
              <p class="message-content mb-0">{{ entry.content }}</p>
              <button v-if="canDeleteComment(entry)" type="button" class="btn btn-ghost btn-sm mt-2" :disabled="social.busy" @click="deleteComment(entry._id)">Delete comment</button>
            </li>
          </ul>
          <form class="mb-4" @submit.prevent="sendComment">
            <label for="tank-comment" class="mb-1">Leave a comment</label>
            <textarea id="tank-comment" v-model="comment" class="form-control mb-2" rows="3" maxlength="500" required :disabled="social.busy"></textarea>
            <div class="d-flex align-items-center gap-3">
              <button type="submit" class="btn btn-aqua" :disabled="social.busy || !comment.trim()">Post comment</button>
              <span class="small text-muted-al">{{ comment.length }}/500</span>
            </div>
          </form>
        </template>
      </template>
      <p v-else class="text-muted-al">Your friend has no tanks yet.</p>
      <section class="gift-panel" aria-labelledby="gift-heading">
        <h3 id="gift-heading" class="h5">Gift pearls to {{ social.visit.friend.name }}</h3>
        <p class="small">Your balance: <PearlCount :amount="game.pearls" />. Gifted pearls come out of this balance.</p>
        <form @submit.prevent="sendGift">
          <label for="gift-amount" class="mb-1">Pearls</label>
          <input id="gift-amount" v-model.number="giftAmount" type="number" min="1" :max="Math.min(game.pearls, 1000000)" step="1" required class="form-control gift-amount mb-2" :disabled="social.busy" />
          <label for="gift-message" class="mb-1">Message (optional)</label>
          <textarea id="gift-message" v-model="giftMessage" maxlength="500" rows="2" class="form-control mb-2" :disabled="social.busy"></textarea>
          <button type="submit" class="btn btn-aqua" :disabled="social.busy || game.pearls < 1">Send pearl gift</button>
        </form>
      </section>
    </section>

    <section class="al-card" aria-labelledby="inbox-heading">
      <h2 id="inbox-heading" class="h5">Your inbox <span class="small text-muted-al">{{ unreadCount }} unread</span></h2>
      <p class="small text-muted-al">Pearl gifts, tank comments and feed reminders arrive here. Use Refresh friends and inbox to get new messages and your latest balance.</p>
      <p v-if="!social.inbox.length" class="text-muted-al mb-0">No messages yet.</p>
      <ul v-else class="inbox-list">
        <li v-for="entry in social.inbox" :key="entry._id" :class="{ 'inbox-unread': !entry.readAt }">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h3 class="h6 mb-0">
              {{ entry.sender?.name || 'Former aquarist' }}
              <template v-if="entry.type === 'gift'"> sent you <PearlCount :amount="entry.amount" /></template>
              <template v-else-if="entry.type === 'comment'"> commented on {{ entry.tank?.name || 'a removed tank' }}</template>
              <template v-else> sent a feed reminder for {{ entry.tank?.name || 'a removed tank' }}</template>
            </h3>
            <span class="small text-muted-al">{{ formatDate(entry.createdAt) }}</span>
          </div>
          <p v-if="entry.content" class="message-content my-2">{{ entry.content }}</p>
          <button v-if="!entry.readAt" type="button" class="btn btn-ghost btn-sm mt-1" @click="markRead(entry._id)">Mark as read</button>
          <span v-else class="small text-muted-al">Read</span>
          <button v-if="canDeleteComment(entry)" type="button" class="btn btn-ghost btn-sm ms-2 mt-1" :disabled="social.busy" @click="deleteComment(entry._id)">Delete comment</button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.search-name {
  font-weight: 800;
  font-size: 1.05rem;
  line-height: 1.2;
}

.search-email {
  color: var(--al-muted);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.search-results .btn {
  flex-shrink: 0;
  white-space: nowrap;
}

/* Request sent: a lighter, whiter blue than the aqua Send request button. */
.btn-sent {
  --bs-btn-bg: #d4f6f8;
  --bs-btn-color: #0a1628;
  --bs-btn-border-color: #d4f6f8;
  --bs-btn-hover-bg: #eefcfd;
  --bs-btn-hover-color: #0a1628;
  --bs-btn-hover-border-color: #eefcfd;
  --bs-btn-active-bg: #eefcfd;
  --bs-btn-active-color: #0a1628;
  --bs-btn-active-border-color: #eefcfd;
  --bs-btn-disabled-bg: var(--al-surface-3);
  --bs-btn-disabled-color: var(--al-muted);
  --bs-btn-disabled-border-color: var(--al-surface-3);
}
/* Status only; the Unsend request button beside it does the cancelling. */
.sent-label {
  pointer-events: none;
  cursor: default;
}
.gift-amount { max-width: 200px; }
.gift-panel { border-top: 1px solid var(--al-border); padding-top: 1.25rem; }
.comment-list, .inbox-list { list-style: none; padding: 0; margin: 0; }
.comment-list li, .inbox-list li { padding: 1rem 0; border-bottom: 1px solid var(--al-border); }
.comment-list { margin-bottom: 1rem; }
.inbox-list li:last-child { border-bottom: 0; padding-bottom: 0; }
.inbox-unread { border-left: 3px solid var(--al-aqua); padding-left: 1rem !important; }
.message-content { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
