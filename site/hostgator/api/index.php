<?php
/**
 * API de NASE Agrotech — puerto a PHP + MySQL del Worker de Cloudflare
 * (`site/worker/src/index.js`, base D1 `nase-inventario`).
 *
 * Mantiene exactamente las mismas rutas, los mismos nombres de campo y los
 * mismos códigos de estado, porque el frontend (site.js, shop.js, part-page.js,
 * cart.js) y los paneles /admin y /bodega ya publicados los consumen así.
 *
 * En Apache, el .htaccess de public_html envía todo /api/* a este archivo.
 */

declare(strict_types=1);

require __DIR__ . '/db.php';

/** Campos de `productos` que el cliente puede escribir. */
const CAMPOS = [
    'sku', 'sku_summit', 'pn_dji', 'nombre', 'modelo', 'tipo', 'nota',
    'descripcion', 'ficha', 'imagen', 'imagenes', 'precio', 'moneda',
    'stock', 'stock_min', 'ubicacion', 'activo', 'vitrina', 'orden', 'origen',
];

/** Filtra y convierte los campos que llegan del cliente. */
function normaliza(array $p): array
{
    $numericos = ['precio', 'stock', 'stock_min', 'orden', 'activo', 'vitrina'];
    $json = ['ficha', 'imagenes'];
    $out = [];
    foreach (CAMPOS as $k) {
        if (!array_key_exists($k, $p)) {
            continue;
        }
        $v = $p[$k];
        if (in_array($k, $numericos, true)) {
            $v = is_numeric($v) ? $v + 0 : 0;
            if (!is_finite((float) $v)) {
                $v = 0;
            }
        }
        if (in_array($k, $json, true) && !is_string($v)) {
            $v = json_encode($v ?: [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        $out[$k] = $v;
    }
    return $out;
}

/**
 * Registra una venta: valida stock, descuenta inventario y deja el historial.
 * Devuelve ['error' => …] o ['venta_id' => …, 'total' => …].
 *
 * A diferencia del Worker (D1 no agrupaba estas escrituras), aquí todo ocurre
 * dentro de una transacción: si algo falla a mitad, no queda una venta con el
 * stock descontado a medias.
 */
function registra_venta(array $b, string $origen, ?int $pedido_id): array
{
    $lineas = [];
    foreach ($b['items'] ?? [] as $i) {
        $producto_id = (string) ($i['producto_id'] ?? $i['id'] ?? '');
        if ($producto_id === '') {
            continue;
        }
        $lineas[] = [
            'producto_id' => $producto_id,
            'cantidad'    => max(1, (int) ($i['cantidad'] ?? 1)),
            'precio'      => (float) ($i['precio'] ?? 0),
        ];
    }
    if (!$lineas) {
        return ['error' => 'La venta no tiene productos.'];
    }

    $datos = [];
    foreach ($lineas as $l) {
        $p = fila('SELECT id, nombre, stock, precio FROM productos WHERE id = ?', [$l['producto_id']]);
        if (!$p) {
            return ['error' => 'El producto ' . $l['producto_id'] . ' ya no existe.'];
        }
        if ((int) $p['stock'] < $l['cantidad']) {
            return ['error' => 'Stock insuficiente de «' . $p['nombre'] . '»: hay '
                . $p['stock'] . ' y se piden ' . $l['cantidad'] . '.'];
        }
        $datos[] = [
            'producto_id' => $l['producto_id'],
            'cantidad'    => $l['cantidad'],
            'nombre'      => $p['nombre'],
            'stock'       => (int) $p['stock'],
            // Si la línea no trae precio (caso de los pedidos del sitio, que
            // solo mandan producto y cantidad), se cobra el del catálogo.
            'precio'      => $l['precio'] ?: (float) $p['precio'],
        ];
    }

    $total = 0.0;
    foreach ($datos as $l) {
        $total += $l['cantidad'] * $l['precio'];
    }

    $db = db();
    $db->beginTransaction();
    try {
        q('INSERT INTO ventas (numero, cliente, contacto, documento, total, notas, origen, pedido_id, usuario)
           VALUES (?,?,?,?,?,?,?,?,?)', [
            $b['numero'] ?? '',
            $b['cliente'] ?? '',
            $b['contacto'] ?? '',
            $b['documento'] ?? '',
            $total,
            $b['notas'] ?? '',
            $origen,
            $pedido_id,
            $b['usuario'] ?? 'admin',
        ]);
        $venta_id = (int) $db->lastInsertId();

        foreach ($datos as $l) {
            $nuevo = $l['stock'] - $l['cantidad'];
            q('INSERT INTO venta_items (venta_id, producto_id, nombre, cantidad, precio, subtotal)
               VALUES (?,?,?,?,?,?)', [
                $venta_id, $l['producto_id'], $l['nombre'], $l['cantidad'],
                $l['precio'], $l['cantidad'] * $l['precio'],
            ]);
            q('UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?', [$nuevo, ahora(), $l['producto_id']]);
            q('INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario)
               VALUES (?,?,?,?,?,?)', [
                $l['producto_id'], 'salida', $l['cantidad'], $nuevo,
                'Venta #' . $venta_id . (!empty($b['cliente']) ? ' · ' . $b['cliente'] : ''),
                $b['usuario'] ?? 'admin',
            ]);
        }
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }

    return ['venta_id' => $venta_id, 'total' => $total];
}

function api(string $ruta, string $metodo): void
{
    $cfg = nase_config();

    if ($metodo === 'OPTIONS') {
        http_response_code(204);
        return;
    }

    // ---------------------------------------------------------------- público
    if ($ruta === 'salud') {
        $r = fila('SELECT COUNT(*) AS n FROM productos');
        ok(['ok' => true, 'productos' => (int) ($r['n'] ?? 0), 'protegido' => $cfg['admin_token'] !== '']);
        return;
    }

    if ($ruta === 'login' && $metodo === 'POST') {
        $b = cuerpo() ?? [];
        $esperado = $cfg['admin_token'];
        if ($esperado === '') {
            fallo('El acceso administrativo no está configurado en el servidor.', 503);
            return;
        }
        $abierto = $cfg['acceso_abierto'] === '1';
        if (!$abierto && !hash_equals($esperado, trim((string) ($b['clave'] ?? '')))) {
            fallo('Clave incorrecta.', 401);
            return;
        }
        ok(['token' => $esperado, 'abierto' => $abierto]);
        return;
    }

    if ($ruta === 'modo' && $metodo === 'GET') {
        ok(['pideClave' => $cfg['acceso_abierto'] !== '1']);
        return;
    }

    if ($ruta === 'vitrina' && $metodo === 'GET') {
        $productos = filas(
            "SELECT id, sku, sku_summit, pn_dji, nombre, modelo, tipo, nota, descripcion, ficha, imagen, imagenes,
                    precio, moneda, stock, orden,
                    CASE WHEN stock > 0 THEN 'disponible' ELSE 'a-pedido' END AS disponibilidad
               FROM productos
              WHERE activo = 1 AND vitrina = 1
              ORDER BY orden ASC, nombre ASC"
        );
        ok(['productos' => $productos]);
        return;
    }

    if ($ruta === 'imagenes' && $metodo === 'GET') {
        $mapa = [];
        foreach (filas('SELECT clave, url FROM imagenes') as $r) {
            $mapa[$r['clave']] = $r['url'];
        }
        ok(['imagenes' => (object) $mapa]);
        return;
    }

    if ($ruta === 'config' && $metodo === 'GET') {
        $r = fila("SELECT valor FROM config WHERE clave = 'sitio'");
        ok(['config' => !empty($r['valor']) ? json_decode($r['valor'], true) : null]);
        return;
    }

    if ($ruta === 'pedidos' && $metodo === 'POST') {
        $b = cuerpo();
        if (!$b || !isset($b['items']) || !is_array($b['items']) || !count($b['items'])) {
            fallo('El pedido no trae productos.');
            return;
        }
        if (empty($b['nombre']) || empty($b['telefono'])) {
            fallo('Faltan los datos de contacto.');
            return;
        }
        $items = [];
        foreach (array_slice($b['items'], 0, 60) as $i) {
            $items[] = [
                'id'       => (string) ($i['id'] ?? ''),
                'nombre'   => (string) ($i['nombre'] ?? $i['name'] ?? ''),
                'cantidad' => max(1, (int) ($i['cantidad'] ?? $i['qty'] ?? 1)),
                'tipo'     => (string) ($i['tipo'] ?? $i['type'] ?? 'repuesto'),
            ];
        }
        q('INSERT INTO pedidos (nombre, telefono, correo, comuna, comentario, items) VALUES (?,?,?,?,?,?)', [
            corta((string) $b['nombre'], 120),
            corta((string) $b['telefono'], 40),
            corta((string) ($b['correo'] ?? ''), 120),
            corta((string) ($b['comuna'] ?? ''), 120),
            corta((string) ($b['comentario'] ?? ''), 600),
            json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
        ok(['pedido_id' => (int) db()->lastInsertId(), 'estado' => 'pendiente'], 201);
        return;
    }

    // ------------------------------------------------- a partir de aquí, token
    if (!autorizado()) {
        fallo('No autorizado.', 401);
        return;
    }

    if ($ruta === 'productos' && $metodo === 'GET') {
        $compacto = ($_GET['compacto'] ?? '') === '1';
        $sql = $compacto
            ? "SELECT id, sku, sku_summit, pn_dji, nombre, modelo, tipo, precio, moneda, stock, stock_min,
                      ubicacion, activo, vitrina, orden, updated_at,
                      CASE WHEN imagen LIKE 'data:%' THEN NULL ELSE imagen END AS imagen
                 FROM productos ORDER BY orden ASC, nombre ASC"
            : 'SELECT * FROM productos ORDER BY orden ASC, nombre ASC';
        ok(['productos' => filas($sql)]);
        return;
    }

    if ($ruta === 'productos' && ($metodo === 'POST' || $metodo === 'PUT')) {
        $b = cuerpo();
        if ($b === null) {
            fallo('Sin contenido.');
            return;
        }
        if (empty($b['id']) && empty($b['nombre'])) {
            fallo('Falta el nombre del producto.');
            return;
        }
        $datos = normaliza($b);
        $id = !empty($b['id']) && trim((string) $b['id']) !== ''
            ? trim((string) $b['id'])
            : 'p-' . slug($b['modelo'] ?? 'gen') . '-' . slug($b['nombre'] ?? '')
              . '-' . substr(base_convert((string) (int) (microtime(true) * 1000), 10, 36), -4);

        $existe = fila('SELECT id, stock FROM productos WHERE id = ?', [$id]);
        if ($existe) {
            $cols = array_keys($datos);
            if (!$cols) {
                fallo('Nada que actualizar.');
                return;
            }
            $set = implode(', ', array_map(static fn($c) => "`$c` = ?", $cols));
            q("UPDATE productos SET $set, updated_at = ? WHERE id = ?",
                array_merge(array_values($datos), [ahora(), $id]));

            if (array_key_exists('stock', $datos) && (int) $datos['stock'] !== (int) $existe['stock']) {
                $dif = (int) $datos['stock'] - (int) $existe['stock'];
                q('INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario)
                   VALUES (?,?,?,?,?,?)', [
                    $id, $dif >= 0 ? 'ajuste+' : 'ajuste-', abs($dif), (int) $datos['stock'],
                    'Ajuste al editar el producto', $b['usuario'] ?? 'admin',
                ]);
            }
            ok(['producto' => fila('SELECT * FROM productos WHERE id = ?', [$id]), 'creado' => false]);
            return;
        }

        if (empty($b['nombre'])) {
            fallo('Falta el nombre del producto.');
            return;
        }
        $cols = array_keys($datos);
        $campos = array_merge(['id'], $cols);
        $marcas = implode(',', array_fill(0, count($campos), '?'));
        $lista = implode(',', array_map(static fn($c) => "`$c`", $campos));
        q("INSERT INTO productos ($lista) VALUES ($marcas)", array_merge([$id], array_values($datos)));

        if ((int) ($datos['stock'] ?? 0) > 0) {
            q('INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario)
               VALUES (?,?,?,?,?,?)', [
                $id, 'inicial', (int) $datos['stock'], (int) $datos['stock'],
                'Stock inicial', $b['usuario'] ?? 'admin',
            ]);
        }
        ok(['producto' => fila('SELECT * FROM productos WHERE id = ?', [$id]), 'creado' => true], 201);
        return;
    }

    if (str_starts_with($ruta, 'productos/') && $metodo === 'DELETE') {
        $id = rawurldecode(substr($ruta, strlen('productos/')));
        q('DELETE FROM productos WHERE id = ?', [$id]);
        q('DELETE FROM movimientos WHERE producto_id = ?', [$id]);
        ok(['eliminado' => $id]);
        return;
    }

    if ($ruta === 'stock' && $metodo === 'POST') {
        $b = cuerpo();
        if (!$b || empty($b['producto_id'])) {
            fallo('Falta el producto.');
            return;
        }
        $cant = abs((int) ($b['cantidad'] ?? 0));
        if (!$cant) {
            fallo('La cantidad debe ser distinta de cero.');
            return;
        }
        $p = fila('SELECT stock FROM productos WHERE id = ?', [$b['producto_id']]);
        if (!$p) {
            fallo('El producto no existe.', 404);
            return;
        }
        $tipo = ($b['tipo'] ?? '') === 'salida' ? 'salida' : 'entrada';
        $nuevo = $tipo === 'entrada' ? (int) $p['stock'] + $cant : (int) $p['stock'] - $cant;
        if ($nuevo < 0) {
            fallo('Stock insuficiente: quedan ' . $p['stock'] . ' unidades.');
            return;
        }
        q('UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?', [$nuevo, ahora(), $b['producto_id']]);
        q('INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario)
           VALUES (?,?,?,?,?,?)', [
            $b['producto_id'], $tipo, $cant, $nuevo, $b['motivo'] ?? '', $b['usuario'] ?? 'admin',
        ]);
        ok(['producto_id' => $b['producto_id'], 'stock' => $nuevo]);
        return;
    }

    if ($ruta === 'movimientos' && $metodo === 'GET') {
        $pid = $_GET['producto_id'] ?? null;
        $movimientos = $pid
            ? filas('SELECT m.*, p.nombre FROM movimientos m LEFT JOIN productos p ON p.id = m.producto_id
                      WHERE m.producto_id = ? ORDER BY m.id DESC LIMIT 200', [$pid])
            : filas('SELECT m.*, p.nombre FROM movimientos m LEFT JOIN productos p ON p.id = m.producto_id
                      ORDER BY m.id DESC LIMIT 200');
        ok(['movimientos' => $movimientos]);
        return;
    }

    if ($ruta === 'imagenes' && ($metodo === 'POST' || $metodo === 'PUT')) {
        $b = cuerpo();
        if (!$b || empty($b['clave']) || empty($b['url'])) {
            fallo('Faltan clave y url.');
            return;
        }
        q('INSERT INTO imagenes (clave, url, descripcion, updated_at) VALUES (?,?,?,?)
           ON DUPLICATE KEY UPDATE url = VALUES(url), descripcion = VALUES(descripcion), updated_at = VALUES(updated_at)',
            [$b['clave'], $b['url'], $b['descripcion'] ?? '', ahora()]);
        ok(['clave' => $b['clave'], 'url' => $b['url']]);
        return;
    }

    if (str_starts_with($ruta, 'imagenes/') && $metodo === 'DELETE') {
        $clave = rawurldecode(substr($ruta, strlen('imagenes/')));
        q('DELETE FROM imagenes WHERE clave = ?', [$clave]);
        ok(['eliminada' => $clave]);
        return;
    }

    if ($ruta === 'config' && ($metodo === 'POST' || $metodo === 'PUT')) {
        $b = cuerpo();
        if ($b === null) {
            fallo('Sin contenido.');
            return;
        }
        $valor = json_encode($b['config'] ?? $b, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        q("INSERT INTO config (clave, valor, updated_at) VALUES ('sitio', ?, ?)
           ON DUPLICATE KEY UPDATE valor = VALUES(valor), updated_at = VALUES(updated_at)", [$valor, ahora()]);
        ok(['guardado' => true]);
        return;
    }

    if ($ruta === 'ventas' && $metodo === 'POST') {
        $b = cuerpo();
        if ($b === null) {
            fallo('Sin contenido.');
            return;
        }
        $r = registra_venta($b, (string) ($b['origen'] ?? 'mostrador'), null);
        if (isset($r['error'])) {
            fallo($r['error']);
            return;
        }
        ok($r, 201);
        return;
    }

    if ($ruta === 'ventas' && $metodo === 'GET') {
        ok(['ventas' => filas(
            'SELECT v.*, (SELECT COUNT(*) FROM venta_items i WHERE i.venta_id = v.id) AS lineas
               FROM ventas v ORDER BY v.id DESC LIMIT 200'
        )]);
        return;
    }

    if (str_starts_with($ruta, 'ventas/') && $metodo === 'GET') {
        $id = (int) substr($ruta, strlen('ventas/'));
        $v = fila('SELECT * FROM ventas WHERE id = ?', [$id]);
        if (!$v) {
            fallo('Venta no encontrada.', 404);
            return;
        }
        ok(['venta' => $v, 'items' => filas('SELECT * FROM venta_items WHERE venta_id = ?', [$id])]);
        return;
    }

    if ($ruta === 'pedidos' && $metodo === 'GET') {
        $estado = $_GET['estado'] ?? null;
        $pedidos = $estado
            ? filas('SELECT * FROM pedidos WHERE estado = ? ORDER BY id DESC LIMIT 200', [$estado])
            : filas('SELECT * FROM pedidos ORDER BY id DESC LIMIT 200');
        ok(['pedidos' => $pedidos]);
        return;
    }

    if (preg_match('#^pedidos/(\d+)/aprobar$#', $ruta, $m) && $metodo === 'POST') {
        $id = (int) $m[1];
        $p = fila('SELECT * FROM pedidos WHERE id = ?', [$id]);
        if (!$p) {
            fallo('Pedido no encontrado.', 404);
            return;
        }
        if ($p['estado'] !== 'pendiente') {
            fallo('Este pedido ya fue ' . $p['estado'] . '.');
            return;
        }
        $items = json_decode((string) ($p['items'] ?? '[]'), true) ?: [];
        $b = cuerpo() ?? [];
        $r = registra_venta([
            'items' => array_map(static fn($i) => [
                'producto_id' => $i['id'] ?? '',
                'cantidad'    => $i['cantidad'] ?? 1,
            ], $items),
            'cliente'  => $p['nombre'],
            'contacto' => $p['telefono'],
            'notas'    => 'Pedido web #' . $id . (!empty($p['comuna']) ? ' · ' . $p['comuna'] : ''),
            'usuario'  => $b['usuario'] ?? 'admin',
        ], 'web', $id);
        if (isset($r['error'])) {
            fallo($r['error']);
            return;
        }
        q("UPDATE pedidos SET estado = 'aprobado', venta_id = ?, resuelto_en = ? WHERE id = ?",
            [$r['venta_id'], ahora(), $id]);
        ok(['pedido_id' => $id, 'venta_id' => $r['venta_id'], 'total' => $r['total']]);
        return;
    }

    if (preg_match('#^pedidos/(\d+)/rechazar$#', $ruta, $m) && $metodo === 'POST') {
        $id = (int) $m[1];
        q("UPDATE pedidos SET estado = 'rechazado', resuelto_en = ? WHERE id = ? AND estado = 'pendiente'",
            [ahora(), $id]);
        ok(['pedido_id' => $id, 'estado' => 'rechazado']);
        return;
    }

    if ($ruta === 'conteos' && $metodo === 'GET') {
        ok(['conteos' => filas(
            'SELECT c.*, (SELECT COUNT(*) FROM conteo_items i WHERE i.conteo_id = c.id) AS contados
               FROM conteos c ORDER BY c.id DESC LIMIT 100'
        )]);
        return;
    }

    if ($ruta === 'conteos' && $metodo === 'POST') {
        $b = cuerpo() ?? [];
        $abierto = fila("SELECT id FROM conteos WHERE estado = 'abierto' ORDER BY id DESC");
        if ($abierto && empty($b['forzar'])) {
            fallo('Ya hay un conteo abierto (#' . $abierto['id'] . '). Ciérralo o anúlalo antes de empezar otro.', 409);
            return;
        }
        q('INSERT INTO conteos (nombre, alcance, usuario, notas) VALUES (?,?,?,?)', [
            corta((string) ($b['nombre'] ?? 'Conteo'), 120),
            corta((string) ($b['alcance'] ?? 'Todo el inventario'), 120),
            corta((string) ($b['usuario'] ?? 'bodega'), 60),
            corta((string) ($b['notas'] ?? ''), 600),
        ]);
        ok(['conteo' => fila('SELECT * FROM conteos WHERE id = ?', [(int) db()->lastInsertId()])], 201);
        return;
    }

    if (preg_match('#^conteos/(\d+)$#', $ruta, $m) && $metodo === 'GET') {
        $id = (int) $m[1];
        $c = fila('SELECT * FROM conteos WHERE id = ?', [$id]);
        if (!$c) {
            fallo('Conteo no encontrado.', 404);
            return;
        }
        $items = filas(
            'SELECT p.id AS producto_id, p.nombre, p.sku, p.sku_summit, p.pn_dji, p.modelo, p.tipo, p.ubicacion,
                    p.stock, p.stock_min, i.contado, i.esperado, i.updated_at
               FROM productos p
               LEFT JOIN conteo_items i ON i.producto_id = p.id AND i.conteo_id = ?
              WHERE p.activo = 1
              ORDER BY p.ubicacion IS NULL, p.ubicacion ASC, p.nombre ASC', [$id]
        );
        ok(['conteo' => $c, 'items' => $items]);
        return;
    }

    if (preg_match('#^conteos/(\d+)/item$#', $ruta, $m) && $metodo === 'POST') {
        $id = (int) $m[1];
        $b = cuerpo() ?? [];
        $c = fila('SELECT id, estado FROM conteos WHERE id = ?', [$id]);
        if (!$c) {
            fallo('Conteo no encontrado.', 404);
            return;
        }
        if ($c['estado'] !== 'abierto') {
            fallo('Este conteo ya está ' . $c['estado'] . '.');
            return;
        }
        if (empty($b['producto_id'])) {
            fallo('Falta el producto.');
            return;
        }
        $p = fila('SELECT id, stock FROM productos WHERE id = ?', [$b['producto_id']]);
        if (!$p) {
            fallo('El producto no existe.', 404);
            return;
        }
        if (!isset($b['contado']) || $b['contado'] === null || $b['contado'] === '') {
            q('DELETE FROM conteo_items WHERE conteo_id = ? AND producto_id = ?', [$id, $b['producto_id']]);
            ok(['producto_id' => $b['producto_id'], 'contado' => null]);
            return;
        }
        $contado = max(0, (int) round((float) $b['contado']));
        $esperado = (int) $p['stock'];
        q('INSERT INTO conteo_items (conteo_id, producto_id, esperado, contado, diferencia, usuario, updated_at)
           VALUES (?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE esperado = VALUES(esperado), contado = VALUES(contado),
             diferencia = VALUES(diferencia), usuario = VALUES(usuario), updated_at = VALUES(updated_at)', [
            $id, $b['producto_id'], $esperado, $contado, $contado - $esperado,
            corta((string) ($b['usuario'] ?? 'bodega'), 60), ahora(),
        ]);
        ok([
            'producto_id' => $b['producto_id'],
            'contado'     => $contado,
            'esperado'    => $esperado,
            'diferencia'  => $contado - $esperado,
        ]);
        return;
    }

    if (preg_match('#^conteos/(\d+)/cerrar$#', $ruta, $m) && $metodo === 'POST') {
        $id = (int) $m[1];
        $b = cuerpo() ?? [];
        $c = fila('SELECT * FROM conteos WHERE id = ?', [$id]);
        if (!$c) {
            fallo('Conteo no encontrado.', 404);
            return;
        }
        if ($c['estado'] !== 'abierto') {
            fallo('Este conteo ya está ' . $c['estado'] . '.');
            return;
        }
        $items = filas('SELECT producto_id, contado FROM conteo_items WHERE conteo_id = ?', [$id]);
        if (!$items) {
            fallo('El conteo no tiene productos anotados.');
            return;
        }
        $usuario = corta((string) ($b['usuario'] ?? $c['usuario'] ?? 'bodega'), 60);
        $detalle = [];

        $db = db();
        $db->beginTransaction();
        try {
            foreach ($items as $it) {
                $p = fila('SELECT id, nombre, stock FROM productos WHERE id = ?', [$it['producto_id']]);
                if (!$p) {
                    continue;
                }
                $antes = (int) $p['stock'];
                $dif = (int) $it['contado'] - $antes;
                q('UPDATE conteo_items SET esperado = ?, diferencia = ? WHERE conteo_id = ? AND producto_id = ?',
                    [$antes, $dif, $id, $it['producto_id']]);
                if (!$dif) {
                    continue;
                }
                q('UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?',
                    [(int) $it['contado'], ahora(), $it['producto_id']]);
                q('INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario)
                   VALUES (?,?,?,?,?,?)', [
                    $it['producto_id'], $dif > 0 ? 'ajuste+' : 'ajuste-', abs($dif), (int) $it['contado'],
                    'Conteo #' . $id . (!empty($c['nombre']) ? ' · ' . $c['nombre'] : ''), $usuario,
                ]);
                $detalle[] = [
                    'producto_id' => $p['id'],
                    'nombre'      => $p['nombre'],
                    'antes'       => $antes,
                    'ahora'       => (int) $it['contado'],
                    'diferencia'  => $dif,
                ];
            }
            q("UPDATE conteos SET estado = 'cerrado', cerrado_en = ?, items = ?, ajustados = ? WHERE id = ?",
                [ahora(), count($items), count($detalle), $id]);
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        ok(['conteo_id' => $id, 'items' => count($items), 'ajustados' => count($detalle), 'detalle' => $detalle]);
        return;
    }

    if (preg_match('#^conteos/(\d+)/anular$#', $ruta, $m) && $metodo === 'POST') {
        $id = (int) $m[1];
        q("UPDATE conteos SET estado = 'anulado', cerrado_en = ? WHERE id = ? AND estado = 'abierto'", [ahora(), $id]);
        ok(['conteo_id' => $id, 'estado' => 'anulado']);
        return;
    }

    if ($ruta === 'resumen' && $metodo === 'GET') {
        $t = fila(
            'SELECT COUNT(*) AS total,
                    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
                    SUM(CASE WHEN vitrina = 1 AND activo = 1 THEN 1 ELSE 0 END) AS en_vitrina,
                    SUM(CASE WHEN stock <= stock_min THEN 1 ELSE 0 END) AS bajo_minimo,
                    SUM(stock) AS unidades,
                    SUM(stock * precio) AS valorizado
               FROM productos'
        ) ?? [];
        $p = fila("SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'pendiente'");
        $v = fila('SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS monto FROM ventas');
        $c = fila("SELECT id, nombre FROM conteos WHERE estado = 'abierto' ORDER BY id DESC");

        // MySQL devuelve los SUM() como decimales; el panel espera números.
        ok(['resumen' => [
            'total'              => (int) ($t['total'] ?? 0),
            'activos'            => (int) ($t['activos'] ?? 0),
            'en_vitrina'         => (int) ($t['en_vitrina'] ?? 0),
            'bajo_minimo'        => (int) ($t['bajo_minimo'] ?? 0),
            'unidades'           => (int) ($t['unidades'] ?? 0),
            'valorizado'         => (float) ($t['valorizado'] ?? 0),
            'pedidos_pendientes' => (int) ($p['n'] ?? 0),
            'ventas'             => (int) ($v['n'] ?? 0),
            'ventas_monto'       => (float) ($v['monto'] ?? 0),
            'conteo_abierto'     => $c['id'] ?? null,
            'conteo_nombre'      => $c['nombre'] ?? null,
        ]]);
        return;
    }

    fallo('Ruta no encontrada: ' . $ruta, 404);
}

// --------------------------------------------------------------------------
// Punto de entrada
// --------------------------------------------------------------------------
if (PHP_SAPI !== 'cli') {
    $camino = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $pos = strpos($camino, '/api');
    $ruta = $pos === false ? '' : substr($camino, $pos + 4);
    $ruta = trim($ruta, '/');

    try {
        api($ruta, strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    } catch (Throwable $e) {
        error_log('[nase-api] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        // A diferencia del Worker, el detalle no se publica: iría a parar al
        // navegador de cualquier visitante. Queda en el log de errores de cPanel.
        $detalle = nase_config()['debug'] ? ': ' . $e->getMessage() : '.';
        fallo('Error del servidor' . $detalle, 500);
    }
}
