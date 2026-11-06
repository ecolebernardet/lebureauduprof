// ── Téléphone / tablette : aides partagées (définies une seule fois) ─────
if (!window._wfIsPhone) {
    window._wfIsPhone = function () {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia((window.PHONE_MEDIA_QUERY || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)')).matches);
    };
}
// Plein écran automatique (bouton vert) sur téléphone ET tablette.
// Mêmes conditions que board.js et style-phone.css.
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

// =========================================================================
// LEÇON EMC — LES INSTITUTIONS DE LA FRANCE — Le Bureau du Prof
// Pour des élèves de CM1 – CM2. Quatre onglets :
//  🏛️ Qui fait quoi ?   : le schéma des institutions (citoyens, Président,
//     Premier ministre, gouvernement, Assemblée nationale, Sénat, Conseil
//     constitutionnel, justice) rangées dans les 3 pouvoirs. On touche une
//     institution pour afficher sa fiche : combien, comment elle est choisie,
//     pour combien de temps, où elle siège, son rôle.
//  🗳️ Qui choisit qui ?  : les élections et les nominations, étape par
//     étape, avec des flèches animées (vote direct, vote des grands
//     électeurs, nominations, contre-pouvoirs).
//  📜 Le voyage d'une loi : de l'idée à la loi qui s'applique (Assemblée,
//     Sénat, navette, Conseil constitutionnel, promulgation), avec un
//     exemple réel : la loi sur le téléphone portable à l'école (2018).
//  ❓ Quiz : 10 questions tirées au sort, avec la correction expliquée.
// Une fiche à droite donne l'explication et un « Le savais-tu ? ».
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer, tolérance de tremblement sur les « taps », grands boutons.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard(),
//   window._wfMiniBarCollapse (lecon-geo-monde.js), style des boutons .wf-btn
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    if (document.getElementById('ifr-style')) return;
    const s = document.createElement('style');
    s.id = 'ifr-style';
    s.textContent = `
        .widget[data-type="institutions-france"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .widget[data-type="institutions-france"]:has(.ifr-container.wf-fullboard) { transform: none !important; }
        .ifr-container {
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
        .ifr-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .ifr-container.wf-fullboard {
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

        /* ── Barre du haut (même style que les autres leçons) ── */
        .ifr-header {
            display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: nowrap;
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; min-width: 0; max-width: calc(100% + 32px);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .ifr-container.wf-fullboard .ifr-header { margin-left: -50px; padding-left: 64px; }
        .ifr-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            min-width: 0; flex: 0 1 auto; pointer-events: none;
        }
        .ifr-tabs { display: inline-flex; gap: 6px; margin-left: 6px; flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .ifr-tab {
            border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; touch-action: manipulation;
            white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis;
        }
        .ifr-tab:hover { background: rgba(255,255,255,.1); }
        .ifr-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; }
        .ifr-tab-short { display: none; }
        .ifr-container.ifr-narrow .ifr-tab-long { display: none; }
        .ifr-container.ifr-narrow .ifr-tab-short { display: inline; }
        .ifr-container.ifr-tiny .ifr-title { display: none; }
        .ifr-tab-ico { display: none; }
        .ifr-container.ifr-micro .ifr-tab-short, .ifr-container.ifr-micro .ifr-tab-long { display: none; }
        .ifr-container.ifr-micro .ifr-tab-ico { display: inline; }
        .ifr-container.ifr-micro .ifr-tab { padding: 3px 10px; font-size: 15px; }
        .ifr-header .wf-btns { gap: 8px; flex-shrink: 0; }
        .ifr-header .wf-btn { width: 18px; height: 18px; }
        .ifr-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .ifr-help-btn:hover { background: rgba(255,255,255,.28); }

        /* ── Barres de commandes ── */
        .ifr-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .ifr-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            touch-action: manipulation; white-space: nowrap;
        }
        .ifr-btn:hover { background: #e0e0e0; }
        .ifr-btn:active { transform: scale(0.96); }
        .ifr-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .ifr-btn-guide.on { background: #6fb78f; border-color: #6fb78f; }
        .ifr-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .ifr-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .ifr-item-btn { padding: 5px 9px; border-left: 4px solid var(--it-c, #bbb); }
        .ifr-item-btn.on { background: var(--it-c, #3b8fd9); border-color: var(--it-c, #3b8fd9); color: #fff; }

        /* ── Corps ── */
        .ifr-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .ifr-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #f3f6fb;
        }
        .ifr-scene { position: absolute; inset: 0; display: none; }
        .ifr-scene.show { display: block; }
        .ifr-scene svg { display: block; width: 100%; height: 100%; touch-action: manipulation; }
        .ifr-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: #6b7280; pointer-events: none; padding: 0 8px;
        }
        .ifr-side {
            flex: 0 0 31%; min-width: 240px; max-width: 400px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3b8fd9;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .ifr-side h4 { margin: 0 0 4px; font-size: 1.05em; font-weight: 900; color: #6b7280; }
        .ifr-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .ifr-pow { display: inline-block; border-radius: 999px; padding: 2px 10px; color: #fff; font-size: .85em; font-weight: 800; margin: 0 0 6px; }
        .ifr-facts { margin: 0 0 6px; display: flex; flex-direction: column; gap: 4px; }
        .ifr-facts > div { background: #fff; border: 1px solid #eceef2; border-radius: 8px; padding: 5px 8px; }
        .ifr-facts b { color: #1d4f86; }
        .ifr-sub { font-weight: 900; color: #1d4f86; margin: 6px 0 2px; }
        .ifr-side ul { margin: 0 0 6px; padding-left: 18px; }
        .ifr-side li { margin: 2px 0; }
        .ifr-text { margin: 0 0 6px; }
        .ifr-change { background: #eaf3fc; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1d4f86; font-weight: 700; }
        .ifr-ex { background: #eef8f0; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1f5b2f; }
        .ifr-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .ifr-list { list-style: none !important; margin: 0; padding: 0 !important; display: flex; flex-direction: column; gap: 4px; }
        .ifr-list button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--it-c, #bbb);
            background: #fff; font-weight: 700; font-size: 13px; font-family: inherit; color: #374151;
            padding: 4px 8px; touch-action: manipulation;
        }
        .ifr-list button.on { background: var(--it-c, #3b8fd9); color: #fff; }
        .ifr-legend { display: flex; flex-direction: column; gap: 4px; margin: 0 0 8px; font-size: .92em; }
        .ifr-legend span { display: inline-block; width: 34px; height: 0; border-top: 4px solid; vertical-align: middle; margin-right: 6px; }

        /* ── SVG : institutions ── */
        .ifr-svg text { font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; dominant-baseline: central; }
        .ifr-node { transition: opacity .25s; }
        .ifr-node-bg { fill: #ffffff; stroke: var(--nc); stroke-width: 3; transition: fill .2s; filter: drop-shadow(0 2px 3px rgba(0,0,0,.12)); }
        .ifr-node-ic { fill: var(--nc); opacity: .16; }
        .ifr-node-ico { font-size: 28px; text-anchor: middle; }
        .ifr-node-t { font-weight: 900; fill: #1f2937; }
        .ifr-node-s { font-weight: 700; fill: #6b7280; }
        .ifr-node:hover .ifr-node-bg { stroke-width: 4.5; }
        .ifr-node.on .ifr-node-bg { fill: var(--nc); stroke-width: 5; }
        .ifr-node.on .ifr-node-ic { fill: #fff; opacity: .9; }
        .ifr-node.on .ifr-node-t, .ifr-node.on .ifr-node-s { fill: #fff; }
        .ifr-svg .dim { opacity: .28; }
        .ifr-col { transition: opacity .3s; }
        .ifr-col-bg { fill: var(--cc); opacity: .1; stroke: var(--cc); stroke-width: 2; stroke-opacity: .5; }
        .ifr-col.on .ifr-col-bg { opacity: .22; stroke-width: 3.5; stroke-opacity: 1; }
        .ifr-col-t { font-weight: 900; fill: var(--cc); font-size: 17px; text-anchor: middle; letter-spacing: .5px; }
        .ifr-col-s { font-weight: 700; fill: var(--cc); font-size: 14px; text-anchor: middle; font-style: italic; }
        .ifr-hide3p .ifr-col { opacity: 0; pointer-events: none; }
        .ifr-frame { fill: rgba(47,158,110,.06); stroke: #2f9e6e; stroke-width: 2.5; stroke-dasharray: 9 6; }
        .ifr-frame-g.on .ifr-frame { fill: rgba(47,158,110,.2); stroke-width: 4; stroke-dasharray: none; }
        .ifr-frame-t { font-weight: 900; fill: #2f9e6e; font-size: 18px; text-anchor: middle; }
        .ifr-link { stroke: #b6bcc6; stroke-width: 2.5; stroke-dasharray: 5 5; fill: none; }
        .ifr-link-t { font-size: 13px; font-weight: 700; fill: #8a919c; text-anchor: middle; font-style: italic; }

        /* ── SVG : flèches ── */
        .ifr-arrow { transition: opacity .25s; }
        .ifr-arrow-hit { stroke: transparent; stroke-width: 26; fill: none; pointer-events: stroke; }
        .ifr-arrow-line { stroke: var(--ac); stroke-width: 5; fill: none; stroke-linecap: round; }
        .ifr-arrow.dashed .ifr-arrow-line { stroke-dasharray: 11 8; }
        .ifr-arrow-head { fill: var(--ac); }
        .ifr-arrow.on .ifr-arrow-line { stroke-width: 8; stroke-dasharray: 16 10; animation: ifr-flow .8s linear infinite; }
        .ifr-arrow-lbl rect { fill: #fff; stroke: var(--ac); stroke-width: 1.5; }
        .ifr-arrow-lbl text { font-size: 14px; font-weight: 800; fill: var(--ac); text-anchor: middle; }
        .ifr-arrow.on .ifr-arrow-lbl rect { fill: var(--ac); }
        .ifr-arrow.on .ifr-arrow-lbl text { fill: #fff; }
        @keyframes ifr-flow { to { stroke-dashoffset: -26; } }

        /* ── SVG : voyage de la loi ── */
        .ifr-road { stroke: #d3d8e0; stroke-width: 34; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .ifr-road-mid { stroke: #ffffff; stroke-width: 3; fill: none; stroke-dasharray: 14 12; stroke-linejoin: round; }
        .ifr-st-c { fill: #fff; stroke: var(--nc); stroke-width: 4; transition: fill .2s; filter: drop-shadow(0 2px 3px rgba(0,0,0,.15)); }
        .ifr-st-ico { font-size: 34px; text-anchor: middle; }
        .ifr-st-n { fill: var(--nc); }
        .ifr-st-nt { fill: #fff; font-size: 14px; font-weight: 900; text-anchor: middle; }
        .ifr-st-lbl { font-size: 17px; font-weight: 900; fill: #1f2937; text-anchor: middle; paint-order: stroke; stroke: #f4f8f1; stroke-width: 5px; stroke-linejoin: round; }
        .ifr-st:hover .ifr-st-c { stroke-width: 6; }
        .ifr-st.done .ifr-st-c { fill: color-mix(in srgb, var(--nc) 22%, white); }
        .ifr-st.on .ifr-st-c { fill: var(--nc); stroke-width: 6; }
        .ifr-token { transition: transform .9s ease-in-out; }
        .ifr-token.nav { animation: ifr-nav 3.4s ease-in-out infinite; }
        @keyframes ifr-nav {
            0%, 12%  { transform: translate(330px, 165px); }
            44%, 56% { transform: translate(600px, 165px); }
            88%, 100% { transform: translate(330px, 165px); }
        }
        .ifr-token-bg { fill: #fff8df; stroke: #e6b422; stroke-width: 3; }
        .ifr-token-t { font-size: 26px; text-anchor: middle; }

        /* ── Quiz ── */
        .ifr-quiz {
            position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 14px; padding: 18px; box-sizing: border-box; overflow-y: auto;
            background: linear-gradient(180deg, #f6f3ff, #eef2fb);
        }
        .ifr-q-top { display: flex; gap: 10px; align-items: center; font-weight: 800; color: #6b7280; font-size: 14px; flex-wrap: wrap; justify-content: center; }
        .ifr-q-pill { background: #2A1F4A; color: #FFC933; border-radius: 999px; padding: 3px 12px; }
        .ifr-q-prog { width: min(520px, 90%); height: 8px; background: #dfe3ec; border-radius: 99px; overflow: hidden; }
        .ifr-q-prog > div { height: 100%; background: #6fb78f; transition: width .3s; }
        .ifr-q-text { font-size: clamp(18px, 2.6vw, 28px); font-weight: 900; color: #1f2937; text-align: center; max-width: 760px; line-height: 1.25; }
        .ifr-q-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: min(760px, 100%); }
        .ifr-q-opt {
            min-height: 58px; padding: 10px 14px; border-radius: 14px; border: 2px solid #d6d9de;
            background: #fff; color: #1f2937; font-weight: 800; font-size: clamp(14px, 1.7vw, 18px); font-family: inherit;
            text-align: center; touch-action: manipulation; box-shadow: 0 2px 5px rgba(0,0,0,.06);
        }
        .ifr-q-opt:hover:not(:disabled) { border-color: #3b8fd9; background: #f2f8ff; }
        .ifr-q-opt.good { background: #2f9e6e; border-color: #2f9e6e; color: #fff; }
        .ifr-q-opt.bad { background: #e0335c; border-color: #e0335c; color: #fff; }
        .ifr-q-opt:disabled { opacity: 1; }
        .ifr-q-opt.fade { opacity: .45; }
        .ifr-q-next { min-height: 44px; padding: 8px 22px; border-radius: 12px; border: none; background: #3b8fd9; color: #fff; font-weight: 900; font-size: 16px; font-family: inherit; touch-action: manipulation; }
        .ifr-q-next:hover { filter: brightness(1.08); }
        .ifr-q-end { font-size: clamp(40px, 6vw, 72px); }
        .ifr-q-score { font-size: clamp(22px, 3vw, 34px); font-weight: 900; color: #2A1F4A; }

        /* ── Aide ── */
        .ifr-help-popup {
            display: none; position: absolute; top: 56px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ifr-help-popup.show { display: block; }
        .ifr-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .ifr-help-popup p { margin: 0 0 6px; }

        .ifr-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .ifr-resize-handle:hover { opacity: 1; }
        .ifr-container.wf-fullboard .ifr-resize-handle { display: none; }

        /* ── Curseurs : flèche partout, main sur la barre du haut, doigt sur ce qui se clique ── */
        .widget[data-type="institutions-france"], .ifr-container, .ifr-container * { cursor: default !important; }
        .widget[data-type="institutions-france"] .drag-handle, .widget[data-type="institutions-france"] .widget-rotate-handle { cursor: grab !important; }
        .ifr-container .ifr-header, .ifr-container .ifr-header * { cursor: grab !important; }
        .ifr-container .ifr-header:active, .ifr-container .ifr-header:active * { cursor: grabbing !important; }
        .ifr-container.wf-fullboard .ifr-header, .ifr-container.wf-fullboard .ifr-header *:not(button):not(button *),
        .widget.phone-fs[data-type="institutions-france"] .ifr-header *:not(button):not(button *) { cursor: default !important; }
        .ifr-container button, .ifr-container button *,
        .ifr-container .ifr-node, .ifr-container .ifr-node *, .ifr-container .ifr-st, .ifr-container .ifr-st *,
        .ifr-container .ifr-arrow, .ifr-container .ifr-arrow *, .ifr-container .ifr-col, .ifr-container .ifr-col *,
        .ifr-container .ifr-frame-g, .ifr-container .ifr-frame-g *,
        .widget[data-type="institutions-france"] .widget-menu-handle, .widget[data-type="institutions-france"] .widget-pin-handle,
        .widget[data-type="institutions-france"] .widget-back-handle, .widget[data-type="institutions-france"] .widget-close-handle { cursor: pointer !important; }
        .ifr-container button:disabled, .ifr-container button:disabled * { cursor: default !important; }
        .ifr-container .ifr-resize-handle { cursor: se-resize !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .ifr-container { padding: 10px 10px 8px; gap: 6px; }
            .ifr-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; max-width: calc(100% + 20px); }
            .ifr-container.wf-fullboard .ifr-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .ifr-title { font-size: 17px; }
            .ifr-tab { padding: 3px 9px; font-size: 12px; }
            .ifr-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .ifr-row > * { flex-shrink: 0; }
            .ifr-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .ifr-sep { display: none; }
            .ifr-hint { font-size: 11px; bottom: 4px; }
            .ifr-side { padding: 8px 10px; font-size: 13px; }
            .ifr-help-popup { top: 50px; left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
            .ifr-q-opts { grid-template-columns: 1fr; gap: 7px; }
            .ifr-q-opt { min-height: 44px; }
        }
        @media (max-width: 600px) and (orientation: portrait) {
            .ifr-body { flex-direction: column; }
            .ifr-scene-wrap { flex: 1 1 0; min-height: 220px; }
            .ifr-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 42%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 600px) and (orientation: landscape) {
            .ifr-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Couleurs ──────────────────────────────────────────────────────────────
const IFR_C = {
    exec: '#e8833a', legis: '#2f9e6e', judic: '#9a6a3a', peuple: '#3b5bdb',
    cc: '#6b7fd0', local: '#14a0a0', vote: '#2f7fd8', nom: '#8e5bd6', ctr: '#e0335c'
};

// ── Contenu : les institutions ────────────────────────────────────────────
const IFR_ORGANS = {
    citoyens: {
        ico: '🗳️', name: 'Les citoyens', color: IFR_C.peuple, power: null,
        count: 'Environ 49 millions d\'électeurs.',
        how: 'Toutes les Françaises et tous les Français de <b>18 ans et plus</b>, inscrits sur les listes électorales, peuvent voter.',
        duree: 'Toute leur vie : on garde le droit de vote.',
        lieu: 'Partout en France : on vote dans un bureau de vote, souvent à la mairie ou à l\'école.',
        roles: ['Ils <b>élisent</b> leurs représentants : le Président, les députés, le maire et les conseillers…',
                'Ils peuvent répondre à un <b>référendum</b> (une question posée directement au peuple).',
                'Ils doivent <b>respecter les lois</b> et peuvent donner leur avis (associations, manifestations, pétitions).'],
        know: 'La France est une <b>démocratie</b> : le pouvoir appartient au peuple. La Constitution le résume ainsi : « le gouvernement du peuple, par le peuple et pour le peuple ».'
    },
    president: {
        ico: '🎖️', name: 'Le Président de la République', color: IFR_C.exec, power: 'exec',
        count: '1 seule personne.',
        how: 'Élu <b>directement par les citoyens</b> : c\'est le <b>suffrage universel direct</b>. Il ne peut pas faire plus de <b>2 mandats de suite</b>.',
        duree: '<b>5 ans</b> (on appelle cela un quinquennat).',
        lieu: 'Le <b>palais de l\'Élysée</b>, à Paris.',
        roles: ['Il est le <b>chef de l\'État</b> et représente la France dans le monde.',
                'Il <b>nomme le Premier ministre</b>, puis les ministres.',
                'Il préside chaque semaine le <b>Conseil des ministres</b>.',
                'Il est le <b>chef des armées</b>.',
                'Il <b>signe les lois</b> pour qu\'elles s\'appliquent (il les promulgue).',
                'Il veille au respect de la Constitution et peut <b>dissoudre l\'Assemblée nationale</b>.'],
        know: 'Pour être élu dès le premier tour, il faut plus de la moitié des voix. Sinon, les deux candidats arrivés en tête s\'affrontent au <b>second tour</b>, deux semaines plus tard.'
    },
    pm: {
        ico: '🧭', name: 'Le Premier ministre', color: IFR_C.exec, power: 'exec',
        count: '1 seule personne.',
        how: '<b>Nommé</b> (choisi) par le Président de la République. Il n\'est <b>pas élu</b> à ce poste.',
        duree: 'Pas de durée fixe : il reste tant que le Président le garde et que l\'Assemblée nationale ne renverse pas le gouvernement.',
        lieu: 'L\'<b>hôtel de Matignon</b>, à Paris.',
        roles: ['Il <b>dirige le gouvernement</b> et organise le travail des ministres.',
                'Il <b>propose les ministres</b> au Président.',
                'Il défend la politique du gouvernement devant les députés et les sénateurs.'],
        know: 'Dans les journaux, on dit souvent « <b>Matignon</b> » pour parler du Premier ministre, et « <b>l\'Élysée</b> » pour parler du Président.'
    },
    gouv: {
        ico: '💼', name: 'Le gouvernement', color: IFR_C.exec, power: 'exec',
        count: 'Le Premier ministre et une trentaine de ministres (le nombre change d\'un gouvernement à l\'autre).',
        how: 'Les ministres sont <b>proposés par le Premier ministre</b> et <b>nommés par le Président</b>.',
        duree: 'Pas de durée fixe.',
        lieu: 'Chaque ministre a son ministère, à Paris. Ils se réunissent à l\'Élysée pour le Conseil des ministres.',
        roles: ['Chaque ministre s\'occupe d\'un <b>domaine</b> : l\'éducation, la santé, les armées, l\'écologie…',
                'Il <b>fait appliquer les lois</b> et dirige les services de l\'État (enseignants, policiers, hôpitaux…).',
                'Il prépare des <b>projets de loi</b> et le <b>budget</b> du pays.'],
        know: 'Le gouvernement doit avoir la confiance des députés : l\'Assemblée nationale peut le <b>renverser</b> en votant une « motion de censure ».'
    },
    parlement: {
        ico: '🏛️', name: 'Le Parlement', color: IFR_C.legis, power: 'legis',
        count: '925 parlementaires : <b>577 députés</b> et <b>348 sénateurs</b>.',
        how: 'Il est formé de <b>deux assemblées</b> : l\'Assemblée nationale et le Sénat.',
        duree: 'Députés : 5 ans · sénateurs : 6 ans.',
        lieu: 'Le palais Bourbon et le palais du Luxembourg, à Paris.',
        roles: ['Il <b>discute et vote les lois</b>.',
                'Il vote le <b>budget</b> de l\'État (les recettes et les dépenses).',
                'Il <b>contrôle</b> le travail du gouvernement.'],
        know: 'Pour modifier la Constitution, les députés et les sénateurs peuvent se réunir tous ensemble au château de <b>Versailles</b> : on appelle cela le <b>Congrès</b>.'
    },
    assemblee: {
        ico: '🏛️', name: 'L\'Assemblée nationale', color: IFR_C.legis, power: 'legis',
        count: '<b>577 députés</b>.',
        how: 'Élus <b>directement par les citoyens</b> (suffrage universel direct). La France est découpée en 577 <b>circonscriptions</b> : chacune élit son député.',
        duree: '<b>5 ans</b> (moins si le Président dissout l\'Assemblée).',
        lieu: 'Le <b>palais Bourbon</b>, à Paris.',
        roles: ['Elle <b>discute, modifie et vote les lois</b>.',
                'Elle vote le <b>budget</b>.',
                'Elle <b>contrôle le gouvernement</b> : chaque semaine, les députés posent des questions aux ministres.',
                'Elle peut <b>renverser le gouvernement</b> (motion de censure).',
                'Si elle n\'est pas d\'accord avec le Sénat, c\'est elle qui a le <b>dernier mot</b>.'],
        know: 'Les députés se réunissent dans l\'<b>hémicycle</b>, une grande salle en forme de demi-cercle.'
    },
    senat: {
        ico: '🏰', name: 'Le Sénat', color: IFR_C.legis, power: 'legis',
        count: '<b>348 sénateurs</b>.',
        how: 'Élus par environ <b>160 000 « grands électeurs »</b> : des élus (surtout des conseillers municipaux, mais aussi des députés et des conseillers départementaux et régionaux). C\'est le <b>suffrage universel indirect</b>.',
        duree: '<b>6 ans</b>. La moitié des sénateurs est renouvelée tous les 3 ans.',
        lieu: 'Le <b>palais du Luxembourg</b>, à Paris.',
        roles: ['Il <b>discute, modifie et vote les lois</b>, avec l\'Assemblée nationale.',
                'Il <b>contrôle</b> le gouvernement.',
                'Il représente les <b>territoires</b> : les communes, les départements et les régions.'],
        know: 'Si le Président de la République meurt ou démissionne, c\'est le <b>président du Sénat</b> qui le remplace, le temps d\'organiser une nouvelle élection.'
    },
    constit: {
        ico: '📘', name: 'Le Conseil constitutionnel', color: IFR_C.cc, power: null,
        count: '<b>9 membres</b>.',
        how: '<b>Nommés</b> : 3 par le Président de la République, 3 par le président de l\'Assemblée nationale et 3 par le président du Sénat.',
        duree: '<b>9 ans</b>, une seule fois.',
        lieu: 'Le <b>Palais-Royal</b>, à Paris.',
        roles: ['Il vérifie que les lois <b>respectent la Constitution</b>.',
                'Il peut <b>refuser</b> une loi, ou une partie de loi, qui ne la respecte pas.',
                'Il surveille que l\'élection du Président et les référendums se passent bien.'],
        know: 'La <b>Constitution</b> est le texte le plus important de la France : c\'est la « règle du jeu » de la République. Celle d\'aujourd\'hui date du <b>4 octobre 1958</b> : c\'est la <b>Ve République</b>.'
    },
    justice: {
        ico: '⚖️', name: 'La justice', color: IFR_C.judic, power: 'judic',
        count: 'Plusieurs milliers de juges, dans des tribunaux partout en France.',
        how: 'Les juges <b>ne sont pas élus</b> : ce sont des professionnels qui ont passé un concours. Ils sont <b>indépendants</b> : personne ne peut leur dicter leurs décisions.',
        duree: 'Toute leur carrière.',
        lieu: 'Les <b>tribunaux</b> et les palais de justice.',
        roles: ['Elle <b>fait respecter les lois</b>.',
                'Elle règle les <b>conflits</b> entre les personnes.',
                'Elle <b>juge et punit</b> ceux qui ne respectent pas la loi.'],
        know: 'La justice est rendue « <b>au nom du peuple français</b> ». Son symbole est la <b>balance</b> : le juge pèse les arguments de chacun avant de décider.'
    }
};
const IFR_POWERS = {
    exec:  { ico: '💼', name: 'Le pouvoir exécutif', color: IFR_C.exec, who: 'Le Président de la République et le gouvernement (le Premier ministre et les ministres).',
             text: 'Il <b>dirige le pays</b> au quotidien et <b>fait appliquer les lois</b>.' },
    legis: { ico: '🏛️', name: 'Le pouvoir législatif', color: IFR_C.legis, who: 'Le Parlement : l\'Assemblée nationale et le Sénat.',
             text: 'Il <b>discute et vote les lois</b>, vote le budget et contrôle le gouvernement.' },
    judic: { ico: '⚖️', name: 'Le pouvoir judiciaire', color: IFR_C.judic, who: 'Les juges et les tribunaux.',
             text: 'Il <b>fait respecter les lois</b> et punit ceux qui ne les respectent pas. Il est indépendant des deux autres pouvoirs.' }
};
const IFR_POW_KNOW = 'Séparer les pouvoirs évite qu\'une seule personne décide de tout. C\'est l\'idée de <b>Montesquieu</b>, un philosophe français du XVIIIe siècle.';
const IFR_QUI_ORDER = ['citoyens', 'president', 'pm', 'gouv', 'parlement', 'assemblee', 'senat', 'constit', 'justice'];
const IFR_QUI_SHORT = { citoyens: 'Citoyens', president: 'Président', pm: 'Premier ministre', gouv: 'Gouvernement',
    parlement: 'Parlement', assemblee: 'Assemblée', senat: 'Sénat', constit: 'Cons. constitutionnel', justice: 'Justice' };

// ── Contenu : qui choisit qui ? ───────────────────────────────────────────
const IFR_ELECT_NODES = {
    citoyens:  { x: 330, y: 530, w: 340, ico: '🗳️', t: 'Les citoyens', s: '18 ans et plus', c: IFR_C.peuple },
    president: { x: 40,  y: 370, w: 250, ico: '🎖️', t: 'Le Président', s: 'de la République', c: IFR_C.exec },
    assemblee: { x: 375, y: 370, w: 250, ico: '🏛️', t: 'Les 577 députés', s: 'Assemblée nationale', c: IFR_C.legis },
    locaux:    { x: 710, y: 370, w: 250, ico: '🏘️', t: 'Les élus locaux', s: 'conseillers, maires', c: IFR_C.local },
    ge:        { x: 710, y: 225, w: 250, ico: '👥', t: 'Grands électeurs', s: '≈ 160 000 élus', c: IFR_C.local },
    senat:     { x: 710, y: 60,  w: 250, ico: '🏰', t: 'Les 348 sénateurs', s: 'Sénat', c: IFR_C.legis },
    pm:        { x: 40,  y: 225, w: 250, ico: '🧭', t: 'Premier ministre', s: 'dirige le gouvernement', c: IFR_C.exec },
    gouv:      { x: 40,  y: 60,  w: 250, ico: '💼', t: 'Les ministres', s: 'le gouvernement', c: IFR_C.exec },
    constit:   { x: 375, y: 140, w: 250, ico: '📘', t: 'Conseil constit.', s: '9 membres', c: IFR_C.cc }
};
const IFR_ELECT_ARROWS = [
    { s: 1, col: IFR_C.vote, dash: false, a: [420, 530], c: [300, 522], b: [205, 450], lbl: 'vote · 5 ans', lp: [295, 516] },
    { s: 2, col: IFR_C.vote, dash: false, a: [500, 530], c: [500, 492], b: [500, 450], lbl: 'vote · 5 ans', lp: [500, 490] },
    { s: 3, col: IFR_C.vote, dash: false, a: [580, 530], c: [700, 522], b: [795, 450], lbl: 'vote · 6 ans', lp: [705, 516] },
    { s: 4, col: IFR_C.local, dash: false, a: [835, 370], c: [835, 340], b: [835, 305] },
    { s: 4, col: IFR_C.local, dash: false, a: [625, 385], c: [670, 330], b: [708, 300], lbl: 'députés', lp: [650, 340] },
    { s: 4, col: IFR_C.vote, dash: false, a: [835, 225], c: [835, 185], b: [835, 140], lbl: 'vote · 6 ans', lp: [835, 182] },
    { s: 5, col: IFR_C.nom, dash: true, a: [165, 370], c: [165, 338], b: [165, 305], lbl: 'nomme', lp: [165, 337] },
    { s: 6, col: IFR_C.nom, dash: true, a: [165, 225], c: [165, 185], b: [165, 140], lbl: 'propose · nomme', lp: [165, 182] },
    { s: 7, col: IFR_C.nom, dash: true, a: [290, 392], c: [335, 300], b: [420, 220], lbl: 'nomme 3', lp: [318, 352] },
    { s: 7, col: IFR_C.nom, dash: true, a: [500, 370], c: [500, 300], b: [500, 220], lbl: 'nomme 3', lp: [500, 296] },
    { s: 7, col: IFR_C.nom, dash: true, a: [710, 95], c: [650, 110], b: [612, 140], lbl: 'nomme 3', lp: [655, 92] },
    { s: 8, col: IFR_C.ctr, dash: true, a: [395, 370], c: [345, 230], b: [292, 112], lbl: 'renverse', lp: [340, 250] },
    { s: 8, col: IFR_C.ctr, dash: true, a: [290, 425], c: [332, 432], b: [373, 425], lbl: 'peut dissoudre', lp: [332, 468] }
];
const IFR_ELECT_STEPS = [
    { ico: '🗳️', name: 'Les citoyens votent', color: IFR_C.peuple, nodes: ['citoyens'],
      change: 'Pour voter : avoir la nationalité française, 18 ans ou plus, et être inscrit sur les listes électorales.',
      text: 'Le vote est <b>libre</b> et <b>secret</b> : on choisit seul, caché dans l\'<b>isoloir</b>, puis on glisse son bulletin dans l\'<b>urne</b> et on signe la liste. Le soir, les bulletins sont comptés devant tout le monde : c\'est le <b>dépouillement</b>.',
      know: 'Voter est un <b>droit</b>, et aussi un <b>devoir</b> de citoyen. Les femmes ont obtenu le droit de vote en 1944 et ont voté pour la première fois en 1945.' },
    { ico: '🎖️', name: 'Ils élisent le Président', color: IFR_C.exec, nodes: ['citoyens', 'president'],
      change: 'Vote direct de tous les citoyens · pour 5 ans.',
      text: 'Tous les 5 ans, les citoyens élisent <b>directement</b> le Président de la République : c\'est le <b>suffrage universel direct</b>. S\'il n\'a pas plus de la moitié des voix au premier tour, un <b>second tour</b> a lieu entre les deux premiers.',
      know: 'Le Président est élu directement par le peuple depuis 1965. Avant, il était choisi par des élus.' },
    { ico: '🏛️', name: 'Ils élisent les députés', color: IFR_C.legis, nodes: ['citoyens', 'assemblee'],
      change: 'Vote direct · 577 députés · pour 5 ans.',
      text: 'Les citoyens élisent aussi les <b>577 députés</b> de l\'Assemblée nationale : ce sont les <b>élections législatives</b>. Chaque circonscription (une partie d\'un département) élit son député.',
      know: 'Si le Président dissout l\'Assemblée nationale, de nouvelles élections législatives ont lieu dans un délai de 20 à 40 jours.' },
    { ico: '🏘️', name: 'Ils élisent leurs élus locaux', color: IFR_C.local, nodes: ['citoyens', 'locaux'],
      change: 'Vote direct · conseillers municipaux pour 6 ans.',
      text: 'Près de chez eux, les citoyens élisent les <b>conseillers municipaux</b> de leur commune. Ce sont eux qui choisissent ensuite le <b>maire</b>. On élit aussi des conseillers <b>départementaux</b> et <b>régionaux</b>.',
      know: 'Le maire n\'est pas élu directement par les habitants : il est élu par le conseil municipal. Il y a environ <b>35 000 communes</b> en France, donc autant de maires !' },
    { ico: '🏰', name: 'Les grands électeurs élisent les sénateurs', color: IFR_C.legis, nodes: ['locaux', 'assemblee', 'ge', 'senat'],
      change: 'Vote indirect : ce sont des élus qui votent · pour 6 ans.',
      text: 'Les sénateurs ne sont pas élus par tous les citoyens, mais par environ <b>160 000 grands électeurs</b> : surtout des conseillers municipaux, et aussi les députés et les conseillers départementaux et régionaux. C\'est le <b>suffrage universel indirect</b>. La moitié des sénateurs est renouvelée tous les 3 ans.',
      know: 'Comme la plupart des grands électeurs viennent des communes, on dit que le Sénat représente les <b>territoires</b> de France.' },
    { ico: '🧭', name: 'Le Président nomme le Premier ministre', color: IFR_C.nom, nodes: ['president', 'pm'],
      change: 'Nomination : ce n\'est pas une élection.',
      text: 'Le Président <b>choisit</b> le Premier ministre. En pratique, il doit choisir une personne soutenue par une majorité de députés, sinon l\'Assemblée nationale pourrait renverser son gouvernement.',
      know: 'Le Premier ministre n\'est pas élu à ce poste : il est <b>nommé</b>. Il peut avoir été député ou maire auparavant.' },
    { ico: '💼', name: 'Le gouvernement est formé', color: IFR_C.nom, nodes: ['pm', 'gouv'],
      change: 'Nomination : le Premier ministre propose, le Président nomme.',
      text: 'Le Premier ministre <b>propose</b> une liste de ministres et le Président les <b>nomme</b>. Ensemble, ils forment le <b>gouvernement</b>.',
      know: 'Chaque semaine, en général le mercredi, les ministres se réunissent à l\'Élysée autour du Président : c\'est le <b>Conseil des ministres</b>.' },
    { ico: '📘', name: 'Le Conseil constitutionnel est nommé', color: IFR_C.cc, nodes: ['president', 'assemblee', 'senat', 'constit'],
      change: 'Nomination : 3 + 3 + 3 = 9 membres · pour 9 ans.',
      text: 'Ses <b>9 membres</b> sont nommés : 3 par le Président de la République, 3 par le <b>président de l\'Assemblée nationale</b> et 3 par le <b>président du Sénat</b>. Tous les 3 ans, on en remplace 3.',
      know: 'Ils sont nommés pour 9 ans et <b>une seule fois</b> : ainsi, ils n\'ont pas à plaire à quelqu\'un pour rester à leur place. Cela les rend <b>indépendants</b>.' },
    { ico: '⚖️', name: 'Chacun surveille l\'autre', color: IFR_C.ctr, nodes: ['assemblee', 'gouv', 'president'],
      change: 'Les pouvoirs s\'équilibrent.',
      text: 'L\'Assemblée nationale peut <b>renverser le gouvernement</b> en votant une motion de censure. En retour, le Président peut <b>dissoudre l\'Assemblée nationale</b> : les citoyens votent alors de nouveau pour élire les députés. Le dernier mot revient ainsi au peuple.',
      know: IFR_POW_KNOW }
];
const IFR_ELECT_NODE_STEP = { citoyens: 0, president: 1, assemblee: 2, locaux: 3, ge: 4, senat: 4, pm: 5, gouv: 6, constit: 7 };

// ── Contenu : le voyage d'une loi ─────────────────────────────────────────
const IFR_LAW = [
    { x: 110, y: 165, ico: '💡', name: 'Une idée de loi', lbl: ['Une idée', 'de loi'], color: '#e6b422',
      change: 'Qui ? le gouvernement, ou un député, ou un sénateur.',
      text: 'Une <b>loi</b> est une règle qui s\'applique à tout le monde. L\'idée peut venir du <b>gouvernement</b> (on parle de <b>projet de loi</b>) ou d\'un <b>député</b> ou d\'un <b>sénateur</b> (on parle de <b>proposition de loi</b>).',
      know: 'Le texte peut commencer son voyage à l\'Assemblée nationale ou au Sénat. Ici, on le suit en commençant par l\'Assemblée.',
      ex: 'En 2018, des députés proposent une loi pour <b>interdire le téléphone portable</b> à l\'école et au collège.' },
    { x: 330, y: 165, ico: '🏛️', name: 'L\'Assemblée nationale', lbl: ['Assemblée', 'nationale'], color: IFR_C.legis,
      change: 'Qui ? les 577 députés.',
      text: 'Les députés étudient le texte, d\'abord en petit groupe (en <b>commission</b>), puis tous ensemble dans l\'<b>hémicycle</b>. Ils peuvent le modifier en proposant des <b>amendements</b>, puis ils <b>votent</b>.',
      know: 'Un <b>amendement</b> est une modification proposée pour améliorer ou changer le texte. Les députés en votent parfois des centaines pour une seule loi !',
      ex: 'Les députés discutent la loi sur le portable, la modifient puis l\'adoptent.' },
    { x: 600, y: 165, ico: '🏰', name: 'Le Sénat', lbl: ['Le Sénat'], color: IFR_C.legis,
      change: 'Qui ? les 348 sénateurs.',
      text: 'Le texte part ensuite au <b>Sénat</b>. Les sénateurs l\'étudient, le modifient s\'ils le souhaitent, puis le votent à leur tour.',
      know: 'Pour qu\'une loi soit adoptée, les deux assemblées doivent en principe voter <b>exactement le même texte</b>, au mot près.',
      ex: 'Les sénateurs étudient la loi sur le portable et la modifient à leur tour.' },
    { x: 465, y: 310, ico: '🔁', name: 'La navette', lbl: ['La navette'], color: IFR_C.nom,
      change: 'Le texte fait des allers-retours entre l\'Assemblée et le Sénat.',
      text: 'Si le Sénat a changé le texte, il repart à l\'Assemblée nationale, puis revient au Sénat… Ces allers-retours s\'appellent la <b>navette</b>. Ils continuent jusqu\'à ce que les deux assemblées soient d\'accord sur le même texte.',
      know: 'Si elles n\'arrivent pas à se mettre d\'accord, le gouvernement peut demander à l\'<b>Assemblée nationale</b> de décider seule : c\'est elle qui a le <b>dernier mot</b>, car ses membres sont élus directement par le peuple.',
      ex: 'Pendant l\'été 2018, députés et sénateurs se mettent d\'accord sur le même texte.' },
    { x: 860, y: 165, ico: '📘', name: 'Le contrôle', lbl: ['Conseil', 'constitutionnel'], color: IFR_C.cc,
      change: 'Qui ? les 9 membres du Conseil constitutionnel (si on le leur demande).',
      text: 'Avant que la loi s\'applique, le <b>Conseil constitutionnel</b> peut être appelé à vérifier qu\'elle <b>respecte la Constitution</b> (par exemple par 60 députés ou 60 sénateurs). Si une partie de la loi ne la respecte pas, elle est supprimée.',
      know: 'Le Conseil constitutionnel ne vérifie pas toutes les lois : seulement celles qu\'on lui demande d\'examiner, et quelques lois très importantes qui doivent toujours l\'être.',
      ex: 'Pour la loi sur le portable, cette étape n\'était pas obligatoire.' },
    { x: 860, y: 492, ico: '✍️', name: 'La promulgation', lbl: ['Le Président', 'signe'], color: IFR_C.exec,
      change: 'Qui ? le Président de la République.',
      text: 'Le Président <b>signe</b> la loi dans les 15 jours : c\'est la <b>promulgation</b>. La loi est ensuite publiée au <b>Journal officiel</b>, pour que tout le monde puisse la connaître.',
      know: 'Le Président peut demander au Parlement de discuter la loi une nouvelle fois, mais il ne peut pas l\'empêcher d\'exister.',
      ex: 'Le Président promulgue la loi sur le portable le <b>3 août 2018</b>.' },
    { x: 470, y: 492, ico: '⚖️', name: 'La loi s\'applique', lbl: ['La loi', 's\'applique à tous'], color: IFR_C.judic,
      change: 'Qui ? le gouvernement la fait appliquer, la justice la fait respecter.',
      text: 'Désormais, la loi <b>s\'applique à tous</b>. Le <b>gouvernement</b> la fait appliquer grâce aux services de l\'État, et la <b>justice</b> la fait respecter : les juges sanctionnent ceux qui ne la respectent pas.',
      know: 'On dit : « <b>Nul n\'est censé ignorer la loi</b> ». Cela veut dire que personne ne peut se défendre en disant qu\'il ne la connaissait pas.',
      ex: 'Depuis la rentrée 2018, le portable est interdit à l\'école et au collège, sauf pour un usage décidé par l\'enseignant.' }
];
const IFR_LAW_OVERVIEW = {
    text: 'En France, ce sont les <b>représentants du peuple</b> qui écrivent les lois : les députés et les sénateurs, réunis au <b>Parlement</b>. Avant de s\'appliquer, une loi fait un long voyage en plusieurs étapes.',
    know: 'Le Parlement vote chaque année plusieurs dizaines de lois. La plus importante de l\'année est la <b>loi de finances</b> : le budget de l\'État.'
};

// ── Contenu : quiz ────────────────────────────────────────────────────────
const IFR_QUIZ = [
    { q: 'Pour combien de temps le Président de la République est-il élu ?', o: ['5 ans', '7 ans', '6 ans', '4 ans'],
      e: 'Le Président est élu pour <b>5 ans</b> : c\'est le quinquennat. Avant 2002, c\'était 7 ans (le septennat).' },
    { q: 'Qui élit le Président de la République ?', o: ['Les citoyens', 'Les députés', 'Les sénateurs', 'Le Premier ministre'],
      e: 'Il est élu <b>directement par tous les citoyens</b> : c\'est le suffrage universel direct.' },
    { q: 'Qui choisit le Premier ministre ?', o: ['Le Président de la République', 'Les citoyens', 'Le Sénat', 'Les juges'],
      e: 'Le Premier ministre est <b>nommé par le Président</b>. Il n\'est pas élu à ce poste.' },
    { q: 'Combien y a-t-il de députés à l\'Assemblée nationale ?', o: ['577', '348', '100', '1 000'],
      e: 'Il y a <b>577 députés</b>. 348, c\'est le nombre de sénateurs.' },
    { q: 'Où se réunissent les sénateurs ?', o: ['Au palais du Luxembourg', 'Au palais de l\'Élysée', 'Au palais Bourbon', 'À l\'hôtel de Matignon'],
      e: 'Le Sénat siège au <b>palais du Luxembourg</b>. L\'Élysée est pour le Président, le palais Bourbon pour les députés, Matignon pour le Premier ministre.' },
    { q: 'Qui vote les lois ?', o: ['Le Parlement', 'Le Président', 'Les juges', 'Les maires'],
      e: 'Ce sont les députés et les sénateurs, réunis au <b>Parlement</b>, qui votent les lois. Le Président les signe ensuite.' },
    { q: 'Qui élit les sénateurs ?', o: ['Les grands électeurs', 'Tous les citoyens', 'Le Président', 'Le Conseil constitutionnel'],
      e: 'Les sénateurs sont élus par environ 160 000 <b>grands électeurs</b> (des élus) : c\'est le suffrage universel indirect.' },
    { q: 'À partir de quel âge peut-on voter en France ?', o: ['18 ans', '16 ans', '21 ans', '15 ans'],
      e: 'On peut voter à partir de <b>18 ans</b>, si on a la nationalité française et qu\'on est inscrit sur les listes électorales.' },
    { q: 'Quel est le rôle du Conseil constitutionnel ?', o: ['Vérifier que les lois respectent la Constitution', 'Élire le Président', 'Juger les voleurs', 'Préparer le budget'],
      e: 'Le Conseil constitutionnel vérifie que les lois <b>respectent la Constitution</b>, la « règle du jeu » de la République.' },
    { q: 'Qui fait appliquer les lois ?', o: ['Le gouvernement', 'Le Sénat', 'Les grands électeurs', 'Le Conseil constitutionnel'],
      e: 'C\'est le <b>gouvernement</b> (pouvoir exécutif) qui fait appliquer les lois, avec les services de l\'État.' },
    { q: 'Le pouvoir judiciaire, c\'est…', o: ['La justice', 'L\'Assemblée nationale', 'Le gouvernement', 'Le Président'],
      e: 'Le pouvoir judiciaire, ce sont <b>les juges et les tribunaux</b> : ils font respecter les lois.' },
    { q: 'Comment s\'appelle la réunion des ministres autour du Président ?', o: ['Le Conseil des ministres', 'L\'hémicycle', 'Le Congrès', 'Le conseil municipal'],
      e: 'Chaque semaine, les ministres se réunissent à l\'Élysée : c\'est le <b>Conseil des ministres</b>.' },
    { q: 'Le Parlement a le pouvoir…', o: ['législatif', 'exécutif', 'judiciaire', 'militaire'],
      e: 'Le Parlement a le <b>pouvoir législatif</b> : il fait les lois (« législatif » vient du latin <i>lex</i>, la loi).' },
    { q: 'Pour combien de temps les sénateurs sont-ils élus ?', o: ['6 ans', '5 ans', '9 ans', '3 ans'],
      e: 'Les sénateurs sont élus pour <b>6 ans</b>. La moitié est renouvelée tous les 3 ans.' },
    { q: 'Qui peut renverser le gouvernement ?', o: ['L\'Assemblée nationale', 'Le Sénat', 'Le Conseil constitutionnel', 'Les juges'],
      e: 'Les députés de l\'<b>Assemblée nationale</b> peuvent renverser le gouvernement en votant une motion de censure.' },
    { q: 'De quand date notre Constitution ?', o: ['1958', '1789', '1945', '2000'],
      e: 'La Constitution de la <b>Ve République</b> date du 4 octobre <b>1958</b>. En 1789, c\'est la Déclaration des droits de l\'homme et du citoyen.' },
    { q: 'Qui élit le maire de la commune ?', o: ['Les conseillers municipaux', 'Tous les habitants directement', 'Le Président', 'Les sénateurs'],
      e: 'Les habitants élisent les conseillers municipaux, puis ce sont les <b>conseillers municipaux</b> qui élisent le maire.' },
    { q: 'Où habite et travaille le Président de la République ?', o: ['Au palais de l\'Élysée', 'Au palais du Luxembourg', 'Au château de Versailles', 'Au palais Bourbon'],
      e: 'Le Président travaille au <b>palais de l\'Élysée</b>, à Paris.' },
    { q: 'Comment s\'appellent les allers-retours d\'une loi entre l\'Assemblée et le Sénat ?', o: ['La navette', 'Le référendum', 'La promulgation', 'Le dépouillement'],
      e: 'Ce sont des allers-retours, comme une <b>navette</b>, jusqu\'à ce que les deux assemblées soient d\'accord.' },
    { q: 'Que fait le Président quand il « promulgue » une loi ?', o: ['Il la signe pour qu\'elle s\'applique', 'Il l\'écrit', 'Il la refuse', 'Il la vote'],
      e: 'Promulguer, c\'est <b>signer</b> la loi pour qu\'elle puisse s\'appliquer. Elle est ensuite publiée au Journal officiel.' }
];
const IFR_QUIZ_LEN = 10;

// ── Petites fonctions SVG ─────────────────────────────────────────────────
function _ifrNode(k, x, y, w, h, color, ico, title, sub) {
    const fs = Math.min(22, (w - 80) / (title.length * 0.56));
    const ss = sub ? Math.min(15, (w - 80) / (sub.length * 0.5)) : 0;
    const cy = y + h / 2;
    return `<g class="ifr-node" data-k="${k}" style="--nc:${color}">
        <rect class="ifr-node-bg" x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/>
        <circle class="ifr-node-ic" cx="${x + 37}" cy="${cy}" r="26"/>
        <text class="ifr-node-ico" x="${x + 37}" y="${cy + 1}">${ico}</text>
        <text class="ifr-node-t" x="${x + 72}" y="${sub ? cy - 11 : cy}" style="font-size:${fs.toFixed(1)}px">${title}</text>
        ${sub ? `<text class="ifr-node-s" x="${x + 72}" y="${cy + 14}" style="font-size:${ss.toFixed(1)}px">${sub}</text>` : ''}
    </g>`;
}
function _ifrArrow(k, a, c, b, color, dashed, label, lp) {
    const ang = Math.atan2(b[1] - c[1], b[0] - c[0]), h = 17;
    const bx = b[0] - Math.cos(ang) * h, by = b[1] - Math.sin(ang) * h;
    const px = Math.cos(ang + Math.PI / 2) * h * 0.62, py = Math.sin(ang + Math.PI / 2) * h * 0.62;
    const d = `M${a[0]},${a[1]} Q${c[0]},${c[1]} ${bx.toFixed(1)},${by.toFixed(1)}`;
    let lbl = '';
    if (label) {
        const lw = label.length * 8 + 18;
        lbl = `<g class="ifr-arrow-lbl"><rect x="${lp[0] - lw / 2}" y="${lp[1] - 12}" width="${lw}" height="24" rx="12"/>
               <text x="${lp[0]}" y="${lp[1] + 1}">${label}</text></g>`;
    }
    return `<g class="ifr-arrow${dashed ? ' dashed' : ''}" data-k="${k}" style="--ac:${color}">
        <path class="ifr-arrow-hit" d="${d}"/>
        <path class="ifr-arrow-line" d="${d}"/>
        <polygon class="ifr-arrow-head" points="${b[0]},${b[1]} ${(bx + px).toFixed(1)},${(by + py).toFixed(1)} ${(bx - px).toFixed(1)},${(by - py).toFixed(1)}"/>
        ${lbl}
    </g>`;
}
function _ifrShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}

// ── Scènes SVG ────────────────────────────────────────────────────────────
function _ifrSvgQui() {
    const col = (k, x, w, color, t, s) => `<g class="ifr-col" data-k="pow-${k}" style="--cc:${color}">
        <rect class="ifr-col-bg" x="${x}" y="128" width="${w}" height="474" rx="18"/>
        <text class="ifr-col-t" x="${x + w / 2}" y="152">${t}</text>
        <text class="ifr-col-s" x="${x + w / 2}" y="174">${s}</text></g>`;
    return `<svg class="ifr-svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">
        ${col('exec', 20, 330, IFR_C.exec, 'POUVOIR EXÉCUTIF', 'fait appliquer les lois')}
        ${col('legis', 370, 360, IFR_C.legis, 'POUVOIR LÉGISLATIF', 'vote les lois')}
        ${col('judic', 750, 230, IFR_C.judic, 'POUVOIR JUDICIAIRE', 'fait respecter les lois')}
        <path class="ifr-link" d="M185,282 L185,318"/><text class="ifr-link-t" x="232" y="300">nomme</text>
        <path class="ifr-link" d="M185,400 L185,438"/><text class="ifr-link-t" x="225" y="419">dirige</text>
        <g class="ifr-frame-g" data-k="parlement">
            <rect class="ifr-frame" x="390" y="196" width="320" height="252" rx="18"/>
            <text class="ifr-frame-t" x="550" y="218">🏛️ Le Parlement</text>
        </g>
        ${_ifrNode('citoyens', 300, 22, 400, 82, IFR_C.peuple, '🗳️', 'Les citoyens', 'Le pouvoir vient du peuple')}
        ${_ifrNode('president', 45, 200, 280, 82, IFR_C.exec, '🎖️', 'Le Président', 'Chef de l\'État · élu')}
        ${_ifrNode('pm', 45, 318, 280, 82, IFR_C.exec, '🧭', 'Le Premier ministre', 'Choisi par le Président')}
        ${_ifrNode('gouv', 45, 438, 280, 82, IFR_C.exec, '💼', 'Le gouvernement', 'Les ministres')}
        ${_ifrNode('assemblee', 410, 238, 280, 82, IFR_C.legis, '🏛️', 'Assemblée nationale', '577 députés · élus')}
        ${_ifrNode('senat', 410, 344, 280, 82, IFR_C.legis, '🏰', 'Le Sénat', '348 sénateurs · élus')}
        ${_ifrNode('justice', 765, 290, 200, 82, IFR_C.judic, '⚖️', 'La justice', 'Les juges')}
        ${_ifrNode('constit', 400, 500, 300, 82, IFR_C.cc, '📘', 'Conseil constitutionnel', 'Vérifie les lois')}
    </svg>`;
}
function _ifrSvgElect() {
    let s = `<svg class="ifr-svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">`;
    IFR_ELECT_ARROWS.forEach((r, i) => { s += _ifrArrow('ea:' + i, r.a, r.c, r.b, r.col, r.dash, r.lbl, r.lp); });
    for (const k in IFR_ELECT_NODES) {
        const n = IFR_ELECT_NODES[k];
        s += _ifrNode('en:' + k, n.x, n.y, n.w, 76, n.c, n.ico, n.t, n.s);
    }
    return s + '</svg>';
}
function _ifrSvgLaw() {
    const P = IFR_LAW;
    let s = `<svg class="ifr-svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet">`;
    const road = `M${P[0].x},${P[0].y} L${P[2].x},${P[2].y} L${P[4].x},${P[4].y} L${P[5].x},${P[5].y} L${P[6].x},${P[6].y}`;
    s += `<path class="ifr-road" d="${road}"/><path class="ifr-road-mid" d="${road}"/>`;
    // Navette : allers-retours entre l'Assemblée et le Sénat
    s += _ifrArrow('l:3', [370, 120], [465, 60], [560, 120], IFR_C.nom, true, 'aller', [465, 76]);
    s += _ifrArrow('l:3', [585, 212], [575, 305], [512, 310], IFR_C.nom, true, '', null);
    s += _ifrArrow('l:3', [418, 310], [352, 305], [342, 214], IFR_C.nom, true, 'retour', [376, 296]);
    P.forEach((p, i) => {
        const big = i === 6 ? 54 : 44;
        const ly = p.y + big + 22;
        s += `<g class="ifr-st" data-k="l:${i}" style="--nc:${p.color}">
            <circle class="ifr-st-c" cx="${p.x}" cy="${p.y}" r="${big}"/>
            <text class="ifr-st-ico" x="${p.x}" y="${p.y + 2}" style="font-size:${big * 0.78}px">${p.ico}</text>
            <circle class="ifr-st-n" cx="${p.x + big * 0.74}" cy="${p.y - big * 0.74}" r="14"/>
            <text class="ifr-st-nt" x="${p.x + big * 0.74}" y="${p.y - big * 0.74 + 1}">${i + 1}</text>
            ${p.lbl.map((t, j) => `<text class="ifr-st-lbl" x="${p.x}" y="${ly + j * 21}">${t}</text>`).join('')}
        </g>`;
    });
    s += `<g class="ifr-token" style="transform:translate(${P[0].x}px,${P[0].y}px)">
        <g transform="translate(0,-74)"><circle class="ifr-token-bg" r="22"/><text class="ifr-token-t" y="2">📜</text></g></g>`;
    return s + '</svg>';
}

// ── Création du widget ────────────────────────────────────────────────────
function createInstitutionsFranceWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 700;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'institutions-france';
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
    container.className = 'ifr-container';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(800, Math.min(1220, Math.round(window.innerWidth * 0.72)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(580, Math.round(contW * 0.64));

    const header = document.createElement('div');
    header.className = 'ifr-header';
    header.innerHTML = `
        <span class="ifr-title">🏛️ Les institutions</span>
        <div class="ifr-tabs">
            <button class="ifr-tab on" data-mode="qui" title="Qui fait quoi ?"><span class="ifr-tab-long">🏛️ Qui fait quoi ?</span><span class="ifr-tab-short">🏛️ Rôles</span><span class="ifr-tab-ico">🏛️</span></button>
            <button class="ifr-tab" data-mode="elect" title="Qui choisit qui ?"><span class="ifr-tab-long">🗳️ Qui choisit qui ?</span><span class="ifr-tab-short">🗳️ Votes</span><span class="ifr-tab-ico">🗳️</span></button>
            <button class="ifr-tab" data-mode="loi" title="Le voyage d'une loi"><span class="ifr-tab-long">📜 Le voyage d'une loi</span><span class="ifr-tab-short">📜 La loi</span><span class="ifr-tab-ico">📜</span></button>
            <button class="ifr-tab" data-mode="quiz" title="Quiz"><span class="ifr-tab-long">❓ Quiz</span><span class="ifr-tab-short">❓ Quiz</span><span class="ifr-tab-ico">❓</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="ifr-help-btn" title="Aide">?</button>
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    widget.appendChild(container);
    const helpBtn = header.querySelector('.ifr-help-btn');

    // Seule la barre du haut déplace le widget
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.ifr-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : navigation et options
    const row1 = document.createElement('div');
    row1.className = 'ifr-row';
    row1.innerHTML = `
        <button class="ifr-btn ifr-prev" data-modes="qui elect loi" title="Précédent">◀ Précédent</button>
        <button class="ifr-btn ifr-next" data-modes="qui elect loi" title="Suivant">Suivant ▶</button>
        <button class="ifr-btn ifr-btn-guide" data-modes="qui elect loi" title="Présente les étapes l'une après l'autre">🎓 Visite guidée</button>
        <button class="ifr-btn ifr-all" data-modes="qui elect loi" title="Revenir à la vue d'ensemble">🔄 Vue d'ensemble</button>
        <span class="ifr-sep" data-modes="qui loi"></span>
        <button class="ifr-btn ifr-3p on" data-modes="qui" title="Afficher les 3 pouvoirs">🎨 Les 3 pouvoirs</button>
        <button class="ifr-btn ifr-ex" data-modes="loi" title="Suivre un exemple réel">📱 Un exemple réel</button>
        <button class="ifr-btn ifr-newquiz" data-modes="quiz" title="Tirer 10 nouvelles questions">🔀 Nouveau quiz</button>
        <span class="ifr-lbl" data-modes="quiz">10 questions tirées au sort parmi ${IFR_QUIZ.length}</span>
    `;
    container.appendChild(row1);
    // Ligne 2 : boutons des éléments (rempli selon l'onglet)
    const row2 = document.createElement('div');
    row2.className = 'ifr-row';
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'ifr-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'ifr-scene-wrap';
    const scQui = document.createElement('div');   scQui.className = 'ifr-scene';   scQui.innerHTML = _ifrSvgQui();
    const scElect = document.createElement('div'); scElect.className = 'ifr-scene'; scElect.innerHTML = _ifrSvgElect();
    const scLaw = document.createElement('div');   scLaw.className = 'ifr-scene';   scLaw.innerHTML = _ifrSvgLaw();
    const scQuiz = document.createElement('div');  scQuiz.className = 'ifr-scene';
    const quizBox = document.createElement('div'); quizBox.className = 'ifr-quiz';
    scQuiz.appendChild(quizBox);
    const hint = document.createElement('div');
    hint.className = 'ifr-hint';
    [scQui, scElect, scLaw, scQuiz, hint].forEach(el => sceneWrap.appendChild(el));
    const side = document.createElement('div');
    side.className = 'ifr-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'ifr-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les institutions de la France</h4>
        <p><b>🏛️ Qui fait quoi ?</b> : touche une institution (le Président, l'Assemblée nationale, le Sénat…) pour
        afficher sa fiche à droite : combien de personnes, comment elles sont choisies, pour combien de temps, où elles
        travaillent et leur rôle. Touche une colonne colorée pour découvrir un des <b>3 pouvoirs</b>.</p>
        <p><b>🗳️ Qui choisit qui ?</b> : les flèches montrent les élections (traits pleins) et les nominations
        (pointillés). Avance étape par étape avec <b>Suivant ▶</b>, ou touche une flèche ou une case.</p>
        <p><b>📜 Le voyage d'une loi</b> : suis le parchemin de l'idée jusqu'à la loi qui s'applique.
        <b>📱 Un exemple réel</b> ajoute l'histoire de la loi sur le téléphone portable à l'école (2018).</p>
        <p><b>❓ Quiz</b> : 10 questions tirées au sort, avec la correction expliquée.</p>
        <p><b>🎓 Visite guidée</b> enchaîne toute seule les étapes de l'onglet ouvert.</p>
        <p style="color:#888">Schéma simplifié pour l'école : certains rôles et certaines règles sont résumés.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'ifr-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const $ = sel => container.querySelector(sel);
    const guideBtn = $('.ifr-btn-guide'), btn3p = $('.ifr-3p'), btnEx = $('.ifr-ex');
    const tokenEl = scLaw.querySelector('.ifr-token');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'qui';
    let selQui = null;            // id d'institution, 'pow-exec'… ou null
    let stepElect = -1;           // -1 : vue d'ensemble
    let stepLoi = -1;
    let show3P = true, showEx = false;
    let guided = false, guideTimer = null;
    let quiz = null;              // { order, opts, qi, score, picked, done }

    // ── Quiz ──────────────────────────────────────────────────────────────
    function newQuiz() {
        const order = _ifrShuffle(IFR_QUIZ.map((_, i) => i)).slice(0, IFR_QUIZ_LEN);
        quiz = { order, opts: order.map(i => _ifrShuffle(IFR_QUIZ[i].o.map((_, j) => j))), qi: 0, score: 0, picked: null, done: false };
    }
    function renderQuiz() {
        if (!quiz) newQuiz();
        const n = quiz.order.length;
        if (quiz.done) {
            const sc = quiz.score;
            const ico = sc >= 9 ? '🏆' : sc >= 7 ? '🎉' : sc >= 5 ? '👍' : '💪';
            const msg = sc >= 9 ? 'Bravo, tu es un vrai citoyen expert !' : sc >= 7 ? 'Très bien ! Tu connais bien les institutions.'
                : sc >= 5 ? 'Pas mal ! Relis les fiches pour progresser.' : 'Courage ! Explore les onglets, puis réessaie.';
            quizBox.innerHTML = `<div class="ifr-q-end">${ico}</div>
                <div class="ifr-q-score">${sc} / ${n}</div>
                <div class="ifr-q-text" style="font-size:clamp(16px,2vw,22px)">${msg}</div>
                <button class="ifr-q-next" data-act="again">🔁 Rejouer avec d'autres questions</button>`;
            return;
        }
        const Q = IFR_QUIZ[quiz.order[quiz.qi]], opts = quiz.opts[quiz.qi];
        const answered = quiz.picked !== null;
        quizBox.innerHTML = `
            <div class="ifr-q-top"><span class="ifr-q-pill">Question ${quiz.qi + 1} / ${n}</span><span>⭐ Score : ${quiz.score}</span></div>
            <div class="ifr-q-prog"><div style="width:${(quiz.qi + (answered ? 1 : 0)) / n * 100}%"></div></div>
            <div class="ifr-q-text">${Q.q}</div>
            <div class="ifr-q-opts">${opts.map(j => {
                let cls = '';
                if (answered) cls = j === 0 ? 'good' : j === quiz.picked ? 'bad' : 'fade';
                return `<button class="ifr-q-opt ${cls}" data-opt="${j}" ${answered ? 'disabled' : ''}>${Q.o[j]}</button>`;
            }).join('')}</div>
            ${answered ? `<button class="ifr-q-next" data-act="next">${quiz.qi + 1 < n ? 'Question suivante ▶' : 'Voir mon score 🏁'}</button>` : ''}`;
    }
    quizBox.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b || !quiz) return;
        e.stopPropagation();
        if (b.dataset.opt !== undefined && quiz.picked === null) {
            quiz.picked = Number(b.dataset.opt);
            if (quiz.picked === 0) quiz.score++;
        } else if (b.dataset.act === 'next') {
            quiz.qi++; quiz.picked = null;
            if (quiz.qi >= quiz.order.length) { quiz.done = true; quiz.qi = quiz.order.length - 1; }
        } else if (b.dataset.act === 'again') {
            newQuiz();
        } else return;
        renderQuiz(); renderSide();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Mise à jour des scènes ────────────────────────────────────────────
    function renderQui() {
        const svg = scQui.querySelector('svg');
        svg.classList.toggle('ifr-hide3p', !show3P);
        const o = selQui && IFR_ORGANS[selQui];
        const powSel = selQui && selQui.indexOf('pow-') === 0 ? selQui.slice(4) : null;
        svg.querySelectorAll('.ifr-node').forEach(n => {
            const k = n.dataset.k;
            const on = k === selQui || (selQui === 'parlement' && (k === 'assemblee' || k === 'senat')) ||
                       (powSel && IFR_ORGANS[k] && IFR_ORGANS[k].power === powSel);
            n.classList.toggle('on', !!on);
            n.classList.toggle('dim', !!selQui && !on);
        });
        svg.querySelectorAll('.ifr-col').forEach(c => {
            const p = c.dataset.k.slice(4);
            c.classList.toggle('on', powSel === p || (o && o.power === p));
        });
        const fr = svg.querySelector('.ifr-frame-g');
        fr.classList.toggle('on', selQui === 'parlement' || powSel === 'legis');
        fr.classList.toggle('dim', !!selQui && !(selQui === 'parlement' || powSel === 'legis' || selQui === 'assemblee' || selQui === 'senat'));
    }
    function renderElect() {
        const svg = scElect.querySelector('svg');
        const st = stepElect >= 0 ? IFR_ELECT_STEPS[stepElect] : null;
        svg.querySelectorAll('.ifr-node').forEach(n => {
            const k = n.dataset.k.slice(3);
            const on = st && st.nodes.indexOf(k) >= 0;
            n.classList.toggle('on', !!on);
            n.classList.toggle('dim', !!st && !on);
        });
        svg.querySelectorAll('.ifr-arrow').forEach(a => {
            const r = IFR_ELECT_ARROWS[Number(a.dataset.k.slice(3))];
            const on = st && r.s === stepElect;
            a.classList.toggle('on', !!on);
            a.classList.toggle('dim', !!st && !on);
        });
    }
    function renderLaw() {
        const svg = scLaw.querySelector('svg');
        svg.querySelectorAll('.ifr-st').forEach(g => {
            const i = Number(g.dataset.k.slice(2));
            g.classList.toggle('on', i === stepLoi);
            g.classList.toggle('done', stepLoi >= 0 && i < stepLoi);
        });
        svg.querySelectorAll('.ifr-arrow').forEach(a => {
            a.classList.toggle('on', stepLoi === 3);
            a.classList.toggle('dim', stepLoi >= 0 && stepLoi !== 3);
        });
        const p = IFR_LAW[Math.max(0, stepLoi)];
        tokenEl.style.transform = `translate(${p.x}px,${p.y}px)`;
        tokenEl.classList.toggle('nav', stepLoi === 3);
    }

    // ── Ligne des éléments ────────────────────────────────────────────────
    function renderRow2() {
        let html = '';
        if (mode === 'qui') {
            html = '<span class="ifr-lbl">Institutions :</span>' + IFR_QUI_ORDER.map(k =>
                `<button class="ifr-btn ifr-item-btn${selQui === k ? ' on' : ''}" data-k="${k}" style="--it-c:${IFR_ORGANS[k].color}">${IFR_ORGANS[k].ico} ${IFR_QUI_SHORT[k]}</button>`).join('');
        } else if (mode === 'elect') {
            html = '<span class="ifr-lbl">Étapes :</span>' + IFR_ELECT_STEPS.map((s, i) =>
                `<button class="ifr-btn ifr-item-btn${stepElect === i ? ' on' : ''}" data-k="${i}" style="--it-c:${s.color}" title="${s.name}">${i + 1}. ${s.ico}</button>`).join('');
        } else if (mode === 'loi') {
            html = '<span class="ifr-lbl">Étapes :</span>' + IFR_LAW.map((s, i) =>
                `<button class="ifr-btn ifr-item-btn${stepLoi === i ? ' on' : ''}" data-k="${i}" style="--it-c:${s.color}" title="${s.name}">${i + 1}. ${s.ico} ${s.name}</button>`).join('');
        }
        row2.innerHTML = html;
        row2.style.display = html ? '' : 'none';
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    const listBtn = (k, color, txt, on) => `<li><button data-k="${k}" class="${on ? 'on' : ''}" style="--it-c:${color}">${txt}</button></li>`;
    function renderSide() {
        let h = '', border = '#3b8fd9';
        if (mode === 'qui') {
            const list = '<ul class="ifr-list">' + IFR_QUI_ORDER.map(k => listBtn(k, IFR_ORGANS[k].color, `${IFR_ORGANS[k].ico} ${IFR_ORGANS[k].name}`, selQui === k)).join('') +
                listBtn('', '#1d4f86', '🔄 Vue d\'ensemble', !selQui) + '</ul>';
            if (selQui && selQui.indexOf('pow-') === 0) {
                const P = IFR_POWERS[selQui.slice(4)];
                border = P.color;
                h = `<h4>Les 3 pouvoirs</h4>
                    <div class="ifr-status">${P.ico} <span style="color:${P.color}">${P.name}</span></div>
                    <p class="ifr-change">👥 ${P.who}</p>
                    <p class="ifr-text">${P.text}</p>
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${IFR_POW_KNOW}</p>`;
            } else if (selQui) {
                const o = IFR_ORGANS[selQui];
                border = o.color;
                const pw = o.power ? `<span class="ifr-pow" style="background:${IFR_POWERS[o.power].color}">${IFR_POWERS[o.power].name}</span>` : '';
                h = `<h4>Qui fait quoi ?</h4>
                    <div class="ifr-status">${o.ico} <span style="color:${o.color}">${o.name}</span></div>
                    ${pw}
                    <div class="ifr-facts">
                        <div><b>👥 Combien ?</b> ${o.count}</div>
                        <div><b>🗳️ Comment est-il choisi ?</b> ${o.how}</div>
                        <div><b>⏳ Pour combien de temps ?</b> ${o.duree}</div>
                        <div><b>📍 Où ?</b> ${o.lieu}</div>
                    </div>
                    <div class="ifr-sub">🛠️ Son rôle</div>
                    <ul>${o.roles.map(r => `<li>${r}</li>`).join('')}</ul>
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${o.know}</p>`;
            } else {
                h = `<h4>Qui fait quoi ?</h4>
                    <div class="ifr-status">🇫🇷 <span style="color:#1d4f86">La République française</span></div>
                    <p class="ifr-text">La France est une <b>République</b> et une <b>démocratie</b> : le pouvoir vient du <b>peuple</b>, qui choisit ses représentants en votant. Les règles de fonctionnement sont écrites dans la <b>Constitution</b> de 1958.</p>
                    <p class="ifr-change">Le pouvoir est partagé en <b>3 pouvoirs</b> séparés :<br>
                    <span style="color:${IFR_C.legis}">● législatif</span> : voter les lois ;<br>
                    <span style="color:${IFR_C.exec}">● exécutif</span> : les faire appliquer ;<br>
                    <span style="color:${IFR_C.judic}">● judiciaire</span> : les faire respecter.</p>
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${IFR_POW_KNOW}</p>`;
            }
            h += list;
        } else if (mode === 'elect') {
            const list = '<ul class="ifr-list">' + IFR_ELECT_STEPS.map((s, i) => listBtn(i, s.color, `${i + 1}. ${s.ico} ${s.name}`, stepElect === i)).join('') +
                listBtn(-1, '#1d4f86', '🔄 Vue d\'ensemble', stepElect < 0) + '</ul>';
            if (stepElect >= 0) {
                const s = IFR_ELECT_STEPS[stepElect];
                border = s.color;
                h = `<h4>Étape ${stepElect + 1} sur ${IFR_ELECT_STEPS.length}</h4>
                    <div class="ifr-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <p class="ifr-change">${s.change}</p>
                    <p class="ifr-text">${s.text}</p>
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>`;
            } else {
                h = `<h4>Qui choisit qui ?</h4>
                    <div class="ifr-status">🗳️ <span style="color:#1d4f86">Élire ou nommer</span></div>
                    <p class="ifr-text">Dans une démocratie, ce sont les <b>citoyens</b> qui choisissent leurs représentants. Certains sont <b>élus directement</b> par le peuple, d'autres sont <b>élus par des élus</b>, et d'autres encore sont <b>nommés</b>.</p>
                    <div class="ifr-legend">
                        <div><span style="border-color:${IFR_C.vote}"></span>élu par un vote</div>
                        <div><span style="border-color:${IFR_C.nom};border-top-style:dashed"></span>nommé (choisi)</div>
                        <div><span style="border-color:${IFR_C.ctr};border-top-style:dashed"></span>contre-pouvoir</div>
                    </div>
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> « Suffrage » veut dire « vote ». Le <b>suffrage universel</b>, c'est le droit de vote pour tous les citoyens adultes.</p>`;
            }
            h += list;
        } else if (mode === 'loi') {
            const list = '<ul class="ifr-list">' + IFR_LAW.map((s, i) => listBtn(i, s.color, `${i + 1}. ${s.ico} ${s.name}`, stepLoi === i)).join('') +
                listBtn(-1, '#1d4f86', '🔄 Vue d\'ensemble', stepLoi < 0) + '</ul>';
            if (stepLoi >= 0) {
                const s = IFR_LAW[stepLoi];
                border = s.color;
                h = `<h4>Étape ${stepLoi + 1} sur ${IFR_LAW.length}</h4>
                    <div class="ifr-status">${s.ico} <span style="color:${s.color}">${s.name}</span></div>
                    <p class="ifr-change">${s.change}</p>
                    <p class="ifr-text">${s.text}</p>
                    ${showEx ? `<p class="ifr-ex">📱 <b>Exemple réel :</b> ${s.ex}</p>` : ''}
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>`;
            } else {
                h = `<h4>Le voyage d'une loi</h4>
                    <div class="ifr-status">📜 <span style="color:#1d4f86">Qui fait les lois ?</span></div>
                    <p class="ifr-text">${IFR_LAW_OVERVIEW.text}</p>
                    ${showEx ? `<p class="ifr-ex">📱 <b>Exemple réel :</b> la loi du 3 août 2018 qui interdit le téléphone portable à l'école et au collège. Suis-la étape par étape !</p>` : ''}
                    <p class="ifr-know">💡 <b>Le savais-tu ?</b> ${IFR_LAW_OVERVIEW.know}</p>`;
            }
            h += list;
        } else {
            border = '#8e5bd6';
            if (!quiz) newQuiz();
            if (quiz.done) {
                h = `<h4>Quiz terminé</h4>
                    <div class="ifr-status">🏁 <span style="color:#8e5bd6">${quiz.score} bonne${quiz.score > 1 ? 's' : ''} réponse${quiz.score > 1 ? 's' : ''} sur ${quiz.order.length}</span></div>
                    <p class="ifr-text">Pour revoir une notion, ouvre l'onglet <b>🏛️ Qui fait quoi ?</b>, <b>🗳️ Qui choisit qui ?</b> ou <b>📜 Le voyage d'une loi</b>.</p>`;
            } else if (quiz.picked !== null) {
                const Q = IFR_QUIZ[quiz.order[quiz.qi]];
                const ok = quiz.picked === 0;
                border = ok ? '#2f9e6e' : '#e0335c';
                h = `<h4>Correction</h4>
                    <div class="ifr-status" style="color:${border}">${ok ? '✅ Bonne réponse !' : '❌ Ce n\'est pas ça.'}</div>
                    <p class="ifr-change">La bonne réponse : <b>${Q.o[0]}</b></p>
                    <p class="ifr-text">${Q.e}</p>`;
            } else {
                h = `<h4>Quiz</h4>
                    <div class="ifr-status">❓ <span style="color:#8e5bd6">À toi de jouer !</span></div>
                    <p class="ifr-text">Lis la question et touche la bonne réponse. La correction s'affiche ici, avec une explication.</p>
                    <p class="ifr-know">💡 Astuce : on peut jouer en classe entière, chacun note sa réponse sur l'ardoise avant de toucher l'écran.</p>`;
            }
        }
        side.style.borderLeftColor = border;
        side.innerHTML = h;
    }

    function renderAll() {
        if (mode === 'qui') renderQui();
        else if (mode === 'elect') renderElect();
        else if (mode === 'loi') renderLaw();
        else renderQuiz();
        renderRow2();
        renderSide();
    }

    // ── Sélection, navigation, visite guidée ──────────────────────────────
    function select(v) {
        if (mode === 'qui') selQui = v || null;
        else if (mode === 'elect') stepElect = Math.max(-1, Math.min(IFR_ELECT_STEPS.length - 1, Number(v)));
        else if (mode === 'loi') stepLoi = Math.max(-1, Math.min(IFR_LAW.length - 1, Number(v)));
        renderAll();
    }
    function step(dir) {
        if (mode === 'qui') {
            const i = IFR_QUI_ORDER.indexOf(selQui), n = IFR_QUI_ORDER.length;
            select(IFR_QUI_ORDER[i < 0 ? (dir > 0 ? 0 : n - 1) : (i + dir + n) % n]);
        } else if (mode === 'elect') {
            const n = IFR_ELECT_STEPS.length;
            select(stepElect < 0 ? (dir > 0 ? 0 : n - 1) : (stepElect + dir + n) % n);
        } else if (mode === 'loi') {
            const n = IFR_LAW.length;
            select(stepLoi < 0 ? (dir > 0 ? 0 : n - 1) : (stepLoi + dir + n) % n);
        }
    }
    function setGuided(v) {
        guided = !!v && mode !== 'quiz';
        guideBtn.classList.toggle('on', guided);
        guideBtn.textContent = guided ? '⏹ Arrêter la visite' : '🎓 Visite guidée';
        clearInterval(guideTimer); guideTimer = null;
        if (guided) {
            select(mode === 'qui' ? IFR_QUI_ORDER[0] : 0);
            guideTimer = setInterval(() => {
                if (!document.body.contains(widget)) { clearInterval(guideTimer); return; }
                step(1);
            }, 9000);
        }
    }
    function userAct() { if (guided) setGuided(false); }

    function setMode(m) {
        mode = ['qui', 'elect', 'loi', 'quiz'].indexOf(m) >= 0 ? m : 'qui';
        if (guided) setGuided(false);
        header.querySelectorAll('.ifr-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        row1.querySelectorAll('[data-modes]').forEach(el => {
            el.style.display = el.dataset.modes.split(' ').indexOf(mode) >= 0 ? '' : 'none';
        });
        scQui.classList.toggle('show', mode === 'qui');
        scElect.classList.toggle('show', mode === 'elect');
        scLaw.classList.toggle('show', mode === 'loi');
        scQuiz.classList.toggle('show', mode === 'quiz');
        sceneWrap.style.background = mode === 'elect' ? '#f5f3fb' : mode === 'loi' ? '#f4f8f1' : '#f3f6fb';
        hint.textContent = mode === 'qui' ? 'Touche une institution ou une colonne colorée pour l\'expliquer'
            : mode === 'elect' ? 'Traits pleins : élu par un vote · pointillés : nommé · touche une flèche ou une case'
            : mode === 'loi' ? 'Touche une étape, ou avance avec Suivant ▶' : '';
        hint.style.display = mode === 'quiz' ? 'none' : '';
        renderAll();
    }

    // ── Interaction sur la scène (souris, doigt, stylet) ──────────────────
    const TAP_TOL = 20;
    let tap = null;
    const stop = e => e.stopPropagation();
    sceneWrap.addEventListener('mousedown', stop);
    sceneWrap.addEventListener('touchstart', stop, { passive: true });
    sceneWrap.addEventListener('contextmenu', e => e.preventDefault());
    [scQui, scElect, scLaw].forEach(sc => {
        sc.addEventListener('pointerdown', e => {
            if (e.button !== undefined && e.button > 0) return;
            e.stopPropagation();
            if (typeof bringToFront === 'function') bringToFront(widget);
            helpPopup.classList.remove('show');
            const t = e.target.closest('[data-k]');
            tap = { id: e.pointerId, x: e.clientX, y: e.clientY, k: t ? t.dataset.k : null };
        });
        sc.addEventListener('pointerup', e => {
            if (!tap || tap.id !== e.pointerId) return;
            const t = tap; tap = null;
            if (Math.hypot(e.clientX - t.x, e.clientY - t.y) > TAP_TOL) return;
            onTap(t.k);
        });
        sc.addEventListener('pointercancel', () => { tap = null; });
    });
    function onTap(k) {
        userAct();
        if (mode === 'qui') {
            select(!k || k === selQui ? null : k);
        } else if (mode === 'elect') {
            let s = -1;
            if (k && k.indexOf('ea:') === 0) s = IFR_ELECT_ARROWS[Number(k.slice(3))].s;
            else if (k && k.indexOf('en:') === 0) s = IFR_ELECT_NODE_STEP[k.slice(3)];
            select(s === stepElect ? -1 : s);
        } else if (mode === 'loi') {
            const s = k && k.indexOf('l:') === 0 ? Number(k.slice(2)) : -1;
            select(s === stepLoi ? -1 : s);
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, row2, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button')) e.stopPropagation(); }, { passive: true });
    });
    side.addEventListener('pointerdown', stop);
    side.addEventListener('mousedown', stop);
    side.addEventListener('touchstart', stop, { passive: true });
    side.addEventListener('click', e => {
        const b = e.target.closest('button[data-k]');
        if (!b) return;
        e.stopPropagation();
        userAct();
        select(b.dataset.k);
        if (typeof saveBoard === 'function') saveBoard();
    });
    row2.addEventListener('click', e => {
        const b = e.target.closest('button[data-k]');
        if (!b) return;
        e.stopPropagation();
        userAct();
        const k = b.dataset.k;
        const cur = mode === 'qui' ? selQui : String(mode === 'elect' ? stepElect : stepLoi);
        select(k === cur ? (mode === 'qui' ? null : -1) : k);
        if (typeof saveBoard === 'function') saveBoard();
    });
    header.querySelectorAll('.ifr-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    $('.ifr-prev').addEventListener('click', () => { userAct(); step(-1); saveBoard(); });
    $('.ifr-next').addEventListener('click', () => { userAct(); step(1); saveBoard(); });
    $('.ifr-all').addEventListener('click', () => { userAct(); select(mode === 'qui' ? null : -1); saveBoard(); });
    guideBtn.addEventListener('click', () => setGuided(!guided));
    btn3p.addEventListener('click', () => { show3P = !show3P; btn3p.classList.toggle('on', show3P); renderAll(); saveBoard(); });
    btnEx.addEventListener('click', () => { showEx = !showEx; btnEx.classList.toggle('on', showEx); renderAll(); saveBoard(); });
    $('.ifr-newquiz').addEventListener('click', () => { newQuiz(); renderAll(); saveBoard(); });

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
    function updateNarrow() {
        const w = container.clientWidth;
        container.classList.toggle('ifr-narrow', w > 0 && w < 1040);
        container.classList.toggle('ifr-tiny', w > 0 && w < 720);
        container.classList.toggle('ifr-micro', w > 0 && w < 520);
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
            updateNarrow();
        });
        ro.observe(container);
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
            window._wfMiniBarCollapse(widget, '🏛️ Les institutions de la France', {
                onExpand: () => requestAnimationFrame(() => { applySize(); updateNarrow(); renderAll(); })
            });
        }
    });
    wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        requestAnimationFrame(updateNarrow);
    });
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        cleanup();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });
    function cleanup() {
        clearInterval(guideTimer); guideTimer = null; guided = false;
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
    newQuiz();
    setMode('qui');
    requestAnimationFrame(updateNarrow);

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._ifrGetData = () => ({
        containerW: contW, containerH: contH,
        mode, selQui, stepElect, stepLoi, show3P, showEx,
        quiz: quiz ? { order: quiz.order.slice(), opts: quiz.opts.map(o => o.slice()), qi: quiz.qi, score: quiz.score, picked: quiz.picked, done: quiz.done } : null
    });
    widget._ifrSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.selQui === 'string' && (IFR_ORGANS[d.selQui] || IFR_POWERS[d.selQui.replace('pow-', '')])) selQui = d.selQui;
        if (typeof d.stepElect === 'number') stepElect = Math.max(-1, Math.min(IFR_ELECT_STEPS.length - 1, Math.round(d.stepElect)));
        if (typeof d.stepLoi === 'number') stepLoi = Math.max(-1, Math.min(IFR_LAW.length - 1, Math.round(d.stepLoi)));
        if (typeof d.show3P === 'boolean') { show3P = d.show3P; btn3p.classList.toggle('on', show3P); }
        if (typeof d.showEx === 'boolean') { showEx = d.showEx; btnEx.classList.toggle('on', showEx); }
        const q = d.quiz;
        if (q && Array.isArray(q.order) && q.order.length && Array.isArray(q.opts) &&
            q.order.every(i => IFR_QUIZ[i]) && q.opts.length === q.order.length) {
            quiz = {
                order: q.order.slice(), opts: q.opts.map(o => o.slice()),
                qi: Math.max(0, Math.min(q.order.length - 1, q.qi | 0)),
                score: Math.max(0, q.score | 0),
                picked: typeof q.picked === 'number' ? q.picked : null,
                done: !!q.done
            };
        }
        setMode(d.mode || 'qui');
        requestAnimationFrame(updateNarrow);
    };

    // Sur téléphone et tablette, ouverture directe en plein écran (bouton vert)
    window._wfAutoMaxPhoneTablet(widget, () => wfMax.click(), () => _isMax, '_ifrSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
window.createInstitutionsFranceWidget = createInstitutionsFranceWidget;
