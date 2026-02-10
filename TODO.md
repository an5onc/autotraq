# AutoTraq TODO

> Auto parts inventory management system (UNC Software Engineering capstone)
> **Status:** Complete, presented Feb 3, 2026

## ✅ Completed
- [x] Full auth system (4-tier roles: Admin → Manager → Fulfillment → Viewer)
- [x] Barcode login (Code 128) for admin/manager via USB scanner
- [x] Self-registration for fulfillment/viewer
- [x] Role promotion request system
- [x] Admin panel: user CRUD, barcode management, password reset
- [x] User deletion with activity reassignment
- [x] Printable ID badge-sized barcode cards
- [x] SKU generation (MM-MMM-YY-PPCC format)
- [x] Code128 barcodes, USB + camera scanner
- [x] Part detail pages with inline editing
- [x] Vehicle search (tokenized + partial year)
- [x] Interchange groups, fitment management
- [x] Inventory tracking, location-based filtering
- [x] 3,047 NHTSA-seeded vehicles, 502 real parts
- [x] Presentation (Feb 3, 2026) ✅

## 🔜 Next Steps
- [ ] Final submission/grading (check UNC deadlines)
- [ ] Sprint cycles (started Feb 10)

## 📝 Notes
- Port 3002 for backend (avoid conflict with InterlockGo admin)
- DB: MySQL localhost:3306, user `autotraq`, db `autotraq`
- ~6,000 lines of application code

## Tech Stack
- **Frontend:** React + Vite + TypeScript
- **Backend:** Express + TypeScript + Prisma + MySQL
- **Theme:** Dark automotive (slate-900/950 + amber-500)
