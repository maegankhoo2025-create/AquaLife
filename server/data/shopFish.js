// Catalogue identity and in-game pearl prices.
// Conditions and photos will be retrieved from the API.
// Existing fish IDs are preserved so current tanks still recognise them.

const fish = [
  ['neon-tetra', 'Neon Tetra', 'Paracheirodon innesi', 30],
  ['cardinal-tetra', 'Cardinal Tetra', 'Paracheirodon axelrodi', 40],
  ['ember-tetra', 'Ember Tetra', 'Hyphessobrycon amandae', 25],
  ['black-neon-tetra', 'Black Neon Tetra', 'Hyphessobrycon herbertaxelrodi', 30],
  ['glowlight-tetra', 'Glowlight Tetra', 'Hemigrammus erythrozonus', 30],
  ['black-skirt-tetra', 'Black Skirt Tetra', 'Gymnocorymbus ternetzi', 30],
  ['lemon-tetra', 'Lemon Tetra', 'Hyphessobrycon pulchripinnis', 35],
  ['serpae-tetra', 'Serpae Tetra', 'Hyphessobrycon eques', 35],
  ['diamond-tetra', 'Diamond Tetra', 'Moenkhausia pittieri', 45],
  ['x-ray-tetra', 'X-ray Tetra', 'Pristella maxillaris', 30],

  ['guppy', 'Guppy', 'Poecilia reticulata', 25],
  ['endler', "Endler's Livebearer", 'Poecilia wingei', 30],
  ['southern-platy', 'Southern Platy', 'Xiphophorus maculatus', 25],
  ['variatus-platy', 'Variatus Platy', 'Xiphophorus variatus', 25],
  ['swordtail', 'Green Swordtail', 'Xiphophorus hellerii', 35],
  ['common-molly', 'Common Molly', 'Poecilia sphenops', 30],
  ['sailfin-molly', 'Sailfin Molly', 'Poecilia latipinna', 40],

  ['zebra-danio', 'Zebra Danio', 'Danio rerio', 20],
  ['pearl-danio', 'Pearl Danio', 'Danio albolineatus', 25],
  ['celestial-pearl-danio', 'Celestial Pearl Danio', 'Danio margaritatus', 50],
  ['harlequin-rasbora', 'Harlequin Rasbora', 'Trigonostigma heteromorpha', 30],
  ['lambchop-rasbora', 'Lambchop Rasbora', 'Trigonostigma espei', 30],
  ['glowlight-rasbora', 'Glowlight Rasbora', 'Trigonostigma hengeli', 30],
  ['chili-rasbora', 'Chili Rasbora', 'Boraras brigittae', 40],
  ['scissortail-rasbora', 'Scissortail Rasbora', 'Rasbora trilineata', 35],

  ['tiger-barb', 'Tiger Barb', 'Puntigrus tetrazona', 35],
  ['cherry-barb', 'Cherry Barb', 'Puntius titteya', 30],
  ['rosy-barb', 'Rosy Barb', 'Pethia conchonius', 30],
  ['black-ruby-barb', 'Black Ruby Barb', 'Pethia nigrofasciata', 40],
  ['gold-barb', 'Gold Barb', 'Barbodes semifasciolatus', 30],

  ['corydoras', 'Peppered Cory', 'Corydoras paleatus', 45],
  ['bronze-cory', 'Bronze Cory', 'Corydoras aeneus', 40],
  ['panda-cory', 'Panda Cory', 'Corydoras panda', 50],
  ['pygmy-cory', 'Pygmy Cory', 'Corydoras pygmaeus', 45],
  ['bristlenose-pleco', 'Bristlenose Pleco', 'Ancistrus cirrhosus', 70],
  ['kuhli-loach', 'Kuhli Loach', 'Pangio kuhlii', 45],

  ['betta', 'Betta', 'Betta splendens', 60],
  ['honey-gourami', 'Honey Gourami', 'Trichogaster chuna', 45],
  ['dwarf-gourami', 'Dwarf Gourami', 'Trichogaster lalius', 50],
  ['pearl-gourami', 'Pearl Gourami', 'Trichopodus leerii', 60],
  ['sparkling-gourami', 'Sparkling Gourami', 'Trichopsis pumila', 40],

  ['angelfish', 'Angelfish', 'Pterophyllum scalare', 90],
  ['discus', 'Discus', 'Symphysodon aequifasciatus', 200],
  ['oscar', 'Oscar', 'Astronotus ocellatus', 150],
  ['german-blue-ram', 'German Blue Ram', 'Mikrogeophagus ramirezi', 80],
  ['bolivian-ram', 'Bolivian Ram', 'Mikrogeophagus altispinosus', 70],
  ['kribensis', 'Kribensis', 'Pelvicachromis pulcher', 65],

  ['goldfish', 'Goldfish', 'Carassius auratus', 40],
  ['medaka', 'Japanese Ricefish', 'Oryzias latipes', 35],
  ['dwarf-neon-rainbowfish', 'Dwarf Neon Rainbowfish', 'Melanotaenia praecox', 60],
]

module.exports = fish.map(([id, name, sci, price]) => ({
  id,
  name,
  sci,
  price,
  category: 'fish',
}))