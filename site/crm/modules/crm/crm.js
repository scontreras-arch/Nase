// ============================================================
// NASE Agrotech CRM · Vistas (dashboard, pipeline, agenda, auditoría)
// + formulario de lead con recomendación de modelo DJI Agras
// ============================================================

function render() {
    renderFilters();
    renderKPIs();
    renderTable();
    renderKanban();
    renderAgenda();
    renderAuditoria();
}

// ── Filtrado / orden ──
function getFilteredLeads() {
    let r = state.leads;
    if (state.filterEstado !== 'all') r = r.filter(l => l.estado === state.filterEstado);
    if (state.filterClasificacion !== 'all') r = r.filter(l => l.clasificacion === state.filterClasificacion);
    if (state.filterCultivo !== 'all') r = r.filter(l => (l.tipo_cultivo || '') === state.filterCultivo);
    if (state.filterVendedor !== 'all') r = r.filter(l => (l.vendedor || '') === state.filterVendedor);
    if (state.search) {
        const s = state.search.toLowerCase();
        r = r.filter(l =>
            l.razon_social?.toLowerCase().includes(s) ||
            l.contacto_principal?.toLowerCase().includes(s) ||
            l.lead_id?.toLowerCase().includes(s) ||
            l.tipo_cultivo?.toLowerCase().includes(s) ||
            l.vendedor?.toLowerCase().includes(s));
    }
    return r;
}
function getSortedLeads() {
    return [...getFilteredLeads()].sort((a, b) => {
        const aC = a.estado === 'Ganado' || a.estado === 'Perdido';
        const bC = b.estado === 'Ganado' || b.estado === 'Perdido';
        if (aC && !bC) return 1;
        if (!aC && bC) return -1;
        return (b.usd_estimado || 0) * (b.probabilidad_pct || 0) - (a.usd_estimado || 0) * (a.probabilidad_pct || 0);
    });
}

// ── Filtros (poblar selects) ──
function renderFilters() {
    const fE = document.getElementById('filter-estado');
    const fC = document.getElementById('filter-clasificacion');
    const fCu = document.getElementById('filter-cultivo');
    const fV = document.getElementById('filter-vendedor');
    if (fE && fE.children.length === 1) ESTADOS.forEach(e => fE.insertAdjacentHTML('beforeend', `<option value="${e}">${e}</option>`));
    if (fC && fC.children.length === 1) CLASIFICACIONES.forEach(c => fC.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
    if (fCu && fCu.children.length === 1) CULTIVOS.forEach(c => fCu.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));
    // Vendedor se repuebla siempre (cambia con los datos)
    if (fV) {
        const cur = state.filterVendedor;
        fV.innerHTML = '<option value="all">Todos los vendedores</option>' +
            listaVendedores().map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
        fV.value = listaVendedores().includes(cur) ? cur : 'all';
    }
}

// ── KPIs ──
function renderKPIs() {
    const ls = state.leads;
    const ganados = ls.filter(l => l.estado === 'Ganado');
    const perdidos = ls.filter(l => l.estado === 'Perdido');
    const cot = ls.filter(l => ['Cotizado', 'Negociando'].includes(l.estado));
    const pUSD = cot.reduce((s, l) => s + (l.usd_estimado || 0), 0);
    const pPond = cot.reduce((s, l) => s + (l.usd_estimado || 0) * (l.probabilidad_pct || 0) / 100, 0);
    const winRate = (ganados.length + perdidos.length) ? ganados.length / (ganados.length + perdidos.length) : 0;
    const activos = ls.filter(l => !['Ganado', 'Perdido'].includes(l.estado));
    const accVenc = activos.filter(l => l.fecha_proxima_accion && l.fecha_proxima_accion < today()).length;
    const accHoy = activos.filter(l => l.fecha_proxima_accion === today()).length;
    const faltaComp = ls.filter(faltaCotizCompetencia).length;

    const kpis = [
        { label: 'Pipeline activo', value: fmtUSD(pUSD), sub: `${cot.length} cotizados/negoc.`, accent: 'cyan' },
        { label: 'Pipeline ponderado', value: fmtUSD(pPond), sub: 'USD × probabilidad', accent: 'emerald' },
        { label: 'Win rate', value: `${(winRate * 100).toFixed(0)}%`, sub: `${ganados.length} ganados / ${perdidos.length} perdidos`, accent: 'amber' },
        { label: 'Acciones hoy', value: accHoy + accVenc, sub: accVenc > 0 ? `⚠ ${accVenc} vencidas` : 'al día', accent: accVenc > 0 ? 'red' : 'cyan' },
        { label: 'Falta cotiz. competencia', value: faltaComp, sub: 'hito por conseguir', accent: faltaComp > 0 ? 'amber' : 'emerald' },
    ];
    document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
        <div class="kpi-card kpi-${k.accent}">
            <div class="kpi-header"><span class="kpi-label">${k.label}</span></div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-sublabel">${k.sub}</div>
        </div>`).join('');

    const badge = document.getElementById('badge-agenda');
    if (badge) { const t = accHoy + accVenc; badge.style.display = t > 0 ? 'inline-block' : 'none'; badge.textContent = t; }
}

// ── Tabla (dashboard) ──
function renderTable() {
    const sorted = getSortedLeads();
    const top5 = sorted.slice(0, 5).map(l => l.lead_id);
    document.getElementById('leads-count').textContent = `${sorted.length} de ${state.leads.length} leads`;
    const container = document.getElementById('leads-table');
    if (!sorted.length) {
        container.innerHTML = `<div class="empty-state"><p>Sin leads</p><p class="hint">Creá uno con “+ Nuevo” o pegá un JSON.</p><button class="btn-primary" onclick="window.openLeadForm(null)">+ Crear primer lead</button></div>`;
        return;
    }
    const rows = sorted.map(l => {
        const pond = (l.usd_estimado || 0) * (l.probabilidad_pct || 0) / 100;
        const over = isOverdue(l.fecha_proxima_accion), tod = isToday(l.fecha_proxima_accion);
        const prio = top5.includes(l.lead_id);
        const cultivo = l.clasificacion === 'Agrícola' ? (l.tipo_cultivo || '—') : 'Industrial';
        return `
        <tr class="lead-row" data-id="${l.id}">
            <td class="lead-id-cell">${prio ? '<span class="priority-star">★</span>' : ''}${escapeHTML(l.lead_id)}</td>
            <td><span class="estado-pill estado-${l.estado}">${l.estado}</span>${faltaCotizCompetencia(l) ? '<div style="margin-top:.25rem;font-size:10px;color:#f59e0b;font-family:var(--font-display)">⚠ falta cotiz. competencia</div>' : ''}</td>
            <td><div class="empresa-name">${escapeHTML(l.razon_social || '—')}</div><div class="empresa-contact">${escapeHTML(l.contacto_principal || '')}${l.ciudad_pais ? ' · ' + escapeHTML(l.ciudad_pais) : ''}</div></td>
            <td><div style="font-size:.8125rem">${escapeHTML(cultivo)}</div><div style="font-size:.6875rem;color:var(--text-dim)">${escapeHTML(l.clasificacion || '')}</div></td>
            <td><div style="font-size:.8125rem">${fmtHa(l.area_ha)}</div><div style="font-size:.6875rem;color:var(--cyan-hover)">${escapeHTML(l.modelo_recomendado || '—')}</div></td>
            <td class="right"><div class="usd-main">${fmtMoney(l.usd_estimado, l.moneda)}</div><div class="usd-sub">${l.probabilidad_pct || 0}% · ${fmtUSD(pond)}</div></td>
            <td><div class="${over ? 'fecha-overdue' : tod ? 'fecha-today' : ''}" style="font-size:.75rem">${l.fecha_proxima_accion ? `${over ? '⚠ ' : ''}${tod ? '⏰ ' : ''}${l.fecha_proxima_accion}` : '<span style="color:var(--text-dim)">sin fecha</span>'}</div><div class="proxima-accion" title="${escapeHTML(l.proxima_accion || '')}">${escapeHTML(l.proxima_accion || '—')}</div><div style="font-size:10px;color:var(--text-dim)">👤 ${escapeHTML(l.vendedor || '—')}</div></td>
            <td><div class="action-btns">
                <button class="icon-btn" onclick="window.openEditLead('${l.id}')" title="Editar">✎</button>
                <button class="icon-btn danger" onclick="window.deleteLeadById('${escapeHTML(l.lead_id)}')" title="Eliminar">🗑</button>
            </div></td>
        </tr>`;
    }).join('');
    container.innerHTML = `<div class="table-scroll"><table>
        <thead><tr><th>Lead</th><th>Estado</th><th>Empresa / Zona</th><th>Clasif. / Cultivo</th><th>Área · Modelo</th><th class="right">Valor · Prob.</th><th>Próxima acción · Vendedor</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
}

// ── Pipeline (kanban) ──
function renderKanban() {
    const filtered = getFilteredLeads();
    const groups = {}; ESTADOS.forEach(e => groups[e] = []);
    filtered.forEach(l => groups[l.estado]?.push(l));
    document.getElementById('kanban-board').innerHTML = ESTADOS.map(estado => {
        const leads = groups[estado];
        const totalUSD = leads.reduce((s, l) => s + (l.usd_estimado || 0), 0);
        const cards = leads.map(l => {
            const cultivo = l.clasificacion === 'Agrícola' ? (l.tipo_cultivo || 'Agrícola') : 'Industrial';
            return `
            <div class="kanban-card" onclick="window.openEditLead('${l.id}')">
                <div class="kanban-card-id">${escapeHTML(l.lead_id)} · 👤 ${escapeHTML(l.vendedor || '—')}</div>
                <div class="kanban-card-title">${escapeHTML(l.razon_social || '—')}</div>
                <div class="kanban-card-meta">${escapeHTML(cultivo)}${l.area_ha ? ' · ' + fmtHa(l.area_ha) : ''}</div>
                <div class="kanban-card-meta" style="color:var(--cyan-hover)">${escapeHTML(l.modelo_recomendado || '')}</div>
                <div class="kanban-card-footer"><span style="font-weight:600">${fmtMoney(l.usd_estimado, l.moneda)}</span><span style="color:var(--cyan-hover)">${l.probabilidad_pct || 0}%</span></div>
                ${faltaCotizCompetencia(l) ? '<div style="font-size:10px;margin-top:.25rem;color:#f59e0b;font-family:var(--font-display)">⚠ conseguir cotiz. competencia</div>' : ''}
                ${l.fecha_proxima_accion ? `<div style="font-size:10px;margin-top:.25rem;font-family:var(--font-display);color:${isOverdue(l.fecha_proxima_accion) ? '#fca5a5' : isToday(l.fecha_proxima_accion) ? '#fcd34d' : 'var(--text-dim)'}">${isOverdue(l.fecha_proxima_accion) ? '⚠ ' : ''}${l.fecha_proxima_accion}</div>` : ''}
            </div>`;
        }).join('');
        return `<div class="kanban-col" data-estado="${estado}">
            <div class="kanban-col-header"><div class="kanban-col-title"><span>${estado}</span><span class="kanban-col-count">${leads.length}</span></div><div class="kanban-col-usd">${fmtUSD(totalUSD)}</div></div>
            <div class="kanban-col-body">${cards}</div></div>`;
    }).join('');
}

// ── Agenda (próximas acciones + hito de competencia) ──
function renderAgenda() {
    const cont = document.getElementById('view-agenda');
    if (!cont) return;
    const activos = state.leads.filter(l => !['Ganado', 'Perdido'].includes(l.estado));
    const conAccion = activos.filter(l => l.fecha_proxima_accion)
        .sort((a, b) => (a.fecha_proxima_accion || '').localeCompare(b.fecha_proxima_accion || ''));
    const faltaComp = activos.filter(faltaCotizCompetencia);

    const card = (l, extra) => {
        const over = isOverdue(l.fecha_proxima_accion), tod = isToday(l.fecha_proxima_accion);
        const dias = over ? Math.floor((Date.now() - new Date(l.fecha_proxima_accion).getTime()) / 86400000) : 0;
        return `<div class="hoy-card ${over ? 'overdue' : ''}" onclick="window.openEditLead('${l.id}')">
            <div style="display:flex;justify-content:space-between;gap:1rem">
                <div style="flex:1">
                    <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin-bottom:.25rem">
                        <span style="font-family:var(--font-display);font-size:11px;color:var(--text-dim)">${escapeHTML(l.lead_id)}</span>
                        <span class="estado-pill estado-${l.estado}">${l.estado}</span>
                        ${over ? `<span style="font-size:11px;color:#fca5a5;font-weight:700">⚠ VENCIDO ${dias}d</span>` : tod ? '<span style="font-size:11px;color:#fcd34d;font-weight:700">⏰ HOY</span>' : ''}
                    </div>
                    <div style="font-weight:600">${escapeHTML(l.razon_social || '—')}</div>
                    <div style="font-size:.875rem;color:var(--text-muted)">→ ${escapeHTML(extra || l.proxima_accion || '')}</div>
                    <div style="font-size:.75rem;color:var(--text-dim)">👤 ${escapeHTML(l.vendedor || '—')}${l.telefono ? ' · ' + escapeHTML(l.telefono) : ''}</div>
                </div>
                <div style="text-align:right"><div style="font-family:var(--font-display);font-weight:700">${fmtMoney(l.usd_estimado, l.moneda)}</div><div style="font-family:var(--font-display);font-size:.75rem;color:var(--cyan-hover)">${l.probabilidad_pct || 0}%</div>${l.fecha_proxima_accion ? `<div style="font-size:11px;color:var(--text-dim);margin-top:.25rem">${l.fecha_proxima_accion}</div>` : ''}</div>
            </div></div>`;
    };

    let html = `<div class="container container-narrow"><h2 class="view-title">Agenda</h2><p class="view-subtitle">${conAccion.length} próximas acciones · ${faltaComp.length} sin cotización de competencia</p>`;
    if (faltaComp.length) {
        html += `<div style="border:1px solid var(--amber);background:var(--amber-bg);border-radius:6px;padding:1rem;margin:1rem 0">
            <div style="font-weight:700;color:var(--amber);margin-bottom:.5rem">⚠ Hito: conseguir cotización de la competencia (${faltaComp.length})</div>
            ${faltaComp.map(l => card(l, 'Conseguir/registrar la cotización de la competencia')).join('')}</div>`;
    }
    html += conAccion.length ? conAccion.map(l => card(l)).join('') : `<div class="hoy-empty"><p>Sin acciones agendadas</p><p class="hint">Cargá una próxima acción en cada lead activo.</p></div>`;
    html += `</div>`;
    cont.innerHTML = html;
}

// ── Auditoría ──
function renderAuditoria() {
    const cont = document.getElementById('view-auditoria');
    if (!cont) return;
    const logs = [...state.auditLog].slice(0, 200);
    let html = `<div class="container"><h2 class="view-title">Auditoría</h2><p class="view-subtitle">${state.auditLog.length} cambios registrados</p>`;
    if (!logs.length) { cont.innerHTML = html + `<div class="empty-state"><p>Sin cambios aún</p></div></div>`; return; }
    html += `<div style="border:1px solid var(--border);border-radius:6px;overflow:hidden;background:var(--bg-card)">`;
    logs.forEach((log, i) => {
        const lead = state.leads.find(l => l.id === log.lead_id);
        const empresa = lead?.razon_social || lead?.lead_id || '(lead eliminado)';
        const campo = CAMPOS_LABEL[log.campo] || log.campo;
        const desc = log.accion === 'INSERT' ? '<span style="color:#6ee7b7;font-weight:600">Lead creado</span>'
            : log.accion === 'DELETE' ? '<span style="color:#fca5a5;font-weight:600">Lead eliminado</span>'
            : `<span style="color:var(--cyan-hover)">${escapeHTML(campo)}</span>: <span style="color:var(--text-dim)">${escapeHTML(formatAuditValue(log.campo, log.valor_anterior))}</span> → <span style="color:var(--text)">${escapeHTML(formatAuditValue(log.campo, log.valor_nuevo))}</span>`;
        html += `<div style="padding:.75rem 1rem;border-bottom:${i < logs.length - 1 ? '1px solid var(--border)' : 'none'};display:flex;gap:.875rem">
            <div style="flex:1"><div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.125rem"><span style="font-family:var(--font-display);font-size:10px;color:var(--text-dim)">${formatAuditTimestamp(log.timestamp)}</span><span style="font-size:.75rem;color:var(--text-muted)">${escapeHTML(log.user_email || 'sistema')}</span></div>
            <div style="font-size:.875rem"><span style="font-weight:500">${escapeHTML(empresa)}</span> <span style="color:var(--text-dim)">·</span> ${desc}</div></div></div>`;
    });
    cont.innerHTML = html + `</div></div>`;
}

// ============================================================
// FORMULARIO DE LEAD (crear/editar)
// ============================================================
function openLeadForm(id) {
    const lead = id ? { ...state.leads.find(l => l.id === id) } : emptyLead();
    if (!lead) return;
    const opts = (arr, val) => arr.map(o => `<option value="${escapeHTML(o)}" ${o === val ? 'selected' : ''}>${escapeHTML(o)}</option>`).join('');
    const recomendado = recomendarModelo(lead.area_ha);
    const modeloOpts = MODELOS_DRON.map(m => `<option value="${escapeHTML(m)}" ${m === lead.modelo_recomendado ? 'selected' : ''}>${escapeHTML(m)}</option>`).join('');
    const esAgricola = (lead.clasificacion || 'Agrícola') === 'Agrícola';
    const tieneComp = (lead.cotizacion_competencia || 'No') === 'Sí';

    const html = `
    <div class="modal-overlay" onclick="if(event.target===this)window.closeModal()">
      <div class="modal-card modal-lg">
        <div class="modal-header"><h3>${id ? 'Editar ' + escapeHTML(lead.lead_id) : 'Nuevo lead'}</h3><button class="modal-close" onclick="window.closeModal()">✕</button></div>
        <form id="lead-form" class="modal-body">
          <div class="form-section-title">Empresa & contacto</div>
          <div class="form-grid">
            <label class="field span2">Empresa / Razón social<input name="razon_social" value="${escapeHTML(lead.razon_social)}" required></label>
            <label class="field">Contacto<input name="contacto_principal" value="${escapeHTML(lead.contacto_principal)}"></label>
            <label class="field">Cargo<input name="cargo" value="${escapeHTML(lead.cargo)}"></label>
            <label class="field">Email<input name="email" type="email" value="${escapeHTML(lead.email)}"></label>
            <label class="field">Teléfono<input name="telefono" value="${escapeHTML(lead.telefono)}"></label>
            <label class="field">WhatsApp<input name="whatsapp" value="${escapeHTML(lead.whatsapp)}"></label>
            <label class="field">Ciudad / Zona<input name="ciudad_pais" value="${escapeHTML(lead.ciudad_pais)}"></label>
          </div>

          <div class="form-section-title">Clasificación & aplicación</div>
          <div class="form-grid">
            <label class="field">Clasificación<select name="clasificacion" id="f-clasificacion">${opts(CLASIFICACIONES, lead.clasificacion || 'Agrícola')}</select></label>
            <label class="field" id="wrap-cultivo" style="${esAgricola ? '' : 'display:none'}">Tipo de cultivo<select name="tipo_cultivo">${opts(['', ...CULTIVOS], lead.tipo_cultivo)}</select></label>
            <label class="field">Área de cultivo (ha)<input name="area_ha" id="f-area" type="number" min="0" step="0.1" value="${lead.area_ha || ''}"></label>
            <label class="field" id="wrap-fecha-aplic" style="${esAgricola ? '' : 'display:none'}">Fecha tentativa de aplicación<input name="fecha_aplicacion" type="date" value="${lead.fecha_aplicacion || ''}"></label>
          </div>

          <div class="form-section-title">Modelo de dron</div>
          <div class="form-grid">
            <label class="field span2">Modelo recomendado (editable)<select name="modelo_recomendado" id="f-modelo">${modeloOpts}</select></label>
            <div class="field-hint" id="modelo-hint">Sugerido por área: <b>${escapeHTML(recomendado || '—')}</b></div>
          </div>

          <div class="form-section-title">Comercial</div>
          <div class="form-grid">
            <label class="field">Estado<select name="estado" id="f-estado">${opts(ESTADOS, lead.estado)}</select></label>
            <label class="field">Origen<select name="lead_source">${opts(['', ...FUENTES], lead.lead_source)}</select></label>
            <label class="field">Valor estimado<input name="usd_estimado" type="number" min="0" value="${lead.usd_estimado || ''}"></label>
            <label class="field">Moneda<select name="moneda">${opts(MONEDAS, lead.moneda || 'USD')}</select></label>
            <label class="field">Probabilidad (%)<input name="probabilidad_pct" type="number" min="0" max="100" value="${lead.probabilidad_pct || 0}"></label>
            <label class="field">¿Cotización de competencia?<select name="cotizacion_competencia" id="f-comp">${opts(['No', 'Sí'], lead.cotizacion_competencia || 'No')}</select></label>
            <label class="field span2" id="wrap-comp-det" style="${tieneComp ? '' : 'display:none'}">Detalle competencia (marca / precio)<input name="competencia_detalle" value="${escapeHTML(lead.competencia_detalle)}"></label>
            <label class="field span2" id="wrap-causa" style="${lead.estado === 'Perdido' ? '' : 'display:none'}">Causa de pérdida<select name="causa_perdida">${opts(['', ...CAUSAS_PERDIDA], lead.causa_perdida)}</select></label>
          </div>

          <div class="form-section-title">Seguimiento</div>
          <div class="form-grid">
            <label class="field span2">Próxima acción<input name="proxima_accion" value="${escapeHTML(lead.proxima_accion)}"></label>
            <label class="field">Fecha próxima acción<input name="fecha_proxima_accion" type="date" value="${lead.fecha_proxima_accion || ''}"></label>
            <label class="field">Vendedor<input name="vendedor" value="${escapeHTML(lead.vendedor || vendedorActual())}"></label>
            <label class="field span2">Última actividad<input name="ultima_actividad" value="${escapeHTML(lead.ultima_actividad)}"></label>
            <label class="field span2">Notas<textarea name="notas" rows="3">${escapeHTML(lead.notas)}</textarea></label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-ghost" onclick="window.closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">${id ? 'Guardar cambios' : 'Crear lead'}</button>
          </div>
        </form>
      </div>
    </div>`;
    document.getElementById('modal-root').innerHTML = html;

    // Interacciones del formulario
    const form = document.getElementById('lead-form');
    const area = document.getElementById('f-area');
    const modeloSel = document.getElementById('f-modelo');
    const hint = document.getElementById('modelo-hint');
    let modeloTocado = !!id && !!lead.modelo_recomendado;   // en edición respetamos lo elegido
    modeloSel.addEventListener('change', () => { modeloTocado = true; });
    const aplicarReco = () => {
        const rec = recomendarModelo(area.value);
        hint.innerHTML = `Sugerido por área: <b>${escapeHTML(rec || '—')}</b>`;
        if (!modeloTocado && rec) modeloSel.value = rec;   // auto-set si el usuario no lo tocó
    };
    area.addEventListener('input', aplicarReco);
    document.getElementById('f-clasificacion').addEventListener('change', (e) => {
        const ag = e.target.value === 'Agrícola';
        document.getElementById('wrap-cultivo').style.display = ag ? '' : 'none';
        document.getElementById('wrap-fecha-aplic').style.display = ag ? '' : 'none';
    });
    document.getElementById('f-comp').addEventListener('change', (e) => {
        document.getElementById('wrap-comp-det').style.display = e.target.value === 'Sí' ? '' : 'none';
    });
    document.getElementById('f-estado').addEventListener('change', (e) => {
        document.getElementById('wrap-causa').style.display = e.target.value === 'Perdido' ? '' : 'none';
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const upd = { ...lead };
        fd.forEach((v, k) => { upd[k] = v; });
        if ((upd.clasificacion || '') !== 'Agrícola') { upd.tipo_cultivo = ''; upd.fecha_aplicacion = ''; }
        const okSaved = await saveLead(upd);
        if (okSaved) closeModal();
    });
}
window.openLeadForm = openLeadForm;
window.openEditLead = (id) => openLeadForm(id);
window.deleteLeadById = (leadId) => deleteLead(leadId);
window.closeModal = () => { document.getElementById('modal-root').innerHTML = ''; };

// ── Importar JSON ──
function openPasteJSON() {
    const html = `<div class="modal-overlay" onclick="if(event.target===this)window.closeModal()"><div class="modal-card">
      <div class="modal-header"><h3>Pegar lead(s) JSON</h3><button class="modal-close" onclick="window.closeModal()">✕</button></div>
      <div class="modal-body">
        <p style="color:var(--text-muted);font-size:.8125rem;margin-bottom:.5rem">Pegá un objeto o un array de objetos con los campos del lead. Se completan los faltantes.</p>
        <textarea id="json-input" rows="10" style="width:100%" placeholder='{"razon_social":"Agrícola X","clasificacion":"Agrícola","tipo_cultivo":"Maíz","area_ha":120}'></textarea>
        <div id="json-error" class="alert alert-error" style="display:none;margin-top:.5rem"></div>
      </div>
      <div class="modal-footer"><button class="btn-ghost" onclick="window.closeModal()">Cancelar</button><button class="btn-primary" onclick="window.importJSON()">Importar</button></div>
    </div></div>`;
    document.getElementById('modal-root').innerHTML = html;
}
window.openPasteJSON = openPasteJSON;
window.importJSON = async () => {
    const raw = document.getElementById('json-input').value;
    try {
        const parsed = parseFlexibleJSON(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        let n = 0;
        for (const obj of arr) {
            const lead = { ...emptyLead(), ...obj };
            if (!lead.modelo_recomendado) lead.modelo_recomendado = recomendarModelo(lead.area_ha);
            const ok = await saveLead(lead);
            if (ok) n++;
        }
        closeModal();
        showToast(`✓ ${n} lead(s) importado(s)`);
    } catch (err) {
        const e = document.getElementById('json-error');
        e.textContent = 'JSON inválido: ' + err.message; e.style.display = 'block';
    }
};

// ── Exportar CSV ──
function exportCSV() {
    const cols = ['lead_id', 'estado', 'clasificacion', 'tipo_cultivo', 'area_ha', 'fecha_aplicacion', 'modelo_recomendado', 'razon_social', 'contacto_principal', 'email', 'telefono', 'ciudad_pais', 'usd_estimado', 'moneda', 'probabilidad_pct', 'cotizacion_competencia', 'competencia_detalle', 'proxima_accion', 'fecha_proxima_accion', 'vendedor', 'lead_source', 'notas'];
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...state.leads.map(l => cols.map(c => esc(l[c])).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nase_leads_${today()}.csv`;
    a.click();
    showToast('✓ CSV exportado');
}
window.exportCSV = exportCSV;
