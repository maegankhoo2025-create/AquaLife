const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { inflateSync } = require('zlib')

// Only small, complete PNG thumbnails are stored, never remote URLs or SVG.
function validAvatar(value) {
  if (value === '') return true
  if (typeof value !== 'string' || value.length > 90000) return false
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || match[1].length % 4 !== 0) return false
  const png = Buffer.from(match[1], 'base64')
  if (png.toString('base64') !== match[1] || png.length < 57 ||
      !png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return false
  let offset = 8
  let rowBytes = 0
  let height = 0
  const imageChunks = []
  let imageEnded = false
  try {
    while (offset + 12 <= png.length) {
      const length = png.readUInt32BE(offset)
      const end = offset + 8 + length
      if (end + 4 > png.length) return false
      const type = png.toString('ascii', offset + 4, offset + 8)
      if (offset === 8) {
        if (type !== 'IHDR' || length !== 13) return false
        const width = png.readUInt32BE(offset + 8)
        height = png.readUInt32BE(offset + 12)
        const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[png[offset + 17]]
        if (!width || width > 128 || !height || height > 128 || png[offset + 16] !== 8 ||
            !channels || png[offset + 18] !== 0 || png[offset + 19] !== 0 || png[offset + 20] !== 0) return false
        rowBytes = width * channels + 1
      } else if (type === 'IDAT') {
        if (imageEnded) return false
        imageChunks.push(png.subarray(offset + 8, end))
      } else if (type === 'IEND') {
        if (length !== 0 || end + 4 !== png.length || !imageChunks.length) return false
        const pixels = inflateSync(Buffer.concat(imageChunks), { maxOutputLength: rowBytes * height })
        if (pixels.length !== rowBytes * height) return false
        for (let row = 0; row < height; row++) if (pixels[row * rowBytes] > 4) return false
        return true
      } else {
        // Canvas thumbnails need no additional critical chunks.
        if (!/^[a-z][A-Za-z]{3}$/.test(type)) return false
        if (imageChunks.length) imageEnded = true
      }
      offset = end + 4
    }
  } catch {
    return false
  }
  return false
}


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
    avatar: { type: String, default: '', select: false, validate: validAvatar },

    // Gamification. Level is worked out from xp, so it is not stored.
    pearls: { type: Number, default: 500, min: 0 },
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

    // One snapshot per day. The dashboard reads up to the last 31 days.
    careLog: [{
      day: { type: String, required: true },
      met: { type: Number, required: true },
      total: { type: Number, required: true },
      _id: false,
    }],
  },
  { timestamps: true },
)

userSchema.statics.validAvatar = validAvatar


userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10)
}


userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash)
}

module.exports = mongoose.model('User', userSchema)