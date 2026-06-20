# Smartbreeze HVAC — Demo comercial

Demo visual navegable para presentación comercial del sistema de gestión HVAC institucional (Smartbreeze Innovations).

Inventario centralizado, mantenimientos, alertas, consulta QR simulada y panel administrativo — **en español**, con datos en PostgreSQL e imágenes/QR en Base64.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind 4 |
| Datos | PostgreSQL + Prisma 7 |
| Gráficos | Recharts |
| Auth | Simulada por rol (cookie demo) |

---

## Requisitos

- **Node.js 20+**
- **PostgreSQL:** Render (cloud, recomendado) o Docker local

---

## Instalación y arranque

### Opción A — PostgreSQL en Render (recomendado)

```bash
cd demo

# 1. Variables de entorno
cp .env.example .env
# Editar DATABASE_URL (ver docs/DATABASE.md o ../../db-render.md)

# 2. Dependencias
npm install

# 3. Crear tablas y cargar datos demo
npm run db:setup

# 4. Servidor de desarrollo
npm run dev
```

Abrí **http://localhost:3000**

### Opción B — PostgreSQL local con Docker

```bash
cd demo

# 1. Levantar Postgres
docker compose up -d

# 2. Variables de entorno (URL local del .env.example)
cp .env.example .env

# 3. Instalar, migrar y seed
npm install
npm run db:setup

# 4. Iniciar app
npm run dev
```

Abrí **http://localhost:3000**

### Producción local

```bash
npm run build
npm start
```

### Producción en Vercel (cloud)

Guía paso a paso:

→ **[vercel-deploy-guia.md](./vercel-deploy-guia.md)**

Resumen: conectar repo, Root Directory `Smartbreeze Innovations/demo`, variable `DATABASE_URL` (Render externa), deploy.

---

## Credenciales demo

| Rol | Email | Contraseña | Acceso principal |
|---|---|---|---|
| **Administrador** | `admin@smartbreeze.local` | `sbi2026` | Todos los módulos |
| **Técnico** | `tecnico@smartbreeze.local` | `sbi2026` | Equipos asignados, mantenimientos, repuestos, medidores, alertas |
| **Encargado de Facultad** | `encargado@smartbreeze.local` | `sbi2026` | Panel, alertas, consulta QR |

**Consulta QR de referencia:** [http://localhost:3000/consulta/SBI-0048](http://localhost:3000/consulta/SBI-0048)

---

## Flujo de presentación (5–10 min)

Guía detallada con guión, tiempos y mensajes clave:

→ **[docs/FLUJO-DEMO.md](./docs/FLUJO-DEMO.md)**

**Resumen rápido:**

1. **Admin** → Dashboard (KPIs) → Reportes → Equipos (SBI-0048) → Repuestos → Proveedores → Medidores → Mantenimientos → Alertas
2. **Encargado** → Consulta QR `/consulta/SBI-0048` → Reportar falla
3. **Técnico** → Mantenimientos asignados

---

## Módulos del demo

| Módulo | Ruta | Admin | Técnico | Encargado |
|---|---|:---:|:---:|:---:|
| Login | `/login` | ✅ | ✅ | ✅ |
| Panel operativo | `/dashboard` | ✅ | ✅ | ✅ |
| Equipos HVAC | `/equipos` | ✅ | ✅ asignados | — |
| Mantenimientos | `/mantenimientos` | ✅ | ✅ asignados | — |
| Repuestos | `/repuestos` | ✅ | ✅ | — |
| Proveedores | `/proveedores` | ✅ | ✅ lectura | — |
| Procedimientos | `/procedimientos` | ✅ | ✅ lectura | — |
| Medidores | `/medidores` | ✅ | ✅ | — |
| Alertas | `/alertas` | ✅ | ✅ | ✅ |
| Ubicaciones | `/ubicaciones` | ✅ | — | — |
| Usuarios | `/usuarios` | ✅ | — | — |
| Reportes | `/reportes` | ✅ | — | — |
| Consulta QR | `/consulta/[codigo]` | ✅ | ✅ | ✅ |

---

## Scripts útiles

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run start        # Servidor producción
npm run db:push      # Sincronizar esquema Prisma → PostgreSQL
npm run db:seed      # Recargar datos demo (sin borrar esquema)
npm run db:setup     # push + seed (arranque limpio de datos)
```

---

## Estructura del proyecto

```
demo/
├── docs/
│   ├── DATABASE.md      # Conexión Render / Docker
│   └── FLUJO-DEMO.md    # Guión comercial paso a paso
├── prisma/
│   ├── schema.prisma    # Modelo de datos
│   └── seed.ts          # 9 equipos, 5 ubicaciones, 3 roles
├── src/
│   ├── app/             # Rutas Next.js (App Router)
│   ├── components/      # UI, layout, módulos
│   └── lib/             # Auth demo, Prisma, utilidades
├── docker-compose.yml   # PostgreSQL local
└── .env.example         # Plantilla DATABASE_URL
```

---

## Notas importantes

- **Demo comercial**, no backend de producción.
- Autenticación simulada (sin OAuth ni JWT real).
- QR sin cámara: acceso por URL `/consulta/[codigo]` o dropdown en dashboard.
- Imágenes almacenadas como SVG Base64 en PostgreSQL.
- Diseño inspirado en MaintainX (`../ref/`), adaptado al español e HVAC institucional.

---

## Documentación relacionada

| Archivo | Contenido |
|---|---|
| [docs/FLUJO-DEMO.md](./docs/FLUJO-DEMO.md) | Guión de presentación 5–10 min |
| [docs/DATABASE.md](./docs/DATABASE.md) | PostgreSQL Render + Docker |
| [vercel-deploy-guia.md](./vercel-deploy-guia.md) | Despliegue en Vercel |
| [../checklist.md](../checklist.md) | Plan de desarrollo por fases |
| [../modelo-datos.md](../modelo-datos.md) | Modelo funcional ↔ Prisma |
| [../guia.md](../guia.md) | Alcance demo vs proyecto real |
| [../../db-render.md](../../db-render.md) | Credenciales Render |

---

## Estado del proyecto

Todas las fases del checklist (0–9) están completadas. El demo está listo para presentación comercial.
