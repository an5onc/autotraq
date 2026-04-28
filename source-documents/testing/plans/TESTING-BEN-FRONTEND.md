# AutoTraQ Testing Checklist — BEN (Frontend)

**Login:** ben@autotraq.app / autotraq2026
**URL:** https://cs490unco.org
**Role:** Manager

Your section is the **frontend UI**. Go through every page and interaction below. For each task, mark ✅ if it works or ❌ if something is broken, and write a short note about what you see.

---

## 1. Authentication & Login (10 tasks)

- [ ] Go to https://cs490unco.org — verify the Welcome/Landing page loads
- [ ] Click "Login" or navigate to /login — verify login form appears
- [ ] Try logging in with **wrong password** — verify error message shows (not a crash)
- [ ] Try logging in with **empty fields** — verify validation prevents submission
- [ ] Log in with your real credentials — verify you're redirected to /dashboard
- [ ] Check the **top navigation bar** — verify your name shows and all nav links are visible
- [ ] Click your **profile/name** area — check if logout option exists
- [ ] Click **Logout** — verify you're returned to login page
- [ ] Try navigating directly to /dashboard while logged out — verify you're redirected to /login
- [ ] Log back in for the rest of the tests

## 2. Dashboard Page (12 tasks)

- [ ] Verify the Dashboard loads without errors
- [ ] Check **total parts count** displays (should be 534)
- [ ] Check **total inventory units** displays (should be ~5,491)
- [ ] Check **low stock alerts** section — note how many items show
- [ ] Check if there are any **charts or graphs** on the dashboard — describe what you see
- [ ] Verify the **layout is responsive** — resize your browser window to half width, does it still look good?
- [ ] Check that **all stat cards** have actual numbers (not "NaN" or "undefined")
- [ ] Click on any **dashboard link** that navigates to another page — does it work?
- [ ] Check **loading states** — when the page first loads, is there a spinner or skeleton?
- [ ] Open browser **DevTools (F12)** → Console tab — are there any red errors?
- [ ] Check the page **title** in the browser tab — what does it say?
- [ ] Take a **screenshot** of the full dashboard and save it

## 3. Parts Catalog (15 tasks)

- [ ] Navigate to /parts — verify the parts list loads
- [ ] Count approximately how many parts show on the first page
- [ ] Check if **pagination** exists — can you go to page 2, 3, etc.?
- [ ] Try the **search bar** — search for "engine" — do results filter?
- [ ] Try searching for "xyznotapart" — verify it shows "no results" gracefully
- [ ] Clear the search — verify all parts return
- [ ] Check if there are **filter options** (by condition, make, model, etc.) — test each one
- [ ] Click on any **individual part** — verify the Part Detail page loads (/parts/:id)
- [ ] On the Part Detail page, verify: name, SKU, description, condition, price are all visible
- [ ] Check if the part has **images** — do they load?
- [ ] Hit the **browser back button** — does it return to the parts list at the same position?
- [ ] Try **sorting** the parts list (by name, price, etc.) — does it work?
- [ ] Check if there's a **"Create Part"** button (you should see one as Manager)
- [ ] Click "Create Part" — does the form open? (Don't submit, just verify the form exists)
- [ ] Check the **parts list on mobile** (resize to phone width) — is it readable?

## 4. Vehicles Page (8 tasks)

- [ ] Navigate to /vehicles — verify the vehicle list loads
- [ ] Check how many vehicles are listed
- [ ] Try **searching/filtering** vehicles by make (e.g., "Toyota", "Ford")
- [ ] Click on an individual vehicle — does a detail view show?
- [ ] Check that vehicle info displays: Year, Make, Model
- [ ] Verify there's a way to **create a new vehicle** (button should exist for Manager role)
- [ ] Click create — verify the form loads (don't submit)
- [ ] Check for any **broken links or missing images** on this page

## 5. Inventory Page (10 tasks)

- [ ] Navigate to /inventory — verify the page loads
- [ ] Check if **inventory locations** are listed
- [ ] Look for **stock levels** — are quantities shown for parts?
- [ ] Check for a **"Receive Stock"** button — click it, verify the form appears
- [ ] Check for **"Stock Correction"** option — is it available for your role?
- [ ] Look for **Top Movers** section — does it show which parts move most?
- [ ] Look for **Dead Stock** section — does it identify items that haven't moved?
- [ ] Check **inventory history/events** — is there a log of stock changes?
- [ ] Try filtering inventory by location (if the option exists)
- [ ] Check if stock quantities match what the Dashboard shows

## 6. Requests Page (8 tasks)

- [ ] Navigate to /requests — verify the page loads
- [ ] Check if there are any existing requests listed
- [ ] Look for a **"Create Request"** button — click it
- [ ] Fill out a test request (any part, quantity 1) — **submit it**
- [ ] Verify the new request appears in the list
- [ ] Check request status — does it show "Pending" or similar?
- [ ] Try **approving** a request (you should be able to as Manager)
- [ ] Check if the request status updates after approval

## 7. Search & Advanced Search (8 tasks)

- [ ] Navigate to /search — verify the search page loads
- [ ] Try a **basic text search** for any part name
- [ ] Navigate to /parts/search (Advanced Search) — verify it loads
- [ ] Check if there's a **hierarchy tree** (System → Component) in the sidebar
- [ ] Click on a system in the hierarchy — do parts filter?
- [ ] Drill into a component — do results narrow down?
- [ ] Check the **stats cards** at the top — do they show relevant numbers?
- [ ] Try combining hierarchy filter + text search — do they work together?

## 8. Scan Page (5 tasks)

- [ ] Navigate to /scan — verify the page loads
- [ ] Check if a **barcode scanner interface** appears
- [ ] If there's a manual entry option, try typing a known SKU
- [ ] Check what happens when you scan/enter an invalid barcode
- [ ] Verify scanning a valid barcode navigates to the correct part

## 9. CSV Import/Export (5 tasks)

- [ ] Navigate to /csv — verify the page loads
- [ ] Check for an **Export** button — click it, verify a CSV file downloads
- [ ] Open the downloaded CSV — verify it contains actual part data (not empty)
- [ ] Check for an **Import** button/area
- [ ] Verify the import interface shows expected format/instructions

## 10. Admin Panel (8 tasks)

- [ ] Navigate to /admin — verify the page loads
- [ ] Check the **Users tab** — verify all 5 team members are listed
- [ ] Verify **Anson** shows as "admin" and **you** show as "manager"
- [ ] Check the **Role Requests** tab — does it load?
- [ ] Check the **My Barcode** tab — do you see a barcode?
- [ ] Check the **Security** tab — verify the "Change Password" form exists
- [ ] Try changing your password (change it, then change it back to autotraq2026)
- [ ] Verify the **Create User** tab is visible (managers may or may not have access — note what you see)

## 11. Audit Log (4 tasks)

- [ ] Navigate to /audit — verify the page loads
- [ ] Check if audit entries exist (from your earlier actions)
- [ ] Verify entries show: timestamp, user, action type, details
- [ ] Check if you can filter audit logs

## 12. Cross-Cutting / UI Quality (10 tasks)

- [ ] Test **every navigation link** in the sidebar/topbar — do they all work?
- [ ] Check for **consistent styling** — same fonts, colors, spacing across all pages
- [ ] Verify **dark theme** is consistent everywhere (no white flashes or unstyled sections)
- [ ] Test the app on a **phone** (or phone-width browser) — list any pages that break
- [ ] Check **loading speeds** — are any pages noticeably slow (>3 seconds)?
- [ ] Verify **error states** — what happens if you go to /parts/99999 (non-existent part)?
- [ ] Check that the **browser URL** updates correctly as you navigate
- [ ] Test the **browser back/forward buttons** throughout the app
- [ ] Look for any **placeholder text** that shouldn't be there ("Lorem ipsum", "TODO", etc.)
- [ ] Check the **favicon** — does the browser tab have an icon?

---

**Total: 103 tasks**

When you're done, compile your results and send them to Anson. Note any ❌ items with screenshots if possible.
