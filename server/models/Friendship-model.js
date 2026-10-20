const mongoose = require('mongoose')

const friendshipSchema = new mongoose.Schema({
  pair: { type: String, required: true, unique: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending', required: true },
}, { timestamps: true })

friendshipSchema.index({ members: 1, status: 1 })

module.exports = mongoose.model('Friendship', friendshipSchema)
