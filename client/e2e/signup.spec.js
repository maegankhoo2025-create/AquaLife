import { test } from '@playwright/test'
import { signUpFreshUser } from './helpers.js'

test('signs up a fresh account and opens Dashboard', async ({ page }) => {
  await signUpFreshUser(page)
})