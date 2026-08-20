/* ============================================================
   NASE Agrotech — Comparador de modelos Agras
   Tabla comparativa con resaltado del mejor valor por fila.
   En móvil (<720px) se comparan 2 modelos elegidos con selectores.
   El CTA "Cotizar" prellena el modelo de interés del formulario.
   ============================================================ */
(function () {
  "use strict";

  var COLS = ["t25p", "t55", "t70p", "t100"];

  /* Solo datos verificados; lo no confirmado va como "—" o "Por cotización" */
  var ROWS = [
    { l: "Pulverización", best: ["t100"], v: { t25p: "25 L", t55: "50 L", t70p: "70 L", t100: "100 L" } },
    { l: "Caudal máximo", v: { t25p: "—", t55: "40 L/min", t70p: "Doble atomización", t100: "30–40 L/min" } },
    { l: "Esparcido", best: ["t100"], v: { t25p: "35 kg", t55: "55 kg · tolva 80 L", t70p: "Alta tasa · tornillo sin fin", t100: "150 L · hasta 400 kg/min" } },
    { l: "Izaje de carga", best: ["t100"], v: { t25p: "—", t55: "40 kg", t70p: "Con cabrestante", t100: "100 kg" } },
    { l: "Posicionamiento", v: { t25p: "RTK ±10 cm", t55: "RTK ±10 cm", t70p: "RTK ±10 cm", t100: "RTK ±10 cm" } },
    { l: "Batería y carga", v: { t25p: "—", t55: "DB1050 · carga 9 min", t70p: "Carga rápida en terreno", t100: "DB2160 41 Ah · 8–9 min" } },
    { l: "Formato", v: { t25p: "Plegable · 1 operador", t55: "Plegable · visión nocturna", t70p: "4 faenas en un equipo", t100: "Hélices 62″ · MTOW 177 kg" } },
    { l: "Área recomendada / jornada", v: { t25p: "≤ 30 ha", t55: "30–80 ha", t70p: "80–200 ha", t100: "Sobre 200 ha" } },
    { l: "Precio", v: { t25p: "Por cotización", t55: "Por cotización", t70p: "Por cotización", t100: "Por cotización" } },
  ];

  function colThumb(m) {
    return (m.appBg && !m.cardCover) ? m.appBg() : m.cardImg();
  }

  window.renderCompare = function () {
    var app = document.getElementById("app");

    var head = document.createElement("section");
    head.className = "model-hero full-bleed";
    head.innerHTML =
      '<div class="bg"><div class="veil" style="background:linear-gradient(180deg,var(--nase-dark),var(--nase-dark-2));"></div></div>' +
      '<div class="wrap inner" style="padding-bottom:clamp(24px,4vh,40px);">' +
      '<span class="eyebrow on-dark">Comparador · línea DJI Agras</span>' +
      "<h1>Elige con datos</h1>" +
      '<p class="tagline">Los cuatro DJI Agras, lado a lado. Compara capacidades, configuraciones y prestaciones, identifica rápidamente las diferencias y descubre cuál se adapta mejor a tu operación.</p>' +
      "</div>";
    app.appendChild(head);

    var sec = document.createElement("section");
    sec.className = "section";
    sec.innerHTML = '<div class="wrap">' +
      '<div class="compare-pick">' +
      '<div class="field"><label for="cmp-a">Modelo A</label><select class="input" id="cmp-a"></select></div>' +
      '<div class="field"><label for="cmp-b">Modelo B</label><select class="input" id="cmp-b"></select></div>' +
      "</div>" +
      '<div class="compare-wrap"><table class="compare" id="cmp-table"></table></div>' +
      '<p style="font-size:13px;margin:16px 0 0;color:color-mix(in srgb,var(--color-text) 60%,transparent);">Datos Oficiales DJI Agriculture medidos en condiciones controladas. La ficha técnica completa acompaña cada cotización. ¿Dudas? <a href="index.html#contacto">Te asesoramos según tu cultivo</a>.</p>' +
      "</div>";
    app.appendChild(sec);

    var table = sec.querySelector("#cmp-table");
    var selA = sec.querySelector("#cmp-a");
    var selB = sec.querySelector("#cmp-b");
    var visible = { a: "t55", b: "t100" };

    COLS.forEach(function (id) {
      var m = MODELS[id];
      selA.add(new Option(m.short, id));
      selB.add(new Option(m.short, id));
    });
    selA.value = visible.a;
    selB.value = visible.b;
    selA.addEventListener("change", function () { visible.a = selA.value; paintVisibility(); });
    selB.addEventListener("change", function () { visible.b = selB.value; paintVisibility(); });

    function build() {
      var thead = "<thead><tr><th></th>" + COLS.map(function (id) {
        var m = MODELS[id];
        /* data-img: si el panel tiene una foto cargada para la tarjeta de este
           modelo, el comparador muestra la misma que el home (aplicaImagenesAdmin) */
        return '<th data-col="' + id + '"' + (id === "t100" ? ' class="col-star"' : "") + '><span class="cm-img"><img data-img="modelo.' + id + '.card" src="' + colThumb(m) + '" alt="' + m.name + '"></span>' +
          '<span class="cm-name">' + m.short + "</span></th>";
      }).join("") + "</tr></thead>";

      /* la columna del T100 se destaca completa (R-11) */
      var rows = ROWS.map(function (r) {
        return "<tr><th scope=\"row\">" + r.l + "</th>" + COLS.map(function (id) {
          var cls = [];
          if (r.best && r.best.indexOf(id) > -1) cls.push("best");
          if (id === "t100") cls.push("col-star");
          return '<td data-col="' + id + '"' + (cls.length ? ' class="' + cls.join(" ") + '"' : "") + ">" + (r.v[id] || "—") + "</td>";
        }).join("") + "</tr>";
      }).join("");

      var cta = "<tr><th scope=\"row\"></th>" + COLS.map(function (id) {
        var m = MODELS[id];
        return '<td class="cta-cell' + (id === "t100" ? " col-star" : "") + '" data-col="' + id + '">' +
          '<a href="' + m.page + '">' + (m.viewer ? "Visor 360 →" : "Ver modelo →") + "</a>" +
          '<button type="button" class="btn-add-sm" data-quote="' + id + '">Cotizar este modelo</button>' +
          "</td>";
      }).join("") + "</tr>";

      table.innerHTML = thead + "<tbody>" + rows + cta + "</tbody>";

      table.querySelectorAll("[data-quote]").forEach(function (b) {
        b.addEventListener("click", function () {
          var id = b.dataset.quote;
          var m = MODELS[id];
          /* prellena el modelo de interés del formulario del home */
          try { sessionStorage.setItem("nase-modelo-interes", m.name); } catch (e) {}
          var eq = window.EQUIPOS.find(function (e) { return e.id === "eq-" + id; });
          Cart.add({ id: "eq-" + id, name: m.name, model: m.short, img: eq ? eq.img() : m.cardImg(), type: "equipo" });
        });
      });
    }

    function paintVisibility() {
      /* en móvil el CSS oculta .hide-m; aquí marcamos qué columnas se ocultan */
      table.querySelectorAll("[data-col]").forEach(function (cell) {
        var id = cell.dataset.col;
        cell.classList.toggle("hide-m", id !== visible.a && id !== visible.b);
      });
    }

    build();
    paintVisibility();
    renderChrome({ waWhat: "un dron DJI Agras (vi el comparador)" });
  };
})();
