# AUTOTRAQ API Documentation

## Base URL
```
http://localhost:3002/api
```

## Authentication

Most endpoints require JWT authentication via the Authorization header:
```
Authorization: Bearer <token>
```

### Login Methods
- **Email/password** — For Fulfillment and Viewer accounts only
- **Barcode** — For Admin and Manager accounts only (8-character Code 128)

### Roles & Permissions
| Role | Create Parts | Receive Stock | Corrections | Approve Requests | Manage Users |
|------|:------------:|:-------------:|:-----------:|:----------------:|:------------:|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| manager | ✅ | ✅ | ✅ | ✅ | ❌ |
| fulfillment | ❌ | ✅ | ❌ | ❌ | ❌ |
| viewer | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Auth Endpoints

### POST /auth/register
Register a new user. **Self-registration is limited to `fulfillment` or `viewer` roles.**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "fulfillment"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "fulfillment"
    },
    "token": "eyJhbGc..."
  }
}
```

### POST /auth/login
Email/password login. **Only for `fulfillment` and `viewer` accounts.**

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": 1, "email": "...", "name": "...", "role": "fulfillment" },
    "token": "eyJhbGc..."
  }
}
```

**Error (if admin/manager):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Admin and manager accounts must use barcode login"
  }
}
```

### POST /auth/barcode-login
Barcode login. **Only for `admin` and `manager` accounts.**

**Request:**
```json
{
  "barcode": "42AB2039"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": 1, "email": "...", "name": "...", "role": "admin" },
    "token": "eyJhbGc..."
  }
}
```

### GET /auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "createdAt": "2026-02-01T..."
  }
}
```

### GET /auth/my-barcode
Get current user's login barcode (admin/manager only).

**Response (200):**
```json
{
  "data": {
    "barcode": "42AB2039"
  }
}
```

### POST /auth/change-password
Change own password.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### POST /auth/role-requests
Request role promotion to manager.

**Request:**
```json
{
  "requestedRole": "manager",
  "reason": "I need to approve inventory corrections"
}
```

### GET /auth/role-requests
*Admin only.* List all role requests.

**Query Params:** `?status=PENDING|APPROVED|DENIED`

### POST /auth/role-requests/:id/decide
*Admin only.* Approve or deny a role request.

**Request:**
```json
{
  "approved": true
}
```

### POST /auth/users
*Admin only.* Create a new user with any role.

**Request:**
```json
{
  "email": "newadmin@example.com",
  "password": "password123",
  "name": "New Admin",
  "role": "admin"
}
```

**Notes:**
- Maximum 4 admin users allowed
- Admin/manager accounts automatically get a barcode generated

### GET /auth/users
*Admin only.* List all users.

### DELETE /auth/users/:userId
*Admin only.* Delete a user. All their activity (inventory events, requests) is reassigned to the admin performing the delete.

### POST /auth/users/:userId/reset-password
*Admin only.* Reset a user's password.

**Request:**
```json
{
  "newPassword": "newpassword123"
}
```

### POST /auth/users/:userId/regenerate-barcode
*Admin only.* Generate a new login barcode for a user.

---

## Parts Endpoints

### GET /parts
List parts with search and pagination.

**Query Params:**
- `search` — Search by SKU or name
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 20, max: 5000)

**Response (200):**
```json
{
  "data": {
    "parts": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 502,
      "totalPages": 26
    }
  }
}
```

### POST /parts
*Manager+* Create a new part.

**Request:**
```json
{
  "sku": "TY-CAM-22-SUAS",
  "name": "Air Spring - Toyota Camry 2022",
  "description": "OEM replacement air spring"
}
```

### GET /parts/:id
Get part by ID with fitments and interchange groups.

### PUT /parts/:id
*Manager+* Update a part.

### DELETE /parts/:id
*Manager+* Delete a part.

### POST /parts/:id/generate-barcode
*Manager+* Generate a Code 128 barcode for the part's SKU.

### POST /parts/:id/fitments
*Manager+* Add a vehicle fitment to a part.

**Request:**
```json
{
  "vehicleId": 123
}
```

### DELETE /parts/:partId/fitments/:vehicleId
*Manager+* Remove a fitment.

---

## Vehicles Endpoints

### GET /vehicles
List vehicles with search and pagination.

**Query Params:**
- `search` — Search by year, make, model (supports partial: "2020 toy", "camry")
- `page`, `limit`

### POST /vehicles
*Manager+* Create a vehicle. **Year must be ≥ 2000.**

**Request:**
```json
{
  "year": 2022,
  "make": "Toyota",
  "model": "Camry",
  "trim": "XLE"
}
```

### GET /vehicles/makes
Get all makes for a specific year.

**Query Params:** `?year=2022`

### GET /vehicles/models
Get all models for a year and make.

**Query Params:** `?year=2022&make=Toyota`

### GET /vehicles/:id
Get vehicle by ID.

### PUT /vehicles/:id
*Manager+* Update a vehicle.

### DELETE /vehicles/:id
*Manager+* Delete a vehicle.

---

## Interchange Groups Endpoints

### GET /interchange-groups
List all interchange groups with members.

### POST /interchange-groups
*Manager+* Create an interchange group.

**Request:**
```json
{
  "name": "Camry/Avalon Air Springs 2018-2024",
  "description": "Interchangeable air springs"
}
```

### GET /interchange-groups/:id
Get group by ID.

### POST /interchange-groups/:id/members
*Manager+* Add a part to a group.

**Request:**
```json
{
  "partId": 42
}
```

### DELETE /interchange-groups/:groupId/members/:partId
*Manager+* Remove a part from a group.

---

## Inventory Endpoints

### GET /inventory/locations
List all warehouse locations.

### POST /inventory/locations
*Manager+* Create a new location.

**Request:**
```json
{
  "name": "Warehouse B"
}
```

### GET /inventory/on-hand
Get current on-hand quantities (calculated from event ledger).

**Query Params:**
- `partId` — Filter by part
- `locationId` — Filter by location

**Response:**
```json
{
  "data": [
    {
      "partId": 1,
      "locationId": 1,
      "quantity": 47,
      "part": { "sku": "...", "name": "..." },
      "location": { "name": "Main Warehouse" }
    }
  ]
}
```

### GET /inventory/events
Get inventory event history.

**Query Params:**
- `partId`, `locationId` — Filters
- `type` — RECEIVE, FULFILL, RETURN, CORRECTION
- `page`, `limit`

### POST /inventory/receive
*Fulfillment+* Receive stock into inventory.

**Request:**
```json
{
  "partId": 1,
  "locationId": 1,
  "qty": 10,
  "reason": "PO #1234"
}
```

### POST /inventory/correct
*Manager+* Stock correction (positive or negative).

**Request:**
```json
{
  "partId": 1,
  "locationId": 1,
  "qty": -3,
  "reason": "Damaged in transit"
}
```

### POST /inventory/return
*Fulfillment+* Return stock.

**Request:**
```json
{
  "partId": 1,
  "locationId": 1,
  "qty": 2,
  "reason": "Customer return - RMA #567"
}
```

---

## Requests Endpoints

### GET /requests
List requests with optional status filter.

**Query Params:** `?status=PENDING|APPROVED|FULFILLED|CANCELLED`

### POST /requests
Create a new request.

**Request:**
```json
{
  "items": [
    { "partId": 1, "qtyRequested": 5, "locationId": 1 },
    { "partId": 2, "qtyRequested": 2 }
  ],
  "notes": "Urgent - customer waiting"
}
```

### GET /requests/:id
Get request by ID with items.

### POST /requests/:id/approve
*Manager+* Approve a pending request.

### POST /requests/:id/fulfill
*Fulfillment+* Fulfill an approved request. Creates FULFILL inventory events.

### POST /requests/:id/cancel
*Manager+* Cancel a request.

---

## SKU Endpoints

### GET /sku/make-codes
Get all make codes (e.g., `TY` = Toyota).

### GET /sku/model-codes
Get model codes for a make.

**Query Params:** `?make=Toyota`

### GET /sku/system-codes
Get all system codes (e.g., `SU` = Suspension).

### GET /sku/component-codes
Get component codes for a system.

**Query Params:** `?system=SU`

### POST /sku/generate
Generate a structured SKU.

**Request:**
```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2022,
  "systemCode": "SU",
  "componentCode": "AS",
  "position": "FR"
}
```

**Response:**
```json
{
  "data": {
    "sku": "TY-CAM-22-SUAS-FR",
    "decoded": { ... },
    "barcode_png_base64": "..."
  }
}
```

### GET /sku/lookup/:sku
Decode a SKU back to human-readable data.

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {
      "field": "Specific field error"
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` — Invalid input (400)
- `UNAUTHORIZED` — Missing/invalid token (401)
- `FORBIDDEN` — Insufficient permissions (403)
- `NOT_FOUND` — Resource not found (404)
- `RATE_LIMITED` — Too many requests (429)
- `SERVER_ERROR` — Internal error (500)

---

## Rate Limiting

Auth endpoints are rate-limited to **100 requests per 15 minutes** per IP.
