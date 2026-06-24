# 🌐 Route 53 Clone — AWS DNS Management Console

A full-stack clone of the **Amazon Route 53** DNS management console, built with **Next.js 16** (React 19) on the frontend and **FastAPI** (Python) on the backend. Features a pixel-accurate AWS Cloudscape Design System UI, complete CRUD for hosted zones and DNS records, JWT-based authentication, and interactive API documentation.

---

## 📋 Table of Contents

- [Setup Instructions](#-setup-instructions)
- [Architecture Overview](#-architecture-overview)
- [Database Schema](#-database-schema)
- [API Overview](#-api-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)

---

## 🚀 Setup Instructions

### Prerequisites

- **Python 3.10+** and `pip`
- **Node.js 18+** and `npm`
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "amazon route53 clone"
```

### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server (auto-creates SQLite DB and seeds admin user)
uvicorn main:app --reload
```

The backend starts at **http://localhost:8000**.

> **Seeded credentials:** `admin` / `admin123`

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The frontend starts at **http://localhost:3000**.

### 4. Open the App

Navigate to **http://localhost:3000** → you'll be redirected to the login page.
Sign in with `admin` / `admin123`.

---

## 🏗 Architecture Overview

```
┌─────────────────────┐          ┌─────────────────────┐          ┌──────────────┐
│                     │  HTTP    │                     │  SQL     │              │
│   Next.js 16        │◄────────►│   FastAPI            │◄────────►│   SQLite     │
│   (React 19)        │  :3000   │   (Python)           │          │   route53.db │
│                     │          │                     │  :8000   │              │
│  • Cloudscape UI    │          │  • JWT Auth (cookie) │          │  • Users     │
│  • Client-side SPA  │          │  • RESTful CRUD      │          │  • Zones     │
│  • AuthGuard        │          │  • Pydantic schemas   │          │  • Records   │
│  • Notifications    │          │  • Auto-seeding       │          │              │
└─────────────────────┘          └─────────────────────┘          └──────────────┘
```

### Request Flow

1. **Browser** → Next.js dev server at `:3000` serves the React SPA
2. **React app** → makes fetch calls to FastAPI at `:8000` with `credentials: 'include'`
3. **FastAPI** → authenticates via `httpOnly` JWT cookie, queries SQLite via SQLAlchemy ORM
4. **Response** → JSON data flows back through the same path

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Cloudscape Design System** | Matches the real AWS console look and feel |
| **SQLite** | Zero-config database, perfect for a self-contained demo |
| **httpOnly JWT cookies** | Secure session management without exposing tokens to JavaScript |
| **Server-side search/filter/pagination** | All list endpoints support `search`, `type` filter, and `page`/`limit` params |

---

## 🗄 Database Schema

The application uses **SQLite** with **SQLAlchemy ORM**. The database file (`route53.db`) is auto-created on first run.

### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, auto-increment | Unique user ID |
| `username` | VARCHAR | UNIQUE, NOT NULL, indexed | Login username |
| `password_hash` | VARCHAR | NOT NULL | bcrypt-hashed password |
| `created_at` | DATETIME | NOT NULL, default=now | Account creation timestamp |

### `hosted_zones`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, auto-increment | Unique zone ID |
| `user_id` | INTEGER | FK → `users.id`, NOT NULL, indexed | Owner of the zone |
| `domain_name` | VARCHAR | NOT NULL, indexed | Domain name (e.g. `example.com`) |
| `zone_type` | ENUM(`Public`, `Private`) | NOT NULL, default=`Public` | Zone visibility type |
| `comment` | VARCHAR | nullable | Optional description |
| `created_at` | DATETIME | NOT NULL, default=now | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, auto-updated | Last modification timestamp |

### `records`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, auto-increment | Unique record ID |
| `hosted_zone_id` | INTEGER | FK → `hosted_zones.id` (CASCADE), NOT NULL, indexed | Parent zone |
| `name` | VARCHAR | NOT NULL | Record name (e.g. `www.example.com`) |
| `record_type` | ENUM(`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `PTR`, `SRV`, `CAA`) | NOT NULL | DNS record type |
| `value` | VARCHAR | NOT NULL | Record value (IP, hostname, etc.) |
| `ttl` | INTEGER | NOT NULL, default=300 | Time to live in seconds |
| `priority` | INTEGER | nullable | Priority (used for MX/SRV records) |
| `created_at` | DATETIME | NOT NULL, default=now | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, auto-updated | Last modification timestamp |

### Relationships

```
Users (1) ──────── (N) Hosted Zones (1) ──────── (N) Records
         has many                     has many
                                      CASCADE DELETE
```

- A **User** has many **Hosted Zones** (cascade delete)
- A **Hosted Zone** has many **Records** (cascade delete — deleting a zone removes all its records)

---

## 📡 API Overview

Base URL: `http://localhost:8000`

Interactive API docs: **http://localhost:8000/docs** (Swagger UI)

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login with username/password → sets `httpOnly` JWT cookie |
| `POST` | `/auth/logout` | Clears the authentication cookie |
| `GET` | `/auth/me` | Returns the currently authenticated user |

### Hosted Zones

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/zones` | List all zones (supports `search`, `page`, `limit` query params) |
| `GET` | `/zones/{id}` | Get a single zone by ID |
| `POST` | `/zones` | Create a new hosted zone |
| `PUT` | `/zones/{id}` | Update a hosted zone |
| `DELETE` | `/zones/{id}` | Delete a hosted zone and all its records |

### DNS Records

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/zones/{zone_id}/records` | List records (supports `search`, `type`, `page`, `limit`) |
| `POST` | `/zones/{zone_id}/records` | Create a new DNS record |
| `PUT` | `/zones/{zone_id}/records/{id}` | Update a DNS record |
| `DELETE` | `/zones/{zone_id}/records/{id}` | Delete a DNS record |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check endpoint |

> **Note:** All endpoints except `/auth/login`, `/auth/logout`, and `/` require authentication via the JWT cookie.

---

## ✨ Features

### Authentication
- Login page with AWS-styled two-column layout
- JWT-based session with `httpOnly` cookies
- AuthGuard component for protected routes
- Username dropdown with sign-out in the navbar

### Hosted Zones
- Full CRUD (Create, Read, Update, Delete)
- Cloudscape Table with column sorting
- Server-side search with debounced input
- Configurable page size (10, 25, 50, 100)
- Domain name validation (requires valid TLD)

### DNS Records
- Full CRUD scoped to a hosted zone
- Type-aware forms (Priority field for MX/SRV only)
- Type filter dropdown (A, AAAA, CNAME, MX, TXT, NS, PTR, SRV, CAA)
- Server-side search by record name
- Client-side pre-validation mirroring backend rules
- Monospace value display for readability

### UI / UX
- AWS Cloudscape Design System throughout
- Flashbar toast notifications for all actions (create, update, delete)
- Loading spinners and button loading states
- Empty state messaging with call-to-action buttons
- Responsive sidebar navigation with collapsible sections
- 48px navbar with services menu and user dropdown

### Placeholder Pages
- Dashboard with resource overview cards
- Traffic Policies (coming soon)
- Health Checks with example table (coming soon)
- Resolver (coming soon)
- Profiles (coming soon)

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.9 | React framework with App Router |
| React | 19.2.4 | UI library |
| Cloudscape Design System | 3.x | AWS-native component library |
| TypeScript | 5.x | Type safety |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | High-performance Python API framework |
| SQLAlchemy | ORM for database operations |
| SQLite | Embedded relational database |
| PyJWT | JWT token creation and validation |
| bcrypt | Secure password hashing |
| Uvicorn | ASGI server |

---

## 📂 Project Structure

```
amazon route53 clone/
├── backend/
│   ├── main.py              # FastAPI app entry point, CORS, router includes
│   ├── auth.py              # Login / logout / me endpoints
│   ├── models.py            # SQLAlchemy ORM models (User, HostedZone, Record)
│   ├── schemas.py           # Pydantic request/response schemas + validation
│   ├── database.py          # SQLAlchemy engine + session factory
│   ├── dependencies.py      # JWT verification + get_current_user
│   ├── security.py          # Password hashing with bcrypt
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── zones.py         # Hosted zones CRUD endpoints
│       └── records.py       # DNS records CRUD endpoints
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── login/page.tsx       # AWS-styled login page
│   │   │   ├── dashboard/page.tsx   # Dashboard overview
│   │   │   ├── hosted-zones/
│   │   │   │   ├── page.tsx         # Zones list with CRUD
│   │   │   │   └── [id]/page.tsx    # Zone detail — records table
│   │   │   ├── traffic-policies/    # Placeholder
│   │   │   ├── health-checks/       # Placeholder
│   │   │   ├── resolver/            # Placeholder
│   │   │   └── profiles/            # Placeholder
│   │   ├── components/
│   │   │   ├── AppShell.tsx         # Navbar + sidebar layout
│   │   │   ├── AuthGuard.tsx        # Route protection
│   │   │   ├── Notifications.tsx    # Flashbar notification system
│   │   │   ├── zones/              # Zone modals (Create, Edit, Delete)
│   │   │   └── records/            # Record modals (Create, Edit, Delete)
│   │   ├── hooks/
│   │   │   └── useAuth.ts          # Auth state hook
│   │   └── lib/
│   │       └── api.ts              # API client with cookie credentials
│   └── ...
│
└── README.md
```

---

## 🚢 Deployment

### Environment Variables

Both services are configured via environment variables with sensible defaults for local development.

#### Backend (`backend/.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `route53-clone-dev-secret-key-f8a2` | Secret key for signing JWT tokens. **Change this in production!** |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed CORS origins |
| `DATABASE_URL` | `sqlite:///./route53.db` | SQLAlchemy database URL. Supports SQLite, PostgreSQL, MySQL |

#### Frontend (`frontend/.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL used by the browser |

### Deploy Frontend to Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Set the **Root Directory** to `frontend`
4. Add the environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```
5. Deploy — Vercel auto-detects Next.js and builds it

### Deploy Backend to Railway / Render

#### Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set the **Root Directory** to `backend`
3. Set the **Start Command** to:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Add environment variables:
   ```
   JWT_SECRET=<generate-a-strong-random-secret>
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   DATABASE_URL=sqlite:///./route53.db
   ```
5. Deploy

#### Render

1. Go to [render.com](https://render.com) → New Web Service → connect your repo
2. Set the **Root Directory** to `backend`
3. Set the **Build Command** to `pip install -r requirements.txt`
4. Set the **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add the same environment variables as above
6. Deploy

> **Production tip:** For production deployments, consider switching from SQLite to PostgreSQL by setting `DATABASE_URL` to a PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname`). The SQLAlchemy ORM makes this a zero-code-change swap.
