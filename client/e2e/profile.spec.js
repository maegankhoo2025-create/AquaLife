import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { signUpFreshUser } from './helpers.js'

const AVATAR_FILE = fileURLToPath(new URL('./fixtures/avatar.png', import.meta.url))
const DEFAULT_INITIAL = 'E' // first letter of the helper's "E2E Tester"

async function openProfile(page) {
  await page.getByRole('link', { name: 'Open profile' }).click()
  await expect(page.getByLabel('Profile picture')).toBeVisible()
}

function navbarAvatar(page) {
  return page.getByRole('link', { name: 'Open profile' }).getByTestId('user-avatar')
}

// The profile page shows the picture twice: in the header and in the Account card.
function profileAvatars(page) {
  return page.getByRole('main').getByTestId('user-avatar')
}

async function expectUploadedAvatar(page) {
  await expect(profileAvatars(page)).toHaveCount(2)
  for (const avatar of [navbarAvatar(page), profileAvatars(page).first(), profileAvatars(page).last()]) {
    const image = avatar.getByTestId('user-avatar-image')
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/)
    // The browser really decoded it, so it is not a broken image icon.
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBe(128)
  }
}

async function expectDefaultAvatar(page) {
  await expect(profileAvatars(page)).toHaveCount(2)
  for (const avatar of [navbarAvatar(page), profileAvatars(page).first(), profileAvatars(page).last()]) {
    await expect(avatar.getByTestId('user-avatar-image')).toHaveCount(0)
    await expect(avatar).toHaveText(DEFAULT_INITIAL)
  }
}

// Records profile saves, so a test can prove the browser sent nothing to the server.
function countProfileSaves(page) {
  const saves = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().endsWith('/auth/profile')) saves.push(request)
  })
  return saves
}

async function expectProfileUnchanged(page, user) {
  await expect(page.getByRole('heading', { level: 1, name: user.name })).toBeVisible()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(user.name)
  await expect(page.getByLabel('Email address')).toHaveValue(user.email)
}

test('an uploaded profile picture shows in the profile and navbar, also after reload', async ({ page }) => {
  await signUpFreshUser(page)
  await openProfile(page)
  await expectDefaultAvatar(page)

  await page.getByLabel('Profile picture').setInputFiles(AVATAR_FILE)

  await expect(page.getByText('Profile picture updated.')).toBeVisible()
  await expectUploadedAvatar(page)

  await page.reload()
  await expectUploadedAvatar(page)
})

test('removing the profile picture brings back the default avatar, also after reload', async ({ page }) => {
  await signUpFreshUser(page)
  await openProfile(page)
  await page.getByLabel('Profile picture').setInputFiles(AVATAR_FILE)
  await expect(page.getByText('Profile picture updated.')).toBeVisible()
  await expectUploadedAvatar(page)

  await page.getByRole('button', { name: 'Remove picture' }).click()

  await expect(page.getByText('Profile picture removed.')).toBeVisible()
  await expectDefaultAvatar(page)
  await expect(page.getByRole('button', { name: 'Remove picture' })).toBeDisabled()

  await page.reload()
  await expectDefaultAvatar(page)
  await expect(page.getByRole('button', { name: 'Remove picture' })).toBeDisabled()
})

test('a changed display name and email are saved and remain after reload', async ({ page }) => {
  await signUpFreshUser(page)
  await openProfile(page)
  const newName = `Renamed ${randomUUID().slice(0, 8)}`
  const newEmail = `e2e-${randomUUID()}@example.com`

  await page.getByLabel('Name', { exact: true }).fill(newName)
  await page.getByLabel('Email address').fill(newEmail)
  await page.getByRole('button', { name: 'Save name and email' }).click()

  await expect(page.getByText('Profile updated successfully.')).toBeVisible()
  await expectProfileUnchanged(page, { name: newName, email: newEmail })

  await page.reload()
  await expectProfileUnchanged(page, { name: newName, email: newEmail })
  await expect(page.getByRole('main').getByText(newEmail, { exact: true })).toBeVisible()
})

test('an empty name and a malformed email are stopped by the browser and nothing is saved', async ({ page }) => {
  const user = await signUpFreshUser(page)
  await openProfile(page)
  const saves = countProfileSaves(page)
  const nameField = page.getByLabel('Name', { exact: true })
  const emailField = page.getByLabel('Email address')
  const saveButton = page.getByRole('button', { name: 'Save name and email' })

  await nameField.fill('')
  await saveButton.click()
  expect(await nameField.evaluate((element) => element.validationMessage)).not.toBe('')

  await nameField.fill(user.name)
  await emailField.fill('not-an-email')
  await saveButton.click()
  expect(await emailField.evaluate((element) => element.validationMessage)).not.toBe('')

  expect(saves).toHaveLength(0)
  await expect(page.getByText('Profile updated successfully.')).toHaveCount(0)

  await page.reload()
  await expectProfileUnchanged(page, user)
})

test('a blank name and an email the browser accepts but the server rejects show an error and nothing is saved', async ({ page }) => {
  const user = await signUpFreshUser(page)
  await openProfile(page)
  const nameField = page.getByLabel('Name', { exact: true })
  const emailField = page.getByLabel('Email address')
  const saveButton = page.getByRole('button', { name: 'Save name and email' })

  await nameField.fill('   ')
  await saveButton.click()
  await expect(page.getByRole('alert')).toHaveText('Please enter your name, email address or profile picture.')
  await expect(page.getByRole('heading', { level: 1, name: user.name })).toBeVisible()

  await nameField.fill(user.name)
  await emailField.fill('user@nodot')
  await saveButton.click()
  await expect(page.getByRole('alert')).toHaveText('Please enter a valid email address.')
  await expect(page.getByRole('main').getByText(user.email, { exact: true })).toBeVisible()

  await page.reload()
  await expectProfileUnchanged(page, user)
})
