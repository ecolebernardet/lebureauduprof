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
// WIDGET LE CORPS HUMAIN — Le Bureau du Prof
// Pour des élèves de fin de primaire (CM1 – CM2 – 6e). Deux onglets :
//  🧩 Les calques : un corps vu de face sur lequel on superpose, à volonté,
//     des calques à afficher ou masquer : la peau, le squelette, les organes,
//     la digestion, la respiration et la circulation.
//  🔍 Un système : on regarde un seul système à la fois, seul sur la
//     silhouette, avec son explication et la liste de ses parties.
// ▶ Lecture anime le corps : les aliments avancent dans le tube digestif,
// les poumons se gonflent et l'air entre puis sort, le cœur bat et le sang
// part dans les artères (rouge) et revient par les veines (bleu).
// On touche une étiquette ou un organe pour l'expliquer ; « Visite guidée »
// enchaîne les parties visibles. Une fiche à droite donne l'explication et
// un « Le savais-tu ? ».
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
    if (document.getElementById('chu-style')) return;
    const s = document.createElement('style');
    s.id = 'chu-style';
    s.textContent = `
        .widget[data-type="corps-humain"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .chu-container {
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
        .chu-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .chu-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .chu-header .wf-btns { gap: 8px; }
        .chu-header .wf-btn { width: 18px; height: 18px; }
        .chu-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .chu-container.wf-fullboard {
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
        .chu-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .chu-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .chu-tab.on { background: #fff; color: #9b2c3c; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .chu-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .chu-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .chu-btn:hover { background: #e0e0e0; }
        .chu-btn:active { transform: scale(0.96); }
        .chu-btn.on { background: #c0485a; color: #fff; border-color: #c0485a; }
        .chu-btn-play { min-width: 112px; }
        .chu-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .chu-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .chu-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .chu-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .chu-layer-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); background: #fff; color: #9ca3af; }
        .chu-layer-btn::before { content: '☐ '; }
        .chu-layer-btn.on { background: var(--st-c, #c0485a); border-color: var(--st-c, #c0485a); color: #fff; }
        .chu-layer-btn.on::before { content: '☑ '; }
        .chu-sys-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .chu-sys-btn.on { background: var(--st-c, #c0485a); border-color: var(--st-c, #c0485a); color: #fff; }

        /* Corps */
        .chu-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .chu-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #eaf1f7;
        }
        .chu-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .chu-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: #6b7280; pointer-events: none;
        }
        .chu-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #c0485a;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .chu-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #7a2232; }
        .chu-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .chu-tag { display: inline-block; border-radius: 20px; padding: 1px 9px; color: #fff; font-size: .82em; font-weight: 800; margin-bottom: 4px; }
        .chu-text { margin: 0 0 6px; }
        .chu-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .chu-note { background: #eef4fb; border-radius: 8px; padding: 6px 9px; color: #1d4f86; margin: 0 0 8px; font-size: .92em; }
        .chu-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .chu-list button, .chu-list .chu-li {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation; box-sizing: border-box;
        }
        .chu-list button.on { background: var(--st-c, #c0485a); color: #fff; }
        .chu-list .chu-li { display: flex; align-items: center; gap: 6px; cursor: default; }
        .chu-list .chu-li span { flex: 1; }
        .chu-list .chu-li.off { opacity: .55; }
        .chu-list .chu-li button { width: auto; min-height: 28px; border-left-width: 1px; padding: 2px 8px; font-size: 12px; }

        /* Aide */
        .chu-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .chu-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 360px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .chu-help-popup.show { display: block; }
        .chu-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .chu-help-popup p { margin: 0 0 6px; }

        .chu-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .chu-resize-handle:hover { opacity: 1; }
        .chu-container[data-mode="systeme"] .chu-only-calques { display: none !important; }
        .chu-container[data-mode="calques"] .chu-only-sys { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .chu-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .chu-tab-short { display: none; }
        .chu-header { min-width: 0; max-width: 100%; }
        .chu-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .chu-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chu-header .wf-btns { flex-shrink: 0; }
        .chu-container.wf-fullboard .chu-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .chu-container { padding: 10px 10px 8px; gap: 6px; }
            .chu-header { gap: 6px; }
            .chu-title { font-size: 13px; }
            .chu-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .chu-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .chu-row > * { flex-shrink: 0; }
            .chu-row + .chu-row .chu-lbl:first-child { display: none; }
            .chu-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .chu-btn-play { min-width: 0; }
            .chu-sep { display: none; }
            .chu-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .chu-side { padding: 8px 10px; font-size: 13px; }
            .chu-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .chu-title { display: none; }
            .chu-tab { padding: 3px 7px; font-size: 11.5px; }
            .chu-tab-long { display: none; }
            .chu-tab-short { display: inline; }
            .chu-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .chu-body { flex-direction: column; }
            .chu-scene-wrap { flex: 1 1 0; min-height: 260px; }
            .chu-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 38%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .chu-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
const CHU_SYS = {
    peau: {
        ico: '🧍', name: 'La peau', short: 'Peau', color: '#d08b5b',
        text: 'La <b>peau</b> recouvre tout le corps et le protège. Masque-la pour regarder à l\'intérieur !',
        know: 'La peau est le plus grand organe du corps : chez un adulte, elle pèse environ 4 kg.'
    },
    squelette: {
        ico: '🦴', name: 'Le squelette', short: 'Squelette', color: '#a88b55',
        text: 'Le squelette est formé d\'environ <b>206 os</b>. Il <b>soutient</b> le corps et lui donne sa forme, il <b>protège</b> les organes fragiles (le crâne protège le cerveau, les côtes protègent le cœur et les poumons) et il permet de <b>bouger</b> grâce aux <b>muscles</b> attachés aux os et aux <b>articulations</b> (épaule, coude, genou…).',
        know: 'Un bébé naît avec environ 300 os : certains se soudent ensemble en grandissant. Le plus petit os du corps, l\'étrier, est caché dans l\'oreille.'
    },
    organes: {
        ico: '🧠', name: 'Les organes', short: 'Organes', color: '#c0587e',
        text: 'Un <b>organe</b> est une partie du corps qui a un rôle précis. Le <b>cerveau</b> commande tout le corps, le <b>cœur</b> fait circuler le sang, les <b>poumons</b> permettent de respirer, l\'<b>estomac</b> et les <b>intestins</b> digèrent les aliments, les <b>reins</b> nettoient le sang en fabriquant l\'<b>urine</b>, qui est stockée dans la <b>vessie</b>.',
        know: 'Les organes travaillent en équipe : on parle de « fonctions » (la digestion, la respiration, la circulation…). Aucun ne peut fonctionner tout seul.'
    },
    digestion: {
        ico: '🍎', name: 'La digestion', short: 'Digestion', color: '#e07b39',
        text: 'La digestion transforme les aliments en <b>nutriments</b> que le sang peut transporter. Les aliments sont mâchés dans la <b>bouche</b>, descendent par l\'<b>œsophage</b>, sont brassés dans l\'<b>estomac</b>, puis les nutriments passent dans le sang à travers la paroi de l\'<b>intestin grêle</b>. Ce qui n\'est pas digéré continue dans le <b>gros intestin</b> et forme les excréments.',
        know: 'L\'intestin grêle mesure environ 6 à 7 mètres, tout replié dans le ventre ! Un repas met entre 1 et 3 jours pour traverser tout le tube digestif.'
    },
    respiration: {
        ico: '🌬️', name: 'La respiration', short: 'Respiration', color: '#3b8fd9',
        text: 'Quand on <b>inspire</b>, l\'air entre par le <b>nez</b> ou par la <b>bouche</b>, descend dans la <b>trachée</b>, puis dans les <b>bronches</b> jusqu\'aux <b>poumons</b>, qui se gonflent. Le <b>dioxygène</b> de l\'air passe dans le sang. Quand on <b>expire</b>, on rejette le <b>dioxyde de carbone</b>, un déchet fabriqué par le corps. Le <b>diaphragme</b>, un muscle sous les poumons, aide l\'air à entrer et sortir.',
        know: 'Au repos, on respire environ 12 à 20 fois par minute : plus de 20 000 fois par jour ! Quand on court, on respire plus vite car les muscles ont besoin de plus de dioxygène.'
    },
    circulation: {
        ico: '❤️', name: 'La circulation', short: 'Circulation', color: '#d63a3a',
        text: 'Le <b>cœur</b> est un muscle qui fonctionne comme une <b>pompe</b>. Il envoie le sang dans tout le corps par les <b>artères</b> (en rouge : sang riche en dioxygène et en nutriments). Le sang revient vers le cœur par les <b>veines</b> (en bleu : sang chargé de déchets). En passant dans les poumons, le sang se recharge en dioxygène.',
        know: 'Le cœur bat environ 100 000 fois par jour. Mis bout à bout, tous les vaisseaux sanguins d\'un adulte feraient plus de deux fois le tour de la Terre !'
    }
};
const CHU_LAYERS = ['peau', 'squelette', 'organes', 'digestion', 'respiration', 'circulation'];
const CHU_SYSTEMS = ['squelette', 'organes', 'digestion', 'respiration', 'circulation'];
const CHU_OVERVIEW = {
    text: 'Le corps humain est une machine où tout travaille ensemble. Le <b>squelette</b> le soutient, les <b>organes</b> ont chacun leur rôle et trois grandes fonctions apportent à chaque partie du corps ce dont elle a besoin : la <b>digestion</b> (les nutriments), la <b>respiration</b> (le dioxygène) et la <b>circulation</b> du sang, qui transporte tout cela.',
    know: 'Le corps d\'un adulte contient environ 5 litres de sang, qui fait le tour du corps en à peu près une minute.'
};

// Parties à découvrir. x : position horizontale (fraction de la hauteur du corps,
// 0 = milieu ; vers la droite de l'écran = côté gauche de la personne), y : hauteur (0 … 1).
// side : colonne de l'étiquette ('L' à gauche de l'écran, 'R' à droite).
// org : la partie est aussi affichée par le calque « Organes ».
const CHU_PARTS = [
    { id: 'peau', sys: 'peau', name: 'La peau', x: -0.163, y: 0.42, side: 'L',
      text: 'La <b>peau</b> recouvre et protège tout le corps contre les microbes, les chocs et les rayons du soleil. C\'est l\'organe du <b>toucher</b> : elle sent le chaud, le froid, la douleur. Quand il fait chaud, elle <b>transpire</b> pour refroidir le corps.',
      know: 'La peau se renouvelle sans arrêt : les cellules mortes tombent, et une grande partie de la poussière de la maison vient de là !' },

    { id: 'crane', sys: 'squelette', name: 'Le crâne', x: -0.034, y: 0.035, side: 'L',
      text: 'Le <b>crâne</b> est une boîte d\'os très solide qui <b>protège le cerveau</b>. Seule la mâchoire du bas (la mandibule) peut bouger, pour manger et parler.',
      know: 'Chez le bébé, les os du crâne ne sont pas encore soudés : on sent des zones molles, les fontanelles.' },
    { id: 'colonne', sys: 'squelette', name: 'La colonne vertébrale', x: 0, y: 0.165, side: 'R',
      text: 'La <b>colonne vertébrale</b> est formée de 33 petits os empilés, les <b>vertèbres</b>. Elle <b>soutient</b> le corps et le tient droit, tout en lui permettant de se pencher et de tourner. À l\'intérieur, elle protège la <b>moelle épinière</b>, qui relie le cerveau au reste du corps.',
      know: 'La girafe, avec son grand cou, a autant de vertèbres dans le cou que nous : sept !' },
    { id: 'cotes', sys: 'squelette', name: 'Les côtes', x: -0.075, y: 0.245, side: 'L',
      text: 'Les 12 paires de <b>côtes</b> forment la <b>cage thoracique</b>. Elle protège le <b>cœur</b> et les <b>poumons</b>, et elle se soulève quand on inspire.',
      know: 'Les côtes sont attachées devant au sternum, un os plat au milieu de la poitrine.' },
    { id: 'humerus', sys: 'squelette', name: 'L\'humérus (le bras)', x: 0.128, y: 0.275, side: 'R',
      text: 'L\'<b>humérus</b> est l\'os du bras, entre l\'<b>épaule</b> et le <b>coude</b>. L\'avant-bras contient deux os, le radius et le cubitus. Le <b>biceps</b>, un muscle attaché à ces os, plie le coude en se contractant.',
      know: 'La main et le poignet comptent à eux seuls 27 os !' },
    { id: 'bassin', sys: 'squelette', name: 'Le bassin', x: -0.062, y: 0.47, side: 'L',
      text: 'Le <b>bassin</b> est un ensemble d\'os larges en bas du ventre. Il porte le poids du haut du corps, protège la vessie et relie la colonne vertébrale aux <b>jambes</b>.',
      know: 'Le bassin des femmes est plus large que celui des hommes, pour laisser passer le bébé à la naissance.' },
    { id: 'femur', sys: 'squelette', name: 'Le fémur', x: -0.055, y: 0.61, side: 'L',
      text: 'Le <b>fémur</b> est l\'os de la cuisse. C\'est le <b>plus long</b> et le plus solide os du corps : il porte tout le poids du corps quand on marche, court ou saute.',
      know: 'Le fémur mesure environ le quart de la taille d\'une personne.' },
    { id: 'genou', sys: 'squelette', name: 'Le genou (articulation)', x: 0.052, y: 0.728, side: 'R',
      text: 'Le <b>genou</b> est une <b>articulation</b> : l\'endroit où deux os se rejoignent et peuvent bouger. Il relie le fémur au tibia. Devant, il est protégé par un petit os rond, la <b>rotule</b>.',
      know: 'Les articulations sont tenues par des ligaments et recouvertes de cartilage, lisse et glissant, pour bouger sans s\'user.' },
    { id: 'tibia', sys: 'squelette', name: 'Le tibia et le péroné', x: -0.047, y: 0.84, side: 'L',
      text: 'La jambe, sous le genou, contient deux os : le <b>tibia</b>, gros et solide (on le sent sous la peau, devant), et le <b>péroné</b>, plus fin, sur le côté.',
      know: 'Quand on se cogne le tibia, ça fait très mal : il n\'y a presque pas de muscle pour le protéger devant.' },

    { id: 'cerveau', sys: 'organes', name: 'Le cerveau', x: 0.026, y: 0.034, side: 'R',
      text: 'Le <b>cerveau</b> commande tout le corps. Il reçoit les messages des <b>sens</b> (vue, ouïe, toucher, goût, odorat), il réfléchit, il retient (la mémoire) et il envoie des ordres aux muscles par les <b>nerfs</b>.',
      know: 'Les messages des nerfs peuvent voyager à plus de 400 km/h ! Le cerveau a besoin de beaucoup de dioxygène et de sommeil pour bien fonctionner.' },
    { id: 'reins', sys: 'organes', name: 'Les reins', x: 0.054, y: 0.39, side: 'R',
      text: 'Les deux <b>reins</b>, en forme de haricot, se trouvent dans le dos, sous les côtes. Ils <b>filtrent le sang</b> pour en retirer les déchets et l\'eau en trop : cela forme l\'<b>urine</b>, qui descend vers la vessie.',
      know: 'Tout le sang du corps passe dans les reins des dizaines de fois par jour.' },
    { id: 'vessie', sys: 'organes', name: 'La vessie', x: 0, y: 0.5, side: 'R',
      text: 'La <b>vessie</b> est une poche qui <b>stocke l\'urine</b> fabriquée par les reins. Quand elle est pleine, elle envoie un message au cerveau : on a envie d\'aller aux toilettes.',
      know: 'La vessie d\'un adulte peut contenir environ un demi-litre d\'urine.' },

    { id: 'bouche', sys: 'digestion', name: 'La bouche', x: 0, y: 0.112, side: 'L',
      text: 'La digestion commence dans la <b>bouche</b> : les <b>dents</b> coupent et écrasent les aliments, la <b>salive</b> les mouille et commence à les transformer, et la langue forme une boulette qu\'on avale.',
      know: 'On fabrique environ 1 litre de salive par jour. Bien mâcher aide toute la digestion !' },
    { id: 'oesophage', sys: 'digestion', name: 'L\'œsophage', x: 0.006, y: 0.205, side: 'R',
      text: 'L\'<b>œsophage</b> est un tuyau d\'environ 25 cm qui conduit les aliments de la gorge jusqu\'à l\'estomac. Ses muscles les poussent vers le bas.',
      know: 'Grâce aux muscles de l\'œsophage, on pourrait même avaler la tête en bas (mais ce n\'est pas conseillé) !' },
    { id: 'estomac', sys: 'digestion', name: 'L\'estomac', org: true, x: 0.055, y: 0.372, side: 'R',
      text: 'L\'<b>estomac</b> est une poche musclée. Il <b>brasse</b> les aliments pendant plusieurs heures avec des sucs très acides, qui les transforment en une sorte de bouillie.',
      know: 'Les sucs de l\'estomac sont si acides qu\'ils pourraient attaquer le métal ; une couche de mucus protège la paroi de l\'estomac.' },
    { id: 'foie', sys: 'digestion', name: 'Le foie', org: true, x: -0.05, y: 0.36, side: 'L',
      text: 'Le <b>foie</b> est le plus gros organe à l\'intérieur du corps. Il fabrique la <b>bile</b>, qui aide à digérer les graisses, il met en réserve des nutriments et il nettoie le sang de certains produits toxiques.',
      know: 'Le foie peut repousser : même si on en retire une partie, il se reconstruit.' },
    { id: 'grele', sys: 'digestion', name: 'L\'intestin grêle', org: true, x: 0.02, y: 0.452, side: 'R',
      text: 'Dans l\'<b>intestin grêle</b>, la digestion se termine. Les <b>nutriments</b> traversent sa paroi et <b>passent dans le sang</b>, qui les apporte à tout le corps.',
      know: 'L\'intestin grêle mesure 6 à 7 mètres. Sa paroi est couverte de minuscules replis : déplié, il couvrirait presque la surface d\'un terrain de tennis !' },
    { id: 'gros', sys: 'digestion', name: 'Le gros intestin', org: true, x: -0.065, y: 0.44, side: 'L',
      text: 'Le <b>gros intestin</b> récupère l\'eau de ce qui n\'a pas été digéré. Les restes forment les <b>excréments</b> (les selles), qui sortent par l\'<b>anus</b>.',
      know: 'Le gros intestin abrite des milliards de bactéries utiles, qui aident à digérer et à rester en bonne santé.' },

    { id: 'nez', sys: 'respiration', name: 'Le nez et la bouche', x: 0, y: 0.091, side: 'R',
      text: 'L\'air entre surtout par le <b>nez</b>, qui le <b>réchauffe</b>, l\'<b>humidifie</b> et le <b>filtre</b> grâce à ses poils et à son mucus : il retient les poussières. L\'air peut aussi entrer par la <b>bouche</b>, par exemple quand on a le nez bouché ou quand on court. Nez et bouche se rejoignent dans la <b>gorge</b>, d\'où l\'air descend dans la trachée.',
      know: 'Il vaut mieux respirer par le nez : par la bouche, l\'air arrive froid, sec et non filtré dans les poumons. Le nez est aussi l\'organe de l\'odorat.' },
    { id: 'trachee', sys: 'respiration', name: 'La trachée', x: 0, y: 0.172, side: 'L',
      text: 'La <b>trachée</b> est le tuyau qui conduit l\'air de la gorge vers les poumons. Elle est renforcée par des anneaux de <b>cartilage</b> qui l\'empêchent de s\'écraser.',
      know: 'Quand on avale, un petit clapet, l\'épiglotte, ferme la trachée pour que les aliments partent dans l\'œsophage. Si on parle en mangeant, on peut « avaler de travers » !' },
    { id: 'bronches', sys: 'respiration', name: 'Les bronches', x: 0.03, y: 0.238, side: 'R',
      text: 'La trachée se divise en deux <b>bronches</b>, une pour chaque poumon. Elles se ramifient ensuite en tuyaux de plus en plus fins, comme les branches d\'un arbre.',
      know: 'Au bout des plus petites bronches, il y a des millions de minuscules sacs d\'air, les alvéoles : c\'est là que le dioxygène passe dans le sang.' },
    { id: 'poumons', sys: 'respiration', name: 'Les poumons', org: true, x: -0.058, y: 0.285, side: 'L',
      text: 'Les deux <b>poumons</b> se gonflent quand on inspire et se dégonflent quand on expire. Ils font passer le <b>dioxygène</b> de l\'air dans le sang et rejettent le <b>dioxyde de carbone</b>.',
      know: 'Le poumon gauche est un peu plus petit que le droit, pour laisser de la place au cœur. Le tabac abîme les poumons.' },
    { id: 'diaphragme', sys: 'respiration', name: 'Le diaphragme', x: 0.082, y: 0.345, side: 'R',
      text: 'Le <b>diaphragme</b> est un grand <b>muscle</b> en forme de dôme, sous les poumons. Quand il descend, les poumons se gonflent et l\'air entre ; quand il remonte, l\'air ressort.',
      know: 'Le hoquet, ce sont de petites contractions brusques du diaphragme.' },

    { id: 'coeur', sys: 'circulation', name: 'Le cœur', org: true, x: 0.016, y: 0.29, side: 'R',
      text: 'Le <b>cœur</b> est un muscle creux, gros comme un poing, placé entre les poumons. Il se contracte sans arrêt pour <b>pomper le sang</b> et l\'envoyer dans tout le corps : ce sont les <b>battements</b> du cœur.',
      know: 'Au repos, le cœur d\'un adulte bat 60 à 80 fois par minute, celui d\'un enfant un peu plus vite. On peut sentir ces battements au poignet : c\'est le pouls.' },
    { id: 'arteres', sys: 'circulation', name: 'Les artères', x: 0.134, y: 0.31, side: 'R',
      text: 'Les <b>artères</b> (en rouge) sont les vaisseaux qui <b>partent du cœur</b>. Elles apportent à tout le corps du sang riche en <b>dioxygène</b> et en <b>nutriments</b>.',
      know: 'La plus grosse artère, l\'aorte, sort du cœur ; elle est presque aussi large qu\'un tuyau d\'arrosage.' },
    { id: 'veines', sys: 'circulation', name: 'Les veines', x: -0.124, y: 0.31, side: 'L',
      text: 'Les <b>veines</b> (en bleu) <b>ramènent le sang vers le cœur</b>. Ce sang a donné son dioxygène et récupéré les <b>déchets</b> ; il ira se recharger dans les poumons.',
      know: 'En vrai, le sang des veines n\'est pas bleu : il est rouge foncé. Le bleu est une convention des schémas.' },
    { id: 'sang', sys: 'circulation', name: 'Le sang', x: 0.05, y: 0.86, side: 'R',
      text: 'Le <b>sang</b> circule en boucle dans tout le corps, jusqu\'au bout des orteils. Il <b>transporte</b> le dioxygène, les nutriments et les déchets, et il contient des globules blancs qui combattent les microbes.',
      know: 'Un adulte a environ 5 litres de sang. Une goutte de sang contient des millions de globules rouges.' }
];
const CHU_PART_BY_ID = {};
CHU_PARTS.forEach(p => { CHU_PART_BY_ID[p.id] = p; });

// ── Géométrie (coordonnées du corps : x en fraction de la hauteur, y de 0 à 1) ──
function _chuLens(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return L;
}
function _chuAt(path, t) {
    const pts = path.pts, L = path.L;
    const d = Math.max(0, Math.min(1, t)) * L[L.length - 1];
    let i = 0;
    while (i < L.length - 2 && L[i + 1] < d) i++;
    const u = (d - L[i]) / ((L[i + 1] - L[i]) || 1);
    const a = pts[i], b = pts[i + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
function _chuPath(pts) { return { pts, L: _chuLens(pts), len: _chuLens(pts).pop() }; }

const CHU_SI = (() => {          // intestin grêle (serpentin)
    const a = [[0.015, 0.405], [0.03, 0.418]];
    [0.428, 0.44, 0.452, 0.464, 0.476].forEach((y, i) => {
        if (i % 2 === 0) a.push([0.038, y], [-0.038, y]); else a.push([-0.038, y], [0.038, y]);
    });
    a.push([-0.052, 0.478]);
    return a;
})();
const CHU_LI = [[-0.052, 0.478], [-0.064, 0.47], [-0.066, 0.425], [-0.056, 0.413], [0.056, 0.413], [0.066, 0.425],
                [0.066, 0.47], [0.048, 0.493], [0.018, 0.503], [0.006, 0.525]];
const CHU_OESO = [[0, 0.118], [0, 0.15], [0.004, 0.21], [0.012, 0.29], [0.03, 0.348]];
const CHU_DIG = _chuPath([[0, 0.112], ...CHU_OESO.slice(1), [0.05, 0.362], [0.062, 0.378], [0.05, 0.395], [0.025, 0.4],
                          ...CHU_SI, ...CHU_LI.slice(1)]);
const CHU_AIR = [];
[-1, 1].forEach(s => {
    const low = [[0, 0.13], [0, 0.212], [s * 0.028, 0.235], [s * 0.045, 0.26], [s * 0.055, 0.3]];
    CHU_AIR.push(_chuPath([[0, 0.098], ...low]));                    // par le nez
    CHU_AIR.push(_chuPath([[s * 0.008, 0.112], [0, 0.124], ...low]));  // par la bouche
});
const CHU_ART = [], CHU_VEIN = [];
[-1, 1].forEach(s => {
    const paths = [
        [[0.01, 0.275], [s * 0.006, 0.245], [s * 0.013, 0.2], [s * 0.015, 0.15], [s * 0.018, 0.1]],
        [[0.01, 0.275], [s * 0.022, 0.238], [s * 0.06, 0.218], [s * 0.103, 0.222], [s * 0.133, 0.3], [s * 0.145, 0.36], [s * 0.157, 0.45], [s * 0.166, 0.5]],
        [[0.014, 0.305], [0.008, 0.34], [0.008, 0.46], [s * 0.03, 0.49], [s * 0.046, 0.53], [s * 0.05, 0.7], [s * 0.048, 0.8], [s * 0.05, 0.93], [s * 0.068, 0.962]]
    ];
    paths.forEach(p => {
        CHU_ART.push(_chuPath(p));
        const v = p.map((q, i) => {
            if (i === 0) return [-0.002, 0.283];
            if (q[1] < 0.215) return [q[0] + s * 0.012, q[1]];       // cou, tête : sur le côté
            if (Math.abs(q[0]) < 0.03) return [q[0] - 0.016, q[1]];   // tronc : la veine cave
            return [q[0] - s * 0.011, q[1]];                          // bras, jambes : côté intérieur
        }).reverse();
        CHU_VEIN.push(_chuPath(v));
    });
});
// petite circulation (cœur ⇄ poumons)
const CHU_PULM_OUT = [-1, 1].map(s => _chuPath([[0.004, 0.282], [s * 0.03, 0.27], [s * 0.052, 0.266]]));
const CHU_PULM_IN = [-1, 1].map(s => _chuPath([[s * 0.052, 0.292], [s * 0.03, 0.297], [0.012, 0.297]]));

// ── Création du widget ────────────────────────────────────────────────────
function createCorpsHumainWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 640;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'corps-humain';
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
    container.className = 'chu-container';
    container.dataset.mode = 'calques';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.66)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.min(Math.round(window.innerHeight * 0.86), Math.round(contW * 0.74)));

    const header = document.createElement('div');
    header.className = 'chu-header';
    header.innerHTML = `
        <span class="chu-title">🫀<span> Le corps humain</span></span>
        <div class="chu-tabs">
            <button class="chu-tab on" data-mode="calques" title="Superposer les calques"><span class="chu-tab-long">🧩 Les calques</span><span class="chu-tab-short">🧩 Calques</span></button>
            <button class="chu-tab" data-mode="systeme" title="Voir un seul système à la fois"><span class="chu-tab-long">🔍 Un système à la fois</span><span class="chu-tab-short">🔍 Un système</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'chu-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Ligne 1 : lecture, visite, navigation, étiquettes
    const row1 = document.createElement('div');
    row1.className = 'chu-row';
    row1.innerHTML = `
        <button class="chu-btn chu-btn-play" title="Lancer / arrêter l'animation">▶ Lecture</button>
        <button class="chu-btn chu-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="chu-sep"></span>
        <button class="chu-btn chu-btn-guide" title="Présente les parties visibles l'une après l'autre">🎓 Visite guidée</button>
        <button class="chu-btn chu-prev" title="Partie précédente">◀ Partie</button>
        <button class="chu-btn chu-next" title="Partie suivante">Partie ▶</button>
        <button class="chu-btn chu-all" title="Revenir à la présentation générale">🔄 Vue d'ensemble</button>
        <span class="chu-sep"></span>
        <button class="chu-btn chu-labels on" title="Afficher les noms des parties">🏷️ Étiquettes</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : calques (cases à cocher) / système (un seul)
    const row2 = document.createElement('div');
    row2.className = 'chu-row';
    row2.innerHTML = `
        <span class="chu-lbl chu-only-calques">Calques :</span>
        ${CHU_LAYERS.map(k => `<button class="chu-btn chu-layer-btn chu-only-calques" data-layer="${k}" style="--st-c:${CHU_SYS[k].color}" title="Afficher / masquer : ${CHU_SYS[k].name.toLowerCase()}">${CHU_SYS[k].ico} ${CHU_SYS[k].short}</button>`).join('')}
        <button class="chu-btn chu-layers-all chu-only-calques" title="Afficher tous les calques">Tout</button>
        <button class="chu-btn chu-layers-none chu-only-calques" title="Masquer tous les calques">Aucun</button>
        <span class="chu-lbl chu-only-sys">Système :</span>
        ${CHU_SYSTEMS.map(k => `<button class="chu-btn chu-sys-btn chu-only-sys" data-sys="${k}" style="--st-c:${CHU_SYS[k].color}" title="${CHU_SYS[k].name}">${CHU_SYS[k].ico} ${CHU_SYS[k].short}</button>`).join('')}
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'chu-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'chu-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'chu-canvas';
    const hint = document.createElement('div');
    hint.className = 'chu-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'chu-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'chu-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Le corps humain</h4>
        <p><b>🧩 Les calques</b> : coche ou décoche les calques (peau, squelette, organes, digestion, respiration,
        circulation) pour les superposer. <b>Tout</b> / <b>Aucun</b> les affiche ou les masque d'un coup.</p>
        <p><b>🔍 Un système à la fois</b> : choisis un système pour le regarder seul sur la silhouette, avec son
        explication et la liste de ses parties.</p>
        <p><b>Touche une étiquette ou un organe</b> pour l'expliquer dans la fiche de droite. <b>◀ Partie ▶</b> passe
        d'une partie à l'autre, <b>🎓 Visite guidée</b> les enchaîne toute seule.</p>
        <p><b>▶ Lecture</b> anime le corps : les aliments avancent dans le tube digestif, l'air entre et sort des
        poumons (par le nez ou par la bouche), le cœur bat et le sang circule (artères en rouge, veines en bleu).</p>
        <p style="color:#888">Schéma simplifié : les formes et les tailles des organes ne sont pas exactes.
        Le corps est vu de face : son côté gauche est à droite de l'écran.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'chu-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const playBtn = $('.chu-btn-play'), speedBtn = $('.chu-btn-speed'), guideBtn = $('.chu-btn-guide');
    const labelsBtn = $('.chu-labels');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'calques';
    let sys = 'squelette';          // système affiché seul (onglet « Un système »)
    const layers = { peau: true, squelette: false, organes: true, digestion: false, respiration: false, circulation: false };
    let part = null;                // partie sélectionnée (id) ou null
    let showLabels = true;
    let playing = false, fast = false, guided = false, guideT = 0;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let S = 100, cx = 0, top0 = 0;  // taille du corps en px, centre, haut
    let labelHits = [], anchorHits = [];
    let baseHint = '';

    const vis = k => mode === 'calques' ? !!layers[k] : k === sys;
    const partVisible = p => p.sys === 'peau' ? vis('peau') : (vis(p.sys) || (!!p.org && vis('organes')));
    const visibleParts = () => CHU_PARTS.filter(partVisible);

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }
    const PX = x => cx + x * S, PY = y => top0 + y * S;
    const P = p => [PX(p[0]), PY(p[1])];
    const frac = v => v - Math.floor(v);

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    function smoothClosed(pts) {          // pts en px
        const n = pts.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        ctx.beginPath();
        const s0 = m(pts[n - 1], pts[0]);
        ctx.moveTo(s0[0], s0[1]);
        for (let i = 0; i < n; i++) {
            const p = pts[i], e = m(p, pts[(i + 1) % n]);
            ctx.quadraticCurveTo(p[0], p[1], e[0], e[1]);
        }
        ctx.closePath();
    }
    function polyline(pts) {             // pts en coordonnées du corps
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(PX(p[0]), PY(p[1])) : ctx.moveTo(PX(p[0]), PY(p[1])));
    }
    function shape(pts, k, c) {          // forme lissée, agrandie de k autour du point c
        smoothClosed(pts.map(p => {
            const x = c ? c[0] + (p[0] - c[0]) * k : p[0], y = c ? c[1] + (p[1] - c[1]) * k : p[1];
            return [PX(x), PY(y)];
        }));
    }
    function fillStroke(fill, stroke, lw) {
        ctx.fillStyle = fill; ctx.fill();
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || Math.max(1, S * 0.0025); ctx.stroke(); }
    }
    function ell(x, y, rx, ry, rot) {
        ctx.beginPath(); ctx.ellipse(PX(x), PY(y), Math.max(0.5, rx * S), Math.max(0.5, ry * S), rot || 0, 0, 2 * Math.PI);
    }
    function tube(pts, w, col, outline) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (outline) { polyline(pts); ctx.strokeStyle = outline; ctx.lineWidth = w * S + 2; ctx.stroke(); }
        polyline(pts); ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.stroke();
    }
    function heartPath(x, y, s, rot) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(0, 0.42);
        ctx.bezierCurveTo(-0.62, 0.02, -0.5, -0.62, 0, -0.3);
        ctx.bezierCurveTo(0.5, -0.62, 0.62, 0.02, 0, 0.42);
        ctx.closePath();
        ctx.restore();
    }

    // ── Animation : respiration, battements ──────────────────────────────
    const breathPhase = () => frac(simTime / 4.5);                       // 0 … 1
    const breathAmt = () => 0.5 - 0.5 * Math.cos(2 * Math.PI * breathPhase());  // 0 (vide) … 1 (plein)
    function beat() {
        const b = frac(simTime * 1.15);
        return b < 0.18 ? Math.sin(b / 0.18 * Math.PI) : 0;
    }

    // ── La silhouette ─────────────────────────────────────────────────────
    const TORSO = (() => {
        const R = [[0.03, 0.155], [0.10, 0.183], [0.125, 0.222], [0.1, 0.29], [0.078, 0.37], [0.095, 0.45], [0.09, 0.52], [0.02, 0.548]];
        return [...R, ...R.slice().reverse().map(p => [-p[0], p[1]])];
    })();
    function bodyShape(ex, col) {
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ell(0, 0.075, 0.052 + ex / S, 0.068 + ex / S); ctx.fill();
        ctx.fillRect(PX(-0.028) - ex, PY(0.12), 0.056 * S + 2 * ex, 0.07 * S);
        shape(TORSO); ctx.fill();
        if (ex) { ctx.lineWidth = 2 * ex; ctx.stroke(); }
        for (const s of [-1, 1]) {
            const limb = (pts, ws) => {
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineWidth = ws[i - 1] * S + 2 * ex;
                    ctx.beginPath(); ctx.moveTo(PX(pts[i - 1][0]), PY(pts[i - 1][1])); ctx.lineTo(PX(pts[i][0]), PY(pts[i][1])); ctx.stroke();
                }
            };
            limb([[s * 0.112, 0.215], [s * 0.14, 0.345], [s * 0.16, 0.47]], [0.048, 0.038]);
            limb([[s * 0.048, 0.49], [s * 0.052, 0.73], [s * 0.05, 0.94]], [0.085, 0.058]);
            ell(s * 0.167, 0.505, 0.02 + ex / S, 0.032 + ex / S, -s * 0.15); ctx.fill();
            ell(s * 0.064, 0.965, 0.036 + ex / S, 0.018 + ex / S); ctx.fill();
        }
    }
    function drawSkin() {
        const full = vis('peau');
        bodyShape(1.5, full ? '#b77b52' : 'rgba(120,130,145,0.45)');
        bodyShape(0, full ? '#f3cba6' : '#f4f1ee');
        if (full) {              // le visage (caché ensuite par le crâne ou le cerveau)
            ctx.fillStyle = '#5a3a28';
            for (const s of [-1, 1]) { ell(s * 0.018, 0.072, 0.0055, 0.0065); ctx.fill(); }
            ctx.strokeStyle = '#a05a46'; ctx.lineWidth = Math.max(1.2, S * 0.003); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(PX(0), PY(0.092), 0.018 * S, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
            ctx.strokeStyle = '#c58c6a';
            ctx.beginPath(); ctx.moveTo(PX(0), PY(0.075)); ctx.lineTo(PX(-0.004), PY(0.09)); ctx.lineTo(PX(0.003), PY(0.091)); ctx.stroke();
            ctx.fillStyle = '#6b4a35';      // cheveux
            ctx.beginPath(); ctx.ellipse(PX(0), PY(0.05), 0.054 * S, 0.046 * S, 0, Math.PI, 2 * Math.PI); ctx.fill();
        }
    }

    // ── Le squelette ──────────────────────────────────────────────────────
    const BONE = '#f4ecd8', BONE_D = '#9c8a66';
    function bone(a, b, w) {
        ctx.lineCap = 'round';
        for (const [col, extra] of [[BONE_D, 2], [BONE, 0]]) {
            ctx.strokeStyle = col; ctx.fillStyle = col;
            ctx.lineWidth = w * S + extra;
            ctx.beginPath(); ctx.moveTo(PX(a[0]), PY(a[1])); ctx.lineTo(PX(b[0]), PY(b[1])); ctx.stroke();
            for (const p of [a, b]) { ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), w * S * 0.8 + extra / 2, 0, 2 * Math.PI); ctx.fill(); }
        }
    }
    function drawRibs(alpha) {
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) {
            const y0 = 0.205 + i * 0.0125, w = 0.75 + 0.3 * Math.sin(Math.PI * (i + 1) / 11);
            for (const s of [-1, 1]) {
                for (const [col, extra] of [[BONE_D, 2], [BONE, 0]]) {
                    ctx.strokeStyle = col; ctx.lineWidth = 0.006 * S + extra;
                    ctx.beginPath();
                    ctx.moveTo(PX(s * 0.008), PY(y0));
                    ctx.bezierCurveTo(PX(s * 0.05 * w), PY(y0 - 0.008), PX(s * 0.088 * w), PY(y0 + 0.008), PX(s * 0.076 * w), PY(y0 + 0.042));
                    ctx.stroke();
                }
            }
        }
        roundRect(PX(-0.007), PY(0.2), 0.014 * S, 0.1 * S, 0.006 * S);       // sternum
        fillStroke(BONE, BONE_D);
        ctx.globalAlpha = 1;
    }
    function drawSkeleton() {
        // crâne
        ell(0, 0.072, 0.046, 0.06); fillStroke(BONE, BONE_D, 1.5);
        ctx.fillStyle = '#5b4a3a';
        for (const s of [-1, 1]) { ell(s * 0.018, 0.075, 0.0125, 0.012); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(PX(0), PY(0.085)); ctx.lineTo(PX(-0.006), PY(0.098)); ctx.lineTo(PX(0.006), PY(0.098)); ctx.closePath(); ctx.fill();
        ctx.beginPath();                   // mâchoire
        ctx.moveTo(PX(-0.036), PY(0.1)); ctx.quadraticCurveTo(PX(-0.032), PY(0.135), PX(0), PY(0.138));
        ctx.quadraticCurveTo(PX(0.032), PY(0.135), PX(0.036), PY(0.1)); ctx.closePath();
        fillStroke(BONE, BONE_D, 1.5);
        ctx.strokeStyle = BONE_D; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PX(-0.018), PY(0.112)); ctx.lineTo(PX(0.018), PY(0.112)); ctx.stroke();
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(PX(k * 0.005), PY(0.106)); ctx.lineTo(PX(k * 0.005), PY(0.118)); ctx.stroke(); }
        // colonne vertébrale
        for (let y = 0.14; y < 0.49; y += 0.0135) {
            roundRect(PX(-0.009), PY(y), 0.018 * S, 0.0105 * S, 0.003 * S);
            fillStroke(BONE, BONE_D, 1);
        }
        // bassin
        for (const s of [-1, 1]) {
            ell(s * 0.045, 0.473, 0.042, 0.03, s * 0.35); fillStroke(BONE, BONE_D, 1.5);
            ell(s * 0.032, 0.495, 0.011, 0.009); ctx.fillStyle = '#d8ccb0'; ctx.fill();
        }
        ctx.beginPath(); ctx.moveTo(PX(-0.017), PY(0.455)); ctx.lineTo(PX(0.017), PY(0.455)); ctx.lineTo(PX(0), PY(0.505)); ctx.closePath();
        fillStroke(BONE, BONE_D, 1.5);
        // côtes, clavicules
        drawRibs(1);
        for (const s of [-1, 1]) {
            bone([s * 0.012, 0.19], [s * 0.1, 0.197], 0.007);
            // bras
            bone([s * 0.115, 0.215], [s * 0.14, 0.338], 0.013);
            bone([s * 0.137, 0.352], [s * 0.153, 0.466], 0.008);
            bone([s * 0.148, 0.35], [s * 0.166, 0.464], 0.007);
            bone([s * 0.158, 0.478], [s * 0.166, 0.484], 0.009);
            for (let k = 0; k < 4; k++) bone([s * (0.153 + k * 0.006), 0.492], [s * (0.15 + k * 0.009), 0.528], 0.0035);
            bone([s * 0.152, 0.486], [s * 0.142, 0.507], 0.004);
            // jambes
            bone([s * 0.062, 0.5], [s * 0.052, 0.715], 0.017);
            bone([s * 0.048, 0.742], [s * 0.047, 0.93], 0.013);
            bone([s * 0.066, 0.75], [s * 0.062, 0.925], 0.006);
            ctx.beginPath(); ctx.arc(PX(s * 0.052), PY(0.728), 0.011 * S, 0, 2 * Math.PI); fillStroke(BONE, BONE_D, 1.5);
            bone([s * 0.05, 0.945], [s * 0.074, 0.972], 0.011);
            for (let k = 0; k < 3; k++) bone([s * (0.07 + k * 0.006), 0.97], [s * (0.074 + k * 0.007), 0.98], 0.003);
        }
    }

    // ── Les organes ───────────────────────────────────────────────────────
    function drawBrain() {
        ell(0, 0.037, 0.039, 0.023); fillStroke('#eaa3b8', '#b5687f', 1.5);
        ctx.strokeStyle = '#c87e94'; ctx.lineWidth = Math.max(1, S * 0.0022); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(PX(0), PY(0.016)); ctx.lineTo(PX(0), PY(0.058)); ctx.stroke();
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
            const y = 0.025 + k * 0.008;
            ctx.beginPath(); ctx.moveTo(PX(s * 0.008), PY(y));
            ctx.bezierCurveTo(PX(s * 0.018), PY(y - 0.008), PX(s * 0.026), PY(y + 0.008), PX(s * 0.034), PY(y - 0.002));
            ctx.stroke();
        }
    }
    function drawKidneys() {
        for (const s of [-1, 1]) {
            ctx.strokeStyle = '#d7b84a'; ctx.lineWidth = Math.max(1.2, S * 0.003);
            ctx.beginPath(); ctx.moveTo(PX(s * 0.04), PY(0.405)); ctx.quadraticCurveTo(PX(s * 0.035), PY(0.46), PX(s * 0.012), PY(0.495)); ctx.stroke();
            ell(s * 0.052, 0.392, 0.016, 0.026, -s * 0.2); fillStroke('#9c3b38', '#6b2421', 1.5);
        }
    }
    function drawBladder() { ell(0, 0.5, 0.021, 0.016); fillStroke('#ebc96b', '#b8962f', 1.5); }
    function lungPts(s) {
        return [[s * 0.03, 0.2], [s * 0.07, 0.212], [s * 0.088, 0.29], [s * 0.086, 0.338], [s * 0.05, 0.332], [s * 0.022, 0.342], [s * 0.017, 0.27], [s * 0.022, 0.214]];
    }
    function drawLungs(detail) {
        const k = 1 + 0.07 * (playing ? breathAmt() : 0.3);
        for (const s of [-1, 1]) {
            shape(lungPts(s), k, [s * 0.05, 0.28]);
            fillStroke('#f1979c', '#b65a61', 1.5);
            if (detail) {            // petites bronches
                ctx.strokeStyle = 'rgba(160,70,80,0.55)'; ctx.lineWidth = Math.max(1, S * 0.002);
                for (const [a, b] of [[[s * 0.045, 0.26], [s * 0.065, 0.24]], [[s * 0.045, 0.26], [s * 0.07, 0.29]], [[s * 0.05, 0.3], [s * 0.04, 0.325]], [[s * 0.05, 0.3], [s * 0.072, 0.322]], [[s * 0.04, 0.25], [s * 0.035, 0.22]]]) {
                    ctx.beginPath(); ctx.moveTo(PX(a[0]), PY(a[1])); ctx.lineTo(PX(b[0]), PY(b[1])); ctx.stroke();
                }
            }
        }
    }
    function drawAirways() {
        // le nez (narines en bas), bien séparé du cerveau
        ctx.beginPath();
        ctx.moveTo(PX(0), PY(0.081));
        ctx.quadraticCurveTo(PX(-0.004), PY(0.09), PX(-0.012), PY(0.098));
        ctx.quadraticCurveTo(PX(0), PY(0.103), PX(0.012), PY(0.098));
        ctx.quadraticCurveTo(PX(0.004), PY(0.09), PX(0), PY(0.081));
        ctx.closePath();
        fillStroke('#cfe6f6', '#5f8fb5', 1.5);
        ctx.fillStyle = '#5f8fb5';
        for (const s of [-1, 1]) { ell(s * 0.005, 0.098, 0.0028, 0.0018); ctx.fill(); }
        // de la base du nez à la gorge, puis la trachée
        tube([[0, 0.1], [0, 0.13]], 0.007, '#cfe6f6', '#7aa6c8');
        // la bouche : l'air peut aussi entrer par là et rejoindre la gorge
        for (const s of [-1, 1]) tube([[s * 0.008, 0.112], [0, 0.124]], 0.004, '#cfe6f6', '#7aa6c8');
        ell(0, 0.112, 0.013, 0.0055); fillStroke('#7a2a2a', '#5f8fb5', 1.2);
        tube([[0, 0.13], [0, 0.212]], 0.011, '#dbeaf4', '#7aa6c8');
        ctx.strokeStyle = '#8fb3cf'; ctx.lineWidth = 1;
        for (let y = 0.137; y < 0.21; y += 0.008) { ctx.beginPath(); ctx.moveTo(PX(-0.005), PY(y)); ctx.lineTo(PX(0.005), PY(y)); ctx.stroke(); }
        for (const s of [-1, 1]) tube([[0, 0.212], [s * 0.028, 0.235], [s * 0.045, 0.26], [s * 0.052, 0.3]], 0.007, '#dbeaf4', '#7aa6c8');
        const d = 0.012 * (playing ? breathAmt() : 0.3);       // le diaphragme descend quand on inspire
        ctx.strokeStyle = '#c0605a'; ctx.lineWidth = Math.max(2, S * 0.006); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(PX(-0.092), PY(0.352 + d * 0.4)); ctx.quadraticCurveTo(PX(0), PY(0.318 + d * 1.6), PX(0.092), PY(0.352 + d * 0.4)); ctx.stroke();
    }
    function drawOesophagus() {
        tube(CHU_OESO, 0.008, '#e3a094', '#a8665b');
        ell(0, 0.112, 0.012, 0.005); ctx.fillStyle = '#7a2a2a'; ctx.fill();       // la bouche
    }
    function drawDigestive() {
        // foie
        shape([[-0.09, 0.334], [0.022, 0.337], [0.012, 0.358], [-0.04, 0.396], [-0.082, 0.388]]);
        fillStroke('#8e3b2c', '#5d2117', 1.5);
        // gros intestin
        tube(CHU_LI, 0.019, '#d99a72', '#9b5f3e');
        ctx.setLineDash([2, Math.max(4, S * 0.012)]);
        tube(CHU_LI, 0.019, 'rgba(155,95,62,0.5)');
        ctx.setLineDash([]);
        // intestin grêle
        tube(CHU_SI, 0.011, '#f2b6a2', '#c27f6b');
        // estomac
        shape([[0.03, 0.344], [0.06, 0.343], [0.077, 0.37], [0.062, 0.401], [0.026, 0.407], [0.012, 0.397], [0.04, 0.386], [0.05, 0.366], [0.034, 0.36]]);
        fillStroke('#eb9a7f', '#a8604a', 1.5);
    }
    function drawHeart() {
        const k = 1 + 0.09 * (playing ? beat() : 0);
        heartPath(PX(0.014), PY(0.29), 0.032 * S * k, 0.4);
        fillStroke('#cf2f3a', '#7d141c', 1.5);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ell(0.004, 0.28, 0.005 * k, 0.003 * k, -0.6); ctx.fill();
    }
    function drawVessels(list, col, w) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, w * S);
        for (const p of list) { polyline(p.pts); ctx.stroke(); }
    }
    function drawParticles(list, col, r, speed) {
        ctx.fillStyle = col;
        for (const p of list) {
            const n = Math.max(2, Math.round(p.len / 0.055));
            for (let k = 0; k < n; k++) {
                const u = frac(simTime * speed / p.len + k / n);
                const a = Math.min(1, u / 0.06, (1 - u) / 0.06);
                if (a <= 0) continue;
                const q = _chuAt(p, u);
                ctx.globalAlpha = a;
                ctx.beginPath(); ctx.arc(PX(q[0]), PY(q[1]), Math.max(1.6, r * S), 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    function drawFood() {
        const n = 7;
        for (let k = 0; k < n; k++) {
            const u = frac(simTime / 16 + k / n);
            const q = _chuAt(CHU_DIG, u);
            ctx.fillStyle = u < 0.35 ? '#8a5a2b' : u < 0.7 ? '#9c7a2e' : '#6e5a2c';
            ctx.globalAlpha = Math.min(1, u / 0.03, (1 - u) / 0.04);
            ctx.beginPath(); ctx.arc(PX(q[0]), PY(q[1]), Math.max(2, 0.0085 * S), 0, 2 * Math.PI); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function drawAir() {
        const ph = breathPhase(), inhale = ph < 0.5;
        const a = Math.abs(Math.sin(2 * Math.PI * ph));
        ctx.fillStyle = inhale ? '#2f8fe0' : '#7d8794';
        for (const p of CHU_AIR) {
            for (let k = 0; k < 4; k++) {
                const v = frac((inhale ? ph : ph - 0.5) * 2 + k / 4);
                const u = inhale ? v : 1 - v;
                const q = _chuAt(p, u);
                ctx.globalAlpha = a * Math.min(1, u / 0.05 + 0.2);
                ctx.beginPath(); ctx.arc(PX(q[0]), PY(q[1]), Math.max(1.8, 0.0065 * S), 0, 2 * Math.PI); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    // ── Étiquettes ────────────────────────────────────────────────────────
    function labelFont() { return Math.max(10, Math.min(15, Math.min(cssW / 58, cssH / 40))); }
    function layoutLabels(list, fs) {
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        const h = fs * 1.75, gap = 4, items = [];
        for (const sideK of ['L', 'R']) {
            const col = list.filter(p => p.side === sideK).map(p => ({ p, ay: PY(p.y), ax: PX(p.x), w: ctx.measureText(p.name).width + 16 }))
                .sort((a, b) => a.ay - b.ay);
            let y = 4;
            col.forEach(it => { it.y = Math.max(y, it.ay - h / 2); y = it.y + h + gap; });
            let maxY = cssH - 26;          // laisse la place à l'indication du bas
            for (let i = col.length - 1; i >= 0; i--) {
                if (col[i].y + h > maxY) col[i].y = maxY - h;
                maxY = col[i].y - gap;
            }
            col.forEach(it => {
                it.y = Math.max(2, it.y);
                it.x = sideK === 'L' ? PX(-0.205) - it.w : PX(0.205);
                it.x = Math.max(4, Math.min(cssW - it.w - 4, it.x));
                it.h = h; it.side = sideK;
                items.push(it);
            });
        }
        return items;
    }
    function drawLabels(list) {
        labelHits = [];
        const fs = labelFont();
        const items = layoutLabels(list, fs);
        for (const it of items) {
            const p = it.p, col = CHU_SYS[p.sys].color, on = part === p.id;
            const ex = it.side === 'L' ? it.x + it.w : it.x, ey = it.y + it.h / 2;
            ctx.globalAlpha = part && !on ? 0.65 : 1;
            ctx.strokeStyle = col; ctx.lineWidth = on ? 2.5 : 1.5;
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(it.ax, it.ay); ctx.stroke();
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(it.ax, it.ay, on ? 4.5 : 3.2, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.fillStyle = on ? col : 'rgba(255,255,255,0.95)';
            roundRect(it.x, it.y, it.w, it.h, 8); ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
            ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = on ? '#fff' : '#1f2937';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(p.name, it.x + it.w / 2, ey + 1);
            ctx.globalAlpha = 1;
            labelHits.push({ id: p.id, x: it.x - 4, y: it.y - 4, w: it.w + 8, h: it.h + 8 });
        }
    }

    // ── Scène ─────────────────────────────────────────────────────────────
    function computeLayout(list) {
        const fs = labelFont();
        let maxW = 0;
        if (showLabels && list.length) {
            ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
            list.forEach(p => { maxW = Math.max(maxW, ctx.measureText(p.name).width + 16); });
        }
        const hMax = cssH * 0.94;
        if (showLabels && list.length) {
            S = Math.min(hMax, (cssW - 2 * (maxW + 12)) / 0.41);
            S = Math.max(S, Math.min(hMax, cssW / 0.4) * 0.55);
        } else {
            S = Math.min(hMax, cssW / 0.4);
        }
        cx = cssW / 2;
        top0 = (cssH - S * 0.985) / 2 - (showLabels ? 6 : 0);
        top0 = Math.max(4, top0);
    }
    function drawScene() {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f4f8fb'); bg.addColorStop(1, '#dde8f1');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);

        const list = visibleParts();
        computeLayout(list);

        const vSq = vis('squelette'), vOrg = vis('organes'), vDig = vis('digestion'),
              vResp = vis('respiration'), vCirc = vis('circulation');

        drawSkin();
        if (vSq) drawSkeleton();
        if (vCirc) {
            drawVessels(CHU_VEIN, '#3f6fd1', 0.0052);
            drawVessels(CHU_ART, '#d63a3a', 0.0052);
            if (playing) { drawParticles(CHU_VEIN, '#bcd0ff', 0.0034, 0.1); drawParticles(CHU_ART, '#ffd0d0', 0.0034, 0.1); }
        }
        if (vOrg) drawKidneys();
        if (vDig) drawOesophagus();
        if (vResp) drawAirways();
        if (vResp || vOrg) drawLungs(vResp);
        if (vResp && playing) drawAir();
        if (vCirc) {
            drawVessels(CHU_PULM_OUT, '#3f6fd1', 0.0045);
            drawVessels(CHU_PULM_IN, '#d63a3a', 0.0045);
            if (playing) { drawParticles(CHU_PULM_OUT, '#bcd0ff', 0.003, 0.05); drawParticles(CHU_PULM_IN, '#ffd0d0', 0.003, 0.05); }
        }
        if (vDig || vOrg) drawDigestive();
        if (vDig && playing) drawFood();
        if (vOrg) drawBladder();
        if (vCirc || vOrg) drawHeart();
        if (vOrg) drawBrain();
        if (vSq && (vOrg || vResp || vCirc)) drawRibs(0.35);     // la cage thoracique par-dessus, en transparence

        // Partie sélectionnée : halo
        if (part && CHU_PART_BY_ID[part] && partVisible(CHU_PART_BY_ID[part])) {
            const p = CHU_PART_BY_ID[part], col = CHU_SYS[p.sys].color;
            const r = Math.max(14, S * 0.035) * (1 + 0.12 * Math.sin(performance.now() / 260));
            ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
            ctx.beginPath(); ctx.arc(PX(p.x), PY(p.y), r, 0, 2 * Math.PI); ctx.stroke();
            ctx.setLineDash([]);
        }

        // Indications de l'animation (dans la ligne du bas, pour ne pas cacher les étiquettes)
        const st = [];
        if (playing) {
            if (vResp) st.push(breathPhase() < 0.5 ? '⬇ Inspiration : l\'air entre' : '⬆ Expiration : l\'air sort');
            if (vCirc) st.push('❤️ Le cœur bat, le sang circule');
            if (vDig) st.push('🍎 Les aliments avancent');
        }
        const ht = st.length ? st.join('  ·  ') : baseHint;
        if (hint.textContent !== ht) hint.textContent = ht;
        hint.style.fontWeight = st.length ? '800' : '';
        hint.style.color = st.length ? '#9b2c3c' : '';

        anchorHits = list.map(p => ({ id: p.id, x: PX(p.x), y: PY(p.y) }));
        if (showLabels) drawLabels(list); else labelHits = [];

        if (!list.length && !vis('peau')) {
            ctx.font = `700 ${labelFont() * 1.1}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#6b7280'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Coche un calque pour l\'afficher', cssW / 2, cssH / 2);
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        drawScene();
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function partsList(list) {
        return `<ul class="chu-list">${list.map(p =>
            `<li><button data-part="${p.id}" class="${part === p.id ? 'on' : ''}" style="--st-c:${CHU_SYS[p.sys].color}">${CHU_SYS[p.sys].ico} ${p.name}</button></li>`).join('')}</ul>`;
    }
    function updateInfo() {
        row2.querySelectorAll('.chu-layer-btn').forEach(b => b.classList.toggle('on', !!layers[b.dataset.layer]));
        row2.querySelectorAll('.chu-sys-btn').forEach(b => b.classList.toggle('on', b.dataset.sys === sys));

        const key = [mode, sys, part, CHU_LAYERS.map(k => layers[k] ? 1 : 0).join('')].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        const p = part && CHU_PART_BY_ID[part];
        if (p) {
            const S0 = CHU_SYS[p.sys];
            side.style.borderLeftColor = S0.color;
            const same = visibleParts().filter(q => q.sys === p.sys || (p.sys !== 'peau' && mode === 'systeme'));
            side.innerHTML = `<span class="chu-tag" style="background:${S0.color}">${S0.ico} ${S0.name}</span>
                <h4>${p.name}</h4>
                <p class="chu-text">${p.text}</p>
                <p class="chu-know">💡 <b>Le savais-tu ?</b> ${p.know || S0.know}</p>
                ${same.length > 1 ? `<div style="font-weight:800;margin:0 0 4px">Les autres parties :</div>${partsList(same)}` : ''}
                <ul class="chu-list" style="margin-top:6px"><li><button data-back="1" style="--st-c:#6b7280">↩ Retour</button></li></ul>`;
            return;
        }
        if (mode === 'systeme') {
            const S0 = CHU_SYS[sys];
            side.style.borderLeftColor = S0.color;
            side.innerHTML = `<h4>Un système à la fois</h4>
                <div class="chu-status">${S0.ico} <span style="color:${S0.color}">${S0.name}</span></div>
                <p class="chu-text">${S0.text}</p>
                <p class="chu-know">💡 <b>Le savais-tu ?</b> ${S0.know}</p>
                <div style="font-weight:800;margin:0 0 4px">Touche une partie pour en savoir plus :</div>
                ${partsList(visibleParts())}`;
            return;
        }
        side.style.borderLeftColor = '#c0485a';
        side.innerHTML = `<h4>Le corps humain</h4>
            <p class="chu-text">${CHU_OVERVIEW.text}</p>
            <p class="chu-know">💡 <b>Le savais-tu ?</b> ${CHU_OVERVIEW.know}</p>
            <div style="font-weight:800;margin:0 0 4px">Les calques :</div>
            <ul class="chu-list">${CHU_LAYERS.map(k => `<li class="chu-li ${layers[k] ? '' : 'off'}" style="--st-c:${CHU_SYS[k].color}">
                <button data-toggle="${k}" title="Afficher / masquer" style="--st-c:${CHU_SYS[k].color}">${layers[k] ? '☑' : '☐'}</button>
                <span>${CHU_SYS[k].ico} ${CHU_SYS[k].name}</span>
                ${k === 'peau' ? '' : `<button data-solo="${k}" title="Voir ce système seul">🔍 Seul</button>`}</li>`).join('')}</ul>
            <p class="chu-note" style="margin-top:8px">Touche une étiquette ou un organe sur le schéma pour l'expliquer.</p>`;
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
        if (playing) simTime += rdt * (fast ? 2.2 : 1);
        if (guided && playing) {
            guideT += rdt;
            if (guideT >= 7) { guideT = 0; stepPart(1); }
        }
        draw();
        if (playing || part) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (!playing && guided) setGuided(false);
        if (playing) startLoop(); else requestDraw();
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
            const list = visibleParts();
            if (!list.length) { setGuided(false); return; }
            guideT = 0;
            setPart(list[0].id);
            if (!playing) setPlaying(true);
        }
    }
    function setPart(id) {
        part = id && CHU_PART_BY_ID[id] ? id : null;
        lastInfoKey = '';
        if (part) startLoop();          // le halo de la partie choisie pulse
        requestDraw();
    }
    function stepPart(dir) {
        const list = visibleParts();
        if (!list.length) return;
        const i = list.findIndex(p => p.id === part);
        const n = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
        setPart(list[n].id);
    }
    function checkPart() {           // la partie choisie a peut-être été masquée
        if (part && !partVisible(CHU_PART_BY_ID[part])) part = null;
        lastInfoKey = '';
        requestDraw();
    }
    function setLayer(k, v) {
        layers[k] = !!v;
        checkPart();
    }
    function setSys(k) {
        if (!CHU_SYS[k] || k === 'peau') return;
        sys = k;
        checkPart();
    }
    function setMode(m) {
        mode = m === 'systeme' ? 'systeme' : 'calques';
        container.dataset.mode = mode;
        header.querySelectorAll('.chu-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (guided) setGuided(false);
        baseHint = mode === 'calques'
            ? 'Coche ou décoche les calques · Touche une étiquette ou un organe pour l\'expliquer'
            : 'Choisis un système · Touche une partie pour l\'expliquer · ▶ Lecture pour animer';
        hint.textContent = baseHint;
        checkPart();
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
    function onTap(x, y) {
        if (guided) setGuided(false);
        for (const h of labelHits) {
            if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                setPart(part === h.id ? null : h.id);
                if (typeof saveBoard === 'function') saveBoard();
                return;
            }
        }
        // Organe le plus proche du point touché
        let best = null, bd = Math.max(18, S * 0.04);
        for (const a of anchorHits) {
            const dd = Math.hypot(x - a.x, y - a.y);
            if (dd < bd) { bd = dd; best = a.id; }
        }
        setPart(best && best !== part ? best : null);
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
        if (guided) setGuided(false);
        if (b.dataset.part) setPart(b.dataset.part);
        else if (b.dataset.back) setPart(null);
        else if (b.dataset.toggle) setLayer(b.dataset.toggle, !layers[b.dataset.toggle]);
        else if (b.dataset.solo) { setSys(b.dataset.solo); setMode('systeme'); }
        if (typeof saveBoard === 'function') saveBoard();
    });

    header.querySelectorAll('.chu-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); saveBoard(); });
    guideBtn.addEventListener('click', () => setGuided(!guided));
    $('.chu-prev').addEventListener('click', () => { if (guided) setGuided(false); stepPart(-1); saveBoard(); });
    $('.chu-next').addEventListener('click', () => { if (guided) setGuided(false); stepPart(1); saveBoard(); });
    $('.chu-all').addEventListener('click', () => { if (guided) setGuided(false); setPart(null); saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); saveBoard(); });
    row2.querySelectorAll('.chu-layer-btn').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        setLayer(b.dataset.layer, !layers[b.dataset.layer]);
        saveBoard();
    }));
    $('.chu-layers-all').addEventListener('click', () => { CHU_LAYERS.forEach(k => { layers[k] = true; }); checkPart(); saveBoard(); });
    $('.chu-layers-none').addEventListener('click', () => { if (guided) setGuided(false); CHU_LAYERS.forEach(k => { layers[k] = false; }); checkPart(); saveBoard(); });
    row2.querySelectorAll('.chu-sys-btn').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        setSys(b.dataset.sys);
        saveBoard();
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
            window._wfMiniBarCollapse(widget, '🫀 Le corps humain', {
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
        animId = null; playing = false; guided = false; part = null;
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
    setMode('calques');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._chuGetData = () => ({
        containerW: contW, containerH: contH,
        mode, sys, layers: Object.assign({}, layers), part,
        showLabels, fast, fullboard: _isMax
    });
    widget._chuSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (d.layers && typeof d.layers === 'object') CHU_LAYERS.forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (typeof d.sys === 'string' && CHU_SYSTEMS.indexOf(d.sys) >= 0) sys = d.sys;
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        setFast(!!d.fast);
        setMode(d.mode || 'calques');
        if (typeof d.part === 'string' && CHU_PART_BY_ID[d.part] && partVisible(CHU_PART_BY_ID[d.part])) setPart(d.part);
        if (!!d.fullboard !== _isMax) wfMax.click();
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_chuSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
