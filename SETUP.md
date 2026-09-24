# Setup manual

How to run the Warehouse Management System from a fresh clone on **Windows,
macOS or Linux**. Follow it top to bottom.

---

## 1. What you need

| Tool | Version | Check with | Get it |
| --- | --- | --- | --- |
| **Node.js** | **22.13 or newer** | `node -v` | <https://nodejs.org> |
| **pnpm** | 11.17.0 | `pnpm -v` | `corepack enable` (ships with Node) |
| **Docker** | any current | `docker -v` | <https://docs.docker.com/get-started/> |
| **Git** | any current | `git --version` | <https://git-scm.com> |
| **Groq API key** | — | — | <https://console.groq.com/keys> (only for the AI assistant) |

> **Node 22 is required.** `package.json` pins `pnpm@11.17.0`, and pnpm 11 does
> not start on Node 20 or older (`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`).

Activate pnpm:

```bash
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm -v        # 11.17.0
```

Docker only runs PostgreSQL. If you already have PostgreSQL 16, see
[Using your own PostgreSQL](#using-your-own-postgresql).

---

## 2. Get the code and install

```bash
git clone <repository-url>
cd <project-folder>
pnpm install
```

**Windows:** use PowerShell or Git Bash. Keep the project out of folders synced
by OneDrive or Dropbox; they lock files while Next.js writes them.

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

> **`BETTER_AUTH_URL` must match the address in your browser, port included.**
> The app runs on port 3001. If they differ, signing in fails with **403**.

Never commit `.env`; it is already in `.gitignore`.

---

## 4. Start the database

```bash
pnpm db:up
```

This runs `docker compose up -d`: PostgreSQL 16 in a container named
`warehouse-postgres-new`, on **port 5434**, with a database called
`warehouse_management`. Data lives in the `warehouse_management_data` volume
and survives restarts.

```bash
docker ps
# warehouse-postgres-new   postgres:16   Up ...   0.0.0.0:5434->5432/tcp
```

---

## 5. Create the tables

```bash
pnpm db:migrate
```

This creates the tables, constraints, unique indexes and integrity triggers.
The database starts empty: there is no demo data and no built-in account.

---

## 6. Create the first administrator

The app has **no public sign-up**. Create the first administrator once, with
the `create-admin` script, which runs the Better Auth CLI version that matches
the installed `better-auth` package (1.7.5):

```bash
pnpm create-admin --email you@example.com --password "a-strong-password" --name "Your Name"
```

This is shorthand for
`pnpm dlx auth@1.7.5 create-admin --config src/lib/auth/auth.ts --email ... --password ... --name ...`,
defined in `package.json`. On Windows PowerShell it works the same way, all on
one line.

It prints `Admin user created successfully.` The CLI refuses to run when
accounts already exist, so it cannot be used to add more administrators later
by accident. `.env` must be filled in first, because the CLI connects to the
database through the project's own auth configuration.

---

## 7. Load demo data (optional)

```bash
pnpm db:seed
```

Loads 3 active warehouses, 9 storage spaces and 10 items, created through the
app's own business rules. No allocations or stock movements are created, so
allocating, moving and dispatching can be tried from a clean state.

It **replaces all warehouses, storage spaces, items, allocations and movement
history** each time it runs, so only use it on a test database. It never
creates, changes or deletes accounts, and it stops with a message if no
administrator exists yet.

To empty the inventory again without loading demo data:

```bash
pnpm db:clear
```

This deletes all warehouses, storage spaces, items, allocations and movement
history, and keeps every account.

---

## 8. Run the app

```bash
pnpm dev
```

Open <http://localhost:3001> and sign in as the administrator.

For a production-style run:

```bash
pnpm build
pnpm start
```

---

## 9. Add staff

1. Sign in as an administrator and open **Users**.
2. **Add User**: enter the name, email and role, then click **Generate** to
   create a temporary password.
3. Give the person their email and temporary password. Until they change it,
   an administrator can view it again under **View details** on the Users page.
4. When they first sign in, they see **Set your password**. Nothing else in the
   app is available until they choose their own password.

---

## 10. Check it works

```bash
pnpm typecheck     # no errors expected
pnpm lint          # no errors expected
```

---

## Every command

| Command | What it does |
| --- | --- |
| `pnpm install` | Installs dependencies |
| `pnpm db:up` | Starts PostgreSQL in Docker (port 5434) |
| `pnpm db:migrate` | Applies migrations |
| `pnpm create-admin --email ... --password ... --name ...` | Creates the first administrator |
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

---

## Troubleshooting

**`pnpm: command not found`**
Run `corepack enable`, then `corepack prepare pnpm@11.17.0 --activate`. On Linux
you may need `sudo corepack enable`.

**`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`**
Node is older than 22.13. Install Node 22 LTS (`nvm install 22 && nvm use 22`,
or on Windows with nvm-windows `nvm install 22.13.0` then `nvm use 22.13.0`) and
open a new terminal.

**Signing in returns 403**
`BETTER_AUTH_URL` does not match the browser address. Fix `.env` and restart.

**`create-admin` says users already exist**
The first administrator was already created. Sign in with it, and add further
accounts from **Users**.

**`ECONNREFUSED ... 5434`**
The database is not running: `pnpm db:up`, then `docker ps`. If Docker Desktop
stopped, start it and try again.

**`port is already allocated`**
Something else uses port 5434. Stop it, or change the port in both
`docker-compose.yml` and `DATABASE_URL`.

**The AI assistant says it is unavailable**
Check `GROQ_API_KEY` in `.env` and restart the server.

**`EPERM: operation not permitted, rename ... .next\...` (Windows)**
Two dev servers are running, or a sync client or antivirus is locking the
build folder. Stop every `node` process for this project, delete `.next`, and
start one server.

**Start over with an empty database**
This deletes all data:

```bash
docker compose down -v
pnpm db:up
pnpm db:migrate
```

Then create the first administrator again (step 6).