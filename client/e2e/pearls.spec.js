import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { ANGELFISH, CRUSHED_CORAL, JAVA_MOSS, SUNKEN_CASTLE, THERMOSTATIC_HEATER } from './products.js'
import {
  STARTING_PEARLS,
  addButton,
  buyItem,
  expectBalance,
  historyEntries,
  navLink,
  openHistory,
  openItem,
  openMyTank,
  openShop,
} from './shop-helpers.js'

const API = 'http://localhost:8000'

// LOW_PEARLS in client/src/stores/game.js: the warning shows below this balance, not at it.
const LOW_PEARLS = 100
const CASTLES_TO_REACH_THRESHOLD = (STARTING_PEARLS - LOW_PEARLS) / SUNKEN_CASTLE.price
const LOW_BALANCE = LOW_PEARLS - JAVA_MOSS.price

async function reachThreshold(page) {
  await buyItem(page, SUNKEN_CASTLE, { quantity: CASTLES_TO_REACH_THRESHOLD })
  await expectBalance(page, LOW_PEARLS)
}

async function reachLowBalance(page) {
  await reachThreshold(page)
  await buyItem(page, JAVA_MOSS, { confirmLow: true })
  await expectBalance(page, LOW_BALANCE)
}

test('a balance exactly at the threshold gives no low-pearl warning', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)

  await expect(page.getByRole('dialog', { name: 'Running low on pearls?' })).toHaveCount(0)
  await expect(page.getByTitle('Your pearls')).toBeVisible()

  await navLink(page, 'Dashboard').click()
  await expect(page.getByRole('heading', { name: /^Welcome back/ })).toBeVisible()
  await expect(page.getByText("Oh no, you're running out of pearls!")).toHaveCount(0)
})

test('falling below the threshold asks for confirmation and shows the low-pearl warnings', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)

  await openShop(page)
  const dialog = await openItem(page, JAVA_MOSS)
  await addButton(dialog).click()

  const confirmation = page.getByRole('dialog', { name: 'Running low on pearls?' })
  await expect(confirmation.getByText(`You'll have ${LOW_BALANCE} pearls left after this purchase.`)).toBeVisible()
  await confirmation.getByRole('button', { name: 'Yes, purchase item' }).click()
  await expectBalance(page, LOW_BALANCE)

  await expect(page.getByTitle(/^Running out of pearls/)).toBeVisible()

  await navLink(page, 'Dashboard').click()
  const alert = page.getByRole('alert')
  await expect(alert.getByRole('heading', { name: "Oh no, you're running out of pearls!" })).toBeVisible()
  await expect(alert).toContainText(`You have fewer than ${LOW_PEARLS} pearls.`)

  await page.reload()
  await expect(page.getByRole('alert').getByRole('heading', { name: "Oh no, you're running out of pearls!" })).toBeVisible()
  await expectBalance(page, LOW_BALANCE)
})

test('a toast warns at the moment the balance falls below the threshold', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)

  await buyItem(page, JAVA_MOSS, { confirmLow: true })
  await expectBalance(page, LOW_BALANCE)
  await expect(page.getByText("Oh no, you're running out of pearls! Do your care tasks")).toBeVisible()
})

test('a toast also warns when a care guide purchase takes the balance below the threshold', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)

  await openMyTank(page)
  await page.getByRole('button', { name: 'Temperature: advice for a real tank' }).click()
  const guide = page.getByRole('dialog', { name: 'Temperature care guide' })
  await guide.getByRole('button', {
    name: `Buy ${THERMOSTATIC_HEATER.name} for ${THERMOSTATIC_HEATER.price} pearls`,
  }).click()

  await expectBalance(page, LOW_PEARLS - THERMOSTATIC_HEATER.price)
  await expect(page.getByText(`Added 1 × ${THERMOSTATIC_HEATER.name} to Tank 1.`)).toBeVisible()
  await expect(page.getByText("Oh no, you're running out of pearls! Do your care tasks")).toBeVisible()
})

test('an item costing more than the balance cannot be bought and nothing changes', async ({ page }) => {
  await signUpFreshUser(page)
  await reachLowBalance(page)
  expect(ANGELFISH.price).toBeGreaterThan(LOW_BALANCE)

  await openShop(page)
  const dialog = await openItem(page, ANGELFISH)
  await expect(addButton(dialog)).toBeDisabled()
  await expect(dialog.getByText('Not enough pearls')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()

  // Someone could skip the page, so the server must refuse the same purchase by itself.
  // force skips the fish compatibility check, so the answer can only be about pearls.
  const { tanks } = await (await page.request.get(`${API}/api/tanks`)).json()
  const response = await page.request.post(`${API}/api/game/buy`, {
    data: { itemId: ANGELFISH.id, tankId: tanks[0]._id, force: true },
  })
  expect(response.status()).toBe(400)
  expect((await response.json()).message).toBe(`Not enough pearls. You need ${ANGELFISH.price - LOW_BALANCE} more.`)

  await openMyTank(page)
  await page.reload()
  await expectBalance(page, LOW_BALANCE)
  await expect(page.getByRole('heading', { name: 'Fish (0)' })).toBeVisible()

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(2)
  await expect(page.getByRole('row', { name: ANGELFISH.name })).toHaveCount(0)
})

test('an item costing exactly the remaining balance can be bought and leaves 0 pearls', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)
  await buyItem(page, CRUSHED_CORAL, { confirmLow: true })
  expect(LOW_PEARLS - CRUSHED_CORAL.price).toBe(SUNKEN_CASTLE.price)
  await expectBalance(page, SUNKEN_CASTLE.price)

  await buyItem(page, SUNKEN_CASTLE, { confirmLow: true })
  await expectBalance(page, 0)

  await openMyTank(page)
  await page.reload()
  await expectBalance(page, 0)
  await expect(page.getByRole('heading', { name: `Installed items (${CASTLES_TO_REACH_THRESHOLD + 2})` })).toBeVisible()

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(3)
})

test('cancelling a purchase confirmation leaves everything unchanged', async ({ page }) => {
  await signUpFreshUser(page)
  await reachThreshold(page)

  await openShop(page)
  const dialog = await openItem(page, JAVA_MOSS)
  await addButton(dialog).click()
  const confirmation = page.getByRole('dialog', { name: 'Running low on pearls?' })
  await confirmation.getByRole('button', { name: 'Keep my pearls' }).click()
  await expect(confirmation).toBeHidden()
  await expectBalance(page, LOW_PEARLS)

  await openMyTank(page)
  await page.reload()
  await expectBalance(page, LOW_PEARLS)
  await expect(page.getByRole('heading', { name: `Installed items (${CASTLES_TO_REACH_THRESHOLD})` })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${JAVA_MOSS.name}` })).toHaveCount(0)

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(1)
  await expect(page.getByRole('row', { name: JAVA_MOSS.name })).toHaveCount(0)
})
