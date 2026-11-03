import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'

const FIRST_FISH = { name: 'Zebra Danio', price: 20 } // sets Tank 1 up at 22°C
const WARM_FISH = { name: 'Cherry Barb', price: 30 } // needs at least 23°C
const HEATER = { name: 'Thermostatic heater', price: 45 }

async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

async function openFishInShop(page, fish) {
  await page.getByRole('button', { name: new RegExp(fish.name) }).click()
  const dialog = page.getByRole('dialog', { name: fish.name })
  await dialog.getByRole('button', { name: /^Add to Tank 1/ }).click()
}

// Water quality only falls by hours of real time, so this makes temperature go out
// of range for real: the first fish sets the water to 22°C, then a fish needing 23°C
// or more is added anyway, which lifts the bottom of the safe range above the reading.
async function makeTemperatureTooLow(page) {
  await page.getByRole('link', { name: 'Shop', exact: true }).click()

  await openFishInShop(page, FIRST_FISH)
  await expect(page.getByText(`Added 1 × ${FIRST_FISH.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, 500 - FIRST_FISH.price)

  await openFishInShop(page, WARM_FISH)
  const conflict = page.getByRole('dialog', { name: 'This fish may not be happy here' })
  await conflict.getByRole('button', { name: 'Add to Tank 1 anyway' }).click()
  await expect(page.getByText(`Added 1 × ${WARM_FISH.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, 500 - FIRST_FISH.price - WARM_FISH.price)

  await page.getByRole('link', { name: 'My Tank', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'My aquarium' })).toBeVisible()
}

test('a too-low temperature can be fixed by buying the heater through the care guide', async ({ page }) => {
  await signUpFreshUser(page)
  await makeTemperatureTooLow(page)

  const balanceBefore = 500 - FIRST_FISH.price - WARM_FISH.price
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

  // The heater is suggested; the cooling fan would make things worse, so it is not.
  await expect(guide.getByRole('heading', { name: 'Buy for Tank 1: To raise temperature' })).toBeVisible()
  await expect(guide.getByText('Cooling fan')).toHaveCount(0)

  const buyHeater = guide.getByRole('button', { name: `Buy ${HEATER.name} for ${HEATER.price} pearls` })
  await expect(buyHeater).toContainText(String(HEATER.price))
  await buyHeater.click()

  await expect(page.getByText(`Added 1 × ${HEATER.name} to Tank 1.`)).toBeVisible()
  await expectBalance(page, balanceBefore - HEATER.price)

  // Only one heater fits in a tank, so the guide stops offering it.
  await expect(buyHeater).toBeDisabled()
  await expect(buyHeater).toHaveText('Installed')

  await guide.getByRole('button', { name: 'Close' }).click()
  await expect(guide).toBeHidden()

  await expect(page.getByRole('heading', { name: 'Installed items (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${HEATER.name}` })).toBeVisible()

  // Both the purchase and the installed item were saved by the server.
  await page.reload()
  await expectBalance(page, balanceBefore - HEATER.price)
  await expect(page.getByRole('heading', { name: 'Installed items (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${HEATER.name}` })).toBeVisible()
})
