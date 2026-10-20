<div align="center">

# ⏳ TimeLuxe

**Time tracking and pay settlement that speaks both dollars and Rials.**

A full-stack workspace where people log hours, managers invite teams, every amount keeps
its own currency, and payouts settle real hours instead of guessing in a spreadsheet.

[![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Mongoose-9-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

English · فارسی &nbsp;|&nbsp; USD · IRR · Dual &nbsp;|&nbsp; Jalali · Gregorian &nbsp;|&nbsp; Light · Dark

</div>

---

## ✨ Why it exists

Freelance teams in Iran and abroad work on the same job: one person tracks hours in
dollars, another tracks them in Rials, and at the end of the month somebody has to work
out who is owed what. Most tools either force everything into one currency or quietly
multiply a Rial amount by the exchange rate — which inflates it 420,000×.

TimeLuxe was built around one rule: **an amount always keeps the currency of the rate
that produced it.** Dollars and Rials are never added into a fake total; the UI shows
them side by side, and conversion happens only in the display mode you pick.

## 🎯 Features

<table>
<tr><td width="50%">

**⏱ Time tracking**
- Log hours per day, personal or against a group
- Monthly / 30-day / custom date ranges
- Entries, totals and a day-by-day breakdown
- One click to delete an entry

**👥 Groups that a manager can actually manage**
- Create a group with its own hourly rate + currency
- Invite members by email, accept or decline from the list
- See pending invitations, cancel them, remove members
- Every member sees the roster; only the manager changes it

</td><td width="50%">

**💰 Money without guesswork**
- USD and IRR stored separately, never merged
- Report per member: hours, owed, paid, remaining, status
- Record a payout — partial amounts settle the oldest hours first
- Payout history per group and per person

**🌍 Built for real users**
- Full **Persian (فارسی)** UI, RTL layout and Persian month names
- **Jalali (Shamsi)** or Gregorian calendar, pickable per user
- Persian-digit date entry with a portal-based month grid
- Light / dark themes, dual-currency display mode in the navbar

</td></tr>
</table>

Also on board: **Exa-powered web search** inside the app, a public **Swagger UI** for the
API, animated pages (framer-motion), and a hand-tuned design system (JetBrains Mono for
numbers, tabular figures everywhere money appears).

## 🧠 The currency model (the important part)

```
amount  = hours × rate            stored in the CURRENCY OF THAT RATE
group entry  → group.hourlyRateCurrency   ('usd' | 'irr')
personal     → user.personalRateCurrency  ('usd' | 'irr')
payout       → same currency as the earnings it settles
```

- A 25,000,000 Rial entry is stored as `25000000` + `currency: 'irr'` — never converted.
- Summaries return a per-currency breakdown (`currencyTotals: { usd, irr }`).
- The navbar's display mode (`USD` / `IRR` / `Dual`) is the only place conversion happens,
  and it is display-only: the numbers in the database never change.
- Legacy rows without a stored currency resolve theirs from the related group or user.

## 🛠️ Tech stack

| Layer | Choice | Notes |
|---|---|---|
| API | **Express 5** (ESM) | JWT auth, Joi validation, Swagger docs |
| Database | **MongoDB + Mongoose** | Users, groups, time logs, payments, invitations |
| Client | **React 19 + TypeScript** | CRA, React Router 7, RTK Query |
| State | **Redux Toolkit** | Auth + UI slices, RTK Query cache invalidation |
| Forms | **Formik + Yup** | Validated, bilingual error messages |
| Styling | **Tailwind CSS** | Custom design tokens, dark mode via `class` |
| Motion | **framer-motion** | Staggered reveals, tilt cards, reduced-motion aware |
| Dates | **jalaali-js** | Jalali ⇄ Gregorian conversion and Persian digit entry |
| Search | **Exa** | Server-side only, key never reaches the browser |

## 📁 Project structure

```
time-management/
├── api/                          # Express + Mongoose backend
│   ├── server.js                 # boots app, dotenv, PORT
│   └── src/
│       ├── app.js                # middleware, routes, Swagger mount
│       ├── config/swagger.js     # OpenAPI spec
│       ├── models/               # User, Group, TimeLog, Payment, Invitation
│       ├── controllers/          # users, groups, time, payments, search
│       ├── routes/               # /api/users /groups /time /payments /search
│       ├── middlewares/          # protect (JWT), validate (Joi)
│       ├── validations/          # request schemas per route
│       └── services/             # Exa search integration
│
└── client/                       # React + TypeScript frontend
    └── src/
        ├── pages/                # Home, Dashboard, Groups, Group detail,
        │                         # Payments, Profile, Search, About, How-to, Contact
        ├── components/
        │   ├── common/           # JalaliCalendar, JalaliDateInput,
        │   │                     # JalaliDateRangePicker, CalendarChooser
        │   └── motion/           # TiltCard, Reveal, KineticHeading
        ├── store/                # Redux store, apiSlice (RTK Query), slices
        ├── hooks/                # useCalendar, useLanguage
        ├── utils/                # format (money), jalali, groupSchema
        └── translations/         # en.json, fa.json
```

## 🚀 Getting started

**Prerequisites:** Node.js 20+, npm, and a running MongoDB (`mongodb://localhost:27017`).

```bash
git clone https://github.com/arefhomayouni/time-management.git
cd time-management
```

### 1. Backend

```bash
cd api
cp .env.example .env         # then fill in the values
npm install
npm run dev                  # nodemon → http://localhost:3001
```

`api/.env`

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/time-management
JWT_SECRET=generate-a-long-random-string
EXA_API_KEY=                 # optional, enables the in-app web search
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm start                    # → http://localhost:3000
```

`client/.env`

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_BRAND=TimeLuxe
# REACT_APP_IRR_RATE=42000   # Toman per USD for display conversion (1 Toman = 10 Rials)
```

Then open **http://localhost:3000**, register an account, create a group and start
logging hours. Interactive API docs live at **http://localhost:3001/api-docs**.

## 📲 Installable PWA

TimeLuxe ships as an installable app: a web manifest, maskable icons and a service
worker that keeps visited pages available offline.

| File | Purpose |
|---|---|
| `client/public/manifest.json` | Name, theme, icons, app shortcuts (Dashboard / Groups / Payments) |
| `client/public/icons/` | SVG source plus 192/512 PNG icons, maskable variants, horizontal logo |
| `client/public/sw.js` | Precached shell, network-first navigations, cache-first hashed assets |
| `client/public/offline.html` | Fallback page for routes never visited |
| `client/src/pwa.ts` | Registration + “new version ready” signal |

Behaviour worth knowing:

- The service worker is registered **in production builds only**, so the CRA dev
  server and hot reload are untouched. Test it with `npm run build`, then serve
  `client/build` (for example `npx serve -s build`) over `localhost`.
- `/api/*`, non-GET requests and cross-origin traffic are never cached — data stays
  live.
- A rebuilt app installs a waiting worker; the UI shows a small “A new version is
  ready” banner with a Reload action.
- Bump `CACHE_VERSION` in `sw.js` when you change the precache list or caching rules.

## 📡 API reference

All protected routes expect `Authorization: Bearer <token>`. Full descriptions and
request/response schemas are in the Swagger UI.

<details>
<summary><b>Users & authentication</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Create an account (rate + currency optional) |
| POST | `/api/users/login` | Sign in, returns a JWT |
| GET | `/api/users/me` | Current user |
| PATCH | `/api/users/me` | Update username / email / personal rate |
| GET | `/api/users/invitations` | Pending group invitations |
</details>

<details>
<summary><b>Groups & membership</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/groups` | Create a group (creator becomes manager) |
| GET | `/api/groups/my-groups` | Groups you belong to (+ `isManager`) |
| GET | `/api/groups/:id` | Group details |
| PATCH | `/api/groups/:id` | Update name / rate / currency / budget |
| GET | `/api/groups/:id/members` | Members (visible to all members) |
| DELETE | `/api/groups/:id/members/:userId` | Remove a member (manager only) |
| POST | `/api/groups/invite` | Invite by email (manager only, no duplicates) |
| GET | `/api/groups/:id/invitations` | Pending invitations (manager only) |
| DELETE | `/api/groups/:id/invitations/:invId` | Cancel an invitation (manager only) |
| POST | `/api/groups/invitation/handle` | Accept or decline an invitation |
| GET | `/api/groups/:id/report` | Per-member report for a date range |
</details>

<details>
<summary><b>Time & payments</b></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/time/logs` | Log hours (optionally against a group) |
| GET | `/api/time/logs` | Your entries, filterable and sortable |
| DELETE | `/api/time/logs?id=…` | Delete one of your entries |
| GET | `/api/time/summary` | Totals for a range (+ per-currency breakdown) |
| GET | `/api/time/earnings?month=&year=` | Monthly earnings |
| POST | `/api/payments/pay` | Record a payout, settles hours oldest-first |
| GET | `/api/payments/my-payments` | Payouts you received |
| GET | `/api/payments/group/:groupId` | Payout history for a group (manager only) |
| GET | `/api/search?q=` | Exa web search (optional API key) |
</details>

## ✅ Scripts

| Where | Command | What it does |
|---|---|---|
| `api/` | `npm run dev` | API with auto-reload on :3001 |
| `api/` | `npm start` | API without auto-reload |
| `client/` | `npm start` | Dev server on :3000 with hot reload |
| `client/` | `npm run build` | Production build (treated as CI: warnings are errors) |
| `client/` | `npm test` | Jest test suite |

## 🗺️ Roadmap

- [ ] Group deletion and rename for managers
- [ ] Export a report period as CSV / PDF
- [ ] Email notifications for invitations and payouts
- [ ] Recurring budgets and monthly rollover
- [ ] Unit tests for the payout-settlement engine

## 🤝 Contributing

Issues and pull requests are welcome. Please keep the currency rule intact: **never add,
convert or overwrite an amount that carries a currency**, and keep new UI strings in both
`en.json` and `fa.json`.

## 📄 License

[ISC](https://opensource.org/licenses/ISC) © arefhomayouni

<div align="center">
Made with ⏳ for teams that bill in both dollars and Rials
</div>
