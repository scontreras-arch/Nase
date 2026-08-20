/* ============================================================
   NASE Agrotech — chrome compartido del sitio
   Nav, footer, botón WhatsApp flotante, reveal-on-scroll y
   utilidades comunes. El carrito vive en cart.js.
   ============================================================ */
(function () {
  "use strict";

  var ICON_WA =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z"/></svg>';

  var ICON_CART =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:20px;height:20px;display:block;"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';

  window.waLink = function (text) {
    return "https://wa.me/" + NASE.whatsapp + "?text=" + encodeURIComponent(text);
  };
  window.waQuote = function (what) {
    return waLink("Hola " + NASE.brand + ", quiero cotizar " + what + ". Vi su sitio web.");
  };

  window.renderChrome = function (opts) {
    opts = opts || {};

    /* ---------- nav ---------- */
    var nav = document.createElement("nav");
    nav.className = "nav";
    nav.innerHTML =
      '<a class="nav-brand" href="index.html" style="display:inline-flex;align-items:center;gap:10px;">' +
      '<img src="assets/img/logo/logo-nase.png" alt="NASE Agrotech"></a>' +
      '<a href="t100.html">T100</a>' +
      '<a href="index.html#modelos">Modelos</a>' +
      '<a href="comparador.html">Comparador</a>' +
      '<a href="repuestos.html">Repuestos</a>' +
      '<a href="index.html#servicios">Servicios</a>' +
      '<a href="index.html#nosotros">Nosotros</a>' +
      '<a href="index.html#contacto">Contacto</a>' +
      '<button type="button" class="btn btn-ghost cart-btn" id="nav-cart" aria-label="Abrir carrito de cotización">' +
      ICON_CART + '<span class="cart-count" id="nav-cart-count">0</span></button>' +
      '<a class="btn btn-primary btn-wa" href="' + waQuote("un dron DJI Agras") + '" target="_blank" rel="noopener">Cotizar</a>';
    document.body.prepend(nav);

    /* ---------- footer ---------- */
    var foot = document.createElement("footer");
    foot.className = "site-footer";
    foot.innerHTML =
      '<div class="wrap">' +
      '<div class="inner">' +
      '<div><img src="assets/img/logo/logo-nase-blanco.png" alt="NASE Agrotech">' +
      '<p style="font-size:13.5px;max-width:34ch;line-height:1.55;margin:14px 0 0;color:rgba(244,242,236,0.6);">Distribuidor Oficial DJI Agriculture - Enterprise. ' + NASE.zona + ".</p>" +
      '<div class="footer-social">' +
      '<a href="' + waQuote("un dron DJI Agras") + '" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">' +
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.24 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z"/></svg></a>' +
      '<a href="https://instagram.com/' + (NASE.instagram || "naseagrotech") + '" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>' +
      '<a href="mailto:' + NASE.email + '" aria-label="Correo" title="Correo">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></a>' +
      '<a href="https://www.google.com/maps/search/?api=1&query=Regi%C3%B3n+del+Maule%2C+Chile" target="_blank" rel="noopener" aria-label="Ubicación" title="Región del Maule">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg></a>' +
      "</div></div>" +
      "<nav>" +
      '<a href="t100.html">Agras T100</a>' +
      '<a href="t70p.html">Agras T70P</a>' +
      '<a href="t55.html">Agras T55</a>' +
      '<a href="t25p.html">Agras T25P</a>' +
      '<a href="dock3.html">Dock 3</a>' +
      '<a href="matrice4.html">Matrice 4</a>' +
      '<a href="repuestos.html">Repuestos</a>' +
      '<a href="index.html#contacto">Contacto</a>' +
      '<a href="admin/index.html" style="color:var(--nase-lime);">Acceso interno →</a>' +
      "</nav>" +
      "</div>" +
      '<p class="legal">© ' + new Date().getFullYear() + " " + NASE.brand + " · Distribuidor DJI · Imágenes y videos: material Oficial DJI para distribuidores.</p>" +
      "</div>";
    document.body.appendChild(foot);

    /* ---------- WhatsApp flotante ---------- */
    var wa = document.createElement("a");
    wa.className = "wa-float";
    wa.href = waQuote(opts.waWhat || "un dron DJI Agras");
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "Cotizar por WhatsApp");
    wa.innerHTML = ICON_WA;
    document.body.appendChild(wa);

    /* ---------- reveal on scroll ---------- */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll(".reveal").forEach(function (n) { io.observe(n); });
    } else {
      document.querySelectorAll(".reveal").forEach(function (n) { n.classList.add("in"); });
    }

    initDroneCycle();
    if (window.initCart) window.initCart();
    initSitio();
    initLightbox();
    window.applySavedTexts();
    marcaClaves();
    aplicaImagenesAdmin();
    aplicaPublicado();
  };

  /* ---------- imágenes administrables (R-19) ----------
     Cualquier <img data-img="clave"> puede reemplazarse desde el
     panel de inventario sin tocar el código del sitio. */
  var OCULTO = "__oculto__";
  function aplicaImagenesAdmin() {
    if (!document.querySelector("[data-img]")) return;
    fetch("/api/imagenes")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var m = d.imagenes || {};
        document.querySelectorAll("[data-img]").forEach(function (el) {
          var url = m[el.dataset.img];
          var slot = el.closest("[data-slot]");
          if (url === OCULTO) {                       // espacio quitado por el admin
            if (slot) slot.classList.add("oculto"); else el.style.display = "none";
            return;
          }
          if (url) {
            el.src = url;
            if (slot) slot.classList.add("lleno");
            /* una foto subida por el administrador ocupa todo el recuadro:
               el tamaño reducido es solo para los renders con fondo transparente */
            el.classList.add("cover", "subida");
          }
        });
      })
      .catch(function () { /* sin API: quedan las imágenes originales */ });
  }

  /* ---------- Lightbox de galerías (R-17) ----------
     La lista de fotos se arma en el momento del clic, no al cargar la página:
     así funciona con las fotos de terreno, que llegan después desde el panel, y
     con cualquier foto que se agregue más adelante. */
  var SEL_LB = ".gallery figure img, .terreno-slot.lleno img";
  function grupoDe(im) {
    var cont = im.closest(".gallery") || im.closest(".terreno-grid") || document;
    return Array.prototype.slice.call(cont.querySelectorAll(SEL_LB));
  }

  function initLightbox() {
    var imgs = [];
    var idx = 0;

    var lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lb-close" aria-label="Cerrar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '<button type="button" class="lb-nav prev" aria-label="Anterior">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
      '<figure class="lb-fig"><img alt="" loading="lazy"><figcaption class="lb-cap"></figcaption></figure>' +
      '<button type="button" class="lb-nav next" aria-label="Siguiente">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");

    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      lbImg.src = imgs[idx].src;
      lbImg.alt = imgs[idx].alt || "";
      lbCap.textContent = (idx + 1) + " / " + imgs.length + (imgs[idx].alt ? " · " + imgs[idx].alt : "");
    }
    function open(i) { show(i); lb.hidden = false; document.body.style.overflow = "hidden"; }
    function close() { lb.hidden = true; document.body.style.overflow = ""; }

    /* delegado: sirve para las fotos que ya están y para las que aparezcan */
    document.addEventListener("click", function (ev) {
      var im = ev.target.closest && ev.target.closest(SEL_LB);
      if (!im || im.closest(".lb")) return;
      imgs = grupoDe(im);
      var i = imgs.indexOf(im);
      if (i < 0) return;
      open(i);
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    lb.querySelector(".next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener("click", function (ev) { if (ev.target === lb || ev.target.classList.contains("lb-fig")) close(); });
    document.addEventListener("keydown", function (ev) {
      if (lb.hidden) return;
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") show(idx - 1);
      if (ev.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Ajustes de estilo: paletas, tipografías y fondos ---------- */
  var STYLE_KEY = "nase-style-v1";
  var PALETAS = {
    nase:   { label: "Verde NASE",    dots: ["#0e1a14", "#1e6b43", "#8bc34a"], v: { bg: "#f4f2ec", text: "#15201a", paper: "#ffffff", a100: "#e9f2ec", a200: "#cde4d6", a300: "#a6d0b7", a400: "#63a87f", a500: "#2e9159", a600: "#257a4b", a700: "#1e6b43", a800: "#14492e", a900: "#0e1a14", dark: "#0e1a14", dark2: "#13241a", lime: "#8bc34a", star: "#e6a532", n100: "#efede6", n200: "#e4e1d7", n300: "#cfccc1", div: "#dcd8cc", bor: "#c9c5b8" } },
    acero:  { label: "Acero técnico", dots: ["#101b26", "#3d5a80", "#8ecae6"], v: { bg: "#f3f4f6", text: "#17202a", paper: "#ffffff", a100: "#e9eef5", a200: "#cfdcea", a300: "#a8c1da", a400: "#6f94ba", a500: "#4d729f", a600: "#446488", a700: "#3d5a80", a800: "#2a3f5b", a900: "#101b26", dark: "#101b26", dark2: "#182635", lime: "#8ecae6", star: "#e6a532", n100: "#eceef0", n200: "#dfe3e7", n300: "#c6ccd3", div: "#d8dde3", bor: "#c4cbd4" } },
    tierra: { label: "Tierra Maule",  dots: ["#1d150a", "#8c5a17", "#eab648"], v: { bg: "#f7f2e9", text: "#241a0e", paper: "#fffdf8", a100: "#f5ecdd", a200: "#ead9bb", a300: "#dbbf8d", a400: "#c39a52", a500: "#b3742a", a600: "#9f6620", a700: "#8c5a17", a800: "#64400f", a900: "#1d150a", dark: "#1d150a", dark2: "#2a2012", lime: "#eab648", star: "#8bc34a", n100: "#f0e9dc", n200: "#e5dccb", n300: "#d0c4ac", div: "#ddd3bf", bor: "#cabfa6" } },
    bosque: { label: "Bosque teal",   dots: ["#0a1514", "#11706a", "#5eead4"], v: { bg: "#f0f4f3", text: "#10201e", paper: "#ffffff", a100: "#e3f1ef", a200: "#c2e3df", a300: "#93cfc9", a400: "#4daaa1", a500: "#17a398", a600: "#148a80", a700: "#11706a", a800: "#0d4f4b", a900: "#0a1514", dark: "#0a1514", dark2: "#10201e", lime: "#5eead4", star: "#e6a532", n100: "#eaefed", n200: "#dce4e1", n300: "#c3cfcb", div: "#d5dedb", bor: "#bfccc8" } },
    rojo:   { label: "Rojo cosecha",  dots: ["#1a0e0d", "#9e2a25", "#ffab91"], v: { bg: "#f6f1ef", text: "#231412", paper: "#fffdfc", a100: "#f7e8e6", a200: "#edcdc9", a300: "#dfa8a1", a400: "#cd7166", a500: "#c0392b", a600: "#ad3123", a700: "#9e2a25", a800: "#6f1d19", a900: "#1a0e0d", dark: "#1a0e0d", dark2: "#2a1512", lime: "#ffab91", star: "#e6a532", n100: "#f1e9e6", n200: "#e7dcd8", n300: "#d3c3be", div: "#ded0cb", bor: "#ccb9b3" } },
    azul:   { label: "Azul cielo",    dots: ["#0b1526", "#2459c9", "#7dd3fc"], v: { bg: "#f2f5fa", text: "#101827", paper: "#ffffff", a100: "#e7eefc", a200: "#c9dafa", a300: "#9fbef5", a400: "#6595ee", a500: "#3b82f6", a600: "#2e6fe0", a700: "#2459c9", a800: "#1a3e8c", a900: "#0b1526", dark: "#0b1526", dark2: "#12203a", lime: "#7dd3fc", star: "#e6a532", n100: "#ebeff4", n200: "#dee4ec", n300: "#c5cedb", div: "#d6dde7", bor: "#c1cad8" } },
    gris:   { label: "Gris urbano",   dots: ["#14171b", "#4b5563", "#cbd5e1"], v: { bg: "#f2f3f4", text: "#1b1f24", paper: "#ffffff", a100: "#eceef0", a200: "#d8dce1", a300: "#b9c0c8", a400: "#8b95a1", a500: "#6b7280", a600: "#5a616d", a700: "#4b5563", a800: "#343b45", a900: "#14171b", dark: "#14171b", dark2: "#1e232a", lime: "#cbd5e1", star: "#e6a532", n100: "#ebedee", n200: "#dfe2e5", n300: "#c8cdd2", div: "#d7dbdf", bor: "#c3c9cf" } },
    blanco: { label: "Blanco minimal", dots: ["#18181b", "#52525b", "#e4e4e7"], v: { bg: "#ffffff", text: "#1c1c21", paper: "#ffffff", a100: "#f1f1f3", a200: "#e0e0e4", a300: "#c6c6cd", a400: "#98989f", a500: "#6a6a74", a600: "#5a5a64", a700: "#52525b", a800: "#3a3a42", a900: "#131316", dark: "#18181b", dark2: "#232327", lime: "#e4e4e7", star: "#e6a532", n100: "#f4f4f5", n200: "#e9e9eb", n300: "#d4d4d8", div: "#e4e4e7", bor: "#d4d4d8" } },
    negro:  { label: "Negro grafito", dots: ["#0a0a0b", "#26262c", "#fafafa"], v: { bg: "#f5f5f4", text: "#121212", paper: "#ffffff", a100: "#ececec", a200: "#d9d9d9", a300: "#bcbcbd", a400: "#8a8a8c", a500: "#3f3f46", a600: "#2f2f36", a700: "#26262c", a800: "#19191d", a900: "#0a0a0b", dark: "#0a0a0b", dark2: "#161618", lime: "#fafafa", star: "#e6a532", n100: "#eeeeec", n200: "#e2e2e0", n300: "#cbcbc9", div: "#dcdcda", bor: "#c8c8c6" } },
  };
  var VARMAP = { bg: "--color-bg", text: "--color-text", paper: "--paper", a100: "--color-accent-100", a200: "--color-accent-200", a300: "--color-accent-300", a400: "--color-accent-400", a500: "--color-accent-500", a600: "--color-accent-600", a700: "--color-accent-700", a800: "--color-accent-800", a900: "--color-accent-900", dark: "--nase-dark", dark2: "--nase-dark-2", lime: "--nase-lime", star: "--nase-star", n100: "--color-neutral-100", n200: "--color-neutral-200", n300: "--color-neutral-300", div: "--color-divider", bor: "--color-border" };
  var FUENTES = {
    industrial: { label: "Industrial", heading: '"Barlow Condensed", system-ui, sans-serif', body: '"Barlow", system-ui, sans-serif', hw: "600", css: null },
    tecnica:    { label: "Técnica",    heading: '"Archivo Black", system-ui, sans-serif', body: '"IBM Plex Sans", system-ui, sans-serif', hw: "400", css: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" },
    moderna:    { label: "Moderna",    heading: '"Space Grotesk", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif', hw: "700", css: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap" },
  };
  /* color del fondo, independiente de la paleta (cualquier color, claro u oscuro) */
  var FONDOS = {
    auto:   { label: "De la paleta", dot: null },
    crema:  { label: "Crema",  dot: "#f4f2ec" },
    blanco: { label: "Blanco", dot: "#fbfbfa" },
    gris:   { label: "Gris",   dot: "#f0f2f3" },
    arena:  { label: "Arena",  dot: "#f7f0e4" },
    salvia: { label: "Salvia", dot: "#eef2ea" },
    noche:  { label: "Noche",  dot: "#101614" },
    custom: { label: "Personalizado", dot: null, picker: true },
  };
  function loadStyleCfg() {
    var cfg = {
      pal: "nase", font: "industrial", tex: "grid", bgc: "auto", tab: "clasica",
      bgcustom: "#f4f2ec", logo: 1.3, fsE: 1, fsT: 1, fsB: 1,
      custom: { acc: "#1e6b43", dark: "#0e1a14", lime: "#8bc34a", star: "#e6a532" },
    };
    try {
      var s = JSON.parse(localStorage.getItem(STYLE_KEY));
      if (s) {
        ["pal", "font", "tex", "bgc", "tab", "bgcustom"].forEach(function (k) { if (s[k]) cfg[k] = s[k]; });
        ["logo", "fsE", "fsT", "fsB"].forEach(function (k) { if (typeof s[k] === "number") cfg[k] = s[k]; });
        if (s.custom) Object.keys(cfg.custom).forEach(function (k) { if (s.custom[k]) cfg.custom[k] = s.custom[k]; });
      }
    } catch (e) {}
    return cfg;
  }

  /* ---------- escalado de textos (respeta los tamaños originales) ---------- */
  /* tres familias de texto con tamaño independiente:
     etiqueta de sección (eyebrow) · título · contenido */
  var SEL_EYE = ".eyebrow,.strip-label,.model-tag,.step-num";
  var SEL_TIT = "h1,h2,h3,h4,.cm-name,.model-card h3,.product-card h3,.part-info h1";
  var SEL_TXT = "p,li,td,th,figcaption,label,.sub,.note,.lead,.tagline,.tag,.spec-strip .cell .l";
  function escalaGrupo(sel, mult) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest(".tv-menu") || el.closest(".lb") || el.closest(".pt-overlay")) return;
      if (!el.dataset.fsBase) el.dataset.fsBase = parseFloat(getComputedStyle(el).fontSize) || 16;
      el.style.fontSize = (parseFloat(el.dataset.fsBase) * mult).toFixed(2) + "px";
    });
  }
  window.applyTextScale = function () {
    var c = loadStyleCfg();
    escalaGrupo(SEL_EYE, c.fsE);
    escalaGrupo(SEL_TIT, c.fsT);
    escalaGrupo(SEL_TXT, c.fsB);
  };

  /* ---------- textos del sitio ----------
     Los textos se editan en editar.html, que descarga un JSON. Ese archivo se
     publica en /api/config y desde ahí el sitio lo aplica a cada visitante. */
  var TEXT_KEY = "nase-textos-v1";
  var SEL_EDIT = "h1,h2,h3,h4,p,li,figcaption,.eyebrow,.tagline,.sub,.note,.lead,.strip-label,.step-copy .step-num";

  /* La clave de un texto no puede depender de la query: si alguien llega con
     ?utm_source=... la página es la misma y debe recibir los mismos textos.
     La ficha de repuesto sí necesita el id, porque cada pieza es otra página. */
  function pagina() {
    var p = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
    if (p === "repuesto") {
      var id = new URLSearchParams(location.search).get("id");
      if (id) return p + "?id=" + id;
    }
    return p;
  }
  /* configuración publicada por NASE (vale para todos los visitantes);
     lo editado localmente en este navegador siempre tiene prioridad */
  var PUBLICADO = { estilo: null, textos: null };

  function loadTextos() {
    var local = {};
    try { local = JSON.parse(localStorage.getItem(TEXT_KEY)) || {}; } catch (e) {}
    if (!PUBLICADO.textos) return local;
    var out = {};
    Object.keys(PUBLICADO.textos).forEach(function (k) { out[k] = PUBLICADO.textos[k]; });
    Object.keys(local).forEach(function (k) { out[k] = local[k]; });
    return out;
  }

  function aplicaPublicado() {
    return fetch("/api/config")
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var c = d && d.config;
        if (!c) return;
        PUBLICADO.estilo = c.estilo || null;
        PUBLICADO.textos = c.textos || null;
        /* el estilo publicado se aplica solo si este navegador no tiene ajustes propios */
        if (PUBLICADO.estilo && !localStorage.getItem(STYLE_KEY)) {
          var base = loadStyleCfg();
          Object.keys(PUBLICADO.estilo).forEach(function (k) { base[k] = PUBLICADO.estilo[k]; });
          applyStyle(base, true);
        }
        window.applySavedTexts();
        marcaClaves();
      })
      .catch(function () { /* sin API: el sitio queda con sus textos originales */ });
  }
  /* El andamiaje que el sitio inyecta (barra, pie, carrito, lightbox, overlay
     del dron, menú de versiones) no es contenido editable y tampoco debe contar
     al numerar los textos: el lightbox se agrega después del arranque y correría
     todas las claves. */
  function esAndamio(el) {
    return !!(el.closest(".tv-menu") || el.closest(".lb") || el.closest(".pt-overlay") ||
              el.closest(".cart-drawer") || el.closest(".site-footer") || el.closest("nav.nav"));
  }
  function textEls() {
    return Array.prototype.slice.call(document.querySelectorAll(SEL_EDIT)).filter(function (el) {
      return !esAndamio(el) && el.children.length < 4;
    });
  }
  /* Clave antigua: posición del elemento entre TODOS los textos de la página.
     Es frágil (si cambia el número de elementos, todas las claves siguientes se
     corren), pero las configuraciones ya exportadas la usan: se mantiene para
     poder leerlas. */
  function claveDe(el, i) { return pagina() + "|" + el.tagName.toLowerCase() + "|" + i; }

  /* Clave estable: sección + ámbito + posición dentro de esa sección. Editar o
     agregar textos en otra parte de la página ya no la mueve. */
  function claveEstable(el) {
    var host = el.parentElement, ambito = "", ancla = "doc";
    while (host && host !== document.body) {
      if (!ambito && host.dataset && host.dataset.tscope) ambito = host.dataset.tscope;
      if (host.id) { ancla = host.id; break; }
      host = host.parentElement;
    }
    var raiz = host && host !== document.body ? host : document.body;
    var tag = el.tagName.toLowerCase();
    var n = Array.prototype.slice.call(raiz.querySelectorAll(tag))
      .filter(function (x) { return !esAndamio(x); }).indexOf(el);
    return pagina() + "#" + ancla + (ambito ? "/" + ambito : "") + "|" + tag + "|" + n;
  }

  window.applySavedTexts = function () {
    var t = loadTextos();
    if (!Object.keys(t).length) return;
    var els = textEls(), foco = document.activeElement;
    function libre(el) { return el !== foco; }
    /* Solo claves estables. Las claves antiguas eran posicionales y quedaron
       corridas entre 2 y 7 lugares: aplicarlas metía el texto de un elemento en
       otro (de ahí los servicios duplicados). Ese material no se pierde: sigue
       disponible por texto en el desplegable de versiones. */
    els.forEach(function (el) {
      var k = claveEstable(el);
      if (t[k] != null && libre(el)) el.innerHTML = t[k];
    });
  };

  function hexLum(h) {
    var m = /^#?([0-9a-f]{6})$/i.exec(h || "");
    if (!m) return 1;
    var n = parseInt(m[1], 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }
  function mixW(c, pct) { return "color-mix(in srgb, " + c + " " + pct + "%, white)"; }

  /* paleta personalizada: la rampa se deriva del acento y el oscuro elegidos */
  function customVars(cu) {
    return {
      bg: "#f4f3ef", text: "color-mix(in srgb, " + cu.dark + " 85%, black)", paper: "#ffffff",
      a100: mixW(cu.acc, 10), a200: mixW(cu.acc, 22), a300: mixW(cu.acc, 38), a400: mixW(cu.acc, 62),
      a500: mixW(cu.acc, 85), a600: mixW(cu.acc, 93), a700: cu.acc,
      a800: "color-mix(in srgb, " + cu.acc + " 68%, black)", a900: cu.dark,
      dark: cu.dark, dark2: "color-mix(in srgb, " + cu.dark + " 84%, white)",
      lime: cu.lime, star: cu.star,
      n100: mixW(cu.acc, 7), n200: mixW(cu.acc, 12), n300: mixW(cu.acc, 24),
      div: mixW(cu.acc, 16), bor: mixW(cu.acc, 26),
    };
  }

  function applyStyle(cfg, noGuardar) {
    var root = document.documentElement;
    var v = cfg.pal === "custom" ? customVars(cfg.custom) : (PALETAS[cfg.pal] || PALETAS.nase).v;
    Object.keys(VARMAP).forEach(function (k) { root.style.setProperty(VARMAP[k], v[k]); });
    root.style.setProperty("--color-accent", v.a700);
    var f = FUENTES[cfg.font] || FUENTES.industrial;
    root.style.setProperty("--font-heading", f.heading);
    root.style.setProperty("--font-body", f.body);
    root.style.setProperty("--font-heading-weight", f.hw);
    if (f.css && !document.getElementById("theme-font-" + cfg.font)) {
      var l = document.createElement("link");
      l.id = "theme-font-" + cfg.font; l.rel = "stylesheet"; l.href = f.css;
      document.head.appendChild(l);
    }
    /* color de fondo: preset, personalizado o el de la paleta */
    var bgVal = null;
    if (cfg.bgc === "custom") bgVal = cfg.bgcustom;
    else if (cfg.bgc !== "auto" && FONDOS[cfg.bgc] && FONDOS[cfg.bgc].dot) bgVal = FONDOS[cfg.bgc].dot;
    if (bgVal) root.style.setProperty("--color-bg", bgVal);
    /* fondo oscuro → texto, líneas y tarjetas se aclaran para seguir legibles */
    var eff = bgVal || v.bg;
    if (hexLum(eff) < 0.45) {
      root.style.setProperty("--color-text", "#f2f3f0");
      root.style.setProperty("--color-divider", "color-mix(in srgb, " + eff + " 74%, white)");
      root.style.setProperty("--color-border", "color-mix(in srgb, " + eff + " 62%, white)");
      root.style.setProperty("--color-neutral-100", "color-mix(in srgb, " + eff + " 90%, white)");
      root.style.setProperty("--color-neutral-200", "color-mix(in srgb, " + eff + " 82%, white)");
      root.style.setProperty("--color-neutral-300", "color-mix(in srgb, " + eff + " 68%, white)");
      root.style.setProperty("--paper", "color-mix(in srgb, " + eff + " 84%, white)");
      root.style.setProperty("--color-accent-100", "color-mix(in srgb, " + eff + " 80%, white)");
    }
    root.dataset.texture = cfg.tex;
    root.dataset.tables = cfg.tab || "clasica";
    /* tamaño del logo y de la barra superior (R-13) */
    root.style.setProperty("--nav-logo-h", (30 * (cfg.logo || 1)).toFixed(1) + "px");
    root.style.setProperty("--nav-pad", (10 * (cfg.logo || 1)).toFixed(1) + "px");
    if (!noGuardar) localStorage.setItem(STYLE_KEY, JSON.stringify(cfg));
    escalaGrupo(SEL_EYE, cfg.fsE || 1);
    escalaGrupo(SEL_TIT, cfg.fsT || 1);
    escalaGrupo(SEL_TXT, cfg.fsB || 1);
  }

  /* ---------- claves de los textos ----------
     El sitio no se edita a sí mismo: los textos se cambian en editar.html, que
     lee estas claves para armar su lista. Aquí solo se marcan. */
  function marcaClaves() {
    textEls().forEach(function (el, i) {
      el.dataset.tkey = claveEstable(el);
      el.dataset.tlegacy = claveDe(el, i);
    });
  }

  function initSitio() {
    /* el estilo publicado por NASE manda siempre: ya no hay panel de ajustes,
       así que un ajuste viejo guardado en este navegador dejaría el sitio
       congelado sin forma de corregirlo */
    try { localStorage.removeItem(STYLE_KEY); } catch (e) {}
    applyStyle(loadStyleCfg(), true);
    marcaClaves();

    /* los bloques que se vuelven a dibujar solos (carrusel de pasos, grillas de
       la tienda) recuperan sus claves sin tener que tocar cada página */
    if ("MutationObserver" in window) {
      var pend = null;
      new MutationObserver(function () {
        if (pend) return;
        pend = setTimeout(function () { pend = null; marcaClaves(); }, 150);
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  /* ---------- ciclo del T100 al agregar un dron a la cotización ---------- */
  var PT_REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* frames del ciclo: 0 estático en tierra · 1 despegue · 2/3 ángulos en vuelo */
  var PT_FRAMES = [
    "assets/img/fx/t100-static.png",
    "assets/img/fx/t100-fly1.png",
    "assets/img/fx/t100-fly2.png",
    "assets/img/fx/t100-fly3.png",
  ];

  function buildPtOverlay() {
    var o = document.createElement("div");
    o.className = "pt-overlay";
    o.setAttribute("aria-hidden", "true");
    o.innerHTML =
      '<div class="pt-sweep">' +
      '<svg class="pt-swath" viewBox="0 0 1200 700" preserveAspectRatio="none" fill="none">' +
      '<path d="M -20 340 C 300 280, 620 420, 1230 300" stroke="#8bc34a" stroke-width="1.5" stroke-dasharray="10 14"/>' +
      '<path d="M -20 500 C 340 430, 700 560, 1230 470" stroke="#4fb3a4" stroke-width="1" stroke-dasharray="6 12"/>' +
      "</svg>" +
      '<img class="pt-logo" src="assets/img/logo/logo-nase-blanco.png" alt="NASE Agrotech">' +
      "</div>" +
      '<div class="pt-stage">' +
      PT_FRAMES.map(function (src, i) {
        return '<img class="pt-frame' + (i === 0 ? " on" : "") + '" src="' + src + '" alt="">';
      }).join("") +
      "</div>";
    document.body.appendChild(o);
    return o;
  }

  function ptShow(overlay, i) {
    var fr = overlay.querySelectorAll(".pt-frame");
    for (var k = 0; k < fr.length; k++) fr[k].classList.toggle("on", k === i);
  }

  function initDroneCycle() {
    if (PT_REDUCED) return;
    var overlay = buildPtOverlay();
    var sweep = overlay.querySelector(".pt-sweep");
    var stage = overlay.querySelector(".pt-stage");
    var playing = false;

    /* ciclo completo en la misma página: la cortina con el logo aparece en
       fundido, el T100 está de frente, despega, gira dos veces y se va
       acelerando; la cortina se difumina y sigue el callback (abrir carrito) */
    window.playDroneCycle = function (done) {
      if (playing) return;
      playing = true;
      overlay.classList.add("on", "leaving");
      sweep.classList.remove("closed", "opening");
      sweep.classList.add("closing");
      stage.classList.remove("air", "away");
      stage.classList.add("ground");
      ptShow(overlay, 0);                                                   // de frente, estático (breve)
      setTimeout(function () {                                              // despega rápido
        stage.classList.remove("ground");
        stage.classList.add("air");
        ptShow(overlay, 1);
      }, 180);
      setTimeout(function () { ptShow(overlay, 2); }, 500);                 // gira
      setTimeout(function () { ptShow(overlay, 3); }, 800);                 // segundo giro
      setTimeout(function () {                                              // se va: acelera gradual, termina rápido
        stage.classList.remove("air");
        stage.classList.add("away");
      }, 1040);
      setTimeout(function () {                                              // la cortina se difumina gradualmente
        sweep.classList.remove("closing");
        sweep.classList.add("opening");
      }, 1120);
      setTimeout(function () { if (done) done(); }, 1400);                  // el carrito entra sobre el fundido
      setTimeout(function () {
        overlay.classList.remove("on", "leaving");
        sweep.classList.remove("opening");
        stage.classList.remove("ground", "air", "away");
        ptShow(overlay, 0);
        playing = false;
      }, 1700);
    };
  }

  /* util corners para .blueprint */
  window.corners = function () {
    return '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';
  };
})();
