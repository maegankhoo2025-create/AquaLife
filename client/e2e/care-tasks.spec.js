import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'

const FISH = { name: 'Zebra Danio', price: 20 }
const STARTING_PEARLS = 500

async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

async function openMyTank(page) {
  await page.getByRole('link', { name: 'My Tank', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My aquarium' })).toBeVisible()
}

// Buys one fish into whichever tank is selected, through the shop page.
async function buyFish(page, tankName) {
  // My Tank has its own Shop button as well, so use the one in the navbar.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Shop', exact: true }).click()
  await page.getByRole('button', { name: new RegExp(FISH.name) }).click()

  const dialog = page.getByRole('dialog', { name: FISH.name })
  await dialog.getByRole('button', { name: new RegExp(`^Add to ${tankName}`) }).click()

  await expect(page.getByText(`Added 1 × ${FISH.name} to ${tankName}.`)).toBeVisible()
}

function taskButton(page, label) {
  return page.getByRole('button', { name: new RegExp(`^${label}`) })
}

async function doTask(page, label) {
  // Clean tank stays disabled while the water is at exactly 100%.
  await expect(taskButton(page, label)).toBeEnabled()
  await taskButton(page, label).click()
}

// Does a task for the first time and checks the toast, the balance and the button.
async function doPaidTask(page, label, reward, balanceAfter) {
  await doTask(page, label)
  await expect(page.getByText(`${label}: +${reward} pearls`, { exact: true })).toBeVisible()
  await expectBalance(page, balanceAfter)
  await expect(taskButton(page, label)).toContainText('Rewarded today')
}

// The ": done" toast only appears after the server has answered, so the balance
// check below it cannot pass just because the response has not arrived yet.
async function doUnpaidTask(page, label, balance) {
  await doTask(page, label)
  await expect(page.getByText(`${label}: done`, { exact: true })).toBeVisible()
  await expectBalance(page, balance)
}

test('care tasks on an empty tank pay no pearls', async ({ page }) => {
  await signUpFreshUser(page)
  await openMyTank(page)
  await expectBalance(page, STARTING_PEARLS)

  await expect(taskButton(page, 'Check temperature')).toContainText('Add fish to earn')

  await doUnpaidTask(page, 'Check temperature', STARTING_PEARLS)
  await doUnpaidTask(page, 'Check pH', STARTING_PEARLS)
  await doUnpaidTask(page, 'Clean tank', STARTING_PEARLS)

  await doTask(page, 'Feed fish')
  await expect(page.getByText('There are no living fish to feed in this tank.')).toBeVisible()
  await expectBalance(page, STARTING_PEARLS)

  await page.reload()
  await expectBalance(page, STARTING_PEARLS)
})

test('each care task pays its exact reward once the tank has a fish', async ({ page }) => {
  await signUpFreshUser(page)
  await buyFish(page, 'Tank 1')
  await expectBalance(page, STARTING_PEARLS - FISH.price)
  await openMyTank(page)

  await doPaidTask(page, 'Feed fish', 20, 500)
  await doPaidTask(page, 'Clean tank', 30, 530)
  await doPaidTask(page, 'Check temperature', 15, 545)
  await doPaidTask(page, 'Check pH', 15, 560)

  await page.reload()
  await expectBalance(page, 560)
})

test('repeating a care task on the same day pays no extra pearls', async ({ page }) => {
  await signUpFreshUser(page)
  await buyFish(page, 'Tank 1')
  await openMyTank(page)

  await doPaidTask(page, 'Feed fish', 20, 500)
  await doPaidTask(page, 'Clean tank', 30, 530)
  await doPaidTask(page, 'Check temperature', 15, 545)
  await doPaidTask(page, 'Check pH', 15, 560)

  await doUnpaidTask(page, 'Feed fish', 560)
  await doUnpaidTask(page, 'Clean tank', 560)
  await doUnpaidTask(page, 'Check temperature', 560)
  await doUnpaidTask(page, 'Check pH', 560)

  await page.reload()
  await expectBalance(page, 560)
})

test('care rewards are per tank, so a task already done on Tank 1 still pays on Tank 2', async ({ page }) => {
  await signUpFreshUser(page)
  await buyFish(page, 'Tank 1')
  await openMyTank(page)
  await doPaidTask(page, 'Feed fish', 20, 500)

  await page.getByRole('button', { name: 'New tank' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create a tank' })
  await expect(dialog.getByLabel('Tank name')).toHaveValue('Tank 2')
  await dialog.getByRole('button', { name: 'Create and select tank' }).click()
  await expect(page.getByText('Tank created and selected.')).toBeVisible()

  await buyFish(page, 'Tank 2')
  await expectBalance(page, 480)
  await openMyTank(page)

  await expect(taskButton(page, 'Feed fish')).toContainText('+20 pearls')
  await doPaidTask(page, 'Feed fish', 20, 500)

  await page.reload()
  await expectBalance(page, 500)
})
