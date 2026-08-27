# NASE Agrotech

Sitio web y material de diseño de NASE Agrotech — venta de drones agrícolas
DJI Agras y repuestos en la Región del Maule, Chile.

Sitio en producción: https://naseagrotech.cl
(origen: Worker `curly-feather-8a3c`)

## Qué contiene este repositorio

Este commit inicial respalda el **frontend del sitio** (`site/`), que hasta
ahora existía únicamente en copias locales y en el Worker desplegado.

```
site/
├── web/                     ★ Frontend en producción (respaldo 20-08-2026, con correcciones)
│   ├── index.html           Home
│   ├── t100/t70p/t55/t25p/dock3/matrice4.html   Páginas de modelo (shells)
│   ├── comparador/repuestos/repuesto.html       Comparador y tienda (shells)
│   └── assets/              css, js (data, plantillas, visor 360) e img (267 archivos)
├── worker/                  ★ Worker y API (respaldo 20-08-2026)
│   ├── src/index.js         Código del Worker recuperado desde Cloudflare
│   ├── wrangler.toml        Reconstruido (verificar antes del primer deploy)
│   └── config-publicada-*.json   Config publicada en D1 (antes/después del 20-08)
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

### El frontend en producción ya está respaldado (20-08-2026)

`site/web/` respalda el sitio que sirve el Worker (HTML shells, JS, CSS y las
267 imágenes optimizadas), descargado desde producción el 20-08-2026, **con las
correcciones de texto e imágenes solicitadas por la clienta el 17-08** ya
aplicadas en el código (ver `docs/Levantamiento-correcciones-NASE-2026-08-20.pdf`).

Las correcciones C1–C13 del levantamiento además quedaron **publicadas en
producción** mediante la configuración de textos en D1 (tabla `config`, el
mismo mecanismo del editor del sitio), por lo que ya se ven en línea sin
deploy. La única pendiente de deploy es **C14 (pie de página:
«DJI Agriculture - Enterprise»)**, porque el footer no es editable por
configuración: sale al ejecutar `wrangler deploy` desde `site/worker/`.

`site/NASE Agrotech.dc.html` (24-07-2026) queda como respaldo de la versión
previa del sitio.

### El backend ahora tiene respaldo del código

| Recurso | Detalle |
|---|---|
| Worker `curly-feather-8a3c` | Sirve el sitio y expone la API en `/api/*` — código en `site/worker/src/index.js` |
| D1 `nase-inventario` | Base de datos, 28 productos cargados |

La API implementa catálogo (`/api/vitrina`), pedidos web, CRUD de productos,
control de stock con historial de movimientos, ventas con descuento automático
de inventario y aprobación de pedidos. El `wrangler.toml` incluido es una
reconstrucción (el original no estaba respaldado): revisar `compatibility_date`
y bindings antes del primer deploy desde el repo.

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

## Acceso administrativo

La variable `ACCESO_ABIERTO` del Worker **debe permanecer en `0`** (verificado
en producción). Con `1`, `POST /api/login` entrega el token de administrador
sin pedir clave y deja el panel administrativo —crear y eliminar productos,
registrar ventas, ajustar stock— accesible públicamente.

Este documento indicó `1` hasta el 20-08-2026, cuando producción ya estaba en
`0`; ese dato desactualizado se copió al `wrangler.toml` reconstruido y un
deploy revirtió el valor por error. El incidente se corrigió el mismo día
(deploy `a46d85c6`) y el valor quedó documentado en
`site/worker/wrangler.toml`. Antes de desplegar, contrastar la configuración
con la del Worker en producción, no con este README.

## Dominio y DNS

`naseagrotech.cl` está registrado en NIC.cl y delegado a Cloudflare
(`bryce.ns.cloudflare.com`, `nadia.ns.cloudflare.com`, 26-08-2026). La zona
se creó importando los 29 registros que servía HostGator, de modo que el
correo y los servicios de cPanel siguieron funcionando durante el cambio.

El sitio se sirve mediante **rutas de Worker**, no mediante Custom Domain:

| Ruta | Worker |
| --- | --- |
| `naseagrotech.cl/*` | `curly-feather-8a3c` |
| `www.naseagrotech.cl/*` | `curly-feather-8a3c` |

Se eligió esa vía porque un Custom Domain exige borrar antes los registros A
del ápice y de `www`, y esos registros son los que mantienen el proxy de
Cloudflare activo sobre la zona. Con rutas, el Worker intercepta la petición
antes de llegar al origen y no hay que tocar el DNS heredado.

**El correo no pasa por el Worker.** Vive en Titan (`mx1.titan.email`,
`mx2.titan.email`, SPF `include:spf.titan.email`) y los subdominios de cPanel
—`mail`, `webmail`, `cpanel`, `ftp`, `autodiscover`— apuntan directo a
`69.6.225.245` en modo *DNS only* (nube gris). Si alguno se pone en naranja,
los puertos de cPanel (2078-2096) dejan de responder. No dar de baja el plan
de HostGator mientras el correo siga alojado ahí.
