# Flujo de presentación comercial (5–10 min)

Guía paso a paso para mostrar el demo Smartbreeze HVAC a un cliente institucional.

**Requisitos previos:** app corriendo en `http://localhost:3000` con datos seed cargados (`npm run db:setup`).

---

## Credenciales

| Rol | Email | Contraseña | Uso en la demo |
|---|---|---|---|
| **Administrador** | `admin@smartbreeze.local` | `sbi2026` | Visión global, reportes, equipos, alertas |
| **Técnico** | `tecnico@smartbreeze.local` | `sbi2026` | Mantenimientos asignados, resolución operativa |
| **Encargado de Facultad** | `encargado@smartbreeze.local` | `sbi2026` | Consulta QR y reporte de fallas |

**Equipo de referencia QR:** `SBI-0048` → `/consulta/SBI-0048`

---

## Guión sugerido (~8 minutos)

### 1. Contexto y login Admin (1 min)

1. Abrir `/login`.
2. Ingresar **admin@smartbreeze.local** / **sbi2026**.
3. **Mensaje clave:** *“La plataforma centraliza el inventario HVAC institucional con roles diferenciados: administración, técnicos y encargados de facultad.”*

**Pantalla:** Panel operativo (`/dashboard`).

- Mostrar KPIs: equipos registrados, operativos, mantenimientos pendientes, alertas abiertas.
- Señalar widget **Próximos vencimientos** (mantenciones en los próximos 30 días).
- Clic en **Ir a reportes** o sidebar → **Reportes**.

---

### 2. Reportes administrativos (1 min)

**Ruta:** `/reportes`

- Mostrar gráficos: mantenimientos por estado, equipos por estado, alertas por prioridad, abiertos vs completados.
- Aplicar **filtro por fechas** (ej. último mes) para demostrar análisis temporal.
- **Mensaje clave:** *“El administrador tiene visión consolidada para planificar recursos y priorizar intervenciones.”*

---

### 3. Inventario de equipos (1,5 min)

**Ruta:** sidebar → **Equipos** (`/equipos`)

- Usar filtros: facultad **Ingeniería**, edificio **Raúl Devés**.
- Abrir equipo **SBI-0048 — Split mural — Sala 302**.
- En la ficha mostrar:
  - Datos técnicos (marca Anwo, BTU, refrigerante R410A).
  - Código QR y enlace **Ver consulta QR**.
  - Historial de mantenimientos con parámetros HVAC (equipo demo completo).
- **Mensaje clave:** *“Cada unidad tiene trazabilidad: ubicación, técnico asignado, QR único y historial de intervenciones.”*

*(Opcional Admin)* Clic en **+ Nuevo equipo** para mostrar alta de activos.

---

### 4. Mantenimientos programados (1,5 min)

**Ruta:** sidebar → **Mantenimientos** (`/mantenimientos`)

- Pestaña **Pendientes**.
- Seleccionar **Inspección chiller — Trane CGAM** (prioridad alta, en progreso).
- Cambiar estado (ej. **En espera** → **En progreso**).
- Mostrar checklist **PASS / FLAG / FAIL** (inspección visual demo).
- Señalar recurrencia: *“Se repite cada 3 meses”* en mantenimientos completados.
- **Mensaje clave:** *“Los técnicos gestionan órdenes de trabajo con prioridad, fechas y registro de parámetros HVAC.”*

---

### 5. Alertas e incidencias (1 min)

**Ruta:** sidebar → **Alertas** (`/alertas`)

- Filtro **Abiertas**.
- Mostrar alerta del **Extractor Auditorio** (prioridad alta).
- Clic **En revisión** → **Marcar resuelta**.
- Señalar badge numérico en el sidebar.
- **Mensaje clave:** *“Las fallas reportadas por encargados llegan al equipo técnico con prioridad y seguimiento de estado.”*

---

### 6. Vista Encargado — Consulta QR (1,5 min)

1. Cerrar sesión (botón en sidebar).
2. Login **encargado@smartbreeze.local** / **sbi2026**.
3. En el dashboard, sección **Consulta QR simulada**:
   - Elegir **SBI-0048** en el dropdown **o** clic en **Demo SBI-0048**.
4. **Ruta pública:** `/consulta/SBI-0048` (sin login completo).

Mostrar en la vista móvil-friendly:

- Estado del equipo, edificio, próxima mantención, técnico responsable.
- Formulario **Reportar falla** (describir una falla de prueba y enviar).
- **Mensaje clave:** *“El encargado de facultad escanea el QR y consulta el estado sin entrar al back-office; puede reportar incidencias en el momento.”*

Volver a **Alertas** como encargado para ver el formulario de reporte desde el panel.

---

### 7. Vista Técnico (1 min)

1. Cerrar sesión.
2. Login **tecnico@smartbreeze.local** / **sbi2026**.

- Dashboard: solo sus KPIs y mantenimientos relevantes.
- **Mantenimientos:** pestaña Pendientes → sección **Asignados a ti**.
- Sidebar sin módulos de Admin (usuarios, ubicaciones, reportes).
- **Mensaje clave:** *“Cada rol ve únicamente lo que necesita para operar: el técnico se enfoca en sus equipos y tareas.”*

---

### 8. Cierre (30 s)

- Volver a Admin o resumir las tres experiencias.
- **Mensaje de cierre:** *“Este demo muestra la experiencia completa del producto real: inventario, mantenimiento, alertas, consulta QR y panel administrativo — listo para escalar a autenticación real, APIs e integración con QR físico.”*

---

## Atajos útiles durante la demo

| Acción | URL / atajo |
|---|---|
| Consulta QR directa | `/consulta/SBI-0048` |
| Equipo referencia | Buscar `SBI-0048` en Equipos |
| Reportes | `/reportes` (solo Admin) |
| Recargar datos demo | `npm run db:seed` |
| Reset completo BD | `npm run db:setup` |

---

## Variante rápida (5 min)

Si el tiempo es limitado, omitir Ubicaciones y Reportes con filtro:

1. Login Admin → Dashboard (KPIs + vencimientos).
2. Equipos → SBI-0048 → QR.
3. Mantenimientos → cambiar un estado.
4. Alertas → marcar una resuelta.
5. Encargado → `/consulta/SBI-0048` → reportar falla.

---

## Tips de presentación

- **Móvil:** abrir `/consulta/SBI-0048` en el teléfono para mostrar la vista encargado en pantalla pequeña.
- **Sidebar móvil:** en viewport estrecho, usar el menú ☰ para navegar entre módulos.
- **Datos:** todos los equipos usan marcas HVAC reales (Carrier, Trane, Daikin, etc.) en contexto universitario chileno.
- **No es producción:** aclarar que auth, QR con cámara e integraciones externas son alcance del proyecto real (21 días hábiles por etapas).

---

## Checklist pre-demo

- [ ] `npm run db:setup` ejecutado sin errores
- [ ] `npm run dev` corriendo
- [ ] `.env` con `DATABASE_URL` válida (Render o Docker)
- [ ] Navegador en español, ventana maximizada o proyector configurado
- [ ] (Opcional) Segunda pestaña o móvil con `/consulta/SBI-0048` precargada
