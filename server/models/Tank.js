// DRAFT Tank schema: agree the final shape with Yiming (MongoDB schema owner)
// before building routes on it.
// Boilerplate generated with AI assistance (declare in README.txt).

const mongoose = require('mongoose');

// One fish living in a tank
const tankFishSchema = new mongoose.Schema({
  speciesId: { type: String, required: true },   // id of the species in our species collection / API
  nickname:  { type: String, default: '' },
  health:    { type: Number, default: 100, min: 0, max: 100 },
  hunger:    { type: Number, default: 0,   min: 0, max: 100 },
  addedAt:   { type: Date,   default: Date.now },
});

const tankSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:  { type: String, required: true, trim: true, maxlength: 40 },

    // Water conditions (the sliders on the tank page)
    conditions: {
      temperature:  { type: Number, default: 25,  min: 15, max: 35 },  // °C
      ph:           { type: Number, default: 7.0, min: 5,  max: 9 },
      waterQuality: { type: Number, default: 100, min: 0,  max: 100 }, // %
    },

    fish: [tankFishSchema],

    // Plants and decorations from the shop (ids of inventory items)
    decorations: [{ type: String }],

    // When conditions/health were last recalculated (for the time-based simulation)
    lastSimulatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Tank', tankSchema);
