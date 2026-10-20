const mongoose = require('mongoose')

// Embedded: one fish in a tank (matches mock fish objects)
const tankFishSchema = new mongoose.Schema({
  speciesId: { type: String, required: true, trim: true },
  nickname: { type: String, default: '', trim: true, maxlength: 20 },
  notes: { type: String, default: '', maxlength: 2000 },
  health: { type: Number, default: 100, min: 0, max: 100 },
  hunger: { type: Number, default: 0, min: 0, max: 100 },
  size: { type: Number, default: 0, min: 0 }, // cm, grows up to the species' adult size
  addedAt: { type: Date, default: Date.now },
})

// Embedded: one plant/decor with position (matches mock decorations)
const decorationSchema = new mongoose.Schema({
  itemId: { type: String, required: true, trim: true },
  x: { type: Number, default: 50, min: 0, max: 100 },
  y: { type: Number, default: 85, min: 0, max: 100 },
  addedAt: { type: Date },
  installedAt: { type: Date },
})

const tankSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    conditions: {
      temperature: { type: Number, default: 25, min: 15, max: 35 },
      ph: { type: Number, default: 7.0, min: 5, max: 9 },
      waterQuality: { type: Number, default: 100, min: 0, max: 100 },
    },
    targets: {
      temperature: { type: Number, default: 25, min: 15, max: 35 },
      ph: { type: Number, default: 7.0, min: 5, max: 9 },
      waterQuality: { type: Number, default: 100, min: 0, max: 100 },
    },
    fish: [tankFishSchema],
    decorations: [decorationSchema],
    maintenance: {
      waterChange: {
        startedAt: Date,
        endsAt: Date,
        amount: Number,
        delivered: { type: Number, default: 0 },
      },
    },
    lastSimulatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, optimisticConcurrency: true, toJSON: { virtuals: true } },
)

tankSchema.index({ owner: 1, createdAt: 1 })

tankSchema.virtual('progression').get(function () {
  return require('../logic/simulation').tankProgression(this)
})


// All tanks for one user, oldest first
tankSchema.statics.getAllTanks = function (ownerId) {
  return this.find({ owner: ownerId }).sort({ createdAt: 1 })
}

// One tank, only if it belongs to that user
tankSchema.statics.getTankById = function (id, ownerId) {
  return this.findOne({ _id: id, owner: ownerId })
}

tankSchema.statics.createTank = function (data) {
  return this.create(data)
}

// Partial update (targets, name, etc.). new: true returns the updated doc.
tankSchema.statics.updateTank = function (id, ownerId, updates) {
  return this.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $set: updates },
    { new: true, runValidators: true },
  )
}

tankSchema.statics.deleteTank = function (id, ownerId) {
  return this.findOneAndDelete({ _id: id, owner: ownerId })
}

// Nested fish — still statics wrapping built-in queries
tankSchema.statics.addFish = function (id, ownerId, fishData) {
  return this.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { $push: { fish: fishData } },
    { new: true, runValidators: true },
  )
}

module.exports = mongoose.model('Tank', tankSchema)