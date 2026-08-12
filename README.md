# Lumeo Market — Backend API (EJP-13 / SCIC Project)

A production-ready REST API for the **Lumeo Market** store, built with
**Express.js 5 + TypeScript + Prisma ORM + PostgreSQL**. It is fully integrated
with the [frontend](../frontend) (Next.js + Better Auth).

## Overview

- Modular, service-based REST API with consistent response envelopes.
- Complete authentication system (register, login, JWT, password change)
  plus a **session-exchange** endpoint to bridge Better Auth to the backend.
- Full CRUD for users, categories, products, reviews, orders, and a cart.
- Role-based access (`User` / `Admin`), ownership checks, and **soft delete**
  on every model.
- Shared CRUD factory so each module avoids duplicate code.

## Technology

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | Express.js 5                                |
| Language     | TypeScript (strict)                         |
| ORM / DB     | Prisma ORM 7 + PostgreSQL (`@prisma/adapter-pg`) |
| Auth         | JWT (`jsonwebtoken`) + bcrypt password hash |
| Tooling      | `tsx` (dev), `dotenv`, `cors`               |

## Getting started

```bash
npm install
```

1. Copy `.env` and set your values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?sslmode=require"
PORT=5000
JWT_SECRET="change-me"
```

2. Run migrations and generate the Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

3. Start the dev server (auto-reloads with `tsx watch`):

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

## Project structure

```
postgreSQL/
├── prisma/schema.prisma    # 8 models, 3 enums, relations, @@map()
├── API_DOCS.md             # detailed endpoint documentation
├── vercel.json             # serverless config
└── src/
    ├── app.ts              # express app: cors, json, routes, error handler
    ├── server.ts           # listens on PORT (default 5000)
    ├── routes/             # index, auth, user, category, product, review, order, cart
    ├── services/           # matching service layer (Prisma + validation)
    ├── middleware/         # protect (JWT), restrictTo (roles), notFound, errorHandler
    ├── lib/                # prisma, jwt, response envelope, crud-factory, catchAsync
    ├── types/              # express.d.ts (Request.user typing)
    └── generated/prisma/   # generated Prisma client
```

## Authentication flow

1. `POST /api/auth/register` — create an account (bcrypt-hashed password).
2. `POST /api/auth/login` — returns a `{ token, user }`.
3. Send `Authorization: Bearer <token>` on protected routes.
4. `GET /api/auth/me`, `PATCH /api/auth/password`, `POST /api/auth/exchange`
   (exchanges a Better Auth session token for a backend JWT).

Every response uses a consistent envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors return `success: false` with `data: null`.

---

## API Routes

Base URL: `http://localhost:5000/api`

### Auth (`/api/auth`)

| Method | Route        | Access       | Description                              |
| ------ | ------------ | ------------ | ---------------------------------------- |
| POST   | `/register`  | Public       | Create account → returns `{ user, token }` |
| POST   | `/login`     | Public       | Sign in → returns `{ user, token }`      |
| POST   | `/exchange`  | Public       | Exchange a Better Auth session token for a backend JWT |
| GET    | `/me`        | Authenticated| Current user profile (no password)       |
| PATCH  | `/password`  | Authenticated| Change own password                      |

Register body: `{ "name": "...", "email": "...", "password": "..." }` → `201`.
Login body: `{ "email": "...", "password": "..." }` → `200`.
Exchange body: `{ "token": "<better-auth-session-token>" }` → `200`.
Password body: `{ "currentPassword": "...", "newPassword": "..." }` → `200`.

### Users (`/api/users`)

| Method | Route      | Access        | Description            |
| ------ | ---------- | ------------- | ---------------------- |
| GET    | `/`        | Authenticated | List users (`?page&limit&search`) |
| GET    | `/:id`     | Authenticated | Get one user           |
| POST   | `/`        | Admin         | Create user            |
| PATCH  | `/:id`     | Admin         | Update user            |
| DELETE | `/:id`     | Admin         | Soft delete user       |

### Categories (`/api/categories`)

| Method | Route      | Access | Description                              |
| ------ | ---------- | ------ | ---------------------------------------- |
| GET    | `/`        | Public | List categories (`?page&limit&search`)   |
| GET    | `/:id`     | Public | Get one category                         |
| POST   | `/`        | Admin  | Create category (`slug` auto-generated)  |
| PATCH  | `/:id`     | Admin  | Update category                          |
| DELETE | `/:id`     | Admin  | Soft delete category                     |

Create body: `{ "name": "Electronics", "description": "..." }`.

### Products (`/api/products`)

| Method | Route      | Access | Description                              |
| ------ | ---------- | ------ | ---------------------------------------- |
| GET    | `/`        | Public | List products (`?page&limit&search`)     |
| GET    | `/:id`     | Public | Get one product (with category & reviews)|
| POST   | `/`        | Admin  | Create product                           |
| PATCH  | `/:id`     | Admin  | Update product                           |
| DELETE | `/:id`     | Admin  | Soft delete product                      |

Create body:
```json
{ "title": "Wireless Mouse", "description": "...", "price": 25, "stock": 50, "categoryId": "uuid" }
```
`status` defaults to `ACTIVE`; valid: `DRAFT`, `ACTIVE`, `ARCHIVED`.

### Reviews (`/api/reviews`)

| Method | Route      | Access            | Description                              |
| ------ | ---------- | ----------------- | ---------------------------------------- |
| GET    | `/`        | Public            | List reviews (`?page&limit&search`)      |
| GET    | `/:id`     | Public            | Get one review                           |
| POST   | `/`        | Authenticated     | Create a review                          |
| PATCH  | `/:id`     | Owner / Admin     | Update a review                          |
| DELETE | `/:id`     | Owner / Admin     | Soft delete a review                     |

Create body: `{ "rating": 5, "comment": "...", "productId": "uuid" }`
(`rating` must be `1-5`; users can only change their own reviews).

### Orders (`/api/orders`)

| Method | Route      | Access          | Description                      |
| ------ | ---------- | --------------- | -------------------------------- |
| POST   | `/`        | Authenticated   | Create an order (own user)       |
| GET    | `/`        | Owner / Admin   | List orders (Admin sees all)     |
| GET    | `/:id`     | Owner / Admin   | Get one order                    |
| PATCH  | `/:id`     | Admin           | Update order (e.g. status)       |
| DELETE | `/:id`     | Admin           | Soft delete an order             |

Create body: `{ "total": 25 }`.
`status` defaults to `PENDING`; valid: `PENDING`, `PROCESSING`, `SHIPPED`,
`DELIVERED`, `CANCELLED`.

### Cart (`/api/cart`)

| Method | Route      | Access         | Description                     |
| ------ | ---------- | -------------- | ------------------------------- |
| GET    | `/`        | Authenticated  | Get current user's cart + total |
| POST   | `/`        | Authenticated  | Add a product (or bump quantity)|
| PATCH  | `/:id`     | Authenticated  | Update item quantity            |
| DELETE | `/:id`     | Authenticated  | Remove an item                  |

Add body: `{ "productId": "uuid", "quantity": 2 }`.

---

## Soft delete

`DELETE` is a **soft delete** (`isDeleted = true`); deleted rows are excluded
from every query. Passwords are never returned by the API.

## Prisma commands

```bash
npx prisma migrate dev --name <migration-name>   # create & apply a migration
npx prisma generate                               # regenerate the client
npx prisma studio                                 # browse/edit data in the browser
npx prisma migrate status                         # check migration state
```

## Prisma highlights

- 8 models, 3 enums (`UserRole`, `ProductStatus`, `OrderStatus`)
- UUID primary keys, `createdAt`/`updatedAt` timestamps
- Soft delete (`isDeleted`) on every model
- Table names mapped with `@@map()`
- Indexes on foreign keys and status fields

## Status codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | OK                                       |
| 201  | Created                                  |
| 400  | Validation error                         |
| 401  | Not authenticated / invalid token        |
| 403  | Forbidden (role or ownership)            |
| 404  | Not found                                |
| 409  | Duplicate value                          |
| 500  | Server error                             |

Full request/response details: [API_DOCS.md](./API_DOCS.md).