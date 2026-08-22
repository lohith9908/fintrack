# FinTrack — Web Flow Specification

**Document:** `WEBFLOW.md`  
**Version:** 1.0  
**Status:** Locked / Source of Truth  
**Product:** FinTrack — Personal Finance Management Platform  
**Related Documents:** `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASESCHEMA.md`, `UI/UX.md`  
**Date:** 22 August 2026

---

# 1. Document Purpose

This document defines the complete navigation and interaction flow for FinTrack.

It describes:

- Public flows
- Authentication flows
- User onboarding
- Dashboard flow
- Transaction flows
- Budget flows
- Account flows
- Recurring transaction flows
- Savings goal flows
- Analytics flows
- Calendar flows
- Notification flows
- Report/export flows
- Receipt upload flows
- Profile/settings flows
- Admin/RBAC flows
- Error and recovery flows
- Mobile navigation
- Permission boundaries

This document is the navigation and user-flow source of truth.

---

# 2. Flow Principles

Every flow should follow these principles:

1. Keep the user's goal obvious.
2. Minimize unnecessary steps.
3. Validate early.
4. Never trust client authorization.
5. Confirm destructive actions.
6. Preserve user input where safe.
7. Provide clear success/error feedback.
8. Keep financial calculations backend-authoritative.
9. Never expose another user's data.
10. Keep mobile flows usable.
11. Avoid unnecessary navigation.
12. Avoid AI-powered interactions.

---

# 3. Application Entry Flow

```text
User opens FinTrack
        ↓
Application loads
        ↓
Check authentication session
        │
        ├── Authenticated
        │       ↓
        │    Dashboard
        │
        └── Unauthenticated
                ↓
             Landing/Login
```

---

# 4. Public Navigation

Unauthenticated users may access:

```text
Landing/Login
Register
Forgot Password
Reset Password
```

Protected application routes must redirect unauthenticated users to login.

---

# 5. Authentication Flow

## 5.1 Registration

```text
Register Page
      ↓
Enter Name
Enter Email
Enter Password
Confirm Password
      ↓
Client Validation
      ↓
Submit
      ↓
POST /api/auth/register
      ↓
Server Validation
      ↓
Check Email
      ↓
Hash Password with bcrypt
      ↓
Create User
      ↓
Create Authentication Session
      ↓
Success
      ↓
Dashboard / Onboarding
```

---

# 6. Registration Error Flow

```text
Register
   ↓
Validation
   │
   ├── Invalid input
   │       ↓
   │    Field errors
   │
   ├── Email already exists
   │       ↓
   │    Safe conflict message
   │
   └── Server error
           ↓
       Generic retry message
```

Do not expose internal database errors.

---

# 7. Login Flow

```text
Login Page
    ↓
Email + Password
    ↓
Client Validation
    ↓
POST /api/auth/login
    ↓
Find User
    ↓
bcrypt.compare()
    ↓
Credentials valid?
    │
    ├── No → Safe login error
    │
    └── Yes
         ↓
      Generate JWT
         ↓
      HTTP-only cookie
         ↓
      Update lastLoginAt
         ↓
      Dashboard
```

---

# 8. Login Security Flow

The UI must not reveal:

```text
Email does not exist
```

versus:

```text
Password incorrect
```

Use a safe message:

```text
Invalid email or password.
```

---

# 9. Logout Flow

```text
User Menu
    ↓
Logout
    ↓
POST /api/auth/logout
    ↓
Clear/invalidate authentication
    ↓
Clear client session state
    ↓
Redirect → Login
```

---

# 10. Session Restoration Flow

When the application opens:

```text
App Start
    ↓
Loading Session
    ↓
GET /api/auth/me
    ↓
Valid session?
   │
   ├── Yes → Store safe user state → App
   │
   └── No → Public/auth state
```

Avoid displaying protected content before the session check completes.

---

# 11. Forgot Password Flow

```text
Login
 ↓
Forgot Password
 ↓
Enter Email
 ↓
Submit
 ↓
POST /api/auth/forgot-password
 ↓
Generate secure reset token
 ↓
Store token hash + expiration
 ↓
Send reset email
 ↓
Generic success response
```

The response should not reveal whether the email exists.

---

# 12. Reset Password Flow

```text
Email Link
    ↓
Reset Password Page
    ↓
Validate token
    ↓
Enter new password
    ↓
Confirm password
    ↓
Submit
    ↓
Server validates token
    ↓
Hash new password with bcrypt
    ↓
Update user password
    ↓
Mark reset token used
    ↓
Invalidate appropriate existing sessions if implemented
    ↓
Success
    ↓
Login
```

---

# 13. Expired Reset Token Flow

```text
Reset Link
    ↓
Token invalid/expired/used
    ↓
Show safe error
    ↓
Request new reset link
```

---

# 14. Onboarding Flow

After registration:

```text
Account Created
      ↓
Onboarding
      ↓
Step 1: Profile
      ↓
Step 2: Financial Preferences
      ↓
Step 3: Accounts
      ↓
Step 4: First Budget
      ↓
Step 5: Savings Goal
      ↓
Dashboard
```

Optional steps may be skipped.

---

# 15. Onboarding Step 1

```text
Welcome
 ↓
Confirm Name
 ↓
Continue
```

---

# 16. Onboarding Step 2

```text
Currency
Timezone
Date Format
Theme
Notification Preferences
 ↓
Continue
```

Default currency:

```text
INR
```

---

# 17. Onboarding Step 3

```text
Add Account
 ↓
Account Name
Account Type
Opening Balance
 ↓
Save
 ↓
Continue
```

User may skip account creation if product flow allows.

---

# 18. Onboarding Step 4

```text
Create Budget
 ↓
Category
Monthly Limit
 ↓
Save
 ↓
Continue
```

Optional.

---

# 19. Onboarding Step 5

```text
Create Savings Goal
 ↓
Goal Name
Target Amount
Target Date
 ↓
Save
 ↓
Dashboard
```

Optional.

---

# 20. Main Application Navigation

After authentication:

```text
Dashboard
Transactions
Accounts
Budgets
Recurring
Savings Goals
Calendar
Analytics
Reports
Notifications
Settings
```

Admin users additionally have:

```text
Admin
```

---

# 21. Dashboard Flow

```text
Dashboard
    ↓
Load summary
    ↓
Load analytics
    ↓
Load recent transactions
    ↓
Load budgets
    ↓
Load goals
    ↓
Load upcoming payments
    ↓
Load notifications/insights
    ↓
Render dashboard
```

---

# 22. Dashboard Primary Actions

Users should be able to quickly:

```text
+ Add Transaction
+ Create Budget
+ Add Account
+ Create Goal
```

The most important action is:

```text
Add Transaction
```

---

# 23. Dashboard Transaction Shortcut

```text
Dashboard
 ↓
+ Add Transaction
 ↓
Transaction Form
 ↓
Save
 ↓
Transaction created
 ↓
Dashboard financial values refresh
```

Affected information:

```text
Income
Expenses
Balance
Savings
Budget usage
Charts
Recent transactions
```

---

# 24. Transaction Navigation

```text
Transactions
    │
    ├── View all
    ├── Search
    ├── Filter
    ├── Sort
    ├── Add
    ├── View
    ├── Edit
    └── Delete
```

---

# 25. Add Transaction Flow

```text
Transactions
    ↓
Add Transaction
    ↓
Select Type
    ↓
Amount
    ↓
Category
    ↓
Description
    ↓
Date
    ↓
Payment Method
    ↓
Account
    ↓
Notes
    ↓
Receipt (optional)
    ↓
Submit
```

---

# 26. Transaction Type Flow

```text
Select Type
   │
   ├── Income
   │     ↓
   │   Show income categories
   │
   └── Expense
         ↓
       Show expense categories
```

Backend validates the final category/type combination.

---

# 27. Transaction Receipt Flow

```text
Transaction Form
      ↓
Upload Receipt
      ↓
Multer processing
      ↓
File validation
      │
      ├── Invalid → Error
      │
      └── Valid
           ↓
       Store file
           ↓
       Store metadata/reference
           ↓
       Continue transaction
```

The UI must not show success until the server confirms the upload.

---

# 28. Transaction Search Flow

```text
Transactions
 ↓
Search
 ↓
Enter "Amazon"
 ↓
Debounce request where appropriate
 ↓
GET /api/transactions?search=Amazon
 ↓
Backend ownership filter
 ↓
Search query
 ↓
Results
```

---

# 29. Transaction Filter Flow

```text
Transactions
 ↓
Filters
 ↓
Select:
Date
Category
Type
Amount
Account
Payment Method
 ↓
Apply
 ↓
Backend query
 ↓
Filtered results
```

---

# 30. Clear Filters Flow

```text
Filtered Results
 ↓
Clear Filters
 ↓
Reset local filter state
 ↓
Reload default transaction list
```

---

# 31. Transaction Detail Flow

```text
Transactions
 ↓
Click transaction
 ↓
Transaction Details
 ↓
View receipt/details
 ↓
Edit or Delete
```

---

# 32. Edit Transaction Flow

```text
Transaction Details
 ↓
Edit
 ↓
Pre-filled form
 ↓
Modify
 ↓
Validate
 ↓
Save
 ↓
Success
 ↓
Refresh affected data
 ↓
Transaction Details
```

---

# 33. Delete Transaction Flow

```text
Transaction Details
 ↓
Delete
 ↓
Confirmation Dialog
 ↓
Confirm
 ↓
DELETE API
 ↓
Success
 ↓
Refresh:
Transactions
Budget
Analytics
Dashboard
Account balance
 ↓
Return to transaction list
```

---

# 34. Transaction Delete Cancellation

```text
Delete
 ↓
Cancel
 ↓
Close confirmation
 ↓
Return to transaction
```

No data changes.

---

# 35. Accounts Flow

```text
Accounts
   │
   ├── View accounts
   ├── Add account
   ├── Edit account
   ├── Deactivate
   └── Archive
```

---

# 36. Add Account Flow

```text
Accounts
 ↓
Add Account
 ↓
Name
 ↓
Type
 ↓
Opening Balance
 ↓
Currency
 ↓
Notes
 ↓
Save
 ↓
Success
 ↓
Accounts list
```

---

# 37. Account Edit Flow

```text
Accounts
 ↓
Select account
 ↓
Edit
 ↓
Modify
 ↓
Save
 ↓
Refresh account
```

---

# 38. Account Deactivation Flow

```text
Account
 ↓
Deactivate
 ↓
Confirmation
 ↓
Confirm
 ↓
Account becomes inactive
 ↓
Historical transactions remain
 ↓
New transactions cannot use it where prohibited
```

---

# 39. Budget Navigation

```text
Budgets
    │
    ├── Current month
    ├── Previous month
    ├── Next month
    ├── Create
    ├── Edit
    └── View related transactions
```

---

# 40. Create Budget Flow

```text
Budgets
 ↓
Create Budget
 ↓
Select Category
 ↓
Select Month/Year
 ↓
Set Limit
 ↓
Set Alert Thresholds
 ↓
Save
 ↓
Budget status calculated
 ↓
Budget list
```

---

# 41. Budget Duplicate Flow

```text
Create Budget
 ↓
Existing budget found
 ↓
Backend conflict
 ↓
Show:
"A budget already exists for this category and month."
 ↓
Return to form
```

---

# 42. Budget Usage Flow

```text
Open Budget
 ↓
Load budget
 ↓
Aggregate expenses
 ↓
Calculate usage
 ↓
Display:
Spent
Limit
Percentage
Remaining
Status
```

---

# 43. Budget Warning Flow

```text
Expense Added
 ↓
Budget usage recalculated
 ↓
Threshold crossed?
   │
   ├── No → Normal state
   │
   └── Yes
        ↓
      Notification
        ↓
      Budget page/dashboard update
```

---

# 44. Budget Exceeded Flow

```text
Budget usage > 100%
 ↓
Status = Exceeded
 ↓
Create/show notification
 ↓
Show:
"Your Food budget has been exceeded."
 ↓
View related transactions
```

---

# 45. Recurring Transaction Flow

```text
Recurring
   │
   ├── List
   ├── Add
   ├── Edit
   ├── Pause
   ├── Resume
   └── Delete
```

---

# 46. Create Recurring Transaction

```text
Recurring
 ↓
Add Recurring
 ↓
Name
Amount
Type
Category
Account
Payment Method
Frequency
Start Date
Next Occurrence
Optional End Date
 ↓
Save
 ↓
Recurring item created
```

---

# 47. Recurring Processing Flow

```text
Scheduler/Job
 ↓
Find active recurring records due
 ↓
For each occurrence
 ↓
Check idempotency
 ↓
Create transaction
 ↓
Update nextOccurrence
 ↓
Record processing state
```

The system must not create duplicate transactions for the same occurrence.

---

# 48. Pause Recurring Flow

```text
Recurring Item
 ↓
Pause
 ↓
Confirm if required
 ↓
isActive = false
 ↓
No future automatic processing
```

---

# 49. Resume Recurring Flow

```text
Paused Item
 ↓
Resume
 ↓
Validate schedule
 ↓
isActive = true
 ↓
Continue from next occurrence
```

---

# 50. Savings Goals Flow

```text
Savings Goals
   │
   ├── View goals
   ├── Create
   ├── Edit
   ├── Add contribution
   ├── Pause
   └── Complete
```

---

# 51. Create Goal Flow

```text
Goals
 ↓
Create Goal
 ↓
Name
Target Amount
Target Date
Category
Description
 ↓
Save
 ↓
Goal card
```

---

# 52. Goal Contribution Flow

```text
Goal
 ↓
Add Contribution
 ↓
Enter Amount
 ↓
Optional Account
 ↓
Date
 ↓
Note
 ↓
Submit
 ↓
Update currentAmount
 ↓
Recalculate progress
 ↓
Goal card updated
```

---

# 53. Goal Completion Flow

```text
currentAmount >= targetAmount
 ↓
Goal reaches target
 ↓
Status = COMPLETED
 ↓
Success notification
 ↓
Goal displayed as completed
```

---

# 54. Analytics Flow

```text
Analytics
 ↓
Select date range
 ↓
Optional filters
 ↓
Request analytics
 ↓
Backend aggregation
 ↓
Normalize result
 ↓
Render charts
```

---

# 55. Analytics Filter Flow

Filters may include:

```text
Date range
Account
Category
Transaction type
Payment method
```

Changing filters should update all compatible analytics sections consistently.

---

# 56. Insight Flow

```text
Analytics data
 ↓
Insight Service
 ↓
Run deterministic rules
 ↓
Qualifying rule?
   │
   ├── No → No insight
   │
   └── Yes → Insight object
                 ↓
             Dashboard
                 +
             Analytics/Insights
```

---

# 57. Example Insight Rules

## Expense Increase

```text
Current expenses > previous period
```

Output:

```text
Your expenses increased by X%.
```

## Category Concentration

```text
Category share >= configured threshold
```

Output:

```text
Food represents X% of your expenses.
```

## Savings Improvement

```text
Current savings > previous savings
```

Output:

```text
You saved ₹X more than last month.
```

No external AI service is used.

---

# 58. Calendar Flow

```text
Calendar
 ↓
Select month
 ↓
Load financial events
 ↓
Combine:
Recurring payments
Goal deadlines
Budget periods
Other supported financial events
 ↓
Display calendar
```

---

# 59. Calendar Event Flow

```text
Calendar Event
 ↓
Click
 ↓
Event details
 ↓
View related resource
```

Example:

```text
Netflix
₹649
Sep 1
Monthly recurring payment
[View Recurring]
```

---

# 60. Notifications Flow

```text
Header Bell
 ↓
Notification dropdown
 ↓
View recent notifications
 ↓
Open Notifications
 ↓
All notifications
```

---

# 61. Mark Notification Read

```text
Notification
 ↓
Click / Mark as read
 ↓
PATCH notification
 ↓
read = true
 ↓
Unread count decreases
```

---

# 62. Mark All Read

```text
Notifications
 ↓
Mark all as read
 ↓
Backend updates user's unread notifications
 ↓
Unread count = 0
```

---

# 63. Notification Navigation

A notification may include a related action.

Example:

```text
Shopping budget reached 90%
[View Budget]
```

Flow:

```text
Notification
 ↓
View Budget
 ↓
Budget page
 ↓
Selected category/month context
```

---

# 64. Reports Flow

```text
Reports
 ↓
Select report
 ↓
Select date/month
 ↓
Generate
 ↓
Backend calculates report
 ↓
Preview
 ↓
Download PDF
or
Download CSV
```

---

# 65. Monthly Report Flow

```text
Reports
 ↓
Monthly Financial Report
 ↓
August 2026
 ↓
Generate
 ↓
Income
Expenses
Savings
Savings Rate
Top Categories
Payment Methods
 ↓
Preview
 ↓
Download
```

---

# 66. CSV Export Flow

```text
Reports
 ↓
Export CSV
 ↓
Select date/filter
 ↓
Backend generates CSV
 ↓
Download
```

---

# 67. PDF Export Flow

```text
Reports
 ↓
Export PDF
 ↓
Select period
 ↓
Backend generates PDF
 ↓
Download
```

---

# 68. User Data Export Flow

```text
Settings
 ↓
Account
 ↓
Export My Data
 ↓
Confirmation
 ↓
Generate export
 ↓
Download
```

The export must not include:

```text
passwordHash
reset tokens
JWT
secrets
```

---

# 69. Profile Flow

```text
Settings
 ↓
Profile
 ↓
Edit profile
 ↓
Name / Phone / Picture
 ↓
Save
 ↓
Success
 ↓
Updated profile
```

---

# 70. Profile Picture Flow

```text
Profile
 ↓
Change Picture
 ↓
Select image
 ↓
Validate
 ↓
Upload
 ↓
Server confirmation
 ↓
Update profile picture
```

---

# 71. Theme Flow

```text
Settings
 ↓
Appearance
 ↓
Light / Dark / System
 ↓
Select
 ↓
Apply immediately
 ↓
Persist preference
```

---

# 72. Notification Preferences Flow

```text
Settings
 ↓
Notifications
 ↓
Toggle preferences
 ↓
Save / Auto-save depending on implementation
 ↓
Persist user preference
```

---

# 73. Security Settings Flow

```text
Settings
 ↓
Security
 ↓
Change Password
 ↓
Current Password
New Password
Confirm Password
 ↓
Validate
 ↓
bcrypt compare current password
 ↓
Hash new password
 ↓
Update
 ↓
Success
```

---

# 74. Account Deletion Flow

```text
Settings
 ↓
Account
 ↓
Delete Account
 ↓
Warning
 ↓
Confirmation
 ↓
Final confirmation
 ↓
Delete/invalidate account and associated resources
 ↓
Logout
 ↓
Login
```

The exact retention behavior for administrative audit records follows `DATABASESCHEMA.md`.

---

# 75. Admin Access Flow

```text
Admin route
 ↓
Authentication
 ↓
Authenticated?
 │
 ├── No → Login
 │
 └── Yes
      ↓
    Role check
      │
      ├── USER → Forbidden
      │
      └── ADMIN
            ↓
        Admin page
```

Frontend route guards do not replace backend authorization.

---

# 76. Admin Dashboard Flow

```text
Admin Dashboard
 ↓
Load platform statistics
 ↓
Total Users
Active Users
Transactions
Financial activity
 ↓
Render admin dashboard
```

---

# 77. Admin User Search Flow

```text
Admin Users
 ↓
Search
 ↓
Enter name/email
 ↓
Backend search
 ↓
Results
```

Only authorized admin data should be returned.

---

# 78. Admin User Detail Flow

```text
Admin Users
 ↓
Select user
 ↓
User detail
 ↓
Safe account information
 ↓
Available administrative actions
```

Avoid exposing sensitive credentials.

---

# 79. Admin User Status Flow

```text
User detail
 ↓
Deactivate
 ↓
Confirmation
 ↓
PATCH user status
 ↓
Audit log
 ↓
Success
```

---

# 80. Admin Role Change Flow

```text
Admin User Detail
 ↓
Change Role
 ↓
Select role
 ↓
Confirm
 ↓
Backend authorization
 ↓
Update role
 ↓
Create audit log
 ↓
Success
```

Only authorized admins may change roles.

---

# 81. Admin Category Management Flow

```text
Admin
 ↓
Categories
 ↓
View system categories
 ↓
Create/Edit/Disable
 ↓
Validation
 ↓
Save
 ↓
Audit log
```

System categories should not be hard-deleted if historical transactions depend on them.

---

# 82. Admin Audit Log Flow

```text
Admin
 ↓
Audit Logs
 ↓
Filter
 ↓
Search
 ↓
View audit record
```

Audit logs are read-only through the normal admin UI.

---

# 83. Admin System Settings Flow

```text
Admin
 ↓
System Settings
 ↓
Edit permitted setting
 ↓
Validate
 ↓
Save
 ↓
Audit log
```

Only settings explicitly exposed by the product may be changed.

---

# 84. Authorization Failure Flow

```text
Protected Request
 ↓
Authenticated?
 │
 ├── No → 401
 │
 └── Yes
      ↓
    Authorized?
      │
      ├── No → 403
      │
      └── Yes → Continue
```

Frontend should show a clear forbidden page for `403`.

---

# 85. Resource Ownership Failure Flow

Example:

```text
User B requests User A transaction
 ↓
Backend ownership query fails
 ↓
Return safe not-found/forbidden behavior
```

Do not expose internal ownership information.

---

# 86. API Validation Failure Flow

```text
Form
 ↓
Client validation
 ↓
Submit
 ↓
Server validation
 ↓
Invalid
 ↓
422/appropriate validation response
 ↓
Map errors to fields
```

---

# 87. Network Error Flow

```text
API Request
 ↓
Network failure
 ↓
Show retry state
 ↓
[Retry]
 ↓
Request again
```

Do not automatically duplicate financial mutations without safe idempotency behavior.

---

# 88. Database Failure Flow

```text
API
 ↓
Database failure
 ↓
Central error handler
 ↓
Safe server error
 ↓
User sees:
"Something went wrong. Please try again."
```

---

# 89. File Upload Failure Flow

```text
Upload
 ↓
Multer/file validation
 ↓
Failure
 ↓
Return safe error
 ↓
Keep form data where practical
 ↓
Allow retry
```

---

# 90. Session Expiration Flow

```text
User active
 ↓
API returns 401
 ↓
Session expired
 ↓
Clear client auth state
 ↓
Show session-expired message
 ↓
Redirect Login
```

---

# 91. Mobile Navigation Flow

```text
Mobile
 ↓
Bottom navigation / menu
 ↓
Home
Transactions
Budgets
Goals
More
```

More:

```text
Accounts
Recurring
Calendar
Analytics
Reports
Notifications
Settings
```

---

# 92. Mobile Add Transaction Flow

The add transaction action should remain highly accessible.

Possible:

```text
Bottom nav / floating action
 ↓
Add Transaction
 ↓
Compact mobile form
 ↓
Submit
 ↓
Success
 ↓
Return to previous context
```

---

# 93. Mobile Filter Flow

```text
Transactions
 ↓
Filters
 ↓
Bottom sheet
 ↓
Select filters
 ↓
Apply
 ↓
Results
```

---

# 94. Mobile Notification Flow

```text
Header Bell
 ↓
Notification drawer/page
 ↓
Select notification
 ↓
Open related resource
```

---

# 95. Deep Link Flow

If an authenticated user opens:

```text
/transactions/abc123
```

then:

```text
Check session
 ↓
Check authorization
 ↓
Load transaction
 ↓
Render detail
```

If unauthenticated:

```text
Redirect login
 ↓
After login
 ↓
Return to requested route
```

where safe and supported.

---

# 96. Protected Route Matrix

| Route | Auth Required | Admin Required |
|---|---:|---:|
| `/dashboard` | Yes | No |
| `/transactions` | Yes | No |
| `/accounts` | Yes | No |
| `/budgets` | Yes | No |
| `/recurring` | Yes | No |
| `/goals` | Yes | No |
| `/calendar` | Yes | No |
| `/analytics` | Yes | No |
| `/reports` | Yes | No |
| `/notifications` | Yes | No |
| `/settings` | Yes | No |
| `/admin` | Yes | Yes |
| `/admin/users` | Yes | Yes |
| `/admin/audit-logs` | Yes | Yes |
| `/admin/categories` | Yes | Yes |
| `/admin/settings` | Yes | Yes |

---

# 97. Main User Journey

The ideal primary journey is:

```text
Register
 ↓
Onboarding
 ↓
Add Account
 ↓
Add Income
 ↓
Add Expenses
 ↓
Dashboard
 ↓
Set Budget
 ↓
Create Savings Goal
 ↓
Track Transactions
 ↓
Review Analytics
 ↓
Receive Insights
 ↓
Adjust Spending
 ↓
Review Reports
```

---

# 98. Daily User Journey

Typical user:

```text
Login
 ↓
Dashboard
 ↓
Check balance
 ↓
Check budget
 ↓
Add transaction
 ↓
Review notification
 ↓
Continue work
```

---

# 99. Monthly User Journey

```text
Dashboard
 ↓
Review previous month
 ↓
Analytics
 ↓
Compare income/expenses
 ↓
Review category spending
 ↓
Review savings
 ↓
Review budgets
 ↓
Generate monthly report
 ↓
Set next month's budgets
```

---

# 100. Recurring Payment Journey

```text
Recurring
 ↓
Create Netflix
 ↓
₹649
 ↓
Monthly
 ↓
Next payment
 ↓
Scheduled processing
 ↓
Transaction generated
 ↓
Notification if configured
 ↓
Dashboard updated
```

---

# 101. Savings Journey

```text
Create Goal
 ↓
Set target
 ↓
Add contributions
 ↓
View progress
 ↓
Receive milestone notification
 ↓
Complete goal
```

---

# 102. Budget Journey

```text
Create Food Budget
 ↓
Set ₹5,000
 ↓
Add expenses
 ↓
Usage 50%
 ↓
Usage 75%
 ↓
Usage 90%
 ↓
Usage 100%+
 ↓
Warning/Exceeded notification
```

---

# 103. Receipt Journey

```text
Add Expense
 ↓
Upload Amazon receipt
 ↓
Server validates file
 ↓
Store file
 ↓
Associate with transaction
 ↓
View receipt later
```

---

# 104. Report Journey

```text
Reports
 ↓
August 2026
 ↓
Generate report
 ↓
Review summary
 ↓
Download PDF
 ↓
Download CSV
```

---

# 105. Error Recovery Principles

Every recoverable error should provide a next action.

Examples:

```text
Load failed → Retry
Validation failed → Fix field
Expired password link → Request new link
Forbidden → Go back/dashboard
Missing page → Dashboard
Upload failed → Retry upload
```

---

# 106. Destructive Flow Principles

For destructive actions:

```text
Action
 ↓
Explain consequence
 ↓
Confirm
 ↓
Execute
 ↓
Success feedback
```

Do not make destructive actions one-click where accidental activation is likely.

---

# 107. Navigation Preservation

When practical, preserve:

- Search query
- Filters
- Selected month
- Selected analytics period

when navigating back from detail pages.

---

# 108. Back Navigation

The user should be able to return naturally from:

```text
Transaction Detail → Transactions
Budget Detail → Budgets
Goal Detail → Goals
Recurring Detail → Recurring
Report Preview → Reports
```

---

# 109. Query State

Filter/query state should not be stored in URLs if it would expose sensitive information unnecessarily.

Non-sensitive view state may use query parameters where useful.

---

# 110. Loading Flow Standards

Page load:

```text
Skeleton
 ↓
Data
 ↓
Content
```

Mutation:

```text
Button loading
 ↓
Request
 ↓
Success/error
```

Avoid:

```text
Blank page
 ↓
Sudden content
```

---

# 111. Empty State Flow Standards

```text
No data
 ↓
Explain why
 ↓
Give primary action
```

Example:

```text
No budgets yet.
Set your first category budget.

[Create Budget]
```

---

# 112. Partial Loading

For dashboard:

```text
Summary → loaded
Chart → loading
Transactions → loaded
Goals → loaded
```

The whole page does not need to wait for the slowest widget.

---

# 113. Partial Failure

If a secondary section fails:

```text
Analytics unavailable
[Retry]
```

while the rest of the dashboard remains usable.

---

# 114. Notification Trigger Flow

Supported deterministic triggers include:

```text
Budget threshold reached
Budget exceeded
Recurring payment approaching
Savings goal milestone
Financial insight available
System event
```

---

# 115. Notification Preference Flow

```text
Trigger occurs
 ↓
Check user's notification preference
 ↓
Enabled?
 │
 ├── No → Do not create/send applicable notification
 │
 └── Yes → Create notification
```

Critical security/system notifications may follow separate product rules.

---

# 116. Admin Seed Flow

Initial deployment/development:

```text
Run seed
 ↓
Read environment
 ↓
Check admin
 ↓
Admin exists?
 │
 ├── Yes → No duplicate
 │
 └── No
      ↓
    bcrypt hash password
      ↓
    Create ADMIN
```

---

# 117. Environment Flow

Development:

```text
.env
 ↓
Backend
 ↓
MongoDB
 ↓
Frontend
```

Production:

```text
Production environment variables
 ↓
Backend
 ↓
Production MongoDB
```

`.env` must never be committed.

---

# 118. Demo Flow

```text
Landing
 ↓
Explore Demo
 ↓
Demo Login / Demo Session
 ↓
Dashboard with sample data
```

The demo account must remain isolated from real user data.

---

# 119. No AI Flow

There is intentionally no flow such as:

```text
User
 ↓
Prompt
 ↓
AI API
 ↓
Financial Advice
```

Instead:

```text
User Data
 ↓
Analytics
 ↓
Deterministic Rules
 ↓
Financial Insight
```

---

# 120. Final User Flow Map

```text
                         FINTRACK
                            │
              ┌─────────────┴─────────────┐
              │                           │
       Unauthenticated               Authenticated
              │                           │
       ┌──────┼──────┐                    ▼
       │      │      │                Dashboard
     Login Register Forgot                │
       │      │      │          ┌────────┼─────────┐
       │      │      │          │        │         │
       │      └──→ Onboarding   │        │         │
       │              │         ▼        ▼         ▼
       └──────────────┘     Transactions Budgets Accounts
                              │            │         │
                              ▼            ▼         ▼
                           Receipts     Alerts    Balances
                              │
                              ├──────────────┐
                              ▼              ▼
                         Recurring       Analytics
                              │              │
                              ▼              ▼
                           Calendar       Insights
                                             │
                                             ▼
                                          Reports

                         Savings Goals
                              │
                              ▼
                           Progress

                         Notifications
                              │
                              ▼
                            Alerts

                         Settings
                              │
                 ┌────────────┼─────────────┐
                 ▼            ▼             ▼
              Profile     Security      Preferences

                         ADMIN ONLY
                              │
                              ▼
                       Admin Dashboard
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
               Users      Audit Logs    Categories
                                           │
                                           ▼
                                     System Settings
```

---

# 121. Flow Consistency Rules

All flows must respect:

```text
Authentication
Authorization
Ownership
Validation
Business Logic
Financial Integrity
```

The frontend must never bypass backend security.

---

# 122. Flow Scope Lock

The following flows are locked for FinTrack v1:

```text
Registration
Login/logout
JWT session authentication
Forgot/reset password
Onboarding
Protected dashboard
Income/expense transactions
Transaction search/filter
Receipt upload
Accounts/wallets
Budgets
Budget alerts
Recurring transactions
Savings goals
Analytics
Deterministic financial insights
Calendar
Notifications
PDF reports
CSV reports
User data export
Profile/settings
Dark mode
Admin dashboard
RBAC
Admin user management
Admin category management
Admin audit logs
System settings
```

No AI-powered user flow is part of the locked scope.

---

# 123. Final Flow Quality Bar

Every completed flow must be:

- Understandable without explanation
- Responsive
- Keyboard accessible
- Mobile friendly
- Secure
- Consistent with the database ownership model
- Consistent with backend authorization
- Recoverable when errors occur
- Clear about success/failure
- Free of unnecessary steps
- Consistent with the UI/UX design system

---

# 124. Source-of-Truth Relationship

```text
PRD.md
→ Product scope

TRD.md
→ Technical requirements

ARCHITECTURE.md
→ System architecture

DATABASESCHEMA.md
→ Database structure

UI/UX.md
→ Visual and interaction design

WEBFLOW.md
→ Navigation and user/admin flows

IMPLEMENTATION.md
→ Implementation phases
```

Any flow change that modifies product behavior must also be reflected in the appropriate source-of-truth documents.

---

# 125. Web Flow Scope Lock

This document defines the locked navigation and interaction flows for **FinTrack v1**.

The flows are designed around a clean, secure, professional personal finance experience with clear user journeys and minimal unnecessary friction.

All financial insights are generated through internal deterministic logic.

No AI API, AI assistant, AI chatbot, or external AI financial service is included.

**`WEBFLOW.md` is the navigation and flow source of truth for FinTrack v1.**
