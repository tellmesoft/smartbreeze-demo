# Base de datos PostgreSQL

El demo usa **PostgreSQL** con Prisma ORM. Hay dos modos de conexión:

| Modo | Uso |
|---|---|
| **Render (cloud)** | Recomendado para demo compartido y despliegue |
| **Docker local** | Desarrollo offline con `docker-compose.yml` |

---

## Render — instancia `smartbreeze`

| Campo | Valor |
|---|---|
| **Servicio** | smartbreeze |
| **Estado** | Available |
| **PostgreSQL** | 18 |
| **Región** | Oregon (US West) |
| **Hostname** | `dpg-d8qt8i8js32c73ba2gs0-a.oregon-postgres.render.com` |
| **Puerto** | 5432 |
| **Base de datos** | `smartbreeze` |
| **Usuario** | `smartbreeze_user` |
| **Service ID** | `dpg-d8qt8i8js32c73ba2gs0-a` |

> Credenciales completas (contraseña y URLs): ver `../../db-render.md` en la raíz del workspace.

### Configurar `.env`

```env
DATABASE_URL="postgresql://smartbreeze_user:TU_CONTRASEÑA@dpg-d8qt8i8js32c73ba2gs0-a.oregon-postgres.render.com/smartbreeze?sslmode=verify-full"
```

### Sincronizar esquema y datos demo

```bash
npm run db:setup
```

### Conectar con psql

```bash
PGPASSWORD=TU_CONTRASEÑA psql -h dpg-d8qt8i8js32c73ba2gs0-a.oregon-postgres.render.com -U smartbreeze_user smartbreeze
```

### Notas Render

- Instancia **Free** (256 MB RAM, 1 GB storage).
- Expira el **19 de julio de 2026** si no se actualiza a plan pago.
- URL **interna** (solo servicios Render): `dpg-d8qt8i8js32c73ba2gs0-a` sin dominio `.oregon-postgres.render.com`.

---

## Docker local (alternativa)

```bash
docker compose up -d
```

`.env` local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartbreeze_demo?schema=public"
```

---

## Esquema Prisma

Tablas: `usuarios`, `ubicaciones`, `equipos`, `mantenimientos`, `parametros_hvac`, `esterilizaciones`, `evidencias_mantenimiento`, `alertas`.

Ver mapeo funcional completo en `../../modelo-datos.md`.

Imágenes y códigos QR se guardan como **Base64** en columnas `TEXT`.

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run db:push` | Aplica el esquema Prisma a la BD |
| `npm run db:seed` | Carga datos demo en español |
| `npm run db:setup` | `db:push` + `db:seed` |
