// =========================================================================
// WIDGET REPRODUCTION SUR QUADRILLAGE — Le Bureau du Prof
// Mode professeur uniquement : dessiner un modèle sur quadrillage
// et générer un PDF prêt à imprimer.
//
// Outils : ligne, cercle, remplissage (polygone), gomme
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
(function () {

    // Boutons fenêtre macOS (partagés, injectés par widget-monnaie si déjà présents)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top          = MARGIN_TOP + 'px';
            widget.style.left         = occupiedX + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.zIndex       = '9000';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.display      = 'block';
            widget.style.overflow     = 'hidden';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');
            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    if (document.getElementById('rq-style')) return;
    const s = document.createElement('style');
    s.id = 'rq-style';
    s.textContent = `
        /* ── Widget wrapper ── */
        .widget[data-type="repro-quadrillage"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .rq-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 12px 14px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 520px;
        }

        /* ── En-tête ── */
        .rq-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .rq-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex: 1;
        }

        /* ── Barre d'outils ── */
        .rq-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            background: #f3f4f6;
            border-radius: 10px;
            padding: 6px 8px;
        }
        .rq-tool-btn {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            border: 1.5px solid #e5e7eb;
            background: #fff;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background .12s, border-color .12s, transform .1s;
            flex-shrink: 0;
        }
        .rq-tool-btn:hover { background: #e5e7eb; }
        .rq-tool-btn:active { transform: scale(0.93); }
        .rq-tool-btn.active {
            background: #3b82f6;
            border-color: #2563eb;
            color: #fff;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
        }
        .rq-tool-btn.active-gomme {
            background: #f97316;
            border-color: #ea580c;
            color: #fff;
            box-shadow: 0 0 0 2px rgba(249,115,22,0.3);
        }
        .rq-toolbar-sep {
            width: 1px;
            height: 22px;
            background: #d1d5db;
            margin: 0 2px;
            flex-shrink: 0;
        }
        .rq-fillcolor-wrap {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }
        .rq-fillcolor-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 1.5px solid #d1d5db;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
            transition: border-color .12s, transform .1s, box-shadow .12s;
        }
        .rq-fillcolor-btn:hover { transform: scale(1.1); }
        .rq-fillcolor-btn.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
        }
        .rq-gridsize-wrap {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: auto;
        }
        .rq-gridsize-label {
            font-size: 10px;
            color: #6b7280;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }
        /* Boutons +/− pour stylet */
        .rq-gridsize-stepper {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .rq-gridsize-btn {
            width: 26px; height: 26px;
            border-radius: 6px;
            border: 1.5px solid #d1d5db;
            background: #fff;
            font-size: 16px;
            font-weight: 900;
            color: #374151;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            line-height: 1;
            transition: background .12s, transform .1s;
            flex-shrink: 0;
            touch-action: manipulation;
        }
        .rq-gridsize-btn:hover { background: #e5e7eb; }
        .rq-gridsize-btn:active { transform: scale(0.9); background: #d1d5db; }
        .rq-gridsize-val {
            min-width: 30px;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            user-select: none;
        }
        /* Champ caché conservé pour compatibilité JS */
        .rq-gridsize-input {
            display: none;
        }

        /* ── Zone SVG grille ── */
        .rq-svg-zone {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px;
            overflow: hidden;
        }
        .rq-svg {
            background: white;
            display: block;
            border: 1px solid #e5e7eb;
            touch-action: none;
            cursor: crosshair;
            max-width: 100%;
            height: auto;
        }
        .rq-svg.cursor-gomme {
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🧽</text></svg>") 16 16, pointer !important;
        }
        .rq-grid-line { stroke: #e5e7eb; stroke-width: 1; }
        .rq-grid-main { stroke: #9ca3af; stroke-width: 2; }

        /* ── Actions admin (export) ── */
        .rq-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
        }
        .rq-action-btn {
            padding: 5px 11px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .rq-action-btn:active { transform: scale(0.96); }
        .rq-btn-pdf {
            background: #3b82f6;
            color: white;
        }
        .rq-btn-pdf:hover { background: #2563eb; }
        .rq-btn-save {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .rq-btn-save:hover { background: #e0e0e0; }
        .rq-btn-load {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
            cursor: pointer;
        }
        .rq-btn-load:hover { background: #e0e0e0; }

        /* ── Bouton aide ── */
        .rq-help-btn {
            width: 22px; height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .rq-help-btn:hover { background: #e0e0e0; color: #333; }
        .rq-help-popup {
            display: none;
            position: absolute;
            top: 40px; right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 270px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.6;
        }
        .rq-help-popup.show { display: block; }
        .rq-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .rq-help-section { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .rq-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Fullboard ── */
        .rq-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        .rq-container.wf-fullboard .rq-svg-zone {
            flex: 1;
        }

        /* ── Resize handle ── */
        .rq-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .rq-container:hover .rq-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Constante interne SVG ─────────────────────────────────────────────────
const RQ_INTERNAL_SIZE = 600;

// ── Création du widget ────────────────────────────────────────────────────
function createReproQuadrillageWidget(savedData) {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'repro-quadrillage';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
    widget.tabIndex = 0;

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'rq-container';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'rq-header';
    header.innerHTML = `
        <span class="rq-title">📐 Reproduction sur quadrillage</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;

    // Bouton aide (inséré avant les wf-btns)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'rq-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    header.querySelector('.wf-btns').insertBefore(helpBtn, header.querySelector('.wf-btn-min'));
    container.appendChild(header);

    // ── Popup aide ────────────────────────────────────────────────────────
    const helpPopup = document.createElement('div');
    helpPopup.className = 'rq-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Mode d'emploi</h4>
        <div class="rq-help-section">
            <strong>📏 Ligne</strong><br>
            Cliquez sur un point de la grille, déplacez la souris, recliquez pour tracer.
        </div>
        <div class="rq-help-section">
            <strong>⭕ Cercle</strong><br>
            Cliquez sur le centre, puis cliquez pour définir le rayon.
        </div>
        <div class="rq-help-section">
            <strong>🎨 Remplissage</strong><br>
            Cliquez sur chaque sommet de la forme. Refermez en recliquant sur le premier point.
        </div>
        <div class="rq-help-section">
            <strong>🧽 Gomme</strong><br>
            Cliquez sur un tracé pour le supprimer.
        </div>
        <div class="rq-help-section">
            <strong>📄 PDF</strong><br>
            Génère une fiche imprimable avec le modèle et une grille vierge (3 exemplaires).
        </div>
    `;
    container.appendChild(helpPopup);

    // ── Barre d'outils ────────────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.className = 'rq-toolbar';
    toolbar.innerHTML = `
        <button class="rq-tool-btn active" data-tool="line" title="Tracer une ligne">📏</button>
        <button class="rq-tool-btn" data-tool="circle" title="Tracer un cercle">⭕</button>
        <button class="rq-tool-btn" data-tool="fill" title="Remplir une zone">🎨</button>
        <div class="rq-fillcolor-wrap">
            <button type="button" class="rq-fillcolor-btn active" data-fillcolor="light" title="Gris clair" style="background:#d9d9d9;"></button>
            <button type="button" class="rq-fillcolor-btn" data-fillcolor="dark" title="Gris foncé" style="background:#8a8f98;"></button>
        </div>
        <div class="rq-toolbar-sep"></div>
        <button class="rq-tool-btn" id="rq-undo-btn" title="Annuler">↩</button>
        <button class="rq-tool-btn" id="rq-redo-btn" title="Refaire">↪</button>
        <button class="rq-tool-btn" id="rq-gomme-btn" data-tool="gomme" title="Gomme">🧽</button>
        <button class="rq-tool-btn" id="rq-clear-btn" title="Vider la grille">🗑️</button>
        <div class="rq-toolbar-sep"></div>
        <div class="rq-gridsize-wrap">
            <span class="rq-gridsize-label">Carreaux :</span>
            <div class="rq-gridsize-stepper">
                <button class="rq-gridsize-btn" data-step="-1" title="Moins de carreaux">−</button>
                <span class="rq-gridsize-val">10</span>
                <button class="rq-gridsize-btn" data-step="1" title="Plus de carreaux">+</button>
            </div>
            <input type="number" class="rq-gridsize-input" value="10" min="5" max="20" step="1" title="Nombre de carreaux">
        </div>
    `;
    container.appendChild(toolbar);

    // ── Zone SVG ──────────────────────────────────────────────────────────
    const svgZone = document.createElement('div');
    svgZone.className = 'rq-svg-zone';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('rq-svg');
    svg.setAttribute('viewBox', `0 0 ${RQ_INTERNAL_SIZE} ${RQ_INTERNAL_SIZE}`);
    svg.style.width  = '470px';
    svg.style.height = '470px';
    svgZone.appendChild(svg);
    container.appendChild(svgZone);

    // ── Actions admin ─────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'rq-actions';
    actions.innerHTML = `
        <button class="rq-action-btn rq-btn-save" title="Sauvegarder dans un fichier">💾 Sauvegarder</button>
        <label class="rq-action-btn rq-btn-load" title="Charger un fichier">
            📂 Charger
            <input type="file" accept=".json,.txt" style="display:none">
        </label>
        <button class="rq-action-btn rq-btn-pdf" title="Générer le PDF">📄 PDF</button>
    `;
    container.appendChild(actions);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'rq-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAT INTERNE
    // ══════════════════════════════════════════════════════════════════════
    let currentTool   = 'line';
    let isGommeActive = false;
    let lastPoint     = null;
    let fillPoints    = [];
    let currentFillColor = 'light';
    const RQ_FILL_COLORS = { light: 'rgba(0,0,0,0.15)', dark: 'rgba(0,0,0,0.5)' };
    let undoStack     = [];
    let redoStack     = [];
    let helpLayer     = {};
    const gridSizeInput = toolbar.querySelector('.rq-gridsize-input');

    // ── Création d'éléments SVG ───────────────────────────────────────────
    function createSVGEl(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }

    // ── Initialisation de la grille ───────────────────────────────────────
    function initGrid(gridSizeVal) {
        const size = parseInt(gridSizeVal) || 10;
        const cell = RQ_INTERNAL_SIZE / size;
        svg.dataset.computedCell = cell;
        // Supprimer uniquement lignes de grille et help-layer (pas les tracés)
        svg.querySelectorAll('.rq-grid-el, #rq-help-layer').forEach(el => el.remove());

        // Lignes de grille
        const frag = document.createDocumentFragment();
        for (let i = 0; i <= size; i++) {
            const pos = i * cell;
            const cls = (i === 0 || i === size) ? 'rq-grid-main' : 'rq-grid-line';
            const lh = createSVGEl('line', { x1: 0, y1: pos, x2: RQ_INTERNAL_SIZE, y2: pos, class: cls + ' rq-grid-el' });
            const lv = createSVGEl('line', { x1: pos, y1: 0, x2: pos, y2: RQ_INTERNAL_SIZE, class: cls + ' rq-grid-el' });
            frag.appendChild(lh);
            frag.appendChild(lv);
        }
        svg.insertBefore(frag, svg.firstChild);

        // Couche d'aide visuelle
        const helpGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        helpGroup.id = 'rq-help-layer';
        helpLayer = {
            ghostLine: createSVGEl('line', { stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            ghostCircle: createSVGEl('circle', { fill: 'none', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            ghostPath: createSVGEl('path', { fill: 'rgba(0,0,0,0.1)', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            hoverDot: createSVGEl('circle', { r: '6', fill: 'rgba(0,0,0,0.2)' }),
            anchorDot: createSVGEl('circle', { r: '6', fill: 'black', visibility: 'hidden' })
        };
        Object.values(helpLayer).forEach(el => helpGroup.appendChild(el));
        svg.appendChild(helpGroup);
    }

    // ── Coordonnées snappées à la grille ─────────────────────────────────
    function getCoords(e) {
        const cell = parseFloat(svg.dataset.computedCell);
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
        return {
            x: Math.round((((clientX - rect.left) / rect.width)  * RQ_INTERNAL_SIZE) / cell) * cell,
            y: Math.round((((clientY - rect.top)  / rect.height) * RQ_INTERNAL_SIZE) / cell) * cell
        };
    }

    // ── Reset aide visuelle ───────────────────────────────────────────────
    function resetAide() {
        if (helpLayer.anchorDot)  helpLayer.anchorDot.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostLine)  helpLayer.ghostLine.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostCircle)helpLayer.ghostCircle.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostPath)  helpLayer.ghostPath.setAttribute('visibility', 'hidden');
        lastPoint  = null;
        fillPoints = [];
    }

    // ── Sélection d'outil ─────────────────────────────────────────────────
    function setTool(tool) {
        currentTool   = tool;
        isGommeActive = false;
        svg.classList.remove('cursor-gomme');
        svg.style.cursor = 'crosshair';
        resetAide();
        updateToolButtons();
    }

    function toggleGomme() {
        isGommeActive = !isGommeActive;
        resetAide();
        if (isGommeActive) {
            svg.classList.add('cursor-gomme');
        } else {
            svg.classList.remove('cursor-gomme');
            svg.style.cursor = 'crosshair';
        }
        updateToolButtons();
    }

    function updateToolButtons() {
        toolbar.querySelectorAll('.rq-tool-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active', 'active-gomme');
            if (btn.dataset.tool === 'gomme') {
                if (isGommeActive) btn.classList.add('active-gomme');
            } else if (btn.dataset.tool === currentTool && !isGommeActive) {
                btn.classList.add('active');
            }
        });
    }

    // ── Gestion pointer down ──────────────────────────────────────────────
    function handlePointerDown(e) {
        if (isGommeActive) {
            const group = e.target.closest('.rq-line-group');
            if (group) {
                undoStack.push({ type: 'erase', element: group });
                svg.removeChild(group);
                redoStack = [];
                autoSave();
            }
            return;
        }

        const c = getCoords(e);
        const helpLayerEl = svg.querySelector('#rq-help-layer');

        if (currentTool === 'fill') {
            if (fillPoints.length > 0 && c.x === fillPoints[0].x && c.y === fillPoints[0].y) {
                if (fillPoints.length >= 3) {
                    const d = fillPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                    const group = createSVGEl('g', { class: 'rq-line-group' });
                    group.appendChild(createSVGEl('path', { d, fill: 'transparent', class: 'rq-eraser-zone', style: 'pointer-events:all;' }));
                    group.appendChild(createSVGEl('path', { d, fill: RQ_FILL_COLORS[currentFillColor] || RQ_FILL_COLORS.light, stroke: 'black', 'stroke-width': '4', 'stroke-linejoin': 'round', style: 'pointer-events:all;' }));
                    svg.insertBefore(group, helpLayerEl);
                    undoStack.push({ type: 'draw', element: group });
                    fillPoints = [];
                    helpLayer.ghostPath.setAttribute('visibility', 'hidden');
                    helpLayer.anchorDot.setAttribute('visibility', 'hidden');
                    autoSave();
                }
            } else {
                fillPoints.push(c);
                helpLayer.anchorDot.setAttribute('cx', c.x);
                helpLayer.anchorDot.setAttribute('cy', c.y);
                helpLayer.anchorDot.setAttribute('visibility', 'visible');
            }
            return;
        }

        if (!lastPoint) {
            lastPoint = c;
            helpLayer.anchorDot.setAttribute('cx', c.x);
            helpLayer.anchorDot.setAttribute('cy', c.y);
            helpLayer.anchorDot.setAttribute('visibility', 'visible');
        } else {
            const group = createSVGEl('g', { class: 'rq-line-group' });
            if (currentTool === 'line') {
                group.appendChild(createSVGEl('line', { x1: lastPoint.x, y1: lastPoint.y, x2: c.x, y2: c.y, stroke: 'transparent', 'stroke-width': '30', class: 'rq-eraser-zone' }));
                group.appendChild(createSVGEl('line', { x1: lastPoint.x, y1: lastPoint.y, x2: c.x, y2: c.y, stroke: 'black', 'stroke-width': '4', 'stroke-linecap': 'round' }));
            } else if (currentTool === 'circle') {
                const r = Math.sqrt(Math.pow(c.x - lastPoint.x, 2) + Math.pow(c.y - lastPoint.y, 2));
                group.appendChild(createSVGEl('circle', { cx: lastPoint.x, cy: lastPoint.y, r, stroke: 'transparent', 'stroke-width': '20', fill: 'none', class: 'rq-eraser-zone' }));
                group.appendChild(createSVGEl('circle', { cx: lastPoint.x, cy: lastPoint.y, r, stroke: 'black', 'stroke-width': '4', fill: 'none' }));
            }
            svg.insertBefore(group, helpLayerEl);
            undoStack.push({ type: 'draw', element: group });
            lastPoint = null;
            helpLayer.anchorDot.setAttribute('visibility', 'hidden');
            helpLayer.ghostLine.setAttribute('visibility', 'hidden');
            helpLayer.ghostCircle.setAttribute('visibility', 'hidden');
            autoSave();
        }
    }

    function handlePointerMove(e) {
        if (isGommeActive) return;
        const c = getCoords(e);
        helpLayer.hoverDot.setAttribute('cx', c.x);
        helpLayer.hoverDot.setAttribute('cy', c.y);
        if (currentTool === 'fill' && fillPoints.length > 0) {
            helpLayer.ghostPath.setAttribute('d', fillPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ` L ${c.x} ${c.y} Z`);
            helpLayer.ghostPath.setAttribute('visibility', 'visible');
        } else if (lastPoint) {
            if (currentTool === 'line') {
                helpLayer.ghostLine.setAttribute('x1', lastPoint.x); helpLayer.ghostLine.setAttribute('y1', lastPoint.y);
                helpLayer.ghostLine.setAttribute('x2', c.x); helpLayer.ghostLine.setAttribute('y2', c.y);
                helpLayer.ghostLine.setAttribute('visibility', 'visible');
            } else if (currentTool === 'circle') {
                const r = Math.sqrt(Math.pow(c.x - lastPoint.x, 2) + Math.pow(c.y - lastPoint.y, 2));
                helpLayer.ghostCircle.setAttribute('cx', lastPoint.x); helpLayer.ghostCircle.setAttribute('cy', lastPoint.y);
                helpLayer.ghostCircle.setAttribute('r', r);
                helpLayer.ghostCircle.setAttribute('visibility', 'visible');
            }
        }
    }

    // ── Undo / Redo ───────────────────────────────────────────────────────
    function undo() {
        if (!undoStack.length) return;
        const a = undoStack.pop();
        redoStack.push(a);
        if (a.type === 'draw') svg.removeChild(a.element);
        else svg.insertBefore(a.element, svg.querySelector('#rq-help-layer'));
        autoSave();
    }
    function redo() {
        if (!redoStack.length) return;
        const a = redoStack.pop();
        undoStack.push(a);
        if (a.type === 'draw') svg.insertBefore(a.element, svg.querySelector('#rq-help-layer'));
        else svg.removeChild(a.element);
        autoSave();
    }

    // ── Vider ─────────────────────────────────────────────────────────────
    function clearGrid() {
        if (!confirm('Effacer tout le dessin ?')) return;
        svg.querySelectorAll('.rq-line-group').forEach(g => svg.removeChild(g));
        undoStack = []; redoStack = [];
        lastPoint = null; fillPoints = [];
        resetAide();
        autoSave();
    }

    // ── Sauvegarde auto (dans le board) ───────────────────────────────────
    function autoSave() {
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Récupérer les données pour save-load ─────────────────────────────
    function getData() {
        return {
            gridSize:   parseInt(gridSizeInput.value) || 10,
            svgW:       parseInt(svg.style.width)  || 470,
            shapes:     Array.from(svg.querySelectorAll('.rq-line-group')).map(g => g.outerHTML)
        };
    }

    // ── Appliquer les données restaurées ─────────────────────────────────
    function setData(data) {
        if (!data) return;
        if (data.gridSize) {
            gridSizeInput.value = data.gridSize;
            if (gridSizeVal) gridSizeVal.textContent = data.gridSize;
        }
        if (data.svgW) { svg.style.width = data.svgW + 'px'; svg.style.height = data.svgW + 'px'; }
        initGrid(gridSizeInput.value);
        if (data.shapes && data.shapes.length) {
            const helpLayerEl = svg.querySelector('#rq-help-layer');
            data.shapes.forEach(html => {
                if (helpLayerEl) helpLayerEl.insertAdjacentHTML('beforebegin', html);
                else svg.insertAdjacentHTML('beforeend', html);
            });
        }
        undoStack = []; redoStack = [];
    }

    // ── Export JSON ───────────────────────────────────────────────────────
    function exportFile() {
        const data = getData();
        const date = new Date();
        const ds   = date.getFullYear() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0');
        const name = `lebureauduprof_repro_quadrillage_${ds}.json`;
        const json = JSON.stringify(data);
        if (window.Android && typeof window.Android.exportTxt === 'function') {
            window.Android.exportTxt(json, name);
        } else {
            const a2 = document.createElement('a');
            a2.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(json);
            a2.download = name;
            document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
        }
    }

    // ── Import JSON ───────────────────────────────────────────────────────
    function importFile(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.gridSize || !Array.isArray(data.shapes)) { alert('Fichier invalide.'); return; }
                // Effacer l'existant
                svg.querySelectorAll('.rq-line-group').forEach(g => svg.removeChild(g));
                setData(data);
                autoSave();
            } catch(err) { alert('Erreur : fichier invalide.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ── Export PDF (3 exemplaires modèle + grille vierge) ────────────────
    async function exportPDF() {
        if (!window.jspdf) {
            // Charger jsPDF dynamiquement si absent
            await new Promise((res, rej) => {
                const sc = document.createElement('script');
                sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                sc.onload = res; sc.onerror = rej;
                document.head.appendChild(sc);
            });
        }
        const { jsPDF } = window.jspdf;

        // Masquer les aides visuelles temporairement
        if (helpLayer.hoverDot) helpLayer.hoverDot.setAttribute('visibility', 'hidden');
        if (helpLayer.anchorDot) helpLayer.anchorDot.setAttribute('visibility', 'hidden');

        const captureSVG = async (hideShapes) => {
            svg.querySelectorAll('.rq-line-group').forEach(g => g.style.display = hideShapes ? 'none' : '');
            const clone = svg.cloneNode(true);
            // Forcer les couleurs de grille pour l'impression
            clone.querySelectorAll('.rq-grid-line').forEach(l => l.setAttribute('stroke', '#b0b8c4'));
            clone.querySelectorAll('.rq-grid-main').forEach(l => l.setAttribute('stroke', '#6b7280'));
            const xml = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            return new Promise(resolve => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1200;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1200, 1200);
                    ctx.drawImage(img, 0, 0, 1200, 1200);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
            });
        };

        const dataModel = await captureSVG(false);
        const dataEmpty = await captureSVG(true);
        svg.querySelectorAll('.rq-line-group').forEach(g => g.style.display = '');
        if (helpLayer.hoverDot) helpLayer.hoverDot.setAttribute('visibility', 'visible');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgSize = 70, marginL = 20, gap = 15, startY = 20, rowGap = 15;
        for (let i = 0; i < 3; i++) {
            const y = startY + i * (imgSize + rowGap);
            pdf.setFontSize(8); pdf.setTextColor(150);
            pdf.text('MODÈLE', marginL, y - 3);
            pdf.text('À REPRODUIRE', marginL + imgSize + gap, y - 3);
            pdf.addImage(dataModel, 'PNG', marginL, y, imgSize, imgSize);
            pdf.addImage(dataEmpty, 'PNG', marginL + imgSize + gap, y, imgSize, imgSize);
        }

        const date = new Date();
        const ds   = date.getFullYear() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0');
        const name = `lebureauduprof_repro_quadrillage_${ds}.pdf`;
        if (window.Android && typeof window.Android.savePdfFromBase64 === 'function') {
            window.Android.savePdfFromBase64(pdf.output('datauristring').split(',')[1], name);
        } else {
            pdf.save(name);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════════════

    // Outils
    toolbar.querySelectorAll('.rq-tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.dataset.tool === 'gomme') toggleGomme();
            else setTool(btn.dataset.tool);
        });
    });
    toolbar.querySelector('#rq-undo-btn').addEventListener('click', (e) => { e.stopPropagation(); undo(); });
    toolbar.querySelector('#rq-redo-btn').addEventListener('click', (e) => { e.stopPropagation(); redo(); });
    toolbar.querySelector('#rq-clear-btn').addEventListener('click', (e) => { e.stopPropagation(); clearGrid(); });

    // Taille grille
    const gridSizeVal = toolbar.querySelector('.rq-gridsize-val');
    function applyGridSize() {
        if (gridSizeVal) gridSizeVal.textContent = gridSizeInput.value;
        svg.querySelectorAll('.rq-line-group').forEach(g => svg.removeChild(g));
        undoStack = []; redoStack = [];
        lastPoint = null; fillPoints = [];
        initGrid(gridSizeInput.value);
        autoSave();
    }
    gridSizeInput.addEventListener('change', applyGridSize);
    gridSizeInput.addEventListener('mousedown',   e => e.stopPropagation());
    gridSizeInput.addEventListener('click',       e => e.stopPropagation());
    gridSizeInput.addEventListener('pointerdown', e => e.stopPropagation());
    gridSizeInput.addEventListener('touchstart',  e => e.stopPropagation(), { passive: true });
    let _gridSizeDebounce = null;
    gridSizeInput.addEventListener('input', () => {
        clearTimeout(_gridSizeDebounce);
        _gridSizeDebounce = setTimeout(applyGridSize, 600);
    });
    // Boutons +/− (stylet-friendly)
    toolbar.querySelectorAll('.rq-gridsize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            if (btn._rqStepDone) { btn._rqStepDone = false; return; }
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 5;
            const max  = parseInt(gridSizeInput.max) || 20;
            const cur  = parseInt(gridSizeInput.value) || 10;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) { gridSizeInput.value = next; applyGridSize(); }
        });
        btn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 5;
            const max  = parseInt(gridSizeInput.max) || 20;
            const cur  = parseInt(gridSizeInput.value) || 10;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) { gridSizeInput.value = next; applyGridSize(); btn._rqStepDone = true; }
        });
        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('mousedown',   e => e.stopPropagation());
    });

    // Couleur de remplissage (gris clair / gris foncé)
    toolbar.querySelectorAll('.rq-fillcolor-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            currentFillColor = btn.dataset.fillcolor;
            toolbar.querySelectorAll('.rq-fillcolor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('mousedown',   e => e.stopPropagation());
    });

    // SVG interactions
    svg.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePointerDown(e); });
    svg.addEventListener('pointermove', (e) => { handlePointerMove(e); });

    // Actions admin
    actions.querySelector('.rq-btn-save').addEventListener('click', (e) => { e.stopPropagation(); exportFile(); });
    actions.querySelector('.rq-btn-pdf').addEventListener('click',  (e) => { e.stopPropagation(); exportPDF(); });
    actions.querySelector('input[type="file"]').addEventListener('change', importFile);

    // Aide
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Resize (poignée coin bas-droit)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = parseInt(svg.style.width)  || 470;
        document.onmousemove = (ev) => {
            const newW = Math.max(200, startW + ev.clientX - startX);
            svg.style.width  = newW + 'px';
            svg.style.height = newW + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; autoSave(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = parseInt(svg.style.width) || 470;
        function onMove(ev) {
            const t = ev.touches[0];
            const newW = Math.max(200, startW + t.clientX - startX);
            svg.style.width  = newW + 'px';
            svg.style.height = newW + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            autoSave();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre (min/max/close) ───────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedContainerW = null;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '📐 Repro. Quadrillage', {});
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedContainerW = container.style.width;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedContainerW) container.style.width = _savedContainerW;
            }
        });
    }
    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // Focus / bringToFront
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    // ── Init ──────────────────────────────────────────────────────────────
    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Initialiser ou restaurer
    if (savedData) {
        requestAnimationFrame(() => requestAnimationFrame(() => setData(savedData)));
    } else {
        initGrid(gridSizeInput.value);
    }

    // Exposer getData/setData pour save-load.js
    widget._rqGetData = getData;
    widget._rqSetData = setData;

    saveBoard();
    return widget;
}
