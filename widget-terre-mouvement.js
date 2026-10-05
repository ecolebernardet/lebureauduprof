// =========================================================================
// WIDGET LA TERRE EN MOUVEMENT — Le Bureau du Prof
// Deux onglets pour comprendre :
//  ☀️ Jour et nuit : le Soleil éclaire toujours une moitié de la Terre ;
//     la Terre tourne sur elle-même en 24 h, d'ouest en est. On la fait
//     tourner au stylet et on suit un lieu (jour / nuit, lever, coucher).
//  🍂 Les saisons : la Terre fait le tour du Soleil en un an, son axe
//     restant incliné de 23,4° dans la même direction. Selon la position,
//     un hémisphère reçoit les rayons plus droit et plus longtemps.
// Une fiche commune affiche durée du jour, lever / coucher, hauteur du
// Soleil à midi et la courbe de la hauteur du Soleil sur la journée.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », boutons
// de grande taille, rien d'accessible uniquement au survol.
//
// Dépendances : widget-geo-monde.js chargé AVANT ce fichier (tracés
//   GW_SHAPES, GW_CONTINENTS, GW_CASPIAN, window._wfMiniBarCollapse,
//   style des boutons .wf-btn). board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('tm-style')) return;
    const s = document.createElement('style');
    s.id = 'tm-style';
    s.textContent = `
        .widget[data-type="terre-mouvement"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .tm-container {
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
            -webkit-user-select: none;
            overflow: hidden;
        }
        .tm-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .tm-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .tm-header .wf-btns { gap: 8px; }
        .tm-header .wf-btn { width: 18px; height: 18px; }
        .tm-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }

        /* Onglets */
        .tm-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .tm-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .tm-tab.on { background: #fff; color: #1f3b63; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .tm-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .tm-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .tm-btn:hover { background: #e0e0e0; }
        .tm-btn:active { transform: scale(0.96); }
        .tm-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .tm-btn-play { min-width: 112px; }
        .tm-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .tm-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .tm-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .tm-date-btn { padding: 5px 9px; }
        .tm-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 200px; min-width: 180px; }
        .tm-slider { flex: 1; height: 30px; accent-color: #e8833a; cursor: pointer; touch-action: none; }
        .tm-val { font-size: 13px; font-weight: 800; color: #1f3b63; min-width: 82px; text-align: right; }

        /* Corps */
        .tm-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .tm-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #0a1322;
        }
        .tm-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
        .tm-canvas.tm-dragging { cursor: grabbing; }
        .tm-hint {
            position: absolute; left: 0; right: 0; bottom: 7px; text-align: center;
            font-size: 12px; color: rgba(214,228,244,.55); pointer-events: none;
        }
        .tm-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #e8833a;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .tm-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #1f3b63; }
        .tm-place { width: 100%; min-height: 34px; font-size: 13px; font-weight: 700; font-family: inherit;
            border: 1px solid #d6d9de; border-radius: 8px; padding: 4px 6px; background: #fff; margin-bottom: 8px; }
        .tm-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .tm-side ul { margin: 0 0 6px; padding: 0; list-style: none; }
        .tm-side li { margin-bottom: 3px; }
        .tm-chart-ttl { font-size: .85em; font-weight: 800; color: #6b7280; margin-top: 6px; }
        .tm-chart { display: block; width: 100%; height: 120px; margin: 3px 0 6px; }
        .tm-explain { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0; }

        /* Aide */
        .tm-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .tm-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 350px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .tm-help-popup.show { display: block; }
        .tm-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .tm-help-popup p { margin: 0 0 6px; }

        .tm-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .tm-resize-handle:hover { opacity: 1; }
        .tm-only-day, .tm-only-season { }
        .tm-container[data-mode="saisons"] .tm-only-day { display: none !important; }
        .tm-container[data-mode="jour"] .tm-only-season { display: none !important; }
        .tm-msg { padding: 30px; color: #b91c1c; font-weight: 700; }
    `;
    document.head.appendChild(s);
})();

// ── Constantes et outils géométriques ────────────────────────────────────
const TM_D2R = Math.PI / 180;
const TM_TILT = 23.44 * TM_D2R;
const TM_YEAR = 365.25;
const TM_EQUINOX = 79;        // ≈ 20 mars (jour n° 79, 1er janvier = 0)
const TM_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const TM_MDAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
const TM_KEYS = [
    { day: 78,  date: '20 mars',   name: 'Équinoxe de printemps', short: 'printemps' },
    { day: 171, date: '21 juin',   name: 'Solstice d\'été',        short: 'été' },
    { day: 264, date: '22 septembre', name: 'Équinoxe d\'automne', short: 'automne' },
    { day: 354, date: '21 décembre',  name: 'Solstice d\'hiver',   short: 'hiver' }
];
const TM_PLACES = [
    { id: 'paris',    name: 'Paris (France)',               lon: 2.35,    lat: 48.85 },
    { id: 'polen',    name: 'Pôle Nord',                    lon: 0,       lat: 89.5 },
    { id: 'tromso',   name: 'Tromsø (Norvège)',             lon: 18.96,   lat: 69.65 },
    { id: 'montreal', name: 'Montréal (Canada)',            lon: -73.57,  lat: 45.5 },
    { id: 'dakar',    name: 'Dakar (Sénégal)',              lon: -17.44,  lat: 14.69 },
    { id: 'cayenne',  name: 'Cayenne (Guyane)',             lon: -52.33,  lat: 4.93 },
    { id: 'quito',    name: 'Quito (Équateur)',             lon: -78.5,   lat: -0.2 },
    { id: 'reunion',  name: 'Saint-Denis (La Réunion)',     lon: 55.45,   lat: -20.88 },
    { id: 'noumea',   name: 'Nouméa (Nouvelle-Calédonie)',  lon: 166.45,  lat: -22.27 },
    { id: 'sydney',   name: 'Sydney (Australie)',           lon: 151.2,   lat: -33.87 },
    { id: 'poles',    name: 'Pôle Sud',                     lon: 0,       lat: -89.5 }
];

function _tmVec(lon, lat) {
    const l = lon * TM_D2R, p = lat * TM_D2R, c = Math.cos(p);
    return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)];
}
// Matrices 3×3
const _tmMul = (M, v) => [
    M[0][0]*v[0] + M[0][1]*v[1] + M[0][2]*v[2],
    M[1][0]*v[0] + M[1][1]*v[1] + M[1][2]*v[2],
    M[2][0]*v[0] + M[2][1]*v[1] + M[2][2]*v[2]
];
const _tmMM = (A, B) => A.map(r => [0,1,2].map(j => r[0]*B[0][j] + r[1]*B[1][j] + r[2]*B[2][j]));
const _tmTr = A => [0,1,2].map(i => [A[0][i], A[1][i], A[2][i]]);
const _tmRx = a => { const c = Math.cos(a), s = Math.sin(a); return [[1,0,0],[0,c,-s],[0,s,c]]; };
const _tmRy = a => { const c = Math.cos(a), s = Math.sin(a); return [[c,0,s],[0,1,0],[-s,0,c]]; };
const _tmRz = a => { const c = Math.cos(a), s = Math.sin(a); return [[c,-s,0],[s,c,0],[0,0,1]]; };

// Tracés des côtes densifiés (même principe que le globe terrestre)
function _tmDensify(pts) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const seam = Math.abs(a[0]) === 180 && Math.abs(b[0]) === 180;
        if (i === 0) { const v = _tmVec(a[0], a[1]); v.s = false; out.push(v); }
        const dlon = b[0] - a[0], dlat = b[1] - a[1];
        const cosl = Math.cos(((a[1] + b[1]) / 2) * TM_D2R);
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dlon) * cosl, Math.abs(dlat)) / 2));
        for (let k = 1; k <= steps; k++) {
            if (i === n - 1 && k === steps) break;
            const v = _tmVec(a[0] + dlon * k / steps, a[1] + dlat * k / steps);
            v.s = seam;
            out.push(v);
        }
        if (i === n - 1) out[0].s = seam;
    }
    return out;
}
function _tmOrient(pts) {
    let x0 = 999, x1 = -999, y0 = 999, y1 = -999;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    if (Math.max(x1 - x0, y1 - y0) < 40) return 0;       // petite île : arc le plus court
    const n = pts.length;
    const side = (p, q, r) => Math.sign((q[0]-p[0])*(r[1]-p[1]) - (q[1]-p[1])*(r[0]-p[0]));
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = pts[i], b = pts[(i+1)%n], c = pts[j], d = pts[(j+1)%n];
        if (side(a,b,c)*side(a,b,d) < 0 && side(c,d,a)*side(c,d,b) < 0) return 0;
    }
    let area = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) area += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
    return area < 0 ? -1 : 1;
}
let _TM_DATA = null;
function _tmPrepare() {
    if (_TM_DATA) return _TM_DATA;
    _TM_DATA = {
        conts: GW_CONTINENTS.map(c => ({ c, polys: GW_SHAPES[c.id].map(p => ({ v: _tmDensify(p), dir: _tmOrient(p) })) })),
        caspian: { v: _tmDensify(GW_CASPIAN), dir: _tmOrient(GW_CASPIAN) }
    };
    return _TM_DATA;
}

// Découpe d'un polygone sur l'hémisphère visible (Weiler-Atherton sur le
// cercle du bord de la Terre) — M : matrice Terre → vue.
function _tmClip(V, dir, M) {
    const n = V.length, R = new Array(n);
    let start = -1;
    for (let i = 0; i < n; i++) { R[i] = _tmMul(M, V[i]); if (start < 0 && R[i][2] >= 0) start = i; }
    if (start < 0) return null;
    const TAU = 2 * Math.PI, mod = v => ((v % TAU) + TAU) % TAU;
    const limb = (a, b) => {
        const u = a[2] / (a[2] - b[2]);
        const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, l = Math.hypot(x, y) || 1;
        return [x / l, y / l];
    };
    const chains = [];
    const first = { pts: [{ x: R[start][0], y: R[start][1], s: true }], aIn: null, aOut: null };
    let cur = first;
    for (let k = 1; k <= n; k++) {
        const a = R[(start + k - 1) % n], b = R[(start + k) % n], bs = V[(start + k) % n].s;
        const av = a[2] >= 0, bv = b[2] >= 0;
        if (av && bv) cur.pts.push({ x: b[0], y: b[1], s: bs });
        else if (av) {
            const E = limb(a, b);
            cur.pts.push({ x: E[0], y: E[1], s: bs });
            cur.aOut = Math.atan2(E[1], E[0]);
            chains.push(cur); cur = null;
        } else if (bv) {
            const I = limb(a, b);
            cur = { pts: [{ x: I[0], y: I[1], s: true }, { x: b[0], y: b[1], s: bs }], aIn: Math.atan2(I[1], I[0]), aOut: null };
        }
    }
    if (!chains.length) return [first.pts];
    if (cur !== first) { first.pts = cur.pts.concat(first.pts.slice(1)); first.aIn = cur.aIn; }
    const rings = [], used = new Set();
    for (let i0 = 0; i0 < chains.length; i0++) {
        if (used.has(i0)) continue;
        const ring = [];
        let c = i0, guard = 0;
        while (!used.has(c) && guard++ <= chains.length) {
            used.add(c);
            const ch = chains[c];
            for (const p of ch.pts) ring.push(p);
            let best = c, bd = Infinity, span = 0;
            for (let j = 0; j < chains.length; j++) {
                const fwd = mod(chains[j].aIn - ch.aOut), back = mod(ch.aOut - chains[j].aIn);
                const cand = dir > 0 ? [fwd] : dir < 0 ? [-back] : [fwd, -back];
                for (const sp of cand) if (Math.abs(sp) < bd) { bd = Math.abs(sp); best = j; span = sp; }
            }
            const steps = Math.max(1, Math.ceil(bd / (4 * TM_D2R)));
            for (let j = 1; j < steps; j++) {
                const ang = ch.aOut + span * j / steps;
                ring.push({ x: Math.cos(ang), y: Math.sin(ang), s: true });
            }
            c = best;
        }
        rings.push(ring);
    }
    return rings;
}

// ── Astronomie (simplifiée : orbite circulaire, temps solaire) ───────────
// Position de la Terre sur son orbite, vue du pôle Nord céleste : sens
// inverse des aiguilles d'une montre. Repère « monde » : X à droite,
// Y = nord de l'écliptique, Z vers l'observateur.
function _tmOrbitAngle(day) { return -Math.PI / 2 + 2 * Math.PI * (day - TM_EQUINOX) / TM_YEAR; }
// Renvoie la matrice Terre → monde, la direction du Soleil (monde) vue de
// la Terre, et la direction du Soleil dans le repère terrestre.
function _tmAstro(day, utc) {
    const phi = _tmOrbitAngle(day);
    const P = [Math.cos(phi), 0, -Math.sin(phi)];            // Terre (Soleil à l'origine)
    const u = [-P[0], 0, -P[2]];                              // vers le Soleil
    const T = _tmRz(TM_TILT);                                 // axe penché, toujours dans la même direction
    const v = _tmMul(_tmTr(T), u);
    const lamS = (12 - utc) * 15 * TM_D2R;                    // longitude où il est midi
    const psi = Math.atan2(v[0], v[2]) - lamS;
    const E2W = _tmMM(T, _tmRy(psi));
    const s = _tmMul(_tmRy(-psi), v);                         // Soleil dans le repère terrestre
    return { phi, P, u, E2W, s, decl: Math.asin(Math.max(-1, Math.min(1, s[1]))), lamS };
}
function _tmDayLength(latDeg, decl) {
    const x = -Math.tan(latDeg * TM_D2R) * Math.tan(decl);
    if (x <= -1) return 24;
    if (x >= 1) return 0;
    return 2 * Math.acos(x) / TM_D2R / 15;
}
function _tmAltitude(latDeg, decl, solarHour) {
    const p = latDeg * TM_D2R, H = (solarHour - 12) * 15 * TM_D2R;
    return Math.asin(Math.sin(p) * Math.sin(decl) + Math.cos(p) * Math.cos(decl) * Math.cos(H)) / TM_D2R;
}
function _tmFmtH(h) {
    h = ((h % 24) + 24) % 24;
    let H = Math.floor(h), m = Math.round((h - H) * 60);
    if (m === 60) { H = (H + 1) % 24; m = 0; }
    return H + ' h ' + String(m).padStart(2, '0');
}
function _tmFmtDur(h) {
    let H = Math.floor(h), m = Math.round((h - H) * 60);
    if (m === 60) { H++; m = 0; }
    return H + ' h ' + String(m).padStart(2, '0');
}
function _tmDate(day) {
    let d = Math.floor(((day % 365) + 365) % 365);
    for (let m = 0; m < 12; m++) {
        if (d < TM_MDAYS[m]) return (d + 1 === 1 ? '1er' : (d + 1)) + ' ' + TM_MONTHS[m];
        d -= TM_MDAYS[m];
    }
    return '31 décembre';
}
function _tmSeasonN(day) {
    const d = ((day % 365) + 365) % 365;
    if (d >= 78 && d < 171) return 'printemps';
    if (d >= 171 && d < 264) return 'été';
    if (d >= 264 && d < 354) return 'automne';
    return 'hiver';
}
const TM_OPP = { printemps: 'automne', 'été': 'hiver', automne: 'printemps', hiver: 'été' };
const TM_SEASON_ICO = { printemps: '🌸', 'été': '☀️', automne: '🍂', hiver: '❄️' };

// Petit générateur pseudo-aléatoire (étoiles identiques à chaque image)
function _tmStars(n, seed) {
    let x = seed;
    const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const a = [];
    for (let i = 0; i < n; i++) a.push([r(), r(), 0.3 + r() * 0.9, 0.25 + r() * 0.6]);
    return a;
}

// ── Création du widget ────────────────────────────────────────────────────
function createTerreMouvementWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'terre-mouvement';
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
    container.className = 'tm-container';
    container.dataset.mode = 'jour';
    let contW = Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'tm-header';
    header.innerHTML = `
        <span class="tm-title">🌗 La Terre en mouvement</span>
        <div class="tm-tabs">
            <button class="tm-tab on" data-mode="jour">☀️ Jour et nuit</button>
            <button class="tm-tab" data-mode="saisons">🍂 Les saisons</button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'tm-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    if (typeof GW_SHAPES === 'undefined' || typeof GW_CONTINENTS === 'undefined') {
        const msg = document.createElement('div');
        msg.className = 'tm-msg';
        msg.textContent = 'Le fichier widget-geo-monde.js doit être chargé avant widget-terre-mouvement.js.';
        container.appendChild(msg);
        container.style.width = '440px';
        board.appendChild(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        return widget;
    }
    const DATA = _tmPrepare();

    // Ligne 1 : lecture, options
    const row1 = document.createElement('div');
    row1.className = 'tm-row';
    row1.innerHTML = `
        <button class="tm-btn tm-btn-play" title="Lancer / arrêter le mouvement">▶ Lecture</button>
        <button class="tm-btn tm-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="tm-sep"></span>
        <span class="tm-lbl tm-only-day">Vue :</span>
        <button class="tm-btn tm-view tm-only-day on" data-view="60" title="La Terre vue de trois-quarts, côté Soleil">De trois-quarts</button>
        <button class="tm-btn tm-view tm-only-day" data-view="90" title="La Terre vue de profil : moitié jour, moitié nuit">De profil</button>
        <span class="tm-sep tm-only-day"></span>
        <button class="tm-btn tm-rays tm-only-day on" title="Afficher les rayons du Soleil">☀️ Rayons</button>
        <button class="tm-btn tm-lines on" title="Équateur, tropiques et cercles polaires">🧭 Repères</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : date et heure
    const row2 = document.createElement('div');
    row2.className = 'tm-row';
    row2.innerHTML = `
        <span class="tm-lbl">Date :</span>
        ${TM_KEYS.map(k => `<button class="tm-btn tm-date-btn" data-day="${k.day}" title="${k.name}">${k.date.replace('septembre','sept.').replace('décembre','déc.')}</button>`).join('')}
        <div class="tm-slider-box">
            <input type="range" class="tm-slider tm-day" min="0" max="364" step="1" value="171" aria-label="Date">
            <span class="tm-val tm-day-val"></span>
        </div>
        <div class="tm-slider-box tm-only-day">
            <span class="tm-lbl">Heure :</span>
            <input type="range" class="tm-slider tm-hour" min="0" max="24" step="0.05" value="12" aria-label="Heure solaire au lieu choisi">
            <span class="tm-val tm-hour-val"></span>
        </div>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'tm-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'tm-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'tm-canvas';
    const hint = document.createElement('div');
    hint.className = 'tm-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'tm-side';
    side.innerHTML = `
        <h4 class="tm-side-ttl"></h4>
        <select class="tm-place" aria-label="Lieu suivi">
            ${TM_PLACES.map(p => `<option value="${p.id}">📍 ${p.name}</option>`).join('')}
            <option value="custom">📍 Lieu choisi sur le globe</option>
        </select>
        <div class="tm-status"></div>
        <ul class="tm-facts"></ul>
        <div class="tm-chart-ttl">Hauteur du Soleil dans le ciel au fil de la journée</div>
        <canvas class="tm-chart"></canvas>
        <p class="tm-explain"></p>
    `;
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'tm-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La Terre en mouvement</h4>
        <p><b>☀️ Jour et nuit</b> : le Soleil éclaire toujours la moitié de la Terre tournée vers lui.
        <b>Fais glisser le globe</b> de gauche à droite pour le faire tourner (ou ▶ Lecture) : la Terre
        tourne sur elle-même en 24 h, d'ouest en est. Le lieu suivi 📍 passe du jour à la nuit.
        <b>Touche le globe</b> pour choisir un autre lieu.</p>
        <p><b>🍂 Les saisons</b> : la Terre fait le tour du Soleil en un an. Son axe reste penché de
        23,4° dans la même direction. <b>Fais glisser la Terre</b> sur son orbite ou touche une des quatre
        dates. Quand un hémisphère est penché vers le Soleil, les rayons y arrivent plus droit et les
        journées sont plus longues : c'est l'été.</p>
        <p>La fiche de droite donne, pour le lieu suivi : jour ou nuit, durée du jour, lever et coucher
        du Soleil, hauteur du Soleil à midi.</p>
        <p style="color:#888">Modèle simplifié : orbite circulaire, heures en <b>heure solaire</b>
        (midi = Soleil au plus haut), sans les fuseaux horaires ni l'heure d'été. Les tailles et
        distances ne sont pas à l'échelle.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'tm-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const chart = side.querySelector('.tm-chart');
    const cctx = chart.getContext('2d');
    const ov = document.createElement('canvas');       // calque nuit (calculé pixel par pixel)
    const octx = ov.getContext('2d');
    let ovImg = null;
    const STARS = _tmStars(170, 12345);

    const $ = sel => container.querySelector(sel);
    const playBtn = $('.tm-btn-play'), speedBtn = $('.tm-btn-speed');
    const raysBtn = $('.tm-rays'), linesBtn = $('.tm-lines');
    const daySl = $('.tm-day'), dayVal = $('.tm-day-val');
    const hourSl = $('.tm-hour'), hourVal = $('.tm-hour-val');
    const placeSel = side.querySelector('.tm-place');
    const customOpt = placeSel.querySelector('option[value="custom"]');
    const sideTtl = side.querySelector('.tm-side-ttl'), statusEl = side.querySelector('.tm-status');
    const factsEl = side.querySelector('.tm-facts'), explainEl = side.querySelector('.tm-explain');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'jour';
    let day = 171;                    // 21 juin
    let place = { ...TM_PLACES[0] };
    let utc = 12 - place.lon / 15;    // midi solaire à Paris
    let camLat = 18 * TM_D2R;
    let viewOff = 60;
    let showRays = true, showLines = true;
    let playing = false, fast = false;
    let velLon = 0;                   // inertie (rad/s) dans « Jour et nuit »
    let dayAnim = null;               // animation vers une date
    let animId = null, lastT = 0, drawPending = false;
    let cssW = 0, cssH = 0, dpr = 1;
    let keyHits = [];                 // zones touchables des 4 dates (onglet saisons)
    let orbitGeo = null;              // géométrie de l'orbite (onglet saisons)

    const solarHour = () => (((utc + place.lon / 15) % 24) + 24) % 24;

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }

    // ── Dessin d'un globe éclairé ─────────────────────────────────────────
    // M : matrice Terre → vue ; sv : direction du Soleil dans la vue
    function drawGlobe(cx, cy, r, M, sv, opt) {
        const S = (x, y) => [cx + x * r, cy - y * r];
        // halo d'atmosphère, plus fort côté Soleil
        const hl = Math.hypot(sv[0], sv[1]) || 1;
        const hx = cx + sv[0] / hl * r * 0.12, hy = cy - sv[1] / hl * r * 0.12;
        const halo = ctx.createRadialGradient(hx, hy, r * 0.95, hx, hy, r * 1.16);
        halo.addColorStop(0, 'rgba(130,190,250,0.45)');
        halo.addColorStop(1, 'rgba(130,190,250,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(hx, hy, r * 1.16, 0, 2 * Math.PI); ctx.fill();

        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#5d93bd'; ctx.fill();
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();
        ctx.lineJoin = 'round';
        if (!opt.simple) {
            const path = rings => {
                ctx.beginPath();
                for (const pts of rings) {
                    pts.forEach((p, i) => { const q = S(p.x, p.y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
                    ctx.closePath();
                }
            };
            for (const { c, polys } of DATA.conts) {
                for (const poly of polys) {
                    const rings = _tmClip(poly.v, poly.dir, M);
                    if (!rings) continue;
                    path(rings);
                    ctx.fillStyle = c.col; ctx.fill();
                    if (r > 60) {
                        ctx.beginPath();
                        for (const pts of rings)
                            pts.forEach((p, i) => { const q = S(p.x, p.y); (i === 0 || p.s) ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); });
                        ctx.strokeStyle = 'rgba(80,88,100,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
                    }
                }
            }
            const casp = _tmClip(DATA.caspian.v, DATA.caspian.dir, M);
            if (casp) { path(casp); ctx.fillStyle = '#5d93bd'; ctx.fill(); }
        }
        // Repères : équateur, tropiques, cercles polaires
        if (opt.lines) {
            const lines = [[0, '#ff6b5e', []], [23.44, '#ffb347', [6, 4]], [-23.44, '#ffb347', [6, 4]], [66.56, '#8fd3ff', [2, 4]], [-66.56, '#8fd3ff', [2, 4]]];
            ctx.lineWidth = Math.max(1.2, r / 120);
            for (const [lat, col, dash] of lines) {
                ctx.beginPath();
                let pen = false;
                for (let k = 0; k <= 120; k++) {
                    const p = _tmMul(M, _tmVec(-180 + 3 * k, lat));
                    if (p[2] >= 0) { const q = S(p[0], p[1]); pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; }
                    else pen = false;
                }
                ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.stroke();
            }
            ctx.setLineDash([]);
        }
        // Nuit : calque calculé pixel par pixel (avec crépuscule progressif)
        drawNight(cx, cy, r, sv);
        // Noms des continents
        if (opt.labels) {
            const fs = Math.max(11, Math.min(22, r * 0.058));
            ctx.font = `900 ${fs.toFixed(1)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.lineWidth = 3; ctx.lineJoin = 'round';
            for (const c of GW_CONTINENTS) {
                const p = _tmMul(M, _tmVec(c.lbl[0], c.lbl[1]));
                if (p[2] < 0.15) continue;
                const lit = p[0] * sv[0] + p[1] * sv[1] + p[2] * sv[2];
                ctx.globalAlpha = Math.min(1, (p[2] - 0.15) / 0.25) * (lit > 0 ? 1 : 0.55);
                const q = S(p[0], p[1]);
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.fillStyle = '#1f2937';
                ctx.strokeText(c.name, q[0], q[1]); ctx.fillText(c.name, q[0], q[1]);
            }
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(190,220,250,0.5)'; ctx.lineWidth = 1; ctx.stroke();

        // Axe des pôles (caché quand il passe derrière la Terre)
        if (opt.axis) {
            const N = _tmMul(M, [0, 1, 0]);
            ctx.lineWidth = Math.max(1.5, r / 70);
            ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            ctx.lineCap = 'round';
            for (const sg of [1, -1]) {
                ctx.beginPath();
                let pen = false;
                for (let k = 0; k <= 30; k++) {
                    const t = 1 + 0.18 * k / 30;
                    const x = sg * N[0] * t, y = sg * N[1] * t, z = sg * N[2] * t;
                    const hidden = z < 0 && x * x + y * y < 1;
                    if (!hidden) { const q = S(x, y); pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; }
                    else pen = false;
                }
                ctx.stroke();
                const tip = S(sg * N[0] * 1.17, sg * N[1] * 1.17);
                const hiddenEnd = sg * N[2] < 0 && (N[0] * N[0] + N[1] * N[1]) * 1.37 < 1;
                if (!hiddenEnd) {
                    const fs = Math.max(11, Math.min(18, r * 0.09));
                    ctx.font = `900 ${fs}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = sg > 0 ? '#ffffff' : 'rgba(255,255,255,0.75)';
                    ctx.fillText(sg > 0 ? 'N' : 'S', tip[0] + fs * 0.85, tip[1]);
                }
            }
        }
        // Lieu suivi
        if (opt.marker) {
            const p = _tmMul(M, _tmVec(place.lon, place.lat));
            if (p[2] > 0.02) {
                const q = S(p[0], p[1]);
                const lit = p[0] * sv[0] + p[1] * sv[1] + p[2] * sv[2];
                const rr = Math.max(4, Math.min(8, r * 0.03));
                ctx.beginPath(); ctx.arc(q[0], q[1], rr + 3, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
                ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, 2 * Math.PI);
                ctx.fillStyle = '#e0335c'; ctx.fill();
                if (opt.markerLabel) {
                    const fs = Math.max(12, Math.min(17, r * 0.05));
                    ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                    const txt = (lit > 0 ? '☀️ ' : '🌙 ') + place.name.replace(/ \(.*\)$/, '');
                    const w = ctx.measureText(txt).width;
                    const bx = q[0] + rr + 6, by = q[1];
                    ctx.fillStyle = 'rgba(255,255,255,0.92)';
                    ctx.beginPath();
                    if (ctx.roundRect) ctx.roundRect(bx - 4, by - fs * 0.75, w + 8, fs * 1.5, 6); else ctx.rect(bx - 4, by - fs * 0.75, w + 8, fs * 1.5);
                    ctx.fill();
                    ctx.fillStyle = '#1f2937';
                    ctx.fillText(txt, bx, by + 1);
                }
            }
        }
    }

    function drawNight(cx, cy, r, sv) {
        const N = Math.max(24, Math.min(300, Math.ceil(2 * r * Math.min(dpr, 2) * 0.33)));
        if (ov.width !== N) { ov.width = N; ov.height = N; ovImg = octx.createImageData(N, N); }
        const d = ovImg.data;
        for (let j = 0; j < N; j++) {
            const y = 1 - (j + 0.5) / N * 2;
            for (let i = 0; i < N; i++) {
                const x = (i + 0.5) / N * 2 - 1, q = x * x + y * y, k = (j * N + i) * 4;
                if (q > 1.02) { d[k + 3] = 0; continue; }
                const z = Math.sqrt(Math.max(0, 1 - q));
                const lum = x * sv[0] + y * sv[1] + z * sv[2];
                let a;
                if (lum > 0.1) a = 0.16 * (1 - lum) * (1 - lum);          // léger ombrage côté jour
                else if (lum > -0.12) a = 0.13 + 0.65 * (0.1 - lum) / 0.22; // crépuscule
                else a = 0.78;                                              // nuit
                d[k] = 6; d[k + 1] = 12; d[k + 2] = 34; d[k + 3] = Math.round(a * 255);
            }
        }
        octx.putImageData(ovImg, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(ov, cx - r, cy - r, 2 * r, 2 * r);
    }

    function drawSky() {
        const g = ctx.createRadialGradient(cssW * 0.5, cssH * 0.45, 10, cssW * 0.5, cssH * 0.5, Math.max(cssW, cssH) * 0.8);
        g.addColorStop(0, '#16263d'); g.addColorStop(1, '#060c17');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH);
        for (const [x, y, s, a] of STARS) {
            ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
            ctx.fillRect(x * cssW, y * cssH, s, s);
        }
        ctx.globalAlpha = 1;
    }

    function drawSun(x, y, rs) {
        const g = ctx.createRadialGradient(x, y, rs * 0.3, x, y, rs * 2.6);
        g.addColorStop(0, 'rgba(255,214,102,0.9)');
        g.addColorStop(0.35, 'rgba(255,170,60,0.35)');
        g.addColorStop(1, 'rgba(255,150,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, rs * 2.6, 0, 2 * Math.PI); ctx.fill();
        const c = ctx.createRadialGradient(x - rs * 0.3, y - rs * 0.3, rs * 0.1, x, y, rs);
        c.addColorStop(0, '#fff6c8'); c.addColorStop(0.6, '#ffd24a'); c.addColorStop(1, '#f5a623');
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, rs, 0, 2 * Math.PI); ctx.fill();
    }

    // ── Scène « Jour et nuit » ────────────────────────────────────────────
    let dayGeo = null;
    function drawDayScene(A) {
        // Caméra liée au Soleil : le Soleil reste à gauche, la Terre tourne
        const lon0 = A.lamS + viewOff * TM_D2R;
        const M = _tmMM(_tmRx(camLat), _tmRy(-lon0));
        const sv = _tmMul(M, A.s);
        const r = Math.min(cssW * 0.31, cssH * 0.37);
        const cx = cssW * 0.58, cy = cssH * 0.47;
        dayGeo = { cx, cy, r, M };

        // Soleil placé exactement dans la direction d'où viennent ses rayons
        const l2 = Math.hypot(sv[0], sv[1]) || 1;
        const ux = sv[0] / l2, uy = -sv[1] / l2;
        const rs = r * 0.2;
        let D = r * 1.6;
        if (ux < 0) D = Math.min(D, (cx - rs * 1.25) / -ux);
        if (uy < 0) D = Math.min(D, (cy - rs * 1.25) / -uy);
        if (uy > 0) D = Math.min(D, (cssH - cy - rs * 1.25) / uy);
        D = Math.max(D, r * 1.25);
        const sx = cx + ux * D, sy = cy + uy * D;
        drawSun(sx, sy, rs);

        // Rayons parallèles : du Soleil jusqu'à la surface de la Terre
        if (showRays) {
            const px = -uy, py = ux;          // perpendiculaire
            ctx.strokeStyle = 'rgba(255,214,102,0.75)';
            ctx.fillStyle = 'rgba(255,214,102,0.85)';
            ctx.lineWidth = Math.max(1.5, r / 140);
            for (let k = -3; k <= 3; k++) {
                const o = k * r * 0.27;
                const hit = Math.sqrt(Math.max(0, r * r - o * o));
                const x1 = cx + ux * (hit + 4) + px * o, y1 = cy + uy * (hit + 4) + py * o;
                // départ : à hauteur du Soleil, le long des rayons
                const back = (sx - x1) * ux + (sy - y1) * uy - (Math.abs(o) < rs * 1.3 ? rs * 1.25 : 0);
                if (back <= 12) continue;
                const x0 = x1 + ux * back, y0 = y1 + uy * back;
                ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
                const ah = Math.max(6, r * 0.035);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x1 + ux * ah + px * ah * 0.5, y1 + uy * ah + py * ah * 0.5);
                ctx.lineTo(x1 + ux * ah - px * ah * 0.5, y1 + uy * ah - py * ah * 0.5);
                ctx.closePath(); ctx.fill();
            }
        }
        drawGlobe(cx, cy, r, M, sv, { lines: showLines, labels: true, axis: true, marker: true, markerLabel: true });

        // Légendes « JOUR » / « NUIT » de part et d'autre
        const fs = Math.max(13, Math.min(22, r * 0.075));
        ctx.font = `900 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,224,140,0.95)';
        ctx.fillText('☀️ Jour', cx - r * 0.55, cy + r + fs * 1.1);
        ctx.fillStyle = 'rgba(170,190,230,0.9)';
        ctx.fillText('🌙 Nuit', cx + r * 0.55, cy + r + fs * 1.1);
        // Sens de rotation (flèche courbe au-dessus du globe)
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
        const ay = cy - r - Math.max(10, r * 0.1), aw = r * 0.5;
        ctx.beginPath(); ctx.ellipse(cx, ay, aw, r * 0.08, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
        const eyy = ay + r * 0.08 * Math.sin(Math.PI * 0.15);
        const tip = [cx + aw * Math.cos(Math.PI * 0.15), eyy];
        ctx.beginPath();
        ctx.moveTo(tip[0] + 6, tip[1] + 2); ctx.lineTo(tip[0] - 6, tip[1] - 5); ctx.lineTo(tip[0] - 4, tip[1] + 7); ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }

    // ── Scène « Les saisons » ─────────────────────────────────────────────
    const CAM_E = 24 * TM_D2R;
    function drawSeasonScene(A) {
        const se = Math.sin(CAM_E);
        const Ro = Math.min(cssW * 0.33, (cssH * 0.30) / se);
        const cx = cssW * 0.5, cy = cssH * 0.52;
        const Cam = _tmRx(CAM_E);
        const toScreen = w => { const v = _tmMul(Cam, w); return [cx + v[0] * Ro, cy - v[1] * Ro, v[2]]; };
        orbitGeo = { cx, cy, Ro, se };
        const rE = Math.min(cssW, cssH) * 0.1;

        // Orbite
        ctx.setLineDash([5, 6]);
        ctx.strokeStyle = 'rgba(200,215,240,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, Ro, Ro * se, 0, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
        // Flèches du sens de parcours
        for (const a of [Math.PI * 0.25, Math.PI * 1.25]) {
            const p = toScreen([Math.cos(a), 0, -Math.sin(a)]);
            const p2 = toScreen([Math.cos(a + 0.05), 0, -Math.sin(a + 0.05)]);
            const dx = p2[0] - p[0], dy = p2[1] - p[1], l = Math.hypot(dx, dy) || 1;
            const ux = dx / l, uy = dy / l;
            ctx.beginPath();
            ctx.moveTo(p[0] + ux * 8, p[1] + uy * 8);
            ctx.lineTo(p[0] - ux * 6 - uy * 6, p[1] - uy * 6 + ux * 6);
            ctx.lineTo(p[0] - ux * 6 + uy * 6, p[1] - uy * 6 - ux * 6);
            ctx.closePath();
            ctx.fillStyle = 'rgba(200,215,240,0.7)'; ctx.fill();
        }

        // Positions clés : petites Terres « fantômes » + étiquettes touchables
        keyHits = [];
        const items = [];
        TM_KEYS.forEach(k => {
            const phi = _tmOrbitAngle(k.day);
            const w = [Math.cos(phi), 0, -Math.sin(phi)];
            const p = toScreen(w);
            items.push({ type: 'key', k, p, z: p[2] });
        });
        const myP = toScreen(A.P);
        items.push({ type: 'earth', p: myP, z: myP[2] });
        items.sort((a, b) => a.z - b.z);

        const sunR = Math.min(cssW, cssH) * 0.07;
        let sunDrawn = false;
        const drawSunOnce = () => { if (!sunDrawn) { drawSun(cx, cy, sunR); sunDrawn = true; } };

        for (const it of items) {
            if (it.z >= 0) drawSunOnce();           // le Soleil passe devant ce qui est derrière lui
            const depthScale = 1 + 0.16 * it.z;
            if (it.type === 'key') {
                const k = it.k;
                const near = Math.abs(((day - k.day + 182.5) % 365 + 365) % 365 - 182.5) < 12;
                const Ak = _tmAstro(k.day, utc);
                const Mk = _tmMM(Cam, Ak.E2W);
                const svk = _tmMul(Cam, Ak.u);
                const rr = rE * 0.55 * depthScale;
                if (!near) {
                    ctx.globalAlpha = 0.8;
                    drawGlobe(it.p[0], it.p[1], rr, Mk, svk, { simple: true, axis: true });
                    ctx.globalAlpha = 1;
                }
                // étiquette sous la Terre (au-dessus pour la position du fond)
                const above = it.p[1] < cy - Ro * se * 0.5;
                const ly0 = above ? it.p[1] - rE * 1.45 : it.p[1] + rE * 1.45;
                const fs = Math.max(11, Math.min(15, rE * 0.2));
                ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                const w = Math.max(ctx.measureText(k.name).width, ctx.measureText(k.date).width) + 14;
                const h = fs * 2.5;
                const lx = Math.max(w / 2 + 6, Math.min(cssW - w / 2 - 6, it.p[0]));
                const ly = Math.max(h / 2 + 4, Math.min(cssH - h / 2 - 24, ly0));
                const on = near;
                ctx.fillStyle = on ? 'rgba(232,131,58,0.95)' : 'rgba(255,255,255,0.14)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(lx - w / 2, ly - h / 2, w, h, 8); else ctx.rect(lx - w / 2, ly - h / 2, w, h);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText(k.date, lx, ly - fs * 0.6);
                ctx.font = `600 ${fs * 0.9}px 'Segoe UI', system-ui, sans-serif`;
                ctx.fillText(k.name, lx, ly + fs * 0.62);
                keyHits.push({ day: k.day, x: lx - w / 2 - 8, y: ly - h / 2 - 8, w: w + 16, h: h + 16, px: it.p[0], py: it.p[1], pr: rr + 10 });
            } else {
                const M = _tmMM(Cam, A.E2W);
                const sv = _tmMul(Cam, A.u);
                const rr = rE * depthScale;
                drawGlobe(it.p[0], it.p[1], rr, M, sv, { lines: showLines, labels: false, axis: true, marker: true });
                orbitGeo.earth = { x: it.p[0], y: it.p[1], r: rr };
            }
        }
        drawSunOnce();

        // Rappel : l'axe garde toujours la même direction
        const fs = Math.max(11, Math.min(14, cssW / 70));
        ctx.font = `700 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(214,228,244,0.75)';
        ctx.fillText('L\'axe de la Terre reste penché de 23,4°,', 12, 10);
        ctx.fillText('toujours dans la même direction.', 12, 10 + fs * 1.3);
        ctx.textAlign = 'right';
        ctx.fillText('Noms des saisons :', cssW - 12, 10);
        ctx.fillText('hémisphère Nord', cssW - 12, 10 + fs * 1.3);
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        drawSky();
        const A = _tmAstro(day, utc);
        if (mode === 'jour') drawDayScene(A); else drawSeasonScene(A);
        updateInfo(A);
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function updateInfo(A) {
        const t = solarHour();
        const decl = A.decl;
        const alt = _tmAltitude(place.lat, decl, t);
        const len = _tmDayLength(place.lat, decl);
        const noon = 90 - Math.abs(place.lat - decl / TM_D2R);
        const sN = _tmSeasonN(day);
        const southern = place.lat < 0;
        const seasonHere = southern ? TM_OPP[sN] : sN;

        dayVal.textContent = _tmDate(day);
        if (Number(daySl.value) !== Math.floor(day)) daySl.value = Math.floor(((day % 365) + 365) % 365);
        hourVal.textContent = _tmFmtH(t);
        if (document.activeElement !== hourSl) hourSl.value = t.toFixed(2);

        const key = [mode, Math.floor(day), Math.round(t * 12), place.id, place.lon, place.lat].join('|');
        drawChart(decl, t);
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        sideTtl.textContent = mode === 'jour' ? 'Jour ou nuit ?' : 'Les saisons';
        customOpt.hidden = place.id !== 'custom';
        if (place.id === 'custom') customOpt.textContent = '📍 ' + place.name;
        if (placeSel.value !== place.id) placeSel.value = place.id;

        let status;
        if (alt > 0.8) status = '<span style="color:#d9822b">☀️ Il fait jour</span>';
        else if (alt > -6) status = '<span style="color:#8a5ab8">🌅 Le Soleil est à l\'horizon</span>';
        else status = '<span style="color:#2f4f9e">🌙 Il fait nuit</span>';

        const rows = [];
        rows.push(`<li><b>Date :</b> ${_tmDate(day)}</li>`);
        if (mode === 'jour') rows.push(`<li><b>Heure solaire :</b> ${_tmFmtH(t)}</li>`);
        rows.push(`<li><b>Saison :</b> ${TM_SEASON_ICO[seasonHere]} ${seasonHere}${southern ? ' (hémisphère Sud)' : ''}</li>`);
        if (len >= 24) rows.push('<li><b>Jour polaire :</b> le Soleil ne se couche pas</li>');
        else if (len <= 0) rows.push('<li><b>Nuit polaire :</b> le Soleil ne se lève pas</li>');
        else {
            rows.push(`<li><b>Durée du jour :</b> ${_tmFmtDur(len)}</li>`);
            rows.push(`<li><b>Lever :</b> ${_tmFmtH(12 - len / 2)} · <b>coucher :</b> ${_tmFmtH(12 + len / 2)}</li>`);
        }
        rows.push(`<li><b>Hauteur du Soleil à midi :</b> ${noon > 0 ? Math.round(noon) + '°' : 'sous l\'horizon'}</li>`);
        factsEl.innerHTML = rows.join('');
        statusEl.innerHTML = mode === 'jour' ? status : `${TM_SEASON_ICO[seasonHere]} <span style="color:#b45309">C'est ${seasonHere === 'été' ? 'l\'été' : seasonHere === 'automne' ? 'l\'automne' : seasonHere === 'hiver' ? 'l\'hiver' : 'le printemps'}</span>`;
        explainEl.innerHTML = mode === 'jour' ? explainDay(alt, len) : explainSeason();
    }

    function explainDay(alt, len) {
        const base = 'La Terre tourne sur elle-même en <b>24 heures</b>, d\'ouest en est. ' +
            'Le Soleil n\'éclaire que <b>la moitié</b> de la Terre tournée vers lui : là, il fait jour ; ' +
            'sur l\'autre moitié, il fait nuit.';
        if (len >= 24) return base + ' Ici, en ce moment de l\'année, le lieu reste du côté éclairé pendant toute la rotation : c\'est le <b>jour polaire</b>.';
        if (len <= 0) return base + ' Ici, en ce moment de l\'année, le lieu reste dans l\'ombre pendant toute la rotation : c\'est la <b>nuit polaire</b>.';
        if (alt > 0.8) return base + ' En tournant, le lieu suivi finira par passer dans la nuit : le Soleil se couchera à l\'ouest.';
        return base + ' En tournant, le lieu suivi reviendra du côté éclairé : le Soleil se lèvera à l\'est.';
    }

    function explainSeason() {
        const d = ((day % 365) + 365) % 365;
        const dist = k => Math.abs(((d - k + 182.5) % 365 + 365) % 365 - 182.5);
        if (dist(78) < 12 || dist(264) < 12) {
            return 'Aux <b>équinoxes</b> (vers le 20 mars et le 22 septembre), aucun des deux pôles n\'est penché vers le Soleil. ' +
                'Le jour et la nuit durent alors environ <b>12 heures</b> partout sur Terre.';
        }
        const sN = _tmSeasonN(day);
        if (sN === 'été' || sN === 'printemps' && d > 140) {
            return 'Le <b>pôle Nord est penché vers le Soleil</b>. Dans l\'hémisphère Nord (en France), le Soleil monte haut ' +
                'dans le ciel, ses rayons arrivent plus droit et chauffent davantage, et les journées sont longues : c\'est l\'été. ' +
                'Au même moment, c\'est l\'hiver dans l\'hémisphère Sud.';
        }
        if (sN === 'hiver' || sN === 'automne' && d > 320) {
            return 'Le <b>pôle Nord est penché à l\'opposé du Soleil</b>. Dans l\'hémisphère Nord, le Soleil reste bas, ' +
                'ses rayons arrivent de biais et chauffent moins, et les journées sont courtes : c\'est l\'hiver. ' +
                'Au même moment, c\'est l\'été dans l\'hémisphère Sud. ' +
                '<br><i>Le savais-tu ? La Terre est un peu plus près du Soleil début janvier : ce n\'est donc pas la distance qui fait les saisons, mais l\'inclinaison de l\'axe.</i>';
        }
        return 'Les saisons viennent de l\'<b>inclinaison de l\'axe</b> de la Terre (23,4°). Au fil de l\'année, ' +
            'chaque hémisphère est tour à tour penché vers le Soleil (été) puis à l\'opposé (hiver).';
    }

    // Courbe de la hauteur du Soleil (heure solaire 0 → 24 h)
    function drawChart(decl, t) {
        const W = chart.clientWidth || 260, H = chart.clientHeight || 120;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        if (chart.width !== Math.round(W * r) || chart.height !== Math.round(H * r)) { chart.width = Math.round(W * r); chart.height = Math.round(H * r); }
        cctx.setTransform(r, 0, 0, r, 0, 0);
        cctx.clearRect(0, 0, W, H);
        const L = 26, Rr = 6, T = 8, B = 18;
        const y0 = T + (H - T - B) * 90 / 150;      // horizon (échelle −60° … +90°)
        const X = h => L + (W - L - Rr) * h / 24;
        const Y = a => y0 - (H - T - B) * a / 150;
        // ciel / sol
        cctx.fillStyle = '#e4f1fb'; cctx.fillRect(L, T, W - L - Rr, y0 - T);
        cctx.fillStyle = '#e9e4d8'; cctx.fillRect(L, y0, W - L - Rr, H - B - y0);
        // courbe
        cctx.beginPath();
        for (let k = 0; k <= 96; k++) { const h = k / 4, a = _tmAltitude(place.lat, decl, h); k ? cctx.lineTo(X(h), Y(a)) : cctx.moveTo(X(h), Y(a)); }
        cctx.strokeStyle = '#e8833a'; cctx.lineWidth = 2; cctx.stroke();
        // horizon
        cctx.beginPath(); cctx.moveTo(L, y0); cctx.lineTo(W - Rr, y0);
        cctx.strokeStyle = '#7a6a4f'; cctx.lineWidth = 1.2; cctx.stroke();
        // graduations
        cctx.fillStyle = '#6b7280'; cctx.font = "600 10px 'Segoe UI', system-ui, sans-serif";
        cctx.textAlign = 'center'; cctx.textBaseline = 'top';
        for (const h of [0, 6, 12, 18, 24]) { cctx.fillText(h + ' h', X(h), H - B + 4); }
        cctx.textAlign = 'right'; cctx.textBaseline = 'middle';
        cctx.fillText('90°', L - 4, Y(90)); cctx.fillText('0°', L - 4, y0); cctx.fillText('45°', L - 4, Y(45));
        cctx.fillStyle = '#7a6a4f'; cctx.textAlign = 'left';
        cctx.fillText('horizon', L + 3, y0 + 7);
        // Soleil à l'heure actuelle (Jour et nuit) ou à midi (Saisons)
        const th = mode === 'jour' ? t : 12;
        const a = _tmAltitude(place.lat, decl, th);
        cctx.beginPath(); cctx.arc(X(th), Y(a), 6, 0, 2 * Math.PI);
        cctx.fillStyle = a > 0 ? '#ffc93c' : '#9aa5b8'; cctx.fill();
        cctx.strokeStyle = '#b45309'; cctx.lineWidth = 1.2; cctx.stroke();
    }

    // ── Boucle d'animation ────────────────────────────────────────────────
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    function loop(t) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (dayAnim) {
            const k = Math.min(1, (t - dayAnim.t0) / dayAnim.dur);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            day = (dayAnim.from + dayAnim.delta * e + 365) % 365;
            if (k >= 1) dayAnim = null;
        } else if (playing) {
            if (mode === 'jour') {
                const hoursPerSec = 24 / (fast ? 8 : 24);       // 1 jour en 24 s (ou 8 s)
                utc += hoursPerSec * dt;
                day = (day + hoursPerSec * dt / 24) % 365;
            } else {
                day = (day + TM_YEAR / (fast ? 12 : 36) * dt) % 365;   // 1 an en 36 s (ou 12 s)
            }
        }
        if (!drag && velLon && !playing) {
            utc += velLon * dt * 12 / Math.PI;
            velLon *= Math.exp(-dt * 3.2);
            if (Math.abs(velLon) < 0.02) velLon = 0;
        }
        utc = ((utc % 24) + 24) % 24;
        draw();
        if (playing || dayAnim || (velLon && !drag)) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (playing) { velLon = 0; startLoop(); }
    }
    function setFast(v) {
        fast = !!v;
        speedBtn.textContent = fast ? '🐇 Rapide' : '🐢 Lent';
        speedBtn.classList.toggle('on', fast);
    }
    function goToDay(target) {
        let delta = target - day;
        delta = ((delta + 182.5) % 365 + 365) % 365 - 182.5;
        dayAnim = { from: day, delta, t0: performance.now(), dur: 900 };
        startLoop();
    }
    function setMode(m) {
        mode = m === 'saisons' ? 'saisons' : 'jour';
        container.dataset.mode = mode;
        header.querySelectorAll('.tm-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        hint.textContent = mode === 'jour'
            ? 'Fais glisser le globe pour faire tourner la Terre · Touche le globe pour choisir un lieu'
            : 'Fais glisser la Terre sur son orbite · Touche une date';
        side.style.borderLeftColor = mode === 'jour' ? '#e8833a' : '#6fb78f';
        lastInfoKey = '';
        requestDraw();
    }
    function setPlace(p) {
        const keepSolar = solarHour();
        place = { ...p };
        if (mode === 'saisons') utc = keepSolar - place.lon / 15;   // même heure solaire
        lastInfoKey = '';
        requestDraw();
    }

    // ── Interaction sur la scène (souris, doigt, stylet) ──────────────────
    const TAP_TOL = 20;
    let drag = null;
    const stop = e => e.stopPropagation();
    canvas.addEventListener('mousedown', stop);
    canvas.addEventListener('touchstart', stop, { passive: true });
    canvas.addEventListener('click', stop);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    function local(e) {
        const rc = canvas.getBoundingClientRect();
        const kx = rc.width ? cssW / rc.width : 1, ky = rc.height ? cssH / rc.height : 1;
        return { x: (e.clientX - rc.left) * kx, y: (e.clientY - rc.top) * ky, kx, ky };
    }
    function orbitAngleAt(x, y) {
        const g = orbitGeo;
        return Math.atan2((g.cy - y) / g.se, x - g.cx);   // φ (repère vu du nord)
    }
    const dayFromPhi = phi => (((TM_EQUINOX + (phi + Math.PI / 2) / (2 * Math.PI) * TM_YEAR) % 365) + 365) % 365;

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        if (drag) return;
        e.stopPropagation(); e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        const L = local(e);
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
        dayAnim = null; velLon = 0;
        if (mode === 'saisons' && orbitGeo) {
            // Saisir la Terre (ou l'orbite) pour la faire glisser
            const ea = orbitGeo.earth;
            const onEarth = ea && Math.hypot(L.x - ea.x, L.y - ea.y) < ea.r * 1.5;
            const ell = Math.hypot((L.x - orbitGeo.cx) / orbitGeo.Ro, (L.y - orbitGeo.cy) / (orbitGeo.Ro * orbitGeo.se));
            drag.orbit = onEarth || Math.abs(ell - 1) < 0.25;
            drag.lastPhi = orbitAngleAt(L.x, L.y);
        }
        canvas.classList.add('tm-dragging');
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });

    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
        const L = local(e);
        if (mode === 'jour' && dayGeo) {
            const dx = (e.clientX - drag.lx) * L.kx, dy = (e.clientY - drag.ly) * L.ky;
            const dLon = dx / dayGeo.r;                       // la surface suit le stylet
            utc = (((utc + dLon * 12 / Math.PI) % 24) + 24) % 24;
            camLat = Math.max(-75 * TM_D2R, Math.min(75 * TM_D2R, camLat + dy / dayGeo.r));
            const now = performance.now(), dts = Math.max(8, now - drag.lt) / 1000;
            velLon = 0.6 * velLon + 0.4 * (dLon / dts);
            drag.lt = now;
        } else if (mode === 'saisons' && drag.orbit && drag.moved) {
            const phi = orbitAngleAt(L.x, L.y);
            let dp = phi - drag.lastPhi;
            dp = Math.atan2(Math.sin(dp), Math.cos(dp));
            drag.lastPhi = phi;
            day = (((day + dp / (2 * Math.PI) * TM_YEAR) % 365) + 365) % 365;
        }
        drag.lx = e.clientX; drag.ly = e.clientY;
        requestDraw();
    });

    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        canvas.classList.remove('tm-dragging');
        if (e.type === 'pointercancel') { velLon = 0; return; }
        const L = local(e);
        if (!d.moved) { velLon = 0; onTap(L.x, L.y); return; }
        if (mode === 'jour') {
            if (performance.now() - d.lt > 80) velLon = 0;
            velLon = Math.max(-5, Math.min(5, velLon));
            if (velLon && !playing) startLoop();
        }
        saveBoard();
    }

    function onTap(x, y) {
        if (mode === 'jour' && dayGeo) {
            const g = dayGeo;
            const vx = (x - g.cx) / g.r, vy = -(y - g.cy) / g.r, q = vx * vx + vy * vy;
            if (q > 1) return;
            const e = _tmMul(_tmTr(g.M), [vx, vy, Math.sqrt(1 - q)]);   // vue → Terre
            const lon = Math.atan2(e[0], e[2]) / TM_D2R, lat = Math.asin(Math.max(-1, Math.min(1, e[1]))) / TM_D2R;
            setPlace({ id: 'custom', name: `Lieu choisi (${Math.abs(lat).toFixed(0)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(0)}° ${lon >= 0 ? 'E' : 'O'})`, lon, lat });
            saveBoard();
        } else if (mode === 'saisons') {
            for (const h of keyHits) {
                if ((x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || Math.hypot(x - h.px, y - h.py) < h.pr) {
                    if (playing) setPlaying(false);
                    goToDay(h.day);
                    saveBoard();
                    return;
                }
            }
        }
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, row2, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); }, { passive: true });
    });
    side.addEventListener('pointerdown', stop);
    side.addEventListener('mousedown', stop);
    side.addEventListener('touchstart', stop, { passive: true });

    header.querySelectorAll('.tm-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        saveBoard();
    }));
    playBtn.addEventListener('click', () => { setPlaying(!playing); });
    speedBtn.addEventListener('click', () => { setFast(!fast); saveBoard(); });
    row1.querySelectorAll('.tm-view').forEach(b => b.addEventListener('click', () => {
        viewOff = Number(b.dataset.view);
        row1.querySelectorAll('.tm-view').forEach(x => x.classList.toggle('on', x === b));
        requestDraw(); saveBoard();
    }));
    raysBtn.addEventListener('click', () => { showRays = !showRays; raysBtn.classList.toggle('on', showRays); requestDraw(); saveBoard(); });
    linesBtn.addEventListener('click', () => { showLines = !showLines; linesBtn.classList.toggle('on', showLines); requestDraw(); saveBoard(); });
    row2.querySelectorAll('.tm-date-btn').forEach(b => b.addEventListener('click', () => {
        if (playing && mode === 'saisons') setPlaying(false);
        goToDay(Number(b.dataset.day));
        saveBoard();
    }));
    daySl.addEventListener('input', () => { dayAnim = null; day = Number(daySl.value); requestDraw(); });
    daySl.addEventListener('change', () => saveBoard());
    hourSl.addEventListener('input', () => {
        if (playing) setPlaying(false);
        velLon = 0;
        utc = Number(hourSl.value) - place.lon / 15;
        requestDraw();
    });
    hourSl.addEventListener('change', () => saveBoard());
    placeSel.addEventListener('change', () => {
        const p = TM_PLACES.find(x => x.id === placeSel.value);
        if (p) setPlace(p);
        saveBoard();
    });

    helpBtn.addEventListener('pointerdown', stop);
    helpBtn.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    helpPopup.addEventListener('pointerdown', stop);
    helpPopup.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.remove('show'); });
    const closeHelp = () => helpPopup.classList.remove('show');
    document.addEventListener('click', closeHelp);

    // ── Taille ────────────────────────────────────────────────────────────
    function applySize() {
        container.style.width = contW + 'px';
        container.style.height = contH + 'px';
    }
    resizeHandle.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, y0 = e.clientY, w0 = contW, h0 = contH;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
            contW = Math.max(680, w0 + ev.clientX - x0);
            contH = Math.max(480, h0 + ev.clientY - y0);
            applySize();
        };
        const up = () => {
            resizeHandle.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            saveBoard();
        };
        resizeHandle.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, true);
        window.addEventListener('pointercancel', up, true);
    });
    resizeHandle.addEventListener('mousedown', stop);
    resizeHandle.addEventListener('touchstart', stop, { passive: true });

    let ro = null;
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            lastInfoKey = '';
            requestDraw();
        });
        ro.observe(sceneWrap);
        ro.observe(chart);
    }

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin = header.querySelector('[data-role="wf-min"]');
    const wfMax = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (playing) setPlaying(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🌗 La Terre en mouvement', {
                onExpand: () => requestAnimationFrame(() => { applySize(); lastInfoKey = ''; requestDraw(); })
            });
        }
    });
    wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        requestDraw();
    });
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        cleanup();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });
    function cleanup() {
        if (animId) cancelAnimationFrame(animId);
        animId = null; playing = false; dayAnim = null;
        if (ro) ro.disconnect();
        document.removeEventListener('click', closeHelp);
    }

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', e => {
        if (e.target.closest && e.target.closest('button,input,select')) return;
        if (typeof bringToFront === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    applySize();
    setMode('jour');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._tmGetData = () => ({
        containerW: contW, containerH: contH,
        mode, day: +day.toFixed(3), utc: +utc.toFixed(4),
        place: { ...place },
        camLat: +(camLat / TM_D2R).toFixed(2), viewOff,
        showRays, showLines, fast
    });
    widget._tmSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = Math.max(680, d.containerW);
        if (d.containerH) contH = Math.max(480, d.containerH);
        applySize();
        if (typeof d.day === 'number') day = ((d.day % 365) + 365) % 365;
        if (typeof d.utc === 'number') utc = ((d.utc % 24) + 24) % 24;
        if (d.place && typeof d.place.lon === 'number' && typeof d.place.lat === 'number') place = { ...d.place };
        if (typeof d.camLat === 'number') camLat = Math.max(-75, Math.min(75, d.camLat)) * TM_D2R;
        if (d.viewOff === 60 || d.viewOff === 90) {
            viewOff = d.viewOff;
            row1.querySelectorAll('.tm-view').forEach(x => x.classList.toggle('on', Number(x.dataset.view) === viewOff));
        }
        if (typeof d.showRays === 'boolean') { showRays = d.showRays; raysBtn.classList.toggle('on', showRays); }
        if (typeof d.showLines === 'boolean') { showLines = d.showLines; linesBtn.classList.toggle('on', showLines); }
        setFast(!!d.fast);
        setMode(d.mode || 'jour');
    };

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
