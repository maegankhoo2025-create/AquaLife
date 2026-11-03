import { reactive } from 'vue'
import { defineStore } from 'pinia'
import LoginApi from '../LoginApi'
import { useGameStore } from './game'

const social = reactive({
  userId: null,
  friends: [], incoming: [], outgoing: [], inbox: [], inviteToken: '',
  inviter: null, inviteError: '',
  visit: null, loading: false, visiting: false, busy: false, error: '',
})

function errorText(error, fallback) {
  return error.response?.data?.message || fallback
}

function resetForUser() {
  const gameStore = useGameStore()
  if (social.userId === gameStore.game.user.id) return
  social.userId = gameStore.game.user.id
  social.friends = []
  social.incoming = []
  social.outgoing = []
  social.inbox = []
  social.inviteToken = ''
  social.inviter = null
  social.inviteError = ''
  social.visit = null
  social.error = ''
}

async function loadSocial() {
  const gameStore = useGameStore()
  resetForUser()
  social.loading = true
  social.error = ''
  try {
    const [response, history] = await Promise.all([
      LoginApi.get('/api/friends'), LoginApi.get('/api/game/history'),
    ])
    const data = response.data
    social.friends = data.friends
    social.incoming = data.incoming
    social.outgoing = data.outgoing
    social.inbox = data.inbox
    social.inviteToken = data.inviteToken
    gameStore.game.pearls = data.pearls
    gameStore.game.history = history.data.history.map((entry) => ({ ...entry, id: entry._id }))
    return true
  } catch (error) {
    social.error = errorText(error, 'Unable to load your friends. Please try again.')
    return false
  } finally {
    social.loading = false
  }
}

async function loadInvitation(token) {
  resetForUser()
  social.inviter = null
  social.inviteError = ''
  if (!token) return
  try {
    const response = await LoginApi.get(`/api/friends/invitations/${encodeURIComponent(token)}`)
    social.inviter = response.data.inviter
  } catch (error) {
    social.inviteError = errorText(error, 'Unable to load this invitation.')
  }
}

async function change(action) {
  const gameStore = useGameStore()
  if (social.busy) return false
  social.busy = true
  try {
    const response = await action()
    if (typeof response.data.pearls === 'number') gameStore.game.pearls = response.data.pearls
    gameStore.notify(response.data.message)
    await loadSocial()
    return true
  } catch (error) {
    gameStore.notify(errorText(error, 'Unable to complete this action. Please try again.'), true)
    return false
  } finally {
    social.busy = false
  }
}

function requestFriend(email) {
  return change(() => LoginApi.post('/api/friends/requests', { email }))
}

// Ask the server for matching users. This does not use change(), because
// typing in the search box should not reload the whole page or pop up a toast.
async function searchUsers(text) {
  const response = await LoginApi.get('/api/friends/search', {
    params: {
      q: text,
    },
  })
  return response.data
}

// Cancel a request I sent. change() reloads the friends lists,
// so the Sent requests card updates to match.
function cancelFriendRequest(id) {
  return change(() => LoginApi.delete(`/api/friends/requests/${id}`))
}

function answerRequest(id, action) {
  return change(() => LoginApi.patch(`/api/friends/requests/${id}`, { action }))
}

function acceptInvitation(token) {
  return change(() => LoginApi.post(`/api/friends/invitations/${encodeURIComponent(token)}/accept`))
}

async function visitFriend(id) {
  const gameStore = useGameStore()
  social.visiting = true
  social.visit = null
  try {
    const response = await LoginApi.get(`/api/friends/${id}/tanks`)
    social.visit = {
      friend: response.data.friend,
      comments: response.data.comments,
      tanks: response.data.tanks.map((tank) => ({
        ...tank, id: tank._id,
        progression: tank.progression,
        fish: tank.fish.map((fish) => ({ ...fish, id: fish._id })),
        decorations: tank.decorations.map((item) => ({ ...item, id: item._id })),
      })),
    }
    return true
  } catch (error) {
    gameStore.notify(errorText(error, 'Unable to visit this friend’s tanks.'), true)
    return false
  } finally {
    social.visiting = false
  }
}

function giftPearls(friendId, amount, message) {
  return change(() => LoginApi.post(`/api/friends/${friendId}/gifts`, { amount, message }))
}

function remindFriend(friendId, tankId) {
  return change(() => LoginApi.post(`/api/friends/${friendId}/reminders`, { tankId }))
}

async function commentOnTank(friendId, tankId, content) {
  const sent = await change(() => LoginApi.post(`/api/friends/${friendId}/comments`, { tankId, content }))
  if (sent && social.visit?.friend.id === friendId) await visitFriend(friendId)
  return sent
}

function canDeleteComment(entry) {
  const gameStore = useGameStore()
  const senderId = entry.sender?._id ?? entry.sender?.id ?? entry.sender
  return entry.type === 'comment' && (
    String(senderId) === String(gameStore.game.user.id) || entry.canDeleteComment === true
  )
}

async function deleteComment(id) {
  const gameStore = useGameStore()
  if (social.busy) return false
  social.busy = true
  try {
    const response = await LoginApi.delete(`/api/friends/comments/${id}`)
    const deletedId = String(response.data.id)
    social.inbox = social.inbox.filter((entry) => String(entry._id) !== deletedId)
    if (social.visit) {
      social.visit.comments = social.visit.comments.filter((entry) => String(entry._id) !== deletedId)
    }
    gameStore.notify(response.data.message)
    return true
  } catch (error) {
    gameStore.notify(errorText(error, 'Unable to delete this comment. Please try again.'), true)
    return false
  } finally {
    social.busy = false
  }
}

async function markRead(id) {
  const gameStore = useGameStore()
  try {
    const response = await LoginApi.patch(`/api/friends/messages/${id}/read`)
    const entry = social.inbox.find((message) => message._id === id)
    if (entry) entry.readAt = response.data.message.readAt
  } catch (error) {
    gameStore.notify(errorText(error, 'Unable to mark this message as read.'), true)
  }
}

function invitationUrl() {
  if (!social.inviteToken) return ''
  return `${window.location.origin}/friends?invite=${encodeURIComponent(social.inviteToken)}`
}

async function copyInvitation() {
  const gameStore = useGameStore()
  try {
    await navigator.clipboard.writeText(invitationUrl())
    gameStore.notify('Invitation link copied.')
  } catch {
    gameStore.notify('Copy the invitation from the link field below.', true)
  }
}

export const useSocialStore = defineStore('social', () => ({
  social,
  loadSocial,
  loadInvitation,
  requestFriend,
  searchUsers,
  cancelFriendRequest,
  answerRequest,
  acceptInvitation,
  visitFriend,
  giftPearls,
  remindFriend,
  commentOnTank,
  canDeleteComment,
  deleteComment,
  markRead,
  invitationUrl,
  copyInvitation,
}))
