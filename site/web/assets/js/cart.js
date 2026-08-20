/* ============================================================
   NASE Agrotech — Carrito de cotización
   Carrito en localStorage para equipos y repuestos. El checkout
   pide los datos del cliente y arma el requerimiento, que se
   envía por WhatsApp (canal principal) o por correo.
   ============================================================ */
(function () {
  "use strict";

  var KEY = "nase-cart-v1";
  var KEY_BUYER = "nase-buyer-v1";

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadge(items);
  }
  function count(items) {
    return (items || load()).reduce(function (a, it) { return a + it.qty; }, 0);
  }

  function updateBadge(items) {
    var n = count(items);
    var btn = document.getElementById("nav-cart");
    var c = document.getElementById("nav-cart-count");
    if (!btn || !c) return;
    c.textContent = n;
    btn.classList.toggle("has-items", n > 0);
  }

  /* ---------- API pública ---------- */
  window.Cart = {
    add: function (item) {
      var items = load();
      var ex = items.find(function (i) { return i.id === item.id; });
      if (ex) ex.qty += item.qty || 1;
      else items.push({ id: item.id, name: item.name, model: item.model || "", img: item.img || "", type: item.type || "repuesto", qty: item.qty || 1 });
      save(items);
      renderItems();
      /* agregar un dron dispara el ciclo del T100 (cortina + despegue);
         el carrito se abre cuando el dron ya se fue */
      if (item.type === "equipo" && window.playDroneCycle) window.playDroneCycle(openDrawer);
      else openDrawer();
    },
    open: function () { openDrawer(); },
    count: function () { return count(); },
  };

  /* ---------- drawer ---------- */
  var backdrop, drawer, itemsBox, checkoutBox, footBox;

  function openDrawer() {
    backdrop.classList.add("open");
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
  }

  function qtyStepper(item) {
    var s = document.createElement("span");
    s.className = "qty-stepper";
    s.innerHTML = '<button type="button" aria-label="Quitar uno">−</button><span class="q">' + item.qty + '</span><button type="button" aria-label="Agregar uno">+</button>';
    var btns = s.querySelectorAll("button");
    btns[0].addEventListener("click", function () { changeQty(item.id, -1); });
    btns[1].addEventListener("click", function () { changeQty(item.id, +1); });
    return s;
  }

  function changeQty(id, d) {
    var items = load();
    var it = items.find(function (i) { return i.id === id; });
    if (!it) return;
    it.qty += d;
    if (it.qty <= 0) items = items.filter(function (i) { return i.id !== id; });
    save(items);
    renderItems();
  }

  function removeItem(id) {
    save(load().filter(function (i) { return i.id !== id; }));
    renderItems();
  }

  function renderItems() {
    var items = load();
    itemsBox.innerHTML = "";
    if (!items.length) {
      itemsBox.innerHTML =
        '<div class="cart-empty">Tu carrito de cotización está vacío.<br>Agrega equipos o repuestos desde <a href="repuestos.html">la tienda</a>.</div>';
      footBox.style.display = "none";
      return;
    }
    footBox.style.display = "";
    var order = ["equipo", "repuesto"];
    order.forEach(function (type) {
      var sub = items.filter(function (i) { return i.type === type; });
      if (!sub.length) return;
      var h = document.createElement("div");
      h.style.cssText = "font-size:11.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--color-accent-2-700);padding:14px 0 2px;";
      h.textContent = type === "equipo" ? "Equipos" : "Repuestos y accesorios";
      itemsBox.appendChild(h);
      sub.forEach(function (item) {
        var row = document.createElement("div");
        row.className = "cart-item";
        var th = document.createElement("div");
        th.className = "thumb";
        if (item.img) th.innerHTML = '<img src="' + item.img + '" alt="">';
        var info = document.createElement("div");
        info.className = "info";
        info.innerHTML = '<div class="n">' + item.name + '</div>' + (item.model ? '<div class="m">' + item.model + "</div>" : "");
        var rowCtrl = document.createElement("div");
        rowCtrl.className = "row";
        rowCtrl.appendChild(qtyStepper(item));
        var rm = document.createElement("button");
        rm.type = "button";
        rm.className = "rm";
        rm.textContent = "Quitar";
        rm.addEventListener("click", function () { removeItem(item.id); });
        rowCtrl.appendChild(rm);
        info.appendChild(rowCtrl);
        row.appendChild(th);
        row.appendChild(info);
        itemsBox.appendChild(row);
      });
    });
  }

  /* ---------- checkout ---------- */
  function buyer() {
    try { return JSON.parse(localStorage.getItem(KEY_BUYER)) || {}; } catch (e) { return {}; }
  }

  function buildMessage(data) {
    var items = load();
    var lines = ["Hola " + NASE.brand + ", quiero cotizar:"];
    var eq = items.filter(function (i) { return i.type === "equipo"; });
    var rp = items.filter(function (i) { return i.type === "repuesto"; });
    if (eq.length) {
      lines.push("", "EQUIPOS");
      eq.forEach(function (i) { lines.push("• " + i.qty + "× " + i.name); });
    }
    if (rp.length) {
      lines.push("", "REPUESTOS");
      rp.forEach(function (i) { lines.push("• " + i.qty + "× " + i.name + (i.model ? " (" + i.model + ")" : "")); });
    }
    lines.push("", "Nombre: " + data.nombre, "Teléfono: " + data.telefono);
    if (data.correo) lines.push("Correo: " + data.correo);
    if (data.comuna) lines.push("Comuna: " + data.comuna);
    if (data.comentario) lines.push("Comentario: " + data.comentario);
    return lines.join("\n");
  }

  function renderCheckout() {
    var b = buyer();
    checkoutBox.innerHTML =
      '<div><label for="ck-nombre">Nombre *</label><input class="input" id="ck-nombre" type="text" required placeholder="Tu nombre" value="' + (b.nombre || "") + '"></div>' +
      '<div><label for="ck-telefono">Teléfono *</label><input class="input" id="ck-telefono" type="tel" required placeholder="+56 9 …" value="' + (b.telefono || "") + '"></div>' +
      '<div><label for="ck-correo">Correo</label><input class="input" id="ck-correo" type="email" placeholder="tucorreo@…" value="' + (b.correo || "") + '"></div>' +
      '<div><label for="ck-comuna">Comuna / sector</label><input class="input" id="ck-comuna" type="text" placeholder="Ej: Curicó, Sagrada Familia…" value="' + (b.comuna || "") + '"></div>' +
      '<div><label for="ck-comentario">Comentario</label><textarea class="input" id="ck-comentario" rows="2" placeholder="Cultivo, hectáreas, urgencia…">' + (b.comentario || "") + "</textarea></div>" +
      '<button type="button" class="btn-send-wa" id="ck-send">Enviar requerimiento por WhatsApp</button>' +
      '<div class="send-alt"><a href="#" id="ck-mail">o enviar por correo</a></div>';

    function collect() {
      var data = {
        nombre: document.getElementById("ck-nombre").value.trim(),
        telefono: document.getElementById("ck-telefono").value.trim(),
        correo: document.getElementById("ck-correo").value.trim(),
        comuna: document.getElementById("ck-comuna").value.trim(),
        comentario: document.getElementById("ck-comentario").value.trim(),
      };
      localStorage.setItem(KEY_BUYER, JSON.stringify(data));
      return data;
    }
    function valid(data) {
      if (!data.nombre || !data.telefono) {
        alert("Para enviar el requerimiento necesitamos tu nombre y teléfono.");
        return false;
      }
      return true;
    }

    /* deja el pedido registrado en el panel como PENDIENTE
       (no descuenta stock: eso ocurre al aprobarlo en inventario) */
    function registraPedido(data) {
      var items = load().map(function (i) {
        return { id: i.id, nombre: i.name, cantidad: i.qty, tipo: i.type };
      });
      if (!items.length) return Promise.resolve();
      return fetch("/api/pedidos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre: data.nombre, telefono: data.telefono, correo: data.correo,
          comuna: data.comuna, comentario: data.comentario, items: items,
        }),
      }).catch(function () { /* si no hay API, el WhatsApp igual sale */ });
    }

    document.getElementById("ck-send").addEventListener("click", function () {
      var data = collect();
      if (!valid(data)) return;
      var url = waLink(buildMessage(data));
      /* la ventana se abre de inmediato para que el navegador no la bloquee */
      window.open(url, "_blank", "noopener");
      registraPedido(data);
    });
    document.getElementById("ck-mail").addEventListener("click", function (ev) {
      ev.preventDefault();
      var data = collect();
      if (!valid(data)) return;
      registraPedido(data);
      location.href =
        "mailto:" + NASE.email +
        "?subject=" + encodeURIComponent("Cotización " + NASE.brand + " — " + data.nombre) +
        "&body=" + encodeURIComponent(buildMessage(data));
    });
  }

  /* ---------- init ---------- */
  window.initCart = function () {
    backdrop = document.createElement("div");
    backdrop.className = "cart-backdrop";
    backdrop.addEventListener("click", closeDrawer);
    document.body.appendChild(backdrop);

    drawer = document.createElement("aside");
    drawer.className = "cart-drawer";
    drawer.setAttribute("aria-label", "Carrito de cotización");
    drawer.innerHTML =
      '<div class="head"><h3>Tu cotización</h3>' +
      '<button type="button" class="close" aria-label="Cerrar carrito">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="width:22px;height:22px;"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
      "</button></div>" +
      '<div class="items"></div>' +
      '<div class="foot">' +
      '<p class="hint-quote">Sin precios a la vista: armamos tu requerimiento y te lo cotizamos por WhatsApp o correo, con stock y plazo real.</p>' +
      '<button type="button" class="btn btn-primary btn-wa" id="ck-toggle" style="width:100%;box-sizing:border-box;">Completar datos y enviar</button>' +
      '<form class="checkout-form" onsubmit="return false"></form>' +
      "</div>";
    document.body.appendChild(drawer);

    itemsBox = drawer.querySelector(".items");
    footBox = drawer.querySelector(".foot");
    checkoutBox = drawer.querySelector(".checkout-form");
    drawer.querySelector(".close").addEventListener("click", closeDrawer);

    document.getElementById("ck-toggle").addEventListener("click", function () {
      var open = checkoutBox.classList.toggle("open");
      if (open) { renderCheckout(); this.textContent = "Ocultar formulario"; }
      else this.textContent = "Completar datos y enviar";
    });

    var navBtn = document.getElementById("nav-cart");
    if (navBtn) navBtn.addEventListener("click", openDrawer);

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
    });

    renderItems();
    updateBadge();
  };
})();
