# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Gestor de Cobros is a multi-tenant system for collecting recurring dues ("cuotas") from students ("alumnos") of any subscription-based business (sports academies, art schools, etc.). Each "Negocio" (tenant) is fully data-isolated from the others within a single shared database.

- `backend/`: NestJS 10 + TypeORM + PostgreSQL, TypeScript.
- `frontend/`: Angular 22 (standalone components, signals) + Tailwind CSS v4.

For the full history of decisions, module-by-module design rationale, seeded local test accounts, and known tech debt, see `context.md` at the repo root — it's a living document; read it before making non-trivial changes and update it afterwards.

## Commands

### Backend (`backend/`)
- `npm run start:dev` — dev server with watch mode (port 3000). Swagger UI at `/api` when `NODE_ENV !== production`.
- `npm run build` — `nest build`.
- `npm run lint` — ESLint with `--fix`.
- `npm test` — Jest unit tests (`*.spec.ts` under `src/`). Single file: `npx jest path/to/file.spec.ts`.
- `npm run test:e2e` — Jest e2e config (`test/jest-e2e.json`).
- There are currently no `*.spec.ts` files in the codebase despite the tooling being configured — don't assume test coverage exists for code you're touching.
- Requires a local Postgres and `backend/.env` (`DB_HOST/PORT/USER/PASSWORD/NAME`, `JWT_SECRET`, `CORS_ORIGINS`, `FRONTEND_URL`, `SMTP_*`, `RAILWAY_BUCKET_*` — the bucket vars are unused today, provisioned for a future file-upload feature).
- `synchronize: true` in `app.module.ts` — schema follows entities automatically in dev; no migrations exist yet.

### Frontend (`frontend/`)
- `npm start` — `ng serve` on `http://localhost:4200`, points at `http://localhost:3000` (see `src/environments/environment.ts`).
- `npm run build` — `ng build` (staging/production configs exist via `--configuration`, but their `apiUrl` is still a `TODO` placeholder).
- `npm test` — Vitest. Only the CLI-generated `app.spec.ts` exists; no real component test suite yet.

## Architecture

### Multi-tenancy is the central constraint
Single shared Postgres database. Every tenant-scoped table (`Alumno`, `Cuota`, `Pago`, nullable on `Usuario`) has a `negocio` FK. **There is no Postgres RLS** — isolation is enforced entirely by application code remembering to filter by `negocioId` on every query. Any new query against these tables that omits the `negocioId` filter is a cross-tenant data leak. `Rol`/`Permiso` are global (not tenant-scoped).

The `negocioId` for the current request always comes from the JWT (`@NegocioId()` param decorator, `backend/src/auth/decorators/negocio-id.decorator.ts`), never from the request body/query — DTOs never declare a `negocioId` field, and the global `ValidationPipe({ forbidNonWhitelisted: true })` would reject one if a client tried to send it.

### Backend module pattern
Alumnos/Cuotas/Pagos/Clases all follow the same shape: `modelo/*.entity.ts`, `servicios/*.service.ts`, `controladores/*.controller.ts`, `dtos/*.dto.ts`. When a service needs to reference a parent entity across modules (e.g. `Cuota.alumno`), it validates existence **and** tenant ownership in one call via the parent service's own `obtenerPorId(id, negocioId)` — never a raw `findOne`. Cross-tenant or nonexistent lookups always throw `NotFoundException`, never `ForbiddenException`, so a response can't distinguish "belongs to someone else" from "doesn't exist."

`AlumnosModule` and `CuotasModule` have a real circular dependency (Cuotas validates `alumnoId`; Alumnos triggers cuota-inheritance on student creation) resolved with `forwardRef()` on both module imports and both service injections — this is the established pattern for circular deps here, not an event emitter (there is no event-based pattern anywhere else in the codebase).

### Authorization model
JWT payload carries `sub`, `email`, `negocioId`, `alumnoId` (null for staff accounts), `roles`, `permissions`. Two guards compose per endpoint:
- `RolesGuard` + `@Roles('ADMIN')` on mutating endpoints (`POST`/`PATCH`/`DELETE`) across Alumnos/Cuotas/Pagos/Clases.
- `@AlumnoIdSesion()` param decorator (reads `request.user.alumnoId`) on `GET` endpoints of the same modules, so an `ALUMNO`-role account only ever sees its own records — it overrides, never merges with, any `?alumnoId=` query param a client might send.

Roles have no notion of tenant — an `ADMIN` of one `Negocio` is structurally identical to an `ADMIN` of another; isolation is purely the `negocioId` filtering above, not the role system.

Student ("alumno") account creation is invitation-based, not admin-registered: `POST /auth/invitar-alumno` emails a stateless JWT invite link (no separate token table); `POST /auth/completar-invitacion` (public) verifies it and creates the `Usuario`. See `AuthService`.

### Frontend conventions
- Standalone components + signals throughout, no `NgModule`.
- `core/services/*` wrap `HttpClient` against `environment.apiUrl`; `negocioId` is never in a form/request — it's implicit in the JWT the interceptor attaches.
- Two route guards: `authGuard` (any logged-in session — used on `/portal`) and `adminGuard` (also redirects `ALUMNO` sessions to `/portal` — used on all `/dashboard`, `/alumnos`, `/clases`, `/cuotas` routes). Frontend guards are a UX convenience; real authorization is enforced backend-side (see above) — don't rely on a frontend guard alone when adding a new sensitive action.
- Tailwind CSS v4, no Angular Material (deliberate, to match a custom design handoff). Confirmation/status UI is always a custom component — never native `confirm()`/`alert()`.
- **Tailwind PostCSS config must be `postcss.config.json`**, not `.mjs` — the Angular builder only autodetects that extension; the wrong extension silently no-ops Tailwind instead of erroring.
- **Timezone bug pattern to watch for**: any date rendered from a backend-supplied ISO string (UTC midnight) needs the `date` pipe's third arg forced to `'UTC'` (or `getUTCDate()`/`getUTCMonth()` if formatted manually) — otherwise negative-UTC-offset browsers (e.g. Argentina) render it a day early. This does **not** apply to dates constructed client-side (`new Date()`, `new Date(year, month)`) — forcing UTC there introduces the same bug in reverse.

## Where to look for more

`context.md` (repo root) is the detailed project log: entity-by-entity design notes, every deliberate decision and its rationale, seeded local dev credentials, and a running list of known tech debt. It's long by design (unlike this file) — consult it before assuming something is unintentional, and update it after any non-trivial change.
