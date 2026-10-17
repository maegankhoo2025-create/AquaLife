// One pearl change: a shop purchase (negative amount), a reward (positive)
// or a refund for removing a living fish (positive).
// Shown on the History page and in "Recent activity" on the dashboard.

const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['purchase', 'reward', 'refund'], required: true },
  label: { type: String, required: true, trim: true }, // e.g. "Daily quiz: 4/5 correct"
  amount: { type: Number, required: true }, // pearls, negative when spent
  date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Transaction', transactionSchema)
