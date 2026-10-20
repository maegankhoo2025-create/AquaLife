const express = require('express')
const User = require('../models/User-model')

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

    //start of checks that the email looks like something@something.something, 
    // with no spaces and only one @
    // 1. No spaces allowed
    if (cleanEmail.includes(' ')) {
    return res.json({ message: 'Please enter a valid email address.' })
    }

    // 2. Must have exactly one @
    const parts = cleanEmail.split('@')

    if (parts.length !== 2) {
    return res.json({ message: 'Please enter a valid email address.' })
    }

    const beforeAt = parts[0] // e.g. "lam"
    const afterAt = parts[1]  // e.g. "gmail.com"

    // 3. Something must come before the @
    if (beforeAt === '') {
    return res.json({ message: 'Please enter a valid email address.' })
    }

    // 4. After the @ there must be a dot, with text on both sides of it
    const dotPosition = afterAt.lastIndexOf('.')

    if (dotPosition <= 0 || dotPosition === afterAt.length - 1) {
    return res.json({ message: 'Please enter a valid email address.' })
    }
    //end of checks that the email looks like something@something.something,
    //  with no spaces and only one @

    const existingUser = await User.findOne({ email: cleanEmail })

    if (existingUser) {
      return res.json({ message: 'An account with this email already exists.' })
    }

    const user = new User({ name: cleanName, email: cleanEmail })
    await user.setPassword(password)
    await user.save()

    req.session.userId = user._id.toString()

    return req.session.save((error) => {
      if (error) {
        delete req.session.userId
        console.error('Sign-up failed:', error)
        return res.json({ message: 'Unable to create the account. Please try again.' })
      }

      return res.json({
        message: 'Account created successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
        },
      })
    })
  } catch (error) {
    console.error('Sign-up failed:', error)
    return res.json({ message: 'Unable to create the account. Please try again.' })
  }
})



router.post('/login', async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.json({ message: 'Please enter your email and password.' })
  }

  try {
    const cleanEmail = email.trim().toLowerCase()

    // passwordHash is hidden by default in User.js, so request it for this check.
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash +avatar')

    if (!user || !(await user.verifyPassword(password))) {
      return res.json({ message: 'Email or password is incorrect.' })
    }

    req.session.userId = user._id.toString()

    return req.session.save((error) => {
      if (error) {
        delete req.session.userId
        console.error('Log-in failed:', error)
        return res.json({ message: 'Unable to log in. Please try again.' })
      }

      return res.json({
        message: 'Logged in successfully.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
        },
      })
    })
  } catch (error) {
    console.error('Log-in failed:', error)
    return res.json({ message: 'Unable to log in. Please try again.' })
  }
})


//lets Vue ask the backend whether the current browser has an active session.
router.get('/session', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false })
  }

  try {
    const user = await User.findById(req.session.userId).select('+avatar')

    if (!user) {
      return res.json({ loggedIn: false })
    }

    return res.json({
      loggedIn: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      },
    })
  } catch (error) {
    console.error('Session check failed:', error)
    return res.json({
      message: 'Unable to check the login session. Please try again.',
    })
  }
})

router.patch('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Please log in first.' })
  }

  const { name, email, avatar } = req.body
  const hasAvatar = Object.prototype.hasOwnProperty.call(req.body, 'avatar')
  if (
    (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
    (email !== undefined && (typeof email !== 'string' || !email.trim())) ||
    (name === undefined && email === undefined && !hasAvatar)
  ) {
    return res.status(400).json({ message: 'Please enter your name, email address or profile picture.' })
  }
  if (hasAvatar && !User.validAvatar(avatar)) {
    return res.status(400).json({ message: 'Choose a valid PNG thumbnail up to 128 × 128 pixels and 90 KB, or remove the picture.' })
  }

  const cleanName = name === undefined ? undefined : name.trim()
  const cleanEmail = email === undefined ? undefined : email.trim().toLowerCase()
  if (cleanEmail !== undefined) {
    const parts = cleanEmail.split('@')
    const afterAt = parts[1] || ''
    const dotPosition = afterAt.lastIndexOf('.')
    if (cleanEmail.includes(' ') || parts.length !== 2 || parts[0] === '' ||
        dotPosition <= 0 || dotPosition === afterAt.length - 1) {
      return res.status(400).json({ message: 'Please enter a valid email address.' })
    }
  }

  try {
    const user = await User.findById(req.session.userId).select('+avatar')
    if (!user) {
      return res.status(401).json({ message: 'Please log in first.' })
    }

    if (cleanEmail !== undefined) {
      const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } })
      if (existingUser) {
        return res.status(409).json({ message: 'An account with this email already exists.' })
      }
      user.email = cleanEmail
    }
    if (cleanName !== undefined) user.name = cleanName
    if (hasAvatar) user.avatar = avatar
    await user.save()

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || '' },
      message: 'Profile updated successfully.',
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    console.error('Profile update failed:', error)
    return res.status(500).json({ message: 'Unable to update your profile. Please try again.' })
  }
})

//logs out by destroying the active session.
router.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Log-out failed:', error)
      return res.json({ message: 'Unable to log out. Please try again.' })
    }

    res.clearCookie('connect.sid')
    return res.json({ message: 'Logged out successfully.' })
  })
})



module.exports = router