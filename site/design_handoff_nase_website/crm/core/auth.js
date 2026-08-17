// ============================================================
// NASE Agrotech CRM · Auth + carga/guardado de datos (Supabase)
// ============================================================

function showLogin() {
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('app-view').style.display = 'none';
}
function showApp() {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-view').style.display = 'block';
    const email = state.user?.email || '';
    document.getElementById('user-email').textContent = vendedorActual() || email;
}

// ── AUTH ──
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { state.user = session.user; showApp(); await loadData(); }
    else showLogin();
}
async function login(email, password) {
    showLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    showLoading(false);
    if (error) { return showAuthError(error.message); }
    state.user = data.user; showApp(); await loadData();
}
async function signup(email, password) {
    showLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    showLoading(false);
    if (error) return showAuthError(error.message);
    const s = document.getElementById('login-success');
    s.textContent = '✓ Cuenta creada. Revisá tu email para confirmar y luego iniciá sesión.';
    s.style.display = 'block';
    document.getElementById('login-error').style.display = 'none';
}
async function resetPassword(email) {
    showLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    showLoading(false);
    if (error) return showAuthError(error.message);
    const s = document.getElementById('login-success');
    s.textContent = '✓ Email de recuperación enviado.'; s.style.display = 'block';
}
async function logout() {
    await supabase.auth.signOut();
    state.user = null; state.leads = []; state.auditLog = [];
    location.reload();
}
function showAuthError(msg) {
    const e = document.getElementById('login-error');
    e.textContent = msg; e.style.display = 'block';
}

// ── CARGA ──
async function loadData() {
    showLoading(true);
    const [{ data: leadsData, error: e1 }, { data: auditData }] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(500),
    ]);
    showLoading(false);
    if (e1) { showToast('Error cargando leads: ' + e1.message); return; }
    state.leads = leadsData || [];
    state.auditLog = auditData || [];
    render();
}
async function refreshAuditLog() {
    const { data } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false }).limit(500);
    state.auditLog = data || [];
}

// Limpia fechas vacías -> null y numéricos -> número, antes de Postgres.
const cleanLeadForSave = (lead) => {
    const dates = ['fecha_primer_contacto', 'fecha_aplicacion', 'fecha_proxima_accion', 'fecha_cotizado', 'fecha_cerrado'];
    const nums = ['usd_estimado', 'probabilidad_pct', 'area_ha'];
    const c = { ...lead };
    dates.forEach(f => { if (c[f] === '' || c[f] === undefined) c[f] = null; });
    nums.forEach(f => { c[f] = (c[f] === '' || c[f] == null) ? 0 : (Number(c[f]) || 0); });
    return c;
};

async function saveLead(lead) {
    showLoading(true);
    const isNew = !lead.id;
    // El modelo se auto-recomienda si quedó vacío.
    if (!lead.modelo_recomendado && lead.area_ha) lead.modelo_recomendado = recomendarModelo(lead.area_ha);
    if (isNew) {
        if (!lead.lead_id) lead.lead_id = generateLeadID();
        if (!lead.vendedor) lead.vendedor = vendedorActual();     // vendedor = creador
        const { id, ...data } = cleanLeadForSave(lead);
        data.created_by = state.user?.id || null;
        data.updated_by = state.user?.id || null;
        const { data: row, error } = await supabase.from('leads').insert(data).select().single();
        showLoading(false);
        if (error) { showToast('Error: ' + error.message); return false; }
        state.leads = [row, ...state.leads];
        showToast(`✓ ${row.lead_id} creado`);
    } else {
        const { id, created_at, created_by, ...data } = cleanLeadForSave(lead);
        data.updated_by = state.user?.id || null;
        const { data: row, error } = await supabase.from('leads').update(data).eq('id', id).select().single();
        showLoading(false);
        if (error) { showToast('Error: ' + error.message); return false; }
        state.leads = state.leads.map(l => l.id === id ? row : l);
        showToast(`✓ ${row.lead_id} actualizado`);
    }
    await refreshAuditLog();
    render();
    return true;
}

async function deleteLead(leadId) {
    const lead = state.leads.find(l => l.lead_id === leadId);
    if (!lead) return;
    if (!confirm(`¿Eliminar ${leadId}?`)) return;
    showLoading(true);
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    showLoading(false);
    if (error) { showToast('Error: ' + error.message); return; }
    state.leads = state.leads.filter(l => l.id !== lead.id);
    await refreshAuditLog();
    showToast(`✓ ${leadId} eliminado`);
    render();
}
