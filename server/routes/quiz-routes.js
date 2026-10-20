// Daily quiz routes.
// Questions come from live species data (see data/questions.js) and are sent
// without their answers. The answers are kept in the user's session, and the
// server does the marking, so nobody can earn pearls by just claiming a perfect score.

const express = require('express')
const User = require('../models/User-model')
const Transaction = require('../models/Transaction-model')
const { QUIZ_LENGTH, getQuestionPool, questionsForDay } = require('../data/questions')
const { dayKey, currentStreak, QUIZ_STREAK_BONUSES } = require('../logic/gamification')

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

// GET /api/quiz -> today's questions (no answers) and whether today's reward is used up.
// Reuses today's unfinished attempt so reloading cannot replace the first choices.
router.get('/', async (req, res) => {
  if (!requireLogin(req, res)) return

  try {
    const user = await User.findById(req.session.userId)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const today = dayKey()
    let quiz = req.session.quiz
    if (!quiz || quiz.userId !== req.session.userId || quiz.day !== today) {
      quiz = {
        userId: req.session.userId,
        day: today,
        questions: questionsForDay(await getQuestionPool(), today),
        answers: {},
      }
      req.session.quiz = quiz
    }

    return res.status(200).json({
      questions: quiz.questions.map(({ id, icon, question, answers, photo }) => ({ id, icon, question, answers, photo })),
      doneToday: user.quiz.lastDay === today,
      streak: currentStreak(user),
    })
  } catch (error) {
    console.error('Get quiz failed:', error)
    return res.status(503).json({ message: 'The quiz is unavailable right now. Please try again later.' })
  }
})

// POST /api/quiz/answer  body: { questionId, answer }  (answer = index of the chosen answer)
// Gives instant feedback on one question. Only the first choice for each question counts,
// so peeking at the right answer and then changing it does not earn anything.
router.post('/answer', (req, res) => {
  if (!requireLogin(req, res)) return

  const quiz = req.session.quiz
  const question = quiz?.userId === req.session.userId && quiz.day === dayKey()
    ? quiz.questions.find((q) => q.id === req.body.questionId)
    : null
  if (!question) return res.status(400).json({ message: 'That is not one of your quiz questions.' })

  const answer = Number(req.body.answer)
  if (!Number.isInteger(answer) || answer < 0 || answer >= question.answers.length) {
    return res.status(400).json({ message: 'Please choose one of the answers.' })
  }

  if (quiz.answers[question.id] === undefined) quiz.answers[question.id] = answer
  const chosen = quiz.answers[question.id]

  return res.status(200).json({
    chosen,
    correct: question.correct,
    isCorrect: chosen === question.correct,
    fact: question.fact,
  })
})

// POST /api/quiz/submit -> marks the answers given through /answer.
// Pearls are only paid for the first quiz of the day, so replaying is just practice.
router.post('/submit', async (req, res) => {
  if (!requireLogin(req, res)) return

  const quiz = req.session.quiz
  const today = dayKey()
  if (!quiz || quiz.userId !== req.session.userId || quiz.day !== today ||
      quiz.questions.some((question) => quiz.answers[question.id] === undefined)) {
    return res.status(400).json({ message: `Please answer all ${QUIZ_LENGTH} questions first.` })
  }

  try {
    const results = quiz.questions.map((question) => {
      const chosen = quiz.answers[question.id]
      return { id: question.id, chosen, correct: question.correct, isCorrect: chosen === question.correct, fact: question.fact }
    })
    const score = results.filter((result) => result.isCorrect).length
    const total = results.length

    const outcome = await User.db.transaction(async (session) => {
      const user = await User.findById(req.session.userId).session(session)
      if (!user) return null
      const practice = user.quiz.lastDay === today
      let reward = 0
      let streakBonus = 0
      if (!practice) {
        user.quiz.streak = currentStreak(user) + 1
        streakBonus = QUIZ_STREAK_BONUSES[user.quiz.streak] || 0
        const answerReward = score * PEARLS_PER_CORRECT_ANSWER
        reward = answerReward + streakBonus
        user.quiz.lastDay = today
        user.quiz.scores.push({ score, total, reward })
        user.pearls += reward
        user.xp += score * XP_PER_CORRECT_ANSWER
        await user.save({ session })
        const entries = [{
          user: user._id,
          type: 'reward',
          label: `Daily quiz: ${score}/${total} correct`,
          amount: answerReward,
        }]
        if (streakBonus > 0) entries.push({
          user: user._id,
          type: 'reward',
          label: `${user.quiz.streak}-day quiz streak bonus`,
          amount: streakBonus,
        })
        await Transaction.create(entries, { session, ordered: true })
      }
      return { user, reward, streakBonus, practice }
    })
    if (!outcome) return res.status(404).json({ message: 'User not found.' })
    const { user, reward, streakBonus, practice } = outcome
    req.session.quiz = null // the next GET can start a practice attempt

    return res.status(200).json({
      score,
      total,
      reward,
      streakBonus,
      practice,
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
