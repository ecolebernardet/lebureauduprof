// =========================================================================
// WIDGET PIXEL ART — Le Bureau du Prof
// Grille de pixels à colorier librement ou à partir de modèles prédéfinis.
// Algorithme de grille repris de gene_pixelart.html (dessin, modèles, tailles).
// Habillage fenêtre repris de widget-monnaie.js (redimensionnement libre,
// barre d'aide, réduire, plein écran, fermer).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Fonction utilitaire mini-barre collapse (partagée avec les autres widgets,
    // injectée une seule fois — voir widget-monnaie.js)
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
                e.stopPropagation();
                e.preventDefault();
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
                e.stopPropagation();
                e.preventDefault();
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

    // CSS partagé boutons fenêtre (injecté une seule fois — voir widget-monnaie.js)
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

    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="pixelart"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .pixelart-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            max-width: 92vw;
            overflow: hidden;
        }

        /* En-tête */
        .pixelart-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .pixelart-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }
        .pixelart-size-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #e0e7ff;
            color: #3730a3;
            white-space: nowrap;
        }

        /* ── État réduit ── */
        .pixelart-container.wf-minimized > *:not(.pixelart-header) { display: none !important; }
        .pixelart-container.wf-minimized { gap: 0; }

        /* ── État plein écran board ── */
        .pixelart-container.pixelart-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            align-items: center;
            max-width: 100vw;
        }

        /* Contrôles */
        .pixelart-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .pixelart-controls select {
            background: #f3f4f6;
            border: 1px solid #ddd;
            color: #333;
            padding: 5px 8px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 11px;
            outline: none;
            cursor: pointer;
        }
        .pixelart-size-ctrl {
            display: flex;
            align-items: center;
            background: #f3f4f6;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .pixelart-size-ctrl button {
            width: 26px;
            height: 26px;
            border: none;
            background: transparent;
            font-weight: 900;
            font-size: 13px;
            cursor: pointer;
            color: #444;
        }
        .pixelart-size-ctrl button:hover { background: rgba(0,0,0,0.08); }
        .pixelart-size-ctrl span {
            min-width: 26px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: #333;
        }
        .pixelart-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .pixelart-btn:active { transform: scale(0.96); }
        .pixelart-btn-clear {
            background: #fde8e8;
            color: #c0392b;
        }
        .pixelart-btn-clear:hover { background: #fbd5d5; }
        .pixelart-btn-clear-yes {
            background: #dc3545;
            color: #fff;
        }
        .pixelart-btn-clear-no {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .pixelart-btn-pdf {
            background: #e0e7ff;
            color: #3730a3;
        }
        .pixelart-btn-pdf:hover { background: #c7d2fe; }
        .pixelart-btn-save {
            background: #e6f4ea;
            color: #1a7a3a;
        }
        .pixelart-btn-save:hover { background: #d3ecd9; }
        .pixelart-btn-load {
            background: #fef3e2;
            color: #92610b;
        }
        .pixelart-btn-load:hover { background: #fbe6c4; }
        .pixelart-warn {
            font-size: 10px;
            font-weight: 700;
            color: #c0392b;
            opacity: 0;
            transition: opacity .25s;
            white-space: nowrap;
        }
        .pixelart-warn.show { opacity: 1; }
        .pixelart-warn.success { color: #1a7a3a; }

        /* Barre "Sauver" (nommer le fichier avant téléchargement) */
        .pixelart-save-bar {
            display: none;
            align-items: center;
            gap: 6px;
        }
        .pixelart-save-bar.show { display: flex; }
        .pixelart-save-input {
            flex: 1;
            min-width: 100px;
            padding: 6px 10px;
            border: 1.5px solid #ddd;
            border-radius: 8px;
            font-size: 12px;
            outline: none;
            box-sizing: border-box;
        }
        .pixelart-save-input:focus { border-color: #4a90e2; }

        /* Zone canvas */
        .pixelart-canvas {
            display: grid;
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            cursor: crosshair;
            user-select: none;
            touch-action: none;
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
            flex-shrink: 0;
        }
        .pixelart-pixel {
            border: 1px solid rgba(0,0,0,0.06);
        }

        /* Palette + gomme */
        .pixelart-palette-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .pixelart-eraser {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            border: 2px dashed #ccc;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            cursor: pointer;
            flex-shrink: 0;
            transition: all .15s;
        }
        .pixelart-eraser.active {
            border-color: #4a90e2;
            background: #e8f1fc;
        }
        .pixelart-palette {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .pixelart-swatch {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: transform .1s;
            flex-shrink: 0;
        }
        .pixelart-swatch.active {
            border-color: #374151;
            transform: scale(1.18);
        }

        /* Bouton aide */
        .pixelart-help-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .pixelart-help-btn:hover { background: #e0e0e0; color: #333; }

        .pixelart-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 250px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .pixelart-help-popup.show { display: block; }
        .pixelart-help-popup h4 {
            margin: 0 0 8px;
            font-size: 12px;
            color: #374151;
        }
        .pixelart-help-popup p { margin: 0 0 6px; }
        .pixelart-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée resize : redimensionne le widget entier (largeur du widget +
           hauteur de la grille), indépendamment, comme sur le widget monnaie */
        .pixelart-resize-handle {
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
        .pixelart-container:hover .pixelart-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Configuration & données ─────────────────────────────────────────────
const PXL_CONFIG = {
    defaultSize: 15,
    minSize: 5,
    maxSize: 30,
    defaultContainerW: 380,
    minContainerW: 240,
    maxContainerW: 900,
    defaultCanvasH: 340,
    minCanvasH: 150,
    maxCanvasH: 900,
    colors: ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#78350f']
};

const PXL_MODELES = {
    coeur: { size: 16, data: {"35":"#ef4444","36":"#ef4444","37":"#ef4444","38":"#ef4444","41":"#ef4444","42":"#ef4444","43":"#ef4444","44":"#ef4444","50":"#ef4444","51":"#ef4444","52":"#ef4444","53":"#ef4444","54":"#ef4444","55":"#ef4444","56":"#ef4444","57":"#ef4444","58":"#ef4444","59":"#ef4444","60":"#ef4444","61":"#ef4444","65":"#ef4444","66":"#ef4444","68":"#ef4444","69":"#ef4444","70":"#ef4444","71":"#ef4444","72":"#ef4444","73":"#ef4444","74":"#ef4444","75":"#ef4444","76":"#ef4444","77":"#ef4444","78":"#ef4444","81":"#ef4444","83":"#ef4444","84":"#ef4444","85":"#ef4444","86":"#ef4444","87":"#ef4444","88":"#ef4444","89":"#ef4444","90":"#ef4444","91":"#ef4444","92":"#ef4444","93":"#ef4444","94":"#ef4444","97":"#ef4444","99":"#ef4444","100":"#ef4444","101":"#ef4444","102":"#ef4444","103":"#ef4444","104":"#ef4444","105":"#ef4444","106":"#ef4444","107":"#ef4444","108":"#ef4444","109":"#ef4444","110":"#ef4444","113":"#ef4444","114":"#ef4444","116":"#ef4444","117":"#ef4444","118":"#ef4444","119":"#ef4444","120":"#ef4444","121":"#ef4444","122":"#ef4444","123":"#ef4444","124":"#ef4444","125":"#ef4444","126":"#ef4444","130":"#ef4444","131":"#ef4444","132":"#ef4444","133":"#ef4444","134":"#ef4444","135":"#ef4444","136":"#ef4444","137":"#ef4444","138":"#ef4444","139":"#ef4444","140":"#ef4444","141":"#ef4444","147":"#ef4444","148":"#ef4444","149":"#ef4444","150":"#ef4444","151":"#ef4444","152":"#ef4444","153":"#ef4444","154":"#ef4444","155":"#ef4444","156":"#ef4444","164":"#ef4444","165":"#ef4444","166":"#ef4444","167":"#ef4444","168":"#ef4444","169":"#ef4444","170":"#ef4444","171":"#ef4444","181":"#ef4444","182":"#ef4444","183":"#ef4444","184":"#ef4444","185":"#ef4444","186":"#ef4444","198":"#ef4444","199":"#ef4444","200":"#ef4444","201":"#ef4444","215":"#ef4444","216":"#ef4444"} },
    mario: { size: 16, data: {"6":"#ef4444","7":"#ef4444","8":"#ef4444","9":"#ef4444","10":"#ef4444","21":"#ef4444","22":"#ef4444","23":"#ef4444","24":"#ef4444","25":"#ef4444","26":"#ef4444","27":"#ef4444","28":"#ef4444","37":"#78350f","38":"#78350f","39":"#78350f","40":"#eab308","41":"#000000","42":"#eab308","52":"#78350f","53":"#eab308","54":"#78350f","55":"#eab308","56":"#eab308","57":"#eab308","58":"#eab308","59":"#eab308","60":"#eab308","68":"#78350f","69":"#eab308","70":"#78350f","71":"#78350f","72":"#eab308","73":"#eab308","74":"#78350f","75":"#eab308","76":"#eab308","77":"#eab308","84":"#78350f","85":"#78350f","86":"#eab308","87":"#eab308","88":"#eab308","89":"#78350f","90":"#78350f","91":"#78350f","92":"#78350f","102":"#eab308","103":"#eab308","104":"#eab308","105":"#eab308","106":"#eab308","117":"#ef4444","118":"#ef4444","119":"#3b82f6","120":"#ef4444","121":"#3b82f6","122":"#ef4444","123":"#ef4444","132":"#ef4444","133":"#ef4444","134":"#ef4444","135":"#3b82f6","136":"#ef4444","137":"#3b82f6","138":"#ef4444","139":"#ef4444","140":"#ef4444","147":"#ef4444","148":"#ef4444","149":"#ef4444","150":"#ef4444","151":"#eab308","152":"#3b82f6","153":"#eab308","154":"#ef4444","155":"#ef4444","156":"#ef4444","157":"#ef4444","163":"#eab308","164":"#eab308","165":"#ef4444","166":"#3b82f6","167":"#3b82f6","168":"#3b82f6","169":"#3b82f6","170":"#3b82f6","171":"#ef4444","172":"#eab308","173":"#eab308","179":"#eab308","180":"#eab308","181":"#eab308","182":"#3b82f6","183":"#3b82f6","184":"#3b82f6","185":"#3b82f6","186":"#3b82f6","187":"#eab308","188":"#eab308","189":"#eab308","195":"#eab308","196":"#eab308","197":"#3b82f6","198":"#3b82f6","199":"#3b82f6","200":"#3b82f6","201":"#3b82f6","202":"#3b82f6","203":"#3b82f6","204":"#eab308","205":"#eab308","213":"#3b82f6","214":"#3b82f6","215":"#3b82f6","217":"#3b82f6","218":"#3b82f6","219":"#3b82f6","229":"#78350f","230":"#78350f","234":"#78350f","235":"#78350f","244":"#78350f","245":"#78350f","246":"#78350f","250":"#78350f","251":"#78350f","252":"#78350f"} },
    smiley: { size: 16, data: {"21":"#eab308","22":"#eab308","23":"#eab308","24":"#eab308","25":"#eab308","26":"#eab308","36":"#eab308","37":"#eab308","38":"#eab308","39":"#eab308","40":"#eab308","41":"#eab308","42":"#eab308","43":"#eab308","51":"#eab308","52":"#eab308","53":"#eab308","54":"#eab308","55":"#eab308","56":"#eab308","57":"#eab308","58":"#eab308","59":"#eab308","60":"#eab308","66":"#eab308","67":"#eab308","68":"#eab308","69":"#eab308","70":"#eab308","71":"#eab308","72":"#eab308","73":"#eab308","74":"#eab308","75":"#eab308","76":"#eab308","77":"#eab308","81":"#eab308","82":"#eab308","83":"#eab308","84":"#000000","85":"#000000","86":"#eab308","87":"#eab308","88":"#eab308","89":"#eab308","90":"#000000","91":"#000000","92":"#eab308","93":"#eab308","94":"#eab308","97":"#eab308","98":"#eab308","99":"#eab308","100":"#000000","101":"#000000","102":"#eab308","103":"#eab308","104":"#eab308","105":"#eab308","106":"#000000","107":"#000000","108":"#eab308","109":"#eab308","110":"#eab308","113":"#eab308","114":"#eab308","115":"#eab308","116":"#eab308","117":"#eab308","118":"#eab308","119":"#eab308","120":"#eab308","121":"#eab308","122":"#eab308","123":"#eab308","124":"#eab308","125":"#eab308","126":"#eab308","129":"#eab308","130":"#eab308","131":"#eab308","132":"#eab308","133":"#eab308","134":"#eab308","135":"#eab308","136":"#eab308","137":"#eab308","138":"#eab308","139":"#eab308","140":"#eab308","141":"#eab308","142":"#eab308","145":"#eab308","146":"#eab308","147":"#eab308","148":"#eab308","149":"#eab308","150":"#eab308","151":"#eab308","152":"#eab308","153":"#eab308","154":"#eab308","155":"#eab308","156":"#eab308","157":"#eab308","158":"#eab308","161":"#eab308","162":"#eab308","163":"#eab308","164":"#000000","165":"#eab308","166":"#eab308","167":"#eab308","168":"#eab308","169":"#eab308","170":"#eab308","171":"#000000","172":"#eab308","173":"#eab308","174":"#eab308","178":"#eab308","179":"#eab308","180":"#eab308","181":"#000000","182":"#eab308","183":"#eab308","184":"#eab308","185":"#eab308","186":"#000000","187":"#eab308","188":"#eab308","189":"#eab308","195":"#eab308","196":"#eab308","197":"#eab308","198":"#000000","199":"#000000","200":"#000000","201":"#000000","202":"#eab308","203":"#eab308","204":"#eab308","212":"#eab308","213":"#eab308","214":"#eab308","215":"#eab308","216":"#eab308","217":"#eab308","218":"#eab308","219":"#eab308","229":"#eab308","230":"#eab308","231":"#eab308","232":"#eab308","233":"#eab308","234":"#eab308"} },
    paysage: { size: 16, data: {"0":"#3b82f6","1":"#3b82f6","2":"#3b82f6","3":"#3b82f6","4":"#3b82f6","5":"#3b82f6","6":"#3b82f6","7":"#3b82f6","8":"#3b82f6","9":"#3b82f6","10":"#3b82f6","11":"#3b82f6","12":"#3b82f6","13":"#eab308","14":"#eab308","15":"#eab308","16":"#3b82f6","17":"#3b82f6","18":"#3b82f6","19":"#3b82f6","20":"#3b82f6","21":"#3b82f6","22":"#3b82f6","23":"#3b82f6","24":"#3b82f6","25":"#3b82f6","26":"#3b82f6","27":"#3b82f6","28":"#3b82f6","29":"#eab308","30":"#eab308","31":"#eab308","32":"#3b82f6","33":"#3b82f6","34":"#3b82f6","35":"#3b82f6","36":"#3b82f6","37":"#3b82f6","38":"#3b82f6","39":"#3b82f6","40":"#3b82f6","41":"#3b82f6","42":"#3b82f6","43":"#3b82f6","44":"#3b82f6","45":"#3b82f6","46":"#eab308","47":"#eab308","48":"#3b82f6","49":"#3b82f6","50":"#3b82f6","53":"#3b82f6","54":"#3b82f6","55":"#3b82f6","56":"#3b82f6","57":"#3b82f6","58":"#3b82f6","59":"#3b82f6","60":"#3b82f6","61":"#3b82f6","62":"#3b82f6","63":"#3b82f6","64":"#3b82f6","65":"#3b82f6","66":"#000000","67":"#78350f","68":"#78350f","70":"#3b82f6","71":"#3b82f6","72":"#3b82f6","73":"#3b82f6","74":"#3b82f6","77":"#3b82f6","78":"#3b82f6","79":"#3b82f6","80":"#3b82f6","81":"#000000","82":"#78350f","83":"#78350f","84":"#78350f","85":"#78350f","86":"#78350f","87":"#3b82f6","88":"#3b82f6","89":"#000000","90":"#000000","91":"#78350f","92":"#78350f","94":"#3b82f6","95":"#3b82f6","96":"#000000","97":"#78350f","98":"#78350f","99":"#78350f","100":"#78350f","101":"#78350f","102":"#78350f","103":"#78350f","104":"#000000","105":"#78350f","106":"#78350f","107":"#78350f","108":"#78350f","109":"#78350f","110":"#78350f","111":"#3b82f6","112":"#78350f","113":"#78350f","114":"#78350f","115":"#78350f","116":"#ef4444","117":"#78350f","118":"#78350f","119":"#000000","120":"#78350f","121":"#78350f","122":"#78350f","123":"#78350f","124":"#78350f","125":"#78350f","126":"#78350f","127":"#78350f","128":"#78350f","129":"#78350f","130":"#78350f","131":"#ef4444","132":"#ef4444","133":"#ef4444","134":"#78350f","135":"#78350f","136":"#78350f","137":"#78350f","138":"#78350f","139":"#78350f","140":"#78350f","141":"#78350f","142":"#78350f","143":"#78350f","144":"#78350f","145":"#78350f","146":"#ef4444","147":"#ef4444","148":"#ef4444","149":"#ef4444","150":"#ef4444","151":"#78350f","152":"#78350f","153":"#78350f","154":"#78350f","155":"#78350f","156":"#78350f","157":"#78350f","158":"#78350f","159":"#78350f","160":"#22c55e","161":"#22c55e","162":"#f97316","163":"#f97316","164":"#f97316","165":"#f97316","166":"#f97316","167":"#22c55e","168":"#22c55e","169":"#22c55e","170":"#22c55e","171":"#22c55e","172":"#22c55e","173":"#22c55e","174":"#22c55e","175":"#22c55e","176":"#22c55e","177":"#22c55e","178":"#f97316","179":"#ef4444","180":"#f97316","181":"#ef4444","182":"#f97316","183":"#22c55e","184":"#eab308","185":"#22c55e","186":"#22c55e","187":"#22c55e","188":"#22c55e","189":"#ec4899","190":"#22c55e","191":"#22c55e","192":"#22c55e","193":"#22c55e","194":"#f97316","195":"#f97316","196":"#f97316","197":"#f97316","198":"#f97316","199":"#22c55e","200":"#22c55e","201":"#22c55e","202":"#22c55e","203":"#eab308","204":"#22c55e","205":"#22c55e","206":"#22c55e","207":"#22c55e","208":"#22c55e","209":"#22c55e","210":"#f97316","211":"#f97316","212":"#ef4444","213":"#ef4444","214":"#f97316","215":"#22c55e","216":"#22c55e","217":"#ec4899","218":"#22c55e","219":"#22c55e","220":"#22c55e","221":"#22c55e","222":"#22c55e","223":"#22c55e","224":"#22c55e","225":"#22c55e","226":"#f97316","227":"#f97316","228":"#ef4444","229":"#ef4444","230":"#f97316","231":"#22c55e","232":"#22c55e","233":"#22c55e","234":"#22c55e","235":"#22c55e","236":"#22c55e","237":"#22c55e","238":"#ec4899","239":"#22c55e","240":"#22c55e","241":"#22c55e","242":"#22c55e","243":"#22c55e","244":"#22c55e","245":"#22c55e","246":"#22c55e","247":"#22c55e","248":"#22c55e","249":"#eab308","250":"#22c55e","251":"#22c55e","252":"#22c55e","253":"#22c55e","254":"#22c55e","255":"#22c55e"} },
    arcenciel: { size: 15, data: {"20":"#ef4444","21":"#ef4444","22":"#ef4444","23":"#ef4444","24":"#ef4444","34":"#ef4444","35":"#f97316","36":"#f97316","37":"#f97316","38":"#f97316","39":"#f97316","40":"#ef4444","48":"#ef4444","49":"#f97316","50":"#eab308","51":"#eab308","52":"#eab308","53":"#eab308","54":"#eab308","55":"#f97316","56":"#ef4444","62":"#ef4444","63":"#f97316","64":"#eab308","65":"#22c55e","66":"#22c55e","67":"#22c55e","68":"#22c55e","69":"#22c55e","70":"#eab308","71":"#f97316","72":"#ef4444","77":"#ef4444","78":"#f97316","79":"#eab308","80":"#22c55e","81":"#3b82f6","82":"#3b82f6","83":"#3b82f6","84":"#22c55e","85":"#eab308","86":"#f97316","87":"#ef4444","91":"#ef4444","92":"#f97316","93":"#eab308","94":"#22c55e","95":"#3b82f6","96":"#8b5cf6","97":"#8b5cf6","98":"#8b5cf6","99":"#3b82f6","100":"#22c55e","101":"#eab308","102":"#f97316","103":"#ef4444","106":"#ef4444","107":"#f97316","108":"#eab308","109":"#22c55e","110":"#3b82f6","111":"#8b5cf6","113":"#8b5cf6","114":"#3b82f6","115":"#22c55e","116":"#eab308","117":"#f97316","118":"#ef4444","121":"#ef4444","122":"#f97316","123":"#eab308","124":"#22c55e","125":"#3b82f6","126":"#8b5cf6","128":"#8b5cf6","129":"#3b82f6","130":"#22c55e","131":"#eab308","132":"#f97316","133":"#ef4444","135":"#ef4444","136":"#f97316","137":"#eab308","138":"#22c55e","139":"#3b82f6","140":"#8b5cf6","144":"#8b5cf6","145":"#3b82f6","146":"#22c55e","147":"#eab308","148":"#f97316","149":"#ef4444","150":"#ef4444","151":"#f97316","152":"#eab308","153":"#22c55e","154":"#3b82f6","155":"#8b5cf6","159":"#8b5cf6","160":"#3b82f6","161":"#22c55e","162":"#eab308","163":"#f97316","164":"#ef4444","165":"#ef4444","166":"#f97316","167":"#eab308","168":"#22c55e","169":"#3b82f6","170":"#8b5cf6","174":"#8b5cf6","175":"#3b82f6","176":"#22c55e","177":"#eab308","178":"#f97316","179":"#ef4444"} },
    papillon: { size: 15, data: {"0":"#22c55e","1":"#22c55e","2":"#22c55e","3":"#22c55e","4":"#22c55e","5":"#22c55e","6":"#22c55e","7":"#22c55e","8":"#22c55e","9":"#22c55e","10":"#22c55e","11":"#22c55e","12":"#22c55e","13":"#22c55e","14":"#22c55e","15":"#22c55e","16":"#22c55e","17":"#22c55e","18":"#3b82f6","19":"#3b82f6","20":"#3b82f6","21":"#22c55e","22":"#22c55e","23":"#22c55e","24":"#3b82f6","25":"#3b82f6","26":"#3b82f6","27":"#22c55e","28":"#22c55e","29":"#22c55e","30":"#22c55e","31":"#22c55e","32":"#3b82f6","33":"#eab308","34":"#eab308","35":"#eab308","36":"#3b82f6","37":"#22c55e","38":"#3b82f6","39":"#eab308","40":"#eab308","41":"#eab308","42":"#3b82f6","43":"#22c55e","44":"#22c55e","45":"#22c55e","46":"#3b82f6","47":"#eab308","48":"#eab308","49":"#eab308","50":"#eab308","51":"#3b82f6","52":"#000000","53":"#3b82f6","54":"#eab308","55":"#eab308","56":"#eab308","57":"#eab308","58":"#3b82f6","59":"#22c55e","60":"#22c55e","61":"#3b82f6","62":"#eab308","63":"#8b5cf6","64":"#8b5cf6","65":"#eab308","66":"#3b82f6","67":"#000000","68":"#3b82f6","69":"#eab308","70":"#8b5cf6","71":"#8b5cf6","72":"#eab308","73":"#3b82f6","74":"#22c55e","75":"#22c55e","76":"#3b82f6","77":"#eab308","78":"#8b5cf6","79":"#ec4899","80":"#8b5cf6","81":"#eab308","82":"#000000","83":"#eab308","84":"#8b5cf6","85":"#ec4899","86":"#8b5cf6","87":"#eab308","88":"#3b82f6","89":"#22c55e","90":"#22c55e","91":"#3b82f6","92":"#eab308","93":"#eab308","94":"#8b5cf6","95":"#8b5cf6","96":"#eab308","97":"#000000","98":"#eab308","99":"#8b5cf6","100":"#8b5cf6","101":"#eab308","102":"#eab308","103":"#3b82f6","104":"#22c55e","105":"#22c55e","106":"#3b82f6","107":"#eab308","108":"#eab308","109":"#eab308","110":"#eab308","111":"#eab308","112":"#000000","113":"#eab308","114":"#eab308","115":"#eab308","116":"#eab308","117":"#eab308","118":"#3b82f6","119":"#22c55e","120":"#22c55e","121":"#22c55e","122":"#3b82f6","123":"#eab308","124":"#eab308","125":"#eab308","126":"#3b82f6","127":"#000000","128":"#3b82f6","129":"#eab308","130":"#eab308","131":"#eab308","132":"#3b82f6","133":"#22c55e","134":"#22c55e","135":"#22c55e","136":"#22c55e","137":"#22c55e","138":"#3b82f6","139":"#3b82f6","140":"#3b82f6","141":"#3b82f6","142":"#000000","143":"#3b82f6","144":"#3b82f6","145":"#3b82f6","146":"#3b82f6","147":"#22c55e","148":"#22c55e","149":"#22c55e","150":"#22c55e","151":"#22c55e","152":"#3b82f6","153":"#ec4899","154":"#ec4899","155":"#ec4899","156":"#3b82f6","157":"#000000","158":"#3b82f6","159":"#ec4899","160":"#ec4899","161":"#ec4899","162":"#3b82f6","163":"#22c55e","164":"#22c55e","165":"#22c55e","166":"#22c55e","167":"#3b82f6","168":"#ec4899","169":"#8b5cf6","170":"#ec4899","171":"#3b82f6","172":"#000000","173":"#3b82f6","174":"#ec4899","175":"#8b5cf6","176":"#ec4899","177":"#3b82f6","178":"#22c55e","179":"#22c55e","180":"#22c55e","181":"#22c55e","182":"#3b82f6","183":"#ec4899","184":"#ec4899","185":"#3b82f6","186":"#3b82f6","187":"#22c55e","188":"#3b82f6","189":"#3b82f6","190":"#ec4899","191":"#ec4899","192":"#3b82f6","193":"#22c55e","194":"#22c55e","195":"#22c55e","196":"#22c55e","197":"#22c55e","198":"#3b82f6","199":"#3b82f6","200":"#3b82f6","201":"#22c55e","202":"#22c55e","203":"#22c55e","204":"#3b82f6","205":"#3b82f6","206":"#3b82f6","207":"#22c55e","208":"#22c55e","209":"#22c55e","210":"#22c55e","211":"#22c55e","212":"#22c55e","213":"#22c55e","214":"#22c55e","215":"#22c55e","216":"#22c55e","217":"#22c55e","218":"#22c55e","219":"#22c55e","220":"#22c55e","221":"#22c55e","222":"#22c55e","223":"#22c55e","224":"#22c55e"} }
};

// ── Utilitaire : une case est-elle blanche/vide ? ──────────────────────────
function _pxlIsWhite(bg) {
    return bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === '' || !bg;
}

// ── Sauver / Charger un dessin sous forme de fichier .js sur l'ordinateur ──
const PXL_FILE_MARKER = 'PIXEL_ART_DATA';

function _pxlSanitizeFilenamePart(str) {
    // Retire uniquement les caractères interdits dans un nom de fichier,
    // conserve le reste (espaces, accents, casse) tel que saisi.
    return (str || 'dessin').replace(/[\\/:*?"<>|]+/g, '').trim() || 'dessin';
}

// Génère le contenu texte du fichier .js à télécharger
function _pxlBuildFileContent(data) {
    return `// Pixel Art — Le Bureau du Prof\n` +
           `// Fichier généré automatiquement le ${new Date().toLocaleString('fr-FR')}.\n` +
           `// Pour le recharger : bouton "📂 Charger" du widget Pixel Art.\n` +
           `window.${PXL_FILE_MARKER} = ${JSON.stringify(data)};\n`;
}

// Déclenche le téléchargement d'un fichier texte sur l'ordinateur de l'utilisateur
function _pxlDownloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Extrait les données JSON d'un fichier .js généré par _pxlBuildFileContent
function _pxlParseFileContent(text) {
    const match = text.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (!match) throw new Error('format invalide');
    const data = JSON.parse(match[1]);
    if (!data || typeof data.size !== 'number' || typeof data.pixels !== 'object') {
        throw new Error('données invalides');
    }
    return data;
}

// ── Création du widget ────────────────────────────────────────────────────
// savedData (optionnel) : { size, pixels: {index:color}, containerW, canvasH }
function createPixelArtWidget(savedData) {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'pixelart';
    widget.dataset.transparent = 'true';
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

    // Contenu principal
    const container = document.createElement('div');
    container.className = 'pixelart-container';

    // En-tête
    const header = document.createElement('div');
    header.className = 'pixelart-header';
    header.innerHTML = `
        <span class="pixelart-title">🎨 Pixel Art</span>
        <span class="pixelart-size-badge">${PXL_CONFIG.defaultSize}×${PXL_CONFIG.defaultSize}</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const sizeBadge = header.querySelector('.pixelart-size-badge');
    container.appendChild(header);

    // Bouton aide (inséré dans le header, avant les boutons min/max/close)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'pixelart-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    // Popup aide
    const helpPopup = document.createElement('div');
    helpPopup.className = 'pixelart-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Aide Pixel Art</h4>
        <p>1. Choisissez une couleur dans la palette, ou un modèle rapide.</p>
        <p>2. Cliquez ou glissez sur la grille pour colorier. Sur tablette, touchez et glissez le doigt.</p>
        <p>3. Utilisez 🧼 pour gommer une case.</p>
        <p>4. La taille de la grille ne peut être changée que si elle est vide.</p>
        <p>5. Tirez le coin en bas à droite du dessin pour l'agrandir ou le réduire librement.</p>
        <p>6. 💾 Sauver télécharge le dessin sous forme de fichier .js sur l'ordinateur ; 📂 Charger permet de recharger un fichier .js précédemment sauvegardé.</p>
    `;
    container.appendChild(helpPopup);

    // Ligne de contrôles : modèles + taille + vider + pdf
    const controls = document.createElement('div');
    controls.className = 'pixelart-controls';
    controls.innerHTML = `
        <select class="pixelart-select-modele">
            <option value="">-- Nouveau dessin --</option>
            <option value="coeur">❤️ Cœur</option>
            <option value="smiley">😊 Smiley</option>
            <option value="mario">🍄 Mario</option>
            <option value="paysage">🏔️ Paysage</option>
            <option value="arcenciel">🌈 Arc-en-ciel</option>
            <option value="papillon">🦋 Papillon</option>
        </select>
        <div class="pixelart-size-ctrl">
            <button class="pixelart-size-dec" title="Réduire la grille">-</button>
            <span class="pixelart-size-val">${PXL_CONFIG.defaultSize}</span>
            <button class="pixelart-size-inc" title="Agrandir la grille">+</button>
        </div>
        <button class="pixelart-btn pixelart-btn-clear">🗑️ Vider</button>
        <button class="pixelart-btn pixelart-btn-pdf">📄 PDF</button>
        <button class="pixelart-btn pixelart-btn-save">💾 Sauver</button>
        <button class="pixelart-btn pixelart-btn-load">📂 Charger</button>
        <span class="pixelart-warn"></span>
    `;
    const selectModele = controls.querySelector('.pixelart-select-modele');
    const sizeDecBtn    = controls.querySelector('.pixelart-size-dec');
    const sizeIncBtn    = controls.querySelector('.pixelart-size-inc');
    const sizeValSpan   = controls.querySelector('.pixelart-size-val');
    let clearBtn        = controls.querySelector('.pixelart-btn-clear');
    const pdfBtn        = controls.querySelector('.pixelart-btn-pdf');
    const saveOpenBtn   = controls.querySelector('.pixelart-btn-save');
    const loadOpenBtn   = controls.querySelector('.pixelart-btn-load');
    const warnSpan      = controls.querySelector('.pixelart-warn');
    container.appendChild(controls);

    // Barre "Sauver" : nommer le fichier avant de le télécharger
    const saveBar = document.createElement('div');
    saveBar.className = 'pixelart-save-bar';
    saveBar.innerHTML = `
        <input type="text" class="pixelart-save-input" placeholder="Nom du dessin…" maxlength="60">
        <button class="pixelart-btn pixelart-btn-save-confirm" style="background:#28a745;color:#fff;">⬇️ Télécharger</button>
        <button class="pixelart-btn pixelart-btn-save-cancel" style="background:#f0f0f0;color:#333;border:1px solid #ddd;">✕</button>
    `;
    const saveInput       = saveBar.querySelector('.pixelart-save-input');
    const saveConfirmBtn  = saveBar.querySelector('.pixelart-btn-save-confirm');
    const saveCancelBtn   = saveBar.querySelector('.pixelart-btn-save-cancel');
    container.appendChild(saveBar);

    // Sélecteur de fichier caché pour "Charger" (fichier .js sauvegardé précédemment)
    const loadFileInput = document.createElement('input');
    loadFileInput.type = 'file';
    loadFileInput.accept = '.js,text/javascript';
    loadFileInput.style.display = 'none';
    container.appendChild(loadFileInput);

    // Zone canvas — occupe toute la largeur du widget
    const canvas = document.createElement('div');
    canvas.className = 'pixelart-canvas';
    container.appendChild(canvas);

    // Ligne palette + gomme
    const paletteRow = document.createElement('div');
    paletteRow.className = 'pixelart-palette-row';
    paletteRow.innerHTML = `
        <button class="pixelart-eraser" title="Gommer">🧼</button>
        <div class="pixelart-palette"></div>
    `;
    const eraserBtn = paletteRow.querySelector('.pixelart-eraser');
    const paletteDiv = paletteRow.querySelector('.pixelart-palette');
    container.appendChild(paletteRow);

    // Poignée de redimensionnement du widget entier (coin bas-droit)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'pixelart-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let currentColor = PXL_CONFIG.colors[0];
    let isDrawing = false;
    let currentSize = (savedData && savedData.size) ? savedData.size : PXL_CONFIG.defaultSize;

    // ── Avertissement temporaire (remplace la modale d'alerte) ─────────────
    let warnTimeout = null;
    function showWarn(msg, type) {
        warnSpan.textContent = msg;
        warnSpan.classList.toggle('success', type === 'success');
        warnSpan.classList.add('show');
        clearTimeout(warnTimeout);
        warnTimeout = setTimeout(() => warnSpan.classList.remove('show'), 2200);
    }

    // ── Grille vide ? ─────────────────────────────────────────────────────
    function isGridEmpty() {
        return Array.from(canvas.querySelectorAll('.pixelart-pixel')).every(p => _pxlIsWhite(p.style.backgroundColor));
    }

    // ── Peindre une case ────────────────────────────────────────────────────
    function paintCell(cell) {
        cell.style.backgroundColor = currentColor;
        saveBoard();
    }

    // ── Construction d'une case ──────────────────────────────────────────
    function createCell(index, savedPixels) {
        const cell = document.createElement('div');
        cell.className = 'pixelart-pixel';
        cell.style.backgroundColor = (savedPixels && savedPixels[index]) ? savedPixels[index] : '#ffffff';

        const start = (e) => { e.preventDefault(); isDrawing = true; paintCell(cell); };
        cell.onmousedown = start;
        cell.onmouseover = () => { if (isDrawing) paintCell(cell); };
        cell.ontouchstart = start;

        return cell;
    }

    // ── (Re)construit la grille NxN ───────────────────────────────────────
    function buildGrid(size, savedPixels) {
        currentSize = size;
        sizeValSpan.textContent = size;
        sizeBadge.textContent = `${size}×${size}`;
        canvas.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        canvas.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        canvas.innerHTML = '';
        for (let i = 0; i < size * size; i++) {
            canvas.appendChild(createCell(i, savedPixels));
        }
    }

    // ── Support tactile : glisser le doigt pour dessiner en continu ────────
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (el && el.classList.contains('pixelart-pixel')) paintCell(el);
    }, { passive: false });
    canvas.addEventListener('touchend', () => { isDrawing = false; });

    // ── Changer la taille de la grille (uniquement si vide) ────────────────
    function changeSize(delta) {
        if (!isGridEmpty()) {
            showWarn('Videz la grille pour changer sa taille');
            return;
        }
        const newSize = currentSize + delta;
        if (newSize >= PXL_CONFIG.minSize && newSize <= PXL_CONFIG.maxSize) {
            buildGrid(newSize, null);
            saveBoard();
        }
    }

    // ── Vider la grille (confirmation intégrée dans le bouton) ─────────────
    function askClear() {
        if (isGridEmpty()) return;
        clearBtn.textContent = '⚠️ Sûr ?';
        clearBtn.classList.add('pixelart-btn-clear-yes');
        clearBtn.onclick = () => {
            buildGrid(currentSize, null);
            resetClearBtn();
            saveBoard();
        };
        // Annule automatiquement si on ne confirme pas rapidement
        clearTimeout(clearBtn._resetTimeout);
        clearBtn._resetTimeout = setTimeout(resetClearBtn, 2500);
    }
    function resetClearBtn() {
        clearBtn.textContent = '🗑️ Vider';
        clearBtn.classList.remove('pixelart-btn-clear-yes');
        clearBtn.onclick = askClear;
    }
    clearBtn.onclick = askClear;

    // ── Modèles rapides ────────────────────────────────────────────────────
    function loadModel(key) {
        selectModele.value = '';
        if (!key) return;
        const model = PXL_MODELES[key];
        if (!model) return;
        buildGrid(model.size, model.data);
        saveBoard();
    }
    selectModele.onchange = (e) => loadModel(e.target.value);

    // ── Export PDF (modèle rempli en haut + quadrillage vide à reproduire) ──
    function _pxlCurrentDate() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    function _pxlEnsureJsPDF(callback) {
        if (window.jspdf && window.jspdf.jsPDF) { callback(); return; }
        // Charge jsPDF depuis le CDN si ce n'est pas déjà fait ailleurs sur la page
        const existing = document.getElementById('pxl-jspdf-script');
        if (existing) { existing.addEventListener('load', callback, { once: true }); return; }
        const script = document.createElement('script');
        script.id = 'pxl-jspdf-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }
    async function exportPDF() {
        _pxlEnsureJsPDF(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const filename = `outilsprofs_pixelart_${_pxlCurrentDate()}.pdf`;
            const size = currentSize;
            const cells = canvas.querySelectorAll('.pixelart-pixel');
            const cellSize = 100 / size;
            const startX = (210 - 100) / 2;

            // Titre modèle
            doc.setFont('helvetica', 'bold');
            doc.text('MODÈLE PIXEL ART', 105, 25, { align: 'center' });

            // Grille remplie (modèle)
            cells.forEach((cell, i) => {
                const x = startX + (i % size) * cellSize;
                const y = 40 + Math.floor(i / size) * cellSize;
                const rgb = cell.style.backgroundColor.match(/\d+/g);
                if (rgb) {
                    doc.setFillColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
                } else {
                    doc.setFillColor(255, 255, 255);
                }
                doc.rect(x, y, cellSize, cellSize, 'F');
                doc.setDrawColor(200);
                doc.rect(x, y, cellSize, cellSize, 'D');
            });

            // Titre quadrillage vide
            doc.text('À TOI DE REPRODUIRE', 105, 160, { align: 'center' });

            // Grille vide à reproduire
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    doc.setDrawColor(180);
                    doc.rect(startX + j * cellSize, 175 + i * cellSize, cellSize, cellSize, 'D');
                }
            }

            if (window.Android && window.Android.savePdfFromBase64) {
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                window.Android.savePdfFromBase64(pdfBase64, filename);
            } else {
                doc.save(filename);
            }
        });
    }
    pdfBtn.onclick = exportPDF;

    // ── Sauver / Charger un dessin (fichier .js sur l'ordinateur) ───────────
    function getCurrentPixelsData() {
        const pixels = {};
        canvas.querySelectorAll('.pixelart-pixel').forEach((cell, index) => {
            if (!_pxlIsWhite(cell.style.backgroundColor)) pixels[index] = cell.style.backgroundColor;
        });
        return pixels;
    }

    function closeSaveBar() {
        saveBar.classList.remove('show');
        saveInput.value = '';
    }

    saveOpenBtn.onclick = () => {
        if (isGridEmpty()) { showWarn('La grille est vide, rien à sauvegarder'); return; }
        saveBar.classList.add('show');
        saveInput.value = '';
        saveInput.focus();
    };
    saveCancelBtn.onclick = closeSaveBar;
    saveInput.addEventListener('mousedown', (e) => e.stopPropagation());
    saveInput.addEventListener('click', (e) => { e.stopPropagation(); saveInput.focus(); });
    saveInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveConfirmBtn.click();
        if (e.key === 'Escape') closeSaveBar();
    });
    saveConfirmBtn.onclick = () => {
        const rawName = saveInput.value.trim() || 'dessin';
        const data = {
            name: rawName,
            size: currentSize,
            pixels: getCurrentPixelsData(),
            date: new Date().toISOString()
        };
        const filename = `lebureauduprof_pixel_art_${_pxlSanitizeFilenamePart(rawName)}.js`;
        _pxlDownloadFile(filename, _pxlBuildFileContent(data));
        closeSaveBar();
        showWarn('Fichier téléchargé ✅', 'success');
    };

    // Charger : ouvre le sélecteur de fichier natif de l'ordinateur
    loadOpenBtn.onclick = () => {
        closeSaveBar();
        loadFileInput.value = '';
        loadFileInput.click();
    };
    loadFileInput.addEventListener('click', (e) => e.stopPropagation());
    loadFileInput.addEventListener('change', () => {
        const file = loadFileInput.files && loadFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = _pxlParseFileContent(String(reader.result));
                buildGrid(data.size, data.pixels || {});
                saveBoard();
                showWarn('Dessin chargé ✅' + (data.name ? ' : ' + data.name : ''), 'success');
            } catch (err) {
                showWarn('Fichier invalide ou illisible');
            }
        };
        reader.onerror = () => showWarn('Impossible de lire ce fichier');
        reader.readAsText(file);
    });

    // ── Palette ────────────────────────────────────────────────────────────
    function resetEraser() { eraserBtn.classList.remove('active'); }
    function selectColor(color, swatch) {
        resetEraser();
        paletteDiv.querySelectorAll('.pixelart-swatch').forEach(el => el.classList.remove('active'));
        swatch.classList.add('active');
        currentColor = color;
    }
    function activateEraser() {
        currentColor = '#ffffff';
        paletteDiv.querySelectorAll('.pixelart-swatch').forEach(el => el.classList.remove('active'));
        eraserBtn.classList.add('active');
    }
    PXL_CONFIG.colors.forEach((color, idx) => {
        const swatch = document.createElement('div');
        swatch.className = 'pixelart-swatch';
        swatch.style.backgroundColor = color;
        if (color === '#ffffff') swatch.style.border = '1px solid #ddd';
        swatch.onclick = () => selectColor(color, swatch);
        paletteDiv.appendChild(swatch);
        if (idx === 0) swatch.classList.add('active');
    });
    eraserBtn.onclick = activateEraser;

    // ── Taille grille (+/-) ────────────────────────────────────────────────
    sizeDecBtn.onclick = () => changeSize(-1);
    sizeIncBtn.onclick = () => changeSize(1);

    // ── Fin de dessin (relâchement souris n'importe où) ─────────────────────
    window.addEventListener('mouseup', () => { isDrawing = false; });

    // ── Popup aide ───────────────────────────────────────────────────────
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Redimensionnement libre du widget entier ────────────────────────────
    // La poignée est au coin du widget : elle pilote la largeur du container
    // (donc de tout le widget, header/contrôles/palette inclus, comme la grille
    // fait 100% de cette largeur) et la hauteur de la grille, indépendamment —
    // exactement comme le fait le widget monnaie sur son propre container.
    function doResize(clientX, clientY, startX, startY, startW, startH) {
        const newW = Math.max(PXL_CONFIG.minContainerW, Math.min(PXL_CONFIG.maxContainerW, startW + (clientX - startX)));
        const newH = Math.max(PXL_CONFIG.minCanvasH, Math.min(PXL_CONFIG.maxCanvasH, startH + (clientY - startY)));
        container.style.width = newW + 'px';
        canvas.style.height   = newH + 'px';
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = canvas.offsetHeight;
        document.onmousemove = (ev) => doResize(ev.clientX, ev.clientY, startX, startY, startW, startH);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = canvas.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            doResize(t.clientX, t.clientY, startX, startY, startW, startH);
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre (réduire / plein écran / fermer) ────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _savedCanvasH = null, _isMax = false;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            window._wfMiniBarCollapse(widget, '🎨 Pixel Art', { onExpand: () => {} });
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedCanvasH = canvas.style.height;
                container.classList.add('pixelart-fullboard');
                const targetH = Math.min(window.innerWidth, window.innerHeight) - 220;
                canvas.style.height = targetH + 'px';
            } else {
                container.classList.remove('pixelart-fullboard');
                if (_savedCanvasH) canvas.style.height = _savedCanvasH;
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

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Construction initiale de la grille (avec restauration éventuelle)
    buildGrid(currentSize, savedData && savedData.pixels ? savedData.pixels : null);
    container.style.width = (savedData && savedData.containerW) ? savedData.containerW + 'px' : PXL_CONFIG.defaultContainerW + 'px';
    canvas.style.height   = (savedData && savedData.canvasH)    ? savedData.canvasH    + 'px' : PXL_CONFIG.defaultCanvasH   + 'px';

    // ── Exposer les données pour la sauvegarde (save-load.js) ───────────────
    widget._pxlGetData = () => {
        const pixels = {};
        canvas.querySelectorAll('.pixelart-pixel').forEach((cell, index) => {
            if (!_pxlIsWhite(cell.style.backgroundColor)) pixels[index] = cell.style.backgroundColor;
        });
        return {
            size: currentSize,
            pixels,
            containerW: container.offsetWidth,
            canvasH: canvas.offsetHeight
        };
    };

    saveBoard();
    return widget;
}
