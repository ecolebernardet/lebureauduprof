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
// WIDGET LES 5 SENS — Le Bureau du Prof
// Pour des élèves de fin de primaire (CM1 – CM2 – 6e). Deux onglets :
//  🧠 Les 5 sens : un enfant entouré de ce qu'il perçoit (une lampe, une
//     cloche, une fleur, une fraise, une plume). Chaque organe des sens
//     envoie un message par les nerfs jusqu'au cerveau.
//  🔍 Un sens à la fois : un schéma détaillé de l'organe, avec ses parties
//     et une petite expérience :
//       👁️ la vue      – la lumière fait grandir ou rétrécir la pupille,
//                        l'image se forme à l'envers sur la rétine ;
//       👂 l'ouïe      – le volume (en décibels) fait vibrer plus ou moins
//                        le tympan, avec une alerte au-delà de 85 dB ;
//       👃 l'odorat    – différentes odeurs, et le nez bouché du rhume ;
//       👅 le goût     – les 5 saveurs, perçues sur toute la langue ;
//       ✋ le toucher  – caresse, appui, chaud, froid ou piqûre, chacun
//                        capté par un récepteur différent de la peau.
// ▶ Lecture anime les messages nerveux. On touche une étiquette ou une
// partie du schéma pour l'expliquer ; « Visite guidée » les enchaîne.
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
    if (document.getElementById('c5s-style')) return;
    const s = document.createElement('style');
    s.id = 'c5s-style';
    s.textContent = `
        .widget[data-type="cinq-sens"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .c5s-container {
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
        .c5s-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .c5s-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .c5s-header .wf-btns { gap: 8px; }
        .c5s-header .wf-btn { width: 18px; height: 18px; }
        .c5s-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .c5s-container.wf-fullboard {
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
        .c5s-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .c5s-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .c5s-tab.on { background: #fff; color: #5b3fa8; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .c5s-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .c5s-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .c5s-btn:hover { background: #e0e0e0; }
        .c5s-btn:active { transform: scale(0.96); }
        .c5s-btn.on { background: #6b4fc4; color: #fff; border-color: #6b4fc4; }
        .c5s-btn-play { min-width: 112px; }
        .c5s-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .c5s-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .c5s-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .c5s-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .c5s-sense-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .c5s-sense-btn.on { background: var(--st-c, #6b4fc4); border-color: var(--st-c, #6b4fc4); color: #fff; }
        .c5s-opt.on { background: var(--st-c, #6b4fc4); border-color: var(--st-c, #6b4fc4); color: #fff; }
        .c5s-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 220px; min-width: 200px; }
        .c5s-slider { flex: 1; height: 30px; accent-color: var(--st-c, #6b4fc4); cursor: pointer; touch-action: none; }
        .c5s-val { font-size: 13px; font-weight: 800; color: #374151; min-width: 150px; }

        /* Expérience propre à chaque sens (visible seulement pour ce sens) */
        .c5s-ctl { display: none !important; }
        .c5s-container[data-mode="sens"][data-sense="vue"] .c5s-ctl[data-for="vue"],
        .c5s-container[data-mode="sens"][data-sense="ouie"] .c5s-ctl[data-for="ouie"],
        .c5s-container[data-mode="sens"][data-sense="odorat"] .c5s-ctl[data-for="odorat"],
        .c5s-container[data-mode="sens"][data-sense="gout"] .c5s-ctl[data-for="gout"],
        .c5s-container[data-mode="sens"][data-sense="toucher"] .c5s-ctl[data-for="toucher"] { display: inline-flex !important; }
        .c5s-container[data-mode="ensemble"] .c5s-row3 { display: none !important; }

        /* Corps */
        .c5s-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .c5s-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #eef3f8;
        }
        .c5s-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .c5s-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: #6b7280; pointer-events: none;
        }
        .c5s-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #6b4fc4;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .c5s-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #3f2a85; }
        .c5s-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .c5s-tag { display: inline-block; border-radius: 20px; padding: 1px 9px; color: #fff; font-size: .82em; font-weight: 800; margin-bottom: 4px; }
        .c5s-text { margin: 0 0 6px; }
        .c5s-chain { background: #f1edfb; border-radius: 8px; padding: 6px 9px; margin: 0 0 8px; color: #3f2a85; font-weight: 800; text-align: center; }
        .c5s-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .c5s-protect { background: #eaf7ef; border-radius: 8px; padding: 7px 9px; color: #1f5e3a; margin: 0 0 8px; }
        .c5s-steps { margin: 0 0 8px; padding-left: 20px; }
        .c5s-steps li { margin: 0 0 3px; }
        .c5s-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .c5s-list button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation; box-sizing: border-box;
        }
        .c5s-list button.on { background: var(--st-c, #6b4fc4); color: #fff; }
        .c5s-list button.c5s-study { background: var(--st-c, #6b4fc4); color: #fff; text-align: center; }

        /* Aide */
        .c5s-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .c5s-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 360px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .c5s-help-popup.show { display: block; }
        .c5s-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .c5s-help-popup p { margin: 0 0 6px; }

        .c5s-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .c5s-resize-handle:hover { opacity: 1; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .c5s-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .c5s-tab-short { display: none; }
        .c5s-header { min-width: 0; max-width: 100%; }
        .c5s-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .c5s-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .c5s-header .wf-btns { flex-shrink: 0; }
        .c5s-container.wf-fullboard .c5s-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .c5s-container { padding: 10px 10px 8px; gap: 6px; }
            .c5s-header { gap: 6px; }
            .c5s-title { font-size: 13px; }
            .c5s-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .c5s-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .c5s-row > * { flex-shrink: 0; }
            .c5s-row .c5s-lbl:first-child { display: none; }
            .c5s-slider-box { min-width: 230px; }
            .c5s-val { min-width: 0; }
            .c5s-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .c5s-btn-play { min-width: 0; }
            .c5s-sep { display: none; }
            .c5s-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .c5s-side { padding: 8px 10px; font-size: 13px; }
            .c5s-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .c5s-title { display: none; }
            .c5s-tab { padding: 3px 7px; font-size: 11.5px; }
            .c5s-tab-long { display: none; }
            .c5s-tab-short { display: inline; }
            .c5s-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .c5s-body { flex-direction: column; }
            .c5s-scene-wrap { flex: 1 1 0; min-height: 230px; }
            .c5s-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 38%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .c5s-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="cinq-sens"], .c5s-container, .c5s-container * { cursor: default !important; }
        .c5s-container .c5s-header, .c5s-container .c5s-header * { cursor: grab !important; }
        .c5s-container .c5s-header:active, .c5s-container .c5s-header:active * { cursor: grabbing !important; }
        .c5s-container button, .c5s-container button *, .c5s-container .c5s-header button,
        .c5s-container .c5s-header button *,
        .c5s-container input[type="range"] { cursor: pointer !important; }
        .c5s-container button:disabled, .c5s-container button:disabled *,
        .c5s-container .c5s-canvas { cursor: default !important; }
        .c5s-container input { cursor: text !important; }
        .c5s-container .c5s-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .c5s-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .c5s-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .c5s-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .c5s-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .c5s-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .c5s-help-popup { top: 56px; }
        .c5s-container.wf-fullboard .c5s-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .c5s-container.wf-fullboard .c5s-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .c5s-title { font-size: 17px; }
        }
        .c5s-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .c5s-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .c5s-tab:hover { background: rgba(255,255,255,.1); }
        .c5s-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .c5s-header { flex-wrap: nowrap; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .c5s-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .c5s-container.wf-fullboard .c5s-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .c5s-tab { padding: 3px 10px; font-size: 12px; }
            .c5s-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .c5s-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
const C5S_ORDER = ['vue', 'ouie', 'odorat', 'gout', 'toucher'];
const C5S_SENSES = {
    vue: {
        ico: '👁️', name: 'La vue', short: 'Vue', organ: 'les yeux', color: '#2f7fd8',
        detects: 'la lumière : les formes, les couleurs, les mouvements et les distances.',
        steps: [
            'La lumière entre dans l\'œil par un petit trou noir, la <b>pupille</b>.',
            'Le <b>cristallin</b>, une sorte de loupe, rassemble la lumière sur le fond de l\'œil, la <b>rétine</b>. L\'image s\'y forme <b>à l\'envers</b>.',
            'La rétine transforme l\'image en <b>message nerveux</b>.',
            'Le <b>nerf optique</b> transporte ce message jusqu\'au <b>cerveau</b>, qui remet l\'image à l\'endroit et comprend ce qu\'on voit.'
        ],
        protect: 'Ne regarde <b>jamais le Soleil</b> en face, même avec des lunettes de soleil. Lis avec assez de lumière et fais des pauses devant les écrans.',
        know: 'L\'œil peut distinguer des millions de couleurs. On cligne des yeux environ 15 fois par minute pour les nettoyer et les humidifier.'
    },
    ouie: {
        ico: '👂', name: 'L\'ouïe', short: 'Ouïe', organ: 'les oreilles', color: '#8e5bd6',
        detects: 'les sons : la parole, la musique, les bruits, leur force et leur direction.',
        steps: [
            'Un son est une <b>vibration de l\'air</b>. Le <b>pavillon</b> (la partie visible de l\'oreille) la capte.',
            'La vibration passe dans le <b>conduit auditif</b> et fait vibrer le <b>tympan</b>, une fine peau tendue.',
            'Trois tout petits os, les <b>osselets</b>, transmettent la vibration à la <b>cochlée</b>, en forme d\'escargot.',
            'La cochlée transforme la vibration en <b>message nerveux</b>, que le <b>nerf auditif</b> transporte au <b>cerveau</b>.'
        ],
        protect: 'Évite les <b>bruits trop forts</b> : baisse le volume du casque, protège tes oreilles en concert. Ne mets rien dans tes oreilles (pas de coton-tige).',
        know: 'Les osselets sont les plus petits os du corps : l\'étrier mesure environ 3 millimètres. Le fond de l\'oreille sert aussi à garder l\'<b>équilibre</b>.'
    },
    odorat: {
        ico: '👃', name: 'L\'odorat', short: 'Odorat', organ: 'le nez', color: '#2e9e6a',
        detects: 'les odeurs : les parfums, la nourriture, et les dangers (fumée, aliment pourri, gaz).',
        steps: [
            'Une fleur, du pain chaud… libèrent dans l\'air des <b>molécules odorantes</b>, minuscules et invisibles.',
            'En respirant, on les fait entrer par les <b>narines</b> dans les <b>fosses nasales</b>.',
            'Elles se posent tout en haut du nez, sur la <b>muqueuse olfactive</b>.',
            'Le <b>nerf olfactif</b> envoie le message au <b>cerveau</b>, qui reconnaît l\'odeur.'
        ],
        protect: 'Quand tu es enrhumé, mouche-toi bien. Ne respire jamais de près les produits ménagers (javel, ammoniaque…).',
        know: 'On peut reconnaître des milliers d\'odeurs différentes. Le chien a un odorat bien plus puissant que le nôtre : c\'est pour cela qu\'on l\'utilise pour retrouver des personnes.'
    },
    gout: {
        ico: '👅', name: 'Le goût', short: 'Goût', organ: 'la langue', color: '#e0567a',
        detects: 'les saveurs : le sucré, le salé, l\'acide, l\'amer et l\'umami.',
        steps: [
            'On mâche : la <b>salive</b> mouille les aliments et en libère les <b>molécules</b>.',
            'Ces molécules entrent dans les <b>bourgeons du goût</b>, cachés dans les <b>papilles</b> de la langue.',
            'Les <b>nerfs</b> envoient le message au <b>cerveau</b>.',
            'Le cerveau mélange ce message avec l\'<b>odeur</b> de l\'aliment pour reconnaître sa saveur. Avec le nez bouché, on sent beaucoup moins le goût !'
        ],
        protect: 'Brosse-toi les dents et la langue. Attention aux plats trop chauds, qui brûlent les papilles.',
        know: 'La langue a environ 10 000 bourgeons du goût, qui se renouvellent toutes les une à deux semaines. La « carte de la langue » (sucré au bout, amer au fond…) est fausse : toute la langue perçoit les 5 saveurs.'
    },
    toucher: {
        ico: '✋', name: 'Le toucher', short: 'Toucher', organ: 'la peau', color: '#e08a2e',
        detects: 'les contacts, la pression, le chaud, le froid et la douleur.',
        steps: [
            'La <b>peau</b> contient des millions de petits <b>récepteurs</b>.',
            'Chaque sorte de récepteur capte une chose : une <b>caresse</b>, un <b>appui</b>, le <b>chaud</b>, le <b>froid</b> ou la <b>douleur</b>.',
            'Ils envoient un message par les <b>nerfs</b>, jusqu\'à la moelle épinière et au <b>cerveau</b>.',
            'En cas de douleur, la moelle épinière déclenche un <b>réflexe</b> : on retire la main avant même d\'y penser.'
        ],
        protect: 'Protège ta peau du soleil (crème, chapeau), lave-toi les mains et désinfecte les petites blessures.',
        know: 'Le bout des doigts est l\'une des zones les plus sensibles du corps : c\'est avec lui que les personnes aveugles lisent le braille.'
    }
};
const C5S_OVERVIEW = {
    text: 'Nos <b>5 sens</b> nous informent sur ce qui nous entoure. Chaque sens a son <b>organe des sens</b> : les <b>yeux</b> pour la vue, les <b>oreilles</b> pour l\'ouïe, le <b>nez</b> pour l\'odorat, la <b>langue</b> pour le goût et la <b>peau</b> pour le toucher. L\'organe capte une information, les <b>nerfs</b> la transportent sous forme de <b>message nerveux</b>, et c\'est le <b>cerveau</b> qui comprend : « je vois une lampe », « j\'entends une cloche ».',
    know: 'Les sens travaillent souvent ensemble : pour reconnaître une fraise, on utilise la vue, l\'odorat, le goût et même le toucher.'
};

// Parties à découvrir. x, y : coordonnées dans la scène (x de 0 à A, y de 0 à 1).
// lx, ly : position de l'étiquette ; lbl : nom court affiché sur le schéma (facultatif).
const C5S_A = { ensemble: 1.2, vue: 1.6, ouie: 1.6, odorat: 1.6, gout: 1.6, toucher: 1.6 };
const C5S_PARTS = {
    ensemble: [
        { id: 'vue', lx: 0.2, ly: 0.4, lbl: '👁️ La vue', sense: 'vue', name: '👁️ La vue : les yeux', x: 0.415, y: 0.43 },
        { id: 'ouie', lx: 0.93, ly: 0.3, lbl: '👂 L\'ouïe', sense: 'ouie', name: '👂 L\'ouïe : les oreilles', x: 0.745, y: 0.45 },
        { id: 'odorat', lx: 0.24, ly: 0.58, lbl: '👃 L\'odorat', sense: 'odorat', name: '👃 L\'odorat : le nez', x: 0.5, y: 0.52 },
        { id: 'gout', lx: 0.3, ly: 0.76, lbl: '👅 Le goût', sense: 'gout', name: '👅 Le goût : la langue', x: 0.5, y: 0.645 },
        { id: 'toucher', lx: 1.1, ly: 0.74, lbl: '✋ Le toucher', sense: 'toucher', name: '✋ Le toucher : la peau', x: 0.99, y: 0.57 },
        { id: 'cerveau', lx: 0.5, ly: 0.035, name: '🧠 Le cerveau', color: '#c0587e', x: 0.5, y: 0.2,
          text: 'Le <b>cerveau</b> reçoit les messages de tous les sens. C\'est lui qui les <b>comprend</b> : les yeux captent la lumière, mais c\'est le cerveau qui « voit ». Il compare aussi avec ce qu\'il a en <b>mémoire</b> pour reconnaître une voix, une odeur, un goût.',
          know: 'Chaque sens a sa zone dans le cerveau. La vue, par exemple, est traitée à l\'arrière de la tête !' },
        { id: 'nerfs', lx: 0.92, ly: 0.2, name: '⚡ Les nerfs', color: '#c99a10', x: 0.68, y: 0.47,
          text: 'Les <b>nerfs</b> sont comme des câbles qui relient les organes des sens au cerveau. Ils transportent des <b>messages nerveux</b> très rapides, dans les deux sens : des organes vers le cerveau, et du cerveau vers les muscles.',
          know: 'Les messages nerveux peuvent voyager à plus de 400 km/h !' }
    ],
    vue: [
        { id: 'v-lumiere', lx: 0.3, ly: 0.25, name: 'Les rayons de lumière', x: 0.38, y: 0.43,
          text: 'Pour voir, il faut de la <b>lumière</b>. Elle vient d\'une source (le Soleil, une lampe), se reflète sur les objets et arrive jusqu\'à nos yeux. Dans le noir complet, on ne voit rien !' },
        { id: 'v-cornee', lx: 0.45, ly: 0.14, name: 'La cornée', x: 0.535, y: 0.44,
          text: 'La <b>cornée</b> est une fine couche <b>transparente</b> et bombée, à l\'avant de l\'œil. Elle protège l\'œil et commence à diriger la lumière vers l\'intérieur.',
          know: 'Les larmes nettoient la cornée à chaque clignement.' },
        { id: 'v-iris', lx: 0.7, ly: 0.1, name: 'L\'iris', x: 0.607, y: 0.385,
          text: 'L\'<b>iris</b> est la partie colorée de l\'œil (bleue, verte, marron…). C\'est un muscle qui règle la taille de la pupille selon la lumière.',
          know: 'Aucun iris n\'est identique à un autre : il peut servir, comme les empreintes digitales, à reconnaître une personne.' },
        { id: 'v-pupille', lx: 0.4, ly: 0.8, name: 'La pupille', x: 0.607, y: 0.5,
          text: 'La <b>pupille</b> est le trou noir au centre de l\'iris, par où la lumière entre. Quand il fait <b>sombre</b>, elle <b>s\'agrandit</b> pour laisser entrer plus de lumière ; quand il y a <b>beaucoup de lumière</b>, elle <b>rétrécit</b>. Essaie avec le curseur « Lumière » !',
          know: 'Regarde les yeux d\'un camarade quand il sort d\'un endroit sombre : ses pupilles se rétrécissent en une seconde.' },
        { id: 'v-cristallin', lx: 0.62, ly: 0.9, name: 'Le cristallin', x: 0.645, y: 0.565,
          text: 'Le <b>cristallin</b> est une lentille transparente, comme une <b>loupe</b>. Il change de forme pour que l\'image soit <b>nette</b> sur la rétine, que l\'objet soit proche ou loin.',
          know: 'Quand le cristallin ne fait pas bien la mise au point, on voit flou : des lunettes corrigent cela.' },
        { id: 'v-retine', lx: 1.3, ly: 0.8, name: 'La rétine', x: 1.11, y: 0.69,
          text: 'La <b>rétine</b> tapisse le fond de l\'œil. Elle contient des millions de cellules sensibles à la lumière et aux <b>couleurs</b>. L\'image s\'y forme <b>à l\'envers</b> ; elle est transformée en message nerveux.',
          know: 'C\'est le cerveau qui remet l\'image à l\'endroit : on ne s\'en rend jamais compte !' },
        { id: 'v-nerf', lx: 1.42, ly: 0.6, name: 'Le nerf optique', x: 1.3, y: 0.44,
          text: 'Le <b>nerf optique</b> part de l\'arrière de l\'œil. Il transporte le message de la rétine jusqu\'au <b>cerveau</b>.',
          know: 'À l\'endroit où le nerf optique quitte l\'œil, il n\'y a pas de cellules sensibles : c\'est la « tache aveugle ».' },
        { id: 'v-cerveau', lx: 1.15, ly: 0.1, name: 'Le cerveau', x: 1.45, y: 0.17,
          text: 'Le <b>cerveau</b> reçoit le message du nerf optique. Il remet l\'image à l\'endroit, assemble les images des deux yeux (ce qui permet de voir les distances) et <b>reconnaît</b> ce que l\'on voit.' }
    ],
    ouie: [
        { id: 'o-son', lx: 0.12, ly: 0.66, name: 'Le son', x: 0.22, y: 0.5,
          text: 'Un <b>son</b> est une <b>vibration</b> qui se propage dans l\'air, comme des vagues. Plus la vibration est forte, plus le son est fort : on mesure sa force en <b>décibels (dB)</b>. Essaie avec le curseur « Volume » !',
          know: 'Dans l\'espace, où il n\'y a pas d\'air, aucun son ne peut se propager : c\'est le silence total.' },
        { id: 'o-pavillon', lx: 0.25, ly: 0.05, name: 'Le pavillon', x: 0.31, y: 0.3,
          text: 'Le <b>pavillon</b> est la partie visible de l\'oreille. Sa forme en entonnoir <b>capte les sons</b> et les dirige vers le conduit auditif.',
          know: 'Certains animaux, comme le chat ou le cheval, peuvent tourner leurs pavillons vers le son.' },
        { id: 'o-conduit', lx: 0.62, ly: 0.7, name: 'Le conduit auditif', x: 0.6, y: 0.5,
          text: 'Le <b>conduit auditif</b> est un petit tunnel d\'environ 2,5 cm qui mène au tympan. Il fabrique le <b>cérumen</b> (la cire), qui retient les poussières.',
          know: 'Le cérumen sort tout seul : le coton-tige risque de le pousser au fond et d\'abîmer le tympan.' },
        { id: 'o-tympan', lx: 0.64, ly: 0.3, name: 'Le tympan', x: 0.8, y: 0.42,
          text: 'Le <b>tympan</b> est une fine peau tendue comme celle d\'un tambour. Le son le fait <b>vibrer</b>.',
          know: 'Un bruit très fort et soudain (pétard, explosion) peut déchirer le tympan.' },
        { id: 'o-osselets', lx: 0.85, ly: 0.14, name: 'Les osselets', x: 0.875, y: 0.4,
          text: 'Les <b>osselets</b> sont trois tout petits os (le marteau, l\'enclume et l\'étrier). Ils <b>transmettent</b> et renforcent la vibration du tympan jusqu\'à l\'oreille interne.',
          know: 'L\'étrier est le plus petit os du corps humain : il mesure environ 3 mm.' },
        { id: 'o-equilibre', lx: 1.07, ly: 0.05, name: 'Les canaux de l\'équilibre', x: 1.08, y: 0.25,
          text: 'Les <b>canaux semi-circulaires</b> ne servent pas à entendre mais à garder l\'<b>équilibre</b> : le liquide qu\'ils contiennent bouge quand la tête bouge.',
          know: 'Quand on tourne très vite sur soi-même, ce liquide continue de bouger un moment : c\'est pour cela qu\'on a la tête qui tourne.' },
        { id: 'o-cochlee', lx: 1.12, ly: 0.8, name: 'La cochlée', x: 1.13, y: 0.6,
          text: 'La <b>cochlée</b> a la forme d\'un escargot. Elle est remplie de liquide et de cellules ciliées qui transforment la vibration en <b>message nerveux</b>. Les sons trop forts abîment ces cellules, et elles ne repoussent pas.',
          know: 'Au-delà de 85 dB, écouter longtemps peut abîmer l\'audition pour toujours.' },
        { id: 'o-nerf', lx: 1.45, ly: 0.5, name: 'Le nerf auditif', x: 1.3, y: 0.43,
          text: 'Le <b>nerf auditif</b> transporte le message de la cochlée jusqu\'au <b>cerveau</b>, qui reconnaît le son : une voix, une musique, un klaxon…' }
    ],
    odorat: [
        { id: 'od-molecules', lx: 0.3, ly: 0.95, name: 'Les molécules odorantes', x: 0.24, y: 0.75,
          text: 'Ce qui sent libère dans l\'air des <b>molécules odorantes</b>, minuscules et invisibles. Plus il y en a, plus l\'odeur est forte. La chaleur en libère davantage : le pain chaud sent plus fort que le pain froid.' },
        { id: 'od-narines', lx: 0.17, ly: 0.5, name: 'Les narines', x: 0.41, y: 0.605,
          text: 'L\'air et les molécules odorantes entrent par les <b>narines</b>. Les poils du nez retiennent les poussières.',
          know: 'Pour bien sentir, on « renifle » : l\'air monte alors plus vite tout en haut du nez.' },
        { id: 'od-fosses', lx: 0.22, ly: 0.36, name: 'Les fosses nasales', x: 0.6, y: 0.47,
          text: 'Les <b>fosses nasales</b> sont les cavités à l\'intérieur du nez. Leurs replis, les <b>cornets</b>, réchauffent et humidifient l\'air.',
          know: 'Quand on est enrhumé, les fosses nasales se remplissent de mucus : les odeurs n\'arrivent plus jusqu\'en haut. Essaie le bouton « Nez bouché » !' },
        { id: 'od-muqueuse', lx: 0.5, ly: 0.13, name: 'La muqueuse olfactive', x: 0.76, y: 0.272,
          text: 'La <b>muqueuse olfactive</b> est une petite zone tout en haut du nez, de la taille d\'un timbre. Ses millions de cellules <b>reconnaissent les molécules odorantes</b>.',
          know: 'Ces cellules sont parmi les rares cellules nerveuses qui se renouvellent toute la vie.' },
        { id: 'od-bulbe', lx: 1.0, ly: 0.2, name: 'Le bulbe olfactif', x: 0.8, y: 0.195,
          text: 'Le <b>bulbe olfactif</b> rassemble les messages de la muqueuse et les envoie au cerveau par le <b>nerf olfactif</b>.' },
        { id: 'od-cerveau', lx: 1.38, ly: 0.08, name: 'Le cerveau', x: 1.15, y: 0.08,
          text: 'Le <b>cerveau</b> reconnaît l\'odeur et la relie souvent à des <b>souvenirs</b> et à des émotions : une odeur peut nous rappeler un lieu ou une personne.',
          know: 'L\'odorat est le sens le plus directement relié aux zones de la mémoire et des émotions.' },
        { id: 'od-gorge', lx: 1.3, ly: 0.55, name: 'Le nez et le goût', x: 1.06, y: 0.62,
          text: 'Le nez communique avec le fond de la bouche. Quand on mange, les odeurs des aliments <b>remontent par l\'arrière</b> jusqu\'à la muqueuse olfactive : c\'est pourquoi l\'odorat joue un grand rôle dans le <b>goût</b>.',
          know: 'Bouche-toi le nez et mange un bonbon : tu sens surtout le sucré, mais beaucoup moins son parfum !' }
    ],
    gout: [
        { id: 'g-saveurs', lx: 0.15, ly: 0.62, name: 'Les 5 saveurs', x: 0.4, y: 0.8,
          text: 'La langue perçoit <b>5 saveurs</b> : le <b>sucré</b> (bonbon, miel), le <b>salé</b> (chips), l\'<b>acide</b> (citron), l\'<b>amer</b> (chocolat noir, café, endive) et l\'<b>umami</b> (tomate, fromage, bouillon). <b>Toute la langue</b> perçoit les 5 saveurs. Choisis une saveur avec les boutons !',
          know: 'L\'amer nous met souvent en garde : beaucoup de plantes toxiques sont amères.' },
        { id: 'g-langue', lx: 0.12, ly: 0.4, name: 'La langue', x: 0.28, y: 0.55,
          text: 'La <b>langue</b> est un muscle très souple. Elle sert à goûter, mais aussi à mâcher (elle pousse les aliments sous les dents), à avaler et à parler.',
          know: 'La langue est faite de plusieurs muscles qui lui permettent de bouger dans tous les sens.' },
        { id: 'g-papilles', lx: 0.86, ly: 0.2, name: 'Les papilles', x: 0.61, y: 0.42,
          text: 'Les petites bosses qui couvrent la langue sont les <b>papilles</b>. Les plus grosses, au fond, forment un « V ». Elles abritent les bourgeons du goût.',
          know: 'Regarde ta langue dans un miroir : tu verras facilement les papilles.' },
        { id: 'g-salive', lx: 0.85, ly: 0.95, name: 'La salive', x: 0.5, y: 0.9,
          text: 'La <b>salive</b> mouille les aliments et dissout leurs molécules. Sans salive, on ne sentirait aucun goût !',
          know: 'Essuie le bout de ta langue avec un mouchoir propre et pose dessus un grain de sucre : tu ne sentiras presque rien avant qu\'il soit mouillé.' },
        { id: 'g-bourgeons', lx: 0.93, ly: 0.75, name: 'Les bourgeons du goût', x: 1.14, y: 0.42,
          text: 'Les <b>bourgeons du goût</b> sont cachés dans les papilles (ici vus au microscope). Les molécules dissoutes dans la salive y entrent par un petit pore, et des cellules réceptrices les reconnaissent.',
          know: 'On a environ 10 000 bourgeons du goût. Ils se renouvellent toutes les une à deux semaines.' },
        { id: 'g-nerfs', lx: 1.12, ly: 0.88, name: 'Les nerfs du goût', x: 1.22, y: 0.64,
          text: 'Des <b>nerfs</b> partent des bourgeons et transportent le message jusqu\'au <b>cerveau</b>.' },
        { id: 'g-cerveau', lx: 1.45, ly: 0.72, name: 'Le cerveau', x: 1.46, y: 0.86,
          text: 'Le <b>cerveau</b> rassemble le message du goût et celui de l\'<b>odorat</b> pour reconnaître la saveur de l\'aliment. C\'est pour cela qu\'avec le nez bouché, tout semble avoir moins de goût.' }
    ],
    toucher: [
        { id: 't-poil', lx: 0.2, ly: 0.12, name: 'Le poil', x: 0.475, y: 0.17,
          text: 'Les <b>poils</b> poussent dans la peau. Quand quelque chose les frôle, un petit nerf autour de leur racine le sent : c\'est pour cela qu\'on sent un insecte qui marche sur le bras.' },
        { id: 't-epiderme', lx: 0.16, ly: 0.3, name: 'L\'épiderme', x: 0.37, y: 0.32,
          text: 'L\'<b>épiderme</b> est la couche de dessus de la peau, celle qu\'on voit. Elle protège le corps des microbes, de l\'eau et du soleil. Ses cellules mortes tombent et sont remplacées sans arrêt.',
          know: 'L\'épiderme se renouvelle entièrement en un mois environ.' },
        { id: 't-derme', lx: 0.16, ly: 0.5, name: 'Le derme', x: 0.37, y: 0.5,
          text: 'Le <b>derme</b> est la couche du milieu. Il contient les <b>récepteurs</b> du toucher, les petits vaisseaux sanguins, les racines des poils et les glandes à sueur.' },
        { id: 't-sueur', lx: 0.9, ly: 0.86, name: 'La glande à sueur', x: 0.65, y: 0.57,
          text: 'Les <b>glandes à sueur</b> fabriquent la <b>transpiration</b>, qui sort par de petits trous de la peau (les pores). En séchant, la sueur <b>refroidit</b> le corps quand il a chaud.' },
        { id: 't-pression', lx: 0.45, ly: 0.88, lbl: 'Pression', name: 'Récepteur de pression', x: 0.55, y: 0.78,
          text: 'Les <b>récepteurs de pression</b>, plus profonds, sentent quand on <b>appuie</b> fort sur la peau ou quand quelque chose vibre. Essaie « Appui » !' },
        { id: 't-hypoderme', lx: 0.16, ly: 0.8, name: 'L\'hypoderme', x: 0.37, y: 0.8,
          text: 'L\'<b>hypoderme</b> est la couche la plus profonde. Il contient de la <b>graisse</b>, qui garde la chaleur du corps et amortit les chocs.' },
        { id: 't-caresse', lx: 0.75, ly: 0.04, lbl: 'Toucher léger', name: 'Récepteur du toucher léger', x: 0.82, y: 0.39,
          text: 'Juste sous l\'épiderme, des récepteurs sentent les <b>contacts légers</b> : une caresse, une plume, la texture d\'un tissu (doux, rugueux…). Ils sont très nombreux au bout des doigts et sur les lèvres. Essaie « Caresse » !' },
        { id: 't-temperature', lx: 1.05, ly: 0.04, lbl: 'Chaud / froid', name: 'Récepteur chaud / froid', x: 1.02, y: 0.38,
          text: 'Ces terminaisons nerveuses sentent la <b>température</b> : certaines réagissent au <b>chaud</b>, d\'autres au <b>froid</b>. Essaie « Chaud » et « Froid » !',
          know: 'Le piment donne une sensation de brûlure, et la menthe une sensation de fraîcheur, car ils « trompent » ces récepteurs.' },
        { id: 't-douleur', lx: 1.27, ly: 0.04, lbl: 'Douleur', name: 'Récepteur de la douleur', x: 1.17, y: 0.31,
          text: 'Ces terminaisons nerveuses, jusque dans l\'épiderme, sentent ce qui peut <b>blesser</b> : une piqûre, une brûlure, un coup. La <b>douleur</b> est une alarme qui protège le corps. Essaie « Piqûre » !',
          know: 'Devant une douleur forte, la moelle épinière déclenche un réflexe : on retire la main avant même que le cerveau ait compris.' },
        { id: 't-nerf', lx: 1.45, ly: 0.82, name: 'Le nerf', x: 1.38, y: 0.7,
          text: 'Les fibres de tous les récepteurs se rejoignent dans un <b>nerf</b>, qui transporte les messages jusqu\'à la <b>moelle épinière</b> puis au <b>cerveau</b>.' },
        { id: 't-cerveau', lx: 1.48, ly: 0.04, name: 'Le cerveau', x: 1.46, y: 0.17,
          text: 'Le <b>cerveau</b> sait exactement d\'où vient chaque message : il sait si c\'est la main, le pied ou le dos qui est touché, et si c\'est doux, chaud ou douloureux.' }
    ]
};
const C5S_PART_BY_ID = {};
Object.keys(C5S_PARTS).forEach(k => C5S_PARTS[k].forEach(p => { p.group = k; C5S_PART_BY_ID[p.id] = p; }));

// Expériences
const C5S_ODORS = {
    fleur:    { ico: '🌸', name: 'Fleur', col: '#e86aa6', txt: 'le parfum d\'une fleur' },
    pain:     { ico: '🍞', name: 'Pain chaud', col: '#c98a3c', txt: 'l\'odeur du pain chaud' },
    chocolat: { ico: '🍫', name: 'Chocolat', col: '#6b3e26', txt: 'l\'odeur du chocolat' },
    orange:   { ico: '🍊', name: 'Orange', col: '#f39c12', txt: 'l\'odeur de l\'orange' }
};
const C5S_FLAVOURS = {
    sucre:  { ico: '🍬', name: 'Sucré', col: '#e8559a', food: 'un bonbon, du miel, un fruit mûr' },
    sale:   { ico: '🥨', name: 'Salé', col: '#7a8aa0', food: 'des chips, un bretzel, du jambon' },
    acide:  { ico: '🍋', name: 'Acide', col: '#d8b800', food: 'un citron, du vinaigre, une pomme verte' },
    amer:   { ico: '☕', name: 'Amer', col: '#6b4a2b', food: 'le café, le chocolat noir, l\'endive' },
    umami:  { ico: '🍅', name: 'Umami', col: '#d1453b', food: 'la tomate, le parmesan, le bouillon' }
};
const C5S_STIMS = {
    caresse: { ico: '🪶', name: 'Caresse', rec: 't-caresse', col: '#e08a2e', txt: 'Contact léger : le récepteur du toucher léger réagit.' },
    appui:   { ico: '👆', name: 'Appui', rec: 't-pression', col: '#b5651d', txt: 'Appui fort : le récepteur de pression, en profondeur, réagit.' },
    chaud:   { ico: '🔥', name: 'Chaud', rec: 't-temperature', col: '#e0452e', txt: 'Chaleur : le récepteur du chaud réagit.' },
    froid:   { ico: '🧊', name: 'Froid', rec: 't-temperature', col: '#3a8fd6', txt: 'Froid : le récepteur du froid réagit.' },
    piqure:  { ico: '📌', name: 'Piqûre', rec: 't-douleur', col: '#c0392b', txt: 'Piqûre : le récepteur de la douleur réagit, la moelle épinière déclenche un réflexe.' }
};
function _c5sDb(v) {
    return v < 30 ? 'un chuchotement' : v < 50 ? 'une bibliothèque calme' : v < 70 ? 'une conversation'
         : v < 85 ? 'une rue animée' : v < 95 ? 'une tondeuse à gazon' : v < 105 ? 'un concert' : 'un marteau-piqueur';
}

// ── Géométrie ─────────────────────────────────────────────────────────────
function _c5sPath(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, L, len: L[L.length - 1] };
}
function _c5sAt(path, t) {
    const pts = path.pts, L = path.L;
    const d = Math.max(0, Math.min(1, t)) * path.len;
    let i = 0;
    while (i < L.length - 2 && L[i + 1] < d) i++;
    const u = (d - L[i]) / ((L[i + 1] - L[i]) || 1);
    const a = pts[i], b = pts[i + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}
function _c5sRand(seed) {
    let x = seed;
    return () => (x = (x * 16807) % 2147483647) / 2147483647;
}
// Vue d'ensemble : trajets des messages nerveux vers le cerveau
const C5S_NERVES = {
    vue: [-1, 1].map(s => _c5sPath([[0.5 + s * 0.085, 0.43], [0.5 + s * 0.06, 0.36], [0.5 + s * 0.02, 0.24], [0.5, 0.165]])),
    ouie: [-1, 1].map(s => _c5sPath([[0.5 + s * 0.24, 0.45], [0.5 + s * 0.2, 0.33], [0.5 + s * 0.125, 0.225]])),
    odorat: [_c5sPath([[0.5, 0.51], [0.5, 0.4], [0.5, 0.285]])],
    gout: [_c5sPath([[0.5, 0.63], [0.475, 0.56], [0.47, 0.45], [0.455, 0.33], [0.44, 0.265]])],
    toucher: [_c5sPath([[0.985, 0.5], [0.96, 0.66], [0.8, 0.93], [0.6, 0.86], [0.56, 0.74], [0.66, 0.6], [0.68, 0.45], [0.64, 0.3], [0.57, 0.16]])]
};
const C5S_CENTERS = { vue: [0.5, 0.165], ouie: [0.625, 0.225], odorat: [0.5, 0.285], gout: [0.44, 0.265], toucher: [0.57, 0.16] };
// Papilles de la langue (positions fixes)
const C5S_PAPILLAE = (() => {
    const r = _c5sRand(777), a = [];
    while (a.length < 150) {
        const x = 0.2 + r() * 0.56, y = 0.24 + r() * 0.66;
        if (((x - 0.48) / 0.27) ** 2 + ((y - 0.55) / 0.38) ** 2 < 0.92) a.push([x, y, 0.006 + r() * 0.004]);
    }
    return a;
})();

// ── Création du widget ────────────────────────────────────────────────────
function createCinqSensWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 640;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'cinq-sens';
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
    container.className = 'c5s-container';
    container.dataset.mode = 'ensemble';
    container.dataset.sense = 'vue';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(780, Math.min(1200, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.min(Math.round(window.innerHeight * 0.86), Math.round(contW * 0.72)));

    const header = document.createElement('div');
    header.className = 'c5s-header';
    header.innerHTML = `
        <span class="c5s-title">🖐️<span> Les 5 sens</span></span>
        <div class="c5s-tabs">
            <button class="c5s-tab on" data-mode="ensemble" title="Les 5 sens ensemble"><span class="c5s-tab-long">🧠 Les 5 sens</span><span class="c5s-tab-short">🧠 Les 5 sens</span></button>
            <button class="c5s-tab" data-mode="sens" title="Étudier un sens en détail"><span class="c5s-tab-long">🔍 Un sens à la fois</span><span class="c5s-tab-short">🔍 Un sens</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'c5s-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.c5s-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : lecture, visite, navigation, étiquettes
    const row1 = document.createElement('div');
    row1.className = 'c5s-row';
    row1.innerHTML = `
        <button class="c5s-btn c5s-btn-play" title="Lancer / arrêter l'animation">▶ Lecture</button>
        <button class="c5s-btn c5s-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="c5s-sep"></span>
        <button class="c5s-btn c5s-btn-guide" title="Présente les parties l'une après l'autre">🎓 Visite guidée</button>
        <button class="c5s-btn c5s-prev" title="Partie précédente">◀ Partie</button>
        <button class="c5s-btn c5s-next" title="Partie suivante">Partie ▶</button>
        <button class="c5s-btn c5s-all" title="Revenir à la présentation générale">🔄 Vue d'ensemble</button>
        <span class="c5s-sep"></span>
        <button class="c5s-btn c5s-labels on" title="Afficher les noms des parties">🏷️ Étiquettes</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : les 5 sens
    const row2 = document.createElement('div');
    row2.className = 'c5s-row';
    row2.innerHTML = `
        <span class="c5s-lbl">Sens :</span>
        ${C5S_ORDER.map(k => `<button class="c5s-btn c5s-sense-btn" data-sense="${k}" style="--st-c:${C5S_SENSES[k].color}" title="${C5S_SENSES[k].name}">${C5S_SENSES[k].ico} ${C5S_SENSES[k].short}</button>`).join('')}
    `;
    container.appendChild(row2);

    // Ligne 3 : l'expérience du sens étudié
    const row3 = document.createElement('div');
    row3.className = 'c5s-row c5s-row3';
    row3.innerHTML = `
        <span class="c5s-lbl">Expérience :</span>
        <div class="c5s-slider-box c5s-ctl" data-for="vue" style="--st-c:${C5S_SENSES.vue.color}">
            <span class="c5s-lbl">💡 Lumière</span>
            <input type="range" class="c5s-slider c5s-light" min="0" max="100" step="1" value="70" aria-label="Lumière">
            <span class="c5s-val c5s-light-val"></span>
        </div>
        <div class="c5s-slider-box c5s-ctl" data-for="ouie" style="--st-c:${C5S_SENSES.ouie.color}">
            <span class="c5s-lbl">🔊 Volume</span>
            <input type="range" class="c5s-slider c5s-vol" min="20" max="110" step="1" value="60" aria-label="Volume">
            <span class="c5s-val c5s-vol-val"></span>
        </div>
        ${Object.keys(C5S_ODORS).map(k => `<button class="c5s-btn c5s-opt c5s-ctl" data-for="odorat" data-odor="${k}" style="--st-c:${C5S_SENSES.odorat.color}">${C5S_ODORS[k].ico} ${C5S_ODORS[k].name}</button>`).join('')}
        <button class="c5s-btn c5s-opt c5s-ctl c5s-rhume" data-for="odorat" style="--st-c:#7f9f3a" title="Simuler un rhume">🤧 Nez bouché</button>
        ${Object.keys(C5S_FLAVOURS).map(k => `<button class="c5s-btn c5s-opt c5s-ctl" data-for="gout" data-flavour="${k}" style="--st-c:${C5S_FLAVOURS[k].col}">${C5S_FLAVOURS[k].ico} ${C5S_FLAVOURS[k].name}</button>`).join('')}
        ${Object.keys(C5S_STIMS).map(k => `<button class="c5s-btn c5s-opt c5s-ctl" data-for="toucher" data-stim="${k}" style="--st-c:${C5S_STIMS[k].col}">${C5S_STIMS[k].ico} ${C5S_STIMS[k].name}</button>`).join('')}
    `;
    container.appendChild(row3);

    // Corps
    const body = document.createElement('div');
    body.className = 'c5s-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'c5s-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'c5s-canvas';
    const hint = document.createElement('div');
    hint.className = 'c5s-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'c5s-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'c5s-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les 5 sens</h4>
        <p><b>🧠 Les 5 sens</b> : un enfant et ce qu'il perçoit. Chaque organe des sens envoie un message par les
        nerfs jusqu'au cerveau. Touche un organe (ou son étiquette) pour l'expliquer.</p>
        <p><b>🔍 Un sens à la fois</b> : choisis un sens pour voir son organe en détail. Chaque sens a sa petite
        <b>expérience</b> : la lumière et la pupille, le volume en décibels, les odeurs et le nez bouché,
        les 5 saveurs, ou ce que la peau ressent.</p>
        <p><b>▶ Lecture</b> anime la lumière, les sons, les odeurs et les messages nerveux (les petits points
        qui filent vers le cerveau). <b>◀ Partie ▶</b> passe d'une partie à l'autre, <b>🎓 Visite guidée</b>
        les enchaîne toute seule.</p>
        <p style="color:#888">Schémas simplifiés : les formes et les tailles ne sont pas à l'échelle.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'c5s-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const playBtn = $('.c5s-btn-play'), speedBtn = $('.c5s-btn-speed'), guideBtn = $('.c5s-btn-guide');
    const labelsBtn = $('.c5s-labels');
    const lightSl = $('.c5s-light'), lightVal = $('.c5s-light-val');
    const volSl = $('.c5s-vol'), volVal = $('.c5s-vol-val');
    const rhumeBtn = $('.c5s-rhume');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'ensemble';          // 'ensemble' | 'sens'
    let sense = 'vue';              // sens étudié
    let part = null;                // partie sélectionnée (id) ou null
    let showLabels = true;
    let light = 70, volume = 60, odor = 'fleur', rhume = false, flavour = 'sucre', stim = 'caresse';
    let playing = false, fast = false, guided = false, guideT = 0;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let m = 100, bx = 0, by = 0;    // échelle et origine de la scène
    let labelHits = [], anchorHits = [];
    let baseHint = '';

    const groupKey = () => mode === 'ensemble' ? 'ensemble' : sense;
    const curParts = () => C5S_PARTS[groupKey()];
    const partColor = p => p.color || C5S_SENSES[p.sense || p.group].color;

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }
    const X = x => bx + x * m, Y = y => by + y * m;
    const frac = v => v - Math.floor(v);
    const fnt = (px, w) => `${w || 800} ${Math.max(9, px)}px 'Segoe UI', system-ui, sans-serif`;

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    function smoothClosed(pts) {          // pts en coordonnées de la scène
        const n = pts.length, md = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        ctx.beginPath();
        const s0 = md(pts[n - 1], pts[0]);
        ctx.moveTo(X(s0[0]), Y(s0[1]));
        for (let i = 0; i < n; i++) {
            const p = pts[i], e = md(p, pts[(i + 1) % n]);
            ctx.quadraticCurveTo(X(p[0]), Y(p[1]), X(e[0]), Y(e[1]));
        }
        ctx.closePath();
    }
    function polyline(pts) {
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])));
    }
    function fillStroke(fill, stroke, lw) {
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || Math.max(1, m * 0.004); ctx.stroke(); }
    }
    function ell(x, y, rx, ry, rot) {
        ctx.beginPath(); ctx.ellipse(X(x), Y(y), Math.max(0.5, rx * m), Math.max(0.5, ry * m), rot || 0, 0, 2 * Math.PI);
    }
    function circ(x, y, r) { ctx.beginPath(); ctx.arc(X(x), Y(y), Math.max(0.5, r * m), 0, 2 * Math.PI); }
    function tube(pts, w, col, outline) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (outline) { polyline(pts); ctx.strokeStyle = outline; ctx.lineWidth = w * m + 2; ctx.stroke(); }
        polyline(pts); ctx.strokeStyle = col; ctx.lineWidth = w * m; ctx.stroke();
    }
    function emoji(txt, x, y, size, rot) {
        ctx.save();
        ctx.translate(X(x), Y(y));
        if (rot) ctx.rotate(rot);
        ctx.font = `${Math.max(12, size * m)}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, 0, 0);
        ctx.restore();
    }
    function text(txt, x, y, px, col, align, w) {
        ctx.font = fnt(px, w); ctx.fillStyle = col;
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, X(x), Y(y));
    }
    function pulses(path, col, n, speed, r, alpha) {
        ctx.fillStyle = col;
        for (let k = 0; k < n; k++) {
            const u = frac(simTime * speed / path.len + k / n);
            const q = _c5sAt(path, u);
            ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * Math.min(1, u / 0.08, (1 - u) / 0.08);
            circ(q[0], q[1], r); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    function brainMini(x, y, r, glowCol, glow) {
        if (glow > 0) {
            ctx.globalAlpha = 0.3 * glow; ctx.fillStyle = glowCol;
            ell(x, y, r * 1.4, r * 1.1); ctx.fill();
            ctx.globalAlpha = 1;
        }
        ell(x, y, r, r * 0.75); fillStroke('#eaa3b8', '#b5687f', 1.5);
        ctx.strokeStyle = '#c87e94'; ctx.lineWidth = Math.max(1, m * 0.003); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(x), Y(y - r * 0.72)); ctx.lineTo(X(x), Y(y + r * 0.72)); ctx.stroke();
        for (let k = 0; k < 3; k++) {
            const yy = y - r * 0.35 + k * r * 0.35;
            for (const s of [-1, 1]) {
                ctx.beginPath(); ctx.moveTo(X(x + s * r * 0.12), Y(yy));
                ctx.bezierCurveTo(X(x + s * r * 0.35), Y(yy - r * 0.18), X(x + s * r * 0.55), Y(yy + r * 0.18), X(x + s * r * 0.8), Y(yy));
                ctx.stroke();
            }
        }
    }
    const glowNow = () => playing ? 0.6 + 0.4 * Math.sin(simTime * 5) : 0;
    const SKIN = '#f3cba6', SKIN_D = '#b77b52';

    // ── Scène « Les 5 sens » ──────────────────────────────────────────────
    function drawEnsemble() {
        const selSense = part && C5S_PART_BY_ID[part] && C5S_PART_BY_ID[part].sense;
        const dim = k => selSense && selSense !== k ? 0.25 : 1;
        // épaules, cou, bras levé
        ctx.beginPath();
        ctx.moveTo(X(0.14), Y(1.0)); ctx.quadraticCurveTo(X(0.18), Y(0.83), X(0.44), Y(0.81));
        ctx.lineTo(X(0.56), Y(0.81)); ctx.quadraticCurveTo(X(0.82), Y(0.83), X(0.86), Y(1.0)); ctx.closePath();
        fillStroke('#7fb3d5', '#4a7fa3', 1.5);
        ctx.fillStyle = SKIN; ctx.fillRect(X(0.44), Y(0.66), 0.12 * m, 0.16 * m);
        tube([[0.8, 0.95], [0.96, 0.66]], 0.07, SKIN, SKIN_D);
        tube([[0.8, 0.96], [0.86, 0.85]], 0.08, '#7fb3d5', '#4a7fa3');       // manche
        for (let k = 0; k < 4; k++) tube([[0.968 + k * 0.016, 0.53], [0.957 + k * 0.022, 0.44 - (k === 1 || k === 2 ? 0.012 : 0)]], 0.019, SKIN, SKIN_D);
        tube([[0.955, 0.58], [0.915, 0.52]], 0.02, SKIN, SKIN_D);
        ell(0.99, 0.565, 0.047, 0.055); fillStroke(SKIN, SKIN_D, 1.5);
        // tête
        for (const s of [-1, 1]) { ell(0.5 + s * 0.24, 0.45, 0.042, 0.07); fillStroke(SKIN, SKIN_D, 1.5); ell(0.5 + s * 0.245, 0.45, 0.018, 0.04); ctx.fillStyle = '#d99a76'; ctx.fill(); }
        ell(0.5, 0.42, 0.24, 0.31); fillStroke(SKIN, SKIN_D, 1.5);
        ctx.fillStyle = '#6b4a35';
        ctx.beginPath(); ctx.ellipse(X(0.5), Y(0.33), 0.25 * m, 0.27 * m, 0, Math.PI, 2 * Math.PI); ctx.fill();
        // le cerveau vu « à travers » le crâne
        ell(0.5, 0.215, 0.185, 0.105); fillStroke('#f4ecd8', '#9c8a66', 2);
        ell(0.5, 0.215, 0.17, 0.092); fillStroke('#eaa3b8', '#b5687f', 1.5);
        ctx.strokeStyle = '#c87e94'; ctx.lineWidth = Math.max(1, m * 0.003); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(0.5), Y(0.13)); ctx.lineTo(X(0.5), Y(0.3)); ctx.stroke();
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
            const y = 0.16 + k * 0.035;
            ctx.beginPath(); ctx.moveTo(X(0.5 + s * 0.02), Y(y));
            ctx.bezierCurveTo(X(0.5 + s * 0.06), Y(y - 0.02), X(0.5 + s * 0.1), Y(y + 0.02), X(0.5 + s * 0.15), Y(y - 0.005));
            ctx.stroke();
        }
        // sourcils, yeux
        ctx.strokeStyle = '#6b4a35'; ctx.lineWidth = Math.max(2, m * 0.008);
        for (const s of [-1, 1]) {
            ctx.beginPath(); ctx.moveTo(X(0.5 + s * 0.04), Y(0.385)); ctx.quadraticCurveTo(X(0.5 + s * 0.085), Y(0.37), X(0.5 + s * 0.13), Y(0.39)); ctx.stroke();
            ell(0.5 + s * 0.085, 0.43, 0.05, 0.03); fillStroke('#ffffff', '#8a6a55', 1.5);
            circ(0.5 + s * 0.085, 0.43, 0.022); ctx.fillStyle = '#3a7bd5'; ctx.fill();
            circ(0.5 + s * 0.085, 0.43, 0.011); ctx.fillStyle = '#111'; ctx.fill();
            circ(0.5 + s * 0.085 - 0.007, 0.423, 0.004); ctx.fillStyle = '#fff'; ctx.fill();
        }
        // nez
        ctx.beginPath(); ctx.moveTo(X(0.5), Y(0.45)); ctx.quadraticCurveTo(X(0.47), Y(0.52), X(0.47), Y(0.535));
        ctx.quadraticCurveTo(X(0.5), Y(0.55), X(0.53), Y(0.535)); ctx.strokeStyle = SKIN_D; ctx.lineWidth = Math.max(1.5, m * 0.005); ctx.stroke();
        ctx.fillStyle = '#a0603a';
        for (const s of [-1, 1]) { ell(0.5 + s * 0.013, 0.535, 0.007, 0.004); ctx.fill(); }
        // bouche ouverte et langue
        ell(0.5, 0.625, 0.075, 0.035); fillStroke('#7a2a2a', '#5a1a1a', 1.5);
        ctx.save(); ell(0.5, 0.625, 0.075, 0.035); ctx.clip();
        ell(0.5, 0.655, 0.055, 0.035); ctx.fillStyle = '#ea8c98'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(X(0.45), Y(0.59), 0.1 * m, 0.012 * m);
        ctx.restore();

        // ce que l'enfant perçoit
        const t = simTime;
        ctx.globalAlpha = dim('vue');
        emoji('💡', 0.07, 0.23, 0.09);
        ctx.strokeStyle = '#f2c230'; ctx.lineWidth = Math.max(2, m * 0.006); ctx.setLineDash([8, 7]); ctx.lineDashOffset = -t * 40;
        for (const d of [-0.012, 0, 0.012]) { ctx.beginPath(); ctx.moveTo(X(0.12), Y(0.27 + d)); ctx.lineTo(X(0.405), Y(0.428 + d * 0.3)); ctx.stroke(); }
        ctx.setLineDash([]);
        ctx.globalAlpha = dim('ouie');
        emoji('🔔', 0.07, 0.5, 0.08, 0.25 * Math.sin(t * 8));
        ctx.strokeStyle = C5S_SENSES.ouie.color; ctx.lineWidth = Math.max(1.5, m * 0.005);
        for (let k = 0; k < 3; k++) {
            const r = 0.03 + frac(t * 0.8 + k / 3) * 0.11;
            ctx.globalAlpha = dim('ouie') * (1 - r / 0.15);
            ctx.beginPath(); ctx.arc(X(0.11), Y(0.48), r * m, -0.6, 0.6); ctx.stroke();
        }
        ctx.globalAlpha = dim('odorat');
        emoji('🌸', 0.1, 0.8, 0.08);
        ctx.fillStyle = C5S_SENSES.odorat.color;
        const odP = _c5sPath([[0.14, 0.77], [0.3, 0.67], [0.48, 0.55]]);
        for (let k = 0; k < 6; k++) {
            const u = frac(t * 0.25 + k / 6), q = _c5sAt(odP, u);
            ctx.globalAlpha = dim('odorat') * Math.min(1, u / 0.1, (1 - u) / 0.1);
            circ(q[0] + 0.012 * Math.sin(u * 14 + k), q[1], 0.007); ctx.fill();
        }
        ctx.globalAlpha = dim('gout');
        emoji('🍓', 0.22, 0.66, 0.07);
        ctx.strokeStyle = C5S_SENSES.gout.color; ctx.lineWidth = Math.max(1.5, m * 0.005); ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 30;
        ctx.beginPath(); ctx.moveTo(X(0.27), Y(0.645)); ctx.lineTo(X(0.42), Y(0.63)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = dim('toucher');
        emoji('🪶', 1.1, 0.38 + 0.01 * Math.sin(t * 3), 0.08, -0.6 + 0.15 * Math.sin(t * 3));
        ctx.globalAlpha = 1;

        // messages nerveux vers le cerveau
        for (const k of C5S_ORDER) {
            const col = C5S_SENSES[k].color;
            ctx.globalAlpha = 0.55 * dim(k);
            ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, m * 0.005); ctx.lineCap = 'round';
            for (const p of C5S_NERVES[k]) { polyline(p.pts); ctx.stroke(); }
            ctx.globalAlpha = 1;
            if (playing) for (const p of C5S_NERVES[k]) pulses(p, col, Math.max(2, Math.round(p.len / 0.1)), 0.18, 0.008, dim(k));
        }
        // les zones du cerveau s'allument
        for (const k of C5S_ORDER) {
            const c = C5S_CENTERS[k], g = playing ? (0.6 + 0.4 * Math.sin(simTime * 5 + C5S_ORDER.indexOf(k))) * dim(k) : 0.35 * dim(k);
            ctx.globalAlpha = g; ctx.fillStyle = C5S_SENSES[k].color;
            circ(c[0], c[1], 0.022); ctx.fill();
            if (k === 'ouie') { circ(1 - c[0], c[1], 0.022); ctx.fill(); }
            ctx.globalAlpha = 1;
        }
    }

    // ── Scène « La vue » ──────────────────────────────────────────────────
    function rayHit(P, Lc, C, R) {       // prolonge P → Lc jusqu'au cercle (C, R)
        const dx = Lc[0] - P[0], dy = Lc[1] - P[1];
        const fx = Lc[0] - C[0], fy = Lc[1] - C[1];
        const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - R * R;
        const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
        return [Lc[0] + dx * t, Lc[1] + dy * t];
    }
    function tree(x, base, s, up) {      // petit arbre : pied du tronc en « base », haut à base − 0,27 (up = 1 à l'endroit, −1 à l'envers)
        ctx.fillStyle = '#7a5230';
        const t0 = base, t1 = base - up * 0.13 * s;
        ctx.fillRect(X(x - 0.013 * s), Y(Math.min(t0, t1)), 0.026 * s * m, Math.abs(t1 - t0) * m);
        circ(x, base - up * 0.19 * s, 0.08 * s); ctx.fillStyle = '#3f9e4d'; ctx.fill();
        circ(x - 0.025 * s, base - up * 0.21 * s, 0.03 * s); ctx.fillStyle = '#6cc070'; ctx.fill();
    }
    function drawVue() {
        const k = light / 100;
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        const lerpC = (a, b) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
        bg.addColorStop(0, lerpC([22, 28, 40], [238, 245, 251])); bg.addColorStop(1, lerpC([14, 18, 28], [214, 228, 240]));
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        if (light < 25) text('🌙 Il fait sombre', 0.18, 0.08, m * 0.04, '#cdd7e5');
        else if (light > 80) text('☀️ Grand soleil', 0.18, 0.08, m * 0.04, '#b07a00');

        const C = [0.88, 0.5], R = 0.3, Lc = [0.645, 0.5];
        const pup = 0.072 - 0.052 * k;
        // l'objet regardé
        ctx.globalAlpha = 0.35 + 0.65 * k;
        tree(0.14, 0.68, 1, 1);
        ctx.globalAlpha = 1;
        // le nerf optique et le cerveau
        tube([[1.17, 0.52], [1.3, 0.47], [1.4, 0.36], [1.43, 0.26]], 0.05, '#f0c75a', '#b8902a');
        brainMini(1.45, 0.17, 0.11, C5S_SENSES.vue.color, glowNow() * (0.3 + 0.7 * k));
        // le globe de l'œil
        circ(C[0], C[1], R); fillStroke('#fbfbfb', '#8a96a6', 2.5);
        circ(C[0], C[1], R * 0.93); ctx.fillStyle = 'rgba(205,228,245,0.55)'; ctx.fill();
        ctx.strokeStyle = '#e0603a'; ctx.lineWidth = Math.max(3, m * 0.016);
        ctx.beginPath(); ctx.arc(X(C[0]), Y(C[1]), R * 0.95 * m, -1.15, 1.15); ctx.stroke();
        // la cornée
        ctx.beginPath(); ctx.arc(X(0.66), Y(0.5), 0.13 * m, 2.35, 3.93);
        ctx.strokeStyle = '#6aa6d8'; ctx.lineWidth = Math.max(2, m * 0.008); ctx.stroke();
        ctx.fillStyle = 'rgba(170,215,245,0.35)'; ctx.fill();
        // les rayons de lumière
        const T = [0.14, 0.41], B = [0.14, 0.68];
        const hT = rayHit(T, Lc, C, R * 0.95), hB = rayHit(B, Lc, C, R * 0.95);
        ctx.strokeStyle = `rgba(242,194,48,${0.25 + 0.7 * k})`; ctx.lineWidth = Math.max(2, m * 0.007);
        ctx.setLineDash([10, 8]); ctx.lineDashOffset = -simTime * 50;
        for (const [P, H] of [[T, hT], [B, hB]]) { polyline([P, Lc, H]); ctx.stroke(); }
        ctx.setLineDash([]);
        // l'iris et la pupille
        ctx.fillStyle = '#3a7bd5';
        ctx.fillRect(X(0.6), Y(0.5 - 0.115), 0.016 * m, (0.115 - pup) * m);
        ctx.fillRect(X(0.6), Y(0.5 + pup), 0.016 * m, (0.115 - pup) * m);
        // le cristallin
        ell(Lc[0], Lc[1], 0.028, 0.075); fillStroke('rgba(215,238,255,0.85)', '#7aa6c8', 1.5);
        // l'image à l'envers sur la rétine
        ctx.globalAlpha = 0.3 + 0.7 * k;
        const ix = (hT[0] + hB[0]) / 2 - 0.012, s = Math.abs(hT[1] - hB[1]) / 0.27;
        tree(ix, hB[1], s, -1);          // le pied de l'arbre en haut, le feuillage en bas
        ctx.globalAlpha = 1;
        text('image à l\'envers', 1.06, 0.88, m * 0.032, '#b0472a', 'center', 700);
        // messages nerveux
        if (playing && light > 5) pulses(_c5sPath([[1.17, 0.52], [1.3, 0.47], [1.4, 0.36], [1.43, 0.26]]), '#fff8d0', 4, 0.15, 0.01);
    }

    // ── Scène « L'ouïe » ──────────────────────────────────────────────────
    function spiral(cx, cy, r0, r1, turns) {
        const pts = [];
        for (let i = 0; i <= 80; i++) {
            const t = i / 80, a = Math.PI + t * turns * 2 * Math.PI, r = r0 + (r1 - r0) * t;
            pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]);
        }
        return pts;
    }
    function drawOuie() {
        ctx.fillStyle = '#eef3f8'; ctx.fillRect(0, 0, cssW, cssH);
        const amp = (volume - 20) / 90, loud = volume > 85;
        const vib = playing ? Math.sin(simTime * 45) * (0.003 + 0.01 * amp) : 0;
        // la tête (peau puis os)
        ctx.fillStyle = SKIN; ctx.fillRect(X(0.46), Y(0), (1.6 - 0.46) * m, m);
        ctx.fillStyle = '#eadfc6'; ctx.fillRect(X(0.72), Y(0.08), (1.6 - 0.72) * m, 0.84 * m);
        // le pavillon
        ctx.beginPath(); ctx.moveTo(X(0.47), Y(0.18));
        ctx.bezierCurveTo(X(0.22), Y(0.08), X(0.2), Y(0.58), X(0.36), Y(0.74));
        ctx.quadraticCurveTo(X(0.42), Y(0.84), X(0.47), Y(0.8)); ctx.closePath();
        fillStroke(SKIN, SKIN_D, 2);
        ctx.strokeStyle = '#d29a74'; ctx.lineWidth = Math.max(2, m * 0.008);
        ctx.beginPath(); ctx.moveTo(X(0.44), Y(0.24)); ctx.bezierCurveTo(X(0.3), Y(0.2), X(0.29), Y(0.5), X(0.38), Y(0.62)); ctx.stroke();
        // le conduit auditif
        ctx.beginPath(); ctx.moveTo(X(0.37), Y(0.45)); ctx.lineTo(X(0.8), Y(0.465)); ctx.lineTo(X(0.8), Y(0.555)); ctx.lineTo(X(0.37), Y(0.56)); ctx.closePath();
        fillStroke('#e8b495', '#b77b52', 1.5);
        // l'oreille moyenne, les osselets
        ell(0.9, 0.47, 0.085, 0.12); fillStroke('#fdecdc', '#c9a27a', 1.5);
        const bone = (a, b, w) => tube([[a[0] + vib, a[1]], [b[0] + vib, b[1]]], w, '#f7f0de', '#9c8a66');
        bone([0.812, 0.48], [0.855, 0.4], 0.013); circ(0.858 + vib, 0.395, 0.016); fillStroke('#f7f0de', '#9c8a66', 1.5);
        bone([0.87, 0.39], [0.905, 0.44], 0.012);
        bone([0.905, 0.44], [0.975, 0.47], 0.008);
        // la trompe d'Eustache
        tube([[0.93, 0.58], [0.98, 0.75], [1.02, 0.92]], 0.022, '#f3c3c8', '#c08890');
        // le tympan
        ell(0.805 + vib, 0.51, 0.009, 0.075); fillStroke('#f2c7a5', '#a0603a', 1.5);
        // l'oreille interne : canaux de l'équilibre et cochlée
        ctx.lineCap = 'round';
        for (const [rx, ry, rot, dx] of [[0.05, 0.075, 0, -0.03], [0.06, 0.05, 0.3, 0.02], [0.045, 0.07, -0.6, 0.05]]) {
            ctx.strokeStyle = '#c08890'; ctx.lineWidth = 0.02 * m + 2;
            ell(1.07 + dx, 0.29, rx, ry, rot); ctx.stroke();
            ctx.strokeStyle = '#f3c3c8'; ctx.lineWidth = 0.02 * m;
            ell(1.07 + dx, 0.29, rx, ry, rot); ctx.stroke();
        }
        circ(1.01, 0.44, 0.04); fillStroke('#f3c3c8', '#c08890', 1.5);
        const sp = spiral(1.12, 0.6, 0.11, 0.015, 2.4);
        tube(sp, 0.036, loud && playing ? '#f59a9a' : '#f3c3c8', '#c08890');
        // le nerf auditif et le cerveau
        const nerf = [[1.18, 0.52], [1.3, 0.45], [1.4, 0.33], [1.43, 0.26]];
        tube(nerf, 0.045, '#f0c75a', '#b8902a');
        brainMini(1.45, 0.17, 0.11, C5S_SENSES.ouie.color, glowNow() * (0.3 + 0.7 * amp));
        // la source du son
        emoji('🔊', 0.08, 0.5, 0.12);
        {
            ctx.strokeStyle = C5S_SENSES.ouie.color;
            for (let k = 0; k < 4; k++) {
                const r = 0.03 + frac(simTime * 0.7 + k / 4) * 0.22;
                ctx.globalAlpha = Math.min(1, (0.26 - r) / 0.06) * (0.4 + 0.6 * amp);
                ctx.lineWidth = Math.max(1.5, m * (0.003 + 0.012 * amp));
                ctx.beginPath(); ctx.arc(X(0.13), Y(0.5), r * m, -0.55, 0.55); ctx.stroke();
            }
            for (let k = 0; k < 3; k++) {             // la vibration dans le conduit
                const x = 0.4 + frac(simTime * 0.7 + k / 3) * 0.38;
                ctx.globalAlpha = 0.4 + 0.6 * amp; ctx.lineWidth = Math.max(1.5, m * (0.003 + 0.008 * amp));
                ctx.beginPath(); ctx.moveTo(X(x), Y(0.475)); ctx.lineTo(X(x), Y(0.545)); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        if (playing) {
            pulses(_c5sPath(sp.slice().reverse()), '#fff8d0', 3, 0.15, 0.007);
            pulses(_c5sPath(nerf), '#fff8d0', 4, 0.15, 0.01);
        }
        text(`${volume} dB`, 0.08, 0.37, m * 0.045, loud ? '#c0392b' : '#5b3fa8');
        if (loud) {
            roundRect(X(0.3), Y(0.875), 1.0 * m, 0.085 * m, 10); fillStroke('rgba(255,235,235,0.95)', '#c0392b', 2);
            text('⚠ Trop fort ! Au-delà de 85 dB, le bruit peut abîmer l\'oreille.', 0.8, 0.918, m * 0.034, '#c0392b');
        }
    }

    // ── Scène « L'odorat » ────────────────────────────────────────────────
    const OD_PATH = _c5sPath([[0.18, 0.79], [0.33, 0.69], [0.41, 0.61], [0.47, 0.48], [0.58, 0.36], [0.68, 0.3], [0.76, 0.285]]);
    const OD_NERF = [[0.76, 0.27], [0.79, 0.2], [0.92, 0.16], [1.08, 0.12]];
    function drawOdorat() {
        ctx.fillStyle = '#eef3f8'; ctx.fillRect(0, 0, cssW, cssH);
        const O = C5S_ODORS[odor];
        // le visage de profil et la tête en coupe
        ctx.beginPath();
        const face = [[0.56, 0], [0.53, 0.18], [0.49, 0.26], [0.32, 0.54], [0.33, 0.6], [0.42, 0.615], [0.44, 0.68], [0.42, 0.73],
                      [0.45, 0.77], [0.43, 0.82], [0.47, 0.95], [0.52, 1.0], [1.6, 1.0], [1.6, 0]];
        polyline(face); ctx.closePath(); fillStroke(SKIN, SKIN_D, 2);
        // le cerveau et l'os du crâne
        ctx.save(); ctx.beginPath(); ctx.rect(X(0), Y(0), 1.6 * m, 0.24 * m); ctx.clip();
        ell(1.15, 0.02, 0.55, 0.2); fillStroke('#eaa3b8', '#b5687f', 1.5);
        ctx.restore();
        tube([[0.6, 0.245], [1.5, 0.245]], 0.018, '#eadfc6', '#9c8a66');
        // les fosses nasales
        const cav = [[0.42, 0.6], [0.39, 0.53], [0.5, 0.33], [0.62, 0.265], [0.86, 0.27], [1.0, 0.33], [1.05, 0.55], [0.95, 0.62], [0.6, 0.62]];
        smoothClosed(cav); fillStroke('#f8d3cf', '#c27f78', 1.5);
        // la gorge (vers le goût) et la langue
        tube([[1.0, 0.58], [1.08, 0.75], [1.1, 1.0]], 0.07, '#f8d3cf', '#c27f78');
        ell(0.74, 0.73, 0.27, 0.055); fillStroke('#ea8c98', '#b45563', 1.5);
        tube([[0.48, 0.665], [1.0, 0.665]], 0.02, '#f3e4c8', '#b9a07a');      // le palais
        // les cornets
        for (const y of [0.35, 0.43, 0.52]) {
            ctx.beginPath(); ctx.moveTo(X(1.02), Y(y - 0.02));
            ctx.bezierCurveTo(X(0.9), Y(y - 0.03), X(0.72), Y(y), X(0.74), Y(y + 0.03));
            ctx.bezierCurveTo(X(0.8), Y(y + 0.045), X(0.95), Y(y + 0.03), X(1.02), Y(y + 0.02));
            ctx.closePath(); fillStroke('#efb3ad', '#c27f78', 1.2);
        }
        // le mucus du rhume
        if (rhume) {
            ctx.globalAlpha = 0.6;
            smoothClosed([[0.45, 0.55], [0.55, 0.42], [0.7, 0.36], [0.95, 0.38], [1.02, 0.56], [0.6, 0.6]]);
            fillStroke('#a7c957', '#7f9f3a', 1);
            ctx.globalAlpha = 1;
            text('🤧 Nez bouché : les odeurs n\'arrivent plus en haut', 1.0, 0.97, m * 0.03, '#5e7a20');
        }
        // la muqueuse olfactive, le bulbe et le nerf
        const got = playing && !rhume;
        ctx.beginPath(); ctx.moveTo(X(0.64), Y(0.27)); ctx.quadraticCurveTo(X(0.76), Y(0.255), X(0.88), Y(0.275));
        ctx.strokeStyle = got ? O.col : '#e3b04b'; ctx.lineWidth = Math.max(3, m * 0.018); ctx.stroke();
        ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 1;
        for (let x = 0.67; x < 0.87; x += 0.03) { ctx.beginPath(); ctx.moveTo(X(x), Y(0.262)); ctx.lineTo(X(x + 0.005), Y(0.205)); ctx.stroke(); }
        tube(OD_NERF.slice(1), 0.03, '#f0c75a', '#b8902a');
        ell(0.8, 0.198, 0.07, 0.022); fillStroke('#f0c75a', '#b8902a', 1.5);
        if (got) {
            ctx.globalAlpha = 0.35 + 0.25 * Math.sin(simTime * 5); ctx.fillStyle = '#f7c1d3';
            ell(1.12, 0.07, 0.22, 0.09); ctx.fill(); ctx.globalAlpha = 1;
            ctx.strokeStyle = C5S_SENSES.odorat.color; ctx.lineWidth = 2;
            ell(1.12, 0.07, 0.22, 0.09); ctx.stroke();
            pulses(_c5sPath(OD_NERF), '#fff8d0', 4, 0.15, 0.009);
        }
        // la source de l'odeur et ses molécules
        emoji(O.ico, 0.13, 0.86, 0.13);
        ctx.fillStyle = O.col;
        for (let k = 0; k < 12; k++) {
            const u0 = frac(simTime * 0.12 + k / 12);
            const u = rhume ? u0 * 0.62 : u0;
            const q = _c5sAt(OD_PATH, u);
            ctx.globalAlpha = Math.min(1, u0 / 0.08, (1 - u0) / 0.1);
            circ(q[0] + 0.015 * Math.sin(u0 * 18 + k * 2), q[1] + 0.01 * Math.cos(u0 * 13 + k), 0.009); ctx.fill();
        }
        ctx.globalAlpha = 1;
        text(`👃 ${O.txt}`, 0.18, 0.06, m * 0.036, C5S_SENSES.odorat.color, 'left');
    }

    // ── Scène « Le goût » ─────────────────────────────────────────────────
    const TONGUE = [[0.22, 0.14], [0.48, 0.08], [0.74, 0.14], [0.78, 0.45], [0.72, 0.75], [0.6, 0.92], [0.48, 0.96], [0.36, 0.92], [0.24, 0.75], [0.18, 0.45]];
    function drawGout() {
        ctx.fillStyle = '#f7eef0'; ctx.fillRect(0, 0, cssW, cssH);
        const F = C5S_FLAVOURS[flavour];
        // la langue et ses papilles
        smoothClosed(TONGUE); fillStroke('#ea8c98', '#b45563', 2);
        ctx.strokeStyle = 'rgba(180,85,99,0.5)'; ctx.lineWidth = Math.max(1.5, m * 0.006);
        ctx.beginPath(); ctx.moveTo(X(0.48), Y(0.16)); ctx.lineTo(X(0.48), Y(0.82)); ctx.stroke();
        ctx.fillStyle = '#f5b3bd';
        for (const [x, y, r] of C5S_PAPILLAE) { circ(x, y, r); ctx.fill(); }
        for (let i = 0; i < 7; i++) {          // les grosses papilles en « V »
            const t = i / 6, x = 0.3 + t * 0.36, y = 0.2 + (1 - Math.abs(t - 0.5) * 2) * 0.1;
            circ(x, y, 0.017); fillStroke('#f5b3bd', '#c4707d', 1.2);
        }
        // les molécules de la saveur, partout sur la langue
        ctx.fillStyle = F.col;
        const r = _c5sRand(42 + Object.keys(C5S_FLAVOURS).indexOf(flavour));
        for (let k = 0; k < 40; k++) {
            const x = 0.24 + r() * 0.48, y = 0.22 + r() * 0.66, ph = r() * 6.28;
            if (((x - 0.48) / 0.27) ** 2 + ((y - 0.55) / 0.38) ** 2 > 0.85) continue;
            ctx.globalAlpha = playing ? 0.45 + 0.45 * Math.sin(simTime * 3 + ph) : 0.75;
            circ(x, y, 0.009); ctx.fill();
        }
        ctx.globalAlpha = 1;
        emoji(F.ico, 0.1, 0.86, 0.12);
        text(`${F.name} : ${F.food}`, 0.03, 0.04, m * 0.034, F.col, 'left');
        // la loupe sur une papille
        const Z = [1.22, 0.42], ZR = 0.27, pap = [0.61, 0.42];
        ctx.strokeStyle = '#9aa3ae'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        polyline([pap, [Z[0] - ZR * 0.75, Z[1] - ZR * 0.66]]); ctx.stroke();
        polyline([pap, [Z[0] - ZR * 0.75, Z[1] + ZR * 0.66]]); ctx.stroke();
        ctx.setLineDash([]);
        circ(pap[0], pap[1], 0.025); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save();
        circ(Z[0], Z[1], ZR); ctx.fillStyle = '#fbe3e7'; ctx.fill(); ctx.clip();
        // la surface de la langue, une papille en forme de champignon
        ctx.beginPath(); ctx.moveTo(X(Z[0] - ZR), Y(0.36));
        ctx.lineTo(X(1.07), Y(0.36)); ctx.quadraticCurveTo(X(1.08), Y(0.25), X(1.22), Y(0.24));
        ctx.quadraticCurveTo(X(1.36), Y(0.25), X(1.37), Y(0.36)); ctx.lineTo(X(Z[0] + ZR), Y(0.36));
        ctx.lineTo(X(Z[0] + ZR), Y(Z[1] + ZR)); ctx.lineTo(X(Z[0] - ZR), Y(Z[1] + ZR)); ctx.closePath();
        fillStroke('#ef9aa6', '#b45563', 2);
        // les bourgeons du goût
        for (const bxx of [1.14, 1.3]) {
            ell(bxx, 0.42, 0.035, 0.07); fillStroke('#fde6c8', '#c48a4a', 1.5);
            ctx.strokeStyle = '#c48a4a'; ctx.lineWidth = 1;
            for (const d of [-0.018, 0, 0.018]) { ctx.beginPath(); ctx.moveTo(X(bxx + d), Y(0.36)); ctx.quadraticCurveTo(X(bxx + d * 1.6), Y(0.42), X(bxx + d), Y(0.48)); ctx.stroke(); }
            circ(bxx, 0.352, 0.008); ctx.fillStyle = '#7a3a2a'; ctx.fill();        // le pore
            tube([[bxx, 0.49], [bxx + (1.22 - bxx) * 0.6, 0.6], [1.22, 0.72]], 0.008, '#f0c75a', '#b8902a');
        }
        // molécules qui entrent dans les pores
        ctx.fillStyle = F.col;
        for (let k = 0; k < 8; k++) {
            const u = frac(simTime * 0.3 + k / 8), bxx = k % 2 ? 1.14 : 1.3;
            const x = bxx + (k % 3 - 1) * 0.04 * (1 - u), y = 0.2 + u * 0.16;
            ctx.globalAlpha = Math.min(1, (1 - u) / 0.15) * (playing ? 1 : 0.7);
            circ(x, y, 0.008); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        circ(Z[0], Z[1], ZR); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke();
        text('🔍 une papille vue au microscope', Z[0], Z[1] - ZR - 0.035, m * 0.03, '#6b7280', 'center', 700);
        // le nerf et le cerveau
        const nerf = [[1.22, 0.69], [1.3, 0.78], [1.4, 0.84]];
        tube(nerf, 0.022, '#f0c75a', '#b8902a');
        brainMini(1.47, 0.86, 0.085, F.col, glowNow());
        if (playing) pulses(_c5sPath([[1.22, 0.55], ...nerf]), '#fff8d0', 3, 0.12, 0.008);
    }

    // ── Scène « Le toucher » ──────────────────────────────────────────────
    const REC = {
        't-caresse': [0.82, 0.39], 't-pression': [0.55, 0.78], 't-temperature': [1.02, 0.38], 't-douleur': [1.17, 0.36]
    };
    function drawToucher() {
        ctx.fillStyle = '#eef3f8'; ctx.fillRect(0, 0, cssW, cssH);
        const Sx = C5S_STIMS[stim], active = Sx.rec;
        const x0 = 0.32, x1 = 1.32;
        const press = stim === 'appui' ? 0.025 * (playing ? 0.6 + 0.4 * Math.sin(simTime * 4) : 1) : 0;
        const surf = x => 0.28 + 0.006 * Math.sin(x * 60) + (Math.abs(x - REC['t-pression'][0]) < 0.08 ? press * Math.cos((x - REC['t-pression'][0]) / 0.08 * Math.PI / 2) : 0);
        const band = (yTop, yBot, fill, stroke) => {
            ctx.beginPath();
            for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60; const y = yTop(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
            ctx.lineTo(X(x1), Y(yBot)); ctx.lineTo(X(x0), Y(yBot)); ctx.closePath();
            fillStroke(fill, stroke, 1.5);
        };
        band(() => 0.66, 0.92, '#fbe7a8', '#c9a64a');                       // hypoderme
        ctx.strokeStyle = 'rgba(201,166,74,0.8)'; ctx.lineWidth = 1;
        for (let x = x0 + 0.04; x < x1; x += 0.065) for (let y = 0.71; y < 0.9; y += 0.06) { circ(x + (y * 7 % 0.03), y, 0.024); ctx.stroke(); }
        band(surf, 0.66, '#e8b48c', '#a8664a');                               // épiderme
        band(x => surf(x) + 0.08, 0.66, '#f3c2b1', null);                     // derme
        ctx.strokeStyle = '#a8664a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); for (let i = 0; i <= 60; i++) { const x = x0 + (x1 - x0) * i / 60; i ? ctx.lineTo(X(x), Y(surf(x) + 0.08)) : ctx.moveTo(X(x), Y(surf(x) + 0.08)); } ctx.stroke();
        // vaisseaux sanguins
        for (const [col, dy] of [['#d63a3a', 0], ['#3f6fd1', 0.018]]) {
            ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, m * 0.007);
            ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = x0 + (x1 - x0) * i / 40, y = 0.6 + dy + 0.01 * Math.sin(x * 25); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke();
        }
        // le poil
        ell(0.43, 0.6, 0.02, 0.035); fillStroke('#d9a07a', '#8a5a3a', 1.5);
        tube([[0.43, 0.6], [0.45, 0.3], [0.49, 0.08]], 0.008, '#5a3a25');
        // la glande à sueur
        const coil = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 6; coil.push([0.65 + 0.025 * Math.cos(a), 0.57 + 0.02 * Math.sin(a)]); }
        tube(coil, 0.008, '#9fd0f0', '#5a9cc8');
        tube([[0.65, 0.55], [0.64, 0.42], [0.66, 0.3]], 0.007, '#9fd0f0', '#5a9cc8');
        // le nerf et les fibres
        const nerveY = 0.7;
        const nerve = [[0.47, nerveY], [x1, nerveY], [1.42, nerveY], [1.45, 0.3]];
        const fibre = id => { const r = REC[id]; return [r, [r[0], nerveY]]; };
        for (const id in REC) tube(fibre(id), 0.006, '#f0c75a', '#b8902a');
        tube(nerve, 0.022, '#f0c75a', '#b8902a');
        brainMini(1.46, 0.17, 0.1, Sx.col, glowNow());
        // les récepteurs
        const on = id => id === active;
        const halo = (id) => {
            if (!on(id)) return;
            const r = REC[id];
            ctx.globalAlpha = playing ? 0.35 + 0.3 * Math.sin(simTime * 8) : 0.4;
            circ(r[0], r[1], 0.05); ctx.fillStyle = Sx.col; ctx.fill(); ctx.globalAlpha = 1;
        };
        Object.keys(REC).forEach(halo);
        // toucher léger (corpuscule de Meissner)
        let r = REC['t-caresse'];
        ell(r[0], r[1], 0.016, 0.03); fillStroke('#f7d6dc', '#b45563', 1.5);
        ctx.strokeStyle = '#b45563'; ctx.lineWidth = 1;
        for (let d = -0.02; d <= 0.02; d += 0.01) { ctx.beginPath(); ctx.moveTo(X(r[0] - 0.013), Y(r[1] + d)); ctx.lineTo(X(r[0] + 0.013), Y(r[1] + d)); ctx.stroke(); }
        // pression (corpuscule de Pacini)
        r = REC['t-pression'];
        for (let i = 4; i >= 1; i--) { ell(r[0], r[1], 0.012 * i, 0.016 * i); fillStroke(i % 2 ? '#f7e4ea' : '#f0cad4', '#b45563', 1); }
        // chaud / froid : terminaison en bouton
        r = REC['t-temperature'];
        circ(r[0], r[1], 0.014); fillStroke(stim === 'froid' ? '#9cc8f0' : '#f2a08a', '#a8664a', 1.5);
        // douleur : terminaisons libres jusque dans l'épiderme
        r = REC['t-douleur'];
        ctx.strokeStyle = '#b8902a'; ctx.lineWidth = Math.max(1.5, m * 0.004);
        for (const [dx, dy] of [[-0.03, -0.06], [0, -0.065], [0.03, -0.055]]) {
            ctx.beginPath(); ctx.moveTo(X(r[0]), Y(r[1])); ctx.quadraticCurveTo(X(r[0] + dx * 0.4), Y(r[1] + dy * 0.6), X(r[0] + dx), Y(r[1] + dy)); ctx.stroke();
        }
        // le stimulus au-dessus de la peau
        const ra = REC[active], bob = playing ? 0.012 * Math.sin(simTime * 4) : 0;
        if (stim === 'chaud' || stim === 'froid') {
            ctx.strokeStyle = Sx.col; ctx.lineWidth = Math.max(1.5, m * 0.004);
            for (let k = 0; k < 3; k++) {
                const y0 = 0.25 - frac(simTime * 0.5 + k / 3) * 0.08 * (stim === 'chaud' ? 1 : -1);
                ctx.globalAlpha = 0.7;
                ctx.beginPath(); for (let i = 0; i <= 10; i++) { const x = ra[0] - 0.06 + i * 0.012; const y = y0 + 0.006 * Math.sin(i * 1.5 + simTime * 6); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
        const sy = stim === 'piqure' ? 0.2 : stim === 'appui' ? 0.18 : 0.13;
        emoji(Sx.ico, ra[0] + (stim === 'caresse' ? 0.03 * Math.sin(simTime * 3) : 0), sy + bob, 0.11, stim === 'caresse' ? -0.8 : stim === 'piqure' ? 0.6 : 0);
        text(Sx.txt, 0.74, 0.97, m * 0.032, Sx.col, 'center', 800);
        // les messages nerveux
        if (playing) pulses(_c5sPath([ra, [ra[0], nerveY], ...nerve.slice(1)]), '#fff8d0', 5, 0.2, 0.009);
    }

    // ── Étiquettes (chacune placée près de sa partie) ───────────────────
    function labelFont() { return Math.max(9.5, Math.min(16, m * 0.032)); }
    function drawLabels(list) {
        labelHits = [];
        const fs = labelFont(), h = fs * 1.7;
        ctx.font = fnt(fs);
        for (const p of list) {
            const txt = p.lbl || p.name, col = partColor(p), on = part === p.id;
            const w = ctx.measureText(txt).width + 14;
            const x = Math.max(2, Math.min(cssW - w - 2, X(p.lx) - w / 2));
            const y = Math.max(2, Math.min(cssH - h - 2, Y(p.ly) - h / 2));
            const ax = X(p.x), ay = Y(p.y);
            const qx = Math.max(x, Math.min(x + w, ax)), qy = Math.max(y, Math.min(y + h, ay));
            ctx.globalAlpha = part && !on ? 0.7 : 1;
            if (Math.hypot(ax - qx, ay - qy) > 3) {
                ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = on ? 5 : 3.5;
                ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(ax, ay); ctx.stroke();
                ctx.strokeStyle = col; ctx.lineWidth = on ? 2.5 : 1.5;
                ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(ax, ay); ctx.stroke();
            }
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(ax, ay, on ? 4.5 : 3.2, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.fillStyle = on ? col : 'rgba(255,255,255,0.95)';
            roundRect(x, y, w, h, 8); ctx.fill();
            ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = on ? '#fff' : '#1f2937';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, x + w / 2, y + h / 2 + 1);
            ctx.globalAlpha = 1;
            labelHits.push({ id: p.id, x: x - 4, y: y - 4, w: w + 8, h: h + 8 });
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function computeLayout(list) {
        const A = C5S_A[groupKey()];
        m = Math.min((cssH - 26) * 0.97, (cssW - 12) / A);
        bx = (cssW - A * m) / 2;
        by = Math.max(4, (cssH - 22 - m) / 2);
    }
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.lineCap = 'round';
        const list = curParts();
        computeLayout(list);
        const g = groupKey();
        if (g === 'ensemble') { ctx.fillStyle = '#eef3f8'; ctx.fillRect(0, 0, cssW, cssH); drawEnsemble(); }
        else if (g === 'vue') drawVue();
        else if (g === 'ouie') drawOuie();
        else if (g === 'odorat') drawOdorat();
        else if (g === 'gout') drawGout();
        else drawToucher();

        // partie sélectionnée : halo
        const p = part && C5S_PART_BY_ID[part];
        if (p && p.group === g) {
            const r = Math.max(14, m * 0.045) * (1 + 0.12 * Math.sin(performance.now() / 260));
            ctx.strokeStyle = partColor(p); ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
            ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), r, 0, 2 * Math.PI); ctx.stroke();
            ctx.setLineDash([]);
        }
        anchorHits = list.map(q => ({ id: q.id, x: X(q.x), y: Y(q.y) }));
        if (showLabels) drawLabels(list); else labelHits = [];
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function partsList(list) {
        return `<ul class="c5s-list">${list.map(q =>
            `<li><button data-part="${q.id}" class="${part === q.id ? 'on' : ''}" style="--st-c:${partColor(q)}">${q.name}</button></li>`).join('')}</ul>`;
    }
    function senseSummary(k, withStudy) {
        const S0 = C5S_SENSES[k];
        return `<div class="c5s-status">${S0.ico} <span style="color:${S0.color}">${S0.name}</span></div>
            <p class="c5s-text"><b>Organe :</b> ${S0.organ}<br><b>Il capte :</b> ${S0.detects}</p>
            <div style="font-weight:800;margin:0 0 2px">Comment ça marche ?</div>
            <ol class="c5s-steps">${S0.steps.map(s => `<li>${s}</li>`).join('')}</ol>
            <p class="c5s-protect">🛡️ <b>Prends-en soin :</b> ${S0.protect}</p>
            <p class="c5s-know">💡 <b>Le savais-tu ?</b> ${S0.know}</p>
            ${withStudy ? `<ul class="c5s-list"><li><button class="c5s-study" data-study="${k}" style="--st-c:${S0.color}">🔍 Étudier ce sens en détail</button></li></ul>` : ''}`;
    }
    function updateInfo() {
        row2.querySelectorAll('.c5s-sense-btn').forEach(b => {
            const p = part && C5S_PART_BY_ID[part];
            const on = mode === 'sens' ? b.dataset.sense === sense : !!(p && p.sense === b.dataset.sense);
            b.classList.toggle('on', on);
        });
        row3.querySelectorAll('[data-odor]').forEach(b => b.classList.toggle('on', b.dataset.odor === odor));
        row3.querySelectorAll('[data-flavour]').forEach(b => b.classList.toggle('on', b.dataset.flavour === flavour));
        row3.querySelectorAll('[data-stim]').forEach(b => b.classList.toggle('on', b.dataset.stim === stim));
        rhumeBtn.classList.toggle('on', rhume);
        lightVal.textContent = light < 25 ? 'faible : la pupille s\'agrandit' : light > 75 ? 'forte : la pupille rétrécit' : 'moyenne';
        if (Number(lightSl.value) !== light) lightSl.value = light;
        volVal.textContent = `${volume} dB · ${_c5sDb(volume)}${volume > 85 ? ' ⚠' : ''}`;
        if (Number(volSl.value) !== volume) volSl.value = volume;

        const key = [mode, sense, part].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        const p = part && C5S_PART_BY_ID[part];
        if (p && p.sense && !p.text) {          // un sens choisi dans la vue d'ensemble
            side.style.borderLeftColor = C5S_SENSES[p.sense].color;
            side.innerHTML = `<h4>Les 5 sens</h4>${senseSummary(p.sense, true)}
                <ul class="c5s-list" style="margin-top:6px"><li><button data-back="1" style="--st-c:#6b7280">↩ Retour</button></li></ul>`;
            return;
        }
        if (p) {
            const col = partColor(p), tag = p.group === 'ensemble' ? null : C5S_SENSES[p.group];
            side.style.borderLeftColor = col;
            side.innerHTML = `${tag ? `<span class="c5s-tag" style="background:${tag.color}">${tag.ico} ${tag.name}</span>` : ''}
                <h4>${p.name}</h4>
                <p class="c5s-text">${p.text}</p>
                ${p.know ? `<p class="c5s-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>` : ''}
                <div style="font-weight:800;margin:0 0 4px">Les autres parties :</div>
                ${partsList(C5S_PARTS[p.group])}
                <ul class="c5s-list" style="margin-top:6px"><li><button data-back="1" style="--st-c:#6b7280">↩ Retour</button></li></ul>`;
            return;
        }
        if (mode === 'sens') {
            side.style.borderLeftColor = C5S_SENSES[sense].color;
            side.innerHTML = `<h4>Un sens à la fois</h4>${senseSummary(sense, false)}
                <div style="font-weight:800;margin:0 0 4px">Touche une partie pour en savoir plus :</div>
                ${partsList(curParts())}`;
            return;
        }
        side.style.borderLeftColor = '#6b4fc4';
        side.innerHTML = `<h4>Les 5 sens</h4>
            <p class="c5s-text">${C5S_OVERVIEW.text}</p>
            <p class="c5s-chain">Organe des sens ➜ ⚡ nerf ➜ 🧠 cerveau</p>
            <p class="c5s-know">💡 <b>Le savais-tu ?</b> ${C5S_OVERVIEW.know}</p>
            <div style="font-weight:800;margin:0 0 4px">Choisis un sens :</div>
            <ul class="c5s-list">${C5S_ORDER.map(k => `<li><button data-study="${k}" style="--st-c:${C5S_SENSES[k].color}">${C5S_SENSES[k].ico} ${C5S_SENSES[k].name} : ${C5S_SENSES[k].organ} 🔍</button></li>`).join('')}</ul>`;
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
            guideT = 0;
            setPart(curParts()[0].id);
            if (!playing) setPlaying(true);
        }
    }
    function setPart(id) {
        const p = id && C5S_PART_BY_ID[id];
        part = p && p.group === groupKey() ? id : null;
        lastInfoKey = '';
        if (part) startLoop();          // le halo de la partie choisie pulse
        requestDraw();
    }
    function stepPart(dir) {
        const list = curParts();
        const i = list.findIndex(p => p.id === part);
        const n = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
        setPart(list[n].id);
    }
    function setSense(k) {
        if (!C5S_SENSES[k]) return;
        sense = k;
        container.dataset.sense = k;
        if (part && C5S_PART_BY_ID[part].group !== groupKey()) part = null;
        lastInfoKey = '';
        requestDraw();
    }
    function setMode(mm) {
        mode = mm === 'sens' ? 'sens' : 'ensemble';
        container.dataset.mode = mode;
        header.querySelectorAll('.c5s-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (guided) setGuided(false);
        if (part && C5S_PART_BY_ID[part].group !== groupKey()) part = null;
        baseHint = mode === 'ensemble'
            ? 'Touche un organe des sens ou une étiquette pour l\'expliquer · ▶ Lecture pour voir les messages nerveux'
            : 'Essaie l\'expérience · Touche une partie pour l\'expliquer · ▶ Lecture pour animer';
        hint.textContent = baseHint;
        lastInfoKey = '';
        requestDraw();
    }
    function study(k) {
        setSense(k);
        setMode('sens');
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
        const near = anchorHits.some(a => Math.hypot(x - a.x, y - a.y) < Math.max(20, m * 0.06));
        setCursor(labelHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || near ? 'pointer' : 'default');
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
        if (guided) setGuided(false);
        for (const h of labelHits) {
            if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
                setPart(part === h.id ? null : h.id);
                if (typeof saveBoard === 'function') saveBoard();
                return;
            }
        }
        let best = null, bd = Math.max(20, m * 0.06);
        for (const a of anchorHits) {
            const dd = Math.hypot(x - a.x, y - a.y);
            if (dd < bd) { bd = dd; best = a.id; }
        }
        setPart(best && best !== part ? best : null);
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, row2, row3, header].forEach(el => {
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
        else if (b.dataset.study) study(b.dataset.study);
        if (typeof saveBoard === 'function') saveBoard();
    });

    header.querySelectorAll('.c5s-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); saveBoard(); });
    guideBtn.addEventListener('click', () => setGuided(!guided));
    $('.c5s-prev').addEventListener('click', () => { if (guided) setGuided(false); stepPart(-1); saveBoard(); });
    $('.c5s-next').addEventListener('click', () => { if (guided) setGuided(false); stepPart(1); saveBoard(); });
    $('.c5s-all').addEventListener('click', () => { if (guided) setGuided(false); setPart(null); saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); saveBoard(); });
    row2.querySelectorAll('.c5s-sense-btn').forEach(b => b.addEventListener('click', () => {
        if (guided) setGuided(false);
        const k = b.dataset.sense;
        if (mode === 'sens') setSense(k);
        else setPart(part === k ? null : k);
        saveBoard();
    }));
    lightSl.addEventListener('input', () => { light = Number(lightSl.value); requestDraw(); });
    lightSl.addEventListener('change', () => saveBoard());
    volSl.addEventListener('input', () => { volume = Number(volSl.value); requestDraw(); });
    volSl.addEventListener('change', () => saveBoard());
    row3.querySelectorAll('[data-odor]').forEach(b => b.addEventListener('click', () => { odor = b.dataset.odor; requestDraw(); saveBoard(); }));
    rhumeBtn.addEventListener('click', () => { rhume = !rhume; requestDraw(); saveBoard(); });
    row3.querySelectorAll('[data-flavour]').forEach(b => b.addEventListener('click', () => { flavour = b.dataset.flavour; requestDraw(); saveBoard(); }));
    row3.querySelectorAll('[data-stim]').forEach(b => b.addEventListener('click', () => {
        stim = b.dataset.stim;
        if (!playing) setPlaying(true);
        requestDraw(); saveBoard();
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
            window._wfMiniBarCollapse(widget, '🖐️ Les 5 sens', {
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
    setMode('ensemble');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._c5sGetData = () => ({
        containerW: contW, containerH: contH,
        mode, sense, part, showLabels, fast,
        light, volume, odor, rhume, flavour, stim,
        fullboard: _isMax
    });
    widget._c5sSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.light === 'number') light = Math.max(0, Math.min(100, Math.round(d.light)));
        if (typeof d.volume === 'number') volume = Math.max(20, Math.min(110, Math.round(d.volume)));
        if (C5S_ODORS[d.odor]) odor = d.odor;
        if (typeof d.rhume === 'boolean') rhume = d.rhume;
        if (C5S_FLAVOURS[d.flavour]) flavour = d.flavour;
        if (C5S_STIMS[d.stim]) stim = d.stim;
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        setFast(!!d.fast);
        if (C5S_SENSES[d.sense]) setSense(d.sense);
        setMode(d.mode || 'ensemble');
        if (typeof d.part === 'string') setPart(d.part);
        if (!!d.fullboard !== _isMax) wfMax.click();
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_c5sSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
