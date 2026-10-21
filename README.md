# AquaLife

A gamified virtual aquarium that teaches real fish care, built with Vue 3, Bootstrap 5, Node.js/Express and MongoDB for IS216 Web Application Development II, SMU, 2026-27 Term 1.

---

## 1. Links

| Item | Link |
|---|---|
| Deployed app | <!-- TODO: No deployment exists. The API base URL (client/src/LoginApi.js) and CORS origin (server/server.js) are hard-coded to localhost, so these must change before deploying. Add the URL of the first page here. --> Not deployed. Run locally (see [Running the application](#11-running-the-application)). |
| Git repository | https://github.com/maegankhoo2025-create/AquaLife <!-- TODO: Confirm this repository is public before submission. --> |
| Presentation video | <!-- TODO: Add the YouTube presentation link. --> |

---

## 2. Team members (G8 T2)

| Name | Email ID | Role |
|---|---|---|
| Lam Jun Ying | junying.lam.2025 | Project coordination, system architecture, aquarium backend CRUD services, backend integration |
| Yiming Zhang | ym.zhang.2025 | MongoDB schema and database, user authentication, user-related backend services |
| Maegan Khoo Ann | maegan.khoo.2025 | Front-end development, responsive UI, aquarium interface and customisation |
| Jaimin Ong Weixuan | jaimin.ong.2025 | Fish-care logic, gamification system, quizzes, reward system |
| Kaavya Manikandan | kaavya.m.2025 | External API integration, species information, end-to-end testing, documentation |

---

## 3. Problem and solution

**Problem.** People who want to keep fish often buy them without understanding their care needs, the water conditions they require or which species can live together. This leads to poor care and fish deaths.

**Solution.** AquaLife lets users practise fish keeping in a virtual tank before buying real fish. Users stock tanks from a shop, keep temperature, pH and water quality within each species' range, and are warned when fish are incompatible. Species information (taxonomy, common names, photos, temperature and pH ranges) comes from real-world sources (GBIF, iNaturalist and Aquarist Atlas). Users earn pearls (the in-app currency) and XP for daily care tasks and a daily quiz built from the same species data. Fish health, hunger and growth respond to how well the tank is kept over time.

---

## 4. Features

1. **Accounts and sessions.** Sign up, log in and log out. Passwords are hashed with bcrypt and sessions are stored in MongoDB. All pages except Login require a session.
2. **Multiple tanks.** Each user gets "Tank 1" automatically and can create, name, switch between and delete more tanks.
3. **Fish care simulation.** Fish have health, hunger and size. Hunger rises over time; poor water, wrong temperature/pH or hunger damage health; healthy, fed fish grow towards adult size. Elapsed time is simulated when the user returns (up to 7 days).
4. **Water conditions and goals.** Each tank shows temperature, pH and water quality as read-only bars. Users set goals and change the water using equipment (heater, fan, filter), materials (driftwood, almond leaves, crushed coral), plants and partial water changes. Forecasts show when a goal will be reached.
5. **Compatibility checking.** Before a fish is added, its temperature range, pH range and temperament are checked against the tank and its living tankmates. On a conflict the shop shows the reasons, suggests another of the user's tanks that fits (if any), or lets the user add it anyway.
6. **Shop and inventory.** Fish, plants, decorations and equipment bought with pearls. Items are placed in the selected tank and can be dragged to new positions, renamed (fish nicknames and care notes) or sold back for a refund.
7. **Gamification.** Pearls (new users start with 200), XP, levels (200 XP per level) and six achievement badges.
8. **Daily quiz.** Five multiple-choice questions per day generated from species data (temperature, pH, taxonomy, photo identification). The first completed quiz each day pays 10 pearls and 15 XP per correct answer, with streak bonuses on days 5, 10, 20, 40 and 80. Practice rounds pay nothing.
9. **Daily care rewards.** Feeding (5 pearls/5 XP), starting a partial water change (10/10) and checking temperature (5/5) each pay once per day (Singapore time).
10. **Species information.** Shop cards and item details show live species data (scientific name, family, common name, photo with licence attribution, temperature and pH range).
11. **Dashboard and profile.** Dashboard shows pearls, level, today's tasks, recent activity and a 14-day "responsible fish care" score. Profile shows level, XP, badges, tanks and lets users edit name, email and profile picture.
12. **History.** Every purchase, reward, refund and gift is recorded and listed on the History page.
13. **Friends** (added beyond the proposal). Friend requests by email or invite link, read-only visits to friends' tanks, pearl gifts, comments, feeding reminders and an inbox.

---

## 5. Tech stack

| Layer | Technology (version from package.json) |
|---|---|
| Front end | Vue 3 (^3.5.42), Vue Router (^5.3.1), Pinia (^4.0.3), Vite (^8.2.2), axios (^1.20.0), Lucide icons (@lucide/vue ^1.60.0) |
| Styling | Bootstrap (^5.3.8), custom CSS (`client/src/styles/theme.css`) |
| Back end | Node.js, Express (^4.21.2), express-session (^1.19.0), connect-mongo (^6.0.0), bcrypt (^6.0.0), cors, dotenv |
| Database | MongoDB (Atlas or a replica set) via Mongoose (^8.9.5) |
| Testing | Playwright (^1.63.0), Vitest (^4.1.11), @vue/test-utils |
| Package manager | pnpm (lockfiles are `pnpm-lock.yaml`) |

---

## 6. External APIs

All calls are made by the server in `server/routes/species-routes.js`. None of them needs an API key. Each request times out after 10 seconds; if one fails the app falls back as described below.

| API | Endpoint used | What it provides | Where it is used |
|---|---|---|---|
| GBIF Species API | `GET https://api.gbif.org/v1/species/match?name=…` | Exact species match, scientific name, canonical name, family, genus | Shop cards and item details (`/api/species`), quiz taxonomy questions |
| iNaturalist API | `GET https://api.inaturalist.org/v1/taxa?q=…&rank=species` | Common name and a Creative Commons-licensed photo with attribution | Shop item details, quiz "which fish is in this photo?" questions |
| Aquarist Atlas | `GET https://www.aquaristatlas.com/api/v1/species/<slug>.json` | Temperature and pH ranges | Species details, quiz temperature/pH questions |

- If Aquarist Atlas has no data, the server uses stored reference ranges taken from FishBase (`server/data/speciesConditions.js`). The FishBase API itself is not called.
- If iNaturalist fails, species data is still returned without a photo.
- Quiz questions are cached in memory for 24 hours, so the external APIs are called at most once a day per server process for the quiz.
- No rate limits are enforced by the app. <!-- TODO: Confirm the published rate limits of GBIF, iNaturalist and Aquarist Atlas if the graders need them. -->

---

## 7. Data stores

| Store | What is kept there |
|---|---|
| MongoDB `users` | Name, email, bcrypt password hash, profile picture (small PNG data URL), pearls, XP, daily task state, quiz streak and scores, 31-day care log, invite token |
| MongoDB `tanks` | Owner, name, actual conditions, goals, embedded fish (species, nickname, notes, health, hunger, size), embedded decorations/equipment with positions, water-change progress, last simulation time |
| MongoDB `products` | Shop catalogue: fish, plants, decor and equipment with price, temperature/pH ranges, temperament and photo URLs only (no image files) |
| MongoDB `transactions` | Pearl history: purchases, rewards, refunds and gifts |
| MongoDB `friendships` | Friend pairs and pending/accepted status |
| MongoDB `socialmessages` | Comments, feeding reminders and gift messages, with read status |
| MongoDB `sessions` | Login sessions (via connect-mongo), including the current unfinished quiz attempt |
| Browser `localStorage` | Display preferences (e.g. reduce motion) and the selected tank |

Purchases, refunds, rewards and gifts use MongoDB transactions, which is why MongoDB must be Atlas or a replica set (a standalone local `mongod` will not work).

---

## 8. Project structure

```
AquaLife/
├── README.md                      # This file
├── README.txt                     # Same content as README.md
├── docs/
│   └── CHANGES-jaimin-branch.md   # Detailed feature/change report from the jaimin-changes branch
├── server/                        # Express + MongoDB back end (port 8000)
│   ├── server.js                  # Entry point: middleware, sessions, route mounting, DB connection
│   ├── seed-products.js           # Inserts missing shop products (does not delete or overwrite)
│   ├── seed.js                    # Replaces one existing user's tanks with two starter tanks
│   ├── .env                       # Your secrets (not in Git; create it in setup step 3)
│   ├── models/                    # Mongoose schemas: User, Tank, Product, Transaction, Friendship, SocialMessage
│   ├── routes/
│   │   ├── auth-routes.js         # /auth: signup, login, session, profile, logout
│   │   ├── tanks-routes.js        # /api/tanks: tank CRUD, fish, decorations, goals, compatibility
│   │   ├── game-routes.js         # /api/game: stats, daily care tasks, buying, history, care log
│   │   ├── quiz-routes.js         # /api/quiz: daily questions, answers, rewards
│   │   ├── species-routes.js      # /api/species: GBIF + iNaturalist + Aquarist Atlas lookups
│   │   ├── products-routes.js     # /api/products: public catalogue (60 s cache)
│   │   └── friends-routes.js      # /api/friends: requests, invites, visits, gifts, comments, inbox
│   ├── logic/
│   │   ├── simulation.js          # Time-based water, hunger, health and growth simulation
│   │   ├── compatibility.js       # Temperature/pH/temperament checks
│   │   ├── gamification.js        # Levels, daily tasks, streaks, achievements
│   │   └── shop.js                # Shared purchase logic
│   └── data/                      # Static species list, item effects, quiz generator, stored FishBase ranges
└── client/                        # Vue 3 + Vite front end (port 5173)
    ├── index.html
    ├── vite.config.js
    ├── playwright.config.js       # E2E config (starts the Vite dev server)
    ├── vitest.config.js           # Unit test config
    ├── e2e/vue.spec.js            # Placeholder E2E test (see Testing)
    └── src/
        ├── main.js                # Creates the app, loads Bootstrap and theme.css
        ├── LoginApi.js            # axios instance pointing at http://localhost:8000
        ├── router/index.js        # Routes and the login guard
        ├── stores/game.js         # App state and API calls for tanks, shop, quiz, history
        ├── stores/social.js       # Friends state
        ├── views/                 # One file per page (Login, Dashboard, MainTank, Browse, Quiz, QuizPlay, History, Friends, Profile)
        ├── components/            # Navbar, tank scene, modals, item cards, icons
        ├── assets/aquarium-items/ # SVG artwork for plants, decor and equipment
        └── styles/theme.css       # Colours, layout and responsive rules
```

---

## 9. Prerequisites

| Requirement | Notes |
|---|---|
| Node.js `22.18` or newer in the 22.x line, or `24.12` or newer | Required by `client/package.json` (`"engines": "^22.18.0 \|\| >=24.12.0"`). Check with `node -v`. |
| pnpm | Install with `npm install -g pnpm`. Check with `pnpm -v`. |
| MongoDB Atlas cluster (free tier is fine) or a local MongoDB **replica set** | Transactions are required. A standalone local MongoDB will not work. |
| Internet access | For the external species APIs. |
| Git | To clone the repository. |
| Playwright browsers (testing only) | Installed in the Testing section. |

---

## 10. Setup instructions

### Step 1: Clone the repository

```sh
git clone https://github.com/maegankhoo2025-create/AquaLife.git
cd AquaLife
```

(If you received the source as a zip, unzip it and `cd` into the `AquaLife` folder instead.)

### Step 2: Install dependencies

```sh
cd server
pnpm install
cd ../client
pnpm install
cd ..
```

### Step 3: Create `server/.env`

There is no `.env.example` in the repository. <!-- TODO: Commit a server/.env.example with the variables below and placeholder values. --> Create a file named `.env` inside the `server` folder:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aqualife?retryWrites=true&w=majority
SESSION_SECRET=replace-with-any-long-random-string
```

<!-- TODO: If graders should use the team's Atlas database, provide the connection string separately (not in Git) and say where to find it here. -->

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string for the app and for session storage | `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/aqualife` |
| `SESSION_SECRET` | Yes | Signs session cookies. The server will not start without it. | `k3v9-some-long-random-text` |
| `PORT` | No | Server port. Default `8000`. **Leave unset**: the client is hard-coded to call `http://localhost:8000`. | `8000` |
| `SEED_USER_EMAIL` | No | Account that `seed.js` gives starter tanks to. Default `test@example.com`. | `you@example.com` |
| `NODE_ENV` | No | Set to `production` to mark cookies as secure (HTTPS only). Leave unset for local use. | `production` |

If you use Atlas, add your IP address under **Network Access** in the Atlas dashboard, or the server will fail to connect.

### Step 4: Seed the shop catalogue

```sh
cd server
node seed-products.js
```

This inserts any missing fish, plants, decorations and equipment into the `products` collection. It does not delete or change existing products, so it is safe to run more than once. Without it, the shop is empty.

### Step 5 (optional): Give an account starter tanks

1. Start the app (next section) and sign up in the browser.
2. Put that account's email in `server/.env`:
   ```env
   SEED_USER_EMAIL=you@example.com
   ```
3. Run:
   ```sh
   cd server
   node seed.js
   ```

This **deletes all of that user's existing tanks** and creates "Tank 1" (neon tetras, guppy, cory) and "Tank 2" (goldfish, zebra danio). Skip it if you want to start with an empty tank.

---

## 11. Running the application

The back end and front end run as two separate processes. **Start the back end first**, because every page checks the login session with the server before it loads.

**Terminal 1: back end (port 8000)**

```sh
cd server
pnpm dev
```

Expected output:

```
Connected to MongoDB
Server running on http://localhost:8000
```

Check it by opening http://localhost:8000/api/health. You should see `{"status":"ok","db":"connected"}`. (`pnpm start` also works; it runs without auto-restart.)

**Terminal 2: front end (port 5173)**

```sh
cd client
pnpm dev
```

**Open the app at http://localhost:5173**

`http://localhost:5173/` redirects to `/dashboard`. If you are not logged in, you are sent to the Login page (`/login`). After logging in or signing up, the Dashboard (home page) loads.

Notes:
- Use `localhost`, not `127.0.0.1`. The server only accepts requests from `http://localhost:5173`, and the session cookie is tied to the hostname.
- Keep the ports as they are. The client calls `http://localhost:8000` and the server allows only `http://localhost:5173`.
- If the page stays blank, check that Terminal 1 is running and that the browser console has no network errors.

---

## 12. Test accounts

No accounts are created by the seed scripts. Create one on the Login page with **Don't have an account? Sign up**. Passwords must be at least 5 characters with at least 1 letter and 1 number.

| Role | Email | Password |
|---|---|---|
| User | <!-- TODO: Create a test account in the submitted database and fill in the email. --> | <!-- TODO: fill in the password. --> |
| Second user (for Friends features) | <!-- TODO: optional second account --> | <!-- TODO --> |

There is no admin role.

---

## 13. Testing

### Current state

| Framework | Config | Test files | Status |
|---|---|---|---|
| Playwright (E2E) | `client/playwright.config.js` | `client/e2e/vue.spec.js` | Placeholder from the Vue project template. It expects the text "You did it!", which the app does not show, so **it fails**. |
| Vitest (unit) | `client/vitest.config.js` | `client/src/__tests__/App.spec.js` | Placeholder from the template. **It fails** for the same reason. |

<!-- TODO: Replace the placeholder tests with Playwright E2E tests for the core features in the manual test table below. The project brief requires at least E2E testing of core features. -->

### Install test dependencies

The test libraries are installed by `pnpm install` in `client`. Install the Playwright browsers once, using the project's own Playwright version:

```sh
cd client
pnpm exec playwright install
```

Use `pnpm exec`, not `npx`. `npx` can run a different Playwright version and download browsers the tests cannot find ("Executable doesn't exist at …ms-playwright\chromium-…").

### Run the tests

1. Start the back end first (Terminal 1 in [Running the application](#11-running-the-application)). Playwright starts the Vite front end itself (or reuses one already on port 5173), but it does not start the back end.
2. Run the E2E tests:
   ```sh
   cd client
   pnpm test:e2e --project=chromium
   ```
   Without `--project`, tests run in Chromium, Firefox and WebKit. Locally the browser window is visible (headed mode). An HTML report opens at the end; view it again with `npx playwright show-report`.
3. Run the unit tests (no server needed):
   ```sh
   cd client
   pnpm test:unit -- --run
   ```

Current output (placeholder tests). E2E: the app loads and redirects to Login, so the template assertion fails:

```
Error: expect(locator).toHaveText(expected) failed
Locator:  locator('h1')
Expected: "You did it!"
Received: "Log in"
  1 failed
```

Unit: `Test Files  1 failed (1)`, `Tests  1 failed (1)`.

Expected output once real tests are written: every test listed as passed, e.g. `N passed`. <!-- TODO: Update with real output once real tests exist. -->

### Manual test cases (core features)

Run these with both servers running, at http://localhost:5173. Use a fresh account unless stated.

| ID | Feature | Steps | Expected result |
|---|---|---|---|
| T01 | Sign up | On Login, click **Don't have an account? Sign up**. Enter a name, a new email and password `abc12`. Click **Create account**. | Dashboard opens with "Welcome back, <name>". Balance shows 200 pearls. |
| T02 | Sign-up validation | Sign up with password `abcde`. | Message: password must be at least 5 characters with at least 1 letter and 1 number. No account created. |
| T03 | Log in / log out | Log out, then log in with the T01 email and password. Then try a wrong password. | Correct password opens Dashboard. Wrong password shows "Email or password is incorrect." |
| T04 | Login guard | While logged out, open http://localhost:5173/main-tank. | Redirected to `/login`. |
| T05 | Tank creation | Open **My Tank**, click **New tank**, enter a name, click **Create and select tank**. | New empty tank appears and is selected. "Tank 1" still exists. |
| T06 | Shop purchase | Open **Shop**, pick a peaceful fish (e.g. Neon Tetra, 30 pearls), choose **Add to [tank]**. | Fish appears in My Tank. Balance drops by the item price. |
| T07 | Purchase history | After T06, open **History**. | A purchase entry with the item name and a negative pearl amount. |
| T08 | Insufficient pearls | Try to buy an item costing more than your balance. | Purchase is blocked with "Not enough pearls"; balance unchanged. |
| T09 | Compatibility conflict | In a tank with peaceful fish, try to add an aggressive fish, or a fish whose temperature/pH range does not include the tank's readings. | Conflict dialog lists the reasons. If another tank fits, it offers **Add to [that tank]**; **Add to [tank] anyway** is also offered. |
| T10 | Water goals | In My Tank, expand **Goals**, change temperature, click **Save goals**. | Goal is saved; the actual reading does not jump instantly. With a heater/fan installed, the forecast shows progress towards the goal. |
| T11 | Daily care reward | Click **Feed fish** in a tank with a living fish. Click it again. | First click: +5 pearls, +5 XP, reward entry in History. Second click: feeds again but marked **Rewarded today**, no extra pearls. |
| T12 | Water change | Click **Partial change** when water quality is below the goal. | +10 pearls on the first use today; quality rises over 30 minutes. |
| T13 | Daily quiz | Open **Quiz**, **Start quiz**, answer all 5 questions, **See results**. | 10 pearls and 15 XP per correct answer; a reward entry appears in History. |
| T14 | Quiz once per day | Take the quiz again the same day (**Practise again**). | Feedback is shown but no pearls or XP are awarded. |
| T15 | Profile | Open **Profile**. | Level, XP progress, achievement badges and tanks are shown. Editing the name and clicking **Save profile** updates the header. |
| T16 | Species data | Open a fish in the Shop. | Scientific name, family, temperature/pH range and (if available) a photo with attribution are shown. |
| T17 | Friends | With a second account, send a request from **Friends** by email, accept it, then **Visit tanks** and send a pearl gift. | Friend's tank is visible read-only; gift moves pearls between accounts and appears in both histories. |

---

## 14. Usage guide

1. **Login (`/login`).** Log in, or switch to sign up. New accounts get 200 pearls and an empty "Tank 1".
2. **Dashboard (`/dashboard`).** Shows "Welcome back", pearls, level and XP, today's care tasks, recent activity and the 14-day care score with today's checks.
3. **My Tank (`/main-tank`).** Shows the aquarium. Switch tanks with **Previous tank** / **Next tank** or by swiping. Read temperature, pH and water quality bars; set **Goals**; use **Feed fish**, **Partial change** and **Check temperature**. Click a fish to see its health, hunger and size and to edit its nickname and notes. Use **Decorate** to drag items. Remove fish or items to get a refund.
4. **Shop (`/browse`).** Choose the destination tank in **Shopping for**, filter by Fish, Plants, Decor or Equipment, open an item for its species data and effects, and add it. Incompatible fish open the conflict dialog.
5. **Quiz (`/quiz`, `/quiz/play`).** Start the daily 5-question quiz. Each answer shows feedback and a fact. Results show pearls earned and the streak.
6. **History (`/history`).** All purchases, rewards, refunds and gifts, newest first.
7. **Friends (`/friends`).** Add friends by email or share an invite link, accept requests, visit friends' tanks, send pearls, comments and feeding reminders, and read the inbox.
8. **Profile (`/profile`).** Level, badges and tanks; edit name, email and profile picture; display preferences.

### Responsive design

The layout uses the Bootstrap 5 grid (`row`, `col-sm-*`, `col-md-*`, `col-lg-*`) so cards stack into one column on phones and spread into several on larger screens. The navbar collapses into a toggle menu on small screens, and `d-md-*` / `d-lg-*` classes show or hide elements by screen size. Extra `@media` rules in `client/src/styles/theme.css`, `BrowsePage.vue`, `Dashboard.vue` and `LoginPage.vue` adjust spacing and the tank scene for small screens.

---

## 15. API endpoints

Base URL: `http://localhost:8000`. "Login" means a valid session cookie is required (otherwise `401`). Ownership always comes from the session, never from the request body.

### Health

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Server status and database connection state |

### Auth (`server/routes/auth-routes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create an account `{ name, email, password }` and log in |
| POST | `/auth/login` | Public | Log in `{ email, password }` |
| GET | `/auth/session` | Public | Returns `{ loggedIn, user }` for the current session |
| PATCH | `/auth/profile` | Login | Update name, email and/or avatar (PNG data URL; empty string removes it) |
| POST | `/auth/logout` | Public | Destroy the session |

### Tanks (`server/routes/tanks-routes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tanks` | Login | List my tanks (simulation is advanced first) |
| GET | `/api/tanks/:id` | Login | Get one of my tanks |
| GET | `/api/tanks/:id/compatibility/:speciesId` | Login | Check whether a species suits this tank |
| POST | `/api/tanks` | Login | Create a tank `{ name }` |
| PATCH | `/api/tanks/:id/targets` | Login | Set temperature, pH and water-quality goals |
| POST | `/api/tanks/:id/fish` | Login | Buy and add a fish; `409` with reasons if incompatible unless `force: true` |
| PATCH | `/api/tanks/:id/fish/:fishId` | Login | Update a fish's nickname and/or private notes |
| PATCH | `/api/tanks/:id/decorations/:decorationId` | Login | Move an installed item (x, y position) |
| DELETE | `/api/tanks/:id/fish/:fishId` | Login | Remove a fish; a living fish is refunded at its current price |
| DELETE | `/api/tanks/:id/decorations/:decorationId` | Login | Remove an installed item and refund its current price |
| DELETE | `/api/tanks/:id` | Login | Delete a tank (no refund for its contents) |

### Game (`server/routes/game-routes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/game/me` | Login | Pearls, level, today's completed tasks, quiz streak and achievements |
| GET | `/api/game/care` | Login | Record today's care snapshot and return the 14-day care history |
| POST | `/api/game/tasks/:taskId` | Login | Do a care task (`feed`, `clean` or `temp`) for `{ tankId }`; pays once per day |
| POST | `/api/game/buy` | Login | Buy `{ itemId, tankId, quantity?, force? }`; `409` for incompatible fish unless forced |
| GET | `/api/game/history` | Login | My transactions, newest first (latest 200) |

### Quiz (`server/routes/quiz-routes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/quiz` | Login | Today's questions (without answers) and whether today's reward is used |
| POST | `/api/quiz/answer` | Login | Record an answer and return whether it is correct, with an explanation |
| POST | `/api/quiz/submit` | Login | Finish the quiz; pays the daily reward and streak bonus once per day |

### Species and products

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/species?name=<scientific name>` | Public | Combined GBIF, iNaturalist and Aquarist Atlas data for one species |
| GET | `/api/species/quiz-data` | Public | Species data for three sample species |
| GET | `/api/products` | Public | Full shop catalogue (cached for 60 seconds) |

### Friends (`server/routes/friends-routes.js`)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/friends` | Login | Friends, requests, my invite token and inbox |
| POST | `/api/friends/requests` | Login | Send a friend request by email |
| PATCH | `/api/friends/requests/:id` | Login | Accept or reject an incoming request |
| GET | `/api/friends/invitations/:token` | Login | Read an invitation |
| POST | `/api/friends/invitations/:token/accept` | Login | Accept an invitation |
| PATCH | `/api/friends/messages/:id/read` | Login | Mark an inbox message read |
| DELETE | `/api/friends/comments/:id` | Login | Delete a comment (author or tank owner) |
| GET | `/api/friends/:friendId/tanks` | Login + accepted friend | Read-only view of a friend's tanks and comments |
| POST | `/api/friends/:friendId/gifts` | Login + accepted friend | Send pearls `{ amount, message? }` |
| POST | `/api/friends/:friendId/reminders` | Login + accepted friend | Send a feeding reminder for a tank |
| POST | `/api/friends/:friendId/comments` | Login + accepted friend | Comment on a friend's tank |

---

## 16. Database schemas

From `server/models/`.

### User (`User-model.js`)

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase |
| `passwordHash` | String | Required, bcrypt hash, excluded from queries by default |
| `avatar` | String | PNG data URL up to 128×128 px, default `''`, excluded by default |
| `pearls` | Number | Default 200, min 0 |
| `xp` | Number | Default 0. Level is calculated (200 XP per level), not stored |
| `inviteToken` | String | Unique (sparse), excluded by default |
| `tasks.day` / `tasks.done` | String / [String] | Day (YYYY-MM-DD) and care tasks already rewarded that day |
| `quiz.streak` / `quiz.lastDay` | Number / String | Consecutive quiz days and last rewarded day |
| `quiz.scores[]` | `{ date, score, total, reward }` | Quiz results |
| `careLog[]` | `{ day, met, total }` | One snapshot per day, up to 31 days |
| `createdAt` / `updatedAt` | Date | Timestamps |

### Tank (`Tank-model.js`)

| Field | Type | Notes |
|---|---|---|
| `owner` | ObjectId → User | Required |
| `name` | String | Required, max 40 chars |
| `conditions.temperature` / `.ph` / `.waterQuality` | Number | Actual readings. 15–35 °C, pH 5–9, quality 0–100. Defaults 25 / 7.0 / 100 |
| `targets.temperature` / `.ph` / `.waterQuality` | Number | User goals, same ranges and defaults |
| `fish[]` | Embedded | See below |
| `decorations[]` | Embedded | See below |
| `maintenance.waterChange` | `{ startedAt, endsAt, amount, delivered }` | Current partial water change |
| `lastSimulatedAt` | Date | When the simulation last ran |
| `createdAt` / `updatedAt` | Date | Timestamps; optimistic concurrency enabled |

Embedded fish:

| Field | Type | Notes |
|---|---|---|
| `speciesId` | String | Required, e.g. `neon-tetra` |
| `nickname` | String | Max 20 chars |
| `notes` | String | Private care notes, max 2000 chars |
| `health` / `hunger` | Number | 0–100. Defaults 100 / 0 |
| `size` | Number | cm, grows to adult size |
| `addedAt` | Date | Default now |

Embedded decoration (plants, decor, equipment):

| Field | Type | Notes |
|---|---|---|
| `itemId` | String | Required, product id |
| `x` / `y` | Number | Position in %, 0–100. Defaults 50 / 85 |
| `addedAt` / `installedAt` | Date | When it was added / started taking effect |

### Product (`Product-model.js`)

| Field | Type | Notes |
|---|---|---|
| `id` | String | Required, unique slug, e.g. `neon-tetra` |
| `category` | String | `fish`, `plant`, `decor` or `equipment` |
| `name` | String | Required |
| `sci` | String | Scientific name |
| `price` | Number | Required, pearls, min 0 |
| `temperament` | String | `peaceful`, `semi-aggressive` or `aggressive` |
| `care` | String | `easy`, `moderate` or `hard` |
| `temp` / `ph` | [Number] | Fish only: `[min, max]` |
| `size` | Number | Adult size in cm (fish) |
| `blurb` | String | Description |
| `photos[]` | `{ url, attribution, license, source, sourceUrl }` | Photo URLs only |
| `effect` | Virtual | Calculated effect on water conditions |

### Transaction (`Transaction-model.js`)

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | Required, indexed |
| `type` | String | `purchase`, `reward`, `refund` or `gift` |
| `label` | String | Required, e.g. "Daily quiz: 4/5 correct" |
| `amount` | Number | Pearls; negative when spent |
| `date` | Date | Default now |

### Friendship (`Friendship-model.js`)

| Field | Type | Notes |
|---|---|---|
| `pair` | String | Required, unique key for the two users |
| `members` | [ObjectId → User] | The two users |
| `requestedBy` | ObjectId → User | Required |
| `status` | String | `pending` or `accepted` |

### SocialMessage (`SocialMessage-model.js`)

| Field | Type | Notes |
|---|---|---|
| `sender` / `recipient` | ObjectId → User | Required |
| `tank` | ObjectId → Tank | Optional |
| `type` | String | `comment`, `reminder` or `gift` |
| `content` | String | Max 500 chars |
| `amount` | Number | Gift pearls, min 1 |
| `readAt` | Date | `null` until read |

---

## 17. AI/LLM disclosure

<!-- TODO: Each team member to confirm and complete this list before submission. -->

The code records the following AI use (from `server/server.js` and `server/README.md`):

- The project scaffold, `server.js` boilerplate, the draft Tank schema and the first route stubs were generated with AI assistance.
- AI-assisted updates also include timed aquarium care, fish movement, catalogue caching, care notes, profile editing, friendship/invitation/inbox flows, transactional pearl updates and quiz milestone rewards.
- This README was drafted with Claude (Anthropic) from the repository code and checked by the team.

<!-- TODO: List the AI tools used, what each was used for, and who used them. -->

No AI or LLM service is called by the running app. Quiz questions come from fixed templates filled with species data.
