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
// WIDGET LE RELIEF DE MONTAGNE ET L'ÉTAGEMENT DE LA VÉGÉTATION — Le Bureau du Prof
// Pour des élèves de cycle 3 (CM1 – CM2 – 6e). Une montagne des Alpes en 3D,
// que l'on fait tourner avec le doigt ou le stylet. Deux onglets :
//  ⛰️ Le relief : sommet, col, versants, adret et ubac, vallée, rivière et
//     torrent, villages, courbes de niveau. Le bouton « 🗺️ Vue carte »
//     aplatit la montagne et la montre du dessus : on comprend comment les
//     courbes de niveau représentent le relief sur une carte.
//  🌲 L'étagement de la végétation : la montagne est colorée par étages
//     (collinéen, montagnard, subalpin, alpin, nival), avec les arbres.
//     Les étages montent plus haut sur l'adret que sur l'ubac. Le curseur
//     « 🥾 Randonneur » montre une altitude sur la montagne, la température
//     qu'il y fait et l'étage où l'on se trouve.
// On touche la montagne pour connaître l'altitude d'un point.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », boutons
// de grande taille, rien d'accessible uniquement au survol.
//
// Dépendances : widget-geo-monde.js chargé AVANT (style des boutons .wf-btn
//   et window._wfMiniBarCollapse). board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('grl-style')) return;
    const s = document.createElement('style');
    s.id = 'grl-style';
    s.textContent = `
        .widget[data-type="geo-relief"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .grl-container {
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
        .grl-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .grl-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .grl-header .wf-btns { gap: 8px; }
        .grl-header .wf-btn { width: 18px; height: 18px; }
        .grl-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .grl-container.wf-fullboard {
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
        .grl-tabs { display: inline-flex; background: #e6f0e6; border-radius: 11px; padding: 3px; gap: 3px; }
        .grl-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .grl-tab.on { background: #fff; color: #1f5f3a; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .grl-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .grl-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .grl-btn:hover { background: #e0e0e0; }
        .grl-btn:active { transform: scale(0.96); }
        .grl-btn.on { background: #2f6f47; color: #fff; border-color: #2f6f47; }
        .grl-btn-map.on { background: #1d4f86; border-color: #1d4f86; }
        .grl-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .grl-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .grl-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 320px; min-width: 220px; }
        .grl-slider { flex: 1; height: 30px; accent-color: #b45309; cursor: pointer; touch-action: none; }
        .grl-val { font-size: 13px; font-weight: 800; color: #92400e; min-width: 118px; text-align: right; white-space: nowrap; }

        /* Corps */
        .grl-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .grl-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #cfe6f5;
        }
        .grl-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }
        .grl-hint {
            position: absolute; left: 0; right: 0; bottom: 5px; text-align: center;
            font-size: 12px; color: rgba(30,40,50,.75); pointer-events: none;
            text-shadow: 0 0 3px rgba(255,255,255,.9);
        }
        .grl-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #2f6f47;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .grl-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .grl-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .grl-text { margin: 0 0 6px; }
        .grl-box { background: #eef4fb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d3f6e; }
        .grl-alt { background: #fdf3e2; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #7a4b12; font-weight: 700; }
        .grl-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .grl-facts { display: grid; gap: 4px; margin: 0 0 6px; }
        .grl-facts div { background: #f1f5f1; border-radius: 8px; padding: 5px 9px; }
        .grl-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .grl-list button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 6px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .grl-list button.on { background: var(--st-c, #2f6f47); color: #fff; }
        .grl-list .grl-small { font-weight: 600; opacity: .75; font-size: .9em; }
        .grl-go { width: 100%; min-height: 32px; border-radius: 8px; border: 1px solid #e0e3e8; background: #eef6ee; font-size: 13px; font-weight: 800; font-family: inherit; color: #1f5f3a; cursor: pointer; margin: 0 0 8px; touch-action: manipulation; }

        /* Aide */
        .grl-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .grl-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 390px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .grl-help-popup.show { display: block; }
        .grl-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .grl-help-popup p { margin: 0 0 6px; }

        .grl-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .grl-resize-handle:hover { opacity: 1; }
        .grl-container[data-mode="veg"] .grl-only-relief { display: none !important; }
        .grl-container[data-mode="relief"] .grl-only-veg { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .grl-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .grl-tab-short { display: none; }
        .grl-header { min-width: 0; max-width: 100%; }
        .grl-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .grl-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .grl-header .wf-btns { flex-shrink: 0; }
        .grl-container.wf-fullboard .grl-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .grl-container { padding: 10px 10px 8px; gap: 6px; }
            .grl-header { gap: 6px; }
            .grl-title { font-size: 13px; }
            .grl-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .grl-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .grl-row > * { flex-shrink: 0; }
            .grl-row + .grl-row { flex-wrap: wrap; overflow: visible; }
            .grl-slider-box { flex: 1 1 100%; min-width: 0; }
            .grl-val { min-width: 0; }
            .grl-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .grl-sep { display: none; }
            .grl-hint { display: none; }
            .grl-side { padding: 8px 10px; font-size: 13px; }
            .grl-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .grl-title { display: none; }
            .grl-tab { padding: 3px 7px; font-size: 11.5px; }
            .grl-tab-long { display: none; }
            .grl-tab-short { display: inline; }
            .grl-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .grl-body { flex-direction: column; }
            .grl-scene-wrap { flex: 1 1 0; min-height: 230px; }
            .grl-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 42%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .grl-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// =========================================================================
//  LE TERRAIN (calculé une seule fois)
//  Carré de 10 km de côté (x, y de −1 à 1 ; x vers l'est, y vers le nord).
//  Une vallée orientée ouest-est, un grand massif au nord (son versant sud
//  est l'adret) et un chaînon plus bas au sud (son versant nord est l'ubac).
// =========================================================================
const GRL_P1 = [0.18, 0.42], GRL_P2 = [-0.52, 0.30];
const _grlSS = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _grlY0 = x => -0.42 + 0.10 * Math.sin(1.6 * x + 0.4);       // axe de la vallée
function _grlH(x, y) {
    const dy = y - _grlY0(x), floor = 560 - 70 * x;                    // la rivière coule vers l'est
    const f = 1 - Math.exp(-((dy / 0.17) ** 2));                      // vallée en U
    let m = 0;
    if (dy > 0) m += 1100 * _grlSS(0, 0.9, dy);
    m += 1500 * Math.exp(-Math.hypot(x - GRL_P1[0], y - GRL_P1[1]) / 0.26);
    m += 1100 * Math.exp(-Math.hypot(x - GRL_P2[0], y - GRL_P2[1]) / 0.22);
    m += 450 * Math.exp(-(((y - 0.4) / 0.18) ** 2)) * _grlSS(-1.1, -0.7, x) * (1 - _grlSS(0.7, 1.1, x));
    if (dy < 0) m += 1300 * _grlSS(0, 0.55, -dy) * (0.85 + 0.15 * Math.sin(2.5 * x));
    m += 70 * (Math.sin(5 * x + 1.3) * Math.sin(4.3 * y) + 0.5 * Math.sin(11 * x - 2 * y) * Math.sin(9 * y + x));
    return floor + f * m;
}
const GRL_N = 61;                         // sommets par côté
const GRL_C = GRL_N - 1;                  // cases par côté
const GRL_STEP = 2 / GRL_C;
const GRL_ZS = 1.45;                      // exagération verticale à l'affichage
const GRL_KM = 0.2;                       // 1 km = 0,2 unité (carré de 10 km)
const GRL_LEVELS = [];
for (let l = 750; l <= 3500; l += 250) GRL_LEVELS.push(l);

// Les étages de végétation (limites sur l'ubac ; environ 250 m plus haut sur l'adret)
const GRL_ADRET_SHIFT = 250;
const GRL_ETAGES = [
    { id: 'collineen', name: 'Étage collinéen', ico: '🌳', color: '#b9d77a', dark: '#5f8a2a', lo: 0, hi: 900,
      alt: 'Jusqu\'à 900 m environ (vers 1 150 m sur l\'adret)',
      veg: 'Forêts de feuillus (chênes, châtaigniers, noyers), prairies, vergers, vignes et cultures.',
      ani: 'Chevreuil, renard, sanglier, hérisson.',
      hom: 'Les villes, les villages, les routes, les usines, les champs.',
      know: 'C\'est l\'étage où vivent presque tous les habitants des Alpes. En Savoie, les vignes de la Combe de Savoie poussent sur l\'adret, au pied du massif des Bauges.' },
    { id: 'montagnard', name: 'Étage montagnard', ico: '🌲', color: '#62a454', dark: '#2f6b2a', lo: 900, hi: 1600,
      alt: 'De 900 à 1 600 m environ (un peu plus haut sur l\'adret)',
      veg: 'Forêts de hêtres et de sapins, puis d\'épicéas ; prés de fauche.',
      ani: 'Cerf, écureuil, chouette, pic noir.',
      hom: 'Villages, fermes, prés où l\'on fait le foin pour l\'hiver, exploitation du bois.',
      know: 'Le hêtre, un arbre à feuilles, n\'aime pas le grand froid : il disparaît en haut de l\'étage montagnard et laisse la place aux conifères.' },
    { id: 'subalpin', name: 'Étage subalpin', ico: '🌲', color: '#2f6f47', dark: '#173d26', lo: 1600, hi: 2200,
      alt: 'De 1 600 à 2 200 m environ (un peu plus haut sur l\'adret)',
      veg: 'Forêts de conifères : épicéas, mélèzes, pins cembro. Plus haut, les arbres se font rares : c\'est la limite de la forêt. Rhododendrons, myrtilles.',
      ani: 'Chamois, tétras-lyre, casse-noix moucheté.',
      hom: 'Stations de ski, chalets d\'alpage.',
      know: 'Le mélèze est le seul conifère d\'Europe qui perd ses aiguilles en hiver : en automne, il devient tout jaune !' },
    { id: 'alpin', name: 'Étage alpin', ico: '🌼', color: '#cdd78f', dark: '#7d8a2e', lo: 2200, hi: 3000,
      alt: 'De 2 200 à 3 000 m environ',
      veg: 'Plus d\'arbres : il fait trop froid et le vent est trop fort. Pelouses alpines, fleurs (gentiane, edelweiss, arnica), mousses.',
      ani: 'Marmotte, bouquetin, chamois, lagopède, aigle royal.',
      hom: 'Les alpages : en été, les troupeaux de vaches et de moutons montent y brouter l\'herbe. En hiver, des pistes de ski.',
      know: 'Les marmottes passent l\'hiver à dormir dans leur terrier : elles hibernent pendant environ 6 mois !' },
    { id: 'nival', name: 'Étage nival', ico: '❄️', color: '#f2f5f8', dark: '#64748b', lo: 3000, hi: 99999,
      alt: 'Au-dessus de 3 000 m environ',
      veg: 'Neiges éternelles, glaciers et rochers. Seuls quelques lichens et mousses poussent sur les rochers.',
      ani: 'Chocard à bec jaune ; le bouquetin y monte parfois.',
      hom: 'Les alpinistes et les refuges de haute montagne.',
      know: 'À cause du réchauffement climatique, les glaciers des Alpes fondent et reculent de plusieurs mètres chaque année.' }
];
function _grlEtageIdx(hEff) {
    for (let i = 0; i < GRL_ETAGES.length; i++) if (hEff < GRL_ETAGES[i].hi) return i;
    return GRL_ETAGES.length - 1;
}
const _grlTemp = a => 22 - 0.6 * (a - 500) / 100;              // 22 °C au fond de la vallée (500 m)

// Les parties du relief : lx, ly = point visé (calculé), dx, dy = décalage de l'étiquette
const GRL_PARTS = [
    { id: 'sommet', ico: '⛰️', name: 'Sommet', color: '#7c3aed',
      text: 'Le <b>sommet</b> est le point le plus haut d\'une montagne. Ici, le plus haut sommet culmine à environ <b>3 600 m</b> d\'altitude. Les plus hauts sommets sont couverts de <b>neige</b> et de <b>glaciers</b> toute l\'année.',
      know: 'Le plus haut sommet de la Savoie est la <b>Grande Casse</b> (3 855 m), dans le massif de la Vanoise. Le <b>mont Blanc</b> (environ 4 805 m), en Haute-Savoie, est le plus haut sommet des Alpes.' },
    { id: 'col', ico: '🛣️', name: 'Col', color: '#b45309',
      text: 'Un <b>col</b> est un <b>passage entre deux sommets</b> : c\'est le point le plus bas de la ligne de crête qui les relie. Les routes et les sentiers passent par les cols pour franchir les montagnes.',
      know: 'Le <b>col de l\'Iseran</b> (2 764 m), en Savoie, relie la Maurienne et la Tarentaise. C\'est l\'un des plus hauts cols routiers des Alpes : il est fermé tout l\'hiver à cause de la neige.' },
    { id: 'versant', ico: '📐', name: 'Versant', color: '#0f766e',
      text: 'Un <b>versant</b> est une <b>pente</b> de la montagne, entre la crête (en haut) et la vallée (en bas). Une montagne a plusieurs versants. Plus les courbes de niveau sont <b>serrées</b>, plus le versant est <b>raide</b>.',
      know: 'L\'eau de pluie qui tombe sur un versant descend vers la vallée. La ligne de crête partage les eaux entre deux vallées.' },
    { id: 'adret', ico: '☀️', name: 'Adret', color: '#d97706',
      text: 'L\'<b>adret</b> est le versant tourné vers le <b>sud</b> : il est <b>ensoleillé</b> une grande partie de la journée. Il y fait plus chaud et la neige y fond plus vite. C\'est là que les hommes ont construit la plupart des <b>villages</b>, des champs et des vignes.',
      know: 'Le mot « adret » vient d\'un vieux mot des Alpes qui veut dire « bien exposé, face au soleil ».' },
    { id: 'ubac', ico: '🌑', name: 'Ubac', color: '#1e40af',
      text: 'L\'<b>ubac</b> est le versant tourné vers le <b>nord</b> : il reste longtemps à l\'<b>ombre</b>. Il y fait plus froid et plus humide, et la neige y reste plus longtemps. Il est souvent couvert de <b>forêts</b> et on y trouve peu d\'habitations. Les pistes de ski y gardent mieux la neige.',
      know: 'Le mot « ubac » vient du latin <i>opacus</i>, qui veut dire « sombre, à l\'ombre ».' },
    { id: 'vallee', ico: '🏞️', name: 'Vallée', color: '#15803d',
      text: 'Une <b>vallée</b> est un creux allongé entre deux versants, où coule une rivière. Dans les Alpes, beaucoup de vallées ont été creusées par d\'immenses <b>glaciers</b> il y a des milliers d\'années : elles ont une forme en <b>U</b>, avec un fond plat. C\'est au fond des vallées que passent les routes et les voies ferrées et que se trouvent les villes.',
      know: 'En Savoie, les deux grandes vallées sont la <b>Maurienne</b>, où coule l\'Arc, et la <b>Tarentaise</b>, où coule l\'Isère.' },
    { id: 'riviere', ico: '💧', name: 'Rivière et torrent', color: '#0284c7',
      text: 'L\'eau coule toujours de l\'<b>amont</b> (en haut) vers l\'<b>aval</b> (en bas). En montagne, les petits cours d\'eau très pentus sont des <b>torrents</b> : ils descendent les versants et rejoignent la <b>rivière</b>, au fond de la vallée. L\'eau vient de la pluie, mais aussi de la <b>fonte des neiges et des glaciers</b>.',
      know: 'L\'eau des montagnes est retenue par des <b>barrages</b> pour produire de l\'électricité : c\'est l\'hydroélectricité. Il y en a beaucoup en Savoie.' },
    { id: 'village', ico: '🏘️', name: 'Villages', color: '#be123c',
      text: 'Les hommes s\'installent surtout au <b>fond des vallées</b> (c\'est plat, près de l\'eau et des routes) et sur l\'<b>adret</b>, plus ensoleillé. Plus haut, on trouve des <b>chalets d\'alpage</b>, habités l\'été par les bergers, et des <b>stations de ski</b>.',
      know: 'Certaines stations de ski de Savoie ont été construites très haut : Val Thorens, à 2 300 m, est l\'une des plus hautes stations d\'Europe.' },
    { id: 'courbes', ico: '〰️', name: 'Courbes de niveau', color: '#92400e',
      text: 'Une <b>courbe de niveau</b> est une ligne qui relie tous les points situés à la <b>même altitude</b>. Ici, il y a une courbe tous les <b>250 m</b> (c\'est l\'équidistance) ; les courbes plus épaisses sont tous les 1 000 m.',
      extra: 'courbes',
      know: 'Sur les cartes de randonnée de l\'IGN, il y a une courbe de niveau tous les <b>10 mètres</b> d\'altitude !' }
];
const GRL_PI = {};
GRL_PARTS.forEach((p, i) => { GRL_PI[p.id] = i; });

// ── Précalculs : altitudes, couleurs, courbes de niveau, rivière, arbres ──
const GRL = (function () {
    const N = GRL_N, C = GRL_C, NV = N * N, NC = C * C;
    const vx = new Float32Array(NV), vy = new Float32Array(NV), vh = new Float32Array(NV);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = j * N + i, x = -1 + i * GRL_STEP, y = -1 + j * GRL_STEP;
        vx[k] = x; vy[k] = y; vh[k] = _grlH(x, y);
    }
    const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const NAT = [[400, '#9ccc72'], [900, '#7fb85e'], [1500, '#5c9a4c'], [1900, '#4f8a45'], [2200, '#a9c271'], [2600, '#bdb48c'], [2950, '#a69c93'], [3080, '#e9edf2'], [3700, '#ffffff']].map(s => [s[0], hex(s[1])]);
    const natColor = h => {
        for (let i = 1; i < NAT.length; i++) if (h <= NAT[i][0]) return mix(NAT[i - 1][1], NAT[i][1], (h - NAT[i - 1][0]) / (NAT[i][0] - NAT[i - 1][0]));
        return NAT[NAT.length - 1][1];
    };
    const ROCK = hex('#9b948b'), SNOW = hex('#f4f7fa');
    const L = (() => { const v = [0.35, -0.75, 0.8], n = Math.hypot(...v); return v.map(c => c / n); })();
    const shade = new Float32Array(NC), cH = new Float32Array(NC), cEt = new Uint8Array(NC), slopeDeg = new Float32Array(NC), sunny = new Float32Array(NC);
    const colRel = [], colVeg = [];
    const mPerUnit = 5000;
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
        const c = j * C + i, a = j * N + i;
        const h00 = vh[a], h10 = vh[a + 1], h01 = vh[a + N], h11 = vh[a + N + 1];
        const hm = (h00 + h10 + h01 + h11) / 4;
        const dhdx = ((h10 + h11) - (h00 + h01)) / 2 / GRL_STEP;     // m par unité
        const dhdy = ((h01 + h11) - (h00 + h10)) / 2 / GRL_STEP;
        const g = Math.hypot(dhdx, dhdy) / mPerUnit;
        slopeDeg[c] = Math.atan(g) * 180 / Math.PI;
        const k = GRL_ZS / 3200;                                        // affichage
        const nx = -dhdx * k, ny = -dhdy * k, nz = 1, nn = Math.hypot(nx, ny, nz);
        shade[c] = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / nn);
        cH[c] = hm;
        // exposition au sud : 1 = plein sud, −1 = plein nord (pondéré par la pente)
        const s = Math.hypot(dhdx, dhdy) > 1 ? dhdy / Math.hypot(dhdx, dhdy) : 0;
        sunny[c] = Math.max(-1, Math.min(1, s)) * Math.min(1, g * 2.2);
        // Relief : couleurs naturelles, rochers sur les fortes pentes, neige en haut
        let col = natColor(hm);
        if (slopeDeg[c] > 33 && hm > 1500) col = mix(col, ROCK, Math.min(1, (slopeDeg[c] - 33) / 14));
        if (hm > 3050 && slopeDeg[c] < 48) col = mix(col, SNOW, Math.min(1, (hm - 3050) / 120));
        colRel.push(col);
        // Végétation : étages, plus hauts sur l'adret
        const jitter = 45 * Math.sin(i * 1.7 + j * 0.9) * Math.cos(i * 0.6 - j * 1.3);
        const hEff = hm - GRL_ADRET_SHIFT * sunny[c] + jitter;
        const e = _grlEtageIdx(hEff);
        cEt[c] = e;
        let vc = hex(GRL_ETAGES[e].color);
        if (e >= 3 && slopeDeg[c] > 36) vc = mix(vc, ROCK, Math.min(1, (slopeDeg[c] - 36) / 12));
        colVeg.push(vc);
    }

    // Courbes de niveau (marching squares) : segments rangés par case
    const EP = [[3, 0], [0, 1], [3, 1], [1, 2], null, [0, 2], [2, 3], [2, 3], [0, 2], null, [1, 2], [3, 1], [0, 1], [3, 0]];
    function cellContour(i, j, lev) {
        const a = j * N + i, x0 = -1 + i * GRL_STEP, y0 = -1 + j * GRL_STEP, x1 = x0 + GRL_STEP, y1 = y0 + GRL_STEP;
        const v00 = vh[a], v10 = vh[a + 1], v01 = vh[a + N], v11 = vh[a + N + 1];
        const idx = (v00 > lev ? 1 : 0) | (v10 > lev ? 2 : 0) | (v11 > lev ? 4 : 0) | (v01 > lev ? 8 : 0);
        if (idx === 0 || idx === 15) return null;
        const ip = (xa, ya, va, xb, yb, vb) => { const t = (lev - va) / (vb - va); return [xa + (xb - xa) * t, ya + (yb - ya) * t]; };
        const E = e => e === 0 ? ip(x0, y0, v00, x1, y0, v10) : e === 1 ? ip(x1, y0, v10, x1, y1, v11)
            : e === 2 ? ip(x0, y1, v01, x1, y1, v11) : ip(x0, y0, v00, x0, y1, v01);
        let pairs;
        if (idx === 5 || idx === 10) {
            const up = (v00 + v10 + v01 + v11) / 4 > lev;
            pairs = idx === 5 ? (up ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]) : (up ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]]);
        } else pairs = [EP[idx - 1]];
        return pairs.map(p => { const A = E(p[0]), B = E(p[1]); return [A[0], A[1], B[0], B[1]]; });
    }
    const contours = [];                  // contours[c] = [[x1, y1, x2, y2, level], …]
    for (let c = 0; c < NC; c++) contours.push([]);
    for (const lev of GRL_LEVELS) for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
        const s = cellContour(i, j, lev);
        if (s) s.forEach(seg => contours[j * C + i].push([seg[0], seg[1], seg[2], seg[3], lev]));
    }
    // Étiquettes d'altitude des courbes (une par niveau multiple de 500 m, plus sur l'ubac)
    const contourLabels = [];
    const pickLabel = (lev, rx, ry) => {
        let best = null, bd = 1e9;
        for (let c = 0; c < NC; c++) for (const s of contours[c]) {
            if (s[4] !== lev) continue;
            const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2, d = Math.hypot(mx - rx, my - ry);
            if (d < bd) { bd = d; best = { x: mx, y: my, lev, c }; }
        }
        if (best && bd < 0.35) contourLabels.push(best);
    };
    for (const lev of [1000, 1500, 2000, 2500, 3000, 3500]) pickLabel(lev, 0.62, 0.1);
    for (const lev of [1000, 1500]) pickLabel(lev, 0.15, -0.82);

    const cellOf = (x, y) => {
        const i = Math.max(0, Math.min(C - 1, Math.floor((x + 1) / GRL_STEP))), j = Math.max(0, Math.min(C - 1, Math.floor((y + 1) / GRL_STEP)));
        return j * C + i;
    };
    // Rivière (fond de vallée) et torrent (descend du col sur l'adret)
    const water = [];
    for (let c = 0; c < NC; c++) water.push([]);
    for (let x = -1; x < 0.999; x += 0.02) {
        const xa = x, xb = Math.min(1, x + 0.02);
        water[cellOf((xa + xb) / 2, (_grlY0(xa) + _grlY0(xb)) / 2)].push([xa, _grlY0(xa), xb, _grlY0(xb), 3.2]);
    }
    // col : le point le plus bas entre les deux sommets
    let col = null;
    for (let t = 0; t <= 1; t += 0.005) {
        const x = GRL_P2[0] + (GRL_P1[0] - GRL_P2[0]) * t, y = GRL_P2[1] + (GRL_P1[1] - GRL_P2[1]) * t, h = _grlH(x, y);
        if (!col || h < col.h) col = { x, y, h };
    }
    // vrai sommet (maximum local près de P1)
    let top = { x: GRL_P1[0], y: GRL_P1[1], h: _grlH(GRL_P1[0], GRL_P1[1]) };
    for (let dx = -0.05; dx <= 0.05; dx += 0.005) for (let dy = -0.05; dy <= 0.05; dy += 0.005) {
        const h = _grlH(GRL_P1[0] + dx, GRL_P1[1] + dy);
        if (h > top.h) top = { x: GRL_P1[0] + dx, y: GRL_P1[1] + dy, h };
    }
    {   // le torrent suit la plus grande pente depuis le col, jusqu'à la rivière
        let x = col.x, y = col.y - 0.03;
        for (let k = 0; k < 400; k++) {
            if (Math.abs(y - _grlY0(x)) < 0.02) break;
            const e = 0.004, gx = (_grlH(x + e, y) - _grlH(x - e, y)) / (2 * e), gy = (_grlH(x, y + e) - _grlH(x, y - e)) / (2 * e), g = Math.hypot(gx, gy) || 1;
            const nx = x - gx / g * 0.012, ny = y - gy / g * 0.012;
            water[cellOf((x + nx) / 2, (y + ny) / 2)].push([x, y, nx, ny, 2]);
            x = nx; y = ny;
        }
    }
    // Arbres (onglet végétation) et maisons
    const rnd = (i, j, s) => { const v = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
    const trees = [];
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
        const c = j * C + i, e = cEt[c];
        const x = -1 + (i + 0.2 + 0.6 * rnd(i, j, 1)) * GRL_STEP, y = -1 + (j + 0.2 + 0.6 * rnd(i, j, 2)) * GRL_STEP;
        if (Math.abs(y - _grlY0(x)) < 0.07 || slopeDeg[c] > 40) continue;
        const r = rnd(i, j, 3);
        let kind = null;
        if (e === 0 && r < 0.22) kind = 'feuillu';
        else if (e === 1 && r < 0.5) kind = rnd(i, j, 4) < 0.5 ? 'hetre' : 'sapin';
        else if (e === 2) {
            const hEff = cH[c] - GRL_ADRET_SHIFT * sunny[c];
            const dens = 0.55 * Math.max(0.15, Math.min(1, (2250 - hEff) / 450));
            if (r < dens) kind = rnd(i, j, 4) < 0.35 ? 'meleze' : 'sapin';
        }
        if (kind) trees.push({ x, y, h: _grlH(x, y), kind, c });
    }
    const houses = [];
    const addHouse = (x, y) => houses.push({ x, y, h: _grlH(x, y), c: cellOf(x, y) });
    for (const [x, o] of [[0.16, 0.035], [0.21, 0.05], [0.26, 0.03], [0.22, 0.085], [0.30, 0.06], [0.12, 0.07]]) addHouse(x, _grlY0(x) + o);
    for (const [x, o] of [[-0.18, 0.2], [-0.13, 0.215], [-0.15, 0.245], [-0.09, 0.2]]) addHouse(x, _grlY0(x) + o);
    addHouse(0.58, _grlY0(0.58) + 0.36);                                  // chalet d'alpage

    // Points visés par les étiquettes du relief
    const anchors = {
        sommet: [top.x, top.y], col: [col.x, col.y], versant: [0.55, 0.47],
        adret: [0.38, -0.12], ubac: [-0.2, -0.72], vallee: [-0.55, _grlY0(-0.55)],
        riviere: [0.62, _grlY0(0.62)], village: [0.21, _grlY0(0.21) + 0.05], courbes: null
    };
    {   // un point de la courbe des 2 000 m sur l'adret
        let lo = _grlY0(0.62), hi = 0.5;
        for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (_grlH(0.62, m) < 2000) lo = m; else hi = m; }
        anchors.courbes = [0.62, lo];
    }
    return { vx, vy, vh, shade, cH, cEt, slopeDeg, sunny, colRel, colVeg, contours, contourLabels, water, trees, houses, anchors, col, top, cellOf, cellContour };
})();

// ── Création du widget ────────────────────────────────────────────────────
function createGeoReliefWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-relief';
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
    container.className = 'grl-container';
    container.dataset.mode = 'relief';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(820, Math.min(1240, Math.round(window.innerWidth * 0.72)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.round(contW * 0.64));

    const header = document.createElement('div');
    header.className = 'grl-header';
    header.innerHTML = `
        <span class="grl-title">⛰️<span> La montagne</span></span>
        <div class="grl-tabs">
            <button class="grl-tab on" data-mode="relief" title="Le relief de montagne"><span class="grl-tab-long">⛰️ Le relief</span><span class="grl-tab-short">⛰️ Relief</span></button>
            <button class="grl-tab" data-mode="veg" title="L'étagement de la végétation"><span class="grl-tab-long">🌲 L'étagement de la végétation</span><span class="grl-tab-short">🌲 Végétation</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'grl-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    const row1 = document.createElement('div');
    row1.className = 'grl-row';
    row1.innerHTML = `
        <button class="grl-btn grl-btn-map" title="Voir la montagne du dessus, comme sur une carte">🗺️ Vue carte</button>
        <button class="grl-btn grl-contours on" title="Afficher les courbes de niveau">〰️ Courbes de niveau</button>
        <button class="grl-btn grl-labels grl-only-relief on" title="Afficher les noms">🏷️ Étiquettes</button>
        <span class="grl-sep"></span>
        <button class="grl-btn grl-spin" title="Faire tourner la montagne toute seule">🔄 Tourner</button>
        <button class="grl-btn grl-reset" title="Revenir à la vue de départ">🎯 Vue de départ</button>
    `;
    container.appendChild(row1);
    const row2 = document.createElement('div');
    row2.className = 'grl-row grl-only-veg';
    row2.innerHTML = `
        <div class="grl-slider-box">
            <span class="grl-lbl">🥾 Randonneur :</span>
            <input type="range" class="grl-slider grl-alt-sl" min="500" max="3600" step="50" value="1200" aria-label="Altitude du randonneur">
            <span class="grl-val grl-alt-val"></span>
        </div>
    `;
    container.appendChild(row2);

    const body = document.createElement('div');
    body.className = 'grl-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'grl-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'grl-canvas';
    const hint = document.createElement('div');
    hint.className = 'grl-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'grl-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'grl-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La montagne : relief et végétation</h4>
        <p><b>Fais glisser</b> la montagne avec le doigt ou le stylet pour la faire tourner (gauche-droite) ou la
        regarder de plus haut (haut-bas). <b>🔄 Tourner</b> la fait tourner toute seule, <b>🎯 Vue de départ</b> la remet en place.</p>
        <p><b>⛰️ Le relief</b> : touche une étiquette pour afficher sa fiche. <b>Touche la montagne</b> pour connaître
        l'altitude d'un point. <b>🗺️ Vue carte</b> aplatit la montagne et la montre du dessus : le relief n'est plus
        représenté que par les courbes de niveau et les couleurs.</p>
        <p><b>🌲 L'étagement de la végétation</b> : chaque couleur est un étage. Touche un étage dans l'échelle à gauche
        ou sur la montagne. Le curseur <b>🥾 Randonneur</b> montre une altitude sur la montagne (ligne jaune), la température
        qu'il y fait et l'étage où l'on se trouve.</p>
        <p style="color:#888">Montagne imaginaire (10 km × 10 km) inspirée des vallées de Savoie ; le relief est
        légèrement exagéré en hauteur pour mieux le voir. Le soleil vient du sud.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'grl-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const mapBtn = $('.grl-btn-map'), contoursBtn = $('.grl-contours'), labelsBtn = $('.grl-labels');
    const spinBtn = $('.grl-spin'), resetBtn = $('.grl-reset'), altSl = $('.grl-alt-sl'), altVal = $('.grl-alt-val');

    // ── État ──────────────────────────────────────────────────────────────
    const YAW0 = -1.15, ELEV0 = 30 * Math.PI / 180;     // on regarde la vallée depuis l'est
    let mode = 'relief';
    let yaw = YAW0, elev = ELEV0;
    let tween = null;                    // { yaw, elev } cible de la vue de départ
    let mapT = 0, mapTarget = 0;
    let showContours = true, showLabels = true, spin = false;
    let selPart = -1, selEt = -1;
    let hiker = 1200, hikerSegs = null;
    let pin = null;                      // point touché { x, y, h }
    let animId = null, lastT = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let sc = 1, cx0 = 0, cy0 = 0;
    const PX = new Float32Array(GRL_N * GRL_N), PY = new Float32Array(GRL_N * GRL_N), PD = new Float32Array(GRL_N * GRL_N);
    let order = [], labelHits = [], legendHits = [];
    let cosY = 1, sinY = 0, cosE = 1, sinE = 0, flat = 1;

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
    const fmtAlt = h => Math.round(h).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' m';
    const fmtT = t => (Math.round(t * 10) / 10).toLocaleString('fr-FR') + ' °C';
    const legendW = () => mode === 'veg' ? Math.min(150, Math.max(96, cssW * 0.17)) : 0;

    // ── Projection ────────────────────────────────────────────────────────
    function setView() {
        const yv = yaw * (1 - mapT) + nearestZero(yaw) * mapT;
        const ev = elev * (1 - mapT) + (Math.PI / 2) * mapT;
        cosY = Math.cos(yv); sinY = Math.sin(yv); cosE = Math.cos(ev); sinE = Math.sin(ev);
        flat = 1 - mapT;
        const lw = legendW(), W = cssW - lw, R = Math.SQRT2;
        const vSpan = 2 * R * sinE + GRL_ZS * cosE * flat;
        const sc3d = Math.min(W * 0.94 / (2 * R), cssH * 0.9 / vSpan);
        const scMap = Math.min(W * 0.94, cssH * 0.92) / 2;          // vue carte : le carré entier, nord en haut
        sc = sc3d * (1 - mapT) + scMap * mapT;
        cx0 = lw + W / 2;
        cy0 = cssH / 2 + sc * GRL_ZS * cosE * flat / 2;
    }
    function nearestZero(a) { return Math.round(a / (2 * Math.PI)) * 2 * Math.PI; }
    const zOf = h => (h - 400) / 3200 * GRL_ZS * flat;
    function proj(x, y, h) {
        const xr = x * cosY - y * sinY, yr = x * sinY + y * cosY, z = zOf(h);
        return [cx0 + xr * sc, cy0 - yr * sinE * sc - z * cosE * sc, yr * cosE - z * sinE];
    }
    function projectAll() {
        const NV = GRL_N * GRL_N;
        for (let k = 0; k < NV; k++) {
            const x = GRL.vx[k], y = GRL.vy[k], z = zOf(GRL.vh[k]);
            const xr = x * cosY - y * sinY, yr = x * sinY + y * cosY;
            PX[k] = cx0 + xr * sc; PY[k] = cy0 - yr * sinE * sc - z * cosE * sc; PD[k] = yr * cosE - z * sinE;
        }
    }

    // =====================================================================
    //  DESSIN
    // =====================================================================
    function drawSky() {
        const g = ctx.createLinearGradient(0, 0, 0, cssH);
        g.addColorStop(0, '#7db7e6'); g.addColorStop(1, '#e3f1fa');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH);
        if (mapT > 0) { ctx.globalAlpha = mapT; ctx.fillStyle = '#f6f3ea'; ctx.fillRect(0, 0, cssW, cssH); ctx.globalAlpha = 1; }
        // Le soleil, au sud
        if (mapT < 0.6) {
            const p = proj(0, -2.4, 6200);
            const x = Math.max(legendW() + 52, Math.min(cssW - 52, p[0])), y = Math.max(28, Math.min(cssH * 0.3, p[1]));
            ctx.globalAlpha = 1 - mapT / 0.6;
            const gl = ctx.createRadialGradient(x, y, 0, x, y, 44);
            gl.addColorStop(0, 'rgba(255,236,150,0.95)'); gl.addColorStop(1, 'rgba(255,236,150,0)');
            ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 44, 0, 2 * Math.PI); ctx.fill();
            ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x, y, 16, 0, 2 * Math.PI); ctx.fill();
            ctx.font = '800 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#92400e'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('Soleil (au sud)', x, y + 22);
            ctx.globalAlpha = 1;
        }
    }

    function drawTree(t, x, y, s) {
        if (mapT > 0.5) {                     // vue de dessus : un rond (symbole de carte)
            const col = t.kind === 'feuillu' ? '#4f8f2f' : t.kind === 'hetre' ? '#3f7f2f' : t.kind === 'meleze' ? '#5f7f2a' : '#1f5a35';
            ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, 2 * Math.PI); ctx.fill();
            return;
        }
        ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - s * 0.06, y - s * 0.3, s * 0.12, s * 0.3);
        if (t.kind === 'feuillu' || t.kind === 'hetre') {
            ctx.fillStyle = t.kind === 'feuillu' ? '#6fae3f' : '#4c8f35';
            ctx.beginPath(); ctx.arc(x, y - s * 0.55, s * 0.32, 0, 2 * Math.PI); ctx.fill();
        } else {
            ctx.fillStyle = t.kind === 'meleze' ? '#6e9a3a' : '#1f5a35';
            ctx.beginPath(); ctx.moveTo(x, y - s * 1.15); ctx.lineTo(x + s * 0.3, y - s * 0.22); ctx.lineTo(x - s * 0.3, y - s * 0.22); ctx.closePath(); ctx.fill();
        }
    }
    function drawHouse(x, y, s) {
        if (mapT > 0.5) { ctx.fillStyle = '#4b2e2e'; ctx.fillRect(x - s * 0.22, y - s * 0.22, s * 0.44, s * 0.44); return; }
        ctx.fillStyle = '#fff7ea'; ctx.fillRect(x - s * 0.3, y - s * 0.45, s * 0.6, s * 0.45);
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.8; ctx.strokeRect(x - s * 0.3, y - s * 0.45, s * 0.6, s * 0.45);
        ctx.fillStyle = '#b5442f';
        ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.43); ctx.lineTo(x, y - s * 0.75); ctx.lineTo(x + s * 0.4, y - s * 0.43); ctx.closePath(); ctx.fill();
    }

    function drawTerrain() {
        const C = GRL_C, N = GRL_N, NC = C * C;
        const veg = mode === 'veg';
        const cols = veg ? GRL.colVeg : GRL.colRel;
        // Liste des choses à dessiner, de la plus lointaine à la plus proche
        const items = [];
        for (let c = 0; c < NC; c++) {
            const i = c % C, j = (c - i) / C, a = j * N + i;
            items.push([(PD[a] + PD[a + 1] + PD[a + N] + PD[a + N + 1]) / 4, 0, c]);
        }
        const sprite = (list, type) => list.forEach((t, k) => { const p = proj(t.x, t.y, t.h); items.push([p[2] - 0.004, type, k]); });
        if (veg) sprite(GRL.trees, 1);
        sprite(GRL.houses, 2);
        items.sort((A, B) => B[0] - A[0]);
        order = items;

        const hillK = 1 - mapT * 0.55;
        const spr = sc * 0.05;
        const selE = veg ? selEt : -1;
        for (const it of items) {
            if (it[1] === 0) {
                const c = it[2], i = c % C, j = (c - i) / C, a = j * N + i;
                const col = cols[c], s = 0.42 + 0.58 * (1 - (1 - GRL.shade[c]) * hillK) + (1 - hillK) * 0.0;
                const k = Math.min(1.08, s * 1.05);
                let r = col[0] * k, g = col[1] * k, b = col[2] * k;
                if (selE >= 0 && GRL.cEt[c] !== selE) { r = r * 0.55 + 90; g = g * 0.55 + 90; b = b * 0.55 + 90; }
                const fs = `rgb(${r | 0},${g | 0},${b | 0})`;
                ctx.beginPath();
                ctx.moveTo(PX[a], PY[a]); ctx.lineTo(PX[a + 1], PY[a + 1]); ctx.lineTo(PX[a + N + 1], PY[a + N + 1]); ctx.lineTo(PX[a + N], PY[a + N]);
                ctx.closePath();
                ctx.fillStyle = fs; ctx.fill();
                ctx.strokeStyle = fs; ctx.lineWidth = 0.7; ctx.stroke();
                // eau
                for (const w of GRL.water[c]) {
                    const p1 = proj(w[0], w[1], _grlH(w[0], w[1]) + 8), p2 = proj(w[2], w[3], _grlH(w[2], w[3]) + 8);
                    ctx.strokeStyle = '#2b8fd6'; ctx.lineWidth = w[4] * Math.max(0.7, sc / 260); ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
                }
                // courbes de niveau
                if (showContours) for (const s2 of GRL.contours[c]) {
                    const master = s2[4] % 1000 === 0;
                    const p1 = proj(s2[0], s2[1], s2[4]), p2 = proj(s2[2], s2[3], s2[4]);
                    ctx.strokeStyle = master ? 'rgba(110,60,20,0.95)' : 'rgba(110,60,20,0.55)';
                    ctx.lineWidth = master ? 2 : 1; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
                }
                // ligne du randonneur
                if (veg && hikerSegs && hikerSegs[c]) for (const s2 of hikerSegs[c]) {
                    const p1 = proj(s2[0], s2[1], hiker + 5), p2 = proj(s2[2], s2[3], hiker + 5);
                    ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
                }
            } else if (it[1] === 1) {
                const t = GRL.trees[it[2]], p = proj(t.x, t.y, t.h);
                drawTree(t, p[0], p[1], spr * (t.kind === 'feuillu' ? 0.9 : 1));
            } else if (it[1] === 2) {
                const h = GRL.houses[it[2]], p = proj(h.x, h.y, h.h);
                drawHouse(p[0], p[1], spr * 0.95);
            }
        }
        // Altitudes des courbes : seulement celles qui ne sont pas cachées par la montagne
        if (showContours) {
            ctx.font = `800 ${Math.max(10, Math.min(13, sc / 30))}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (const l of GRL.contourLabels) {
                const p = proj(l.x, l.y, l.lev), q = pick(p[0], p[1]);
                if (!q || Math.hypot(q.x - l.x, q.y - l.y) > 0.07) continue;
                ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.strokeText(String(l.lev), p[0], p[1]);
                ctx.fillStyle = '#6e3c14'; ctx.fillText(String(l.lev), p[0], p[1]);
            }
        }
    }

    function drawLabels() {
        labelHits = [];
        if (mode !== 'relief' || !showLabels) return;
        const fs = Math.max(cssW < 520 ? 9 : 11, Math.min(15, cssW / 64));
        const placed = [];
        const order2 = GRL_PARTS.map((p, i) => i);
        for (const i of order2) {
            const s = GRL_PARTS[i], a = GRL.anchors[s.id];
            const p = proj(a[0], a[1], _grlH(a[0], a[1]));
            const on = selPart === i;
            const txt = `${s.ico} ${s.name}`;
            ctx.font = `800 ${on ? fs * 1.08 : fs}px 'Segoe UI', system-ui, sans-serif`;
            const w = ctx.measureText(txt).width + 14, hh = fs * (on ? 2.0 : 1.8);
            let lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, p[0])), ly = p[1] - fs * 2.6;
            // évite les chevauchements : on remonte l'étiquette
            for (let k = 0; k < 8; k++) {
                const hit = placed.find(r => Math.abs(r.x - lx) < (r.w + w) / 2 + 4 && Math.abs(r.y - ly) < (r.h + hh) / 2 + 3);
                if (!hit) break;
                ly = hit.y - (hit.h + hh) / 2 - 4;
            }
            ly = Math.max(hh / 2 + 4, Math.min(cssH - hh / 2 - 4, ly));
            placed.push({ x: lx, y: ly, w, h: hh });
            ctx.globalAlpha = selPart >= 0 && !on ? 0.7 : 1;
            ctx.strokeStyle = s.color; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(lx, ly + hh / 2); ctx.lineTo(p[0], p[1]); ctx.stroke();
            ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
            if (on) { ctx.fillStyle = s.color + '55'; roundRect(lx - w / 2 - 5, ly - hh / 2 - 5, w + 10, hh + 10, 12); ctx.fill(); }
            ctx.fillStyle = on ? s.color : 'rgba(255,255,255,0.95)';
            roundRect(lx - w / 2, ly - hh / 2, w, hh, 9); ctx.fill();
            ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = on ? '#fff' : '#1f2937';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, lx, ly + 1);
            ctx.globalAlpha = 1;
            labelHits.push({ i, x: lx - w / 2 - 6, y: ly - hh / 2 - 6, w: w + 12, h: hh + 12 });
        }
    }

    // Échelle des étages (onglet végétation)
    function drawLegend() {
        legendHits = [];
        if (mode !== 'veg') return;
        const lw = legendW(), top = 14, bot = cssH - 34, x = 10, bw = Math.min(26, lw * 0.22);
        const A0 = 400, A1 = 3700, Y = a => bot - (a - A0) / (A1 - A0) * (bot - top);
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; roundRect(4, 4, lw - 8, cssH - 8, 10); ctx.fill();
        const fs = Math.max(9.5, Math.min(12.5, lw / 11));
        GRL_ETAGES.forEach((e, i) => {
            const y1 = Y(Math.max(A0, e.lo)), y2 = Y(Math.min(A1, e.hi));
            const on = selEt === i;
            ctx.fillStyle = e.color; ctx.fillRect(x, y2, bw, y1 - y2);
            ctx.strokeStyle = on ? '#111' : 'rgba(0,0,0,0.25)'; ctx.lineWidth = on ? 2.5 : 1; ctx.strokeRect(x, y2, bw, y1 - y2);
            ctx.font = `${on ? 900 : 800} ${fs}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = on ? '#111' : e.dark; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            const nm = e.name.replace('Étage ', '');
            ctx.fillText(e.ico + ' ' + nm.charAt(0).toUpperCase() + nm.slice(1), x + bw + 5, (y1 + y2) / 2);
            legendHits.push({ i, x: 0, y: y2, w: lw, h: y1 - y2 });
        });
        ctx.font = `700 ${fs * 0.85}px 'Segoe UI', system-ui, sans-serif`; ctx.fillStyle = '#4b5563'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        for (const a of [900, 1600, 2200, 3000]) {
            ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + bw, Y(a)); ctx.lineTo(x + bw + 3, Y(a)); ctx.stroke();
        }
        for (const a of [900, 1600, 2200, 3000]) {
            ctx.textAlign = 'right'; ctx.fillText(String(a), lw - 8, Y(a) - fs * 0.55);
        }
        // randonneur
        const yh = Y(hiker);
        ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + bw + 1, yh); ctx.lineTo(x + bw + 10, yh - 6); ctx.lineTo(x + bw + 10, yh + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.font = `${fs * 1.1}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('🥾', x + bw / 2, yh);
        ctx.font = `700 ${fs * 0.82}px 'Segoe UI', system-ui, sans-serif`; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left';
        ctx.fillText('Altitudes sur l\'ubac', x, cssH - 22);
        ctx.fillText('(+ 250 m sur l\'adret)', x, cssH - 10);
    }

    function drawOverlays() {
        // Boussole
        const lw = legendW();
        const bx = cssW - 36, by = cssH - 40, R = 22;
        const n0 = proj(0, 0, 400), n1 = proj(0, 0.3, 400);
        let ax = n1[0] - n0[0], ay = n1[1] - n0[1];
        const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(bx, by, R, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.moveTo(bx + ax * (R - 5), by + ay * (R - 5)); ctx.lineTo(bx - ay * 5, by + ax * 5); ctx.lineTo(bx + ay * 5, by - ax * 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.moveTo(bx - ax * (R - 5), by - ay * (R - 5)); ctx.lineTo(bx - ay * 5, by + ax * 5); ctx.lineTo(bx + ay * 5, by - ax * 5); ctx.closePath(); ctx.fill();
        ctx.font = "900 11px 'Segoe UI', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#dc2626'; ctx.fillText('N', bx + ax * (R + 9), by + ay * (R + 9));
        ctx.fillStyle = '#475569'; ctx.fillText('S', bx - ax * (R + 9), by - ay * (R + 9));
        // Échelle (vue carte)
        if (mapT > 0.6) {
            ctx.globalAlpha = (mapT - 0.6) / 0.4;
            const L = GRL_KM * sc, ex = lw + 22, ey = cssH - 22;
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; roundRect(ex - 8, ey - 22, L + 16, 32, 6); ctx.fill();
            ctx.fillStyle = '#111'; ctx.fillRect(ex, ey - 3, L, 6);
            ctx.fillStyle = '#fff'; ctx.fillRect(ex + L / 2, ey - 2, L / 2 - 1, 4);
            ctx.font = "800 11px 'Segoe UI', sans-serif"; ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText('1 km', ex + L / 2, ey - 6);
            ctx.globalAlpha = 1;
        }
        // Point touché : altitude
        if (pin) {
            const p = proj(pin.x, pin.y, pin.h);
            const txt = `📍 ${fmtAlt(pin.h)}` + (mode === 'veg' ? ` · ${GRL_ETAGES[pin.e].name.replace('Étage ', '')}` : '');
            const fs = Math.max(12, Math.min(16, cssW / 55));
            ctx.font = `900 ${fs}px 'Segoe UI', system-ui, sans-serif`;
            const w = ctx.measureText(txt).width + 18, hh = fs * 1.9;
            const lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, p[0])), ly = Math.max(hh / 2 + 4, p[1] - hh - 10);
            ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(lx, ly + hh / 2); ctx.stroke();
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#111827'; roundRect(lx - w / 2, ly - hh / 2, w, hh, 9); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, lx, ly + 1);
        }
        // Randonneur : petit bonhomme sur l'adret, à son altitude
        if (mode === 'veg' && hikerPos) {
            const p = proj(hikerPos[0], hikerPos[1], _grlH(hikerPos[0], hikerPos[1]));
            const r = Math.max(13, Math.min(20, sc / 16));
            ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - r * 1.6); ctx.stroke();
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(p[0], p[1] - r * 1.6 - r, r, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
            ctx.font = `${r * 1.2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🥾', p[0], p[1] - r * 2.6 + 1);
            ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 2 * Math.PI); ctx.fill();
        }
    }
    let hikerPos = null;

    function draw() {
        if (!syncSize()) return;
        setView();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.setLineDash([]);
        drawSky();
        projectAll();
        drawTerrain();
        drawLabels();
        drawLegend();
        drawOverlays();
        updateInfo();
    }

    // ── Ligne du randonneur (courbe à son altitude) ───────────────────────
    function computeHiker() {
        const C = GRL_C;
        hikerSegs = new Array(C * C);
        for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
            const s = GRL.cellContour(i, j, hiker);
            if (s) hikerSegs[j * C + i] = s;
        }
        // position du randonneur : sur le sentier qui monte du village au sommet, par l'adret
        const path = [[0.21, _grlY0(0.21) + 0.03], [0.34, -0.12], [0.36, 0.12], [GRL.top.x, GRL.top.y]];
        hikerPos = path[path.length - 1];
        outer: for (let s = 0; s < path.length - 1; s++) for (let t = 0; t <= 1; t += 0.01) {
            const x = path[s][0] + (path[s + 1][0] - path[s][0]) * t, y = path[s][1] + (path[s + 1][1] - path[s][1]) * t;
            if (_grlH(x, y) >= hiker) { hikerPos = [x, y]; break outer; }
        }
        selEt = -1;
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function partsList() {
        return `<ol class="grl-list">${GRL_PARTS.map((p, i) =>
            `<li><button data-part="${i}" class="${selPart === i ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}</button></li>`).join('')}</ol>`;
    }
    function etagesList() {
        return `<ol class="grl-list">${GRL_ETAGES.slice().reverse().map(e => {
            const i = GRL_ETAGES.indexOf(e);
            return `<li><button data-et="${i}" class="${selEt === i ? 'on' : ''}" style="--st-c:${e.dark}">${e.ico} ${e.name} <span class="grl-small">${e.hi > 9000 ? '> 3 000 m' : (e.lo ? e.lo.toLocaleString('fr-FR') + ' – ' : '< ') + e.hi.toLocaleString('fr-FR') + ' m'}</span></button></li>`;
        }).join('')}</ol>`;
    }
    function hikerEtage() {
        // étage du randonneur sur l'adret, où il marche
        return _grlEtageIdx(hiker - GRL_ADRET_SHIFT * 0.8);
    }
    function updateInfo() {
        mapBtn.classList.toggle('on', mapTarget === 1);
        mapBtn.textContent = mapTarget === 1 ? '⛰️ Vue 3D' : '🗺️ Vue carte';
        contoursBtn.classList.toggle('on', showContours);
        labelsBtn.classList.toggle('on', showLabels);
        spinBtn.classList.toggle('on', spin);
        altVal.textContent = `${fmtAlt(hiker)} · ${fmtT(_grlTemp(hiker))}`;
        const key = [mode, selPart, selEt, mapTarget, mode === 'veg' ? hiker : 0].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const keepScroll = side.scrollTop;
        const mapBox = mapTarget === 1 ? '<p class="grl-box">🗺️ <b>Vue carte</b> : on regarde la montagne du dessus, comme sur une carte. On ne voit plus le relief en 3D : ce sont les <b>courbes de niveau</b> et les <b>couleurs</b> qui le représentent.</p>' : '';

        if (mode === 'relief') {
            if (selPart < 0) {
                side.style.borderLeftColor = '#2f6f47';
                side.innerHTML = `<h4>Géographie</h4>
                    <div class="grl-status" style="color:#1f5f3a">⛰️ Le relief de montagne</div>
                    ${mapBox}
                    <p class="grl-text">Le <b>relief</b>, ce sont les formes du terrain : les montagnes, les vallées, les plaines… Une montagne a un <b>sommet</b>, des <b>versants</b>, et elle est séparée des autres par des <b>vallées</b>.</p>
                    <p class="grl-box">👆 <b>Fais glisser</b> la montagne pour la faire tourner. <b>Touche-la</b> pour connaître l'altitude d'un point. Touche une étiquette pour en savoir plus.</p>
                    ${partsList()}
                    <div style="height:8px"></div>
                    <p class="grl-know">💡 <b>Le savais-tu ?</b> L'<b>altitude</b> est la hauteur d'un point par rapport au niveau de la mer. Elle se mesure en mètres.</p>`;
            } else {
                const p = GRL_PARTS[selPart];
                side.style.borderLeftColor = p.color;
                let extra = '';
                if (p.id === 'sommet') extra = `<p class="grl-alt">📏 Altitude du sommet : ${fmtAlt(GRL.top.h)}</p>`;
                if (p.id === 'col') extra = `<p class="grl-alt">📏 Altitude du col : ${fmtAlt(GRL.col.h)}</p>`;
                if (p.id === 'courbes') extra = `<div class="grl-facts"><div>↕️ <b>Courbes serrées</b> : la pente est raide.</div><div>↔️ <b>Courbes espacées</b> : la pente est douce.</div><div>🔢 Les nombres donnent l'altitude de la courbe.</div></div>
                    <button class="grl-go" data-action="map">${mapTarget === 1 ? '⛰️ Revenir à la vue 3D' : '🗺️ Voir la montagne en vue carte'}</button>`;
                if (p.id === 'adret' || p.id === 'ubac') extra = `<button class="grl-go" data-action="toveg">🌲 Voir l'effet sur la végétation</button>`;
                side.innerHTML = `<h4>Le relief</h4>
                    <div class="grl-status" style="color:${p.color}">${p.ico} ${p.name}</div>
                    ${mapBox}
                    <p class="grl-text">${p.text}</p>
                    ${extra}
                    <p class="grl-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    <button class="grl-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${partsList()}`;
            }
        } else {
            const he = hikerEtage();
            const hikerBox = `<p class="grl-alt">🥾 Le randonneur est à <b>${fmtAlt(hiker)}</b>. Il fait environ <b>${fmtT(_grlTemp(hiker))}</b> (pour 22 °C au fond de la vallée). Sur l'adret, il est dans l'<b>${GRL_ETAGES[he].name.toLowerCase()}</b>.</p>`;
            if (selEt < 0) {
                side.style.borderLeftColor = '#2f6f47';
                side.innerHTML = `<h4>Géographie · Sciences</h4>
                    <div class="grl-status" style="color:#1f5f3a">🌲 L'étagement de la végétation</div>
                    ${mapBox}
                    <p class="grl-text">En montagne, <b>plus on monte, plus il fait froid</b> : la température baisse d'environ <b>0,6 °C tous les 100 m</b>. Les plantes ne sont donc pas les mêmes en bas et en haut : elles se répartissent en <b>étages</b>, comme dans un immeuble.</p>
                    <p class="grl-box">☀️ Sur l'<b>adret</b>, plus ensoleillé, chaque étage monte plus haut que sur l'<b>ubac</b> (environ 250 m) : regarde les limites des couleurs de chaque côté de la vallée !</p>
                    ${hikerBox}
                    ${etagesList()}
                    <div style="height:8px"></div>
                    <p class="grl-know">💡 <b>Le savais-tu ?</b> Au-dessus d'environ 2 200 m, il fait trop froid pour les arbres : c'est la <b>limite de la forêt</b>.</p>`;
            } else {
                const e = GRL_ETAGES[selEt];
                side.style.borderLeftColor = e.dark;
                side.innerHTML = `<h4>L'étagement de la végétation</h4>
                    <div class="grl-status" style="color:${e.dark}">${e.ico} ${e.name}</div>
                    <p class="grl-alt">📏 ${e.alt}</p>
                    <div class="grl-facts">
                        <div>🌿 <b>Végétation</b> : ${e.veg}</div>
                        <div>🐾 <b>Animaux</b> : ${e.ani}</div>
                        <div>🏠 <b>Les hommes</b> : ${e.hom}</div>
                    </div>
                    <p class="grl-know">💡 <b>Le savais-tu ?</b> ${e.know}</p>
                    <button class="grl-go" data-action="overview">🔙 Tous les étages</button>
                    ${etagesList()}`;
            }
        }
        side.scrollTop = keepScroll;
    }

    // ── Animation ─────────────────────────────────────────────────────────
    function needAnim() { return spin || tween || Math.abs(mapT - mapTarget) > 0.001; }
    function loop(t) {
        if (!widget.isConnected) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (spin && mapTarget === 0) yaw += dt * 0.35;
        if (tween) {
            const k = 1 - Math.pow(0.002, dt);
            yaw += (tween.yaw - yaw) * k; elev += (tween.elev - elev) * k;
            if (Math.abs(tween.yaw - yaw) < 0.002 && Math.abs(tween.elev - elev) < 0.002) { yaw = tween.yaw; elev = tween.elev; tween = null; }
        }
        if (mapT !== mapTarget) {
            const d = dt / 1.1;
            mapT = mapTarget > mapT ? Math.min(mapTarget, mapT + d) : Math.max(mapTarget, mapT - d);
        }
        draw();
        if (needAnim()) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (!animId) { lastT = 0; animId = requestAnimationFrame(loop); } }
    let drawPending = false;
    function requestDraw() {
        if (animId || drawPending) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    const easeMap = () => mapT;      // (gardé simple : progression linéaire)
    void easeMap;

    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
    function setMode(md) {
        mode = md === 'veg' ? 'veg' : 'relief';
        container.dataset.mode = mode;
        header.querySelectorAll('.grl-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        hint.textContent = mode === 'relief'
            ? 'Fais glisser pour tourner la montagne · Touche-la pour connaître l\'altitude'
            : 'Fais glisser pour tourner · Touche un étage ou bouge le randonneur';
        pin = null;
        lastInfoKey = '';
        requestDraw();
    }
    function setMap(v) {
        mapTarget = v ? 1 : 0;
        if (mapTarget === 1) { spin = false; if (!showContours) { showContours = true; } }
        lastInfoKey = '';
        startLoop();
    }

    // ── Interaction : tourner, toucher ────────────────────────────────────
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
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) {
            drag.moved = true; drag.lx = e.clientX; drag.ly = e.clientY;
            canvas.style.cursor = 'grabbing';
        }
        if (drag.moved && mapTarget === 0 && mapT === 0) {
            tween = null;
            yaw -= (e.clientX - drag.lx) * 0.008;
            elev = Math.max(12 * Math.PI / 180, Math.min(Math.PI / 2, elev + (e.clientY - drag.ly) * 0.006));
            drag.lx = e.clientX; drag.ly = e.clientY;
            requestDraw();
        }
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        canvas.style.cursor = '';
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel') return;
        if (d.moved) { save(); return; }
        const L = local(e); onTap(L.x, L.y);
    }
    // Retrouve le point du terrain sous le doigt (la case la plus proche d'abord)
    function pick(x, y) {
        const C = GRL_C, N = GRL_N;
        for (let k = order.length - 1; k >= 0; k--) {
            const it = order[k];
            if (it[1] !== 0) continue;
            const c = it[2], i = c % C, j = (c - i) / C, a = j * N + i;
            const tris = [[a, a + 1, a + N + 1], [a, a + N + 1, a + N]];
            for (const t of tris) {
                const [p, q, r] = t;
                const x1 = PX[p], y1 = PY[p], x2 = PX[q], y2 = PY[q], x3 = PX[r], y3 = PY[r];
                const den = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
                if (Math.abs(den) < 1e-6) continue;
                const l1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / den;
                const l2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / den;
                const l3 = 1 - l1 - l2;
                if (l1 >= -0.01 && l2 >= -0.01 && l3 >= -0.01) {
                    const wx = l1 * GRL.vx[p] + l2 * GRL.vx[q] + l3 * GRL.vx[r];
                    const wy = l1 * GRL.vy[p] + l2 * GRL.vy[q] + l3 * GRL.vy[r];
                    return { x: wx, y: wy, h: _grlH(wx, wy), c };
                }
            }
        }
        return null;
    }
    function partAt(pt) {
        const { x, y } = pt, dyv = y - _grlY0(x);
        if (Math.hypot(x - GRL.top.x, y - GRL.top.y) < 0.1 || Math.hypot(x - GRL_P2[0], y - GRL_P2[1]) < 0.08) return GRL_PI.sommet;
        if (Math.hypot(x - GRL.col.x, y - GRL.col.y) < 0.08) return GRL_PI.col;
        if (Math.abs(dyv) < 0.035) return GRL_PI.riviere;
        if (GRL.houses.some(hh => Math.hypot(hh.x - x, hh.y - y) < 0.04)) return GRL_PI.village;
        if (Math.abs(dyv) < 0.13) return GRL_PI.vallee;
        return dyv > 0 ? GRL_PI.adret : GRL_PI.ubac;
    }
    function onTap(x, y) {
        if (mode === 'relief') {
            for (const h of labelHits) {
                if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                    selPart = selPart === h.i ? -1 : h.i; pin = null; lastInfoKey = ''; requestDraw(); save(); return;
                }
            }
        } else {
            for (const h of legendHits) {
                if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                    selEt = selEt === h.i ? -1 : h.i; pin = null; lastInfoKey = ''; requestDraw(); save(); return;
                }
            }
        }
        const pt = pick(x, y);
        if (!pt) { pin = null; if (mode === 'relief') selPart = -1; else selEt = -1; lastInfoKey = ''; requestDraw(); save(); return; }
        if (mode === 'relief') {
            pin = pt;
            selPart = partAt(pt);
        } else {
            const hEff = pt.h - GRL_ADRET_SHIFT * GRL.sunny[pt.c];
            pt.e = _grlEtageIdx(hEff);
            pin = pt;
            selEt = pt.e;
        }
        lastInfoKey = '';
        requestDraw();
        save();
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
    side.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.part) { selPart = Number(b.dataset.part); pin = null; }
        else if (b.dataset.et) { const i = Number(b.dataset.et); selEt = selEt === i ? -1 : i; pin = null; }
        else if (b.dataset.action === 'overview') { selPart = -1; selEt = -1; pin = null; }
        else if (b.dataset.action === 'map') { setMap(mapTarget === 0); }
        else if (b.dataset.action === 'toveg') { setMode('veg'); }
        lastInfoKey = ''; requestDraw(); save();
    });
    header.querySelectorAll('.grl-tab').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setMode(b.dataset.mode); save(); }));
    mapBtn.addEventListener('click', () => { setMap(mapTarget === 0); save(); });
    contoursBtn.addEventListener('click', () => { showContours = !showContours; requestDraw(); save(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; requestDraw(); save(); });
    spinBtn.addEventListener('click', () => {
        spin = !spin;
        if (spin) { if (mapTarget === 1) setMap(false); tween = null; startLoop(); } else requestDraw();
        save();
    });
    resetBtn.addEventListener('click', () => {
        spin = false;
        if (mapTarget === 1) setMap(false);
        const target = YAW0 + Math.round((yaw - YAW0) / (2 * Math.PI)) * 2 * Math.PI;
        tween = { yaw: target, elev: ELEV0 };
        startLoop(); save();
    });
    altSl.addEventListener('input', () => { hiker = Number(altSl.value); computeHiker(); pin = null; requestDraw(); });
    altSl.addEventListener('change', save);

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
            requestDraw();
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
            window._wfMiniBarCollapse(widget, '⛰️ La montagne', {
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
    computeHiker();
    setMode('relief');
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._grlGetData = () => ({
        containerW: contW, containerH: contH,
        mode, yaw, elev, map: mapTarget, showContours, showLabels,
        selPart, selEt, hiker
    });
    widget._grlSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.yaw === 'number' && isFinite(d.yaw)) yaw = d.yaw;
        if (typeof d.elev === 'number' && isFinite(d.elev)) elev = Math.max(12 * Math.PI / 180, Math.min(Math.PI / 2, d.elev));
        mapTarget = mapT = d.map === 1 ? 1 : 0;
        if (typeof d.showContours === 'boolean') showContours = d.showContours;
        if (typeof d.showLabels === 'boolean') showLabels = d.showLabels;
        if (typeof d.hiker === 'number') { hiker = Math.max(500, Math.min(3600, Math.round(d.hiker / 50) * 50)); altSl.value = hiker; computeHiker(); }
        selPart = typeof d.selPart === 'number' ? Math.max(-1, Math.min(GRL_PARTS.length - 1, d.selPart)) : -1;
        selEt = typeof d.selEt === 'number' ? Math.max(-1, Math.min(GRL_ETAGES.length - 1, d.selEt)) : -1;
        setMode(d.mode || 'relief');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_grlSetData');

    save();
    return widget;
}
