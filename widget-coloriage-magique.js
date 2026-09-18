// =========================================================================
// WIDGET COLORIAGE MAGIQUE — Le Bureau du Prof
// Génère un coloriage magique de calcul mental (+ / −) à imprimer en PDF.
// L'élève calcule chaque opération, trouve la couleur correspondant au
// résultat dans la légende, et colorie la case : l'image apparaît !
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
(function () {

    // Boutons fenêtre macOS (partagés entre widgets — redéfinis seulement si absents)
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

    if (document.getElementById('cm-style')) return;
    const s = document.createElement('style');
    s.id = 'cm-style';
    s.textContent = `
        /* ── Widget wrapper ── */
        .widget[data-type="coloriage-magique"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .cm-container {
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
        .cm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .cm-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex: 1;
        }

        /* ── Barre d'outils / paramètres ── */
        .cm-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            background: #f3f4f6;
            border-radius: 10px;
            padding: 8px 9px;
        }
        .cm-field {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1 1 130px;
            min-width: 110px;
        }
        .cm-field-label {
            font-size: 9px;
            color: #6b7280;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }
        .cm-select {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            padding: 5px 6px;
            background: #fff;
            cursor: pointer;
        }
        .cm-select:hover { background: #f9fafb; }

        .cm-gridsize-wrap {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }
        .cm-gridsize-label {
            font-size: 9px;
            color: #6b7280;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }
        .cm-gridsize-stepper {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .cm-gridsize-btn {
            width: 24px; height: 24px;
            border-radius: 6px;
            border: 1.5px solid #d1d5db;
            background: #fff;
            font-size: 15px;
            font-weight: 900;
            color: #374151;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            line-height: 1;
            transition: background .12s, transform .1s;
            flex-shrink: 0;
            touch-action: manipulation;
        }
        .cm-gridsize-btn:hover { background: #e5e7eb; }
        .cm-gridsize-btn:active { transform: scale(0.9); background: #d1d5db; }
        .cm-gridsize-val {
            min-width: 24px;
            text-align: center;
            font-size: 12px;
            font-weight: 800;
            color: #374151;
            user-select: none;
        }
        .cm-gridsize-input { display: none; }

        /* ── Zone SVG (aperçu) ── */
        .cm-svg-zone {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px;
            overflow: hidden;
        }
        .cm-svg {
            background: white;
            display: block;
            border: 1px solid #e5e7eb;
            max-width: 100%;
            height: auto;
        }

        /* ── Légende ── */
        .cm-legend {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            background: #fafafa;
            border: 1.5px solid #eee;
            border-radius: 10px;
            padding: 6px 10px;
        }
        .cm-legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .cm-swatch {
            width: 14px; height: 14px;
            border-radius: 4px;
            border: 1px solid rgba(0,0,0,0.15);
            flex-shrink: 0;
        }
        .cm-legend-val {
            font-size: 12px;
            font-weight: 800;
            color: #374151;
        }

        /* ── Actions ── */
        .cm-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-end;
        }
        .cm-action-btn {
            padding: 5px 11px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .cm-action-btn:active { transform: scale(0.96); }
        .cm-btn-pdf {
            background: #3b82f6;
            color: white;
        }
        .cm-btn-pdf:hover { background: #2563eb; }
        .cm-btn-regen {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .cm-btn-regen:hover { background: #e0e0e0; }
        .cm-btn-toggle {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .cm-btn-toggle:hover { background: #e0e0e0; }
        .cm-btn-toggle.active {
            background: #fbbc04;
            color: #3b3000;
            border-color: #e0a800;
        }

        /* ── Bouton aide ── */
        .cm-help-btn {
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
        .cm-help-btn:hover { background: #e0e0e0; color: #333; }
        .cm-help-popup {
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
        .cm-help-popup.show { display: block; }
        .cm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .cm-help-section { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .cm-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Fullboard ── */
        .cm-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        .cm-container.wf-fullboard .cm-svg-zone {
            flex: 1;
        }

        /* ── Resize handle ── */
        .cm-resize-handle {
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
        .cm-container:hover .cm-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Constantes internes ───────────────────────────────────────────────────
const CM_INTERNAL_SIZE = 600;
const CM_PALETTE = ['#F28B82', '#FBBC04', '#FFF176', '#81C995', '#8AB4F8']; // rouge, orange, jaune, vert, bleu

// ── Thèmes (formes calculées géométriquement) ─────────────────────────────
function cmPointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
function cmBuildStarPolygon(points, outerR, innerR) {
    const verts = [];
    for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / points;
        const r = i % 2 === 0 ? outerR : innerR;
        verts.push([r * Math.cos(angle), r * Math.sin(angle)]);
    }
    return verts;
}
const CM_STAR_POLY = cmBuildStarPolygon(5, 0.95, 0.42);

function cmInsideHeart(cx, cy) {
    const x = cx * 1.15, y = -cy * 1.15;
    const v = Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3);
    return v <= 0;
}
function cmInsideStar(cx, cy) {
    return cmPointInPolygon(cx, cy, CM_STAR_POLY);
}
function cmInsideSapin(cx, cy) {
    const ty = (cy + 1) / 2; // 0 = haut, 1 = bas
    if (ty >= 0.82 && ty <= 0.95) return Math.abs(cx) <= 0.07; // tronc
    const tiers = [
        { top: 0.05, bot: 0.35, w: 0.30 },
        { top: 0.32, bot: 0.58, w: 0.46 },
        { top: 0.55, bot: 0.82, w: 0.64 }
    ];
    for (const t of tiers) {
        if (ty >= t.top && ty <= t.bot) {
            const width = t.w * (ty - t.top) / (t.bot - t.top);
            return Math.abs(cx) <= width;
        }
    }
    return false;
}
function cmInsideFleur(cx, cy) {
    const r = Math.sqrt(cx * cx + cy * cy);
    if (r < 0.13) return true; // cœur de la fleur
    const theta = Math.atan2(cy, cx);
    const boundary = 0.15 + 0.68 * Math.pow(Math.abs(Math.cos(2.5 * theta)), 0.7);
    return r <= boundary;
}
function cmInsideButterfly(cx, cy) {
    const ax = Math.abs(cx);
    if (ax <= 0.05) return true; // corps
    const uw = Math.pow((ax - 0.42) / 0.46, 2) + Math.pow((cy + 0.26) / 0.40, 2);
    if (uw <= 1) return true; // aile du haut
    const lw = Math.pow((ax - 0.28) / 0.34, 2) + Math.pow((cy - 0.34) / 0.32, 2);
    if (lw <= 1) return true; // aile du bas
    return false;
}
function cmInsideFish(cx, cy) {
    const body = Math.pow((cx + 0.15) / 0.55, 2) + Math.pow(cy / 0.38, 2);
    if (body <= 1) return true;
    if (cx >= 0.35 && cx <= 0.95) {
        const t = (cx - 0.35) / 0.6;
        const halfW = 0.38 * (1 - t);
        if (Math.abs(cy) <= halfW) return true;
    }
    return false;
}

const CM_THEMES = {
    coeur:    { label: '❤️ Cœur',           name: 'Cœur',            inside: cmInsideHeart },
    etoile:   { label: '⭐ Étoile',          name: 'Étoile',          inside: cmInsideStar },
    sapin:    { label: '🎄 Sapin de Noël',   name: 'Sapin de Noël',   inside: cmInsideSapin },
    fleur:    { label: '🌸 Fleur',           name: 'Fleur',           inside: cmInsideFleur },
    papillon: { label: '🦋 Papillon',        name: 'Papillon',        inside: cmInsideButterfly },
    poisson:  { label: '🐠 Poisson',         name: 'Poisson',         inside: cmInsideFish }
};

const CM_DIFF = {
    '1': { label: '⭐ Facile (jusqu\'à 5)',    oMin: 1, oMax: 5 },
    '2': { label: '⭐⭐ Moyen (jusqu\'à 10)',    oMin: 1, oMax: 10 },
    '3': { label: '⭐⭐⭐ Avancé (jusqu\'à 20)',  oMin: 2, oMax: 20 },
    '4': { label: '⭐⭐⭐⭐ Expert (jusqu\'à 50)', oMin: 5, oMax: 50 }
};

const CM_OPS = {
    add:   { label: '➕ Addition' },
    sub:   { label: '➖ Soustraction' },
    mixed: { label: '➕➖ Addition et soustraction' }
};

// ── RNG déterministe (mulberry32) ─────────────────────────────────────────
function cmMulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Choix des valeurs-cibles de la légende ────────────────────────────────
function cmPickTargets(minR, maxR, K, rng) {
    minR = Math.max(1, Math.floor(minR));
    maxR = Math.max(minR + K - 1, Math.floor(maxR));
    const span = maxR - minR;
    const vals = [];
    for (let i = 0; i < K; i++) {
        const base = minR + (span * (i + 0.5)) / K;
        const jitter = (rng() - 0.5) * (span / K) * 0.6;
        let v = Math.round(base + jitter);
        v = Math.max(minR, Math.min(maxR, v));
        vals.push(v);
    }
    vals.sort((a, b) => a - b);
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] <= vals[i - 1]) vals[i] = vals[i - 1] + 1;
    }
    if (vals[vals.length - 1] > maxR) {
        const shift = vals[vals.length - 1] - maxR;
        for (let i = 0; i < vals.length; i++) vals[i] -= shift;
        if (vals[0] < 1) {
            const s2 = 1 - vals[0];
            for (let i = 0; i < vals.length; i++) vals[i] += s2;
        }
    }
    return vals;
}

// ── Génération d'une opération dont le résultat = target ──────────────────
function cmGenOp(target, opMode, oMin, oMax, rng) {
    for (let i = 0; i < 80; i++) {
        const useAdd = opMode === 'add' ? true : opMode === 'sub' ? false : rng() < 0.5;
        if (useAdd) {
            const aMin = Math.max(oMin, target - oMax);
            const aMax = Math.min(oMax, target - oMin);
            if (aMin > aMax) continue;
            const a = aMin + Math.floor(rng() * (aMax - aMin + 1));
            const b = target - a;
            if (b < oMin || b > oMax) continue;
            return { a, b, op: '+', result: target };
        } else {
            const aCap = oMax * 2;
            const bMin = oMin;
            const bMax = Math.min(oMax, aCap - target);
            if (bMax < bMin) continue;
            const b = bMin + Math.floor(rng() * (bMax - bMin + 1));
            const a = target + b;
            if (a < oMin || a > aCap) continue;
            return { a, b, op: '−', result: target };
        }
    }
    if (opMode === 'sub') return { a: target, b: 0, op: '−', result: target };
    return { a: target, b: 0, op: '+', result: target };
}

// ── Génération complète du puzzle ─────────────────────────────────────────
function cmGeneratePuzzle(theme, opMode, diffLevel, gridSize, seed) {
    const rng = cmMulberry32(seed);
    const diff = CM_DIFF[diffLevel] || CM_DIFF['2'];
    const themeObj = CM_THEMES[theme] || CM_THEMES['coeur'];
    const K = CM_PALETTE.length;

    let minR, maxR;
    if (opMode === 'add') { minR = diff.oMin * 2; maxR = diff.oMax * 2; }
    else if (opMode === 'sub') { minR = 1; maxR = Math.max(2, diff.oMax - diff.oMin); }
    else { minR = 1; maxR = diff.oMax * 2; }

    const targets = cmPickTargets(minR, maxR, K, rng);
    const N = gridSize;
    const cells = [];
    for (let row = 0; row < N; row++) {
        for (let col = 0; col < N; col++) {
            const cx = ((col + 0.5) / N) * 2 - 1;
            const cy = ((row + 0.5) / N) * 2 - 1;
            if (!themeObj.inside(cx, cy)) continue;
            const r = Math.sqrt(cx * cx + cy * cy);
            let zone = Math.floor((r / 1.05) * K);
            zone = Math.max(0, Math.min(K - 1, zone));
            const target = targets[zone];
            const g = cmGenOp(target, opMode, diff.oMin, diff.oMax, rng);
            cells.push({ row, col, zone, a: g.a, b: g.b, op: g.op, result: g.result });
        }
    }
    return { theme, opMode, diffLevel, gridSize: N, seed, targets, cells };
}

// ── Rendu du puzzle dans un <svg> (aperçu écran ET export PDF) ────────────
function cmRenderIntoSVG(svgEl, puzzle, showColor) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    if (!puzzle) return;
    const N = puzzle.gridSize;
    const cell = CM_INTERNAL_SIZE / N;
    const fontSize = Math.max(6, Math.min(11, cell * 0.34));
    const frag = document.createDocumentFragment();
    puzzle.cells.forEach(c => {
        const x = c.col * cell, y = c.row * cell;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x); rect.setAttribute('y', y);
        rect.setAttribute('width', cell); rect.setAttribute('height', cell);
        rect.setAttribute('fill', showColor ? CM_PALETTE[c.zone] : '#ffffff');
        rect.setAttribute('stroke', '#c7ccd3');
        rect.setAttribute('stroke-width', '0.6');
        frag.appendChild(rect);
        if (!showColor) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + cell / 2);
            text.setAttribute('y', y + cell / 2 + fontSize * 0.33);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', fontSize);
            text.setAttribute('font-family', "'Segoe UI', sans-serif");
            text.setAttribute('font-weight', '600');
            text.setAttribute('fill', '#374151');
            text.textContent = `${c.a}${c.op}${c.b}`;
            frag.appendChild(text);
        }
    });
    svgEl.appendChild(frag);
}

function cmSortedZoneIndices(puzzle) {
    return puzzle.targets.map((v, i) => i).sort((a, b) => puzzle.targets[a] - puzzle.targets[b]);
}

function cmRenderLegend(container, puzzle) {
    container.innerHTML = '';
    if (!puzzle) return;
    cmSortedZoneIndices(puzzle).forEach(zoneIdx => {
        const item = document.createElement('div');
        item.className = 'cm-legend-item';
        const swatch = document.createElement('span');
        swatch.className = 'cm-swatch';
        swatch.style.background = CM_PALETTE[zoneIdx];
        const val = document.createElement('span');
        val.className = 'cm-legend-val';
        val.textContent = '= ' + puzzle.targets[zoneIdx];
        item.appendChild(swatch);
        item.appendChild(val);
        container.appendChild(item);
    });
}

function cmHexToRgb(hex) {
    const v = hex.replace('#', '');
    return { r: parseInt(v.substring(0, 2), 16), g: parseInt(v.substring(2, 4), 16), b: parseInt(v.substring(4, 6), 16) };
}

// ── Création du widget ────────────────────────────────────────────────────
function createColoriageMagiqueWidget(savedData) {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'coloriage-magique';
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

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'cm-container';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'cm-header';
    header.innerHTML = `
        <span class="cm-title">🖍️ Coloriage magique</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const helpBtn = document.createElement('button');
    helpBtn.className = 'cm-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    header.querySelector('.wf-btns').insertBefore(helpBtn, header.querySelector('.wf-btn-min'));
    container.appendChild(header);

    // ── Popup aide ────────────────────────────────────────────────────────
    const helpPopup = document.createElement('div');
    helpPopup.className = 'cm-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Mode d'emploi</h4>
        <div class="cm-help-section">
            <strong>🎨 Thème</strong><br>
            Choisissez l'image qui apparaîtra une fois le coloriage terminé.
        </div>
        <div class="cm-help-section">
            <strong>➕➖ Opération / Difficulté</strong><br>
            Choisissez le type de calcul et la plage de nombres utilisée.
        </div>
        <div class="cm-help-section">
            <strong>🔄 Régénérer</strong><br>
            Tire un nouveau jeu d'opérations pour les mêmes réglages.
        </div>
        <div class="cm-help-section">
            <strong>👁️ Aperçu couleur</strong><br>
            Affiche le résultat colorié à l'écran (non imprimé).
        </div>
        <div class="cm-help-section">
            <strong>📄 PDF</strong><br>
            Génère une fiche élève (à calculer et colorier) et une page corrigé pour l'enseignant.
        </div>
    `;
    container.appendChild(helpPopup);

    // ── Barre de paramètres ──────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.className = 'cm-toolbar';
    toolbar.innerHTML = `
        <div class="cm-field">
            <span class="cm-field-label">Thème</span>
            <select class="cm-select cm-theme-select">
                ${Object.entries(CM_THEMES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
        </div>
        <div class="cm-field">
            <span class="cm-field-label">Opération</span>
            <select class="cm-select cm-op-select">
                ${Object.entries(CM_OPS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
        </div>
        <div class="cm-field">
            <span class="cm-field-label">Difficulté</span>
            <select class="cm-select cm-diff-select">
                ${Object.entries(CM_DIFF).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}
            </select>
        </div>
        <div class="cm-gridsize-wrap">
            <span class="cm-gridsize-label">Finesse</span>
            <div class="cm-gridsize-stepper">
                <button class="cm-gridsize-btn" data-step="-2" title="Moins de détails">−</button>
                <span class="cm-gridsize-val">20</span>
                <button class="cm-gridsize-btn" data-step="2" title="Plus de détails">+</button>
            </div>
            <input type="number" class="cm-gridsize-input" value="20" min="12" max="30" step="1" title="Nombre de cases">
        </div>
    `;
    container.appendChild(toolbar);

    // ── Zone SVG ──────────────────────────────────────────────────────────
    const svgZone = document.createElement('div');
    svgZone.className = 'cm-svg-zone';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('cm-svg');
    svg.setAttribute('viewBox', `0 0 ${CM_INTERNAL_SIZE} ${CM_INTERNAL_SIZE}`);
    svg.style.width  = '470px';
    svg.style.height = '470px';
    svgZone.appendChild(svg);
    container.appendChild(svgZone);

    // ── Légende ───────────────────────────────────────────────────────────
    const legendEl = document.createElement('div');
    legendEl.className = 'cm-legend';
    container.appendChild(legendEl);

    // ── Actions ───────────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'cm-actions';
    actions.innerHTML = `
        <button class="cm-action-btn cm-btn-regen" title="Nouveau tirage">🔄 Régénérer</button>
        <button class="cm-action-btn cm-btn-toggle" title="Aperçu colorié">👁️ Aperçu couleur</button>
        <button class="cm-action-btn cm-btn-pdf" title="Générer le PDF">📄 PDF</button>
    `;
    container.appendChild(actions);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'cm-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAT INTERNE
    // ══════════════════════════════════════════════════════════════════════
    const themeSelect = toolbar.querySelector('.cm-theme-select');
    const opSelect     = toolbar.querySelector('.cm-op-select');
    const diffSelect   = toolbar.querySelector('.cm-diff-select');
    const gridSizeInput = toolbar.querySelector('.cm-gridsize-input');
    const gridSizeVal   = toolbar.querySelector('.cm-gridsize-val');
    const regenBtn   = actions.querySelector('.cm-btn-regen');
    const toggleBtn  = actions.querySelector('.cm-btn-toggle');
    const pdfBtn     = actions.querySelector('.cm-btn-pdf');

    diffSelect.value = '2';
    let cmPuzzle = null;
    let showColorPreview = false;

    function updateToggleBtn() {
        toggleBtn.classList.toggle('active', showColorPreview);
    }

    function autoSave() {
        if (typeof saveBoard === 'function') saveBoard();
    }

    function regenerate(keepSeed) {
        const theme = themeSelect.value;
        const opMode = opSelect.value;
        const diffLevel = diffSelect.value;
        const gridSize = parseInt(gridSizeInput.value) || 20;
        const seed = (keepSeed && cmPuzzle) ? cmPuzzle.seed : Math.floor(Math.random() * 1e9);
        cmPuzzle = cmGeneratePuzzle(theme, opMode, diffLevel, gridSize, seed);
        cmRenderIntoSVG(svg, cmPuzzle, showColorPreview);
        cmRenderLegend(legendEl, cmPuzzle);
        autoSave();
    }

    function rerender() {
        cmRenderIntoSVG(svg, cmPuzzle, showColorPreview);
        cmRenderLegend(legendEl, cmPuzzle);
    }

    // ── Récupérer / restaurer les données ─────────────────────────────────
    function getData() {
        if (!cmPuzzle) return null;
        return {
            theme: cmPuzzle.theme,
            opMode: cmPuzzle.opMode,
            diffLevel: cmPuzzle.diffLevel,
            gridSize: cmPuzzle.gridSize,
            seed: cmPuzzle.seed,
            svgW: parseInt(svg.style.width) || 470,
            colorPreview: showColorPreview
        };
    }
    function setData(data) {
        if (!data) { regenerate(false); return; }
        if (data.theme) themeSelect.value = data.theme;
        if (data.opMode) opSelect.value = data.opMode;
        if (data.diffLevel) diffSelect.value = data.diffLevel;
        if (data.gridSize) { gridSizeInput.value = data.gridSize; gridSizeVal.textContent = data.gridSize; }
        if (data.svgW) { svg.style.width = data.svgW + 'px'; svg.style.height = data.svgW + 'px'; }
        showColorPreview = !!data.colorPreview;
        updateToggleBtn();
        const seed = (data.seed !== undefined && data.seed !== null) ? data.seed : Math.floor(Math.random() * 1e9);
        cmPuzzle = cmGeneratePuzzle(themeSelect.value, opSelect.value, diffSelect.value, parseInt(gridSizeInput.value) || 20, seed);
        rerender();
    }

    // ── Export PDF (fiche élève + corrigé enseignant) ─────────────────────
    async function exportPDF() {
        if (!cmPuzzle) return;
        if (!window.jspdf) {
            await new Promise((res, rej) => {
                const sc = document.createElement('script');
                sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                sc.onload = res; sc.onerror = rej;
                document.head.appendChild(sc);
            });
        }
        const { jsPDF } = window.jspdf;

        const rasterize = async (showColor) => {
            const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            tmp.setAttribute('viewBox', `0 0 ${CM_INTERNAL_SIZE} ${CM_INTERNAL_SIZE}`);
            tmp.setAttribute('width', CM_INTERNAL_SIZE);
            tmp.setAttribute('height', CM_INTERNAL_SIZE);
            cmRenderIntoSVG(tmp, cmPuzzle, showColor);
            const xml = new XMLSerializer().serializeToString(tmp);
            const img = new Image();
            return new Promise(resolve => {
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1400;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1400, 1400);
                    ctx.drawImage(img, 0, 0, 1400, 1400);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
            });
        };

        const imgStudent = await rasterize(false);
        const imgCorrection = await rasterize(true);

        const themeObj = CM_THEMES[cmPuzzle.theme] || {};
        const themeName = themeObj.name || cmPuzzle.theme;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageW = 210;

        // ── Page élève ──
        pdf.setFontSize(16); pdf.setTextColor(40);
        pdf.text(`Coloriage magique : ${themeName}`, pageW / 2, 18, { align: 'center' });
        pdf.setFontSize(10); pdf.setTextColor(90);
        pdf.text("Calcule chaque opération, puis colorie la case selon le code couleur ci-dessous.", pageW / 2, 25, { align: 'center' });

        const sortedIdx = cmSortedZoneIndices(cmPuzzle);
        const sw = 6, gap = 26;
        const legendY = 32;
        const totalW = sortedIdx.length * gap;
        let lx = pageW / 2 - totalW / 2;
        sortedIdx.forEach(zoneIdx => {
            const rgb = cmHexToRgb(CM_PALETTE[zoneIdx]);
            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.rect(lx, legendY, sw, sw, 'F');
            pdf.setDrawColor(180); pdf.rect(lx, legendY, sw, sw);
            pdf.setFontSize(11); pdf.setTextColor(40);
            pdf.text(`= ${cmPuzzle.targets[zoneIdx]}`, lx + sw + 2, legendY + sw - 1);
            lx += gap;
        });

        const imgSize = 168;
        const imgX = (pageW - imgSize) / 2;
        pdf.addImage(imgStudent, 'PNG', imgX, 44, imgSize, imgSize);

        // ── Page corrigé ──
        pdf.addPage();
        pdf.setFontSize(16); pdf.setTextColor(40);
        pdf.text("Corrigé (pour l'enseignant)", pageW / 2, 18, { align: 'center' });
        pdf.addImage(imgCorrection, 'PNG', imgX, 30, imgSize, imgSize);

        const date = new Date();
        const ds = date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
        const name = `lebureauduprof_coloriage_magique_${cmPuzzle.theme}_${ds}.pdf`;
        if (window.Android && typeof window.Android.savePdfFromBase64 === 'function') {
            window.Android.savePdfFromBase64(pdf.output('datauristring').split(',')[1], name);
        } else {
            pdf.save(name);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ══════════════════════════════════════════════════════════════════════
    [themeSelect, opSelect, diffSelect].forEach(sel => {
        sel.addEventListener('mousedown', e => e.stopPropagation());
        sel.addEventListener('pointerdown', e => e.stopPropagation());
        sel.addEventListener('click', e => e.stopPropagation());
        sel.addEventListener('change', () => regenerate(false));
    });

    gridSizeInput.addEventListener('mousedown',   e => e.stopPropagation());
    gridSizeInput.addEventListener('click',       e => e.stopPropagation());
    gridSizeInput.addEventListener('pointerdown', e => e.stopPropagation());
    toolbar.querySelectorAll('.cm-gridsize-btn').forEach(btn => {
        btn.addEventListener('pointerdown', e => e.stopPropagation());
        btn.addEventListener('mousedown',   e => e.stopPropagation());
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            const step = parseInt(btn.dataset.step) || 0;
            const min  = parseInt(gridSizeInput.min) || 12;
            const max  = parseInt(gridSizeInput.max) || 30;
            const cur  = parseInt(gridSizeInput.value) || 20;
            const next = Math.min(max, Math.max(min, cur + step));
            if (next !== cur) {
                gridSizeInput.value = next;
                gridSizeVal.textContent = next;
                regenerate(false);
            }
        });
    });

    regenBtn.addEventListener('click', (e) => { e.stopPropagation(); regenerate(false); });
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showColorPreview = !showColorPreview;
        updateToggleBtn();
        rerender();
        autoSave();
    });
    pdfBtn.addEventListener('click', (e) => { e.stopPropagation(); exportPDF(); });

    // Aide
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Resize (poignée coin bas-droit)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = parseInt(svg.style.width) || 470;
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
        const startX = t0.clientX;
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
            window._wfMiniBarCollapse(widget, '🖍️ Coloriage magique', {});
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
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

    if (savedData) {
        requestAnimationFrame(() => requestAnimationFrame(() => setData(savedData)));
    } else {
        regenerate(false);
    }

    // Exposer getData/setData pour save-load.js
    widget._cmGetData = getData;
    widget._cmSetData = setData;

    saveBoard();
    return widget;
}
