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
| GET | /api/tanks | List the signed-in user's tanks |
| GET | /api/tanks/:id | Get one tank |
| POST | /api/tanks | Create a tank |
| PATCH | /api/tanks/:id/targets | Set temperature / pH / quality goals, not actual conditions |
| POST | /api/tanks/:id/fish | Add a fish |
| PATCH | /api/tanks/:id/fish/:fishId | Update an owned fish's nickname and/or private notes |
| DELETE | /api/tanks/:id/fish/:fishId | Remove a fish; refund living fish only |
| DELETE | /api/tanks/:id/decorations/:decorationId | Remove a plant/decoration and stop its future effect |
| DELETE | /api/tanks/:id | Delete a tank |
| POST | /api/game/tasks/:taskId | Feed, perform a partial water change, or step heater/cooler toward a target |
| PATCH | /auth/profile | Update the signed-in user's name/email |
| GET / POST | /api/quiz; /api/quiz/answer; /api/quiz/submit | Daily questions, first-choice answers and atomic rewards/streak bonuses |
| GET | /api/friends | Friends, requests, invitation token and received inbox messages |
| POST / PATCH | /api/friends/requests; /api/friends/requests/:id | Request friendship; accept/reject an incoming request |
| GET / POST | /api/friends/invitations/:token; /api/friends/invitations/:token/accept | Read invitation; explicitly accept it |
| GET | /api/friends/:friendId/tanks | Accepted-friends-only read-only tank previews and comments |
| POST | /api/friends/:friendId/gifts | Transfer whole positive pearls atomically with history for both users |
| POST | /api/friends/:friendId/reminders; /api/friends/:friendId/comments | Send a tank reminder/comment to the owner's inbox |
| PATCH | /api/friends/messages/:id/read | Mark a received inbox message read |

All private operations use the current session, not a caller-supplied owner. The hourly aquarium simulation preserves its existing care-based health damage and per-fish waste rules. Fish/decoration refunds, care rewards, quiz rewards and gifts use MongoDB transactions.

## AI usage declaration (keep updated for README.txt)

- Project scaffold, server.js boilerplate, draft Tank schema and initial route stubs were generated with AI assistance. AI-assisted updates also include aquarium targets/care notes, profile editing, friendship/invitation/inbox flows, transactional pearl updates and quiz milestone rewards.
