/* ============================================================
   NASE Agrotech — Detalle de repuesto (repuesto.html?id=…)
   Galería de renders, descripción, ficha técnica, agregar a
   cotización con cantidad y repuestos relacionados.
   ============================================================ */
(function () {
  "use strict";

  function imagesOf(group) {
    var l = (window.IMG && window.IMG[group]) || [];
    return l.map(function (f) { return "assets/img/" + f; });
  }
  function thumbOf(group) {
    var l = (window.IMG && window.IMG[group]) || [];
    return l.length ? "assets/img/" + l[0].replace(/\.png$/, "-thumb.png") : "";
  }

  /* una fila de ficha puede venir como par ["clave","valor"] o como
     objeto {k, v} según quién la haya escrito: se normaliza a par */
  function fila(f) {
    if (Array.isArray(f)) return f;
    if (f && typeof f === "object") return [f.k || f.clave || "", f.v || f.valor || ""];
    return ["", String(f == null ? "" : f)];
  }

  /* Busca el producto en el inventario (D1); si la API no responde,
     cae al catálogo estático del sitio. */
  function buscaProducto(id) {
    return fetch("/api/vitrina")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var p = (d.productos || []).find(function (x) { return x.id === id; });
        if (!p) return null;
        var fich = [];
        try { fich = JSON.parse(p.ficha || "[]"); } catch (e) {}
        var imgs = [];
        try { imgs = JSON.parse(p.imagenes || "[]"); } catch (e) {}
        return {
          id: p.id, name: p.nombre, model: p.modelo, note: p.nota,
          desc: p.descripcion, ficha: fich.map(fila), pn: p.pn_dji || "", sku: p.sku || "",
          imgs: imgs.length ? imgs : (p.imagen ? [p.imagen] : []),
          thumb: p.imagen || (imgs[0] || ""),
          stock: p.stock, disponibilidad: p.disponibilidad,
        };
      })
      .catch(function () { return null; });
  }
  function delCatalogo(id) {
    var p = (window.PARTS || []).find(function (x) { return x.id === id; });
    if (!p) return null;
    return {
      id: p.id, name: p.name, model: p.model, note: p.note, desc: p.desc,
      ficha: (p.ficha || []).map(fila), pn: p.pn || "", sku: p.sku || "",
      imgs: imagesOf(p.group), thumb: thumbOf(p.group),
    };
  }

  window.renderPartPage = function () {
    /* id por query (?id=…) o por hash (#…) — el hash sobrevive en hostings/preview que recortan el query */
    var id = new URLSearchParams(location.search).get("id") || (location.hash || "").replace(/^#/, "");
    buscaProducto(id).then(function (api) {
      var p = api || delCatalogo(id);
      if (!p) { location.replace("repuestos.html"); return; }
      pinta(p);
    });
  };

  function pinta(p) {
    var app = document.getElementById("app");

    document.title = p.name + " — Repuestos NASE Agrotech";

    var imgs = p.imgs || [];
    var qty = 1;

    var sec = document.createElement("section");
    sec.className = "section";
    sec.innerHTML =
      '<div class="wrap">' +
      '<nav class="breadcrumb" aria-label="Ruta">' +
      '<a href="repuestos.html">Repuestos</a><span>/</span>' +
      '<a href="repuestos.html#' + (p.model === "Común" ? "" : p.model.toLowerCase()) + '">' + (p.model === "Común" ? "Multi-modelo" : p.model) + "</a><span>/</span>" +
      "<span>" + p.name + "</span></nav>" +
      '<div class="part-detail" style="margin-top:22px;">' +

      '<div class="part-media">' +
      '<div class="main blueprint" id="pd-zoom" style="position:relative;">' + corners() +
      '<img id="pd-main" src="' + (imgs[0] || "") + '" alt="' + p.name + '">' +
      '<div class="zoom-ui">' +
      '<button type="button" data-z="out" aria-label="Alejar">−</button>' +
      '<span id="pd-zlevel">100%</span>' +
      '<button type="button" data-z="in" aria-label="Acercar">+</button>' +
      '<button type="button" data-z="reset" aria-label="Restablecer zoom">⟲</button>' +
      "</div>" +
      '<span class="zoom-hint" id="pd-zhint">Rueda o + / − para acercar · arrastra para desplazar</span>' +
      "</div>" +
      (imgs.length > 1
        ? '<div class="thumbs" id="pd-thumbs">' +
          imgs.map(function (src, i) {
            return '<button type="button" class="' + (i === 0 ? "on" : "") + '" data-i="' + i + '" aria-label="Vista ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
          }).join("") +
          "</div>"
        : "") +
      "</div>" +

      '<div class="part-info">' +
      '<span class="model-tag" style="font-size:12px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--color-accent-2-700);">Repuesto · ' + p.model + "</span>" +
      "<h1>" + p.name + "</h1>" +
      '<p class="desc">' + (p.desc || p.note || "") + "</p>" +
      '<table class="ficha"><caption>Ficha técnica</caption><tbody>' +
      (p.ficha || []).map(function (row) {
        return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td></tr>";
      }).join("") +
      /* el N° de parte DJI NO se publica: es trazabilidad interna.
         El SKU cierra la ficha, sin apellido: para el cliente es "el SKU". */
      (p.sku ? '<tr><th scope="row">SKU</th><td>' + p.sku + "</td></tr>" : "") +
      "</tbody></table>" +
      '<div class="part-buy">' +
      '<span class="qty-stepper"><button type="button" aria-label="Quitar uno">−</button><span class="q" id="pd-qty">1</span><button type="button" aria-label="Agregar uno">+</button></span>' +
      '<button type="button" class="btn-add" id="pd-add" style="padding:11px 20px;font-size:14.5px;">Agregar a cotización</button>' +
      '<a class="btn btn-wa" style="text-decoration:none;" target="_blank" rel="noopener" href="' + waQuote("el repuesto: " + p.name + " (" + p.model + ")") + '">Cotizar por WhatsApp</a>' +
      "</div>" +
      '<p class="part-note">Repuesto original DJI · precio y stock se confirman en la cotización. Instalación disponible en nuestro servicio técnico.</p>' +
      "</div></div></div>";
    app.appendChild(sec);

    /* galería */
    var main = sec.querySelector("#pd-main");
    var thumbs = sec.querySelector("#pd-thumbs");
    if (thumbs) {
      thumbs.addEventListener("click", function (ev) {
        var b = ev.target.closest("button");
        if (!b) return;
        main.src = imgs[Number(b.dataset.i)];
        thumbs.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        zReset();
      });
    }

    /* zoom + desplazamiento (R-16b) */
    var zBox = sec.querySelector("#pd-zoom");
    var zLevel = sec.querySelector("#pd-zlevel");
    var zHint = sec.querySelector("#pd-zhint");
    var z = 1, ox = 0, oy = 0;
    function zApply() {
      main.style.transform = "translate(" + ox + "px," + oy + "px) scale(" + z + ")";
      zLevel.textContent = Math.round(z * 100) + "%";
      zBox.classList.toggle("zoomed", z > 1);
      if (zHint && z > 1) zHint.classList.add("hidden");
    }
    function zSet(nz) {
      z = Math.min(5, Math.max(1, nz));
      if (z === 1) { ox = 0; oy = 0; }
      zApply();
    }
    function zReset() { z = 1; ox = 0; oy = 0; zApply(); }
    sec.querySelector(".zoom-ui").addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.z === "in") zSet(z + 0.5);
      if (b.dataset.z === "out") zSet(z - 0.5);
      if (b.dataset.z === "reset") zReset();
    });
    zBox.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      zSet(z + (ev.deltaY < 0 ? 0.35 : -0.35));
    }, { passive: false });
    zBox.addEventListener("dblclick", function () { z > 1 ? zReset() : zSet(2); });
    var dragging = false, sx = 0, sy = 0, bx = 0, by = 0;
    zBox.addEventListener("pointerdown", function (ev) {
      if (z <= 1 || ev.target.closest(".zoom-ui")) return;
      dragging = true; sx = ev.clientX; sy = ev.clientY; bx = ox; by = oy;
      zBox.setPointerCapture && zBox.setPointerCapture(ev.pointerId);
      zBox.classList.add("panning");
    });
    zBox.addEventListener("pointermove", function (ev) {
      if (!dragging) return;
      var lim = (z - 1) * zBox.clientWidth / 2;
      ox = Math.max(-lim, Math.min(lim, bx + (ev.clientX - sx)));
      oy = Math.max(-lim, Math.min(lim, by + (ev.clientY - sy)));
      zApply();
    });
    ["pointerup", "pointercancel"].forEach(function (e) {
      zBox.addEventListener(e, function () { dragging = false; zBox.classList.remove("panning"); });
    });

    /* cantidad + agregar */
    var qEl = sec.querySelector("#pd-qty");
    var steps = sec.querySelectorAll(".qty-stepper button");
    steps[0].addEventListener("click", function () { qty = Math.max(1, qty - 1); qEl.textContent = qty; });
    steps[1].addEventListener("click", function () { qty += 1; qEl.textContent = qty; });
    sec.querySelector("#pd-add").addEventListener("click", function () {
      Cart.add({ id: p.id, name: p.name, model: p.model, img: p.thumb, type: "repuesto", qty: qty });
    });

    /* relacionados: mismos criterios, desde la vitrina o el catálogo */
    var rs = document.createElement("section");
    rs.className = "section";
    rs.innerHTML =
      '<div class="wrap"><span class="eyebrow">Relacionados</span><hr class="rule">' +
      "<h2>También para " + (p.model === "Común" ? "tu flota" : "el " + p.model) + "</h2>" +
      '<div class="card-grid" id="rel-grid"></div></div>';
    app.appendChild(rs);
    var grid = rs.querySelector("#rel-grid");

    function pintaRel(lista) {
      var rel = lista.filter(function (x) { return x.model === p.model && x.id !== p.id; }).slice(0, 4);
      if (!rel.length) { rs.remove(); return; }
      rel.forEach(function (r) {
        var href = "repuesto.html?id=" + r.id;
        var d = document.createElement("div");
        d.className = "product-card blueprint";
        d.innerHTML = corners() +
          '<a class="ph-link" href="' + href + '"><div class="ph"><img src="' + r.img + '" alt="' + r.name + '" loading="lazy"></div></a>' +
          '<div class="body"><span class="model-tag">Repuesto · ' + r.model + "</span>" +
          '<h3><a href="' + href + '" style="color:inherit;text-decoration:none;">' + r.name + "</a></h3>" +
          '<div class="actions"><a class="go" href="' + href + '" style="font-size:12.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-accent-700);text-decoration:none;">Ficha técnica →</a></div></div>';
        grid.appendChild(d);
      });
    }
    fetch("/api/vitrina")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        pintaRel((d.productos || []).map(function (x) {
          return { id: x.id, name: x.nombre, model: x.modelo, img: x.imagen };
        }));
      })
      .catch(function () {
        pintaRel((window.PARTS || []).map(function (x) {
          return { id: x.id, name: x.name, model: x.model, img: thumbOf(x.group) };
        }));
      });

    renderChrome({ waWhat: "el repuesto: " + p.name });
  }
})();
