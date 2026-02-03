# 🚗 AUTOTRAQ

**Enterprise-grade inventory management system for auto parts operations**

A full-stack web application built for tracking parts, vehicles, inventory movements, and warehouse operations with role-based access control and barcode authentication.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Stack](https://img.shields.io/badge/Express-4-000000?logo=express) ![Stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Stack](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql) ![Stack](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)

---

## ✨ Features

### 🔐 Authentication & Access Control
- **4-tier role system:** Admin → Manager → Fulfillment → Viewer
- **Barcode login** for Admin & Manager accounts (Code 128, USB scanner compatible)
- **Email/password login** for Fulfillment & Viewer accounts
- **Role promotion requests** — users request Manager access, Admins approve/deny
- **Admin cap of 4** — hard limit on privileged accounts
- **Password management** — self-service change + admin reset
- **User deletion with activity reassignment** — terminated employees' data stays intact
- **JWT tokens** with rate limiting

### 🔧 Parts Catalog
- Full CRUD operations with search & pagination
- **Custom SKU encoding system** — structured codes encoding make, model, year, system, component
- **SKU decoder** — reverse any SKU to human-readable data
- **Barcode generation** per part (Code 128)
- Part-vehicle fitment management (many-to-many)
- Interchange groups for equivalent parts

### 🚗 Vehicle Database
- **3,047 vehicles** seeded (US domestic, 2000-2026)
- Dynamic cascading dropdowns (Year → Make → Model)
- Unique constraint on year+make+model+trim
- Search and pagination

### 📦 Inventory Management
- **Append-only event ledger** — every stock change is an immutable record
- **4 event types:** Receive, Fulfill, Return, Correction
- **On-hand quantities** calculated from event history
- Multiple warehouse locations
- Role-gated operations (Receive/Return: Fulfillment+, Corrections: Manager+)

### 📋 Request Workflow
- Multi-item requests with target locations
- **4-stage status flow:** Pending → Approved → Fulfilled → Cancelled
- Manager approval gate before fulfillment
- Auto-generates inventory events on fulfillment

### 📱 Barcode Scanning
- **Camera scanning** via device camera
- **USB scanner mode** for hardware barcode scanners
- **Manual SKU lookup** with instant navigation

### 🎨 Frontend
- **Dark theme** with slate/amber design system
- Collapsible sidebar with sub-navigation
- Role-aware UI (buttons hidden based on permissions)
- Real-time search across all data tables
- Printable ID badge-sized barcode cards

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+ — [nodejs.org](https://nodejs.org)
- **MySQL** 8+ — [mysql.com](https://dev.mysql.com/downloads/) or `brew install mysql`

### 1. Clone & Install

```bash
git clone git@github.com:an5onc/autotraq.git
cd autotraq

# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Database Setup

Start MySQL, then create the database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE autotraq;
CREATE USER 'autotraq'@'localhost' IDENTIFIED BY 'autotraq123';
GRANT ALL PRIVILEGES ON autotraq.* TO 'autotraq'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

Create `backend/.env`:

```env
PORT=3002
DATABASE_URL="mysql://autotraq:autotraq123@localhost:3306/autotraq"
JWT_SECRET="change-this-to-something-random"
JWT_EXPIRES_IN="24h"
```

### 4. Run Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
cd ..
```

### 5. Seed Data (Optional)

```bash
cd backend
npx tsx prisma/seed-vehicles.ts   # 3,047 vehicles
npx tsx prisma/seed-parts.ts      # Sample parts
npx tsx prisma/seed-sku.ts        # SKU code tables
cd ..
```

### 6. Start Development Servers

From the project root:

```bash
npm run dev
```

This starts both:
- **Backend API:** http://localhost:3002
- **Frontend:** http://localhost:5173

### 7. Create Your Account

1. Open http://localhost:5173
2. Click "Register" and create a Fulfillment or Viewer account
3. For Admin/Manager: an existing admin must create your account and give you a barcode card

---

## 📊 Database Schema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │     parts       │     │    vehicles     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ email           │     │ sku             │     │ year (≥2000)    │
│ password        │     │ name            │     │ make            │
│ name            │     │ description     │     │ model           │
│ role            │     │ barcodeData     │     │ trim            │
│ loginBarcode    │     │ skuDecoded      │     └─────────────────┘
│ createdById     │     └─────────────────┘              │
└─────────────────┘              │                       │
         │                       │                       │
         │              ┌────────┴───────┐               │
         │              │                │               │
         │     ┌────────▼────────┐  ┌────▼───────────────▼────┐
         │     │ interchange_    │  │    part_fitments        │
         │     │ group_members   │  ├─────────────────────────┤
         │     └─────────────────┘  │ partId                  │
         │                          │ vehicleId               │
         │                          └─────────────────────────┘
         │
┌────────▼────────┐     ┌─────────────────┐     ┌─────────────────┐
│ inventory_      │     │    requests     │     │  request_items  │
│ events          │     ├─────────────────┤     ├─────────────────┤
├─────────────────┤     │ id              │     │ partId          │
│ type (RECEIVE/  │     │ status          │     │ qtyRequested    │
│  FULFILL/RETURN │     │ createdBy       │     │ qtyFulfilled    │
│  /CORRECTION)   │     │ approvedBy      │     │ locationId      │
│ qtyDelta        │     │ fulfilledBy     │     └─────────────────┘
│ partId          │     └─────────────────┘
│ locationId      │
│ createdBy       │
└─────────────────┘
```

---

## 🔑 Roles & Permissions

| Action | Admin | Manager | Fulfillment | Viewer |
|--------|:-----:|:-------:|:-----------:|:------:|
| View all data | ✅ | ✅ | ✅ | ✅ |
| Create/edit parts & vehicles | ✅ | ✅ | ❌ | ❌ |
| Manage fitments & groups | ✅ | ✅ | ❌ | ❌ |
| Receive stock | ✅ | ✅ | ✅ | ❌ |
| Return stock | ✅ | ✅ | ✅ | ❌ |
| Stock corrections | ✅ | ✅ | ❌ | ❌ |
| Approve requests | ✅ | ✅ | ❌ | ❌ |
| Fulfill requests | ✅ | ✅ | ✅ | ❌ |
| Create requests | ✅ | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Approve role promotions | ✅ | ❌ | ❌ | ❌ |

**Login Methods:**
- Admin & Manager: **Barcode scan only** (Code 128, 8-character)
- Fulfillment & Viewer: **Email/password only**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express 4, TypeScript, Prisma ORM |
| Database | MySQL 8 |
| Auth | JWT, bcrypt, rate limiting |
| Validation | Zod schemas |
| Barcodes | JsBarcode (Code 128), html5-qrcode |

---

## 📁 Project Structure

```
autotraq/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # SQL migrations
│   │   └── seed-*.ts          # Seed scripts
│   └── src/
│       ├── controllers/       # Request handlers
│       ├── services/          # Business logic
│       ├── routes/            # API endpoints
│       ├── schemas/           # Zod validation
│       ├── middleware/        # Auth, validation, errors
│       └── index.ts           # Server entry
├── frontend/
│   └── src/
│       ├── api/               # API client
│       ├── components/        # Reusable components
│       ├── contexts/          # React contexts
│       └── pages/             # Page components
└── package.json               # Root scripts
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register (fulfillment/viewer only) | No |
| POST | `/api/auth/login` | Email/password login | No |
| POST | `/api/auth/barcode-login` | Barcode login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/change-password` | Change own password | Yes |
| POST | `/api/auth/users` | Create user (admin) | Admin |
| DELETE | `/api/auth/users/:id` | Delete user | Admin |

### Parts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/parts` | List parts | Yes |
| POST | `/api/parts` | Create part | Manager+ |
| GET | `/api/parts/:id` | Get part | Yes |
| PUT | `/api/parts/:id` | Update part | Manager+ |
| DELETE | `/api/parts/:id` | Delete part | Manager+ |
| POST | `/api/parts/:id/fitments` | Add fitment | Manager+ |

### Vehicles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | List vehicles | Yes |
| POST | `/api/vehicles` | Create vehicle | Manager+ |
| GET | `/api/vehicles/makes` | Get makes by year | Yes |
| GET | `/api/vehicles/models` | Get models by year+make | Yes |

### Inventory
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/inventory/on-hand` | Get quantities | Yes |
| GET | `/api/inventory/events` | Get event history | Yes |
| POST | `/api/inventory/receive` | Receive stock | Fulfillment+ |
| POST | `/api/inventory/correct` | Correction | Manager+ |
| POST | `/api/inventory/return` | Return stock | Fulfillment+ |

### Requests
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/requests` | List requests | Yes |
| POST | `/api/requests` | Create request | Yes |
| POST | `/api/requests/:id/approve` | Approve | Manager+ |
| POST | `/api/requests/:id/fulfill` | Fulfill | Fulfillment+ |
| POST | `/api/requests/:id/cancel` | Cancel | Manager+ |

---

## 🐛 Troubleshooting

**MySQL not running?**
```bash
# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

**Port conflict?**
Edit `PORT` in `backend/.env` and update `proxy.target` in `frontend/vite.config.ts`

**Prisma errors?**
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

**Need to reset the database?**
```bash
cd backend
npx prisma migrate reset
```

---

## 📈 Stats

- **~6,000 lines** of application code
- **30+ API endpoints** with full validation
- **15 database tables** with relational integrity
- **3,047 vehicles** seeded from NHTSA data
- **502 parts** with barcodes and inventory

---

## 👥 Team

Built for UNC Software Engineering Capstone — February 2026

---

## 📄 License

MIT
