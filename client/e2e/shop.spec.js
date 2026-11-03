import { expect, test } from '@playwright/test'
import { signUpFreshUser } from './helpers.js'
import { JAVA_MOSS, SUNKEN_CASTLE, THERMOSTATIC_HEATER, ZEBRA_DANIO } from './products.js'
import {
  STARTING_PEARLS,
  buyItem,
  expectBalance,
  historyEntries,
  historyRow,
  openHistory,
  openMyTank,
  openShop,
} from './shop-helpers.js'

const API = 'http://localhost:8000'

async function expectFishOnceInTank(page, fish) {
  await expect(page.getByRole('heading', { name: 'Fish (1)' })).toBeVisible()
  await expect(page.getByRole('button', { name: `Remove ${fish.name}` })).toHaveCount(1)
  await expect(page.getByRole('group', { name: 'Tank 1 with 1 fish' })).toBeVisible()
}

async function expectOnePurchaseRow(page, label, price) {
  await expect(historyEntries(page)).toHaveCount(1)
  const row = historyRow(page, label)
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Purchase')
  await expect(row).toContainText(`-${price}`)
}

// The name is the first line of each shop card.
async function shownItemNames(page) {
  const cards = await page.getByRole('region', { name: 'Shop items' }).getByRole('button').allInnerTexts()
  return cards.map((text) => text.trim().split('\n')[0].trim()).sort()
}

async function expectShopShows(page, products) {
  const names = products.map((product) => product.name).sort()
  await expect.poll(() => shownItemNames(page)).toEqual(names)
  await expect(page.getByRole('region', { name: 'Shop items' }).getByRole('status')).toHaveText(`${names.length} items`)
}

test('buying a fish charges its exact price once and adds it to the tank once', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, ZEBRA_DANIO)
  await expectBalance(page, STARTING_PEARLS - ZEBRA_DANIO.price)

  await openMyTank(page)
  await expectFishOnceInTank(page, ZEBRA_DANIO)

  await openHistory(page)
  await expectOnePurchaseRow(page, `1 × ${ZEBRA_DANIO.name} for Tank 1`, ZEBRA_DANIO.price)
})

test('after a reload the balance, the fish and the History row are all still correct', async ({ page }) => {
  await signUpFreshUser(page)
  await buyItem(page, ZEBRA_DANIO)

  await openMyTank(page)
  await page.reload()
  await expectBalance(page, STARTING_PEARLS - ZEBRA_DANIO.price)
  await expectFishOnceInTank(page, ZEBRA_DANIO)

  await openHistory(page)
  await page.reload()
  await expectBalance(page, STARTING_PEARLS - ZEBRA_DANIO.price)
  await expectOnePurchaseRow(page, `1 × ${ZEBRA_DANIO.name} for Tank 1`, ZEBRA_DANIO.price)
})

test('a plant, a decoration and an equipment item are each installed once and charged once', async ({ page }) => {
  await signUpFreshUser(page)
  const items = [JAVA_MOSS, SUNKEN_CASTLE, THERMOSTATIC_HEATER]
  let balance = STARTING_PEARLS

  for (const item of items) {
    await buyItem(page, item)
    balance -= item.price
    await expectBalance(page, balance)
  }

  async function expectEachItemOnce() {
    await expectBalance(page, balance)
    await expect(page.getByRole('heading', { name: 'Installed items (3)' })).toBeVisible()
    for (const item of items) {
      await expect(page.getByRole('button', { name: `Remove ${item.name}` })).toHaveCount(1)
    }
  }

  await openMyTank(page)
  await expectEachItemOnce()
  await page.reload()
  await expectEachItemOnce()

  await openHistory(page)
  await expect(historyEntries(page)).toHaveCount(items.length)
  for (const item of items) {
    const row = historyRow(page, `1 × ${item.name} for Tank 1`)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Purchase')
    await expect(row).toContainText(`-${item.price}`)
  }
})

test('category and care level filters show only the matching items', async ({ page }) => {
  await signUpFreshUser(page)
  const { products } = await (await page.request.get(`${API}/api/products`)).json()
  await openShop(page)
  await expectShopShows(page, products)

  const pill = (name) => page.getByRole('button', { name, exact: true })
  const careBox = (name) => page.getByRole('checkbox', { name, exact: true })

  const categories = [
    { label: 'Fish', value: 'fish' },
    { label: 'Plants', value: 'plant' },
    { label: 'Decor', value: 'decor' },
    { label: 'Equipment', value: 'equipment' },
  ]
  for (const { label, value } of categories) {
    await pill(label).click()
    await expect(pill(label)).toHaveAttribute('aria-pressed', 'true')
    await expectShopShows(page, products.filter((product) => product.category === value))
  }
  await pill('All').click()

  for (const care of ['easy', 'moderate', 'hard']) {
    await careBox(care).check()
    await expectShopShows(page, products.filter((product) => product.care === care))
    await careBox(care).uncheck()
  }

  // Both filters together must match both rules.
  await pill('Fish').click()
  await careBox('hard').check()
  await expectShopShows(page, products.filter((product) => product.category === 'fish' && product.care === 'hard'))

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expectShopShows(page, products)
})
