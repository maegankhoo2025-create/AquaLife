# AquaLife

Branch: `jaimin-changes`

Comparison: local `main` at `6a7bf11`, with application changes through `c97f533`.

This report covers the features added or revised on this branch, their use in the app, and the storage and consistency changes behind them. The application work is in three commits:

| Commit | Work |
| --- | --- |
| `6758e33` | Aquarium persistence, quiz attempt retention and purchase consistency fixes. |
| `85998cf` | Care goals, equipment, friendships, invitations, profile editing and the visual redesign. |
| `c97f533` | Two-week care history, improved condition simulation, item movement, fan animation, profile pictures, comment deletion and fish-name visibility. |

## 1. What changed from main

Main already had accounts, a dashboard, tanks, a shop, fish compatibility checks, a daily quiz, care actions, history, fish removal, decorating and basic time-based care. The branch builds on those features.

| Area | Branch changes |
| --- | --- |
| Account access | Registration creates a signed-in session. Login and signup normally open Dashboard. Login is the initial form, with a link to signup. |
| Tanks | A visible creation form adds and selects another tank. Selection and swipe handling are more reliable. |
| Fish details | Nickname edits persist to MongoDB; fish have private care notes and hover/focus name labels. |
| Conditions | Read-only bars replace direct condition sliders. Saved goals guide equipment and forecasts without instantly changing the water. |
| Care simulation | Minute-resolution catch-up, fractional-time settlement, installation timestamps, room-temperature exchange, thermostatic equipment and distance-dependent pH effects. |
| Care progress | Adds a saved rolling 14-day history, daily checks and a care streak. |
| Shop | Equipment and effect descriptions, consistent illustrations, a single catalogue grid and clearer balance/installed-item states. |
| Friends | Accepted friendships, shareable invitations, read-only visits, pearl gifts, comments, inbox messages and feeding reminders. |
| Profiles | Persisted name/email editing, uploadable/removable pictures and larger achievement tiles. |
| Quiz | Existing unfinished attempts survive reloads; daily rewards are transactional; consecutive-day milestone bonuses are shown and paid. |
| Presentation | Flat colors, SVG icons, colored species/item illustrations, full-width pages, less duplicated copy and rounded numeric readings. |
| Persistence | Transactional inventory, balance and history updates; stale client responses cannot overwrite newer tank writes. |
| Catalogue loading | A 60-second public-products cache with shared in-flight loads; insert-only product seeding. |

## 2. Running the app

### Requirements

- Node.js compatible with the client engine requirement: `^22.18.0` or `>=24.12.0`.
- pnpm.
- MongoDB Atlas or a MongoDB replica set. Transactions are used by tank reads and several care/economy operations, so standalone MongoDB is insufficient.
- `server/.env` containing `MONGODB_URI` and `SESSION_SECRET`. Keep their real values out of Git and documentation.

From the repository root, start the backend:

```sh
cd server
pnpm install
node seed-products.js
pnpm dev
```

In a second terminal, start the client:

```sh
cd client
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The backend defaults to `http://localhost:8000`; `/api/health` reports database connectivity. The current CORS configuration permits the localhost client origin. Using another hostname or deploying publicly requires corresponding configuration changes.

The seed script adds missing products, including equipment, without deleting the catalogue or replacing existing prices, photos and descriptions. Reseeding does not update an already-existing product. Public catalogue changes appear after cache expiry on a subsequent request, or after restarting the backend.

## 3. Account access and profile

### Login and registration

1. Open the app. The account form starts in **Log in** mode.
2. Enter an existing email/password, or use **Don't have an account? Sign up**.
3. Registration requests a name, email and password. New accounts start with 500 pearls. After **Create account**, the user is signed in immediately.
4. Successful login or signup normally opens **Dashboard**.

A friend invitation is the exception: authentication returns the recipient to its acceptance screen in Friends. The branch does not add a general-purpose return-to-any-original-page flow.

### Edit a profile

1. Open **Profile**, then **Account**.
2. Edit **Name** or **Email address**.
3. Optionally choose a **Profile picture**, or use **Remove picture**.
4. Review the preview and click **Save profile**.

Pictures may be PNG, JPEG or WebP, up to 5 MiB. The browser center-crops the image to a square and converts it to a 128 × 128 PNG before upload. The server accepts a bounded PNG data URL, stored in MongoDB, rather than a remote image URL. Choosing or removing a picture changes the draft; saving persists it. The saved image appears in the header, with a name initial as the fallback.

Profile updates preserve fields omitted from the request. Duplicate email addresses are rejected. Password hashes and invitation tokens are excluded from ordinary profile/session responses; this page does not add password changing or email verification.

Four achievement badges (Fish Keeper, Quiz Streak, Fish Scholar, Social Fish) each upgrade through five tiers: Bronze, Silver, Gold, Platinum and Diamond. Higher tiers get a richer medal (inner ring, glow, then a moving shine for Diamond). Profile shows a **My badges** section, earned medals beside the name and the highest-tier medal pinned to the profile picture. Streak badges use the best streak ever reached, so they are kept after a missed day. Choosing or removing a profile picture saves it immediately, and it updates the navbar, Profile and Friends pages. Below 100 pearls the navbar balance turns orange, Dashboard shows a "running out of pearls" banner and a warning appears when a purchase drops the balance under 100. The existing **Reduce motion** preference controls aquarium movement. The reminder preference switches do not implement scheduled push or email notifications. Preferences and selected-tank choice remain browser-local settings.

## 4. Tanks, fish and installed items

### Create and select a tank

1. Open **My Tank** and click **New tank**.
2. Enter **Tank name**.
3. Click **Create and select tank**. The new empty tank becomes active.

Switch tanks by horizontal touch scrolling, the **Previous tank** / **Next tank** controls, or Left/Right while the tank track is focused. Profile's **My tanks** section has an **Open** control for a specific tank. The shop's **Shopping for** selector changes the shared destination tank too.

The original automatic **Tank 1** setup remains. Additional tanks let the user separate fish with different requirements; stocking rules still need to be checked for each tank.

### Save a nickname and private notes

1. Select the correct tank in My Tank.
2. Leave decorating mode if it is active.
3. Click or tap a fish.
4. Edit **Nickname** and **Care notes**, then **Save fish details**.

Nicknames are trimmed and limited to 20 characters. Notes allow 2,000 characters. The fish card also shows health, hunger, size and species requirements. Missing species information is labelled unavailable rather than substituted with invented care ranges.

Hovering or keyboard-focusing a fish reveals its nickname, falling back to the species name if unnamed. Friends can see nicknames, but private care notes remain owner-only.

### Remove fish or installed items

- Use a fish's **Remove** control, then confirm **Remove fish**. A living fish refunds its current MongoDB shop price; a dead fish refunds nothing.
- **Remove dead fish** clears dead fish sequentially. If one request fails, earlier successful removals remain completed.
- Use an installed item's **Remove** control, then **Remove item**. Plants, materials, decorations and equipment refund their current product price when that product still exists.
- Removing an item stops its future water effect. It does not reverse changes already delivered.

The server settles elapsed care before deciding whether a fish is alive and refundable. Refunds use the current product price, not the original purchase price. Deleting an entire tank through the API does not refund its contents.

**Installed items** now sits below the tank with artwork and effect descriptions, making the inventory easier to find.

### Arrange the tank

1. Click **Decorate**.
2. Drag a plant, material, decoration or equipment item.
3. Alternatively, focus an item with Tab and use the arrow keys.
4. Click **Done decorating**.

Dragging preserves the initial grab point, supports mouse/touch/pen, and keeps the whole illustration inside the scene. Arrow keys move an item by two percentage points. Positions save after about 400 ms without movement, including when a held pointer is stationary. Resizing and changing scenes end or constrain movement appropriately.

### Aquarium movement

Fish have independent speed, depth, turns and pauses. They ease into direction changes instead of moving in one repeated direction at a fixed speed. Hovering, focusing or selecting a fish pauses it. Dead fish stop swimming and appear inverted near the surface.

Swimming pauses when the page is hidden, a scene is offscreen or inactive, decorating is open, or reduced motion is enabled. Animation updates visual transforms without repeatedly replacing reactive tank records or saving swimming coordinates to MongoDB.

The cooling fan rotates only its blades, and only while the server reports that cooling is active. It stops at the temperature goal or cooling limit, and also pauses with inactive/hidden scenes, decorating or reduced motion. Catalogue fan icons remain static; there is no manual on/off switch.

## 5. Conditions, goals and gradual care

### Read the bars and set goals

Temperature, pH and water quality are actual readings. They are no longer editable sliders.

1. Open **My Tank** and select a tank.
2. Read the three condition bars.
3. Expand **Goals**, enter the desired readings and click **Save goals**.
4. Buy suitable care items or start a partial water change to move actual conditions over time.
5. Click a condition title/info control for current activity, sources, rate, estimate and practical care advice.

Goal input limits are 15 to 35°C, pH 5 to 9 and quality 0 to 100%. A goal outside the shared species range is flagged. If the fish have no overlapping range, the page advises separating them.

A goal is a reference stored separately from the measured condition. Saving it does not instantly alter the water. Forecasts can show no ETA when the installed setup cannot reach a goal. Estimates change if fish, items or targets change.

Readings display at most one decimal, with at most two for pH. Trailing zeros are not forced. Fish health/hunger/size and species-range labels also avoid long floating-point strings. Simulation and MongoDB keep full precision.

### What care items do

The prices below are seed defaults. The live MongoDB catalogue supplies the shop price, so an existing installation may have different prices.

| Item | Default pearls | Effect and limit |
| --- | ---: | --- |
| Thermostatic heater | 45 | Adds 0.5°C/hour while heating, offset by room-temperature exchange. One per tank. With the fixed 24°C room model, heating approaches 29°C. |
| Cooling fan | 35 | Adds 0.4°C/hour of cooling while active, with a 21°C floor in the fixed room model. One per tank. |
| Sponge filter | 30 | Supplies 2 water-quality points/hour before waste is deducted, toward the quality goal. One per tank. |
| Driftwood | 35 | Lowers pH toward 6.5. Its instantaneous rate per counted piece is `-0.02 × (pH - 6.5)` pH units/hour while above that limit. Up to three pieces contribute. |
| Indian Almond Leaves | 10 | Lowers pH toward 6.5, at an instantaneous rate of `-0.03 × (pH - 6.5)` pH units/hour per counted piece. Up to three pieces contribute. |
| Crushed Coral | 20 | Raises pH toward 8, at an instantaneous rate of `0.02 × (8 - pH)` pH units/hour per counted piece. Up to three pieces contribute. |
| Java Fern / Anubias / Amazon Sword / Java Moss | 15 / 18 / 22 / 12 | Each plant reduces base waste by 10%. At most four plants contribute, for a 40% reduction. They do not change pH in this model. |
| Rock Cave / Sunken Castle / Treasure Chest | 40 / 80 / 60 | Visual decorations without a condition effect. |

The pH contribution limits and plant contribution limit are effect caps, not purchase caps. Only equipment is restricted to one installed unit of each type.

Temperature naturally drifts toward the fixed 24°C room at `0.1 × (24 - water temperature)` degrees per hour. The heater and fan work toward the saved temperature goal, but ambient exchange and device capacity limit what they can achieve. A goal of 29°C cannot be reached from below in finite time by the heater under this model.

pH materials keep working after the selected pH goal. Their effects weaken near their own limits; opposing materials balance according to their combined strengths. They do not reverse an overshoot on their inactive side. Check the readings and remove material when appropriate. Removing driftwood does not instantly restore the previous pH.

These rules use a fixed room temperature and fixed material strengths. The model does not measure real source-water hardness, buffering capacity, ammonia, nitrite or nitrate. Condition advice is available through the info controls; physical tanks require species-specific research and water testing.

### Feed, care for water and check conditions

Each tank has its own four daily tasks: feeding Tank 1 does not count for Tank 2. Rewards are paid once a day per task per tank, and only for tanks with living fish. Dashboard lists every stocked tank with its tasks done today.

| My Tank control | Action | First daily reward |
| --- | --- | ---: |
| Feed fish | Resets hunger for living fish in the selected tank. Rejects a tank without living fish. | 20 pearls and 20 XP |
| Clean tank | Raises water quality by up to 25 points straight away (never above 100%). Disabled when the water is already at 100%. | 30 pearls and 30 XP |
| Check temperature | Reads the current temperature without changing it. Counts toward the daily care check. | 15 pearls and 15 XP |
| Check pH | Reads the current pH without changing it. | 15 pearls and 15 XP |

Tapping a condition's info button (or **How to fix it** when it is out of range) opens a care guide: the current status and what to do, matching shop items with one-click **Buy** for the selected tank, short numbered steps, and check/caution notes.

Each action type rewards once per user per Singapore calendar day, shared across tanks. **Rewarded today** means its daily reward is used; valid care can still be repeated. An active water change cannot be restarted, and a change cannot start when quality is already at or above the goal. The UI shows remaining time or **Finishing…**.

### Time, waste and fish health

The backend advances care when relevant requests occur. It does not run a continuous background simulation. Visible tank pages refresh about once a minute and catch up when brought back into view.

- Ordinary reads advance full minutes and retain the unfinished minute. Mutations settle fractional elapsed time before changing care, items or goals.
- A catch-up covers at most the latest seven days; older elapsed time is skipped.
- Installation and fish-addition timestamps prevent new items or fish from affecting periods before they existed.
- Hunger rises by two percentage points/hour. High hunger, poor water, unsuitable temperature and unsuitable pH can damage health. Healthy fish recover when conditions are suitable and hunger is low.
- Fish grow only while healthy enough and not too hungry. Dead fish remain until removed and still count in the waste calculation.
- Base hourly waste is `(0.5 + 0.1 × fish count) × (1 - 0.1 × min(4, plant count))`. Filter and water-change supply are applied against ongoing waste.

## 6. Responsible fish care over two weeks

Dashboard's **Responsible fish care** section shows a rolling 14-day percentage, daily records, fully met days, a care streak and **Today's checks**.

The seven checks cover healthy fish, feeding, suitable temperature, suitable pH, clean water, compatible tankmates and the daily thermometer routine. At least one living fish is required. Environmental checks apply across stocked tanks. The health check also fails while a dead fish remains in the inventory.

Each Singapore calendar day stores one latest snapshot. Repeating visits does not create additional days. Today's snapshot can improve or worsen as care changes. Dashboard visits and successful care actions record it; unchanged totals avoid another database write.

The score is the rounded average of each day's completed-check fraction over today and the previous 13 days. Missing days contribute zero. One perfect recorded day contributes about 7%; consistently meeting all checks across the full window reaches 100%. Records are retained for up to 31 days, with 14 shown in the current view. Missed days are not backfilled by simulation.

To use it:

1. Visit Dashboard to review **Today's checks**.
2. Open My Tank and address the unmet checks for the relevant tanks.
3. Feed appropriately, maintain water, keep compatible fish and check temperature.
4. Return on following days and review the daily cells and care streak.

The care streak counts consecutive fully met recorded days ending today, within the displayed window. It is separate from the quiz streak. Quiz scores do not raise care progress. Preparing a physical tank still involves researching the intended species, cycling the filter without fish and testing water chemistry.

## 7. Shop and compatibility

1. Open **Shop** and choose **Shopping for**.
2. Filter by **All**, **Fish**, **Plants**, **Decor** or **Equipment**. Existing temperament, care-level and fit filters remain available.
3. Open an item for its description, care requirements, compatibility or tank effects.
4. Set quantity and choose **Add to [tank]**.

The shop uses one catalogue grid instead of repeating a recommended row. Fish, plants, materials and equipment share consistently sized illustration frames. Effect summaries explain what an item changes and its limits. The detail dialog separates **Not enough pearls** from the balance display and reminds players to review a condition goal when buying an item that affects it. Purchases that leave fewer than 100 pearls show a confirmation first. Already-installed equipment is disabled, and equipment quantity is one. Other items support quantities up to nine in the UI; the purchase API accepts one through ten.

Compatibility checks use actual temperature and pH and compare living tankmates. A fresh tank (no living fish and no equipment, pH material or plant) has no temperature or pH conflicts: buying its first fish sets the water and goals to the middle of that fish's range. Removing the last living fish or last water-changing item from a tank resets its readings and goals to the new-tank defaults (25°C, pH 7, 100% water quality). Dead fish are excluded from tankmate conflicts. Buying/removing fish refreshes local tank state so later compatibility checks use the updated stock. The existing **Add anyway** conflict flow remains available.

The implemented temperament rule checks aggressive versus non-aggressive fish. It does not enforce tank volume, schooling group sizes, predator/prey size relationships or every species-specific stocking requirement.

## 8. Friends, visits, gifts and comments

### Add a friend

1. Open **Friends**.
2. Under **Add a friend**, enter their exact account email and click **Send request**.
3. The recipient opens **Friend requests** and chooses **Accept** or **Reject**.

Pending outgoing requests appear under **Awaiting a response**. Visits and social actions require accepted friendship. Self-requests and duplicate pairs are rejected or handled as existing relationships.

### Share an invitation

Under **Invite with a link**, use **Copy link**, **WhatsApp** or **Telegram**. The recipient follows the link, authenticates if needed and explicitly selects **Accept invitation**. Opening the link alone does not accept it.

Links use the browser's current app origin. A localhost link works only for someone who can access that same local server; sharing it does not publish the application. Invitation tokens persist and have no expiry/rotation control in this branch, so share them only with intended recipients.

### Visit a tank and see fish names

1. Under **Your friends**, click **Visit tanks**.
2. Use **Choose a tank** to select the intended aquarium.
3. Read its fish-name list below the scene, or hover/focus a fish for its nickname.

A visit initially selects the friend's first tank. Names are shown for the selected tank; a friend's other tank may contain the named fish. Empty nicknames fall back to species names. No nickname-selection fix was needed after the reported case was traced to selecting a different tank.

Visits are read-only. Visitors cannot feed, move items, edit goals or read private care notes. The API excludes private notes and account email addresses. Tank simulation for visits happens in memory without saving the friend's tank.

Visits are fetched snapshots with no automatic polling. Close and reopen a visit to fetch updated tank/fish details. **Refresh friends and inbox** refreshes those lists, balance and history, rather than the open visit snapshot.

### Send pearls or a feeding reminder

Within a visit:

- **Gift pearls to [name]** takes a positive whole-number amount and an optional message. Click **Send pearl gift** to transfer pearls immediately. The limit is 1,000,000 per gift and the sender must have enough balance.
- **Send feed reminder** adds a message to the owner's AquaLife inbox for the selected tank. It does not feed the fish or send email, push notifications or scheduled reminders.

Gift debit, recipient credit, both users' signed history entries and the gift inbox message are saved together. Gifts have no undo/refund action and do not award XP.

### Comments and inbox

Use **Leave a comment**, then **Post comment**. Comments and optional gift messages allow up to 500 characters. The comment's author or the tank's current owner can use **Delete comment**, even if friendship no longer exists. Deleting a comment cannot delete a gift/reminder or reverse a pearl transfer.

**Your inbox** shows received comments, reminders and gifts, with unread counts and **Mark as read**. Only the recipient can mark an entry read. Inbox delivery is request-based; there is no live subscription, pagination or notification scheduling in this branch.

## 9. Daily quiz and streak bonuses

1. Open **Quiz** and click **Start quiz**.
2. Choose an answer, read the feedback and explanation, then continue with **Next question**.
3. After the last question, choose **See results**.
4. Use **Spend pearls** to open the shop, or return to the quiz hub.

The quiz has five questions. The first completed quiz each day awards 10 pearls and 15 XP per correct answer. **Practise again** gives feedback without another daily payout, stored score or streak advancement. Completing the daily quiz advances its completion streak even with zero correct answers.

| Consecutive completion day | Extra pearls |
| ---: | ---: |
| 3 | 15 (Bronze Quiz Streak badge) |
| 5 | 25 |
| 7 | 40 (Silver) |
| 10 | 60 |
| 14 | 80 (Gold) |
| 21 | 120 (Platinum) |
| 30 | 200 (Diamond) |

Milestone bonuses are added to the base answer reward and shown in the hub/results. They award no additional XP.

### How questions are produced

This branch retains the existing data-driven quiz generator. Fixed templates create temperature, pH, taxonomy/scientific-name and photo-identification questions from species lookup data. The species list, five-question length, templates, reward rules and shuffle algorithm are defined in code. No language model or generative-AI service writes questions.

A date seed chooses the daily questions from a cached pool. The pool is built from the static species list, with external lookup/fallback data, and cached per process for 24 hours. Adding only a MongoDB product does not add it to the quiz. Identical dates produce identical selections only when the available pool is identical; refreshed upstream data can change it.

Real licensed fish photos remain in quiz questions, with attribution. Missing/broken photos use an SVG question icon. Shop and tank displays use illustrations.

### Attempt and reward fixes

Reloading reuses the same unfinished session/day attempt instead of resetting its recorded first choices. The server validates question IDs and answer indices, keeps the answer key server-side until feedback, and calculates the score from recorded answers. Failed client requests leave a retry path instead of advancing as if successful.

Daily reward state and its history entry are updated transactionally, preventing another same-day payout across sessions. First-choice retention is session-local; it is not an account-wide durable answer lock. The branch does not claim to prevent every multi-session or concurrent-answer strategy.

## 10. Visual and copy changes

- Flat surface colors replace gradients, glow and shadow-heavy styling. Visible focus outlines remain.
- Lucide SVG controls replace interface emoji. The pearl uses a colored oyster-and-pearl illustration instead of a generic currency shape.
- Fish use colored species-specific line illustrations. Zebra danio, tiger barb and oscar are stylized adaptations of base profiles.
- Plants, wood, leaves, coral, rocks, ornaments and equipment have their own colored SVG illustrations.
- Tank scenes add flat glass, waterline and sand-bed structure without inserting unowned plants or decorations.
- Pages and navigation use the available screen width. The shop removes duplicated catalogue content and uses smaller consistent artwork.
- My Tank keeps detailed advice and goals behind expandable/info controls, with installed items visibly below the scene.
- Repeated filler copy is removed; displayed numeric readings are rounded.

The added client dependency is `@lucide/vue`. Sources, licence terms and palette references are listed under [artwork credits](#14-artwork-credits) and in the bundled SVGs. Existing licence notices must remain when redistributing adapted assets.

## 11. Storage, consistency and efficiency

| Data | Storage and behavior |
| --- | --- |
| Account | MongoDB User: name/email/avatar, pearls/XP, daily reward state, quiz completion history and care log. |
| Tanks | MongoDB Tank: owner, fish and notes, installed item coordinates/timestamps, actual conditions, goals, water-change progress and simulation clock. |
| Friendships | MongoDB Friendship with a unique sorted pair and pending/accepted state. |
| Social messages | MongoDB SocialMessage for comments, reminders and gift messages, with sender/recipient/tank references and read state. |
| Pearl history | MongoDB Transaction records purchases, rewards, refunds and gifts. History returns the latest 200 entries. |
| Unfinished quiz | Mongo-backed Express session, including daily questions and first-choice answers. |
| Display preferences | Browser localStorage for settings and selected tank. |
| Forecasts | Computed from current tank state; `progression` is a JSON virtual, not a separate persisted timeline. |

### Consistency fixes

Purchases, refunds, care rewards, quiz rewards and pearl gifts use MongoDB transactions for their related state/history changes. Inventory mutations read a fresh owner-matching tank inside the transaction and settle elapsed care before applying the change. Conditional balance updates reject insufficient funds instead of trusting a stale client balance.

Both purchase entry points share the same purchase logic; adding a fish through the tank API is not a free bypass. Mutation ownership comes from the authenticated session. ID validation and owner-constrained lookups protect private tank operations.

The client normalizes IDs and applies returned tank state after successful writes. Its request/write guards prevent an older tank response from overwriting a later local mutation. Item coordinates and fish details persist through API calls instead of remaining only in the browser. Removal dialogs retain their pending target safely while asynchronous requests complete.

### Catalogue cache

`GET /api/products` caches serialized public catalogue JSON for 60 seconds per backend process. Simultaneous cache misses share one MongoDB load, and failed loads do not create successful cache entries.

Balances, tanks, private profiles and refund/purchase operations are not served from that cache. Purchases fetch product data directly from MongoDB before their transaction; refunds look it up within their transaction. This avoids stale public-cache prices but does not lock purchase prices against a concurrent catalogue edit. There is no Redis/distributed cache or explicit invalidation endpoint.

### Other efficiency changes

- Care logs retain up to 31 daily totals and avoid rewrites when today's totals are unchanged.
- Forecasts use analytical condition calculations rather than running another fish simulation.
- Hidden/inactive scenes stop motion; hidden pages stop visible polling and catch up on return.
- Avatar thumbnails are bounded and excluded from ordinary User queries.
- Unused frontend mock catalogue/account content is removed; the remaining `data/mock.js` holds daily-task display definitions.

## 12. Changed source map

| Area | Main files |
| --- | --- |
| Authentication/navigation | `client/src/views/LoginPage.vue`, `client/src/router/index.js`, `client/src/components/AppNavbar.vue`, `server/routes/auth-routes.js` |
| Tank UI and movement | `client/src/views/MainTank.vue`, `client/src/components/TankScene.vue`, `TankSwiper.vue`, `fishMotion.js`, `client/src/stores/game.js` |
| Conditions and advice | `client/src/components/ConditionBar.vue`, `client/src/data/careTips.js`, `server/logic/simulation.js`, `server/data/equipment.js` |
| Care history | `client/src/views/Dashboard.vue`, `server/routes/game-routes.js`, `server/models/User-model.js` |
| Shop and inventory | `client/src/views/BrowsePage.vue`, `client/src/components/ItemCard.vue`, `ItemModal.vue`, `server/logic/shop.js`, `server/logic/compatibility.js`, `server/routes/tanks-routes.js` |
| Profiles | `client/src/views/Profile.vue`, `server/routes/auth-routes.js`, `server/models/User-model.js` |
| Friends | `client/src/views/Friends.vue`, `client/src/stores/social.js`, `server/routes/friends-routes.js`, `server/models/Friendship-model.js`, `SocialMessage-model.js`, `server/server.js` |
| Quiz, rewards and history | `client/src/views/Quiz.vue`, `QuizPlay.vue`, `History.vue`, `server/routes/quiz-routes.js`, `server/logic/gamification.js`, `server/data/questions.js`, `server/models/Transaction-model.js` |
| Artwork/theme | `client/src/components/AppIcon.vue`, `FishIcon.vue`, `AquariumItemIcon.vue`, `ItemVisual.vue`, `PearlCount.vue`, `AlModal.vue`, `SpeciesExplorer.vue`, `client/src/assets/aquarium-items/`, `client/src/styles/theme.css` |
| Catalogue/setup | `server/routes/products-routes.js`, `server/models/Product-model.js`, `server/models/Tank-model.js`, `server/data/items.js`, `server/seed-products.js`, `client/package.json`, `client/pnpm-lock.yaml`, `.gitignore`, setup documentation |

The old `ConditionSlider.vue` and direct condition-editing API are removed. API clients should use `PATCH /api/tanks/:id/targets`. The [server README](server/README.md#api-aquarium) lists the tank, care, profile, quiz and social endpoints.

## 13. Verification and delivery boundaries

Earlier branch verification included a production client build, eight passing local unit checks, API/database smoke scenarios and browser interaction checks. Those exercises covered timed simulation, catalogue behavior, purchases/refunds, care history, uploads, dragging, fan start/stop, comment deletion and friend fish-name display. The two-week care-history exercise used seeded dates; it was not a real two-week user trial.

During report preparation, the backend health endpoint returned `status: ok` and `db: connected`. An accepted-friend API response was also checked against saved fish nicknames.

This documentation update changes no application behavior. It does not claim a fresh full regression run, an accessibility audit, a public deployment test or exhaustive security coverage. Local tests and diagnostic scripts are not included as a reproducible committed test suite. The root placeholder test command is not evidence of coverage.

Keep credentials, session cookies and `.env` files out of Git.

## 14. Artwork credits

Interface icons use [Lucide](https://lucide.dev), under the ISC licence.

Fish outlines come from [Line Fish Vectors by Agus Dahmiko](https://www.svgrepo.com/collection/line-fish-vectors/), under [CC Attribution](https://www.svgrepo.com/page/licensing/#CC%20Attribution). The original profiles have adapted flat interior colors and markings. Zebra danio, tiger barb and oscar use stylized adaptations.

Fish palettes reference photographs on the Wikimedia-led profiles for [neon tetra](https://en.wikipedia.org/wiki/Neon_tetra), [betta](https://en.wikipedia.org/wiki/Siamese_fighting_fish), [guppy](https://en.wikipedia.org/wiki/Guppy), [angelfish](https://en.wikipedia.org/wiki/Pterophyllum_scalare), [goldfish](https://en.wikipedia.org/wiki/Goldfish), [discus](https://en.wikipedia.org/wiki/Discus_(fish)), [zebra danio](https://en.wikipedia.org/wiki/Zebrafish), [tiger barb](https://en.wikipedia.org/wiki/Tiger_barb), [oscar](https://en.wikipedia.org/wiki/Oscar_(fish)) and [peppered cory](https://en.wikipedia.org/wiki/Corydoras_paleatus). The orange halfmoon betta, blue discus and understated guppy represent selected photographed specimens. Colors are illustrative adaptations, not exact pixel samples or coverage of every color morph.

Plants and decorations use bundled [SVG Repo](https://www.svgrepo.com/) CC0 artwork and Delapouite's [fern](https://github.com/game-icons/icons/blob/master/delapouite/fern.svg) and [stone pile](https://github.com/game-icons/icons/blob/master/delapouite/stone-pile.svg) from Game-icons.net, under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Source URLs, licences and palette references are retained in `client/src/assets/aquarium-items/`. Moss is a low-clump adaptation, and coral gravel uses rubble artwork.

The currency icon adapts Delapouite's [Oyster pearl](https://game-icons.net/1x1/delapouite/oyster-pearl.html), under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), with a transparent background and flat shell/pearl colors. The heater, cooling fan and sponge filter adapt Lucide's thermometer, fan, cylinder and bubbles, retaining ISC notices.

Plant colors reference Tropica photographs of [java fern](https://tropica.com/en/plants/plantdetails/4408/4408), [anubias](https://tropica.com/en/plants/plantdetails/Anubiasbarterivar.barteri(101A)/4551), [java moss](https://tropica.com/en/plants/plantdetails/4391/4391) and [Amazon sword](https://tropica.com/en/plants/plantdetails/Echinodorusgrisebachii'Tropica'(071ETC)/29741). Material references include [Buce Plant river driftwood](https://buceplant.com/products/river-driftwood), Aquarium Co-Op [catappa leaves](https://www.aquariumcoop.com/products/catappa-leaves) and [crushed coral](https://www.aquariumcoop.com/products/crushed-coral-1-pound-bag), and [Penn-Plax's photographed chest ornament](https://shop.bensonspet.com/products/030172010156).

The tank composition references Tropica [Layout 9](https://tropica.com/en/inspiration/layout/Layout9/4847), [Layout 86](https://tropica.com/en/inspiration/layout/Layout86/5290) and the [Layout 29 photograph](https://tropica.com/imagegen.ashx?width=1000&image=/Layouts/L029/1a.jpg&class=product). Layout 29 also informs the cave/castle stone palettes. Reference photos are not bundled or traced.

See [server setup](server/README.md) and [client setup](client/README.md) for their existing project instructions.
