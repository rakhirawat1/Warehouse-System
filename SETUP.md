# Setup Manual

How to run the Warehouse Management System locally on **Windows, macOS or
Linux**.

> This manual is for running the project **locally**. The live deployment
> uses Vercel and a Neon PostgreSQL database, which is completely separate
> from the local database you create here. Never put production credentials
> in your local `.env`.

---

## Recommended Setup Path

This is the fastest way to get the project running. Next.js runs directly on
your computer; only PostgreSQL runs in Docker.

1. Install **Node.js**, **pnpm** and **Docker** (see [What you need](#1-what-you-need)).
2. Open the project folder in a terminal and run `pnpm install`.
3. Create `.env` from `.env.example` and fill it in.
4. Start PostgreSQL: `docker compose up -d db`
5. Create the tables: `pnpm db:migrate`
6. Create the first admin account: `pnpm create-admin`
7. Start the app: `pnpm dev`
8. Open **http://localhost:3001** and sign in.

The detailed steps below (1–8) walk through exactly this, with explanations
and troubleshooting. If you'd rather run everything — app included — inside
Docker, skip to [Full Docker option](#full-docker-option) instead.

---

## 1. What you need

| Tool | Version | Check with | Get it |
| --- | --- | --- | --- |
| **Node.js** | 22.x | `node -v` | <https://nodejs.org> |
| **pnpm** | 11.17.0 | `pnpm -v` | `corepack enable` (ships with Node) |
| **Docker** | any current version | `docker -v` | <https://docs.docker.com/get-started/> |
| **Groq API key** (optional) | — | — | <https://console.groq.com/keys> — only needed for the AI features |

Activate pnpm:

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
```

In standard local development, Docker runs **only PostgreSQL** — not the
app. If you already have PostgreSQL 16 installed, see
[Using your own PostgreSQL](#using-your-own-postgresql) instead of Docker.

---

## 2. Open the project and install

Open the downloaded or cloned project folder in a terminal, then run:

```bash
pnpm install
```

(Not needed for the [Full Docker option](#full-docker-option) — dependencies
are installed inside the Docker image instead.)

---

## 3. Create the environment file

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Then edit `.env`:

```ini
DATABASE_URL=postgres://postgres:postgres@localhost:5434/warehouse_management
BETTER_AUTH_SECRET=<a long random string>
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
GROQ_API_KEY=<your Groq API key, optional>
```

Generate `BETTER_AUTH_SECRET`:

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

> `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the address in your
> browser, port included — the app runs on port **3001**.

> **Two database addresses — don't mix them up.**
> `localhost:5434` is the address to use when Next.js runs **on your
> computer**, and it's what belongs in `.env` for standard local
> development. `db:5432` only works **between Docker containers**, i.e. when
> Next.js itself is also running inside Docker (see
> [Full Docker option](#full-docker-option)). Never put `db:5432` in your
> local `.env`.

`.env` is already listed in `.gitignore` and is never committed.

---

## 4. Start the database

```bash
docker compose up -d db
```

This starts **only** PostgreSQL 16, on port **5434**, with a database called
`warehouse_management`. Its data is kept in a Docker volume, so it survives
restarts. `pnpm db:up` does exactly the same thing and can be used instead.

> **Don't run plain `docker compose up -d` (without `db`) here.** That
> starts the whole stack, including a Dockerized copy of the app on port
> 3001, which will clash with `pnpm dev` (`EADDRINUSE: address already in
> use :::3001`). If that happens, run `docker compose down` (your data is
> kept) and start again with `docker compose up -d db`.

---

## 5. Create the tables

```bash
pnpm db:migrate
```

This creates the tables, constraints, unique indexes and integrity triggers.
The database starts empty: no demo data and no accounts yet.

---

## 6. Create the first administrator

The app has **no public sign-up**, so the first administrator is created
from the command line, once:

```bash
pnpm create-admin
```

It will prompt for an email, password and name. `.env` must already be
filled in (step 3), since this command connects to the database using
`DATABASE_URL`.

---

## 7. Load demo data (optional)

> **Warning:** `pnpm db:seed` **replaces all inventory data** — warehouses,
> storage spaces, items, allocations and movement history. Only run it on a
> local or test database, **never on a database holding real data.**

```bash
pnpm db:seed
```

This creates 3 sample warehouses, 9 storage spaces and 10 items so there's
something to look at immediately. It never touches user accounts, and it
refuses to run if no administrator exists yet. Seeding is entirely optional
and is never run automatically.

To empty the inventory again without loading demo data, run `pnpm db:clear`.

---

## 8. Run the app

```bash
pnpm dev
```

Open <http://localhost:3001> and sign in with the administrator account from
step 6.

For a production-style run instead: `pnpm build` then `pnpm start`.

If `pnpm dev` reports `EADDRINUSE ... :3001`, something else is already
using that port — see the warning in step 4.

---

## 9. Add a staff account

1. Sign in as an administrator and open **Users**.
2. Click **Add User**, enter the name, email and role, then click
   **Generate** to create a temporary password.
3. Share the email and temporary password with that person. As an admin, you
   can view it again under **View details** until they change it.
4. On first sign-in, that person must set their own password before they can
   use the rest of the app.

---

## Full Docker option

Use this if you'd rather not install Node.js and pnpm at all — Next.js and
PostgreSQL both run inside Docker, and only Docker itself is required (the
image already contains Node.js and pnpm).

Make sure `pnpm dev` isn't running, and keep `.env` as created in step 3
(with `localhost:5434` — you do not need to change it).

```bash
docker compose up -d
docker compose run --rm migration
docker compose run --rm admin
```

Then open <http://localhost:3001>.

- `docker compose up -d` starts the containers but does **not** create the
  tables, the administrator, or any demo data — those are the separate
  `migration`, `admin` and (optional) `seed` commands below.
- `docker compose run --rm admin` asks for an email, password and name, same
  as `pnpm create-admin`.
- Inside Docker, the app reaches PostgreSQL at
  `postgresql://postgres:postgres@db:5432/warehouse_management`. That
  address only works between containers — from your own computer, the same
  database is at
  `postgresql://postgres:postgres@localhost:5434/warehouse_management`.

Optional demo data (same warning as step 7 — never use on real data):

```bash
docker compose run --rm seed    # loads demo data
docker compose run --rm clear   # empties the inventory
```

---

## Command reference

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs dependencies |
| `docker compose up -d db` (or `pnpm db:up`) | Starts **only** PostgreSQL in Docker, on port 5434 |
| `pnpm db:migrate` | Applies database migrations |
| `pnpm create-admin` | Creates the first administrator account |
| `pnpm db:seed` | Replaces all inventory with demo data; accounts untouched |
| `pnpm db:clear` | Deletes all inventory data; accounts untouched |
| `pnpm dev` | Starts the dev server on <http://localhost:3001> |
| `pnpm build` / `pnpm start` | Production build and server, port 3001 |
| `pnpm typecheck` | Runs the TypeScript compiler check |
| `pnpm lint` | Runs ESLint |
| `pnpm db:studio` | Opens Drizzle Studio, a browser UI for the database |
| `pnpm db:generate` | Generates a new migration after a schema change |
| `docker compose up -d` | **Full Docker only** — starts the app and the database together |
| `docker compose run --rm migration` | **Full Docker only** — applies migrations |
| `docker compose run --rm admin` | **Full Docker only** — creates the first administrator |
| `docker compose run --rm seed` | **Full Docker only** — loads demo data (optional) |
| `docker compose run --rm clear` | **Full Docker only** — deletes all inventory data |
| `docker compose down` | Stops the containers, keeping the data |
| `docker compose down -v` | Stops the containers and **deletes** the data |

> **`docker compose down -v` deletes the local PostgreSQL volume**,
> including the administrator account. Only use it when you intentionally
> want to reset the local database — you'll need to repeat the migration and
> administrator steps afterwards.

---

## Using your own PostgreSQL

If you'd rather not use Docker for the database at all:

1. Create an empty database: `CREATE DATABASE warehouse_management;`
2. Point `DATABASE_URL` in `.env` at it — for a local install this is
   usually `postgresql://myuser:mypassword@localhost:5432/warehouse_management`.
   (The Docker-only address `db:5432` does not apply here.)
3. Skip step 4 (`docker compose up -d db`) and continue from step 5
   (`pnpm db:migrate`).

PostgreSQL 13 or newer works; no extensions are required.