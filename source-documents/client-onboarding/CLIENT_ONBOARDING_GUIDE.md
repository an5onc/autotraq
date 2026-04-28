# AutoTraQ Client Onboarding Guide

This guide is for introducing a new client to AutoTraQ as a web production site. The client does not need to install an `.exe` or desktop app. They only need a browser, an internet connection, and a user account.

## 1. Prepare the Production Site

Before introducing the client, confirm that the production deployment is ready.

1. Open the public frontend URL in a browser.
2. Confirm the login page loads without errors.
3. Confirm the backend API is connected by logging in and loading the dashboard.
4. Confirm the production database is the correct client database.
5. Confirm the backend environment variables are set:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
6. Confirm the frontend environment variable is set:
   - `VITE_API_URL`
7. Confirm the frontend was redeployed after setting or changing `VITE_API_URL`.
8. Confirm the default seed passwords have been changed or replaced with client-specific accounts.

## 2. Create the Client Admin Account

Create one primary admin account for the client owner, manager, or inventory lead.

1. Log in as an existing admin.
2. Go to Admin.
3. Create a new user for the client admin.
4. Assign the `admin` role.
5. Give the client a temporary password.
6. Ask the client admin to log in and change their password immediately.
7. Remove or disable any demo accounts that should not exist in production.

Recommended first account:

| Field | Example |
| --- | --- |
| Name | Client Owner or Inventory Manager |
| Email | manager@clientdomain.com |
| Role | admin |
| Password | Temporary password, changed at first login |

## 3. Explain How to Access AutoTraQ

Give the client these access instructions.

1. Open a modern browser such as Chrome, Edge, Safari, or Firefox.
2. Go to the AutoTraQ production website URL.
3. Enter the email address and password provided by the admin.
4. After logging in, the dashboard will show the main inventory status.
5. Bookmark the site for daily use.
6. Optional: on tablets or phones, use the browser option to add the site to the home screen.

Important notes for the client:

- No software install is required.
- Updates happen automatically when the website is redeployed.
- The same site works from any approved computer, tablet, or phone.
- Each user should have their own login.
- Shared passwords should be avoided because AutoTraQ tracks audit history by user.

## 4. Recommended Roles for the Client

Use roles to keep daily workflows simple and protect important data.

| Role | Best For | Access Level |
| --- | --- | --- |
| Admin | Owner, general manager, system lead | Full user and system management |
| Manager | Parts manager, inventory lead | Create/edit parts, approve requests, adjust inventory |
| Fulfillment | Warehouse, parts counter, picker | Receive, scan, fulfill, and return stock |
| Viewer | Sales, service advisors, read-only users | Search and view inventory |

Recommended setup:

1. Keep admin accounts limited to 1-3 trusted people.
2. Give day-to-day inventory leads the manager role.
3. Give warehouse users the fulfillment role.
4. Give anyone who only needs to look up parts the viewer role.

## 5. First Walkthrough With the Client

Use this sequence for the first live demo.

### Step 1: Login and Dashboard

1. Open the production site.
2. Log in with the client admin account.
3. Show the dashboard.
4. Explain that the dashboard is the starting point for inventory status, alerts, and recent activity.

### Step 2: Parts Catalog

1. Open Parts.
2. Show how to search for a part by SKU, name, category, condition, or vehicle fitment.
3. Open a part detail page.
4. Point out key fields:
   - SKU
   - Name
   - Condition
   - Cost and retail price
   - Vehicle fitments
   - Images
   - Barcode
5. Show how managers can create or update a part.

### Step 3: Vehicles and Fitment

1. Open Vehicles.
2. Show how vehicles are organized by year, make, model, and trim.
3. Explain that fitment connects parts to compatible vehicles.
4. Demonstrate adding a vehicle fitment to a part if appropriate.

### Step 4: Inventory

1. Open Inventory.
2. Show on-hand quantities.
3. Explain that inventory changes are recorded as events instead of manually overwriting history.
4. Demonstrate the main event types:
   - Receive stock
   - Fulfill stock
   - Return stock
   - Correct stock
5. Explain that this creates traceability for every stock movement.

### Step 5: Requests

1. Open Requests.
2. Create a sample request for one or more parts.
3. Show the request moving through the workflow:
   - Pending
   - Approved
   - Fulfilled
   - Cancelled, if needed
4. Explain which roles can approve and fulfill requests.

### Step 6: Barcode Scanning

1. Open Scan.
2. Show the available scan methods:
   - Camera scan
   - USB scanner
   - Manual SKU entry
3. Scan or enter a sample SKU.
4. Explain that barcode scanning helps reduce typing mistakes and speeds up fulfillment.

### Step 7: CSV Import and Export

1. Open CSV.
2. Show export for the current inventory data.
3. Explain that CSV import can be used for bulk updates.
4. Warn the client to test bulk imports with a small file first.

### Step 8: Audit and Reports

1. Open Audit.
2. Show how user actions are tracked.
3. Open Reports or export options.
4. Explain that audit history is why every person should use their own account.

## 6. Initial Data Setup Checklist

Complete this checklist before the client relies on AutoTraQ for daily operations.

1. Create production admin account.
2. Create manager and fulfillment accounts.
3. Add primary storage locations.
4. Add or import the starting parts catalog.
5. Add starting inventory quantities by location.
6. Add vehicle fitments for the most common parts.
7. Generate or confirm barcodes for parts.
8. Test a request from creation to fulfillment.
9. Test receiving stock.
10. Test returning stock.
11. Export inventory as CSV and verify the file.
12. Confirm the client knows who to contact for support.

## 7. Daily Client Workflow

This is the simplest day-to-day workflow to teach.

1. Search for a part.
2. Check whether it is in stock.
3. Create a request if the part is needed.
4. Manager approves the request.
5. Fulfillment scans or opens the request.
6. Fulfillment picks the part and fulfills the request.
7. AutoTraQ records the inventory change and audit history.

For incoming stock:

1. Open Inventory.
2. Choose receive stock.
3. Select the part, location, and quantity.
4. Save the event.
5. Confirm the on-hand quantity updated.

For incorrect stock:

1. Open Inventory.
2. Choose correction.
3. Enter the corrected quantity and reason.
4. Save the event.
5. Review the audit history if needed.

## 8. Client Handoff Email Template

Subject: AutoTraQ Access

Hello,

Your AutoTraQ inventory site is ready.

Website: `[production frontend URL]`

Login:

- Email: `[client admin email]`
- Temporary password: `[temporary password]`

Please log in, change your password, and bookmark the site. AutoTraQ runs in the browser, so there is no desktop installer or `.exe` file required.

Recommended first steps:

1. Confirm you can log in.
2. Review the dashboard.
3. Create accounts for your team.
4. Add your storage locations.
5. Import or enter your starting inventory.
6. Test one request from creation to fulfillment.

## 9. Web Production Recommendation

For this project, the web production path is the right direction.

Reasons:

- Every user accesses the same current version.
- There is no installer to distribute.
- Updates are controlled from one deployment.
- Data stays centralized in the production database.
- It works better for multiple computers and shared warehouse workflows.
- Client onboarding is simpler: account plus URL.

Keep the desktop/Electron build scripts only if you still want a future packaged option. For the main client rollout, treat the hosted frontend URL as the official product.

## 10. Pre-Launch Quality Checklist

Before sending the site to a real client, verify:

1. Production build passes.
2. Backend deploy passes.
3. Frontend deploy passes.
4. Database schema is applied.
5. Seed/demo passwords are removed or changed.
6. `FRONTEND_URL` matches the real production frontend URL.
7. `VITE_API_URL` matches the real production backend URL.
8. CORS allows the frontend domain.
9. At least one admin account exists.
10. Password reset or admin password reset process is understood.
11. Inventory import/export has been tested.
12. Barcode scanning has been tested on the client device type.
13. A backup plan exists for the production database.
14. The client knows the support contact and expected response process.

