# Ticpin — Full Stack Implementation Reference

This document covers everything implemented so far: backend API, frontend auth flow, organizer onboarding (setup), session/cookie security, and what remains to build.

---

## Project Structure

```
FinalTickpinDesgin/
├── Backend/          — Go Fiber v2 REST API
└── ticpindemo/       — Next.js 14 App Router frontend
```

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Go 1.22, Fiber v2, MongoDB, Cloudinary, JWT     |
| Frontend  | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Auth      | HttpOnly JWT cookie + readable session cookie   |
| Email     | Gmail SMTP via gomail (per-vertical inboxes)    |
| Storage   | Cloudinary (PAN card image/PDF upload)          |

---

## Environment Variables

### Backend (`Backend/.env`)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here

# Per-vertical SMTP senders
DINING_EMAIL=dining@yourdomain.com
DINING_APP_PASSWORD=gmail-app-password

EVENTS_EMAIL=events@yourdomain.com
EVENTS_APP_PASSWORD=gmail-app-password

PLAY_EMAIL=play@yourdomain.com
PLAY_APP_PASSWORD=gmail-app-password

SMTP_PORT=587

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (`ticpindemo/.env.local`)

```env
# next.config.ts already proxies /backend → backend server
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

---

## Backend — API Endpoints

### Auth — Cookie behaviour on VerifyOTP

On successful OTP verification, the backend sets **two cookies**:

| Cookie           | HttpOnly | Purpose                                          |
|------------------|----------|--------------------------------------------------|
| `ticpin_token`   | ✅ Yes   | Signed JWT — browser sends on every request; JS cannot read (XSS safe) |
| `ticpin_session` | ❌ No    | Base64 JSON — readable by JS for UI (non-sensitive: id, email, vertical, categoryStatus) |

Both cookies: `SameSite=Lax`, `Path=/`, `MaxAge=7 days`.

### Dining vertical — `/api/organizer/dining`

| Method | Path               | Auth | Description                                 |
|--------|--------------------|------|---------------------------------------------|
| POST   | `/login`           | —    | Existing organizer login → sends OTP        |
| POST   | `/signin`          | —    | New organizer signup → sends OTP            |
| POST   | `/verify`          | —    | Verify OTP → **sets auth cookies**          |
| POST   | `/setup`           | 🔒   | Save onboarding setup (PAN + bank + backup) |
| POST   | `/submit-verification` | 🔒 | Submit dining venue for admin review    |
| POST   | `/create`          | 🔒   | Create a dining listing                     |
| GET    | `/:organizer_id/list` | 🔒 | List organizer's dining entries            |
| PUT    | `/:id`             | 🔒   | Update a dining listing                     |
| DELETE | `/:id`             | 🔒   | Delete a dining listing                     |

### Events vertical — `/api/organizer/events`

| Method | Path               | Auth | Description                                 |
|--------|--------------------|------|---------------------------------------------|
| POST   | `/login`           | —    | Existing organizer login → sends OTP        |
| POST   | `/signin`          | —    | New organizer signup → sends OTP            |
| POST   | `/verify`          | —    | Verify OTP → **sets auth cookies**          |
| POST   | `/setup`           | 🔒   | Save onboarding setup                       |
| POST   | `/submit-verification` | 🔒 | Submit for admin review                 |
| POST   | `/create`          | 🔒   | Create an event listing                     |
| GET    | `/:organizer_id/list` | 🔒 | List organizer's events                    |
| PUT    | `/:id`             | 🔒   | Update an event                             |
| DELETE | `/:id`             | 🔒   | Delete an event                             |

### Play (Turf) vertical — `/api/organizer/play`

| Method | Path               | Auth | Description                                 |
|--------|--------------------|------|---------------------------------------------|
| POST   | `/login`           | —    | Existing organizer login → sends OTP        |
| POST   | `/signin`          | —    | New organizer signup → sends OTP            |
| POST   | `/verify`          | —    | Verify OTP → **sets auth cookies**          |
| POST   | `/setup`           | 🔒   | Save onboarding setup                       |
| POST   | `/submit-verification` | 🔒 | Submit for admin review                 |
| POST   | `/create`          | 🔒   | Create a play/turf listing                  |
| GET    | `/:organizer_id/list` | 🔒 | List organizer's play listings             |
| PUT    | `/:id`             | 🔒   | Update a play listing                       |
| DELETE | `/:id`             | 🔒   | Delete a play listing                       |

### Organizer (shared) — `/api/organizer`

| Method | Path                          | Auth | Description                                             |
|--------|-------------------------------|------|---------------------------------------------------------|
| GET    | `/:id/status`                 | 🔒   | Returns `{ categoryStatus: { dining: "pending", ... } }` |
| GET    | `/:id/existing-setup`         | 🔒   | Returns PAN + bank from any existing vertical setup (used for cross-vertical pre-fill) |
| POST   | `/upload-pan`                 | 🔒   | Multipart file upload → Cloudinary → returns `{ url }` |
| POST   | `/send-backup-otp`            | 🔒   | Send OTP to backup email address                        |
| POST   | `/verify-backup-otp`          | 🔒   | Verify backup email OTP                                 |
| POST   | `/logout`                     | —    | Expires both auth cookies                               |
| GET    | `/profile/:id`                | 🔒   | Get organizer profile                                   |
| POST   | `/profile`                    | 🔒   | Create organizer profile                                |
| PUT    | `/profile/:id`                | 🔒   | Update organizer profile                                |
| GET    | `/verification/:id`           | 🔒   | Get verification status record                          |

---

## Backend — Data Models

### `Organizer` (collection: `organizers`)

```go
ID                primitive.ObjectID
Name              string
Email             string
Password          string             // bcrypt hashed
OrganizerCategory []string
CategoryStatus    map[string]string  // { "dining": "pending", "events": "approved" }
OTP               string             // login OTP (hidden from JSON)
OTPExpiry         time.Time
BackupOTP         string             // backup email OTP (hidden from JSON)
BackupOTPExpiry   time.Time
IsVerified        bool
CreatedAt         time.Time
```

### `OrganizerSetup` (collection: `organizer_setups`)

One document per organizer per vertical. Upserted on setup submit.

```go
ID            primitive.ObjectID
OrganizerID   primitive.ObjectID
Category      string    // "dining" | "events" | "play"
OrgType       string    // "individual" | "company" | ...
Phone         string
BankAccountNo string
BankIfsc      string
BankName      string
AccountHolder string
GSTNumber     string
PAN           string
PANName       string    // Name on PAN card
PANDOB        string    // DOB on PAN card
PANCardURL    string    // Cloudinary URL
BackupEmail   string
BackupPhone   string
CreatedAt     time.Time
UpdatedAt     time.Time
```

### `OrganizerProfile` (collection: `organizer_profiles`)

```go
ID                primitive.ObjectID
OrganizerID       primitive.ObjectID
Name              string
Email             string
Phone             string
OrganizerCategory []string
Address           string
Country           string
State             string
District          string
ProfilePhoto      string
CreatedAt / UpdatedAt time.Time
```

---

## Backend — Key Service Logic

### `SaveSetup` — upsert without `createdAt` conflict

Uses explicit `bson.M` in `$set` (not struct) + `$setOnInsert` for `_id` and `createdAt`. Avoids MongoDB write conflict error: *"Updating the path 'createdAt' would create a conflict at 'createdAt'"*.

### `CheckPANDuplicate`

Before saving setup, queries `organizer_setups` for the same PAN belonging to a **different** organizer. Returns `pan_already_used` error if found.

### `GetExistingSetup`

Returns the first existing setup for any vertical for this organizer. Used on all 3 setup pages so that if an organizer already completed dining, their PAN + bank details are pre-filled (and locked) on events/play setup.

### `SendBackupOTP` / `VerifyBackupOTP`

Generates a 6-digit OTP, stores it with 10-min expiry on the organizer document, sends via the appropriate vertical email. On verify, clears the OTP from DB.

---

## Frontend — Page Flow

### Login / Signup

```
/list-your-dining/Login   → POST /api/organizer/dining/login  or /signin
/list-your-events/Login   → POST /api/organizer/events/login  or /signin
/list-your-play/Login     → POST /api/organizer/play/login    or /signin
```

- Login (existing account): sends OTP → redirects to OTP page
- Signin (new account): creates organizer + sends OTP → redirects to OTP page
- Error codes: `user_not_found` (404 on login), `email_exists` (400 on signin), `invalid_password`

### OTP Verification

```
/list-your-dining/otp?email=...
/list-your-events/otp?email=...
/list-your-play/otp?email=...
```

- Calls `POST /api/organizer/{vertical}/verify`
- Backend sets `ticpin_token` (HttpOnly) + `ticpin_session` (readable) cookies
- Frontend calls `saveOrganizerSession()` to fire `organizer-auth-change` event so Navbar re-renders
- If `categoryStatus[vertical]` exists → redirects to `/organizer/dashboard?category={vertical}`
- Otherwise → redirects to `/list-your-{vertical}/setup`

### Organizer Setup — 4 steps per vertical

```
Step 01 — /list-your-{vertical}/setup           — PAN card verification
Step 02 — /list-your-{vertical}/setup/bank      — Bank details
Step 03 — /list-your-{vertical}/setup/backup    — Backup contact (+ OTP verify)
Step 04 — /list-your-{vertical}/setup/agreement — Sign & submit
```

#### Step 01 — PAN card (setup/page.tsx)

- Calls `GET /api/organizer/:id/existing-setup` on mount
- If PAN already exists from another vertical → **pre-fills and locks** all PAN + bank fields
- Shows pre-fill lock banner
- Inputs: Org type, PAN number, Name on PAN, DOB on PAN, PAN card upload (image/PDF)
- PAN card file → `POST /api/organizer/upload-pan` → Cloudinary → stores URL in state
- Saves to sessionStorage key `setup_{vertical}` on Continue

#### Step 02 — Bank details (setup/bank/page.tsx)

- Calls `GET /api/organizer/:id/existing-setup` on mount **from backend**
- If bank exists → pre-fills and locks all 4 bank fields
- Inputs: Account holder, Account number, IFSC, Bank name
- On Continue → merges into `setup_{vertical}` sessionStorage

#### Step 03 — Backup contact (setup/backup/page.tsx)

- Validates backup email ≠ logged-in session email
- Calls `POST /api/organizer/send-backup-otp` → OTP sent to entered backup email
- 6-digit OTP entry → `POST /api/organizer/verify-backup-otp`
- On verified → saves `backupEmail` to sessionStorage, navigates to agreement

#### Step 04 — Agreement (setup/agreement/page.tsx)

- Reads full payload from `setup_{vertical}` sessionStorage
- Calls `POST /api/organizer/{vertical}/setup` with all fields:
  `organizerId, orgType, phone, pan, panName, panDOB, panCardUrl, bankAccountNo, bankIfsc, bankName, accountHolder, backupEmail, backupPhone`
- On `pan_already_used` error → shows "This PAN card is already registered by another account."
- On success → `updateSessionCategoryStatus(vertical, 'pending')` → clears sessionStorage → redirects to dashboard

---

## Frontend — Session / Auth

File: `src/lib/auth/organizer.ts`

Session moved from **localStorage → cookies** for security.

| Function                      | What it does                                                              |
|-------------------------------|---------------------------------------------------------------------------|
| `getOrganizerSession()`       | Reads `ticpin_session` cookie → `atob` → JSON parse → `OrganizerSession` |
| `saveOrganizerSession(s)`     | `btoa(JSON.stringify(s))` → writes `ticpin_session` cookie → fires `organizer-auth-change` event |
| `clearOrganizerSession()`     | Calls `POST /backend/api/organizer/logout` (clears HttpOnly cookie) + deletes both cookies + wipes all `setup_*` sessionStorage keys |
| `updateSessionCategoryStatus` | Patches `categoryStatus` inside the session cookie                        |
| `isAdminCredentials`          | Checks hardcoded admin email/password                                     |

### Cookie details

```
ticpin_token   — HttpOnly=true,  SameSite=Lax, MaxAge=7d  — JWT, not readable by JS
ticpin_session — HttpOnly=false, SameSite=Lax, MaxAge=7d  — base64 JSON, readable by JS for UI
```

### SessionStorage keys (auto-wiped on logout)

```
setup_dining      — multi-step form accumulator for dining setup
setup_events      — multi-step form accumulator for events setup
setup_play        — multi-step form accumulator for play/turf setup
setup_dining_KEY  — legacy key (also cleared)
setup_events_KEY  — legacy key (also cleared)
setup_play_KEY    — legacy key (also cleared)
```

---

## Frontend — API Lib

All fetch calls include `credentials: 'include'` so cookies are sent with every request.

| File                       | Exports                                           |
|----------------------------|---------------------------------------------------|
| `src/lib/api/dining.ts`    | `diningApi` — login, signin, verifyOTP, setup     |
| `src/lib/api/events.ts`    | `eventsApi` — same, re-exports `SetupPayload`     |
| `src/lib/api/play.ts`      | `playApi` — same, re-exports `SetupPayload`       |
| `src/lib/api/organizer.ts` | `organizerApi` — getStatus, getExistingSetup, uploadPAN, sendBackupOTP, verifyBackupOTP, getProfile, createProfile, updateProfile |

### `SetupPayload` fields

```typescript
organizerId, orgType, phone,
pan?, panName?, panDOB?, panCardUrl?,
bankAccountNo?, bankIfsc?, bankName?, accountHolder?,
gstNumber?, backupEmail?, backupPhone?
```

---

## Organizer Dashboard (existing)

```
/organizer/dashboard?category=dining|events|play
```

Shows per-category status from `categoryStatus` in session cookie:
- `pending` — submitted, awaiting admin review
- `approved` — active
- `rejected` — needs resubmission

---

## Remaining Tasks — TODO

### Backend

- [ ] **JWT middleware** — protect all `🔒` routes by validating `ticpin_token` cookie; return 401 if missing/expired
- [ ] **Admin panel API** — list all organizers, approve/reject a category setup
  - `GET /api/admin/organizers` — list all with pagination
  - `PUT /api/admin/organizer/:id/status` — set `categoryStatus.{category}` = `approved` / `rejected`
  - `GET /api/admin/organizer/:id` — full profile + all setups
- [ ] **Update category status cookie on approval** — after admin approves, organizer's next API call should refresh their `ticpin_session` cookie or organizer must re-login
- [ ] **Refresh endpoint** — `GET /api/organizer/me` — validates JWT, returns fresh session info (so frontend can refresh cookie after status change)

### Frontend — Organizer Profile page

```
/organizer/profile
```

- [ ] Fetch profile from `GET /api/organizer/profile/:id`
- [ ] Show: name, email, phone, address, country, state, district, profile photo
- [ ] Edit form → `PUT /api/organizer/profile/:id`
- [ ] Profile photo upload → Cloudinary (reuse `uploadPAN` pattern or add dedicated endpoint)

### Frontend — Account Review page

```
/organizer/dashboard  (partially done — needs review status UI)
```

- [ ] Per-category status card:
  - `pending` — "Your {vertical} account is under review" (yellow badge)
  - `approved` — "Active — you can create listings" (green badge) + link to create listing
  - `rejected` — "Rejected — reason: {reason}" (red badge) + "Resubmit" button
- [ ] Poll or refetch `GET /api/organizer/:id/status` on page load to show latest status
- [ ] On `approved` → show listing management buttons (Create, Edit, Delete)

### Frontend — Create Listing pages

```
/list-your-dining/create
/list-your-events/create
/list-your-play/create
```

- [ ] Only accessible if `categoryStatus[vertical] === 'approved'`
- [ ] Form → `POST /api/organizer/{vertical}/create`
- [ ] Listing management (edit/delete) → list page + actions

### Frontend — Admin Panel

```
/admin  (existing, needs backend wiring)
```

- [ ] `GET /api/admin/organizers` → show table of all organizers + category statuses
- [ ] Approve / Reject buttons per category → `PUT /api/admin/organizer/:id/status`
- [ ] View organizer details + uploaded PAN card image
- [ ] Push notifications page
- [ ] Offers management page

### Security / Production checklist

- [ ] Set `JWT_SECRET` to a strong random value in production `.env`
- [ ] Add `Secure` flag to cookies when behind HTTPS (update `SetAuthCookies` in `config/jwt.go`)
- [ ] Rate-limit OTP endpoints (e.g. max 5 requests/15 min per IP)
- [ ] Validate JWT on every protected route via middleware
- [ ] Add CORS config in `main.go` restricting origin to production domain

---

## Running Locally

### Backend

```bash
cd Backend
cp .env.example .env   # fill in env vars
go run main.go         # runs on :8080
```

### Frontend

```bash
cd ticpindemo
pnpm install
pnpm dev               # runs on :3000
# next.config.ts rewrites /backend/* → http://localhost:8080/*
```
