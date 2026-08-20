/* Respaldo del Worker `curly-feather-8a3c` recuperado desde Cloudflare el
   20-08-2026 (versión desplegada del 17-08-2026). Es el bundle generado por
   wrangler (de ahí __defProp/__name); el código fuente original no estaba
   respaldado. Sirve el sitio estático (ASSETS) y la API /api/* sobre D1. */
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var JSON_H = { "content-type": "application/json; charset=utf-8" };
function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_H });
}
__name(ok, "ok");
function fail(msg, status = 400) {
  return ok({ error: msg }, status);
}
__name(fail, "fail");
function tokenDe(req) {
  const h = req.headers.get("authorization") || "";
  return h.replace(/^Bearer\s+/i, "").trim();
}
__name(tokenDe, "tokenDe");
function autorizado(req, env) {
  const esperado = (env.ADMIN_TOKEN || "").trim();
  if (!esperado) return false;
  return tokenDe(req) === esperado;
}
__name(autorizado, "autorizado");
async function cuerpo(req) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}
__name(cuerpo, "cuerpo");
function slug(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
__name(slug, "slug");
function ahora() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
}
__name(ahora, "ahora");
var CAMPOS = [
  "sku",
  "sku_summit",
  "pn_dji",
  "nombre",
  "modelo",
  "tipo",
  "nota",
  "descripcion",
  "ficha",
  "imagen",
  "imagenes",
  "precio",
  "moneda",
  "stock",
  "stock_min",
  "ubicacion",
  "activo",
  "vitrina",
  "orden",
  "origen"
];
function normaliza(p) {
  const out = {};
  for (const k of CAMPOS) {
    if (p[k] === void 0) continue;
    let v = p[k];
    if (["precio", "stock", "stock_min", "orden", "activo", "vitrina"].includes(k)) {
      v = Number(v);
      if (!isFinite(v)) v = 0;
    }
    if (["ficha", "imagenes"].includes(k) && typeof v !== "string") v = JSON.stringify(v || []);
    out[k] = v;
  }
  return out;
}
__name(normaliza, "normaliza");
async function api(req, env, url) {
  const ruta = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const metodo = req.method.toUpperCase();
  const db = env.DB;
  if (metodo === "OPTIONS") return new Response(null, { status: 204 });
  if (ruta === "salud") {
    const r = await db.prepare("SELECT COUNT(*) AS n FROM productos").first();
    return ok({ ok: true, productos: r?.n ?? 0, protegido: !!(env.ADMIN_TOKEN || "").trim() });
  }
  if (ruta === "login" && metodo === "POST") {
    const b = await cuerpo(req) || {};
    const esperado = (env.ADMIN_TOKEN || "").trim();
    if (!esperado) return fail("El acceso administrativo no est\xE1 configurado en el servidor.", 503);
    const abierto = String(env.ACCESO_ABIERTO || "").trim() === "1";
    if (!abierto && String(b.clave || "").trim() !== esperado) return fail("Clave incorrecta.", 401);
    return ok({ token: esperado, abierto });
  }
  if (ruta === "modo" && metodo === "GET") {
    return ok({ pideClave: String(env.ACCESO_ABIERTO || "").trim() !== "1" });
  }
  if (ruta === "vitrina" && metodo === "GET") {
    const { results } = await db.prepare(
      `SELECT id, sku, sku_summit, pn_dji, nombre, modelo, tipo, nota, descripcion, ficha, imagen, imagenes,
              precio, moneda, stock, orden,
              CASE WHEN stock > 0 THEN 'disponible' ELSE 'a-pedido' END AS disponibilidad
         FROM productos
        WHERE activo = 1 AND vitrina = 1
        ORDER BY orden ASC, nombre ASC`
    ).all();
    return ok({ productos: results || [] });
  }
  if (ruta === "imagenes" && metodo === "GET") {
    const { results } = await db.prepare("SELECT clave, url FROM imagenes").all();
    const mapa = {};
    (results || []).forEach((r) => {
      mapa[r.clave] = r.url;
    });
    return ok({ imagenes: mapa });
  }
  if (ruta === "config" && metodo === "GET") {
    const r = await db.prepare("SELECT valor FROM config WHERE clave = 'sitio'").first();
    return ok({ config: r?.valor ? JSON.parse(r.valor) : null });
  }
  if (ruta === "pedidos" && metodo === "POST") {
    const b = await cuerpo(req);
    if (!b || !Array.isArray(b.items) || !b.items.length) return fail("El pedido no trae productos.");
    if (!b.nombre || !b.telefono) return fail("Faltan los datos de contacto.");
    const items = b.items.slice(0, 60).map((i) => ({
      id: String(i.id || ""),
      nombre: String(i.nombre || i.name || ""),
      cantidad: Math.max(1, Number(i.cantidad || i.qty) || 1),
      tipo: String(i.tipo || i.type || "repuesto")
    }));
    const r = await db.prepare(
      "INSERT INTO pedidos (nombre, telefono, correo, comuna, comentario, items) VALUES (?,?,?,?,?,?)"
    ).bind(
      String(b.nombre).slice(0, 120),
      String(b.telefono).slice(0, 40),
      String(b.correo || "").slice(0, 120),
      String(b.comuna || "").slice(0, 120),
      String(b.comentario || "").slice(0, 600),
      JSON.stringify(items)
    ).run();
    return ok({ pedido_id: r.meta?.last_row_id || null, estado: "pendiente" }, 201);
  }
  if (!autorizado(req, env)) return fail("No autorizado.", 401);
  if (ruta === "productos" && metodo === "GET") {
    const compacto = url.searchParams.get("compacto") === "1";
    const sql = compacto ? `SELECT id, sku, sku_summit, pn_dji, nombre, modelo, tipo, precio, moneda, stock, stock_min,
                ubicacion, activo, vitrina, orden, updated_at,
                CASE WHEN imagen LIKE 'data:%' THEN NULL ELSE imagen END AS imagen
           FROM productos ORDER BY orden ASC, nombre ASC` : "SELECT * FROM productos ORDER BY orden ASC, nombre ASC";
    const { results } = await db.prepare(sql).all();
    return ok({ productos: results || [] });
  }
  if (ruta === "productos" && (metodo === "POST" || metodo === "PUT")) {
    const b = await cuerpo(req);
    if (!b) return fail("Sin contenido.");
    if (!b.id && !b.nombre) return fail("Falta el nombre del producto.");
    const datos = normaliza(b);
    const id = b.id && String(b.id).trim() || "p-" + slug(b.modelo || "gen") + "-" + slug(b.nombre) + "-" + Date.now().toString(36).slice(-4);
    const existe = await db.prepare("SELECT id, stock FROM productos WHERE id = ?").bind(id).first();
    if (existe) {
      const cols2 = Object.keys(datos);
      if (!cols2.length) return fail("Nada que actualizar.");
      const set = cols2.map((c) => `${c} = ?`).join(", ");
      await db.prepare(`UPDATE productos SET ${set}, updated_at = ? WHERE id = ?`).bind(...cols2.map((c) => datos[c]), ahora(), id).run();
      if (datos.stock !== void 0 && Number(datos.stock) !== Number(existe.stock)) {
        const dif = Number(datos.stock) - Number(existe.stock);
        await db.prepare(
          "INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario) VALUES (?,?,?,?,?,?)"
        ).bind(id, dif >= 0 ? "ajuste+" : "ajuste-", Math.abs(dif), Number(datos.stock), "Ajuste al editar el producto", b.usuario || "admin").run();
      }
      const row2 = await db.prepare("SELECT * FROM productos WHERE id = ?").bind(id).first();
      return ok({ producto: row2, creado: false });
    }
    if (!b.nombre) return fail("Falta el nombre del producto.");
    const cols = Object.keys(datos);
    const campos = ["id", ...cols];
    const marcas = campos.map(() => "?").join(",");
    await db.prepare(`INSERT INTO productos (${campos.join(",")}) VALUES (${marcas})`).bind(id, ...cols.map((c) => datos[c])).run();
    if (Number(datos.stock || 0) > 0) {
      await db.prepare(
        "INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario) VALUES (?,?,?,?,?,?)"
      ).bind(id, "inicial", Number(datos.stock), Number(datos.stock), "Stock inicial", b.usuario || "admin").run();
    }
    const row = await db.prepare("SELECT * FROM productos WHERE id = ?").bind(id).first();
    return ok({ producto: row, creado: true }, 201);
  }
  if (ruta.startsWith("productos/") && metodo === "DELETE") {
    const id = decodeURIComponent(ruta.slice("productos/".length));
    await db.prepare("DELETE FROM productos WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM movimientos WHERE producto_id = ?").bind(id).run();
    return ok({ eliminado: id });
  }
  if (ruta === "stock" && metodo === "POST") {
    const b = await cuerpo(req);
    if (!b || !b.producto_id) return fail("Falta el producto.");
    const cant = Math.abs(Number(b.cantidad) || 0);
    if (!cant) return fail("La cantidad debe ser distinta de cero.");
    const p = await db.prepare("SELECT stock FROM productos WHERE id = ?").bind(b.producto_id).first();
    if (!p) return fail("El producto no existe.", 404);
    const tipo = b.tipo === "salida" ? "salida" : "entrada";
    const nuevo = tipo === "entrada" ? Number(p.stock) + cant : Number(p.stock) - cant;
    if (nuevo < 0) return fail("Stock insuficiente: quedan " + p.stock + " unidades.");
    await db.prepare("UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?").bind(nuevo, ahora(), b.producto_id).run();
    await db.prepare(
      "INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario) VALUES (?,?,?,?,?,?)"
    ).bind(b.producto_id, tipo, cant, nuevo, b.motivo || "", b.usuario || "admin").run();
    return ok({ producto_id: b.producto_id, stock: nuevo });
  }
  if (ruta === "movimientos" && metodo === "GET") {
    const pid = url.searchParams.get("producto_id");
    const q = pid ? db.prepare(`SELECT m.*, p.nombre FROM movimientos m LEFT JOIN productos p ON p.id = m.producto_id
                     WHERE m.producto_id = ? ORDER BY m.id DESC LIMIT 200`).bind(pid) : db.prepare(`SELECT m.*, p.nombre FROM movimientos m LEFT JOIN productos p ON p.id = m.producto_id
                     ORDER BY m.id DESC LIMIT 200`);
    const { results } = await q.all();
    return ok({ movimientos: results || [] });
  }
  if (ruta === "imagenes" && (metodo === "POST" || metodo === "PUT")) {
    const b = await cuerpo(req);
    if (!b || !b.clave || !b.url) return fail("Faltan clave y url.");
    await db.prepare(
      "INSERT INTO imagenes (clave, url, descripcion, updated_at) VALUES (?,?,?,?) ON CONFLICT(clave) DO UPDATE SET url = excluded.url, descripcion = excluded.descripcion, updated_at = excluded.updated_at"
    ).bind(b.clave, b.url, b.descripcion || "", ahora()).run();
    return ok({ clave: b.clave, url: b.url });
  }
  if (ruta.startsWith("imagenes/") && metodo === "DELETE") {
    const clave = decodeURIComponent(ruta.slice("imagenes/".length));
    await db.prepare("DELETE FROM imagenes WHERE clave = ?").bind(clave).run();
    return ok({ eliminada: clave });
  }
  if (ruta === "config" && (metodo === "POST" || metodo === "PUT")) {
    const b = await cuerpo(req);
    if (!b) return fail("Sin contenido.");
    await db.prepare(
      "INSERT INTO config (clave, valor, updated_at) VALUES ('sitio', ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = excluded.updated_at"
    ).bind(JSON.stringify(b.config ?? b), ahora()).run();
    return ok({ guardado: true });
  }
  async function registraVenta(b, origen, pedidoId) {
    const lineas = (b.items || []).map((i) => ({
      producto_id: String(i.producto_id || i.id || ""),
      cantidad: Math.max(1, Number(i.cantidad) || 1),
      precio: Number(i.precio) || 0
    })).filter((i) => i.producto_id);
    if (!lineas.length) return { error: "La venta no tiene productos." };
    const datos = [];
    for (const l of lineas) {
      const p = await db.prepare("SELECT id, nombre, stock, precio FROM productos WHERE id = ?").bind(l.producto_id).first();
      if (!p) return { error: "El producto " + l.producto_id + " ya no existe." };
      if (Number(p.stock) < l.cantidad) {
        return { error: "Stock insuficiente de \xAB" + p.nombre + "\xBB: hay " + p.stock + " y se piden " + l.cantidad + "." };
      }
      datos.push({ ...l, nombre: p.nombre, stock: Number(p.stock), precio: l.precio || Number(p.precio) || 0 });
    }
    const total = datos.reduce((s, l) => s + l.cantidad * l.precio, 0);
    const ins = await db.prepare(
      "INSERT INTO ventas (numero, cliente, contacto, documento, total, notas, origen, pedido_id, usuario) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(
      b.numero || "",
      b.cliente || "",
      b.contacto || "",
      b.documento || "",
      total,
      b.notas || "",
      origen,
      pedidoId || null,
      b.usuario || "admin"
    ).run();
    const ventaId = ins.meta?.last_row_id;
    for (const l of datos) {
      const nuevo = l.stock - l.cantidad;
      await db.prepare("INSERT INTO venta_items (venta_id, producto_id, nombre, cantidad, precio, subtotal) VALUES (?,?,?,?,?,?)").bind(ventaId, l.producto_id, l.nombre, l.cantidad, l.precio, l.cantidad * l.precio).run();
      await db.prepare("UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?").bind(nuevo, ahora(), l.producto_id).run();
      await db.prepare(
        "INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario) VALUES (?,?,?,?,?,?)"
      ).bind(
        l.producto_id,
        "salida",
        l.cantidad,
        nuevo,
        "Venta #" + ventaId + (b.cliente ? " \xB7 " + b.cliente : ""),
        b.usuario || "admin"
      ).run();
    }
    return { venta_id: ventaId, total };
  }
  __name(registraVenta, "registraVenta");
  if (ruta === "ventas" && metodo === "POST") {
    const b = await cuerpo(req);
    if (!b) return fail("Sin contenido.");
    const r = await registraVenta(b, b.origen || "mostrador", null);
    if (r.error) return fail(r.error);
    return ok(r, 201);
  }
  if (ruta === "ventas" && metodo === "GET") {
    const { results } = await db.prepare(
      `SELECT v.*, (SELECT COUNT(*) FROM venta_items i WHERE i.venta_id = v.id) AS lineas
         FROM ventas v ORDER BY v.id DESC LIMIT 200`
    ).all();
    return ok({ ventas: results || [] });
  }
  if (ruta.startsWith("ventas/") && metodo === "GET") {
    const id = Number(ruta.slice("ventas/".length));
    const v = await db.prepare("SELECT * FROM ventas WHERE id = ?").bind(id).first();
    if (!v) return fail("Venta no encontrada.", 404);
    const { results } = await db.prepare("SELECT * FROM venta_items WHERE venta_id = ?").bind(id).all();
    return ok({ venta: v, items: results || [] });
  }
  if (ruta === "pedidos" && metodo === "GET") {
    const estado = url.searchParams.get("estado");
    const q = estado ? db.prepare("SELECT * FROM pedidos WHERE estado = ? ORDER BY id DESC LIMIT 200").bind(estado) : db.prepare("SELECT * FROM pedidos ORDER BY id DESC LIMIT 200");
    const { results } = await q.all();
    return ok({ pedidos: results || [] });
  }
  if (/^pedidos\/\d+\/aprobar$/.test(ruta) && metodo === "POST") {
    const id = Number(ruta.split("/")[1]);
    const p = await db.prepare("SELECT * FROM pedidos WHERE id = ?").bind(id).first();
    if (!p) return fail("Pedido no encontrado.", 404);
    if (p.estado !== "pendiente") return fail("Este pedido ya fue " + p.estado + ".");
    let items = [];
    try {
      items = JSON.parse(p.items || "[]");
    } catch (e) {
    }
    const b = await cuerpo(req) || {};
    const r = await registraVenta({
      items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
      cliente: p.nombre,
      contacto: p.telefono,
      notas: "Pedido web #" + id + (p.comuna ? " \xB7 " + p.comuna : ""),
      usuario: b.usuario || "admin"
    }, "web", id);
    if (r.error) return fail(r.error);
    await db.prepare("UPDATE pedidos SET estado = 'aprobado', venta_id = ?, resuelto_en = ? WHERE id = ?").bind(r.venta_id, ahora(), id).run();
    return ok({ pedido_id: id, venta_id: r.venta_id, total: r.total });
  }
  if (/^pedidos\/\d+\/rechazar$/.test(ruta) && metodo === "POST") {
    const id = Number(ruta.split("/")[1]);
    await db.prepare("UPDATE pedidos SET estado = 'rechazado', resuelto_en = ? WHERE id = ? AND estado = 'pendiente'").bind(ahora(), id).run();
    return ok({ pedido_id: id, estado: "rechazado" });
  }
  if (ruta === "conteos" && metodo === "GET") {
    const { results } = await db.prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM conteo_items i WHERE i.conteo_id = c.id) AS contados
         FROM conteos c ORDER BY c.id DESC LIMIT 100`
    ).all();
    return ok({ conteos: results || [] });
  }
  if (ruta === "conteos" && metodo === "POST") {
    const b = await cuerpo(req) || {};
    const abierto = await db.prepare("SELECT id FROM conteos WHERE estado = 'abierto' ORDER BY id DESC").first();
    if (abierto && !b.forzar) return fail("Ya hay un conteo abierto (#" + abierto.id + "). Ci\xE9rralo o an\xFAlalo antes de empezar otro.", 409);
    const ins = await db.prepare(
      "INSERT INTO conteos (nombre, alcance, usuario, notas) VALUES (?,?,?,?)"
    ).bind(
      String(b.nombre || "Conteo").slice(0, 120),
      String(b.alcance || "Todo el inventario").slice(0, 120),
      String(b.usuario || "bodega").slice(0, 60),
      String(b.notas || "").slice(0, 600)
    ).run();
    const c = await db.prepare("SELECT * FROM conteos WHERE id = ?").bind(ins.meta?.last_row_id).first();
    return ok({ conteo: c }, 201);
  }
  if (/^conteos\/\d+$/.test(ruta) && metodo === "GET") {
    const id = Number(ruta.split("/")[1]);
    const c = await db.prepare("SELECT * FROM conteos WHERE id = ?").bind(id).first();
    if (!c) return fail("Conteo no encontrado.", 404);
    const { results } = await db.prepare(
      `SELECT p.id AS producto_id, p.nombre, p.sku, p.sku_summit, p.pn_dji, p.modelo, p.tipo, p.ubicacion,
              p.stock, p.stock_min, i.contado, i.esperado, i.updated_at
         FROM productos p
         LEFT JOIN conteo_items i ON i.producto_id = p.id AND i.conteo_id = ?
        WHERE p.activo = 1
        ORDER BY p.ubicacion IS NULL, p.ubicacion ASC, p.nombre ASC`
    ).bind(id).all();
    return ok({ conteo: c, items: results || [] });
  }
  if (/^conteos\/\d+\/item$/.test(ruta) && metodo === "POST") {
    const id = Number(ruta.split("/")[1]);
    const b = await cuerpo(req) || {};
    const c = await db.prepare("SELECT id, estado FROM conteos WHERE id = ?").bind(id).first();
    if (!c) return fail("Conteo no encontrado.", 404);
    if (c.estado !== "abierto") return fail("Este conteo ya est\xE1 " + c.estado + ".");
    if (!b.producto_id) return fail("Falta el producto.");
    const p = await db.prepare("SELECT id, stock FROM productos WHERE id = ?").bind(b.producto_id).first();
    if (!p) return fail("El producto no existe.", 404);
    if (b.contado === null || b.contado === "") {
      await db.prepare("DELETE FROM conteo_items WHERE conteo_id = ? AND producto_id = ?").bind(id, b.producto_id).run();
      return ok({ producto_id: b.producto_id, contado: null });
    }
    const contado = Math.max(0, Math.round(Number(b.contado) || 0));
    const esperado = Number(p.stock) || 0;
    await db.prepare(
      `INSERT INTO conteo_items (conteo_id, producto_id, esperado, contado, diferencia, usuario, updated_at)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(conteo_id, producto_id) DO UPDATE SET
         esperado = excluded.esperado, contado = excluded.contado,
         diferencia = excluded.diferencia, usuario = excluded.usuario, updated_at = excluded.updated_at`
    ).bind(id, b.producto_id, esperado, contado, contado - esperado, String(b.usuario || "bodega").slice(0, 60), ahora()).run();
    return ok({ producto_id: b.producto_id, contado, esperado, diferencia: contado - esperado });
  }
  if (/^conteos\/\d+\/cerrar$/.test(ruta) && metodo === "POST") {
    const id = Number(ruta.split("/")[1]);
    const b = await cuerpo(req) || {};
    const c = await db.prepare("SELECT * FROM conteos WHERE id = ?").bind(id).first();
    if (!c) return fail("Conteo no encontrado.", 404);
    if (c.estado !== "abierto") return fail("Este conteo ya est\xE1 " + c.estado + ".");
    const { results } = await db.prepare(
      "SELECT producto_id, contado FROM conteo_items WHERE conteo_id = ?"
    ).bind(id).all();
    const items = results || [];
    if (!items.length) return fail("El conteo no tiene productos anotados.");
    const usuario = String(b.usuario || c.usuario || "bodega").slice(0, 60);
    const detalle = [];
    for (const it of items) {
      const p = await db.prepare("SELECT id, nombre, stock FROM productos WHERE id = ?").bind(it.producto_id).first();
      if (!p) continue;
      const antes = Number(p.stock) || 0;
      const dif = Number(it.contado) - antes;
      await db.prepare("UPDATE conteo_items SET esperado = ?, diferencia = ? WHERE conteo_id = ? AND producto_id = ?").bind(antes, dif, id, it.producto_id).run();
      if (!dif) continue;
      await db.prepare("UPDATE productos SET stock = ?, updated_at = ? WHERE id = ?").bind(Number(it.contado), ahora(), it.producto_id).run();
      await db.prepare(
        "INSERT INTO movimientos (producto_id, tipo, cantidad, stock_resultante, motivo, usuario) VALUES (?,?,?,?,?,?)"
      ).bind(
        it.producto_id,
        dif > 0 ? "ajuste+" : "ajuste-",
        Math.abs(dif),
        Number(it.contado),
        "Conteo #" + id + (c.nombre ? " \xB7 " + c.nombre : ""),
        usuario
      ).run();
      detalle.push({ producto_id: p.id, nombre: p.nombre, antes, ahora: Number(it.contado), diferencia: dif });
    }
    await db.prepare("UPDATE conteos SET estado = 'cerrado', cerrado_en = ?, items = ?, ajustados = ? WHERE id = ?").bind(ahora(), items.length, detalle.length, id).run();
    return ok({ conteo_id: id, items: items.length, ajustados: detalle.length, detalle });
  }
  if (/^conteos\/\d+\/anular$/.test(ruta) && metodo === "POST") {
    const id = Number(ruta.split("/")[1]);
    await db.prepare("UPDATE conteos SET estado = 'anulado', cerrado_en = ? WHERE id = ? AND estado = 'abierto'").bind(ahora(), id).run();
    return ok({ conteo_id: id, estado: "anulado" });
  }
  if (ruta === "resumen" && metodo === "GET") {
    const t = await db.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
              SUM(CASE WHEN vitrina = 1 AND activo = 1 THEN 1 ELSE 0 END) AS en_vitrina,
              SUM(CASE WHEN stock <= stock_min THEN 1 ELSE 0 END) AS bajo_minimo,
              SUM(stock) AS unidades,
              SUM(stock * precio) AS valorizado
         FROM productos`
    ).first();
    const p = await db.prepare("SELECT COUNT(*) AS n FROM pedidos WHERE estado = 'pendiente'").first();
    const v = await db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS monto FROM ventas").first();
    const c = await db.prepare("SELECT id, nombre FROM conteos WHERE estado = 'abierto' ORDER BY id DESC").first();
    return ok({ resumen: Object.assign({}, t || {}, {
      pedidos_pendientes: p?.n || 0,
      ventas: v?.n || 0,
      ventas_monto: v?.monto || 0,
      conteo_abierto: c?.id || null,
      conteo_nombre: c?.nombre || null
    }) });
  }
  return fail("Ruta no encontrada: " + ruta, 404);
}
__name(api, "api");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      try {
        return await api(request, env, url);
      } catch (e) {
        return fail("Error del servidor: " + (e && e.message ? e.message : String(e)), 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  index_default as default
};
