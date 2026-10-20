const express = require('express')
const { randomBytes } = require('crypto')
const User = require('../models/User-model')
const Tank = require('../models/Tank-model')
const Friendship = require('../models/Friendship-model')
const SocialMessage = require('../models/SocialMessage-model')
const Transaction = require('../models/Transaction-model')
const { simulateTank } = require('../logic/simulation')

const router = express.Router()
const validId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
const pairKey = (a, b) => [String(a), String(b)].sort().join(':')
const profile = (user) => ({ id: String(user._id), name: user.name })
const handle = (action) => (req, res, next) => Promise.resolve(action(req, res)).catch(next)

router.use(async (req, res, next) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Please log in first.' })
    const user = await User.findById(req.session.userId).select('name pearls +inviteToken')
    if (!user) return res.status(401).json({ message: 'Please log in first.' })
    req.socialUser = user
    next()
  } catch (error) {
    next(error)
  }
})

router.get('/', handle(async (req, res) => {
  const user = req.socialUser
  if (!user.inviteToken) {
    const updated = await User.findOneAndUpdate(
      { _id: user._id, inviteToken: { $exists: false } },
      { $set: { inviteToken: randomBytes(24).toString('hex') } },
      { new: true },
    ).select('+inviteToken')
    user.inviteToken = updated?.inviteToken || (await User.findById(user._id).select('+inviteToken')).inviteToken
  }
  const relationships = await Friendship.find({ members: user._id })
    .populate('members', 'name').sort({ createdAt: -1 })
  const friends = []
  const incoming = []
  const outgoing = []
  for (const relationship of relationships) {
    const other = relationship.members.find((member) => member && String(member._id) !== String(user._id))
    if (!other) continue
    const entry = { id: String(relationship._id), user: profile(other) }
    if (relationship.status === 'accepted') friends.push(entry)
    else if (String(relationship.requestedBy) === String(user._id)) outgoing.push(entry)
    else incoming.push(entry)
  }
  const inbox = await SocialMessage.find({ recipient: user._id })
    .populate('sender', 'name').populate('tank', 'name owner').sort({ createdAt: -1 })
  const messages = inbox.map((message) => ({
    ...message.toObject(),
    canDeleteComment: message.type === 'comment' && (
      String(message.sender?._id) === String(user._id) ||
      String(message.tank?.owner) === String(user._id)
    ),
  }))
  res.json({ friends, incoming, outgoing, inbox: messages, inviteToken: user.inviteToken, pearls: user.pearls })
}))

router.post('/requests', handle(async (req, res) => {
  if (typeof req.body.email !== 'string' || !req.body.email.trim() || req.body.email.length > 254) {
    return res.status(400).json({ message: 'Enter your friend’s exact email address.' })
  }
  const other = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('name')
  if (!other) return res.status(404).json({ message: 'No account matches that email address.' })
  if (String(other._id) === String(req.socialUser._id)) {
    return res.status(400).json({ message: 'You cannot add yourself as a friend.' })
  }
  const relationship = await Friendship.findOneAndUpdate(
    { pair: pairKey(req.socialUser._id, other._id) },
    { $setOnInsert: { members: [req.socialUser._id, other._id], requestedBy: req.socialUser._id, status: 'pending' } },
    { upsert: true, new: true, runValidators: true },
  )
  let message = 'Friend request sent.'
  if (relationship.status === 'accepted') message = 'You are already friends.'
  else if (String(relationship.requestedBy) !== String(req.socialUser._id)) {
    message = 'This person has already requested to be your friend. Accept their request below.'
  }
  res.json({ message })
}))

router.patch('/requests/:id', handle(async (req, res) => {
  const { action } = req.body
  if (!validId(req.params.id) || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Choose a valid request and response.' })
  }
  const filter = {
    _id: req.params.id, members: req.socialUser._id,
    requestedBy: { $ne: req.socialUser._id }, status: 'pending',
  }
  const relationship = action === 'accept'
    ? await Friendship.findOneAndUpdate(filter, { $set: { status: 'accepted' } }, { new: true })
    : await Friendship.findOneAndDelete(filter)
  if (!relationship) return res.status(404).json({ message: 'Friend request not found.' })
  res.json({ message: action === 'accept' ? 'Friend request accepted.' : 'Friend request rejected.' })
}))

router.get('/invitations/:token', handle(async (req, res) => {
  if (!/^[a-f\d]{48}$/.test(req.params.token)) {
    return res.status(404).json({ message: 'This invitation was not found.' })
  }
  const inviter = await User.findOne({ inviteToken: req.params.token }).select('name')
  if (!inviter) return res.status(404).json({ message: 'This invitation was not found.' })
  res.json({ inviter: profile(inviter) })
}))

router.post('/invitations/:token/accept', handle(async (req, res) => {
  if (!/^[a-f\d]{48}$/.test(req.params.token)) {
    return res.status(404).json({ message: 'This invitation was not found.' })
  }
  const inviter = await User.findOne({ inviteToken: req.params.token }).select('name')
  if (!inviter) return res.status(404).json({ message: 'This invitation was not found.' })
  if (String(inviter._id) === String(req.socialUser._id)) {
    return res.status(400).json({ message: 'This is your own invitation. Share it with a friend.' })
  }
  await Friendship.findOneAndUpdate(
    { pair: pairKey(inviter._id, req.socialUser._id) },
    {
      $set: { status: 'accepted' },
      $setOnInsert: { members: [inviter._id, req.socialUser._id], requestedBy: inviter._id },
    },
    { new: true, upsert: true, runValidators: true },
  )
  res.json({ message: `You and ${inviter.name} are now friends.` })
}))

router.patch('/messages/:id/read', handle(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ message: 'Message not found.' })
  const message = await SocialMessage.findOneAndUpdate(
    { _id: req.params.id, recipient: req.socialUser._id },
    { $set: { readAt: new Date() } },
    { new: true },
  )
  if (!message) return res.status(404).json({ message: 'Message not found.' })
  res.json({ message })
}))

// Deletion is independent of friendship; gifts and reminders are never removed here.
router.delete('/comments/:id', handle(async (req, res) => {
  if (!validId(req.params.id)) return res.status(404).json({ message: 'Comment not found.' })
  const comment = await SocialMessage.findOne({ _id: req.params.id, type: 'comment' })
  if (!comment) return res.status(404).json({ message: 'Comment not found.' })
  const isAuthor = String(comment.sender) === String(req.socialUser._id)
  const ownsTank = comment.tank && await Tank.exists({ _id: comment.tank, owner: req.socialUser._id })
  if (!isAuthor && !ownsTank) {
    return res.status(403).json({ message: 'Only the author or current tank owner can delete this comment.' })
  }
  await comment.deleteOne()
  res.json({ id: String(comment._id), message: 'Comment deleted.' })
}))

// Every visit, gift, reminder and comment requires an accepted friendship.
router.use('/:friendId', async (req, res, next) => {
  try {
    if (!validId(req.params.friendId)) return res.status(404).json({ message: 'Friend not found.' })
    const relationship = await Friendship.findOne({
      pair: pairKey(req.socialUser._id, req.params.friendId), status: 'accepted',
    })
    if (!relationship) return res.status(403).json({ message: 'Accept a friendship before visiting or sending messages.' })
    const friend = await User.findById(req.params.friendId).select('name')
    if (!friend) return res.status(404).json({ message: 'Friend not found.' })
    req.socialFriend = friend
    next()
  } catch (error) {
    next(error)
  }
})

router.get('/:friendId/tanks', handle(async (req, res) => {
  const tanks = await Tank.find({ owner: req.socialFriend._id }).sort({ createdAt: 1 })
  const publicTanks = tanks.map((tank) => {
    // Simulate the preview in memory only; a visitor cannot save changes.
    simulateTank(tank)
    return {
      _id: tank._id,
      name: tank.name,
      conditions: tank.conditions,
      progression: tank.progression,
      fish: tank.fish.map((fish) => ({
        _id: fish._id, speciesId: fish.speciesId, nickname: fish.nickname,
        health: fish.health, hunger: fish.hunger, size: fish.size,
      })),
      decorations: tank.decorations.map((item) => ({ _id: item._id, itemId: item.itemId, x: item.x, y: item.y })),
    }
  })
  const comments = await SocialMessage.find({
    recipient: req.socialFriend._id, tank: { $in: tanks.map((tank) => tank._id) }, type: 'comment',
  }).populate('sender', 'name').sort({ createdAt: -1 })
  res.json({ friend: profile(req.socialFriend), tanks: publicTanks, comments })
}))

router.post('/:friendId/gifts', handle(async (req, res) => {
  const { amount } = req.body
  const content = req.body.message ?? ''
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) {
    return res.status(400).json({ message: 'Gift a whole number from 1 to 1,000,000 pearls.' })
  }
  if (typeof content !== 'string' || content.length > 500) {
    return res.status(400).json({ message: 'Gift messages must be 500 characters or fewer.' })
  }
  const result = await User.db.transaction(async (session) => {
    const recipient = await User.findById(req.socialFriend._id).select('name pearls').session(session)
    if (!recipient) return { status: 404, body: { message: 'Friend not found.' } }
    if (!Number.isSafeInteger(recipient.pearls + amount)) {
      return { status: 400, body: { message: 'This gift would exceed the recipient’s balance limit.' } }
    }
    const sender = await User.findOneAndUpdate(
      { _id: req.socialUser._id, pearls: { $gte: amount } },
      { $inc: { pearls: -amount } },
      { new: true, session },
    )
    if (!sender) return { status: 400, body: { message: 'You do not have enough pearls for this gift.' } }
    await User.updateOne({ _id: recipient._id }, { $inc: { pearls: amount } }, { session })
    await Transaction.create([
      { user: sender._id, type: 'gift', label: `Gift to ${recipient.name}`, amount: -amount },
      { user: recipient._id, type: 'gift', label: `Gift from ${sender.name}`, amount },
    ], { session, ordered: true })
    await SocialMessage.create([{
      sender: sender._id, recipient: recipient._id, type: 'gift', amount, content: content.trim(),
    }], { session })
    return { status: 201, body: { message: `Sent ${amount} pearls to ${recipient.name}.`, pearls: sender.pearls } }
  })
  res.status(result.status).json(result.body)
}))

router.post('/:friendId/reminders', handle(async (req, res) => {
  if (!validId(req.body.tankId)) return res.status(400).json({ message: 'Choose a tank for the reminder.' })
  const tank = await Tank.findOne({ _id: req.body.tankId, owner: req.socialFriend._id })
  if (!tank) return res.status(404).json({ message: 'Tank not found.' })
  await SocialMessage.create({
    sender: req.socialUser._id, recipient: req.socialFriend._id, tank: tank._id,
    type: 'reminder', content: `Remember to check whether the fish in ${tank.name} need feeding.`,
  })
  res.status(201).json({ message: 'Feed reminder sent to your friend’s inbox.' })
}))

router.post('/:friendId/comments', handle(async (req, res) => {
  const { content, tankId } = req.body
  if (typeof content !== 'string' || !content.trim() || content.length > 500) {
    return res.status(400).json({ message: 'Write a comment from 1 to 500 characters.' })
  }
  if (!validId(tankId)) return res.status(400).json({ message: 'Choose a tank for the comment.' })
  const tank = await Tank.findOne({ _id: tankId, owner: req.socialFriend._id })
  if (!tank) return res.status(404).json({ message: 'Tank not found.' })
  await SocialMessage.create({
    sender: req.socialUser._id, recipient: req.socialFriend._id, tank: tank._id,
    type: 'comment', content: content.trim(),
  })
  res.status(201).json({ message: 'Comment added to the tank and your friend’s inbox.' })
}))

router.use((error, req, res, next) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'This friendship was just updated. Refresh your friends list.' })
  }
  console.error('Friends request failed:', error)
  res.status(500).json({ message: 'Unable to update friends. Please try again.' })
})

module.exports = router
