# AUTOTRAQ

AUTOTRAQ is a web-based **inventory + operations** system for managing auto parts for small shops and parts operations.

**Tech stack**
- Frontend: React + Vite + TypeScript
- Backend: Express.js + TypeScript + Prisma
- Database: MySQL 8.0
- Auth: JWT with role-based access control

**Key domain rules**
- Only vehicles **year 2000 or newer** are tracked
- Parts can be linked to multiple vehicles (fitment)
- Parts can be marked as **interchangeable** (explicitly grouped)
- Inventory tracked via **append-only ledger** (auditable)

---

## Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- Docker and Docker Compose
- npm

### 1. Start MySQL Database

```bash
docker compose up -d
```

This starts MySQL on port 3306 with:
- Database: `autotraq`
- User: `autotraq`
- Password: `autotraq123`

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env  # or use existing .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs at: http://localhost:3001

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Project Structure

```
autotraq/
├── backend/
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Database access (Prisma)
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── schemas/        # Zod validation schemas
│   │   └── utils/          # Helpers
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── tests/
│       ├── unit/           # Unit tests
│       └── integration/    # Integration tests
├── frontend/
│   └── src/
│       ├── api/            # API client
│       ├── contexts/       # React contexts
│       ├── pages/          # Page components
│       └── components/     # Shared components
├── docs/
│   └── api.md              # API documentation
├── docker-compose.yml
└── CLAUDE.md
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
DATABASE_URL="mysql://autotraq:autotraq123@localhost:3306/autotraq"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="24h"
```

---

## Running Tests

```bash
cd backend

# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:int
```

---

## API Overview

See [docs/api.md](docs/api.md) for full API documentation.

### Key Endpoints

**Auth**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login

**Parts**
- `POST /api/parts` - Create part
- `GET /api/parts` - List parts
- `POST /api/parts/:id/fitments` - Add vehicle fitment

**Vehicles**
- `POST /api/vehicles` - Create vehicle (year >= 2000)
- `GET /api/vehicles` - List vehicles

**Interchange Groups**
- `POST /api/interchange-groups` - Create group
- `POST /api/interchange-groups/:id/members` - Add part to group

**Inventory**
- `POST /api/inventory/receive` - Receive stock
- `POST /api/inventory/correct` - Stock correction
- `GET /api/inventory/on-hand` - Get quantities
- `GET /api/inventory/events` - Get event history

**Requests**
- `POST /api/requests` - Create request
- `POST /api/requests/:id/approve` - Approve
- `POST /api/requests/:id/fulfill` - Fulfill

---

## Example Workflow (curl)

```bash
# 1. Register admin
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123","name":"Admin","role":"admin"}'

# 2. Login and save token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq -r '.data.token')

# 3. Create location
curl -X POST http://localhost:3001/api/inventory/locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Warehouse"}'

# 4. Create part
curl -X POST http://localhost:3001/api/parts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"BRK-001","name":"Brake Pad Set"}'

# 5. Create vehicle (year >= 2000)
curl -X POST http://localhost:3001/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":2020,"make":"Honda","model":"Civic"}'

# 6. Add fitment
curl -X POST http://localhost:3001/api/parts/1/fitments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":1}'

# 7. Receive stock
curl -X POST http://localhost:3001/api/inventory/receive \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partId":1,"locationId":1,"qty":10}'

# 8. Check on-hand
curl "http://localhost:3001/api/inventory/on-hand?partId=1" \
  -H "Authorization: Bearer $TOKEN"

# 9. Create request
curl -X POST http://localhost:3001/api/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"partId":1,"qtyRequested":3,"locationId":1}]}'

# 10. Approve request
curl -X POST http://localhost:3001/api/requests/1/approve \
  -H "Authorization: Bearer $TOKEN"

# 11. Fulfill request
curl -X POST http://localhost:3001/api/requests/1/fulfill \
  -H "Authorization: Bearer $TOKEN"

# 12. Verify on-hand decreased (should be 7)
curl "http://localhost:3001/api/inventory/on-hand?partId=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## MVP Features (Due Feb 3, 2026)

- [x] JWT login with roles (admin, manager, fulfillment, viewer)
- [x] Create parts with SKU
- [x] Create vehicles (year >= 2000) with fitment
- [x] Interchange groups for part equivalents
- [x] Receive stock (auditable events)
- [x] Request workflow (create → approve → fulfill)
- [x] React UI: Parts, Inventory, Requests pages

---

## Roles & Permissions

| Action | admin | manager | fulfillment | viewer |
|--------|-------|---------|-------------|--------|
| View all data | ✓ | ✓ | ✓ | ✓ |
| Create parts/vehicles | ✓ | ✓ | | |
| Manage fitments/groups | ✓ | ✓ | | |
| Receive stock | ✓ | ✓ | ✓ | |
| Stock corrections | ✓ | ✓ | | |
| Approve requests | ✓ | ✓ | | |
| Fulfill requests | ✓ | ✓ | ✓ | |
| Create requests | ✓ | ✓ | ✓ | ✓ |

---

## Contributing

- Use feature branches: `feature/<short-name>`
- Keep PRs small and reviewable
- Update docs/tests when making changes

---

## License

TBD
