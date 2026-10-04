// =========================================================================
// WIDGET GÉOGRAPHIE DU MONDE — Le Bureau du Prof
// Planisphère interactif : continents, océans, grands fleuves, chaînes de
// montagnes, déserts, grandes villes et lignes repères (équateur,
// tropiques, cercles polaires, méridien de Greenwich).
// Clic sur un élément : zoom sur l'élément + fiche d'information.
// Options : calques affichables, masquer les noms (mode devinette).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
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

    // CSS partagé boutons fenêtre (injecté une seule fois)
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
        .widget[data-type="geo-monde"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gw-container {
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
            overflow: hidden;
        }

        /* En-tête */
        .gw-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .gw-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .gw-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e3f1fb;
            color: #1f5f8b;
        }

        /* Réduit / plein écran */
        .gw-container.wf-minimized > *:not(.gw-header) { display: none !important; }
        .gw-container.wf-minimized { gap: 0; }
        .gw-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* Contrôles */
        .gw-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .gw-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            background: #f0f0f0;
            color: #333;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .gw-btn:hover { background: #e0e0e0; }
        .gw-btn:active { transform: scale(0.96); }
        .gw-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .gw-btn.on:hover { background: #357abd; }
        .gw-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .gw-btn-reveal:hover { background: #218838; }
        .gw-layers { display: flex; gap: 4px; margin-left: auto; align-items: center; flex-wrap: wrap; }
        .gw-layers-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .gw-layer-btn {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            color: #999;
            transition: background .15s;
        }
        .gw-layer-btn:hover { background: #e0e0e0; }
        .gw-layer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Corps : carte + fiche */
        .gw-body { display: flex; gap: 10px; align-items: stretch; }
        .gw-map-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border: 1px solid #c9dbe6;
            border-radius: 10px;
            overflow: hidden;
            background: #cfe6f3;
        }
        .gw-map { display: block; width: 100%; height: 100%; touch-action: none; }
        .gw-side {
            flex: 0 0 26%;
            min-width: 200px;
            max-width: 380px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 6px solid #9ca3af;
            border-radius: 10px;
            padding: 10px 12px;
            box-sizing: border-box;
            color: #374151;
            line-height: 1.45;
            overflow-y: auto;
        }
        .gw-side h4 { margin: 0 0 2px; font-weight: 900; }
        .gw-side .gw-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .gw-side p { margin: 0 0 6px; }
        .gw-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .gw-side li { margin-bottom: 4px; }
        .gw-side .gw-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .gw-side .gw-sw { width: 22px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .gw-side .gw-hint { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .gw-back-btn {
            margin-top: 6px;
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .gw-back-btn:hover { background: #f0f0f0; }

        /* Éléments de la carte */
        .gw-map text { font-family: 'Segoe UI', system-ui, sans-serif; paint-order: stroke; stroke-linejoin: round; }
        .gw-item { cursor: pointer; transition: opacity .25s; }
        .gw-has-sel .gw-item:not(.gw-sel) { opacity: .3; }
        .gw-sphere { fill: #cfe6f3; stroke: #9cc3dc; stroke-width: 1; }
        .gw-grat { fill: none; stroke: #ffffff; stroke-width: 0.5; stroke-opacity: .7; pointer-events: none; }
        .gw-cont { stroke: #8a8f98; stroke-width: 0.6; stroke-linejoin: round; transition: filter .25s; }
        .gw-cont:hover { filter: brightness(0.95); }
        .gw-cont.gw-sel { stroke: #374151; stroke-width: 1.8; }
        .gw-has-sel .gw-cont:not(.gw-sel) { opacity: 1; filter: grayscale(0.8) brightness(1.08); }
        .gw-water { fill: #cfe6f3; stroke: none; pointer-events: none; }
        .gw-massif { stroke: #9a6a3a; stroke-width: 0.6; stroke-opacity: .55; }
        .gw-desert { stroke: #c2913a; stroke-width: 0.6; stroke-opacity: .6; }
        .gw-desert:hover, .gw-desert.gw-sel { stroke-width: 1.6; stroke-opacity: 1; }
        .gw-line { fill: none; stroke-width: 1.5; }
        .gw-line.gw-sel { stroke-width: 3.5; }
        .gw-line-hit { fill: none; stroke: transparent; stroke-width: 12; cursor: pointer; }
        .gw-lbl-cont  { fill: #1f2937; font-weight: 900; stroke: rgba(255,255,255,0.8); stroke-width: 3; letter-spacing: .5px; }
        .gw-lbl-desert { fill: #8a5a12; font-weight: 700; font-style: italic; stroke: rgba(255,255,255,0.75); stroke-width: 3; }
        .gw-lbl-line  { font-weight: 700; stroke: #cfe6f3; stroke-width: 3; }
        .gw-massif:hover, .gw-massif.gw-sel { stroke-width: 1.8; stroke-opacity: 1; }
        .gw-river { fill: none; stroke: #2b7bd0; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        .gw-river.gw-sel { stroke-width: 5; }
        .gw-river-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
        .gw-river-hit:hover + .gw-river { stroke-width: 4; }
        .gw-lake { fill: #9ccbe8; stroke: #2b7bd0; stroke-width: 1.5; }
        .gw-city { fill: #d63b3b; stroke: #ffffff; }
        .gw-city.gw-sel { fill: #a51d1d; }
        .gw-capital { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gw-lbl-city    { fill: #7f1d1d; font-weight: 800; stroke: #ffffff; stroke-width: 3; }
        .gw-lbl-river   { fill: #1d5fa8; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .gw-lbl-massif  { fill: #7a4b1c; font-weight: 800; font-style: italic; stroke: #fdf6e1; stroke-width: 4; }
        .gw-lbl-country { fill: #6b7280; font-weight: 700; font-style: italic; stroke: #e4e6dc; stroke-width: 4; letter-spacing: 1px; }
        .gw-lbl-sea     { fill: #2f6f9e; font-weight: 700; font-style: italic; stroke: #cfe6f3; stroke-width: 3; letter-spacing: 1px; }
        .gw-lbl.gw-hidden { fill: #d63384; font-style: normal; }

        /* Calques désactivés */
        .gw-off-continents .gw-L-continents,
        .gw-off-oceans .gw-L-oceans,
        .gw-off-fleuves .gw-L-fleuves,
        .gw-off-montagnes .gw-L-montagnes,
        .gw-off-deserts .gw-L-deserts,
        .gw-off-villes .gw-L-villes,
        .gw-off-reperes .gw-L-reperes { display: none; }
        .gw-off-continents .gw-cont { pointer-events: none; }
        .gw-lbl.gw-far { display: none; }

        /* Aide */
        .gw-help-btn {
            width: 22px; height: 22px;
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
        .gw-help-btn:hover { background: #e0e0e0; color: #333; }
        .gw-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 310px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .gw-help-popup.show { display: block; }
        .gw-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .gw-help-popup p { margin: 0 0 6px; }
        .gw-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .gw-resize-handle {
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
        .gw-container:hover .gw-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Projection « Natural Earth » ──────────────────────────────────────────
const GW_K = 200;
function _gwRaw(lon, lat) {
    const l = lon * Math.PI / 180, p = lat * Math.PI / 180;
    const p2 = p * p, p4 = p2 * p2;
    return [
        GW_K * l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
        -GW_K * p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    ];
}
const GW_LATMAX = 85;
const GW_X0 = _gwRaw(-180, 0)[0] - 6, GW_X1 = _gwRaw(180, 0)[0] + 6;
const GW_Y0 = _gwRaw(0, GW_LATMAX)[1] - 6, GW_Y1 = _gwRaw(0, -90)[1] + 6;
const GW_W = GW_X1 - GW_X0, GW_H = GW_Y1 - GW_Y0;
function _gwP(lon, lat) { const r = _gwRaw(lon, lat); return [r[0] - GW_X0, r[1] - GW_Y0]; }
function _gwPath(pts, closed) {
    return pts.map((p, i) => {
        const [x, y] = _gwP(p[0], p[1]);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + (closed ? ' Z' : '');
}
function _gwSmooth(pts) {
    const P = pts.map(p => _gwP(p[0], p[1]));
    let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ' C' + c1.map(v => v.toFixed(1)).join(' ') + ' ' + c2.map(v => v.toFixed(1)).join(' ') + ' ' + p2.map(v => v.toFixed(1)).join(' ');
    }
    return d;
}
// Ligne de latitude ou de longitude (densifiée pour suivre la courbure)
function _gwParallel(lat) { const a = []; for (let l = -180; l <= 180; l += 5) a.push([l, lat]); return a; }
function _gwMeridian(lon) { const a = []; for (let p = -90; p <= GW_LATMAX; p += 5) a.push([lon, p]); return a; }
function _gwSphere() {
    return [].concat(_gwMeridian(-180), _gwParallel(GW_LATMAX), _gwMeridian(180).reverse(), _gwParallel(-90).reverse());
}
const _gwR = a => a.slice().reverse();

// Limite Europe / Asie : Caucase, mer Caspienne, fleuve Oural, monts Oural
const GW_EU_AS = [[40.0,43.4],[42.5,43.2],[44.5,42.7],[46.5,41.9],[48.6,41.85],[47.5,43.0],[47.0,44.4],[47.5,45.0],[47.8,45.6],[48.5,45.9],[49.5,46.6],[51.0,47.0],[51.9,47.1],[51.8,48.5],[51.4,50.0],[55.1,51.8],[57.5,51.5],[59.0,52.5],[59.5,55.0],[59.5,58.0],[59.3,61.0],[59.3,64.0],[60.0,66.5],[65.0,68.5],[66.0,69.3]];

// ── Continents (tracé très simplifié) ─────────────────────────────────────
const GW_SHAPES = {
    amerique: [
        [[-168,65.6],[-166,68.9],[-156.8,71.3],[-148,70.3],[-141,69.7],[-135,69.5],[-128,70.2],[-120,69.4],[-115,68],[-108,68.5],[-98,68],[-94,68.5],[-90,68.5],[-85,69.5],[-82,66.5],[-87,64],[-95,62],[-94,59],[-92,57],[-88,56],[-82,55],[-80,52],[-79,54.5],[-77,58],[-78,60.5],[-77.5,62.5],[-74,62.3],[-70,61],[-65,60.3],[-64.5,58.5],[-61.5,56],[-58,54],[-56,51.5],[-60,50.2],[-66.5,50.2],[-69.5,48.2],[-64.2,48.8],[-64.8,47],[-61,45.6],[-60,46],[-61.8,45],[-65.8,43.5],[-66.2,44.5],[-68,44.3],[-70.2,43.6],[-70.6,42.6],[-70,41.8],[-71.5,41.4],[-74,40.6],[-74.1,39.7],[-75,38.8],[-76,37],[-75.5,35.3],[-77,34.5],[-79,33.2],[-81,31.5],[-81.3,30],[-80.2,27],[-80.1,25.4],[-81.1,25.2],[-82,26.7],[-82.7,28],[-83.5,29.8],[-85.5,29.8],[-88,30.4],[-89.5,29.2],[-90.5,29.1],[-93.5,29.7],[-95,29],[-97.3,27.6],[-97.3,25.9],[-97.7,22.5],[-97.4,21],[-96.2,19.2],[-94.5,18.2],[-92,18.6],[-91,19],[-90.3,21],[-87,21.5],[-87.5,19],[-88.2,17],[-88.3,16],[-87.5,15.8],[-84,15.9],[-83.2,15],[-83.5,12],[-83.7,11],[-83,10],[-81,9],[-79.5,9.6],[-77.3,8.6],[-76,9.4],[-75.5,10.5],[-74.2,11.3],[-72.2,12],[-71.3,12.4],[-70,11.5],[-68.3,10.5],[-66,10.6],[-64,10.6],[-61.8,10.7],[-61,9.5],[-60,8.5],[-58.5,7],[-57,6],[-55,5.95],[-53,5.5],[-51.5,4.3],[-50,1.8],[-49.5,0],[-48.5,-1],[-46,-1],[-44,-2.4],[-41,-2.9],[-38.5,-3.7],[-35.2,-5.4],[-34.8,-7.5],[-35.5,-9.5],[-37,-11],[-38.5,-13],[-39,-15.5],[-39.5,-18],[-40.5,-20.5],[-41.5,-22.5],[-43.2,-23],[-45.5,-23.8],[-48,-25.5],[-48.6,-28],[-50,-30.5],[-51.5,-31.5],[-53.4,-33.7],[-55,-35],[-56.2,-34.9],[-58,-34.4],[-57.5,-35.5],[-57.5,-38],[-62.3,-38.8],[-62.2,-40.5],[-65,-41],[-63.8,-42],[-65,-42.5],[-65.3,-45],[-67.5,-46.5],[-65.8,-47.8],[-68.5,-50.5],[-68.3,-52.3],[-68.5,-53.5],[-66.5,-55],[-67.3,-55.9],[-70,-55],[-72,-54],[-74.5,-52.5],[-75.5,-50],[-75.5,-47],[-74,-45],[-73.8,-43],[-74,-42],[-73.5,-39.5],[-73.4,-37],[-71.8,-33],[-71.6,-33],[-71.3,-30],[-70.4,-23.6],[-70.3,-18.5],[-71.5,-17.5],[-74.2,-15.5],[-76.3,-13.5],[-77,-12],[-79,-8],[-81.3,-6],[-81.1,-4.5],[-80.3,-3.4],[-80,-2.5],[-80.9,-1],[-80,0.8],[-79.6,1],[-78.8,1.8],[-77.5,3.8],[-77.4,6.5],[-77.9,7.2],[-78,7.4],[-79.5,7],[-80.5,7.3],[-81.5,7.8],[-83.5,8.4],[-85.7,10],[-85.8,11],[-87.5,12.9],[-89.5,13.5],[-91.5,14],[-94,16],[-96.5,15.7],[-99.9,16.8],[-103.5,18.3],[-105.5,20.5],[-105.7,22.5],[-107.5,24.7],[-108.2,25.3],[-109.5,26.5],[-111,27.9],[-112.8,30.5],[-114.8,31.8],[-114.5,30.5],[-113,29],[-112.2,27.5],[-111.5,26],[-110.3,24.2],[-109.9,22.9],[-111.5,24.5],[-112.2,25.5],[-114.9,27.9],[-115.8,30],[-116.6,31.8],[-117.1,32.5],[-118.5,34],[-120.6,34.6],[-122.5,37.8],[-124,40.5],[-124.5,43],[-124,46.2],[-124.7,48.4],[-123,48.3],[-125,50],[-127.5,50.8],[-128,52.2],[-130.5,54.5],[-133,57],[-136,58.3],[-140,59.7],[-144,60],[-147.5,60.8],[-150,59.5],[-152,59.8],[-154,58],[-158,56.5],[-162,55],[-164.5,54.4],[-161,58.5],[-157.5,58.8],[-162,58.5],[-164.8,60.5],[-165,62],[-165,63],[-161,64.4],[-166,64.6]],
        [[-60,82.5],[-30,83.5],[-20,82],[-12,81.5],[-18,77],[-19,74],[-22,71],[-24,69],[-32,68],[-38,65.5],[-42,61],[-44,59.8],[-48,61],[-51,64],[-53,66.5],[-54,69],[-55,70.5],[-56,72.5],[-60,75.5],[-66,76.2],[-72,78.5],[-68,80.5]],
        [[-61.5,66.6],[-65.5,62.5],[-71,62.8],[-77.5,64.5],[-73,67.5],[-81,70],[-88,73.4],[-80,73.8],[-72,71.5],[-67,69.5]],
        [[-80,77],[-90,78.5],[-93,81],[-75,83],[-62,82.5],[-70,79.5],[-75,78]],
        [[-118,70.5],[-117,73],[-105,73.5],[-101,71],[-105,69.2],[-115,68.8]],
        [[-125,71.5],[-123,74.4],[-116,73.8],[-120,71]],
        [[-80,74.5],[-92,74.8],[-92,76.5],[-80,76.3]],
        [[-84.95,21.85],[-83,23],[-81,23.15],[-78,22.4],[-75.5,21],[-74.15,20.25],[-77.5,19.85],[-79,21.6],[-81.5,22.1],[-84.3,21.6]],
        [[-74.4,19.9],[-70,19.8],[-68.4,18.6],[-70,18.2],[-71.4,17.6],[-74.4,18.4]]
    ],
    europe: [
        [].concat([[29.0,41.1],[28.0,41.98],[27.9,43.2],[28.65,44.2],[29.67,45.21],[30.75,46.45],[31.9,46.55],[32.6,46.1],[33.6,45.95],[32.5,45.4],[33.4,44.55],[35.4,45.05],[36.6,45.4],[35.1,45.95],[36.8,46.75],[38.25,47.1],[38.4,46.6],[37.6,45.6],[36.7,45.25],[37.8,44.7],[38.7,44.3]], GW_EU_AS,
            [[61,69.8],[60.5,69],[57,68.6],[54,68.8],[53.5,68.2],[49,67.9],[46,67.7],[43.5,68.6],[44.2,66.1],[43,66.4],[41.5,66.2],[40,65.2],[40.5,64.55],[38,63.9],[36.5,64.2],[34.8,64.5],[34.8,65.9],[33,66.6],[32.4,67.1],[37,66.25],[41,66.3],[41.2,67],[40.5,67.75],[37,68.7],[33,69.4],[30.85,69.78],[28.5,70.85],[25.8,71.15],[22,70.3],[18.9,69.85],[16.2,68.85],[14.4,67.3],[12.6,66.1],[11.4,64.9],[9.8,63.8],[7.2,62.9],[5.2,62.1],[5.0,60.4],[5.6,58.85],[7.0,58.0],[8.4,58.25],[10.75,59.9],[11.43,58.9],[11.8,57.7],[12.85,56.25],[12.95,55.6],[14.2,55.4],[15.6,56.15],[16.6,57.4],[16.8,58.6],[18.8,59.45],[17.3,60.6],[17.4,62.3],[19,63.3],[21.4,64.75],[22.15,65.6],[24.15,65.8],[25.4,65.0],[23.1,63.85],[21.6,63.1],[21.5,61.5],[22.95,59.82],[24.95,60.15],[26.9,60.45],[28.7,60.7],[30.25,59.95],[28.0,59.47],[24.75,59.45],[23.5,58.95],[24.5,58.35],[24.1,57.0],[22.6,57.75],[21.05,56.85],[21.05,56.07],[21.1,55.7],[21.25,55.25],[19.95,54.95],[18.6,54.45],[17.5,54.8],[14.25,53.92],[13.4,54.65],[12.1,54.18],[10.9,54.35],[9.9,54.8],[9.6,55.2],[10.3,56.55],[10.6,57.75],[9.5,57.15],[8.1,56.6],[8.45,55.47],[8.65,54.9],[8.9,54.05],[8.2,53.55],[7.05,53.6],[6.2,53.45],[4.75,53.0],[4.0,51.95],[3.37,51.37],[2.55,51.09],[1.6,50.9],[1.5,50.15],[0.2,49.7],[0.1,49.45],[-1.1,49.35],[-1.95,49.72],[-1.6,48.62],[-3.0,48.78],[-4.6,48.6],[-4.73,48.04],[-3.4,47.7],[-2.15,47.1],[-1.15,46.16],[-1.2,44.6],[-1.78,43.37],[-3.8,43.47],[-7.7,43.75],[-9.3,42.9],[-8.9,40.15],[-9.5,38.78],[-8.95,37.0],[-7.4,37.18],[-6.3,36.55],[-5.6,36.02],[-4.4,36.72],[-2.1,36.73],[-0.75,37.9],[0.2,38.75],[-0.33,39.45],[0.9,40.8],[3.17,42.43],[3.05,42.95],[4.1,43.55],[5.37,43.25],[7.27,43.68],[8.93,44.41],[10.3,43.55],[12.25,41.75],[14.25,40.83],[15.6,40.05],[15.65,38.25],[16.05,37.92],[17.15,38.95],[16.6,40.1],[17.25,40.45],[18.4,39.8],[18.0,40.65],[16.0,41.45],[13.85,42.9],[12.3,44.5],[12.35,45.43],[13.72,45.6],[13.9,44.8],[15.2,44.1],[17.0,43.25],[18.52,42.42],[19.4,41.4],[19.85,40.05],[20.15,39.6],[21.15,38.3],[21.6,37.4],[22.5,36.4],[23.2,37.3],[24.05,37.65],[23.6,38.5],[22.95,39.35],[22.95,40.6],[23.9,40.75],[25.85,40.85],[26.04,40.73],[26.7,40.4],[27.5,40.95],[28.8,41.0]]),
        [[-5.7,50.05],[-3.0,50.7],[0.25,50.75],[1.4,51.2],[1.75,52.5],[0.35,52.95],[-0.1,53.65],[-1.5,55.0],[-2.05,57.15],[-1.8,57.5],[-3.05,58.65],[-5.0,58.62],[-5.6,57.6],[-5.6,55.3],[-4.85,54.65],[-3.0,54.2],[-3.1,53.4],[-4.6,53.3],[-4.1,52.6],[-5.3,51.85],[-3.2,51.45],[-5.0,50.55]],
        [[-6.2,54.0],[-5.6,54.6],[-6.05,55.2],[-7.4,55.38],[-8.5,54.95],[-8.55,54.3],[-9.95,54.2],[-10.1,53.5],[-9.4,52.9],[-10.4,52.15],[-10.1,51.6],[-8.5,51.65],[-6.35,52.2],[-6.05,53.35]],
        [[-22.0,63.85],[-18.0,63.4],[-15.0,64.25],[-13.6,65.1],[-14.5,66.35],[-17.5,66.05],[-20.4,66.1],[-22.4,66.4],[-24.3,65.6],[-22.0,65.0],[-21.9,64.15]],
        [[12.4,37.8],[15.55,38.25],[15.1,36.65],[12.6,37.6]], [[8.15,40.6],[9.2,41.25],[9.75,40.4],[9.1,39.2],[8.4,39.1]], [[9.4,43.0],[9.53,42.4],[9.2,41.38],[8.62,41.9],[8.7,42.57]],
        [[23.5,35.3],[26.3,35.3],[26.15,35.0],[23.55,35.25]], [[11,78.5],[16,80],[27,80.2],[22,77.5],[16,76.5]], [[51.5,71.3],[56,70.6],[57.5,70.75],[56,71.6],[55,73.5],[57,75.5],[62,76.8],[68.5,76.9],[60,75.5],[56,73],[52,72.5]]
    ],
    afrique: [
        [[-5.9,35.8],[-5.4,35.9],[-2.9,35.3],[-1.2,35.3],[0.5,36.0],[3.05,36.75],[6.6,37.0],[8.6,36.95],[9.5,37.3],[11.0,37.05],[10.5,36.4],[11.1,35.2],[10.1,34.3],[10.1,33.9],[11.2,33.2],[13.2,32.9],[15.2,32.3],[15.4,31.6],[16.6,31.2],[18.5,30.5],[20.05,32.1],[21.5,32.9],[24.0,32.05],[25.2,31.6],[29.9,31.2],[32.3,31.25],[32.55,29.95],[33.5,27.5],[35.5,23.5],[37.2,21],[37.2,19.6],[38.5,18],[39.7,15.5],[41.5,13.8],[43.3,12.5],[43.1,11.6],[44.5,10.4],[47,11.1],[51.25,11.8],[51,10.4],[49.5,6],[48,4.5],[46,2],[45.3,2],[43,-0.5],[41,-2],[40,-3.3],[39.3,-6.8],[39.5,-8],[40.5,-11],[40.6,-14.5],[39,-17],[34.8,-19.8],[35.5,-22],[35.5,-24],[32.6,-26],[32.8,-28.5],[31,-29.9],[28,-32.7],[25.6,-34],[22,-34.2],[20,-34.8],[18.4,-34.3],[18.3,-33],[17.8,-31],[15.2,-27],[15.1,-26.6],[14.5,-23],[14.5,-22.9],[13.2,-20],[11.8,-17.3],[12.3,-13.5],[13.2,-8.8],[12.3,-6],[11.8,-4.8],[9.5,-2],[9.3,0.5],[9.6,3.5],[9.7,4],[8.6,4.5],[6.2,4.3],[4.5,6.3],[3.4,6.45],[1.5,6.2],[-1,5],[-2.5,4.8],[-4,5.2],[-7.6,4.4],[-10.5,6.5],[-13.2,8.5],[-15,10.8],[-16.7,12.4],[-17.5,14.7],[-16.5,16.5],[-16.1,19],[-16.9,21.3],[-15.2,24],[-14.5,26.1],[-13.2,27.7],[-11.5,28.3],[-9.8,30.4],[-9.7,32.3],[-8.5,33.3],[-6.8,34.05],[-6.2,35.2]],
        [[49.3,-12],[50.5,-15.5],[49.6,-17.5],[48.5,-20.5],[47.2,-24.5],[45.2,-25.6],[43.7,-23.5],[44,-20],[44.5,-16.5],[46.3,-15.7],[48,-13.4]]
    ],
    asie: [
        [].concat([[29.0,41.1],[29.9,40.75],[29.0,40.4],[27.0,40.3],[26.15,39.95],[26.1,39.5],[26.8,39.3],[26.75,38.7],[27.1,38.4],[26.4,38.3],[27.2,37.5],[27.4,37.0],[28.2,36.75],[29.1,36.6],[29.7,36.15],[30.4,36.25],[30.7,36.85],[32.0,36.5],[32.8,36.05],[33.9,36.25],[34.6,36.8],[35.6,36.6],[36.2,36.6],[36.15,35.82],[35.75,35.5],[35.95,34.65],[35.5,33.9],[35.1,33.1],[34.9,32.4],[34.5,31.5],[34.2,31.3],[32.3,31.25],[32.55,29.95],[33.3,28.5],[34.25,27.8],[34.5,28.5],[35.0,29.5],[34.8,28],[35.5,27.5],[37,25],[38.5,23],[39.2,21.5],[40.5,19.5],[42.5,16.5],[43.3,12.7],[45,12.8],[48,14],[51,15.2],[52.2,15.6],[55,17],[57,18.9],[59.8,22.5],[58.5,23.6],[56.4,24.9],[56.3,26.3],[55.5,25.5],[55.3,25.25],[52,24],[51.6,25.8],[51.2,26],[50.2,26.5],[49.5,27.5],[48,29.4],[48.8,30],[50.3,29.2],[51.5,27.9],[54,26.6],[56.3,27.2],[57.3,25.8],[61.5,25.1],[67,24.8],[68.5,23.5],[69.5,22.8],[70,22.5],[72.6,21.2],[72.8,19],[73.5,16],[73.8,15.5],[74.8,12.9],[76.2,10],[77.5,8.1],[78.2,8.9],[79.8,10.3],[80.2,13.1],[80.3,15.5],[82.3,16.6],[85,19.3],[86.9,21.0],[88.2,21.7],[89.5,21.9],[91.8,22.4],[92.5,20.5],[94.2,18.2],[94.3,16],[95.5,15.8],[97.6,16.5],[98.2,13.5],[98.5,10],[98.3,8.2],[98.3,7.8],[100,6.4],[100.3,5.2],[101.3,2.8],[103.8,1.3],[104.3,1.5],[103.4,4.2],[102.3,6.2],[100.4,7.3],[100,9.2],[99.2,10.5],[100,13.4],[101,12.7],[102.5,12],[103.5,10.5],[104.8,8.6],[106.5,9.6],[107.5,10.5],[109.2,11.8],[109.2,13.8],[108.5,16],[107.5,16.6],[106.5,18],[105.8,19],[106.7,20.6],[108,21.5],[109.7,21.5],[110.2,20.3],[110.5,21.2],[112,21.8],[114.2,22.3],[116.5,23],[118,24.5],[119.5,25.5],[120.5,27.5],[121.9,29.9],[121.5,31.5],[121.8,31.3],[120.8,32.6],[119.5,34.5],[119.3,35],[120.5,36],[122.5,37.2],[120.5,37.7],[119,37.2],[118,38.5],[117.7,39],[119,39.5],[121,40.8],[121.5,39.0],[122,40],[124.3,39.9],[125,39.5],[125.3,37.7],[126.5,37.6],[126.3,35],[126.5,34.4],[128,34.8],[129,35.1],[129.5,36],[129.4,37.5],[128.5,38.5],[127.5,39.8],[129.7,40.8],[129.8,41.5],[130.7,42.3],[132,43.2],[133,42.8],[135.5,43.8],[137.5,45],[138.5,47],[140.5,48.5],[140.5,51],[141.5,53],[139,54],[137,54],[136,54.8],[137.5,56.5],[140.5,57.8],[143,59.3],[150.8,59.5],[155,59.3],[154,61],[156.5,61.5],[160,61.8],[157,58],[156,51.5],[156.7,50.9],[158.7,52.9],[160,54.2],[162.5,56],[163,57.8],[164.5,59.8],[166,60.3],[170,60],[172,61],[177,62.5],[180,62.5],[180,68.9],[178,69.5],[171,70],[165,69.6],[161,69.5],[160,70.8],[152,70.9],[146,72.3],[140,72.5],[130,71],[127,73.5],[120,73],[113,73.6],[105,77.7],[100,76],[95,76],[88,75.5],[82,72],[80,73.5],[75,72.5],[70,73],[68.5,71]],
            _gwR(GW_EU_AS), [[41.6,42.3],[41.6,41.6],[40.6,41.3],[39.7,41.0],[37.5,41.05],[36.3,41.3],[36.0,41.7],[35.1,42.05],[34.0,42.0],[32.5,41.85],[31.4,41.3],[30.5,41.2],[29.1,41.25]]),
        [[-180,64.5],[-180,69],[-175,67.5],[-171,66.5],[-169.7,66],[-172,64.4],[-176,65]],
        [[130.9,34.0],[135,34.6],[135.8,33.5],[137,34.6],[138.8,34.6],[140,35.6],[140.8,35.7],[141,37],[141.5,38.3],[142,39.5],[141.5,41.4],[140.3,41.2],[140,40],[139.8,39],[139,38],[137,37.2],[136,35.9],[133,35.6],[131,34.5]],
        [[140,41.5],[143.2,41.9],[145.5,43.3],[144.3,44],[142,45.5],[141.4,43.3],[140,42.3]],
        [[129.7,33.2],[131,33.9],[131.9,33.3],[131.3,31.4],[130.6,31.0],[130.1,32.2]], [[132.5,33.3],[134,34.3],[134.7,33.8],[133,32.8]],
        [[142,46],[143.5,46.7],[143,49],[144.5,49],[143.2,51.5],[143.3,53.5],[142.5,54.3],[142.2,52],[141.8,48.5]],
        [[121.0,25.3],[121.9,25],[121.5,23],[120.8,21.9],[120.1,23],[120.2,24.3]], [[108.6,19.2],[110.2,20.1],[111,19.6],[109.6,18.2],[108.7,18.5]],
        [[79.9,9.8],[81,8.6],[81.9,7.2],[81.7,6.4],[80.6,5.9],[79.9,6.8]],
        [[120,18.5],[122.2,18.5],[122.4,17],[121.5,15.5],[122,14],[124,13],[123.5,12.6],[122.5,13.8],[120.6,13.8],[120.6,14.6],[119.8,16],[120.4,17]],
        [[122,7],[124,8.5],[125.5,9.8],[126.5,7.5],[126,6.2],[125,5.6],[124,6.4],[122.5,7.5]],
        [[95.3,5.6],[97.5,5.2],[100.3,2.3],[103.5,-1.0],[104.5,-2.5],[106,-3.2],[105.8,-5.8],[104.5,-5.8],[102.3,-4],[100.4,-1],[98.7,1.7],[97.1,3.2],[95.4,4.8]],
        [[105.2,-6.8],[106.8,-6.0],[108.3,-6.2],[110.4,-6.9],[112.6,-6.9],[114.4,-7.8],[114.6,-8.7],[112,-8.4],[108.5,-7.8],[106.4,-7.4]],
        [[109,1.7],[111.5,2.7],[113,3.2],[115.4,5.4],[117.2,7],[119.3,5.3],[118.1,4.3],[117.8,1.2],[119,0.9],[117.5,0.1],[116.5,-2],[116,-3.8],[114.6,-4],[111.5,-3.2],[110,-2.9],[109,-0.2],[108.9,1.2]],
        [[118.8,-2.6],[119.4,-5.5],[120.4,-5.6],[120.3,-3],[121.3,-4.8],[123.2,-4.7],[121.5,-1.5],[123.4,-0.9],[121,0.5],[124.8,1.4],[120.8,1.3],[119.8,0],[119.5,-1.5]],
        [[102,79],[106,79.5],[105,78.5],[100,79]], [[138,74],[142,73.5],[150,75],[146,76],[140,75.3]]
    ],
    oceanie: [
        [[114.1,-21.8],[116.7,-20.6],[118.8,-20.3],[121,-19.5],[122.2,-17.9],[123.5,-16.3],[125,-14.5],[127,-14],[128.2,-15],[129.5,-14.9],[130.2,-12.9],[130.8,-12.4],[132.5,-11.6],[135.5,-12],[136.8,-12.2],[135.9,-13.6],[135.5,-15],[137.5,-16.2],[139.5,-17.5],[141.4,-16.5],[141.6,-13],[142.5,-10.7],[143.5,-14],[145.4,-15],[146,-17],[146.3,-19],[148.8,-20.3],[150,-22.4],[151.5,-24],[153.1,-25.7],[153.6,-28.5],[153,-31],[151.2,-33.9],[150.2,-35.8],[150,-37.5],[147.5,-38],[146.3,-39],[144.9,-37.9],[143.5,-38.8],[140.5,-38],[139.5,-36.8],[138.5,-35.6],[138.1,-34.2],[137.5,-35.2],[136.8,-35.3],[137.9,-33.1],[136,-34.8],[135.3,-34.6],[134.2,-32.8],[131.2,-31.5],[128,-31.8],[124,-33],[121.9,-33.9],[119.5,-34.3],[118,-35],[116,-34.9],[115,-34.3],[115.6,-33.5],[115.7,-32],[115,-29.5],[114,-26.5],[113.4,-25.5],[113.7,-24],[113.5,-22.5]],
        [[144.6,-40.7],[148.3,-40.9],[148,-43.2],[146.8,-43.6],[145.3,-42.2]],
        [[172.7,-34.4],[174.5,-35.5],[175.5,-37],[178.5,-37.7],[177.9,-39.2],[176.9,-39.6],[176.2,-41.3],[174.7,-41.3],[175.2,-40.2],[173.8,-39.2],[174.6,-37.8],[174.3,-36.5],[173,-35.2]],
        [[172.6,-40.5],[174.3,-41.7],[173.2,-43.5],[171.2,-44.5],[170.6,-45.9],[169,-46.6],[166.5,-46],[166.8,-45.2],[168.4,-44],[170.5,-42.9],[171.5,-41.7]],
        [[131,-1.2],[132.4,-0.4],[134.1,-1],[135,-3.3],[138,-1.7],[141,-2.6],[145,-4.5],[146,-5.6],[147.8,-6.3],[148,-8],[150.2,-10.3],[147.5,-10.2],[146,-8.2],[144,-7.6],[143,-9],[141,-9.1],[139,-8.1],[138,-8.4],[137.5,-5],[134.6,-4],[132.8,-4.0],[132,-2.8],[133,-2.4],[131.3,-1.5]]
    ],
    antarctique: [
        [[-180,-78],[-160,-77],[-140,-75],[-120,-74],[-100,-73],[-80,-73],[-72,-70],[-68,-67],[-62,-64],[-57,-63.3],[-60,-65],[-62,-68],[-60,-73],[-45,-78],[-30,-77],[-20,-74],[-10,-71],[0,-70],[20,-70],[40,-69],[60,-67.5],[80,-67],[100,-66],[120,-66.5],[140,-66.5],[160,-69.5],[170,-71.5],[165,-78],[180,-78],[180,-82],[180,-86],[180,-90],[-180,-90],[-180,-86],[-180,-82]]
    ]
};
const GW_CASPIAN = [[49.2,46.3],[48.5,45.9],[47.8,45.6],[47.5,45.0],[47.0,44.4],[47.5,43.5],[47.5,42.98],[48.2,42.0],[48.6,41.85],[49.4,40.5],[50.35,40.4],[49.3,39.5],[49.0,38.4],[49.6,37.6],[51.0,36.8],[53.9,37.0],[53.8,38.5],[53.0,39.5],[53.5,40.5],[52.8,41.5],[52.5,42.5],[51.3,43.2],[51.3,44.5],[53.0,45.3],[53.2,46.7],[51.5,47.0],[50.0,46.6]];

// ── Continents ────────────────────────────────────────────────────────────
const GW_CONTINENTS = [
    { id: 'asie', name: 'Asie', lbl: [90,47], col: '#f2a9a0', sup: '44,6 millions de km²', pop: '4,8 milliards', pays: '48', grand: 'la Russie (partie asiatique) et la Chine', sommet: 'l\'Everest (8 849 m)', fact: 'Le plus grand et le plus peuplé des continents : 6 humains sur 10 y vivent. On y trouve les deux pays les plus peuplés du monde, l\'Inde et la Chine.' },
    { id: 'amerique', name: 'Amérique', lbl: [-100,45], col: '#f4c28f', sup: '42,5 millions de km²', pop: '1 milliard', pays: '35', grand: 'le Canada', sommet: 'l\'Aconcagua (6 961 m, Andes)', fact: 'Le continent américain s\'étend sur plus de 14 000 km, de l\'océan Arctique jusqu\'au cap Horn. On y distingue trois ensembles : l\'Amérique du Nord, l\'Amérique centrale (avec les îles des Caraïbes) et l\'Amérique du Sud, reliées par l\'isthme de Panama. Le Groenland lui est rattaché géographiquement.' },
    { id: 'afrique', name: 'Afrique', lbl: [18,8], col: '#f3e08a', sup: '30,4 millions de km²', pop: '1,5 milliard', pays: '54', grand: 'l\'Algérie', sommet: 'le Kilimandjaro (5 895 m)', fact: 'C\'est le berceau de l\'humanité : les plus anciens fossiles d\'ancêtres de l\'Homme y ont été découverts. Sa population est la plus jeune du monde.' },
    { id: 'antarctique', name: 'Antarctique', lbl: [20,-80], col: '#f4f7fb', sup: '14 millions de km²', pop: 'aucun habitant permanent (quelques milliers de scientifiques)', pays: 'aucun (continent protégé par un traité international)', grand: '—', sommet: 'le mont Vinson (4 892 m)', fact: 'Le continent le plus froid, le plus venteux et le plus sec. Il est recouvert d\'une calotte de glace qui atteint plus de 4 km d\'épaisseur. On y a mesuré −89 °C.' },
    { id: 'europe', name: 'Europe', lbl: [22,53], col: '#c6b5e8', sup: '10,2 millions de km²', pop: '745 millions', pays: 'une cinquantaine', grand: 'la Russie (partie européenne)', sommet: 'l\'Elbrouz (5 642 m, Caucase) ; le Mont Blanc (4 806 m) dans les Alpes', fact: 'Petit continent très peuplé, limité à l\'est par les monts Oural. La France s\'y trouve, ainsi que les 27 pays de l\'Union européenne.' },
    { id: 'oceanie', name: 'Océanie', lbl: [134,-25], col: '#a3d9c9', sup: '8,5 millions de km²', pop: '45 millions', pays: '14', grand: 'l\'Australie', sommet: 'le Puncak Jaya (4 884 m, Nouvelle-Guinée)', fact: 'Le plus petit continent, formé de l\'Australie et de milliers d\'îles du Pacifique. La Nouvelle-Calédonie et la Polynésie française en font partie.' }
];

// ── Océans ────────────────────────────────────────────────────────────────
const GW_OCEANS = [
    { id: 'pacifique', name: 'Océan Pacifique', lines: ['Océan', 'Pacifique'], lbls: [[-140,8],[165,20]], sup: '165 millions de km²', prof: '10 994 m (fosse des Mariannes)', fact: 'Le plus grand et le plus profond des océans : il couvre presque un tiers de la surface de la Terre. On pourrait y faire tenir tous les continents réunis !' },
    { id: 'atlantique', name: 'Océan Atlantique', lines: ['Océan', 'Atlantique'], lbls: [[-35,25],[-17,-25]], sup: '106 millions de km²', prof: '8 376 m (fosse de Porto Rico)', fact: 'Il sépare l\'Europe et l\'Afrique de l\'Amérique. La France métropolitaine le borde à l\'ouest.' },
    { id: 'indien', name: 'Océan Indien', lines: ['Océan', 'Indien'], lbls: [[80,-20]], sup: '70 millions de km²', prof: '7 192 m (fosse de Java)', fact: 'Le plus chaud des océans. Il baigne l\'Afrique de l\'Est, l\'Asie du Sud et l\'Australie. La Réunion et Mayotte s\'y trouvent.' },
    { id: 'arctique', name: 'Océan Arctique', lines: ['Océan Arctique'], lbls: [[-10,79.5]], sup: '14 millions de km²', prof: '5 550 m', fact: 'Le plus petit et le plus froid des océans, autour du pôle Nord. Il est en grande partie recouvert de banquise (eau de mer gelée).' },
    { id: 'austral', name: 'Océan Austral', lines: ['Océan Austral'], lbls: [[-100,-60],[100,-58]], sup: '21 millions de km²', prof: '7 432 m', fact: 'Il entoure l\'Antarctique. Ses eaux sont glaciales et ses tempêtes très violentes.' }
];

// ── Fleuves ───────────────────────────────────────────────────────────────
const GW_RIVERS = [
    { id: 'nil', name: 'Nil', lbl: [28.5,22], path: [[33,-1.5],[32.5,1.5],[31.6,4.8],[31.5,9.5],[32.5,12],[32.5,15.6],[33.9,17.6],[31.5,18.5],[33,21.5],[32.9,24.1],[32.7,25.7],[31.2,28],[31.2,30.0],[31,31.5]],
      longueur: '6 650 km', source: 'région du lac Victoria (Burundi, Rwanda)', mer: 'la mer Méditerranée', cont: 'Afrique', fact: 'L\'un des deux plus longs fleuves du monde avec l\'Amazone. Sans lui, l\'Égypte ne serait qu\'un désert : c\'est grâce à ses crues que la civilisation égyptienne est née.' },
    { id: 'amazone', name: 'Amazone', lbl: [-62,-0.5], path: [[-72,-15],[-73.5,-11],[-73.8,-6],[-73.2,-3.75],[-70,-4.2],[-65,-3],[-60,-3.1],[-55,-2.3],[-52,-1.5],[-50,-0.5]],
      longueur: '6 400 km environ', source: 'cordillère des Andes (Pérou)', mer: 'l\'océan Atlantique', cont: 'Amérique (du Sud)', fact: 'Le fleuve le plus puissant du monde : il transporte à lui seul un cinquième de l\'eau douce qui se jette dans les océans. Il traverse la forêt amazonienne.' },
    { id: 'yangzi', name: 'Yangzi Jiang', lbl: [108,33], path: [[91,33.5],[95,32.5],[98.5,30],[100,27],[102.5,26.2],[104.6,28.8],[106.5,29.6],[111,30.8],[114.3,30.6],[118.8,32.05],[121.6,31.4]],
      longueur: '6 300 km', source: 'plateau du Tibet', mer: 'la mer de Chine orientale (à Shanghai)', cont: 'Asie', fact: 'Le plus long fleuve d\'Asie. On l\'appelle aussi « fleuve Bleu ». Le barrage des Trois-Gorges, le plus grand du monde, y a été construit.' },
    { id: 'mississippi', name: 'Mississippi', lbl: [-84,38], path: [[-95.2,47.2],[-93.1,44.95],[-91,42.5],[-90.2,38.6],[-89.5,36.5],[-90,35.1],[-91,33],[-91.2,30.5],[-90,29.95],[-89.3,29.1]],
      longueur: '3 770 km (6 275 km avec le Missouri)', source: 'lac Itasca (Minnesota, États-Unis)', mer: 'le golfe du Mexique', cont: 'Amérique (du Nord)', fact: 'Le grand fleuve des États-Unis, qui traverse le pays du nord au sud. Il se termine par un grand delta près de La Nouvelle-Orléans.' },
    { id: 'congo', name: 'Congo', lbl: [24.5,-3.5], path: [[26.5,-10.5],[26.7,-5],[25.2,0.5],[22,2],[18.3,0.05],[15.3,-4.3],[12.3,-6.05]],
      longueur: '4 700 km', source: 'plateau du Katanga (République démocratique du Congo)', mer: 'l\'océan Atlantique', cont: 'Afrique', fact: 'Le deuxième fleuve le plus puissant du monde. Il traverse deux fois l\'équateur et la grande forêt équatoriale d\'Afrique.' },
    { id: 'gange', name: 'Gange', lbl: [83,22.5], path: [[79,30.9],[78.15,29.95],[80.3,26.5],[83,25.3],[85.1,25.6],[88,24.5],[90.5,22.5]],
      longueur: '2 500 km', source: 'glacier de Gangotri (Himalaya)', mer: 'le golfe du Bengale (océan Indien)', cont: 'Asie', fact: 'Fleuve sacré pour les hindous. Sa vallée est l\'une des régions les plus peuplées du monde.' },
    { id: 'volga', name: 'Volga', lbl: [52,54], path: [[32.5,57.25],[35.9,56.85],[39.9,57.6],[44.0,56.33],[49.1,55.8],[50.1,53.2],[46.0,51.55],[44.5,48.7],[48.0,46.35],[48.5,45.85]],
      longueur: '3 530 km', source: 'collines du Valdaï (Russie)', mer: 'la mer Caspienne', cont: 'Europe', fact: 'Le plus long fleuve d\'Europe.' }
];

// ── Chaînes de montagnes ──────────────────────────────────────────────────
const GW_MOUNTAINS = [
    { id: 'himalaya', name: 'Himalaya', lbl: [84,32.5], shape: [[73,36],[77,35.5],[81,30.5],[85,28.5],[88,27.8],[92,28],[95.5,29],[97,28.3],[95,27.3],[92,26.9],[88,26.6],[84,27.3],[80,28.6],[77,30.5],[74,33.5],[72,35]],
      sommet: 'l\'Everest (8 849 m), le plus haut sommet du monde', cont: 'Asie', fact: 'La plus haute chaîne de montagnes du monde, entre l\'Inde et le Tibet. Elle compte 14 sommets de plus de 8 000 m. On l\'appelle le « toit du monde ».' },
    { id: 'andes', name: 'Andes', lbl: [-63,-30], shape: [[-75,10],[-72,8],[-77,3],[-79,-2],[-77.5,-8],[-72,-15],[-69,-17],[-68,-22],[-69.5,-28],[-70,-33],[-71,-38],[-72,-42],[-73,-47],[-73,-52],[-71,-52],[-71,-47],[-70.3,-42],[-69.5,-38],[-68.5,-33],[-67,-28],[-65.5,-22],[-66,-17],[-69,-14],[-74.5,-8],[-76.5,-2],[-75,3],[-70.5,7],[-72.5,10]],
      sommet: 'l\'Aconcagua (6 961 m)', cont: 'Amérique (du Sud)', fact: 'La plus longue chaîne de montagnes du monde : environ 7 000 km le long de la côte ouest de l\'Amérique du Sud. Elle compte de nombreux volcans.' },
    { id: 'rocheuses', name: 'Rocheuses', lbl: [-112,43], shape: [[-125,60],[-120,55],[-115,50],[-111,45],[-107,40],[-106,35],[-105.5,32],[-103.5,33],[-104.5,38],[-105.5,42],[-109,46],[-113,50],[-117,55],[-123,61],[-130,64],[-135,65],[-132,62]],
      sommet: 'le mont Elbert (4 401 m)', cont: 'Amérique (du Nord)', fact: 'Grande chaîne de l\'ouest de l\'Amérique du Nord, du Canada jusqu\'au Mexique. Le plus haut sommet d\'Amérique du Nord, le Denali (6 190 m), se trouve plus au nord, en Alaska.' },
    { id: 'alpes', name: 'Alpes', lbl: [10,49.5], shape: [[5.4,44],[5.3,45],[6.6,46.4],[9.5,47.3],[14,47.9],[16.1,47.7],[15.5,46.5],[12,46],[9.5,45.85],[7.6,45.4],[7.4,44.3],[6.5,43.85]],
      sommet: 'le Mont Blanc (4 806 m)', cont: 'Europe', fact: 'La plus haute chaîne de montagnes d\'Europe occidentale. Elle traverse la France, l\'Italie, la Suisse, l\'Autriche…' },
    { id: 'atlas', name: 'Atlas', lbl: [-3,30], shape: [[-9.6,30.8],[-6,31.5],[-3,33],[0,34.5],[5,35.5],[9,36.5],[10,36],[6,34.5],[2,33.5],[-2,32],[-5,30.8],[-8.5,30]],
      sommet: 'le Toubkal (4 167 m)', cont: 'Afrique', fact: 'Chaîne du nord-ouest de l\'Afrique (Maroc, Algérie, Tunisie), qui sépare la côte méditerranéenne du désert du Sahara.' },
    { id: 'oural', name: 'Oural', lbl: [63,59], shape: [[57.5,52],[58.5,57],[59,62],[60,66.5],[65,68.6],[66,68.2],[61.5,66],[60.3,61],[60.2,58],[59.7,53],[59,51.3]],
      sommet: 'le mont Narodnaïa (1 895 m)', cont: 'Europe / Asie', fact: 'Montagne ancienne aux sommets arrondis, en Russie. Elle marque la limite entre l\'Europe et l\'Asie.' }
];

// ── Déserts ───────────────────────────────────────────────────────────────
const GW_DESERTS = [
    { id: 'sahara', name: 'Sahara', lbl: [10,23.5], shape: [[-16,21],[-13,27.5],[-5,30],[0,31.8],[10,31.5],[20,30],[30,29.5],[32.5,25],[35,21],[33,17],[25,16],[15,15.5],[5,16],[-5,16],[-15,17]],
      sup: '9 millions de km²', type: 'désert chaud', cont: 'Afrique', fact: 'Le plus grand désert chaud du monde, presque aussi grand que les États-Unis. Il y pleut très rarement et les températures dépassent souvent 45 °C le jour.' },
    { id: 'arabie', name: 'Désert d\'Arabie', lines: ['Désert', 'd\'Arabie'], lbl: [46,23.5], shape: [[39,28],[46,29],[50,25.5],[55,21],[52,17.5],[45,18.5],[40.5,22]],
      sup: '2,3 millions de km²', type: 'désert chaud', cont: 'Asie', fact: 'Il couvre la plus grande partie de la péninsule Arabique. Son sous-sol est très riche en pétrole.' },
    { id: 'gobi', name: 'Gobi', lbl: [105,44], shape: [[95,43],[100,45.5],[106,46],[112,45],[115,43],[111,41.5],[104,41],[97,41.5]],
      sup: '1,3 million de km²', type: 'désert froid', cont: 'Asie', fact: 'Grand désert de Mongolie et de Chine. Les hivers y sont glacials (jusqu\'à −40 °C) et les étés brûlants. On y a trouvé de nombreux fossiles de dinosaures.' },
    { id: 'kalahari', name: 'Kalahari', lbl: [22,-23], shape: [[18,-20],[24,-19],[26,-23],[24,-27],[19,-27],[17.5,-23]],
      sup: '900 000 km²', type: 'désert chaud (semi-aride)', cont: 'Afrique', fact: 'Désert du sud de l\'Afrique (Botswana, Namibie, Afrique du Sud), couvert d\'herbes sèches et de buissons.' },
    { id: 'australie', name: 'Désert australien', lines: ['Désert', 'australien'], lbl: [128,-25.5], shape: [[120,-21],[130,-20],[138,-22],[136,-28],[128,-30],[121,-28]],
      sup: '2,7 millions de km² (plusieurs déserts réunis)', type: 'désert chaud', cont: 'Océanie', fact: 'Le centre de l\'Australie, appelé l\'« outback », est occupé par plusieurs grands déserts. On y trouve le célèbre rocher Uluru.' },
    { id: 'atacama', name: 'Atacama', lbl: [-62.5,-24.5], shape: [[-70.5,-18],[-69,-19],[-68.8,-27],[-70.6,-27]],
      sup: '105 000 km²', type: 'désert côtier', cont: 'Amérique (du Sud)', fact: 'Le désert non polaire le plus sec du monde, au Chili. Certaines de ses stations météo n\'ont jamais enregistré de pluie !' }
];

// ── Grandes villes ────────────────────────────────────────────────────────
const GW_CITIES = [
    { id: 'tokyo', name: 'Tokyo', p: [139.7,35.7], lp: 'r', pays: 'Japon', cont: 'Asie', pop: '37 millions', fact: 'Capitale du Japon, souvent présentée comme la plus grande agglomération du monde.' },
    { id: 'delhi', name: 'Delhi', p: [77.2,28.6], lp: 'l', pays: 'Inde', cont: 'Asie', pop: '33 millions', fact: 'Ville où se trouve New Delhi, la capitale de l\'Inde, le pays le plus peuplé du monde.' },
    { id: 'shanghai', name: 'Shanghai', p: [121.5,31.2], lp: 'r', pays: 'Chine', cont: 'Asie', pop: '29 millions', fact: 'Plus grande ville de Chine et l\'un des plus grands ports du monde, à l\'embouchure du Yangzi Jiang.' },
    { id: 'pekin', name: 'Pékin', p: [116.4,39.9], lp: 'l', pays: 'Chine', cont: 'Asie', pop: '22 millions', fact: 'Capitale de la Chine. On peut y visiter la Cité interdite, et la Grande Muraille n\'est pas loin.' },
    { id: 'mumbai', name: 'Bombay', p: [72.9,19.1], lp: 'l', pays: 'Inde', cont: 'Asie', pop: '21 millions', fact: 'Aussi appelée Mumbai. Grand port et capitale économique de l\'Inde, célèbre pour son cinéma (« Bollywood »).' },
    { id: 'lecaire', name: 'Le Caire', p: [31.2,30.05], lp: 'r', pays: 'Égypte', cont: 'Afrique', pop: '22 millions', fact: 'Capitale de l\'Égypte, au bord du Nil. Les pyramides de Gizeh se trouvent à sa périphérie.' },
    { id: 'lagos', name: 'Lagos', p: [3.4,6.5], lp: 'b', pays: 'Nigeria', cont: 'Afrique', pop: '16 millions', fact: 'La plus grande ville du Nigeria, le pays le plus peuplé d\'Afrique. Sa population augmente très vite.' },
    { id: 'kinshasa', name: 'Kinshasa', p: [15.3,-4.3], lp: 'l', pays: 'République démocratique du Congo', cont: 'Afrique', pop: '17 millions', fact: 'Capitale de la RDC, au bord du fleuve Congo. C\'est la plus grande ville francophone du monde.' },
    { id: 'paris', name: 'Paris', p: [2.35,48.86], lp: 'l', pays: 'France', cont: 'Europe', pop: '11 millions', fact: 'Capitale de la France, l\'une des villes les plus visitées du monde.' },
    { id: 'moscou', name: 'Moscou', p: [37.6,55.75], lp: 'r', pays: 'Russie', cont: 'Europe', pop: '13 millions', fact: 'Capitale de la Russie et plus grande ville d\'Europe.' },
    { id: 'newyork', name: 'New York', p: [-74,40.7], lp: 'r', pays: 'États-Unis', cont: 'Amérique (du Nord)', pop: '19 millions', fact: 'La plus grande ville des États-Unis, célèbre pour ses gratte-ciel et sa statue de la Liberté, offerte par la France.' },
    { id: 'losangeles', name: 'Los Angeles', p: [-118.2,34.05], lp: 'l', pays: 'États-Unis', cont: 'Amérique (du Nord)', pop: '12 millions', fact: 'Grande ville de Californie, au bord de l\'océan Pacifique, capitale mondiale du cinéma (Hollywood).' },
    { id: 'mexico', name: 'Mexico', p: [-99.1,19.4], lp: 'l', pays: 'Mexique', cont: 'Amérique (du Nord)', pop: '22 millions', fact: 'Capitale du Mexique, construite à plus de 2 200 m d\'altitude sur l\'ancienne capitale des Aztèques.' },
    { id: 'saopaulo', name: 'São Paulo', p: [-46.6,-23.5], lp: 'l', pays: 'Brésil', cont: 'Amérique (du Sud)', pop: '22 millions', fact: 'La plus grande ville d\'Amérique du Sud, centre économique du Brésil.' },
    { id: 'buenosaires', name: 'Buenos Aires', p: [-58.4,-34.6], lp: 'r', pays: 'Argentine', cont: 'Amérique (du Sud)', pop: '15 millions', fact: 'Capitale de l\'Argentine, sur le Río de la Plata. C\'est la ville du tango.' },
    { id: 'sydney', name: 'Sydney', p: [151.2,-33.9], lp: 'r', pays: 'Australie', cont: 'Océanie', pop: '5 millions', fact: 'La plus grande ville d\'Océanie, célèbre pour son opéra au bord de la baie. (La capitale de l\'Australie est Canberra.)' },
    // ── Villes ajoutées : Europe ──
    { id: 'londres', name: 'Londres', p: [-0.13,51.5], lp: 'l', pays: 'Royaume-Uni', cont: 'Europe', pop: '14 millions', fact: 'Capitale du Royaume-Uni, traversée par la Tamise. Elle est reliée à Paris par le tunnel sous la Manche.' },
    { id: 'madrid', name: 'Madrid', p: [-3.7,40.4], lp: 'b', pays: 'Espagne', cont: 'Europe', pop: '7 millions', fact: 'Capitale de l\'Espagne, située au centre du pays, sur un haut plateau.' },
    { id: 'rome', name: 'Rome', p: [12.5,41.9], lp: 'r', pays: 'Italie', cont: 'Europe', pop: '4 millions', fact: 'Capitale de l\'Italie, ancienne capitale de l\'Empire romain. Le Vatican, plus petit État du monde, se trouve en son cœur.' },
    { id: 'berlin', name: 'Berlin', p: [13.4,52.5], lp: 'r', pays: 'Allemagne', cont: 'Europe', pop: '6 millions', fact: 'Capitale de l\'Allemagne. Elle a été coupée en deux par un mur de 1961 à 1989.' },
    { id: 'istanbul', name: 'Istanbul', p: [29.0,41.0], lp: 'r', pays: 'Turquie', cont: 'Europe / Asie', pop: '16 millions', fact: 'Plus grande ville de Turquie, à cheval sur deux continents : le détroit du Bosphore sépare sa partie européenne de sa partie asiatique.' },
    // ── Villes ajoutées : Afrique ──
    { id: 'alger', name: 'Alger', p: [3.06,36.75], lp: 'r', pays: 'Algérie', cont: 'Afrique', pop: '4 millions', fact: 'Capitale de l\'Algérie, le plus grand pays d\'Afrique, au bord de la mer Méditerranée.' },
    { id: 'dakar', name: 'Dakar', p: [-17.45,14.7], lp: 'r', pays: 'Sénégal', cont: 'Afrique', pop: '4 millions', fact: 'Capitale du Sénégal, la ville la plus à l\'ouest du continent africain. On y parle français.' },
    { id: 'abidjan', name: 'Abidjan', p: [-4.0,5.35], lp: 'l', pays: 'Côte d\'Ivoire', cont: 'Afrique', pop: '6 millions', fact: 'Plus grande ville de Côte d\'Ivoire et grand port sur le golfe de Guinée. C\'est l\'une des plus grandes villes francophones du monde.' },
    { id: 'addisabeba', name: 'Addis-Abeba', p: [38.75,9.0], lp: 'r', pays: 'Éthiopie', cont: 'Afrique', pop: '5,5 millions', fact: 'Capitale de l\'Éthiopie, perchée à 2 350 m d\'altitude. L\'Union africaine y a son siège.' },
    { id: 'nairobi', name: 'Nairobi', p: [36.8,-1.3], lp: 'r', pays: 'Kenya', cont: 'Afrique', pop: '5,5 millions', fact: 'Capitale du Kenya, presque sur l\'équateur. Un parc national avec lions et girafes se trouve aux portes de la ville.' },
    { id: 'johannesburg', name: 'Johannesburg', p: [28.0,-26.2], lp: 'r', pays: 'Afrique du Sud', cont: 'Afrique', pop: '10 millions', fact: 'Plus grande ville d\'Afrique du Sud, née à la fin du XIXe siècle grâce à la découverte de mines d\'or.' },
    { id: 'lecap', name: 'Le Cap', p: [18.4,-33.9], lp: 'l', pays: 'Afrique du Sud', cont: 'Afrique', pop: '5 millions', fact: 'Ville portuaire tout au sud de l\'Afrique, dominée par la montagne de la Table. Le cap de Bonne-Espérance est tout proche.' },
    // ── Villes ajoutées : Asie ──
    { id: 'teheran', name: 'Téhéran', p: [51.4,35.7], lp: 'b', pays: 'Iran', cont: 'Asie', pop: '16 millions', fact: 'Capitale de l\'Iran, au pied des monts Elbourz, au sud de la mer Caspienne.' },
    { id: 'karachi', name: 'Karachi', p: [67.0,24.9], lp: 'l', pays: 'Pakistan', cont: 'Asie', pop: '18 millions', fact: 'Plus grande ville du Pakistan et son principal port, sur la mer d\'Arabie.' },
    { id: 'dacca', name: 'Dacca', p: [90.4,23.8], lp: 'r', pays: 'Bangladesh', cont: 'Asie', pop: '24 millions', fact: 'Capitale du Bangladesh, l\'une des villes les plus densément peuplées du monde, près du delta du Gange.' },
    { id: 'bangkok', name: 'Bangkok', p: [100.5,13.75], lp: 'l', pays: 'Thaïlande', cont: 'Asie', pop: '17 millions', fact: 'Capitale de la Thaïlande, connue pour ses temples bouddhistes et ses marchés flottants sur les canaux.' },
    { id: 'singapour', name: 'Singapour', p: [103.8,1.35], lp: 'r', pays: 'Singapour', cont: 'Asie', pop: '6 millions', fact: 'Une ville qui est aussi un pays (une cité-État), à la pointe de la péninsule malaise. C\'est l\'un des plus grands ports du monde.' },
    { id: 'jakarta', name: 'Jakarta', p: [106.8,-6.2], lp: 'b', pays: 'Indonésie', cont: 'Asie', pop: '35 millions', fact: 'Capitale de l\'Indonésie, sur l\'île de Java. C\'est l\'une des plus grandes agglomérations du monde.' },
    { id: 'manille', name: 'Manille', p: [121.0,14.6], lp: 'r', pays: 'Philippines', cont: 'Asie', pop: '24 millions', fact: 'Capitale des Philippines, un pays formé de plus de 7 000 îles.' },
    { id: 'seoul', name: 'Séoul', p: [127.0,37.55], lp: 'r', pays: 'Corée du Sud', cont: 'Asie', pop: '26 millions', fact: 'Capitale de la Corée du Sud. Près de la moitié des habitants du pays vivent dans son agglomération.' },
    // ── Villes ajoutées : Amérique ──
    { id: 'montreal', name: 'Montréal', p: [-73.6,45.5], lp: 'r', pays: 'Canada', cont: 'Amérique (du Nord)', pop: '4,3 millions', fact: 'Grande ville du Québec, sur une île du fleuve Saint-Laurent. C\'est la plus grande ville francophone d\'Amérique.' },
    { id: 'chicago', name: 'Chicago', p: [-87.6,41.9], lp: 'l', pays: 'États-Unis', cont: 'Amérique (du Nord)', pop: '9 millions', fact: 'Grande ville au bord du lac Michigan, l\'un des Grands Lacs. C\'est là qu\'ont été construits les premiers gratte-ciel.' },
    { id: 'washington', name: 'Washington', p: [-77.04,38.9], lp: 'l', pays: 'États-Unis', cont: 'Amérique (du Nord)', pop: '6 millions', fact: 'Capitale fédérale des États-Unis. Le président y habite, à la Maison-Blanche.' },
    { id: 'bogota', name: 'Bogota', p: [-74.1,4.7], lp: 'r', pays: 'Colombie', cont: 'Amérique (du Sud)', pop: '11 millions', fact: 'Capitale de la Colombie, construite à plus de 2 600 m d\'altitude dans la cordillère des Andes.' },
    { id: 'lima', name: 'Lima', p: [-77.0,-12.05], lp: 'l', pays: 'Pérou', cont: 'Amérique (du Sud)', pop: '11 millions', fact: 'Capitale du Pérou, au bord de l\'océan Pacifique. Il n\'y pleut presque jamais.' },
    { id: 'rio', name: 'Rio de Janeiro', p: [-43.2,-22.9], lp: 'r', pays: 'Brésil', cont: 'Amérique (du Sud)', pop: '13 millions', fact: 'Ville célèbre pour son carnaval, la plage de Copacabana et la statue du Christ rédempteur qui domine la baie.' },
    { id: 'santiago', name: 'Santiago', p: [-70.65,-33.45], lp: 'l', pays: 'Chili', cont: 'Amérique (du Sud)', pop: '7 millions', fact: 'Capitale du Chili, au pied des Andes. Le Chili est un pays très long et très étroit.' },
    // ── Villes ajoutées : Océanie ──
    { id: 'perth', name: 'Perth', p: [115.86,-31.95], lp: 'r', pays: 'Australie', cont: 'Océanie', pop: '2,2 millions', fact: 'Grande ville de la côte ouest de l\'Australie, l\'une des villes les plus isolées du monde.' },
    { id: 'melbourne', name: 'Melbourne', p: [144.96,-37.8], lp: 'l', pays: 'Australie', cont: 'Océanie', pop: '5 millions', fact: 'Deuxième ville d\'Australie, au sud-est du pays. Elle accueille chaque année un grand tournoi de tennis.' },
    { id: 'canberra', name: 'Canberra', p: [149.13,-35.3], lp: 'l', pays: 'Australie', cont: 'Océanie', pop: '470 000', fact: 'Capitale de l\'Australie, construite spécialement pour mettre fin à la rivalité entre Sydney et Melbourne.' },
    { id: 'auckland', name: 'Auckland', p: [174.76,-36.85], lp: 'b', pays: 'Nouvelle-Zélande', cont: 'Océanie', pop: '1,7 million', fact: 'Plus grande ville de Nouvelle-Zélande, construite sur d\'anciens volcans.' },
    { id: 'noumea', name: 'Nouméa', p: [166.45,-22.27], lp: 'r', pays: 'France (Nouvelle-Calédonie)', cont: 'Océanie', pop: '180 000', fact: 'Chef-lieu de la Nouvelle-Calédonie, territoire français du Pacifique. Son lagon, l\'un des plus grands du monde, est classé au patrimoine mondial.' }
];

// ── Lignes repères ────────────────────────────────────────────────────────
const GW_LINES = [
    { id: 'equateur', name: 'Équateur', lat: 0, color: '#d63b3b', dash: '', lbl: [-178,1.6], deg: '0°', fact: 'Ligne imaginaire qui fait le tour de la Terre à égale distance des deux pôles. Elle partage la Terre en deux hémisphères : nord et sud. Elle mesure environ 40 000 km. Près de l\'équateur, il fait chaud toute l\'année.' },
    { id: 'cancer', name: 'Tropique du Cancer', lat: 23.44, color: '#e08a2e', dash: '6 4', lbl: [-178,25.2], deg: '23° 26′ Nord', fact: 'Limite nord de la zone où le Soleil peut être exactement au-dessus de nos têtes à midi (le 21 juin). Il traverse le Sahara, l\'Inde et le Mexique.' },
    { id: 'capricorne', name: 'Tropique du Capricorne', lat: -23.44, color: '#e08a2e', dash: '6 4', lbl: [-178,-21.6], deg: '23° 26′ Sud', fact: 'Limite sud de la zone où le Soleil peut être exactement au-dessus de nos têtes à midi (le 21 décembre). Il traverse l\'Australie, l\'Afrique australe et le Brésil.' },
    { id: 'cerclearctique', name: 'Cercle polaire arctique', lat: 66.56, color: '#3b7fae', dash: '2 4', lbl: [-178,68.4], deg: '66° 34′ Nord', fact: 'Au nord de ce cercle, il y a au moins un jour par an où le Soleil ne se couche pas (en été) et un jour où il ne se lève pas (en hiver).' },
    { id: 'cercleantarctique', name: 'Cercle polaire antarctique', lat: -66.56, color: '#3b7fae', dash: '2 4', lbl: [-178,-64.8], deg: '66° 34′ Sud', fact: 'Au sud de ce cercle, il y a au moins un jour par an où le Soleil ne se couche pas et un jour où il ne se lève pas. Il entoure presque tout l\'Antarctique.' },
    { id: 'greenwich', name: 'Méridien de Greenwich', lon: 0, color: '#7c3aed', dash: '6 3 2 3', lbl: [1.5,-50], deg: '0° de longitude', fact: 'Méridien de référence qui passe par l\'observatoire de Greenwich, près de Londres. Il partage la Terre en hémisphère est et hémisphère ouest. Il traverse la France, de Villers-sur-Mer à Gavarnie.' }
];

const GW_LAYERS = {
    continents: { label: '🌍 Continents', kindName: 'Continent' },
    oceans:     { label: '🌊 Océans',     kindName: 'Océan' },
    fleuves:    { label: '〰 Fleuves',    kindName: 'Fleuve' },
    montagnes:  { label: '⛰ Montagnes',  kindName: 'Chaîne de montagnes' },
    deserts:    { label: '🏜 Déserts',    kindName: 'Désert' },
    villes:     { label: '🏙 Villes',     kindName: 'Grande ville' },
    reperes:    { label: '🧭 Repères',    kindName: 'Ligne repère' }
};
const GW_COLORS = { continents: '#374151', oceans: '#2f6f9e', fleuves: '#2b7bd0', montagnes: '#9a6a3a', deserts: '#b07a1e', villes: '#b91c1c', reperes: '#7c3aed' };

function _gwEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoMondeWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-monde';
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

    const container = document.createElement('div');
    container.className = 'gw-container';

    const initW = Math.round(window.innerWidth * 0.8);
    container.style.width = initW + 'px';
    let mapH = Math.max(280, Math.round((initW * 0.74 - 30) * GW_H / GW_W));

    // En-tête
    const header = document.createElement('div');
    header.className = 'gw-header';
    header.innerHTML = `
        <span class="gw-title">🗺 Géographie du monde</span>
        <span class="gw-badge">Vue d'ensemble</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.gw-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'gw-controls';
    controls.innerHTML = `
        <button class="gw-btn gw-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈 Masquer les noms</button>
        <button class="gw-btn gw-btn-reveal" style="display:none">👁 Tout révéler</button>
        <button class="gw-btn gw-btn-home" title="Revenir à la carte entière">🔍 Vue d'ensemble</button>
        <div class="gw-layers">
            <span class="gw-layers-lbl">Afficher :</span>
            ${Object.keys(GW_LAYERS).map(k => `<button class="gw-layer-btn${k === 'reperes' ? '' : ' active'}" data-layer="${k}">${GW_LAYERS[k].label}</button>`).join('')}
        </div>
    `;
    const hideBtn   = controls.querySelector('.gw-btn-hide');
    const revealBtn = controls.querySelector('.gw-btn-reveal');
    const homeBtn   = controls.querySelector('.gw-btn-home');
    container.appendChild(controls);

    // Corps : carte + fiche
    const body = document.createElement('div');
    body.className = 'gw-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'gw-map-wrap';
    mapWrap.style.background = '#ffffff';
    const side = document.createElement('div');
    side.className = 'gw-side';
    body.appendChild(mapWrap);
    body.appendChild(side);
    container.appendChild(body);

    // ── Construction de la carte SVG ──────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gw-map');
    svg.setAttribute('viewBox', `0 0 ${GW_W.toFixed(1)} ${GW_H.toFixed(1)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const uid = Math.random().toString(36).slice(2, 8);
    const sphere = _gwPath(_gwSphere(), true);
    svg.innerHTML = `
        <defs>
            <pattern id="gw-hatch-${uid}" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <rect width="4" height="4" fill="#b5834d" fill-opacity="0.45"></rect>
                <line x1="0" y1="0" x2="0" y2="4" stroke="#7a4b1c" stroke-width="1.2" stroke-opacity="0.45"></line>
            </pattern>
            <pattern id="gw-dots-${uid}" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#f2cf7a" fill-opacity="0.55"></rect>
                <circle cx="1" cy="1" r="0.55" fill="#b07a1e" fill-opacity="0.6"></circle>
                <circle cx="3" cy="3" r="0.55" fill="#b07a1e" fill-opacity="0.6"></circle>
            </pattern>
            <clipPath id="gw-clip-${uid}"><path d="${sphere}"></path></clipPath>
        </defs>
        <path class="gw-sphere" d="${sphere}"></path>
        <g clip-path="url(#gw-clip-${uid})">
            <g class="gw-g-grat"></g>
            <g class="gw-g-cont"></g>
            <g class="gw-g-water"></g>
            <g class="gw-L-deserts gw-g-deserts"></g>
            <g class="gw-L-montagnes gw-g-mountains"></g>
            <g class="gw-L-fleuves gw-g-rivers"></g>
            <g class="gw-L-reperes gw-g-lines"></g>
            <g class="gw-L-villes gw-g-cities"></g>
            <g class="gw-g-labels">
                <g class="gw-L-oceans"></g>
                <g class="gw-L-reperes"></g>
                <g class="gw-L-continents"></g>
                <g class="gw-L-deserts"></g>
                <g class="gw-L-montagnes"></g>
                <g class="gw-L-fleuves"></g>
                <g class="gw-L-villes"></g>
            </g>
        </g>
    `;
    mapWrap.appendChild(svg);

    const G = n => svg.querySelector('.gw-g-' + n);
    const gLabels = {};
    Object.keys(GW_LAYERS).forEach(k => { gLabels[k] = svg.querySelector('.gw-g-labels .gw-L-' + k); });

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    const items = {};     // id -> { id, layer, name, data, shapes:[], zoom }
    const labels = [];    // { el, ax, ay, dx, dy, size, lines, item, minZ }
    const scalables = []; // { el, r, sw }

    function addLabel(item, layer, cls, lonlat, size, dx, dy, anchor, lines, minZ) {
        const [ax, ay] = _gwP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'gw-lbl ' + cls + ' gw-item', 'text-anchor': anchor || 'middle', 'data-id': item.id }, gLabels[layer]);
        const lb = { el: t, ax, ay, dx: dx || 0, dy: dy || 0, size, lines: lines || [item.name], item, minZ: minZ || 0 };
        labels.push(lb);
        item.shapes.push(t);
        return lb;
    }

    // Graticule (tous les 30°)
    for (let lat = -60; lat <= 60; lat += 30) el('path', { class: 'gw-grat', d: _gwPath(_gwParallel(lat)) }, G('grat'));
    for (let lon = -150; lon <= 150; lon += 30) el('path', { class: 'gw-grat', d: _gwPath(_gwMeridian(lon)) }, G('grat'));

    // Continents
    GW_CONTINENTS.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'continents', name: c.name, data: c, shapes: [] };
        GW_SHAPES[c.id].forEach((pts, i) => {
            const p = el('path', { class: 'gw-cont gw-item', d: _gwPath(pts, true), 'data-id': c.id, fill: c.col, 'vector-effect': 'non-scaling-stroke' }, G('cont'));
            it.shapes.push(p);
            if (i === 0) it.mainShape = p;
        });
        addLabel(it, 'continents', 'gw-lbl-cont', c.lbl, 17, 0, 6, 'middle', c.lines || null);
        it.zoom = { bbox: true, min: 160 };
    });
    el('path', { class: 'gw-water', d: _gwPath(GW_CASPIAN, true) }, G('water'));

    // Océans
    GW_OCEANS.forEach(o => {
        const it = items[o.id] = { id: o.id, layer: 'oceans', name: o.name, data: o, shapes: [] };
        o.lbls.forEach(p => addLabel(it, 'oceans', 'gw-lbl-sea', p, 13, 0, 5, 'middle', o.lines));
        it.zoom = { none: true };
    });

    // Déserts
    GW_DESERTS.forEach(d => {
        const it = items[d.id] = { id: d.id, layer: 'deserts', name: d.name, data: d, shapes: [] };
        const p = el('path', { class: 'gw-desert gw-item', d: _gwPath(d.shape, true), 'data-id': d.id, fill: `url(#gw-dots-${uid})`, 'vector-effect': 'non-scaling-stroke' }, G('deserts'));
        it.shapes.push(p); it.mainShape = p;
        addLabel(it, 'deserts', 'gw-lbl-desert', d.lbl, 10, 0, 3, 'middle', d.lines || null, d.id === 'sahara' ? 0 : 1.4);
        it.zoom = { bbox: true, min: 150 };
    });

    // Montagnes
    GW_MOUNTAINS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'montagnes', name: m.name, data: m, shapes: [] };
        const p = el('path', { class: 'gw-massif gw-item', d: _gwPath(m.shape, true), 'data-id': m.id, fill: `url(#gw-hatch-${uid})`, 'vector-effect': 'non-scaling-stroke' }, G('mountains'));
        it.shapes.push(p); it.mainShape = p;
        addLabel(it, 'montagnes', 'gw-lbl-massif', m.lbl, 10, 0, 3, 'middle', null, 1.25);
        it.zoom = { bbox: true, min: 150 };
    });

    // Fleuves
    GW_RIVERS.forEach(r => {
        const it = items[r.id] = { id: r.id, layer: 'fleuves', name: r.name, data: r, shapes: [] };
        const d = _gwSmooth(r.path);
        it.shapes.push(el('path', { class: 'gw-river-hit gw-item', d, 'data-id': r.id }, G('rivers')));
        const line = el('path', { class: 'gw-river gw-item', d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, G('rivers'));
        it.shapes.push(line); it.mainShape = line;
        addLabel(it, 'fleuves', 'gw-lbl-river', r.lbl, 10, 0, 3, 'middle', null, 1.4);
        it.zoom = { bbox: true, min: 150 };
    });

    // Lignes repères
    GW_LINES.forEach(l => {
        const it = items[l.id] = { id: l.id, layer: 'reperes', name: l.name, data: l, shapes: [] };
        const pts = typeof l.lat === 'number' ? _gwParallel(l.lat) : _gwMeridian(l.lon);
        const d = _gwPath(pts);
        it.shapes.push(el('path', { class: 'gw-line-hit gw-item', d, 'data-id': l.id, 'vector-effect': 'non-scaling-stroke' }, G('lines')));
        const line = el('path', { class: 'gw-line gw-item', d, 'data-id': l.id, stroke: l.color, 'stroke-dasharray': l.dash, 'vector-effect': 'non-scaling-stroke' }, G('lines'));
        it.shapes.push(line);
        const lb = addLabel(it, 'reperes', 'gw-lbl-line', l.lbl, 9, typeof l.lat === 'number' ? 0 : 3, 0, 'start');
        lb.el.style.fill = l.color;
        // Le libellé suit le bord gauche de la carte pour les parallèles
        if (typeof l.lat === 'number') { lb.ax = _gwP(-180, l.lat)[0] + 4; lb.ay = _gwP(0, l.lat + 1.3)[1]; }
        it.zoom = { none: true };
    });

    // Villes
    GW_CITIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'villes', name: c.name, data: c, shapes: [] };
        const [x, y] = _gwP(c.p[0], c.p[1]);
        const dot = el('circle', { class: 'gw-city gw-item', cx: x, cy: y, r: 2.6, 'stroke-width': 0.9, 'data-id': c.id }, G('cities'));
        it.shapes.push(dot);
        scalables.push({ el: dot, r: 2.6, sw: 0.9 });
        const pos = { r: [5, 3, 'start'], l: [-5, 3, 'end'], b: [0, 12, 'middle'] }[c.lp] || [5, 3, 'start'];
        addLabel(it, 'villes', 'gw-lbl-city', c.p, 9, pos[0], pos[1], pos[2], null, 1.6);
        it.zoom = { p: c.p, w: 180 };
    });

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gw-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gw-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Géographie du monde</h4>
        <p>Le planisphère présente les <b>6 continents</b>, les <b>5 océans</b>, de grands
        <b>fleuves</b>, des <b>chaînes de montagnes</b>, des <b>déserts</b> et de
        <b>grandes villes</b>.</p>
        <p>👆 <b>Clique sur un élément</b> : la carte zoome dessus et sa fiche s'affiche à droite.
        Clique à nouveau dessus, ou sur <b>Vue d'ensemble</b>, pour revenir au planisphère entier.
        En zoomant, les noms des villes, fleuves et montagnes apparaissent.</p>
        <p>🧭 <b>Repères</b> : affiche l'équateur, les tropiques, les cercles polaires et le
        méridien de Greenwich.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms sont remplacés par « ? ». Clique sur un élément
        pour dévoiler son nom. Idéal pour faire réviser les élèves !</p>
        <p style="color:#888">Le tracé des côtes est simplifié et les frontières des pays ne sont
        pas représentées. Le nombre d'habitants des villes concerne toute l'agglomération : les
        estimations varient selon les sources.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gw-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    const layers = { continents: true, oceans: true, fleuves: true, montagnes: true, deserts: true, villes: true, reperes: false };
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let vb = { x: 0, y: 0, w: GW_W, h: GW_H };
    let animId = null;

    // ── Vue (viewBox) ─────────────────────────────────────────────────────
    function aspect() {
        const w = svg.clientWidth, h = svg.clientHeight;
        return (w && h) ? w / h : GW_W / GW_H;
    }
    function fullView() {
        const a = aspect();
        if (a > GW_W / GW_H) { const w = GW_H * a; return { x: (GW_W - w) / 2, y: 0, w, h: GW_H }; }
        const h = GW_W / a; return { x: 0, y: (GW_H - h) / 2, w: GW_W, h };
    }
    function fitRect(cx, cy, w, h) {
        const a = aspect();
        if (w / h < a) w = h * a; else h = w / a;
        const full = fullView();
        if (w >= full.w || h >= full.h) return full;
        let x = cx - w / 2, y = cy - h / 2;
        x = Math.max(full.x, Math.min(full.x + full.w - w, x));
        y = Math.max(full.y, Math.min(full.y + full.h - h, y));
        return { x, y, w, h };
    }
    function targetView() {
        const it = selected && items[selected];
        if (!it || it.zoom.none) return fullView();
        if (it.zoom.bbox) {
            const b = it.mainShape.getBBox();
            const pad = 0.15;
            const w = Math.max(it.zoom.min, b.width * (1 + pad * 2));
            const h = Math.max(it.zoom.min * 0.6, b.height * (1 + pad * 2));
            return fitRect(b.x + b.width / 2, b.y + b.height / 2, w, h);
        }
        const [cx, cy] = _gwP(it.zoom.p[0], it.zoom.p[1]);
        return fitRect(cx, cy, it.zoom.w, it.zoom.w * 0.6);
    }

    function setView(v) {
        vb = v;
        svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
        const zoom = fullView().w / v.w;
        const s = Math.min(1, Math.pow(1 / zoom, 0.75));
        scalables.forEach(o => {
            o.el.setAttribute('r', (o.r * s).toFixed(2));
            o.el.setAttribute('stroke-width', (o.sw * s).toFixed(2));
        });
        // Continent sélectionné : on affiche aussi les noms des éléments qui s'y trouvent
        const selIt = selected && items[selected];
        const selCont = selIt && selIt.layer === 'continents' ? selIt.name : null;
        labels.forEach(lb => {
            const own = selected && lb.item.id === selected;
            const inCont = !!(selCont && lb.item.data && typeof lb.item.data.cont === 'string'
                && lb.item.data.cont.includes(selCont));
            const far = zoom < lb.minZ && !own && !inCont;
            lb.el.classList.toggle('gw-far', far);
            if (far) return;
            lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
            lb.el.setAttribute('stroke-width', (2.5 * s).toFixed(2));
            const x = lb.ax + lb.dx * s, y = lb.ay + lb.dy * s;
            lb.el.setAttribute('x', x.toFixed(1));
            lb.el.setAttribute('y', y.toFixed(1));
            const tsp = lb.el.querySelectorAll('tspan');
            const n = tsp.length;
            tsp.forEach((t, i) => {
                t.setAttribute('x', x.toFixed(1));
                t.setAttribute('y', (y + (i - (n - 1) / 2) * lb.size * s * 1.1).toFixed(1));
            });
        });
    }

    function animateView(to) {
        if (animId) cancelAnimationFrame(animId);
        const from = { ...vb };
        const t0 = performance.now(), dur = 550;
        const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur), e = ease(k);
            setView({
                x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
                w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e
            });
            if (k < 1 && document.body.contains(widget)) animId = requestAnimationFrame(step);
            else animId = null;
        };
        animId = requestAnimationFrame(step);
    }

    // ── Noms (affichés / masqués) ─────────────────────────────────────────
    function applyLabels() {
        labels.forEach(lb => {
            const hidden = hideNames && !revealed.has(lb.item.id);
            lb.el.classList.toggle('gw-hidden', hidden);
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            (hidden ? ['?'] : lb.lines).forEach(line => {
                const t = document.createElementNS(NS, 'tspan');
                t.textContent = line;
                lb.el.appendChild(t);
            });
        });
        setView(vb);
    }

    // ── Sélection ─────────────────────────────────────────────────────────
    function applySelection() {
        svg.classList.toggle('gw-has-sel', !!selected);
        Object.values(items).forEach(it => {
            it.shapes.forEach(s => s.classList.toggle('gw-sel', it.id === selected));
        });
        const it = selected && items[selected];
        badge.textContent = it ? (it.zoom.none ? it.name : 'Zoom : ' + it.name) : 'Vue d\'ensemble';
        renderSide();
    }

    function select(id, animate) {
        selected = id;
        applySelection();
        setView(vb);
        const to = targetView();
        if (animate === false) setView(to); else animateView(to);
    }

    function onItemClick(id) {
        const it = items[id];
        if (!it || !layers[it.layer]) return;
        if (hideNames && !revealed.has(id)) {
            revealed.add(id);
            applyLabels();
            saveBoard();
            return;
        }
        select(selected === id ? null : id);
        saveBoard();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    function row(lbl, val) { return `<li><b>${lbl} :</b> ${_gwEsc(val)}</li>`; }

    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it) {
            side.style.borderLeftColor = '#9ca3af';
            const sw = {
                continents: 'background:linear-gradient(90deg,#f4c28f 0 33%,#f3e08a 33% 66%,#f2a9a0 66%)',
                oceans:     'background:#cfe6f3;border:1px solid #9cc3dc',
                fleuves:    'background:#2b7bd0;height:4px',
                montagnes:  'background:repeating-linear-gradient(45deg,#b5834d 0 3px,#e6cfae 3px 6px)',
                deserts:    'background:radial-gradient(#b07a1e 1px,#f6dc9c 1.5px) 0 0/5px 5px',
                villes:     'background:#d63b3b;border-radius:50%;width:12px;height:12px;margin:0 5px',
                reperes:    'background:repeating-linear-gradient(90deg,#d63b3b 0 6px,transparent 6px 9px);height:3px'
            };
            const n = { continents: GW_CONTINENTS.length, oceans: GW_OCEANS.length, fleuves: GW_RIVERS.length, montagnes: GW_MOUNTAINS.length, deserts: GW_DESERTS.length, villes: GW_CITIES.length, reperes: GW_LINES.length };
            const names = { continents: 'continents', oceans: 'océans', fleuves: 'grands fleuves', montagnes: 'chaînes de montagnes', deserts: 'déserts', villes: 'grandes villes', reperes: 'lignes repères' };
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">La Terre</h4>
                <div class="gw-hint">Clique sur un élément du planisphère pour zoomer dessus et découvrir sa fiche.</div>
                ${Object.keys(names).map(k => `
                    <div class="gw-legend-row" style="opacity:${layers[k] ? 1 : .35}">
                        <span class="gw-sw" style="${sw[k]}"></span>
                        <span><b>${n[k]}</b> ${names[k]}</span>
                    </div>`).join('')}
                <p style="margin-top:10px;color:#6b7280">Les océans recouvrent <b>71 %</b> de la surface de la Terre.
                Environ <b>8,2 milliards</b> d'êtres humains y vivent.</p>
            `;
            return;
        }
        const d = it.data;
        const color = GW_COLORS[it.layer];
        side.style.borderLeftColor = it.layer === 'continents' ? d.col : (it.layer === 'reperes' ? d.color : color);
        let html = `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${it.layer === 'reperes' ? d.color : color}">${_gwEsc(it.name)}</h4>`;
        html += `<div class="gw-kind">${GW_LAYERS[it.layer].kindName}</div>`;
        if (it.layer === 'continents') {
            html += '<ul>' + row('Superficie', d.sup) + row('Habitants', 'environ ' + d.pop) + row('Nombre de pays', d.pays)
                + (d.grand !== '—' ? row('Plus grand pays', d.grand) : '') + row('Plus haut sommet', d.sommet) + '</ul>';
        } else if (it.layer === 'oceans') {
            html += '<ul>' + row('Superficie', d.sup) + row('Profondeur maximale', d.prof) + '</ul>';
        } else if (it.layer === 'fleuves') {
            html += '<ul>' + row('Longueur', d.longueur) + row('Continent', d.cont) + row('Source', d.source) + row('Se jette dans', d.mer) + '</ul>';
        } else if (it.layer === 'montagnes') {
            html += '<ul>' + row('Continent', d.cont) + row('Plus haut sommet', d.sommet) + '</ul>';
        } else if (it.layer === 'deserts') {
            html += '<ul>' + row('Continent', d.cont) + row('Superficie', d.sup) + row('Type', d.type) + '</ul>';
        } else if (it.layer === 'villes') {
            html += '<ul>' + row('Pays', d.pays) + row('Continent', d.cont) + row('Habitants (agglomération)', 'environ ' + d.pop) + '</ul>';
        } else if (it.layer === 'reperes') {
            html += '<ul>' + row(typeof d.lat === 'number' ? 'Latitude' : 'Longitude', d.deg) + '</ul>';
        }
        html += `<p>${_gwEsc(d.fact)}</p>`;
        html += `<button class="gw-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        const back = side.querySelector('.gw-back-btn');
        back.addEventListener('mousedown', (e) => e.stopPropagation());
        back.addEventListener('click', (e) => { e.stopPropagation(); select(null); saveBoard(); });
    }

    // ── Calques ───────────────────────────────────────────────────────────
    function applyLayers() {
        Object.keys(layers).forEach(k => svg.classList.toggle('gw-off-' + k, !layers[k]));
        controls.querySelectorAll('.gw-layer-btn').forEach(b => b.classList.toggle('active', !!layers[b.dataset.layer]));
        if (selected && !layers[items[selected].layer]) select(null);
        else renderSide();
    }

    function setHideNames(v) {
        hideNames = !!v;
        hideBtn.classList.toggle('on', hideNames);
        hideBtn.textContent = hideNames ? '🙉 Afficher les noms' : '🙈 Masquer les noms';
        revealBtn.style.display = hideNames ? '' : 'none';
        applyLabels();
    }

    // ── Événements ────────────────────────────────────────────────────────
    svg.addEventListener('mousedown', (e) => {
        if (e.target.closest && e.target.closest('.gw-item')) e.stopPropagation();
    });
    svg.addEventListener('click', (e) => {
        const t = e.target.closest ? e.target.closest('[data-id]') : null;
        if (!t) return;
        e.stopPropagation();
        onItemClick(t.getAttribute('data-id'));
    });
    hideBtn.addEventListener('click', () => {
        revealed = new Set();
        if (!hideNames && selected) select(null);
        setHideNames(!hideNames);
        saveBoard();
    });
    revealBtn.addEventListener('click', () => {
        Object.keys(items).forEach(id => revealed.add(id));
        applyLabels();
        saveBoard();
    });
    homeBtn.addEventListener('click', () => { select(null); saveBoard(); });
    controls.querySelectorAll('.gw-layer-btn').forEach(b => {
        b.addEventListener('click', () => {
            layers[b.dataset.layer] = !layers[b.dataset.layer];
            applyLayers();
            saveBoard();
        });
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    function applySize() { mapWrap.style.height = mapH + 'px'; }

    // Resize 2D (largeur du widget + hauteur de la carte)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = mapH;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(560, startW + ev.clientX - startX) + 'px';
            mapH = Math.max(220, startH + ev.clientY - startY);
            applySize();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = mapH;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(560, startW + t.clientX - startX) + 'px';
            mapH = Math.max(220, startH + t.clientY - startY);
            applySize();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Recalcul de la vue quand la taille de la carte change
    let _lastSize = '';
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            const sz = svg.clientWidth + 'x' + svg.clientHeight;
            if (sz !== _lastSize && svg.clientWidth) {
                _lastSize = sz;
                if (animId) { cancelAnimationFrame(animId); animId = null; }
                setView(targetView());
                renderSide();
            }
        });
        ro.observe(mapWrap);
        ro.observe(side);
    }

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🗺 Géographie du monde', {
            onExpand: () => requestAnimationFrame(() => { setView(targetView()); renderSide(); })
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = mapH;
            container.classList.add('wf-fullboard');
            mapH = Math.max(mapH, window.innerHeight - 130);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) mapH = _savedH;
        }
        applySize();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    applySize();
    applyLabels();
    applyLayers();
    applySelection();
    requestAnimationFrame(() => { setView(targetView()); renderSide(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._gwGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        mapH:       _isMax && _savedH ? _savedH : mapH,
        layers:     { ...layers },
        hideNames,
        revealed:   Array.from(revealed),
        selected
    });
    widget._gwSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.mapH) mapH = Math.max(220, d.mapH);
        applySize();
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(id => items[id]));
        selected = (d.selected && items[d.selected]) ? d.selected : null;
        setHideNames(!!d.hideNames);
        applyLayers();
        applySelection();
        requestAnimationFrame(() => { setView(targetView()); renderSide(); });
    };

    saveBoard();
    return widget;
}
