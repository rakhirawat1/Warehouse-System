# Warehouse Management System

## Technical Documentation

### 1. Project Overview

The **Warehouse Management System (WMS)** is a web application for managing inventory across multiple warehouses and their storage spaces.

The system provides a centralized way to manage warehouse capacity, storage locations, inventory allocation, stock movement and user access. It also includes operational reporting, CSV export and optional AI-assisted features.

The application is designed with a focus on **data consistency, role-based access control and clear business rules**.

---

## 2. Objectives

The system is designed to:

- Manage multiple warehouses and their storage spaces.
- Maintain item and SKU information.
- Track total, allocated and available inventory.
- Support partial and split allocation across multiple locations.
- Manage stock receipt, transfer, adjustment and dispatch.
- Prevent invalid capacity and quantity operations.
- Enforce storage-type compatibility.
- Maintain stock movement history.
- Provide Admin and Staff access with different permissions.
- Provide dashboard-based operational information.
- Provide optional AI assistance without allowing AI to directly modify inventory.

---

## 3. Key Features

| Feature | Description |
|---|---|
| **Warehouse Management** | Create, view and update warehouses, including capacity and status. |
| **Storage Space Management** | Manage locations within warehouses with capacity and storage types. |
| **Item Management** | Maintain items, SKUs, descriptions, quantities and storage requirements. |
| **Split Allocation** | Store one item's quantity across multiple storage spaces or warehouses. |
| **Capacity Tracking** | Track used and available storage capacity. |
| **Stock Operations** | Support receipt, transfer, adjustment and dispatch operations. |
| **Storage Compatibility** | Validate that items are placed only in suitable storage types. |
| **Authentication** | Secure email/password login using Better Auth. |
| **RBAC** | Separate Admin and Staff permissions with server-side authorization. |
| **Activity History** | Record stock movements with relevant operational details. |
| **Dashboard** | Display capacity, inventory, alerts and recent activity. |
| **Search & Filtering** | Help users find relevant inventory and operational records. |
| **CSV Export** | Export inventory information for external reporting. |
| **AI Assistance** | Provide read-only warehouse analysis, form suggestions and health summaries. |

---

## 4. Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework and routing |
| React | User interface |
| TypeScript | Type-safe development |
| PostgreSQL | Relational database |
| Drizzle ORM | Database schema, queries and migrations |
| Better Auth | Authentication and sessions |
| Zod | Input validation |
| Tailwind CSS | Styling |
| Recharts | Dashboard visualizations |
| Framer Motion | UI animations |
| Lucide React | Icons |
| Groq | AI/LLM integration |
| Docker Compose | Local database/container setup |
| Vercel | Production hosting |
| Neon | Production PostgreSQL |

---

## 5. System Architecture

The application follows a feature-based architecture within Next.js.

```text
User Interface
      ↓
Next.js App Router
      ↓
Server Actions / API Routes
      ↓
Feature Services & Queries
      ↓
Drizzle ORM
      ↓
PostgreSQL
```

Authentication and authorization are performed on the server. Inventory business rules are handled by feature services and important integrity rules are additionally protected at the database level.

### Folder Structure

The project is organized into application routes, reusable components, database resources, feature modules and shared libraries.

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── change-password/
│   │
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── warehouses/
│   │   ├── storage-spaces/
│   │   ├── items/
│   │   ├── allocations/
│   │   ├── activity/
│   │   ├── users/
│   │   └── settings/
│   │
│   └── api/
│       ├── auth/
│       ├── ai/
│       └── items/export/
│
├── components/
│   ├── layout/
│   ├── motion/
│   └── ui/
│
├── db/
│   ├── migrations/
│   ├── schema/
│   ├── clear.ts
│   ├── index.ts
│   └── seed.ts
│
├── features/
│   ├── allocations/
│   ├── ai/
│   ├── dashboard/
│   ├── items/
│   ├── movements/
│   ├── storage-spaces/
│   ├── users/
│   └── warehouses/
│
└── lib/
    ├── ai/
    ├── auth/
    ├── action.ts
    ├── errors.ts
    └── storage.ts
```

### Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `src/app` | Next.js pages, layouts and application/API routes |
| `src/components` | Reusable UI, layout and animation components |
| `src/db` | Database connection, schemas, migrations and data utilities |
| `src/features` | Feature-specific queries, services, actions, schemas, types and components |
| `src/lib` | Shared authentication, authorization, error handling, AI and utility logic |

### Feature-Based Organization

The main business features are separated into their own modules:

```text
features/
├── warehouses/
├── storage-spaces/
├── items/
├── allocations/
├── movements/
├── users/
├── dashboard/
└── ai/
```

A feature keeps its related implementation together instead of spreading business logic across unrelated global folders. For example, the item feature contains the logic required for item operations, while the allocation feature contains inventory allocation and stock-operation logic.

This structure makes the application easier to maintain, extend and test as new warehouse functionality is added.

---

## 6. Data Model

The core inventory relationship is:

```text
Warehouse
    ↓
Storage Space
    ↓
Allocation
    ↓
Item
```

### Main entities

**Warehouse**  
Represents a warehouse and stores information such as name, location, capacity and status.

**Storage Space**  
Represents a storage location belonging to a warehouse. It has its own capacity and storage type.

**Item**  
Represents inventory with a name, unique SKU, total quantity and storage requirement.

**Allocation**  
Represents how many units of an item are stored in a particular storage space.

**Stock Movement**  
Records inventory operations such as receipt, transfer, adjustment and dispatch.

### Distributed inventory

One item can have multiple allocations:

```text
Item: 500 units

Warehouse A / Rack A → 200
Warehouse A / Rack B → 150
Warehouse B / Rack C → 150
```

This allows the system to represent inventory distributed across different storage locations while maintaining one overall item quantity.

---

## 7. Inventory and Business Rules

The system applies the following core rules:

- Storage capacity cannot be exceeded.
- Total allocated quantity cannot exceed the item's total quantity.
- An item's quantity cannot be reduced below its currently allocated quantity.
- Storage-type compatibility must be respected.
- Inactive warehouses cannot receive new stock.
- Transfers require sufficient source quantity and destination capacity.
- Restricted deletion operations require Admin authorization.
- Inventory operations are recorded in movement history.

### Capacity

For a storage space:

```text
Available Capacity = Capacity - Used Capacity
```

Warehouse capacity is also considered when configuring its storage spaces.

### Storage types

The system supports:

- Normal
- Cold Storage
- Secure
- Hazardous

The item's storage requirement is checked against the selected storage space before inventory is allocated.

### Data integrity

Important rules are protected at two levels:

```text
Application validation
        +
PostgreSQL integrity rules
```

For critical inventory operations, database transactions and row-level locking are used to keep quantity and capacity calculations reliable during concurrent operations.

---

## 8. Inventory Operations

### Allocation

Allocation checks item availability, storage capacity, warehouse status and storage compatibility before storing inventory.

### Split Allocation

A single item can be divided across multiple storage locations. This supports the assignment requirement for distributed storage.

### Transfer

Moves a selected quantity from one storage space to another while validating the source quantity and destination conditions.

### Adjustment

Corrects stored inventory when the recorded quantity differs from the physical quantity.

### Dispatch

Removes inventory that has left the warehouse.

Each operation contributes to the stock movement history.

---

## 9. Authentication and Role-Based Access Control

Authentication is implemented using **Better Auth** with email/password login and server-managed sessions.

Public registration is disabled.

The system contains two roles:

| Permission Area | Admin | Staff |
|---|:---:|:---:|
| View inventory | ✓ | ✓ |
| Manage warehouses | ✓ | ✓ |
| Manage storage spaces | ✓ | ✓ |
| Manage items | ✓ | ✓ |
| Allocate / transfer stock | ✓ | ✓ |
| Adjust / dispatch stock | ✓ | ✓ |
| Restricted deletion | ✓ | — |
| User management | ✓ | — |

Authorization is checked server-side. The interface may hide unavailable actions, but protected operations are independently checked before execution.

Staff accounts are provisioned by an administrator rather than through public self-registration.

---

## 10. Validation and Error Handling

**Zod** schemas validate incoming data before business operations are performed.

The application also validates business conditions such as:

- valid quantities
- available capacity
- available inventory
- compatible storage type
- active warehouse status
- user permissions

Shared error-handling utilities convert business and database failures into clear application-level messages for the user interface.

---

## 11. Dashboard, Activity and Reporting

The dashboard provides an operational overview of the system, including:

- warehouse information
- storage capacity
- inventory distribution
- allocation status
- low-capacity alerts
- recent movements

The Activity section provides chronological stock movement history, including information about the item, quantity, movement type, locations, user and timestamp where applicable.

The system also provides CSV inventory export for external reporting.

---

## 12. AI Features

AI functionality is integrated through the **Groq API** and is optional to the core warehouse workflow.

### Warehouse Assistant

Provides read-only answers about warehouse and inventory information, such as available capacity, item locations and unallocated inventory.

### AI Form Suggestions

Assists with supported item and storage-space form information. Suggestions remain subject to normal user review and validation before saving.

### Warehouse Health Summary

Generates an operational summary based on current warehouse metrics.

AI does not directly perform core inventory-changing operations. Database changes continue through the application's normal authenticated, validated business logic.

---

## 13. Setup and Deployment

### Local development

The repository contains detailed instructions in `SETUP.md`.

The main development flow is:

```bash
pnpm install
docker compose up -d db
pnpm db:migrate
pnpm create-admin
pnpm dev
```

Optional demo data:

```bash
pnpm db:seed
```

Inventory clearing:

```bash
pnpm db:clear
```

The application uses environment variables for database, authentication, application URL and optional AI configuration.

### Production

The application is deployed using:

```text
Vercel
   ↓
Next.js Application
   ↓
Neon PostgreSQL
```

Production configuration is supplied through deployment environment variables, and the production database is separate from the local Docker database.

---