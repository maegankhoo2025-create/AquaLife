// Real-life advice for each tank condition, shown when the player taps a condition's
// info button on the tank page. Keys match CONDITION_LIMITS in stores/game.js.
//
// Each step has a short "tip" (shown in bold, easy to scan) and one sentence of "detail".
// raise / lower: what to do when the value is too low / too high.
// For water quality, "lower" lists what makes the water dirty, so players know what to avoid.

export const CARE_TIPS = {
  temperature: {
    why: 'Fish are cold-blooded. Too cold and they get sluggish and sick; too warm and the water holds less oxygen.',
    raise: {
      title: 'Too cold? Warm it up',
      steps: [
        { tip: 'Use a heater with a thermostat', detail: 'Pick one sized for your tank volume.' },
        { tip: 'Place it near the filter outflow', detail: 'The moving water spreads the heat evenly.' },
        { tip: 'Keep a lid on', detail: 'Keep the tank away from air-con vents and draughty windows.' },
      ],
    },
    lower: {
      title: 'Too warm? Cool it down',
      steps: [
        { tip: 'Turn the heater down', detail: 'Check the thermometer and thermostat first.' },
        { tip: 'Block the sun and lights', detail: 'Move the tank out of sunlight; switch the light off for a few hours.' },
        { tip: 'Blow a fan across the water', detail: 'Evaporation cools by a degree or two. Top up with dechlorinated water.' },
        { tip: 'No ice cubes', detail: 'Very cold water causes sudden swings. Use a chiller for tanks that are always hot.' },
      ],
    },
    check: 'Read the thermometer every day, at the same time.',
    caution: 'Change the temperature by only 1–2°C a day. Sudden swings shock fish.',
  },

  ph: {
    why: 'pH measures how acidic (below 7) or alkaline (above 7) the water is. The wrong pH stresses fish and weakens them.',
    raise: {
      title: 'pH too low? Raise it',
      steps: [
        { tip: 'Add crushed coral', detail: 'Put it in the filter or gravel. It dissolves slowly and lifts pH gently.' },
        { tip: 'Use limestone-type rocks', detail: 'Texas holey rock or limestone decorations push pH up.' },
        { tip: 'Test your tap water first', detail: 'Check its pH and hardness (KH) before using water changes to adjust.' },
      ],
    },
    lower: {
      title: 'pH too high? Lower it',
      steps: [
        { tip: 'Add driftwood', detail: 'It releases tannins that lower pH and tint the water like tea.' },
        { tip: 'Add Indian almond leaves', detail: 'They work the same way as driftwood.' },
        { tip: 'Remove shells and coral', detail: 'Limestone, shells and coral push pH up.' },
      ],
    },
    check: 'Test pH about once a week with a liquid test kit, and more often after changes.',
    caution: 'Keep pH steady. Change it slowly over several days; a fast swing is worse than a slightly-off value.',
  },

  waterQuality: {
    why: 'Fish waste and leftover food break down into toxic ammonia. Filter bacteria turn it into nitrate, which you remove with water changes.',
    raise: {
      title: 'Dirty water? Clean it up',
      steps: [
        { tip: 'Change 10–25% of the water weekly', detail: 'Dechlorinate the new water and match its temperature.' },
        { tip: 'Vacuum the gravel', detail: 'Suck out waste during water changes.' },
        { tip: 'Run a filter', detail: 'Rinse the sponge in old tank water, never tap water.' },
        { tip: 'Add live plants', detail: 'They absorb nitrate and compete with algae.' },
      ],
    },
    lower: {
      title: 'What makes water dirty',
      steps: [
        { tip: 'Overfeeding', detail: 'Feed only what fish finish in about two minutes.' },
        { tip: 'Too many fish', detail: 'More fish make more waste than the filter can handle.' },
        { tip: 'Rotting leftovers', detail: 'Remove uneaten food, dead plants and dead fish.' },
        { tip: 'Skipping water changes', detail: 'Or scrubbing the filter too hard, which kills good bacteria.' },
      ],
    },
    check: 'Test ammonia, nitrite and nitrate with a liquid kit. Ammonia and nitrite should be 0.',
    caution: 'Never replace all the water at once. That wipes out the helpful bacteria.',
  },
}
