# Warehouse Management System

## Project Overview

A web application for managing warehouses, the storage spaces inside them and
the items stored in them. It tracks capacity at both warehouse and
storage-space level, records exactly where every unit is stored, and keeps a
full history of stock movements. Two roles — **Admin** and **Staff** — get
different levels of access.

## Live Demo

**Live Application:** [https://warehouse-system-app.vercel.app](https://warehouse-system-app.vercel.app)

Hosted on Vercel, using a Neon PostgreSQL database in production.

**Demo logins:**

| Role | Email | Password |
| --- | --- | --- |
| Admin | `rakhi@gmail.com` | `rakhi@123` |
| Staff | `jack@gmail.com` | `jack@123` |


## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **PostgreSQL 16** with **Drizzle ORM** (schema, migrations and integrity triggers)
- **Better Auth** for email/password authentication and role-based access
- **Zod** for input validation
- **Tailwind CSS 4**, **Framer Motion**, **Recharts** and **Lucide** icons
- **Groq** (LLM API) for the AI features
- **pnpm** as the package manager
- **Docker Compose** for the local database, and optionally the whole app
- **Vercel** for hosting, **Neon** for the production database

## Architecture at a Glance

```
Browser  →  Next.js (App Router, server actions + API routes)  →  PostgreSQL
```

- The UI is server-rendered with Next.js; most actions (create, allocate,
  move, dispatch) are **server actions** rather than a separate REST API.
- **Drizzle ORM** defines the schema and generates SQL migrations.
- Business rules (capacity limits, storage-type compatibility, allocation
  limits) are checked **twice**: once in the application layer, and again by
  **PostgreSQL triggers**, so the database can never end up in an invalid
  state even if a bug slips past the application checks.
- **Better Auth** handles sessions and roles; every server action and page
  re-checks the caller's role on the server, not just in the UI.

The app can run in three environments — local development, local Docker, and
Vercel/Neon production — see [Setup](#setup) and
[How the database connection works](#how-the-database-connection-works)
below.

## Key Features

- **Warehouses** — create, edit and delete warehouses with a name, location,
  capacity and an Active/Inactive status. A warehouse can't be deleted while
  it holds stock; set it Inactive instead.
- **Storage spaces** — add spaces to a warehouse with a name, description,
  storage type (Normal, Cold storage, Secure, Hazardous) and capacity.
- **Items** — manage items with a name, unique SKU, description, total
  quantity owned, and the storage type they require.
- **Allocation & split allocation** — place an item's units into one or more
  storage spaces in a single submission, then move, correct (adjust) or
  dispatch stock afterwards.
- **Capacity tracking** — live used/available capacity for every warehouse
  and storage space, with alerts when a space is nearly full.
- **Activity log** — every receipt, move, correction and dispatch, filterable
  by warehouse, item, person and date range, plus a per-type summary.
- **Dashboard** — key figures, capacity charts, items-by-allocation-status
  chart, nearly-full alerts and recent activity.
- **AI features** (see below) — a read-only data assistant, AI-suggested form
  values, and an AI warehouse health summary.
- **CSV export** of the inventory, respecting the filters set on the Items page.
- **Light and dark themes.**

## Authentication & Roles (RBAC)

RBAC (Role-Based Access Control) means each signed-in user can only do what
their role allows. This project has two roles:

| Action | Admin | Staff |
| --- | --- | --- |
| View warehouses, storage spaces, items and activity | Yes | Yes |
| Create and edit warehouses, storage spaces and items | Yes | Yes |
| Receive, move, adjust and dispatch stock | Yes | Yes |
| Delete warehouses, storage spaces and items | Yes | No |
| Manage users and roles | Yes | No |

Every rule above is enforced **on the server** for every action; the
interface only hides buttons a role can't use, as a convenience.

**How accounts work:**

1. There is **no public sign-up**. The first administrator is created once,
   from the command line, when the project is first set up (see
   [SETUP.md](./SETUP.md)).
2. An administrator signs in and creates staff accounts from the **Users**
   page, generating a temporary password for each one.
3. The new user signs in with that temporary password and is required to set
   their own password before they can use the rest of the app.

## AI Features

The AI features use the **Groq** API and are entirely optional — the app
works normally if `GROQ_API_KEY` is left blank, except for these three
features:

- **AI assistant** — a read-only chat assistant that can answer questions
  about the live data (e.g. "which items still need to be allocated?",
  "which storage spaces are nearly full?"). It can only look data up; it
  cannot create, edit or delete anything.
- **AI form suggestions** — when adding an item or a storage space, the AI
  can suggest reasonable field values (e.g. a description or storage type)
  based on what you've typed so far. Suggestions are only ever saved if you
  accept them through the normal form.
- **AI warehouse health summary** — a short, generated summary of overall
  warehouse status (capacity pressure, unallocated stock, etc.) shown on the
  dashboard.

## Main Modules

| Page | Purpose |
| --- | --- |
| Dashboard | Key figures, charts, nearly-full alerts, recent activity |
| Warehouses | Manage warehouses and their status |
| Storage Spaces | Manage spaces inside a warehouse |
| Items | Manage items, their SKU and required storage type; CSV export |
| Allocations | Allocate, move, adjust and dispatch stock |
| Activity | Full, filterable stock-movement history |
| Users | Admin-only: create staff accounts and manage roles |
| Settings | Change your own password |

## Data Model

```
Warehouse ──< Storage Space ──< Allocation >── Item
```

- A **warehouse** contains many **storage spaces**.
- An **item** records the total quantity the business owns.
- An **allocation** stores how many units of one item sit in one storage
  space (at most one allocation per item/space pair).
- **Split storage**: one item can have allocations across several storage
  spaces, in the same or different warehouses. Units not yet placed anywhere
  show as remaining (`remaining = total − allocated`).
- Every stock change is written to an append-only **stock movements** table,
  which stays readable even after the item or space it refers to is deleted.

## Key Business Rules

- A storage space can never exceed its own capacity, and the storage spaces
  in a warehouse can never exceed the warehouse's capacity.
- Capacity can never be reduced below what is already stored or assigned.
- An allocation can never exceed an item's unallocated units, and an item's
  total can't drop below what's already allocated.
- A split allocation across several spaces is all-or-nothing: every line is
  validated before anything is saved, and concurrent requests are protected
  by database row locks.
- SKUs are unique (ignoring case); storage-space names are unique within a
  warehouse.
- **Storage-type compatibility:**

  | Item needs | Can be stored in |
  | --- | --- |
  | Normal | Normal, Cold storage, Secure |
  | Cold storage | Cold storage only |
  | Secure | Secure only |
  | Hazardous | Hazardous only |

- A storage space holding stock, or an item with units allocated, cannot be
  deleted.

These rules are enforced in the application code **and** by PostgreSQL
triggers, so they hold even under concurrent use.

## Setup

Full, step-by-step instructions (for Windows, macOS and Linux) are in
[SETUP.md](./SETUP.md). In short:

```bash
pnpm install
cp .env.example .env       # then fill in the values, see SETUP.md
docker compose up -d db    # start PostgreSQL
pnpm db:migrate             # create the tables
pnpm create-admin           # create the first admin account
pnpm dev                    # start the app on http://localhost:3001
```

An optional **Full Docker** mode (Next.js and PostgreSQL both in containers)
and optional demo data are also covered in [SETUP.md](./SETUP.md).

## How the Database Connection Works

The app can connect to two different local addresses for the same
PostgreSQL container, depending on where Next.js itself is running:

| Where Next.js runs | Database address | When it's used |
| --- | --- | --- |
| On your computer (`pnpm dev`) | `localhost:5434` | Standard local development |
| Inside Docker | `db:5432` | Full Docker mode only |

`db:5432` is a Docker-internal address that only works from one container to
another — it will never work from your computer's browser or terminal. Your
local `.env` file should always use `localhost:5434`.

In production, neither address is used: Vercel connects to a separate Neon
PostgreSQL database using a `DATABASE_URL` configured in the Vercel project,
not in any local file.

## Deployment (Production)

The live app is deployed on **Vercel**, connected to a **Neon** PostgreSQL
database, with environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GROQ_API_KEY`) configured in the
Vercel project rather than committed to the repository.

A couple of things worth knowing:

- Vercel **does not** run database migrations automatically. After a schema
  change, migrations must be applied to Neon manually
  (`pnpm db:migrate` with `DATABASE_URL` pointed at Neon).
- The first administrator account on a fresh database is also created
  manually (`pnpm create-admin`), the same way as in local setup, since
  there is no public sign-up.

This is provided for context; it is **not** something an evaluator needs to
do — the live link above already points at a working deployment.

## Important Notes

- Local Docker PostgreSQL and production Neon PostgreSQL are **completely
  separate databases** — nothing you do locally affects the live demo.
- `.env` is never committed (it's in `.gitignore`) and should never contain
  production credentials.
- The AI features require a Groq API key; without one, the rest of the app
  still works normally.