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
// WIDGET INTERNET ET LES SERVEURS — Le Bureau du Prof
// Trois onglets, pour des élèves de CM1 – CM2 :
//  🚀 Le voyage d'une page : on suit, en 8 étapes, ce qui se passe quand on
//     tape l'adresse d'un site : l'annuaire (DNS) donne l'adresse IP, la
//     demande part par la box et les routeurs jusqu'au serveur, la page est
//     découpée en paquets qui reviennent par des chemins différents, puis le
//     navigateur les remet dans l'ordre. Des loupes montrent l'écran,
//     l'annuaire et le serveur. Une frise permet d'aller à une étape.
//  🕸️ Le réseau : une coupe du réseau (maison, box, antenne relais, câbles
//     en fibre, routeurs, câble sous-marin, data center, serveur). On touche
//     une partie pour l'expliquer ; trois vues : Internet (le réseau),
//     le web (les pages), les autres services.
//  📦 Les paquets : le serveur envoie une image découpée en paquets
//     numérotés. On coupe des câbles en les touchant : les routeurs
//     trouvent un autre chemin, un paquet perdu est renvoyé, et
//     l'ordinateur remet les morceaux dans l'ordre.
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
    if (!document.getElementById('internet-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'internet-cursors-style';
        _cs.textContent = [
            /* Ces leçons ont déjà leurs règles de curseur : on les complète */
            '.widget[data-type="internet"] { cursor: default; }',
            '.widget[data-type="internet"] .drag-handle, .widget[data-type="internet"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="internet"] .drag-handle:active, .widget[data-type="internet"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            /* En plein écran le widget ne se déplace plus : flèche sur la barre */
            '.widget[data-type="internet"] .inet-container.wf-fullboard .inet-header, .widget[data-type="internet"] .inet-container.wf-fullboard .inet-header:active, .widget[data-type="internet"] .inet-container.wf-fullboard .inet-header *:not(button):not(button *),',
            '.widget.phone-fs[data-type="internet"] .inet-header, .widget.phone-fs[data-type="internet"] .inet-header *:not(button):not(button *) { cursor: default !important; }',
            /* Tout ce qui se clique : doigt qui pointe */
            '.widget[data-type="internet"] button:not(:disabled), .widget[data-type="internet"] button:not(:disabled) *, .widget[data-type="internet"] select,',
            '.widget[data-type="internet"] .widget-menu-handle, .widget[data-type="internet"] .widget-pin-handle,',
            '.widget[data-type="internet"] .widget-back-handle, .widget[data-type="internet"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="internet"] button:disabled, .widget[data-type="internet"] button:disabled * { cursor: default !important; }',
            /* En plein écran, un widget pivoté fausserait la position fixe */
            '.widget[data-type="internet"]:has(.inet-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    if (document.getElementById('inet-style')) return;
    const s = document.createElement('style');
    s.id = 'inet-style';
    s.textContent = `
        .widget[data-type="internet"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .inet-container {
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
        .inet-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .inet-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .inet-header .wf-btns { gap: 8px; }
        .inet-header .wf-btn { width: 18px; height: 18px; }
        .inet-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .inet-container.wf-fullboard {
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
        .inet-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .inet-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .inet-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .inet-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .inet-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .inet-btn:hover { background: #e0e0e0; }
        .inet-btn:active { transform: scale(0.96); }
        .inet-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .inet-btn-play { min-width: 112px; }
        .inet-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .inet-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .inet-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .inet-stage-btn, .inet-part-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .inet-stage-btn.on, .inet-part-btn.on { background: var(--st-c, #3b8fd9); border-color: var(--st-c, #3b8fd9); color: #fff; }
        .inet-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 200px; min-width: 180px; }
        .inet-slider { flex: 1; height: 30px; accent-color: #3b82f6; cursor: pointer; touch-action: none; }
        .inet-val { font-size: 13px; font-weight: 800; color: #1d4f86; min-width: 70px; text-align: right; white-space: nowrap; }

        /* Corps */
        .inet-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .inet-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #eaf2fb;
        }
        .inet-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .inet-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: rgba(255,255,255,.92); pointer-events: none;
            text-shadow: 0 1px 2px rgba(0,0,0,.6);
        }
        .inet-container .inet-hint { color: #4b5563; text-shadow: 0 1px 0 rgba(255,255,255,.8); }
        .inet-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #3b82f6;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .inet-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #1d4f86; }
        .inet-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .inet-change { background: #e8f1fd; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1e3a6e; font-weight: 700; }
        .inet-badge { display: inline-block; border-radius: 999px; padding: 1px 9px; font-size: .85em; font-weight: 800; color: #fff; margin: 0 0 6px; }
        .inet-text { margin: 0 0 6px; }
        .inet-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .inet-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .inet-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .inet-steps button.on { background: var(--st-c, #3b8fd9); color: #fff; }
        .inet-pots { list-style: none; margin: 0 0 6px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .inet-pots li { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 5px 8px; font-size: .95em; }
        .inet-pots .ok { color: #2e7d32; font-weight: 800; }
        .inet-pots .ko { color: #c0392b; font-weight: 800; }
        .inet-pots .wait { color: #6b7280; font-weight: 700; }

        /* Aide */
        .inet-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .inet-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 380px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
            max-height: calc(100% - 70px); overflow-y: auto;
        }
        .inet-help-popup.show { display: block; }
        .inet-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .inet-help-popup p { margin: 0 0 6px; }

        .inet-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .inet-resize-handle:hover { opacity: 1; }
        .inet-container:not([data-mode="voyage"]) .inet-only-voyage { display: none !important; }
        .inet-container:not([data-mode="reseau"]) .inet-only-reseau { display: none !important; }
        .inet-container:not([data-mode="paquets"]) .inet-only-paquets { display: none !important; }
        .inet-container[data-mode="paquets"] .inet-hide-paquets { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .inet-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .inet-tab-short { display: none; }
        .inet-header { min-width: 0; max-width: 100%; }
        .inet-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .inet-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .inet-header .wf-btns { flex-shrink: 0; }
        .inet-container.wf-fullboard .inet-resize-handle { display: none; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .inet-container { padding: 10px 10px 8px; gap: 6px; }
            .inet-header { gap: 6px; }
            .inet-title { font-size: 13px; }
            .inet-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .inet-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .inet-row > * { flex-shrink: 0; }
            .inet-row + .inet-row { flex-wrap: wrap; overflow: visible; }
            .inet-row + .inet-row .inet-lbl:first-child { display: none; }
            .inet-slider-box { flex: 1 1 160px; min-width: 0; }
            .inet-val { min-width: 0; }
            .inet-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .inet-btn-play { min-width: 0; }
            .inet-sep { display: none; }
            .inet-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .inet-side { padding: 8px 10px; font-size: 13px; }
            .inet-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 560px) {
            .inet-title { display: none; }
            .inet-tab { padding: 3px 7px; font-size: 11.5px; }
            .inet-tab-long { display: none; }
            .inet-tab-short { display: inline; }
            .inet-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 600px) and (orientation: portrait) {
            .inet-body { flex-direction: column; }
            .inet-slider-box { flex: 1 1 100%; }
            .inet-scene-wrap { flex: 1 1 0; min-height: 240px; }
            .inet-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 600px) and (orientation: landscape) {
            .inet-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }

        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable */
        .widget[data-type="internet"], .inet-container, .inet-container * { cursor: default !important; }
        .inet-container .inet-header, .inet-container .inet-header * { cursor: grab !important; }
        .inet-container .inet-header:active, .inet-container .inet-header:active * { cursor: grabbing !important; }
        .inet-container button, .inet-container button *, .inet-container .inet-header button,
        .inet-container .inet-header button *,
        .inet-container input[type="range"] { cursor: pointer !important; }
        .inet-container button:disabled, .inet-container button:disabled *,
        .inet-container .inet-canvas { cursor: default !important; }
        .inet-container .inet-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les autres leçons ── */
        .inet-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .inet-title {
            font-size: 21px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .inet-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .inet-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .inet-help-popup { top: 56px; }
        .inet-container.wf-fullboard .inet-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .inet-container.wf-fullboard .inet-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .inet-title { font-size: 17px; }
        }
        .inet-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .inet-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 13px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .inet-tab:hover { background: rgba(255,255,255,.1); }
        .inet-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .inet-header { flex-wrap: nowrap; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .inet-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .inet-container.wf-fullboard .inet-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .inet-tab { padding: 3px 10px; font-size: 12px; }
            .inet-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .inet-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────
const INET_URL = 'www.ecole-des-animaux.fr';
const INET_IP = '185.42.17.8';
const INET_PAQ_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

// rep : moment « représentatif » de l'étape, affiché quand on y saute à l'arrêt
const INET_STEPS = [
    {
        id: 'adresse', ico: '⌨️', name: "L'adresse", title: "Je tape l'adresse du site", color: '#3b82f6', rep: 0.85,
        change: `Dans le navigateur, je tape l'adresse du site que je veux voir.`,
        text: `Pour aller sur un site, on utilise un <b>navigateur</b> (Chrome, Firefox, Safari, Edge…). On tape l'<b>adresse</b> du site, par exemple <b>${INET_URL}</b>. On peut aussi cliquer sur un <b>lien</b> ou passer par un <b>moteur de recherche</b>. Mais l'ordinateur ne sait pas encore où se trouve ce site !`,
        know: `Le tout premier site web a été créé en 1991 par Tim Berners-Lee, un chercheur du CERN, près de Genève. C'est lui qui a inventé le web.`
    },
    {
        id: 'dns', ico: '📒', name: "L'annuaire", title: "L'annuaire d'internet (DNS)", color: '#7c3aed', rep: 0.5,
        change: `Un annuaire transforme le nom du site en un numéro : l'adresse IP.`,
        text: `Sur internet, chaque machine a un numéro, un peu comme un numéro de téléphone : c'est son <b>adresse IP</b> (ici <b>${INET_IP}</b>). Les numéros sont difficiles à retenir, alors on utilise des noms. L'ordinateur demande à un <b>annuaire</b>, qu'on appelle le <b>DNS</b> : « Quel est le numéro de ce site ? ». L'annuaire lui répond.`,
        know: `C'est comme le répertoire d'un téléphone : on cherche « Mamie » et le téléphone trouve son numéro tout seul.`
    },
    {
        id: 'demande', ico: '📶', name: 'La demande part', title: 'La demande part par la box', color: '#0284c7', rep: 0.55,
        change: `L'ordinateur envoie sa demande à la box, par le wifi.`,
        text: `L'ordinateur écrit un petit message : « Bonjour, peux-tu m'envoyer ta page d'accueil ? ». Il l'envoie à la <b>box</b> de la maison grâce à des <b>ondes</b> invisibles (le <b>wifi</b>) ou par un câble. La box est la porte d'entrée de la maison vers internet.`,
        know: `Le wifi utilise des ondes radio, un peu comme la radio de la voiture, mais elles ne portent pas très loin : quelques dizaines de mètres seulement.`
    },
    {
        id: 'voyage', ico: '🔀', name: 'Le voyage', title: 'Le voyage dans le réseau', color: '#d97706', rep: 0.5,
        change: `La demande saute de routeur en routeur jusqu'au serveur.`,
        text: `Depuis la box, le message part dans des <b>câbles</b>, souvent en <b>fibre optique</b> : l'information y voyage sous forme de <b>lumière</b>. Il passe par des <b>routeurs</b> : ce sont des aiguilleurs qui lisent l'adresse IP et envoient le message dans la bonne direction, comme les panneaux sur la route.`,
        know: `Internet, c'est un immense filet de câbles qui relie des milliards d'appareils dans le monde. Son nom veut dire « des réseaux reliés entre eux ».`
    },
    {
        id: 'serveur', ico: '🗄️', name: 'Le serveur', title: 'Le serveur reçoit la demande', color: '#059669', rep: 0.75,
        change: `Le serveur reçoit la demande et trouve la page.`,
        text: `Le message arrive dans un <b>data center</b>, un grand bâtiment rempli d'ordinateurs spéciaux : les <b>serveurs</b>. Un serveur n'a ni écran ni clavier. Il reste allumé jour et nuit et attend les demandes. Il cherche la page dans sa mémoire et la « sert », comme un serveur au restaurant apporte le plat commandé !`,
        know: `Les serveurs chauffent beaucoup : de grandes climatisations les refroidissent. Les data centers consomment énormément d'électricité.`
    },
    {
        id: 'decoupe', ico: '✂️', name: 'Les paquets', title: 'La page est découpée en paquets', color: '#dc2626', rep: 0.6,
        change: `Le serveur découpe la page en petits paquets numérotés.`,
        text: `Une page web (textes, images, vidéos) est trop grosse pour voyager d'un seul bloc. Le serveur la découpe en petits morceaux : les <b>paquets</b>. Sur chaque paquet, il écrit l'<b>adresse</b> de l'ordinateur qui a fait la demande et un <b>numéro</b>, pour pouvoir remettre les morceaux dans l'ordre à l'arrivée.`,
        know: `Une seule photo peut être découpée en des centaines de paquets !`
    },
    {
        id: 'retour', ico: '📦', name: 'Le retour', title: 'Le retour des paquets', color: '#db2777', rep: 0.45,
        change: `Les paquets reviennent, chacun par son propre chemin.`,
        text: `Les paquets repartent vers la maison. Ils ne prennent pas forcément tous le même chemin : chaque routeur choisit une route libre à ce moment-là. Si un câble est en panne, les paquets passent ailleurs. Essaie dans l'onglet <b>📦 Les paquets</b> !`,
        know: `Les paquets voyagent très vite : ils pourraient faire le tour de la Terre en environ un cinquième de seconde.`
    },
    {
        id: 'affichage', ico: '🖥️', name: "L'affichage", title: 'La page s\'affiche', color: '#4f46e5', rep: 0.92,
        change: `Le navigateur remet les paquets dans l'ordre et affiche la page.`,
        text: `Les paquets passent par la box et arrivent dans l'ordinateur. Le <b>navigateur</b> les remet dans l'ordre grâce à leurs <b>numéros</b>, comme un puzzle. S'il en manque un, il le redemande. Puis il affiche la page à l'écran. Tout ce voyage a duré… <b>moins d'une seconde</b> !`,
        know: `Chaque fois que tu cliques sur un lien, tout recommence : une nouvelle demande, un nouveau voyage, de nouveaux paquets.`
    }
];
const INET_OVERVIEW = {
    text: `Quand tu regardes un site, ton ordinateur (le <b>client</b>) demande une page à un ordinateur lointain (le <b>serveur</b>). La <b>demande</b> voyage dans le réseau <b>internet</b>, puis la <b>réponse</b> revient, découpée en <b>paquets</b>. Internet, c'est un grand échange de messages entre machines.`,
    other: `🛡️ <b>Bon réflexe</b> : tout le monde peut publier sur le web. Une information trouvée sur internet n'est pas forcément vraie : on la vérifie dans plusieurs sources et on demande à un adulte en cas de doute.`,
    know: `Plus de 5 milliards de personnes utilisent internet dans le monde, soit plus de la moitié des habitants de la planète.`
};
const INET_PARTS = {
    appareils: {
        ico: '💻', name: 'Les appareils', color: '#2563eb', role: 'demander et afficher les pages',
        text: `Ordinateurs, tablettes, téléphones, consoles, télévisions… Tous ces appareils peuvent se connecter à internet. Quand ils demandent une page ou une vidéo, on les appelle des <b>clients</b> : le client demande, le serveur répond.`,
        know: `Aujourd'hui, même des objets se connectent à internet : montres, enceintes, réfrigérateurs… On parle d'« objets connectés ».`
    },
    box: {
        ico: '📶', name: 'La box', color: '#0284c7', role: 'relier la maison à internet',
        text: `La <b>box</b> relie tous les appareils de la maison à internet. Elle leur parle par le <b>wifi</b> (des ondes) ou par des câbles, et elle envoie tout vers l'extérieur par la fibre ou la ligne de téléphone. C'est l'<b>opérateur</b> (le fournisseur d'accès) qui la fournit, en échange d'un abonnement.`,
        know: `La box est en fait un petit routeur : elle aiguille les paquets vers le bon appareil de la maison.`
    },
    antenne: {
        ico: '📡', name: "L'antenne relais", color: '#9333ea', role: 'relier les téléphones sans fil',
        text: `Dehors, loin de la box, le téléphone se connecte à une <b>antenne relais</b> par des ondes : c'est la <b>4G</b> ou la <b>5G</b>. L'antenne est elle-même reliée au réseau par des câbles.`,
        know: `En France, il y a des dizaines de milliers d'antennes relais, souvent posées sur les toits ou sur de grands pylônes.`
    },
    cables: {
        ico: '〰️', name: 'Les câbles', color: '#d97706', role: "transporter l'information",
        text: `Internet, ce sont surtout des <b>câbles</b>, enterrés sous les rues. Les plus rapides sont en <b>fibre optique</b> : des fils de verre plus fins qu'un cheveu, dans lesquels l'information voyage sous forme de <b>lumière</b> qui s'allume et s'éteint très, très vite.`,
        know: `La lumière va si vite dans la fibre qu'elle pourrait faire 5 fois le tour de la Terre en une seule seconde !`
    },
    routeurs: {
        ico: '🔀', name: 'Les routeurs', color: '#ea580c', role: 'aiguiller les paquets',
        text: `Les <b>routeurs</b> sont des machines placées aux croisements du réseau. Ils lisent l'adresse écrite sur chaque paquet et l'envoient vers le bon câble, comme un agent de la circulation à un carrefour.`,
        know: `Un gros routeur peut aiguiller des millions de paquets chaque seconde.`
    },
    sousmarin: {
        ico: '🌊', name: 'Le câble sous-marin', color: '#0891b2', role: 'relier les continents',
        text: `Pour aller d'un continent à l'autre, l'information traverse les océans dans d'énormes <b>câbles sous-marins</b>, posés au fond de la mer par des bateaux spéciaux. Presque tout internet passe par eux, bien plus que par les satellites.`,
        know: `Il existe plus de 500 câbles sous-marins dans le monde. Mis bout à bout, ils feraient plus de 30 fois le tour de la Terre !`
    },
    datacenter: {
        ico: '🏢', name: 'Le data center', color: '#059669', role: 'abriter les serveurs',
        text: `Un <b>data center</b> (centre de données) est un grand bâtiment protégé qui contient des milliers de serveurs rangés dans des armoires. Il lui faut de l'électricité jour et nuit, des climatiseurs pour refroidir les machines et des gardiens.`,
        know: `Le numérique consomme beaucoup d'énergie. Supprimer les photos et les vidéos inutiles stockées en ligne, c'est un petit geste pour la planète.`
    },
    serveur: {
        ico: '🗄️', name: 'Le serveur', color: '#047857', role: 'garder et envoyer les pages',
        text: `Un <b>serveur</b> est un ordinateur sans écran, allumé en permanence. Il garde en mémoire des pages web, des vidéos, des jeux, des messages… et les envoie à tous les clients qui les demandent. Un seul serveur peut répondre à des milliers de personnes en même temps.`,
        know: `Quand on range une photo « dans le cloud » (le nuage), elle n'est pas dans le ciel : elle est sur un serveur, dans un data center !`
    }
};
const INET_PART_ORDER = ['appareils', 'box', 'antenne', 'cables', 'routeurs', 'sousmarin', 'datacenter', 'serveur'];
const INET_VIEWS = {
    internet: { ico: '🛣️', name: 'Internet, c\'est le réseau', color: '#d97706',
        text: `<b>Internet</b>, c'est le <b>réseau</b> : tous les câbles, les antennes, les routeurs et les machines reliés entre eux dans le monde entier. C'est comme les <b>routes</b> d'un pays.` },
    web: { ico: '📄', name: 'Le web, ce sont les pages', color: '#2563eb',
        text: `Le <b>web</b>, ce sont les <b>sites</b> et les <b>pages</b> que l'on regarde avec un navigateur, reliées entre elles par des <b>liens</b>. Le web utilise internet pour voyager : si internet, ce sont les routes, le web, ce sont les camions qui livrent les pages.` },
    services: { ico: '✉️', name: 'Les autres services', color: '#db2777',
        text: `Internet ne sert pas qu'au web : on l'utilise aussi pour les <b>courriels</b> (e-mails), les <b>appels vidéo</b>, les <b>jeux en ligne</b>, les <b>messageries</b>… Tous utilisent les mêmes câbles et voyagent en paquets.` }
};
const INET_RESEAU_OVERVIEW = {
    text: `De la maison jusqu'au serveur, l'information traverse tout un <b>réseau</b> : la box ou l'antenne relais, des câbles sous les rues, des routeurs, parfois un câble au fond de l'océan, puis un data center où se trouvent les serveurs.`,
    know: `Internet n'appartient à personne en particulier : il est fait de milliers de réseaux (opérateurs, entreprises, universités) qui ont accepté de se relier entre eux.`
};
const INET_PAQ_GRID = { 4: [2, 2], 6: [3, 2], 9: [3, 3] };

// ── Petites fonctions utiles ──────────────────────────────────────────────
function _inetClamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
function _inetLerp(a, b, t) { return a + (b - a) * t; }
function _inetSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

// ── Création du widget ────────────────────────────────────────────────────
function createInternetWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'internet';
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
    container.className = 'inet-container';
    container.dataset.mode = 'voyage';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'inet-header';
    header.innerHTML = `
        <span class="inet-title">🌐<span> Internet et les serveurs</span></span>
        <div class="inet-tabs">
            <button class="inet-tab on" data-mode="voyage" title="Le voyage d'une page web"><span class="inet-tab-long">🚀 Le voyage d'une page</span><span class="inet-tab-short">🚀 Voyage</span></button>
            <button class="inet-tab" data-mode="reseau" title="Le réseau internet"><span class="inet-tab-long">🕸️ Le réseau</span><span class="inet-tab-short">🕸️ Réseau</span></button>
            <button class="inet-tab" data-mode="paquets" title="Les paquets"><span class="inet-tab-long">📦 Les paquets</span><span class="inet-tab-short">📦 Paquets</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'inet-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres leçons)
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.inet-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : lecture, options
    const row1 = document.createElement('div');
    row1.className = 'inet-row';
    row1.innerHTML = `
        <button class="inet-btn inet-btn-play" title="Lancer / arrêter l'animation">▶ Lecture</button>
        <button class="inet-btn inet-btn-speed" title="Vitesse de l'animation">🐢 Lent</button>
        <span class="inet-sep"></span>
        <button class="inet-btn inet-prev inet-only-voyage" title="Étape précédente">◀ Étape</button>
        <button class="inet-btn inet-next inet-only-voyage" title="Étape suivante">Étape ▶</button>
        <button class="inet-btn inet-all inet-only-voyage" title="Voir tout le voyage">🔄 Vue d'ensemble</button>
        ${Object.keys(INET_VIEWS).map(k => `<button class="inet-btn inet-view inet-only-reseau" data-view="${k}" title="${INET_VIEWS[k].name}">${INET_VIEWS[k].ico} ${k === 'internet' ? 'Internet = le réseau' : k === 'web' ? 'Le web = les pages' : 'Les autres services'}</button>`).join('')}
        <button class="inet-btn inet-reset inet-only-paquets" title="Remettre les paquets au départ">🔄 Recommencer</button>
        <button class="inet-btn inet-repair inet-only-paquets" title="Réparer tous les câbles coupés">🔧 Réparer les câbles</button>
        <span class="inet-lbl inet-only-paquets">📦 Paquets :</span>
        ${[4, 6, 9].map(n => `<button class="inet-btn inet-npaq inet-only-paquets" data-n="${n}" title="Découper l'image en ${n} paquets">${n}</button>`).join('')}
        <span class="inet-sep"></span>
        <button class="inet-btn inet-labels on" title="Afficher les noms">🏷️ Étiquettes</button>
        <button class="inet-btn inet-frise inet-only-voyage on" title="Afficher la frise des étapes">🧭 Frise des étapes</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : étapes (voyage) / parties (réseau) / état (paquets)
    const row2 = document.createElement('div');
    row2.className = 'inet-row';
    row2.innerHTML = `
        <span class="inet-lbl inet-only-voyage">Étapes :</span>
        ${INET_STEPS.map((s, i) => `<button class="inet-btn inet-stage-btn inet-only-voyage" data-stage="${i}" style="--st-c:${s.color}" title="${s.title}">${i + 1}. ${s.ico} ${s.name}</button>`).join('')}
        <div class="inet-slider-box inet-only-voyage">
            <span class="inet-lbl">⏳ Le voyage :</span>
            <input type="range" class="inet-slider inet-tl" min="0" max="799" step="1" value="30" aria-label="Avancement du voyage">
            <span class="inet-val inet-tl-val"></span>
        </div>
        <span class="inet-lbl inet-only-reseau">Parties :</span>
        ${INET_PART_ORDER.map(k => `<button class="inet-btn inet-part-btn inet-only-reseau" data-part="${k}" style="--st-c:${INET_PARTS[k].color}" title="${INET_PARTS[k].name}">${INET_PARTS[k].ico} ${INET_PARTS[k].name}</button>`).join('')}
        <button class="inet-btn inet-part-all inet-only-reseau" title="Voir tout le réseau">🔄 Tout le réseau</button>
        <span class="inet-lbl inet-only-paquets">✂️ Touche un câble pour le couper ou le réparer</span>
        <span class="inet-val inet-only-paquets inet-paq-val"></span>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'inet-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'inet-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'inet-canvas';
    const hint = document.createElement('div');
    hint.className = 'inet-hint';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'inet-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'inet-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Internet et les serveurs</h4>
        <p><b>🚀 Le voyage d'une page</b> : <b>▶ Lecture</b> suit ce qui se passe quand on tape l'adresse d'un site,
        jusqu'à l'affichage de la page. <b>◀ Étape ▶</b>, les boutons d'étapes ou la <b>frise</b> en bas vont directement à une étape ;
        on peut aussi <b>toucher une machine</b> (ordinateur, box, routeur, annuaire, data center). Le curseur <b>⏳</b> fait avancer le voyage à la main.
        Des <b>loupes</b> montrent l'écran, l'annuaire et le serveur.</p>
        <p><b>🕸️ Le réseau</b> : <b>touche une partie du réseau</b> (ou un bouton) pour l'expliquer. Les trois boutons du haut
        montrent la différence entre <b>internet</b> (le réseau), le <b>web</b> (les pages) et les <b>autres services</b>.
        <b>▶ Lecture</b> fait circuler les informations.</p>
        <p><b>📦 Les paquets</b> : <b>▶ Lecture</b> envoie une image découpée en paquets numérotés. <b>Touche un câble</b> pour le couper
        (ou le réparer) : les routeurs cherchent un autre chemin, un paquet perdu est renvoyé. Choisis 4, 6 ou 9 paquets.</p>
        <p>La fiche de droite donne l'explication et un « Le savais-tu ? ».</p>
        <p style="color:#888">Schémas simplifiés : le site, les adresses et le réseau sont imaginaires, et les distances ne sont pas à l'échelle.
        En vrai, une page est découpée en bien plus de paquets.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'inet-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');

    const $ = sel => container.querySelector(sel);
    const playBtn = $('.inet-btn-play'), speedBtn = $('.inet-btn-speed');
    const labelsBtn = $('.inet-labels'), friseBtn = $('.inet-frise');
    const tlSl = $('.inet-tl'), tlVal = $('.inet-tl-val'), paqVal = $('.inet-paq-val');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'voyage';
    let G = 0.3;                    // avancement du voyage (0 … 8, une unité par étape)
    let ov = true;                  // vue d'ensemble (fiche générale)
    let selPart = null;             // partie du réseau choisie
    let view = 'internet';          // vue du réseau : internet / web / services
    let cuts = new Set();           // câbles coupés (onglet paquets)
    let nPaq = 6;                   // nombre de paquets
    let sim = null;                 // simulation des paquets
    let showLabels = true, showFrise = true;
    let playing = false, fast = false;
    let animId = null, lastT = 0, drawPending = false, simTime = 0;
    let cssW = 0, cssH = 0, dpr = 1;
    let hits = [];                  // zones touchables { test(x, y), act() }

    const curStage = () => Math.max(0, Math.min(7, Math.floor(G)));

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        return true;
    }

    // Zone de dessin : en portrait (téléphone), les schémas « voyage » et
    // « paquets » sont tournés d'un quart de tour (de haut en bas).
    const A = { x: 0, y: 0, w: 1, h: 1, portrait: false };
    let U = 40;
    function setArea(bottom) {
        const pad = 10;
        A.portrait = cssH > cssW * 1.15;
        A.x = pad; A.y = pad + 4;
        A.w = Math.max(10, cssW - pad * 2);
        A.h = Math.max(10, cssH - A.y - bottom);
        U = Math.max(14, Math.min(A.w, A.h) / 7.5);
    }
    const P = n => A.portrait ? { x: A.x + n[1] * A.w, y: A.y + n[0] * A.h } : { x: A.x + n[0] * A.w, y: A.y + n[1] * A.h };
    const XY = n => ({ x: n[0] * cssW, y: n[1] * cssH });
    const fsLbl = () => Math.max(10, Math.min(14, U * 0.26));

    function along(pts, t) {
        if (pts.length < 2) return pts[0];
        t = _inetClamp(t);
        let L = 0; const d = [];
        for (let i = 1; i < pts.length; i++) { const v = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); d.push(v); L += v; }
        let r = t * L;
        for (let i = 0; i < d.length; i++) {
            if (r <= d[i] || i === d.length - 1) {
                const k = d[i] ? Math.min(1, r / d[i]) : 1;
                return { x: _inetLerp(pts[i].x, pts[i + 1].x, k), y: _inetLerp(pts[i].y, pts[i + 1].y, k) };
            }
            r -= d[i];
        }
        return pts[pts.length - 1];
    }

    // ── Petites fonctions de dessin ───────────────────────────────────────
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        w = Math.max(1, w); h = Math.max(1, h);
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); else ctx.rect(x, y, w, h);
    }
    function halo(x, y, r, col) {
        const a = 0.35 + 0.2 * Math.sin(simTime * 5);
        ctx.save();
        const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = a; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
    }
    function arrowHead(x, y, ang, h, col) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(ang) * h * 0.4, y + Math.sin(ang) * h * 0.4);
        ctx.lineTo(x - Math.cos(ang) * h + Math.cos(ang + Math.PI / 2) * h * 0.6, y - Math.sin(ang) * h + Math.sin(ang + Math.PI / 2) * h * 0.6);
        ctx.lineTo(x - Math.cos(ang) * h - Math.cos(ang + Math.PI / 2) * h * 0.6, y - Math.sin(ang) * h - Math.sin(ang + Math.PI / 2) * h * 0.6);
        ctx.closePath(); ctx.fill();
    }
    // Petit texte lisible (contour blanc)
    function tinyText(text, x, y, col, fs, align) {
        ctx.save();
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
        if (!align || align === 'center') {
            const w = ctx.measureText(text).width;
            x = Math.max(w / 2 + 3, Math.min(cssW - w / 2 - 3, x));
        }
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = col; ctx.fillText(text, x, y);
        ctx.restore();
    }
    // Étiquette colorée (pastille)
    function pill(text, x, y, bg, fs) {
        ctx.save();
        ctx.font = `800 ${fs}px 'Segoe UI', system-ui, sans-serif`;
        const w = ctx.measureText(text).width + fs * 1.1, h = fs * 1.7;
        x = Math.max(w / 2 + 3, Math.min(cssW - w / 2 - 3, x));
        y = Math.max(h / 2 + 3, Math.min(cssH - h / 2 - 3, y));
        ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
        ctx.fillStyle = bg; roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 1);
        ctx.restore();
    }
    // Loupe : un disque qui montre l'intérieur d'une machine
    function bubble(cx, cy, r, ax, ay, col, title, fn) {
        const fs = Math.max(10, Math.min(15, r * 0.16));
        cx = Math.max(r + 6, Math.min(cssW - r - 6, cx));
        cy = Math.max(r + fs * 1.9 + 4, Math.min(cssH - r - 8, cy));
        ctx.save();
        const ang = Math.atan2(ay - cy, ax - cx);
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 2 * Math.PI); ctx.stroke();
        ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.save(); ctx.clip(); fn(cx, cy, r); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.stroke();
        const ty = cy - r - fs * 0.9 < fs * 0.6 ? cy + r + fs * 0.9 : cy - r - fs * 0.9;
        tinyText('🔍 ' + title, cx, ty, col, fs);
        ctx.restore();
        return { x: cx, y: cy, r };
    }
    function drawWifi(x, y, s, col, alpha) {
        if (alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.lineCap = 'round';
        for (let i = 1; i <= 3; i++) {
            const ph = playing ? (Math.sin(simTime * 6 - i) + 1) / 2 : 1;
            ctx.globalAlpha = alpha * (0.35 + 0.65 * ph);
            ctx.beginPath(); ctx.arc(x, y, s * 0.3 * i, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke();
        }
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, s * 0.1), 0, 2 * Math.PI); ctx.fill();
        ctx.restore();
    }
    function cable(pts, w, inner, outer) {
        if (pts.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = outer || '#475569'; ctx.lineWidth = w; ctx.stroke();
        ctx.strokeStyle = inner || '#cbd5e1'; ctx.lineWidth = Math.max(1, w * 0.45); ctx.stroke();
        ctx.restore();
    }
    function dotted(a, b, col, w) {
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.setLineDash([1, w * 2.6]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
    }

    // ── Les machines ──────────────────────────────────────────────────────
    function drawComputer(x, y, s, screenFn, hl) {
        const w = s * 1.5, h = s;
        if (hl) halo(x, y, s * 1.25, hl);
        ctx.save();
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(x - s * 0.09, y + h / 2, s * 0.18, s * 0.2);
        roundRect(x - s * 0.38, y + h / 2 + s * 0.18, s * 0.76, s * 0.09, 3); ctx.fill();
        roundRect(x - w / 2, y - h / 2, w, h, s * 0.09);
        ctx.fillStyle = '#334155'; ctx.fill();
        const sx = x - w / 2 + s * 0.07, sy = y - h / 2 + s * 0.07, sw = w - s * 0.14, sh = h - s * 0.14;
        ctx.fillStyle = '#e0ecff'; ctx.fillRect(sx, sy, sw, sh);
        if (screenFn) { ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); screenFn(sx, sy, sw, sh); ctx.restore(); }
        ctx.restore();
        return { x: sx + sw / 2, y: sy + sh / 2 };
    }
    function drawTablet(x, y, s) {
        const w = s * 0.8, h = s * 1.06;
        ctx.save();
        roundRect(x - w / 2, y - h / 2, w, h, s * 0.1); ctx.fillStyle = '#1f2937'; ctx.fill();
        const sx = x - w / 2 + s * 0.06, sy = y - h / 2 + s * 0.08, sw = w - s * 0.12, sh = h - s * 0.16;
        ctx.fillStyle = '#e0f2fe'; ctx.fillRect(sx, sy, sw, sh);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(sx + sw * 0.1, sy + sh * 0.1, sw * 0.8, sh * 0.35);
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < 3; i++) ctx.fillRect(sx + sw * 0.1, sy + sh * (0.55 + i * 0.13), sw * (i === 2 ? 0.5 : 0.8), Math.max(1, sh * 0.06));
        ctx.restore();
    }
    function drawPhone(x, y, s) {
        const w = s * 0.52, h = s * 0.98;
        ctx.save();
        roundRect(x - w / 2, y - h / 2, w, h, s * 0.1); ctx.fillStyle = '#111827'; ctx.fill();
        const sx = x - w / 2 + s * 0.05, sy = y - h / 2 + s * 0.1, sw = w - s * 0.1, sh = h - s * 0.2;
        ctx.fillStyle = '#dcfce7'; ctx.fillRect(sx, sy, sw, sh);
        ctx.fillStyle = '#22c55e'; roundRect(sx + sw * 0.12, sy + sh * 0.12, sw * 0.76, sh * 0.2, 3); ctx.fill();
        ctx.fillStyle = '#e5e7eb'; roundRect(sx + sw * 0.12, sy + sh * 0.42, sw * 0.6, sh * 0.16, 3); ctx.fill();
        ctx.restore();
    }
    function drawBox(x, y, s, wave, hl) {
        const w = s * 1.2, h = s * 0.5;
        if (hl) halo(x, y, s * 1.1, hl);
        ctx.save();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = Math.max(2, s * 0.07); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h / 2); ctx.lineTo(x - w * 0.36, y - h / 2 - s * 0.35); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + w * 0.3, y - h / 2); ctx.lineTo(x + w * 0.36, y - h / 2 - s * 0.35); ctx.stroke();
        roundRect(x - w / 2, y - h / 2, w, h, h * 0.3);
        ctx.fillStyle = '#f8fafc'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#475569'; ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const on = !playing || Math.sin(simTime * 9 + i * 2.1) > -0.3;
            ctx.fillStyle = on ? (i === 3 ? '#38bdf8' : '#22c55e') : '#cbd5e1';
            ctx.beginPath(); ctx.arc(x - w * 0.3 + i * w * 0.13, y + h * 0.08, Math.max(1.3, s * 0.045), 0, 2 * Math.PI); ctx.fill();
        }
        ctx.restore();
        if (wave) drawWifi(x, y - h / 2 - s * 0.08, s * 0.55, '#0ea5e9', wave);
    }
    function miniArrow(x1, y1, x2, y2, hs) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        arrowHead(x2, y2, Math.atan2(y2 - y1, x2 - x1), hs, ctx.strokeStyle);
    }
    function drawRouter(x, y, s, lit, hl) {
        const w = s * 1.25, h = s * 0.64;
        if (hl) halo(x, y, s * 1.2, hl);
        ctx.save();
        if (lit) {
            const g = ctx.createRadialGradient(x, y, s * 0.2, x, y, s * 1.1);
            g.addColorStop(0, 'rgba(253,224,71,0.85)'); g.addColorStop(1, 'rgba(253,224,71,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 1.1, 0, 2 * Math.PI); ctx.fill();
        }
        roundRect(x - w / 2, y - h / 2, w, h, h * 0.45);
        ctx.fillStyle = lit ? '#2563eb' : '#1e40af'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#1e3a8a'; ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.2, s * 0.06); ctx.lineCap = 'round';
        const a = h * 0.3, hs = Math.max(3, s * 0.12);
        miniArrow(x - a * 0.2, y - a * 0.35, x + a * 1.35, y - a * 0.35, hs);
        miniArrow(x + a * 0.2, y + a * 0.35, x - a * 1.35, y + a * 0.35, hs);
        ctx.restore();
    }
    function drawDNS(x, y, s, hl) {
        const w = s * 0.9, h = s * 1.1;
        if (hl) halo(x, y, s * 1.2, '#a78bfa');
        ctx.save();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1;
        roundRect(x - w / 2 + 4, y - h / 2 + 3, w, h, 4); ctx.fill(); ctx.stroke();
        roundRect(x - w / 2, y - h / 2, w, h, 5); ctx.fillStyle = '#7c3aed'; ctx.fill();
        ctx.fillStyle = '#5b21b6'; ctx.fillRect(x - w / 2, y - h / 2 + 2, w * 0.14, h - 4);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.max(8, s * 0.3)}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillText('DNS', x + w * 0.07, y - h * 0.12);
        ctx.font = `800 ${Math.max(6, s * 0.17)}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillText('A → 1', x + w * 0.07, y + h * 0.2);
        ctx.restore();
    }
    function drawRack(x, y, w, h, hl) {
        ctx.save();
        ctx.fillStyle = '#1f2937'; roundRect(x, y, w, h, Math.min(4, w * 0.1)); ctx.fill();
        const n = 6, gap = h * 0.03, uh = (h - gap * (n + 1)) / n;
        for (let i = 0; i < n; i++) {
            const uy = y + gap + i * (uh + gap);
            const isHl = hl === i;
            ctx.fillStyle = isHl ? '#475569' : '#374151';
            ctx.fillRect(x + w * 0.08, uy, w * 0.84, uh);
            if (isHl) { ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.strokeRect(x + w * 0.08, uy, w * 0.84, uh); }
            for (let k = 0; k < 3; k++) {
                const on = isHl ? Math.sin(simTime * 14 + k) > -0.5 : Math.sin(simTime * 7 + i * 1.9 + k * 2.3 + x * 0.1) > -0.2;
                ctx.fillStyle = on ? (k === 0 ? '#22c55e' : '#38bdf8') : '#0f172a';
                ctx.beginPath(); ctx.arc(x + w * 0.2 + k * w * 0.13, uy + uh / 2, Math.max(0.8, Math.min(uh * 0.18, w * 0.05)), 0, 2 * Math.PI); ctx.fill();
            }
            if (w > 20) {
                ctx.strokeStyle = '#4b5563'; ctx.lineWidth = 1;
                for (let k = 0; k < 3; k++) {
                    const lx = x + w * 0.62 + k * w * 0.08;
                    ctx.beginPath(); ctx.moveTo(lx, uy + uh * 0.25); ctx.lineTo(lx, uy + uh * 0.75); ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
    function drawDatacenter(x, y, s, hl) {
        const W = s * 1.5, H = s * 1.2, x0 = x - W / 2, y0 = y - H / 2;
        if (hl) halo(x, y, s * 1.3, hl);
        ctx.save();
        roundRect(x0, y0, W, H, s * 0.06); ctx.fillStyle = '#e2e8f0'; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#64748b'; ctx.stroke();
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(x0, y0, W, H * 0.17);
        for (const fx of [0.2, 0.8]) {      // ventilateurs de la climatisation
            const cx = x0 + W * fx, cy = y0 + H * 0.085, r = H * 0.065;
            ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
            ctx.strokeStyle = '#475569'; ctx.lineWidth = Math.max(1, r * 0.3);
            const a = simTime * 6;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a + 1.57) * r, cy + Math.sin(a + 1.57) * r); ctx.lineTo(cx - Math.cos(a + 1.57) * r, cy - Math.sin(a + 1.57) * r); ctx.stroke();
        }
        ctx.restore();
        for (let i = 0; i < 3; i++) drawRack(x0 + W * (0.08 + i * 0.31), y0 + H * 0.26, W * 0.22, H * 0.66, -1);
    }
    function drawEnvelope(p, s, col, label, alpha) {
        const w = s * 0.9, h = s * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 5;
        roundRect(p.x - w / 2, p.y - h / 2, w, h, 3); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - w / 2, p.y - h / 2); ctx.lineTo(p.x, p.y + h * 0.08); ctx.lineTo(p.x + w / 2, p.y - h / 2); ctx.stroke();
        ctx.restore();
        if (label && (alpha == null || alpha > 0.5)) pill(label, p.x, p.y - h / 2 - fsLbl() * 1.2, col, fsLbl());
    }
    function drawPacket(p, s, num, col, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
        roundRect(p.x - s / 2, p.y - s / 2, s, s, s * 0.2); ctx.fillStyle = col; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.max(8, s * 0.6)}px 'Segoe UI', system-ui, sans-serif`;
        ctx.fillText(String(num), p.x, p.y + 1);
        ctx.restore();
    }
    function drawCloudBlob(pts, r, col) {
        ctx.save();
        ctx.fillStyle = col;
        ctx.beginPath();
        pts.forEach(p => { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, 2 * Math.PI); });
        ctx.fill();
        ctx.restore();
    }

    // ── Une page web et une image (dessinées) ─────────────────────────────
    function pageContent(x, y, w, h) {
        ctx.save();
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#2563eb'; ctx.fillRect(x, y, w, h * 0.18);
        if (h > 34) {
            ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.font = `900 ${Math.max(6, h * 0.1)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillText('🐄 La ferme', x + w * 0.05, y + h * 0.095);
        }
        const ix = x + w * 0.06, iy = y + h * 0.26, iw = w * 0.5, ih = h * 0.42;
        ctx.save();
        ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();
        ctx.fillStyle = '#bfe3ff'; ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(ix + iw * 0.8, iy + ih * 0.25, Math.min(iw, ih) * 0.14, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.ellipse(ix + iw * 0.4, iy + ih * 1.05, iw * 0.75, ih * 0.45, 0, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#dc2626'; ctx.fillRect(ix + iw * 0.25, iy + ih * 0.42, iw * 0.24, ih * 0.3);
        ctx.beginPath(); ctx.moveTo(ix + iw * 0.21, iy + ih * 0.44); ctx.lineTo(ix + iw * 0.37, iy + ih * 0.24); ctx.lineTo(ix + iw * 0.53, iy + ih * 0.44); ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#cbd5e1';
        const lh = Math.max(1, h * 0.04);
        for (let i = 0; i < 5; i++) ctx.fillRect(x + w * 0.62, y + h * (0.28 + i * 0.085), w * (i === 4 ? 0.2 : 0.32), lh);
        for (let i = 0; i < 3; i++) ctx.fillRect(x + w * 0.06, y + h * (0.76 + i * 0.075), w * (i === 2 ? 0.55 : 0.88), lh);
        ctx.restore();
    }
    // mask : tableau de 4 booléens (bandes reçues) ou null (page entière)
    function drawWebPage(x, y, w, h, mask, nums) {
        for (let i = 0; i < 4; i++) {
            const by = y + h * i / 4, bh = h / 4;
            if (mask && !mask[i]) {
                ctx.save();
                ctx.fillStyle = '#f1f5f9'; ctx.fillRect(x, by, w, bh);
                ctx.strokeStyle = '#cbd5e1'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
                ctx.strokeRect(x + 1.5, by + 1.5, w - 3, bh - 3);
                if (nums && bh > 9) {
                    ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.font = `900 ${Math.max(7, bh * 0.5)}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.fillText(String(i + 1), x + w / 2, by + bh / 2 + 1);
                }
                ctx.restore();
                continue;
            }
            ctx.save(); ctx.beginPath(); ctx.rect(x, by, w, bh); ctx.clip();
            pageContent(x, y, w, h);
            ctx.restore();
            if (mask && nums && bh > 9) {
                const bs = Math.min(bh * 0.7, 18);
                drawPacket({ x: x + w - bs * 0.7, y: by + bh / 2 }, bs, i + 1, INET_PAQ_COLORS[i], 0.9);
            }
        }
    }
    function drawBrowser(x, y, w, h, o) {
        ctx.save();
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(x, y, w, h);
        const bar = Math.max(6, h * 0.17), dr = bar * 0.14;
        ['#ef4444', '#f59e0b', '#22c55e'].forEach((c, i) => {
            ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + bar * 0.35 + i * dr * 3, y + bar / 2, dr, 0, 2 * Math.PI); ctx.fill();
        });
        const fx = x + bar * 0.35 + dr * 9, fw = w - (fx - x) - bar * 0.2, fh = bar * 0.66, fy = y + (bar - fh) / 2;
        ctx.fillStyle = '#fff'; roundRect(fx, fy, fw, fh, fh / 2); ctx.fill();
        if (o.url != null && fh >= 6) {
            const fs = Math.max(4, Math.min(fh * 0.66, fw / (INET_URL.length * 0.56 + 2)));
            ctx.font = `700 ${fs}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = '#1f2937'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.save(); ctx.beginPath(); ctx.rect(fx, y, fw, bar); ctx.clip();
            const tx = fx + fh * 0.45;
            ctx.fillText(o.url, tx, y + bar / 2 + 0.5);
            if (o.caret && (!playing || Math.floor(simTime * 2.5) % 2 === 0)) {
                ctx.fillRect(tx + ctx.measureText(o.url).width + 1, y + bar / 2 - fs * 0.55, Math.max(1, fs * 0.1), fs * 1.1);
            }
            ctx.restore();
        }
        const py = y + bar, ph = h - bar;
        ctx.fillStyle = '#fff'; ctx.fillRect(x, py, w, ph);
        if (o.mask) drawWebPage(x, py, w, ph, o.mask === 'full' ? null : o.mask, o.nums);
        else if (o.loading) {
            const r = Math.min(w, ph) * 0.16, a = simTime * 5;
            ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = Math.max(1.5, r * 0.25); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(x + w / 2, py + ph / 2, r, a, a + Math.PI * 1.4); ctx.stroke();
        }
        ctx.restore();
    }
    function drawPicture(x, y, w, h) {
        ctx.save();
        ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        const g = ctx.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, '#7cc4ff'); g.addColorStop(1, '#dff1ff');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        const m = Math.min(w, h);
        ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(x + w * 0.82, y + h * 0.2, m * 0.12, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#fff';
        [[0.2, 0.17, 0.07], [0.27, 0.15, 0.09], [0.34, 0.18, 0.06]].forEach(([cx, cy, r]) => { ctx.beginPath(); ctx.arc(x + w * cx, y + h * cy, m * r, 0, 2 * Math.PI); ctx.fill(); });
        ctx.fillStyle = '#4fa83a'; ctx.beginPath(); ctx.ellipse(x + w * 0.85, y + h * 1.08, w * 0.5, h * 0.4, 0, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#6cc04a'; ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h * 1.05, w * 0.7, h * 0.42, 0, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x + w * 0.17, y + h * 0.5, w * 0.045, h * 0.24);
        ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(x + w * 0.19, y + h * 0.45, m * 0.14, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = '#fde68a'; ctx.fillRect(x + w * 0.45, y + h * 0.5, w * 0.24, h * 0.26);
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.moveTo(x + w * 0.42, y + h * 0.51); ctx.lineTo(x + w * 0.57, y + h * 0.31); ctx.lineTo(x + w * 0.72, y + h * 0.51); ctx.fill();
        ctx.fillStyle = '#92400e'; ctx.fillRect(x + w * 0.545, y + h * 0.6, w * 0.05, h * 0.16);
        ctx.fillStyle = '#93c5fd'; ctx.fillRect(x + w * 0.475, y + h * 0.56, w * 0.05, h * 0.07);
        ctx.restore();
    }
    function tileRect(x, y, w, h, k, n) {
        const [c, r] = INET_PAQ_GRID[n] || [3, 2];
        const tw = w / c, th = h / r;
        return { x: x + (k % c) * tw, y: y + Math.floor(k / c) * th, w: tw, h: th };
    }

    // ═══════════════════════ 🚀 LE VOYAGE D'UNE PAGE ═══════════════════════
    const VN = { home: [0.10, 0.56], box: [0.28, 0.62], r1: [0.46, 0.60], r2: [0.64, 0.40], r3: [0.64, 0.80], dc: [0.87, 0.58], dns: [0.46, 0.16] };
    const V_LINKS = [['box', 'r1'], ['r1', 'dns'], ['r1', 'r2'], ['r1', 'r3'], ['r2', 'r3'], ['r2', 'dc'], ['r3', 'dc']];
    const V_ROUTES6 = [['dc', 'r2', 'r1', 'box'], ['dc', 'r3', 'r1', 'box'], ['dc', 'r2', 'r3', 'r1', 'box'], ['dc', 'r3', 'r2', 'r1', 'box']];
    const V_T6 = [[0.12, 0.5], [0.0, 0.5], [0.14, 0.82], [0.22, 0.62]];   // départ, durée → arrivée 2, 1, 4, 3
    const V_ORDER7 = [1, 0, 3, 2];

    function typedChars(u) { return Math.min(INET_URL.length, Math.floor(_inetClamp((u - 0.06) / 0.62) * INET_URL.length)); }
    function mask7(u) {
        const m = [false, false, false, false];
        V_ORDER7.forEach((idx, k) => { if (u >= 0.04 + k * 0.15 + 0.16) m[idx] = true; });
        return m;
    }
    function screenOpts() {
        if (ov) return { url: INET_URL, mask: 'full' };
        const st = curStage(), u = G - st;
        if (st === 0) return { url: INET_URL.slice(0, typedChars(u)), caret: true };
        if (st < 7) return { url: INET_URL, loading: true };
        const m = mask7(u);
        return { url: INET_URL, mask: m.every(Boolean) ? 'full' : m, nums: true };
    }

    // Décale un chemin sur sa gauche (dans le sens de la marche)
    function offsetPath(pts, d) {
        return pts.map((p, i) => {
            let nx = 0, ny = 0;
            const add = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1; nx += dy / L; ny -= dx / L; };
            if (i > 0) add(pts[i - 1], p);
            if (i < pts.length - 1) add(p, pts[i + 1]);
            const L = Math.hypot(nx, ny) || 1;
            return { x: p.x + nx / L * d, y: p.y + ny / L * d };
        });
    }
    function trimPath(pts, d0, d1) {
        const q = pts.map(p => ({ x: p.x, y: p.y }));
        const mv = (a, b, d) => { const L = Math.hypot(b.x - a.x, b.y - a.y) || 1, k = Math.min(0.45, d / L); a.x += (b.x - a.x) * k; a.y += (b.y - a.y) * k; };
        mv(q[0], pts[1], d0);
        mv(q[q.length - 1], pts[pts.length - 2], d1);
        return q;
    }
    function arrowPath(base, d, col, label, lt) {
        const pts = trimPath(offsetPath(base, d), U * 0.85, U * 0.85);
        ctx.save();
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, U * 0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.setLineDash([U * 0.22, U * 0.16]);
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        ctx.setLineDash([]);
        const a = pts[pts.length - 2], b = pts[pts.length - 1];
        arrowHead(b.x, b.y, Math.atan2(b.y - a.y, b.x - a.x), Math.max(9, U * 0.28), col);
        const lp = along(offsetPath(base, d + U * 0.5), lt);
        pill(label, lp.x, lp.y, col, fsLbl());
        ctx.restore();
    }

    function drawVoyageScene() {
        setArea(showFrise ? 64 : 26);
        const N = k => P(VN[k]);
        const pts = keys => keys.map(N);
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#eaf3ff'); bg.addColorStop(1, '#f8fbff');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);

        // Le « nuage » internet
        const R = ['r1', 'r2', 'r3'].map(N);
        const cc = { x: (R[0].x + R[1].x + R[2].x) / 3, y: (R[0].y + R[1].y + R[2].y) / 3 };
        drawCloudBlob([...R, cc], U * 1.25, 'rgba(147,197,253,0.28)');
        {   // étiquette « INTERNET », seulement s'il y a la place entre les routeurs et le serveur
            const fi = fsLbl() * 1.05;
            ctx.font = `800 ${fi}px 'Segoe UI', system-ui, sans-serif`;
            const tw = ctx.measureText('☁️ INTERNET').width, dcP = N('dc');
            if (A.portrait) {
                const y = Math.min(R[1].y + U * 1.05, dcP.y - U * 0.75 - fi);
                if (y > R[1].y + U * 0.55) tinyText('☁️ INTERNET', (R[1].x + R[2].x) / 2, y, '#3b6db3', fi);
            } else {
                const x = Math.min(R[1].x + U * 1.15, dcP.x - U * 0.9 - tw / 2 - 4);
                if (x - tw / 2 > R[1].x + U * 0.1) tinyText('☁️ INTERNET', x, (R[1].y + R[2].y) / 2, '#3b6db3', fi);
            }
        }

        // État de l'étape en cours
        const objs = [];
        let bub = null, wave = 0, dnsHl = false, dcHl = false;
        const st = curStage(), u = G - st;
        const cl = (key, i, n, dy) => { const c = N(key); return { x: c.x + (i - (n - 1) / 2) * U * 0.5, y: c.y - dy }; };
        if (!ov) {
            switch (st) {
                case 0:
                    bub = { kind: 'comp' }; break;
                case 1:
                    if (u < 0.4) objs.push({ t: 'env', p: along(pts(['home', 'box', 'r1', 'dns']), u / 0.4), col: '#7c3aed', label: '❓ Quel numéro pour ce site ?' });
                    if (u >= 0.36 && u <= 0.74) bub = { kind: 'dns', hl: _inetClamp((u - 0.4) / 0.12) };
                    if (u > 0.64) objs.push({ t: 'env', p: along(pts(['dns', 'r1', 'box', 'home']), (u - 0.64) / 0.36), col: '#7c3aed', label: '📒 C\'est le ' + INET_IP });
                    dnsHl = true; wave = (u < 0.12 || u > 0.9) ? 1 : 0;
                    break;
                case 2:
                    objs.push({ t: 'env', p: along(pts(['home', 'box']), (u - 0.1) / 0.7), col: '#0284c7', label: '📨 Envoie-moi ta page d\'accueil !' });
                    wave = 1; break;
                case 3:
                    objs.push({ t: 'env', p: along(pts(['box', 'r1', 'r2', 'dc']), u / 0.9), col: '#d97706', label: '📨 Pour ' + INET_IP });
                    break;
                case 4:
                    if (u < 0.2) objs.push({ t: 'env', p: N('dc'), col: '#d97706', label: '', alpha: 1 - u / 0.2 });
                    bub = { kind: 'rack', found: u > 0.5 }; dcHl = true; break;
                case 5:
                    bub = { kind: 'split' }; dcHl = true;
                    if (u > 0.72) for (let i = 0; i < 4; i++) objs.push({ t: 'pk', p: cl('dc', i, 4, U * 1.05), num: i + 1, col: INET_PAQ_COLORS[i], alpha: _inetClamp((u - 0.72) / 0.18) });
                    break;
                case 6:
                    for (let i = 0; i < 4; i++) {
                        const tt = (u - V_T6[i][0]) / V_T6[i][1];
                        const p = tt <= 0 ? cl('dc', i, 4, U * 1.05) : tt >= 1 ? cl('box', i, 4, U * 0.85) : along(pts(V_ROUTES6[i]), tt);
                        objs.push({ t: 'pk', p, num: i + 1, col: INET_PAQ_COLORS[i] });
                    }
                    break;
                case 7:
                    V_ORDER7.forEach((idx, k) => {
                        const tt = (u - 0.04 - k * 0.15) / 0.16;
                        if (tt >= 1) return;
                        objs.push({ t: 'pk', p: tt <= 0 ? cl('box', idx, 4, U * 0.85) : along(pts(['box', 'home']), tt), num: idx + 1, col: INET_PAQ_COLORS[idx] });
                    });
                    bub = { kind: 'comp', done: u > 0.68 }; wave = u < 0.68 ? 1 : 0;
                    break;
            }
        }

        // Câbles
        const lw = Math.max(4, U * 0.13);
        V_LINKS.forEach(([a, b]) => cable([N(a), N(b)], lw));
        dotted(N('home'), N('box'), '#0ea5e9', Math.max(3, U * 0.08));
        const hb = { x: (N('home').x + N('box').x) / 2, y: (N('home').y + N('box').y) / 2 };
        drawWifi(hb.x, hb.y - U * 0.15, U * 0.45, '#0ea5e9', 0.9);


        // Machines
        const lit = k => objs.some(o => Math.hypot(o.p.x - N(k).x, o.p.y - N(k).y) < U * 0.75);
        const scr = drawComputer(N('home').x, N('home').y, U * 1.05, (x, y, w, h) => drawBrowser(x, y, w, h, screenOpts()), !ov && (st === 0 || st === 7) ? '#93c5fd' : null);
        drawBox(N('box').x, N('box').y, U * 0.85, wave, !ov && st === 2 ? '#7dd3fc' : null);
        ['r1', 'r2', 'r3'].forEach(k => drawRouter(N(k).x, N(k).y, U * 0.8, lit(k), !ov && st === 3 ? '#fcd34d' : null));
        drawDNS(N('dns').x, N('dns').y, U * 0.85, dnsHl);
        drawDatacenter(N('dc').x, N('dc').y, U * 1.1, dcHl || (!ov && st === 4) ? '#6ee7b7' : null);

        if (showLabels) {
            const f = fsLbl(), sm = cssW < 700;
            tinyText(sm ? 'Ordinateur' : 'Mon ordinateur (le client)', N('home').x, N('home').y + U * 0.95, '#1e3a8a', f);
            tinyText(sm ? 'Box' : 'La box', N('box').x, N('box').y + U * 0.55, '#075985', f);
            ['r1', 'r2', 'r3'].forEach(k => tinyText('Routeur', N(k).x, N(k).y + U * 0.6, '#1e40af', f * 0.92));
            tinyText(sm ? 'DNS' : 'Annuaire (DNS)', N('dns').x, N('dns').y + U * 0.82, '#5b21b6', f);
            tinyText(sm ? 'Serveur' : 'Data center : le serveur', N('dc').x, N('dc').y + U * 0.9, '#065f46', f);
            if (!sm) tinyText('n° ' + INET_IP, N('dc').x, N('dc').y + U * 0.9 + f * 1.3, '#6b7280', f * 0.85);
        }

        // Vue d'ensemble : la demande et la réponse
        if (ov) {
            arrowPath(pts(['home', 'box', 'r1', 'r2', 'dc']), U * 0.78, '#2563eb', '① La demande', 0.72);
            arrowPath(pts(['dc', 'r3', 'r1', 'box', 'home']), U * 0.78, '#db2777', '② La réponse', 0.5);
        }
        // Messages et paquets
        objs.forEach(o => {
            if (o.t === 'env') drawEnvelope(o.p, U * 0.6, o.col, o.label, o.alpha);
            else drawPacket(o.p, U * 0.42, o.num, o.col, o.alpha);
        });

        // Zones touchables : les machines mènent à leur étape
        const nodeHit = (k, r, i) => { const c = N(k); hits.push({ test: (x, y) => Math.hypot(x - c.x, y - c.y) <= r, act: () => jumpStage(i) }); };
        nodeHit('home', U * 0.95, 0); nodeHit('dns', U * 0.75, 1); nodeHit('box', U * 0.7, 2);
        ['r1', 'r2', 'r3'].forEach(k => nodeHit(k, U * 0.7, 3));
        nodeHit('dc', U * 0.95, 4);

        // Loupes
        const R0 = Math.min(U * 2.0, A.h * 0.24, A.w * 0.24);
        if (bub && bub.kind === 'comp') {
            const c = P([0.25, 0.2]);
            const b = bubble(c.x, c.y, R0, scr.x, scr.y, '#2563eb', 'Mon écran', (cx, cy, r) => {
                drawBrowser(cx - r * 0.8, cy - r * 0.58, r * 1.6, r * 1.16, screenOpts());
            });
            if (bub.done) pill('✅ En moins d\'une seconde !', b.x, b.y + b.r * 0.8, '#16a34a', fsLbl());
        } else if (bub && bub.kind === 'dns') {
            const c = P([0.24, 0.2]), d = N('dns');
            bubble(c.x, c.y, R0, d.x, d.y, '#7c3aed', "L'annuaire", (cx, cy, r) => {
                ctx.fillStyle = '#fffbeb'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#5b21b6'; ctx.font = `900 ${r * 0.13}px 'Segoe UI', system-ui, sans-serif`;
                ctx.fillText('📒 Annuaire (DNS)', cx, cy - r * 0.66);
                const rows = [['www.musee-dino.fr', '91.7.22.140'], [INET_URL, INET_IP], ['www.jeux-maths.fr', '62.10.5.33']];
                rows.forEach(([nm, ip], j) => {
                    const ry = cy - r * 0.36 + j * r * 0.4;
                    if (j === 1 && bub.hl > 0) {
                        ctx.save(); ctx.globalAlpha = bub.hl; ctx.fillStyle = '#fde68a';
                        roundRect(cx - r * 0.88, ry - r * 0.15, r * 1.76, r * 0.38, r * 0.06); ctx.fill(); ctx.restore();
                    }
                    ctx.fillStyle = '#374151'; ctx.font = `700 ${r * 0.1}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.fillText(nm, cx, ry);
                    ctx.fillStyle = j === 1 ? '#7c3aed' : '#6b7280'; ctx.font = `900 ${r * 0.115}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.fillText('→ ' + ip, cx, ry + r * 0.15);
                });
            });
        } else if (bub && (bub.kind === 'rack' || bub.kind === 'split')) {
            const c = P([0.84, 0.17]), d = N('dc');
            bubble(c.x, c.y, R0, d.x, d.y - U * 0.3, '#059669', 'Dans le data center', (cx, cy, r) => {
                ctx.fillStyle = '#f1f5f9'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
                if (bub.kind === 'rack') {
                    drawRack(cx - r * 0.74, cy - r * 0.56, r * 0.4, r * 1.06, -1);
                    drawRack(cx - r * 0.28, cy - r * 0.56, r * 0.4, r * 1.06, 2);
                    if (bub.found) {
                        ctx.save(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                        pageContent(cx + r * 0.2, cy - r * 0.42, r * 0.5, r * 0.62);
                        ctx.strokeRect(cx + r * 0.2, cy - r * 0.42, r * 0.5, r * 0.62);
                        ctx.restore();
                    } else {
                        ctx.font = `${r * 0.36}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('🔎', cx + r * 0.45, cy - r * 0.1);
                    }
                    tinyText(bub.found ? '✅ Page trouvée !' : '🔎 Je cherche…', cx, cy + r * 0.68, bub.found ? '#047857' : '#374151', r * 0.12);
                } else {
                    const w = r * 0.8, h = r * 0.9, x = cx - w / 2, y = cy - h / 2 - r * 0.12;
                    const k = _inetClamp(u / 0.6);
                    for (let i = 0; i < 4; i++) {
                        const dx = (i % 2 ? 1 : -1) * k * r * 0.1, dy = (i - 1.5) * k * r * 0.12, by = y + h * i / 4;
                        ctx.save(); ctx.translate(dx, dy);
                        ctx.beginPath(); ctx.rect(x, by, w, h / 4); ctx.clip();
                        pageContent(x, y, w, h);
                        ctx.restore();
                        ctx.save(); ctx.strokeStyle = k > 0.05 ? INET_PAQ_COLORS[i] : '#94a3b8'; ctx.lineWidth = k > 0.05 ? 2 : 1;
                        ctx.strokeRect(x + dx, by + dy, w, h / 4); ctx.restore();
                        if (k > 0.3) drawPacket({ x: x + dx - r * 0.02, y: by + dy + h / 8 }, r * 0.17, i + 1, INET_PAQ_COLORS[i], _inetClamp((k - 0.3) / 0.3));
                    }
                    tinyText('✂️ En paquets !', cx, cy + r * 0.68, '#b91c1c', r * 0.12);
                }
            });
        }
        if (showFrise) drawFrise();
    }

    function drawFrise() {
        const n = INET_STEPS.length, y = cssH - 42;
        const x0 = 28, x1 = cssW - 28;
        const r = Math.max(11, Math.min(18, (x1 - x0) / (n - 1) * 0.36));
        const xi = i => x0 + (x1 - x0) * i / (n - 1);
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineWidth = 4;
        ctx.strokeStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
        if (!ov) {
            ctx.strokeStyle = '#60a5fa';
            ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * Math.min(G, n - 1) / (n - 1), y); ctx.stroke();
        }
        const cur = curStage();
        INET_STEPS.forEach((s, i) => {
            const cx = xi(i), on = !ov && cur === i, past = !ov && i < cur;
            ctx.beginPath(); ctx.arc(cx, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = on ? s.color : past ? '#dbeafe' : '#fff'; ctx.fill();
            ctx.lineWidth = on ? 3 : 2; ctx.strokeStyle = s.color; ctx.stroke();
            ctx.font = `${r * 0.95}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000'; ctx.fillText(s.ico, cx, y + 1);
            ctx.font = `900 ${Math.max(9, r * 0.6)}px 'Segoe UI', system-ui, sans-serif`;
            ctx.fillStyle = on ? s.color : '#64748b';
            ctx.fillText(String(i + 1), cx, y - r - Math.max(6, r * 0.45));
            hits.push({ test: (x, yy) => Math.hypot(x - cx, yy - y) <= r + 6, act: () => jumpStage(i) });
        });
        ctx.restore();
    }

    // ═══════════════════════════ 🕸️ LE RÉSEAU ═══════════════════════════
    const R_GY = 0.74, R_CY = 0.82, R_SB = 0.885, R_OB = 0.93;
    const R_MAIN = [[0.2, 0.72], [0.2, R_CY], [0.48, R_CY], [0.48, 0.665], [0.54, 0.665], [0.54, R_CY], [0.585, R_CY], [0.615, R_SB],
        [0.735, R_SB], [0.765, R_CY], [0.78, R_CY], [0.78, 0.70], [0.80, 0.70], [0.80, R_CY], [0.895, R_CY], [0.895, R_GY]];
    const R_ANT = [[0.40, R_GY], [0.40, R_CY]];
    const RP = { comp: [0.095, 0.565], tab: [0.205, 0.55], box: [0.2, 0.70], phone: [0.33, 0.60], antTop: [0.40, 0.35], r1: [0.51, 0.665], r2: [0.79, 0.70] };
    const R_ROUTES = [
        [RP.comp, RP.box, ...R_MAIN],
        [RP.tab, RP.box, ...R_MAIN],
        [RP.phone, RP.antTop, R_ANT[0], R_ANT[1], ...R_MAIN.slice(2)]
    ];
    const R_GLYPHS = ['✉️', '🎮', '🎥', '💬'];

    function drawReseauScene() {
        U = Math.max(14, Math.min(cssW, cssH) / 8);
        A.portrait = false;
        const f = fsLbl(), sel = selPart;
        const gY = R_GY * cssH;
        // Ciel, sol, océan
        const sky = ctx.createLinearGradient(0, 0, 0, gY);
        sky.addColorStop(0, '#cfe8ff'); sky.addColorStop(1, '#f0f8ff');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, cssW, gY);
        ctx.fillStyle = '#fff';
        [[0.3, 0.12], [0.62, 0.2]].forEach(([cx, cy]) => {
            const c = XY([cx, cy]);
            [[0, 0, 1], [U * 0.5, -U * 0.15, 0.8], [U * 0.95, 0, 0.9]].forEach(([dx, dy, k]) => { ctx.beginPath(); ctx.arc(c.x + dx, c.y + dy, U * 0.35 * k, 0, 2 * Math.PI); ctx.fill(); });
        });
        ctx.fillStyle = '#d6b48c'; ctx.fillRect(0, gY, cssW, cssH - gY);
        ctx.fillStyle = '#c49a6c'; ctx.fillRect(0, (R_CY - 0.03) * cssH, cssW, 0.06 * cssH);
        ctx.fillStyle = '#7cc36b'; ctx.fillRect(0, gY, cssW, Math.max(4, cssH * 0.018));
        const oc = [[0.575, R_GY], [0.765, R_GY], [0.74, R_OB], [0.6, R_OB]].map(XY);
        const og = ctx.createLinearGradient(0, gY, 0, cssH);
        og.addColorStop(0, '#60a5fa'); og.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = og; ctx.beginPath(); oc.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
        if (sel === 'sousmarin') { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(simTime * 5); ctx.fillStyle = '#a5f3fc'; ctx.fill(); ctx.restore(); }

        // Maison
        const h0 = XY([0.03, 0.42]), h1 = XY([0.27, R_GY]);
        if (sel === 'appareils') halo((h0.x + h1.x) / 2, (h0.y + h1.y) / 2, (h1.x - h0.x) * 0.75, '#93c5fd');
        ctx.fillStyle = '#fff7e6'; ctx.fillRect(h0.x, h0.y, h1.x - h0.x, h1.y - h0.y);
        ctx.strokeStyle = '#b08968'; ctx.lineWidth = 2; ctx.strokeRect(h0.x, h0.y, h1.x - h0.x, h1.y - h0.y);
        const rf = [[0.015, 0.42], [0.15, 0.265], [0.285, 0.42]].map(XY);
        ctx.fillStyle = '#d9534f'; ctx.beginPath(); rf.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.fill();
        // Bâtiment de l'opérateur
        const o0 = XY([0.455, 0.55]), o1 = XY([0.565, R_GY]);
        ctx.fillStyle = '#e5e7eb'; ctx.fillRect(o0.x, o0.y, o1.x - o0.x, o1.y - o0.y);
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5; ctx.strokeRect(o0.x, o0.y, o1.x - o0.x, o1.y - o0.y);
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(o0.x - 3, o0.y - 5, o1.x - o0.x + 6, 6);

        // Câbles
        const main = R_MAIN.map(XY), ant = R_ANT.map(XY);
        const lw = Math.max(4, U * 0.13);
        const inner = view === 'internet' || sel === 'cables' ? '#fbbf24' : '#cbd5e1';
        if (sel === 'cables') { ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(simTime * 5); cable(main, lw * 3.2, '#fde68a', '#fde68a'); cable(ant, lw * 3.2, '#fde68a', '#fde68a'); ctx.restore(); }
        cable(main.slice(0, 7), lw, inner);
        cable(main.slice(9), lw, inner);
        cable(ant, lw, inner);
        cable(main.slice(6, 10), lw * 1.25, sel === 'sousmarin' ? '#67e8f9' : inner, '#0f172a');
        // Liaisons sans fil
        const comp = XY(RP.comp), tab = XY(RP.tab), box = XY(RP.box), phone = XY(RP.phone), antTop = XY(RP.antTop);
        dotted(comp, box, '#0ea5e9', Math.max(2.5, U * 0.07));
        dotted(tab, box, '#0ea5e9', Math.max(2.5, U * 0.07));
        dotted(phone, antTop, '#a855f7', Math.max(2.5, U * 0.07));

        // Antenne relais
        const aw = Math.max(10, cssW * 0.022), aB = XY([0.40, R_GY]);
        if (sel === 'antenne') halo(antTop.x, (antTop.y + aB.y) / 2, (aB.y - antTop.y) * 0.65, '#d8b4fe');
        ctx.save();
        ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(aB.x - aw, aB.y); ctx.lineTo(antTop.x, antTop.y); ctx.lineTo(aB.x + aw, aB.y); ctx.stroke();
        for (let i = 1; i < 5; i++) {
            const t = i / 5, yA = _inetLerp(aB.y, antTop.y, t), wA = aw * (1 - t), yB = _inetLerp(aB.y, antTop.y, t + 0.2), wB = aw * (1 - t - 0.2);
            ctx.beginPath(); ctx.moveTo(aB.x - wA, yA); ctx.lineTo(aB.x + wB, yB); ctx.moveTo(aB.x + wA, yA); ctx.lineTo(aB.x - wB, yB); ctx.stroke();
        }
        ctx.fillStyle = '#e5e7eb'; ctx.strokeStyle = '#6b7280';
        roundRect(antTop.x - aw * 0.35, antTop.y - U * 0.25, aw * 0.7, U * 0.4, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.translate(antTop.x, antTop.y - U * 0.05);
        ctx.rotate(-Math.PI / 2); drawWifi(0, 0, U * 0.45, '#a855f7', 0.9); ctx.restore();
        ctx.save(); ctx.translate(antTop.x, antTop.y - U * 0.05);
        ctx.rotate(Math.PI / 2); drawWifi(0, 0, U * 0.45, '#a855f7', 0.9); ctx.restore();

        // Appareils, box, routeurs, data center
        drawComputer(comp.x, comp.y, U * 0.72, (x, y, w, h) => drawBrowser(x, y, w, h, { url: INET_URL, mask: 'full' }));
        drawTablet(tab.x, tab.y, U * 0.62);
        drawPhone(phone.x, phone.y, U * 0.62);
        drawBox(box.x, box.y, U * 0.6, 0.9, sel === 'box' ? '#7dd3fc' : null);
        const r1 = XY(RP.r1), r2 = XY(RP.r2);
        drawRouter(r1.x, r1.y, U * 0.55, view === 'internet', sel === 'routeurs' ? '#fdba74' : null);
        drawRouter(r2.x, r2.y, U * 0.45, view === 'internet', sel === 'routeurs' ? '#fdba74' : null);
        const ds = Math.max(12, Math.min(cssW * 0.1, (R_GY - 0.45) * cssH / 1.2));
        const dc = { x: 0.895 * cssW, y: gY - ds * 0.6 };
        drawDatacenter(dc.x, dc.y, ds, sel === 'datacenter' ? '#6ee7b7' : null);
        if (view === 'web') pill('www', dc.x, dc.y - ds * 0.75, '#2563eb', f);

        // Les informations circulent
        const sp = 0.07 * (fast ? 2.2 : 1);
        R_ROUTES.forEach((rt, ri) => {
            const pts = rt.map(XY);
            for (let j = 0; j < 4; j++) {
                let t = (simTime * sp + j / 4 + ri * 0.11) % 1;
                const fwd = j % 2 === 0;
                if (!fwd) t = 1 - t;
                const p = along(pts, t);
                ctx.save();
                if (view === 'internet') {
                    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, U * 0.24);
                    g.addColorStop(0, '#fffbeb'); g.addColorStop(0.4, '#fbbf24'); g.addColorStop(1, 'rgba(251,191,36,0)');
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, U * 0.24, 0, 2 * Math.PI); ctx.fill();
                } else if (fwd) {
                    ctx.fillStyle = '#2563eb'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(3, U * 0.09), 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
                } else {
                    const gl = view === 'web' ? '📄' : R_GLYPHS[(j + ri) % 4];
                    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = view === 'web' ? '#2563eb' : '#db2777'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(p.x, p.y, U * 0.24, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
                    ctx.font = `${U * 0.28}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#000'; ctx.fillText(gl, p.x, p.y + 1);
                }
                ctx.restore();
            }
        });

        // Étiquettes
        if (showLabels) {
            tinyText('Les appareils', (h0.x + h1.x) / 2, h0.y + f * 1.1, '#1e3a8a', f);
            tinyText('Box', box.x + U * 0.45, box.y + U * 0.05, '#075985', f, 'left');
            tinyText('Antenne relais', antTop.x, antTop.y - U * 0.5, '#6b21a8', f);
            if (cssW >= 560) tinyText('Opérateur', (o0.x + o1.x) / 2, o0.y - f * 1.1, '#4b5563', f * 0.9);
            tinyText('Routeur', r1.x, r1.y - U * 0.5, '#9a3412', f * 0.92);
            tinyText('Routeur', r2.x, r2.y - U * 0.45, '#9a3412', f * 0.92);
            tinyText(cssW < 560 ? 'Câbles' : 'Câbles (fibre optique)', 0.33 * cssW, R_CY * cssH + f * 1.3, '#78350f', f);
            tinyText('Océan', 0.67 * cssW, R_GY * cssH + f * 1.2, '#1e3a8a', f * 0.9);
            tinyText(cssW < 560 ? 'Câble' : 'Câble sous-marin', 0.675 * cssW, R_SB * cssH - f * 1.05, '#0e7490', f * 0.9);
            tinyText('Data center', dc.x, dc.y - ds * 0.6 - f * (view === 'web' ? 2.6 : 1), '#065f46', f);
        }

        // Le serveur, à la loupe
        const br = Math.max(30, Math.min(U * 1.5, cssH * 0.17, cssW * 0.13));
        const bc = XY([0.875, 0.19]);
        const b = bubble(bc.x, bc.y, br, dc.x, dc.y - ds * 0.3, sel === 'serveur' ? '#047857' : '#059669', 'Un serveur', (cx, cy, r) => {
            ctx.fillStyle = sel === 'serveur' ? '#d1fae5' : '#f1f5f9'; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
            drawRack(cx - r * 0.3, cy - r * 0.72, r * 0.6, r * 1.44, 2);
        });

        // Zones touchables (la dernière ajoutée est prioritaire)
        const tol = Math.max(10, U * 0.22);
        const onPath = (pts, x, y, t) => { for (let i = 1; i < pts.length; i++) if (_inetSegDist(x, y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y) <= t) return true; return false; };
        const add = (k, test) => hits.push({ test, act: () => selectPart(selPart === k ? null : k) });
        add('cables', (x, y) => onPath(main.slice(0, 7), x, y, tol) || onPath(main.slice(9), x, y, tol) || onPath(ant, x, y, tol));
        add('sousmarin', (x, y) => onPath(main.slice(6, 10), x, y, tol * 1.4) || (x > 0.59 * cssW && x < 0.75 * cssW && y > gY + 4 && y < R_OB * cssH));
        add('datacenter', (x, y) => Math.abs(x - dc.x) <= ds * 0.78 && Math.abs(y - dc.y) <= ds * 0.65);
        add('antenne', (x, y) => Math.abs(x - antTop.x) <= aw + 6 && y >= antTop.y - U * 0.4 && y <= aB.y);
        add('routeurs', (x, y) => Math.hypot(x - r1.x, y - r1.y) <= U * 0.55 || Math.hypot(x - r2.x, y - r2.y) <= U * 0.5);
        add('box', (x, y) => Math.hypot(x - box.x, y - box.y) <= U * 0.5);
        add('appareils', (x, y) => Math.hypot(x - comp.x, y - comp.y) <= U * 0.65 || Math.hypot(x - tab.x, y - tab.y) <= U * 0.45 || Math.hypot(x - phone.x, y - phone.y) <= U * 0.45);
        add('serveur', (x, y) => Math.hypot(x - b.x, y - b.y) <= b.r);
    }

    // ═══════════════════════════ 📦 LES PAQUETS ═══════════════════════════
    const PN = { dst: [0.08, 0.5], a: [0.28, 0.2], b: [0.28, 0.8], c: [0.5, 0.1], d: [0.5, 0.5], e: [0.5, 0.9], f: [0.72, 0.2], g: [0.72, 0.8], srv: [0.92, 0.5] };
    const P_LINKS = [['dst', 'a'], ['dst', 'b'], ['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'd'], ['b', 'e'], ['c', 'd'], ['d', 'e'],
        ['c', 'f'], ['d', 'f'], ['d', 'g'], ['e', 'g'], ['f', 'g'], ['f', 'srv'], ['g', 'srv']];
    const P_ROUTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    function layoutPaq() { setArea(26); }
    // Position d'un nœud ; l'ordinateur (grand) est gardé dans le cadre
    function PQ(k) {
        const p = P(PN[k]);
        if (k === 'dst') {
            const cs = U * 1.45;
            if (A.portrait) p.y = Math.max(p.y, A.y + cs * 0.5 + 4);
            else p.x = Math.max(p.x, cs * 0.75 + 6);
        }
        return p;
    }

    function newSim() {
        sim = { t: 0, order: [], lost: 0, done: false, blocked: false, packets: [] };
        for (let i = 0; i < nPaq; i++) sim.packets.push({ id: i, state: 'wait', delay: i * 0.55, node: 'srv', visited: ['srv'], pause: 0 });
        lastInfoKey = '';
    }
    function paqGraph() {
        const adj = {}, dist = {};
        Object.keys(PN).forEach(k => { adj[k] = []; dist[k] = Infinity; });
        P_LINKS.forEach(([a, b], i) => { if (cuts.has(i)) return; adj[a].push([b, i]); adj[b].push([a, i]); });
        dist.dst = 0;
        const q = ['dst'];
        while (q.length) { const k = q.shift(); adj[k].forEach(([n]) => { if (dist[n] === Infinity) { dist[n] = dist[k] + 1; q.push(n); } }); }
        return { adj, dist };
    }
    function chooseNext(p) {
        const { adj, dist } = paqGraph();
        const dc = dist[p.node];
        if (dc === Infinity) return null;
        const nb = adj[p.node];
        let down = nb.filter(([n]) => dist[n] < dc && !p.visited.includes(n));
        const sideW = nb.filter(([n]) => dist[n] === dc && !p.visited.includes(n) && n !== 'srv');
        if (sideW.length && Math.random() < 0.3) return sideW[Math.floor(Math.random() * sideW.length)];
        if (!down.length) down = nb.filter(([n]) => dist[n] < dc);
        if (!down.length) return null;
        return down[Math.floor(Math.random() * down.length)];
    }
    function paqPos(p) {
        const a = PQ(p.from), b = PQ(p.to);
        return { x: _inetLerp(a.x, b.x, p.prog), y: _inetLerp(a.y, b.y, p.prog) };
    }
    function paqUpdate(dt) {
        if (!sim || sim.done) return;
        layoutPaq();
        const speed = U * (fast ? 4.2 : 2.0);
        sim.t += dt;
        let blocked = false;
        sim.packets.forEach(p => {
            if (p.state === 'arrived') return;
            if (p.state === 'wait') {
                if (sim.t < p.delay) return;
                p.state = 'node'; p.node = 'srv'; p.visited = ['srv']; p.pause = 0;
            }
            if (p.state === 'lost') {
                p.pause -= dt;
                if (p.pause <= 0) { p.state = 'node'; p.node = 'srv'; p.visited = ['srv']; p.pause = 0.2; }
                return;
            }
            if (p.state === 'node') {
                if (p.node === 'dst') { p.state = 'arrived'; sim.order.push(p.id); return; }
                if (p.pause > 0) { p.pause -= dt; return; }
                const nx = chooseNext(p);
                if (!nx) { p.blocked = true; blocked = true; return; }
                p.blocked = false; p.state = 'move'; p.from = p.node; p.to = nx[0]; p.link = nx[1]; p.prog = 0;
            }
            if (p.state === 'move') {
                if (cuts.has(p.link)) {
                    p.lostAt = paqPos(p); p.lostN = [p.from, p.to, p.prog];
                    p.state = 'lost'; p.pause = 1.3; sim.lost++;
                    return;
                }
                const a = PQ(p.from), b = PQ(p.to);
                p.prog += dt * speed / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
                if (p.prog >= 1) {
                    p.node = p.to; p.visited.push(p.to); p.state = 'node';
                    p.pause = p.to === 'dst' ? 0 : 0.1 + Math.random() * 0.4;
                }
            }
        });
        sim.blocked = blocked;
        if (sim.packets.every(p => p.state === 'arrived')) sim.done = true;
    }
    function toggleCut(i) {
        if (cuts.has(i)) cuts.delete(i); else cuts.add(i);
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }

    function drawPaquetsScene() {
        layoutPaq();
        const N = PQ;
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#eef6ff'); bg.addColorStop(1, '#f8fbff');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, cssW, cssH);
        const lw = Math.max(4, U * 0.13), f = fsLbl();
        if (!sim) newSim();

        // Câbles (on les touche pour les couper)
        P_LINKS.forEach(([a, b], i) => {
            const pa = N(a), pb = N(b);
            if (cuts.has(i)) {
                ctx.save();
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = Math.max(2, lw * 0.5); ctx.setLineDash([6, 6]); ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
                ctx.setLineDash([]);
                const m = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }, s = Math.max(7, U * 0.2);
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(m.x, m.y, s * 1.3, 0, 2 * Math.PI); ctx.fill();
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(m.x - s, m.y - s); ctx.lineTo(m.x + s, m.y + s); ctx.moveTo(m.x + s, m.y - s); ctx.lineTo(m.x - s, m.y + s); ctx.stroke();
                ctx.restore();
            } else cable([pa, pb], lw);
            hits.push({
                test: (x, y) => _inetSegDist(x, y, pa.x, pa.y, pb.x, pb.y) <= Math.max(11, U * 0.25)
                    && Math.hypot(x - pa.x, y - pa.y) > U * 0.45 && Math.hypot(x - pb.x, y - pb.y) > U * 0.45,
                act: () => toggleCut(i)
            });
        });

        // Routeurs, serveur, ordinateur
        const atNode = {};
        sim.packets.forEach(p => { if (p.state === 'node' && p.node !== 'srv') (atNode[p.node] = atNode[p.node] || []).push(p); });
        P_ROUTERS.forEach(k => drawRouter(N(k).x, N(k).y, U * 0.6, !!atNode[k]));
        const srv = N('srv'), ss = U * 1.0;
        drawDatacenter(srv.x, srv.y, ss);
        const dst = N('dst'), cs = U * 1.45;
        const grid = (x, y, w, h, isCard) => {
            for (let k = 0; k < nPaq; k++) {
                const t = tileRect(x, y, w, h, k, nPaq), p = sim.packets[k];
                const have = isCard ? p.state === 'wait' : p.state === 'arrived';
                if (have) {
                    ctx.save(); ctx.beginPath(); ctx.rect(t.x, t.y, t.w, t.h); ctx.clip(); drawPicture(x, y, w, h); ctx.restore();
                } else {
                    ctx.fillStyle = isCard ? 'rgba(255,255,255,0.75)' : '#f1f5f9';
                    if (isCard) { ctx.save(); ctx.beginPath(); ctx.rect(t.x, t.y, t.w, t.h); ctx.clip(); drawPicture(x, y, w, h); ctx.restore(); }
                    ctx.fillRect(t.x, t.y, t.w, t.h);
                }
                ctx.save();
                ctx.strokeStyle = have || !isCard ? INET_PAQ_COLORS[k] : '#cbd5e1'; ctx.lineWidth = 1.5;
                if (!have) ctx.setLineDash([3, 3]);
                ctx.strokeRect(t.x + 1, t.y + 1, t.w - 2, t.h - 2);
                ctx.restore();
                if (!have && !sim.done) {
                    ctx.fillStyle = isCard ? '#94a3b8' : INET_PAQ_COLORS[k];
                    ctx.font = `900 ${Math.max(7, Math.min(t.w, t.h) * 0.45)}px 'Segoe UI', system-ui, sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(String(k + 1), t.x + t.w / 2, t.y + t.h / 2 + 1);
                }
            }
        };
        drawComputer(dst.x, dst.y, cs, (x, y, w, h) => grid(x, y, w, h, false), sim.done ? '#86efac' : null);
        // La carte de l'image à envoyer, à côté du serveur
        const cw = ss * 1.5, ch = ss * 1.0;
        const card = A.portrait ? { x: srv.x - ss * 0.75 - cw / 2 - 12, y: srv.y - ch / 2 } : { x: srv.x - cw / 2, y: srv.y - ss * 0.6 - ch - 14 };
        card.x = Math.max(4, Math.min(cssW - cw - 4, card.x)); card.y = Math.max(f * 2 + 4, card.y);
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 6;
        ctx.fillStyle = '#fff'; ctx.fillRect(card.x - 3, card.y - 3, cw + 6, ch + 6); ctx.restore();
        grid(card.x, card.y, cw, ch, true);
        if (showLabels) {
            tinyText("🖼️ L'image à envoyer", card.x + cw / 2, card.y - f * 0.9, '#065f46', f);
            tinyText('Le serveur', srv.x, srv.y + ss * 0.6 + f * 0.9, '#065f46', f);
            tinyText("L'ordinateur de l'élève", dst.x, dst.y + cs * 0.75 + f * 0.9, '#1e3a8a', f);
            if (!A.portrait) tinyText('Les routeurs', N('d').x, N('d').y - U * 0.55, '#1e40af', f * 0.9);
        }

        // Paquets
        const ps = U * 0.42;
        Object.keys(atNode).forEach(k => {
            const list = atNode[k], c = N(k);
            list.forEach((p, j) => {
                const q = { x: c.x + (j - (list.length - 1) / 2) * ps * 1.1, y: c.y - U * 0.62 };
                drawPacket(q, ps, p.id + 1, INET_PAQ_COLORS[p.id]);
                if (p.blocked) tinyText('⛔', q.x + ps * 0.5, q.y - ps * 0.5, '#b91c1c', ps * 0.6);
            });
        });
        const atSrv = sim.packets.filter(p => p.state === 'node' && p.node === 'srv');
        atSrv.forEach((p, j) => {
            const q = A.portrait ? { x: srv.x + ss * 0.95, y: srv.y + (j - (atSrv.length - 1) / 2) * ps * 1.1 }
                                 : { x: srv.x + (j - (atSrv.length - 1) / 2) * ps * 1.1, y: srv.y + ss * 0.6 + ps * 0.9 };
            drawPacket(q, ps, p.id + 1, INET_PAQ_COLORS[p.id]);
            if (p.blocked) tinyText('⛔', q.x + ps * 0.5, q.y - ps * 0.5, '#b91c1c', ps * 0.6);
        });
        sim.packets.forEach(p => {
            if (p.state === 'move') drawPacket(paqPos(p), ps, p.id + 1, INET_PAQ_COLORS[p.id]);
            else if (p.state === 'lost' && p.lostN) {
                const a = PQ(p.lostN[0]), b = PQ(p.lostN[1]);
                const q = { x: _inetLerp(a.x, b.x, p.lostN[2]), y: _inetLerp(a.y, b.y, p.lostN[2]) };
                ctx.save(); ctx.globalAlpha = _inetClamp(p.pause / 1.3);
                ctx.font = `${U * 0.55}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('💥', q.x, q.y);
                ctx.restore();
            }
        });
        if (sim.done) pill('✅ Image complète !', dst.x, dst.y - cs * 0.5 - f * 1.4, '#16a34a', f);
        else if (sim.blocked) pill('⛔ Plus aucun chemin !', cssW / 2, A.y + f, '#b91c1c', f);
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (!syncSize()) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.setLineDash([]);
        hits = [];
        if (mode === 'voyage') drawVoyageScene();
        else if (mode === 'reseau') drawReseauScene();
        else drawPaquetsScene();
        ctx.globalAlpha = 1;
        updateInfo();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    let lastInfoKey = '';
    function stepsList(cur) {
        return `<ol class="inet-steps">${INET_STEPS.map((s, i) =>
            `<li><button data-stage="${i}" class="${!ov && cur === i ? 'on' : ''}" style="--st-c:${s.color}">${i + 1}. ${s.ico} ${s.title}</button></li>`).join('')}
            <li><button data-stage="-1" class="${ov ? 'on' : ''}" style="--st-c:#1d4f86">🔄 Vue d'ensemble</button></li></ol>`;
    }
    function partsList() {
        return `<ol class="inet-steps">${INET_PART_ORDER.map(k => {
            const p = INET_PARTS[k];
            return `<li><button data-part="${k}" class="${selPart === k ? 'on' : ''}" style="--st-c:${p.color}">${p.ico} ${p.name}</button></li>`;
        }).join('')}<li><button data-part="" class="${!selPart ? 'on' : ''}" style="--st-c:#1d4f86">🔄 Tout le réseau</button></li></ol>`;
    }
    function paqStats() {
        const s = { sent: 0, arrived: 0 };
        if (sim) sim.packets.forEach(p => { if (p.state !== 'wait') s.sent++; if (p.state === 'arrived') s.arrived++; });
        return s;
    }
    function updateInfo() {
        const cur = curStage();
        if (document.activeElement !== tlSl) tlSl.value = Math.round(G * 100);
        tlVal.textContent = `${cur + 1}. ${INET_STEPS[cur].ico}`;
        row2.querySelectorAll('.inet-stage-btn').forEach(b => b.classList.toggle('on', !ov && Number(b.dataset.stage) === cur));
        row2.querySelectorAll('.inet-part-btn').forEach(b => b.classList.toggle('on', b.dataset.part === selPart));
        row1.querySelectorAll('.inet-view').forEach(b => b.classList.toggle('on', b.dataset.view === view));
        row1.querySelectorAll('.inet-npaq').forEach(b => b.classList.toggle('on', Number(b.dataset.n) === nPaq));
        const st = paqStats();
        paqVal.textContent = `📦 Arrivés : ${st.arrived} / ${nPaq}`;

        let key;
        if (mode === 'voyage') key = 'v|' + (ov ? -1 : cur);
        else if (mode === 'reseau') key = 'r|' + selPart + '|' + view;
        else key = 'p|' + [nPaq, st.sent, st.arrived, sim ? sim.lost : 0, sim && sim.blocked, cuts.size, sim && sim.done, sim ? sim.order.join(',') : ''].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;

        if (mode === 'voyage') {
            if (ov) {
                side.style.borderLeftColor = '#3b82f6';
                side.innerHTML = `<h4>Le voyage d'une page web</h4>
                    <div class="inet-status">🔄 <span style="color:#1d4f86">Une demande… une réponse</span></div>
                    <p class="inet-text">${INET_OVERVIEW.text}</p>
                    <p class="inet-change">${INET_OVERVIEW.other}</p>
                    <p class="inet-know">💡 <b>Le savais-tu ?</b> ${INET_OVERVIEW.know}</p>
                    ${stepsList(cur)}`;
            } else {
                const s = INET_STEPS[cur];
                side.style.borderLeftColor = s.color;
                side.innerHTML = `<h4>Étape ${cur + 1} sur ${INET_STEPS.length}</h4>
                    <div class="inet-status">${s.ico} <span style="color:${s.color}">${s.title}</span></div>
                    <p class="inet-change">🔎 ${s.change}</p>
                    <p class="inet-text">${s.text}</p>
                    <p class="inet-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${stepsList(cur)}`;
            }
        } else if (mode === 'reseau') {
            const v = INET_VIEWS[view];
            const vBox = `<p class="inet-change">${v.ico} <b>${v.name}</b><br><span style="font-weight:600">${v.text}</span></p>`;
            if (!selPart) {
                side.style.borderLeftColor = v.color;
                side.innerHTML = `<h4>Le réseau</h4>
                    <div class="inet-status">🕸️ <span style="color:#1d4f86">De la maison au serveur</span></div>
                    ${vBox}
                    <p class="inet-text">${INET_RESEAU_OVERVIEW.text}</p>
                    <p class="inet-know">💡 <b>Le savais-tu ?</b> ${INET_RESEAU_OVERVIEW.know}</p>
                    ${partsList()}`;
            } else {
                const p = INET_PARTS[selPart];
                side.style.borderLeftColor = p.color;
                side.innerHTML = `<h4>Le réseau</h4>
                    <div class="inet-status">${p.ico} <span style="color:${p.color}">${p.name}</span></div>
                    <p class="inet-change">🎯 Son rôle : ${p.role}.</p>
                    <p class="inet-text">${p.text}</p>
                    <p class="inet-know">💡 <b>Le savais-tu ?</b> ${p.know}</p>
                    ${partsList()}`;
            }
        } else {
            side.style.borderLeftColor = '#db2777';
            let msg;
            if (sim && sim.done) {
                const sorted = sim.order.every((v, i) => v === i);
                msg = `<p class="inet-change">✅ <b>L'image est complète !</b> ${sorted
                    ? 'Cette fois, les paquets sont arrivés dans l\'ordre. Grâce'
                    : 'Les paquets sont arrivés <b>dans le désordre</b>, mais grâce'} à leurs <b>numéros</b>, l'ordinateur a remis chaque morceau à sa place, comme un puzzle.</p>`;
            } else if (sim && sim.blocked) {
                msg = `<p class="inet-change">⛔ <b>Plus aucun chemin libre !</b> Les paquets attendent. Touche un câble coupé pour le réparer.</p>`;
            } else if (st.sent === 0) {
                msg = `<p class="inet-change">🤔 Appuie sur <b>▶ Lecture</b> pour envoyer l'image. Tu peux aussi <b>couper des câbles</b> (touche-les) avant ou pendant le voyage : que va-t-il se passer ?</p>`;
            } else {
                msg = `<p class="inet-change">👀 Observe : les paquets ne prennent pas tous le même chemin et n'arrivent pas forcément dans l'ordre.</p>`;
            }
            const lost = sim && sim.lost ? `<li>💥 <span class="ko">${sim.lost} paquet${sim.lost > 1 ? 's' : ''} perdu${sim.lost > 1 ? 's' : ''}</span> sur un câble coupé : l'ordinateur ne l'a pas reçu, alors le serveur l'a <b>renvoyé</b>.</li>` : '';
            const order = sim && sim.order.length ? `<li>🔢 Ordre d'arrivée : <b>${sim.order.map(i => i + 1).join(', ')}</b></li>` : '';
            side.innerHTML = `<h4>Les paquets</h4>
                <div class="inet-status">📦 <span style="color:#db2777">Une image en ${nPaq} paquets</span></div>
                <p class="inet-text">Le serveur envoie une image à l'ordinateur. Il la découpe en <b>${nPaq} paquets numérotés</b>. À chaque croisement, le <b>routeur</b> choisit un câble libre.</p>
                <ul class="inet-pots">
                    <li>🚀 Partis : <b>${st.sent} / ${nPaq}</b> · 🏁 Arrivés : <b>${st.arrived} / ${nPaq}</b></li>
                    ${order}
                    ${cuts.size ? `<li>✂️ <b>${cuts.size}</b> câble${cuts.size > 1 ? 's' : ''} coupé${cuts.size > 1 ? 's' : ''} : les routeurs passent par ailleurs.</li>` : ''}
                    ${lost}
                </ul>
                ${msg}
                <p class="inet-know">💡 <b>Le savais-tu ?</b> Internet a été pensé pour continuer à marcher même quand une partie du réseau tombe en panne : il existe presque toujours plusieurs chemins possibles.</p>`;
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
            if (mode === 'voyage') { G += rdt / (fast ? 4 : 9); if (G >= 8) G -= 8; }
            else if (mode === 'paquets') { paqUpdate(rdt); if (sim && sim.done) setPlaying(false); }
        }
        draw();
        if (playing) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (animId) return; lastT = 0; animId = requestAnimationFrame(loop); }

    function setPlaying(v) {
        playing = !!v;
        if (playing) {
            if (mode === 'voyage' && ov) { ov = false; if (G >= 7.98) G = 0; lastInfoKey = ''; }
            if (mode === 'paquets' && (!sim || sim.done)) newSim();
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
    function jumpStage(i) {
        if (i < 0) { ov = true; lastInfoKey = ''; requestDraw(); return; }
        i = Math.max(0, Math.min(7, i));
        ov = false;
        G = playing ? i + 0.001 : i + INET_STEPS[i].rep;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function selectPart(k) {
        selPart = k && INET_PARTS[k] ? k : null;
        lastInfoKey = '';
        requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    }
    function setView(v) {
        view = INET_VIEWS[v] ? v : 'internet';
        lastInfoKey = '';
        requestDraw();
    }
    function setNPaq(n) {
        nPaq = INET_PAQ_GRID[n] ? n : 6;
        if (playing) setPlaying(false);
        newSim();
        requestDraw();
    }
    function setMode(m) {
        mode = m === 'reseau' || m === 'paquets' ? m : 'voyage';
        container.dataset.mode = mode;
        header.querySelectorAll('.inet-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        if (playing) setPlaying(false);
        hint.textContent = mode === 'voyage'
            ? 'Touche une machine ou une étape de la frise · ▶ Lecture pour suivre le voyage de la page'
            : mode === 'reseau'
                ? 'Touche une partie du réseau pour l\'expliquer · ▶ Lecture fait circuler les informations'
                : 'Touche un câble pour le couper ✂️ ou le réparer · ▶ Lecture envoie l\'image en paquets';
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
        else if (mode === 'reseau' && selPart) selectPart(null);
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

    header.querySelectorAll('.inet-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    speedBtn.addEventListener('click', () => { setFast(!fast); if (typeof saveBoard === 'function') saveBoard(); });
    $('.inet-prev').addEventListener('click', () => { const c = curStage(); jumpStage(ov ? c : (c <= 0 ? 7 : c - 1)); });
    $('.inet-next').addEventListener('click', () => { const c = curStage(); jumpStage(ov ? c : (c >= 7 ? 0 : c + 1)); });
    $('.inet-all').addEventListener('click', () => { jumpStage(-1); if (typeof saveBoard === 'function') saveBoard(); });
    labelsBtn.addEventListener('click', () => { showLabels = !showLabels; labelsBtn.classList.toggle('on', showLabels); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    friseBtn.addEventListener('click', () => { showFrise = !showFrise; friseBtn.classList.toggle('on', showFrise); requestDraw(); if (typeof saveBoard === 'function') saveBoard(); });
    row2.querySelectorAll('.inet-stage-btn').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.stage);
        jumpStage(!ov && curStage() === i ? -1 : i);
    }));
    row2.querySelectorAll('.inet-part-btn').forEach(b => b.addEventListener('click', () => selectPart(selPart === b.dataset.part ? null : b.dataset.part)));
    $('.inet-part-all').addEventListener('click', () => selectPart(null));
    row1.querySelectorAll('.inet-view').forEach(b => b.addEventListener('click', () => {
        setView(b.dataset.view);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    row1.querySelectorAll('.inet-npaq').forEach(b => b.addEventListener('click', () => {
        setNPaq(Number(b.dataset.n));
        if (typeof saveBoard === 'function') saveBoard();
    }));
    $('.inet-reset').addEventListener('click', () => { if (playing) setPlaying(false); newSim(); requestDraw(); });
    $('.inet-repair').addEventListener('click', () => {
        cuts.clear(); lastInfoKey = ''; requestDraw();
        if (typeof saveBoard === 'function') saveBoard();
    });
    tlSl.addEventListener('input', () => { ov = false; G = Math.max(0, Math.min(7.99, Number(tlSl.value) / 100)); lastInfoKey = ''; requestDraw(); });
    tlSl.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });

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
            window._wfMiniBarCollapse(widget, '🌐 Internet et les serveurs', {
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
    newSim();
    setMode('voyage');
    setFast(false);
    requestAnimationFrame(() => draw());

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._inetGetData = () => ({
        containerW: contW, containerH: contH,
        mode, G: Math.round(G * 1000) / 1000, ov, part: selPart, view,
        cuts: Array.from(cuts), nPaq,
        showLabels, showFrise, fast
    });
    widget._inetSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        if (typeof d.G === 'number') G = Math.max(0, Math.min(7.99, d.G));
        if (typeof d.ov === 'boolean') ov = d.ov;
        selPart = d.part && INET_PARTS[d.part] ? d.part : null;
        if (d.view && INET_VIEWS[d.view]) view = d.view;
        if (Array.isArray(d.cuts)) cuts = new Set(d.cuts.filter(i => Number.isInteger(i) && i >= 0 && i < P_LINKS.length));
        if (INET_PAQ_GRID[d.nPaq]) nPaq = d.nPaq;
        newSim();
        if (typeof d.showLabels === 'boolean') { showLabels = d.showLabels; labelsBtn.classList.toggle('on', showLabels); }
        if (typeof d.showFrise === 'boolean') { showFrise = d.showFrise; friseBtn.classList.toggle('on', showFrise); }
        setFast(!!d.fast);
        setMode(d.mode || 'voyage');
    };

    // Sur téléphone et tablette, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfAutoMaxPhoneTablet(widget, () => wfMax.click(), () => _isMax, '_inetSetData');

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
