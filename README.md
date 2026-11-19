# CareerRadar

Career intelligence and opportunity discovery platform — jobs (government, banking, private, IT), eligibility matching, technology radar, industry & market news, application tracking and learning resources in one place.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture and roadmap.

## Status

**Phase 1 — Foundation**: monorepo, authentication, user profiles, admin user management and the responsive dashboard shell. Job, news, eligibility and tracker pages are in the navigation but marked _Soon_ until their phases ship.

## Repository layout

| Path                    | What                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| `apps/api`              | Express + TypeScript REST API (MongoDB via Mongoose)                |
| `apps/web`              | React + Vite + Tailwind CSS web app                                 |
| `packages/shared`       | Zod schemas, enums, taxonomies and DTO types shared by both         |
| `integrations/mulesoft` | MuleSoft API gateway (Mule 4) and OpenAPI contract — see its README |
| `infra`                 | Docker Compose for local MongoDB, Redis and Mailpit                 |
| `docs`                  | Architecture and roadmap                                            |

## Prerequisites

- Node.js 20 (`.nvmrc`) and pnpm 9 (`corepack enable`)
- Docker (for MongoDB, Redis and Mailpit)

## Getting started

```bash
pnpm install
pnpm services:up     # MongoDB :27017, Redis :6379, Mailpit SMTP :1025 / UI :8025
pnpm setup:env       # creates apps/api/.env with freshly generated secrets
pnpm dev             # API on :4000, web on :5173 (proxies /api to the API)
```

Open http://localhost:5173. Verification and password-reset emails are captured by Mailpit at http://localhost:8025.

Create an admin account (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `apps/api/.env`):

```bash
pnpm seed:admin
```

## Scripts

| Command          | Description                                     |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | Run API, web and shared package in watch mode   |
| `pnpm build`     | Build all packages                              |
| `pnpm test`      | Run all tests (API tests use in-memory MongoDB) |
| `pnpm typecheck` | TypeScript checks                               |
| `pnpm lint`      | ESLint                                          |
| `pnpm format`    | Prettier                                        |

## Configuration

All configuration is via environment variables; see [`.env.example`](.env.example). Never commit real secrets — `.env` files are git-ignored.

## Security notes

- Passwords are hashed with Argon2id; access tokens are short-lived JWTs held in memory by the web app.
- Refresh tokens are opaque, rotated on every use, stored only as SHA-256 hashes and sent in an HTTP-only cookie; reuse revokes the whole session family.
- Optional eligibility fields (category, PwBD, etc.) require explicit consent and are encrypted at rest with AES-256-GCM.
