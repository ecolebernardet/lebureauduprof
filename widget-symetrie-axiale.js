// =========================================================================
// WIDGET SYMÉTRIE AXIALE — Le Bureau du Prof
// Dessiner une figure sur quadrillage et afficher son symétrique
// par rapport à un axe vertical, horizontal ou diagonal.
//
// Outils : ligne, cercle, remplissage (polygone), gomme
// Axe : vertical | horizontal | diagonal ↘ | diagonal ↗
// Export PDF A4
// =========================================================================

(function () {

    // Boutons fenêtre macOS (partagés, injectés par d'autres widgets si déjà présents)
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

    if (document.getElementById('sa-style')) return;
    const s = document.createElement('style');
    s.id = 'sa-style';
    s.textContent = `
        /* ── Widget wrapper ── */
        .widget[data-type="symetrie-axiale"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .sa-container {
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
            width: 580px;
        }

        /* ── En-tête ── */
        .sa-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .sa-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex: 1;
        }

        /* ── Sélecteur d'axe ── */
        .sa-axis-bar {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f3f4f6;
            border-radius: 10px;
            padding: 6px 10px;
            flex-wrap: wrap;
        }
        .sa-axis-label {
            font-size: 10px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .sa-axis-btn {
            padding: 4px 10px;
            border-radius: 8px;
            border: 1.5px solid #e5e7eb;
            background: #fff;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background .12s, border-color .12s, transform .1s;
            flex-shrink: 0;
            color: #374151;
        }
        .sa-axis-btn:hover { background: #e5e7eb; }
        .sa-axis-btn:active { transform: scale(0.94); }
        .sa-axis-btn.active {
            background: #7c3aed;
            border-color: #6d28d9;
            color: #fff;
            box-shadow: 0 0 0 2px rgba(124,58,237,0.25);
        }

        /* ── Barre d'outils ── */
        .sa-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            background: #f3f4f6;
            border-radius: 10px;
            padding: 6px 8px;
        }
        .sa-tool-btn {
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
        .sa-tool-btn:hover { background: #e5e7eb; }
        .sa-tool-btn:active { transform: scale(0.93); }
        .sa-tool-btn.active {
            background: #3b82f6;
            border-color: #2563eb;
            color: #fff;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.3);
        }
        .sa-tool-btn.active-gomme {
            background: #f97316;
            border-color: #ea580c;
            color: #fff;
            box-shadow: 0 0 0 2px rgba(249,115,22,0.3);
        }
        .sa-toolbar-sep {
            width: 1px;
            height: 22px;
            background: #d1d5db;
            margin: 0 2px;
            flex-shrink: 0;
        }
        .sa-gridsize-wrap {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-left: auto;
        }
        .sa-gridsize-label {
            font-size: 10px;
            color: #6b7280;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }
        /* Boutons +/− pour stylet */
        .sa-gridsize-stepper {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .sa-gridsize-btn {
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
        .sa-gridsize-btn:hover { background: #e5e7eb; }
        .sa-gridsize-btn:active { transform: scale(0.9); background: #d1d5db; }
        .sa-gridsize-val {
            min-width: 30px;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            user-select: none;
        }
        /* Champ caché conservé pour compatibilité JS */
        .sa-gridsize-input {
            display: none;
        }

        /* ── Zone SVG double ── */
        .sa-svg-zone {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px;
            overflow: hidden;
        }
        .sa-svg {
            background: white;
            display: block;
            border: 1px solid #e5e7eb;
            touch-action: none;
            cursor: crosshair;
            max-width: 100%;
            height: auto;
        }
        .sa-svg.cursor-gomme {
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' style='font-size:24px'><text y='24'>🧽</text></svg>") 16 16, pointer !important;
        }
        .sa-grid-line { stroke: #e5e7eb; stroke-width: 1; }
        .sa-grid-main { stroke: #9ca3af; stroke-width: 2; }
        .sa-axis-line {
            stroke: #dc2626;
            stroke-width: 2.5;
            stroke-dasharray: 8 5;
            pointer-events: none;
        }
        .sa-sym-shape { opacity: 0.6; }
        .sa-sym-label {
            font-size: 11px;
            font-weight: 700;
            fill: #dc2626;
            pointer-events: none;
        }
        .sa-btn-sym {
            background: #7c3aed;
            color: white;
        }
        .sa-btn-sym:hover { background: #6d28d9; }
        .sa-btn-sym.sym-visible {
            background: #059669;
        }
        .sa-btn-sym.sym-visible:hover { background: #047857; }

        /* ── Legend / étiquettes ── */
        .sa-legend {
            display: flex;
            gap: 14px;
            font-size: 11px;
            color: #6b7280;
            align-items: center;
            flex-wrap: wrap;
        }
        .sa-legend-dot {
            width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 4px;
            vertical-align: middle;
        }

        /* ── Actions admin ── */
        .sa-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
        }
        .sa-action-btn {
            padding: 5px 11px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .sa-action-btn:active { transform: scale(0.96); }
        .sa-btn-pdf {
            background: #3b82f6;
            color: white;
        }
        .sa-btn-pdf:hover { background: #2563eb; }
        .sa-btn-save {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .sa-btn-save:hover { background: #e0e0e0; }
        .sa-btn-load {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
            cursor: pointer;
        }
        .sa-btn-load:hover { background: #e0e0e0; }

        /* ── Bouton aide ── */
        .sa-help-btn {
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
        .sa-help-btn:hover { background: #e0e0e0; color: #333; }
        .sa-help-popup {
            display: none;
            position: absolute;
            top: 40px; right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 280px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.6;
        }
        .sa-help-popup.show { display: block; }
        .sa-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .sa-help-section { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .sa-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Fullboard ── */
        .sa-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* ── Resize handles (8 directions) ── */
        .sa-resize-handle {
            position: absolute;
            width: 10px; height: 10px;
            background: #9ca3af;
            border: 1.5px solid #fff;
            border-radius: 2px;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .sa-container:hover .sa-resize-handle { opacity: 1; }
        .sa-rh-n  { top:-5px;  left:50%; transform:translateX(-50%); cursor:n-resize;  }
        .sa-rh-s  { bottom:-5px; left:50%; transform:translateX(-50%); cursor:s-resize; }
        .sa-rh-e  { right:-5px; top:50%; transform:translateY(-50%); cursor:e-resize;  }
        .sa-rh-w  { left:-5px;  top:50%; transform:translateY(-50%); cursor:w-resize;  }
        .sa-rh-ne { top:-5px;   right:-5px; cursor:ne-resize; }
        .sa-rh-nw { top:-5px;   left:-5px;  cursor:nw-resize; }
        .sa-rh-se { bottom:-5px; right:-5px; cursor:se-resize; }
        .sa-rh-sw { bottom:-5px; left:-5px;  cursor:sw-resize; }

        /* ── Sélecteur couleur dans toolbar (swatch cpick) ── */
        .sa-color-wrap {
            display: flex; align-items: center; gap: 5px;
            flex-shrink: 0; position: relative;
        }
        .sa-color-label {
            font-size: 10px; font-weight: 700; color: #6b7280;
            text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
        }
        .sa-color-swatch-wrap {
            display: inline-flex; align-items: center; justify-content: center;
        }
        .sa-color-swatch-wrap .cpick-swatch {
            width: 26px; height: 26px;
            border-radius: 6px; border: 1.5px solid #d1d5db;
            cursor: pointer; display: block;
            transition: border-color .15s, transform .1s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .sa-color-swatch-wrap .cpick-swatch:hover {
            border-color: #9ca3af; transform: scale(1.08);
        }
    `;
    document.head.appendChild(s);
})();

// ── Constante interne SVG ─────────────────────────────────────────────────
const SA_SIZE = 600; // viewBox unique (double grille dans un seul SVG)

// ── Calcul du symétrique d'un point ──────────────────────────────────────
function saReflectPoint(x, y, axisType, size) {
    const mid = size / 2;
    switch (axisType) {
        case 'vertical':    return { x: size - x, y };
        case 'horizontal':  return { x, y: size - y };
        case 'diag-down':   return { x: y, y: x };          // y=x  (↘)
        case 'diag-up':     return { x: size - y, y: size - x }; // y=-x+size (↗)
        default:            return { x, y };
    }
}

// ── Calcul du symétrique d'un groupe SVG ─────────────────────────────────
function saReflectGroup(group, axisType, size) {
    const sym = group.cloneNode(true);
    sym.classList.add('sa-sym-shape');
    sym.classList.remove('rq-line-group'); // sécurité

    // Supprimer les zones gomme transparentes du symétrique (inutiles + perturbantes)
    sym.querySelectorAll('.rq-eraser-zone, .sa-eraser-zone').forEach(z => z.remove());

    // Transformer chaque élément SVG
    sym.querySelectorAll('line, circle, path, polygon').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'line') {
            const x1 = parseFloat(el.getAttribute('x1'));
            const y1 = parseFloat(el.getAttribute('y1'));
            const x2 = parseFloat(el.getAttribute('x2'));
            const y2 = parseFloat(el.getAttribute('y2'));
            const p1 = saReflectPoint(x1, y1, axisType, size);
            const p2 = saReflectPoint(x2, y2, axisType, size);
            el.setAttribute('x1', p1.x); el.setAttribute('y1', p1.y);
            el.setAttribute('x2', p2.x); el.setAttribute('y2', p2.y);
        } else if (tag === 'circle') {
            const cx = parseFloat(el.getAttribute('cx'));
            const cy = parseFloat(el.getAttribute('cy'));
            const p  = saReflectPoint(cx, cy, axisType, size);
            el.setAttribute('cx', p.x); el.setAttribute('cy', p.y);
        } else if (tag === 'path') {
            const d = el.getAttribute('d') || '';
            // Parse commandes M/L/Z
            const newD = d.replace(/([ML])\s*([\d.]+)\s*,?\s*([\d.]+)/g, (_, cmd, px, py) => {
                const p = saReflectPoint(parseFloat(px), parseFloat(py), axisType, size);
                return `${cmd} ${p.x} ${p.y}`;
            });
            el.setAttribute('d', newD);
        }
        // Couleur distincte pour le symétrique (violet semi-transparent)
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke !== 'transparent' && stroke !== 'none') {
            el.setAttribute('stroke', '#7c3aed');
        }
        const fill = el.getAttribute('fill');
        if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('rgba(0,0,0')) {
            el.setAttribute('fill', 'rgba(124,58,237,0.18)');
        } else if (fill && fill.startsWith('rgba(0,0,0')) {
            el.setAttribute('fill', 'rgba(124,58,237,0.18)');
        }
    });
    return sym;
}

// ── Création du widget ────────────────────────────────────────────────────
function createSymetrieAxialeWidget(savedData) {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'symetrie-axiale';
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
    container.className = 'sa-container';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'sa-header';
    header.innerHTML = `
        <span class="sa-title">🪞 Symétrie axiale</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const helpBtn = document.createElement('button');
    helpBtn.className = 'sa-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    header.querySelector('.wf-btns').insertBefore(helpBtn, header.querySelector('.wf-btn-min'));
    container.appendChild(header);

    // ── Popup aide ────────────────────────────────────────────────────────
    const helpPopup = document.createElement('div');
    helpPopup.className = 'sa-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Mode d'emploi</h4>
        <div class="sa-help-section">
            <strong>🪞 Axe de symétrie</strong><br>
            Choisissez l'axe (vertical, horizontal, diagonal ↘ ou ↗) avant de dessiner. L'axe apparaît en rouge.
        </div>
        <div class="sa-help-section">
            <strong>📏 Ligne / ⭕ Cercle / 🎨 Polygone</strong><br>
            Dessinez votre figure sur la grille. Le symétrique ne s'affiche pas pendant le dessin.
        </div>
        <div class="sa-help-section">
            <strong>🧽 Gomme</strong><br>
            Cliquez sur un tracé pour l'effacer.
        </div>
        <div class="sa-help-section">
            <strong>🪞 Afficher le symétrique</strong><br>
            Cliquez ce bouton quand la figure est terminée pour révéler son symétrique en violet. Cliquez à nouveau pour le masquer.
        </div>
        <div class="sa-help-section">
            <strong>📄 PDF</strong><br>
            Génère une fiche A4 : modèle complet en haut, figure seule + grille vierge en bas.
        </div>
    `;
    container.appendChild(helpPopup);

    // ── Sélecteur d'axe ───────────────────────────────────────────────────
    const axisBar = document.createElement('div');
    axisBar.className = 'sa-axis-bar';
    axisBar.innerHTML = `
        <span class="sa-axis-label">Axe :</span>
        <button class="sa-axis-btn active" data-axis="vertical">   | Vertical</button>
        <button class="sa-axis-btn"        data-axis="horizontal">― Horizontal</button>
        <button class="sa-axis-btn"        data-axis="diag-down">  ↘ Diagonale ↘</button>
        <button class="sa-axis-btn"        data-axis="diag-up">    ↗ Diagonale ↗</button>
    `;
    container.appendChild(axisBar);

    // ── Barre d'outils ────────────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.className = 'sa-toolbar';
    toolbar.innerHTML = `
        <button class="sa-tool-btn active" data-tool="line"   title="Tracer une ligne">📏</button>
        <button class="sa-tool-btn"        data-tool="circle" title="Tracer un cercle">⭕</button>
        <button class="sa-tool-btn"        data-tool="fill"   title="Remplir un polygone">🎨</button>
        <div class="sa-toolbar-sep"></div>
        <button class="sa-tool-btn" id="sa-undo-btn" title="Annuler">↩</button>
        <button class="sa-tool-btn" id="sa-redo-btn" title="Refaire">↪</button>
        <button class="sa-tool-btn" id="sa-gomme-btn" data-tool="gomme" title="Gomme">🧽</button>
        <button class="sa-tool-btn" id="sa-clear-btn" title="Vider">🗑️</button>
        <div class="sa-toolbar-sep"></div>
        <div class="sa-color-wrap">
            <span class="sa-color-label">Couleur :</span>
            <div class="sa-color-swatch-wrap cpick-wrap" id="cpick-sa-COLOR_ID">
                <div class="cpick-swatch" style="background:#000000;" onclick="cpickOpen('sa-COLOR_ID', this); event.stopPropagation();"></div>
                <div class="cpick-popup" id="cpick-pop-sa-COLOR_ID"></div>
            </div>
        </div>
        <div class="sa-toolbar-sep"></div>
        <div class="sa-gridsize-wrap">
            <span class="sa-gridsize-label">Carreaux :</span>
            <div class="sa-gridsize-stepper">
                <button class="sa-gridsize-btn" data-step="-2" title="Moins de carreaux">−</button>
                <span class="sa-gridsize-val">10</span>
                <button class="sa-gridsize-btn" data-step="2" title="Plus de carreaux">+</button>
            </div>
            <input type="number" class="sa-gridsize-input" value="10" min="6" max="20" step="2" title="Nombre de carreaux">
        </div>
    `;
    container.appendChild(toolbar);

    // ── Zone SVG (grille unique, axe au centre ou diagonal) ───────────────
    const svgZone = document.createElement('div');
    svgZone.className = 'sa-svg-zone';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('sa-svg');
    svg.setAttribute('viewBox', `0 0 ${SA_SIZE} ${SA_SIZE}`);
    svg.style.width  = '500px';
    svg.style.height = '500px';
    svgZone.appendChild(svg);
    container.appendChild(svgZone);

    // ── Légende ───────────────────────────────────────────────────────────
    const legend = document.createElement('div');
    legend.className = 'sa-legend';
    legend.innerHTML = `
        <span><span class="sa-legend-dot" style="background:#222"></span>Figure originale</span>
        <span><span class="sa-legend-dot" style="background:#7c3aed"></span>Symétrique</span>
        <span><span class="sa-legend-dot" style="background:#dc2626;border-radius:0;height:3px;width:18px;margin-right:4px"></span>Axe de symétrie</span>
    `;
    container.appendChild(legend);

    // ── Actions admin ─────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'sa-actions';
    actions.innerHTML = `
        <button class="sa-action-btn sa-btn-sym" id="sa-sym-btn" title="Afficher le symétrique">🪞 Afficher le symétrique</button>
        <button class="sa-action-btn sa-btn-save" title="Sauvegarder">💾 Sauvegarder</button>
        <label class="sa-action-btn sa-btn-load" title="Charger">
            📂 Charger
            <input type="file" accept=".json,.txt" style="display:none">
        </label>
        <button class="sa-action-btn sa-btn-pdf" title="Exporter PDF A4">📄 PDF A4</button>
    `;
    container.appendChild(actions);

    // ── Resize handles (8 directions) ────────────────────────────────────
    ['n','s','e','w','ne','nw','se','sw'].forEach(dir => {
        const h = document.createElement('div');
        h.className = `sa-resize-handle sa-rh-${dir}`;
        h.dataset.dir = dir;
        container.appendChild(h);
    });

    widget.appendChild(container);

    // ── ID unique pour le color-picker de cette instance ──────────────────
    const saPickerId = 'symax-' + Math.random().toString(36).slice(2, 8);
    // Remplacer le placeholder COLOR_ID dans le HTML déjà injecté
    toolbar.innerHTML = toolbar.innerHTML.replaceAll('COLOR_ID', saPickerId);

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAT INTERNE
    // ══════════════════════════════════════════════════════════════════════
    let currentTool   = 'line';
    let isGommeActive = false;
    let lastPoint     = null;
    let fillPoints    = [];
    let undoStack     = [];
    let redoStack     = [];
    let helpLayer     = {};
    let currentAxis   = 'vertical';
    let symVisible    = false;
    let currentColor  = '#000000';
    const gridSizeInput = toolbar.querySelector('.sa-gridsize-input');

    // ── Brancher le color-picker sur currentColor ─────────────────────────
    // On surcharge cpickDispatch pour intercepter notre id unique
    const _origCpickDispatch = window.cpickDispatch;
    const _saPickerFullId = 'sa-' + saPickerId;
    // Enregistrer un hook : quand cpickSet appelle cpickDispatch avec notre id, on met à jour currentColor
    const _origCpickSet = window.cpickSet;
    // Patch léger : on écoute via un MutationObserver sur le swatch
    const saSwatchEl = toolbar.querySelector(`#cpick-${_saPickerFullId} .cpick-swatch`);
    if (saSwatchEl) {
        new MutationObserver(() => {
            const bg = saSwatchEl.style.background;
            if (bg && bg !== currentColor) {
                currentColor = bg.startsWith('#') ? bg : hexFromStyle(bg);
                autoSave();
            }
        }).observe(saSwatchEl, { attributes: true, attributeFilter: ['style'] });
    }

    // Helper : convertit rgb(...) → #rrggbb si besoin
    function hexFromStyle(str) {
        const m = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!m) return str;
        return '#' + [m[1],m[2],m[3]].map(v => parseInt(v).toString(16).padStart(2,'0')).join('');
    }

    // ── Conversion hex → rgba ─────────────────────────────────────────────
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
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
        const cell = SA_SIZE / size;
        svg.dataset.computedCell = cell;
        svg.querySelectorAll('.sa-grid-el, #sa-help-layer, #sa-axis-layer').forEach(el => el.remove());

        // Lignes de grille
        const frag = document.createDocumentFragment();
        for (let i = 0; i <= size; i++) {
            const pos = i * cell;
            const cls = (i === 0 || i === size) ? 'sa-grid-main' : 'sa-grid-line';
            frag.appendChild(createSVGEl('line', { x1: 0, y1: pos, x2: SA_SIZE, y2: pos, class: cls + ' sa-grid-el' }));
            frag.appendChild(createSVGEl('line', { x1: pos, y1: 0, x2: pos, y2: SA_SIZE, class: cls + ' sa-grid-el' }));
        }
        svg.insertBefore(frag, svg.firstChild);

        // Couche axe
        const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        axisGroup.id = 'sa-axis-layer';
        svg.appendChild(axisGroup);
        drawAxisLine(axisGroup);

        // Couche d'aide visuelle
        const helpGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        helpGroup.id = 'sa-help-layer';
        helpLayer = {
            ghostLine:   createSVGEl('line',   { stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            ghostCircle: createSVGEl('circle', { fill: 'none', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            ghostPath:   createSVGEl('path',   { fill: 'rgba(0,0,0,0.1)', stroke: 'rgba(0,0,0,0.3)', 'stroke-width': '2', 'stroke-dasharray': '4', visibility: 'hidden' }),
            hoverDot:    createSVGEl('circle', { r: '6', fill: 'rgba(0,0,0,0.2)' }),
            anchorDot:   createSVGEl('circle', { r: '6', fill: 'black', visibility: 'hidden' })
        };
        Object.values(helpLayer).forEach(el => helpGroup.appendChild(el));
        svg.appendChild(helpGroup);

        // Redessiner les symétriques si déjà visibles
        if (symVisible) refreshSymmetry();
    }

    // ── Tracer l'axe de symétrie ──────────────────────────────────────────
    function drawAxisLine(group) {
        group.innerHTML = '';
        const mid = SA_SIZE / 2;
        let line, label, lx, ly;
        switch (currentAxis) {
            case 'vertical':
                line = createSVGEl('line', { x1: mid, y1: 0, x2: mid, y2: SA_SIZE, class: 'sa-axis-line' });
                lx = mid + 6; ly = 18;
                break;
            case 'horizontal':
                line = createSVGEl('line', { x1: 0, y1: mid, x2: SA_SIZE, y2: mid, class: 'sa-axis-line' });
                lx = 6; ly = mid - 6;
                break;
            case 'diag-down':
                line = createSVGEl('line', { x1: 0, y1: 0, x2: SA_SIZE, y2: SA_SIZE, class: 'sa-axis-line' });
                lx = 8; ly = 22;
                break;
            case 'diag-up':
                line = createSVGEl('line', { x1: SA_SIZE, y1: 0, x2: 0, y2: SA_SIZE, class: 'sa-axis-line' });
                lx = SA_SIZE - 60; ly = 22;
                break;
        }
        label = createSVGEl('text', { x: lx, y: ly, class: 'sa-sym-label' });

        group.appendChild(line);
        group.appendChild(label);
    }

    // ── Afficher/masquer le symétrique ────────────────────────────────────
    function toggleSymmetry() {
        symVisible = !symVisible;
        if (symVisible) {
            refreshSymmetry();
        } else {
            svg.querySelectorAll('.sa-sym-shape').forEach(el => el.remove());
        }
        updateSymButton();
        autoSave();
    }

    function updateSymButton() {
        const btn = actions.querySelector('#sa-sym-btn');
        if (!btn) return;
        if (symVisible) {
            btn.textContent = '🙈 Masquer le symétrique';
            btn.classList.add('sym-visible');
        } else {
            btn.textContent = '🪞 Afficher le symétrique';
            btn.classList.remove('sym-visible');
        }
    }

    // ── Rafraîchir tous les symétriques ──────────────────────────────────
    function refreshSymmetry() {
        // Supprimer anciens symétriques
        svg.querySelectorAll('.sa-sym-shape').forEach(el => el.remove());

        const helpLayerEl = svg.querySelector('#sa-help-layer');
        const axisLayerEl = svg.querySelector('#sa-axis-layer');

        svg.querySelectorAll('.sa-line-group').forEach(group => {
            const sym = saReflectGroup(group, currentAxis, SA_SIZE);
            // Insérer avant l'axe
            if (axisLayerEl) svg.insertBefore(sym, axisLayerEl);
            else if (helpLayerEl) svg.insertBefore(sym, helpLayerEl);
            else svg.appendChild(sym);
        });
    }

    // ── Coordonnées snappées à la grille ─────────────────────────────────
    function getCoords(e) {
        const cell = parseFloat(svg.dataset.computedCell);
        const rect  = svg.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
        return {
            x: Math.round((((clientX - rect.left) / rect.width)  * SA_SIZE) / cell) * cell,
            y: Math.round((((clientY - rect.top)  / rect.height) * SA_SIZE) / cell) * cell
        };
    }

    // ── Reset aide visuelle ───────────────────────────────────────────────
    function resetAide() {
        if (helpLayer.anchorDot)   helpLayer.anchorDot.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostLine)   helpLayer.ghostLine.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostCircle) helpLayer.ghostCircle.setAttribute('visibility', 'hidden');
        if (helpLayer.ghostPath)   helpLayer.ghostPath.setAttribute('visibility', 'hidden');
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
        if (isGommeActive) svg.classList.add('cursor-gomme');
        else { svg.classList.remove('cursor-gomme'); svg.style.cursor = 'crosshair'; }
        updateToolButtons();
    }

    function updateToolButtons() {
        toolbar.querySelectorAll('.sa-tool-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active', 'active-gomme');
            if (btn.dataset.tool === 'gomme') {
                if (isGommeActive) btn.classList.add('active-gomme');
            } else if (btn.dataset.tool === currentTool && !isGommeActive) {
                btn.classList.add('active');
            }
        });
    }

    // ── Pointer down ──────────────────────────────────────────────────────
    function handlePointerDown(e) {
        if (isGommeActive) {
            const group = e.target.closest('.sa-line-group');
            if (group) {
                undoStack.push({ type: 'erase', element: group });
                svg.removeChild(group);
                redoStack = [];
                if (symVisible) refreshSymmetry();
                autoSave();
            }
            return;
        }

        const c = getCoords(e);
        const helpLayerEl = svg.querySelector('#sa-help-layer');
        const axisLayerEl = svg.querySelector('#sa-axis-layer');

        if (currentTool === 'fill') {
            if (fillPoints.length > 0 && c.x === fillPoints[0].x && c.y === fillPoints[0].y) {
                if (fillPoints.length >= 3) {
                    const d = fillPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                    const group = createSVGEl('g', { class: 'sa-line-group' });
                    group.appendChild(createSVGEl('path', { d, fill: 'transparent', class: 'sa-eraser-zone', style: 'pointer-events:all;' }));
                    group.appendChild(createSVGEl('path', { d, fill: hexToRgba(currentColor, 0.15), stroke: currentColor, 'stroke-width': '4', 'stroke-linejoin': 'round', style: 'pointer-events:all;' }));
                    svg.insertBefore(group, axisLayerEl || helpLayerEl);
                    undoStack.push({ type: 'draw', element: group });
                    fillPoints = [];
                    helpLayer.ghostPath.setAttribute('visibility', 'hidden');
                    helpLayer.anchorDot.setAttribute('visibility', 'hidden');
                    if (symVisible) refreshSymmetry();
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
            const group = createSVGEl('g', { class: 'sa-line-group' });
            if (currentTool === 'line') {
                group.appendChild(createSVGEl('line', { x1: lastPoint.x, y1: lastPoint.y, x2: c.x, y2: c.y, stroke: 'transparent', 'stroke-width': '30', class: 'sa-eraser-zone' }));
                group.appendChild(createSVGEl('line', { x1: lastPoint.x, y1: lastPoint.y, x2: c.x, y2: c.y, stroke: currentColor, 'stroke-width': '4', 'stroke-linecap': 'round' }));
            } else if (currentTool === 'circle') {
                const r = Math.sqrt(Math.pow(c.x - lastPoint.x, 2) + Math.pow(c.y - lastPoint.y, 2));
                group.appendChild(createSVGEl('circle', { cx: lastPoint.x, cy: lastPoint.y, r, stroke: 'transparent', 'stroke-width': '20', fill: 'none', class: 'sa-eraser-zone' }));
                group.appendChild(createSVGEl('circle', { cx: lastPoint.x, cy: lastPoint.y, r, stroke: currentColor, 'stroke-width': '4', fill: 'none' }));
            }
            svg.insertBefore(group, axisLayerEl || helpLayerEl);
            undoStack.push({ type: 'draw', element: group });
            lastPoint = null;
            helpLayer.anchorDot.setAttribute('visibility', 'hidden');
            helpLayer.ghostLine.setAttribute('visibility', 'hidden');
            helpLayer.ghostCircle.setAttribute('visibility', 'hidden');
            if (symVisible) refreshSymmetry();
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
        else svg.insertBefore(a.element, svg.querySelector('#sa-axis-layer') || svg.querySelector('#sa-help-layer'));
        if (symVisible) refreshSymmetry();
        autoSave();
    }
    function redo() {
        if (!redoStack.length) return;
        const a = redoStack.pop();
        undoStack.push(a);
        if (a.type === 'draw') svg.insertBefore(a.element, svg.querySelector('#sa-axis-layer') || svg.querySelector('#sa-help-layer'));
        else svg.removeChild(a.element);
        if (symVisible) refreshSymmetry();
        autoSave();
    }

    // ── Vider ─────────────────────────────────────────────────────────────
    function clearGrid() {
        if (!confirm('Effacer toute la figure ?')) return;
        svg.querySelectorAll('.sa-line-group').forEach(g => svg.removeChild(g));
        undoStack = []; redoStack = [];
        lastPoint = null; fillPoints = [];
        resetAide();
        svg.querySelectorAll('.sa-sym-shape').forEach(el => el.remove());
        autoSave();
    }

    // ── Sauvegarde auto ───────────────────────────────────────────────────
    function autoSave() {
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── getData / setData pour save-load.js ───────────────────────────────
    function getData() {
        const swatchEl = toolbar.querySelector('.cpick-swatch');
        const savedColor = swatchEl ? (hexFromStyle(swatchEl.style.background) || currentColor) : currentColor;
        return {
            gridSize:     parseInt(gridSizeInput.value) || 10,
            svgW:         parseInt(svg.style.width)  || 500,
            svgH:         parseInt(svg.style.height) || 500,
            axis:         currentAxis,
            symVisible:   symVisible,
            currentColor: savedColor,
            shapes:       Array.from(svg.querySelectorAll('.sa-line-group')).map(g => g.outerHTML)
        };
    }

    function setData(data) {
        if (!data) return;
        if (data.gridSize) {
            gridSizeInput.value = data.gridSize;
            if (gridSizeVal) gridSizeVal.textContent = data.gridSize;
        }
        if (data.svgW) svg.style.width  = data.svgW + 'px';
        if (data.svgH) svg.style.height = data.svgH + 'px';
        else if (data.svgW) svg.style.height = data.svgW + 'px';
        if (data.axis) {
            currentAxis = data.axis;
            axisBar.querySelectorAll('.sa-axis-btn').forEach(b => b.classList.toggle('active', b.dataset.axis === currentAxis));
        }
        if (data.currentColor) {
            currentColor = data.currentColor;
            // Mettre à jour le swatch et l'état cpick
            const swatchEl = toolbar.querySelector('.cpick-swatch');
            if (swatchEl) swatchEl.style.background = currentColor;
            if (typeof cpickInit === 'function') cpickInit(_saPickerFullId, currentColor);
            if (typeof _cpickValues !== 'undefined') _cpickValues[_saPickerFullId] = currentColor;
        }
        symVisible = data.symVisible || false;
        initGrid(gridSizeInput.value);
        if (data.shapes && data.shapes.length) {
            const axisLayerEl = svg.querySelector('#sa-axis-layer');
            data.shapes.forEach(html => {
                if (axisLayerEl) axisLayerEl.insertAdjacentHTML('beforebegin', html);
                else svg.insertAdjacentHTML('beforeend', html);
            });
        }
        undoStack = []; redoStack = [];
        if (symVisible) refreshSymmetry();
        updateSymButton();
    }

    // ── Export JSON ───────────────────────────────────────────────────────
    function exportFile() {
        const data = getData();
        const date = new Date();
        const ds   = date.getFullYear() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0');
        const name = `lebureauduprof_symetrie_axiale_${ds}.json`;
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
                svg.querySelectorAll('.sa-line-group').forEach(g => svg.removeChild(g));
                setData(data);
                autoSave();
            } catch(err) { alert('Erreur : fichier invalide.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ── Export PDF A4 — 3 lignes × 2 colonnes = 6 grilles ────────────────
    async function exportPDF() {
        if (!window.jspdf) {
            await new Promise((res, rej) => {
                const sc = document.createElement('script');
                sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                sc.onload = res; sc.onerror = rej;
                document.head.appendChild(sc);
            });
        }
        const { jsPDF } = window.jspdf;

        // Masquer les aides visuelles pendant la capture
        if (helpLayer.hoverDot)  helpLayer.hoverDot.setAttribute('visibility', 'hidden');
        if (helpLayer.anchorDot) helpLayer.anchorDot.setAttribute('visibility', 'hidden');

        // ── Capture : figure + axe (sans symétrique, sans couche d'aide) ──
        const dataModel = await new Promise(resolve => {
            const clone = svg.cloneNode(true);
            // Couleurs grille imprimables
            clone.querySelectorAll('.sa-grid-line').forEach(l => l.setAttribute('stroke', '#b0b8c4'));
            clone.querySelectorAll('.sa-grid-main').forEach(l => l.setAttribute('stroke', '#6b7280'));
            // Supprimer uniquement : aide visuelle et symétrique calculé — l'axe est conservé
            clone.querySelectorAll('#sa-help-layer, .sa-sym-shape').forEach(el => el.remove());
            // Inliner les styles de l'axe (les classes CSS ne sont pas lues lors du rendu canvas)
            clone.querySelectorAll('.sa-axis-line').forEach(l => {
                l.setAttribute('stroke', '#dc2626');
                l.setAttribute('stroke-width', '4');
                l.setAttribute('stroke-dasharray', '12 6');
                l.removeAttribute('class');
            });
            clone.querySelectorAll('.sa-sym-label').forEach(t => {
                t.setAttribute('fill', '#dc2626');
                t.setAttribute('font-size', '18');
                t.setAttribute('font-weight', 'bold');
                t.setAttribute('font-family', 'sans-serif');
                t.removeAttribute('class');
            });
            // Forcer viewBox carré pour l'export
            clone.setAttribute('viewBox', `0 0 ${SA_SIZE} ${SA_SIZE}`);
            clone.style.width = ''; clone.style.height = '';
            const xml = new XMLSerializer().serializeToString(clone);
            const img = new Image();
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

        if (helpLayer.hoverDot) helpLayer.hoverDot.setAttribute('visibility', 'visible');

        // ── Mise en page PDF ───────────────────────────────────────────────
        const pdf = new jsPDF('p', 'mm', 'a4');
        const A4W = 210, A4H = 297;

        const marginL = 12;  // marge gauche et droite
        const marginT = 10;  // marge haut
        const marginB = 8;   // marge bas
        const gap     = 5;   // espace entre les 2 colonnes
        const rowGap  = 4;   // espace vertical entre les 3 lignes
        const titleH  = 11;  // espace titre + sous-titre

        // Largeur de chaque grille
        const cellW = (A4W - marginL * 2 - gap) / 2;

        // Hauteur disponible pour les 3 grilles :
        // page - marge haute - titre - marge basse - 2 inter-lignes
        const totalH = A4H - marginT - titleH - marginB - rowGap * 2;
        const cellH  = Math.min(cellW, totalH / 3); // carré, ne dépasse pas

        const axisNames = { vertical: 'verticale', horizontal: 'horizontale', 'diag-down': 'diagonale ↘', 'diag-up': 'diagonale ↗' };

        // Titre
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor(30);
        pdf.text('Symétrie axiale', A4W / 2, marginT + 5, { align: 'center' });
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(110);
        

        // ── 3 lignes, 2 grilles identiques (figure + axe) par ligne ───────
        let curY = marginT + titleH;
        for (let i = 0; i < 3; i++) {
            pdf.addImage(dataModel, 'PNG', marginL,             curY, cellH, cellH);
            pdf.addImage(dataModel, 'PNG', marginL + cellH + gap, curY, cellH, cellH);
            curY += cellH + rowGap;
        }

        // Pied de page
        pdf.setFontSize(7); pdf.setTextColor(190); pdf.setFont('helvetica', 'normal');
        pdf.text('lebureauduprof', A4W / 2, A4H - 3, { align: 'center' });

        const date = new Date();
        const ds   = date.getFullYear() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0');
        const name = `lebureauduprof_symetrie_axiale_${ds}.pdf`;
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
    toolbar.querySelectorAll('.sa-tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.dataset.tool === 'gomme') toggleGomme();
            else setTool(btn.dataset.tool);
        });
    });
    toolbar.querySelector('#sa-undo-btn').addEventListener('click', (e) => { e.stopPropagation(); undo(); });
    toolbar.querySelector('#sa-redo-btn').addEventListener('click', (e) => { e.stopPropagation(); redo(); });
    toolbar.querySelector('#sa-clear-btn').addEventListener('click', (e) => { e.stopPropagation(); clearGrid(); });

    // Axe
    axisBar.querySelectorAll('.sa-axis-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentAxis = btn.dataset.axis;
            axisBar.querySelectorAll('.sa-axis-btn').forEach(b => b.classList.toggle('active', b === btn));
            // Mettre à jour l'axe dessiné
            const axisLayerEl = svg.querySelector('#sa-axis-layer');
            if (axisLayerEl) drawAxisLine(axisLayerEl);
            if (symVisible) refreshSymmetry();
            autoSave();
        });
    });

    // Taille grille
    const gridSizeVal = toolbar.querySelector('.sa-gridsize-val');
    function applyGridSize() {
        if (gridSizeVal) gridSizeVal.textContent = gridSizeInput.value;
        svg.querySelectorAll('.sa-grid-el, #sa-help-layer, #sa-axis-layer, .sa-sym-shape').forEach(g => g.remove());
        undoStack = []; redoStack = [];
        lastPoint = null; fillPoints = [];
        initGrid(gridSizeInput.value);
        updateSymButton();
        autoSave();
    }
    gridSizeInput.addEventListener('change', applyGridSize);
    gridSizeInput.addEventListener('mousedown',   e => e.stopPropagation());
    gridSizeInput.addEventListener('click',       e => e.stopPropagation());
    // Compatibilité stylet / vidéoprojecteur interactif
    gridSizeInput.addEventListener('pointerdown', e => e.stopPropagation());
    gridSizeInput.addEventListener('touchstart',  e => e.stopPropagation(), { passive: true });
    // Sur certains stylets, 'change' ne se déclenche pas si le focus reste dans le champ ;
    // on écoute aussi 'input' avec un debounce pour appliquer dès que la valeur change.
    let _gridSizeDebounce = null;
    gridSizeInput.addEventListener('input', () => {
        clearTimeout(_gridSizeDebounce);
        _gridSizeDebounce = setTimeout(applyGridSize, 600);
    });
    // Boutons +/− (stylet-friendly)
    toolbar.querySelectorAll('.sa-gridsize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            if (btn._saStepDone) { btn._saStepDone = false; return; }
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 6;
            const max  = parseInt(gridSizeInput.max) || 20;
            const cur  = parseInt(gridSizeInput.value) || 10;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) { gridSizeInput.value = next; applyGridSize(); }
        });
        btn.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 6;
            const max  = parseInt(gridSizeInput.max) || 20;
            const cur  = parseInt(gridSizeInput.value) || 10;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) { gridSizeInput.value = next; applyGridSize(); btn._saStepDone = true; }
        });
        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('mousedown',   e => e.stopPropagation());
    });

    // SVG interactions
    svg.addEventListener('pointerdown', (e) => { e.preventDefault(); handlePointerDown(e); });
    svg.addEventListener('pointermove', (e) => { handlePointerMove(e); });

    // Actions
    actions.querySelector('#sa-sym-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleSymmetry(); });
    actions.querySelector('.sa-btn-save').addEventListener('click', (e) => { e.stopPropagation(); exportFile(); });
    actions.querySelector('.sa-btn-pdf').addEventListener('click',  (e) => { e.stopPropagation(); exportPDF(); });
    actions.querySelector('input[type="file"]').addEventListener('change', importFile);

    // Aide
    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Resize (8 directions) ─────────────────────────────────────────────────
    container.querySelectorAll('.sa-resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const dir    = handle.dataset.dir;
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth;
            const startH = container.offsetHeight;
            const startLeft = container.offsetLeft || widget.offsetLeft;
            const startTop  = container.offsetTop  || widget.offsetTop;
            // SVG dimensions
            const startSvgW = parseInt(svg.style.width)  || 500;
            const startSvgH = parseInt(svg.style.height) || 500;

            function onMove(ev) {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                let newW = startW, newH = startH;
                let newSvgW = startSvgW, newSvgH = startSvgH;

                if (dir.includes('e')) { newW = Math.max(300, startW + dx); newSvgW = Math.max(200, startSvgW + dx); }
                if (dir.includes('w')) { newW = Math.max(300, startW - dx); newSvgW = Math.max(200, startSvgW - dx); }
                if (dir.includes('s')) { newSvgH = Math.max(150, startSvgH + dy); }
                if (dir.includes('n')) { newSvgH = Math.max(150, startSvgH - dy); }

                container.style.width = newW + 'px';
                svg.style.width  = newSvgW + 'px';
                svg.style.height = newSvgH + 'px';
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                autoSave();
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });

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
            window._wfMiniBarCollapse(widget, '🪞 Symétrie axiale', {});
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

    // Initialiser le color-picker (après insertion dans le DOM)
    if (typeof cpickInit === 'function') {
        cpickInit(_saPickerFullId, currentColor);
    }

    if (savedData) {
        requestAnimationFrame(() => requestAnimationFrame(() => setData(savedData)));
    } else {
        initGrid(gridSizeInput.value);
    }

    // Exposer getData/setData pour save-load.js
    widget._saGetData = getData;
    widget._saSetData = setData;

    saveBoard();
    return widget;
}
