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
// WIDGET L'ÂGE INDUSTRIEL — Le Bureau du Prof
// Pour des élèves de cycle 3 (CM1 – CM2), XIXᵉ siècle. Trois onglets :
//  ⚙️ La machine à vapeur : une machine animée en coupe (foyer, chaudière,
//     manomètre, cylindre, piston, bielle, volant, courroie). On ajoute du
//     charbon : la pression monte et la machine accélère. « Comment ça
//     marche ? » explique les 6 étapes, de la chaleur au mouvement.
//  🏭 L'usine : une filature animée (machine à vapeur, arbres de
//     transmission, métiers à tisser, ouvrières, enfants, contremaître,
//     horloge, règlement, cheminée), avec une fiche pour chaque élément.
//  🏙️ Ville et campagne : un curseur de 1800 à 1930 (▶ Le temps passe).
//     La campagne se vide, la ville grandit (usines, gare, immeubles,
//     pollution) ; des paysans partent vers la ville (l'exode rural).
//     Pourcentage d'urbains, population de Paris et tableau comparatif.
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
    if (document.getElementById('ind-style')) return;
    const s = document.createElement('style');
    s.id = 'ind-style';
    s.textContent = `
        .widget[data-type="histoire-industriel"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ind-container {
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
        .ind-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .ind-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .ind-header .wf-btns { gap: 8px; }
        .ind-header .wf-btn { width: 18px; height: 18px; }
        .ind-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ind-container.wf-fullboard {
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
        .ind-tabs { display: inline-flex; background: #ece9e4; border-radius: 11px; padding: 3px; gap: 3px; }
        .ind-tab {
            min-height: 34px; padding: 4px 13px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .ind-tab.on { background: #fff; color: #7c2d12; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
        .ind-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .ind-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .ind-btn:hover { background: #e0e0e0; }
        .ind-btn:active { transform: scale(0.96); }
        .ind-btn.on { background: #7c2d12; color: #fff; border-color: #7c2d12; }
        .ind-btn-coal { background: #fde8d8; border-color: #f2b48e; color: #9a3412; }
        .ind-btn-coal:hover { background: #fbd5bd; }
        .ind-btn-play.on { background: #16a34a; border-color: #16a34a; }
        .ind-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .ind-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .ind-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 300px; min-width: 220px; }
        .ind-slider { flex: 1; height: 30px; accent-color: #7c2d12; cursor: pointer; touch-action: none; }
        .ind-val { font-size: 16px; font-weight: 900; color: #7c2d12; min-width: 46px; text-align: right; }
        .ind-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .ind-scene-wrap { flex: 1 1 auto; min-width: 0; position: relative; border-radius: 12px; overflow: hidden; background: #efe6d8; }
        .ind-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .ind-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #7c2d12;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .ind-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .ind-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .ind-text { margin: 0 0 6px; }
        .ind-box { background: #f5efe6; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #5b3a17; }
        .ind-date { background: #fdf3e2; border-radius: 8px; padding: 5px 9px; margin: 0 0 6px; color: #7a4b12; font-weight: 800; }
        .ind-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .ind-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .ind-list button, .ind-go {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .ind-list button.on { background: var(--st-c, #7c2d12); color: #fff; }
        .ind-go { text-align: center; background: #f5efe6; color: #7c2d12; margin: 0 0 8px; border-left-width: 1px; }
        .ind-steps { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .ind-steps button {
            width: 100%; text-align: left; border-radius: 8px; border: 1px solid #e0e3e8; background: #fff;
            font-size: 13px; font-weight: 700; font-family: inherit; color: #374151; cursor: pointer; padding: 5px 8px;
            display: flex; gap: 8px; align-items: flex-start; touch-action: manipulation;
        }
        .ind-steps button b { flex: 0 0 22px; height: 22px; border-radius: 50%; background: #7c2d12; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .ind-steps button.on { background: #fff1e6; border-color: #ea580c; box-shadow: 0 0 0 2px #fdba74; }
        .ind-cmp { width: 100%; border-collapse: separate; border-spacing: 0 4px; margin: 0 0 8px; font-size: .93em; }
        .ind-cmp th { text-align: left; font-size: .85em; color: #6b7280; padding: 0 4px; }
        .ind-cmp td { background: #fff; padding: 5px 6px; vertical-align: top; border-top: 1px solid #eee; border-bottom: 1px solid #eee; }
        .ind-cmp td:first-child { font-weight: 800; color: #7c2d12; border-left: 1px solid #eee; border-radius: 8px 0 0 8px; width: 24%; }
        .ind-cmp td:last-child { border-right: 1px solid #eee; border-radius: 0 8px 8px 0; }
        .ind-small { font-weight: 600; opacity: .75; font-size: .9em; }
        .ind-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .ind-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 400px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ind-help-popup.show { display: block; }
        .ind-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .ind-help-popup p { margin: 0 0 6px; }
        .ind-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .ind-resize-handle:hover { opacity: 1; }
        .ind-container:not([data-mode="vapeur"]) .ind-only-vapeur,
        .ind-container:not([data-mode="usine"]) .ind-only-usine,
        .ind-container:not([data-mode="ville"]) .ind-only-ville { display: none !important; }
        .ind-container[data-mode="ville"] .ind-not-ville { display: none !important; }
        .ind-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .ind-tab-short { display: none; }
        .ind-header { min-width: 0; max-width: 100%; }
        .ind-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .ind-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .ind-header .wf-btns { flex-shrink: 0; }
        .ind-container.wf-fullboard .ind-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ind-container { padding: 10px 10px 8px; gap: 6px; }
            .ind-header { gap: 6px; }
            .ind-title { font-size: 13px; }
            .ind-tab { min-height: 32px; padding: 3px 8px; font-size: 12px; }
            .ind-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .ind-row > * { flex-shrink: 0; }
            .ind-container[data-mode="ville"] .ind-row { flex-wrap: wrap; overflow: visible; }
            .ind-slider-box { flex: 1 1 100%; min-width: 0; }
            .ind-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .ind-sep { display: none; }
            .ind-side { padding: 8px 10px; font-size: 13px; }
            .ind-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 620px) {
            .ind-title { display: none; }
            .ind-tab { padding: 3px 7px; font-size: 11.5px; }
            .ind-tab-long { display: none; }
            .ind-tab-short { display: inline; }
            .ind-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .ind-body { flex-direction: column; }
            .ind-scene-wrap { flex: 1 1 0; min-height: 200px; }
            .ind-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 42%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .ind-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="histoire-industriel"], .ind-container, .ind-container * { cursor: default !important; }
        .ind-container .ind-header, .ind-container .ind-header * { cursor: grab !important; }
        .ind-container .ind-header:active, .ind-container .ind-header:active * { cursor: grabbing !important; }
        .ind-container button, .ind-container button *, .ind-container .ind-header button,
        .ind-container .ind-header button *,
        .ind-container input[type="range"] { cursor: pointer !important; }
        .ind-container button:disabled, .ind-container button:disabled *,
        .ind-container .ind-canvas { cursor: default !important; }
        .ind-container input { cursor: text !important; }
        .ind-container .ind-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .ind-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ind-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ind-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .ind-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .ind-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .ind-help-popup { top: 56px; }
        .ind-container.wf-fullboard .ind-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ind-container.wf-fullboard .ind-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .ind-title { font-size: 17px; }
        }
        .ind-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .ind-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .ind-tab:hover { background: rgba(255,255,255,.1); }
        .ind-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .ind-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ind-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .ind-container.wf-fullboard .ind-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .ind-tab { padding: 3px 10px; font-size: 12px; }
            .ind-help-popup { top: 50px; }
        }
        @media (max-width: 620px) {
            .ind-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// =========================================================================
//  CONTENU PÉDAGOGIQUE
// =========================================================================
// La machine à vapeur : parties (zone touchable, point de l'étiquette)
const IND_V_PARTS = [
    { id: 'foyer', ico: '🔥', name: 'Le foyer et le charbon', color: '#dc2626', zone: [0, 430, 325, 565], lab: [150, 585],
      text: 'Dans le <b>foyer</b>, on brûle du <b>charbon</b>. Le charbon, extrait des mines, donne beaucoup de chaleur. Des ouvriers, les chauffeurs, l\'ajoutent à la pelle sans arrêt.',
      know: 'Au XIXᵉ siècle, des milliers de mineurs (et même des enfants) descendaient au fond des mines pour extraire le charbon. Le roman <i>Germinal</i> d\'Émile Zola raconte leur vie très dure.' },
    { id: 'chaudiere', ico: '🫖', name: 'La chaudière', color: '#2563eb', zone: [75, 295, 325, 432], lab: [120, 270],
      text: 'La <b>chaudière</b> est un grand réservoir d\'eau en métal, chauffé par le foyer. L\'eau <b>bout</b> et se transforme en <b>vapeur</b>. La vapeur prend beaucoup plus de place que l\'eau : elle pousse fort sur les parois, c\'est la <b>pression</b>.',
      know: 'C\'est comme le couvercle d\'une casserole qui se soulève quand l\'eau bout ! Le Français Denis Papin l\'avait remarqué dès 1679 avec sa « marmite ».' },
    { id: 'manometre', ico: '⏲️', name: 'Le manomètre et la soupape', color: '#7c3aed', zone: [170, 255, 315, 300], lab: [250, 230],
      text: 'Le <b>manomètre</b> mesure la <b>pression</b> de la vapeur. Si elle devient trop forte, la <b>soupape de sécurité</b> s\'ouvre et laisse sortir de la vapeur, pour que la chaudière n\'explose pas.',
      know: 'Au début, les explosions de chaudières étaient fréquentes et très dangereuses : la soupape de sécurité a sauvé beaucoup de vies.' },
    { id: 'vapeur', ico: '💨', name: 'Le tuyau de vapeur', color: '#0891b2', zone: [290, 200, 535, 305], lab: [415, 185],
      text: 'La vapeur sous pression quitte la chaudière par un <b>tuyau</b> et arrive dans la boîte à vapeur, au-dessus du cylindre. Un <b>tiroir</b> l\'envoie tantôt d\'un côté du piston, tantôt de l\'autre.',
      know: 'La vapeur qui a servi s\'échappe par un petit tuyau : c\'est le fameux « tchou-tchou » des locomotives !' },
    { id: 'cylindre', ico: '🛢️', name: 'Le cylindre et le piston', color: '#ea580c', zone: [405, 300, 640, 435], lab: [520, 455],
      text: 'Dans le <b>cylindre</b>, la vapeur pousse le <b>piston</b> d\'un côté, puis de l\'autre : le piston fait un <b>va-et-vient</b> (on dit un mouvement alternatif). La <b>chaleur</b> est devenue du <b>mouvement</b> !',
      know: 'En 1769, l\'Écossais James Watt améliore beaucoup la machine à vapeur : elle consomme moins de charbon et devient plus puissante.' },
    { id: 'bielle', ico: '🦾', name: 'La bielle', color: '#475569', zone: [640, 340, 800, 420], lab: [700, 300],
      text: 'La <b>bielle</b> est une barre qui relie le piston à la roue. Elle transforme le <b>va-et-vient</b> du piston en un <b>mouvement de rotation</b> : la roue tourne.',
      know: 'On retrouve ce système dans les roues des locomotives à vapeur… et dans le moteur des voitures !' },
    { id: 'volant', ico: '🛞', name: 'Le volant', color: '#92400e', zone: [745, 265, 980, 500], lab: [860, 525],
      text: 'Le <b>volant</b> est une grande roue très lourde. En tournant, il garde son élan et rend le mouvement <b>régulier</b>, même quand le piston change de sens.',
      know: 'Certains volants de machines d\'usine mesuraient plus de 5 mètres de diamètre et pesaient des dizaines de tonnes !' },
    { id: 'courroie', ico: '➰', name: 'La courroie', color: '#16a34a', zone: [800, 30, 920, 270], lab: [745, 150],
      text: 'Une <b>courroie</b> en cuir relie le volant à un long axe qui fait tourner <b>toutes les machines de l\'usine</b> : métiers à tisser, scies, marteaux-pilons… Une seule machine à vapeur peut faire travailler des centaines de machines.',
      know: 'Avant la machine à vapeur, les usines devaient être construites au bord des rivières, pour utiliser la force de l\'eau avec des roues à aubes.' },
    { id: 'cheminee', ico: '🏭', name: 'La cheminée', color: '#57534e', zone: [20, 30, 80, 430], lab: [110, 60],
      text: 'La <b>cheminée</b> évacue la fumée du charbon brûlé. Plus elle est haute, mieux le feu respire. Les villes industrielles sont couvertes de <b>fumées noires</b> : c\'est la pollution.',
      know: 'À cause de la suie, les façades des maisons des villes industrielles devenaient toutes noires.' }
];
const IND_V_STEPS = [
    { part: 'foyer', txt: 'Le charbon brûle dans le foyer : il produit de la chaleur.' },
    { part: 'chaudiere', txt: 'La chaleur fait bouillir l\'eau de la chaudière : elle se transforme en vapeur.' },
    { part: 'vapeur', txt: 'La vapeur, sous pression, va jusqu\'au cylindre par un tuyau.' },
    { part: 'cylindre', txt: 'La vapeur pousse le piston d\'un côté, puis de l\'autre : c\'est un va-et-vient.' },
    { part: 'bielle', txt: 'La bielle transforme ce va-et-vient en rotation : le volant tourne.' },
    { part: 'courroie', txt: 'La courroie transmet le mouvement à toutes les machines de l\'usine.' }
];

// L'usine
const IND_U_PARTS = [
    { id: 'machine', ico: '⚙️', name: 'La machine à vapeur', color: '#7c2d12', zone: [40, 190, 270, 560], lab: [155, 590],
      text: 'Au cœur de l\'usine, dans une salle à part, la <b>machine à vapeur</b> fait tourner toutes les machines. Avant elle, il fallait la force des bras, des animaux, du vent ou de l\'eau.',
      know: 'On mesurait la puissance des machines en <b>chevaux-vapeur</b> : une machine de 100 chevaux-vapeur faisait le travail de 100 chevaux !' },
    { id: 'transmission', ico: '🔄', name: 'Les arbres et les courroies', color: '#16a34a', zone: [270, 120, 960, 185], lab: [600, 108],
      text: 'Un long axe de fer, l\'<b>arbre de transmission</b>, court sous le plafond. Il tourne grâce à la machine à vapeur et entraîne, par des <b>courroies</b> en cuir, chaque métier à tisser.',
      know: 'Ces courroies sans protection étaient très dangereuses : les ouvriers pouvaient y être happés. Les accidents étaient nombreux.' },
    { id: 'metiers', ico: '🧵', name: 'Les métiers à tisser', color: '#2563eb', zone: [290, 340, 940, 480], lab: [700, 330],
      text: 'Les <b>métiers à tisser mécaniques</b> fabriquent du tissu (coton, laine) bien plus vite qu\'à la main. Une usine qui file ou tisse s\'appelle une <b>filature</b>. Les produits, fabriqués en grande quantité, coûtent moins cher.',
      know: 'Le Lyonnais Joseph-Marie Jacquard a inventé vers 1801 un métier à tisser qui suit un programme écrit sur des cartes perforées.' },
    { id: 'ouvrieres', ico: '👩‍🏭', name: 'Les ouvriers et les ouvrières', color: '#be185d', zone: [290, 400, 940, 560], lab: [460, 590],
      text: 'Les <b>ouvriers</b> et les <b>ouvrières</b> travaillent <b>12 à 15 heures par jour</b>, 6 jours sur 7, sans vacances, dans le bruit, la chaleur et la poussière. Ils sont payés très peu : un ouvrier malade ou blessé n\'a plus de salaire.',
      know: 'Les ouvriers s\'unissent pour défendre leurs droits : grèves, puis syndicats (autorisés en France en 1884). Ils obtiennent peu à peu de meilleures conditions.' },
    { id: 'enfants', ico: '🧒', name: 'Les enfants', color: '#ea580c', zone: [520, 470, 620, 565], lab: [570, 610],
      text: 'Des <b>enfants</b>, parfois dès 6 ou 8 ans, travaillent dans les usines et les mines. Petits et agiles, ils se glissent sous les machines pour renouer les fils cassés ou ramasser les déchets de coton. Ils ne vont pas à l\'école.',
      know: 'En 1841, une loi interdit le travail des enfants de moins de 8 ans dans les grandes usines. En 1882, les lois de Jules Ferry rendent l\'école obligatoire de 6 à 13 ans.' },
    { id: 'contremaitre', ico: '🕵️', name: 'Le contremaître', color: '#475569', zone: [860, 390, 955, 560], lab: [905, 370],
      text: 'Le <b>contremaître</b> surveille les ouvriers pour le patron. Il vérifie qu\'ils travaillent vite, qu\'ils ne parlent pas et qu\'ils arrivent à l\'heure. Il distribue les amendes.',
      know: 'Le <b>patron</b>, souvent un riche bourgeois, possède l\'usine. Certains font construire des logements, des écoles et des magasins pour leurs ouvriers, à côté de l\'usine.' },
    { id: 'horloge', ico: '🕐', name: 'L\'horloge et la journée', color: '#0f766e', zone: [580, 200, 660, 280], lab: [700, 240],
      text: 'À l\'usine, tout est réglé par l\'<b>horloge</b> et la cloche. Une journée typique : arrivée à <b>5 h 30</b>, travail jusqu\'à midi, une courte pause pour manger, puis travail jusqu\'à <b>19 h ou 20 h</b>.',
      know: 'La journée de 8 heures n\'est obtenue en France qu\'en 1919, et les premiers congés payés en 1936.' },
    { id: 'reglement', ico: '📜', name: 'Le règlement', color: '#a16207', zone: [430, 200, 530, 290], lab: [480, 315],
      text: 'Le <b>règlement</b> de l\'usine est affiché au mur. Il est très strict : défense de parler, de chanter, de s\'asseoir ; une <b>amende</b> (retenue sur le salaire) pour chaque retard ou chaque erreur.',
      know: 'Dans certaines usines, la porte était fermée à clé dès que la cloche avait sonné : l\'ouvrier en retard perdait sa journée.' },
    { id: 'cheminee', ico: '🏭', name: 'La cheminée et le charbon', color: '#57534e', zone: [955, 0, 1000, 560], lab: [955, 60],
      text: 'La haute <b>cheminée</b> de brique rejette jour et nuit la fumée du charbon. Elle est le symbole de l\'usine. L\'air des villes industrielles devient très <b>pollué</b>.',
      know: 'Les usines s\'installent souvent près des mines de charbon ou des voies ferrées qui l\'apportent, comme dans le Nord ou la région de Saint-Étienne.' }
];

// Ville et campagne
const IND_C_PARTS = [
    { id: 'paysans', ico: '🧑‍🌾', name: 'Les paysans', color: '#65a30d',
      text: 'En 1800, la plupart des Français sont des <b>paysans</b>. Ils travaillent la terre à la main ou avec des animaux, et vivent dans des villages.',
      know: 'Au fil du siècle, les paysans sont de moins en moins nombreux, mais ils produisent davantage grâce aux engrais et aux machines.' },
    { id: 'batteuse', ico: '🚜', name: 'Les machines agricoles', from: 1855, color: '#a16207',
      text: 'Dans la seconde moitié du siècle, des <b>machines</b> arrivent dans les campagnes : la batteuse à vapeur sépare les grains de blé de la paille, la faucheuse coupe l\'herbe. Il faut moins de bras pour travailler.',
      know: 'La batteuse à vapeur passait de ferme en ferme : c\'était une grande journée de fête et de travail pour tout le village.' },
    { id: 'ecole', ico: '🏫', name: 'L\'école', from: 1882, color: '#2563eb',
      text: 'En <b>1881-1882</b>, les lois de <b>Jules Ferry</b> rendent l\'école <b>gratuite</b>, <b>obligatoire</b> (de 6 à 13 ans) et <b>laïque</b>. Chaque village a son école, souvent dans le même bâtiment que la mairie.',
      know: 'Les élèves passaient le « certificat d\'études » vers 12 ans : c\'était un diplôme très important.' },
    { id: 'exode', ico: '🧳', name: 'L\'exode rural', color: '#7c3aed',
      text: 'Beaucoup de paysans quittent la campagne pour la ville : c\'est l\'<b>exode rural</b>. Les machines remplacent les bras, et en ville, l\'usine offre du travail et un salaire régulier.',
      know: 'À la fin du siècle, une maladie de la vigne, le phylloxéra, ruine de nombreux vignerons, qui partent eux aussi vers les villes.' },
    { id: 'train', ico: '🚂', name: 'Le chemin de fer', from: 1840, color: '#1f2937',
      text: 'Le <b>train</b> à vapeur transporte vite et loin les voyageurs, le charbon et les marchandises. En France, les grandes lignes se construisent à partir des années 1840. Les villes et les campagnes sont reliées.',
      know: 'En 1830, il fallait plusieurs jours en diligence pour aller de Paris à Marseille. En 1900, il suffisait de moins d\'une journée en train !' },
    { id: 'usine', ico: '🏭', name: 'Les usines', from: 1820, color: '#7c2d12',
      text: 'Les <b>usines</b> s\'installent dans les villes, près du charbon, des voies ferrées et de la main-d\'œuvre. Elles attirent des milliers d\'ouvriers.',
      know: 'Certaines villes sont nées autour d\'une usine ou d\'une mine, comme Le Creusot, autour des usines Schneider.' },
    { id: 'quartier', ico: '🏚️', name: 'Les quartiers ouvriers', from: 1830, color: '#78350f',
      text: 'Les ouvriers s\'entassent dans des <b>logements</b> petits, sombres et humides, sans eau courante ni toilettes, près des usines. Les maladies (choléra, tuberculose) s\'y répandent vite.',
      know: 'Près des mines, les patrons construisent des rangées de petites maisons toutes pareilles pour les mineurs : les corons.' },
    { id: 'ville', ico: '🏙️', name: 'La ville moderne', from: 1855, color: '#0f766e',
      text: 'Les villes se transforment : larges <b>boulevards</b>, égouts, <b>éclairage</b> au gaz puis à l\'électricité, <b>grands magasins</b>, gares, tramways. À Paris, le préfet Haussmann fait reconstruire de nombreux quartiers.',
      know: 'La tour Eiffel, construite pour l\'Exposition universelle de 1889, montre la puissance de l\'industrie du fer.' },
    { id: 'pollution', ico: '🌫️', name: 'La pollution', from: 1830, color: '#57534e',
      text: 'La fumée des usines et des trains noircit le ciel et les façades. L\'eau des rivières est polluée par les déchets des usines. Vivre en ville industrielle est mauvais pour la santé.',
      know: 'À Londres, le brouillard mêlé de fumée était si épais qu\'on l\'appelait « la soupe aux pois ».' }
];
// Part des Français vivant en ville, et population de Paris
const IND_URB = [[1800, 20], [1850, 25], [1900, 41], [1930, 51]];
const IND_PARIS = [[1800, 0.55], [1850, 1.05], [1900, 2.7], [1930, 2.9]];
function _indInterp(T, y) {
    if (y <= T[0][0]) return T[0][1];
    for (let i = 1; i < T.length; i++) if (y <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (y - T[i - 1][0]) / (T[i][0] - T[i - 1][0]);
    return T[T.length - 1][1];
}
const IND_CMP = {
    early: { label: 'vers 1820', rows: [
        ['Travail', 'Aux champs, à la main ou avec les animaux', 'Ateliers d\'artisans, premières usines'],
        ['Habitants', 'Presque 4 Français sur 5', 'Environ 1 Français sur 5'],
        ['Transports', 'À pied, à cheval, en charrette', 'Diligences, bateaux'],
        ['Éclairage', 'Bougie, lampe à huile', 'Bougie, premiers becs de gaz'],
        ['École', 'Rare, souvent payante', 'Plus fréquente, mais pas pour tous']
    ] },
    late: { label: 'vers 1900', rows: [
        ['Travail', 'Agriculture avec des machines, moins de bras', 'Usines, commerces, bureaux'],
        ['Habitants', 'De moins en moins (exode rural)', 'Plus de 4 Français sur 10'],
        ['Transports', 'Le train relie les villages aux villes', 'Train, tramway, métro (Paris, 1900)'],
        ['Éclairage', 'Lampe à pétrole', 'Gaz et électricité'],
        ['École', 'Gratuite et obligatoire (1882)', 'Gratuite et obligatoire (1882)'],
        ['Logement', 'Fermes et maisons de village', 'Immeubles, quartiers ouvriers insalubres']
    ] }
};

// ── Petit personnage (pieds en x, y ; hauteur s) ─────────────────────────
function _indPerson(ctx, x, y, s, o) {
    o = o || {};
    const u = s / 100, sw = o.walk ? Math.sin(o.walk) * 9 : 0;
    ctx.lineCap = 'round';
    ctx.strokeStyle = o.legs || '#44403c'; ctx.lineWidth = 7 * u;
    ctx.beginPath(); ctx.moveTo(x - 3 * u, y - 36 * u); ctx.lineTo(x - 4 * u + sw * u, y);
    ctx.moveTo(x + 3 * u, y - 36 * u); ctx.lineTo(x + 4 * u - sw * u, y); ctx.stroke();
    ctx.fillStyle = o.body || '#7c2d12';
    if (o.skirt) { ctx.beginPath(); ctx.moveTo(x - 10 * u, y - 78 * u); ctx.lineTo(x + 10 * u, y - 78 * u); ctx.lineTo(x + 17 * u, y - 6 * u); ctx.lineTo(x - 17 * u, y - 6 * u); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x - 11 * u, y - 78 * u); ctx.lineTo(x + 11 * u, y - 78 * u); ctx.lineTo(x + 12 * u, y - 34 * u); ctx.lineTo(x - 12 * u, y - 34 * u); ctx.closePath(); ctx.fill(); }
    if (o.apron) { ctx.fillStyle = o.apron; ctx.fillRect(x - 8 * u, y - 62 * u, 16 * u, 34 * u); }
    ctx.strokeStyle = o.body || '#7c2d12'; ctx.lineWidth = 6 * u;
    const ax = o.armsUp ? -18 : -14, ay = o.armsUp ? -66 : -46;
    ctx.beginPath(); ctx.moveTo(x - 10 * u, y - 74 * u); ctx.lineTo(x + ax * u, y + ay * u);
    ctx.moveTo(x + 10 * u, y - 74 * u); ctx.lineTo(x + (o.armsUp ? 18 : 14) * u, y + (o.armsUp ? -66 : -46) * u); ctx.stroke();
    ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(x, y - 88 * u, 10 * u, 0, 2 * Math.PI); ctx.fill();
    if (o.hat === 'casquette') { ctx.fillStyle = '#1f2937'; ctx.fillRect(x - 10 * u, y - 100 * u, 20 * u, 6 * u); ctx.fillRect(x - 2 * u, y - 96 * u, 14 * u, 3 * u); }
    else if (o.hat === 'bonnet') { ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(x, y - 92 * u, 11 * u, Math.PI, 0); ctx.fill(); }
    else if (o.hat === 'paille') { ctx.fillStyle = '#e4c26a'; ctx.beginPath(); ctx.ellipse(x, y - 98 * u, 16 * u, 3.5 * u, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 7 * u, y - 106 * u, 14 * u, 8 * u); }
    else if (o.hat === 'haut') { ctx.fillStyle = '#111827'; ctx.fillRect(x - 12 * u, y - 99 * u, 24 * u, 3 * u); ctx.fillRect(x - 8 * u, y - 116 * u, 16 * u, 17 * u); }
    if (o.bundle) { ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(x + 8 * u, y - 72 * u); ctx.lineTo(x - 14 * u, y - 100 * u); ctx.stroke(); ctx.fillStyle = '#b91c1c'; ctx.beginPath(); ctx.arc(x - 16 * u, y - 100 * u, 7 * u, 0, 7); ctx.fill(); }
}

// ── Création du widget ────────────────────────────────────────────────────
function createAgeIndustrielWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'histoire-industriel';
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
    container.className = 'ind-container';
    container.dataset.mode = 'vapeur';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(860, Math.min(1260, Math.round(window.innerWidth * 0.74)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.round(contW * 0.64));

    const header = document.createElement('div');
    header.className = 'ind-header';
    header.innerHTML = `
        <span class="ind-title">🏭<span> L'âge industriel</span></span>
        <div class="ind-tabs">
            <button class="ind-tab on" data-mode="vapeur" title="La machine à vapeur"><span class="ind-tab-long">⚙️ La machine à vapeur</span><span class="ind-tab-short">⚙️ Vapeur</span></button>
            <button class="ind-tab" data-mode="usine" title="L'usine au XIXᵉ siècle"><span class="ind-tab-long">🏭 L'usine</span><span class="ind-tab-short">🏭 Usine</span></button>
            <button class="ind-tab" data-mode="ville" title="La ville et la campagne"><span class="ind-tab-long">🏙️ Ville et campagne</span><span class="ind-tab-short">🏙️ Ville</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ind-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.ind-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    const row1 = document.createElement('div');
    row1.className = 'ind-row';
    row1.innerHTML = `
        <button class="ind-btn ind-btn-coal ind-only-vapeur" title="Mettre du charbon dans le foyer">🔥 Ajouter du charbon</button>
        <button class="ind-btn ind-run ind-not-ville" title="Mettre en marche ou arrêter">⏸ Pause</button>
        <button class="ind-btn ind-steps-btn ind-only-vapeur" title="Comprendre étape par étape">🔢 Comment ça marche ?</button>
        <span class="ind-sep ind-not-ville"></span>
        <button class="ind-btn ind-labels ind-not-ville on" title="Afficher les noms">🏷️ Étiquettes</button>

        <button class="ind-btn ind-btn-play ind-only-ville" title="Faire passer les années">▶ Le temps passe</button>
        <div class="ind-slider-box ind-only-ville">
            <span class="ind-lbl">📅 Année :</span>
            <input type="range" class="ind-slider ind-year" min="1800" max="1930" step="1" value="1800" aria-label="Année">
            <span class="ind-val ind-year-val">1800</span>
        </div>
    `;
    container.appendChild(row1);

    const body = document.createElement('div');
    body.className = 'ind-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'ind-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'ind-canvas';
    sceneWrap.appendChild(canvas);
    const side = document.createElement('div');
    side.className = 'ind-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ind-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 L'âge industriel</h4>
        <p><b>⚙️ La machine à vapeur</b> : appuie sur <b>🔥 Ajouter du charbon</b> : la pression monte (regarde le manomètre)
        et la machine tourne plus vite. Sans charbon, elle ralentit et s'arrête. <b>🔢 Comment ça marche ?</b> montre les étapes
        une par une. Touche une partie de la machine pour lire sa fiche.</p>
        <p><b>🏭 L'usine</b> : touche les machines, les ouvriers, l'horloge, le règlement… pour découvrir la vie à l'usine.</p>
        <p><b>🏙️ Ville et campagne</b> : bouge le curseur de 1800 à 1930, ou appuie sur <b>▶ Le temps passe</b>. Regarde la ville
        grandir et la campagne se vider. Touche la scène pour en savoir plus.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ind-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const coalBtn = $('.ind-btn-coal'), runBtn = $('.ind-run'), stepsBtn = $('.ind-steps-btn'), labelsBtn = $('.ind-labels');
    const playBtn = $('.ind-btn-play'), yearSl = $('.ind-year'), yearVal = $('.ind-year-val');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'vapeur', running = true, showLabels = true;
    let fire = 0.75, pressure = 0.55, angle = 0, stepIdx = -1, selV = -1, puffs = [], lastStroke = 0;
    let selU = -1, uAngle = 0;
    let year = 1800, playing = false, selC = -1, walkers = [], walkAcc = 0, trainX = -200;
    let animId = null, lastT = 0, time = 0;
    let cssW = 0, cssH = 0, dpr = 1, S = 1, OX = 0, OY = 0;
    let labelHits = [];

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        S = Math.min(W / 1000, H / 630); OX = (W - 1000 * S) / 2; OY = (H - 630 * S) / 2;
        return true;
    }
    function rr(x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
    function txt(t, x, y, font, color, align, base) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'middle'; ctx.fillText(t, x, y); }
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
    const scene = () => ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * OX, dpr * OY);
    const screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    function fullBg(c) { ctx.fillStyle = c; ctx.fillRect(-OX / S - 2, -OY / S - 2, cssW / S + 4, cssH / S + 4); }
    function brick(x, y, w, h, base) {
        ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
        for (let yy = y; yy < y + h; yy += 12) {
            ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
            const off = ((yy - y) / 12) % 2 ? 12 : 0;
            for (let xx = x + off; xx < x + w; xx += 24) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, Math.min(yy + 12, y + h)); ctx.stroke(); }
        }
    }
    function wheel(cx, cy, R, a, rim, spokes, col) {
        ctx.strokeStyle = col || '#374151'; ctx.lineWidth = rim;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
        ctx.lineWidth = Math.max(2, rim * 0.35);
        for (let k = 0; k < spokes; k++) { const t = a + k * 2 * Math.PI / spokes; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * R, cy + Math.sin(t) * R); ctx.stroke(); }
        ctx.fillStyle = col || '#374151'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, R * 0.12), 0, 2 * Math.PI); ctx.fill();
    }
    function smoke(x, y, n, k, dark) {
        for (let i = 0; i < n; i++) {
            const t = ((time * 0.25 + i / n) % 1);
            ctx.globalAlpha = (1 - t) * 0.55 * k;
            ctx.fillStyle = dark ? '#3f3f46' : '#9ca3af';
            ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.3 + time) * 8 + t * 40, y - t * 120, 10 + t * 26, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function drawLabels(parts, sel, hl) {
        labelHits = [];
        if (!showLabels) return;
        parts.forEach((p, i) => {
            const on = sel === i || hl === p.id;
            const t = `${p.ico} ${p.name}`;
            const fs = on ? 15 : 14;
            ctx.font = `800 ${fs}px 'Segoe UI', sans-serif`;
            const w = ctx.measureText(t).width + 16, h = 26;
            const x = Math.max(w / 2 + 2, Math.min(998 - w / 2, p.lab[0])), y = Math.max(h / 2 + 2, Math.min(628 - h / 2, p.lab[1]));
            ctx.globalAlpha = sel >= 0 && !on ? 0.75 : 1;
            ctx.fillStyle = on ? p.color : 'rgba(255,255,255,0.95)'; rr(x - w / 2, y - h / 2, w, h, 9); ctx.fill();
            ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke();
            txt(t, x, y + 1, ctx.font, on ? '#fff' : '#1f2937');
            ctx.globalAlpha = 1;
            labelHits.push({ i, x: x - w / 2 - 6, y: y - h / 2 - 6, w: w + 12, h: h + 12 });
        });
    }
    function highlight(z, color) {
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -time * 20;
        rr(z[0] - 4, z[1] - 4, z[2] - z[0] + 8, z[3] - z[1] + 8, 12); ctx.stroke(); ctx.restore();
    }

    // =====================================================================
    //  ONGLET 1 : LA MACHINE À VAPEUR
    // =====================================================================
    const FW = { x: 860, y: 380, R: 112, r: 58 }, ROD = 150, PROD = 200, CYL = [410, 330, 630, 430];
    function drawVapeur() {
        fullBg('#efe6d8');
        // sol
        ctx.fillStyle = '#a8a29e'; ctx.fillRect(-OX / S - 2, 560, cssW / S + 4, 80);
        ctx.fillStyle = '#78716c'; ctx.fillRect(-OX / S - 2, 560, cssW / S + 4, 5);
        // cheminée et fumée
        brick(22, 40, 56, 400, '#a3523b');
        ctx.fillStyle = '#7c2d12'; ctx.fillRect(16, 30, 68, 14);
        smoke(50, 26, 9, 0.3 + fire, true);
        // charbon
        ctx.fillStyle = '#1c1917';
        for (const [x, y, r] of [[18, 548, 16], [40, 552, 14], [30, 534, 12], [8, 556, 10], [52, 556, 9]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
        // foyer
        brick(75, 432, 250, 128, '#b45f43');
        ctx.fillStyle = '#1c1917'; rr(140, 470, 120, 72, 6); ctx.fill();
        const fl = 0.25 + 0.75 * fire;
        for (let k = 0; k < 7; k++) {
            const x = 152 + k * 15, hgt = (28 + 22 * Math.sin(time * 9 + k * 1.7)) * fl;
            ctx.fillStyle = k % 2 ? '#f97316' : '#facc15';
            ctx.beginPath(); ctx.moveTo(x - 9, 540); ctx.quadraticCurveTo(x, 540 - hgt * 1.6, x + 9, 540); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#292524'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(155 + k * 18, 538, 7, 0, 7); ctx.fill(); }
        // chaudière
        ctx.fillStyle = '#6b7280'; rr(75, 298, 250, 134, 40); ctx.fill();
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); rr(95, 314, 210, 102, 26); ctx.clip();
        ctx.fillStyle = '#f1f5f9'; ctx.fillRect(95, 314, 210, 102);
        const wl = 360;
        ctx.fillStyle = '#60a5fa'; ctx.fillRect(95, wl, 210, 60);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let k = 0; k < 14; k++) { const t = (time * (0.4 + fire) + k * 0.37) % 1; ctx.beginPath(); ctx.arc(110 + (k * 53) % 185, 414 - t * 55, 2 + (k % 3), 0, 7); ctx.fill(); }
        for (let k = 0; k < 6; k++) { const t = (time * 0.3 + k / 6) % 1; ctx.globalAlpha = 0.35 * pressure; ctx.beginPath(); ctx.arc(120 + k * 32, 350 - t * 26, 10 + 6 * t, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
        ctx.restore();
        txt('eau', 200, 392, "800 13px 'Segoe UI', sans-serif", '#1e3a8a');
        txt('vapeur', 200, 333, "800 13px 'Segoe UI', sans-serif", '#64748b');
        ctx.fillStyle = '#4b5563'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(95 + k * 26, 304, 2.5, 0, 7); ctx.fill(); }
        // manomètre et soupape
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(205, 278, 22, 0, 7); ctx.fill(); ctx.strokeStyle = '#374151'; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(205, 278, 16, Math.PI * 0.8, Math.PI * 1.75); ctx.stroke();
        ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.arc(205, 278, 16, Math.PI * 1.75, Math.PI * 2.2); ctx.stroke();
        const na = Math.PI * 0.8 + pressure * Math.PI * 1.4;
        ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(205, 278); ctx.lineTo(205 + Math.cos(na) * 17, 278 + Math.sin(na) * 17); ctx.stroke();
        ctx.fillStyle = '#374151'; ctx.fillRect(201, 298, 8, 4);
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(282, 278, 14, 22); ctx.fillStyle = '#4b5563'; ctx.fillRect(276, 272, 26, 8);
        if (pressure > 0.88) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 4; k++) { const t = (time * 2 + k / 4) % 1; ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.arc(289 + t * 10, 266 - t * 40, 5 + t * 12, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
        // tuyau de vapeur
        ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 18; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(250, 300); ctx.lineTo(250, 222); ctx.lineTo(520, 222); ctx.lineTo(520, 302); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.6 * pressure})`; ctx.lineWidth = 9; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -time * 80 * pressure;
        ctx.beginPath(); ctx.moveTo(250, 300); ctx.lineTo(250, 222); ctx.lineTo(520, 222); ctx.lineTo(520, 302); ctx.stroke(); ctx.setLineDash([]);
        // échappement (« tchou »)
        ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(452, 302); ctx.lineTo(452, 255); ctx.stroke();
        for (const p of puffs) { ctx.globalAlpha = Math.max(0, 1 - p.t); ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.arc(452 + p.t * 12, 248 - p.t * 60, 8 + p.t * 22, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        // cinématique : manivelle, bielle, piston
        const cp = [FW.x + FW.r * Math.cos(angle), FW.y + FW.r * Math.sin(angle)];
        const dyc = cp[1] - FW.y;
        const xh = cp[0] - Math.sqrt(ROD * ROD - dyc * dyc);
        const px = xh - PROD;
        // boîte à vapeur et cylindre
        ctx.fillStyle = '#57534e'; rr(432, 298, 176, 34, 6); ctx.fill();
        ctx.fillStyle = '#9ca3af'; rr(CYL[0], CYL[1], CYL[2] - CYL[0], CYL[3] - CYL[1], 10); ctx.fill();
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 3; ctx.stroke();
        const ix0 = CYL[0] + 8, ix1 = CYL[2] - 8, iy0 = CYL[1] + 10, iy1 = CYL[3] - 10;
        const pushRight = Math.sin(angle) < 0;       // le piston va vers la droite : la vapeur entre à gauche
        const fresh = `rgba(255,255,255,${0.55 + 0.4 * pressure})`, used = 'rgba(148,163,184,0.75)';
        ctx.fillStyle = pushRight ? fresh : used; ctx.fillRect(ix0, iy0, px - ix0, iy1 - iy0);
        ctx.fillStyle = pushRight ? used : fresh; ctx.fillRect(px + 22, iy0, ix1 - px - 22, iy1 - iy0);
        if (pressure > 0.1) {
            ctx.fillStyle = '#0891b2'; const ax = pushRight ? px - 30 : px + 52;
            ctx.beginPath(); ctx.moveTo(ax + (pushRight ? 18 : -18), 380); ctx.lineTo(ax, 370); ctx.lineTo(ax, 390); ctx.closePath(); ctx.fill();
            ctx.fillRect(pushRight ? ax - 24 : ax, 377, 24, 6);
        }
        ctx.fillStyle = '#1f2937'; rr(px, iy0 - 2, 22, iy1 - iy0 + 4, 4); ctx.fill();
        // tige de piston, glissière, crosse
        ctx.fillStyle = '#6b7280'; ctx.fillRect(px + 22, 375, xh - px - 22, 10);
        ctx.fillStyle = '#57534e'; ctx.fillRect(CYL[2], 362, 16, 36);
        ctx.fillStyle = '#4b5563'; ctx.fillRect(640, 362, 150, 6); ctx.fillRect(640, 392, 150, 6);
        ctx.fillStyle = '#374151'; rr(xh - 14, 366, 28, 28, 4); ctx.fill();
        // volant
        ctx.fillStyle = '#57534e'; ctx.fillRect(FW.x - 30, FW.y + 40, 60, 180);
        wheel(FW.x, FW.y, FW.R, angle, 16, 6, '#292524');
        ctx.strokeStyle = '#78716c'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(FW.x, FW.y); ctx.lineTo(cp[0], cp[1]); ctx.stroke();
        // bielle
        ctx.strokeStyle = '#a16207'; ctx.lineWidth = 12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(xh, 380); ctx.lineTo(cp[0], cp[1]); ctx.stroke();
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(cp[0], cp[1], 8, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(xh, 380, 7, 0, 7); ctx.fill();
        // courroie et poulie
        const py = 80, pr = 30;
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6; ctx.setLineDash([16, 8]); ctx.lineDashOffset = -angle * 40;
        ctx.beginPath(); ctx.moveTo(FW.x - FW.R * 0.55, FW.y - FW.R * 0.84); ctx.lineTo(FW.x - pr, py); ctx.moveTo(FW.x + FW.R * 0.55, FW.y - FW.R * 0.84); ctx.lineTo(FW.x + pr, py); ctx.stroke(); ctx.setLineDash([]);
        wheel(FW.x, py, pr, angle * FW.R / pr * 0.25, 6, 4, '#374151');
        ctx.fillStyle = '#4b5563'; ctx.fillRect(700, py - 5, 300, 10);
        txt('➜ vers les machines de l\'usine', 925, py + 30, "800 13px 'Segoe UI', sans-serif", '#166534');
        // panneau de vitesse
        const rpm = Math.round(Math.max(0, (pressure - 0.08) / 0.92) * 60 * 1.6);
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; rr(352, 470, 240, 70, 10); ctx.fill(); ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 1.5; ctx.stroke();
        txt(`🔥 Feu : ${Math.round(fire * 100)} %   ⏲️ Pression : ${Math.round(pressure * 100)} %`, 472, 492, "800 13px 'Segoe UI', sans-serif", '#7c2d12');
        txt(rpm > 0 ? `🛞 ${rpm} tours par minute` : '🛞 La machine est arrêtée', 472, 518, "800 14px 'Segoe UI', sans-serif", rpm > 0 ? '#166534' : '#b91c1c');
        // étape en cours
        const hlId = stepIdx >= 0 ? IND_V_STEPS[stepIdx].part : null;
        if (hlId) { const p = IND_V_PARTS.find(pp => pp.id === hlId); highlight(p.zone, '#ea580c'); }
        if (selV >= 0) highlight(IND_V_PARTS[selV].zone, IND_V_PARTS[selV].color);
        drawLabels(IND_V_PARTS, selV, hlId);
        if (stepIdx >= 0) {
            const t = `${stepIdx + 1}. ${IND_V_STEPS[stepIdx].txt}`;
            ctx.font = "900 18px 'Segoe UI', sans-serif";
            const w = Math.min(980, ctx.measureText(t).width + 30);
            ctx.fillStyle = 'rgba(124,45,18,0.95)'; rr(560 - w / 2, 4, w, 34, 10); ctx.fill();
            txt(t, 560, 22, ctx.font, '#fff');
        }
    }
    function stepVapeur(dt) {
        if (!running) return;
        fire = Math.max(0, fire - dt / 30);
        pressure += (Math.min(1, fire * 1.1) - pressure) * dt * 0.5;
        pressure = Math.max(0, Math.min(1, pressure));
        const omega = 2 * Math.PI * 1.6 * Math.max(0, (pressure - 0.08) / 0.92);
        const before = Math.floor(angle / Math.PI);
        angle += omega * dt;
        if (Math.floor(angle / Math.PI) !== before) puffs.push({ t: 0 });
        puffs.forEach(p => { p.t += dt * 1.4; });
        puffs = puffs.filter(p => p.t < 1);
    }

    // =====================================================================
    //  ONGLET 2 : L'USINE (une filature)
    // =====================================================================
    const LOOMS = [330, 470, 610, 750];
    function drawUsine() {
        fullBg('#d6d3d1');
        // ciel et cheminée dehors
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(-OX / S - 2, -OY / S - 2, cssW / S + 4, 110 + OY / S);
        brick(958, 0, 40, 560, '#a3523b');
        smoke(978, 0, 8, running ? 1 : 0.3, true);
        // bâtiment : toit en dents de scie
        ctx.fillStyle = '#57534e';
        for (let x = 30; x < 950; x += 115) { ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x, 50); ctx.lineTo(x + 115, 110); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#bfdbfe'; ctx.fillRect(x + 4, 56, 8, 52); ctx.fillStyle = '#57534e'; }
        brick(30, 110, 925, 450, '#c9a27e');
        ctx.fillStyle = '#e7dccb'; ctx.fillRect(280, 190, 670, 370);           // l'atelier
        ctx.fillStyle = '#b8a48a'; ctx.fillRect(40, 190, 230, 370);            // salle des machines
        ctx.fillStyle = '#8b7355'; ctx.fillRect(30, 556, 925, 8);
        txt('Salle des machines', 155, 206, "800 13px 'Segoe UI', sans-serif", '#44403c');
        txt('Atelier de tissage', 615, 206, "800 13px 'Segoe UI', sans-serif", '#44403c');
        // fenêtres
        for (const x of [300, 820]) { ctx.fillStyle = '#93c5fd'; ctx.fillRect(x, 215, 70, 60); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.strokeRect(x, 215, 70, 60); ctx.beginPath(); ctx.moveTo(x + 35, 215); ctx.lineTo(x + 35, 275); ctx.moveTo(x, 245); ctx.lineTo(x + 70, 245); ctx.stroke(); }
        // machine à vapeur (simplifiée)
        ctx.fillStyle = '#6b7280'; rr(55, 400, 110, 90, 20); ctx.fill();
        ctx.fillStyle = '#1c1917'; rr(75, 495, 70, 50, 4); ctx.fill();
        ctx.fillStyle = '#f97316'; for (let k = 0; k < 4; k++) { const h2 = 18 + 10 * Math.sin(time * 8 + k); ctx.beginPath(); ctx.moveTo(82 + k * 16, 542); ctx.quadraticCurveTo(90 + k * 16, 542 - h2, 98 + k * 16, 542); ctx.fill(); }
        wheel(205, 400, 58, uAngle, 10, 6, '#292524');
        ctx.strokeStyle = '#a16207'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(150, 440); ctx.lineTo(205 + 30 * Math.cos(uAngle), 400 + 30 * Math.sin(uAngle)); ctx.stroke();
        // arbre de transmission
        ctx.fillStyle = '#4b5563'; ctx.fillRect(195, 146, 760, 9);
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 5; ctx.setLineDash([12, 7]); ctx.lineDashOffset = -uAngle * 30;
        ctx.beginPath(); ctx.moveTo(180, 395); ctx.lineTo(186, 150); ctx.moveTo(230, 395); ctx.lineTo(214, 150); ctx.stroke();
        for (const x of LOOMS) { ctx.beginPath(); ctx.moveTo(x - 12, 150); ctx.lineTo(x - 20, 368); ctx.moveTo(x + 12, 150); ctx.lineTo(x + 2, 368); ctx.stroke(); }
        ctx.setLineDash([]);
        wheel(200, 150, 16, uAngle * 3, 4, 4, '#1f2937');
        for (const x of LOOMS) wheel(x, 150, 14, uAngle * 3, 4, 4, '#1f2937');
        // horloge et règlement
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(620, 240, 30, 0, 7); ctx.fill(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.stroke();
        const hh = (5.5 + (time / 60) % 14) / 12 * 2 * Math.PI, mm = (time * 0.6) % (2 * Math.PI);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(620, 240); ctx.lineTo(620 + 15 * Math.sin(hh), 240 - 15 * Math.cos(hh)); ctx.stroke();
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(620, 240); ctx.lineTo(620 + 23 * Math.sin(mm), 240 - 23 * Math.cos(mm)); ctx.stroke();
        ctx.fillStyle = '#fef9c3'; ctx.fillRect(440, 205, 82, 80); ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2; ctx.strokeRect(440, 205, 82, 80);
        txt('RÈGLEMENT', 481, 218, "900 11px Georgia, serif", '#7c2d12');
        ctx.fillStyle = '#78350f'; for (let k = 0; k < 6; k++) ctx.fillRect(448, 230 + k * 9, 66 - (k % 3) * 10, 2);
        // métiers à tisser
        LOOMS.forEach((x, k) => {
            ctx.fillStyle = '#7c4a1e'; ctx.fillRect(x - 55, 368, 110, 10); ctx.fillRect(x - 55, 368, 10, 100); ctx.fillRect(x + 45, 368, 10, 100); ctx.fillRect(x - 55, 440, 110, 8);
            ctx.strokeStyle = '#f5f5f4'; ctx.lineWidth = 1; for (let t = 0; t < 12; t++) { ctx.beginPath(); ctx.moveTo(x - 44 + t * 8, 380); ctx.lineTo(x - 44 + t * 8, 438); ctx.stroke(); }
            ctx.fillStyle = '#e0e7ff'; ctx.fillRect(x - 44, 410, 88, 28);
            const sx = x + Math.sin(uAngle * 2 + k) * 38;
            ctx.fillStyle = '#b45309'; rr(sx - 9, 402, 18, 7, 3); ctx.fill();
            wheel(x - 22, 395, 12, uAngle * 2, 3, 4, '#44403c');
        });
        // ouvrières, enfant, contremaître
        LOOMS.forEach((x, k) => _indPerson(ctx, x - 75, 556, 110, { body: ['#1e3a8a', '#7f1d1d', '#365314', '#4c1d95'][k], skirt: true, apron: '#e5e7eb', hat: 'bonnet', armsUp: Math.sin(uAngle * 2 + k) > 0 }));
        _indPerson(ctx, 570, 556, 70, { body: '#a16207', legs: '#57534e', hat: 'casquette', armsUp: Math.sin(time * 3) > 0 });
        _indPerson(ctx, 905, 556, 120, { body: '#111827', legs: '#111827', hat: 'haut' });
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(921, 506, 5, 0, 7); ctx.fill();
        if (selU >= 0) highlight(IND_U_PARTS[selU].zone, IND_U_PARTS[selU].color);
        drawLabels(IND_U_PARTS, selU, null);
    }

    // =====================================================================
    //  ONGLET 3 : VILLE ET CAMPAGNE (1800 → 1930)
    // =====================================================================
    const k01 = () => (year - 1800) / 130;
    const cRegions = {};                               // zones touchables calculées au dessin
    function house(x, y, w, h, wall, roof, broken) {
        ctx.fillStyle = wall; ctx.fillRect(x, y - h, w, h);
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 4, y - h); ctx.lineTo(x + w / 2, y - h - w * 0.45); ctx.lineTo(x + w + 4, y - h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = broken ? '#44403c' : '#fde68a'; ctx.fillRect(x + w * 0.2, y - h * 0.7, w * 0.22, h * 0.3); ctx.fillRect(x + w * 0.58, y - h * 0.7, w * 0.22, h * 0.3);
        if (broken) { ctx.fillStyle = '#d6d3d1'; ctx.beginPath(); ctx.moveTo(x + w * 0.3, y - h - 4); ctx.lineTo(x + w * 0.5, y - h - w * 0.3); ctx.lineTo(x + w * 0.6, y - h - 2); ctx.closePath(); ctx.fill(); }
    }
    function drawVille() {
        const k = k01(), ind = Math.max(0, Math.min(1, (year - 1825) / 70));
        // ciel : plus gris au-dessus de la ville
        const g = ctx.createLinearGradient(0, 0, 1000, 0);
        g.addColorStop(0, '#9fd3f5'); g.addColorStop(0.5, '#b7dcf5');
        g.addColorStop(1, `rgb(${Math.round(183 - 60 * ind)},${Math.round(220 - 80 * ind)},${Math.round(245 - 105 * ind)})`);
        ctx.fillStyle = g; ctx.fillRect(-OX / S - 2, -OY / S - 2, cssW / S + 4, 360 + OY / S + 2);
        const bottom = (cssH - OY) / S + 2;
        ctx.fillStyle = '#86c06c'; ctx.fillRect(-OX / S - 2, 360, 520 + OX / S + 2, bottom - 360);
        ctx.fillStyle = '#a8a29e'; ctx.fillRect(520, 360, 480 + OX / S + 2, bottom - 360);
        if (ind > 0) { ctx.fillStyle = `rgba(68,64,60,${0.22 * ind})`; ctx.beginPath(); ctx.ellipse(790, 215, 250, 60, 0, 0, 7); ctx.fill(); cRegions.pollution = [560, 150, 1000, 230]; } else cRegions.pollution = null;
        // champs
        const fieldCols = ['#c9dc7a', '#a7c957', '#e0c56e', '#8fbf5a'];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
            ctx.fillStyle = fieldCols[(i + j) % 4];
            ctx.beginPath(); ctx.moveTo(20 + i * 120, 380 + j * 90); ctx.lineTo(130 + i * 120, 380 + j * 90); ctx.lineTo(120 + i * 120, 455 + j * 90); ctx.lineTo(10 + i * 120, 455 + j * 90); ctx.closePath(); ctx.fill();
        }
        // village : église, fermes (abandonnées peu à peu), école après 1882
        ctx.fillStyle = '#e7e5e4'; ctx.fillRect(225, 275, 50, 85); ctx.fillStyle = '#78716c';
        ctx.beginPath(); ctx.moveTo(220, 275); ctx.lineTo(250, 215); ctx.lineTo(280, 275); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#44403c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(250, 215); ctx.lineTo(250, 198); ctx.moveTo(243, 205); ctx.lineTo(257, 205); ctx.stroke();
        const farms = [[60, 360], [120, 352], [330, 358], [400, 350], [160, 362]];
        const abandoned = Math.round(k * 2.6);
        farms.forEach(([x, y], i) => house(x, y, 46, 34, i < abandoned ? '#a8a29e' : '#f5e6c8', i < abandoned ? '#57534e' : '#b45309', i < abandoned));
        cRegions.paysans = [10, 380, 500, 560];
        if (year >= 1882) { house(300, 360, 60, 40, '#fef3c7', '#1d4ed8'); txt('ÉCOLE', 330, 343, "900 10px 'Segoe UI', sans-serif", '#1d4ed8'); cRegions.ecole = [292, 296, 368, 362]; } else delete cRegions.ecole;
        // paysans au travail
        const nP = Math.max(2, Math.round(9 * (1 - 0.65 * k)));
        for (let i = 0; i < nP; i++) _indPerson(ctx, 40 + (i * 53) % 440, 455 + (i % 2) * 85, 46, { body: '#8b5a2b', hat: 'paille', armsUp: Math.sin(time * 3 + i) > 0.3 });
        // batteuse à vapeur
        if (year >= 1855) {
            const x = 405, y = 535;
            ctx.fillStyle = '#b91c1c'; rr(x - 40, y - 34, 80, 30, 4); ctx.fill();
            ctx.fillStyle = '#1f2937'; ctx.fillRect(x + 22, y - 62, 10, 30);
            wheel(x - 24, y - 2, 12, time * 4, 3, 4, '#111'); wheel(x + 24, y - 2, 12, time * 4, 3, 4, '#111');
            smoke(x + 27, y - 64, 4, 0.8, false);
            cRegions.batteuse = [x - 45, y - 70, x + 45, y + 12];
        } else delete cRegions.batteuse;
        // ville : maisons puis immeubles, quartier ouvrier, usines
        const nB = 3 + Math.round(k * 9);
        for (let i = 0; i < nB; i++) {
            const x = 540 + (i % 9) * 50, row = Math.floor(i / 9);
            const h = 40 + Math.min(1, k * 1.6) * (40 + (i * 37) % 60);
            ctx.fillStyle = ['#e7d8c3', '#d6c3a8', '#efe3d0'][i % 3]; ctx.fillRect(x, 360 - h - row * 8, 44, h);
            ctx.fillStyle = '#57534e'; ctx.fillRect(x - 2, 360 - h - row * 8 - 6, 48, 6);
            ctx.fillStyle = year > 1880 ? '#fde68a' : '#78716c';
            for (let yy = 360 - h - row * 8 + 10; yy < 352 - row * 8; yy += 16) for (let xx = x + 6; xx < x + 40; xx += 13) ctx.fillRect(xx, yy, 7, 9);
        }
        cRegions.ville = [540, 230, 990, 362];
        // grand magasin et tour Eiffel
        if (year >= 1855) { ctx.fillStyle = '#7c2d12'; ctx.fillRect(560, 270, 120, 12); txt('GRAND MAGASIN', 620, 276, "900 9px 'Segoe UI', sans-serif", '#fef3c7'); }
        if (year >= 1889) {
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(930, 362); ctx.lineTo(955, 150); ctx.lineTo(980, 362); ctx.moveTo(938, 300); ctx.lineTo(972, 300); ctx.moveTo(945, 240); ctx.lineTo(965, 240); ctx.stroke();
            ctx.beginPath(); ctx.arc(955, 362, 18, Math.PI, 0); ctx.stroke();
        }
        // usines
        const nF = year < 1820 ? 0 : Math.min(4, 1 + Math.floor((year - 1820) / 25));
        for (let i = 0; i < nF; i++) {
            const x = 600 + i * 95, y = 470;
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.lineTo(x + 20, y - 55); ctx.lineTo(x + 20, y - 40); ctx.lineTo(x + 40, y - 55); ctx.lineTo(x + 40, y - 40); ctx.lineTo(x + 60, y - 55); ctx.lineTo(x + 60, y); ctx.closePath(); ctx.fill();
            brick(x + 64, y - 120, 14, 120, '#a3523b');
            smoke(x + 71, y - 122, 5, 0.9, true);
        }
        cRegions.usine = nF ? [595, 340, 600 + nF * 95, 472] : null;
        // quartier ouvrier
        if (year >= 1830) {
            const n = Math.min(10, 2 + Math.floor((year - 1830) / 11));
            for (let i = 0; i < n; i++) house(545 + i * 44, 560, 38, 26 + (i % 2) * 6, '#a8a29e', '#57534e', false);
            cRegions.quartier = [540, 500, 545 + n * 44, 562];
        } else cRegions.quartier = null;
        // route et chemin de fer
        ctx.fillStyle = '#d6c7a1'; ctx.fillRect(-OX / S - 2, 478, 1000 + 2 * OX / S + 4, 16);
        cRegions.exode = [0, 470, 640, 500];
        if (year >= 1840) {
            ctx.fillStyle = '#57534e'; ctx.fillRect(-OX / S - 2, 412, 1000 + 2 * OX / S + 4, 4); ctx.fillRect(-OX / S - 2, 422, 1000 + 2 * OX / S + 4, 4);
            ctx.fillStyle = '#78350f'; for (let x = -40; x < 1040; x += 18) ctx.fillRect(x, 410, 5, 18);
            // gare
            ctx.fillStyle = '#e7d8c3'; ctx.fillRect(640, 380, 110, 30); ctx.fillStyle = '#7c2d12'; ctx.fillRect(635, 372, 120, 8); txt('GARE', 695, 395, "900 12px 'Segoe UI', sans-serif", '#7c2d12');
            // train
            const tx = trainX;
            ctx.fillStyle = '#1f2937'; rr(tx, 384, 70, 28, 4); ctx.fill(); ctx.fillRect(tx + 50, 368, 14, 18); ctx.fillStyle = '#b91c1c'; ctx.fillRect(tx + 6, 372, 30, 14);
            for (let w = 0; w < 3; w++) { ctx.fillStyle = '#7c2d12'; rr(tx - 80 - w * 78, 388, 72, 24, 3); ctx.fill(); ctx.fillStyle = '#fde68a'; for (let q = 0; q < 3; q++) ctx.fillRect(tx - 74 - w * 78 + q * 22, 393, 14, 8); }
            smoke(tx + 57, 364, 4, 1, true);
            cRegions.train = [Math.max(0, tx - 330), 360, tx + 75, 430];
        } else cRegions.train = null;
        // l'exode : des paysans marchent vers la ville
        for (const w of walkers) _indPerson(ctx, w.x, 492, 44, { body: w.c, hat: w.h, bundle: true, walk: w.x * 0.12 });
        // panneaux d'information
        const urb = _indInterp(IND_URB, year), par = _indInterp(IND_PARIS, year);
        ctx.fillStyle = 'rgba(255,255,255,0.94)'; rr(10, 10, 980, 62, 12); ctx.fill(); ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.stroke();
        txt(String(Math.floor(year)), 62, 41, "900 30px 'Segoe UI', sans-serif", '#7c2d12');   // année entière, même pendant l'animation
        const bx = 130, bw = 520;
        ctx.fillStyle = '#65a30d'; rr(bx, 24, bw * (1 - urb / 100), 34, 8); ctx.fill();
        ctx.fillStyle = '#57534e'; rr(bx + bw * (1 - urb / 100), 24, bw * urb / 100, 34, 8); ctx.fill();
        txt(`🌾 Campagne : ${Math.round(100 - urb)} %`, bx + bw * (1 - urb / 100) / 2, 41, "900 15px 'Segoe UI', sans-serif", '#fff');
        txt(`🏙️ Ville : ${Math.round(urb)} %`, bx + bw * (1 - urb / 100) + bw * urb / 200, 41, "900 15px 'Segoe UI', sans-serif", '#fff');
        txt(`Paris : ${par < 1 ? Math.round(par * 1000).toLocaleString('fr-FR') + ' 000' : par.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' million' + (par >= 2 ? 's' : '')} d'habitants`, 820, 41, "800 15px 'Segoe UI', sans-serif", '#374151');
        txt('À LA CAMPAGNE', 250, 92, "900 18px 'Segoe UI', sans-serif", '#365314');
        txt('EN VILLE', 770, 92, "900 18px 'Segoe UI', sans-serif", '#292524');
        // zone sélectionnée
        if (selC >= 0) { const z = cRegions[IND_C_PARTS[selC].id]; if (z) highlight(z, IND_C_PARTS[selC].color); }
    }
    function stepVille(dt) {
        if (playing) {
            year = Math.min(1930, year + dt * 6);
            if (year >= 1930) playing = false;
            yearSl.value = Math.round(year);
        }
        const k = k01();
        walkAcc += dt * (0.15 + 1.4 * Math.min(1, k * 1.5));
        if (walkAcc > 1 && walkers.length < 8) {
            walkAcc = 0;
            walkers.push({ x: 20, v: 30 + Math.random() * 18, c: ['#8b5a2b', '#7f1d1d', '#365314', '#1e3a8a'][Math.floor(Math.random() * 4)], h: Math.random() < 0.5 ? 'paille' : 'bonnet' });
        }
        walkers.forEach(w => { w.x += w.v * dt; });
        walkers = walkers.filter(w => w.x < 650);
        if (year >= 1840) { trainX += dt * 160; if (trainX > 1350) trainX = -200; }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        screen(); ctx.clearRect(0, 0, cssW, cssH); ctx.setLineDash([]); ctx.lineCap = 'butt';
        scene();
        if (mode === 'vapeur') drawVapeur(); else if (mode === 'usine') drawUsine(); else drawVille();
        screen();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    const list = (parts, sel, attr) => `<ol class="ind-list">${parts.map((p, i) => `<li><button data-${attr}="${i}" class="${sel === i ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}${p.from && year < p.from && attr === 'c' ? ` <span class="ind-small">(à partir de ${p.from})</span>` : ''}</button></li>`).join('')}</ol>`;
    function updateInfo() {
        coalBtn.disabled = !running;
        runBtn.textContent = running ? '⏸ Pause' : '▶ Marche';
        stepsBtn.classList.toggle('on', stepIdx >= 0);
        labelsBtn.classList.toggle('on', showLabels);
        playBtn.classList.toggle('on', playing); playBtn.textContent = playing ? '⏸ Pause' : '▶ Le temps passe';
        yearVal.textContent = Math.floor(year);
        const era = year < 1860 ? 'early' : 'late';
        const key = [mode, selV, stepIdx, selU, selC, mode === 'ville' ? Math.round(year / 5) : 0, era].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const scroll = side.scrollTop;
        if (mode === 'vapeur') {
            const steps = `<ol class="ind-steps">${IND_V_STEPS.map((s2, i) => `<li><button data-step="${i}" class="${stepIdx === i ? 'on' : ''}"><b>${i + 1}</b><span>${s2.txt}</span></button></li>`).join('')}</ol>`;
            if (selV >= 0) {
                const p = IND_V_PARTS[selV];
                side.style.borderLeftColor = p.color;
                side.innerHTML = `<h4>La machine à vapeur</h4>
                    <div class="ind-status" style="color:${p.color}">${p.ico} ${p.name}</div>
                    <p class="ind-text">${p.text}</p>
                    <p class="ind-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    <button class="ind-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${list(IND_V_PARTS, selV, 'v')}`;
            } else {
                side.style.borderLeftColor = '#7c2d12';
                side.innerHTML = `<h4>XVIIIᵉ – XIXᵉ siècle</h4>
                    <div class="ind-status" style="color:#7c2d12">⚙️ La machine à vapeur</div>
                    <p class="ind-text">La machine à vapeur transforme la <b>chaleur</b> du charbon en <b>mouvement</b>. Elle fait tourner les machines des usines, avancer les trains et les bateaux : c'est le début de l'<b>âge industriel</b>, qui commence en Angleterre à la fin du XVIIIᵉ siècle et en France vers 1830.</p>
                    <div style="font-weight:800;margin:4px 0">🔢 Comment ça marche ?</div>
                    ${steps}
                    <p class="ind-know">💡 <b>Le savais-tu ?</b> En 1769, le Français Joseph Cugnot construit un « fardier » à vapeur : c'est le premier véhicule automobile de l'histoire !</p>
                    ${list(IND_V_PARTS, selV, 'v')}`;
            }
        } else if (mode === 'usine') {
            if (selU >= 0) {
                const p = IND_U_PARTS[selU];
                side.style.borderLeftColor = p.color;
                side.innerHTML = `<h4>L'usine au XIXᵉ siècle</h4>
                    <div class="ind-status" style="color:${p.color}">${p.ico} ${p.name}</div>
                    <p class="ind-text">${p.text}</p>
                    <p class="ind-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    <button class="ind-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${list(IND_U_PARTS, selU, 'u')}`;
            } else {
                side.style.borderLeftColor = '#7c2d12';
                side.innerHTML = `<h4>XIXᵉ siècle</h4>
                    <div class="ind-status" style="color:#7c2d12">🏭 L'usine</div>
                    <p class="ind-text">Au XIXᵉ siècle, les <b>usines</b> remplacent peu à peu les ateliers des artisans. Des centaines d'ouvriers y travaillent sur des machines, toutes entraînées par une machine à vapeur : on produit beaucoup plus, beaucoup plus vite.</p>
                    <p class="ind-box">👆 Touche les éléments de l'usine pour découvrir la vie des ouvriers.</p>
                    ${list(IND_U_PARTS, selU, 'u')}
                    <div style="height:8px"></div>
                    <p class="ind-know">💡 <b>Quelques dates :</b> 1841 : interdiction du travail des enfants de moins de 8 ans dans les grandes usines · 1884 : syndicats autorisés · 1919 : journée de 8 heures · 1936 : congés payés.</p>`;
            }
        } else {
            const C = IND_CMP[era];
            const table = `<table class="ind-cmp"><tr><th></th><th>🌾 Campagne</th><th>🏙️ Ville</th></tr>${C.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
            if (selC >= 0) {
                const p = IND_C_PARTS[selC];
                side.style.borderLeftColor = p.color;
                side.innerHTML = `<h4>Ville et campagne</h4>
                    <div class="ind-status" style="color:${p.color}">${p.ico} ${p.name}</div>
                    ${p.from && year < p.from ? `<p class="ind-date">⏳ Pas encore en ${Math.round(year)} : avance le curseur après ${p.from} !</p>` : ''}
                    <p class="ind-text">${p.text}</p>
                    <p class="ind-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    <button class="ind-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${list(IND_C_PARTS, selC, 'c')}`;
            } else {
                side.style.borderLeftColor = '#7c2d12';
                side.innerHTML = `<h4>1800 – 1930</h4>
                    <div class="ind-status" style="color:#7c2d12">🏙️ La ville et la campagne</div>
                    <p class="ind-text">Avec l'industrie, les <b>villes grandissent</b> très vite, tandis que les <b>campagnes se vident</b> : c'est l'<b>exode rural</b>. En 1931, pour la première fois, plus de la moitié des Français vivent en ville.</p>
                    <div style="font-weight:800;margin:4px 0">⚖️ Comparer, ${C.label} :</div>
                    ${table}
                    <p class="ind-box">👆 Bouge le curseur et touche la scène pour en savoir plus.</p>
                    ${list(IND_C_PARTS, selC, 'c')}`;
            }
        }
        side.scrollTop = scroll;
    }

    // ── Animation ─────────────────────────────────────────────────────────
    function loop(t) {
        if (!widget.isConnected) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t; time += dt;
        if (sceneWrap.clientWidth === 0) { animId = null; lastT = 0; setTimeout(() => { if (widget.isConnected && !animId) startLoop(); }, 500); return; }
        if (mode === 'vapeur') stepVapeur(dt);
        else if (mode === 'usine') { if (running) uAngle += dt * 4; }
        else stepVille(dt);
        draw();
        animId = requestAnimationFrame(loop);
    }
    function startLoop() { if (!animId) { lastT = 0; animId = requestAnimationFrame(loop); } }
    function refresh() { lastInfoKey = ''; startLoop(); }
    function setMode(md) {
        mode = ['vapeur', 'usine', 'ville'].includes(md) ? md : 'vapeur';
        container.dataset.mode = mode;
        header.querySelectorAll('.ind-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        side.scrollTop = 0;
        refresh();
    }

    // ── Interaction ───────────────────────────────────────────────────────
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
        const dx = (x - OX) / S, dy = (y - OY) / S;
        const inZone = z => z && dx >= z[0] && dx <= z[2] && dy >= z[1] && dy <= z[3];
        let hit = false;
        if (mode !== 'ville' && labelHits.some(h => dx >= h.x && dx <= h.x + h.w && dy >= h.y && dy <= h.y + h.h)) hit = true;
        else if (mode === 'vapeur') hit = IND_V_PARTS.some(p => inZone(p.zone));
        else if (mode === 'usine') hit = IND_U_PARTS.some(p => inZone(p.zone));
        else hit = Object.keys(cRegions).some(k => inZone(cRegions[k]));
        setCursor(hit ? 'pointer' : 'default');
    }
    canvas.addEventListener('pointermove', hoverCursor);
    canvas.addEventListener('pointerup', hoverCursor);
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag; drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel' || d.moved) return;
        const L = local(e); onTap((L.x - OX) / S, (L.y - OY) / S);
    }
    const inZ = (x, y, z) => z && x >= z[0] && x <= z[2] && y >= z[1] && y <= z[3];
    function onTap(x, y) {
        // les étiquettes sont en coordonnées du dessin
        const lh = labelHits.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
        if (mode === 'vapeur') {
            const i = lh ? lh.i : IND_V_PARTS.findIndex(p => inZ(x, y, p.zone));
            selV = selV === i ? -1 : i; stepIdx = -1;
        } else if (mode === 'usine') {
            let i = lh ? lh.i : -1;
            if (i < 0) for (const id of ['enfants', 'contremaitre', 'horloge', 'reglement', 'cheminee', 'machine', 'transmission', 'metiers', 'ouvrieres']) {
                const k = IND_U_PARTS.findIndex(p => p.id === id);
                if (inZ(x, y, IND_U_PARTS[k].zone)) { i = k; break; }
            }
            selU = selU === i ? -1 : i;
        } else {
            let i = -1;
            for (const id of ['batteuse', 'ecole', 'train', 'pollution', 'usine', 'quartier', 'exode', 'ville', 'paysans']) {
                if (inZ(x, y, cRegions[id])) { i = IND_C_PARTS.findIndex(p => p.id === id); break; }
            }
            selC = selC === i ? -1 : i;
        }
        refresh(); save();
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
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.v) { const i = Number(b.dataset.v); selV = selV === i ? -1 : i; stepIdx = -1; }
        else if (b.dataset.u) { const i = Number(b.dataset.u); selU = selU === i ? -1 : i; }
        else if (b.dataset.c) { const i = Number(b.dataset.c); selC = selC === i ? -1 : i; }
        else if (b.dataset.step) { const i = Number(b.dataset.step); stepIdx = stepIdx === i ? -1 : i; selV = -1; }
        else if (b.dataset.action === 'overview') { selV = -1; selU = -1; selC = -1; }
        refresh(); save();
    });
    header.querySelectorAll('.ind-tab').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setMode(b.dataset.mode); save(); }));
    coalBtn.addEventListener('click', () => { fire = Math.min(1, fire + 0.35); refresh(); });
    runBtn.addEventListener('click', () => { running = !running; refresh(); save(); });
    stepsBtn.addEventListener('click', () => { stepIdx = stepIdx >= IND_V_STEPS.length - 1 ? -1 : stepIdx + 1; selV = -1; refresh(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; refresh(); save(); });
    playBtn.addEventListener('click', () => { if (year >= 1930) year = 1800; playing = !playing; refresh(); });
    yearSl.addEventListener('input', () => { year = Number(yearSl.value); playing = false; refresh(); });
    yearSl.addEventListener('change', save);

    helpBtn.addEventListener('pointerdown', stop);
    helpBtn.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    helpPopup.addEventListener('pointerdown', stop);
    helpPopup.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.remove('show'); });
    const closeHelp = () => helpPopup.classList.remove('show');
    document.addEventListener('click', closeHelp);

    // ── Taille ────────────────────────────────────────────────────────────
    function applySize() { container.style.width = contW + 'px'; container.style.height = contH + 'px'; }
    resizeHandle.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX, y0 = e.clientY, w0 = contW, h0 = contH;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (_) {}
        const move = ev => { contW = Math.max(_minW(), w0 + ev.clientX - x0); contH = Math.max(_minH(), h0 + ev.clientY - y0); applySize(); };
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

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin = header.querySelector('[data-role="wf-min"]');
    const wfMax = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        playing = false;
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🏭 L\'âge industriel', { onExpand: () => requestAnimationFrame(() => { applySize(); refresh(); }) });
        }
    });
    wfMax.addEventListener('click', e => { e.stopPropagation(); _isMax = !_isMax; container.classList.toggle('wf-fullboard', _isMax); refresh(); });
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        if (animId) cancelAnimationFrame(animId);
        animId = null; playing = false;
        document.removeEventListener('click', closeHelp);
        widget.remove();
        save();
    });

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
    setMode('vapeur');

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._indGetData = () => ({
        containerW: contW, containerH: contH,
        mode, running, showLabels, selV, selU, selC, year: Math.round(year)
    });
    widget._indSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        running = d.running !== false;
        if (typeof d.showLabels === 'boolean') showLabels = d.showLabels;
        selV = typeof d.selV === 'number' ? Math.max(-1, Math.min(IND_V_PARTS.length - 1, d.selV)) : -1;
        selU = typeof d.selU === 'number' ? Math.max(-1, Math.min(IND_U_PARTS.length - 1, d.selU)) : -1;
        selC = typeof d.selC === 'number' ? Math.max(-1, Math.min(IND_C_PARTS.length - 1, d.selC)) : -1;
        if (typeof d.year === 'number') { year = Math.max(1800, Math.min(1930, d.year)); yearSl.value = year; }
        setMode(d.mode || 'vapeur');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_indSetData');

    save();
    return widget;
}
