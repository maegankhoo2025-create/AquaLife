import { expect as baseExpect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { ZEBRA_DANIO } from './products.js'
import {
  STARTING_PEARLS,
  buyItem,
  expectBalance,
  openMyTank,
  openShop,
} from './shop-helpers.js'

test.describe.configure({ timeout: 120_000 })

// A care task saves to the database in a transaction, which can take several seconds.
const expect = baseExpect.configure({ timeout: 15_000 })

const AFTER_FISH = STARTING_PEARLS - ZEBRA_DANIO.price

function taskButton(page, label) {
  return page.getByRole('button', { name: new RegExp(`^${label}`) })
}

async function doTask(page, label) {
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

// Clean tank is disabled at exactly 100% water, where a new tank starts. Every task
// settles the simulation, which drops the water just below 100, so Clean never goes first.
async function doAllTasksForPearls(page) {
  await doPaidTask(page, 'Feed fish', 20, AFTER_FISH + 20)
  await doPaidTask(page, 'Clean tank', 30, AFTER_FISH + 50)
  await doPaidTask(page, 'Check temperature', 15, AFTER_FISH + 65)
  await doPaidTask(page, 'Check pH', 15, AFTER_FISH + 80)
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
  await buyItem(page, ZEBRA_DANIO)
  await expectBalance(page, AFTER_FISH)
  await openMyTank(page)

  await doAllTasksForPearls(page)

  await page.reload()
  await expectBalance(page, AFTER_FISH + 80)
})

test('repeating a care task on the same day pays no extra pearls', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, ZEBRA_DANIO)
  await openMyTank(page)

  await doAllTasksForPearls(page)

  const balance = AFTER_FISH + 80
  await doUnpaidTask(page, 'Feed fish', balance)
  await doUnpaidTask(page, 'Clean tank', balance)
  await doUnpaidTask(page, 'Check temperature', balance)
  await doUnpaidTask(page, 'Check pH', balance)

  await page.reload()
  await expectBalance(page, balance)
})

test('care rewards are per tank, so a task already done on Tank 1 still pays on Tank 2', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, ZEBRA_DANIO)
  await openMyTank(page)
  await doPaidTask(page, 'Feed fish', 20, STARTING_PEARLS)

  await page.getByRole('button', { name: 'New tank' }).click()
  const dialog = page.getByRole('dialog', { name: 'Create a tank' })
  await expect(dialog.getByLabel('Tank name')).toHaveValue('Tank 2')
  await dialog.getByRole('button', { name: 'Create and select tank' }).click()
  await expect(page.getByText('Tank created and selected.')).toBeVisible()

  await openShop(page)
  await expect(page.getByLabel('Shopping for').locator('option:checked')).toHaveText('Tank 2')

  await buyItem(page, ZEBRA_DANIO, { tankName: 'Tank 2' })
  await expectBalance(page, AFTER_FISH)
  await openMyTank(page)

  await expect(taskButton(page, 'Feed fish')).toContainText('+20 pearls')
  await doPaidTask(page, 'Feed fish', 20, STARTING_PEARLS)

  await page.reload()
  await expectBalance(page, STARTING_PEARLS)
})
