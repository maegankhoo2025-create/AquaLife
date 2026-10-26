<script setup>
import { computed, useId } from 'vue'
import { fishAppearance } from '../data/fishAppearance'

// Line Fish Vectors by Agus Dahmiko, CC Attribution:
// https://www.svgrepo.com/collection/line-fish-vectors/
// Original profiles are preserved; flat colors reference photographed fish.
// Danio, barb and oscar remain stylized adaptations, not identification diagrams.
const props = defineProps({ speciesId: { type: String, default: '' } })
const fishPaths = {
  // https://www.svgrepo.com/svg/382478/fish-neon-water-animal-pet
  'neon-tetra': [
    'M10,25a3,3,0,1,0,3,3A3,3,0,0,0,10,25Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,10,29Z',
    'M15,28a1,1,0,0,0,0,2,1,1,0,0,1,0,2,1,1,0,0,0,0,2,3,3,0,0,0,0-6Z',
    'M52.87,20A3.21,3.21,0,0,0,50,19.71L42.84,22H37V19a1,1,0,0,0-1-1h-.5a4.49,4.49,0,0,0-4.45,4H12.2A10.2,10.2,0,0,0,2,32.2,5.8,5.8,0,0,0,7.8,38H27a1.1,1.1,0,0,0,.4-.08L33,35.47V36a1,1,0,0,0,2,0V34.59l8-3.52,6.86,2.21a3.3,3.3,0,0,0,1.19.22A3.17,3.17,0,0,0,52.87,33a2.43,2.43,0,0,0,1.13-2V22.06A2.43,2.43,0,0,0,52.87,20ZM35,20.05V22h-2A2.5,2.5,0,0,1,35,20.05ZM26.79,36H7.8A3.81,3.81,0,0,1,4,32.2,8.21,8.21,0,0,1,12.2,24H42v5.35ZM52,30.94a.49.49,0,0,1-.25.37,1.23,1.23,0,0,1-1.12.1l-.07,0L44,29.27V23.73l6.63-2.14a1.23,1.23,0,0,1,1.12.1.49.49,0,0,1,.25.37Z',
    'M38,26H16a1,1,0,0,0,0,2H38a1,1,0,0,0,0-2Z',
  ],
  // https://www.svgrepo.com/svg/382492/fish-gupy-animal-animals-pet-water
  guppy: [
    'M9,24a3,3,0,1,0,3,3A3,3,0,0,0,9,24Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,9,28Z',
    'M17,30a3,3,0,0,0-3-3,1,1,0,0,0,0,2,1,1,0,0,1,0,2,1,1,0,0,0,0,2A3,3,0,0,0,17,30Z',
    'M43,15a5,5,0,0,0-5,5v1H35.92A7,7,0,0,0,29,15a1,1,0,0,0-1,1v5H7a5,5,0,0,0-5,5,9,9,0,0,0,9,9H22v3a1,1,0,0,0,2,0V36.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L25.41,35H38v1a5,5,0,0,0,5,5A11,11,0,0,0,54,30V26A11,11,0,0,0,43,15ZM30,17.1A5,5,0,0,1,33.9,21H30ZM14,33H11a7,7,0,0,1-7-7,3,3,0,0,1,3-3H38V33Zm38-3a9,9,0,0,1-9,9,3,3,0,0,1-3-3V20a3,3,0,0,1,3-3,9,9,0,0,1,9,9Z',
  ],
  // https://www.svgrepo.com/svg/382485/catfish-animal-fish-fishing-pet-water
  corydoras: [
    'M52.25,21.44a3.41,3.41,0,0,0-3.5.08L46,23.22V22a1,1,0,0,0-1-1H24a4,4,0,0,0-8,0H11a7,7,0,0,0-3.69,1.06A1.07,1.07,0,0,0,7,22a3,3,0,0,1-3-3,1,1,0,0,0-2,0,5,5,0,0,0,3.46,4.73,7,7,0,0,0,0,8.54A5,5,0,0,0,2,37a1,1,0,0,0,2,0,3,3,0,0,1,3-3,1.07,1.07,0,0,0,.31-.06A7,7,0,0,0,11,35h5a4,4,0,0,0,8,0H37s0,.06,0,.09A3.91,3.91,0,0,0,40.91,39,4.09,4.09,0,0,0,45,34.91V32a1,1,0,0,0-.19-.56,7.51,7.51,0,0,0,.56-1.05l3.38,2.09a3.44,3.44,0,0,0,3.5.08,3.37,3.37,0,0,0,1.75-3V24.41A3.37,3.37,0,0,0,52.25,21.44ZM20,19a2,2,0,0,1,2,2H18A2,2,0,0,1,20,19ZM10,25a1,1,0,1,1-1,1A1,1,0,0,1,10,25Zm1,8a5,5,0,0,1-3.62-8.43A2.91,2.91,0,0,0,7,26a3,3,0,1,0,3.5-2.95A4.23,4.23,0,0,1,11,23H44v4.36A5.65,5.65,0,0,1,38.36,33H11Zm9,4a2,2,0,0,1-2-2h4A2,2,0,0,1,20,37Zm20.91,0A1.92,1.92,0,0,1,39,35.09S39,35,39,35a7.51,7.51,0,0,0,4-1.56v1.5A2.1,2.1,0,0,1,40.91,37ZM52,29.59a1.37,1.37,0,0,1-.73,1.22,1.44,1.44,0,0,1-1.47,0L46,28.42V25.58l3.8-2.36a1.44,1.44,0,0,1,1.47,0A1.37,1.37,0,0,1,52,24.41Z',
    'M18,29a3,3,0,0,0-3-3,1,1,0,0,0,0,2,1,1,0,0,1,0,2,1,1,0,0,0,0,2A3,3,0,0,0,18,29Z',
  ],
  // https://www.svgrepo.com/svg/382480/fish-golden-animal-pet-water
  goldfish: [
    'M7,31a3,3,0,1,0-3-3A3,3,0,0,0,7,31Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,7,27Z',
    'M12,28a1,1,0,0,0,0,2,1,1,0,0,1,0,2,1,1,0,0,0,0,2,3,3,0,0,0,0-6Z',
    'M46.92,42.06a17.73,17.73,0,0,1,0-28.12l6.69-5.15A1,1,0,0,0,53,7H47A21,21,0,0,0,28,19.11V19a11,11,0,0,0-22-.38A13,13,0,0,0,21.65,39.15,5,5,0,0,0,26.5,43a1,1,0,0,0,0-2,3,3,0,0,1-3-3,.9.9,0,0,0,0-.16,13.11,13.11,0,0,0,3.29-4.33A21,21,0,0,0,47,49h6a1,1,0,0,0,.61-1.79ZM17,10a9,9,0,0,1,9,9v2.1A12.93,12.93,0,0,0,8.26,16.91,9,9,0,0,1,17,10ZM15,39A11,11,0,1,1,26,28,11,11,0,0,1,15,39Zm32,8A19,19,0,0,1,47,9h3.06L45.7,12.36a19.72,19.72,0,0,0,0,31.28L50.06,47Z',
  ],
  // https://www.svgrepo.com/svg/382486/betta-fish-halfmoon-animal-pet-water
  betta: [
    'M12,27c0-1.7-1.3-3-3-3s-3,1.3-3,3s1.3,3,3,3S12,28.7,12,27z M9,28c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S9.6,28,9,28z',
    'M14,30c-0.6,0-1,0.4-1,1s0.4,1,1,1c1.7,0,3-1.3,3-3s-1.3-3-3-3c-0.6,0-1,0.4-1,1s0.4,1,1,1c0.6,0,1,0.4,1,1S14.6,30,14,30z',
    'M35,9h-7c-3.3,0-6,2.7-6,6v6H11c-5,0-9,4-9,9c0,2.8,2.3,5,5,5h3.5l-3.5,8.6c-0.2,0.5,0,1.1,0.6,1.3C7.8,45,7.9,45,8,45c0.4,0,0.8-0.2,0.9-0.6l3.1-7.7l3.1,7.7c0.2,0.4,0.5,0.6,0.9,0.6c0.1,0,0.2,0,0.4-0.1c0.5-0.2,0.8-0.8,0.6-1.3L13.5,35H18v6c0,3.3,2.7,6,6,6h11c10.5,0,19-8.5,19-19S45.5,9,35,9z M24,15c0-2.2,1.8-4,4-4h6v10H24V15z M4,30c0-3.9,3.1-7,7-7h12h11v10H19h-7c0,0,0,0,0,0H7C5.4,33,4,31.6,4,30z M20,41v-6h14v10H24C21.8,45,20,43.2,20,41z M36,45V34V22V11c8.9,0.5,16,7.9,16,17S44.9,44.5,36,45z',
  ],
  // https://www.svgrepo.com/svg/382491/angel-fish-angelfish-animal-fish-pet-water
  angelfish: [
    'M14,25a3,3,0,1,0,3,3A3,3,0,0,0,14,25Zm0,4a1,1,0,1,1,1-1A1,1,0,0,1,14,29Z',
    'M19,28a1,1,0,0,0,0,2,1,1,0,1,1,0,2,1,1,0,0,0,0,2,3,3,0,1,0,0-6Z',
    'M44.47,17.12a1,1,0,0,0-1,.05L33,24.13V4a1,1,0,0,0-.62-.92,1,1,0,0,0-1.09.21l-24,24a1,1,0,0,0,0,1.42l24,24A1,1,0,0,0,32,53a.84.84,0,0,0,.38-.08A1,1,0,0,0,33,52V31.87l10.45,7A1,1,0,0,0,45,38V18A1,1,0,0,0,44.47,17.12ZM31,49.59,9.41,28,31,6.41V49.59ZM43,36.13,33,29.46V26.54l10-6.67Z',
  ],
  // https://www.svgrepo.com/svg/382483/discus-fish-animal-animals-pet-water
  discus: [
    'M7,31a3,3,0,1,0-3-3A3,3,0,0,0,7,31Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,7,27Z',
    'M12,32a1,1,0,0,0,0,2,3,3,0,0,0,0-6,1,1,0,0,0,0,2,1,1,0,0,1,0,2Z',
    'M53.53,19.15a1,1,0,0,0-1,0l-8.84,4.43,6.09-8.21a1,1,0,0,0,.18-.79,1,1,0,0,0-.46-.66L34.2,4.59A15.17,15.17,0,0,0,21.63,2.53a17.91,17.91,0,0,0-11.38,8.82,20.93,20.93,0,0,0,0,33.3,18,18,0,0,0,11.38,8.82A16.73,16.73,0,0,0,25.8,54a14.5,14.5,0,0,0,8.35-2.56l15.37-9.31a1,1,0,0,0,.28-1.45l-6.09-8.21,8.84,4.42A1,1,0,0,0,53,37a1,1,0,0,0,.53-.15A1,1,0,0,0,54,36V20A1,1,0,0,0,53.53,19.15ZM22.12,4.47a13.24,13.24,0,0,1,11,1.79L47.54,15l-4.66,6.28A21,21,0,0,0,14.63,8.75,16.24,16.24,0,0,1,22.12,4.47ZM4,28a19,19,0,0,1,7.57-15.14l.11-.08A19,19,0,1,1,23,47a18.85,18.85,0,0,1-11.32-3.78l-.11-.08A19,19,0,0,1,4,28ZM33.06,49.77a13.2,13.2,0,0,1-10.94,1.76,16.24,16.24,0,0,1-7.49-4.28A21,21,0,0,0,42.88,34.71L47.54,41ZM52,34.38l-8-4V25.62l8-4Z',
    'M17,34h6a5,5,0,0,0,5-5,1,1,0,0,0-1-1H17a1,1,0,0,0-1,1v4A1,1,0,0,0,17,34Zm1-4h7.83A3,3,0,0,1,23,32H18Z',
  ],
}
const species = computed(() =>
  fishAppearance[props.speciesId] ? props.speciesId : 'neon-tetra'
)
const appearance = computed(() => fishAppearance[species.value])

const profile = computed(() => appearance.value.shape)

const paths = computed(() => fishPaths[profile.value])

const transform = computed(() => {
   const height = appearance.value.height
  return height === 1 ? null : `translate(0 ${28 * (1 - height)}) scale(1 ${height})`
})

// These interior boundaries follow the openings in the original line artwork.
const interiors = {
  'neon-tetra': {
    body: 'M26.79 36H7.8A3.81 3.81 0 0 1 4 32.2 8.21 8.21 0 0 1 12.2 24H42v5.35Z',
    fins: 'M35 20.05V22h-2A2.5 2.5 0 0 1 35 20.05ZM52 30.94a.49.49 0 0 1-.25.37 1.23 1.23 0 0 1-1.12.1l-.07 0L44 29.27V23.73l6.63-2.14a1.23 1.23 0 0 1 1.12.1.49.49 0 0 1 .25.37Z',
  },
  guppy: {
    body: 'M14 33H11a7 7 0 0 1-7-7 3 3 0 0 1 3-3H38V33Z',
    fins: 'M30 17.1A5 5 0 0 1 33.9 21H30ZM52 30a9 9 0 0 1-9 9 3 3 0 0 1-3-3V20a3 3 0 0 1 3-3 9 9 0 0 1 9 9Z',
  },
  corydoras: {
    body: 'M11 33a5 5 0 0 1-3.62-8.43A2.91 2.91 0 0 0 7 26a3 3 0 1 0 3.5-2.95A4.23 4.23 0 0 1 11 23H44v4.36A5.65 5.65 0 0 1 38.36 33Z',
    fins: 'M20 19a2 2 0 0 1 2 2H18a2 2 0 0 1 2-2ZM20 37a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2ZM40.91 37A1.92 1.92 0 0 1 39 35.09V35a7.51 7.51 0 0 0 4-1.56v1.5a2.1 2.1 0 0 1-2.09 2.06ZM52 29.59a1.37 1.37 0 0 1-.73 1.22 1.44 1.44 0 0 1-1.47 0L46 28.42V25.58l3.8-2.36a1.44 1.44 0 0 1 1.47 0A1.37 1.37 0 0 1 52 24.41Z',
  },
  goldfish: {
    body: 'M15 39A11 11 0 1 1 26 28 11 11 0 0 1 15 39Z',
    fins: 'M17 10a9 9 0 0 1 9 9v2.1A12.93 12.93 0 0 0 8.26 16.91 9 9 0 0 1 17 10ZM47 47A19 19 0 0 1 47 9h3.06l-4.36 3.36a19.72 19.72 0 0 0 0 31.28L50.06 47Z',
  },
  betta: {
    body: 'M4 30c0-3.9 3.1-7 7-7h23v10H7c-1.6 0-3-1.4-3-3Z',
    fins: 'M24 15c0-2.2 1.8-4 4-4h6v10H24ZM20 41v-6h14v10H24c-2.2 0-4-1.8-4-4ZM36 45V11c8.9.5 16 7.9 16 17s-7.1 16.5-16 17Z',
  },
  angelfish: {
    body: 'M31 49.59 9.41 28 31 6.41Z',
    fins: 'M43 36.13 33 29.46V26.54l10-6.67Z',
  },
  discus: {
    body: 'M4 28a19 19 0 0 1 7.57-15.14l.11-.08A19 19 0 1 1 23 47a18.85 18.85 0 0 1-11.32-3.78l-.11-.08A19 19 0 0 1 4 28Z',
    fins: 'M22.12 4.47a13.24 13.24 0 0 1 11 1.79L47.54 15l-4.66 6.28A21 21 0 0 0 14.63 8.75a16.24 16.24 0 0 1 7.49-4.28ZM33.06 49.77a13.2 13.2 0 0 1-10.94 1.76 16.24 16.24 0 0 1-7.49-4.28A21 21 0 0 0 42.88 34.71L47.54 41ZM52 34.38l-8-4V25.62l8-4Z',
  },
}

const palette = computed(() => appearance.value)
const interior = computed(() => interiors[profile.value])
const markings = {
  'neon-tetra': [
    { d: 'M23 30H40L26.79 36H23Z', fill: '#d83d3b' },
    { d: 'M15 24H40v4H15Z', fill: '#3ac4d2' },
  ],
  'zebra-danio': [
    { d: 'M17 24H41v1.5H17ZM17 29H39l-3.4 1.5H17ZM19 33H30l-3.2 1.5H19ZM45 24.5l6-2v1.5l-6 2ZM45 27l6 2v1.5l-6-2Z', fill: '#284958' },
  ],
  guppy: [
    { d: 'M20 25.5 29 24v3l-7 2-3-1ZM42 31l8 1-1.5 3.5-7-2Z', fill: '#dd9a2e' },
    { d: 'M42 28l9 1v2l-9-1ZM44 35l4 1-3 2-3-1Z', fill: '#344e53' },
    { d: 'M18 30h10v1.5H18ZM40.5 23l7-3 1.5 1.5-8.5 3Z', fill: '#819aa4' },
  ],
  corydoras: [
    { d: 'M20 24h4v2h-4ZM29 24h3l1 2h-4ZM37 24h4v2h-4ZM22 29h4v2h-4ZM31 28h4v3h-4ZM17 30h2v2h-2ZM38 28h3v2h-3ZM26 27h2v1.5h-2ZM48 25h2v1.5h-2ZM49 28h2v1h-2Z', fill: '#576553' },
    { d: 'M19 32h16l-1 1H19Z', fill: '#ddd4b1' },
  ],
  goldfish: [
    { d: 'M13 20c4-2 9 1 11 5-5-2-8-2-11-1Z', fill: '#ffc656' },
    { d: 'M9 34c5 2 10 2 14-2-2 5-9 7-14 2Z', fill: '#e67d23' },
    { d: 'M31 23 43 14l-3 6-9 6ZM31 30l10 7 3 6-13-10Z', fill: '#f9af42' },
  ],
  betta: [
    { d: 'M18 24h14v2H18ZM20 30h12v2H20Z', fill: '#e46d3c' },
    { d: 'M25 17l7-4v3l-7 3ZM23 38l9 4v2l-9-4ZM38 16l7 3 2 3-9-4ZM38 25l12 1v2l-12-1ZM38 33l12-2-1 3-11 2ZM38 40l8-3-2 3-6 2Z', fill: '#f1843b' },
  ],
  angelfish: [
    { d: 'M17 20.4l3-3V38.6l-3-3ZM25 12.4l4-4V47.6l-4-4ZM38 23.2l2-1.3v12.2l-2-1.3Z', fill: '#475653' },
    { d: 'M23 16l7-7v7Z', fill: '#ac9863' },
  ],
  discus: [
    { d: 'M13 17c7-6 14 3 24-1M12 22c9-6 14 3 26-1M17 27c7-5 12 3 22-1M17 37c8-6 11 3 19-1M13 41c8-5 14 3 18-1M20 12l7-1M20 44l6 1', fill: 'none', stroke: '#5b6653' },
    { d: 'M22 5l6 3M32 7l6 7M24 51l6-5M34 49l5-8M46 25v6M49 24v8', fill: 'none', stroke: '#69775b' },
  ],
  'tiger-barb': [
    { d: 'M10 16l3-3v30l-3-3ZM21 9h4l-2 37h-4ZM32 12l4 3-4 29-4 2ZM45 25l3-1v8l-3-1Z', fill: '#34423a' },
    { d: 'M24 5l7 2 6 7-9-5ZM26 50l8-7 5-1-8 8Z', fill: '#ce7741' },
  ],
  oscar: [
    { d: 'M16 15l7 3-2 4 4 4-3 4-3-2 2-4-4-3ZM28 13l4 2-1 5 5 3-2 3-5-4-2-5ZM11 33l5 2 2 5 7-3 3 3-6 4-6-1-3-5ZM28 31l4-3 3 3-3 5-4-1ZM38 17l2 3-1 4-3-2Z', fill: '#e58339' },
    { d: 'M46 25l4-2v3l-4 1ZM46 29l4 1v3l-4-2Z', fill: '#d67335' },
  ],
}
const eye = computed(() => ({
  'neon-tetra': [10, 28], guppy: [9, 27], corydoras: [10, 26],
  goldfish: [7, 28], betta: [9, 27], angelfish: [14, 28], discus: [7, 28],
})[profile.value])

// Each rendered fish needs its own SVG clipping ID.
const bodyClipId = `fish-body-${useId()}`

// Reusable markings, clipped to the chosen fish's body.
const patternPaths = {
  plain: [],

  stripe: [
    'M5 26H44V29H5Z',
  ],

  stripes: [
    'M5 23H44V25H5Z',
    'M5 29H44V31H5Z',
    'M5 35H44V37H5Z',
  ],

  bands: [
    'M12 5H16V50H12Z',
    'M23 5H27V50H23Z',
    'M34 5H38V50H34Z',
  ],

  spot: [
    'M32 28a4 4 0 1 0-8 0a4 4 0 1 0 8 0',
  ],

  spots: [
    'M16 25h2v2h-2Z',
    'M23 29h2v2h-2Z',
    'M30 24h2v2h-2Z',
    'M36 29h2v2h-2Z',
    'M19 34h2v2h-2Z',
    'M29 37h2v2h-2Z',
    'M20 18h2v2h-2Z',
    'M31 16h2v2h-2Z',
  ],

  wedge: [
    'M26 27L42 23L39 34Z',
  ],

  tail: [
    'M36 5H41V50H36Z',
  ],

  panda: [
    'M8 18H13V36H8Z',
    'M35 18H41V38H35Z',
  ],

  belly: [
    'M12 30Q26 25 39 31L37 43H12Z',
  ],
}

const displayMarkings = computed(() => {
  // Preserve the original fish's existing detailed markings.
  const existing = markings[species.value]
  if (existing) return existing

  const pattern = patternPaths[appearance.value.pattern] ?? []

  return pattern.map(d => ({
    d,
    fill: appearance.value.accent,
  }))
})
</script>

<template>
  <svg class="fish-icon" viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
    <defs>
       <clipPath :id="bodyClipId" clipPathUnits="userSpaceOnUse">
        <path :d="interior.body" />
       </clipPath>
    </defs>
    <g :transform="transform">
      <path :d="interior.fins" :fill="palette.fins" />
      <path :d="interior.body" :fill="palette.body" />
      <g :clip-path="markings[species] ? null : `url(#${bodyClipId})`">
  <path
    v-for="(mark, index) in displayMarkings"
    :key="`mark-${index}`"
    :d="mark.d"
    :fill="mark.fill"
    :stroke="mark.stroke"
    stroke-width="1.4"
    stroke-linecap="round"
  />
</g>
      <g fill="#182f34">
        <path v-for="(path, index) in paths" :key="index" :d="path"
          :fill="species === 'neon-tetra' && index === 3 ? '#3ac4d2' : undefined" />
      </g>
      <g fill="none" stroke="#182f34" stroke-width="1.6" stroke-linecap="round">
        <path v-if="species === 'zebra-danio'" d="M19 30h20M19 33h13M45 25l6-2M45 28l6 2" />
        <path v-if="species === 'tiger-barb'" d="M17 12l-2 12M26 10l-2 14M35 16l-2 10M17 36l-1 7M26 37l-1 9M35 34l-1 8" />
      </g>
      <g v-if="species === 'oscar'" fill="none" stroke="#e58339" stroke-width="1.6" stroke-linecap="round">
        <circle cx="36" cy="27" r="3" />
        <path d="M18 17l3 2M27 17l2 3M30 39l3-2M13 37l2 2" />
      </g>
      <circle :cx="eye[0]" :cy="eye[1]" r="1.3" :fill="species === 'discus' ? '#d48155' : '#f6edcf'" />
      <circle :cx="eye[0]" :cy="eye[1]" r=".65" fill="#182f34" />
    </g>
  </svg>
</template>

<style scoped>
.fish-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
