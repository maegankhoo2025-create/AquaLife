# AquaLife server

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
5. `node seed-products.js` adds missing catalogue items without deleting existing products or changing their prices/photos.
6. `pnpm dev`
7. Open http://localhost:8000/api/health and you should see `{"status":"ok","db":"connected"}`.

## Branches

- `main`: always working; only merge tested code
- One branch per person/feature, e.g. `junying/aquarium-crud`, `yiming/auth`
- Open a pull request into `main`; your "Vet by" partner reviews it

## API (aquarium)

| Method | Route | Purpose |
|---|---|---|
| GET | /api/tanks | List the signed-in user's tanks |
| GET | /api/tanks/:id | Get one tank |
| POST | /api/tanks | Create a tank |
| PATCH | /api/tanks/:id/targets | Set temperature / pH / quality goals, not actual conditions |
| POST | /api/tanks/:id/fish | Add a fish |
| PATCH | /api/tanks/:id/fish/:fishId | Update an owned fish's nickname and/or private notes |
| DELETE | /api/tanks/:id/fish/:fishId | Remove a fish; refund living fish only |
| DELETE | /api/tanks/:id/decorations/:decorationId | Remove an installed item and stop its future effect |
| DELETE | /api/tanks/:id | Delete a tank |
| POST | /api/game/tasks/:taskId | Feed, clean, or check temperature/pH for one tank; each tank with living fish is rewarded once a day per task |
| GET | /api/game/care | Record today's care snapshot and return the rolling 14-day history |
| PATCH | /auth/profile | Update optional name/email/avatar fields; an empty avatar removes the picture |
| GET / POST | /api/quiz; /api/quiz/answer; /api/quiz/submit | Daily questions, first-choice answers and atomic rewards/streak bonuses |
| GET | /api/friends | Friends, requests, invitation token and received inbox messages |
| POST / PATCH | /api/friends/requests; /api/friends/requests/:id | Request friendship; accept/reject an incoming request |
| GET / POST | /api/friends/invitations/:token; /api/friends/invitations/:token/accept | Read invitation; explicitly accept it |
| GET | /api/friends/:friendId/tanks | Accepted-friends-only read-only tank previews and comments |
| POST | /api/friends/:friendId/gifts | Transfer whole positive pearls atomically with history for both users |
| POST | /api/friends/:friendId/reminders; /api/friends/:friendId/comments | Send a tank reminder/comment to the owner's inbox |
| PATCH | /api/friends/messages/:id/read | Mark a received inbox message read |
| DELETE | /api/friends/comments/:id | Delete a comment as its author or current tank owner, independent of friendship |