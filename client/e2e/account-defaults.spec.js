import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { installCleanup, trackAccount } from './cleanup.js'
import { expectBalance, openMyTank } from './shop-helpers.js'

const accounts = []
installCleanup(test, accounts)

test.describe.configure({ timeout: 60_000 })

async function logOut(page) {
  await page.getByRole('button', { name: 'Log out', exact: true }).click()
  await expect(page).toHaveURL(/\/login\/?$/)
  await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible()
}

async function logIn(page, email, password) {
  await page.getByRole('textbox', { name: 'Email address', exact: true }).fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
}

async function openDashboard(page) {
  if (!/\/dashboard\/?$/.test(new URL(page.url()).pathname)) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard', exact: true }).click()
  }
  await expect(page).toHaveURL(/\/dashboard\/?$/)
  await expect(page.getByRole('heading', { name: 'Welcome back, E2E Tester', level: 1 })).toBeVisible()
}

async function openProfile(page) {
  await page.getByRole('link', { name: 'Open profile' }).click()
  await expect(page.getByRole('heading', { name: 'E2E Tester', level: 1 })).toBeVisible()
}

async function expectStartingAccount(page) {
  await openDashboard(page)
  await expectBalance(page, 500)
  await expect(page.getByText('Level 1', { exact: true })).toBeVisible()
  await expect(page.getByText('0 / 200 XP', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'XP towards next level' })).toHaveAttribute('aria-valuenow', '0')
  await expect(page.getByRole('group', { name: 'Tank 1 with 0 fish', exact: true })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Previous tank' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Next tank' })).toHaveCount(0)

  await openMyTank(page)
  await expect(page.getByRole('heading', { name: 'Fish (0)', exact: true })).toBeVisible()
  await expect(page.getByText('Add fish from the shop.', { exact: true })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Tank 1 with 0 fish', exact: true })).toHaveCount(1)

  await openProfile(page)
  await expect(page.getByRole('heading', { name: 'My tanks', level: 2 })).toBeVisible()
  const tankRows = page.getByRole('listitem').filter({ hasText: 'Tank 1' })
  await expect(tankRows).toHaveCount(1)
  await expect(tankRows).toHaveText(/Tank 1\s+0 fish · .+Open/)
}

test('a fresh account starts with 500 pearls, level 1 and an empty Tank 1', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)
  await expectStartingAccount(page)
})

test('starting pearls, level and Tank 1 stay the same after reload and logging in again', async ({ page }) => {
  test.setTimeout(120_000)
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await expectStartingAccount(page)
  await page.reload()
  await expectStartingAccount(page)

  await logOut(page)
  await logIn(page, user.email, user.password)
  await expect(page).toHaveURL(/\/dashboard\/?$/)
  await expectStartingAccount(page)
})
