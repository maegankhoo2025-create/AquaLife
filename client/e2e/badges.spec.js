import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { installCleanup, trackAccount } from './cleanup.js'
import { ZEBRA_DANIO } from './products.js'
import { buyItem, navLink } from './shop-helpers.js'

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

async function openQuiz(page) {
  await navLink(page, 'Quiz').click()
  await expect(page.getByRole('heading', { name: 'Quiz', level: 1 })).toBeVisible()
}

async function openProfile(page) {
  await page.getByRole('link', { name: 'Open profile' }).click()
  await expect(page.getByRole('heading', { name: 'E2E Tester', level: 1 })).toBeVisible()
}

function fishKeeperOnQuiz(page) {
  return page.getByRole('listitem').filter({ hasText: 'Fish Keeper' })
}

async function expectFishKeeperLocked(page) {
  await openQuiz(page)
  const row = fishKeeperOnQuiz(page)
  await expect(row).toContainText('Fish Keeper · Locked')
  await expect(row).toContainText('0 / 1 living fish for Bronze')
  await expect(page.getByTitle('Fish Keeper: Bronze')).toHaveCount(0)
  await expect(page.getByTitle('Fish Keeper: Locked')).toBeVisible()

  await openProfile(page)
  await expect(page.getByRole('list', { name: 'Badges earned' })).toHaveCount(0)
  await expect(page.getByText('No badges yet. Add fish or take the daily quiz to earn your first.')).toBeVisible()
  await expect(page.getByText('Unlock: First Fin')).toBeVisible()
  await expect(page.getByTitle('Fish Keeper: Bronze')).toHaveCount(0)
  await expect(page.getByTitle('Fish Keeper: Locked')).toBeVisible()
}

async function expectBronzeFirstFin(page) {
  await openQuiz(page)
  const row = fishKeeperOnQuiz(page)
  await expect(row).toContainText('Fish Keeper · Bronze')
  await expect(row).toContainText('1 / 5 living fish for Silver')
  await expect(page.getByTitle('Fish Keeper: Bronze')).toBeVisible()

  await openProfile(page)
  const earned = page.getByRole('list', { name: 'Badges earned' })
  await expect(earned).toContainText('First Fin')
  await expect(earned).toContainText('Bronze Fish Keeper')
  await expect(page.getByText('Unlock: First Fin')).toHaveCount(0)
  await expect(page.getByTitle('Fish Keeper: Bronze').first()).toBeVisible()
}

test('a fresh account has not earned the Fish Keeper badge', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)
  await expectFishKeeperLocked(page)
})

test('buying one fish unlocks the Bronze First Fin badge', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await buyItem(page, ZEBRA_DANIO)
  await expectBronzeFirstFin(page)
})

test('the Bronze First Fin medal is shown on the Quiz page and Profile', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await buyItem(page, ZEBRA_DANIO)

  await openQuiz(page)
  await expect(page.getByTitle('Fish Keeper: Bronze')).toBeVisible()

  await openProfile(page)
  await expect(page.getByTitle('Fish Keeper: Bronze').first()).toBeVisible()
  await expect(page.getByRole('list', { name: 'Badges earned' }).getByTitle('Fish Keeper: Bronze')).toBeVisible()
})

test('the Bronze First Fin badge stays unlocked after reload and logging in again', async ({ page }) => {
  test.setTimeout(120_000)
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await buyItem(page, ZEBRA_DANIO)
  await expectBronzeFirstFin(page)

  await page.reload()
  await expectBronzeFirstFin(page)

  await logOut(page)
  await logIn(page, user.email, user.password)
  await expect(page).toHaveURL(/\/dashboard\/?$/)
  await expectBronzeFirstFin(page)
})
