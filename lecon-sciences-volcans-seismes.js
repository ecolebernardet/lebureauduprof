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
// WIDGET VOLCANS ET SÉISMES — Le Bureau du Prof
// Deux onglets, pour des élèves de fin de primaire (CM1 – CM2 – 6e) :
//  🌋 Les volcans : un volcan en vue en coupe (chambre magmatique, cheminée,
//     cratère, cône fait de couches). On lance une éruption EFFUSIVE (lave
//     fluide : fontaines et coulées) ou EXPLOSIVE (lave visqueuse : bouchon
//     qui explose, panache de cendres, bombes volcaniques, nuée ardente).
//  🌍 Les séismes : une coupe du sol avec une faille. Les roches se
//     déforment, cassent au foyer ; les ondes sismiques partent dans toutes
//     les directions, les maisons tremblent (plus fort près de l'épicentre)
//     et le sismographe trace le sismogramme. Le curseur « Magnitude »
//     règle la force du séisme. Bouton « Se protéger » : les bons gestes.
// On touche une étiquette ou une partie du schéma pour l'expliquer.
// Une fiche à droite donne l'explication et un « Le savais-tu ? ».
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
    if (document.getElementById('vs-style')) return;
    const s = document.createElement('style');
    s.id = 'vs-style';
    s.textContent = `
        .widget[data-type="volcans-seismes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .vs-container {
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
        .vs-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .vs-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .vs-header .wf-btns { gap: 8px; }
        .vs-header .wf-btn { width: 18px; height: 18px; }
        .vs-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .vs-container.wf-fullboard {
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
        .vs-tabs { display: inline-flex; background: #f3ede9; border-radius: 11px; padding: 3px; gap: 3px; }
        .vs-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .vs-tab.on { background: #fff; color: #9a3412; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .vs-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .vs-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .vs-btn:hover { background: #e0e0e0; }
        .vs-btn:active { transform: scale(0.96); }
        .vs-btn.on { background: #c2410c; color: #fff; border-color: #c2410c; }
        .vs-btn-play { min-width: 170px; background: #fde6d8; border-color: #f2b48e; color: #9a3412; }
        .vs-btn-play:hover { background: #fbd5bd; }
        .vs-btn-play.on { background: #e8590c; border-color: #e8590c; color: #fff; }
        .vs-btn-gestes.on { background: #2f7d3a; border-color: #2f7d3a; }
        .vs-type { border-left: 4px solid var(--st-c, #bbb); }
        .vs-type.on { background: var(--st-c, #c2410c); border-color: var(--st-c, #c2410c); color: #fff; }
        .vs-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .vs-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .vs-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 260px; min-width: 200px; }
        .vs-slider { flex: 1; height: 30px; accent-color: #c2410c; cursor: pointer; touch-action: none; }
        .vs-val { font-size: 13px; font-weight: 800; color: #9a3412; min-width: 46px; text-align: right; }

        /* Corps */
        .vs-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .vs-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #cfe6f5;
        }
        .vs-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .vs-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: rgba(255,255,255,.88); pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,.6);
        }
        .vs-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #c2410c;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .vs-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #7c2d12; }
        .vs-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .vs-change { background: #fdf0e7; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #7c2d12; font-weight: 700; }
        .vs-note { background: #eaf3fc; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d4f86; font-weight: 700; }
        .vs-text { margin: 0 0 6px; }
        .vs-text ul { margin: 2px 0 6px; padding-left: 18px; }
        .vs-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .vs-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .vs-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .vs-steps button.on { background: var(--st-c, #c2410c); color: #fff; }
        .vs-tag { font-size: .8em; font-weight: 700; opacity: .75; }

        /* Aide */
        .vs-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .vs-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 370px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .vs-help-popup.show { display: block; }
        .vs-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .vs-help-popup p { margin: 0 0 6px; }

        .vs-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .vs-resize-handle:hover { opacity: 1; }
        .vs-container[data-mode="seisme"] .vs-only-volcan { display: none !important; }
        .vs-container[data-mode="volcan"] .vs-only-seisme { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .vs-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .vs-tab-short { display: none; }
        .vs-header { min-width: 0; max-width: 100%; }
        .vs-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .vs-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vs-header .wf-btns { flex-shrink: 0; }
        .vs-container.wf-fullboard .vs-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .vs-container { padding: 10px 10px 8px; gap: 6px; }
            .vs-header { gap: 6px; }
            .vs-title { font-size: 13px; }
            .vs-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .vs-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .vs-row > * { flex-shrink: 0; }
            .vs-row + .vs-row { flex-wrap: wrap; overflow: visible; }
            .vs-row + .vs-row .vs-lbl:first-child { display: none; }
            .vs-slider-box { flex: 1 1 160px; min-width: 0; }
            .vs-val { min-width: 0; }
            .vs-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .vs-btn-play { min-width: 0; }
            .vs-sep { display: none; }
            .vs-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .vs-side { padding: 8px 10px; font-size: 13px; }
            .vs-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .vs-title { display: none; }
            .vs-tab { padding: 3px 7px; font-size: 11.5px; }
            .vs-tab-long { display: none; }
            .vs-tab-short { display: inline; }
            .vs-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .vs-body { flex-direction: column; }
            .vs-slider-box { flex: 1 1 100%; }
            .vs-scene-wrap { flex: 1 1 0; min-height: 220px; }
            .vs-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .vs-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="volcans-seismes"], .vs-container, .vs-container * { cursor: default !important; }
        .vs-container .vs-header, .vs-container .vs-header * { cursor: grab !important; }
        .vs-container .vs-header:active, .vs-container .vs-header:active * { cursor: grabbing !important; }
        .vs-container button, .vs-container button *, .vs-container .vs-header button,
        .vs-container .vs-header button *,
        .vs-container input[type="range"] { cursor: pointer !important; }
        .vs-container button:disabled, .vs-container button:disabled *,
        .vs-container .vs-canvas { cursor: default !important; }
        .vs-container input { cursor: text !important; }
        .vs-container .vs-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .vs-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .vs-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .vs-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .vs-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .vs-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .vs-help-popup { top: 56px; }
        .vs-container.wf-fullboard .vs-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .vs-container.wf-fullboard .vs-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .vs-title { font-size: 17px; }
        }
        .vs-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .vs-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .vs-tab:hover { background: rgba(255,255,255,.1); }
        .vs-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .vs-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .vs-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .vs-container.wf-fullboard .vs-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .vs-tab { padding: 3px 10px; font-size: 12px; }
            .vs-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .vs-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique : les volcans ─────────────────────────────────────
// lx, ly : position de l'étiquette dans le schéma (0 … 1)
// type : partie visible seulement dans un type d'éruption (null = toujours)
const VS_V_PARTS = [
    {
        id: 'chambre', ico: '🔥', name: 'Chambre magmatique', color: '#d9381e', lx: 0.80, ly: 0.89, type: null,
        text: 'Sous le volcan, à plusieurs kilomètres de profondeur, se trouve une grande poche remplie de <b>magma</b> : de la roche <b>fondue</b> par la chaleur, mélangée à des <b>gaz</b>. Le magma est plus léger que les roches qui l\'entourent : il a tendance à <b>remonter</b>.',
        know: 'Le magma est très chaud : environ 1 000 °C ! C\'est dix fois plus chaud que l\'eau qui bout.'
    },
    {
        id: 'cheminee', ico: '⬆️', name: 'Cheminée', color: '#e8590c', lx: 0.68, ly: 0.71, type: null,
        text: 'C\'est le <b>conduit</b> qui relie la chambre magmatique au sommet du volcan. Poussé par les gaz, le magma <b>monte</b> par la cheminée jusqu\'au cratère.',
        know: 'Avant une éruption, la montée du magma fait trembler le sol et gonfler le volcan. Les scientifiques qui étudient les volcans (les volcanologues) surveillent ces signes pour prévenir les habitants.'
    },
    {
        id: 'cratere', ico: '🕳️', name: 'Cratère', color: '#8a5a44', lx: 0.65, ly: 0.19, type: null,
        text: 'C\'est l\'<b>ouverture</b> au sommet du volcan, souvent en forme de cuvette. C\'est par là que sortent la <b>lave</b>, les <b>gaz</b> et les <b>cendres</b> pendant une éruption.',
        know: 'Quand un volcan reste longtemps sans éruption, l\'eau de pluie peut remplir son cratère et former un lac.'
    },
    {
        id: 'cone', ico: '⛰️', name: 'Cône volcanique', color: '#6b5b53', lx: 0.35, ly: 0.56, type: null,
        text: 'Le volcan est une <b>montagne construite par ses propres éruptions</b>. À chaque éruption, la lave et les cendres refroidies s\'empilent en <b>couches</b> : le volcan grandit. On voit ces couches dans la vue en coupe.',
        know: 'Un volcan peut naître très vite : en 1943, au Mexique, le Paricutín est apparu dans un champ de maïs et il mesurait déjà plus de 300 m de haut un an plus tard !'
    },
    {
        id: 'coulee', ico: '🌊', name: 'Coulée de lave', color: '#f76707', lx: 0.16, ly: 0.47, type: 'effusif',
        text: 'Quand le magma sort du volcan, on l\'appelle la <b>lave</b>. Une lave <b>fluide</b> coule sur les pentes comme une rivière de feu et détruit tout sur son passage. En refroidissant, elle <b>durcit</b> et devient une <b>roche</b> : le basalte.',
        know: 'Au Piton de la Fournaise, à La Réunion, des coulées de lave sont arrivées jusqu\'à l\'océan : en refroidissant, elles ont agrandi l\'île !'
    },
    {
        id: 'panache', ico: '🌫️', name: 'Panache de cendres', color: '#57534e', lx: 0.22, ly: 0.09, type: 'explosif',
        text: 'Lors d\'une éruption explosive, les gaz projettent dans le ciel de minuscules morceaux de lave pulvérisée : les <b>cendres</b>. Elles forment un énorme <b>panache</b> qui peut monter à plusieurs kilomètres de haut, puis retombent en recouvrant tout le paysage.',
        know: 'En 2010, les cendres d\'un volcan d\'Islande ont empêché les avions de voler dans une grande partie de l\'Europe pendant plusieurs jours.'
    },
    {
        id: 'bombes', ico: '🪨', name: 'Bombes volcaniques', color: '#44403c', lx: 0.84, ly: 0.26, type: 'explosif',
        text: 'Ce sont des <b>morceaux de lave</b> projetés par l\'explosion. Ils refroidissent pendant leur vol et retombent autour du volcan. Certaines bombes sont aussi grosses qu\'une voiture !',
        know: 'En tournant dans l\'air pendant leur vol, certaines bombes prennent la forme d\'un fuseau ou d\'un ballon de rugby.'
    },
    {
        id: 'nuee', ico: '☁️', name: 'Nuée ardente', color: '#9a3412', lx: 0.87, ly: 0.47, type: 'explosif',
        text: 'Une <b>nuée ardente</b> est une avalanche <b>brûlante</b> de gaz, de cendres et de blocs qui dévale les pentes du volcan à très grande vitesse. C\'est le phénomène le plus dangereux d\'un volcan.',
        know: 'En 1902, une nuée ardente de la Montagne Pelée a détruit la ville de Saint-Pierre, en Martinique.'
    }
];
const VS_V_TYPES = {
    effusif: {
        ico: '💧', name: 'Éruption effusive', color: '#e8590c',
        text: 'La lave est <b>fluide</b> (très liquide). Les gaz s\'échappent facilement : la lave <b>jaillit en fontaines</b> puis <b>coule</b> en longues coulées sur les pentes. Ces éruptions sont spectaculaires mais rarement dangereuses pour les personnes, car la lave avance assez lentement.',
        ex: 'Exemples : le Piton de la Fournaise (La Réunion), les volcans d\'Hawaï et d\'Islande.'
    },
    explosif: {
        ico: '💥', name: 'Éruption explosive', color: '#57534e',
        text: 'La lave est <b>visqueuse</b> (pâteuse, épaisse). Elle bouche la cheminée comme un bouchon : les gaz ne peuvent pas sortir et la pression augmente… jusqu\'à l\'<b>explosion</b> ! Le volcan projette des <b>cendres</b>, des <b>bombes volcaniques</b> et parfois des <b>nuées ardentes</b>. Ces éruptions sont très dangereuses.',
        ex: 'Exemples : la Montagne Pelée (Martinique), le Vésuve (Italie), le mont Saint Helens (États-Unis).'
    }
};
const VS_V_OVERVIEW_KNOW = 'Il y a environ 1 500 volcans actifs sur Terre, sans compter ceux cachés au fond des océans. En France, il y a des volcans actifs à La Réunion et aux Antilles. Ceux d\'Auvergne (la chaîne des Puys) sont endormis.';
const VS_V_PHASES = {
    calme:    ['😴', 'Le volcan est calme', '#6b7280'],
    monte:    ['🔥', 'Le magma monte…', '#d9381e'],
    eruption: ['🌋', 'Éruption !', '#e8590c'],
    fin:      ['🧊', 'L\'éruption se calme, la lave refroidit', '#6b5b53'],
    eteint:   ['✅', 'L\'éruption est terminée', '#2f7d3a']
};

// ── Contenu pédagogique : les séismes ─────────────────────────────────────
const VS_S_PARTS = [
    {
        id: 'faille', ico: '⚡', name: 'Faille', color: '#b91c1c', lx: 0.66, ly: 0.55,
        text: 'Une <b>faille</b> est une <b>cassure</b> dans les roches. De chaque côté, les deux blocs de roches sont poussés dans des sens opposés. Ils restent bloqués… jusqu\'à ce que la tension soit trop forte : ils <b>glissent</b> d\'un coup. Regarde les couches de roches : après le séisme, elles sont <b>décalées</b>.',
        know: 'La faille de San Andreas, en Californie (États-Unis), mesure plus de 1 000 km de long.'
    },
    {
        id: 'foyer', ico: '💥', name: 'Foyer', color: '#e8590c', lx: 0.20, ly: 0.80,
        text: 'Le <b>foyer</b> (ou hypocentre) est l\'endroit, <b>en profondeur</b>, où les roches cassent. C\'est là que le séisme commence et que naissent les ondes sismiques. Il peut se trouver à quelques kilomètres ou à des centaines de kilomètres sous la surface.',
        know: 'Plus le foyer est proche de la surface, plus les secousses sont fortes pour les habitants.'
    },
    {
        id: 'epicentre', ico: '🎯', name: 'Épicentre', color: '#7c3aed', lx: 0.43, ly: 0.17,
        text: 'L\'<b>épicentre</b> est le point de la <b>surface</b> situé <b>juste au-dessus du foyer</b>. C\'est là que les ondes arrivent en premier et que les secousses sont les plus fortes. Plus on s\'éloigne de l\'épicentre, plus les secousses diminuent.',
        know: 'Quand on parle d\'un séisme à la radio ou dans le journal, on donne le lieu de son épicentre : c\'est le point que l\'on place sur une carte.'
    },
    {
        id: 'ondes', ico: '〰️', name: 'Ondes sismiques', color: '#d97706', lx: 0.80, ly: 0.73,
        text: 'Les <b>ondes sismiques</b> partent du foyer dans <b>toutes les directions</b>, comme les ronds dans l\'eau quand on jette un caillou. En arrivant à la surface, elles font <b>trembler le sol</b> et les bâtiments. Elles s\'affaiblissent en s\'éloignant.',
        know: 'Les ondes sismiques avancent à plusieurs kilomètres par seconde. Quand un séisme a lieu sous la mer, il peut provoquer un tsunami : une vague géante.'
    },
    {
        id: 'sismographe', ico: '📈', name: 'Sismographe', color: '#1d4f86', lx: 0.89, ly: 0.46,
        text: 'Le <b>sismographe</b> est un appareil qui <b>enregistre</b> les mouvements du sol. Son enregistrement s\'appelle un <b>sismogramme</b> : plus les zigzags sont grands, plus le séisme est fort. Avec plusieurs sismographes, les scientifiques retrouvent l\'épicentre et mesurent la <b>magnitude</b>.',
        know: 'Il y a des sismographes partout dans le monde : ils détectent même des séismes que personne ne sent.'
    },
    {
        id: 'gestes', ico: '🛡️', name: 'Se protéger', color: '#2f7d3a', lx: null, ly: null,
        html: '<b>Pendant les secousses</b><ul><li>À l\'intérieur : s\'abriter <b>sous une table solide</b> en se protégeant la tête, loin des fenêtres.</li><li>Dehors : s\'éloigner des bâtiments, des arbres et des fils électriques.</li><li>Ne pas prendre l\'ascenseur.</li></ul><b>Après les secousses</b><ul><li>Sortir <b>calmement</b>, sans courir, en se méfiant des <b>répliques</b> (de nouvelles secousses).</li><li>Ne pas toucher aux fils électriques tombés.</li><li>Écouter les consignes des adultes et des secours.</li></ul>',
        know: 'À l\'école, on s\'entraîne avec des exercices de sécurité (le PPMS) pour savoir quoi faire en cas de séisme.'
    }
];
const VS_S_OVERVIEW = {
    text: 'La surface de la Terre est faite de grandes <b>plaques</b> de roches qui bougent très lentement. En bougeant, elles <b>poussent</b> ou <b>tirent</b> sur les roches, qui se déforment petit à petit. Quand c\'est trop, les roches <b>cassent</b> brusquement le long d\'une <b>faille</b> : c\'est un <b>séisme</b> (ou tremblement de terre). L\'énergie libérée se propage en <b>ondes sismiques</b> qui font trembler le sol.',
    know: 'Chaque année, il y a des centaines de milliers de séismes sur Terre, mais la plupart sont trop faibles pour être ressentis. En France, ils sont plus fréquents dans les Alpes, les Pyrénées et aux Antilles.'
};
const VS_S_PHASES = {
    calme:   ['😴', 'Tout est calme', '#6b7280'],
    tension: ['⏳', 'Les roches se déforment…', '#b45309'],
    rupture: ['💥', 'Rupture ! Les roches cassent', '#b91c1c'],
    ondes:   ['〰️', 'Les ondes sismiques se propagent', '#d97706'],
    fini:    ['✅', 'Le séisme est terminé', '#2f7d3a']
};
function _vsMagText(m) {
    if (m < 3) return 'Pas ressenti par les gens : seuls les sismographes l\'enregistrent.';
    if (m < 4) return 'Faiblement ressenti : les objets suspendus bougent un peu.';
    if (m < 5) return 'Ressenti par tout le monde : la vaisselle tremble, mais il y a rarement des dégâts.';
    if (m < 6) return 'Des fissures apparaissent dans les murs des bâtiments fragiles.';
    if (m < 7) return 'Séisme fort : dégâts importants près de l\'épicentre.';
    if (m < 8) return 'Séisme majeur : des bâtiments peuvent s\'effondrer.';
    return 'Séisme exceptionnel : destructions sur une très grande région.';
}
const VS_MAG_KNOW = 'Quand la magnitude augmente de 1, le séisme libère environ 30 fois plus d\'énergie. Le plus fort séisme jamais enregistré a eu lieu au Chili en 1960 : magnitude 9,5.';

// ── Géométrie du volcan (coordonnées 0 … 1) ──────────────────────────────
const VS_SURF_V = 0.62;                 // niveau du sol autour du volcan
const VS_CONE_L = 0.18, VS_CONE_R = 0.82;
const VS_APEX_L = [0.44, 0.23], VS_APEX_R = [0.56, 0.23];
const VS_CRATER_Y = 0.262;
const VS_CHAMBER = [0.5, 0.875, 0.17, 0.065];   // cx, cy, rx, ry
const VS_CHIM_TOP = 0.25, VS_CHIM_BOT = 0.83;
const VS_TIMES = { rise: 3, riseExpl: 3.5, eruptEnd: 12, coolEnd: 16 };

function _vsConeY(x) {
    if (x <= VS_CONE_L || x >= VS_CONE_R) return VS_SURF_V;
    if (x < VS_APEX_L[0]) return VS_SURF_V + (VS_APEX_L[1] - VS_SURF_V) * (x - VS_CONE_L) / (VS_APEX_L[0] - VS_CONE_L);
    if (x > VS_APEX_R[0]) return VS_SURF_V + (VS_APEX_R[1] - VS_SURF_V) * (VS_CONE_R - x) / (VS_CONE_R - VS_APEX_R[0]);
    const u = (x - VS_APEX_L[0]) / (VS_APEX_R[0] - VS_APEX_L[0]);
    return VS_APEX_L[1] + (VS_CRATER_Y - VS_APEX_L[1]) * Math.sin(Math.PI * u);     // cuvette du cratère
}
function _vsSlopePath(x0, x1, n, lift) {
    const p = [];
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; p.push([x, _vsConeY(x) - lift]); }
    return p;
}
function _vsLens(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return L;
}
function _vsAt(pts, L, t) {
    const d = Math.max(0, Math.min(1, t)) * L[L.length - 1];
    let i = 0;
    while (i < L.length - 2 && L[i + 1] < d) i++;
    const u = (d - L[i]) / ((L[i + 1] - L[i]) || 1);
    const a = pts[i], b = pts[i + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
function _vsPartial(pts, L, t) {         // début du chemin, jusqu'à la fraction t
    const d = Math.max(0, Math.min(1, t)) * L[L.length - 1];
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
        if (L[i] <= d) { out.push(pts[i]); continue; }
        const u = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]);
        break;
    }
    return out;
}
function _vsHex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function _vsMix(a, b, k) {
    const A = _vsHex(a), B = _vsHex(b);
    k = Math.max(0, Math.min(1, k));
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
}
const _vsClamp = v => Math.max(0, Math.min(1, v));
const VS_CONE_PTS = _vsSlopePath(VS_CONE_L, VS_CONE_R, 64, 0);
const VS_LAVA_L = _vsSlopePath(0.455, 0.015, 40, 0.006);
const VS_LAVA_R = _vsSlopePath(0.545, 0.75, 24, 0.006);
const VS_NUEE   = _vsSlopePath(0.56, 0.99, 30, 0.012);
const VS_LAVA_L_L = _vsLens(VS_LAVA_L), VS_LAVA_R_L = _vsLens(VS_LAVA_R), VS_NUEE_L = _vsLens(VS_NUEE);
const VS_TREES_V = [0.05, 0.11, 0.88, 0.945];

// ── Géométrie du séisme ───────────────────────────────────────────────────
const SS_SURF = 0.36;                    // surface du sol
const SS_F0 = [0.34, 1.0], SS_F1 = [0.58, SS_SURF];   // faille (bas → surface)
const SS_FOYER = [0.43, 0.76];
const SS_RUPT = 1.6;                     // instant de la rupture (s)
const SS_HOUSES = [
    [0.07, '#f4d6a0', '#b5442f'], [0.18, '#d9e7f5', '#5b6f8a'], [0.29, '#f6e2c8', '#a0522d'],
    [0.43, '#fbe9d0', '#c0392b'], [0.52, '#e3f0d8', '#6b7f3a'], [0.69, '#f3dcdc', '#8e3b46'], [0.80, '#e9e1f5', '#5b4a8a']
];
const SS_TREES = [0.125, 0.355, 0.62, 0.745];
const SS_STATION = 0.93;
const SS_N = 320;                        // largeur minimale du sismogramme (points à 50 par seconde)
const _ssFaultX = y => SS_F0[0] + (SS_F1[0] - SS_F0[0]) * (SS_F0[1] - y) / (SS_F0[1] - SS_F1[1]);

// ── Création du widget ────────────────────────────────────────────────────
function createVolcansSeismesWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'volcans-seismes';
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
    container.className = 'vs-container';
    container.dataset.mode = 'volcan';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'vs-header';
    header.innerHTML = `
        <span class="vs-title">🌋<span> Volcans et séismes</span></span>
        <div class="vs-tabs">
            <button class="vs-tab on" data-mode="volcan" title="Les volcans"><span class="vs-tab-long">🌋 Les volcans</span><span class="vs-tab-short">🌋 Volcans</span></button>
            <button class="vs-tab" data-mode="seisme" title="Les séismes"><span class="vs-tab-long">🌍 Les séismes</span><span class="vs-tab-short">🌍 Séismes</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'vs-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.vs-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : lancer / recommencer / vitesse / options
    const row1 = document.createElement('div');
    row1.className = 'vs-row';
    row1.innerHTML = `
        <button class="vs-btn vs-btn-play" title="Lancer, mettre en pause ou reprendre"></button>
        <button class="vs-btn vs-btn-reset" title="Revenir au début">🔄 Recommencer</button>
        <button class="vs-btn vs-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="vs-sep"></span>
        <button class="vs-btn vs-labels on" title="Afficher les noms des parties">🏷️ Étiquettes</button>
        <button class="vs-btn vs-waves vs-only-seisme on" title="Afficher les ondes sismiques">〰️ Ondes</button>
        <button class="vs-btn vs-btn-gestes vs-only-seisme" title="Les bons gestes en cas de séisme">🛡️ Se protéger</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : type d'éruption (volcans) / magnitude (séismes)
    const row2 = document.createElement('div');
    row2.className = 'vs-row';
    row2.innerHTML = `
        <span class="vs-lbl vs-only-volcan">Type d'éruption :</span>
        <button class="vs-btn vs-type vs-only-volcan" data-vtype="effusif" style="--st-c:#e8590c" title="Lave fluide : fontaines et coulées">💧 Effusive (lave fluide)</button>
        <button class="vs-btn vs-type vs-only-volcan" data-vtype="explosif" style="--st-c:#57534e" title="Lave visqueuse : explosion, cendres, bombes">💥 Explosive (lave visqueuse)</button>
        <div class="vs-slider-box vs-only-seisme">
            <span class="vs-lbl">📏 Magnitude :</span>
            <input type="range" class="vs-slider vs-mag" min="2" max="9" step="0.5" value="6" aria-label="Magnitude du séisme">
            <span class="vs-val vs-mag-val"></span>
        </div>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'vs-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'vs-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'vs-canvas';
    const hint = document.createElement('div');
    hint.className = 'vs-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'vs-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'vs-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Volcans et séismes</h4>
        <p><b>🌋 Les volcans</b> : choisis le <b>type d'éruption</b> (effusive ou explosive), puis appuie sur
        <b>🌋 Lancer l'éruption</b>. Le magma monte par la cheminée, puis sort du volcan. Le même bouton met en
        <b>pause</b> et <b>reprend</b> l'animation ; <b>🔄 Recommencer</b> remet le volcan au calme.</p>
        <p><b>🌍 Les séismes</b> : règle la <b>magnitude</b> (la force du séisme), puis appuie sur
        <b>💥 Déclencher le séisme</b>. Les roches se déforment, cassent au foyer, les ondes partent dans toutes
        les directions, les maisons tremblent et le sismographe trace le sismogramme.
        <b>🛡️ Se protéger</b> affiche les bons gestes.</p>
        <p><b>Touche une étiquette</b> ou une partie du schéma pour afficher son explication dans la fiche de droite.
        La liste de la fiche permet aussi de passer d'une partie à l'autre.</p>
        <p style="color:#888">Schémas simplifiés en vue en coupe : les tailles, les distances et les vitesses ne sont pas
        à l'échelle.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'vs-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const playBtn = $('.vs-btn-play'), resetBtn = $('.vs-btn-reset'), speedBtn = $('.vs-btn-speed');
    const labelsBtn = $('.vs-labels'), wavesBtn = $('.vs-waves'), gestesBtn = $('.vs-btn-gestes');
    const magSl = $('.vs-mag'), magVal = $('.vs-mag-val');
    const GESTES = VS_S_PARTS.findIndex(p => p.id === 'gestes');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'volcan';
    let vType = 'effusif', vPart = -1, vT = null;   // vT : temps depuis le début de l'éruption (null = calme)
    let vparts = [], landed = [];
    const acc = {};
    let mag = 6, qMag = 6, sPart = -1, qT = null;   // qT : temps depuis le début du séisme
    let seis = [], sTime = 0, seisAcc = 0;
    let showLabels = true, showWaves = true;
    let playing = false, fast = false;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let labelHits = [], sismoBox = null;

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }
    const X = x => x * cssW, Y = y => y * cssH;
    const fmtMag = v => v.toFixed(1).replace('.', ',');

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    function pathPts(pts, close) {
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
        if (close) ctx.closePath();
    }
    function drawCloud(cx, cy, s, col, alpha) {
        const blobs = [[-1.0, 0.15, 0.55], [-0.45, -0.2, 0.7], [0.2, -0.3, 0.75], [0.8, -0.05, 0.6], [1.1, 0.2, 0.45], [0.1, 0.2, 0.6]];
        ctx.globalAlpha = alpha === undefined ? 1 : alpha;
        ctx.fillStyle = col;
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(cx + b[0] * s + b[2] * s, cy + b[1] * s); ctx.arc(cx + b[0] * s, cy + b[1] * s, b[2] * s, 0, 2 * Math.PI); }
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    function drawArrow(a, b, col, w) {
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = w * 2.6;
        const bx = b[0] - Math.cos(ang) * h * 0.6, by = b[1] - Math.sin(ang) * h * 0.6;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bx, by); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - Math.cos(ang) * h + Math.cos(ang + Math.PI / 2) * h * 0.6, b[1] - Math.sin(ang) * h + Math.sin(ang + Math.PI / 2) * h * 0.6);
        ctx.lineTo(b[0] - Math.cos(ang) * h - Math.cos(ang + Math.PI / 2) * h * 0.6, b[1] - Math.sin(ang) * h - Math.sin(ang + Math.PI / 2) * h * 0.6);
        ctx.closePath(); ctx.fill();
    }
    function drawStar(cx, cy, R, r, n, fill, stroke) {
        ctx.beginPath();
        for (let i = 0; i < n * 2; i++) {
            const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R;
            const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    function drawTree(x, yb, s, dx) {
        ctx.fillStyle = '#6d4a2b'; ctx.fillRect(x + dx - s * 0.06, yb - s * 0.5, s * 0.12, s * 0.5);
        ctx.fillStyle = '#2f7d3a';
        ctx.beginPath();
        ctx.arc(x + dx * 1.3, yb - s * 0.66, s * 0.3, 0, 2 * Math.PI);
        ctx.arc(x + dx * 1.3 - s * 0.2, yb - s * 0.52, s * 0.22, 0, 2 * Math.PI);
        ctx.arc(x + dx * 1.3 + s * 0.2, yb - s * 0.52, s * 0.22, 0, 2 * Math.PI);
        ctx.fill();
    }
    function distToPolyPx(px, py, pts) {
        let best = Infinity;
        for (let i = 1; i < pts.length; i++) {
            const ax = X(pts[i - 1][0]), ay = Y(pts[i - 1][1]), bx = X(pts[i][0]), by = Y(pts[i][1]);
            const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
            const u = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2));
            best = Math.min(best, Math.hypot(px - ax - u * vx, py - ay - u * vy));
        }
        return best;
    }
    // Étiquettes touchables (communes aux deux onglets)
    function drawLabels(parts, cur, visible) {
        labelHits = [];
        if (!showLabels) return;
        const fs = Math.max(11, Math.min(16, cssW / 62));
        parts.forEach((s, i) => {
            if (s.lx === null || !visible(s)) return;
            const on = cur === i;
            const txt = `${s.ico} ${s.name}`;
            ctx.font = `800 ${on ? fs * 1.1 : fs}px 'Segoe UI', system-ui, sans-serif`;
            const w = ctx.measureText(txt).width + 16, hh = fs * (on ? 2.0 : 1.8);
            const lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, X(s.lx)));
            const ly = Math.max(hh / 2 + 4, Math.min(cssH - hh / 2 - 22, Y(s.ly)));
            ctx.globalAlpha = cur >= 0 && !on ? 0.65 : 1;
            if (on) {
                ctx.fillStyle = s.color + '55';
                roundRect(lx - w / 2 - 5, ly - hh / 2 - 5, w + 10, hh + 10, 12); ctx.fill();
            }
            ctx.fillStyle = on ? s.color : 'rgba(255,255,255,0.93)';
            roundRect(lx - w / 2, ly - hh / 2, w, hh, 9); ctx.fill();
            ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = on ? '#ffffff' : '#1f2937';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, lx, ly + 1);
            ctx.globalAlpha = 1;
            labelHits.push({ i, x: lx - w / 2 - 8, y: ly - hh / 2 - 8, w: w + 16, h: hh + 16 });
        });
    }

    // =====================================================================
    //  ONGLET « LES VOLCANS »
    // =====================================================================
    const riseEnd = () => vType === 'explosif' ? VS_TIMES.riseExpl : VS_TIMES.rise;
    function vPhase() {
        if (vT === null) return 'calme';
        if (vT < riseEnd()) return 'monte';
        if (vT < VS_TIMES.eruptEnd) return 'eruption';
        if (vT < VS_TIMES.coolEnd) return 'fin';
        return 'eteint';
    }
    const vDone = () => vT !== null && vT >= VS_TIMES.coolEnd + 1;

    function vSpawn(k) {
        const p = { k, t: 0, r: Math.random(), r2: Math.random() };
        if (k === 'fount') {
            p.x = 0.5 + (p.r - 0.5) * 0.03; p.y = VS_CRATER_Y - 0.01;
            p.vx = (p.r2 - 0.5) * 0.16; p.vy = -(0.22 + Math.random() * 0.14);
        } else if (k === 'bomb') {
            p.x = 0.5 + (p.r - 0.5) * 0.03; p.y = VS_CRATER_Y - 0.02;
            const side = Math.random() < 0.5 ? -1 : 1;
            p.vx = side * (0.06 + Math.random() * 0.22); p.vy = -(0.45 + Math.random() * 0.35);
            p.sz = 0.6 + Math.random() * 0.9;
        } else if (k === 'ash') p.d = 6 + Math.random() * 3;
        else if (k === 'nuee') p.d = 3.5 + Math.random() * 1.5;
        else p.d = 3 + Math.random() * 1.5;               // gaz
        vparts.push(p);
    }
    function stepVolcano(dt) {
        const prev = vT;
        if (vT !== null) vT += dt;
        const ph = vPhase(), r = riseEnd();
        const rate = {};
        if (ph === 'calme' || ph === 'eteint') rate.gas = 0.8;
        if (ph === 'monte') rate.gas = 3;
        if (ph === 'fin') rate.gas = 2;
        if (vType === 'effusif') {
            if (ph === 'eruption') rate.fount = 40 * (vT < 10 ? 1 : (VS_TIMES.eruptEnd - vT) / 2);
        } else if (vT !== null) {
            if (prev !== null && prev < r && vT >= r) for (let i = 0; i < 22; i++) vSpawn('bomb');   // l'explosion !
            if (vT >= r && vT < 11) rate.ash = 16;
            if (vT >= r && vT < r + 4) rate.bomb = 5;
            if (vT >= r + 2.5 && vT < r + 7) rate.nuee = 9;
        }
        for (const k in rate) {
            acc[k] = (acc[k] || 0) + rate[k] * dt;
            while (acc[k] >= 1) { acc[k] -= 1; vSpawn(k); }
        }
        for (const p of vparts) {
            if (p.k === 'fount' || p.k === 'bomb') {
                p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.k === 'bomb' ? 1.1 : 1.0) * dt;
                if (p.k === 'fount' && p.vy > 0 && p.y > VS_CRATER_Y - 0.005) p.dead = true;
                if (p.k === 'bomb' && p.vy > 0 && p.y >= _vsConeY(p.x) - 0.004) {
                    p.dead = true;
                    if (landed.length < 45 && p.x > 0 && p.x < 1) landed.push([p.x, _vsConeY(p.x) - 0.004, p.sz]);
                }
                if (p.x < -0.05 || p.x > 1.05 || p.y > 1.1) p.dead = true;
            } else {
                p.t += dt / p.d;
                if (p.t >= 1) p.dead = true;
            }
        }
        vparts = vparts.filter(p => !p.dead);
        if (vDone() && !vparts.some(p => p.k !== 'gas')) setPlaying(false);
    }
    function vPartPos(p) {
        const t = p.t;
        if (p.k === 'ash') {
            const e = 1 - (1 - t) * (1 - t);
            return [0.5 + (p.r - 0.5) * (0.06 + 0.42 * t) + 0.10 * t * t, VS_CRATER_Y - 0.02 - (0.17 + 0.06 * p.r2) * e - 0.02 * t];
        }
        if (p.k === 'nuee') {
            const a = _vsAt(VS_NUEE, VS_NUEE_L, Math.pow(t, 0.8));
            return [a[0], a[1] - 0.03 * t * p.r2];
        }
        return [0.5 + (p.r - 0.5) * 0.04 + 0.05 * t, VS_CRATER_Y - 0.02 - 0.14 * t];   // gaz
    }
    function magmaLevel() {
        const r = riseEnd(), top = vType === 'explosif' ? 0.9 : 1;
        if (vT === null) return 0.12;
        if (vT < r) return 0.12 + (top - 0.12) * (vT / r);
        if (vT < VS_TIMES.eruptEnd) return 1;
        return Math.max(0.12, 1 - 0.88 * (vT - VS_TIMES.eruptEnd) / (VS_TIMES.coolEnd - VS_TIMES.eruptEnd));
    }

    function drawFlow(pts, L, p, w, cool) {
        if (p <= 0) return;
        const P = _vsPartial(pts, L, p);
        const line = (col, lw) => {
            ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            pathPts(P, false); ctx.stroke();
        };
        line(_vsMix('#7a1e0c', '#241c1a', cool), w + 3);
        line(_vsMix('#ff5a14', '#3d3330', cool), w);
        if (cool < 1) { ctx.globalAlpha = 1 - cool; line('#ffd23a', Math.max(1.5, w * 0.35)); ctx.globalAlpha = 1; }
        if (cool < 0.5 && p < 1) {           // front de la coulée, très chaud
            const f = P[P.length - 1];
            const g = ctx.createRadialGradient(X(f[0]), Y(f[1]), 0, X(f[0]), Y(f[1]), w * 1.4);
            g.addColorStop(0, 'rgba(255,220,90,0.95)'); g.addColorStop(1, 'rgba(255,90,20,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(f[0]), Y(f[1]), w * 1.4, 0, 2 * Math.PI); ctx.fill();
        }
    }

    function drawVolcanScene() {
        const m = Math.min(cssW, cssH);
        const ph = vPhase(), r = riseEnd();
        const sel = vPart >= 0 ? VS_V_PARTS[vPart] : null;
        const expl = vType === 'explosif';
        const ashK = expl && vT !== null ? _vsClamp((vT - r) / 2) * _vsClamp((VS_TIMES.coolEnd + 2 - vT) / 4) : 0;
        const dotR = Math.max(1.8, m * 0.006);

        // Le sol tremble quand le magma monte, et très fort au moment de l'explosion
        let sh = 0;
        if (ph === 'monte') sh = m * 0.004 * (vT / r) * (expl ? 1.6 : 1);
        if (expl && vT !== null && vT >= r && vT < r + 0.8) sh = m * 0.014 * (1 - (vT - r) / 0.8);
        ctx.save();
        if (sh > 0) ctx.translate(sh * Math.sin(simTime * 55), sh * 0.5 * Math.cos(simTime * 47));

        // Ciel (s'assombrit sous les cendres)
        const sky = ctx.createLinearGradient(0, 0, 0, Y(VS_SURF_V));
        sky.addColorStop(0, _vsMix('#6eaee3', '#59524e', ashK)); sky.addColorStop(1, _vsMix('#d4ebf7', '#9a918a', ashK));
        ctx.fillStyle = sky; ctx.fillRect(-30, -30, cssW + 60, Y(VS_SURF_V) + 30);
        if (ashK < 0.9) {
            drawCloud(X(0.12), Y(0.16), m * 0.04, '#ffffff', 0.85 * (1 - ashK));
            drawCloud(X(0.86), Y(0.10), m * 0.035, '#ffffff', 0.85 * (1 - ashK));
        }

        // Sous-sol en coupe : couches de roches
        const bands = [['#a5835f', VS_SURF_V, 0.69], ['#c09a6e', 0.69, 0.75], ['#8f7155', 0.75, 0.80], ['#6f625b', 0.80, 1.1]];
        for (const [c, y0, y1] of bands) { ctx.fillStyle = c; ctx.fillRect(-30, Y(y0), cssW + 60, Y(y1) - Y(y0) + 1); }
        ctx.fillStyle = '#5f9043';
        ctx.fillRect(-30, Y(VS_SURF_V) - 3, X(VS_CONE_L) + 30, 5);
        ctx.fillRect(X(VS_CONE_R), Y(VS_SURF_V) - 3, cssW - X(VS_CONE_R) + 30, 5);

        // Cône : couches de lave et de cendres empilées
        const conePath = () => { pathPts(VS_CONE_PTS, true); };
        ctx.save();
        conePath(); ctx.clip();
        const k = (VS_APEX_L[0] - VS_CONE_L) / (VS_SURF_V - VS_APEX_L[1]);
        for (let i = 0; i < 9; i++) {
            const d = i * 0.045, ay = 0.19 + d, half = (VS_SURF_V - ay) * k + 0.06;
            ctx.beginPath();
            ctx.moveTo(X(0.5 - half), Y(VS_SURF_V + 0.01)); ctx.lineTo(X(0.5), Y(ay)); ctx.lineTo(X(0.5 + half), Y(VS_SURF_V + 0.01));
            ctx.closePath();
            ctx.fillStyle = i % 2 ? '#a08c78' : '#6a5a52';
            ctx.fill();
        }
        ctx.restore();
        conePath(); ctx.strokeStyle = '#3f322d'; ctx.lineWidth = 2; ctx.stroke();

        // Cheminée et magma
        const wT = 0.011, wB = 0.02;
        const chimX = y => wT + (wB - wT) * (y - VS_CHIM_TOP) / (VS_CHIM_BOT - VS_CHIM_TOP);
        const chim = (y0, y1) => [[0.5 - chimX(y0), y0], [0.5 + chimX(y0), y0], [0.5 + chimX(y1), y1], [0.5 - chimX(y1), y1]];
        pathPts(chim(VS_CHIM_TOP, VS_CHIM_BOT + 0.02), true); ctx.fillStyle = '#2e2320'; ctx.fill();
        const lvl = magmaLevel();
        const yL = VS_CHIM_BOT - lvl * (VS_CHIM_BOT - VS_CHIM_TOP);
        const mg = ctx.createLinearGradient(0, Y(yL), 0, Y(VS_CHIM_BOT));
        mg.addColorStop(0, '#ffb02e'); mg.addColorStop(1, '#c8281a');
        pathPts(chim(yL, VS_CHIM_BOT + 0.02), true); ctx.fillStyle = mg; ctx.fill();

        // Chambre magmatique
        const [cx, cy, rx, ry] = VS_CHAMBER;
        const pulse = vT !== null && vT < VS_TIMES.eruptEnd ? 0.5 + 0.5 * Math.sin(simTime * 4) : 0;
        const glow = ctx.createRadialGradient(X(cx), Y(cy), 0, X(cx), Y(cy), X(rx) * 1.5);
        glow.addColorStop(0, `rgba(255,120,40,${0.35 + 0.25 * pulse})`); glow.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), X(rx) * 1.5, Y(ry) * 1.8, 0, 0, 2 * Math.PI); ctx.fill();
        const cg = ctx.createRadialGradient(X(cx), Y(cy - ry * 0.3), 0, X(cx), Y(cy), X(rx));
        cg.addColorStop(0, '#ffd25a'); cg.addColorStop(0.5, '#ff6a1a'); cg.addColorStop(1, '#a3200f');
        ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), X(rx), Y(ry), 0, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,180,0.55)';
        for (let i = 0; i < 9; i++) {
            const bx = cx + rx * 0.75 * Math.sin(i * 2.4 + simTime * 0.6), by = cy + ry * 0.5 * Math.cos(i * 1.7 + simTime * 0.9);
            ctx.beginPath(); ctx.arc(X(bx), Y(by), dotR * (0.6 + (i % 3) * 0.3), 0, 2 * Math.PI); ctx.fill();
        }
        const fsn = Math.max(10, Math.min(15, cssW / 70));
        ctx.font = `900 ${fsn}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText('MAGMA', X(cx), Y(cy));

        // Bouchon de lave visqueuse (avant l'explosion)
        if (expl && (vT === null || vT < r)) {
            const k2 = vT === null ? 0.15 : vT / r;
            ctx.fillStyle = '#4b3f3b';
            ctx.beginPath(); ctx.ellipse(X(0.5), Y(VS_CRATER_Y - 0.004), X(0.04), Y(0.022), 0, Math.PI, 2 * Math.PI); ctx.fill();
            ctx.fillRect(X(0.46), Y(VS_CRATER_Y - 0.005), X(0.08), Y(0.012));
            ctx.strokeStyle = `rgba(255,${Math.round(90 + 80 * k2)},40,${0.35 + 0.6 * k2})`;
            ctx.lineWidth = 1.5 + 1.5 * k2;
            ctx.beginPath();
            ctx.moveTo(X(0.475), Y(VS_CRATER_Y)); ctx.lineTo(X(0.49), Y(VS_CRATER_Y - 0.014)); ctx.lineTo(X(0.5), Y(VS_CRATER_Y - 0.008)); ctx.lineTo(X(0.515), Y(VS_CRATER_Y - 0.02));
            ctx.moveTo(X(0.522), Y(VS_CRATER_Y)); ctx.lineTo(X(0.53), Y(VS_CRATER_Y - 0.012));
            ctx.stroke();
        }
        // Lac de lave dans le cratère (éruption effusive)
        if (!expl && vT !== null && vT >= r * 0.7 && vT < VS_TIMES.coolEnd) {
            const c = _vsClamp((vT - VS_TIMES.eruptEnd) / (VS_TIMES.coolEnd - VS_TIMES.eruptEnd));
            ctx.fillStyle = _vsMix('#ff7a1a', '#3d3330', c);
            ctx.beginPath(); ctx.ellipse(X(0.5), Y(VS_CRATER_Y - 0.008), X(0.045), Y(0.012), 0, 0, 2 * Math.PI); ctx.fill();
        }

        // Arbres au pied du volcan
        for (const tx of VS_TREES_V) drawTree(X(tx), Y(VS_SURF_V) - 1, m * 0.06, 0);

        // Coulées de lave (éruption effusive) : elles restent, refroidies, après l'éruption
        if (!expl && vT !== null && vT >= r) {
            const cool = _vsClamp((vT - VS_TIMES.eruptEnd) / (VS_TIMES.coolEnd - VS_TIMES.eruptEnd));
            drawFlow(VS_LAVA_L, VS_LAVA_L_L, _vsClamp((vT - r) / 8), m * 0.016, cool);
            drawFlow(VS_LAVA_R, VS_LAVA_R_L, _vsClamp((vT - r - 1.5) / 7), m * 0.012, cool);
        }
        // Bombes retombées
        ctx.fillStyle = '#2b2422';
        for (const [x, y, s] of landed) { ctx.beginPath(); ctx.arc(X(x), Y(y), dotR * 1.5 * s, 0, 2 * Math.PI); ctx.fill(); }

        // Particules : nuée ardente, cendres, gaz, fontaines, bombes
        for (const p of vparts) {
            if (p.k === 'nuee') {
                const [x, y] = vPartPos(p);
                ctx.globalAlpha = 0.8 * Math.min(1, (1 - p.t) / 0.3);
                ctx.fillStyle = p.r > 0.5 ? '#7a6158' : '#a0806f';
                ctx.beginPath(); ctx.arc(X(x), Y(y), m * (0.012 + 0.035 * p.t), 0, 2 * Math.PI); ctx.fill();
            }
        }
        for (const p of vparts) {
            if (p.k !== 'ash' && p.k !== 'gas') continue;
            const [x, y] = vPartPos(p);
            const fade = Math.min(1, p.t / 0.08, (1 - p.t) / 0.25);
            if (p.k === 'ash') {
                ctx.globalAlpha = 0.85 * fade;
                ctx.fillStyle = p.r2 > 0.5 ? '#6e6762' : '#8a827c';
                ctx.beginPath(); ctx.arc(X(x), Y(y), m * (0.012 + 0.05 * p.t), 0, 2 * Math.PI); ctx.fill();
            } else {
                ctx.globalAlpha = 0.55 * fade;
                ctx.fillStyle = '#f5f5f4';
                ctx.beginPath(); ctx.arc(X(x), Y(y), m * (0.008 + 0.02 * p.t), 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        for (const p of vparts) {
            if (p.k === 'fount') {
                ctx.fillStyle = p.r > 0.5 ? '#ffb02e' : '#ff5a14';
                ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), dotR * 1.1, 0, 2 * Math.PI); ctx.fill();
            } else if (p.k === 'bomb') {
                const rr = dotR * 1.6 * p.sz;
                ctx.fillStyle = '#2b2422'; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), rr, 0, 2 * Math.PI); ctx.fill();
                ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), rr * 0.45, 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.restore();   // fin de la secousse

        // Repère de la partie choisie (visible même avant l'éruption)
        if (sel) {
            ctx.save();
            ctx.strokeStyle = sel.color; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
            if (sel.id === 'chambre') { ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), X(rx) + 8, Y(ry) + 8, 0, 0, 2 * Math.PI); ctx.stroke(); }
            else if (sel.id === 'cheminee') { pathPts(chim(VS_CHIM_TOP, VS_CHIM_BOT + 0.02), true); ctx.lineWidth = 4; ctx.stroke(); }
            else if (sel.id === 'cratere') { ctx.beginPath(); ctx.arc(X(0.5), Y(0.245), m * 0.065, 0, 2 * Math.PI); ctx.stroke(); }
            else if (sel.id === 'cone') { ctx.lineWidth = 5; pathPts(VS_CONE_PTS, false); ctx.stroke(); }
            else if (sel.id === 'coulee') { ctx.lineWidth = 4; pathPts(VS_LAVA_L, false); ctx.stroke(); pathPts(VS_LAVA_R, false); ctx.stroke(); }
            else if (sel.id === 'panache') { ctx.beginPath(); ctx.ellipse(X(0.53), Y(0.12), X(0.2), Y(0.11), 0, 0, 2 * Math.PI); ctx.stroke(); }
            else if (sel.id === 'nuee') { ctx.lineWidth = 4; pathPts(VS_NUEE, false); ctx.stroke(); }
            else if (sel.id === 'bombes') {
                for (const [ex, ey] of [[0.27, 0.44], [0.73, 0.44], [0.86, 0.62]]) {
                    ctx.beginPath(); ctx.moveTo(X(0.5), Y(VS_CRATER_Y - 0.02));
                    ctx.quadraticCurveTo(X((0.5 + ex) / 2), Y(-0.02), X(ex), Y(ey)); ctx.stroke();
                }
            }
            ctx.restore();
        }

        // Mention « vue en coupe »
        ctx.font = `700 italic ${Math.max(10, Math.min(13, cssW / 80))}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('Vue en coupe du volcan', 8, Y(VS_SURF_V) + 22);

        drawLabels(VS_V_PARTS, vPart, s => !s.type || s.type === vType);
    }

    // =====================================================================
    //  ONGLET « LES SÉISMES »
    // =====================================================================
    const vpx = () => 0.32 * Math.max(cssW, cssH);              // vitesse des ondes (px/s)
    const emitDur = () => 0.6 + 0.35 * (qMag - 2);
    const shakeDur = () => 0.6 + 0.3 * (qMag - 2);
    const qEnd = () => SS_RUPT + emitDur() + Math.hypot(cssW, cssH) / vpx() + shakeDur() * 2.5;
    const qDone = () => qT !== null && qT >= qEnd();
    function sPhase() {
        if (qT === null) return 'calme';
        if (qT < SS_RUPT) return 'tension';
        if (qT < SS_RUPT + 0.6) return 'rupture';
        if (qT < qEnd()) return 'ondes';
        return 'fini';
    }
    const slipNow = () => qT === null || qT < SS_RUPT ? 0 : Math.min(1, (qT - SS_RUPT) / 0.4) * (0.008 + 0.004 * (qMag - 2));
    const surfAt = (x, slip) => x > _ssFaultX(SS_SURF) ? SS_SURF + slip : SS_SURF;

    // Secousse et dégâts à un point de la surface (calcul direct, sans mémoire)
    function quakeAt(xn, yn, t) {
        if (t === null || t === undefined) return { dx: 0, dmg: 0, amp: 0 };
        const m = Math.min(cssW, cssH);
        const dist = Math.hypot(X(xn) - X(SS_FOYER[0]), Y(yn) - Y(SS_FOYER[1]));
        const dn = dist / Math.max(cssW, cssH);
        const ta = SS_RUPT + dist / vpx();
        if (t < ta) return { dx: 0, dmg: 0, amp: 0 };
        const amp = Math.min(m * 0.03, m * 0.006 * Math.pow(1.7, qMag - 4) / (1 + 3 * dn));
        const e = Math.exp(-(t - ta) / shakeDur());
        const I = qMag - 1.3 - 6 * Math.abs(xn - SS_FOYER[0]);   // intensité : plus forte près de l'épicentre
        return { dx: amp * e * Math.sin((t - ta) * 30 + xn * 20), dmg: I >= 5.4 ? 2 : I >= 3.6 ? 1 : 0, amp: e };
    }
    function sismoSample(t) {
        const noise = (Math.random() - 0.5) * 0.04;
        if (t === null) return noise;
        const dist = Math.hypot(X(SS_STATION) - X(SS_FOYER[0]), Y(SS_SURF) - Y(SS_FOYER[1]));
        const dn = dist / Math.max(cssW, cssH);
        const ta = SS_RUPT + dist / vpx();
        if (t < ta) return noise;
        const A = Math.min(1.3, 0.12 * Math.pow(1.75, qMag - 2) / (1 + 1.5 * dn));
        const e = Math.exp(-(t - ta) / shakeDur());
        return noise + A * e * Math.sin((t - ta) * 46) * (0.65 + 0.35 * Math.random());
    }
    function stepSeisme(dt) {
        if (qT !== null) qT += dt;
        seisAcc += dt * 50;
        while (seisAcc >= 1) {
            seisAcc -= 1;
            sTime += 1 / 50;
            if (seis.length < 2000) seis.push(sismoSample(qT === null ? null : sTime));
        }
        if (qDone()) setPlaying(false);
    }
    function damageSummary() {
        let d1 = 0, d2 = 0;
        for (const [hx] of SS_HOUSES) {
            const q = quakeAt(hx, surfAt(hx, slipNow()), qT);
            if (q.dmg === 1) d1++; else if (q.dmg === 2) d2++;
        }
        return { d1, d2 };
    }

    function drawHouse(x, yb, s, col, roof, dmg, dx) {
        ctx.save();
        ctx.translate(x + dx, yb);
        if (dmg >= 2) {         // maison effondrée : décombres + bâtiment penché
            ctx.fillStyle = '#9c8f86';
            for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-s * 0.55 + i * s * 0.28, -s * 0.03, s * (0.07 + (i % 2) * 0.04), 0, 2 * Math.PI); ctx.fill(); }
            ctx.rotate(-0.16);
        }
        ctx.fillStyle = col; ctx.fillRect(-s * 0.5, -s * 0.7, s, s * 0.7);
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(-s * 0.5, -s * 0.7, s, s * 0.7);
        ctx.fillStyle = roof;
        ctx.beginPath();
        if (dmg >= 2) { ctx.moveTo(-s * 0.62, -s * 0.66); ctx.lineTo(-s * 0.05, -s * 1.02); ctx.lineTo(s * 0.5, -s * 0.72); }
        else { ctx.moveTo(-s * 0.62, -s * 0.68); ctx.lineTo(0, -s * 1.1); ctx.lineTo(s * 0.62, -s * 0.68); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6d4a2b'; ctx.fillRect(-s * 0.1, -s * 0.32, s * 0.2, s * 0.32);
        ctx.fillStyle = '#bfe3ff'; ctx.fillRect(-s * 0.38, -s * 0.56, s * 0.2, s * 0.17); ctx.fillRect(s * 0.18, -s * 0.56, s * 0.2, s * 0.17);
        if (dmg >= 1) {          // fissures
            ctx.strokeStyle = '#2b2422'; ctx.lineWidth = Math.max(1.2, s * 0.03);
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, -s * 0.7); ctx.lineTo(-s * 0.22, -s * 0.55); ctx.lineTo(-s * 0.3, -s * 0.42); ctx.lineTo(-s * 0.2, -s * 0.3);
            ctx.moveTo(s * 0.45, -s * 0.3); ctx.lineTo(s * 0.32, -s * 0.2); ctx.lineTo(s * 0.4, -s * 0.08);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawSeismeScene() {
        const m = Math.min(cssW, cssH), S = SS_SURF;
        const ph = sPhase();
        const sel = sPart >= 0 ? VS_S_PARTS[sPart] : null;
        const slip = slipNow();
        const magK = (qMag - 2) / 7;

        // Ciel
        const sky = ctx.createLinearGradient(0, 0, 0, Y(S));
        sky.addColorStop(0, '#6eaee3'); sky.addColorStop(1, '#d4ebf7');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, cssW, Y(S) + Y(0.05));
        drawCloud(X(0.10), Y(0.10), m * 0.035, '#ffffff', 0.9);
        drawCloud(X(0.36), Y(0.07), m * 0.03, '#ffffff', 0.8);

        // Deux blocs de roches séparés par la faille ; le bloc de droite descend lors de la rupture
        const fBot = _ssFaultX(1.06);
        const leftPoly = [[-0.05, S], [SS_F1[0], S], [fBot, 1.06], [-0.05, 1.06]];
        const rightPoly = [[_ssFaultX(S + slip), S + slip], [1.05, S + slip], [1.05, 1.06], [fBot, 1.06]];
        const bandCols = ['#c9a77c', '#a98660', '#d8bf95', '#9c7a56', '#c2a274', '#8f7262', '#b39a7a', '#7d6b60', '#a58d73'];
        const drawBlock = (poly, off, shade) => {
            ctx.save();
            pathPts(poly, true); ctx.clip();
            for (let i = 0; i < bandCols.length + 2; i++) {
                const y0 = S + off + i * 0.075;
                ctx.fillStyle = bandCols[i % bandCols.length];
                ctx.fillRect(0, Y(y0), cssW, Y(0.075) + 1);
            }
            ctx.fillStyle = bandCols[0]; ctx.fillRect(0, Y(S + off) - Y(0.08), cssW, Y(0.08));
            if (shade) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 0, cssW, cssH); }
            ctx.restore();
        };
        drawBlock(leftPoly, 0, false);
        drawBlock(rightPoly, slip, true);
        // Herbe
        ctx.fillStyle = '#5f9043';
        ctx.fillRect(0, Y(S) - 3, X(SS_F1[0]), 6);
        ctx.fillRect(X(_ssFaultX(S + slip)), Y(S + slip) - 3, cssW, 6);

        // Faille
        const ruptK = qT !== null && qT >= SS_RUPT ? Math.max(0, 1 - (qT - SS_RUPT) / 1.2) : 0;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(X(fBot), Y(1.06)); ctx.lineTo(X(SS_F1[0]), Y(S));
        if (ruptK > 0) { ctx.strokeStyle = `rgba(230,40,30,${0.4 + 0.6 * ruptK})`; ctx.lineWidth = 4 + 6 * ruptK; ctx.stroke(); }
        ctx.strokeStyle = '#3b2a20'; ctx.lineWidth = 2.5; ctx.setLineDash([10, 6]); ctx.stroke();
        ctx.restore();

        // Flèches : les blocs sont poussés en sens opposés
        if (ph === 'tension' || (sel && sel.id === 'faille')) {
            const pul = ph === 'tension' ? 0.5 + 0.5 * Math.sin(simTime * 8) : 1;
            const a0 = [X(SS_F0[0]), Y(SS_F0[1])], a1 = [X(SS_F1[0]), Y(S)];
            const len = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
            const ux = (a1[0] - a0[0]) / len, uy = (a1[1] - a0[1]) / len, nx = -uy, ny = ux;
            const mid = [a0[0] + (a1[0] - a0[0]) * 0.55, a0[1] + (a1[1] - a0[1]) * 0.55];
            const off = m * 0.07, L = m * 0.09, w = Math.max(3, m * 0.011);
            ctx.globalAlpha = 0.55 + 0.45 * pul;
            const lc = [mid[0] + nx * off, mid[1] + ny * off], rc = [mid[0] - nx * off, mid[1] - ny * off];
            drawArrow([lc[0] - ux * L / 2, lc[1] - uy * L / 2], [lc[0] + ux * L / 2, lc[1] + uy * L / 2], '#b91c1c', w);
            drawArrow([rc[0] + ux * L / 2, rc[1] + uy * L / 2], [rc[0] - ux * L / 2, rc[1] - uy * L / 2], '#b91c1c', w);
            ctx.globalAlpha = 1;
        }

        // Ondes sismiques : des cercles qui partent du foyer
        const F = [X(SS_FOYER[0]), Y(SS_FOYER[1])];
        if (showWaves && qT !== null && qT >= SS_RUPT) {
            const maxR = Math.hypot(cssW, cssH);
            ctx.save();
            ctx.beginPath(); ctx.rect(0, Y(S) - 2, cssW, cssH); ctx.clip();
            for (let te = SS_RUPT; te < SS_RUPT + emitDur(); te += 0.3) {
                const rr = (qT - te) * vpx();
                if (rr <= 0 || rr > maxR) continue;
                const hl = sel && sel.id === 'ondes' ? 1.3 : 1;
                ctx.strokeStyle = `rgba(217,95,20,${Math.max(0, 0.85 * (1 - rr / maxR) * (0.45 + 0.55 * magK))})`;
                ctx.lineWidth = (1.5 + 3.5 * magK) * hl;
                ctx.beginPath(); ctx.arc(F[0], F[1], rr, 0, 2 * Math.PI); ctx.stroke();
            }
            ctx.restore();
        }

        // Foyer → épicentre
        const E = [X(SS_FOYER[0]), Y(S)];
        ctx.save();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(70,40,120,0.75)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(F[0], F[1]); ctx.lineTo(E[0], E[1]); ctx.stroke();
        ctx.restore();
        const fPul = ph === 'rupture' || ph === 'tension' ? 1 + 0.25 * Math.sin(simTime * 14) : 1;
        drawStar(F[0], F[1], m * 0.032 * fPul, m * 0.014 * fPul, 8, qT !== null && qT >= SS_RUPT ? '#ff6a1a' : '#f2b48e', '#7c2d12');
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2.5;
        for (const rr of [m * 0.012, m * 0.026]) { ctx.beginPath(); ctx.ellipse(E[0], E[1], rr * 1.6, rr * 0.6, 0, 0, 2 * Math.PI); ctx.stroke(); }

        // Arbres et maisons : ils tremblent quand les ondes arrivent
        const hs = m * 0.075;
        for (const tx of SS_TREES) {
            const sy = surfAt(tx, slip);
            drawTree(X(tx), Y(sy), m * 0.065, quakeAt(tx, sy, qT).dx);
        }
        for (const [hx, col, roof] of SS_HOUSES) {
            const sy = surfAt(hx, slip), q = quakeAt(hx, sy, qT);
            drawHouse(X(hx), Y(sy), hs, col, roof, q.dmg, q.dx);
        }

        // Station sismique
        const sy0 = surfAt(SS_STATION, slip), sq = quakeAt(SS_STATION, sy0, qT);
        const stx = X(SS_STATION) + sq.dx, sty = Y(sy0);
        ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5;
        ctx.fillRect(stx - hs * 0.35, sty - hs * 0.45, hs * 0.7, hs * 0.45); ctx.strokeRect(stx - hs * 0.35, sty - hs * 0.45, hs * 0.7, hs * 0.45);
        ctx.beginPath(); ctx.moveTo(stx, sty - hs * 0.45); ctx.lineTo(stx, sty - hs * 0.95); ctx.stroke();
        ctx.fillStyle = qT !== null && qT >= SS_RUPT && !qDone() ? (Math.sin(simTime * 10) > 0 ? '#ef4444' : '#7f1d1d') : '#64748b';
        ctx.beginPath(); ctx.arc(stx, sty - hs * 0.95, hs * 0.07, 0, 2 * Math.PI); ctx.fill();

        // Sismogramme (en haut à droite)
        const bx = X(0.6), by = Y(0.03), bw = X(0.385), bh = Y(0.24);
        sismoBox = { x: bx, y: by, w: bw, h: bh };
        ctx.save();
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(29,79,134,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(stx, sty - hs * 0.95); ctx.lineTo(stx, by + bh); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#fffdf6'; roundRect(bx, by, bw, bh, 8); ctx.fill();
        ctx.strokeStyle = sel && sel.id === 'sismographe' ? '#1d4f86' : '#8a96a6'; ctx.lineWidth = sel && sel.id === 'sismographe' ? 3 : 1.5; ctx.stroke();
        ctx.save();
        roundRect(bx + 2, by + 2, bw - 4, bh - 4, 6); ctx.clip();
        ctx.strokeStyle = 'rgba(29,79,134,0.12)'; ctx.lineWidth = 1;
        for (let gx = bx; gx < bx + bw; gx += bw / 16) { ctx.beginPath(); ctx.moveTo(gx, by); ctx.lineTo(gx, by + bh); ctx.stroke(); }
        for (let gy = by; gy < by + bh; gy += bh / 6) { ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + bw, gy); ctx.stroke(); }
        const fs2 = Math.max(10, Math.min(13, bw / 26));
        ctx.font = `800 ${fs2}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#1d4f86';
        ctx.fillText('📈 Sismogramme', bx + 8, by + 6);
        const mid = by + bh * 0.6, amp = bh * 0.34;
        // tout l'enregistrement du séisme tient dans le cadre (il ne défile pas)
        const x0 = bx + 6, xw = bw - 12, n = seis.length;
        const tot = Math.max(SS_N, qT !== null ? Math.ceil(qEnd() * 50) : 0, n);
        ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (n === 0) { ctx.moveTo(x0, mid); ctx.lineTo(x0 + xw, mid); }
        for (let i = 0; i < n; i++) {
            const x = x0 + xw * (i / (tot - 1));
            const y = mid - Math.max(-1.25, Math.min(1.25, seis[i])) * amp;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        const lastY = n ? mid - Math.max(-1.25, Math.min(1.25, seis[n - 1])) * amp : mid;
        ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(n ? x0 + xw * ((n - 1) / (tot - 1)) : x0, lastY, 3.5, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();

        // Partie choisie : repères
        if (sel && sel.id === 'foyer') { ctx.strokeStyle = sel.color; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(F[0], F[1], m * 0.06, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
        if (sel && sel.id === 'epicentre') { ctx.strokeStyle = sel.color; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(E[0], E[1] - hs * 0.4, m * 0.07, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }

        // Mention « vue en coupe »
        ctx.font = `700 italic ${Math.max(10, Math.min(13, cssW / 80))}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('Vue en coupe du sol', 8, Y(S) + 10);

        drawLabels(VS_S_PARTS, sPart, () => true);
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        ctx.setLineDash([]);
        if (mode === 'volcan') drawVolcanScene(); else drawSeismeScene();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function partsList(parts, cur, tagOf) {
        return `<ol class="vs-steps">${parts.map((p, i) =>
            `<li><button data-part="${i}" class="${cur === i ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}${tagOf ? tagOf(p) : ''}</button></li>`).join('')}
            <li><button data-part="-1" class="${cur < 0 ? 'on' : ''}" style="--st-c:#7c2d12">🔄 Vue d'ensemble</button></li></ol>`;
    }
    function updatePlayBtn() {
        const t = mode === 'volcan' ? vT : qT;
        const done = mode === 'volcan' ? vDone() : qDone();
        let txt;
        if (t === null) txt = mode === 'volcan' ? '🌋 Lancer l\'éruption' : '💥 Déclencher le séisme';
        else if (done && !playing) txt = mode === 'volcan' ? '🌋 Relancer l\'éruption' : '💥 Relancer le séisme';
        else txt = playing ? '⏸ Pause' : '▶ Reprendre';
        if (playBtn.textContent !== txt) playBtn.textContent = txt;
        playBtn.classList.toggle('on', playing);
    }
    function updateInfo() {
        updatePlayBtn();
        magVal.textContent = fmtMag(mag);
        if (Number(magSl.value) !== mag) magSl.value = mag;
        row2.querySelectorAll('.vs-type').forEach(b => b.classList.toggle('on', b.dataset.vtype === vType));
        gestesBtn.classList.toggle('on', sPart === GESTES);

        const key = mode === 'volcan'
            ? ['v', vPart, vType, vPhase()].join('|')
            : ['s', sPart, sPhase(), mag, qMag].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        if (mode === 'volcan') {
            const T = VS_V_TYPES[vType], P = VS_V_PHASES[vPhase()];
            const phName = vPhase() === 'eruption' ? T.name + ' !' : P[1];
            const status = `<div class="vs-status">${P[0]} <span style="color:${P[2]}">${phName}</span></div>`;
            const tag = p => p.type ? ` <span class="vs-tag">(${p.type === 'effusif' ? 'effusive' : 'explosive'})</span>` : '';
            if (vPart < 0) {
                side.style.borderLeftColor = T.color;
                side.innerHTML = `<h4>Le volcan</h4>${status}
                    <p class="vs-change">${T.ico} ${T.name}</p>
                    <p class="vs-text">${T.text}</p>
                    <p class="vs-text" style="font-size:.92em;color:#6b7280">${T.ex}</p>
                    <p class="vs-know">💡 <b>Le savais-tu ?</b> ${VS_V_OVERVIEW_KNOW}</p>
                    ${partsList(VS_V_PARTS, vPart, tag)}`;
            } else {
                const s = VS_V_PARTS[vPart];
                side.style.borderLeftColor = s.color;
                const wait = s.type && vT === null ? `<p class="vs-note">👉 Appuie sur « 🌋 Lancer l'éruption » pour voir apparaître : ${s.name.toLowerCase()}.</p>` : '';
                side.innerHTML = `<h4>Le volcan</h4>${status}
                    <div class="vs-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <p class="vs-text">${s.text}</p>${wait}
                    <p class="vs-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${partsList(VS_V_PARTS, vPart, tag)}`;
            }
        } else {
            const ph = sPhase(), P = VS_S_PHASES[ph];
            let phTxt = P[1];
            if (ph === 'fini') {
                const d = damageSummary();
                phTxt += d.d1 + d.d2 === 0 ? ' — aucun dégât' : ` — ${d.d1 + d.d2} maison${d.d1 + d.d2 > 1 ? 's' : ''} abîmée${d.d1 + d.d2 > 1 ? 's' : ''}${d.d2 ? ` (dont ${d.d2} effondrée${d.d2 > 1 ? 's' : ''})` : ''}`;
            }
            const status = `<div class="vs-status">${P[0]} <span style="color:${P[2]}">${phTxt}</span></div>`;
            const shownMag = qT !== null ? qMag : mag;
            const magBox = `<p class="vs-change">📏 Magnitude ${fmtMag(shownMag)} : <span style="font-weight:600">${_vsMagText(shownMag)}</span></p>`;
            if (sPart < 0) {
                side.style.borderLeftColor = '#b45309';
                side.innerHTML = `<h4>Le séisme (tremblement de terre)</h4>${status}${magBox}
                    <p class="vs-text">${VS_S_OVERVIEW.text}</p>
                    <p class="vs-know">💡 <b>Le savais-tu ?</b> ${VS_S_OVERVIEW.know} ${VS_MAG_KNOW}</p>
                    ${partsList(VS_S_PARTS, sPart)}`;
            } else {
                const s = VS_S_PARTS[sPart];
                side.style.borderLeftColor = s.color;
                side.innerHTML = `<h4>Le séisme</h4>${status}
                    <div class="vs-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <div class="vs-text">${s.html || s.text}</div>
                    <p class="vs-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${partsList(VS_S_PARTS, sPart)}`;
            }
        }
    }

    // ── Boucle d'animation ────────────────────────────────────────────────
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    function loop(t) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const rdt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (playing) {
            const dt = rdt * (fast ? 2 : 1);
            simTime += dt;
            if (mode === 'volcan') stepVolcano(dt); else stepSeisme(dt);
        }
        draw();
        if (playing) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        if (playing) startLoop(); else requestDraw();
        updatePlayBtn();
    }
    function setFast(v) {
        fast = !!v;
        speedBtn.textContent = fast ? '🐇 Rapide' : '🐢 Lent';
        speedBtn.classList.toggle('on', fast);
    }
    function resetVolcano() {
        vT = null; vparts = []; landed = [];
        for (const k in acc) acc[k] = 0;
    }
    function resetSeisme() {
        qT = null; seis = []; sTime = 0; seisAcc = 0;
    }
    function startEvent() {
        if (mode === 'volcan') {
            resetVolcano();
            vT = 0;
        } else {
            resetSeisme();
            qMag = mag;
            qT = 0;
        }
        lastInfoKey = '';
        setPlaying(true);
    }
    function setType(t) {
        if (t !== 'effusif' && t !== 'explosif') return;
        if (playing) setPlaying(false);
        vType = t;
        resetVolcano();
        lastInfoKey = '';
        requestDraw();
    }
    function setPart(i) {
        if (mode === 'volcan') {
            vPart = Math.max(-1, Math.min(VS_V_PARTS.length - 1, i));
            const p = VS_V_PARTS[vPart];
            if (p && p.type && p.type !== vType) setType(p.type);
        } else {
            sPart = Math.max(-1, Math.min(VS_S_PARTS.length - 1, i));
        }
        lastInfoKey = '';
        requestDraw();
    }
    function setMode(md) {
        if (playing) setPlaying(false);
        mode = md === 'seisme' ? 'seisme' : 'volcan';
        container.dataset.mode = mode;
        header.querySelectorAll('.vs-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        hint.textContent = mode === 'volcan'
            ? 'Touche une étiquette ou une partie du volcan pour l\'expliquer · 🌋 Lance l\'éruption'
            : 'Choisis la magnitude puis 💥 déclenche le séisme · Touche une étiquette pour l\'expliquer';
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
        return { x: (e.clientX - rc.left) * kx, y: (e.clientY - rc.top) * ky };
    }
    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        if (drag) return;
        e.stopPropagation(); e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });
    // Curseur du dessin : doigt au-dessus d'un élément touchable
    let _cur = '';
    function setCursor(c) { if (c !== _cur) { _cur = c; canvas.style.setProperty('cursor', c, 'important'); } }
    function hoverCursor(e) {
        if (drag) { return; }
        const L = local(e), x = L.x, y = L.y;
        if (labelHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)) { setCursor('pointer'); return; }
        const nx = x / cssW, ny = y / cssH, m = Math.min(cssW, cssH);
        let hit = -1;
        const idx = id => (mode === 'volcan' ? VS_V_PARTS : VS_S_PARTS).findIndex(p => p.id === id);
        if (mode === 'volcan') {
            const [cx, cy, rx, ry] = VS_CHAMBER;
            const r = riseEnd(), expl = vType === 'explosif';
            const nearPath = pts => distToPolyPx(x, y, pts) < Math.max(14, m * 0.03);
            if (Math.pow((nx - cx) / rx, 2) + Math.pow((ny - cy) / ry, 2) <= 1.3) hit = idx('chambre');
            else if (Math.abs(nx - 0.5) < 0.03 && ny > VS_CRATER_Y + 0.03 && ny < VS_CHIM_BOT) hit = idx('cheminee');
            else if (Math.hypot(x - X(0.5), y - Y(0.245)) < m * 0.07) hit = idx('cratere');
            else if (!expl && vT !== null && vT >= r && (nearPath(VS_LAVA_L) || nearPath(VS_LAVA_R))) hit = idx('coulee');
            else if (expl && vT !== null && vT >= r + 2.5 && nearPath(VS_NUEE)) hit = idx('nuee');
            else if (expl && landed.some(([bx, by]) => Math.hypot(x - X(bx), y - Y(by)) < Math.max(14, m * 0.025))) hit = idx('bombes');
            else if (expl && vT !== null && vT >= r && ny < VS_CRATER_Y - 0.02 && Math.abs(nx - 0.55) < 0.25) hit = idx('panache');
            else if (nx > VS_CONE_L && nx < VS_CONE_R && ny >= _vsConeY(nx) && ny <= VS_SURF_V) hit = idx('cone');
        } else {
            const S = SS_SURF, slip = slipNow();
            const F = [X(SS_FOYER[0]), Y(SS_FOYER[1])];
            const b = sismoBox;
            if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) hit = idx('sismographe');
            else if (Math.hypot(x - X(SS_STATION), y - Y(surfAt(SS_STATION, slip)) + m * 0.04) < m * 0.06) hit = idx('sismographe');
            else if (Math.hypot(x - F[0], y - F[1]) < Math.max(18, m * 0.05)) hit = idx('foyer');
            else if (Math.abs(nx - SS_FOYER[0]) < 0.04 && Math.abs(ny - S) < 0.05) hit = idx('epicentre');
            else if (distToPolyPx(x, y, [[_ssFaultX(1.06), 1.06], SS_F1]) < Math.max(14, m * 0.025)) hit = idx('faille');
            else if (ny > S + 0.03 && qT !== null && qT >= SS_RUPT && !qDone()) hit = idx('ondes');
        }
        setCursor(hit >= 0 ? 'pointer' : 'default');
    }
    canvas.addEventListener('pointermove', hoverCursor);
    canvas.addEventListener('pointerup', hoverCursor);
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel') return;
        if (!d.moved) { const L = local(e); onTap(L.x, L.y); }
    }

    function onTap(x, y) {
        const cur = mode === 'volcan' ? vPart : sPart;
        for (const h of labelHits) {
            if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                setPart(cur === h.i ? -1 : h.i);
                if (typeof saveBoard === 'function') saveBoard();
                return;
            }
        }
        const nx = x / cssW, ny = y / cssH, m = Math.min(cssW, cssH);
        let hit = -1;
        const idx = id => (mode === 'volcan' ? VS_V_PARTS : VS_S_PARTS).findIndex(p => p.id === id);
        if (mode === 'volcan') {
            const [cx, cy, rx, ry] = VS_CHAMBER;
            const r = riseEnd(), expl = vType === 'explosif';
            const nearPath = pts => distToPolyPx(x, y, pts) < Math.max(14, m * 0.03);
            if (Math.pow((nx - cx) / rx, 2) + Math.pow((ny - cy) / ry, 2) <= 1.3) hit = idx('chambre');
            else if (Math.abs(nx - 0.5) < 0.03 && ny > VS_CRATER_Y + 0.03 && ny < VS_CHIM_BOT) hit = idx('cheminee');
            else if (Math.hypot(x - X(0.5), y - Y(0.245)) < m * 0.07) hit = idx('cratere');
            else if (!expl && vT !== null && vT >= r && (nearPath(VS_LAVA_L) || nearPath(VS_LAVA_R))) hit = idx('coulee');
            else if (expl && vT !== null && vT >= r + 2.5 && nearPath(VS_NUEE)) hit = idx('nuee');
            else if (expl && landed.some(([bx, by]) => Math.hypot(x - X(bx), y - Y(by)) < Math.max(14, m * 0.025))) hit = idx('bombes');
            else if (expl && vT !== null && vT >= r && ny < VS_CRATER_Y - 0.02 && Math.abs(nx - 0.55) < 0.25) hit = idx('panache');
            else if (nx > VS_CONE_L && nx < VS_CONE_R && ny >= _vsConeY(nx) && ny <= VS_SURF_V) hit = idx('cone');
        } else {
            const S = SS_SURF, slip = slipNow();
            const F = [X(SS_FOYER[0]), Y(SS_FOYER[1])];
            const b = sismoBox;
            if (b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) hit = idx('sismographe');
            else if (Math.hypot(x - X(SS_STATION), y - Y(surfAt(SS_STATION, slip)) + m * 0.04) < m * 0.06) hit = idx('sismographe');
            else if (Math.hypot(x - F[0], y - F[1]) < Math.max(18, m * 0.05)) hit = idx('foyer');
            else if (Math.abs(nx - SS_FOYER[0]) < 0.04 && Math.abs(ny - S) < 0.05) hit = idx('epicentre');
            else if (distToPolyPx(x, y, [[_ssFaultX(1.06), 1.06], SS_F1]) < Math.max(14, m * 0.025)) hit = idx('faille');
            else if (ny > S + 0.03 && qT !== null && qT >= SS_RUPT && !qDone()) hit = idx('ondes');
        }
        setPart(hit === cur ? -1 : hit);
        if (typeof saveBoard === 'function') saveBoard();
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
        const b = e.target.closest('button[data-part]');
        if (!b) return;
        e.stopPropagation();
        setPart(Number(b.dataset.part));
        if (typeof saveBoard === 'function') saveBoard();
    });

    header.querySelectorAll('.vs-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    playBtn.addEventListener('click', () => {
        const t = mode === 'volcan' ? vT : qT;
        const done = mode === 'volcan' ? vDone() : qDone();
        if (t === null || (done && !playing)) startEvent();
        else setPlaying(!playing);
    });
    resetBtn.addEventListener('click', () => {
        setPlaying(false);
        if (mode === 'volcan') resetVolcano(); else resetSeisme();
        lastInfoKey = '';
        requestDraw();
    });
    speedBtn.addEventListener('click', () => { setFast(!fast); if (typeof saveBoard === 'function') saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    wavesBtn.addEventListener('click', () => { showWaves = !showWaves; wavesBtn.classList.toggle('on', showWaves); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    gestesBtn.addEventListener('click', () => { setPart(sPart === GESTES ? -1 : GESTES); if (typeof saveBoard === 'function') saveBoard(); });
    row2.querySelectorAll('.vs-type').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.vtype !== vType) setType(b.dataset.vtype);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    magSl.addEventListener('input', () => { mag = Number(magSl.value); lastInfoKey = ''; requestDraw(); });
    magSl.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });

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
            if (typeof saveBoard === 'function') saveBoard();
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
        if (playing) setPlaying(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🌋 Volcans et séismes', {
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
        animId = null; playing = false;
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
    setMode('volcan');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    // (l'animation en cours n'est pas sauvegardée : au rechargement, le
    //  volcan est calme et le séisme n'a pas encore eu lieu)
    widget._vsGetData = () => ({
        containerW: contW, containerH: contH,
        mode, vType, vPart, mag, sPart,
        showLabels, showWaves, fast
    });
    widget._vsSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (d.vType === 'effusif' || d.vType === 'explosif') vType = d.vType;
        resetVolcano(); resetSeisme();
        if (typeof d.vPart === 'number') vPart = Math.max(-1, Math.min(VS_V_PARTS.length - 1, Math.round(d.vPart)));
        if (typeof d.sPart === 'number') sPart = Math.max(-1, Math.min(VS_S_PARTS.length - 1, Math.round(d.sPart)));
        if (typeof d.mag === 'number') { mag = Math.max(2, Math.min(9, Math.round(d.mag * 2) / 2)); qMag = mag; }
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showWaves === 'boolean') { showWaves = d.showWaves; wavesBtn.classList.toggle('on', showWaves); }
        setFast(!!d.fast);
        setMode(d.mode || 'volcan');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_vsSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
