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
// WIDGET LES ROIS DE FRANCE, DE CLOVIS À LOUIS-PHILIPPE — Le Bureau du Prof
// Deux onglets, pour des élèves de fin de primaire (CM1 – CM2 – 6e) :
//  📜 La frise : de 481 à 1848, les rois et leurs règnes, colorés par
//     dynastie (Mérovingiens, Carolingiens, Capétiens directs, Valois,
//     Bourbons, Orléans), avec la Révolution et l'Empire, les siècles,
//     les grandes périodes et les grands événements.
//     Les boutons de dynastie zooment sur une dynastie.
//  👪 L'arbre généalogique : un arbre par dynastie, avec les rois et les
//     personnes qui font le lien (Charles Martel, Robert le Fort, Charles
//     de Valois, Isabelle de France, le Grand Dauphin…). On le fait
//     défiler en le glissant.
// On touche un roi, une dynastie ou un événement pour afficher sa fiche.
// « ◀ ▶ » passe d'un roi à l'autre ; « 🎓 Visite guidée » présente les
// grands rois l'un après l'autre.
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
    if (document.getElementById('frr-style')) return;
    const s = document.createElement('style');
    s.id = 'frr-style';
    s.textContent = `
        .widget[data-type="frise-rois"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .frr-container {
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
        .frr-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .frr-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .frr-header .wf-btns { gap: 8px; }
        .frr-header .wf-btn { width: 18px; height: 18px; }
        .frr-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .frr-container.wf-fullboard {
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
        .frr-tabs { display: inline-flex; background: #f3eee4; border-radius: 11px; padding: 3px; gap: 3px; }
        .frr-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .frr-tab.on { background: #fff; color: #7a4b12; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .frr-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .frr-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .frr-btn:hover { background: #e0e0e0; }
        .frr-btn:active { transform: scale(0.96); }
        .frr-btn.on { background: #a16207; color: #fff; border-color: #a16207; }
        .frr-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .frr-dyn { border-left: 5px solid var(--st-c, #bbb); }
        .frr-dyn.on { background: var(--st-c, #a16207); border-color: var(--st-c, #a16207); color: #fff; }
        .frr-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .frr-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }

        /* Corps */
        .frr-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .frr-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #fbf7ef; border: 1px solid #eadfcb;
        }
        .frr-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .frr-hint {
            position: absolute; left: 0; right: 0; bottom: 4px; text-align: center;
            font-size: 12px; color: rgba(90,70,40,.75); pointer-events: none;
        }
        .frr-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #a16207;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .frr-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .frr-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .frr-reign { background: #fbf3e4; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #7a4b12; font-weight: 700; }
        .frr-family { background: #eef4fb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d4f86; font-weight: 600; }
        .frr-text { margin: 0 0 6px; }
        .frr-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .frr-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .frr-list button, .frr-side .frr-go {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .frr-list button.on { background: var(--st-c, #a16207); color: #fff; }
        .frr-side .frr-go { margin: 0 0 8px; text-align: center; background: #fdf6e9; }
        .frr-chip { display: inline-block; padding: 1px 8px; border-radius: 10px; color: #fff; font-weight: 800; font-size: .85em; }
        .frr-small { font-size: .85em; color: #6b7280; font-weight: 600; }

        /* Aide */
        .frr-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .frr-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .frr-help-popup.show { display: block; }
        .frr-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .frr-help-popup p { margin: 0 0 6px; }

        .frr-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .frr-resize-handle:hover { opacity: 1; }
        .frr-container[data-mode="arbre"] .frr-only-frise { display: none !important; }
        .frr-container[data-mode="frise"] .frr-only-arbre { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .frr-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .frr-tab-short { display: none; }
        .frr-header { min-width: 0; max-width: 100%; }
        .frr-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .frr-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .frr-header .wf-btns { flex-shrink: 0; }
        .frr-container.wf-fullboard .frr-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .frr-container { padding: 10px 10px 8px; gap: 6px; }
            .frr-header { gap: 6px; }
            .frr-title { font-size: 13px; }
            .frr-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .frr-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .frr-row > * { flex-shrink: 0; }
            .frr-row + .frr-row .frr-lbl:first-child { display: none; }
            .frr-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .frr-sep { display: none; }
            .frr-hint { font-size: 11px; padding: 0 6px; }
            .frr-side { padding: 8px 10px; font-size: 13px; }
            .frr-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .frr-title { display: none; }
            .frr-tab { padding: 3px 7px; font-size: 11.5px; }
            .frr-tab-long { display: none; }
            .frr-tab-short { display: inline; }
            .frr-hint { display: none; }
            .frr-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .frr-body { flex-direction: column; }
            .frr-scene-wrap { flex: 1 1 0; min-height: 240px; }
            .frr-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .frr-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Les dynasties ─────────────────────────────────────────────────────────
const FRR_DYN = {
    mero: {
        name: 'Mérovingiens', color: '#3f8f4a', light: '#dcefdf', start: 481, end: 751, dates: '481 – 751',
        text: 'Leur nom vient de Mérovée, le grand-père de Clovis, un roi à moitié légendaire. Chez les Mérovingiens, à la mort du roi, le royaume est <b>partagé entre ses fils</b> : il y a donc souvent plusieurs rois en même temps, et beaucoup de guerres entre frères.',
        debut: 'Clovis, roi des Francs, conquiert la plus grande partie de la Gaule.',
        fin: 'En 751, Pépin le Bref, maire du palais, enferme le dernier roi mérovingien dans un monastère et prend sa place.'
    },
    caro: {
        name: 'Carolingiens', color: '#7b4fb8', light: '#e9e0f6', start: 751, end: 987, dates: '751 – 987',
        text: 'Leur nom vient de <b>Charles</b> (<i>Carolus</i> en latin), le prénom de Charles Martel et de Charlemagne. Pépin le Bref est le premier roi à se faire <b>sacrer</b> : l\'huile sainte montre que le roi est choisi par Dieu.',
        debut: 'En 751, Pépin le Bref devient roi à la place du dernier Mérovingien.',
        fin: 'En 987, Louis V meurt jeune, sans enfant. Les grands seigneurs élisent Hugues Capet.'
    },
    cape: {
        name: 'Capétiens directs', color: '#2f6fbf', light: '#dde8f7', start: 987, end: 1328, dates: '987 – 1328',
        text: 'Leur nom vient du surnom d\'<b>Hugues Capet</b>. Pendant plus de 300 ans, la couronne passe <b>du père au fils aîné</b>, sans interruption. Le domaine du roi s\'agrandit et son pouvoir se renforce face aux grands seigneurs.',
        debut: 'En 987, Hugues Capet est élu roi par les grands seigneurs. Ses ancêtres, Eudes et Robert Ier, avaient déjà été rois.',
        fin: 'En 1328, Charles IV meurt sans fils : les trois fils de Philippe le Bel sont morts sans héritier.'
    },
    valo: {
        name: 'Valois', color: '#d9822b', light: '#fae6cf', start: 1328, end: 1589, dates: '1328 – 1589',
        text: 'Les Valois sont des <b>cousins</b> des Capétiens directs : le premier d\'entre eux, Philippe VI, est le neveu de Philippe le Bel. Leur règne commence avec la <b>guerre de Cent Ans</b> contre l\'Angleterre. Louis XII et François Ier viennent de deux branches cousines de la famille (Valois-Orléans et Valois-Angoulême).',
        debut: 'En 1328, les grands du royaume choisissent Philippe de Valois plutôt qu\'Édouard III, le roi d\'Angleterre.',
        fin: 'En 1589, Henri III est assassiné sans laisser d\'enfant : la couronne passe à son lointain cousin Henri de Navarre, un Bourbon.'
    },
    bourbon: {
        name: 'Bourbons', color: '#c0392b', light: '#f8dcd8', start: 1589, end: 1830, dates: '1589 – 1792, puis 1814 – 1830',
        segs: [[1589, 1792], [1814, 1830]],
        text: 'Les Bourbons descendent eux aussi d\'Hugues Capet, par un fils de Saint Louis. Avec eux, le roi gouverne seul et a tous les pouvoirs : c\'est la <b>monarchie absolue</b>, dont <b>Louis XIV</b> est le symbole.',
        debut: 'En 1589, Henri III meurt sans enfant : son lointain cousin Henri de Navarre devient le roi Henri IV.',
        fin: 'La Révolution abolit la monarchie en 1792. Les Bourbons reviennent en 1814, après la chute de Napoléon (la <b>Restauration</b>), puis sont chassés par la révolution de 1830.'
    },
    orleans: {
        name: 'Orléans', color: '#0f8b8d', light: '#d3eeee', start: 1830, end: 1848, dates: '1830 – 1848',
        text: 'La famille d\'Orléans est une branche cousine des Bourbons : elle descend du frère de Louis XIV. <b>Louis-Philippe</b> est le seul roi de cette famille… et le <b>dernier roi de France</b>.',
        debut: 'En juillet 1830, une révolution (les « Trois Glorieuses ») chasse Charles X ; Louis-Philippe devient « roi des Français ».',
        fin: 'En février 1848, une nouvelle révolution renverse Louis-Philippe : la Deuxième République est proclamée.'
    }
};
const FRR_DYN_ORDER = ['mero', 'caro', 'cape', 'valo', 'bourbon', 'orleans'];
const FRR_TREE_ORDER = ['mero', 'caro', 'cape', 'valo', 'bourbon'];
const FRR_OTHER_COLOR = { robert: '#6f9bd6', autre: '#9aa0a6', empire: '#5f6b7a' };
const FRR_RANGES = {
    all: [450, 1870], mero: [465, 765], caro: [735, 1000], cape: [975, 1340],
    valo: [1315, 1600], bourbon: [1575, 1840], orleans: [1765, 1860]
};
// Périodes sans roi, dans la bande des dynasties
const FRR_GAPS = [
    { name: 'République', start: 1792, end: 1804, color: '#64748b', light: '#e5e9ef',
      text: 'Pendant la <b>Révolution</b>, la monarchie est abolie (septembre 1792) : la France devient une <b>république</b>, sans roi. Louis XVI est guillotiné en janvier 1793.' },
    { name: 'Empire', start: 1804, end: 1814, color: '#5f6b7a', light: '#dde1e6',
      text: 'En 1804, Napoléon Bonaparte devient <b>empereur des Français</b> : ce n\'est pas un roi. Le Premier Empire prend fin en 1814, puis une dernière fois en 1815, après la défaite de Waterloo.' }
];

// ── Les personnes : rois (king: true) et personnes qui font le lien ──────
// dyn : dynastie (robert = Robertiens, ancêtres des Capétiens ; autre = autre famille)
// imp : roi important (son nom est toujours écrit sur la frise générale)
// half : 'top' / 'bot' quand deux rois règnent en même temps
const FRR_PERSONS = [
    // Mérovingiens
    { id: 'clovis', name: 'Clovis Ier', dyn: 'mero', king: true, start: 481, end: 511, imp: true,
      text: 'Roi des Francs, il conquiert presque toute la Gaule. Il se fait <b>baptiser à Reims</b> avec ses guerriers, ce qui lui donne le soutien de l\'Église. Il choisit <b>Paris</b> comme capitale.',
      know: 'Selon la légende du vase de Soissons, Clovis aurait tué un guerrier qui lui avait désobéi pendant le partage d\'un butin.' },
    { id: 'clotaire1', name: 'Clotaire Ier', dyn: 'mero', king: true, start: 511, end: 561,
      text: 'Fils de Clovis. À la mort de Clovis, le royaume est <b>partagé entre ses quatre fils</b>. Clotaire, le dernier survivant, réunit tout le royaume à la fin de sa vie (558).' },
    { id: 'chilperic1', name: 'Chilpéric Ier', dyn: 'mero', king: true, start: 561, end: 584,
      text: 'Fils de Clotaire Ier. Le royaume est de nouveau partagé : Chilpéric règne sur une partie seulement, la Neustrie (autour de Soissons et de Paris).' },
    { id: 'clotaire2', name: 'Clotaire II', dyn: 'mero', king: true, start: 584, end: 629,
      text: 'Fils de Chilpéric. Il réunit de nouveau tout le royaume des Francs en 613.' },
    { id: 'dagobert', name: 'Dagobert Ier', dyn: 'mero', king: true, start: 629, end: 639, imp: true,
      text: 'Fils de Clotaire II, c\'est le <b>dernier grand roi mérovingien</b>. Il est aidé par son conseiller saint Éloi. Il enrichit l\'abbaye de <b>Saint-Denis</b>, où il est le premier roi enterré : beaucoup de rois de France y seront enterrés après lui.',
      know: 'La chanson « Le bon roi Dagobert » a été écrite plus de mille ans après sa mort, au XVIIIᵉ siècle, sans doute pour se moquer du roi de l\'époque.' },
    { id: 'faineants', name: 'Les « rois fainéants »', dyn: 'mero', king: true, group: true, start: 639, end: 743,
      text: 'Après Dagobert, les rois mérovingiens sont souvent très jeunes et ont peu de pouvoir : on les a surnommés les <b>« rois fainéants »</b>. Le vrai pouvoir appartient aux <b>maires du palais</b>, comme Charles Martel.',
      know: 'Les rois fainéants n\'étaient pas paresseux : ce surnom a été inventé plus tard par les Carolingiens, pour justifier qu\'ils avaient pris leur place.' },
    { id: 'childeric3', name: 'Childéric III', dyn: 'mero', king: true, start: 743, end: 751,
      text: '<b>Dernier roi mérovingien</b>. En 751, Pépin le Bref le dépose, lui fait couper les cheveux (les cheveux longs étaient le signe du pouvoir des rois mérovingiens) et l\'enferme dans un monastère.' },
    // Carolingiens
    { id: 'charlesmartel', name: 'Charles Martel', dyn: 'caro', king: false, role: 'maire du palais',
      text: '<b>Maire du palais</b> : il gouverne le royaume à la place des rois mérovingiens, mais il n\'a <b>jamais été roi</b>. En 732, il arrête une armée venue d\'Al-Andalus (l\'Espagne musulmane) près de <b>Poitiers</b>.' },
    { id: 'pepin', name: 'Pépin le Bref', dyn: 'caro', king: true, start: 751, end: 768, imp: true,
      text: 'Fils de Charles Martel. Il prend la place de Childéric III et se fait <b>sacrer</b> : c\'est le <b>premier roi carolingien</b>. Le sacre montre que le roi est choisi par Dieu.',
      know: 'Son surnom « le Bref » viendrait de sa petite taille.' },
    { id: 'carloman1', name: 'Carloman Ier', dyn: 'caro', king: true, start: 768, end: 771, half: 'bot',
      text: 'Frère de Charlemagne. Les deux frères se partagent le royaume de leur père. À la mort de Carloman, en 771, Charlemagne règne seul.' },
    { id: 'charlemagne', name: 'Charlemagne', dyn: 'caro', king: true, start: 768, end: 814, imp: true,
      text: 'Il agrandit énormément son royaume par des guerres. Le jour de Noël de l\'an <b>800</b>, il est <b>couronné empereur</b> à Rome par le pape. Il surveille son empire grâce aux comtes et aux <i>missi dominici</i>, et il encourage l\'enseignement dans les monastères.',
      know: 'Son nom veut dire « Charles le Grand » (<i>Carolus Magnus</i> en latin).' },
    { id: 'louis1', name: 'Louis Ier le Pieux', dyn: 'caro', king: true, start: 814, end: 840,
      text: 'Fils de Charlemagne, il hérite de tout l\'empire. À la fin de sa vie, ses fils se disputent pour le partager.' },
    { id: 'lothaire1', name: 'Lothaire Ier', dyn: 'caro', king: false, role: 'empereur',
      text: 'Fils aîné de Louis le Pieux, empereur. Au traité de Verdun (843), il reçoit la partie du milieu de l\'empire, de la mer du Nord jusqu\'à l\'Italie. Il n\'a pas été roi de la Francie de l\'ouest.',
      know: 'Le nom de la <b>Lorraine</b> vient de son fils Lothaire II (la « Lotharingie »).' },
    { id: 'louisgerm', name: 'Louis le Germanique', dyn: 'caro', king: false, role: 'roi de Germanie',
      text: 'Fils de Louis le Pieux. Au traité de Verdun (843), il reçoit la partie de l\'est de l\'empire, qui deviendra la <b>Germanie</b> (l\'Allemagne).' },
    { id: 'charles2', name: 'Charles II le Chauve', dyn: 'caro', king: true, start: 843, end: 877, imp: true,
      text: 'Petit-fils de Charlemagne. Au <b>traité de Verdun</b> (843), il reçoit la <b>Francie occidentale</b>, la partie de l\'ouest de l\'empire : elle deviendra la France. Il est aussi couronné empereur en 875.',
      know: 'On ne sait pas vraiment pourquoi il était surnommé « le Chauve » : peut-être… parce qu\'il avait beaucoup de cheveux !' },
    { id: 'louis2', name: 'Louis II le Bègue', dyn: 'caro', king: true, start: 877, end: 879,
      text: 'Fils de Charles le Chauve. Son surnom vient de ce qu\'il avait du mal à parler (il bégayait). Il ne règne que deux ans.' },
    { id: 'louis3', name: 'Louis III', dyn: 'caro', king: true, start: 879, end: 882, half: 'top',
      text: 'Fils de Louis le Bègue, il règne en même temps que son frère Carloman II. En 881, il bat les Vikings à Saucourt.' },
    { id: 'carloman2', name: 'Carloman II', dyn: 'caro', king: true, start: 879, end: 884, half: 'bot',
      text: 'Frère de Louis III, avec qui il partage le royaume. Il règne seul après la mort de son frère, puis meurt jeune, blessé à la chasse.' },
    { id: 'charlesgros', name: 'Charles le Gros', dyn: 'caro', king: true, start: 884, end: 887,
      text: 'Fils de Louis le Germanique, il est déjà empereur quand il devient roi de la Francie de l\'ouest. Il ne parvient pas à défendre Paris, assiégée par les <b>Vikings</b> (885-886) : les grands seigneurs le déposent.' },
    { id: 'eudes', name: 'Eudes', dyn: 'robert', king: true, start: 888, end: 898,
      text: 'Comte de Paris, il a défendu la ville contre les Vikings. Les grands seigneurs l\'élisent roi : il n\'est <b>pas carolingien</b>. C\'est un ancêtre de la famille des Capétiens (les Robertiens).' },
    { id: 'charles3', name: 'Charles III le Simple', dyn: 'caro', king: true, start: 898, end: 922,
      text: 'Fils de Louis le Bègue. En <b>911</b>, il donne une région autour de Rouen à Rollon, chef des <b>Vikings</b> : c\'est la naissance de la <b>Normandie</b>. Il est déposé en 922.',
      know: '« Le Simple » ne voulait pas dire « naïf » : au Moyen Âge, ce mot voulait plutôt dire « honnête, sincère ».' },
    { id: 'robert1', name: 'Robert Ier', dyn: 'robert', king: true, start: 922, end: 923,
      text: 'Frère d\'Eudes. Les grands seigneurs l\'élisent roi à la place de Charles le Simple, mais il meurt l\'année suivante au combat. Il est le grand-père d\'Hugues Capet.' },
    { id: 'raoul', name: 'Raoul', dyn: 'autre', king: true, start: 923, end: 936,
      text: 'Duc de Bourgogne et gendre de Robert Ier. Il est élu roi pendant que Charles le Simple est prisonnier. Il n\'est ni carolingien, ni robertien : c\'est pour cela qu\'il n\'apparaît dans aucun arbre.' },
    { id: 'louis4', name: 'Louis IV d\'Outremer', dyn: 'caro', king: true, start: 936, end: 954,
      text: 'Fils de Charles le Simple. Enfant, il a été caché en Angleterre, de l\'autre côté de la mer : d\'où son surnom « d\'Outremer ». Il revient pour devenir roi.' },
    { id: 'lothaire', name: 'Lothaire', dyn: 'caro', king: true, start: 954, end: 986,
      text: 'Fils de Louis IV. Il essaie, sans succès, de reprendre la Lorraine aux rois de Germanie.' },
    { id: 'louis5', name: 'Louis V', dyn: 'caro', king: true, start: 986, end: 987,
      text: '<b>Dernier roi carolingien</b>. Il meurt après une chute de cheval à la chasse, à 20 ans environ, sans enfant. Les grands seigneurs choisissent alors Hugues Capet.' },
    // Robertiens et Capétiens directs
    { id: 'robertfort', name: 'Robert le Fort', dyn: 'robert', king: false, role: 'comte',
      text: 'Comte, il combat les Vikings et meurt au combat en 866. Il n\'a jamais été roi, mais ses deux fils, <b>Eudes</b> et <b>Robert</b>, le deviendront. C\'est l\'ancêtre des Capétiens.' },
    { id: 'huguesgrand', name: 'Hugues le Grand', dyn: 'robert', king: false, role: 'duc des Francs',
      text: 'Fils de Robert Ier. « Duc des Francs », il est l\'un des hommes les plus puissants du royaume, mais il n\'a pas été roi. Il est le père d\'Hugues Capet.' },
    { id: 'hugues', name: 'Hugues Capet', dyn: 'cape', king: true, start: 987, end: 996, imp: true,
      text: '<b>Élu roi</b> par les grands seigneurs en 987, puis sacré. Son pouvoir est faible : il ne contrôle vraiment qu\'un petit domaine, autour de <b>Paris et d\'Orléans</b>. Pour assurer sa succession, il fait sacrer son fils Robert de son vivant.',
      know: 'Sa famille (Capétiens, puis Valois et Bourbons, qui descendent de lui) régnera sur la France pendant plus de 800 ans !' },
    { id: 'robert2', name: 'Robert II le Pieux', dyn: 'cape', king: true, start: 996, end: 1031,
      text: 'Fils d\'Hugues Capet, sacré du vivant de son père. On l\'appelle « le Pieux » car il était très croyant.' },
    { id: 'henri1', name: 'Henri Ier', dyn: 'cape', king: true, start: 1031, end: 1060,
      text: 'Fils de Robert le Pieux. Il épouse <b>Anne de Kiev</b>, une princesse venue de très loin, de la région de l\'Ukraine actuelle.' },
    { id: 'philippe1', name: 'Philippe Ier', dyn: 'cape', king: true, start: 1060, end: 1108,
      text: 'Fils d\'Henri Ier. Pendant son long règne, en 1066, Guillaume le Conquérant, duc de Normandie, devient roi d\'Angleterre, et en 1096 part la <b>première croisade</b>.' },
    { id: 'louis6', name: 'Louis VI le Gros', dyn: 'cape', king: true, start: 1108, end: 1137,
      text: 'Fils de Philippe Ier. Il lutte contre les seigneurs pillards de son domaine et renforce l\'autorité du roi, aidé par son conseiller <b>Suger</b>, abbé de Saint-Denis.' },
    { id: 'louis7', name: 'Louis VII le Jeune', dyn: 'cape', king: true, start: 1137, end: 1180,
      text: 'Fils de Louis VI. Il part à la deuxième croisade. Son mariage avec <b>Aliénor d\'Aquitaine</b> est annulé : elle épouse Henri Plantagenêt, futur roi d\'Angleterre, et l\'Aquitaine passe aux Anglais.' },
    { id: 'philippe2', name: 'Philippe II Auguste', dyn: 'cape', king: true, start: 1180, end: 1223, imp: true,
      text: 'Il <b>agrandit beaucoup le domaine royal</b>, notamment en prenant la Normandie aux Anglais. Il remporte la <b>bataille de Bouvines</b> en 1214. À Paris, il fait construire une enceinte et le château du <b>Louvre</b>.',
      know: 'C\'est l\'un des premiers rois à s\'appeler « roi de France » et non plus « roi des Francs ».' },
    { id: 'louis8', name: 'Louis VIII le Lion', dyn: 'cape', king: true, start: 1223, end: 1226,
      text: 'Fils de Philippe Auguste. Il ne règne que trois ans et combat dans le sud du royaume.' },
    { id: 'louis9', name: 'Louis IX (Saint Louis)', dyn: 'cape', king: true, start: 1226, end: 1270, imp: true,
      text: 'Roi très croyant, il veut être un roi juste : selon la tradition, il rendait la justice sous un chêne à Vincennes. Il fait construire la <b>Sainte-Chapelle</b> à Paris. Il meurt près de Tunis pendant une croisade.',
      know: 'Il a été déclaré <b>saint</b> par l\'Église en 1297 : c\'est pour cela qu\'on l\'appelle Saint Louis.' },
    { id: 'philippe3', name: 'Philippe III le Hardi', dyn: 'cape', king: true, start: 1270, end: 1285,
      text: 'Fils de Saint Louis. Devenu roi pendant la croisade, il ramène en France le corps de son père.' },
    { id: 'philippe4', name: 'Philippe IV le Bel', dyn: 'cape', king: true, start: 1285, end: 1314, imp: true,
      text: 'Il renforce l\'État avec des conseillers formés au droit (les légistes). Il s\'oppose au pape et fait arrêter les chevaliers de l\'ordre du <b>Temple</b> (les Templiers) en 1307.',
      know: 'Ses trois fils deviennent rois l\'un après l\'autre, mais aucun n\'a de fils qui lui survit : c\'est la fin des Capétiens directs.' },
    { id: 'louis10', name: 'Louis X le Hutin', dyn: 'cape', king: true, start: 1314, end: 1316,
      text: 'Fils aîné de Philippe le Bel. « Le Hutin » veut dire « le querelleur ». Il meurt après seulement deux ans de règne.' },
    { id: 'jean1', name: 'Jean Ier le Posthume', dyn: 'cape', king: true, start: 1316, end: 1316,
      text: 'Fils de Louis X, né après la mort de son père (c\'est le sens de « posthume »). Il est roi dès sa naissance, mais ne vit que <b>cinq jours</b>.' },
    { id: 'philippe5', name: 'Philippe V le Long', dyn: 'cape', king: true, start: 1316, end: 1322,
      text: 'Frère de Louis X. Après la mort du petit Jean Ier, il devient roi : on décide alors qu\'<b>une femme ne peut pas hériter de la couronne</b> de France.' },
    { id: 'charles4', name: 'Charles IV le Bel', dyn: 'cape', king: true, start: 1322, end: 1328,
      text: 'Dernier fils de Philippe le Bel et <b>dernier Capétien direct</b> : il meurt sans fils en 1328.' },
    { id: 'isabelle', name: 'Isabelle de France', dyn: 'cape', king: false, female: true, role: 'reine d\'Angleterre',
      text: 'Fille de Philippe le Bel. Elle épouse le roi d\'Angleterre. Son fils, <b>Édouard III</b>, réclamera la couronne de France.' },
    // Valois
    { id: 'charlesvalois', name: 'Charles de Valois', dyn: 'valo', king: false, role: 'comte de Valois',
      text: 'Fils de Philippe III et frère de Philippe le Bel. Il n\'a jamais été roi, mais son fils <b>Philippe VI</b> devient en 1328 le premier roi de la famille des Valois.',
      know: 'On a dit de lui qu\'il était « fils de roi, frère de roi, oncle de trois rois, père de roi… mais jamais roi ».' },
    { id: 'edouard3', name: 'Édouard III', dyn: 'autre', king: false, role: 'roi d\'Angleterre',
      text: 'Roi d\'Angleterre (1327-1377), petit-fils de Philippe le Bel par sa mère Isabelle. Il réclame la couronne de France : c\'est l\'une des causes de la <b>guerre de Cent Ans</b>.' },
    { id: 'philippe6', name: 'Philippe VI de Valois', dyn: 'valo', king: true, start: 1328, end: 1350, imp: true,
      text: 'Neveu de Philippe le Bel, il est choisi comme roi en 1328 : c\'est le <b>premier roi Valois</b>. Le roi d\'Angleterre Édouard III réclame aussi la couronne : en 1337 commence la <b>guerre de Cent Ans</b>. En 1348, la <b>peste noire</b> frappe le royaume.' },
    { id: 'jean2', name: 'Jean II le Bon', dyn: 'valo', king: true, start: 1350, end: 1364,
      text: 'Fils de Philippe VI. Il est <b>fait prisonnier</b> par les Anglais à la bataille de Poitiers (1356) et emmené à Londres.',
      know: 'Pour payer sa rançon, on fabrique une nouvelle pièce de monnaie : le <b>franc</b>.' },
    { id: 'charles5', name: 'Charles V le Sage', dyn: 'valo', king: true, start: 1364, end: 1380,
      text: 'Fils de Jean le Bon. Avec le connétable <b>Bertrand Du Guesclin</b>, il reprend aux Anglais une grande partie du royaume. Il réunit une grande bibliothèque au Louvre.' },
    { id: 'charles6', name: 'Charles VI', dyn: 'valo', king: true, start: 1380, end: 1422,
      text: 'Fils de Charles V. Il devient <b>fou</b> en 1392. Le royaume est déchiré par une guerre civile, et les Anglais gagnent la bataille d\'<b>Azincourt</b> (1415).',
      know: 'On le surnommait « le Bien-Aimé » au début de son règne, puis « le Fou ».' },
    { id: 'charles7', name: 'Charles VII', dyn: 'valo', king: true, start: 1422, end: 1461, imp: true,
      text: 'Aidé par <b>Jeanne d\'Arc</b>, il est sacré à Reims en 1429. À la fin de son règne, les Anglais sont chassés du royaume (sauf de Calais) : c\'est la <b>fin de la guerre de Cent Ans</b> (1453).' },
    { id: 'louis11', name: 'Louis XI', dyn: 'valo', king: true, start: 1461, end: 1483,
      text: 'Fils de Charles VII. Roi rusé, il agrandit le royaume (Bourgogne, Picardie, Provence…) et lutte contre le puissant duc de Bourgogne, Charles le Téméraire.',
      know: 'On le surnommait « l\'universelle aragne » (l\'araignée) car il tissait sa toile pour piéger ses ennemis.' },
    { id: 'charles8', name: 'Charles VIII', dyn: 'valo', king: true, start: 1483, end: 1498,
      text: 'Fils de Louis XI. Il épouse <b>Anne de Bretagne</b> (1491), puis part à la conquête de l\'Italie. Le Moyen Âge se termine pendant son règne. Il meurt sans enfant.',
      know: 'Il est mort après s\'être cogné la tête contre le haut d\'une porte, au château d\'Amboise.' },
    { id: 'louisorleans', name: 'Louis d\'Orléans', dyn: 'valo', king: false, role: 'duc d\'Orléans',
      text: 'Frère de Charles VI. Il est assassiné en 1407 sur l\'ordre du duc de Bourgogne, ce qui déclenche une guerre civile. Deux de ses descendants deviendront rois : <b>Louis XII</b> et <b>François Ier</b>.' },
    { id: 'charlesorleans', name: 'Charles d\'Orléans', dyn: 'valo', king: false, role: 'duc et poète',
      text: 'Fils de Louis d\'Orléans. Fait prisonnier à la bataille d\'Azincourt (1415), il reste 25 ans en Angleterre, où il écrit de nombreux poèmes. Son fils devient le roi Louis XII.' },
    { id: 'jeanangouleme', name: 'Jean d\'Angoulême', dyn: 'valo', king: false, role: 'comte d\'Angoulême',
      text: 'Frère de Charles d\'Orléans. C\'est le grand-père du roi François Ier.' },
    { id: 'charlesangouleme', name: 'Charles d\'Angoulême', dyn: 'valo', king: false, role: 'comte d\'Angoulême',
      text: 'Fils de Jean d\'Angoulême et père de François Ier. Il meurt quand son fils est encore tout petit.' },
    { id: 'louis12', name: 'Louis XII', dyn: 'valo', king: true, start: 1498, end: 1515,
      text: 'Cousin de Charles VIII, mort sans enfant. Il épouse à son tour <b>Anne de Bretagne</b> et poursuit les guerres en Italie.',
      know: 'On l\'a surnommé « le Père du peuple » parce qu\'il avait baissé les impôts.' },
    { id: 'francois1', name: 'François Ier', dyn: 'valo', king: true, start: 1515, end: 1547, imp: true,
      text: 'Le roi de la <b>Renaissance</b>. Vainqueur à <b>Marignan</b> (1515), il fait venir des artistes italiens comme <b>Léonard de Vinci</b> et fait construire le château de <b>Chambord</b>. En 1539, il impose le <b>français</b> à la place du latin dans les actes officiels (ordonnance de Villers-Cotterêts).' },
    { id: 'henri2', name: 'Henri II', dyn: 'valo', king: true, start: 1547, end: 1559,
      text: 'Fils de François Ier. Il meurt après avoir été blessé à l\'œil par une lance, pendant un tournoi.' },
    { id: 'francois2', name: 'François II', dyn: 'valo', king: true, start: 1559, end: 1560,
      text: 'Fils aîné d\'Henri II. Il devient roi à 15 ans et meurt un an et demi plus tard. Il était marié à Marie Stuart, reine d\'Écosse.' },
    { id: 'charles9', name: 'Charles IX', dyn: 'valo', king: true, start: 1560, end: 1574,
      text: 'Frère de François II, il devient roi à 10 ans : sa mère, <b>Catherine de Médicis</b>, gouverne pour lui. Son règne est marqué par les <b>guerres de Religion</b> entre catholiques et protestants, et par le massacre de la Saint-Barthélemy (1572).' },
    { id: 'henri3', name: 'Henri III', dyn: 'valo', king: true, start: 1574, end: 1589,
      text: '<b>Dernier roi Valois</b>, frère de Charles IX. Les guerres de Religion continuent. Il est assassiné en 1589 et, comme il n\'a pas d\'enfant, la couronne passe à son lointain cousin Henri de Navarre.' },
    // Bourbons
    { id: 'antoinebourbon', name: 'Antoine de Bourbon', dyn: 'bourbon', king: false, role: 'roi de Navarre',
      text: 'Lointain descendant de Saint Louis (par Robert de Clermont, un fils de Saint Louis). Il devient roi de Navarre, un petit royaume des Pyrénées, en épousant Jeanne d\'Albret. C\'est le père d\'Henri IV.' },
    { id: 'henri4', name: 'Henri IV', dyn: 'bourbon', king: true, start: 1589, end: 1610, imp: true,
      text: '<b>Premier roi Bourbon</b>. Protestant, il se convertit au catholicisme pour être accepté comme roi (1593). Par l\'<b>édit de Nantes</b> (1598), il autorise les protestants à pratiquer leur religion : c\'est la fin des guerres de Religion. Il est assassiné par Ravaillac en 1610.',
      know: 'On raconte qu\'il souhaitait que chaque paysan puisse manger « la poule au pot » le dimanche.' },
    { id: 'louis13', name: 'Louis XIII', dyn: 'bourbon', king: true, start: 1610, end: 1643,
      text: 'Fils d\'Henri IV, il devient roi à 8 ans. Avec son ministre, le <b>cardinal de Richelieu</b>, il renforce le pouvoir du roi face aux grands seigneurs et aux protestants.',
      know: 'C\'est le roi du roman <i>Les Trois Mousquetaires</i>, d\'Alexandre Dumas.' },
    { id: 'monsieur', name: 'Philippe d\'Orléans (« Monsieur »)', dyn: 'orleans', king: false, role: 'frère de Louis XIV',
      text: 'Frère cadet de Louis XIV, qu\'on appelait simplement « Monsieur ». C\'est l\'ancêtre de la famille d\'<b>Orléans</b>, d\'où viendra le roi Louis-Philippe.' },
    { id: 'louis14', name: 'Louis XIV', dyn: 'bourbon', king: true, start: 1643, end: 1715, imp: true,
      text: 'Roi à 4 ans, il règne <b>72 ans</b> : c\'est le plus long règne de l\'histoire de France. Il gouverne seul, avec tous les pouvoirs (la <b>monarchie absolue</b>), et installe la cour au château de <b>Versailles</b> en 1682.',
      know: 'On l\'appelle le « <b>Roi-Soleil</b> » : il avait choisi le soleil comme emblème, car tout tourne autour de lui.' },
    { id: 'granddauphin', name: 'Louis, le Grand Dauphin', dyn: 'bourbon', king: false, role: 'dauphin',
      text: 'Fils de Louis XIV. Le <b>dauphin</b> est l\'héritier du trône, mais il meurt avant son père, en 1711.' },
    { id: 'bourgogne', name: 'Louis, duc de Bourgogne', dyn: 'bourbon', king: false, role: 'dauphin',
      text: 'Petit-fils de Louis XIV. Il meurt lui aussi avant le vieux roi, en 1712. C\'est son fils, un enfant de 5 ans, qui devient le roi Louis XV.' },
    { id: 'regent', name: 'Philippe d\'Orléans (le Régent)', dyn: 'orleans', king: false, role: 'régent',
      text: 'Fils de « Monsieur ». Il gouverne la France pendant l\'enfance de Louis XV : c\'est la <b>Régence</b> (1715-1723).' },
    { id: 'louis15', name: 'Louis XV', dyn: 'bourbon', king: true, start: 1715, end: 1774,
      text: 'Arrière-petit-fils de Louis XIV, il devient roi à 5 ans. Surnommé d\'abord « le Bien-Aimé », il devient peu à peu impopulaire. Après la guerre de Sept Ans, la France perd le <b>Canada</b> et presque tous ses comptoirs en Inde (1763).' },
    { id: 'louisorleans2', name: 'Louis d\'Orléans (le Pieux)', dyn: 'orleans', king: false, role: 'duc d\'Orléans',
      text: 'Fils du Régent. Très croyant, il passe la fin de sa vie à étudier dans une abbaye.' },
    { id: 'dauphinlouis', name: 'Louis, dauphin de France', dyn: 'bourbon', king: false, role: 'dauphin',
      text: 'Fils de Louis XV. Il meurt avant son père, en 1765. Trois de ses fils deviendront rois : <b>Louis XVI</b>, <b>Louis XVIII</b> et <b>Charles X</b>.' },
    { id: 'lpgros', name: 'Louis-Philippe d\'Orléans (le Gros)', dyn: 'orleans', king: false, role: 'duc d\'Orléans',
      text: 'Fils de Louis d\'Orléans et grand-père du roi Louis-Philippe.' },
    { id: 'egalite', name: 'Philippe Égalité', dyn: 'orleans', king: false, role: 'duc d\'Orléans',
      text: 'Cousin de Louis XVI. Il soutient la Révolution et prend le nom de « Philippe Égalité ». Il vote la mort du roi, mais il est lui-même guillotiné en 1793. C\'est le père du roi Louis-Philippe.' },
    { id: 'louis16', name: 'Louis XVI', dyn: 'bourbon', king: true, start: 1774, end: 1792, imp: true,
      text: 'Petit-fils de Louis XV. Le royaume manque d\'argent : en 1789, il réunit les <b>États généraux</b>, et c\'est le début de la <b>Révolution française</b>. La monarchie est abolie en 1792 ; Louis XVI est <b>guillotiné</b> le 21 janvier 1793.',
      know: 'Son épouse était la reine <b>Marie-Antoinette</b>, née en Autriche.' },
    { id: 'louis17', name: 'Louis XVII', dyn: 'bourbon', king: false, role: 'n\'a jamais régné',
      text: 'Fils de Louis XVI. Pour les partisans du roi, il devient roi à la mort de son père. Mais il est enfermé en prison et meurt à 10 ans, en 1795, <b>sans avoir jamais régné</b>.',
      know: 'C\'est pour cela que le roi suivant s\'appelle Louis <b>XVIII</b> et non Louis XVII !' },
    { id: 'napoleon', name: 'Napoléon Ier', dyn: 'empire', king: true, emperor: true, start: 1804, end: 1814, imp: true,
      reign: 'Empereur de 1804 à 1814, puis pendant les Cent-Jours en 1815',
      text: 'Général de la Révolution, Napoléon Bonaparte prend le pouvoir en 1799, puis se fait sacrer <b>empereur des Français</b> en 1804 : ce n\'est <b>pas un roi</b>. Il conquiert une grande partie de l\'Europe et crée le Code civil. Battu, il abdique en 1814, revient au pouvoir pendant les <b>Cent-Jours</b> (1815), puis il est vaincu à <b>Waterloo</b> et exilé sur l\'île de Sainte-Hélène.',
      know: 'Il n\'appartient à aucune famille de rois : c\'est pour cela qu\'il n\'apparaît dans aucun arbre.' },
    { id: 'louis18', name: 'Louis XVIII', dyn: 'bourbon', king: true, start: 1814, end: 1824,
      reign: 'Roi de 1814 à 1824 (sauf pendant les Cent-Jours, en 1815)',
      text: 'Frère de Louis XVI. Il revient en France après la chute de Napoléon : c\'est la <b>Restauration</b> (le retour des rois). Il accepte une <b>Charte</b> qui limite son pouvoir. Quand Napoléon revient en 1815, il doit s\'enfuir pendant cent jours.' },
    { id: 'charles10', name: 'Charles X', dyn: 'bourbon', king: true, start: 1824, end: 1830,
      text: 'Dernier frère de Louis XVI. Il veut revenir à l\'ancienne monarchie et se fait sacrer à Reims. En juillet 1830, une révolution, les « <b>Trois Glorieuses</b> », le chasse du pouvoir.',
      know: 'C\'est le dernier roi de France à avoir été sacré à Reims (1825).' },
    { id: 'louisphilippe', name: 'Louis-Philippe Ier', dyn: 'orleans', king: true, start: 1830, end: 1848, imp: true,
      text: 'Cousin de Charles X. Après la révolution de 1830, il devient « <b>roi des Français</b> » (et non plus « roi de France »). En février 1848, une nouvelle révolution le renverse : c\'est le <b>dernier roi de France</b>. La Deuxième République est proclamée.',
      know: 'Après lui, la France aura encore un empereur, Napoléon III (de 1852 à 1870), mais plus jamais de roi.' }
];
const FRR_P = {};
FRR_PERSONS.forEach(p => { FRR_P[p.id] = p; });
// Les rois dans l'ordre chronologique (pour ◀ ▶)
const FRR_KINGS = FRR_PERSONS.filter(p => p.king).sort((a, b) => a.start - b.start || (a.half ? 1 : 0) - (b.half ? 1 : 0));
const FRR_GUIDE = ['clovis', 'dagobert', 'pepin', 'charlemagne', 'charles2', 'hugues', 'philippe2', 'louis9', 'philippe4',
    'philippe6', 'charles5', 'charles7', 'louis11', 'francois1', 'henri4', 'louis13', 'louis14', 'louis15', 'louis16',
    'napoleon', 'louis18', 'charles10', 'louisphilippe'];

// ── Les grands événements ────────────────────────────────────────────────
const FRR_EVENTS = [
    { y: 476, imp: true, ico: '🏛️', short: 'Fin de l\'Empire romain d\'Occident',
      text: 'Le dernier empereur romain d\'Occident est renversé. Les historiens ont choisi cette date pour marquer le <b>début du Moyen Âge</b>.' },
    { y: 496, ico: '✝️', short: 'Baptême de Clovis',
      text: 'Vers 496 (la date exacte est discutée), Clovis se fait <b>baptiser à Reims</b> par l\'évêque Remi, avec des milliers de guerriers. Il obtient le soutien de l\'Église.' },
    { y: 732, ico: '⚔️', short: 'Bataille de Poitiers',
      text: '<b>Charles Martel</b> arrête près de Poitiers une armée venue d\'Al-Andalus (l\'Espagne musulmane).' },
    { y: 800, imp: true, ico: '👑', short: 'Charlemagne empereur',
      text: 'Le jour de Noël de l\'an 800, le pape couronne <b>Charlemagne empereur</b> à Rome.' },
    { y: 843, ico: '📜', short: 'Traité de Verdun',
      text: 'Les trois petits-fils de Charlemagne <b>se partagent l\'empire</b>. La partie de l\'ouest, donnée à Charles le Chauve, deviendra la France.' },
    { y: 911, ico: '⛵', short: 'Naissance de la Normandie',
      text: 'Le roi Charles le Simple donne à <b>Rollon</b>, chef des Vikings, une région autour de Rouen : ce sera la <b>Normandie</b>, « le pays des hommes du Nord ».' },
    { y: 987, imp: true, ico: '🗳️', short: 'Hugues Capet élu roi',
      text: 'Après la mort de Louis V, les grands seigneurs <b>élisent Hugues Capet</b> : c\'est le début des Capétiens.' },
    { y: 1096, ico: '🛡️', short: 'Première croisade',
      text: 'Des chevaliers d\'Occident partent vers <b>Jérusalem</b>, à l\'appel du pape. Ils prennent la ville en 1099.' },
    { y: 1214, ico: '⚔️', short: 'Bataille de Bouvines',
      text: '<b>Philippe Auguste</b> bat l\'empereur germanique et ses alliés. Cette victoire renforce beaucoup le pouvoir du roi de France.' },
    { y: 1337, imp: true, ico: '🏹', short: 'Début de la guerre de Cent Ans',
      text: 'Le roi d\'Angleterre <b>Édouard III</b> réclame la couronne de France. La guerre dure de 1337 à 1453 : plus de cent ans, avec de longues trêves.' },
    { y: 1348, ico: '☠️', short: 'La peste noire',
      text: 'Une terrible épidémie de <b>peste</b> arrive en France. En quelques années, elle tue entre un tiers et la moitié des habitants de l\'Europe.' },
    { y: 1429, ico: '🚩', short: 'Jeanne d\'Arc à Orléans',
      text: '<b>Jeanne d\'Arc</b> délivre la ville d\'Orléans, assiégée par les Anglais, puis fait sacrer Charles VII à Reims.' },
    { y: 1453, ico: '🕊️', short: 'Fin de la guerre de Cent Ans',
      text: 'Après la bataille de Castillon, les Anglais ne gardent plus en France que la ville de Calais : c\'est la <b>fin de la guerre de Cent Ans</b>.' },
    { y: 1492, imp: true, ico: '🌎', short: 'Colomb atteint l\'Amérique',
      text: '<b>Christophe Colomb</b> arrive en Amérique. Les historiens choisissent souvent cette date pour marquer la <b>fin du Moyen Âge</b>.' },
    { y: 1515, ico: '🐎', short: 'Bataille de Marignan',
      text: 'Au début de son règne, <b>François Ier</b> remporte une grande victoire en Italie, à Marignan.' },
    { y: 1572, ico: '🕯️', short: 'Massacre de la Saint-Barthélemy',
      text: 'Pendant les <b>guerres de Religion</b>, des milliers de protestants sont massacrés à Paris, puis dans d\'autres villes.' },
    { y: 1598, imp: true, ico: '📜', short: 'Édit de Nantes',
      text: '<b>Henri IV</b> autorise les protestants à pratiquer leur religion dans certains lieux : c\'est la fin des guerres de Religion.' },
    { y: 1682, imp: true, ico: '🏰', short: 'Louis XIV à Versailles',
      text: '<b>Louis XIV</b> installe la cour et le gouvernement au château de <b>Versailles</b>.' },
    { y: 1789, imp: true, ico: '🔥', short: 'Prise de la Bastille',
      text: 'Le 14 juillet 1789, les Parisiens prennent la <b>Bastille</b>, une prison qui était le symbole du pouvoir du roi. La <b>Révolution française</b> a commencé.' },
    { y: 1792, ico: '🇫🇷', short: 'Première République',
      text: 'La monarchie est <b>abolie</b> : la France devient une <b>république</b> (septembre 1792).' },
    { y: 1804, imp: true, ico: '🦅', short: 'Sacre de Napoléon',
      text: 'Napoléon Bonaparte est sacré <b>empereur des Français</b> à Notre-Dame de Paris.' },
    { y: 1815, ico: '⚔️', short: 'Waterloo',
      text: 'Napoléon est définitivement battu à <b>Waterloo</b> (dans l\'actuelle Belgique), puis exilé sur l\'île de Sainte-Hélène.' },
    { y: 1830, ico: '✊', short: 'Les Trois Glorieuses',
      text: 'Trois jours de révolution à Paris (27, 28 et 29 juillet 1830) chassent Charles X. <b>Louis-Philippe</b> devient roi des Français.' },
    { y: 1848, imp: true, ico: '📣', short: 'Fin de la royauté',
      text: 'La révolution de février 1848 renverse Louis-Philippe. La <b>Deuxième République</b> est proclamée : la France n\'aura plus jamais de roi.' }
];

// ── Les arbres généalogiques (parent → enfants) ──────────────────────────
const FRR_TREES = {
    mero: {
        root: 'clovis',
        children: { clovis: ['clotaire1'], clotaire1: ['chilperic1'], chilperic1: ['clotaire2'], clotaire2: ['dagobert'], dagobert: ['faineants'], faineants: ['childeric3'] },
        dashed: { 'faineants>childeric3': true },
        note: 'Le lien de parenté de Childéric III avec les rois précédents est mal connu (trait en pointillés).'
    },
    caro: {
        root: 'charlesmartel',
        children: {
            charlesmartel: ['pepin'], pepin: ['carloman1', 'charlemagne'], charlemagne: ['louis1'],
            louis1: ['lothaire1', 'louisgerm', 'charles2'], louisgerm: ['charlesgros'], charles2: ['louis2'],
            louis2: ['louis3', 'carloman2', 'charles3'], charles3: ['louis4'], louis4: ['lothaire'], lothaire: ['louis5']
        },
        dashed: {},
        note: 'Au traité de Verdun (843), l\'empire est partagé entre les trois fils de Louis le Pieux.'
    },
    cape: {
        root: 'robertfort',
        children: {
            robertfort: ['eudes', 'robert1'], robert1: ['huguesgrand'], huguesgrand: ['hugues'], hugues: ['robert2'],
            robert2: ['henri1'], henri1: ['philippe1'], philippe1: ['louis6'], louis6: ['louis7'], louis7: ['philippe2'],
            philippe2: ['louis8'], louis8: ['louis9'], louis9: ['philippe3'], philippe3: ['philippe4', 'charlesvalois'],
            philippe4: ['louis10', 'philippe5', 'charles4', 'isabelle'], louis10: ['jean1']
        },
        dashed: {},
        note: 'Pendant plus de 300 ans, le fils aîné succède à son père. En 1328, les trois fils de Philippe le Bel sont morts sans fils.'
    },
    valo: {
        root: 'philippe3',
        children: {
            philippe3: ['philippe4', 'charlesvalois'], philippe4: ['isabelle'], isabelle: ['edouard3'],
            charlesvalois: ['philippe6'], philippe6: ['jean2'], jean2: ['charles5'], charles5: ['charles6', 'louisorleans'],
            charles6: ['charles7'], charles7: ['louis11'], louis11: ['charles8'],
            louisorleans: ['charlesorleans', 'jeanangouleme'], charlesorleans: ['louis12'],
            jeanangouleme: ['charlesangouleme'], charlesangouleme: ['francois1'], francois1: ['henri2'],
            henri2: ['francois2', 'charles9', 'henri3']
        },
        dashed: {},
        note: 'En 1328, Philippe de Valois (petit-fils de roi par son père) est choisi plutôt qu\'Édouard III d\'Angleterre (petit-fils de roi par sa mère). Plus tard, Charles VIII meurt sans enfant : la couronne passe à des cousins, Louis XII puis François Ier.'
    },
    bourbon: {
        root: 'antoinebourbon', title: 'Bourbons et Orléans',
        children: {
            antoinebourbon: ['henri4'], henri4: ['louis13'], louis13: ['louis14', 'monsieur'],
            louis14: ['granddauphin'], granddauphin: ['bourgogne'], bourgogne: ['louis15'], louis15: ['dauphinlouis'],
            dauphinlouis: ['louis16', 'louis18', 'charles10'], louis16: ['louis17'],
            monsieur: ['regent'], regent: ['louisorleans2'], louisorleans2: ['lpgros'], lpgros: ['egalite'], egalite: ['louisphilippe']
        },
        dashed: {},
        note: 'Les rois Bourbons et le roi Louis-Philippe (famille d\'Orléans) ont le même grand ancêtre : Louis XIII. Le fils et le petit-fils de Louis XIV meurent avant lui : c\'est son arrière-petit-fils qui devient Louis XV.'
    }
};
// Disposition des arbres (calculée une seule fois) : colonnes et générations
const FRR_LAYOUT = {};
Object.keys(FRR_TREES).forEach(key => {
    const T = FRR_TREES[key], pos = {};
    let leaf = 0, depth = 0;
    (function walk(id, d) {
        depth = Math.max(depth, d);
        const ch = T.children[id] || [];
        if (!ch.length) { pos[id] = { x: leaf++, d }; return pos[id].x; }
        const xs = ch.map(c => walk(c, d + 1));
        pos[id] = { x: (xs[0] + xs[xs.length - 1]) / 2, d };
        return pos[id].x;
    })(T.root, 0);
    FRR_LAYOUT[key] = { pos, cols: leaf, depth: depth + 1 };
});
function _frrTreeOf(id) {
    for (const k of FRR_TREE_ORDER) if (FRR_LAYOUT[k].pos[id]) return k;
    return null;
}
function _frrParentOf(id) {
    for (const k of FRR_TREE_ORDER) {
        const ch = FRR_TREES[k].children;
        for (const p in ch) if (ch[p].indexOf(id) >= 0) return p;
    }
    return null;
}
function _frrChildrenOf(id) {
    const out = [];
    for (const k of FRR_TREE_ORDER) (FRR_TREES[k].children[id] || []).forEach(c => { if (out.indexOf(c) < 0) out.push(c); });
    return out;
}
function _frrColor(p) { return FRR_DYN[p.dyn] ? FRR_DYN[p.dyn].color : FRR_OTHER_COLOR[p.dyn] || '#9aa0a6'; }
function _frrZoomFor(p) {
    if (!p || p.start === undefined) return 'all';
    if (FRR_DYN[p.dyn]) return p.dyn;
    if (p.dyn === 'empire') return 'orleans';
    return p.start < 987 ? 'caro' : 'cape';
}
// Rois dont le nom est écrit (et la barre bien visible) quand on zoome sur une dynastie
function _frrInZoom(k, z) {
    if (z === 'all') return true;
    if (z === 'orleans') return k.start >= 1774;      // de la Révolution à 1848
    return _frrZoomFor(k) === z;
}
function _frrHex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function _frrMix(a, b, k) {
    const A = _frrHex(a), B = _frrHex(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`;
}
function _frrRoman(n) {
    const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
    return s;
}
function _frrReignText(p) {
    if (p.start === undefined) return '';
    if (p.reign) return p.reign;
    if (p.id === 'jean1') return 'Roi pendant 5 jours, en novembre 1316';
    const n = p.end - p.start;
    if (p.group) return `De ${p.start} à ${p.end} (environ ${Math.round(n / 10) * 10} ans)`;
    return `Roi de ${p.start} à ${p.end} (${n < 1 ? 'moins d\'un an' : n + ' an' + (n > 1 ? 's' : '')} de règne)`;
}

// ── Création du widget ────────────────────────────────────────────────────
function createFriseRoisWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'frise-rois';
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
    container.className = 'frr-container';
    container.dataset.mode = 'frise';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(820, Math.min(1240, Math.round(window.innerWidth * 0.72)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(580, Math.round(contW * 0.62));

    const header = document.createElement('div');
    header.className = 'frr-header';
    header.innerHTML = `
        <span class="frr-title">👑<span> Les rois de France</span></span>
        <div class="frr-tabs">
            <button class="frr-tab on" data-mode="frise" title="La frise des rois"><span class="frr-tab-long">📜 La frise</span><span class="frr-tab-short">📜 Frise</span></button>
            <button class="frr-tab" data-mode="arbre" title="L'arbre généalogique"><span class="frr-tab-long">👪 L'arbre généalogique</span><span class="frr-tab-short">👪 Arbre</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'frr-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Ligne 1 : navigation entre les rois, visite guidée, options
    const row1 = document.createElement('div');
    row1.className = 'frr-row';
    row1.innerHTML = `
        <button class="frr-btn frr-prev" title="Roi précédent">◀ Roi précédent</button>
        <button class="frr-btn frr-next" title="Roi suivant">Roi suivant ▶</button>
        <button class="frr-btn frr-btn-guide" title="Présente les grands rois l'un après l'autre">🎓 Visite guidée</button>
        <span class="frr-sep frr-only-frise"></span>
        <button class="frr-btn frr-names frr-only-frise" title="Écrire le nom de tous les rois sur la frise générale">👑 Tous les noms</button>
        <button class="frr-btn frr-events frr-only-frise on" title="Afficher les grands événements">📌 Événements</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : dynasties (zoom de la frise / choix de l'arbre)
    const row2 = document.createElement('div');
    row2.className = 'frr-row';
    row2.innerHTML = `
        <span class="frr-lbl frr-only-frise">Zoom :</span>
        <span class="frr-lbl frr-only-arbre">Arbre :</span>
        <button class="frr-btn frr-dyn frr-only-frise" data-dyn="all" style="--st-c:#a16207" title="Toute la frise, de Clovis à Louis-Philippe">🌐 Tout</button>
        ${FRR_DYN_ORDER.map(k => `<button class="frr-btn frr-dyn${FRR_TREES[k] ? '' : ' frr-only-frise'}" data-dyn="${k}" style="--st-c:${FRR_DYN[k].color}" title="${FRR_DYN[k].name} (${FRR_DYN[k].dates})">${FRR_DYN[k].name}</button>`).join('')}
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'frr-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'frr-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'frr-canvas';
    const hint = document.createElement('div');
    hint.className = 'frr-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'frr-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'frr-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les rois de France, de Clovis à Louis-Philippe</h4>
        <p><b>📜 La frise</b> montre les rois de 481 à 1848. Chaque couleur est une <b>dynastie</b> (une famille de rois) ;
        les périodes sans roi (République, Empire) sont en gris.
        Les boutons de dynastie font un <b>zoom</b> sur cette dynastie ; <b>🌐 Tout</b> revient à toute la frise.
        <b>👑 Tous les noms</b> écrit le nom de chaque roi sur la frise générale, <b>📌 Événements</b> affiche les grandes dates.</p>
        <p><b>👪 L'arbre généalogique</b> montre les liens de parenté dans chaque dynastie. Les cases colorées sont des rois
        de France ; les cases blanches, des personnes qui n'ont pas été rois de France. Fais <b>glisser</b> l'arbre vers le haut
        ou le bas pour le faire défiler.</p>
        <p><b>Touche un roi</b>, une dynastie ou un événement pour afficher sa fiche. <b>◀ ▶</b> passent d'un roi à l'autre,
        <b>🎓 Visite guidée</b> présente les grands rois toute seule.</p>
        <p style="color:#888">Au début du Moyen Âge, le royaume était souvent partagé entre plusieurs rois : la frise ne montre que
        les principaux. Napoléon Ier, empereur et non roi, est aussi sur la frise.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'frr-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const prevBtn = $('.frr-prev'), nextBtn = $('.frr-next'), guideBtn = $('.frr-btn-guide');
    const namesBtn = $('.frr-names'), eventsBtn = $('.frr-events');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'frise';
    let zoomDyn = 'all', treeDyn = 'cape';
    let view0 = FRR_RANGES.all[0], view1 = FRR_RANGES.all[1];
    let sel = null;                 // { k: 'p' | 'd' | 'e', id }
    let showAllNames = false, showEvents = true;
    let guided = false, guideT = 0, guideIdx = 0;
    let treePan = 0, pendingScroll = null, treeMaxPan = 0;
    let animId = null, lastT = 0, drawPending = false;
    let cssW = 0, cssH = 0, dpr = 1;
    let hits = [];                  // zones touchables : { k, id, x, y, w, h } ou rotées { rot: true, ax, ay, ang }

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
    const selP = () => sel && sel.k === 'p' ? FRR_P[sel.id] : null;

    // =====================================================================
    //  LA FRISE
    // =====================================================================
    function drawFrise() {
        const W = cssW, H = cssH;
        const padL = 14, padR = 14;
        const y0 = view0, y1 = view1;
        const xOf = yr => padL + (yr - y0) / (y1 - y0) * (W - padL - padR);
        const fs = Math.max(10.5, Math.min(15, W / 70));
        const yLab = H * 0.465, kT = H * 0.49, kB = H * 0.58, dT = H * 0.595, dB = H * 0.67, eT = H * 0.683, eB = H * 0.728, ax = H * 0.745;
        const sp = selP();
        hits = [];

        ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, W, H);

        // Siècles : colonnes alternées et numéros en chiffres romains
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let c = Math.floor(y0 / 100); c * 100 < y1; c++) {
            const a = xOf(c * 100), b = xOf(c * 100 + 100);
            if (c % 2) { ctx.fillStyle = 'rgba(140,100,40,0.07)'; ctx.fillRect(a, 0, b - a, ax); }
            const ca = Math.max(a, padL), cb = Math.min(b, W - padR);
            ctx.font = `800 ${Math.round(fs * 0.9)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = 'rgba(122,75,18,0.55)';
            const cl = _frrRoman(c + 1) + 'ᵉ' + (cb - ca > fs * 4.6 ? ' s.' : '');
            if (ctx.measureText(cl).width < cb - ca - 4) ctx.fillText(cl, (ca + cb) / 2, 6);
        }

        // Rois : une barre par règne
        const kingBar = (k, i) => {
            if (k.end < y0 || k.start > y1) return null;
            let a = xOf(k.start), b = xOf(Math.max(k.end, k.start + 0.3));
            if (b - a < 2) { const m = (a + b) / 2; a = m - 1; b = m + 1; }
            let t = kT, bt = kB;
            if (k.half === 'top') bt = (kT + kB) / 2;
            if (k.half === 'bot') t = (kT + kB) / 2;
            const base = _frrColor(k);
            ctx.globalAlpha = _frrInZoom(k, zoomDyn) ? 1 : 0.4;
            ctx.fillStyle = i % 2 ? _frrMix(base, '#ffffff', 0.28) : base;
            ctx.fillRect(a, t, b - a, bt - t);
            if (k.group) {      // rayures pour les « rois fainéants »
                ctx.save(); ctx.beginPath(); ctx.rect(a, t, b - a, bt - t); ctx.clip();
                ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3;
                for (let x = a - (bt - t); x < b; x += 9) { ctx.beginPath(); ctx.moveTo(x, bt); ctx.lineTo(x + (bt - t), t); ctx.stroke(); }
                ctx.restore();
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1;
            ctx.strokeRect(a + 0.5, t + 0.5, Math.max(1, b - a - 1), bt - t - 1);
            ctx.globalAlpha = 1;
            if (sp && sp.id === k.id) {
                ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3;
                ctx.strokeRect(a - 1.5, t - 3, b - a + 3, bt - t + 6);
            }
            hits.push({ k: 'p', id: k.id, x: a - 4, y: t - 4, w: b - a + 8, h: bt - t + 8 });
            return { a, b };
        };
        const bars = {};
        FRR_KINGS.forEach((k, i) => { if (!k.half) bars[k.id] = kingBar(k, i); });
        FRR_KINGS.forEach((k, i) => { if (k.half) bars[k.id] = kingBar(k, i); });

        // Dynasties
        ctx.textBaseline = 'middle';
        const blocks = [];
        for (const key of FRR_DYN_ORDER) (FRR_DYN[key].segs || [[FRR_DYN[key].start, FRR_DYN[key].end]]).forEach(sg => blocks.push({ k: 'd', id: key, D: FRR_DYN[key], s: sg[0], e: sg[1] }));
        FRR_GAPS.forEach((g, i) => blocks.push({ k: 'g', id: i, D: g, s: g.start, e: g.end }));
        for (const bl of blocks) {
            const key = bl.id, D = bl.D;
            if (bl.e < y0 || bl.s > y1) continue;
            const a = xOf(Math.max(bl.s, y0)), b = xOf(Math.min(bl.e, y1));
            const on = sel && sel.k === bl.k && sel.id === key;
            ctx.fillStyle = D.light; roundRect(a + 1, dT, b - a - 2, dB - dT, 6); ctx.fill();
            ctx.strokeStyle = D.color; ctx.lineWidth = on ? 3.5 : 2; ctx.stroke();
            ctx.font = `900 ${Math.round(fs * 1.05)}px 'Segoe UI', system-ui, sans-serif`;
            const txt = D.name + (zoomDyn !== 'all' || b - a > fs * 12 ? ` (${bl.s} – ${bl.e})` : '');
            ctx.fillStyle = D.color; ctx.textAlign = 'center';
            const tw = ctx.measureText(txt).width;
            if (tw < b - a - 8) ctx.fillText(txt, (a + b) / 2, (dT + dB) / 2 + 1);
            else {
                ctx.font = `900 ${Math.round(fs * 0.85)}px 'Segoe UI', system-ui, sans-serif`;
                if (ctx.measureText(D.name).width < b - a - 6) ctx.fillText(D.name, (a + b) / 2, (dT + dB) / 2 + 1);
            }
            if (bl.e > y1) { ctx.textAlign = 'right'; ctx.font = `800 ${Math.round(fs * 0.8)}px 'Segoe UI', system-ui, sans-serif`; ctx.fillText('→', b - 6, (dT + dB) / 2 + 1); }
            hits.push({ k: bl.k, id: key, x: a, y: dT, w: b - a, h: dB - dT });
        }

        // Grandes périodes
        const eras = [[y0 - 1, 476, 'Antiquité', '#b9b3a8'], [476, 1492, 'Le Moyen Âge (476 – 1492)', '#8d6e63'],
                      [1492, 1789, 'Les Temps modernes (1492 – 1789)', '#7d8fa3'], [1789, y1 + 1, 'L\'époque contemporaine', '#6b9080']];
        for (const [s, e, n, c] of eras) {
            if (e < y0 || s > y1) continue;
            const a = xOf(Math.max(s, y0)), b = xOf(Math.min(e, y1));
            if (b - a < 1) continue;
            ctx.fillStyle = c; ctx.fillRect(a, eT, b - a, eB - eT);
            ctx.font = `800 ${Math.round(fs * 0.85)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
            let label = n;
            if (ctx.measureText(label).width > b - a - 6) label = n.replace(/ \(.*\)/, '');
            if (ctx.measureText(label).width > b - a - 6) label = label.replace(/^(Le |Les |L')/, '');
            if (ctx.measureText(label).width < b - a - 6) ctx.fillText(label, (a + b) / 2, (eT + eB) / 2 + 1);
        }

        // Axe du temps
        const span = y1 - y0;
        const major = span > 500 ? 100 : 50, minor = span > 500 ? 50 : 10;
        ctx.strokeStyle = '#5b4a3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padL, ax); ctx.lineTo(W - padR, ax); ctx.stroke();
        ctx.font = `700 ${Math.round(fs * 0.85)}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillStyle = '#5b4a3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let yr = Math.ceil(y0 / minor) * minor; yr <= y1; yr += minor) {
            const x = xOf(yr), mj = yr % major === 0;
            ctx.lineWidth = mj ? 2 : 1;
            ctx.beginPath(); ctx.moveTo(x, ax - (mj ? 6 : 3)); ctx.lineTo(x, ax + (mj ? 6 : 3)); ctx.stroke();
            if (mj) ctx.fillText(String(yr), x, ax + 8);
        }

        // Noms des rois : étiquettes inclinées, écartées pour ne pas se chevaucher
        const ang = -55 * Math.PI / 180, cosA = Math.cos(ang), sinA = Math.sin(ang);
        const labels = [];
        FRR_KINGS.forEach(k => {
            const bb = bars[k.id];
            if (!bb) return;
            const inZoom = zoomDyn === 'all' ? (showAllNames || k.imp) : _frrInZoom(k, zoomDyn);
            if (!(inZoom || (sp && sp.id === k.id))) return;
            const on = sp && sp.id === k.id;
            ctx.font = `${on ? 900 : 700} ${Math.round(fs)}px 'Segoe UI', system-ui, sans-serif`;
            const w = ctx.measureText(k.name).width + 6;
            const cx = (Math.max(bb.a, padL) + Math.min(bb.b, W - padR)) / 2;
            labels.push({ k, cx, lx: cx, w, on, max: W - 4 - w * cosA });
        });
        labels.sort((a, b) => a.cx - b.cx);
        const gap = fs * 1.8;
        for (let i = 0; i < labels.length; i++) labels[i].lx = Math.max(labels[i].cx, i ? labels[i - 1].lx + gap : padL);
        for (let i = labels.length - 1; i >= 0; i--) {
            labels[i].lx = Math.min(labels[i].lx, labels[i].max);
            if (i < labels.length - 1) labels[i].lx = Math.min(labels[i].lx, labels[i + 1].lx - gap);
        }
        for (let i = 0; i < labels.length; i++) labels[i].lx = Math.max(labels[i].lx, i ? labels[i - 1].lx + gap * 0.6 : padL);
        for (const L of labels) {
            const col = _frrMix(_frrColor(L.k), '#000000', 0.25);
            ctx.strokeStyle = _frrMix(_frrColor(L.k), '#ffffff', 0.3); ctx.lineWidth = L.on ? 2 : 1.2;
            ctx.beginPath(); ctx.moveTo(L.cx, kT); ctx.lineTo(L.cx, kT - 6); ctx.lineTo(L.lx, yLab + 2); ctx.stroke();
            ctx.save();
            ctx.translate(L.lx, yLab); ctx.rotate(ang);
            ctx.font = `${L.on ? 900 : 700} ${Math.round(L.on ? fs * 1.08 : fs)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            if (L.on) { ctx.fillStyle = 'rgba(255,230,150,0.9)'; roundRect(0, -fs * 0.75, L.w + 4, fs * 1.5, 5); ctx.fill(); }
            ctx.fillStyle = col;
            ctx.fillText(L.k.name, 3, 1);
            ctx.restore();
            hits.push({ k: 'p', id: L.k.id, rot: true, ax: L.lx, ay: yLab, ang, w: L.w + 6, h: fs * 1.6 });
        }

        // Grands événements, sous l'axe
        if (showEvents) {
            const rowsY = [H * 0.81, H * 0.86, H * 0.91];
            const lastEnd = [-Infinity, -Infinity, -Infinity];
            ctx.font = `700 ${Math.round(fs * 0.85)}px 'Segoe UI', system-ui, sans-serif`;
            const evH = fs * 1.45;
            FRR_EVENTS.forEach((ev, i) => {
                if (ev.y < y0 || ev.y > y1) return;
                const on = sel && sel.k === 'e' && sel.id === i;
                if (zoomDyn === 'all' && !ev.imp && !on) return;
                const x = xOf(ev.y);
                const txt = zoomDyn === 'all' ? `${ev.ico} ${ev.y}` : `${ev.ico} ${ev.y} · ${ev.short}`;
                const w = ctx.measureText(txt).width + 12;
                // première ligne où l'étiquette tient à sa place ; sinon la ligne la plus libre
                const want = Math.max(4, Math.min(W - 4 - w, x - w / 2));
                let r = lastEnd.findIndex(e => e + 4 <= want);
                if (r < 0) r = lastEnd.indexOf(Math.min.apply(null, lastEnd));
                let lx = Math.max(want, lastEnd[r] + 4);
                if (lx + w > W - 4) lx = W - 4 - w;
                lastEnd[r] = lx + w;
                const ly = rowsY[r];
                ctx.strokeStyle = 'rgba(180,83,9,0.7)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(x, ax + 2); ctx.lineTo(x, ax + fs * 1.3); ctx.lineTo(lx + w / 2, ly - evH / 2); ctx.stroke();
                ctx.fillStyle = '#b45309';
                ctx.beginPath(); ctx.moveTo(x, ax - 5); ctx.lineTo(x + 5, ax); ctx.lineTo(x, ax + 5); ctx.lineTo(x - 5, ax); ctx.closePath(); ctx.fill();
                ctx.fillStyle = on ? '#b45309' : '#fffaf0';
                roundRect(lx, ly - evH / 2, w, evH, 7); ctx.fill();
                ctx.strokeStyle = '#d6a76a'; ctx.lineWidth = on ? 2 : 1; ctx.stroke();
                ctx.fillStyle = on ? '#fff' : '#5b3a17'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(txt, lx + w / 2, ly + 1);
                hits.push({ k: 'e', id: i, x: lx - 2, y: ly - evH / 2 - 3, w: w + 4, h: evH + 6 });
                hits.push({ k: 'e', id: i, x: x - 8, y: ax - 8, w: 16, h: 16 });
            });
        }
    }

    // =====================================================================
    //  L'ARBRE GÉNÉALOGIQUE
    // =====================================================================
    function fitName(name, maxW) {
        // Essaie une ligne ; sinon deux lignes coupées au meilleur espace
        for (let f = 14; f >= 11; f--) {
            ctx.font = `800 ${f}px 'Segoe UI', system-ui, sans-serif`;
            if (ctx.measureText(name).width <= maxW) return { lines: [name], f };
        }
        const words = name.split(' ');
        let best = null;
        for (let i = 1; i < words.length; i++) {
            const l1 = words.slice(0, i).join(' '), l2 = words.slice(i).join(' ');
            for (let f = 13; f >= 9; f--) {
                ctx.font = `800 ${f}px 'Segoe UI', system-ui, sans-serif`;
                const w = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width);
                if (w <= maxW) { if (!best || f > best.f) best = { lines: [l1, l2], f }; break; }
            }
        }
        return best || { lines: [name], f: 9 };
    }
    function drawArbre() {
        const W = cssW, H = cssH;
        const T = FRR_TREES[treeDyn], Lay = FRR_LAYOUT[treeDyn], D = FRR_DYN[treeDyn];
        const sp = selP();
        hits = [];
        ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, W, H);

        const legendH = 40;
        const rowH = Math.max(66, Math.min(92, H / 6.5));
        const nodeH = Math.round(rowH * 0.7);
        const colW = (W - 20) / Lay.cols;
        // largeur de chaque case : autant que la place laissée par ses voisines de la même génération
        const nodeWOf = {};
        const byRow = {};
        for (const id in Lay.pos) (byRow[Lay.pos[id].d] = byRow[Lay.pos[id].d] || []).push(id);
        for (const d in byRow) {
            const ids = byRow[d].sort((a, b) => Lay.pos[a].x - Lay.pos[b].x);
            ids.forEach((id, i) => {
                let room = Infinity;
                if (i > 0) room = Math.min(room, (Lay.pos[id].x - Lay.pos[ids[i - 1]].x) * colW);
                if (i < ids.length - 1) room = Math.min(room, (Lay.pos[ids[i + 1]].x - Lay.pos[id].x) * colW);
                const cx = 10 + (Lay.pos[id].x + 0.5) * colW;          // ne pas déborder des bords
                room = Math.min(room, 2 * (cx - 6), 2 * (W - 16 - cx));
                nodeWOf[id] = Math.max(60, Math.min(200, room - 10, W - 24));
            });
        }
        const contentH = legendH + Lay.depth * rowH + 26;
        treeMaxPan = Math.max(0, contentH - H);
        if (pendingScroll && Lay.pos[pendingScroll]) {
            const cy = legendH + Lay.pos[pendingScroll].d * rowH + nodeH / 2;
            treePan = cy - H / 2;
            pendingScroll = null;
        }
        treePan = Math.max(0, Math.min(treeMaxPan, treePan));
        const offY = contentH < H ? (H - contentH) / 2 : -treePan;
        const N = id => {
            const p = Lay.pos[id];
            return { cx: 10 + (p.x + 0.5) * colW, top: offY + legendH + p.d * rowH };
        };

        // Liens de parenté
        ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const p in T.children) {
            const P = N(p);
            for (const c of T.children[p]) {
                const C = N(c), midY = P.top + nodeH + (rowH - nodeH) / 2;
                ctx.strokeStyle = '#8a7a66';
                ctx.setLineDash(T.dashed[p + '>' + c] ? [6, 5] : []);
                ctx.beginPath();
                ctx.moveTo(P.cx, P.top + nodeH); ctx.lineTo(P.cx, midY); ctx.lineTo(C.cx, midY); ctx.lineTo(C.cx, C.top);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);

        // Cases des personnes
        for (const id in Lay.pos) {
            const p = FRR_P[id], P = N(id), nodeW = nodeWOf[id];
            const x = Math.max(4, Math.min(W - 14 - nodeW, P.cx - nodeW / 2)), y = P.top;
            if (y > H + 10 || y + nodeH < -10) continue;
            const on = sp && sp.id === id;
            const king = p.king;
            const col = _frrColor(p);
            if (on) { ctx.fillStyle = 'rgba(255,214,90,0.7)'; roundRect(x - 6, y - 6, nodeW + 12, nodeH + 12, 14); ctx.fill(); }
            ctx.fillStyle = king ? col : '#ffffff';
            roundRect(x, y, nodeW, nodeH, 10); ctx.fill();
            if (p.group) {
                ctx.save(); roundRect(x, y, nodeW, nodeH, 10); ctx.clip();
                ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4;
                for (let xx = x - nodeH; xx < x + nodeW; xx += 12) { ctx.beginPath(); ctx.moveTo(xx, y + nodeH); ctx.lineTo(xx + nodeH, y); ctx.stroke(); }
                ctx.restore();
            }
            ctx.strokeStyle = king ? _frrMix(col, '#000000', 0.25) : col;
            ctx.lineWidth = on ? 3 : 2;
            ctx.setLineDash(king ? [] : [5, 4]);
            roundRect(x, y, nodeW, nodeH, 10); ctx.stroke();
            ctx.setLineDash([]);
            const nm = fitName((king && !p.group ? '👑 ' : '') + p.name, nodeW - 10);
            const sub = king ? (p.start === p.end ? `roi en ${p.start}` : `roi ${p.start} – ${p.end}`) : (p.role || 'n\'a pas été roi');
            const lines = nm.lines.length;
            const subF = Math.max(9, Math.min(12, nm.f - 1));
            const totalH = lines * nm.f * 1.15 + subF * 1.2;
            let ty = y + (nodeH - totalH) / 2 + nm.f * 0.6;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = king ? '#ffffff' : '#1f2937';
            ctx.font = `800 ${nm.f}px 'Segoe UI', system-ui, sans-serif`;
            for (const l of nm.lines) { ctx.fillText(l, x + nodeW / 2, ty); ty += nm.f * 1.15; }
            ctx.font = `600 ${subF}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = king ? 'rgba(255,255,255,0.9)' : '#6b7280';
            ctx.fillText(sub, x + nodeW / 2, ty - nm.f * 0.15 + subF * 0.45);
            hits.push({ k: 'p', id, x, y, w: nodeW, h: nodeH });
        }

        // Légende (toujours visible en haut)
        ctx.fillStyle = 'rgba(251,247,239,0.95)'; ctx.fillRect(0, 0, W, legendH - 4);
        const fsL = Math.max(10, Math.min(13, W / 75));
        ctx.font = `800 ${Math.round(fsL * 1.15)}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = D.color;
        const title = `👪 ${T.title || D.name}`;
        ctx.fillText(title, 10, legendH / 2 - 2);
        let lx = 10 + ctx.measureText(title).width + 18;
        ctx.font = `600 ${fsL}px 'Segoe UI', system-ui, sans-serif`;
        const leg = (draw, txt) => {
            if (lx + 30 + ctx.measureText(txt).width > W - 8) return;
            draw(lx, legendH / 2 - 2);
            ctx.fillStyle = '#4b5563'; ctx.fillText(txt, lx + 24, legendH / 2 - 2);
            lx += 24 + ctx.measureText(txt).width + 16;
        };
        leg((x, y) => { ctx.fillStyle = D.color; roundRect(x, y - 7, 18, 14, 4); ctx.fill(); }, 'roi de France');
        leg((x, y) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8a7a66'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); roundRect(x, y - 7, 18, 14, 4); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); }, 'pas roi de France');
        if (Object.keys(T.dashed).length) leg((x, y) => { ctx.strokeStyle = '#8a7a66'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18, y); ctx.stroke(); ctx.setLineDash([]); }, 'parenté mal connue');
        ctx.strokeStyle = '#eadfcb'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, legendH - 4); ctx.lineTo(W, legendH - 4); ctx.stroke();

        // Barre de défilement
        if (treeMaxPan > 0) {
            const trackT = legendH, trackH = H - legendH - 24;
            const thumbH = Math.max(30, trackH * H / contentH);
            const thumbY = trackT + (trackH - thumbH) * (treePan / treeMaxPan);
            ctx.fillStyle = 'rgba(0,0,0,0.08)'; roundRect(W - 9, trackT, 5, trackH, 3); ctx.fill();
            ctx.fillStyle = 'rgba(122,75,18,0.55)'; roundRect(W - 9, thumbY, 5, thumbH, 3); ctx.fill();
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.setLineDash([]);
        if (mode === 'frise') drawFrise(); else drawArbre();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    const chip = key => FRR_DYN[key] ? `<span class="frr-chip" style="background:${FRR_DYN[key].color}">${FRR_DYN[key].name}</span>`
        : key === 'robert' ? `<span class="frr-chip" style="background:${FRR_OTHER_COLOR.robert}">Robertiens</span>`
        : key === 'empire' ? `<span class="frr-chip" style="background:${FRR_OTHER_COLOR.empire}">Premier Empire</span>`
        : `<span class="frr-chip" style="background:${FRR_OTHER_COLOR.autre}">Autre famille</span>`;
    function familyHtml(p) {
        const out = [];
        const par = _frrParentOf(p.id);
        if (par) out.push(`${p.female ? 'Fille' : 'Fils'} de <b>${FRR_P[par].name}</b>`);
        else if (p.id === 'childeric3') out.push('Descendant probable des rois mérovingiens');
        const ch = _frrChildrenOf(p.id).map(c => FRR_P[c].name);
        if (ch.length) out.push(`${p.group ? 'Puis' : 'Enfants dans l\'arbre'} : ${ch.join(', ')}`);
        return out.length ? `<p class="frr-family">👪 ${out.join('<br>')}</p>` : '';
    }
    function kingsList(key) {
        return `<ol class="frr-list">${FRR_KINGS.filter(k => k.dyn === key || (key === 'cape' && k.dyn === 'robert')).map(k =>
            `<li><button data-person="${k.id}" class="${sel && sel.k === 'p' && sel.id === k.id ? 'on' : ''}" style="--st-c:${_frrColor(k)}">${k.emperor ? '🦅' : '👑'} ${k.name} <span class="frr-small">${k.start === k.end ? k.start : k.start + ' – ' + k.end}</span></button></li>`).join('')}</ol>`;
    }
    function dynList() {
        return `<ol class="frr-list">${FRR_DYN_ORDER.map(k =>
            `<li><button data-dynasty="${k}" style="--st-c:${FRR_DYN[k].color}">${FRR_DYN[k].name} <span class="frr-small">${FRR_DYN[k].dates}</span></button></li>`).join('')}</ol>`;
    }
    function updateInfo() {
        row2.querySelectorAll('.frr-dyn').forEach(b => b.classList.toggle('on', mode === 'frise' ? b.dataset.dyn === zoomDyn : b.dataset.dyn === treeDyn));
        const key = [mode, sel ? sel.k + ':' + sel.id : '-', mode === 'frise' ? zoomDyn : treeDyn].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const back = `<button class="frr-go" data-action="overview">🔙 Vue d'ensemble</button>`;

        if (sel && sel.k === 'p') {
            const p = FRR_P[sel.id];
            side.style.borderLeftColor = _frrColor(p);
            const tree = _frrTreeOf(p.id);
            const go = mode === 'frise'
                ? (tree ? `<button class="frr-go" data-action="totree">👪 Voir dans l'arbre généalogique</button>` : '')
                : (p.king ? `<button class="frr-go" data-action="tofrise">📜 Voir sur la frise</button>` : '');
            side.innerHTML = `<h4>${p.emperor ? 'Un empereur' : p.king ? (p.group ? 'Des rois' : 'Un roi') : 'Une personne de la famille'} ${chip(p.dyn)}</h4>
                <div class="frr-status" style="color:${_frrMix(_frrColor(p), '#000000', 0.2)}">${p.emperor ? '🦅 ' : p.king && !p.group ? '👑 ' : ''}${p.name}</div>
                ${p.king ? `<p class="frr-reign">📅 ${_frrReignText(p)}</p>` : `<p class="frr-reign">🚫 N'a pas été roi de France${p.role ? ' (' + p.role + ')' : ''}</p>`}
                ${familyHtml(p)}
                <p class="frr-text">${p.text}</p>
                ${p.know ? `<p class="frr-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>` : ''}
                ${go}${back}`;
        } else if (sel && sel.k === 'd') {
            const D = FRR_DYN[sel.id];
            side.style.borderLeftColor = D.color;
            side.innerHTML = `<h4>Une dynastie</h4>
                <div class="frr-status" style="color:${D.color}">${D.name}</div>
                <p class="frr-reign">📅 ${D.dates}</p>
                <p class="frr-text">${D.text}</p>
                <p class="frr-family">▶️ <b>Le début :</b> ${D.debut}<br>⏹️ <b>La fin :</b> ${D.fin}</p>
                <div style="font-weight:800;margin:4px 0">Ses rois :</div>
                ${kingsList(sel.id)}
                <div style="height:8px"></div>${back}`;
        } else if (sel && sel.k === 'g') {
            const G = FRR_GAPS[sel.id];
            side.style.borderLeftColor = G.color;
            side.innerHTML = `<h4>Une période sans roi</h4>
                <div class="frr-status" style="color:${G.color}">${G.name}</div>
                <p class="frr-reign">📅 De ${G.start} à ${G.end}</p>
                <p class="frr-text">${G.text}</p>${back}`;
        } else if (sel && sel.k === 'e') {
            const ev = FRR_EVENTS[sel.id];
            side.style.borderLeftColor = '#b45309';
            side.innerHTML = `<h4>Un événement</h4>
                <div class="frr-status" style="color:#b45309">${ev.ico} ${ev.short}</div>
                <p class="frr-reign">📅 ${ev.y}</p>
                <p class="frr-text">${ev.text}</p>${back}`;
        } else if (mode === 'arbre') {
            const D = FRR_DYN[treeDyn], T = FRR_TREES[treeDyn];
            side.style.borderLeftColor = D.color;
            side.innerHTML = `<h4>L'arbre généalogique</h4>
                <div class="frr-status" style="color:${D.color}">👪 ${T.title || D.name}</div>
                <p class="frr-text">Un <b>arbre généalogique</b> montre les liens de parenté dans une famille : chaque trait relie un parent à ses enfants. On le lit <b>de haut en bas</b>, des plus anciens aux plus récents.</p>
                <p class="frr-family">📝 ${T.note}</p>
                <p class="frr-know">💡 <b>Le savais-tu ?</b> Une <b>dynastie</b> est une famille dans laquelle le pouvoir se transmet, le plus souvent de père en fils. Les Capétiens et les Valois sont en fait une seule grande famille.</p>
                <div style="font-weight:800;margin:4px 0">Les dynasties :</div>${dynList()}`;
        } else {
            side.style.borderLeftColor = '#a16207';
            side.innerHTML = `<h4>La frise des rois</h4>
                <div class="frr-status" style="color:#7a4b12">👑 Les rois de France, de Clovis à Louis-Philippe</div>
                <p class="frr-text">De <b>Clovis</b> (481) à <b>Louis-Philippe</b> (1848), six grandes familles de rois, les <b>dynasties</b>, se succèdent à la tête du royaume des Francs, qui devient peu à peu le royaume de France. La <b>Révolution</b>, en 1792, met fin une première fois à la monarchie.</p>
                <p class="frr-family">👆 Touche un roi, une dynastie ou un événement sur la frise pour en savoir plus.</p>
                <div style="font-weight:800;margin:4px 0">Les dynasties :</div>${dynList()}
                <div style="height:8px"></div>
                <p class="frr-know">💡 <b>Le savais-tu ?</b> Le plus long règne est celui de Louis XIV (72 ans) ; le plus court, celui de Jean Ier le Posthume (5 jours) !</p>`;
        }
    }

    // ── Boucle d'animation (zoom de la frise, visite guidée) ──────────────
    function requestDraw() {
        if (drawPending || animId) return;
        drawPending = true;
        requestAnimationFrame(() => { drawPending = false; draw(); });
    }
    function viewTarget() { return FRR_RANGES[zoomDyn] || FRR_RANGES.all; }
    function needAnim() {
        const t = viewTarget();
        return guided || Math.abs(view0 - t[0]) > 0.3 || Math.abs(view1 - t[1]) > 0.3;
    }
    function loop(t) {
        if (!document.body.contains(widget)) { animId = null; return; }
        const rdt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        const tg = viewTarget(), k = 1 - Math.pow(0.0015, rdt);
        view0 += (tg[0] - view0) * k; view1 += (tg[1] - view1) * k;
        if (Math.abs(view0 - tg[0]) < 0.3 && Math.abs(view1 - tg[1]) < 0.3) { view0 = tg[0]; view1 = tg[1]; }
        if (guided) {
            guideT += rdt;
            if (guideT >= 8) { guideT = 0; guideIdx = (guideIdx + 1) % FRR_GUIDE.length; selectPerson(FRR_GUIDE[guideIdx], true); }
        }
        draw();
        if (needAnim()) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setZoom(z, instant) {
        zoomDyn = FRR_RANGES[z] ? z : 'all';
        if (instant) { view0 = viewTarget()[0]; view1 = viewTarget()[1]; requestDraw(); }
        else if (needAnim()) startLoop(); else requestDraw();
        lastInfoKey = '';
    }
    function setTree(t) {
        if (!FRR_TREES[t]) return;
        if (t !== treeDyn) { treeDyn = t; treePan = 0; }
        lastInfoKey = '';
        requestDraw();
    }
    function selectPerson(id, fromGuide) {
        const p = FRR_P[id];
        if (!p) return;
        if (!fromGuide && guided) setGuided(false);
        sel = { k: 'p', id };
        if (mode === 'frise') {
            if (p.start !== undefined && (zoomDyn !== 'all' || fromGuide)) {
                const z = fromGuide ? _frrZoomFor(p) : zoomDyn;
                const r = FRR_RANGES[z];
                if (fromGuide || p.end < r[0] || p.start > r[1]) setZoom(_frrZoomFor(p));
            }
        } else {
            const t = _frrTreeOf(id);
            if (t && t !== treeDyn) setTree(t);
            if (t) pendingScroll = id;
        }
        lastInfoKey = '';
        requestDraw();
    }
    function setSel(s) {
        if (guided) setGuided(false);
        sel = s;
        lastInfoKey = '';
        requestDraw();
    }
    function step(dir) {
        if (guided) setGuided(false);
        const list = FRR_KINGS;
        let i = sel && sel.k === 'p' ? list.findIndex(k => k.id === sel.id) : -1;
        if (i < 0) {
            // pas de roi choisi : partir du début de la vue (ou de l'arbre affiché)
            if (mode === 'frise') {
                const ids = list.filter(k => _frrInZoom(k, zoomDyn));
                i = list.indexOf(dir > 0 ? ids[0] : ids[ids.length - 1]) - dir;
            }
            else { const ids = list.filter(k => FRR_LAYOUT[treeDyn].pos[k.id]); i = list.indexOf(dir > 0 ? ids[0] : ids[ids.length - 1]) - dir; }
            if (i < -1) i = list.length;
        }
        i = (i + dir + list.length) % list.length;
        selectPerson(list[i].id);
        if (typeof saveBoard === 'function') saveBoard();
    }
    function setGuided(v) {
        guided = !!v;
        guideBtn.classList.toggle('on', guided);
        guideBtn.textContent = guided ? '⏹ Arrêter la visite' : '🎓 Visite guidée';
        if (guided) {
            guideT = 0;
            const cur = sel && sel.k === 'p' ? FRR_GUIDE.indexOf(sel.id) : -1;
            guideIdx = cur >= 0 ? cur : 0;
            selectPerson(FRR_GUIDE[guideIdx], true);
            startLoop();
        }
    }
    function setMode(md) {
        mode = md === 'arbre' ? 'arbre' : 'frise';
        container.dataset.mode = mode;
        header.querySelectorAll('.frr-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (mode === 'arbre') {
            if (guided) setGuided(false);
            const p = selP();
            const t = p ? _frrTreeOf(p.id) : null;
            if (t) { setTree(t); pendingScroll = p.id; }
            else if (zoomDyn !== 'all') setTree(FRR_TREES[zoomDyn] ? zoomDyn : 'bourbon');
        } else {
            const p = selP();
            if (p && p.start !== undefined && zoomDyn !== 'all') {
                const r = FRR_RANGES[zoomDyn];
                if (p.end < r[0] || p.start > r[1]) setZoom(_frrZoomFor(p));
            }
        }
        hint.textContent = mode === 'frise'
            ? 'Touche un roi, une dynastie ou un événement · Les boutons de dynastie font un zoom'
            : 'Touche une personne pour voir sa fiche · Fais glisser l\'arbre pour le faire défiler';
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
        const L = local(e);
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ly0: L.y, pan0: treePan, moved: false };
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) drag.moved = true;
        if (drag.moved && mode === 'arbre' && treeMaxPan > 0) {
            treePan = Math.max(0, Math.min(treeMaxPan, drag.pan0 - (local(e).y - drag.ly0)));
            requestDraw();
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
        if (!d.moved) { const L = local(e); onTap(L.x, L.y); }
    }
    canvas.addEventListener('wheel', e => {
        if (mode !== 'arbre' || treeMaxPan <= 0) return;
        e.preventDefault(); e.stopPropagation();
        treePan = Math.max(0, Math.min(treeMaxPan, treePan + e.deltaY));
        requestDraw();
    }, { passive: false });

    function hitTest(x, y) {
        // les dernières zones dessinées sont au-dessus : on les teste en premier
        for (let i = hits.length - 1; i >= 0; i--) {
            const h = hits[i];
            if (h.rot) {
                const dx = x - h.ax, dy = y - h.ay;
                const lx = dx * Math.cos(-h.ang) - dy * Math.sin(-h.ang);
                const ly = dx * Math.sin(-h.ang) + dy * Math.cos(-h.ang);
                if (lx >= -4 && lx <= h.w && Math.abs(ly) <= h.h / 2) return h;
            } else if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
        }
        return null;
    }
    function onTap(x, y) {
        const h = hitTest(x, y);
        if (!h) { setSel(null); if (typeof saveBoard === 'function') saveBoard(); return; }
        if (sel && sel.k === h.k && sel.id === h.id) setSel(null);
        else if (h.k === 'p') selectPerson(h.id);
        else setSel({ k: h.k, id: h.id });
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
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.person) selectPerson(b.dataset.person);
        else if (b.dataset.dynasty) {
            if (mode === 'frise') { setZoom(b.dataset.dynasty); setSel({ k: 'd', id: b.dataset.dynasty }); }
            else setTree(FRR_TREES[b.dataset.dynasty] ? b.dataset.dynasty : 'bourbon');
        }
        else if (b.dataset.action === 'overview') setSel(null);
        else if (b.dataset.action === 'totree') setMode('arbre');
        else if (b.dataset.action === 'tofrise') setMode('frise');
        if (typeof saveBoard === 'function') saveBoard();
    });

    header.querySelectorAll('.frr-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    guideBtn.addEventListener('click', () => {
        if (mode !== 'frise' && !guided) setMode('frise');
        setGuided(!guided);
    });
    namesBtn.addEventListener('click', () => { showAllNames = !showAllNames; namesBtn.classList.toggle('on', showAllNames); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    eventsBtn.addEventListener('click', () => { showEvents = !showEvents; eventsBtn.classList.toggle('on', showEvents); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    row2.querySelectorAll('.frr-dyn').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        if (mode === 'frise') setZoom(b.dataset.dyn);
        else setTree(b.dataset.dyn);
        if (typeof saveBoard === 'function') saveBoard();
    }));

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
        if (guided) setGuided(false);
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '👑 Les rois de France', {
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
    setMode('frise');
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._frrGetData = () => ({
        containerW: contW, containerH: contH,
        mode, zoomDyn, treeDyn,
        sel: sel ? { k: sel.k, id: sel.id } : null,
        showAllNames, showEvents
    });
    widget._frrSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.showAllNames === 'boolean') { showAllNames = d.showAllNames; namesBtn.classList.toggle('on', showAllNames); }
        if (typeof d.showEvents === 'boolean') { showEvents = d.showEvents; eventsBtn.classList.toggle('on', showEvents); }
        if (FRR_TREES[d.treeDyn]) treeDyn = d.treeDyn;
        setZoom(FRR_RANGES[d.zoomDyn] ? d.zoomDyn : 'all', true);
        sel = null;
        if (d.sel && d.sel.k === 'p' && FRR_P[d.sel.id]) sel = { k: 'p', id: d.sel.id };
        else if (d.sel && d.sel.k === 'd' && FRR_DYN[d.sel.id]) sel = { k: 'd', id: d.sel.id };
        else if (d.sel && d.sel.k === 'e' && FRR_EVENTS[d.sel.id]) sel = { k: 'e', id: d.sel.id };
        else if (d.sel && d.sel.k === 'g' && FRR_GAPS[d.sel.id]) sel = { k: 'g', id: d.sel.id };
        setMode(d.mode || 'frise');
        if (mode === 'arbre' && sel && sel.k === 'p' && FRR_LAYOUT[treeDyn].pos[sel.id]) pendingScroll = sel.id;
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_frrSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
