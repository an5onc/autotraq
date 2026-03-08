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

## ✅ Phase 2 — Analytics & Dashboard (COMPLETE)

### 2.1 Dashboard Page ✅
- [x] **KPI cards** — total parts, total inventory, inventory value, pending requests, low stock count
- [x] **Recent activity feed** — last 8 inventory events
- [x] **Quick actions** — receive stock, new part, scan
- [x] **Low stock alerts panel** — parts below threshold (per-part minStock)

### 2.2 Inventory Analytics ✅
- [x] **Inventory value tracking** — costCents per part, total value on dashboard
- [x] **Charts** — 30-day inventory levels line chart (recharts)
- [x] **Top movers** — most active parts by event count
- [x] **Dead stock** — parts with no movement in 90+ days

### 2.3 Reporting ✅
- [x] **CSV export** — full parts catalog with inventory and value
- [ ] **PDF export** — deferred (requires additional setup)
- [ ] **Advanced reports** — deferred (by location, activity, fulfillment rate)

---

## 🔜 Phase 3 — Enhanced UX

### 3.1 Global Command Bar (⌘K) ✅
- [x] Quick search across parts, vehicles (live API search)
- [x] Action shortcuts (receive stock, new part, scan modes)
- [x] Page navigation (dashboard, parts, vehicles, etc.)
- [x] Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)

### 3.2 Low Stock System ✅
- [x] **Threshold configuration** — per-part minStock field (default 5)
- [x] **Alert badge** in sidebar (with pulse animation)
- [ ] **Email notifications** (optional) — deferred
- [ ] **Suggested reorder quantities** — deferred

### 3.3 Bulk Operations ✅
- [x] **Bulk receive** — add multiple parts, set quantities, confirm all at once
- [ ] **Bulk update** — select multiple parts, apply changes (deferred)
- [x] **CSV export** — full parts catalog with inventory (on Parts page)
- [x] **CSV import** — parts with preview, validation, and batch create (manager-only)

### 3.4 UI Enhancements
- [x] **Toast notifications** — react-hot-toast, success/error feedback
- [x] **Theme toggle** — dark/light/system mode with localStorage persistence
- [x] **Loading skeletons** — Dashboard + Parts page skeleton layouts
- [ ] **Mobile responsive** — better touch targets (deferred)
- [ ] **Keyboard shortcuts** — documented (deferred)

---

## 🔜 Phase 4 — Advanced Features

### 4.1 Part Images ✅
- [x] **Photo upload** — multiple images per part (base64, 5MB max)
- [x] **Image gallery** on part detail (grid + lightbox)
- [x] **Primary image** — star badge, auto-selection
- [x] **Thumbnail in list views** — shows primary image in parts table
- [ ] **S3/Cloudflare R2 storage** (deferred — using base64 for now)

### 4.2 Audit & Compliance ✅
- [x] **Full audit log** — who did what, when, filterable by entity/action
- [ ] **Data export** for compliance (deferred)
- [ ] **Soft delete** — archive instead of hard delete (deferred)
- [ ] **Change history** — per-record versioning (deferred)

### 4.3 Notifications ✅
- [x] **In-app notifications** — bell icon, unread count, dropdown list
- [x] **Notification types** — INFO, SUCCESS, WARNING, ERROR, LOW_STOCK, REQUEST_*, ROLE_*
- [x] **Mark as read** — single or all, auto-refresh every 30s
- [ ] **Email alerts** — low stock, request approved (deferred)
- [ ] **Webhook support** — external integrations (deferred)

### 4.4 Advanced Inventory
- [ ] **Lot/serial tracking** — individual unit tracking
- [ ] **Expiration dates** — for perishable items
- [ ] **Cost layers** — FIFO/LIFO/Average costing
- [x] **Reorder point automation** — smart reorder suggestions based on usage patterns ✅
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

## 🎯 Tonight's Build (Feb 9-10) ✅ COMPLETE

### Feature 1: Dashboard Page ✅
- [x] Create `/dashboard` route
- [x] KPI cards (parts count, inventory count, pending requests, low stock)
- [x] Recent activity feed (last 8 events)
- [x] Quick action buttons
- [x] Low stock alerts panel
- [x] Dashboard is now the default landing page

### Feature 2: Low Stock Alerts ✅
- [x] Low stock detection (threshold: qty < 5)
- [x] Alert badge with pulse animation
- [x] Low stock panel on dashboard
- [ ] Add `minStock` field to Part model (deferred to Phase 3)
- [ ] Per-part threshold configuration (deferred)

### Feature 4: Part Condition Tracking ✅ (added 12:33 AM)
- [x] PartCondition enum (NEW, EXCELLENT, GOOD, FAIR, POOR, CORE, SALVAGE, UNKNOWN)
- [x] Condition field in Part model
- [x] ConditionBadge component with color-coded labels
- [x] ConditionSelect dropdown for editing
- [x] Condition column in Parts table
- [x] Condition field in Create Part modal
- [x] Editable condition in Part Detail page (managers only)
- [x] Migration SQL ready to apply

### Feature 3: Global Command Bar (⌘K) ✅
- [x] CommandBar component with keyboard trigger (⌘K / Ctrl+K)
- [x] Search across parts, vehicles (live API search)
- [x] Action shortcuts (receive stock, new part, scan modes)
- [x] Page navigation (dashboard, parts, vehicles, etc.)
- [x] Keyboard navigation (↑↓ arrows, Enter to select, Esc to close)
- [x] Search trigger button in sidebar

---

*Last updated: Feb 10, 2026*
