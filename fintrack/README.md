# FinTrack — Enterprise Personal Finance Management Platform

FinTrack is a full-stack, enterprise-grade personal finance management platform engineered for strict data ownership, rigorous double-entry accounting integrity, deterministic financial analytics, and bulletproof security.

---

## 🔒 Source of Truth Documentation

The architecture, data model, business rules, design tokens, web flows, and implementation specifications are strictly defined under the `/docs` directory:

1. [`PRD.md`](docs/PRD.md) — Product Requirements Document (Goals, Personas, Features, Non-Functional Requirements)
2. [`TRD.md`](docs/TRD.md) — Technical Requirements Document (Stack, Protocols, Security, Performance)
3. [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System Architecture (Layering, Modules, Data Flows, Directory Structure)
4. [`DATABASESCHEMA.md`](docs/DATABASESCHEMA.md) — Database Schema & Indexes (9 Collections, Compound Keys, Validation)
5. [`UI_UX.md`](docs/UI_UX.md) — UI/UX Design System Specification (Tokens, Component Hierarchy, WCAG 2.1 AA)
6. [`WEBFLOW.md`](docs/WEBFLOW.md) — Web Flow & Routing (Navigation Graphs, State Transitions, Error Boundaries)
7. [`IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) — 20-Phase Systematic Implementation & Verification Roadmap

---

## 🛠️ Technology Stack

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router 6, Tailwind CSS, Lucide React, Axios | Route code-splitting, accessible UI components, theme switching, real-time toast feedback |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Zod, Helmet, Multer, Cookie-Parser, Nodemailer | RESTful API controllers, business logic services, input validation, RBAC middleware |
| **Database** | MongoDB (Compass compatible) | Compound indexed document storage, aggregation pipelines, optimistic isolation |
| **Security** | Bcrypt (12 salt rounds), JWT (HttpOnly cookies), Path Traversal Guard, Helmet HTTP headers | Zero-storage client tokens, cross-tenant isolation, sanitized audit logging |
| **Intelligence** | Pure Deterministic Engine | Mathematical budget thresholds, MoM spending spikes, zero external AI/LLM dependencies |

---

## 🚀 Key Functional Capabilities

- **Consolidated Financial Dashboard**: Live calculation of total income, total expenses, net savings, savings rate, 6-month historical trend curves, and category spending allocations.
- **Dynamic Ledger & Accounts**: Support for Bank Accounts, Credit Cards, Cash, and Digital Wallets with automatic balance synchronization upon expense/income additions, updates, or deletions.
- **Advanced Multi-Parameter Search & Filters**: Instant full-text search across descriptions and notes, category filtering, payment method tagging, amount ranges, and date boundaries.
- **Multipart Receipt Management**: Safe drag-and-drop receipt uploads (JPG, PNG, WEBP, PDF up to 5 MB) with path traversal immunity and streaming download.
- **Monthly Budgets & Alerting**: Category-specific spending limits with automated background threshold triggers (`HEALTHY` $\rightarrow$ `WARNING` 75% $\rightarrow$ `CRITICAL` 90% $\rightarrow$ `EXCEEDED` 100%).
- **Recurring Transactions & Scheduler**: Automated processing of subscriptions and bills (Daily, Weekly, Monthly, Yearly) with strict idempotency and deduplication guards.
- **Savings Goals & Milestone Tracking**: Target date forecasting, incremental contribution ledger, and celebratory milestone notifications at 50% and 100% completion.
- **In-App Notifications Center**: Real-time notification drawer with unread count badges, category filtering, mark-all-as-read, and deletion controls.
- **Interactive Financial Calendar**: Month-grid calendar displaying daily transactions, upcoming bill reminders, budget limits, and savings goal targets.
- **Financial Reports & Statement Export**: On-demand generation of deterministic RFC 4180 CSV exports and pure binary PDF monthly statements.
- **System Administration & Audit Logs**: Platform telemetry overview, user lifecycle governance (Active, Inactive, Suspended, Admin promotion), system category management, and credential-sanitized audit trails.

---

## ⚙️ Environment Configuration

FinTrack uses structured environment variables for backend and frontend runtimes.

### Server Configuration (`server/.env` or root `.env`)

| Variable | Type | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` / `production` | Runtime mode (controls secure cookie attributes) |
| `PORT` | Number | `5000` | Express API port |
| `CLIENT_URL` | String | `http://localhost:5173` | Allowed CORS origin for credentials |
| `MONGO_URI` | String | `mongodb://localhost:27017/fintrack` | MongoDB connection URI |
| `JWT_SECRET` | String | *Min 32 random characters* | Cryptographic signing key for JWT session tokens |
| `JWT_EXPIRES_IN` | String | `7d` | Session expiration window |
| `BCRYPT_SALT_ROUNDS` | Number | `12` | Password hashing salt cost |
| `COOKIE_SECRET` | String | *Random string* | Signed cookie secret |
| `ADMIN_EMAIL` | String | `admin@fintrack.local` | Default platform administrator email for seed |
| `ADMIN_PASSWORD` | String | `AdminSecurePassword123!` | Default platform administrator password for seed |
| `UPLOAD_DIR` | String | `uploads` | Local disk directory for receipt storage |
| `MAX_FILE_SIZE` | Number | `5242880` | Maximum upload ceiling in bytes (5 MB) |
| `SMTP_HOST` | String | `smtp.mailtrap.io` | Outbound mail server for password recovery |
| `SMTP_PORT` | Number | `2525` | SMTP port |
| `SMTP_USER` | String | *SMTP username* | Mail authentication user |
| `SMTP_PASSWORD` | String | *SMTP password* | Mail authentication password |
| `SMTP_FROM` | String | `FinTrack <noreply@fintrack.local>` | Outbound sender address |

### Client Configuration (`client/.env`)

| Variable | Type | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `http://localhost:5000/api` | Base URL for REST API requests |

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js**: `>= 20.x`
- **npm**: `>= 10.x`
- **MongoDB**: `>= 6.x` (Local daemon or MongoDB Atlas cluster)

### 2. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/lohith9908/fintrack.git
cd fintrack

# Install root, server, and client dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Initialize Environment
```bash
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 4. Database Seed & Admin Creation
The database seed script runs idempotently on server startup or can be executed manually:
```bash
# Seeds default administrator (admin@fintrack.local) and 13 system categories
npm --prefix server run seed
```

### 5. Launch Development Servers
```bash
# Run both Backend (:5000) and Frontend (:5173) concurrently
npm run dev

# Or run services in separate terminals:
npm run dev:server
npm run dev:client
```

---

## 🗄️ Database Architecture & MongoDB Compass Inspection

All 9 collections in FinTrack feature optimized compound indexes designed for sub-50ms query response times under high data volume:

1. **`users`**: Unique index on `email`, index on `role` and `status`.
2. **`accounts`**: Compound index on `{ user: 1, isArchived: 1 }`.
3. **`categories`**: Compound unique index on `{ user: 1, name: 1, type: 1 }`, index on `isSystem`.
4. **`transactions`**: Compound indexes on `{ user: 1, date: -1 }`, `{ user: 1, category: 1 }`, `{ user: 1, account: 1 }`, and text index on `{ description: "text", notes: "text" }`.
5. **`budgets`**: Compound unique index on `{ user: 1, category: 1, year: 1, month: 1 }`.
6. **`recurringtransactions`**: Compound index on `{ user: 1, isActive: 1, nextOccurrence: 1 }`.
7. **`savingsgoals`**: Compound index on `{ user: 1, status: 1, targetDate: 1 }`.
8. **`notifications`**: Compound index on `{ user: 1, isRead: 1, createdAt: -1 }`.
9. **`auditlogs`**: Compound indexes on `{ createdAt: -1 }` and `{ actor: 1, createdAt: -1 }`.

---

## 🌐 Complete REST API Reference Matrix

All protected endpoints require valid HttpOnly cookie authentication (`fintrack_token`). Admin endpoints strictly require `role === "ADMIN"`.

### Authentication & User Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & set HttpOnly cookie |
| `POST` | `/api/auth/logout` | Protected | Clear session cookie & terminate session |
| `GET` | `/api/auth/me` | Protected | Retrieve authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request password recovery email token |
| `POST` | `/api/auth/reset-password` | Public | Reset password with token |
| `PATCH` | `/api/users/profile` | Protected | Update user name, phone, currency, timezone |
| `POST` | `/api/users/change-password` | Protected | Change password with current password verification |
| `DELETE`| `/api/users/me` | Protected | Delete user account and cascade associated data |

### Financial Accounts & Categories
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/accounts` | Protected | List all accounts with live calculated balances |
| `POST` | `/api/accounts` | Protected | Create a new financial account/wallet |
| `GET` | `/api/accounts/:id` | Protected | Retrieve account details & entity metrics |
| `PATCH` | `/api/accounts/:id` | Protected | Update account name, type, color, icon |
| `DELETE`| `/api/accounts/:id` | Protected | Archive or delete account |
| `GET` | `/api/categories` | Protected | List system and custom user categories |
| `POST` | `/api/categories` | Protected | Create a custom category (Income or Expense) |
| `PATCH` | `/api/categories/:id` | Protected | Update custom category name/icon/color |
| `DELETE`| `/api/categories/:id` | Protected | Delete custom category |

### Financial Transactions & Receipts
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | Protected | Query transactions with search, pagination & filters |
| `POST` | `/api/transactions` | Protected | Create income/expense transaction & update balance |
| `GET` | `/api/transactions/:id` | Protected | Retrieve single transaction details |
| `PATCH` | `/api/transactions/:id` | Protected | Edit transaction & recalculate account balance |
| `DELETE`| `/api/transactions/:id` | Protected | Delete transaction & restore account balance |
| `POST` | `/api/transactions/:id/receipt` | Protected | Upload multipart receipt file (JPG, PNG, WEBP, PDF) |
| `GET` | `/api/transactions/:id/receipt` | Protected | View/download receipt binary stream |
| `DELETE`| `/api/transactions/:id/receipt` | Protected | Delete attached receipt file from storage |

### Dashboard, Budgets, Recurring & Goals
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/overview` | Protected | Retrieve consolidated KPI cards, trends & breakdowns |
| `GET` | `/api/budgets` | Protected | List monthly budgets with spent usage & health status |
| `POST` | `/api/budgets` | Protected | Create monthly budget with threshold limits |
| `PATCH` | `/api/budgets/:id` | Protected | Update budget limit and threshold rules |
| `DELETE`| `/api/budgets/:id` | Protected | Delete monthly budget |
| `GET` | `/api/recurring-transactions` | Protected | List recurring rules & monthly equivalents |
| `POST` | `/api/recurring-transactions` | Protected | Create recurring transaction schedule |
| `POST` | `/api/recurring-transactions/process-due` | Protected | Manually trigger recurring scheduler run |
| `POST` | `/api/recurring-transactions/:id/pause` | Protected | Pause recurring subscription |
| `POST` | `/api/recurring-transactions/:id/resume` | Protected | Resume paused recurring rule |
| `DELETE`| `/api/recurring-transactions/:id` | Protected | Delete recurring rule |
| `GET` | `/api/goals` | Protected | List savings goals with progress percentages |
| `POST` | `/api/goals` | Protected | Create target savings goal |
| `POST` | `/api/goals/:id/contribute` | Protected | Allocate funds towards savings goal |
| `POST` | `/api/goals/:id/pause` | Protected | Pause savings goal |
| `POST` | `/api/goals/:id/resume` | Protected | Resume savings goal |
| `DELETE`| `/api/goals/:id` | Protected | Delete savings goal |

### Notifications, Analytics, Calendar & Reports
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Protected | Retrieve user notifications list |
| `GET` | `/api/notifications/unread-count` | Protected | Get total unread notifications count |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Protected | Mark all user notifications as read |
| `DELETE`| `/api/notifications/:id` | Protected | Delete single notification |
| `GET` | `/api/analytics` | Protected | Consolidated multi-period financial analytics |
| `GET` | `/api/analytics/trends` | Protected | Multi-month continuous trends series |
| `GET` | `/api/analytics/insights` | Protected | In-built deterministic financial advice & spikes |
| `GET` | `/api/calendar` | Protected | Combined daily transactions, bills & deadlines |
| `GET` | `/api/reports/monthly` | Protected | Monthly summary calculation breakdown |
| `GET` | `/api/reports/pdf` | Protected | Generate downloadable %PDF-1.4 binary statement |
| `GET` | `/api/reports/csv` | Protected | Export RFC 4180 CSV ledger statement |
| `GET` | `/api/reports/export-data` | Protected | Export complete user data archive |

### Administration & Governance (Admin Only)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Admin | Platform telemetry metrics & system health |
| `GET` | `/api/admin/users` | Admin | Paginated user management list with search |
| `GET` | `/api/admin/users/:id` | Admin | Detailed user profile & entity count summary |
| `PATCH` | `/api/admin/users/:id/status` | Admin | Activate, deactivate, or suspend user |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Promote user to Admin or demote |
| `POST` | `/api/admin/categories` | Admin | Create global system category |
| `PATCH` | `/api/admin/categories/:id` | Admin | Edit system category |
| `DELETE`| `/api/admin/categories/:id` | Admin | Soft-disable system category |
| `GET` | `/api/admin/audit-logs` | Admin | Paginated security audit trail with filters |
| `GET` | `/api/admin/settings` | Admin | Retrieve system settings & feature flags |
| `PATCH` | `/api/admin/settings/:key` | Admin | Update individual system setting |
| `PUT` | `/api/admin/settings` | Admin | Batch update system settings |
| `POST` | `/api/admin/settings/reset` | Admin | Reset system settings to defaults |

---

## 🧪 Quality Gates & Test Suites

FinTrack includes comprehensive test coverage spanning all 20 phases:

```bash
# Run Phase 20 Production Smoke Test Suite (21 critical production points)
npm --prefix server run test:phase20

# Run Phase 20 Frontend Production & Release Audit (32 assertions)
npm --prefix client run test:phase20

# Run All Previous Phase Regression Suites
npm --prefix server run test:phase9
npm --prefix server run test:phase10
npm --prefix server run test:phase11
npm --prefix server run test:phase13
npm --prefix server run test:phase14
npm --prefix server run test:phase15
npm --prefix server run test:phase16
npm --prefix server run test:phase17
npm --prefix server run test:phase18
npm --prefix server run test:phase19

# Run TypeScript Typecheck
npm --prefix server run typecheck
npm --prefix client run typecheck

# Run ESLint Audits
npm --prefix server run lint
npm --prefix client run lint

# Compile Production Bundles
npm --prefix server run build
npm --prefix client run build
```

---

## 🛡️ Security Architecture

1. **HttpOnly Cookie Authentication**: JWT session tokens are signed server-side and issued exclusively via `HttpOnly`, `SameSite=Lax/None`, and `Secure` (production) cookies. Tokens are never exposed to client JavaScript or stored in `localStorage`/`sessionStorage`.
2. **Server-Side Multi-Tenant Scoping**: All service queries strictly enforce `{ user: userId }` filters on every document operation. Attempting to query, update, or delete another tenant's resource strictly returns `404 Not Found`.
3. **Path Traversal Containment**: All receipt file operations use `getSafeReceiptPath` to validate resolved disk paths against normalized storage directories before performing filesystem operations.
4. **Credential-Sanitized Audit Trail**: Passwords, hashes, reset tokens, and cookies are stripped by `AuditService` before persisting administrative logs.
5. **No External AI APIs**: All analytical insights, category aggregations, and forecasts are generated through in-built deterministic mathematical rules.

---

## 📦 Production Deployment Guide

### 1. Build Compilation
```bash
npm --prefix server run build
npm --prefix client run build
```

### 2. Environment Configuration
Ensure `NODE_ENV=production`, `MONGO_URI` pointing to your secured database replica set, and high-entropy `JWT_SECRET` and `COOKIE_SECRET` values are set in your environment.

### 3. Process Management (PM2 / Container)
```bash
# Example PM2 startup
pm2 start server/dist/server.js --name fintrack-api -i max
```

### 4. Static Asset Serving (Nginx / CDN)
Serve the contents of `client/dist/` with SPA fallback routing:
```nginx
server {
    listen 443 ssl http2;
    server_name fintrack.example.com;

    ssl_certificate /etc/letsencrypt/live/fintrack.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fintrack.example.com/privkey.pem;

    root /var/www/fintrack/client/dist;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📄 License
FinTrack is proprietary software built according to specifications defined in `/docs`.
