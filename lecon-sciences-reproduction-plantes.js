// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (même aide que dans les autres leçons de sciences : définie une seule fois)
if (!window._wfPhoneAutoMax) {
    window._wfPhoneAutoMax = function (widget, open, isOpen, setKey, launchOnly) {
        var phone = false;
        if (typeof isMobileBoardMode === 'function') { try { phone = !!isMobileBoardMode(); } catch (e) {} }
        if (!phone && window.matchMedia) phone = window.matchMedia((window.PHONE_MEDIA_QUERY || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)')).matches;
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
        return !!(window.matchMedia && window.matchMedia((window.PHONE_MEDIA_QUERY || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)')).matches);
    };
}

// =========================================================================
// WIDGET LA REPRODUCTION DES PLANTES — Le Bureau du Prof
// Trois onglets, pour des élèves de cycle 3 (CM1 – CM2 – 6e) :
//  🌱 Le cycle de vie : une plante à fleurs grandit sous nos yeux, de la
//     graine à la graine, en 8 étapes : la graine, la germination, la
//     croissance, la floraison, la pollinisation (une abeille apporte le
//     pollen d'une autre fleur), la fécondation, le fruit, la dissémination.
//     Des loupes montrent l'intérieur de la graine, du pistil et du fruit.
//     Une roue du cycle permet d'aller directement à une étape.
//  🌸 La fleur : une fleur en coupe (sépales, pétales, étamines, pistil,
//     ovaire, ovules). On touche une partie pour l'expliquer ; le curseur
//     ou ▶ Lecture montrent la pollinisation, le tube pollinique, la
//     fécondation, puis l'ovaire qui devient fruit et les ovules graines.
//  🫘 La germination : l'expérience des 4 pots. On choisit pour chaque pot
//     l'eau, la chaleur, l'air et la lumière, on fait passer les jours et
//     l'on observe dans quels pots les graines germent.
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

    // ── Plein écran automatique (bouton vert) sur téléphone ET tablette ────
    // Partagé par les jeux. Mêmes conditions que board.js et style-phone.css
    // (window.PHONE_MEDIA_QUERY / window.TABLET_MEDIA_QUERY) :
    //   • téléphone (portrait ou paysage) ;
    //   • tablette tactile (iPad, iPad mini, tablette Android).
    // Ordinateur et TBI à la souris/au stylet : ouverture normale en fenêtre.
    if (!window._jeuWantsFullboard) {
        window._jeuWantsFullboard = function () {
            try {
                if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) return true;
                if (typeof isTabletBoardMode === 'function' && isTabletBoardMode()) return true;
                if (typeof isPhoneScreen === 'function' && isPhoneScreen()) return true;
                if (!window.matchMedia) return false;
                var phoneQ  = window.PHONE_MEDIA_QUERY  || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)';
                var tabletQ = window.TABLET_MEDIA_QUERY || '(pointer: coarse) and (min-width: 601px) and (min-height: 501px)';
                if (window.matchMedia(phoneQ).matches || window.matchMedia(tabletQ).matches) return true;
            } catch (e) {}
            return false;
        };
    }

    // Variante de window._wfPhoneAutoMax (téléphone seul, partagée avec d'autres
    // fichiers) qui ouvre aussi le plein écran sur tablette.
    if (!window._wfAutoMaxPhoneTablet) {
        window._wfAutoMaxPhoneTablet = function (widget, open, isOpen, setKey, launchOnly) {
            if (!window._jeuWantsFullboard()) return;
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

    // ── Curseurs : flèche par défaut, main sur la barre du haut (elle déplace
    //    le widget), doigt sur tout ce qui se clique
    if (!document.getElementById('reproduction-plantes-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'reproduction-plantes-cursors-style';
        _cs.textContent = [
            /* Ces leçons ont déjà leurs règles de curseur : on les complète */
            '.widget[data-type="reproduction-plantes"] { cursor: default; }',
            '.widget[data-type="reproduction-plantes"] .drag-handle, .widget[data-type="reproduction-plantes"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="reproduction-plantes"] .drag-handle:active, .widget[data-type="reproduction-plantes"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            /* En plein écran le widget ne se déplace plus : flèche sur la barre */
            '.widget[data-type="reproduction-plantes"] .rp-container.wf-fullboard .rp-header, .widget[data-type="reproduction-plantes"] .rp-container.wf-fullboard .rp-header:active, .widget[data-type="reproduction-plantes"] .rp-container.wf-fullboard .rp-header *:not(button):not(button *),',
            '.widget.phone-fs[data-type="reproduction-plantes"] .rp-header, .widget.phone-fs[data-type="reproduction-plantes"] .rp-header *:not(button):not(button *) { cursor: default !important; }',
            /* Tout ce qui se clique : doigt qui pointe */
            '.widget[data-type="reproduction-plantes"] button:not(:disabled), .widget[data-type="reproduction-plantes"] button:not(:disabled) *, .widget[data-type="reproduction-plantes"] select,',
            '.widget[data-type="reproduction-plantes"] .widget-menu-handle, .widget[data-type="reproduction-plantes"] .widget-pin-handle,',
            '.widget[data-type="reproduction-plantes"] .widget-back-handle, .widget[data-type="reproduction-plantes"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="reproduction-plantes"] button:disabled, .widget[data-type="reproduction-plantes"] button:disabled * { cursor: default !important; }',
            /* En plein écran, un widget pivoté fausserait la position fixe */
            '.widget[data-type="reproduction-plantes"]:has(.rp-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    if (document.getElementById('rp-style')) return;
    const s = document.createElement('style');
    s.id = 'rp-style';
    s.textContent = `
        .widget[data-type="reproduction-plantes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .rp-container {
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
        .rp-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .rp-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .rp-header .wf-btns { gap: 8px; }
        .rp-header .wf-btn { width: 18px; height: 18px; }
        .rp-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .rp-container.wf-fullboard {
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
        .rp-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .rp-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .rp-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .rp-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .rp-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .rp-btn:hover { background: #e0e0e0; }
        .rp-btn:active { transform: scale(0.96); }
        .rp-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .rp-btn-play { min-width: 112px; }
        .rp-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .rp-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .rp-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .rp-stage-btn, .rp-part-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .rp-stage-btn.on, .rp-part-btn.on { background: var(--st-c, #3b8fd9); border-color: var(--st-c, #3b8fd9); color: #fff; }
        .rp-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 200px; min-width: 180px; }
        .rp-slider { flex: 1; height: 30px; accent-color: #3f9e4d; cursor: pointer; touch-action: none; }
        .rp-val { font-size: 13px; font-weight: 800; color: #2f6f3a; min-width: 70px; text-align: right; white-space: nowrap; }

        /* Corps */
        .rp-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .rp-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #dff0e0;
        }
        .rp-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .rp-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: rgba(255,255,255,.92); pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,.6);
        }
        .rp-container[data-mode="fleur"] .rp-hint,
        .rp-container[data-mode="germ"] .rp-hint { color: #4b5563; text-shadow: 0 1px 0 rgba(255,255,255,.8); }
        .rp-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3f9e4d;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .rp-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #2f6f3a; }
        .rp-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .rp-change { background: #eaf6ec; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #24573a; font-weight: 700; }
        .rp-badge { display: inline-block; border-radius: 999px; padding: 1px 9px; font-size: .85em; font-weight: 800; color: #fff; margin: 0 0 6px; }
        .rp-text { margin: 0 0 6px; }
        .rp-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .rp-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .rp-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .rp-steps button.on { background: var(--st-c, #3b8fd9); color: #fff; }
        .rp-pots { list-style: none; margin: 0 0 6px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .rp-pots li { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 8px; font-size: .95em; }
        .rp-pots .ok { color: #2e7d32; font-weight: 800; }
        .rp-pots .ko { color: #c0392b; font-weight: 800; }
        .rp-pots .wait { color: #6b7280; font-weight: 700; }

        /* Aide */
        .rp-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .rp-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
            max-height: calc(100% - 70px); overflow-y: auto;
        }
        .rp-help-popup.show { display: block; }
        .rp-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .rp-help-popup p { margin: 0 0 6px; }

        .rp-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .rp-resize-handle:hover { opacity: 1; }
        .rp-container:not([data-mode="cycle"]) .rp-only-cycle { display: none !important; }
        .rp-container:not([data-mode="fleur"]) .rp-only-fleur { display: none !important; }
        .rp-container:not([data-mode="germ"]) .rp-only-germ { display: none !important; }
        .rp-container[data-mode="germ"] .rp-hide-germ { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .rp-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .rp-tab-short { display: none; }
        .rp-header { min-width: 0; max-width: 100%; }
        .rp-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .rp-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .rp-header .wf-btns { flex-shrink: 0; }
        .rp-container.wf-fullboard .rp-resize-handle { display: none; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .rp-container { padding: 10px 10px 8px; gap: 6px; }
            .rp-header { gap: 6px; }
            .rp-title { font-size: 13px; }
            .rp-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .rp-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .rp-row > * { flex-shrink: 0; }
            .rp-row + .rp-row { flex-wrap: wrap; overflow: visible; }
            .rp-row + .rp-row .rp-lbl:first-child { display: none; }
            .rp-slider-box { flex: 1 1 160px; min-width: 0; }
            .rp-val { min-width: 0; }
            .rp-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .rp-btn-play { min-width: 0; }
            .rp-sep { display: none; }
            .rp-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .rp-side { padding: 8px 10px; font-size: 13px; }
            .rp-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .rp-title { display: none; }
            .rp-tab { padding: 3px 7px; font-size: 11.5px; }
            .rp-tab-long { display: none; }
            .rp-tab-short { display: inline; }
            .rp-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 600px) and (orientation: portrait) {
            .rp-body { flex-direction: column; }
            .rp-slider-box { flex: 1 1 100%; }
            .rp-scene-wrap { flex: 1 1 0; min-height: 240px; }
            .rp-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 600px) and (orientation: landscape) {
            .rp-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }

        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable */
        .widget[data-type="reproduction-plantes"], .rp-container, .rp-container * { cursor: default !important; }
        .rp-container .rp-header, .rp-container .rp-header * { cursor: grab !important; }
        .rp-container .rp-header:active, .rp-container .rp-header:active * { cursor: grabbing !important; }
        .rp-container button, .rp-container button *, .rp-container .rp-header button,
        .rp-container .rp-header button *,
        .rp-container input[type="range"] { cursor: pointer !important; }
        .rp-container button:disabled, .rp-container button:disabled *,
        .rp-container .rp-canvas { cursor: default !important; }
        .rp-container .rp-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les autres leçons ── */
        .rp-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .rp-title {
            font-size: 21px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .rp-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .rp-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .rp-help-popup { top: 56px; }
        .rp-container.wf-fullboard .rp-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .rp-container.wf-fullboard .rp-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .rp-title { font-size: 17px; }
        }
        .rp-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .rp-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 13px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .rp-tab:hover { background: rgba(255,255,255,.1); }
        .rp-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .rp-header { flex-wrap: nowrap; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .rp-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .rp-container.wf-fullboard .rp-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .rp-tab { padding: 3px 10px; font-size: 12px; }
            .rp-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .rp-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
// rep : moment « représentatif » de l'étape, affiché quand on y saute à l'arrêt
const RP_STAGES = [
    {
        id: 'graine', ico: '🫘', name: 'La graine', color: '#9a6a3a', rep: 0.35,
        change: `La graine contient une future plante et sa nourriture.`,
        text: `Une <b>graine</b> est vivante, mais elle « dort » : elle attend le bon moment. À l'intérieur, il y a un <b>embryon</b> (une minuscule plante), des <b>réserves</b> de nourriture et une <b>enveloppe</b> qui protège le tout. Quand elle est dans la terre, avec de l'<b>eau</b>, de l'<b>air</b> et une température douce, elle se réveille et absorbe de l'eau.`,
        know: `Certaines graines peuvent attendre très longtemps avant de germer : une graine de palmier vieille d'environ 2 000 ans a réussi à germer !`
    },
    {
        id: 'germ', ico: '🌱', name: 'La germination', color: '#7cb342', rep: 0.7,
        change: `La graine gonfle, s'ouvre, et la petite plante en sort.`,
        text: `La graine a absorbé de l'eau et a gonflé. Son enveloppe se déchire. D'abord sort la <b>racine</b>, qui s'enfonce dans le sol, puis la <b>tige</b>, qui monte vers la lumière. Les <b>cotylédons</b> (les réserves de la graine) nourrissent la jeune plante, qu'on appelle une <b>plantule</b>.`,
        know: `Pour germer, une graine a besoin d'eau, d'air et de chaleur, mais pas de lumière : elle utilise ses propres réserves. Vérifie-le dans l'onglet 🫘 La germination !`
    },
    {
        id: 'crois', ico: '🌿', name: 'La croissance', color: '#3f9e4d', rep: 0.75,
        change: `La plante fabrique sa propre nourriture et grandit.`,
        text: `Les cotylédons s'épuisent et fanent. Maintenant, la plante se débrouille seule : ses <b>racines</b> puisent l'<b>eau</b> et les <b>sels minéraux</b> du sol, ses <b>feuilles</b> captent la <b>lumière</b> du Soleil et le gaz carbonique de l'air. Grâce à cela, elle fabrique sa nourriture, grandit et forme de nouvelles feuilles.`,
        know: `Une plante privée de lumière devient pâle, jaune et toute fine : elle s'allonge en cherchant la lumière, puis elle meurt.`
    },
    {
        id: 'flor', ico: '🌸', name: 'La floraison', color: '#e0559a', rep: 0.85,
        change: `La plante adulte forme des fleurs : ce sont ses organes de reproduction.`,
        text: `Devenue adulte, la plante forme des <b>boutons</b> qui s'ouvrent en <b>fleurs</b>. La fleur contient les organes qui vont permettre de fabriquer des graines : les <b>étamines</b> (organes mâles) produisent le <b>pollen</b> et le <b>pistil</b> (organe femelle) contient les <b>ovules</b>. Les pétales colorés et le <b>nectar</b> sucré attirent les insectes.`,
        know: `Les abeilles voient des couleurs que nous ne voyons pas (l'ultraviolet) : beaucoup de fleurs ont des dessins invisibles pour nous qui les guident vers le nectar.`
    },
    {
        id: 'pollin', ico: '🐝', name: 'La pollinisation', color: '#e8a317', rep: 0.5,
        change: `Le pollen d'une fleur est transporté jusqu'au pistil d'une autre fleur.`,
        text: `Une abeille vient boire le <b>nectar</b> d'une fleur. Des grains de <b>pollen</b> se collent sur ses poils. Elle s'envole vers une autre fleur de la <b>même espèce</b> et y dépose du pollen sur le <b>stigmate</b> (le haut du pistil) : c'est la <b>pollinisation</b>. Chez certaines plantes, c'est le <b>vent</b> qui transporte le pollen.`,
        know: `Sans les insectes pollinisateurs (abeilles, bourdons, papillons…), beaucoup de fruits et de légumes ne pourraient pas se former. Protéger les abeilles, c'est protéger notre nourriture !`
    },
    {
        id: 'fecond', ico: '✨', name: 'La fécondation', color: '#8e5bd0', rep: 0.6,
        change: `Le pollen rejoint l'ovule : une graine commence à se former.`,
        text: `Le grain de pollen posé sur le stigmate fait pousser un petit tube, le <b>tube pollinique</b>, qui descend dans le style jusqu'à un <b>ovule</b>, dans l'<b>ovaire</b>. La cellule mâle du pollen et la cellule femelle de l'ovule s'unissent : c'est la <b>fécondation</b>. Ensuite, la fleur fane : les <b>pétales</b> et les <b>étamines</b> tombent, ils ne servent plus.`,
        know: `Chaque ovule doit être fécondé par un grain de pollen pour devenir une graine. Un fruit plein de pépins a donc reçu beaucoup de pollen !`
    },
    {
        id: 'fruit', ico: '🍒', name: 'Le fruit', color: '#d9342b', rep: 0.8,
        change: `L'ovaire devient le fruit et les ovules deviennent les graines.`,
        text: `Après la fécondation, l'<b>ovaire</b> grossit et se transforme en <b>fruit</b>. À l'intérieur, chaque <b>ovule</b> fécondé devient une <b>graine</b>. Le fruit protège les graines pendant qu'elles mûrissent, puis il change souvent de couleur quand il est mûr.`,
        know: `Pour un scientifique, la tomate, le concombre, le poivron et la courgette sont des fruits : ils viennent d'une fleur et contiennent des graines !`
    },
    {
        id: 'dissem', ico: '🌬️', name: 'La dissémination', color: '#14a0a0', rep: 0.55,
        change: `Les graines s'éloignent de la plante mère et tombent sur le sol.`,
        text: `Le fruit mûr tombe ou est mangé. Ses <b>graines</b> sont transportées loin de la plante mère : c'est la <b>dissémination</b>. Elles voyagent grâce au <b>vent</b> (pissenlit, érable), aux <b>animaux</b> (oiseaux qui mangent les fruits, graines accrochées aux poils) ou à l'<b>eau</b> (noix de coco). Si une graine tombe dans un bon endroit, elle germera : <b>le cycle recommence</b> !`,
        know: `Ici, la plante meurt après avoir donné ses graines : c'est une plante annuelle, comme le haricot ou le tournesol. D'autres plantes, comme les arbres, vivent de nombreuses années et refleurissent à chaque printemps.`
    }
];
const RP_OVERVIEW = {
    text: `Une plante à fleurs passe toujours par les mêmes étapes : de la <b>graine</b> naît une jeune <b>plante</b>, qui grandit et fait des <b>fleurs</b>. Les fleurs, pollinisées, donnent des <b>fruits</b> qui contiennent de nouvelles <b>graines</b>. C'est le <b>cycle de vie</b> de la plante : il recommence sans fin.`,
    other: `D'autres façons de se reproduire, sans graine : un morceau de tige mis dans l'eau peut faire des racines (une <b>bouture</b>), le fraisier fait des <b>stolons</b>, la pomme de terre des <b>tubercules</b>.`,
    know: `Plantes et animaux ont besoin les uns des autres : les insectes transportent le pollen, et les oiseaux sèment les graines des fruits qu'ils mangent.`
};
const RP_PARTS = {
    petales: {
        ico: '🌸', name: 'Les pétales', color: '#e0559a', sexe: '', role: 'attirer les insectes',
        text: `Les <b>pétales</b> sont souvent grands, colorés et parfumés. Ils attirent les <b>insectes pollinisateurs</b>, qui viennent boire le <b>nectar</b> sucré au fond de la fleur. Les pétales ne fabriquent ni pollen ni graines : ils fanent et tombent après la fécondation.`,
        know: `Certaines fleurs ont des « pistes d'atterrissage » dessinées sur leurs pétales pour guider les insectes jusqu'au nectar.`
    },
    sepales: {
        ico: '🍃', name: 'Les sépales', color: '#3f8f3a', sexe: '', role: 'protéger le bouton',
        text: `Les <b>sépales</b> sont les petites pièces vertes, sous les pétales. Quand la fleur n'est encore qu'un <b>bouton</b>, ils l'enveloppent et la protègent. Ils restent souvent accrochés au fruit.`,
        know: `La petite « couronne » verte sur une tomate ou une fraise, ce sont les sépales de l'ancienne fleur !`
    },
    etamines: {
        ico: '🟡', name: 'Les étamines', color: '#c99400', sexe: '♂ organes mâles', role: 'fabriquer le pollen',
        text: `Chaque <b>étamine</b> est formée d'un <b>filet</b> (une tige très fine) et d'une <b>anthère</b>, au bout. L'anthère fabrique le <b>pollen</b> : une fine poudre, souvent jaune, faite de minuscules grains. Le pollen contient les cellules reproductrices <b>mâles</b>.`,
        know: `Le pollen est si léger que le vent peut l'emporter très loin. C'est lui qui provoque le « rhume des foins » chez les personnes allergiques.`
    },
    pistil: {
        ico: '🏺', name: 'Le pistil', color: '#7b4fc9', sexe: '♀ organe femelle', role: 'recevoir le pollen et faire les graines',
        text: `Le <b>pistil</b> est au centre de la fleur. En haut, le <b>stigmate</b>, collant, retient les grains de pollen. Le <b>style</b> est un tube qui descend jusqu'à l'<b>ovaire</b>, la partie renflée du bas, qui contient les <b>ovules</b>.`,
        know: `Le stigmate est collant : le pollen déposé par les insectes ou par le vent y reste accroché.`
    },
    ovaire: {
        ico: '🫒', name: `L'ovaire`, color: '#3f9e4d', sexe: '♀ partie du pistil', role: 'deviendra le fruit',
        text: `L'<b>ovaire</b> est la base renflée du pistil. Il abrite et protège les <b>ovules</b>. Après la fécondation, il grossit énormément et se transforme en <b>fruit</b>.`,
        know: `Dans une cerise, une tomate ou un haricot vert, la partie que l'on mange vient de l'ovaire de la fleur.`
    },
    ovules: {
        ico: '⚪', name: 'Les ovules', color: '#2f7fd8', sexe: '♀ partie du pistil', role: 'deviendront les graines',
        text: `Les <b>ovules</b> sont cachés dans l'ovaire. Ils contiennent les cellules reproductrices <b>femelles</b>. Quand un ovule est <b>fécondé</b> par le pollen, il se transforme en <b>graine</b>.`,
        know: `Compte les pépins d'une pomme : chacun est un ancien ovule qui a été fécondé !`
    }
};
const RP_PART_ORDER = ['petales', 'sepales', 'etamines', 'pistil', 'ovaire', 'ovules'];
const RP_FLEUR_OVERVIEW = {
    text: `La <b>fleur</b> est l'organe de <b>reproduction</b> de la plante : c'est elle qui permet de fabriquer des graines. Elle possède des organes <b>mâles</b>, les <b>étamines</b>, qui fabriquent le pollen, et un organe <b>femelle</b>, le <b>pistil</b>, qui contient les ovules. Autour, les <b>pétales</b> attirent les insectes et les <b>sépales</b> protègent le bouton.`,
    know: `Chez la plupart des plantes, chaque fleur a des étamines et un pistil. Mais le noisetier a des fleurs mâles et des fleurs femelles séparées, et chez le kiwi il y a même des pieds mâles et des pieds femelles !`
};
const RP_FPHASES = [
    { max: 0.03, ico: '🌸', name: 'La fleur est ouverte', text: `Elle attend le pollen d'une autre fleur de la même espèce.` },
    { max: 0.28, ico: '🐝', name: 'La pollinisation', text: `L'abeille dépose sur le stigmate du pollen venu d'une autre fleur.` },
    { max: 0.60, ico: '💥', name: 'La fécondation', text: `Chaque grain de pollen fait pousser un tube jusqu'à un ovule, puis s'unit à lui.` },
    { max: 1.01, ico: '🍒', name: 'Le fruit se forme', text: `Les pétales et les étamines tombent, l'ovaire grossit et devient le fruit, les ovules deviennent des graines.` }
];
const RP_POT_KEYS = [['eau', '💧', 'eau'], ['chaleur', '🌡️', 'chaleur'], ['air', '💨', 'air'], ['lumiere', '☀️', 'lumière']];
const RP_ALL = { eau: 1, chaleur: 1, air: 1, lumiere: 1 };
const RP_EXP = {
    1: [RP_ALL, { eau: 0, chaleur: 1, air: 1, lumiere: 1 }, { eau: 1, chaleur: 0, air: 1, lumiere: 1 }, { eau: 1, chaleur: 1, air: 0, lumiere: 1 }],
    2: [RP_ALL, { eau: 1, chaleur: 1, air: 1, lumiere: 0 }, RP_ALL, { eau: 1, chaleur: 1, air: 1, lumiere: 0 }]
};

// ── Petites fonctions utiles ──────────────────────────────────────────────
function _rpClamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
function _rpEase(t) { t = _rpClamp(t); return t * t * (3 - 2 * t); }
function _rpLerp(a, b, t) { return a + (b - a) * t; }
function _rpHex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function _rpMix(a, b, t) {
    const A = _rpHex(a), B = _rpHex(b);
    t = _rpClamp(t);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
}
function _rpRand(n, seed) {     // petits cailloux du sol (identiques à chaque image)
    let x = seed;
    const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const a = [];
    for (let i = 0; i < n; i++) a.push([r(), r(), 0.6 + r() * 1.6]);
    return a;
}
function _rpPotOk(P) { return !!(P.eau && P.air && P.chaleur); }
function _rpPotText(P) {
    const parts = [];
    if (!P.air) parts.push('sous l\'eau : pas d\'air');
    else if (!P.eau) parts.push('coton sec : pas d\'eau');
    if (!P.chaleur) parts.push('au réfrigérateur');
    if (!P.lumiere) parts.push('dans le noir');
    return parts.length ? parts.join(', ') : 'coton humide, au chaud, à la lumière';
}

// ── Création du widget ────────────────────────────────────────────────────
function createReproductionPlantesWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'reproduction-plantes';
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
    container.className = 'rp-container';
    container.dataset.mode = 'cycle';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'rp-header';
    header.innerHTML = `
        <span class="rp-title">🌱<span> La reproduction des plantes</span></span>
        <div class="rp-tabs">
            <button class="rp-tab on" data-mode="cycle" title="Le cycle de vie de la plante"><span class="rp-tab-long">🌱 Le cycle de vie</span><span class="rp-tab-short">🌱 Cycle</span></button>
            <button class="rp-tab" data-mode="fleur" title="La fleur"><span class="rp-tab-long">🌸 La fleur</span><span class="rp-tab-short">🌸 Fleur</span></button>
            <button class="rp-tab" data-mode="germ" title="La germination"><span class="rp-tab-long">🫘 La germination</span><span class="rp-tab-short">🫘 Germer</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'rp-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres leçons)
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.rp-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : lecture, options
    const row1 = document.createElement('div');
    row1.className = 'rp-row';
    row1.innerHTML = `
        <button class="rp-btn rp-btn-play" title="Lancer / arrêter l'animation">▶ Lecture</button>
        <button class="rp-btn rp-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="rp-sep"></span>
        <button class="rp-btn rp-prev rp-only-cycle" title="Étape précédente">◀ Étape</button>
        <button class="rp-btn rp-next rp-only-cycle" title="Étape suivante">Étape ▶</button>
        <button class="rp-btn rp-all rp-only-cycle" title="Voir tout le cycle">🔄 Vue d'ensemble</button>
        <button class="rp-btn rp-fp rp-only-fleur" data-fp="0" title="La fleur ouverte">🌸 La fleur</button>
        <button class="rp-btn rp-fp rp-only-fleur" data-fp="0.19" title="Le pollen arrive sur le stigmate">🐝 Pollinisation</button>
        <button class="rp-btn rp-fp rp-only-fleur" data-fp="0.5" title="Le tube pollinique rejoint les ovules">💥 Fécondation</button>
        <button class="rp-btn rp-fp rp-only-fleur" data-fp="1" title="L'ovaire devient le fruit">🍒 Le fruit</button>
        <button class="rp-btn rp-exp rp-only-germ" data-exp="1" title="Pot A : tout · B : sans eau · C : au froid · D : sans air">🧪 Expérience 1 : eau, chaleur, air</button>
        <button class="rp-btn rp-exp rp-only-germ" data-exp="2" title="Deux pots à la lumière, deux pots dans le noir">🔦 Expérience 2 : la lumière</button>
        <button class="rp-btn rp-day0 rp-only-germ" title="Revenir au jour 0">⏮ Jour 0</button>
        <span class="rp-sep rp-hide-germ"></span>
        <button class="rp-btn rp-labels rp-hide-germ on" title="Afficher les noms des parties">🏷️ Étiquettes</button>
        <button class="rp-btn rp-wheel rp-only-cycle on" title="Afficher la roue du cycle">🎡 Roue du cycle</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : étapes (cycle) / parties (fleur) / jours (germination)
    const row2 = document.createElement('div');
    row2.className = 'rp-row';
    row2.innerHTML = `
        <span class="rp-lbl rp-only-cycle">Étapes :</span>
        ${RP_STAGES.map((s, i) => `<button class="rp-btn rp-stage-btn rp-only-cycle" data-stage="${i}" style="--st-c:${s.color}" title="${s.name}">${i + 1}. ${s.ico} ${s.name}</button>`).join('')}
        <div class="rp-slider-box rp-only-cycle">
            <span class="rp-lbl">⏳ Le temps passe :</span>
            <input type="range" class="rp-slider rp-tl" min="0" max="799" step="1" value="30" aria-label="Avancement du cycle">
            <span class="rp-val rp-tl-val"></span>
        </div>
        <span class="rp-lbl rp-only-fleur">Parties :</span>
        ${RP_PART_ORDER.map(k => `<button class="rp-btn rp-part-btn rp-only-fleur" data-part="${k}" style="--st-c:${RP_PARTS[k].color}" title="${RP_PARTS[k].name}">${RP_PARTS[k].ico} ${RP_PARTS[k].name}</button>`).join('')}
        <button class="rp-btn rp-part-all rp-only-fleur" title="Voir toute la fleur">🔄 Toute la fleur</button>
        <div class="rp-slider-box rp-only-fleur">
            <span class="rp-lbl">⏳ Après la fleur :</span>
            <input type="range" class="rp-slider rp-fps" min="0" max="100" step="1" value="0" aria-label="De la fleur au fruit">
            <span class="rp-val rp-fp-val"></span>
        </div>
        <div class="rp-slider-box rp-only-germ">
            <span class="rp-lbl">📅 Les jours passent :</span>
            <input type="range" class="rp-slider rp-day" min="0" max="12" step="0.1" value="0" aria-label="Jours">
            <span class="rp-val rp-day-val"></span>
        </div>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'rp-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'rp-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'rp-canvas';
    const hint = document.createElement('div');
    hint.className = 'rp-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'rp-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'rp-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La reproduction des plantes</h4>
        <p><b>🌱 Le cycle de vie</b> : <b>▶ Lecture</b> fait grandir la plante, de la graine jusqu'aux nouvelles graines.
        <b>◀ Étape ▶</b> ou les boutons d'étapes vont directement à une étape ; on peut aussi <b>toucher une étape sur la roue</b>.
        Le curseur <b>⏳</b> fait avancer le temps à la main. Des <b>loupes</b> montrent l'intérieur de la graine, du pistil et du fruit.</p>
        <p><b>🌸 La fleur</b> : <b>touche une partie de la fleur</b> (ou un bouton) pour l'expliquer. Les boutons
        🐝 💥 🍒 et le curseur montrent la pollinisation, la fécondation, puis le fruit qui se forme.</p>
        <p><b>🫘 La germination</b> : sous chaque pot, touche les pastilles <b>💧 eau, 🌡️ chaleur, 💨 air, ☀️ lumière</b>
        pour les enlever ou les remettre. Fais une prédiction, puis <b>▶ Lecture</b> fait passer les jours.</p>
        <p>La fiche de droite donne l'explication et un « Le savais-tu ? ».</p>
        <p style="color:#888">Schémas simplifiés : la plante est imaginaire, les tailles ne sont pas à l'échelle et la fleur est
        dessinée « en coupe » pour voir l'intérieur.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'rp-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const PEBBLES = _rpRand(90, 1717);

    const $ = sel => container.querySelector(sel);
    const playBtn = $('.rp-btn-play'), speedBtn = $('.rp-btn-speed');
    const labelsBtn = $('.rp-labels'), wheelBtn = $('.rp-wheel');
    const tlSl = $('.rp-tl'), tlVal = $('.rp-tl-val');
    const fpSl = $('.rp-fps'), fpVal = $('.rp-fp-val');
    const daySl = $('.rp-day'), dayVal = $('.rp-day-val');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'cycle';
    let G = 0.3;                    // avancement du cycle (0 … 8, une unité par étape)
    let ov = true;                  // vue d'ensemble (fiche générale)
    let selPart = null;             // partie de la fleur choisie
    let fp = 0;                     // de la fleur au fruit (0 … 1)
    let pots = RP_EXP[1].map(o => Object.assign({}, o));
    let day = 0;
    let showLabels = true, showWheel = true;
    let playing = false, fast = false;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let hits = [];                  // zones touchables { test(x, y), act() }

    const curStage = () => Math.max(0, Math.min(7, Math.floor(G)));
    const fPhaseIdx = () => RP_FPHASES.findIndex(p => fp < p.max);
    const fPhase = () => RP_FPHASES[Math.max(0, fPhaseIdx())];

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

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        w = Math.max(1, w); h = Math.max(1, h);
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else ctx.rect(x, y, w, h);
    }
    function pathHit(path, x, y, strokeW) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        let r = ctx.isPointInPath(path, x, y);
        if (!r && strokeW) { ctx.lineWidth = strokeW; r = ctx.isPointInStroke(path, x, y); }
        ctx.restore();
        return r;
    }
    function drawLeaf(x, y, ang, len, wid, col) {
        if (len < 0.5) return;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(len * 0.45, -wid, len, 0);
        ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
        ctx.fillStyle = col; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.88, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
        ctx.restore();
    }
    function drawSeed(x, y, r, cracked) {
        r = Math.max(1, r);
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.68, -0.15, 0, 2 * Math.PI);
        ctx.fillStyle = '#8a5a2b'; ctx.fill();
        ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.25, r * 0.35, r * 0.15, -0.3, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + r * 0.1, y + r * 0.42, r * 0.22, r * 0.08, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#f2e6c8'; ctx.fill();
        if (cracked) {
            ctx.strokeStyle = '#3b2410'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.05); ctx.lineTo(x - r * 0.2, y + r * 0.08); ctx.lineTo(x + r * 0.3, y - r * 0.05); ctx.stroke();
        }
    }
    function drawFruit(f) {
        ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, f.r), 0, 2 * Math.PI);
        ctx.fillStyle = f.col; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(f.x - f.r * 0.35, f.y - f.r * 0.35, f.r * 0.25, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    }
    function drawBee(x, y, s, ph, pollen, dir) {
        ctx.save();
        ctx.translate(x, y); ctx.scale(dir, 1);
        const fl = 0.55 + 0.45 * Math.abs(Math.sin(ph));
        ctx.fillStyle = 'rgba(255,255,255,0.82)'; ctx.strokeStyle = 'rgba(110,130,150,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.5, s * 0.32, Math.max(0.5, s * 0.55 * fl), -0.5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s * 0.2, -s * 0.45, s * 0.26, Math.max(0.5, s * 0.45 * fl), 0.4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.4, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#f5c518'; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = '#2b2b2b';
        for (const sx of [-0.3, 0.0, 0.28]) ctx.fillRect(sx * s, -s, s * 0.13, s * 2);
        ctx.restore();
        ctx.strokeStyle = '#5a4300'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.4, 0, 0, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = '#2b2b2b';
        ctx.beginPath(); ctx.arc(s * 0.68, -s * 0.04, s * 0.27, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.beginPath(); ctx.moveTo(s * 0.8, -s * 0.25); ctx.quadraticCurveTo(s * 0.95, -s * 0.6, s * 1.1, -s * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 0.07); ctx.lineTo(-s * 0.85, 0); ctx.lineTo(-s * 0.6, s * 0.07); ctx.fill();
        if (pollen) {
            ctx.fillStyle = '#ffb300';
            for (const px of [-0.15, 0.22]) { ctx.beginPath(); ctx.arc(px * s, s * 0.45, s * 0.14, 0, 2 * Math.PI); ctx.fill(); }
        }
        ctx.restore();
    }
    function drawSun(x, y, rs) {
        const g = ctx.createRadialGradient(x, y, rs * 0.3, x, y, rs * 2.4);
        g.addColorStop(0, 'rgba(255,214,102,0.8)'); g.addColorStop(1, 'rgba(255,170,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rs * 2.4, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,60,0.85)'; ctx.lineWidth = Math.max(2, rs * 0.08); ctx.lineCap = 'round';
        const rot = simTime * 0.15;
        for (let i = 0; i < 12; i++) {
            const a = rot + i * Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a) * rs * 1.2, y + Math.sin(a) * rs * 1.2);
            ctx.lineTo(x + Math.cos(a) * rs * 1.65, y + Math.sin(a) * rs * 1.65);
            ctx.stroke();
        }
        const c = ctx.createRadialGradient(x - rs * 0.3, y - rs * 0.3, rs * 0.1, x, y, rs);
        c.addColorStop(0, '#fff6c8'); c.addColorStop(0.6, '#ffd24a'); c.addColorStop(1, '#f5a623');
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, rs, 0, 2 * Math.PI); ctx.fill();
    }
    function arrow(x1, y1, x2, y2, col, w, dash) {
        ctx.save();
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.setLineDash([]);
        const a = Math.atan2(y2 - y1, x2 - x1), h = w * 3.2;
        ctx.beginPath();
        ctx.moveTo(x2 + Math.cos(a) * h * 0.4, y2 + Math.sin(a) * h * 0.4);
        ctx.lineTo(x2 - Math.cos(a) * h + Math.cos(a + Math.PI / 2) * h * 0.6, y2 - Math.sin(a) * h + Math.sin(a + Math.PI / 2) * h * 0.6);
        ctx.lineTo(x2 - Math.cos(a) * h - Math.cos(a + Math.PI / 2) * h * 0.6, y2 - Math.sin(a) * h - Math.sin(a + Math.PI / 2) * h * 0.6);
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    // Étiquette reliée à un point par un trait
    function callout(text, ax, ay, lx, ly, col, fs) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        const w = ctx.measureText(text).width + 14, h = fs * 1.75;
        lx = Math.max(w / 2 + 4, Math.min(cssW - w / 2 - 4, lx));
        ly = Math.max(h / 2 + 4, Math.min(cssH - h / 2 - 4, ly));
        ctx.strokeStyle = col; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ax, ay, 3, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(lx - w / 2, ly - h / 2, w, h, 7); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, lx, ly + 1);
        ctx.restore();
    }
    // Petit texte lisible (contour blanc)
    function tinyText(text, x, y, col, fs, align) {
        ctx.save();
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = col; ctx.fillText(text, x, y);
        ctx.restore();
    }
    // Loupe : un disque qui montre l'intérieur d'un organe
    function bubble(cx, cy, r, ax, ay, col, title, fn) {
        ctx.save();
        const ang = Math.atan2(ay - cy, ax - cx);
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.save(); ctx.clip(); fn(cx, cy, r); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.stroke();
        const fs = Math.max(10, Math.min(15, r * 0.17));
        const ty = cy - r - fs * 0.9 < 44 ? cy + r + fs * 0.9 : cy - r - fs * 0.9;
        tinyText('🔍 ' + title, cx, ty, col, fs);
        ctx.restore();
    }

    // ═════════════════════════ 🌱 LE CYCLE DE VIE ═════════════════════════
    const GY = 0.62, PX = 0.40, NX = 0.76;
    function geomAt(g, xN, sc) {
        const H = cssH, mm = Math.min(cssW, cssH) * sc;
        const bx = X(xN), by = Y(GY);
        const S = { x: bx, y: by + 0.06 * H * sc };
        const topFull = by - 0.34 * H * sc;
        const span = S.y - topFull;
        const grow = gg => _rpEase((gg - 0.55) / 2.6);
        const topY0 = S.y - grow(g) * span;
        const cot14 = S.y - grow(1.4) * span;
        const wk = _rpEase((g - 7.15) / 0.5);
        const hf = (S.y - topY0) / span;
        const tx = bx + Math.sin(simTime * 1.3 + xN * 7) * mm * 0.006 * hf + wk * mm * 0.09;
        const topY = topY0 + wk * H * 0.05 * sc;
        return { g, sc, mm, H, bx, by, S, topFull, span, topY0, topY, cot14, cotY: Math.max(topY0, cot14), tx, wk };
    }
    function stemPt(geo, y0) {      // point de la tige à la hauteur y0 (avant que la plante fane)
        const d0 = geo.S.y - geo.topY0;
        const t = d0 > 0 ? _rpClamp((geo.S.y - y0) / d0) : 0;
        return { x: geo.S.x + t * t * (geo.tx - geo.S.x), y: geo.S.y + t * (geo.topY - geo.S.y) };
    }
    function fruitInfo(geo, g) {
        const fz = geo.mm * 0.08;
        const fk = _rpEase((g - 5.6) / 1.2), ripe = _rpEase((g - 6.3) / 0.6);
        const r = fz * (0.13 + 0.6 * fk);
        return { x: geo.tx + fk * fz * 0.3, y: geo.topY - r * 0.7 + fk * fz * 0.25, r, col: _rpMix('#8cc152', '#d9342b', ripe), fk };
    }
    function flowerTop(geo, main) {
        const g = geo.g;
        const budK = _rpEase((g - 2.85) / 0.35);
        if (budK <= 0) return null;
        const baseAlpha = ctx.globalAlpha;
        const B = { x: geo.tx, y: geo.topY };
        const fz = geo.mm * 0.08;
        const openK = _rpEase((g - 3.15) / 0.6);
        const fall = _rpEase((g - 5.25) / 0.6);
        const info = { B, fz, openK, fall };
        // Pétales
        if (fall < 1) {
            const spread = 0.15 + 0.85 * openK;
            const L = fz * (0.55 * budK + 0.5 * openK);
            for (const i of [0, 4, 1, 3, 2]) {
                const sd = i < 2 ? -1 : 1;
                const a = (i - 2) * 0.48 * spread - Math.PI / 2;
                let x = B.x + Math.cos(a) * L * 0.5, y = B.y + Math.sin(a) * L * 0.5, rot = a;
                if (fall > 0) {
                    x += sd * fall * fz * 1.8;
                    y += fall * fall * Math.max(0, geo.by - B.y);
                    rot += sd * fall * 2.6;
                }
                ctx.globalAlpha = baseAlpha * (1 - _rpEase((fall - 0.7) / 0.3));
                ctx.fillStyle = i === 2 ? '#f48fbf' : '#ee6aa6';
                ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, L * 0.5), Math.max(0.5, L * (0.16 + 0.14 * openK)), rot, 0, 2 * Math.PI); ctx.fill();
                ctx.strokeStyle = '#c2417f'; ctx.lineWidth = 1; ctx.stroke();
                if (i === 4) info.petal = { x, y };
            }
            ctx.globalAlpha = baseAlpha;
        }
        // Étamines
        const stA = openK * (1 - _rpEase((g - 5.3) / 0.4));
        if (stA > 0.01) {
            ctx.globalAlpha = baseAlpha * stA;
            for (const j of [-0.5, -0.22, 0.22, 0.5]) {
                const a = j - Math.PI / 2;
                const ex = B.x + Math.cos(a) * fz * 0.62, ey = B.y + Math.sin(a) * fz * 0.62;
                ctx.strokeStyle = '#e2d39a'; ctx.lineWidth = Math.max(1, fz * 0.05);
                ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(ex, ey); ctx.stroke();
                ctx.fillStyle = '#f2b705';
                ctx.beginPath(); ctx.arc(ex, ey, Math.max(1.2, fz * 0.075), 0, 2 * Math.PI); ctx.fill();
            }
            ctx.globalAlpha = baseAlpha;
        }
        // Pistil
        const piA = openK * (1 - _rpEase((g - 5.7) / 0.4));
        const stig = { x: B.x, y: B.y - fz * 0.78 };
        info.stig = stig;
        if (piA > 0.01) {
            ctx.globalAlpha = baseAlpha * piA;
            ctx.strokeStyle = '#a5c96a'; ctx.lineWidth = Math.max(1.5, fz * 0.08);
            ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(stig.x, stig.y); ctx.stroke();
            ctx.fillStyle = '#c7e08a';
            ctx.beginPath(); ctx.arc(stig.x, stig.y, Math.max(1.5, fz * 0.09), 0, 2 * Math.PI); ctx.fill();
            if (main && g >= 4.72 && g < 5.7) {
                ctx.fillStyle = '#ffb300';
                for (const [dx, dy] of [[-0.07, -0.06], [0.06, -0.08], [0, -0.13]]) {
                    ctx.beginPath(); ctx.arc(stig.x + dx * fz, stig.y + dy * fz, Math.max(1.2, fz * 0.05), 0, 2 * Math.PI); ctx.fill();
                }
            }
            ctx.globalAlpha = baseAlpha;
        }
        // Ovaire, puis fruit
        if (g < 7) { const f = fruitInfo(geo, g); drawFruit(f); info.fruit = f; }
        // Sépales
        const sl = fz * (0.42 + 0.1 * budK);
        const sa = 0.3 + 0.55 * openK;
        drawLeaf(B.x, B.y, -Math.PI / 2 - sa, sl, sl * 0.35, '#4f9d3a');
        drawLeaf(B.x, B.y, -Math.PI / 2 + sa, sl, sl * 0.35, '#4f9d3a');
        return info;
    }
    function drawPlant(geo, alpha, main) {
        const g = geo.g, mm = geo.mm, S = geo.S, wk = geo.wk;
        const out = { S };
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        // Racines
        const rl = 0.20 * geo.H * geo.sc * _rpEase((g - 0.35) / 2.2);
        if (rl > 1) {
            const rw = Math.max(1.4, mm * 0.007);
            const tip = { x: S.x + mm * 0.01, y: S.y + rl };
            ctx.strokeStyle = _rpMix('#ead9b0', '#b39a6b', wk); ctx.lineWidth = rw;
            ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.quadraticCurveTo(S.x - mm * 0.012, S.y + rl * 0.5, tip.x, tip.y); ctx.stroke();
            ctx.lineWidth = rw * 0.6;
            for (let k = 0; k < 5; k++) {
                const f = 0.22 + k * 0.16;
                const L = mm * 0.075 * _rpEase((g - 1.0 - k * 0.18) / 1.6) * (1 - k * 0.13);
                if (L < 1) continue;
                const yy = S.y + rl * f, xx = S.x - mm * 0.006;
                for (const sd of [-1, 1]) {
                    ctx.beginPath(); ctx.moveTo(xx, yy);
                    ctx.quadraticCurveTo(xx + sd * L * 0.5, yy + L * 0.05, xx + sd * L, yy + L * 0.55); ctx.stroke();
                }
            }
            out.rootTip = tip;
            out.rootMid = { x: S.x + mm * 0.05, y: S.y + rl * 0.5 };
        }
        // Tige
        if (geo.topY < S.y - 1) {
            const sw = Math.max(1.6, mm * 0.012 * (0.45 + 0.55 * _rpEase((g - 1) / 2)));
            ctx.strokeStyle = _rpMix('#5f9e3b', '#9a7b4f', wk); ctx.lineWidth = sw;
            ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.quadraticCurveTo(S.x, (S.y + geo.topY) / 2, geo.tx, geo.topY); ctx.stroke();
            if (geo.topY0 < geo.by - 4) out.stemMid = stemPt(geo, (geo.by + geo.topY0) / 2);
        }
        // Graine
        const seedA = 1 - _rpEase((g - 1.15) / 0.4);
        if (seedA > 0.01) {
            const sw2 = 1 + 0.25 * _rpEase(g / 0.8);
            ctx.globalAlpha = alpha * seedA;
            drawSeed(S.x, S.y, mm * 0.024 * sw2, g > 0.6);
            ctx.globalAlpha = alpha;
            out.seed = { x: S.x + mm * 0.03, y: S.y };
        }
        // Cotylédons
        const cotA = _rpEase((g - 0.85) / 0.45) * (1 - _rpEase((g - 2.3) / 0.8));
        if (cotA > 0.01) {
            const p = stemPt(geo, geo.cotY);
            const L = mm * 0.045 * (0.6 + 0.4 * _rpEase((g - 0.9) / 0.5));
            const col = _rpMix('#c5d65a', '#d9b84a', _rpEase((g - 2.0) / 0.8));
            ctx.globalAlpha = alpha * cotA;
            drawLeaf(p.x, p.y, -0.25, L, L * 0.5, col);
            drawLeaf(p.x, p.y, Math.PI + 0.25, L, L * 0.5, col);
            ctx.globalAlpha = alpha;
            out.cot = { x: p.x + L * 0.8, y: p.y - L * 0.2 };
        }
        // Feuilles
        const reached = (geo.cot14 - geo.topY0) / (geo.cot14 - geo.topFull);
        for (let k = 0; k < 6; k++) {
            const nf = (k + 1) / 7;
            const ls = _rpEase((reached - nf) * 4);
            if (ls <= 0.02) continue;
            const p = stemPt(geo, geo.cot14 - nf * (geo.cot14 - geo.topFull));
            const sd = k % 2 ? 1 : -1;
            const len = mm * 0.09 * ls * (1 - k * 0.07);
            const ang = sd > 0 ? -0.55 + wk * 1.5 : Math.PI + 0.55 - wk * 1.5;
            drawLeaf(p.x, p.y, ang, len, len * 0.38, _rpMix('#3f9e4d', '#a8874a', wk));
            if (k === 1) out.leaf = { x: p.x + Math.cos(ang) * len * 0.7, y: p.y + Math.sin(ang) * len * 0.7 };
        }
        // Fleur, puis fruit
        out.flower = flowerTop(geo, main);
        ctx.restore();
        return out;
    }

    function drawCycleScene() {
        const m = Math.min(cssW, cssH);
        const cur = curStage(), st = RP_STAGES[cur], p = G - cur;
        const gy = Y(GY);
        const fsL = Math.max(10, Math.min(15, m / 38));

        // Ciel, collines
        const sky = ctx.createLinearGradient(0, 0, 0, gy);
        sky.addColorStop(0, '#8fc9ef'); sky.addColorStop(1, '#e3f3fb');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, cssW, gy);
        const sunP = { x: X(0.06), y: Y(0.10) };
        drawSun(sunP.x, sunP.y, m * 0.045);
        ctx.fillStyle = '#b9dca3';
        ctx.beginPath(); ctx.moveTo(0, gy);
        ctx.quadraticCurveTo(X(0.2), gy - cssH * 0.12, X(0.45), gy - cssH * 0.03);
        ctx.quadraticCurveTo(X(0.75), gy - cssH * 0.14, X(1), gy - cssH * 0.04);
        ctx.lineTo(cssW, gy); ctx.closePath(); ctx.fill();

        // Sol en coupe
        const sg = ctx.createLinearGradient(0, gy, 0, cssH);
        sg.addColorStop(0, '#9b7653'); sg.addColorStop(1, '#6e4f35');
        ctx.fillStyle = sg; ctx.fillRect(0, gy, cssW, cssH - gy);
        ctx.fillStyle = 'rgba(50,32,18,0.35)';
        for (const [px, py, pr] of PEBBLES) {
            ctx.beginPath(); ctx.arc(X(px), gy + 8 + py * (cssH - gy - 12), pr, 0, 2 * Math.PI); ctx.fill();
        }
        ctx.fillStyle = '#6ab04c'; ctx.fillRect(0, gy - 3, cssW, 6);
        ctx.strokeStyle = '#4f8f36'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 70; i++) {
            const x = (i + 0.5) * cssW / 70;
            ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + 2, gy - 5 - (i % 3) * 2); ctx.stroke();
        }

        // Vent (dissémination)
        if (cur === 7 && p > 0.3 && p < 0.92) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, m * 0.006); ctx.lineCap = 'round';
            for (let k = 0; k < 3; k++) {
                const u = (simTime * 0.35 + k * 0.33) % 1;
                const x = X(0.55 + u * 0.4), y = Y(0.2 + k * 0.09);
                ctx.globalAlpha = Math.sin(Math.PI * u);
                ctx.beginPath(); ctx.moveTo(x - m * 0.08, y); ctx.quadraticCurveTo(x, y - m * 0.03, x + m * 0.05, y);
                ctx.quadraticCurveTo(x + m * 0.08, y + m * 0.02, x + m * 0.06, y + m * 0.035); ctx.stroke();
            }
            ctx.restore();
        }

        // Plantes
        const nGeo = geomAt(Math.max(2.4, Math.min(6.8, G)), NX, 0.8);
        const nA = _rpEase((G - 2.75) / 0.4);       // l'autre plante n'apparaît qu'à la floraison
        const nOut = nA > 0.01 ? drawPlant(nGeo, nA, false) : {};
        const mGeo = geomAt(G, PX, 1);
        const plantA = cur === 7 ? 1 - _rpEase((p - 0.6) / 0.35) : 1;
        const out = plantA > 0.01 ? drawPlant(mGeo, plantA, true) : { S: mGeo.S };
        const S = mGeo.S;

        // Gouttes d'eau absorbées par la graine
        if (G < 1.3) {
            const k0 = 1 - _rpEase((G - 1) / 0.3);
            for (let k = 0; k < 7; k++) {
                const ph = (simTime * 0.35 + k / 7) % 1;
                const rad = m * 0.09 * (1 - ph) + m * 0.03;
                const a = k * 0.9 + 1;
                const x = S.x + Math.cos(a) * rad * 1.3, y = S.y + Math.sin(a) * rad * 0.8;
                if (y < gy + 4) continue;
                ctx.globalAlpha = Math.sin(Math.PI * ph) * 0.9 * k0;
                ctx.fillStyle = '#3d9be9';
                const d = Math.max(2, m * 0.008);
                ctx.beginPath(); ctx.moveTo(x, y - d * 1.6);
                ctx.quadraticCurveTo(x + d, y - d * 0.2, x, y + d * 0.8);
                ctx.quadraticCurveTo(x - d, y - d * 0.2, x, y - d * 1.6); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Besoins de la plante (croissance)
        if (cur === 2 && out.leaf) {
            ctx.globalAlpha = 0.9;
            arrow(sunP.x + m * 0.07, sunP.y + m * 0.05, out.leaf.x - m * 0.02, out.leaf.y - m * 0.02, '#f0a500', Math.max(2.5, m * 0.007), [8, 6]);
            if (out.rootMid) {
                for (let k = 0; k < 3; k++) {
                    const y = out.rootMid.y + (k - 1) * m * 0.05;
                    arrow(out.rootMid.x + m * 0.13, y + m * 0.02, out.rootMid.x + m * 0.035, y, '#3d9be9', Math.max(2, m * 0.006));
                }
            }
            ctx.globalAlpha = 1;
        }

        // L'abeille (pollinisation)
        let bee = null;
        if (cur === 4 && nOut.flower && out.flower) {
            const nf = nOut.flower.stig, mf = out.flower.stig;
            const s = m * 0.032;
            const pol = p > 0.08 && p < 0.72;
            let x, y;
            const ctrl = { x: (nf.x + mf.x) / 2, y: Math.min(nf.y, mf.y) - cssH * 0.16 };
            const quad = t => ({
                x: (1 - t) * (1 - t) * nf.x + 2 * (1 - t) * t * ctrl.x + t * t * mf.x,
                y: (1 - t) * (1 - t) * (nf.y - s * 0.6) + 2 * (1 - t) * t * ctrl.y + t * t * (mf.y - s * 0.6)
            });
            if (p < 0.18) { x = nf.x; y = nf.y - s * 0.6 + Math.sin(simTime * 7) * 2; }
            else if (p < 0.62) {
                const t = _rpEase((p - 0.18) / 0.44);
                const q = quad(t); x = q.x; y = q.y + Math.sin(t * 20) * 3;
                ctx.fillStyle = '#ffb300';
                for (let k = 1; k <= 5; k++) {
                    const q2 = quad(Math.max(0, t - k * 0.035));
                    ctx.globalAlpha = 0.7 - k * 0.12;
                    ctx.beginPath(); ctx.arc(q2.x, q2.y + s * 0.5, Math.max(1.2, s * 0.09), 0, 2 * Math.PI); ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (p < 0.85) { x = mf.x; y = mf.y - s * 0.6 + Math.sin(simTime * 7) * 2; }
            else {
                const t = _rpEase((p - 0.85) / 0.15);
                x = _rpLerp(mf.x, X(0.14), t); y = _rpLerp(mf.y - s * 0.6, Y(0.06), t);
            }
            drawBee(x, y, s, simTime * 40, pol, -1);
            bee = { x, y, s, pol };
        }

        // La dissémination
        const seedsOut = [];
        if (cur === 7) {
            const f0 = fruitInfo(mGeo, 6.99);
            const land = { x: f0.x + cssW * 0.06, y: gy - f0.r * 0.8 };
            const fallK = _rpClamp(p / 0.25);
            const fa = 1 - _rpEase((p - 0.3) / 0.15);
            if (fa > 0) {
                const fx = _rpLerp(f0.x, land.x, fallK);
                let fy = _rpLerp(f0.y, land.y, fallK * fallK);
                if (p > 0.25) fy = land.y - Math.abs(Math.sin((p - 0.25) * 25)) * f0.r * 0.4 * (1 - _rpClamp((p - 0.25) / 0.08));
                ctx.globalAlpha = fa; drawFruit({ x: fx, y: fy, r: f0.r, col: f0.col }); ctx.globalAlpha = 1;
            }
            const SEEDS = [{ tx: 0.53, h: 0.10 }, { tx: 0.63, h: 0.15 }, { tx: 0.27, h: 0.13 }, { tx: 1.08, h: 0.30, wind: true }, { tx: PX, h: 0.09, bury: true }];
            SEEDS.forEach((sd, j) => {
                if (p < 0.27) return;
                const u = _rpEase((p - 0.3 - j * 0.04) / 0.36);
                let x = _rpLerp(land.x, X(sd.tx), u);
                let y = _rpLerp(land.y, gy - 3, u) - Math.sin(Math.PI * u) * cssH * sd.h;
                let r = m * 0.016;
                if (sd.bury) {
                    const v = _rpEase((p - 0.78) / 0.2);
                    y = _rpLerp(y, S.y, v); r = _rpLerp(m * 0.016, m * 0.024, v);
                }
                drawSeed(x, y, r, false);
                seedsOut.push({ x, y, u, sd });
            });
        }

        // Loupes
        const rB = Math.min(m * 0.17, cssW * 0.15, cssH * 0.2);
        const bxB = Math.max(rB + 8, X(0.15));
        if (G < 1.05) {
            const cyB = Math.min(Y(0.81), cssH - rB - 8);
            ctx.globalAlpha = 1 - _rpEase((G - 0.8) / 0.25);
            bubble(bxB, cyB, rB, S.x - m * 0.025, S.y, '#9a6a3a', 'Dans la graine', (cx, cy, r) => {
                ctx.fillStyle = '#f6efe2'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.8, r * 0.55, 0, 0, 2 * Math.PI);
                ctx.fillStyle = '#8a5a2b'; ctx.fill();
                ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.72, r * 0.47, 0, 0, 2 * Math.PI);
                ctx.fillStyle = '#f1dfa6'; ctx.fill();
                ctx.strokeStyle = 'rgba(140,100,40,0.6)'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx + r * 0.7, cy); ctx.stroke(); ctx.setLineDash([]);
                // embryon : petite racine + deux petites feuilles
                const ex = cx - r * 0.52, ey = cy;
                ctx.fillStyle = '#e8d38a';
                ctx.beginPath(); ctx.ellipse(ex, ey + r * 0.05, r * 0.1, r * 0.2, 0.3, 0, 2 * Math.PI); ctx.fill();
                drawLeaf(ex, ey - r * 0.1, -1.9, r * 0.17, r * 0.07, '#7cbf4a');
                drawLeaf(ex, ey - r * 0.1, -1.2, r * 0.17, r * 0.07, '#7cbf4a');
                const fsT = Math.max(9, r * 0.14);
                tinyText('enveloppe', cx + r * 0.1, cy - r * 0.66, '#5a3818', fsT);
                tinyText('réserves', cx + r * 0.2, cy + r * 0.2, '#6b4e10', fsT);
                tinyText('embryon', ex + r * 0.05, cy + r * 0.38, '#3d7a1e', fsT);
            });
            ctx.globalAlpha = 1;
        }
        if (cur === 5 && out.flower) {
            const cyB = Math.max(Y(0.36), rB + 58);
            const anch = out.flower.fruit || out.flower.stig;
            bubble(bxB, cyB, rB, anch.x - 6, anch.y, '#8e5bd0', 'Dans le pistil', (cx, cy, r) => {
                ctx.fillStyle = '#fbf5ff'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                const top = cy - r * 0.62;
                const oc = { x: cx, y: cy + r * 0.36 }, orx = r * 0.42, ory = r * 0.34;
                ctx.strokeStyle = '#b6d97a'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(cx, oc.y - ory + 2); ctx.lineTo(cx, top + r * 0.06); ctx.stroke();
                ctx.fillStyle = '#d4e88e';
                for (const dx of [-0.08, 0.08]) { ctx.beginPath(); ctx.arc(cx + dx * r, top, r * 0.08, 0, 2 * Math.PI); ctx.fill(); }
                ctx.beginPath(); ctx.ellipse(oc.x, oc.y, orx, ory, 0, 0, 2 * Math.PI);
                ctx.fillStyle = '#9ccc65'; ctx.fill(); ctx.strokeStyle = '#5f8f32'; ctx.lineWidth = 2; ctx.stroke();
                ctx.beginPath(); ctx.ellipse(oc.x, oc.y, orx * 0.75, ory * 0.75, 0, 0, 2 * Math.PI);
                ctx.fillStyle = '#eef8df'; ctx.fill();
                const OV = [[-0.45, 0.25], [0.42, 0.15], [0, -0.35]].map(o => ({ x: oc.x + o[0] * orx * 0.75, y: oc.y + o[1] * ory * 0.75 }));
                const GR = [[-0.1, -0.1], [0.09, -0.12], [0, -0.2]].map(o => ({ x: cx + o[0] * r, y: top + o[1] * r * 0.5 }));
                OV.forEach((o, i) => {
                    const tk = _rpEase((p - 0.05 - i * 0.1) / 0.4);
                    const pts = [GR[i], { x: cx + (GR[i].x - cx) * 0.3, y: top + r * 0.1 }, { x: cx, y: oc.y - ory }, o];
                    // tube pollinique (tracé partiel)
                    const L = [0]; for (let q = 1; q < pts.length; q++) L.push(L[q - 1] + Math.hypot(pts[q].x - pts[q - 1].x, pts[q].y - pts[q - 1].y));
                    const d = tk * L[L.length - 1];
                    if (d > 0) {
                        ctx.strokeStyle = '#f39c12'; ctx.lineWidth = Math.max(1.5, r * 0.028);
                        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                        for (let q = 1; q < pts.length; q++) {
                            if (L[q] <= d) ctx.lineTo(pts[q].x, pts[q].y);
                            else { const u = (d - L[q - 1]) / (L[q] - L[q - 1]); ctx.lineTo(_rpLerp(pts[q - 1].x, pts[q].x, u), _rpLerp(pts[q - 1].y, pts[q].y, u)); break; }
                        }
                        ctx.stroke();
                    }
                    const fert = tk >= 1;
                    if (fert) {
                        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(simTime * 6);
                        ctx.fillStyle = '#c39bff'; ctx.beginPath(); ctx.arc(o.x, o.y, r * 0.13, 0, 2 * Math.PI); ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                    ctx.beginPath(); ctx.ellipse(o.x, o.y, r * 0.07, r * 0.055, 0.4, 0, 2 * Math.PI);
                    ctx.fillStyle = fert ? '#f3d27a' : '#fff6cf'; ctx.fill();
                    ctx.strokeStyle = '#b8963f'; ctx.lineWidth = 1.2; ctx.stroke();
                });
                ctx.fillStyle = '#f5c518';
                GR.forEach(gp => { ctx.beginPath(); ctx.arc(gp.x, gp.y, r * 0.045, 0, 2 * Math.PI); ctx.fill(); });
                const fsT = Math.max(9, r * 0.13);
                tinyText('pollen', cx + r * 0.22, top - r * 0.1, '#a06a00', fsT, 'left');
                tinyText('tube', cx + r * 0.1, cy - r * 0.2, '#c46d00', fsT, 'left');
                tinyText('ovules', cx + r * 0.4, oc.y + ory + r * 0.12, '#2f5fa8', fsT);
                tinyText('ovaire', cx - r * 0.55, oc.y - ory * 0.9, '#3d7a1e', fsT);
            });
        }
        if (cur === 6 && out.flower && out.flower.fruit) {
            const cyB = Math.max(Y(0.36), rB + 58);
            const f = out.flower.fruit;
            bubble(bxB, cyB, rB, f.x - f.r, f.y, '#d9342b', 'Dans le fruit', (cx, cy, r) => {
                ctx.fillStyle = '#fff8f3'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                const R = r * 0.66 * (0.7 + 0.3 * _rpEase(p / 0.5));
                ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
                ctx.fillStyle = _rpMix('#8cc152', '#d9342b', _rpEase((G - 6.3) / 0.6)); ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, R * 0.84, 0, 2 * Math.PI); ctx.fillStyle = '#ff9a86'; ctx.fill();
                ctx.beginPath(); ctx.arc(cx, cy, R * 0.28, 0, 2 * Math.PI); ctx.fillStyle = '#ffd3c8'; ctx.fill();
                for (let k = 0; k < 6; k++) {
                    const a = k * Math.PI / 3 + 0.3;
                    const x = cx + Math.cos(a) * R * 0.5, y = cy + Math.sin(a) * R * 0.5;
                    ctx.beginPath(); ctx.ellipse(x, y, r * 0.075, r * 0.045, a, 0, 2 * Math.PI);
                    ctx.fillStyle = '#f3e2b3'; ctx.fill(); ctx.strokeStyle = '#a0703a'; ctx.lineWidth = 1.2; ctx.stroke();
                }
                const fsT = Math.max(9, r * 0.14);
                tinyText('fruit (ancien ovaire)', cx, cy - R - fsT * 0.2 + r * 0.05, '#9e2219', fsT);
                tinyText('graines (anciens ovules)', cx, cy + R + fsT * 0.3, '#6b4e10', fsT);
            });
        }

        // Étiquettes de l'étape en cours
        if (showLabels) {
            const L = (t, a, dx, dy, col) => { if (a) callout(t, a.x, a.y, a.x + dx * m, a.y + dy * m, col || st.color, fsL); };
            const fl = out.flower;
            switch (cur) {
                case 0: L('graine', out.seed, 0.22, -0.04); break;
                case 1: L('racine', out.rootTip, 0.2, 0); L('tige', out.stemMid, 0.2, -0.02); L('cotylédons', out.cot, 0.18, -0.1); break;
                case 2:
                    L('feuilles', out.leaf, 0.16, -0.08); L('tige', out.stemMid, 0.22, 0.02); L('racines', out.rootMid, 0.2, 0.05);
                    if (out.leaf) tinyText('☀️ lumière', (sunP.x + out.leaf.x) / 2, (sunP.y + out.leaf.y) / 2 - fsL, '#a06a00', fsL);
                    if (out.rootMid) tinyText('💧 eau et sels minéraux', out.rootMid.x + m * 0.13, out.rootMid.y + m * 0.12, '#1d5fa8', fsL, 'left');
                    break;
                case 3: if (fl) L(fl.openK < 0.5 ? 'bouton' : 'fleur', fl.petal || fl.B, 0.16, -0.06); break;
                case 4:
                    if (nOut.flower) L('une autre fleur', nOut.flower.stig, -0.1, -0.14);
                    if (bee) { L('abeille', { x: bee.x, y: bee.y - bee.s * 0.4 }, 0.05, -0.1); if (bee.pol) L('pollen', { x: bee.x, y: bee.y + bee.s * 0.45 }, 0.1, 0.09, '#c99400'); }
                    if (fl && G >= 4.72) L('stigmate', fl.stig, 0.18, -0.04, '#7b4fc9');
                    break;
                case 5:
                    if (fl && fl.fruit) L('ovaire', fl.fruit, 0.18, 0.04);
                    if (fl && fl.fall > 0.08 && fl.fall < 0.95 && fl.petal) L('les pétales tombent', fl.petal, 0.14, 0.06, '#e0559a');
                    break;
                case 6: if (fl && fl.fruit) L('fruit', fl.fruit, 0.18, -0.03); break;
                case 7:
                    if (p > 0.2 && p < 0.85 && out.stemMid) L('la plante fane', out.stemMid, -0.2, -0.06, '#9a7b4f');
                    seedsOut.forEach(s => {
                        if (s.sd.wind && s.u > 0.15 && s.u < 0.85) L('le vent emporte une graine', s, -0.18, 0.1);
                        if (s.sd.tx === 0.63 && s.u >= 1 && p < 0.86) L('graines', s, 0.06, -0.12);
                        if (s.sd.bury && p > 0.86) L('une graine dans le sol', s, 0.2, 0.06, '#9a6a3a');
                    });
                    break;
            }
        }

        // Bandeau de l'étape
        const Rw = m * 0.10, ri = Rw * 0.32;
        const wcx = cssW - Rw - ri - 8, wcy = Rw + ri + 8;
        const right = showWheel ? wcx - Rw - ri - 8 : cssW - 8;
        let fsB = Math.max(12, Math.min(19, m / 26));
        const ban = `${ov ? '🔄 ' : ''}Étape ${cur + 1} sur 8 : ${st.ico} ${st.name}`;
        ctx.font = `900 ${fsB}px 'Segoe UI', system-ui, sans-serif`;
        let bw = ctx.measureText(ban).width + 22;
        const maxW = Math.max(80, right - X(0.12));
        if (bw > maxW) { fsB = Math.max(9, fsB * maxW / bw); ctx.font = `900 ${fsB}px 'Segoe UI', system-ui, sans-serif`; bw = ctx.measureText(ban).width + 22; }
        const bcx = Math.max(bw / 2 + 6, Math.min(right - bw / 2, (X(0.12) + right) / 2));
        ctx.fillStyle = 'rgba(255,255,255,0.93)'; roundRect(bcx - bw / 2, 8, bw, fsB * 1.9, 10); ctx.fill();
        ctx.strokeStyle = st.color; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ban, bcx, 8 + fsB * 0.97);

        // Roue du cycle (touchable)
        if (showWheel) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath(); ctx.arc(wcx, wcy, Rw + ri + 4, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = 'rgba(63,158,77,0.55)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(wcx, wcy, Rw, 0, 2 * Math.PI); ctx.stroke();
            // avancement
            const aG = -Math.PI / 2 + G / 8 * 2 * Math.PI;
            ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(wcx, wcy, Rw, -Math.PI / 2, aG); ctx.stroke();
            ctx.font = `900 ${Math.max(8, Rw * 0.2)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#2f6f3a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Cycle', wcx, wcy - Rw * 0.12); ctx.fillText('de vie', wcx, wcy + Rw * 0.14);
            RP_STAGES.forEach((s, i) => {
                const a = -Math.PI / 2 + (i + 0.5) / 8 * 2 * Math.PI;
                const x = wcx + Math.cos(a) * Rw, y = wcy + Math.sin(a) * Rw;
                const on = i === cur;
                ctx.beginPath(); ctx.arc(x, y, on ? ri * 1.18 : ri, 0, 2 * Math.PI);
                ctx.fillStyle = on ? s.color : '#ffffff'; ctx.fill();
                ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
                ctx.font = `${Math.max(9, ri * (on ? 1.15 : 0.95))}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
                ctx.fillStyle = '#000'; ctx.fillText(s.ico, x, y + 1);
                const hr = ri * 1.3;
                hits.push({ test: (tx, ty) => Math.hypot(tx - x, ty - y) <= hr, act: () => jumpStage(i) });
            });
            ctx.restore();
        }
    }

    // ═════════════════════════════ 🌸 LA FLEUR ═════════════════════════════
    const RP_BACK = [[0.02, -0.06], [0.16, -0.20], [0.16, -0.58], [0, -0.74], [-0.16, -0.58], [-0.16, -0.20], [-0.02, -0.06]];
    const rpInner = s => [[s * 0.04, -0.05], [s * 0.18, -0.10], [s * 0.34, -0.45], [s * 0.24, -0.66], [s * 0.12, -0.74], [s * 0.02, -0.45], [s * 0.02, -0.10]];
    const rpOuter = s => [[s * 0.06, -0.03], [s * 0.30, 0.02], [s * 0.50, -0.30], [s * 0.44, -0.52], [s * 0.36, -0.66], [s * 0.10, -0.40], [s * 0.03, -0.08]];
    const RP_ANTH = [[0.17, -0.40], [0.26, -0.31], [0.10, -0.46]];
    const RP_OVP = [[-0.38, 0.30], [0.36, 0.12], [-0.04, -0.36]];
    const RP_GR = [[-0.025, -0.528], [0.02, -0.532], [-0.002, -0.548]];

    function drawFleurScene() {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#fdf2f7'); bg.addColorStop(1, '#e7f4df');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const m = Math.min(cssW, cssH);
        const wide = cssW / cssH > 1.15;
        const ry = cssH * (wide ? 0.86 : 0.82);
        const u = Math.max(40, Math.min(cssW * (wide ? 0.62 : 0.78), (ry - 34) / 0.80));
        const cx = cssW * (wide ? 0.47 : 0.5);
        const P = (x, y) => [cx + x * u, ry + y * u];
        const fk = _rpEase((fp - 0.6) / 0.4), ripe = _rpEase((fp - 0.8) / 0.2);
        const fall = _rpEase((fp - 0.58) / 0.35);
        const stA = 1 - _rpEase((fp - 0.56) / 0.16);
        const piA = 1 - _rpEase((fp - 0.66) / 0.16);
        const dimOf = k => {
            if (!selPart || k === selPart) return 1;
            if (selPart === 'pistil' && (k === 'ovaire' || k === 'ovules')) return 1;
            return 0.28;
        };
        const fillPath = (path, fill, stroke, lw) => {
            ctx.fillStyle = fill; ctx.fill(path);
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(path); }
        };
        const glowOn = k => { if (selPart && dimOf(k) === 1) { ctx.shadowColor = RP_PARTS[k].color; ctx.shadowBlur = 16; } };
        const glowOff = () => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; };
        const pick = k => () => selectPart(selPart === k ? null : k);
        ctx.lineCap = 'round';

        // Tige et feuille
        ctx.globalAlpha = 1;
        const [sx0, sy0] = P(-0.026, 0.01);
        ctx.fillStyle = '#5f9e3b'; ctx.fillRect(sx0, sy0, 0.052 * u, cssH - sy0);
        drawLeaf(cx + 0.02 * u, ry + 0.14 * u, -0.35, 0.28 * u, 0.08 * u, '#3f9e4d');

        // Pétales (en coupe : on voit la moitié de chaque côté)
        const petalT = (s, bx, by) => (x, y) => {
            if (fall <= 0) return P(x, y);
            const a = s * fall * 1.3, c = Math.cos(a), sn = Math.sin(a);
            const dx = x - bx, dy = y - by;
            return P(bx + dx * c - dy * sn + s * fall * 0.35, by + dx * sn + dy * c + fall * fall * 1.1);
        };
        const mkPetal = (pts, T) => {
            const q = pts.map(pt => T(pt[0], pt[1]));
            const pa = new Path2D();
            pa.moveTo(q[0][0], q[0][1]);
            pa.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]);
            pa.bezierCurveTo(q[4][0], q[4][1], q[5][0], q[5][1], q[6][0], q[6][1]);
            pa.closePath();
            return pa;
        };
        const petA = 1 - _rpEase((fall - 0.7) / 0.3);
        let fallingPetal = null;
        if (petA > 0.01) {
            const list = [[mkPetal(RP_BACK, petalT(1, 0, -0.06)), '#f7a8cb']];
            for (const s of [-1, 1]) list.push([mkPetal(rpInner(s), petalT(s, s * 0.04, -0.05)), '#f286b8']);
            for (const s of [-1, 1]) list.push([mkPetal(rpOuter(s), petalT(s, s * 0.06, -0.03)), '#ee6aa6']);
            ctx.globalAlpha = petA * dimOf('petales');
            glowOn('petales');
            list.forEach(([pa, col]) => {
                fillPath(pa, col, '#c2417f', 1.5);
                if (fall < 0.05) hits.push({ test: (x, y) => pathHit(pa, x, y), act: pick('petales') });
            });
            glowOff();
            fallingPetal = petalT(1, 0.06, -0.03)(0.40, -0.47);
        }

        // Sépales et réceptacle
        ctx.globalAlpha = dimOf('sepales');
        glowOn('sepales');
        for (const s of [-1, 1]) {
            const pa = new Path2D();
            const a = P(s * 0.03, -0.02), c1 = P(s * 0.15, 0.05), t = P(s * 0.25, -0.09), c2 = P(s * 0.12, -0.075), e = P(s * 0.02, -0.05);
            pa.moveTo(a[0], a[1]); pa.quadraticCurveTo(c1[0], c1[1], t[0], t[1]); pa.quadraticCurveTo(c2[0], c2[1], e[0], e[1]); pa.closePath();
            fillPath(pa, '#4f9d3a', '#2f6f22', 1.5);
            hits.push({ test: (x, y) => pathHit(pa, x, y, 10), act: pick('sepales') });
        }
        glowOff();
        ctx.globalAlpha = 1;
        const [rcx, rcy] = P(0, -0.005);
        ctx.fillStyle = '#6aa84f'; ctx.beginPath(); ctx.ellipse(rcx, rcy, 0.075 * u, 0.04 * u, 0, 0, 2 * Math.PI); ctx.fill();

        // Étamines
        if (stA > 0.01) {
            ctx.globalAlpha = stA * dimOf('etamines');
            glowOn('etamines');
            const w = 1 - stA;
            for (const s of [-1, 1]) for (let j = 0; j < 3; j++) {
                const b = [s * 0.045, -0.035];
                const A = [s * RP_ANTH[j][0] + s * 0.06 * w, RP_ANTH[j][1] + 0.18 * w];
                const c = [b[0] + (A[0] - b[0]) * 0.25, b[1] + (A[1] - b[1]) * 0.75];
                const pb = P(b[0], b[1]), pc = P(c[0], c[1]), pA = P(A[0], A[1]);
                const fil = new Path2D(); fil.moveTo(pb[0], pb[1]); fil.quadraticCurveTo(pc[0], pc[1], pA[0], pA[1]);
                ctx.strokeStyle = '#e6d9a3'; ctx.lineWidth = Math.max(1.5, 0.013 * u); ctx.stroke(fil);
                const ang = Math.atan2(A[1] - c[1], A[0] - c[0]);
                const an = new Path2D(); an.ellipse(pA[0], pA[1], 0.042 * u, 0.02 * u, ang, 0, 2 * Math.PI);
                fillPath(an, '#f2b705', '#b8860b', 1.2);
                if (fp < 0.5) {
                    ctx.fillStyle = '#ffcf33';
                    for (const [dx, dy] of [[0.02, -0.03], [-0.03, -0.02], [0.035, 0.01]]) {
                        ctx.beginPath(); ctx.arc(pA[0] + dx * u, pA[1] + dy * u, Math.max(1, 0.007 * u), 0, 2 * Math.PI); ctx.fill();
                    }
                }
                hits.push({ test: (x, y) => pathHit(an, x, y, 14) || pathHit(fil, x, y, 14), act: pick('etamines') });
            }
            glowOff();
        }

        // Ovaire (puis fruit)
        const k = 1 + 1.7 * fk;
        const orx = 0.075 * k, ory = 0.085 * k;
        const ocy = -0.025 - ory, otop = -0.025 - 2 * ory;
        const [ox, oy] = P(0, ocy);
        const ovPath = new Path2D(); ovPath.ellipse(ox, oy, orx * u, ory * u, 0, 0, 2 * Math.PI);
        ctx.globalAlpha = dimOf('ovaire');
        glowOn('ovaire');
        fillPath(ovPath, _rpMix('#9ccc65', '#d9342b', ripe), _rpMix('#5f8f32', '#9e2219', ripe), 2);
        glowOff();
        ctx.beginPath(); ctx.ellipse(ox, oy, orx * u * 0.72, ory * u * 0.72, 0, 0, 2 * Math.PI);
        ctx.fillStyle = _rpMix('#eef8df', '#ffb3a3', ripe); ctx.fill();
        hits.push({ test: (x, y) => pathHit(ovPath, x, y), act: pick('ovaire') });

        // Style et stigmate
        if (piA > 0.01) {
            ctx.globalAlpha = piA * dimOf('pistil');
            glowOn('pistil');
            const a = P(0, otop + 0.01), b = P(0, -0.475);
            const stPath = new Path2D(); stPath.moveTo(a[0], a[1]); stPath.lineTo(b[0], b[1]);
            ctx.strokeStyle = '#b6d97a'; ctx.lineWidth = 0.026 * u; ctx.stroke(stPath);
            const sg = new Path2D();
            for (const [x, y] of [[-0.022, -0.49], [0.022, -0.49], [0, -0.512]]) {
                const q = P(x, y); sg.moveTo(q[0] + 0.022 * u, q[1]); sg.arc(q[0], q[1], 0.022 * u, 0, 2 * Math.PI);
            }
            fillPath(sg, '#d4e88e', '#8db04a', 1.5);
            glowOff();
            hits.push({ test: (x, y) => pathHit(sg, x, y, 8) || pathHit(stPath, x, y, Math.max(16, 0.05 * u)), act: pick('pistil') });
        }

        // Ovules (puis graines) et tubes polliniques
        const tubeK = [0, 1, 2].map(i => _rpEase((fp - 0.28 - i * 0.05) / 0.2));
        const ovU = RP_OVP.map(o => [o[0] * orx * 0.72, ocy + o[1] * ory * 0.72]);
        const nGr = (fp > 0.14) + (fp > 0.16) + (fp > 0.18);
        if (piA > 0.01) {
            ctx.globalAlpha = piA;
            for (let i = 0; i < nGr; i++) {
                if (tubeK[i] <= 0) continue;
                const pts = [RP_GR[i], [RP_GR[i][0] * 0.3, -0.47], [0, otop + 0.02], ovU[i]].map(q => P(q[0], q[1]));
                const L = [0]; for (let q = 1; q < pts.length; q++) L.push(L[q - 1] + Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]));
                const d = tubeK[i] * L[L.length - 1];
                ctx.strokeStyle = '#f39c12'; ctx.lineWidth = Math.max(1.5, 0.008 * u);
                ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
                for (let q = 1; q < pts.length; q++) {
                    if (L[q] <= d) ctx.lineTo(pts[q][0], pts[q][1]);
                    else { const t = (d - L[q - 1]) / (L[q] - L[q - 1]); ctx.lineTo(_rpLerp(pts[q - 1][0], pts[q][0], t), _rpLerp(pts[q - 1][1], pts[q][1], t)); break; }
                }
                ctx.stroke();
            }
        }
        ovU.forEach(([ux, uy], i) => {
            const [x, y] = P(ux, uy);
            const r = 0.02 * u * (1 + 1.3 * fk);
            const fert = tubeK[i] >= 1;
            if (fert && fp < 0.64) {
                ctx.globalAlpha = 0.35 + 0.25 * Math.sin(simTime * 6);
                ctx.fillStyle = '#c39bff'; ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, 2 * Math.PI); ctx.fill();
            }
            ctx.globalAlpha = dimOf('ovules');
            glowOn('ovules');
            const pa = new Path2D(); pa.ellipse(x, y, r, r * 0.8, 0.4, 0, 2 * Math.PI);
            fillPath(pa, fk > 0 ? _rpMix('#f3d27a', '#a0703a', ripe) : fert ? '#f3d27a' : '#fff6cf', '#b8963f', 1.2);
            glowOff();
            hits.push({ test: (tx, ty) => Math.hypot(tx - x, ty - y) <= Math.max(r * 1.6, 12), act: pick('ovules') });
        });
        // grains de pollen sur le stigmate
        if (piA > 0.01) {
            ctx.globalAlpha = piA;
            for (let i = 0; i < nGr; i++) {
                const [x, y] = P(RP_GR[i][0], RP_GR[i][1]);
                ctx.beginPath(); ctx.arc(x, y, Math.max(2, 0.014 * u), 0, 2 * Math.PI);
                ctx.fillStyle = '#f5c518'; ctx.fill(); ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;

        // L'abeille
        if (fp > 0.03 && fp < 0.27) {
            const S0 = P(0.95, -0.95), L0 = P(0.075, -0.585), E0 = P(0.95, -1.05);
            let bx, by, dir;
            if (fp < 0.12) {
                const t = _rpEase((fp - 0.03) / 0.09);
                bx = _rpLerp(S0[0], L0[0], t); by = _rpLerp(S0[1], L0[1], t) - Math.sin(Math.PI * t) * 0.1 * u; dir = -1;
            } else if (fp < 0.2) { bx = L0[0]; by = L0[1] + Math.sin(simTime * 8) * 2; dir = -1; }
            else { const t = _rpEase((fp - 0.2) / 0.07); bx = _rpLerp(L0[0], E0[0], t); by = _rpLerp(L0[1], E0[1], t); dir = 1; }
            drawBee(bx, by, 0.065 * u, simTime * 40, fp < 0.19, dir);
        }

        // Étiquettes
        if (showLabels) {
            const fsL = Math.max(10, Math.min(15, m / 36));
            const Lb = (t, ax, ay, lx, ly, col) => { const a = P(ax, ay), l = P(lx, ly); callout(t, a[0], a[1], l[0], l[1], col, fsL); };
            const RX = 0.62, LX = -0.62, C = RP_PARTS;
            if (fp < 0.6) {
                if (petA > 0.5) Lb('pétale', 0.40, -0.47, RX, -0.68, C.petales.color);
                if (stA > 0.5) Lb('étamine ♂', 0.26, -0.31, RX, -0.42, C.etamines.color);
                Lb('ovule ♀', ovU[1][0], ovU[1][1], RX, -0.16, C.ovules.color);
                if (piA > 0.5) {
                    Lb('stigmate ♀', -0.03, -0.50, LX, -0.64, C.pistil.color);
                    Lb('style ♀', 0, -0.36, LX, -0.44, C.pistil.color);
                }
                Lb('ovaire ♀', -orx * 0.9, ocy, LX, -0.12, C.ovaire.color);
                if (nGr > 0 && fp < 0.3) Lb('grains de pollen', RP_GR[2][0], RP_GR[2][1], LX * 0.7, -0.82, C.etamines.color);
                if (fp >= 0.3) Lb('tube pollinique', 0.005, -0.3, LX, -0.28, '#e67e22');
            } else {
                Lb('fruit (ancien ovaire)', orx * 0.95, ocy, RX, ocy - 0.12, '#d9342b');
                Lb('graines (anciens ovules)', ovU[0][0], ovU[0][1], LX, ocy + 0.04, '#a0703a');
                if (fall > 0.05 && fall < 0.9 && fallingPetal) callout('les pétales tombent', fallingPetal[0], fallingPetal[1], fallingPetal[0] + 0.18 * u, fallingPetal[1] - 0.1 * u, C.petales.color, fsL);
                if (stA > 0.05 && stA < 0.95) Lb('les étamines fanent', 0.26, -0.25, RX, -0.42, C.etamines.color);
            }
            Lb('sépale', 0.2, -0.065, RX, 0.04, C.sepales.color);
        }

        // Étape en cours (en haut)
        const ph = fPhase();
        const fsB = Math.max(12, Math.min(18, m / 28));
        ctx.font = `900 ${fsB}px 'Segoe UI', system-ui, sans-serif`;
        const ban = `${ph.ico} ${ph.name}`;
        const bw = ctx.measureText(ban).width + 22;
        ctx.fillStyle = 'rgba(255,255,255,0.93)'; roundRect(10, 8, bw, fsB * 1.9, 10); ctx.fill();
        ctx.strokeStyle = '#e0559a'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(ban, 21, 8 + fsB * 0.97);
    }

    // ═══════════════════════════ 🫘 LA GERMINATION ═══════════════════════════
    function drawSprout(sx, cy, jarW, jarH, d, P) {
        const dark = !P.lumiere;
        const rk = _rpEase((d - 1.4) / 2.5);
        ctx.lineCap = 'round';
        if (rk > 0) {
            ctx.strokeStyle = '#efe0bd'; ctx.lineWidth = Math.max(1.2, jarW * 0.018);
            ctx.beginPath(); ctx.moveTo(sx, cy);
            ctx.quadraticCurveTo(sx - jarW * 0.03, cy + jarH * 0.1 * rk, sx + jarW * 0.01, cy + jarH * 0.17 * rk); ctx.stroke();
        }
        const gk = _rpEase((d - 2.4) / 6);
        if (gk <= 0) return;
        const pale = dark ? _rpEase((d - 3.5) / 3) : 0;
        const hgt = jarH * (dark ? 0.78 : 0.5) * gk;
        const tx = sx + Math.sin(sx * 0.7) * jarW * 0.04 * gk, ty = cy - hgt;
        ctx.strokeStyle = _rpMix('#5f9e3b', '#e3d27a', pale); ctx.lineWidth = Math.max(1.2, jarW * (dark ? 0.014 : 0.024));
        ctx.beginPath(); ctx.moveTo(sx, cy); ctx.quadraticCurveTo(sx, cy - hgt * 0.5, tx, ty); ctx.stroke();
        const ch = Math.min(hgt, jarH * 0.12);
        const t = ch / hgt;
        const cp = { x: sx + (tx - sx) * t * t, y: cy - ch };
        const cl = jarW * 0.075, ccol = _rpMix('#c5d65a', '#efe3a0', pale);
        drawLeaf(cp.x, cp.y, -0.3, cl, cl * 0.5, ccol);
        drawLeaf(cp.x, cp.y, Math.PI + 0.3, cl, cl * 0.5, ccol);
        const lk = _rpEase((gk - 0.3) / 0.45);
        if (lk > 0 && hgt > jarH * 0.13) {
            const ll = jarW * 0.16 * lk * (dark ? 0.45 : 1), lc = _rpMix('#3f9e4d', '#e9dc85', pale);
            drawLeaf(tx, ty, -0.7, ll, ll * 0.42, lc);
            drawLeaf(tx, ty, Math.PI + 0.7, ll, ll * 0.42, lc);
        }
    }
    function drawPot(i, x0, y0, w, h) {
        const P = pots[i];
        const ok = _rpPotOk(P);
        const fsT = Math.max(11, Math.min(17, w / 10));
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${fsT}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillStyle = '#1f2937';
        ctx.fillText('Pot ' + 'ABCD'[i], x0 + w / 2, y0 + fsT * 0.8);
        const sub = _rpPotText(P);
        let fsS = Math.max(9, fsT * 0.72);
        ctx.font = `italic 700 ${fsS}px 'Segoe UI', system-ui, sans-serif`;
        while (fsS > 8 && ctx.measureText(sub).width > w - 8) { fsS -= 0.5; ctx.font = `italic 700 ${fsS}px 'Segoe UI', system-ui, sans-serif`; }
        ctx.fillStyle = '#6b7280';
        ctx.fillText(sub, x0 + w / 2, y0 + fsT * 2.05);

        const chipH = Math.max(26, Math.min(36, h * 0.09));
        const chipsH = chipH * 2 + 6;
        const headH = fsT * 2.8;
        const availH = Math.max(40, h - headH - chipsH - fsT * 1.6 - 12);
        const jarH = Math.max(30, Math.min(availH * 0.72, w * 0.95));
        const jarW = Math.max(26, Math.min(w * 0.7, jarH * 0.85));
        const jx = x0 + (w - jarW) / 2, jy = y0 + headH + (availH - jarH);
        const cy = jy + jarH * 0.76;

        // réfrigérateur
        if (!P.chaleur) {
            ctx.fillStyle = '#dff1ff'; roundRect(jx - 10, jy - Math.min(availH - jarH, jarH * 0.5) - 4, jarW + 20, jarH + Math.min(availH - jarH, jarH * 0.5) + 14, 10); ctx.fill();
            ctx.strokeStyle = '#9cc9ea'; ctx.lineWidth = 2; ctx.stroke();
            tinyText('❄️ 4 °C', jx + jarW / 2, jy - Math.min(availH - jarH, jarH * 0.5) + fsS * 0.6, '#1d5fa8', fsS);
        }
        // verre (fond)
        ctx.fillStyle = 'rgba(225,240,250,0.6)'; roundRect(jx, jy, jarW, jarH, 8); ctx.fill();
        // coton
        ctx.fillStyle = P.eau || !P.air ? '#dde8f1' : '#fbfbf5';
        ctx.beginPath(); ctx.moveTo(jx + 3, jy + jarH - 4);
        const nb = 6;
        for (let k = 0; k <= nb; k++) {
            const x = jx + 3 + (jarW - 6) * k / nb;
            ctx.lineTo(x, cy + (k % 2 ? 2 : -2));
        }
        ctx.lineTo(jx + jarW - 3, jy + jarH - 4); ctx.closePath(); ctx.fill();
        if (P.eau || !P.air) {
            ctx.fillStyle = 'rgba(61,155,233,0.5)';
            for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(jx + jarW * (0.1 + k * 0.11), cy + jarH * 0.08 + (k % 2) * jarH * 0.06, 1.6, 0, 2 * Math.PI); ctx.fill(); }
        }
        // graines et plantules
        for (let k = 0; k < 3; k++) {
            const sx = jx + jarW * (0.24 + 0.26 * k);
            const d = Math.max(0, day + (k === 1 ? -0.3 : k === 2 ? 0.2 : 0));
            const sr = jarW * 0.075 * (1 + ((P.eau || !P.air) ? 0.2 * _rpEase(day / 1.5) : 0));
            if (ok) drawSprout(sx, cy - sr * 0.3, jarW, jarH, d, P);
            ctx.globalAlpha = ok ? 1 - 0.4 * _rpEase((d - 4) / 4) : 1;
            drawSeed(sx, cy - sr * 0.35, sr, ok && d > 1.2);
            ctx.globalAlpha = 1;
        }
        // eau (pas d'air)
        if (!P.air) {
            const wy = jy + jarH * 0.3;
            ctx.fillStyle = 'rgba(70,150,225,0.38)';
            ctx.beginPath(); ctx.moveTo(jx + 2, wy);
            for (let x = 0; x <= jarW - 4; x += 5) ctx.lineTo(jx + 2 + x, wy + 1.5 * Math.sin(x * 0.2 + simTime * 2));
            ctx.lineTo(jx + jarW - 2, jy + jarH - 2); ctx.lineTo(jx + 2, jy + jarH - 2); ctx.closePath(); ctx.fill();
        }
        // verre (bord)
        ctx.strokeStyle = '#7fa6bf'; ctx.lineWidth = 2.5; roundRect(jx, jy, jarW, jarH, 8); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(jx + jarW * 0.12, jy + jarH * 0.12); ctx.lineTo(jx + jarW * 0.12, jy + jarH * 0.6); ctx.stroke();
        // dans le noir
        if (!P.lumiere) {
            const top = jy - (availH - jarH);
            ctx.fillStyle = 'rgba(15,15,40,0.42)'; roundRect(jx - 6, top, jarW + 12, jy + jarH + 6 - top, 10); ctx.fill();
            tinyText('🌑 dans le noir', jx + jarW / 2, top + fsS * 0.9, '#2a2440', fsS);
        }
        // résultat
        const ry2 = jy + jarH + fsT * 0.8;
        if (day >= 2.5) {
            const dark6 = !P.lumiere && day >= 6;
            tinyText(ok ? (dark6 ? '🌱 germe (plantule pâle)' : '🌱 les graines germent') : '❌ pas de germination', x0 + w / 2, ry2, ok ? '#2e7d32' : '#c0392b', Math.max(9, fsS));
        } else {
            tinyText('⏳ on attend…', x0 + w / 2, ry2, '#6b7280', Math.max(9, fsS));
        }
        // pastilles (touchables)
        const chipsW = Math.min(w - 10, Math.max(jarW * 1.35, 110));
        const cw = (chipsW - 6) / 2;
        const cx0 = x0 + (w - chipsW) / 2, cy0 = y0 + h - chipsH - 4;
        RP_POT_KEYS.forEach(([key, ico, lbl], q) => {
            const x = cx0 + (q % 2) * (cw + 6), y = cy0 + Math.floor(q / 2) * (chipH + 6);
            const on = !!P[key];
            ctx.fillStyle = on ? '#e3f4e6' : '#f1f1f1';
            roundRect(x, y, cw, chipH, 9); ctx.fill();
            ctx.strokeStyle = on ? '#3f9e4d' : '#c4c4c4'; ctx.lineWidth = 2; ctx.stroke();
            const fsC = Math.max(10, Math.min(15, chipH * 0.42));
            ctx.font = `800 ${fsC}px 'Segoe UI', system-ui, sans-serif`;
            const txt = cw > 78 ? `${ico} ${lbl}` : ico;
            ctx.fillStyle = on ? '#1f5130' : '#9ca3af';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.globalAlpha = on ? 1 : 0.55;
            ctx.fillText(txt, x + cw / 2, y + chipH / 2 + 1);
            ctx.globalAlpha = 1;
            if (!on) {
                ctx.strokeStyle = '#d9342b'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x + 8, y + chipH - 7); ctx.lineTo(x + cw - 8, y + 7); ctx.stroke();
            }
            hits.push({ test: (tx, ty) => tx >= x - 3 && tx <= x + cw + 3 && ty >= y - 3 && ty <= y + chipH + 3, act: () => togglePot(i, key) });
        });
    }
    function drawGermScene() {
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#f4f8fb'); bg.addColorStop(1, '#e4ecf1');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const m = Math.min(cssW, cssH);
        const fsB = Math.max(13, Math.min(20, m / 24));
        ctx.font = `900 ${fsB}px 'Segoe UI', system-ui, sans-serif`;
        const ban = `📅 Jour ${Math.floor(day)}`;
        const bw = ctx.measureText(ban).width + 26;
        ctx.fillStyle = '#ffffff'; roundRect(cssW / 2 - bw / 2, 8, bw, fsB * 1.9, 10); ctx.fill();
        ctx.strokeStyle = '#3f9e4d'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(ban, cssW / 2, 8 + fsB * 0.97);
        const cols = cssW / cssH < 0.85 ? 2 : 4, rowsN = 4 / cols;
        const top = 16 + fsB * 1.9, bottom = 22;
        const cellW = cssW / cols, cellH = (cssH - top - bottom) / rowsN;
        for (let i = 0; i < 4; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            if (col > 0) {
                ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(col * cellW, top + row * cellH + 10); ctx.lineTo(col * cellW, top + (row + 1) * cellH - 10); ctx.stroke();
            }
            drawPot(i, col * cellW + 4, top + row * cellH, cellW - 8, cellH);
        }
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.setLineDash([]);
        hits = [];
        if (mode === 'cycle') drawCycleScene();
        else if (mode === 'fleur') drawFleurScene();
        else drawGermScene();
        ctx.globalAlpha = 1;
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function stepsList(cur) {
        return `<ol class="rp-steps">${RP_STAGES.map((s, i) =>
            `<li><button data-stage="${i}" class="${!ov && cur === i ? 'on' : ''}" style="--st-c:${s.color}">${i + 1}. ${s.ico} ${s.name}</button></li>`).join('')}
            <li><button data-stage="-1" class="${ov ? 'on' : ''}" style="--st-c:#2f6f3a">🔄 Vue d'ensemble</button></li></ol>`;
    }
    function partsList() {
        return `<ol class="rp-steps">${RP_PART_ORDER.map(k => {
            const p = RP_PARTS[k];
            return `<li><button data-part="${k}" class="${selPart === k ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}</button></li>`;
        }).join('')}<li><button data-part="" class="${!selPart ? 'on' : ''}" style="--st-c:#2f6f3a">🔄 Toute la fleur</button></li></ol>`;
    }
    function updateInfo() {
        const cur = curStage();
        if (document.activeElement !== tlSl) tlSl.value = Math.round(G * 100);
        tlVal.textContent = `${cur + 1}. ${RP_STAGES[cur].ico}`;
        if (document.activeElement !== fpSl) fpSl.value = Math.round(fp * 100);
        fpVal.textContent = `${fPhase().ico} ${Math.round(fp * 100)} %`;
        if (document.activeElement !== daySl) daySl.value = day.toFixed(1);
        dayVal.textContent = 'Jour ' + Math.floor(day);
        row2.querySelectorAll('.rp-stage-btn').forEach(b => b.classList.toggle('on', !ov && Number(b.dataset.stage) === cur));
        row2.querySelectorAll('.rp-part-btn').forEach(b => b.classList.toggle('on', b.dataset.part === selPart));

        let key;
        if (mode === 'cycle') key = 'c|' + (ov ? -1 : cur);
        else if (mode === 'fleur') key = 'f|' + selPart + '|' + fPhaseIdx();
        else key = 'g|' + JSON.stringify(pots) + '|' + (day < 1 ? 0 : day < 2.5 ? 1 : day < 6 ? 2 : 3);
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        if (mode === 'cycle') {
            if (ov) {
                side.style.borderLeftColor = '#3f9e4d';
                side.innerHTML = `<h4>Le cycle de vie d'une plante</h4>
                    <div class="rp-status">🔄 <span style="color:#2f6f3a">De la graine à la graine</span></div>
                    <p class="rp-text">${RP_OVERVIEW.text}</p>
                    <p class="rp-change">✂️ ${RP_OVERVIEW.other}</p>
                    <p class="rp-know">💡 <b>Le savais-tu ?</b> ${RP_OVERVIEW.know}</p>
                    ${stepsList(cur)}`;
            } else {
                const s = RP_STAGES[cur];
                side.style.borderLeftColor = s.color;
                side.innerHTML = `<h4>Étape ${cur + 1} sur ${RP_STAGES.length}</h4>
                    <div class="rp-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <p class="rp-change">🔎 ${s.change}</p>
                    <p class="rp-text">${s.text}</p>
                    <p class="rp-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${stepsList(cur)}`;
            }
        } else if (mode === 'fleur') {
            const ph = fPhase();
            const phBox = `<p class="rp-change">${ph.ico} <b>${ph.name}</b><br><span style="font-weight:600">${ph.text}</span></p>`;
            if (!selPart) {
                side.style.borderLeftColor = '#e0559a';
                side.innerHTML = `<h4>La fleur</h4>
                    <div class="rp-status">🌸 <span style="color:#e0559a">L'organe de reproduction</span></div>
                    ${phBox}
                    <p class="rp-text">${RP_FLEUR_OVERVIEW.text}</p>
                    <p class="rp-know">💡 <b>Le savais-tu ?</b> ${RP_FLEUR_OVERVIEW.know}</p>
                    ${partsList()}`;
            } else {
                const p = RP_PARTS[selPart];
                side.style.borderLeftColor = p.color;
                side.innerHTML = `<h4>La fleur</h4>
                    <div class="rp-status">${p.ico} <span style="color:${p.color}">${p.name}</span></div>
                    ${p.sexe ? `<span class="rp-badge" style="background:${p.color}">${p.sexe}</span>` : ''}
                    <p class="rp-change">🎯 Leur rôle : ${p.role}.</p>
                    <p class="rp-text">${p.text}</p>
                    <p class="rp-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    ${phBox}
                    ${partsList()}`;
            }
        } else {
            side.style.borderLeftColor = '#9a6a3a';
            const yes = '<span style="color:#2e7d32">✓</span>', no = '<span style="color:#c0392b">✗</span>';
            const list = pots.map((P, i) => {
                const ok = _rpPotOk(P);
                const cond = RP_POT_KEYS.map(([k, ico]) => `${ico}${P[k] ? yes : no}`).join(' ');
                const res = day < 2.5 ? '<span class="wait">⏳ rien pour l\'instant</span>'
                    : ok ? `<span class="ok">🌱 ${!P.lumiere && day >= 6 ? 'germe, mais la plantule est pâle et fine' : 'les graines germent'}</span>`
                    : '<span class="ko">❌ les graines ne germent pas</span>';
                return `<li><b>Pot ${'ABCD'[i]}</b> : ${cond}<br>${res}</li>`;
            }).join('');
            let concl;
            if (day < 1) concl = `<p class="rp-change">🤔 <b>Fais une prédiction</b> avant de lancer : dans quels pots les graines vont-elles germer ? Pourquoi ?</p>`;
            else if (day < 6) concl = `<p class="rp-change">👀 Observe les pots jour après jour. Compare un pot où il manque quelque chose avec le pot A, qui a tout.</p>`;
            else concl = `<p class="rp-change">✅ <b>Conclusion</b> : pour germer, une graine a besoin d'<b>eau</b>, d'<b>air</b> et d'une <b>température douce</b>. La <b>lumière</b> n'est pas nécessaire pour germer, mais la jeune plante en a besoin ensuite pour fabriquer sa nourriture et rester verte.</p>`;
            side.innerHTML = `<h4>La germination</h4>
                <div class="rp-status">🫘 <span style="color:#9a6a3a">L'expérience des 4 pots</span></div>
                <p class="rp-text">Dans chaque pot, on pose 3 graines de haricot sur du coton. On change une seule condition à la fois : c'est la règle d'une bonne expérience !</p>
                <ul class="rp-pots">${list}</ul>
                ${concl}
                <p class="rp-know">💡 <b>Le savais-tu ?</b> C'est pour cela que l'on conserve les graines au sec et au frais : sans eau, elles ne germent pas et peuvent se garder plusieurs années.</p>`;
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
            simTime += rdt;
            if (mode === 'cycle') { G += rdt / (fast ? 4 : 9); if (G >= 8) G -= 8; }
            else if (mode === 'fleur') { fp += rdt / (fast ? 5 : 12); if (fp >= 1) { fp = 1; setPlaying(false); } }
            else { day += rdt * (fast ? 1.6 : 0.7); if (day >= 12) { day = 12; setPlaying(false); } }
        }
        draw();
        if (playing) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        if (playing) {
            if (mode === 'fleur' && fp >= 1) fp = 0;
            if (mode === 'germ' && day >= 12) day = 0;
        }
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        if (playing) startLoop();
        else if (typeof saveBoard === 'function') saveBoard();
    }
    function setFast(v) {
        fast = !!v;
        speedBtn.textContent = fast ? '🐇 Rapide' : '🐢 Lent';
        speedBtn.classList.toggle('on', fast);
    }
    function jumpStage(i) {
        if (i < 0) { ov = true; lastInfoKey = ''; requestDraw(); return; }
        i = Math.max(0, Math.min(7, i));
        ov = false;
        G = playing ? i + 0.001 : i + RP_STAGES[i].rep;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function selectPart(k) {
        selPart = k && RP_PARTS[k] ? k : null;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function togglePot(i, key) {
        const P = pots[i];
        P[key] = P[key] ? 0 : 1;
        if (key === 'air' && !P.air) P.eau = 1;     // sous l'eau : il y a forcément de l'eau
        if (key === 'eau' && !P.eau) P.air = 1;     // coton sec : les graines sont à l'air
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function setMode(m) {
        mode = m === 'fleur' || m === 'germ' ? m : 'cycle';
        container.dataset.mode = mode;
        header.querySelectorAll('.rp-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (playing) setPlaying(false);
        hint.textContent = mode === 'cycle'
            ? 'Touche une étape sur la roue ou utilise ◀ Étape ▶ · ▶ Lecture pour voir la plante grandir'
            : mode === 'fleur'
                ? 'Touche une partie de la fleur pour l\'expliquer · ▶ Lecture : pollinisation, fécondation, fruit'
                : 'Touche les pastilles 💧 🌡️ 💨 ☀️ sous chaque pot · ▶ Lecture fait passer les jours';
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
        else if (mode === 'fleur' && selPart) selectPart(null);
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
        const b = e.target.closest('button[data-stage],button[data-part]');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.stage !== undefined) jumpStage(Number(b.dataset.stage));
        else selectPart(b.dataset.part || null);
    });

    header.querySelectorAll('.rp-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); if (typeof saveBoard === 'function') saveBoard(); });
    $('.rp-prev').addEventListener('click', () => { const c = curStage(); jumpStage(ov ? c : (c <= 0 ? 7 : c - 1)); });
    $('.rp-next').addEventListener('click', () => { const c = curStage(); jumpStage(ov ? c : (c >= 7 ? 0 : c + 1)); });
    $('.rp-all').addEventListener('click', () => { jumpStage(-1); if (typeof saveBoard === 'function') saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    wheelBtn.addEventListener('click', () => { showWheel = !showWheel; wheelBtn.classList.toggle('on', showWheel); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    row2.querySelectorAll('.rp-stage-btn').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.stage);
        jumpStage(!ov && curStage() === i ? -1 : i);
    }));
    row2.querySelectorAll('.rp-part-btn').forEach(b => b.addEventListener('click', () => selectPart(selPart === b.dataset.part ? null : b.dataset.part)));
    $('.rp-part-all').addEventListener('click', () => selectPart(null));
    row1.querySelectorAll('.rp-fp').forEach(b => b.addEventListener('click', () => {
        if (playing) setPlaying(false);
        fp = Number(b.dataset.fp);
        lastInfoKey = ''; requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }));
    row1.querySelectorAll('.rp-exp').forEach(b => b.addEventListener('click', () => {
        if (playing) setPlaying(false);
        pots = RP_EXP[b.dataset.exp].map(o => Object.assign({}, o));
        day = 0;
        lastInfoKey = ''; requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }));
    $('.rp-day0').addEventListener('click', () => {
        if (playing) setPlaying(false);
        day = 0; lastInfoKey = ''; requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    });
    tlSl.addEventListener('input', () => { G = Math.max(0, Math.min(7.99, Number(tlSl.value) / 100)); requestDraw(); });
    tlSl.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });
    fpSl.addEventListener('input', () => { if (playing) setPlaying(false); fp = Number(fpSl.value) / 100; requestDraw(); });
    fpSl.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });
    daySl.addEventListener('input', () => { if (playing) setPlaying(false); day = Number(daySl.value); requestDraw(); });
    daySl.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });

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
            window._wfMiniBarCollapse(widget, '🌱 La reproduction des plantes', {
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
    setMode('cycle');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._rpGetData = () => ({
        containerW: contW, containerH: contH,
        mode, G: Math.round(G * 1000) / 1000, ov, part: selPart, fp: Math.round(fp * 1000) / 1000,
        pots: pots.map(P => Object.assign({}, P)), day: Math.round(day * 10) / 10,
        showLabels, showWheel, fast
    });
    widget._rpSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.G === 'number') G = Math.max(0, Math.min(7.99, d.G));
        if (typeof d.ov === 'boolean') ov = d.ov;
        selPart = d.part && RP_PARTS[d.part] ? d.part : null;
        if (typeof d.fp === 'number') fp = Math.max(0, Math.min(1, d.fp));
        if (Array.isArray(d.pots) && d.pots.length === 4) {
            pots = d.pots.map(P => ({ eau: P.eau ? 1 : 0, chaleur: P.chaleur ? 1 : 0, air: P.air ? 1 : 0, lumiere: P.lumiere ? 1 : 0 }));
        }
        if (typeof d.day === 'number') day = Math.max(0, Math.min(12, d.day));
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showWheel === 'boolean') { showWheel = d.showWheel; wheelBtn.classList.toggle('on', showWheel); }
        setFast(!!d.fast);
        setMode(d.mode || 'cycle');
    };

    // Sur téléphone et tablette, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfAutoMaxPhoneTablet(widget, () => wfMax.click(), () => _isMax, '_rpSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
