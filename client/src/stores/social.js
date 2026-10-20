import { reactive } from 'vue'
import LoginApi from '../LoginApi'
import { game, notify } from './game'

export const social = reactive({
  userId: null,
  friends: [], incoming: [], outgoing: [], inbox: [], inviteToken: '',
  inviter: null, inviteError: '',
  visit: null, loading: false, visiting: false, busy: false, error: '',
})

function errorText(error, fallback) {
  return error.response?.data?.message || fallback
}

function resetForUser() {
  if (social.userId === game.user.id) return
  social.userId = game.user.id
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

export async function loadSocial() {
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
    game.pearls = data.pearls
    game.history = history.data.history.map((entry) => ({ ...entry, id: entry._id }))
    return true
  } catch (error) {
    social.error = errorText(error, 'Unable to load your friends. Please try again.')
    return false
  } finally {
    social.loading = false
  }
}

export async function loadInvitation(token) {
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
  if (social.busy) return false
  social.busy = true
  try {
    const response = await action()
    if (typeof response.data.pearls === 'number') game.pearls = response.data.pearls
    notify(response.data.message)
    await loadSocial()
    return true
  } catch (error) {
    notify(errorText(error, 'Unable to complete this action. Please try again.'), true)
    return false
  } finally {
    social.busy = false
  }
}

export function requestFriend(email) {
  return change(() => LoginApi.post('/api/friends/requests', { email }))
}

export function answerRequest(id, action) {
  return change(() => LoginApi.patch(`/api/friends/requests/${id}`, { action }))
}

export function acceptInvitation(token) {
  return change(() => LoginApi.post(`/api/friends/invitations/${encodeURIComponent(token)}/accept`))
}

export async function visitFriend(id) {
  social.visiting = true
  social.visit = null
  try {
    const response = await LoginApi.get(`/api/friends/${id}/tanks`)
    social.visit = {
      friend: response.data.friend,
      comments: response.data.comments,
      tanks: response.data.tanks.map((tank) => ({
        ...tank, id: tank._id,
        fish: tank.fish.map((fish) => ({ ...fish, id: fish._id })),
        decorations: tank.decorations.map((item) => ({ ...item, id: item._id })),
      })),
    }
    return true
  } catch (error) {
    notify(errorText(error, 'Unable to visit this friend’s tanks.'), true)
    return false
  } finally {
    social.visiting = false
  }
}

export function giftPearls(friendId, amount, message) {
  return change(() => LoginApi.post(`/api/friends/${friendId}/gifts`, { amount, message }))
}

export function remindFriend(friendId, tankId) {
  return change(() => LoginApi.post(`/api/friends/${friendId}/reminders`, { tankId }))
}

export async function commentOnTank(friendId, tankId, content) {
  const sent = await change(() => LoginApi.post(`/api/friends/${friendId}/comments`, { tankId, content }))
  if (sent && social.visit?.friend.id === friendId) await visitFriend(friendId)
  return sent
}

export async function markRead(id) {
  try {
    const response = await LoginApi.patch(`/api/friends/messages/${id}/read`)
    const entry = social.inbox.find((message) => message._id === id)
    if (entry) entry.readAt = response.data.message.readAt
  } catch (error) {
    notify(errorText(error, 'Unable to mark this message as read.'), true)
  }
}

export function invitationUrl() {
  if (!social.inviteToken) return ''
  return `${window.location.origin}/friends?invite=${encodeURIComponent(social.inviteToken)}`
}

export async function copyInvitation() {
  try {
    await navigator.clipboard.writeText(invitationUrl())
    notify('Invitation link copied.')
  } catch {
    notify('Copy the invitation from the link field below.', true)
  }
}
