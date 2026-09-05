# Pruebas de la API portada

`smoke.php` levanta 62 comprobaciones contra una instancia real de la API:
rutas públicas, autorización, alta y edición de productos, movimientos de stock,
catálogo, publicación de textos e imágenes, pedidos del carrito, aprobación de
pedidos con descuento de inventario, ventas, conteos de bodega y resumen.

## Cómo ejecutarlas

1. Crear una base vacía e importar el esquema:

   ```bash
   mysql -e "CREATE DATABASE nase_prueba CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql nase_prueba < ../sql/01-esquema.sql
   ```

2. Levantar el servidor de desarrollo (imita lo que hace el `.htaccess`):

   ```bash
   NASE_DB_DSN='mysql:host=127.0.0.1;dbname=nase_prueba;charset=utf8mb4' \
   NASE_DB_USER=root NASE_DB_PASS= NASE_ADMIN_TOKEN='clave-de-prueba' \
   php -S 127.0.0.1:8080 -t ../../web router-local.php
   ```

3. Ejecutarlas:

   ```bash
   php smoke.php http://127.0.0.1:8080 'clave-de-prueba'
   ```

Terminan con `TODO BIEN: 62 comprobaciones, 0 fallidas.` y devuelven código de
salida 0. Conviene partir siempre de una base recién creada: varias
comprobaciones cuentan filas.

## Contra el servidor ya migrado

Las mismas pruebas sirven para verificar HostGator, pero **escriben y borran
datos**, así que solo deben usarse contra una base de prueba, nunca contra la
de producción.
