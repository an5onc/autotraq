# AutoTraq TODO

> Auto parts inventory management system — UNC Software Engineering Capstone
> **Status:** Core complete, presentation delivered Feb 3, 2026

---

## ✅ Phase 1 — Core Foundation (COMPLETE)

### 1.1 Authentication & Authorization
- [x] JWT-based authentication
- [x] 4-tier role system (Admin → Manager → Fulfillment → Viewer)
- [x] Barcode login for admin/manager (Code128, 8-char short codes)
- [x] Email/password login for all roles
- [x] Self-registration (locked to fulfillment/viewer)
- [x] Role promotion request system
- [x] Admin cap of 4 users
- [x] Password change / admin reset

### 1.2 User Management
- [x] Admin panel with user CRUD
- [x] Role request queue (approve/deny)
- [x] Barcode management (regenerate, view)
- [x] User deletion with activity reassignment
- [x] Printable ID badge-sized barcode cards
- [x] Barcode visibility security (admins can't see other admins' codes)

### 1.3 Parts Catalog
- [x] Parts CRUD with SKU
- [x] SKU generation system (MM-MMM-YY-PPCC format)
- [x] Code128 barcode generation
- [x] Part detail pages with inline editing
- [x] Description and metadata support

### 1.4 Vehicle Management
- [x] Vehicle CRUD (year >= 2000)
- [x] NHTSA-seeded database (3,047 vehicles, US domestic 2000-2026)
- [x] Vehicle search (tokenized + partial year)
- [x] Cascade filters (year → make → model)

### 1.5 Fitments & Interchange
- [x] Part-to-vehicle fitment mapping
- [x] Interchange groups (interchangeable parts)
- [x] Add/remove fitments from part detail
- [x] Add/remove group members

### 1.6 Inventory Tracking
- [x] Append-only event ledger (RECEIVE, FULFILL, RETURN, CORRECTION)
- [x] Location management (warehouses, bins)
- [x] On-hand quantity calculations
- [x] Inventory event history
- [x] Location-based filtering

### 1.7 Request System
- [x] Create part requests
- [x] Approve/Fulfill/Cancel workflow
- [x] Request item tracking
- [x] Status filtering

### 1.8 Barcode Scanning
- [x] USB barcode scanner support (auto-detect mode)
- [x] Camera scanner (HTML5 QR/barcode)
- [x] Manual SKU entry
- [x] Auto-navigate to part on scan
- [x] SKU decode display for unknown parts

### 1.9 SKU Code Tables
- [x] Make codes (2-char)
- [x] Model codes (3-char per make)
- [x] System codes (engine, brakes, etc.)
- [x] Component codes (per system)
- [x] Position codes (L/R/F/B)

---

## 🔜 Phase 2 — Analytics & Dashboard

### 2.1 Dashboard Page
- [ ] **KPI cards** — total parts, total inventory value, pending requests, low stock count
- [ ] **Recent activity feed** — last 10 inventory events
- [ ] **Quick actions** — receive stock, new part, scan
- [ ] **Low stock alerts panel** — parts below threshold

### 2.2 Inventory Analytics
- [ ] **Inventory value tracking** — add cost per unit to parts
- [ ] **Charts** — inventory levels over time (line chart)
- [ ] **Top movers** — most requested/received parts
- [ ] **Dead stock** — parts with no movement in 90+ days

### 2.3 Reporting
- [ ] **Inventory report** — by location, by category
- [ ] **Activity report** — user actions, date range filter
- [ ] **Request report** — fulfillment rate, average time
- [ ] **Export to CSV/PDF**

---

## 🔜 Phase 3 — Enhanced UX

### 3.1 Global Command Bar (⌘K)
- [ ] Quick search across parts, vehicles, locations
- [ ] Action shortcuts (receive stock, new part, etc.)
- [ ] Recent items
- [ ] Keyboard navigation

### 3.2 Low Stock System
- [ ] **Threshold configuration** — per-part or per-location minimum
- [ ] **Alert badge** in sidebar
- [ ] **Email notifications** (optional)
- [ ] **Suggested reorder quantities**

### 3.3 Bulk Operations
- [ ] **Bulk receive** — scan multiple items, confirm all at once
- [ ] **Bulk update** — select multiple parts, apply changes
- [ ] **CSV import** — parts, vehicles, inventory
- [ ] **CSV export** — full inventory dump

### 3.4 UI Enhancements
- [ ] **Theme toggle** — dark/light mode
- [ ] **Mobile responsive** — better touch targets, swipe actions
- [ ] **Keyboard shortcuts** — documented, customizable
- [ ] **Toast notifications** — success/error feedback
- [ ] **Loading skeletons** — better perceived performance

---

## 🔜 Phase 4 — Advanced Features

### 4.1 Part Images
- [ ] **Photo upload** — multiple images per part
- [ ] **Image gallery** on part detail
- [ ] **Thumbnail in list views**
- [ ] **S3/Cloudflare R2 storage**

### 4.2 Audit & Compliance
- [ ] **Full audit log** — who did what, when, with filters
- [ ] **Data export** for compliance
- [ ] **Soft delete** — archive instead of hard delete
- [ ] **Change history** — per-record versioning

### 4.3 Notifications
- [ ] **In-app notifications** — bell icon, unread count
- [ ] **Email alerts** — low stock, request approved
- [ ] **Webhook support** — external integrations

### 4.4 Advanced Inventory
- [ ] **Lot/serial tracking** — individual unit tracking
- [ ] **Expiration dates** — for perishable items
- [ ] **Cost layers** — FIFO/LIFO/Average costing
- [ ] **Purchase orders** — track incoming stock

### 4.5 API & Integration
- [ ] **API documentation** — OpenAPI/Swagger
- [ ] **Rate limiting** — per-user, per-endpoint
- [ ] **API keys** — for external integrations
- [ ] **Webhook endpoints** — push events to external systems

---

## 🔜 Phase 5 — Performance & Scale

### 5.1 Performance
- [ ] **Database indexes** — query optimization
- [ ] **Pagination everywhere** — consistent, efficient
- [ ] **Caching layer** — Redis for hot data
- [ ] **Query optimization** — N+1 fixes, eager loading

### 5.2 Testing
- [ ] **Unit tests** — services, utilities
- [ ] **Integration tests** — API endpoints
- [ ] **E2E tests** — critical user flows
- [ ] **Load testing** — concurrent users

### 5.3 Deployment
- [ ] **Docker setup** — containerized deployment
- [ ] **CI/CD pipeline** — GitHub Actions
- [ ] **Environment configs** — dev/staging/prod
- [ ] **Database migrations** — version-controlled schema

---

## 📊 Current Stats

- **Vehicles:** 3,047 (NHTSA seeded, 2000-2026)
- **Parts:** 502 (with barcodes + inventory)
- **Code tables:** Make, Model, System, Component codes
- **Lines of code:** ~6,000

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS (slate-900/950 + amber-500) |
| Backend | Express + TypeScript |
| Database | MySQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Barcode | JsBarcode (Code128) |
| Scanner | html5-qrcode |

---

## 📝 Development Notes

- **Port 3002** for backend (avoid conflict with InterlockGo admin on 3001)
- **Frontend port 5173** (Vite default)
- **Database:** MySQL localhost:3306, user `autotraq`, db `autotraq`
- **Presentation:** Delivered Feb 3, 2026 ✅
- **Sprint cycles:** Started Feb 10, 2026

---

## 🎯 Tonight's Build (Feb 9-10)

### Feature 1: Dashboard Page
- [ ] Create `/dashboard` route
- [ ] KPI cards (parts count, inventory count, pending requests, low stock)
- [ ] Recent activity feed
- [ ] Quick action buttons

### Feature 2: Low Stock Alerts
- [ ] Add `minStock` field to Part model
- [ ] Low stock query endpoint
- [ ] Alert badge in sidebar
- [ ] Low stock panel on dashboard

### Feature 3: Global Command Bar (⌘K)
- [ ] CommandBar component with keyboard trigger
- [ ] Search across parts, vehicles
- [ ] Action shortcuts
- [ ] Recent items

---

*Last updated: Feb 9, 2026*
