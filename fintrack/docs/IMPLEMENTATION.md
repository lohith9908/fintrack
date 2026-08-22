FinTrack — Implementation Plan
Document: `IMPLEMENTATION.md`  
Version: 2.0  
Status: Locked / Source of Truth  
Product: FinTrack — Personal Finance Management Platform  
Related Documents: `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASESCHEMA.md`, `UI/UX.md`, `WEBFLOW.md`  
Date: 22 August 2026
---
1. Document Purpose
This document defines the complete implementation roadmap for FinTrack from project initialization through production release.
The original implementation roadmap has been consolidated into 20 optimal phases without removing the approved product scope.
The goal is to keep the implementation:
Sequential
Practical
Testable
Maintainable
Portfolio-ready
Production-oriented
Each phase groups closely related work while preserving the same functional requirements previously defined.
This document is the implementation and execution source of truth.
---
2. Locked Implementation Principles
The project must follow these principles:
Build strictly from the locked source-of-truth documents.
Complete foundational infrastructure before feature development.
Implement backend authentication and authorization before protected frontend functionality.
Keep financial calculations backend-authoritative.
Keep all user data isolated by ownership.
Use deterministic internal logic for financial insights.
Do not integrate any AI API, AI API key, AI chatbot, or external AI financial service.
Store passwords only as bcrypt hashes.
Use JWT authentication with secure HTTP-only cookies.
Use Multer for receipt upload handling.
Keep secrets in environment variables.
Never commit `.env`.
Commit `.env.example`.
Use MongoDB/Mongoose for persistence.
Build responsive UI from the beginning.
Test each major feature before moving forward.
Keep business logic in backend services rather than route handlers.
Use reusable frontend components.
Do not duplicate financial calculation logic across features.
Do not consider a feature complete until validation, authorization, error handling, and relevant tests exist.
---
3. Locked Technology Stack
Frontend
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
Backend
```text
Node.js
Express
TypeScript
Mongoose
MongoDB
JWT
bcrypt
Multer
Validation library
Centralized error handling
```
Database
```text
MongoDB
MongoDB Compass
Mongoose
```
Reports
```text
CSV generation
PDF generation
```
Development
```text
Git
GitHub
ESLint
Prettier
Environment variables
Testing framework
```
---
4. Environment Configuration
Required project configuration files:
```text
.env
.env.example
.gitignore
```
`.env` is local/private and must never be committed.
`.env.example` is committed and contains placeholders only.
Expected configuration categories include:
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
EMAIL/reset-password configuration
```
No real credentials or secrets may be stored in `.env.example`.
---
5. Recommended Project Structure
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
Phase 1 — Project Initialization & Development Foundation
Objective
Create the repository, application structure, development tooling, and documentation foundation.
Tasks
Repository
```text
Initialize Git
Create repository
Create README.md
Create .gitignore
```
Frontend
Initialize:
```text
React
TypeScript
Vite
```
Backend
Initialize:
```text
Node.js
TypeScript
Express
```
Tooling
Configure:
```text
ESLint
Prettier
TypeScript
```
Environment
Create:
```text
.env
.env.example
```
Documentation
Create/organize:
```text
docs/
```
with all seven source-of-truth documents.
Git Ignore
Must ignore:
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
Completion Criteria
```text
[ ] Frontend starts
[ ] Backend starts
[ ] TypeScript compiles
[ ] ESLint runs
[ ] Prettier runs
[ ] Environment configuration loads
[ ] Git ignores secrets
[ ] Documentation structure exists
```
---
Phase 2 — Backend Architecture, API Foundation & MongoDB
Objective
Build the backend foundation and establish the MongoDB/Mongoose connection.
Backend Structure
Create:
```text
config
routes
controllers
services
middlewares
validators
models
utils
jobs
seed
types
```
Express Foundation
Implement:
```text
Express app
JSON parsing
Cookie parsing
CORS
Request logging
Central error middleware
404 handler
Health endpoint
```
Health endpoint:
```text
GET /api/health
```
Expected response:
```json
{
  "success": true,
  "message": "API is healthy"
}
```
MongoDB
Implement:
```text
MongoDB connection
Mongoose configuration
Connection failure handling
Graceful shutdown
```
Development database must be inspectable through:
```text
MongoDB Compass
```
API Pattern
Every feature should follow:
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
Mongoose
 ↓
MongoDB
```
Controllers should remain thin.
Business logic belongs in services.
Completion Criteria
```text
[ ] API starts
[ ] Health endpoint works
[ ] MongoDB connects
[ ] MongoDB Compass can inspect development database
[ ] Errors are centralized
[ ] Environment variables are validated
[ ] Graceful shutdown works
```
---
Phase 3 — Database Models, Indexes & Seed System
Objective
Implement the database schema defined by `DATABASESCHEMA.md`.
Core Models
Create the required models, including:
```text
User
Category
Account
Transaction
Budget
RecurringTransaction
SavingsGoal
Notification
PasswordResetToken
AuditLog
```
Additional supporting models/structures should follow the locked database schema.
Database Requirements
Implement:
```text
Schema validation
Enums
References
Ownership fields
Timestamps
Unique constraints
Indexes
TTL indexes where required
```
Important Index Areas
Index common queries for:
```text
User email
User role/status
Transaction user/date
Transaction user/category
Transaction user/type
Transaction user/description/search fields where appropriate
Budget user/month/category
Recurring transaction next occurrence
Notifications user/read status
Reset token expiration
Audit log actor/date
```
Seed System
Seed:
```text
Default admin
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
Expenses:
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
Running it multiple times must not create duplicate admin/system categories.
Completion Criteria
```text
[ ] Models created
[ ] Relationships correct
[ ] Indexes created
[ ] Constraints implemented
[ ] Seed command works
[ ] Seed is idempotent
[ ] MongoDB Compass shows expected collections
```
---
Phase 4 — Authentication, Password Security & Session Management
Objective
Build secure user authentication.
Features
Implement:
```text
Register
Login
Logout
Current user/session
JWT authentication
Protected routes
bcrypt password hashing
HTTP-only cookie
```
Registration Flow
```text
Register
 ↓
Validate
 ↓
Check email
 ↓
bcrypt hash password
 ↓
Create user
 ↓
Create session/JWT
 ↓
HTTP-only cookie
 ↓
Dashboard/onboarding
```
Login Flow
```text
Email + Password
 ↓
Find user
 ↓
bcrypt.compare()
 ↓
Generate JWT
 ↓
Secure HTTP-only cookie
 ↓
Dashboard
```
Use safe authentication errors:
```text
Invalid email or password.
```
Do not reveal whether an email exists.
Logout
```text
Logout
 ↓
Invalidate/clear authentication
 ↓
Clear client state
 ↓
Login
```
Session Restoration
```text
Application starts
 ↓
GET /api/auth/me
 ↓
Valid session?
 ├── Yes → authenticated application
 └── No → public/authentication state
```
Completion Criteria
```text
[ ] Registration works
[ ] Passwords are bcrypt hashed
[ ] Plain passwords are never stored
[ ] Login works
[ ] JWT works
[ ] JWT is not exposed to frontend JavaScript
[ ] HTTP-only cookie is used
[ ] Protected endpoints reject unauthenticated requests
[ ] Logout works
[ ] Session restoration works
```
---
Phase 5 — Forgot/Reset Password & RBAC
Objective
Complete account recovery and role-based access control.
Password Recovery
Create secure password reset flow:
```text
Forgot password
 ↓
Generate secure reset token
 ↓
Hash token
 ↓
Store token hash + expiration
 ↓
Send reset link
 ↓
User opens link
 ↓
Validate token
 ↓
bcrypt hash new password
 ↓
Update password
 ↓
Invalidate token
```
Reset tokens must:
```text
Expire
Be one-time use
Never be stored in plaintext
```
Forgot-password responses must prevent account enumeration.
RBAC
Roles:
```text
USER
ADMIN
```
Implement:
```text
requireAuth
requireRole
```
Authorization must be enforced on the backend.
Admin Seed
Admin credentials come from environment variables:
```text
ADMIN_EMAIL
ADMIN_PASSWORD
```
The seed creates the admin only if it does not already exist.
Completion Criteria
```text
[ ] Forgot password works
[ ] Reset token is hashed
[ ] Reset token expires
[ ] Reset token is one-time use
[ ] New password uses bcrypt
[ ] USER role exists
[ ] ADMIN role exists
[ ] Admin is seeded idempotently
[ ] Admin routes are protected
[ ] Normal users receive 403/forbidden behavior
```
---
Phase 6 — Frontend Foundation, Design System & Application Shell
Objective
Build the reusable frontend foundation based on `UI/UX.md`.
Implement
```text
Global styles
Design tokens
Typography
Spacing
Color system
Light mode
Dark mode
System theme
Responsive containers
Router
```
Shared Components
Create:
```text
Button
IconButton
Input
Textarea
Select
DatePicker
CurrencyInput
Checkbox
Switch
Tabs
Dropdown
Tooltip
Dialog
Drawer
Toast
Badge
Card
Table
Pagination
Progress
Avatar
Skeleton
EmptyState
ErrorState
ConfirmDialog
ChartContainer
```
Application Shell
Desktop:
```text
Sidebar
Header
Main Content
```
Mobile:
```text
Mobile navigation
Drawer/sheet where appropriate
```
Design Requirements
The UI must be:
```text
Professional
Clean
Responsive
Accessible
Fintech-oriented
Subtle
Consistent
```
Avoid:
```text
Excessive gradients
Excessive glassmorphism
AI-style UI
AI badges
AI chatbot
Decorative clutter
```
Completion Criteria
```text
[ ] App shell works
[ ] Routing works
[ ] Desktop layout works
[ ] Tablet layout works
[ ] Mobile layout works
[ ] Light mode works
[ ] Dark mode works
[ ] System theme works
[ ] Shared components exist
```
---
Phase 7 — Authentication Frontend, Protected Routes & User Settings
Objective
Connect frontend authentication to the backend and implement account settings.
Authentication Pages
Create:
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
Redirect behavior
Logout
Form validation
Loading states
Error states
```
Settings
Implement:
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
Profile Picture
Use the approved file upload strategy where applicable.
Validate:
```text
File type
File size
Authorization
```
Account Deletion
Flow:
```text
Settings
 ↓
Delete Account
 ↓
Warning
 ↓
Confirmation
 ↓
Delete/invalidate account
 ↓
Logout
 ↓
Login
```
Completion Criteria
```text
[ ] Register page works
[ ] Login page works
[ ] Forgot password page works
[ ] Reset password page works
[ ] Protected routes work
[ ] Session survives refresh
[ ] Logout works
[ ] Profile updates work
[ ] Settings persist
[ ] Password change works
[ ] Account deletion works
```
---
Phase 8 — Accounts, Wallets & Categories
Objective
Implement financial accounts and transaction categories.
Accounts
Types:
```text
Cash
Bank Account
Credit Card
UPI
Other
```
Features:
```text
Create
Read
Update
Deactivate/archive
Ownership validation
Balance calculation
```
Account UI
```text
Accounts page
Account cards
Add account
Edit account
Deactivate/archive
```
Credit card balances must be presented clearly as liabilities/outstanding balances where applicable.
Categories
System categories:
```text
Salary
Freelancing
Business
Investments
Other

Food
Transport
Shopping
Bills
Education
Entertainment
Healthcare
Other
```
Users may create custom categories.
System categories must be protected from unauthorized modification.
Completion Criteria
```text
[ ] User can create accounts
[ ] User can edit accounts
[ ] User can deactivate accounts
[ ] User cannot access another user's account
[ ] Account balances are consistent
[ ] System categories exist
[ ] User custom categories work
[ ] Category ownership is enforced
```
---
Phase 9 — Income & Expense Transaction Core
Objective
Implement the core financial transaction system.
Transaction Fields
Each transaction may contain:
```text
Amount
Type
Category
Description
Date
Payment Method
Account
Notes
Receipt reference
```
Types:
```text
Income
Expense
```
Income Categories
```text
Salary
Freelancing
Business
Investments
Other
```
Expense Categories
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
Payment Methods
```text
Cash
UPI
Credit Card
Debit Card
Bank Transfer
```
Backend
Implement:
```text
Create
Read
Update
Delete
Ownership checks
Amount validation
Type validation
Category validation
Account validation
Date validation
Payment method validation
```
Frontend
Implement:
```text
Transaction list
Add transaction
Edit transaction
Transaction details
Delete confirmation
```
Financial Rules
Transactions must update the appropriate financial aggregates.
Example:
```text
Income → income totals
Expense → expense totals
```
Completion Criteria
```text
[ ] Income transactions work
[ ] Expense transactions work
[ ] CRUD works
[ ] Ownership is enforced
[ ] Validation works
[ ] Account association works
[ ] Category association works
[ ] Payment method works
[ ] Financial totals update correctly
```
---
Phase 10 — Transaction Search, Filters, Pagination & Receipt Uploads
Objective
Make transaction management powerful and realistic.
Search
Example:
```text
Amazon
Netflix
Salary
```
Search should cover supported transaction text fields such as description.
Filters
Implement:
```text
Date range
Category
Income/Expense
Amount range
Account
Payment method
```
Pagination
Implement:
```text
Page
Limit
Next
Previous
```
Keep filters/search state consistent through pagination.
Receipt Uploads
Technology:
```text
Multer
```
Implement:
```text
Multipart parsing
File type validation
MIME validation
File size validation
Secure naming
Storage strategy
Receipt metadata
Transaction association
Authorized retrieval
Replace/delete behavior
```
Example supported types:
```text
JPG
PNG
WEBP
PDF
```
Final limits are controlled through backend configuration.
Receipt Security
Users may only access their own receipts.
Do not expose private receipt files through unrestricted public URLs.
Completion Criteria
```text
[ ] Search works
[ ] Filters work
[ ] Pagination works
[ ] Clear filters works
[ ] Search is user-scoped
[ ] Multer is configured
[ ] File type is validated
[ ] File size is validated
[ ] Receipt metadata is stored
[ ] Receipt is associated with transaction
[ ] Unauthorized receipt access is blocked
```
---
Phase 11 — Dashboard Backend & Financial Calculation Services
Objective
Create centralized backend financial calculations and dashboard aggregation services.
Core Services
Create/reuse services such as:
```text
TransactionService
AccountService
BudgetService
AnalyticsService
InsightService
ReportService
RecurringTransactionService
SavingsGoalService
NotificationService
```
Dashboard Metrics
Calculate:
```text
Total Income
Total Expenses
Remaining Balance
Savings Rate
```
Example:
```text
Income       ₹50,000
Expenses     ₹32,500
Balance      ₹17,500
Savings Rate     35%
```
Analytics Data
Prepare:
```text
Monthly income vs expenses
Expenses by category
Spending trend
Savings trend
Payment method totals
Account spending
Recent transactions
Upcoming recurring payments
Budget status
Goal progress
Notifications
```
Calculation Rules
Financial definitions must be centralized.
Do not calculate the same metric differently in:
```text
Dashboard
Analytics
Reports
```
Completion Criteria
```text
[ ] Dashboard summary API works
[ ] Income calculation is correct
[ ] Expense calculation is correct
[ ] Balance calculation is correct
[ ] Savings rate calculation is correct
[ ] Category aggregation works
[ ] Trend aggregation works
[ ] Data is user-scoped
[ ] Date range logic is consistent
```
---
Phase 12 — Dashboard Frontend & Main Product Experience
Objective
Build the main attraction of FinTrack.
Dashboard Structure
Recommended order:
```text
Greeting / Period
Financial Summary
Income vs Expenses
Budget / Goals / Accounts
Category Analytics
Spending / Savings Trends
Insights
Recent Transactions
Upcoming Payments
```
Summary Cards
```text
Total Income
Total Expenses
Remaining Balance
Savings Rate
```
Widgets
Implement:
```text
Income vs Expenses chart
Expense category chart
Spending trend
Savings trend
Budget progress
Savings goal progress
Account summary
Recent transactions
Upcoming payments
Insight cards
```
UX Requirements
Support:
```text
Loading
Skeleton
Empty state
Partial failure
Retry
Responsive charts
Dark mode
Accessible chart summaries
```
Mobile Dashboard
Recommended order:
```text
Greeting
Summary
Balance
Income/expense chart
Budget
Goals
Insights
Recent transactions
Upcoming payments
```
Completion Criteria
```text
[ ] Dashboard is responsive
[ ] Summary cards work
[ ] Charts work
[ ] Budgets appear
[ ] Goals appear
[ ] Accounts appear
[ ] Insights appear
[ ] Recent transactions appear
[ ] Upcoming payments appear
[ ] Loading states work
[ ] Empty states work
[ ] Error states work
```
---
Phase 13 — Monthly Budgets & Budget Alerts
Objective
Implement category-based monthly budgets and threshold notifications.
Budget Fields
Support:
```text
Category
Month
Year
Limit
Alert thresholds
```
Budget UI
Example:
```text
Food

₹4,000 / ₹5,000

████████░░ 80%

₹1,000 remaining
```
States:
```text
Healthy
Warning
Critical
Exceeded
```
Budget Creation
```text
Select category
 ↓
Select month/year
 ↓
Set monthly limit
 ↓
Set thresholds
 ↓
Save
```
Prevent duplicate category/month budgets.
Budget Calculation
```text
Budget limit
 ↓
Aggregate related expenses
 ↓
Calculate spent
 ↓
Calculate percentage
 ↓
Calculate remaining
 ↓
Determine status
```
Alerts
Threshold examples:
```text
50%
75%
90%
100%+
```
When a threshold is crossed:
```text
Transaction
 ↓
Budget recalculation
 ↓
Threshold check
 ↓
Notification
```
Prevent unnecessary duplicate notifications.
Completion Criteria
```text
[ ] Budget CRUD works
[ ] Duplicate budget protection works
[ ] Usage calculation works
[ ] Progress display works
[ ] Warning state works
[ ] Critical state works
[ ] Exceeded state works
[ ] Related transaction navigation works
[ ] Notifications work
```
---
Phase 14 — Recurring Transactions, Scheduler & Savings Goals
Objective
Implement recurring financial automation and savings planning.
14.1 Recurring Transactions
Examples:
```text
Netflix
Rent
Electricity
Internet
Salary
```
Fields:
```text
Name
Amount
Type
Category
Account
Payment Method
Frequency
Start Date
Next Occurrence
End Date
Active status
```
Frequencies:
```text
Daily
Weekly
Monthly
Yearly
```
Features:
```text
Create
Edit
Pause
Resume
Delete
```
Recurring Processing
Implement a server-side scheduler/job:
```text
Find due recurring records
 ↓
Check active state
 ↓
Check occurrence idempotency
 ↓
Create transaction
 ↓
Update nextOccurrence
```
Repeated execution must not duplicate a transaction.
14.2 Savings Goals
Examples:
```text
New Laptop
Emergency Fund
Vacation
Car
Education
Phone
```
Fields:
```text
Goal Name
Target Amount
Current Amount
Target Date
Category
Description
Status
```
Features:
```text
Create
Edit
Add contribution
Pause
Complete
```
Goal contribution:
```text
Goal
 ↓
Add contribution
 ↓
Amount
 ↓
Optional account
 ↓
Date
 ↓
Note
 ↓
Update current amount
 ↓
Recalculate progress
```
Completion:
```text
currentAmount >= targetAmount
 ↓
Status = COMPLETED
```
Completion Criteria
```text
[ ] Recurring CRUD works
[ ] Scheduler works
[ ] Idempotency works
[ ] Pause/resume works
[ ] Next occurrence is correct
[ ] Savings goals work
[ ] Contributions work
[ ] Goal progress is correct
[ ] Goal completion works
```
---
Phase 15 — Notifications, Analytics & Deterministic Financial Insights
Objective
Build the intelligence layer without using AI.
15.1 Notifications
Types:
```text
Budget alert
Budget exceeded
Recurring payment
Savings goal milestone
Financial insight
System
```
Implement:
```text
Notification model
Create notification
Unread count
Mark as read
Mark all as read
Delete
Notification preferences
```
Header:
```text
🔔 unread count
```
Notification Flow
```text
Event
 ↓
Check notification preference
 ↓
Create notification if enabled
 ↓
Display in notification center
```
15.2 Analytics
Implement:
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
Filters:
```text
Date range
Account
Category
Transaction type
Payment method
```
Charts:
```text
Income vs Expenses
Expense Categories
Spending Trend
Savings Trend
Payment Methods
Account Spending
```
15.3 Deterministic Financial Insights
No external AI service is allowed.
Do not integrate:
```text
OpenAI
Gemini
Claude
Other AI APIs
AI API keys
AI chatbot
```
Instead:
```text
MongoDB data
 ↓
Aggregation
 ↓
Analytics service
 ↓
Deterministic rules
 ↓
Insight
```
Example:
```text
currentFoodSpend > previousFoodSpend * 1.18
```
Then:
```text
Your food expenses increased by 18%
compared with last month.
```
Other rules:
```text
Category represents a high percentage of spending
Budget reaches threshold
Budget exceeded
Savings increased
Savings decreased
Goal is near completion
Spending increased significantly
```
Insights must be:
```text
Deterministic
Explainable
Repeatable
Testable
User-scoped
```
Completion Criteria
```text
[ ] Notifications work
[ ] Unread count works
[ ] Read/unread works
[ ] Analytics filters work
[ ] Charts use correct data
[ ] Insight rules work
[ ] No AI API exists
[ ] Insight tests exist
```
---
Phase 16 — Calendar, Reports & Data Export
Objective
Provide financial planning visibility and export capabilities.
16.1 Financial Calendar
Display:
```text
Recurring payments
Goal deadlines
Budget periods
Other supported financial events
```
Flow:
```text
Calendar
 ↓
Select month
 ↓
Load events
 ↓
Display
 ↓
Select event
 ↓
Open related resource
```
16.2 PDF Reports
Monthly report example:
```text
August 2026 Financial Report

Income       ₹50,000
Expenses     ₹32,500
Savings      ₹17,500
Savings Rate     35%

Top Category
Food         ₹7,200

Top Payment Method
UPI          ₹12,400
```
16.3 CSV Export
Export relevant transaction/report data.
16.4 User Data Export
May include:
```text
Transactions
Accounts
Budgets
Categories
Recurring transactions
Savings goals
```
Must not include:
```text
passwordHash
JWT
reset tokens
secrets
```
Report Consistency
Report numbers must use the same backend calculation definitions as:
```text
Dashboard
Analytics
```
Completion Criteria
```text
[ ] Calendar works
[ ] Events are correct
[ ] PDF generation works
[ ] CSV generation works
[ ] Data export works
[ ] Sensitive fields are excluded
[ ] Report values match dashboard/analytics
```
---
Phase 17 — Admin Dashboard, User Management, Categories & Audit Logs
Objective
Complete the administration platform.
Admin Dashboard
Metrics:
```text
Total Users
Active Users
Transaction Volume
Financial Activity
```
Admin Navigation
```text
Admin Dashboard
Users
Categories
Audit Logs
System Settings
```
User Management
Features:
```text
Search users
View safe user information
Activate
Deactivate
Change role
```
Sensitive credentials must never be exposed.
Role Change
```text
Admin
 ↓
User details
 ↓
Change role
 ↓
Confirm
 ↓
Backend authorization
 ↓
Update role
 ↓
Audit log
```
Category Management
Admins may manage system categories according to approved product rules.
Historical transaction integrity must be preserved.
Avoid destructive hard deletes of categories referenced by historical transactions.
Audit Logs
Record:
```text
Actor
Action
Target
Timestamp
Safe metadata
```
Never record:
```text
Passwords
JWTs
Reset tokens
Secrets
```
Audit logs are read-only through the normal admin UI.
System Settings
Only expose explicitly approved settings.
Changes must:
```text
Validate
Persist
Audit
```
Completion Criteria
```text
[ ] Admin dashboard works
[ ] User search works
[ ] User activation/deactivation works
[ ] Role changes work
[ ] Category administration works
[ ] Audit logs work
[ ] Sensitive fields are protected
[ ] Unauthorized users cannot access admin
```
---
Phase 18 — UI Polish, Accessibility, Responsive QA & Performance
Objective
Bring the entire application to portfolio-level and production-quality UX.
Visual Review
Review:
```text
Typography
Spacing
Colors
Borders
Shadows
Buttons
Cards
Forms
Tables
Charts
Navigation
Dialogs
Toasts
```
Remove:
```text
Placeholder content
Debug UI
Inconsistent styling
Duplicate components
Unused styles
Temporary text
```
Responsive QA
Test:
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
Dashboard
Transactions
Forms
Tables
Charts
Dialogs
Navigation
Admin
Settings
```
Accessibility
Verify:
```text
Keyboard navigation
Focus visibility
Screen-reader labels
Semantic HTML
Form labels
Dialog focus management
Table semantics
Chart text summaries
Color contrast
Reduced motion
```
Motion
Use subtle transitions for:
```text
Dialogs
Drawers
Toasts
Progress
Charts
Page transitions
```
Respect:
```text
prefers-reduced-motion
```
Avoid:
```text
Excessive animation
Glows
Parallax
3D effects
Decorative motion
```
Performance
Review:
```text
Database queries
Indexes
Aggregation performance
API payload sizes
Frontend bundle
Image sizes
Chart rendering
Pagination
Search debounce
Lazy loading
```
Optimize measured bottlenecks.
Completion Criteria
```text
[ ] UI is visually consistent
[ ] Responsive behavior is correct
[ ] Accessibility checks pass
[ ] Reduced motion works
[ ] No obvious performance bottlenecks
[ ] No placeholder/debug UI remains
```
---
Phase 19 — Security Hardening, Testing & Production Readiness
Objective
Perform full security, data integrity, functional, integration, and end-to-end validation.
19.1 Security
Verify:
```text
JWT security
HTTP-only cookies
Secure cookie settings
CORS
CSRF strategy
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
API responses
Logs
Error messages
```
19.2 Backend Testing
Unit tests:
```text
Validation
Business logic
Budget calculations
Savings calculations
Insight rules
Date calculations
```
Integration tests:
```text
Authentication
Transactions
Accounts
Budgets
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
19.3 Frontend Testing
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
19.4 End-to-End Testing
Critical flows:
Authentication
```text
Register
 ↓
Login
 ↓
Dashboard
 ↓
Logout
```
Transaction
```text
Login
 ↓
Add expense
 ↓
Dashboard updates
```
Budget
```text
Create budget
 ↓
Add expense
 ↓
Budget usage changes
 ↓
Alert when threshold is reached
```
Recurring
```text
Create recurring
 ↓
Process occurrence
 ↓
Transaction created once
```
Goal
```text
Create goal
 ↓
Add contribution
 ↓
Progress updates
```
Receipt
```text
Create transaction
 ↓
Upload receipt
 ↓
View receipt
```
Admin
```text
Admin login
 ↓
User management
 ↓
Administrative action
 ↓
Audit log
```
19.5 Financial Integrity Testing
Verify:
```text
Income increases income totals
Expense increases expense totals
Deleting expense decreases expense totals
Budget usage changes correctly
Account balance changes correctly
Savings rate changes correctly
Analytics reflect transaction changes
Reports reflect transaction changes
```
19.6 Recurring Integrity Testing
Verify:
```text
Due transaction creates exactly one transaction
Repeated job execution does not duplicate
Paused item does not process
Expired item stops
Next occurrence is correct
```
19.7 File Security Testing
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
19.8 Database Review
Inspect through MongoDB Compass:
```text
Collections
Indexes
Relationships
Constraints
Seed data
Sample records
```
Completion Criteria
```text
[ ] Critical tests pass
[ ] Security tests pass
[ ] Ownership tests pass
[ ] RBAC tests pass
[ ] Financial integrity tests pass
[ ] Upload security tests pass
[ ] E2E flows pass
[ ] No critical/high security defects remain
```
---
Phase 20 — Production Deployment, Smoke Test, Documentation & Release
Objective
Deploy FinTrack safely and verify the production system.
Production Configuration
Set production environment variables:
```text
NODE_ENV=production
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=...
```
Configure:
```text
HTTPS
Secure cookies
CORS
Production MongoDB
Upload storage
Email/reset-password service
Logging
Error monitoring
```
Build
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
API URL
Static assets
Uploads
Database connectivity
```
Deployment
Deploy:
```text
Frontend
Backend
Database
File storage
```
according to the selected hosting infrastructure.
Production Smoke Test
Immediately after deployment:
```text
[ ] Health endpoint
[ ] Registration
[ ] Login
[ ] Logout
[ ] Dashboard
[ ] Add transaction
[ ] Edit transaction
[ ] Delete transaction
[ ] Search/filter
[ ] Budget
[ ] Goal
[ ] Recurring transaction
[ ] Receipt upload
[ ] Notifications
[ ] Analytics
[ ] PDF report
[ ] CSV export
[ ] User settings
[ ] Admin login
[ ] Admin user management
[ ] Audit logs
```
Documentation
Finalize:
```text
README.md
Environment setup
Local development setup
MongoDB setup
MongoDB Compass instructions
Seed instructions
API documentation
Deployment instructions
```
Ensure all source-of-truth documents are synchronized:
```text
PRD.md
TRD.md
ARCHITECTURE.md
DATABASESCHEMA.md
UI/UX.md
WEBFLOW.md
IMPLEMENTATION.md
```
Post-Release Verification
Monitor:
```text
API errors
Authentication failures
Database errors
Upload failures
Slow requests
Recurring job failures
Report generation failures
```
Completion Criteria
```text
[ ] Production environment configured
[ ] Database ready
[ ] Indexes verified
[ ] Admin seeded
[ ] Frontend deployed
[ ] Backend deployed
[ ] HTTPS enabled
[ ] Secure cookies enabled
[ ] Uploads work
[ ] Reports work
[ ] Authentication works
[ ] Admin works
[ ] Smoke test passes
[ ] Documentation is complete
[ ] No critical release blockers remain
```
---
6. Phase Dependency Map
The 20 phases are intentionally ordered around technical dependencies.
```text
Phase 1
Project Foundation
    ↓
Phase 2
Backend + MongoDB
    ↓
Phase 3
Database + Seed
    ↓
Phase 4
Authentication
    ↓
Phase 5
Password Recovery + RBAC
    ↓
Phase 6
Frontend Foundation
    ↓
Phase 7
Frontend Auth + Settings
    ↓
Phase 8
Accounts + Categories
    ↓
Phase 9
Transactions
    ↓
Phase 10
Search + Filters + Receipts
    ↓
Phase 11
Financial Services + Dashboard Backend
    ↓
Phase 12
Dashboard Frontend
    ↓
Phase 13
Budgets + Alerts
    ↓
Phase 14
Recurring + Goals
    ↓
Phase 15
Notifications + Analytics + Insights
    ↓
Phase 16
Calendar + Reports + Export
    ↓
Phase 17
Admin Platform
    ↓
Phase 18
UI/UX + Accessibility + Performance
    ↓
Phase 19
Security + Testing
    ↓
Phase 20
Production Release
```
Some work can happen in parallel inside a phase, but dependencies must not be violated.
---
7. Recommended Milestones
Milestone 1 — Technical Foundation
```text
Phase 1
Phase 2
Phase 3
```
Result:
```text
Working full-stack foundation
+
MongoDB
+
Seed system
```
---
Milestone 2 — Secure Application Access
```text
Phase 4
Phase 5
Phase 6
Phase 7
```
Result:
```text
Authentication
+
RBAC
+
Responsive application shell
+
User settings
```
---
Milestone 3 — Financial Core
```text
Phase 8
Phase 9
Phase 10
```
Result:
```text
Accounts
Categories
Transactions
Search
Filters
Receipts
```
---
Milestone 4 — Main Financial Experience
```text
Phase 11
Phase 12
Phase 13
```
Result:
```text
Dashboard
+
Financial calculations
+
Monthly budgets
+
Budget alerts
```
---
Milestone 5 — Planning & Tracking
```text
Phase 14
Phase 15
```
Result:
```text
Recurring transactions
Savings goals
Notifications
Analytics
Deterministic insights
```
---
Milestone 6 — Reporting & Administration
```text
Phase 16
Phase 17
```
Result:
```text
Calendar
Reports
Exports
Admin platform
Audit logs
```
---
Milestone 7 — Production Quality
```text
Phase 18
Phase 19
Phase 20
```
Result:
```text
Polished
Accessible
Secure
Tested
Production-ready
```
---
8. Definition of Done
A phase is complete only when the relevant work satisfies:
```text
Feature implemented
+
Validation implemented
+
Authorization implemented
+
Ownership checks implemented
+
Error handling implemented
+
Loading/empty/error states implemented
+
Responsive UI implemented
+
Tests implemented
+
TypeScript passes
+
Lint passes
+
Documentation remains consistent
```
---
9. Financial Feature Definition of Done
Every financial feature must verify:
```text
Correct amount
Correct ownership
Correct date
Correct category
Correct account
Correct transaction type
Correct calculation
Correct dashboard impact
Correct analytics impact
Correct report impact
```
---
10. Authentication Definition of Done
Authentication is complete only when:
```text
Registration
Login
Logout
Session restoration
Protected routes
Password hashing
Forgot password
Reset password
RBAC
```
have been implemented and tested.
---
11. Authorization Definition of Done
Every protected backend endpoint must determine:
```text
Who is the user?
 ↓
Is the user authenticated?
 ↓
Does the user have the required role?
 ↓
Does the requested resource belong to the user?
 ↓
Is the requested action allowed?
```
Frontend route guards are not a substitute for backend authorization.
---
12. Upload Definition of Done
Receipt upload is complete only when:
```text
Multer configured
File type validated
MIME validated
File size validated
File safely stored
Metadata stored
Ownership enforced
Authorized retrieval implemented
Replace/delete behavior defined
```
---
13. Reporting Definition of Done
Reports are complete only when:
```text
Dashboard values
Analytics values
Report values
```
are generated from consistent backend financial definitions.
---
14. Admin Definition of Done
Admin functionality is complete only when:
```text
Admin seeded
RBAC enforced
User management works
Category management works
Audit logs work
Sensitive fields protected
Unauthorized users blocked
```
---
15. Testing Gate
Before moving from one major milestone to another:
```text
[ ] TypeScript passes
[ ] Lint passes
[ ] Unit tests pass
[ ] Integration tests pass
[ ] Critical E2E flows pass
[ ] No critical security issue remains
```
---
16. Git Commit Strategy
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
Avoid:
```text
update
changes
final
done
test
```
---
17. Branching Strategy
Recommended:
```text
main
develop
feature/*
fix/*
```
Examples:
```text
feature/authentication
feature/transactions
feature/budgets
feature/analytics
feature/admin
```
Pull requests should be reviewed before merging in team development.
---
18. Code Review Checklist
Review every important change for:
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
19. API Development Standard
Every API feature should follow:
```text
Route
 ↓
Authentication middleware
 ↓
Role middleware if required
 ↓
Validation
 ↓
Controller
 ↓
Service
 ↓
Database/model
 ↓
Safe response
```
Do not place complex business logic directly inside route definitions.
---
20. Frontend Feature Standard
Each major frontend feature should have:
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
Responsive behavior
```
---
21. Shared Financial Utility Standard
Centralize:
```text
Currency formatting
Percentage formatting
Date formatting
Date range calculations
Financial period calculations
Savings rate
Budget percentage
Goal percentage
Trend comparison
```
Avoid duplicate formulas across components.
---
22. Mutation Refresh Strategy
After a financial mutation, refresh/invalidate only affected data.
Example:
```text
Create Expense
 ↓
Transactions
Dashboard
Budgets
Analytics
Accounts
Notifications
```
Do not unnecessarily reload the entire application.
---
23. Security Test Matrix
At minimum test:
```text
User A cannot read User B transaction
User A cannot edit User B transaction
User A cannot delete User B transaction
User cannot access admin routes
User cannot modify protected system category
User cannot access another user's receipt
User cannot change role without authorization
Expired JWT is rejected
Invalid reset token is rejected
Used reset token is rejected
```
---
24. Financial Integrity Test Matrix
Test:
```text
Income added
Income edited
Income deleted

Expense added
Expense edited
Expense deleted

Budget created
Budget crossed
Budget exceeded

Goal created
Goal contribution
Goal completion

Recurring occurrence
Recurring duplicate prevention

Dashboard aggregation
Analytics aggregation
Report aggregation
```
---
25. Responsive QA Matrix
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
Dashboard
Transaction table/list
Forms
Charts
Dialogs
Cards
Reports
Settings
Admin
```
---
26. Accessibility QA Matrix
Check:
```text
Keyboard navigation
Focus visibility
Screen reader labels
Semantic HTML
Form labels
Dialog focus
Table semantics
Chart summaries
Color contrast
Reduced motion
Touch target sizes
```
---
27. Browser QA
Test supported modern browsers according to deployment target.
At minimum:
```text
Chrome
Edge
Firefox
Safari where applicable
```
---
28. No-AI Implementation Rule
The following are explicitly prohibited:
```text
AI API integrations
AI API keys
AI chatbot
AI financial advisor
AI-generated financial recommendations
LLM-based expense classification
External AI-generated insights
```
All intelligence must use:
```text
MongoDB data
+
Backend aggregation
+
Deterministic business rules
```
---
29. Example Deterministic Insight Logic
Concept:
```text
currentExpense = calculateCurrentPeriodExpense()
previousExpense = calculatePreviousPeriodExpense()

if previousExpense > 0:
    change = ((currentExpense - previousExpense) / previousExpense) * 100

    if change >= configuredThreshold:
        createInsight(...)
```
Example output:
```text
Your expenses increased by 18%
compared with last month.
```
The rule must be:
```text
Deterministic
Repeatable
Explainable
Testable
```
---
30. MongoDB Compass Development Workflow
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
Inspect collections
```
Inspect:
```text
users
categories
accounts
transactions
budgets
recurringtransactions
savingsgoals
notifications
passwordresettokens
auditlogs
```
MongoDB Compass is for database inspection/development management.
The application accesses MongoDB through Mongoose.
---
31. Seed Workflow
Recommended command:
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
Seed must be safe to run repeatedly.
---
32. Local Development Workflow
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
Running

MongoDB Compass
 ↓
Optional inspection
```
---
33. Production Build Workflow
```text
Install dependencies
 ↓
Load production environment
 ↓
Build frontend
 ↓
Build backend
 ↓
Verify database
 ↓
Run seed/setup if required
 ↓
Start backend
 ↓
Deploy frontend
 ↓
Smoke test
```
---
34. Production Release Checklist
Foundation
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
Authentication
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
RBAC
```text
[ ] USER role
[ ] ADMIN role
[ ] Admin seed
[ ] Role middleware
[ ] Admin routes
[ ] Audit logs
```
Financial Core
```text
[ ] Accounts
[ ] Categories
[ ] Transactions
[ ] Search
[ ] Filters
[ ] Receipt uploads
```
Planning
```text
[ ] Budgets
[ ] Budget alerts
[ ] Recurring transactions
[ ] Recurring scheduler
[ ] Savings goals
```
Analytics
```text
[ ] Dashboard
[ ] Income analytics
[ ] Expense analytics
[ ] Category analytics
[ ] Spending trend
[ ] Savings trend
[ ] Deterministic insights
```
Productivity
```text
[ ] Calendar
[ ] Notifications
[ ] PDF
[ ] CSV
[ ] Data export
```
UX
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
Security
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
35. Phase Completion Tracker
Phase	Status
1. Project Initialization & Development Foundation	Pending
2. Backend Architecture, API Foundation & MongoDB	Pending
3. Database Models, Indexes & Seed System	Pending
4. Authentication, Password Security & Session Management	Pending
5. Forgot/Reset Password & RBAC	Pending

6. Frontend Foundation, Design System & Application Shell	Pending
7. Authentication Frontend, Protected Routes & Settings	Pending
8. Accounts, Wallets & Categories	Pending
9. Income & Expense Transaction Core	Pending
10. Transaction Search, Filters, Pagination & Receipts	Pending
11. Dashboard Backend & Financial Calculation Services	Pending
12. Dashboard Frontend & Main Product Experience	Pending
13. Monthly Budgets & Budget Alerts	Pending
14. Recurring Transactions, Scheduler & Savings Goals	Pending
15. Notifications, Analytics & Deterministic Insights	Pending
16. Calendar, Reports & Data Export	Pending
17. Admin Dashboard, User Management & Audit Logs	Pending
18. UI Polish, Accessibility, Responsive QA & Performance	Pending
19. Security Hardening, Testing & Production Readiness	Pending
20. Production Deployment, Smoke Test & Release	Pending
---
36. Final Scope Lock
The 20-phase implementation plan contains the complete approved FinTrack v1 scope.
The implementation must include:
```text
User Authentication
Register
Login
Logout
JWT authentication
HTTP-only cookie
bcrypt password hashing
Forgot password
Reset password
Protected dashboard

Role-Based Access Control
USER role
ADMIN role
Default seeded admin
Admin authorization
Audit logs

Income & Expense Management
Income
Expense
Categories
Descriptions
Dates
Payment methods
Notes
Accounts

Accounts / Wallets
Cash
Bank Account
Credit Card
UPI
Other

Transaction Search & Filters
Date
Category
Income/Expense
Amount
Account
Payment method
Text search

Receipt Upload
Multer
File validation
Secure storage/access
Transaction association

Dashboard
Total income
Total expenses
Remaining balance
Savings rate
Monthly income vs expenses
Expense categories
Spending trend
Savings trend

Monthly Budgets
Category budgets
Progress
Thresholds
Warnings
Exceeded state

Recurring Transactions
Daily
Weekly
Monthly
Yearly
Scheduler
Idempotency
Pause/resume

Savings Goals
Target
Current saved
Progress
Contribution
Deadline
Completion

Expense Analytics
Category analysis
Payment methods
Accounts
Trends
Date ranges

Deterministic Financial Insights
Expense comparisons
Category concentration
Savings comparisons
Budget events
Goal proximity

Calendar
Recurring events
Goal deadlines
Budget periods

Notifications
Budget alerts
Recurring payments
Goal milestones
Insights
System notifications

Reports
PDF
CSV
Monthly reports
Data export

UI/UX
Responsive
Mobile
Tablet
Desktop
Dark mode
System theme
Accessible
Subtle transitions
Professional fintech design

Admin
Dashboard
Users
Categories
System settings
Audit logs

Testing
Unit
Integration
Security
Frontend
E2E
Responsive
Accessibility

Deployment
Production configuration
Build
Smoke test
Release
Post-release verification
```
---
37. Explicitly Excluded Scope
The following must not be added unless the source-of-truth documents are intentionally changed and re-locked:
```text
AI API integration
AI API keys
AI chatbot
AI financial advisor
LLM-based transaction categorization
AI-generated financial recommendations
External AI analytics
Cryptocurrency portfolio tracking
Stock trading
Bank account direct synchronization
Open banking integrations
Payment gateway integration
Social networking
Public financial profiles
```
The application may be extended later, but such changes must update the relevant source-of-truth documents first.
---
38. Final Source-of-Truth Relationship
The project documentation hierarchy is:
```text
PRD.md
    ↓
Product requirements

TRD.md
    ↓
Technical requirements

ARCHITECTURE.md
    ↓
System architecture

DATABASESCHEMA.md
    ↓
Database structure

UI/UX.md
    ↓
Visual and interaction design

WEBFLOW.md
    ↓
Navigation and user/admin flows

IMPLEMENTATION.md
    ↓
Execution roadmap
```
All seven documents must remain consistent.
If implementation requires a change in product scope, architecture, database structure, UI/UX, or flow, update the relevant source-of-truth document before considering the new behavior part of the locked product.
---
39. Final Implementation Rule
FinTrack must be developed in the following strategic order:
```text
Foundation
    ↓
Backend + Database
    ↓
Authentication + Security
    ↓
Frontend Shell
    ↓
Financial Core
    ↓
Dashboard
    ↓
Budgets
    ↓
Recurring + Goals
    ↓
Analytics + Deterministic Insights
    ↓
Reports + Calendar
    ↓
Admin
    ↓
Polish + Accessibility
    ↓
Testing + Security Hardening
    ↓
Production Release
```
This sequence minimizes rework and ensures that each major feature is built on the correct foundation.
---
40. Final Statement
`IMPLEMENTATION.md` defines the complete 20-phase implementation roadmap for FinTrack v1.
The previous detailed 49-phase roadmap has been consolidated into these 20 phases without removing the approved functionality.
Each phase groups logically related work while preserving:
```text
Security
Authentication
RBAC
Financial integrity
Database integrity
Responsive UI
Accessibility
Testing
Production readiness
```
The project must remain:
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
`IMPLEMENTATION.md` is the implementation roadmap and execution source of truth for FinTrack v1.