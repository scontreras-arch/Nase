// ============================================================
// NASE Agrotech CRM · Constantes, modelo de datos y estado
// Venta de drones agrícolas (DJI Agras) — pipeline comercial
// ============================================================

// ── INIT SUPABASE ──
const cfg = window.NASE_CONFIG;
if (!cfg || !cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('XXX')) {
    document.body.innerHTML = '<div style="padding:2rem;color:#fca5a5;font-family:monospace;background:#09090b;min-height:100vh;"><h2>Error de configuración</h2><p>Creá el archivo <code>config.js</code> con tus claves de Supabase (ver <code>config.example.js</code>).</p></div>';
    throw new Error('Config missing');
}
const supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

// ── CONSTANTES DE DOMINIO ──
const ESTADOS = ['Lead', 'Calificado', 'Cotizado', 'Negociando', 'Ganado', 'Perdido', 'Pausado'];
const CLASIFICACIONES = ['Agrícola', 'Industrial'];
const FUENTES = ['Web', 'Referido', 'Frío', 'Evento/Feria', 'Redes sociales', 'WhatsApp', 'Otro'];
const MONEDAS = ['USD', 'CLP', 'MXN', 'COP', 'PEN', 'EUR'];
const CAUSAS_PERDIDA = ['Precio alto', 'Eligió competencia', 'Proyecto postergado', 'No calificó (presupuesto)', 'Sin respuesta', 'Regulación/permisos', 'Otro'];

// Cultivos típicos para aplicación con dron (LatAm). Editable.
const CULTIVOS = [
    'Maíz', 'Trigo', 'Arroz', 'Soya', 'Caña de azúcar', 'Papa', 'Café', 'Banano',
    'Palma aceitera', 'Aguacate/Palta', 'Cítricos', 'Vid/Viñedo', 'Arándano', 'Cerezo',
    'Hortalizas', 'Pastura/Forraje', 'Algodón', 'Otro'
];

// Catálogo de modelos DJI Agras que comercializa NASE. Editable.
const MODELOS_DRON = ['DJI Agras T25P', 'DJI Agras T55', 'DJI Agras T70P', 'DJI Agras T100', 'Otro / a definir'];

// Reglas de recomendación por área (ha). Modificables: el vendedor puede
// override el modelo en el formulario. Umbrales pensados para rendimiento
// razonable por jornada de aplicación.
const REGLAS_MODELO = [
    { maxHa: 30, modelo: 'DJI Agras T25P' },
    { maxHa: 80, modelo: 'DJI Agras T55' },
    { maxHa: 200, modelo: 'DJI Agras T70P' },
    { maxHa: Infinity, modelo: 'DJI Agras T100' },
];

// Devuelve el modelo sugerido según el área. Se usa como default (editable).
function recomendarModelo(areaHa) {
    const ha = Number(areaHa) || 0;
    if (ha <= 0) return '';
    const regla = REGLAS_MODELO.find(r => ha <= r.maxHa);
    return regla ? regla.modelo : 'DJI Agras T100';
}

const PROBABILIDAD_DEFAULT = { 'Lead': 10, 'Calificado': 25, 'Cotizado': 50, 'Negociando': 75, 'Ganado': 100, 'Perdido': 0, 'Pausado': 15 };

// ── HELPERS DE FECHA (hora LOCAL, no UTC) ──
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dateToLocalISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isOverdue = (d) => d && d < today();
const isToday = (d) => d === today();
const getWeekDays = () => {
    const days = []; const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(d.getDate() + i); days.push(dateToLocalISO(d)); }
    return days;
};
const dayName = (s) => { const [y, m, d] = s.split('-').map(Number); return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(y, m - 1, d).getDay()]; };
const dayShort = (s) => { const [y, m, d] = s.split('-').map(Number); const dt = new Date(y, m - 1, d); return `${dt.getDate()} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][dt.getMonth()]}`; };

// ── HELPERS DE FORMATO ──
const fmtMoney = (n, cur) => (!n && n !== 0) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: 0 }).format(n);
const fmtUSD = (n) => fmtMoney(n, 'USD');
const fmtHa = (n) => (!n && n !== 0) ? '—' : `${new Intl.NumberFormat('es-CL').format(Number(n) || 0)} ha`;
const escapeHTML = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ── AUDITORÍA ──
const CAMPOS_LABEL = {
    estado: 'Estado', clasificacion: 'Clasificación', tipo_cultivo: 'Cultivo', area_ha: 'Área (ha)',
    fecha_aplicacion: 'Fecha aplicación', modelo_recomendado: 'Modelo', usd_estimado: 'USD estimado',
    probabilidad_pct: 'Probabilidad', cotizacion_competencia: 'Cotiz. competencia', vendedor: 'Vendedor',
    proxima_accion: 'Próxima acción', fecha_proxima_accion: 'Fecha próxima', razon_social: 'Empresa',
    contacto_principal: 'Contacto', causa_perdida: 'Causa pérdida', lead_creado: 'Lead creado',
};
const formatAuditValue = (campo, v) => {
    if (v == null || v === '') return '(vacío)';
    if (campo === 'usd_estimado') return fmtUSD(parseFloat(v) || 0);
    if (campo === 'area_ha') return fmtHa(v);
    if (campo === 'probabilidad_pct') return v + '%';
    return String(v).length > 60 ? String(v).slice(0, 60) + '…' : v;
};
const formatAuditTimestamp = (ts) => {
    const d = new Date(ts); const p = n => String(n).padStart(2, '0');
    return `${d.getDate()}-${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ── ESTADO GLOBAL ──
const state = {
    user: null,
    leads: [],
    auditLog: [],
    view: 'dashboard',
    filterEstado: 'all',
    filterClasificacion: 'all',
    filterCultivo: 'all',
    filterVendedor: 'all',
    search: '',
};

// ── LEAD helpers ──
const generateLeadID = () => {
    let max = 0;
    state.leads.forEach(l => { const m = l.lead_id?.match(/^LEAD-(\d+)$/); if (m) max = Math.max(max, parseInt(m[1])); });
    return `LEAD-${String(max + 1).padStart(3, '0')}`;
};

const emptyLead = () => ({
    lead_id: '', estado: 'Lead', lead_source: '', fecha_primer_contacto: today(),
    clasificacion: 'Agrícola', tipo_cultivo: '', area_ha: 0, fecha_aplicacion: '',
    modelo_recomendado: '',
    razon_social: '', contacto_principal: '', cargo: '', email: '', telefono: '', whatsapp: '',
    ciudad_pais: '',
    usd_estimado: 0, moneda: 'USD', probabilidad_pct: 10,
    cotizacion_competencia: 'No', competencia_detalle: '',
    proxima_accion: '', fecha_proxima_accion: '', ultima_actividad: '',
    vendedor: '', notas: '', causa_perdida: '',
    fecha_cotizado: '', fecha_cerrado: '',
});

// Vendedor por defecto = quien crea el lead (nombre o email del usuario logueado).
const vendedorActual = () => (state.user?.user_metadata?.nombre || state.user?.email || '').trim();

// Lista de vendedores presentes en los leads (para el filtro del pipeline).
const listaVendedores = () => [...new Set(state.leads.map(l => l.vendedor).filter(Boolean))].sort();

// Un lead necesita "conseguir cotización de la competencia" como hito.
const faltaCotizCompetencia = (l) => (l.cotizacion_competencia || 'No') === 'No' && !['Ganado', 'Perdido'].includes(l.estado);

const parseFlexibleJSON = (raw) => {
    if (!raw || typeof raw !== 'string') throw new Error('JSON vacío');
    let s = raw.trim().replace(/^﻿/, '').replace(/[​-‍]/g, '');
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    if (!s.includes('"') && s.includes("'")) s = s.replace(/'/g, '"');
    s = s.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(s);
};

// ── UI helpers ──
const showToast = (msg) => {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 2500);
};
const showLoading = (show) => { document.getElementById('loading').style.display = show ? 'flex' : 'none'; };
