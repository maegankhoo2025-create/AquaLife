// Real-life advice for each tank condition, shown when the player taps a condition's title on the tank page. Keys match CONDITION_LIMITS in stores/game.js.

// raise / lower: what to do when the value is too low / too high.
// For water quality, "raise" means keeping the water clean and "lower" lists what makes it dirty, so players know what to avoid.

export const CARE_TIPS = {
  temperature: {
    why: 'Fish are cold-blooded. Water temperature affects how fast they eat, grow and fight disease. If it is too cold, they become sluggish and sick; if it is too warm, the water holds less oxygen.',
    raise: {
      title: 'How to raise the temperature',
      steps: [
        'Choose an adjustable aquarium heater with a thermostat. Follow the manufacturer’s guidance for your tank volume and room temperature.',
        'Place the heater near the filter outflow so the warm water spreads evenly through the tank.',
        'Use a lid to retain heat. Keep the tank away from air-conditioner vents and draughty windows.',
      ],
    },
    lower: {
      title: 'How to lower the temperature',
      steps: [
        'Check the thermometer and heater setting first. Adjust the thermostat gradually.',
        'Move the tank out of direct sunlight, and switch the tank light off for a few hours.',
        'Point a small fan across the surface. Evaporation cools the water by a degree or two; top up with dechlorinated water.',
        'Increase surface aeration in warm water. Avoid ice or very cold water, which can cause sudden local temperature changes.',
        'For tanks that run hot all year, an aquarium chiller keeps the temperature steady.',
      ],
    },
    check: 'Read the thermometer daily, ideally at the same time. Stick-on strips are cheap; digital probes are more accurate.',
    caution: 'Change temperature by only a degree or two a day. Sudden swings shock fish and can make them ill.',
  },

  ph: {
    why: 'pH measures acidity or alkalinity; 7 is neutral. Each species evolved in water with a particular pH. The wrong pH stresses fish and weakens their immune system.',
    raise: {
      title: 'How to raise the pH (more alkaline)',
      steps: [
        'Add crushed coral or aragonite to the filter or mix it into the gravel. It dissolves slowly and lifts pH gently.',
        'Use rocks such as limestone or Texas holey rock as decoration.',
        'Before using water changes to alter pH, test the replacement water and the tank’s carbonate hardness (KH).',
        'Avoid repeated chemical doses to chase a pH number. Get species-specific advice if your water is unsuitable.',
      ],
    },
    lower: {
      title: 'How to lower the pH (more acidic)',
      steps: [
        'Aquarium driftwood releases tannins that lower pH and give the water a tea colour.',
        'Indian almond (catappa) leaves work the same way.',
        'Put aquarium peat in a mesh bag inside the filter.',
        'Remove any limestone, shells or coral decorations, which push pH up.',
      ],
    },
    check: 'Test pH about once a week with a liquid kit, and more often after changes. Measure KH too: it controls buffering and affects how driftwood, leaves and coral work in your water.',
    caution: 'Keep pH stable instead of chasing a perfect number. Adjust it over several days; a fast swing is more harmful than a slightly-off value.',
  },

  waterQuality: {
    why: 'Fish waste and leftover food produce toxic ammonia as they break down. Helpful filter bacteria turn it into less harmful nitrate, which builds up until you remove it.',
    raise: {
      title: 'How to keep the water clean',
      steps: [
        'Change 10 to 25% of the water each week. Dechlorinate the replacement water and match its temperature to the tank.',
        'Use a gravel vacuum during water changes to suck waste out of the substrate.',
        'Rinse filter sponges in old tank water, not tap water. Chlorine in tap water kills the helpful bacteria.',
        'Add live plants. They absorb nitrate and compete with algae.',
      ],
    },
    lower: {
      title: 'What makes water quality drop',
      steps: [
        'Overfeeding. Give only what your fish finish in about two minutes, then remove leftovers.',
        'Overstocking. Too many fish produce more waste than the filter can handle.',
        'Rotting food, dead plants or a dead fish left in the tank.',
        'Skipping water changes or cleaning the filter too harshly.',
        'Adding fish before a new filter has cycled. Its bacteria take several weeks to build up.',
      ],
    },
    check: 'Real water quality has no single percentage. Use a liquid kit to test ammonia, nitrite and nitrate. Ammonia and nitrite should be 0; the nitrate limit depends on the species. Test regularly during fishless cycling and establish the biological filter before adding fish.',
    caution: 'Never replace all the water at once or scrub everything clean. That wipes out the helpful bacteria and can crash the tank.',
  },
}
