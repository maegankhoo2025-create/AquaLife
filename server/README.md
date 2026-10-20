# AquaLife

Gamified virtual aquarium for aspiring fish owners (IS216 G8 T2).

## Structure

```
aqualife/
  client/   Vue front end (Maegan)
  server/   Express + MongoDB back end
    models/   Mongoose schemas
    routes/   API routes (one file per feature)
```

## Run the back end locally

1. Install Node.js 22.18+ and pnpm (`npm install -g pnpm`), plus a MongoDB replica set (or a free MongoDB Atlas cluster). Purchases use transactions, which standalone MongoDB does not support.
2. `cd server`
3. `pnpm install`
4. Create `server/.env` with `MONGODB_URI` and `SESSION_SECRET`.
5. `pnpm dev`
6. Open http://localhost:8000/api/health and you should see `{"status":"ok","db":"connected"}`.

## Branches

- `main`: always working; only merge tested code
- One branch per person/feature, e.g. `junying/aquarium-crud`, `yiming/auth`
- Open a pull request into `main`; your "Vet by" partner reviews it

## API (aquarium)

| Method | Route | Purpose |
|---|---|---|
| GET | /api/tanks?owner=ID | List a user's tanks |
| GET | /api/tanks/:id | Get one tank |
| POST | /api/tanks | Create a tank |
| PATCH | /api/tanks/:id/conditions | Update temperature / pH / water quality |
| POST | /api/tanks/:id/fish | Add a fish |
| DELETE | /api/tanks/:id/fish/:fishId | Remove a fish |
| DELETE | /api/tanks/:id | Delete a tank |

## AI usage declaration (keep updated for README.txt)

- Project scaffold, server.js boilerplate, draft Tank schema and route stubs were generated with AI assistance. Route logic is written by the team.
