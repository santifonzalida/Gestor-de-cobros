# Gestor de Cobros — Contexto del proyecto

Sistema **multi-tenant** de gestión de cobros de cuotas: centraliza distintos negocios (academias deportivas, escuelas de fútbol, centros de cerámica, cualquier rubro que cobre cuotas periódicas a sus alumnos) en una misma instancia, con los datos de cada negocio completamente aislados entre sí.

## Stack

**Backend** (`backend/`):
- NestJS 10, TypeScript
- TypeORM (`typeorm` + `@nestjs/typeorm`) — `synchronize: true` en desarrollo (ver `src/app.module.ts`), sin migraciones formales todavía
- PostgreSQL (local, vía Homebrew)
- Passport (`passport-jwt`, `passport-local`) para auth
- bcrypt para hash de contraseñas
- `class-validator` + `class-transformer` + `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) en `main.ts`
- Swagger (`@nestjs/swagger`) — `SwaggerModule.setup('api', ...)` en `main.ts`, solo activo si `NODE_ENV !== 'production'`

**Frontend** (`frontend/`):
- Angular 22 (standalone components, signals, sin `NgModule`)
- Tailwind CSS v4 — **ojo**: el config tiene que ser `postcss.config.json` (no `.mjs`), porque el builder de Angular (`@angular/build`) solo reconoce esa extensión para detectar PostCSS custom; sin eso, `@tailwind utilities` queda sin procesar silenciosamente (bug real que se pisó y se corrigió).
- Todavía **100% con datos mock** (`core/services/*.service.ts` devuelven `of(...)` con delay) — no está conectado al backend real todavía.

## Multi-tenancy (arquitectura central)

Decisiones tomadas:
- Una sola base de datos compartida, con columna `negocio` (FK a `Negocio`) en cada tabla tenant-scoped: `Usuario` (nullable), `Alumno`/`Cuota`/`Pago` (NOT NULL).
- `Rol` y `Permiso` quedan **globales** (sin `negocioId`, compartidos entre todos los negocios).
- Los `Negocio` se cargan a mano vía SQL directo — no hay flujo de alta self-service todavía.
- **Sin Postgres Row-Level Security** (decisión explícita, diferido). El único mecanismo de aislamiento es el filtrado por `negocioId` en cada query de cada service — no hay backstop a nivel DB. Esto es lo más frágil del sistema: cualquier query nueva que se olvide el filtro es una fuga de datos entre negocios.

Mecanismo:
- `Negocio` ([negocio.entity.ts](backend/src/negocios/modelo/negocio.entity.ts)): `id`, `nombre`, `activo`. Sin controller — no hay endpoint para crear negocios, se siembran por SQL.
- `@NegocioId()` ([negocio-id.decorator.ts](backend/src/auth/decorators/negocio-id.decorator.ts)): param decorator que lee `request.user.negocioId` (ya viene en el JWT). Se usa en cada handler de Alumnos/Cuotas/Pagos para pasar el `negocioId` explícito a cada método de servicio — mismo espíritu que `@Roles()`, pero como param decorator para no repetir `@Req()` en ~15 handlers.
- **Patrón repetido en los 3 services** (Alumnos → Cuotas → Pagos): todo método recibe `negocioId` y lo suma al `where`; `crear()` que referencia una entidad padre (ej. `Cuota.alumnoId`) valida existencia **y tenencia cross-tenant en la misma llamada**, usando el `obtenerPorId(id, negocioId)` ya scopeado del servicio padre. `NotFoundException` siempre (nunca `Forbidden`), para no filtrar si algo existe en otro negocio.
- **Ningún DTO de entrada** (`Crear*Dto`/`Actualizar*Dto`/`Filtrar*Dto`) tiene nunca un campo `negocioId` — siempre sale del JWT, jamás del body/query (el `ValidationPipe` con `forbidNonWhitelisted` ya lo rechazaría si alguien lo mandara).
- `AuthService.login()` mete `negocioId: user.negocio.id` en el payload del JWT; si el usuario no tiene negocio asignado, el login falla explícito en vez de emitir un token con `negocioId: undefined`.
- `AuthService.register()` hereda el `negocioId` del ADMIN autenticado que crea el nuevo usuario (nunca del body).
- **Verificado end-to-end** con 2 negocios reales sembrados en la DB (ids 1 y 2, ver más abajo): aislamiento confirmado en listar/obtener/actualizar/eliminar de los 3 recursos, y en la integridad referencial cruzada (no se puede crear una `Cuota` para un alumno de otro negocio, ni un `Pago` sobre una cuota de otro negocio).

## Módulos y entidades

### Alumnos (`backend/src/alumnos/`)

`Alumno` ([alumno.entity.ts](backend/src/alumnos/modelo/alumno.entity.ts)): `id`, `negocio` (`ManyToOne`, NOT NULL), `nombre`, `apellido`, `telefono?`, `email?`, `fechaAlta`, `activo`, `usuario?` (`OneToOne` opcional con `Usuario`, `@JoinColumn` del lado de Alumno), `cuotas` (`OneToMany`).

CRUD completo en [alumnos.service.ts](backend/src/alumnos/servicios/alumnos.service.ts) / [alumnos.controller.ts](backend/src/alumnos/controladores/alumnos.controller.ts). Controller protegido solo con `AuthGuard('jwt')` a nivel de clase — **cualquier autenticado puede hacer cualquier operación**, sin restricción de rol (a diferencia de Cuotas/Pagos).

### Usuarios (`backend/src/usuarios/`)

`Usuario` ([usuario.entity.ts](backend/src/usuarios/modelo/usuario.entity.ts)): `id`, `negocio?` (`ManyToOne`, nullable — se deja abierto por si algún día existe un usuario "superadmin" sin negocio), `email` (único global, no por negocio — ver Decisiones), `password` (hash bcrypt), `fechaAlta`, `fechaModificacion`, `ultimoAcceso`, `alumno` (inverso del `OneToOne`), `roles` (`ManyToMany` con `Rol` vía `@JoinTable` `roles_usuarios`).

`Rol` ([rol.entity.ts](backend/src/usuarios/modelo/rol.entity.ts)): `id`, `nombre` (único), `descripcion`, `permisos` (`ManyToMany` con `Permiso` vía `@JoinTable` `permiso_roles`). **Global**, sin `negocioId`.

`Permiso` ([permiso.entity.ts](backend/src/usuarios/modelo/permiso.entity.ts)): `id`, `nombre` (único), `descripcion`. También global.

> Se evaluó una tabla intermedia explícita (`RolPermiso`) para poder sumarle columnas propias, pero se optó por `@ManyToMany` + `@JoinTable` simple. Si en algún momento hace falta guardar metadata del vínculo (quién asignó qué permiso, desde cuándo), hay que migrar a una entidad explícita — no se puede agregar columnas a una `@JoinTable` implícita.

`UsuarioService` ([usuarios.service.ts](backend/src/usuarios/servicios/usuarios.service.ts)): CRUD básico + `findByEmail` (carga `roles.permisos` y `negocio`, usado por el login), `findByIdWithRelations`, `findByRol`/`findByRolWithoutUser` (⚠️ ver Pendientes), `findByName` (busca `Rol` por nombre), `updateLastLogin` (actualiza `ultimoAcceso`).

### Cuotas (`backend/src/cuotas/`)

`Cuota` ([cuota.entity.ts](backend/src/cuotas/modelo/cuota.entity.ts)): `id`, `negocio` (NOT NULL), `alumno` (`ManyToOne`), `mes`, `anio`, `monto`, `estado: EstadoCuota` (enum: `PENDIENTE`, `PAGADA`, `VENCIDA`), `fechaVencimiento`, `pago` (`OneToOne`, **`@JoinColumn` del lado de Cuota** — la FK vive acá, no en Pago; importante para el orden de borrado), `@Unique(['alumno', 'mes', 'anio'])`.

CRUD en [cuotas.service.ts](backend/src/cuotas/servicios/cuotas.service.ts) / [cuotas.controller.ts](backend/src/cuotas/controladores/cuotas.controller.ts). Permisos: `GET` (listar/detalle) abierto a cualquier autenticado; `POST`/`PATCH`/`DELETE` restringidos a rol `ADMIN` (`RolesGuard` + `@Roles('ADMIN')` por método). `listarTodos` filtra por `alumnoId`/`estado`/`mes`/`anio` vía [filtrar-cuotas.dto.ts](backend/src/cuotas/dtos/filtrar-cuotas.dto.ts).

`desvincularPago(cuotaId)`: limpia el FK `pago` y repone `estado: PENDIENTE` — lo usa `PagosService.eliminar` **antes** de borrar el `Pago`, porque la FK vive del lado de Cuota (borrar el Pago primero rompe la constraint).

### Pagos (`backend/src/pagos/`)

`Pago` ([pago.entity.ts](backend/src/pagos/modelo/pago.entity.ts)): `id`, `negocio` (NOT NULL), `cuota` (inverso del `OneToOne`), `metodo: MetodoPago` (enum: `EFECTIVO`, `TRANSFERENCIA`, `TARJETA`, `MERCADOPAGO`), `montoPagado`, `fechaPago`, `comprobanteUrl?` (string simple por ahora, **sin upload de archivo real** — ver Pendientes), `registradoPor?` (`ManyToOne` opcional a `Usuario`).

CRUD en [pagos.service.ts](backend/src/pagos/servicios/pagos.service.ts) / [pagos.controller.ts](backend/src/pagos/controladores/pagos.controller.ts). Mismo esquema de permisos que Cuotas. Reglas de negocio:
- Al **crear** un pago: valida que la cuota exista (scopeada por negocio), que no tenga ya un pago (`OneToOne`), y **marca automáticamente la Cuota como `PAGADA`**.
- Al **eliminar** un pago: revierte la Cuota a `PENDIENTE` (vía `desvincularPago`).
- `registradoPor` se toma del JWT (`request.user.sub`) en el controller, **nunca del body** — no se puede falsificar quién registró el pago.
- En las respuestas, `registradoPor` trae `select: { id, email }` únicamente — **fix de seguridad real**: antes devolvía el `Usuario` completo, incluyendo el hash de la contraseña.

### Auth (`backend/src/auth/`)

- [auth.service.ts](backend/src/auth/services/auth.service.ts): `register(dto, negocioId)`, `validateUser` (compara password con bcrypt, usado por `LocalStrategy`), `login(user)` (arma el JWT con `sub`, `email`, `negocioId`, `roles` y `permissions` aplanados sin duplicados).
- `LocalStrategy`/`JwtStrategy`: login por email+password y validación de bearer token.
- `RolesGuard`/`PermissionsGuard` + `@Roles(...)`/`@Permissions(...)`: autorización basada en el payload del JWT (`user.roles[].name`, `user.permissions[]`). No tienen ninguna noción de negocio — el aislamiento entre negocios depende 100% del filtrado por `negocioId` en los services, no de los roles (un "ADMIN" del Negocio A tiene el mismo nivel nominal que uno del Negocio B).
- `AuthController`: `POST /auth/register` (`@Roles('ADMIN')` + `@NegocioId()`), `POST /auth/login`.

## Frontend (`frontend/`)

Implementa las 6 pantallas de un design handoff (dashboard en 3 variantes, listado/detalle de alumnos, portal de alumno mobile), con datos **mock** — todavía no conectado al backend.

- **Tailwind**: tokens de diseño (colores OKLCH, tipografías Plus Jakarta Sans/Inter) en `src/styles.scss` vía `@theme`. Locale `es-AR` registrado en `app.config.ts` para que los `DatePipe` salgan en español.
- **Modelos mock** (`core/models/`): `Alumno`, `Clase` (Fútbol/Taekwondo/Boxeo — **no existe en el backend**, es un concepto que introdujo el diseño), `Cuota` (con un 4º estado `EN_REVISION` que **tampoco existe en el backend**, que solo tiene `PENDIENTE`/`PAGADA`/`VENCIDA`), `Pago` (forma distinta a la del backend: `comprobanteNombre`/`cargadoPor` vs. `comprobanteUrl`/`registradoPor` reales). Esto hay que reconciliarlo cuando se conecte el frontend al backend real.
- **Servicios mock** (`core/services/`): `AlumnosService`, `CuotasService`, `PagosService` — devuelven `Observable` con `of(...).pipe(delay(...))`, pensados para swapear a `HttpClient` sin tocar los componentes.
- **Layout**: `AdminShell` (sidebar responsive, colapsa a barra superior en mobile) envuelve Dashboard y Alumnos; `PortalAlumno` es standalone (sin sidebar), pensado para el alumno logueado.
- **Rutas**: `/dashboard/{resumen,operativo,clases}` (las 3 variantes del diseño, con tabs), `/alumnos` y `/alumnos/:id`, `/portal`.
- **Environments** (`src/environments/`): `development`/`staging`/`production`, cada uno con su `apiUrl` (dev apunta a `http://localhost:3000`; staging/production tienen placeholders `TODO-completar-url-...`). Configurados en `angular.json` (`fileReplacements`) + scripts `start:staging`/`build:staging` en `package.json`.

## Decisiones tomadas

- IDs numéricos autoincrementales en todas las entidades (no UUID).
- Multi-tenancy: una sola DB + columna `negocio`, sin RLS (ver sección dedicada arriba).
- `Rol`/`Permiso` globales, no por negocio.
- `Usuario.email` único **globalmente**, no por negocio — el login (`findByEmail`) se ejecuta sin ningún selector de negocio previo, así que un email único por negocio volvería el login ambiguo (requeriría rediseñar el flujo completo para pedir el negocio antes que las credenciales).
- Tipos "catálogo" con reglas de negocio simples (`EstadoCuota`, `MetodoPago`) → enums de TypeScript.
- Tipos "configurables en runtime" (`Rol`, `Permiso`, `Negocio`) → entidades propias con tabla en la base.
- Relaciones muchos-a-muchos (`Usuario↔Rol`, `Rol↔Permiso`) → `@ManyToMany` + `@JoinTable` simple, sin entidad intermedia explícita.
- Frontend: Tailwind CSS (no Angular Material) para poder calzar el diseño custom del handoff; mock services antes que HttpClient real, ya que el backend no exponía CRUDs todavía cuando se armó el frontend.

## Entorno local

- Postgres corre localmente vía Homebrew bajo el rol del sistema (`santifonzalida`). Se creó un rol `postgres` (superuser, password `postgres`) y la base `gestor_de_cobros` para que coincidan con `backend/.env`.
- **Datos sembrados actualmente en la DB** (recreada desde cero al agregar multi-tenancy): 2 negocios — `Negocio` id 1 "Academia Demo" con admin `admin@test.com` / `test1234`, y `Negocio` id 2 "Escuela de Ceramica" con admin `admin2@test.com` / `test1234`. Ambos comparten el `Rol` global `ADMIN`. Útiles para seguir probando aislamiento cross-tenant a mano.

## Pendientes / deuda técnica conocida

- **Frontend sin conectar al backend real** — es la tarea grande que sigue. Antes de reemplazar los mocks por `HttpClient` hay que: habilitar CORS en el backend (`.env` ya tiene `CORS_ORIGINS` pero no vi ningún `app.enableCors(...)` en `main.ts`), armar el login real en el frontend (hoy no existe: sin `HttpClient` provisto, sin pantalla de login, sin guardado de JWT, portal de alumno con `ALUMNO_ID_SESION` hardcodeado), y reconciliar los modelos (`Clase` no existe en el backend, `Pago` tiene forma distinta, `EstadoCuota` le falta `EN_REVISION`).
- **Sin Postgres Row-Level Security** — decisión consciente, pero significa que no hay ningún backstop a nivel DB si algún query nuevo se olvida el filtro por `negocioId`. Cualquier código nuevo que toque Alumnos/Cuotas/Pagos tiene que seguir el mismo patrón de scoping.
- **Sin tests automatizados de aislamiento cross-tenant** — el chequeo que se hizo fue manual (ver arriba). Sería el candidato ideal para el primer test e2e real del proyecto, justamente porque es la única red de seguridad que existe.
- `UsuarioService.findByRol`/`findByRolWithoutUser` usan `role.name` en un query builder crudo, pero la columna real es `nombre` — mismo bug que ya se corrigió una vez en otro lado (`findByName`), no se tocó acá todavía.
- `RegistrarUsuarioDto` tiene campos `nombre`/`apellido` que `AuthService.register()` nunca usa (no crea ningún `Alumno` vinculado) — o se limpia el DTO, o se completa la lógica de vincular `Usuario.alumno` (y ahí sí, ese alumno tiene que quedar en el mismo negocio que el usuario).
- Si se llega a borrar una `Cuota` que todavía tiene un `Pago` asociado, hoy no hay validación que lo impida ni cascada que lo limpie — queda un `Pago` huérfano (`PagosService.eliminar` tiene un guard defensivo para no romper en ese caso, pero el gap de fondo sigue sin resolver).
- No hay migraciones de TypeORM — se depende de `synchronize: true`, a sacar antes de producción (y recién ahí hay que preocuparse por backfills reales en vez de recrear el schema).
- `AuthController.login` documenta en Swagger un body con `nombre`/`apellido` que en realidad no usa (`login` solo lee `email`/`password`).
