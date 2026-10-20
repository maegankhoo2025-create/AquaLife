const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // don't send this back in normal queries
    },

    // Gamification. Level is worked out from xp, so it is not stored.
    pearls: { type: Number, default: 200, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    inviteToken: { type: String, unique: true, sparse: true, select: false },

    // Daily care tasks already rewarded on "day" (YYYY-MM-DD)
    tasks: {
      day: { type: String, default: '' },
      done: [{ type: String }],
    },

    quiz: {
      streak: { type: Number, default: 0 },
      lastDay: { type: String, default: '' }, // YYYY-MM-DD of the last rewarded quiz
      scores: [
        {
          date: { type: Date, default: Date.now },
          score: Number,
          total: Number,
          reward: Number,
        },
      ],
    },
  },
  { timestamps: true },
)


userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10)
}


userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash)
}

module.exports = mongoose.model('User', userSchema)