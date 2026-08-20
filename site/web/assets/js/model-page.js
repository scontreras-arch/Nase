/* ============================================================
   NASE Agrotech — render de páginas de modelo
   Cada página de modelo es un shell mínimo que llama a
   renderModelPage('<id>'); todo se arma desde MODELS (data.js).
   ============================================================ */
(function () {
  "use strict";

  function h(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  window.renderModelPage = function (id) {
    var m = window.MODELS[id];
    if (!m) return;
    var app = document.getElementById("app");
    app.dataset.model = id;

    /* ---------- hero ---------- */
    var kv = m.kv ? G(m.kv, m.kvIndex || 0) : (m.appBg ? m.appBg() : "");
    var heroBg = kv
      ? '<div class="bg"><img data-img="modelo.' + id + '.hero" src="' + kv + '" alt=""><div class="veil"></div></div>'
      : '<div class="bg"><div class="veil" style="background:linear-gradient(180deg,var(--nase-dark),var(--nase-dark-2));"></div></div>';

    var specCells = m.specs.map(function (s) {
      return '<div class="cell"><span class="v">' + s.v + '</span><span class="l">' + s.l + "</span></div>";
    }).join("");

    app.appendChild(h(
      '<section class="model-hero full-bleed">' + heroBg +
      '<div class="wrap inner">' +
      '<span class="eyebrow on-dark">' + (m.eyebrow || (m.kicker ? m.kicker + " · " : "") + "DJI") + "</span>" +
      "<h1>" + m.name + "</h1>" +
      '<p class="tagline">' + m.tagline + "</p>" +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:26px;">' +
      '<a class="btn btn-primary btn-wa" target="_blank" rel="noopener" href="' + waQuote("el " + m.name) + '">Cotizar por WhatsApp</a>' +
      '<button type="button" class="btn" id="hero-add" style="color:var(--color-bg);border-color:rgba(244,242,236,0.45);background:transparent;cursor:pointer;">Agregar a cotización</button>' +
      (m.pdf
        ? '<a class="btn btn-pdf" target="_blank" rel="noopener" href="' + m.pdf + '" title="Ficha técnica / manual Oficial DJI (PDF, inglés)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' +
          "Ficha PDF</a>"
        : "") +
      "</div>" +
      '<div class="spec-strip">' + specCells + "</div>" +
      '<p style="font-size:12px;color:rgba(244,242,236,0.5);margin:10px 0 0;">' + (m.specSource || "") + "</p>" +
      "</div></section>"
    ));

    function addEquipo() {
      var eq = window.EQUIPOS.find(function (e) { return e.id === "eq-" + id; });
      Cart.add({ id: "eq-" + id, name: m.name, model: m.short, img: eq ? eq.img() : "", type: "equipo" });
    }
    document.getElementById("hero-add").addEventListener("click", addEquipo);

    /* ---------- barra de otros modelos ---------- */
    var strip = window.MODEL_ORDER.filter(function (x) { return x !== id; }).map(function (x) {
      var o = window.MODELS[x];
      var thumb = (o.appBg && !o.cardCover) ? o.appBg() : o.cardImg();
      return '<a href="' + o.page + '" title="' + o.name + '">' +
        '<span class="th"><img src="' + thumb + '" alt="" loading="lazy"></span>' +
        "<span>" + o.short + "</span></a>";
    }).join("");
    app.appendChild(h(
      '<div class="wrap"><nav class="model-strip" aria-label="Otros modelos">' +
      '<span class="strip-label">Otros modelos</span>' + strip +
      '<a class="cmp" href="comparador.html"><span>Comparar →</span></a>' +
      "</nav></div>"
    ));

    /* ---------- visor ---------- */
    if (m.viewer) {
      app.appendChild(h(
        '<section class="viewer-section"><div class="wrap">' +
        '<span class="eyebrow">Explora antes de volar</span>' +
        '<hr class="rule">' +
        '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;">' +
        "<h2>Cada detalle en 3D</h2>" +
        '<p style="font-size:13.5px;color:color-mix(in srgb,var(--color-text) 62%, transparent);margin:0;max-width:44ch;">Gíralo, cambia su configuración y descubre cada detalle antes de llevarlo al campo.</p>' +
        "</div>" +
        '<div id="viewer-mount"></div>' +
        "</div></section>"
      ));
      initViewer(document.getElementById("viewer-mount"), m, { onQuote: addEquipo });
    }

    /* ---------- video (T55) ---------- */
    if (m.video) {
      app.appendChild(h(
        '<section class="section"><div class="wrap">' +
        '<span class="eyebrow">Lanzamiento</span><hr class="rule">' +
        '<figure class="blueprint" style="margin:0;position:relative;">' + corners() +
        '<iframe src="' + m.video + '" title="' + (m.videoTitle || m.name) + '" allow="autoplay; fullscreen" allowfullscreen ' +
        'style="display:block;width:100%;aspect-ratio:16/9;border:0;background:var(--nase-dark);"></iframe>' +
        "</figure></div></section>"
      ));
    }

    /* ---------- despiece / repuestos ---------- */
    if (m.despiece) {
      var dImg = G(m.despiece.group, (m.despiece.pick && m.despiece.pick[0]) || 0);
      app.appendChild(h(
        '<section class="section-dark full-bleed"><div class="wrap section">' +
        '<div style="display:flex;gap:clamp(24px,4vw,56px);align-items:center;flex-wrap:wrap;">' +
        '<div style="flex:1 1 420px;"><figure class="blueprint" style="margin:0;position:relative;border-color:rgba(244,242,236,0.3);">' + corners() +
        '<img src="' + dImg + '" alt="Despiece del ' + m.name + '" style="display:block;width:100%;background:var(--nase-dark-2);" loading="lazy">' +
        "</figure></div>" +
        '<div style="flex:1 1 300px;">' +
        '<span class="eyebrow on-dark">Postventa y repuestos</span>' +
        "<h2>Cada pieza, disponible</h2>" +
        '<p class="lead">Trabajamos con <strong>repuestos y accesorios originales DJI</strong> para toda la gama Agras. Encuentra lo que necesita tu equipo, arma tu pedido en nuestra tienda y solicita tu cotización directamente con NASE Agrotech.</p>' +
        '<div style="margin-top:22px;"><a class="btn btn-primary" style="text-decoration:none;background:var(--nase-lime);border-color:var(--nase-lime);color:var(--nase-dark);" href="repuestos.html#' + m.short.toLowerCase() + '">Ver repuestos ' + m.short + "</a></div>" +
        "</div></div></div></section>"
      ));
    }

    /* ---------- galería ---------- */
    var gal = m.gallery ? GA(m.gallery) : [];
    if (gal.length) {
      var figs = gal.map(function (src, i) {
        return '<figure class="reveal" style="transition-delay:' + Math.min(i * 40, 200) + 'ms;"><img src="' + src + '" alt="' + m.name + ' — foto ' + (i + 1) + '" loading="lazy"></figure>';
      }).join("");
      app.appendChild(h(
        '<section class="section"><div class="wrap">' +
        '<span class="eyebrow">Galería</span><hr class="rule">' +
        "<h2>" + (m.galleryTitle || "En terreno") + "</h2>" +
        '</div><div class="wrap" style="max-width:none;padding-right:0;"><div class="gallery" style="margin-top:24px;">' + figs + "</div></div></section>"
      ));
    }

    /* ---------- CTA final ---------- */
    app.appendChild(h(
      '<section class="full-bleed" style="background:var(--nase-dark);color:var(--color-bg);">' +
      '<div class="wrap" style="padding-top:clamp(40px,6vw,72px);padding-bottom:clamp(40px,6vw,72px);text-align:center;">' +
      '<span class="eyebrow on-dark" style="display:block;">' + NASE.zona + "</span>" +
      '<h2 style="font-size:clamp(30px,4vw,52px);">¿Listo para verlo en tu campo?</h2>' +
      '<p style="max-width:52ch;margin:16px auto 0;font-size:15px;line-height:1.55;color:rgba(244,242,236,0.78);">Coordinamos demostraciones en terreno para que conozcas la tecnología DJI Agras en condiciones reales.</p>' +
      '<div style="margin-top:26px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">' +
      '<a class="btn btn-primary btn-wa" target="_blank" rel="noopener" href="' + waQuote("el " + m.name + " con demostración en terreno") + '">Cotizar por WhatsApp</a>' +
      '<a class="btn" style="color:var(--color-bg);border-color:rgba(244,242,236,0.4);text-decoration:none;" href="index.html#modelos">Ver otros modelos</a>' +
      "</div></div></section>"
    ));

    renderChrome({ waWhat: "el " + m.name });
  };
})();
