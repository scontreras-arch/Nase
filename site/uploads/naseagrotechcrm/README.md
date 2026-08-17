# NASE Agrotech · CRM

CRM de **venta de drones agrícolas** (DJI Agras). Pipeline comercial con
clasificación de leads, recomendación automática de modelo según el área,
seguimiento de próxima acción, control de cotización de competencia y filtro
por vendedor.

**Stack**: Supabase (Postgres + Auth) + Vanilla JS (sin build, sin npm).
**Deploy**: subir la carpeta a cualquier hosting estático (Cloudflare Pages,
Vercel, Netlify) + correr una migración SQL en Supabase.
**Base**: misma arquitectura del CRM YoloTech v5, adaptada al negocio de drones.

---

## Qué clasifica cada lead

| Campo | Detalle |
|---|---|
| **Clasificación** | `Agrícola` o `Industrial` |
| **Tipo de cultivo** | sólo si es Agrícola (Maíz, Arroz, Palta, Caña, Café…) |
| **Área de cultivo (ha)** | hectáreas — de acá sale el modelo sugerido |
| **Fecha tentativa de aplicación** | sólo si es Agrícola |
| **Modelo recomendado** | DJI Agras T25 / T50 / T75 / T100 — **autocompletado por área, editable** |
| **Estado (pipeline)** | Lead → Calificado → Cotizado → Negociando → Ganado / Perdido / Pausado |
| **Próxima acción + fecha** | seguimiento (vista Agenda, alertas de vencido) |
| **¿Cotización de competencia?** | Sí/No. Si es **No**, se marca el **hito "conseguir cotización de competencia"** |
| **Vendedor** | por defecto = quien crea el lead; el Pipeline se filtra por vendedor |
| Valor estimado, moneda, probabilidad, origen, contacto, notas | comercial / contacto |

### Recomendación de modelo (editable en `core/constants.js`)

```
área ≤ 30 ha   → DJI Agras T25
área ≤ 80 ha   → DJI Agras T50
área ≤ 200 ha  → DJI Agras T75
área > 200 ha  → DJI Agras T100
```

El modelo se sugiere solo al escribir el área, pero el vendedor puede cambiarlo
en el formulario (queda respetado su valor).

---

## Estructura

```
nase-agrotech-crm/
├── index.html            # app real (Supabase + login)
├── styles.css            # tema oscuro agro (verde NASE)
├── config.example.js     # → copiar a config.js con tus claves Supabase
├── main.js               # boot
├── core/
│   ├── constants.js      # dominio, reglas de modelo, estado global, helpers
│   ├── auth.js           # login + loadData + saveLead/deleteLead (vendedor, auditoría)
│   └── events.js         # setupEvents (nav, botones, filtros)
├── modules/crm/
│   └── crm.js            # dashboard, pipeline, agenda, auditoría, formulario de lead
├── assets/
│   └── logo-nase.jpg
├── migrations/
│   └── 01_schema.sql     # tablas leads + audit_log + RLS + triggers (auditoría automática)
├── demo.html             # demo navegable con datos de ejemplo (SIN login)
├── demo.data.js          # cliente Supabase falso + 10 leads de ejemplo (3 vendedores)
└── demo-standalone.html  # TODO en un solo archivo (para mandar/abrir sin servidor)
```

---

## Vistas

- **Dashboard** — KPIs (pipeline activo/ponderado, win rate, acciones de hoy, *falta cotización de competencia*), tabla priorizada y filtros (estado, clasificación, cultivo, **vendedor**, búsqueda).
- **Pipeline** — kanban por estado; cada tarjeta muestra vendedor, cultivo/área, modelo y alertas.
- **Agenda** — próximas acciones ordenadas + bloque destacado de leads **sin cotización de competencia** (hito).
- **Auditoría** — historial de cambios (lo registran triggers en Postgres).

---

## Puesta en marcha

1. **Supabase**: creá un proyecto → SQL Editor → pegá y ejecutá `migrations/01_schema.sql`.
2. **Config**: copiá `config.example.js` → `config.js` con tu `SUPABASE_URL` y `anon key`.
3. **Auth**: en Supabase → Authentication, creá los usuarios/vendedores (email+password).
4. **Deploy**: subí la carpeta a Cloudflare Pages / Vercel / Netlify (o abrí `index.html` en local).
5. El **vendedor** de cada lead se toma del usuario que lo crea; se puede editar en el formulario.

> **Demo sin backend**: abrí `demo.html` (o `demo-standalone.html`) para ver el CRM
> funcionando con datos de ejemplo, sin login ni Supabase. Ideal para mostrarlo.

---

## Import / Export

- **+ Nuevo** / **JSON**: crear leads a mano o pegando un objeto/array JSON.
- **Exportar CSV**: baja todos los leads (mismas columnas que usa el importador).
