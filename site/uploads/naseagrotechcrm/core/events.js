// ============================================================
// NASE Agrotech CRM · setupEvents (router de eventos del DOM)
// ============================================================
function setupEvents() {
    // Login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        login(document.getElementById('login-email').value, document.getElementById('login-password').value);
    });
    document.getElementById('signup-toggle').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        if (!email || !pass) return showAuthError('Completá email y password primero');
        signup(email, pass);
    });
    document.getElementById('forgot-password').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        if (!email) return showAuthError('Poné tu email primero');
        resetPassword(email);
    });

    // Nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            state.view = view;
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
            ['dashboard', 'kanban', 'agenda', 'auditoria'].forEach(v => {
                const el = document.getElementById('view-' + v);
                if (el) el.style.display = v === view ? 'block' : 'none';
            });
        });
    });

    // Acciones
    document.getElementById('btn-new-lead').addEventListener('click', () => openLeadForm(null));
    document.getElementById('btn-paste-json').addEventListener('click', () => openPasteJSON());
    document.getElementById('btn-export').addEventListener('click', exportCSV);
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Filtros
    document.getElementById('search-input').addEventListener('input', (e) => { state.search = e.target.value; renderTable(); });
    document.getElementById('filter-estado').addEventListener('change', (e) => { state.filterEstado = e.target.value; renderTable(); renderKanban(); });
    document.getElementById('filter-clasificacion').addEventListener('change', (e) => { state.filterClasificacion = e.target.value; renderTable(); renderKanban(); });
    document.getElementById('filter-cultivo').addEventListener('change', (e) => { state.filterCultivo = e.target.value; renderTable(); renderKanban(); });
    document.getElementById('filter-vendedor').addEventListener('change', (e) => { state.filterVendedor = e.target.value; renderTable(); renderKanban(); });
}
