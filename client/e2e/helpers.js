import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'

export async function signUpFreshUser(page) {
  const user = {
    name: 'E2E Tester',
    email: `e2e-${randomUUID()}@example.com`,
    password: 'AquaLifeTest123!',
  }

  await page.goto('/login')

  await page.getByRole('button', {
    name: "Don't have an account? Sign up",
    exact: true,
  }).click()

  await page.getByRole('textbox', {
    name: 'Name',
    exact: true,
  }).fill(user.name)

  await page.getByRole('textbox', {
    name: 'Email address',
    exact: true,
  }).fill(user.email)

  await page.getByRole('textbox', {
    name: 'Password',
    exact: true,
  }).fill(user.password)

  await page.getByRole('button', {
    name: 'Create account',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/dashboard\/?$/)

  return user
}