// =========================================================================
// WIDGET GÉOGRAPHIE DE L'EUROPE — Le Bureau du Prof
// Carte d'Europe interactive : pays et capitales, Union européenne,
// grands fleuves, chaînes de montagnes, mers et océans.
// Clic sur un élément : zoom sur l'élément + fiche d'information.
// Options : carte de l'Union européenne, calques, masquer les noms.
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
        .widget[data-type="geo-europe"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ge-container {
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
        .ge-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .ge-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .ge-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e8eefc;
            color: #2f4f9e;
        }

        /* Réduit / plein écran */
        .ge-container.wf-minimized > *:not(.ge-header) { display: none !important; }
        .ge-container.wf-minimized { gap: 0; }
        .ge-container.wf-fullboard {
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
        .ge-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .ge-btn {
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
        .ge-btn:hover { background: #e0e0e0; }
        .ge-btn:active { transform: scale(0.96); }
        .ge-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .ge-btn.on:hover { background: #357abd; }
        .ge-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .ge-btn-reveal:hover { background: #218838; }
        .ge-layers { display: flex; gap: 4px; margin-left: auto; align-items: center; flex-wrap: wrap; }
        .ge-layers-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .ge-layer-btn {
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
        .ge-layer-btn:hover { background: #e0e0e0; }
        .ge-layer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Corps : carte + fiche */
        .ge-body { display: flex; gap: 10px; align-items: stretch; }
        .ge-map-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border: 1px solid #c9dbe6;
            border-radius: 10px;
            overflow: hidden;
            background: #cfe6f3;
        }
        .ge-map { display: block; width: 100%; height: 100%; touch-action: none; }
        .ge-side {
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
        .ge-side h4 { margin: 0 0 2px; font-weight: 900; }
        .ge-side .ge-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .ge-side p { margin: 0 0 6px; }
        .ge-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .ge-side li { margin-bottom: 4px; }
        .ge-side .ge-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .ge-side .ge-sw { width: 22px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .ge-side .ge-hint { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .ge-back-btn {
            margin-top: 6px;
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .ge-back-btn:hover { background: #f0f0f0; }

        /* Éléments de la carte */
        .ge-map text { font-family: 'Segoe UI', system-ui, sans-serif; paint-order: stroke; stroke-linejoin: round; }
        .ge-item { cursor: pointer; transition: opacity .25s; }
        .ge-has-sel .ge-item:not(.ge-sel) { opacity: .3; }
        .ge-country { stroke: #ffffff; stroke-width: 0.9; stroke-linejoin: round; transition: fill .3s, opacity .25s; }
        .ge-country:hover { filter: brightness(0.94); }
        .ge-country.ge-sel { stroke: #374151; stroke-width: 1.8; }
        .ge-other { fill: #ebece6; stroke: #ffffff; stroke-width: 1; }
        .ge-massif { stroke: #9a6a3a; stroke-width: 0.8; stroke-opacity: .55; }
        .ge-massif:hover, .ge-massif.ge-sel { stroke-width: 2.5; stroke-opacity: 1; }
        .ge-river { fill: none; stroke: #2b7bd0; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
        .ge-river.ge-sel { stroke-width: 5; }
        .ge-river-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
        .ge-river-hit:hover + .ge-river { stroke-width: 4; }
        .ge-water { fill: #cfe6f3; stroke: none; pointer-events: none; }
        .ge-capital { fill: #ffffff; stroke: #b91c1c; }
        .ge-capital.ge-sel { fill: #b91c1c; }
        .ge-lbl-cap     { fill: #7f1d1d; font-weight: 700; stroke: #ffffff; stroke-width: 3; }
        .ge-lbl-river   { fill: #1d5fa8; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .ge-lbl-massif  { fill: #7a4b1c; font-weight: 800; font-style: italic; stroke: #fdf6e1; stroke-width: 4; }
        .ge-lbl-country { fill: #1f2937; font-weight: 800; stroke: rgba(255,255,255,0.75); stroke-width: 3; }
        .ge-lbl-sea     { fill: #3b7fae; font-weight: 600; font-style: italic; stroke: #cfe6f3; stroke-width: 3; letter-spacing: 1px; }
        .ge-lbl.ge-hidden { fill: #d63384; font-style: normal; }

        /* Calques désactivés */
        .ge-off-capitales .ge-L-capitales,
        .ge-off-fleuves .ge-L-fleuves,
        .ge-off-montagnes .ge-L-montagnes,
        .ge-off-mers .ge-L-mers,
        .ge-off-pays .ge-L-pays { display: none; }
        .ge-lbl.ge-far { display: none; }

        /* Aide */
        .ge-help-btn {
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
        .ge-help-btn:hover { background: #e0e0e0; color: #333; }
        .ge-help-popup {
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
        .ge-help-popup.show { display: block; }
        .ge-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .ge-help-popup p { margin: 0 0 6px; }
        .ge-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .ge-resize-handle {
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
        .ge-container:hover .ge-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Projection azimutale équivalente de Lambert (centrée sur l'Europe) ────
const GE_LON0 = 15 * Math.PI / 180, GE_LAT0 = 52 * Math.PI / 180, GE_K = 1300;
function _geRaw(lon, lat) {
    const l = lon * Math.PI / 180 - GE_LON0, p = lat * Math.PI / 180;
    const k = Math.sqrt(2 / (1 + Math.sin(GE_LAT0) * Math.sin(p) + Math.cos(GE_LAT0) * Math.cos(p) * Math.cos(l)));
    return [GE_K * k * Math.cos(p) * Math.sin(l), -GE_K * k * (Math.cos(GE_LAT0) * Math.sin(p) - Math.sin(GE_LAT0) * Math.cos(p) * Math.cos(l))];
}
// Cadre de la carte (de l'Islande à l'Oural, du Cap Nord à la Crète)
const GE_X0 = Math.min(_geRaw(-25.5, 64.5)[0], _geRaw(-10.6, 37.5)[0], _geRaw(-10.6, 43.5)[0]);
const GE_X1 = Math.max(_geRaw(62.5, 58)[0], _geRaw(54.5, 41)[0]);
const GE_Y0 = Math.min(_geRaw(30, 71.9)[1], _geRaw(-10, 66.5)[1], _geRaw(44, 72.4)[1]);
const GE_Y1 = Math.max(_geRaw(20, 34.2)[1], _geRaw(-10, 36)[1]);
const GE_W = GE_X1 - GE_X0, GE_H = GE_Y1 - GE_Y0;
function _geP(lon, lat) { const r = _geRaw(lon, lat); return [r[0] - GE_X0, r[1] - GE_Y0]; }
function _gePath(pts, closed) {
    return pts.map((p, i) => {
        const [x, y] = _geP(p[0], p[1]);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + (closed ? ' Z' : '');
}
function _geSmooth(pts) {
    const P = pts.map(p => _geP(p[0], p[1]));
    let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ' C' + c1.map(v => v.toFixed(1)).join(' ') + ' ' + c2.map(v => v.toFixed(1)).join(' ') + ' ' + p2.map(v => v.toFixed(1)).join(' ');
    }
    return d;
}
const _geR = a => a.slice().reverse();
const _geJ = (...parts) => [].concat(...parts);

// ── Frontières terrestres (tracé simplifié, partagé entre voisins) ────────
const GB = {
    PT_ES: [[-8.87,41.87],[-8.2,42.1],[-7.2,41.95],[-6.6,41.95],[-6.2,41.6],[-6.9,41.0],[-6.85,40.3],[-7.05,39.7],[-7.3,39.45],[-7.0,39.0],[-7.2,38.75],[-7.0,38.2],[-7.5,37.6],[-7.4,37.18]],
    ES_FR: [[-1.78,43.37],[-1.4,43.05],[-0.7,42.85],[0.0,42.7],[0.7,42.85],[1.45,42.6],[1.75,42.55],[2.5,42.35],[3.17,42.43]],
    FR_BE: [[2.55,51.09],[2.9,50.7],[3.3,50.5],[3.7,50.33],[4.2,50.27],[4.15,50.0],[4.43,49.95],[4.82,50.15],[4.87,49.8],[5.43,49.6],[5.82,49.55]],
    FR_LU: [[5.82,49.55],[6.37,49.47]],
    FR_DE: [[6.37,49.47],[6.73,49.17],[7.45,49.17],[8.2,48.97],[7.8,48.4],[7.55,47.75],[7.59,47.58]],
    FR_CH: [[7.59,47.58],[7.0,47.48],[6.45,46.98],[6.1,46.6],[5.97,46.2],[6.8,46.39],[7.05,45.92],[6.86,45.83]],
    FR_IT: [[6.86,45.83],[7.13,45.45],[6.65,45.1],[6.9,44.65],[7.0,44.25],[7.7,44.06],[7.53,43.78]],
    BE_NL: [[3.37,51.37],[4.25,51.37],[5.0,51.45],[5.85,51.15],[5.75,51.0],[5.68,50.76],[6.02,50.76]],
    BE_DE: [[6.02,50.76],[6.4,50.32],[6.1,50.15]],
    BE_LU: [[6.1,50.15],[5.8,49.95],[5.9,49.75],[5.82,49.55]],
    LU_DE: [[6.37,49.47],[6.52,49.75],[6.1,50.15]],
    NL_DE: [[6.02,50.76],[6.1,51.1],[6.2,51.4],[5.95,51.8],[6.8,51.95],[7.05,52.4],[7.0,52.65],[7.2,53.25]],
    DE_DK: [[8.65,54.9],[9.4,54.83],[9.9,54.8]],
    DE_PL: [[14.25,53.92],[14.4,53.3],[14.15,52.85],[14.6,52.55],[14.7,52.1],[14.75,51.6],[15.0,51.1],[14.82,50.87]],
    DE_CZ: [[14.82,50.87],[14.3,51.05],[13.5,50.65],[12.95,50.4],[12.1,50.3],[12.5,49.95],[12.55,49.6],[13.4,49.0],[13.82,48.77]],
    DE_AT: [[13.82,48.77],[13.45,48.55],[12.75,48.1],[13.0,47.55],[12.75,47.68],[12.2,47.6],[11.4,47.45],[10.45,47.55],[9.95,47.55],[9.55,47.53]],
    DE_CH: [[9.55,47.53],[9.0,47.68],[8.6,47.8],[8.2,47.6],[7.59,47.58]],
    CH_AT: [[9.55,47.53],[9.6,47.05],[10.1,46.85],[10.47,46.87]],
    CH_IT: [[10.47,46.87],[10.45,46.55],[10.1,46.25],[9.3,46.4],[9.05,45.83],[8.6,46.1],[8.4,46.45],[7.9,45.95],[7.05,45.92],[6.86,45.83]],
    AT_IT: [[10.47,46.87],[11.0,46.77],[12.2,47.08],[12.7,46.65],[13.7,46.52]],
    AT_SI: [[13.7,46.52],[14.6,46.42],[15.6,46.68],[16.1,46.87]],
    AT_HU: [[16.1,46.87],[16.5,47.0],[16.45,47.4],[16.9,47.7],[17.16,48.01]],
    AT_SK: [[17.16,48.01],[16.95,48.62]],
    AT_CZ: [[16.95,48.62],[16.0,48.75],[15.0,49.0],[14.7,48.6],[13.82,48.77]],
    CZ_PL: [[14.82,50.87],[15.5,50.8],[16.3,50.65],[16.4,50.3],[16.9,50.45],[17.7,50.2],[18.3,49.9],[18.85,49.52]],
    CZ_SK: [[18.85,49.52],[18.1,49.0],[17.4,48.8],[16.95,48.62]],
    PL_SK: [[18.85,49.52],[19.5,49.4],[20.3,49.4],[21.5,49.42],[22.55,49.08]],
    SK_HU: [[17.16,48.01],[17.8,47.75],[18.8,47.8],[18.9,48.05],[20.0,48.2],[20.9,48.55],[22.15,48.4]],
    SK_UA: [[22.15,48.4],[22.55,49.08]],
    PL_UA: [[22.55,49.08],[22.9,49.6],[23.6,50.4],[24.1,50.85],[23.6,51.53]],
    PL_BY: [[23.6,51.53],[23.6,52.1],[23.2,52.3],[23.9,53.0],[23.5,53.95]],
    PL_LT: [[23.5,53.95],[22.79,54.36]],
    PL_RK: [[22.79,54.36],[21.0,54.35],[19.6,54.45]],
    LT_RK: [[21.25,55.25],[22.0,55.05],[22.8,54.9],[22.79,54.36]],
    LT_BY: [[23.5,53.95],[24.4,53.9],[25.7,54.25],[25.8,54.8],[26.6,55.67]],
    LT_LV: [[21.05,56.07],[22.0,56.4],[24.0,56.3],[25.2,56.15],[26.6,55.67]],
    LV_BY: [[26.6,55.67],[27.6,55.8],[28.17,56.15]],
    LV_RU: [[28.17,56.15],[27.75,57.0],[27.55,57.53]],
    LV_EE: [[24.3,57.87],[25.3,58.0],[26.5,57.55],[27.55,57.53]],
    EE_RU: [[27.55,57.53],[27.7,57.9],[27.5,58.9],[28.0,59.47]],
    BY_RU: [[28.17,56.15],[30.9,55.6],[30.8,54.8],[31.8,54.0],[32.7,53.35],[31.6,52.75],[31.78,52.1]],
    BY_UA: [[23.6,51.53],[24.5,51.9],[25.8,51.9],[27.3,51.6],[28.5,51.55],[30.6,51.3],[31.78,52.1]],
    UA_RU: [[31.78,52.1],[33.8,52.35],[34.4,51.75],[35.4,51.05],[36.2,50.4],[37.6,50.3],[38.2,50.05],[39.7,49.8],[40.1,49.25],[39.7,48.6],[39.9,47.85],[38.25,47.1]],
    UA_MD: [[26.62,48.26],[27.6,48.45],[28.4,48.12],[29.2,47.9],[29.4,47.3],[30.1,46.45],[29.7,46.37],[28.95,46.0],[28.7,45.5],[28.2,45.47]],
    RO_MD: [[26.62,48.26],[27.3,47.65],[28.1,46.95],[28.2,46.2],[28.2,45.47]],
    RO_UAN: [[22.88,47.95],[23.5,47.98],[24.6,47.95],[25.2,47.9],[26.62,48.26]],
    RO_UAS: [[28.2,45.47],[28.9,45.3],[29.67,45.21]],
    HU_UA: [[22.15,48.4],[22.88,47.95]],
    HU_RO: [[22.88,47.95],[22.0,47.4],[21.2,46.4],[20.26,46.11]],
    HU_RS: [[20.26,46.11],[19.6,46.17],[18.85,45.92]],
    HU_HR: [[18.85,45.92],[17.6,45.95],[16.6,46.48]],
    HU_SI: [[16.6,46.48],[16.1,46.87]],
    SI_HR: [[16.6,46.48],[15.65,46.2],[15.35,45.75],[14.6,45.5],[13.6,45.48]],
    SI_IT: [[13.7,46.52],[13.4,46.3],[13.65,45.98],[13.72,45.6]],
    HR_BAN: [[19.0,44.87],[18.0,45.1],[17.0,45.25],[16.5,45.2],[15.75,45.2],[15.8,44.7],[16.2,44.2],[17.0,43.6],[17.55,42.95]],
    HR_BAS: [[17.65,42.9],[18.0,42.8],[18.45,42.55],[18.52,42.42]],
    HR_RS: [[18.85,45.92],[19.4,45.2],[19.0,44.87]],
    BA_RS: [[19.0,44.87],[19.3,44.4],[19.6,44.0],[19.25,43.55]],
    BA_ME: [[19.25,43.55],[18.7,43.25],[18.55,42.65],[18.52,42.42]],
    RS_ME: [[19.25,43.55],[19.6,43.2],[20.35,42.9]],
    ME_XK: [[20.35,42.9],[20.1,42.65],[20.07,42.55]],
    ME_AL: [[20.07,42.55],[19.75,42.6],[19.6,42.3],[19.37,41.85]],
    RS_XK: [[20.35,42.9],[20.8,43.27],[21.6,42.95],[21.75,42.7],[21.58,42.25]],
    XK_MK: [[21.58,42.25],[20.9,42.1],[20.59,41.88]],
    XK_AL: [[20.59,41.88],[20.5,42.2],[20.07,42.55]],
    RS_MK: [[21.58,42.25],[22.36,42.32]],
    RS_BG: [[22.36,42.32],[22.6,42.9],[23.0,43.2],[22.5,43.65],[22.68,44.22]],
    RS_RO: [[22.68,44.22],[22.45,44.7],[21.4,44.8],[21.5,45.2],[20.8,45.5],[20.26,46.11]],
    RO_BG: [[22.68,44.22],[23.0,43.85],[24.5,43.7],[25.5,43.65],[26.5,44.05],[27.3,44.12],[28.0,43.92],[28.58,43.74]],
    MK_AL: [[20.59,41.88],[20.5,41.35],[20.75,40.9],[20.98,40.86]],
    MK_GR: [[20.98,40.86],[21.9,41.1],[22.75,41.15],[22.93,41.34]],
    MK_BG: [[22.93,41.34],[23.0,41.75],[22.36,42.32]],
    AL_GR: [[20.98,40.86],[20.65,40.1],[20.01,39.69]],
    GR_BG: [[22.93,41.34],[24.0,41.5],[25.3,41.25],[26.33,41.71]],
    GR_TR: [[26.33,41.71],[26.6,41.35],[26.04,40.73]],
    BG_TR: [[26.33,41.71],[27.2,42.05],[28.0,41.98]],
    NO_SE: [[11.43,58.9],[12.0,59.9],[12.5,60.0],[12.35,61.0],[12.1,61.7],[12.2,62.3],[12.05,63.0],[12.65,63.6],[13.95,64.0],[14.1,64.5],[13.65,65.1],[14.5,66.1],[15.4,66.6],[16.1,67.5],[17.0,68.0],[18.1,68.5],[19.95,68.35],[20.55,69.06]],
    SE_FI: [[20.55,69.06],[22.4,68.45],[23.5,67.95],[23.6,67.3],[23.8,66.5],[24.15,65.8]],
    NO_FI: [[20.55,69.06],[21.3,69.3],[22.3,68.95],[24.9,68.6],[25.8,69.0],[26.0,69.7],[27.0,69.9],[28.2,69.75],[28.93,69.05]],
    NO_RU: [[28.93,69.05],[29.2,69.4],[30.15,69.65],[30.85,69.78]],
    FI_RU: [[28.93,69.05],[28.4,68.55],[28.8,68.1],[30.0,67.7],[29.0,66.95],[29.9,66.1],[29.5,65.6],[30.1,65.0],[29.6,64.2],[30.5,63.5],[31.55,62.9],[29.75,61.5],[28.4,60.85],[27.8,60.53]],
    NI_IE: [[-7.25,55.05],[-7.5,54.95],[-7.9,54.7],[-7.6,54.45],[-8.15,54.45],[-7.6,54.15],[-7.0,54.3],[-6.6,54.05],[-6.2,54.0]],
    RU_CAUC: [[40.0,43.4],[41.4,43.35],[42.5,43.15],[43.5,42.85],[44.9,42.75],[45.7,42.5],[46.6,41.8],[47.8,41.2],[48.6,41.85]],
    RU_KZ: [[49.2,46.3],[48.9,46.4],[48.0,47.0],[47.0,47.5],[46.5,48.5],[47.3,49.2],[48.8,50.0],[50.5,51.2],[53.0,51.5],[55.0,50.8],[57.0,51.0],[59.5,50.5],[61.4,50.8],[75.0,50.8]],
    RU_CASP: [[48.6,41.85],[48.2,42.0],[47.5,42.98],[47.5,43.5],[47.0,44.4],[47.5,45.0],[47.8,45.6],[48.5,45.9],[49.2,46.3]],
    TR_EAST: [[41.55,41.52],[42.5,41.45],[43.4,41.1],[43.6,40.5],[44.8,39.7],[44.4,38.3],[44.3,37.3],[42.3,37.1],[40.0,36.8],[38.0,36.85],[36.6,36.8],[36.15,35.82]]
};

// ── Côtes ─────────────────────────────────────────────────────────────────
const GC = {
    PT: [[-8.87,41.87],[-8.75,41.3],[-8.67,41.15],[-8.8,40.6],[-8.9,40.15],[-9.1,39.6],[-9.42,39.35],[-9.5,38.78],[-9.15,38.68],[-9.2,38.42],[-8.8,38.45],[-8.8,37.9],[-8.95,37.0],[-8.6,37.1],[-7.9,37.0],[-7.4,37.18]],
    ES_N: [[-8.87,41.87],[-8.9,42.1],[-9.0,42.6],[-9.3,42.9],[-9.2,43.2],[-8.4,43.38],[-7.7,43.75],[-7.0,43.55],[-5.85,43.63],[-4.5,43.42],[-3.8,43.47],[-3.0,43.38],[-2.0,43.32],[-1.78,43.37]],
    ES_S: [[3.17,42.43],[3.3,42.25],[3.1,41.95],[2.8,41.7],[2.17,41.38],[1.2,41.08],[0.9,40.8],[0.55,40.55],[-0.05,39.98],[-0.33,39.45],[-0.2,39.0],[0.2,38.75],[-0.48,38.35],[-0.75,37.9],[-1.0,37.58],[-1.65,37.35],[-2.1,36.73],[-2.8,36.72],[-3.5,36.72],[-4.4,36.72],[-5.0,36.45],[-5.35,36.15],[-5.6,36.02],[-6.0,36.3],[-6.3,36.55],[-6.4,36.8],[-6.95,37.2],[-7.4,37.18]],
    FR_MED: [[7.53,43.78],[7.27,43.68],[7.0,43.54],[6.65,43.3],[6.2,43.08],[5.95,43.1],[5.37,43.25],[5.0,43.4],[4.6,43.4],[4.1,43.55],[3.7,43.4],[3.25,43.25],[3.05,42.95],[3.05,42.6],[3.17,42.43]],
    FR_ATL: [[-1.78,43.37],[-1.5,43.53],[-1.3,44.0],[-1.2,44.6],[-1.25,44.66],[-1.15,45.5],[-1.06,45.57],[-1.2,45.85],[-1.15,46.16],[-1.8,46.5],[-2.1,46.85],[-2.15,47.1],[-2.5,47.3],[-3.0,47.55],[-3.4,47.7],[-4.37,47.8],[-4.73,48.04],[-4.5,48.2],[-4.78,48.35],[-4.6,48.6],[-4.0,48.72],[-3.5,48.83],[-3.0,48.78],[-2.76,48.55],[-2.3,48.65],[-1.6,48.62],[-1.55,48.75],[-1.6,49.2],[-1.95,49.72],[-1.25,49.7],[-1.1,49.35],[-0.5,49.33],[0.1,49.45],[0.2,49.7],[1.0,49.92],[1.5,50.15],[1.6,50.9],[1.85,50.96],[2.55,51.09]],
    BE: [[2.55,51.09],[3.37,51.37]],
    NL: [[3.37,51.37],[3.6,51.6],[4.0,51.95],[4.5,52.4],[4.6,52.9],[4.75,53.0],[5.1,53.3],[5.5,53.4],[6.2,53.45],[6.9,53.45],[7.2,53.25]],
    DE_N: [[7.2,53.25],[7.05,53.6],[7.8,53.75],[8.2,53.55],[8.5,53.6],[8.9,53.85],[8.9,54.05],[8.6,54.3],[8.9,54.45],[8.65,54.9]],
    DE_B: [[9.9,54.8],[10.15,54.35],[10.9,54.35],[11.0,53.95],[11.6,54.1],[12.1,54.18],[12.5,54.45],[13.1,54.45],[13.4,54.65],[13.7,54.4],[13.8,54.1],[14.25,53.92]],
    DK: [[8.65,54.9],[8.45,55.47],[8.1,55.55],[8.15,56.0],[8.1,56.6],[8.6,57.1],[9.5,57.15],[9.95,57.6],[10.6,57.75],[10.5,57.25],[10.35,56.95],[10.3,56.55],[10.9,56.45],[10.25,56.15],[10.0,55.75],[9.75,55.55],[9.6,55.2],[9.9,54.8]],
    PL: [[14.25,53.92],[15.5,54.15],[16.5,54.55],[17.5,54.8],[18.4,54.8],[18.6,54.45],[19.6,54.45]],
    RK: [[19.6,54.45],[19.95,54.95],[20.6,54.95],[21.25,55.25]],
    LT: [[21.25,55.25],[21.1,55.7],[21.05,56.07]],
    LV: [[24.3,57.87],[24.4,57.3],[24.1,57.0],[23.4,57.0],[23.1,57.2],[22.6,57.75],[21.7,57.55],[21.55,57.4],[21.05,56.85],[21.0,56.5],[21.05,56.07]],
    EE: [[28.0,59.47],[27.0,59.45],[26.0,59.6],[24.75,59.45],[23.5,59.25],[23.5,58.95],[23.6,58.5],[24.5,58.35],[24.3,57.87]],
    RU_FIN: [[28.0,59.47],[28.9,59.8],[29.9,59.9],[30.25,59.95],[29.7,60.15],[28.7,60.7],[27.8,60.53]],
    FI: [[24.15,65.8],[25.4,65.0],[24.8,64.6],[23.9,64.1],[23.1,63.85],[22.2,63.3],[21.6,63.1],[21.35,62.4],[21.5,61.5],[21.3,60.6],[22.0,60.3],[22.95,59.82],[24.0,60.05],[24.95,60.15],[26.0,60.4],[26.9,60.45],[27.8,60.53]],
    SE: [[11.43,58.9],[11.2,58.4],[11.8,57.7],[12.1,57.2],[12.55,56.65],[12.85,56.25],[12.6,56.0],[12.95,55.6],[13.4,55.35],[14.2,55.4],[14.35,55.55],[14.6,56.05],[15.6,56.15],[16.35,56.65],[16.6,57.4],[16.75,57.9],[16.8,58.6],[18.0,59.0],[18.8,59.45],[18.9,59.9],[18.3,60.3],[17.3,60.6],[17.4,61.5],[17.4,62.3],[18.1,62.8],[19.0,63.3],[20.3,63.8],[21.2,64.4],[21.4,64.75],[22.0,65.45],[22.15,65.6],[23.3,65.8],[24.15,65.8]],
    NO: [[30.85,69.78],[31.1,70.3],[29.8,70.5],[28.5,70.85],[27.5,71.05],[25.8,71.15],[23.7,70.7],[22.0,70.3],[20.5,70.1],[18.9,69.85],[17.5,69.3],[16.2,68.85],[15.5,68.3],[14.4,67.3],[13.2,66.9],[12.6,66.1],[12.2,65.5],[11.4,64.9],[10.8,64.5],[9.8,63.8],[9.0,63.6],[8.0,63.3],[7.2,62.9],[6.0,62.45],[5.2,62.1],[5.0,61.6],[4.95,61.0],[5.0,60.4],[5.1,60.0],[5.25,59.3],[5.6,58.85],[6.0,58.3],[7.0,58.0],[8.0,58.15],[8.4,58.25],[9.5,58.9],[10.2,59.05],[10.6,59.5],[10.75,59.9],[10.9,59.2],[11.43,58.9]],
    RU_N: [[30.85,69.78],[31.8,69.75],[33.0,69.4],[35.0,69.2],[37.0,68.7],[39.0,68.1],[40.5,67.75],[41.2,67.0],[41.0,66.3],[39.5,66.1],[37.0,66.25],[34.8,66.5],[32.4,67.1],[33.0,66.6],[34.8,65.9],[34.8,64.5],[36.5,64.2],[38.0,63.9],[39.8,64.6],[40.5,64.55],[40.0,65.2],[41.5,66.2],[43.0,66.4],[44.2,66.1],[44.0,67.2],[43.5,68.6],[46.0,67.7],[49.0,67.9],[53.5,68.2],[54.0,68.8],[57.0,68.6],[59.0,68.4],[60.5,69.0],[61.0,69.8],[64.0,69.3],[66.0,69.5],[75.0,69.5]],
    RU_BLACK: [[40.0,43.4],[39.7,43.6],[38.7,44.3],[37.8,44.7],[37.3,45.1],[36.7,45.25],[37.6,45.6],[38.0,46.1],[38.4,46.6],[38.25,47.1]],
    UA: [[38.25,47.1],[37.55,47.1],[36.8,46.75],[35.9,46.6],[35.1,45.95],[35.5,45.45],[36.6,45.4],[36.45,45.05],[35.4,45.05],[34.4,44.75],[34.15,44.5],[33.4,44.55],[33.6,45.15],[33.35,45.2],[32.5,45.4],[33.6,45.95],[33.7,46.1],[32.6,46.1],[31.8,46.3],[30.75,46.45],[30.2,45.85],[29.7,45.6],[29.67,45.21]],
    RO: [[28.58,43.74],[28.65,44.2],[28.95,44.7],[29.65,45.0],[29.67,45.21]],
    BG: [[28.0,41.98],[27.7,42.4],[27.5,42.5],[27.9,42.7],[27.9,43.2],[28.58,43.74]],
    GR: [[26.04,40.73],[25.85,40.85],[25.0,40.95],[24.4,40.93],[23.9,40.75],[23.35,40.25],[22.95,40.6],[22.6,40.3],[22.65,39.9],[22.95,39.35],[23.3,39.15],[22.9,38.85],[23.6,38.5],[24.0,38.15],[24.05,37.65],[23.65,37.95],[22.95,37.95],[23.15,37.6],[23.2,37.3],[23.05,36.45],[22.5,36.4],[22.48,36.38],[22.15,36.9],[21.7,36.8],[21.6,37.4],[21.3,37.65],[21.1,37.85],[21.6,38.15],[21.15,38.3],[20.75,38.95],[20.25,39.35],[20.15,39.6],[20.01,39.69]],
    AL: [[19.37,41.85],[19.45,41.5],[19.45,41.32],[19.4,40.85],[19.45,40.45],[19.85,40.05],[20.01,39.69]],
    ME: [[18.52,42.42],[18.75,42.3],[19.1,42.1],[19.37,41.85]],
    HR_S: [[18.52,42.42],[18.3,42.5],[18.1,42.65],[17.8,42.85],[17.65,42.9]],
    HR: [[17.55,42.95],[17.0,43.25],[16.45,43.5],[15.9,43.7],[15.2,44.1],[14.9,44.6],[14.45,45.33],[14.2,45.05],[13.9,44.8],[13.6,45.1],[13.6,45.48]],
    IT: [[7.53,43.78],[8.0,43.88],[8.45,44.3],[8.93,44.41],[9.5,44.2],[9.85,44.05],[10.2,43.9],[10.3,43.55],[10.5,43.0],[11.1,42.45],[11.6,42.25],[12.25,41.75],[12.9,41.4],[13.6,41.25],[14.25,40.83],[14.4,40.6],[14.95,40.6],[15.2,40.25],[15.6,40.05],[15.8,39.6],[16.05,39.0],[15.85,38.6],[15.65,38.25],[15.65,37.95],[16.05,37.92],[16.6,38.4],[17.15,38.95],[17.1,39.4],[16.55,39.7],[16.6,40.1],[17.25,40.45],[17.98,40.05],[18.4,39.8],[18.5,40.15],[18.0,40.65],[16.87,41.13],[16.0,41.45],[16.2,41.9],[15.15,41.95],[14.5,42.25],[13.85,42.9],[13.6,43.5],[12.6,44.05],[12.3,44.5],[12.5,44.95],[12.35,45.43],[12.9,45.6],[13.3,45.75],[13.72,45.6]],
    TR: [[28.0,41.98],[28.6,41.35],[29.1,41.25],[30.5,41.2],[31.4,41.3],[32.5,41.85],[34.0,42.0],[35.1,42.05],[36.0,41.7],[36.3,41.3],[37.5,41.05],[39.7,41.0],[40.6,41.3],[41.55,41.52]],
    TR_S: [[36.15,35.82],[36.2,36.6],[35.6,36.6],[35.0,36.7],[34.6,36.8],[33.9,36.25],[32.8,36.05],[32.0,36.5],[30.7,36.85],[30.4,36.25],[29.7,36.15],[29.1,36.6],[28.2,36.75],[27.4,37.0],[27.2,37.5],[26.4,38.3],[27.1,38.4],[26.75,38.7],[26.8,39.3],[26.1,39.5],[26.15,39.95],[26.4,40.2],[26.04,40.73]],
    LEVANT: [[36.15,35.82],[35.75,35.5],[35.95,34.65],[35.8,34.45],[35.5,33.9],[35.1,33.1],[34.9,32.4],[34.5,31.5],[34.2,31.3]],
    GEO: [[41.55,41.52],[41.6,41.6],[41.6,42.3],[40.0,43.4]]
};

// ── Îles et terres non européennes ────────────────────────────────────────
const GE_ISLANDS = {
    GB: [[-5.7,50.05],[-5.2,49.96],[-4.2,50.35],[-3.5,50.4],[-3.0,50.7],[-2.0,50.6],[-1.3,50.78],[0.25,50.75],[1.0,51.0],[1.4,51.2],[1.4,51.38],[0.7,51.45],[0.95,51.6],[1.3,51.9],[1.75,52.5],[1.65,52.75],[1.0,52.95],[0.35,52.95],[0.15,53.5],[-0.1,53.65],[-0.4,54.1],[-0.6,54.5],[-1.2,54.65],[-1.5,55.0],[-1.7,55.6],[-2.4,55.95],[-2.6,56.1],[-2.8,56.35],[-2.5,56.6],[-2.05,57.15],[-1.8,57.5],[-2.3,57.7],[-3.0,57.68],[-4.2,57.5],[-3.8,57.85],[-3.05,58.65],[-4.0,58.6],[-5.0,58.62],[-5.3,58.2],[-5.6,57.6],[-5.8,57.3],[-5.7,56.8],[-5.6,56.35],[-5.6,55.3],[-4.85,55.85],[-4.65,55.5],[-5.0,54.85],[-4.85,54.65],[-4.4,54.7],[-3.6,54.9],[-3.4,54.6],[-3.0,54.2],[-3.05,53.75],[-3.1,53.4],[-4.0,53.3],[-4.6,53.3],[-4.7,52.8],[-4.1,52.6],[-4.3,52.3],[-4.6,52.1],[-5.3,51.85],[-5.0,51.6],[-4.2,51.62],[-3.2,51.45],[-2.7,51.5],[-3.0,51.2],[-4.2,51.1],[-5.0,50.55]],
    NI: _geJ([[-6.2,54.0],[-5.45,54.35],[-5.6,54.6],[-5.75,54.85],[-6.05,55.2],[-6.5,55.25],[-7.0,55.2]], GB.NI_IE),
    IE: _geJ([[-7.25,55.05],[-7.4,55.38],[-8.0,55.2],[-8.5,54.95],[-8.65,54.6],[-8.55,54.3],[-9.2,54.25],[-9.95,54.2],[-9.95,53.85],[-10.1,53.5],[-9.6,53.25],[-9.4,52.9],[-9.9,52.55],[-10.4,52.15],[-10.1,51.6],[-9.5,51.5],[-8.5,51.65],[-8.3,51.8],[-7.6,51.95],[-6.95,52.1],[-6.35,52.2],[-6.15,53.0],[-6.05,53.35],[-6.25,53.7]], _geR(GB.NI_IE)),
    IS: [[-22.0,63.85],[-21.0,63.85],[-18.0,63.4],[-16.5,63.8],[-15.0,64.25],[-13.6,65.1],[-14.6,65.7],[-14.5,66.35],[-16.0,66.5],[-17.5,66.05],[-19.0,66.1],[-20.4,66.1],[-21.5,65.6],[-22.4,66.4],[-23.5,66.2],[-24.3,65.6],[-22.0,65.0],[-24.0,64.85],[-21.9,64.15],[-22.7,63.85]],
    CORSE: [[9.4,43.0],[9.53,42.4],[9.4,42.0],[9.2,41.38],[8.85,41.55],[8.62,41.9],[8.7,42.57],[9.3,42.95]],
    SARDAIGNE: [[8.15,40.6],[8.25,41.05],[9.2,41.25],[9.65,40.95],[9.75,40.4],[9.65,39.95],[9.6,39.2],[9.1,39.2],[8.6,38.9],[8.4,39.1],[8.45,39.7],[8.5,40.25]],
    SICILE: [[12.4,37.8],[12.5,38.0],[13.35,38.2],[14.0,38.03],[15.55,38.25],[15.1,37.5],[15.3,37.05],[15.1,36.65],[14.25,37.06],[13.5,37.3],[12.6,37.6]],
    MALTE: [[14.3,36.02],[14.6,35.86],[14.5,35.8],[14.3,35.92]],
    CRETE: [[23.5,35.3],[24.3,35.35],[25.1,35.35],[26.3,35.3],[26.15,35.0],[24.75,34.95],[23.55,35.25]],
    CHYPRE: [[32.3,35.1],[33.0,35.35],[34.55,35.65],[33.9,35.1],[34.05,34.98],[33.0,34.6],[32.4,34.75]],
    MAJORQUE: [[2.37,39.55],[2.7,39.95],[3.2,39.95],[3.45,39.7],[3.05,39.27],[2.75,39.5]],
    SJAELLAND: [[10.95,55.7],[11.4,55.95],[12.0,56.1],[12.6,56.05],[12.55,55.6],[12.2,55.25],[11.9,55.0],[11.2,55.2]],
    FIONIE: [[9.75,55.45],[10.3,55.6],[10.75,55.3],[10.6,55.05],[10.0,55.1]],
    GOTLAND: [[18.15,57.1],[18.4,57.3],[18.8,57.8],[18.7,57.95],[18.2,57.55]],
    SAAREMAA: [[21.85,58.45],[22.8,58.6],[23.3,58.45],[22.5,58.2],[22.0,57.95]],
    NZEMLE: [[51.5,71.3],[53.0,70.8],[56.0,70.6],[57.5,70.75],[56.0,71.6],[55.5,73.5],[52.0,73.5]]
};
const GE_OTHER = {
    afrique: [[-12,27],[-9.8,30.4],[-9.7,32.3],[-8.5,33.3],[-7.6,33.6],[-6.8,34.05],[-6.2,35.2],[-5.9,35.8],[-5.4,35.9],[-5.0,35.3],[-3.9,35.25],[-2.9,35.3],[-2.2,35.1],[-1.2,35.3],[-0.6,35.7],[0.5,36.0],[1.5,36.5],[3.05,36.75],[4.5,36.9],[5.5,36.7],[6.6,37.0],[7.8,36.95],[8.6,36.95],[9.5,37.3],[10.3,36.9],[11.0,37.05],[10.5,36.4],[11.1,35.2],[10.75,34.7],[10.1,34.3],[10.1,33.9],[11.2,33.2],[12.5,32.8],[13.2,32.9],[15.2,32.3],[15.4,31.6],[16.6,31.2],[18.5,30.5],[20.05,32.1],[21.5,32.9],[23.0,32.6],[24.0,32.05],[25.2,31.6],[27.2,31.3],[29.9,31.2],[31.0,31.6],[32.3,31.25],[34.2,31.3],[36,27],[-12,27]],
    asie: _geJ(GB.RU_CAUC, GB.RU_CASP, GB.RU_KZ.slice(1), [[75,50.8],[75,27],[36,27]], _geR(GC.LEVANT), _geR(GB.TR_EAST), GC.GEO.slice(1))
};

// ── Pays d'Europe ─────────────────────────────────────────────────────────
// ue : année d'entrée dans l'Union européenne (0 = non membre)
// st : statut particulier ; col : couleur de la carte politique ; sz : taille du nom
const GE_COUNTRIES = [
    { id: 'PT', name: 'Portugal', cap: 'Lisbonne', cp: [-9.14,38.72], lbl: [-8.0,39.7], sz: 15, col: 'B', ue: 1986, pop: '10,5 millions', lang: 'portugais', mon: 'euro',
      shape: _geJ(GC.PT, _geR(GB.PT_ES)) },
    { id: 'ES', name: 'Espagne', cap: 'Madrid', cp: [-3.7,40.42], lbl: [-4.0,39.3], sz: 22, col: 'A', ue: 1986, pop: '48 millions', lang: 'espagnol (et catalan, basque, galicien)', mon: 'euro',
      shape: _geJ(GC.ES_N, GB.ES_FR, GC.ES_S, _geR(GB.PT_ES)), extra: ['MAJORQUE'] },
    { id: 'FR', name: 'France', cap: 'Paris', cp: [2.35,48.86], lbl: [2.4,46.9], sz: 22, col: 'D', ue: 1957, pop: '68 millions', lang: 'français', mon: 'euro',
      fact: 'Pays fondateur de l\'Union européenne. C\'est le plus grand pays de l\'Union européenne par sa superficie.',
      shape: _geJ(GB.FR_BE, GB.FR_LU, GB.FR_DE, GB.FR_CH, GB.FR_IT, GC.FR_MED, _geR(GB.ES_FR), GC.FR_ATL), extra: ['CORSE'] },
    { id: 'BE', name: 'Belgique', cap: 'Bruxelles', cp: [4.35,50.85], lbl: [4.6,50.55], sz: 11, col: 'F', ue: 1957, pop: '11,8 millions', lang: 'néerlandais, français et allemand', mon: 'euro',
      fact: 'Pays fondateur. Bruxelles accueille les principales institutions de l\'Union européenne.',
      shape: _geJ(GC.BE, GB.BE_NL, GB.BE_DE, GB.BE_LU, _geR(GB.FR_BE)) },
    { id: 'NL', name: 'Pays-Bas', cap: 'Amsterdam', cp: [4.9,52.37], lbl: [5.7,52.55], sz: 11, col: 'C', ue: 1957, pop: '18 millions', lang: 'néerlandais', mon: 'euro',
      fact: 'Pays fondateur. Une grande partie du pays est située sous le niveau de la mer, protégée par des digues.',
      shape: _geJ(GC.NL, _geR(GB.NL_DE), _geR(GB.BE_NL)) },
    { id: 'LU', name: 'Luxembourg', cap: 'Luxembourg', cp: [6.13,49.61], lbl: [6.1,49.95], sz: 8, col: 'C', ue: 1957, pop: '670 000', lang: 'luxembourgeois, français et allemand', mon: 'euro', small: true,
      fact: 'Pays fondateur et l\'un des plus petits pays de l\'Union européenne.',
      shape: _geJ(GB.FR_LU, GB.LU_DE, GB.BE_LU) },
    { id: 'DE', name: 'Allemagne', cap: 'Berlin', cp: [13.4,52.52], lbl: [10.3,51.2], sz: 20, col: 'B', ue: 1957, pop: '84 millions', lang: 'allemand', mon: 'euro',
      fact: 'Pays fondateur. C\'est le pays le plus peuplé de l\'Union européenne.',
      shape: _geJ(GC.DE_N, GB.DE_DK, GC.DE_B, GB.DE_PL, GB.DE_CZ, GB.DE_AT, GB.DE_CH, _geR(GB.FR_DE), GB.LU_DE, _geR(GB.BE_DE), GB.NL_DE) },
    { id: 'DK', name: 'Danemark', cap: 'Copenhague', cp: [12.57,55.68], lbl: [9.2,56.25], sz: 11, col: 'A', ue: 1973, pop: '6 millions', lang: 'danois', mon: 'couronne danoise',
      shape: _geJ(GC.DK, _geR(GB.DE_DK)), extra: ['SJAELLAND', 'FIONIE'] },
    { id: 'CH', name: 'Suisse', cap: 'Berne', cp: [7.45,46.95], lbl: [8.2,46.75], sz: 10, col: 'C', ue: 0, pop: '9 millions', lang: 'allemand, français, italien et romanche', mon: 'franc suisse',
      fact: 'Elle ne fait pas partie de l\'Union européenne mais a signé de nombreux accords avec elle.',
      shape: _geJ(GB.FR_CH, _geR(GB.CH_IT), _geR(GB.CH_AT), GB.DE_CH) },
    { id: 'AT', name: 'Autriche', cap: 'Vienne', cp: [16.37,48.21], lbl: [13.6,47.45], sz: 11, col: 'E', ue: 1995, pop: '9,1 millions', lang: 'allemand', mon: 'euro',
      shape: _geJ(GB.DE_AT, GB.CH_AT, GB.AT_IT, GB.AT_SI, GB.AT_HU, GB.AT_SK, GB.AT_CZ) },
    { id: 'IT', name: 'Italie', cap: 'Rome', cp: [12.5,41.9], lbl: [12.6,42.9], sz: 18, col: 'A', ue: 1957, pop: '59 millions', lang: 'italien', mon: 'euro',
      fact: 'Pays fondateur : le traité de Rome, qui a créé l\'ancêtre de l\'Union européenne, y a été signé en 1957.',
      shape: _geJ(GB.FR_IT, GC.IT, _geR(GB.SI_IT), _geR(GB.AT_IT), GB.CH_IT), extra: ['SICILE', 'SARDAIGNE'] },
    { id: 'GB', name: 'Royaume-Uni', cap: 'Londres', cp: [-0.13,51.5], lbl: [-1.8,52.6], sz: 16, col: 'C', ue: 0, st: 'brexit', pop: '68 millions', lang: 'anglais', mon: 'livre sterling',
      fact: 'Membre de l\'Union européenne de 1973 à 2020, il l\'a quittée : c\'est le « Brexit ». Il est relié à la France par le tunnel sous la Manche.',
      shape: GE_ISLANDS.GB, extra: ['NI'] },
    { id: 'IE', name: 'Irlande', cap: 'Dublin', cp: [-6.26,53.35], lbl: [-8.0,53.25], sz: 12, col: 'B', ue: 1973, pop: '5,3 millions', lang: 'irlandais et anglais', mon: 'euro',
      shape: GE_ISLANDS.IE },
    { id: 'IS', name: 'Islande', cap: 'Reykjavik', cp: [-21.9,64.15], lbl: [-18.6,64.9], sz: 13, col: 'A', ue: 0, pop: '390 000', lang: 'islandais', mon: 'couronne islandaise',
      fact: 'Île volcanique au climat froid, avec de nombreux geysers et glaciers.',
      shape: GE_ISLANDS.IS },
    { id: 'NO', name: 'Norvège', cap: 'Oslo', cp: [10.75,59.91], lbl: [8.6,61.6], sz: 15, col: 'C', ue: 0, pop: '5,6 millions', lang: 'norvégien', mon: 'couronne norvégienne',
      fact: 'Ses côtes sont découpées par de profonds fjords. Les Norvégiens ont refusé deux fois d\'entrer dans l\'Union européenne.',
      shape: _geJ(GC.NO, _geR(GB.NO_RU), _geR(GB.NO_FI), _geR(GB.NO_SE)) },
    { id: 'SE', name: 'Suède', cap: 'Stockholm', cp: [18.07,59.33], lbl: [15.2,62.6], sz: 16, col: 'F', ue: 1995, pop: '10,6 millions', lang: 'suédois', mon: 'couronne suédoise',
      shape: _geJ(GC.SE, _geR(GB.SE_FI), _geR(GB.NO_SE)), extra: ['GOTLAND'] },
    { id: 'FI', name: 'Finlande', cap: 'Helsinki', cp: [24.94,60.17], lbl: [26.0,63.4], sz: 15, col: 'D', ue: 1995, pop: '5,6 millions', lang: 'finnois et suédois', mon: 'euro',
      fact: 'Surnommée le « pays des mille lacs » : elle en compte en réalité près de 190 000 !',
      shape: _geJ(GC.FI, _geR(GB.FI_RU), _geR(GB.NO_FI), GB.SE_FI) },
    { id: 'EE', name: 'Estonie', cap: 'Tallinn', cp: [24.75,59.44], lbl: [26.0,58.75], sz: 9, col: 'A', ue: 2004, pop: '1,4 million', lang: 'estonien', mon: 'euro',
      shape: _geJ(GC.EE, GB.LV_EE, GB.EE_RU), extra: ['SAAREMAA'] },
    { id: 'LV', name: 'Lettonie', cap: 'Riga', cp: [24.1,56.95], lbl: [26.0,56.8], sz: 9, col: 'F', ue: 2004, pop: '1,9 million', lang: 'letton', mon: 'euro',
      shape: _geJ(GC.LV, GB.LT_LV, GB.LV_BY, GB.LV_RU, _geR(GB.LV_EE)) },
    { id: 'LT', name: 'Lituanie', cap: 'Vilnius', cp: [25.28,54.69], lbl: [23.9,55.35], sz: 9, col: 'B', ue: 2004, pop: '2,9 millions', lang: 'lituanien', mon: 'euro',
      shape: _geJ(GC.LT, GB.LT_RK, _geR(GB.PL_LT), GB.LT_BY, _geR(GB.LT_LV)) },
    { id: 'PL', name: 'Pologne', cap: 'Varsovie', cp: [21.01,52.23], lbl: [19.2,52.0], sz: 16, col: 'D', ue: 2004, pop: '37 millions', lang: 'polonais', mon: 'złoty',
      shape: _geJ(GC.PL, _geR(GB.PL_RK), _geR(GB.PL_LT), _geR(GB.PL_BY), _geR(GB.PL_UA), _geR(GB.PL_SK), _geR(GB.CZ_PL), _geR(GB.DE_PL)) },
    { id: 'CZ', name: 'Tchéquie', cap: 'Prague', cp: [14.42,50.08], lbl: [15.4,49.65], sz: 10, col: 'F', ue: 2004, pop: '10,9 millions', lang: 'tchèque', mon: 'couronne tchèque',
      shape: _geJ(GB.CZ_PL, GB.CZ_SK, GB.AT_CZ, _geR(GB.DE_CZ)) },
    { id: 'SK', name: 'Slovaquie', cap: 'Bratislava', cp: [17.11,48.15], lbl: [19.6,48.75], sz: 9, col: 'A', ue: 2004, pop: '5,4 millions', lang: 'slovaque', mon: 'euro',
      shape: _geJ(GB.PL_SK, _geR(GB.SK_UA), _geR(GB.SK_HU), GB.AT_SK, _geR(GB.CZ_SK)) },
    { id: 'HU', name: 'Hongrie', cap: 'Budapest', cp: [19.04,47.5], lbl: [19.4,46.95], sz: 11, col: 'C', ue: 2004, pop: '9,6 millions', lang: 'hongrois', mon: 'forint',
      shape: _geJ(GB.SK_HU, GB.HU_UA, GB.HU_RO, GB.HU_RS, GB.HU_HR, GB.HU_SI, GB.AT_HU) },
    { id: 'SI', name: 'Slovénie', cap: 'Ljubljana', cp: [14.51,46.06], lbl: [14.9,46.3], sz: 7, col: 'F', ue: 2004, pop: '2,1 millions', lang: 'slovène', mon: 'euro', small: true,
      shape: _geJ(GB.AT_SI, _geR(GB.HU_SI), GB.SI_HR, [[13.72,45.6]], _geR(GB.SI_IT)) },
    { id: 'HR', name: 'Croatie', cap: 'Zagreb', cp: [15.98,45.81], lbl: [16.5,45.55], sz: 9, col: 'D', ue: 2013, pop: '3,9 millions', lang: 'croate', mon: 'euro',
      shape: _geJ(_geR(GB.HU_HR), GB.HR_RS, GB.HR_BAN, GC.HR, _geR(GB.SI_HR)), extraShapes: [_geJ(GB.HR_BAS, GC.HR_S)] },
    { id: 'BA', name: 'Bosnie-Herzégovine', short: 'Bosnie', cap: 'Sarajevo', cp: [18.41,43.86], lbl: [17.8,44.25], sz: 7, col: 'B', ue: 0, st: 'candidat', pop: '3,2 millions', lang: 'bosnien, croate et serbe', mon: 'mark convertible',
      shape: _geJ(GB.BA_RS, GB.BA_ME, _geR(GB.HR_BAS), _geR(GB.HR_BAN)) },
    { id: 'RS', name: 'Serbie', cap: 'Belgrade', cp: [20.46,44.82], lbl: [20.9,43.95], sz: 9, col: 'A', ue: 0, st: 'candidat', pop: '6,6 millions', lang: 'serbe', mon: 'dinar serbe',
      shape: _geJ(GB.HU_RS, GB.HR_RS, GB.BA_RS, GB.RS_ME, GB.RS_XK, GB.RS_MK, GB.RS_BG, GB.RS_RO) },
    { id: 'ME', name: 'Monténégro', cap: 'Podgorica', cp: [19.26,42.44], lbl: [19.3,42.95], sz: 6, col: 'F', ue: 0, st: 'candidat', pop: '620 000', lang: 'monténégrin', mon: 'euro (sans être membre de l\'UE)', small: true,
      shape: _geJ(GB.BA_ME, GC.ME, _geR(GB.ME_AL), _geR(GB.ME_XK), _geR(GB.RS_ME)) },
    { id: 'XK', name: 'Kosovo', cap: 'Pristina', cp: [21.17,42.67], lbl: [20.9,42.5], sz: 6, col: 'D', ue: 0, pop: '1,6 million', lang: 'albanais et serbe', mon: 'euro (sans être membre de l\'UE)', small: true,
      fact: 'Il a proclamé son indépendance en 2008. La France le reconnaît comme un pays, mais la Serbie et plusieurs autres pays ne le reconnaissent pas.',
      shape: _geJ(GB.RS_XK, GB.XK_MK, GB.XK_AL, _geR(GB.ME_XK)) },
    { id: 'MK', name: 'Macédoine du Nord', short: 'Macédoine', cap: 'Skopje', cp: [21.43,42.0], lbl: [21.6,41.6], sz: 6, col: 'E', ue: 0, st: 'candidat', pop: '1,8 million', lang: 'macédonien et albanais', mon: 'denar', small: true,
      shape: _geJ(GB.RS_MK, _geR(GB.MK_BG), _geR(GB.MK_GR), _geR(GB.MK_AL), _geR(GB.XK_MK)) },
    { id: 'AL', name: 'Albanie', cap: 'Tirana', cp: [19.82,41.33], lbl: [20.1,40.75], sz: 7, col: 'C', ue: 0, st: 'candidat', pop: '2,4 millions', lang: 'albanais', mon: 'lek',
      shape: _geJ(GC.AL, _geR(GB.AL_GR), _geR(GB.MK_AL), GB.XK_AL, GB.ME_AL) },
    { id: 'GR', name: 'Grèce', cap: 'Athènes', cp: [23.73,37.98], lbl: [22.0,39.3], sz: 13, col: 'D', ue: 1981, pop: '10,4 millions', lang: 'grec', mon: 'euro',
      fact: 'Berceau de la démocratie et des Jeux olympiques dans l\'Antiquité. Elle compte des milliers d\'îles.',
      shape: _geJ(_geR(GB.AL_GR), GB.MK_GR, GB.GR_BG, GB.GR_TR, GC.GR), extra: ['CRETE'] },
    { id: 'BG', name: 'Bulgarie', cap: 'Sofia', cp: [23.32,42.7], lbl: [25.3,42.75], sz: 11, col: 'C', ue: 2007, pop: '6,4 millions', lang: 'bulgare', mon: 'euro (depuis 2026)',
      shape: _geJ(_geR(GB.MK_BG), GB.GR_BG, GB.BG_TR, GC.BG, _geR(GB.RO_BG), _geR(GB.RS_BG)) },
    { id: 'RO', name: 'Roumanie', cap: 'Bucarest', cp: [26.1,44.43], lbl: [24.6,46.0], sz: 14, col: 'B', ue: 2007, pop: '19 millions', lang: 'roumain', mon: 'leu',
      shape: _geJ(GB.RO_BG, GC.RO, _geR(GB.RO_UAS), _geR(GB.RO_MD), _geR(GB.RO_UAN), GB.HU_RO, _geR(GB.RS_RO)) },
    { id: 'MD', name: 'Moldavie', cap: 'Chișinău', cp: [28.86,47.01], lbl: [28.6,47.45], sz: 7, col: 'A', ue: 0, st: 'candidat', pop: '2,4 millions', lang: 'roumain', mon: 'leu moldave', small: true,
      shape: _geJ(GB.RO_MD, _geR(GB.UA_MD)) },
    { id: 'UA', name: 'Ukraine', cap: 'Kiev', cp: [30.52,50.45], lbl: [31.5,48.9], sz: 20, col: 'F', ue: 0, st: 'candidat', pop: 'plus de 30 millions', lang: 'ukrainien', mon: 'hryvnia',
      fact: 'C\'est le plus grand pays situé entièrement en Europe. Il est envahi par la Russie depuis 2022.',
      shape: _geJ(GB.SK_UA, GB.PL_UA, GB.BY_UA, GB.UA_RU, GC.UA, _geR(GB.RO_UAS), _geR(GB.UA_MD), _geR(GB.RO_UAN), _geR(GB.HU_UA)) },
    { id: 'BY', name: 'Biélorussie', cap: 'Minsk', cp: [27.56,53.9], lbl: [28.0,53.3], sz: 13, col: 'A', ue: 0, pop: '9,2 millions', lang: 'biélorusse et russe', mon: 'rouble biélorusse',
      shape: _geJ(GB.PL_BY, GB.LT_BY, GB.LV_BY, GB.BY_RU, _geR(GB.BY_UA)) },
    { id: 'RU', name: 'Russie', cap: 'Moscou', cp: [37.62,55.76], lbl: [44.0,58.5], sz: 26, col: 'E', ue: 0, pop: '146 millions', lang: 'russe', mon: 'rouble',
      fact: 'Le plus grand pays du monde. Il s\'étend sur deux continents : sa partie européenne s\'arrête à l\'Oural, sa partie asiatique (la Sibérie) va jusqu\'à l\'océan Pacifique.',
      shape: _geJ(GC.RU_FIN, _geR(GB.FI_RU), GB.NO_RU, GC.RU_N, [[75.0,50.8]], _geR(GB.RU_KZ), _geR(GB.RU_CASP), _geR(GB.RU_CAUC), GC.RU_BLACK, _geR(GB.UA_RU), _geR(GB.BY_RU), GB.LV_RU, GB.EE_RU),
      extraShapes: [_geJ(GC.RK, GB.LT_RK, GB.PL_RK)], extra: ['NZEMLE'] },
    { id: 'TR', name: 'Turquie', cap: 'Ankara', cp: [32.85,39.93], lbl: [33.5,39.2], sz: 16, col: 'B', ue: 0, st: 'candidat', pop: '85 millions', lang: 'turc', mon: 'livre turque',
      fact: 'Pays à cheval sur l\'Europe et l\'Asie : seule une petite partie, autour d\'Istanbul, est en Europe.',
      shape: _geJ(_geR(GB.GR_TR), GB.BG_TR, GC.TR, GB.TR_EAST, GC.TR_S) },
    { id: 'CY', name: 'Chypre', cap: 'Nicosie', cp: [33.36,35.17], lbl: [33.3,34.35], sz: 8, col: 'A', ue: 2004, pop: '950 000', lang: 'grec et turc', mon: 'euro', small: true,
      fact: 'Île de la Méditerranée orientale, membre de l\'Union européenne, géographiquement proche de l\'Asie.',
      shape: GE_ISLANDS.CHYPRE },
    { id: 'MT', name: 'Malte', cap: 'La Valette', cp: [14.51,35.9], lbl: [14.5,35.45], sz: 7, col: 'F', ue: 2004, pop: '550 000', lang: 'maltais et anglais', mon: 'euro', small: true,
      fact: 'Le plus petit pays de l\'Union européenne : un archipel de 316 km² au milieu de la Méditerranée.',
      shape: GE_ISLANDS.MALTE }
];
const GE_PALETTE = { A: '#f4d9ae', B: '#cfe3bd', C: '#f2c9c6', D: '#c9daf1', E: '#e2d3ee', F: '#f3e6a9' };

// ── Fleuves ───────────────────────────────────────────────────────────────
const GE_RIVERS = [
    { id: 'volga', name: 'Volga', lbl: [46.6,53.8], path: [[32.5,57.25],[34.5,57.0],[35.9,56.85],[37.5,56.8],[39.9,57.6],[42.0,57.0],[44.0,56.33],[46.5,56.1],[49.1,55.8],[49.5,55.0],[50.1,53.2],[47.8,52.2],[46.0,51.55],[45.6,50.0],[44.5,48.7],[46.2,47.7],[48.0,46.35],[48.5,45.85]],
      longueur: '3 530 km', source: 'collines du Valdaï (Russie)', mer: 'la mer Caspienne', pays: 'Russie', fact: 'C\'est le plus long fleuve d\'Europe. Il traverse uniquement la Russie.' },
    { id: 'danube', name: 'Danube', lbl: [24.5,43.45], path: [[8.5,47.95],[10.0,48.4],[12.1,49.0],[13.45,48.57],[14.3,48.3],[16.37,48.2],[17.1,48.14],[18.0,47.75],[18.8,47.8],[19.05,47.5],[18.9,46.5],[18.85,45.9],[19.85,45.25],[20.45,44.82],[21.5,44.7],[22.0,44.6],[22.65,44.25],[23.5,43.8],[25.0,43.65],[26.5,44.05],[27.3,44.12],[28.0,44.6],[27.95,45.27],[28.05,45.45],[28.9,45.3],[29.65,45.2]],
      longueur: '2 850 km', source: 'Forêt-Noire (Allemagne)', mer: 'la mer Noire', pays: 'Allemagne, Autriche, Slovaquie, Hongrie, Croatie, Serbie, Roumanie, Bulgarie, Moldavie, Ukraine', fact: 'Deuxième plus long fleuve d\'Europe. Il traverse 10 pays et 4 capitales : Vienne, Bratislava, Budapest et Belgrade.' },
    { id: 'dniepr', name: 'Dniepr', lbl: [34.0,50.3], path: [[33.4,55.85],[32.05,54.78],[30.4,54.5],[30.33,53.9],[30.5,52.5],[30.52,50.45],[32.0,49.4],[33.4,49.07],[35.05,48.45],[35.15,47.85],[33.5,47.0],[32.6,46.65],[31.9,46.55]],
      longueur: '2 200 km', source: 'collines du Valdaï (Russie)', mer: 'la mer Noire', pays: 'Russie, Biélorussie, Ukraine', fact: 'Il traverse Kiev, la capitale de l\'Ukraine.' },
    { id: 'rhin', name: 'Rhin', lbl: [7.1,50.2], path: [[8.7,46.63],[9.5,46.85],[9.55,47.25],[9.5,47.5],[9.2,47.65],[8.6,47.65],[7.6,47.56],[7.8,48.6],[8.25,49.0],[8.45,49.5],[8.27,50.0],[7.6,50.35],[6.95,50.95],[6.75,51.4],[6.1,51.85],[5.0,51.85],[4.1,51.95]],
      longueur: '1 230 km', source: 'Alpes suisses', mer: 'la mer du Nord', pays: 'Suisse, Liechtenstein, Autriche, Allemagne, France, Pays-Bas', fact: 'Grand fleuve de transport de marchandises. Il marque la frontière entre la France et l\'Allemagne en Alsace.' },
    { id: 'elbe', name: 'Elbe', lbl: [12.6,52.75], path: [[15.55,50.75],[15.8,50.2],[15.2,50.03],[14.47,50.35],[13.74,51.05],[12.6,51.85],[11.65,52.13],[11.75,53.0],[9.99,53.55],[8.7,53.87]],
      longueur: '1 094 km', source: 'monts des Géants (Tchéquie)', mer: 'la mer du Nord', pays: 'Tchéquie, Allemagne', fact: 'Elle traverse Dresde puis Hambourg, le plus grand port d\'Allemagne.' },
    { id: 'vistule', name: 'Vistule', lbl: [20.4,53.1], path: [[18.95,49.6],[19.95,50.05],[21.75,50.68],[21.6,51.6],[21.0,52.25],[19.5,52.6],[18.6,53.0],[18.85,53.9],[18.95,54.35]],
      longueur: '1 047 km', source: 'monts Beskides (Pologne)', mer: 'la mer Baltique', pays: 'Pologne', fact: 'Plus long fleuve de Pologne. Elle traverse Cracovie et Varsovie.' },
    { id: 'loire', name: 'Loire', lbl: [0.0,47.05], path: [[4.22,44.84],[4.05,45.25],[4.07,46.04],[3.98,46.48],[3.16,46.99],[2.85,47.6],[1.9,47.9],[1.33,47.59],[0.69,47.39],[-0.55,47.38],[-1.55,47.21],[-2.2,47.27]],
      longueur: '1 006 km', source: 'Mont Gerbier-de-Jonc (France)', mer: 'l\'océan Atlantique', pays: 'France', fact: 'Plus long fleuve de France, bordé de nombreux châteaux.' },
    { id: 'tage', name: 'Tage', lbl: [-5.4,39.55], path: [[-1.7,40.35],[-2.6,40.5],[-3.6,40.03],[-4.02,39.86],[-4.8,39.95],[-6.2,39.65],[-6.88,39.72],[-7.5,39.45],[-8.68,39.23],[-9.15,38.7]],
      longueur: '1 007 km', source: 'monts Universels (Espagne)', mer: 'l\'océan Atlantique (à Lisbonne)', pays: 'Espagne, Portugal', fact: 'Plus long fleuve de la péninsule Ibérique.' },
    { id: 'rhone', name: 'Rhône', lbl: [5.6,44.6], path: [[8.38,46.58],[7.36,46.23],[7.07,46.1],[6.9,46.35],[6.5,46.43],[6.15,46.21],[5.8,45.75],[4.85,45.76],[4.87,45.2],[4.73,44.55],[4.8,43.95],[4.75,43.38]],
      longueur: '812 km', source: 'glacier du Rhône (Suisse)', mer: 'la mer Méditerranée', pays: 'Suisse, France', fact: 'Il traverse le lac Léman puis Lyon. C\'est le fleuve le plus puissant de France.' },
    { id: 'po', name: 'Pô', lbl: [10.4,45.35], path: [[7.1,44.7],[7.7,45.07],[8.6,45.05],[9.7,45.05],[10.0,45.13],[11.0,45.0],[12.4,44.95]],
      longueur: '652 km', source: 'Alpes (Italie)', mer: 'la mer Adriatique', pays: 'Italie', fact: 'Plus long fleuve d\'Italie. Sa plaine est la région agricole la plus riche du pays.' },
    { id: 'tamise', name: 'Tamise', lbl: [-1.2,51.3], path: [[-2.0,51.7],[-1.25,51.75],[-0.6,51.5],[-0.1,51.5],[0.6,51.5]],
      longueur: '346 km', source: 'collines des Cotswolds (Angleterre)', mer: 'la mer du Nord', pays: 'Royaume-Uni', fact: 'Elle traverse Londres.' }
];

// ── Montagnes ─────────────────────────────────────────────────────────────
const GE_MOUNTAINS = [
    { id: 'alpes', name: 'Alpes', lbl: [10.6,46.65], shape: [[6.5,43.85],[5.4,44.0],[5.3,45.0],[5.8,45.9],[6.6,46.4],[7.6,46.6],[8.5,47.0],[9.5,47.3],[11.0,47.6],[12.5,47.75],[14.0,47.9],[15.5,47.9],[16.1,47.7],[15.9,47.1],[15.5,46.5],[14.0,46.15],[13.4,46.1],[12.0,46.0],[10.5,45.8],[9.5,45.85],[8.5,45.75],[7.6,45.4],[7.3,45.0],[7.4,44.3],[7.8,44.1],[7.4,43.8]],
      sommet: 'le Mont Blanc (4 806 m)', pays: 'France, Italie, Suisse, Autriche, Allemagne, Slovénie…', fact: 'Plus haute chaîne de montagnes d\'Europe occidentale. Montagne jeune, aux sommets pointus et enneigés.' },
    { id: 'pyrenees', name: 'Pyrénées', lbl: [0.5,42.55], shape: [[-1.6,43.25],[-1.0,43.15],[0.0,43.05],[1.0,42.95],[2.0,42.75],[3.0,42.55],[3.1,42.4],[2.5,42.2],[1.5,42.15],[0.5,42.3],[-0.5,42.55],[-1.3,42.85],[-1.8,43.05]],
      sommet: 'l\'Aneto (3 404 m)', pays: 'France, Espagne, Andorre', fact: 'Frontière naturelle entre la France et l\'Espagne, de l\'Atlantique à la Méditerranée.' },
    { id: 'apennins', name: 'Apennins', lbl: [14.4,41.75], shape: [[8.4,44.45],[10.0,44.45],[11.5,44.05],[12.8,43.5],[13.9,42.6],[15.0,41.6],[15.9,40.8],[16.4,40.0],[16.5,39.0],[16.2,38.3],[15.8,38.5],[15.9,39.5],[15.4,40.3],[14.6,41.0],[13.6,41.8],[12.8,42.5],[11.9,43.2],[10.8,43.9],[9.6,44.25],[8.4,44.2]],
      sommet: 'le Corno Grande (2 912 m)', pays: 'Italie', fact: 'Ils forment la « colonne vertébrale » de l\'Italie, du nord au sud de la péninsule. On y trouve des volcans comme le Vésuve.' },
    { id: 'carpates', name: 'Carpates', lbl: [24.6,47.55], shape: [[17.2,48.45],[18.2,49.4],[19.6,49.6],[21.5,49.6],[23.0,49.3],[24.5,48.6],[25.6,47.9],[26.5,46.9],[26.8,45.9],[26.3,45.3],[25.0,45.05],[23.5,45.0],[22.3,44.85],[21.9,45.3],[22.6,45.5],[23.6,45.6],[25.2,45.7],[25.7,46.3],[25.3,47.2],[24.4,47.7],[23.3,48.3],[22.0,48.75],[20.5,48.9],[19.2,48.75],[18.1,48.4]],
      sommet: 'le Gerlach (2 655 m, Slovaquie)', pays: 'Tchéquie, Slovaquie, Pologne, Ukraine, Roumanie, Serbie', fact: 'Grand arc montagneux de l\'Europe centrale, couvert de forêts où vivent encore des ours et des loups.' },
    { id: 'scandinaves', name: 'Alpes scandinaves', lines: ['Alpes', 'scandinaves'], lbl: [12.2,65.2], shape: [[6.5,59.0],[5.5,60.5],[6.5,62.5],[9.0,63.0],[12.0,63.5],[13.5,65.5],[16.0,67.5],[18.5,68.5],[20.5,69.3],[21.0,68.8],[19.0,68.1],[16.8,67.0],[14.8,65.5],[13.5,63.8],[12.8,62.5],[11.2,61.2],[9.5,60.0],[8.0,59.3]],
      sommet: 'le Galdhøpiggen (2 469 m, Norvège)', pays: 'Norvège, Suède, Finlande', fact: 'Montagne ancienne, usée et rabotée par les glaciers, qui ont creusé les fjords norvégiens.' },
    { id: 'oural', name: 'Oural', lbl: [57.4,61.5], shape: [[57.5,52.0],[58.0,54.5],[58.5,57.0],[58.8,59.5],[59.0,62.0],[59.0,64.5],[60.0,66.5],[64.0,68.3],[65.5,68.0],[61.5,66.0],[60.5,64.0],[60.3,61.0],[60.2,58.0],[60.0,55.5],[59.7,53.0],[59.0,51.3]],
      sommet: 'le mont Narodnaïa (1 895 m)', pays: 'Russie', fact: 'Montagne ancienne aux sommets arrondis. On considère que l\'Oural marque la limite entre l\'Europe et l\'Asie.' },
    { id: 'caucase', name: 'Caucase', lbl: [44.6,42.05], shape: [[37.5,45.0],[39.5,44.3],[41.5,43.8],[43.5,43.4],[45.5,43.0],[47.5,42.0],[49.5,40.8],[49.0,40.4],[47.0,41.0],[45.0,41.8],[43.5,42.2],[41.5,42.8],[39.5,43.5],[37.6,44.6]],
      sommet: 'l\'Elbrouz (5 642 m)', pays: 'Russie, Géorgie, Azerbaïdjan, Arménie', fact: 'Chaîne entre la mer Noire et la mer Caspienne. L\'Elbrouz est souvent considéré comme le plus haut sommet d\'Europe.' }
];

// ── Mers et océans ────────────────────────────────────────────────────────
const GE_SEAS = [
    { id: 'atlantique', name: 'Océan Atlantique', lines: ['Océan', 'Atlantique'], lbl: [-12.6,46.3], info: 'Deuxième plus grand océan du monde. Il borde tout l\'ouest de l\'Europe, du Portugal à l\'Islande.' },
    { id: 'mernord', name: 'Mer du Nord', lines: ['Mer', 'du Nord'], lbl: [3.2,56.3], info: 'Mer peu profonde entre le Royaume-Uni, la Norvège, le Danemark, l\'Allemagne, les Pays-Bas, la Belgique et la France. Riche en pétrole et en poissons.' },
    { id: 'manche', name: 'Manche', lbl: [-3.8,49.6], info: 'Bras de mer entre la France et le Royaume-Uni, traversé par le tunnel sous la Manche. L\'une des mers les plus fréquentées du monde.' },
    { id: 'baltique', name: 'Mer Baltique', lines: ['Mer', 'Baltique'], lbl: [19.5,55.9], info: 'Mer presque fermée, peu salée, entourée par la Suède, la Finlande, la Russie, les pays baltes, la Pologne, l\'Allemagne et le Danemark. Elle gèle en partie en hiver.' },
    { id: 'norvege', name: 'Mer de Norvège', lines: ['Mer de', 'Norvège'], lbl: [2.0,66.5], info: 'Mer froide de l\'océan Atlantique nord, au large de la Norvège. Grâce au courant chaud du Gulf Stream, ses ports ne gèlent pas.' },
    { id: 'barents', name: 'Mer de Barents', lines: ['Mer de', 'Barents'], lbl: [44.5,70.4], info: 'Mer de l\'océan Arctique, au nord de la Norvège et de la Russie. Le port russe de Mourmansk y reste libre de glaces toute l\'année.' },
    { id: 'mediterranee', name: 'Mer Méditerranée', lines: ['Mer', 'Méditerranée'], lbl: [18.5,34.9], info: 'Grande mer presque fermée entre l\'Europe, l\'Afrique et l\'Asie. Elle communique avec l\'océan Atlantique par le détroit de Gibraltar.' },
    { id: 'adriatique', name: 'Mer Adriatique', lines: ['Mer', 'Adriatique'], lbl: [15.7,42.85], small: true, info: 'Bras de la Méditerranée entre l\'Italie et les Balkans (Slovénie, Croatie, Monténégro, Albanie). Venise est située à son extrémité nord.' },
    { id: 'egee', name: 'Mer Égée', lines: ['Mer', 'Égée'], lbl: [25.0,38.9], small: true, info: 'Bras de la Méditerranée entre la Grèce et la Turquie, parsemé de nombreuses îles.' },
    { id: 'noire', name: 'Mer Noire', lines: ['Mer', 'Noire'], lbl: [34.0,43.3], info: 'Mer fermée entre l\'Europe et l\'Asie, reliée à la Méditerranée par le détroit du Bosphore (à Istanbul). Le Danube et le Dniepr s\'y jettent.' },
    { id: 'caspienne', name: 'Mer Caspienne', lines: ['Mer', 'Caspienne'], lbl: [50.7,42.4], info: 'C\'est en réalité le plus grand lac du monde, d\'eau salée. La Volga s\'y jette.' }
];
const GE_CASPIAN = [[49.2,46.3],[48.5,45.9],[47.8,45.6],[47.5,45.0],[47.0,44.4],[47.5,43.5],[47.5,42.98],[48.2,42.0],[48.6,41.85],[49.4,40.5],[50.35,40.4],[49.3,39.5],[49.0,38.4],[49.6,37.6],[51.0,36.8],[53.9,37.0],[53.8,38.5],[53.0,39.5],[53.5,40.5],[52.8,41.5],[52.5,42.5],[51.3,43.2],[51.3,44.5],[53.0,45.3],[53.2,46.7],[51.5,47.0],[50.0,46.6]];
const GE_MARMARA = [[26.7,40.4],[27.5,40.95],[28.8,41.0],[29.9,40.75],[29.0,40.4],[27.8,40.35],[27.0,40.3]];

const GE_LAYERS = {
    pays:      { label: '🏳 Pays',       kindName: 'Pays' },
    capitales: { label: '⭐ Capitales',  kindName: 'Capitale' },
    fleuves:   { label: '🌊 Fleuves',    kindName: 'Fleuve' },
    montagnes: { label: '⛰ Montagnes',  kindName: 'Chaîne de montagnes' },
    mers:      { label: '⚓ Mers',       kindName: 'Mer / océan' }
};
const GE_COLORS = { pays: '#2f4f9e', fleuves: '#2b7bd0', montagnes: '#9a6a3a', mers: '#3b7fae' };
const GE_UE = { member: '#8fb2ec', candidat: '#d9e3f3', other: '#eeede6' };
const GE_FONT = 1.3; // facteur appliqué à la taille des noms de pays

function _geEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoEuropeWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-europe';
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
    container.className = 'ge-container';

    const initW = Math.round(window.innerWidth * 0.75);
    container.style.width = initW + 'px';
    let mapH = Math.max(320, Math.round((initW * 0.72 - 30) * GE_H / GE_W));

    // En-tête
    const header = document.createElement('div');
    header.className = 'ge-header';
    header.innerHTML = `
        <span class="ge-title">🌍 Géographie de l'Europe</span>
        <span class="ge-badge">Vue d'ensemble</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.ge-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'ge-controls';
    controls.innerHTML = `
        <button class="ge-btn ge-btn-ue" title="Colorier les pays de l'Union européenne">🇪🇺 Union européenne</button>
        <button class="ge-btn ge-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈 Masquer les noms</button>
        <button class="ge-btn ge-btn-reveal" style="display:none">👁 Tout révéler</button>
        <button class="ge-btn ge-btn-home" title="Revenir à la carte entière">🔍 Vue d'ensemble</button>
        <div class="ge-layers">
            <span class="ge-layers-lbl">Afficher :</span>
            ${Object.keys(GE_LAYERS).map(k => `<button class="ge-layer-btn active" data-layer="${k}">${GE_LAYERS[k].label}</button>`).join('')}
        </div>
    `;
    const ueBtn     = controls.querySelector('.ge-btn-ue');
    const hideBtn   = controls.querySelector('.ge-btn-hide');
    const revealBtn = controls.querySelector('.ge-btn-reveal');
    const homeBtn   = controls.querySelector('.ge-btn-home');
    container.appendChild(controls);

    // Corps : carte + fiche
    const body = document.createElement('div');
    body.className = 'ge-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'ge-map-wrap';
    const side = document.createElement('div');
    side.className = 'ge-side';
    body.appendChild(mapWrap);
    body.appendChild(side);
    container.appendChild(body);

    // ── Construction de la carte SVG ──────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ge-map');
    svg.setAttribute('viewBox', `0 0 ${GE_W.toFixed(1)} ${GE_H.toFixed(1)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const uid = Math.random().toString(36).slice(2, 8);
    svg.innerHTML = `
        <defs>
            <pattern id="ge-hatch-${uid}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#b5834d" fill-opacity="0.42"></rect>
                <line x1="0" y1="0" x2="0" y2="6" stroke="#7a4b1c" stroke-width="1.6" stroke-opacity="0.45"></line>
            </pattern>
            <clipPath id="ge-clip-${uid}"><rect x="0" y="0" width="${GE_W.toFixed(1)}" height="${GE_H.toFixed(1)}"></rect></clipPath>
        </defs>
        <rect x="-5000" y="-5000" width="12000" height="12000" fill="#cfe6f3"></rect>
        <g clip-path="url(#ge-clip-${uid})">
            <g class="ge-g-other"></g>
            <g class="ge-g-countries"></g>
            <g class="ge-g-water"></g>
            <g class="ge-L-montagnes ge-g-mountains"></g>
            <g class="ge-L-fleuves ge-g-rivers"></g>
            <g class="ge-L-capitales ge-g-caps"></g>
            <g class="ge-g-labels">
                <g class="ge-L-mers"></g>
                <g class="ge-L-montagnes"></g>
                <g class="ge-L-fleuves"></g>
                <g class="ge-L-pays"></g>
                <g class="ge-L-capitales"></g>
            </g>
        </g>
    `;
    mapWrap.appendChild(svg);

    const gOther     = svg.querySelector('.ge-g-other');
    const gCountries = svg.querySelector('.ge-g-countries');
    const gWater     = svg.querySelector('.ge-g-water');
    const gMountains = svg.querySelector('.ge-g-mountains');
    const gRivers    = svg.querySelector('.ge-g-rivers');
    const gCaps      = svg.querySelector('.ge-g-caps');
    const gLabels    = {};
    Object.keys(GE_LAYERS).concat([]).forEach(k => {
        gLabels[k] = svg.querySelector('.ge-g-labels .ge-L-' + k);
    });

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    const items = {};     // id -> { id, layer, name, data, shapes:[], label, zoom }
    const labels = [];    // { el, ax, ay, dx, dy, size, lines, item, minZ, cap }
    const scalables = []; // cercles dont le rayon suit le zoom { el, r, sw }

    function addLabel(item, layer, cls, lonlat, size, dx, dy, anchor, lines, minZ, isCap) {
        const [ax, ay] = _geP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'ge-lbl ' + cls + ' ge-item', 'text-anchor': anchor || 'middle', 'data-id': item.id }, gLabels[layer]);
        const lb = { el: t, ax, ay, dx: dx || 0, dy: dy || 0, size, lines: lines || [item.name], item, minZ: minZ || 0, cap: !!isCap };
        labels.push(lb);
        item.shapes.push(t);
        return lb;
    }

    // Terres hors Europe
    Object.values(GE_OTHER).forEach(pts => el('path', { class: 'ge-other', d: _gePath(pts, true) }, gOther));

    // Pays
    GE_COUNTRIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'pays', name: c.name, data: c, shapes: [], fills: [] };
        const polys = [c.shape].concat(c.extraShapes || []).concat((c.extra || []).map(k => GE_ISLANDS[k]));
        polys.forEach((pts, i) => {
            const p = el('path', { class: 'ge-country ge-item', d: _gePath(pts, true), 'data-id': c.id }, gCountries);
            it.shapes.push(p);
            it.fills.push(p);
            if (i === 0) it.mainShape = p;
        });
        // Petits pays : marqueur pour les rendre cliquables
        if (c.small) {
            const [x, y] = _geP(c.cp[0], c.cp[1]);
            const ring = el('circle', { class: 'ge-country ge-item', cx: x, cy: y, r: 4, 'data-id': c.id, 'fill-opacity': '0', stroke: '#6b7280', 'stroke-width': '0.8', 'stroke-dasharray': '2 1.5' }, gCountries);
            it.shapes.push(ring);
            scalables.push({ el: ring, r: 9, sw: 0.8 });
        }
        // Nom du pays
        const fs = c.sz * GE_FONT;
        it.label = addLabel(it, 'pays', 'ge-lbl-country', c.lbl, fs, 0, fs * 0.35, 'middle',
            c.short ? [c.short] : null, c.sz <= 7 ? 1.6 : 0);
        it.label.fullLines = [c.name];
        // Capitale
        const [x, y] = _geP(c.cp[0], c.cp[1]);
        const dot = el('circle', { class: 'ge-capital ge-item', cx: x, cy: y, r: 3.2, 'stroke-width': 1.4, 'data-id': c.id }, gCaps);
        it.shapes.push(dot);
        scalables.push({ el: dot, r: 3.2, sw: 1.4 });
        it.capLabel = addLabel(it, 'capitales', 'ge-lbl-cap', c.cp, 11, 7, 4, 'start', [c.cap], 2.2, true);
        it.zoom = { bbox: true, min: 150 };
    });

    // Eaux intérieures (mer Caspienne, mer de Marmara)
    el('path', { class: 'ge-water', d: _gePath(GE_CASPIAN, true) }, gWater);
    el('path', { class: 'ge-water', d: _gePath(GE_MARMARA, true) }, gWater);

    // Montagnes
    GE_MOUNTAINS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'montagnes', name: m.name, data: m, shapes: [] };
        const p = el('path', { class: 'ge-massif ge-item', d: _gePath(m.shape, true), 'data-id': m.id, fill: `url(#ge-hatch-${uid})` }, gMountains);
        it.shapes.push(p);
        it.mainShape = p;
        it.label = addLabel(it, 'montagnes', 'ge-lbl-massif', m.lbl, 15, 0, 5, 'middle', m.lines || null);
        it.zoom = { bbox: true, min: 220 };
    });

    // Fleuves
    GE_RIVERS.forEach(r => {
        const it = items[r.id] = { id: r.id, layer: 'fleuves', name: r.name, data: r, shapes: [] };
        const d = _geSmooth(r.path);
        it.shapes.push(el('path', { class: 'ge-river-hit ge-item', d, 'data-id': r.id }, gRivers));
        const line = el('path', { class: 'ge-river ge-item', d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, gRivers);
        it.shapes.push(line);
        it.mainShape = line;
        it.label = addLabel(it, 'fleuves', 'ge-lbl-river', r.lbl, 13, 0, 4, 'middle', null, 1.3);
        it.zoom = { bbox: true, min: 220 };
    });

    // Mers
    GE_SEAS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'mers', name: m.name, data: m, shapes: [] };
        it.label = addLabel(it, 'mers', 'ge-lbl-sea', m.lbl, m.small ? 11 : 14, 0, 5, 'middle', m.lines || null);
        it.zoom = { p: m.lbl, w: 380 };
    });

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ge-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ge-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Géographie de l'Europe</h4>
        <p>La carte présente les <b>pays d'Europe</b> et leurs <b>capitales</b>, les grands
        <b>fleuves</b>, les <b>chaînes de montagnes</b>, les <b>mers</b> et les <b>océans</b>.</p>
        <p>👆 <b>Clique sur un élément</b> : la carte zoome dessus et sa fiche s'affiche à droite.
        Clique à nouveau dessus, ou sur <b>Vue d'ensemble</b>, pour revenir à la carte entière.
        En zoomant, les noms des capitales et des petits pays apparaissent.</p>
        <p>🇪🇺 <b>Union européenne</b> : colorie en bleu les 27 pays membres
        (et en bleu clair les pays candidats).</p>
        <p>🗂 <b>Afficher</b> : active ou désactive chaque catégorie d'éléments.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms sont remplacés par « ? ». Clique sur un élément
        pour dévoiler son nom. Idéal pour faire réviser les élèves !</p>
        <p style="color:#888">Le tracé de la carte est simplifié. Les micro-États (Andorre, Monaco,
        Liechtenstein, Saint-Marin, Vatican) ne sont pas représentés.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ge-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    const layers = { pays: true, capitales: true, fleuves: true, montagnes: true, mers: true };
    let ueMode = false;
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let vb = { x: 0, y: 0, w: GE_W, h: GE_H };
    let animId = null;

    // ── Couleurs des pays ─────────────────────────────────────────────────
    function applyColors() {
        GE_COUNTRIES.forEach(c => {
            const it = items[c.id];
            let fill = GE_PALETTE[c.col];
            if (ueMode) fill = c.ue ? GE_UE.member : (c.st === 'candidat' ? GE_UE.candidat : GE_UE.other);
            it.fills.forEach(p => p.setAttribute('fill', fill));
        });
        ueBtn.classList.toggle('on', ueMode);
        badgeUpdate();
    }

    // ── Vue (viewBox) ─────────────────────────────────────────────────────
    function aspect() {
        const w = svg.clientWidth, h = svg.clientHeight;
        return (w && h) ? w / h : GE_W / GE_H;
    }
    function fullView() {
        const a = aspect();
        if (a > GE_W / GE_H) { const w = GE_H * a; return { x: (GE_W - w) / 2, y: 0, w, h: GE_H }; }
        const h = GE_W / a; return { x: 0, y: (GE_H - h) / 2, w: GE_W, h };
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
        if (!it) return fullView();
        if (it.zoom.bbox) {
            const b = it.mainShape.getBBox();
            const x0 = Math.max(0, b.x), y0 = Math.max(0, b.y);
            const x1 = Math.min(GE_W, b.x + b.width), y1 = Math.min(GE_H, b.y + b.height);
            const pad = 0.2;
            const w = Math.max(it.zoom.min, (x1 - x0) * (1 + pad * 2));
            const h = Math.max(it.zoom.min * 0.75, (y1 - y0) * (1 + pad * 2));
            return fitRect((x0 + x1) / 2, (y0 + y1) / 2, w, h);
        }
        const [cx, cy] = _geP(it.zoom.p[0], it.zoom.p[1]);
        return fitRect(cx, cy, it.zoom.w, it.zoom.w * 0.75);
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
        labels.forEach(lb => {
            const own = selected && lb.item.id === selected;
            const far = zoom < lb.minZ && !own;
            lb.el.classList.toggle('ge-far', far);
            if (far) return;
            lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
            lb.el.setAttribute('stroke-width', (3 * s).toFixed(2));
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
        const t0 = performance.now(), dur = 500;
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
            lb.el.classList.toggle('ge-hidden', hidden);
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            // Nom complet quand le pays est sélectionné (ex. Bosnie-Herzégovine)
            const lines = hidden ? ['?'] : ((lb.fullLines && selected === lb.item.id) ? lb.fullLines : lb.lines);
            lines.forEach(line => {
                const t = document.createElementNS(NS, 'tspan');
                t.textContent = line;
                lb.el.appendChild(t);
            });
        });
        setView(vb);
    }

    // ── Sélection ─────────────────────────────────────────────────────────
    function badgeUpdate() {
        const it = selected && items[selected];
        badge.textContent = it ? 'Zoom : ' + it.name : (ueMode ? 'Union européenne' : 'Vue d\'ensemble');
    }
    function applySelection() {
        svg.classList.toggle('ge-has-sel', !!selected);
        Object.values(items).forEach(it => {
            it.shapes.forEach(s => s.classList.toggle('ge-sel', it.id === selected));
        });
        badgeUpdate();
        applyLabels();
        renderSide();
    }

    function select(id, animate) {
        selected = id;
        applySelection();
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
    function row(lbl, val) { return `<li><b>${lbl} :</b> ${_geEsc(val)}</li>`; }
    function ueText(c) {
        if (c.ue === 1957) return 'membre fondateur (1957)';
        if (c.ue) return 'membre depuis ' + c.ue;
        if (c.st === 'brexit') return 'ancien membre (1973-2020)';
        if (c.st === 'candidat') return 'pays candidat';
        return 'non membre';
    }

    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it) {
            side.style.borderLeftColor = ueMode ? '#2f4f9e' : '#9ca3af';
            let html = `<h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">L'Europe</h4>
                <div class="ge-hint">Clique sur un pays, un fleuve, une montagne ou une mer pour zoomer dessus et découvrir sa fiche.</div>`;
            if (ueMode) {
                html += `
                    <div class="ge-legend-row"><span class="ge-sw" style="background:${GE_UE.member}"></span><span><b>27</b> pays membres de l'UE</span></div>
                    <div class="ge-legend-row"><span class="ge-sw" style="background:${GE_UE.candidat};border:1px solid #b8c5dc"></span><span>pays candidats</span></div>
                    <div class="ge-legend-row"><span class="ge-sw" style="background:${GE_UE.other};border:1px solid #ccc"></span><span>autres pays</span></div>
                    <p style="margin-top:8px">L'<b>Union européenne</b> est née en 1957 avec 6 pays fondateurs : la France, l'Allemagne, l'Italie, la Belgique, les Pays-Bas et le Luxembourg.</p>
                    <p>21 pays de l'UE utilisent la même monnaie : l'<b>euro</b>. Son drapeau est bleu avec 12 étoiles dorées.</p>`;
            } else {
                const n = { fleuves: GE_RIVERS.length, montagnes: GE_MOUNTAINS.length, mers: GE_SEAS.length };
                html += `
                    <div class="ge-legend-row"><span class="ge-sw" style="background:#fff;border:2px solid #b91c1c;border-radius:50%;width:12px;height:12px;margin:0 5px"></span><span>capitale</span></div>
                    <div class="ge-legend-row"><span class="ge-sw" style="background:#2b7bd0;height:4px"></span><span><b>${n.fleuves}</b> grands fleuves</span></div>
                    <div class="ge-legend-row"><span class="ge-sw" style="background:repeating-linear-gradient(45deg,#b5834d 0 3px,#e6cfae 3px 6px)"></span><span><b>${n.montagnes}</b> chaînes de montagnes</span></div>
                    <div class="ge-legend-row"><span class="ge-sw" style="background:#cfe6f3;border:1px solid #9cc3dc"></span><span><b>${n.mers}</b> mers et océan</span></div>
                    <p style="margin-top:10px;color:#6b7280">L'Europe compte une cinquantaine de pays et environ <b>740 millions</b> d'habitants. Elle s'étend de l'océan Atlantique à l'Oural.</p>`;
            }
            side.innerHTML = html;
            return;
        }
        const d = it.data;
        let html = '';
        if (it.layer === 'pays') {
            const color = d.ue ? '#2f4f9e' : '#4b5563';
            side.style.borderLeftColor = ueMode ? (d.ue ? GE_UE.member : '#c9ccd1') : GE_PALETTE[d.col];
            html += `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${color}">${_geEsc(d.name)}</h4>`;
            html += `<div class="ge-kind">Pays${d.ue ? ' de l\'Union européenne' : ''}</div>`;
            html += '<ul>' + row('Capitale', d.cap) + row('Habitants', 'environ ' + d.pop) + row('Langue(s)', d.lang)
                + row('Monnaie', d.mon) + row('Union européenne', ueText(d)) + '</ul>';
            if (d.fact) html += `<p>${_geEsc(d.fact)}</p>`;
        } else if (it.layer === 'fleuves') {
            side.style.borderLeftColor = GE_COLORS.fleuves;
            html += `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${GE_COLORS.fleuves}">${_geEsc(d.name)}</h4><div class="ge-kind">Fleuve</div>`;
            html += '<ul>' + row('Longueur', d.longueur) + row('Source', d.source) + row('Se jette dans', d.mer) + row('Pays traversés', d.pays) + '</ul>';
            html += `<p>${_geEsc(d.fact)}</p>`;
        } else if (it.layer === 'montagnes') {
            side.style.borderLeftColor = GE_COLORS.montagnes;
            html += `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${GE_COLORS.montagnes}">${_geEsc(d.name)}</h4><div class="ge-kind">Chaîne de montagnes</div>`;
            html += '<ul>' + row('Plus haut sommet', d.sommet) + row('Pays', d.pays) + '</ul>';
            html += `<p>${_geEsc(d.fact)}</p>`;
        } else if (it.layer === 'mers') {
            side.style.borderLeftColor = GE_COLORS.mers;
            html += `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${GE_COLORS.mers}">${_geEsc(d.name)}</h4><div class="ge-kind">Mer / océan</div>`;
            html += `<p>${_geEsc(d.info)}</p>`;
        }
        html += `<button class="ge-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        const back = side.querySelector('.ge-back-btn');
        back.addEventListener('mousedown', (e) => e.stopPropagation());
        back.addEventListener('click', (e) => { e.stopPropagation(); select(null); saveBoard(); });
    }

    // ── Calques ───────────────────────────────────────────────────────────
    function applyLayers() {
        Object.keys(layers).forEach(k => svg.classList.toggle('ge-off-' + k, !layers[k]));
        controls.querySelectorAll('.ge-layer-btn').forEach(b => b.classList.toggle('active', !!layers[b.dataset.layer]));
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
        if (e.target.closest && e.target.closest('.ge-item')) e.stopPropagation();
    });
    svg.addEventListener('click', (e) => {
        const t = e.target.closest ? e.target.closest('[data-id]') : null;
        if (!t) return;
        e.stopPropagation();
        onItemClick(t.getAttribute('data-id'));
    });
    ueBtn.addEventListener('click', () => { ueMode = !ueMode; applyColors(); renderSide(); saveBoard(); });
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
    controls.querySelectorAll('.ge-layer-btn').forEach(b => {
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
            mapH = Math.max(240, startH + ev.clientY - startY);
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
            mapH = Math.max(240, startH + t.clientY - startY);
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
        window._wfMiniBarCollapse(widget, '🌍 Géographie de l\'Europe', {
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
    applyColors();
    applyLayers();
    applySelection();
    requestAnimationFrame(() => { setView(targetView()); renderSide(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._geGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        mapH:       _isMax && _savedH ? _savedH : mapH,
        layers:     { ...layers },
        ueMode,
        hideNames,
        revealed:   Array.from(revealed),
        selected
    });
    widget._geSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.mapH) mapH = Math.max(240, d.mapH);
        applySize();
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        ueMode = !!d.ueMode;
        applyColors();
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
