// =========================================================================
// BIBLIOTHÈQUE PDF — Panneau latéral explorateur de fichiers
// =========================================================================

(function() {

// ── État ──────────────────────────────────────────────────────────────────
let _rootHandle   = null;   // FileSystemDirectoryHandle (File System Access API)
let _rootName     = '';     // Nom affiché du dossier racine
let _navStack     = [];     // Pile de navigation : [{ handle, name }]
let _currentItems = [];     // Fichiers/dossiers du répertoire courant
let _clickTimer   = null;   // Pour distinguer simple clic / double-clic

const STORAGE_KEY = 'pdfLibraryRootName';

// ── Helpers DOM ───────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function _panel()     { return $('pdf-library-panel'); }
function _list()      { return $('pdf-library-list'); }
function _breadcrumb(){ return $('pdf-library-breadcrumb'); }
function _status()    { return $('pdf-library-status'); }

// ── Ouverture / fermeture du panneau ─────────────────────────────────────
function togglePdfLibrary() {
    const panel = _panel();
    if (!panel) return;
    const open = panel.classList.toggle('pdf-lib-open');
    // Mémoriser l'état
    try { localStorage.setItem('pdfLibraryOpen', open ? '1' : '0'); } catch(e) {}
    // Mettre à jour le bouton bord droit
    const tab = $('pdf-library-tab');
    if (tab) tab.classList.toggle('pdf-lib-tab-open', open);
    // Mettre à jour le bouton menu
    const menuBtn = $('pdf-library-menu-btn');
    if (menuBtn) menuBtn.classList.toggle('btn-mode-active', open);
}
window.togglePdfLibrary = togglePdfLibrary;

// ── Persistance du handle dossier via IndexedDB ───────────────────────────
// Permet de retrouver le dossier au rechargement sans re-sélectionner
const IDB_NAME    = 'pdfLibraryDB';
const IDB_STORE   = 'handles';
const IDB_KEY     = 'rootHandle';

function _idbOpen() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
        req.onsuccess = e => res(e.target.result);
        req.onerror   = e => rej(e.target.error);
    });
}
async function _idbSaveHandle(handle) {
    try {
        const db = await _idbOpen();
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    } catch(e) {}
}
async function _idbLoadHandle() {
    try {
        const db = await _idbOpen();
        return await new Promise((res, rej) => {
            const tx  = db.transaction(IDB_STORE, 'readonly');
            const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
            req.onsuccess = e => res(e.target.result || null);
            req.onerror   = e => rej(e.target.error);
        });
    } catch(e) { return null; }
}
async function _idbClearHandle() {
    try {
        const db = await _idbOpen();
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(IDB_KEY);
    } catch(e) {}
}

// Tente de restaurer le handle sauvegardé et demande juste la permission
async function _tryRestoreHandle() {
    if (!window.showDirectoryPicker) return false;
    const handle = await _idbLoadHandle();
    if (!handle) return false;
    try {
        // Demande la permission (un simple clic "Autoriser", sans re-naviguer)
        const perm = await handle.requestPermission({ mode: 'read' });
        if (perm !== 'granted') return false;
        _rootHandle = handle;
        _rootName   = handle.name;
        _navStack   = [{ handle, name: handle.name }];
        try { localStorage.setItem(STORAGE_KEY, handle.name); } catch(e) {}
        _showReopenBtn(handle.name);
        _hideReopenBtn();
        _setStatus('');
        await _renderDir(_navStack[0]);
        return true;
    } catch(e) { return false; }
}

// ── Choisir le dossier racine ─────────────────────────────────────────────
async function pdfLibChooseFolder() {
    // Electron avec API dédiée
    if (window.electronAPI && typeof window.electronAPI.chooseDirectory === 'function') {
        try {
            const result = await window.electronAPI.chooseDirectory();
            if (!result) return;
            _rootHandle = null;
            _rootName   = result.name;
            _navStack   = [{ handle: null, name: result.name, electronPath: result.path }];
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: result.name, path: result.path })); } catch(e) {}
            await _renderDir(_navStack[0]);
            return;
        } catch(err) {
            console.warn('[PdfLib] Electron chooseDirectory échoué, fallback', err);
        }
    }
    // File System Access API (Chrome/Edge) — handle persistable en IDB
    if (window.showDirectoryPicker) {
        try {
            const handle = await window.showDirectoryPicker({ mode: 'read' });
            _rootHandle = handle;
            _rootName   = handle.name;
            _navStack   = [{ handle, name: handle.name }];
            try { localStorage.setItem(STORAGE_KEY, handle.name); } catch(e) {}
            await _idbSaveHandle(handle);
            _showReopenBtn(handle.name);
            _hideReopenBtn();
            _setStatus('');
            await _renderDir(_navStack[0]);
            return;
        } catch(err) {
            if (err.name === 'AbortError') return; // l'utilisateur a annulé
            console.warn('[PdfLib] showDirectoryPicker échoué, fallback', err);
        }
    }
    // Fallback universel : <input webkitdirectory>
    _pickFolderViaInput();
}
window.pdfLibChooseFolder = pdfLibChooseFolder;

// ── Sélection dossier via <input webkitdirectory> ─────────────────────────
function _pickFolderViaInput() {
    let input = document.getElementById('_pdf-lib-folder-input');
    if (input) input.remove();
    input = document.createElement('input');
    input.type = 'file';
    input.id = '_pdf-lib-folder-input';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('multiple', '');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', _onFolderInputChange);
    input.click();
}

function _onFolderInputChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const rootName = files[0].webkitRelativePath.split('/')[0];
    _rootName  = rootName;
    _rootHandle = null;
    const tree = _buildVirtualTree(files);
    _navStack = [{ name: rootName, virtualNode: tree }];
    try { localStorage.setItem(STORAGE_KEY, rootName); } catch(e) {}
    // Mettre à jour le bouton Rouvrir avec le nouveau nom
    _showReopenBtn(rootName);
    _hideReopenBtn(); // masquer car le dossier est déjà ouvert
    _setStatus('');
    _renderVirtualDir(_navStack[0]);
}

// ── Arbre virtuel ─────────────────────────────────────────────────────────
// Construit un nœud { dirs: {}, pdfs: [File] } depuis la liste plate des fichiers
function _buildVirtualTree(files) {
    const root = { dirs: {}, pdfs: [] };
    files.forEach(file => {
        const parts = file.webkitRelativePath.split('/');
        // parts[0] = nom du dossier racine, on l'ignore (c'est _rootName)
        let node = root;
        for (let i = 1; i < parts.length - 1; i++) {
            const dir = parts[i];
            if (!node.dirs[dir]) node.dirs[dir] = { dirs: {}, pdfs: [] };
            node = node.dirs[dir];
        }
        const fname = parts[parts.length - 1];
        if (fname.toLowerCase().endsWith('.pdf')) {
            node.pdfs.push(file);
        }
    });
    return root;
}

// Navigue dans un nœud virtuel
function _renderVirtualDir(entry) {
    const node = entry.virtualNode;
    if (!node) { _setStatus('Erreur interne.', true); return; }
    _renderBreadcrumb();
    _setStatus('');

    // Construire la liste des items
    const dirs = Object.keys(node.dirs).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    const pdfs = node.pdfs.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

    const items = [
        ...dirs.map(d => ({ name: d, isDir: true, virtualNode: node.dirs[d] })),
        ...pdfs.map(f => ({ name: f.name, isDir: false, fileObj: f }))
    ];
    _currentItems = items;
    _renderList(items);
}

// ── Navigation dans un dossier ────────────────────────────────────────────
async function _enterDir(item) {
    _navStack.push(item);
    if (item.virtualNode) {
        _renderVirtualDir(item);
    } else {
        await _renderDir(item);
    }
}

async function _navTo(depth) {
    _navStack = _navStack.slice(0, depth + 1);
    const entry = _navStack[_navStack.length - 1];
    if (entry.virtualNode) {
        _renderVirtualDir(entry);
    } else {
        await _renderDir(entry);
    }
}
window._pdfLibNavTo = _navTo;

async function _renderDir(dirEntry) {
    const list = _list();
    if (!list) return;
    list.innerHTML = '<div class="pdf-lib-loading">Chargement…</div>';
    _renderBreadcrumb();

    try {
        let items = [];

        if (window.electronAPI && typeof window.electronAPI.listDirectory === 'function' && dirEntry.electronPath) {
            // Electron
            const raw = await window.electronAPI.listDirectory(dirEntry.electronPath);
            items = raw.map(e => ({
                name: e.name,
                isDir: e.isDirectory,
                electronPath: e.path
            }));
        } else if (dirEntry.handle) {
            // File System Access API
            for await (const [name, handle] of dirEntry.handle.entries()) {
                items.push({ name, isDir: handle.kind === 'directory', handle, fsHandle: handle });
            }
        } else {
            _setStatus('Dossier inaccessible.', true);
            list.innerHTML = '';
            return;
        }

        // Trier : dossiers d'abord, puis PDFs, ordre alpha insensible à la casse
        items.sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
        });

        // Filtrer : dossiers + fichiers .pdf uniquement
        const visible = items.filter(i => i.isDir || i.name.toLowerCase().endsWith('.pdf'));
        _currentItems = visible;

        _setStatus('');
        _renderList(visible);
    } catch(err) {
        list.innerHTML = '';
        _setStatus('Erreur lecture dossier : ' + err.message, true);
    }
}

function _renderList(items) {
    const list = _list();
    if (!list) return;

    if (items.length === 0) {
        list.innerHTML = '<div class="pdf-lib-empty">Aucun PDF dans ce dossier</div>';
        return;
    }

    list.innerHTML = '';
    items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'pdf-lib-item' + (item.isDir ? ' pdf-lib-dir' : ' pdf-lib-pdf');
        row.dataset.idx = idx;
        row.innerHTML = `<span class="pdf-lib-icon">${item.isDir ? '📁' : '📄'}</span><span class="pdf-lib-name">${_escHtml(item.name)}</span>`;

        // Dossier : clic simple pour entrer
        if (item.isDir) {
            row.addEventListener('click', () => {
                _enterDir({
                    name: item.name,
                    handle: item.fsHandle || null,
                    electronPath: item.electronPath || null,
                    virtualNode: item.virtualNode || null
                });
            });
        } else {
            // PDF : double-clic pour ouvrir, clic simple pour sélectionner visuellement
            row.addEventListener('click', (e) => {
                // Sélection visuelle
                list.querySelectorAll('.pdf-lib-item').forEach(r => r.classList.remove('pdf-lib-selected'));
                row.classList.add('pdf-lib-selected');

                if (_clickTimer) {
                    clearTimeout(_clickTimer);
                    _clickTimer = null;
                    // Double-clic détecté
                    _openPdf(item);
                } else {
                    _clickTimer = setTimeout(() => { _clickTimer = null; }, 300);
                }
            });
        }

        list.appendChild(row);
    });
}

// ── Ouvrir un PDF dans un widget ─────────────────────────────────────────
async function _openPdf(item) {
    if (typeof createWidget !== 'function' || typeof _showPdfInWidget !== 'function') {
        _setStatus('Erreur : fonctions PDF non disponibles.', true);
        return;
    }

    _setStatus('Ouverture…');

    try {
        let base64 = null;
        const filename = item.name;

        if (item.fileObj) {
            // Mode input webkitdirectory : objet File natif
            base64 = await _fileToBase64(item.fileObj);
        } else if (window.electronAPI && typeof window.electronAPI.readPdfFile === 'function' && item.electronPath) {
            base64 = await window.electronAPI.readPdfFile(item.electronPath);
        } else if (item.fsHandle) {
            const file = await item.fsHandle.getFile();
            base64 = await _fileToBase64(file);
        }

        if (!base64) { _setStatus('Impossible de lire ce fichier.', true); return; }

        // Position empilée : décalage 40px/20px par rapport au dernier widget PDF
        const pos = _nextPdfPosition();
        const widget = createWidget('pdf', pos.x + 'px', pos.y + 'px', true);
        if (!widget) { _setStatus('Erreur création widget.', true); return; }

        const container = widget.querySelector('.editor-container');
        if (!container) { _setStatus('Erreur interne widget.', true); return; }

        if (!widget.dataset.pdfId) {
            widget.dataset.pdfId = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        }
        widget.dataset.pdfName = filename;
        _showPdfInWidget(container, base64, filename);
        pdfStorage.set(widget.dataset.pdfId, base64).then(() => saveBoard());

        _setStatus('');

        // Optionnel : fermer le panneau après ouverture en mode plein écran
        // togglePdfLibrary();
    } catch(err) {
        _setStatus('Erreur : ' + err.message, true);
        console.error('[PdfLib] _openPdf:', err);
    }
}

function _fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Lecture fichier échouée'));
        reader.readAsDataURL(file);
    });
}

// Position du prochain widget PDF : empilé sur le dernier, décalé +40px / +20px
function _nextPdfPosition() {
    const all = Array.from(document.querySelectorAll('.widget[data-type="pdf"]'));
    if (all.length === 0) {
        return { x: Math.round(window.innerWidth * 0.08), y: 60 };
    }
    const last = all[all.length - 1];
    return { x: last.offsetLeft + 50, y: last.offsetTop + 50 };
}

// ── Fil d'Ariane ─────────────────────────────────────────────────────────
function _renderBreadcrumb() {
    const bc = _breadcrumb();
    if (!bc) return;
    bc.innerHTML = '';
    _navStack.forEach((entry, i) => {
        if (i > 0) {
            const sep = document.createElement('span');
            sep.className = 'pdf-lib-sep';
            sep.textContent = '›';
            bc.appendChild(sep);
        }
        const crumb = document.createElement('span');
        crumb.className = 'pdf-lib-crumb' + (i === _navStack.length - 1 ? ' pdf-lib-crumb-active' : '');
        crumb.textContent = entry.name;
        if (i < _navStack.length - 1) {
            crumb.onclick = () => _pdfLibNavTo(i);
        }
        bc.appendChild(crumb);
    });
}

// ── Status ────────────────────────────────────────────────────────────────
function _setStatus(msg, isError) {
    const el = _status();
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--pdf-lib-error)' : 'var(--pdf-lib-muted)';
}

// ── Utilitaires ───────────────────────────────────────────────────────────
function _escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _showReopenBtn(name) {
    const footer = document.getElementById('pdf-library-footer');
    if (!footer) return;
    let btn = document.getElementById('pdf-library-reopen');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'pdf-library-reopen';
        // Insérer avant le bouton "Choisir"
        const choose = document.getElementById('pdf-library-choose');
        footer.insertBefore(btn, choose);
    }
    btn.textContent = '↺ Rouvrir ' + name;
    btn.title = 'Rouvrir le dossier : ' + name;
    btn.onclick = async () => {
        // Essayer d'abord de restaurer via le handle IDB (juste un clic "Autoriser")
        const restored = await _tryRestoreHandle();
        // Si pas de handle sauvegardé (ex: webkitdirectory fallback), re-sélectionner
        if (!restored) _pickFolderViaInput();
    };
    btn.style.display = '';
}

function _hideReopenBtn() {
    const btn = document.getElementById('pdf-library-reopen');
    if (btn) btn.style.display = 'none';
}

// ── Init ──────────────────────────────────────────────────────────────────
function _init() {
    const RESIZE_KEY = 'pdfLibraryWidth';
    const MIN_W = 200, DEFAULT_W = 320;

    // Restaurer la largeur mémorisée
    try {
        const savedW = parseInt(localStorage.getItem(RESIZE_KEY));
        const maxW = Math.round(window.innerWidth * 0.5);
        if (savedW >= MIN_W && savedW <= maxW) {
            document.documentElement.style.setProperty('--pdf-lib-w', savedW + 'px');
        }
    } catch(e) {}

    // Logique drag de la poignée
    const handle = document.getElementById('pdf-library-resize-handle');
    const panel  = _panel();
    const tab    = document.getElementById('pdf-library-tab');
    if (handle && panel) {
        let _startX = 0, _startW = 0, _dragging = false;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            _dragging = true;
            _startX = e.clientX;
            _startW = panel.offsetWidth;
            panel.classList.add('pdf-lib-resizing');
            if (tab) tab.classList.add('pdf-lib-resizing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!_dragging) return;
            const dx = e.clientX - _startX; // glisser vers la droite = agrandir
            const maxW = Math.round(window.innerWidth * 0.5);
            const newW = Math.max(MIN_W, Math.min(maxW, _startW + dx));
            document.documentElement.style.setProperty('--pdf-lib-w', newW + 'px');
        });

        document.addEventListener('mouseup', () => {
            if (!_dragging) return;
            _dragging = false;
            panel.classList.remove('pdf-lib-resizing');
            if (tab) tab.classList.remove('pdf-lib-resizing');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            // Sauvegarder la largeur
            try {
                const w = panel.offsetWidth;
                localStorage.setItem(RESIZE_KEY, w);
            } catch(e) {}
        });
    }

    // Restaurer l'état ouvert/fermé
    try {
        const wasOpen = localStorage.getItem('pdfLibraryOpen') === '1';
        if (wasOpen) {
            const p = _panel();
            if (p) p.classList.add('pdf-lib-open');
            const t = document.getElementById('pdf-library-tab');
            if (t) t.classList.add('pdf-lib-tab-open');
        }
    } catch(e) {}

    // Afficher le nom du dossier mémorisé + bouton Rouvrir
    // Tenter d'abord une restauration automatique via IDB (Chrome/Edge)
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            let name = saved;
            try { name = JSON.parse(saved).name || saved; } catch(e) {}
            _setStatus('Dernier dossier : ' + name);
            _showReopenBtn(name);
            // Tentative silencieuse de restauration automatique du handle
            // (fonctionne si la permission est déjà accordée pour cette session)
            _idbLoadHandle().then(async handle => {
                if (!handle) return;
                try {
                    const perm = await handle.queryPermission({ mode: 'read' });
                    if (perm === 'granted') {
                        // Permission déjà accordée → restauration sans aucun clic
                        _rootHandle = handle;
                        _rootName   = handle.name;
                        _navStack   = [{ handle, name: handle.name }];
                        _showReopenBtn(handle.name);
                        _hideReopenBtn();
                        _setStatus('');
                        await _renderDir(_navStack[0]);
                    }
                    // Sinon : la permission sera demandée au clic sur "Rouvrir"
                } catch(e) {}
            });
        } else {
            _setStatus('Aucun dossier sélectionné');
        }
    } catch(e) {}
}

// ── Fermeture au clic en dehors du panneau ────────────────────────────────
document.addEventListener('pointerdown', (e) => {
    const panel = _panel();
    const tab   = $('pdf-library-tab');
    if (!panel || !panel.classList.contains('pdf-lib-open')) return;
    if (panel.contains(e.target) || (tab && tab.contains(e.target))) return;
    panel.classList.remove('pdf-lib-open');
    if (tab) tab.classList.remove('pdf-lib-tab-open');
    const menuBtn = $('pdf-library-menu-btn');
    if (menuBtn) menuBtn.classList.remove('btn-mode-active');
    try { localStorage.setItem('pdfLibraryOpen', '0'); } catch(e) {}
});

document.addEventListener('DOMContentLoaded', _init);

})();
