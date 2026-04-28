# AutoTraQ Testing Checklist — FATIMA (Charts, Data Visualization & UX)

**Login:** fatima@autotraq.app / autotraq2026
**URL:** https://cs490unco.org
**Role:** Manager

Your section is **charts, data visualization, and visual components (C3/D3/Recharts)**. You'll test every graph, chart, stat card, and visual data element in the app. For each task, mark ✅ or ❌ and note what you see.

---

## 1. Dashboard Visualizations (15 tasks)

- [ ] Log in and navigate to the Dashboard
- [ ] Identify **every chart/graph** on the Dashboard — list them all by type (bar, pie, line, etc.)
- [ ] For each chart, verify it has a **title or label** explaining what it shows
- [ ] Check that **all charts have actual data** (not empty/blank charts)
- [ ] Verify **chart axes are labeled** (X-axis, Y-axis descriptions)
- [ ] Check that **numbers on charts match the stat cards** (e.g., total parts count)
- [ ] Hover over chart elements — do **tooltips** appear with data details?
- [ ] Check if charts have a **legend** when showing multiple data series
- [ ] Resize the browser to **half width** — do charts resize/reflow properly?
- [ ] Resize to **phone width** (~375px) — are charts still readable?
- [ ] Check for **chart colors** — are they accessible? (Not red/green only, sufficient contrast)
- [ ] Look for any charts that show **"No data"** or are completely empty — note which ones
- [ ] Check if there are **loading states** for charts (spinner/skeleton while data loads)
- [ ] Open DevTools → Console — are there any errors related to chart rendering?
- [ ] Take a **screenshot** of the full dashboard with all charts visible

## 2. Stat Cards & KPI Widgets (10 tasks)

- [ ] Identify all **stat cards** on the Dashboard (total parts, inventory, low stock, etc.)
- [ ] Verify each card has: **number, label, and icon/indicator**
- [ ] Check that **numbers are formatted correctly** (commas for thousands: 5,491 not 5491)
- [ ] Check if any cards show **percentage changes** or trend indicators (↑ ↓)
- [ ] Verify **low stock count** is accurate — go to the parts list and manually count low stock items
- [ ] Check if cards have **click behavior** — do any link to detailed pages?
- [ ] Verify cards are **aligned and evenly spaced** — no cards overlapping or oddly sized
- [ ] Check card rendering on **tablet width** (~768px) — proper grid layout?
- [ ] Check card rendering on **phone width** (~375px) — single column?
- [ ] Verify **color coding** is consistent (e.g., red for alerts, green for good)

## 3. Parts Data Displays (10 tasks)

- [ ] Navigate to /parts — check how parts are displayed (table? cards? grid?)
- [ ] Verify **condition badges** are color-coded (New = one color, Used = another, etc.)
- [ ] Check that **price formatting** is correct ($XX.XX with dollar sign and 2 decimals)
- [ ] Look for **part images** — do they load? Are there placeholder images for parts without photos?
- [ ] If there's a **parts-per-condition breakdown** (bar/pie chart) — verify it adds up to total
- [ ] Check the **pagination controls** — are they styled consistently?
- [ ] Check **sort indicators** — when you sort a column, is there a visual arrow showing direction?
- [ ] Test the **search results display** — do results highlight the matching text?
- [ ] Click into a Part Detail page — check for any **charts showing part history** (stock over time, price history, etc.)
- [ ] Verify the Part Detail page has a **clean layout** (not cramped or awkwardly spaced)

## 4. Inventory Visualizations (10 tasks)

- [ ] Navigate to /inventory — identify all visual elements
- [ ] Check for a **stock level chart** (bar chart of quantities by location or part)
- [ ] Check for a **Top Movers** visualization — how is it displayed? (chart, list, cards?)
- [ ] Check for a **Dead Stock** visualization — clear identification of stagnant inventory
- [ ] Verify **stock levels use color coding** (green = plenty, yellow = low, red = critical)
- [ ] Check if there's a **movement timeline** or history chart
- [ ] Verify **location data** is displayed in an organized way (table, grid, or map)
- [ ] Check for **quantity badges** or indicators on parts
- [ ] If there are sparklines or mini-charts — verify they render correctly
- [ ] Check the inventory page on **mobile** — is the data still usable?

## 5. Advanced Search Visuals (8 tasks)

- [ ] Navigate to /parts/search (Advanced Search)
- [ ] Check the **hierarchy tree** in the sidebar — is it visually clear and expandable?
- [ ] Verify **expand/collapse icons** work on the tree (▶ / ▼ or +/−)
- [ ] Check if selected tree items are **visually highlighted**
- [ ] Verify the **search stats cards** at the top are styled correctly
- [ ] Check if there are **result count badges** on hierarchy categories
- [ ] Verify the **transition/animation** when filtering results (smooth or jarring?)
- [ ] Check the search hierarchy on **mobile** — is the sidebar usable?

## 6. Requests & Workflow Visuals (6 tasks)

- [ ] Navigate to /requests — check the visual display of requests
- [ ] Verify **status badges** are color-coded (Pending = yellow, Approved = blue, Fulfilled = green, Cancelled = red)
- [ ] Check if there's a **workflow progress indicator** (visual pipeline: Pending → Approved → Fulfilled)
- [ ] Create a new request — check the **form styling** (inputs, dropdowns, buttons)
- [ ] Approve/fulfill the request — verify the **status badge updates visually**
- [ ] Check the requests page on **mobile** — are badges and status visible?

## 7. Admin Panel Visuals (6 tasks)

- [ ] Navigate to /admin — check the **tab navigation** styling
- [ ] Verify **user role badges** are color-coded (admin = red, manager = amber, etc.)
- [ ] Check the **barcode display** — does it render a proper barcode image?
- [ ] Click "Print" on a barcode — verify the **print layout** looks like a proper badge/card
- [ ] Check the **user avatar circles** (letter-based) — consistent size and color
- [ ] Verify the **password fields** mask input (show dots, not plaintext)

## 8. Scan Page Visuals (5 tasks)

- [ ] Navigate to /scan — check the **scanner interface** styling
- [ ] Verify there's a clear **scan area or input field**
- [ ] Check for **visual feedback** when a scan succeeds or fails
- [ ] Verify any **barcode images** render correctly (not broken/pixelated)
- [ ] Check the scan page on **mobile** — since scanning is typically mobile, this should look great

## 9. Audit Log Display (5 tasks)

- [ ] Navigate to /audit — check the **log table/list** formatting
- [ ] Verify **timestamps** are human-readable (not raw ISO dates)
- [ ] Check if **action types** have icons or color coding
- [ ] Verify the log is **sortable** and the sort is visually indicated
- [ ] Check log display on **mobile** — is the table scrollable or does it reformat?

## 10. Typography & Design Consistency (12 tasks)

- [ ] Check **font consistency** across all pages (same font family everywhere)
- [ ] Verify **heading hierarchy** (H1 > H2 > H3) makes visual sense
- [ ] Check **text contrast** — all text should be easily readable on the dark background
- [ ] Verify **button styling** is consistent (same shape, padding, hover effects across all pages)
- [ ] Check **input field styling** — all text inputs should look the same
- [ ] Verify **spacing consistency** — similar gaps between sections across pages
- [ ] Check for **hover effects** on interactive elements (buttons, links, rows)
- [ ] Verify **active/selected states** on tabs and navigation items
- [ ] Check for **focus indicators** — tab through form fields, is the focused field visible?
- [ ] Look for any **text that's cut off** or overflowing its container
- [ ] Check for **broken images** (missing image icon) anywhere in the app
- [ ] Verify the **dark theme** is consistent (no light-themed components mixed in)

## 11. Animation & Transitions (5 tasks)

- [ ] Navigate between pages — are there **page transition animations**?
- [ ] Open/close modals or dropdowns — are there **smooth animations**?
- [ ] Check **loading spinners** — are they styled to match the app theme?
- [ ] Check **toast notifications/alerts** (success, error messages) — do they animate in/out?
- [ ] Scroll long pages — is scrolling **smooth** or janky?

## 12. Accessibility & Color (8 tasks)

- [ ] Can you navigate the entire app using **only the keyboard** (Tab, Enter, Escape)?
- [ ] Check all **images/icons** have alt text (right-click → Inspect, check for `alt` attribute)
- [ ] Verify **color is not the only indicator** — are there labels/icons alongside color-coded elements?
- [ ] Check that **error messages** are clearly visible (not just a red border that could be missed)
- [ ] Test with browser zoom at **150%** — does everything still work?
- [ ] Test with browser zoom at **200%** — any overlapping elements?
- [ ] Check if **form labels** are properly associated with inputs (click a label, does the input focus?)
- [ ] Verify **empty states** — when a list has no data, is there a helpful message and icon?

---

**Total: 100 tasks**

**Tips:**
- Use browser DevTools (F12) → Elements tab to inspect styling
- Take **screenshots** of every chart and visualization
- Test on both **Chrome and Firefox** if possible (note any differences)
- Use your phone to test mobile layouts (or Chrome DevTools device emulator)

When done, compile results (with screenshots!) and send to Anson.
