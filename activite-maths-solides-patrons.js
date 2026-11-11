// =========================================================================
// WIDGET PATRONS DE SOLIDES — Le Bureau du Prof
// Un patron se plie et se déplie en 3D, à la main (curseur) ou en animation.
//   🧊 Cube (les 11 patrons) · 📦 Pavé droit · 🔺 Prisme triangulaire
//   🔻 Pyramide à base carrée · ▲ Tétraèdre · 🥫 Cylindre
//   🎯 « Patron ou pas ? » : un dessin de 6 carrés, est-ce un patron de cube ?
//      On répond, puis on plie pour vérifier (les faces qui se superposent
//      deviennent rouges).
// Options : numéros des faces, couleurs (faces / faces opposées / unie),
// rotation automatique, vue de dessus ou en perspective. On fait tourner le
// solide en le faisant glisser, et la molette zoome.
//
// Même fenêtre que « La balance à plateaux » : redimensionnement libre,
// aide, réduire, plein écran (fullboard), fermer.
// Sur téléphone et tablette : ouverture directe en plein écran (bouton vert).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//   (+ window._wfMiniBarCollapse défini par activite-francais-mot-le-plus-long.js)
// Sauvegarde : widget._patGetData() / widget._patSetData(d)  (save-load.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('pat-style')) return;
    const s = document.createElement('style');
    s.id = 'pat-style';
    s.textContent = `
        .widget[data-type="solides-patrons"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            cursor: default;
        }
        .pat-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            cursor: default;
            overflow: hidden;
        }

        /* En-tête */
        .pat-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: grab; }
        .pat-header:active { cursor: grabbing; }
        .pat-container.wf-fullboard .pat-header { cursor: default; }
        .pat-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: .3px; pointer-events: none; }
        .pat-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: #dbeafe; color: #1e40af; white-space: nowrap; }

        /* Réduit / plein écran */
        .pat-container.wf-minimized > *:not(.pat-header) { display: none !important; }
        .pat-container.wf-minimized { gap: 0; }
        .pat-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .pat-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                height: 100dvh !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Boutons */
        .pat-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .pat-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .pat-btn:active { transform: scale(0.96); }
        .pat-btn:disabled { opacity: .45; cursor: default; transform: none; }
        .pat-btn-blue  { background: #4a90e2; color: #fff; }
        .pat-btn-blue:hover:not(:disabled)  { background: #357abd; }
        .pat-btn-grey  { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .pat-btn-grey:hover:not(:disabled)  { background: #e0e0e0; }
        .pat-btn-green { background: #28a745; color: #fff; }
        .pat-btn-green:hover:not(:disabled) { background: #1f8a39; }
        .pat-btn-red   { background: #dc2626; color: #fff; }
        .pat-btn-red:hover:not(:disabled)   { background: #b91c1c; }
        .pat-btn-big { font-size: 13px; padding: 7px 14px; }
        .pat-btn.on { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
        .pat-tab {
            padding: 6px 11px; border-radius: 9px; border: 2px solid transparent; cursor: pointer;
            font-size: 13px; font-weight: 800; background: #f3f4f6; color: #4b5563;
        }
        .pat-tab.active { background: #dbeafe; color: #1e40af; border-color: #60a5fa; }
        .pat-tab.chal { background: #fef3c7; color: #92400e; }
        .pat-tab.chal.active { background: #fde68a; color: #78350f; border-color: #f59e0b; }
        .pat-lbl { font-size: 11px; font-weight: 700; color: #6b7280; }
        .pat-seg { display: inline-flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .pat-seg button { border: none; background: #fff; padding: 4px 10px; font-size: 11px; font-weight: 800; cursor: pointer; color: #6b7280; }
        .pat-seg button + button { border-left: 1px solid #eee; }
        .pat-seg button.on { background: #1e40af; color: #fff; }
        .pat-netnav { display: inline-flex; align-items: center; gap: 4px; }
        .pat-netnav .pat-btn { padding: 4px 9px; }
        .pat-netnum { font-size: 12px; font-weight: 800; color: #1e40af; min-width: 92px; text-align: center; }

        /* Curseur de pliage */
        .pat-fold { flex: 1; min-width: 140px; display: flex; align-items: center; gap: 8px; }
        .pat-slider {
            --fill: 0%;
            flex: 1; height: 8px; margin: 0; cursor: pointer; border-radius: 999px; outline: none;
            -webkit-appearance: none; appearance: none;
            background: linear-gradient(to right, #4a90e2 var(--fill), #e5e7eb var(--fill));
        }
        .pat-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
            background: #fff; border: 3px solid #4a90e2; box-shadow: 0 2px 6px rgba(0,0,0,.25); cursor: pointer;
        }
        .pat-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid #4a90e2; cursor: pointer; }
        .pat-slider:focus-visible { outline: 2px solid #1e40af; outline-offset: 4px; }
        .pat-pct { width: 46px; white-space: nowrap; text-align: right; font-size: 12px; font-weight: 800; color: #1e40af; font-variant-numeric: tabular-nums; }

        /* Scène */
        .pat-stage {
            position: relative; flex-shrink: 0; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;
            background: radial-gradient(120% 90% at 50% 20%, #ffffff, #e8eef6);
        }
        .pat-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
        .pat-canvas:active { cursor: grabbing; }
        .pat-hint {
            position: absolute; left: 10px; bottom: 8px; font-size: 11px; font-weight: 700; color: #64748b;
            background: rgba(255,255,255,.8); padding: 3px 8px; border-radius: 999px; pointer-events: none;
        }
        .pat-view-btns { position: absolute; right: 8px; top: 8px; display: flex; flex-direction: column; gap: 4px; }
        .pat-view-btns button {
            width: 30px; height: 30px; border-radius: 8px; border: 1px solid #d1d5db; background: rgba(255,255,255,.9);
            font-size: 14px; font-weight: 800; color: #374151; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .pat-view-btns button:hover { background: #fff; border-color: #93c5fd; }
        .pat-view-btns button.on { background: #dbeafe; border-color: #60a5fa; color: #1e40af; }

        /* Caractéristiques et message */
        .pat-info {
            text-align: center; font-family: 'Nunito', 'Segoe UI', sans-serif; font-weight: 900; color: #1f2937;
            font-size: 22px; line-height: 1.3; min-height: 1.3em;
        }
        .pat-info .k { color: #1e40af; }
        .pat-info .sub { color: #64748b; font-size: .7em; font-weight: 800; }
        .pat-msg {
            padding: 8px 12px; border-radius: 10px; font-size: 16px; line-height: 1.4;
            background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151;
        }
        .pat-msg.ok   { background: #f0fff4; border-color: #b7e4c7; color: #14532d; }
        .pat-msg.warn { background: #fffbea; border-color: #f3e1a0; color: #6b4b00; }
        .pat-msg.ko   { background: #fff1f1; border-color: #f5c2c2; color: #7f1d1d; }
        .pat-answer { display: none; gap: 6px; align-items: center; flex-wrap: wrap; font-weight: 800; color: #374151; }
        .pat-answer.show { display: flex; }
        .pat-score { margin-left: auto; font-size: 13px; font-weight: 800; color: #92400e; background: #fef3c7; padding: 4px 10px; border-radius: 999px; }

        /* Aide */
        .pat-help-btn {
            width: 22px; height: 22px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pat-help-btn:hover { background: #e0e0e0; color: #333; }
        .pat-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 340px; max-width: calc(100% - 20px); box-sizing: border-box;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .pat-help-popup.show { display: block; }
        .pat-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .pat-help-popup p { margin: 0 0 6px; }
        .pat-help-popup p:last-child { margin-bottom: 0; }

        .pat-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .pat-container:hover .pat-resize-handle { opacity: 1; }
        .pat-container.wf-fullboard .pat-resize-handle { display: none; }
    `;
    document.head.appendChild(s);
})();

// ── Données ───────────────────────────────────────────────────────────────
const PAT_SOLIDS = {
    cube:     { nom: 'Cube',                  ico: '🧊', f: 6, a: 12, s: 8 },
    pave:     { nom: 'Pavé droit',            ico: '📦', f: 6, a: 12, s: 8 },
    prisme:   { nom: 'Prisme triangulaire',   ico: '🔺', f: 5, a: 9,  s: 6 },
    pyramide: { nom: 'Pyramide à base carrée', ico: '🔻', f: 5, a: 8,  s: 5 },
    tetra:    { nom: 'Tétraèdre',             ico: '▲',  f: 4, a: 6,  s: 4 },
    cylindre: { nom: 'Cylindre',              ico: '🥫', f: 3, a: 2,  s: 0 },
    defi:     { nom: 'Patron ou pas ?',       ico: '🎯' }
};
const PAT_TAB_LABELS = {
    cube: 'Cube', pave: 'Pavé', prisme: 'Prisme', pyramide: 'Pyramide', tetra: 'Tétraèdre', cylindre: 'Cylindre', defi: 'Patron ou pas ?'
};

// Les 11 patrons du cube (cases [ligne, colonne])
const PAT_CUBE_NETS = [
    [[0,0],[1,0],[1,1],[1,2],[1,3],[2,0]],   // 1-4-1
    [[0,0],[1,0],[1,1],[1,2],[1,3],[2,1]],
    [[0,0],[1,0],[1,1],[1,2],[1,3],[2,2]],
    [[0,0],[1,0],[1,1],[1,2],[1,3],[2,3]],
    [[0,1],[1,0],[1,1],[1,2],[1,3],[2,1]],
    [[0,1],[1,0],[1,1],[1,2],[1,3],[2,2]],
    [[0,0],[0,1],[1,1],[1,2],[1,3],[2,1]],   // 2-3-1
    [[0,0],[0,1],[1,1],[1,2],[1,3],[2,2]],
    [[0,0],[0,1],[1,1],[1,2],[1,3],[2,3]],
    [[0,0],[0,1],[1,1],[1,2],[2,2],[2,3]],   // 2-2-2
    [[0,0],[0,1],[0,2],[1,2],[1,3],[1,4]]    // 3-3
];
// Assemblages de 6 carrés qui ne sont PAS des patrons de cube
const PAT_CUBE_FAKES = [
    [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],   // rectangle 2 × 3
    [[0,0],[0,1],[0,2],[0,3],[0,4],[1,0]],   // 5 en ligne
    [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1]],   // 4 + 2 côte à côte
    [[0,0],[0,1],[1,0],[1,1],[2,1],[2,2]],   // carré 2 × 2
    [[0,0],[1,0],[1,1],[1,2],[1,3],[0,3]],   // les deux du même côté
    [[0,0],[0,1],[0,2],[1,1],[2,1],[2,2]],   // en S fermé
    [[0,0],[0,1],[1,1],[1,2],[1,3],[0,3]],   // pont
    [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3]],
    [[0,2],[1,0],[1,1],[1,2],[1,3],[0,1]]    // 2 en haut côte à côte + 4
];

const PAT_COLORS = ['#60a5fa', '#f87171', '#4ade80', '#facc15', '#c084fc', '#fb923c', '#2dd4bf', '#f472b6'];
const PAT_AXIS_COLORS = ['#60a5fa', '#f87171', '#4ade80'];   // faces opposées : même couleur
const PAT_PLAIN = '#93c5fd';

// ── Outils ────────────────────────────────────────────────────────────────
function _patIsPhone() {
    if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
    if (typeof isTabletBoardMode === 'function') { try { if (isTabletBoardMode()) return true; } catch (e) {} }
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse), (pointer: coarse) and (min-width: 601px) and (min-height: 501px)').matches);
}
function _patEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

// ── Géométrie 3D (matrices 3×3 + translation) ─────────────────────────────
const _PAT_ID = { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };
function _patApply(T, p) {
    const m = T.m;
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + T.t[0],
            m[3] * p[0] + m[4] * p[1] + m[5] * p[2] + T.t[1],
            m[6] * p[0] + m[7] * p[1] + m[8] * p[2] + T.t[2]];
}
// A ∘ B : on applique B puis A
function _patCompose(A, B) {
    const a = A.m, b = B.m, m = new Array(9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        m[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    const bt = B.t;
    return { m, t: [a[0] * bt[0] + a[1] * bt[1] + a[2] * bt[2] + A.t[0],
                    a[3] * bt[0] + a[4] * bt[1] + a[5] * bt[2] + A.t[1],
                    a[6] * bt[0] + a[7] * bt[1] + a[8] * bt[2] + A.t[2]] };
}
// Rotation d'angle « ang » autour de la droite (a, b) du plan du patron
function _patRotLine(a, b, ang) {
    let ux = b[0] - a[0], uy = b[1] - a[1];
    const L = Math.hypot(ux, uy) || 1;
    ux /= L; uy /= L;
    const c = Math.cos(ang), s = Math.sin(ang), C = 1 - c;
    const m = [c + ux * ux * C, ux * uy * C,     uy * s,
               uy * ux * C,     c + uy * uy * C, -ux * s,
               -uy * s,         ux * s,          c];
    const ap = [a[0], a[1], 0];
    const ra = [m[0] * ap[0] + m[1] * ap[1], m[3] * ap[0] + m[4] * ap[1], m[6] * ap[0] + m[7] * ap[1]];
    return { m, t: [ap[0] - ra[0], ap[1] - ra[1], ap[2] - ra[2]] };
}
function _patCentroid2(pts) {
    let x = 0, y = 0;
    pts.forEach(p => { x += p[0]; y += p[1]; });
    return [x / pts.length, y / pts.length];
}

// ── Construction des patrons ──────────────────────────────────────────────
// Chaque face : { pts:[[x,y]…] (sens direct), parent, edge:[a,b], fold (rad) }
// Le sens du pliage est choisi pour que toutes les faces se relèvent (z > 0).
function _patFinalize(faces) {
    faces.forEach(f => {
        if (f.parent < 0) { f.sign = 1; return; }
        const c = _patCentroid2(f.pts);
        const p = _patApply(_patRotLine(f.edge[0], f.edge[1], 0.2), [c[0], c[1], 0]);
        f.sign = p[2] >= 0 ? 1 : -1;
    });
    return faces;
}
function _patRect(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }

function _patBuildGrid(cells) {
    // Carré (ligne r, colonne c) : x de c à c+1, y de -r-1 à -r
    const key = (r, c) => r + ',' + c;
    const idx = {};
    cells.forEach((cl, i) => { idx[key(cl[0], cl[1])] = i; });
    // Racine : la case qui a le plus de voisines (patron bien posé à plat)
    let root = 0, best = -1;
    cells.forEach((cl, i) => {
        const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => idx[key(cl[0] + d[0], cl[1] + d[1])] !== undefined).length;
        if (n > best) { best = n; root = i; }
    });
    const faces = cells.map(cl => ({ pts: _patRect(cl[1], -cl[0] - 1, 1, 1), parent: -1, edge: null, fold: Math.PI / 2, cell: cl }));
    const seen = new Set([root]);
    const queue = [root];
    while (queue.length) {
        const i = queue.shift();
        const [r, c] = cells[i];
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
            const j = idx[key(r + d[0], c + d[1])];
            if (j === undefined || seen.has(j)) return;
            seen.add(j);
            let a, b;
            if (d[0] === 1)  { a = [c, -r - 1]; b = [c + 1, -r - 1]; }   // en dessous
            if (d[0] === -1) { a = [c, -r];     b = [c + 1, -r]; }       // au-dessus
            if (d[1] === 1)  { a = [c + 1, -r - 1]; b = [c + 1, -r]; }   // à droite
            if (d[1] === -1) { a = [c, -r - 1];     b = [c, -r]; }       // à gauche
            faces[j].parent = i; faces[j].edge = [a, b];
            queue.push(j);
        });
    }
    faces.forEach((f, i) => { if (i === root) f.parent = -1; });
    // Racine en premier dans l'ordre de calcul
    return _patFinalize(faces);
}

function _patBuildPave() {
    const X = 3, Y = 2, H = 1.4, R = Math.PI / 2;
    const f = [];
    f.push({ pts: _patRect(0, 0, X, Y), parent: -1, fold: R });                                    // 0 dessous
    f.push({ pts: _patRect(0, -H, X, H), parent: 0, edge: [[0, 0], [X, 0]], fold: R });            // 1 devant
    f.push({ pts: _patRect(0, Y, X, H), parent: 0, edge: [[0, Y], [X, Y]], fold: R });             // 2 derrière
    f.push({ pts: _patRect(0, Y + H, X, Y), parent: 2, edge: [[0, Y + H], [X, Y + H]], fold: R }); // 3 dessus
    f.push({ pts: _patRect(-H, 0, H, Y), parent: 0, edge: [[0, 0], [0, Y]], fold: R });           // 4 gauche
    f.push({ pts: _patRect(X, 0, H, Y), parent: 0, edge: [[X, 0], [X, Y]], fold: R });             // 5 droite
    return _patFinalize(f);
}

function _patBuildPrisme() {
    const a = 1.6, L = 2.8, hT = a * Math.sqrt(3) / 2;
    const f = [];
    f.push({ pts: _patRect(0, 0, a, L), parent: -1, fold: 0 });                                     // 0 rectangle posé
    f.push({ pts: _patRect(-a, 0, a, L), parent: 0, edge: [[0, 0], [0, L]], fold: 2 * Math.PI / 3 });
    f.push({ pts: _patRect(a, 0, a, L), parent: 0, edge: [[a, 0], [a, L]], fold: 2 * Math.PI / 3 });
    f.push({ pts: [[0, L], [a, L], [a / 2, L + hT]], parent: 0, edge: [[0, L], [a, L]], fold: Math.PI / 2 });
    f.push({ pts: [[0, 0], [a / 2, -hT], [a, 0]], parent: 0, edge: [[0, 0], [a, 0]], fold: Math.PI / 2 });
    return _patFinalize(f);
}

function _patBuildPyramide() {
    const a = 2, h = a * Math.sqrt(3) / 2;
    const fold = Math.PI - Math.acos(1 / Math.sqrt(3));   // triangles équilatéraux
    const f = [];
    f.push({ pts: _patRect(0, 0, a, a), parent: -1, fold: 0 });
    f.push({ pts: [[0, 0], [a / 2, -h], [a, 0]], parent: 0, edge: [[0, 0], [a, 0]], fold });
    f.push({ pts: [[a, 0], [a + h, a / 2], [a, a]], parent: 0, edge: [[a, 0], [a, a]], fold });
    f.push({ pts: [[a, a], [a / 2, a + h], [0, a]], parent: 0, edge: [[a, a], [0, a]], fold });
    f.push({ pts: [[0, a], [-h, a / 2], [0, 0]], parent: 0, edge: [[0, a], [0, 0]], fold });
    return _patFinalize(f);
}

function _patBuildTetra() {
    const a = 2, h = a * Math.sqrt(3) / 2;
    const fold = Math.PI - Math.acos(1 / 3);
    const A = [0, 0], B = [a, 0], C = [a / 2, h];
    const f = [];
    f.push({ pts: [A, B, C], parent: -1, fold: 0 });
    f.push({ pts: [A, [a / 2, -h], B], parent: 0, edge: [A, B], fold });
    f.push({ pts: [B, [a * 1.5, h], C], parent: 0, edge: [B, C], fold });
    f.push({ pts: [C, [-a / 2, h], A], parent: 0, edge: [C, A], fold });
    return _patFinalize(f);
}

function _patBuildCylindre() {
    const N = 24, H = 3, R = 0.75;
    const w = 2 * R * Math.sin(Math.PI / N);
    const fold = 2 * Math.PI / N;
    const f = [];
    const mid = Math.floor(N / 2);
    for (let k = 0; k < N; k++) f.push({ pts: _patRect(k * w, 0, w, H), parent: -1, fold, smooth: true, strip: true });
    for (let k = mid + 1; k < N; k++) { f[k].parent = k - 1; f[k].edge = [[k * w, 0], [k * w, H]]; }
    for (let k = mid - 1; k >= 0; k--) { f[k].parent = k + 1; f[k].edge = [[(k + 1) * w, 0], [(k + 1) * w, H]]; }
    // Deux disques (polygones à N côtés) accrochés à la bande du milieu
    const x0 = mid * w, x1 = (mid + 1) * w;
    function disc(y, up) {
        const pts = [], cx = (x0 + x1) / 2;
        const ap = R * Math.cos(Math.PI / N);           // apothème
        const cy = y + (up ? ap : -ap);
        const start = up ? -Math.PI / 2 : Math.PI / 2;
        for (let i = 0; i < N; i++) {
            const ang = start + Math.PI / N + i * 2 * Math.PI / N;
            pts.push([cx + R * Math.cos(ang), cy + R * Math.sin(ang)]);
        }
        // sens direct
        let area = 0;
        for (let i = 0; i < N; i++) { const p = pts[i], q = pts[(i + 1) % N]; area += p[0] * q[1] - q[0] * p[1]; }
        if (area < 0) pts.reverse();
        return pts;
    }
    f.push({ pts: disc(H, true), parent: mid, edge: [[x0, H], [x1, H]], fold: Math.PI / 2, disc: true });
    f.push({ pts: disc(0, false), parent: mid, edge: [[x0, 0], [x1, 0]], fold: Math.PI / 2, disc: true });
    return _patFinalize(f);
}

// Positions 3D de toutes les faces pour un taux de pliage t (0 → 1)
function _patWorld(faces, t) {
    const T = new Array(faces.length);
    const done = new Array(faces.length).fill(false);
    function get(i) {
        if (done[i]) return T[i];
        const f = faces[i];
        T[i] = f.parent < 0 ? _PAT_ID
            : _patCompose(get(f.parent), _patRotLine(f.edge[0], f.edge[1], f.sign * f.fold * t));
        done[i] = true;
        return T[i];
    }
    return faces.map((f, i) => f.pts.map(p => _patApply(get(i), [p[0], p[1], 0])));
}

// Faces qui se superposent une fois le patron plié (patron impossible)
function _patOverlaps(faces) {
    const W = _patWorld(faces, 1);
    const seen = {}, bad = new Set();
    W.forEach((pts, i) => {
        let x = 0, y = 0, z = 0;
        pts.forEach(p => { x += p[0]; y += p[1]; z += p[2]; });
        const k = [x, y, z].map(v => Math.round(v / pts.length * 100)).join(',');
        if (seen[k] !== undefined) { bad.add(i); bad.add(seen[k]); }
        else seen[k] = i;
    });
    return bad;
}
function _patIsCubeNet(cells) { return _patOverlaps(_patBuildGrid(cells)).size === 0; }

// ── Création du widget ────────────────────────────────────────────────────
function createSolidesPatronsWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'solides-patrons';
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
    container.className = 'pat-container';
    const initW = Math.max(520, Math.round(window.innerWidth * 0.6));
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'pat-header';
    header.innerHTML = `
        <span class="pat-title">🧊 Patrons de solides</span>
        <span class="pat-badge">Cube</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.pat-badge');
    container.appendChild(header);

    // ── Choix du solide ───────────────────────────────────────────────────
    const tabs = document.createElement('div');
    tabs.className = 'pat-row';
    tabs.innerHTML = Object.keys(PAT_SOLIDS).map(k =>
        `<button class="pat-tab${k === 'defi' ? ' chal' : ''}" data-solid="${k}" title="${_patEsc(PAT_SOLIDS[k].nom)}">${PAT_SOLIDS[k].ico} ${PAT_TAB_LABELS[k]}</button>`).join('');
    container.appendChild(tabs);

    // ── Actions ───────────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'pat-row';
    actions.innerHTML = `
        <button class="pat-btn pat-btn-green pat-btn-big" data-act="plier">▶ Plier</button>
        <button class="pat-btn pat-btn-grey pat-btn-big" data-act="deplier">◀ Déplier</button>
        <div class="pat-fold">
            <span class="pat-lbl">Pliage</span>
            <input type="range" class="pat-slider" min="0" max="100" step="1" value="0" aria-label="Taux de pliage">
            <span class="pat-pct">0 %</span>
        </div>
        <span class="pat-netnav">
            <button class="pat-btn pat-btn-grey" data-act="prev-net" title="Patron précédent">◀</button>
            <span class="pat-netnum">Patron 1 / 11</span>
            <button class="pat-btn pat-btn-grey" data-act="next-net" title="Patron suivant">▶</button>
        </span>
    `;
    const slider  = actions.querySelector('.pat-slider');
    const pctEl   = actions.querySelector('.pat-pct');
    const netNav  = actions.querySelector('.pat-netnav');
    const netNum  = actions.querySelector('.pat-netnum');
    container.appendChild(actions);

    // ── Options d'affichage ───────────────────────────────────────────────
    const opts = document.createElement('div');
    opts.className = 'pat-row';
    opts.innerHTML = `
        <span class="pat-lbl">Couleurs :</span>
        <span class="pat-seg" data-group="colors">
            <button data-colors="faces" title="Une couleur par face">Faces</button>
            <button data-colors="opp" title="Les faces opposées ont la même couleur">Opposées</button>
            <button data-colors="plain" title="Une seule couleur">Unie</button>
        </span>
        <button class="pat-btn pat-btn-grey" data-act="nums" title="Afficher le numéro de chaque face"># Numéros</button>
        <button class="pat-btn pat-btn-grey" data-act="spin" title="Faire tourner le solide tout seul">⟳ Rotation</button>
    `;
    const numsBtn = opts.querySelector('[data-act="nums"]');
    const spinBtn = opts.querySelector('[data-act="spin"]');
    const oppBtn  = opts.querySelector('[data-colors="opp"]');
    container.appendChild(opts);

    // ── Scène ─────────────────────────────────────────────────────────────
    const stage = document.createElement('div');
    stage.className = 'pat-stage';
    stage.style.height = Math.round(initW * 0.55) + 'px';
    stage.innerHTML = `
        <canvas class="pat-canvas"></canvas>
        <div class="pat-view-btns">
            <button data-view="3d" title="Vue en perspective">3D</button>
            <button data-view="top" title="Vue de dessus">⬒</button>
            <button data-act="zoom-in" title="Zoomer">+</button>
            <button data-act="zoom-out" title="Dézoomer">−</button>
        </div>
        <div class="pat-hint">Glisser pour tourner · molette pour zoomer</div>
    `;
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const hintEl = stage.querySelector('.pat-hint');
    container.appendChild(stage);

    const infoEl = document.createElement('div');
    infoEl.className = 'pat-info';
    container.appendChild(infoEl);

    const answerRow = document.createElement('div');
    answerRow.className = 'pat-answer';
    answerRow.innerHTML = `
        <button class="pat-btn pat-btn-green pat-btn-big" data-act="oui">✔ Oui, c'est un patron</button>
        <button class="pat-btn pat-btn-red pat-btn-big" data-act="non">✘ Non</button>
        <button class="pat-btn pat-btn-blue pat-btn-big" data-act="suivant">➜ Suivant</button>
        <span class="pat-score">Score : 0 / 0</span>
    `;
    const scoreEl = answerRow.querySelector('.pat-score');
    const btnOui = answerRow.querySelector('[data-act="oui"]');
    const btnNon = answerRow.querySelector('[data-act="non"]');
    container.appendChild(answerRow);

    const msgEl = document.createElement('div');
    msgEl.className = 'pat-msg';
    container.appendChild(msgEl);

    // ── Aide ──────────────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'pat-help-btn';
    helpBtn.title = 'Mode d\'emploi';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'pat-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Patrons de solides</h4>
        <p>Choisissez un solide, puis <b>▶ Plier</b> / <b>◀ Déplier</b>, ou faites glisser le curseur
        <b>Pliage</b> pour plier le patron pas à pas. La ligne du dessous rappelle le nombre de
        <b>faces</b>, d'<b>arêtes</b> et de <b>sommets</b>.</p>
        <p><b>Faites glisser</b> le dessin pour tourner le solide, la <b>molette</b> (ou + / −) zoome.
        <b>⬒</b> montre le patron vu de dessus, <b>3D</b> revient en perspective.</p>
        <p><b>🧊 Cube</b> : ◀ ▶ fait défiler les <b>11 patrons</b> du cube.
        <b>Couleurs « Opposées »</b> : deux faces opposées du solide ont la même couleur. Dans le patron,
        elles ne se touchent jamais !</p>
        <p><b>🎯 Patron ou pas ?</b> Un assemblage de 6 carrés s'affiche : est-ce un patron de cube ?
        Répondez, puis le pliage vérifie. Les faces qui se superposent deviennent <b style="color:#dc2626">rouges</b>.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'pat-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let solid = 'cube';
    let netIdx = 0;                 // patron du cube (0 → 10)
    let t = 0, tTarget = 0;         // taux de pliage
    let yaw = -0.55, pitch = 0.62;  // caméra (pitch = π/2 : vue de dessus)
    let zoom = 1;
    let colors = 'faces';
    let showNums = false;
    let spin = false;
    let faces = [];
    let overlap = new Set();
    let chal = null;                // { cells, valid, answered, ok }
    let score = { ok: 0, total: 0 };
    let msg = null;                 // { cls, html }
    let axisColor = [];             // couleur « faces opposées » de chaque face
    let viewCenter = null;          // centre de la vue (centre des sommets)
    let raf = null, lastFrame = 0;
    let dragging = false;

    function save() { if (typeof saveBoard === 'function') saveBoard(); }

    // ── Construction du patron courant ────────────────────────────────────
    function buildFaces() {
        if (solid === 'cube')          faces = _patBuildGrid(PAT_CUBE_NETS[netIdx]);
        else if (solid === 'pave')     faces = _patBuildPave();
        else if (solid === 'prisme')   faces = _patBuildPrisme();
        else if (solid === 'pyramide') faces = _patBuildPyramide();
        else if (solid === 'tetra')    faces = _patBuildTetra();
        else if (solid === 'cylindre') faces = _patBuildCylindre();
        else faces = _patBuildGrid(chal ? chal.cells : PAT_CUBE_NETS[0]);
        overlap = _patOverlaps(faces);
        // Couleur par direction de la face une fois pliée (faces opposées)
        const W = _patWorld(faces, 1);
        axisColor = W.map(pts => {
            if (pts.length < 3) return 0;
            const u = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]];
            const v = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1], pts[2][2] - pts[0][2]];
            const n = [Math.abs(u[1] * v[2] - u[2] * v[1]), Math.abs(u[2] * v[0] - u[0] * v[2]), Math.abs(u[0] * v[1] - u[1] * v[0])];
            return n.indexOf(Math.max(...n));
        });
        // Échelle de base : le patron à plat tient dans la scène
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        faces.forEach(f => f.pts.forEach(p => {
            minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        }));
        faces.extent = Math.max(maxX - minX, maxY - minY, 1);
        viewCenter = null;
    }

    function faceColor(i) {
        const f = faces[i];
        if (colors === 'plain') return PAT_PLAIN;
        if (f.strip) return colors === 'opp' ? PAT_AXIS_COLORS[2] : '#fbbf24';
        if (f.disc) return colors === 'opp' ? PAT_AXIS_COLORS[0] : '#60a5fa';
        if (colors === 'opp') return PAT_AXIS_COLORS[axisColor[i] % 3];
        return PAT_COLORS[i % PAT_COLORS.length];
    }
    function shade(hex, k) {
        const n = parseInt(hex.slice(1), 16);
        let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        if (k >= 1) { const m = k - 1; r += (255 - r) * m; g += (255 - g) * m; b += (255 - b) * m; }
        else { r *= k; g *= k; b *= k; }
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    }

    // ── Rendu 3D (canvas 2D, algorithme du peintre) ───────────────────────
    function render() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return;
        if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const world = _patWorld(faces, t);
        // Centre de la vue : centre des sommets
        let cx = 0, cy = 0, cz = 0, n = 0;
        world.forEach(pts => pts.forEach(p => { cx += p[0]; cy += p[1]; cz += p[2]; n++; }));
        const c = [cx / n, cy / n, cz / n];
        viewCenter = c;

        const cyw = Math.cos(yaw), syw = Math.sin(yaw);
        const tilt = -(Math.PI / 2 - pitch);
        const ct = Math.cos(tilt), st = Math.sin(tilt);
        const scale = Math.min(W, H) * 0.78 / faces.extent * zoom;
        const D = faces.extent * 4;   // distance de la caméra (légère perspective)
        function view(p) {
            const x0 = p[0] - viewCenter[0], y0 = p[1] - viewCenter[1], z0 = p[2] - viewCenter[2];
            const x1 = x0 * cyw - y0 * syw, y1 = x0 * syw + y0 * cyw;
            const y2 = y1 * ct - z0 * st, z2 = y1 * st + z0 * ct;
            return [x1, y2, z2];
        }
        function proj(v) {
            const f = D / (D - v[2]);
            return [W / 2 + v[0] * scale * f, H / 2 - v[1] * scale * f];
        }

        // Quadrillage de la table (plan z = 0), sous le patron
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(100,116,139,0.18)';
        const g = Math.ceil(faces.extent * 0.9) + 1;
        const gx = Math.round(viewCenter[0]), gy = Math.round(viewCenter[1]);
        ctx.beginPath();
        for (let k = -g; k <= g; k++) {
            let a = proj(view([gx + k, gy - g, 0])), b = proj(view([gx + k, gy + g, 0]));
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
            a = proj(view([gx - g, gy + k, 0])); b = proj(view([gx + g, gy + k, 0]));
            ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();

        // Faces triées de la plus lointaine à la plus proche
        const L = [-0.35, 0.45, 0.82];
        const items = world.map((pts, i) => {
            const v = pts.map(view);
            let z = 0; v.forEach(q => { z += q[2]; });
            const a = v[0], b = v[1], c2 = v[2];
            const u1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], u2 = [c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]];
            const nn = [u1[1] * u2[2] - u1[2] * u2[1], u1[2] * u2[0] - u1[0] * u2[2], u1[0] * u2[1] - u1[1] * u2[0]];
            const nl = Math.hypot(nn[0], nn[1], nn[2]) || 1;
            const lum = Math.abs((nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]) / nl);
            return { i, v, z: z / v.length, lum };
        });
        items.sort((A, B) => A.z - B.z);

        // Patron impossible une fois plié : les faces superposées passent devant,
        // en rouge, et les autres deviennent transparentes pour qu'on les voie.
        const showBad = t > 0.97 && overlap.size > 0;
        if (showBad) items.sort((A, B) => (overlap.has(A.i) ? 1 : 0) - (overlap.has(B.i) ? 1 : 0) || A.z - B.z);
        items.forEach(it => {
            const f = faces[it.i];
            const p2 = it.v.map(proj);
            let col = faceColor(it.i);
            if (showBad && overlap.has(it.i)) col = '#ef4444';
            ctx.beginPath();
            p2.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
            ctx.closePath();
            const fill = shade(col, 0.62 + 0.5 * it.lum);
            ctx.fillStyle = fill;
            ctx.globalAlpha = showBad ? (overlap.has(it.i) ? 0.92 : 0.4) : 1;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.lineJoin = 'round';
            if (f.strip) { ctx.strokeStyle = fill; ctx.lineWidth = 1.2; }
            else { ctx.strokeStyle = 'rgba(15,23,42,0.75)'; ctx.lineWidth = 2; }
            ctx.stroke();
            if (showNums && !f.strip) {
                let x = 0, y = 0;
                p2.forEach(p => { x += p[0]; y += p[1]; });
                x /= p2.length; y /= p2.length;
                const fs = Math.max(12, Math.min(34, scale * 0.32));
                ctx.font = `900 ${fs}px Nunito, Segoe UI, sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                const label = f.disc ? 'D' : String(it.i + 1);
                ctx.strokeText(label, x, y);
                ctx.fillStyle = '#0f172a';
                ctx.fillText(label, x, y);
            }
        });
    }

    // ── Boucle d'animation (seulement quand quelque chose bouge) ──────────
    function loop(now) {
        const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
        lastFrame = now;
        let moving = false;
        if (Math.abs(tTarget - t) > 0.0005) {
            const sp = 0.45;   // pliage complet en un peu plus de 2 s
            t += Math.sign(tTarget - t) * Math.min(Math.abs(tTarget - t), sp * dt);
            moving = true;
            syncSlider();
            if (Math.abs(tTarget - t) <= 0.0005) { t = tTarget; onFoldEnd(); }
        }
        if (spin && !dragging) { yaw += 0.5 * dt; moving = true; }
        render();
        if (moving) raf = requestAnimationFrame(loop);
        else { raf = null; lastFrame = 0; }
    }
    function kick() { if (!raf) { lastFrame = 0; raf = requestAnimationFrame(loop); } }
    function redraw() { if (!raf) render(); }

    function syncSlider() {
        const v = Math.round(t * 100);
        slider.value = v;
        slider.style.setProperty('--fill', v + '%');
        pctEl.textContent = v + ' %';
    }

    function onFoldEnd() {
        if (solid === 'defi' && chal && chal.answered && t >= 0.999) {
            msg = chal.valid
                ? { cls: 'ok', html: '✔ Le cube se ferme : chaque face trouve sa place. <b>C\'est bien un patron de cube.</b>' }
                : { cls: 'ko', html: '✘ Des faces se superposent (en rouge) et le cube reste ouvert : <b>ce n\'est pas un patron de cube.</b>' };
            renderInfo();
        }
        save();
    }

    // ── Textes ────────────────────────────────────────────────────────────
    function renderInfo() {
        if (solid === 'defi') {
            infoEl.innerHTML = '🎯 Ce dessin est-il un <span class="k">patron de cube</span> ?';
        } else if (solid === 'cylindre') {
            infoEl.innerHTML = `🥫 Cylindre : <span class="k">2</span> disques + <span class="k">1</span> rectangle qui s'enroule` +
                `<br><span class="sub">La longueur du rectangle est égale au périmètre du disque.</span>`;
        } else {
            const S = PAT_SOLIDS[solid];
            infoEl.innerHTML = `${S.ico} ${_patEsc(S.nom)} : <span class="k">${S.f}</span> faces · <span class="k">${S.a}</span> arêtes · <span class="k">${S.s}</span> sommets`;
        }
        if (msg) { msgEl.style.display = ''; msgEl.className = 'pat-msg ' + (msg.cls || ''); msgEl.innerHTML = msg.html; }
        else msgEl.style.display = 'none';
    }
    function defaultMsg() {
        if (solid === 'cube') return { cls: '', html: `Le cube a <b>11 patrons</b> différents : faites-les défiler avec ◀ ▶ et pliez-les. ` +
            `Avec les couleurs <b>« Opposées »</b>, repérez les faces qui se font face.` };
        if (solid === 'pave') return { cls: '', html: 'Les faces opposées d\'un pavé droit sont des <b>rectangles identiques</b>. Pliez pour vérifier.' };
        if (solid === 'prisme') return { cls: '', html: 'Deux <b>triangles</b> (les bases) et trois <b>rectangles</b> (les faces latérales).' };
        if (solid === 'pyramide') return { cls: '', html: 'Une base <b>carrée</b> et quatre faces <b>triangulaires</b> qui se rejoignent au sommet.' };
        if (solid === 'tetra') return { cls: '', html: 'Quatre <b>triangles équilatéraux</b> : chaque face peut servir de base.' };
        if (solid === 'cylindre') return { cls: '', html: 'Le rectangle s\'enroule autour des deux disques. Le cylindre n\'a <b>pas de sommet</b>.' };
        return null;
    }
    function renderControls() {
        badge.textContent = solid === 'defi' ? 'Patron ou pas ?' : (PAT_SOLIDS[solid].nom + (solid === 'cube' ? ' · ' + (netIdx + 1) + '/11' : ''));
        tabs.querySelectorAll('.pat-tab').forEach(b => b.classList.toggle('active', b.dataset.solid === solid));
        netNav.style.display = solid === 'cube' ? '' : 'none';
        netNum.textContent = `Patron ${netIdx + 1} / 11`;
        opts.querySelectorAll('[data-colors]').forEach(b => b.classList.toggle('on', b.dataset.colors === colors));
        oppBtn.style.display = (solid === 'cube' || solid === 'pave' || solid === 'defi') ? '' : 'none';
        numsBtn.classList.toggle('on', showNums);
        spinBtn.classList.toggle('on', spin);
        stage.querySelector('[data-view="top"]').classList.toggle('on', pitch > 1.5);
        stage.querySelector('[data-view="3d"]').classList.toggle('on', pitch <= 1.5);
        answerRow.classList.toggle('show', solid === 'defi');
        if (chal) {
            btnOui.disabled = btnNon.disabled = !!chal.answered;
        }
        scoreEl.textContent = `Score : ${score.ok} / ${score.total}`;
    }
    function renderAll() {
        renderControls();
        renderInfo();
        syncSlider();
        if (_isMax) fitFullStage();
        redraw();
    }

    // ── Actions ───────────────────────────────────────────────────────────
    function setSolid(k) {
        if (!PAT_SOLIDS[k]) k = 'cube';
        solid = k;
        if (k !== 'cube' && k !== 'pave' && k !== 'defi' && colors === 'opp') colors = 'faces';
        if (k === 'defi') { newChallenge(); return; }
        buildFaces();
        t = tTarget = 0;
        if (pitch > 1.5) pitch = 0.62;
        msg = defaultMsg();
        renderAll();
        save();
    }
    function setNet(i) {
        netIdx = (i + PAT_CUBE_NETS.length) % PAT_CUBE_NETS.length;
        buildFaces();
        t = tTarget = 0;
        msg = defaultMsg();
        renderAll();
        save();
    }
    function newChallenge() {
        // Une fois sur deux, un vrai patron (tiré parmi les 11), sinon un faux
        const fakes = PAT_CUBE_FAKES.filter(c => !_patIsCubeNet(c));
        const valid = Math.random() < 0.5;
        let cells = valid ? PAT_CUBE_NETS[Math.floor(Math.random() * PAT_CUBE_NETS.length)]
                          : fakes[Math.floor(Math.random() * fakes.length)];
        // Retournement / rotation au hasard pour varier
        cells = transformCells(cells, Math.floor(Math.random() * 8));
        if (chal && JSON.stringify(chal.cells) === JSON.stringify(cells)) cells = transformCells(cells, 1);
        chal = { cells, valid: _patIsCubeNet(cells), answered: false, ok: null };
        solid = 'defi';
        if (colors === 'opp') colors = 'faces';
        buildFaces();
        t = tTarget = 0;
        pitch = Math.PI / 2; yaw = 0;   // vue de dessus : un simple dessin
        msg = { cls: '', html: 'Regardez bien ces 6 carrés. Peut-on les plier pour fermer un cube ? Répondez avant de plier !' };
        renderAll();
        save();
    }
    function transformCells(cells, k) {
        let out = cells.map(c => c.slice());
        for (let i = 0; i < (k & 3); i++) out = out.map(([r, c]) => [c, -r]);     // rotation d'un quart de tour
        if (k & 4) out = out.map(([r, c]) => [r, -c]);                            // symétrie
        const minR = Math.min(...out.map(c => c[0])), minC = Math.min(...out.map(c => c[1]));
        return out.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    }
    function answer(yes) {
        if (!chal || chal.answered) return;
        chal.answered = true;
        chal.ok = (yes === chal.valid);
        score.total++;
        if (chal.ok) score.ok++;
        msg = chal.ok
            ? { cls: 'ok', html: `🎉 Bonne réponse ! ${chal.valid ? 'C\'est un patron de cube.' : 'Ce n\'est pas un patron de cube.'} Regardez le pliage pour vérifier…` }
            : { cls: 'ko', html: `✗ Raté : ${chal.valid ? 'c\'était bien un patron de cube' : 'ce n\'était pas un patron de cube'}. Regardez le pliage…` };
        pitch = 0.62; yaw = -0.55;
        tTarget = 1;
        renderAll();
        kick();
        save();
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    container.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act],[data-solid],[data-colors],[data-view]');
        if (!b || !container.contains(b)) return;
        if (b.dataset.solid) { if (b.dataset.solid !== solid || b.dataset.solid === 'defi') setSolid(b.dataset.solid); return; }
        if (b.dataset.colors) { colors = b.dataset.colors; renderAll(); save(); return; }
        if (b.dataset.view) {
            if (b.dataset.view === 'top') { pitch = Math.PI / 2; yaw = 0; }
            else { pitch = 0.62; yaw = -0.55; }
            renderAll(); save(); return;
        }
        switch (b.dataset.act) {
            case 'plier':    tTarget = 1; kick(); break;
            case 'deplier':  tTarget = 0; kick(); break;
            case 'prev-net': setNet(netIdx - 1); break;
            case 'next-net': setNet(netIdx + 1); break;
            case 'nums':     showNums = !showNums; renderAll(); save(); break;
            case 'spin':     spin = !spin; renderAll(); kick(); save(); break;
            case 'zoom-in':  zoom = Math.min(3, zoom * 1.2); redraw(); save(); break;
            case 'zoom-out': zoom = Math.max(0.4, zoom / 1.2); redraw(); save(); break;
            case 'oui':      answer(true); break;
            case 'non':      answer(false); break;
            case 'suivant':  newChallenge(); break;
        }
    });

    slider.addEventListener('input', () => {
        t = tTarget = parseInt(slider.value, 10) / 100;
        syncSlider();
        redraw();
    });
    slider.addEventListener('change', () => { if (t >= 0.999) onFoldEnd(); else save(); });

    // ── Rotation à la souris / au doigt, zoom à la molette ────────────────
    let dragInfo = null;
    canvas.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        e.preventDefault(); e.stopPropagation();
        dragging = true;
        dragInfo = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId };
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        hintEl.style.display = 'none';
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!dragInfo || e.pointerId !== dragInfo.id) return;
        e.preventDefault();
        yaw = dragInfo.yaw + (e.clientX - dragInfo.x) * 0.01;
        pitch = Math.max(0.05, Math.min(Math.PI / 2, dragInfo.pitch + (e.clientY - dragInfo.y) * 0.01));
        renderControls();
        redraw();
    });
    function endDrag(e) {
        if (!dragInfo || (e && e.pointerId !== dragInfo.id)) return;
        dragInfo = null;
        dragging = false;
        save();
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault(); e.stopPropagation();
        zoom = Math.max(0.4, Math.min(3, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        redraw();
        clearTimeout(canvas._zt);
        canvas._zt = setTimeout(save, 400);
    }, { passive: false });

    [stage, actions, tabs, opts, answerRow, msgEl, infoEl].forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    });
    slider.addEventListener('pointerdown', (e) => e.stopPropagation());

    helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    function closeHelp() { helpPopup.classList.remove('show'); }
    document.addEventListener('click', closeHelp);

    // ── Redimensionnement libre (largeur + hauteur de la scène) ───────────
    function startResize(x0, y0) {
        const startW = container.offsetWidth, startH = stage.offsetHeight;
        return (x, y) => {
            container.style.width = Math.max(460, startW + x - x0) + 'px';
            stage.style.height    = Math.max(200, startH + y - y0) + 'px';
            redraw();
        };
    }
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const move = startResize(e.clientX, e.clientY);
        document.onmousemove = (ev) => move(ev.clientX, ev.clientY);
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const move = startResize(t0.clientX, t0.clientY);
        function onMoveT(ev) { const tt = ev.touches[0]; move(tt.clientX, tt.clientY); }
        function onEnd() {
            document.removeEventListener('touchmove', onMoveT);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMoveT, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // En plein écran, la scène prend toute la hauteur restante
    function fitFullStage() {
        if (!_isMax) return;
        const top = container.getBoundingClientRect().top;
        let bottom = top;
        Array.from(container.children).forEach(el => {
            if (el === helpPopup || el === resizeHandle) return;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.position === 'absolute') return;
            bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
        });
        const others = (bottom - top) - stage.offsetHeight + 16;
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        stage.style.height = Math.max(220, Math.round(vh - others)) + 'px';
    }
    function onWinResize() {
        if (!document.body.contains(widget)) { cleanup(); return; }
        fitFullStage();
        redraw();
    }
    window.addEventListener('resize', onWinResize);

    // Redessine quand la scène change de taille (dépliage de la mini-barre…)
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(() => redraw()); ro.observe(stage); }

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🧊 Patrons de solides', { onExpand: () => requestAnimationFrame(redraw) });
        } else {
            container.classList.toggle('wf-minimized');
            requestAnimationFrame(redraw);
        }
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        wfMax.title = _isMax ? 'Quitter le plein écran' : 'Plein écran';
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = stage.style.height;
            container.classList.add('wf-fullboard');
            stage.style.height = Math.round(window.innerHeight * 0.5) + 'px';
            requestAnimationFrame(() => { fitFullStage(); redraw(); });
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) stage.style.height = _savedH;
            requestAnimationFrame(redraw);
        }
        save();
    });
    function onKey(e) { if (_isMax && e.key === 'Escape' && document.body.contains(widget)) wfMax.click(); }
    document.addEventListener('keydown', onKey);

    function cleanup() {
        window.removeEventListener('resize', onWinResize);
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('click', closeHelp);
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        if (ro) ro.disconnect();
    }
    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        cleanup();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });
    // Nettoyage aussi quand le widget est supprimé autrement (barre d'édition, effacer…)
    const mo = new MutationObserver(() => { if (!document.body.contains(widget)) { cleanup(); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'CANVAS') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Au départ : le cube, patron n° 1, à plat
    buildFaces();
    msg = defaultMsg();
    renderAll();
    requestAnimationFrame(redraw);

    // ── API pour save-load.js ─────────────────────────────────────────────
    let _restored = false, _autoMax = false;

    widget._patGetData = () => ({
        containerW: _isMax ? (parseFloat(_savedW) || container.offsetWidth) : container.offsetWidth,
        stageH:     _isMax ? (parseFloat(_savedH) || stage.offsetHeight)    : stage.offsetHeight,
        solid, netIdx, t: tTarget, yaw, pitch, zoom, colors, showNums, spin,
        chal: chal ? JSON.parse(JSON.stringify(chal)) : null,
        score: { ok: score.ok, total: score.total },
        msg,
        fullboard: _isMax && !_autoMax
    });

    // Sur téléphone / tablette, ouverture directe en plein écran (bouton vert)
    if (_patIsPhone()) requestAnimationFrame(() => {
        if (!_restored && !_isMax) { _autoMax = true; wfMax.click(); }
    });

    widget._patSetData = (d) => {
        _restored = true;
        if (_autoMax && _isMax) wfMax.click();
        _autoMax = false;
        const toPhoneFull = () => {
            if (_patIsPhone() && !_isMax) { _autoMax = true; wfMax.click(); return true; }
            return false;
        };
        if (!d) { toPhoneFull(); return; }
        if (d.containerW) container.style.width = d.containerW + 'px';
        if (d.stageH)     stage.style.height    = d.stageH + 'px';
        solid  = PAT_SOLIDS[d.solid] ? d.solid : 'cube';
        netIdx = Number.isInteger(d.netIdx) && d.netIdx >= 0 && d.netIdx < PAT_CUBE_NETS.length ? d.netIdx : 0;
        const num = (v, lo, hi, def) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def;
        t = tTarget = num(d.t, 0, 1, 0);
        yaw   = num(d.yaw, -1000, 1000, -0.55);
        pitch = num(d.pitch, 0.05, Math.PI / 2, 0.62);
        zoom  = num(d.zoom, 0.4, 3, 1);
        colors = ['faces', 'opp', 'plain'].includes(d.colors) ? d.colors : 'faces';
        showNums = !!d.showNums;
        spin = !!d.spin;
        const okCells = c => Array.isArray(c) && c.length === 6 && c.every(x => Array.isArray(x) && x.length === 2 && x.every(Number.isInteger));
        chal = d.chal && okCells(d.chal.cells)
            ? { cells: d.chal.cells, valid: _patIsCubeNet(d.chal.cells), answered: !!d.chal.answered, ok: d.chal.ok === true ? true : d.chal.ok === false ? false : null }
            : null;
        if (solid === 'defi' && !chal) solid = 'cube';
        score = { ok: Math.max(0, d.score && d.score.ok | 0), total: Math.max(0, d.score && d.score.total | 0) };
        msg = d.msg && typeof d.msg.html === 'string' ? d.msg : defaultMsg();
        buildFaces();
        renderAll();
        if (spin) kick();
        if (!toPhoneFull() && d.fullboard && !_isMax) wfMax.click();
        setTimeout(redraw, 250);
    };

    saveBoard();
    return widget;
}

// ── Curseurs : flèche par défaut, main qui attrape sur la barre du haut (déplacement),
//    doigt qui pointe sur tout ce qui est cliquable. ──
(function () {
    if (typeof document === 'undefined' || document.getElementById('curseurs-solides-patrons')) return;
    const st = document.createElement('style');
    st.id = 'curseurs-solides-patrons';
    st.textContent = `
.widget[data-type="solides-patrons"] { cursor: default; }
.widget[data-type="solides-patrons"] .pat-header { cursor: grab; }
.widget[data-type="solides-patrons"] .pat-header:active { cursor: grabbing; }
.widget[data-type="solides-patrons"] .wf-fullboard .pat-header, .widget[data-type="solides-patrons"] .wf-fullboard .pat-header:active { cursor: default; }
.widget[data-type="solides-patrons"] .pat-header :is(button, select, .wf-btn, [role="button"]) { cursor: pointer; }
:where(.widget[data-type="solides-patrons"]) :where(button, select, label, summary, [role="button"], input[type="checkbox"], input[type="radio"], input[type="range"], input[type="button"], input[type="submit"], input[type="color"]) { cursor: pointer; }
.widget[data-type="solides-patrons"] .pat-canvas { cursor: grab; }
.widget[data-type="solides-patrons"] .pat-canvas:active { cursor: grabbing; }
.widget[data-type="solides-patrons"] :is(button, select, input, textarea):disabled { cursor: default !important; }
.widget[data-type="solides-patrons"] .wf-mini-bar { cursor: grab !important; }
.widget[data-type="solides-patrons"] .wf-mini-bar:active { cursor: grabbing !important; }
.widget[data-type="solides-patrons"] .wf-mini-bar :is(button, .wf-btn) { cursor: pointer !important; }
`;
    (document.head || document.documentElement).appendChild(st);
})();
