# FinTrack — Personal Finance Management Platform

FinTrack is a full-stack personal finance management web application engineered for financial clarity, rigorous data ownership, deterministic analytics, and enterprise-grade security.

---

## 🔒 Source of Truth Documentation

The complete product scope, architecture, and design specifications are locked under `/docs`:

1. [`PRD.md`](docs/PRD.md) — Product Requirements Document
2. [`TRD.md`](docs/TRD.md) — Technical Requirements Document
3. [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System Architecture Document
4. [`DATABASESCHEMA.md`](docs/DATABASESCHEMA.md) — Database Schema Document
5. [`UI_UX.md`](docs/UI_UX.md) — UI/UX Design Specification
6. [`WEBFLOW.md`](docs/WEBFLOW.md) — Web Flow Specification
7. [`IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) — 20-Phase Implementation Plan

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, React Router, Tailwind CSS, Lucide React, Axios
- **Backend**: Node.js, Express, TypeScript, Mongoose, MongoDB, JWT, bcrypt, Multer, Zod, Helmet, CORS
- **Database**: MongoDB (inspected via MongoDB Compass)
- **Intelligence**: Built-in deterministic calculation engine (Strictly **No External AI APIs / No LLMs**)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- MongoDB (running locally or remote URI)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` if not already present:
```bash
cp .env.example .env
```

### 4. Running Locally
```bash
# Run both frontend and backend in development mode
npm run dev

# Or run separately:
npm run dev:server
npm run dev:client
```

### 5. Type Checking & Building
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Production build
npm run build
```

---

## 📁 Repository Structure

```text
fintrack/
├── client/              # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI primitives
│   │   ├── pages/       # Application views
│   │   ├── layouts/     # Shell layouts (Auth, App, Admin)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API client services
│   │   ├── stores/      # State management
│   │   ├── utils/       # Formatting & helper utilities
│   │   ├── types/       # TypeScript declarations
│   │   └── routes/      # Application router
│   └── ...
├── server/              # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/      # Environment & database configuration
│   │   ├── controllers/ # HTTP route controllers
│   │   ├── middlewares/ # Auth, RBAC, Validation, Error middlewares
│   │   ├── models/      # Mongoose database models
│   │   ├── routes/      # Express API route definitions
│   │   ├── services/    # Business logic & financial services
│   │   ├── validators/  # Zod request validators
│   │   ├── utils/       # Loggers & helpers
│   │   ├── jobs/        # Background processing
│   │   ├── seed/        # Idempotent database seeds
│   │   └── types/       # Backend TypeScript types
│   └── ...
├── docs/                # 7 Locked Source of Truth Documents
├── uploads/             # Multipart upload storage (git ignored)
├── .env.example         # Environment template
└── package.json         # Workspace root orchestration
```
