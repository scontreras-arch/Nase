# Brief de diseño — Agrotech Nase · para Claude Design

> Documento de traspaso para diseñar visualmente el sitio de Agrotech Nase en Claude Design.
> Idioma del sitio: **español (Chile)**. Sin emojis. Estética **sobria, corporativa, técnica pero cercana**.
> Objetivo: verse **superior a toda la competencia** y convertir a **cotización por WhatsApp**.

---

## 1. Encargo en una línea
Diseñar el sitio (home one-page + páginas de profundidad) de **Agrotech Nase**, distribuidor e
integrador de drones **DJI Agras** en la **Región del Maule**, con producto estrella el **DJI Agras T100**
y un **visor 3D navegable del T100 en el hero** como diferenciador que ningún competidor tiene.

## 2. Público y objetivo
- **Público:** fruticultores y agrónomos del Maule (cerezos, manzanos, viñas, maíz, arándanos) y decisores B2B. Consultan desde el **celular**.
- **Objetivo de negocio:** generar cotizaciones por **WhatsApp** (canal dominante en Chile). Un CTA único y repetido.
- **Prioridad:** mobile-first. Diseñar móvil y escritorio.

## 3. Dirección visual (sistema de diseño)
**Concepto:** “Precisión aérea sobre el Maule”. Cruce de agro + tecnología aérea de precisión. Evitar el verde-agro cliché y la estética de tienda.

**Paleta (tokens exactos):**
| Rol | HEX |
|---|---|
| Fondo profundo (hero/dark) | `#0E1A14` · `#13241A` · `#0a130e` |
| Claro / papel | `#F4F2EC` · `#EAE7DD` · tarjetas `#FFFFFF` |
| Tinta / texto | `#15201A` · suave `#4A564E` · tenue `#7A857E` |
| Verde marca (estructura) | `#1E6B43` · `#2E9159` |
| Acento técnico (datos, sensores) | teal `#4FB3A4` |
| Acento estrella / destaque | ámbar `#E6A532` |
| Acción (WhatsApp) | `#25D366` |

**Tipografía:**
- Titulares / display: **Archivo Black** (o Archivo 800) — presencia industrial, letra ancha.
- Texto y UI: **IBM Plex Sans**.
- Datos, etiquetas, “eyebrows” y specs: **IBM Plex Mono** — sensación de instrumento / lectura de precisión.

**Firma visual:** franjas de cobertura (“swaths”) y una línea de vuelo punteada de fondo en el hero; specs presentadas como lecturas en mono; retícula/mira sutil como motivo. Bordes finos, sombras suaves, esquinas ~14 px, mucho aire, claims cortos.

**Fotografía:** fotos reales del Maule (cerezos, viñas, dron en faena), luz natural / atardecer. Nada de stock genérico.

## 4. El diferenciador (crítico para el diseño)
**Visor 3D navegable del DJI Agras T100 en el hero.** Ya existe un prototipo funcional (Three.js) probado en iPhone.
En el diseño:
- Reservar el área del hero para el **canvas 3D** (cuadrado ~1 : 0.85), con el modelo centrado.
- Hint “arrástralo para girar” + badge “★ Producto estrella”.
- Diseñar el **fallback** (imagen del T100) por si el dispositivo no soporta WebGL.
- El hero es la tesis del sitio: el 3D manda, el texto acompaña.

## 5. Estructura del home (orden ideal) + copy real
Usar este copy (no lorem). Referencia visual: el blueprint `agrotech-nase-estructura.html`.

**00 · Header sticky (global):** logo · T100 · Modelos · Servicios · El Maule · Contacto · botón **Cotizar**. Hamburguesa en móvil.

**01 · HERO (visor 3D):**
- Eyebrow: `DISTRIBUCIÓN E INTEGRACIÓN · DJI AGRAS`
- Título: **“Precisión aérea para tu campo.”** (“campo” en teal)
- Sub: “Llevamos el DJI Agras T100 a los huertos, viñas y maizales del Maule. Más cobertura, menos agua, sin compactar el suelo.”
- CTA: **[Cotizar por WhatsApp]** (verde) · [Ver modelos Agras] (outline)
- Micro-trust: `+500 drones operando en Chile · ±10 cm RTK · 177 kg MTOW`

**02 · Barra de specs (mono):** `100 L pulverización · 150 L · 400 kg/min · 100 kg izaje · Hélices 62″ · RTK ±10 cm · Carga 8–9 min`

**03 · Valor Maule:** título “El terreno manda. El dron se adapta.” + 4 tarjetas:
- **90% menos agua** — 60–80 L/ha vs 400–1.000 L/ha del método tradicional.
- **12 ha/hora** — caudal 30–40 L/min y vuelo RTK uniforme.
- **Sin compactar el suelo** — aplica desde el aire, incluso tras la lluvia.
- **Datos, no estimaciones** — prescripción variable y registro de cada aplicación.
- Chips de cultivo: Cerezos · Manzanos · Viñas · Maíz · Arándanos · Praderas

**04 · Cómo funciona (3 pasos)** — *sección nueva, la mejora sobre la muestra:*
- **1. Mapeo** (Mavic 3M) → **2. Prescripción variable** → **3. Aplicación** (Agras). Ícono + 1 línea c/u.

**05 · Modelos en pestañas:** T100 (★ estrella) · T70P · T50 · T25P · Mavic 3M (mapeo). Cada tab: specs + **[Cotizar por WhatsApp]**. El T100 con specs duras (ver §7).

**06 · Servicios (4):** Venta e integración · Capacitación y pilotaje (DGAC) · Servicio técnico y postventa · Asesoría agronómica.

**07 · Casos / ROI:** testimonios con métricas (−30% agroquímicos, 3× velocidad, +25% eficiencia) + cultivo y zona. Etiquetar “Ejemplo” si no son reales aún.

**08 · Credenciales:** Piloto aplicador (DGAC) · Aplicador de plaguicidas (SAG) · Integrador DJI Agras · Garantía y repuestos.

**09 · Nosotros:** “Ingeniería del Maule, al servicio del agro.” Historia regional + equipo con nombres y rostro.

**10 · Contacto:** formulario corto (nombre, teléfono, cultivo, hectáreas, modelo) que arma el mensaje y abre WhatsApp. Lado: WhatsApp directo, correo, Instagram, cobertura Maule, mapa.

**11 · Footer:** navegación, contacto, redes, legales.

**Global · Botón WhatsApp flotante** (abajo-derecha, persistente, mensaje precargado).

## 6. Pantallas / entregables a diseñar
1. **Home — escritorio** (scroll completo).
2. **Home — móvil** (la vista principal; priorizar).
3. **Hero** en detalle: integración del canvas 3D + estados (cargando / fallback imagen).
4. **Página /t100**: visor ampliado, specs completas, video, FAQ, descargas.
5. **Sección Modelos**: estados de las pestañas.
6. **Biblioteca de componentes**: header, botón WhatsApp flotante, tarjeta de modelo, tarjeta de caso, formulario de contacto, chips, barra de specs.

## 7. Datos verificados del T100 (specs reales, no inventar)
Pulverización **100 L** (30–40 L/min) · esparcido **150 L** (400 kg/min) · izaje **100 kg** ·
hélices **62″** fibra de carbono · **RTK ±10 cm** · **MTOW 177 kg** · batería DB2160 **41 Ah** (carga 8–9 min) ·
Safety System 3.0 (LiDAR + radar mmwave + Penta-Vision). Fuente oficial: ag.dji.com/t100/specs.
Contexto de mercado: ~500 drones pulverizadores operando en Chile (~100.000 ha/año).

## 8. Qué imitar y qué evitar (del análisis de 7 competidores)
**Imitar** (Famagro / DJI): one-page; tabs de modelos con T100 destacado; testimonios con métricas; equipo humano con nombres; bloque de servicio/dealer/postventa; contacto segmentado; íconos de specs escaneables; WhatsApp en cada CTA.
**Evitar:** selección de país previa; mega-menú saturado; catálogo tipo tienda con cientos de SKU; contadores “0+” vacíos; múltiples CTA compitiendo; estética WordPress/PrestaShop genérica.
**Clave:** ningún competidor —ni DJI— usa 3D interactivo. Ese es el terreno donde ganas.

## 9. Requisitos y restricciones
- **Mobile-first**; diseñar móvil y escritorio.
- **Un CTA dominante:** “Cotizar por WhatsApp” (verde WhatsApp), repetido, + botón flotante.
- **Accesibilidad:** contraste AA, foco visible, respeta `prefers-reduced-motion`.
- Español (Chile), sin emojis, tono técnico pero cercano.
- El 3D nunca debe bloquear la carga: diseñar con carga diferida y fallback en mente.

## 10. Placeholders a definir (no inventar; dejar marcados)
Número de **WhatsApp** real · **logo** real (hoy es una mira/retícula genérica) · **correo** · **Instagram** · **fotos reales** del Maule.

## 11. Recursos existentes
- `agrotech-nase-estructura.html` — blueprint (mapa del sitio + wireframe anotado + flujo). **Base de esta estructura.**
- `index.html` — muestra funcional del home con el visor 3D operativo (referencia de que el 3D ya funciona).
- PDF “Estructuras de competencia” — arquitectura de los 7 competidores.
- Paquete Claude Code (`agrotech-handoff.zip`) — módulos 3D probados y contexto técnico, para cuando el diseño pase a implementación.

---

### Prompt de arranque para Claude Design (pegar directo)
> Diseña el sitio de **Agrotech Nase** (agrotechmaule.cl), distribuidor e integrador de drones DJI Agras en la Región del Maule, Chile. Producto estrella: **DJI Agras T100**, con un **visor 3D del T100 en el hero** como diferenciador. Español (Chile), **mobile-first**, estética **sobria/corporativa/técnica**, sin emojis. Paleta: verde profundo `#0E1A14`, verde marca `#1E6B43`/`#2E9159`, teal `#4FB3A4`, ámbar `#E6A532`, WhatsApp `#25D366`, papel `#F4F2EC`. Tipografía: **Archivo Black** (titulares), **IBM Plex Sans** (texto), **IBM Plex Mono** (datos/specs). CTA único: **“Cotizar por WhatsApp”** (repetido + botón flotante). Estructura del home: Header sticky → **Hero con visor 3D del T100** + claim “Precisión aérea para tu campo.” → barra de specs (100 L · 62″ · RTK ±10 cm) → valor Maule (4 beneficios + chips de cultivo) → **Cómo funciona (Mapeo → Prescripción → Aplicación)** → modelos en tabs (T100★, T70P, T50, T25P, Mavic 3M) → servicios (4) → casos/ROI con métricas → credenciales DGAC/SAG → nosotros → contacto (formulario → WhatsApp) → footer. Empieza por el **home en móvil** y el **hero**. Reserva un área cuadrada (~1:0.85) para el canvas 3D con hint “arrástralo para girar” y badge “★ Producto estrella”, y contempla un fallback de imagen. Usa el copy real del brief; deja marcados los placeholders (WhatsApp, logo, fotos).
