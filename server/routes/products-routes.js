// Public catalogue; purchases still read current prices directly from MongoDB.

const express = require('express')
const Product = require('../models/Product-model')

const router = express.Router()
const CACHE_TTL_MS = 60 * 1000
let catalogueJSON = null
let catalogueExpiresAt = 0
let catalogueLoad = null

// GET /api/products -> every shop item
router.get('/', async (req, res) => {
  try {
    if (!catalogueJSON || Date.now() >= catalogueExpiresAt) {
      if (!catalogueLoad) {
        catalogueLoad = Product.getAllProducts().then((products) => {
          catalogueJSON = JSON.stringify({ products })
          catalogueExpiresAt = Date.now() + CACHE_TTL_MS
        }).finally(() => {
          catalogueLoad = null
        })
      }
      await catalogueLoad
    }
    return res.status(200).type('json').send(catalogueJSON)
  } catch (error) {
    console.error('Get products failed:', error)
    return res.status(500).json({ message: 'Unable to load the shop. Please try again.' })
  }
})

module.exports = router