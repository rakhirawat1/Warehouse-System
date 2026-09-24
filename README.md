# Warehouse Management System

## Project Overview

A web application for managing warehouses, the storage spaces inside them and
the items they hold. It tracks capacity at warehouse and storage-space level,
records where every unit is stored, and keeps a full history of stock
movements, with separate permissions for administrators and staff.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript**
- **PostgreSQL 16** with **Drizzle ORM** (schema, migrations and integrity triggers)
- **Better Auth** for email/password authentication and roles
- **Zod** for validation
- **Tailwind CSS 4**, **Framer Motion**, **Recharts** and **Lucide** icons
- **Groq** for the AI features
- **Docker Compose** for the local database

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
  roles. There is no public sign-up; administrators create accounts with a
  temporary password that must be changed at first sign-in.
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

For installation, environment variables, database setup, migrations, seeding,
and running the application, see [SETUP.md](./SETUP.md).

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

- Storage spaces and items holding stock cannot be deleted.

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

## Deployment

The app runs on [Vercel](https://vercel.com) with a hosted PostgreSQL database
from [Neon](https://neon.tech). Both have free plans. You need a GitHub
account, a copy of this repository in it, and Node.js and pnpm on your computer
(see Quick start) to prepare the database.

### 1. Put the code on GitHub

Fork this repository, or push your own copy to a GitHub repository you own.

### 2. Create the Vercel project

1. Sign in at [vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New** → **Project**, find your repository and click **Import**.
3. Choose the **project name** carefully: the site will be at
   `https://<project-name>.vercel.app`, and you need that address in step 4.
4. Leave the framework (Next.js) and the build settings as they are. Do not
   deploy yet; if Vercel starts a first deployment anyway, let it fail and
   carry on.

### 3. Create the database

1. In the Vercel project, open the **Storage** tab, click **Create Database**
   and choose **Neon** (Serverless Postgres).
2. Pick a region close to you, create it, and connect it to the project.
   Vercel adds the `DATABASE_URL` environment variable for you.
3. Open the database page and copy the **pooled connection string**. It looks
   like `postgresql://user:password@...neon.tech/neondb?sslmode=require`.
   Keep it private; you need it in step 6.

### 4. Add the environment variables

In the Vercel project, open **Settings** → **Environment Variables** and add
the following for the **Production** environment:

| Name | Value |
|---|---|
| `BETTER_AUTH_SECRET` | A new long random string (see below). Never reuse the local one. |
| `BETTER_AUTH_URL` | `https://<project-name>.vercel.app`, with no slash at the end |
| `NEXT_PUBLIC_APP_URL` | The same address |
| `GROQ_API_KEY` | A key from [console.groq.com/keys](https://console.groq.com/keys). The AI features fail without it. |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1`, so Vercel uses the pnpm version pinned in `package.json` |

`DATABASE_URL` is already there from step 3.

To generate the secret:

```bash
# macOS / Linux
openssl rand -base64 32
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

### 5. Set the Node.js version

Open **Settings** → **General** and set **Node.js Version** to **22.x** or
newer. pnpm 11 does not run on older versions.

### 6. Prepare the database

This is done once, from your computer, in the project folder after
`pnpm install`. Point `DATABASE_URL` at the Neon database for this terminal
only, then create the tables and the first administrator:

```bash
# macOS / Linux
export DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
```

```powershell
# Windows PowerShell
$env:DATABASE_URL = "postgresql://...neon.tech/neondb?sslmode=require"
```

Then, in the same terminal:

```bash
pnpm db:migrate
pnpm create-admin --email you@example.com --password "a-strong-password" --name "Your Name"
pnpm db:seed    # optional: demo warehouses, storage spaces and items
```

Close that terminal afterwards, so later commands do not run against the
production database by mistake.

### 7. Deploy

1. Open the **Deployments** tab, open the menu on the latest deployment and
   click **Redeploy**, so it picks up the environment variables. (If there is
   no deployment yet, push any commit to `main`.)
2. When it finishes, open `https://<project-name>.vercel.app`.

From now on, every push to `main` deploys automatically.

### 8. Check that it works

1. Sign in with the administrator from step 6.
2. Create a warehouse, a storage space and an item, then allocate some stock.
3. Open the AI assistant and ask a question, such as "Which spaces are nearly
   full?".
4. On the **Users** page, add a staff account and sign in with it in a private
   window to check the forced password change.

### Troubleshooting

| Problem | Fix |
|---|---|
| Signing in fails, or it keeps returning to the login page | `BETTER_AUTH_URL` must match the address in the browser exactly: `https`, no slash at the end. Correct it and redeploy. |
| Sign-in fails on a preview deployment | Expected. Preview addresses differ from `BETTER_AUTH_URL`; use the production address. |
| Errors about a missing table or column | The migrations did not run against Neon. Repeat step 6. |
| The build fails while installing | Check that `ENABLE_EXPERIMENTAL_COREPACK` is `1` and Node.js is 22.x or newer. |
| The AI assistant answers with an error | `GROQ_API_KEY` is missing or invalid. Add it and redeploy. |
| Changed a variable but nothing happened | Environment variables only apply to new deployments. Redeploy. |
