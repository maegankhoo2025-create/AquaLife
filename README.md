# AquaLife
WAD 2 Project

The entry page starts with login and links to signup. Registration signs the user in, and both normally open the dashboard; a friend invitation returns to its acceptance screen after authentication.

## Aquarium and learning

- Create and select multiple tanks, and save private fish nicknames and care notes.
- Conditions are read-only bars with rounded readings, goals and time estimates. Detailed activity and real-world advice sit behind the info buttons; goal inputs are collapsed by default.
- Driftwood/leaves acidify toward pH 6.5 and coral buffers upward toward pH 8. Effects weaken near those limits and opposing materials balance together. A pH goal is a reference, not an automatic stop. Removing materials stops future effects without undoing the current pH. Plants reduce waste.
- Water quality declines with time and fish count; hunger and unsuitable conditions damage health. Healthy, well-cared-for fish do not lose health simply for existing. Fixed-minute simulation carries partial minutes forward, settles elapsed time before purchases or edits, and catches up at most seven days per read.
- Water drifts gradually toward a 24°C room. Heaters and cooling fans operate automatically toward the temperature goal within their capacity; the fan blades animate only while cooling and stop at the goal. The shop explains rates and limits, and each tank can install one of each device. Items never affect time before installation.
- Partial water changes take 30 minutes and supply up to 25 quality points before ongoing waste is deducted. Active changes cannot be restarted. Conditions, item timestamps and delivered cleaning progress persist in MongoDB.
- Fish swim independently with changing speed, depth, turns and pauses. Hover or focus reveals their nickname. Motion stops for hidden/inactive tanks, reduced motion and decorating. Item dragging preserves the grab point, keeps artwork inside the tank and saves positions after movement stops.
- Compatibility checks living tankmates and actual temperature/pH, including in empty tanks. Removing a living fish refunds its current shop price; dead fish give no refund.
- Quiz streaks award an extra 5, 10, 20, 40 or 80 pearls on the corresponding consecutive-day milestones. Daily quizzes and milestone rewards cannot be paid twice on the same day.
- Responsible care uses a rolling 14-day average of daily records, not a one-visit checklist. Each day checks health, feeding, temperature, pH, clean water, tankmates and the thermometer routine across stocked tanks. Care actions and dashboard visits save the day's record in MongoDB; repeated visits do not add days, and missing days count as zero. The dashboard shows the daily record and current checks. Quiz scores do not increase care progress.
- Profiles have editable names/email addresses, uploadable/removable profile pictures and larger achievement badges. Selected PNG/JPEG/WebP images are cropped locally to a small PNG thumbnail stored in MongoDB. Pages use the available screen width; shop illustrations share smaller, consistent frames.

The public catalogue has a 60-second, per-process cache; simultaneous cache misses share one Mongo query. Purchases and refunds read current prices directly from MongoDB. Balances and tank state are not API-cached. The open tank and dashboard care progress refresh about once a minute while visible and catch up when the page becomes visible again. Temperature, quality, fish health/hunger and size labels use at most one decimal; pH uses two. Simulation and storage retain full precision.

## Friends

Send requests by exact account email or share a persistent invitation link through copy, WhatsApp or Telegram. Friendship requires acceptance. Accepted friends can visit read-only tanks with fish nicknames shown in a list and on hover, transfer pearls, leave comments and send feeding reminders to the recipient's AquaLife inbox. Comment authors and current tank owners can delete comments without removing gifts or transferring pearls. Private care notes and account email addresses are not exposed in visits. Share links use the app's current origin, so localhost links require access to the same local server.

## Artwork


The interface uses flat surfaces and [Lucide SVG icons](https://lucide.dev) (ISC license). Shop cards, detail dialogs and tank views use colored illustrations. Real fish photos appear in the quiz. No generated fish images are used.

Fish artwork comes from [Line Fish Vectors by Agus Dahmiko](https://www.svgrepo.com/collection/line-fish-vectors/), under [CC Attribution](https://www.svgrepo.com/page/licensing/#CC%20Attribution). Original outline profiles are retained with flat interior colors and markings; zebra danio, tiger barb and oscar remain stylized adaptations. They are illustrations, not scientific identification diagrams.

Fish palettes reference actual photographs on the Wikimedia-led profiles for [neon tetra](https://en.wikipedia.org/wiki/Neon_tetra), [betta](https://en.wikipedia.org/wiki/Siamese_fighting_fish), [guppy](https://en.wikipedia.org/wiki/Guppy), [angelfish](https://en.wikipedia.org/wiki/Pterophyllum_scalare), [goldfish](https://en.wikipedia.org/wiki/Goldfish), [discus](https://en.wikipedia.org/wiki/Discus_(fish)), [zebra danio](https://en.wikipedia.org/wiki/Zebrafish), [tiger barb](https://en.wikipedia.org/wiki/Tiger_barb), [oscar](https://en.wikipedia.org/wiki/Oscar_(fish)) and [peppered cory](https://en.wikipedia.org/wiki/Corydoras_paleatus). The orange halfmoon betta, blue discus and understated guppy represent selected photographed specimens, not every color morph. Colors are illustrative adaptations, not exact pixel samples.

Plants and decorations use bundled [SVG Repo](https://www.svgrepo.com/) CC0 artwork and Delapouite's [fern](https://github.com/game-icons/icons/blob/master/delapouite/fern.svg) and [stone pile](https://github.com/game-icons/icons/blob/master/delapouite/stone-pile.svg) from Game-icons.net ([CC BY 3.0](https://creativecommons.org/licenses/by/3.0/)). Source URLs, licenses and palette references are retained in each SVG under `client/src/assets/aquarium-items/`. Native SVG colors distinguish foliage, wood, dried leaves, stone and ornament materials; moss remains a low-clump adaptation and coral gravel is represented by rubble. Plant illustrations remain stylized rather than botanical identification diagrams.

The pearl currency icon uses Delapouite's [Oyster pearl](https://game-icons.net/1x1/delapouite/oyster-pearl.html), under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), adapted with a transparent background and flat shell/pearl colors. The heater, cooling fan and sponge filter adapt Lucide's thermometer, fan, cylinder and bubbles; their bundled SVGs retain ISC notices.

Plant colors reference Tropica photographs of [java fern](https://tropica.com/en/plants/plantdetails/4408/4408), [anubias](https://tropica.com/en/plants/plantdetails/Anubiasbarterivar.barteri(101A)/4551), [java moss](https://tropica.com/en/plants/plantdetails/4391/4391) and [Amazon sword](https://tropica.com/en/plants/plantdetails/Echinodorusgrisebachii'Tropica'(071ETC)/29741). Material references include [Buce Plant river driftwood](https://buceplant.com/products/river-driftwood), Aquarium Co-Op [catappa leaves](https://www.aquariumcoop.com/products/catappa-leaves) and [crushed coral](https://www.aquariumcoop.com/products/crushed-coral-1-pound-bag), and [Penn-Plax's photographed chest ornament](https://shop.bensonspet.com/products/030172010156).

The flat glass/waterline and sand-bed composition reference Tropica [Layout 9](https://tropica.com/en/inspiration/layout/Layout9/4847), [Layout 86](https://tropica.com/en/inspiration/layout/Layout86/5290) and the [Layout 29 photograph](https://tropica.com/imagegen.ashx?width=1000&image=/Layouts/L029/1a.jpg&class=product), whose stone colors also inform the cave/castle palettes. The scene adds only environmental glass and substrate, not unowned plants or decorations. Reference photos are not bundled or traced; colors are flat, without gradients or glow.

See [server setup](server/README.md) and [client setup](client/README.md) for local run instructions.
