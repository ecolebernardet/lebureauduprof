// =========================================================================
// WIDGET GLOBE TERRESTRE — Le Bureau du Prof
// Globe 3D interactif : continents, océans, grille des parallèles et
// méridiens, lignes repères (équateur, tropiques, cercles polaires,
// méridien de Greenwich).
// • Faire glisser (souris, doigt ou stylet) pour faire tourner la Terre
// • Toucher un continent ou un océan : le globe se tourne vers lui
//   et sa fiche s'affiche à droite
// • Mode devinette : les noms sont remplacés par « ? »
// • Rotation automatique d'ouest en est, zoom (boutons, molette, pincement)
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », boutons
// de grande taille, aucune fonction accessible seulement au survol.
//
// Dépendances : widget-geo-monde.js doit être chargé AVANT ce fichier
//   (tracés GW_SHAPES, GW_CONTINENTS, GW_OCEANS, GW_LINES, GW_CASPIAN,
//   fonction window._wfMiniBarCollapse et style des boutons .wf-btn).
//   board, findFreePosition(), makeDraggable(), makeDraggableRotate(),
//   bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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

    if (document.getElementById('gg-style')) return;
    const s = document.createElement('style');
    s.id = 'gg-style';
    s.textContent = `
        .widget[data-type="geo-globe"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gg-container {
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
            -webkit-user-select: none;
            overflow: hidden;
        }
        .gg-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            flex-shrink: 0;
        }
        .gg-title {
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .gg-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 9px;
            border-radius: 20px;
            background: #e3f1fb;
            color: #1f5f8b;
            pointer-events: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 40%;
        }
        /* Boutons fenêtre : taille commune définie dans le bloc wf-btns-style */

        .gg-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 50px !important;
        }

        /* Contrôles (taille confortable pour un stylet) */
        .gg-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
            flex-shrink: 0;
        }
        .gg-btn {
            min-height: 34px;
            padding: 5px 13px;
            border-radius: 9px;
            border: 1px solid #d6d9de;
            background: #f0f0f0;
            color: #333;
            font-size: 13px;
            font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            touch-action: manipulation;
            transition: background .15s, transform .1s;
        }
        .gg-btn:hover { background: #e0e0e0; }
        .gg-btn:active { transform: scale(0.96); }
        .gg-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .gg-btn.on:hover { background: #357abd; }
        .gg-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .gg-btn-reveal:hover { background: #218838; }
        .gg-btn:focus-visible { outline: 2px solid #4a90e2; outline-offset: 2px; }
        .gg-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px 2px; }
        .gg-zoom { display: flex; gap: 5px; margin-left: auto; align-items: center; }
        .gg-zoom .gg-btn { width: 40px; padding: 0; font-size: 20px; line-height: 1; }

        /* Corps : globe + fiche */
        .gg-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .gg-globe-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            background: radial-gradient(ellipse at 50% 45%, #1b2f4a 0%, #0e1a2b 60%, #070d17 100%);
        }
        .gg-canvas {
            display: block;
            width: 100%;
            height: 100%;
            touch-action: none;
            cursor: grab;
        }
        .gg-canvas.gg-dragging { cursor: grabbing; }
        .gg-hint {
            position: absolute;
            left: 0; right: 0; bottom: 8px;
            text-align: center;
            font-size: 12px;
            color: rgba(214, 228, 244, 0.55);
            pointer-events: none;
        }
        .gg-side {
            flex: 0 0 30%;
            min-width: 210px;
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
        .gg-side h4 { margin: 0 0 2px; font-weight: 900; }
        .gg-side .gg-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .gg-side p { margin: 0 0 6px; }
        .gg-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .gg-side li { margin-bottom: 4px; }
        .gg-side .gg-hint-side { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .gg-back-btn {
            margin-top: 6px;
            min-height: 34px;
            padding: 5px 13px; border-radius: 9px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 13px; font-weight: 700;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .gg-back-btn:hover { background: #f0f0f0; }

        /* Aide */
        .gg-help-btn {
            width: 28px; height: 28px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            touch-action: manipulation;
        }
        .gg-help-btn:hover { background: #e0e0e0; color: #333; }
        .gg-help-popup {
            display: none;
            position: absolute;
            top: 46px;
            right: 12px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 330px;
            max-width: calc(100% - 24px);
            font-size: 12px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .gg-help-popup.show { display: block; }
        .gg-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .gg-help-popup p { margin: 0 0 6px; }
        .gg-help-popup p:last-child { margin-bottom: 0; }

        /* Poignée de redimensionnement : toujours visible (pas de survol au stylet) */
        .gg-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 24px; height: 24px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0;
            opacity: .6;
            z-index: 5;
            touch-action: none;
        }
        .gg-resize-handle:hover { opacity: 1; }
        .gg-msg { padding: 30px; color: #b91c1c; font-weight: 700; }
    `;
    document.head.appendChild(s);
})();

// ── Données (partagées avec widget-geo-monde.js) ──────────────────────────
const GG_D2R = Math.PI / 180;
let _GG_DATA = null;

function _ggVec(lon, lat) {
    const l = lon * GG_D2R, p = lat * GG_D2R, c = Math.cos(p);
    return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)];
}

// Densifie un tracé (pas ≈ 1,5°) pour que les côtes suivent la courbure du
// globe. Chaque sommet porte « s » = l'arête qui y mène ne doit pas être
// tracée (couture le long de l'antiméridien 180°).
function _ggDensify(pts, closed) {
    const out = [];
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
        const a = pts[i], b = pts[(i + 1) % n];
        const seam = Math.abs(a[0]) === 180 && Math.abs(b[0]) === 180;
        if (i === 0) { const v = _ggVec(a[0], a[1]); v.s = false; out.push(v); }
        const dlon = b[0] - a[0], dlat = b[1] - a[1];
        const cosl = Math.cos(((a[1] + b[1]) / 2) * GG_D2R);
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dlon) * cosl, Math.abs(dlat)) / 1.5));
        for (let k = 1; k <= steps; k++) {
            if (closed && i === m - 1 && k === steps) break;   // le dernier point = le premier
            const v = _ggVec(a[0] + dlon * k / steps, a[1] + dlat * k / steps);
            v.s = seam;
            out.push(v);
        }
        if (closed && i === m - 1) out[0].s = seam;   // arête de fermeture
    }
    return out;
}

// Sens de parcours du tracé (aire signée en lon/lat) : +1 = sens direct
// (intérieur à gauche), −1 = sens horaire. La carte lon/lat vue « de
// l'extérieur » a la même orientation que le globe : ce signe est donc valable
// sur le globe et sert à savoir dans quel sens longer le bord de la Terre.
// Renvoie 0 pour les petites îles et les tracés qui se croisent eux-mêmes
// (sens ambigu) : on y prendra simplement l'arc le plus court.
function _ggOrient(pts) {
    let minLon = 999, maxLon = -999, minLat = 999, maxLat = -999;
    for (const p of pts) {
        minLon = Math.min(minLon, p[0]); maxLon = Math.max(maxLon, p[0]);
        minLat = Math.min(minLat, p[1]); maxLat = Math.max(maxLat, p[1]);
    }
    if (Math.max(maxLon - minLon, maxLat - minLat) < 40) return 0;
    const n = pts.length;
    const side = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a = pts[i], b = pts[(i + 1) % n], c = pts[j], d = pts[(j + 1) % n];
        if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return 0;
    }
    let area = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) area += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]);
    return area < 0 ? -1 : 1;
}

function _ggPrepare() {
    if (_GG_DATA) return _GG_DATA;
    const conts = GW_CONTINENTS.map(c => ({
        c,
        polys: GW_SHAPES[c.id].map(pts => ({ ll: pts, v: _ggDensify(pts, true), dir: _ggOrient(pts) }))
    }));
    _GG_DATA = { conts, caspian: { ll: GW_CASPIAN, v: _ggDensify(GW_CASPIAN, true), dir: _ggOrient(GW_CASPIAN) } };
    return _GG_DATA;
}

function _ggPointInPoly(lon, lat, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

// Océan sous un point (limites simplifiées entre les bassins)
function _ggOceanAt(lon, lat) {
    if (lat >= 66) return 'arctique';
    if (lat <= -60) return 'austral';
    if (lon >= 20 && lon <= 100 && lat < 30) return 'indien';
    if (lon > 100 && lon <= 147 && lat < -8.5) return 'indien';
    if (lon >= 20 && lon <= 60 && lat >= 30) return 'atlantique';   // Méditerranée, mer Noire, Baltique
    if (lon >= -70 && lon < 20) return 'atlantique';
    if (lon >= -100 && lon < -70) {
        // Côte pacifique de l'Amérique centrale ≈ droite (-105°,20°) → (-78°,7°)
        const limit = 20 + (lon + 105) * (7 - 20) / 27;
        return lat > limit ? 'atlantique' : 'pacifique';
    }
    return 'pacifique';
}

function _ggEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoGlobeWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-globe';
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
    container.className = 'gg-container';
    let contW = Math.max(620, Math.min(1050, Math.round(window.innerWidth * 0.62)));
    let contH = Math.max(440, Math.round(contW * 0.64));

    // En-tête
    const header = document.createElement('div');
    header.className = 'gg-header';
    header.innerHTML = `
        <span class="gg-title">🌐 Globe terrestre</span>
        <span class="gg-badge">La Terre</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.gg-badge');
    container.appendChild(header);

    // Bouton d'aide (avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gg-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    widget.appendChild(container);

    // Données indispensables (fournies par widget-geo-monde.js)
    if (typeof GW_SHAPES === 'undefined' || typeof GW_CONTINENTS === 'undefined') {
        const msg = document.createElement('div');
        msg.className = 'gg-msg';
        msg.textContent = 'Le fichier widget-geo-monde.js doit être chargé avant widget-geo-globe.js.';
        container.appendChild(msg);
        container.style.width = '420px';
        board.appendChild(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        return widget;
    }
    const DATA = _ggPrepare();

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'gg-controls';
    controls.innerHTML = `
        <button class="gg-btn gg-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈 Masquer les noms</button>
        <button class="gg-btn gg-btn-reveal" style="display:none">👁 Tout révéler</button>
        <button class="gg-btn gg-btn-spin" title="La Terre tourne sur elle-même d'ouest en est">▶ Faire tourner</button>
        <button class="gg-btn gg-btn-home" title="Revenir à la vue de départ">🌍 Vue d'ensemble</button>
        <span class="gg-sep"></span>
        <button class="gg-btn gg-layer on" data-layer="grille" title="Parallèles et méridiens tous les 30°">🌐 Grille</button>
        <button class="gg-btn gg-layer" data-layer="reperes" title="Équateur, tropiques, cercles polaires, méridien de Greenwich">🧭 Repères</button>
        <div class="gg-zoom">
            <button class="gg-btn gg-zoom-out" title="Dézoomer">−</button>
            <button class="gg-btn gg-zoom-in" title="Zoomer">+</button>
        </div>
    `;
    const hideBtn   = controls.querySelector('.gg-btn-hide');
    const revealBtn = controls.querySelector('.gg-btn-reveal');
    const spinBtn   = controls.querySelector('.gg-btn-spin');
    const homeBtn   = controls.querySelector('.gg-btn-home');
    container.appendChild(controls);

    // Corps
    const body = document.createElement('div');
    body.className = 'gg-body';
    const globeWrap = document.createElement('div');
    globeWrap.className = 'gg-globe-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'gg-canvas';
    const hint = document.createElement('div');
    hint.className = 'gg-hint';
    hint.textContent = 'Fais glisser pour tourner la Terre · Touche un continent ou un océan';
    globeWrap.appendChild(canvas);
    globeWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'gg-side';
    body.appendChild(globeWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gg-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Globe terrestre</h4>
        <p>Le globe montre la Terre telle qu'on la verrait depuis l'espace, avec les
        <b>6 continents</b> et les <b>5 océans</b>.</p>
        <p>✋ <b>Fais glisser</b> le globe (souris, doigt ou stylet) pour le faire tourner.
        <b>−</b> / <b>+</b>, la molette ou deux doigts pour zoomer.</p>
        <p>👆 <b>Touche un continent ou un océan</b> : le globe se tourne vers lui et sa fiche
        s'affiche à droite. Touche-le à nouveau, ou touche l'espace autour du globe, pour revenir.</p>
        <p>▶ <b>Faire tourner</b> : la Terre tourne sur elle-même, d'ouest en est.</p>
        <p>🧭 <b>Repères</b> : équateur, tropiques, cercles polaires et méridien de Greenwich
        (touchables eux aussi).</p>
        <p>🙈 <b>Masquer les noms</b> : les noms deviennent « ? ». Touche un élément pour dévoiler
        son nom.</p>
        <p style="color:#888">Le tracé des côtes est simplifié et les limites entre océans sont
        approximatives.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gg-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');

    // ── Éléments sélectionnables ──────────────────────────────────────────
    const items = {};
    GW_CONTINENTS.forEach(c => { items[c.id] = { id: c.id, layer: 'continents', name: c.name, data: c, center: c.lbl }; });
    GW_OCEANS.forEach(o => { items[o.id] = { id: o.id, layer: 'oceans', name: o.name, data: o, center: o.lbls[0] }; });
    (typeof GW_LINES !== 'undefined' ? GW_LINES : []).forEach(l => {
        items[l.id] = { id: l.id, layer: 'reperes', name: l.name, data: l,
            center: typeof l.lat === 'number' ? null : [l.lon, 20] };
    });
    const KIND = { continents: 'Continent', oceans: 'Océan', reperes: 'Ligne repère' };
    const COLORS = { continents: '#374151', oceans: '#2f6f9e', reperes: '#7c3aed' };

    // ── État ──────────────────────────────────────────────────────────────
    const HOME = { lon: 10, lat: 20 };
    let lon0 = HOME.lon * GG_D2R, lat0 = HOME.lat * GG_D2R;   // point au centre de la vue
    let zoom = 1;
    const ZMIN = 0.55, ZMAX = 3.2;
    const layers = { grille: true, reperes: false };
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let autoRotate = false;
    let velLon = 0, velLat = 0;          // inertie (rad/s)
    let fly = null;                      // animation « se tourner vers… »
    let animId = null, lastT = 0;
    let cssW = 0, cssH = 0, dpr = 1;

    // ── Projection orthographique ─────────────────────────────────────────
    let cL = 1, sL = 0, cP = 1, sP = 0;
    function updateRot() {
        cL = Math.cos(lon0); sL = Math.sin(lon0);
        cP = Math.cos(lat0); sP = Math.sin(lat0);
    }
    // v (repère Terre) → [x, y, z] repère vue (x droite, y haut, z vers l'observateur)
    function rot(v) {
        const x1 = v[0] * cL - v[2] * sL;
        const z1 = v[2] * cL + v[0] * sL;
        return [x1, v[1] * cP - z1 * sP, v[1] * sP + z1 * cP];
    }
    function radius() { return Math.min(cssW, cssH) * 0.43 * zoom; }
    function screenToLL(px, py) {
        const r = radius();
        const x1 = (px - cssW / 2) / r, y2 = -(py - cssH / 2) / r;
        const d = x1 * x1 + y2 * y2;
        if (d > 1) return null;
        const z2 = Math.sqrt(1 - d);
        const y1 = y2 * cP + z2 * sP;
        const z1 = -y2 * sP + z2 * cP;
        const x = x1 * cL + z1 * sL;
        const z = -x1 * sL + z1 * cL;
        return [Math.atan2(x, z) / GG_D2R, Math.asin(Math.max(-1, Math.min(1, y1))) / GG_D2R];
    }

    // Découpe d'un polygone sur l'hémisphère visible (algorithme de
    // Weiler-Atherton sur le cercle du bord de la Terre).
    // 1. On découpe la côte en morceaux visibles, chacun allant d'un point
    //    où elle réapparaît (entrée) à un point où elle disparaît (sortie).
    // 2. Depuis chaque sortie, on longe le bord du globe — dans le sens donné
    //    par l'orientation du tracé — jusqu'à la PROCHAINE entrée rencontrée,
    //    qui peut appartenir à un autre morceau (côtes très découpées).
    // Renvoie une liste d'anneaux [{x, y, s}] (s = ne pas tracer l'arête).
    function clipPoly(V, dir) {
        const n = V.length;
        const R = new Array(n);
        let start = -1;
        for (let i = 0; i < n; i++) { R[i] = rot(V[i]); if (start < 0 && R[i][2] >= 0) start = i; }
        if (start < 0) return null;
        const TAU = 2 * Math.PI;
        const mod = v => ((v % TAU) + TAU) % TAU;
        const limb = (a, b) => {
            const u = a[2] / (a[2] - b[2]);
            const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
            const l = Math.hypot(x, y) || 1;
            return [x / l, y / l];
        };

        const chains = [];
        const first = { pts: [{ x: R[start][0], y: R[start][1], s: true }], aIn: null, aOut: null };
        let cur = first;
        for (let k = 1; k <= n; k++) {
            const a = R[(start + k - 1) % n], b = R[(start + k) % n], bs = V[(start + k) % n].s;
            const av = a[2] >= 0, bv = b[2] >= 0;
            if (av && bv) {
                cur.pts.push({ x: b[0], y: b[1], s: bs });
            } else if (av) {                               // sortie
                const E = limb(a, b);
                cur.pts.push({ x: E[0], y: E[1], s: bs });
                cur.aOut = Math.atan2(E[1], E[0]);
                chains.push(cur);
                cur = null;
            } else if (bv) {                               // entrée
                const I = limb(a, b);
                cur = { pts: [{ x: I[0], y: I[1], s: true }, { x: b[0], y: b[1], s: bs }],
                        aIn: Math.atan2(I[1], I[0]), aOut: null };
            }
        }
        if (!chains.length) return [first.pts];           // entièrement visible
        // Le dernier morceau (qui revient au point de départ) se raccorde au premier
        if (cur !== first) {
            first.pts = cur.pts.concat(first.pts.slice(1));
            first.aIn = cur.aIn;
        }

        const rings = [], used = new Set();
        for (let i0 = 0; i0 < chains.length; i0++) {
            if (used.has(i0)) continue;
            const ring = [];
            let c = i0, guard = 0;
            while (!used.has(c) && guard++ <= chains.length) {
                used.add(c);
                const ch = chains[c];
                for (const p of ch.pts) ring.push(p);
                // prochaine entrée en longeant le bord dans le sens « dir »
                // (dir = 0 : petite île → entrée la plus proche, dans un sens ou l'autre)
                let best = c, bd = Infinity, span = 0;
                for (let j = 0; j < chains.length; j++) {
                    const fwd = mod(chains[j].aIn - ch.aOut), back = mod(ch.aOut - chains[j].aIn);
                    const cand = dir > 0 ? [fwd] : dir < 0 ? [-back] : [fwd, -back];
                    for (const sp of cand) if (Math.abs(sp) < bd) { bd = Math.abs(sp); best = j; span = sp; }
                }
                const steps = Math.max(1, Math.ceil(bd / (3 * GG_D2R)));
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

    // ── Canvas net sur écrans haute densité ───────────────────────────────
    function syncSize() {
        const W = globeWrap.clientWidth, H = globeWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }

    // ── Couleurs ──────────────────────────────────────────────────────────
    function mix(hex, to, t) {
        const a = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
        const b = [1, 3, 5].map(i => parseInt(to.slice(i, i + 2), 16));
        return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
    }
    const OCEAN = '#5d93bd';

    // ── Rendu ─────────────────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        const W = cssW, H = cssH, cx = W / 2, cy = H / 2, r = radius();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        updateRot();
        const S = (x, y) => [cx + x * r, cy - y * r];

        // Halo d'atmosphère
        const halo = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.12);
        halo.addColorStop(0, 'rgba(120,180,240,0.45)');
        halo.addColorStop(1, 'rgba(120,180,240,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, 2 * Math.PI); ctx.fill();

        // Océan
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fillStyle = OCEAN;
        ctx.fill();

        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.clip();

        // Océan sélectionné : léger éclaircissement de l'eau
        const selIt = selected && items[selected];
        if (selIt && selIt.layer === 'oceans') {
            ctx.fillStyle = 'rgba(255,255,255,0.10)';
            ctx.fillRect(0, 0, W, H);
        }

        // Continents
        const contSel = selIt && selIt.layer === 'continents' ? selIt.id : null;
        const dim = !!selIt && selIt.layer !== 'reperes';
        for (const { c, polys } of DATA.conts) {
            const isSel = c.id === contSel;
            const fill = dim && !isSel ? mix(c.col, '#c3c8cf', 0.65) : c.col;
            for (const poly of polys) {
                const rings = clipPoly(poly.v, poly.dir);
                if (!rings) continue;
                ctx.beginPath();
                for (const pts of rings) {
                    pts.forEach((p, i) => { const q = S(p.x, p.y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
                    ctx.closePath();
                }
                ctx.fillStyle = fill;
                ctx.fill();
                // contour (sans les coutures ni le bord du globe)
                ctx.beginPath();
                for (const pts of rings)
                    pts.forEach((p, i) => { const q = S(p.x, p.y); (i === 0 || p.s) ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); });
                ctx.strokeStyle = isSel ? '#2b3340' : 'rgba(80,88,100,0.55)';
                ctx.lineWidth = isSel ? 2.4 : 0.8;
                ctx.stroke();
            }
        }
        // Mer Caspienne (lac)
        const casp = clipPoly(DATA.caspian.v, DATA.caspian.dir);
        if (casp) {
            ctx.beginPath();
            for (const pts of casp) {
                pts.forEach((p, i) => { const q = S(p.x, p.y); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
                ctx.closePath();
            }
            ctx.fillStyle = OCEAN;
            ctx.fill();
        }

        // Courbe (lon, lat) = f(t) : tracée seulement sur la face visible
        function traceCurve(fn, N) {
            let pen = false;
            for (let k = 0; k <= N; k++) {
                const ll = fn(k / N);
                const p = rot(_ggVec(ll[0], ll[1]));
                if (p[2] >= 0) {
                    const q = S(p[0], p[1]);
                    if (!pen) { ctx.moveTo(q[0], q[1]); pen = true; } else ctx.lineTo(q[0], q[1]);
                } else pen = false;
            }
        }

        // Grille tous les 30°
        if (layers.grille) {
            ctx.beginPath();
            for (let lat = -60; lat <= 60; lat += 30) traceCurve(t => [-180 + 360 * t, lat], 120);
            for (let lon = -180; lon < 180; lon += 30) traceCurve(t => [lon, -90 + 180 * t], 60);
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 0.9;
            ctx.stroke();
        }

        // Lignes repères
        if (layers.reperes && typeof GW_LINES !== 'undefined') {
            for (const l of GW_LINES) {
                const isSel = selected === l.id;
                ctx.beginPath();
                if (typeof l.lat === 'number') traceCurve(t => [-180 + 360 * t, l.lat], 180);
                else traceCurve(t => [l.lon, -90 + 180 * t], 90);
                ctx.setLineDash(l.dash ? l.dash.split(' ').map(Number) : []);
                ctx.strokeStyle = l.color;
                ctx.lineWidth = isSel ? 4 : 2;
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        // Ombrage sphérique (lumière en haut à gauche) → effet de relief
        const lx = cx - r * 0.35, ly = cy - r * 0.4;
        const shade = ctx.createRadialGradient(lx, ly, r * 0.05, cx, cy, r);
        shade.addColorStop(0.00, 'rgba(255,255,255,0.30)');
        shade.addColorStop(0.35, 'rgba(255,255,255,0.06)');
        shade.addColorStop(0.75, 'rgba(10,25,45,0.10)');
        shade.addColorStop(1.00, 'rgba(10,25,45,0.42)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, W, H);

        // Noms
        drawLabels(S, r);
        ctx.restore();

        // Contour du globe
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(190,220,250,0.55)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    function drawLabels(S, r) {
        const fsCont = Math.max(12, Math.min(30, r * 0.072));
        const fsSea  = Math.max(10, Math.min(22, r * 0.052));
        const fsLine = Math.max(10, Math.min(16, r * 0.042));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        function label(lonlat, lines, fs, font, fill, stroke, id) {
            const p = rot(_ggVec(lonlat[0], lonlat[1]));
            if (p[2] < 0.12) return;
            const hidden = hideNames && !revealed.has(id);
            const txt = hidden ? ['?'] : lines;
            const isSel = selected === id;
            const size = isSel ? fs * 1.12 : fs;
            ctx.globalAlpha = Math.min(1, (p[2] - 0.12) / 0.25);
            ctx.font = `${font} ${size.toFixed(1)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.lineWidth = Math.max(3, size * 0.22);
            ctx.strokeStyle = stroke;
            const q = S(p[0], p[1]);
            txt.forEach((t, i) => {
                const y = q[1] + (i - (txt.length - 1) / 2) * size * 1.1;
                ctx.fillStyle = hidden ? '#d63384' : fill;
                ctx.strokeText(t, q[0], y);
                ctx.fillText(t, q[0], y);
            });
            ctx.globalAlpha = 1;
        }

        GW_OCEANS.forEach(o => o.lbls.forEach(ll =>
            label(ll, o.lines, fsSea, 'italic 700', '#eaf4fc', 'rgba(25,60,95,0.75)', o.id)));
        GW_CONTINENTS.forEach(c =>
            label(c.lbl, c.lines || [c.name], fsCont, '900', '#1f2937', 'rgba(255,255,255,0.85)', c.id));

        if (layers.reperes && typeof GW_LINES !== 'undefined') {
            ctx.textAlign = 'left';
            for (const l of GW_LINES) {
                // Nom placé sur la partie gauche visible de la ligne
                const lon0d = lon0 / GG_D2R, lat0d = lat0 / GG_D2R;
                const at = typeof l.lat === 'number' ? [lon0d - 55, l.lat + 1.6] : [l.lon + 1.5, Math.max(-60, Math.min(60, lat0d - 35))];
                const p = rot(_ggVec(at[0], at[1]));
                if (p[2] < 0.2) continue;
                const hidden = hideNames && !revealed.has(l.id);
                const q = S(p[0], p[1]);
                ctx.globalAlpha = Math.min(1, (p[2] - 0.2) / 0.25);
                ctx.font = `700 ${fsLine.toFixed(1)}px 'Segoe UI', system-ui, sans-serif`;
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.fillStyle = hidden ? '#d63384' : l.color;
                const t = hidden ? '?' : l.name;
                ctx.strokeText(t, q[0], q[1] - fsLine * 0.6);
                ctx.fillText(t, q[0], q[1] - fsLine * 0.6);
                ctx.globalAlpha = 1;
            }
            ctx.textAlign = 'center';
        }
    }

    // ── Boucle d'animation (uniquement quand quelque chose bouge) ─────────
    let drawPending = false;
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    const SPIN = 2 * Math.PI / 40;   // un tour en 40 s
    function loop(t) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (fly) {
            const k = Math.min(1, (t - fly.t0) / fly.dur);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            lon0 = fly.lon + fly.dLon * e;
            lat0 = fly.lat + fly.dLat * e;
            if (k >= 1) fly = null;
        } else {
            if (autoRotate) lon0 -= SPIN * dt;     // d'ouest en est
            if (!drag && (velLon || velLat)) {
                lon0 += velLon * dt;
                lat0 = clampLat(lat0 + velLat * dt);
                const f = Math.exp(-dt * 3.2);
                velLon *= f; velLat *= f;
                if (Math.abs(velLon) < 0.02 && Math.abs(velLat) < 0.02) velLon = velLat = 0;
            }
        }
        draw();
        if (autoRotate || fly || ((velLon || velLat) && !drag)) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() {
        if (animId) return;
        lastT = 0;
        animId = requestAnimationFrame(loop);
    }
    const clampLat = v => Math.max(-85 * GG_D2R, Math.min(85 * GG_D2R, v));

    function flyTo(lonDeg, latDeg) {
        const tl = lonDeg * GG_D2R, tp = clampLat(latDeg * GG_D2R);
        let dLon = tl - lon0;
        dLon = Math.atan2(Math.sin(dLon), Math.cos(dLon));   // chemin le plus court
        velLon = velLat = 0;
        fly = { lon: lon0, lat: lat0, dLon, dLat: tp - lat0, t0: performance.now(), dur: 750 };
        startLoop();
    }

    function setZoom(z) {
        zoom = Math.max(ZMIN, Math.min(ZMAX, z));
        requestDraw();
    }

    function setAuto(v) {
        autoRotate = !!v;
        spinBtn.classList.toggle('on', autoRotate);
        spinBtn.textContent = autoRotate ? '⏸ Arrêter' : '▶ Faire tourner';
        if (autoRotate) { fly = null; startLoop(); }
    }

    // ── Sélection / noms ──────────────────────────────────────────────────
    function select(id, opts) {
        selected = id && items[id] ? id : null;
        const it = selected && items[selected];
        badge.textContent = it ? it.name : 'La Terre';
        renderSide();
        if (it && it.center && !(opts && opts.noFly)) {
            if (autoRotate) setAuto(false);
            flyTo(it.center[0], it.center[1]);
        } else requestDraw();
    }

    function onTap(px, py) {
        const id = hitTest(px, py);
        if (!id) {
            if (selected) { select(null); saveBoard(); }
            return;
        }
        if (hideNames && !revealed.has(id)) {
            revealed.add(id);
            requestDraw();
            saveBoard();
            return;
        }
        select(selected === id ? null : id);
        saveBoard();
    }

    function hitTest(px, py) {
        const ll = screenToLL(px, py);
        if (!ll) return null;
        const [lon, lat] = ll;
        if (layers.reperes && typeof GW_LINES !== 'undefined') {
            const r = radius(), TOL = 14;
            let best = null, bestD = TOL;
            for (const l of GW_LINES) {
                let d;
                if (typeof l.lat === 'number') d = Math.abs(lat - l.lat) * GG_D2R * r;
                else {
                    let dl = lon - l.lon; dl = ((dl + 540) % 360) - 180;
                    d = Math.abs(dl) * GG_D2R * r * Math.cos(lat * GG_D2R);
                }
                if (d < bestD) { bestD = d; best = l.id; }
            }
            if (best) return best;
        }
        if (_ggPointInPoly(lon, lat, DATA.caspian.ll)) return null;
        for (const { c, polys } of DATA.conts) {
            for (const p of polys) if (_ggPointInPoly(lon, lat, p.ll)) return c.id;
        }
        return _ggOceanAt(lon, lat);
    }

    function setHideNames(v) {
        hideNames = !!v;
        hideBtn.classList.toggle('on', hideNames);
        hideBtn.textContent = hideNames ? '🙉 Afficher les noms' : '🙈 Masquer les noms';
        revealBtn.style.display = hideNames ? '' : 'none';
        requestDraw();
    }

    function applyLayers() {
        controls.querySelectorAll('.gg-layer').forEach(b => b.classList.toggle('on', !!layers[b.dataset.layer]));
        if (selected && items[selected].layer === 'reperes' && !layers.reperes) select(null);
        else { renderSide(); requestDraw(); }
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    const row = (lbl, val) => `<li><b>${lbl} :</b> ${_ggEsc(val)}</li>`;
    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it) {
            side.style.borderLeftColor = '#5d93bd';
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">La Terre</h4>
                <div class="gg-hint-side">Touche un continent ou un océan pour te tourner vers lui et découvrir sa fiche.</div>
                <ul>
                    ${row('Forme', 'presque une sphère, très légèrement aplatie aux pôles')}
                    ${row('Rayon', 'environ 6 371 km')}
                    ${row('Tour de la Terre à l\'équateur', 'environ 40 000 km')}
                    ${row('Rotation sur elle-même', 'en 24 heures, d\'ouest en est')}
                    ${row('Tour du Soleil', 'en 365 jours et 6 heures')}
                </ul>
                <p style="margin-top:8px;color:#6b7280">Les océans recouvrent <b>71 %</b> de la surface de la Terre :
                vue de l'espace, c'est la « planète bleue ». Environ <b>8,2 milliards</b> d'êtres humains y vivent.</p>
                <p style="color:#6b7280">${GW_CONTINENTS.length} continents · ${GW_OCEANS.length} océans</p>
            `;
            return;
        }
        const d = it.data;
        const color = it.layer === 'reperes' ? d.color : COLORS[it.layer];
        side.style.borderLeftColor = it.layer === 'continents' ? d.col : (it.layer === 'oceans' ? '#5d93bd' : d.color);
        const shownName = hideNames && !revealed.has(it.id) ? '?' : it.name;
        let html = `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${color}">${_ggEsc(shownName)}</h4>`;
        html += `<div class="gg-kind">${KIND[it.layer]}</div>`;
        if (it.layer === 'continents') {
            html += '<ul>' + row('Superficie', d.sup) + row('Habitants', 'environ ' + d.pop) + row('Nombre de pays', d.pays)
                + (d.grand !== '—' ? row('Plus grand pays', d.grand) : '') + row('Plus haut sommet', d.sommet) + '</ul>';
        } else if (it.layer === 'oceans') {
            html += '<ul>' + row('Superficie', d.sup) + row('Profondeur maximale', d.prof) + '</ul>';
        } else {
            html += '<ul>' + row(typeof d.lat === 'number' ? 'Latitude' : 'Longitude', d.deg) + '</ul>';
        }
        html += `<p>${_ggEsc(d.fact)}</p>`;
        html += `<button class="gg-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        const back = side.querySelector('.gg-back-btn');
        back.addEventListener('pointerdown', e => e.stopPropagation());
        back.addEventListener('mousedown', e => e.stopPropagation());
        back.addEventListener('click', e => { e.stopPropagation(); select(null); saveBoard(); });
    }

    // ── Interaction globe : souris, doigt, stylet ─────────────────────────
    // Uniquement des événements pointer. Le « tap » est détecté nous-mêmes
    // (pointerdown → pointerup) avec une tolérance de tremblement pour le
    // stylet, et la fin de geste est aussi écoutée sur window (certains
    // stylets de vidéoprojecteur perdent la capture du pointeur).
    const TAP_TOL = 20;
    const pointers = new Map();
    let drag = null, pinch = null;

    function local(e) {
        const rc = canvas.getBoundingClientRect();
        const kx = rc.width ? cssW / rc.width : 1, ky = rc.height ? cssH / rc.height : 1;
        return { x: (e.clientX - rc.left) * kx, y: (e.clientY - rc.top) * ky, kx, ky };
    }
    const stop = e => e.stopPropagation();
    canvas.addEventListener('mousedown', stop);
    canvas.addEventListener('touchstart', stop, { passive: true });
    canvas.addEventListener('click', stop);
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        e.stopPropagation();
        e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
            window.addEventListener('pointerup', onEnd, true);
            window.addEventListener('pointercancel', onEnd, true);
        }
        if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom };
            drag = null;
        } else if (pointers.size === 1) {
            drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
            velLon = velLat = 0;
            fly = null;
            canvas.classList.add('gg-dragging');
        }
    });

    canvas.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId)) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }   // bouton relâché hors fenêtre
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size >= 2) {
            const [a, b] = [...pointers.values()];
            setZoom(pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0);
            return;
        }
        if (!drag || drag.id !== e.pointerId) return;
        const L = local(e), r = radius();
        const dx = (e.clientX - drag.lx) * L.kx, dy = (e.clientY - drag.ly) * L.ky;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
        // La surface suit le stylet
        const dLon = -dx / r, dLat = dy / r;
        lon0 += dLon;
        lat0 = clampLat(lat0 + dLat);
        const now = performance.now(), dts = Math.max(8, now - drag.lt) / 1000;
        velLon = 0.6 * velLon + 0.4 * (dLon / dts);
        velLat = 0.6 * velLat + 0.4 * (dLat / dts);
        drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
        requestDraw();
    });

    function onEnd(e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (pointers.size === 0) {
            window.removeEventListener('pointerup', onEnd, true);
            window.removeEventListener('pointercancel', onEnd, true);
            canvas.classList.remove('gg-dragging');
        }
        if (pinch) {
            if (pointers.size < 2) { pinch = null; velLon = velLat = 0; }
            if (pointers.size === 1) {   // reprise du glisser avec le doigt restant
                const [id, p] = [...pointers.entries()][0];
                drag = { id, x0: p.x, y0: p.y, lx: p.x, ly: p.y, lt: performance.now(), moved: true };
            } else drag = null;
            return;
        }
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        if (e.type === 'pointercancel') { velLon = velLat = 0; requestDraw(); return; }
        if (!d.moved) {
            velLon = velLat = 0;
            const L = local(e);
            onTap(L.x, L.y);
            return;
        }
        if (performance.now() - d.lt > 80) velLon = velLat = 0;     // stylet immobile au relâchement
        const MAXV = 5;
        velLon = Math.max(-MAXV, Math.min(MAXV, velLon));
        velLat = Math.max(-MAXV, Math.min(MAXV, velLat));
        if (velLon || velLat) startLoop();
        saveBoard();
    }

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        e.stopPropagation();
        setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.11));
    }, { passive: false });

    // ── Boutons ───────────────────────────────────────────────────────────
    // Empêche le déplacement du widget quand on vise un bouton au stylet
    controls.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.stopPropagation(); });
    controls.addEventListener('mousedown', e => { if (e.target.closest('button')) e.stopPropagation(); });
    side.addEventListener('pointerdown', e => e.stopPropagation());
    side.addEventListener('mousedown', e => e.stopPropagation());

    hideBtn.addEventListener('click', () => {
        revealed = new Set();
        if (!hideNames && selected) select(null, { noFly: true });
        setHideNames(!hideNames);
        renderSide();
        saveBoard();
    });
    revealBtn.addEventListener('click', () => {
        Object.keys(items).forEach(id => revealed.add(id));
        requestDraw();
        renderSide();
        saveBoard();
    });
    spinBtn.addEventListener('click', () => { setAuto(!autoRotate); saveBoard(); });
    homeBtn.addEventListener('click', () => {
        select(null, { noFly: true });
        zoom = 1;
        flyTo(HOME.lon, HOME.lat);
        saveBoard();
    });
    controls.querySelectorAll('.gg-layer').forEach(b => {
        b.addEventListener('click', () => {
            layers[b.dataset.layer] = !layers[b.dataset.layer];
            applyLayers();
            saveBoard();
        });
    });
    controls.querySelector('.gg-zoom-in').addEventListener('click', () => { setZoom(zoom * 1.25); saveBoard(); });
    controls.querySelector('.gg-zoom-out').addEventListener('click', () => { setZoom(zoom / 1.25); saveBoard(); });

    helpBtn.addEventListener('pointerdown', e => e.stopPropagation());
    helpBtn.addEventListener('mousedown', e => e.stopPropagation());
    helpBtn.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    helpPopup.addEventListener('pointerdown', e => e.stopPropagation());
    helpPopup.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.remove('show'); });
    const closeHelp = () => helpPopup.classList.remove('show');
    document.addEventListener('click', closeHelp);

    // ── Taille ────────────────────────────────────────────────────────────
    function applySize() {
        container.style.width  = contW + 'px';
        container.style.height = contH + 'px';
    }

    resizeHandle.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, y0 = e.clientY, w0 = contW, h0 = contH;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => {
            contW = Math.max(560, w0 + ev.clientX - x0);
            contH = Math.max(380, h0 + ev.clientY - y0);
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
            requestDraw();
            renderSide();
        });
        ro.observe(globeWrap);
    }

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    [wfMin, wfMax, wfClose].forEach(b => {
        b.addEventListener('pointerdown', stop);
        b.addEventListener('mousedown', stop);
    });

    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (autoRotate) setAuto(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🌐 Globe terrestre', {
                onExpand: () => requestAnimationFrame(() => { applySize(); requestDraw(); renderSide(); })
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
        animId = null; autoRotate = false; fly = null;
        if (ro) ro.disconnect();
        document.removeEventListener('click', closeHelp);
    }

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
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
    applyLayers();
    setHideNames(false);
    renderSide();
    requestAnimationFrame(() => { draw(); renderSide(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._ggGetData = () => ({
        containerW: contW,
        containerH: contH,
        lon: +(lon0 / GG_D2R).toFixed(2),
        lat: +(lat0 / GG_D2R).toFixed(2),
        zoom: +zoom.toFixed(3),
        layers: { ...layers },
        hideNames,
        revealed: Array.from(revealed),
        selected,
        autoRotate
    });
    widget._ggSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = Math.max(560, d.containerW);
        if (d.containerH) contH = Math.max(380, d.containerH);
        applySize();
        if (typeof d.lon === 'number') lon0 = d.lon * GG_D2R;
        if (typeof d.lat === 'number') lat0 = clampLat(d.lat * GG_D2R);
        if (typeof d.zoom === 'number') zoom = Math.max(ZMIN, Math.min(ZMAX, d.zoom));
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(id => items[id]));
        setHideNames(!!d.hideNames);
        applyLayers();
        select(d.selected && items[d.selected] ? d.selected : null, { noFly: true });
        setAuto(!!d.autoRotate);
        requestDraw();
    };

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
