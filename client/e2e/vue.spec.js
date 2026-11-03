import { test, expect } from '@playwright/test'

test('logs in with valid credentials', async ({ page }) => {
  await page.goto('/login')

  await page.getByRole('textbox', { name: 'Email address' })
    .fill('test123@gmail.com')

  await page.getByRole('textbox', { name: 'Password' })
    .fill('Test123test123')

  await page.getByRole('button', { name: 'Log in' }).click()

  // Check that login redirects to the Dashboard.
  await expect(page).toHaveURL(/\/dashboard\/?$/)
})