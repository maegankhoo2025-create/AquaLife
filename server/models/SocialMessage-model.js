const mongoose = require('mongoose')

const socialMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Tank' },
  type: { type: String, enum: ['comment', 'reminder', 'gift'], required: true },
  content: { type: String, default: '', trim: true, maxlength: 500 },
  amount: { type: Number, min: 1 },
  readAt: { type: Date, default: null },
}, { timestamps: true })

module.exports = mongoose.model('SocialMessage', socialMessageSchema)
