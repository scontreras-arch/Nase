// ============================================================
// NASE Agrotech CRM · MODO DEMO (sin backend, sin login)
// Reemplaza config.js + el SDK de Supabase por un cliente FALSO
// con datos de ejemplo en memoria. Cargar ANTES del core.
// ============================================================
(function () {
    'use strict';
    window.NASE_CONFIG = {
        SUPABASE_URL: 'https://demo.nase.local', SUPABASE_ANON_KEY: 'demo',
        COMPANY_NAME: 'NASE Agrotech', COMPANY_TAGLINE: 'CRM · Drones agrícolas', DEFAULT_CURRENCY: 'USD',
    };
    const DEMO_USER = { id: 'demo-user', email: 'demo@naseagrotech.com', user_metadata: { nombre: 'Demo NASE' } };
    const d = (o) => { const x = new Date(); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + o); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    const iso = (o, h = 10, m = 0) => { const x = new Date(); x.setDate(x.getDate() + o); x.setHours(h, m, 0, 0); return x.toISOString(); };
    const V = { c: 'Carlos Rivas', a: 'Ana Torres', m: 'Miguel Sandoval' };

    const LEADS = [
        { id: 'l1', lead_id: 'LEAD-001', estado: 'Negociando', clasificacion: 'Agrícola', tipo_cultivo: 'Maíz', area_ha: 140, fecha_aplicacion: d(20), modelo_recomendado: 'DJI Agras T100', razon_social: 'Agrícola Santa Rita', contacto_principal: 'Roberto Núñez', cargo: 'Gerente de Campo', email: 'rnunez@santarita.com', telefono: '+56 9 8123 4567', ciudad_pais: 'Chillán, Chile', lead_source: 'Referido', usd_estimado: 68000, moneda: 'USD', probabilidad_pct: 75, cotizacion_competencia: 'Sí', competencia_detalle: 'Hylio AG-230 ~ USD 62k', proxima_accion: 'Cerrar condiciones y firma', fecha_proxima_accion: d(0), ultima_actividad: 'Demo en campo realizada', vendedor: V.c, notas: 'Comparó contra Hylio. Valoran soporte y repuestos locales.', created_at: iso(-30) },
        { id: 'l2', lead_id: 'LEAD-002', estado: 'Cotizado', clasificacion: 'Agrícola', tipo_cultivo: 'Aguacate/Palta', area_ha: 65, fecha_aplicacion: d(35), modelo_recomendado: 'DJI Agras T55', razon_social: 'Frutícola El Palto', contacto_principal: 'María José Fuentes', cargo: 'Jefa de Producción', email: 'mj@elpalto.cl', telefono: '+56 9 7654 3210', ciudad_pais: 'Quillota, Chile', lead_source: 'Web', usd_estimado: 42000, moneda: 'USD', probabilidad_pct: 50, cotizacion_competencia: 'No', proxima_accion: 'Llamar por feedback de cotización', fecha_proxima_accion: d(2), ultima_actividad: 'Cotización enviada', vendedor: V.a, notas: 'Terreno con pendiente; validar autonomía.', created_at: iso(-18) },
        { id: 'l3', lead_id: 'LEAD-003', estado: 'Calificado', clasificacion: 'Agrícola', tipo_cultivo: 'Arroz', area_ha: 320, fecha_aplicacion: d(45), modelo_recomendado: 'DJI Agras T100', razon_social: 'Cooperativa Arrocera del Norte', contacto_principal: 'Luis Hernández', cargo: 'Director', email: 'lhernandez@arrocera.pe', telefono: '+51 987 654 321', ciudad_pais: 'Lambayeque, Perú', lead_source: 'Evento/Feria', usd_estimado: 95000, moneda: 'USD', probabilidad_pct: 25, cotizacion_competencia: 'No', proxima_accion: 'Reagendar visita técnica (se canceló)', fecha_proxima_accion: d(-3), ultima_actividad: 'Contacto en feria agrícola', vendedor: V.m, notas: 'Gran superficie. Interés en flota de 2 equipos.', created_at: iso(-14) },
        { id: 'l4', lead_id: 'LEAD-004', estado: 'Lead', clasificacion: 'Agrícola', tipo_cultivo: 'Vid/Viñedo', area_ha: 45, fecha_aplicacion: d(60), modelo_recomendado: 'DJI Agras T55', razon_social: 'Viñedos Alto Valle', contacto_principal: 'Ignacio Vergara', cargo: 'Ing. Agrónomo', email: 'ivergara@altovalle.cl', telefono: '+56 9 5544 3322', ciudad_pais: 'San Fernando, Chile', lead_source: 'Redes sociales', usd_estimado: 38000, moneda: 'USD', probabilidad_pct: 10, cotizacion_competencia: 'No', proxima_accion: 'Enviar caso de éxito en viñedos', fecha_proxima_accion: d(5), ultima_actividad: 'Consulta por Instagram', vendedor: V.a, notas: 'Exploratorio. Aplicación foliar de precisión.', created_at: iso(-6) },
        { id: 'l5', lead_id: 'LEAD-005', estado: 'Negociando', clasificacion: 'Agrícola', tipo_cultivo: 'Caña de azúcar', area_ha: 500, fecha_aplicacion: d(25), modelo_recomendado: 'DJI Agras T100', razon_social: 'AgroIndustrial del Sur', contacto_principal: 'Felipe Cárcamo', cargo: 'Gerente General', email: 'fcarcamo@agrosur.com', telefono: '+56 9 6677 8899', ciudad_pais: 'Los Ríos, Chile', lead_source: 'Referido', usd_estimado: 180000, moneda: 'USD', probabilidad_pct: 75, cotizacion_competencia: 'Sí', competencia_detalle: 'XAG P100 Pro', proxima_accion: 'Negociar descuento por flota (3 equipos)', fecha_proxima_accion: d(1), ultima_actividad: 'Reunión con directorio', vendedor: V.c, notas: 'Proyecto grande, flota. Comparan XAG.', created_at: iso(-33) },
        { id: 'l6', lead_id: 'LEAD-006', estado: 'Cotizado', clasificacion: 'Industrial', tipo_cultivo: '', area_ha: 0, fecha_aplicacion: '', modelo_recomendado: 'DJI Agras T55', razon_social: 'Servicios Aéreos Mineros', contacto_principal: 'Pablo Riquelme', cargo: 'Jefe de Operaciones', email: 'priquelme@sam.cl', telefono: '+56 55 2211 9988', ciudad_pais: 'Antofagasta, Chile', lead_source: 'Frío', usd_estimado: 55000, moneda: 'USD', probabilidad_pct: 50, cotizacion_competencia: 'No', proxima_accion: 'Demo de supresión de polvo en faena', fecha_proxima_accion: d(0), ultima_actividad: 'Cotización enviada', vendedor: V.m, notas: 'Uso industrial: supresión de polvo / aspersión.', created_at: iso(-20) },
        { id: 'l7', lead_id: 'LEAD-007', estado: 'Ganado', clasificacion: 'Agrícola', tipo_cultivo: 'Banano', area_ha: 210, fecha_aplicacion: d(-5), modelo_recomendado: 'DJI Agras T100', razon_social: 'Bananera Caribe', contacto_principal: 'Sofía Castro', cargo: 'Gerente Técnico', email: 'scastro@bananeracaribe.ec', telefono: '+593 99 123 4567', ciudad_pais: 'Guayaquil, Ecuador', lead_source: 'Referido', usd_estimado: 92000, moneda: 'USD', probabilidad_pct: 100, cotizacion_competencia: 'Sí', competencia_detalle: 'DJI directo (importador)', proxima_accion: 'Coordinar entrega y capacitación', fecha_proxima_accion: d(4), ultima_actividad: 'OC firmada', vendedor: V.c, notas: 'Adjudicado. Incluye capacitación de pilotos.', fecha_cerrado: d(-6), created_at: iso(-60) },
        { id: 'l8', lead_id: 'LEAD-008', estado: 'Perdido', clasificacion: 'Agrícola', tipo_cultivo: 'Hortalizas', area_ha: 25, fecha_aplicacion: '', modelo_recomendado: 'DJI Agras T55', razon_social: 'Hortalizas Fresh', contacto_principal: 'Verónica Lagos', cargo: 'Dueña', email: 'vlagos@fresh.cl', telefono: '+56 63 2456 7788', ciudad_pais: 'Valdivia, Chile', lead_source: 'Web', usd_estimado: 24000, moneda: 'USD', probabilidad_pct: 0, cotizacion_competencia: 'Sí', competencia_detalle: 'Integrador local más barato', causa_perdida: 'Precio alto', proxima_accion: '', ultima_actividad: 'Comunicó decisión', vendedor: V.a, notas: 'Se fue por precio.', fecha_cerrado: d(-8), created_at: iso(-50) },
        { id: 'l9', lead_id: 'LEAD-009', estado: 'Calificado', clasificacion: 'Agrícola', tipo_cultivo: 'Café', area_ha: 90, fecha_aplicacion: d(40), modelo_recomendado: 'DJI Agras T100', razon_social: 'Cafetalera Las Nubes', contacto_principal: 'Andrés Möller', cargo: 'Administrador', email: 'amoller@lasnubes.co', telefono: '+57 310 555 1212', ciudad_pais: 'Huila, Colombia', lead_source: 'Evento/Feria', usd_estimado: 61000, moneda: 'USD', probabilidad_pct: 25, cotizacion_competencia: 'No', proxima_accion: 'Enviar propuesta técnica (terreno montañoso)', fecha_proxima_accion: d(3), ultima_actividad: 'Call de descubrimiento', vendedor: V.m, notas: 'Terreno con pendientes fuertes; evaluar RTK.', created_at: iso(-12) },
        { id: 'l10', lead_id: 'LEAD-010', estado: 'Pausado', clasificacion: 'Agrícola', tipo_cultivo: 'Trigo', area_ha: 160, fecha_aplicacion: '', modelo_recomendado: 'DJI Agras T100', razon_social: 'Agrícola Los Robles', contacto_principal: 'Carolina Pérez', cargo: 'Jefa de Campo', email: 'cperez@losrobles.ar', telefono: '+54 9 351 555 7788', ciudad_pais: 'Córdoba, Argentina', lead_source: 'Frío', usd_estimado: 70000, moneda: 'USD', probabilidad_pct: 15, cotizacion_competencia: 'No', proxima_accion: 'Retomar en próxima campaña', ultima_actividad: 'Presupuesto postergado', vendedor: V.c, notas: 'Pausado por estacionalidad.', created_at: iso(-40) },
    ];

    const AUDIT = [
        { id: 1, lead_id: 'l1', user_email: V.c, timestamp: iso(0, 9, 10), accion: 'UPDATE', campo: 'estado', valor_anterior: 'Cotizado', valor_nuevo: 'Negociando' },
        { id: 2, lead_id: 'l1', user_email: V.c, timestamp: iso(0, 9, 11), accion: 'UPDATE', campo: 'probabilidad_pct', valor_anterior: '50', valor_nuevo: '75' },
        { id: 3, lead_id: 'l7', user_email: V.c, timestamp: iso(-1, 15, 0), accion: 'UPDATE', campo: 'estado', valor_anterior: 'Negociando', valor_nuevo: 'Ganado' },
        { id: 4, lead_id: 'l3', user_email: V.m, timestamp: iso(-2, 11, 30), accion: 'INSERT', campo: 'lead_creado', valor_nuevo: 'LEAD-003' },
        { id: 5, lead_id: 'l5', user_email: V.c, timestamp: iso(-2, 16, 20), accion: 'UPDATE', campo: 'usd_estimado', valor_anterior: '150000', valor_nuevo: '180000' },
        { id: 6, lead_id: 'l8', user_email: V.a, timestamp: iso(-8, 12, 0), accion: 'UPDATE', campo: 'estado', valor_anterior: 'Cotizado', valor_nuevo: 'Perdido' },
    ];

    // ── Leads generados desde el sitio web (formulario de contacto) ──
    // El sitio guarda leads en localStorage['nase_web_leads']; acá se cargan
    // al inicio del pipeline para que el equipo los vea al abrir el CRM.
    try {
        const web = JSON.parse(localStorage.getItem('nase_web_leads') || '[]');
        web.slice().reverse().forEach(l => { if (l && l.id && !LEADS.find(x => x.id === l.id)) LEADS.unshift(l); });
    } catch (e) { /* datos web corruptos: se ignoran */ }

    const DATA = { leads: LEADS, audit_log: AUDIT };
    let seq = 1000; const nid = () => 'demo-' + (++seq) + '-' + Math.random().toString(36).slice(2, 6);
    function builder(table) {
        const store = DATA[table] || (DATA[table] = []); const f = {}; let mode = 'select', single = false, payload = null;
        const res = () => {
            if (mode === 'insert' || mode === 'upsert') { const rows = (Array.isArray(payload) ? payload : [payload]).map(r => ({ id: r.id || nid(), created_at: r.created_at || new Date().toISOString(), ...r })); rows.forEach(r => { if (!store.find(s => s.id === r.id)) store.push(r); }); return { data: single ? rows[0] : rows, error: null }; }
            if (mode === 'update') { const merged = { id: f.id, ...payload }; const i = store.findIndex(s => s.id === f.id); if (i >= 0) { store[i] = { ...store[i], ...payload }; merged.created_at = store[i].created_at; } return { data: single ? merged : [merged], error: null }; }
            if (mode === 'delete') { if (f.id != null) { const i = store.findIndex(s => s.id === f.id); if (i >= 0) store.splice(i, 1); } return { data: single ? null : [], error: null }; }
            let rows = store.slice(); Object.keys(f).forEach(c => rows = rows.filter(r => r[c] === f[c])); return { data: single ? (rows[0] || null) : rows, error: null };
        };
        const b = { select: () => b, insert: r => (mode = 'insert', payload = r, b), update: r => (mode = 'update', payload = r, b), upsert: r => (mode = 'upsert', payload = r, b), delete: () => (mode = 'delete', b), single: () => (single = true, b), maybeSingle: () => (single = true, b), eq: (c, v) => (f[c] = v, b), order: () => b, limit: () => b, then: (ok, err) => Promise.resolve(res()).then(ok, err), catch: e => Promise.resolve(res()).catch(e) };
        return b;
    }
    window.supabase = { createClient: () => ({
        auth: {
            getSession: async () => ({ data: { session: { user: DEMO_USER } }, error: null }),
            signInWithPassword: async () => ({ data: { user: DEMO_USER }, error: null }),
            signUp: async () => ({ data: { user: DEMO_USER }, error: null }),
            resetPasswordForEmail: async () => ({ data: {}, error: null }),
            signOut: async () => ({ error: null }),
        },
        from: (t) => builder(t),
    }) };
    window.__NASE_DEMO__ = true;
})();
