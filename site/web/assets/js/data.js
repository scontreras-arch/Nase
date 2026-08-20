/* ============================================================
   NASE Agrotech — catálogo de datos del sitio
   Los grupos de imágenes (IMG[...]) los genera el pipeline de
   optimización en manifest.js. Aquí solo se referencian.
   ============================================================ */

window.NASE = {
  whatsapp: "56942291109",
  email: "servicios@naseagrotech.cl",
  instagram: "naseagrotech",
  brand: "NASE Agrotech",
  zona: "Región del Maule, Chile",
};

// helper: ruta de imagen i del grupo g (con fallback seguro)
function G(g, i) {
  var l = (window.IMG && window.IMG[g]) || [];
  var f = l[i || 0];
  return f ? "assets/img/" + f : "";
}
function GA(g, order) {
  var l = (window.IMG && window.IMG[g]) || [];
  var out = [];
  if (order && order.length) {
    for (var i = 0; i < order.length; i++) if (l[order[i]]) out.push("assets/img/" + l[order[i]]);
  } else {
    for (var j = 0; j < l.length; j++) out.push("assets/img/" + l[j]);
  }
  return out;
}

/* ---------- Modelos ---------- */
window.MODELS = {
  t100: {
    id: "t100", page: "t100.html",
    name: "DJI Agras T100", short: "T100",
    kicker: "",
    tagline: "100 L de pulverización, 150 L de esparcido y 100 kg de izaje. El dron agrícola más capaz que ha llegado a Chile, con Safety System 3.0 (LiDAR + radar mmWave + Penta-Vision).",
    cardNote: "100 L · el más capaz de la gama. Visor 360, estados y configuraciones.",
    specs: [
      { v: "100 L", l: "Pulverización" },
      { v: "150 L", l: "Esparcido" },
      { v: "100 kg", l: "Izaje" },
      { v: "62″", l: "Hélices" },
      { v: "±10 cm", l: "RTK" },
      { v: "177 kg", l: "MTOW" },
      { v: "8–9 min", l: "Carga batería" },
    ],
    specSource: "Fuente Oficial: ag.dji.com/t100/specs",
    kv: "kv/t100",
    kvIndex: 1,
    pdf: "https://dl.djicdn.com/downloads/t70_t100/20251106/T100_User_Manual_v1.0_en.pdf",
    video: "https://www.youtube.com/embed/Nlee3cffZJw",
    videoTitle: "Introducing DJI Agras T100 — video Oficial DJI",
    appBg: () => G("kv/t100", 0),
    heroImg: () => G("t100/r/dual100-static", 5),
    cardImg: () => G("t100/r/dual100-static", 5),
    viewer: {
      /* el T100 llega a Chile solo con estanque de 100 L (R-09):
         la configuración de 2 aspersores usa los renders del tanque 100 L */
      sets: [
        { id: "dual", label: "2 aspersores", states: {
            estatico: { group: "t100/r/dual100-static", order: [1, 4, 6, 5, 2, 0, 3] },
            plegado:  { group: "t100/r/dual-fold" },
            vuelo:    { group: "t100/r/dual-flight" },
        } },
        { id: "quad", label: "4 aspersores", states: {
            estatico: { group: "t100/r/quad-static", order: [1, 2, 3, 0] },
            plegado:  { group: "t100/r/quad-fold" },
            vuelo:    { group: "t100/r/quad-flight" },
        } },
        { id: "spread", label: "Esparcido", states: {
            estatico: { group: "t100/r/spread-static", order: [1, 2, 0] },
            vuelo:    { group: "t100/r/spread-flight" },
        } },
      ],
    },
    despiece: { group: "t100/despiece", pick: [1] },
    gallery: "t100/fotos",
    galleryTitle: "Agras T100 en terreno",
  },

  t70p: {
    id: "t70p", page: "t70p.html",
    name: "DJI Agras T70P", short: "T70P",
    kicker: "El todoterreno",
    eyebrow: "Un equipo. Múltiples soluciones",
    tagline: "Con 70 litros de pulverización y funciones de esparcido e izaje de carga, el DJI Agras T70P ofrece la versatilidad que exige la agricultura moderna, permitiendo realizar distintas labores con un solo equipo.",
    cardNote: "70 L · pulveriza, esparce y carga. Visor 360 con 4 configuraciones.",
    specs: [
      { v: "70 L", l: "Pulverización · doble atomización" },
      { v: "Alta tasa", l: "Esparcido · tornillo sin fin" },
      { v: "Cabrestante", l: "Izaje con cable" },
      { v: "±10 cm", l: "RTK" },
      { v: "80–200 ha", l: "Área recomendada / jornada" },
    ],
    specSource: "Fuente Oficial: ag.dji.com",
    kv: "kv/t70p",
    kvIndex: 0,
    pdf: "https://dl.djicdn.com/downloads/t70_t100/20251106/T70P_User_Manual_v1.0_en.pdf",
    video: "https://www.youtube.com/embed/H3hVqnZPpEs",
    videoTitle: "Introducing the New DJI AGRAS Series: T100, T70P & T25P — video Oficial DJI",
    appBg: () => G("kv/t70p", 0),
    heroImg: () => G("t70p/r/dual-static", 5),
    cardImg: () => G("t70p/r/dual-static", 5),
    viewer: {
      sets: [
        { id: "dual", label: "2 aspersores", states: {
            estatico: { group: "t70p/r/dual-static", order: [1, 4, 6, 5, 2, 0, 3] },
            plegado:  { group: "t70p/r/dual-fold" },
            vuelo:    { group: "t70p/r/dual-flight" },
        } },
        { id: "quad", label: "4 aspersores", states: {
            estatico: { group: "t70p/r/quad-static", order: [1, 2, 0] },
            plegado:  { group: "t70p/r/quad-fold" },
            vuelo:    { group: "t70p/r/quad-flight" },
        } },
        { id: "lift", label: "Carga (izaje)", states: {
            estatico: { group: "t70p/r/lift-static", order: [1, 2, 0] },
            vuelo:    { group: "t70p/r/lift-flight" },
        } },
        { id: "spread", label: "Esparcido", states: {
            estatico: { group: "t70p/r/spread-static", order: [1, 2, 0] },
            vuelo:    { group: "t70p/r/spread-flight" },
        } },
      ],
    },
    despiece: { group: "t70p/despiece", pick: [1] },
    gallery: "t70p/fotos",
    galleryTitle: "Agras T70P en terreno",
  },

  t55: {
    id: "t55", page: "t55.html",
    name: "DJI Agras T55", short: "T55",
    kicker: "Estreno — el sucesor del T50",
    tagline: "Pulverización de 50 L con caudal de 40 L/min, esparcido de 55 kg, izaje de 40 kg y carga rápida en 9 minutos. Plegable, con visión nocturna y radares de arreglo en fase.",
    cardNote: "50 L · el estreno de la temporada. Video de lanzamiento y galería.",
    specs: [
      { v: "50 L", l: "Pulverización" },
      { v: "40 L/min", l: "Caudal" },
      { v: "55 kg", l: "Esparcido" },
      { v: "40 kg", l: "Izaje" },
      { v: "9 min", l: "Carga batería" },
    ],
    specSource: "Presentación Oficial del distribuidor",
    pdf: "https://terra-1-g.djicdn.com/6189933d30024fc1b331bffe4fe41837/t100s_t70s_t55/UM/20260701/T55_User_Manual_v1.0_en.pdf",
    heroImg: () => G("t55/fotos", 0),
    cardImg: () => G("t55/fotos", 0),
    cardCover: true,
    video: "https://drive.google.com/file/d/1RXPSrCU-7zl4oRy3-UPmJ1UuwceY6btd/preview",
    videoTitle: "DJI Agras T55 — presentación Oficial en español",
    gallery: "t55/fotos",
    galleryTitle: "Agras T55 en terreno",
  },

  t25p: {
    id: "t25p", page: "t25p.html",
    name: "DJI Agras T25P", short: "T25P",
    kicker: "El compacto",
    tagline: "La puerta de entrada a la fumigación con drones: compacto, plegable y operable por una sola persona, con pulverización y esparcido (siembra).",
    cardNote: "Compacto y plegable · visor 360 con esparcido y vuelo.",
    specs: [
      { v: "25 L", l: "Pulverización · centrífugos" },
      { v: "35 kg", l: "Esparcido" },
      { v: "Plegable", l: "Cabe en una camioneta" },
      { v: "1 persona", l: "Despliegue en minutos" },
      { v: "±10 cm", l: "RTK" },
      { v: "≤ 30 ha", l: "Área recomendada / jornada" },
    ],
    specSource: "Fuente Oficial: ag.dji.com",
    pdf: "https://dl.djicdn.com/downloads/t60_t25p/20260409/T25P_User_Manual_v1.0_en.pdf",
    video: "https://www.youtube.com/embed/h_rVnFJzpwE",
    videoTitle: "Introducing DJI Agras T25P — video Oficial DJI",
    /* sin appBg: no hay fotos reales del T25P en el material — su tarjeta
       muestra el render de vuelo sobre fondo neutro */
    heroImg: () => G("t25p/r/dual-static", 2),
    cardImg: () => G("t25p/r/dual-flight", 1),
    viewer: {
      sets: [
        { id: "dual", label: "2 aspersores", states: {
            /* este grupo trae un archivo con espacio inicial que altera el orden alfabético */
            estatico: { group: "t25p/r/dual-static", order: [2, 1, 4, 3, 0] },
            vuelo:    { group: "t25p/r/dual-flight", order: [0, 2, 1] },
        } },
        { id: "quad", label: "4 aspersores", states: {
            estatico: { group: "t25p/r/quad-static", order: [1, 0, 3, 2, 4] },
            vuelo:    { group: "t25p/r/quad-flight", order: [0, 2, 1] },
        } },
        { id: "spread", label: "Esparcido (siembra)", states: {
            estatico: { group: "t25p/r/spread-static", order: [1, 0, 3, 2, 4] },
            vuelo:    { group: "t25p/r/spread-flight", order: [0, 2, 1] },
        } },
      ],
    },
    despiece: { group: "t25p/despiece", pick: [5] },
    galleryTitle: "",
  },

  dock3: {
    id: "dock3", page: "dock3.html",
    name: "DJI Dock 3", short: "Dock 3",
    kicker: "Línea Enterprise — operación autónoma",
    tagline: "Estación de despegue y aterrizaje autónoma para operación remota 24/7: inspección de líneas eléctricas, parques solares, minería y seguridad perimetral, incluso montada en vehículo.",
    cardNote: "Operación autónoma 24/7 · inspección e infraestructura.",
    specs: [
      { v: "24/7", l: "Operación remota" },
      { v: "IP56", l: "Instalación a la intemperie" },
      { v: "Dual", l: "Soporta operación con 2 drones" },
      { v: "Vehículo", l: "Despliegue flexible" },
    ],
    specSource: "Fuente Oficial: enterprise.dji.com",
    pdf: "https://terra-1-g.djicdn.com/6189933d30024fc1b331bffe4fe41837/dock-3/UM/DJI_Matrice_4D_DJI_Dock_3_UM_en.pdf",
    video: "https://www.youtube.com/embed/4E8LFqdKltk",
    videoTitle: "Introducing DJI Dock 3 — video Oficial DJI",
    heroImg: () => G("dock3/fotos", 0),
    cardImg: () => G("dock3/fotos", 6),
    cardCover: true,
    gallery: "dock3/fotos",
    galleryTitle: "DJI Dock 3 en terreno",
  },

  matrice4: {
    id: "matrice4", page: "matrice4.html",
    name: "DJI Matrice 4", short: "Matrice 4",
    kicker: "Línea Enterprise — inspección profesional",
    tagline: "Plataforma de inspección con cámaras teleobjetivo, térmica y láser: puentes, líneas eléctricas, emergencias y búsqueda. La herramienta de los equipos técnicos.",
    cardNote: "Inspección, térmica y emergencias · línea Enterprise.",
    specs: [
      { v: "Tele+IR", l: "Cámaras de inspección" },
      { v: "Láser", l: "Medición de distancia" },
      { v: "Foco", l: "Spotlight nocturno" },
      { v: "RTK", l: "Posicionamiento de precisión" },
    ],
    specSource: "Fuente Oficial: enterprise.dji.com",
    pdf: "https://terra-1-g.djicdn.com/6189933d30024fc1b331bffe4fe41837/matrice-4-series/UM/DJI_Matrice_4_Series_User_Manual_en.pdf",
    video: "https://www.youtube.com/embed/uov1c1c8DKA",
    videoTitle: "Introducing DJI Matrice 4 Series — video Oficial DJI",
    heroImg: () => G("matrice4/fotos", 9),
    cardImg: () => G("matrice4/fotos", 9),
    cardCover: true,
    gallery: "matrice4/fotos",
    galleryTitle: "DJI Matrice 4 en terreno",
  },
};

window.MODEL_ORDER = ["t100", "t70p", "t55", "t25p", "dock3", "matrice4"];

/* ---------- Equipos (cotizables como producto) ---------- */
window.EQUIPOS = [
  { id: "eq-t100", name: "DJI Agras T100", model: "T100", img: () => G("t100/r/dual-static", 5), note: "Equipo completo — configuración a cotizar" },
  { id: "eq-t70p", name: "DJI Agras T70P", model: "T70P", img: () => G("t70p/r/dual-static", 5), note: "Equipo completo — configuración a cotizar" },
  { id: "eq-t55", name: "DJI Agras T55", model: "T55", img: () => G("t55/fotos", 0), note: "Equipo completo — estreno" },
  { id: "eq-t25p", name: "DJI Agras T25P", model: "T25P", img: () => G("t25p/r/dual-static", 1), note: "Equipo completo — compacto" },
  { id: "eq-dock3", name: "DJI Dock 3", model: "Enterprise", img: () => G("dock3/fotos", 0), note: "Estación autónoma + dron de dock" },
  { id: "eq-matrice4", name: "DJI Matrice 4", model: "Enterprise", img: () => G("matrice4/fotos", 6), note: "Plataforma de inspección" },
];

/* ---------- Repuestos y accesorios ----------
   Cada repuesto tiene su página de detalle (repuesto.html?id=…)
   con descripción y ficha técnica. Solo datos verificables:
   lo que no está confirmado va como "por cotización".        */
window.PARTS = [
  // T100
  { id: "p-t100-quad", model: "T100", name: "Kit 4 aspersores (Quad Spray)", group: "parts/t100/4-aspersores",
    note: "Mayor cobertura y tasa de aplicación para el T100.",
    desc: "Kit de aspersión Quad Spray para el DJI Agras T100: cuatro aspersores centrífugos que elevan el caudal y el ancho efectivo de faja en aplicaciones de alto volumen. Ideal para cultivos extensivos donde cada pasada cuenta.",
    ficha: [["Tipo", "Kit de aspersión Quad Spray"], ["Configuración", "4 aspersores centrífugos"], ["Uso", "Aplicaciones de alto caudal y cobertura"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t100-centrifugo", model: "T100", name: "Aspersor centrífugo de atomización", group: "parts/t100/aspersor-centrifugo",
    note: "Gota fina y uniforme para aplicaciones foliares.",
    desc: "Aspersor centrífugo de atomización para el T100: produce una gota fina y de tamaño uniforme, regulable según el objetivo de la aplicación. Es la pieza clave para aplicaciones foliares de precisión.",
    ficha: [["Tipo", "Aspersor centrífugo de atomización"], ["Gota", "Fina y uniforme, tamaño regulable"], ["Uso", "Aplicaciones foliares de precisión"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t100-nebulizador", model: "T100", name: "Aspersores nebulizadores refrigerados", group: "parts/t100/aspersores-nebulizadores",
    note: "Nebulización con refrigeración por agua.",
    desc: "Juego de aspersores nebulizadores con refrigeración por agua para el T100. Generan una niebla muy fina pensada para penetrar copas densas — huertos y frutales — manteniendo la temperatura del conjunto bajo control.",
    ficha: [["Tipo", "Aspersores nebulizadores"], ["Refrigeración", "Por agua"], ["Uso", "Niebla fina para copas densas (huertos, frutales)"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t100-bateria", model: "T100", name: "Batería inteligente DB2160", group: "parts/t100/bateria",
    note: "41 Ah · carga rápida en 8–9 minutos.",
    desc: "Batería inteligente de vuelo DB2160 del Agras T100: 41 Ah con carga rápida en 8–9 minutos usando el sistema de carga dedicado. Con dos o tres baterías en rotación, el T100 no se detiene en toda la jornada.",
    ficha: [["Modelo", "DB2160"], ["Capacidad", "41 Ah"], ["Carga rápida", "8–9 min con sistema de carga dedicado"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t100-cuerpo", model: "T100", name: "Cuerpo / estructura AGT100", group: "parts/t100/cuerpo",
    note: "Chasis principal del T100.",
    desc: "Estructura principal (chasis) AGT100 del Agras T100. Repuesto estructural para mantenciones mayores o reparaciones tras incidentes, con la geometría y anclajes originales del equipo.",
    ficha: [["Tipo", "Estructura / chasis principal"], ["Referencia", "AGT100"], ["Uso", "Reposición estructural"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t100-disipador", model: "T100", name: "Disipador de calor (aire)", group: "parts/t100/disipador-aire",
    note: "Refrigeración del sistema de carga.",
    desc: "Disipador de calor refrigerado por aire para el sistema de carga del T100. Mantiene la temperatura de la batería durante la carga rápida entre vuelos, protegiendo su vida útil en jornadas intensivas.",
    ficha: [["Tipo", "Disipador de calor"], ["Refrigeración", "Por aire"], ["Uso", "Enfriamiento de batería durante carga rápida"], ["Compatibilidad", "Sistema de carga DJI Agras T100"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t100-fuente", model: "T100", name: "Fuente de poder", group: "parts/t100/fuente-de-poder",
    note: "Alimentación del cargador del T100.",
    desc: "Fuente de poder del sistema de carga del T100: convierte la energía del generador o de la red en la potencia que exige la carga rápida de la DB2160.",
    ficha: [["Tipo", "Fuente de poder del sistema de carga"], ["Uso", "Alimentación del cargador de batería"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t100-generador", model: "T100", name: "Generador D14000iE", group: "parts/t100/generador",
    note: "Energía en terreno para jornadas completas.",
    desc: "Generador inversor D14000iE: la fuente de energía en terreno para cargar baterías del T100 lejos de la red. Dimensionado para sostener la rotación de baterías durante una jornada completa de aplicación.",
    ficha: [["Modelo", "D14000iE"], ["Tipo", "Generador inversor"], ["Uso", "Carga de baterías en terreno"], ["Compatibilidad", "Sistema de carga DJI Agras T100"], ["Origen", "Equipo original DJI"]] },
  { id: "p-t100-helices", model: "T100", name: "Hélices 62″ fibra de carbono", group: "parts/t100/helices",
    note: "Repuesto original DJI para el T100.",
    desc: "Hélices de 62 pulgadas en fibra de carbono, las mismas que monta de fábrica el Agras T100. Repuesto de desgaste que conviene tener siempre en stock durante la temporada.",
    ficha: [["Diámetro", "62″"], ["Material", "Fibra de carbono"], ["Uso", "Repuesto de desgaste"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t100-lifting", model: "T100", name: "Sistema de carga (izaje)", group: "parts/t100/sistema-de-carga",
    note: "Kit de izaje de hasta 100 kg.",
    desc: "Kit de izaje del T100: convierte el dron en una grúa aérea capaz de transportar hasta 100 kg con control de balanceo automático. Plantines, materiales, insumos — donde no llega el tractor, llega el T100.",
    ficha: [["Tipo", "Sistema de carga / izaje"], ["Capacidad", "Hasta 100 kg"], ["Control", "Balanceo automático de la carga"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t100-esparcido", model: "T100", name: "Sistema de esparcido 150 L", group: "parts/t100/sistema-de-esparcido",
    note: "Tolva de esparcido de hasta 400 kg/min.",
    desc: "Sistema de esparcido del T100: tolva de 150 L con tasa de descarga de hasta 400 kg/min para fertilizante granulado y semilla. Cambio de configuración rápido entre pulverización y esparcido.",
    ficha: [["Tipo", "Sistema de esparcido (tolva)"], ["Capacidad", "150 L"], ["Tasa de descarga", "Hasta 400 kg/min"], ["Uso", "Fertilizante granulado y semilla"], ["Compatibilidad", "DJI Agras T100"], ["Origen", "Accesorio original DJI"]] },
  // T70P
  { id: "p-t70p-centrifugo", model: "T70P", name: "Aspersor centrífugo de atomización", group: "parts/t70p/aspersor-centrifugo",
    note: "Gota fina y uniforme para el T70P.",
    desc: "Aspersor centrífugo de atomización para el Agras T70P: gota fina y uniforme con tamaño regulable según objetivo. La doble atomización del T70P depende de esta pieza.",
    ficha: [["Tipo", "Aspersor centrífugo de atomización"], ["Gota", "Fina y uniforme, tamaño regulable"], ["Uso", "Aplicaciones foliares de precisión"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t70p-nebulizador", model: "T70P", name: "Aspersores nebulizadores refrigerados", group: "parts/t70p/aspersores-nebulizadores",
    note: "Nebulización con refrigeración por agua.",
    desc: "Aspersores nebulizadores con refrigeración por agua para el T70P: niebla fina para penetrar follaje denso, con el conjunto siempre a temperatura segura.",
    ficha: [["Tipo", "Aspersores nebulizadores"], ["Refrigeración", "Por agua"], ["Uso", "Niebla fina para follaje denso"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t70p-bateria", model: "T70P", name: "Batería inteligente T70P", group: "parts/t70p/bateria",
    note: "Batería original de vuelo.",
    desc: "Batería inteligente de vuelo original del Agras T70P. Con rotación de baterías y carga rápida en terreno, el equipo aplica sin pausas toda la jornada.",
    ficha: [["Tipo", "Batería inteligente de vuelo"], ["Uso", "Rotación en jornada de aplicación"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t70p-disipador", model: "T70P", name: "Disipador de calor (aire)", group: "parts/t70p/disipador-aire",
    note: "Refrigeración del sistema de carga.",
    desc: "Disipador refrigerado por aire para el sistema de carga del T70P: protege la batería durante la carga rápida entre vuelos.",
    ficha: [["Tipo", "Disipador de calor"], ["Refrigeración", "Por aire"], ["Uso", "Enfriamiento de batería durante carga rápida"], ["Compatibilidad", "Sistema de carga DJI Agras T70P"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t70p-generador", model: "T70P", name: "Generador", group: "parts/t70p/generador",
    note: "Energía en terreno para jornadas completas.",
    desc: "Generador inversor para el sistema de carga del T70P: energía autónoma en terreno para mantener la rotación de baterías durante toda la faena.",
    ficha: [["Tipo", "Generador inversor"], ["Uso", "Carga de baterías en terreno"], ["Compatibilidad", "Sistema de carga DJI Agras T70P"], ["Origen", "Equipo original DJI"]] },
  { id: "p-t70p-helices", model: "T70P", name: "Hélices T70P", group: "parts/t70p/helices",
    note: "Repuesto original DJI.",
    desc: "Juego de hélices originales del Agras T70P. Pieza de desgaste: revisa el estado tras cada temporada y mantén un juego de repuesto en el taller.",
    ficha: [["Tipo", "Hélices originales"], ["Uso", "Repuesto de desgaste"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Repuesto original DJI"]] },
  { id: "p-t70p-tanque50", model: "T70P", name: "Tanque de pulverización 50 L", group: "parts/t70p/tanque-de-agua-50l",
    note: "Tanque alternativo liviano.",
    desc: "Tanque de pulverización de 50 L para el T70P: la configuración liviana para lotes chicos, remates o cuando conviene privilegiar agilidad y tiempo de vuelo por batería.",
    ficha: [["Tipo", "Tanque de pulverización"], ["Capacidad", "50 L"], ["Uso", "Configuración liviana / lotes menores"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t70p-tanque70", model: "T70P", name: "Tanque de pulverización 70 L", group: "parts/t70p/tanque-de-agua-70l",
    note: "Tanque principal de 70 L.",
    desc: "Tanque principal de 70 L del Agras T70P, la configuración de máxima capacidad de pulverización del equipo para faenas extensivas.",
    ficha: [["Tipo", "Tanque de pulverización principal"], ["Capacidad", "70 L"], ["Uso", "Faenas extensivas"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Accesorio original DJI"]] },
  { id: "p-t70p-spread", model: "T70P", name: "Tanque de esparcido", group: "parts/t70p/tanque-de-esparcido",
    note: "Tolva para fertilizante y semilla.",
    desc: "Tolva de esparcido del T70P con descarga por tornillo sin fin, para fertilizante granulado y semilla. Convierte el mismo equipo de pulverización en esparcidor de alta tasa.",
    ficha: [["Tipo", "Tolva de esparcido"], ["Descarga", "Tornillo sin fin"], ["Uso", "Fertilizante granulado y semilla"], ["Compatibilidad", "DJI Agras T70P"], ["Origen", "Accesorio original DJI"]] },
  // Comunes
  { id: "p-com-rc", model: "Común", name: "Control remoto DJI", group: "parts/common/control-remoto",
    note: "Compatible con la línea Agras.",
    desc: "Control remoto DJI para la línea Agras: planificación de misiones, monitoreo de la aplicación y control manual cuando se necesita. Repuesto o unidad adicional para operaciones con más de un piloto.",
    ficha: [["Tipo", "Control remoto"], ["Uso", "Planificación y control de misiones"], ["Compatibilidad", "Línea DJI Agras"], ["Origen", "Equipo original DJI"]] },
  { id: "p-com-rtk", model: "Común", name: "Estación móvil D-RTK 3", group: "parts/common/d-rtk3",
    note: "Precisión centimétrica para toda la flota.",
    desc: "Estación móvil de referencia D-RTK 3: da posicionamiento de precisión centimétrica a toda la flota Agras sin depender de cobertura de red. Se instala en minutos en el borde del potrero.",
    ficha: [["Modelo", "D-RTK 3"], ["Tipo", "Estación móvil de referencia RTK"], ["Precisión", "Centimétrica"], ["Compatibilidad", "Línea DJI Agras"], ["Origen", "Equipo original DJI"]] },
];
