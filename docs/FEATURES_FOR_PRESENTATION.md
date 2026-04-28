# AutoTraQ Feature List for Presentation

AutoTraQ is a web-based automotive parts inventory and tracking platform built for shops, warehouses, and parts teams that need one shared system for inventory, requests, scanning, and accountability.

## One-Sentence Pitch

AutoTraQ gives automotive teams a centralized web dashboard to track every part, vehicle fitment, barcode scan, stock movement, request, user action, and reorder need from any browser.

## Core Selling Points

- Web-based access with no desktop installation required
- Centralized inventory database for all users and locations
- Role-based access for admins, managers, fulfillment users, and viewers
- Barcode generation and scanning for faster warehouse workflows
- Full inventory movement history using an append-only event ledger
- Request approval and fulfillment workflow
- Vehicle fitment tracking by year, make, model, and trim
- Advanced search for parts, SKUs, fitments, and interchange options
- Low-stock alerts and reorder recommendations
- Audit logs for accountability and traceability
- CSV import/export and PDF reporting
- Dashboard analytics for inventory value, movement, and activity

## Feature Categories

### 1. Web Production Platform

- Runs as a hosted web application
- Accessible from approved computers, tablets, and phones
- No `.exe` installer needed
- Updates are deployed once and instantly available to users
- Separate frontend, backend, and MySQL production services
- Environment-based backend and frontend configuration
- Production deployment support through Railway/Nixpacks

### 2. User Accounts and Security

- Email and password login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes for logged-in users
- Role-based permissions
- Admin-created user accounts
- Admin password reset
- User self-service password change
- User deletion controls
- Role promotion requests
- Admin approval or denial of role requests
- Login barcode support for admin and manager users
- Regenerate user login barcodes

### 3. Role-Based Access Control

- Admin role for full system control
- Manager role for inventory and operational management
- Fulfillment role for receiving, scanning, and fulfilling stock
- Viewer role for read-only lookup access
- Manager-only actions for sensitive changes
- Fulfillment-only actions for warehouse workflows
- Admin-only controls for users and role approvals

### 4. Dashboard and Business Overview

- Dashboard landing page after login
- Total parts count
- Total inventory quantity
- Inventory value calculation
- Pending request count
- Low-stock count
- Recent inventory activity
- Low-stock alert panel
- Inventory history chart
- Top moving parts
- Dead stock tracking
- Quick action shortcuts
- Loading states and user feedback

### 5. Parts Catalog

- Create, view, update, and delete parts
- SKU-based part records
- Part name and description
- Part condition tracking
- Minimum stock threshold per part
- Cost tracking
- Retail price tracking
- OEM and aftermarket part type support
- Barcode data per part
- SKU decoding support
- Part detail pages
- Inline editing for managers
- Add stock directly from a part detail page
- Delete confirmation for parts

### 6. Part Images

- Upload images for parts
- View image gallery on part detail pages
- Set a primary image
- Delete part images
- Retrieve image metadata
- Serve raw image data for thumbnails and previews

### 7. Vehicle Fitment

- Vehicle database by year, make, model, and trim
- Vehicle creation and lookup
- Vehicle update and delete support
- Year validation for supported vehicle range
- Attach fitments to parts
- Remove fitments from parts
- Search fitments through cascading year, make, and model selectors
- Compatibility lookup for vehicle-to-part matching

### 8. Interchange and Alternative Parts

- Create interchange groups
- Add parts to interchange groups
- Remove parts from interchange groups
- View interchangeable parts for a selected part
- Use interchange data in solution search
- Show exact fits, interchangeable fits, and alternatives

### 9. Inventory Management

- Location creation and listing
- Track inventory by part and location
- Receive stock
- Fulfill stock
- Return stock
- Correct stock
- On-hand quantity lookup
- Inventory event history
- Inventory level history
- Top movers reporting
- Dead stock reporting
- Reason field for stock adjustments
- Append-only inventory ledger for traceability

### 10. Request Workflow

- Create part requests
- Support multi-item requests
- Track request status
- Pending request state
- Manager approval workflow
- Fulfillment workflow
- Cancel request workflow
- Scan-to-fulfill workflow by SKU
- Request notes
- Request item locations
- Request item quantities
- Request audit logging

### 11. Barcode System

- Generate part barcodes
- Display barcodes in the app
- Print barcode views
- Camera-based barcode scanning
- USB scanner support
- Manual SKU entry fallback
- Barcode-based login support
- Scan actions for lookup and fulfillment
- Scan history tracking

### 12. Scan Analytics

- Total scan activity
- Most active scanning users
- Most scanned parts
- Peak scanning hours
- Scan frequency over time
- Recent scan history
- Scan success/failure tracking
- Date-range filters for analytics
- Action type breakdowns

### 13. Advanced Search

- General search page
- Dedicated parts search page
- Search by SKU, name, and description
- Advanced hierarchy browser
- Recent searches stored locally
- Search statistics cards
- Vehicle-based solution search
- OEM/cross-reference lookup
- Related part recommendations
- Filtered results for exact, interchange, and alternative matches

### 14. Solutions Finder

- Guided vehicle-first search flow
- Select automotive system category, such as brakes, engine, electrical, suspension, cooling, fuel, A/C, drivetrain, exhaust, and ignition
- Select year, make, and model
- Search for needed part
- Find exact matching parts
- Find interchangeable options
- Find alternative options
- Show stock on hand for each result
- Show condition and price information where available
- Show related parts for a repair job

### 15. Low Stock and Alerts

- Low-stock detection using each part's minimum stock threshold
- Low-stock alert panel on dashboard
- Low-stock API endpoint
- Dismiss low-stock alerts
- Low-stock PDF report support
- Reorder alert support through forecasting routes

### 16. Reorder Management

- Smart reorder suggestions
- Priority levels: critical, high, medium, and low
- Configurable lookback period
- Configurable lead time
- Estimated reorder cost
- Parts needing reorder count
- Historical usage-based recommendations
- Reorder analytics by part

### 17. Predictive Maintenance and Forecasting

- Predictive maintenance dashboard
- Usage pattern analysis
- Average daily usage estimates
- Usage trend direction
- Days-until-restock prediction
- Restock urgency levels
- Failure and return pattern analysis
- Correction count analysis
- Risk level estimates
- Maintenance schedule generation
- Potential savings estimate
- Forecasting API routes for stockout risk and seasonal demand

### 18. Pricing Tools

- Retail price field for parts
- Cost field for parts
- OEM flag support
- Part type support
- Bulk price updates by condition
- Condition multiplier settings
- Per-part pricing updates
- Condition-based pricing statistics

### 19. CSV and Data Operations

- Export inventory data as CSV
- Import/update parts by CSV
- Separate inventory CSV export route
- Bulk data operations for faster onboarding
- Browser download support for CSV files

### 20. Reports

- Full inventory PDF report
- Low-stock PDF report
- CSV inventory reports
- Inventory value data for dashboard reporting
- Event history reporting
- Audit history reporting

### 21. Audit Logging

- Audit trail for important actions
- Track entity type and entity ID
- Track acting user
- Track user name
- Track details of the action
- Track IP address where available
- Query audit logs
- View audit history for a specific entity

### 22. Notifications

- Notification bell in the interface
- User-specific notifications
- Unread notification count
- Mark one notification as read
- Mark all notifications as read
- Notification support for requests, role changes, and alerts

### 23. Admin Console

- User list
- Create user form
- Role request review
- My barcode tab
- Security tab
- Pricing tab
- Password reset controls
- Own password change form
- User barcode display and printing
- User deletion controls

### 24. Data Model Strengths

- MySQL relational database
- Prisma ORM
- Strong relationships between users, parts, vehicles, inventory events, locations, requests, images, scans, and audit logs
- Foreign keys and cascading deletes where appropriate
- Unique SKUs
- Unique vehicle combinations
- Unique part-to-vehicle fitments
- Unique interchange group membership
- Indexed scan and inventory data

### 25. Production and Engineering Features

- TypeScript frontend and backend
- Express API
- Zod request validation
- Helmet security headers
- Compression middleware
- CORS configuration for production frontend origins
- Centralized error handling
- Health route support
- Prisma schema deployment
- Automated build and test workflow through GitHub Actions
- Backend unit and integration tests
- Frontend production build check
- Web deployment documentation
- Client onboarding documentation

## Presentation-Friendly Feature Count

AutoTraQ includes more than 100 practical features across these major areas:

1. Web access and production deployment
2. Authentication and role-based security
3. Parts catalog management
4. Vehicle fitment and compatibility
5. Inventory movement tracking
6. Request approvals and fulfillment
7. Barcode generation and scanning
8. Scan analytics
9. Low-stock alerts
10. Smart reorder recommendations
11. Predictive maintenance and forecasting
12. CSV imports and exports
13. PDF and inventory reporting
14. Audit logging
15. Admin user management
16. Notifications
17. Pricing tools
18. Search and solution finding

## Best Features to Highlight in Slides

- Browser-based system: no installation, works across the whole shop
- Barcode scanning: faster lookups and fulfillment with fewer typing errors
- Complete traceability: every inventory movement is logged
- Vehicle fitment: connects parts to the vehicles they fit
- Request workflow: turns part requests into approved, fulfilled inventory events
- Smart reorder suggestions: helps prevent stockouts
- Audit logs: shows who did what and when
- CSV import/export: supports real-world onboarding and reporting
- Role-based access: gives each employee the right level of control
- Dashboard analytics: gives managers a quick operational overview

## Short Demo Flow for Presentation

1. Show login and dashboard.
2. Point out total parts, inventory value, pending requests, and low-stock alerts.
3. Search for a part by SKU or vehicle fitment.
4. Open the part detail page and show images, barcode, fitments, stock, and pricing.
5. Scan or manually enter a barcode.
6. Create a request for a part.
7. Approve and fulfill the request.
8. Show the inventory quantity changed.
9. Open audit logs to show traceability.
10. Open reorder management to show smart business recommendations.

