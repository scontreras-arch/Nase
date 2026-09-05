<?php
/**
 * Convierte los volcados JSON de D1 (los que deja exportar-d1.sh) en un archivo
 * .sql de INSERT listo para importar en la base MySQL de HostGator.
 *
 * Uso:
 *   php d1-a-mysql.php [carpeta-de-json] [archivo-de-salida]
 *   php d1-a-mysql.php ./export-d1 ../sql/03-datos.sql
 *
 * Detalles que resuelve:
 *   - D1 guarda los booleanos como 0/1 y las fechas como texto: se copian tal
 *     cual, que es lo que espera el esquema MySQL.
 *   - Las imágenes en base64 (data: URI) pueden pesar cientos de kB, así que se
 *     escribe UNA sentencia por fila y no un INSERT gigante: así ninguna supera
 *     el max_allowed_packet del servidor.
 *   - Si una columna de D1 ya no existe en el esquema MySQL se avisa y se omite,
 *     en vez de dejar el import a medias.
 */

declare(strict_types=1);

/** Columnas admitidas por tabla, en el orden del esquema 01-esquema.sql. */
const TABLAS = [
    'productos' => ['id', 'sku', 'sku_summit', 'pn_dji', 'nombre', 'modelo', 'tipo', 'nota',
        'descripcion', 'ficha', 'imagen', 'imagenes', 'precio', 'moneda', 'stock', 'stock_min',
        'ubicacion', 'activo', 'vitrina', 'orden', 'origen', 'updated_at'],
    'movimientos' => ['id', 'producto_id', 'tipo', 'cantidad', 'stock_resultante', 'motivo', 'usuario', 'fecha'],
    'imagenes'    => ['clave', 'url', 'descripcion', 'updated_at'],
    'config'      => ['clave', 'valor', 'updated_at'],
    'pedidos'     => ['id', 'nombre', 'telefono', 'correo', 'comuna', 'comentario', 'items',
        'estado', 'venta_id', 'resuelto_en', 'fecha'],
    'ventas'      => ['id', 'numero', 'cliente', 'contacto', 'documento', 'total', 'notas',
        'origen', 'pedido_id', 'usuario', 'fecha'],
    'venta_items' => ['id', 'venta_id', 'producto_id', 'nombre', 'cantidad', 'precio', 'subtotal'],
    'conteos'     => ['id', 'nombre', 'alcance', 'usuario', 'notas', 'estado', 'items',
        'ajustados', 'cerrado_en', 'creado_en'],
    'conteo_items' => ['id', 'conteo_id', 'producto_id', 'esperado', 'contado', 'diferencia',
        'usuario', 'updated_at'],
];

/** Extrae las filas de un volcado de `wrangler d1 execute --json`. */
function filas_de($json): array
{
    if (is_array($json) && isset($json[0]['results'])) {
        return $json[0]['results'];
    }
    if (is_array($json) && isset($json['results'])) {
        return $json['results'];
    }
    return is_array($json) ? $json : [];
}

/** Convierte un valor de D1 en un literal SQL de MySQL. */
function literal($v): string
{
    if ($v === null) {
        return 'NULL';
    }
    if (is_bool($v)) {
        return $v ? '1' : '0';
    }
    if (is_int($v)) {
        return (string) $v;
    }
    if (is_float($v)) {
        return rtrim(rtrim(sprintf('%.6F', $v), '0'), '.') ?: '0';
    }
    if (is_array($v)) {
        $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    $s = strtr((string) $v, [
        '\\'   => '\\\\',
        "'"    => "\\'",
        "\n"   => '\\n',
        "\r"   => '\\r',
        "\t"   => '\\t',
        "\0"   => '\\0',
        "\x1a" => '\\Z',
    ]);
    return "'$s'";
}

$origen  = rtrim($argv[1] ?? './export-d1', '/');
$destino = $argv[2] ?? __DIR__ . '/../sql/03-datos.sql';

if (!is_dir($origen)) {
    fwrite(STDERR, "No encuentro la carpeta $origen. Ejecuta antes exportar-d1.sh.\n");
    exit(1);
}

$sql = [];
$sql[] = '-- Datos migrados desde la base D1 `nase-inventario` de Cloudflare.';
$sql[] = '-- Generado por migracion/d1-a-mysql.php el ' . gmdate('Y-m-d H:i') . ' UTC.';
$sql[] = '--';
$sql[] = '-- Importar DESPUÉS de 01-esquema.sql:';
$sql[] = '--   mysql -u USUARIO -p BASE < 03-datos.sql';
$sql[] = '';
$sql[] = 'SET NAMES utf8mb4;';
$sql[] = "SET time_zone = '+00:00';";
$sql[] = '';

$resumen = [];
foreach (TABLAS as $tabla => $columnas) {
    $archivo = "$origen/$tabla.json";
    if (!is_readable($archivo)) {
        echo "  $tabla: sin volcado, se omite\n";
        continue;
    }
    $filas = filas_de(json_decode((string) file_get_contents($archivo), true));
    $resumen[$tabla] = count($filas);
    echo "  $tabla: " . count($filas) . " filas\n";

    if (!$filas) {
        continue;
    }

    $ignoradas = array_diff(array_keys($filas[0]), $columnas);
    if ($ignoradas) {
        echo "    aviso: columnas que no existen en el esquema MySQL y se omiten: "
            . implode(', ', $ignoradas) . "\n";
    }

    $sql[] = "-- $tabla (" . count($filas) . " filas)";
    $sql[] = "DELETE FROM `$tabla`;";
    foreach ($filas as $f) {
        $cols = [];
        $vals = [];
        foreach ($columnas as $c) {
            if (!array_key_exists($c, $f)) {
                continue;
            }
            $cols[] = "`$c`";
            $vals[] = literal($f[$c]);
        }
        if (!$cols) {
            continue;
        }
        $sql[] = "INSERT INTO `$tabla` (" . implode(',', $cols) . ') VALUES (' . implode(',', $vals) . ');';
    }
    $sql[] = '';
}

if (!$resumen) {
    fwrite(STDERR, "No había ningún volcado en $origen.\n");
    exit(1);
}

@mkdir(dirname($destino), 0755, true);
file_put_contents($destino, implode("\n", $sql) . "\n");
echo "\nEscrito $destino (" . number_format((float) filesize($destino) / 1024, 1) . " kB)\n";
