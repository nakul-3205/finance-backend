# Finance Backend — Role-Based Access Control API

A production-structured REST API in **TypeScript + Express + Prisma (SQLite)** for a finance dashboard.

---

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
ts-node prisma/seed.ts
npm run dev
```

Server starts at `http://localhost:3000`

---

## Seed Accounts

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| ADMIN    | admin@finance.dev      | Admin@123    |
| ANALYST  | analyst@finance.dev    | Analyst@123  |
| VIEWER   | viewer@finance.dev     | Viewer@123   |

---

## Role Permissions

| Action                         | VIEWER | ANALYST | ADMIN |
|--------------------------------|--------|---------|-------|
| Login / Register               | ✓      | ✓       | ✓     |
| View own profile, change pass  | ✓      | ✓       | ✓     |
| View records & categories      | ✓      | ✓       | ✓     |
| Dashboard summary & recent     | ✓      | ✓       | ✓     |
| Category totals / trends       |        | ✓       | ✓     |
| Create / update records        |        | ✓       | ✓     |
| Soft-delete & restore records  |        |         | ✓     |
| User management (all)          |        |         | ✓     |

---

## API Reference

All protected routes need: `Authorization: Bearer <accessToken>`

### Auth — `/api/auth`

| Method | Path              | Auth | Body / Notes                                    |
|--------|-------------------|------|-------------------------------------------------|
| POST   | /register         | No   | `{ name, email, password }`                     |
| POST   | /login            | No   | `{ email, password }` → returns tokens          |
| POST   | /logout           | No   | Client discards tokens                          |
| POST   | /refresh-token    | No   | `{ refreshToken }`                              |
| POST   | /forgot-password  | No   | `{ email }` — token logged to console if no SMTP|
| POST   | /reset-password   | No   | `{ token, password }`                           |
| GET    | /me               | Yes  | Returns current user profile                    |
| POST   | /change-password  | Yes  | `{ currentPassword, newPassword }`              |

### Users — `/api/users` (ADMIN only)

| Method | Path            | Description                            |
|--------|-----------------|----------------------------------------|
| GET    | /               | List users — `?page&limit&role&status&search` |
| GET    | /:id            | Get user by ID                         |
| PATCH  | /:id            | Update `name` / `email`                |
| PATCH  | /:id/role       | `{ role: "VIEWER" | "ANALYST" | "ADMIN" }` |
| PATCH  | /:id/status     | `{ status: "ACTIVE" | "INACTIVE" }`    |
| DELETE | /:id            | Delete user (blocked if user has records) |

### Records — `/api/records`

| Method | Path           | Roles          | Description                          |
|--------|----------------|----------------|--------------------------------------|
| GET    | /              | All            | List — `?page&limit&type&category&startDate&endDate&search&sortBy&sortOrder` |
| GET    | /categories    | All            | Distinct categories with counts      |
| GET    | /:id           | All            | Single record                        |
| POST   | /              | Analyst, Admin | `{ amount, type, category, date, notes? }` |
| PATCH  | /:id           | Analyst, Admin | Any subset of record fields          |
| DELETE | /:id           | Admin          | Soft-delete                          |
| POST   | /:id/restore   | Admin          | Restore soft-deleted record          |

### Dashboard — `/api/dashboard`

| Method | Path              | Roles          | Notes                            |
|--------|-------------------|----------------|----------------------------------|
| GET    | /summary          | All            | `?startDate&endDate`             |
| GET    | /recent           | All            | `?limit` (default 10)            |
| GET    | /category-totals  | Analyst, Admin | `?type&startDate&endDate`        |
| GET    | /trends/monthly   | Analyst, Admin | `?year` (default current year)   |
| GET    | /trends/weekly    | Analyst, Admin | `?weeksBack` (default 8)         |
| GET    | /top-categories   | Analyst, Admin | `?limit` (default 5)             |

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one number

---

## Project Structure

```
finance-backend/
├── prisma/
│   ├── schema.prisma        # DB schema (User, FinancialRecord, enums)
│   └── seed.ts              # Seed 3 users + 12 sample records
├── src/
│   ├── config/
│   │   └── prisma.ts        # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts          # JWT verification, attaches req.user
│   │   ├── role.ts          # RBAC guards (authorize, adminOnly, etc.)
│   │   └── validate.ts      # Zod body & query validation factories
│   ├── modules/
│   │   ├── auth/            # register, login, logout, tokens, password reset
│   │   ├── users/           # CRUD + role/status management (admin)
│   │   ├── records/         # Financial records with soft-delete
│   │   └── dashboard/       # Summary, trends, category analytics
│   ├── utils/
│   │   ├── jwt.ts           # Sign / verify access + refresh tokens
│   │   ├── email.ts         # Nodemailer (console fallback if no SMTP)
│   │   └── response.ts      # ok() / fail() JSON response helpers
│   ├── app.ts               # Express app, middleware, rate limiting
│   └── server.ts            # Entry point, DB connect, graceful shutdown
├── .env
├── .env.example
└── tsconfig.json
```

---

## NPM Scripts

```bash
npm run dev           # Dev server with hot reload (ts-node-dev)
npm run build         # Compile to dist/
npm run start         # Run compiled build
npm run prisma:generate  # Generate Prisma client (run after schema changes)
npm run prisma:push      # Sync schema to SQLite file
npm run prisma:seed      # Seed the database
npm run prisma:studio    # Open Prisma Studio GUI
```

---

## Assumptions & Design Notes

- **SQLite** is used for zero-infrastructure local development. Switching to PostgreSQL is a one-line change in `schema.prisma` + `DATABASE_URL`.
- **Soft deletes** on financial records preserve audit history. Only admins can delete or restore.
- **Forgot password** prints the token to the console when SMTP is not configured — no extra setup needed for testing.
- **JWT is stateless** — logout instructs the client to discard tokens. A Redis-based blocklist can be added to the `authenticate` middleware for hard invalidation.
- **Admins cannot act on themselves** — changing their own role, deactivating or deleting their own account is blocked.
- **Analysts can create and update records** but cannot delete them, preserving financial integrity.
"# finance-backend" 
