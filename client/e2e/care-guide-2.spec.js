import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { OSCAR, THERMOSTATIC_HEATER, ZEBRA_DANIO } from './products.js'
import {
  STARTING_PEARLS,
  addButton,
  buyItem,
  expectBalance,
  openItem,
  openMyTank,
  openShop,
} from './shop-helpers.js'

test.describe.configure({ timeout: 120_000 })

const BALANCE_BEFORE_HEATER = STARTING_PEARLS - ZEBRA_DANIO.price - OSCAR.price
const BALANCE_AFTER_HEATER = BALANCE_BEFORE_HEATER - THERMOSTATIC_HEATER.price

// Water only drifts by hours of real time, so this makes temperature go out of range for
// real: Zebra Danio sets Tank 1 up at 22°C, then Oscar, which needs at least 23°C, is added anyway.
async function makeTemperatureTooLow(page) {
  await buyItem(page, ZEBRA_DANIO)

  await openShop(page)
  const dialog = await openItem(page, OSCAR)
  await addButton(dialog).click()
  await page.getByRole('dialog', { name: 'This fish may not be happy here' }).getByRole('button', {
    name: 'Add to Tank 1 anyway',
  }).click()
  await expect(page.getByText(`Added 1 × ${OSCAR.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, BALANCE_BEFORE_HEATER)

  await openMyTank(page)
}

async function expectHeaterInstalled(page) {
  await expect(page.getByRole('heading', { name: 'Installed items (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${THERMOSTATIC_HEATER.name}` })).toBeVisible()
}

test('a too-low temperature can be fixed by buying the heater through the care guide', async ({ page }) => {
  await signUpFreshUser(page)
  await makeTemperatureTooLow(page)

  const conditions = page.getByRole('complementary', { name: 'Tank conditions' })
  await expect(conditions.getByText('Too low', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Installed items (0)' })).toBeVisible()

  await conditions.getByRole('button', { name: 'How to fix it' }).click()

  // The guide explains the problem and only offers advice for raising the temperature.
  const guide = page.getByRole('dialog', { name: 'Temperature care guide' })
  await expect(guide.getByText('Too low', { exact: true })).toBeVisible()
  await expect(guide.getByText('Raise the temperature to between 23 and 26°C.')).toBeVisible()
  await expect(guide.getByRole('heading', { name: 'Too cold? Warm it up' })).toBeVisible()
  await expect(guide.getByText('Use a heater with a thermostat')).toBeVisible()
  await expect(guide.getByRole('heading', { name: 'Too warm? Cool it down' })).toHaveCount(0)
  await expect(guide.getByText('Cooling fan')).toHaveCount(0)

  const buyHeater = guide.getByRole('button', {
    name: `Buy ${THERMOSTATIC_HEATER.name} for ${THERMOSTATIC_HEATER.price} pearls`,
  })
  await buyHeater.click()

  await expect(page.getByText(`Added 1 × ${THERMOSTATIC_HEATER.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, BALANCE_AFTER_HEATER)

  // Only one heater fits in a tank, so the guide stops offering it.
  await expect(buyHeater).toBeDisabled()
  await expect(buyHeater).toHaveText('Installed')

  await guide.getByRole('button', { name: 'Close' }).click()
  await expect(guide).toBeHidden()
  await expectHeaterInstalled(page)

  // Both the purchase and the installed item were saved by the server.
  await page.reload()
  await expectBalance(page, BALANCE_AFTER_HEATER)
  await expectHeaterInstalled(page)
})
