import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { CRUSHED_CORAL, NEON_TETRA, SUNKEN_CASTLE, ZEBRA_DANIO } from './products.js'
import {
  STARTING_PEARLS,
  buyItem,
  expectBalance,
  historyRow,
  openHistory,
  openMyTank,
} from './shop-helpers.js'

function meter(page, label) {
  return page.getByRole('meter', { name: `${label}, actual reading` })
}

async function removeFish(page, fish) {
  await page.getByRole('button', { name: `Remove ${fish.name}` }).click()
  const dialog = page.getByRole('dialog', { name: 'Remove this fish?' })
  await expect(dialog.getByText(`You will get ${fish.price} pearls back.`)).toBeVisible()
  await dialog.getByRole('button', { name: 'Remove fish' }).click()
  await expect(page.getByText(`${fish.name} was removed: +${fish.price} pearls`)).toBeVisible()
}

async function expectRefundRow(page, product) {
  await openHistory(page)
  const row = historyRow(page, `${product.name} removed from Tank 1`)
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Refund')
  await expect(row).toContainText(`+${product.price}`)
}

// Refund rule, server/routes/tanks-routes.js: a living fish returns its full shop price.
test('removing a living fish refunds its shop price and shows a Refund row', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, ZEBRA_DANIO)
  await buyItem(page, NEON_TETRA)
  const beforeRemoval = STARTING_PEARLS - ZEBRA_DANIO.price - NEON_TETRA.price
  await expectBalance(page, beforeRemoval)

  await openMyTank(page)
  await removeFish(page, NEON_TETRA)

  async function expectFishRemoved() {
    await expectBalance(page, beforeRemoval + NEON_TETRA.price)
    await expect(page.getByRole('heading', { name: 'Fish (1)' })).toBeVisible()
    await expect(page.getByRole('button', { name: `Remove ${NEON_TETRA.name}` })).toHaveCount(0)
    await expect(page.getByRole('button', { name: `Remove ${ZEBRA_DANIO.name}` })).toHaveCount(1)
  }

  await expectFishRemoved()
  await page.reload()
  await expectFishRemoved()

  await expectRefundRow(page, NEON_TETRA)
  await page.reload()
  await expect(historyRow(page, `${NEON_TETRA.name} removed from Tank 1`)).toHaveCount(1)
})

// Refund rule, server/routes/tanks-routes.js: an installed item returns its full shop price.
test('removing an installed item refunds its shop price and shows a Refund row', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, SUNKEN_CASTLE)
  await expectBalance(page, STARTING_PEARLS - SUNKEN_CASTLE.price)

  await openMyTank(page)
  await expect(page.getByRole('heading', { name: 'Installed items (1)' })).toBeVisible()
  await page.getByRole('button', { name: `Remove ${SUNKEN_CASTLE.name}` }).click()
  const dialog = page.getByRole('dialog', { name: 'Remove this item?' })
  await expect(dialog.getByText(`You will get ${SUNKEN_CASTLE.price} pearls back.`)).toBeVisible()
  await dialog.getByRole('button', { name: 'Remove item' }).click()
  await expect(page.getByText(`${SUNKEN_CASTLE.name} was removed: +${SUNKEN_CASTLE.price} pearls`)).toBeVisible()

  async function expectItemRemoved() {
    await expectBalance(page, STARTING_PEARLS)
    await expect(page.getByRole('heading', { name: 'Installed items (0)' })).toBeVisible()
    await expect(page.getByRole('button', { name: `Remove ${SUNKEN_CASTLE.name}` })).toHaveCount(0)
  }

  await expectItemRemoved()
  await page.reload()
  await expectItemRemoved()

  await expectRefundRow(page, SUNKEN_CASTLE)
  await page.reload()
  await expect(historyRow(page, `${SUNKEN_CASTLE.name} removed from Tank 1`)).toHaveCount(1)
})

// Reset rule, resetTank in server/logic/compatibility.js: with no living fish and no item
// that changes the water, readings and goals return to 25°C, pH 7 and 100% water quality.
test('removing the last fish resets the tank to new-tank readings and goals', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, NEON_TETRA)
  await openMyTank(page)

  // Neon Tetra sets the water up away from the defaults, so a reset can be seen.
  await expect(meter(page, 'Temperature')).toHaveAttribute('aria-valuetext', '23°C; goal 23°C')
  await expect(meter(page, 'pH')).not.toHaveAttribute('aria-valuetext', '7; goal 7')

  await removeFish(page, NEON_TETRA)

  async function expectNewTank() {
    await expectBalance(page, STARTING_PEARLS)
    await expect(meter(page, 'Temperature')).toHaveAttribute('aria-valuetext', '25°C; goal 25°C')
    await expect(meter(page, 'pH')).toHaveAttribute('aria-valuetext', '7; goal 7')
    await expect(meter(page, 'Water quality')).toHaveAttribute('aria-valuetext', '100%; goal 100%')
    await expect(page.getByRole('heading', { name: 'Fish (0)' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Check temperature/ })).toContainText('Add fish to earn')
  }

  await expectNewTank()
  await page.reload()
  await expectNewTank()
})

test('removing the last fish does not reset a tank that still has a water-changing item', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, NEON_TETRA)
  await buyItem(page, CRUSHED_CORAL)
  await openMyTank(page)
  await expect(meter(page, 'Temperature')).toHaveAttribute('aria-valuetext', '23°C; goal 23°C')

  await removeFish(page, NEON_TETRA)

  async function expectNoReset() {
    await expectBalance(page, STARTING_PEARLS - CRUSHED_CORAL.price)
    await expect(page.getByRole('heading', { name: 'Fish (0)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Installed items (1)' })).toBeVisible()
    await expect(meter(page, 'Temperature')).toHaveAttribute('aria-valuetext', '23°C; goal 23°C')
  }

  await expectNoReset()
  await page.reload()
  await expectNoReset()
})
