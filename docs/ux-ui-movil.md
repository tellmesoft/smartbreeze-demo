# Informe UX/UI móvil — Demo Smartbreeze Innovations

Documento de referencia para adaptar la demo a una experiencia móvil tan sólida como la de escritorio: funcional, legible y usable en campo (técnicos, encargados) y en consulta pública (QR).

**Alcance:** aplicación Next.js en `demo/src`  
**Breakpoint principal master-detail:** `lg` (1024px)  
**Estado actual:** diseño desktop maduro; móvil con base correcta pero brechas recurrentes en scroll, touch targets, safe areas e hidratación.

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Contexto y criterios de diseño](#2-contexto-y-criterios-de-diseño)
3. [Hallazgos transversales](#3-hallazgos-transversales)
4. [Patrones de diseño unificados](#4-patrones-de-diseño-unificados)
5. [Módulos — análisis y cambios](#5-módulos--análisis-y-cambios)
6. [Componentes compartidos a crear o refactorizar](#6-componentes-compartidos-a-crear-o-refactorizar)
7. [Plan de implementación por fases](#7-plan-de-implementación-por-fases)
8. [Checklist de aceptación (QA móvil)](#8-checklist-de-aceptación-qa-móvil)
9. [Inventario de archivos clave](#9-inventario-de-archivos-clave)

---

## 1. Resumen ejecutivo

La demo **ya navega en móvil**: menú lateral tipo drawer, master-detail por query `?id=`, consulta QR apilada en columna única, grids Tailwind que colapsan. Lo que impide una UX “muy buena” en móvil no es falta de responsive, sino **inconsistencias** introducidas al optimizar escritorio (paneles con scroll interno, controles pequeños, modales centrados).

### Cinco líneas de trabajo prioritarias

| # | Tema | Impacto |
|---|------|---------|
| 1 | **Un solo scroll en móvil** | Elimina frustración de “scroll dentro de scroll” |
| 2 | **Safe areas (notch / PWA)** | Contenido visible en iPhone y app instalada |
| 3 | **Touch targets ≥ 44px** | Uso con pulgar y guantes en campo |
| 4 | **Modales → bottom sheet en móvil** | Formularios usables con teclado virtual |
| 5 | **Gráficos y tablas con variante móvil** | Legibilidad en 320–375px |

### Priorización global

| Prioridad | Temas |
|-----------|--------|
| **Alta** | Safe areas en shell; scroll anidado `max-h-[70vh]`; hidratación `useMediaQuery`; ficha equipos; gráficos reportes; modales vs teclado |
| **Media** | PageHeader fijo 28px; touch targets `sm`/chips/tabs; equipos vs master-detail; doble header consulta QR; checklist procedimiento; filtros reportes; tabla usuarios |
| **Baja** | Tipografía 10px en badges; debounce búsqueda procedimientos; espaciador header móvil; micro-badges en listas |

---

## 2. Contexto y criterios de diseño

### Usuarios y contexto de uso

| Rol | Uso móvil típico |
|-----|------------------|
| **Técnico** | Mantenimientos, medidores, repuestos, procedimientos en planta |
| **Administrador** | Supervisión, reportes (menos frecuente en móvil) |
| **Encargado** | Consulta QR pública, reportar falla sin back-office |

### Principios propuestos

1. **Desktop:** densidad informativa, dos columnas, scroll en panel de detalle.
2. **Móvil:** una columna, scroll de página, acciones primarias accesibles con el pulgar.
3. **Coherencia:** mismo patrón master-detail en todos los módulos operativos.
4. **Progressive enhancement:** CSS (`hidden lg:block`) define layout; JS refina interacción.
5. **Campo primero:** botones, checklists y modales pensados para pantalla táctil y teclado.

### Breakpoints de referencia

| Breakpoint | Uso |
|------------|-----|
| `< 640px` (default) | Móvil estrecho (iPhone SE, 320px) |
| `sm` (640px) | Móvil grande / phablet |
| `lg` (1024px) | Master-detail dos columnas |
| `xl` (1280px) | Toolbars y KPIs amplios |

### Viewport y PWA

- `app/layout.tsx` declara `viewportFit: "cover"`.
- Safe areas solo parcialmente aplicadas (`login`, consulta pública en `pb`).
- **Falta:** aplicar safe areas al shell del dashboard de forma sistemática.

---

## 3. Hallazgos transversales

### 3.1 Dashboard shell y sidebar

**Archivos:** `components/layout/dashboard-shell.tsx`, `sidebar.tsx`, `sidebar-nav.tsx`, `app/(dashboard)/layout.tsx`

#### Qué funciona en desktop

- Sidebar fija 252px.
- `main` con scroll único y padding generoso.
- Badges de notificación en nav.

#### Brechas en móvil

| ID | Severidad | Problema | Cambio propuesto |
|----|-----------|----------|------------------|
| T-01 | Alta | Header móvil (`h-16`) y `main` sin `env(safe-area-inset-*)` | `pt-[max(1rem,env(safe-area-inset-top))]` en header; `pb-[max(1rem,env(safe-area-inset-bottom))]` en main |
| T-02 | Alta | `main` scrollea y paneles internos también (`max-h-[70vh]`) | En `< lg`: sin scroll interno en paneles; en `≥ lg`: `calc(100dvh - var(--shell-chrome))` |
| T-03 | Media | Sidebar drawer: `pt-8` fijo; logo bajo notch | Padding superior/inferior con safe area cuando drawer abierto |
| T-04 | Media | Ítems nav `py-2.5` (~40px), en el límite WCAG táctil | `min-h-11`, `gap-3` en enlaces |
| T-05 | Baja | Espaciador `w-10` en header solo para centrar logo | Opcional: acción contextual (perfil, notificaciones) |

#### CSS sugerido (referencia)

```css
:root {
  --shell-header-mobile: 4rem;
  --shell-safe-top: env(safe-area-inset-top, 0px);
  --shell-safe-bottom: env(safe-area-inset-bottom, 0px);
  --panel-max-height: calc(100dvh - var(--shell-header-mobile) - var(--shell-safe-top) - 2rem);
}

@media (min-width: 1024px) {
  .master-detail-panel-scroll {
    max-height: var(--panel-max-height);
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
```

---

### 3.2 PageHeader y barras de filtros

**Archivos:** `components/layout/page-header.tsx`, `equipos/equipos-filters.tsx`, páginas con `toolbar` + `action`

#### Brechas

| ID | Severidad | Problema | Cambio propuesto |
|----|-----------|----------|------------------|
| T-06 | Media | Título fijo `text-[28px]` en todos los viewports | `text-2xl sm:text-[28px]` |
| T-07 | Media | Filtros equipos: 5 controles en columna larga antes de lista | Drawer/colapsable en móvil + chips de filtros activos |
| T-08 | Media | Repuestos: `toolbar` (stock mínimo) + `action` (nuevo) apilan mucho vertical | Stock mínimo colapsado o ícono; botón primario `w-full sm:w-auto` |
| T-09 | Baja | Búsqueda equipos en `onBlur` puede recargar al cerrar teclado | Debounce o botón “Buscar” explícito en móvil |

---

### 3.3 Master-detail compartido

**Archivos:** `master-detail-back.tsx`, `hooks/use-media-query.ts`, workspaces de mantenimientos, medidores, repuestos, proveedores, procedimientos, ubicaciones

#### Qué funciona

- Desktop: `lg:grid-cols-[420px_1fr]`, auto-selección primer ítem.
- Móvil: lista **o** detalle vía `?id=`; componente `MasterDetailBack`.

#### Brechas

| ID | Severidad | Problema | Cambio propuesto |
|----|-----------|----------|------------------|
| T-10 | Alta | `useMediaQuery` retorna `true` en SSR → flash layout desktop | Inicializar `false` en servidor; layout con CSS como fuente de verdad |
| T-11 | Alta | Scroll inconsistente: mantenimientos/medidores/repuestos limitan detalle; procedimientos/proveedores no | Unificar regla T-02 en todos los workspaces |
| T-12 | Media | `MasterDetailBack` con `Button size="sm" ghost` | `size="default"`, `min-h-11`; opcional sticky bajo header móvil |
| T-13 | Media | `FilterChip` con `py-1.5 text-xs` | `min-h-10`, `px-3`, scroll horizontal de chips si no caben |
| T-14 | Baja | Tabs mantenimientos/alertas sin scroll horizontal | `overflow-x-auto`, `flex-nowrap`, `-mx-4 px-4` en móvil |

---

### 3.4 Modales y formularios

**Archivos:** `repuestos-workspace.tsx`, `medidores-workspace.tsx`, `mantenimientos/nuevo-mantenimiento-button.tsx`, `usuarios-workspace.tsx`, `repuestos-stock-minimo-panel.tsx`, modales `nuevo-*`

#### Brechas

| ID | Severidad | Problema | Cambio propuesto |
|----|-----------|----------|------------------|
| T-15 | Alta | Modales centrados; teclado virtual oculta campos | `< sm`: bottom sheet; `≥ sm`: modal centrado |
| T-16 | Alta | Botón cerrar `p-1` (~28px efectivos) | `min-h-11 min-w-11`, `aria-label` claro |
| T-17 | Media | Footer acciones `justify-end`; difícil en móvil | `flex-col-reverse gap-2 w-full` en móvil |
| T-18 | Media | Sin focus trap / scroll lock del fondo (iOS) | Componente Dialog/Sheet compartido (Radix o similar) |
| T-19 | Baja | Formularios largos en modal `max-h-[90vh]` | Handle de arrastre visual en sheet móvil |

#### Comportamiento objetivo del sheet móvil

```
┌─────────────────────────┐
│ ─── (handle)            │
│ Título            [×]   │
├─────────────────────────┤
│                         │
│  Campos (scroll)        │
│                         │
├─────────────────────────┤
│ [ Cancelar ]            │
│ [ Confirmar ]  primary  │
└─────────────────────────┘
     ↑ safe-area-inset-bottom
```

---

### 3.5 Touch targets y tipografía

| Elemento actual | Tamaño aprox. | Objetivo móvil |
|-----------------|---------------|----------------|
| `Button size="sm"` | ~32px alto | `min-h-11` en acciones primarias |
| FilterChip | ~30px | `min-h-10` |
| Checkbox procedimiento | 16×16px | 20×20px + fila `min-h-11` clickeable |
| Tabs `py-2 text-sm` | ~36px | `min-h-10` o scroll horizontal |
| Badges `text-[10px]` | Solo lectura | Mantener en listas; no usar como único control |
| Inputs reportes `h-8` | 32px | `h-10` mínimo |

**Referencia:** Apple HIG y Material recomiendan ~44–48px para targets táctiles primarios.

---

## 4. Patrones de diseño unificados

Tabla guía para implementación consistente:

| Patrón | Escritorio (`≥ lg`) | Móvil (`< lg`) |
|--------|---------------------|----------------|
| **Master-detail** | 2 columnas; lista + detalle visibles | Lista **o** detalle (`?id=`); `MasterDetailBack` visible |
| **Scroll del detalle** | Panel con `max-height` calculado + `overflow-y-auto` | Scroll del `main` (sin caja interna) |
| **Acciones primarias** | Toolbar inline, `size="sm"` aceptable | `w-full` o botones apilados, `min-h-11` |
| **Modales** | Centrados `max-w-md/lg` | Bottom sheet `max-h-[90dvh]` |
| **Filtros** | Barra horizontal / grid | Colapsable + chips activos scroll horizontal |
| **Gráficos Recharts** | Labels en ejes, leyenda lateral | Leyenda abajo; menos ticks; tooltips |
| **Tablas** | Tabla completa | Cards por fila (`< md`) |
| **PageHeader título** | `text-[28px]` | `text-2xl` |
| **Consulta QR informe** | Grid 2 columnas (datos + reporte) | Columna única; métricas 1 col en `< sm` |

---

## 5. Módulos — análisis y cambios

### 5.1 Equipos HVAC

**Archivos:** `app/(dashboard)/equipos/page.tsx`, `components/equipos/equipos-list.tsx`, `equipos-filters.tsx`, `app/(dashboard)/equipos/[id]/page.tsx`

| Aspecto | Desktop | Gap móvil | Cambios |
|---------|---------|-----------|---------|
| Navegación | Lista + placeholder derecho | Navega a `/equipos/[id]` (distinto a otros módulos) | Opcional: patrón `?id=` + detalle en misma ruta |
| Ficha `[id]` | Card con `max-h-[70vh]` scroll interno | Doble scroll; título fuera del panel | Quitar `max-h-[70vh]` en `< lg`; sticky subheader opcional |
| Lista | Badge estado visible | `hidden sm:inline-flex` oculta estado | Mostrar badge o dot de color en móvil |
| Volver | Link texto `text-sm` | Poco prominente | `MasterDetailBack` o barra sticky código + estado |

**Detalle ficha — secciones afectadas en móvil:** información técnica, medidores, mantenimientos, QR, alertas, formulario reportar alerta.

---

### 5.2 Mantenimientos

**Archivos:** `mantenimientos-workspace.tsx`, `mantenimientos/page.tsx`, `procedimiento-ejecucion.tsx`, `nuevo-mantenimiento-button.tsx`

| Gap | Cambio |
|-----|--------|
| Detalle denso: 4 botones estado + historial `<details>` + procedimiento | Botones estado: grid 2×2 o menú “Cambiar estado” |
| Checklist PASS/FLAG/FAIL y checkboxes pequeños | Filas `min-h-11`; checkbox ≥ 20px; botones resultado más grandes en móvil |
| Modal nuevo mantenimiento | Sheet en móvil; safe area con teclado |
| Tabs Pendientes / Realizados | Scroll horizontal si wrap |
| Scroll detalle | Aplicar regla T-02 |

**Contenido crítico en móvil:** advertencia regresión desde Completado, historial de estados, ejecución procedimiento HVAC.

---

### 5.3 Medidores

**Archivos:** `medidores-workspace.tsx`, `medidor-historial-chart.tsx`, `medidor-lecturas-historial.tsx`

| Gap | Cambio |
|-----|--------|
| Gráfico Recharts en detalle | `XAxis` con `angle={-45}`, `interval="preserveStartEnd"`; simplificar en `< sm` |
| Modal registrar lectura | Acciones sticky al fondo + safe area |
| Historial mediciones `<details>` + fetch | OK en móvil; asegurar área táctil del `<summary>` (`py-4`) |
| Scroll detalle | Regla T-02 |

---

### 5.4 Repuestos

**Archivos:** `repuestos-workspace.tsx`, `repuestos/page.tsx`, `repuestos-stock-minimo-panel.tsx`, APIs pedir/ingreso

| Gap | Cambio |
|-----|--------|
| Header: stock mínimo panel + “Nuevo repuesto” | Colapsar stock mínimo en móvil o mover a ícono/config |
| Botones “Reabastecer” / “Confirmar ingreso” `size="sm"` | Tamaño táctil en móvil |
| Reporte pedidos e ingresos (desplegable) | Summary con área táctil amplia; loading spinner ya OK |
| Modales pedir/ingreso | Sheet móvil |
| Scroll detalle | Regla T-02 (ya aplicado en desktop; revisar móvil) |

---

### 5.5 Procedimientos

**Archivos:** `procedimientos-workspace.tsx`, `procedimientos/page.tsx`, `nuevo-procedimiento-button.tsx`

| Gap | Cambio |
|-----|--------|
| Detalle largo (checklist + mantenimientos vinculados) sin scroll acotado en desktop | Unificar scroll con otros workspaces |
| Búsqueda sincroniza URL en cada tecla | Debounce 300ms antes de `router.push` |
| Registro del procedimiento `<details>` | OK; mantener summary táctil |
| Crear procedimiento (técnicos) | Modal/sheet formulario largo → sheet en móvil |

---

### 5.6 Proveedores

**Archivos:** `proveedores-workspace.tsx`, `proveedores/page.tsx`

| Gap | Cambio |
|-----|--------|
| Detalle con listas repuestos + mantenimientos muy largo | Tabs móvil: Info / Repuestos / Mantenimientos |
| Enlaces `mailto:` / `tel:` | Mantener (acción nativa móvil ✓) |
| Scroll detalle | Regla T-02 |

---

### 5.7 Alertas

**Archivos:** `alertas-workspace.tsx`, `alertas/page.tsx`, `reportar-alerta-form.tsx`

| Gap | Cambio |
|-----|--------|
| Tabs filtro (4 pestañas) | Scroll horizontal o segmented control full-width |
| Botones “En revisión” / “Marcar resuelta” pequeños | `w-full sm:w-auto` en móvil |
| Historial estado en tarjeta | Texto denso; considerar truncar con “ver más” |
| Acordeón “Reportar nueva alerta” | Patrón adecuado; verificar `summary` ≥ 44px |

---

### 5.8 Ubicaciones

**Archivos:** `ubicaciones-workspace.tsx`, `ubicaciones-sidebar.tsx`, `ubicacion-detail.tsx`

| Gap | Cambio |
|-----|--------|
| Lista sidebar `max-h-[70vh] overflow-hidden` | En móvil: altura natural o un solo scroll (T-02) |
| Chips facultad `py-1 text-xs` | `min-h-10`; scroll horizontal |
| Detalle con lista equipos larga | Secciones colapsables en móvil |
| Sticky headers facultad | OK en desktop; evaluar espacio en móvil |

---

### 5.9 Consulta QR

**Archivos:**

- Dashboard: `app/(dashboard)/consulta-qr/page.tsx`, `consulta-qr/[codigo]/page.tsx`
- Público: `app/consulta/[codigo]/page.tsx`
- Componentes: `consulta-equipo-informe.tsx`, `simular-escaneo-qr.tsx`, `consulta-qr-card.tsx`, `public-page-header.tsx`

| Gap | Cambio |
|-----|--------|
| Dashboard resultado: doble header (shell + PageHeader) | Móvil: breadcrumb compacto o título reducido |
| Redirect sesión `/consulta/` → `/consulta-qr/` | Mantener ✓ |
| Simulador QR tamaño fijo `h-60` | `max-w-[min(100%,16rem)]`, aspect-square responsive |
| Botón “Escanear QR” hardcodeado `SBI-0048` | Usar `selectedCode` del select |
| Informe: métricas `sm:grid-cols-2` en 320px | En `< sm`: 1 columna para SummaryMetric |
| PublicPageHeader sin safe-area-top | `pt-[env(safe-area-inset-top)]` |
| Texto QR `text-[10px]` | Subir a `text-xs` mínimo |

**Layout objetivo consulta (ya parcialmente implementado):**

```
Desktop (≥ lg):
┌──────────────────────────────────────────────┐
│ Hero: código, estado, foto, QR               │
│ Métricas: 4 cols                             │
├─────────────────────┬────────────────────────┤
│ Datos equipo (grid) │ Reportar falla         │
└─────────────────────┴────────────────────────┘

Móvil:
┌──────────────────┐
│ Hero             │
│ Métricas (1-2col)│
│ Datos equipo     │
│ Reportar falla   │
│ CTA full-width   │
└──────────────────┘
```

---

### 5.10 Reportes

**Archivos:** `components/dashboard/reportes-client.tsx`

| Gap | Cambio |
|-----|--------|
| PieChart: `label` + `Legend` + `outerRadius={90}` solapan en ~360px | Quitar labels en `< md`; leyenda abajo; radio responsive |
| BarChart: XAxis sin rotación | `angle={-30}`, `height={60}`, `tick={{ fontSize: 10 }}` |
| Filtro fechas compacto `h-8` | `h-10` en móvil; botones default size |
| KPIs `sm:grid-cols-2` | OK; verificar padding en 320px |
| Altura gráficos 280px | OK con `min-w-0` |

---

### 5.11 Usuarios

**Archivos:** `components/usuarios/usuarios-workspace.tsx`

| Gap | Cambio |
|-----|--------|
| Tabla 4 columnas + `overflow-x-auto` | `< md`: vista cards (nombre, rol, email, acciones) |
| Header propio (`h1`) vs `PageHeader` | Unificar con resto de módulos |
| Modales crear/editar | Sheet móvil |

---

### 5.12 Dashboard principal

**Archivos:** `app/(dashboard)/dashboard/page.tsx`

| Estado | Notas |
|--------|-------|
| OK en general | KPIs 2 cols, cards apiladas; sin Recharts |
| Baja prioridad | Referencia de stacking correcto para otros módulos |

---

### 5.13 Perfil, login, offline

| Área | Notas |
|------|-------|
| Login | Safe areas parcialmente OK — usar como referencia |
| Perfil | Revisar formulario en móvil con teclado |
| `~offline` | Página PWA; verificar safe areas |

---

## 6. Componentes compartidos a crear o refactorizar

Propuesta para evitar duplicar lógica en cada workspace:

| Componente | Responsabilidad |
|------------|-----------------|
| `ResponsiveModal` | Modal centrado desktop / sheet móvil; focus trap; scroll lock |
| `MasterDetailPanel` | Wrapper con clases scroll desktop / libre móvil |
| `FilterBar` | Filtros colapsables + chips activos |
| `TouchChip` | Chip con `min-h-10` |
| `ResponsiveChart` | Wrapper Recharts con props por breakpoint |
| `StickySubheader` | Código + estado sticky bajo header shell (fichas largas) |
| `useBreakpoint` | Hook sin flash SSR (matchMedia + default false) |

**Ubicación sugerida:** `components/ui/` y `hooks/use-breakpoint.ts`

---

## 7. Plan de implementación por fases

### Fase 1 — Fundamentos (1–2 sprints)

- [ ] T-01, T-02: safe areas + regla scroll móvil/desktop
- [ ] T-10: fix `useMediaQuery` / nuevo `useBreakpoint`
- [ ] T-15, T-16, T-18: `ResponsiveModal` / sheet
- [ ] Documentar variables CSS `--panel-max-height`

**Entregable:** shell usable en iPhone con PWA; sin doble scroll en un módulo piloto (p. ej. medidores).

### Fase 2 — Operación en campo (técnicos)

- [ ] T-12, T-13: MasterDetailBack + FilterChip táctiles
- [ ] Mantenimientos: botones estado + checklist procedimiento
- [ ] Medidores + repuestos: modales sheet
- [ ] Equipos `[id]`: quitar scroll box en móvil; badge en lista

**Entregable:** flujos registrar lectura, pedir repuesto, cambiar estado mantenimiento OK en 375px.

### Fase 3 — Visualización y consulta

- [ ] Reportes: Recharts responsive
- [ ] Medidor historial chart
- [ ] Consulta QR: header compacto, simulador, métricas 1 col
- [ ] Procedimientos: debounce búsqueda

**Entregable:** reportes y consulta QR legibles en móvil.

### Fase 4 — Pulido y consistencia

- [ ] Proveedores, ubicaciones, alertas tabs
- [ ] Usuarios vista cards
- [ ] PageHeader responsive (T-06)
- [ ] QA dispositivos reales

**Entregable:** checklist sección 8 completo.

---

## 8. Checklist de aceptación (QA móvil)

Probar en **iPhone SE (320px)**, **iPhone 14 (390px)**, **Android 360px**, **PWA instalada**.

### Navegación y shell

- [ ] Menú ☰ abre/cierra sin solapar notch
- [ ] Contenido no queda bajo home indicator
- [ ] Volver desde detalle master-detail es obvio y alcanzable con pulgar

### Scroll

- [ ] Ningún módulo tiene scroll anidado involuntario en móvil
- [ ] Ficha equipos scrollea como página única
- [ ] Listas master-detail no cortan contenido con `70vh` en móvil

### Touch e inputs

- [ ] Botones primarios ≥ 44px alto
- [ ] Chips y tabs seleccionables sin error
- [ ] Checklist procedimiento usable con dedo
- [ ] Inputs fecha/número ≥ 40px (`h-10`)

### Modales y formularios

- [ ] Registrar lectura, pedir repuesto, nuevo mantenimiento: campos visibles con teclado
- [ ] Botón cerrar modal fácil de tocar
- [ ] Fondo no scrollea detrás del modal (iOS)

### Contenido rich

- [ ] Gráficos reportes legibles sin solapamiento
- [ ] Gráfico medidor legible
- [ ] Tabla usuarios usable (cards o scroll claro)

### Consulta QR

- [ ] Informe público OK sin login
- [ ] Informe dashboard mantiene sidebar
- [ ] Simulador QR cabe en 320px
- [ ] Reportar falla completable en móvil

### Rendimiento percibido

- [ ] Sin flash layout desktop al cargar en móvil
- [ ] Transiciones lista ↔ detalle fluidas
- [ ] Sin jank al escribir en búsqueda (debounce)

---

## 9. Inventario de archivos clave

| Área | Ruta |
|------|------|
| Shell | `src/components/layout/dashboard-shell.tsx` |
| Sidebar | `src/components/layout/sidebar.tsx`, `sidebar-nav.tsx` |
| PageHeader | `src/components/layout/page-header.tsx` |
| Master-detail | `src/components/layout/master-detail-back.tsx` |
| Breakpoint hook | `src/hooks/use-media-query.ts` |
| Equipos | `src/app/(dashboard)/equipos/page.tsx`, `equipos/[id]/page.tsx`, `components/equipos/*` |
| Mantenimientos | `src/components/mantenimientos/mantenimientos-workspace.tsx`, `procedimiento-ejecucion.tsx` |
| Medidores | `src/components/medidores/medidores-workspace.tsx`, `medidor-historial-chart.tsx` |
| Repuestos | `src/components/repuestos/repuestos-workspace.tsx`, `repuesto-movimientos-historial.tsx` |
| Procedimientos | `src/components/procedimientos/procedimientos-workspace.tsx` |
| Proveedores | `src/components/proveedores/proveedores-workspace.tsx` |
| Alertas | `src/components/alertas/alertas-workspace.tsx`, `reportar-alerta-form.tsx` |
| Ubicaciones | `src/components/ubicaciones/ubicaciones-workspace.tsx` |
| Consulta QR | `src/app/consulta/[codigo]/page.tsx`, `src/app/(dashboard)/consulta-qr/`, `src/components/consulta/*` |
| Reportes | `src/components/dashboard/reportes-client.tsx` |
| Usuarios | `src/components/usuarios/usuarios-workspace.tsx` |
| Viewport | `src/app/layout.tsx` |

---

## Historial del documento

| Fecha | Notas |
|-------|-------|
| 2026-06-20 | Informe inicial tras auditoría responsive post-mejoras desktop (scroll paneles, consulta QR en dashboard, reportes compactos) |

---

*Este documento describe cambios propuestos; no implica que estén implementados. Actualizar conforme se cierren ítems del plan por fases.*
