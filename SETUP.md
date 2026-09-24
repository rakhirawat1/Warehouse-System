# Setup manual

How to run the Warehouse Management System locally on **Windows, macOS or
Linux**. Follow it top to bottom.

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

Docker only runs PostgreSQL. If you already have PostgreSQL 16, see
[Using your own PostgreSQL](#using-your-own-postgresql).

---

## 2. Open the project and install

Open the downloaded or cloned project folder in a terminal, then run:

```bash
pnpm install
```

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

Never commit `.env`; it is already in `.gitignore`.

---

## 4. Start the database

```bash
pnpm db:up
```

Docker starts PostgreSQL 16 on **port 5434** with a database called
`warehouse_management`. The data is stored in a named Docker volume, so it
survives restarts.

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
changed, and it stops with a message if no administrator exists yet.

To empty the inventory without loading demo data, run `pnpm db:clear`.

---

## 8. Run the app

```bash
pnpm dev
```

Open <http://localhost:3001> and sign in as the administrator.

For a production-style run: `pnpm build` then `pnpm start`.

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

## Every command

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs dependencies |
| `pnpm db:up` | Starts PostgreSQL in Docker (port 5434) |
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
| `docker compose down` | Stops the database, keeping the data |
| `docker compose down -v` | Stops it and **deletes** the data |

---

## Using your own PostgreSQL

1. Create an empty database: `CREATE DATABASE warehouse_management;`
2. Point `DATABASE_URL` in `.env` at it, for example
   `postgres://myuser:mypassword@localhost:5432/warehouse_management`.
3. Skip `pnpm db:up`; run `pnpm db:migrate`, then create the first
   administrator (step 6).

PostgreSQL 13 or newer works; no extensions are needed.