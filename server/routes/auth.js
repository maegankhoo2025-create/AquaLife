const express = require('express')
const User = require('../models/User')

const router = express.Router()

router.post('/signup', async (req, res) => {
  const name = req.body.name
  const email = req.body.email
  const password = req.body.password


if (
  typeof name !== 'string' ||
  typeof email !== 'string' ||
  typeof password !== 'string' ||
  !name.trim() ||
  !email.trim() ||
  !password
) {
  return res.json({ message: 'Please fill in all the fields.' })
}


  const longEnough = password.length >= 5

  let hasLetter = false
  let hasNumber = false

  for (let i = 0; i < password.length; i++) {
    const ch = password[i]

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
      hasLetter = true
    }

    if (ch >= '0' && ch <= '9') {
      hasNumber = true
    }
  }

  if (!longEnough || !hasLetter || !hasNumber) {
    return res.json({
      message:
        'Password must be at least 5 characters long and contain at least 1 letter and at least 1 number.',
    })
  }

  try {
    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({ email: cleanEmail })

    if (existingUser) {
      return res.json({ message: 'An account with this email already exists.' })
    }

    const user = new User({ name: cleanName, email: cleanEmail })
    await user.setPassword(password)
    await user.save()

    return res.json({
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Sign-up failed:', error)
    return res.json({ message: 'Unable to create the account. Please try again.' })
  }
})

module.exports = router