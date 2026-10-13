# Field Service Stock & Inventory Management System

Full-stack inventory management for a central warehouse and field technicians.
The React/Vite client is served by the Express API in both development and
production. MongoDB is the persistent production database.

## Requirements

- Node.js 20.19+ (Node.js 22 LTS recommended)
- npm 10+
- MongoDB for persistent data; production startup requires a reachable MongoDB

## Configure

Copy `.env.example` to `.env` and set:

- `MONGODB_URI`: MongoDB connection string (the server also accepts `MONGO_URI`)
- `JWT_SECRET`: a private random secret of at least 32 characters
- `PORT`: optional HTTP port (defaults to `3000`)
- `INITIAL_ADMIN_PHONE` and `INITIAL_ADMIN_PASSWORD`: required on the first
  production start of an empty database; the password must be at least 12
  characters

For example, generate a JWT secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Do not commit `.env` or expose secrets in client-side variables.

## Run locally

```sh
npm install
npm run dev
```

The server initializes an empty database with the sample catalog and demo
accounts. On every start it synchronizes fields for catalog items with matching
item codes to the inventory template in `backend/seed.ts`; warehouse/technician
stock, existing users, and items not listed in the template are preserved.
Template changes are therefore applied at the next deployment/start, so treat
template fields as authoritative for those catalog items.
Development demo logins are `9876543210` / `admin123` for admin and
`9876500001` through `9876500004` / `tech123` for technicians. Do not use these
accounts in production.

## Build and deploy

```sh
npm ci
npm run lint
npm test
npm run build
npm run start
```

Deploy the repository to a Node.js host that supports a persistent MongoDB
service. Configure `MONGODB_URI`, a strong `JWT_SECRET`, `NODE_ENV=production`, and
(if required by the host) `PORT` in the host's secret/environment settings.
For an empty database, also set `INITIAL_ADMIN_PHONE` and a unique
`INITIAL_ADMIN_PASSWORD`; production initialization creates the catalog and
only that administrator, not the development demo accounts. Existing catalog
items are synchronized from `backend/seed.ts` at startup without changing stock
balances. Create technician accounts after signing in.
The start command serves both the API and built client; route the service's
HTTP traffic to that process. Production startup fails rather than silently
using volatile in-memory storage when MongoDB or a sufficiently strong JWT
secret is missing.

`GET /api/health` provides a basic process health check. The app does not
currently expose MongoDB readiness through this endpoint.
