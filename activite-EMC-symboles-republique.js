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
// WIDGET LES SYMBOLES DE LA RÉPUBLIQUE (EMC) — Le Bureau du Prof
// Pour des élèves de cycle 3 (CM1 – CM2 – 6e). Une place de village devant
// la mairie, où se cachent les symboles de la République :
//   le drapeau tricolore, la devise, Marianne, La Marseillaise (le kiosque
//   à musique), le 14 Juillet (l'affiche), le coq gaulois (la girouette),
//   les initiales RF, la Constitution (la plaque) et le drapeau européen.
// Deux onglets :
//  🏛️ Découvrir : on touche une étiquette ou une partie du dessin pour
//     afficher sa fiche (explication, « Le savais-tu ? »). La fiche de
//     La Marseillaise donne le premier couplet et le refrain, avec
//     l'explication des mots difficiles. Le bouton « 🎆 14 Juillet »
//     passe la place en soirée de fête nationale (feu d'artifice).
//  🎯 Défi : une question s'affiche (« Où est Marianne ? »), on touche la
//     bonne partie du dessin. Indice, question suivante, score final.
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
    if (document.getElementById('srp-style')) return;
    const s = document.createElement('style');
    s.id = 'srp-style';
    s.textContent = `
        .widget[data-type="symboles-republique"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .srp-container {
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
        .srp-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .srp-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .srp-header .wf-btns { gap: 8px; }
        .srp-header .wf-btn { width: 18px; height: 18px; }
        .srp-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .srp-container.wf-fullboard {
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
        .srp-tabs { display: inline-flex; background: #e9eef7; border-radius: 11px; padding: 3px; gap: 3px; }
        .srp-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .srp-tab.on { background: #fff; color: #1e3a8a; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .srp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .srp-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .srp-btn:hover { background: #e0e0e0; }
        .srp-btn:active { transform: scale(0.96); }
        .srp-btn.on { background: #1e3a8a; color: #fff; border-color: #1e3a8a; }
        .srp-btn-fete.on { background: #b91c1c; border-color: #b91c1c; }
        .srp-btn-next { background: #dcfce7; border-color: #86efac; color: #166534; }
        .srp-btn-next:hover { background: #bbf7d0; }
        .srp-btn-next.ready { background: #16a34a; border-color: #16a34a; color: #fff; }
        .srp-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .srp-score { font-size: 13px; font-weight: 800; color: #1e3a8a; white-space: nowrap; margin-left: auto; }

        /* Corps */
        .srp-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .srp-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #cfe6f5;
        }
        .srp-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .srp-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #1e3a8a;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .srp-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .srp-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .srp-tag { display: inline-block; border-radius: 8px; padding: 3px 9px; margin: 0 0 6px; font-weight: 800; font-size: .88em; }
        .srp-tag.off { background: #dcfce7; color: #166534; }
        .srp-tag.trad { background: #fef3c7; color: #92400e; }
        .srp-tag.eu { background: #dbeafe; color: #1e3a8a; }
        .srp-text { margin: 0 0 6px; }
        .srp-box { background: #eef4fb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d3f6e; }
        .srp-box b { color: #1e3a8a; }
        .srp-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .srp-ok { background: #dcfce7; border-radius: 8px; padding: 7px 9px; color: #166534; font-weight: 800; margin: 0 0 6px; }
        .srp-bad { background: #fee2e2; border-radius: 8px; padding: 7px 9px; color: #991b1b; font-weight: 800; margin: 0 0 6px; }
        .srp-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .srp-list button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .srp-list button.on { background: var(--st-c, #1e3a8a); color: #fff; }
        .srp-recap { list-style: none; margin: 0 0 8px; padding: 0; }
        .srp-recap li { padding: 3px 0; border-bottom: 1px dashed #e5e7eb; font-weight: 600; }
        .srp-flag { display: flex; height: 46px; border-radius: 4px; overflow: hidden; margin: 2px 0 6px; border: 1px solid #d1d5db; }
        .srp-flag span { flex: 1; display: flex; align-items: flex-end; justify-content: center; font-size: 11px; font-weight: 800; padding-bottom: 3px; }
        .srp-words { display: grid; gap: 4px; margin: 0 0 6px; }
        .srp-words div { border-radius: 8px; padding: 5px 9px; }
        .srp-lyrics { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; margin: 0 0 6px; font-size: .97em; line-height: 1.55; }
        .srp-lyrics p { margin: 0 0 6px; }
        .srp-lyrics .refrain { font-weight: 800; color: #1e3a8a; }
        .srp-word {
            display: inline; border: none; background: #fff3c4; color: inherit; font: inherit; font-weight: inherit;
            padding: 0 2px; margin: 0; border-radius: 4px; cursor: pointer; border-bottom: 2px dotted #d97706;
            touch-action: manipulation;
        }
        .srp-word.on { background: #fbbf24; }
        .srp-def { background: #fff8e1; border: 1px solid #fcd34d; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #78350f; min-height: 1.4em; }
        .srp-listen {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            min-height: 40px; border-radius: 10px; margin: 0 0 4px; padding: 6px 10px;
            background: #0f766e; color: #fff !important; text-decoration: none;
            font-size: 14px; font-weight: 800; touch-action: manipulation;
        }
        .srp-listen:hover { background: #0d5f59; }
        .srp-listen-src { font-size: .82em; color: #6b7280; margin: 0 0 8px; text-align: center; }
        .srp-listen-src a { color: #0f766e; }
        .srp-go { width: 100%; min-height: 32px; border-radius: 8px; border: 1px solid #e0e3e8; background: #eef2ff; font-size: 13px; font-weight: 800; font-family: inherit; color: #1e3a8a; cursor: pointer; margin: 0 0 8px; touch-action: manipulation; }

        /* Aide */
        .srp-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .srp-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .srp-help-popup.show { display: block; }
        .srp-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .srp-help-popup p { margin: 0 0 6px; }

        .srp-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .srp-resize-handle:hover { opacity: 1; }
        .srp-container[data-mode="defi"] .srp-only-explore { display: none !important; }
        .srp-container[data-mode="explore"] .srp-only-defi { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .srp-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .srp-tab-short { display: none; }
        .srp-header { min-width: 0; max-width: 100%; }
        .srp-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .srp-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .srp-header .wf-btns { flex-shrink: 0; }
        .srp-container.wf-fullboard .srp-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .srp-container { padding: 10px 10px 8px; gap: 6px; }
            .srp-header { gap: 6px; }
            .srp-title { font-size: 13px; }
            .srp-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .srp-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .srp-row > * { flex-shrink: 0; }
            .srp-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .srp-sep { display: none; }
            .srp-side { padding: 8px 10px; font-size: 13px; }
            .srp-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .srp-title { display: none; }
            .srp-tab { padding: 3px 7px; font-size: 11.5px; }
            .srp-tab-long { display: none; }
            .srp-tab-short { display: inline; }
            .srp-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .srp-body { flex-direction: column; }
            .srp-scene-wrap { flex: 1 1 0; min-height: 200px; }
            .srp-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 45%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .srp-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ──────────────────────────────────────────────────
// kind : off = inscrit dans la Constitution, loi = fixé par une loi,
//        trad = symbole traditionnel, eu = Union européenne, texte = la Constitution
// lx, ly : étiquette ; ax, ay : point visé (coordonnées du dessin, 1000 × 640)
// zone : rectangle touchable [x0, y0, x1, y1]
const SRP_SYMBOLS = [
    {
        id: 'drapeau', ico: '🇫🇷', name: 'Le drapeau tricolore', color: '#1d4ed8', kind: 'off',
        lx: 712, ly: 222, ax: 628, ay: 326, zone: [530, 300, 694, 394],
        text: 'Le drapeau <b>bleu, blanc, rouge</b> est l\'<b>emblème national</b> de la France. Il flotte sur les mairies, les écoles et tous les bâtiments publics. Le bleu est toujours du côté du mât.',
        extra: 'drapeau',
        know: 'Pendant la Restauration (1814-1830), les rois Bourbons ont remplacé le drapeau tricolore par un drapeau blanc. C\'est le roi Louis-Philippe qui l\'a rétabli en 1830, et il ne l\'a plus quitté depuis.',
        q: ['Touche le drapeau de la France.', 'Touche l\'emblème national : il est bleu, blanc, rouge.']
    },
    {
        id: 'devise', ico: '✍️', name: 'La devise', color: '#7c3aed', kind: 'off',
        lx: 120, ly: 262, ax: 246, ay: 292, zone: [236, 278, 764, 306],
        text: 'La devise de la République est <b>« Liberté, Égalité, Fraternité »</b>. Elle est née pendant la Révolution française et elle est gravée sur le fronton des mairies, des écoles et des bâtiments publics, surtout depuis 1880.',
        extra: 'devise',
        know: 'La devise est aussi écrite sur les pièces de monnaie de 10, 20 et 50 centimes d\'euro françaises, autour de la « Semeuse ».',
        q: ['Touche la devise de la République.', 'Où sont écrits les mots « Liberté, Égalité, Fraternité » ?']
    },
    {
        id: 'marianne', ico: '👩', name: 'Marianne', color: '#dc2626', kind: 'trad',
        lx: 430, ly: 604, ax: 500, ay: 528, zone: [444, 378, 556, 560],
        text: '<b>Marianne</b> est une femme qui <b>représente la République</b>. Elle porte un <b>bonnet phrygien</b> : dans l\'Antiquité, ce bonnet était porté par les esclaves libérés, c\'est donc un symbole de <b>liberté</b>. Son buste est présent dans toutes les mairies, souvent dans la salle des mariages. On la voit aussi sur les timbres, sur les pièces de 1, 2 et 5 centimes d\'euro et sur les documents officiels.',
        know: 'Son nom viendrait de deux prénoms très courants au XVIII<sup>e</sup> siècle : Marie et Anne. Des personnalités célèbres ont prêté leur visage aux bustes de Marianne, comme l\'actrice Brigitte Bardot ou le mannequin Laetitia Casta.',
        q: ['Où est Marianne ?', 'Touche la femme au bonnet phrygien qui représente la République.']
    },
    {
        id: 'marseillaise', ico: '🎵', name: 'La Marseillaise', color: '#0f766e', kind: 'off',
        lx: 125, ly: 352, ax: 125, ay: 420, zone: [34, 372, 222, 562],
        text: '<b>La Marseillaise</b> est l\'<b>hymne national</b>, le chant de la France. Elle a été écrite en <b>1792</b> à Strasbourg par <b>Rouget de Lisle</b>, sous le nom de « Chant de guerre pour l\'armée du Rhin », alors que la France était en guerre. Des soldats venus de <b>Marseille</b> l\'ont chantée en arrivant à Paris : d\'où son nom. On la joue lors des cérémonies officielles et des matchs des équipes de France. On l\'écoute et on la chante <b>debout</b>, en signe de respect.',
        extra: 'marseillaise',
        know: 'Depuis 2005, tous les élèves de l\'école primaire doivent apprendre La Marseillaise. Elle compte 7 couplets, mais on ne chante en général que le premier et le refrain.',
        q: ['Touche l\'endroit où l\'on joue l\'hymne national.', 'Où va-t-on chanter La Marseillaise ? Touche-le !']
    },
    {
        id: 'quatorze', ico: '🎆', name: 'Le 14 Juillet', color: '#b91c1c', kind: 'loi',
        lx: 885, ly: 388, ax: 885, ay: 416, zone: [812, 412, 958, 562],
        text: 'Le <b>14 Juillet</b> est la <b>fête nationale</b> depuis une loi de <b>1880</b>. Ce jour-là, il y a un grand <b>défilé militaire</b> à Paris, sur les Champs-Élysées, des <b>bals populaires</b> et des <b>feux d\'artifice</b> partout en France.',
        extra: 'quatorze',
        know: 'On croit souvent que le 14 Juillet fête seulement la prise de la Bastille (1789). En fait, la loi de 1880 voulait aussi rappeler la fête de la Fédération du 14 juillet 1790, un grand moment de réconciliation.',
        q: ['Touche l\'annonce de la fête nationale.', 'Quel jour fête-t-on la France ? Touche l\'affiche !']
    },
    {
        id: 'coq', ico: '🐓', name: 'Le coq gaulois', color: '#b45309', kind: 'trad',
        lx: 600, ly: 44, ax: 512, ay: 50, zone: [474, 20, 544, 82],
        text: 'Le <b>coq</b> est un symbole très ancien de la France, mais <b>pas un symbole officiel</b>. En latin, le même mot, <i>gallus</i>, voulait dire à la fois « coq » et « Gaulois ». On le voit sur les maillots des équipes de France, sur des monuments aux morts et sur des girouettes.',
        know: 'Sur les clochers des églises, le coq a une autre signification : il chante au lever du jour et rappelle aux chrétiens de rester éveillés.',
        q: ['Touche l\'animal qui est un symbole de la France.', 'Où est le coq gaulois ?']
    },
    {
        id: 'rf', ico: '🔠', name: 'Les initiales RF', color: '#475569', kind: 'trad',
        lx: 650, ly: 150, ax: 532, ay: 210, zone: [430, 176, 570, 234],
        text: 'Les lettres <b>RF</b> veulent dire <b>« République française »</b>. On les trouve sur les bâtiments publics, sur les documents officiels, les uniformes, les anciennes pièces de monnaie et les bornes des routes.',
        know: 'Le logo de l\'État, que tu vois sur les sites et les courriers officiels, réunit plusieurs symboles : Marianne, les couleurs du drapeau et la devise.',
        q: ['Touche les initiales de la République française.', 'Trouve les deux lettres « RF ».']
    },
    {
        id: 'constitution', ico: '📜', name: 'La Constitution', color: '#a16207', kind: 'texte',
        lx: 700, ly: 604, ax: 587, ay: 480, zone: [562, 448, 614, 512],
        text: 'La <b>Constitution</b> est le texte le plus important de la République : elle fixe les règles de fonctionnement du pays. Celle d\'aujourd\'hui date du <b>4 octobre 1958</b> (la V<sup>e</sup> République). Son <b>article 2</b> donne la liste des symboles officiels :',
        extra: 'constitution',
        know: 'L\'article 1 dit que « la France est une République indivisible, laïque, démocratique et sociale ».',
        q: ['Touche la plaque qui rappelle le texte où sont écrits les symboles officiels.', 'Touche la Constitution.']
    },
    {
        id: 'europe', ico: '🇪🇺', name: 'Le drapeau européen', color: '#1e40af', kind: 'eu',
        lx: 290, ly: 222, ax: 372, ay: 326, zone: [306, 300, 470, 394],
        text: 'La France fait partie de l\'<b>Union européenne</b>, avec 26 autres pays. Son drapeau, <b>bleu avec un cercle de douze étoiles jaunes</b>, flotte souvent à côté du drapeau français. L\'Union européenne a aussi un hymne, l\'<b>Ode à la joie</b> de Beethoven, et une devise : « Unie dans la diversité ».',
        know: 'Le nombre d\'étoiles ne correspond pas au nombre de pays : il est toujours de douze, un symbole de perfection et d\'unité.',
        q: ['Touche le drapeau de l\'Union européenne.', 'Touche le drapeau aux douze étoiles.']
    }
];
const SRP_S = {};
SRP_SYMBOLS.forEach((s, i) => { SRP_S[s.id] = i; });
const SRP_KIND = {
    off: ['off', '✅ Symbole officiel, écrit dans la Constitution'],
    loi: ['off', '✅ Fête nationale fixée par une loi (1880)'],
    trad: ['trad', '⭐ Symbole traditionnel (pas écrit dans la Constitution)'],
    eu: ['eu', '🇪🇺 Symbole de l\'Union européenne'],
    texte: ['off', '📜 Le texte le plus important de la République']
};
// Mots difficiles de La Marseillaise
const SRP_WORDS = {
    patrie: 'La <b>Patrie</b> : le pays auquel on appartient, ici la France. « Enfants de la Patrie » : tous les Français.',
    gloire: 'Le <b>jour de gloire</b> : le jour où l\'on va accomplir de grandes choses, où l\'on va se rendre célèbre.',
    tyrannie: 'La <b>tyrannie</b> : le pouvoir injuste d\'un chef qui décide de tout, seul et par la force. En 1792, la France révolutionnaire est attaquée par les rois d\'Europe.',
    etendard: 'L\'<b>étendard</b> : le drapeau d\'une armée. « L\'étendard sanglant est levé » : les armées ennemies sont prêtes à attaquer.',
    campagnes: 'Les <b>campagnes</b> : ici, les champs, la terre de France, là où avancent les soldats ennemis.',
    mugir: '<b>Mugir</b> : crier très fort, comme le cri d\'un taureau. Les soldats ennemis font un bruit terrifiant.',
    compagnes: 'Les <b>compagnes</b> : les épouses, les femmes de la famille.',
    citoyens: 'Les <b>citoyens</b> : les membres du pays qui ont des droits et des devoirs. La Révolution appelle tous les Français ainsi.',
    bataillons: 'Les <b>bataillons</b> : des groupes de soldats. « Formez vos bataillons » : rassemblez-vous pour vous défendre.',
    sangimpur: '<b>Un sang impur</b> : dans l\'esprit de 1792, le sang des ennemis qui attaquent la France. Ces paroles très violentes s\'expliquent par la guerre de cette époque.',
    sillons: 'Les <b>sillons</b> : les lignes creusées dans la terre par la charrue, dans les champs. « Abreuver » veut dire « faire boire ».'
};

// Enregistrement officiel de l'hymne (site de la présidence de la République)
const SRP_HYMN_MP3 = 'https://www.elysee.fr/admin/upload/default/0001/14/bb606ceb14dd5b50d6019931d20e77792e2871cb.mp3';
const SRP_HYMN_PAGE = 'https://www.elysee.fr/la-presidence/la-marseillaise-de-rouget-de-lisle';

// ── Géométrie du dessin (1000 × 640) ─────────────────────────────────────
const SRP_DW = 1000, SRP_DH = 640, SRP_VX0 = 22, SRP_VX1 = 978;
const SRP_FLAG = { len: 92, hoist: 52 };
const SRP_POLE_L = { base: [462, 378], tip: [394, 312], side: -1 };
const SRP_POLE_R = { base: [538, 378], tip: [606, 312], side: 1 };

// ── Création du widget ────────────────────────────────────────────────────
function createSymbolesRepubliqueWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'symboles-republique';
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
    container.className = 'srp-container';
    container.dataset.mode = 'explore';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(820, Math.min(1240, Math.round(window.innerWidth * 0.72)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(580, Math.round(contW * 0.62));

    const header = document.createElement('div');
    header.className = 'srp-header';
    header.innerHTML = `
        <span class="srp-title">🇫🇷<span> Les symboles de la République</span></span>
        <div class="srp-tabs">
            <button class="srp-tab on" data-mode="explore" title="Découvrir les symboles"><span class="srp-tab-long">🏛️ Découvrir</span><span class="srp-tab-short">🏛️ Découvrir</span></button>
            <button class="srp-tab" data-mode="defi" title="Retrouver les symboles dans le dessin"><span class="srp-tab-long">🎯 Défi : retrouve les symboles</span><span class="srp-tab-short">🎯 Défi</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'srp-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    const row1 = document.createElement('div');
    row1.className = 'srp-row';
    row1.innerHTML = `
        <button class="srp-btn srp-labels srp-only-explore on" title="Afficher les noms des symboles">🏷️ Étiquettes</button>
        <button class="srp-btn srp-btn-hymn srp-only-explore" title="Les paroles de La Marseillaise">🎵 La Marseillaise</button>
        <button class="srp-btn srp-btn-next srp-only-defi" title="Passer à la question suivante">⏭ Passer</button>
        <button class="srp-btn srp-btn-hint srp-only-defi" title="Montrer où chercher">💡 Indice</button>
        <button class="srp-btn srp-btn-restart srp-only-defi" title="Recommencer le défi depuis le début">🔄 Nouveau défi</button>
        <span class="srp-sep"></span>
        <button class="srp-btn srp-btn-fete" title="La place un soir de 14 Juillet">🎆 14 Juillet</button>
        <span class="srp-score srp-only-defi"></span>
    `;
    container.appendChild(row1);

    const body = document.createElement('div');
    body.className = 'srp-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'srp-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'srp-canvas';
    sceneWrap.appendChild(canvas);
    const side = document.createElement('div');
    side.className = 'srp-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'srp-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les symboles de la République</h4>
        <p>Neuf symboles se cachent sur la place, devant la mairie : le drapeau, la devise, Marianne, La Marseillaise,
        le 14 Juillet, le coq gaulois, les initiales RF, la Constitution et le drapeau européen.</p>
        <p><b>🏛️ Découvrir</b> : touche une étiquette ou une partie du dessin pour afficher sa fiche à droite.
        <b>🎵 La Marseillaise</b> affiche le premier couplet et le refrain : touche un mot surligné pour l'expliquer.
        <b>🎆 14 Juillet</b> passe la place en soirée de fête nationale.</p>
        <p><b>🎯 Défi</b> : une question s'affiche en haut du dessin. Touche la bonne partie du dessin.
        Un point est gagné si on trouve du premier coup. <b>💡 Indice</b> montre où chercher.</p>
        <p style="color:#888">Les symboles officiels sont écrits dans l'article 2 de la Constitution ; Marianne, le coq et les
        initiales RF sont des symboles traditionnels.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'srp-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const labelsBtn = $('.srp-labels'), hymnBtn = $('.srp-btn-hymn'), feteBtn = $('.srp-btn-fete');
    const nextBtn = $('.srp-btn-next'), hintBtn = $('.srp-btn-hint'), restartBtn = $('.srp-btn-restart');
    const scoreEl = $('.srp-score');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'explore';
    let selIdx = -1;
    let showLabels = true, fete = false;
    let word = null;
    let defi = null;                      // { order, i, q, tries, score, results, answered, done }
    let hintT = 0, marks = [], confetti = [];
    let fw = [], rockets = [], fwAcc = 0, notes = [], noteAcc = 0;
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
        // Le dessin garde ses proportions : il est centré en largeur et posé en bas
        const topBand = mode === 'defi' ? Math.min(64, H * 0.13) : 0;
        S = Math.min(W / (SRP_VX1 - SRP_VX0), (H - topBand) / SRP_DH);
        OX = (W - (SRP_VX1 - SRP_VX0) * S) / 2 - SRP_VX0 * S;
        OY = H - SRP_DH * S;
        return true;
    }
    const sx = x => OX + x * S, sy = y => OY + y * S;
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    const screenMode = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sceneMode = () => ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * OX, dpr * OY);

    // =====================================================================
    //  DESSIN DE LA PLACE
    // =====================================================================
    function drawSky() {
        const g = ctx.createLinearGradient(0, 0, 0, cssH);
        if (fete) { g.addColorStop(0, '#081833'); g.addColorStop(0.7, '#1e3a6e'); g.addColorStop(1, '#3b4f7a'); }
        else { g.addColorStop(0, '#6eaee3'); g.addColorStop(0.75, '#cfe7f7'); g.addColorStop(1, '#e8f3fa'); }
        ctx.fillStyle = g; ctx.fillRect(0, 0, cssW, cssH);
        if (fete) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 70; i++) {
                const x = (i * 137.5 % 100) / 100 * cssW, y = (i * 61.7 % 100) / 100 * cssH * 0.6;
                const tw = 0.6 + 0.4 * Math.sin(time * 2 + i);
                ctx.globalAlpha = tw; ctx.fillRect(x, y, 1.6, 1.6);
            }
            ctx.globalAlpha = 1;
        }
    }
    function cloud(cx, cy, s) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        for (const b of [[-1, 0.15, 0.55], [-0.45, -0.2, 0.7], [0.2, -0.3, 0.75], [0.8, -0.05, 0.6], [0.1, 0.2, 0.6]]) {
            ctx.moveTo(cx + b[0] * s + b[2] * s, cy + b[1] * s); ctx.arc(cx + b[0] * s, cy + b[1] * s, b[2] * s, 0, 2 * Math.PI);
        }
        ctx.fill();
    }
    function windowRect(x, y, w, h, lit) {
        ctx.fillStyle = '#c9b48d'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
        ctx.fillStyle = lit ? '#ffd56b' : '#7aa6c9'; ctx.fillRect(x, y, w, h);
        if (!lit) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 3, y + 3, w * 0.3, h - 6); }
        ctx.strokeStyle = '#efe3c8'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h * 0.42); ctx.lineTo(x + w, y + h * 0.42); ctx.stroke();
        ctx.fillStyle = '#4b6584'; ctx.fillRect(x - 9, y, 7, h); ctx.fillRect(x + w + 2, y, 7, h);   // volets
    }
    function drawFlag(pole, kind) {
        const [bx, by] = pole.base, [tx, ty] = pole.tip;
        // Mât
        ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, 2 * Math.PI); ctx.fill();
        const L = Math.hypot(bx - tx, by - ty), ux = (bx - tx) / L, uy = (by - ty) / L;
        const N = 22, hx = ux * SRP_FLAG.hoist, hy = uy * SRP_FLAG.hoist;
        const P = t => {
            const w = 5.5 * t * Math.sin(time * 3.2 - t * 6.5 + (pole.side > 0 ? 1.3 : 0));
            const sag = 10 * t * t;
            return [tx + 4 * ux + pole.side * SRP_FLAG.len * t, ty + 4 * uy + w + sag];
        };
        const strip = (t0, t1, col) => {
            ctx.beginPath();
            const n0 = Math.round(t0 * N), n1 = Math.round(t1 * N);
            for (let i = n0; i <= n1; i++) { const p = P(i / N); i === n0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
            for (let i = n1; i >= n0; i--) { const p = P(i / N); ctx.lineTo(p[0] + hx, p[1] + hy); }
            ctx.closePath(); ctx.fillStyle = col; ctx.fill();
        };
        if (kind === 'fr') { strip(0, 1 / 3, '#1f3f99'); strip(1 / 3, 2 / 3, '#ffffff'); strip(2 / 3, 1, '#e1262d'); }
        else {
            strip(0, 1, '#1f3f99');
            const c = P(0.5);
            const cx = c[0] + hx / 2, cy = c[1] + hy / 2;
            ctx.fillStyle = '#ffcc00';
            for (let i = 0; i < 12; i++) {
                const a = i * Math.PI / 6;
                const x = cx + Math.cos(a) * 15, y = cy + Math.sin(a) * 15;
                ctx.beginPath();
                for (let k = 0; k < 10; k++) {
                    const r = k % 2 ? 1.3 : 3, aa = -Math.PI / 2 + k * Math.PI / 5;
                    k ? ctx.lineTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r) : ctx.moveTo(x + Math.cos(aa) * r, y + Math.sin(aa) * r);
                }
                ctx.closePath(); ctx.fill();
            }
        }
        // ombres des plis
        ctx.globalAlpha = 0.12; ctx.fillStyle = '#000';
        for (let i = 0; i < N; i++) {
            const t = i / N, d = Math.cos(time * 3.2 - t * 6.5 + (pole.side > 0 ? 1.3 : 0));
            if (d > 0.3) {
                const a = P(t), b = P((i + 1) / N);
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] + hx, b[1] + hy); ctx.lineTo(a[0] + hx, a[1] + hy); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    function drawCoq(x, y) {
        // girouette : tige, flèche, points cardinaux, et le coq
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y + 64); ctx.lineTo(x, y + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 20, y + 50); ctx.lineTo(x + 20, y + 50); ctx.stroke();
        ctx.font = '700 9px Georgia, serif'; ctx.fillStyle = '#2b2b2b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('O', x - 25, y + 50); ctx.fillText('E', x + 25, y + 50);
        ctx.fillStyle = '#c8961e'; ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 1;
        ctx.beginPath();     // corps du coq (tourné vers la gauche)
        ctx.moveTo(x - 14, y + 4);                       // bec
        ctx.lineTo(x - 9, y + 2);
        ctx.quadraticCurveTo(x - 9, y - 5, x - 4, y - 5);   // tête
        ctx.lineTo(x - 2, y - 9); ctx.lineTo(x, y - 6); ctx.lineTo(x + 2, y - 9); ctx.lineTo(x + 3, y - 4); // crête
        ctx.quadraticCurveTo(x + 2, y + 4, x + 6, y + 8);  // cou
        ctx.quadraticCurveTo(x + 14, y - 10, x + 24, y - 8); // queue haut
        ctx.quadraticCurveTo(x + 18, y + 2, x + 22, y + 10);
        ctx.quadraticCurveTo(x + 18, y + 20, x + 6, y + 19); // ventre
        ctx.lineTo(x + 3, y + 26); ctx.lineTo(x + 1, y + 26); ctx.lineTo(x + 1, y + 19);
        ctx.quadraticCurveTo(x - 9, y + 16, x - 8, y + 7);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x - 8, y + 8, 2, 0, 2 * Math.PI); ctx.fill();   // barbillon
        ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(x - 5, y, 1.1, 0, 2 * Math.PI); ctx.fill();     // œil
    }
    function drawMarianne(cx, base) {
        // buste de plâtre sur une colonne, de profil, avec le bonnet phrygien
        ctx.fillStyle = '#e8e2d6'; ctx.fillRect(cx - 14, base, 28, 560 - base);
        ctx.fillStyle = '#d6cebf'; ctx.fillRect(cx - 18, base, 36, 6); ctx.fillRect(cx - 18, 552, 36, 8);
        const W = '#f6f3ec', D = '#d9d2c4';
        ctx.fillStyle = W; ctx.strokeStyle = D; ctx.lineWidth = 1.2;
        ctx.beginPath();     // épaules drapées
        ctx.moveTo(cx - 30, base); ctx.quadraticCurveTo(cx - 28, base - 24, cx - 8, base - 28);
        ctx.lineTo(cx + 10, base - 28); ctx.quadraticCurveTo(cx + 30, base - 22, cx + 30, base);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 18, base - 4); ctx.quadraticCurveTo(cx, base - 18, cx + 20, base - 6); ctx.stroke();
        ctx.fillRect(cx - 5, base - 40, 12, 14);       // cou
        ctx.beginPath(); ctx.arc(cx + 1, base - 50, 15, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();   // tête
        ctx.beginPath(); ctx.moveTo(cx - 13, base - 52); ctx.lineTo(cx - 19, base - 47); ctx.lineTo(cx - 13, base - 45); ctx.fill(); // nez
        ctx.fillStyle = '#ece6da';                       // cheveux sur la nuque
        ctx.beginPath(); ctx.moveTo(cx + 8, base - 56); ctx.quadraticCurveTo(cx + 22, base - 40, cx + 14, base - 28);
        ctx.lineTo(cx + 6, base - 30); ctx.quadraticCurveTo(cx + 12, base - 42, cx + 4, base - 50); ctx.fill();
        ctx.fillStyle = '#c62828'; ctx.strokeStyle = '#8e1c1c';
        ctx.beginPath();     // bonnet phrygien, la pointe retombe vers l'avant
        ctx.moveTo(cx - 14, base - 55);
        ctx.quadraticCurveTo(cx - 12, base - 72, cx + 2, base - 74);
        ctx.quadraticCurveTo(cx - 10, base - 80, cx - 20, base - 70);
        ctx.quadraticCurveTo(cx - 22, base - 64, cx - 16, base - 62);
        ctx.quadraticCurveTo(cx - 8, base - 76, cx + 6, base - 74);
        ctx.quadraticCurveTo(cx + 20, base - 70, cx + 17, base - 50);
        ctx.quadraticCurveTo(cx, base - 58, cx - 14, base - 55);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const [r, c] of [[5, '#1f3f99'], [3.4, '#ffffff'], [1.8, '#e1262d']]) {   // cocarde
            ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + 9, base - 61, r, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.fillStyle = '#b7ad9b'; ctx.beginPath(); ctx.arc(cx - 7, base - 52, 1.3, 0, 2 * Math.PI); ctx.fill();   // œil
    }
    function drawKiosque(lit) {
        const cx = 125;
        ctx.fillStyle = '#d6cdb9'; ctx.fillRect(42, 522, 166, 38);
        ctx.fillStyle = '#c3b89f'; ctx.fillRect(42, 522, 166, 6);
        ctx.strokeStyle = '#2f5d50'; ctx.lineWidth = 4;
        for (const x of [52, 88, 125, 162, 198]) { ctx.beginPath(); ctx.moveTo(x, 522); ctx.lineTo(x, 446); ctx.stroke(); }
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(48, 502); ctx.lineTo(202, 502); ctx.stroke();
        for (let x = 56; x < 200; x += 8) { ctx.beginPath(); ctx.moveTo(x, 502); ctx.lineTo(x, 522); ctx.stroke(); }
        // musiciens (silhouettes)
        for (const [x, c] of [[95, '#1f3f99'], [150, '#7f1d1d']]) {
            ctx.fillStyle = c; ctx.fillRect(x - 7, 478, 14, 24);
            ctx.fillStyle = '#f1c9a5'; ctx.beginPath(); ctx.arc(x, 471, 6, 0, 2 * Math.PI); ctx.fill();
            ctx.fillStyle = c; ctx.fillRect(x - 7, 462, 14, 5);
        }
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 3;           // trompette
        ctx.beginPath(); ctx.moveTo(102, 476); ctx.lineTo(116, 474); ctx.stroke();
        ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.moveTo(116, 469); ctx.lineTo(122, 466); ctx.lineTo(122, 482); ctx.lineTo(116, 479); ctx.fill();
        // toit
        ctx.fillStyle = '#2f5d50';
        ctx.beginPath(); ctx.moveTo(28, 450); ctx.quadraticCurveTo(cx, 360, 222, 450); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3d7465';
        ctx.beginPath(); ctx.moveTo(cx, 386); ctx.quadraticCurveTo(cx - 25, 420, cx - 30, 448); ctx.lineTo(cx + 30, 448); ctx.quadraticCurveTo(cx + 25, 420, cx, 386); ctx.fill();
        ctx.fillStyle = lit ? '#ffd56b' : '#e8dcc0';               // lambrequin festonné
        for (let x = 30; x < 220; x += 12) { ctx.beginPath(); ctx.arc(x + 6, 450, 6, 0, Math.PI); ctx.fill(); }
        ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.arc(cx, 384, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, 380); ctx.lineTo(cx, 352); ctx.stroke();
        // fanion tricolore au sommet
        const w = 2.5 * Math.sin(time * 4);
        const pts = [[cx, 352], [cx + 26, 356 + w], [cx, 366]];
        const band = (a, b, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx + 26 * a, 352 + (4 + w) * a); ctx.lineTo(cx + 26 * b, 352 + (4 + w) * b); ctx.lineTo(cx + 26 * b, 366 - (10 - w) * b); ctx.lineTo(cx + 26 * a, 366 - (10 - w) * a); ctx.fill(); };
        band(0, 1 / 3, '#1f3f99'); band(1 / 3, 2 / 3, '#fff'); band(2 / 3, 1, '#e1262d');
        void pts;
    }
    function drawAffiche() {
        ctx.fillStyle = '#6d4a2b'; ctx.fillRect(828, 500, 7, 60); ctx.fillRect(935, 500, 7, 60);
        ctx.fillStyle = '#3f5f4f'; ctx.fillRect(812, 414, 146, 100);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(818, 420, 134, 88);
        ctx.fillStyle = '#1f3f99'; ctx.fillRect(818, 420, 45, 9);
        ctx.fillStyle = '#e1262d'; ctx.fillRect(907, 420, 45, 9);
        ctx.fillStyle = '#b91c1c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '900 17px Georgia, serif'; ctx.fillText('14 JUILLET', 885, 446);
        ctx.fillStyle = '#1f3f99'; ctx.font = '800 10.5px "Segoe UI", sans-serif'; ctx.fillText('FÊTE NATIONALE', 885, 464);
        ctx.fillStyle = '#374151'; ctx.font = '600 8.5px "Segoe UI", sans-serif'; ctx.fillText('Défilé · Bal populaire', 885, 480);
        ctx.fillText('Feu d\'artifice à 23 h', 885, 492);
        // petits feux d'artifice dans les coins, à l'écart du texte
        for (const [x, y, c] of [[828, 474, '#e1262d'], [942, 474, '#1f3f99'], [828, 498, '#d4a017'], [942, 498, '#e1262d']]) {
            ctx.strokeStyle = c; ctx.lineWidth = 1.5;
            for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5); ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); ctx.stroke(); }
        }
    }
    function drawLampe(x, lit) {
        ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - 2.5, 470, 5, 90); ctx.fillRect(x - 7, 554, 14, 6);
        ctx.fillStyle = lit ? '#ffe08a' : '#e5e7eb';
        ctx.beginPath(); ctx.moveTo(x - 9, 452); ctx.lineTo(x + 9, 452); ctx.lineTo(x + 6, 472); ctx.lineTo(x - 6, 472); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.moveTo(x - 11, 452); ctx.lineTo(x, 442); ctx.lineTo(x + 11, 452); ctx.fill();
        if (lit) {
            const g = ctx.createRadialGradient(x, 462, 0, x, 462, 60);
            g.addColorStop(0, 'rgba(255,214,107,0.45)'); g.addColorStop(1, 'rgba(255,214,107,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 462, 60, 0, 2 * Math.PI); ctx.fill();
        }
    }
    function drawGuirlande() {
        const pts = [240, 390, 610, 760];
        const cols = ['#1f3f99', '#ffffff', '#e1262d'];
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1], y = 308, sag = 18;
            ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a, y); ctx.quadraticCurveTo((a + b) / 2, y + 2 * sag, b, y); ctx.stroke();
            const n = Math.round((b - a) / 16);
            for (let k = 1; k < n; k++) {
                const t = k / n, x = a + (b - a) * t, yy = y + 4 * sag * t * (1 - t);
                ctx.fillStyle = cols[k % 3];
                ctx.beginPath(); ctx.moveTo(x - 5, yy); ctx.lineTo(x + 5, yy); ctx.lineTo(x + 0.6 * Math.sin(time * 3 + k), yy + 11); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            }
        }
    }

    function drawScene() {
        const lit = fete;
        // Sol (prolongé jusqu'aux bords du canevas)
        const x0 = -OX / S - 2, x1 = (cssW - OX) / S + 2, y1 = (cssH - OY) / S + 2;
        ctx.fillStyle = fete ? '#8f8a80' : '#ddd5c4'; ctx.fillRect(x0, 560, x1 - x0, y1 - 560);
        ctx.strokeStyle = fete ? 'rgba(0,0,0,0.12)' : 'rgba(120,100,70,0.18)'; ctx.lineWidth = 1;
        for (let y = 572; y < y1; y += 16) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
        if (!fete) { cloud(150, 120, 26); cloud(860, 90, 22); cloud(700, 170, 14); }

        // Campanile (derrière le fronton)
        ctx.fillStyle = '#e2d2ae'; ctx.fillRect(478, 108, 44, 70);
        ctx.fillStyle = '#5b6b7d'; ctx.beginPath(); ctx.moveTo(472, 110); ctx.quadraticCurveTo(500, 74, 528, 110); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(500, 136, 13, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#374151'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(500, 136); ctx.lineTo(500, 127); ctx.moveTo(500, 136); ctx.lineTo(507, 138); ctx.stroke();
        drawCoq(500, 30);

        // Ailes du bâtiment
        ctx.fillStyle = '#5b6b7d';
        ctx.beginPath(); ctx.moveTo(232, 282); ctx.lineTo(260, 246); ctx.lineTo(740, 246); ctx.lineTo(768, 282); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#efe3c8'; ctx.fillRect(240, 280, 520, 280);
        ctx.fillStyle = '#e6d6b4'; ctx.fillRect(240, 410, 520, 8);      // bandeau entre les étages
        // Avant-corps central
        ctx.fillStyle = '#f3e9d2'; ctx.fillRect(390, 232, 220, 328);
        ctx.fillStyle = '#e2d2ae';
        ctx.beginPath(); ctx.moveTo(378, 234); ctx.lineTo(500, 168); ctx.lineTo(622, 234); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f3e9d2';
        ctx.beginPath(); ctx.moveTo(398, 228); ctx.lineTo(500, 178); ctx.lineTo(602, 228); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d6c49d'; ctx.fillRect(376, 228, 248, 7);
        ctx.fillStyle = '#5b4a2f'; ctx.font = '900 30px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('RF', 500, 209);
        ctx.fillStyle = '#6b5a3c'; ctx.font = '800 13px Georgia, serif';
        ctx.fillText('M A I R I E', 500, 257);

        // Frise avec la devise
        ctx.fillStyle = '#e2d2ae'; ctx.fillRect(236, 278, 528, 28);
        ctx.fillStyle = '#d6c49d'; ctx.fillRect(236, 278, 528, 3); ctx.fillRect(236, 303, 528, 3);
        ctx.fillStyle = '#5b4a2f'; ctx.font = '800 17px Georgia, serif';
        ctx.fillText('LIBERTÉ', 315, 293); ctx.fillText('ÉGALITÉ', 500, 293); ctx.fillText('FRATERNITÉ', 685, 293);
        ctx.fillStyle = '#8a7650';
        for (const x of [407, 593]) { ctx.beginPath(); ctx.arc(x, 292, 3, 0, 2 * Math.PI); ctx.fill(); }

        // Fenêtres
        for (const x of [262, 324, 638, 700]) { windowRect(x, 322, 36, 62, lit); windowRect(x, 446, 36, 74, lit); }
        windowRect(404, 446, 26, 74, lit);
        // Balcon et porte-fenêtre
        ctx.fillStyle = '#c9b48d'; ctx.fillRect(466, 312, 68, 66);
        ctx.fillStyle = lit ? '#ffd56b' : '#7aa6c9'; ctx.fillRect(472, 318, 56, 56);
        ctx.strokeStyle = '#efe3c8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(500, 318); ctx.lineTo(500, 374); ctx.stroke();
        ctx.fillStyle = '#d6c49d'; ctx.fillRect(450, 376, 100, 7);
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(452, 358); ctx.lineTo(548, 358); ctx.stroke();
        for (let x = 456; x <= 544; x += 8) { ctx.beginPath(); ctx.moveTo(x, 358); ctx.lineTo(x, 376); ctx.stroke(); }

        // Porte ouverte, Marianne à l'intérieur
        ctx.fillStyle = '#c9b48d';
        ctx.beginPath(); ctx.moveTo(438, 560); ctx.lineTo(438, 440); ctx.arc(500, 440, 62, Math.PI, 0); ctx.lineTo(562, 560); ctx.closePath(); ctx.fill();
        const gi = ctx.createLinearGradient(0, 380, 0, 560);
        gi.addColorStop(0, lit ? '#9a6b3a' : '#6b4f3a'); gi.addColorStop(1, lit ? '#5e3d22' : '#3f2e22');
        ctx.fillStyle = gi;
        ctx.beginPath(); ctx.moveTo(446, 560); ctx.lineTo(446, 440); ctx.arc(500, 440, 54, Math.PI, 0); ctx.lineTo(554, 560); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8b6b4a'; ctx.fillRect(446, 540, 108, 20);
        drawMarianne(500, 508);
        ctx.fillStyle = '#4b6584';      // battants ouverts
        ctx.beginPath(); ctx.moveTo(446, 446); ctx.lineTo(434, 452); ctx.lineTo(434, 560); ctx.lineTo(446, 560); ctx.fill();
        ctx.beginPath(); ctx.moveTo(554, 446); ctx.lineTo(566, 452); ctx.lineTo(566, 560); ctx.lineTo(554, 560); ctx.fill();
        // Marches
        ctx.fillStyle = '#cfc5b0'; ctx.fillRect(426, 560, 148, 7); ctx.fillStyle = '#c2b79f'; ctx.fillRect(416, 567, 168, 7);

        // Plaque de la Constitution
        ctx.fillStyle = '#8a6a1f'; roundRect(566, 452, 44, 56, 3); ctx.fill();
        ctx.fillStyle = '#c9a646'; roundRect(569, 455, 38, 50, 2); ctx.fill();
        ctx.fillStyle = '#5b4510'; ctx.textAlign = 'center';
        ctx.font = '800 6.5px Georgia, serif'; ctx.fillText('CONSTITUTION', 588, 464);
        ctx.font = '700 6.5px Georgia, serif'; ctx.fillText('4 oct. 1958', 588, 474);
        ctx.font = '800 7.5px Georgia, serif'; ctx.fillText('Article 2', 588, 485);
        ctx.fillRect(575, 493, 26, 1.2); ctx.fillRect(575, 498, 22, 1.2);

        // Drapeaux
        drawFlag(SRP_POLE_L, 'eu');
        drawFlag(SRP_POLE_R, 'fr');      // à droite : le bleu, côté mât, est à gauche
        if (fete) drawGuirlande();

        drawKiosque(lit);
        drawLampe(232, lit);
        drawLampe(768, lit);
        drawAffiche();

        // Notes de musique qui s'envolent du kiosque
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const n of notes) {
            ctx.globalAlpha = Math.min(1, n.t * 3, (1 - n.t) * 2);
            ctx.fillStyle = fete ? '#fde68a' : '#0f766e';
            ctx.font = `800 ${n.s}px "Segoe UI Symbol", "Segoe UI", sans-serif`;
            ctx.fillText(n.c, n.x + 12 * Math.sin(n.t * 6 + n.ph), 440 - 120 * n.t);
        }
        ctx.globalAlpha = 1;

        // Feu d'artifice
        for (const r of rockets) {
            ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(r.x, r.y, 2, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = 'rgba(255,220,150,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y + 18); ctx.stroke();
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const p of fw) {
            const a = Math.max(0, 1 - p.t / p.life);
            ctx.globalAlpha = a * 0.35; ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI); ctx.fill();
            ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    // ── Animation : drapeaux, notes, feu d'artifice ───────────────────────
    function stepAnim(dt) {
        time += dt;
        noteAcc += dt * 1.6;
        while (noteAcc >= 1) {
            noteAcc -= 1;
            notes.push({ x: 90 + Math.random() * 70, t: 0, c: Math.random() < 0.5 ? '♪' : '♫', s: 14 + Math.random() * 8, ph: Math.random() * 6 });
        }
        notes.forEach(n => { n.t += dt / 3.2; });
        notes = notes.filter(n => n.t < 1);
        if (fete) {
            fwAcc += dt * 1.3;
            while (fwAcc >= 1) {
                fwAcc -= 1;
                const top = Math.min(40, -OY / S + 50);
                rockets.push({ x: 90 + Math.random() * 820, y: 560, ty: top + Math.random() * (190 - top), v: 520 });
            }
        }
        const cols = ['#3b82f6', '#ffffff', '#ef4444', '#fbbf24', '#a78bfa'];
        rockets.forEach(r => {
            r.y -= r.v * dt;
            if (r.y <= r.ty) {
                r.dead = true;
                const c1 = cols[Math.floor(Math.random() * cols.length)], c2 = Math.random() < 0.5 ? c1 : cols[Math.floor(Math.random() * cols.length)];
                for (let k = 0; k < 46; k++) {
                    const a = k / 46 * 2 * Math.PI, sp = 90 + Math.random() * 70;
                    fw.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 1.3 + Math.random() * 0.5, c: k % 2 ? c1 : c2 });
                }
            }
        });
        rockets = rockets.filter(r => !r.dead);
        fw.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= 0.985; p.vy *= 0.985; });
        fw = fw.filter(p => p.t < p.life);
        confetti.forEach(c => { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 500 * dt; c.r += c.vr * dt; });
        confetti = confetti.filter(c => c.t < 1.6);
        marks.forEach(m => { m.t += dt; });
        marks = marks.filter(m => m.t < 1.2);
        if (hintT > 0) hintT = Math.max(0, hintT - dt);
    }

    // ── Étiquettes, question du défi, repères (en coordonnées écran) ──────
    const zoneScreen = z => [sx(z[0]), sy(z[1]), sx(z[2]), sy(z[3])];
    function drawOverlays() {
        labelHits = [];
        const fs = Math.max(cssW < 520 ? 8.5 : 11, Math.min(16, cssW / 62));
        if (mode === 'explore' && showLabels) {
            SRP_SYMBOLS.forEach((s, i) => {
                const on = selIdx === i;
                const txt = `${s.ico} ${s.name}`;
                ctx.font = `800 ${on ? fs * 1.08 : fs}px 'Segoe UI', system-ui, sans-serif`;
                const w = ctx.measureText(txt).width + (fs < 11 ? 10 : 16), hh = fs * (on ? 2.0 : 1.8);
                const lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, sx(s.lx)));
                const ly = Math.max(hh / 2 + 4, Math.min(cssH - hh / 2 - 4, sy(s.ly)));
                const ax = sx(s.ax), ay = sy(s.ay);
                ctx.globalAlpha = selIdx >= 0 && !on ? 0.7 : 1;
                ctx.strokeStyle = s.color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
                ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(ax, ay, 3.5, 0, 2 * Math.PI); ctx.fill();
                if (on) { ctx.fillStyle = s.color + '55'; roundRect(lx - w / 2 - 5, ly - hh / 2 - 5, w + 10, hh + 10, 12); ctx.fill(); }
                ctx.fillStyle = on ? s.color : 'rgba(255,255,255,0.95)';
                roundRect(lx - w / 2, ly - hh / 2, w, hh, 9); ctx.fill();
                ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = on ? '#ffffff' : '#1f2937';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(txt, lx, ly + 1);
                ctx.globalAlpha = 1;
                labelHits.push({ i, x: lx - w / 2 - 8, y: ly - hh / 2 - 8, w: w + 16, h: hh + 16 });
            });
        }
        // Repère de la partie choisie
        const ring = (i, col, pulse) => {
            const z = zoneScreen(SRP_SYMBOLS[i].zone), pad = 6 + (pulse ? 4 * Math.sin(time * 8) : 0);
            ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash(pulse ? [] : [8, 6]);
            roundRect(z[0] - pad, z[1] - pad, z[2] - z[0] + 2 * pad, z[3] - z[1] + 2 * pad, 12); ctx.stroke();
            ctx.setLineDash([]);
        };
        if (mode === 'explore' && selIdx >= 0) ring(selIdx, SRP_SYMBOLS[selIdx].color, false);
        if (mode === 'defi' && defi && !defi.done) {
            const tg = SRP_S[defi.order[defi.i]];
            if (defi.answered) ring(tg, '#16a34a', false);
            else if (hintT > 0) { ctx.globalAlpha = Math.min(1, hintT); ring(tg, '#f59e0b', true); ctx.globalAlpha = 1; }
        }
        // Croix rouges des mauvaises réponses
        for (const m of marks) {
            ctx.globalAlpha = Math.max(0, 1 - m.t / 1.2);
            ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 6; ctx.lineCap = 'round';
            const r = 14;
            ctx.beginPath(); ctx.moveTo(m.x - r, m.y - r); ctx.lineTo(m.x + r, m.y + r); ctx.moveTo(m.x + r, m.y - r); ctx.lineTo(m.x - r, m.y + r); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (const c of confetti) {
            ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r);
            ctx.globalAlpha = Math.max(0, 1 - c.t / 1.6); ctx.fillStyle = c.c; ctx.fillRect(-4, -2.5, 8, 5);
            ctx.restore();
        }
        ctx.globalAlpha = 1;
        // Bandeau de la question
        if (mode === 'defi' && defi) {
            let txt, col = '#1e3a8a';
            if (defi.done) { txt = `🏆 Défi terminé : ${defi.score} / ${defi.order.length} trouvés du premier coup !`; col = '#166534'; }
            else if (defi.answered) { txt = `✅ Bravo ! C'est bien : ${SRP_SYMBOLS[SRP_S[defi.order[defi.i]]].name}`; col = '#166534'; }
            else txt = `${defi.i + 1}/${defi.order.length} · ${defi.q}`;
            const bf = Math.max(14, Math.min(24, cssW / 38));
            ctx.font = `800 ${bf}px 'Segoe UI', system-ui, sans-serif`;
            const lines = wrap(txt, cssW - 40);
            const bh = lines.length * bf * 1.25 + 14, bw = Math.min(cssW - 16, Math.max(...lines.map(l => ctx.measureText(l).width)) + 30);
            ctx.fillStyle = 'rgba(255,255,255,0.96)'; roundRect((cssW - bw) / 2, 8, bw, bh, 12); ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            lines.forEach((l, k) => ctx.fillText(l, cssW / 2, 8 + 7 + bf * 1.25 * (k + 0.5)));
        }
    }
    function wrap(txt, maxW) {
        const words = txt.split(' '), lines = [];
        let cur = '';
        for (const w of words) {
            const t = cur ? cur + ' ' + w : w;
            if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
        }
        if (cur) lines.push(cur);
        return lines;
    }

    function draw() {
        if (!syncSize()) return;
        screenMode();
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.setLineDash([]); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
        drawSky();
        sceneMode();
        drawScene();
        screenMode();
        drawOverlays();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function symList() {
        return `<ol class="srp-list">${SRP_SYMBOLS.map((s, i) =>
            `<li><button data-sym="${i}" class="${selIdx === i ? 'on' : ''}" style="--st-c:${s.color}">${s.ico} ${s.name}</button></li>`).join('')}</ol>`;
    }
    function extraHtml(s) {
        if (s.extra === 'drapeau') return `
            <div class="srp-flag"><span style="background:#1f3f99;color:#fff">Bleu</span><span style="background:#fff;color:#374151">Blanc</span><span style="background:#e1262d;color:#fff">Rouge</span></div>
            <p class="srp-box">En juillet 1789, au début de la Révolution, on réunit sur la <b>cocarde</b> le <b>bleu et le rouge</b>, couleurs de la ville de <b>Paris</b>, et le <b>blanc</b>, couleur du <b>roi</b>. Le drapeau tricolore devient le drapeau national en 1794.</p>`;
        if (s.extra === 'devise') return `
            <div class="srp-words">
                <div style="background:#e0e7ff"><b>Liberté</b> : pouvoir penser, s'exprimer et agir librement, en respectant les lois et les autres.</div>
                <div style="background:#f3e8ff"><b>Égalité</b> : tous les citoyens ont les mêmes droits et les mêmes devoirs devant la loi.</div>
                <div style="background:#fce7f3"><b>Fraternité</b> : être solidaires et s'entraider, comme des frères et sœurs.</div>
            </div>`;
        if (s.extra === 'quatorze') return `
            <p class="srp-box">📅 <b>14 juillet 1789</b> : prise de la Bastille.<br>📅 <b>14 juillet 1790</b> : fête de la Fédération.<br>📅 <b>Depuis 1880</b> : fête nationale.</p>
            <button class="srp-go" data-action="fete">${fete ? '☀️ Revenir à la journée' : '🎆 Voir la place un soir de 14 Juillet'}</button>`;
        if (s.extra === 'constitution') return `
            <p class="srp-box">« La langue de la République est le <b>français</b>.<br>L'emblème national est le <b>drapeau tricolore</b>, bleu, blanc, rouge.<br>L'hymne national est la « <b>Marseillaise</b> ».<br>La devise de la République est « <b>Liberté, Égalité, Fraternité</b> ».<br>Son principe est : <b>gouvernement du peuple, par le peuple et pour le peuple</b>. »</p>`;
        if (s.extra === 'marseillaise') {
            const w = (k, t) => `<button class="srp-word${word === k ? ' on' : ''}" data-word="${k}">${t}</button>`;
            return `
            <div class="srp-lyrics">
                <p><b>1<sup>er</sup> couplet</b><br>
                Allons enfants de la ${w('patrie', 'Patrie')},<br>
                Le ${w('gloire', 'jour de gloire')} est arrivé !<br>
                Contre nous de la ${w('tyrannie', 'tyrannie')}<br>
                L'${w('etendard', 'étendard sanglant')} est levé, (bis)<br>
                Entendez-vous dans les ${w('campagnes', 'campagnes')}<br>
                ${w('mugir', 'Mugir')} ces féroces soldats ?<br>
                Ils viennent jusque dans vos bras<br>
                Égorger vos fils, vos ${w('compagnes', 'compagnes')} !</p>
                <p class="refrain">Refrain<br>
                Aux armes, ${w('citoyens', 'citoyens')},<br>
                Formez vos ${w('bataillons', 'bataillons')},<br>
                Marchons, marchons !<br>
                Qu'${w('sangimpur', 'un sang impur')}<br>
                Abreuve nos ${w('sillons', 'sillons')} !</p>
            </div>
            <div class="srp-def">${word ? SRP_WORDS[word] : '👆 Touche un mot surligné pour l\'expliquer.'}</div>`;
        }
        return '';
    }
    function updateInfo() {
        const d = defi;
        const key = mode === 'explore' ? ['e', selIdx, word, fete].join('|')
            : ['d', d ? [d.i, d.tries, d.answered, d.done, d.lastBad].join(',') : '-'].join('|');
        if (scoreEl) scoreEl.textContent = d ? `⭐ Score : ${d.score}` : '';
        if (d) {
            nextBtn.textContent = d.done ? '🔄 Rejouer' : d.answered ? 'Question suivante ▶' : '⏭ Passer';
            nextBtn.classList.toggle('ready', d.answered || d.done);
            hintBtn.disabled = d.answered || d.done;
        }
        feteBtn.classList.toggle('on', fete);
        feteBtn.textContent = fete ? '☀️ Journée' : '🎆 14 Juillet';
        hymnBtn.classList.toggle('on', selIdx === SRP_S.marseillaise);
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const scroll = side.scrollTop;

        if (mode === 'explore') {
            if (selIdx < 0) {
                side.style.borderLeftColor = '#1e3a8a';
                side.innerHTML = `<h4>Éducation morale et civique</h4>
                    <div class="srp-status" style="color:#1e3a8a">🇫🇷 Les symboles de la République</div>
                    <p class="srp-text">La France est une <b>République</b> : un pays où le pouvoir appartient au <b>peuple</b>, qui choisit ses représentants par le vote. Des <b>symboles</b> la représentent et rassemblent tous les citoyens.</p>
                    <p class="srp-box">👆 Neuf symboles se cachent sur la place de la mairie. Touche-les pour les découvrir !</p>
                    ${symList()}
                    <div style="height:8px"></div>
                    <p class="srp-know">💡 <b>Le savais-tu ?</b> Les symboles officiels sont écrits dans l'<b>article 2 de la Constitution</b> : la langue française, le drapeau, l'hymne et la devise.</p>`;
            } else {
                const s = SRP_SYMBOLS[selIdx], K = SRP_KIND[s.kind];
                side.style.borderLeftColor = s.color;
                side.innerHTML = `<h4>Un symbole de la République</h4>
                    <div class="srp-status" style="color:${s.color}">${s.ico} ${s.name}</div>
                    <div class="srp-tag ${K[0]}">${K[1]}</div>
                    ${s.extra === 'marseillaise' ? `<a class="srp-listen" href="${SRP_HYMN_MP3}" target="_blank" rel="noopener">🔊 Écouter La Marseillaise</a>
                    <p class="srp-listen-src">Par l'Orchestre de la Garde républicaine · <a href="${SRP_HYMN_PAGE}" target="_blank" rel="noopener">site de l'Élysée</a></p>` : ''}
                    <p class="srp-text">${s.text}</p>
                    ${extraHtml(s)}
                    <p class="srp-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    <button class="srp-go" data-action="overview">🔙 Tous les symboles</button>
                    ${symList()}`;
            }
            if (lastScrollSel === selIdx) side.scrollTop = scroll;
            lastScrollSel = selIdx;
            return;
        }
        // Défi
        side.style.borderLeftColor = '#1e3a8a';
        if (!d) { side.innerHTML = ''; return; }
        if (d.done) {
            side.innerHTML = `<h4>Défi terminé</h4>
                <div class="srp-status" style="color:#166534">🏆 ${d.score} / ${d.order.length}</div>
                <p class="srp-text">${d.score === d.order.length ? 'Parfait ! Tous les symboles ont été trouvés du premier coup !' : d.score >= d.order.length * 0.6 ? 'Très bien ! Encore un petit effort pour tous les trouver du premier coup.' : 'Retourne dans l\'onglet 🏛️ Découvrir pour revoir les symboles, puis réessaie !'}</p>
                <ul class="srp-recap">${d.order.map((id, k) => `<li>${d.results[k] === 1 ? '✅' : d.results[k] === 0 ? '🟠' : '⏭️'} ${SRP_SYMBOLS[SRP_S[id]].ico} ${SRP_SYMBOLS[SRP_S[id]].name}</li>`).join('')}</ul>
                <p class="srp-know">✅ trouvé du premier coup · 🟠 trouvé après une erreur ou un indice · ⏭️ passé</p>`;
            return;
        }
        const s = SRP_SYMBOLS[SRP_S[d.order[d.i]]];
        if (d.answered) {
            side.style.borderLeftColor = s.color;
            side.innerHTML = `<h4>Question ${d.i + 1} sur ${d.order.length}</h4>
                <p class="srp-ok">✅ ${d.results[d.i] === 1 ? 'Trouvé du premier coup : +1 point !' : 'Trouvé !'}</p>
                <div class="srp-status" style="color:${s.color}">${s.ico} ${s.name}</div>
                <p class="srp-text">${s.text}</p>
                <p class="srp-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>`;
        } else {
            const bad = d.lastBad != null ? SRP_SYMBOLS[d.lastBad] : null;
            side.innerHTML = `<h4>Question ${d.i + 1} sur ${d.order.length}</h4>
                <div class="srp-status" style="color:#1e3a8a">❓ ${d.q}</div>
                ${bad ? `<p class="srp-bad">❌ Non, ça, c'est : ${bad.ico} ${bad.name}. Essaie encore !</p>`
                      : d.tries > 0 ? '<p class="srp-bad">❌ Ce n\'est pas ça. Essaie encore !</p>' : ''}
                <p class="srp-box">👆 Touche la bonne partie du dessin.<br>💡 Besoin d'aide ? Appuie sur <b>Indice</b>.</p>
                <p class="srp-text" style="color:#6b7280">Score : <b>${d.score}</b> point${d.score > 1 ? 's' : ''} (un point quand on trouve du premier coup).</p>`;
        }
    }
    let lastScrollSel = -2;

    // ── Défi ──────────────────────────────────────────────────────────────
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function newDefi() {
        defi = { order: shuffle(SRP_SYMBOLS.map(s => s.id)), i: 0, q: '', tries: 0, score: 0, results: [], answered: false, done: false, lastBad: null };
        setQuestion();
    }
    function setQuestion() {
        const s = SRP_SYMBOLS[SRP_S[defi.order[defi.i]]];
        defi.q = s.q[Math.floor(Math.random() * s.q.length)];
        defi.tries = 0; defi.answered = false; defi.lastBad = null; hintT = 0;
        lastInfoKey = '';
    }
    function nextQuestion() {
        if (!defi) return newDefi();
        if (defi.done) return newDefi();
        if (!defi.answered) defi.results[defi.i] = -1;        // passé
        if (defi.i + 1 >= defi.order.length) { defi.done = true; lastInfoKey = ''; return; }
        defi.i++;
        setQuestion();
    }
    function answer(hitIdx, x, y) {
        if (!defi || defi.done || defi.answered) return;
        const tg = SRP_S[defi.order[defi.i]];
        if (hitIdx === tg) {
            defi.answered = true;
            defi.results[defi.i] = defi.tries === 0 ? 1 : 0;
            if (defi.tries === 0) defi.score++;
            const cols = ['#1f3f99', '#ffffff', '#e1262d', '#fbbf24'];
            for (let k = 0; k < 40; k++) confetti.push({ x, y, vx: (Math.random() - 0.5) * 420, vy: -150 - Math.random() * 300, t: 0, r: 0, vr: (Math.random() - 0.5) * 12, c: cols[k % 4] });
        } else {
            defi.tries++;
            defi.lastBad = hitIdx >= 0 ? hitIdx : null;
            marks.push({ x, y, t: 0 });
        }
        lastInfoKey = '';
    }

    // ── Boucle d'animation ────────────────────────────────────────────────
    function loop(t) {
        if (!widget.isConnected) { animId = null; return; }
        const rdt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t;
        if (sceneWrap.clientWidth > 0) {        // invisible (réduit) : on ne dessine pas
            stepAnim(rdt);
            draw();
            updateInfo();
            animId = requestAnimationFrame(loop);
        } else {
            lastT = 0;
            animId = null;
            setTimeout(() => { if (widget.isConnected && !animId) animId = requestAnimationFrame(loop); }, 400);
        }
    }
    function startLoop() { if (!animId) { lastT = 0; animId = requestAnimationFrame(loop); } }
    function refresh() { lastInfoKey = ''; startLoop(); }

    function setSel(i) {
        selIdx = Math.max(-1, Math.min(SRP_SYMBOLS.length - 1, i));
        word = null;
        side.scrollTop = 0;
        refresh();
    }
    function setMode(md) {
        mode = md === 'defi' ? 'defi' : 'explore';
        container.dataset.mode = mode;
        header.querySelectorAll('.srp-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (mode === 'defi' && !defi) newDefi();
        marks = []; confetti = [];
        side.scrollTop = 0;
        refresh();
    }
    function setFete(v) { fete = !!v; if (!fete) { rockets = []; } refresh(); }

    // ── Interaction sur le dessin ─────────────────────────────────────────
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
    function sceneHit(x, y) {
        const dx = (x - OX) / S, dy = (y - OY) / S, tol = 6 / S;
        for (let i = 0; i < SRP_SYMBOLS.length; i++) {
            const z = SRP_SYMBOLS[i].zone;
            if (dx >= z[0] - tol && dx <= z[2] + tol && dy >= z[1] - tol && dy <= z[3] + tol) return i;
        }
        return -1;
    }
    function onTap(x, y) {
        if (mode === 'explore') {
            for (const h of labelHits) {
                if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { setSel(selIdx === h.i ? -1 : h.i); save(); return; }
            }
            const i = sceneHit(x, y);
            setSel(i === selIdx ? -1 : i);
            save();
        } else {
            answer(sceneHit(x, y), x, y);
            refresh();
        }
    }
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

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
        if (b.dataset.sym) { setSel(Number(b.dataset.sym)); save(); }
        else if (b.dataset.word) {
            word = word === b.dataset.word ? null : b.dataset.word;
            side.querySelectorAll('.srp-word').forEach(x => x.classList.toggle('on', x.dataset.word === word));
            const def = side.querySelector('.srp-def');
            if (def) def.innerHTML = word ? SRP_WORDS[word] : '👆 Touche un mot surligné pour l\'expliquer.';
            lastInfoKey = ['e', selIdx, word, fete].join('|');
        }
        else if (b.dataset.action === 'overview') { setSel(-1); save(); }
        else if (b.dataset.action === 'fete') { setFete(!fete); save(); }
    });
    header.querySelectorAll('.srp-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation(); setMode(b.dataset.mode); save();
    }));
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); refresh(); save(); });
    hymnBtn.addEventListener('click', () => { setSel(selIdx === SRP_S.marseillaise ? -1 : SRP_S.marseillaise); save(); });
    feteBtn.addEventListener('click', () => { setFete(!fete); save(); });
    nextBtn.addEventListener('click', () => { nextQuestion(); refresh(); });
    hintBtn.addEventListener('click', () => {
        if (!defi || defi.answered || defi.done) return;
        hintT = 2.5;
        defi.tries++;          // l'indice fait perdre le point de la question
        lastInfoKey = '';
        startLoop();
    });
    restartBtn.addEventListener('click', () => { newDefi(); refresh(); });

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

    // ── Boutons fenêtre (jaune / vert / rouge) ────────────────────────────
    const wfMin = header.querySelector('[data-role="wf-min"]');
    const wfMax = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;
    wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🇫🇷 Symboles de la République', {
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
        animId = null;
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
    setMode('explore');

    // ── API pour save-load.js ─────────────────────────────────────────────
    // (le défi en cours n'est pas sauvegardé : il recommence au rechargement)
    widget._srpGetData = () => ({
        containerW: contW, containerH: contH,
        mode, selIdx, showLabels, fete
    });
    widget._srpSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        fete = !!d.fete;
        selIdx = typeof d.selIdx === 'number' ? Math.max(-1, Math.min(SRP_SYMBOLS.length - 1, Math.round(d.selIdx))) : -1;
        defi = null;
        setMode(d.mode || 'explore');
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_srpSetData');

    save();
    return widget;
}
