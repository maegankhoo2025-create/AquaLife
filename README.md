# AquaLife
WAD 2 Project

The entry page starts with login and links to signup. Registration signs the user in, and both normally open the dashboard; a friend invitation returns to its acceptance screen after authentication.

## Aquarium and learning

- Create and select multiple tanks, and save private fish nicknames and care notes.
- Condition titles explain real-world care according to actual readings. Sliders save separate targets: heater/cooler actions move temperature by up to 1°C, and partial water changes improve quality by up to 25 points toward the target. Moving a slider never directly changes the water.
- Driftwood and almond leaves lower pH over simulated hours; crushed coral raises it. Effects stop at the chosen target or the item's limit. Removing an item stops its future effect without undoing achieved pH. Plants slow waste buildup rather than acting as a universal pH control.
- Water quality declines with time and fish count; hunger and unsuitable conditions damage health. Healthy, well-cared-for fish do not lose health simply for existing. Elapsed time is applied when tanks load, not by a background timer.
- Compatibility checks living tankmates and actual temperature/pH, including in empty tanks. Removing a living fish refunds its current shop price; dead fish give no refund.
- Quiz streaks award an extra 5, 10, 20, 40 or 80 pearls on the corresponding consecutive-day milestones. Daily quizzes and milestone rewards cannot be paid twice on the same day.
- The dashboard's four-item learning checklist measures quiz participation, correct knowledge, today's care practice and a safe stocked virtual tank. It is not certification or proof that a real aquarium is ready; research equipment, species, cycling and water testing separately.
- Profiles have editable names/email addresses and larger achievement badges. Pages use the available screen width; shop illustrations share smaller, consistent frames.

## Friends

Send requests by exact account email or share a persistent invitation link through copy, WhatsApp or Telegram. Friendship requires acceptance. Accepted friends can visit read-only tank previews, transfer pearls, leave tank comments and send feeding reminders to the recipient's AquaLife inbox. Private care notes and account email addresses are not exposed in visits. Share links use the app's current origin, so localhost links require access to the same local server.

## Artwork


The interface uses flat surfaces and [Lucide SVG icons](https://lucide.dev) (ISC license), with real species photos from the existing APIs when available. No generated fish images are used.

Fish artwork comes from [Line Fish Vectors by Agus Dahmiko](https://www.svgrepo.com/collection/line-fish-vectors/), under [CC Attribution](https://www.svgrepo.com/page/licensing/#CC%20Attribution). Icons use the interface color; zebra danio, tiger barb and oscar are stylized adaptations with modified proportions and markings. They are illustrations, not scientific identification diagrams.

Plants and decorations use bundled [SVG Repo](https://www.svgrepo.com/) CC0 artwork and Delapouite's [fern](https://github.com/game-icons/icons/blob/master/delapouite/fern.svg) and [stone pile](https://github.com/game-icons/icons/blob/master/delapouite/stone-pile.svg) from Game-icons.net ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)). Source URLs and licenses are retained in each SVG under `client/src/assets/aquarium-items/`. Artwork uses the interface color; the moss is compressed into a low clump and coral gravel is represented by rubble. Plant illustrations are stylized rather than botanical identification diagrams.

See [server setup](server/README.md) and [client setup](client/README.md) for local run instructions.
