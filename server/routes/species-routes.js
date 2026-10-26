const express = require('express')
const speciesConditions = require('../data/speciesConditions')
const router = express.Router()

// Aquarist Atlas uses different scientific names for these species.
const atlasNames = {
  'Hyphessobrycon eques': 'Megalamphodus eques',
  'Puntius titteya': 'Rohanella titteya',
  'Corydoras paleatus': 'Hoplisoma paleatum',
  'Corydoras aeneus': 'Osteogaster aenea',
  'Trichogaster lalius': 'Trichogaster fasciata',
}

const photoNames = {
  'Hyphessobrycon eques': 'Megalamphodus eques',
  'Moenkhausia pittieri': 'Makunaima pittieri',
  'Puntius titteya': 'Rohanella titteya',
  'Corydoras paleatus': 'Hoplisoma paleatum',
  'Corydoras aeneus': 'Osteogaster aenea',
  'Corydoras panda': 'Hoplisoma panda',
  'Corydoras pygmaeus': 'Gastrodermus pygmaeus',
  'Trichogaster lalius': 'Trichogaster fasciata',
}

async function getConditions(scientificName) {
  const atlasName =
  atlasNames[scientificName.trim()] ?? scientificName.trim()

  const slug = atlasName.toLowerCase().replace(/\s+/g, '-')
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
      data.scientificName?.toLowerCase() !== atlasName.toLowerCase()
    ) {
      return null
    }

    const water = data.facts?.water
   
    const sizeData = data.facts?.size
    
    const size = Number.isFinite(sizeData?.maxLengthCm) && sizeData.maxLengthCm > 0 ? sizeData.maxLengthCm : null

    const sizeType = size === null ? null : sizeData.lengthType ?? null

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
      size,
      sizeType,
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
      const photoName = photoNames[data.canonicalName] ?? data.canonicalName
      const photoUrl = new URL('https://api.inaturalist.org/v1/taxa')
      photoUrl.searchParams.set('q', photoName)
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
            item.name?.toLowerCase() === photoName.toLowerCase()
        )

        commonName = taxon?.preferred_common_name ?? null

        const image = taxon?.default_photo
          

        const allowedPhotoLicenses = [
          'cc0',
          'pd',
          'cc-by',
          'cc-by-sa',
          'cc-by-nc',
          'cc-by-nc-sa',
          'cc-by-nd',
          'cc-by-nc-nd',
        ]

        // First, try the species' default photo.
        if (
          image?.medium_url &&
          allowedPhotoLicenses.includes(
            image.license_code?.toLowerCase()
          )
        ) {
          photo = {
            url: image.medium_url,
            attribution: image.attribution,
            license: image.license_code,
            source: 'iNaturalist',
            sourceUrl: `https://www.inaturalist.org/photos/${image.id}`,
          }
        }

        // If the default photo is unusable, check observation photos.
        if (!photo && taxon?.id) {
          const observationUrl = new URL(
            'https://api.inaturalist.org/v1/observations'
          )

          observationUrl.searchParams.set('taxon_id', String(taxon.id))
          observationUrl.searchParams.set('photos', 'true')
          observationUrl.searchParams.set('per_page', '10')
          observationUrl.searchParams.set(
            'photo_license',
            'cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd'
          )

          const observationResponse = await fetch(observationUrl, {
            signal: AbortSignal.timeout(10000),
          })

          if (observationResponse.ok) {
            const observationData = await observationResponse.json()

            for (const observation of observationData.results ?? []) {
              if (observation.taxon?.id !== taxon.id) continue

              const usablePhoto = observation.photos?.find(candidate =>
                !candidate.hidden &&
                candidate.url &&
                allowedPhotoLicenses.includes(
                  candidate.license_code?.toLowerCase()
                )
              )

              if (usablePhoto) {
                photo = {
                  url: usablePhoto.url.replace('/square.', '/medium.'),
                  attribution: usablePhoto.attribution,
                  license: usablePhoto.license_code,
                  source: 'iNaturalist',
                  sourceUrl:
                    `https://www.inaturalist.org/photos/${usablePhoto.id}`,
                }

                break
              }
            }
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
      size: conditions?.size ?? null,
      sizeType: conditions?.sizeType ?? null,
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
