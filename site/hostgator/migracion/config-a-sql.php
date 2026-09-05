<?php
/**
 * Genera sql/02-config-inicial.sql a partir de un respaldo de la configuración
 * publicada (site/worker/config-publicada-AAAA-MM-DD.json).
 *
 * Esa configuración es la fila `sitio` de la tabla `config`: contiene los
 * textos e imágenes que el editor del sitio publicó en producción, incluidas
 * las correcciones C1–C13 del levantamiento del 20-08-2026. Sin ella el sitio
 * se ve con los textos originales del HTML.
 *
 * Sirve como red de seguridad: si el volcado de D1 llega completo, 03-datos.sql
 * ya trae esta misma fila y este archivo se vuelve innecesario.
 *
 * Uso:
 *   php config-a-sql.php ../../worker/config-publicada-2026-08-21.json ../sql/02-config-inicial.sql
 */

declare(strict_types=1);

$origen  = $argv[1] ?? __DIR__ . '/../../worker/config-publicada-2026-08-21.json';
$destino = $argv[2] ?? __DIR__ . '/../sql/02-config-inicial.sql';

if (!is_readable($origen)) {
    fwrite(STDERR, "No puedo leer $origen\n");
    exit(1);
}

$config = json_decode((string) file_get_contents($origen), true);
if (!is_array($config)) {
    fwrite(STDERR, "$origen no tiene JSON válido.\n");
    exit(1);
}

// Se guarda en una sola línea, igual que lo escribe la API (json_encode sin
// formato), para que publicar de nuevo desde el panel no cambie nada más.
$valor = json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$escapado = strtr($valor, [
    '\\'   => '\\\\',
    "'"    => "\\'",
    "\n"   => '\\n',
    "\r"   => '\\r',
    "\0"   => '\\0',
    "\x1a" => '\\Z',
]);

$fecha  = gmdate('Y-m-d H:i');
$nombre = basename($origen);
$textos = count($config['textos'] ?? []);
$imgs   = count($config['imagenes'] ?? []);

$sql = <<<SQL
-- Configuración publicada del sitio (fila `sitio` de la tabla `config`).
--
-- Generado por migracion/config-a-sql.php desde
--   site/worker/{$nombre}
-- el {$fecha} UTC.
--
-- Son los textos e imágenes que el editor del sitio tenía publicados en
-- producción: {$textos} textos y {$imgs} imágenes. Importar después de
-- 01-esquema.sql y solo si 03-datos.sql (el volcado de D1) no trae la tabla
-- `config` con esta misma fila.

SET NAMES utf8mb4;

INSERT INTO `config` (`clave`, `valor`, `updated_at`)
VALUES ('sitio', '{$escapado}', UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`), `updated_at` = VALUES(`updated_at`);

SQL;

@mkdir(dirname($destino), 0755, true);
file_put_contents($destino, $sql);
echo "Escrito $destino ($textos textos, $imgs imágenes, "
    . number_format((float) filesize($destino) / 1024, 1) . " kB)\n";
