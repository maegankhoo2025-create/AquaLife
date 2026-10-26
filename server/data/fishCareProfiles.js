// AquaLife: proposed source-backed care and temperament metadata.
// References reviewed on 26 October 2026.
// These labels are curated project classifications, not live API responses.
// Read REVIEW_NOTES.md before applying: labels alone are not compatibility rules.
// Intended location: server/data/fishCareProfiles.js (CommonJS).

module.exports = [
  {
    "id": "neon-tetra",
    "name": "Neon Tetra",
    "sci": "Paracheirodon innesi",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Healthy captive-bred stock is manageable with stable water and a varied diet.",
    "temperamentNote": "Keep with a shoal and suitably small, calm companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Paracheirodon innesi species profile",
          "url": "https://www.seriouslyfish.com/species/paracheirodon-innesi",
          "scope": "species",
          "sourceScientificName": "Paracheirodon innesi"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "cardinal-tetra",
    "name": "Cardinal Tetra",
    "sci": "Paracheirodon axelrodi",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Use a mature aquarium and careful acclimation; wild stock is less tolerant of declining water quality.",
    "temperamentNote": "A social tetra suited to calm companions and a proper group.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Paracheirodon axelrodi species profile",
          "url": "https://www.seriouslyfish.com/species/paracheirodon-axelrodi",
          "scope": "species",
          "sourceScientificName": "Paracheirodon axelrodi"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "ember-tetra",
    "name": "Ember Tetra",
    "sci": "Hyphessobrycon amandae",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A small captive aquarium species requiring suitable food and normal, consistent maintenance.",
    "temperamentNote": "Keep in a group; avoid large or boisterous companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hyphessobrycon amandae species profile",
          "url": "https://www.seriouslyfish.com/species/hyphessobrycon-amandae",
          "scope": "species",
          "sourceScientificName": "Hyphessobrycon amandae"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "black-neon-tetra",
    "name": "Black Neon Tetra",
    "sci": "Hyphessobrycon herbertaxelrodi",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Commercially bred stock is suitable for a maintained community aquarium.",
    "temperamentNote": "A peaceful group fish; size and water needs still matter.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hyphessobrycon herbertaxelrodi species profile",
          "url": "https://www.seriouslyfish.com/species/hyphessobrycon-herbertaxelrodi",
          "scope": "species",
          "sourceScientificName": "Hyphessobrycon herbertaxelrodi"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "glowlight-tetra",
    "name": "Glowlight Tetra",
    "sci": "Hemigrammus erythrozonus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "The profile describes hardy farmed stock suitable for newcomers and readily accepting food.",
    "temperamentNote": "Suitable with calm community fish; avoid predators.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hemigrammus erythrozonus species profile",
          "url": "https://www.seriouslyfish.com/species/hemigrammus-erythrozonus",
          "scope": "species",
          "sourceScientificName": "Hemigrammus erythrozonus"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "black-skirt-tetra",
    "name": "Black Skirt Tetra",
    "sci": "Gymnocorymbus ternetzi",
    "care": "easy",
    "temperament": "semi-aggressive",
    "careNote": "Captive-bred fish accept ordinary aquarium foods and routine maintenance.",
    "temperamentNote": "Can nip fins, especially in undersized groups; avoid vulnerable long-finned companions.",
    "behaviourFlags": [
      "fin-nipping"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Gymnocorymbus ternetzi species profile",
          "url": "https://www.seriouslyfish.com/species/gymnocorymbus-ternetzi",
          "scope": "species",
          "sourceScientificName": "Gymnocorymbus ternetzi"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "lemon-tetra",
    "name": "Lemon Tetra",
    "sci": "Hyphessobrycon pulchripinnis",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Generally manageable in a maintained, furnished aquarium with a varied diet.",
    "temperamentNote": "Keep as a group with compatible community fish.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hyphessobrycon pulchripinnis species profile",
          "url": "https://www.seriouslyfish.com/species/hyphessobrycon-pulchripinnis",
          "scope": "species",
          "sourceScientificName": "Hyphessobrycon pulchripinnis"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "serpae-tetra",
    "name": "Serpae Tetra",
    "sci": "Hyphessobrycon eques",
    "care": "easy",
    "temperament": "semi-aggressive",
    "careNote": "Routine maintenance is manageable, but sufficient group size and swimming space are important.",
    "temperamentNote": "A boisterous fin-nipper; avoid slow, shy or long-finned tank mates.",
    "behaviourFlags": [
      "fin-nipping",
      "same-species-rivalry"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Megalamphodus eques species profile",
          "url": "https://www.seriouslyfish.com/species/megalamphodus-eques",
          "scope": "species",
          "sourceScientificName": "Megalamphodus eques"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "diamond-tetra",
    "name": "Diamond Tetra",
    "sci": "Moenkhausia pittieri",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Hardy commercially raised stock does well with stable water and a varied diet.",
    "temperamentNote": "Keep in a group with suitable community companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Makunaima pittieri species profile",
          "url": "https://www.seriouslyfish.com/species/makunaima-pittieri",
          "scope": "species",
          "sourceScientificName": "Makunaima pittieri"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "x-ray-tetra",
    "name": "X-ray Tetra",
    "sci": "Pristella maxillaris",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A hardy, commonly farmed tetra suited to standard aquarium maintenance.",
    "temperamentNote": "A social community fish; keep with a group and appropriately sized companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Pristella maxillaris species profile",
          "url": "https://www.seriouslyfish.com/species/pristella-maxillaris",
          "scope": "species",
          "sourceScientificName": "Pristella maxillaris"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "guppy",
    "name": "Guppy",
    "sci": "Poecilia reticulata",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Use suitable mineral-rich water and choose healthy stock; ornamental strains vary in robustness.",
    "temperamentNote": "Generally peaceful; breeding males may persistently pursue females.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Poecilia reticulata species profile",
          "url": "https://www.seriouslyfish.com/species/poecilia-reticulata",
          "scope": "species",
          "sourceScientificName": "Poecilia reticulata"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "endler",
    "name": "Endler's Livebearer",
    "sci": "Poecilia wingei",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Manageable in suitable hard water with small foods and normal maintenance.",
    "temperamentNote": "Choose small, calm companions; mixing with guppies risks hybridisation.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Poecilia wingei species profile",
          "url": "https://www.seriouslyfish.com/species/poecilia-wingei",
          "scope": "species",
          "sourceScientificName": "Poecilia wingei"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "southern-platy",
    "name": "Southern Platy",
    "sci": "Xiphophorus maculatus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A beginner-suitable livebearer when water contains appropriate minerals.",
    "temperamentNote": "Generally calm; consider sex ratios and provide refuges from persistent males.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Xiphophorus maculatus species profile",
          "url": "https://www.seriouslyfish.com/species/xiphophorus-maculatus",
          "scope": "species",
          "sourceScientificName": "Xiphophorus maculatus"
        }
      ],
      "sourceCareLabel": "Beginner"
    }
  },
  {
    "id": "variatus-platy",
    "name": "Variatus Platy",
    "sci": "Xiphophorus variatus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Suitable for routine care in appropriately mineralised water with a varied diet.",
    "temperamentNote": "A community livebearer; allow cover and space around breeding activity.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Xiphophorus variatus species profile",
          "url": "https://www.seriouslyfish.com/species/xiphophorus-variatus",
          "scope": "species",
          "sourceScientificName": "Xiphophorus variatus"
        }
      ],
      "sourceCareLabel": "Beginner"
    }
  },
  {
    "id": "swordtail",
    "name": "Green Swordtail",
    "sci": "Xiphophorus hellerii",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "An active, larger livebearer needing swimming room and suitable hard water.",
    "temperamentNote": "Usually a community fish; males can compete intensely in confined space.",
    "behaviourFlags": [
      "same-species-rivalry"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Xiphophorus hellerii species profile",
          "url": "https://www.seriouslyfish.com/species/xiphophorus-hellerii",
          "scope": "species",
          "sourceScientificName": "Xiphophorus hellerii"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "common-molly",
    "name": "Common Molly",
    "sci": "Poecilia sphenops",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Hard, alkaline water is important; unsuitable soft water can cause chronic health problems.",
    "temperamentNote": "Generally peaceful with fish sharing its water requirements; manage persistent male courtship.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Poecilia sphenops species profile",
          "url": "https://www.seriouslyfish.com/species/poecilia-sphenops",
          "scope": "species",
          "sourceScientificName": "Poecilia sphenops"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "sailfin-molly",
    "name": "Sailfin Molly",
    "sci": "Poecilia latipinna",
    "care": "moderate",
    "temperament": "semi-aggressive",
    "careNote": "Requires mineral-rich water, sufficient space and attention to its larger adult size.",
    "temperamentNote": "Males may fight and adults may harass smaller fish; plan sex ratios and tank mates.",
    "behaviourFlags": [
      "same-species-rivalry",
      "small-tankmate-harassment"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Poecilia latipinna species profile",
          "url": "https://www.seriouslyfish.com/species/poecilia-latipinna",
          "scope": "species",
          "sourceScientificName": "Poecilia latipinna"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "zebra-danio",
    "name": "Zebra Danio",
    "sci": "Danio rerio",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A hardy, active fish needing group space and a secure cover.",
    "temperamentNote": "Generally peaceful but energetic; choose companions that tolerate its activity.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Danio rerio species profile",
          "url": "https://www.seriouslyfish.com/species/danio-rerio",
          "scope": "species",
          "sourceScientificName": "Danio rerio"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "pearl-danio",
    "name": "Pearl Danio",
    "sci": "Danio albolineatus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Routine care is manageable; provide swimming space and a tightly fitting lid.",
    "temperamentNote": "An active group fish suited to appropriately robust community companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Danio albolineatus species profile",
          "url": "https://www.seriouslyfish.com/species/danio-albolineatus",
          "scope": "species",
          "sourceScientificName": "Danio albolineatus"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "celestial-pearl-danio",
    "name": "Celestial Pearl Danio",
    "sci": "Danio margaritatus",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Provide plant cover, gentle flow and suitably small foods; newly acquired fish may need feeding attention.",
    "temperamentNote": "Calm towards other species, but males spar and can damage each other's fins in cramped groups.",
    "behaviourFlags": [
      "same-species-rivalry"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Danio margaritatus species profile",
          "url": "https://www.seriouslyfish.com/species/danio-margaritatus",
          "scope": "species",
          "sourceScientificName": "Danio margaritatus"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "harlequin-rasbora",
    "name": "Harlequin Rasbora",
    "sci": "Trigonostigma heteromorpha",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A familiar, commercially bred aquarium fish suited to regular maintenance.",
    "temperamentNote": "A calm shoaling species for suitably sized community companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trigonostigma heteromorpha species profile",
          "url": "https://www.seriouslyfish.com/species/trigonostigma-heteromorpha",
          "scope": "species",
          "sourceScientificName": "Trigonostigma heteromorpha"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "lambchop-rasbora",
    "name": "Lambchop Rasbora",
    "sci": "Trigonostigma espei",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Manageable with plant cover, stable water and food small enough to eat.",
    "temperamentNote": "A quiet group fish; avoid aggressive or much larger companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trigonostigma espei species profile",
          "url": "https://www.seriouslyfish.com/species/trigonostigma-espei",
          "scope": "species",
          "sourceScientificName": "Trigonostigma espei"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "glowlight-rasbora",
    "name": "Glowlight Rasbora",
    "sci": "Trigonostigma hengeli",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Suitable for a maintained, planted aquarium and a varied small-food diet.",
    "temperamentNote": "Keep as a shoal with compatible, similarly sized fish.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trigonostigma hengeli species profile",
          "url": "https://www.seriouslyfish.com/species/trigonostigma-hengeli",
          "scope": "species",
          "sourceScientificName": "Trigonostigma hengeli"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "chili-rasbora",
    "name": "Chili Rasbora",
    "sci": "Boraras brigittae",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Needs an established aquarium, stable water and tiny foods; small size does not make it low-maintenance.",
    "temperamentNote": "A timid group fish; large or vigorous companions may intimidate or eat it.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Boraras brigittae species profile",
          "url": "https://www.seriouslyfish.com/species/boraras-brigittae",
          "scope": "species",
          "sourceScientificName": "Boraras brigittae"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "scissortail-rasbora",
    "name": "Scissortail Rasbora",
    "sci": "Rasbora trilineata",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Adult size, group swimming space, mature water and a secure lid need advance planning.",
    "temperamentNote": "A peaceful but active shoaling fish; choose tank mates of suitable size.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Rasbora trilineata species profile",
          "url": "https://www.seriouslyfish.com/species/rasbora-trilineata",
          "scope": "species",
          "sourceScientificName": "Rasbora trilineata"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "tiger-barb",
    "name": "Tiger Barb",
    "sci": "Puntigrus tetrazona",
    "care": "easy",
    "temperament": "semi-aggressive",
    "careNote": "Generally manageable with routine maintenance, swimming room and a sufficient group.",
    "temperamentNote": "Fin-nipping and rivalry require careful companions; avoid long-finned or timid fish.",
    "behaviourFlags": [
      "fin-nipping",
      "same-species-rivalry"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Puntigrus tetrazona species profile",
          "url": "https://www.seriouslyfish.com/species/puntigrus-tetrazona",
          "scope": "species",
          "sourceScientificName": "Puntigrus tetrazona"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "cherry-barb",
    "name": "Cherry Barb",
    "sci": "Puntius titteya",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A manageable choice for newer keepers when kept in an appropriately maintained aquarium.",
    "temperamentNote": "Generally calm; keep a group with cover and compatible companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Puntius titteya species profile",
          "url": "https://www.seriouslyfish.com/species/puntius-titteya",
          "scope": "species",
          "sourceScientificName": "Puntius titteya"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "rosy-barb",
    "name": "Rosy Barb",
    "sci": "Pethia conchonius",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A robust species; allow ample room for an active group.",
    "temperamentNote": "Generally peaceful in a suitably planned community; activity and group needs still matter.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Pethia conchonius species profile",
          "url": "https://www.seriouslyfish.com/species/pethia-conchonius",
          "scope": "species",
          "sourceScientificName": "Pethia conchonius"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "black-ruby-barb",
    "name": "Black Ruby Barb",
    "sci": "Pethia nigrofasciata",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Farmed fish are adaptable; provide stable water, cover and a varied diet.",
    "temperamentNote": "Usually a peaceful group fish with appropriately sized companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Pethia nigrofasciata species profile",
          "url": "https://www.seriouslyfish.com/species/pethia-nigrofasciata",
          "scope": "species",
          "sourceScientificName": "Pethia nigrofasciata"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "gold-barb",
    "name": "Gold Barb",
    "sci": "Barbodes semifasciolatus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A hardy aquarium barb requiring room for its active group.",
    "temperamentNote": "Generally a community fish; keep with a shoal and suitable tank mates.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Barbodes semifasciolatus species profile",
          "url": "https://www.seriouslyfish.com/species/barbodes-semifasciolatus",
          "scope": "species",
          "sourceScientificName": "Barbodes semifasciolatus"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "corydoras",
    "name": "Peppered Cory",
    "sci": "Corydoras paleatus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Provide clean, smooth substrate and deliberate sinking-food feeding; it is not a substitute for cleaning.",
    "temperamentNote": "A peaceful bottom dweller that needs companions of its own species.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hoplisoma paleatum species profile",
          "url": "https://www.seriouslyfish.com/species/hoplisoma-paleatum",
          "scope": "species",
          "sourceScientificName": "Hoplisoma paleatum"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "bronze-cory",
    "name": "Bronze Cory",
    "sci": "Corydoras aeneus",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Commercial stock is manageable with clean substrate, stable water and suitable sinking foods.",
    "temperamentNote": "Keep a social group; avoid aggressive companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Osteogaster aenea species profile",
          "url": "https://www.seriouslyfish.com/species/osteogaster-aenea",
          "scope": "species",
          "sourceScientificName": "Osteogaster aenea"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "panda-cory",
    "name": "Panda Cory",
    "sci": "Corydoras panda",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Prioritise clean substrate and consistent water quality; poor maintenance can damage barbels and health.",
    "temperamentNote": "A social, non-aggressive catfish needing a group and calm companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Hoplisoma panda species profile",
          "url": "https://www.seriouslyfish.com/species/hoplisoma-panda",
          "scope": "species",
          "sourceScientificName": "Hoplisoma panda"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "pygmy-cory",
    "name": "Pygmy Cory",
    "sci": "Corydoras pygmaeus",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Needs stable water, small foods and a group in a well-maintained aquarium.",
    "temperamentNote": "Tiny and easily intimidated; avoid large or boisterous tank mates.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Gastrodermus pygmaeus species profile",
          "url": "https://www.seriouslyfish.com/species/gastrodermus-pygmaeus",
          "scope": "species",
          "sourceScientificName": "Gastrodermus pygmaeus"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "bristlenose-pleco",
    "name": "Bristlenose Pleco",
    "sci": "Ancistrus cirrhosus",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Use a mature, oxygenated aquarium; supply hides and a deliberate plant-based diet rather than relying on algae.",
    "temperamentNote": "Usually suitable for communities; cave or territory disputes can occur with other bottom dwellers.",
    "behaviourFlags": [
      "territorial-bottom-dweller"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Maidenhead Aquatics / Fishkeeper",
          "title": "Bristlenose Catfish",
          "url": "https://www.fishkeeper.co.uk/fish/freshwater/catfish/bristlenose-catfish-",
          "scope": "trade-group",
          "sourceScientificName": "Ancistrus sp."
        }
      ],
      "identityNote": "Bristlenose trade fish can be multiple species or hybrids. This guide covers the trade group, not confirmed A. cirrhosus."
    }
  },
  {
    "id": "kuhli-loach",
    "name": "Kuhli Loach",
    "sci": "Pangio kuhlii",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Needs a mature aquarium, soft substrate, protected filter intakes and deliberate feeding.",
    "temperamentNote": "A shy, social bottom fish; provide a group, shelter and peaceful companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Practical Fishkeeping",
          "title": "Keeping Kuhli and other Eel loaches in the aquarium",
          "url": "https://www.practicalfishkeeping.co.uk/features/keeping-kuhli-and-other-eel-loaches-in-the-aquarium/",
          "scope": "genus-and-trade-group",
          "sourceScientificName": "Pangio spp.; distinguishes P. kuhlii from P. semicincta"
        }
      ],
      "identityNote": "P. kuhlii is often confused in trade with P. semicincta. Group-level husbandry supports these labels; retain existing API identity until separately reviewed."
    }
  },
  {
    "id": "betta",
    "name": "Betta",
    "sci": "Betta splendens",
    "care": "moderate",
    "temperament": "aggressive",
    "careNote": "Provide stable, filtered water, gentle flow, cover and access to the surface.",
    "temperamentNote": "Males must not be housed together; other tank mates require individual assessment, and a dedicated tank is safest.",
    "behaviourFlags": [
      "same-species-danger",
      "tankmate-selection"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Betta splendens species profile",
          "url": "https://www.seriouslyfish.com/species/betta-splendens",
          "scope": "species",
          "sourceScientificName": "Betta splendens"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "honey-gourami",
    "name": "Honey Gourami",
    "sci": "Trichogaster chuna",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Manageable with gentle flow, cover, surface access and regular feeding.",
    "temperamentNote": "A quiet fish easily outcompeted by vigorous companions; some hierarchy-related chasing occurs.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trichogaster chuna species profile",
          "url": "https://www.seriouslyfish.com/species/trichogaster-chuna",
          "scope": "species",
          "sourceScientificName": "Trichogaster chuna"
        }
      ],
      "sourceCareLabel": "Beginner"
    }
  },
  {
    "id": "dwarf-gourami",
    "name": "Dwarf Gourami",
    "sci": "Trichogaster lalius",
    "care": "moderate",
    "temperament": "semi-aggressive",
    "careNote": "Choose healthy stock and provide quiet planted cover; commercial stock has documented disease concerns.",
    "temperamentNote": "Males can defend space and harass females; provide refuges and choose companions carefully.",
    "behaviourFlags": [
      "same-species-rivalry"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trichogaster lalius species profile",
          "url": "https://www.seriouslyfish.com/species/trichogaster-lalius",
          "scope": "species",
          "sourceScientificName": "Trichogaster lalius"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "pearl-gourami",
    "name": "Pearl Gourami",
    "sci": "Trichopodus leerii",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A relatively hardy gourami once given appropriate space, cover and surface access.",
    "temperamentNote": "Usually calm with suitable companions; allow space around courtship or nesting.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trichopodus leerii species profile",
          "url": "https://www.seriouslyfish.com/species/trichopodus-leerii",
          "scope": "species",
          "sourceScientificName": "Trichopodus leerii"
        }
      ],
      "sourceCareLabel": "Beginner"
    }
  },
  {
    "id": "sparkling-gourami",
    "name": "Sparkling Gourami",
    "sci": "Trichopsis pumila",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Provide gentle flow, dense cover, surface access and a varied diet containing small live or frozen foods.",
    "temperamentNote": "Best with quiet, similarly small fish; stronger feeders can intimidate or outcompete it.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Trichopsis pumila species profile",
          "url": "https://www.seriouslyfish.com/species/trichopsis-pumila",
          "scope": "species",
          "sourceScientificName": "Trichopsis pumila"
        }
      ],
      "sourceCareLabel": "Beginner"
    }
  },
  {
    "id": "angelfish",
    "name": "Angelfish",
    "sci": "Pterophyllum scalare",
    "care": "moderate",
    "temperament": "semi-aggressive",
    "careNote": "Adult height, tank space and companion selection require planning.",
    "temperamentNote": "May eat small fish and become territorial during breeding; peaceful labels do not remove predation risk.",
    "behaviourFlags": [
      "may-eat-small-fish",
      "breeding-territoriality"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Pterophyllum scalare species profile",
          "url": "https://www.seriouslyfish.com/species/pterophyllum-scalare",
          "scope": "species",
          "sourceScientificName": "Pterophyllum scalare"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "discus",
    "name": "Discus",
    "sci": "Symphysodon aequifasciatus",
    "care": "hard",
    "temperament": "peaceful",
    "careNote": "Needs especially consistent warm water, rigorous maintenance and careful feeding; not a beginner choice.",
    "temperamentNote": "Generally calm, but social hierarchies and breeding pairs can bully weaker fish.",
    "behaviourFlags": [
      "social-hierarchy"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Aqueon",
          "title": "Discus Care Guide",
          "url": "https://www.aqueon.com/resources/care-guides/discus",
          "scope": "genus-group",
          "sourceScientificName": "Symphysodon spp."
        }
      ]
    }
  },
  {
    "id": "oscar",
    "name": "Oscar",
    "sci": "Astronotus ocellatus",
    "care": "hard",
    "temperament": "semi-aggressive",
    "careNote": "Very large adult size, waste production and housing demands make this an advanced project choice.",
    "temperamentNote": "Will eat smaller fish; territorial behaviour and adult size restrict suitable companions.",
    "behaviourFlags": [
      "may-eat-small-fish",
      "territoriality"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "LiveAquaria",
          "title": "Tiger Oscar",
          "url": "https://www.liveaquaria.com/products/tiger-oscar",
          "scope": "species-colour-form",
          "sourceScientificName": "Astronotus ocellatus"
        },
        {
          "provider": "Seriously Fish",
          "title": "Astronotus ocellatus species profile",
          "url": "https://www.seriouslyfish.com/species/astronotus-ocellatus",
          "scope": "species",
          "sourceScientificName": "Astronotus ocellatus"
        }
      ]
    }
  },
  {
    "id": "german-blue-ram",
    "name": "German Blue Ram",
    "sci": "Mikrogeophagus ramirezi",
    "care": "hard",
    "temperament": "peaceful",
    "careNote": "Needs exceptional water quality and stable warm conditions; sources range from moderate to expert-only care.",
    "temperamentNote": "Usually peaceful; guarding eggs or inadequate refuges can lead to territorial aggression.",
    "behaviourFlags": [
      "breeding-territoriality"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "LiveAquaria",
          "title": "German Blue Ram EXPERT ONLY",
          "url": "https://www.liveaquaria.com/products/german-blue-ram-expert-only",
          "scope": "species",
          "sourceScientificName": "Mikrogeophagus ramirezi"
        },
        {
          "provider": "Seriously Fish",
          "title": "Mikrogeophagus ramirezi species profile",
          "url": "https://www.seriouslyfish.com/species/mikrogeophagus-ramirezi",
          "scope": "species",
          "sourceScientificName": "Mikrogeophagus ramirezi"
        }
      ]
    }
  },
  {
    "id": "bolivian-ram",
    "name": "Bolivian Ram",
    "sci": "Mikrogeophagus altispinosus",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Use mature, clean water and soft sand for natural feeding; maintain good feeding and water quality.",
    "temperamentNote": "A relatively mild cichlid; males defend territories more strongly in confined space.",
    "behaviourFlags": [
      "territoriality"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Mikrogeophagus altispinosus species profile",
          "url": "https://www.seriouslyfish.com/species/mikrogeophagus-altispinosus",
          "scope": "species",
          "sourceScientificName": "Mikrogeophagus altispinosus"
        }
      ],
      "sourceCareLabel": "Moderate"
    }
  },
  {
    "id": "kribensis",
    "name": "Kribensis",
    "sci": "Pelvicachromis pulcher",
    "care": "moderate",
    "temperament": "semi-aggressive",
    "careNote": "Routine feeding is manageable, but cave territories and breeding pairs require planned housing.",
    "temperamentNote": "Can become strongly territorial around a nest; avoid crowded communities and vulnerable bottom dwellers.",
    "behaviourFlags": [
      "breeding-territoriality"
    ],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Pelvicachromis pulcher species profile",
          "url": "https://www.seriouslyfish.com/species/pelvicachromis-pulcher",
          "scope": "species",
          "sourceScientificName": "Pelvicachromis pulcher"
        }
      ],
      "sourceCareLabel": "Easy"
    }
  },
  {
    "id": "goldfish",
    "name": "Goldfish",
    "sci": "Carassius auratus",
    "care": "moderate",
    "temperament": "peaceful",
    "careNote": "Plan for substantial adult size, waste, oxygen demand and filtration; a bowl is unsuitable.",
    "temperamentNote": "Usually social with suitable fish; fast single-tailed forms may overwhelm slower fancy varieties.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Aqueon",
          "title": "Goldfish Care Guide",
          "url": "https://www.aqueon.com/resources/care-guides/goldfish",
          "scope": "species-and-domestic-varieties",
          "sourceScientificName": "Carassius auratus"
        }
      ]
    }
  },
  {
    "id": "medaka",
    "name": "Japanese Ricefish",
    "sci": "Oryzias latipes",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "A manageable ricefish with suitable seasonal temperature conditions, stable water and small foods.",
    "temperamentNote": "A peaceful group fish; select calm companions suited to its conditions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Oryzias latipes species profile",
          "url": "https://www.seriouslyfish.com/species/oryzias-latipes",
          "scope": "species",
          "sourceScientificName": "Oryzias latipes"
        }
      ]
    }
  },
  {
    "id": "dwarf-neon-rainbowfish",
    "name": "Dwarf Neon Rainbowfish",
    "sci": "Melanotaenia praecox",
    "care": "easy",
    "temperament": "peaceful",
    "careNote": "Provide stable water, swimming space, plant cover and a varied diet.",
    "temperamentNote": "A peaceful shoaling species; avoid intimidating or predatory companions.",
    "behaviourFlags": [],
    "provenance": {
      "dataType": "curated-reference",
      "classificationMethod": "AquaLife care and temperament rubric v1",
      "reviewedAt": "2026-10-26",
      "reviewStatus": "prepared-for-team-review",
      "sources": [
        {
          "provider": "Seriously Fish",
          "title": "Melanotaenia praecox species profile",
          "url": "https://www.seriouslyfish.com/species/melanotaenia-praecox",
          "scope": "species",
          "sourceScientificName": "Melanotaenia praecox"
        }
      ]
    }
  }
]
