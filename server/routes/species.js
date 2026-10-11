const express = require('express')
const router = express.Router()

// GET /api/species?name=Paracheirodon%20innesi
router.get('/', async (req, res) => {
  const name = req.query.name

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Please provide a species name' })
  }

  try {
    const url = new URL('https://api.gbif.org/v1/species/match')
    url.searchParams.set('name', name.trim())

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return res.status(502).json({ error: 'Species provider returned an error' })
    }

    const data = await response.json()

    if (
      data.matchType !== 'EXACT' ||
      data.rank !== 'SPECIES' ||
      !data.usageKey
    ) {
      return res.status(404).json({ error: 'No exact species match found' })
    }

    res.json({
      gbifKey: data.usageKey,
      scientificName: data.scientificName,
      canonicalName: data.canonicalName,
      family: data.family ?? null,
      genus: data.genus ?? null,
      source: 'GBIF',
    })
  } catch (error) {
    console.error('Species lookup failed:', error.message)
    res.status(502).json({ error: 'Unable to retrieve species information' })
  }
})

module.exports = router