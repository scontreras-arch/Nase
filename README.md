# NASE Agrotech

Sitio web y material de diseño de NASE Agrotech — venta de drones agrícolas
DJI Agras y repuestos en la Región del Maule, Chile.

Sitio en producción: https://curly-feather-8a3c.contreras-sma.workers.dev/

## Qué contiene este repositorio

Este commit inicial respalda el **frontend del sitio** (`site/`), que hasta
ahora existía únicamente en copias locales y en el Worker desplegado.

```
site/
├── NASE Agrotech.dc.html    Página del sitio (export de design canvas, 24-07-2026)
├── image-slot.js            Componente de slots de imagen
├── support.js               Utilidades de la página
├── assets/
│   ├── logo-nase.png/.jpg   Logotipos (versión blanca y color)
│   └── guia/                66 imágenes de catálogo por modelo
├── _ds/                     Design system (tokens, componentes, manifest)
├── crm/                     Módulo CRM sobre Supabase (ver crm/README.md)
├── design_handoff_nase_website/
│                            Paquete de entrega de diseño
└── uploads/                 Brief de diseño y guía de material web
```

## Estado del proyecto

### El sitio desplegado es más nuevo que el de este repositorio

`site/NASE Agrotech.dc.html` es del **24-07-2026**. El Worker en producción se
desplegó el **31-07-2026** con un rediseño posterior: agrega las secciones
`#nosotros`, `#modelos-grid`, `#lead-form`, un carrusel de pasos y contacto por
WhatsApp, que no están en este archivo.

Es decir, **este repositorio respalda la versión previa del sitio**, más todos
los assets y el material de diseño. El HTML exacto que hoy sirve producción no
estaba en el zip original y sigue viviendo solo dentro del Worker.

### El backend no está aquí

La infraestructura en Cloudflare, aún sin respaldo en este repositorio:

| Recurso | Detalle |
|---|---|
| Worker `curly-feather-8a3c` | Sirve el sitio y expone la API en `/api/*` |
| D1 `nase-inventario` | Base de datos, 28 productos cargados |

La API implementa catálogo (`/api/vitrina`), pedidos web, CRUD de productos,
control de stock con historial de movimientos, ventas con descuento automático
de inventario y aprobación de pedidos. Falta subir su código fuente
(`src/index.js` y `wrangler.toml`).

### El sitio y la API están desconectados

Ninguna de las dos versiones del HTML — ni la local ni la desplegada — hace
`fetch` a `/api/`. El catálogo del sitio es estático y la API construida no se
consume desde el frontend.

### Datos cargados

Los 28 productos de D1 tienen `precio = 0` y `stock = 0`, por lo que el
catálogo los reporta todos como `a-pedido`. Las tablas `ventas`,
`movimientos`, `pedidos`, `imagenes` y `config` están vacías.

| Modelo | Equipos | Repuestos |
|---|---|---|
| T100 | 1 | 11 |
| T70P | 1 | 9 |
| Enterprise | 2 | — |
| T25P / T55 | 1 c/u | — |
| Común | — | 2 |

## Notas sobre el contenido

- `site/uploads/naseagrotechcrm/` es una **versión anterior** del CRM de
  `site/crm/`, no una copia idéntica: difieren `README.md`,
  `core/constants.js`, `demo-standalone.html`, `demo.data.js` y
  `migrations/01_schema.sql`. Se conservan ambas.
- `site/design_handoff_nase_website/crm/` sí es un subconjunto exacto de
  `site/crm/`, y su `design-system/styles.css` es idéntico al de `_ds/`.
- El CRM espera un `config.js` con las credenciales de Supabase. Se incluye
  `crm/config.example.js` como plantilla; `config.js` está en `.gitignore`.

## Pendiente de revisar

La variable `ACCESO_ABIERTO` del Worker está en `1`. Con ese valor,
`POST /api/login` entrega el token de administrador sin pedir clave, lo que
deja el panel administrativo (crear y eliminar productos, registrar ventas,
ajustar stock) accesible públicamente. Conviene ponerla en `0` y rotar el
token si el sitio ya no está en pruebas.
