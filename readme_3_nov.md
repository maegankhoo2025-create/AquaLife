# IS216 - Group Project
## AquaLife - a virtual aquarium for learning real fish care

> Practise fish keeping before you buy the fish. Built with Vue 3, Vue Router, Bootstrap 5, Express, and MongoDB.

This repository is the **IS216 Web Application Development II** group project for **G8 T2** (SMU, 2026-27 Term 1). It is a working full-stack app: a Vue 3 frontend, an Express backend, MongoDB for accounts and tanks, and a plan for Playwright end-to-end tests. Follow the steps below in order.

Public repository: [github.com/maegankhoo2025-create/AquaLife](https://github.com/maegankhoo2025-create/AquaLife)

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | Vue 3 (`<script setup>`), Vue Router, Bootstrap 5, axios, Lucide icons |
| Backend | Node.js, Express, express-session, bcrypt |
| Database | MongoDB (Atlas or a replica set) via Mongoose. Sessions live in the same database. |
| Build tool | Vite |
| E2E tests | Playwright (the suite below is planned and is not in the repo yet) |
| Package manager | pnpm |

Pinia is installed and mounted in [`client/src/main.js`](client/src/main.js). Feature state lives in [`client/src/stores/game.js`](client/src/stores/game.js) and [`client/src/stores/social.js`](client/src/stores/social.js), which the pages call instead of talking to the API on their own.

## Try it live

The app is set up to run on your own machine. The client calls `http://localhost:8000`, and the server accepts the browser at `http://localhost:5173`. After [step 6](#6-run-the-app), open:

**[http://localhost:5173](http://localhost:5173)**

No demo account is seeded. Create one on the Login page with **Don't have an account? Sign up**.

| What you need | Rule |
| --- | --- |
| Name | Any display name |
| Email | Any address you can remember. It does not have to be a real inbox. |
| Password | At least 5 characters, with at least 1 letter and 1 number. `abc12` is a valid example. |
| Starting balance | 500 pearls. XP starts at 0. |

- Sign up to land on the Dashboard, then stock a tank, keep the water in range, and take the daily quiz.
- Create a **second account** (a second browser, or a private window) when you want to try Friends: requests, visits, pearl gifts, comments, and feeding reminders.
- Every account is a normal user. There is no admin role.

Use clearly fake details. This is a shared class project, and the database you connect has no separate privacy wall between accounts you create in it.

## Prerequisites

- [Node.js](https://nodejs.org/) `22.18` or newer on the 22.x line, or `24.12` or newer (`client/package.json` asks for `^22.18.0 || >=24.12.0`). Check with `node -v`.
- [pnpm](https://pnpm.io/). Install with `npm install -g pnpm`, then check with `pnpm -v`.
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local MongoDB **replica set**. Purchases, refunds, care rewards, quiz rewards, and gifts use transactions, so a standalone local MongoDB is not enough.
- Internet access, for the species APIs in [External APIs](#external-apis).
- Git
- Google Chrome, which is the browser the project is graded in.
- Playwright browsers, only when you run the tests in [step 7](#7-run-the-tests).

## 1. Clone the repo

```bash
git clone https://github.com/maegankhoo2025-create/AquaLife.git
cd AquaLife
```

If you received the source as a zip, unzip it and `cd` into the `AquaLife` folder instead.

## 2. Install dependencies

The client and the server each have their own `package.json`. Install both.

```bash
cd server
pnpm install
cd ../client
pnpm install
cd ..
```

## 3. Create your own MongoDB Atlas cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in (or create a free account).
2. Create a free cluster and a database user. Save the username and password.
3. Under **Network Access**, allow your current IP address. The server cannot connect until Atlas allows that address.
To allow other users to access the same database, on the left sidebar, go to security> Database and Network Access> IP Access List and add IP address 0.0.0.0/0
4. Choose **Connect** and copy the SRV connection string. You will paste it into `.env` in the next step. Put the database name in the path, for example `aqualife`.

A local replica set works the same way if you already run one. Point `MONGODB_URI` at that set.

## 4. Set your environment variables

There is no `.env.example` in the repository. Create a file named `.env` inside the `server` folder:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/aqualife?retryWrites=true&w=majority
SESSION_SECRET=replace-with-any-long-random-string
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for the app and for session storage |
| `SESSION_SECRET` | Yes | Signs the session cookie. The server refuses to start without it. |
| `PORT` | No | Server port. Leave it unset so the server stays on `8000`. The client calls `http://localhost:8000`. |
| `SEED_USER_EMAIL` | No | Account that the optional [`server/seed.js`](server/seed.js) script stocks. Default `test@example.com`. |
| `NODE_ENV` | No | Set to `production` only when the site is served over HTTPS. Leave it unset on your machine. |

`.env` stays out of Git. Never commit the real connection string or `SESSION_SECRET`.

## 5. Seed the shop catalogue

```bash
cd server
node seed-products.js
```

This inserts any missing fish, plants, decorations, and equipment into the `products` collection. It leaves existing products as they are, including prices and descriptions, so it is safe to run again. Without it, the shop has nothing to sell.

### Starter tanks (optional)

Skip this if you want the empty **Tank 1** that a new account receives.

1. Start the app ([step 6](#6-run-the-app)) and sign up in the browser.
2. Put that account's email in `server/.env`:
   ```env
   SEED_USER_EMAIL=you@example.com
   ```
3. Run:
   ```bash
   cd server
   node seed.js
   ```

This replaces **all** of that user's tanks with two stocked ones: **Tank 1** (neon tetras, a guppy, and a cory) and **Tank 2** (a goldfish and a zebra danio).

## 6. Run the app

The backend and the frontend are two processes. Start the backend first. Every page asks the server whether you are logged in before it loads.

**Terminal 1 — backend (port 8000)**

```bash
cd server
pnpm dev
```

You should see:

```text
Connected to MongoDB
Server running on http://localhost:8000
```

Open [http://localhost:8000/api/health](http://localhost:8000/api/health). A healthy server returns `{"status":"ok","db":"connected"}`. `pnpm start` runs the same server without auto-restart.

**Terminal 2 — frontend (port 5173)**

```bash
cd client
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). `/` redirects to `/dashboard`. A logged-out visit is sent to `/login`. After login or sign-up, the Dashboard loads, and a brand-new account is given an empty tank named **Tank 1**.

Keep these hostnames and ports:

- Use `localhost`, not `127.0.0.1`. The server only accepts `http://localhost:5173`, and the session cookie is tied to that host.
- Leave the client on port `5173` and the server on port `8000`.
- If the page stays blank, check that Terminal 1 is running and that the browser console shows the health URL responding.

Grading checks the layout in Chrome, from a phone-sized viewport (iPhone 6) up to Bootstrap's XL breakpoint.

## 7. Run the tests

The project brief asks for end-to-end coverage of the core journeys. The suite in the table below is the one we intend to add. **Those spec files are not implemented yet.**

What is in the repo today is the Vue starter:

| File | What it does today |
| --- | --- |
| [`client/e2e/vue.spec.js`](client/e2e/vue.spec.js) | Opens `/` and expects an `h1` reading "You did it!". AquaLife shows the Login page, so this test fails. |
| [`client/src/__tests__/App.spec.js`](client/src/__tests__/App.spec.js) | Mounts `App` and expects the same starter text, so the unit test fails. |

### One-time setup

Install the browser binaries for the Playwright version in this project (only required once per machine):

```bash
cd client
pnpm exec playwright install
```

Use `pnpm exec`, not `npx`. `npx` can download a different Playwright build, and the tests then cannot find the browser.


### Run the tests

If you intend to do E2E testing now,
Ctrl C any server or client that is currently running.

The E2E testing will be using a separate section in the same cluster.
In the .env file in the server folder, using the same mongodb link that you have created for Aqualife, add this to the end of the link, replace "yourname" with your name with no spacing:
MONGODB_URI=mongodb+srv://<user>:<password>@aqualife-database.j0gzc14.mongodb.net/aqualife_test_yourname

now in command line in vs code, from the AquaLife folder, run
```bash
cd server
node seed-products.js
pnpm i
pnpm dev
```
check that the server is up and running,

then open a new terminal tab, if it starts from AquaLife folder, type
```bash
cd client 
npx playwright test --project=chromium --ui
```

now there will be a Playwright pop up page, run all tests by clicking the green triangle play button at the top along the tests row.

after testing, to make sure all E2E test accounts created during the testing are deleted,
in the same terminal
press ctrl+C
```bash
cd ../server
node delete-e2e-users.js
```



## Project structure

```text
AquaLife/
├── readme_3_nov.md            # This file
├── server/                    # Express + MongoDB (port 8000)
│   ├── server.js              # Middleware, sessions, routes, database connection
│   ├── seed-products.js       # Inserts missing shop products
│   ├── seed.js                # Optional: replaces one user's tanks with two starter tanks
│   ├── .env                   # Your secrets (create this in step 4; not in Git)
│   ├── models/                # User, Tank, Product, Transaction, Friendship, SocialMessage
│   ├── routes/                # auth, tanks, game, quiz, species, products, friends
│   ├── logic/                 # simulation, compatibility, shop purchases, pearls and XP
│   └── data/                  # Species list, quiz templates, item effects, stored care ranges
└── client/                    # Vue 3 + Vite (port 5173)
    ├── playwright.config.js
    ├── e2e/vue.spec.js        # Starter test; see step 7
    └── src/
        ├── LoginApi.js        # axios client for http://localhost:8000
        ├── router/index.js    # Routes and the login guard
        ├── stores/            # game.js (tanks, shop, quiz) and social.js (friends)
        ├── views/             # Login, Dashboard, My Tank, Shop, Quiz, History, Friends, Profile
        ├── components/        # Navbar, tank scene, shop cards, modals
        └── styles/theme.css
```

## Problem and solution

**Problem.** People often buy fish before they know the temperature and pH those fish need, or which species can share a tank. The fish then live in the wrong water, or with the wrong tankmates.

**Solution.** AquaLife is a tank you can stock, neglect, and correct without harming a real animal. You buy fish, plants, and equipment with pearls, set water goals, and watch health, hunger, and growth respond over time. The shop checks temperament, temperature, and pH before a fish goes in. Species names, families, photos, and care ranges come from public sources. Daily care tasks and a five-question quiz, built from that same species data, pay pearls and XP.

## Using the app

1. **Login (`/login`).** Log in, or switch to sign up. A new account gets 500 pearls. The first load of the app creates an empty **Tank 1**.
2. **Dashboard (`/dashboard`).** Pearls, level, XP, today's care tasks, recent activity, and the 14-day care score.
3. **My Tank (`/main-tank`).** The aquarium. Read the three condition bars, save **Goals**, then **Feed fish**, clean, check temperature, or check pH. Open a fish for health, hunger, size, nickname, and notes. If fishes are not moving, on Windows, check settings >accessibility >visual effects >animation effects turn on animation effects. 
**Decorate** to drag items. Remove a fish or an item to refund it.
4. **Shop (`/browse`).** Pick the destination tank, filter by Fish, Plants, Decor, or Equipment, open an item for its care data and effects, and add it.
5. **Quiz (`/quiz`, `/quiz/play`).** The daily five questions. Each answer shows whether it was right and a short fact. Results show pearls earned and the streak.
6. **History (`/history`).** Purchases, rewards, refunds, and gifts, newest first.
7. **Friends (`/friends`).** Requests, invite links, visits, gifts, comments, reminders, and the inbox.
8. **Profile (`/profile`).** Level, badges, and tanks. Edit name, email, and profile picture.

The layout uses the Bootstrap 5 grid, so cards stack on a phone and sit side by side on a wider screen. The navbar collapses to a menu on small screens. Extra rules in [`client/src/styles/theme.css`](client/src/styles/theme.css) adjust spacing and the tank scene.

## External APIs

The server calls these from [`server/routes/species-routes.js`](server/routes/species-routes.js). 

| API | Endpoint | What it provides | Where it shows up |
| --- | --- | --- | --- |
| GBIF Species API | `GET https://api.gbif.org/v1/species/match?name=…` | Exact species match, scientific name, family, genus | Shop details and quiz taxonomy questions |
| iNaturalist | `GET https://api.inaturalist.org/v1/taxa` and, when needed, `GET https://api.inaturalist.org/v1/observations` | Common name and a Creative Commons photo with credit | Shop details and "which fish is this?" quiz questions |
| Aquarist Atlas | `GET https://www.aquaristatlas.com/api/v1/species/<slug>.json` | Temperature and pH ranges, and a maximum size when the record has one | Shop details and quiz temperature and pH questions |

- When Aquarist Atlas has no usable range, the server uses the stored FishBase ranges in [`server/data/speciesConditions.js`](server/data/speciesConditions.js). The FishBase site is credited there. The app does not call FishBase.
- When iNaturalist has no photo, the rest of the species record is still returned.
- Quiz questions are cached in memory for 24 hours, so a running server process calls these APIs for the quiz at most once a day.
- The shop catalogue itself is stored in MongoDB. `GET /api/products` reuses that catalogue for 60 seconds per server process.

Each feature can be accessed several times a day. These three APIs are the public ones the app depends on, and the quiz cache keeps repeat visits off the network.

## Data stores

| Store | What is kept there |
| --- | --- |
| MongoDB `users` | Name, email, bcrypt password hash, profile picture, pearls, XP, daily task state, quiz streak and scores, care log, invite token |
| MongoDB `tanks` | Owner, name, readings, goals, fish (species, nickname, private notes, health, hunger, size), placed items, water-change progress, last simulation time |
| MongoDB `products` | Shop catalogue: fish, plants, decor, and equipment, with price, temperament, and care ranges |
| MongoDB `transactions` | Pearl history: purchases, rewards, refunds, and gifts (the latest 200 are shown) |
| MongoDB `friendships` | Friend pairs and pending or accepted status |
| MongoDB `socialmessages` | Comments, feeding reminders, and gift messages, with read status |
| MongoDB `sessions` | Login sessions, including the unfinished quiz attempt |
| Browser `localStorage` | Display preferences, such as reduced motion, and which tank is selected |

Purchases, refunds, rewards, and gifts run inside a MongoDB transaction.


## Team

G8 T2. Roles describe the main area each person owned.

| Name | Email ID | Role |
| --- | --- | --- |
| Lam Jun Ying | junying.lam.2025 | Project coordination, system architecture, aquarium backend services, backend integration |
| Yiming Zhang | ym.zhang.2025 | MongoDB schema and database, user authentication, user-related backend services |
| Maegan Khoo Ann | maegan.khoo.2025 | Front-end development, responsive UI, aquarium interface and customisation |
| Jaimin Ong Weixuan | jaimin.ong.2025 | Fish-care logic, gamification, quizzes, reward system |
| Kaavya Manikandan | kaavya.m.2025 | External API integration, species information, end-to-end testing, documentation |

## AI/LLM disclosure

The running app does not call an AI or LLM service. Quiz questions are filled in from fixed templates and the species data above.

Each member should replace their row before submission. State the tool, and the parts of the project that relied on it. [`server/server.js`](server/server.js) already notes that its boilerplate was generated with AI assistance; confirm that in the row of whoever produced it, and add anything else that should be declared.

| Name | Tool | Parts that relied on AI/LLM |
| --- | --- | --- |
| Lam Jun Ying | <!-- fill in, or "none" --> | <!-- fill in --> |
| Yiming Zhang | <!-- fill in, or "none" --> | <!-- fill in --> |
| Maegan Khoo Ann | <!-- fill in, or "none" --> | <!-- fill in --> |
| Jaimin Ong Weixuan | <!-- fill in, or "none" --> | <!-- fill in --> |
| Kaavya Manikandan | <!-- fill in, or "none" --> | <!-- fill in --> |



## Ethical use

- **Use your own Atlas cluster and fake accounts.** Sign up with addresses like `user1@example.com`. Keep real names, emails, and personal details out of the database.
- **Keep it as a class project.** It stores passwords as hashes and uses http-only session cookies, and it is still a student app: run it locally, with test data.
- **Submit your own work.** Libraries and artwork used in the app should stay credited in the code and in the presentation. Public libraries are fine. Presenting someone else's project as this team's work is not.
- **Keep `.env` private.** The connection string and `SESSION_SECRET` are credentials. Leave them out of Git, slides, and chat.

## Disclaimer

AquaLife is a student project for IS216, provided as submitted, for learning and marking. It is a simplified simulation: the water model uses a fixed room temperature and fixed item strengths, and it does not measure ammonia, nitrite, nitrate, or hardness. Do not treat its care advice as instructions for a real tank. The Atlas cluster is free with 512MB of storage by default but you can choose to upgrade it for a subscription fee.
