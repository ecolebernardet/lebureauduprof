// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même aide que dans les autres leçons de sciences : définie une seule fois)
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
// WIDGET LES CHAÎNES ALIMENTAIRES — Le Bureau du Prof
// Trois onglets, pour des élèves de cycle 3 (CM1 – CM2 – 6e) :
//  🔗 La chaîne : quatre milieux (forêt, prairie, mare, océan). La chaîne
//     part du Soleil, passe par le producteur (un végétal), puis par les
//     consommateurs primaire, secondaire, tertiaire, et se termine par les
//     décomposeurs qui recyclent les restes en sels minéraux.
//     La flèche se lit « est mangé par ». ▶ Lecture fait voyager la
//     nourriture (et l'énergie) maillon par maillon. 🔢 Combien ? montre
//     qu'il faut beaucoup de proies pour nourrir un prédateur.
//  🧩 Construis : on remet dans l'ordre les êtres vivants d'une chaîne
//     (8 milieux), avec ou sans intrus, avec un bouton 💡 Indice.
//  🕸️ Le réseau : un réseau alimentaire de la forêt. On touche un être
//     vivant pour voir ce qu'il mange et qui le mange ; en mode
//     🚫 Faire disparaître, on supprime une espèce et l'on voit les
//     conséquences (espèces qui disparaissent, plus nombreuses, affamées).
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
    if (document.getElementById('ca-style')) return;
    const s = document.createElement('style');
    s.id = 'ca-style';
    s.textContent = `
        .widget[data-type="chaines-alimentaires"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .ca-container {
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
        .ca-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .ca-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .ca-header .wf-btns { gap: 8px; }
        .ca-header .wf-btn { width: 18px; height: 18px; }
        .ca-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ca-container.wf-fullboard {
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
        .ca-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .ca-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .ca-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .ca-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .ca-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .ca-btn:hover { background: #e0e0e0; }
        .ca-btn:active { transform: scale(0.96); }
        .ca-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .ca-btn-play { min-width: 112px; }
        .ca-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .ca-btn-kill.on { background: #d9342b; border-color: #d9342b; }
        .ca-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .ca-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .ca-mil-btn { padding: 5px 10px; border-left: 4px solid var(--st-c, #bbb); }
        .ca-mil-btn.on { background: var(--st-c, #3b8fd9); border-color: var(--st-c, #3b8fd9); color: #fff; }

        /* Corps */
        .ca-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .ca-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #eef6ea;
        }
        .ca-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .ca-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: #4b5563; pointer-events: none;
            text-shadow: 0 1px 0 rgba(255,255,255,.85);
        }
        .ca-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3f9e4d;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .ca-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #2f6f3a; }
        .ca-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .ca-change { background: #eaf6ec; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #24573a; font-weight: 700; }
        .ca-warn { background: #fdecea; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #8a2a20; font-weight: 700; }
        .ca-badge { display: inline-block; border-radius: 999px; padding: 1px 9px; font-size: .85em; font-weight: 800; color: #fff; margin: 0 0 6px; }
        .ca-text { margin: 0 0 6px; }
        .ca-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .ca-recap { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; }
        .ca-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .ca-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .ca-steps button.on { background: var(--st-c, #3b8fd9); color: #fff; }
        .ca-list { margin: 0 0 6px; padding-left: 18px; }
        .ca-list li { margin: 0 0 2px; }

        /* Aide */
        .ca-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .ca-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
            max-height: calc(100% - 70px); overflow-y: auto;
        }
        .ca-help-popup.show { display: block; }
        .ca-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .ca-help-popup p { margin: 0 0 6px; }

        .ca-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .ca-resize-handle:hover { opacity: 1; }
        .ca-container:not([data-mode="chaine"]) .ca-only-chaine { display: none !important; }
        .ca-container:not([data-mode="jeu"]) .ca-only-jeu { display: none !important; }
        .ca-container:not([data-mode="reseau"]) .ca-only-reseau { display: none !important; }
        .ca-container[data-mode="jeu"] .ca-hide-jeu { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .ca-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .ca-tab-short { display: none; }
        .ca-header { min-width: 0; max-width: 100%; }
        .ca-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .ca-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ca-header .wf-btns { flex-shrink: 0; }
        .ca-container.wf-fullboard .ca-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ca-container { padding: 10px 10px 8px; gap: 6px; }
            .ca-header { gap: 6px; }
            .ca-title { font-size: 13px; }
            .ca-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .ca-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .ca-row > * { flex-shrink: 0; }
            .ca-row + .ca-row { flex-wrap: wrap; overflow: visible; }
            .ca-row + .ca-row .ca-lbl:first-child { display: none; }
            .ca-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .ca-btn-play { min-width: 0; }
            .ca-sep { display: none; }
            .ca-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .ca-side { padding: 8px 10px; font-size: 13px; }
            .ca-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .ca-title { display: none; }
            .ca-tab { padding: 3px 7px; font-size: 11.5px; }
            .ca-tab-long { display: none; }
            .ca-tab-short { display: inline; }
            .ca-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .ca-body { flex-direction: column; }
            .ca-scene-wrap { flex: 1 1 0; min-height: 260px; }
            .ca-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 38%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .ca-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }

        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable */
        .widget[data-type="chaines-alimentaires"], .ca-container, .ca-container * { cursor: default !important; }
        .ca-container .ca-header, .ca-container .ca-header * { cursor: grab !important; }
        .ca-container .ca-header:active, .ca-container .ca-header:active * { cursor: grabbing !important; }
        .ca-container button, .ca-container button *, .ca-container .ca-header button,
        .ca-container .ca-header button * { cursor: pointer !important; }
        .ca-container button:disabled, .ca-container button:disabled *,
        .ca-container .ca-canvas { cursor: default !important; }
        .ca-container .ca-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les autres leçons ── */
        .ca-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ca-title {
            font-size: 21px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ca-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .ca-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .ca-help-popup { top: 56px; }
        .ca-container.wf-fullboard .ca-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ca-container.wf-fullboard .ca-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .ca-title { font-size: 17px; }
        }
        .ca-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .ca-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 13px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .ca-tab:hover { background: rgba(255,255,255,.1); }
        .ca-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .ca-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .ca-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .ca-container.wf-fullboard .ca-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .ca-tab { padding: 3px 10px; font-size: 12px; }
            .ca-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .ca-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
const CA_EMO = "'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif";

// Rôles (place dans la chaîne)
const CA_ROLES = [
    { key: 'prod', name: 'Producteur', color: '#3f9e4d', diet: 'végétal',
      text: `Les <b>végétaux</b> sont des <b>producteurs</b> : ils fabriquent leur propre matière (leur nourriture) avec la <b>lumière</b> du Soleil, l'<b>eau</b>, les <b>sels minéraux</b> du sol et le <b>gaz carbonique</b> de l'air. Ils ne mangent aucun autre être vivant. Ils sont toujours le <b>premier maillon</b> d'une chaîne alimentaire.` },
    { key: 'c1', name: 'Consommateur primaire', color: '#e8a317', diet: 'herbivore',
      text: `Un animal qui mange des végétaux est un <b>herbivore</b> (ou végétarien). Dans la chaîne, c'est un <b>consommateur primaire</b> (de 1<sup>er</sup> ordre) : il ne fabrique pas sa nourriture, il la prend aux plantes.` },
    { key: 'c2', name: 'Consommateur secondaire', color: '#e8743a', diet: 'carnivore',
      text: `Un animal qui mange des herbivores est un <b>carnivore</b>. C'est un <b>consommateur secondaire</b> (de 2<sup>e</sup> ordre). On dit que c'est un <b>prédateur</b>, et que l'herbivore est sa <b>proie</b>.` },
    { key: 'c3', name: 'Consommateur tertiaire', color: '#d9342b', diet: 'carnivore',
      text: `Un carnivore qui mange d'autres carnivores est un <b>consommateur tertiaire</b> (de 3<sup>e</sup> ordre). Plus on avance dans la chaîne, plus les animaux sont en général grands et peu nombreux.` },
    { key: 'c4', name: 'Consommateur de 4e ordre', color: '#9b2c6f', diet: 'carnivore',
      text: `Ce carnivore mange des consommateurs tertiaires : c'est un <b>consommateur de 4<sup>e</sup> ordre</b>. Les chaînes ont rarement plus de 5 maillons.` }
];
const CA_TOP = `Le dernier maillon n'est mangé par aucun autre animal de la chaîne : c'est un <b>super-prédateur</b>. Mais quand il meurt, son corps est, lui aussi, recyclé par les décomposeurs.`;

// Êtres vivants
const CA_B = {
    chene:     { ico: '🍃', name: 'Les feuilles de chêne', text: `Le chêne fabrique ses feuilles grâce à la lumière. Au printemps, ses jeunes feuilles tendres sont dévorées par des milliers de chenilles.` },
    chenille:  { ico: '🐛', name: 'La chenille', text: `La chenille mange les feuilles. Plus tard, elle se transformera en papillon.` },
    mesange:   { ico: '🐦', name: 'La mésange', text: `La mésange mange des chenilles et des petits insectes. Pour nourrir ses petits, un couple de mésanges attrape plus de 10 000 chenilles au printemps !` },
    epervier:  { ico: '🦅', name: "L'épervier", text: `L'épervier est un rapace : il chasse les petits oiseaux en vol, en surgissant par surprise.` },
    ble:       { ico: '🌾', name: 'Les graines de blé', text: `Les épis de blé produisent des graines riches en réserves : une bonne nourriture pour beaucoup d'animaux.` },
    mulot:     { ico: '🐭', name: 'Le mulot', text: `Le mulot est un petit rongeur. Il mange des graines, des glands et des fruits.` },
    couleuvre: { ico: '🐍', name: 'La couleuvre', text: `La couleuvre est un serpent sans venin. Elle avale ses proies entières : mulots, grenouilles…` },
    buse:      { ico: '🦅', name: 'La buse', text: `La buse est un rapace. Perchée sur un piquet, elle guette les rongeurs et les serpents.` },
    algues:    { ico: '🌿', name: 'Les algues', text: `Les algues sont des végétaux qui vivent dans l'eau. Comme les autres plantes, elles ont besoin de lumière.` },
    larve:     { ico: '🦟', name: 'La larve de moustique', text: `Avant de devenir un moustique, la larve vit dans l'eau de la mare et se nourrit d'algues minuscules.` },
    epinoche:  { ico: '🐟', name: "L'épinoche", text: `L'épinoche est un petit poisson des mares et des ruisseaux. Elle mange des larves d'insectes.` },
    martin:    { ico: '🐦', name: 'Le martin-pêcheur', text: `Le martin-pêcheur plonge depuis une branche, attrape un petit poisson avec son bec et l'avale tête la première.` },
    phyto:     { ico: '🦠', name: 'Le phytoplancton', text: `Le phytoplancton, ce sont des algues minuscules qui flottent dans la mer. Elles sont invisibles à l'œil nu, mais il y en a des milliards !` },
    krill:     { ico: '🦐', name: 'Le krill', text: `Le krill, ce sont de petites crevettes qui filtrent l'eau pour manger le phytoplancton.` },
    sardine:   { ico: '🐟', name: 'La sardine', text: `Les sardines vivent en bancs de milliers de poissons et mangent du krill et du plancton.` },
    dauphin:   { ico: '🐬', name: 'Le dauphin', text: `Le dauphin est un mammifère marin. Il chasse les poissons en groupe.` },
    salade:    { ico: '🥬', name: 'La salade', text: `Dans le potager, la salade pousse grâce à la lumière, à l'eau et aux sels minéraux du sol.` },
    limace:    { ico: '🐌', name: 'La limace', text: `La nuit, les limaces sortent et grignotent les feuilles tendres du potager.` },
    herisson:  { ico: '🦔', name: 'Le hérisson', text: `Le hérisson est l'ami du jardinier : il mange les limaces, les escargots et les insectes.` },
    hibou:     { ico: '🦉', name: 'Le grand-duc', text: `Le grand-duc est le plus grand des hiboux d'Europe. La nuit, il chasse même les hérissons !` },
    herbe:     { ico: '🌱', name: "L'herbe", text: `Dans la savane, l'herbe pousse vite pendant la saison des pluies.` },
    zebre:     { ico: '🦓', name: 'Le zèbre', text: `Le zèbre est un herbivore : il passe une grande partie de la journée à brouter l'herbe.` },
    lion:      { ico: '🦁', name: 'Le lion', text: `Le lion est un super-prédateur : les lionnes chassent en groupe les zèbres et les gazelles.` },
    rosier:    { ico: '🌹', name: 'Le rosier', text: `Les jeunes pousses du rosier sont pleines de sève sucrée.` },
    puceron:   { ico: '', custom: 'puceron', name: 'Le puceron', text: `Le puceron est un tout petit insecte vert qui pique les tiges pour boire la sève des plantes.` },
    coccinelle:{ ico: '🐞', name: 'La coccinelle', text: `La coccinelle mange des pucerons : une seule coccinelle peut en dévorer plus de 50 par jour !` },
    morue:     { ico: '🐟', name: 'La morue', text: `La morue est un poisson des mers froides. Elle mange du krill et de petits poissons.` },
    phoque:    { ico: '🦭', name: 'Le phoque', text: `Le phoque est un excellent nageur : il plonge pour attraper des poissons.` },
    ours:      { ico: '🐻‍❄️', name: "L'ours blanc", text: `L'ours blanc vit sur la banquise. Il guette les phoques près des trous dans la glace.` }
};

// Les quatre milieux de l'onglet « La chaîne »
const CA_MILIEUX = [
    { id: 'foret',   ico: '🌳', name: 'La forêt',   color: '#3f8f3a', bg: ['#eaf6e4', '#cfe7c3'], chain: ['chene', 'chenille', 'mesange', 'epervier'] },
    { id: 'prairie', ico: '🌾', name: 'La prairie', color: '#b58a12', bg: ['#fbf7df', '#e6efc6'], chain: ['ble', 'mulot', 'couleuvre', 'buse'] },
    { id: 'mare',    ico: '🐸', name: 'La mare',    color: '#1f8a8a', bg: ['#e4f3f6', '#c8e6dc'], chain: ['algues', 'larve', 'epinoche', 'martin'] },
    { id: 'ocean',   ico: '🌊', name: "L'océan",    color: '#1d6fb8', bg: ['#e1f1fb', '#b8dbf1'], chain: ['phyto', 'krill', 'sardine', 'dauphin'] }
];
// Les chaînes de l'onglet « Construis » (avec leurs intrus possibles)
const CA_JEU = [
    { ico: '🌳', name: 'la forêt',   chain: ['chene', 'chenille', 'mesange', 'epervier'], intrus: ['dauphin', 'lion', 'phoque'] },
    { ico: '🌾', name: 'la prairie', chain: ['ble', 'mulot', 'couleuvre', 'buse'],        intrus: ['dauphin', 'krill', 'ours'] },
    { ico: '🐸', name: 'la mare',    chain: ['algues', 'larve', 'epinoche', 'martin'],    intrus: ['lion', 'zebre', 'ours'] },
    { ico: '🌊', name: "l'océan",    chain: ['phyto', 'krill', 'sardine', 'dauphin'],     intrus: ['lion', 'herisson', 'zebre'] },
    { ico: '🥕', name: 'le potager', chain: ['salade', 'limace', 'herisson', 'hibou'],    intrus: ['dauphin', 'krill', 'phoque'] },
    { ico: '🦒', name: 'la savane',  chain: ['herbe', 'zebre', 'lion'],                   intrus: ['dauphin', 'phoque', 'krill'] },
    { ico: '🌹', name: 'le jardin',  chain: ['rosier', 'puceron', 'coccinelle', 'mesange'], intrus: ['dauphin', 'lion', 'ours'] },
    { ico: '🧊', name: 'la banquise', chain: ['phyto', 'krill', 'morue', 'phoque', 'ours'], intrus: ['lion', 'herisson', 'zebre'] }
];
// Nombre d'individus (pour « 🔢 Combien ? »)
const CA_COUNTS = { 3: [30, 6, 1], 4: [40, 12, 3, 1], 5: [40, 16, 6, 2, 1] };
const CA_SUN = {
    text: `Toute chaîne alimentaire commence grâce au <b>Soleil</b>. Les végétaux captent l'<b>énergie de sa lumière</b> pour fabriquer leur matière. Ensuite, cette énergie passe d'un être vivant à l'autre, avec la nourriture.`,
    know: `La nuit, ou dans une grotte totalement noire, aucune plante ne peut pousser. Sans le Soleil, il n'y aurait presque aucune vie sur Terre.`
};
const CA_DECO = {
    text: `Les <b>décomposeurs</b> (champignons, vers de terre, cloportes, bactéries…) se nourrissent des <b>restes</b> des êtres vivants : feuilles mortes, cadavres, excréments. Ils les transforment en <b>sels minéraux</b>, que les racines des plantes absorbent. La matière est ainsi <b>recyclée</b> : rien ne se perd !`,
    know: `Dans une forêt, sans les décomposeurs, les feuilles mortes s'entasseraient chaque automne… et le sol serait bientôt enseveli ! Le compost du jardin fonctionne grâce à eux.`
};
const CA_OVERVIEW = {
    text: `Une <b>chaîne alimentaire</b> montre <b>qui mange qui</b> dans un milieu. Chaque être vivant est un <b>maillon</b> de la chaîne. Elle commence toujours par un <b>végétal</b> (le producteur), suivi d'animaux qui sont des <b>consommateurs</b>.`,
    arrow: `La flèche <b>→</b> se lit « <b>est mangé par</b> ». Elle montre le chemin de la nourriture (et de l'énergie) : <i>la feuille → la chenille</i> veut dire « la feuille est mangée par la chenille ».`,
    know: `Il faut beaucoup de proies pour nourrir un seul prédateur : plus on avance dans la chaîne, moins il y a d'individus. Active 🔢 Combien ? pour le voir.`
};

// Réseau alimentaire de la forêt
const CA_WEB = [
    { id: 'chene',     ico: '🌳', name: 'Le chêne',            diet: 'Végétal',   x: 0.25, y: 0.85, text: `Ses feuilles et ses glands nourrissent beaucoup d'animaux de la forêt.` },
    { id: 'herbe',     ico: '🌱', name: 'Les herbes',          diet: 'Végétal',   x: 0.72, y: 0.85, text: `Les herbes de la clairière et leurs graines sont mangées par les petits herbivores.` },
    { id: 'chenille',  ico: '🐛', name: 'La chenille',         diet: 'Herbivore', x: 0.10, y: 0.62, text: `Elle mange les feuilles du chêne.` },
    { id: 'ecureuil',  ico: '🐿️', name: "L'écureuil",          diet: 'Herbivore', x: 0.32, y: 0.62, text: `Il mange des glands, des noisettes et des graines. Il en cache pour l'hiver !` },
    { id: 'mulot',     ico: '🐭', name: 'Le mulot',            diet: 'Herbivore', x: 0.58, y: 0.62, text: `Il mange des glands et des graines. Beaucoup de prédateurs le chassent.` },
    { id: 'lapin',     ico: '🐰', name: 'Le lapin',            diet: 'Herbivore', x: 0.86, y: 0.62, text: `Il broute l'herbe à l'aube et au crépuscule.` },
    { id: 'mesange',   ico: '🐦', name: 'La mésange',          diet: 'Carnivore', x: 0.10, y: 0.40, text: `Au printemps, elle mange surtout des chenilles et des insectes.` },
    { id: 'couleuvre', ico: '🐍', name: 'La couleuvre',        diet: 'Carnivore', x: 0.44, y: 0.40, text: `Elle chasse les petits rongeurs comme le mulot.` },
    { id: 'epervier',  ico: '🦅', name: "L'épervier",          diet: 'Carnivore', x: 0.10, y: 0.17, text: `Ce rapace chasse les petits oiseaux.` },
    { id: 'renard',    ico: '🦊', name: 'Le renard',           diet: 'Carnivore', x: 0.86, y: 0.17, text: `Il chasse les lapins, les mulots et parfois les écureuils.` },
    { id: 'buse',      ico: '🦅', name: 'La buse',             diet: 'Carnivore', x: 0.50, y: 0.17, text: `Ce rapace mange des serpents et des lapins.` }
];
// Liens « proie → prédateur » (la proie est mangée par le prédateur)
const CA_EDGES = [
    ['chene', 'chenille'], ['chene', 'ecureuil'], ['chene', 'mulot'], ['herbe', 'mulot'], ['herbe', 'lapin'],
    ['chenille', 'mesange'], ['mesange', 'epervier'], ['ecureuil', 'renard'], ['mulot', 'renard'],
    ['mulot', 'couleuvre'], ['lapin', 'renard'], ['couleuvre', 'buse'], ['lapin', 'buse']
];
const CA_DIET_COLOR = { 'Végétal': '#3f9e4d', 'Herbivore': '#e8a317', 'Carnivore': '#d9342b' };
const CA_WEB_OVERVIEW = {
    text: `Dans la nature, un animal mange souvent <b>plusieurs sortes</b> d'aliments, et il peut être mangé par <b>plusieurs prédateurs</b>. Les chaînes alimentaires s'entrecroisent : ensemble, elles forment un <b>réseau alimentaire</b>.`,
    know: `Tous les êtres vivants d'un milieu dépendent les uns des autres : c'est l'<b>équilibre</b> du milieu. Si une espèce disparaît, d'autres en subissent les conséquences.`
};

// ── Petites fonctions utiles ──────────────────────────────────────────────
function _caClamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
function _caEase(t) { t = _caClamp(t); return t * t * (3 - 2 * t); }
function _caLerp(a, b, t) { return a + (b - a) * t; }
function _caLow(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function _caShuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function _caRole(i) { return CA_ROLES[Math.min(i, CA_ROLES.length - 1)]; }
function _caListFr(arr) {
    if (!arr.length) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' et ' + arr[arr.length - 1];
}

// ── Création du widget ────────────────────────────────────────────────────
function createChainesAlimentairesWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'chaines-alimentaires';
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
    container.className = 'ca-container';
    container.dataset.mode = 'chaine';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'ca-header';
    header.innerHTML = `
        <span class="ca-title">🔗<span> Les chaînes alimentaires</span></span>
        <div class="ca-tabs">
            <button class="ca-tab on" data-mode="chaine" title="Une chaîne alimentaire"><span class="ca-tab-long">🔗 La chaîne</span><span class="ca-tab-short">🔗 Chaîne</span></button>
            <button class="ca-tab" data-mode="jeu" title="Construis une chaîne alimentaire"><span class="ca-tab-long">🧩 Construis</span><span class="ca-tab-short">🧩 Jeu</span></button>
            <button class="ca-tab" data-mode="reseau" title="Un réseau alimentaire"><span class="ca-tab-long">🕸️ Le réseau</span><span class="ca-tab-short">🕸️ Réseau</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'ca-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres leçons)
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.ca-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : commandes
    const row1 = document.createElement('div');
    row1.className = 'ca-row';
    row1.innerHTML = `
        <button class="ca-btn ca-btn-play ca-only-chaine" title="Suivre la nourriture maillon par maillon">▶ Lecture</button>
        <button class="ca-btn ca-btn-speed ca-only-chaine" title="Vitesse de l'animation">🐢 Lent</button>
        <button class="ca-btn ca-prev ca-only-chaine" title="Maillon précédent">◀ Maillon</button>
        <button class="ca-btn ca-next ca-only-chaine" title="Maillon suivant">Maillon ▶</button>
        <button class="ca-btn ca-all ca-only-chaine" title="Voir toute la chaîne">🔄 Vue d'ensemble</button>
        <span class="ca-sep ca-only-chaine"></span>
        <button class="ca-btn ca-count ca-only-chaine" title="Combien d'individus à chaque maillon ?">🔢 Combien ?</button>
        <button class="ca-btn ca-new ca-only-jeu" title="Une autre chaîne à construire">🔀 Nouvelle chaîne</button>
        <button class="ca-btn ca-hintbtn ca-only-jeu" title="Placer le maillon suivant">💡 Indice</button>
        <button class="ca-btn ca-reset ca-only-jeu" title="Retirer tous les maillons">↩️ Recommencer</button>
        <span class="ca-sep ca-only-jeu"></span>
        <button class="ca-btn ca-intrus ca-only-jeu" title="Ajouter un être vivant qui ne fait pas partie de ce milieu">🧐 Avec un intrus</button>
        <button class="ca-btn ca-btn-kill ca-only-reseau" title="Touche un être vivant pour le faire disparaître">🚫 Faire disparaître</button>
        <button class="ca-btn ca-restore ca-only-reseau" title="Remettre tous les êtres vivants">♻️ Tout remettre</button>
        <span class="ca-sep ca-hide-jeu"></span>
        <button class="ca-btn ca-labels ca-hide-jeu on" title="Afficher les noms et les rôles">🏷️ Étiquettes</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : milieux (onglet « La chaîne »)
    const row2 = document.createElement('div');
    row2.className = 'ca-row ca-only-chaine';
    row2.innerHTML = `
        <span class="ca-lbl">Milieu :</span>
        ${CA_MILIEUX.map((m, i) => `<button class="ca-btn ca-mil-btn" data-mil="${i}" style="--st-c:${m.color}" title="${m.name}">${m.ico} ${m.name}</button>`).join('')}
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'ca-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'ca-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'ca-canvas';
    const hint = document.createElement('div');
    hint.className = 'ca-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'ca-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ca-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les chaînes alimentaires</h4>
        <p><b>🔗 La chaîne</b> : choisis un <b>milieu</b>. <b>▶ Lecture</b> fait voyager la nourriture du Soleil jusqu'aux décomposeurs.
        <b>◀ Maillon ▶</b>, ou <b>toucher un être vivant</b>, l'explique dans la fiche. <b>🔢 Combien ?</b> montre le nombre d'individus à chaque maillon.</p>
        <p><b>🧩 Construis</b> : touche les êtres vivants de la réserve <b>dans l'ordre</b>, en commençant par le végétal.
        Touche un maillon placé pour le retirer. <b>💡 Indice</b> place le maillon suivant. <b>🧐 Avec un intrus</b> ajoute un être vivant qui ne vit pas dans ce milieu.</p>
        <p><b>🕸️ Le réseau</b> : touche un être vivant pour voir <span style="color:#2e7d32;font-weight:800">ce qu'il mange</span>
        et <span style="color:#d9342b;font-weight:800">qui le mange</span>. Avec <b>🚫 Faire disparaître</b>, touche une espèce pour la supprimer et observe les conséquences.</p>
        <p>La flèche → se lit toujours « <b>est mangé par</b> ».</p>
        <p style="color:#888">Schémas simplifiés : dans la nature, les animaux mangent souvent plus d'aliments que ceux qui sont montrés ici.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ca-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const playBtn = $('.ca-btn-play'), speedBtn = $('.ca-btn-speed');
    const labelsBtn = $('.ca-labels'), countBtn = $('.ca-count');
    const intrusBtn = $('.ca-intrus'), killBtn = $('.ca-btn-kill');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'chaine';
    let milieu = 0;
    let sel = -1;                   // -1 vue d'ensemble · 0 Soleil · 1..n êtres vivants · n+1 décomposeurs
    let showLabels = true, showCount = false;
    let playing = false, fast = false, stepT = 0;
    // jeu
    let jIdx = 0, jIntrus = false, jIntrusId = null, jPool = [], jSlots = [], jWins = 0, jWonNow = false;
    // réseau
    let wSel = null, killMode = false, removed = [];
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let hits = [];

    const chainIds = () => CA_MILIEUX[milieu].chain;
    const nLinks = () => chainIds().length;

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        w = Math.max(1, w); h = Math.max(1, h);
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else ctx.rect(x, y, w, h);
    }
    function font(fs, w) { ctx.font = `${w || 800} ${fs}px 'Segoe UI', system-ui, sans-serif`; }
    // Texte sur 1 ou 2 lignes, réduit pour tenir dans maxW
    function fitLines(text, maxW, fs, minFs, weight) {
        font(fs, weight);
        if (ctx.measureText(text).width <= maxW) return { lines: [text], fs };
        let f = fs;
        while (f > minFs * 1.2) { f -= 0.5; font(f, weight); if (ctx.measureText(text).width <= maxW) return { lines: [text], fs: f }; }
        const words = text.split(' ');
        if (words.length < 2) {
            f = fs; font(f, weight);
            while (f > minFs && ctx.measureText(text).width > maxW) { f -= 0.5; font(f, weight); }
            return { lines: [text], fs: f };
        }
        let best = null;
        font(fs, weight);
        for (let k = 1; k < words.length; k++) {
            const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
            const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
            if (!best || w < best.w) best = { a, b, w };
        }
        f = fs;
        while (f > minFs && best.w * f / fs > maxW) f -= 0.5;
        return { lines: [best.a, best.b], fs: f };
    }
    function drawLines(L, x, y, col, weight, align) {
        font(L.fs, weight);
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = col;
        L.lines.forEach((t, i) => ctx.fillText(t, x, y + i * L.fs * 1.15));
        return L.lines.length * L.fs * 1.15;
    }
    function tinyText(text, x, y, col, fs, align) {
        ctx.save();
        font(fs);
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = col; ctx.fillText(text, x, y);
        ctx.restore();
    }
    function pill(text, cx, cy, fs, bg, col) {
        font(fs);
        const w = ctx.measureText(text).width + fs * 1.1, h = fs * 1.55;
        ctx.fillStyle = bg; roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
        ctx.fillStyle = col || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy + 0.5);
        return { w, h };
    }
    function drawPuceron(x, y, s) {
        ctx.save();
        ctx.strokeStyle = '#2f6b1f'; ctx.lineWidth = Math.max(1, s * 0.05); ctx.lineCap = 'round';
        for (const k of [-0.25, 0, 0.25]) for (const sd of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(x + k * s, y + s * 0.05); ctx.lineTo(x + k * s + sd * s * 0.12, y + s * 0.38); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(x + s * 0.35, y - s * 0.15); ctx.quadraticCurveTo(x + s * 0.55, y - s * 0.55, x + s * 0.7, y - s * 0.45); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * 0.32, y - s * 0.12); ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.6, x + s * 0.5, y - s * 0.62); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - s * 0.05, y, s * 0.42, s * 0.28, -0.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#7cc242'; ctx.fill(); ctx.strokeStyle = '#3f7a22'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + s * 0.32, y - s * 0.08, s * 0.14, 0, 2 * Math.PI); ctx.fillStyle = '#6aae35'; ctx.fill();
        ctx.beginPath(); ctx.arc(x + s * 0.38, y - s * 0.12, s * 0.04, 0, 2 * Math.PI); ctx.fillStyle = '#222'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - s * 0.15, y - s * 0.1, s * 0.15, s * 0.07, -0.2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
        ctx.restore();
    }
    function drawIco(b, x, y, size) {
        if (b.custom === 'puceron') { drawPuceron(x, y, size * 0.95); return; }
        ctx.font = `${size}px ${CA_EMO}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(b.ico, x, y + size * 0.06);
    }
    function drawSunIco(x, y, rs) {
        ctx.save();
        ctx.strokeStyle = '#f5b324'; ctx.lineWidth = Math.max(2, rs * 0.12); ctx.lineCap = 'round';
        const rot = simTime * 0.3;
        for (let i = 0; i < 10; i++) {
            const a = rot + i * Math.PI / 5;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * rs * 1.2, y + Math.sin(a) * rs * 1.2);
            ctx.lineTo(x + Math.cos(a) * rs * 1.6, y + Math.sin(a) * rs * 1.6);
            ctx.stroke();
        }
        const g = ctx.createRadialGradient(x - rs * 0.3, y - rs * 0.3, rs * 0.1, x, y, rs);
        g.addColorStop(0, '#fff6c8'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#f5a623');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rs, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
    }
    function arrow(x1, y1, x2, y2, col, w, dash) {
        ctx.save();
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        const a = Math.atan2(y2 - y1, x2 - x1), h = Math.max(7, w * 3.2);
        const ex = x2 - Math.cos(a) * h * 0.7, ey = y2 - Math.sin(a) * h * 0.7;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - Math.cos(a) * h + Math.cos(a + Math.PI / 2) * h * 0.55, y2 - Math.sin(a) * h + Math.sin(a + Math.PI / 2) * h * 0.55);
        ctx.lineTo(x2 - Math.cos(a) * h - Math.cos(a + Math.PI / 2) * h * 0.55, y2 - Math.sin(a) * h - Math.sin(a + Math.PI / 2) * h * 0.55);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    function glowDot(x, y, r, col) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
        g.addColorStop(0, col); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, 2 * Math.PI); ctx.fill();
    }
    // Disque d'un être vivant
    function disc(x, y, r, ring, on, dim) {
        ctx.save();
        ctx.globalAlpha = dim ? 0.35 : 1;
        if (on) { ctx.shadowColor = ring; ctx.shadowBlur = 18 + (playing ? 6 * Math.sin(simTime * 6) : 0); }
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        ctx.lineWidth = on ? Math.max(4, r * 0.11) : Math.max(2.5, r * 0.07);
        ctx.strokeStyle = ring; ctx.stroke();
        ctx.restore();
    }
    // Petits individus (🔢 Combien ?)
    function crowd(b, k, x0, y0, w, h, isSun) {
        if (k <= 0 || w < 10 || h < 8) return;
        let d = 14, cols, rows;
        for (; d >= 3; d -= 0.5) {
            cols = Math.max(1, Math.floor(w / (d * 2.3)));
            rows = Math.ceil(k / cols);
            if (rows * d * 2.3 <= h) break;
        }
        cols = Math.min(cols, k);
        const gw = cols * d * 2.3;
        for (let i = 0; i < k; i++) {
            const cx = x0 + (w - gw) / 2 + (i % cols + 0.5) * d * 2.3;
            const cy = y0 + (Math.floor(i / cols) + 0.5) * d * 2.3;
            if (isSun) continue;
            drawIco(b, cx, cy, d * 1.9);
        }
    }

    // ═══════════════════════════ 🔗 LA CHAÎNE ═══════════════════════════
    function chainLayout() {
        const n = nLinks(), items = n + 1;
        const portrait = cssW / cssH < 0.95;
        const top = 46, bot = 26;
        if (!portrait) {
            const bandH = Math.max(46, Math.min(cssH * 0.17, 96));
            const band = { x: 14, y: cssH - bot - bandH, w: cssW - 28, h: bandH };
            const sp = cssW / items;
            const zone = band.y - top;
            const r = Math.max(18, Math.min(sp * 0.33, zone * 0.2, 76));
            const content = 2 * r + 90;
            const cy = showCount ? top + r + Math.max(6, zone * 0.04) : top + r + Math.max(6, (zone - content) * 0.42);
            return { portrait, band, r, pts: Array.from({ length: items }, (_, i) => ({ x: sp * (i + 0.5), y: cy })) };
        }
        const bandW = Math.max(56, Math.min(cssW * 0.2, 110));
        const band = { x: cssW - bandW - 8, y: top, w: bandW, h: cssH - top - bot };
        const sp = (cssH - top - bot) / items;
        const r = Math.max(16, Math.min(sp * 0.34, band.x * 0.15, 60));
        const cx = 10 + r * 1.15;
        return { portrait, band, r, pts: Array.from({ length: items }, (_, i) => ({ x: cx, y: top + sp * (i + 0.5) })) };
    }
    function drawChaineScene() {
        const M = CA_MILIEUX[milieu], ids = chainIds(), n = ids.length;
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, M.bg[0]); bg.addColorStop(1, M.bg[1]);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const L = chainLayout(), P = L.pts, r = L.r, m = Math.min(cssW, cssH);
        const fsN = Math.max(10, Math.min(16, r * 0.3));
        const fsB = Math.max(9, Math.min(13, r * 0.24));
        const isDeco = sel === n + 1;
        const ov = sel < 0;

        // Bandeau du milieu
        const fsT = Math.max(12, Math.min(18, m / 28));
        font(fsT, 900);
        const ban = `${M.ico} ${M.name}`;
        const bw = ctx.measureText(ban).width + 24;
        ctx.fillStyle = 'rgba(255,255,255,0.93)'; roundRect(10, 8, bw, fsT * 1.9, 10); ctx.fill();
        ctx.strokeStyle = M.color; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(ban, 22, 8 + fsT * 0.97);
        if (!L.portrait && showLabels) {
            const t = '→ se lit « est mangé par »';
            font(Math.max(10, fsT * 0.75), 800);
            const tw = ctx.measureText(t).width + 18;
            if (bw + tw + 30 < cssW) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; roundRect(cssW - tw - 10, 10, tw, fsT * 1.6, 9); ctx.fill();
                ctx.fillStyle = '#475569'; ctx.textAlign = 'center';
                ctx.fillText(t, cssW - tw / 2 - 10, 10 + fsT * 0.82);
            }
        }

        // Décomposeurs
        const B = L.band;
        ctx.save();
        if (isDeco) { ctx.shadowColor = '#8d6e63'; ctx.shadowBlur = 16; }
        ctx.fillStyle = isDeco ? '#f3e6d8' : 'rgba(243,230,216,0.85)';
        roundRect(B.x, B.y, B.w, B.h, 12); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = isDeco ? 3.5 : 2;
        roundRect(B.x, B.y, B.w, B.h, 12); ctx.stroke();
        const decoIcos = [{ ico: '🍄' }, { ico: '🪱' }, { ico: '🦠' }];
        if (!L.portrait) {
            const es = Math.min(B.h * 0.5, 40);
            const t = 'Les décomposeurs : champignons, vers de terre, bactéries';
            const tl = fitLines(t, B.w - es * 4.2 - 30, Math.max(10, Math.min(15, B.h * 0.2)), 8);
            decoIcos.forEach((d, i) => drawIco(d, B.x + 18 + es * 0.6 + i * es * 1.25, B.y + B.h / 2, es));
            const tx = B.x + 18 + es * 3.9 + 10;
            drawLines(tl, tx, B.y + B.h / 2 - (tl.lines.length - 1) * tl.fs * 0.57, '#5d4037', 800, 'left');
            hits.push({ test: (x, y) => x >= B.x && x <= B.x + B.w && y >= B.y && y <= B.y + B.h, act: () => selectLink(n + 1) });
        } else {
            const es = Math.min(B.w * 0.45, 36);
            decoIcos.forEach((d, i) => drawIco(d, B.x + B.w / 2, B.y + 16 + es * 0.6 + i * es * 1.25, es));
            const tl = fitLines('Les décomposeurs', B.w - 8, 12, 8);
            drawLines(tl, B.x + B.w / 2, B.y + 22 + es * 3.9, '#5d4037', 800);
            hits.push({ test: (x, y) => x >= B.x && x <= B.x + B.w && y >= B.y && y <= B.y + B.h, act: () => selectLink(n + 1) });
        }

        // Flèches entre maillons
        for (let i = 0; i < n; i++) {
            const a = P[i], b = P[i + 1];
            const ang = Math.atan2(b.y - a.y, b.x - a.x);
            const x1 = a.x + Math.cos(ang) * (r + 6), y1 = a.y + Math.sin(ang) * (r + 6);
            const x2 = b.x - Math.cos(ang) * (r + 6), y2 = b.y - Math.sin(ang) * (r + 6);
            const active = sel === i + 1;
            const col = i === 0 ? '#f0a500' : (active ? '#1f2937' : '#475569');
            const dimA = !ov && !isDeco && !active && sel !== i;
            ctx.globalAlpha = dimA ? 0.45 : 1;
            arrow(x1, y1, x2, y2, col, Math.max(3, r * (active ? 0.11 : 0.08)), i === 0 ? [8, 6] : null);
            ctx.globalAlpha = 1;
            if (showLabels) {
                const gap = Math.hypot(x2 - x1, y2 - y1);
                const lab = i === 0 ? 'lumière' : 'est mangé par';
                let fs = Math.max(8, Math.min(13, r * 0.23));
                font(fs);
                if (L.portrait) tinyText(lab, (x1 + x2) / 2 + r * 0.25, (y1 + y2) / 2, i === 0 ? '#a06a00' : '#334155', fs, 'left');
                else {
                    const room = gap + r * 1.3;
                    while (fs > 8 && ctx.measureText(lab).width > room) { fs -= 0.5; font(fs); }
                    if (ctx.measureText(lab).width <= room) tinyText(lab, (x1 + x2) / 2, a.y - r * 0.95, i === 0 ? '#a06a00' : '#334155', fs);
                }
            }
        }

        // Nourriture qui voyage
        if (playing && sel >= 1 && sel <= n && stepT < 0.5) {
            const a = P[sel - 1], b = P[sel], t = _caEase(stepT / 0.5);
            glowDot(_caLerp(a.x, b.x, t), _caLerp(a.y, b.y, t), Math.max(5, r * 0.13), sel === 1 ? 'rgba(255,200,40,0.95)' : 'rgba(255,140,40,0.95)');
        }

        // Maillons
        const counts = CA_COUNTS[n] || [];
        const labBot = [];
        P.forEach((p, i) => {
            const on = sel === i;
            const dimI = !ov && !on && !isDeco && !(playing && i === sel - 1 && stepT < 0.5);
            if (i === 0) {
                disc(p.x, p.y, r, '#f5a623', on, dimI);
                ctx.globalAlpha = dimI ? 0.45 : 1;
                drawSunIco(p.x, p.y, r * 0.45);
                ctx.globalAlpha = 1;
            } else {
                const b = CA_B[ids[i - 1]], role = _caRole(i - 1, n);
                disc(p.x, p.y, r, role.color, on, dimI);
                ctx.globalAlpha = dimI ? 0.45 : 1;
                drawIco(b, p.x, p.y, r * 1.05);
                ctx.globalAlpha = 1;
            }
            const name = i === 0 ? 'Le Soleil' : CA_B[ids[i - 1]].name;
            const role = i === 0 ? { name: 'Source d\'énergie', color: '#e39a00' } : _caRole(i - 1, n);
            const roleName = i === 0 ? role.name : (i === n ? role.name : role.name);
            ctx.globalAlpha = dimI ? 0.55 : 1;
            let yEnd;
            if (!L.portrait) {
                const sp = cssW / P.length;
                const nl = fitLines(name, sp - 8, fsN, 9, 900);
                const hN = drawLines(nl, p.x, p.y + r + 8 + nl.fs * 0.6, '#1f2937', 900);
                yEnd = p.y + r + 8 + hN;
                if (showLabels) {
                    const rl = fitLines(roleName, sp - 14, fsB, 8, 800);
                    font(rl.fs);
                    const bw2 = Math.max(...rl.lines.map(t => ctx.measureText(t).width)) + rl.fs * 1.1;
                    const bh2 = rl.lines.length * rl.fs * 1.15 + rl.fs * 0.5;
                    ctx.fillStyle = role.color; roundRect(p.x - bw2 / 2, yEnd + 2, bw2, bh2, 8); ctx.fill();
                    drawLines(rl, p.x, yEnd + 2 + rl.fs * 0.82, '#fff', 800);
                    yEnd += bh2 + 4;
                    if (i === n) { tinyText('super-prédateur', p.x, yEnd + fsB * 0.9, role.color, fsB); yEnd += fsB * 1.8; }
                }
                labBot[i] = yEnd;
                if (showCount && !isDeco) {
                    const k = i === 0 ? 0 : counts[i - 1];
                    crowd(i === 0 ? {} : CA_B[ids[i - 1]], k, p.x - sp / 2 + 6, yEnd + 6, sp - 12, B.y - yEnd - 12, i === 0);
                }
            } else {
                const lx = p.x + r + 10, maxW = B.x - lx - 8;
                const nl = fitLines(name, maxW, fsN, 9, 900);
                const blockH = nl.lines.length * nl.fs * 1.15 + (showLabels ? fsB * 1.9 : 0) + (showCount && !isDeco && i > 0 ? fsB * 2.2 : 0);
                let y = p.y - blockH / 2 + nl.fs * 0.6;
                const hN = drawLines(nl, lx, y, '#1f2937', 900, 'left');
                y += hN - nl.fs * 0.4;
                if (showLabels) {
                    const rl = fitLines(i === n && i > 0 ? roleName + ' · super-prédateur' : roleName, maxW - 10, fsB, 7, 800);
                    font(rl.fs);
                    const bw2 = Math.max(...rl.lines.map(t => ctx.measureText(t).width)) + rl.fs;
                    const bh2 = rl.lines.length * rl.fs * 1.15 + rl.fs * 0.4;
                    ctx.fillStyle = role.color; roundRect(lx, y, bw2, bh2, 7); ctx.fill();
                    drawLines(rl, lx + rl.fs * 0.5, y + rl.fs * 0.78, '#fff', 800, 'left');
                    y += bh2 + 3;
                }
                if (showCount && !isDeco && i > 0) crowd(CA_B[ids[i - 1]], counts[i - 1], lx, y, maxW, fsB * 2.4, false);
            }
            ctx.globalAlpha = 1;
            const rr = r * 1.15;
            hits.push({ test: (x, y) => Math.hypot(x - p.x, y - p.y) <= rr, act: () => selectLink(sel === i ? -1 : i) });
        });

        // Les restes vont aux décomposeurs, qui rendent des sels minéraux au végétal
        if (isDeco) {
            const ph = (simTime * 0.5) % 1;
            for (let i = 1; i <= n; i++) {
                const p = P[i];
                let x1, y1, x2, y2;
                if (!L.portrait) { x1 = p.x - r * 0.35; y1 = (labBot[i] || p.y + r) + 6; x2 = x1; y2 = B.y - 4; }
                else { x1 = p.x + r + 4; y1 = p.y + r * 0.3; x2 = B.x - 4; y2 = p.y + r * 0.3; }
                arrow(x1, y1, x2, y2, 'rgba(121,85,72,0.85)', 3, [6, 5]);
                const t = (ph + i * 0.17) % 1;
                ctx.fillStyle = '#795548';
                ctx.beginPath(); ctx.arc(_caLerp(x1, x2, t), _caLerp(y1, y2, t), 4, 0, 2 * Math.PI); ctx.fill();
            }
            const p = P[1];
            let x1, y1, x2, y2;
            if (!L.portrait) { x1 = p.x + r * 0.35; y1 = B.y - 4; x2 = x1; y2 = (labBot[1] || p.y + r) + 6; }
            else { x1 = B.x - 4; y1 = p.y - r * 0.3; x2 = p.x + r + 4; y2 = p.y - r * 0.3; }
            arrow(x1, y1, x2, y2, '#2e9d4a', 3.5, [6, 5]);
            const t = ph;
            ctx.fillStyle = '#2e9d4a';
            ctx.beginPath(); ctx.arc(_caLerp(x1, x2, t), _caLerp(y1, y2, t), 4.5, 0, 2 * Math.PI); ctx.fill();
            const fs = Math.max(10, Math.min(14, r * 0.25));
            if (!L.portrait) {
                tinyText('restes : feuilles mortes, cadavres, excréments', cssW / 2, B.y - fs * 0.9 - 2, '#5d4037', fs);
                tinyText('sels minéraux', x1 + 6, (y1 + y2) / 2, '#1f7a36', fs, 'left');
            } else {
                tinyText('sels minéraux', (x1 + x2) / 2, y1 - fs * 0.9, '#1f7a36', fs);
            }
        }
    }

    // ═══════════════════════════ 🧩 CONSTRUIS ═══════════════════════════
    function jChain() { return CA_JEU[jIdx].chain; }
    function newGame(keepIdx) {
        if (!keepIdx) {
            let k = jIdx;
            if (CA_JEU.length > 1) while (k === jIdx) k = Math.floor(Math.random() * CA_JEU.length);
            jIdx = k;
        }
        const ch = jChain();
        jIntrusId = jIntrus ? CA_JEU[jIdx].intrus[Math.floor(Math.random() * CA_JEU[jIdx].intrus.length)] : null;
        const ids = ch.concat(jIntrusId ? [jIntrusId] : []);
        let p = _caShuffle(ids), guard = 0;
        while (guard++ < 10 && p.slice(0, ch.length).every((id, i) => id === ch[i])) p = _caShuffle(ids);
        jPool = p;
        jSlots = ch.map(() => null);
        jWonNow = false;
        lastInfoKey = '';
    }
    const jFull = () => jSlots.every(Boolean);
    const jOk = () => jFull() && jSlots.every((id, i) => id === jChain()[i]);
    function jPlace(id) {
        if (jSlots.includes(id)) return;
        const i = jSlots.indexOf(null);
        if (i < 0) return;
        jSlots[i] = id;
        afterJ();
    }
    function jRemove(i) { jSlots[i] = null; afterJ(); }
    function afterJ() {
        if (jOk() && !jWonNow) { jWonNow = true; jWins++; }
        if (!jOk()) jWonNow = false;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function jHint() {
        const ch = jChain();
        const i = jSlots.findIndex((id, k) => id !== ch[k]);
        if (i < 0) return;
        const j = jSlots.indexOf(ch[i]);
        if (j >= 0) jSlots[j] = null;
        jSlots[i] = ch[i];
        afterJ();
    }
    function tile(x, y, w, h, b, st) {
        // st : 'pool' | 'ghost' | 'empty' | 'ok' | 'ko' | 'placed'
        ctx.save();
        if (st === 'empty' || st === 'ghost') {
            ctx.setLineDash([7, 5]); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
            ctx.restore();
            return;
        }
        const border = st === 'ok' ? '#2e9d4a' : st === 'ko' ? '#d9342b' : '#94a3b8';
        ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
        ctx.fillStyle = st === 'ok' ? '#eaf7ec' : st === 'ko' ? '#fdecea' : '#ffffff';
        roundRect(x, y, w, h, 12); ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.lineWidth = st === 'pool' || st === 'placed' ? 2 : 3.5; ctx.strokeStyle = border; ctx.stroke();
        const horiz = w > h * 1.3;
        if (horiz) {
            const es = Math.min(h * 0.62, w * 0.3);
            drawIco(b, x + 8 + es * 0.6, y + h / 2, es);
            const nl = fitLines(b.name, w - es * 1.2 - 20, Math.max(10, Math.min(15, h * 0.28)), 8, 800);
            drawLines(nl, x + es * 1.2 + 14, y + h / 2 - (nl.lines.length - 1) * nl.fs * 0.57, '#1f2937', 800, 'left');
        } else {
            const es = Math.min(w * 0.55, h * 0.48);
            drawIco(b, x + w / 2, y + h * 0.38, es);
            const nl = fitLines(b.name, w - 8, Math.max(9, Math.min(15, w * 0.13)), 7, 800);
            drawLines(nl, x + w / 2, y + h * 0.76 - (nl.lines.length - 1) * nl.fs * 0.5, '#1f2937', 800);
        }
        if (st === 'ok' || st === 'ko') {
            const fs = Math.max(12, Math.min(20, h * 0.2));
            font(fs, 900); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            ctx.fillStyle = border; ctx.fillText(st === 'ok' ? '✓' : '✗', x + w - 6, y + 4);
        }
        ctx.restore();
    }
    function drawJeuScene() {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f3f7fb'); bg.addColorStop(1, '#e6eef3');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const J = CA_JEU[jIdx], ch = J.chain, n = ch.length, m = Math.min(cssW, cssH);
        const full = jFull(), ok = jOk();
        const fsT = Math.max(12, Math.min(18, m / 28));
        font(fsT, 900);
        const ban = `${J.ico} Une chaîne alimentaire dans ${J.name}`;
        const bt = fitLines(ban, cssW - 30, fsT, 10, 900);
        font(bt.fs, 900);
        const bw = Math.max(...bt.lines.map(t => ctx.measureText(t).width)) + 26, bh = bt.lines.length * bt.fs * 1.15 + bt.fs * 0.8;
        ctx.fillStyle = '#fff'; roundRect(cssW / 2 - bw / 2, 8, bw, bh, 10); ctx.fill();
        ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 2.5; ctx.stroke();
        drawLines(bt, cssW / 2, 8 + bt.fs * 0.97, '#1f2937', 900);
        const top = 8 + bh + 10;
        const nPool = jPool.length;
        const twL = Math.min((cssW - 30) / (n + (n - 1) * 0.5), (cssW - 30) / (nPool + (nPool - 1) * 0.3));
        const portrait = cssW / cssH < 0.95 || (twL < 64 && cssH - top - 50 > Math.max(n, nPool) * 1.32 * 36);

        // Message
        let msg, msgCol;
        if (ok) { msg = '🎉 Bravo ! La chaîne est juste.'; msgCol = '#2e7d32'; }
        else if (full) { msg = '🤔 Des maillons ne sont pas à la bonne place : touche-les pour les retirer.'; msgCol = '#c0392b'; }
        else { msg = jSlots.every(s => !s) ? '👉 Commence par le producteur : le végétal.' : '👉 Qui mange le dernier maillon placé ?'; msgCol = '#475569'; }
        const fsM = Math.max(11, Math.min(15, m / 34));

        if (!portrait) {
            const gapK = 0.5;
            const tw = Math.min(150, (cssW - 30) / (n + (n - 1) * gapK));
            const th = Math.min(tw * 1.15, (cssH - top - 60) * 0.36);
            const twr = Math.min(150, (cssW - 30) / (nPool + (nPool - 1) * 0.3));
            const tW = Math.min(tw, twr), tH = th;
            const totalS = n * tW + (n - 1) * tW * gapK;
            const sx0 = (cssW - totalS) / 2, sy = top + 4;
            tinyText('La chaîne :', sx0, sy - 2 + 0, '#6b7280', 11, 'left');
            for (let i = 0; i < n; i++) {
                const x = sx0 + i * tW * (1 + gapK);
                const id = jSlots[i];
                if (i < n - 1) {
                    const ax1 = x + tW + 4, ax2 = x + tW * (1 + gapK) - 4, ay = sy + 10 + tH / 2;
                    arrow(ax1, ay, ax2, ay, '#475569', 3);
                    if (showLabels) {
                        let fs = 11; font(fs);
                        while (fs > 7 && ctx.measureText('est mangé par').width > ax2 - ax1 + 6) { fs -= 0.5; font(fs); }
                        if (ctx.measureText('est mangé par').width <= ax2 - ax1 + 6) tinyText('est mangé par', (ax1 + ax2) / 2, ay - 12, '#334155', fs);
                    }
                }
                if (!id) tile(x, sy + 10, tW, tH, null, 'empty');
                else tile(x, sy + 10, tW, tH, CA_B[id], full ? (id === ch[i] ? 'ok' : 'ko') : 'placed');
                if (!id) { font(Math.max(10, tH * 0.16), 800); ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), x + tW / 2, sy + 10 + tH / 2); }
                const hx = x, hy = sy + 10;
                if (id) hits.push({ test: (tx, ty) => tx >= hx && tx <= hx + tW && ty >= hy && ty <= hy + tH, act: () => jRemove(i) });
            }
            const my = sy + 10 + tH + fsM * 1.6;
            const ml = fitLines(msg, cssW - 30, fsM, 9, 800);
            drawLines(ml, cssW / 2, my, msgCol, 800);
            // Réserve
            const ry = my + ml.lines.length * ml.fs * 1.15 + 18;
            const totalR = nPool * tW + (nPool - 1) * tW * 0.3;
            const rx0 = (cssW - totalR) / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            roundRect(rx0 - 12, ry - 8, totalR + 24, tH + 30, 14); ctx.fill();
            tinyText('La réserve : touche les êtres vivants dans l\'ordre', cssW / 2, ry + tH + 12, '#6b7280', 11);
            jPool.forEach((id, k) => {
                const x = rx0 + k * tW * 1.3;
                const used = jSlots.includes(id);
                tile(x, ry, tW, tH, CA_B[id], used ? 'ghost' : 'pool');
                if (!used) hits.push({ test: (tx, ty) => tx >= x && tx <= x + tW && ty >= ry && ty <= ry + tH, act: () => jPlace(id) });
            });
        } else {
            // Colonne de gauche : la chaîne · colonne de droite : la réserve
            const colW = (cssW - 30) / 2;
            const avail = cssH - top - 60;
            const tH = Math.min(70, avail / (Math.max(n, nPool) * 1.32));
            const tW = colW;
            const sx = 10, rx = 20 + colW;
            for (let i = 0; i < n; i++) {
                const y = top + i * tH * 1.32;
                const id = jSlots[i];
                if (i < n - 1) arrow(sx + tW / 2, y + tH + 2, sx + tW / 2, y + tH * 1.32 - 2, '#475569', 2.5);
                if (!id) {
                    tile(sx, y, tW, tH, null, 'empty');
                    font(Math.max(10, tH * 0.3), 800); ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(i + 1), sx + tW / 2, y + tH / 2);
                } else {
                    tile(sx, y, tW, tH, CA_B[id], full ? (id === ch[i] ? 'ok' : 'ko') : 'placed');
                    hits.push({ test: (tx, ty) => tx >= sx && tx <= sx + tW && ty >= y && ty <= y + tH, act: () => jRemove(i) });
                }
            }
            jPool.forEach((id, k) => {
                const y = top + k * tH * 1.32;
                const used = jSlots.includes(id);
                tile(rx, y, tW, tH, CA_B[id], used ? 'ghost' : 'pool');
                if (!used) hits.push({ test: (tx, ty) => tx >= rx && tx <= rx + tW && ty >= y && ty <= y + tH, act: () => jPlace(id) });
            });
            const my = top + Math.max(n, nPool) * tH * 1.32 + fsM;
            const ml = fitLines(msg, cssW - 20, fsM, 9, 800);
            drawLines(ml, cssW / 2, my, msgCol, 800);
        }
        if (jWins > 0) {
            const fs = Math.max(10, Math.min(13, m / 40));
            tinyText(`⭐ Chaînes réussies : ${jWins}`, cssW - 10, cssH - 34, '#a16207', fs, 'right');
        }
    }

    // ═══════════════════════════ 🕸️ LE RÉSEAU ═══════════════════════════
    const webNode = id => CA_WEB.find(w => w.id === id);
    const preyOf = id => CA_EDGES.filter(e => e[1] === id).map(e => e[0]);
    const predOf = id => CA_EDGES.filter(e => e[0] === id).map(e => e[1]);
    function webEffects() {
        const dead = new Set(removed);
        let changed = true;
        while (changed) {
            changed = false;
            CA_WEB.forEach(w => {
                if (dead.has(w.id)) return;
                const food = preyOf(w.id);
                if (food.length && food.every(f => dead.has(f))) { dead.add(w.id); changed = true; }
            });
        }
        const up = new Set(), down = new Set();
        dead.forEach(d => {
            preyOf(d).forEach(p => { if (!dead.has(p)) up.add(p); });
            predOf(d).forEach(p => { if (!dead.has(p)) down.add(p); });
        });
        return { dead, cascade: [...dead].filter(d => !removed.includes(d)), up, down };
    }
    function drawReseauScene() {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#eef7ff'); bg.addColorStop(0.7, '#e8f4e2'); bg.addColorStop(1, '#d6ead0');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const m = Math.min(cssW, cssH);
        const r = Math.max(15, Math.min(m * 0.068, cssW * 0.058, 46));
        const fsN = Math.max(9, Math.min(14, r * 0.34));
        const padT = Math.max(30, Math.min(44, r * 0.9 + 14)), padB = killMode ? 56 : 30;
        const PX = w => 10 + w.x * (cssW - 20);
        const PY = w => padT + r + (w.y - 0.17) / (0.85 - 0.17) * (cssH - padT - padB - 2 * r - fsN * 2.4);
        const eff = webEffects();
        const any = removed.length > 0;

        // Niveaux (repères à gauche)
        if (showLabels && cssW > 520) {
            const lv = [['Végétaux', 0.85], ['Herbivores', 0.62], ['Carnivores', 0.40], ['Carnivores', 0.17]];
            ctx.save();
            lv.forEach(([t, yy], k) => {
                const y = PY({ y: yy });
                ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cssW, y); ctx.stroke();
            });
            ctx.restore();
        }

        // Flèches
        CA_EDGES.forEach(([a, b]) => {
            const A = webNode(a), Bn = webNode(b);
            const ax = PX(A), ay = PY(A), bx = PX(Bn), by = PY(Bn);
            const ang = Math.atan2(by - ay, bx - ax);
            const x1 = ax + Math.cos(ang) * (r + 3), y1 = ay + Math.sin(ang) * (r + 3);
            const x2 = bx - Math.cos(ang) * (r + 4), y2 = by - Math.sin(ang) * (r + 4);
            let col = '#64748b', w = 2.5, alpha = 1, dash = null;
            if (wSel && !killMode) {
                if (b === wSel) { col = '#2e7d32'; w = 4.5; }
                else if (a === wSel) { col = '#d9342b'; w = 4.5; }
                else alpha = 0.15;
            }
            if (any && (eff.dead.has(a) || eff.dead.has(b))) { alpha = 0.25; dash = [5, 5]; col = '#94a3b8'; }
            ctx.globalAlpha = alpha;
            arrow(x1, y1, x2, y2, col, w, dash);
            ctx.globalAlpha = 1;
        });

        // Êtres vivants
        CA_WEB.forEach(w => {
            const x = PX(w), y = PY(w);
            const dead = eff.dead.has(w.id), userKilled = removed.includes(w.id);
            const linked = wSel && !killMode && (w.id === wSel || preyOf(wSel).includes(w.id) || predOf(wSel).includes(w.id));
            const dimN = (wSel && !killMode && !linked) || dead;
            const ring = CA_DIET_COLOR[w.diet];
            disc(x, y, r, dead ? '#9ca3af' : ring, w.id === wSel && !killMode, dimN);
            ctx.globalAlpha = dimN ? 0.3 : 1;
            drawIco(w, x, y, r * 1.05);
            ctx.globalAlpha = 1;
            if (dead) {
                ctx.strokeStyle = userKilled ? '#d9342b' : 'rgba(217,52,43,0.75)'; ctx.lineWidth = Math.max(3, r * 0.12); ctx.lineCap = 'round';
                const k = r * 0.62;
                ctx.beginPath(); ctx.moveTo(x - k, y - k); ctx.lineTo(x + k, y + k); ctx.moveTo(x + k, y - k); ctx.lineTo(x - k, y + k); ctx.stroke();
            }
            if (showLabels) {
                const nl = fitLines(w.name, Math.max(60, cssW * 0.2), fsN, 8, 800);
                ctx.globalAlpha = dimN ? 0.5 : 1;
                font(nl.fs);
                const lw = Math.max(...nl.lines.map(t => ctx.measureText(t).width)) + 10;
                const lh = nl.lines.length * nl.fs * 1.15 + 4;
                ctx.fillStyle = 'rgba(255,255,255,0.88)'; roundRect(x - lw / 2, y + r + 3, lw, lh, 6); ctx.fill();
                drawLines(nl, x, y + r + 3 + nl.fs * 0.72, '#1f2937', 800);
                ctx.globalAlpha = 1;
            }
            // Badges de conséquences
            const fsb = Math.max(9, Math.min(12, r * 0.3));
            const by = y - r + fsb * 0.15;
            if (any && !dead && eff.up.has(w.id) && !eff.down.has(w.id)) pill('⬆ plus nombreux', x, by, fsb, '#e8833a');
            else if (any && !dead && eff.down.has(w.id) && !eff.up.has(w.id)) pill('⬇ moins à manger', x, by, fsb, '#7b4fc9');
            else if (any && !dead && eff.down.has(w.id) && eff.up.has(w.id)) pill('⬆⬇ déséquilibre', x, by, fsb, '#6b7280');
            if (dead && !userKilled) pill('disparaît', x, by, fsb, '#d9342b');
            const rr = r * 1.2;
            hits.push({ test: (tx, ty) => Math.hypot(tx - x, ty - y) <= rr, act: () => webTap(w.id) });
        });

        if (killMode) {
            const fs = Math.max(11, Math.min(15, m / 34));
            const t = cssW < 420 ? '🚫 Touche une espèce' : '🚫 Touche un être vivant pour le faire disparaître';
            pill(t, cssW / 2, cssH - 30 - fs, fs, '#d9342b');
        }
    }
    function webTap(id) {
        if (killMode) {
            const i = removed.indexOf(id);
            if (i >= 0) removed.splice(i, 1); else removed.push(id);
        } else {
            wSel = wSel === id ? null : id;
        }
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.setLineDash([]);
        hits = [];
        if (mode === 'chaine') drawChaineScene();
        else if (mode === 'jeu') drawJeuScene();
        else drawReseauScene();
        ctx.globalAlpha = 1;
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function chainSteps() {
        const ids = chainIds(), n = ids.length;
        const items = [{ i: 0, t: '☀️ Le Soleil', c: '#f5a623' }]
            .concat(ids.map((id, k) => ({ i: k + 1, t: `${CA_B[id].ico || '🟢'} ${CA_B[id].name}`, c: _caRole(k, n).color })))
            .concat([{ i: n + 1, t: '🍄 Les décomposeurs', c: '#8d6e63' }, { i: -1, t: '🔄 Vue d\'ensemble', c: '#2f6f3a' }]);
        return `<ol class="ca-steps">${items.map(o => `<li><button data-link="${o.i}" class="${sel === o.i ? 'on' : ''}" style="--st-c:${o.c}">${o.t}</button></li>`).join('')}</ol>`;
    }
    function updateInfo() {
        row2.querySelectorAll('.ca-mil-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.mil) === milieu));
        let key;
        if (mode === 'chaine') key = 'c|' + milieu + '|' + sel;
        else if (mode === 'jeu') key = 'j|' + jIdx + '|' + jSlots.join(',') + '|' + jIntrusId + '|' + jWins;
        else key = 'r|' + wSel + '|' + killMode + '|' + removed.join(',');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        if (mode === 'chaine') {
            const ids = chainIds(), n = ids.length, M = CA_MILIEUX[milieu];
            if (sel < 0) {
                side.style.borderLeftColor = M.color;
                const txt = ids.map(id => _caLow(CA_B[id].name)).join(' → ');
                side.innerHTML = `<h4>Une chaîne alimentaire</h4>
                    <div class="ca-status">${M.ico} <span style="color:${M.color}">${M.name}</span></div>
                    <p class="ca-text">${CA_OVERVIEW.text}</p>
                    <p class="ca-change">➡️ ${CA_OVERVIEW.arrow}</p>
                    <p class="ca-recap">🔗 ${txt.charAt(0).toUpperCase() + txt.slice(1)}</p>
                    <p class="ca-know">💡 <b>Le savais-tu ?</b> ${CA_OVERVIEW.know}</p>
                    ${chainSteps()}`;
            } else if (sel === 0) {
                side.style.borderLeftColor = '#f5a623';
                side.innerHTML = `<h4>Au départ de la chaîne</h4>
                    <div class="ca-status">☀️ <span style="color:#d48a00">Le Soleil</span></div>
                    <p class="ca-change">➡️ Le Soleil n'est pas un être vivant : il ne se mange pas ! Il donne l'énergie de sa lumière aux plantes.</p>
                    <p class="ca-text">${CA_SUN.text}</p>
                    <p class="ca-know">💡 <b>Le savais-tu ?</b> ${CA_SUN.know}</p>
                    ${chainSteps()}`;
            } else if (sel === n + 1) {
                side.style.borderLeftColor = '#8d6e63';
                side.innerHTML = `<h4>À la fin… et au début !</h4>
                    <div class="ca-status">🍄 <span style="color:#6d4c41">Les décomposeurs</span></div>
                    <p class="ca-change">♻️ Ils recyclent les restes de <b>tous</b> les êtres vivants de la chaîne.</p>
                    <p class="ca-text">${CA_DECO.text}</p>
                    <p class="ca-know">💡 <b>Le savais-tu ?</b> ${CA_DECO.know}</p>
                    ${chainSteps()}`;
            } else {
                const k = sel - 1, b = CA_B[ids[k]], role = _caRole(k, n);
                const eats = k === 0 ? `rien ! Il fabrique sa propre matière grâce à la lumière.` : `${_caLow(CA_B[ids[k - 1]].name)}.`;
                const eaten = k === n - 1 ? `aucun animal de cette chaîne : c'est le dernier maillon.` : `${_caLow(CA_B[ids[k + 1]].name)}.`;
                const sentence = k === 0 ? '' : `<p class="ca-recap">🔗 <i>${CA_B[ids[k - 1]].name} → ${_caLow(b.name)}</i><br>se lit : « ${_caLow(CA_B[ids[k - 1]].name)} ${/^Les /.test(CA_B[ids[k - 1]].name) ? 'sont mangées' : (/^(La|L')/.test(CA_B[ids[k - 1]].name) ? 'est mangée' : 'est mangé')} par ${_caLow(b.name)} ».</p>`;
                side.style.borderLeftColor = role.color;
                side.innerHTML = `<h4>Maillon ${k + 1} sur ${n}</h4>
                    <div class="ca-status">${b.ico || '🟢'} <span style="color:${role.color}">${b.name}</span></div>
                    <span class="ca-badge" style="background:${role.color}">${role.name}${k === 0 ? '' : ' · ' + role.diet}</span>
                    <p class="ca-change">🍽️ Il mange : ${eats}<br>⚠️ Il est mangé par : ${eaten}</p>
                    ${sentence}
                    <p class="ca-text">${b.text}</p>
                    <p class="ca-know">📘 <b>À retenir :</b> ${role.text}${k === n - 1 ? ' ' + CA_TOP : ''}</p>
                    ${chainSteps()}`;
            }
        } else if (mode === 'jeu') {
            const J = CA_JEU[jIdx], ch = J.chain;
            side.style.borderLeftColor = '#3f9e4d';
            let res = '';
            if (jOk()) {
                res = `<p class="ca-change">🎉 <b>Bravo !</b> Voici les rôles de chaque maillon :</p>
                    <ul class="ca-list">${ch.map((id, k) => { const ro = _caRole(k, ch.length); return `<li>${CA_B[id].ico || '🟢'} ${CA_B[id].name} : <b style="color:${ro.color}">${_caLow(ro.name)}</b></li>`; }).join('')}</ul>
                    ${jIntrusId ? `<p class="ca-recap">🧐 L'intrus était <b>${_caLow(CA_B[jIntrusId].name)}</b> : il ne vit pas dans ${J.name}.</p>` : ''}
                    <p class="ca-text">Touche <b>🔀 Nouvelle chaîne</b> pour continuer.</p>`;
            } else if (jFull()) {
                const wrong = jSlots.filter((id, i) => id !== ch[i]).length;
                res = `<p class="ca-warn">🤔 ${wrong} maillon${wrong > 1 ? 's sont mal placés' : ' est mal placé'}. Touche un maillon pour le retirer, puis réessaie.</p>`;
            }
            side.innerHTML = `<h4>Construis la chaîne</h4>
                <div class="ca-status">${J.ico} <span style="color:#2f6f3a">Dans ${J.name}</span></div>
                ${res}
                <p class="ca-text">Touche les êtres vivants de la réserve <b>dans l'ordre</b> : d'abord celui qui est mangé, puis celui qui le mange…</p>
                <ul class="ca-list">
                    <li>1<sup>er</sup> maillon : un <b style="color:#3f9e4d">végétal</b> (producteur)</li>
                    <li>2<sup>e</sup> : un <b style="color:#e8a317">herbivore</b> qui mange ce végétal</li>
                    <li>puis les <b style="color:#d9342b">carnivores</b>, du plus petit au plus grand prédateur</li>
                </ul>
                ${jIntrusId && !jOk() ? `<p class="ca-recap">🧐 Attention, il y a un <b>intrus</b> : un être vivant qui ne vit pas dans ${J.name}. Il ne doit pas entrer dans la chaîne !</p>` : ''}
                <p class="ca-know">💡 <b>Astuce :</b> pour chaque flèche, dis la phrase à voix haute : « … est mangé par … ». Si la phrase est fausse, la flèche aussi !</p>`;
        } else {
            const eff = webEffects();
            if (removed.length) {
                side.style.borderLeftColor = '#d9342b';
                const nm = id => _caLow(webNode(id).name);
                const ups = [...eff.up].filter(id => !eff.down.has(id));
                const downs = [...eff.down].filter(id => !eff.up.has(id));
                const both = [...eff.up].filter(id => eff.down.has(id));
                side.innerHTML = `<h4>Si une espèce disparaît…</h4>
                    <div class="ca-status">🚫 <span style="color:#d9342b">${_caListFr(removed.map(id => webNode(id).name))}</span></div>
                    ${eff.cascade.length ? `<p class="ca-warn">❌ <b>Disparaît aussi</b>, faute de nourriture : ${_caListFr(eff.cascade.map(nm))}.</p>` : ''}
                    ${ups.length ? `<p class="ca-change" style="background:#fff1e6;color:#8a4b12">⬆ <b>Devient plus nombreux</b>, car il n'est plus mangé : ${_caListFr(ups.map(nm))}.</p>` : ''}
                    ${downs.length ? `<p class="ca-change" style="background:#f1eafb;color:#4b2a85">⬇ <b>A moins à manger</b> et doit chercher d'autres proies : ${_caListFr(downs.map(nm))}.</p>` : ''}
                    ${both.length ? `<p class="ca-recap">⬆⬇ Perd de la nourriture mais aussi des prédateurs : ${_caListFr(both.map(nm))}.</p>` : ''}
                    <p class="ca-text">Quand un maillon disparaît, tout le réseau est <b>déséquilibré</b> : c'est pourquoi il faut protéger chaque espèce, même les plus petites.</p>
                    <p class="ca-know">💡 <b>Le savais-tu ?</b> Les insecticides tuent les insectes… mais privent aussi de nourriture les oiseaux, les hérissons ou les chauves-souris qui les mangent.</p>`;
            } else if (wSel) {
                const w = webNode(wSel), col = CA_DIET_COLOR[w.diet];
                const eats = preyOf(wSel).map(id => webNode(id).name), by = predOf(wSel).map(id => webNode(id).name);
                side.style.borderLeftColor = col;
                side.innerHTML = `<h4>Le réseau de la forêt</h4>
                    <div class="ca-status">${w.ico} <span style="color:${col}">${w.name}</span></div>
                    <span class="ca-badge" style="background:${col}">${w.diet}</span>
                    <p class="ca-change">🟢 <b>Il mange</b> (flèches vertes) : ${eats.length ? _caListFr(eats.map(_caLow)) : 'rien, il fabrique sa matière grâce à la lumière'}.</p>
                    <p class="ca-warn">🔴 <b>Il est mangé par</b> (flèches rouges) : ${by.length ? _caListFr(by.map(_caLow)) : 'aucun animal de ce réseau'}.</p>
                    <p class="ca-text">${w.text}</p>
                    <p class="ca-know">💡 ${eats.length > 1 ? `Comme il mange plusieurs aliments, si l'un d'eux disparaît, il peut se nourrir des autres.` : eats.length === 1 ? `Il ne mange qu'un seul aliment ici : si celui-ci disparaît, il est en danger !` : `Les végétaux sont à la base de toutes les chaînes du réseau.`}</p>`;
            } else {
                side.style.borderLeftColor = '#3f9e4d';
                side.innerHTML = `<h4>Un réseau alimentaire</h4>
                    <div class="ca-status">🕸️ <span style="color:#2f6f3a">La forêt</span></div>
                    <p class="ca-text">${CA_WEB_OVERVIEW.text}</p>
                    <p class="ca-change">👆 Touche un être vivant : les flèches <span style="color:#2e7d32">vertes</span> montrent ce qu'il mange, les <span style="color:#d9342b">rouges</span> qui le mange.</p>
                    <p class="ca-recap">🚫 Avec <b>Faire disparaître</b>, supprime une espèce (par exemple le chêne ou le mulot) et observe ce qui arrive aux autres.</p>
                    <p class="ca-know">💡 <b>Le savais-tu ?</b> ${CA_WEB_OVERVIEW.know}</p>
                    <p class="ca-text"><span class="ca-badge" style="background:#3f9e4d">Végétal</span> <span class="ca-badge" style="background:#e8a317">Herbivore</span> <span class="ca-badge" style="background:#d9342b">Carnivore</span></p>`;
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
        const n = nLinks();
        const animDeco = mode === 'chaine' && sel === n + 1;
        if (playing || animDeco) simTime += rdt;
        if (playing) {
            stepT += rdt / (fast ? 1.6 : 3.4);
            if (stepT >= 1) {
                stepT = 0;
                if (sel >= n + 1) { setPlaying(false); }
                else { sel++; lastInfoKey = ''; }
            }
        }
        draw();
        if (playing || animDeco) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        if (playing) {
            if (sel < 0 || sel >= nLinks() + 1) sel = 0;
            stepT = 0;
            lastInfoKey = '';
        }
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (playing) startLoop();
        else { requestDraw(); if (typeof saveBoard === 'function') saveBoard(); }
    }
    function setFast(v) {
        fast = !!v;
        speedBtn.textContent = fast ? '🐇 Rapide' : '🐢 Lent';
        speedBtn.classList.toggle('on', fast);
    }
    function selectLink(i) {
        const n = nLinks();
        sel = Math.max(-1, Math.min(n + 1, i));
        stepT = playing ? 0 : 1;
        lastInfoKey = '';
        requestDraw();
        if (sel === n + 1) startLoop();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function setMilieu(i) {
        milieu = Math.max(0, Math.min(CA_MILIEUX.length - 1, i));
        if (playing) setPlaying(false);
        sel = -1;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function setKill(v) {
        killMode = !!v;
        killBtn.classList.toggle('on', killMode);
        if (killMode) wSel = null;
        lastInfoKey = '';
        requestDraw();
    }
    function setMode(m) {
        mode = m === 'jeu' || m === 'reseau' ? m : 'chaine';
        container.dataset.mode = mode;
        header.querySelectorAll('.ca-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (playing) setPlaying(false);
        hint.textContent = mode === 'chaine'
            ? 'Touche un être vivant pour l\'expliquer · ▶ Lecture : la nourriture passe de maillon en maillon'
            : mode === 'jeu'
                ? 'Touche les êtres vivants de la réserve dans l\'ordre · touche un maillon placé pour le retirer'
                : (killMode ? 'Touche un être vivant pour le faire disparaître (touche-le encore pour le remettre)'
                            : 'Touche un être vivant : ce qu\'il mange (vert) et qui le mange (rouge)');
        lastInfoKey = '';
        requestDraw();
        if (mode === 'chaine' && sel === nLinks() + 1) startLoop();
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
    function hitAt(x, y) {
        for (let i = hits.length - 1; i >= 0; i--) if (hits[i].test(x, y)) return hits[i];
        return null;
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
    let _cur = '';
    function setCursor(c) { if (c !== _cur) { _cur = c; canvas.style.setProperty('cursor', c, 'important'); } }
    canvas.addEventListener('pointermove', e => {
        if (drag && drag.id === e.pointerId) {
            if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
            return;
        }
        const L = local(e);
        setCursor(hitAt(L.x, L.y) ? 'pointer' : 'default');
    });
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel' || d.moved) return;
        const L = local(e);
        const h = hitAt(L.x, L.y);
        if (h) h.act();
        else if (mode === 'reseau' && wSel && !killMode) webTap(wSel);
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
        const b = e.target.closest('button[data-link]');
        if (!b) return;
        e.stopPropagation();
        if (playing) setPlaying(false);
        selectLink(Number(b.dataset.link));
    });

    header.querySelectorAll('.ca-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); if (typeof saveBoard === 'function') saveBoard(); });
    $('.ca-prev').addEventListener('click', () => { if (playing) setPlaying(false); const n = nLinks(); selectLink(sel <= 0 ? n + 1 : sel - 1); });
    $('.ca-next').addEventListener('click', () => { if (playing) setPlaying(false); const n = nLinks(); selectLink(sel >= n + 1 ? 0 : sel + 1); });
    $('.ca-all').addEventListener('click', () => { if (playing) setPlaying(false); selectLink(-1); });
    countBtn.addEventListener('click', () => { showCount = !showCount; countBtn.classList.toggle('on', showCount); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    row2.querySelectorAll('.ca-mil-btn').forEach(b => b.addEventListener('click', () => setMilieu(Number(b.dataset.mil))));
    $('.ca-new').addEventListener('click', () => { newGame(false); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    $('.ca-hintbtn').addEventListener('click', () => jHint());
    $('.ca-reset').addEventListener('click', () => { jSlots = jSlots.map(() => null); afterJ(); });
    intrusBtn.addEventListener('click', () => {
        jIntrus = !jIntrus;
        intrusBtn.classList.toggle('on', jIntrus);
        newGame(true);
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    });
    killBtn.addEventListener('click', () => { setKill(!killMode); setMode('reseau'); if (typeof saveBoard === 'function') saveBoard(); });
    $('.ca-restore').addEventListener('click', () => { removed = []; setKill(false); setMode('reseau'); if (typeof saveBoard === 'function') saveBoard(); });

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
            window._wfMiniBarCollapse(widget, '🔗 Les chaînes alimentaires', {
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
    jIdx = Math.floor(Math.random() * CA_JEU.length);
    newGame(true);
    setMode('chaine');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._caGetData = () => ({
        containerW: contW, containerH: contH,
        mode, milieu, sel, showLabels, showCount, fast,
        jIdx, jIntrus, jIntrusId, jPool: jPool.slice(), jSlots: jSlots.slice(), jWins,
        wSel, killMode, removed: removed.slice()
    });
    widget._caSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.milieu === 'number' && CA_MILIEUX[d.milieu]) milieu = d.milieu;
        if (typeof d.sel === 'number') sel = Math.max(-1, Math.min(nLinks() + 1, Math.round(d.sel)));
        stepT = 1;
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showCount === 'boolean') { showCount = d.showCount; countBtn.classList.toggle('on', showCount); }
        setFast(!!d.fast);
        // jeu
        if (typeof d.jIdx === 'number' && CA_JEU[d.jIdx]) {
            jIdx = d.jIdx;
            jIntrus = !!d.jIntrus;
            intrusBtn.classList.toggle('on', jIntrus);
            const ch = CA_JEU[jIdx].chain;
            const intr = d.jIntrusId && CA_B[d.jIntrusId] ? d.jIntrusId : null;
            const expect = ch.concat(intr ? [intr] : []).slice().sort().join(',');
            if (Array.isArray(d.jPool) && d.jPool.slice().sort().join(',') === expect &&
                Array.isArray(d.jSlots) && d.jSlots.length === ch.length && d.jSlots.every(s => s === null || d.jPool.includes(s))) {
                jIntrusId = intr; jPool = d.jPool.slice(); jSlots = d.jSlots.slice();
                jWonNow = jOk();
            } else newGame(true);
            if (typeof d.jWins === 'number') jWins = Math.max(0, Math.round(d.jWins));
        }
        // réseau
        wSel = d.wSel && webNode(d.wSel) ? d.wSel : null;
        removed = Array.isArray(d.removed) ? d.removed.filter(id => webNode(id)) : [];
        killMode = !!d.killMode; killBtn.classList.toggle('on', killMode);
        if (killMode) wSel = null;
        setMode(d.mode || 'chaine');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_caSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
