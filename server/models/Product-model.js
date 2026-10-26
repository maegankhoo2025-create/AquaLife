const mongoose = require('mongoose')
const { productEffect } = require('../data/equipment')

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    attribution: { type: String, default: '' },
    license: { type: String, default: '' },
    source: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // 'neon-tetra'
    category: { type: String, required: true, enum: ['fish', 'plant', 'decor', 'equipment'] },
    name: { type: String, required: true, trim: true },
    sci: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    temperament: {
      type: String,
      enum: ['peaceful', 'semi-aggressive', 'aggressive'],
    },
    care: { type: String, enum: ['easy', 'moderate', 'hard'] },
    careNote: { type: String, default: '' },
    temperamentNote: { type: String, default: '' },
    behaviourFlags: { type: [String], default: [] },
    careProfileProvenance: { dataType: { type: String, default: '' },
    classificationMethod: { type: String, default: '' },
    reviewedAt: { type: String, default: '' },
    reviewStatus: { type: String, default: '' },
    sourceCareLabel: { type: String, default: '' },
    identityNote: { type: String, default: '' },

  sources: {
    type: [
      {
        provider: String,
        title: String,
        url: String,
        scope: String,
        sourceScientificName: String,
        _id: false,
      },
    ],
    default: [],
  },
},
    temp: { type: [Number], default: undefined }, // fish: [min, max]
    ph: { type: [Number], default: undefined },
    conditionsSource: { type: String, default: '' },
    conditionsSourceUrl: { type: String, default: '' },
    conditionsFetchedAt: { type: Date, default: null },
    size: { type: Number, min: 0 }, // cm, fish
    sizeType: { type: String, default: '' },
    blurb: { type: String, default: '' },
    photos: { type: [photoSchema], default: [] },
  },
  { timestamps: true, id: false, toJSON: { virtuals: true } },
)

productSchema.virtual('effect').get(function () {
  return productEffect(this)
})

productSchema.statics.getAllProducts = function () {
  return this.find().sort({ category: 1, name: 1 })
}

productSchema.statics.getProductBySlug = function (id) {
  return this.findOne({ id })
}

module.exports = mongoose.model('Product', productSchema)