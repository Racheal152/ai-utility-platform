# AivaPay — AI-Powered Multi-Utility Household Management Platform

> A full-stack, AI-assisted platform for collaborative household bill management, payment verification, predictive budgeting, and sustainability insights.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Backend](#backend)
  - [Server & Middleware](#server--middleware)
  - [Authentication](#authentication)
  - [Household Management](#household-management)
  - [Bill Management](#bill-management)
  - [Payment Proofs & OCR Verification](#payment-proofs--ocr-verification)
  - [AI Insights & Predictions](#ai-insights--predictions)
  - [Notifications](#notifications)
  - [Automated Deadline Reminders](#automated-deadline-reminders)
- [Frontend](#frontend)
  - [Routing & Auth Guard](#routing--auth-guard)
  - [Pages](#pages)
  - [Components](#components)
  - [API Service Layer](#api-service-layer)
- [Full API Reference](#full-api-reference)
- [Notification System](#notification-system)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Overview

**AivaPay** is a collaborative, AI-powered utility bill management platform built for shared households (flatmates, families, etc.). It automates the tracking, splitting, verification, and payment of household utility bills — from electricity and water to internet and rent — all in one premium, responsive web interface.

### Key Features

| Feature | Description |
|---|---|
| 🏠 **Household Management** | Create, join, rename, and manage shared households with role-based access |
| 💰 **Expense Splitting** | Automatically split bills equally or use custom splits per member |
| 📸 **AI Payment Verification** | OCR-based proof validation using Tesseract.js for images and pdf-parse for PDFs |
| 🤖 **AI Insights** | Automated sustainability kudos and spending alerts from historical data |
| 📈 **Predictive Analytics** | Moving-average-based forecasts for each utility type |
| 📊 **Usage Tracking** | Record volumetric usage (kWh, m³, Liters) alongside monetary amounts |
| 🔔 **Smart Notifications** | Broadcast system — every major action notifies all household members |
| ⏰ **Deadline Reminders** | Automated daily reminders for bills due the next day via node-cron |
| 🛡️ **Admin Dashboard** | Comprehensive system oversight, proof verification modal, user management, and CSV/PDF exports |
| 🌐 **Public Portal** | Animated Landing Page, About Us, Terms & Conditions, and a detailed visual User Guide |
| 🔐 **Secure Auth** | JWT-based authentication with bcrypt password hashing and OTP-based email verification |

---

## Technology Stack

### Backend
| Technology | Role |
|---|---|
| **Node.js + Express 5** | REST API server |
| **PostgreSQL** | Relational database |
| **pg** | PostgreSQL client for Node.js |
| **JSON Web Tokens (JWT)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Multer** | File upload handling (receipts, proofs) |
| **Tesseract.js** | OCR engine for image-based payment proofs |
| **pdf-parse** | Text extraction from digital PDFs |
| **pdfjs-dist** | Page rendering for scanned PDF OCR |
| **canvas** | Canvas renderer for scanned PDFs in Node.js |
| **node-cron** | Scheduled deadline reminder jobs |
| **dotenv** | Environment variable management |

### Frontend
| Technology | Role |
|---|---|
| **React 18 + Vite** | UI framework and build tool |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client with JWT interceptors |
| **Recharts** | Data visualization (Bar, Line, Area charts) |
| **Framer Motion** | Premium scroll-triggered animations and page transitions |
| **Lucide React** | Icon library |
| **Tailwind CSS** | Utility-first styling (via CDN/Vite config) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │Dashboard │ │ Bills &  │ │Household │ │ Admin    │  │
│  │          │ │  Splits  │ │  Manager │ │ Dashboard│  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │
│          └──────────── Axios (api.js) ──────────────┘   │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP/REST (JWT Auth)
┌────────────────────────────▼────────────────────────────┐
│                  BACKEND (Node.js / Express)             │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │   Auth   │ │Household │ │  Bills &  │ │ Admin    │  │
│  │Controller│ │Controller│ │ Payments  │ │Controller│  │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │                   Services Layer                  │   │
│  │  ┌───────────┐ ┌───────────┐ ┌────────────────┐  │   │
│  │  │OCR Service│ │ Anomaly   │ │Reminder Service│  │   │
│  │  │(Tesseract)│ │ Service   │ │  (node-cron)   │  │   │
│  │  └───────────┘ └───────────┘ └────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                   PostgreSQL Database                     │
│  Users │ Households │ HouseholdMembers │ Bills           │
│  ExpenseShares │ ShareLines │ PaymentProofs │ Forecasts   │
│  Notifications │ ActivityLogs                            │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `Users`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique user ID |
| `name` | VARCHAR | Display name |
| `email` | VARCHAR UNIQUE | Login email |
| `password_hash` | VARCHAR | bcrypt hashed password |
| `role` | VARCHAR | System role (default: `user`) |
| `created_at` | TIMESTAMP | Registration time |

### `Households`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique ID |
| `name` | VARCHAR | Household name (e.g., "Westlands Flat 4B") |
| `created_by` | INT FK → Users | Owner of the household |
| `invite_code` | VARCHAR | Temporary invite token for members to join |
| `created_at` | TIMESTAMP | Creation time |

### `HouseholdMembers`
| Column | Type | Description |
|---|---|---|
| `user_id` | INT FK → Users | Member user |
| `household_id` | INT FK → Households | Linked household |
| `role` | VARCHAR | `owner` or `member` |
| `joined_at` | TIMESTAMP | When they joined |

### `Bills`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique bill ID |
| `household_id` | INT FK | Owning household |
| `utility_type` | VARCHAR | `Electricity`, `Water`, `Internet`, `Rent`, `Gas`, `Other` |
| `amount` | DECIMAL(10,2) | Total monetary amount (KES) |
| `usage_value` | DECIMAL(10,2) | Optional consumption value (e.g., 250) |
| `usage_unit` | VARCHAR | Optional unit (e.g., `kWh`, `m³`, `Liters`) |
| `due_date` | DATE | Payment deadline |
| `period` | VARCHAR | Billing period (e.g., `March 2026`) |
| `status` | VARCHAR | `pending`, `partially_paid`, `paid` |
| `created_at` | TIMESTAMP | Bill creation time |

### `ExpenseShares`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique ID |
| `bill_id` | INT FK UNIQUE → Bills | Linked bill |
| `split_type` | VARCHAR | `equal` or `custom` |

### `ShareLines`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique ID |
| `expense_share_id` | INT FK → ExpenseShares | Parent share group |
| `user_id` | INT FK → Users | Member responsible for this sub-share |
| `amount` | DECIMAL(10,2) | Their individual share amount |
| `status` | VARCHAR | `unpaid` or `paid` |

### `PaymentProofs`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique proof ID |
| `bill_id` | INT FK → Bills | The bill being paid |
| `user_id` | INT FK → Users | Who submitted the proof |
| `image_url` | TEXT | Path to the uploaded file on disk |
| `ocr_data` | JSONB | AI-extracted data: `{ extractedAmount, paymentDate, paymentType, transactionCode, autoApproved }` |
| `status` | VARCHAR | `pending`, `verified`, `rejected` |
| `rejection_reason` | TEXT | Owner-provided reason when a proof is rejected |
| `uploaded_at` | TIMESTAMP | Upload timestamp |

### `Notifications`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Unique ID |
| `user_id` | INT FK → Users | Recipient |
| `message` | TEXT | Notification body |
| `type` | VARCHAR | Event type (see [Notification System](#notification-system)) |
| `is_read` | BOOLEAN | Read/unread status |
| `created_at` | TIMESTAMP | Creation time |

### `Forecasts`
| Column | Type | Description |
|---|---|---|
| `id` | SERIAL PK | Forecast ID |
| `household_id` | INT FK | Owning household |
| `utility_type` | VARCHAR | Utility category |
| `predicted_amount` | DECIMAL | AI-predicted amount |
| `prediction_date` | DATE | The month being predicted |

---

## Backend

### Server & Middleware

**`backend/server.js`** — Express application entry point.

- Configures `cors`, `express.json()`, and static file serving for `/uploads`.
- Registers route modules under `/api/*`.
- Initializes the `ReminderService` cron scheduler on startup.

**`backend/middleware/authMiddleware.js`** — JWT protection.

- `protect`: Verifies `Bearer <token>` in `Authorization` header using `jsonwebtoken`.
- Decodes the token and attaches `{ id, name, role }` to `req.user`.
- Returns `401` if token is missing or invalid.

---

### Authentication

**File:** `backend/controllers/authController.js`  
**Routes:** `POST /api/auth/register`, `POST /api/auth/login`

#### `POST /api/auth/register`
- Accepts `{ name, email, password }`.
- Checks for duplicate emails.
- Hashes password using `bcryptjs` (salt rounds: 10).
- Returns `{ id, name, email, role, token }` with a 30-day JWT.

#### `POST /api/auth/login`
- Accepts `{ email, password }`.
- Compares password against stored hash.
- Returns `{ id, name, email, role, token }` on success, `401` on failure.

---

### Household Management

**File:** `backend/controllers/householdController.js`  
**Routes:** `/api/households/*`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/households` | ✅ | Create a new household (creator becomes owner) |
| `GET` | `/api/households` | ✅ | Get all households the current user belongs to |
| `POST` | `/api/households/ensure` | ✅ | Auto-create a default household if none exists |
| `GET` | `/api/households/:id/members` | ✅ | List all members with roles and join dates |
| `POST` | `/api/households/:id/invite` | ✅ | Generate a short alphanumeric invite code |
| `POST` | `/api/households/join` | ✅ | Join a household using an invite code |
| `DELETE` | `/api/households/:id/members/:userId` | ✅ | Remove a member (owner only) or leave (self) |
| `PATCH` | `/api/households/:id/transfer-ownership` | ✅ | Atomically transfer owner role to another member |
| `PATCH` | `/api/households/:id` | ✅ | Rename the household (owner only) |

**Business Rules:**
- The household owner **cannot** be removed — ownership must be transferred first.
- All role changes (remove, transfer) use `BEGIN/COMMIT` transactions for atomicity.
- Renaming and ownership transfers trigger **broadcast notifications** to all members.

---

### Bill Management

**File:** `backend/controllers/billController.js`  
**Routes:** `/api/bills/*`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/bills` | ✅ | Add a new bill with optional usage metrics and custom splits |
| `GET` | `/api/bills/household/:householdId` | ✅ | Get all bills for a household, enriched with per-user split and proof data |
| `GET` | `/api/bills/household/:householdId/insights` | ✅ | Get AI-generated household insights |
| `GET` | `/api/bills/household/:householdId/predictions` | ✅ | Get AI spending predictions for each utility |
| `PATCH` | `/api/bills/:id/status` | ✅ | Manually update bill status |
| `DELETE` | `/api/bills/:id` | ✅ | Delete a bill and notify all participants |

**Adding a Bill (`addBill`):**
- Accepts `{ household_id, utility_type, amount, due_date, period, usage_value, usage_unit, splits[] }`.
- If `splits[]` is provided, uses custom amounts per member.
- If not, equally divides `amount` across all household members.
- Creates an `ExpenseShares` record and individual `ShareLines` for each member.
- Notifies every assigned member via broadcast notification.

**Getting Bills (`getBills`):**
- Uses a complex SQL query with `JSON_AGG` and a lateral subquery to return each bill enriched with:
  - All member share lines with their individual statuses.
  - The latest payment proof per user (including OCR data and rejection reason).
  - The calling user's specific share info surfaced to the root for easy frontend consumption.

---

### Payment Proofs & OCR Verification

**File:** `backend/controllers/paymentController.js`  
**Routes:** `/api/bills/proofs/*`

#### `POST /api/bills/upload-proof`
Accepts a `multipart/form-data` request with `bill_id` and a `receipt` file.

**OCR Workflow:**
1. File is saved to `uploads/` by Multer (max 10MB; supports JPG, PNG, WebP, PDF).
2. `ocrService.extractPaymentDetails()` is called:
   - For **images**: Tesseract.js performs English OCR and extracts raw text.
   - For **digital PDFs**: `pdf-parse` extracts text directly (fast path).
   - For **scanned PDFs**: `pdfjs-dist` renders page 1 to a canvas, then Tesseract.js reads the image.
3. `parseText()` uses regex patterns to extract:
   - **Amount**: KES amount patterns, "total/paid/sent" keywords.
   - **Date**: Common date formats.
   - **Transaction Code**: M-Pesa style alphanumeric codes (e.g., `SBQ1A2BC3D`).
   - **Payment Type**: Keywords matching KPLC, Nairobi Water, Faiba, Zuku, etc.

**Auto-Approval Logic:**
- Fetches the user's `ShareLine` amount.
- Compares `extractedAmount` to the share (within 0.50 KES tolerance) OR checks if the amount string appears in the raw OCR text.
- If matched: Proof is marked `verified`, ShareLine is set to `paid`, Bill status is updated.
- If not matched: Proof remains `pending` for manual review.

**Notifications on Upload:**
- If **auto-approved**: Uploader gets a verification success message. All other members get a broadcast: `"[User] has successfully paid their share (KES X) of the [Utility] bill."` 
- If **pending review**: Uploader gets a "awaiting review" message. **All other household members** get a `review_required` notification: `"A new payment proof from [User] requires manual review."`

#### `PATCH /api/bills/proofs/:proofId/approve`
- Owner manually approves a pending proof.
- Updates ShareLine to `paid`, recalculates bill status.
- Broadcasts to all members: different messages for the uploader vs. other members.

#### `PATCH /api/bills/proofs/:proofId/reject`
- Accepts `{ reason }` — a mandatory rejection message.
- Updates proof status to `rejected`, saves `rejection_reason`.
- Broadcasts to all members: uploader gets the specific reason, others get a generic re-submission notice.

---

### AI Insights & Predictions

**File:** `backend/controllers/billController.js`

#### AI Predictions (`getPredictions`)
Uses a **simple moving average** algorithm over the last 3 bills per utility type:
- Groups historical bills by `utility_type`.
- Computes average of 3 most recent amounts.
- Adds a ±5% variance to simulate a realistic AI margin of error.
- Returns `{ utility_type, predicted_amount, confidence, trend }` for each utility.

#### AI Insights (`getAiInsights`)
Performs **month-over-month comparative analysis**:

| Scenario | Type | Trigger |
|---|---|---|
| Bill dropped ≥ 5% | `success` ✅ | Generates a "Excellent Savings" kudos card |
| Usage dropped ≥ 5% | `success` ✅ | Generates an "Eco-Hero Status" sustainability card |
| Bill jumped ≥ 15% | `warning` ⚠️ | Generates a spike alert with utility-specific solutions |

**Utility-Specific Solutions:**
- **Water spike**: "Check for silent leaks in toilets or dripping faucets."
- **Electricity spike**: "Switching to LED bulbs or unplugging idle devices can help."
- **Generic spike**: "Try identifying high-consumption appliances."

If no clear trend is detected, an informational "Data Gathering in Progress" card is returned to encourage continued data entry.

---

### Notifications

**File:** `backend/routes/notifications.js`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get all **unread** notifications for the current user |
| `GET` | `/api/notifications?history=true` | Get the last 50 notifications (read + unread) |
| `PATCH` | `/api/notifications/:id/read` | Mark a single notification as read (dismissed) |
| `DELETE` | `/api/notifications` | Mark all of the user's notifications as read |
| `POST` | `/api/notifications` | Internal endpoint to create a notification |

---

### Automated Deadline Reminders

**File:** `backend/services/reminderService.js`

Uses `node-cron` to schedule a daily job at **9:00 AM**:

1. Queries all `Bills` where `due_date = CURRENT_DATE + 1 day` AND `status != 'paid'`.
2. For each bill, finds all `ShareLines` where `status = 'unpaid'`.
3. Sends a targeted personal reminder to each unpaid member:  
   `"Reminder: The [Utility] bill for [Period] is due tomorrow ([Date])! You still have an unpaid share of KES [Amount]."`
4. All reminders use the `deadline_approaching` notification type for priority visual styling.

---

## Frontend

### Routing & Auth Guard

**File:** `frontend/src/App.jsx`

- Uses React Router v6 with `<Routes>` and `<Route>`.
- Public routes: `/login`, `/register`.
- Private routes: `/dashboard`, `/bills`, `/household`, `/settings`.
- JWT token is stored in `localStorage`. An Axios response interceptor auto-redirects to `/login` on `401` responses.

---

### Pages

#### Login (`/login`) — `frontend/src/pages/Login.jsx`
- Full-page premium login form with gradient background and glassmorphism card.
- Sends `{ email, password }` to `POST /api/auth/login`.
- Stores `token` and `user` in `localStorage` on success.

#### Register (`/register`) — `frontend/src/pages/Register.jsx`
- Registration form with client-side validation.
- On success, auto-logs in the new user.

#### Dashboard (`/dashboard`) — `frontend/src/pages/Dashboard.jsx`
The central hub displaying:

- **Metric Cards**: Your total share, per-utility current bills, AI projected next month total.
- **AI Household Insights**: `UsageInsights` component showing kudos / warnings based on spending trends.
- **Household Usage Trends**: `AreaChart` (Recharts) showing volumetric consumption month-over-month per utility.
- **Expense Analytics**: `BarChart` / `LineChart` toggle for paid bill breakdown. Filterable by period.
- **AI Prediction Breakdown**: Future cost estimates in List, Bar, or Line view modes.
- **Pending Bills**: Quick list of outstanding bills with due dates and overdue indicators.

#### Bill Tracking (`/bills`) — `frontend/src/pages/BillTracking.jsx`
Full bill management with:

- **Bill List**: Searchable, sortable table showing all household bills with status badges and verification badges.
- **Add Bill**: Opens `AddBillModal` for creating bills with optional usage metrics and custom splits.
- **Upload Proof**: Drag-and-drop or click-to-upload receipt modal (images or PDFs).
- **Bill Details Panel**: Expandable modal showing:
  - Full bill info, member splits, share statuses.
  - Payment proof images with OCR extracted data overlay.
  - **Owner Controls**: "Verify" button (approve proof) + "Reject" button with mandatory reason text area.
  - **Rejection Reason Display**: Red alert box showing the rejection reason to the uploader.

#### Household (`/household`) — `frontend/src/pages/Household.jsx`
Complete household management:

- **Household Card**: Displays household info. Owners see an inline pencil icon to rename the household.
- **Member List**: Shows all members with roles. Owners see action buttons per member.
- **Remove Member**: Owner can remove any non-owner member with a confirmation flow.
- **Transfer Ownership**: Owner can promote any member, including a confirmation step.
- **Invite System**: "Generate Invite Code" button creates a short alphanumeric code. "Join with Code" allows any logged-in user to join.

#### Settings (`/settings`) — `frontend/src/pages/Settings.jsx`
User profile management:
- Update display name.
- Change password (with current password verification).
- Account info display.

#### Admin Dashboard (`/admin`) — `frontend/src/pages/AdminDashboard.jsx`
Complete system oversight panel for Platform Administrators:
- **Global Stats**: Overview of total revenue, users, households, and verification rates.
- **User Management**: View, delete, and manage user roles and statuses with a custom persistent-color dropdown.
- **Payment Proofs**: Centralized view to approve or reject proofs with a dedicated **View Proof Modal** for visual receipt inspection.
- **System Exports**: 1-click export of system data to CSV or PDF formats.
- **System Logs**: View recent administrative actions.

#### Public Portal (`/`, `/about`, `/terms`, `/guide`)
- Beautifully animated Landing page with Framer Motion.
- Comprehensive `UserGuide.jsx` featuring high-quality platform screenshots and step-by-step instructions.
- Dedicated `AboutUs.jsx` and `Terms.jsx` pages for platform information.

#### Authentication & OTP (`/forgot-password`, `/verify-otp`)
- Full OTP-based password reset flow utilizing Nodemailer.

---

### Components

#### `NotificationBell.jsx`
Real-time notification dropdown in the header:

- Polls the backend every **60 seconds** for new notifications.
- Shows a pulsing **violet dot** when unread notifications exist.
- Dropdown shows the **3 most recent** notifications by default.
- **"View Notification History"** toggle expands to show the last 50.
- Each notification type has a distinct icon:

| Type | Icon | Color |
|---|---|---|
| `bill_added` | Clock | Amber |
| `payment_verified` | CheckCircle | Emerald |
| `payment_pending` | AlertCircle | Amber |
| `deadline_approaching` | AlertCircle | Rose/Red |
| `review_required` | Clock | Violet |
| `member_removed` | UserMinus | Red |
| `ownership_transfer` | ShieldCheck | Violet |
| `household_update` | Info | Blue |
| `danger` | AlertCircle | Red |
| `bill_deleted` | X | Red |
| `bill_updated` | Info | Blue |

- Individual dismiss (mark as read) via ✕ button per notification.
- "Clear All" button marks all notifications as read at once.

#### `AddBillModal.jsx`
Premium modal for creating new bills:

- Fields: Utility Type (select), Total Amount (KES), Period (text), Due Date (date picker).
- **Usage Tracking** fields (optional): Usage Value (number) and Unit (text).
- **Advanced Custom Split** section: Expandable per-member amount input with a live "Balanced / Remaining" indicator.
- Submits to `POST /api/bills` and triggers `loadData` callback.

#### `UsageInsights.jsx`
Renders AI insight cards on the Dashboard:

- **Success cards** (emerald): Savings kudos and eco-hero sustainability messages.
- **Warning cards** (amber): Spike detection alerts with actionable solutions.
- **Info cards** (violet): Informational prompts to keep adding data.
- Each card has a utility-specific icon, hover scale-up animation.

#### `MobileNav.jsx`
Fixed bottom navigation bar for mobile screens:
- Links to Dashboard, Bills, Household, Settings.
- Hides on desktop viewports.

---

### API Service Layer

**File:** `frontend/src/services/api.js`

Central Axios instance pre-configured with:
- `baseURL: 'http://localhost:5000/api'`
- **Request Interceptor**: Automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- **Response Interceptor**: On `401`, clears auth storage and redirects to `/login`.

All API calls are exported as named functions organized by domain:

```
Households:    ensureHousehold, fetchHouseholds, createHousehold, updateHousehold,
               fetchMembers, generateInvite, joinHousehold, removeMember, transferOwnership

Bills:         fetchBills, fetchAiInsights, fetchPredictions, addBill,
               updateBillStatus, deleteBill

Notifications: fetchNotifications, markNotificationRead, clearNotifications

Payment Proofs: uploadProof, approveProof, rejectProof

Users:         updateProfile
```

---

## Full API Reference

### Auth
| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | `{ id, name, email, role, token }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ id, name, email, role, token }` |

### Households
| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/households` | `{ name }` | Created household |
| `GET` | `/api/households` | — | Array of user's households |
| `POST` | `/api/households/ensure` | — | Existing or newly created household |
| `PATCH` | `/api/households/:id` | `{ name }` | Updated household |
| `GET` | `/api/households/:id/members` | — | Array of members |
| `POST` | `/api/households/:id/invite` | — | `{ invite_code }` |
| `POST` | `/api/households/join` | `{ token }` | `{ message, household }` |
| `DELETE` | `/api/households/:id/members/:userId` | — | `{ message }` |
| `PATCH` | `/api/households/:id/transfer-ownership` | `{ newOwnerId }` | `{ message }` |

### Bills
| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/bills` | `{ household_id, utility_type, amount, due_date, period, usage_value?, usage_unit?, splits? }` | Created bill |
| `GET` | `/api/bills/household/:id` | — | Enriched bills array |
| `GET` | `/api/bills/household/:id/insights` | — | AI insights array |
| `GET` | `/api/bills/household/:id/predictions` | — | `{ total_predicted, predictions[] }` |
| `PATCH` | `/api/bills/:id/status` | `{ status }` | Updated bill |
| `DELETE` | `/api/bills/:id` | — | `{ message }` |

### Payment Proofs
| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/bills/upload-proof` | `multipart: { bill_id, receipt }` | `{ message, proof, extracted_data, autoApproved }` |
| `PATCH` | `/api/bills/proofs/:id/approve` | — | `{ message, proof }` |
| `PATCH` | `/api/bills/proofs/:id/reject` | `{ reason }` | `{ message, proof }` |

### Notifications
| Method | Endpoint | Query | Response |
|---|---|---|---|
| `GET` | `/api/notifications` | `?history=true` (optional) | Notifications array |
| `PATCH` | `/api/notifications/:id/read` | — | `{ message }` |
| `DELETE` | `/api/notifications` | — | `{ message }` |

### Users
| Method | Endpoint | Body | Response |
|---|---|---|---|
| `PUT` | `/api/users/profile` | `{ name?, currentPassword?, newPassword? }` | `{ message, user? }` |

---

## Notification System

AivaPay uses a **"Broadcast First"** notification model, ensuring that all household members are informed about major events.

### Event → Notification Mapping

| Action | Who Gets Notified | Type |
|---|---|---|
| Bill added | All assigned members | `bill_added` |
| Bill deleted | All participants | `bill_deleted` |
| Bill status updated | All participants | `bill_updated` |
| Proof uploaded (AI verified) | Uploader + All other members | `payment_verified` |
| Proof uploaded (needs review) | Uploader (`payment_pending`) + All others (`review_required`) | mixed |
| Proof approved manually | All members (contextual message) | `payment_verified` |
| Proof rejected | All members (uploader gets reason) | `danger` |
| Member joined | Owner | `user_added` |
| Member removed | Removed member + Owner | `member_removed` |
| Ownership transferred | Old owner + New owner | `ownership_transfer` |
| Household renamed | All members | `household_update` |
| Bill due tomorrow (cron) | All unpaid members | `deadline_approaching` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/ai-utility-platform.git
cd ai-utility-platform
```

### 2. Database Setup
```bash
# Connect to PostgreSQL and create the database
psql -U postgres -c "CREATE DATABASE ai_utility_db;"

# Run the schema
psql -U postgres -d ai_utility_db -f backend/init.sql

# Run migrations for additional columns
node backend/migrate.js
node backend/migrate_rejection.js
node backend/migrate_usage.js
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Start the server
node server.js
# Server will start at http://localhost:5000
```

### 4. Frontend Setup
```bash
cd frontend
npm install

# Start the dev server
npm run dev
# App will be available at http://localhost:5173
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_utility_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here

# Server
PORT=5000
```

---

## Project Structure

```
ai-utility-platform/
├── backend/
│   ├── controllers/
│   │   ├── authController.js         # Register & login
│   │   ├── billController.js         # Bills, splits, predictions, AI insights
│   │   ├── householdController.js    # Household CRUD, invite, members, transfers
│   │   ├── paymentController.js      # Upload/approve/reject proofs with OCR
│   │   └── userController.js         # Profile updates
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT protect middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── bills.js
│   │   ├── households.js
│   │   ├── notifications.js
│   │   └── users.js
│   ├── services/
│   │   ├── ocrService.js             # Tesseract + pdf-parse + pdfjs-dist OCR pipeline
│   │   ├── reminderService.js        # node-cron deadline reminder scheduler
│   │   ├── anomalyService.js         # Anomaly detection helper
│   │   └── notificationService.js    # Notification helper utilities
│   ├── db.js                         # PostgreSQL connection pool
│   ├── init.sql                      # Base schema DDL
│   ├── migrate.js                    # Adds invite_code & notifications table
│   ├── migrate_rejection.js          # Adds rejection_reason to PaymentProofs
│   ├── migrate_usage.js              # Adds usage_value & usage_unit to Bills
│   ├── server.js                     # Express app, routes, cron init
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── AddBillModal.jsx      # Bill creation modal with custom splits
│       │   ├── MobileNav.jsx         # Bottom navigation for mobile
│       │   ├── NotificationBell.jsx  # Real-time notification dropdown
│       │   └── UsageInsights.jsx     # AI insight cards renderer
│       ├── pages/
│       │   ├── Landing.jsx           # Animated public landing page
│       │   ├── UserGuide.jsx         # Visual user guide with screenshots
│       │   ├── AboutUs.jsx           # About page
│       │   ├── Terms.jsx             # Terms & Conditions
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── ForgotPassword.jsx    # OTP request page
│       │   ├── VerifyOTP.jsx         # OTP verification and password reset
│       │   ├── Dashboard.jsx         # Homepage with charts, insights, predictions
│       │   ├── BillTracking.jsx      # Bills list, proof upload & review
│       │   ├── Household.jsx         # Member management & household settings
│       │   ├── AdminDashboard.jsx    # Complete admin control panel
│       │   └── Settings.jsx          # User profile & password change
│       ├── services/
│       │   └── api.js                # Axios instance + all API call exports
│       └── App.jsx                   # Router & route definitions
│
└── README.md
```

---

## Acknowledgements

- **Tesseract.js** — Open-source OCR in Node.js.
- **Recharts** — Beautiful composable charts for React.
- **Lucide React** — Clean, consistent SVG icon library.
- **node-cron** — Lightweight task scheduler for Node.js.
