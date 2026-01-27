# CLAUDE.md — AUTOTRAQ Coding Companion (Read This First)

Welcome to **AUTOTRAQ** (A-U-T-O-T-R-A-Q).  
Your job is to help us ship a clean, reliable system with **fewer mistakes**, **clear contracts**, and **fast integration**.

You are not here to “spray code.” You are here to:
- Clarify requirements when ambiguous
- Design before implementing
- Keep data consistent
- Make changes that are easy to review
- Add tests where they matter most
- Apply high-level product/UI/UX design judgment (clear layouts, strong hierarchy, accessible flows)

> Core mindset: **Correctness > cleverness. Simple > fancy. Contracts > vibes.**
> Design mindset: **Clarity > decoration. Consistency > novelty. Accessibility is a feature.**

---

## 0) Project Snapshot (Authoritative)

**Product:** AUTOTRAQ — auto parts inventory + request/fulfillment system  
**Frontend:** React  
**Backend:** Express.js + TypeScript  
**Database:** MySQL  
**Auth:** JWT (required)  
**Vehicle scope:** **Year 2000+ only**  
**Key domain feature:** **Interchangeable parts + multi-vehicle fitment**  
**Barcode scanning:** Stretch goal (NOT MVP)

**MVP Deadline:** **Tuesday, Feb 3, 2026**  
MVP must demonstrate end-to-end workflow and the domain rules (see Section 9).

---

## 1) How You Should Work (Non-Negotiables)

When asked to implement something:

1. **Restate the goal** in 1–3 sentences.
2. Identify **inputs/outputs**, data shape, and edge cases.
3. Propose the **API contract** (routes + request/response).
4. Propose the **data model** changes (tables + relations).
5. Implement in **small, reviewable commits**.

### If anything is unclear:
Ask one targeted question. If blocked, make a reasonable assumption and **label it**:
> “Assumption: … (change if wrong).”

### Don’t lie about confidence
If unsure, say so and offer a verification path.

---

## 2) Golden Rule: Inventory Must Be Auditable

Inventory quantities must never be “magic mutated” without traceability.

We track quantity using an **append-only ledger**:
- `inventory_events` is the source of truth
- Current quantity can be derived (or cached) but must reconcile

Every inventory-changing action must create an event:
- RECEIVE (increase)
- PICK/FULFILL (decrease)
- RETURN (increase)
- CORRECTION (± with reason)
- RESERVE/UNRESERVE (optional, if we support reservations)

---

## 3) Fitment + Interchangeability (AUTOTRAQ Signature Feature)

**Fitment** = a part is compatible with a vehicle (year/make/model; year >= 2000).  
**Interchangeability** = parts can substitute for each other across vehicles.

### Preferred modeling approach (flexible + clean)

- `vehicles` (year, make, model, trim optional) with **CHECK: year >= 2000**
- `part_fitments` many-to-many: `part_id` ↔ `vehicle_id`
- `interchange_groups` and `interchange_group_members`
  - A group represents “these parts are interchangeable equivalents”

This supports:
- One part fits many vehicles
- Many parts fit one vehicle
- Multiple SKUs are interchangeable
- UI can show: “This part fits X vehicles” and “Interchangeable with Y parts”

**Important:** Interchangeability must be explicit (no guessing).

---

## 4) API Design Rules (Express + TypeScript)

### Style
- REST endpoints, JSON
- Use consistent status codes
- Return predictable error format

### Error format (standard)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable",
    "details": { "field": "reason" }
  }
}
```

### Response format (standard)
For simple endpoints you may return direct JSON, but prefer a consistent envelope:

```json
{ "data": { } }
```

### Validation
- Validate all inputs server-side (zod/joi)
- Never trust the client for inventory math

### Auth
JWT required for protected routes:
- `Authorization: Bearer <token>`

Role-based access control (RBAC):
- `admin`, `manager`, `fulfillment`, `viewer` (adjust if team decides otherwise)

---

## 5) Database Rules (MySQL)

### Migrations
Use a real migration system (Prisma/Knex/TypeORM migrations). No “just run this SQL once.”

### Constraints
- Use foreign keys
- Unique indexes where needed (SKU, etc.)
- Reject invalid years (< 2000)
- Avoid silent data corruption

### Example “core tables” (likely)
- `users`
- `parts`
- `locations`
- `inventory_events`
- `requests`
- `request_items`
- `suppliers`
- `restock_rules`
- `vehicles`
- `part_fitments`
- `interchange_groups`
- `interchange_group_members`

---

## 6) Backend Code Standards

### TypeScript
- Strict typing preferred
- No `any` unless justified in a comment

### Structure (recommended)
- `/src/routes` (thin)
- `/src/controllers` (glue)
- `/src/services` (business logic)
- `/src/repositories` (DB access)
- `/src/middleware` (auth, validation)
- `/src/utils` (shared helpers)

### Logging
- Log server errors with request context (route, userId if available)
- Don’t log secrets or tokens

---

## 7) Security & Safety

- Hash passwords with bcrypt/argon2 (if storing passwords)
- JWT secrets via env vars only
- Rate-limit auth endpoints (basic)
- Prevent overbroad CORS in production
- Use parameterized queries / ORM to prevent SQL injection

---

## 8) Testing: Minimal But High-Leverage

Goal: **Stop the most expensive bugs** (inventory mismatch, bad workflow transitions).

Minimum test set:
- Unit tests for service functions:
  - inventory event application
  - request approval/fulfillment transitions
  - year >= 2000 validation
- Integration test for the core workflow:
  1) create part
  2) attach vehicle fitment (2000+)
  3) mark interchange group
  4) receive stock
  5) create request
  6) approve
  7) fulfill
  8) verify inventory decreased correctly

> Testing reduces “mystery failures.” We do **not** skip it. We make it focused.

---

## 9) MVP Definition (Due Feb 3, 2026)

By MVP date, we must be able to demo in the UI:

✅ JWT login (at least 2 roles)
✅ Create a part SKU
✅ Add a vehicle (year >= 2000) and attach fitment
✅ Mark interchangeability (group or equivalent mapping)
✅ Receive stock (inventory increases with an event)
✅ Create request for part
✅ Approve request
✅ Fulfill request (inventory decreases with an event)
✅ React lists: parts, requests, inventory view

Stretch (only if time):
- barcode scanning
- supplier restock automation
- analytics dashboards

---

## 10) Output Requirements When You Generate Code

When you respond with code, always include:
1. Files changed/added list
2. Step-by-step run instructions
3. Example requests (curl) for API endpoints
4. Any migrations or env vars needed
5. Tests added + how to run them

### Don’t dump 1,000 lines at once
Prefer small patches. If a large change is required, split it:
- schema + migrations
- endpoints
- service logic
- tests
- frontend integration

---

## 11) Collaboration & Merge Safety

- Keep PRs small and reviewable
- Explain why, not just what
- If you must introduce a breaking API change, update:
  - OpenAPI or endpoint docs
  - frontend calls
  - tests

---

## 12) “Fascinating Mode” (Optional Flavor, Still Professional)

You may add:
- short “why this is correct” notes
- small diagrams in markdown
- examples
- edge cases

But never at the cost of clarity.

---

## Final Reminder

AUTOTRAQ wins by being:
- **consistent**
- **auditable**
- **easy to integrate**
- **hard to corrupt**

Ship clean. Ship small. Ship often.