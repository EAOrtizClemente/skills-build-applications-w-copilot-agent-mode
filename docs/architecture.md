# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the UI as route-based React screens that fetch and render the backend data with explicit loading, empty, and error states so the app remains resilient while the API is being implemented.
- Logic tier decision: Keep Express route handlers thin and move business rules into clear service logic for activity validation, team creation, leaderboard aggregation, and workout suggestion matching.
- Data tier decision: Use Mongoose schemas for User, Team, Activity, and Workout with required fields, relationship references, and seed data that is idempotent and preserves existing records.
- Activity tracking approach: Accept `userId`/`teamId` values, validate them as ObjectIds, ensure both records exist, reject invalid inputs with 4xx responses, and compute `points` and `occurredAt` on creation.
- Team management approach: Require a team `name`, keep `mascot` and `members` as persisted fields, and store member references as ObjectIds while allowing listing of the team with member IDs included.
- Leaderboard approach: Aggregate activity points per team, sort descending by total points, and generate a 1-based rank in the response payload for the frontend to display.
- Workout suggestions approach: Match a user by email, inspect recent activity focus/goals, recommend workouts whose `focus` aligns to the user’s patterns, and return a helpful `reason` that references the motivating activity.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose schema contract and seed-data integrity. Failures here usually mean required fields, object references, or seeded relationships are not implemented correctly.
- API command: `npm run test:api --prefix octofit-tracker/backend` — exercises the Express routes and checks validation errors, ranking, and workout suggestions. Failures here point to logic-tier issues like bad status codes, missing team/user checks, or incorrect aggregation logic.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — verifies the React screens render API data with the expected accessible content, loading states, empty states, and alerts when the API fails.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — ensures TypeScript compiles cleanly for the MVC/data layer before feature work expands.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — confirms the React app compiles and type-checks with the route-based presentation structure.
