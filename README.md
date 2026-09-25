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
   (3 for Registrar, 1 each for the rest), and the queue/staff/log tables &mdash;
   `staff` already includes the `window_id` column used to bind an account to a
   fixed window (see "Admin panel" below).

   **Already have a database from before this update?** Don't re-run schema.sql
   (it would try to recreate existing tables). Run the migration instead:
   ```bash
   mysql -u root -p < backend/src/db/migrations/001_staff_window_binding.sql
   ```

2. Copy the backend env file and fill in your MySQL credentials:
   ```bash
   cd backend
   cp .env.example .env
   ```

3. Seed sample staff accounts (3 registrars, one per window, plus one account per other
   office, plus an admin account):
   ```bash
   npm install
   npm run seed
   ```
   See "Admin panel" below for the full list of seeded usernames.
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
| Staff Login | `/staff/login` | Staff and admins sign in here; admins land on `/admin`, staff on `/staff` |
| Staff Dashboard | `/staff` | Call Next, Serve, Complete, Skip, Recall |
| Admin Panel | `/admin` | Manage offices, windows, and staff accounts (see below) |
| Public Display | `/display` | Put this on the lobby TV/monitor (full screen) |

Seeded logins (from `npm run seed`): `registrar1` / `registrar2` / `registrar3` / `cashier1` /
`admissions1` / `ithelpdesk1` / `clinic1`, all password `password123`; admin account
`admin` / `admin123`.

## Admin panel

Sign in with an `ADMIN`-role account (the seed script creates one: `admin` / `admin123`) and
you're taken to `/admin` with three tabs:

- **Offices** &mdash; create a new office (code, name, prefix, starting window count) and
  activate/deactivate existing ones. Deactivating an office removes it from the kiosk and
  public display immediately; it also blocks new ticket creation at the API level.
- **Windows** &mdash; pick an office and add more windows, or take a window offline (blocked
  while it's `BUSY` serving someone) / bring it back `AVAILABLE`.
- **Staff** &mdash; create staff or admin accounts, optionally binding a staff account to one
  specific window (see below), deactivate accounts, and reset passwords.

### Staff accounts are bound to a specific window (optional)

Since Registrar has 3 physical windows staffed by 3 different people, each registrar gets
their own account (`registrar1`, `registrar2`, `registrar3`&hellip;) and each one is bound to
a fixed `window_id`. When a bound account clicks **Call Next**, the system calls to *that*
window only &mdash; if it's still busy, the button is disabled rather than silently grabbing
someone else's window. Their dashboard header shows "You call to Window 2" so it's obvious
which desk they're wired to.

An account with no window assigned (leave "Window" as "Auto-assign" when creating it) falls
back to the original behavior: the lowest-numbered free window in that office. This is handy
for a single-window office, or a float/relief staffer who isn't tied to one desk.

## How the pieces fit together

- **Automatic window assignment.** By default, staff never pick a window. `POST /api/queues/staff/call-next`
  finds the office's oldest `WAITING` ticket and the lowest-numbered `AVAILABLE` window for
  that office inside a single MySQL transaction with row locks (`FOR UPDATE`), so two staff
  clicking "Call Next" at the same moment can never grab the same ticket or window. If a
  staff account is bound to a specific window (see "Admin panel"), it calls to that window
  only instead of picking any free one &mdash; this is how 3 registrars sharing 3 windows
  each get their own dedicated desk.
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
