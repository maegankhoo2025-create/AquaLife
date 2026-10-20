const mongoose = require('mongoose')

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
    category: { type: String, required: true, enum: ['fish', 'plant', 'decor'] },
    name: { type: String, required: true, trim: true },
    sci: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    temperament: {
      type: String,
      enum: ['peaceful', 'semi-aggressive', 'aggressive'],
    },
    care: { type: String, enum: ['easy', 'moderate', 'hard'] },
    temp: { type: [Number], default: undefined }, // fish: [min, max]
    ph: { type: [Number], default: undefined },
    size: { type: Number, min: 0 }, // cm, fish
    blurb: { type: String, default: '' },
    photos: { type: [photoSchema], default: [] },
  },
  { timestamps: true, id: false},
)

productSchema.statics.getAllProducts = function () {
  return this.find().sort({ category: 1, name: 1 })
}

productSchema.statics.getProductBySlug = function (id) {
  return this.findOne({ id })
}

module.exports = mongoose.model('Product', productSchema)