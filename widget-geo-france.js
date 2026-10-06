// =========================================================================
// WIDGET GÉOGRAPHIE DE LA FRANCE — Le Bureau du Prof
// Carte de France interactive : 10 plus grandes villes, 4 grands fleuves
// (Seine, Loire, Garonne, Rhône), 5 massifs montagneux (Alpes, Pyrénées,
// Massif central, Jura, Vosges), pays frontaliers (en partie) et mers.
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

    // Taille des pastilles réduire / plein écran / fermer.
    // Injecté à part, avec !important : s'applique même si un autre script
    // a déjà défini « wf-btns-style » avec l'ancienne taille.
    if (!document.getElementById('wf-btns-size')) {
        const wz = document.createElement('style');
        wz.id = 'wf-btns-size';
        wz.textContent = `
    .wf-btns { gap:8px !important; }
    .wf-btns .wf-btn { width:22px !important; height:22px !important;
        min-width:22px !important; min-height:22px !important; padding:0 !important; }
    .wf-btns:hover .wf-btn::after       { font-size:14px !important; }
    .wf-btns:hover .wf-btn-max::after   { font-size:12px !important; }
    .wf-btns:hover .wf-btn-close::after { font-size:17px !important; }
        `;
        document.head.appendChild(wz);
    }

    // CSS partagé boutons fenêtre (injecté une seule fois)
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .wf-btn { width:22px; height:22px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:14px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:12px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:17px; }
        `;
        document.head.appendChild(ws);
    }

    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="geo-france"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gf-container {
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
        .gf-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .gf-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .gf-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e3f1fb;
            color: #1f5f8b;
        }

        /* Réduit / plein écran */
        .gf-container.wf-minimized > *:not(.gf-header) { display: none !important; }
        .gf-container.wf-minimized { gap: 0; }
        .gf-container.wf-fullboard {
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
        .gf-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .gf-btn {
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
        .gf-btn:hover { background: #e0e0e0; }
        .gf-btn:active { transform: scale(0.96); }
        .gf-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .gf-btn.on:hover { background: #357abd; }
        .gf-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .gf-btn-reveal:hover { background: #218838; }
        .gf-layers { display: flex; gap: 4px; margin-left: auto; align-items: center; flex-wrap: wrap; }
        .gf-layers-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .gf-layer-btn {
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
        .gf-layer-btn:hover { background: #e0e0e0; }
        .gf-layer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Corps : carte + fiche */
        .gf-body { display: flex; gap: 10px; align-items: stretch; }
        .gf-map-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border: 1px solid #c9dbe6;
            border-radius: 10px;
            overflow: hidden;
            background: #cfe6f3;
        }
        .gf-map { display: block; width: 100%; height: 100%; touch-action: none; }
        .gf-side {
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
        .gf-side h4 { margin: 0 0 2px; font-weight: 900; }
        .gf-side .gf-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .gf-side p { margin: 0 0 6px; }
        .gf-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .gf-side li { margin-bottom: 4px; }
        .gf-side .gf-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .gf-side .gf-sw { width: 22px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .gf-side .gf-hint { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .gf-back-btn {
            margin-top: 6px;
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .gf-back-btn:hover { background: #f0f0f0; }

        /* Éléments de la carte */
        .gf-map text { font-family: 'Segoe UI', system-ui, sans-serif; paint-order: stroke; stroke-linejoin: round; }
        .gf-item { cursor: pointer; transition: opacity .25s; }
        .gf-has-sel .gf-item:not(.gf-sel) { opacity: .3; }
        .gf-has-sel .gf-country:not(.gf-sel),
        .gf-has-sel .gf-monaco:not(.gf-sel) { opacity: 1; fill: #eceee7; }
        .gf-country { fill: #e4e6dc; stroke: #ffffff; stroke-width: 1.2; }
        .gf-country:hover { fill: #d5dbc8; }
        .gf-country.gf-sel { fill: #cfe0b8; }
        .gf-other { fill: #ebece6; stroke: #ffffff; stroke-width: 1; }
        .gf-france { fill: #fdf6e1; stroke: #8a6d3b; stroke-width: 2; }
        .gf-massif { fill: url(#gf-hatch); stroke: #9a6a3a; stroke-width: 1; stroke-opacity: .55; }
        .gf-massif:hover, .gf-massif.gf-sel { stroke-width: 2.5; stroke-opacity: 1; }
        .gf-river { fill: none; stroke: #2b7bd0; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        .gf-river.gf-sel { stroke-width: 6; }
        .gf-river-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
        .gf-river-hit:hover + .gf-river { stroke-width: 5; }
        .gf-lake { fill: #9ccbe8; stroke: #2b7bd0; stroke-width: 1.5; }
        .gf-city { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gf-city.gf-sel { fill: #a51d1d; }
        .gf-capital { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gf-lbl-city    { fill: #1f2937; font-weight: 800; stroke: #ffffff; stroke-width: 4; }
        .gf-lbl-river   { fill: #1d5fa8; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .gf-lbl-massif  { fill: #7a4b1c; font-weight: 800; font-style: italic; stroke: #fdf6e1; stroke-width: 4; }
        .gf-lbl-country { fill: #6b7280; font-weight: 700; font-style: italic; stroke: #e4e6dc; stroke-width: 4; letter-spacing: 1px; }
        .gf-lbl-sea     { fill: #3b7fae; font-weight: 600; font-style: italic; stroke: #cfe6f3; stroke-width: 3; letter-spacing: 1px; }
        .gf-lbl.gf-hidden { fill: #d63384; font-style: normal; }
        .gf-monaco { fill: #e4e6dc; stroke: #6b7280; stroke-width: 1.5; }
        .gf-monaco.gf-sel { fill: #cfe0b8; }

        /* Calques désactivés */
        .gf-off-villes .gf-L-villes,
        .gf-off-fleuves .gf-L-fleuves,
        .gf-off-massifs .gf-L-massifs,
        .gf-off-mers .gf-L-mers,
        .gf-off-pays .gf-L-pays { display: none; }
        .gf-off-pays .gf-country { fill: #ebece6; pointer-events: none; }

        /* Aide */
        .gf-help-btn {
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
        .gf-help-btn:hover { background: #e0e0e0; color: #333; }
        .gf-help-popup {
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
        .gf-help-popup.show { display: block; }
        .gf-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .gf-help-popup p { margin: 0 0 6px; }
        .gf-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .gf-resize-handle {
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
        .gf-container:hover .gf-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Projection (longitude / latitude → coordonnées SVG) ───────────────────
const GF_LON0 = -5.6, GF_LON1 = 10.4, GF_LAT0 = 41.0, GF_LAT1 = 51.6;
const GF_K = 100, GF_COS = Math.cos(46.3 * Math.PI / 180);
const GF_W = (GF_LON1 - GF_LON0) * GF_COS * GF_K;
const GF_H = (GF_LAT1 - GF_LAT0) * GF_K;

function _gfP(lon, lat) { return [(lon - GF_LON0) * GF_COS * GF_K, (GF_LAT1 - lat) * GF_K]; }
function _gfPath(pts, closed) {
    return pts.map((p, i) => {
        const [x, y] = _gfP(p[0], p[1]);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + (closed ? ' Z' : '');
}
// Courbe lissée (Catmull-Rom) pour les fleuves
function _gfSmooth(pts) {
    const P = pts.map(p => _gfP(p[0], p[1]));
    let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ' C' + c1.map(v => v.toFixed(1)).join(' ') + ' ' + c2.map(v => v.toFixed(1)).join(' ') + ' ' + p2.map(v => v.toFixed(1)).join(' ');
    }
    return d;
}
const _gfRev = a => a.slice().reverse();

// ── Frontières (tracé simplifié) ──────────────────────────────────────────
const GF_B_BE = [[2.55,51.09],[2.65,50.95],[2.9,50.7],[3.15,50.78],[3.29,50.52],[3.65,50.45],[3.67,50.33],[4.03,50.36],[4.2,50.27],[4.15,50.0],[4.43,49.95],[4.82,50.15],[4.87,49.8],[5.1,49.77],[5.43,49.6],[5.82,49.55]];
const GF_B_LU = [[5.82,49.55],[6.1,49.46],[6.37,49.47]];
const GF_B_DE = [[6.37,49.47],[6.73,49.17],[7.1,49.15],[7.45,49.17],[7.65,49.05],[8.2,48.97],[7.95,48.6],[7.75,48.3],[7.62,48.0],[7.55,47.75],[7.59,47.58]];
const GF_B_CH = [[7.59,47.58],[7.3,47.45],[7.0,47.48],[6.95,47.25],[6.45,46.98],[6.1,46.6],[6.13,46.4],[5.97,46.2],[6.15,46.15],[6.17,46.27],[6.5,46.4],[6.8,46.39],[6.82,46.12],[7.05,45.92],[6.86,45.83]];
const GF_B_IT = [[6.86,45.83],[7.0,45.6],[7.13,45.45],[6.95,45.2],[6.65,45.1],[6.9,44.85],[6.9,44.65],[6.85,44.5],[7.0,44.25],[7.4,44.12],[7.7,44.06],[7.53,43.78]];
const GF_C_MED = [[7.53,43.78],[7.27,43.68],[7.0,43.54],[6.65,43.3],[6.2,43.08],[5.95,43.1],[5.6,43.18],[5.37,43.25],[5.0,43.4],[4.85,43.36],[4.6,43.4],[4.1,43.55],[3.7,43.4],[3.25,43.25],[3.05,42.95],[3.05,42.6],[3.17,42.43]];
const GF_B_ES = [[3.17,42.43],[2.9,42.42],[2.5,42.35],[2.0,42.4],[1.78,42.58],[1.6,42.65],[1.45,42.6],[1.0,42.75],[0.7,42.85],[0.0,42.7],[-0.5,42.8],[-1.0,43.02],[-1.4,43.05],[-1.78,43.37]];
const GF_C_ATL = [[-1.78,43.37],[-1.5,43.53],[-1.3,44.0],[-1.2,44.6],[-1.25,44.66],[-1.15,45.5],[-1.06,45.57],[-1.0,45.63],[-1.2,45.85],[-1.15,46.16],[-1.8,46.5],[-2.1,46.85],[-2.15,47.1],[-2.5,47.3],[-3.0,47.55],[-3.4,47.7],[-4.2,47.8],[-4.37,47.8],[-4.73,48.04],[-4.5,48.2],[-4.78,48.35],[-4.6,48.6],[-4.0,48.72],[-3.5,48.83],[-3.0,48.78],[-2.76,48.55],[-2.3,48.65],[-2.0,48.65],[-1.6,48.62],[-1.55,48.75],[-1.6,49.2],[-1.85,49.55],[-1.95,49.72],[-1.62,49.65],[-1.25,49.7],[-1.1,49.35],[-0.5,49.33],[0.1,49.45],[0.2,49.7],[1.0,49.92],[1.5,50.15],[1.58,50.5],[1.6,50.9],[1.85,50.96],[2.55,51.09]];

const GF_FRANCE  = [].concat(GF_B_BE, GF_B_LU, GF_B_DE, GF_B_CH, GF_B_IT, GF_C_MED, GF_B_ES, GF_C_ATL);
const GF_CORSICA = [[9.4,43.0],[9.47,42.8],[9.53,42.4],[9.4,42.0],[9.35,41.7],[9.2,41.38],[8.85,41.55],[8.62,41.9],[8.6,42.2],[8.7,42.57],[9.1,42.7],[9.3,42.95]];

const GF_SHAPES_OTHER = {
    paysbas:  [[3.37,51.37],[4.25,51.37],[5.0,51.45],[5.85,51.15],[5.75,51.0],[5.68,50.76],[6.02,50.76],[6.1,51.1],[6.2,51.4],[6.0,51.85],[6.8,51.95],[7.1,52.4],[4.4,52.4],[4.1,52.0],[3.6,51.6]],
    autriche: [[9.55,47.53],[9.9,47.55],[10.5,47.4],[11.3,47.5],[11.3,46.9],[10.45,46.9],[9.6,47.05]],
    sardaigne:[[8.2,40.4],[8.15,40.6],[8.25,40.95],[8.6,40.85],[9.2,41.25],[9.55,41.1],[9.7,40.8],[9.8,40.4]]
};

// ── Pays frontaliers ──────────────────────────────────────────────────────
const GF_COUNTRIES = [
    { id: 'belgique', name: 'Belgique', lbl: [4.55, 50.62], size: 1,
      shape: [].concat(GF_B_BE, [[5.9,49.75],[5.8,49.95],[6.1,50.15],[6.4,50.32],[6.05,50.72],[6.02,50.76],[5.68,50.76],[5.75,51.0],[5.85,51.15],[5.0,51.45],[4.25,51.37],[3.37,51.37]]),
      info: { capitale: 'Bruxelles', langues: 'néerlandais, français et allemand', fact: 'La frontière franco-belge mesure environ 620 km : c\'est la plus longue frontière terrestre de la France métropolitaine.' } },
    { id: 'luxembourg', name: 'Luxembourg', lbl: [6.12, 49.82], size: 0.62,
      shape: [].concat(GF_B_LU, [[6.52,49.75],[6.1,50.15],[5.8,49.95],[5.9,49.75]]),
      info: { capitale: 'Luxembourg', langues: 'luxembourgeois, français et allemand', fact: 'C\'est l\'un des plus petits pays d\'Europe. Beaucoup de Lorrains y travaillent chaque jour.' } },
    { id: 'allemagne', name: 'Allemagne', lbl: [8.75, 49.75], size: 1,
      shape: [].concat(GF_B_DE, [[8.2,47.6],[8.6,47.8],[9.0,47.68],[9.55,47.53],[9.9,47.55],[10.5,47.4],[11.3,47.5],[11.3,52.4],[7.1,52.4],[6.8,51.95],[6.0,51.85],[6.2,51.4],[6.1,51.1],[6.02,50.76],[6.05,50.72],[6.4,50.32],[6.1,50.15],[6.52,49.75]]),
      info: { capitale: 'Berlin', langues: 'allemand', fact: 'Le Rhin forme une grande partie de la frontière entre la France et l\'Allemagne, en Alsace.' } },
    { id: 'suisse', name: 'Suisse', lbl: [8.15, 46.82], size: 1,
      shape: [].concat(GF_B_CH, [[7.5,45.95],[7.9,45.95],[8.4,46.45],[8.6,46.1],[8.9,45.85],[9.05,45.83],[9.3,46.4],[9.5,46.3],[10.1,46.25],[10.45,46.55],[10.45,46.9],[9.6,47.05],[9.55,47.53],[9.0,47.68],[8.6,47.8],[8.2,47.6]]),
      info: { capitale: 'Berne', langues: 'allemand, français, italien et romanche', fact: 'La frontière franco-suisse passe par le massif du Jura et au milieu du lac Léman.' } },
    { id: 'italie', name: 'Italie', lbl: [8.9, 45.05], size: 1,
      shape: [].concat(GF_B_IT, [[8.0,43.88],[8.2,44.0],[8.45,44.3],[8.93,44.41],[9.5,44.2],[9.85,44.05],[10.2,43.9],[10.3,43.55],[10.5,43.0],[11.3,43.0],[11.3,46.9],[10.45,46.9],[10.45,46.55],[10.1,46.25],[9.5,46.3],[9.3,46.4],[9.05,45.83],[8.9,45.85],[8.6,46.1],[8.4,46.45],[7.9,45.95],[7.5,45.95],[7.05,45.92]]),
      info: { capitale: 'Rome', langues: 'italien', fact: 'La frontière franco-italienne suit la ligne de crête des Alpes, du Mont Blanc jusqu\'à Menton.' } },
    { id: 'monaco', name: 'Monaco', point: [7.42, 43.74], lbl: [7.62, 43.52], size: 0.6,
      info: { capitale: 'Monaco', langues: 'français', fact: 'C\'est le deuxième plus petit pays du monde (2 km²). Il est entièrement entouré par la France, sauf du côté de la mer.' } },
    { id: 'andorre', name: 'Andorre', lbl: [1.6, 42.3], size: 0.62,
      shape: [[1.78,42.58],[1.6,42.65],[1.45,42.6],[1.42,42.5],[1.55,42.43],[1.72,42.5]],
      info: { capitale: 'Andorre-la-Vieille', langues: 'catalan', fact: 'Petit pays perché dans les Pyrénées, entre la France et l\'Espagne. Le président de la République française en est l\'un des deux « coprinces ».' } },
    { id: 'espagne', name: 'Espagne', lbl: [-2.3, 42.25], size: 1,
      shape: [].concat([[-6.5,43.6],[-5.8,43.62],[-4.5,43.42],[-3.8,43.47],[-3.0,43.38],[-2.0,43.32]], _gfRev(GF_B_ES), [[3.3,42.25],[3.1,41.95],[2.8,41.7],[2.2,41.4],[1.5,41.15],[0.9,40.95],[0.6,40.4],[-6.5,40.4]]),
      info: { capitale: 'Madrid', langues: 'espagnol (castillan), catalan, basque, galicien', fact: 'La chaîne des Pyrénées forme une frontière naturelle entre la France et l\'Espagne.' } },
    { id: 'royaumeuni', name: 'Royaume-Uni', lbl: [-2.2, 51.25], size: 1,
      shape: [[-5.9,52.4],[-5.2,51.72],[-4.2,51.62],[-3.2,51.45],[-2.7,51.5],[-3.0,51.2],[-4.2,51.1],[-5.0,50.55],[-5.75,50.05],[-5.2,49.96],[-4.6,50.3],[-4.2,50.35],[-3.6,50.25],[-3.4,50.6],[-2.9,50.7],[-2.45,50.6],[-1.95,50.6],[-1.3,50.78],[-0.8,50.75],[0.25,50.75],[0.95,50.92],[1.38,51.15],[1.42,51.38],[0.6,51.45],[0.9,51.6],[1.3,51.85],[1.7,52.4]],
      info: { capitale: 'Londres', langues: 'anglais', fact: 'Pas de frontière terrestre avec la France métropolitaine : les deux pays sont séparés par la Manche et reliés par le tunnel sous la Manche (50 km).' } }
];

// ── Villes (10 communes les plus peuplées) ────────────────────────────────
const GF_CITIES = [
    { id: 'paris',       name: 'Paris',       p: [2.35, 48.86],  lp: 'r', rank: 1,  pop: '2,1 millions', region: 'Île-de-France', fleuve: 'la Seine', fact: 'Capitale de la France. Avec son agglomération, plus de 12 millions de personnes y vivent.' },
    { id: 'marseille',   name: 'Marseille',   p: [5.37, 43.30],  lp: 'b', rank: 2,  pop: '870 000', region: 'Provence-Alpes-Côte d\'Azur', fleuve: null, fact: 'Plus grand port de France, au bord de la mer Méditerranée. Fondée par les Grecs il y a 2 600 ans.' },
    { id: 'lyon',        name: 'Lyon',        p: [4.84, 45.76],  lp: 'l', rank: 3,  pop: '520 000', region: 'Auvergne-Rhône-Alpes', fleuve: 'le Rhône et la Saône', fact: 'Ville située au confluent (point de rencontre) du Rhône et de la Saône.' },
    { id: 'toulouse',    name: 'Toulouse',    p: [1.44, 43.60],  lp: 'r', rank: 4,  pop: '500 000', region: 'Occitanie', fleuve: 'la Garonne', fact: 'Surnommée « la ville rose » à cause de ses briques. Capitale européenne de l\'aéronautique (avions Airbus, fusées).' },
    { id: 'nice',        name: 'Nice',        p: [7.26, 43.70],  lp: 'l', rank: 5,  pop: '350 000', region: 'Provence-Alpes-Côte d\'Azur', fleuve: null, fact: 'Grande ville touristique de la Côte d\'Azur, entre mer et montagne, tout près de l\'Italie.' },
    { id: 'nantes',      name: 'Nantes',      p: [-1.55, 47.22], lp: 'b', rank: 6,  pop: '320 000', region: 'Pays de la Loire', fleuve: 'la Loire', fact: 'Ancienne capitale des ducs de Bretagne, située près de l\'embouchure de la Loire.' },
    { id: 'montpellier', name: 'Montpellier', p: [3.88, 43.61],  lp: 'r', rank: 7,  pop: '300 000', region: 'Occitanie', fleuve: null, fact: 'Ville universitaire très ancienne, à une dizaine de kilomètres de la mer Méditerranée.' },
    { id: 'strasbourg',  name: 'Strasbourg',  p: [7.75, 48.58],  lp: 'l', rank: 8,  pop: '290 000', region: 'Grand Est', fleuve: 'le Rhin (et l\'Ill)', fact: 'Ville frontière avec l\'Allemagne. Siège du Parlement européen.' },
    { id: 'bordeaux',    name: 'Bordeaux',    p: [-0.58, 44.84], lp: 'r', rank: 9,  pop: '260 000', region: 'Nouvelle-Aquitaine', fleuve: 'la Garonne', fact: 'Grand port sur la Garonne, célèbre dans le monde entier pour ses vins.' },
    { id: 'lille',       name: 'Lille',       p: [3.06, 50.63],  lp: 'b', rank: 10, pop: '235 000', region: 'Hauts-de-France', fleuve: null, fact: 'Grande ville du Nord, toute proche de la Belgique. Elle est reliée à Londres et Bruxelles par le TGV.' }
];

// ── Fleuves ───────────────────────────────────────────────────────────────
const GF_RIVERS = [
    { id: 'loire', name: 'Loire', lbl: [0.35, 47.62],
      path: [[4.22,44.84],[3.95,45.05],[4.05,45.25],[4.1,45.5],[4.07,46.04],[3.98,46.48],[3.45,46.83],[3.16,46.99],[2.95,47.3],[2.85,47.6],[2.63,47.68],[2.2,47.85],[1.9,47.9],[1.33,47.59],[0.69,47.39],[-0.08,47.26],[-0.55,47.38],[-1.0,47.35],[-1.55,47.21],[-2.2,47.27]],
      info: { longueur: '1 006 km', source: 'Mont Gerbier-de-Jonc (Massif central, Ardèche)', mer: 'l\'océan Atlantique (à Saint-Nazaire)', villes: 'Orléans, Blois, Tours, Angers, Nantes', fact: 'C\'est le plus long fleuve de France. On l\'appelle « le dernier fleuve sauvage d\'Europe ». Ses rives sont bordées de nombreux châteaux.' } },
    { id: 'seine', name: 'Seine', lbl: [3.55, 48.62],
      path: [[4.72,47.49],[4.57,47.86],[4.08,48.3],[3.5,48.5],[2.95,48.38],[2.65,48.54],[2.35,48.85],[2.1,48.95],[1.7,49.0],[1.4,49.2],[1.1,49.43],[0.75,49.43],[0.4,49.45],[0.15,49.45]],
      info: { longueur: '777 km', source: 'plateau de Langres (Côte-d\'Or)', mer: 'la Manche (au Havre)', villes: 'Troyes, Paris, Rouen, Le Havre', fact: 'Elle traverse Paris. C\'est un fleuve très utilisé pour transporter des marchandises en péniche.' } },
    { id: 'garonne', name: 'Garonne', lbl: [0.7, 44.32],
      path: [[0.95,42.65],[0.72,42.95],[0.72,43.1],[1.1,43.3],[1.44,43.6],[1.2,43.95],[0.62,44.2],[0.17,44.5],[-0.3,44.7],[-0.57,44.84],[-0.75,45.1],[-1.03,45.58]],
      info: { longueur: '529 km', source: 'val d\'Aran, dans les Pyrénées espagnoles', mer: 'l\'océan Atlantique, par l\'estuaire de la Gironde', villes: 'Toulouse, Agen, Bordeaux', fact: 'Après Bordeaux, elle rejoint la Dordogne pour former l\'estuaire de la Gironde, le plus grand estuaire d\'Europe occidentale.' } },
    { id: 'rhone', name: 'Rhône', lbl: [5.25, 44.55],
      path: [[8.38,46.58],[7.9,46.3],[7.36,46.23],[7.07,46.1],[6.9,46.35],[6.5,46.43],[6.15,46.21],[5.85,46.05],[5.8,45.75],[5.35,45.85],[4.85,45.76],[4.87,45.52],[4.85,45.2],[4.88,44.93],[4.73,44.55],[4.7,44.2],[4.8,43.95],[4.63,43.68],[4.75,43.38]],
      info: { longueur: '812 km (dont 545 km en France)', source: 'glacier du Rhône, dans les Alpes suisses', mer: 'la mer Méditerranée (delta de la Camargue)', villes: 'Genève, Lyon, Valence, Avignon, Arles', fact: 'C\'est le fleuve le plus puissant de France. Il traverse le lac Léman. De nombreux barrages et centrales électriques sont installés sur son cours.' } }
];
const GF_LEMAN = [[6.15,46.21],[6.3,46.33],[6.5,46.45],[6.8,46.43],[6.9,46.38],[6.7,46.38],[6.5,46.38],[6.25,46.25]];

// ── Massifs montagneux ────────────────────────────────────────────────────
const GF_MASSIFS = [
    { id: 'alpes', name: 'Alpes', lbl: [6.3, 44.95],
      shape: [[7.25,43.85],[6.5,43.95],[6.0,44.1],[5.5,44.35],[5.3,44.8],[5.45,45.3],[5.75,45.75],[6.2,46.15],[6.9,46.35],[7.6,46.45],[8.6,46.65],[9.6,46.9],[10.4,47.0],[10.4,46.1],[9.5,46.0],[8.6,45.9],[7.7,45.65],[7.3,45.2],[7.25,44.75],[7.6,44.3],[7.75,43.95]],
      info: { sommet: 'le Mont Blanc (4 806 m)', age: 'montagne jeune : sommets élevés, pointus et enneigés, glaciers', fact: 'Plus haute chaîne de montagnes d\'Europe. Elle s\'étend aussi en Italie, en Suisse, en Allemagne, en Autriche et au-delà. Grande région de sports d\'hiver.' } },
    { id: 'pyrenees', name: 'Pyrénées', lbl: [0.45, 42.6],
      shape: [[-1.6,43.25],[-1.0,43.15],[0.0,43.05],[1.0,42.95],[2.0,42.75],[3.0,42.55],[3.1,42.4],[2.5,42.2],[1.5,42.15],[0.5,42.3],[-0.5,42.55],[-1.3,42.85],[-1.8,43.05]],
      info: { sommet: 'l\'Aneto (3 404 m, en Espagne) ; côté français : le Vignemale (3 298 m)', age: 'montagne jeune : sommets élevés et escarpés', fact: 'Elles forment une frontière naturelle entre la France et l\'Espagne, de l\'océan Atlantique à la mer Méditerranée.' } },
    { id: 'massifcentral', name: 'Massif central', lbl: [3.05, 45.0],
      shape: [[2.3,46.1],[3.3,46.2],[4.3,45.9],[4.6,45.3],[4.5,44.6],[4.0,44.0],[3.3,43.6],[2.6,43.65],[2.0,44.2],[1.7,45.0],[1.6,45.6]],
      info: { sommet: 'le Puy de Sancy (1 885 m)', age: 'montagne ancienne : sommets arrondis, anciens volcans (chaîne des Puys)', fact: 'Il occupe le centre-sud de la France. Ses volcans sont endormis depuis des milliers d\'années. La Loire y prend sa source.' } },
    { id: 'jura', name: 'Jura', lbl: [6.35, 46.72],
      shape: [[5.55,46.25],[5.85,46.0],[6.15,46.2],[6.6,46.6],[7.1,47.0],[7.7,47.35],[7.5,47.55],[6.9,47.45],[6.3,47.2],[5.9,46.9],[5.55,46.6]],
      info: { sommet: 'le Crêt de la Neige (1 720 m)', age: 'montagne de moyenne altitude, aux plis réguliers', fact: 'Il est partagé entre la France et la Suisse. Il a donné son nom à une période de la préhistoire des dinosaures : le Jurassique.' } },
    { id: 'vosges', name: 'Vosges', lbl: [6.55, 48.2],
      shape: [[6.75,47.75],[7.15,47.85],[7.35,48.2],[7.35,48.6],[7.25,48.95],[7.0,48.9],[6.95,48.4],[6.7,48.0]],
      info: { sommet: 'le Grand Ballon (1 424 m)', age: 'montagne ancienne : sommets arrondis appelés « ballons »', fact: 'Elles séparent l\'Alsace de la Lorraine. Leurs forêts de sapins sont très étendues.' } }
];

// ── Mers et océan ─────────────────────────────────────────────────────────
const GF_SEAS = [
    { id: 'manche', name: 'Manche', lbl: [-2.6, 49.95],
      info: 'Bras de mer qui sépare la France du Royaume-Uni. C\'est l\'une des mers les plus fréquentées du monde par les bateaux. Elle connaît de très fortes marées (Mont-Saint-Michel).' },
    { id: 'merdunord', name: 'Mer du Nord', lbl: [2.35, 51.38],
      info: 'Mer peu profonde qui borde le nord de la France, la Belgique, les Pays-Bas, l\'Allemagne et le Royaume-Uni. Dunkerque est le principal port français sur cette mer.' },
    { id: 'atlantique', name: 'Océan Atlantique', lbl: [-3.9, 45.3], lines: ['Océan', 'Atlantique'],
      info: 'Le deuxième plus grand océan du monde. Il borde l\'ouest de la France, de la Bretagne au Pays basque. La Loire et la Garonne s\'y jettent.' },
    { id: 'mediterranee', name: 'Mer Méditerranée', lbl: [5.4, 42.35], lines: ['Mer', 'Méditerranée'],
      info: 'Mer presque fermée, entourée par l\'Europe, l\'Asie et l\'Afrique. Elle borde le sud de la France et la Corse. Ses marées sont très faibles. Le Rhône s\'y jette.' }
];

const GF_LAYERS = {
    villes:  { label: '🏙 Villes',   kindName: 'Ville' },
    fleuves: { label: '🌊 Fleuves',  kindName: 'Fleuve' },
    massifs: { label: '⛰ Massifs',  kindName: 'Massif montagneux' },
    pays:    { label: '🗺 Pays',     kindName: 'Pays frontalier' },
    mers:    { label: '⚓ Mers',     kindName: 'Mer / océan' }
};
const GF_COLORS = { villes: '#d63b3b', fleuves: '#2b7bd0', massifs: '#9a6a3a', pays: '#6b8f4e', mers: '#3b7fae' };

function _gfEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoFranceWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-france';
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
    container.className = 'gf-container';

    // Taille initiale : 70% de la largeur de la page
    const initW = Math.round(window.innerWidth * 0.7);
    container.style.width = initW + 'px';
    let mapH = Math.max(320, Math.round((initW * 0.72 - 30) * GF_H / GF_W));

    // En-tête
    const header = document.createElement('div');
    header.className = 'gf-header';
    header.innerHTML = `
        <span class="gf-title">🗺 Géographie de la France</span>
        <span class="gf-badge">Vue d'ensemble</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.gf-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'gf-controls';
    controls.innerHTML = `
        <button class="gf-btn gf-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈 Masquer les noms</button>
        <button class="gf-btn gf-btn-reveal" style="display:none">👁 Tout révéler</button>
        <button class="gf-btn gf-btn-home" title="Revenir à la carte entière">🔍 Vue d'ensemble</button>
        <div class="gf-layers">
            <span class="gf-layers-lbl">Afficher :</span>
            ${Object.keys(GF_LAYERS).map(k => `<button class="gf-layer-btn active" data-layer="${k}">${GF_LAYERS[k].label}</button>`).join('')}
        </div>
    `;
    const hideBtn   = controls.querySelector('.gf-btn-hide');
    const revealBtn = controls.querySelector('.gf-btn-reveal');
    const homeBtn   = controls.querySelector('.gf-btn-home');
    container.appendChild(controls);

    // Corps : carte + fiche
    const body = document.createElement('div');
    body.className = 'gf-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'gf-map-wrap';
    const side = document.createElement('div');
    side.className = 'gf-side';
    body.appendChild(mapWrap);
    body.appendChild(side);
    container.appendChild(body);

    // ── Construction de la carte SVG ──────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gf-map');
    svg.setAttribute('viewBox', `0 0 ${GF_W.toFixed(1)} ${GF_H.toFixed(1)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const clipId = 'gf-clip-' + Math.random().toString(36).slice(2, 8);
    svg.innerHTML = `
        <defs>
            <pattern id="gf-hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
                <rect width="9" height="9" fill="#c99a63" fill-opacity="0.38"></rect>
                <line x1="0" y1="0" x2="0" y2="9" stroke="#9a6a3a" stroke-width="2.2" stroke-opacity="0.45"></line>
            </pattern>
            <clipPath id="${clipId}"><rect x="0" y="0" width="${GF_W.toFixed(1)}" height="${GF_H.toFixed(1)}"></rect></clipPath>
        </defs>
        <rect x="-5000" y="-5000" width="12000" height="12000" fill="#cfe6f3"></rect>
        <g clip-path="url(#${clipId})">
            <g class="gf-g-land"></g>
            <g class="gf-g-countries"></g>
            <g class="gf-g-france"></g>
            <g class="gf-L-massifs gf-g-massifs"></g>
            <g class="gf-g-lake"></g>
            <g class="gf-L-fleuves gf-g-rivers"></g>
            <g class="gf-L-villes gf-g-cities"></g>
            <g class="gf-g-labels">
                <g class="gf-L-mers"></g>
                <g class="gf-L-pays"></g>
                <g class="gf-L-massifs"></g>
                <g class="gf-L-fleuves"></g>
                <g class="gf-L-villes"></g>
            </g>
        </g>
    `;
    mapWrap.appendChild(svg);

    const gLand      = svg.querySelector('.gf-g-land');
    const gCountries = svg.querySelector('.gf-g-countries');
    const gFrance    = svg.querySelector('.gf-g-france');
    const gMassifs   = svg.querySelector('.gf-g-massifs');
    const gLake      = svg.querySelector('.gf-g-lake');
    const gRivers    = svg.querySelector('.gf-g-rivers');
    const gCities    = svg.querySelector('.gf-g-cities');
    const gLabels    = {};
    ['mers', 'pays', 'massifs', 'fleuves', 'villes'].forEach(k => {
        gLabels[k] = svg.querySelector('.gf-g-labels .gf-L-' + k);
    });

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    const items = {};     // id -> { id, layer, name, data, shapes:[], label, zoom }
    const labels = [];    // { el, ax, ay, dx, dy, size, lines, item }
    const scalables = []; // cercles dont le rayon suit le zoom { el, r }

    function addLabel(item, layer, cls, lonlat, size, dx, dy, anchor, lines) {
        const [ax, ay] = _gfP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'gf-lbl ' + cls + ' gf-item', 'text-anchor': anchor || 'middle', 'data-id': item.id }, gLabels[layer]);
        const lb = { el: t, ax, ay, dx: dx || 0, dy: dy || 0, size, lines: lines || [item.name], item };
        labels.push(lb);
        item.label = lb;
        item.shapes.push(t);
        return lb;
    }

    // Terres non concernées (Pays-Bas, Autriche, Sardaigne)
    Object.values(GF_SHAPES_OTHER).forEach(pts => el('path', { class: 'gf-other', d: _gfPath(pts, true) }, gLand));

    // Pays frontaliers
    GF_COUNTRIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'pays', name: c.name, data: c, shapes: [] };
        if (c.shape) {
            it.shapes.push(el('path', { class: 'gf-country gf-item', d: _gfPath(c.shape, true), 'data-id': c.id }, gCountries));
        }
        const fs = 21 * (c.size || 1);
        addLabel(it, 'pays', 'gf-lbl-country', c.lbl, fs, 0, fs * 0.35, 'middle');
        it.zoom = { p: c.point || c.lbl, w: c.id === 'monaco' ? 260 : (c.size < 1 ? 320 : 520) };
    });

    // France métropolitaine
    el('path', { class: 'gf-france', d: _gfPath(GF_FRANCE, true) }, gFrance);
    el('path', { class: 'gf-france', d: _gfPath(GF_CORSICA, true) }, gFrance);

    // Monaco (point) — après la France pour rester visible
    (function () {
        const c = GF_COUNTRIES.find(x => x.id === 'monaco');
        const [x, y] = _gfP(c.point[0], c.point[1]);
        const circ = el('circle', { class: 'gf-monaco gf-item', cx: x, cy: y, r: 5, 'data-id': 'monaco' }, gCountries.parentNode);
        gFrance.after(circ);
        items.monaco.shapes.push(circ);
        scalables.push({ el: circ, r: 5 });
    })();

    // Massifs
    GF_MASSIFS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'massifs', name: m.name, data: m, shapes: [] };
        it.shapes.push(el('path', { class: 'gf-massif gf-item', d: _gfPath(m.shape, true), 'data-id': m.id }, gMassifs));
        addLabel(it, 'massifs', 'gf-lbl-massif', m.lbl, 21, 0, 7, 'middle', m.name === 'Massif central' ? ['Massif', 'central'] : null);
        it.zoom = { bbox: true };
    });

    // Lac Léman
    el('path', { class: 'gf-lake', d: _gfPath(GF_LEMAN, true) }, gLake);

    // Fleuves
    GF_RIVERS.forEach(r => {
        const it = items[r.id] = { id: r.id, layer: 'fleuves', name: r.name, data: r, shapes: [] };
        const d = _gfSmooth(r.path);
        it.shapes.push(el('path', { class: 'gf-river-hit gf-item', d, 'data-id': r.id }, gRivers));
        const line = el('path', { class: 'gf-river gf-item', d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, gRivers);
        it.shapes.push(line);
        it.mainShape = line;
        addLabel(it, 'fleuves', 'gf-lbl-river', r.lbl, 19, 0, 6, 'middle');
        it.zoom = { bbox: true };
    });

    // Villes
    GF_CITIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'villes', name: c.name, data: c, shapes: [] };
        const [x, y] = _gfP(c.p[0], c.p[1]);
        const r = c.id === 'paris' ? 8 : 6;
        const dot = el('circle', { class: 'gf-city gf-item', cx: x, cy: y, r, 'data-id': c.id }, gCities);
        it.shapes.push(dot);
        scalables.push({ el: dot, r });
        const pos = { r: [13, 6, 'start'], l: [-13, 6, 'end'], b: [0, 28, 'middle'] }[c.lp] || [13, 6, 'start'];
        addLabel(it, 'villes', 'gf-lbl-city', c.p, c.id === 'paris' ? 22 : 19, pos[0], pos[1], pos[2]);
        it.zoom = { p: c.p, w: 480 };
    });

    // Mers et océan
    GF_SEAS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'mers', name: m.name, data: m, shapes: [] };
        addLabel(it, 'mers', 'gf-lbl-sea', m.lbl, 18, 0, 6, 'middle', m.lines || null);
        it.zoom = { p: m.lbl, w: 600 };
    });

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gf-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gf-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Géographie de la France</h4>
        <p>La carte présente les <b>10 plus grandes villes</b>, les <b>4 grands fleuves</b>,
        les <b>5 massifs montagneux</b>, les <b>pays frontaliers</b> et les <b>mers</b>.</p>
        <p>👆 <b>Clique sur un élément</b> (ville, fleuve, massif, pays, mer) : la carte zoome
        dessus et sa fiche s'affiche à droite. Clique à nouveau dessus, ou sur
        <b>Vue d'ensemble</b>, pour revenir à la carte entière.</p>
        <p>🗂 <b>Afficher</b> : active ou désactive chaque catégorie d'éléments.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms sont remplacés par « ? ». Clique sur un élément
        pour dévoiler son nom. Idéal pour faire réviser les élèves !</p>
        <p style="color:#888">Les pays voisins ne sont montrés qu'en partie. Le tracé de la carte
        est simplifié. Redimensionne le widget avec le coin en bas à droite.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gf-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    const layers = { villes: true, fleuves: true, massifs: true, pays: true, mers: true };
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let vb = { x: 0, y: 0, w: GF_W, h: GF_H };
    let animId = null;

    // ── Vue (viewBox) ─────────────────────────────────────────────────────
    function aspect() {
        const w = svg.clientWidth, h = svg.clientHeight;
        return (w && h) ? w / h : GF_W / GF_H;
    }
    function fullView() {
        const a = aspect();
        if (a > GF_W / GF_H) { const w = GF_H * a; return { x: (GF_W - w) / 2, y: 0, w, h: GF_H }; }
        const h = GF_W / a; return { x: 0, y: (GF_H - h) / 2, w: GF_W, h };
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
            const shape = it.mainShape || it.shapes[0];
            const b = shape.getBBox();
            let x0 = Math.max(0, b.x), y0 = Math.max(0, b.y);
            let x1 = Math.min(GF_W, b.x + b.width), y1 = Math.min(GF_H, b.y + b.height);
            const pad = 0.18;
            const w = Math.max(220, (x1 - x0) * (1 + pad * 2));
            const h = Math.max(220, (y1 - y0) * (1 + pad * 2));
            return fitRect((x0 + x1) / 2, (y0 + y1) / 2, w, h);
        }
        const [cx, cy] = _gfP(it.zoom.p[0], it.zoom.p[1]);
        return fitRect(cx, cy, it.zoom.w, it.zoom.w * 0.8);
    }

    function setView(v) {
        vb = v;
        svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
        const s = Math.min(1, Math.pow(v.w / GF_W, 0.7));
        scalables.forEach(o => o.el.setAttribute('r', (o.r * s).toFixed(2)));
        labels.forEach(lb => {
            lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
            lb.el.setAttribute('stroke-width', (4 * s).toFixed(2));
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
        const t0 = performance.now(), dur = 450;
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
            lb.el.classList.toggle('gf-hidden', hidden);
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            const lines = hidden ? ['?'] : lb.lines;
            lines.forEach(line => {
                const t = document.createElementNS(NS, 'tspan');
                t.textContent = line;
                lb.el.appendChild(t);
            });
        });
        setView(vb);
    }

    // ── Sélection ─────────────────────────────────────────────────────────
    function applySelection() {
        svg.classList.toggle('gf-has-sel', !!selected);
        Object.values(items).forEach(it => {
            it.shapes.forEach(s => s.classList.toggle('gf-sel', it.id === selected));
        });
        const it = selected && items[selected];
        badge.textContent = it ? 'Zoom : ' + it.name : 'Vue d\'ensemble';
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
    function row(lbl, val) { return `<li><b>${lbl} :</b> ${_gfEsc(val)}</li>`; }

    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it) {
            side.style.borderLeftColor = '#9ca3af';
            const counts = { villes: GF_CITIES.length, fleuves: GF_RIVERS.length, massifs: GF_MASSIFS.length, pays: GF_COUNTRIES.length, mers: GF_SEAS.length };
            const sw = {
                villes:  'background:#d63b3b;border-radius:50%;width:14px;height:14px;margin:0 4px;',
                fleuves: 'background:#2b7bd0;height:4px;',
                massifs: 'background:repeating-linear-gradient(45deg,#c99a63 0 3px,#e6cfae 3px 6px);',
                pays:    'background:#e4e6dc;border:1px solid #b9bdae;',
                mers:    'background:#cfe6f3;border:1px solid #9cc3dc;'
            };
            const names = { villes: 'grandes villes', fleuves: 'grands fleuves', massifs: 'massifs montagneux', pays: 'pays frontaliers', mers: 'mers et océan' };
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">France métropolitaine</h4>
                <div class="gf-hint">Clique sur un élément de la carte pour zoomer dessus et découvrir sa fiche.</div>
                ${Object.keys(names).map(k => `
                    <div class="gf-legend-row" style="opacity:${layers[k] ? 1 : .35}">
                        <span class="gf-sw" style="${sw[k]}"></span>
                        <span><b>${counts[k]}</b> ${names[k]}</span>
                    </div>`).join('')}
                <p style="margin-top:10px;color:#6b7280">Capitale : <b>Paris</b><br>Environ <b>66 millions</b> d'habitants en métropole.</p>
            `;
            return;
        }
        const color = GF_COLORS[it.layer];
        const d = it.data;
        side.style.borderLeftColor = color;
        let html = `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${color}">${_gfEsc(it.name)}</h4>`;
        html += `<div class="gf-kind">${GF_LAYERS[it.layer].kindName}</div>`;
        if (it.layer === 'villes') {
            html += '<ul>' + row('Rang', d.rank === 1 ? '1re ville de France' : d.rank + 'e ville de France')
                + row('Habitants', 'environ ' + d.pop)
                + row('Région', d.region)
                + (d.fleuve ? row('Fleuve / rivière', d.fleuve) : row('Littoral', d.id === 'lille' ? 'non (ville du Nord)' : 'proche de la mer Méditerranée'))
                + '</ul>';
            html += `<p>${_gfEsc(d.fact)}</p>`;
        } else if (it.layer === 'fleuves') {
            const i = d.info;
            html += '<ul>' + row('Longueur', i.longueur) + row('Source', i.source) + row('Se jette dans', i.mer) + row('Villes traversées', i.villes) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'massifs') {
            const i = d.info;
            html += '<ul>' + row('Plus haut sommet', i.sommet) + row('Type', i.age) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'pays') {
            const i = d.info;
            html += '<ul>' + row('Capitale', i.capitale) + row('Langue(s)', i.langues) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'mers') {
            html += `<p>${_gfEsc(d.info)}</p>`;
        }
        html += `<button class="gf-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        const back = side.querySelector('.gf-back-btn');
        back.addEventListener('mousedown', (e) => e.stopPropagation());
        back.addEventListener('click', (e) => { e.stopPropagation(); select(null); saveBoard(); });
    }

    // ── Calques ───────────────────────────────────────────────────────────
    function applyLayers() {
        Object.keys(layers).forEach(k => svg.classList.toggle('gf-off-' + k, !layers[k]));
        controls.querySelectorAll('.gf-layer-btn').forEach(b => b.classList.toggle('active', !!layers[b.dataset.layer]));
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
    // Gestion « tap » compatible souris, doigt et stylet (vidéoprojecteur
    // interactif, TBI). Le stylet envoie des événements pointer/touch : si le
    // déplacement du widget les intercepte, le « click » n'arrive jamais sur
    // l'élément. On détecte donc nous-mêmes le tap (pointerdown → pointerup),
    // avec une tolérance de mouvement, et on garde le click en secours.
    const _TAP_TOL = 20;          // px de tremblement toléré pour le stylet
    let _lastTapAt = 0;
    const _itemFrom = (target) => {
        const t = target && target.closest ? target.closest('[data-id]') : null;
        return (t && svg.contains(t)) ? t : null;
    };
    const _activate = (t) => {
        const now = Date.now();
        if (now - _lastTapAt < 450) return;   // évite le double déclenchement pointerup + click
        _lastTapAt = now;
        onItemClick(t.getAttribute('data-id'));
    };
    const _stopIfItem = (e) => {
        if (e.target.closest && e.target.closest('.gf-item')) e.stopPropagation();
    };
    svg.addEventListener('mousedown', _stopIfItem);
    svg.addEventListener('touchstart', _stopIfItem, { passive: true });
    svg.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;   // clic droit / milieu
        const t = _itemFrom(e.target);
        if (!t) return;
        e.stopPropagation();
        const pid = e.pointerId, x0 = e.clientX, y0 = e.clientY;
        const cleanup = () => {
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', cleanup, true);
        };
        const onUp = (ev) => {
            if (ev.pointerId !== pid) return;
            cleanup();
            if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > _TAP_TOL) return;
            _activate(t);
        };
        // écoute sur window (phase de capture) : fonctionne même si un autre
        // script a capturé le pointeur entre-temps
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('pointercancel', cleanup, true);
    });
    svg.addEventListener('click', (e) => {
        const t = _itemFrom(e.target);
        if (!t) return;
        e.stopPropagation();
        _activate(t);
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
    controls.querySelectorAll('.gf-layer-btn').forEach(b => {
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

    function applySize() {
        mapWrap.style.height = mapH + 'px';
    }

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
        window._wfMiniBarCollapse(widget, '🗺 Géographie de la France', {
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
    widget._gfGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        mapH:       _isMax && _savedH ? _savedH : mapH,
        layers:     { ...layers },
        hideNames,
        revealed:   Array.from(revealed),
        selected
    });
    widget._gfSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.mapH) mapH = Math.max(240, d.mapH);
        applySize();
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(id => items[id]));
        setHideNames(!!d.hideNames);
        selected = (d.selected && items[d.selected]) ? d.selected : null;
        applyLayers();
        applySelection();
        requestAnimationFrame(() => { setView(targetView()); renderSide(); });
    };

    saveBoard();
    return widget;
}
