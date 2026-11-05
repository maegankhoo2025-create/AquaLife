import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect } from '@playwright/test'
import { signUpFreshUser, test } from './helpers.js'

// The client has no database driver, so borrow the server's copies.
const serverRequire = createRequire(new URL('../../server/package.json', import.meta.url))
const mongoose = serverRequire('mongoose')
const dotenv = serverRequire('dotenv')

const SERVER_ENV = new URL('../../server/.env', import.meta.url)
const FRESH_TEST_EMAIL = /^e2e-[0-9a-f-]{36}@example\.com$/
const DAY = 24 * 60 * 60 * 1000

// The first request of the day builds the question pool from outside species APIs.
const QUIZ_LOAD_TIMEOUT = 25000
test.describe.configure({ timeout: 180_000 })

// Same day format as dayKey in server/logic/gamification.js (Singapore time).
function dayBefore(day) {
  const previous = new Date(new Date(`${day}T12:00:00+08:00`).getTime() - DAY)
  return previous.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
}

// The server decides what "today" is, so the browser clock cannot be used. Moving the
// saved days back one day makes today's care tasks and quiz look like yesterday's.
async function moveUserBackOneDay(email) {
  // Only ever touch an account made by signUpFreshUser, never a real user.
  expect(email).toMatch(FRESH_TEST_EMAIL)

  const { MONGODB_URI } = dotenv.parse(readFileSync(SERVER_ENV))
  const connection = await mongoose.createConnection(MONGODB_URI).asPromise()
  try {
    const users = connection.collection('users')
    const user = await users.findOne({ email })
    const result = await users.updateOne({ email }, {
      $set: {
        'tasks.day': dayBefore(user.tasks.day),
        'quiz.lastDay': dayBefore(user.quiz.lastDay),
        'quiz.scores': user.quiz.scores.map((score) => ({
          ...score,
          date: new Date(score.date.getTime() - DAY),
        })),
      },
    })
    expect(result.modifiedCount).toBe(1)
  } finally {
    await connection.close()
  }
}

async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

function navLink(page, name) {
  return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true })
}

async function buyZebraDanio(page) {
  await navLink(page, 'Shop').click()
  await page.getByRole('button', { name: /Zebra Danio/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Zebra Danio' })
  await dialog.getByRole('button', { name: /^Add to Tank 1/ }).click()
  await expect(page.getByText('Added 1 × Zebra Danio to Tank 1.')).toBeVisible()
}

function isQuizQuestionsResponse(response) {
  return new URL(response.url()).pathname === '/api/quiz' && response.request().method() === 'GET'
}

async function startQuiz(page) {
  await navLink(page, 'Quiz').click()
  const questionsResponse = page.waitForResponse(isQuizQuestionsResponse, { timeout: QUIZ_LOAD_TIMEOUT })
  await page.getByRole('link', { name: 'Start quiz' }).click()
  const { questions } = await (await questionsResponse).json()
  await expect(page.getByText('Question 1 of 5')).toBeVisible({ timeout: QUIZ_LOAD_TIMEOUT })
  return questions
}

async function playQuiz(page, questions, chooseIndex) {
  for (const [index, question] of questions.entries()) {
    await expect(page.getByText(`Question ${index + 1} of ${questions.length}`)).toBeVisible()
    await expect(page.getByRole('heading', { name: question.question })).toBeVisible()
    await page.getByRole('button', {
      name: question.answers[chooseIndex(question, index)],
      exact: true,
    }).click()
    await page.getByRole('button', {
      name: index === questions.length - 1 ? 'See results' : 'Next question',
    }).click()
  }
}

// Everyone gets the same questions on a given day, and the server reveals the right
// answer after each choice, so a throwaway account can learn today's answers.
async function learnTodaysAnswers(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const correctAnswers = []
  page.on('response', async (response) => {
    if (new URL(response.url()).pathname !== '/api/quiz/answer') return
    if (response.request().method() !== 'POST') return
    correctAnswers.push((await response.json()).correct)
  })

  await signUpFreshUser(page)
  const questions = await startQuiz(page)
  await playQuiz(page, questions, () => 0)
  await expect(page.getByRole('heading', { name: /\/ 5 correct/ })).toBeVisible()
  await context.close()

  return correctAnswers
}

// Plays the real quiz with exactly 3 of 5 right.
async function scoreThreeOutOfFive(page, correctAnswers) {
  const questions = await startQuiz(page)
  await playQuiz(page, questions, (question, index) => {
    if (index < 3) return correctAnswers[index]
    return (correctAnswers[index] + 1) % question.answers.length
  })
  await expect(page.getByRole('heading', { name: '3 / 5 correct' })).toBeVisible()
  await expect(page.getByText(/You earned/)).toContainText('+30')
}

test('the next day, a care task pays again and the quiz streak becomes 2', async ({ page, browser }) => {
  const correctAnswers = await learnTodaysAnswers(browser)
  const user = await signUpFreshUser(page)
  await buyZebraDanio(page)
  await expectBalance(page, 480)

  const feedFish = page.getByRole('button', { name: /^Feed fish/ })

  // Day 1: the care task pays and the first quiz starts the streak.
  await navLink(page, 'My Tank').click()
  await feedFish.click()
  await expect(page.getByText('Feed fish: +20 pearls', { exact: true })).toBeVisible()
  await expectBalance(page, 500)
  await expect(feedFish).toContainText('Rewarded today')

  await scoreThreeOutOfFive(page, correctAnswers)
  await expect(page.getByText('1-day streak')).toBeVisible()
  await expectBalance(page, 530)

  await moveUserBackOneDay(user.email)

  // Day 2: moving the dates alone pays nothing, and the task is available again.
  await navLink(page, 'My Tank').click()
  await expect(page.getByRole('heading', { name: 'My aquarium' })).toBeVisible()
  await page.reload()
  await expectBalance(page, 530)
  await expect(feedFish).toContainText('+20 pearls')

  await feedFish.click()
  await expect(page.getByText('Feed fish: +20 pearls', { exact: true })).toBeVisible()
  await expectBalance(page, 550)
  await expect(feedFish).toContainText('Rewarded today')

  // The streak survives overnight, and "Start quiz" replaces "Practise again".
  await navLink(page, 'Quiz').click()
  await expect(page.getByText('2 more days to the 3-day bonus.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start quiz' })).toBeVisible()

  await scoreThreeOutOfFive(page, correctAnswers)
  await expect(page.getByText('2-day streak')).toBeVisible()
  await expectBalance(page, 580)

  // Both results were saved by the server.
  await navLink(page, 'Quiz').click()
  await expect(page.getByRole('heading', { name: 'Day streak' })).toBeVisible()
  await page.reload()
  await expect(page.getByText('1 more day to the 3-day bonus.')).toBeVisible()
  await expectBalance(page, 580)
})
