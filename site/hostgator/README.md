# Paquete de migración a HostGator

Todo lo necesario para servir el sitio de NASE Agrotech desde un hosting con
cPanel (Apache + PHP 8 + MySQL), en reemplazo del Worker de Cloudflare y su
base D1.

El procedimiento paso a paso está en **[`docs/migracion-hostgator.md`](../../docs/migracion-hostgator.md)**.

```
site/hostgator/
├── api/
│   ├── index.php           La API completa: el puerto de site/worker/src/index.js
│   ├── db.php              Configuración, conexión PDO y utilidades
│   └── config.example.php  Plantilla de credenciales (copiar a ~/nase-config.php)
├── public_html/
│   └── .htaccess           Rutas /api/*, cabecera Authorization, HTTPS, caché
├── sql/
│   ├── 01-esquema.sql          Las nueve tablas en MySQL
│   └── 02-config-inicial.sql   Textos publicados (C1–C13) por si D1 no se puede exportar
├── migracion/
│   ├── exportar-d1.sh      Vuelca D1 a JSON con wrangler
│   ├── d1-a-mysql.php      Convierte esos JSON en 03-datos.sql
│   └── config-a-sql.php    Regenera 02-config-inicial.sql desde un respaldo
├── pruebas/
│   ├── smoke.php           62 comprobaciones sobre la API
│   └── router-local.php    Servidor de desarrollo que imita al .htaccess
└── empaquetar.sh           Arma el ZIP que se sube a public_html
```

## Qué cambia y qué no

El frontend **no se toca**: sigue llamando a `/api/…` con rutas relativas, así
que funciona igual servido por Apache que por el Worker. Lo que se reescribió es
la capa que estaba atada a Cloudflare.

| En Cloudflare | En HostGator |
|---|---|
| `env.ASSETS.fetch(request)` | Apache sirve los archivos de `public_html` |
| Enrutado dentro de `fetch()` | `RewriteRule ^api(/.*)?$ api/index.php` |
| `env.DB` (D1, SQLite) | PDO sobre MySQL |
| `db.prepare(...).first()/.all()` | `fila()` / `filas()` en `db.php` |
| `ON CONFLICT … DO UPDATE` | `ON DUPLICATE KEY UPDATE` |
| `r.meta.last_row_id` | `PDO::lastInsertId()` |
| secret `ADMIN_TOKEN` | `admin_token` en `~/nase-config.php` |
| var `ACCESO_ABIERTO` | `acceso_abierto` (sigue debiendo ser `'0'`) |

Las rutas, los nombres de los campos y los códigos de estado son los mismos: 23
rutas bajo `/api/`, de `salud` a `resumen`.

Tres diferencias deliberadas respecto del Worker:

1. **Las ventas y el cierre de conteos ocurren dentro de una transacción.** D1
   no las agrupaba: si fallaba a mitad quedaba una venta con el stock
   descontado a medias.
2. **Los errores 500 ya no publican el detalle técnico.** El Worker devolvía
   `e.message` al navegador; aquí eso queda en el log de errores de cPanel y el
   visitante recibe un mensaje genérico. Con `'debug' => true` en la
   configuración vuelve el detalle, para diagnosticar.
3. **La clave se compara con `hash_equals()`**, que no filtra información por el
   tiempo que tarda en responder.

Y una nota de portabilidad: el código no depende de extensiones opcionales de
PHP. Solo necesita PDO con MySQL y JSON, que vienen en cualquier cPanel. El
recorte de textos usa `corta()` en vez de `mb_substr()` porque `mbstring` no
siempre está activado —sin ese cambio, registrar un pedido devolvía error 500—,
y `slug()` funciona aunque falte `iconv`.

## Probar en el computador antes de subir

Requiere PHP 8 y un MySQL/MariaDB local:

```bash
mysql -e "CREATE DATABASE nase_prueba CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql nase_prueba < site/hostgator/sql/01-esquema.sql

NASE_DB_DSN='mysql:host=127.0.0.1;dbname=nase_prueba;charset=utf8mb4' \
NASE_DB_USER=root NASE_DB_PASS= NASE_ADMIN_TOKEN='clave-de-prueba' \
php -S 127.0.0.1:8080 -t site/web site/hostgator/pruebas/router-local.php

# en otra terminal
php site/hostgator/pruebas/smoke.php http://127.0.0.1:8080 'clave-de-prueba'
```

`smoke.php` recorre las mismas llamadas que hacen el sitio, el panel de
inventario y el de bodega, y comprueba desde el catálogo público hasta el cierre
de un conteo con ajuste de stock.
