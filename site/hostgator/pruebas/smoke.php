<?php
/**
 * Pruebas de humo de la API portada a PHP.
 *
 * Recorren las mismas llamadas que hacen el sitio (site.js, shop.js, cart.js),
 * el panel /admin y el panel /bodega, y comprueban que las respuestas coinciden
 * con las que devolvía el Worker de Cloudflare.
 *
 * Uso:
 *   1. Crear una base vacía e importar sql/01-esquema.sql.
 *   2. Levantar el servidor de pruebas (ver pruebas/README.md).
 *   3. php pruebas/smoke.php http://localhost:8080 CLAVE-ADMIN
 */

declare(strict_types=1);

$base  = rtrim($argv[1] ?? 'http://localhost:8080', '/');
$clave = $argv[2] ?? 'clave-de-prueba';

$total = 0;
$malas = 0;
$token = '';

function pide(string $metodo, string $ruta, $cuerpo = null, string $token = ''): array
{
    global $base;
    $ch = curl_init($base . $ruta);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $metodo,
        CURLOPT_HTTPHEADER     => array_filter([
            'Content-Type: application/json',
            $token ? "Authorization: Bearer $token" : null,
        ]),
    ]);
    if ($cuerpo !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($cuerpo, JSON_UNESCAPED_UNICODE));
    }
    $texto  = curl_exec($ch);
    $estado = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$estado, json_decode((string) $texto, true), (string) $texto];
}

function comprueba(string $nombre, bool $condicion, string $detalle = ''): void
{
    global $total, $malas;
    $total++;
    if ($condicion) {
        echo "  ok   $nombre\n";
        return;
    }
    $malas++;
    echo "  FALLA $nombre" . ($detalle ? "  →  $detalle" : '') . "\n";
}

echo "\nAPI en $base\n\n";

// -------------------------------------------------------------- público
echo "Rutas públicas\n";
[$e, $d] = pide('GET', '/api/salud');
comprueba('GET /api/salud responde 200', $e === 200, "estado $e");
comprueba('salud informa que hay token configurado', ($d['protegido'] ?? false) === true);
comprueba('salud devuelve el conteo como número', is_int($d['productos'] ?? null));

[$e, $d] = pide('GET', '/api/modo');
comprueba('GET /api/modo pide clave', ($d['pideClave'] ?? null) === true);

[$e, $d] = pide('POST', '/api/login', ['clave' => 'incorrecta']);
comprueba('login con clave mala da 401', $e === 401, "estado $e");
comprueba('login con clave mala explica el error', ($d['error'] ?? '') === 'Clave incorrecta.');

[$e, $d] = pide('POST', '/api/login', ['clave' => $clave]);
comprueba('login con clave buena da 200', $e === 200, "estado $e");
$token = $d['token'] ?? '';
comprueba('login entrega el token', $token !== '');

[$e, $d] = pide('GET', '/api/productos');
comprueba('sin token, /api/productos da 401', $e === 401 && ($d['error'] ?? '') === 'No autorizado.');

// -------------------------------------------------------------- productos
echo "\nProductos e inventario (panel /admin)\n";
[$e, $d] = pide('POST', '/api/productos', [
    'nombre'  => 'Batería inteligente T70P (prueba)',
    'modelo'  => 'T70P',
    'tipo'    => 'repuesto',
    'precio'  => 1250000,
    'stock'   => 4,
    'vitrina' => 1,
    'activo'  => 1,
    'ficha'   => ['capacidad' => '30000 mAh'],
], $token);
comprueba('crear producto da 201', $e === 201, "estado $e");
comprueba('la respuesta marca creado = true', ($d['creado'] ?? null) === true);
$pid = $d['producto']['id'] ?? '';
comprueba('el id se genera con el patrón del Worker', (bool) preg_match('/^p-t70p-bateria-inteligente/', $pid), $pid);
comprueba('stock viaja como número, no como texto', is_int($d['producto']['stock'] ?? null));
comprueba('ficha se guarda serializada en JSON', ($d['producto']['ficha'] ?? '') === '{"capacidad":"30000 mAh"}');

[$e, $d] = pide('POST', '/api/productos', ['id' => $pid, 'precio' => 1190000, 'stock' => 6], $token);
comprueba('editar producto da 200 y creado = false', $e === 200 && ($d['creado'] ?? null) === false);
comprueba('el precio queda actualizado', (float) ($d['producto']['precio'] ?? 0) === 1190000.0);

[$e, $d] = pide('GET', '/api/movimientos', null, $token);
$movs = $d['movimientos'] ?? [];
comprueba('el ajuste de stock deja movimiento', count($movs) >= 2);
comprueba('el movimiento trae fecha', !empty($movs[0]['fecha'] ?? null));
comprueba('el movimiento trae el nombre del producto', !empty($movs[0]['nombre'] ?? null));

[$e, $d] = pide('POST', '/api/stock', ['producto_id' => $pid, 'tipo' => 'entrada', 'cantidad' => 4, 'motivo' => 'Compra'], $token);
comprueba('entrada de stock suma', ($d['stock'] ?? null) === 10, json_encode($d));

[$e, $d] = pide('POST', '/api/stock', ['producto_id' => $pid, 'tipo' => 'salida', 'cantidad' => 99], $token);
comprueba('salida mayor que el stock se rechaza', $e === 400 && str_contains($d['error'] ?? '', 'Stock insuficiente'));

[$e, $d] = pide('GET', '/api/productos?compacto=1', null, $token);
comprueba('listado compacto responde', $e === 200 && count($d['productos'] ?? []) === 1);

// -------------------------------------------------------------- vitrina
echo "\nCatálogo del sitio (shop.js / part-page.js)\n";
[$e, $d] = pide('GET', '/api/vitrina');
$v = $d['productos'][0] ?? [];
comprueba('la vitrina es pública', $e === 200);
comprueba('marca disponibilidad según el stock', ($v['disponibilidad'] ?? '') === 'disponible');
comprueba('no expone campos internos como ubicacion', !array_key_exists('ubicacion', $v));

// -------------------------------------------------------- textos e imágenes
echo "\nTextos e imágenes publicados (site.js)\n";
$cfg = ['estilo' => ['pal' => 'nase'], 'textos' => ['index#doc|span|0' => 'Distribuidor Oficial DJI Agriculture - Enterprise']];
[$e, $d] = pide('POST', '/api/config', ['config' => $cfg], $token);
comprueba('publicar configuración responde guardado', ($d['guardado'] ?? null) === true);

[$e, $d] = pide('GET', '/api/config');
comprueba('la configuración vuelve completa y con tildes', ($d['config'] ?? null) === $cfg, json_encode($d));

$cfg['textos']['index#t55|h2|0'] = '50 litros • UNA PERSONA • TODO EL CAMPO';
[$e] = pide('POST', '/api/config', ['config' => $cfg], $token);
[$e, $d] = pide('GET', '/api/config');
comprueba('volver a publicar sobrescribe la fila (upsert)', ($d['config'] ?? null) === $cfg);

[$e, $d] = pide('POST', '/api/imagenes', ['clave' => 'index#hero', 'url' => 'assets/img/t100/hero.jpg'], $token);
comprueba('guardar imagen responde 200', $e === 200);
[$e] = pide('POST', '/api/imagenes', ['clave' => 'index#hero', 'url' => 'assets/img/t100/hero-2.jpg'], $token);
[$e, $d] = pide('GET', '/api/imagenes');
comprueba('la imagen se sobrescribe por clave', ($d['imagenes']['index#hero'] ?? '') === 'assets/img/t100/hero-2.jpg');

[$e, $d] = pide('DELETE', '/api/imagenes/' . rawurlencode('index#hero'), null, $token);
comprueba('borrar imagen por clave con # funciona', ($d['eliminada'] ?? '') === 'index#hero', json_encode($d));

// -------------------------------------------------------------- pedidos web
echo "\nPedidos del carrito (cart.js) y ventas\n";
[$e, $d] = pide('POST', '/api/pedidos', [
    'nombre'   => 'Cliente de prueba',
    'telefono' => '+56 9 1234 5678',
    'comuna'   => 'Talca',
    'items'    => [['id' => $pid, 'nombre' => 'Batería T70P', 'cantidad' => 2, 'tipo' => 'repuesto']],
]);
comprueba('el pedido público se acepta con 201', $e === 201, "estado $e");
$pedido = $d['pedido_id'] ?? 0;
comprueba('devuelve el número de pedido', $pedido > 0);

[$e, $d] = pide('POST', '/api/pedidos', ['nombre' => 'Sin teléfono', 'items' => [['id' => $pid]]]);
comprueba('pedido sin contacto se rechaza', $e === 400 && ($d['error'] ?? '') === 'Faltan los datos de contacto.');

[$e, $d] = pide('GET', '/api/pedidos?estado=pendiente', null, $token);
comprueba('el panel ve el pedido pendiente', count($d['pedidos'] ?? []) === 1);
comprueba('los items del pedido son texto JSON (el panel hace JSON.parse)', is_string($d['pedidos'][0]['items'] ?? null));

[$e, $d] = pide('POST', "/api/pedidos/$pedido/aprobar", [], $token);
comprueba('aprobar el pedido genera la venta', ($d['venta_id'] ?? 0) > 0, json_encode($d));
comprueba('el total sale del precio del producto', (float) ($d['total'] ?? 0) === 2380000.0, json_encode($d));
$venta = $d['venta_id'] ?? 0;

[$e, $d] = pide('POST', "/api/pedidos/$pedido/aprobar", [], $token);
comprueba('no se puede aprobar dos veces', $e === 400 && str_contains($d['error'] ?? '', 'ya fue aprobado'));

[$e, $d] = pide('GET', "/api/ventas/$venta", null, $token);
comprueba('la venta guarda su detalle', count($d['items'] ?? []) === 1);
comprueba('el subtotal se calcula', (float) ($d['items'][0]['subtotal'] ?? 0) === 2380000.0);
comprueba('la venta queda marcada como origen web', ($d['venta']['origen'] ?? '') === 'web');

[$e, $d] = pide('GET', '/api/ventas', null, $token);
comprueba('el listado de ventas cuenta las líneas', ((int) ($d['ventas'][0]['lineas'] ?? 0)) === 1);

[$e, $d] = pide('GET', '/api/productos', null, $token);
comprueba('la venta descontó el stock (10 - 2)', ((int) ($d['productos'][0]['stock'] ?? 0)) === 8);

// ------------------------------------------------------------------ conteos
echo "\nConteos de bodega (panel /bodega)\n";
[$e, $d] = pide('POST', '/api/conteos', ['nombre' => 'Conteo de prueba', 'usuario' => 'bodega'], $token);
comprueba('abrir conteo da 201', $e === 201, "estado $e");
$conteo = $d['conteo']['id'] ?? 0;
comprueba('el conteo nace abierto y con creado_en', ($d['conteo']['estado'] ?? '') === 'abierto' && !empty($d['conteo']['creado_en']));

[$e, $d] = pide('POST', '/api/conteos', ['nombre' => 'Otro'], $token);
comprueba('no deja abrir dos conteos a la vez', $e === 409, "estado $e");

[$e, $d] = pide('GET', "/api/conteos/$conteo", null, $token);
comprueba('el conteo lista los productos activos', count($d['items'] ?? []) === 1);

[$e, $d] = pide('POST', "/api/conteos/$conteo/item", ['producto_id' => $pid, 'contado' => 7], $token);
comprueba('anotar lo contado calcula la diferencia', ($d['diferencia'] ?? null) === -1, json_encode($d));

[$e, $d] = pide('POST', "/api/conteos/$conteo/item", ['producto_id' => $pid, 'contado' => 6], $token);
comprueba('volver a anotar el mismo producto actualiza (upsert)', ($d['contado'] ?? null) === 6);

[$e, $d] = pide('POST', "/api/conteos/$conteo/cerrar", ['usuario' => 'bodega'], $token);
comprueba('cerrar el conteo ajusta el inventario', ($d['ajustados'] ?? null) === 1, json_encode($d));
comprueba('el detalle informa antes y después', ($d['detalle'][0]['antes'] ?? null) === 8 && ($d['detalle'][0]['ahora'] ?? null) === 6);

[$e, $d] = pide('GET', '/api/conteos', null, $token);
comprueba('el conteo queda cerrado', ($d['conteos'][0]['estado'] ?? '') === 'cerrado');

// ------------------------------------------------------------------ resumen
echo "\nResumen del panel\n";
[$e, $d] = pide('GET', '/api/resumen', null, $token);
$r = $d['resumen'] ?? [];
comprueba('cuenta los productos', ($r['total'] ?? null) === 1);
comprueba('cuenta las unidades como número', ($r['unidades'] ?? null) === 6);
comprueba('valoriza el inventario', (float) ($r['valorizado'] ?? 0) === 7140000.0, json_encode($r));
comprueba('informa las ventas registradas', ($r['ventas'] ?? null) === 1);
comprueba('ya no hay conteo abierto', array_key_exists('conteo_abierto', $r) && $r['conteo_abierto'] === null);

// -------------------------------------------------------------------- varios
echo "\nBorrado y rutas inexistentes\n";
[$e, $d] = pide('DELETE', '/api/productos/' . rawurlencode($pid), null, $token);
comprueba('borrar producto responde con el id', ($d['eliminado'] ?? '') === $pid);
[$e, $d] = pide('GET', '/api/movimientos', null, $token);
comprueba('el borrado se lleva sus movimientos', count($d['movimientos'] ?? []) === 0);

[$e, $d] = pide('GET', '/api/noexiste');
comprueba('ruta desconocida sin token da 401, igual que el Worker', $e === 401 && ($d['error'] ?? '') === 'No autorizado.');
[$e, $d] = pide('GET', '/api/noexiste', null, $token);
comprueba('ruta desconocida con token da 404 con mensaje', $e === 404 && str_contains($d['error'] ?? '', 'Ruta no encontrada'));

echo "\n" . ($malas === 0 ? "TODO BIEN" : "HAY FALLAS") . ": $total comprobaciones, $malas fallidas.\n\n";
exit($malas === 0 ? 0 : 1);
