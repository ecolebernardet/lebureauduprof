// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même aide que dans activites-sciences-terre-mouvement.js : définie une seule fois)
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
// WIDGET LE CYCLE DE L'EAU — Le Bureau du Prof
// Deux onglets, pour des élèves de fin de primaire (CM1 – CM2 – 6e) :
//  💧 Le cycle de l'eau : un paysage animé (mer, nuages, montagnes, rivière,
//     sol, nappe souterraine, arbres). Six étapes à découvrir : évaporation,
//     condensation, précipitations, ruissellement, infiltration et
//     transpiration des plantes. On touche une étiquette ou une partie du
//     paysage pour l'expliquer ; « Visite guidée » enchaîne les étapes.
//     Le curseur « Chaleur du Soleil » change l'évaporation et la neige.
//  🧊 Les états de l'eau : un thermomètre et un bécher. On fait varier la
//     température et l'on voit les particules d'eau passer de la glace
//     (solide) à l'eau (liquide) puis à la vapeur (gaz), avec le nom de
//     chaque changement d'état (fusion, solidification, vaporisation,
//     condensation).
// Une fiche à droite donne l'explication, le changement d'état et un
// « Le savais-tu ? ».
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
    if (document.getElementById('ce-style')) return;
    const s = document.createElement('style');
    s.id = 'ce-style';
    s.textContent = `
        .widget[data-type="cycle-eau"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ce-container {
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
        .ce-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .ce-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .ce-header .wf-btns { gap: 8px; }
        .ce-header .wf-btn { width: 18px; height: 18px; }
        .ce-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ce-container.wf-fullboard {
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
        .ce-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .ce-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .ce-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .ce-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .ce-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .ce-btn:hover { background: #e0e0e0; }
        .ce-btn:active { transform: scale(0.96); }
        .ce-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .ce-btn-play { min-width: 112px; }
        .ce-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .ce-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .ce-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .ce-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .ce-stage-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .ce-stage-btn.on { background: var(--st-c, #3b8fd9); border-color: var(--st-c, #3b8fd9); color: #fff; }
        .ce-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 200px; min-width: 180px; }
        .ce-slider { flex: 1; height: 30px; accent-color: #3b8fd9; cursor: pointer; touch-action: none; }
        .ce-val { font-size: 13px; font-weight: 800; color: #1d4f86; min-width: 58px; text-align: right; }

        /* Corps */
        .ce-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .ce-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #cfe6f5;
        }
        .ce-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .ce-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: rgba(255,255,255,.85); pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,.5);
        }
        .ce-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3b8fd9;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .ce-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #1d4f86; }
        .ce-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .ce-change { background: #eaf3fc; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d4f86; font-weight: 700; }
        .ce-text { margin: 0 0 6px; }
        .ce-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .ce-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .ce-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .ce-steps button.on { background: var(--st-c, #3b8fd9); color: #fff; }
        .ce-side ul.ce-nature { margin: 0 0 6px; padding-left: 18px; }

        /* Aide */
        .ce-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .ce-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 360px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ce-help-popup.show { display: block; }
        .ce-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .ce-help-popup p { margin: 0 0 6px; }

        .ce-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .ce-resize-handle:hover { opacity: 1; }
        .ce-container[data-mode="etats"] .ce-only-cycle { display: none !important; }
        .ce-container[data-mode="cycle"] .ce-only-etats { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .ce-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .ce-tab-short { display: none; }
        /* L'en-tête ne déborde jamais : les onglets rétrécissent,
           les boutons fenêtre (?, jaune, vert, rouge) restent toujours visibles */
        .ce-header { min-width: 0; max-width: 100%; }
        .ce-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .ce-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ce-header .wf-btns { flex-shrink: 0; }
        .ce-container.wf-fullboard .ce-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ce-container { padding: 10px 10px 8px; gap: 6px; }
            .ce-header { gap: 6px; }
            .ce-title { font-size: 13px; }
            .ce-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .ce-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .ce-row > * { flex-shrink: 0; }
            .ce-row + .ce-row { flex-wrap: wrap; overflow: visible; }
            .ce-row + .ce-row .ce-lbl:first-child { display: none; }
            .ce-slider-box { flex: 1 1 160px; min-width: 0; }
            .ce-val { min-width: 0; }
            .ce-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .ce-btn-play { min-width: 0; }
            .ce-sep { display: none; }
            .ce-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .ce-side { padding: 8px 10px; font-size: 13px; }
            .ce-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .ce-title { display: none; }
            .ce-tab { padding: 3px 7px; font-size: 11.5px; }
            .ce-tab-long { display: none; }
            .ce-tab-short { display: inline; }
            .ce-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .ce-body { flex-direction: column; }
            .ce-slider-box { flex: 1 1 100%; }
            .ce-scene-wrap { flex: 1 1 0; min-height: 220px; }
            .ce-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .ce-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="cycle-eau"], .ce-container, .ce-container * { cursor: default !important; }
        .ce-container .ce-header, .ce-container .ce-header * { cursor: grab !important; }
        .ce-container .ce-header:active, .ce-container .ce-header:active * { cursor: grabbing !important; }
        .ce-container button, .ce-container button *, .ce-container .ce-header button,
        .ce-container .ce-header button *,
        .ce-container input[type="range"] { cursor: pointer !important; }
        .ce-container button:disabled, .ce-container button:disabled *,
        .ce-container .ce-canvas { cursor: default !important; }
        .ce-container input { cursor: text !important; }
        .ce-container .ce-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .ce-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ce-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ce-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .ce-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .ce-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .ce-help-popup { top: 56px; }
        .ce-container.wf-fullboard .ce-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ce-container.wf-fullboard .ce-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .ce-title { font-size: 17px; }
        }
        .ce-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .ce-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .ce-tab:hover { background: rgba(255,255,255,.1); }
        .ce-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .ce-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ce-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .ce-container.wf-fullboard .ce-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .ce-tab { padding: 3px 10px; font-size: 12px; }
            .ce-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .ce-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
// lx, ly : position de l'étiquette dans le paysage (0 … 1)
const CE_STAGES = [
    {
        id: 'evap', ico: '💨', name: 'Évaporation', color: '#e8833a', lx: 0.17, ly: 0.50,
        change: 'liquide ➜ gaz : l\'eau devient de la vapeur d\'eau.',
        text: 'Le <b>Soleil chauffe</b> l\'eau des mers, des océans, des lacs et des rivières. Une partie de cette eau se transforme en <b>vapeur d\'eau</b> : un gaz <b>invisible</b> qui monte dans l\'air. Le sel, lui, reste dans la mer : la vapeur d\'eau est de l\'eau douce.',
        know: 'Le linge mouillé sèche grâce à l\'évaporation, même quand il n\'y a pas de soleil. Plus il fait chaud, plus l\'eau s\'évapore vite.'
    },
    {
        id: 'cond', ico: '☁️', name: 'Condensation', color: '#6b7fd0', lx: 0.27, ly: 0.075,
        change: 'gaz ➜ liquide : la vapeur redevient de minuscules gouttelettes.',
        text: 'En altitude, l\'air est <b>plus froid</b>. En montant, la vapeur d\'eau se refroidit et se transforme en <b>minuscules gouttelettes d\'eau</b> (ou en petits cristaux de glace). Ensemble, elles forment les <b>nuages</b>. Le <b>vent</b> pousse ensuite les nuages au-dessus des terres.',
        know: 'Un nuage n\'est pas de la vapeur : ce sont des milliards de gouttelettes. La buée sur une vitre froide, c\'est aussi de la condensation.'
    },
    {
        id: 'precip', ico: '🌧️', name: 'Précipitations', color: '#2f7fd8', lx: 0.93, ly: 0.12,
        change: 'l\'eau retombe sur le sol : liquide (pluie) ou solide (neige, grêle).',
        text: 'Dans le nuage, les gouttelettes se regroupent et grossissent. Quand elles deviennent <b>trop lourdes</b>, elles tombent : c\'est la <b>pluie</b>. Quand il fait très froid, comme en haute montagne, l\'eau tombe en <b>neige</b> ou en <b>grêle</b>.',
        know: 'En montagne, la neige s\'accumule pendant l\'hiver. Au printemps, elle fond (c\'est la fusion) et alimente les torrents et les rivières.'
    },
    {
        id: 'runoff', ico: '🏞️', name: 'Ruissellement', color: '#14a0a0', lx: 0.70, ly: 0.63,
        change: 'l\'eau reste liquide et coule vers le bas.',
        text: 'Une partie de l\'eau de pluie <b>coule à la surface du sol</b>, toujours vers le bas. Elle forme des ruisseaux, qui se rejoignent en <b>rivières</b>, puis en <b>fleuves</b>. Les fleuves se jettent dans la <b>mer</b> : l\'eau est revenue à son point de départ !',
        know: 'Sur le béton et le goudron des villes, l\'eau ne peut pas s\'enfoncer dans le sol : elle ruisselle beaucoup, ce qui peut provoquer des inondations.'
    },
    {
        id: 'infil', ico: '🟫', name: 'Infiltration', color: '#9a6a3a', lx: 0.53, ly: 0.80,
        change: 'l\'eau reste liquide et s\'enfonce dans le sol.',
        text: 'Une autre partie de l\'eau <b>s\'enfonce dans le sol</b>, entre les grains de terre et dans les fissures des roches. Elle forme des réserves d\'eau souterraines : les <b>nappes phréatiques</b>. Cette eau avance très lentement et rejoint les rivières et la mer, ou ressort par des <b>sources</b>.',
        know: 'Une grande partie de l\'eau du robinet est pompée dans les nappes souterraines. Le sol filtre l\'eau, mais il ne la rend pas toujours potable.'
    },
    {
        id: 'trans', ico: '🌳', name: 'Transpiration', color: '#3f9e4d', lx: 0.47, ly: 0.50,
        change: 'liquide ➜ gaz : les feuilles rejettent de la vapeur d\'eau.',
        text: 'Les plantes <b>puisent l\'eau du sol</b> par leurs racines. L\'eau monte jusqu\'aux feuilles, qui en rejettent une partie dans l\'air sous forme de <b>vapeur d\'eau</b> : c\'est la <b>transpiration des plantes</b>. Cette vapeur rejoint celle qui vient des mers.',
        know: 'Un grand arbre peut rejeter plusieurs centaines de litres d\'eau par jour en été. Les forêts aident ainsi à former des nuages.'
    }
];
const CE_OVERVIEW = {
    text: 'L\'eau de la Terre ne disparaît jamais : elle <b>circule sans fin</b> entre la mer, l\'air et la terre, en changeant d\'état (liquide, gaz, solide). C\'est le <b>cycle de l\'eau</b>. Son moteur est le <b>Soleil</b>, qui chauffe l\'eau.',
    know: 'Environ 97 % de l\'eau de la Terre est salée (mers et océans). L\'eau que tu bois aujourd\'hui a peut-être déjà été bue par un dinosaure !'
};
const CE_STATES = {
    solide: {
        ico: '🧊', name: 'Solide : la glace', color: '#4aa3c9',
        text: 'Au-dessous de <b>0 °C</b>, l\'eau gèle : elle devient de la <b>glace</b>. Ses particules sont <b>serrées et rangées</b> ; elles vibrent sur place sans se déplacer. La glace a une <b>forme propre</b> : elle ne coule pas.',
        nature: ['la neige et la grêle', 'les glaciers et la banquise', 'le givre sur les plantes en hiver']
    },
    liquide: {
        ico: '💧', name: 'Liquide : l\'eau', color: '#2f7fd8',
        text: 'Entre <b>0 °C</b> et <b>100 °C</b>, l\'eau est liquide. Ses particules sont <b>proches</b> mais <b>glissent</b> les unes sur les autres. L\'eau liquide <b>coule</b>, prend la forme du récipient et sa surface est plane et horizontale.',
        nature: ['les mers, les lacs et les rivières', 'la pluie', 'les gouttelettes qui forment les nuages']
    },
    gaz: {
        ico: '♨️', name: 'Gaz : la vapeur d\'eau', color: '#e8833a',
        text: 'À <b>100 °C</b>, l\'eau bout : elle devient de la <b>vapeur d\'eau</b>. Ses particules sont <b>très éloignées</b> et bougent très vite dans tous les sens. La vapeur d\'eau est <b>invisible</b> et occupe tout l\'espace disponible.',
        nature: ['l\'air contient toujours un peu de vapeur d\'eau', 'la vapeur qui sort des feuilles des plantes', 'la vapeur au-dessus de la mer chauffée par le Soleil']
    }
};
const CE_CHANGES = {
    'solide>liquide': { name: 'la fusion', text: 'La glace fond : elle devient de l\'eau liquide (à 0 °C).' },
    'liquide>solide': { name: 'la solidification', text: 'L\'eau gèle : elle devient de la glace (à 0 °C).' },
    'liquide>gaz':    { name: 'la vaporisation', text: 'L\'eau devient de la vapeur. Lente à la surface : l\'évaporation ; rapide et avec des bulles à 100 °C : l\'ébullition.' },
    'gaz>liquide':    { name: 'la condensation', text: 'La vapeur se refroidit et redevient de l\'eau liquide (comme la buée sur une vitre).' },
    'solide>gaz':     { name: 'la fusion, puis la vaporisation', text: 'La glace a d\'abord fondu, puis l\'eau s\'est transformée en vapeur.' },
    'gaz>solide':     { name: 'la condensation, puis la solidification', text: 'La vapeur est d\'abord redevenue liquide, puis l\'eau a gelé.' }
};

// ── Géométrie du paysage (coordonnées 0 … 1) ─────────────────────────────
const CE_SEA_Y = 0.70;
const CE_SOIL_Y = 0.745;           // haut de la coupe du sol
const CE_NAPPE = [0.855, 0.93];    // nappe d'eau souterraine
const CE_GROUND = [[0.30, 0.94], [0.36, 0.71], [0.40, 0.685], [0.48, 0.67], [0.54, 0.655], [0.58, 0.58], [0.62, 0.46],
                   [0.66, 0.36], [0.71, 0.44], [0.82, 0.20], [0.88, 0.30], [0.94, 0.40], [1.0, 0.46]];
const CE_RIVER = [[0.805, 0.235], [0.79, 0.29], [0.77, 0.335], [0.745, 0.39], [0.72, 0.46], [0.69, 0.50], [0.65, 0.52],
                  [0.62, 0.56], [0.585, 0.61], [0.55, 0.645], [0.50, 0.675], [0.45, 0.685], [0.40, 0.695], [0.355, 0.708]];
const CE_TREES = [0.425, 0.46, 0.497, 0.528];
const CE_CLOUD_A = [0.27, 0.23];
const CE_CLOUD_B = [0.73, 0.12];
const CE_SUN = [0.07, 0.12];

function _ceGroundY(x) {
    if (x <= 0.36) return 0.71;
    for (let i = 2; i < CE_GROUND.length; i++) {
        const a = CE_GROUND[i - 1], b = CE_GROUND[i];
        if (x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
    }
    return CE_GROUND[CE_GROUND.length - 1][1];
}
function _ceLens(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return L;
}
function _ceAt(pts, L, t) {
    const d = Math.max(0, Math.min(1, t)) * L[L.length - 1];
    let i = 0;
    while (i < L.length - 2 && L[i + 1] < d) i++;
    const u = (d - L[i]) / ((L[i + 1] - L[i]) || 1);
    const a = pts[i], b = pts[i + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0]), i];
}
const CE_RIVER_L = _ceLens(CE_RIVER);
// Calottes de neige : parties du relief au-dessus de la « limite des neiges »
function _ceSnowPolys(line) {
    const G = CE_GROUND.slice(1), polys = [];
    let cur = null;
    for (let i = 0; i < G.length; i++) {
        const p = G[i], above = p[1] < line;
        if (i > 0) {
            const q = G[i - 1], qa = q[1] < line;
            if (above !== qa) {
                const u = (line - q[1]) / (p[1] - q[1]);
                const X = [q[0] + (p[0] - q[0]) * u, line];
                if (above) cur = [X];
                else if (cur) { cur.push(X); polys.push(cur); cur = null; }
            }
        }
        if (above) { if (!cur) cur = []; cur.push(p); }
    }
    if (cur) polys.push(cur);
    return polys;
}
function _ceStars(n, seed) {     // petits cailloux du sol (identiques à chaque image)
    let x = seed;
    const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const a = [];
    for (let i = 0; i < n; i++) a.push([r(), r(), 0.6 + r() * 1.6]);
    return a;
}

// ── Création du widget ────────────────────────────────────────────────────
function createCycleEauWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'cycle-eau';
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
    container.className = 'ce-container';
    container.dataset.mode = 'cycle';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'ce-header';
    header.innerHTML = `
        <span class="ce-title">💧<span> Le cycle de l'eau</span></span>
        <div class="ce-tabs">
            <button class="ce-tab on" data-mode="cycle" title="Le cycle de l'eau"><span class="ce-tab-long">💧 Le cycle de l'eau</span><span class="ce-tab-short">💧 Le cycle</span></button>
            <button class="ce-tab" data-mode="etats" title="Les états de l'eau"><span class="ce-tab-long">🧊 Les états de l'eau</span><span class="ce-tab-short">🧊 Les états</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ce-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.ce-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : lecture, options
    const row1 = document.createElement('div');
    row1.className = 'ce-row';
    row1.innerHTML = `
        <button class="ce-btn ce-btn-play" title="Lancer / arrêter l'animation">▶ Lecture</button>
        <button class="ce-btn ce-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="ce-sep"></span>
        <button class="ce-btn ce-btn-guide ce-only-cycle" title="Présente les étapes l'une après l'autre">🎓 Visite guidée</button>
        <button class="ce-btn ce-prev ce-only-cycle" title="Étape précédente">◀ Étape</button>
        <button class="ce-btn ce-next ce-only-cycle" title="Étape suivante">Étape ▶</button>
        <button class="ce-btn ce-all ce-only-cycle" title="Voir tout le cycle">🔄 Tout le cycle</button>
        <span class="ce-sep ce-only-cycle"></span>
        <button class="ce-btn ce-labels ce-only-cycle on" title="Afficher les noms des étapes">🏷️ Étiquettes</button>
        <button class="ce-btn ce-arrows ce-only-cycle on" title="Afficher les flèches du cycle">➰ Flèches</button>
        <button class="ce-btn ce-mols ce-only-etats on" title="Afficher les particules d'eau">🔵 Particules</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : étapes + chaleur (cycle) / température (états)
    const row2 = document.createElement('div');
    row2.className = 'ce-row';
    row2.innerHTML = `
        <span class="ce-lbl ce-only-cycle">Étapes :</span>
        ${CE_STAGES.map((s, i) => `<button class="ce-btn ce-stage-btn ce-only-cycle" data-stage="${i}" style="--st-c:${s.color}" title="${s.name}">${i + 1}. ${s.ico} ${s.name}</button>`).join('')}
        <div class="ce-slider-box ce-only-cycle">
            <span class="ce-lbl">☀️ Chaleur du Soleil :</span>
            <input type="range" class="ce-slider ce-heat" min="20" max="100" step="1" value="60" aria-label="Chaleur du Soleil">
            <span class="ce-val ce-heat-val"></span>
        </div>
        <span class="ce-lbl ce-only-etats">Température :</span>
        <button class="ce-btn ce-preset ce-only-etats" data-temp="-10" title="Mettre à −10 °C">❄️ −10 °C</button>
        <button class="ce-btn ce-preset ce-only-etats" data-temp="20" title="Mettre à 20 °C">💧 20 °C</button>
        <button class="ce-btn ce-preset ce-only-etats" data-temp="110" title="Mettre à 110 °C">♨️ 110 °C</button>
        <div class="ce-slider-box ce-only-etats">
            <span class="ce-lbl">🌡️</span>
            <input type="range" class="ce-slider ce-temp" min="-30" max="130" step="1" value="20" aria-label="Température">
            <span class="ce-val ce-temp-val"></span>
        </div>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'ce-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'ce-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'ce-canvas';
    const hint = document.createElement('div');
    hint.className = 'ce-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'ce-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ce-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le cycle de l'eau</h4>
        <p><b>💧 Le cycle de l'eau</b> : <b>▶ Lecture</b> anime l'eau dans le paysage. <b>Touche une étiquette</b>
        ou une partie du paysage (la mer, un nuage, la rivière, le sol, les arbres) pour afficher l'explication
        de l'étape. <b>◀ Étape ▶</b> passe d'une étape à l'autre, <b>🎓 Visite guidée</b> les enchaîne toute seule.</p>
        <p>Le curseur <b>☀️ Chaleur du Soleil</b> change la quantité d'eau qui s'évapore, la taille du nuage et la neige
        sur les montagnes.</p>
        <p><b>🧊 Les états de l'eau</b> : fais glisser le curseur de <b>température</b> (ou le thermomètre) et regarde les
        particules d'eau : rangées dans la glace, qui glissent dans l'eau liquide, très éloignées dans la vapeur.
        Touche un état sur le schéma pour y aller directement.</p>
        <p>La fiche de droite donne l'explication, le changement d'état et un « Le savais-tu ? ».</p>
        <p style="color:#888">Schéma simplifié : les tailles et les distances ne sont pas à l'échelle. La vapeur d'eau
        est invisible en vrai : elle est représentée par des petits points blancs.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ce-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const PEBBLES = _ceStars(90, 4242);

    const $ = sel => container.querySelector(sel);
    const playBtn = $('.ce-btn-play'), speedBtn = $('.ce-btn-speed'), guideBtn = $('.ce-btn-guide');
    const labelsBtn = $('.ce-labels'), arrowsBtn = $('.ce-arrows'), molsBtn = $('.ce-mols');
    const heatSl = $('.ce-heat'), heatVal = $('.ce-heat-val');
    const tempSl = $('.ce-temp'), tempVal = $('.ce-temp-val');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'cycle';
    let stage = -1;                 // -1 : tout le cycle
    let heatPct = 60;
    let temp = 20;
    let lastChange = null;          // dernier changement d'état (onglet états)
    let showLabels = true, showArrows = true, showMols = true;
    let playing = false, fast = false, guided = false, guideT = 0;
    let tempAnim = null;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let labelHits = [];             // zones touchables des étiquettes
    let stGeo = null;               // géométrie de l'onglet états

    const heat = () => heatPct / 100;
    const stateOf = T => T < 0 ? 'solide' : T < 100 ? 'liquide' : 'gaz';

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

    // ── Particules du cycle ───────────────────────────────────────────────
    let parts = [];
    const acc = { evap: 0, trans: 0, wind: 0, rain: 0, runoff: 0, infil: 0 };
    const DUR = { evap: 6, trans: 6, wind: 7, rain: 1.8, runoff: 8, infil: 11 };
    function rates() {
        const h = heat();
        return { evap: 2 + 9 * h, trans: 0.6 + 3 * h, wind: 1.2 + 1.2 * h, rain: 6 + 8 * h, runoff: 4, infil: 2.6 };
    }
    function spawn(k) {
        const p = { k, t: 0, d: DUR[k] * (0.85 + Math.random() * 0.3), r: Math.random(), r2: Math.random() };
        if (k === 'evap') p.x = 0.03 + Math.random() * 0.30;
        else if (k === 'trans') p.x = CE_TREES[Math.floor(Math.random() * CE_TREES.length)] + (Math.random() - 0.5) * 0.025;
        else if (k === 'rain') { p.x = 0.63 + Math.random() * 0.21; p.y0 = 0.15 + Math.random() * 0.03; }
        else if (k === 'infil') {
            p.x = 0.40 + Math.random() * 0.20;
            const g = _ceGroundY(p.x);
            p.path = [[p.x, g + 0.01], [p.x - 0.01, CE_SOIL_Y], [p.x - 0.02, 0.885 + (p.r - 0.5) * 0.04], [0.30, 0.89 + (p.r - 0.5) * 0.04]];
            p.L = _ceLens(p.path);
        }
        parts.push(p);
    }
    function stepCycle(dt) {
        const R = rates();
        for (const k in acc) {
            acc[k] += R[k] * dt;
            while (acc[k] >= 1) { acc[k] -= 1; spawn(k); }
        }
        for (const p of parts) p.t += dt / p.d;
        parts = parts.filter(p => p.t < 1);
    }
    function prewarm() { parts = []; for (let i = 0; i < 240; i++) stepCycle(0.05); }

    function partPos(p) {
        const t = p.t;
        switch (p.k) {
            case 'evap': {
                const tx = 0.18 + 0.16 * p.r2;
                return [p.x + (tx - p.x) * t * t + 0.008 * Math.sin(t * 7 + p.r * 6), CE_SEA_Y - (CE_SEA_Y - 0.26) * t];
            }
            case 'trans': {
                const y0 = _ceGroundY(p.x) - 0.075;
                return [p.x + 0.04 * t + 0.006 * Math.sin(t * 8 + p.r * 6), y0 - (y0 - 0.30) * t];
            }
            case 'wind': {
                return [0.35 + (0.62 - 0.35) * t, 0.22 + (0.14 - 0.22) * t - 0.05 * Math.sin(Math.PI * t) + (p.r - 0.5) * 0.06];
            }
            case 'rain': {
                const g = _ceGroundY(p.x);
                return [p.x - 0.01 * t, p.y0 + (g - p.y0) * t];
            }
            case 'runoff': {
                const a = _ceAt(CE_RIVER, CE_RIVER_L, t);
                return [a[0], a[1] + (p.r - 0.5) * 0.006];
            }
            case 'infil': {
                const a = _ceAt(p.path, p.L, t);
                return [a[0], a[1]];
            }
        }
        return [0, 0];
    }

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function drawCloud(cx, cy, s, col, shade, alpha) {
        const blobs = [[-1.0, 0.15, 0.55], [-0.45, -0.2, 0.7], [0.2, -0.32, 0.8], [0.8, -0.05, 0.6], [1.15, 0.2, 0.45], [0.1, 0.2, 0.6], [-0.6, 0.25, 0.5], [0.65, 0.25, 0.5]];
        ctx.globalAlpha = alpha === undefined ? 1 : alpha;
        ctx.fillStyle = shade;
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(cx + b[0] * s + b[2] * s, cy + b[1] * s + s * 0.1); ctx.arc(cx + b[0] * s, cy + b[1] * s + s * 0.1, b[2] * s, 0, 2 * Math.PI); }
        ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath();
        for (const b of blobs) { ctx.moveTo(cx + b[0] * s + b[2] * s, cy + b[1] * s); ctx.arc(cx + b[0] * s, cy + b[1] * s, b[2] * s, 0, 2 * Math.PI); }
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    function drawArrow(pts, col, w) {
        // pts : [départ, contrôle, arrivée] en pixels
        const [a, c, b] = pts;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]); ctx.stroke();
        const ang = Math.atan2(b[1] - c[1], b[0] - c[0]), h = w * 2.8;
        ctx.beginPath();
        ctx.moveTo(b[0] + Math.cos(ang) * h * 0.5, b[1] + Math.sin(ang) * h * 0.5);
        ctx.lineTo(b[0] - Math.cos(ang) * h + Math.cos(ang + Math.PI / 2) * h * 0.65, b[1] - Math.sin(ang) * h + Math.sin(ang + Math.PI / 2) * h * 0.65);
        ctx.lineTo(b[0] - Math.cos(ang) * h - Math.cos(ang + Math.PI / 2) * h * 0.65, b[1] - Math.sin(ang) * h - Math.sin(ang + Math.PI / 2) * h * 0.65);
        ctx.closePath(); ctx.fill();
    }
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    function drawSun(x, y, rs, k) {
        const g = ctx.createRadialGradient(x, y, rs * 0.3, x, y, rs * 2.6);
        g.addColorStop(0, `rgba(255,214,102,${0.5 + 0.4 * k})`);
        g.addColorStop(0.4, `rgba(255,190,70,${0.15 + 0.25 * k})`);
        g.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, rs * 2.6, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,60,0.85)'; ctx.lineWidth = Math.max(2, rs * 0.08); ctx.lineCap = 'round';
        const rot = simTime * 0.15;
        for (let i = 0; i < 12; i++) {
            const a = rot + i * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * rs * 1.2, y + Math.sin(a) * rs * 1.2);
            ctx.lineTo(x + Math.cos(a) * rs * (1.45 + 0.35 * k), y + Math.sin(a) * rs * (1.45 + 0.35 * k));
            ctx.stroke();
        }
        const c = ctx.createRadialGradient(x - rs * 0.3, y - rs * 0.3, rs * 0.1, x, y, rs);
        c.addColorStop(0, '#fff6c8'); c.addColorStop(0.6, '#ffd24a'); c.addColorStop(1, '#f5a623');
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(x, y, rs, 0, 2 * Math.PI); ctx.fill();
    }

    // ── Scène « Le cycle de l'eau » ───────────────────────────────────────
    function drawCycleScene() {
        const m = Math.min(cssW, cssH);
        const h = heat();
        const sel = stage >= 0 ? CE_STAGES[stage] : null;
        const kindOn = k => !sel || (sel.id === 'evap' && k === 'evap') || (sel.id === 'cond' && k === 'wind') ||
            (sel.id === 'precip' && k === 'rain') || (sel.id === 'runoff' && k === 'runoff') ||
            (sel.id === 'infil' && k === 'infil') || (sel.id === 'trans' && k === 'trans');
        const snowLine = 0.24 + 0.16 * (1 - h) / 0.8;

        // Ciel
        const sky = ctx.createLinearGradient(0, 0, 0, Y(CE_SEA_Y));
        sky.addColorStop(0, '#6eaee3'); sky.addColorStop(1, '#d4ebf7');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, cssW, cssH);

        drawSun(X(CE_SUN[0]), Y(CE_SUN[1]), m * 0.055 * (0.8 + 0.3 * h), h);

        // Particules dans le ciel (vapeur, vent) : derrière les nuages
        const dotR = Math.max(1.8, m * 0.006);
        for (const p of parts) {
            if (p.k !== 'evap' && p.k !== 'trans' && p.k !== 'wind') continue;
            const [x, y] = partPos(p);
            const on = kindOn(p.k);
            const fade = Math.min(1, p.t / 0.1, (1 - p.t) / 0.15);
            ctx.globalAlpha = fade * (on ? 0.95 : 0.3);
            if (p.k === 'wind') {
                ctx.fillStyle = '#f4f7fb';
                ctx.beginPath(); ctx.ellipse(X(x), Y(y), dotR * 3.2, dotR * 1.7, 0, 0, 2 * Math.PI); ctx.fill();
            } else {
                ctx.fillStyle = p.k === 'trans' ? '#eafff0' : '#ffffff';
                ctx.beginPath(); ctx.arc(X(x), Y(y), dotR * (on && sel ? 1.5 : 1), 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Nuages
        const sA = m * 0.065 * (0.7 + 0.55 * h);
        drawCloud(X(CE_CLOUD_A[0]), Y(CE_CLOUD_A[1]), sA, '#ffffff', '#d8e3ee', sel && sel.id !== 'cond' ? 0.75 : 1);
        drawCloud(X(CE_CLOUD_B[0]), Y(CE_CLOUD_B[1]), m * 0.085, '#c4cdd9', '#8b97a8', sel && sel.id !== 'precip' && sel.id !== 'cond' ? 0.8 : 1);

        // Mer
        const sea = ctx.createLinearGradient(0, Y(CE_SEA_Y), 0, cssH);
        sea.addColorStop(0, '#3d8fd1'); sea.addColorStop(1, '#174777');
        ctx.fillStyle = sea; ctx.fillRect(0, Y(CE_SEA_Y), X(0.42), cssH - Y(CE_SEA_Y));
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let x = 0; x <= X(0.37); x += 4) {
            const y = Y(CE_SEA_Y) + 2 * Math.sin(x * 0.06 + simTime * 1.5);
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();

        // Terre : face avant des montagnes et de la plaine
        const land = [[0.30, 1.0], ...CE_GROUND, [1.0, 1.0]];
        const landPath = () => { ctx.beginPath(); land.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.closePath(); };
        const lg = ctx.createLinearGradient(0, Y(0.2), 0, Y(CE_SOIL_Y));
        lg.addColorStop(0, '#8f8b86'); lg.addColorStop(0.42, '#7f8f6a'); lg.addColorStop(0.65, '#6f9e50'); lg.addColorStop(1, '#5f9043');
        landPath(); ctx.fillStyle = lg; ctx.fill();

        // Coupe du sol, nappe souterraine, roche
        ctx.save();
        landPath(); ctx.clip();
        const sg = ctx.createLinearGradient(0, Y(CE_SOIL_Y), 0, Y(CE_NAPPE[0]));
        sg.addColorStop(0, '#a17a55'); sg.addColorStop(1, '#7b5a3c');
        ctx.fillStyle = sg; ctx.fillRect(0, Y(CE_SOIL_Y), cssW, Y(CE_NAPPE[0]) - Y(CE_SOIL_Y));
        ctx.fillStyle = 'rgba(60,40,25,0.35)';
        for (const [px, py, pr] of PEBBLES) {
            const y = CE_SOIL_Y + 0.01 + py * (CE_NAPPE[0] - CE_SOIL_Y - 0.02);
            ctx.beginPath(); ctx.arc(X(0.30 + px * 0.70), Y(y), pr, 0, 2 * Math.PI); ctx.fill();
        }
        const ng = ctx.createLinearGradient(0, Y(CE_NAPPE[0]), 0, Y(CE_NAPPE[1]));
        ng.addColorStop(0, '#6d8fa8'); ng.addColorStop(1, '#4f7da3');
        ctx.fillStyle = ng; ctx.fillRect(0, Y(CE_NAPPE[0]), cssW, Y(CE_NAPPE[1]) - Y(CE_NAPPE[0]));
        ctx.fillStyle = 'rgba(120,190,245,0.35)';
        for (let i = 0; i < 26; i++) {
            const x = 0.30 + ((i * 0.037 - simTime * 0.006) % 0.70 + 0.70) % 0.70;
            ctx.beginPath(); ctx.ellipse(X(x), Y(CE_NAPPE[0] + 0.03 + 0.02 * Math.sin(i * 1.7)), 6, 2, 0, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.fillStyle = '#5c5f66'; ctx.fillRect(0, Y(CE_NAPPE[1]), cssW, cssH - Y(CE_NAPPE[1]));
        ctx.strokeStyle = 'rgba(40,30,20,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(0, Y(CE_SOIL_Y)); ctx.lineTo(cssW, Y(CE_SOIL_Y)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        // contour du relief
        ctx.beginPath(); CE_GROUND.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
        ctx.strokeStyle = 'rgba(40,60,30,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();

        // Neige sur les sommets (moins il fait chaud, plus elle descend)
        for (const poly of _ceSnowPolys(snowLine)) {
            ctx.beginPath();
            poly.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
            const a = poly[poly.length - 1], b = poly[0], n = 8;
            for (let k = 1; k < n; k++) {
                const x = a[0] + (b[0] - a[0]) * k / n;
                ctx.lineTo(X(x), Y(snowLine + (k % 2 ? 0.018 : 0.006)));
            }
            ctx.closePath();
            ctx.fillStyle = '#f7fbff'; ctx.fill();
            ctx.strokeStyle = 'rgba(160,185,210,0.8)'; ctx.lineWidth = 1; ctx.stroke();
        }

        // Rivière (s'élargit vers la mer)
        const rw = Math.max(1, m * 0.004);
        for (let i = 1; i < CE_RIVER.length; i++) {
            const a = CE_RIVER[i - 1], b = CE_RIVER[i];
            const w = rw * (1.2 + 3.2 * i / CE_RIVER.length);
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#2b6fae'; ctx.lineWidth = w + 2;
            ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke();
            ctx.strokeStyle = '#5cb3f0'; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(X(a[0]), Y(a[1])); ctx.lineTo(X(b[0]), Y(b[1])); ctx.stroke();
        }

        // Arbres (avec leurs racines dessinées dans la coupe du sol)
        for (const tx of CE_TREES) {
            const gy = Y(_ceGroundY(tx)), x = X(tx), th = m * 0.07;
            ctx.strokeStyle = 'rgba(90,60,35,0.45)'; ctx.lineWidth = 1.1;
            for (const d of [-1, -0.4, 0.4, 1]) {
                ctx.beginPath(); ctx.moveTo(x, gy); ctx.quadraticCurveTo(x + d * th * 0.12, gy + th * 0.2, x + d * th * 0.22, Y(CE_SOIL_Y) + th * 0.12); ctx.stroke();
            }
            ctx.fillStyle = '#6d4a2b'; ctx.fillRect(x - th * 0.06, gy - th * 0.55, th * 0.12, th * 0.56);
            ctx.fillStyle = '#2f7d3a';
            ctx.beginPath(); ctx.arc(x, gy - th * 0.7, th * 0.34, 0, 2 * Math.PI); ctx.arc(x - th * 0.22, gy - th * 0.55, th * 0.24, 0, 2 * Math.PI); ctx.arc(x + th * 0.22, gy - th * 0.55, th * 0.24, 0, 2 * Math.PI); ctx.fill();
            ctx.fillStyle = 'rgba(160,220,120,0.35)';
            ctx.beginPath(); ctx.arc(x - th * 0.08, gy - th * 0.8, th * 0.14, 0, 2 * Math.PI); ctx.fill();
        }

        // Pluie / neige, ruissellement, infiltration
        for (const p of parts) {
            if (p.k !== 'rain' && p.k !== 'runoff' && p.k !== 'infil') continue;
            const [x, y] = partPos(p);
            const on = kindOn(p.k);
            ctx.globalAlpha = on ? 1 : 0.3;
            const big = on && sel ? 1.4 : 1;
            if (p.k === 'rain') {
                if (_ceGroundY(x) < snowLine + 0.04) {          // neige sur les hauteurs
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(X(x) + 2 * Math.sin(p.t * 9 + p.r * 6), Y(y), dotR * 1.1 * big, 0, 2 * Math.PI); ctx.fill();
                } else {
                    ctx.strokeStyle = '#2f7fd8'; ctx.lineWidth = Math.max(1.4, m * 0.004) * big;
                    ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x + 0.003), Y(y - 0.025)); ctx.stroke();
                }
            } else {
                ctx.fillStyle = p.k === 'runoff' ? '#e9f6ff' : '#4fb0f5';
                ctx.beginPath(); ctx.arc(X(x), Y(y), dotR * (p.k === 'infil' ? 1.15 : 0.9) * big, 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Flèches du cycle
        if (showArrows) {
            const w = Math.max(3, m * 0.012);
            const A = (k, col, pts) => {
                const on = !sel || sel.id === k;
                ctx.globalAlpha = on ? 0.9 : 0.25;
                drawArrow(pts.map(p => [X(p[0]), Y(p[1])]), col, on && sel ? w * 1.3 : w);
            };
            A('evap', '#e8833a', [[0.08, 0.66], [0.06, 0.48], [0.13, 0.33]]);
            A('trans', '#3f9e4d', [[0.555, 0.585], [0.575, 0.48], [0.555, 0.38]]);
            A('cond', '#6b7fd0', [[0.37, 0.27], [0.48, 0.27], [0.58, 0.19]]);
            A('precip', '#2f7fd8', [[0.585, 0.20], [0.575, 0.30], [0.585, 0.42]]);
            A('runoff', '#14a0a0', [[0.60, 0.645], [0.50, 0.71], [0.40, 0.725]]);
            A('infil', '#9a6a3a', [[0.44, 0.72], [0.43, 0.84], [0.35, 0.875]]);
            ctx.globalAlpha = 1;
            const fs = Math.max(10, Math.min(14, cssW / 75));
            ctx.font = `700 italic ${fs}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillStyle = 'rgba(40,60,110,0.85)';
            ctx.fillText('vent ➜', X(0.47), Y(0.255));
        }

        // Noms des lieux
        const fsn = Math.max(10, Math.min(14, cssW / 72));
        ctx.font = `800 ${fsn}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('La mer (eau salée)', X(0.15), Y(0.83));
        ctx.fillText('Nappe d\'eau souterraine', X(0.70), Y((CE_NAPPE[0] + CE_NAPPE[1]) / 2));
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText('rivière', X(0.585), Y(0.665));

        // Étiquettes des étapes (zones touchables)
        labelHits = [];
        if (showLabels) {
            const fs = Math.max(11, Math.min(17, cssW / 60));
            CE_STAGES.forEach((s, i) => {
                const on = stage === i;
                const txt = `${i + 1}. ${s.ico} ${s.name}`;
                ctx.font = `800 ${on ? fs * 1.12 : fs}px 'Segoe UI', system-ui, sans-serif`;
                const w = ctx.measureText(txt).width + 16, hh = fs * (on ? 2.0 : 1.8);
                const lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, X(s.lx)));
                const ly = Math.max(hh / 2 + 4, Math.min(cssH - hh / 2 - 22, Y(s.ly)));
                ctx.globalAlpha = sel && !on ? 0.6 : 1;
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
    }

    // ── Scène « Les états de l'eau » ──────────────────────────────────────
    const MOLS = [];
    for (let i = 0; i < 42; i++) {
        const lx = 0.22 + (i % 7) * 0.093, ly = 0.93 - Math.floor(i / 7) * 0.075;
        MOLS.push({ lx, ly, x: lx, y: ly, vx: 0, vy: 0, ph: Math.random() * 6.28 });
    }
    function placeMolsFor(st) {      // position immédiate (restauration, pas d'animation)
        for (const m of MOLS) {
            if (st === 'solide') { m.x = m.lx; m.y = m.ly; }
            else if (st === 'liquide') { m.x = 0.06 + Math.random() * 0.88; m.y = 0.5 + Math.random() * 0.46; }
            else { m.x = 0.05 + Math.random() * 0.9; m.y = -0.4 + Math.random() * 1.3; }
            const a = Math.random() * 6.28; m.vx = Math.cos(a) * 0.1; m.vy = Math.sin(a) * 0.1;
        }
    }
    function stepMols(dt) {
        const st = stateOf(temp);
        for (const m of MOLS) {
            if (st === 'solide') {
                const k = Math.min(1, dt * 6);
                m.x += (m.lx - m.x) * k; m.y += (m.ly - m.y) * k; m.vx = m.vy = 0;
                continue;
            }
            if (st === 'liquide') {
                const sp = 0.10 + 0.22 * Math.max(0, Math.min(100, temp)) / 100;
                m.vx += (Math.random() - 0.5) * sp * dt * 14;
                m.vy += (Math.random() - 0.5) * sp * dt * 14;
                if (m.y < 0.5) m.vy += 1.6 * dt;                         // l'eau retombe au fond
                const v = Math.hypot(m.vx, m.vy), vmax = m.y < 0.5 ? 0.8 : sp;
                if (v > vmax) { m.vx *= vmax / v; m.vy *= vmax / v; }
                m.x += m.vx * dt; m.y += m.vy * dt;
                if (m.x < 0.05) { m.x = 0.05; m.vx = Math.abs(m.vx); }
                if (m.x > 0.95) { m.x = 0.95; m.vx = -Math.abs(m.vx); }
                if (m.y > 0.965) { m.y = 0.965; m.vy = -Math.abs(m.vy); }
                if (m.y > 0.5 && m.y < 0.52 && m.vy < 0) m.vy = Math.abs(m.vy) * 0.5;   // surface
            } else {
                const sp = 0.55 + 0.6 * Math.max(0, Math.min(1, (temp - 100) / 30));
                let v = Math.hypot(m.vx, m.vy);
                if (v < 0.01) { const a = Math.random() * 6.28; m.vx = Math.cos(a); m.vy = Math.sin(a); v = 1; }
                const nv = v + (sp - v) * Math.min(1, dt * 3);
                m.vx *= nv / v; m.vy *= nv / v;
                m.x += m.vx * dt; m.y += m.vy * dt;
                if (m.x < 0.04) { m.x = 0.04; m.vx = Math.abs(m.vx); }
                if (m.x > 0.96) { m.x = 0.96; m.vx = -Math.abs(m.vx); }
                if (m.y < -0.45) { m.y = -0.45; m.vy = Math.abs(m.vy); }
                if (m.y > 0.965) { m.y = 0.965; m.vy = -Math.abs(m.vy); }
            }
        }
    }

    function drawStatesScene() {
        const st = stateOf(temp), S = CE_STATES[st];
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f2f7fc'); bg.addColorStop(1, '#dbe7f2');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const wide = cssW / cssH > 1.15;
        const m = Math.min(cssW, cssH);

        // Table
        ctx.fillStyle = '#c9b294'; ctx.fillRect(0, Y(0.92), cssW, cssH - Y(0.92));
        ctx.fillStyle = '#b39a79'; ctx.fillRect(0, Y(0.92), cssW, 4);

        // Thermomètre
        const tx = wide ? X(0.09) : X(0.12), tTop = Y(0.12), tBot = Y(0.80);
        const tw = Math.max(10, m * 0.03), frac = (temp + 30) / 160;
        const lvl = tBot - frac * (tBot - tTop);
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#8a96a6'; ctx.lineWidth = 2;
        roundRect(tx - tw / 2, tTop - 6, tw, tBot - tTop + 12, tw / 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(tx, tBot + tw * 0.9, tw * 1.05, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0335c';
        ctx.fillRect(tx - tw * 0.24, lvl, tw * 0.48, tBot + tw * 0.5 - lvl);
        ctx.beginPath(); ctx.arc(tx, tBot + tw * 0.9, tw * 0.78, 0, 2 * Math.PI); ctx.fill();
        const fs = Math.max(10, Math.min(15, m / 38));
        ctx.font = `700 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        for (let T = -30; T <= 130; T += 10) {
            const y = tBot - (T + 30) / 160 * (tBot - tTop);
            const major = T % 20 === 0 || T === -30 ? T % 20 === 0 : false;
            ctx.strokeStyle = '#6b7280'; ctx.lineWidth = T === 0 || T === 100 ? 2.5 : 1;
            ctx.beginPath(); ctx.moveTo(tx + tw / 2, y); ctx.lineTo(tx + tw / 2 + (major ? 9 : 5), y); ctx.stroke();
            if (major) { ctx.fillStyle = (T === 0 || T === 100) ? '#1d4f86' : '#4b5563'; ctx.fillText(T + ' °C', tx + tw / 2 + 12, y); }
        }
        ctx.fillStyle = '#e0335c';
        ctx.font = `900 ${fs * 1.3}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(temp) + ' °C', tx, tBot + tw * 2.9);

        // Bécher
        const bw = wide ? Math.min(X(0.34), Y(0.62)) : X(0.58);
        const bh = Math.min(bw * 0.95, Y(0.52));
        const bx = (wide ? X(0.42) : X(0.60)) - bw / 2, by = Y(0.80) - bh;
        stGeo = { tx, tTop, tBot, tw, bx, by, bw, bh, boxes: [] };

        // Source de chaleur / froid sous le bécher
        const px = bx - bw * 0.08, pw = bw * 1.16, py = by + bh + 3;
        ctx.fillStyle = '#7a828e'; roundRect(px, py, pw, Y(0.92) - py, 6); ctx.fill();
        if (temp > 30) {
            const k = Math.min(1, (temp - 30) / 90);
            for (let i = 0; i < 6; i++) {
                const fx = bx + bw * (0.12 + i * 0.152), fh = bh * 0.08 * (0.5 + k) * (0.85 + 0.25 * Math.sin(simTime * 12 + i * 2));
                ctx.fillStyle = i % 2 ? '#ffb02e' : '#ff7a1a';
                ctx.beginPath(); ctx.moveTo(fx - bw * 0.035, py); ctx.quadraticCurveTo(fx, py - fh * 1.6, fx + bw * 0.035, py); ctx.fill();
            }
        } else if (temp < 0) {
            ctx.fillStyle = 'rgba(140,200,255,0.35)';
            roundRect(bx - 8, by + bh * 0.35, bw + 16, bh * 0.68, 14); ctx.fill();
            ctx.font = `${fs * 1.4}px 'Segoe UI', system-ui, sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('❄️', bx - 16, by + bh * 0.55); ctx.fillText('❄️', bx + bw + 16, by + bh * 0.75);
        }

        // Contenu : eau liquide ou glace
        if (st === 'liquide') {
            const top = by + bh * 0.48;
            const wg = ctx.createLinearGradient(0, top, 0, by + bh);
            wg.addColorStop(0, 'rgba(90,170,235,0.45)'); wg.addColorStop(1, 'rgba(40,110,200,0.55)');
            ctx.fillStyle = wg;
            ctx.beginPath(); ctx.moveTo(bx + 3, top);
            for (let x = 0; x <= bw - 6; x += 6) ctx.lineTo(bx + 3 + x, top + 2 * Math.sin(x * 0.08 + simTime * 2));
            ctx.lineTo(bx + bw - 3, by + bh - 3); ctx.lineTo(bx + 3, by + bh - 3); ctx.closePath(); ctx.fill();
            if (temp > 85) {          // petites bulles quand l'eau va bouillir
                ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2;
                for (let i = 0; i < 8; i++) {
                    const u = ((simTime * 0.6 + i * 0.37) % 1);
                    ctx.beginPath(); ctx.arc(bx + bw * (0.1 + 0.8 * ((i * 0.618) % 1)), by + bh - 6 - u * (bh * 0.5), 2 + 3 * u, 0, 2 * Math.PI); ctx.stroke();
                }
            }
        } else if (st === 'solide') {
            ctx.fillStyle = 'rgba(190,232,250,0.75)';
            roundRect(bx + bw * 0.13, by + bh * 0.5, bw * 0.74, bh * 0.475, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2; ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(bx + bw * 0.2, by + bh * 0.58); ctx.lineTo(bx + bw * 0.35, by + bh * 0.54); ctx.stroke();
        }

        // Particules d'eau
        if (showMols) {
            const r = Math.max(3.5, bw * 0.026);
            ctx.save();
            ctx.beginPath(); ctx.rect(bx - bw * 0.3, by - bh * 0.5, bw * 1.6, bh * 1.5); ctx.clip();
            for (const mo of MOLS) {
                let x = bx + mo.x * bw, y = by + mo.y * bh;
                if (st === 'solide') {
                    const amp = r * (0.08 + 0.18 * (temp + 30) / 30);
                    x += amp * Math.sin(simTime * 23 + mo.ph); y += amp * Math.cos(simTime * 19 + mo.ph * 1.3);
                }
                const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
                g.addColorStop(0, '#bfe4ff'); g.addColorStop(1, '#1f6fc4');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
            }
            ctx.restore();
        }

        // Verre du bécher (par-dessus)
        ctx.strokeStyle = '#6f8396'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 6, by); ctx.lineTo(bx, by + 4); ctx.lineTo(bx, by + bh - 8);
        ctx.quadraticCurveTo(bx, by + bh, bx + 8, by + bh); ctx.lineTo(bx + bw - 8, by + bh);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 8); ctx.lineTo(bx + bw, by);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(bx + bw * 0.07, by + bh * 0.12); ctx.lineTo(bx + bw * 0.07, by + bh * 0.75); ctx.stroke();

        // Titre de l'état
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${fs * 1.45}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillStyle = S.color;
        ctx.fillText(`${S.ico} ${S.name}`, bx + bw / 2, Math.max(fs * 1.4, by - bh * 0.55));
        if (st === 'gaz') {
            ctx.font = `600 italic ${fs}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#6b7280';
            ctx.fillText('(en vrai, la vapeur d\'eau est invisible)', bx + bw / 2, Math.max(fs * 3, by - bh * 0.55 + fs * 1.7));
        }

        // Schéma des changements d'état (à droite, si la place le permet)
        if (wide) {
            const cx = X(0.81), bxw = Math.min(X(0.16), 190), bxh = Math.max(36, Y(0.11));
            const items = [['gaz', Y(0.17)], ['liquide', Y(0.47)], ['solide', Y(0.77)]];
            const pos = {};
            for (const [k, y] of items) pos[k] = y;
            const arrowCol = name => lastChange && CE_CHANGES[lastChange] && CE_CHANGES[lastChange].name.indexOf(name) >= 0 ? '#e8833a' : '#8a96a6';
            const fsa = Math.max(10, Math.min(14, m / 42));
            const arr = (y0, y1, side, name) => {
                const x = cx + side * (bxw / 2 + 14);
                const col = arrowCol(name);
                const lw = col === '#8a96a6' ? 2.5 : 4.5;
                const a = y0 + (y1 > y0 ? bxh / 2 + 4 : -bxh / 2 - 4), b = y1 + (y1 > y0 ? -bxh / 2 - 6 : bxh / 2 + 6);
                drawArrow([[x, a], [x + side * 18, (a + b) / 2], [x, b]], col, lw);
                ctx.font = `800 ${fsa}px 'Segoe UI', system-ui, sans-serif`;
                ctx.fillStyle = col === '#8a96a6' ? '#4b5563' : col;
                ctx.textAlign = side > 0 ? 'left' : 'right'; ctx.textBaseline = 'middle';
                ctx.save();
                ctx.translate(x + side * 26, (a + b) / 2);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = 'center';
                ctx.fillText(name, 0, 0);
                ctx.restore();
            };
            arr(pos.solide, pos.liquide, 1, 'fusion');
            arr(pos.liquide, pos.gaz, 1, 'vaporisation');
            arr(pos.gaz, pos.liquide, -1, 'condensation');
            arr(pos.liquide, pos.solide, -1, 'solidification');
            for (const [k, y] of items) {
                const on = k === st, s = CE_STATES[k];
                ctx.fillStyle = on ? s.color : '#ffffff';
                roundRect(cx - bxw / 2, y - bxh / 2, bxw, bxh, 10); ctx.fill();
                ctx.strokeStyle = s.color; ctx.lineWidth = on ? 3 : 2; ctx.stroke();
                ctx.font = `900 ${Math.max(11, Math.min(16, bxw / 9))}px 'Segoe UI', system-ui, sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = on ? '#fff' : '#1f2937';
                const nm = k === 'gaz' ? 'GAZ' : k === 'liquide' ? 'LIQUIDE' : 'SOLIDE';
                ctx.fillText(`${s.ico} ${nm}`, cx, y + 1);
                stGeo.boxes.push({ k, x: cx - bxw / 2 - 6, y: y - bxh / 2 - 6, w: bxw + 12, h: bxh + 12 });
            }
            ctx.font = `700 ${fsa}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#6b7280'; ctx.textBaseline = 'middle';
            ctx.textAlign = 'right'; ctx.fillText('on refroidit ⬇', cx - 6, Y(0.035) + fsa * 0.6);
            ctx.textAlign = 'left';  ctx.fillText('⬆ on chauffe', cx + 6, Y(0.035) + fsa * 0.6);
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        if (mode === 'cycle') drawCycleScene(); else drawStatesScene();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function stepsList() {
        return `<ol class="ce-steps">${CE_STAGES.map((s, i) =>
            `<li><button data-stage="${i}" class="${stage === i ? 'on' : ''}" style="--st-c:${s.color}">${i + 1}. ${s.ico} ${s.name}</button></li>`).join('')}
            <li><button data-stage="-1" class="${stage < 0 ? 'on' : ''}" style="--st-c:#1d4f86">🔄 Tout le cycle</button></li></ol>`;
    }
    function updateInfo() {
        heatVal.textContent = heatPct + ' %';
        if (Number(heatSl.value) !== heatPct) heatSl.value = heatPct;
        tempVal.textContent = Math.round(temp) + ' °C';
        if (document.activeElement !== tempSl) tempSl.value = Math.round(temp);
        row2.querySelectorAll('.ce-stage-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.stage) === stage));

        const st = stateOf(temp);
        const key = mode === 'cycle' ? ['c', stage, Math.round(heatPct / 20)].join('|') : ['e', st, lastChange].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        if (mode === 'cycle') {
            side.style.borderLeftColor = stage >= 0 ? CE_STAGES[stage].color : '#3b8fd9';
            const h = heat();
            const sunNote = h > 0.8 ? 'Le Soleil chauffe fort : beaucoup d\'eau s\'évapore et la neige ne reste qu\'en haut des sommets.'
                : h < 0.4 ? 'Le Soleil chauffe peu : moins d\'eau s\'évapore et la neige descend plus bas sur les montagnes.'
                : 'Plus le Soleil chauffe, plus l\'eau s\'évapore.';
            if (stage < 0) {
                side.innerHTML = `<h4>Le cycle de l'eau</h4>
                    <div class="ce-status">🔄 <span style="color:#1d4f86">Un voyage sans fin</span></div>
                    <p class="ce-text">${CE_OVERVIEW.text}</p>
                    <p class="ce-change">☀️ ${sunNote}</p>
                    <p class="ce-know">💡 <b>Le savais-tu ?</b> ${CE_OVERVIEW.know}</p>
                    ${stepsList()}`;
            } else {
                const s = CE_STAGES[stage];
                side.innerHTML = `<h4>Étape ${stage + 1} sur ${CE_STAGES.length}</h4>
                    <div class="ce-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <p class="ce-change">🔄 ${s.change}</p>
                    <p class="ce-text">${s.text}</p>
                    <p class="ce-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${stepsList()}`;
            }
        } else {
            const S = CE_STATES[st];
            side.style.borderLeftColor = S.color;
            const ch = lastChange && CE_CHANGES[lastChange];
            side.innerHTML = `<h4>Les états de l'eau</h4>
                <div class="ce-status">${S.ico} <span style="color:${S.color}">${S.name}</span></div>
                ${ch ? `<p class="ce-change">🔄 Changement d'état : <b>${ch.name}</b><br><span style="font-weight:600">${ch.text}</span></p>` : ''}
                <p class="ce-text">${S.text}</p>
                <div><b>Dans la nature :</b></div>
                <ul class="ce-nature">${S.nature.map(n => `<li>${n}</li>`).join('')}</ul>
                <p class="ce-know">💡 <b>Le savais-tu ?</b> ${st === 'gaz'
                    ? 'Le « nuage blanc » au-dessus d\'une casserole n\'est pas de la vapeur : ce sont déjà de minuscules gouttelettes, comme dans les nuages.'
                    : st === 'solide' ? 'La glace flotte sur l\'eau : c\'est pour cela que les icebergs et les glaçons ne coulent pas.'
                    : 'L\'eau n\'a pas besoin de bouillir pour devenir de la vapeur : une flaque s\'évapore même à 20 °C, mais lentement. C\'est ce qui se passe dans le cycle de l\'eau.'}</p>
                <p class="ce-text" style="font-size:.9em;color:#6b7280">Les 4 changements d'état : <b>fusion</b> (solide ➜ liquide), <b>solidification</b> (liquide ➜ solide), <b>vaporisation</b> (liquide ➜ gaz), <b>condensation</b> (gaz ➜ liquide).</p>`;
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
        if (tempAnim) {
            const k = Math.min(1, (t - tempAnim.t0) / tempAnim.dur);
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            setTemp(tempAnim.from + (tempAnim.to - tempAnim.from) * e, true);
            if (k >= 1) tempAnim = null;
        }
        const moving = playing || tempAnim;
        if (moving) {
            const dt = rdt * (fast ? 2.5 : 1);
            simTime += dt;
            if (mode === 'cycle') stepCycle(dt); else stepMols(dt);
        }
        if (guided && playing && mode === 'cycle') {
            guideT += rdt;
            if (guideT >= 8) { guideT = 0; setStage(stage >= CE_STAGES.length - 1 ? 0 : stage + 1); }
        }
        draw();
        if (playing || tempAnim) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (!playing && guided) setGuided(false);
        if (playing) startLoop();
    }
    function setFast(v) {
        fast = !!v;
        speedBtn.textContent = fast ? '🐇 Rapide' : '🐢 Lent';
        speedBtn.classList.toggle('on', fast);
    }
    function setGuided(v) {
        guided = !!v;
        guideBtn.classList.toggle('on', guided);
        guideBtn.textContent = guided ? '⏹ Arrêter la visite' : '🎓 Visite guidée';
        if (guided) {
            guideT = 0;
            setStage(0);
            if (!playing) setPlaying(true);
        }
    }
    function setStage(i) {
        stage = Math.max(-1, Math.min(CE_STAGES.length - 1, i));
        lastInfoKey = '';
        requestDraw();
    }
    function setTemp(T, fromAnim) {
        const prev = stateOf(temp);
        temp = Math.max(-30, Math.min(130, T));
        const now = stateOf(temp);
        if (prev !== now) lastChange = prev + '>' + now;
        if (!fromAnim) tempAnim = null;
        // particules : laisser l'animation faire, ou placer directement si l'animation est arrêtée
        if (prev !== now && !playing && !tempAnim && !fromAnim) placeMolsFor(now);
        requestDraw();
    }
    function goToTemp(T) {
        tempAnim = { from: temp, to: T, t0: performance.now(), dur: 1200 };
        startLoop();
    }
    function setMode(m) {
        mode = m === 'etats' ? 'etats' : 'cycle';
        container.dataset.mode = mode;
        header.querySelectorAll('.ce-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (mode !== 'cycle' && guided) setGuided(false);
        hint.textContent = mode === 'cycle'
            ? 'Touche une étiquette ou une partie du paysage pour l\'expliquer · ▶ Lecture pour animer'
            : 'Fais glisser le curseur ou le thermomètre · Touche un état sur le schéma pour y aller';
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
    function tempFromY(y) {
        const g = stGeo;
        return -30 + 160 * (g.tBot - y) / (g.tBot - g.tTop);
    }
    function onThermo(L) {
        const g = stGeo;
        return g && Math.abs(L.x - g.tx) < Math.max(40, g.tw * 2.5) && L.y > g.tTop - 20 && L.y < g.tBot + g.tw * 2.5;
    }

    canvas.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        if (drag) return;
        e.stopPropagation(); e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        const L = local(e);
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, thermo: mode === 'etats' && onThermo(L) };
        if (drag.thermo) setTemp(tempFromY(L.y));
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });
    // Curseur du dessin : doigt au-dessus d'un élément touchable
    let _cur = '';
    function setCursor(c) { if (c !== _cur) { _cur = c; canvas.style.setProperty('cursor', c, 'important'); } }
    function hoverCursor(e) {
        if (drag) { return; }
        const L = local(e), x = L.x, y = L.y;
        if (mode === 'etats') {
            const onBox = stGeo && stGeo.boxes.some(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
            setCursor(stGeo && (onBox || onThermo(L)) ? 'pointer' : 'default');
            return;
        }
        if (labelHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)) { setCursor('pointer'); return; }
        // Parties du paysage
        const nx = x / cssW, ny = y / cssH, m = Math.min(cssW, cssH);
        let hit = -1;
        let dRiver = Infinity;
        for (let i = 1; i < CE_RIVER.length; i++) {
            const a = CE_RIVER[i - 1], b = CE_RIVER[i];
            const ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
            const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
            const u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
            dRiver = Math.min(dRiver, Math.hypot(x - ax - u * vx, y - ay - u * vy));
        }
        const inCloud = (c, s) => Math.hypot((x - X(c[0])) / 1.8, y - Y(c[1])) < s;
        if (dRiver < Math.max(14, m * 0.03)) hit = 3;
        else if (inCloud(CE_CLOUD_A, m * 0.09)) hit = 1;
        else if (inCloud(CE_CLOUD_B, m * 0.11) || (nx > 0.6 && nx < 0.87 && ny > 0.12 && ny < _ceGroundY(nx) && ny < 0.45)) hit = 2;
        else if (nx > 0.40 && nx < 0.56 && ny > 0.52 && ny < _ceGroundY(nx) + 0.02) hit = 5;
        else if (nx > 0.30 && ny > CE_SOIL_Y && ny > _ceGroundY(Math.max(0.37, nx))) hit = 4;
        else if (nx < 0.36 && ny > 0.3) hit = 0;
        setCursor(hit >= 0 ? 'pointer' : 'default');
    }
    canvas.addEventListener('pointermove', hoverCursor);
    canvas.addEventListener('pointerup', hoverCursor);
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
        if (drag.thermo) setTemp(tempFromY(local(e).y));
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel') return;
        if (d.thermo) { if (typeof saveBoard === 'function') saveBoard(); return; }
        if (!d.moved) { const L = local(e); onTap(L.x, L.y); }
    }

    function onTap(x, y) {
        if (mode === 'etats') {
            if (!stGeo) return;
            for (const b of stGeo.boxes) {
                if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                    goToTemp(b.k === 'solide' ? -10 : b.k === 'liquide' ? 20 : 110);
                    if (typeof saveBoard === 'function') saveBoard();
                    return;
                }
            }
            return;
        }
        if (guided) setGuided(false);
        for (const h of labelHits) {
            if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                setStage(stage === h.i ? -1 : h.i);
                if (typeof saveBoard === 'function') saveBoard();
                return;
            }
        }
        // Parties du paysage
        const nx = x / cssW, ny = y / cssH, m = Math.min(cssW, cssH);
        let hit = -1;
        let dRiver = Infinity;
        for (let i = 1; i < CE_RIVER.length; i++) {
            const a = CE_RIVER[i - 1], b = CE_RIVER[i];
            const ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
            const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
            const u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
            dRiver = Math.min(dRiver, Math.hypot(x - ax - u * vx, y - ay - u * vy));
        }
        const inCloud = (c, s) => Math.hypot((x - X(c[0])) / 1.8, y - Y(c[1])) < s;
        if (dRiver < Math.max(14, m * 0.03)) hit = 3;
        else if (inCloud(CE_CLOUD_A, m * 0.09)) hit = 1;
        else if (inCloud(CE_CLOUD_B, m * 0.11) || (nx > 0.6 && nx < 0.87 && ny > 0.12 && ny < _ceGroundY(nx) && ny < 0.45)) hit = 2;
        else if (nx > 0.40 && nx < 0.56 && ny > 0.52 && ny < _ceGroundY(nx) + 0.02) hit = 5;
        else if (nx > 0.30 && ny > CE_SOIL_Y && ny > _ceGroundY(Math.max(0.37, nx))) hit = 4;
        else if (nx < 0.36 && ny > 0.3) hit = 0;
        setStage(hit === stage ? -1 : hit);
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
        const b = e.target.closest('button[data-stage]');
        if (!b) return;
        e.stopPropagation();
        if (guided) setGuided(false);
        setStage(Number(b.dataset.stage));
        if (typeof saveBoard === 'function') saveBoard();
    });

    header.querySelectorAll('.ce-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); saveBoard(); });
    guideBtn.addEventListener('click', () => setGuided(!guided));
    $('.ce-prev').addEventListener('click', () => { if (guided) setGuided(false); setStage(stage <= 0 ? CE_STAGES.length - 1 : stage - 1); saveBoard(); });
    $('.ce-next').addEventListener('click', () => { if (guided) setGuided(false); setStage(stage >= CE_STAGES.length - 1 ? 0 : stage + 1); saveBoard(); });
    $('.ce-all').addEventListener('click', () => { if (guided) setGuided(false); setStage(-1); saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); saveBoard(); });
    arrowsBtn.addEventListener('click', () => { showArrows = !showArrows; arrowsBtn.classList.toggle('on', showArrows); requestDraw(); saveBoard(); });
    molsBtn.addEventListener('click', () => { showMols = !showMols; molsBtn.classList.toggle('on', showMols); requestDraw(); saveBoard(); });
    row2.querySelectorAll('.ce-stage-btn').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        const i = Number(b.dataset.stage);
        setStage(stage === i ? -1 : i);
        saveBoard();
    }));
    heatSl.addEventListener('input', () => { heatPct = Number(heatSl.value); lastInfoKey = ''; requestDraw(); });
    heatSl.addEventListener('change', () => saveBoard());
    tempSl.addEventListener('input', () => setTemp(Number(tempSl.value)));
    tempSl.addEventListener('change', () => saveBoard());
    row2.querySelectorAll('.ce-preset').forEach(b => b.addEventListener('click', () => { goToTemp(Number(b.dataset.temp)); saveBoard(); }));

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
        if (playing) setPlaying(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '💧 Le cycle de l\'eau', {
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
        animId = null; playing = false; guided = false; tempAnim = null;
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
    prewarm();
    placeMolsFor(stateOf(temp));
    setMode('cycle');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._ceGetData = () => ({
        containerW: contW, containerH: contH,
        mode, stage, heat: heatPct, temp: Math.round(temp), lastChange,
        showLabels, showArrows, showMols, fast
    });
    widget._ceSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.heat === 'number') heatPct = Math.max(20, Math.min(100, Math.round(d.heat)));
        if (typeof d.temp === 'number') { temp = Math.max(-30, Math.min(130, d.temp)); placeMolsFor(stateOf(temp)); }
        if (typeof d.lastChange === 'string' && CE_CHANGES[d.lastChange]) lastChange = d.lastChange;
        if (typeof d.stage === 'number') stage = Math.max(-1, Math.min(CE_STAGES.length - 1, Math.round(d.stage)));
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showArrows === 'boolean') { showArrows = d.showArrows; arrowsBtn.classList.toggle('on', showArrows); }
        if (typeof d.showMols === 'boolean') { showMols = d.showMols; molsBtn.classList.toggle('on', showMols); }
        setFast(!!d.fast);
        prewarm();
        setMode(d.mode || 'cycle');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_ceSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
