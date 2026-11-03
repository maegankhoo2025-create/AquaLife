import { expect, test } from '@playwright/test'
import { signUpFreshUser } from './helpers.js'
import { OSCAR, ZEBRA_DANIO } from './products.js'
import {
  STARTING_PEARLS,
  addButton,
  buyItem,
  expectBalance,
  historyEntries,
  historyRow,
  openHistory,
  openItem,
  openMyTank,
  openShop,
} from './shop-helpers.js'

const AFTER_FIRST_FISH = STARTING_PEARLS - ZEBRA_DANIO.price
const AFTER_BOTH_FISH = AFTER_FIRST_FISH - OSCAR.price

// Zebra Danio sets Tank 1 up at 22°C and Oscar needs at least 23°C, so adding it clashes.
async function tryToAddOscarToTank1(page) {
  await buyItem(page, ZEBRA_DANIO)
  await expectBalance(page, AFTER_FIRST_FISH)

  await openShop(page)
  const dialog = await openItem(page, OSCAR)
  await addButton(dialog).click()

  const warning = page.getByRole('dialog', { name: 'This fish may not be happy here' })
  await expect(warning).toBeVisible()
  return warning
}

async function expectTank1HasOnlyFirstFish(page) {
  await expect(page.getByRole('heading', { name: 'Fish (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${ZEBRA_DANIO.name}` })).toHaveCount(1)
  await expect(page.getByRole('button', { name: `Remove ${OSCAR.name}` })).toHaveCount(0)
  await expect(page.getByRole('meter', { name: 'Temperature, actual reading' })).toHaveAttribute('aria-valuetext', '22°C; goal 22°C')
}

test('adding a clashing fish shows a warning with the reasons', async ({ page }) => {
  await signUpFreshUser(page)
  const warning = await tryToAddOscarToTank1(page)

  await expect(warning.getByText(`${OSCAR.name} does not suit Tank 1:`)).toBeVisible()
  await expect(warning.getByRole('listitem').filter({ hasText: `Tank 1 is 22°C, but ${OSCAR.name} needs` })).toHaveCount(1)
  // The seed marks Oscar as aggressive; the imported catalogue flags it as eating small fish.
  await expect(warning.getByRole('listitem').filter({
    hasText: new RegExp(`${OSCAR.name} (may eat smaller fish|is aggressive and may attack).*${ZEBRA_DANIO.name}`),
  })).toHaveCount(1)

  await expect(warning.getByRole('button', { name: 'Create Tank 2 for this fish' })).toBeVisible()
  await expect(warning.getByRole('button', { name: 'Add to Tank 1 anyway' })).toBeVisible()
  await expect(warning.getByRole('button', { name: 'Cancel' })).toBeVisible()
})

test('Create Tank 2 puts the new fish in Tank 2, leaves Tank 1 alone and charges once', async ({ page }) => {
  await signUpFreshUser(page)
  const warning = await tryToAddOscarToTank1(page)

  await warning.getByRole('button', { name: 'Create Tank 2 for this fish' }).click()
  await expect(page.getByText(`Added 1 × ${OSCAR.name} to Tank 2.`)).toBeVisible()
  await expectBalance(page, AFTER_BOTH_FISH)

  async function expectBothTanks() {
    await expectBalance(page, AFTER_BOTH_FISH)
    await expect(page.getByRole('heading', { name: 'Fish (1)' })).toBeVisible()
    await expect(page.getByRole('button', { name: `Remove ${OSCAR.name}` })).toHaveCount(1)
    await expect(page.getByRole('button', { name: `Remove ${ZEBRA_DANIO.name}` })).toHaveCount(0)

    await page.getByRole('button', { name: 'Previous tank' }).click()
    await expectTank1HasOnlyFirstFish(page)
    await page.getByRole('button', { name: 'Next tank' }).click()
    await expect(page.getByRole('button', { name: `Remove ${OSCAR.name}` })).toHaveCount(1)
  }

  await openMyTank(page)
  await expectBothTanks()
  await page.reload()
  await expectBothTanks()

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(2)
  const row = historyRow(page, `1 × ${OSCAR.name} for Tank 2`)
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(`-${OSCAR.price}`)
})

test('Add anyway puts the fish in Tank 1, charges once and the tank shows the conflict', async ({ page }) => {
  await signUpFreshUser(page)
  const warning = await tryToAddOscarToTank1(page)

  await warning.getByRole('button', { name: 'Add to Tank 1 anyway' }).click()
  await expect(page.getByText(`Added 1 × ${OSCAR.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, AFTER_BOTH_FISH)

  async function expectConflictInTank() {
    await expectBalance(page, AFTER_BOTH_FISH)
    await expect(page.getByRole('heading', { name: 'Fish (2)' })).toBeVisible()
    await expect(page.getByRole('button', { name: `Remove ${ZEBRA_DANIO.name}` })).toHaveCount(1)
    await expect(page.getByRole('button', { name: `Remove ${OSCAR.name}` })).toHaveCount(1)

    const conditions = page.getByRole('complementary', { name: 'Tank conditions' })
    await expect(conditions.getByText('Too low', { exact: true })).toBeVisible()
    await expect(conditions.getByText('Goal outside the safe range.')).toBeVisible()
    await expect(conditions.getByRole('button', { name: 'How to fix it' })).toBeVisible()
  }

  await openMyTank(page)
  await expectConflictInTank()
  await page.reload()
  await expectConflictInTank()

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(2)
  const row = historyRow(page, `1 × ${OSCAR.name} for Tank 1`)
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(`-${OSCAR.price}`)
})

test('cancelling the warning leaves the balance, Tank 1 and History unchanged', async ({ page }) => {
  await signUpFreshUser(page)
  const warning = await tryToAddOscarToTank1(page)

  await warning.getByRole('button', { name: 'Cancel' }).click()
  await expect(warning).toBeHidden()
  await expectBalance(page, AFTER_FIRST_FISH)

  await openMyTank(page)
  await expectTank1HasOnlyFirstFish(page)
  await page.reload()
  await expectBalance(page, AFTER_FIRST_FISH)
  await expectTank1HasOnlyFirstFish(page)
  await expect(page.getByRole('button', { name: 'Next tank' })).toHaveCount(0)

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(1)
  await expect(historyRow(page, `1 × ${ZEBRA_DANIO.name} for Tank 1`)).toHaveCount(1)
  await expect(historyRow(page, OSCAR.name)).toHaveCount(0)
})
