/* ============================================================
   NASE Agrotech — Tienda de repuestos
   Grilla filtrable por modelo. Cada repuesto enlaza a su página
   de detalle (repuesto.html?id=…) con ficha técnica, y todo se
   agrega al carrito de cotización (sin precios en línea).
   ============================================================ */
(function () {
  "use strict";

  /* imagen de reemplazo mientras las piezas nuevas no tienen foto propia */
  var PLACEHOLDER = "assets/img/parts/sin-foto.svg";

  function thumbOf(group) {
    var l = (window.IMG && window.IMG[group]) || [];
    if (!l.length) return "";
    // el pipeline genera <slug>-thumb.png junto al principal
    return "assets/img/" + l[0].replace(/\.png$/, "-thumb.png");
  }
  function fullOf(group) {
    var l = (window.IMG && window.IMG[group]) || [];
    return l.length ? "assets/img/" + l[0] : "";
  }

  /* La vitrina viene del inventario (D1). Si la API no responde,
     se usa el catálogo estático para que la tienda nunca quede vacía. */
  function normaliza(p) {
    return {
      id: p.id,
      name: p.nombre || p.name,
      model: p.modelo || p.model,
      note: p.nota || p.note || "",
      sku: p.sku || "",
      /* el N° de parte DJI no se muestra, pero sí se puede buscar por él */
      pn: p.pn_dji || p.pn || "",
      img: p.imagen || thumbOf(p.group) || fullOf(p.group) || PLACEHOLDER,
      stock: typeof p.stock === "number" ? p.stock : null,
      disponibilidad: p.disponibilidad || null,
    };
  }
  window.cargarVitrina = function () {
    return fetch("/api/vitrina")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var l = (d.productos || []).filter(function (p) { return (p.tipo || "repuesto") !== "equipo"; });
        return l.length ? l.map(normaliza) : (window.PARTS || []).map(normaliza);
      })
      .catch(function () { return (window.PARTS || []).map(normaliza); });
  };

  function card(item) {
    var href = "repuesto.html?id=" + item.id;
    var div = document.createElement("div");
    div.className = "product-card blueprint reveal";
    div.dataset.model = item.model;
    var dispo = item.disponibilidad === "disponible"
      ? '<span class="dispo ok">Disponible</span>'
      : (item.disponibilidad ? '<span class="dispo">A pedido</span>' : "");
    div.innerHTML =
      corners() +
      '<a class="ph-link" href="' + href + '" aria-label="' + item.name + '">' +
      '<div class="ph"><img src="' + item.img + '" alt="' + item.name + '" loading="lazy"></div></a>' +
      '<div class="body">' +
      '<span class="model-tag">Repuesto · ' + item.model + dispo + "</span>" +
      '<h3><a href="' + href + '" style="color:inherit;text-decoration:none;">' + item.name + "</a></h3>" +
      /* el SKU no se muestra en el listado: va solo en la ficha del repuesto */
      '<p class="note">' + (item.note || "") + "</p>" +
      '<div class="actions">' +
      '<a class="go" href="' + href + '" style="font-size:12.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-accent-700);text-decoration:none;">Ficha técnica →</a>' +
      '<button type="button" class="btn-add">Agregar a cotización</button>' +
      "</div></div>";
    div.querySelector(".btn-add").addEventListener("click", function () {
      var btn = this;
      Cart.add({
        id: item.id,
        name: item.name,
        model: item.model,
        img: item.img,
        type: "repuesto",
      });
      btn.textContent = "Agregado ✓";
      btn.classList.add("added");
      setTimeout(function () { btn.textContent = "Agregar a cotización"; btn.classList.remove("added"); }, 1400);
    });
    return div;
  }

  window.renderShop = function () {
    var app = document.getElementById("app");

    /* ---------- encabezado ---------- */
    var head = document.createElement("section");
    head.className = "model-hero full-bleed";
    head.innerHTML =
      '<div class="bg"><img src="' + G("kv/multi", 0) + '" alt=""><div class="veil"></div></div>' +
      '<div class="wrap inner" style="padding-bottom:clamp(24px,4vh,40px);">' +
      '<span class="eyebrow on-dark">Tienda · repuestos · accesorios DJI</span>' +
      "<h1>Repuestos<br>y accesorios</h1>" +
      '<p class="tagline">Explora cada producto con imagen, ficha técnica y compatibilidad, arma tu pedido y recibe tu cotización.</p>' +
      "</div>";
    app.appendChild(head);

    /* ---------- repuestos ---------- */
    var sec = document.createElement("section");
    sec.className = "section";
    sec.innerHTML =
      '<div class="wrap">' +
      '<span class="eyebrow">Repuestos y accesorios</span><hr class="rule">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;">' +
      "<h2>Pieza por pieza</h2>" +
      '<p style="font-size:13.5px;color:color-mix(in srgb,var(--color-text) 62%,transparent);margin:0;max-width:44ch;">Entra a cada pieza para ver su ficha técnica completa.</p>' +
      "</div>" +
      '<div class="filter-bar" id="filters"></div>' +
      '<div class="card-grid" id="grid-parts"></div></div>';
    app.appendChild(sec);

    var fbar = sec.querySelector("#filters");
    var grid = sec.querySelector("#grid-parts");
    var ITEMS = [];
    var filtroActual = "Todos";

    var busqueda = "";

    /* la búsqueda mira nombre, nota, SKU y N° de parte DJI: el cliente que
       llega con el código de la pieza la encuentra aunque no se publique.
       Sin tildes: "bateria" tiene que encontrar "Batería". */
    function norm(s) {
      return String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    }
    function coincide(p, q) {
      if (!q) return true;
      return [p.name, p.note, p.model, p.sku, p.pn].some(function (v) {
        return norm(v).indexOf(q) >= 0;
      });
    }

    function apply(f) {
      filtroActual = f;
      grid.innerHTML = "";
      ITEMS.forEach(function (p) {
        if (f !== "Todos" && p.model !== f) return;
        if (!coincide(p, busqueda)) return;
        grid.appendChild(card(p));
      });
      if (!grid.children.length) {
        grid.innerHTML = '<p style="grid-column:1/-1;padding:28px 0;color:color-mix(in srgb,var(--color-text) 60%,transparent);">' +
          (busqueda ? "No encontramos repuestos para «" + busqueda + "». Prueba con el nombre de la pieza o escríbenos por WhatsApp." :
            "No hay repuestos en esta categoría por ahora.") + "</p>";
      }
      grid.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("in"); });
    }

    /* modelos presentes en la vitrina, en orden fijo conocido */
    var filters = ["Todos", "T100", "T70P", "Común"];
    filters.forEach(function (f, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "filter-chip" + (i === 0 ? " on" : "");
      b.textContent = f === "Común" ? "Multi-modelo" : f;
      b.dataset.f = f;
      b.addEventListener("click", function () {
        fbar.querySelectorAll(".filter-chip").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        apply(f);
      });
      fbar.appendChild(b);
    });

    /* buscador de la tienda */
    var busca = document.createElement("input");
    busca.type = "search";
    busca.className = "shop-search";
    busca.placeholder = "Buscar repuesto o código de pieza…";
    busca.setAttribute("aria-label", "Buscar repuesto");
    busca.addEventListener("input", function () {
      busqueda = norm(busca.value.trim());
      apply(filtroActual);
    });
    fbar.appendChild(busca);

    // filtro inicial por hash (#t100 / #t70p desde las páginas de modelo)
    var hash = (location.hash || "").replace("#", "").toUpperCase();
    var initial = (hash === "T100" || hash === "T70P") ? hash : "Todos";
    if (initial !== "Todos") {
      fbar.querySelectorAll(".filter-chip").forEach(function (x) {
        x.classList.toggle("on", x.dataset.f === initial);
      });
    }
    grid.innerHTML = '<p style="grid-column:1/-1;padding:28px 0;color:color-mix(in srgb,var(--color-text) 55%,transparent);">Cargando repuestos…</p>';
    window.cargarVitrina().then(function (items) {
      ITEMS = items;
      apply(initial);
    });

    /* ---------- ¿buscas un equipo completo? ---------- */
    var eq = document.createElement("section");
    eq.className = "section";
    eq.innerHTML =
      '<div class="wrap"><div class="blueprint" style="position:relative;padding:clamp(22px,3vw,36px);display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;">' +
      corners() +
      '<div><h3 style="margin:0;font-size:24px;text-transform:uppercase;letter-spacing:0.02em;">¿Buscas un equipo completo?</h3>' +
      '<p style="margin:8px 0 0;font-size:14px;color:color-mix(in srgb,var(--color-text) 65%,transparent);">Los drones se cotizan desde su propia página, con visor 360 y configuraciones.</p></div>' +
      '<a class="btn btn-primary" style="text-decoration:none;" href="index.html#modelos">Ver modelos</a>' +
      "</div></div>";
    app.appendChild(eq);

    /* ---------- cómo funciona ---------- */
    var how = document.createElement("section");
    how.className = "section-dark full-bleed";
    how.innerHTML =
      '<div class="wrap section"><span class="eyebrow on-dark">Cómo funciona</span>' +
      "<h2>Del carrito a tu campo</h2>" +
      '<div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">' +
      ["<b>1 · Arma tu pedido</b><br>Agrega repuestos a tu cotización.",
       "<b>2 · Deja tus datos</b><br>Nombre, teléfono y comuna. Sin pagos en línea.",
       "<b>3 · Enviamos el requerimiento</b><br>Se abre WhatsApp con tu pedido listo para enviar.",
       "<b>4 · Te cotizamos</b><br>Respondemos con precio, stock y plazo de entrega."]
        .map(function (t) {
          return '<div class="blueprint" style="padding:18px;position:relative;border-color:rgba(244,242,236,0.28);font-size:14px;line-height:1.55;color:rgba(244,242,236,0.85);">' + corners() + t + "</div>";
        }).join("") +
      "</div></div>";
    app.appendChild(how);

    renderChrome({ waWhat: "repuestos DJI Agras" });

    var openBtn = document.createElement("div");
    openBtn.className = "wrap";
    openBtn.style.cssText = "text-align:center;padding:26px 20px 0;";
    openBtn.innerHTML = '<button type="button" class="btn btn-primary" id="open-cart-cta" style="cursor:pointer;">Ver mi cotización</button>';
    app.appendChild(openBtn);
    document.getElementById("open-cart-cta").addEventListener("click", function () { Cart.open(); });
  };
})();
