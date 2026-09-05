<?php
/**
 * Router del servidor de desarrollo de PHP (`php -S`), que no lee .htaccess.
 * Reproduce lo que hace Apache en HostGator: /api/* va al router de la API y
 * todo lo demás se sirve como archivo estático.
 *
 * Uso (desde site/hostgator/pruebas/):
 *   NASE_DB_DSN='mysql:host=localhost;dbname=nase_prueba;charset=utf8mb4' \
 *   NASE_DB_USER=nase NASE_DB_PASS=clave NASE_ADMIN_TOKEN=prueba \
 *   php -S localhost:8080 -t ../../web router-local.php
 */

$camino = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (preg_match('#^/api(/|$)#', $camino)) {
    require getenv('NASE_API') ?: dirname(__DIR__) . '/api/index.php';
    return true;
}

return false;  // el servidor sirve el archivo estático si existe
