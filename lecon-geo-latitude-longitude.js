// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même aide que dans activite-sciences-cycle-eau.js : définie une seule fois)
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches;
        if (!phone) return;
        if (launchOnly && !(typeof window._wfLastLaunch === 'number' && Date.now() - window._wfLastLaunch <= 2500)) return;
        var restored = false, auto = false;
        if (setKey && typeof widget[setKey] === 'function') {
            var orig = widget[setKey];
            widget[setKey] = function () {
                restored = true;
                if (auto && isOpen()) open();
                auto = false;
                return orig.apply(this, arguments);
            };
        }
        requestAnimationFrame(function () {
            if (restored || isOpen() || !widget.isConnected) return;
            auto = true;
            open();
        });
    };
}
if (!window._wfIsPhone) {
    window._wfIsPhone = function () {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    };
}

// =========================================================================
// WIDGET LATITUDE ET LONGITUDE — Le Bureau du Prof
// Pour des élèves de cycle 3 (CM1 – CM2 – 6e). Trois onglets :
//  🌍 Comprendre : un globe en 3D (ou un planisphère) avec les parallèles,
//     les méridiens, l'équateur et le méridien de Greenwich. On touche un
//     point : sa latitude et sa longitude sont tracées sur le globe.
//     Fiches : latitude, longitude, équateur, Greenwich, hémisphères,
//     comment écrire des coordonnées, et des lieux célèbres.
//  ⚓ Bataille navale : une flotte est cachée dans les océans. On vise en
//     réglant la latitude (▲ Nord / ▼ Sud) et la longitude (◀ Ouest / ▶ Est),
//     ou en touchant un croisement de la carte, puis on tire. 1 ou 2 équipes.
//  🎯 Quiz : « Clique au point dont les coordonnées sont 50° de latitude nord
//     et 120° de longitude est », ou l'inverse : « Quelles sont les
//     coordonnées du point ⭐ ? ». 10 questions, 3 niveaux.
//
// Le fond de carte (contours des continents, couleurs) est celui de
// activite-geo-monde.js (GW_SHAPES, GW_CONTINENTS, GW_CASPIAN) : les cartes
// sont ainsi identiques. Ce fichier doit donc être chargé dans la page.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », boutons
// de grande taille, rien d'accessible uniquement au survol.
//
// Dépendances : activite-geo-monde.js (fond de carte, boutons .wf-btn et
//   window._wfMiniBarCollapse). board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('gll-style')) return;
    const s = document.createElement('style');
    s.id = 'gll-style';
    s.textContent = `
        .widget[data-type="geo-latlong"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gll-container {
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
        .gll-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .gll-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .gll-header .wf-btns { gap: 8px; }
        .gll-header .wf-btn { width: 18px; height: 18px; }
        .gll-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gll-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
                padding-right: calc(10px + env(safe-area-inset-right)) !important;
                right: 0 !important;
                box-sizing: border-box !important;
            }
        }

        /* Onglets */
        .gll-tabs { display: inline-flex; background: #e3eefa; border-radius: 11px; padding: 3px; gap: 3px; }
        .gll-tab {
            min-height: 34px; padding: 4px 13px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .gll-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .gll-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .gll-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .gll-btn:hover { background: #e0e0e0; }
        .gll-btn:active { transform: scale(0.96); }
        .gll-btn:disabled { opacity: .45; cursor: default; }
        .gll-btn.on { background: #1d4f86; color: #fff; border-color: #1d4f86; }
        .gll-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .gll-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .gll-aim { display: inline-flex; align-items: center; gap: 4px; background: #f5f7fb; border: 1px solid #dbe3ee; border-radius: 11px; padding: 3px 6px; }
        .gll-aim .gll-btn { min-height: 34px; min-width: 40px; padding: 4px 8px; }
        .gll-aim-val { min-width: 74px; text-align: center; font-size: 16px; font-weight: 900; color: #1d4f86; }
        .gll-aim-lat .gll-aim-val { color: #c2410c; }
        .gll-aim-lon .gll-aim-val { color: #6d28d9; }
        .gll-fire { background: #dc2626 !important; border-color: #dc2626 !important; color: #fff !important; font-size: 15px; min-width: 120px; }
        .gll-fire:hover { background: #b91c1c !important; }
        .gll-next { background: #16a34a !important; border-color: #16a34a !important; color: #fff !important; }
        .gll-score { margin-left: auto; font-size: 13px; font-weight: 800; color: #1d4f86; white-space: nowrap; }

        /* Corps */
        .gll-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .gll-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #0f1c33;
        }
        .gll-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .gll-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #1d4f86;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .gll-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .gll-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .gll-text { margin: 0 0 6px; }
        .gll-box { background: #eef4fb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d3f6e; }
        .gll-coord { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 8px 10px; margin: 0 0 8px; font-size: 1.05em; }
        .gll-coord b.lat { color: #c2410c; } .gll-coord b.lon { color: #6d28d9; }
        .gll-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .gll-ok { background: #dcfce7; border-radius: 8px; padding: 7px 9px; color: #166534; font-weight: 800; margin: 0 0 6px; }
        .gll-bad { background: #fee2e2; border-radius: 8px; padding: 7px 9px; color: #991b1b; font-weight: 800; margin: 0 0 6px; }
        .gll-msg { border-radius: 10px; padding: 8px 10px; margin: 0 0 8px; font-weight: 800; font-size: 1.05em; }
        .gll-msg.hit { background: #fee2e2; color: #991b1b; }
        .gll-msg.sunk { background: #7f1d1d; color: #fff; }
        .gll-msg.miss { background: #dbeafe; color: #1e3a8a; }
        .gll-msg.land { background: #fef3c7; color: #92400e; }
        .gll-msg.info { background: #f3f4f6; color: #374151; }
        .gll-teams { display: flex; gap: 6px; margin: 0 0 8px; }
        .gll-team { flex: 1; border-radius: 10px; padding: 6px 8px; border: 2px solid transparent; text-align: center; font-weight: 800; }
        .gll-team big { display: block; font-size: 1.5em; }
        .gll-team.on { border-color: currentColor; box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
        .gll-fleet { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 3px; }
        .gll-fleet li { font-weight: 700; }
        .gll-fleet li.sunk { text-decoration: line-through; color: #9ca3af; }
        .gll-log { list-style: none; margin: 0 0 8px; padding: 0; font-size: .9em; color: #4b5563; }
        .gll-log li { padding: 2px 0; border-bottom: 1px dashed #e5e7eb; }
        .gll-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .gll-list button, .gll-go, .gll-choice {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .gll-list button.on { background: var(--st-c, #1d4f86); color: #fff; }
        .gll-go { text-align: center; background: #eef4fb; color: #1d4f86; margin: 0 0 8px; border-left-width: 1px; }
        .gll-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0 0 8px; }
        .gll-choice { text-align: center; font-size: 15px; font-weight: 900; min-height: 44px; border-left-width: 1px; color: #1f2937; }
        .gll-choice.good { background: #16a34a; color: #fff; border-color: #16a34a; }
        .gll-choice.wrong { background: #dc2626; color: #fff; border-color: #dc2626; }
        .gll-small { font-weight: 600; opacity: .75; font-size: .9em; }
        .gll-setting { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 0 0 6px; }
        .gll-setting .gll-btn { min-height: 30px; padding: 3px 9px; font-size: 12px; }

        /* Aide */
        .gll-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .gll-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 400px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .gll-help-popup.show { display: block; }
        .gll-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .gll-help-popup p { margin: 0 0 6px; }

        .gll-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .gll-resize-handle:hover { opacity: 1; }
        .gll-container:not([data-mode="comprendre"]) .gll-only-comprendre,
        .gll-container:not([data-mode="bataille"]) .gll-only-bataille,
        .gll-container:not([data-mode="quiz"]) .gll-only-quiz { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .gll-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .gll-tab-short { display: none; }
        .gll-header { min-width: 0; max-width: 100%; }
        .gll-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .gll-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .gll-header .wf-btns { flex-shrink: 0; }
        .gll-container.wf-fullboard .gll-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gll-container { padding: 10px 10px 8px; gap: 6px; }
            .gll-header { gap: 6px; }
            .gll-title { font-size: 13px; }
            .gll-tab { min-height: 32px; padding: 3px 8px; font-size: 12px; }
            .gll-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .gll-row > * { flex-shrink: 0; }
            .gll-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .gll-aim-val { min-width: 60px; font-size: 14px; }
            .gll-container[data-mode="bataille"] .gll-row,
            .gll-container[data-mode="quiz"] .gll-row { flex-wrap: wrap; overflow: visible; }
            .gll-aim .gll-lbl { display: none; }
            .gll-sep { display: none; }
            .gll-side { padding: 8px 10px; font-size: 13px; }
            .gll-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 620px) {
            .gll-title { display: none; }
            .gll-tab { padding: 3px 7px; font-size: 11.5px; }
            .gll-tab-long { display: none; }
            .gll-tab-short { display: inline; }
            .gll-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .gll-body { flex-direction: column; }
            .gll-scene-wrap { flex: 1 1 0; min-height: 200px; }
            .gll-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 45%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .gll-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="geo-latlong"], .gll-container, .gll-container * { cursor: default !important; }
        .gll-container .gll-header, .gll-container .gll-header * { cursor: grab !important; }
        .gll-container .gll-header:active, .gll-container .gll-header:active * { cursor: grabbing !important; }
        .gll-container button, .gll-container button *, .gll-container .gll-header button,
        .gll-container .gll-header button * { cursor: pointer !important; }
        .gll-container button:disabled, .gll-container button:disabled *,
        .gll-container .gll-canvas { cursor: default !important; }
        .gll-container input { cursor: text !important; }
        .gll-container .gll-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .gll-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .gll-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .gll-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .gll-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .gll-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .gll-help-popup { top: 56px; }
        .gll-container.wf-fullboard .gll-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gll-container.wf-fullboard .gll-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .gll-title { font-size: 17px; }
        }
        .gll-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .gll-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .gll-tab:hover { background: rgba(255,255,255,.1); }
        .gll-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .gll-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gll-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .gll-container.wf-fullboard .gll-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .gll-tab { padding: 3px 10px; font-size: 12px; }
            .gll-help-popup { top: 50px; }
        }
        @media (max-width: 620px) {
            .gll-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Écriture des coordonnées ──────────────────────────────────────────────
const _gllAbs = v => Math.abs(Math.round(v));
function _gllLat(v) { const a = _gllAbs(v); return a === 0 ? '0°' : `${a}° ${v > 0 ? 'N' : 'S'}`; }
function _gllLon(v) { v = _gllWrap(v); const a = _gllAbs(v); return a === 0 || a === 180 ? `${a}°` : `${a}° ${v > 0 ? 'E' : 'O'}`; }
function _gllCoord(lat, lon) { return `${_gllLat(lat)}, ${_gllLon(lon)}`; }
function _gllLatWords(v) {
    const a = _gllAbs(v);
    return a === 0 ? '0° de latitude (sur l\'équateur)' : `${a}° de latitude ${v > 0 ? 'nord' : 'sud'}`;
}
function _gllLonWords(v) {
    v = _gllWrap(v);
    const a = _gllAbs(v);
    if (a === 0) return '0° de longitude (sur le méridien de Greenwich)';
    if (a === 180) return '180° de longitude';
    return `${a}° de longitude ${v > 0 ? 'est' : 'ouest'}`;
}
function _gllWrap(lon) { let l = ((lon + 180) % 360 + 360) % 360 - 180; if (l === -180) l = 180; return l; }
const _gllRad = Math.PI / 180;

// ── Fond de carte (repris de activite-geo-monde.js) ──────────────────────
let _gllMapCache = null;
function _gllMap() {
    if (_gllMapCache) return _gllMapCache;
    if (typeof GW_SHAPES === 'undefined' || typeof GW_CONTINENTS === 'undefined') return null;
    const rings = [];
    GW_CONTINENTS.forEach(c => (GW_SHAPES[c.id] || []).forEach(r => rings.push({ pts: r, col: c.col, id: c.id })));
    // version densifiée (un point tous les 2° au plus) pour le globe
    const dense = r => {
        const out = [];
        for (let i = 0; i < r.length; i++) {
            const a = r[i], b = r[(i + 1) % r.length];
            const n = Math.max(1, Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) / 2));
            for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
        }
        return out;
    };
    rings.forEach(r => { r.dense = dense(r.pts); });
    const lake = typeof GW_CASPIAN !== 'undefined' ? GW_CASPIAN : null;
    _gllMapCache = { rings, lake, lakeDense: lake ? dense(lake) : null };
    return _gllMapCache;
}
function _gllInRing(lon, lat, r) {
    let inside = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function _gllIsLand(lat, lon) {
    const M = _gllMap();
    if (!M) return false;
    lon = _gllWrap(lon);
    if (M.lake && _gllInRing(lon, lat, M.lake)) return false;
    const test = l => M.rings.some(r => _gllInRing(l, lat, r.pts));
    return test(lon) || (Math.abs(lon) === 180 && test(-lon));
}
// Pleine mer : pas de terre à moins de 4° autour (les points sur une côte ou dans une
// mer étroite, comme la Baltique, ressemblent à des continents sur la carte)
function _gllIsOpenSea(lat, lon) {
    if (_gllIsLand(lat, lon)) return false;
    for (const [a, b] of [[4, 0], [-4, 0], [0, 4], [0, -4], [3, 3], [3, -3], [-3, 3], [-3, -3]]) {
        if (Math.abs(lat + a) < 90 && _gllIsLand(lat + a, lon + b)) return false;
    }
    return true;
}
// Nom de l'océan (approximatif, pour les points en mer)
function _gllOcean(lat, lon) {
    lon = _gllWrap(lon);
    if (lat >= 66) return 'l\'océan Arctique';
    if (lat <= -58) return 'l\'océan Austral';
    if (lat >= 30 && lat <= 46 && lon >= -5 && lon <= 36) return 'la mer Méditerranée';
    if (lat >= 53 && lat < 66 && lon >= 10 && lon <= 31) return 'la mer Baltique';
    if (lat >= 51 && lat < 66 && lon >= -96 && lon <= -76) return 'la baie d\'Hudson';
    if (lat >= 40 && lat <= 47 && lon >= 27 && lon <= 42) return 'la mer Noire';
    if (lon >= 20 && lon <= 147 && lat < 25 && !(lon > 100 && lat > -8)) return 'l\'océan Indien';
    if (lat >= 8 && lon >= -88 && lon <= 20) return 'l\'océan Atlantique';
    if (lat < 8 && lon >= -70 && lon <= 20) return 'l\'océan Atlantique';
    return 'l\'océan Pacifique';
}

// ── Lieux célèbres ────────────────────────────────────────────────────────
const GLL_PLACES = [
    { name: 'Paris', ico: '🗼', lat: 48.9, lon: 2.35 },
    { name: 'Chambéry', ico: '⛰️', lat: 45.6, lon: 5.9 },
    { name: 'Londres (Greenwich)', ico: '🇬🇧', lat: 51.5, lon: 0 },
    { name: 'New York', ico: '🗽', lat: 40.7, lon: -74.0 },
    { name: 'Rio de Janeiro', ico: '🇧🇷', lat: -22.9, lon: -43.2 },
    { name: 'Le Cap', ico: '🇿🇦', lat: -33.9, lon: 18.4 },
    { name: 'Tokyo', ico: '🇯🇵', lat: 35.7, lon: 139.7 },
    { name: 'Sydney', ico: '🇦🇺', lat: -33.9, lon: 151.2 },
    { name: 'Saint-Denis (La Réunion)', ico: '🌋', lat: -20.9, lon: 55.5 },
    { name: 'Nouméa (Nouvelle-Calédonie)', ico: '🏝️', lat: -22.3, lon: 166.5 }
];
// Fiches de l'onglet « Comprendre »
const GLL_PARTS = [
    { id: 'latitude', ico: '↕️', name: 'La latitude', color: '#c2410c',
      text: 'Les <b>parallèles</b> sont des cercles imaginaires parallèles à l\'équateur. La <b>latitude</b> d\'un point indique s\'il est plus ou moins loin de l\'équateur, vers le nord ou vers le sud. Elle se mesure en <b>degrés (°)</b>, de <b>0°</b> (l\'équateur) à <b>90° N</b> (pôle Nord) ou <b>90° S</b> (pôle Sud).',
      know: 'Plus on s\'éloigne de l\'équateur, plus les parallèles sont petits : au pôle, le parallèle n\'est plus qu\'un point !' },
    { id: 'longitude', ico: '↔️', name: 'La longitude', color: '#6d28d9',
      text: 'Les <b>méridiens</b> sont des demi-cercles imaginaires qui vont d\'un pôle à l\'autre. La <b>longitude</b> d\'un point indique s\'il est plus ou moins loin du méridien de Greenwich, vers l\'est ou vers l\'ouest. Elle se mesure de <b>0°</b> (Greenwich) à <b>180° E</b> ou <b>180° O</b>.',
      know: 'Tous les méridiens ont la même longueur, environ 20 000 km, et ils se rejoignent aux deux pôles.' },
    { id: 'equateur', ico: '🔴', name: 'L\'équateur', color: '#dc2626',
      text: 'L\'<b>équateur</b> est le parallèle <b>0°</b>. C\'est le plus grand cercle qui fait le tour de la Terre, à égale distance des deux pôles. Il partage la Terre en deux moitiés : l\'<b>hémisphère Nord</b> et l\'<b>hémisphère Sud</b>.',
      know: 'L\'équateur mesure environ 40 000 km. Il traverse notamment l\'Équateur (le pays !), le Brésil, le Congo, le Kenya et l\'Indonésie.' },
    { id: 'greenwich', ico: '🟣', name: 'Le méridien de Greenwich', color: '#7c3aed',
      text: 'Le méridien de <b>Greenwich</b> est le méridien <b>0°</b>. Il passe par l\'observatoire de Greenwich, près de Londres, et a été choisi comme point de départ en 1884. Avec le méridien 180°, il partage la Terre en <b>hémisphère Ouest</b> et <b>hémisphère Est</b>.',
      know: 'Le méridien de Greenwich traverse aussi la France, de la Normandie aux Pyrénées !' },
    { id: 'hemispheres', ico: '🌓', name: 'Les hémisphères', color: '#0f766e',
      text: 'Un <b>hémisphère</b> est une moitié de la Terre. L\'équateur sépare l\'hémisphère <b>Nord</b> (latitudes N) de l\'hémisphère <b>Sud</b> (latitudes S). Le méridien de Greenwich sépare l\'hémisphère <b>Ouest</b> (longitudes O) de l\'hémisphère <b>Est</b> (longitudes E).',
      know: 'La France métropolitaine est dans l\'hémisphère Nord et presque entièrement dans l\'hémisphère Est. La Réunion, elle, est dans l\'hémisphère Sud.' },
    { id: 'ecrire', ico: '✍️', name: 'Écrire des coordonnées', color: '#1d4f86',
      text: 'Les <b>coordonnées géographiques</b> d\'un point, ce sont sa <b>latitude</b> et sa <b>longitude</b>. On écrit toujours la <b>latitude en premier</b>, puis la longitude, sans oublier les lettres : <b>N</b> (nord), <b>S</b> (sud), <b>E</b> (est), <b>O</b> (ouest).',
      ex: true,
      know: 'C\'est grâce aux coordonnées que les GPS, les bateaux et les avions savent exactement où ils se trouvent.' }
];
const GLL_TEAMS = [{ name: 'Équipe 1', ico: '🔵', color: '#1d4ed8', bg: '#dbeafe' }, { name: 'Équipe 2', ico: '🟠', color: '#c2410c', bg: '#ffedd5' }];
const GLL_SHIPS = { 5: ['le', 'porte-avions'], 4: ['le', 'porte-avions'], 3: ['le', 'croiseur'], 2: ['le', 'sous-marin'], 1: ['la', 'vedette'] };

// ── Création du widget ────────────────────────────────────────────────────
function createGeoLatLongWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-latlong';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:${_phone ? 44 : 100}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
    container.className = 'gll-container';
    container.dataset.mode = 'comprendre';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(860, Math.min(1260, Math.round(window.innerWidth * 0.74)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.round(contW * 0.62));

    const header = document.createElement('div');
    header.className = 'gll-header';
    header.innerHTML = `
        <span class="gll-title">🧭<span> Latitude et longitude</span></span>
        <div class="gll-tabs">
            <button class="gll-tab on" data-mode="comprendre" title="Comprendre la latitude et la longitude"><span class="gll-tab-long">🌍 Comprendre</span><span class="gll-tab-short">🌍 Globe</span></button>
            <button class="gll-tab" data-mode="bataille" title="La bataille navale"><span class="gll-tab-long">⚓ Bataille navale</span><span class="gll-tab-short">⚓ Bataille</span></button>
            <button class="gll-tab" data-mode="quiz" title="Le quiz"><span class="gll-tab-long">🎯 Quiz</span><span class="gll-tab-short">🎯 Quiz</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gll-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.gll-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    const row1 = document.createElement('div');
    row1.className = 'gll-row';
    row1.innerHTML = `
        <button class="gll-btn gll-view gll-only-comprendre" data-view="globe" title="Le globe en 3D">🌍 Globe</button>
        <button class="gll-btn gll-view gll-only-comprendre" data-view="carte" title="Le planisphère">🗺️ Planisphère</button>
        <span class="gll-sep gll-only-comprendre"></span>
        <button class="gll-btn gll-spin gll-only-comprendre" title="Faire tourner le globe">🔄 Tourner</button>
        <button class="gll-btn gll-france gll-only-comprendre" title="Revenir sur la France">🇫🇷 Centrer sur la France</button>

        <div class="gll-aim gll-aim-lat gll-only-bataille">
            <span class="gll-lbl">Latitude</span>
            <button class="gll-btn" data-aim="lat-" title="Vers le sud">▼ S</button>
            <span class="gll-aim-val gll-lat-val"></span>
            <button class="gll-btn" data-aim="lat+" title="Vers le nord">▲ N</button>
        </div>
        <div class="gll-aim gll-aim-lon gll-only-bataille">
            <span class="gll-lbl">Longitude</span>
            <button class="gll-btn" data-aim="lon-" title="Vers l'ouest">◀ O</button>
            <span class="gll-aim-val gll-lon-val"></span>
            <button class="gll-btn" data-aim="lon+" title="Vers l'est">E ▶</button>
        </div>
        <button class="gll-btn gll-fire gll-only-bataille" title="Tirer sur ce point">🎯 Tirer !</button>

        <span class="gll-lbl gll-only-quiz">Niveau :</span>
        <button class="gll-btn gll-level gll-only-quiz" data-level="facile" title="Coordonnées multiples de 30°, quadrillage tous les 30°">🟢 Facile</button>
        <button class="gll-btn gll-level gll-only-quiz" data-level="moyen" title="Coordonnées multiples de 10°, quadrillage tous les 10°">🟠 Moyen</button>
        <button class="gll-btn gll-level gll-only-quiz" data-level="difficile" title="Coordonnées multiples de 10°, quadrillage tous les 30° seulement">🔴 Difficile</button>
        <span class="gll-sep gll-only-quiz"></span>
        <button class="gll-btn gll-qtype gll-only-quiz on" data-qtype="place" title="Cliquer au bon endroit">👆 Placer</button>
        <button class="gll-btn gll-qtype gll-only-quiz on" data-qtype="read" title="Lire les coordonnées d'un point">🔎 Lire</button>
        <button class="gll-btn gll-next gll-qnext gll-only-quiz" title="Question suivante">Suivante ▶</button>
        <span class="gll-score gll-only-quiz"></span>
    `;
    container.appendChild(row1);

    const body = document.createElement('div');
    body.className = 'gll-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'gll-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'gll-canvas';
    sceneWrap.appendChild(canvas);
    const side = document.createElement('div');
    side.className = 'gll-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gll-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Latitude et longitude</h4>
        <p><b>🌍 Comprendre</b> : fais glisser le globe pour le faire tourner. <b>Touche un point</b> : sa latitude
        (en orange) et sa longitude (en violet) s'affichent et sont tracées sur le globe. Les fiches expliquent les
        parallèles, les méridiens, l'équateur, Greenwich et les hémisphères ; la liste des lieux fait tourner le globe.</p>
        <p><b>⚓ Bataille navale</b> : des bateaux sont cachés sur les croisements du quadrillage, dans les océans.
        Règle la <b>latitude</b> (▲ N / ▼ S) et la <b>longitude</b> (◀ O / E ▶), ou touche un croisement, puis
        <b>🎯 Tirer !</b> Un bateau touché permet de rejouer. Joue en classe entière ou en deux équipes.</p>
        <p><b>🎯 Quiz</b> : 10 questions. <b>👆 Placer</b> : clique au point demandé. <b>🔎 Lire</b> : retrouve les
        coordonnées du point ⭐. Trois niveaux de difficulté.</p>
        <p style="color:#888">Sur le planisphère, les parallèles et les méridiens sont des droites : c'est plus facile
        pour lire les coordonnées, mais les régions proches des pôles y paraissent beaucoup trop grandes.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gll-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const spinBtn = $('.gll-spin'), franceBtn = $('.gll-france'), fireBtn = $('.gll-fire');
    const latVal = $('.gll-lat-val'), lonVal = $('.gll-lon-val'), qNextBtn = $('.gll-qnext'), scoreEl = $('.gll-score');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'comprendre';
    // Comprendre
    let view = 'globe', lon0 = 10, lat0 = 30, spin = false, rotTween = null;
    let part = -1, point = null, placeIdx = -1;
    // Bataille
    let bat = null;
    // Quiz
    let quiz = null, qLevel = 'facile', qTypes = { place: true, read: true };
    // Divers
    let animId = null, lastT = 0, drawPending = false, time = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let G = { cx: 0, cy: 0, R: 1 };           // globe
    let MR = { x: 0, y: 0, w: 1, h: 1 };       // planisphère
    let effects = [];                          // éclaboussures, explosions

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

    // =====================================================================
    //  LE PLANISPHÈRE (projection équirectangulaire : un quadrillage régulier)
    // =====================================================================
    function layoutMap(topBand) {
        const ml = 46, mr = 12, mt = 22 + topBand, mb = 22;
        const W = cssW - ml - mr, H = cssH - mt - mb;
        const w = Math.min(W, 2 * H), h = w / 2;
        MR = { x: ml + (W - w) / 2, y: mt + (H - h) / 2, w, h };
    }
    const mx = lon => MR.x + (lon + 180) / 360 * MR.w;
    const my = lat => MR.y + (90 - lat) / 180 * MR.h;
    const mInv = (x, y) => ({
        lon: Math.max(-180, Math.min(180, (x - MR.x) / MR.w * 360 - 180)),
        lat: Math.max(-90, Math.min(90, 90 - (y - MR.y) / MR.h * 180))
    });
    // une petite marge autour de la carte : les points du bord (180°) restent faciles à toucher
    const inMap = (x, y) => x >= MR.x - 14 && x <= MR.x + MR.w + 14 && y >= MR.y - 14 && y <= MR.y + MR.h + 14;

    function drawPlanisphere(opt) {
        const M = _gllMap();
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = '#cfe6f6'; ctx.fillRect(MR.x, MR.y, MR.w, MR.h);
        // Hémisphères (fiches)
        if (opt.tint === 'ns') {
            ctx.fillStyle = 'rgba(220,38,38,0.10)'; ctx.fillRect(MR.x, MR.y, MR.w, MR.h / 2);
            ctx.fillStyle = 'rgba(37,99,235,0.10)'; ctx.fillRect(MR.x, MR.y + MR.h / 2, MR.w, MR.h / 2);
        } else if (opt.tint === 'eo') {
            ctx.fillStyle = 'rgba(124,58,237,0.10)'; ctx.fillRect(MR.x, MR.y, MR.w / 2, MR.h);
            ctx.fillStyle = 'rgba(16,185,129,0.12)'; ctx.fillRect(MR.x + MR.w / 2, MR.y, MR.w / 2, MR.h);
        }
        if (M) {
            ctx.save(); ctx.beginPath(); ctx.rect(MR.x, MR.y, MR.w, MR.h); ctx.clip();
            for (const r of M.rings) {
                ctx.beginPath();
                r.pts.forEach((p, i) => i ? ctx.lineTo(mx(p[0]), my(p[1])) : ctx.moveTo(mx(p[0]), my(p[1])));
                ctx.closePath();
                ctx.fillStyle = r.col; ctx.fill();
                ctx.strokeStyle = 'rgba(55,65,81,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
            }
            if (M.lake) {
                ctx.beginPath(); M.lake.forEach((p, i) => i ? ctx.lineTo(mx(p[0]), my(p[1])) : ctx.moveTo(mx(p[0]), my(p[1])));
                ctx.closePath(); ctx.fillStyle = '#cfe6f6'; ctx.fill(); ctx.stroke();
            }
            ctx.restore();
        }
        // Quadrillage
        const g = opt.grid, L = opt.labels;
        for (let lat = -90 + g; lat < 90; lat += g) {
            if (lat === 0) continue;
            const major = lat % 30 === 0;
            ctx.strokeStyle = opt.hlLat ? 'rgba(194,65,12,' + (major ? 0.75 : 0.4) + ')' : 'rgba(30,58,95,' + (major ? 0.45 : 0.22) + ')';
            ctx.lineWidth = major ? 1.2 : 0.8;
            ctx.beginPath(); ctx.moveTo(MR.x, my(lat)); ctx.lineTo(MR.x + MR.w, my(lat)); ctx.stroke();
        }
        for (let lon = -180 + g; lon < 180; lon += g) {
            if (lon === 0) continue;
            const major = lon % 30 === 0;
            ctx.strokeStyle = opt.hlLon ? 'rgba(109,40,217,' + (major ? 0.75 : 0.4) + ')' : 'rgba(30,58,95,' + (major ? 0.45 : 0.22) + ')';
            ctx.lineWidth = major ? 1.2 : 0.8;
            ctx.beginPath(); ctx.moveTo(mx(lon), MR.y); ctx.lineTo(mx(lon), MR.y + MR.h); ctx.stroke();
        }
        // Équateur et Greenwich
        ctx.strokeStyle = '#dc2626'; ctx.lineWidth = opt.hlEq ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(MR.x, my(0)); ctx.lineTo(MR.x + MR.w, my(0)); ctx.stroke();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = opt.hlGw ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(mx(0), MR.y); ctx.lineTo(mx(0), MR.y + MR.h); ctx.stroke();
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.2; ctx.strokeRect(MR.x, MR.y, MR.w, MR.h);
        // Graduations
        const fs = Math.max(9.5, Math.min(12.5, MR.w / 75));
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
        for (let lat = -90 + L; lat < 90; lat += L) {
            ctx.fillStyle = lat === 0 ? '#dc2626' : '#c2410c';
            ctx.fillText(_gllLat(lat), MR.x - 4, my(lat));
        }
        ctx.textAlign = 'center';
        const lonStep = MR.w / (360 / L) < fs * 3.6 ? L * 2 : L;
        for (let lon = -180; lon <= 180; lon += lonStep) {
            ctx.fillStyle = lon === 0 ? '#7c3aed' : '#6d28d9';
            const t = _gllLon(lon);
            ctx.fillText(t, mx(lon), MR.y - fs * 0.85);
            ctx.fillText(t, mx(lon), MR.y + MR.h + fs * 0.9);
        }
        if (opt.names) {
            ctx.font = `800 ${fs * 0.95}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#dc2626'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText('Équateur', MR.x + 6, my(0) - 2);
            ctx.save(); ctx.translate(mx(0) + 3, MR.y + 6); ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#7c3aed'; ctx.textBaseline = 'bottom'; ctx.fillText('Méridien de Greenwich', 0, 0); ctx.restore();
        }
        if (opt.tint === 'ns' || opt.tint === 'eo') {
            ctx.font = `900 ${fs * 1.3}px 'Segoe UI', system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const lab = (t, x, y, c) => { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); };
            if (opt.tint === 'ns') { lab('Hémisphère Nord ▲', mx(-140), my(10), '#b91c1c'); lab('Hémisphère Sud ▼', mx(-140), my(-10), '#1d4ed8'); }
            else {
                const lw2 = (t, x, y, c, al) => { ctx.textAlign = al; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); };
                lw2('◀ Hémisphère Ouest', mx(0) - 8, my(-45), '#6d28d9', 'right'); lw2('Hémisphère Est ▶', mx(0) + 8, my(-45), '#047857', 'left');
            }
        }
    }

    // =====================================================================
    //  LE GLOBE (projection orthographique)
    // =====================================================================
    function gProj(lat, lon) {
        const p = lat * _gllRad, l = (lon - lon0) * _gllRad, p0 = lat0 * _gllRad;
        const x = Math.cos(p) * Math.sin(l);
        const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l);
        const z = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
        return [G.cx + x * G.R, G.cy - y * G.R, z, x, y];
    }
    function gInv(sx, sy) {
        const u = (sx - G.cx) / G.R, v = -(sy - G.cy) / G.R, d = u * u + v * v;
        if (d > 1) return null;
        const z = Math.sqrt(1 - d), p0 = lat0 * _gllRad;
        const lat = Math.asin(Math.max(-1, Math.min(1, v * Math.cos(p0) + z * Math.sin(p0)))) / _gllRad;
        const lon = lon0 + Math.atan2(u, z * Math.cos(p0) - v * Math.sin(p0)) / _gllRad;
        return { lat, lon: _gllWrap(lon) };
    }
    function gLine(pts, style, width, dash) {
        ctx.strokeStyle = style; ctx.lineWidth = width; ctx.setLineDash(dash || []);
        ctx.beginPath();
        let pen = false;
        for (const q of pts) {
            const p = gProj(q[0], q[1]);
            if (p[2] < 0) { pen = false; continue; }
            if (pen) ctx.lineTo(p[0], p[1]); else { ctx.moveTo(p[0], p[1]); pen = true; }
        }
        ctx.stroke(); ctx.setLineDash([]);
    }
    const parallelPts = (lat, a = -180, b = 180) => { const o = []; const n = Math.max(2, Math.ceil(Math.abs(b - a) / 3)); for (let k = 0; k <= n; k++) o.push([lat, a + (b - a) * k / n]); return o; };
    const meridianPts = (lon, a = -90, b = 90) => { const o = []; const n = Math.max(2, Math.ceil(Math.abs(b - a) / 3)); for (let k = 0; k <= n; k++) o.push([a + (b - a) * k / n, lon]); return o; };

    function drawGlobe(opt) {
        const M = _gllMap();
        // fond étoilé
        ctx.fillStyle = '#0f1c33'; ctx.fillRect(0, 0, cssW, cssH);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 60; i++) ctx.fillRect((i * 137.5 % 100) / 100 * cssW, (i * 61.7 % 100) / 100 * cssH, 1.4, 1.4);
        G.R = Math.min(cssW, cssH) * 0.42; G.cx = cssW / 2; G.cy = cssH / 2;
        const gr = ctx.createRadialGradient(G.cx - G.R * 0.35, G.cy - G.R * 0.35, G.R * 0.1, G.cx, G.cy, G.R);
        gr.addColorStop(0, '#bfe3fb'); gr.addColorStop(1, '#5b9fd3');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 2 * Math.PI); ctx.fill();
        // Continents
        if (M) {
            ctx.save(); ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 2 * Math.PI); ctx.clip();
            const ringPath = pts => {
                let vis = false;
                const P = pts.map(q => {
                    const p = gProj(q[1], q[0]);
                    if (p[2] > 0) { vis = true; return p; }
                    const n = Math.hypot(p[3], p[4]) || 1;             // point caché : ramené sur le bord du globe
                    return [G.cx + p[3] / n * G.R, G.cy - p[4] / n * G.R];
                });
                if (!vis) return false;
                ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
                return true;
            };
            for (const r of M.rings) {
                if (!ringPath(r.dense)) continue;
                ctx.fillStyle = r.col; ctx.fill();
                ctx.strokeStyle = 'rgba(55,65,81,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
            }
            if (M.lakeDense && ringPath(M.lakeDense)) { ctx.fillStyle = '#8cc3ea'; ctx.fill(); }
            ctx.restore();
        }
        // Hémisphères
        if (opt.tint === 'ns' || opt.tint === 'eo') {
            ctx.font = `900 ${Math.max(12, G.R / 13)}px 'Segoe UI', system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const lab = (t, la, lo, c) => { const p = gProj(la, lo); if (p[2] < 0.15) return; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(t, p[0], p[1]); ctx.fillStyle = c; ctx.fillText(t, p[0], p[1]); };
            if (opt.tint === 'ns') { lab('Hémisphère Nord', 45, lon0, '#b91c1c'); lab('Hémisphère Sud', -40, lon0, '#1d4ed8'); }
            else { lab('Hémisphère Ouest', 10, -60, '#6d28d9'); lab('Hémisphère Est', 10, 60, '#047857'); lab('Hémisphère Ouest', 10, -120, '#6d28d9'); lab('Hémisphère Est', 10, 120, '#047857'); }
        }
        // Quadrillage tous les 15°
        for (let lat = -75; lat <= 75; lat += 15) if (lat) gLine(parallelPts(lat), opt.hlLat ? 'rgba(194,65,12,' + (lat % 30 ? 0.45 : 0.8) + ')' : 'rgba(255,255,255,' + (lat % 30 ? 0.35 : 0.65) + ')', lat % 30 ? 0.8 : 1.3);
        for (let lon = -165; lon <= 180; lon += 15) if (lon) gLine(meridianPts(lon), opt.hlLon ? 'rgba(109,40,217,' + (lon % 30 ? 0.45 : 0.8) + ')' : 'rgba(255,255,255,' + (lon % 30 ? 0.35 : 0.65) + ')', lon % 30 ? 0.8 : 1.3);
        gLine(parallelPts(0), '#dc2626', opt.hlEq ? 4.5 : 2.5);
        gLine(meridianPts(0), '#7c3aed', opt.hlGw ? 4.5 : 2.5);
        // Graduations : latitudes le long du méridien central, longitudes le long de l'équateur
        const fs = Math.max(10, Math.min(13, G.R / 22));
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tag = (t, x, y, c) => { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(15,28,51,0.75)'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); };
        const lonLab = Math.round(lon0 / 30) * 30 + 15;
        for (let lat = -60; lat <= 60; lat += 30) {
            const p = gProj(lat, lonLab);
            if (p[2] > 0.25) tag(_gllLat(lat), p[0], p[1] - fs * 0.7, lat === 0 ? '#fecaca' : '#fed7aa');
        }
        const latLab = Math.abs(lat0) < 50 ? 0 : (lat0 > 0 ? 30 : -30);
        for (let lon = -150; lon <= 180; lon += 30) {
            const p = gProj(latLab, lon);
            if (p[2] > 0.3) tag(_gllLon(lon), p[0], p[1] + fs * 0.85, lon === 0 ? '#ddd6fe' : '#e9d5ff');
        }
        // Pôles
        for (const [la, t] of [[90, 'Pôle Nord'], [-90, 'Pôle Sud']]) {
            const p = gProj(la, 0);
            if (p[2] > 0.05) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p[0], p[1], 4, 0, 2 * Math.PI); ctx.fill(); tag(t, p[0], p[1] + (la > 0 ? -fs : fs), '#ffffff'); }
        }
        if (opt.names) {
            const p = gProj(0, lon0 - 40); if (p[2] > 0.2) tag('Équateur', p[0], p[1] - fs * 0.8, '#fecaca');
            const q = gProj(lat0 > 40 ? 20 : 40, 0); if (q[2] > 0.2) tag('Greenwich', q[0] + fs * 2.6, q[1], '#ddd6fe');
        }
        // Reflet
        const sh = ctx.createRadialGradient(G.cx - G.R * 0.4, G.cy - G.R * 0.45, 0, G.cx - G.R * 0.4, G.cy - G.R * 0.45, G.R * 0.9);
        sh.addColorStop(0, 'rgba(255,255,255,0.18)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(G.cx, G.cy, G.R, 0, 2 * Math.PI); ctx.stroke();
    }

    // Le point touché : latitude et longitude tracées
    function drawPointOverlay() {
        if (!point) return;
        const { lat, lon } = point;
        const fs = Math.max(11, Math.min(15, cssW / 60));
        if (view === 'globe') {
            gLine(parallelPts(lat), 'rgba(251,146,60,0.9)', 2, [6, 4]);
            gLine(meridianPts(lon), 'rgba(167,139,250,0.95)', 2, [6, 4]);
            gLine(parallelPts(0, 0, lon), '#a855f7', 6);                // longitude : de Greenwich au méridien du point
            gLine(meridianPts(lon, 0, lat), '#f97316', 6);              // latitude : de l'équateur au point
            const p = gProj(lat, lon), e = gProj(0, lon), m1 = gProj(lat / 2, lon), m2 = gProj(0, lon / 2);
            if (e[2] > 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e[0], e[1], 3.5, 0, 2 * Math.PI); ctx.fill(); }
            if (p[2] > 0) {
                ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
            }
            ctx.font = `900 ${fs}px 'Segoe UI', system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const pill = (t, q, bg) => {
                if (q[2] <= 0.05) return;
                const w = ctx.measureText(t).width + 14, h = fs * 1.7;
                ctx.fillStyle = bg; roundRect(q[0] - w / 2, q[1] - h / 2, w, h, 8); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText(t, q[0], q[1] + 1);
            };
            if (Math.abs(lat) >= 2) pill('Latitude ' + _gllLat(lat), [m1[0] + fs * 4.2, m1[1], m1[2]], '#c2410c');
            if (Math.abs(lon) >= 2) pill('Longitude ' + _gllLon(lon), [m2[0], m2[1] + fs * 1.4, m2[2]], '#6d28d9');
        } else {
            const x = mx(lon), y = my(lat);
            ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(234,88,12,0.9)'; ctx.beginPath(); ctx.moveTo(MR.x, y); ctx.lineTo(MR.x + MR.w, y); ctx.stroke();
            ctx.strokeStyle = 'rgba(124,58,237,0.9)'; ctx.beginPath(); ctx.moveTo(x, MR.y); ctx.lineTo(x, MR.y + MR.h); ctx.stroke();
            ctx.setLineDash([]); ctx.lineWidth = 6; ctx.lineCap = 'round';
            ctx.strokeStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(x, my(0)); ctx.lineTo(x, y); ctx.stroke();
            ctx.strokeStyle = '#a855f7'; ctx.beginPath(); ctx.moveTo(mx(0), my(0)); ctx.lineTo(x, my(0)); ctx.stroke();
            ctx.lineCap = 'butt';
            ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        }
        // Encadré des coordonnées
        const t = `📍 ${point.name ? point.name + ' : ' : ''}${_gllCoord(lat, lon)}`;
        ctx.font = `900 ${fs * 1.15}px 'Segoe UI', system-ui, sans-serif`;
        const w = ctx.measureText(t).width + 22, h = fs * 2.1;
        ctx.fillStyle = 'rgba(255,255,255,0.96)'; roundRect((cssW - w) / 2, cssH - h - 8, w, h, 10); ctx.fill();
        ctx.strokeStyle = '#1d4f86'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#111827'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, cssW / 2, cssH - h / 2 - 7);
    }

    // =====================================================================
    //  LA BATAILLE NAVALE
    // =====================================================================
    const batLats = s => { const o = []; for (let l = -90 + s; l < 90; l += s) if (Math.abs(l) <= 75) o.push(l); return o; };
    const batLons = s => { const o = []; for (let l = -180 + s; l <= 180; l += s) o.push(l); return o; };
    const key = (la, lo) => la + ',' + _gllWrap(lo);
    function newBattle(step, teams) {
        step = step === 15 ? 15 : 30; teams = teams === 2 ? 2 : 1;
        const lats = batLats(step), lons = batLons(step);
        const ocean = {};
        for (const la of lats) for (const lo of lons) if (_gllIsOpenSea(la, lo)) ocean[key(la, lo)] = true;
        const fleet = step === 30 ? [3, 2, 2, 1] : [4, 3, 2, 2, 1];
        let ships = null;
        for (let attempt = 0; attempt < 60 && !ships; attempt++) {
            const used = {}, out = [];
            let ok = true;
            for (const len of fleet) {
                let placed = false;
                for (let k = 0; k < 400 && !placed; k++) {
                    const horiz = Math.random() < 0.6;
                    const li = Math.floor(Math.random() * lats.length), oi = Math.floor(Math.random() * lons.length);
                    if (horiz && oi + len > lons.length) continue;          // ne passe pas d'un bord de la carte à l'autre
                    const cells = [];
                    for (let s = 0; s < len; s++) {
                        const la = horiz ? lats[li] : lats[li + s], lo = horiz ? lons[oi + s] : lons[oi];
                        if (la === undefined) { cells.length = 0; break; }
                        cells.push([la, lo]);
                    }
                    if (cells.length !== len) continue;
                    // dans l'océan, sans toucher un autre bateau (même en diagonale)
                    const free = cells.every(([la, lo]) => {
                        if (!ocean[key(la, lo)]) return false;
                        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (used[key(la + a * step, lo + b * step)]) return false;
                        return true;
                    });
                    if (!free) continue;
                    cells.forEach(([la, lo]) => { used[key(la, lo)] = true; });
                    out.push({ len, cells, name: GLL_SHIPS[len][1], art: GLL_SHIPS[len][0] });
                    placed = true;
                }
                if (!placed) { ok = false; break; }
            }
            if (ok) ships = out;
        }
        bat = {
            step, teams, ships: ships || [], shots: {}, turn: 0, score: [0, 0], nShots: [0, 0],
            log: [], msg: { cls: 'info', html: '⚓ Une flotte est cachée dans les océans. Choisis une <b>latitude</b> et une <b>longitude</b>, puis tire !' },
            aimLat: step === 30 ? 30 : 15, aimLon: step === 30 ? -30 : -15, over: false, reveal: false
        };
        effects = [];
    }
    function shipAt(la, lo) {
        const k = key(la, lo);
        for (const s of bat.ships) for (let i = 0; i < s.cells.length; i++) if (key(s.cells[i][0], s.cells[i][1]) === k) return s;
        return null;
    }
    const isSunk = s => s.cells.every(c => bat.shots[key(c[0], c[1])] === 'hit');
    function fire() {
        if (!bat || bat.over) return;
        const la = bat.aimLat, lo = bat.aimLon, k = key(la, lo), team = bat.turn;
        const where = `${_gllCoord(la, lo)}`;
        if (bat.shots[k]) { bat.msg = { cls: 'info', html: `🔁 Le point <b>${where}</b> a déjà été visé. Choisis un autre point !` }; refresh(); return; }
        bat.nShots[team]++;
        let res, cls, html, again = false;
        const s = shipAt(la, lo);
        const pre = bat.teams === 2 ? `${GLL_TEAMS[team].ico} ` : '';
        const [px, py] = [la, lo];
        if (s) {
            bat.shots[k] = 'hit';
            bat.score[team] += 1;
            again = true;
            if (isSunk(s)) {
                bat.score[team] += 2;
                res = 'sunk'; cls = 'sunk';
                const art = s.art || (s.name === 'vedette' ? 'la' : 'le');
                html = `🔥 <b>Coulé !</b> ${pre}${art.charAt(0).toUpperCase() + art.slice(1)} ${s.name} (${s.len} case${s.len > 1 ? 's' : ''}) est au fond de l'eau. (${where})`;
            } else {
                res = 'hit'; cls = 'hit';
                html = `💥 <b>Touché !</b> ${pre}Un bateau est en ${where}. Cherche autour !`;
            }
            effects.push({ kind: 'boom', lat: px, lon: py, t: 0 });
        } else if (!_gllIsOpenSea(la, lo) && !_gllIsLand(la, lo)) {
            bat.shots[k] = 'land';
            res = 'land'; cls = 'land';
            html = `🏖️ <b>Trop près de la côte !</b> Le point ${where} touche presque la terre : aucun bateau ne peut s'y cacher.`;
            effects.push({ kind: 'dust', lat: px, lon: py, t: 0 });
        } else if (_gllIsLand(la, lo)) {
            bat.shots[k] = 'land';
            res = 'land'; cls = 'land';
            html = `🏔️ <b>Sur un continent !</b> Le point ${where} est sur la terre ferme : pas de bateau ici.`;
            effects.push({ kind: 'dust', lat: px, lon: py, t: 0 });
        } else {
            bat.shots[k] = 'miss';
            res = 'miss'; cls = 'miss';
            html = `💧 <b>À l'eau !</b> ${pre}Le tir ${where} tombe dans ${_gllOcean(la, lo)}.`;
            effects.push({ kind: 'splash', lat: px, lon: py, t: 0 });
        }
        bat.log.unshift({ team, txt: `${where} → ${res === 'sunk' ? '🔥 coulé' : res === 'hit' ? '💥 touché' : res === 'land' ? '🏔️ continent' : '💧 à l\'eau'}` });
        bat.log = bat.log.slice(0, 12);
        if (bat.ships.every(isSunk)) {
            bat.over = true;
            let win = '';
            if (bat.teams === 2) {
                win = bat.score[0] === bat.score[1] ? ' Égalité parfaite !' : ` ${GLL_TEAMS[bat.score[0] > bat.score[1] ? 0 : 1].ico} <b>${GLL_TEAMS[bat.score[0] > bat.score[1] ? 0 : 1].name}</b> gagne !`;
            }
            html += `<br>🏆 <b>Toute la flotte est coulée</b> en ${bat.nShots[0] + bat.nShots[1]} tirs.${win}`;
        } else if (bat.teams === 2) {
            if (again) html += ` <b>${GLL_TEAMS[team].name}, rejoue !</b>`;
            else { bat.turn = 1 - team; html += ` À l'<b>${GLL_TEAMS[bat.turn].name.toLowerCase()}</b> !`; }
        }
        bat.msg = { cls, html };
        refresh(); save();
    }
    function aimStep(axis, dir) {
        if (!bat) return;
        const s = bat.step;
        if (axis === 'lat') {
            const lats = batLats(s), i = lats.indexOf(bat.aimLat);
            bat.aimLat = lats[Math.max(0, Math.min(lats.length - 1, i + dir))];
        } else {
            bat.aimLon = _gllWrap(bat.aimLon + dir * s);
            if (bat.aimLon === -180) bat.aimLon = 180;
        }
        refresh();
    }
    function drawShip(cells, step, color) {
        if (!cells.length) return;
        const pts = cells.map(c => [mx(c[1]), my(c[0])]);
        const cw = MR.w / (360 / step), chh = MR.h / (180 / step);
        const horiz = cells.length > 1 ? cells[0][0] === cells[1][0] : true;
        // un bateau sur la ligne du changement de date est dessiné en morceaux
        const groups = [[pts[0]]];
        for (let i = 1; i < pts.length; i++) {
            if (Math.abs(pts[i][0] - pts[i - 1][0]) > cw * 1.5) groups.push([]);
            groups[groups.length - 1].push(pts[i]);
        }
        for (const g of groups) {
            const xs = g.map(p => p[0]), ys = g.map(p => p[1]);
            const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
            const th = Math.min(cw, chh) * 0.42;
            ctx.fillStyle = color; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
            if (horiz) roundRect(x0 - th, y0 - th * 0.55, x1 - x0 + 2 * th, th * 1.1, th * 0.55);
            else roundRect(x0 - th * 0.55, y0 - th, th * 1.1, y1 - y0 + 2 * th, th * 0.55);
            ctx.fill(); ctx.stroke();
        }
    }
    function drawBattle() {
        layoutMap(0);
        const s = bat.step;
        drawPlanisphere({ grid: s, labels: s === 30 ? 30 : 30 });
        // croisements jouables
        const r = Math.max(2, Math.min(5, MR.w / 260));
        for (const la of batLats(s)) for (const lo of batLons(s)) {
            if (bat.shots[key(la, lo)]) continue;
            ctx.fillStyle = 'rgba(30,58,95,0.55)'; ctx.beginPath(); ctx.arc(mx(lo), my(la), r * 0.6, 0, 2 * Math.PI); ctx.fill();
        }
        // bateaux coulés (ou tous si « montrer »)
        for (const sh of bat.ships) {
            if (isSunk(sh)) drawShip(sh.cells, s, '#6b7280');
            else if (bat.reveal || bat.over) { ctx.globalAlpha = 0.55; drawShip(sh.cells, s, '#94a3b8'); ctx.globalAlpha = 1; }
        }
        // tirs
        const fs = Math.max(12, Math.min(22, MR.w / (360 / s) * 0.62));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const k in bat.shots) {
            const [la, lo] = k.split(',').map(Number), x = mx(lo === -180 ? 180 : lo), y = my(la), v = bat.shots[k];
            if (v === 'miss') {
                ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, fs * 0.35, 0, 2 * Math.PI); ctx.stroke();
                ctx.fillStyle = 'rgba(59,130,246,0.35)'; ctx.fill();
            } else if (v === 'land') {
                ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(x - fs * 0.28, y - fs * 0.28); ctx.lineTo(x + fs * 0.28, y + fs * 0.28); ctx.moveTo(x + fs * 0.28, y - fs * 0.28); ctx.lineTo(x - fs * 0.28, y + fs * 0.28); ctx.stroke();
            } else {
                ctx.font = `${fs}px sans-serif`; ctx.fillText('💥', x, y);
            }
            if (lo === 180) {           // même point à gauche de la carte
                const x2 = mx(-180);
                if (v === 'hit') ctx.fillText('💥', x2, y);
            }
        }
        // effets animés
        for (const e of effects) {
            const x = mx(e.lon), y = my(e.lat), k = e.t / 0.9;
            ctx.globalAlpha = Math.max(0, 1 - k);
            if (e.kind === 'splash') { ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 6 + 30 * k, 0, 2 * Math.PI); ctx.stroke(); }
            else if (e.kind === 'boom') { ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(x, y, 8 + 34 * k, 0, 2 * Math.PI); ctx.fill(); }
            else { ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.arc(x, y, 6 + 18 * k, 0, 2 * Math.PI); ctx.fill(); }
            ctx.globalAlpha = 1;
        }
        // viseur
        if (!bat.over) {
            const x = mx(bat.aimLon), y = my(bat.aimLat), R = Math.max(12, Math.min(22, MR.w / 50));
            ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(234,88,12,0.95)'; ctx.beginPath(); ctx.moveTo(MR.x, y); ctx.lineTo(MR.x + MR.w, y); ctx.stroke();
            ctx.strokeStyle = 'rgba(124,58,237,0.95)'; ctx.beginPath(); ctx.moveTo(x, MR.y); ctx.lineTo(x, MR.y + MR.h); ctx.stroke();
            ctx.setLineDash([]);
            const pul = 1 + 0.12 * Math.sin(time * 5);
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(x, y, R * pul, 0, 2 * Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x - R * 1.4, y); ctx.lineTo(x - R * 0.5, y); ctx.moveTo(x + R * 0.5, y); ctx.lineTo(x + R * 1.4, y);
            ctx.moveTo(x, y - R * 1.4); ctx.lineTo(x, y - R * 0.5); ctx.moveTo(x, y + R * 0.5); ctx.lineTo(x, y + R * 1.4); ctx.stroke();
            // marque les valeurs visées sur les bords
            const fs2 = Math.max(10, Math.min(13, MR.w / 70));
            ctx.font = `900 ${fs2}px 'Segoe UI', system-ui, sans-serif`;
            const tagAt = (t, x0, y0, c) => { const w = ctx.measureText(t).width + 10; ctx.fillStyle = c; roundRect(x0 - w / 2, y0 - fs2 * 0.8, w, fs2 * 1.6, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x0, y0 + 1); };
            tagAt(_gllLat(bat.aimLat), MR.x - 22, y, '#c2410c');
            tagAt(_gllLon(bat.aimLon), x, MR.y - fs2 * 0.9, '#6d28d9');
        }
    }

    // =====================================================================
    //  LE QUIZ
    // =====================================================================
    const QCFG = {
        facile:    { mult: 30, grid: 30, labels: 30, latMax: 60, tol: 12 },
        moyen:     { mult: 10, grid: 10, labels: 30, latMax: 70, tol: 5 },
        difficile: { mult: 10, grid: 30, labels: 30, latMax: 70, tol: 6 }
    };
    function newQuiz() {
        if (!qTypes.place && !qTypes.read) qTypes.place = true;
        quiz = { level: qLevel, n: 10, i: 0, score: 0, results: [], q: null, answered: false, done: false, seen: {} };
        nextQuestion(true);
    }
    function randPoint() {
        const c = QCFG[quiz.level];
        for (let k = 0; k < 200; k++) {
            const nLat = Math.floor(c.latMax / c.mult);
            const lat = (Math.floor(Math.random() * (2 * nLat + 1)) - nLat) * c.mult;
            const lon = _gllWrap((Math.floor(Math.random() * (360 / c.mult)) - (180 / c.mult) + 1) * c.mult);
            const kk = lat + ',' + lon;
            if (quiz.seen[kk]) continue;
            // au niveau facile, on évite trop de zéros
            if (quiz.level === 'facile' && lat === 0 && lon === 0) continue;
            quiz.seen[kk] = true;
            return { lat, lon };
        }
        return { lat: 30, lon: 60 };
    }
    function nextQuestion(first) {
        if (!quiz) return newQuiz();
        if (!first) {
            if (!quiz.answered) quiz.results[quiz.i] = 0;
            quiz.i++;
        }
        if (quiz.i >= quiz.n) { quiz.done = true; quiz.q = null; refresh(); return; }
        const types = [];
        if (qTypes.place) types.push('place');
        if (qTypes.read) types.push('read');
        const type = types[Math.floor(Math.random() * types.length)];
        const p = randPoint();
        const q = { type, lat: p.lat, lon: p.lon, click: null, choice: -1 };
        if (type === 'read') {
            const c = QCFG[quiz.level], opts = [[p.lat, p.lon]];
            const cand = [[-p.lat, p.lon], [p.lat, -p.lon], [p.lon, p.lat], [-p.lat, -p.lon], [p.lat + c.mult, p.lon], [p.lat, p.lon + c.mult], [p.lat - c.mult, p.lon], [p.lat, p.lon - c.mult]];
            for (const o of cand.sort(() => Math.random() - 0.5)) {
                if (Math.abs(o[0]) > 80) continue;
                o[1] = _gllWrap(o[1]);
                if (opts.some(x => _gllCoord(x[0], x[1]) === _gllCoord(o[0], o[1]))) continue;
                opts.push(o);
                if (opts.length === 4) break;
            }
            q.choices = opts.sort(() => Math.random() - 0.5);
        }
        quiz.q = q; quiz.answered = false;
        effects = [];
        refresh();
    }
    function answerPlace(lat, lon) {
        const q = quiz.q, c = QCFG[quiz.level];
        q.click = { lat, lon };
        const dLon = Math.abs(_gllWrap(lon - q.lon));
        const ok = Math.abs(lat - q.lat) <= c.tol && dLon <= c.tol;
        quiz.answered = true; quiz.results[quiz.i] = ok ? 1 : 0;
        if (ok) quiz.score++;
        effects.push({ kind: ok ? 'good' : 'bad', lat: q.lat, lon: q.lon, t: 0 });
        refresh(); save();
    }
    function answerRead(i) {
        const q = quiz.q;
        if (quiz.answered) return;
        q.choice = i;
        const ok = _gllCoord(q.choices[i][0], q.choices[i][1]) === _gllCoord(q.lat, q.lon);
        quiz.answered = true; quiz.results[quiz.i] = ok ? 1 : 0;
        if (ok) quiz.score++;
        effects.push({ kind: ok ? 'good' : 'bad', lat: q.lat, lon: q.lon, t: 0 });
        refresh(); save();
    }
    function questionText(q) {
        if (q.type === 'place') return `Clique au point dont les coordonnées sont ${_gllLatWords(q.lat)} et ${_gllLonWords(q.lon)}.`;
        return 'Quelles sont les coordonnées du point ⭐ ?';
    }
    function wrap(txt, maxW) {
        const words = txt.split(' '), lines = [];
        let cur = '';
        for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
        if (cur) lines.push(cur);
        return lines;
    }
    function drawStar(x, y, R, fill) {
        ctx.beginPath();
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? R * 0.45 : R; k ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    function drawQuiz() {
        const bf = Math.max(14, Math.min(22, cssW / 42));
        ctx.font = `800 ${bf}px 'Segoe UI', system-ui, sans-serif`;
        let txt;
        if (quiz.done) txt = `🏆 Quiz terminé : ${quiz.score} / ${quiz.n} !`;
        else txt = `${quiz.i + 1}/${quiz.n} · ${questionText(quiz.q)}`;
        const lines = wrap(txt, cssW - 40);
        const band = lines.length * bf * 1.25 + 18;
        layoutMap(band);
        const c = QCFG[quiz.level];
        drawPlanisphere({ grid: c.grid, labels: c.labels });
        // bandeau de la question
        ctx.font = `800 ${bf}px 'Segoe UI', system-ui, sans-serif`;
        const bw = Math.min(cssW - 12, Math.max(...lines.map(l => ctx.measureText(l).width)) + 30);
        const col = quiz.done ? '#166534' : quiz.answered ? (quiz.results[quiz.i] ? '#166534' : '#991b1b') : '#1d4f86';
        ctx.fillStyle = 'rgba(255,255,255,0.97)'; roundRect((cssW - bw) / 2, 6, bw, band - 8, 12); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        lines.forEach((l, k) => ctx.fillText(l, cssW / 2, 6 + 9 + bf * 1.25 * (k + 0.5)));
        if (quiz.done || !quiz.q) return;
        const q = quiz.q, R = Math.max(10, Math.min(18, MR.w / 55));
        if (q.type === 'read') drawStar(mx(q.lon), my(q.lat), R * (1 + 0.08 * Math.sin(time * 4)), '#facc15');
        if (quiz.answered && q.type === 'place') {
            const x = mx(q.lon), y = my(q.lat);
            ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(234,88,12,0.9)'; ctx.beginPath(); ctx.moveTo(MR.x, y); ctx.lineTo(MR.x + MR.w, y); ctx.stroke();
            ctx.strokeStyle = 'rgba(124,58,237,0.9)'; ctx.beginPath(); ctx.moveTo(x, MR.y); ctx.lineTo(x, MR.y + MR.h); ctx.stroke();
            ctx.setLineDash([]);
            drawStar(x, y, R, '#22c55e');
            if (q.click) {
                const cx2 = mx(q.click.lon), cy2 = my(q.click.lat), ok = quiz.results[quiz.i];
                ctx.strokeStyle = ok ? '#16a34a' : '#dc2626'; ctx.lineWidth = 3.5;
                ctx.beginPath(); ctx.moveTo(cx2 - 8, cy2 - 8); ctx.lineTo(cx2 + 8, cy2 + 8); ctx.moveTo(cx2 + 8, cy2 - 8); ctx.lineTo(cx2 - 8, cy2 + 8); ctx.stroke();
                const t = `Tu as cliqué en ${_gllCoord(q.click.lat, q.click.lon)}`;
                const fs = Math.max(11, Math.min(14, cssW / 65));
                ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
                const above = y > cy2 ? true : (y < cy2 ? false : cy2 > MR.y + MR.h * 0.8);       // à l'opposé de l'étoile
                const w = ctx.measureText(t).width + 14, lx = Math.max(MR.x + w / 2, Math.min(MR.x + MR.w - w / 2, cx2)), ly = cy2 + (above ? -24 : 24);
                ctx.fillStyle = ok ? '#166534' : '#991b1b'; roundRect(lx - w / 2, ly - fs * 0.85, w, fs * 1.7, 7); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, lx, ly + 1);
            }
        }
        for (const e of effects) {
            if (e.kind !== 'good' && e.kind !== 'bad') continue;
            const k = e.t / 0.9; ctx.globalAlpha = Math.max(0, 1 - k);
            ctx.strokeStyle = e.kind === 'good' ? '#22c55e' : '#ef4444'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(mx(e.lon), my(e.lat), 10 + 40 * k, 0, 2 * Math.PI); ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function partOpt() {
        const id = part >= 0 ? GLL_PARTS[part].id : '';
        return {
            hlLat: id === 'latitude', hlLon: id === 'longitude', hlEq: id === 'equateur' || id === 'hemispheres',
            hlGw: id === 'greenwich' || id === 'hemispheres',
            tint: id === 'equateur' ? 'ns' : id === 'greenwich' ? 'eo' : id === 'hemispheres' ? (Math.floor(time / 3) % 2 ? 'eo' : 'ns') : '',
            names: true, grid: 15, labels: 30
        };
    }
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.setLineDash([]);
        if (!_gllMap()) {
            ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, cssW, cssH);
            ctx.fillStyle = '#991b1b'; ctx.font = "800 15px 'Segoe UI', sans-serif"; ctx.textAlign = 'center';
            ctx.fillText('Fond de carte introuvable : activite-geo-monde.js doit être chargé dans la page.', cssW / 2, cssH / 2);
        } else if (mode === 'comprendre') {
            const o = partOpt();
            if (view === 'globe') drawGlobe(o); else { layoutMap(0); drawPlanisphere(o); }
            drawPointOverlay();
        } else if (mode === 'bataille') {
            if (!bat) newBattle(30, 1);
            drawBattle();
        } else {
            if (!quiz) newQuiz();
            drawQuiz();
        }
        updateInfo();
    }

    // ── Fiche latérale et boutons ─────────────────────────────────────────
    let lastInfoKey = '';
    function coordBox(p) {
        return `<div class="gll-coord">📍 ${p.name ? '<b>' + p.name + '</b><br>' : ''}Latitude : <b class="lat">${_gllLat(p.lat)}</b>${Math.abs(p.lat) >= 0.5 ? (p.lat > 0 ? ' (nord)' : ' (sud)') : ' (sur l\'équateur)'}<br>Longitude : <b class="lon">${_gllLon(p.lon)}</b>${Math.abs(_gllWrap(p.lon)) >= 0.5 && Math.abs(_gllWrap(p.lon)) < 179.5 ? (_gllWrap(p.lon) > 0 ? ' (est)' : ' (ouest)') : ''}<br><span class="gll-small">On écrit : ${_gllCoord(p.lat, p.lon)}</span></div>`;
    }
    function partsList() {
        return `<ol class="gll-list">${GLL_PARTS.map((p, i) => `<li><button data-part="${i}" class="${part === i ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}</button></li>`).join('')}</ol>`;
    }
    function placesList() {
        return `<ol class="gll-list">${GLL_PLACES.map((p, i) => `<li><button data-place="${i}" class="${placeIdx === i ? 'on' : ''}" style="--st-c:#0f766e">${p.ico} ${p.name} <span class="gll-small">${_gllCoord(p.lat, p.lon)}</span></button></li>`).join('')}</ol>`;
    }
    function updateInfo() {
        // boutons
        row1.querySelectorAll('.gll-view').forEach(b => b.classList.toggle('on', b.dataset.view === view));
        spinBtn.classList.toggle('on', spin);
        spinBtn.disabled = view !== 'globe'; franceBtn.disabled = view !== 'globe';
        if (bat) {
            latVal.textContent = _gllLat(bat.aimLat); lonVal.textContent = _gllLon(bat.aimLon);
            fireBtn.disabled = bat.over;
        }
        row1.querySelectorAll('.gll-level').forEach(b => b.classList.toggle('on', b.dataset.level === qLevel));
        row1.querySelectorAll('.gll-qtype').forEach(b => b.classList.toggle('on', !!qTypes[b.dataset.qtype]));
        if (quiz) {
            scoreEl.textContent = `⭐ ${quiz.score} / ${quiz.n}`;
            qNextBtn.textContent = quiz.done ? '🔄 Rejouer' : quiz.answered ? 'Suivante ▶' : '⏭ Passer';
        }
        const key = mode === 'comprendre' ? ['c', part, placeIdx, point ? _gllCoord(point.lat, point.lon) : '', view].join('|')
            : mode === 'bataille' ? ['b', bat && JSON.stringify([bat.msg, bat.turn, bat.score, bat.over, bat.reveal, bat.step, bat.teams, bat.log.length, bat.nShots])].join('|')
            : ['q', quiz && JSON.stringify([quiz.i, quiz.answered, quiz.done, quiz.score, quiz.level, quiz.q && quiz.q.choice])].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const scroll = side.scrollTop;

        if (mode === 'comprendre') {
            side.style.borderLeftColor = part >= 0 ? GLL_PARTS[part].color : '#1d4f86';
            const pt = point ? coordBox(point) : '<p class="gll-box">👆 <b>Touche un point</b> du globe pour connaître sa latitude et sa longitude.</p>';
            if (part < 0) {
                side.innerHTML = `<h4>Géographie</h4>
                    <div class="gll-status" style="color:#1d4f86">🧭 Se repérer sur la Terre</div>
                    ${pt}
                    <p class="gll-text">Pour repérer un point sur la Terre, on utilise un <b>quadrillage imaginaire</b> : les <b>parallèles</b> (en travers) et les <b>méridiens</b> (du nord au sud). Chaque point a deux <b>coordonnées</b> : sa <b>latitude</b> et sa <b>longitude</b>.</p>
                    ${partsList()}
                    <div style="font-weight:800;margin:10px 0 4px">📍 Des lieux à retrouver :</div>
                    ${placesList()}`;
            } else {
                const p = GLL_PARTS[part];
                const ex = p.ex ? `<p class="gll-box">Exemple : <b>Paris</b> se trouve à <b>49° N, 2° E</b> : 49° au nord de l'équateur et 2° à l'est du méridien de Greenwich.</p>` : '';
                side.innerHTML = `<h4>Se repérer sur la Terre</h4>
                    <div class="gll-status" style="color:${p.color}">${p.ico} ${p.name}</div>
                    <p class="gll-text">${p.text}</p>${ex}
                    ${pt}
                    <p class="gll-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    <button class="gll-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${partsList()}`;
            }
        } else if (mode === 'bataille') {
            const b = bat;
            side.style.borderLeftColor = b.teams === 2 && !b.over ? GLL_TEAMS[b.turn].color : '#1d4f86';
            const teams = b.teams === 2 ? `<div class="gll-teams">${GLL_TEAMS.map((t, i) => `<div class="gll-team ${!b.over && b.turn === i ? 'on' : ''}" style="background:${t.bg};color:${t.color}">${t.ico} ${t.name}<big>${b.score[i]}</big><span class="gll-small">${b.nShots[i]} tir${b.nShots[i] > 1 ? 's' : ''}</span></div>`).join('')}</div>`
                : `<p class="gll-box">🎯 Tirs : <b>${b.nShots[0]}</b> · 💥 Touchés : <b>${Object.values(b.shots).filter(v => v === 'hit').length}</b></p>`;
            side.innerHTML = `<h4>Bataille navale</h4>
                <div class="gll-status" style="color:#1d4f86">⚓ ${b.over ? 'Partie terminée' : b.teams === 2 ? `À l'${GLL_TEAMS[b.turn].name.toLowerCase()} de jouer` : 'Trouve la flotte !'}</div>
                <div class="gll-msg ${b.msg.cls}">${b.msg.html}</div>
                ${teams}
                <div style="font-weight:800;margin:2px 0 4px">🚢 La flotte ennemie :</div>
                <ul class="gll-fleet">${b.ships.map(s => `<li class="${isSunk(s) ? 'sunk' : ''}">${isSunk(s) ? '🔥' : '🚢'} ${s.name.charAt(0).toUpperCase() + s.name.slice(1)} (${s.len} case${s.len > 1 ? 's' : ''})</li>`).join('')}</ul>
                ${b.log.length ? `<div style="font-weight:800;margin:2px 0 4px">📜 Derniers tirs :</div><ul class="gll-log">${b.log.map(l => `<li>${b.teams === 2 ? GLL_TEAMS[l.team].ico + ' ' : ''}${l.txt}</li>`).join('')}</ul>` : ''}
                <div class="gll-setting"><span class="gll-lbl">Quadrillage :</span>
                    <button class="gll-btn ${b.step === 30 ? 'on' : ''}" data-bset="step30">30°</button>
                    <button class="gll-btn ${b.step === 15 ? 'on' : ''}" data-bset="step15">15°</button></div>
                <div class="gll-setting"><span class="gll-lbl">Équipes :</span>
                    <button class="gll-btn ${b.teams === 1 ? 'on' : ''}" data-bset="teams1">👥 Classe</button>
                    <button class="gll-btn ${b.teams === 2 ? 'on' : ''}" data-bset="teams2">🔵🟠 2 équipes</button></div>
                <button class="gll-go" data-action="newbat">🔄 Nouvelle partie</button>
                <button class="gll-go" data-action="reveal">${b.reveal ? '🙈 Cacher les bateaux' : '👀 Montrer les bateaux (maître)'}</button>
                <p class="gll-know">💡 Un bateau <b>touché</b> permet de <b>rejouer</b>. Touché = 1 point, coulé = 2 points de plus. Les bateaux ne se touchent jamais.</p>`;
        } else {
            const q = quiz;
            side.style.borderLeftColor = '#1d4f86';
            if (q.done) {
                side.innerHTML = `<h4>Quiz</h4>
                    <div class="gll-status" style="color:#166534">🏆 ${q.score} / ${q.n}</div>
                    <p class="gll-text">${q.score === q.n ? 'Parfait ! Tu sais lire les coordonnées comme un navigateur !' : q.score >= 7 ? 'Très bien ! Encore un petit effort.' : 'Retourne dans l\'onglet 🌍 Comprendre pour revoir la latitude et la longitude, puis recommence !'}</p>
                    <p class="gll-box">${q.results.map((r, i) => `${i + 1}. ${r ? '✅' : '❌'}`).join(' &nbsp; ')}</p>
                    <button class="gll-go" data-action="newquiz">🔄 Nouveau quiz</button>`;
            } else {
                const qq = q.q, c = QCFG[q.level];
                let html = `<h4>Question ${q.i + 1} sur ${q.n}</h4>
                    <div class="gll-status" style="color:#1d4f86">${qq.type === 'place' ? '👆' : '🔎'} ${questionText(qq)}</div>`;
                if (qq.type === 'read') {
                    html += `<div class="gll-choices">${qq.choices.map((o, i) => {
                        const good = _gllCoord(o[0], o[1]) === _gllCoord(qq.lat, qq.lon);
                        const cls = q.answered ? (good ? 'good' : i === qq.choice ? 'wrong' : '') : '';
                        return `<button class="gll-choice ${cls}" data-choice="${i}" ${q.answered ? 'disabled' : ''}>${_gllCoord(o[0], o[1])}</button>`;
                    }).join('')}</div>`;
                }
                if (q.answered) {
                    const ok = q.results[q.i];
                    html += ok ? `<p class="gll-ok">✅ Bravo ! Le point est bien en ${_gllCoord(qq.lat, qq.lon)}.</p>`
                        : `<p class="gll-bad">❌ Raté ! La bonne réponse était ${_gllCoord(qq.lat, qq.lon)}${qq.type === 'place' ? ' (l\'étoile verte)' : ''}.</p>`;
                    html += `<p class="gll-box">↕️ Latitude ${_gllLat(qq.lat)} : ${qq.lat === 0 ? 'sur l\'équateur' : `${Math.abs(qq.lat)}° au ${qq.lat > 0 ? 'nord' : 'sud'} de l'équateur`}.<br>↔️ Longitude ${_gllLon(qq.lon)} : ${qq.lon === 0 ? 'sur le méridien de Greenwich' : Math.abs(qq.lon) === 180 ? 'à l\'opposé de Greenwich' : `${Math.abs(qq.lon)}° à l'${qq.lon > 0 ? 'est' : 'ouest'} de Greenwich`}.</p>`;
                } else if (qq.type === 'place') {
                    html += `<p class="gll-box">💡 Cherche d'abord la <b style="color:#c2410c">latitude</b> sur le bord gauche (N ou S), puis la <b style="color:#6d28d9">longitude</b> en haut (E ou O). Le point est au croisement !</p>`;
                }
                html += `<p class="gll-text" style="color:#6b7280">Niveau ${q.level} · quadrillage tous les ${c.grid}° · score : <b>${q.score}</b></p>`;
                side.innerHTML = html;
            }
        }
        side.scrollTop = scroll;
    }

    // ── Animation ─────────────────────────────────────────────────────────
    function needAnim() {
        return (mode === 'comprendre' && view === 'globe' && (spin || rotTween)) || effects.length > 0
            || (mode === 'bataille' && bat && !bat.over) || (mode === 'quiz' && quiz && quiz.q && quiz.q.type === 'read' && !quiz.answered)
            || (mode === 'comprendre' && part >= 0 && GLL_PARTS[part].id === 'hemispheres');
    }
    function loop(t) {
        if (!widget.isConnected) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t; time += dt;
        if (sceneWrap.clientWidth === 0) { animId = null; lastT = 0; return; }
        if (spin && mode === 'comprendre' && view === 'globe') lon0 = _gllWrap(lon0 + dt * 14);
        if (rotTween) {
            const k = 1 - Math.pow(0.004, dt);
            let dl = _gllWrap(rotTween.lon - lon0);
            lon0 = _gllWrap(lon0 + dl * k); lat0 += (rotTween.lat - lat0) * k;
            if (Math.abs(dl) < 0.2 && Math.abs(rotTween.lat - lat0) < 0.2) { lon0 = rotTween.lon; lat0 = rotTween.lat; rotTween = null; }
        }
        effects.forEach(e => { e.t += dt; });
        effects = effects.filter(e => e.t < 0.9);
        draw();
        if (needAnim()) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (!animId) { lastT = 0; animId = requestAnimationFrame(loop); } }
    function refresh() {
        lastInfoKey = '';
        if (animId) return;
        if (needAnim()) startLoop();
        else if (!drawPending) { drawPending = true; requestAnimationFrame(() => { drawPending = false; draw(); }); }
    }
    function rotateTo(lat, lon) { spin = false; rotTween = { lat: Math.max(-70, Math.min(70, lat)), lon }; startLoop(); }

    function setMode(md) {
        mode = ['comprendre', 'bataille', 'quiz'].includes(md) ? md : 'comprendre';
        container.dataset.mode = mode;
        header.querySelectorAll('.gll-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (mode === 'bataille' && !bat) newBattle(30, 1);
        if (mode === 'quiz' && !quiz) newQuiz();
        effects = [];
        side.scrollTop = 0;
        refresh();
    }

    // ── Interaction sur le dessin ─────────────────────────────────────────
    const TAP_TOL = 14;
    let drag = null;
    const stop = e => e.stopPropagation();
    canvas.addEventListener('mousedown', stop);
    canvas.addEventListener('touchstart', stop, { passive: true });
    canvas.addEventListener('click', stop);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    function local(e) {
        const rc = canvas.getBoundingClientRect();
        const kx = rc.width ? cssW / rc.width : 1, ky = rc.height ? cssH / rc.height : 1;
        return { x: (e.clientX - rc.left) * kx, y: (e.clientY - rc.top) * ky };
    }
    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        if (drag) return;
        e.stopPropagation(); e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, moved: false };
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });
    // Curseur du dessin : doigt au-dessus d'un élément touchable, main pour faire défiler
    let _cur = '';
    function setCursor(c) { if (c !== _cur) { _cur = c; canvas.style.setProperty('cursor', c, 'important'); } }
    function hoverCursor(e) {
        if (drag) { setCursor(drag.moved && mode === 'comprendre' && view === 'globe' ? 'grabbing' : _cur || 'default'); return; }
        const L = local(e), x = L.x, y = L.y;
        let hit = false;
        if (mode === 'comprendre') hit = view === 'globe' ? !!gInv(x, y) : inMap(x, y);
        else if (mode === 'bataille') hit = !!(bat && !bat.over && inMap(x, y));
        else hit = !!(quiz && !quiz.done && !quiz.answered && quiz.q.type === 'place' && inMap(x, y));
        setCursor(hit ? 'pointer' : 'default');
    }
    canvas.addEventListener('pointermove', hoverCursor);
    canvas.addEventListener('pointerup', hoverCursor);
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) { drag.moved = true; drag.lx = e.clientX; drag.ly = e.clientY; }
        if (drag.moved && mode === 'comprendre' && view === 'globe') {
            rotTween = null; spin = false;
            const k = 90 / Math.max(80, G.R);
            lon0 = _gllWrap(lon0 - (e.clientX - drag.lx) * k);
            lat0 = Math.max(-80, Math.min(80, lat0 + (e.clientY - drag.ly) * k));
            drag.lx = e.clientX; drag.ly = e.clientY;
            refresh();
        }
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel') return;
        if (d.moved) { save(); return; }
        const L = local(e); onTap(L.x, L.y);
    }
    function onTap(x, y) {
        if (mode === 'comprendre') {
            let p = null;
            if (view === 'globe') p = gInv(x, y);
            else if (inMap(x, y)) p = mInv(x, y);
            if (p) { point = { lat: Math.round(p.lat), lon: _gllWrap(Math.round(p.lon)) }; placeIdx = -1; spin = false; }
            refresh(); save();
        } else if (mode === 'bataille') {
            if (!bat || bat.over || !inMap(x, y)) return;
            const p = mInv(x, y), s = bat.step;
            const la = Math.round(p.lat / s) * s, lo = _gllWrap(Math.round(p.lon / s) * s);
            if (Math.abs(la) > 75 || la === 90 || la === -90) return;
            bat.aimLat = Math.max(Math.min(...batLats(s)), Math.min(Math.max(...batLats(s)), la));
            bat.aimLon = lo === -180 ? 180 : lo;
            refresh(); save();
        } else {
            if (!quiz || quiz.done || quiz.answered || quiz.q.type !== 'place' || !inMap(x, y)) return;
            const p = mInv(x, y);
            answerPlace(Math.round(p.lat), _gllWrap(Math.round(p.lon)));
        }
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); }, { passive: true });
    });
    side.addEventListener('pointerdown', stop);
    side.addEventListener('mousedown', stop);
    side.addEventListener('touchstart', stop, { passive: true });
    side.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        e.stopPropagation();
        if (b.dataset.part) { const i = Number(b.dataset.part); part = part === i ? -1 : i; side.scrollTop = 0; }
        else if (b.dataset.place) {
            const i = Number(b.dataset.place), P = GLL_PLACES[i];
            placeIdx = i; point = { lat: P.lat, lon: P.lon, name: P.name };
            if (view === 'globe') rotateTo(P.lat, P.lon);
        }
        else if (b.dataset.action === 'overview') { part = -1; }
        else if (b.dataset.action === 'newbat') { newBattle(bat.step, bat.teams); }
        else if (b.dataset.action === 'reveal') { bat.reveal = !bat.reveal; }
        else if (b.dataset.bset) {
            const v = b.dataset.bset;
            if (v === 'step30' || v === 'step15') newBattle(v === 'step15' ? 15 : 30, bat.teams);
            else newBattle(bat.step, v === 'teams2' ? 2 : 1);
        }
        else if (b.dataset.choice) { answerRead(Number(b.dataset.choice)); return; }
        else if (b.dataset.action === 'newquiz') { newQuiz(); }
        refresh(); save();
    });
    header.querySelectorAll('.gll-tab').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setMode(b.dataset.mode); save(); }));
    row1.querySelectorAll('.gll-view').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; if (view !== 'globe') spin = false; refresh(); save(); }));
    spinBtn.addEventListener('click', () => { spin = !spin; rotTween = null; refresh(); save(); });
    franceBtn.addEventListener('click', () => { rotateTo(30, 10); save(); });
    row1.querySelectorAll('[data-aim]').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.aim;
        aimStep(a.slice(0, 3), a.endsWith('+') ? 1 : -1);
        save();
    }));
    fireBtn.addEventListener('click', fire);
    row1.querySelectorAll('.gll-level').forEach(b => b.addEventListener('click', () => { qLevel = b.dataset.level; newQuiz(); save(); }));
    row1.querySelectorAll('.gll-qtype').forEach(b => b.addEventListener('click', () => {
        const t = b.dataset.qtype;
        qTypes[t] = !qTypes[t];
        if (!qTypes.place && !qTypes.read) qTypes[t === 'place' ? 'read' : 'place'] = true;
        newQuiz(); save();
    }));
    qNextBtn.addEventListener('click', () => { if (quiz && quiz.done) newQuiz(); else nextQuestion(false); save(); });

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
            contW = Math.max(_minW(), w0 + ev.clientX - x0);
            contH = Math.max(_minH(), h0 + ev.clientY - y0);
            applySize();
        };
        const up = () => {
            resizeHandle.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up, true);
            window.removeEventListener('pointercancel', up, true);
            save();
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
            refresh();
        });
        ro.observe(sceneWrap);
    }

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin = header.querySelector('[data-role="wf-min"]');
    const wfMax = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        spin = false;
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🧭 Latitude et longitude', {
                onExpand: () => requestAnimationFrame(() => { applySize(); refresh(); })
            });
        }
    });
    wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        refresh();
    });
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        cleanup();
        widget.remove();
        save();
    });
    function cleanup() {
        if (animId) cancelAnimationFrame(animId);
        animId = null; spin = false;
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
    setMode('comprendre');

    // ── API pour save-load.js ─────────────────────────────────────────────
    // (la partie de bataille navale est sauvegardée ; le quiz recommence)
    widget._gllGetData = () => ({
        containerW: contW, containerH: contH,
        mode, view, lon0, lat0, part, placeIdx,
        point: point ? { lat: point.lat, lon: point.lon, name: point.name || '' } : null,
        bat: bat ? { step: bat.step, teams: bat.teams, ships: bat.ships, shots: bat.shots, turn: bat.turn, score: bat.score, nShots: bat.nShots, log: bat.log, msg: bat.msg, aimLat: bat.aimLat, aimLon: bat.aimLon, over: bat.over, reveal: bat.reveal } : null,
        qLevel, qTypes
    });
    widget._gllSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        view = d.view === 'carte' ? 'carte' : 'globe';
        if (typeof d.lon0 === 'number') lon0 = _gllWrap(d.lon0);
        if (typeof d.lat0 === 'number') lat0 = Math.max(-80, Math.min(80, d.lat0));
        part = typeof d.part === 'number' ? Math.max(-1, Math.min(GLL_PARTS.length - 1, d.part)) : -1;
        placeIdx = typeof d.placeIdx === 'number' ? d.placeIdx : -1;
        point = d.point && typeof d.point.lat === 'number' ? { lat: d.point.lat, lon: d.point.lon, name: d.point.name || undefined } : null;
        if (d.bat && Array.isArray(d.bat.ships)) {
            bat = Object.assign({ log: [], msg: { cls: 'info', html: '' }, score: [0, 0], nShots: [0, 0], shots: {} }, d.bat);
        }
        if (QCFG[d.qLevel]) qLevel = d.qLevel;
        if (d.qTypes) qTypes = { place: !!d.qTypes.place, read: !!d.qTypes.read };
        quiz = null;
        setMode(d.mode || 'comprendre');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_gllSetData');

    save();
    return widget;
}
