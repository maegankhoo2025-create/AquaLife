import { expect, test } from '@playwright/test'
import { signUpFreshUser } from './helpers.js'

// The first request of the day builds the question pool from outside species APIs.
const QUIZ_LOAD_TIMEOUT = 25000
test.describe.configure({ timeout: 60000 })

const MOCK_QUESTIONS = [
  { id: 'mock-1', question: 'Mock question one?', answers: ['1A', '1B', '1C', '1D'], correct: 0 },
  { id: 'mock-2', question: 'Mock question two?', answers: ['2A', '2B', '2C', '2D'], correct: 1 },
  { id: 'mock-3', question: 'Mock question three?', answers: ['3A', '3B', '3C', '3D'], correct: 2 },
  { id: 'mock-4', question: 'Mock question four?', answers: ['4A', '4B', '4C', '4D'], correct: 3 },
  { id: 'mock-5', question: 'Mock question five?', answers: ['5A', '5B', '5C', '5D'], correct: 0 },
]

async function expectBalance(page, amount) {
  await expect(page.getByRole('navigation', {
    name: 'Main',
  }).getByText(String(amount), {
    exact: true,
  })).toBeVisible()
}

function isQuizQuestionsResponse(response) {
  return new URL(response.url()).pathname === '/api/quiz' && response.request().method() === 'GET'
}

// Opens the quiz from the hub and returns the questions the server sent.
async function startQuiz(page, linkName = 'Start quiz') {
  await page.getByRole('link', { name: 'Quiz', exact: true }).click()
  const questionsResponse = page.waitForResponse(isQuizQuestionsResponse, { timeout: QUIZ_LOAD_TIMEOUT })
  await page.getByRole('link', { name: linkName }).click()
  const { questions } = await (await questionsResponse).json()
  await expect(page.getByText('Question 1 of 5')).toBeVisible({ timeout: QUIZ_LOAD_TIMEOUT })
  return questions
}

// Clicks through every question, using chooseIndex(question, index) to pick each answer.
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
// answer after each choice. A throwaway account therefore learns today's answers, which
// lets the real server mark an exact score without this test knowing any quiz content.
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

// Finishes today's real quiz on the real server with exactly 3 of 5 right.
async function scoreThreeOutOfFive(page, browser) {
  const correctAnswers = await learnTodaysAnswers(browser)
  await signUpFreshUser(page)
  const questions = await startQuiz(page)
  await playQuiz(page, questions, (question, index) => {
    if (index < 3) return correctAnswers[index]
    return (correctAnswers[index] + 1) % question.answers.length
  })
  await expect(page.getByRole('heading', { name: '3 / 5 correct' })).toBeVisible()
  await expect(page.getByText(/You earned/)).toContainText('+30')
  await expectBalance(page, 530)
}

// The API is on another origin (port 8000), so a fake response needs CORS headers too.
function jsonResponse(body) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: {
      'access-control-allow-origin': 'http://localhost:5173',
      'access-control-allow-credentials': 'true',
    },
    body: JSON.stringify(body),
  }
}

// The server only accepts ids of questions it issued itself, so fake questions need
// /answer and /submit faked as well. This stand-in marks the answers the page really sends.
async function mockQuizApi(page) {
  const chosen = {}
  const byId = new Map(MOCK_QUESTIONS.map((question) => [question.id, question]))

  await page.route('**/api/quiz', (route) => route.fulfill(jsonResponse({
    questions: MOCK_QUESTIONS.map(({ id, question, answers }) => ({ id, icon: 'fish', question, answers, photo: null })),
    doneToday: false,
    streak: 0,
  })))

  await page.route('**/api/quiz/answer', (route) => {
    const { questionId, answer } = route.request().postDataJSON()
    const question = byId.get(questionId)
    chosen[questionId] = answer
    return route.fulfill(jsonResponse({
      chosen: answer,
      correct: question.correct,
      isCorrect: answer === question.correct,
      fact: `Fact for ${questionId}.`,
    }))
  })

  await page.route('**/api/quiz/submit', (route) => {
    const score = MOCK_QUESTIONS.filter((question) => chosen[question.id] === question.correct).length
    return route.fulfill(jsonResponse({
      score,
      total: MOCK_QUESTIONS.length,
      reward: score * 10,
      streakBonus: 0,
      practice: false,
      results: [],
      pearls: 500 + score * 10,
      xp: score * 15,
      streak: 1,
    }))
  })

  return chosen
}

test('the real daily quiz loads with 5 questions', async ({ page }) => {
  await signUpFreshUser(page)

  const questions = await startQuiz(page)

  expect(questions).toHaveLength(5)
  await expect(page.getByRole('heading', { name: questions[0].question })).toBeVisible()
  for (const answer of questions[0].answers) {
    await expect(page.getByRole('button', { name: answer, exact: true })).toBeVisible()
  }
})

test('with mocked questions, 3 correct answers show 3 / 5 and a 30 pearl reward', async ({ page }) => {
  await signUpFreshUser(page)
  const chosen = await mockQuizApi(page)

  await page.getByRole('link', { name: 'Quiz', exact: true }).click()
  await page.getByRole('link', { name: 'Start quiz' }).click()
  await expect(page.getByText('Question 1 of 5')).toBeVisible()

  // Right on questions 1 to 3, wrong on 4 and 5.
  const picks = ['1A', '2B', '3C', '4A', '5B']
  const feedback = ['Correct!', 'Correct!', 'Correct!', 'Not quite', 'Not quite']

  for (const [index, question] of MOCK_QUESTIONS.entries()) {
    await expect(page.getByRole('heading', { name: question.question })).toBeVisible()
    await page.getByRole('button', { name: picks[index], exact: true }).click()
    await expect(page.getByText(feedback[index], { exact: true })).toBeVisible()
    await expect(page.getByText(`Fact for ${question.id}.`)).toBeVisible()
    await page.getByRole('button', { name: index === 4 ? 'See results' : 'Next question' }).click()
  }

  await expect(page.getByRole('heading', { name: '3 / 5 correct' })).toBeVisible()
  await expect(page.getByText(/You earned/)).toContainText('+30')
  await expect(page.getByText('Practice round')).toHaveCount(0)
  expect(chosen).toEqual({ 'mock-1': 0, 'mock-2': 1, 'mock-3': 2, 'mock-4': 0, 'mock-5': 1 })
})

test('replaying the quiz after finishing it is practice and pays no extra pearls', async ({ page, browser }) => {
  await scoreThreeOutOfFive(page, browser)

  const questions = await startQuiz(page, 'Practise again')
  await playQuiz(page, questions, () => 0)

  await expect(page.getByText('Practice round: no pearls this time.')).toBeVisible()
  await expect(page.getByText(/You earned/)).toHaveCount(0)
  await expectBalance(page, 530)

  await page.reload()
  await expectBalance(page, 530)
})

test('the History page shows the quiz reward', async ({ page, browser }) => {
  await scoreThreeOutOfFive(page, browser)

  await page.getByRole('link', { name: 'History', exact: true }).click()

  const row = page.getByRole('row', { name: /Daily quiz: 3\/5 correct/ })
  await expect(row).toContainText('Reward')
  await expect(row).toContainText('+30')

  await page.getByRole('button', { name: 'Rewards', exact: true }).click()
  await expect(row).toBeVisible()
  await page.getByRole('button', { name: 'Purchases', exact: true }).click()
  await expect(row).toHaveCount(0)
})
