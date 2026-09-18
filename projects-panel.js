// =========================================================================
// PANNEAU LATÉRAL PROJETS — Le Bureau du Prof
// VERSION SIMPLIFIÉE : 1 projet = 1 tableau, pas d'accordion de scènes
// =========================================================================

(function() {

function _panel() { return document.getElementById('projects-panel'); }
function _list()  { return document.getElementById('proj-panel-list'); }

// ── Ouverture / fermeture ─────────────────────────────────────────────────
function toggleProjectsPanel() {
    const panel = _panel();
    if (!panel) return;
    const open = panel.classList.toggle('proj-panel-open');
    try { localStorage.setItem('projectsPanelOpen', open ? '1' : '0'); } catch(e) {}
    const tab = document.getElementById('projects-panel-tab');
    if (tab) tab.classList.toggle('proj-panel-tab-open', open);
    const menuBtn = document.getElementById('projects-library-menu-btn');
    if (menuBtn) menuBtn.classList.toggle('btn-mode-active', open);
    if (open) _renderProjPanelList();
}
window.toggleProjectsPanel = toggleProjectsPanel;
window.refreshProjectsPanel = function() {
    const panel = document.getElementById('projects-panel');
    if (panel && panel.classList.contains('proj-panel-open')) _renderProjPanelList();
};

// ── Rendu de la liste ─────────────────────────────────────────────────────
async function _renderProjPanelList() {
    const list = _list();
    if (!list) return;
    list.innerHTML = '<div class="proj-panel-loading">Chargement…</div>';

    let projects;
    try { projects = await dbGetAll(); }
    catch(e) {
        list.innerHTML = '<div class="proj-panel-empty">Erreur de chargement</div>';
        return;
    }

    if (!projects.length) {
        list.innerHTML = '<div class="proj-panel-empty">Aucun tableau sauvegardé</div>';
        return;
    }

    list.innerHTML = '';

    projects.forEach(p => _buildProjPanelRow(p, list));

    // ── Drag & drop pour réorganiser ──
    _initPanelDragDrop(list, projects);
}

function _initPanelDragDrop(list, projects) {
    let dragId = null;

    const rows = () => [...list.querySelectorAll('[data-proj-id]')];

    list.addEventListener('dragstart', (e) => {
        const row = e.target.closest('[data-proj-id]');
        if (!row) return;
        dragId = row.dataset.projId;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => row.style.opacity = '0.4', 0);
    });
    list.addEventListener('dragend', () => {
        rows().forEach(r => { r.style.opacity = ''; r.style.borderTop = ''; r.style.borderBottom = ''; });
        dragId = null;
    });
    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const row = e.target.closest('[data-proj-id]');
        if (!row || !dragId || row.dataset.projId === dragId) return;
        rows().forEach(r => { r.style.borderTop = ''; r.style.borderBottom = ''; });
        const rect = row.getBoundingClientRect();
        if ((e.clientY - rect.top) > rect.height / 2) row.style.borderBottom = '2px solid #4a90e2';
        else                                           row.style.borderTop    = '2px solid #4a90e2';
    });
    list.addEventListener('drop', async (e) => {
        e.preventDefault();
        const row = e.target.closest('[data-proj-id]');
        if (!row || !dragId || row.dataset.projId === dragId) return;

        const dragIdx = projects.findIndex(p => p.id === dragId);
        const overIdx = projects.findIndex(p => p.id === row.dataset.projId);
        if (dragIdx === -1 || overIdx === -1) return;

        const rect = row.getBoundingClientRect();
        const insertAfter = (e.clientY - rect.top) > rect.height / 2;
        const targetIdx = insertAfter ? overIdx + 1 : overIdx;
        const moved = projects.splice(dragIdx, 1)[0];
        const insertIdx = dragIdx < targetIdx ? targetIdx - 1 : targetIdx;
        projects.splice(Math.max(0, Math.min(insertIdx, projects.length)), 0, moved);

        await _saveProjectsOrder(projects);
        _renderProjPanelList();
    });
}

function _buildProjPanelRow(p, list) {
    const isCurrent = p.id === getCurrentProjectId();
    const date = new Date(p.updatedAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const row = document.createElement('div');
    row.className = 'proj-panel-item-wrap' + (isCurrent ? ' proj-panel-item-current' : '');
    row.dataset.projId = p.id;
    row.draggable = true;

    const header = document.createElement('div');
    header.className = 'proj-panel-item-header';

    // Poignée drag
    const grip = document.createElement('div');
    grip.textContent = '⠿';
    grip.title = 'Réorganiser';
    grip.style.cssText = 'color:#555;font-size:14px;cursor:grab;flex-shrink:0;width:14px;text-align:center;user-select:none;transition:color .15s;margin-right:2px;';
    grip.onmouseover = () => grip.style.color = '#4a90e2';
    grip.onmouseout  = () => grip.style.color = '#555';
    grip.addEventListener('click', e => e.stopPropagation());

    const info = document.createElement('div');
    info.className = 'proj-panel-item-info';
    info.innerHTML = `
        <div class="proj-panel-item-name">${_escHtmlPanel(p.name)}</div>
        <div class="proj-panel-item-meta">${date}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'proj-panel-item-actions';

    // Clic sur le nom/date pour ouvrir le tableau
    if (!isCurrent) {
        info.style.cursor = 'pointer';
        info.addEventListener('click', async (e) => {
            e.stopPropagation();
            await _projLoad(p.id);
            _renderProjPanelList();
        });
    }

    const btnRename = document.createElement('button');
    btnRename.className = 'proj-panel-btn';
    btnRename.textContent = '✏️';
    btnRename.title = 'Renommer ce tableau';
    btnRename.addEventListener('click', async (e) => {
        e.stopPropagation();
        await _projRename(p.id, p.name);
        _renderProjPanelList();
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'proj-panel-btn proj-panel-btn-delete';
    btnDelete.textContent = '×';
    btnDelete.title = 'Supprimer ce tableau';
    btnDelete.addEventListener('click', (e) => { e.stopPropagation(); _projDelete(p.id).then(() => _renderProjPanelList()); });

    actions.appendChild(btnRename);
    actions.appendChild(btnDelete);

    header.appendChild(grip);
    header.appendChild(info);
    header.appendChild(actions);

    row.appendChild(header);
    list.appendChild(row);
}

function _escHtmlPanel(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────
function _init() {
    const RESIZE_KEY = 'projectsPanelWidth';
    const MIN_W = 220, MAX_W = 560, DEFAULT_W = 300;

    try {
        const savedW = parseInt(localStorage.getItem(RESIZE_KEY));
        if (savedW >= MIN_W && savedW <= MAX_W) {
            document.documentElement.style.setProperty('--proj-panel-w', savedW + 'px');
        }
    } catch(e) {}

    const handle = document.getElementById('projects-panel-resize-handle');
    const panel  = _panel();
    const tab    = document.getElementById('projects-panel-tab');
    if (handle && panel) {
        let _startX = 0, _startW = 0, _dragging = false;
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            _dragging = true; _startX = e.clientX; _startW = panel.offsetWidth;
            panel.classList.add('proj-panel-resizing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
        });
        document.addEventListener('mousemove', (e) => {
            if (!_dragging) return;
            const dx = e.clientX - _startX;
            const newW = Math.max(MIN_W, Math.min(MAX_W, _startW + dx));
            document.documentElement.style.setProperty('--proj-panel-w', newW + 'px');
        });
        document.addEventListener('mouseup', () => {
            if (!_dragging) return;
            _dragging = false;
            panel.classList.remove('proj-panel-resizing');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            try { localStorage.setItem(RESIZE_KEY, panel.offsetWidth); } catch(e) {}
        });
    }

    try {
        if (localStorage.getItem('projectsPanelOpen') === '1') {
            if (panel) panel.classList.add('proj-panel-open');
            if (tab) tab.classList.add('proj-panel-tab-open');
            _renderProjPanelList();
        }
    } catch(e) {}
}

// ── Fermeture au clic en dehors ───────────────────────────────────────────
document.addEventListener('pointerdown', (e) => {
    const panel = _panel();
    const tab   = document.getElementById('projects-panel-tab');
    if (!panel || !panel.classList.contains('proj-panel-open')) return;
    if (panel.contains(e.target) || (tab && tab.contains(e.target))) return;
    if (e.target.closest('#projects-overlay')) return;
    panel.classList.remove('proj-panel-open');
    if (tab) tab.classList.remove('proj-panel-tab-open');
    const menuBtn = document.getElementById('projects-library-menu-btn');
    if (menuBtn) menuBtn.classList.remove('btn-mode-active');
    try { localStorage.setItem('projectsPanelOpen', '0'); } catch(e) {}
});

document.addEventListener('DOMContentLoaded', _init);

})();
