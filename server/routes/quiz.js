// Daily quiz routes.
// Questions are sent without their answers, and the server does the marking,
// so nobody can earn pearls by just claiming a perfect score.

const express = require('express')
const User = require('../models/User')
const { QUIZ_LENGTH, getQuestion, questionsForDay } = require('../data/questions')
const { dayKey, yesterdayKey, currentStreak, changePearls } = require('../logic/gamification')

const router = express.Router()

const PEARLS_PER_CORRECT_ANSWER = 10
const XP_PER_CORRECT_ANSWER = 15

// Helper: stop the request if nobody is logged in
function requireLogin(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ message: 'Please log in first.' })
    return false
  }
  return true
}

// GET /api/quiz -> today's questions (no answers) and whether today's reward is used up
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const questions = questionsForDay(dayKey()).map(({ id, emoji, question, answers }) => ({
      id,
      emoji,
      question,
      answers,
    }))
    return res.status(200).json({
      questions,
      doneToday: user.quiz.lastDay === dayKey(),
      streak: currentStreak(user),
    })
  } catch (error) {
    console.error('Get quiz failed:', error)
    return res.status(500).json({ message: 'Unable to load the quiz. Please try again.' })
  }
})

// POST /api/quiz/submit  body: { answers: { <questionId>: <index of chosen answer>, ... } }
// Marks the quiz. Pearls are only paid for the first quiz of the day, so replaying is just practice.
router.post('/submit', async (req, res) => {
  if (!requireLogin(req, res)) return

  const answers = req.body.answers
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ message: 'Please send your answers.' })
  }

  // Accept today's or yesterday's questions, in case the quiz was started just before midnight.
  const allowedIds = new Set(
    [...questionsForDay(dayKey()), ...questionsForDay(yesterdayKey())].map((question) => question.id),
  )
  const ids = Object.keys(answers)
  if (ids.length !== QUIZ_LENGTH || !ids.every((id) => allowedIds.has(id))) {
    return res.status(400).json({ message: 'Those are not the questions for today’s quiz.' })
  }

  try {
    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const results = ids.map((id) => {
      const question = getQuestion(id)
      const chosen = Number(answers[id])
      return { id, chosen, correct: question.correct, isCorrect: chosen === question.correct, fact: question.fact }
    })
    const score = results.filter((result) => result.isCorrect).length
    const total = results.length

    let reward = 0
    if (user.quiz.lastDay !== dayKey()) {
      reward = score * PEARLS_PER_CORRECT_ANSWER
      user.quiz.streak = currentStreak(user) + 1
      user.quiz.lastDay = dayKey()
      user.quiz.scores.push({ score, total, reward })
      await changePearls(user, {
        type: 'reward',
        label: `Daily quiz: ${score}/${total} correct`,
        amount: reward,
        xp: score * XP_PER_CORRECT_ANSWER,
      })
    }

    return res.status(200).json({
      score,
      total,
      reward,
      results,
      pearls: user.pearls,
      xp: user.xp,
      streak: user.quiz.streak,
    })
  } catch (error) {
    console.error('Submit quiz failed:', error)
    return res.status(500).json({ message: 'Unable to mark the quiz. Please try again.' })
  }
})

module.exports = router
