/* ============================================================
   NASE Agrotech — Visor interactivo de modelos
   Navegador "tipo 3D" construido sobre los renders oficiales:
   - arrastre / swipe para recorrer los ángulos
   - configuraciones (2/4 aspersores, esparcido, carga…)
   - estados (estático / plegado / en vuelo)
   - animación de despegue, vuelo estacionario y "a la faena"
   ============================================================ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ICON_DRAG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function preload(list) {
    (list || []).forEach(function (src) { var i = new Image(); i.src = src; });
  }

  function frames(state) {
    if (!state) return [];
    return GA(state.group, state.order);
  }

  window.initViewer = function (mount, model, opts) {
    var cfg = model.viewer;
    if (!cfg || !cfg.sets.length) return null;
    opts = opts || {};

    var setIdx = 0;
    var stateName = "estatico";
    var frameIdx = 0;
    var flying = false;
    var animating = false;
    var hintShown = true;

    /* ---------- DOM ---------- */
    var root = el("div", "viewer blueprint");
    root.innerHTML =
      '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';

    var stage = el("div", "stage");
    stage.setAttribute("tabindex", "0");
    stage.setAttribute("role", "img");
    stage.setAttribute("aria-label", "Visor interactivo del " + model.name + ". Usa las flechas o arrastra para girar.");
    stage.appendChild(el("div", "grid-bg"));

    var swath = el("div", "");
    swath.innerHTML =
      '<svg class="swath" viewBox="0 0 1200 700" preserveAspectRatio="none" fill="none" aria-hidden="true">' +
      '<path d="M -20 600 C 260 480, 420 640, 640 500 S 1020 300, 1230 360" stroke="#8bc34a" stroke-width="1.5" stroke-dasharray="10 14"/>' +
      '<path d="M -20 660 C 300 560, 500 690, 760 570 S 1060 420, 1230 460" stroke="#4fb3a4" stroke-width="1" stroke-dasharray="6 12"/>' +
      "</svg>";
    stage.appendChild(swath.firstChild);

    var frameWrap = el("div", "frames");
    stage.appendChild(frameWrap);

    var dots = el("div", "angle-dots");
    stage.appendChild(dots);

    stage.appendChild(el("div", "viewer-label", model.name.toUpperCase() + " · VISOR"));

    var hint = el("div", "hint", ICON_DRAG + "<span>Arrástralo para girar</span>");
    stage.appendChild(hint);

    /* flechas sutiles: mecanismo de giro paralelo al arrastre (R-15) */
    var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    var vLeft = el("button", "v-arrow left", ARROW);
    var vRight = el("button", "v-arrow right", ARROW);
    vLeft.type = vRight.type = "button";
    vLeft.setAttribute("aria-label", "Girar a la izquierda");
    vRight.setAttribute("aria-label", "Girar a la derecha");
    vLeft.addEventListener("click", function (ev) { ev.stopPropagation(); showFrame(frameIdx - 1); hideHint(); });
    vRight.addEventListener("click", function (ev) { ev.stopPropagation(); showFrame(frameIdx + 1); hideHint(); });
    stage.appendChild(vLeft);
    stage.appendChild(vRight);

    root.appendChild(stage);

    var controls = el("div", "viewer-controls");
    var gSets = el("div", "group");
    var gStates = el("div", "group");
    controls.appendChild(gSets);
    controls.appendChild(gStates);
    if (opts.onQuote) {
      var gQuote = el("div", "group quote");
      var bQuote = el("button", "vc-chip quote");
      bQuote.type = "button";
      bQuote.textContent = opts.quoteLabel || "Agregar a cotización";
      bQuote.addEventListener("click", opts.onQuote);
      gQuote.appendChild(bQuote);
      controls.appendChild(gQuote);
    }
    root.appendChild(controls);

    mount.innerHTML = "";
    mount.appendChild(root);

    /* ---------- estado actual ---------- */
    function curSet() { return cfg.sets[setIdx]; }
    function curFrames() {
      var st = curSet().states;
      if (flying && st.vuelo) return frames(st.vuelo);
      return frames(st[stateName] || st.estatico);
    }

    /* ---------- frames ---------- */
    var imgCache = {};
    function showFrame(idx, instant) {
      var list = curFrames();
      if (!list.length) return;
      frameIdx = ((idx % list.length) + list.length) % list.length;
      var src = list[frameIdx];
      var imgs = frameWrap.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) imgs[i].classList.remove("on");
      var img = imgCache[src];
      if (!img) {
        img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.draggable = false;
        if (instant) img.style.transition = "none";
        imgCache[src] = img;
        frameWrap.appendChild(img);
        // fuerza reflow para que el fade aplique al primer paint
        void img.offsetWidth;
        img.style.transition = "";
      }
      img.classList.add("on");
      updateDots();
    }

    function hideHint() {
      if (hintShown) { hintShown = false; hint.classList.add("hidden"); }
    }

    function updateDots() {
      var list = curFrames();
      /* las flechas solo tienen sentido si hay más de un ángulo */
      var multi = list.length > 1;
      vLeft.style.display = vRight.style.display = multi ? "" : "none";
      dots.innerHTML = "";
      if (list.length < 2) return;
      for (var i = 0; i < list.length; i++) {
        var d = document.createElement("i");
        if (i === frameIdx) d.className = "on";
        dots.appendChild(d);
      }
    }

    /* ---------- controles ---------- */
    function chip(label, cls) {
      var b = el("button", "vc-chip" + (cls ? " " + cls : ""));
      b.type = "button";
      b.textContent = label;
      return b;
    }

    function renderControls() {
      gSets.innerHTML = "";
      gStates.innerHTML = "";
      var st = curSet().states;

      if (cfg.sets.length > 1) {
        gSets.appendChild(el("span", "group-label", "Configuración"));
        cfg.sets.forEach(function (s, i) {
          var c = chip(s.label);
          if (i === setIdx) c.classList.add("on");
          c.addEventListener("click", function () { switchSet(i); });
          gSets.appendChild(c);
        });
      }

      gStates.appendChild(el("span", "group-label", "Estado"));

      var cEst = chip("Estático");
      if (!flying && stateName === "estatico") cEst.classList.add("on");
      cEst.addEventListener("click", function () { switchState("estatico"); });
      gStates.appendChild(cEst);

      if (st.plegado) {
        var cPle = chip("Plegado");
        if (!flying && stateName === "plegado") cPle.classList.add("on");
        cPle.addEventListener("click", function () { switchState("plegado"); });
        gStates.appendChild(cPle);
      }

      if (st.vuelo) {
        var cFly = chip(flying ? "Aterrizar" : "Despegar", "fly");
        if (flying) cFly.classList.add("on");
        cFly.addEventListener("click", function () { flying ? land() : takeoff(); });
        gStates.appendChild(cFly);

        if (flying) {
          var cGo = chip("A la faena", "fly");
          cGo.title = "El dron se va volando y vuelve";
          cGo.addEventListener("click", flyAway);
          gStates.appendChild(cGo);
        }
      }
    }

    /* ---------- transiciones ---------- */
    function clearAnim() {
      frameWrap.classList.remove("taking-off", "hovering", "landing", "fly-away", "return");
    }
    function syncFlying() {
      stage.classList.toggle("flying", flying);
    }

    function switchSet(i) {
      if (animating) return;
      setIdx = i;
      flying = false;
      stateName = "estatico";
      clearAnim();
      syncFlying();
      showFrame(0);
      renderControls();
      preloadSet();
    }

    function switchState(name) {
      if (animating) return;
      if (flying) { flying = false; clearAnim(); syncFlying(); }
      stateName = name;
      showFrame(0);
      renderControls();
    }

    function onAnimEnd(cls, cb) {
      var done = false;
      var h = function (ev) {
        if (ev.target !== frameWrap || done) return;
        done = true;
        frameWrap.removeEventListener("animationend", h);
        cb();
      };
      frameWrap.addEventListener("animationend", h);
      // red de seguridad por si el navegador se salta el evento
      setTimeout(function () { if (!done) { done = true; frameWrap.removeEventListener("animationend", h); cb(); } }, 3200);
    }

    function takeoff() {
      if (animating || flying) return;
      var st = curSet().states;
      if (!st.vuelo) return;
      flying = true;
      syncFlying();
      showFrame(0);
      renderControls();
      if (REDUCED) return;
      animating = true;
      clearAnim();
      frameWrap.classList.add("taking-off");
      onAnimEnd("taking-off", function () {
        frameWrap.classList.remove("taking-off");
        frameWrap.classList.add("hovering");
        animating = false;
      });
    }

    function land() {
      if (animating || !flying) return;
      flying = false;
      syncFlying();
      if (REDUCED) { clearAnim(); stateName = "estatico"; showFrame(0); renderControls(); return; }
      animating = true;
      clearAnim();
      frameWrap.classList.add("landing");
      stateName = "estatico";
      showFrame(0);
      renderControls();
      onAnimEnd("landing", function () {
        clearAnim();
        animating = false;
      });
    }

    function flyAway() {
      if (animating || !flying) return;
      if (REDUCED) { land(); return; }
      animating = true;
      clearAnim();
      frameWrap.classList.add("fly-away");
      onAnimEnd("fly-away", function () {
        // el dron se fue: vuelve a aparecer aterrizando
        flying = false;
        syncFlying();
        stateName = "estatico";
        frameWrap.style.opacity = "0";
        clearAnim();
        showFrame(0, true);
        setTimeout(function () {
          frameWrap.style.opacity = "";
          frameWrap.classList.add("return");
          renderControls();
          onAnimEnd("return", function () {
            clearAnim();
            animating = false;
          });
        }, 550);
      });
    }

    /* ---------- drag / swipe ---------- */
    var dragging = false, startX = 0, startFrame = 0, moved = false;
    function pxPerFrame() {
      var n = curFrames().length;
      return Math.max(34, stage.clientWidth / Math.max(n * 1.6, 4));
    }
    stage.addEventListener("pointerdown", function (ev) {
      if (curFrames().length < 2) return;
      dragging = true; moved = false;
      startX = ev.clientX; startFrame = frameIdx;
      stage.classList.add("dragging");
      stage.setPointerCapture && stage.setPointerCapture(ev.pointerId);
    });
    stage.addEventListener("pointermove", function (ev) {
      if (!dragging) return;
      var dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      var step = Math.round(dx / pxPerFrame());
      showFrame(startFrame + step);
      if (moved) hideHint();
    });
    function endDrag() { dragging = false; stage.classList.remove("dragging"); }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight") { showFrame(frameIdx + 1); ev.preventDefault(); }
      if (ev.key === "ArrowLeft") { showFrame(frameIdx - 1); ev.preventDefault(); }
    });

    /* ---------- precarga ---------- */
    function preloadSet() {
      var st = curSet().states;
      preload(frames(st.estatico));
      if (st.plegado) preload(frames(st.plegado));
      if (st.vuelo) preload(frames(st.vuelo).slice(0, 2));
    }

    /* ---------- arranque ---------- */
    showFrame(0, true);
    renderControls();
    preloadSet();
    // precarga diferida del resto de configuraciones
    setTimeout(function () {
      cfg.sets.forEach(function (s, i) {
        if (i === setIdx) return;
        preload(frames(s.states.estatico).slice(0, 2));
      });
    }, 2500);

    return root;
  };
})();
