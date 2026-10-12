// Care requirements for every fish species sold in the shop.
// Copied from client/src/data/mock.js (ITEMS) so the server can run the compatibility check and the fish-care simulation on its own.
// Later this can be replaced or filled in from the FishBase API (Kaavya).
// temp: [min, max] in °C   ph: [min, max]   size: adult length in cm

const SPECIES = [
  { id: 'neon-tetra', name: 'Neon Tetra', sci: 'Paracheirodon innesi', temperament: 'peaceful', care: 'easy', temp: [20, 26], ph: [6.0, 7.0], size: 4 },
  { id: 'guppy', name: 'Guppy', sci: 'Poecilia reticulata', temperament: 'peaceful', care: 'easy', temp: [22, 28], ph: [6.8, 7.8], size: 5 },
  { id: 'corydoras', name: 'Peppered Cory', sci: 'Corydoras paleatus', temperament: 'peaceful', care: 'easy', temp: [22, 26], ph: [6.0, 7.5], size: 6 },
  { id: 'zebra-danio', name: 'Zebra Danio', sci: 'Danio rerio', temperament: 'peaceful', care: 'easy', temp: [18, 26], ph: [6.5, 7.5], size: 5 },
  { id: 'goldfish', name: 'Goldfish', sci: 'Carassius auratus', temperament: 'peaceful', care: 'easy', temp: [16, 24], ph: [7.0, 8.0], size: 20 },
  { id: 'betta', name: 'Betta', sci: 'Betta splendens', temperament: 'semi-aggressive', care: 'easy', temp: [24, 30], ph: [6.5, 7.5], size: 7 },
  { id: 'tiger-barb', name: 'Tiger Barb', sci: 'Puntigrus tetrazona', temperament: 'semi-aggressive', care: 'easy', temp: [22, 27], ph: [6.0, 7.5], size: 7 },
  { id: 'angelfish', name: 'Angelfish', sci: 'Pterophyllum scalare', temperament: 'semi-aggressive', care: 'moderate', temp: [24, 30], ph: [6.0, 7.5], size: 15 },
  { id: 'discus', name: 'Discus', sci: 'Symphysodon aequifasciatus', temperament: 'peaceful', care: 'hard', temp: [27, 31], ph: [6.0, 7.0], size: 15 },
  { id: 'oscar', name: 'Oscar', sci: 'Astronotus ocellatus', temperament: 'aggressive', care: 'hard', temp: [23, 28], ph: [6.0, 8.0], size: 30 },
]

function getSpecies(id) {
  return SPECIES.find((species) => species.id === id)
}

module.exports = { SPECIES, getSpecies }
