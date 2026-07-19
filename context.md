# Gestor de Cobros — Contexto del proyecto

Backend en NestJS + TypeORM + PostgreSQL para gestionar alumnos, cuotas, pagos y usuarios con roles/permisos.

## Stack

- NestJS 10, TypeScript
- TypeORM (`typeorm` + `@nestjs/typeorm`) — `synchronize: true` en desarrollo (ver `src/app.module.ts`), sin migraciones todavía
- PostgreSQL (local, vía Homebrew)
- Passport (`passport-jwt`, `passport-local`) para auth
- bcrypt para hash de contraseñas
- Swagger (`@nestjs/swagger`) en los DTOs/controllers de auth

## Módulos y entidades

### Alumnos (`src/alumnos/`)

`Alumno` ([alumno.entity.ts](backend/src/alumnos/modelo/alumno.entity.ts)):
- `id` (PK autoincremental, no UUID)
- `nombre`, `apellido`
- `telefono?`, `email?` (opcionales)
- `fechaAlta`, `activo`
- `usuario?` — `OneToOne` con `Usuario`, opcional (`@JoinColumn` del lado de Alumno; un alumno puede no tener login propio)
- `cuotas` — `OneToMany` con `Cuota`

### Usuarios (`src/usuarios/`)

`Usuario` ([usuario.entity.ts](backend/src/usuarios/modelo/usuario.entity.ts)):
- `id`, `email` (único), `password` (hash bcrypt)
- `fechaAlta`, `fechaModificacion`, `ultimoAcceso`
- `alumno` — inverso del `OneToOne` con Alumno
- `roles` — `ManyToMany` con `Rol` vía `@JoinTable` (`roles_usuarios`), **no tiene** entidad intermedia propia
- Nota: `nombre`/`apellido` NO viven acá, están en `Alumno`

`Rol` ([rol.entity.ts](backend/src/usuarios/modelo/rol.entity.ts)):
- `id`, `nombre` (único), `descripcion`
- `permisos` — `ManyToMany` con `Permiso` vía `@JoinTable` (`permiso_roles`)

`Permiso` ([permiso.entity.ts](backend/src/usuarios/modelo/permiso.entity.ts)):
- `id`, `nombre` (único), `descripcion`

> Se evaluó una tabla intermedia explícita (`RolPermiso`) para poder sumarle columnas propias en el futuro, pero se terminó optando por `@ManyToMany` + `@JoinTable` simple (sin columnas extra en el pivot). Si en algún momento se necesita guardar quién asignó un permiso a un rol, o desde cuándo, hay que migrar ese vínculo a una entidad explícita — no se puede agregar columnas a una tabla `@JoinTable` implícita.

`UsuarioService` ([usuarios.service.ts](backend/src/usuarios/servicios/usuarios.service.ts)): CRUD básico + `findByEmail` / `findByIdWithRelations` (traen `roles.permisos`), `findByRol` / `findByRolWithoutUser` (filtran por `role.name` en query builder — **atención**: esto referencia el alias SQL, no la propiedad TS `nombre`; confirmar que el alias devuelto por Postgres realmente se llama así o ajustar a `role.nombre`), `findByName` (busca `Rol` por `nombre`).

`UsuariosModule` exporta tanto `UsuarioService` como el `TypeOrmModule.forFeature([...])` (necesario para que otros módulos, como Auth, puedan inyectar `@InjectRepository(Rol)` directamente).

### Cuotas (`src/cuotas/`)

`Cuota` ([cuota.entity.ts](backend/src/cuotas/modelo/cuota.entity.ts)):
- `id`, `alumno` (`ManyToOne`), `mes`, `anio`, `monto`
- `estado: EstadoCuota` (enum: `PENDIENTE`, `PAGADA`, `VENCIDA`)
- `fechaVencimiento`
- `pago` — `OneToOne` con `Pago` (`@JoinColumn` del lado de Cuota)
- `@Unique(['alumno', 'mes', 'anio'])` a nivel entidad — evita cuotas duplicadas del mismo alumno en el mismo período

### Pagos (`src/pagos/`)

`Pago` ([pago.entity.ts](backend/src/pagos/modelo/pago.entity.ts)):
- `id`, `cuota` (inverso del `OneToOne`)
- `metodo: MetodoPago` (enum: `EFECTIVO`, `TRANSFERENCIA`, `TARJETA`, `MERCADOPAGO`)
- `montoPagado`, `fechaPago`
- `comprobanteUrl?` (opcional)
- `registradoPor?` — `ManyToOne` opcional a `Usuario`

### Auth (`src/auth/`)

- `AuthService` ([auth.service.ts](backend/src/auth/services/auth.service.ts)): `register` (crea `Usuario` + asigna `Rol` por nombre), `validateUser` (usado por `LocalStrategy`, compara password con bcrypt), `login` (arma JWT payload con `roles` y `permissions` aplanados y sin duplicados), `findRolByName` (usa `@InjectRepository(Rol)` directo, además de `UsuarioService`)
- `LocalStrategy` / `JwtStrategy`: login por email+password y validación de bearer token respectivamente
- `RolesGuard` / `PermissionsGuard` + decoradores `@Roles(...)` / `@Permissions(...)`: autorización basada en lo que quedó en el payload del JWT (`user.roles[].name`, `user.permissions[]`)
- `AuthController`: `POST /auth/register` (protegido con `@Roles('ADMIN')`), `POST /auth/login`

## Decisiones tomadas

- IDs numéricos autoincrementales en todas las entidades (no UUID).
- Tipos "catálogo" con reglas de negocio simples (`EstadoCuota`, `MetodoPago`) → enums de TypeScript.
- Tipos "configurables en runtime" (`Rol`, `Permiso`) → entidades propias con tabla en la base.
- Relaciones muchos-a-muchos (`Usuario↔Rol`, `Rol↔Permiso`) → `@ManyToMany` + `@JoinTable` simple, sin entidad intermedia explícita (se puede migrar a explícita si hace falta guardar metadata del vínculo).

## Entorno local

- Postgres corre localmente vía Homebrew bajo el rol del sistema (`santifonzalida`), no `postgres`. Se creó manualmente un rol `postgres` (superuser, password `postgres`) y la base `gestor_de_cobros` para que coincidan con `backend/.env`.
- `backend/.env` define `DB_USER`, pero `src/app.module.ts` lee `process.env.DB_USERNAME` (no `DB_USER`) — **mismatch pendiente de corregir**, hoy `username` le llega `undefined` a `TypeOrmModule.forRoot`. Ajustar uno de los dos lados.

## Pendientes / deuda técnica conocida

- Corregir el mismatch `DB_USER` vs `DB_USERNAME` en `app.module.ts` / `.env`.
- Revisar `findByRol` / `findByRolWithoutUser` en `UsuarioService`: usan alias `role.name` en el query builder crudo, confirmar que corresponde a la columna real (`nombre`) según cómo TypeORM nombra las columnas de relación en el SQL generado.
- No hay migraciones de TypeORM — se depende de `synchronize: true`, a sacar antes de producción.
- `AuthController.login` documenta en Swagger un body con `nombre`/`apellido` que en realidad no usa (`login` solo lee `email`/`password`).
