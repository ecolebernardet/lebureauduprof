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
// WIDGET PAYS RICHES, PAYS PAUVRES — Le Bureau du Prof
// Trois onglets, pour des élèves de CM1 – CM2 :
//  🗺️ La carte : un planisphère simplifié découpé en grandes régions,
//     colorées selon un indicateur (richesse, espérance de vie, eau potable,
//     lecture, électricité). On touche une région pour l'expliquer ;
//     « Visite guidée » enchaîne les régions, des plus riches aux plus
//     pauvres. Option : la limite Nord-Sud, des pays repères.
//  ⚖️ Comparer : deux pays côte à côte (revenu, espérance de vie, eau,
//     électricité, lecture, mortalité des enfants, médecins).
//  👥 Le village de 100 : « si le monde était un village de 100 habitants »,
//     pour rendre les chiffres mondiaux concrets.
// Une fiche à droite donne l'explication et un « Le savais-tu ? ».
// Trois mini-leçons : qu'est-ce qu'un pays riche, pourquoi ces écarts,
// comment agir.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, tolérance de tremblement sur les « taps », boutons
// de grande taille, rien d'accessible uniquement au survol.
//
// Les chiffres sont arrondis (ordres de grandeur, années 2020 : Banque
// mondiale, ONU, OMS, Unicef). La carte est volontairement simplifiée.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard(),
//   window._wfMiniBarCollapse (widget-geo-monde.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('prp-style')) return;
    const s = document.createElement('style');
    s.id = 'prp-style';
    s.textContent = `
        .widget[data-type="pays-riches-pauvres"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .prp-container {
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
        .prp-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .prp-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .prp-header .wf-btns { gap: 8px; }
        .prp-header .wf-btn { width: 18px; height: 18px; }
        .prp-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .prp-container.wf-fullboard {
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
        .prp-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .prp-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .prp-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .prp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .prp-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .prp-btn:hover { background: #e0e0e0; }
        .prp-btn:active { transform: scale(0.96); }
        .prp-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .prp-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .prp-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .prp-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .prp-ind-btn { padding: 5px 10px; }
        .prp-select {
            min-height: 34px; max-width: 180px; padding: 4px 8px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #fff; color: #1f2937;
            font-size: 13px; font-weight: 700; font-family: inherit; cursor: pointer;
        }
        .prp-select.prp-a { border-left: 5px solid #3b8fd9; }
        .prp-select.prp-b { border-left: 5px solid #e8833a; }

        /* Corps */
        .prp-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .prp-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #cfe6f5;
        }
        .prp-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .prp-hint {
            position: absolute; left: 0; right: 0; bottom: 4px; text-align: center;
            font-size: 12px; color: #4b5563; pointer-events: none;
            text-shadow: 0 1px 2px rgba(255,255,255,.9);
        }
        .prp-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3b8fd9;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .prp-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #1d4f86; }
        .prp-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .prp-change { background: #eaf3fc; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d4f86; font-weight: 700; }
        .prp-text { margin: 0 0 6px; }
        .prp-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .prp-side ul { margin: 0 0 6px; padding-left: 18px; }
        .prp-side li { margin: 0 0 2px; }
        .prp-ind-table { width: 100%; border-collapse: collapse; margin: 0 0 8px; font-size: .92em; }
        .prp-ind-table td { padding: 3px 4px; border-bottom: 1px solid #eceef1; vertical-align: middle; }
        .prp-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: -1px; margin-right: 5px; border: 1px solid rgba(0,0,0,.15); }
        .prp-chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 8px; }
        .prp-chips button {
            min-height: 30px; border-radius: 8px; border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 12.5px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 3px 8px; touch-action: manipulation; text-align: left;
        }
        .prp-chips button.on { background: #1d4f86; color: #fff; border-color: #1d4f86; }
        .prp-subtitle { font-size: .85em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; margin: 8px 0 4px; }
        .prp-small { font-size: .85em; color: #6b7280; }
        .prp-cmp { width: 100%; border-collapse: collapse; margin: 0 0 8px; font-size: .9em; }
        .prp-cmp th, .prp-cmp td { padding: 3px 4px; border-bottom: 1px solid #eceef1; text-align: right; }
        .prp-cmp th:first-child, .prp-cmp td:first-child { text-align: left; }
        .prp-cmp .ca { color: #2a74b8; font-weight: 800; }
        .prp-cmp .cb { color: #c3651f; font-weight: 800; }

        /* Aide */
        .prp-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .prp-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .prp-help-popup.show { display: block; }
        .prp-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .prp-help-popup p { margin: 0 0 6px; }

        .prp-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .prp-resize-handle:hover { opacity: 1; }
        .prp-container:not([data-mode="carte"]) .prp-only-carte { display: none !important; }
        .prp-container:not([data-mode="comparer"]) .prp-only-comparer { display: none !important; }
        .prp-container:not([data-mode="village"]) .prp-only-village { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .prp-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .prp-tab-short { display: none; }
        .prp-header { min-width: 0; max-width: 100%; }
        .prp-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .prp-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .prp-header .wf-btns { flex-shrink: 0; }
        .prp-container.wf-fullboard .prp-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .prp-container { padding: 10px 10px 8px; gap: 6px; }
            .prp-header { gap: 6px; }
            .prp-title { font-size: 13px; }
            .prp-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .prp-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .prp-row > * { flex-shrink: 0; }
            .prp-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .prp-select { min-height: 32px; font-size: 12px; max-width: 140px; }
            .prp-sep { display: none; }
            .prp-row .prp-lbl { display: none; }
            .prp-hint { font-size: 11px; bottom: 2px; padding: 0 6px; }
            .prp-side { padding: 8px 10px; font-size: 13px; }
            .prp-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .prp-title { display: none; }
            .prp-tab { padding: 3px 7px; font-size: 11.5px; }
            .prp-tab-long { display: none; }
            .prp-tab-short { display: inline; }
            .prp-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .prp-body { flex-direction: column; }
            .prp-scene-wrap { flex: 1 1 0; min-height: 220px; }
            .prp-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .prp-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Indicateurs de la carte (niveau 1 = le plus faible … 4 = le plus élevé) ──
const PRP_LV_COL = ['#d94a3a', '#f39c4a', '#c3dc6a', '#3a9f5b'];
const PRP_IND = [
    {
        id: 'rich', ico: '💰', name: 'Richesse', title: 'Richesse par habitant',
        legend: ['pays pauvres', 'revenu modeste', 'revenu moyen', 'pays riches'],
        desc: 'La couleur montre la <b>richesse moyenne par habitant</b> : ce que gagne et produit, en moyenne, une personne en un an.'
    },
    {
        id: 'vie', ico: '❤️', name: 'Espérance de vie', title: 'Espérance de vie',
        legend: ['moins de 66 ans', '66 à 74 ans', '74 à 80 ans', '80 ans et plus'],
        desc: 'L\'<b>espérance de vie</b>, c\'est le nombre d\'années que vit une personne en moyenne. Elle dépend de la nourriture, de l\'eau, des médecins et des hôpitaux.'
    },
    {
        id: 'eau', ico: '💧', name: 'Eau potable', title: 'Habitants qui ont de l\'eau potable',
        legend: ['moins de 75 %', '75 à 90 %', '90 à 98 %', 'plus de 98 %'],
        desc: 'La couleur montre la part des habitants qui ont accès à de l\'<b>eau potable</b> (une eau qu\'on peut boire sans tomber malade) près de chez eux.'
    },
    {
        id: 'ecole', ico: '📚', name: 'Lecture', title: 'Adultes qui savent lire et écrire',
        legend: ['moins de 70 %', '70 à 85 %', '85 à 97 %', 'plus de 97 %'],
        desc: 'La couleur montre la part des <b>adultes qui savent lire et écrire</b>. C\'est un signe que les enfants ont pu aller à l\'école.'
    },
    {
        id: 'elec', ico: '⚡', name: 'Électricité', title: 'Habitants qui ont l\'électricité',
        legend: ['moins de 60 %', '60 à 90 %', '90 à 99 %', 'presque 100 %'],
        desc: 'La couleur montre la part des habitants qui ont l\'<b>électricité</b> chez eux : pour s\'éclairer, conserver la nourriture, faire ses devoirs le soir…'
    }
];

// ── Grandes régions du monde (carte simplifiée, coordonnées [longitude, latitude]) ──
// lv : niveaux [richesse, espérance de vie, eau, lecture, électricité]
const PRP_ZONES = [
    {
        id: 'an', name: 'Amérique du Nord', lab: [-102, 52], lv: [4, 3, 4, 4, 4],
        ex: 'États-Unis, Canada',
        text: 'Les <b>États-Unis</b> et le <b>Canada</b> font partie des pays les plus riches du monde. Presque tout le monde a l\'eau potable, l\'électricité et va à l\'école. Les États-Unis sont la première puissance économique de la planète.',
        know: 'Même dans un pays très riche, il y a des personnes pauvres : aux États-Unis, des millions de personnes n\'ont pas les moyens de se soigner correctement.',
        polys: [
            [[-168,66],[-163,70],[-150,71],[-140,70],[-128,70],[-115,69],[-100,68],[-95,72],[-85,70],[-80,64],[-88,64],[-94,60],[-92,57],[-83,55],[-79,52],[-77,58],[-78,62],[-73,62],[-65,60],[-61,56],[-56,52],[-60,47],[-66,45],[-70,42],[-74,40],[-76,37],[-76,35],[-81,31],[-80,26],[-81,25],[-83,28],[-84,30],[-89,30],[-94,29.5],[-97,27],[-97,26],[-99,26.5],[-104,29.5],[-106.5,31.8],[-111,31.3],[-117,32.5],[-120,34.5],[-124,40],[-124,46],[-123,48],[-127,51],[-131,55],[-136,58],[-140,60],[-147,61],[-152,59],[-158,57],[-164,55],[-158,58],[-162,59],[-165,61],[-165,64]],
            [[-73,78],[-62,82],[-35,83.5],[-20,81],[-18,76],[-22,70],[-32,68],[-40,65],[-44,60],[-50,62],[-53,66],[-55,70],[-60,75]],
            [[-90,72],[-80,73],[-72,71],[-64,67],[-66,63],[-72,64],[-78,66],[-85,69]],
            [[-95,76],[-80,77],[-70,80],[-62,82],[-80,83],[-95,81]]
        ]
    },
    {
        id: 'eu', name: 'Europe', lab: [12, 49], lv: [4, 4, 4, 4, 4],
        ex: 'France, Allemagne, Italie, Espagne, Royaume-Uni…',
        text: 'L\'<b>Europe de l\'Ouest et du Nord</b> est une région riche. Les habitants vivent longtemps (plus de 80 ans en moyenne), l\'école est obligatoire et gratuite, et chacun peut se soigner. La <b>France</b> en fait partie.',
        know: 'Les pays de l\'Union européenne donnent de l\'argent pour aider les pays pauvres : c\'est l\'aide au développement.',
        polys: [
            [[-9.2,43],[-8.9,38.5],[-9,37],[-6,36.2],[-2,36.7],[0,38.5],[0,40],[3.2,41.9],[4,43.4],[6.5,43.1],[8.5,44.3],[10.2,43.9],[12.3,41.7],[15.6,40.1],[16,38],[17.2,39],[18.5,40.1],[16.8,41.2],[13.7,43.6],[12.3,44.6],[13.7,45.7],[15,44.6],[19,41.8],[19.6,39.7],[21,38.3],[22.9,36.5],[24,38],[23,39.5],[24,40.8],[26.3,40.9],[28,41.6],[28.5,43.4],[29.6,45.3],[28.2,45.5],[26.6,48.3],[22.9,48],[22.7,49],[24.1,50.8],[23.6,52.2],[23.5,53.9],[26.6,55.7],[27.8,57.5],[28,59.5],[24,59.4],[23.5,59.2],[21.5,57.5],[21,56.7],[21,55.3],[19.9,54.4],[18.5,54.8],[16,54.3],[14,53.9],[11,54],[10.9,56.4],[10.5,57.7],[8.6,57.1],[8.1,55.5],[8.7,54],[7,53.5],[5,53.4],[4,51.9],[2.5,51.1],[1.6,50.2],[0,49.4],[-1.4,48.6],[-4.7,48.4],[-4.4,47.8],[-2.2,47.1],[-1.2,46],[-1.5,43.4],[-4,43.4],[-8,43.7]],
            [[5.3,59],[5,61.8],[8,63.4],[10.5,64.5],[12.4,66],[14.5,67.8],[16,68.8],[18.5,69.8],[21.5,70.2],[24,71],[28,71],[30.5,70],[29,69.5],[29.6,67],[30,64],[31.5,62.9],[30,61],[28.5,60.5],[26,60.4],[22.8,59.9],[21.4,60.6],[21.5,62.5],[24.5,64.8],[25.4,65.2],[22.2,65.8],[21,64.5],[19,63.4],[17.5,62.3],[17.3,61],[18.8,60.1],[18.3,59.3],[16.6,57.2],[15.9,56.1],[14,55.4],[12.8,55.6],[12.6,56.6],[11.8,58],[11,59],[10.4,59.3],[9.5,58.9],[8,58.1],[6.5,58.1]],
            [[-5.7,50],[-3,50.6],[1.4,51.2],[1.7,52.7],[0.3,53.4],[-0.2,54.4],[-1.5,55.5],[-2.1,57.6],[-3.3,58.6],[-5,58.6],[-6.2,56.8],[-5.5,55.3],[-3.5,54.8],[-3.1,53.4],[-4.6,53.3],[-4.2,52.3],[-5.2,51.7],[-3.3,51.4]],
            [[-10.3,51.9],[-6.3,52.2],[-6,53.6],[-5.7,54.7],[-7.4,55.3],[-8.5,54.6],[-10,53.5]],
            [[-24,65.5],[-21,63.9],[-17,63.4],[-13.6,65],[-15,66.4],[-18.5,66.2],[-22.4,66.4]]
        ]
    },
    {
        id: 'jk', name: 'Japon, Corée du Sud, Taïwan', lab: [152, 40], lv: [4, 4, 4, 4, 4],
        ex: 'Japon, Corée du Sud, Taïwan',
        text: 'Le <b>Japon</b>, la <b>Corée du Sud</b> et <b>Taïwan</b> sont des pays riches d\'Asie, connus pour leurs industries (voitures, téléphones, ordinateurs). Au Japon, on vit en moyenne 84 ans : c\'est l\'un des records du monde !',
        know: 'En 1960, la Corée du Sud était aussi pauvre que beaucoup de pays d\'Afrique. Grâce à l\'école et à l\'industrie, c\'est aujourd\'hui un pays riche. La Corée du Nord, sa voisine, est restée très pauvre.',
        polys: [
            [[126.3,34.4],[127.5,34.6],[129.3,35.2],[129.5,36.8],[128.4,38.6],[126.7,37.8],[126.6,36],[126.1,35]],
            [[129.8,31.3],[131.3,31.4],[132,33.8],[135.2,33.5],[136.9,34.3],[138.8,34.6],[140.9,35.7],[140.9,38.2],[141.9,39.8],[141.4,41.4],[140,40.8],[139.9,39.5],[138.5,37.8],[136.8,37.3],[136,35.6],[133,35.5],[131,34.3],[129.6,33.3]],
            [[140,41.5],[141.3,41.9],[143.2,42],[145.5,43.3],[144,44.1],[141.8,45.4],[141.4,43.4],[140,42.8]],
            [[120.1,23.1],[120.7,22],[121.6,24.5],[121.8,25.2],[121,25],[120.2,24]]
        ]
    },
    {
        id: 'au', name: 'Australie et Nouvelle-Zélande', lab: [134, -26], lv: [4, 4, 4, 4, 4],
        ex: 'Australie, Nouvelle-Zélande',
        text: 'L\'<b>Australie</b> et la <b>Nouvelle-Zélande</b> sont dans l\'hémisphère Sud, mais ce sont des pays riches, comme ceux d\'Europe. On les range donc avec les « pays du Nord ».',
        know: 'Les petites îles voisines de l\'océan Pacifique (comme la Papouasie-Nouvelle-Guinée) sont, elles, beaucoup plus pauvres.',
        polys: [
            [[113.5,-22],[115,-21.4],[117.5,-20.6],[121,-19.5],[122.5,-17],[124,-16.3],[125.9,-14.3],[127.8,-14.3],[129.5,-14.9],[130.4,-12.4],[132.6,-11.5],[135.9,-12.1],[136.6,-13.4],[135.5,-14.9],[137.5,-16.4],[139.3,-17.4],[140.8,-17.4],[141.7,-14.6],[142.5,-10.7],[143.5,-12.9],[143.7,-14.4],[145.4,-15],[146.2,-18.9],[149,-21.4],[150.8,-22.6],[153.2,-25.2],[153.6,-28.6],[153,-31.4],[151.3,-33.9],[150,-37.2],[147.9,-37.9],[145,-38.5],[143.5,-38.8],[140.6,-38],[138.3,-35.6],[137.8,-32.6],[135.6,-34.8],[134.2,-32.8],[131.3,-31.5],[128,-32.2],[124,-33.8],[120,-33.9],[117.8,-35.1],[115,-34.3],[115.6,-31.5],[114.9,-28.3],[113.4,-25.6],[113.7,-23]],
            [[144.7,-40.7],[148.3,-40.9],[148,-43.3],[146,-43.6]],
            [[172.7,-34.5],[174.5,-36],[176,-37.6],[178.5,-37.7],[177.3,-39.2],[176.2,-41.2],[174.6,-41.3],[175,-39.8],[173.8,-39.2],[174.6,-37.4]],
            [[172.7,-40.5],[174.3,-41.5],[173.2,-43],[172.7,-43.8],[171.2,-44.5],[170.7,-45.9],[169,-46.6],[166.5,-46],[168.3,-44],[170.5,-43],[172,-41.7]]
        ]
    },
    {
        id: 'golfe', name: 'Pays du golfe Persique', lab: [47, 23], lv: [4, 3, 4, 3, 4],
        ex: 'Arabie saoudite, Émirats arabes unis, Qatar, Koweït',
        text: 'Ces pays du désert sont devenus <b>riches grâce au pétrole</b> et au gaz, qu\'ils vendent dans le monde entier. Ils ont construit des villes modernes, des routes et des hôpitaux.',
        know: 'Le pétrole ne durera pas toujours : ces pays essaient de développer d\'autres activités, comme le tourisme. Le Yémen, leur voisin, est au contraire l\'un des pays les plus pauvres du monde.',
        polys: [
            [[36,28],[38,30],[42,31],[47,29],[48,28],[50,26],[51.5,24.5],[54,24.2],[56,26],[56.4,24.5],[59.8,22.5],[57.8,19],[55,17.5],[52,17.5],[48,17.5],[44,17.3],[42.8,16.5],[41,18.5],[39,21.5],[37,25],[35,28]]
        ]
    },
    {
        id: 'ru', name: 'Russie, Europe de l\'Est et Asie centrale', lab: [92, 62], lv: [3, 2, 3, 4, 4],
        ex: 'Russie, Ukraine, Kazakhstan, Ouzbékistan…',
        text: 'La <b>Russie</b> est le plus grand pays du monde. Elle possède beaucoup de pétrole, de gaz et de minerais. Les habitants de cette région vont presque tous à l\'école, mais ils vivent moins longtemps qu\'en Europe de l\'Ouest et la richesse est mal partagée.',
        know: 'En Russie, les hommes vivent en moyenne une dizaine d\'années de moins que les femmes.',
        polys: [
            [[29.6,45.3],[28.2,45.5],[26.6,48.3],[22.9,48],[22.7,49],[24.1,50.8],[23.6,52.2],[23.5,53.9],[26.6,55.7],[27.8,57.5],[28,59.5],[28.5,60.5],[30,61],[31.5,62.9],[30,64],[29.6,67],[29,69.5],[31,70],[33,69.3],[36,69],[41,67],[40,66],[38,64.5],[44,66.3],[44,68.5],[50,68],[53,68.8],[58,68.5],[60,69.5],[66,69.3],[67,68],[69,72.8],[73,72.5],[72,71],[75,72.5],[80,73.5],[87,74],[90,75.5],[98,76],[104,77.7],[112,76.2],[113,73.5],[120,73],[128,73],[131,71],[140,72.5],[150,71.5],[160,70],[170,70],[180,69],[180,65],[178,64.5],[174,61.5],[170,60],[163,59.8],[162,57.8],[163,56],[156,51],[156,57],[158,61.5],[152,59.2],[142,59.3],[137,54],[141,52.5],[140.4,48.4],[135,43.5],[131,42.6],[131,45],[134,47.8],[131,47.7],[127.5,49.8],[121,53.3],[117,49.6],[116,50],[108,49.6],[97,50.5],[90,50],[87,49.2],[85,47],[82.5,45.3],[80,45],[80.3,42.8],[76,40.5],[74,39.5],[74.6,37.1],[71,37],[66,37.5],[61.2,36.6],[54,37.3],[53,37],[49,37.5],[48,38.5],[46,38.9],[43.5,41.1],[41.5,41.5],[40,43.4],[37.5,44.7],[39,47.2],[38,47],[36,45.3],[33.5,44.5],[33,46],[30.7,46.5]]
        ]
    },
    {
        id: 'cn', name: 'Chine et Mongolie', lab: [96, 37], lv: [3, 3, 3, 3, 4],
        ex: 'Chine, Mongolie',
        text: 'La <b>Chine</b> est le pays le plus peuplé du monde avec l\'Inde (environ 1,4 milliard d\'habitants chacun). C\'est un <b>pays émergent</b> : il y a 40 ans, la plupart des Chinois étaient très pauvres ; aujourd\'hui, la Chine est devenue « l\'atelier du monde » et beaucoup d\'habitants vivent mieux.',
        know: 'Beaucoup d\'objets que nous utilisons (jouets, téléphones, vêtements) sont fabriqués en Chine. Mais les campagnes chinoises restent bien plus pauvres que les grandes villes.',
        polys: [
            [[74,39.5],[76,40.5],[80.3,42.8],[80,45],[82.5,45.3],[85,47],[87,49.2],[90,50],[97,50.5],[108,49.6],[116,50],[117,49.6],[121,53.3],[127.5,49.8],[131,47.7],[134,47.8],[131,45],[131,42.6],[130,42.3],[129.7,41],[128,39],[128.4,38.6],[126.7,37.8],[125,37.8],[124.4,39.8],[122,39],[121.6,40.8],[119,39.3],[117.8,38.5],[119,37.2],[122.5,37],[120.3,36],[119,35],[120.8,32.5],[121.8,30.9],[121.3,28.2],[119.6,25.6],[117,23.5],[114,22.3],[110.5,21.2],[108.5,21.6],[107,21.7],[106.6,22.9],[105.5,23.3],[103,22.6],[101.7,21.2],[100.2,21.5],[99.3,22.2],[98.7,24.1],[97.6,24.3],[98.3,27.5],[97,28.2],[95.4,29],[92,27.9],[88.8,27.4],[85,28.3],[81,30.2],[79,31.4],[78.6,33.5],[79.5,35.5],[77.8,35.6],[74.6,37.1]]
        ]
    },
    {
        id: 'la', name: 'Amérique latine', lab: [-60, -12], lv: [3, 3, 3, 3, 3],
        ex: 'Mexique, Brésil, Argentine, Colombie, Pérou, Haïti…',
        text: 'L\'<b>Amérique latine</b> (le Mexique, l\'Amérique centrale et l\'Amérique du Sud) est une région de <b>revenu moyen</b>. Le Brésil et le Mexique sont des pays émergents. Mais c\'est aussi une région de très grandes inégalités : de beaux quartiers riches côtoient des bidonvilles (les favelas au Brésil).',
        know: '<b>Haïti</b>, dans la mer des Caraïbes, est le pays le plus pauvre du continent américain, alors que les États-Unis, les plus riches, sont tout proches.',
        polys: [
            [[-117,32.5],[-111,31.3],[-106.5,31.8],[-104,29.5],[-99,26.5],[-97,26],[-97.5,22],[-96,19],[-94,18.2],[-91,18.6],[-90.5,21],[-87,21.5],[-88,18],[-88.5,16],[-84,15.8],[-83.3,14],[-83.6,11],[-82,9],[-79.5,9.5],[-77.5,8.7],[-76,9.5],[-75,11],[-72,12],[-70,12],[-66,10.6],[-62,10.6],[-60,8.5],[-57,6],[-52,5],[-50,1.5],[-48,-1],[-44,-2.5],[-40,-3],[-35,-5.5],[-35,-9],[-37,-12],[-39,-15],[-39.5,-19],[-41,-22],[-44,-23],[-48,-26],[-49,-29],[-53,-33.7],[-57,-36],[-57.5,-38.5],[-62,-39],[-65,-41],[-64,-43],[-66,-46],[-68,-50],[-68.5,-53],[-66,-55],[-70,-55],[-74,-52],[-75.5,-47],[-74,-43],[-73.5,-37],[-71.5,-31],[-70.5,-25],[-70,-18],[-73,-16],[-76,-14],[-79,-8],[-81,-5],[-80,-2],[-80.5,0.5],[-78.5,2],[-77.5,4],[-77.4,7],[-78.5,8.5],[-80,7.4],[-83,8.3],[-85.7,11],[-87.5,13],[-91.5,14],[-94,16],[-96.5,15.7],[-101,17.3],[-105,19.5],[-105.5,22.5],[-108,25],[-112,29],[-113,31.3],[-115,30],[-114,27],[-111.5,24.5],[-110,23],[-112,25],[-115,28],[-116.5,31]],
            [[-85,21.8],[-80,23.2],[-74.5,20.3],[-72.8,19.9],[-69,19.6],[-68.4,18.4],[-72,18],[-74.3,18.3],[-77.5,19.9],[-80,21.8]]
        ]
    },
    {
        id: 'namo', name: 'Afrique du Nord et Moyen-Orient', lab: [5, 27], lv: [2, 3, 3, 2, 3],
        ex: 'Maroc, Algérie, Égypte, Turquie, Iran, Irak, Syrie, Yémen…',
        text: 'Cette région a souvent un <b>revenu modeste</b>, avec de grandes différences : la Turquie s\'est beaucoup développée, alors que la Syrie, l\'Irak ou le Yémen ont été ravagés par des guerres. Une grande partie du territoire est un désert (le Sahara), et l\'eau y est précieuse.',
        know: 'Les guerres font reculer un pays de plusieurs dizaines d\'années : les écoles, les hôpitaux et les routes sont détruits, et beaucoup d\'habitants doivent fuir.',
        polys: [
            [[-17,21],[-16,24],[-13,27.8],[-10,29.5],[-9.7,32],[-6.8,34],[-5.9,35.8],[-2,35.1],[1,36.5],[6,37],[10,37.3],[11,35.5],[10,34],[11.5,33.1],[15.3,32.3],[19,30.3],[20,32],[23,32.6],[25,31.7],[29,31],[32,31.2],[34.3,31.3],[35,33],[36,35.8],[35.8,36.8],[32,36.2],[30,36.3],[27.3,37],[26.3,39.2],[26.1,40.6],[29,41.1],[32,41.9],[36,41.7],[41.5,41.5],[43.5,41.1],[46,38.9],[48,38.5],[49,37.5],[53,37],[54,37.3],[61.2,36.6],[61,31.5],[62,29.5],[63,26.5],[61.6,25.2],[57.3,25.8],[56.4,27.1],[54.7,26.5],[51.5,27.9],[50.2,30],[48.7,30],[48,29.5],[47,29],[42,31],[38,30],[35,28],[34.3,28],[32.7,29.8],[33.6,27],[35.6,23.9],[37.2,22],[25,20],[12,22],[0,20],[-12,20]],
            [[42.8,16.5],[44,17.3],[48,17.5],[52,17.5],[53,16.6],[51.5,15.2],[48.5,14],[45,12.8],[43.5,12.7],[42.6,15]]
        ]
    },
    {
        id: 'sa', name: 'Asie du Sud', lab: [77, 18], lv: [2, 2, 3, 2, 3],
        ex: 'Inde, Pakistan, Bangladesh, Afghanistan, Népal, Sri Lanka',
        text: 'L\'<b>Asie du Sud</b> est très peuplée : près d\'un humain sur quatre y vit ! L\'<b>Inde</b> se développe vite (informatique, médicaments, industrie), mais beaucoup d\'habitants restent pauvres, surtout dans les campagnes.',
        know: 'L\'Afghanistan, en guerre pendant des dizaines d\'années, est l\'un des pays les plus pauvres du monde. Les filles n\'y ont plus le droit d\'aller au collège.',
        polys: [
            [[61.2,36.6],[66,37.5],[71,37],[74.6,37.1],[77.8,35.6],[79.5,35.5],[78.6,33.5],[79,31.4],[81,30.2],[85,28.3],[88.8,27.4],[92,27.9],[95.4,29],[97,28.2],[95.2,26.5],[94.3,24],[93.3,22.5],[92.3,21],[92,21.3],[91.8,22.4],[90.6,22.1],[89,21.8],[86.9,21.6],[86.5,20.2],[85,19.4],[82.3,16.6],[80.3,15.8],[80.2,13],[79.8,10.3],[78.2,8.9],[77.5,8.1],[76.5,9],[75.8,11.4],[74.6,14.8],[73.4,16.4],[72.8,19],[72.6,21.4],[70.8,20.7],[69,22.3],[68.3,23.6],[67.4,24],[66.5,25.4],[64,25.3],[61.6,25.2],[63,26.5],[62,29.5],[61,31.5]],
            [[79.8,6.2],[81.8,7.2],[81.2,8.7],[80.2,9.8],[79.8,8]]
        ]
    },
    {
        id: 'sea', name: 'Asie du Sud-Est', lab: [114, 7], lv: [2, 2, 3, 3, 3],
        ex: 'Indonésie, Viêt Nam, Philippines, Thaïlande, Birmanie…',
        text: 'L\'<b>Asie du Sud-Est</b> se développe rapidement. La Thaïlande et la Malaisie sont des pays émergents ; le Viêt Nam fabrique de plus en plus de produits pour le monde entier. Mais la Birmanie, le Cambodge ou le Laos restent pauvres.',
        know: 'L\'Indonésie est formée de plus de 17 000 îles ! C\'est le quatrième pays le plus peuplé du monde.',
        polys: [
            [[97,28.2],[98.3,27.5],[97.6,24.3],[98.7,24.1],[99.3,22.2],[100.2,21.5],[101.7,21.2],[103,22.6],[105.5,23.3],[106.6,22.9],[107,21.7],[106.7,20.7],[105.7,19],[106.6,17.5],[108.8,15.4],[109.3,13],[109.2,11.5],[107.5,10.4],[106.3,9.4],[105,8.6],[104.8,10.3],[103,11.1],[102.3,12.2],[100.9,13.4],[100,13.4],[99.2,10.4],[100.3,8.4],[100.4,6.4],[101.5,2.9],[103.5,1.3],[104.2,1.4],[103.4,4.9],[102.2,6.2],[101.1,6.9],[99.5,7.3],[98.3,8],[98.5,10.6],[98.3,13],[97.7,16.2],[97.2,16.9],[96,17],[94.3,16.2],[94.7,18],[93.5,19.6],[92.3,21],[93.3,22.5],[94.3,24],[95.2,26.5]],
            [[95.3,5.6],[97.5,5.2],[100.4,2.3],[104,-1],[106,-3],[105.8,-5.8],[104.5,-5.9],[102.3,-4],[100.9,-2],[99,0],[98,2],[96,3.8]],
            [[105.2,-6.8],[108,-6.3],[111,-6.5],[114.6,-7.7],[114.4,-8.6],[110,-8.1],[106.5,-7.4]],
            [[109,1.5],[110.5,-1.5],[110.2,-2.9],[114,-3.4],[116.5,-3.5],[116,-1],[117.9,1.1],[118.7,5],[117,7],[115.4,5],[113,3.2],[111,1.9]],
            [[119.4,-5.5],[120.5,-5.6],[121,-3],[122.5,-5],[123.3,-4.5],[122,-1.5],[123,1],[124.9,1.5],[121,1.2],[120,0.5],[119.3,-1.5]],
            [[120,18.5],[122.3,18.4],[122.2,16],[121.5,14.5],[124,13],[125.6,11.5],[126.3,9.2],[126.5,7],[125.4,6],[124,6.5],[122,7],[122.8,8.8],[123.5,10.5],[121.5,12.2],[120.5,14.4],[119.8,16.3]],
            [[131,-1],[134,-0.9],[137.8,-1.5],[141,-2.6],[145,-4.5],[147.5,-6.2],[147.2,-8],[150.5,-10.5],[147,-10.2],[143.5,-9],[142.5,-9.3],[140.7,-9],[138.8,-8.2],[137.7,-5.2],[135,-4.4],[133,-4],[132,-2.9]]
        ]
    },
    {
        id: 'ssa', name: 'Afrique subsaharienne', lab: [22, -6], lv: [1, 1, 1, 1, 1],
        ex: 'Niger, Mali, Tchad, Éthiopie, Congo, Madagascar…',
        text: 'L\'<b>Afrique subsaharienne</b> (au sud du Sahara) regroupe la plupart des <b>pays les plus pauvres du monde</b>. Beaucoup d\'habitants n\'ont pas d\'eau potable ni d\'électricité, et trop d\'enfants ne vont pas à l\'école ou meurent de maladies que l\'on sait soigner (paludisme, diarrhées).',
        know: 'L\'Afrique est pourtant riche en ressources (or, pétrole, cacao, cobalt pour les batteries…), mais ces ressources sont souvent vendues bon marché et profitent peu aux habitants. Certains pays, comme l\'Afrique du Sud ou le Botswana, sont moins pauvres. La population y est très jeune : la moitié des habitants a moins de 19 ans.',
        polys: [
            [[-17,21],[-12,20],[0,20],[12,22],[25,20],[37.2,22],[38.5,18],[40,15.5],[43.3,12.6],[44.5,10.4],[51.2,11.8],[51,10.4],[48,4.5],[42.5,-0.7],[40.2,-2.8],[39.3,-4.7],[39.2,-8],[40.4,-11],[40.6,-15],[37,-17.5],[35.3,-22],[32.9,-26],[32.4,-29],[30,-31.3],[27.5,-33.3],[25,-34],[22,-34.3],[20,-34.8],[18.4,-34],[18,-32],[16.5,-28.6],[14.5,-22.9],[11.8,-17.3],[12.2,-14],[13.6,-11.5],[12.3,-6],[11,-3.9],[9,-0.7],[9.6,2.7],[8.7,4.5],[6.7,4.3],[4.5,6.3],[1.2,6.1],[-2,4.8],[-4.5,5.2],[-7.5,4.4],[-9.6,5.6],[-11.4,6.9],[-13.2,8.8],[-15,10.9],[-16.7,12.4],[-17.2,14.7],[-16.5,16.5],[-16.2,19.5]],
            [[44,-25],[47,-25],[50.4,-15.5],[49.4,-12],[47,-14.5],[44.3,-16.5],[43.3,-22]]
        ]
    }
];
// Mer Caspienne (dessinée par-dessus, en eau)
const PRP_CASPIAN = [[47,45],[49.5,46.5],[53,46.8],[53.2,45],[51.3,44.3],[52.5,42],[54,40.8],[53.8,37.4],[51,36.7],[49,37.6],[49.5,40.3],[47.6,43]];
// Limite Nord-Sud (simplifiée, d'après la « ligne Brandt »)
const PRP_NS_LINE = [[-180,32],[-125,32],[-117,32.5],[-111,31.3],[-106.5,31.8],[-97,26],[-90,26],[-80,24.5],[-60,30],[-30,36],[-10,36],[-5.6,36],[10,38],[25,34.8],[28,35.5],[36,36.8],[42,37.3],[44.5,39.5],[48,38.8],[53,37.8],[60,37],[66,37.6],[71,37.2],[74,38],[76,41],[80.5,43],[80,45],[83,47],[87,49.5],[97,51],[108,50],[116,50.5],[122,52],[127,50],[131,47],[132,43],[130.5,42.3],[128,38.7],[126,38],[124,37.5],[124,33],[128,31],[135,30],[145,28],[150,15],[150,0],[135,-8],[120,-10],[112,-12],[108,-25],[110,-42],[140,-46],[165,-49],[180,-49]];

// ── Pays repères (carte + comparaison) — valeurs arrondies, années 2020 ──
// rev : revenu moyen par habitant (€ par an) · ev : espérance de vie (ans)
// eau / elec : % des habitants · lire : % des adultes · morta : enfants
// morts avant 5 ans sur 1 000 · med : médecins pour 10 000 habitants
const PRP_COUNTRIES = {
    FR: { name: 'France', en: 'en France', ll: [2.3, 46.8], zone: 'eu', rev: 40000, ev: 82, eau: 100, elec: 100, lire: 99, morta: 4, med: 32,
          note: 'La France est un pays riche d\'Europe. L\'école y est obligatoire de 3 à 16 ans et les soins sont en grande partie remboursés.' },
    US: { name: 'États-Unis', en: 'aux États-Unis', ll: [-98, 39], zone: 'an', rev: 75000, ev: 77, eau: 100, elec: 100, lire: 99, morta: 6, med: 36,
          note: 'Les États-Unis sont le pays le plus riche du monde en tout. Pourtant, on y vit moins longtemps qu\'en France : la santé coûte cher et les inégalités sont fortes.' },
    JP: { name: 'Japon', en: 'au Japon', ll: [138.5, 36.3], zone: 'jk', rev: 31000, ev: 84, eau: 99, elec: 100, lire: 99, morta: 2, med: 26,
          note: 'Le Japon est un pays riche et très industrialisé. On y vit très vieux : c\'est l\'un des records du monde.' },
    CN: { name: 'Chine', en: 'en Chine', ll: [112, 31], zone: 'cn', rev: 11500, ev: 78, eau: 94, elec: 100, lire: 97, morta: 7, med: 24,
          note: 'La Chine est un pays émergent : en 40 ans, des centaines de millions de Chinois sont sortis de la grande pauvreté.' },
    BR: { name: 'Brésil', en: 'au Brésil', ll: [-50, -10], zone: 'la', rev: 9500, ev: 73, eau: 98, elec: 100, lire: 94, morta: 14, med: 22,
          note: 'Le Brésil est un pays émergent, grand producteur agricole. Les écarts entre riches et pauvres y sont parmi les plus grands du monde.' },
    IN: { name: 'Inde', en: 'en Inde', ll: [79, 22], zone: 'sa', rev: 2300, ev: 68, eau: 93, elec: 99, lire: 76, morta: 30, med: 7,
          note: 'L\'Inde est le pays le plus peuplé du monde. Elle se développe vite, mais des centaines de millions d\'habitants restent pauvres.' },
    BD: { name: 'Bangladesh', en: 'au Bangladesh', ll: [90.3, 23.8], zone: 'sa', rev: 2300, ev: 73, eau: 98, elec: 99, lire: 76, morta: 29, med: 7,
          note: 'Le Bangladesh est un pays très peuplé qui fabrique beaucoup de vêtements vendus en Europe. Il a fait de gros progrès pour la santé.' },
    HT: { name: 'Haïti', en: 'en Haïti', ll: [-72.5, 18.9], zone: 'la', rev: 1500, ev: 64, eau: 67, elec: 49, lire: 62, morta: 57, med: 2,
          note: 'Haïti est le pays le plus pauvre d\'Amérique. Il a subi des catastrophes (séisme de 2010, ouragans) et de graves violences.' },
    ET: { name: 'Éthiopie', en: 'en Éthiopie', ll: [39, 9], zone: 'ssa', rev: 1000, ev: 65, eau: 57, elec: 55, lire: 52, morta: 47, med: 1,
          note: 'L\'Éthiopie est un grand pays d\'Afrique de l\'Est, très peuplé. Les sécheresses y provoquent souvent des famines.' },
    ML: { name: 'Mali', en: 'au Mali', ll: [-3, 16], zone: 'ssa', rev: 850, ev: 59, eau: 83, elec: 53, lire: 31, morta: 97, med: 1,
          note: 'Le Mali est un pays d\'Afrique de l\'Ouest, en partie dans le désert. Beaucoup d\'enfants, surtout les filles, ne vont pas à l\'école.' },
    NE: { name: 'Niger', en: 'au Niger', ll: [9, 15], zone: 'ssa', rev: 550, ev: 61, eau: 56, elec: 20, lire: 38, morta: 115, med: 0.4,
          note: 'Le Niger est l\'un des pays les plus pauvres du monde. Seulement 1 habitant sur 5 a l\'électricité, et la population augmente très vite.' }
};
const PRP_C_ORDER = ['FR', 'US', 'JP', 'CN', 'BR', 'IN', 'BD', 'HT', 'ET', 'ML', 'NE'];
const PRP_CMP_IND = [
    { k: 'rev',   ico: '💰', name: 'Revenu moyen',            unit: '€ par habitant et par an', max: 80000 },
    { k: 'ev',    ico: '❤️', name: 'Espérance de vie',        unit: 'ans',                      max: 90 },
    { k: 'eau',   ico: '💧', name: 'Eau potable',             unit: '% des habitants',          max: 100 },
    { k: 'elec',  ico: '⚡', name: 'Électricité',             unit: '% des habitants',          max: 100 },
    { k: 'lire',  ico: '📚', name: 'Adultes qui savent lire', unit: '% des adultes',            max: 100 },
    { k: 'morta', ico: '👶', name: 'Enfants morts avant 5 ans', unit: 'sur 1 000 (moins = mieux)', max: 120, low: true },
    { k: 'med',   ico: '🩺', name: 'Médecins',                unit: 'pour 10 000 habitants',    max: 40 }
];
const PRP_PRESETS = [['FR', 'NE'], ['US', 'HT'], ['JP', 'IN'], ['CN', 'ML'], ['FR', 'BR'], ['BD', 'ET']];

// ── Le village de 100 habitants ───────────────────────────────────────────
const PRP_GREY = '#d5d9e0';
const PRP_VQ = [
    {
        id: 'riches', ico: '🏙️', name: 'Pays riches', title: 'Combien vivent dans un pays riche ?',
        cats: [{ n: 16, c: '#3a9f5b', l: 'vivent dans un pays riche' }],
        rest: 'vivent dans un pays à revenu moyen ou pauvre',
        text: 'Sur 100 habitants de la Terre, seulement <b>16</b> vivent dans un pays riche (Europe, Amérique du Nord, Japon, Australie…). Les <b>84</b> autres vivent dans des pays à revenu moyen ou pauvre.',
        know: 'Un enfant français fait partie des habitants les plus favorisés de la planète : il a de l\'eau au robinet, l\'électricité et une école gratuite.'
    },
    {
        id: 'continents', ico: '🌍', name: 'Continents', title: 'Où vivent les 100 habitants ?',
        cats: [
            { n: 59, c: '#e8833a', l: 'en Asie' },
            { n: 18, c: '#b9473a', l: 'en Afrique' },
            { n: 13, c: '#3b8fd9', l: 'en Amérique' },
            { n: 9,  c: '#7b6fd0', l: 'en Europe' },
            { n: 1,  c: '#14a0a0', l: 'en Océanie' }
        ],
        text: 'Plus de la moitié des humains vivent en <b>Asie</b> (59 sur 100), surtout en Chine et en Inde. L\'<b>Afrique</b> en compte 18, l\'<b>Amérique</b> 13, l\'<b>Europe</b> 9 et l\'<b>Océanie</b> seulement 1.',
        know: 'La population de l\'Afrique augmente très vite : dans 25 ans, un humain sur quatre sera africain.'
    },
    {
        id: 'pauvrete', ico: '💸', name: 'Grande pauvreté', title: 'Combien vivent avec moins de 2 € par jour ?',
        cats: [{ n: 9, c: '#d94a3a', l: 'vivent avec moins de 2 € par jour' }],
        rest: 'ont un peu plus (souvent à peine plus)',
        text: '<b>9</b> habitants sur 100 vivent dans la <b>grande pauvreté</b> : ils ont moins de 2 € par jour pour se nourrir, se loger, se soigner. La plupart vivent en Afrique subsaharienne.',
        know: 'C\'est un grand progrès : en 1990, presque 4 humains sur 10 vivaient dans la grande pauvreté. Aujourd\'hui, c\'est moins de 1 sur 10.'
    },
    {
        id: 'faim', ico: '🍽️', name: 'Faim', title: 'Combien ne mangent pas à leur faim ?',
        cats: [{ n: 9, c: '#c0682a', l: 'ne mangent pas à leur faim' }],
        rest: 'mangent à leur faim',
        text: 'Environ <b>9</b> habitants sur 100 souffrent de la <b>faim</b>. Pourtant, la Terre produit assez de nourriture pour tout le monde : le problème, c\'est la pauvreté, les guerres, les sécheresses et le gaspillage.',
        know: 'Environ un tiers de la nourriture produite dans le monde est perdu ou jeté.'
    },
    {
        id: 'eau', ico: '💧', name: 'Eau potable', title: 'Combien n\'ont pas d\'eau potable sûre chez eux ?',
        cats: [{ n: 27, c: '#2f7fd8', l: 'n\'ont pas d\'eau potable sûre chez eux' }],
        rest: 'ont de l\'eau potable sûre',
        text: '<b>27</b> habitants sur 100 n\'ont pas d\'eau potable sûre à la maison. Beaucoup doivent marcher longtemps pour aller chercher de l\'eau au puits ou à la rivière, et cette eau peut les rendre malades.',
        know: 'Dans de nombreux pays, ce sont souvent les filles qui vont chercher l\'eau, parfois plusieurs heures par jour : du temps en moins pour l\'école.'
    },
    {
        id: 'elec', ico: '⚡', name: 'Électricité', title: 'Combien n\'ont pas l\'électricité ?',
        cats: [{ n: 9, c: '#e6b800', l: 'n\'ont pas l\'électricité' }],
        rest: 'ont l\'électricité',
        text: '<b>9</b> habitants sur 100 n\'ont <b>pas l\'électricité</b>. Le soir, ils s\'éclairent à la bougie ou à la lampe à pétrole. 8 sur 10 d\'entre eux vivent en Afrique subsaharienne.',
        know: 'Les petits panneaux solaires permettent aujourd\'hui à des millions de familles d\'avoir de la lumière pour la première fois.'
    },
    {
        id: 'internet', ico: '🌐', name: 'Internet', title: 'Combien n\'utilisent pas internet ?',
        cats: [{ n: 33, c: '#7b6fd0', l: 'n\'utilisent pas internet' }],
        rest: 'utilisent internet',
        text: '<b>33</b> habitants sur 100 n\'utilisent <b>jamais internet</b>. Dans les pays riches, presque tout le monde est connecté ; dans les pays pauvres, moins d\'une personne sur trois.',
        know: 'Sans internet, il est plus difficile d\'apprendre, de trouver du travail ou d\'accéder à des services comme la banque.'
    },
    {
        id: 'richesse', ico: '💎', name: 'Partage des richesses', title: 'Comment les richesses sont-elles partagées ?',
        cats: [
            { n: 10, c: '#e0a800', l: 'les plus riches' },
            { n: 40, c: '#8fb3d9', l: 'au milieu' },
            { n: 50, c: '#b98d6a', l: 'les plus pauvres' }
        ],
        share: [76, 22, 2],
        text: 'Si on partageait toutes les richesses du monde en 100 parts, les <b>10 habitants les plus riches</b> en auraient <b>76</b>, les 40 du milieu 22, et les <b>50 plus pauvres</b> seulement <b>2</b> à se partager !',
        know: 'Ces inégalités existent entre les pays, mais aussi à l\'intérieur de chaque pays, même en France.'
    }
];

// ── Mini-leçons (fiche de droite) ─────────────────────────────────────────
const PRP_LESSONS = {
    riche: {
        ico: '📖', name: 'Qu\'est-ce qu\'un pays riche ?',
        html: `<p class="prp-text">Un pays est dit <b>riche</b> quand ses habitants produisent et gagnent, <b>en moyenne</b>, beaucoup d'argent. Mais l'argent ne dit pas tout !</p>
            <p class="prp-text">Pour savoir si les habitants <b>vivent bien</b>, on regarde aussi :</p>
            <ul><li>❤️ la <b>santé</b> : combien d'années on vit, s'il y a des médecins ;</li>
            <li>📚 l'<b>éducation</b> : aller à l'école, savoir lire et écrire ;</li>
            <li>💧⚡ l'accès à l'<b>eau potable</b> et à l'<b>électricité</b>.</li></ul>
            <p class="prp-change">L'ONU mélange ces informations dans un seul nombre : l'<b>IDH</b> (indice de développement humain).</p>`,
        know: 'On parle aussi de <b>pays développés</b> et de <b>pays en développement</b>. Entre les deux, les <b>pays émergents</b> (Chine, Inde, Brésil…) s\'enrichissent vite.'
    },
    pourquoi: {
        ico: '❓', name: 'Pourquoi ces différences ?',
        html: `<p class="prp-text">Il n'y a pas une seule raison, mais plusieurs, qui se mélangent :</p>
            <ul><li>📜 l'<b>histoire</b> : pendant la colonisation, des pays d'Europe ont dominé l'Afrique et une partie de l'Asie et ont profité de leurs richesses ;</li>
            <li>⚔️ les <b>guerres</b> qui détruisent les écoles, les routes, les hôpitaux ;</li>
            <li>🌵 un <b>climat difficile</b> : sécheresses, inondations, cyclones ;</li>
            <li>🪙 des pays qui vendent surtout des <b>matières premières</b> (cacao, café, minerais) à bas prix ;</li>
            <li>🏫 le manque d'<b>écoles</b>, de <b>médecins</b> et de routes ;</li>
            <li>🏛️ des dirigeants qui gardent l'argent pour eux (la <b>corruption</b>).</li></ul>`,
        know: 'Un pays peut changer : la <b>Corée du Sud</b> était aussi pauvre que beaucoup de pays d\'Afrique en 1960. C\'est aujourd\'hui un pays riche.'
    },
    agir: {
        ico: '🤝', name: 'Comment réduire les inégalités ?',
        html: `<p class="prp-text">Les pays, les associations et chacun d'entre nous peuvent agir :</p>
            <ul><li>💶 l'<b>aide au développement</b> : les pays riches donnent de l'argent, des vaccins, du matériel ;</li>
            <li>🏥 les <b>associations</b> (ONG) comme l'Unicef, la Croix-Rouge ou Médecins sans frontières ;</li>
            <li>☕ le <b>commerce équitable</b> : payer un prix juste aux paysans des pays pauvres ;</li>
            <li>🏫 l'<b>école pour tous</b>, et surtout pour les filles ;</li>
            <li>🚰 creuser des puits, installer des panneaux solaires.</li></ul>
            <p class="prp-change">L'ONU s'est fixé des <b>Objectifs de développement durable</b> pour 2030 : plus de pauvreté extrême, plus de faim, l'école et l'eau potable pour tous.</p>`,
        know: 'Il y a de vrais progrès : depuis 1990, la mortalité des jeunes enfants dans le monde a été divisée par plus de deux.'
    }
};

const PRP_OVERVIEW = {
    text: 'Les habitants de la Terre ne vivent pas tous dans les mêmes conditions. Les <b>pays riches</b> sont surtout dans l\'hémisphère Nord (Amérique du Nord, Europe, Japon) et en Australie. Les <b>pays les plus pauvres</b> sont surtout en <b>Afrique subsaharienne</b> et dans une partie de l\'Asie.',
    know: 'On parle souvent des « <b>pays du Nord</b> » (riches) et des « <b>pays du Sud</b> » (moins riches). Active la <b>limite Nord-Sud</b> pour la voir sur la carte.'
};

// ── Outils géométriques ───────────────────────────────────────────────────
function _prpInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi)) inside = !inside;
    }
    return inside;
}
function _prpFmt(n) {
    if (n < 10 && n % 1) return String(n).replace('.', ',');
    return Math.round(n).toLocaleString('fr-FR');
}

// ── Création du widget ────────────────────────────────────────────────────
function createPaysRichesPauvresWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'pays-riches-pauvres';
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
    container.className = 'prp-container';
    container.dataset.mode = 'carte';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.62));

    const header = document.createElement('div');
    header.className = 'prp-header';
    header.innerHTML = `
        <span class="prp-title">🌍<span> Pays riches, pays pauvres</span></span>
        <div class="prp-tabs">
            <button class="prp-tab on" data-mode="carte" title="La carte du monde"><span class="prp-tab-long">🗺️ La carte</span><span class="prp-tab-short">🗺️ Carte</span></button>
            <button class="prp-tab" data-mode="comparer" title="Comparer deux pays"><span class="prp-tab-long">⚖️ Comparer deux pays</span><span class="prp-tab-short">⚖️ Comparer</span></button>
            <button class="prp-tab" data-mode="village" title="Le monde en 100 habitants"><span class="prp-tab-long">👥 Le village de 100</span><span class="prp-tab-short">👥 Village</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'prp-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    const cOpts = PRP_C_ORDER.map(k => `<option value="${k}">${PRP_COUNTRIES[k].name}</option>`).join('');

    // Ligne 1
    const row1 = document.createElement('div');
    row1.className = 'prp-row';
    row1.innerHTML = `
        <button class="prp-btn prp-btn-guide" title="Présente les étapes l'une après l'autre">🎓 Visite guidée</button>
        <span class="prp-sep"></span>
        <button class="prp-btn prp-prev prp-only-carte" title="Région précédente">◀ Région</button>
        <button class="prp-btn prp-next prp-only-carte" title="Région suivante">Région ▶</button>
        <button class="prp-btn prp-all prp-only-carte" title="Vue d'ensemble">🌍 Tout le monde</button>
        <span class="prp-sep prp-only-carte"></span>
        <button class="prp-btn prp-labels prp-only-carte on" title="Afficher les noms des régions">🏷️ Étiquettes</button>
        <button class="prp-btn prp-line prp-only-carte" title="Afficher la limite Nord-Sud">➖ Limite Nord-Sud</button>
        <button class="prp-btn prp-dots prp-only-carte" title="Afficher quelques pays repères">📍 Pays repères</button>
        <span class="prp-lbl prp-only-comparer">Pays 1 :</span>
        <select class="prp-select prp-a prp-only-comparer" aria-label="Pays 1">${cOpts}</select>
        <button class="prp-btn prp-swap prp-only-comparer" title="Échanger les deux pays">⇄</button>
        <span class="prp-lbl prp-only-comparer">Pays 2 :</span>
        <select class="prp-select prp-b prp-only-comparer" aria-label="Pays 2">${cOpts}</select>
        <button class="prp-btn prp-rand prp-only-comparer" title="Deux pays au hasard">🎲 Au hasard</button>
        <button class="prp-btn prp-replay prp-only-village" title="Rejouer l'animation">🔁 Rejouer</button>
    `;
    container.appendChild(row1);

    // Ligne 2
    const row2 = document.createElement('div');
    row2.className = 'prp-row';
    row2.innerHTML = `
        <span class="prp-lbl prp-only-carte">Colorier selon :</span>
        ${PRP_IND.map((d, i) => `<button class="prp-btn prp-ind-btn prp-only-carte" data-ind="${i}" title="${d.title}">${d.ico} ${d.name}</button>`).join('')}
        <span class="prp-lbl prp-only-comparer">Exemples :</span>
        ${PRP_PRESETS.map((p, i) => `<button class="prp-btn prp-preset prp-only-comparer" data-preset="${i}">${PRP_COUNTRIES[p[0]].name} / ${PRP_COUNTRIES[p[1]].name}</button>`).join('')}
        <span class="prp-lbl prp-only-village">Questions :</span>
        ${PRP_VQ.map((q, i) => `<button class="prp-btn prp-vq prp-only-village" data-vq="${i}" title="${q.title}">${q.ico} ${q.name}</button>`).join('')}
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'prp-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'prp-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'prp-canvas';
    const hint = document.createElement('div');
    hint.className = 'prp-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'prp-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'prp-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Pays riches, pays pauvres</h4>
        <p><b>🗺️ La carte</b> : chaque grande région du monde est coloriée selon l'indicateur choisi
        (<b>💰 richesse, ❤️ espérance de vie, 💧 eau potable, 📚 lecture, ⚡ électricité</b>) :
        du <span style="color:#d94a3a;font-weight:800">rouge</span> (le plus faible) au
        <span style="color:#3a9f5b;font-weight:800">vert</span> (le plus élevé). <b>Touche une région</b> ou son étiquette
        pour l'expliquer. <b>◀ Région ▶</b> passe d'une région à l'autre, <b>🎓 Visite guidée</b> les enchaîne toute seule,
        des plus riches aux plus pauvres. <b>➖ Limite Nord-Sud</b> trace la séparation « pays du Nord / pays du Sud » ;
        <b>📍 Pays repères</b> place quelques pays que l'on peut toucher.</p>
        <p><b>⚖️ Comparer deux pays</b> : choisis deux pays (ou un exemple) et compare leurs barres.</p>
        <p><b>👥 Le village de 100</b> : imagine que le monde soit un village de 100 habitants ; chaque question colorie
        les habitants concernés.</p>
        <p>La fiche de droite propose aussi trois mini-leçons : <b>qu'est-ce qu'un pays riche ?</b>,
        <b>pourquoi ces différences ?</b>, <b>comment agir ?</b></p>
        <p style="color:#888">Carte simplifiée : chaque région regroupe des pays différents, et chaque chiffre est une moyenne
        arrondie (années 2020 : Banque mondiale, ONU, OMS, Unicef).</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'prp-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const guideBtn = $('.prp-btn-guide');
    const labelsBtn = $('.prp-labels'), lineBtn = $('.prp-line'), dotsBtn = $('.prp-dots');
    const selA = $('.prp-a'), selB = $('.prp-b');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'carte';
    let sel = '';                   // '' vue d'ensemble · 'z:3' région · 'l:pourquoi' leçon · 'c:FR' pays
    let ind = 0;                    // indicateur de la carte
    let showLabels = true, showLine = false, showDots = false;
    let cA = 'FR', cB = 'NE';
    let vq = 0;
    let guided = false, guideT = 0, guideIdx = 0;
    let barT0 = 0, revT0 = 0;
    let animId = null, lastT = 0, drawPending = false;
    let cssW = 0, cssH = 0, dpr = 1;
    let mapGeo = null, labelHits = [], dotHits = [];

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
    const FONT = "'Segoe UI', system-ui, sans-serif";
    const zoneIdx = id => PRP_ZONES.findIndex(z => z.id === id);

    // ── Scène « La carte » ────────────────────────────────────────────────
    function drawMap() {
        const pad = 10;
        const narrow = cssW < 560;
        const legendH = narrow ? 58 : 36;
        const availW = cssW - 2 * pad, availH = cssH - pad - legendH - 20;
        const s = Math.max(0.5, Math.min(availW / 360, availH / 140));
        const mw = 360 * s, mh = 140 * s;
        const ox = (cssW - mw) / 2, oy = pad + Math.max(0, (availH - mh) / 2);
        mapGeo = { s, ox, oy, mw, mh };
        const P = (lon, lat) => [ox + (lon + 180) * s, oy + (84 - lat) * s];

        // Fond
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#eef4fa'); bg.addColorStop(1, '#dde8f2');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const sea = ctx.createLinearGradient(0, oy, 0, oy + mh);
        sea.addColorStop(0, '#b5daf2'); sea.addColorStop(1, '#8dc3e8');
        ctx.fillStyle = sea;
        roundRect(ox, oy, mw, mh, 8); ctx.fill();

        // Équateur et tropiques
        ctx.save();
        roundRect(ox, oy, mw, mh, 8); ctx.clip();
        ctx.lineWidth = 1;
        for (const [lat, strong] of [[0, true], [23.44, false], [-23.44, false]]) {
            const y = P(0, lat)[1];
            ctx.strokeStyle = strong ? 'rgba(30,70,120,0.45)' : 'rgba(30,70,120,0.22)';
            ctx.setLineDash(strong ? [8, 5] : [3, 5]);
            ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + mw, y); ctx.stroke();
        }
        ctx.setLineDash([]);
        const fsS = Math.max(9, Math.min(12, mw / 95));
        ctx.font = `italic 600 ${fsS}px ${FONT}`;
        ctx.fillStyle = 'rgba(30,70,120,0.7)';
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText('Équateur', ox + 6, P(0, 0)[1] - 2);

        // Régions
        const selZone = sel.startsWith('z:') ? Number(sel.slice(2)) : -1;
        const path = poly => { ctx.beginPath(); poly.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); };
        PRP_ZONES.forEach((z, i) => {
            ctx.globalAlpha = selZone >= 0 && selZone !== i ? 0.45 : 1;
            ctx.fillStyle = PRP_LV_COL[z.lv[ind] - 1];
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1; ctx.lineJoin = 'round';
            for (const poly of z.polys) { path(poly); ctx.fill(); ctx.stroke(); }
        });
        ctx.globalAlpha = 1;
        // Mer Caspienne
        path(PRP_CASPIAN); ctx.fillStyle = '#a6d1ee'; ctx.fill();
        // Région choisie : contour marqué
        if (selZone >= 0) {
            for (const poly of PRP_ZONES[selZone].polys) {
                path(poly);
                ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6; ctx.stroke();
                ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2.5; ctx.stroke();
            }
        }

        // Limite Nord-Sud
        if (showLine) {
            ctx.beginPath();
            PRP_NS_LINE.forEach((p, i) => { const q = P(p[0], p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
            ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.setLineDash([]); ctx.stroke();
            ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.stroke();
            ctx.setLineDash([]);
            const fl = Math.max(10, Math.min(15, mw / 70));
            ctx.font = `900 ${fl}px ${FONT}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
            const n = P(-40, 47), sdl = P(-40, 22);
            ctx.strokeText('▲ PAYS DU NORD', n[0], n[1]); ctx.fillStyle = '#5b21b6'; ctx.fillText('▲ PAYS DU NORD', n[0], n[1]);
            ctx.strokeText('▼ PAYS DU SUD', sdl[0], sdl[1]); ctx.fillText('▼ PAYS DU SUD', sdl[0], sdl[1]);
        }
        ctx.restore();

        // Étiquettes des régions
        labelHits = [];
        if (showLabels) {
            const fs = Math.max(9, Math.min(14, mw / 85));
            PRP_ZONES.forEach((z, i) => {
                const on = selZone === i;
                const txt = mw < 520 ? z.name.split(/,| et /)[0] : z.name;
                ctx.font = `800 ${on ? fs * 1.1 : fs}px ${FONT}`;
                const w = ctx.measureText(txt).width + 12, h = fs * (on ? 1.9 : 1.75);
                const q = P(z.lab[0], z.lab[1]);
                const lx = Math.max(w / 2 + 3, Math.min(cssW - w / 2 - 3, q[0]));
                const ly = Math.max(h / 2 + 3, Math.min(oy + mh - h / 2, q[1]));
                ctx.globalAlpha = selZone >= 0 && !on ? 0.65 : 1;
                ctx.fillStyle = on ? '#1f2937' : 'rgba(255,255,255,0.93)';
                roundRect(lx - w / 2, ly - h / 2, w, h, 7); ctx.fill();
                ctx.strokeStyle = PRP_LV_COL[z.lv[ind] - 1]; ctx.lineWidth = 2.5; ctx.stroke();
                ctx.fillStyle = on ? '#fff' : '#1f2937';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(txt, lx, ly + 1);
                ctx.globalAlpha = 1;
                labelHits.push({ i, x: lx - w / 2 - 6, y: ly - h / 2 - 6, w: w + 12, h: h + 12 });
            });
        }

        // Pays repères
        dotHits = [];
        if (showDots) {
            const fd = Math.max(9, Math.min(13, mw / 95));
            ctx.font = `800 ${fd}px ${FONT}`;
            for (const k of PRP_C_ORDER) {
                const c = PRP_COUNTRIES[k], q = P(c.ll[0], c.ll[1]);
                const on = sel === 'c:' + k;
                const r = on ? 7 : 5;
                ctx.beginPath(); ctx.arc(q[0], q[1], r + 2, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill();
                ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, 2 * Math.PI); ctx.fillStyle = on ? '#e8833a' : '#1f2937'; ctx.fill();
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)';
                ctx.strokeText(c.name, q[0] + r + 4, q[1]);
                ctx.fillStyle = on ? '#b45309' : '#111827';
                ctx.fillText(c.name, q[0] + r + 4, q[1]);
                const tw = ctx.measureText(c.name).width;
                dotHits.push({ k, x: q[0] - 14, y: q[1] - 14, w: tw + r + 22, h: 28 });
            }
        }

        // Légende
        const D = PRP_IND[ind];
        const fl = Math.max(10, Math.min(13, cssW / 70));
        ctx.font = `800 ${fl}px ${FONT}`;
        ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        const title = `${D.ico} ${D.title} :`;
        const items = D.legend.map((t, i) => ({ t, c: PRP_LV_COL[i], w: ctx.measureText(t).width + fl * 1.6 + 14 }));
        const titleW = ctx.measureText(title).width + 12;
        const totalW = titleW + items.reduce((a, b) => a + b.w, 0);
        let y = oy + mh + 6 + fl;
        const drawItem = (it, x, yy) => {
            roundRect(x, yy - fl * 0.6, fl * 1.2, fl * 1.2, 3); ctx.fillStyle = it.c; ctx.fill();
            ctx.fillStyle = '#374151'; ctx.font = `700 ${fl}px ${FONT}`;
            ctx.fillText(it.t, x + fl * 1.6, yy);
        };
        if (totalW <= cssW - 20) {
            let x = (cssW - totalW) / 2;
            ctx.fillStyle = '#1d4f86'; ctx.font = `800 ${fl}px ${FONT}`; ctx.fillText(title, x, y);
            x += titleW;
            for (const it of items) { drawItem(it, x, y); x += it.w; }
        } else {
            ctx.fillStyle = '#1d4f86'; ctx.font = `800 ${fl}px ${FONT}`;
            ctx.textAlign = 'center'; ctx.fillText(title, cssW / 2, y); ctx.textAlign = 'left';
            const rowW = Math.max(items[0].w + items[1].w, items[2].w + items[3].w);
            const x0 = Math.max(6, (cssW - rowW) / 2);
            y += fl * 1.5;
            drawItem(items[0], x0, y); drawItem(items[1], x0 + items[0].w, y);
            y += fl * 1.4;
            drawItem(items[2], x0, y); drawItem(items[3], x0 + items[2].w, y);
        }
    }

    // ── Scène « Comparer deux pays » ──────────────────────────────────────
    function drawCompare(now) {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f6f8fb'); bg.addColorStop(1, '#e8eef5');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const A = PRP_COUNTRIES[cA], B = PRP_COUNTRIES[cB];
        const k0 = Math.min(1, (now - barT0) / 800);
        const k = 1 - Math.pow(1 - k0, 3);
        const pad = 14;
        const headH = Math.max(36, Math.min(54, cssH * 0.09));
        const fh = Math.max(12, Math.min(22, headH * 0.42, cssW / 32));
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${fh}px ${FONT}`;
        const wA = ctx.measureText(A.name).width, wB = ctx.measureText(B.name).width;
        ctx.font = `700 ${fh * 0.75}px ${FONT}`;
        const wVs = ctx.measureText('  et  ').width;
        const tot = wA + wB + wVs + fh * 2.4;
        let x = (cssW - tot) / 2;
        const hy = headH / 2 + 4;
        const chip = (name, col, w) => {
            ctx.fillStyle = col; roundRect(x, hy - fh * 0.85, w + fh * 1.2, fh * 1.7, fh * 0.5); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = `900 ${fh}px ${FONT}`; ctx.textAlign = 'left';
            ctx.fillText(name, x + fh * 0.6, hy + 1);
            x += w + fh * 1.2;
        };
        chip(A.name, '#3b8fd9', wA);
        ctx.fillStyle = '#6b7280'; ctx.font = `700 ${fh * 0.75}px ${FONT}`; ctx.textAlign = 'left';
        ctx.fillText('  et  ', x, hy + 1); x += wVs;
        chip(B.name, '#e8833a', wB);

        const top = headH + 8, bottom = cssH - 22;
        const n = PRP_CMP_IND.length;
        const rh = (bottom - top) / n;
        const fs = Math.max(10, Math.min(15, rh * 0.24, cssW / 48));
        const barH = Math.max(6, Math.min(20, rh * 0.24));
        ctx.font = `800 ${fs}px ${FONT}`;
        const valW = Math.max(70, ctx.measureText('80 000 €').width + 16);
        const maxW = Math.max(40, cssW - pad * 2 - valW);
        PRP_CMP_IND.forEach((d, i) => {
            const y0 = top + i * rh;
            if (i) { ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(cssW - pad, y0); ctx.stroke(); }
            ctx.textAlign = 'left';
            ctx.font = `800 ${fs}px ${FONT}`; ctx.fillStyle = '#1f2937';
            const lab = `${d.ico} ${d.name}`;
            ctx.fillText(lab, pad, y0 + fs * 0.95);
            const lw = ctx.measureText(lab).width;
            ctx.font = `600 ${fs * 0.82}px ${FONT}`; ctx.fillStyle = d.low ? '#b45309' : '#6b7280';
            ctx.fillText(' — ' + d.unit, pad + lw, y0 + fs * 0.95);
            const yA = y0 + fs * 1.75, yB = yA + barH + 4;
            [[A, yA, '#3b8fd9'], [B, yB, '#e8833a']].forEach(([C, yy, col]) => {
                const v = C[d.k];
                ctx.fillStyle = 'rgba(0,0,0,0.06)'; roundRect(pad, yy, maxW, barH, barH / 2); ctx.fill();
                const len = Math.max(v > 0 ? 3 : 0, maxW * Math.min(1, v / d.max) * k);
                ctx.fillStyle = col; roundRect(pad, yy, len, barH, barH / 2); ctx.fill();
                ctx.font = `800 ${fs}px ${FONT}`; ctx.fillStyle = col === '#3b8fd9' ? '#1f5f9c' : '#a2521a';
                ctx.textAlign = 'left';
                const unit = d.k === 'rev' ? ' €' : d.k === 'ev' ? ' ans' : (d.k === 'morta' || d.k === 'med') ? '' : ' %';
                const tx = Math.min(pad + len + 6, pad + maxW + 6);
                ctx.fillText(_prpFmt(v) + unit, tx, yy + barH / 2 + 1);
            });
        });
    }

    // ── Scène « Le village de 100 » ───────────────────────────────────────
    function drawPerson(x, y, s, col) {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.15, 0, 2 * Math.PI); ctx.fill();
        roundRect(x - s * 0.24, y - s * 0.01, s * 0.48, s * 0.36, s * 0.16); ctx.fill();
    }
    function drawVillage(now) {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f6f8fb'); bg.addColorStop(1, '#e8eef5');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const Q = PRP_VQ[vq];
        const sum = Q.cats.reduce((a, c) => a + c.n, 0);
        const k = Math.min(1, (now - revT0) / 1600);
        const shown = Math.floor(sum * k + 1e-6);
        const pad = 12;

        // Titre + légende
        const ft = Math.max(12, Math.min(20, cssW / 40, cssH / 22));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${ft}px ${FONT}`; ctx.fillStyle = '#1d4f86';
        ctx.fillText(`${Q.ico} ${Q.title}`, cssW / 2, pad + ft * 0.7);
        const fl = Math.max(10, Math.min(15, ft * 0.78));
        ctx.font = `800 ${fl}px ${FONT}`;
        const items = Q.cats.map(c => ({ c: c.c, t: `${c.n} ${c.l}` }));
        if (Q.rest) items.push({ c: PRP_GREY, t: `${100 - sum} ${Q.rest}` });
        const iw = items.map(it => ctx.measureText(it.t).width + fl * 1.6 + 16);
        let rows = [[]], rw = [0];
        const maxRow = cssW - 2 * pad;
        items.forEach((it, i) => {
            if (rw[rw.length - 1] + iw[i] > maxRow && rows[rows.length - 1].length) { rows.push([]); rw.push(0); }
            rows[rows.length - 1].push(i); rw[rw.length - 1] += iw[i];
        });
        let ly = pad + ft * 1.6 + fl * 0.8;
        rows.forEach((r, ri) => {
            let x = (cssW - rw[ri]) / 2;
            r.forEach(i => {
                roundRect(x, ly - fl * 0.6, fl * 1.2, fl * 1.2, 3); ctx.fillStyle = items[i].c; ctx.fill();
                ctx.fillStyle = '#374151'; ctx.textAlign = 'left';
                ctx.fillText(items[i].t, x + fl * 1.6, ly + 1);
                x += iw[i];
            });
            ly += fl * 1.5;
        });
        const topH = ly + 2;
        const fb = Math.max(10, Math.min(13, cssH / 40));
        const bh = Math.max(16, fb * 1.6);
        const botH = Q.share ? 24 + fb * 4.4 + bh : 22;

        // Grille de 100 habitants
        const gw = cssW - 2 * pad, gh = cssH - topH - botH - 4;
        const cs = Math.max(8, Math.min(gw / 10, gh / 10));
        const gx = (cssW - cs * 10) / 2, gy = topH + Math.max(0, (gh - cs * 10) / 2);
        const colors = [];
        Q.cats.forEach(c => { for (let j = 0; j < c.n; j++) colors.push(c.c); });
        while (colors.length < 100) colors.push(PRP_GREY);
        for (let i = 0; i < 100; i++) {
            const cx = gx + (i % 10 + 0.5) * cs, cy = gy + (Math.floor(i / 10) + 0.5) * cs;
            const lit = i < sum && i < shown;
            const pop = lit && i === shown - 1 && k < 1 ? 1.15 : 1;
            drawPerson(cx, cy, cs * pop, lit ? colors[i] : PRP_GREY);
        }

        // Partage des richesses
        if (Q.share) {
            const bw = Math.min(cssW - 2 * pad, Math.max(cs * 10 + 40, 320)), bx = (cssW - bw) / 2;
            const y = cssH - 24 - fb * 1.6 - bh;
            ctx.font = `800 ${fb}px ${FONT}`; ctx.fillStyle = '#1d4f86'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('💰 Les richesses du monde, partagées en 100 parts :', bx, y - fb * 0.9);
            let x = bx;
            const kk = Math.max(0, Math.min(1, (now - revT0 - 1200) / 900));
            Q.share.forEach((p, i) => {
                const w = bw * p / 100 * kk;
                ctx.fillStyle = Q.cats[i].c;
                ctx.fillRect(x, y, w, bh);
                x += w;
            });
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(bx, y, bw, bh);
            if (kk >= 1) {
                ctx.font = `900 ${fb}px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText('76 parts pour les 10 plus riches', bx + bw * 0.38, y + bh / 2 + 1);
                ctx.fillStyle = '#1f2937';
                ctx.fillText('22', bx + bw * 0.87, y + bh / 2 + 1);
                ctx.textAlign = 'right'; ctx.fillStyle = '#7a4a24'; ctx.font = `800 ${fb}px ${FONT}`;
                ctx.fillText('2 parts pour les 50 plus pauvres ➜', bx + bw - 4, y + bh + fb * 0.9);
            }
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        const now = performance.now();
        if (mode === 'carte') drawMap();
        else if (mode === 'comparer') drawCompare(now);
        else drawVillage(now);
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function lessonChips() {
        return `<div class="prp-subtitle">Mini-leçons</div><div class="prp-chips">${Object.keys(PRP_LESSONS).map(k =>
            `<button data-sel="l:${k}" class="${sel === 'l:' + k ? 'on' : ''}" style="--st-c:#6b7fd0">${PRP_LESSONS[k].ico} ${PRP_LESSONS[k].name}</button>`).join('')}</div>`;
    }
    function zoneChips() {
        return `<div class="prp-subtitle">Les régions</div><div class="prp-chips">${PRP_ZONES.map((z, i) =>
            `<button data-sel="z:${i}" class="${sel === 'z:' + i ? 'on' : ''}" style="--st-c:${PRP_LV_COL[z.lv[ind] - 1]}">${z.name}</button>`).join('')}
            <button data-sel="" class="${sel === '' ? 'on' : ''}" style="--st-c:#1d4f86">🌍 Vue d'ensemble</button></div>`;
    }
    function countryRows(C) {
        return PRP_CMP_IND.map(d => `<tr><td>${d.ico} ${d.name}</td><td><b>${_prpFmt(C[d.k])}</b> <span class="prp-small">${d.unit.replace(' (moins = mieux)', '')}</span></td></tr>`).join('');
    }
    function updateInfo() {
        row2.querySelectorAll('.prp-ind-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.ind) === ind));
        row2.querySelectorAll('.prp-vq').forEach(b => b.classList.toggle('on', Number(b.dataset.vq) === vq));
        row2.querySelectorAll('.prp-preset').forEach(b => {
            const p = PRP_PRESETS[Number(b.dataset.preset)];
            b.classList.toggle('on', p[0] === cA && p[1] === cB);
        });
        if (selA.value !== cA) selA.value = cA;
        if (selB.value !== cB) selB.value = cB;

        const key = [mode, sel, ind, cA, cB, vq].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const D = PRP_IND[ind];

        if (mode === 'carte') {
            if (sel.startsWith('z:')) {
                const i = Number(sel.slice(2)), z = PRP_ZONES[i];
                const col = PRP_LV_COL[z.lv[ind] - 1];
                side.style.borderLeftColor = col;
                side.innerHTML = `<h4>${z.name}</h4>
                    <div class="prp-status">${D.ico} <span style="color:${col === PRP_LV_COL[2] ? '#6b8f1f' : col}">${D.name} : ${D.legend[z.lv[ind] - 1]}</span></div>
                    <p class="prp-change">📍 Exemples : ${z.ex}</p>
                    <p class="prp-text">${z.text}</p>
                    <table class="prp-ind-table">${PRP_IND.map((d, j) =>
                        `<tr><td>${d.ico} ${d.name}</td><td><span class="prp-dot" style="background:${PRP_LV_COL[z.lv[j] - 1]}"></span>${d.legend[z.lv[j] - 1]}</td></tr>`).join('')}</table>
                    <p class="prp-know">💡 <b>Le savais-tu ?</b> ${z.know}</p>
                    ${zoneChips()}${lessonChips()}`;
            } else if (sel.startsWith('l:') && PRP_LESSONS[sel.slice(2)]) {
                const L = PRP_LESSONS[sel.slice(2)];
                side.style.borderLeftColor = '#6b7fd0';
                side.innerHTML = `<h4>${L.ico} ${L.name}</h4>${L.html}
                    <p class="prp-know">💡 <b>Le savais-tu ?</b> ${L.know}</p>
                    ${lessonChips()}${zoneChips()}`;
            } else if (sel.startsWith('c:') && PRP_COUNTRIES[sel.slice(2)]) {
                const ck = sel.slice(2), C = PRP_COUNTRIES[ck];
                const zi = zoneIdx(C.zone);
                side.style.borderLeftColor = '#e8833a';
                side.innerHTML = `<h4>📍 ${C.name}</h4>
                    <p class="prp-text">${C.note}</p>
                    <table class="prp-ind-table">${countryRows(C)}</table>
                    <div class="prp-chips">
                        ${ck !== 'FR' ? `<button data-cmp="${ck}" style="--st-c:#3b8fd9">⚖️ Comparer avec la France</button>` : ''}
                        ${zi >= 0 ? `<button data-sel="z:${zi}" style="--st-c:${PRP_LV_COL[PRP_ZONES[zi].lv[ind] - 1]}">Région : ${PRP_ZONES[zi].name}</button>` : ''}
                    </div>
                    <p class="prp-small">Chiffres arrondis, années 2020.</p>
                    ${lessonChips()}`;
            } else {
                side.style.borderLeftColor = '#3b8fd9';
                side.innerHTML = `<h4>Pays riches, pays pauvres</h4>
                    <div class="prp-status">🌍 <span style="color:#1d4f86">Un monde inégal</span></div>
                    <p class="prp-text">${PRP_OVERVIEW.text}</p>
                    <p class="prp-change">${D.ico} ${D.desc}</p>
                    <p class="prp-know">💡 <b>Le savais-tu ?</b> ${PRP_OVERVIEW.know}</p>
                    ${lessonChips()}${zoneChips()}`;
            }
        } else if (mode === 'comparer') {
            const A = PRP_COUNTRIES[cA], B = PRP_COUNTRIES[cB];
            side.style.borderLeftColor = '#e8833a';
            let compare = '';
            if (cA !== cB) {
                const rich = A.rev >= B.rev ? A : B, poor = rich === A ? B : A;
                const ratio = Math.round(rich.rev / poor.rev);
                const dayR = rich.rev / 365, dayP = poor.rev / 365;
                const fmtDay = v => v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v);
                const old = A.ev >= B.ev ? A : B, young = old === A ? B : A;
                const dEv = old.ev - young.ev;
                compare = `<p class="prp-change">💰 ${rich.en.charAt(0).toUpperCase() + rich.en.slice(1)}, une personne gagne en moyenne
                    <b>${ratio > 1 ? ratio + ' fois plus' : 'à peu près autant'}</b> qu'${poor.en}.<br>
                    <span style="font-weight:600">Soit environ ${fmtDay(dayR)} € par jour, contre ${fmtDay(dayP)} € par jour.</span></p>
                    ${dEv >= 2 ? `<p class="prp-text">❤️ On vit en moyenne <b>${dEv} ans de plus</b> ${old.en} qu'${young.en}.</p>` : `<p class="prp-text">❤️ L'espérance de vie est presque la même dans ces deux pays.</p>`}`;
            } else {
                compare = '<p class="prp-change">Choisis deux pays différents pour les comparer.</p>';
            }
            side.innerHTML = `<h4>⚖️ Comparer deux pays</h4>
                <table class="prp-cmp"><tr><th></th><th class="ca">${A.name}</th><th class="cb">${B.name}</th></tr>
                ${PRP_CMP_IND.map(d => `<tr><td>${d.ico}</td><td class="ca">${_prpFmt(A[d.k])}</td><td class="cb">${_prpFmt(B[d.k])}</td></tr>`).join('')}</table>
                ${compare}
                <p class="prp-text"><b style="color:#1f5f9c">${A.name}</b> : ${A.note}</p>
                ${cA !== cB ? `<p class="prp-text"><b style="color:#a2521a">${B.name}</b> : ${B.note}</p>` : ''}
                <p class="prp-know">💡 <b>Le savais-tu ?</b> Ce sont des <b>moyennes</b> : dans un pays riche il y a aussi des personnes pauvres, et dans un pays pauvre quelques personnes très riches.</p>
                <p class="prp-small">Chiffres arrondis, années 2020 (Banque mondiale, ONU, OMS, Unicef).</p>`;
        } else {
            const Q = PRP_VQ[vq];
            side.style.borderLeftColor = Q.cats[0].c;
            side.innerHTML = `<h4>👥 Si le monde était un village de 100 habitants…</h4>
                <div class="prp-status">${Q.ico} <span style="color:#1d4f86">${Q.title}</span></div>
                <p class="prp-text">${Q.text}</p>
                <p class="prp-know">💡 <b>Le savais-tu ?</b> ${Q.know}</p>
                <p class="prp-small">La Terre compte environ 8 milliards d'habitants : chaque petit personnage représente donc environ 80 millions de personnes (plus que toute la population de la France !).</p>`;
        }
    }

    // ── Boucle d'animation ────────────────────────────────────────────────
    function animating(now) {
        if (mode === 'comparer') return now - barT0 < 850;
        if (mode === 'village') return now - revT0 < (PRP_VQ[vq].share ? 2200 : 1700);
        return false;
    }
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    function loop(t) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const rdt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (guided) {
            guideT += rdt;
            if (guideT >= (mode === 'carte' ? 7 : 8)) { guideT = 0; guideStep(); }
        }
        draw();
        if (guided || animating(performance.now())) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    // Ordre de la visite : des régions les plus riches aux plus pauvres
    const GUIDE_ZONES = ['an', 'eu', 'jk', 'au', 'golfe', 'ru', 'cn', 'la', 'namo', 'sa', 'sea', 'ssa'].map(zoneIdx);
    function guideStep() {
        guideIdx++;
        if (mode === 'carte') setSel('z:' + GUIDE_ZONES[guideIdx % GUIDE_ZONES.length]);
        else if (mode === 'comparer') { const p = PRP_PRESETS[guideIdx % PRP_PRESETS.length]; setPair(p[0], p[1]); }
        else setVq(guideIdx % PRP_VQ.length);
    }
    function setGuided(v) {
        guided = !!v;
        guideBtn.classList.toggle('on', guided);
        guideBtn.textContent = guided ? '⏹ Arrêter la visite' : '🎓 Visite guidée';
        if (guided) {
            guideT = 0; guideIdx = 0;
            if (mode === 'carte') setSel('z:' + GUIDE_ZONES[0]);
            else if (mode === 'comparer') setPair(PRP_PRESETS[0][0], PRP_PRESETS[0][1]);
            else setVq(0);
            startLoop();
        }
    }
    function setSel(s) { sel = s; lastInfoKey = ''; requestDraw(); }
    function setPair(a, b) {
        cA = a; cB = b; lastInfoKey = '';
        barT0 = performance.now(); startLoop();
    }
    function setVq(i) {
        vq = Math.max(0, Math.min(PRP_VQ.length - 1, i)); lastInfoKey = '';
        revT0 = performance.now(); startLoop();
    }
    function setMode(m) {
        mode = ['carte', 'comparer', 'village'].indexOf(m) >= 0 ? m : 'carte';
        container.dataset.mode = mode;
        header.querySelectorAll('.prp-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (guided) setGuided(false);
        hint.textContent = mode === 'carte'
            ? 'Touche une région ou son étiquette pour l\'expliquer · Carte simplifiée'
            : mode === 'comparer'
            ? 'Choisis deux pays · Chiffres arrondis (moyennes, années 2020)'
            : 'Si le monde était un village de 100 habitants… · Touche une question';
        lastInfoKey = '';
        if (mode === 'comparer') barT0 = performance.now();
        if (mode === 'village') revT0 = performance.now();
        if (mode === 'carte') requestDraw(); else startLoop();
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
    const inBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

    function onTap(x, y) {
        if (guided) setGuided(false);
        if (mode === 'village') { setVq((vq + 1) % PRP_VQ.length); saveBoard(); return; }
        if (mode === 'comparer') { barT0 = performance.now(); startLoop(); return; }
        for (const h of dotHits) {
            if (inBox(x, y, h)) { setSel(sel === 'c:' + h.k ? '' : 'c:' + h.k); saveBoard(); return; }
        }
        for (const h of labelHits) {
            if (inBox(x, y, h)) { setSel(sel === 'z:' + h.i ? '' : 'z:' + h.i); saveBoard(); return; }
        }
        let hit = -1;
        if (mapGeo) {
            const lon = (x - mapGeo.ox) / mapGeo.s - 180, lat = 84 - (y - mapGeo.oy) / mapGeo.s;
            for (let i = 0; i < PRP_ZONES.length && hit < 0; i++) {
                if (PRP_ZONES[i].polys.some(p => _prpInPoly(lon, lat, p))) hit = i;
            }
        }
        const s = hit >= 0 ? 'z:' + hit : '';
        setSel(s === sel ? '' : s);
        saveBoard();
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
        const b = e.target.closest('button[data-sel], button[data-cmp]');
        if (!b) return;
        e.stopPropagation();
        if (guided) setGuided(false);
        if (b.dataset.cmp) { setMode('comparer'); setPair('FR', b.dataset.cmp); }
        else setSel(b.dataset.sel);
        saveBoard();
    });

    header.querySelectorAll('.prp-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        saveBoard();
    }));
    guideBtn.addEventListener('click', () => setGuided(!guided));
    const curZone = () => sel.startsWith('z:') ? GUIDE_ZONES.indexOf(Number(sel.slice(2))) : -1;
    $('.prp-prev').addEventListener('click', () => { if (guided) setGuided(false); const c = curZone(); setSel('z:' + GUIDE_ZONES[c <= 0 ? GUIDE_ZONES.length - 1 : c - 1]); saveBoard(); });
    $('.prp-next').addEventListener('click', () => { if (guided) setGuided(false); const c = curZone(); setSel('z:' + GUIDE_ZONES[c >= GUIDE_ZONES.length - 1 ? 0 : c + 1]); saveBoard(); });
    $('.prp-all').addEventListener('click', () => { if (guided) setGuided(false); setSel(''); saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); saveBoard(); });
    lineBtn.addEventListener('click', () => { showLine = !showLine; lineBtn.classList.toggle('on', showLine); requestDraw(); saveBoard(); });
    dotsBtn.addEventListener('click', () => { showDots = !showDots; dotsBtn.classList.toggle('on', showDots); if (!showDots && sel.startsWith('c:')) sel = ''; lastInfoKey = ''; requestDraw(); saveBoard(); });
    row2.querySelectorAll('.prp-ind-btn').forEach(b => b.addEventListener('click', () => {
        ind = Number(b.dataset.ind); lastInfoKey = ''; requestDraw(); saveBoard();
    }));
    selA.addEventListener('change', () => { if (guided) setGuided(false); setPair(selA.value, cB); saveBoard(); });
    selB.addEventListener('change', () => { if (guided) setGuided(false); setPair(cA, selB.value); saveBoard(); });
    $('.prp-swap').addEventListener('click', () => { if (guided) setGuided(false); setPair(cB, cA); saveBoard(); });
    $('.prp-rand').addEventListener('click', () => {
        if (guided) setGuided(false);
        const a = PRP_C_ORDER[Math.floor(Math.random() * PRP_C_ORDER.length)];
        let b = a;
        while (b === a) b = PRP_C_ORDER[Math.floor(Math.random() * PRP_C_ORDER.length)];
        setPair(a, b); saveBoard();
    });
    row2.querySelectorAll('.prp-preset').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        const p = PRP_PRESETS[Number(b.dataset.preset)];
        setPair(p[0], p[1]); saveBoard();
    }));
    row2.querySelectorAll('.prp-vq').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        setVq(Number(b.dataset.vq)); saveBoard();
    }));
    $('.prp-replay').addEventListener('click', () => { revT0 = performance.now(); startLoop(); });

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
        if (guided) setGuided(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🌍 Pays riches, pays pauvres', {
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
        animId = null; guided = false;
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
    selA.value = cA; selB.value = cB;
    setMode('carte');
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._prpGetData = () => ({
        containerW: contW, containerH: contH,
        mode, sel, ind, cA, cB, vq,
        showLabels, showLine, showDots
    });
    widget._prpSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.ind === 'number') ind = Math.max(0, Math.min(PRP_IND.length - 1, Math.round(d.ind)));
        if (typeof d.vq === 'number') vq = Math.max(0, Math.min(PRP_VQ.length - 1, Math.round(d.vq)));
        if (typeof d.cA === 'string' && PRP_COUNTRIES[d.cA]) cA = d.cA;
        if (typeof d.cB === 'string' && PRP_COUNTRIES[d.cB]) cB = d.cB;
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showLine === 'boolean') { showLine = d.showLine; lineBtn.classList.toggle('on', showLine); }
        if (typeof d.showDots === 'boolean') { showDots = d.showDots; dotsBtn.classList.toggle('on', showDots); }
        if (typeof d.sel === 'string') {
            const s = d.sel;
            const ok = s === '' ||
                (s.startsWith('z:') && PRP_ZONES[Number(s.slice(2))]) ||
                (s.startsWith('l:') && PRP_LESSONS[s.slice(2)]) ||
                (s.startsWith('c:') && PRP_COUNTRIES[s.slice(2)]);
            sel = ok ? s : '';
        }
        selA.value = cA; selB.value = cB;
        setMode(d.mode || 'carte');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_prpSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
