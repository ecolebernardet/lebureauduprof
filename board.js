// =========================================================================
// PDF STORAGE — IndexedDB (capacité >> localStorage) avec fallback
// API : pdfStorage.set(id, base64), pdfStorage.get(id) → Promise, pdfStorage.remove(id)
// =========================================================================
const pdfStorage = (() => {
    const DB_NAME = 'BureauDuProf_PDFs';
    const STORE   = 'pdfs';
    let _db = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
            req.onsuccess = e => { _db = e.target.result; resolve(_db); };
            req.onerror   = () => reject(req.error);
        });
    }

    function tx(mode) {
        return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
    }

    return {
        set(id, base64) {
            return tx('readwrite').then(store => new Promise((res) => {
                const r = store.put(base64, id);
                r.onsuccess = () => res();
                r.onerror   = () => { console.warn('[pdfStorage] Erreur écriture IndexedDB:', r.error); res(); };
            })).catch(err => { console.warn('[pdfStorage] set échoué:', err); });
        },
        get(id) {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.get(id);
                r.onsuccess = () => res(r.result || null);
                r.onerror   = () => res(null);
            })).catch(() => Promise.resolve(null));
        },
        remove(id) {
            // Nettoyer aussi localStorage au cas où des anciennes entrées traîneraient
            localStorage.removeItem(id);
            return tx('readwrite').then(store => new Promise((res) => {
                store.delete(id).onsuccess = () => res();
            })).catch(() => {});
        },
        // Retourne tous les IDs stockés
        listIds() {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.getAllKeys();
                r.onsuccess = () => res(r.result || []);
                r.onerror   = () => res([]);
            })).catch(() => []);
        },
        // Supprime les PDFs dont l'ID n'est pas dans usedIds
        async purgeOrphans(usedIds) {
            const storedIds = await this.listIds();
            const usedSet = new Set(usedIds);
            let removed = 0;
            for (const id of storedIds) {
                if (!usedSet.has(id)) {
                    await this.remove(id);
                    removed++;
                }
            }
            if (removed > 0) console.log(`[pdfStorage] ${removed} PDF(s) orphelin(s) supprimé(s)`);
            return removed;
        }
    };
})();

// Nettoyer les PDFs orphelins au démarrage (après chargement des projets)
async function _cleanOrphanPdfs() {
    try {
        // Attendre que la restauration des PDFs soit terminée
        // (évite de supprimer des PDFs dont le widget est en cours de chargement)
        if (window._pdfRestoring) {
            await new Promise(resolve => {
                const poll = setInterval(() => {
                    if (!window._pdfRestoring) { clearInterval(poll); resolve(); }
                }, 300);
                // Sécurité : ne pas attendre plus de 30s
                setTimeout(() => { clearInterval(poll); resolve(); }, 30000);
            });
        }
        // Délai supplémentaire pour que tous les pdfStorage.set() soient terminés
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Collecter tous les pdfIds utilisés dans tous les projets
        const usedIds = new Set();
        // PDFs dans le board courant (source la plus fiable — widgets actifs en mémoire)
        document.querySelectorAll('.widget[data-type="pdf"]').forEach(w => {
            if (w.dataset.pdfId) usedIds.add(w.dataset.pdfId);
        });
        // PDFs dans toutes les scènes du localStorage (toutes scènes, pas juste la courante)
        try {
            // Config courante
            const raw = localStorage.getItem('profBoardConfig');
            if (raw) {
                const parsed = JSON.parse(raw);
                (parsed.widgets || []).forEach(w => { if (w.pdfId) usedIds.add(w.pdfId); });
            }
            // Métadonnées des scènes (peuvent contenir des configs de scènes non actives)
            const scenesMeta = localStorage.getItem('scenesMeta') || localStorage.getItem('scenes');
            if (scenesMeta) {
                const scenes = JSON.parse(scenesMeta);
                (Array.isArray(scenes) ? scenes : []).forEach(scene => {
                    try {
                        const cfg = typeof scene.config === 'string' ? JSON.parse(scene.config) : scene.config;
                        (cfg?.widgets || []).forEach(w => { if (w.pdfId) usedIds.add(w.pdfId); });
                    } catch(e) {}
                });
            }
        } catch(e) {}
        // PDFs dans tous les projets IndexedDB
        if (typeof dbGetAll === 'function') {
            try {
                const projects = await dbGetAll();
                for (const proj of projects) {
                    for (const scene of (proj.scenes || [])) {
                        try {
                            const config = typeof scene.config === 'string' ? JSON.parse(scene.config) : scene.config;
                            (config?.widgets || []).forEach(w => { if (w.pdfId) usedIds.add(w.pdfId); });
                        } catch(e) {}
                    }
                }
            } catch(e) {}
        }
        // Sécurité finale : re-vérifier les widgets actifs juste avant de purger
        // (au cas où un PDF aurait été ouvert pendant l'attente ci-dessus)
        document.querySelectorAll('.widget[data-type="pdf"]').forEach(w => {
            if (w.dataset.pdfId) usedIds.add(w.dataset.pdfId);
        });
        // Protéger aussi les clés d'annotations (pdfId + '_annots')
        const usedIdsWithAnnots = new Set();
        usedIds.forEach(id => {
            usedIdsWithAnnots.add(id);
            usedIdsWithAnnots.add(id + '_annots');
        });
        await pdfStorage.purgeOrphans([...usedIdsWithAnnots]);
    } catch(e) {
        console.warn('[cleanOrphanPdfs]', e);
    }
}

// =========================================================================
// VARIABLES GLOBALES
// =========================================================================
var board = document.getElementById('board');

// Observer les suppressions de widgets PDF en plein écran pour mettre à jour la tabbar
(function() {
    const _boardObs = new MutationObserver(function(mutations) {
        // Ignorer si la fermeture est gérée manuellement (bouton rouge de l'onglet)
        if (window._pdfFsManualClose) return;
        let needRefresh = false;
        mutations.forEach(function(m) {
            m.removedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList &&
                    (node.classList.contains('widget') || node.querySelector && node.querySelector('.wf-pdf-fullboard'))) {
                    needRefresh = true;
                }
            });
        });
        if (needRefresh && typeof _refreshPdfTabBar === 'function') {
            setTimeout(_refreshPdfTabBar, 50);
        }
    });
    document.addEventListener('DOMContentLoaded', function() {
        const b = document.getElementById('board');
        if (b) _boardObs.observe(b, { childList: true, subtree: false });
    });
})();
var undoStack = [], redoStack = [];
var MAX_UNDO = 60;
let isInitialLoading = true;
let isRestoringState = false;
let _pendingSnapshotTimer = null;
let savedSelection = null;
let currentActiveWidget = null;
const RATIO = 16 / 9;
let _lastW = window.innerWidth;

// Même seuil que style-phone.css : écran étroit (portrait téléphone) ou
// bas + tactile (téléphone en paysage), pour rester cohérent avec le CSS.
function isMobileBoardMode() {
    return window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
}
let _wasMobileBoardMode = isMobileBoardMode();

// =========================================================================
// INIT
// =========================================================================
window.onload = () => {
    // Restaurer le thème du menu
    if (localStorage.getItem('menuTheme') === 'light') {
        document.body.classList.add('menu-light');
        const btn = document.getElementById('menu-theme-btn');
        if (btn) btn.innerHTML = '<span class="mm-ico">🌙</span><span>&nbsp;&nbsp;Mode sombre</span>';
    }
    const savedBg = localStorage.getItem('boardBackground') || "url(fonds/fond-lebureauduprof.jpg)";
    if (savedBg && typeof applyBackground === 'function') {
        applyBackground(savedBg);
        if (savedBg.startsWith('#') && savedBg.length === 7) {
            const hexEl = document.getElementById('board-bg-hex');
            if (hexEl) hexEl.value = savedBg;
            const natEl = document.getElementById('board-bg-native');
            if (natEl) natEl.value = savedBg;
            const sw = document.getElementById('cpick-swatch-board-bg-inline');
            if (sw) sw.style.background = savedBg;
        }
    }
    // Construire la grille de couleurs inline du picker fond d'écran
    (function() {
        const grid = document.getElementById('board-bg-cpick-inline');
        if (!grid) return;
        const COLORS = [
            '#000000','#4a0000','#4a1a00','#4a4000','#003a00','#00204a','#2d004a',
            '#333333','#7f0000','#7a3300','#6b6000','#005200','#003580','#4b0082',
            '#666666','#c0392b','#c0590a','#c09000','#1a7a1a','#1a56b0','#6a1aad',
            '#999999','#e74c3c','#e67e22','#e6c000','#27ae60','#2980b9','#8e44ad',
            '#bbbbbb','#f08080','#f0a060','#f0d060','#6abf6a','#6aaee8','#b06ad4',
            '#ffffff','#ffd5d5','#ffe5cc','#fff5cc','#ccffcc','#cce5ff','#eeccff',
        ];
        COLORS.forEach(function(c) {
            const cell = document.createElement('div');
            cell.style.cssText = 'aspect-ratio:1;border-radius:3px;cursor:pointer;background:'+c+';border:2px solid transparent;box-sizing:border-box;transition:border-color .1s;';
            cell.title = c;
            cell.dataset.bgColor = c;
            cell.onclick = function() {
                applyBackground(c); saveBg(c);
                document.getElementById('board-bg-hex').value = c;
                document.getElementById('board-bg-native').value = c;
                boardBgClearSelected();
                cell.style.borderColor = '#7ab8f5';
            };
            grid.appendChild(cell);
        });
    })();

    window.boardBgClearSelected = function() {
        const grid = document.getElementById('board-bg-cpick-inline');
        if (grid) grid.querySelectorAll('[data-bg-color]').forEach(function(el) {
            el.style.borderColor = 'transparent';
        });
    };
    applyBoardRatio(window.innerWidth);
    if (typeof loadBoard        === 'function') loadBoard();
    if (typeof initShapeToolbar === 'function') initShapeToolbar();
    // Nettoyer les PDFs orphelins 5s après le démarrage (laisse le temps aux projets de charger)
    setTimeout(() => _cleanOrphanPdfs(), 15000);
    // Nettoyer immédiatement les anciennes clés pdf_* dans localStorage (migration)
    Object.keys(localStorage).filter(k => k.startsWith('pdf_')).forEach(k => localStorage.removeItem(k));
    setTimeout(() => {
        isInitialLoading = false;
        _lastW = window.innerWidth;
        if (typeof initSelectionControls === 'function') initSelectionControls();
        if (typeof initBoardSelection    === 'function') initBoardSelection();
        const fontSizeInput = document.getElementById('font-size-input');
        if (fontSizeInput) {
            fontSizeInput.addEventListener('focus', () => {
                if (!currentActiveWidget) return;
                const sel = window.getSelection();
                if (sel.rangeCount > 0) savedSelection = sel.getRangeAt(0).cloneRange();
            });
        }
        if (typeof buildBoardJSON === 'function') {
            const cur = buildBoardJSON();
            if (cur) undoStack.push(cur);
        }
        updateUndoRedoBtns();
        if (typeof scenesInit === 'function') scenesInit();
		if (typeof initCurrentProjectName === 'function') initCurrentProjectName();
		if (typeof refreshFavoritesMenu === 'function') refreshFavoritesMenu();

    }, 1000);
    if (typeof updateClock === 'function') setInterval(updateClock, 1000);
    window.addEventListener('resize', handleWindowResize);
};

document.addEventListener('keydown', (e) => {
    // Supprimer les widgets sélectionnés avec Suppr ou Backspace
    // (sauf si on est en train de taper dans un champ de texte)
    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        !e.target.closest('[contenteditable]') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea') &&
        (selectedWidgets.length > 0 || selectedStrokes.length > 0)) {
        e.preventDefault();
        snapshotNow();
        selectedWidgets.forEach(w => { w.classList.remove('selected'); w.remove(); });
        selectedWidgets = [];
        strokes = strokes.filter(s => !selectedStrokes.includes(s));
        selectedStrokes = [];
        if (drawCtx) redrawStrokes();
        document.getElementById('selection-controls').style.display = 'none';
        saveBoard();
    }

    // Ctrl+C — copier les widgets/strokes/shapes sélectionnés
    if (e.key === 'c' && (e.ctrlKey || e.metaKey) &&
        !e.target.closest('[contenteditable]') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea')) {
        if (selectedWidgets.length > 0 || selectedStrokes.length > 0 || document.querySelectorAll('.shape-widget.selected').length > 0)
            copySelectedWidgets();
    }

    // Ctrl+V — coller les widgets copiés
    if (e.key === 'v' && (e.ctrlKey || e.metaKey) &&
        !e.target.closest('[contenteditable]') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea')) {
        pasteWidgets();
    }

    // Ctrl+Z — annuler (undo)
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey &&
        !e.target.closest('[contenteditable]') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea')) {
        e.preventDefault();
        if (typeof undoAction === 'function') undoAction();
    }

    // Ctrl+Y — refaire (redo)
    if (e.key === 'y' && (e.ctrlKey || e.metaKey) &&
        !e.target.closest('[contenteditable]') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea')) {
        e.preventDefault();
        if (typeof redoAction === 'function') redoAction();
    }

    // Navigation entre onglets PDF plein écran
    // Escape → quitter le plein écran de l'onglet actif
    // ArrowLeft / ArrowRight → switcher d'onglet
    if (typeof _getPdfFsContainers === 'function') {
        const fsCont = _getPdfFsContainers();
        if (fsCont.length >= 2) {
            const tabBar = document.getElementById('pdf-fs-tabbar');
            if (tabBar && tabBar.style.display !== 'none') {
                const visibleIdx = fsCont.findIndex(c => !c.classList.contains('pdf-fs-hidden'));
                if (e.key === 'Escape') {
                    e.preventDefault();
                    const active = fsCont[visibleIdx];
                    if (active) togglePdfBoardFullscreen(active);
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const dir = e.key === 'ArrowRight' ? 1 : -1;
                    const next = (visibleIdx + dir + fsCont.length) % fsCont.length;
                    _activatePdfFsTab(fsCont[next]);
                }
            }
        }
    }
});


// =========================================================================
// COPIER / COLLER WIDGETS ENTRE SCÈNES
// =========================================================================
function copySelectedWidgets() {
    // Filtrer les widgets qui ne sont plus dans le DOM (fermés entre-temps)
    selectedWidgets = selectedWidgets.filter(w => document.body.contains(w));
    const selectedShapeWidgets = [...document.querySelectorAll('.shape-widget.selected')];
    if (selectedWidgets.length === 0 && selectedStrokes.length === 0 && selectedShapeWidgets.length === 0) return;

    const curW = window.innerWidth, curVH = virtualH(curW);

    // Copier les widgets DOM (en excluant les shape-widgets traités séparément)
    const copied = [];
    selectedWidgets.filter(w => !w.classList.contains('shape-widget')).forEach(w => {
        const iframe   = w.querySelector('iframe');
        const c        = w.querySelector('.editor-container');
        const html     = getInnerHTMLNormalized(w);
        const isTextLike = w.dataset.type === 'text' || w.dataset.type === 'homework';
        let wP = 0, hP = 0;
        if (c) { wP = (c.offsetWidth / curW) * 100; hP = ((c.offsetHeight - getToolbarHeight(c)) / curVH) * 100; }
        const lP = (w.offsetLeft / curW) * 100;
        const tP = (w.offsetTop  / curVH) * 100;
        let stickerUrl = null, stickerEmoji = null, stickerSize = null;
        if (w.dataset.type === 'sticker') {
            const sImg = w.querySelector('img');
            const sEmoji = w.querySelector('[data-sticker-type="emoji"]');
            if (sImg) stickerUrl = sImg.src;
            if (sEmoji) stickerEmoji = sEmoji.textContent;
            stickerSize = { w: w.offsetWidth, h: w.offsetHeight };
        }
        let monnaieData = null;
        if (w.dataset.type === 'monnaie') {
            const mc = w.querySelector('.monnaie-container');
            const mz = w.querySelector('.monnaie-items');
            monnaieData = {
                containerW: mc ? mc.offsetWidth  : null,
                itemsH:     mz ? mz.offsetHeight : null,
                level:      w.dataset.monnaieLevel || 'facile'
            };
        }
        copied.push({
            type: w.dataset.type, topPercent: tP, leftPercent: lP, widthPercent: wP, contentHPercent: hP,
            html, content: html, iframeSrc: iframe?.src || null,
            transparent: w.dataset.transparent === 'true',
            bgColor: w.dataset.bgColor || '#ffffff',
            bgOpacity: parseFloat(w.dataset.bgOpacity ?? 1),
            editorStyle: isTextLike ? getEditorStyleNormalized(w, 1920) : null,
            pinned: false, background: w.dataset.background === 'true', groupId: null,
            meteoCity: w.dataset.meteoCity || null,
            stickerUrl, stickerEmoji, stickerSize,
            transform: w.style.transform || null,
            pdfId: w.dataset.pdfId || null, pdfName: w.dataset.pdfName || null,
            animation: w.dataset.animation || null, monnaieData
        });
    });

    // Copier les shapes sélectionnées
    const copiedShapes = selectedShapeWidgets.map(w => {
        const svg = w.querySelector('svg');
        const lP = (w.offsetLeft / curW) * 100;
        const tP = (w.offsetTop  / curVH) * 100;
        const wP = (parseFloat(svg?.getAttribute('width') || 150) / curW) * 100;
        const hP = (parseFloat(svg?.getAttribute('height') || 150) / curVH) * 100;
        return {
            shapeType: w.dataset.shapeType, strokeColor: w.dataset.strokeColor,
            fillColor: w.dataset.fillColor, fillOpacity: w.dataset.fillOpacity,
            strokeWidth: parseInt(w.dataset.strokeWidth || 4),
            leftPercent: lP, topPercent: tP, wPercent: wP, hPercent: hP,
            transform: w.style.transform || '', pinned: false, background: false, groupId: null,
            flipX: parseFloat(w.dataset.flipX || 1), flipY: parseFloat(w.dataset.flipY || 1)
        };
    });

    // Copier les traits canvas sélectionnés
    const copiedStrokes = selectedStrokes.map(s => JSON.parse(JSON.stringify(s)));

    const total = copied.length + copiedShapes.length + copiedStrokes.length;
    if (total === 0) return;

    localStorage.setItem('clipboardWidgets', JSON.stringify({
        refWidth: 1920, widgets: copied, shapes: copiedShapes, strokes: copiedStrokes
    }));
    _showCopyFeedback(total);
}

function pasteWidgets() {
    const raw = localStorage.getItem('clipboardWidgets');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        const offset = 2; // décalage en % pour signaler le collage
        const curW = window.innerWidth, curVH = virtualH(curW);
        const offsetPx = { x: (offset / 100) * curW, y: (offset / 100) * curVH };

        snapshotNow();

        // Coller les widgets DOM
        if (data.widgets && data.widgets.length > 0) {
            const shifted = {
                ...data,
                widgets: data.widgets.map(w => ({
                    ...w,
                    leftPercent: Math.min(w.leftPercent + offset, 90),
                    topPercent:  Math.min(w.topPercent  + offset, 90),
                    groupId: null
                })),
                shapes: [], strokes: []
            };
            restoreBoardFromJSON(JSON.stringify(shifted));
        }

        // Coller les shapes
        if (data.shapes && data.shapes.length > 0) {
            data.shapes.forEach(s => {
                const sw = (s.wPercent / 100) * curW, sh = (s.hPercent / 100) * curVH;
                const lx = Math.min((s.leftPercent + offset) / 100, 0.9) * curW;
                const ty = Math.min((s.topPercent  + offset) / 100, 0.9) * curVH;
                const w2 = createShapeWidget(s.shapeType, s.strokeColor, s.fillColor, s.fillOpacity, sw, sh, lx + 'px', ty + 'px', false, s.strokeWidth || 4);
                if (w2) {
                    if (s.transform) w2.style.transform = s.transform;
                    const fsx = parseFloat(s.flipX || 1), fsy = parseFloat(s.flipY || 1);
                    if (fsx !== 1 || fsy !== 1) {
                        const svg2 = w2.querySelector('svg');
                        if (svg2) { svg2.style.transformBox = 'fill-box'; svg2.style.transformOrigin = 'center center'; svg2.style.transform = `scale(${fsx},${fsy})`; }
                    }
                }
            });
        }

        // Coller les traits canvas
        if (data.strokes && data.strokes.length > 0) {
            data.strokes.forEach(s => {
                const clone = JSON.parse(JSON.stringify(s));
                clone.points = clone.points.map(p => ({ x: p.x + offsetPx.x, y: p.y + offsetPx.y }));
                clone.groupId = null;
                strokes.push(clone);
            });
            if (typeof redrawStrokes === 'function') redrawStrokes();
        }

        setTimeout(() => saveBoard(), 300);
    } catch(e) { console.error('Erreur collage:', e); }
}

function _showCopyFeedback(count) {
    let toast = document.getElementById('copy-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'copy-toast';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1a3550;color:#7ab8f5;border:1px solid #4a90e2;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:700;z-index:99999;pointer-events:none;transition:opacity .3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = `📋 ${count} widget${count > 1 ? 's' : ''} copié${count > 1 ? 's' : ''} — Ctrl+V pour coller`;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.style.opacity = '0', 2500);
}


function virtualH(w) {
    // Sur téléphone (hors mode A4, géré séparément), le board doit rester
    // vertical : il occupe toute la hauteur visible de l'écran au lieu de
    // suivre le ratio 16/9 pensé pour un écran large en paysage.
    if (isMobileBoardMode() && !document.body.classList.contains('a4-mode')) {
        return window.innerHeight;
    }
    return w / RATIO;
}

function applyBoardRatio(newW) {
    if (document.body.classList.contains('a4-mode')) return;
    if (typeof _isPdfWallpaper !== 'undefined' && _isPdfWallpaper) {
        board.style.width    = newW + 'px';
        board.style.position = 'absolute';
        board.style.top      = '0';
        board.style.left     = '0';
        if (typeof _applyBoardHeightForPdf === 'function') _applyBoardHeightForPdf();
        updatePresLimitLine();
        return;
    }
    const vh = virtualH(newW);
    board.style.width    = newW + 'px';
    board.style.height   = vh + 'px';
    board.style.position = 'absolute';
    board.style.top      = Math.max(0, (window.innerHeight - vh) / 2) + 'px';
    board.style.left     = '0';
    updatePresLimitLine();
}

function updatePresLimitLine() {
    const line = document.getElementById('pres-limit-line');
    if (!line) return;
    if (typeof _isPdfWallpaper !== 'undefined' && _isPdfWallpaper) {
        line.style.display = 'none';
        return;
    }
    // La limite basse présentation = 100vh de la fenêtre, mesurée depuis le haut du board
    const boardTop = parseFloat(board.style.top) || 0;
    const limitY = window.innerHeight - boardTop;
    const boardH = parseFloat(board.style.height) || virtualH(window.innerWidth);
    // N'afficher la ligne que si la limite est à l'intérieur du board (pas tout en bas ou hors board)
    if (limitY > 20 && limitY < boardH - 10) {
        line.style.top = limitY + 'px';
        line.style.display = 'block';
    } else {
        line.style.display = 'none';
    }
}

function scaleFontSizesBy(el, factor) {
    if (Math.abs(factor - 1) < 0.001) return;
    el.querySelectorAll('*').forEach(child => {
        if (!child.style?.fontSize) return;
        const m = child.style.fontSize.match(/^([\d.]+)px$/);
        if (m) child.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    });
    if (el.style?.fontSize) {
        const m = el.style.fontSize.match(/^([\d.]+)px$/);
        if (m) el.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    }
}

function scaleFontSizesFromRef(el, refW) { scaleFontSizesBy(el, window.innerWidth / refW); }

function getToolbarHeight(container) {
    const tb = container?.querySelector('.editor-toolbar');
    return tb ? tb.offsetHeight : 0;
}

function handleWindowResize() {
    const newW = window.innerWidth;
    const factor = newW / _lastW;
    // Si on franchit la frontière mobile ↔ desktop (ex. rotation du téléphone),
    // réappliquer le fond d'écran pour qu'il bascule cover/100% auto correctement.
    const nowMobile = isMobileBoardMode();
    if (nowMobile !== _wasMobileBoardMode) {
        _wasMobileBoardMode = nowMobile;
        const currentBg = localStorage.getItem('boardBackground');
        if (currentBg && typeof applyBackground === 'function') applyBackground(currentBg);
    }
    // En mode A4, recalculer les dimensions A4 au lieu du ratio normal
    if (document.body.classList.contains('a4-mode')) {
        const h = Math.round(newW * 1.4142);
        board.style.width  = newW + 'px';
        board.style.height = h + 'px';
    } else {
        applyBoardRatio(newW);
    }
    const newVH = virtualH(newW);
    document.querySelectorAll('.widget').forEach(w => {
        // Cas spécial : widget défi calme (pas de .editor-container, largeur sur .dc-container)
        if (w.dataset.type === 'deficalme') {
            const dc = w.querySelector('.dc-container');
            if (dc && parseFloat(w.dataset.widthPercent) > 0)
                dc.style.width = (parseFloat(w.dataset.widthPercent) / 100) * newW + 'px';
            if (parseFloat(w.dataset.leftPercent) > 0) w.style.left = (parseFloat(w.dataset.leftPercent) / 100) * newW + 'px';
            if (parseFloat(w.dataset.topPercent)  > 0) w.style.top  = (parseFloat(w.dataset.topPercent)  / 100) * newVH + 'px';
            return;
        }
        const c = w.querySelector('.editor-container');
        if (c) {
            if (parseFloat(w.dataset.widthPercent) > 0)
                c.style.width = (parseFloat(w.dataset.widthPercent) / 100) * newW + 'px';
            if (parseFloat(w.dataset.contentHPercent) > 0)
                c.style.height = ((parseFloat(w.dataset.contentHPercent) / 100) * newVH) + getToolbarHeight(c) + 'px';
        }
        if (parseFloat(w.dataset.leftPercent) > 0) w.style.left = (parseFloat(w.dataset.leftPercent) / 100) * newW + 'px';
        if (parseFloat(w.dataset.topPercent)  > 0) w.style.top  = (parseFloat(w.dataset.topPercent)  / 100) * newVH + 'px';
        scaleFontSizesBy(w, factor);
    });
    document.querySelectorAll('.shape-widget').forEach(w => {
        const curW = newW, curVH = virtualH(curW);
        if (parseFloat(w.dataset.leftPercent) > 0) w.style.left = (parseFloat(w.dataset.leftPercent) / 100) * curW + 'px';
        if (parseFloat(w.dataset.topPercent)  > 0) w.style.top  = (parseFloat(w.dataset.topPercent)  / 100) * curVH + 'px';
        const svg = w.querySelector('svg');
        if (svg && parseFloat(w.dataset.wPercent) > 0) {
            const sw = (parseFloat(w.dataset.wPercent) / 100) * curW;
            const sh = (parseFloat(w.dataset.hPercent) / 100) * curVH;
            svg.setAttribute('width', sw);
            svg.setAttribute('height', sh);
        }
    });
    _lastW = newW;
    if (typeof resizeCanvas === 'function') resizeCanvas();
}

// =========================================================================
// UNDO / REDO
// =========================================================================
function snapshotNow() {
    if (isInitialLoading || isRestoringState) return;
    clearTimeout(_pendingSnapshotTimer);
    const cur = buildBoardJSON();
    if (!cur) return;
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === cur) return;
    undoStack.push(cur);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    updateUndoRedoBtns();
}

function scheduleSaveSnapshot() {
    clearTimeout(_pendingSnapshotTimer);
    _pendingSnapshotTimer = setTimeout(() => {
        const cur = buildBoardJSON();
        if (!cur) return;
        if (undoStack.length > 0 && undoStack[undoStack.length - 1] === cur) return;
        undoStack.push(cur);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack = [];
        updateUndoRedoBtns();
    }, 800);
}

function undoAction() {
    if (undoStack.length <= 1) return;
    isRestoringState = true;
    clearTimeout(_pendingSnapshotTimer);
    redoStack.push(undoStack.pop());
    const snap = undoStack[undoStack.length - 1];
    document.querySelectorAll('.widget').forEach(w => w.remove());
    document.querySelectorAll('.shape-widget').forEach(w => w.remove());
    try {
        const p = JSON.parse(snap);
        strokes = p.strokes || [];
        if (p.background) { localStorage.setItem('boardBackground', p.background); applyBackground(p.background); }
    } catch(e) { strokes = []; }
    localStorage.setItem('profBoardConfig', snap);
    _lastW = window.innerWidth;
    restoreBoardFromJSON(snap);
    // isRestoringState est remis à false dans le setTimeout de restoreBoardFromJSON
    updateUndoRedoBtns();
}

function redoAction() {
    if (redoStack.length === 0) return;
    isRestoringState = true;
    clearTimeout(_pendingSnapshotTimer);
    const snap = redoStack.pop();
    undoStack.push(snap);
    document.querySelectorAll('.widget').forEach(w => w.remove());
    document.querySelectorAll('.shape-widget').forEach(w => w.remove());
    try {
        const p = JSON.parse(snap);
        strokes = p.strokes || [];
        if (p.background) { localStorage.setItem('boardBackground', p.background); applyBackground(p.background); }
    } catch(e) { strokes = []; }
    localStorage.setItem('profBoardConfig', snap);
    _lastW = window.innerWidth;
    restoreBoardFromJSON(snap);
    // isRestoringState est remis à false dans le setTimeout de restoreBoardFromJSON
    updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
    const ub = document.getElementById('undo-btn'), rb = document.getElementById('redo-btn');
    const canU = undoStack.length > 1, canR = redoStack.length > 0;
    if (ub) { ub.classList.toggle('enabled', canU); }
    if (rb) { rb.classList.toggle('enabled', canR); }
}

// → widgets.js (createWidget, makeDraggable, bringToFront, menu contextuel…)


// → toolbar-text.js

	// =========================================================================
	// POINTEUR LASER
	// =========================================================================
	let isLaserMode = false;
	const laserDot = document.getElementById('laser-pointer') || (() => {
		const d = document.createElement('div');
		d.id = 'laser-pointer';
		document.body.appendChild(d);
		return d;
	})();

	function toggleLaser() {
		isLaserMode = !isLaserMode;
		const btn = document.getElementById('laser-btn');
		if (isLaserMode) {
			btn.classList.add('active-tool');
			document.body.style.cursor = 'none';
			laserDot.classList.add('active');
			// Couvrir les iframes avec un overlay pour que le laser reste visible dessus
			document.querySelectorAll('.widget iframe, .widget embed').forEach(el => {
				const overlay = document.createElement('div');
				overlay.className = 'laser-iframe-overlay';
				overlay.style.cssText = 'position:absolute;inset:0;z-index:9999;cursor:none;background:transparent;';
				// Double-clic sur l'overlay : désactiver le laser et entrer dans le widget
				overlay.addEventListener('dblclick', (e) => {
					toggleLaser();
				});
				// Afficher une petite info-bulle au survol
				overlay.title = 'Double-clic pour entrer dans ce widget';
				el.parentElement.style.position = 'relative';
				el.parentElement.appendChild(overlay);
			});
		} else {
			btn.classList.remove('active-tool');
			document.body.style.cursor = '';
			laserDot.classList.remove('active');
			document.querySelectorAll('.laser-iframe-overlay').forEach(el => el.remove());
		}
	}

	document.addEventListener('mousemove', (e) => {
		if (!isLaserMode) return;
		laserDot.style.left = e.clientX + 'px';
		laserDot.style.top  = e.clientY + 'px';
	});

	// Désactiver avec Échap
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && isLaserMode) toggleLaser();
	});

// → color-picker.js


// =========================================================================
// CAPTURE DU BUREAU
// =========================================================================
async function captureBoard(format) {
    // Charger html2canvas si nécessaire (fallback navigateur web)
    if (!window.html2canvas && !(window.electronAPI && window.electronAPI.captureScreenshot)) {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    // Feedback visuel
    const toast = document.createElement('div');
    toast.textContent = '📸 Capture en cours…';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:8px 20px;border-radius:10px;font-size:13px;font-weight:700;z-index:999999;border:1px solid #444;';
    document.body.appendChild(toast);

    try {
        const board = document.getElementById('board');
        const dpr = window.devicePixelRatio || 1;
        let canvas;

        if (window.electronAPI && window.electronAPI.captureScreenshot) {
            // Electron : capture native via capturePage (pas de problème cross-origin)
            const pngBuffer = await window.electronAPI.captureScreenshot();
            const blob = new Blob([pngBuffer], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            await new Promise(res => { img.onload = res; img.src = url; });
            canvas = document.createElement('canvas');
            // Recadrer sur le board uniquement
            const boardRect = board.getBoundingClientRect();
            canvas.width  = boardRect.width  * dpr;
            canvas.height = boardRect.height * dpr;
            canvas.getContext('2d').drawImage(img,
                boardRect.left * dpr, boardRect.top * dpr,
                boardRect.width * dpr, boardRect.height * dpr,
                0, 0, canvas.width, canvas.height
            );
            URL.revokeObjectURL(url);
        } else {
            // Navigateur web : capture via getDisplayMedia (capture d'écran native)
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'never' },
                    audio: false
                });
                const video = document.createElement('video');
                video.srcObject = stream;
                await new Promise(res => { video.onloadedmetadata = res; });
                await video.play();
                // Attendre une frame
                await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

                // Recadrer sur le board
                const boardRect = board.getBoundingClientRect();
                canvas = document.createElement('canvas');
                canvas.width  = boardRect.width  * dpr;
                canvas.height = boardRect.height * dpr;
                const ctx3 = canvas.getContext('2d');
                const scaleX = video.videoWidth  / window.screen.width;
                const scaleY = video.videoHeight / window.screen.height;
                ctx3.drawImage(video,
                    (window.screenX + boardRect.left) * scaleX,
                    (window.screenY + boardRect.top  + (window.outerHeight - window.innerHeight)) * scaleY,
                    boardRect.width  * scaleX,
                    boardRect.height * scaleY,
                    0, 0, canvas.width, canvas.height
                );
                stream.getTracks().forEach(t => t.stop());
                video.remove();
            } catch(e) {
                throw new Error('Capture annulée ou non supportée : ' + e.message);
            }
        }

        const timestamp = new Date().toISOString().slice(0,16).replace('T','_').replace(':','-');
        const filename = `bureau_${timestamp}`;

        if (format === 'pdf') {
            if (!window.jspdf) {
                await new Promise((res, rej) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    s.onload = res; s.onerror = rej;
                    document.head.appendChild(s);
                });
            }
            const { jsPDF } = window.jspdf;
            const W = canvas.width, H = canvas.height;
            const pdfW = W * 0.75, pdfH = H * 0.75; // px → pt
            const pdf = new jsPDF({
                orientation: W > H ? 'landscape' : 'portrait',
                unit: 'pt',
                format: [pdfW, pdfH]
            });
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfW, pdfH);
            pdf.save(filename + '.pdf');
        } else {
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const quality  = format === 'png' ? 1 : 0.92;
            const dataUrl  = canvas.toDataURL(mimeType, quality);
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename + '.' + format;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
        toast.textContent = '✅ Capture enregistrée !';
        setTimeout(() => toast.remove(), 2000);
    } catch(err) {
        console.error('[captureBoard]', err);
        toast.textContent = '❌ Erreur : ' + err.message;
        setTimeout(() => toast.remove(), 3000);
    }
}

// NOUVEAU MENU FLOTTANT
// =========================================================================
function toggleMenuTheme() {
    const isLight = document.body.classList.toggle('menu-light');
    const btn = document.getElementById('menu-theme-btn');
    if (btn) {
        btn.innerHTML = isLight
            ? '<span class="mm-ico">🌙</span><span>&nbsp;&nbsp;Mode sombre</span>'
            : '<span class="mm-ico">☀️</span><span>&nbsp;&nbsp;Mode clair</span>';
    }
    localStorage.setItem('menuTheme', isLight ? 'light' : 'dark');
}

function toggleMainMenu() {
    const menu = document.getElementById('main-menu');
    const fab  = document.getElementById('fab-btn');
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
        closeMainMenu();
    } else {
        menu.classList.add('open');
        fab.classList.add('menu-open');
        setTimeout(_fixSubmenuOverflow, 0);
    }
}

function closeMainMenu() {
    document.getElementById('main-menu').classList.remove('open');
    document.getElementById('fab-btn').classList.remove('menu-open');
}

function _closeAllToolbars() {
    if (typeof stopDrawing      === 'function') stopDrawing();
    if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    if (typeof stopEraserMode   === 'function') stopEraserMode();
}

function openMmPanel(type) {
    closeMainMenu();
    if (type === 'draw') {
        if (typeof toggleDrawToolbar === 'function') toggleDrawToolbar();
        // Vérifier l'orientation après affichage (la toolbar vient d'être rendue visible)
        requestAnimationFrame(function() {
            if (typeof autoOrientDrawToolbar === 'function') autoOrientDrawToolbar();
        });
    } else if (type === 'shapes') {
        if (typeof toggleShapeToolbar === 'function') toggleShapeToolbar();
    }
    _updateDrawFabBtn();
}

function closeMmPanel() {
    if (typeof stopDrawing    === 'function') stopDrawing();
    if (typeof stopEraserMode === 'function') stopEraserMode();
    if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    _updateDrawFabBtn();
}

function _updateDrawFabBtn() {
    const btn = document.getElementById('draw-fab-btn');
    if (!btn) return;
    const tb = document.getElementById('draw-toolbar');
    const isOpen = tb && tb.style.display !== 'none';
    btn.classList.toggle('draw-open', isOpen);
}

// Fermer le menu au clic extérieur
document.addEventListener('mousedown', function(e) {
    const menu = document.getElementById('main-menu');
    const fab  = document.getElementById('fab-btn');
    // Ne pas fermer le menu si on clique sur le cpick board-bg ou son popup
    const boardBgPop = document.getElementById('cpick-pop-board-bg');
    const isBoardBgClick = e.target.closest('#cpick-board-bg') || (boardBgPop && boardBgPop.contains(e.target));
    if (!isBoardBgClick && !fab.contains(e.target) && !menu.contains(e.target)) {
        if (menu.classList.contains('open')) closeMainMenu();
    }
    // Fermer les color pickers si clic en dehors
    if (!e.target.closest('.cpick-wrap') && !e.target.closest('.cpick-popup')) {
        document.querySelectorAll('.cpick-popup.open').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.cpick-active').forEach(p => p.classList.remove('cpick-active'));
    }
    // Fermer le panneau Activités si clic en dehors
    const actPanel = document.getElementById('activities-panel');
    const actTab   = document.getElementById('activities-panel-tab');
    if (actPanel && actPanel.classList.contains('act-panel-open')) {
        if (!actPanel.contains(e.target) && !(actTab && actTab.contains(e.target))) {
            actPanel.classList.remove('act-panel-open');
            if (actTab) actTab.classList.remove('act-panel-tab-open');
        }
    }
});

// Fermer les barres d'outils quand on clique sur un item du menu
// (sauf les items Dessin et Formes qui les ouvrent)
document.addEventListener('click', function(e) {
    const item = e.target.closest('.mm-item, .mm-sub-item');
    if (!item) return;
    const triggersToolbar = item.id === 'mm-draw-btn' || item.id === 'mm-shapes-btn'
        || item.closest('#mm-panel-draw') || item.closest('#mm-panel-shapes');
    if (!triggersToolbar) {
        _closeAllToolbars();
    }
});

// =========================================================================
// BARRE D'ACTION — positionnement dessous/dessus selon l'espace disponible
// =========================================================================
function positionActionBar(widget) {
    const bar = widget.querySelector('.widget-action-bar');
    if (!bar) return;
    const boardH = board.offsetHeight;
    const wBottom = widget.offsetTop + widget.offsetHeight;
    if (boardH - wBottom < 50) bar.classList.add('above');
    else                       bar.classList.remove('above');
}

document.addEventListener('focusin', (e) => {
    const widget = e.target.closest('.widget, .shape-widget');
    if (widget) positionActionBar(widget);
});

// =========================================================================
// MODE PRÉSENTATION
// =========================================================================
function togglePresentationMode() {
    const isOn = !document.body.classList.contains('presentation-mode');
    const btn  = document.getElementById('presentation-btn');
    if (isOn) {
        document.body.classList.add('presentation-mode');
        btn.innerHTML = '📽️ Quitter';
        closeMainMenu();
        if (typeof stopDrawing      === 'function') stopDrawing();
        if (typeof stopEraserMode   === 'function') stopEraserMode();
        if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
        clearSelection();
        const el = document.documentElement;
        if (el.requestFullscreen)            el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 150);
    } else {
        document.body.classList.remove('presentation-mode');
        btn.innerHTML = '📽️';
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen)            document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
        if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 150);
    }
}

// ── MODE A4 PORTRAIT ──────────────────────────────────────────────────────
function toggleA4Mode() {
    const isOn = !document.body.classList.contains('a4-mode');
    const btn  = document.getElementById('a4-mode-btn');
    document.body.classList.toggle('a4-mode', isOn);
    if (btn) btn.classList.toggle('active', isOn);

    if (isOn) {
        // Dimensionner le board en A4 portrait pleine largeur
        const w = window.innerWidth;
        const h = Math.round(w * 1.4142);
        board.style.width    = w + 'px';
        board.style.height   = h + 'px';
        board.style.position = 'relative';
        board.style.top      = '0';
        board.style.left     = '0';
        // Masquer la ligne limite présentation
        const line = document.getElementById('pres-limit-line');
        if (line) line.style.display = 'none';
    } else {
        // Restaurer le mode normal
        board.style.position = '';
        board.style.top      = '';
        board.style.left     = '';
        board.style.width    = '';
        board.style.height   = '';
        applyBoardRatio(window.innerWidth);
        updatePresLimitLine();
    }

    if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 150);
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && document.body.classList.contains('presentation-mode')) {
        document.body.classList.remove('presentation-mode');
        document.getElementById('presentation-btn').innerHTML = '📽️';
        if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 150);
    }
    if (!document.fullscreenElement && window._fsWidgetSnapshot) {
        var snap = window._fsWidgetSnapshot;
        window._fsWidgetSnapshot = null;
        setTimeout(function() {
            snap.container.style.width  = snap.cW;
            snap.container.style.height = snap.cH;
            ['width','height','top','left','right','bottom','transform',
             'maxWidth','maxHeight','minWidth','minHeight','position'].forEach(function(p) {
                snap.widget.style[p] = snap.wStyle[p];
            });
        }, 50);
    }
});
document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && document.body.classList.contains('presentation-mode')) {
        document.body.classList.remove('presentation-mode');
        document.getElementById('presentation-btn').innerHTML = '📽️';
        if (typeof resizeCanvas === 'function') setTimeout(resizeCanvas, 150);
    }
});

function _fixSubmenuOverflow() {
    document.querySelectorAll('.mm-sub').forEach(sub => {
        sub.style.left  = '';
        sub.style.right = '';
        const r = sub.getBoundingClientRect();
        if (r.right > document.documentElement.clientWidth - 8) {
            sub.style.left  = 'auto';
            sub.style.right = '100%';
        }
    });
}

// Mise à jour du bouton gomme dans le panneau dessin
// =========================================================================
// SOUS-MENUS COLLANTS — restent ouverts jusqu'à changement ou clic bureau
// =========================================================================
(function () {

    // Positionne un sous-menu (fixed) à droite de son item parent
    function positionSub(sub, item) {
        const margin = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const pr = item.getBoundingClientRect();
        const inner = sub.querySelector('.mm-sub-inner');

        if (inner) inner.style.maxHeight = (vh - margin * 2) + 'px';

        // Mesurer les dimensions du sous-menu
        const subW = sub.offsetWidth || 220;
        const subH = sub.offsetHeight || 100;

        // Horizontal : à droite de l'item, repli à gauche si débordement
        // +10 uniquement pour le niveau 1 (item direct du main-menu)
        const gap = item.closest('.mm-sub') ? 7 : 10;
        let left = pr.right + gap;
        if (left + subW > vw - margin) left = pr.left - subW;
        left = Math.max(margin, left);

        // Vertical : centré sur l'item, recalé dans le viewport
        let top = pr.top + pr.height / 2 - subH / 2;
        top = Math.max(margin, Math.min(top, vh - subH - margin));

        sub.style.transform = '';
        sub.style.left = left + 'px';
        sub.style.top  = top  + 'px';
    }

    // Ouvre le sous-menu direct d'un item et ferme tous les autres non-ancêtres
    function openSub(item) {
        const sub = item.querySelector(':scope > .mm-sub');
        if (!sub) return;
        document.querySelectorAll('.mm-sub.open').forEach(function (s) {
            if (s !== sub && !s.contains(item)) s.classList.remove('open');
        });
        sub.classList.add('open');
        positionSub(sub, item);
    }

    // Ferme tous les sous-menus ouverts
    function closeAllSubs() {
        document.querySelectorAll('.mm-sub.open').forEach(function (s) {
            s.classList.remove('open');
            s.style.top = '';
            s.style.transform = '';
        });
    }

    document.addEventListener('DOMContentLoaded', function () {

        document.getElementById('main-menu').addEventListener('mouseenter', function (e) {
            let node = e.target;
            while (node && node !== this) {
                if (node.classList && (node.classList.contains('mm-item') || node.classList.contains('mm-sub-item'))) {
                    if (node.classList.contains('mm-has-sub')) {
                        openSub(node);
                    } else {
                        document.querySelectorAll('.mm-sub.open').forEach(function (s) {
                            if (!s.contains(node)) s.classList.remove('open');
                        });
                    }
                    return;
                }
                node = node.parentElement;
            }
        }, true);

        document.addEventListener('mousedown', function (e) {
            if (!e.target.closest('#main-menu')) {
                closeAllSubs();
            }
        });

        // Fermeture du menu principal → ferme les sous-menus
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            new MutationObserver(function () {
                if (!mainMenu.classList.contains('open')) closeAllSubs();
            }).observe(mainMenu, { attributes: true, attributeFilter: ['class'] });
        }
    });
})();

function _setDrawColor(hex) {
    window._drawColor = hex;
    if (typeof cpickSet === 'function') {
        cpickInit('draw-color', hex);
        cpickSet('draw-color', hex, true);
    }
}

function _updateEraserBtnInPanel() {
    const btn1 = document.getElementById('eraser-btn');
    const btn2 = document.getElementById('eraser-btn-shapes');
    const bg    = isEraserMode ? '#1a3550' : '#2a2a2e';
    const bc    = isEraserMode ? '#4a90e2' : '#444';
    const color = isEraserMode ? '#7ab8f5' : '#888';
    if (btn1) { btn1.style.background = bg; btn1.style.borderColor = bc; btn1.style.color = color; btn1.style.boxShadow = isEraserMode ? '0 0 8px rgba(74,144,226,0.5)' : 'none'; }
    if (btn2) {
        btn2.style.background   = isEraserMode ? '#1a3550' : '#2a2a36';
        btn2.style.borderColor  = bc;
        btn2.style.color        = isEraserMode ? '#7ab8f5' : '#ccc';
        btn2.style.boxShadow    = isEraserMode ? '0 0 8px rgba(74,144,226,0.5)' : 'none';
        btn2.title = isEraserMode ? 'Gomme active — cliquer pour désactiver' : 'Activer la gomme';
    }
    // Sync eraser-size label in shapes toolbar
    const sizeEl = document.getElementById('eraser-size');
    const shapesLabel = document.getElementById('eraser-size-shapes-label');
    if (sizeEl && shapesLabel) shapesLabel.textContent = sizeEl.value;
}

