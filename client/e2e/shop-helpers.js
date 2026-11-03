import { expect } from '@playwright/test'

export const STARTING_PEARLS = 500

// My Tank has its own Shop button, so navigation always uses the navbar.
export function navLink(page, name) {
  return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true })
}

export async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

export async function openShop(page) {
  await navLink(page, 'Shop').click()
  await expect(page.getByRole('heading', { name: 'Shop', level: 1 })).toBeVisible()
}

export async function openMyTank(page) {
  await navLink(page, 'My Tank').click()
  await expect(page.getByRole('heading', { name: 'My aquarium', level: 1 })).toBeVisible()
}

export async function openHistory(page) {
  await navLink(page, 'History').click()
  await expect(page.getByRole('heading', { name: 'History', level: 1 })).toBeVisible()
}

// Opens a shop item's dialog from the Shop page and returns the dialog.
export async function openItem(page, product) {
  await page.getByRole('region', { name: 'Shop items' }).getByRole('button', {
    // From the start of the card, so Neon Tetra does not also match Black Neon Tetra.
    name: new RegExp(`^${product.name}`),
  }).click()
  const dialog = page.getByRole('dialog', { name: product.name })
  await expect(dialog).toBeVisible()
  return dialog
}

export function addButton(dialog, tankName = 'Tank 1') {
  return dialog.getByRole('button', { name: new RegExp(`^Add to ${tankName}`) })
}

// Buys an item that suits the selected tank, through the shop page.
// confirmLow answers the "Running low on pearls?" question with yes.
export async function buyItem(page, product, { tankName = 'Tank 1', quantity = 1, confirmLow = false } = {}) {
  await openShop(page)
  const dialog = await openItem(page, product)
  for (let added = 1; added < quantity; added++) {
    await dialog.getByRole('button', { name: 'Increase quantity' }).click()
  }
  await addButton(dialog, tankName).click()

  if (confirmLow) {
    await page.getByRole('dialog', { name: 'Running low on pearls?' }).getByRole('button', {
      name: 'Yes, purchase item',
    }).click()
  }

  await expect(page.getByText(`Added ${quantity} × ${product.name} to ${tankName}.`)).toBeVisible()
}

// One row of the History table, found by its activity text.
export function historyRow(page, label) {
  return page.getByRole('row', { name: label })
}

// Every entry on the History page. The header row has no cells, so it is left out.
export function historyEntries(page) {
  return page.getByRole('row').filter({ has: page.getByRole('cell') })
}
