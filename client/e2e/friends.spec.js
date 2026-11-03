import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'

const API = 'http://localhost:8000'

test.describe.configure({ timeout: 60000 })

// Closed after each test so the two browser windows do not pile up.
let contexts = []

test.afterEach(async () => {
  await Promise.all(contexts.map((context) => context.close()))
  contexts = []
})

function navLink(page, name) {
  return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true })
}

async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

function section(page, heading) {
  return page.getByRole('region', { name: new RegExp(`^${heading}`) })
}

async function openFriends(page) {
  await navLink(page, 'Friends').click()
  await expect(page.getByRole('heading', { name: 'Friends', level: 1 })).toBeVisible()
}

async function refresh(page) {
  await page.getByRole('button', { name: 'Refresh friends and inbox' }).click()
  await expect(page.getByRole('button', { name: 'Refresh friends and inbox' })).toBeEnabled()
}

// A logged-in user in their own browser context. The helper names every account
// "E2E Tester" and search only returns 10 people, so each user gets a unique name.
async function freshUser(browser, label, contextOptions = {}) {
  const context = await browser.newContext(contextOptions)
  contexts.push(context)
  const page = await context.newPage()
  const account = await signUpFreshUser(page)
  const name = `${label} ${randomUUID().slice(0, 8)}`

  await page.getByRole('link', { name: 'Open profile' }).click()
  await page.getByLabel('Name', { exact: true }).fill(name)
  await page.getByRole('button', { name: 'Save name and email' }).click()
  await expect(page.getByText('Profile updated successfully.')).toBeVisible()

  await openFriends(page)
  return { page, context, name, email: account.email }
}

async function invitationLink(user) {
  const field = user.page.getByLabel('Your invitation link')
  await expect(field).toHaveValue(/\/friends\?invite=[a-f\d]{48}$/)
  return field.inputValue()
}

// Used by tests that are about what friends do, not about how they became friends.
async function becomeFriends(a, b) {
  await b.page.goto(await invitationLink(a))
  await b.page.getByRole('button', { name: 'Accept invitation' }).click()
  await expect(section(b.page, 'Your friends').getByText(a.name)).toBeVisible()
  await refresh(a.page)
  await expect(section(a.page, 'Your friends').getByText(b.name)).toBeVisible()
}

async function visit(visitor, friend) {
  await section(visitor.page, 'Your friends').getByRole('button', { name: /Visit tanks/ }).click()
  const aquarium = section(visitor.page, `${friend.name}’s aquarium`)
  await expect(aquarium).toBeVisible()
  return aquarium
}

async function buyZebraDanio(user) {
  await navLink(user.page, 'Shop').click()
  await user.page.getByRole('button', { name: /Zebra Danio/ }).click()
  await user.page.getByRole('dialog', { name: 'Zebra Danio' }).getByRole('button', { name: /^Add to Tank 1/ }).click()
  await expect(user.page.getByText('Added 1 × Zebra Danio to Tank 1.')).toBeVisible()
  await openFriends(user.page)
}

test('friend request: A finds B by name, B accepts, and both see each other as friends', async ({ browser }) => {
  const a = await freshUser(browser, 'Requester')
  const b = await freshUser(browser, 'Receiver')

  await a.page.getByLabel('Search by name or email').fill(b.name)
  const match = a.page.getByRole('list', { name: 'Matching users' }).getByRole('listitem').filter({ hasText: b.name })
  await match.getByRole('button', { name: 'Send request' }).click()
  await expect(a.page.getByText('Friend request sent.')).toBeVisible()
  await expect(match.getByText('Request sent')).toBeVisible()
  await expect(section(a.page, 'Sent requests').getByText(b.name)).toBeVisible()

  await refresh(b.page)
  const request = section(b.page, 'Friend requests').getByRole('listitem').filter({
    hasText: `${a.name} wants to be your friend.`,
  })
  await request.getByRole('button', { name: 'Accept' }).click()
  await expect(b.page.getByText('Friend request accepted.')).toBeVisible()

  await expect(section(b.page, 'Your friends').getByText(a.name)).toBeVisible()
  await expect(section(b.page, 'Friend requests').getByText('No incoming requests.')).toBeVisible()

  await refresh(a.page)
  await expect(section(a.page, 'Your friends').getByText(b.name)).toBeVisible()
  await expect(section(a.page, 'Sent requests').getByText('No requests waiting.')).toBeVisible()
})

test('friend request: when B rejects it, neither user becomes a friend', async ({ browser }) => {
  const a = await freshUser(browser, 'Requester')
  const b = await freshUser(browser, 'Receiver')

  await a.page.getByLabel('Search by name or email').fill(b.name)
  const match = a.page.getByRole('list', { name: 'Matching users' }).getByRole('listitem').filter({ hasText: b.name })
  await match.getByRole('button', { name: 'Send request' }).click()
  await expect(section(a.page, 'Sent requests').getByText(b.name)).toBeVisible()

  await refresh(b.page)
  await section(b.page, 'Friend requests').getByRole('button', { name: 'Reject' }).click()
  await expect(b.page.getByText('Friend request rejected.')).toBeVisible()

  await expect(section(b.page, 'Friend requests').getByText('No incoming requests.')).toBeVisible()
  await expect(section(b.page, 'Your friends').getByText('No friends yet.')).toBeVisible()

  await refresh(a.page)
  await expect(section(a.page, 'Sent requests').getByText('No requests waiting.')).toBeVisible()
  await expect(section(a.page, 'Your friends').getByText('No friends yet.')).toBeVisible()
})

test('invite link: A copies the link, B opens and accepts it, and they become friends', async ({ browser }) => {
  const a = await freshUser(browser, 'Inviter', { permissions: ['clipboard-read', 'clipboard-write'] })
  const b = await freshUser(browser, 'Invitee')

  await a.page.bringToFront()
  await a.page.getByRole('button', { name: 'Copy link' }).click()
  await expect(a.page.getByText('Invitation link copied.')).toBeVisible()
  const copiedLink = await a.page.evaluate(() => navigator.clipboard.readText())
  expect(copiedLink).toBe(await invitationLink(a))

  await b.page.goto(copiedLink)
  await expect(section(b.page, 'Friend invitation').getByText(`${a.name} invited you to be friends.`)).toBeVisible()
  await b.page.getByRole('button', { name: 'Accept invitation' }).click()

  await expect(b.page.getByText(`You and ${a.name} are now friends.`)).toBeVisible()
  await expect(section(b.page, 'Your friends').getByText(a.name)).toBeVisible()
  await expect(b.page).toHaveURL(/\/friends\/?$/)

  await refresh(a.page)
  await expect(section(a.page, 'Your friends').getByText(b.name)).toBeVisible()
})

test('visit: A sees B’s tank and fish read-only, with no way to change them', async ({ browser }) => {
  const a = await freshUser(browser, 'Visitor')
  const b = await freshUser(browser, 'Host')
  await buyZebraDanio(b)
  await becomeFriends(a, b)

  const aquarium = await visit(a, b)

  await expect(aquarium.getByText('only the owner can feed fish, change goals or rearrange the aquarium.')).toBeVisible()
  await expect(aquarium.getByLabel('Choose a tank')).toContainText('Tank 1')
  await expect(aquarium.getByRole('group', { name: 'Tank 1 with 1 fish' })).toBeVisible()
  await expect(aquarium.getByRole('list', { name: 'Friend’s fish' }).getByText('Zebra Danio')).toBeVisible()

  // In a read-only tank the fish is a picture, not a button that opens its care card.
  await expect(aquarium.getByRole('img', { name: 'Zebra Danio' })).toBeVisible()
  await expect(aquarium.getByRole('button', { name: 'Zebra Danio' })).toHaveCount(0)

  for (const ownerAction of ['Decorate', /^Feed fish/, /^Clean tank/, /^Check temperature/, /^Check pH/, /^Remove/, 'Save goals']) {
    await expect(a.page.getByRole('button', { name: ownerAction })).toHaveCount(0)
  }
})

test('comment: A comments on B’s tank, B sees it in the inbox and can delete it', async ({ browser }) => {
  const a = await freshUser(browser, 'Commenter')
  const b = await freshUser(browser, 'Host')
  await becomeFriends(a, b)
  const content = `Lovely tank ${randomUUID().slice(0, 8)}`

  const aquarium = await visit(a, b)
  await aquarium.getByLabel('Leave a comment').fill(content)
  await aquarium.getByRole('button', { name: 'Post comment' }).click()
  await expect(a.page.getByText('Comment added to the tank and your friend’s inbox.')).toBeVisible()
  await expect(section(a.page, `${b.name}’s aquarium`).getByText(content)).toBeVisible()

  await refresh(b.page)
  const inbox = section(b.page, 'Your inbox')
  await expect(inbox.getByRole('heading', { name: `${a.name} commented on Tank 1` })).toBeVisible()
  await expect(inbox.getByText(content)).toBeVisible()
  await expect(inbox.getByText('1 unread')).toBeVisible()

  await inbox.getByRole('button', { name: 'Delete comment' }).click()
  await expect(b.page.getByText('Comment deleted.')).toBeVisible()
  await expect(inbox.getByText(content)).toHaveCount(0)
  await expect(inbox.getByText('No messages yet.')).toBeVisible()

  // It is gone for good, for the owner and for the friend who wrote it.
  await b.page.reload()
  await expect(section(b.page, 'Your inbox').getByText('No messages yet.')).toBeVisible()

  await a.page.reload()
  const revisited = await visit(a, b)
  await expect(revisited.getByText('No comments on this tank yet.')).toBeVisible()
})

test('reminder: A sends a feed reminder, B sees it in the inbox and can mark it as read', async ({ browser }) => {
  const a = await freshUser(browser, 'Reminder')
  const b = await freshUser(browser, 'Host')
  await becomeFriends(a, b)

  const aquarium = await visit(a, b)
  await aquarium.getByRole('button', { name: 'Send feed reminder' }).click()
  await expect(a.page.getByText('Feed reminder sent to your friend’s inbox.')).toBeVisible()

  await refresh(b.page)
  const inbox = section(b.page, 'Your inbox')
  await expect(inbox.getByRole('heading', { name: `${a.name} sent a feed reminder for Tank 1` })).toBeVisible()
  await expect(inbox.getByText('Remember to check whether the fish in Tank 1 need feeding.')).toBeVisible()
  await expect(inbox.getByText('1 unread')).toBeVisible()

  await inbox.getByRole('button', { name: 'Mark as read' }).click()
  await expect(inbox.getByText('0 unread')).toBeVisible()
  await expect(inbox.getByText('Read', { exact: true })).toBeVisible()
  await expect(inbox.getByRole('button', { name: 'Mark as read' })).toHaveCount(0)

  await b.page.reload()
  const reloadedInbox = section(b.page, 'Your inbox')
  await expect(reloadedInbox.getByText('0 unread')).toBeVisible()
  await expect(reloadedInbox.getByText('Read', { exact: true })).toBeVisible()
})

test('gift: 10 pearls leave A, reach B after refreshing, and show as Gift in both histories', async ({ browser }) => {
  const a = await freshUser(browser, 'Giver')
  const b = await freshUser(browser, 'Getter')
  await becomeFriends(a, b)
  await expectBalance(a.page, 500)
  await expectBalance(b.page, 500)

  const aquarium = await visit(a, b)
  await aquarium.getByRole('spinbutton', { name: 'Pearls' }).fill('10')
  await aquarium.getByRole('button', { name: 'Send pearl gift' }).click()

  await expect(a.page.getByText(`Sent 10 pearls to ${b.name}.`)).toBeVisible()
  await expectBalance(a.page, 490)

  // B's balance only changes once B asks the server for the latest.
  await expectBalance(b.page, 500)
  await refresh(b.page)
  await expectBalance(b.page, 510)
  await expect(section(b.page, 'Your inbox').getByRole('heading', { name: `${a.name} sent you 10 pearls` })).toBeVisible()

  await navLink(a.page, 'History').click()
  const sentRow = a.page.getByRole('row', { name: new RegExp(`Gift to ${b.name}`) })
  await expect(sentRow).toContainText('Gift')
  await expect(sentRow).toContainText('-10')

  await navLink(b.page, 'History').click()
  const receivedRow = b.page.getByRole('row', { name: new RegExp(`Gift from ${a.name}`) })
  await expect(receivedRow).toContainText('Gift')
  await expect(receivedRow).toContainText('+10')

  await a.page.reload()
  await b.page.reload()
  await expectBalance(a.page, 490)
  await expectBalance(b.page, 510)
})

test('gift: more pearls than A has is blocked by the page and the server, and neither balance changes', async ({ browser }) => {
  const a = await freshUser(browser, 'Giver')
  const b = await freshUser(browser, 'Getter')
  await becomeFriends(a, b)

  const giftRequests = []
  a.page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/gifts')) giftRequests.push(request)
  })

  const aquarium = await visit(a, b)
  const amount = aquarium.getByRole('spinbutton', { name: 'Pearls' })
  await amount.fill('501')
  await aquarium.getByRole('button', { name: 'Send pearl gift' }).click()

  expect(await amount.evaluate((element) => element.validationMessage)).not.toBe('')
  expect(giftRequests).toHaveLength(0)

  // Someone could skip the form, so the server must refuse the same gift by itself.
  const friends = await (await a.context.request.get(`${API}/api/friends`)).json()
  const response = await a.context.request.post(`${API}/api/friends/${friends.friends[0].user.id}/gifts`, {
    data: { amount: 501 },
  })
  expect(response.status()).toBe(400)
  expect((await response.json()).message).toBe('You do not have enough pearls for this gift.')

  await a.page.reload()
  await expectBalance(a.page, 500)
  await refresh(b.page)
  await expectBalance(b.page, 500)
  await expect(section(b.page, 'Your inbox').getByText('No messages yet.')).toBeVisible()
})
