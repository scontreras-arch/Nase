<?php
/**
 * Configuración, conexión y utilidades comunes de la API de NASE Agrotech.
 *
 * Sustituye al entorno del Worker de Cloudflare: donde antes había `env.DB`
 * (D1) y `env.ADMIN_TOKEN` (secret de wrangler), aquí hay una conexión PDO a
 * MySQL y un archivo de configuración guardado FUERA de public_html.
 */

declare(strict_types=1);

// El puerto usa sintaxis y funciones de PHP 8 (str_starts_with, uniones de
// tipos). En cPanel se elige la versión en «MultiPHP Manager».
if (PHP_VERSION_ID < 80000) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'Esta API necesita PHP 8.0 o superior; el servidor tiene ' . PHP_VERSION
            . '. Cambiar la versión en cPanel → MultiPHP Manager.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Devuelve la configuración del sitio.
 *
 * Se busca, en este orden:
 *   1. Las variables de entorno NASE_DB_*, NASE_ADMIN_TOKEN… (útil en VPS).
 *   2. El archivo apuntado por la variable de entorno NASE_CONFIG.
 *   3. ~/nase-config.php, es decir un nivel por encima de public_html. Es el
 *      lugar recomendado en HostGator: el servidor web no lo puede servir.
 *   4. api/config.php, como último recurso (el .htaccess bloquea su descarga).
 */
function nase_config(): array
{
    static $cfg = null;
    if ($cfg !== null) {
        return $cfg;
    }

    $archivo = getenv('NASE_CONFIG') ?: null;
    if (!$archivo) {
        $candidatos = [
            dirname(__DIR__, 2) . '/nase-config.php',  // ~/nase-config.php
            __DIR__ . '/config.php',
        ];
        foreach ($candidatos as $c) {
            if (is_readable($c)) {
                $archivo = $c;
                break;
            }
        }
    }

    $desde_archivo = [];
    if ($archivo && is_readable($archivo)) {
        $leido = require $archivo;
        if (is_array($leido)) {
            $desde_archivo = $leido;
        }
    }

    $env = static function (string $clave, $defecto) {
        $v = getenv($clave);
        return ($v === false || $v === '') ? $defecto : $v;
    };

    $cfg = [
        'db_host'  => $env('NASE_DB_HOST', $desde_archivo['db_host'] ?? 'localhost'),
        'db_port'  => (int) $env('NASE_DB_PORT', $desde_archivo['db_port'] ?? 3306),
        'db_name'  => $env('NASE_DB_NAME', $desde_archivo['db_name'] ?? ''),
        'db_user'  => $env('NASE_DB_USER', $desde_archivo['db_user'] ?? ''),
        'db_pass'  => $env('NASE_DB_PASS', $desde_archivo['db_pass'] ?? ''),
        // DSN completo: solo se usa en las pruebas locales (SQLite).
        'db_dsn'   => $env('NASE_DB_DSN', $desde_archivo['db_dsn'] ?? ''),

        // Equivale al secret ADMIN_TOKEN del Worker.
        'admin_token' => trim((string) $env('NASE_ADMIN_TOKEN', $desde_archivo['admin_token'] ?? '')),

        // DEBE quedarse en '0'. Con '1', POST /api/login entrega el token de
        // administrador sin pedir clave y el panel queda abierto a cualquiera.
        'acceso_abierto' => trim((string) $env('NASE_ACCESO_ABIERTO', $desde_archivo['acceso_abierto'] ?? '0')),

        // Con true, los errores del servidor viajan con el detalle técnico.
        // Dejar en false en producción.
        'debug' => (bool) $env('NASE_DEBUG', $desde_archivo['debug'] ?? false),
    ];

    return $cfg;
}

/** Conexión PDO reutilizada durante toda la petición. */
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $cfg = nase_config();
    $dsn = $cfg['db_dsn'] ?: sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['db_host'],
        $cfg['db_port'],
        $cfg['db_name']
    );

    $pdo = new PDO($dsn, $cfg['db_user'] ?: null, $cfg['db_pass'] ?: null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        // Sin emulación, MySQL devuelve enteros y decimales como números y no
        // como texto, igual que hacía D1. El frontend cuenta con eso.
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_STRINGIFY_FETCHES  => false,
    ]);

    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
        // D1 guardaba las fechas en UTC; se mantiene el mismo huso.
        $pdo->exec("SET time_zone = '+00:00'");
    } else {
        // SQLite (solo pruebas): claves foráneas y comportamiento cercano.
        $pdo->exec('PRAGMA foreign_keys = ON');
    }

    return $pdo;
}

/** Ejecuta una consulta con parámetros y devuelve el statement. */
function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

/** Primera fila o null (equivale al `.first()` de D1). */
function fila(string $sql, array $params = []): ?array
{
    $r = q($sql, $params)->fetch();
    return $r === false ? null : $r;
}

/** Todas las filas (equivale al `.all()` de D1). */
function filas(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll() ?: [];
}

/** Respuesta JSON con las mismas cabeceras que devolvía el Worker. */
function ok($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

/** Error en el formato que espera el frontend: {"error": "..."}. */
function fallo(string $msg, int $status = 400): void
{
    ok(['error' => $msg], $status);
}

/** Cuerpo JSON de la petición, o null si no es JSON válido. */
function cuerpo(): ?array
{
    $crudo = file_get_contents('php://input');
    if ($crudo === false || $crudo === '') {
        return null;
    }
    $d = json_decode($crudo, true);
    return is_array($d) ? $d : null;
}

/** Token del encabezado Authorization: Bearer … */
function token_de(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'authorization') === 0) {
                $h = $v;
                break;
            }
        }
    }
    return trim(preg_replace('/^Bearer\s+/i', '', (string) $h));
}

/** ¿La petición trae el token de administrador? */
function autorizado(): bool
{
    $esperado = nase_config()['admin_token'];
    if ($esperado === '') {
        return false;
    }
    return hash_equals($esperado, token_de());
}

/** Fecha UTC 'Y-m-d H:i:s', el mismo formato que escribía el Worker. */
function ahora(): string
{
    return gmdate('Y-m-d H:i:s');
}

/** Versión PHP del `slug()` del Worker: sin tildes, minúsculas, 60 caracteres. */
function slug($s): string
{
    $s = (string) $s;
    $sin_tildes = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    if ($sin_tildes !== false) {
        // Algunas locales devuelven «'a» o «~n»; se quitan los restos.
        $s = preg_replace("/['\"^~`]/", '', $sin_tildes);
    }
    $s = strtolower($s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim($s, '-');
    return substr($s, 0, 60);
}

/**
 * Recorta a $n caracteres (no bytes), como hacía el `.slice()` del Worker.
 *
 * No depende de mbstring: esa extensión no viene activada en todos los
 * hospedajes compartidos y, sin ella, `mb_substr()` tumbaba la petición. El
 * recorte por bytes de `substr()` no sirve: parte una letra acentuada en dos y
 * deja el texto en UTF-8 inválido.
 */
function corta($s, int $n): string
{
    $s = (string) $s;
    if (function_exists('mb_substr')) {
        return mb_substr($s, 0, $n);
    }
    if (preg_match('/^.{0,' . $n . '}/us', $s, $m)) {
        return $m[0];
    }
    return substr($s, 0, $n);  // texto que no es UTF-8 válido
}
