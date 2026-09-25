# CvSU &ndash; Bacoor City Campus | Queueing Management System

A full-stack queueing system for five campus offices (Registrar, Cashier, Admissions,
IT Help Desk, Clinic) with three interfaces: **Client Kiosk**, **Staff Dashboard**, and
**Public Display**, kept in sync in real time with Socket.IO.

```
cvsu-queue/
├── backend/     Node.js + Express + MySQL + Socket.IO + JWT API
└── frontend/    React + Vite + Tailwind CSS
```

## 1. Database setup

1. Create the database and tables:
   ```bash
   mysql -u root -p < backend/src/db/schema.sql
   ```
   This creates the `cvsu_queue` database, the five offices, their windows
   (3 for Registrar, 1 each for the rest), and the queue/staff/log tables.

2. Copy the backend env file and fill in your MySQL credentials:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. Seed sample staff accounts (one per office, password `password123`):
   ```bash
   npm install
   npm run seed
   ```
   Accounts created: `registrar1`, `cashier1`, `admissions1`, `ithelpdesk1`, `clinic1`.
   **Change these credentials before going live.**

## 2. Run the backend

```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

## 3. Run the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # http://localhost:5173
```

## 4. Using the system

| Interface | URL | Notes |
|---|---|---|
| Client Kiosk | `/` | Select an office &rarr; get a queue number &rarr; live position on `/ticket/:id` |
| Staff Login | `/staff/login` | Staff sign in with the seeded accounts |
| Staff Dashboard | `/staff` | Call Next, Serve, Complete, Skip, Recall |
| Public Display | `/display` | Put this on the lobby TV/monitor (full screen) |

## How the pieces fit together

- **Automatic window assignment.** Staff never pick a window. `POST /api/queues/staff/call-next`
  finds the office's oldest `WAITING` ticket and the lowest-numbered `AVAILABLE` window for
  that office (Registrar has 3, everyone else has 1) inside a single MySQL transaction with
  row locks (`FOR UPDATE`), so two staff clicking "Call Next" at the same moment can never
  grab the same ticket or window.
- **Queue lifecycle** matches the spec exactly:
  `WAITING → CALLED → SERVING → COMPLETED`, with `CALLED → SKIPPED → (recall) → CALLED`,
  and `CANCELLED` reachable from `WAITING` or `CALLED`. Every transition is written to
  `queue_logs` for an audit trail.
- **Real-time updates.** Every mutation broadcasts a `queue:update` event to two Socket.IO
  rooms: `office:<id>` (that office's staff dashboard) and `public-display` (the lobby
  screen and any client ticket page currently open). Calling/recalling a ticket also fires
  a dedicated `queue:called` event that the public display uses to show a banner and play
  a chime.
- **Daily numbering.** Queue codes (`REG-001`, `CAS-001`, &hellip;) reset each day &mdash;
  `sequence_no` is scoped by `queue_date`, computed from `MAX(sequence_no)` for that office
  and day inside the same locked transaction as ticket creation.
- **JWT auth.** Staff log in with `POST /api/auth/login`; the token carries their
  `officeId`, so every staff action (`call-next`, `serve`, `complete`, `skip`, `recall`)
  is automatically scoped to their own office &mdash; there's no office picker on staff routes.

## Color theme

| Token | Hex | Use |
|---|---|---|
| CvSU Blue | `#0054A6` | Primary |
| CvSU Gold | `#FFC20E` | Accent / CALLED status |
| Background | `#F8FAFC` | App background |
| Text | `#0F172A` | Body text |
| Muted text | `#64748B` | Secondary text |
| Border | `#E2E8F0` | Card borders |
| WAITING | Blue | |
| CALLED | Gold | |
| SERVING / COMPLETED | Green | |
| SKIPPED | Orange | |
| CANCELLED | Red | |

All tokens are wired into `frontend/tailwind.config.js` as `cvsu.blue`, `cvsu.gold`,
`surface.bg`, `ink`, `ink.muted`, `border`, and `status.*`.

## Notes / next steps

- Passwords are hashed with bcrypt; rotate `JWT_SECRET` and the seeded passwords before
  deployment.
- The public display polls `/api/queues/display` once on load and otherwise relies purely
  on Socket.IO pushes &mdash; no polling loop, so it scales to a TV left on all day.
- To add a new office, insert a row into `offices` (with its `window_count`) and matching
  rows into `windows`; the rest of the system picks it up automatically.
