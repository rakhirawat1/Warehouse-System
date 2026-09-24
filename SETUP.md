# Setup manual

How to run the Warehouse Management System locally on **Windows, macOS or
Linux**. Follow it top to bottom.

Steps 1–9 describe **standard local development**: Next.js runs on your
computer with pnpm, and only the database runs in Docker. To run everything
in Docker instead, see the [Full Docker option](#full-docker-option) after
step 9.

> This manual is for running the project **locally**. The live deployment uses
> Vercel and a Neon PostgreSQL database, which is completely separate from the
> local database you create here. Never put production credentials in your
> local `.env`.

---

## 1. What you need

| Tool | Version | Check with | Get it |
| --- | --- | --- | --- |
| **Node.js** | **22.x (22.13 or newer)** | `node -v` | <https://nodejs.org> |
| **pnpm** | 11.17.0 | `pnpm -v` | `corepack enable` (ships with Node) |
| **Docker** | any current | `docker -v` | <https://docs.docker.com/get-started/> |
| **Groq API key** | — | — | <https://console.groq.com/keys> (only for the AI assistant) |

Activate pnpm:

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
```

In standard local development Docker runs **only PostgreSQL**. If you already
have PostgreSQL 16, see [Using your own PostgreSQL](#using-your-own-postgresql).
The [Full Docker option](#full-docker-option) needs only Docker, because
Node.js and pnpm are provided inside the Docker image.

---

## 2. Open the project and install

Open the downloaded or cloned project folder in a terminal, then run:

```bash
pnpm install
```

(Not needed for the Full Docker option.)

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
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/warehouse_management
BETTER_AUTH_SECRET=<a long random string>
BETTER_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
GROQ_API_KEY=<your Groq API key>
```

Generate `BETTER_AUTH_SECRET`:

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

> `BETTER_AUTH_URL` must match the address in your browser, port included.
> The app runs on port 3001.

> **Two database addresses, do not mix them up.**
> `localhost:5434` is the address when Next.js runs **on your computer**, and
> it is what belongs in `.env`. `db:5432` works **only between Docker
> containers**, when Next.js itself runs inside Docker. Never put the `db:5432`
> address in your `.env`.

Never commit `.env`; it is already in `.gitignore`.

---

## Choose your local run mode

Choose **one** mode. Do not run both, because both serve the app on port 3001.

**Standard local development** (steps 4–8 below):

```
Browser → Next.js on your computer (:3001) → PostgreSQL in Docker (localhost:5434 → 5432)
```

```bash
docker compose up -d db
pnpm db:migrate
pnpm create-admin
pnpm dev
```

**Full Docker** (see [Full Docker option](#full-docker-option)):

```
Browser → Next.js in Docker (:3001) → PostgreSQL in Docker (db:5432)
```

```bash
docker compose up -d
docker compose run --rm migration
docker compose run --rm admin
```

> **Standard local development: never run `docker compose up -d` without `db`.**
> That command also starts the Dockerized app on port 3001, and `pnpm dev`
> then fails with `EADDRINUSE: address already in use :::3001`.

---

## 4. Start the database

```bash
docker compose up -d db
```

Docker starts only PostgreSQL 16 on **port 5434** with a database called
`warehouse_management`. The data is stored in a named Docker volume, so it
survives restarts.

> Use `docker compose up -d db`, **not** `docker compose up -d` and not
> `pnpm db:up`. Both of those start the whole Docker stack, including the
> Dockerized app on port 3001. If that already happened, run
> `docker compose down` (your data is kept), then `docker compose up -d db`.

---

## 5. Create the tables

```bash
pnpm db:migrate
```

This creates the tables, constraints, unique indexes and integrity triggers.
The database starts empty: there is no demo data and no built-in account.

---

## 6. Create the first administrator

The app has **no public sign-up**. Create the first administrator once:

```bash
pnpm create-admin
```

Enter the email, password and name when prompted. `.env` must be filled in
first.

---

## 7. Load demo data (optional)

> **Warning:** `pnpm db:seed` **replaces all inventory data** (warehouses,
> storage spaces, items, allocations and movement history). Use it only on a
> local or test database, **never on a database that holds real or production
> data.**

```bash
pnpm db:seed
```

Loads 3 active warehouses, 9 storage spaces and 10 items. Accounts are never
changed, and it stops with a message if no administrator exists yet. Demo data
is optional and is **never loaded automatically**.

To empty the inventory without loading demo data, run `pnpm db:clear`.

---

## 8. Run the app

```bash
pnpm dev
```

Open <http://localhost:3001> and sign in as the administrator.

For a production-style run: `pnpm build` then `pnpm start`.

If `pnpm dev` reports `EADDRINUSE ... :3001`, another server is already using
the port: see the warning in step 4.

---

## 9. Add staff

1. Sign in as an administrator and open **Users**.
2. **Add User**: enter the name, email and role, then click **Generate** to
   create a temporary password.
3. Give the person their email and temporary password. An administrator can
   view it again under **View details** until it is changed.
4. On first sign-in, the person must set their own password before using the
   app.

---

## Full Docker option

Use this if you would rather not install Node.js and pnpm. Next.js and
PostgreSQL both run in Docker. Make sure `pnpm dev` is not running, and keep
`.env` as in step 3 (with `localhost:5434`; do not change it to `db:5432`).

```bash
docker compose up -d
docker compose run --rm migration
docker compose run --rm admin
```

Then open <http://localhost:3001>.

- `docker compose up -d` only starts the containers. It does **not** create the
  tables, the administrator or any demo data; those are the separate
  `migration`, `admin` and (optional) `seed` commands.
- `docker compose run --rm admin` asks for the email, password and name, like
  `pnpm create-admin`.
- Inside Docker the app connects to PostgreSQL at
  `postgresql://postgres:postgres@db:5432/warehouse_management`. Your computer
  does **not** use `db:5432`; from your computer the database is
  `postgresql://postgres:postgres@localhost:5434/warehouse_management`.

Optional demo data, never loaded automatically (same warning as step 7):

```bash
docker compose run --rm seed
docker compose run --rm clear
```

`seed` loads the demo data; `clear` empties the inventory without loading demo
data.

---

## Every command

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs dependencies |
| `docker compose up -d db` | Starts **only** PostgreSQL in Docker (port 5434). Use this for standard local development |
| `pnpm db:up` | Runs `docker compose up -d`, which starts the **whole** Docker stack (database and app). Use it only for Full Docker, not with `pnpm dev` |
| `pnpm db:migrate` | Applies migrations |
| `pnpm create-admin` | Creates the first administrator |
| `pnpm db:seed` | Replaces all inventory with demo data; accounts untouched |
| `pnpm db:clear` | Deletes all inventory data; accounts untouched |
| `pnpm dev` | Development server on <http://localhost:3001> |
| `pnpm build` / `pnpm start` | Production build and server on port 3001 |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Drizzle Studio, a browser UI for the database |
| `pnpm db:generate` | Generates a migration after changing `src/db/schema` |
| `docker compose up -d` | Full Docker: starts the app and the database |
| `docker compose run --rm migration` | Full Docker: applies migrations |
| `docker compose run --rm admin` | Full Docker: creates the first administrator |
| `docker compose run --rm seed` | Full Docker: replaces all inventory with demo data (optional) |
| `docker compose run --rm clear` | Full Docker: deletes all inventory data |
| `docker compose down` | Stops the containers, keeping the data |
| `docker compose down -v` | Stops them and **deletes** the data |

> **`docker compose down -v` deletes the local PostgreSQL Docker volume**, so
> all local data is lost, including the administrator account. Use it only when
> you intentionally want to reset the local database, then repeat the migration
> and administrator steps.

---

## Using your own PostgreSQL

This is for standard local development.

1. Create an empty database: `CREATE DATABASE warehouse_management;`
2. Point `DATABASE_URL` in `.env` at it. If PostgreSQL is installed directly on
   your computer, use `localhost` and its port (usually 5432), for example
   `postgresql://myuser:mypassword@localhost:5432/warehouse_management`. The
   Docker address `db:5432` does not work from your computer.
3. Skip the Docker database (`docker compose up -d db`); run
   `pnpm db:migrate`, then create the first administrator (step 6), then
   `pnpm dev`.

PostgreSQL 13 or newer works; no extensions are needed.