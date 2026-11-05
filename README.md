# IS216 - Group Project
## AquaLife - a virtual aquarium for learning real fish care

> Practise fish keeping before you buy the fish. Built with Vue 3, Vue Router, Bootstrap 5, Express, and MongoDB.

This repository is the **IS216 Web Application Development II** group project for **G8 T2** (SMU, 2026-27 Term 1). It is a working full-stack app: a Vue 3 frontend, an Express backend, MongoDB for accounts and tanks, and a plan for Playwright end-to-end tests. Follow the steps below in order.

Public repository: [github.com/maegankhoo2025-create/AquaLife](https://github.com/maegankhoo2025-create/AquaLife)


## Problem and solution

**Problem.** People often buy fish before they know the temperature and pH those fish need, or which species can share a tank. The fish then live in the wrong water, or with the wrong tankmates.

**Solution.** AquaLife is a tank you can stock, neglect, and correct without harming a real animal. You buy fish, plants, and equipment with pearls, set water goals, and watch health, hunger, and growth respond over time. The shop checks temperament, temperature, and pH before a fish goes in. Species names, families, photos, and care ranges come from public sources. Daily care tasks and a quiz, built from that same open-sourced species data, pay pearls and XP.

## Using the app

1. **Login (`/login`).** 
Log in, or switch to sign up. A new account gets 500 pearls. The first load of the app creates an empty **Tank 1**.
2. **Dashboard (`/dashboard`).** 
Pearls, level, XP, today's care tasks, recent activity, and the 14-day care score.
3. **My Tank (`/main-tank`).** 
The aquarium. Read the three condition bars, save **Goals**, then **Feed fish**, clean, check temperature, or check pH. Open a fish for health, hunger, size, nickname, and notes. 
If fishes are not moving, 
on Windows, check settings >accessibility >visual effects >animation effects 
Turn on animation effects. 
On a MacBook, System Settings> Accessibility> Display> reduce motion
Turn Reduce motion off.
**Decorate** to drag items. Remove a fish or an item to refund it.
4. **Shop (`/browse`).** 
Pick the destination tank, filter by Fish, Plants, Decor, or Equipment, open an item for its care data and effects, and add it.
5. **Quiz (`/quiz`, `/quiz/play`).** 
The daily five questions. Each answer shows whether it was right and a short fact. Results show pearls earned and the streak.
6. **History (`/history`).** 
Purchases, rewards, refunds, and gifts, newest first.
7. **Friends (`/friends`).** 
Requests, invite links, visits, gifts, comments, reminders, and the inbox.
8. **Profile (`/profile`).** 
Level, badges, and tanks. Edit name, email, and profile picture.

The layout uses the Bootstrap 5 grid, so cards stack on a phone and sit side by side on a wider screen. The navbar collapses to a menu on small screens. Extra rules in [`client/src/styles/theme.css`](client/src/styles/theme.css) adjust spacing and the tank scene.

## Use our deployed web app

Open <your Vercel URL> and sign up with a fake email address. You do not need to install anything.

E2E tests do not run against this site because they need direct database access. To run them, set up the app locally and follow [step 7](#7-run-the-tests).




## Host it locally

The app is set up to run on your own machine. The client calls `http://localhost:8000`, and the server accepts the browser at `http://localhost:5173`. After [step 6](#6-run-the-app), open:

**[http://localhost:5173](http://localhost:5173)**

Create a new account on the Login page with **Don't have an account? Sign up**.

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
The Atlas cluster is free with 512MB of storage by default but you can choose to upgrade it for a subscription fee.
3. Under **Network Access**, allow your current IP address. The server cannot connect until Atlas allows that address.
To allow other users to access the same database, on the left sidebar, go to security> Database and Network Access> IP Access List and add IP address 0.0.0.0/0
4. Choose **Connect** and copy the SRV connection string. You will paste it into `.env` in the next step. Put the database name in the path, for example `aqualife`.



## 4. Set your environment variables

Create a file named `.env` inside the `server` folder:

```env
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_URI=your_mongodb_URI
SESSION_SECRET=replace-with-any-long-random-string
```

`.env` stays out of Git. Never commit the real connection string or `SESSION_SECRET`.

## 5. Set up the shop catalogue

Run these in order from the Aqualife root folder. The server does not need to be running.

```bash
cd server
node seed-products.js
node import-shop-fish.js
node update-fish-care.js
node update-fish-care.js --apply
cd ..
```

This creates 63 products: 50 fish, 4 plants, 6 decor items, and 3 equipment items. You can safely run these commands again.


## 6. Run the app

The backend and the frontend are two processes. Start the backend first. Every page asks the server whether you are logged in before it loads.

**Terminal 1 — backend (port 8000)**
From AquaLife root folder,
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
### What's in the suite
All files below are located in `client/e2e/`.

| File | What it covers |
| --- | --- |
| `account-defaults.spec.js` | Checks that new accounts start with 500 pearls, level 1, 0 XP and one empty tank, including after reload and logging in again. |
| `auth.spec.js` | Tests valid login, incorrect passwords, unknown emails, logout and redirects to login when accessing protected pages while logged out. |
| `badges.spec.js` | Checks the Bronze First Fin badge on Quiz and Profile, including persistence after reload and logging in again. |
| `care-guide-2.spec.js` | Tests fixing low tank temperature by buying a heater through the care guide. |
| `care-tasks-2.spec.js` | Checks care task rewards, no rewards for empty tanks, daily reward limits and separate rewards for each tank. |
| `compatibility.spec.js` | Tests compatibility warnings, creating a second tank, adding incompatible fish anyway and cancelling without changing account or tank data. |
| `date-rollover.spec.js` | Checks that care tasks reward pearls again the next day and the quiz streak increases to two days. |
| `friends.spec.js` | Tests friend requests, invite links, read-only tank visits, comments, reminders, pearl gifts and blocking gifts above the available balance. |
| `pearls.spec.js` | Tests low-balance warnings, insufficient-balance purchases, exact-balance purchases and cancelling purchase confirmations. |
| `profile.spec.js` | Tests profile picture changes, name and email updates, invalid-input handling and persistence after reload. |
| `quiz.spec.js` | Tests real daily quiz loading, controlled scoring and rewards using mocked questions, practice attempts without extra rewards and quiz rewards in History. |
| `removal.spec.js` | Tests fish and item refunds, refund records in History and whether tank readings reset after removing the last fish. |
| `shop.spec.js` | Tests fish and item purchases, correct charges and quantities, persistence after reload, History records and category and care level filters. |
| `signup.spec.js` | Tests registering a new account and opening the Dashboard. |
| `helpers.js` | Provides fresh test-account registration and a shared Playwright test fixture that automatically deletes each test's accounts and related data afterwards. |
| `shop-helpers.js` | Provides shared navigation, balance checks, item purchases and History table helpers. |
| `products.js` | Defines known product IDs, names and prices used across the tests. |
| `cleanup.js` | Tracks test accounts and provides cleanup after all tests in a file, restricted to databases whose names start with `aqualife_test_`. |

Read `helpers.js` and `shop-helpers.js` first to understand the shared setup and common actions. Test files reuse these helpers instead of repeating registration, navigation and purchase steps.

### One-time setup

Install the browser binaries for the Playwright version in this project (only required once per machine):

```bash
cd client
pnpm exec playwright install
cd ..
```

### Run the tests

If you intend to do E2E testing now,
Ctrl C any server or client that is currently running.

The E2E testing will be using a separate section in the same cluster.
In the .env file in the server folder, using the same mongodb link that you have created for Aqualife, add this to the end of the link, replace "yourname" with your name with no spacing:
MONGODB_URI=mongodb+srv://<user>:<password>@aqualife-database.<some_string>.mongodb.net/aqualife_test_yourname

now in command line in vs code, from the AquaLife root folder, run
```bash
cd server
node seed-products.js
cd ..
```

check that you are at AquaLife folder, type
```bash
cd client 
pnpm playwright test          # run the full suite headlessly or
pnpm playwright test --ui     # run interactively in Playwright's UI mode
#run all tests by clicking the green triangle play button at the top along the tests row.
pnpm playwright show-report   # open the HTML report from the last run
```


after testing, to make sure all E2E test accounts created during the testing are deleted,
in the same terminal
press ctrl+C
```bash
cd ../server
node delete-e2e-users.js
```
After testing, remove "/aqualife_test_yourname" from the MongoDB URI in the .env file, so that you can continue to use the app normally.



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





## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | Vue 3 (`<script setup>`), Vue Router, Bootstrap 5, axios, Lucide icons |
| Backend | Node.js, Express, express-session, bcrypt |
| Database | MongoDB (Atlas) via Mongoose. Sessions live in the same database. |
| Build tool | Vite |
| E2E tests | Playwright |
| Package manager | pnpm |



## External APIs

The server calls these from [`server/routes/species-routes.js`](server/routes/species-routes.js). 

| API | Endpoint | What it provides | Where it shows up |
| --- | --- | --- | --- |
| GBIF Species API | `GET https://api.gbif.org/v1/species/match?name=…` | Exact species match, scientific name, family, genus | Shop details and quiz taxonomy questions |
| iNaturalist | `GET https://api.inaturalist.org/v1/taxa` and, when needed, `GET https://api.inaturalist.org/v1/observations` | Common name and a Creative Commons photo with credit | Shop details and "which fish is this?" quiz questions |
| Aquarist Atlas | `GET https://www.aquaristatlas.com/api/v1/species/<slug>.json` | Temperature and pH ranges, and a maximum size when the record has one | Shop details and quiz temperature and pH questions |

- The shop catalogue itself is stored in MongoDB.

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






## AI/LLM disclosure

The running app does not call an AI or LLM service. Quiz questions are filled in from fixed templates and the species data above.

[`server/server.js`](server/server.js) already notes that its boilerplate was generated with AI assistance

We used AI to:

- research on the best colour scheme for aquarium-themed apps.
- research on best practices for app designs.
- research for APIs that we can connect to get useful fish information and pictures
- explain coding errors and debugging hints, and learn from our mistakes.
- suggest pearl prices for each different fish species
- help for debugging
- outline for README
- aided in deployment steps 


