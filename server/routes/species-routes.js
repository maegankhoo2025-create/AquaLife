const express = require('express')
const speciesConditions = require('../data/speciesConditions')
const router = express.Router()

async function getConditions(scientificName) {
  const slug = scientificName.trim().toLowerCase().replace(/\s+/g, '-')
  const url =
    `https://www.aquaristatlas.com/api/v1/species/${encodeURIComponent(slug)}.json`

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return null

    const data = await response.json()

    // Confirm the response belongs to the requested species.
    if (
      data.scientificName?.toLowerCase() !== scientificName.toLowerCase()
    ) {
      return null
    }

    const water = data.facts?.water

    if (
      !water ||
      ![
        water.tempMinC,
        water.tempMaxC,
        water.phMin,
        water.phMax,
      ].every(Number.isFinite)
    ) {
      return null
    }

    return {
      temperature: { min: water.tempMinC, max: water.tempMaxC },
      ph: { min: water.phMin, max: water.phMax },
      source: 'Aquarist Atlas',
      sourceUrl: data.url,
      dataType: 'live-api',
    }
  } catch (error) {
    console.error('Conditions lookup failed:', error.message)
    return null
  }
}

 async function getSpecies(name) {

    const url = new URL('https://api.gbif.org/v1/species/match')
    url.searchParams.set('name', name.trim())

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
       throw new Error('Species provider returned an error')
    }

    const data = await response.json()

    if (
      data.matchType !== 'EXACT' ||
      data.rank !== 'SPECIES' ||
      !data.usageKey
    ) {
      const error = new Error('No exact species match found')
      error.status = 404
      throw error
    }

        // Photo lookup is optional: GBIF data still works if it fails.
    let commonName = null
    let photo = null

    try {
      const photoUrl = new URL('https://api.inaturalist.org/v1/taxa')
      photoUrl.searchParams.set('q', data.canonicalName)
      photoUrl.searchParams.set('rank', 'species')
      photoUrl.searchParams.set('per_page', '5')

      const photoResponse = await fetch(photoUrl, {
        signal: AbortSignal.timeout(10000),
      })

      if (photoResponse.ok) {
        const photoData = await photoResponse.json()

        const taxon = photoData.results?.find(
          item =>
            item.is_active &&
            item.name?.toLowerCase() === data.canonicalName.toLowerCase()
        )

        commonName = taxon?.preferred_common_name ?? null

        const image = taxon?.default_photo

        if (image?.medium_url && image.license_code?.startsWith('cc-')) {
          photo = {
            url: image.medium_url,
            attribution: image.attribution,
            license: image.license_code,
            source: 'iNaturalist',
            sourceUrl: `https://www.inaturalist.org/photos/${image.id}`,
        }
    }
}
    } catch (error) {
      console.error('Photo lookup failed:', error.message)
    }

    const conditions =
     await getConditions(data.canonicalName) ??
      speciesConditions[data.canonicalName] ??
       null

        return ({
      gbifKey: data.usageKey,
      scientificName: data.scientificName,
      canonicalName: data.canonicalName,
      commonName,
      family: data.family ?? null,
      genus: data.genus ?? null,
      source: 'GBIF',
      photo,
      conditions,
         })
        } 

// GET /api/species?name=Paracheirodon%20innesi

router.get('/', async (req, res) => {
  const name = req.query.name

  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Please provide a species name' })
  }

  try {

   // closes getSpecies
        const species = await getSpecies(name)
        res.json(species)
    
     } catch (error) {
         console.error('Species lookup failed:', error.message)

    res.status(error.status ?? 502).json({
      error: error.status === 404
        ? 'No exact species match found'
        : 'Unable to retrieve species information',
    })
   
    }
  }
)

router.get('/quiz-data', async (req, res) => {
  const names = [
    'Paracheirodon innesi',
    'Betta splendens',
    'Poecilia reticulata',
  ]

  try {
    const species = await Promise.all(
      names.map(name => getSpecies(name))
    )

    res.json({ species })
  } catch (error) {
    console.error('Quiz species lookup failed:', error.message)
    res.status(502).json({
      error: 'Unable to retrieve quiz species',
    })
  }
})
module.exports = router
// Also used by the quiz to build questions from live species data
module.exports.getSpecies = getSpecies
