# 🚗 AutoTraQ

**Automotive Parts Inventory & Tracking System**
**CS 490 Senior Capstone · University of Northern Colorado · Spring 2026**

AutoTraQ is a full-stack web application for managing automotive parts inventory, tracking stock movements, fulfilling requests, and generating barcodes — built for real-world warehouse workflows.

🌐 **Live deployment:** https://cs490unco.org

---

## 📍 If you're the professor — start here

All graded deliverables are PDFs in the **[`submission/`](./submission/)** folder. Open **[`submission/README.md`](./submission/README.md)** for the full map of what's where.

The rest of this file is for developers and teammates.

---

## 🗂 Top-level layout

| Folder | What it is |
|--------|-----------|
| **[`submission/`](./submission/)** | All graded deliverables, in PDF (pitch decks, project plan, per-module write-ups, cheat sheets, testing artifacts, dev process docs, API reference, deployment guide, client onboarding). |
| [`source-documents/`](./source-documents/) | Editable originals of the submission PDFs (Word, PowerPoint, Excel, Markdown). |
| [`archive/`](./archive/) | Reference material kept with the project but not part of the submission (syllabus, DB dump, prototype scripts, exploratory D3 stubs). |
| `backend/` | Express + TypeScript + Prisma API server. |
| `frontend/` | React + Vite + TypeScript single-page app. |
| `DEPLOY.md` | Railway deployment guide (also included as a PDF in `submission/08-deployment/`). |

---

## ✨ Features

- **Parts Catalog** — SKU-based parts with conditions, fitments, images, and interchange groups
- **Inventory Ledger** — Append-only event log (receive, fulfill, return, correction) for full traceability
- **Barcode System** — Generate and scan barcodes for parts and user login
- **Request Workflow** — Create, approve, and fulfill part requests with status tracking
- **Vehicle Fitment** — Map parts to specific year/make/model/trim combinations
- **Role-Based Access** — Admin, Manager, Fulfillment, and Viewer roles with promotion requests
- **Audit Logging** — Complete activity trail for compliance and accountability
- **Notifications** — In-app alerts for low stock, request approvals, and role changes
- **CSV Import/Export** — Bulk data operations for parts and inventory
- **Advanced Search** — Filter parts by SKU, name, vehicle, condition, and stock level
- **Dashboard** — At-a-glance inventory stats and alerts

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express.js, TypeScript, Zod validation |
| **Database** | MySQL with Prisma ORM |
| **Auth** | JWT + bcrypt, barcode-based login |
| **Testing** | Vitest, Supertest |
| **Deployment** | Railway (Nixpacks) |

---

## 📁 Project Structure

```
autotraq/
├── backend/             # Express API server
│   ├── prisma/          # Schema & migrations
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── services/    # Business logic
│   │   ├── repositories/# Database access
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── middleware/   # Auth, error handling
│   │   ├── scripts/     # Seed scripts
│   │   └── routes/      # API route definitions
│   └── tests/           # Unit & integration tests
├── frontend/            # React SPA
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React context providers
│   │   └── api/         # API client
│   └── dist/            # Production build output
└── docs/                # API docs & project docs
```

---

## 🚀 Local Development

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** 8.0+
- **npm** ≥ 9

### Setup

```bash
# Clone the repo
git clone https://github.com/an5onc/autotraq.git
cd autotraq

# Backend
cd backend
cp .env.example .env          # Edit DATABASE_URL & JWT_SECRET
npm install
npx prisma db push            # Apply schema to database
npm run db:seed-admins         # Create admin accounts
npm run db:seed-vehicles       # Seed vehicle data
npm run dev                    # Start API on port 3002

# Frontend (new terminal)
cd frontend
cp .env.example .env          # Set VITE_API_URL=http://localhost:3002
npm install
npm run dev                    # Start on port 5173
```

### Default Login

| Email | Password |
|-------|----------|
| `acordeiro@autotraq.app` | `autotraq2026` |

---

## 🌐 Deployment

See **[DEPLOY.md](./DEPLOY.md)** for full Railway deployment instructions.

**Quick version:**
1. Create Railway project with MySQL add-on
2. Deploy `backend/` and `frontend/` as separate services
3. Set environment variables (see DEPLOY.md)
4. Seed the database via Railway CLI

---

## 📜 API Documentation

See **[docs/api.md](./docs/api.md)** for the full API reference.

---

## 👥 Team

Built by the AutoTraQ team — Georgetown High School, 2025–2026.

---

## 📄 License

This project was created for educational purposes.
