// Real-life advice for each tank condition, shown when the player taps a condition's title on the tank page. Keys match CONDITION_LIMITS in stores/game.js.

// raise / lower: what to do when the value is too low / too high.
// For water quality, "raise" means keeping the water clean and "lower" lists what makes it dirty, so players know what to avoid.

export const CARE_TIPS = {
  temperature: {
    why: 'Fish are cold-blooded, so the water temperature sets how fast they eat, grow and fight off disease. Too cold and they become sluggish and sick; too warm and the water holds less oxygen.',
    raise: {
      title: 'How to raise the temperature',
      steps: [
        'Use an adjustable aquarium heater with a thermostat, sized for the tank volume and room temperature using the manufacturer’s guidance.',
        'Place the heater near the filter outflow so the warm water spreads evenly through the tank.',
        'Keep a lid on the tank to hold in heat, and keep the tank away from air-conditioner vents and draughty windows.',
      ],
    },
    lower: {
      title: 'How to lower the temperature',
      steps: [
        'Check the thermometer and heater setting first; adjust the thermostat gradually rather than making abrupt changes.',
        'Move the tank out of direct sunlight, and switch the tank light off for a few hours.',
        'Point a small fan across the water surface. Evaporation cools the water by a degree or two (top up the lost water with dechlorinated water).',
        'Improve surface aeration in warm water. Avoid adding ice or very cold water, which can cause sudden local temperature changes.',
        'For tanks that run hot all year, an aquarium chiller keeps the temperature steady.',
      ],
    },
    check: 'Check a thermometer every day, ideally at the same time. A stick-on strip thermometer is cheap; a digital probe is more accurate.',
    caution: 'Change the temperature slowly, by only a degree or two a day. Sudden swings shock fish and can make them ill.',
  },

  ph: {
    why: 'pH measures how acidic or alkaline the water is (7 is neutral). Each species evolved in water with a certain pH, and the wrong value stresses fish and weakens their immune system.',
    raise: {
      title: 'How to raise the pH (more alkaline)',
      steps: [
        'Add crushed coral or aragonite to the filter or mix it into the gravel. It dissolves slowly and lifts pH gently.',
        'Use rocks such as limestone or Texas holey rock as decoration.',
        'Test the replacement water and the tank’s carbonate hardness (KH) before using water changes to alter pH.',
        'Do not chase a pH number with repeated chemical doses. Get species-specific advice if the water is unsuitable.',
      ],
    },
    lower: {
      title: 'How to lower the pH (more acidic)',
      steps: [
        'Add aquarium driftwood. It releases tannins that lower pH and tint the water a natural tea colour.',
        'Add Indian almond (catappa) leaves, which work the same way.',
        'Put aquarium peat in a mesh bag inside the filter.',
        'Remove any limestone, shells or coral decorations, which push pH up.',
      ],
    },
    check: 'Test pH about once a week with a liquid test kit. Also measure KH, which controls buffering: driftwood, leaves and coral may act differently depending on your water. Test more often after changing anything.',
    caution: 'A stable pH matters more than a perfect number. Change it gradually over several days; a fast swing harms fish more than a slightly-off value.',
  },

  waterQuality: {
    why: 'Fish waste and leftover food break down into ammonia, which is toxic. Helpful bacteria in the filter turn it into less harmful nitrate, but nitrate still builds up until you remove it.',
    raise: {
      title: 'How to keep the water clean',
      steps: [
        'Change 10–25% of the water every week. Treat the new water with a dechlorinator and match its temperature to the tank.',
        'Use a gravel vacuum during water changes to suck waste out of the substrate.',
        'Rinse filter sponges in old tank water, not tap water. Chlorine in tap water kills the helpful bacteria.',
        'Add live plants. They absorb nitrate and compete with algae.',
      ],
    },
    lower: {
      title: 'What makes water quality drop',
      steps: [
        'Overfeeding: give only what your fish finish in about two minutes, and scoop out leftovers.',
        'Overstocking: more fish means more waste than the filter can handle.',
        'Rotting food, dead plants or a dead fish left in the tank.',
        'Skipping water changes or cleaning the filter too harshly.',
        'Adding fish to a new tank before the filter has been cycled (built up its bacteria), which takes several weeks.',
      ],
    },
    check: 'A real tank has no single water-quality percentage. Test ammonia, nitrite and nitrate with a liquid kit: ammonia and nitrite should be 0, and nitrate needs a species-appropriate limit. During fishless cycling, test regularly and establish the biological filter before adding fish.',
    caution: 'Never replace all the water at once or scrub everything clean. That wipes out the helpful bacteria and can crash the tank.',
  },
}
