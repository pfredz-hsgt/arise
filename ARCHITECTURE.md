# ARISE â€” Architecture Documentation
`AGILE RESTOCK INVENTORY SURVEILLANCE ENGINE`

> **ARISE** (Automated Requisition & Inventory System for Emergency Pharmacy)
> Emergency Pharmacy Hospital Segamat â€” Pharmacy Inventory Management System

---

## Table of Contents

1. [Technology View](#1-technology-view)
2. [Process Workflow](#2-process-workflow)
3. [Application Structure View](#3-application-structure-view)
4. [Business Hierarchy](#4-business-hierarchy)
5. [List of Modules and Their Functions](#5-list-of-modules-and-their-functions)

---

## 1. Technology View

ARISE is a full-stack monorepo web application composed of a **React/Vite frontend**, a **Node.js/Express REST API backend**, and a **PostgreSQL relational database**. In production it is served via PM2 and Apache2 as a reverse proxy.

```mermaid
graph TD
    subgraph Client["Browser (Client)"]
        React["React 18 SPA<br/>(Vite + React Router v7)"]
        AntD["UI: Ant Design 6<br/>+ Phosphor Icons"]
        FetchAPI["HTTP: Fetch API<br/>(src/lib/api.js)"]
    end

    subgraph Backend["Node.js Backend (Express 4)"]
        Server["server.js<br/>:3005"]
        Auth["JWT Auth<br/>(bcrypt + jsonwebtoken)"]
        Routes["REST API Routes"]
        Playwright["Browser Automation<br/>(Playwright / Chromium)"]
        Mailer["Email<br/>(Nodemailer + SMTP)"]
        Multer["File Uploads<br/>(Multer)"]
    end

    subgraph DB["Data Layer"]
        PG["PostgreSQL<br/>(pg driver)"]
        Schema["6 Core Tables<br/>+ Triggers + Indexes"]
    end

    subgraph External["External Systems"]
        PhIS["PhIS Hospital System<br/>10.77.232.70:8080"]
        SMTP["SMTP Mail Server"]
    end

    subgraph Infra["Production Infrastructure"]
        PM2["PM2 Process Manager"]
        Apache2["Apache2 Reverse Proxy<br/>/arise/api â†’ :3005"]
        Dist["Static dist/ (Vite build)"]
    end

    React -- "REST (Bearer JWT)" --> Server
    FetchAPI --> Server
    Server --> Auth
    Server --> Routes
    Routes --> PG
    Routes --> Playwright
    Playwright --> PhIS
    Auth --> Mailer
    Mailer --> SMTP
    Routes --> Multer
    PM2 --> Server
    Apache2 --> PM2
    Apache2 --> Dist
```

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.3 |
| Build Tool | Vite | 7.x |
| Routing | React Router DOM | 7.10 |
| UI Component Library | Ant Design | 6.x |
| Icon Libraries | Phosphor Icons, Ant Design Icons | latest |
| HTTP Client | Fetch API (custom wrapper) | native |
| Date Handling | Day.js | 1.11 |
| PDF Export | jsPDF + jspdf-autotable | 3.x / 5.x |
| Excel Export | xlsx (SheetJS) | 0.18 |
| Backend Runtime | Node.js (ESM) | â€” |
| Backend Framework | Express | 4.x |
| Authentication | JWT (jsonwebtoken) + bcrypt | â€” |
| Database Driver | node-postgres (pg) | 8.x |
| File Upload | Multer | 1.x |
| Email | Nodemailer | 8.x |
| Browser Automation | Playwright (Chromium) | 1.61 |
| Database | PostgreSQL | â€” |
| Process Manager | PM2 | â€” |
| Dev Tooling | nodemon, concurrently | â€” |

---

## 2. Process Workflow

### 2.1 â€” Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as PostgreSQL

    User->>FE: Visit /login
    FE->>BE: POST /api/auth/login {email, password}
    BE->>DB: SELECT user WHERE email
    DB-->>BE: user record + password_hash
    BE->>BE: bcrypt.compare(password, hash)
    alt Valid password
        BE->>BE: jwt.sign({id, email, role, name})
        BE-->>FE: {token, user, requiresPasswordChange}
        FE->>FE: localStorage.setItem(token)
        FE->>User: Redirect to /home
    else Invalid
        BE-->>FE: 401 Invalid credentials
        FE->>User: Show error message
    end
    Note over FE,BE: Subsequent requests attach Bearer token
```

### 2.2 â€” Routine Indent Workflow

```mermaid
flowchart TD
    A([Indenter opens Routine Indent Page]) --> B[Select RAK / Shelf from dropdown]
    B --> C[Browse inventory filtered by OPD Substor]
    C --> D{Item already in session?}
    D -- No --> E[Set quantity + remarks and click Add]
    D -- Yes --> F[Edit existing session item]
    E --> G[Item saved to indent_items table]
    F --> G
    G --> H[Review Routine Summary Page]
    H --> I{Ready to submit?}
    I -- No --> C
    I -- Yes --> J[Update indent_sessions status to Submitted]
    J --> K([Session appears in Issuer Cart])
    K --> L{Issuer reviews cart}
    L -- Reject --> M[Issuer removes item from cart]
    L -- Approve --> N[Issuer runs PhIS Indent automation]
    N --> O[Playwright opens PhIS in headless Chromium]
    O --> P[Logs streamed in real-time to Issuer UI]
    P --> Q{Automation succeeds?}
    Q -- Yes --> R[indent_session status set to Approved]
    Q -- Error --> S[Skipped items reported in log stream]
```

### 2.3 â€” Ad-Hoc Indent Workflow

```mermaid
flowchart TD
    A([Indenter opens Indent Page]) --> B[Search for drug by name]
    B --> C[Select drug and enter quantity]
    C --> D["POST /api/indents with status = Pending"]
    D --> D2{Add another item?}
    D2 -- Yes --> B
    D2 -- No --> E[Item appears in Issuer Cart]
    E --> F{Issuer action}
    F -- Approve --> G["PUT /api/indents/:id status = Approved"]
    F -- Complete --> H["PUT /api/indents/:id status = Completed"]
    F -- Delete --> I["DELETE /api/indents/:id"]
    G --> J([Record visible in Indent List Page])
    H --> J
```

### 2.4 â€” Short Expiry Tracking Workflow

```mermaid
flowchart TD
    A([Indenter opens Short Exp Page]) --> B[View items with batch data]
    B --> C{Add or Edit entry?}
    C -- Yes --> D[Open ShortExpEntry form]
    D --> E[Enter batch no, exp date, qty]
    E --> F["PUT /api/indent_items/:id with batch fields"]
    F --> G[Data saved in indent_items table]
    G --> H[Issuer reviews KEWPS6 records]
    H --> I["GET /api/kewps6 joined with inventory"]
    I --> J[Update monthly qty columns qty_1m to qty_6m]
    J --> K["POST /api/shortexp/remark upsert kewps6_records"]
```

### 2.5 â€” PhIS Automation Process

```mermaid
sequenceDiagram
    participant FE as CartPage (Issuer)
    participant BE as "Express /indents/phis-indent"
    participant PW as Playwright (Chromium)
    participant PH as PhIS System

    FE->>BE: POST /api/indents/phis-indent {items, username, password, sessionId}
    BE->>BE: Register activePhisProcesses[sessionId]
    BE->>PW: runPhisIndent(items, options)
    PW->>PH: Navigate to login.zul
    PW->>PH: Fill credentials and select location
    PW->>PH: Login and navigate to Intra Facility Sent
    PW->>PH: Create New Indent, Select OUTPATIENT PHARMACY SUBSTORE
    loop For each item
        PW->>PH: Search by drug code
        PH-->>PW: Drug results list
        PW->>PH: Double-click to select drug
        PW->>PH: Enter requested_qty
        PW->>PH: Save and Confirm
        PH-->>PW: Warning or Error dialogs handled
    end
    PW->>PH: Save Indent, Send for Approval, Approve
    PH-->>PW: Indent Number and Date
    PW-->>BE: logCallback stream chunked
    BE-->>FE: Transfer-Encoding chunked real-time log lines
    Note over FE: Displays streaming log to Issuer UI
```

---

## 3. Application Structure View

```mermaid
graph TD
    subgraph Root["arise/ Monorepo Root"]
        PKG["package.json<br/>concurrently dev server + Vite"]
        VITE["vite.config.js"]
        IDX["index.html"]
        ECO["ecosystem.config.cjs<br/>PM2 production"]
    end

    subgraph FE["src/ React Frontend"]
        MAIN["main.jsx<br/>App entry HashRouter"]
        APP["App.jsx<br/>Routes + AuthProvider + ConfigProvider"]

        subgraph CTX["contexts/"]
            ACTX["AuthContext.jsx<br/>useAuth hook login/logout/profile"]
        end

        subgraph LIB["lib/"]
            API["api.js<br/>fetch wrapper JWT injection"]
            COLOR["colorMappings.js<br/>drug type color config"]
        end

        subgraph COMP["components/"]
            LAYOUT["Layout/MainLayout.jsx<br/>Sidebar Header Navigation"]
            DC["DrugCard.jsx and DrugCard2.jsx<br/>Drug item display cards"]
            DBI["DebouncedSearchInput.jsx"]
            CDI["CustomDateInput.jsx"]
        end

        subgraph PAGES["pages/"]
            AUTH_P["Auth/<br/>LoginPage.jsx<br/>ResetPasswordPage.jsx"]
            HOME_P["Home/<br/>HomePage.jsx"]
            INDENT_P["Indent/<br/>IndentPage.jsx<br/>IndentModal.jsx<br/>RoutineIndentPage.jsx<br/>RoutineSummaryPage.jsx"]
            CART_P["Cart/<br/>CartPage.jsx<br/>IndentListPage.jsx<br/>IndentRecordPage.jsx"]
            SHORT_P["Shortexp/<br/>ShortExpPage.jsx<br/>ShortExpEntry.jsx"]
            ADMIN_P["Admin/<br/>AdminMenu.jsx<br/>InventoryTable.jsx"]
        end
    end

    subgraph BE["backend/ Express API"]
        SRV["server.js<br/>Express app CORS middleware"]
        DBJ["db.js<br/>pg Pool connection"]
        SCHEMA["schema.sql<br/>DDL 6 tables + triggers"]

        subgraph ROUTES["routes/"]
            R_AUTH["auth.js<br/>/api/auth"]
            R_INV["inventory.js<br/>/api/inventory"]
            R_IND["indents.js<br/>/api/indents"]
            R_SES["indent_sessions.js<br/>/api/indent_sessions"]
            R_ITM["indent_items.js<br/>/api/indent_items"]
            R_SE["shortexp.js<br/>/api/shortexp"]
            R_K6["kewps6.js<br/>/api/kewps6"]
        end

        subgraph UTILS["utils/"]
            PHIS["phis_indent.js<br/>Playwright automation"]
        end
    end

    subgraph PGDB["PostgreSQL Database"]
        PG_DB["PostgreSQL
schema.sql â€” 6 tables + triggers"]
    end

    MAIN --> APP
    APP --> ACTX
    APP --> LAYOUT
    LAYOUT --> PAGES
    PAGES --> API
    API -- "HTTP REST" --> SRV
    SRV --> ROUTES
    ROUTES --> DBJ
    DBJ --> PG_DB
    R_IND --> PHIS
```

---

## 4. Business Hierarchy

### 4.1 â€” User Role Hierarchy

```mermaid
graph TD
    SYS["ARISE System"]
    SYS --> ISSUER["Issuer<br/>Pharmacy Staff / Admin"]
    SYS --> INDENTER["Indenter<br/>Counter / Ward Staff"]

    ISSUER --> I1["View Issuer Cart<br/>all submitted indents"]
    ISSUER --> I2["Approve / Complete<br/>Ad-Hoc Requests"]
    ISSUER --> I3["Run PhIS Indent<br/>Automation"]
    ISSUER --> I4["Manage Users<br/>create, edit, delete"]
    ISSUER --> I5["Manage Inventory<br/>CRUD + image upload"]
    ISSUER --> I6["View Indent Records<br/>history + export PDF/Excel"]
    ISSUER --> I7["Access Admin Menu"]
    ISSUER --> I8["View KEWPS6<br/>Short Expiry Report"]

    INDENTER --> D1["Create Ad-Hoc<br/>Indent Requests"]
    INDENTER --> D2["Create Routine<br/>Indent Sessions"]
    INDENTER --> D3["Track Short Expiry Items"]
    INDENTER --> D4["View Own Indent History"]
    INDENTER --> D5["Manage Own Profile<br/>name, PHIS credentials"]
```

### 4.2 â€” Data Entity Relationship Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text email
        text password_hash
        text role
        text phis_username
        text phis_password
        boolean must_change_password
        timestamptz created_at
        timestamptz updated_at
    }

    inventory_items {
        uuid id PK
        text name
        text item_code
        text pku
        text puchase_type
        text std_kt
        text row
        integer max_qty
        integer balance
        text indent_source
        text type
        boolean is_short_exp
        date short_exp
        text image_url
        timestamptz created_at
        timestamptz updated_at
    }

    indent_sessions {
        uuid id PK
        uuid user_id FK
        text session_type
        text status
        text rak
        timestamptz created_at
        timestamptz updated_at
    }

    indent_items {
        uuid id PK
        uuid session_id FK
        uuid item_id FK
        integer requested_qty
        text indent_remarks
        integer snapshot_max_qty
        integer snapshot_balance
        text batch_no_1
        date exp_date_1
        integer short_qty_1
        text batch_no_2
        date exp_date_2
        integer short_qty_2
        timestamptz created_at
        timestamptz updated_at
    }

    indent_requests {
        uuid id PK
        uuid user_id FK
        uuid item_id FK
        text requested_qty
        text status
        text indent_remarks
        integer snapshot_max_qty
        integer snapshot_balance
        timestamptz created_at
        timestamptz updated_at
    }

    kewps6_records {
        uuid id PK
        uuid item_id FK
        text batch_no
        date exp_date
        text se_remarks
        integer qty_1m
        integer qty_2m
        integer qty_3m
        integer qty_4m
        integer qty_5m
        integer qty_6m
        timestamptz created_at
        timestamptz updated_at
    }

    users ||--o{ indent_sessions : "creates"
    users ||--o{ indent_requests : "submits"
    indent_sessions ||--o{ indent_items : "contains"
    inventory_items ||--o{ indent_items : "referenced by"
    inventory_items ||--o{ indent_requests : "referenced by"
    inventory_items ||--o{ kewps6_records : "tracked in"
```

---

## 5. List of Modules and Their Functions

### 5.1 â€” Frontend Modules

#### `src/main.jsx`
Entry point. Bootstraps the React app inside `<HashRouter>`.

#### `src/App.jsx`
- Defines all application routes via `<Routes>`.
- Wraps app in `<AuthProvider>` and Ant Design `<ConfigProvider>`.
- Implements `<ProtectedRoute>` â€” redirects unauthenticated users to `/login` and enforces Issuer-only routes via `requireIssuer` prop.

#### `src/contexts/AuthContext.jsx`
Global authentication state manager (React Context).

| Function | Description |
|----------|-------------|
| `login(email, password)` | Calls `POST /auth/login`, stores JWT in localStorage, sets user state |
| `signOut()` | Clears token and user state |
| `resetPassword(email)` | Calls `POST /auth/reset-password` to trigger temp password email |
| `changePassword(newPassword)` | Calls `POST /auth/change-password` for logged-in user |
| `updateProfile(values)` | Calls `PUT /auth/profile`, merges returned user data into state |
| `fetchProfile()` | Calls `GET /auth/me` to restore session on page load |
| `isIssuer` | Computed boolean: `user.role === 'Issuer'` |
| `isIndenter` | Computed boolean: `user.role === 'Indenter'` |

#### `src/lib/api.js`
Thin `fetch` wrapper that:
- Injects `Authorization: Bearer <token>` on every request.
- Handles `Content-Type: application/json` vs `FormData` automatically.
- Throws descriptive errors on non-OK responses.
- Dev base URL: `http://localhost:3005/api` | Prod: `/arise/api`

#### `src/lib/colorMappings.js`
Maps drug `type` values (OPD, DDA, Injection, etc.) to Ant Design color tokens for DrugCard rendering.

#### `src/components/Layout/MainLayout.jsx`
Application shell using Ant Design `<Layout>`.
- Collapsible sidebar with role-aware navigation (Cart and Admin visible to Issuers only).
- User avatar dropdown: Profile edit, Change Password, PhIS credentials, Logout.
- Forces password-change modal if `user.requiresPasswordChange` is true.

#### `src/components/DrugCard.jsx` / `DrugCard2.jsx`
Reusable drug item display cards. Renders drug name, type badge (color-coded), current balance, max qty, and an action button (Add to Indent / Add to Session).

#### `src/components/DebouncedSearchInput.jsx`
Input with configurable debounce delay to reduce API calls while the user types.

#### `src/components/CustomDateInput.jsx`
Lightweight custom date input wrapping the native HTML date input for form use.

---

#### Page Modules

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| `LoginPage.jsx` | `/login` | Public | Email/password login form; password reset trigger |
| `ResetPasswordPage.jsx` | `/reset-password` | Public | Landing page after password reset email |
| `HomePage.jsx` | `/home` | Both | Dashboard; shows active draft sessions; draft cleanup utility |
| `IndentPage.jsx` | `/indent` | Both | Browse inventory by source/type; opens IndentModal to create ad-hoc requests |
| `IndentModal.jsx` | (modal) | Both | Modal for entering quantity + remarks for a selected drug; POSTs to indent_requests |
| `RoutineIndentPage.jsx` | `/routine-indent` | Both | Select RAK, add/edit items within a routine indent session |
| `RoutineSummaryPage.jsx` | `/routine-summary` | Both | Review and submit the complete routine indent session to Issuer |
| `CartPage.jsx` | `/cart` | Issuer only | View all pending sessions and ad-hoc requests; trigger PhIS automation with live log streaming; PDF/Excel export |
| `IndentRecordPage.jsx` | `/indent-list` | Both | View and filter Approved/Completed indent records; export to PDF |
| `ShortExpPage.jsx` | `/shortexp` | Both | List all drug entries with short-expiry batch data recorded |
| `ShortExpEntry.jsx` | `/shortexp-entry` | Both | Add/edit batch number, expiry date, and qty for short-expiry tracking |
| `AdminMenu.jsx` | `/admin` | Issuer only | User management: create, edit role, assign PhIS credentials, delete |
| `InventoryTable.jsx` | `/admin` (tab) | Issuer only | Full inventory CRUD with image upload; filter by indent_source, type, search |

---

### 5.2 â€” Backend Modules

#### `backend/server.js`
Express application entry point.
- Configures CORS and JSON body parser middleware.
- Serves uploaded files as static assets from `/uploads`.
- Mounts all 7 route modules.
- Provides a health check endpoint at `GET /api/health`.
- Global error-handling middleware (500 fallback).
- Listens on `PORT` env variable (default: 3005).

#### `backend/db.js`
Exports a `pg.Pool` instance for PostgreSQL connections using `DATABASE_URL` from `.env`.

---

#### `backend/routes/auth.js` â€” `/api/auth`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/register` | POST | No | Create user with bcrypt-hashed password; returns new user record |
| `/login` | POST | No | Validate credentials + temp password; issue JWT (1 day expiry) |
| `/reset-password` | POST | No | Generate random temp password; send via Nodemailer SMTP |
| `/change-password` | POST | JWT | Hash and save new password; clear temp_password_hash |
| `/profile` | PUT | JWT | Update name, phis_username, phis_password for logged-in user |
| `/me` | GET | JWT | Return full profile of logged-in user |
| `/users` | GET | JWT | List all users for Admin panel |
| `/users/:id` | PUT | JWT | Admin: update any user's fields |
| `/users/:id` | DELETE | JWT | Admin: delete user by ID |
| `authenticateToken` | Middleware | â€” | Exported JWT verification middleware used across all routes |

---

#### `backend/routes/inventory.js` â€” `/api/inventory`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/` | GET | JWT | List inventory; supports `indent_source`, `row`, `search` query filters |
| `/raks` | GET | JWT | Get distinct shelf row values for OPD Substor |
| `/:id` | GET | JWT | Fetch single inventory item |
| `/` | POST | JWT | Create inventory item; supports optional image upload via Multer |
| `/:id` | PUT | JWT | Update inventory item; supports optional image replacement |
| `/:id` | DELETE | JWT | Delete inventory item |

---

#### `backend/routes/indents.js` â€” `/api/indents`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/` | GET | JWT | List all indent_requests joined with inventory details |
| `/` | POST | JWT | Create ad-hoc indent request (status: Pending) |
| `/:id` | PUT | JWT | Update request status or quantity |
| `/:id` | DELETE | JWT | Delete indent request |
| `/cart` | GET | JWT | Issuer Cart: all Submitted sessions + Pending requests with user + inventory data |
| `/records` | GET | JWT | History view: Submitted/Approved/Completed sessions and Approved/Completed requests |
| `/approved` | GET | JWT | Get approved requests within a date range |
| `/approved-dates` | GET | JWT | Get all unique approval timestamps |
| `/batch-update` | POST | JWT | Batch update status for multiple requests by ID array |
| `/phis-indent` | POST | JWT | Trigger PhIS automation; streams log output as chunked text response |
| `/abort-phis-indent` | POST | JWT | Abort an in-progress PhIS session by sessionId |

---

#### `backend/routes/indent_sessions.js` â€” `/api/indent_sessions`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/draft` | GET | JWT | Get latest Draft session for user filtered by session_type |
| `/` | POST | JWT | Create a new indent session (with session_type, status, rak) |
| `/:id` | PUT | JWT | Update session rak or status |
| `/delete-batch` | POST | JWT | Delete multiple sessions by ID array (bulk draft cleanup) |
| `/drafts/cleanup` | DELETE | JWT | Remove all Draft sessions of a given session_type for the user |

---

#### `backend/routes/indent_items.js` â€” `/api/indent_items`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/` | GET | JWT | List items by session_id or multiple session_ids; optional item_id filter |
| `/shortexp/:item_id` | GET | JWT | Get latest short-expiry record (batch fields populated) for an item |
| `/` | POST | JWT | Add drug line to a session with qty, remarks, and batch/expiry fields |
| `/:id` | PUT | JWT | Update item qty, remarks, and all batch/expiry fields |
| `/:id` | DELETE | JWT | Remove a single item from a session |
| `/delete-batch` | POST | JWT | Remove all items belonging to given session_ids |

---

#### `backend/routes/shortexp.js` â€” `/api/shortexp`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/` | GET | JWT | Return indent_items with batch data + all kewps6_records |
| `/remark` | POST | JWT | Upsert (insert or update) a KEWPS6 record for a given item + batch combination |

---

#### `backend/routes/kewps6.js` â€” `/api/kewps6`

| Endpoint | Method | Auth | Function |
|----------|--------|------|----------|
| `/` | GET | JWT | List all KEWPS6 records joined with inventory_items, sorted by exp_date ASC |
| `/:id` | PUT | JWT | Dynamically update any set of fields on a KEWPS6 record |

---

### 5.3 â€” Utility Modules

#### `backend/utils/phis_indent.js` â€” `runPhisIndent(items, options)`

Playwright Chromium automation engine that performs the full indent lifecycle in the PhIS hospital system:

1. Launches headless Chromium browser.
2. Navigates to PhIS login at `http://10.77.232.70:8080/iphis/login.zul`.
3. Fills user credentials and selects `Outpatient Pharmacy Counter` location.
4. Navigates: Inventory â†’ Inventory Management â†’ Distribution â†’ Indent â†’ Intra Facility (Sent).
5. Creates a new indent directed to `OUTPATIENT PHARMACY SUBSTORE`.
6. For each drug item: searches by `item_code`, double-clicks result, sets `requested_qty`, saves with Yes confirmation.
7. Handles edge cases: item not found (skip + log), max qty exceeded (skip + log), back-order warning (acknowledge + continue).
8. After all items: saves indent, sends for approval, and approves â€” retrieving the final Indent Number and Date.
9. All progress is streamed in real-time via `logCallback` back to the Express chunked response.
10. Supports graceful abort mid-run via `options.isAborted` flag and `options.browser.close()`.

---

### 5.4 â€” Database Schema Summary

| Table | Status Lifecycle | Purpose |
|-------|-----------------|---------|
| `users` | â€” | System users with role (Issuer/Indenter) and stored PhIS credentials |
| `inventory_items` | â€” | Master drug/item catalogue: balance, max qty, indent source, expiry flags, image |
| `indent_sessions` | Draft â†’ Submitted â†’ Approved | Groups drug lines into a routine indent batch per user |
| `indent_items` | â€” | Individual drug lines within a session; also stores short-expiry batch data |
| `indent_requests` | Pending â†’ Approved â†’ Completed | Ad-hoc single-drug requests outside sessions |
| `kewps6_records` | â€” | Monthly short-expiry quantity tracking (KEWPS6 government form) per drug/batch |

All tables have `created_at` and `updated_at` timestamp columns managed by PostgreSQL triggers.

**Indent Source Values:** OPD Kaunter, OPD Substor, IPD Kaunter, MNF Substor, MNF Eksternal, MNF Internal, Prepacking, IPD Substor, HPSF Muar

**Drug Type Values:** OPD, Eye/Ear/Nose/Inh, DDA, External, Injection, Syrup, Others, UOD, Non-Drug

---

*Generated by Antigravity â€” ARISE Architecture Analysis*
