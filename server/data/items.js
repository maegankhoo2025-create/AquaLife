// Everything sold in the shop, with prices.
// Copied from client/src/data/mock.js (ITEMS). Fish care ranges live in species.js.

const { EQUIPMENT } = require('./equipment')

const ITEMS = [
  { id: 'neon-tetra', category: 'fish', name: 'Neon Tetra', price: 30 },
  { id: 'guppy', category: 'fish', name: 'Guppy', price: 25 },
  { id: 'corydoras', category: 'fish', name: 'Peppered Cory', price: 45 },
  { id: 'zebra-danio', category: 'fish', name: 'Zebra Danio', price: 20 },
  { id: 'goldfish', category: 'fish', name: 'Goldfish', price: 40 },
  { id: 'betta', category: 'fish', name: 'Betta', price: 60 },
  { id: 'tiger-barb', category: 'fish', name: 'Tiger Barb', price: 35 },
  { id: 'angelfish', category: 'fish', name: 'Angelfish', price: 90 },
  { id: 'discus', category: 'fish', name: 'Discus', price: 200 },
  { id: 'oscar', category: 'fish', name: 'Oscar', price: 150 },
  { id: 'java-fern', category: 'plant', name: 'Java Fern', price: 15 },
  { id: 'anubias', category: 'plant', name: 'Anubias', price: 18 },
  { id: 'amazon-sword', category: 'plant', name: 'Amazon Sword', price: 22 },
  { id: 'java-moss', category: 'plant', name: 'Java Moss', price: 12 },
  { id: 'driftwood', category: 'decor', name: 'Driftwood', price: 35 },
  { id: 'almond-leaves', category: 'decor', name: 'Indian Almond Leaves', price: 10 },
  { id: 'crushed-coral', category: 'decor', name: 'Crushed Coral', price: 20 },
  { id: 'rock-cave', category: 'decor', name: 'Rock Cave', price: 40 },
  { id: 'castle', category: 'decor', name: 'Sunken Castle', price: 80 },
  { id: 'treasure-chest', category: 'decor', name: 'Treasure Chest', price: 60 },
  ...EQUIPMENT,
]

const ITEMS_BY_ID = new Map(ITEMS.map((item) => [item.id, item]))

function getItem(id) {
  return ITEMS_BY_ID.get(id)
}

module.exports = { ITEMS, getItem }
