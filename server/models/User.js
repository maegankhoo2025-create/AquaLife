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