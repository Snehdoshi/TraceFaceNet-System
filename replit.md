# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, framer-motion, recharts, wouter

## Project: TraceFaceNet

A real-time missing person identification system based on the TraceFaceNet research paper. Implements face embedding matching, case management, alert generation, and a biometric search dashboard.

### Features
- **Dashboard**: Command center with live stats and recent cases/alerts
- **Registry**: List/filter/search missing persons by status
- **Register Case**: Form to add new missing persons with face embedding generation
- **Person Detail**: Full case management with status updates
- **Biometric Search**: Upload/URL face search against all active cases using cosine similarity on 128-dim embeddings
- **Alerts**: Real-time alert feed for matches, new cases, status changes

### Architecture Notes
- Face matching uses simulated 128-dimensional normalized embeddings (cosine similarity)
- High-confidence matches (>=0.85) automatically generate alerts
- Case numbers auto-generated: `TFN-YEAR-XXXXXX`

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── tracefacenet/       # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `missing_persons` — case records with face embeddings
- `searches` — face search history with match results (JSON)
- `alerts` — system alerts for matches, new cases, status changes

## API Endpoints

- `GET /api/stats` — dashboard statistics
- `GET/POST /api/missing-persons` — case list and registration
- `GET/PUT/DELETE /api/missing-persons/:id` — individual case management
- `GET/POST /api/searches` — search history and perform face matching
- `GET/POST /api/alerts` — alert list and creation
- `PUT /api/alerts/:id` — update alert status
- `GET /api/healthz` — health check

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Packages

### `artifacts/tracefacenet` (`@workspace/tracefacenet`)

React + Vite frontend. Routes via wouter. Uses React Query hooks from `@workspace/api-client-react`.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`. Uses `@workspace/api-zod` for validation and `@workspace/db` for persistence.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
