// Shop list: GET /api/products
// Reads the products collection (the 18 items you seeded) and sends them to the frontend.

const express = require('express')
const Product = require('../models/Product-model')

const router = express.Router()

// GET /api/products -> every shop item
router.get('/', async (req, res) => {
  try {
    // getAllProducts is the static method on Product.js
    const products = await Product.getAllProducts()
    return res.status(200).json({ products: products })
  } catch (error) {
    console.error('Get products failed:', error)
    return res.status(500).json({ message: 'Unable to load the shop. Please try again.' })
  }
})

module.exports = router