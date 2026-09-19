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
        .pixelart-btn-code {
            background: #f3e8ff;
            color: #6b21a8;
        }
        .pixelart-btn-code:hover { background: #e9d5ff; }
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
            box-sizing: border-box;
            flex-shrink: 0;
        }
        /* Grille (carrée) à gauche, palette à droite */
        .pixelart-body {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            flex-shrink: 0;
        }
        .pixelart-pixel {
            border: 1px solid rgba(0,0,0,0.06);
        }

        /* Palette + gomme : colonne à droite de la grille.
           --pxl-cell (taille d'une pastille) et --pxl-gap sont fixés en JS
           pour que la palette suive la taille de la grille. */
        .pixelart-palette-row {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: var(--pxl-gap, 4px);
            width: calc(2 * var(--pxl-cell, 26px) + var(--pxl-gap, 4px));
            flex-shrink: 0;
        }
        .pixelart-eraser {
            width: 100%;
            height: var(--pxl-cell, 26px);
            padding: 0;
            box-sizing: border-box;
            border-radius: 8px;
            border: 2px dashed #ccc;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: calc(var(--pxl-cell, 26px) * 0.55);
            cursor: pointer;
            flex-shrink: 0;
            transition: all .15s;
        }
        .pixelart-eraser.active {
            border-color: #4a90e2;
            background: #e8f1fc;
        }
        .pixelart-palette {
            display: grid;
            grid-template-columns: repeat(2, var(--pxl-cell, 26px));
            gap: var(--pxl-gap, 4px);
        }
        .pixelart-swatch {
            width: var(--pxl-cell, 26px);
            height: var(--pxl-cell, 26px);
            box-sizing: border-box;
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

        /* Poignée resize : redimensionne le widget entier de façon proportionnelle
           (la grille reste toujours carrée, la palette suit). */
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
    defaultSize: 20,
    minSize: 10,
    maxSize: 50,
    defaultCanvasSide: 600,   // côté (px) de la grille carrée
    minCanvasSide: 200,
    maxCanvasSide: 900,
    colors: [
        // Couleurs de base
        '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
        '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#78350f',
        // Couleurs supplémentaires (utilisées par les modèles Toad, Hello Kitty, Burger, Dracaufeu…)
        '#fadea6', // crème
        '#f0ccaa', // peau
        '#fa9e87', // saumon
        '#ee706c', // saumon foncé
        '#faa0a0', // rose clair
        '#ff68e4', // magenta
        '#f82870', // rose vif
        '#fce860', // jaune clair
        '#70f8b2', // menthe
        '#008278'  // vert-bleu
    ]
};

const PXL_MODELES = {
    coeur: { size: 16, data: {"35":"#ef4444","36":"#ef4444","37":"#ef4444","38":"#ef4444","41":"#ef4444","42":"#ef4444","43":"#ef4444","44":"#ef4444","50":"#ef4444","51":"#ef4444","52":"#ef4444","53":"#ef4444","54":"#ef4444","55":"#ef4444","56":"#ef4444","57":"#ef4444","58":"#ef4444","59":"#ef4444","60":"#ef4444","61":"#ef4444","65":"#ef4444","66":"#ef4444","68":"#ef4444","69":"#ef4444","70":"#ef4444","71":"#ef4444","72":"#ef4444","73":"#ef4444","74":"#ef4444","75":"#ef4444","76":"#ef4444","77":"#ef4444","78":"#ef4444","81":"#ef4444","83":"#ef4444","84":"#ef4444","85":"#ef4444","86":"#ef4444","87":"#ef4444","88":"#ef4444","89":"#ef4444","90":"#ef4444","91":"#ef4444","92":"#ef4444","93":"#ef4444","94":"#ef4444","97":"#ef4444","99":"#ef4444","100":"#ef4444","101":"#ef4444","102":"#ef4444","103":"#ef4444","104":"#ef4444","105":"#ef4444","106":"#ef4444","107":"#ef4444","108":"#ef4444","109":"#ef4444","110":"#ef4444","113":"#ef4444","114":"#ef4444","116":"#ef4444","117":"#ef4444","118":"#ef4444","119":"#ef4444","120":"#ef4444","121":"#ef4444","122":"#ef4444","123":"#ef4444","124":"#ef4444","125":"#ef4444","126":"#ef4444","130":"#ef4444","131":"#ef4444","132":"#ef4444","133":"#ef4444","134":"#ef4444","135":"#ef4444","136":"#ef4444","137":"#ef4444","138":"#ef4444","139":"#ef4444","140":"#ef4444","141":"#ef4444","147":"#ef4444","148":"#ef4444","149":"#ef4444","150":"#ef4444","151":"#ef4444","152":"#ef4444","153":"#ef4444","154":"#ef4444","155":"#ef4444","156":"#ef4444","164":"#ef4444","165":"#ef4444","166":"#ef4444","167":"#ef4444","168":"#ef4444","169":"#ef4444","170":"#ef4444","171":"#ef4444","181":"#ef4444","182":"#ef4444","183":"#ef4444","184":"#ef4444","185":"#ef4444","186":"#ef4444","198":"#ef4444","199":"#ef4444","200":"#ef4444","201":"#ef4444","215":"#ef4444","216":"#ef4444"} },
	smiley: { size: 16, data: {"21":"#eab308","22":"#eab308","23":"#eab308","24":"#eab308","25":"#eab308","26":"#eab308","36":"#eab308","37":"#eab308","38":"#eab308","39":"#eab308","40":"#eab308","41":"#eab308","42":"#eab308","43":"#eab308","51":"#eab308","52":"#eab308","53":"#eab308","54":"#eab308","55":"#eab308","56":"#eab308","57":"#eab308","58":"#eab308","59":"#eab308","60":"#eab308","66":"#eab308","67":"#eab308","68":"#eab308","69":"#eab308","70":"#eab308","71":"#eab308","72":"#eab308","73":"#eab308","74":"#eab308","75":"#eab308","76":"#eab308","77":"#eab308","81":"#eab308","82":"#eab308","83":"#eab308","84":"#000000","85":"#000000","86":"#eab308","87":"#eab308","88":"#eab308","89":"#eab308","90":"#000000","91":"#000000","92":"#eab308","93":"#eab308","94":"#eab308","97":"#eab308","98":"#eab308","99":"#eab308","100":"#000000","101":"#000000","102":"#eab308","103":"#eab308","104":"#eab308","105":"#eab308","106":"#000000","107":"#000000","108":"#eab308","109":"#eab308","110":"#eab308","113":"#eab308","114":"#eab308","115":"#eab308","116":"#eab308","117":"#eab308","118":"#eab308","119":"#eab308","120":"#eab308","121":"#eab308","122":"#eab308","123":"#eab308","124":"#eab308","125":"#eab308","126":"#eab308","129":"#eab308","130":"#eab308","131":"#eab308","132":"#eab308","133":"#eab308","134":"#eab308","135":"#eab308","136":"#eab308","137":"#eab308","138":"#eab308","139":"#eab308","140":"#eab308","141":"#eab308","142":"#eab308","145":"#eab308","146":"#eab308","147":"#eab308","148":"#eab308","149":"#eab308","150":"#eab308","151":"#eab308","152":"#eab308","153":"#eab308","154":"#eab308","155":"#eab308","156":"#eab308","157":"#eab308","158":"#eab308","161":"#eab308","162":"#eab308","163":"#eab308","164":"#000000","165":"#eab308","166":"#eab308","167":"#eab308","168":"#eab308","169":"#eab308","170":"#eab308","171":"#000000","172":"#eab308","173":"#eab308","174":"#eab308","178":"#eab308","179":"#eab308","180":"#eab308","181":"#000000","182":"#eab308","183":"#eab308","184":"#eab308","185":"#eab308","186":"#000000","187":"#eab308","188":"#eab308","189":"#eab308","195":"#eab308","196":"#eab308","197":"#eab308","198":"#000000","199":"#000000","200":"#000000","201":"#000000","202":"#eab308","203":"#eab308","204":"#eab308","212":"#eab308","213":"#eab308","214":"#eab308","215":"#eab308","216":"#eab308","217":"#eab308","218":"#eab308","219":"#eab308","229":"#eab308","230":"#eab308","231":"#eab308","232":"#eab308","233":"#eab308","234":"#eab308"} },
	burger: { size: 24, data: {"31":"#000000","32":"#000000","33":"#000000","34":"#000000","35":"#000000","36":"#000000","37":"#000000","38":"#000000","39":"#000000","40":"#000000","53":"#000000","54":"#000000","55":"#ee706c","56":"#fa9e87","57":"#fa9e87","58":"#ee706c","59":"#fa9e87","60":"#fa9e87","61":"#ee706c","62":"#fa9e87","63":"#fa9e87","64":"#ee706c","65":"#000000","66":"#000000","76":"#000000","77":"#fa9e87","78":"#fa9e87","79":"#fa9e87","80":"#ee706c","81":"#fa9e87","82":"#fa9e87","83":"#fa9e87","84":"#fa9e87","85":"#fa9e87","86":"#fa9e87","87":"#ee706c","88":"#fa9e87","89":"#fa9e87","90":"#fa9e87","91":"#000000","99":"#000000","100":"#fa9e87","101":"#fa9e87","102":"#ee706c","103":"#fa9e87","104":"#fa9e87","105":"#fa9e87","106":"#ee706c","107":"#fa9e87","108":"#fa9e87","109":"#ee706c","110":"#fa9e87","111":"#fa9e87","112":"#fa9e87","113":"#ee706c","114":"#fa9e87","115":"#fa9e87","116":"#000000","122":"#000000","123":"#fa9e87","124":"#ee706c","125":"#fa9e87","126":"#fa9e87","127":"#fa9e87","128":"#fa9e87","129":"#fa9e87","130":"#fa9e87","131":"#fa9e87","132":"#fa9e87","133":"#fa9e87","134":"#fa9e87","135":"#fa9e87","136":"#fa9e87","137":"#fa9e87","138":"#fa9e87","139":"#ee706c","140":"#fa9e87","141":"#000000","146":"#000000","147":"#fa9e87","148":"#fa9e87","149":"#fa9e87","150":"#000000","152":"#fa9e87","153":"#fa9e87","154":"#fa9e87","155":"#fa9e87","156":"#fa9e87","157":"#fa9e87","158":"#fa9e87","159":"#fa9e87","161":"#000000","162":"#fa9e87","163":"#fa9e87","164":"#fa9e87","165":"#000000","170":"#000000","171":"#fa9e87","172":"#fa9e87","173":"#fa9e87","174":"#000000","175":"#000000","176":"#fa9e87","177":"#fa9e87","178":"#000000","179":"#fa9e87","180":"#fa9e87","181":"#000000","182":"#fa9e87","183":"#fa9e87","184":"#000000","185":"#000000","186":"#fa9e87","187":"#fa9e87","188":"#fa9e87","189":"#000000","194":"#000000","195":"#fa9e87","196":"#fa9e87","197":"#ff68e4","198":"#ff68e4","199":"#fa9e87","200":"#fa9e87","201":"#fa9e87","202":"#000000","203":"#000000","204":"#000000","205":"#000000","206":"#fa9e87","207":"#fa9e87","208":"#fa9e87","209":"#ff68e4","210":"#ff68e4","211":"#fa9e87","212":"#fa9e87","213":"#000000","218":"#000000","219":"#000000","220":"#fa9e87","221":"#fa9e87","222":"#fa9e87","223":"#fa9e87","224":"#fa9e87","225":"#fa9e87","226":"#fa9e87","227":"#fa9e87","228":"#fa9e87","229":"#fa9e87","230":"#fa9e87","231":"#fa9e87","232":"#fa9e87","233":"#fa9e87","234":"#fa9e87","235":"#fa9e87","236":"#000000","237":"#000000","241":"#000000","242":"#70f8b2","243":"#70f8b2","244":"#000000","245":"#000000","246":"#000000","247":"#000000","248":"#000000","249":"#000000","250":"#000000","251":"#000000","252":"#000000","253":"#000000","254":"#000000","255":"#000000","256":"#000000","257":"#000000","258":"#000000","259":"#000000","260":"#70f8b2","261":"#70f8b2","262":"#000000","264":"#000000","265":"#70f8b2","266":"#70f8b2","267":"#000000","268":"#70f8b2","269":"#70f8b2","270":"#70f8b2","271":"#70f8b2","272":"#70f8b2","273":"#70f8b2","274":"#70f8b2","275":"#70f8b2","276":"#70f8b2","277":"#70f8b2","278":"#70f8b2","279":"#70f8b2","280":"#70f8b2","281":"#70f8b2","282":"#70f8b2","283":"#70f8b2","284":"#000000","285":"#70f8b2","286":"#70f8b2","287":"#000000","289":"#000000","290":"#000000","291":"#f82870","292":"#000000","293":"#000000","294":"#70f8b2","295":"#70f8b2","296":"#70f8b2","297":"#70f8b2","298":"#000000","299":"#000000","300":"#000000","301":"#000000","302":"#70f8b2","303":"#70f8b2","304":"#70f8b2","305":"#70f8b2","306":"#000000","307":"#000000","308":"#f82870","309":"#000000","310":"#000000","311":"#000000","314":"#000000","315":"#f82870","316":"#f82870","317":"#f82870","318":"#000000","319":"#000000","320":"#000000","321":"#000000","322":"#f82870","323":"#f82870","324":"#f82870","325":"#f82870","326":"#000000","327":"#000000","328":"#000000","329":"#000000","330":"#f82870","331":"#f82870","332":"#f82870","333":"#000000","337":"#000000","338":"#000000","339":"#fce860","340":"#fce860","341":"#ee706c","342":"#ee706c","343":"#ee706c","344":"#ee706c","345":"#ee706c","346":"#ee706c","347":"#ee706c","348":"#ee706c","349":"#ee706c","350":"#ee706c","351":"#ee706c","352":"#ee706c","353":"#ee706c","354":"#ee706c","355":"#fce860","356":"#fce860","357":"#000000","360":"#000000","361":"#000000","362":"#70f8b2","363":"#ee706c","364":"#ee706c","365":"#fce860","366":"#fce860","367":"#fce860","368":"#fce860","369":"#fce860","370":"#fce860","371":"#fce860","372":"#fce860","373":"#fce860","374":"#fce860","375":"#fce860","376":"#fce860","377":"#fce860","378":"#fce860","379":"#ee706c","380":"#ee706c","381":"#000000","382":"#000000","383":"#000000","384":"#000000","385":"#70f8b2","386":"#70f8b2","387":"#000000","388":"#000000","389":"#000000","390":"#000000","391":"#000000","392":"#000000","393":"#fce860","394":"#fce860","395":"#fce860","396":"#fce860","397":"#fce860","398":"#fce860","399":"#000000","400":"#000000","401":"#000000","402":"#000000","403":"#000000","404":"#000000","405":"#70f8b2","406":"#70f8b2","407":"#000000","409":"#000000","410":"#000000","411":"#70f8b2","412":"#70f8b2","413":"#70f8b2","414":"#70f8b2","415":"#70f8b2","416":"#70f8b2","417":"#000000","418":"#000000","419":"#fce860","420":"#fce860","421":"#000000","422":"#000000","423":"#70f8b2","424":"#70f8b2","425":"#70f8b2","426":"#70f8b2","427":"#70f8b2","428":"#70f8b2","429":"#000000","430":"#000000","434":"#000000","435":"#000000","436":"#000000","437":"#000000","438":"#70f8b2","439":"#70f8b2","440":"#70f8b2","441":"#000000","442":"#fa9e87","443":"#000000","444":"#000000","445":"#fa9e87","446":"#000000","447":"#70f8b2","448":"#70f8b2","449":"#70f8b2","450":"#000000","451":"#000000","452":"#000000","453":"#000000","458":"#000000","459":"#fa9e87","460":"#fa9e87","461":"#fa9e87","462":"#000000","463":"#000000","464":"#000000","465":"#fa9e87","466":"#fa9e87","467":"#fa9e87","468":"#fa9e87","469":"#fa9e87","470":"#fa9e87","471":"#000000","472":"#000000","473":"#000000","474":"#fa9e87","475":"#fa9e87","476":"#fa9e87","477":"#000000","483":"#000000","484":"#fa9e87","485":"#fa9e87","486":"#fa9e87","487":"#fa9e87","488":"#fa9e87","489":"#fa9e87","490":"#fa9e87","491":"#fa9e87","492":"#fa9e87","493":"#fa9e87","494":"#fa9e87","495":"#fa9e87","496":"#fa9e87","497":"#fa9e87","498":"#fa9e87","499":"#fa9e87","500":"#000000","508":"#000000","509":"#000000","510":"#000000","511":"#000000","512":"#000000","513":"#000000","514":"#000000","515":"#000000","516":"#000000","517":"#000000","518":"#000000","519":"#000000","520":"#000000","521":"#000000","522":"#000000","523":"#000000"} },
	glace: { size: 28, data: {"10":"#000000","11":"#000000","12":"#000000","13":"#000000","14":"#000000","15":"#000000","16":"#000000","36":"#000000","37":"#000000","38":"#22c55e","39":"#22c55e","40":"#22c55e","41":"#22c55e","42":"#22c55e","43":"#22c55e","44":"#22c55e","45":"#000000","46":"#000000","63":"#000000","64":"#22c55e","65":"#22c55e","66":"#22c55e","67":"#22c55e","68":"#22c55e","69":"#22c55e","70":"#22c55e","71":"#22c55e","72":"#22c55e","73":"#22c55e","74":"#22c55e","75":"#000000","90":"#000000","91":"#22c55e","92":"#000000","93":"#000000","94":"#22c55e","95":"#22c55e","96":"#22c55e","97":"#22c55e","98":"#22c55e","99":"#22c55e","100":"#22c55e","101":"#000000","102":"#000000","103":"#22c55e","104":"#000000","117":"#000000","118":"#22c55e","119":"#000000","120":"#000000","122":"#000000","123":"#22c55e","124":"#22c55e","125":"#22c55e","126":"#22c55e","127":"#22c55e","128":"#000000","129":"#000000","131":"#000000","132":"#22c55e","133":"#000000","145":"#000000","146":"#22c55e","147":"#000000","148":"#000000","149":"#000000","150":"#000000","151":"#22c55e","152":"#22c55e","153":"#22c55e","154":"#22c55e","155":"#22c55e","156":"#000000","157":"#000000","158":"#000000","159":"#000000","160":"#22c55e","161":"#000000","172":"#000000","173":"#22c55e","174":"#22c55e","175":"#22c55e","176":"#000000","177":"#000000","178":"#22c55e","179":"#22c55e","180":"#22c55e","181":"#22c55e","182":"#22c55e","183":"#22c55e","184":"#22c55e","185":"#000000","186":"#000000","187":"#22c55e","188":"#22c55e","189":"#22c55e","190":"#000000","200":"#000000","201":"#22c55e","202":"#fa9e87","203":"#fa9e87","204":"#fa9e87","205":"#22c55e","206":"#22c55e","207":"#22c55e","208":"#22c55e","209":"#22c55e","210":"#22c55e","211":"#22c55e","212":"#22c55e","213":"#22c55e","214":"#fa9e87","215":"#fa9e87","216":"#fa9e87","217":"#22c55e","218":"#000000","228":"#000000","229":"#22c55e","230":"#fa9e87","231":"#fa9e87","232":"#fa9e87","233":"#22c55e","234":"#22c55e","235":"#000000","236":"#22c55e","237":"#22c55e","238":"#22c55e","239":"#000000","240":"#22c55e","241":"#22c55e","242":"#fa9e87","243":"#fa9e87","244":"#fa9e87","245":"#22c55e","246":"#000000","256":"#000000","257":"#22c55e","258":"#22c55e","259":"#22c55e","260":"#22c55e","261":"#22c55e","262":"#22c55e","263":"#22c55e","264":"#000000","265":"#000000","266":"#000000","267":"#22c55e","268":"#22c55e","269":"#22c55e","270":"#22c55e","271":"#22c55e","272":"#22c55e","273":"#22c55e","274":"#000000","283":"#000000","284":"#22c55e","285":"#22c55e","286":"#22c55e","287":"#22c55e","288":"#22c55e","289":"#22c55e","290":"#22c55e","291":"#22c55e","292":"#22c55e","293":"#22c55e","294":"#22c55e","295":"#22c55e","296":"#22c55e","297":"#22c55e","298":"#22c55e","299":"#22c55e","300":"#22c55e","301":"#22c55e","302":"#22c55e","303":"#000000","311":"#000000","312":"#22c55e","313":"#22c55e","314":"#22c55e","315":"#22c55e","316":"#22c55e","317":"#22c55e","318":"#000000","319":"#22c55e","320":"#22c55e","321":"#22c55e","322":"#22c55e","323":"#22c55e","324":"#000000","325":"#22c55e","326":"#22c55e","327":"#22c55e","328":"#22c55e","329":"#22c55e","330":"#22c55e","331":"#000000","340":"#000000","341":"#22c55e","342":"#22c55e","343":"#22c55e","344":"#22c55e","345":"#000000","346":"#4e342d","347":"#000000","348":"#22c55e","349":"#22c55e","350":"#22c55e","351":"#000000","352":"#8b6e63","353":"#000000","354":"#22c55e","355":"#22c55e","356":"#22c55e","357":"#22c55e","358":"#000000","369":"#000000","370":"#000000","371":"#000000","372":"#000000","373":"#8b6e63","374":"#8b6e63","375":"#4e342d","376":"#000000","377":"#000000","378":"#000000","379":"#4e342d","380":"#8b6e63","381":"#8b6e63","382":"#000000","383":"#000000","384":"#000000","385":"#000000","398":"#000000","399":"#8b6e63","400":"#4e342d","401":"#8b6e63","402":"#8b6e63","403":"#8b6e63","404":"#4e342d","405":"#8b6e63","406":"#8b6e63","407":"#8b6e63","408":"#4e342d","409":"#8b6e63","410":"#8b6e63","411":"#8b6e63","412":"#000000","427":"#000000","428":"#8b6e63","429":"#4e342d","430":"#8b6e63","431":"#8b6e63","432":"#8b6e63","433":"#4e342d","434":"#8b6e63","435":"#8b6e63","436":"#8b6e63","437":"#4e342d","438":"#8b6e63","439":"#000000","455":"#000000","456":"#8b6e63","457":"#8b6e63","458":"#4e342d","459":"#8b6e63","460":"#8b6e63","461":"#8b6e63","462":"#4e342d","463":"#8b6e63","464":"#8b6e63","465":"#8b6e63","466":"#4e342d","467":"#000000","484":"#000000","485":"#8b6e63","486":"#8b6e63","487":"#4e342d","488":"#8b6e63","489":"#8b6e63","490":"#8b6e63","491":"#4e342d","492":"#8b6e63","493":"#8b6e63","494":"#000000","512":"#000000","513":"#8b6e63","514":"#8b6e63","515":"#8b6e63","516":"#4e342d","517":"#8b6e63","518":"#8b6e63","519":"#8b6e63","520":"#4e342d","521":"#8b6e63","522":"#000000","541":"#000000","542":"#8b6e63","543":"#8b6e63","544":"#8b6e63","545":"#4e342d","546":"#8b6e63","547":"#8b6e63","548":"#8b6e63","549":"#000000","569":"#000000","570":"#4e342d","571":"#8b6e63","572":"#8b6e63","573":"#8b6e63","574":"#4e342d","575":"#8b6e63","576":"#8b6e63","577":"#000000","598":"#000000","599":"#4e342d","600":"#8b6e63","601":"#8b6e63","602":"#8b6e63","603":"#4e342d","604":"#000000","626":"#000000","627":"#8b6e63","628":"#4e342d","629":"#8b6e63","630":"#8b6e63","631":"#8b6e63","632":"#000000","655":"#000000","656":"#8b6e63","657":"#4e342d","658":"#8b6e63","659":"#000000","683":"#000000","684":"#8b6e63","685":"#8b6e63","686":"#4e342d","687":"#000000","712":"#000000","713":"#8b6e63","714":"#000000","740":"#000000","741":"#8b6e63","742":"#000000","769":"#000000"} },
    hellokitty: { size: 31, data: {"109":"#78350f","110":"#78350f","111":"#78350f","127":"#78350f","128":"#78350f","129":"#78350f","139":"#78350f","140":"#faa0a0","141":"#faa0a0","142":"#faa0a0","143":"#78350f","147":"#78350f","148":"#78350f","149":"#78350f","157":"#78350f","158":"#fadea6","159":"#fadea6","160":"#fadea6","161":"#78350f","162":"#78350f","169":"#78350f","170":"#faa0a0","171":"#faa0a0","172":"#faa0a0","173":"#faa0a0","174":"#faa0a0","175":"#78350f","177":"#78350f","178":"#fadea6","179":"#fadea6","180":"#fadea6","181":"#78350f","188":"#78350f","189":"#fadea6","190":"#fadea6","191":"#fadea6","192":"#fadea6","193":"#fadea6","194":"#78350f","200":"#78350f","201":"#faa0a0","202":"#faa0a0","203":"#faa0a0","204":"#faa0a0","205":"#faa0a0","206":"#78350f","207":"#78350f","208":"#fadea6","209":"#fadea6","210":"#fadea6","211":"#fadea6","212":"#78350f","219":"#78350f","220":"#fadea6","221":"#fadea6","222":"#faa0a0","223":"#faa0a0","224":"#fadea6","225":"#fadea6","226":"#78350f","227":"#78350f","228":"#78350f","229":"#78350f","230":"#78350f","231":"#faa0a0","232":"#faa0a0","233":"#faa0a0","234":"#78350f","235":"#78350f","236":"#78350f","237":"#78350f","238":"#78350f","239":"#78350f","240":"#fadea6","241":"#78350f","242":"#78350f","243":"#78350f","244":"#78350f","250":"#78350f","251":"#fadea6","252":"#faa0a0","253":"#faa0a0","254":"#faa0a0","255":"#faa0a0","256":"#fadea6","257":"#fadea6","258":"#fadea6","259":"#fadea6","260":"#fadea6","261":"#78350f","262":"#faa0a0","263":"#faa0a0","264":"#faa0a0","265":"#78350f","266":"#faa0a0","267":"#78350f","268":"#faa0a0","269":"#faa0a0","270":"#faa0a0","271":"#78350f","272":"#faa0a0","273":"#faa0a0","274":"#faa0a0","275":"#faa0a0","276":"#78350f","281":"#78350f","282":"#fadea6","283":"#faa0a0","284":"#faa0a0","285":"#faa0a0","286":"#fadea6","287":"#fadea6","288":"#fadea6","289":"#fadea6","290":"#fadea6","291":"#fadea6","292":"#78350f","293":"#faa0a0","294":"#faa0a0","295":"#faa0a0","296":"#faa0a0","297":"#78350f","298":"#faa0a0","299":"#faa0a0","300":"#faa0a0","301":"#faa0a0","302":"#78350f","303":"#faa0a0","304":"#faa0a0","305":"#faa0a0","306":"#faa0a0","307":"#78350f","312":"#78350f","313":"#fadea6","314":"#faa0a0","315":"#faa0a0","316":"#fadea6","317":"#fadea6","318":"#fadea6","319":"#fadea6","320":"#fadea6","321":"#fadea6","322":"#fadea6","323":"#fadea6","324":"#78350f","325":"#faa0a0","326":"#faa0a0","327":"#faa0a0","328":"#78350f","329":"#faa0a0","330":"#faa0a0","331":"#faa0a0","332":"#faa0a0","333":"#78350f","334":"#78350f","335":"#faa0a0","336":"#faa0a0","337":"#faa0a0","338":"#78350f","343":"#78350f","344":"#fadea6","345":"#fadea6","346":"#fadea6","347":"#fadea6","348":"#fadea6","349":"#fadea6","350":"#fadea6","351":"#fadea6","352":"#fadea6","353":"#fadea6","354":"#fadea6","355":"#fadea6","356":"#78350f","357":"#78350f","358":"#78350f","359":"#fadea6","360":"#78350f","361":"#faa0a0","362":"#faa0a0","363":"#78350f","364":"#faa0a0","365":"#78350f","366":"#faa0a0","367":"#faa0a0","368":"#faa0a0","369":"#78350f","375":"#78350f","376":"#fadea6","377":"#fadea6","378":"#fadea6","379":"#fadea6","380":"#fadea6","381":"#fadea6","382":"#fadea6","383":"#fadea6","384":"#fadea6","385":"#fadea6","386":"#fadea6","387":"#fadea6","388":"#fadea6","389":"#fadea6","390":"#fadea6","391":"#fadea6","392":"#78350f","393":"#78350f","394":"#78350f","395":"#faa0a0","396":"#faa0a0","397":"#faa0a0","398":"#faa0a0","399":"#78350f","406":"#78350f","407":"#fadea6","408":"#fadea6","409":"#fadea6","410":"#fadea6","411":"#fadea6","412":"#fadea6","413":"#fadea6","414":"#fadea6","415":"#fadea6","416":"#fadea6","417":"#fadea6","418":"#fadea6","419":"#fadea6","420":"#fadea6","421":"#fadea6","422":"#fadea6","423":"#fadea6","424":"#fadea6","425":"#78350f","426":"#faa0a0","427":"#faa0a0","428":"#faa0a0","429":"#78350f","430":"#78350f","436":"#78350f","437":"#fadea6","438":"#fadea6","439":"#fadea6","440":"#fadea6","441":"#fadea6","442":"#fadea6","443":"#fadea6","444":"#fadea6","445":"#fadea6","446":"#fadea6","447":"#fadea6","448":"#fadea6","449":"#fadea6","450":"#fadea6","451":"#fadea6","452":"#fadea6","453":"#fadea6","454":"#fadea6","455":"#fadea6","456":"#fadea6","457":"#78350f","458":"#78350f","459":"#78350f","460":"#fadea6","461":"#78350f","467":"#78350f","468":"#fadea6","469":"#fadea6","470":"#fadea6","471":"#fadea6","472":"#fadea6","473":"#fadea6","474":"#fadea6","475":"#fadea6","476":"#fadea6","477":"#fadea6","478":"#fadea6","479":"#fadea6","480":"#fadea6","481":"#fadea6","482":"#fadea6","483":"#fadea6","484":"#fadea6","485":"#fadea6","486":"#fadea6","487":"#fadea6","488":"#fadea6","489":"#fadea6","490":"#fadea6","491":"#fadea6","492":"#78350f","496":"#78350f","497":"#78350f","498":"#78350f","499":"#78350f","500":"#fadea6","501":"#fadea6","502":"#fadea6","503":"#fadea6","504":"#78350f","505":"#78350f","506":"#fadea6","507":"#fadea6","508":"#fadea6","509":"#fadea6","510":"#fadea6","511":"#fadea6","512":"#fadea6","513":"#fadea6","514":"#fadea6","515":"#fadea6","516":"#78350f","517":"#78350f","518":"#fadea6","519":"#fadea6","520":"#fadea6","521":"#fadea6","522":"#78350f","523":"#78350f","524":"#78350f","525":"#78350f","529":"#78350f","530":"#fadea6","531":"#fadea6","532":"#fadea6","533":"#fadea6","534":"#78350f","536":"#78350f","537":"#78350f","538":"#fadea6","539":"#fadea6","540":"#fadea6","541":"#fadea6","542":"#fadea6","543":"#fadea6","544":"#fadea6","545":"#fadea6","546":"#78350f","548":"#78350f","549":"#78350f","550":"#fadea6","551":"#fadea6","552":"#fadea6","553":"#fadea6","554":"#78350f","560":"#78350f","561":"#fadea6","562":"#fadea6","563":"#fadea6","564":"#fadea6","565":"#78350f","566":"#78350f","567":"#78350f","568":"#78350f","569":"#fadea6","570":"#fadea6","571":"#fadea6","572":"#fadea6","573":"#fadea6","574":"#fadea6","575":"#fadea6","576":"#fadea6","577":"#78350f","578":"#78350f","579":"#78350f","580":"#78350f","581":"#fadea6","582":"#fadea6","583":"#fadea6","584":"#fadea6","585":"#78350f","589":"#78350f","590":"#78350f","591":"#78350f","592":"#78350f","593":"#fadea6","594":"#fadea6","595":"#fadea6","596":"#fadea6","597":"#78350f","598":"#78350f","599":"#fadea6","600":"#fadea6","601":"#fadea6","602":"#fadea6","603":"#78350f","604":"#78350f","605":"#fadea6","606":"#fadea6","607":"#fadea6","608":"#fadea6","609":"#78350f","610":"#78350f","611":"#fadea6","612":"#fadea6","613":"#fadea6","614":"#fadea6","615":"#78350f","616":"#78350f","617":"#78350f","618":"#78350f","622":"#78350f","623":"#fadea6","624":"#fadea6","625":"#fadea6","626":"#faa0a0","627":"#faa0a0","628":"#fadea6","629":"#fadea6","630":"#fadea6","631":"#fadea6","632":"#fadea6","633":"#fadea6","634":"#fadea6","635":"#fadea6","636":"#fadea6","637":"#fadea6","638":"#fadea6","639":"#fadea6","640":"#fadea6","641":"#fadea6","642":"#faa0a0","643":"#faa0a0","644":"#fadea6","645":"#fadea6","646":"#fadea6","647":"#78350f","653":"#78350f","654":"#fadea6","655":"#fadea6","656":"#faa0a0","657":"#faa0a0","658":"#faa0a0","659":"#faa0a0","660":"#fadea6","661":"#fadea6","662":"#fadea6","663":"#78350f","664":"#fadea6","665":"#78350f","666":"#78350f","667":"#fadea6","668":"#78350f","669":"#fadea6","670":"#fadea6","671":"#fadea6","672":"#faa0a0","673":"#faa0a0","674":"#faa0a0","675":"#faa0a0","676":"#fadea6","677":"#fadea6","678":"#78350f","685":"#78350f","686":"#faa0a0","687":"#faa0a0","688":"#faa0a0","689":"#faa0a0","690":"#faa0a0","691":"#fadea6","692":"#fadea6","693":"#fadea6","694":"#fadea6","695":"#78350f","696":"#78350f","697":"#78350f","698":"#78350f","699":"#fadea6","700":"#fadea6","701":"#fadea6","702":"#fadea6","703":"#faa0a0","704":"#faa0a0","705":"#faa0a0","706":"#faa0a0","707":"#fadea6","708":"#78350f","716":"#78350f","717":"#78350f","718":"#fadea6","719":"#faa0a0","720":"#faa0a0","721":"#fadea6","722":"#fadea6","723":"#fadea6","724":"#fadea6","725":"#fadea6","726":"#fadea6","727":"#fadea6","728":"#fadea6","729":"#fadea6","730":"#fadea6","731":"#fadea6","732":"#fadea6","733":"#fadea6","734":"#fadea6","735":"#faa0a0","736":"#faa0a0","737":"#fadea6","738":"#78350f","739":"#78350f","748":"#78350f","749":"#78350f","750":"#fadea6","751":"#fadea6","752":"#fadea6","753":"#fadea6","754":"#fadea6","755":"#fadea6","756":"#fadea6","757":"#fadea6","758":"#fadea6","759":"#fadea6","760":"#fadea6","761":"#fadea6","762":"#fadea6","763":"#fadea6","764":"#fadea6","765":"#fadea6","766":"#fadea6","767":"#fadea6","768":"#78350f","769":"#78350f","781":"#78350f","782":"#78350f","783":"#fadea6","784":"#fadea6","785":"#fadea6","786":"#fadea6","787":"#fadea6","788":"#fadea6","789":"#fadea6","790":"#fadea6","791":"#fadea6","792":"#fadea6","793":"#fadea6","794":"#fadea6","795":"#fadea6","796":"#fadea6","797":"#78350f","798":"#78350f","799":"#78350f","814":"#78350f","815":"#78350f","816":"#78350f","817":"#78350f","818":"#78350f","819":"#78350f","820":"#78350f","821":"#78350f","822":"#78350f","823":"#78350f","824":"#78350f","825":"#78350f","826":"#78350f","827":"#78350f"} },
    mario: { size: 16, data: {"6":"#ef4444","7":"#ef4444","8":"#ef4444","9":"#ef4444","10":"#ef4444","21":"#ef4444","22":"#ef4444","23":"#ef4444","24":"#ef4444","25":"#ef4444","26":"#ef4444","27":"#ef4444","28":"#ef4444","37":"#78350f","38":"#78350f","39":"#78350f","40":"#eab308","41":"#000000","42":"#eab308","52":"#78350f","53":"#eab308","54":"#78350f","55":"#eab308","56":"#eab308","57":"#eab308","58":"#eab308","59":"#eab308","60":"#eab308","68":"#78350f","69":"#eab308","70":"#78350f","71":"#78350f","72":"#eab308","73":"#eab308","74":"#78350f","75":"#eab308","76":"#eab308","77":"#eab308","84":"#78350f","85":"#78350f","86":"#eab308","87":"#eab308","88":"#eab308","89":"#78350f","90":"#78350f","91":"#78350f","92":"#78350f","102":"#eab308","103":"#eab308","104":"#eab308","105":"#eab308","106":"#eab308","117":"#ef4444","118":"#ef4444","119":"#3b82f6","120":"#ef4444","121":"#3b82f6","122":"#ef4444","123":"#ef4444","132":"#ef4444","133":"#ef4444","134":"#ef4444","135":"#3b82f6","136":"#ef4444","137":"#3b82f6","138":"#ef4444","139":"#ef4444","140":"#ef4444","147":"#ef4444","148":"#ef4444","149":"#ef4444","150":"#ef4444","151":"#eab308","152":"#3b82f6","153":"#eab308","154":"#ef4444","155":"#ef4444","156":"#ef4444","157":"#ef4444","163":"#eab308","164":"#eab308","165":"#ef4444","166":"#3b82f6","167":"#3b82f6","168":"#3b82f6","169":"#3b82f6","170":"#3b82f6","171":"#ef4444","172":"#eab308","173":"#eab308","179":"#eab308","180":"#eab308","181":"#eab308","182":"#3b82f6","183":"#3b82f6","184":"#3b82f6","185":"#3b82f6","186":"#3b82f6","187":"#eab308","188":"#eab308","189":"#eab308","195":"#eab308","196":"#eab308","197":"#3b82f6","198":"#3b82f6","199":"#3b82f6","200":"#3b82f6","201":"#3b82f6","202":"#3b82f6","203":"#3b82f6","204":"#eab308","205":"#eab308","213":"#3b82f6","214":"#3b82f6","215":"#3b82f6","217":"#3b82f6","218":"#3b82f6","219":"#3b82f6","229":"#78350f","230":"#78350f","234":"#78350f","235":"#78350f","244":"#78350f","245":"#78350f","246":"#78350f","250":"#78350f","251":"#78350f","252":"#78350f"} },
	toad: { size: 26, data: {"36":"#000000","37":"#000000","38":"#000000","39":"#000000","40":"#000000","60":"#000000","61":"#000000","67":"#000000","68":"#000000","85":"#000000","89":"#ef4444","90":"#ef4444","95":"#000000","110":"#000000","114":"#ef4444","115":"#ef4444","116":"#ef4444","117":"#ef4444","122":"#000000","136":"#000000","140":"#ef4444","141":"#ef4444","142":"#ef4444","143":"#ef4444","149":"#000000","161":"#000000","162":"#ef4444","167":"#ef4444","168":"#ef4444","173":"#ef4444","174":"#ef4444","176":"#000000","187":"#000000","188":"#ef4444","189":"#ef4444","198":"#ef4444","199":"#ef4444","200":"#ef4444","201":"#ef4444","202":"#000000","213":"#000000","214":"#ef4444","215":"#ef4444","218":"#000000","219":"#000000","220":"#000000","221":"#000000","222":"#000000","224":"#ef4444","225":"#ef4444","226":"#ef4444","227":"#ef4444","228":"#000000","239":"#000000","240":"#ef4444","242":"#000000","243":"#000000","244":"#f0ccaa","245":"#f0ccaa","246":"#f0ccaa","247":"#f0ccaa","248":"#f0ccaa","249":"#000000","251":"#ef4444","252":"#ef4444","254":"#000000","265":"#000000","267":"#000000","268":"#f0ccaa","269":"#f0ccaa","270":"#000000","271":"#f0ccaa","272":"#f0ccaa","273":"#000000","274":"#f0ccaa","275":"#f0ccaa","276":"#000000","280":"#000000","292":"#000000","293":"#f0ccaa","294":"#f0ccaa","295":"#f0ccaa","296":"#000000","297":"#f0ccaa","298":"#f0ccaa","299":"#000000","300":"#f0ccaa","301":"#f0ccaa","302":"#f0ccaa","303":"#000000","305":"#000000","319":"#000000","320":"#f0ccaa","321":"#f0ccaa","322":"#f0ccaa","323":"#f0ccaa","324":"#f0ccaa","325":"#f0ccaa","326":"#f0ccaa","327":"#f0ccaa","328":"#f0ccaa","329":"#000000","331":"#000000","345":"#000000","346":"#f0ccaa","347":"#f0ccaa","348":"#000000","349":"#000000","350":"#000000","351":"#000000","352":"#f0ccaa","353":"#f0ccaa","354":"#f0ccaa","355":"#000000","356":"#000000","372":"#000000","373":"#f0ccaa","374":"#f0ccaa","375":"#f0ccaa","376":"#f0ccaa","377":"#f0ccaa","378":"#f0ccaa","379":"#f0ccaa","380":"#000000","399":"#000000","400":"#000000","401":"#000000","402":"#000000","403":"#000000","404":"#000000","405":"#000000","406":"#000000","407":"#000000","423":"#000000","424":"#000000","425":"#3b82f6","426":"#000000","427":"#f0ccaa","428":"#f0ccaa","429":"#000000","430":"#3b82f6","431":"#000000","432":"#f0ccaa","433":"#f0ccaa","434":"#000000","448":"#000000","449":"#f0ccaa","450":"#000000","451":"#3b82f6","452":"#000000","453":"#f0ccaa","454":"#f0ccaa","455":"#000000","456":"#3b82f6","457":"#3b82f6","458":"#000000","459":"#f0ccaa","460":"#f0ccaa","461":"#000000","473":"#000000","474":"#f0ccaa","475":"#000000","476":"#3b82f6","477":"#000000","478":"#f0ccaa","479":"#f0ccaa","480":"#f0ccaa","481":"#000000","482":"#3b82f6","483":"#3b82f6","484":"#000000","485":"#f0ccaa","486":"#f0ccaa","487":"#000000","499":"#000000","500":"#f0ccaa","501":"#000000","502":"#3b82f6","503":"#000000","504":"#000000","505":"#000000","506":"#000000","507":"#000000","508":"#000000","509":"#3b82f6","510":"#3b82f6","511":"#000000","512":"#f0ccaa","513":"#f0ccaa","514":"#000000","525":"#000000","526":"#000000","527":"#000000","528":"#000000","535":"#000000","536":"#000000","537":"#000000","538":"#f0ccaa","539":"#f0ccaa","540":"#000000","554":"#000000","558":"#000000","563":"#000000","564":"#000000","565":"#000000","579":"#000000","580":"#000000","581":"#000000","582":"#000000","583":"#000000","584":"#000000","585":"#000000","586":"#000000","587":"#000000","588":"#000000","589":"#000000","604":"#000000","605":"#78350f","606":"#78350f","607":"#78350f","608":"#78350f","609":"#000000","610":"#78350f","611":"#78350f","612":"#78350f","613":"#78350f","614":"#78350f","615":"#000000","630":"#000000","631":"#000000","632":"#000000","633":"#000000","634":"#000000","635":"#000000","636":"#000000","637":"#000000","638":"#000000","639":"#000000","640":"#000000","641":"#000000"} },
	pikachu: { size: 30, data: {"91":"#000000","92":"#000000","117":"#000000","118":"#000000","121":"#000000","122":"#000000","123":"#000000","124":"#000000","145":"#000000","146":"#000000","147":"#000000","148":"#000000","151":"#000000","152":"#000000","153":"#000000","154":"#eab308","155":"#000000","174":"#000000","175":"#eab308","176":"#000000","177":"#000000","178":"#000000","181":"#000000","182":"#000000","183":"#000000","184":"#eab308","185":"#eab308","186":"#000000","187":"#000000","202":"#000000","203":"#000000","204":"#eab308","205":"#eab308","206":"#000000","207":"#000000","208":"#000000","212":"#000000","213":"#000000","214":"#eab308","215":"#eab308","216":"#eab308","217":"#eab308","218":"#000000","231":"#000000","232":"#eab308","233":"#eab308","234":"#eab308","235":"#eab308","236":"#000000","237":"#000000","242":"#000000","243":"#000000","244":"#eab308","245":"#eab308","246":"#eab308","247":"#eab308","248":"#eab308","249":"#000000","250":"#000000","253":"#000000","254":"#000000","255":"#000000","256":"#000000","259":"#000000","260":"#000000","261":"#eab308","262":"#eab308","263":"#eab308","264":"#eab308","265":"#eab308","266":"#000000","267":"#000000","273":"#000000","274":"#eab308","275":"#eab308","276":"#eab308","277":"#eab308","278":"#eab308","279":"#eab308","280":"#eab308","281":"#000000","282":"#000000","283":"#eab308","284":"#eab308","285":"#eab308","286":"#eab308","287":"#000000","288":"#000000","289":"#eab308","290":"#eab308","291":"#eab308","292":"#eab308","293":"#eab308","294":"#eab308","295":"#eab308","296":"#000000","303":"#000000","304":"#eab308","305":"#eab308","306":"#eab308","307":"#eab308","308":"#eab308","309":"#eab308","310":"#eab308","311":"#eab308","312":"#eab308","313":"#eab308","314":"#eab308","315":"#eab308","316":"#eab308","317":"#eab308","318":"#eab308","319":"#eab308","320":"#eab308","321":"#eab308","322":"#eab308","323":"#eab308","324":"#eab308","325":"#eab308","326":"#000000","334":"#000000","335":"#eab308","336":"#eab308","337":"#eab308","338":"#eab308","339":"#eab308","340":"#eab308","341":"#eab308","342":"#eab308","343":"#eab308","344":"#eab308","345":"#eab308","346":"#eab308","347":"#eab308","348":"#eab308","349":"#eab308","350":"#eab308","351":"#eab308","352":"#eab308","353":"#eab308","354":"#eab308","355":"#000000","365":"#000000","366":"#eab308","367":"#000000","368":"#eab308","369":"#eab308","370":"#eab308","371":"#eab308","372":"#eab308","373":"#eab308","374":"#eab308","375":"#eab308","376":"#eab308","377":"#eab308","378":"#eab308","379":"#eab308","380":"#eab308","381":"#eab308","382":"#000000","383":"#eab308","384":"#000000","396":"#000000","397":"#eab308","398":"#eab308","399":"#eab308","400":"#eab308","401":"#eab308","402":"#eab308","403":"#eab308","404":"#eab308","405":"#eab308","406":"#eab308","407":"#eab308","408":"#eab308","409":"#eab308","410":"#eab308","411":"#eab308","412":"#eab308","413":"#000000","426":"#000000","427":"#eab308","428":"#eab308","429":"#eab308","430":"#eab308","431":"#eab308","432":"#eab308","433":"#eab308","434":"#eab308","435":"#eab308","436":"#eab308","437":"#eab308","438":"#eab308","439":"#eab308","440":"#eab308","441":"#eab308","442":"#eab308","443":"#000000","455":"#000000","456":"#eab308","457":"#eab308","458":"#eab308","459":"#000000","460":"#000000","461":"#eab308","462":"#eab308","463":"#eab308","464":"#eab308","465":"#eab308","466":"#eab308","467":"#eab308","468":"#eab308","469":"#000000","470":"#000000","471":"#eab308","472":"#eab308","473":"#eab308","474":"#000000","485":"#000000","486":"#eab308","487":"#eab308","488":"#000000","489":"#000000","491":"#000000","492":"#eab308","493":"#eab308","494":"#eab308","495":"#eab308","496":"#eab308","497":"#eab308","498":"#000000","499":"#000000","501":"#000000","502":"#eab308","503":"#eab308","504":"#000000","515":"#000000","516":"#eab308","517":"#eab308","518":"#000000","519":"#000000","520":"#000000","521":"#000000","522":"#eab308","523":"#eab308","524":"#eab308","525":"#eab308","526":"#eab308","527":"#eab308","528":"#000000","529":"#000000","530":"#000000","531":"#000000","532":"#eab308","533":"#eab308","534":"#000000","545":"#000000","546":"#eab308","547":"#eab308","548":"#eab308","549":"#000000","550":"#000000","551":"#eab308","552":"#eab308","553":"#eab308","554":"#000000","555":"#000000","556":"#eab308","557":"#eab308","558":"#eab308","559":"#000000","560":"#000000","561":"#eab308","562":"#eab308","563":"#eab308","564":"#000000","574":"#000000","575":"#eab308","576":"#eab308","577":"#ef4444","578":"#ef4444","579":"#eab308","580":"#eab308","581":"#eab308","582":"#eab308","583":"#eab308","584":"#eab308","585":"#eab308","586":"#eab308","587":"#eab308","588":"#eab308","589":"#eab308","590":"#eab308","591":"#ef4444","592":"#ef4444","593":"#eab308","594":"#eab308","595":"#000000","604":"#000000","605":"#eab308","606":"#ef4444","607":"#ef4444","608":"#ef4444","609":"#ef4444","610":"#eab308","611":"#eab308","612":"#000000","613":"#eab308","614":"#000000","615":"#000000","616":"#eab308","617":"#000000","618":"#eab308","619":"#eab308","620":"#ef4444","621":"#ef4444","622":"#ef4444","623":"#ef4444","624":"#eab308","625":"#000000","634":"#000000","635":"#eab308","636":"#ef4444","637":"#ef4444","638":"#ef4444","639":"#ef4444","640":"#eab308","641":"#eab308","642":"#eab308","643":"#000000","644":"#000000","645":"#000000","646":"#000000","647":"#eab308","648":"#eab308","649":"#eab308","650":"#ef4444","651":"#ef4444","652":"#ef4444","653":"#ef4444","654":"#eab308","655":"#000000","665":"#000000","666":"#eab308","667":"#ef4444","668":"#ef4444","669":"#eab308","670":"#eab308","671":"#eab308","672":"#eab308","673":"#000000","674":"#ef4444","675":"#ef4444","676":"#000000","677":"#eab308","678":"#eab308","679":"#eab308","680":"#eab308","681":"#ef4444","682":"#ef4444","683":"#eab308","684":"#000000","696":"#000000","697":"#eab308","698":"#eab308","699":"#eab308","700":"#eab308","701":"#eab308","702":"#eab308","703":"#000000","704":"#ef4444","705":"#ef4444","706":"#000000","707":"#eab308","708":"#eab308","709":"#eab308","710":"#eab308","711":"#eab308","712":"#eab308","713":"#000000","727":"#000000","728":"#000000","729":"#eab308","730":"#eab308","731":"#eab308","732":"#eab308","733":"#eab308","734":"#000000","735":"#000000","736":"#eab308","737":"#eab308","738":"#eab308","739":"#eab308","740":"#eab308","741":"#000000","742":"#000000","759":"#000000","760":"#000000","761":"#000000","762":"#eab308","763":"#eab308","764":"#eab308","765":"#eab308","766":"#eab308","767":"#eab308","768":"#000000","769":"#000000","770":"#000000","792":"#000000","793":"#000000","794":"#000000","795":"#000000","796":"#000000","797":"#000000"} },
	dracaufeu: { size: 31, data: {"73":"#000000","74":"#000000","75":"#000000","79":"#000000","80":"#000000","81":"#000000","102":"#000000","103":"#000000","104":"#f97316","105":"#f97316","106":"#000000","110":"#000000","111":"#f97316","112":"#f97316","113":"#000000","114":"#000000","115":"#000000","131":"#000000","132":"#000000","133":"#f97316","134":"#f97316","135":"#f97316","136":"#000000","142":"#000000","143":"#f97316","144":"#f97316","145":"#f97316","146":"#f97316","147":"#000000","148":"#000000","161":"#000000","162":"#f97316","163":"#f97316","164":"#f97316","165":"#f97316","166":"#000000","173":"#000000","174":"#f97316","175":"#000000","176":"#000000","177":"#000000","178":"#f97316","179":"#f97316","180":"#000000","191":"#000000","192":"#f97316","193":"#f97316","194":"#f97316","195":"#f97316","196":"#f97316","197":"#000000","204":"#000000","205":"#f97316","206":"#000000","207":"#008278","208":"#008278","209":"#000000","210":"#000000","211":"#f97316","212":"#000000","220":"#000000","221":"#000000","222":"#000000","223":"#f97316","224":"#000000","226":"#f97316","227":"#f97316","228":"#f97316","229":"#000000","235":"#000000","236":"#f97316","237":"#000000","238":"#008278","239":"#008278","240":"#008278","241":"#008278","242":"#000000","243":"#f97316","244":"#000000","250":"#000000","251":"#f97316","252":"#f97316","253":"#f97316","254":"#f97316","255":"#000000","257":"#f97316","258":"#f97316","259":"#f97316","260":"#f97316","261":"#000000","266":"#000000","267":"#f97316","268":"#000000","269":"#008278","270":"#008278","271":"#008278","272":"#008278","273":"#008278","274":"#000000","275":"#f97316","276":"#000000","281":"#000000","282":"#f97316","283":"#000000","284":"#f97316","285":"#f97316","286":"#f97316","287":"#f97316","288":"#f97316","289":"#f97316","290":"#f97316","291":"#f97316","292":"#000000","297":"#000000","298":"#f97316","299":"#000000","300":"#008278","301":"#008278","302":"#008278","303":"#008278","304":"#008278","305":"#000000","306":"#f97316","307":"#000000","313":"#000000","314":"#000000","315":"#000000","316":"#000000","317":"#000000","318":"#f97316","319":"#f97316","320":"#000000","321":"#f97316","322":"#f97316","323":"#f97316","324":"#000000","327":"#000000","328":"#f97316","329":"#f97316","330":"#000000","331":"#008278","332":"#008278","333":"#008278","334":"#008278","335":"#008278","336":"#008278","337":"#000000","338":"#f97316","339":"#000000","342":"#ef4444","347":"#000000","348":"#f97316","349":"#f97316","350":"#000000","351":"#000000","352":"#f97316","353":"#f97316","354":"#f97316","355":"#000000","358":"#000000","359":"#f97316","360":"#000000","361":"#008278","362":"#008278","363":"#008278","364":"#008278","365":"#008278","366":"#008278","367":"#008278","368":"#000000","369":"#f97316","370":"#000000","373":"#ef4444","374":"#ef4444","376":"#ef4444","377":"#000000","378":"#f97316","379":"#f97316","380":"#000000","383":"#000000","384":"#f97316","385":"#f97316","386":"#f97316","387":"#000000","388":"#000000","389":"#f97316","390":"#f97316","391":"#000000","392":"#008278","393":"#008278","394":"#008278","395":"#008278","396":"#008278","397":"#008278","398":"#008278","399":"#008278","400":"#000000","401":"#f97316","402":"#000000","403":"#ef4444","404":"#ef4444","405":"#eab308","406":"#ef4444","409":"#000000","410":"#000000","414":"#000000","415":"#f97316","416":"#f97316","417":"#f97316","418":"#000000","419":"#f97316","420":"#f97316","421":"#000000","422":"#008278","423":"#008278","424":"#008278","425":"#008278","426":"#000000","427":"#000000","428":"#000000","429":"#008278","430":"#008278","431":"#000000","432":"#f97316","433":"#000000","435":"#ef4444","436":"#eab308","437":"#eab308","445":"#000000","446":"#f97316","447":"#f97316","448":"#f97316","449":"#f97316","450":"#f97316","451":"#000000","452":"#000000","453":"#008278","454":"#008278","455":"#008278","456":"#000000","460":"#000000","461":"#008278","462":"#000000","463":"#f97316","464":"#000000","467":"#ef4444","472":"#000000","473":"#000000","474":"#000000","475":"#000000","476":"#f97316","477":"#f97316","478":"#f97316","479":"#f97316","480":"#f97316","481":"#f97316","482":"#f97316","483":"#000000","484":"#008278","485":"#000000","486":"#000000","490":"#000000","492":"#000000","493":"#000000","494":"#f97316","495":"#000000","502":"#000000","503":"#f97316","504":"#f97316","505":"#000000","506":"#000000","507":"#f97316","508":"#f97316","509":"#f97316","510":"#f97316","511":"#000000","512":"#f97316","513":"#f97316","514":"#f97316","515":"#000000","520":"#000000","521":"#ef4444","522":"#000000","524":"#000000","525":"#f97316","526":"#000000","533":"#000000","534":"#000000","535":"#f97316","536":"#000000","537":"#f0e6aa","538":"#f0e6aa","539":"#f97316","540":"#000000","541":"#000000","542":"#f97316","543":"#f97316","544":"#000000","545":"#f97316","546":"#000000","551":"#000000","552":"#ef4444","553":"#ef4444","554":"#000000","556":"#000000","565":"#000000","566":"#000000","567":"#000000","568":"#f0e6aa","569":"#f0e6aa","570":"#000000","571":"#f97316","572":"#f97316","573":"#f97316","574":"#f97316","575":"#000000","576":"#f97316","577":"#f97316","578":"#000000","582":"#000000","583":"#ef4444","584":"#eab308","585":"#ef4444","586":"#000000","598":"#000000","599":"#f0e6aa","600":"#f0e6aa","601":"#000000","603":"#f97316","604":"#f97316","605":"#000000","606":"#f97316","607":"#f97316","608":"#f97316","609":"#000000","614":"#000000","615":"#eab308","616":"#ef4444","617":"#000000","628":"#000000","629":"#f97316","630":"#f0e6aa","631":"#f0e6aa","632":"#f0e6aa","633":"#000000","634":"#000000","635":"#000000","636":"#f97316","637":"#f97316","638":"#f97316","639":"#f97316","640":"#f97316","641":"#000000","645":"#f0e6aa","646":"#000000","647":"#f97316","648":"#000000","659":"#000000","660":"#f97316","661":"#f0e6aa","662":"#f0e6aa","663":"#f0e6aa","664":"#f0e6aa","665":"#f0e6aa","666":"#000000","667":"#f97316","668":"#f97316","669":"#f97316","670":"#f97316","671":"#f97316","672":"#000000","673":"#000000","674":"#000000","675":"#000000","676":"#000000","677":"#f97316","678":"#f97316","679":"#000000","690":"#000000","691":"#f97316","692":"#000000","693":"#f0e6aa","694":"#f0e6aa","695":"#f0e6aa","696":"#000000","697":"#f97316","698":"#f97316","699":"#f97316","700":"#f97316","701":"#f97316","702":"#f97316","703":"#000000","704":"#f97316","705":"#f97316","706":"#f97316","707":"#f97316","708":"#f97316","709":"#000000","722":"#000000","723":"#f97316","724":"#000000","725":"#f0e6aa","726":"#f0e6aa","727":"#000000","728":"#f97316","729":"#f97316","730":"#f97316","731":"#f97316","732":"#f97316","733":"#f97316","734":"#000000","735":"#f97316","736":"#f97316","737":"#f97316","738":"#f97316","739":"#f97316","740":"#000000","753":"#000000","754":"#f97316","755":"#f97316","756":"#000000","757":"#000000","758":"#f0e6aa","759":"#000000","760":"#f97316","761":"#f97316","762":"#f97316","763":"#f97316","764":"#000000","765":"#f97316","766":"#f97316","767":"#f97316","768":"#f97316","769":"#000000","770":"#000000","783":"#000000","785":"#f97316","786":"#f97316","787":"#f97316","788":"#000000","789":"#000000","790":"#000000","791":"#000000","792":"#f97316","793":"#f97316","794":"#f97316","795":"#000000","796":"#000000","797":"#000000","798":"#000000","799":"#000000","814":"#000000","815":"#000000","816":"#000000","817":"#000000","818":"#000000","821":"#000000","823":"#f97316","824":"#000000","826":"#000000","853":"#000000","854":"#000000","855":"#000000","856":"#000000","857":"#000000"} },
    papillon: { size: 15, data: {"0":"#22c55e","1":"#22c55e","2":"#22c55e","3":"#22c55e","4":"#22c55e","5":"#22c55e","6":"#22c55e","7":"#22c55e","8":"#22c55e","9":"#22c55e","10":"#22c55e","11":"#22c55e","12":"#22c55e","13":"#22c55e","14":"#22c55e","15":"#22c55e","16":"#22c55e","17":"#22c55e","18":"#3b82f6","19":"#3b82f6","20":"#3b82f6","21":"#22c55e","22":"#22c55e","23":"#22c55e","24":"#3b82f6","25":"#3b82f6","26":"#3b82f6","27":"#22c55e","28":"#22c55e","29":"#22c55e","30":"#22c55e","31":"#22c55e","32":"#3b82f6","33":"#eab308","34":"#eab308","35":"#eab308","36":"#3b82f6","37":"#22c55e","38":"#3b82f6","39":"#eab308","40":"#eab308","41":"#eab308","42":"#3b82f6","43":"#22c55e","44":"#22c55e","45":"#22c55e","46":"#3b82f6","47":"#eab308","48":"#eab308","49":"#eab308","50":"#eab308","51":"#3b82f6","52":"#000000","53":"#3b82f6","54":"#eab308","55":"#eab308","56":"#eab308","57":"#eab308","58":"#3b82f6","59":"#22c55e","60":"#22c55e","61":"#3b82f6","62":"#eab308","63":"#8b5cf6","64":"#8b5cf6","65":"#eab308","66":"#3b82f6","67":"#000000","68":"#3b82f6","69":"#eab308","70":"#8b5cf6","71":"#8b5cf6","72":"#eab308","73":"#3b82f6","74":"#22c55e","75":"#22c55e","76":"#3b82f6","77":"#eab308","78":"#8b5cf6","79":"#ec4899","80":"#8b5cf6","81":"#eab308","82":"#000000","83":"#eab308","84":"#8b5cf6","85":"#ec4899","86":"#8b5cf6","87":"#eab308","88":"#3b82f6","89":"#22c55e","90":"#22c55e","91":"#3b82f6","92":"#eab308","93":"#eab308","94":"#8b5cf6","95":"#8b5cf6","96":"#eab308","97":"#000000","98":"#eab308","99":"#8b5cf6","100":"#8b5cf6","101":"#eab308","102":"#eab308","103":"#3b82f6","104":"#22c55e","105":"#22c55e","106":"#3b82f6","107":"#eab308","108":"#eab308","109":"#eab308","110":"#eab308","111":"#eab308","112":"#000000","113":"#eab308","114":"#eab308","115":"#eab308","116":"#eab308","117":"#eab308","118":"#3b82f6","119":"#22c55e","120":"#22c55e","121":"#22c55e","122":"#3b82f6","123":"#eab308","124":"#eab308","125":"#eab308","126":"#3b82f6","127":"#000000","128":"#3b82f6","129":"#eab308","130":"#eab308","131":"#eab308","132":"#3b82f6","133":"#22c55e","134":"#22c55e","135":"#22c55e","136":"#22c55e","137":"#22c55e","138":"#3b82f6","139":"#3b82f6","140":"#3b82f6","141":"#3b82f6","142":"#000000","143":"#3b82f6","144":"#3b82f6","145":"#3b82f6","146":"#3b82f6","147":"#22c55e","148":"#22c55e","149":"#22c55e","150":"#22c55e","151":"#22c55e","152":"#3b82f6","153":"#ec4899","154":"#ec4899","155":"#ec4899","156":"#3b82f6","157":"#000000","158":"#3b82f6","159":"#ec4899","160":"#ec4899","161":"#ec4899","162":"#3b82f6","163":"#22c55e","164":"#22c55e","165":"#22c55e","166":"#22c55e","167":"#3b82f6","168":"#ec4899","169":"#8b5cf6","170":"#ec4899","171":"#3b82f6","172":"#000000","173":"#3b82f6","174":"#ec4899","175":"#8b5cf6","176":"#ec4899","177":"#3b82f6","178":"#22c55e","179":"#22c55e","180":"#22c55e","181":"#22c55e","182":"#3b82f6","183":"#ec4899","184":"#ec4899","185":"#3b82f6","186":"#3b82f6","187":"#22c55e","188":"#3b82f6","189":"#3b82f6","190":"#ec4899","191":"#ec4899","192":"#3b82f6","193":"#22c55e","194":"#22c55e","195":"#22c55e","196":"#22c55e","197":"#22c55e","198":"#3b82f6","199":"#3b82f6","200":"#3b82f6","201":"#22c55e","202":"#22c55e","203":"#22c55e","204":"#3b82f6","205":"#3b82f6","206":"#3b82f6","207":"#22c55e","208":"#22c55e","209":"#22c55e","210":"#22c55e","211":"#22c55e","212":"#22c55e","213":"#22c55e","214":"#22c55e","215":"#22c55e","216":"#22c55e","217":"#22c55e","218":"#22c55e","219":"#22c55e","220":"#22c55e","221":"#22c55e","222":"#22c55e","223":"#22c55e","224":"#22c55e"} },
	panda: { size: 27, data: {"58":"#000000","59":"#000000","60":"#000000","61":"#000000","71":"#000000","72":"#000000","73":"#000000","84":"#000000","85":"#000000","86":"#000000","87":"#000000","88":"#000000","89":"#000000","90":"#000000","91":"#000000","92":"#000000","93":"#000000","94":"#000000","95":"#000000","96":"#000000","97":"#000000","98":"#000000","99":"#000000","100":"#000000","101":"#000000","111":"#000000","112":"#000000","113":"#000000","114":"#000000","115":"#000000","125":"#000000","126":"#000000","127":"#000000","128":"#000000","129":"#000000","138":"#000000","139":"#000000","140":"#000000","141":"#000000","153":"#000000","154":"#000000","155":"#000000","156":"#000000","165":"#000000","166":"#000000","167":"#000000","181":"#000000","182":"#000000","183":"#000000","193":"#000000","209":"#000000","220":"#000000","224":"#000000","225":"#000000","226":"#000000","232":"#000000","233":"#000000","236":"#000000","247":"#000000","250":"#000000","251":"#000000","252":"#000000","253":"#000000","258":"#000000","259":"#000000","260":"#000000","261":"#000000","263":"#000000","274":"#000000","277":"#000000","278":"#000000","280":"#000000","285":"#000000","287":"#000000","288":"#000000","290":"#000000","301":"#000000","304":"#000000","305":"#000000","306":"#000000","307":"#000000","309":"#000000","310":"#000000","312":"#000000","313":"#000000","314":"#000000","315":"#000000","317":"#000000","328":"#000000","332":"#000000","333":"#000000","337":"#000000","340":"#000000","341":"#000000","343":"#000000","344":"#22c55e","356":"#000000","363":"#000000","364":"#000000","365":"#000000","369":"#000000","370":"#000000","371":"#22c55e","373":"#22c55e","374":"#22c55e","384":"#000000","395":"#000000","396":"#000000","398":"#22c55e","399":"#22c55e","400":"#22c55e","411":"#000000","412":"#000000","413":"#000000","421":"#000000","422":"#22c55e","423":"#22c55e","424":"#22c55e","425":"#22c55e","437":"#000000","438":"#000000","439":"#000000","440":"#000000","441":"#000000","442":"#000000","443":"#000000","444":"#000000","445":"#000000","446":"#000000","447":"#000000","448":"#22c55e","449":"#22c55e","450":"#22c55e","451":"#000000","453":"#22c55e","454":"#22c55e","464":"#000000","465":"#000000","466":"#000000","467":"#000000","468":"#000000","469":"#000000","473":"#000000","474":"#22c55e","475":"#22c55e","476":"#000000","477":"#000000","478":"#000000","479":"#000000","482":"#22c55e","490":"#000000","493":"#000000","494":"#000000","495":"#000000","496":"#000000","497":"#000000","498":"#000000","499":"#000000","500":"#22c55e","501":"#22c55e","502":"#000000","503":"#000000","504":"#000000","505":"#000000","506":"#000000","517":"#000000","521":"#000000","522":"#000000","523":"#000000","524":"#000000","525":"#000000","526":"#000000","527":"#22c55e","530":"#000000","531":"#000000","532":"#000000","543":"#000000","544":"#000000","545":"#000000","546":"#000000","549":"#000000","550":"#000000","551":"#000000","552":"#000000","553":"#000000","558":"#000000","559":"#000000","560":"#000000","561":"#000000","569":"#000000","570":"#000000","571":"#000000","572":"#000000","573":"#000000","574":"#000000","578":"#22c55e","579":"#22c55e","584":"#000000","585":"#000000","586":"#000000","587":"#000000","588":"#000000","589":"#000000","596":"#000000","597":"#000000","598":"#000000","599":"#000000","600":"#000000","601":"#000000","602":"#000000","604":"#22c55e","605":"#22c55e","611":"#000000","612":"#000000","613":"#000000","614":"#000000","615":"#000000","616":"#000000","623":"#000000","624":"#000000","625":"#000000","626":"#000000","627":"#000000","628":"#000000","629":"#000000","637":"#000000","638":"#000000","639":"#000000","640":"#000000","641":"#000000","642":"#000000","643":"#000000","651":"#000000","652":"#000000","653":"#000000","654":"#000000","655":"#000000","656":"#000000","663":"#000000","664":"#000000","665":"#000000","666":"#000000","667":"#000000","668":"#000000","669":"#000000","679":"#000000","680":"#000000","681":"#000000","682":"#000000","683":"#000000","684":"#000000","685":"#000000","686":"#000000","687":"#000000","688":"#000000","689":"#000000","690":"#000000","691":"#000000","692":"#000000","693":"#000000","694":"#000000","695":"#000000"} }
};

// ── Utilitaire : une case est-elle blanche/vide ? ──────────────────────────
function _pxlIsWhite(bg) {
    return bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === '' || !bg;
}

// ── Utilitaire : couleur CSS (rgb(...) ou #hex) → "#rrggbb" ────────────────
function _pxlToHex(color) {
    if (!color) return '#ffffff';
    const rgb = color.match(/\d+/g);
    if (color.indexOf('rgb') === 0 && rgb && rgb.length >= 3) {
        return '#' + rgb.slice(0, 3).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
    }
    return color.toLowerCase();
}

// ── Utilitaire : copie un texte dans le presse-papiers (avec repli) ────────
function _pxlCopyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => _pxlCopyTextFallback(text));
    }
    return Promise.resolve(_pxlCopyTextFallback(text));
}
function _pxlCopyTextFallback(text) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (err) {
        return false;
    }
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
        <p>5. Tirez le coin en bas à droite du widget pour l'agrandir ou le réduire : la grille reste toujours carrée et la palette se trouve à sa droite.</p>
        <p>6. 📋 Code copie le dessin sous forme de code { size, data } (couleurs en hexadécimal), utilisable comme modèle.</p>
        <p>7. 💾 Sauver télécharge le dessin sous forme de fichier .js sur l'ordinateur ; 📂 Charger permet de recharger un fichier .js précédemment sauvegardé.</p>
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
			<option value="burger">🍔 Burger</option>
			<option value="glace">🍧 Glace</option>
			<option value="hellokitty">😻️ Hellokitty</option>
            <option value="mario">🍄 Mario</option>
			<option value="toad">🍄 Toad</option>
			<option value="pikachu">‍🔥 Pikachu</option>
			<option value="dracaufeu">‍🔥 Dracaufeu</option>
            <option value="papillon">🦋 Papillon</option>
			<option value="panda">🐼 Panda</option>
        </select>
        <div class="pixelart-size-ctrl">
            <button class="pixelart-size-dec" title="Réduire la grille">-</button>
            <span class="pixelart-size-val">${PXL_CONFIG.defaultSize}</span>
            <button class="pixelart-size-inc" title="Agrandir la grille">+</button>
        </div>
        <button class="pixelart-btn pixelart-btn-clear">🗑️ Vider</button>
        <button class="pixelart-btn pixelart-btn-pdf">📄 PDF</button>
        <button class="pixelart-btn pixelart-btn-code" title="Copier le dessin sous forme de code { size, data }">📋 Code</button>
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
    const codeBtn       = controls.querySelector('.pixelart-btn-code');
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

    // Ligne principale : grille carrée (gauche) + palette (droite)
    const body = document.createElement('div');
    body.className = 'pixelart-body';
    container.appendChild(body);

    // Zone canvas (grille carrée, taille pilotée par applySide)
    const canvas = document.createElement('div');
    canvas.className = 'pixelart-canvas';
    body.appendChild(canvas);

    // Colonne palette + gomme (à droite de la grille)
    const paletteRow = document.createElement('div');
    paletteRow.className = 'pixelart-palette-row';
    paletteRow.innerHTML = `
        <button class="pixelart-eraser" title="Gommer">🧼</button>
        <div class="pixelart-palette"></div>
    `;
    const eraserBtn = paletteRow.querySelector('.pixelart-eraser');
    const paletteDiv = paletteRow.querySelector('.pixelart-palette');
    body.appendChild(paletteRow);

    // Poignée de redimensionnement du widget entier (coin bas-droit)
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'pixelart-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Taille du widget : un seul paramètre, le côté de la grille carrée ────
    // La largeur du widget et la taille des pastilles de la palette en découlent,
    // ce qui garantit que le quadrillage reste toujours carré.
    const PXL_CHROME_X = 35;  // padding gauche/droite (2×16) + bordure (2×1.5)
    const PXL_BODY_GAP = 12;  // espace entre la grille et la palette
    const PXL_PAL_GAP  = 4;   // espace entre les pastilles
    let canvasSide = PXL_CONFIG.defaultCanvasSide;

    // Taille d'une pastille : la palette (gomme + 10 rangées de 2) a la hauteur de la grille
    function cellFor(side) {
        return Math.max(14, Math.min(64, Math.floor((side - 10 * PXL_PAL_GAP) / 11)));
    }
    function clampSide(side) {
        const maxByScreen = Math.floor(window.innerWidth * 0.92) - PXL_CHROME_X - PXL_BODY_GAP
                            - (2 * cellFor(side) + PXL_PAL_GAP);
        const max = Math.max(PXL_CONFIG.minCanvasSide, Math.min(PXL_CONFIG.maxCanvasSide, maxByScreen));
        return Math.round(Math.max(PXL_CONFIG.minCanvasSide, Math.min(max, side)));
    }
    function applySide(side, skipClamp) {
        side = skipClamp ? Math.round(side) : clampSide(side);
        canvasSide = side;
        const cell = cellFor(side);
        container.style.setProperty('--pxl-cell', cell + 'px');
        container.style.setProperty('--pxl-gap', PXL_PAL_GAP + 'px');
        canvas.style.width  = side + 'px';
        canvas.style.height = side + 'px';
        container.style.width = (side + PXL_BODY_GAP + 2 * cell + PXL_PAL_GAP + PXL_CHROME_X) + 'px';
    }

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

    // ── Empêche le déplacement du widget quand on dessine dans le quadrillage ──
    // Les événements de départ de geste (souris, tactile, stylet) démarrés sur la
    // grille ne remontent pas jusqu'au widget : makeDraggable() ne les voit donc pas.
    // Le déplacement reste possible en dehors du quadrillage (en-tête, bords, palette…).
    ['mousedown', 'touchstart', 'pointerdown'].forEach((evt) => {
        canvas.addEventListener(evt, (e) => {
            e.stopPropagation();
            // On garde le comportement « premier plan » normalement fourni par le widget
            if (evt === 'mousedown') {
                bringToFront(widget);
                widget.focus();
                if (typeof positionActionBar === 'function') positionActionBar(widget);
            }
        }, { passive: false });
    });

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

    // ── Export code : { size: 15, data: {"20":"#ef4444",...} } ────────────────
    // Même format que les modèles de PXL_MODELES (couleurs en hexadécimal),
    // prêt à être collé dans le code : monmodele: { size: 15, data: {...} }
    function buildCodeString() {
        const data = {};
        canvas.querySelectorAll('.pixelart-pixel').forEach((cell, index) => {
            if (!_pxlIsWhite(cell.style.backgroundColor)) data[index] = _pxlToHex(cell.style.backgroundColor);
        });
        return `{ size: ${currentSize}, data: ${JSON.stringify(data)} }`;
    }
    codeBtn.onclick = () => {
        if (isGridEmpty()) { showWarn('La grille est vide, rien à exporter'); return; }
        const code = buildCodeString();
        _pxlCopyText(code).then((ok) => {
            if (ok) showWarn('Code copié ✅', 'success');
            else window.prompt('Copiez le code ci-dessous (Ctrl+C) :', code);
        });
    };

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
        swatch.title = color;
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

    // ── Redimensionnement proportionnel du widget entier ────────────────────
    // La poignée (coin bas-droit) pilote uniquement le côté de la grille : la
    // grille reste carrée, la largeur du widget et la palette suivent.
    function doResize(clientX, clientY, startX, startY, startSide) {
        const delta = ((clientX - startX) + (clientY - startY)) / 2;
        applySide(startSide + delta);
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startSide = canvasSide;
        document.onmousemove = (ev) => doResize(ev.clientX, ev.clientY, startX, startY, startSide);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startSide = canvasSide;
        function onMove(ev) {
            const t = ev.touches[0];
            doResize(t.clientX, t.clientY, startX, startY, startSide);
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

    let _savedSide = null, _isMax = false;

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
                _savedSide = canvasSide;
                container.classList.add('pixelart-fullboard');
                // Plus grand carré possible : limité par la hauteur (en-tête + contrôles ≈ 230 px)
                // et par la largeur (grille + palette + marges)
                const palW = 2 * cellFor(canvasSide) + PXL_PAL_GAP;
                const byH = window.innerHeight - 230;
                const byW = window.innerWidth - 40 - PXL_BODY_GAP - palW - PXL_CHROME_X;
                applySide(Math.max(PXL_CONFIG.minCanvasSide, Math.min(byH, byW)), true);
            } else {
                container.classList.remove('pixelart-fullboard');
                if (_savedSide) applySide(_savedSide);
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
    let initialSide = PXL_CONFIG.defaultCanvasSide;
    if (savedData) {
        if (savedData.canvasSide) initialSide = savedData.canvasSide;
        else if (savedData.containerW) initialSide = savedData.containerW - PXL_CHROME_X; // anciennes sauvegardes
    }
    applySide(initialSide);

    // ── Exposer les données pour la sauvegarde (save-load.js) ───────────────
    widget._pxlGetData = () => {
        const pixels = {};
        canvas.querySelectorAll('.pixelart-pixel').forEach((cell, index) => {
            if (!_pxlIsWhite(cell.style.backgroundColor)) pixels[index] = cell.style.backgroundColor;
        });
        return {
            size: currentSize,
            pixels,
            canvasSide: (_isMax && _savedSide) ? _savedSide : canvasSide,
            containerW: container.offsetWidth,
            canvasH: canvasSide
        };
    };

    saveBoard();
    return widget;
}
