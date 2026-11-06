// =========================================================================
// WIDGET REPRODUCTION SUR QUADRILLAGE — Le Bureau du Prof
// Mode professeur uniquement : dessiner un modèle sur quadrillage
// et générer un PDF prêt à imprimer.
//
// Outils : ligne, cercle, pot de peinture (zone fermée), gomme
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
        /* Curseur pot de peinture (même dessin que l'outil de draw.js) */
        .rq-svg.cursor-bucket {
            cursor: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M6 12 L14 4 L23 13 L15 21 Z' fill='%23fff' stroke='%23000' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M6 12 L15 21' stroke='%23000' stroke-width='1.6'/%3E%3Cpath d='M23 13 C26 17 26 20 24 21 C22 22 21 19 23 13 Z' fill='%23888' stroke='%23000' stroke-width='1.2'/%3E%3Ccircle cx='3' cy='25' r='2.2' fill='%23000'/%3E%3C/svg%3E") 3 25, crosshair !important;
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
        /* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux,
           grille carrée qui tient dans l'écran */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rq-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                padding-left: 12px !important;
            }
            .rq-container.wf-fullboard .rq-svg {
                width: min(100%, calc(100dvh - 230px)) !important;
                height: auto !important;
                aspect-ratio: 1 / 1;
            }
        }
        .rq-container.wf-fullboard .rq-svg-zone {
            flex: 1;
            min-height: 0;
        }
        /* Plein écran (tous écrans, y compris tablette) : grille carrée qui tient dans l'écran */
        .rq-container.wf-fullboard .rq-svg {
            width: min(100%, calc(100vh - 230px)) !important;
            width: min(100%, calc(100dvh - 230px)) !important;
            height: auto !important;
            aspect-ratio: 1 / 1;
        }

        /* ── Tablette / écran tactile : cibles plus grandes ── */
        @media (pointer: coarse) {
            .rq-container .wf-btns { gap: 10px; }
            .rq-container .wf-btn { width: 22px; height: 22px; }
            .rq-container .wf-btn::after { font-size: 12px !important; font-weight: 900; color: rgba(0,0,0,0.55); line-height: 1; }
            .rq-container .wf-btn-min::after   { content: '−'; }
            .rq-container .wf-btn-max::after   { content: '⤢'; }
            .rq-container .wf-btn-close::after { content: '×'; }
            .rq-container .rq-help-btn { width: 26px; height: 26px; }
            .rq-container .rq-tool-btn { width: 36px; height: 36px; }
            .rq-container .rq-fillcolor-btn { width: 26px; height: 26px; }
            .rq-container .rq-resize-handle { opacity: 1; width: 26px; height: 26px; }
        }
        .rq-header button, .rq-toolbar button, .rq-actions button, .rq-actions label,
        .rq-confirm button { touch-action: manipulation; }

        /* ── Boîte de confirmation interne (confirm() est bloqué dans certaines WebView) ── */
        .rq-confirm {
            position: absolute;
            inset: 0;
            background: rgba(17,24,39,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
        }
        .rq-confirm-box {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.25);
            padding: 16px 18px;
            max-width: 280px;
            text-align: center;
            font-size: 14px;
            color: #374151;
            font-weight: 600;
        }
        .rq-confirm-btns { display: flex; gap: 10px; justify-content: center; margin-top: 14px; }
        .rq-confirm-btns button {
            padding: 9px 16px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            background: #f3f4f6;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }
        .rq-confirm-btns .rq-confirm-ok { background: #ef4444; border-color: #dc2626; color: #fff; }

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
// Marge blanche autour du quadrillage (unités SVG) : évite que les traits
// posés sur le bord extérieur soient coupés à moitié (et donc plus fins).
const RQ_PAD = 14;
const RQ_VIEW_SIZE = RQ_INTERNAL_SIZE + 2 * RQ_PAD;

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
            <strong>🪣 Pot de peinture</strong><br>
            Choisissez gris clair ou gris foncé, puis cliquez à l'intérieur d'une zone fermée par des traits pour la remplir. Recliquez avec l'autre gris pour changer la couleur.
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
        <button class="rq-tool-btn" data-tool="fill" title="Pot de peinture : remplir une zone fermée">🪣</button>
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
    svg.setAttribute('viewBox', `${-RQ_PAD} ${-RQ_PAD} ${RQ_VIEW_SIZE} ${RQ_VIEW_SIZE}`);
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

    // ── Tap fiable souris / doigt / stylet ────────────────────────────────
    // Sur tablette, le « click » synthétique est souvent annulé par la
    // gestion du déplacement du widget (preventDefault sur touchstart /
    // pointerdown, capture du pointeur). On déclenche donc l'action au
    // pointerup sur le bouton, et on ignore le click qui suit éventuellement.
    function onTap(el, fn) {
        if (!el) return;
        let downInside = false, lastTap = 0;
        const stop = (e) => e.stopPropagation();
        el.addEventListener('pointerdown', (e) => { e.stopPropagation(); downInside = true; });
        el.addEventListener('mousedown',  stop);
        el.addEventListener('touchstart', stop, { passive: true });
        el.addEventListener('pointercancel', () => { downInside = false; });
        el.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            if (!downInside) return;
            downInside = false;
            if (e.pointerType === 'mouse') return;      // la souris passe par « click »
            lastTap = Date.now();
            e.preventDefault();
            fn(e);
        });
        el.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            if (Date.now() - lastTap < 700) return;     // déjà traité au pointerup
            fn(e);
        });
    }

    // ── Confirmation interne (remplace confirm(), bloqué dans les WebView) ─
    function rqConfirm(message, onOk) {
        const old = container.querySelector('.rq-confirm');
        if (old) old.remove();
        const ov = document.createElement('div');
        ov.className = 'rq-confirm';
        ov.innerHTML = `
            <div class="rq-confirm-box">
                <div>${message}</div>
                <div class="rq-confirm-btns">
                    <button type="button" class="rq-confirm-cancel">Annuler</button>
                    <button type="button" class="rq-confirm-ok">Effacer</button>
                </div>
            </div>`;
        ['pointerdown', 'mousedown', 'click'].forEach(t => ov.addEventListener(t, e => e.stopPropagation()));
        ov.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
        onTap(ov.querySelector('.rq-confirm-cancel'), () => ov.remove());
        onTap(ov.querySelector('.rq-confirm-ok'), () => { ov.remove(); onOk(); });
        container.appendChild(ov);
    }

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
        if (currentTool === 'fill' || isGommeActive) helpLayer.hoverDot.setAttribute('visibility', 'hidden');
    }

    // ── Coordonnées snappées à la grille ─────────────────────────────────
    function getCoords(e) {
        const cell = parseFloat(svg.dataset.computedCell);
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
        // Conversion écran → coordonnées SVG (en tenant compte de la marge)
        const rawX = ((clientX - rect.left) / rect.width)  * RQ_VIEW_SIZE - RQ_PAD;
        const rawY = ((clientY - rect.top)  / rect.height) * RQ_VIEW_SIZE - RQ_PAD;
        const clamp = v => Math.min(RQ_INTERNAL_SIZE, Math.max(0, v));
        return {
            x: clamp(Math.round(rawX / cell) * cell),
            y: clamp(Math.round(rawY / cell) * cell)
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
        updateBucketCursor();
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
        updateBucketCursor();
        updateToolButtons();
    }

    // Curseur 🪣 + point de survol masqué quand le pot de peinture est actif
    function updateBucketCursor() {
        const on = currentTool === 'fill' && !isGommeActive;
        svg.classList.toggle('cursor-bucket', on);
        if (helpLayer.hoverDot) helpLayer.hoverDot.setAttribute('visibility', on || isGommeActive ? 'hidden' : 'visible');
    }

    // ══════════════════════════════════════════════════════════════════════
    // POT DE PEINTURE
    // Les traits (lignes, cercles, contours) sont rasterisés sur un canvas
    // 600×600 (1 px = 1 unité SVG), on fait un remplissage par diffusion
    // depuis le point cliqué, puis la zone obtenue est convertie en un
    // <path> SVG fait de rectangles (fusion des lignes identiques).
    // → c'est un vrai élément SVG : sauvegarde, PDF, gomme, annuler OK.
    // Le remplissage est placé SOUS les traits, qui restent nets par-dessus.
    // ══════════════════════════════════════════════════════════════════════
    const RQ_FILL_DILATE = 1; // débord sous les traits (évite un liseré blanc)

    // Coordonnées SVG non arrondies à la grille
    function getRawCoords(e) {
        const rect = svg.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
        return {
            x: ((clientX - rect.left) / rect.width)  * RQ_VIEW_SIZE - RQ_PAD,
            y: ((clientY - rect.top)  / rect.height) * RQ_VIEW_SIZE - RQ_PAD
        };
    }

    // Dessine les contours (traits noirs) sur un canvas
    function rasterizeBoundaries() {
        const N = RQ_INTERNAL_SIZE;
        const cv = document.createElement('canvas');
        cv.width = cv.height = N;
        const ctx = cv.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        svg.querySelectorAll('.rq-line-group:not(.rq-fill-group)').forEach(g => {
            if (g.style.display === 'none') return;
            g.querySelectorAll('line, circle, path').forEach(el => {
                if (el.classList.contains('rq-eraser-zone')) return;
                const stroke = el.getAttribute('stroke');
                if (!stroke || stroke === 'none' || stroke === 'transparent') return;
                ctx.lineWidth = parseFloat(el.getAttribute('stroke-width')) || 4;
                const tag = el.tagName.toLowerCase();
                ctx.beginPath();
                if (tag === 'line') {
                    ctx.moveTo(+el.getAttribute('x1'), +el.getAttribute('y1'));
                    ctx.lineTo(+el.getAttribute('x2'), +el.getAttribute('y2'));
                    ctx.stroke();
                } else if (tag === 'circle') {
                    ctx.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, Math.PI * 2);
                    ctx.stroke();
                } else if (tag === 'path') {
                    // Anciennes formes remplies (polygones) : seul le contour compte
                    try { ctx.stroke(new Path2D(el.getAttribute('d') || '')); } catch (_) {}
                }
            });
        });
        return ctx.getImageData(0, 0, N, N).data;
    }

    // Zone libre contenant (sx, sy) : masque + boîte englobante
    function floodRegion(data, N, sx, sy) {
        const free = (p) => data[p * 4 + 3] < 128;
        if (!free(sy * N + sx)) return null;          // clic sur un trait
        const mask = new Uint8Array(N * N);
        let minX = sx, maxX = sx, minY = sy, maxY = sy;
        const stack = [sx, sy];
        while (stack.length) {
            const y = stack.pop(), x = stack.pop();
            let xl = x;
            while (xl >= 0 && !mask[y * N + xl] && free(y * N + xl)) xl--;
            xl++;
            let xr = x;
            while (xr < N && !mask[y * N + xr] && free(y * N + xr)) xr++;
            xr--;
            if (xl > xr) continue;
            for (let xx = xl; xx <= xr; xx++) mask[y * N + xx] = 1;
            if (xl < minX) minX = xl;
            if (xr > maxX) maxX = xr;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            for (const ny of [y - 1, y + 1]) {
                if (ny < 0 || ny >= N) continue;
                let inRun = false;
                for (let xx = xl; xx <= xr; xx++) {
                    const p = ny * N + xx;
                    const ok = !mask[p] && free(p);
                    if (ok && !inRun) { stack.push(xx, ny); inRun = true; }
                    else if (!ok) inRun = false;
                }
            }
        }
        return { mask, minX, maxX, minY, maxY };
    }

    // Masque → chemin SVG en rectangles (avec un léger débord sous les traits)
    function maskToPath(region, N) {
        const { mask, minX, maxX, minY, maxY } = region;
        const D = RQ_FILL_DILATE;
        const x0 = Math.max(0, minX - D), x1 = Math.min(N - 1, maxX + D);
        const y0 = Math.max(0, minY - D), y1 = Math.min(N - 1, maxY + D);
        const at = (x, y) => {
            for (let dy = -D; dy <= D; dy++) {
                const yy = y + dy; if (yy < 0 || yy >= N) continue;
                for (let dx = -D; dx <= D; dx++) {
                    const xx = x + dx; if (xx < 0 || xx >= N) continue;
                    if (mask[yy * N + xx]) return true;
                }
            }
            return false;
        };
        let d = '';
        let open = new Map();                          // "xa,xb" → y de départ
        const close = (key, yStart, yEnd) => {
            const [xa, xb] = key.split(',').map(Number);
            d += `M${xa} ${yStart}h${xb - xa + 1}v${yEnd - yStart}h${-(xb - xa + 1)}z`;
        };
        for (let y = y0; y <= y1 + 1; y++) {
            const runs = new Map();
            if (y <= y1) {
                let x = x0;
                while (x <= x1) {
                    if (!at(x, y)) { x++; continue; }
                    const xs = x;
                    while (x <= x1 && at(x, y)) x++;
                    const key = xs + ',' + (x - 1);
                    runs.set(key, open.has(key) ? open.get(key) : y);
                }
            }
            open.forEach((yStart, key) => { if (!runs.has(key)) close(key, yStart, y); });
            open = runs;
        }
        return d;
    }

    // Les remplissages sont rangés juste sous le premier trait
    function insertShapeGroup(group) {
        const helpLayerEl = svg.querySelector('#rq-help-layer');
        if (group.classList.contains('rq-fill-group')) {
            const firstStroke = svg.querySelector('.rq-line-group:not(.rq-fill-group)');
            svg.insertBefore(group, firstStroke || helpLayerEl);
        } else {
            svg.insertBefore(group, helpLayerEl);
        }
    }

    function bucketFill(e) {
        const N = RQ_INTERNAL_SIZE;
        const raw = getRawCoords(e);
        const sx = Math.floor(raw.x), sy = Math.floor(raw.y);
        if (sx < 0 || sy < 0 || sx >= N || sy >= N) return;   // hors du quadrillage

        const region = floodRegion(rasterizeBoundaries(), N, sx, sy);
        if (!region) return;
        const d = maskToPath(region, N);
        if (!d) return;
        const color = RQ_FILL_COLORS[currentFillColor] || RQ_FILL_COLORS.light;

        // Même zone déjà remplie : on remplace (changement de gris) ou on ne fait rien
        const same = Array.from(svg.querySelectorAll('.rq-fill-group'))
            .find(g => g.firstChild && g.firstChild.getAttribute('d') === d);
        if (same && same.firstChild.getAttribute('fill') === color) return;

        const group = createSVGEl('g', { class: 'rq-line-group rq-fill-group' });
        group.appendChild(createSVGEl('path', {
            d, fill: color, stroke: 'none', 'shape-rendering': 'crispEdges', style: 'pointer-events:all;'
        }));
        if (same) {
            group.dataset.replaced = '1';
            same.replaceWith(group);
            undoStack.push({ type: 'replace', element: group, previous: same });
        } else {
            insertShapeGroup(group);
            undoStack.push({ type: 'draw', element: group });
        }
        redoStack = [];
        autoSave();
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

    // ── Gomme : trouver le tracé visé (tolérant au doigt / stylet) ────────
    function findShapeAt(e) {
        // 1) cible directe (souris, ou doigt pile sur le trait)
        let g = e.target && e.target.closest ? e.target.closest('.rq-line-group') : null;
        if (g && svg.contains(g)) return g;
        // 2) élément sous le point (la cible peut être faussée par une capture)
        try {
            const hit = document.elementFromPoint(e.clientX, e.clientY);
            g = hit && hit.closest ? hit.closest('.rq-line-group') : null;
            if (g && svg.contains(g)) return g;
        } catch (_) {}
        // 3) trait le plus proche dans un rayon de tolérance
        const p = getRawCoords(e);
        const rect = svg.getBoundingClientRect();
        const unitsPerPx = rect.width ? RQ_VIEW_SIZE / rect.width : 1;
        const tol = Math.max(15, (e.pointerType === 'mouse' ? 8 : 22) * unitsPerPx);
        let best = null, bestD = tol;
        svg.querySelectorAll('.rq-line-group:not(.rq-fill-group)').forEach(grp => {
            grp.querySelectorAll('line, circle').forEach(el => {
                if (el.classList.contains('rq-eraser-zone')) return;
                let d;
                if (el.tagName.toLowerCase() === 'line') {
                    const x1 = +el.getAttribute('x1'), y1 = +el.getAttribute('y1');
                    const x2 = +el.getAttribute('x2'), y2 = +el.getAttribute('y2');
                    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
                    const t = L2 ? Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / L2)) : 0;
                    d = Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
                } else {
                    const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), r = +el.getAttribute('r');
                    d = Math.abs(Math.hypot(p.x - cx, p.y - cy) - r);
                }
                if (d < bestD) { bestD = d; best = grp; }
            });
        });
        if (best) return best;
        // 4) zone remplie contenant le point
        const fills = Array.from(svg.querySelectorAll('.rq-fill-group')).reverse();
        for (const fg of fills) {
            const path = fg.querySelector('path');
            if (!path) continue;
            try {
                const pt = svg.createSVGPoint(); pt.x = p.x; pt.y = p.y;
                if (path.isPointInFill(pt)) return fg;
            } catch (_) {}
        }
        return null;
    }

    // ── Gestion pointer down ──────────────────────────────────────────────
    function handlePointerDown(e) {
        if (isGommeActive) {
            const group = findShapeAt(e);
            if (group) {
                undoStack.push({ type: 'erase', element: group });
                group.remove();
                redoStack = [];
                autoSave();
            }
            return;
        }

        const c = getCoords(e);
        const helpLayerEl = svg.querySelector('#rq-help-layer');

        if (currentTool === 'fill') {
            bucketFill(e);
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
        if (isGommeActive || currentTool === 'fill') return;
        const c = getCoords(e);
        helpLayer.hoverDot.setAttribute('cx', c.x);
        helpLayer.hoverDot.setAttribute('cy', c.y);
        if (lastPoint) {
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
        if (a.type === 'draw') a.element.remove();
        else if (a.type === 'replace') a.element.replaceWith(a.previous);
        else insertShapeGroup(a.element);
        autoSave();
    }
    function redo() {
        if (!redoStack.length) return;
        const a = redoStack.pop();
        undoStack.push(a);
        if (a.type === 'draw') insertShapeGroup(a.element);
        else if (a.type === 'replace') a.previous.replaceWith(a.element);
        else a.element.remove();
        autoSave();
    }

    // ── Vider ─────────────────────────────────────────────────────────────
    function clearGrid() {
        if (!svg.querySelector('.rq-line-group')) return;   // rien à effacer
        rqConfirm('Effacer tout le dessin ?', () => {
            svg.querySelectorAll('.rq-line-group').forEach(g => g.remove());
            undoStack = []; redoStack = [];
            lastPoint = null; fillPoints = [];
            resetAide();
            autoSave();
        });
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
        if (helpLayer.hoverDot && currentTool !== 'fill' && !isGommeActive) helpLayer.hoverDot.setAttribute('visibility', 'visible');

        const pdf = new jsPDF('p', 'mm', 'a4');
        // Écart réduit entre le modèle et la grille à reproduire, l'ensemble centré sur la page A4
        const imgSize = 70, gap = 4, startY = 20, rowGap = 15;
        const marginL = (210 - (2 * imgSize + gap)) / 2;
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
        onTap(btn, () => {
            if (btn.dataset.tool === 'gomme') toggleGomme();
            else setTool(btn.dataset.tool);
        });
    });
    onTap(toolbar.querySelector('#rq-undo-btn'),  () => undo());
    onTap(toolbar.querySelector('#rq-redo-btn'),  () => redo());
    onTap(toolbar.querySelector('#rq-clear-btn'), () => clearGrid());

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
        onTap(btn, () => {
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 5;
            const max  = parseInt(gridSizeInput.max) || 20;
            const cur  = parseInt(gridSizeInput.value) || 10;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) { gridSizeInput.value = next; applyGridSize(); }
        });
    });

    // Couleur de remplissage (gris clair / gris foncé)
    toolbar.querySelectorAll('.rq-fillcolor-btn').forEach(btn => {
        onTap(btn, () => {
            currentFillColor = btn.dataset.fillcolor;
            toolbar.querySelectorAll('.rq-fillcolor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // SVG interactions
    // stopPropagation : sinon, au doigt, le widget se met à glisser pendant qu'on dessine
    svg.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!_isMax) bringToFront(widget);
        handlePointerDown(e);
    });
    svg.addEventListener('pointermove', (e) => { handlePointerMove(e); });
    svg.addEventListener('mousedown',  (e) => e.stopPropagation());
    svg.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); }, { passive: false });

    // Actions admin
    onTap(actions.querySelector('.rq-btn-save'), () => exportFile());
    onTap(actions.querySelector('.rq-btn-pdf'),  () => exportPDF());
    // « Charger » : on laisse le clic natif ouvrir le sélecteur de fichier,
    // mais on empêche le widget de capter le geste
    const loadLabel = actions.querySelector('.rq-btn-load');
    loadLabel.addEventListener('pointerdown', e => e.stopPropagation());
    loadLabel.addEventListener('mousedown',   e => e.stopPropagation());
    loadLabel.addEventListener('touchstart',  e => e.stopPropagation(), { passive: true });
    loadLabel.addEventListener('click',       e => e.stopPropagation());
    actions.querySelector('input[type="file"]').addEventListener('change', importFile);

    // Aide
    onTap(helpBtn, () => helpPopup.classList.toggle('show'));
    helpPopup.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('pointerdown', (e) => {
        if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
    }, true);

    // Resize (poignée coin bas-droit) — pointer events : souris, doigt et stylet
    resizeHandle.style.touchAction = 'none';
    resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
        const startX = e.clientX;
        const startW = parseInt(svg.style.width) || 470;
        const onMove = (ev) => {
            ev.preventDefault();
            const newW = Math.max(200, startW + ev.clientX - startX);
            svg.style.width  = newW + 'px';
            svg.style.height = newW + 'px';
        };
        const onUp = () => {
            resizeHandle.removeEventListener('pointermove', onMove);
            resizeHandle.removeEventListener('pointerup', onUp);
            resizeHandle.removeEventListener('pointercancel', onUp);
            autoSave();
        };
        resizeHandle.addEventListener('pointermove', onMove);
        resizeHandle.addEventListener('pointerup', onUp);
        resizeHandle.addEventListener('pointercancel', onUp);
    });
    resizeHandle.addEventListener('mousedown',  e => { e.stopPropagation(); e.preventDefault(); });
    resizeHandle.addEventListener('touchstart', e => { e.stopPropagation(); e.preventDefault(); }, { passive: false });

    // ── Boutons fenêtre (min/max/close) ───────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedContainerW = null;
    let _maxPlaceholder = null;
    let _maxObserver = null;

    // Plein écran : le conteneur est déplacé directement dans <body>.
    // Sinon, sur tablette, un ancêtre transformé (zoom du tableau, rotation
    // du widget) ou en overflow:hidden empêche position:fixed de couvrir
    // l'écran : le plein écran semblait « ne rien faire ».
    function setMax(on) {
        if (on === _isMax) return;
        _isMax = on;
        if (_isMax) {
            _savedContainerW = container.style.width;
            _maxPlaceholder = document.createComment('rq-fullboard');
            container.parentNode.insertBefore(_maxPlaceholder, container);
            document.body.appendChild(container);
            container.classList.add('wf-fullboard');
            // Si le widget est supprimé pendant le plein écran, on nettoie
            if (window.MutationObserver) {
                _maxObserver = new MutationObserver(() => {
                    if (!widget.isConnected) {
                        container.remove();
                        if (_maxObserver) { _maxObserver.disconnect(); _maxObserver = null; }
                    }
                });
                _maxObserver.observe(document.body, { childList: true, subtree: true });
            }
        } else {
            if (_maxObserver) { _maxObserver.disconnect(); _maxObserver = null; }
            container.classList.remove('wf-fullboard');
            if (_maxPlaceholder && _maxPlaceholder.parentNode) {
                _maxPlaceholder.parentNode.insertBefore(container, _maxPlaceholder);
                _maxPlaceholder.remove();
            } else {
                widget.appendChild(container);
            }
            _maxPlaceholder = null;
            if (_savedContainerW) container.style.width = _savedContainerW;
        }
    }

    onTap(wfMin, () => {
        if (_isMax) setMax(false);
        window._wfMiniBarCollapse(widget, '📐 Repro. Quadrillage', {});
    });
    onTap(wfMax, () => setMax(!_isMax));
    onTap(wfClose, () => {
        if (_isMax) setMax(false);
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

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

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    // (si le widget est restauré ensuite via setData, on n'ouvre pas — ou on referme — ce plein écran automatique)
    let _restored = false, _autoMax = false;
    if (!savedData && wfMax && _wfIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; setMax(true); }
    });
    const _setDataBase = setData;
    const setDataPublic = function (data) {
        _restored = true;
        if (_autoMax && _isMax) setMax(false);
        _autoMax = false;
        return _setDataBase(data);
    };

    // Exposer getData/setData pour save-load.js
    widget._rqGetData = getData;
    widget._rqSetData = setDataPublic;

    saveBoard();
    return widget;
}

// Téléphone (même détection que les jeux)
function _wfIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { return !!isMobileBoardMode(); } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}
