import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'
import { installCleanup, trackAccount } from './cleanup.js'

const API = 'http://localhost:8000'
const LOGIN_ERROR = 'Email or password is incorrect.'

// The navbar calls these Shop and My Tank. The router paths are /browse and /main-tank.
const PROTECTED_ROUTES = [
  '/dashboard',
  '/main-tank',
  '/browse',
  '/quiz',
  '/history',
  '/friends',
  '/profile',
]

const accounts = []
installCleanup(test, accounts)

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

test('logs in with valid credentials', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await logOut(page)
  await logIn(page, user.email, user.password)

  await expect(page).toHaveURL(/\/dashboard\/?$/)
  await expect(page.getByRole('heading', { name: 'Welcome back, E2E Tester', level: 1 })).toBeVisible()
})

test('incorrect password shows an error and does not create a session', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await logOut(page)
  await logIn(page, user.email, 'wrong-password-1')

  await expect(page.getByRole('alert')).toHaveText(LOGIN_ERROR)
  await expect(page).toHaveURL(/\/login\/?$/)
  await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible()

  const session = await page.request.get(`${API}/auth/session`)
  expect(session.ok()).toBeTruthy()
  expect(await session.json()).toEqual({ loggedIn: false })
})

test('unknown email shows an error', async ({ page }) => {
  await page.goto('/login')
  await logIn(page, `e2e-${randomUUID()}@example.com`, 'wrong-password-1')

  await expect(page.getByRole('alert')).toHaveText(LOGIN_ERROR)
  await expect(page).toHaveURL(/\/login\/?$/)
  await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible()
})

test('logout returns to login and the back button does not reopen the dashboard', async ({ page }) => {
  const user = await signUpFreshUser(page)
  trackAccount(accounts, user)

  await logOut(page)
  await page.goBack()

  await expect(page).toHaveURL(/\/login\/?$/)
  await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Welcome back, E2E Tester' })).toHaveCount(0)
})

test('logged-out visits to protected pages redirect to login', async ({ page }) => {
  for (const path of PROTECTED_ROUTES) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/login\/?$/)
    await expect(page.getByRole('heading', { name: 'Log in', level: 1 })).toBeVisible()
  }
})
