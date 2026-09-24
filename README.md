# Warehouse Management System

## Project Overview

A web application for managing warehouses, the storage spaces inside them and
the items they hold. It tracks capacity at warehouse and storage-space level,
records where every unit is stored, and keeps a full history of stock
movements, with separate permissions for administrators and staff.

## Live Demo

**Live Application:** [https://warehouse-system-app.vercel.app](https://warehouse-system-app.vercel.app)

The application is hosted on Vercel and uses a Neon PostgreSQL database in
production.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **PostgreSQL 16** with **Drizzle ORM** (schema, migrations and integrity triggers)
- **Better Auth** for email/password authentication and roles
- **Zod** for validation
- **Tailwind CSS 4**, **Framer Motion**, **Recharts** and **Lucide** icons
- **Groq** for the AI features
- **pnpm** as the package manager
- **Docker Compose** for local PostgreSQL and optional full application containerization
- **Vercel** for hosting and **Neon** for the production database

## Features

- **Warehouses**: create, edit and delete warehouses with a name, location,
  capacity and an active/inactive status.
- **Storage spaces**: add spaces to a warehouse with a name, description,
  storage type (Normal, Cold storage, Secure, Hazardous) and capacity.
- **Items**: manage items with a name, unique SKU, description, total quantity
  and required storage type.
- **Allocation and split allocation**: place an item's units into one or more
  storage spaces in a single submission; move, correct and dispatch stock.
- **Capacity tracking**: used and available capacity for every warehouse and
  storage space, with alerts for nearly full spaces.
- **Authentication and roles**: email/password sign-in with Admin and Staff
  roles. There is no public sign-up; administrators create staff accounts with
  a temporary password that must be changed at first sign-in. The initial
  administrator was created during the production database setup.
- **Activity log**: every allocation, move, correction and dispatch, with
  filters by type, warehouse, item, person and date.
- **Dashboard**: key figures, capacity charts, items by allocation status and
  recent activity.
- **AI features**: a read-only assistant that answers questions about the live
  data, AI suggestions when adding items and storage spaces, and an AI
  warehouse health report.
- **CSV export** of the inventory as filtered on the Items page.
- **Light and dark themes.**

## Setup

The project supports both standard local development and full Docker
execution. Docker is provided for reproducible local execution and PostgreSQL,
and the project can also run the complete application inside Docker. Docker is
not mandatory: Next.js can run directly with Node.js and pnpm, and PostgreSQL
can run in Docker Compose or come from your own installation.

| | Standard local development | Full Docker |
| --- | --- | --- |
| On the host | Node.js + pnpm + Next.js | Docker only |
| In Docker | PostgreSQL | Next.js + PostgreSQL |
| PostgreSQL address used by Next.js | `localhost:5434` | `db:5432` |
| Application | http://localhost:3001 | http://localhost:3001 |

**Standard local development** (Next.js on the host, PostgreSQL in Docker):

```bash
docker compose up -d
pnpm install
pnpm db:migrate
pnpm create-admin
pnpm dev
```

The host-side `DATABASE_URL` points at the port Docker exposes:
`postgresql://postgres:postgres@localhost:5434/warehouse_management`.

**Full Docker** (Next.js and PostgreSQL both in Docker):

```bash
docker compose up -d
docker compose run --rm migration
docker compose run --rm admin
```

`docker compose up -d` does not run migrations, create an administrator or
load demo data; each of those is a separate command. Inside Docker the
application reaches PostgreSQL through the service name `db` on the internal
port: `postgresql://postgres:postgres@db:5432/warehouse_management`. `db:5432`
works only between Docker containers; `localhost:5434` is for Next.js running
directly on the host.

**Optional demo data and clearing.** Demo data is never created automatically.

| | Standard local development | Full Docker |
| --- | --- | --- |
| Load demo data | `pnpm db:seed` | `docker compose run --rm seed` |
| Clear inventory data | `pnpm db:clear` | `docker compose run --rm clear` |

Seeding replaces all inventory data (warehouses, storage spaces, items,
allocations and movement history). Clearing deletes the same data without
loading anything. User accounts are kept in both cases. Use them only on a
local or test database.

For prerequisites, environment variables, database setup, migrations,
administrator creation, optional seed data, and detailed run instructions, see
[SETUP.md](./SETUP.md).

## Data Model

```
Warehouse ──< Storage Space ──< Allocation >── Item
```

- A **warehouse** contains many **storage spaces**.
- An **item** records the total quantity the business owns.
- An **allocation** stores how many units of one item sit in one storage
  space. There is at most one allocation per item and storage space.
- **Split storage**: one item can have allocations in several storage spaces,
  in the same or different warehouses. Units not yet allocated are shown as
  remaining (`remaining = total - allocated`).
- Every stock change is written to **stock movements**, an append-only history
  that stays readable after records are deleted.

## Key Business Rules

- A **warehouse cannot be deleted while it holds stock**; it can be set to
  inactive instead. Inactive warehouses receive no new stock or storage spaces.
- A **storage space cannot exceed its capacity**, and the capacity of all
  storage spaces cannot exceed the warehouse's capacity.
- Capacity can never be reduced below what is already stored or assigned.
- **Allocation** can never exceed the item's unallocated units, and an item's
  total cannot drop below what is already allocated.
- **Split allocation** across several spaces is all or nothing: every line is
  validated before anything is saved. Concurrent requests are protected by row
  locks.
- **SKUs are unique** (ignoring case). Storage-space names are unique within a
  warehouse.
- **Storage-type compatibility**:

  | Item needs | Can be stored in |
  | --- | --- |
  | Normal | Normal, Cold storage, Secure |
  | Cold storage | Cold storage only |
  | Secure | Secure only |
  | Hazardous | Hazardous only |

- Storage spaces holding stock, and items with units allocated to storage
  spaces, cannot be deleted.

Capacity, compatibility and quantity rules are enforced in the application and
again by PostgreSQL triggers.

## Roles

| Action | Admin | Staff |
| --- | --- | --- |
| View warehouses, storage spaces, items and activity | Yes | Yes |
| Create and edit warehouses, storage spaces and items | Yes | Yes |
| Allocate, move, correct and dispatch stock | Yes | Yes |
| Delete warehouses, storage spaces and items | Yes | No |
| Manage users and roles | Yes | No |

Permissions are enforced on the server; the interface also hides actions a
role cannot use.

## Assignment Notes

Beyond the core requirements, the project also implements:

- Activity log of all stock movements, with filters
- Dashboard with capacity and allocation charts, and nearly-full alerts
- Move, quantity correction and dispatch operations
- Warehouse active/inactive status
- Forced password change for new accounts
- AI assistant, AI form suggestions and AI health report
- CSV inventory export
- Database-level integrity triggers and row locking for concurrent requests

## Environments

The project runs in three separate environments:

```
Local development:  Node.js + pnpm  →  Next.js  →  Docker PostgreSQL  (localhost:5434)
Full Docker:        Docker          →  Next.js  →  Docker PostgreSQL  (db:5432)
Production:         Vercel          →  Next.js  →  Neon PostgreSQL
```

- Next.js running directly on the host connects to Docker PostgreSQL through
  `localhost:5434`.
- Next.js running inside Docker connects to PostgreSQL through `db:5432`,
  which is valid only between Docker containers.
- Production runs on Vercel with Neon PostgreSQL. It does not use the local
  Docker setup.
- Local Docker PostgreSQL and production Neon PostgreSQL are completely
  separate databases.

The local `.env` file is used only for local development and never contains
production credentials. Production environment variables are configured in
Vercel, so production credentials are never committed to the repository.

## Deployment

The application is deployed on Vercel with Neon PostgreSQL as the production
database.

### 1. Push the project to GitHub

Push the application source code to a GitHub repository.

### 2. Create and connect the Vercel project

Import the GitHub repository into Vercel and configure the project as a
Next.js application.

### 3. Connect Neon PostgreSQL

Connect a Neon PostgreSQL database to the Vercel project using the Neon
integration. Vercel provides the production `DATABASE_URL` through the
project's environment configuration.

### 4. Configure production environment variables

Add the required production variables in Vercel (**Settings** →
**Environment Variables**):

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Provided by the Neon integration |
| `BETTER_AUTH_SECRET` | A private random string, set in Vercel only |
| `BETTER_AUTH_URL` | `https://warehouse-system-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://warehouse-system-app.vercel.app` |
| `GROQ_API_KEY` | Groq API key for the AI features, set in Vercel only |

Secret values are never stored in the repository or shown in this document.

### 5. Prepare the production database

This is a one-time preparation of the production Neon database. It has two
separate operations: applying the migrations, then creating the initial
administrator. Both must run against the Neon database, not the local Docker
database, and a Vercel deployment performs neither of them.

**Apply the Drizzle migrations.** Run the migration with `DATABASE_URL` set to
the production Neon connection string:

```bash
pnpm db:migrate
```

**Create the initial administrator.** This is a separate step. The application
has no public sign-up and the migrated database contains no account, so create
the administrator once:

```bash
pnpm create-admin
```

It prompts for the email, password and name, and reads the same
`DATABASE_URL`, so it must also point at the Neon database. Do not store the
credentials in the repository.

To target Neon without editing the local `.env`, set `DATABASE_URL` to the Neon
connection string only for that terminal session; a variable that is already
set takes precedence over `.env`. The local `.env` stays unchanged for local
development. The Docker service commands (`migration`, `admin`, `seed`,
`clear`) are for local Docker only and are not used for production.

> **Database schema changes:** Vercel deploys code changes automatically, but
> it does not run Drizzle migrations. When the database schema changes,
> generate a new Drizzle migration and apply it to the production Neon
> database before using the updated schema in production.

Optionally, demo inventory data can be loaded with:

```bash
pnpm db:seed
```

This loads demo warehouses, storage spaces and items. It is optional, is never
run automatically, and needs an administrator to exist already. It replaces
all existing inventory data (warehouses, storage spaces, items, allocations
and movement history), so it must not be run against a production database
that holds real data.

### 6. Deploy

Deploy or redeploy the Vercel project so it uses the configured environment
variables, then verify the live application at
[https://warehouse-system-app.vercel.app](https://warehouse-system-app.vercel.app).

### 7. Future deployments

After the initial deployment, every change pushed to the `main` branch
automatically triggers a new Vercel deployment.

### Troubleshooting

**Production (Vercel)**

| Problem | Fix |
| --- | --- |
| Signing in fails, or it keeps returning to the login page | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must be `https://warehouse-system-app.vercel.app` (`https`, no trailing slash). Correct them in Vercel and redeploy. |
| There is no account to sign in with | The migrated database contains no accounts. Create the initial administrator (see step 5). |
| Errors about a missing table or column | The production migrations have not been applied to Neon. Apply them (see step 5). |
| The AI assistant answers with an error | `GROQ_API_KEY` is missing or invalid in Vercel. Correct it and redeploy. |
| Changed an environment variable but nothing happened | Environment variable changes only apply to new deployments. Redeploy the project. |

**Local**

| Problem | Fix |
| --- | --- |
| Signing in fails locally | `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `.env` must match the address in the browser, `http://localhost:3001`, port included. |
| The application cannot reach the database | Next.js on the host uses `localhost:5434`; Next.js inside Docker uses `db:5432`. PostgreSQL must be running first (`docker compose up -d`). |
| Errors about a missing table or column | The migrations have not been applied. Run `pnpm db:migrate`, or `docker compose run --rm migration` in full Docker. |