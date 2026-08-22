# FinTrack — Implementation Plan

**Document:** `IMPLEMENTATION.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Related Documents:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASESCHEMA.md`, `UI/UX.md`, `WEBFLOW.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This document defines the implementation roadmap for FinTrack from project initialization through production readiness.

The implementation is divided into sequential phases.

Each phase defines:

- Objective
- Scope
- Backend work
- Frontend work
- Database work
- Security work
- Testing
- Completion criteria

The phases should be implemented in order unless a technical dependency requires otherwise.

---

# 2. Implementation Principles

The project must follow these principles:

1. Build from the locked source-of-truth documents.
2. Complete foundational infrastructure before feature development.
3. Implement backend authorization before exposing protected frontend features.
4. Keep financial calculations backend-authoritative.
5. Use deterministic internal logic for financial insights.
6. Never integrate AI APIs or AI API keys.
7. Keep secrets in environment variables.
8. Never commit `.env`.
9. Use `.env.example` as the configuration template.
10. Use bcrypt for password hashing.
11. Use JWT authentication with HTTP-only cookies.
12. Use Multer for multipart file upload handling.
13. Use MongoDB/Mongoose for persistence.
14. Build responsive UI from the beginning.
15. Test each feature before moving to the next phase.
16. Keep commits small and meaningful.
17. Avoid building placeholder architecture that will be discarded later.

---

# 3. Locked Technology Stack

## Frontend

```text
React
TypeScript
Vite
React Router
Tailwind CSS
Reusable component system
Charting library
Axios or equivalent HTTP client
```

## Backend

```text
Node.js
Express
TypeScript
Mongoose
JWT
bcrypt
Multer
Validation library
Centralized error handling
```

## Database

```text
MongoDB
MongoDB Compass
Mongoose
```

## Reports

```text
CSV generation
PDF generation
```

## Tooling

```text
Git
GitHub
ESLint
Prettier
Environment variables
Testing framework
```

---

# 4. Environment Configuration

Required files:

```text
.env
.env.example
.gitignore
```

`.env` is local/private.

`.env.example` is committed.

Example configuration categories:

```text
NODE_ENV
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
COOKIE settings
CLIENT_URL
ADMIN_EMAIL
ADMIN_PASSWORD
UPLOAD limits
FILE storage configuration
EMAIL configuration
```

No real secrets may be placed in `.env.example`.

---

# 5. Git Initialization

Initial repository:

```text
git init
```

Create:

```text
README.md
.gitignore
.env.example
```

Never commit:

```text
.env
node_modules
dist
build
coverage
uploads
temporary files
logs containing secrets
```

---

# 6. Recommended Project Structure

```text
fintrack/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   ├── types/
│   │   └── routes/
│   │
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── jobs/
│   │   ├── seed/
│   │   ├── types/
│   │   └── app/
│   │
│   └── ...
│
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASESCHEMA.md
│   ├── UI_UX.md
│   ├── WEBFLOW.md
│   └── IMPLEMENTATION.md
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

# 7. Phase 1 — Project Initialization

## Objective

Create the project foundation and development environment.

## Tasks

### Repository

```text
Initialize Git
Create repository
Create README
Create .gitignore
```

### Frontend

Initialize React + TypeScript + Vite.

### Backend

Initialize Node.js + TypeScript + Express.

### Tooling

Configure:

```text
ESLint
Prettier
TypeScript
```

### Environment

Create:

```text
.env
.env.example
```

### Documentation

Place all source-of-truth documents under:

```text
docs/
```

## Completion Criteria

```text
Frontend starts
Backend starts
TypeScript compiles
Lint runs
Formatting runs
Environment loads
Git ignores secrets
```

---

# 8. Phase 2 — Backend Foundation

## Objective

Build a clean and scalable Express backend.

## Tasks

Create:

```text
app
server
config
routes
controllers
services
middlewares
validators
models
utils
```

Implement:

```text
Express app
JSON parsing
CORS
Cookie parsing
Request logging
Error middleware
404 handler
Health endpoint
```

Health endpoint:

```text
GET /api/health
```

Expected:

```json
{
  "success": true,
  "message": "API is healthy"
}
```

## Completion Criteria

```text
Server starts
Health endpoint works
Errors are centralized
Environment is validated
MongoDB connection is isolated
```

---

# 9. Phase 3 — MongoDB & Mongoose Foundation

## Objective

Connect the backend to MongoDB.

## Tasks

Implement:

```text
MongoDB connection
Mongoose configuration
Connection error handling
Graceful shutdown
```

Verify through:

```text
MongoDB Compass
```

Create the first models:

```text
User
Category
Account
Transaction
```

## Completion Criteria

```text
Backend connects to MongoDB
Collections/models are recognized
MongoDB Compass can inspect development database
Connection failures are handled safely
```

---

# 10. Phase 4 — Authentication & User Model

## Objective

Build secure authentication.

## Tasks

Implement:

```text
User schema
Register
Login
Logout
Current user
Password hashing
JWT creation
JWT validation
HTTP-only cookie
Authentication middleware
```

Password rule:

```text
Plain password
      ↓
bcrypt
      ↓
passwordHash
      ↓
MongoDB
```

Never store plaintext passwords.

## Endpoints

Conceptually:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Completion Criteria

```text
Registration works
Password is bcrypt hashed
Login works
JWT session works
HTTP-only cookie is used
Protected route rejects unauthenticated users
Logout clears session
```

---

# 11. Phase 5 — Forgot/Reset Password

## Objective

Implement secure password recovery.

## Tasks

Create:

```text
PasswordResetToken model
```

Implement:

```text
Forgot password
Reset password
Token expiration
Token hashing
One-time use
```

## Security

Never store raw reset tokens.

Flow:

```text
Raw token
 ↓
Hash
 ↓
MongoDB
```

## Completion Criteria

```text
Forgot password request works
Reset link/token workflow works
Expired tokens fail
Used tokens fail
Password is rehashed with bcrypt
No account enumeration
```

---

# 12. Phase 6 — RBAC & Admin Foundation

## Objective

Implement role-based access control.

Roles:

```text
USER
ADMIN
```

## Tasks

Create:

```text
requireAuth
requireRole
```

Implement:

```text
Admin seed
Admin route protection
Admin user access
Audit log model/service
```

Admin credentials come from:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

## Completion Criteria

```text
Admin is seeded idempotently
User cannot access admin routes
Admin can access admin routes
Role checks occur on backend
Admin actions can be audited
```

---

# 13. Phase 7 — Seed System Data

## Objective

Create predictable baseline data.

Seed:

```text
Admin
System income categories
System expense categories
```

Income:

```text
Salary
Freelancing
Business
Investments
Other
```

Expense:

```text
Food
Transport
Shopping
Bills
Education
Entertainment
Healthcare
Other
```

Seed must be idempotent.

## Completion Criteria

Running seed twice does not create duplicates.

---

# 14. Phase 8 — Frontend Foundation

## Objective

Build the application shell.

## Tasks

Implement:

```text
Global CSS/tokens
Theme system
Light/dark/system mode
Router
App shell
Sidebar
Header
Mobile navigation
Responsive container
Reusable UI components
```

Create base components:

```text
Button
Input
Select
Dialog
Drawer
Toast
Card
Badge
Table
Skeleton
EmptyState
ErrorState
Progress
```

## Completion Criteria

```text
App shell works
Desktop responsive
Tablet responsive
Mobile responsive
Dark mode works
Navigation works
Components are reusable
```

---

# 15. Phase 9 — Authentication Frontend

## Objective

Connect authentication UI to the backend.

Pages:

```text
Login
Register
Forgot Password
Reset Password
```

Implement:

```text
Auth state
Session restoration
Protected routes
Logout
Form validation
Loading states
Error states
```

## Completion Criteria

```text
User can register
User can login
Protected dashboard works
User can logout
Session survives page refresh
Invalid session redirects to login
```

---

# 16. Phase 10 — User Profile & Settings

## Objective

Implement user preferences and profile management.

## Features

```text
Profile
Phone
Profile picture
Currency
Timezone
Date format
Theme
Notification preferences
Change password
Account deletion
```

## Completion Criteria

All changes persist correctly and remain user-scoped.

---

# 17. Phase 11 — Accounts / Wallets

## Objective

Implement multiple financial accounts.

Types:

```text
Cash
Bank Account
Credit Card
UPI
Other
```

## Backend

Implement:

```text
Account model
CRUD
Ownership checks
Status handling
Balance calculation
```

## Frontend

Implement:

```text
Accounts page
Account cards
Add account
Edit account
Deactivate/archive
```

## Completion Criteria

```text
User can create accounts
User can edit accounts
User cannot access another user's account
Balances are calculated correctly
Inactive accounts cannot receive prohibited new transactions
```

---

# 18. Phase 12 — Categories

## Objective

Implement system and custom categories.

## Backend

```text
Category model
List categories
Create custom category
Edit custom category
Deactivate custom category
Ownership validation
```

## Frontend

```text
Category management
Category selector
System/custom indicators
```

## Completion Criteria

```text
System categories exist
Users can create custom categories
Users cannot modify another user's category
Inactive categories cannot be used for new transactions
```

---

# 19. Phase 13 — Income & Expense Transactions

## Objective

Build the core financial transaction system.

## Backend

Implement:

```text
Transaction model
Create
Read
Update
Delete
Ownership
Category validation
Account validation
Payment method validation
Date validation
Amount validation
```

## Frontend

Implement:

```text
Transaction list
Add transaction
Edit transaction
Transaction details
Delete confirmation
```

## Completion Criteria

Users can safely manage income and expenses.

---

# 20. Phase 14 — Transaction Search & Filters

## Objective

Build powerful transaction discovery.

Filters:

```text
Date
Category
Type
Amount
Account
Payment Method
```

Search:

```text
Description
```

Example:

```text
Amazon
```

## Backend

Implement query parsing and indexed database queries.

## Frontend

Implement:

```text
Search
Filter controls
Clear filters
Pagination
Sorting where required
```

## Completion Criteria

Search/filter state remains consistent through pagination and navigation.

---

# 21. Phase 15 — Receipt Uploads with Multer

## Objective

Allow users to attach receipts to transactions.

## Technology

```text
Multer
```

## Tasks

Implement:

```text
Multipart parsing
File type validation
File size validation
Secure file naming
Storage strategy
Receipt metadata
Transaction association
Authorized file retrieval
```

## Supported formats

Final allowed formats must follow backend configuration.

Example:

```text
JPG
PNG
WEBP
PDF
```

## Completion Criteria

```text
Valid receipt uploads work
Invalid types fail
Oversized files fail
Files are not publicly exposed without authorization
Receipt metadata is stored
Users can view their own receipts
```

---

# 22. Phase 16 — Dashboard Backend

## Objective

Create backend aggregation services for the main dashboard.

Calculate:

```text
Total Income
Total Expenses
Remaining Balance
Savings Rate
```

Also:

```text
Monthly income vs expenses
Expenses by category
Spending trend
Savings trend
Payment method totals
Recent transactions
Upcoming recurring payments
Budget status
Goal progress
Notifications
```

## Completion Criteria

Dashboard APIs return consistent user-scoped data.

---

# 23. Phase 17 — Dashboard Frontend

## Objective

Build the main attraction of FinTrack.

Implement:

```text
Summary cards
Income/expense chart
Category chart
Spending trend
Savings trend
Budget widgets
Goal widgets
Account widget
Insight cards
Recent transactions
Upcoming payments
```

## Completion Criteria

Dashboard is:

```text
Responsive
Fast
Visually polished
Data-consistent
Accessible
```

---

# 24. Phase 18 — Monthly Budgets

## Objective

Implement category-based monthly budgets.

## Backend

```text
Budget model
Create
Read
Update
Delete/disable
Usage aggregation
Threshold evaluation
```

## Frontend

```text
Budget list
Budget card
Progress bar
Budget creation
Budget editing
Budget warning state
Exceeded state
```

## Completion Criteria

Example:

```text
Food
₹4,000 / ₹5,000
80%
```

works correctly.

---

# 25. Phase 19 — Budget Notifications

## Objective

Notify users when budget thresholds are crossed.

Rules:

```text
50%
75%
90%
100%+
```

Thresholds may be configurable.

## Flow

```text
Transaction
 ↓
Budget recalculation
 ↓
Threshold crossed
 ↓
Notification created
```

## Completion Criteria

Duplicate notification spam is prevented where appropriate.

---

# 26. Phase 20 — Recurring Transactions

## Objective

Implement recurring financial events.

Examples:

```text
Netflix
Rent
Electricity
Internet
Salary
```

## Backend

Implement:

```text
Recurring model
CRUD
Schedule logic
Due occurrence processing
Idempotency
Next occurrence calculation
Pause/resume
```

## Frontend

Implement:

```text
Recurring list
Create
Edit
Pause
Resume
Delete
Next payment display
```

## Completion Criteria

Recurring transactions do not duplicate.

---

# 27. Phase 21 — Recurring Transaction Job

## Objective

Automate due recurring transaction processing.

Implement a server-side scheduler/job.

Flow:

```text
Scheduler
 ↓
Find due records
 ↓
Check active state
 ↓
Check occurrence idempotency
 ↓
Create transaction
 ↓
Update nextOccurrence
```

The implementation must safely handle restarts.

---

# 28. Phase 22 — Savings Goals

## Objective

Implement savings planning.

## Backend

```text
SavingsGoal model
CRUD
Contribution logic
Progress calculation
Completion state
```

## Frontend

```text
Goal list
Goal card
Create goal
Edit goal
Add contribution
Progress display
```

## Completion Criteria

```text
Target
Current
Progress
Remaining
Target date
```

are displayed accurately.

---

# 29. Phase 23 — Notifications

## Objective

Create the persistent notification center.

Types:

```text
Budget alert
Budget exceeded
Recurring payment
Goal milestone
Financial insight
System
```

## Frontend

```text
Header badge
Notification dropdown
Notifications page
Read/unread
Mark all read
```

## Completion Criteria

Notifications are user-scoped and persistent.

---

# 30. Phase 24 — Analytics Backend

## Objective

Build reusable financial analytics services.

Implement aggregation for:

```text
Income
Expenses
Savings
Savings rate
Category spending
Payment method spending
Account spending
Monthly trends
```

## Completion Criteria

Analytics support date ranges and appropriate filters.

---

# 31. Phase 25 — Analytics Frontend

## Objective

Build detailed analytics UI.

Charts:

```text
Income vs Expenses
Expense Categories
Spending Trend
Savings Trend
Payment Methods
Account Spending
```

Add:

```text
Date range
Category filter
Account filter
Type filter
```

---

# 32. Phase 26 — Deterministic Financial Insights

## Objective

Build the internal insight engine without AI.

No:

```text
OpenAI
Gemini
Claude
Other AI APIs
AI API keys
```

Use internal rules.

Example:

```text
if currentFoodSpend > previousFoodSpend * 1.18
    generate food spending increase insight
```

Other rules:

```text
High category concentration
Budget threshold
Savings improvement
Savings decline
Unusual spending increase
Goal proximity
```

## Completion Criteria

Insights are:

```text
Deterministic
Explainable
Testable
User-scoped
```

---

# 33. Phase 27 — Financial Calendar

## Objective

Create calendar-based financial visibility.

Events:

```text
Recurring payments
Goal deadlines
Budget periods
Other supported financial events
```

Implement:

```text
Month navigation
Event list
Event details
Related resource navigation
```

---

# 34. Phase 28 — Reports

## Objective

Generate financial reports.

Formats:

```text
PDF
CSV
```

Monthly report:

```text
Income
Expenses
Savings
Savings Rate
Top Categories
Payment Methods
```

## Completion Criteria

Report numbers match dashboard/analytics definitions.

---

# 35. Phase 29 — User Data Export

## Objective

Allow users to export their own financial data.

Include appropriate:

```text
Transactions
Accounts
Budgets
Categories
Recurring transactions
Savings goals
```

Never export:

```text
passwordHash
reset tokens
JWTs
secrets
```

---

# 36. Phase 30 — Admin Dashboard

## Objective

Build administrative visibility.

Metrics:

```text
Total users
Active users
Transaction volume
Financial activity
```

Admin pages:

```text
Dashboard
Users
Categories
Audit Logs
System Settings
```

---

# 37. Phase 31 — Admin User Management

## Objective

Implement user administration.

Features:

```text
Search users
View safe profile information
Activate
Deactivate
Change role
```

All sensitive administrative actions must be audited.

---

# 38. Phase 32 — Admin Audit Logs

## Objective

Record important administrative operations.

Log:

```text
Actor
Action
Target
Timestamp
Safe metadata
```

Never log:

```text
Passwords
JWTs
Reset tokens
Secrets
```

---

# 39. Phase 33 — Admin System Settings

## Objective

Provide controlled system configuration.

Only expose explicitly approved settings.

Changes must:

```text
Validate
Persist
Audit
```

---

# 40. Phase 34 — Frontend Polish

## Objective

Bring the UI to production-quality visual consistency.

Review:

```text
Typography
Spacing
Colors
Dark mode
Responsive layouts
Cards
Tables
Forms
Charts
Dialogs
Toasts
Navigation
```

Remove:

```text
Placeholder text
Inconsistent styles
Unused components
Duplicate UI patterns
Temporary debugging UI
```

---

# 41. Phase 35 — Animation & Interaction Polish

## Objective

Add subtle motion without making the application feel artificial.

Add:

```text
Page transitions
Dialog transitions
Drawer transitions
Progress animation
Chart entrance animation
Toast animation
```

Respect:

```text
prefers-reduced-motion
```

Do not add excessive:

```text
glows
parallax
3D effects
floating gradients
```

---

# 42. Phase 36 — Accessibility

## Objective

Make the application accessible.

Test:

```text
Keyboard navigation
Focus states
Screen readers
Labels
Forms
Dialogs
Tables
Charts
Color contrast
Reduced motion
```

Fix all critical accessibility issues.

---

# 43. Phase 37 — Security Hardening

## Objective

Perform application security review.

Verify:

```text
JWT security
HTTP-only cookies
CSRF strategy
CORS
Rate limiting
Input validation
Authorization
RBAC
Ownership checks
File validation
Path traversal prevention
Secure headers
Password hashing
Reset token security
```

Verify no secret appears in:

```text
Git
Frontend bundle
Logs
API response
Error response
```

---

# 44. Phase 38 — Backend Testing

## Objective

Test backend behavior.

Unit tests:

```text
Validation
Business logic
Insight rules
Date calculations
Budget calculations
Savings calculations
```

Integration tests:

```text
Auth
Transactions
Budgets
Accounts
Goals
Recurring
Uploads
Reports
Admin
```

Security tests:

```text
Unauthorized access
Cross-user access
Role escalation
Invalid tokens
```

---

# 45. Phase 39 — Frontend Testing

## Objective

Test important user journeys.

Test:

```text
Login
Register
Dashboard
Add transaction
Edit transaction
Delete transaction
Search/filter
Budget
Goal
Recurring
Receipt
Reports
Settings
Admin
```

Test responsive behavior.

---

# 46. Phase 40 — End-to-End Testing

## Objective

Verify complete workflows across frontend/backend/database.

Critical E2E flows:

### Authentication

```text
Register → Login → Dashboard → Logout
```

### Transaction

```text
Login → Add Expense → Dashboard updates
```

### Budget

```text
Create Budget → Add Expense → Budget Usage Changes
```

### Recurring

```text
Create Recurring → Process Occurrence → Transaction Created
```

### Goal

```text
Create Goal → Add Contribution → Progress Updates
```

### Receipt

```text
Create Transaction → Upload Receipt → View Receipt
```

### Admin

```text
Admin Login → User Management → Audit Log
```

---

# 47. Phase 41 — Performance Optimization

## Objective

Improve real-world performance.

Review:

```text
Database indexes
Aggregation queries
API response sizes
Frontend bundle
Image sizes
Chart rendering
Pagination
Search debounce
Lazy loading
```

Avoid premature optimization.

Optimize measured bottlenecks.

---

# 48. Phase 42 — Database Review

## Objective

Validate the database against the locked schema.

Review:

```text
Collections
Indexes
Unique constraints
Ownership
Validation
Seed data
TTL indexes
Query performance
```

Inspect through MongoDB Compass.

---

# 49. Phase 43 — Production Configuration

## Objective

Prepare deployment configuration.

Set production environment values:

```text
NODE_ENV=production
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=...
```

Configure:

```text
Secure cookies
HTTPS
CORS
Logging
Upload storage
Database
Email/reset-password infrastructure
```

---

# 50. Phase 44 — Deployment Preparation

## Objective

Prepare frontend and backend builds.

Frontend:

```text
npm run build
```

Backend:

```text
npm run build
```

Verify:

```text
Environment variables
Build output
API URL
Database connectivity
Static assets
Uploads
```

---

# 51. Phase 45 — Production Smoke Test

Before release:

```text
Open application
Login
Register test account
Create transaction
Edit transaction
Delete transaction
Create budget
Create goal
Create recurring transaction
Upload receipt
Generate report
Check notifications
Check admin
```

---

# 52. Phase 46 — Documentation Finalization

Update:

```text
README.md
API documentation
Environment documentation
Setup instructions
Seed instructions
Deployment instructions
```

Confirm all source-of-truth documents are synchronized.

---

# 53. Phase 47 — Final QA

Final QA categories:

```text
Functional
Visual
Responsive
Accessibility
Security
Performance
Data integrity
Authentication
Authorization
File uploads
Reports
Admin
```

No known critical/high severity defects should remain.

---

# 54. Phase 48 — Release

Release checklist:

```text
Production environment configured
Database ready
Indexes created
Admin seeded
Frontend deployed
Backend deployed
HTTPS enabled
Cookies secure
Uploads configured
Reports tested
Email/reset password tested
Monitoring/logging available
Backup strategy confirmed
```

---

# 55. Phase 49 — Post-Release Verification

After deployment:

```text
Health endpoint
Login
Dashboard
Database
Uploads
Reports
Notifications
Admin
```

Monitor:

```text
Error rate
API latency
Database errors
Upload failures
Authentication failures
```

---

# 56. Implementation Dependency Graph

```text
Phase 1
  ↓
Phase 2
  ↓
Phase 3
  ↓
Phase 4
  ↓
Phase 5
  ↓
Phase 6
  ↓
Phase 7
  ↓
Phase 8
  ↓
Phase 9
  ↓
Phase 10
  ↓
Phase 11
  ↓
Phase 12
  ↓
Phase 13
  ↓
Phase 14
  ↓
Phase 15
  ↓
Phase 16
  ↓
Phase 17
  ↓
Phase 18
  ↓
Phase 19
  ↓
Phase 20
  ↓
Phase 21
  ↓
Phase 22
  ↓
Phase 23
  ↓
Phase 24
  ↓
Phase 25
  ↓
Phase 26
  ↓
Phase 27
  ↓
Phase 28
  ↓
Phase 29
  ↓
Phase 30
  ↓
Phase 31
  ↓
Phase 32
  ↓
Phase 33
  ↓
Phase 34
  ↓
Phase 35
  ↓
Phase 36
  ↓
Phase 37
  ↓
Phase 38
  ↓
Phase 39
  ↓
Phase 40
  ↓
Phase 41
  ↓
Phase 42
  ↓
Phase 43
  ↓
Phase 44
  ↓
Phase 45
  ↓
Phase 46
  ↓
Phase 47
  ↓
Phase 48
  ↓
Phase 49
```

Some phases may be developed in parallel by separate developers, but dependencies must be respected.

---

# 57. Recommended Development Order by Milestone

## Milestone 1 — Foundation

```text
Phase 1
Phase 2
Phase 3
```

Result:

```text
Working full-stack skeleton
```

---

## Milestone 2 — Authentication

```text
Phase 4
Phase 5
Phase 6
Phase 7
Phase 8
Phase 9
```

Result:

```text
Secure authentication + RBAC
```

---

## Milestone 3 — Financial Core

```text
Phase 10
Phase 11
Phase 12
Phase 13
Phase 14
Phase 15
```

Result:

```text
Users can securely track money.
```

---

## Milestone 4 — Dashboard & Budgeting

```text
Phase 16
Phase 17
Phase 18
Phase 19
```

Result:

```text
Core financial dashboard
+
Budget management
```

---

## Milestone 5 — Planning

```text
Phase 20
Phase 21
Phase 22
Phase 23
```

Result:

```text
Recurring transactions
Savings goals
Notifications
```

---

## Milestone 6 — Intelligence Without AI

```text
Phase 24
Phase 25
Phase 26
Phase 27
```

Result:

```text
Analytics
Deterministic insights
Financial calendar
```

---

## Milestone 7 — Reporting

```text
Phase 28
Phase 29
```

Result:

```text
PDF
CSV
Data export
```

---

## Milestone 8 — Administration

```text
Phase 30
Phase 31
Phase 32
Phase 33
```

Result:

```text
Admin platform
RBAC
Auditability
```

---

## Milestone 9 — Production Quality

```text
Phase 34
Phase 35
Phase 36
Phase 37
Phase 38
Phase 39
Phase 40
Phase 41
Phase 42
```

Result:

```text
Production-quality application
```

---

## Milestone 10 — Release

```text
Phase 43
Phase 44
Phase 45
Phase 46
Phase 47
Phase 48
Phase 49
```

Result:

```text
Production deployment
```

---

# 58. Definition of Done

A phase is not complete merely because the code works locally.

A phase is complete when:

```text
Feature implemented
+
Validation implemented
+
Authorization implemented
+
Error handling implemented
+
Responsive UI implemented where applicable
+
Loading/empty/error states implemented
+
Tests written
+
Lint/type checks pass
+
Documentation remains consistent
```

---

# 59. Financial Feature Definition of Done

Every financial feature must verify:

```text
Correct amount
Correct ownership
Correct date
Correct category
Correct account
Correct calculations
Correct dashboard impact
Correct analytics impact
Correct report impact
```

---

# 60. Authentication Definition of Done

Authentication is complete only when:

```text
Registration
Login
Logout
Session restore
Protected routes
Password hashing
Forgot password
Reset password
RBAC
```

are all tested.

---

# 61. Authorization Definition of Done

Every protected backend endpoint must answer:

```text
Who is the user?
Is the user authenticated?
Does the user have the required role?
Does the requested resource belong to the user?
```

---

# 62. Upload Definition of Done

Receipt uploads are complete only when:

```text
Multer configured
Type validated
Size validated
File safely stored
Metadata stored
Authorization enforced
Unauthorized retrieval prevented
Delete/replace behavior defined
```

---

# 63. Reporting Definition of Done

Reports are complete only when:

```text
Dashboard numbers
Analytics numbers
Report numbers
```

use consistent backend financial definitions.

---

# 64. Admin Definition of Done

Admin functionality is complete only when:

```text
Admin seeded
RBAC enforced
User management works
Audit logs work
Sensitive fields protected
Unauthorized users blocked
```

---

# 65. Testing Gate

Before moving to the next major milestone:

```text
TypeScript passes
Lint passes
Unit tests pass
Integration tests pass
Critical E2E flows pass
```

No known critical security issue may remain.

---

# 66. Git Commit Strategy

Use meaningful commits.

Examples:

```text
feat(auth): add JWT authentication
feat(transactions): add transaction CRUD
feat(budgets): add monthly budget tracking
feat(goals): add savings goals
feat(reports): add CSV export
fix(auth): prevent session leakage
fix(transactions): validate account ownership
refactor(analytics): extract aggregation service
test(auth): add reset password coverage
```

Avoid commits such as:

```text
update
changes
final
done
test
```

---

# 67. Branching Strategy

Recommended:

```text
main
develop
feature/*
fix/*
```

Example:

```text
feature/authentication
feature/transactions
feature/budgets
feature/analytics
```

Pull requests should be reviewed before merging when working in a team.

---

# 68. Code Review Checklist

Review:

```text
Security
Authorization
Ownership
Validation
Error handling
Types
Tests
Performance
Naming
Duplication
UI consistency
Responsive behavior
```

---

# 69. No-AI Implementation Rule

The following are explicitly prohibited for this project:

```text
AI API integrations
AI API keys
AI chatbot
AI-generated financial recommendations
LLM-based expense classification
External AI financial analysis
```

Financial intelligence must use:

```text
MongoDB data
+
Backend aggregation
+
Deterministic business rules
```

---

# 70. Example Deterministic Insight Implementation

Concept:

```text
currentExpense = calculateCurrentMonthExpense()
previousExpense = calculatePreviousMonthExpense()

if previousExpense > 0:
    change = ((currentExpense - previousExpense) / previousExpense) * 100

    if change >= threshold:
        createInsight(...)
```

The rule should be:

```text
deterministic
repeatable
testable
explainable
```

---

# 71. Environment Security Rule

Never commit:

```text
.env
```

Commit:

```text
.env.example
```

The `.env.example` file must contain placeholders:

```text
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```

Do not use real credentials.

---

# 72. MongoDB Compass Workflow

Development workflow:

```text
Start MongoDB
 ↓
Start backend
 ↓
Mongoose connects
 ↓
Run seed
 ↓
Open MongoDB Compass
 ↓
Inspect:
users
categories
transactions
accounts
budgets
recurringtransactions
savingsgoals
notifications
auditlogs
```

Compass is for inspection/development management.

The application uses Mongoose.

---

# 73. Seed Workflow

Recommended command concept:

```text
npm run seed
```

Flow:

```text
Load environment
 ↓
Connect MongoDB
 ↓
Seed admin
 ↓
Seed system categories
 ↓
Close connection
```

Seed should be safe to run multiple times.

---

# 74. Development Run Workflow

Typical development:

```text
Terminal 1
Frontend
 ↓
npm run dev

Terminal 2
Backend
 ↓
npm run dev

MongoDB
 ↓
Running/connected

MongoDB Compass
 ↓
Optional inspection
```

---

# 75. Production Build Workflow

```text
Install dependencies
 ↓
Load production environment
 ↓
Build frontend
 ↓
Build backend
 ↓
Run database setup/migrations/seed as required
 ↓
Start backend
 ↓
Serve/deploy frontend
 ↓
Smoke test
```

---

# 76. API Development Pattern

Each feature should follow:

```text
Route
 ↓
Middleware
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Model/Repository
 ↓
MongoDB
```

Controller should remain thin.

Business logic belongs in services.

---

# 77. Financial Service Pattern

Example:

```text
TransactionService
BudgetService
AccountService
AnalyticsService
InsightService
ReportService
RecurringTransactionService
SavingsGoalService
NotificationService
```

Avoid putting complex financial calculations directly in route handlers.

---

# 78. Frontend Feature Pattern

Each major feature should have:

```text
Page
Components
API service
Types
Hooks/state
Validation
Loading state
Error state
Empty state
```

---

# 79. Shared Financial Utility Layer

Create shared utilities for:

```text
Currency formatting
Percentage formatting
Date formatting
Date range calculation
Financial period calculation
```

Do not duplicate formatting/calculation logic across pages.

---

# 80. Backend Financial Utility Layer

Centralize:

```text
Money validation
Date periods
Savings rate
Budget percentage
Goal percentage
Trend comparison
```

---

# 81. Data Fetching Strategy

Use a consistent frontend data-fetching approach.

Requirements:

```text
Loading state
Error state
Caching where appropriate
Invalidation after mutations
```

Avoid unnecessary repeated requests.

---

# 82. Mutation Invalidation

After creating an expense, invalidate/refresh relevant data:

```text
Transactions
Dashboard
Budgets
Analytics
Accounts
Notifications
```

Only refresh what is actually affected.

---

# 83. Security Testing Examples

Test:

```text
User A cannot read User B transaction
User A cannot edit User B transaction
User A cannot delete User B transaction
User cannot access admin route
User cannot modify system category
User cannot upload unauthorized receipt
```

---

# 84. File Security Testing

Test:

```text
Invalid extension
Invalid MIME
Oversized file
Malformed file
Unauthorized access
Path traversal attempt
Unexpected filename
```

---

# 85. Financial Integrity Testing

Test:

```text
Income increases income total
Expense increases expense total
Deleting expense decreases expense total
Budget usage changes correctly
Account balance changes correctly
Savings rate changes correctly
Analytics reflect transaction changes
Reports reflect transaction changes
```

---

# 86. Recurring Integrity Testing

Test:

```text
Due recurring transaction creates exactly one transaction
Repeated job execution does not duplicate it
Paused recurring transaction does not process
Expired recurring transaction stops
Next occurrence is correct
```

---

# 87. Budget Testing

Test:

```text
0%
50%
75%
90%
100%
>100%
```

Verify:

```text
Progress
Remaining
Warning
Critical
Exceeded
Notification
```

---

# 88. Goal Testing

Test:

```text
0%
43.75%
99%
100%
>100%
```

Verify completion behavior.

---

# 89. Analytics Testing

Test:

```text
No transactions
One month
Multiple months
Only income
Only expenses
Income + expenses
Category filtering
Account filtering
Date filtering
```

---

# 90. Report Testing

Verify:

```text
PDF opens
CSV opens
Values match dashboard
Values match analytics
No sensitive fields included
Correct date range
Correct currency
```

---

# 91. Responsive QA

Test at minimum:

```text
Small mobile
Large mobile
Tablet
Laptop
Desktop
Large desktop
```

Verify:

```text
Navigation
Tables
Forms
Charts
Dialogs
Cards
Dashboard
Admin
```

---

# 92. Browser QA

Verify supported modern browsers according to deployment target.

At minimum, test:

```text
Chrome
Edge
Firefox
Safari where applicable
```

---

# 93. Accessibility QA

Check:

```text
Keyboard-only navigation
Focus visibility
Screen reader labels
Color contrast
Form labels
Dialog focus
Table semantics
Chart summaries
Reduced motion
```

---

# 94. Final Source-of-Truth Check

Before release, compare:

```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

Confirm:

```text
No contradictory features
No missing locked feature
No unauthorized AI integration
No conflicting technology
No conflicting data model
No conflicting navigation
```

---

# 95. Phase Completion Tracker

Recommended project tracker:

| Phase | Status |
|---|---|
| 1. Project Initialization | Pending |
| 2. Backend Foundation | Pending |
| 3. MongoDB Foundation | Pending |
| 4. Authentication | Pending |
| 5. Forgot/Reset Password | Pending |
| 6. RBAC/Admin Foundation | Pending |
| 7. Seed Data | Pending |
| 8. Frontend Foundation | Pending |
| 9. Authentication Frontend | Pending |
| 10. Profile/Settings | Pending |
| 11. Accounts | Pending |
| 12. Categories | Pending |
| 13. Transactions | Pending |
| 14. Search/Filters | Pending |
| 15. Receipt Uploads | Pending |
| 16. Dashboard Backend | Pending |
| 17. Dashboard Frontend | Pending |
| 18. Budgets | Pending |
| 19. Budget Notifications | Pending |
| 20. Recurring Transactions | Pending |
| 21. Recurring Job | Pending |
| 22. Savings Goals | Pending |
| 23. Notifications | Pending |
| 24. Analytics Backend | Pending |
| 25. Analytics Frontend | Pending |
| 26. Deterministic Insights | Pending |
| 27. Calendar | Pending |
| 28. Reports | Pending |
| 29. Data Export | Pending |
| 30. Admin Dashboard | Pending |
| 31. Admin Users | Pending |
| 32. Audit Logs | Pending |
| 33. System Settings | Pending |
| 34. UI Polish | Pending |
| 35. Motion Polish | Pending |
| 36. Accessibility | Pending |
| 37. Security Hardening | Pending |
| 38. Backend Testing | Pending |
| 39. Frontend Testing | Pending |
| 40. E2E Testing | Pending |
| 41. Performance | Pending |
| 42. Database Review | Pending |
| 43. Production Config | Pending |
| 44. Deployment Prep | Pending |
| 45. Smoke Test | Pending |
| 46. Documentation | Pending |
| 47. Final QA | Pending |
| 48. Release | Pending |
| 49. Post-Release Verification | Pending |

---

# 96. Final Implementation Checklist

Before declaring FinTrack complete:

## Foundation

```text
[ ] Repository configured
[ ] Frontend configured
[ ] Backend configured
[ ] TypeScript configured
[ ] Lint configured
[ ] Formatting configured
[ ] .env configured
[ ] .env.example configured
[ ] .gitignore configured
```

## Authentication

```text
[ ] Register
[ ] Login
[ ] Logout
[ ] JWT
[ ] HTTP-only cookie
[ ] Protected routes
[ ] Forgot password
[ ] Reset password
[ ] bcrypt
```

## RBAC

```text
[ ] User role
[ ] Admin role
[ ] Admin seed
[ ] Role middleware
[ ] Admin routes
[ ] Audit logs
```

## Financial Core

```text
[ ] Accounts
[ ] Categories
[ ] Transactions
[ ] Search
[ ] Filters
[ ] Receipts
```

## Planning

```text
[ ] Budgets
[ ] Budget alerts
[ ] Recurring transactions
[ ] Recurring scheduler
[ ] Savings goals
```

## Analytics

```text
[ ] Dashboard
[ ] Income analytics
[ ] Expense analytics
[ ] Category analytics
[ ] Spending trend
[ ] Savings trend
[ ] Deterministic insights
```

## Productivity

```text
[ ] Calendar
[ ] Notifications
[ ] Reports
[ ] CSV
[ ] PDF
[ ] Data export
```

## UX

```text
[ ] Responsive
[ ] Mobile navigation
[ ] Dark mode
[ ] Loading states
[ ] Error states
[ ] Empty states
[ ] Accessible forms
[ ] Accessible charts
[ ] Subtle transitions
```

## Security

```text
[ ] Authorization
[ ] Ownership checks
[ ] Rate limiting
[ ] Input validation
[ ] File validation
[ ] Secure cookies
[ ] CORS
[ ] Security headers
[ ] No secrets in Git
[ ] No AI API keys
```

---

# 97. Final Architecture Constraint

Implementation must preserve the following high-level flow:

```text
React Frontend
      ↓
HTTP API
      ↓
Express
      ↓
Auth / RBAC / Validation
      ↓
Controllers
      ↓
Services
      ↓
Mongoose
      ↓
MongoDB
```

For receipts:

```text
React
 ↓
Multipart Request
 ↓
Multer
 ↓
Validation
 ↓
File Storage
 ↓
Receipt Metadata
 ↓
MongoDB
```

For financial insights:

```text
MongoDB
 ↓
Aggregation
 ↓
Analytics Service
 ↓
Deterministic Insight Rules
 ↓
Insight
 ↓
Frontend
```

No AI API is present in any of these flows.

---

# 98. Final Scope Lock

The implementation roadmap is locked to the approved FinTrack v1 scope.

The project must include:

```text
Authentication
JWT
bcrypt
Forgot/reset password
Protected dashboard
RBAC
Default seeded admin
Income/expense management
Accounts/wallets
Categories
Search/filter
Receipt uploads using Multer
Dashboard analytics
Monthly budgets
Budget alerts
Recurring transactions
Savings goals
Expense analytics
Deterministic financial insights
Calendar
Notifications
PDF reports
CSV exports
User data export
Dark mode
Responsive UI
Admin dashboard
Admin user management
Audit logs
System settings
```

The project must not include:

```text
AI API integrations
AI API keys
AI chatbot
AI financial advisor
External AI classification
External AI-generated insights
```

---

# 99. Final Implementation Source-of-Truth Rule

Implementation decisions must remain aligned with:

```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```

If implementation reveals a necessary change, update the relevant source-of-truth document before treating the new behavior as part of the locked product.

---

# 100. Final Statement

`IMPLEMENTATION.md` defines the complete phased implementation roadmap for FinTrack v1.

The project should be developed from foundation → authentication → financial core → dashboard → planning → analytics → reporting → administration → quality → deployment.

Each phase must meet its definition of done before the project moves forward.

The application must remain:

```text
Secure
Responsive
Maintainable
Testable
Professional
User-focused
Financially consistent
AI-free
```

**`IMPLEMENTATION.md` is the implementation roadmap and execution source of truth for FinTrack v1.**
