# EJP-13 Shop Backend — API Documentation

Base URL: `http://localhost:5000/api`

All responses follow a consistent envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors return `success: false` with `data: null`.

## Authentication

Most write endpoints require a Bearer token:

```
Authorization: Bearer <token>
```

Get a token via `POST /api/auth/register` or `POST /api/auth/login`.

### POST /api/auth/register
Create a new account.

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |

Request body:
```json
{ "name": "John Doe", "email": "john@example.com", "password": "password123" }
```

Response (201):
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": { "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "User" }, "token": "..." }
}
```

Errors: `400` invalid email/short password, `409` email already exists.

### POST /api/auth/login
Sign in and receive a JWT.

Request body:
```json
{ "email": "john@example.com", "password": "password123" }
```

Response (200): same shape as register. Errors: `401` invalid email/password.

### GET /api/auth/me
Return the currently authenticated user. Requires Bearer token. Response (200): `data` = user object (no password).

### PATCH /api/auth/password
Change the current user's password. Requires Bearer token.

Request body:
```json
{ "currentPassword": "password123", "newPassword": "newpassword123" }
```

Errors: `401` incorrect current password.

---

## Users

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/users` | Admin |
| GET | `/api/users` | Authenticated |
| GET | `/api/users/:id` | Authenticated |
| PATCH | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

Query params for GET list: `?page=1&limit=20&search=john`

DELETE performs a soft delete (`isDeleted = true`); deleted users are excluded from all queries.

---

## Categories

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/categories` | Public |
| GET | `/api/categories/:id` | Public |
| POST | `/api/categories` | Admin |
| PATCH | `/api/categories/:id` | Admin |
| DELETE | `/api/categories/:id` | Admin |

Create body:
```json
{ "name": "Electronics", "description": "Gadgets and devices" }
```
`slug` is auto-generated from `name` if not provided. Errors: `409` duplicate slug.

---

## Products

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | Admin |
| PATCH | `/api/products/:id` | Admin |
| DELETE | `/api/products/:id` | Admin |

Query params: `?page=1&limit=20&search=mouse`

Create body:
```json
{ "title": "Wireless Mouse", "description": "...", "price": 25, "stock": 50, "categoryId": "uuid" }
```
`status` defaults to `ACTIVE`; valid values: `DRAFT`, `ACTIVE`, `ARCHIVED`.

---

## Reviews

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/reviews` | Public |
| GET | `/api/reviews/:id` | Public |
| POST | `/api/reviews` | Authenticated |
| PATCH | `/api/reviews/:id` | Owner / Admin |
| DELETE | `/api/reviews/:id` | Owner / Admin |

Create body:
```json
{ "rating": 5, "comment": "Great product!", "productId": "uuid" }
```
`rating` must be `1-5`. Users can only update/delete their own reviews.

---

## Orders

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Authenticated |
| GET | `/api/orders` | Owner (Admin sees all) |
| GET | `/api/orders/:id` | Owner / Admin |
| PATCH | `/api/orders/:id` | Admin |
| DELETE | `/api/orders/:id` | Admin |

Create body:
```json
{ "total": 25 }
```
`status` defaults to `PENDING`; valid values: `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Not authenticated / invalid token |
| 403 | Forbidden (role or ownership) |
| 404 | Not found |
| 409 | Duplicate value |
| 500 | Server error |
