// Stylised game illustrations, not scientific identification diagrams.
// Related fish reuse suitable SVG shapes with different colours and markings.
//
// Each row contains:
// id, shape, body colour, fin colour, marking colour, pattern, body height
//
// Body height: 1 = original; smaller values create a slimmer silhouette.

const appearances = [
  // Tetras
  ['neon-tetra', 'neon-tetra', '#d5e2cd', '#a4b8a4', '#3ac4d2', 'stripe', 1],
  ['cardinal-tetra', 'neon-tetra', '#d93e47', '#9cbfc5', '#35c9ef', 'stripe', 1],
  ['ember-tetra', 'neon-tetra', '#f28a38', '#e9a15c', '#d95c29', 'plain', 1],
  ['black-neon-tetra', 'neon-tetra', '#c6c8ad', '#a7b3a1', '#283d39', 'stripe', 1],
  ['glowlight-tetra', 'neon-tetra', '#e2c9b4', '#ccb9a8', '#f47738', 'stripe', 1],
  ['black-skirt-tetra', 'discus', '#aab8b9', '#64777a', '#34454a', 'bands', 0.8],
  ['lemon-tetra', 'discus', '#e8d86e', '#dcc54c', '#454e37', 'tail', 0.7],
  ['serpae-tetra', 'discus', '#df674b', '#bc483c', '#343d36', 'spot', 0.7],
  ['diamond-tetra', 'discus', '#cadad8', '#b1a5c4', '#f3eee2', 'spots', 0.7],
  ['x-ray-tetra', 'discus', '#dce0c8', '#e7c65b', '#334642', 'tail', 0.7],

  // Livebearers
  ['guppy', 'guppy', '#c4d0b6', '#a7b9ad', '#dd9a2e', 'spots', 1],
  ['endler', 'guppy', '#c9d29a', '#ef994b', '#334e43', 'spots', 0.85],
  ['southern-platy', 'guppy', '#ed9343', '#dc7135', '#b95330', 'plain', 1],
  ['variatus-platy', 'guppy', '#e8c95f', '#df7350', '#40504b', 'spots', 1],
  ['swordtail', 'guppy', '#a9b98c', '#d18347', '#526f50', 'stripe', 0.85],
  ['common-molly', 'guppy', '#465152', '#303c40', '#82938e', 'plain', 1],
  ['sailfin-molly', 'guppy', '#b4c3b1', '#d5bd70', '#526c61', 'spots', 1],

  // Danios and rasboras
  ['zebra-danio', 'neon-tetra', '#e0dfb4', '#aaba9e', '#284958', 'stripes', 1],
  ['pearl-danio', 'neon-tetra', '#c6c8dc', '#b5bdd2', '#eda976', 'stripe', 0.9],
  ['celestial-pearl-danio', 'neon-tetra', '#486e7b', '#dc7954', '#ead6a0', 'spots', 0.9],
  ['harlequin-rasbora', 'neon-tetra', '#dfa67f', '#ce8465', '#30464a', 'wedge', 1],
  ['lambchop-rasbora', 'neon-tetra', '#e79659', '#ce8d68', '#354440', 'wedge', 0.9],
  ['glowlight-rasbora', 'neon-tetra', '#ddc7a5', '#bba88e', '#dc8538', 'wedge', 0.85],
  ['chili-rasbora', 'neon-tetra', '#df5145', '#c5443c', '#35423c', 'stripe', 0.8],
  ['scissortail-rasbora', 'neon-tetra', '#c4d4d0', '#a4b8b3', '#344b4b', 'tail', 0.8],

  // Barbs
  ['tiger-barb', 'discus', '#e4cb7e', '#d99750', '#34423a', 'bands', 0.82],
  ['cherry-barb', 'neon-tetra', '#cd5b50', '#b84740', '#603f38', 'stripe', 1],
  ['rosy-barb', 'discus', '#e9977f', '#d47563', '#4e4c43', 'spot', 0.65],
  ['black-ruby-barb', 'discus', '#a85965', '#6d4b59', '#303a3f', 'bands', 0.75],
  ['gold-barb', 'neon-tetra', '#e2c15b', '#d79a49', '#49624c', 'spots', 1],

  // Bottom dwellers
  ['corydoras', 'corydoras', '#b8be94', '#8f9978', '#576553', 'spots', 1],
  ['bronze-cory', 'corydoras', '#a49869', '#93855d', '#586954', 'stripe', 1],
  ['panda-cory', 'corydoras', '#e7dfbf', '#c9c3a5', '#34423e', 'panda', 1],
  ['pygmy-cory', 'corydoras', '#ced0b9', '#aeb8a5', '#44564e', 'stripe', 0.8],
  ['bristlenose-pleco', 'corydoras', '#766d50', '#625d46', '#d2bc84', 'spots', 0.85],
  ['kuhli-loach', 'corydoras', '#e1b774', '#c89d67', '#4b4039', 'bands', 0.45],

  // Bettas and gouramis
  ['betta', 'betta', '#f58b4e', '#d94b25', '#f1843b', 'stripes', 1],
  ['honey-gourami', 'discus', '#e6b64c', '#d89b36', '#655333', 'stripe', 0.65],
  ['dwarf-gourami', 'discus', '#7fb8c7', '#d97757', '#d66b4f', 'bands', 0.75],
  ['pearl-gourami', 'discus', '#a8b5a0', '#af926d', '#eee2bc', 'spots', 0.7],
  ['sparkling-gourami', 'discus', '#b9ad8a', '#829e9a', '#56aeb0', 'spots', 0.6],

  // Cichlids
  ['angelfish', 'angelfish', '#c3ceca', '#99aaa0', '#475653', 'bands', 1],
  ['discus', 'discus', '#80c4b9', '#58ada9', '#5b6653', 'stripes', 1],
  ['oscar', 'discus', '#62615d', '#454d51', '#e58339', 'spots', 0.65],
  ['german-blue-ram', 'discus', '#d6c16d', '#8abbb0', '#40534c', 'spot', 0.7],
  ['bolivian-ram', 'discus', '#c9b58a', '#c48269', '#48564d', 'spot', 0.75],
  ['kribensis', 'discus', '#b9b785', '#b78e60', '#974f73', 'belly', 0.65],

  // Other species
  ['goldfish', 'goldfish', '#f7a51d', '#e78324', '#ffc656', 'plain', 1],
  ['medaka', 'neon-tetra', '#e4d5b0', '#d2c2a1', '#c69a56', 'stripe', 0.8],
  ['dwarf-neon-rainbowfish', 'discus', '#76bacf', '#d86653', '#a4dce4', 'stripe', 0.75],
]

export const fishAppearance = Object.fromEntries(
  appearances.map(
    ([id, shape, body, fins, accent, pattern, height]) => [
      id,
      {
        shape,
        body,
        fins,
        accent,
        pattern,
        height,
      },
    ],
  ),
)