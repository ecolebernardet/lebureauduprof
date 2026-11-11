// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (mêmes aides que dans les autres leçons : définies une seule fois)
if (!window._wfIsPhone) {
    window._wfIsPhone = function () {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia((window.PHONE_MEDIA_QUERY || '(max-width: 600px), (max-height: 500px) and (pointer: coarse)')).matches);
    };
}

// =========================================================================
// WIDGET L'ÉGALITÉ FILLES-GARÇONS (EMC) — Le Bureau du Prof
// Quatre onglets, pour des élèves de CM1 – CM2 :
//  ⚖️ Les droits : une frise en 8 dates, de la Déclaration d'Olympe de Gouges
//     (1791) à la loi sur la parité (2000) : l'école pour tous, le droit de
//     vote, l'égalité dans la Constitution, le travail, le salaire, la mixité.
//  💭 Les stéréotypes : « C'est pour qui ? » (jouets, métiers, loisirs) et
//     « Vrai ou stéréotype ? ». On répond, la carte se retourne et explique.
//  📊 Aujourd'hui : des chiffres récents (maires, députés, élèves
//     ingénieurs, professeurs des écoles, salaires, tâches à la maison).
//     On estime d'abord, puis on révèle.
//  🙋 Agir : six situations de la vie de l'école et de la maison, avec trois
//     réactions possibles à discuter, et ce que dit la règle.
// Une fiche à droite donne l'explication et un « Le savais-tu ? ».
//
// Couleurs : volontairement ni rose ni bleu pour les femmes et les hommes
// (violet et orange), pour ne pas renforcer les stéréotypes.
//
// Pensé pour le stylet de vidéoprojecteur interactif / TBI : événements
// pointer uniquement, boutons de grande taille, rien d'accessible
// uniquement au survol.
//
// Dépendances : window._wfMiniBarCollapse (défini par un autre widget),
//   board, findFreePosition(), makeDraggable(), makeDraggableRotate(),
//   bringToFront(), snapshotNow(), saveBoard()
// Sauvegarde : widget._egfgGetData() / widget._egfgSetData(d)  (save-load.js)
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {

    // ── Plein écran automatique (bouton vert) sur téléphone ET tablette ────
    // Partagé avec les jeux et les autres leçons (défini une seule fois).
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

    // CSS partagé des boutons fenêtre (injecté une seule fois, s'il manque)
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    // ── Curseurs : flèche par défaut, main sur la barre du haut (elle déplace
    //    le widget), doigt sur tout ce qui se clique
    if (!document.getElementById('egfg-cursors-style')) {
        var _cs = document.createElement('style');
        _cs.id = 'egfg-cursors-style';
        _cs.textContent = [
            '.widget[data-type="egalite-fg"] { cursor: default; }',
            '.widget[data-type="egalite-fg"] .drag-handle, .widget[data-type="egalite-fg"] .widget-rotate-handle { cursor: grab !important; }',
            '.widget[data-type="egalite-fg"] .drag-handle:active, .widget[data-type="egalite-fg"] .widget-rotate-handle:active { cursor: grabbing !important; }',
            '.widget[data-type="egalite-fg"] .egfg-container.wf-fullboard .egfg-header, .widget[data-type="egalite-fg"] .egfg-container.wf-fullboard .egfg-header:active, .widget[data-type="egalite-fg"] .egfg-container.wf-fullboard .egfg-header *:not(button):not(button *),',
            '.widget.phone-fs[data-type="egalite-fg"] .egfg-header, .widget.phone-fs[data-type="egalite-fg"] .egfg-header *:not(button):not(button *) { cursor: default !important; }',
            '.widget[data-type="egalite-fg"] button:not(:disabled), .widget[data-type="egalite-fg"] button:not(:disabled) *, .widget[data-type="egalite-fg"] select,',
            '.widget[data-type="egalite-fg"] .widget-menu-handle, .widget[data-type="egalite-fg"] .widget-pin-handle,',
            '.widget[data-type="egalite-fg"] .widget-back-handle, .widget[data-type="egalite-fg"] .widget-close-handle { cursor: pointer !important; }',
            '.widget[data-type="egalite-fg"] button:disabled, .widget[data-type="egalite-fg"] button:disabled * { cursor: default !important; }',
            '.widget[data-type="egalite-fg"]:has(.egfg-container.wf-fullboard) { transform: none !important; }'
        ].join('\n');
        document.head.appendChild(_cs);
    }
    if (document.getElementById('egfg-style')) return;
    const s = document.createElement('style');
    s.id = 'egfg-style';
    s.textContent = `
        .widget[data-type="egalite-fg"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .egfg-container {
            --egfg-f: #7c3aed;   /* femmes : violet (ni rose ni bleu, exprès) */
            --egfg-h: #f59e0b;   /* hommes : orange */
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
        .egfg-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .egfg-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .egfg-header .wf-btns { gap: 8px; }
        .egfg-header .wf-btn { width: 18px; height: 18px; }
        .egfg-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .egfg-container.wf-fullboard {
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
        .egfg-tabs { display: inline-flex; background: #eef1f5; border-radius: 11px; padding: 3px; gap: 3px; }
        .egfg-tab {
            min-height: 34px; padding: 4px 14px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .egfg-tab.on { background: #fff; color: #1d4f86; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .egfg-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .egfg-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .egfg-btn:hover { background: #e0e0e0; }
        .egfg-btn:active { transform: scale(0.96); }
        .egfg-btn:disabled { opacity: .45; transform: none; }
        .egfg-btn.on { background: #3b8fd9; color: #fff; border-color: #3b8fd9; }
        .egfg-btn-play { min-width: 112px; }
        .egfg-btn-play.on { background: #e8833a; border-color: #e8833a; }
        .egfg-btn-go { background: #16a34a; color: #fff; border-color: #16a34a; }
        .egfg-btn-go:hover { background: #15803d; }
        .egfg-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .egfg-lbl { font-size: 12px; font-weight: 800; color: #6b7280; white-space: nowrap; }
        .egfg-stage-btn { padding: 5px 9px; border-left: 4px solid var(--st-c, #bbb); }
        .egfg-stage-btn.on { background: var(--st-c, #3b8fd9); border-color: var(--st-c, #3b8fd9); color: #fff; }
        .egfg-slider-box { display: flex; align-items: center; gap: 8px; flex: 1 1 220px; min-width: 180px; }
        .egfg-slider { flex: 1; height: 30px; accent-color: #7c3aed; cursor: pointer; touch-action: none; }
        .egfg-val { font-size: 13px; font-weight: 800; color: #1d4f86; min-width: 70px; text-align: right; white-space: nowrap; }

        /* Corps */
        .egfg-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .egfg-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #f3efff;
            display: flex; flex-direction: column;
        }
        .egfg-scene {
            flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: .7em .8em 1.9em;
            box-sizing: border-box; color: #1f2937; line-height: 1.3;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .egfg-hint {
            position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
            font-size: 12px; color: #4b5563; pointer-events: none;
            text-shadow: 0 1px 0 rgba(255,255,255,.8);
        }
        .egfg-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #7c3aed;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .egfg-side h4 { margin: 0 0 4px; font-size: 1.15em; font-weight: 900; color: #1d4f86; }
        .egfg-status { font-size: 1.1em; font-weight: 900; margin: 2px 0 6px; }
        .egfg-change { background: #efe9fe; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #3b1f74; font-weight: 700; }
        .egfg-text { margin: 0 0 6px; }
        .egfg-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .egfg-src { font-size: .85em; color: #6b7280; margin: 0 0 8px; }
        .egfg-src a, .egfg-srcs a { color: #5b21b6; text-decoration: underline; word-break: break-word; }
        .egfg-srcs h5 { margin: 8px 0 3px; font-size: .95em; color: #2A1F4A; }
        .egfg-srcs ul { margin: 0 0 4px; padding-left: 18px; font-size: .85em; color: #4b5563; }
        .egfg-srcs li { margin: 0 0 3px; }
        .egfg-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .egfg-steps button {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font: 700 13px inherit; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .egfg-steps button.on { background: var(--st-c, #3b8fd9); color: #fff; }

        /* ⚖️ Frise des droits */
        .egfg-frise { position: relative; display: flex; justify-content: space-between; margin: .3em .4em 1em; }
        .egfg-frise::before {
            content: ''; position: absolute; left: 1em; right: 1em; top: 1.15em; height: .3em;
            background: #ddd6fe; border-radius: 99px;
        }
        .egfg-frise-fill {
            position: absolute; left: 1em; top: 1.15em; height: .3em; background: #7c3aed; border-radius: 99px;
            transition: width .4s ease;
        }
        .egfg-dot {
            position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: .15em;
            background: none; border: none; padding: 0; font-family: inherit; cursor: pointer; touch-action: manipulation;
        }
        .egfg-dot-c {
            width: 2.3em; height: 2.3em; border-radius: 50%; background: #fff; border: .16em solid var(--st-c);
            display: flex; align-items: center; justify-content: center; font-size: 1em;
        }
        .egfg-dot.past .egfg-dot-c { background: #ede9fe; }
        .egfg-dot.on .egfg-dot-c { background: var(--st-c); transform: scale(1.15); box-shadow: 0 0 0 .25em rgba(124,58,237,.18); }
        .egfg-dot-y { font-size: .78em; font-weight: 900; color: #6b7280; }
        .egfg-dot.on .egfg-dot-y { color: var(--st-c); }
        .egfg-big {
            background: #fff; border-radius: 1em; padding: .9em 1.1em; box-shadow: 0 .3em 1em rgba(60,30,120,.12);
            border-top: .4em solid var(--st-c, #7c3aed); display: flex; gap: 1em; align-items: center;
            animation: egfg-pop .35s ease;
        }
        .egfg-big-ico { font-size: 3.4em; line-height: 1; flex-shrink: 0; }
        .egfg-big-y { font-size: 2.3em; font-weight: 900; color: var(--st-c, #7c3aed); line-height: 1; }
        .egfg-big-t { font-size: 1.3em; font-weight: 900; margin: .15em 0 .3em; }
        .egfg-big-c { font-size: 1.05em; color: #374151; }
        .egfg-quote {
            margin: .8em 0 0; padding: .6em .9em; border-left: .3em solid var(--st-c, #7c3aed);
            background: rgba(255,255,255,.75); border-radius: .5em; font-style: italic; color: #3b1f74; font-size: 1em;
        }
        .egfg-mosaic { display: grid; grid-template-columns: repeat(auto-fill, minmax(9.5em, 1fr)); gap: .6em; }
        .egfg-mini {
            background: #fff; border-radius: .8em; padding: .6em .7em; border-top: .3em solid var(--st-c);
            box-shadow: 0 .15em .5em rgba(60,30,120,.1); text-align: left; font-family: inherit; color: inherit;
            border-left: none; border-right: none; border-bottom: none; cursor: pointer; touch-action: manipulation;
        }
        .egfg-mini:hover { transform: translateY(-2px); }
        .egfg-mini-y { font-size: 1.25em; font-weight: 900; color: var(--st-c); }
        .egfg-mini-t { font-size: .9em; font-weight: 800; margin-top: .15em; }
        .egfg-intro { font-size: 1.15em; font-weight: 900; color: #3b1f74; margin: 0 0 .6em; text-align: center; }

        /* 💭 Cartes des stéréotypes */
        .egfg-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(10.5em, 1fr)); gap: .65em; }
        .egfg-card {
            background: #fff; border-radius: .9em; padding: .6em .6em .7em; text-align: center;
            box-shadow: 0 .15em .55em rgba(60,30,120,.12); border: .15em solid transparent;
            display: flex; flex-direction: column; align-items: center; gap: .3em; cursor: pointer; touch-action: manipulation;
        }
        .egfg-card.sel { border-color: #7c3aed; }
        .egfg-card-ico { font-size: 2.3em; line-height: 1.1; }
        .egfg-card-n { font-size: 1.02em; font-weight: 900; }
        .egfg-card-q { font-size: .78em; font-weight: 800; color: #6b7280; }
        .egfg-votes { display: flex; gap: .25em; flex-wrap: wrap; justify-content: center; }
        .egfg-vote {
            font-family: inherit; font-size: .8em; font-weight: 800; border-radius: .6em; padding: .3em .45em;
            border: 1px solid #ddd6fe; background: #f5f3ff; color: #3b1f74; cursor: pointer; touch-action: manipulation; min-height: 2.2em;
        }
        .egfg-vote:hover { background: #ede9fe; }
        .egfg-res { font-size: .85em; font-weight: 800; border-radius: .6em; padding: .35em .5em; animation: egfg-pop .3s ease; }
        .egfg-res.ok { background: #dcfce7; color: #14532d; }
        .egfg-res.ko { background: #fef3c7; color: #78350f; }
        .egfg-score {
            display: inline-block; font-weight: 900; color: #3b1f74; background: #ede9fe;
            border-radius: 99px; padding: .2em .8em; margin: 0 0 .6em;
        }

        /* 📊 Chiffres */
        .egfg-q { font-size: 1.35em; font-weight: 900; text-align: center; color: #3b1f74; margin: .2em 0 .7em; }
        .egfg-people { display: flex; justify-content: center; gap: .25em; flex-wrap: nowrap; margin: 0 0 .5em; }
        .egfg-person { width: 3.4em; height: 5em; position: relative; }
        .egfg-person svg { width: 100%; height: 100%; display: block; }
        .egfg-person.guess::after {
            content: ''; position: absolute; inset: -.2em -.1em; border: .14em dashed #7c3aed; border-radius: .6em;
        }
        .egfg-legend { display: flex; justify-content: center; gap: 1.2em; font-weight: 800; margin: .2em 0 .6em; flex-wrap: wrap; }
        .egfg-legend i { display: inline-block; width: .9em; height: .9em; border-radius: .25em; margin-right: .3em; vertical-align: -.1em; }
        .egfg-answer {
            text-align: center; font-size: 1.25em; font-weight: 900; color: #14532d; background: #dcfce7;
            border-radius: .7em; padding: .45em .8em; margin: 0 auto .5em; max-width: 30em; animation: egfg-pop .35s ease;
        }
        .egfg-guess-txt { text-align: center; font-weight: 800; color: #6b7280; margin: 0 0 .5em; }
        .egfg-bars { display: flex; flex-direction: column; gap: .7em; max-width: 34em; margin: 0 auto .7em; }
        .egfg-bar-row { display: flex; align-items: center; gap: .6em; }
        .egfg-bar-l { width: 6.5em; font-weight: 900; text-align: right; flex-shrink: 0; }
        .egfg-bar-t { flex: 1; height: 2.2em; background: #ece8f6; border-radius: .6em; overflow: hidden; }
        .egfg-bar-f {
            height: 100%; border-radius: .6em; display: flex; align-items: center; justify-content: flex-end;
            padding-right: .5em; box-sizing: border-box; color: #fff; font-weight: 900; transition: width .8s ease; white-space: nowrap;
        }
        .egfg-hidden-v { color: #6b7280; font-weight: 900; text-align: center; font-size: 1.1em; }

        /* 🙋 Situations */
        .egfg-sit {
            background: #fff; border-radius: 1em; padding: .9em 1em; box-shadow: 0 .3em 1em rgba(60,30,120,.12);
            border-top: .4em solid var(--st-c, #7c3aed); animation: egfg-pop .3s ease;
        }
        .egfg-sit-pic { font-size: 2.6em; text-align: center; letter-spacing: .1em; line-height: 1.15; }
        .egfg-sit-t { font-size: 1.25em; font-weight: 900; text-align: center; margin: .2em 0 .4em; color: #3b1f74; }
        .egfg-bubble {
            position: relative; background: #f5f3ff; border-radius: .8em; padding: .6em .8em; font-size: 1.05em; margin: 0 0 .7em;
        }
        .egfg-choices { display: flex; flex-direction: column; gap: .45em; }
        .egfg-choice {
            text-align: left; font-family: inherit; font-size: 1em; font-weight: 700; color: #1f2937;
            background: #fff; border: .12em solid #ddd6fe; border-radius: .7em; padding: .5em .7em;
            cursor: pointer; touch-action: manipulation; display: flex; gap: .5em; align-items: flex-start;
        }
        .egfg-choice:hover:not(:disabled) { background: #f5f3ff; }
        .egfg-choice b { flex-shrink: 0; width: 1.6em; height: 1.6em; border-radius: 50%; background: #ede9fe; color: #5b21b6;
            display: inline-flex; align-items: center; justify-content: center; }
        .egfg-choice.best { border-color: #16a34a; background: #f0fdf4; }
        .egfg-choice.mid { border-color: #f59e0b; background: #fffbeb; }
        .egfg-choice.bad { border-color: #dc2626; background: #fef2f2; }
        .egfg-choice.dim { opacity: .55; }
        .egfg-fb { margin-top: .6em; border-radius: .7em; padding: .55em .8em; font-weight: 700; animation: egfg-pop .3s ease; }
        .egfg-fb.best { background: #dcfce7; color: #14532d; }
        .egfg-fb.mid { background: #fef3c7; color: #78350f; }
        .egfg-fb.bad { background: #fee2e2; color: #7f1d1d; }

        @keyframes egfg-pop { from { opacity: 0; transform: translateY(6px) scale(.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) {
            .egfg-big, .egfg-res, .egfg-answer, .egfg-sit, .egfg-fb { animation: none; }
            .egfg-bar-f, .egfg-frise-fill { transition: none; }
        }

        /* Aide */
        .egfg-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .egfg-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 390px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
            max-height: calc(100% - 70px); overflow-y: auto;
        }
        .egfg-help-popup.show { display: block; }
        .egfg-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .egfg-help-popup p { margin: 0 0 6px; }

        .egfg-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .egfg-resize-handle:hover { opacity: 1; }
        .egfg-container:not([data-mode="droits"]) .egfg-only-droits { display: none !important; }
        .egfg-container:not([data-mode="stereo"]) .egfg-only-stereo { display: none !important; }
        .egfg-container:not([data-mode="chiffres"]) .egfg-only-chiffres { display: none !important; }
        .egfg-container:not([data-mode="agir"]) .egfg-only-agir { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .egfg-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .egfg-tab-short { display: none; }
        .egfg-header { min-width: 0; max-width: 100%; }
        .egfg-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .egfg-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .egfg-header .wf-btns { flex-shrink: 0; }
        .egfg-container.wf-fullboard .egfg-resize-handle { display: none; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .egfg-container { padding: 10px 10px 8px; gap: 6px; }
            .egfg-header { gap: 6px; }
            .egfg-title { font-size: 13px; }
            .egfg-tab { min-height: 32px; padding: 3px 9px; font-size: 12px; }
            .egfg-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                      -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .egfg-row > * { flex-shrink: 0; }
            .egfg-row + .egfg-row { flex-wrap: wrap; overflow: visible; }
            .egfg-row + .egfg-row .egfg-lbl:first-child { display: none; }
            .egfg-slider-box { flex: 1 1 160px; min-width: 0; }
            .egfg-val { min-width: 0; }
            .egfg-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .egfg-btn-play { min-width: 0; }
            .egfg-sep { display: none; }
            .egfg-hint { font-size: 11px; bottom: 4px; padding: 0 6px; }
            .egfg-side { padding: 8px 10px; font-size: 13px; }
            .egfg-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
            .egfg-dot-y { font-size: .68em; }
        }
        @media (max-width: 560px) {
            .egfg-title { display: none; }
            .egfg-tab { padding: 3px 7px; font-size: 11.5px; }
            .egfg-tab-long { display: none; }
            .egfg-tab-short { display: inline; }
            .egfg-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 600px) and (orientation: portrait) {
            .egfg-body { flex-direction: column; }
            .egfg-slider-box { flex: 1 1 100%; }
            .egfg-scene-wrap { flex: 1 1 0; min-height: 240px; }
            .egfg-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 40%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 600px) and (orientation: landscape) {
            .egfg-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }

        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable */
        .widget[data-type="egalite-fg"], .egfg-container, .egfg-container * { cursor: default !important; }
        .egfg-container .egfg-header, .egfg-container .egfg-header * { cursor: grab !important; }
        .egfg-container .egfg-header:active, .egfg-container .egfg-header:active * { cursor: grabbing !important; }
        .egfg-container button, .egfg-container button *, .egfg-container .egfg-header button,
        .egfg-container .egfg-header button *, .egfg-container .egfg-card, .egfg-container .egfg-card *,
        .egfg-container input[type="range"], .egfg-container a { cursor: pointer !important; }
        .egfg-container button:disabled, .egfg-container button:disabled * { cursor: default !important; }
        .egfg-container .egfg-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les autres leçons ── */
        .egfg-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .egfg-title {
            font-size: 21px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .egfg-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .egfg-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .egfg-help-popup { top: 56px; }
        .egfg-container.wf-fullboard .egfg-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .egfg-container.wf-fullboard .egfg-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .egfg-title { font-size: 17px; }
        }
        .egfg-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .egfg-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 13px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .egfg-tab:hover { background: rgba(255,255,255,.1); }
        .egfg-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        .egfg-header { flex-wrap: nowrap; }
        @media (max-width: 600px), (max-height: 500px) and (pointer: coarse) {
            .egfg-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .egfg-container.wf-fullboard .egfg-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .egfg-tab { padding: 3px 10px; font-size: 12px; }
            .egfg-help-popup { top: 50px; }
        }
        @media (max-width: 560px) {
            .egfg-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Contenu pédagogique ───────────────────────────────────────────────────

// ⚖️ La frise des droits (8 dates)
const EGFG_STEPS = [
    {
        year: '1791', ico: '✒️', name: 'Olympe de Gouges', title: 'Une déclaration pour les femmes', color: '#7c3aed',
        change: `Olympe de Gouges réclame pour les femmes les mêmes droits que pour les hommes.`,
        text: `En 1789, pendant la Révolution, la <b>Déclaration des droits de l'homme et du citoyen</b> annonce que les hommes naissent libres et égaux en droits. Mais les femmes n'ont pas les mêmes droits : elles ne votent pas, par exemple. En 1791, <b>Olympe de Gouges</b> écrit la <b>Déclaration des droits de la femme et de la citoyenne</b> pour réclamer l'égalité.`,
        quote: `« La femme naît libre et demeure égale à l'homme en droits. » (Olympe de Gouges, 1791)`,
        know: `À son époque, on ne l'a pas écoutée : il a fallu plus de 150 ans pour que les femmes obtiennent le droit de vote en France.`,
        src: { t: "Déclaration des droits de la femme et de la citoyenne, Olympe de Gouges (1791) ; chronologie du droit de vote des femmes, Archives départementales du Var", u: 'https://archives.var.fr/_depot_ad83/ark_cms/_depot_arko/articles/14889/chronologie-sur-le-droit-de-vote-des-femmes_doc.pdf' }
    },
    {
        year: '1882', ico: '🏫', name: "L'école pour tous", title: "L'école obligatoire pour les filles et les garçons", color: '#2563eb',
        change: `L'école devient gratuite, obligatoire et laïque pour tous les enfants de 6 à 13 ans.`,
        text: `Avec les <b>lois de Jules Ferry</b> (1881 et 1882), l'école primaire devient <b>gratuite</b>, <b>obligatoire</b> et <b>laïque</b> pour <b>toutes les filles et tous les garçons</b>. Avant, beaucoup de filles n'apprenaient pas à lire ni à écrire. Mais les filles et les garçons étaient encore séparés, dans des écoles ou des classes différentes.`,
        know: `En 1861, Julie-Victoire Daubié est la première femme à obtenir le baccalauréat en France.`,
        src: { t: "Lois Ferry du 16 juin 1881 et du 28 mars 1882 ; frise historique des droits des femmes et des hommes, académie de Normandie", u: 'https://mortain.circonscription.ac-normandie.fr/IMG/pdf/frise_historique_sur_le_droit_des_femmes_et_des_hommes.pdf' }
    },
    {
        year: '1944', ico: '🗳️', name: 'Le droit de vote', title: 'Les femmes peuvent voter', color: '#0891b2',
        change: `Les femmes obtiennent le droit de voter et d'être élues.`,
        text: `Le <b>21 avril 1944</b>, les femmes françaises obtiennent le <b>droit de vote</b> et le droit d'être <b>élues</b>. Elles votent pour la première fois le <b>29 avril 1945</b>, aux élections municipales. Jusque-là, seuls les hommes choisissaient le maire, les députés et le président.`,
        know: `Dans d'autres pays, les femmes votaient déjà bien avant : en Nouvelle-Zélande dès 1893 !`,
        src: { t: "Ordonnance du 21 avril 1944 ; Assemblée nationale, « Les 33 femmes élues députées en 1945 »", u: 'https://www2.assemblee-nationale.fr/decouvrir-l-assemblee/histoire/le-suffrage-universel/la-conquete-de-la-citoyennete-politique-des-femmes/les-33-femmes-elues-deputees-en-1945' }
    },
    {
        year: '1946', ico: '📜', name: 'La Constitution', title: "L'égalité écrite dans la Constitution", color: '#059669',
        change: `La loi la plus importante de la France garantit l'égalité entre les femmes et les hommes.`,
        text: `En 1946, le texte qui ouvre la <b>Constitution</b> (la loi la plus importante du pays) affirme que les femmes ont les <b>mêmes droits que les hommes</b>, dans tous les domaines. Ce texte fait toujours partie de notre Constitution aujourd'hui.`,
        quote: `« La loi garantit à la femme, dans tous les domaines, des droits égaux à ceux de l'homme. » (Constitution, 1946)`,
        know: `Une loi, c'est une règle que tout le monde doit respecter. Quand l'égalité est écrite dans la loi, on peut la faire respecter devant un juge.`,
        src: { t: "Préambule de la Constitution de 1946, alinéa 3 ; frise des droits des femmes, préfecture de région", u: 'https://www.prefectures-regions.gouv.fr/irecontenu/telechargement/103758/658175/file/Frise_8mars_pagesA3-1.pdf' }
    },
    {
        year: '1965', ico: '💼', name: 'Travailler librement', title: 'Travailler sans demander la permission', color: '#d97706',
        change: `Une femme mariée peut travailler et avoir un compte en banque sans l'accord de son mari.`,
        text: `Avant 1965, une femme mariée devait avoir l'<b>autorisation de son mari</b> pour exercer un métier, et elle ne pouvait pas ouvrir seule un <b>compte en banque</b>. Depuis la loi du 13 juillet 1965, elle peut le faire <b>librement</b>, comme un homme.`,
        know: `C'était il y a environ 60 ans seulement : c'est l'époque où beaucoup de grands-parents d'aujourd'hui étaient enfants.`,
        src: { t: "Loi du 13 juillet 1965 portant réforme des régimes matrimoniaux ; frise des droits des femmes, préfecture du Rhône", u: 'https://www.rhone.gouv.fr/contenu/telechargement/54393/375021/file/Frise_8mars_pagesA3.pdf' }
    },
    {
        year: '1972', ico: '💶', name: 'Le même salaire', title: 'À travail égal, salaire égal', color: '#dc2626',
        change: `La loi oblige à payer autant une femme qu'un homme pour le même travail.`,
        text: `En 1972, une loi oblige les employeurs à verser le <b>même salaire</b> aux femmes et aux hommes qui font un <b>travail de même valeur</b>. C'est le principe « <b>à travail égal, salaire égal</b> ». D'autres lois, comme celle de 1983, interdisent aussi de refuser un emploi à quelqu'un parce que c'est une femme ou un homme.`,
        know: `Pourtant, aujourd'hui encore, les femmes gagnent en moyenne moins que les hommes. Regarde l'onglet 📊 Aujourd'hui pour comprendre pourquoi.`,
        src: { t: "Loi du 22 décembre 1972 relative à l'égalité de rémunération ; loi du 13 juillet 1983 sur l'égalité professionnelle (loi Roudy)" }
    },
    {
        year: '1975', ico: '👫', name: 'La mixité', title: "Filles et garçons dans la même classe", color: '#db2777',
        change: `La mixité devient obligatoire dans toutes les écoles, tous les collèges et tous les lycées publics.`,
        text: `Pendant longtemps, les filles et les garçons étaient séparés à l'école. Peu à peu, les classes deviennent <b>mixtes</b>. En 1975, la loi rend la <b>mixité obligatoire</b> dans l'enseignement public : les filles et les garçons apprennent <b>ensemble</b>, la même chose, dans la même classe.`,
        know: `Ta classe est mixte : c'est grâce à cette loi. Avant, dans beaucoup d'écoles, on avait même deux portes d'entrée : « Filles » et « Garçons ».`,
        src: { t: "Loi Haby du 11 juillet 1975 ; Onisep, « L'égalité filles-garçons à l'école »", u: 'https://www.onisep.fr/metier/les-quiz-de-l-onisep/egalite-filles-garcons/quiz-l-egalite-filles-garcons-a-l-ecole' }
    },
    {
        year: '2000', ico: '🏛️', name: 'La parité', title: 'Autant de femmes que d\'hommes sur les listes', color: '#4f46e5',
        change: `Les listes de candidats aux élections doivent compter autant de femmes que d'hommes.`,
        text: `Même avec le droit de vote, très peu de femmes étaient élues. La <b>loi sur la parité</b> de juin 2000 oblige les partis à présenter <b>autant de femmes que d'hommes</b> sur les listes de candidats à de nombreuses élections. <b>Parité</b> veut dire : la moitié de femmes, la moitié d'hommes.`,
        know: `Depuis les élections municipales de 2026, cette règle s'applique même dans les plus petites communes.`,
        src: { t: "Loi du 6 juin 2000 sur la parité ; loi du 21 mai 2025 (listes paritaires dans toutes les communes), ministère de l'Intérieur", u: 'https://www.interieur.gouv.fr/actualites/actualites-du-ministere/municipales-2026-mode-de-scrutin-change-pour-communes-de-moins-de-1-000-habitants' }
    }
];
const EGFG_OVERVIEW = {
    text: `En France, les filles et les garçons, les femmes et les hommes ont aujourd'hui les <b>mêmes droits</b>. Ce n'a pas toujours été le cas : l'égalité a été <b>gagnée petit à petit</b>, grâce à des femmes et des hommes qui se sont battus pour elle et à des <b>lois</b>.`,
    other: `⚖️ <b>Égalité</b> ne veut pas dire que tout le monde est pareil : chacun est différent, mais tout le monde a les <b>mêmes droits</b> et doit avoir les <b>mêmes chances</b>.`,
    know: `La devise de la République est « Liberté, Égalité, Fraternité ». L'égalité entre les filles et les garçons en fait partie.`
};

// 💭 Les stéréotypes : « C'est pour qui ? » et « Vrai ou stéréotype ? »
const EGFG_GROUPS = {
    jouets: { ico: '🧸', name: 'Jouets et jeux', kind: 'qui' },
    metiers: { ico: '👷', name: 'Métiers', kind: 'qui' },
    loisirs: { ico: '⚽', name: 'Sports et loisirs', kind: 'qui' },
    phrases: { ico: '💬', name: 'Vrai ou stéréotype ?', kind: 'vf' }
};
const EGFG_GROUP_ORDER = ['jouets', 'metiers', 'loisirs', 'phrases'];
const EGFG_CARDS = {
    jouets: [
        { ico: '🪆', name: 'La poupée', text: `Jouer à la poupée, c'est imiter un parent qui s'occupe d'un bébé. Les papas aussi donnent le biberon, changent les couches et font des câlins !`, know: `En France, à la naissance de son enfant, un père a droit à 28 jours de congé pour s'en occuper.`, src: { t: "Service-Public.fr, « Congé de paternité et d'accueil de l'enfant »", u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F3156' } },
        { ico: '🚗', name: 'Les petites voitures', text: `Conduire, réparer un moteur, faire la course : rien de tout cela ne dépend d'être une fille ou un garçon.`, know: `En 1982, la Française Michèle Mouton est devenue vice-championne du monde des rallyes automobiles.`, src: { t: "Palmarès du championnat du monde des rallyes 1982" } },
        { ico: '🧱', name: 'Les jeux de construction', text: `Construire, imaginer des maisons et des ponts : c'est utile pour devenir architecte ou ingénieur, et ces métiers sont ouverts à toutes et à tous.`, know: `En 2004, l'architecte Zaha Hadid est la première femme à recevoir le prix Pritzker, le plus grand prix d'architecture.`, src: { t: "Palmarès du prix Pritzker 2004" } },
        { ico: '🍳', name: 'La dînette', text: `Faire la cuisine, c'est utile à tout le monde, tous les jours ! À la maison comme au restaurant, les femmes et les hommes cuisinent.`, know: `En 2007, la cheffe Anne-Sophie Pic a obtenu trois étoiles au guide Michelin, la plus haute récompense des restaurants.`, src: { t: "Guide Michelin France 2007" } },
        { ico: '🔬', name: 'Le kit de petit chimiste', text: `Observer, faire des expériences, chercher à comprendre : la science a besoin de toutes les curiosités, celles des filles comme celles des garçons.`, know: `Marie Curie a reçu deux prix Nobel, en physique (1903) puis en chimie (1911). C'est la seule personne récompensée dans deux sciences différentes.`, src: { t: "Fondation Nobel, prix de physique 1903 et de chimie 1911" } },
        { ico: '🎀', name: 'Le rose', text: `Les couleurs n'ont pas de sexe : chacun peut aimer le rose, le bleu, le vert… Ce qu'on croit « pour les filles » ou « pour les garçons » change selon les époques.`, know: `En 1927, un magazine américain a publié un tableau où plusieurs grands magasins conseillaient le rose… pour les garçons !`, src: { t: "Magazine Time (1927), cité par l'historienne Jo B. Paoletti (« Pink and Blue », 2012)" } }
    ],
    metiers: [
        { ico: '🚒', name: 'Pompier ou pompière', text: `Ce métier demande du courage, de l'entraînement et de l'esprit d'équipe. Ce sont des qualités humaines, pas des qualités « de garçon ».`, know: `En France, les femmes peuvent devenir sapeurs-pompiers depuis 1976.`, src: { t: "Décret du 25 octobre 1976 ; question écrite à l'Assemblée nationale sur la féminisation des sapeurs-pompiers", u: 'https://www.assemblee-nationale.fr/dyn/16/questions/QANR5L16QE14526.pdf' } },
        { ico: '👶', name: 'Sage-femme', text: `Malgré son nom, ce métier, qui aide les mamans à mettre leur bébé au monde, est ouvert aux hommes. On les appelle aussi des « maïeuticiens ».`, know: `Les hommes peuvent devenir sages-femmes en France depuis 1982.`, src: { t: "Loi du 19 mai 1982 ; question écrite à l'Assemblée nationale sur la profession de sage-femme", u: 'https://www.assemblee-nationale.fr/dyn/12/questions/QANR5L12QE760.pdf' } },
        { ico: '🚀', name: 'Astronaute', text: `Pour aller dans l'espace, il faut beaucoup étudier, être en bonne santé et savoir garder son calme. Les femmes et les hommes en sont capables.`, know: `En 1996, Claudie Haigneré est la première Française à partir dans l'espace.`, src: { t: "Mission spatiale Cassiopée (1996), CNES" } },
        { ico: '🧑‍🏫', name: 'Professeur des écoles', text: `Apprendre aux enfants à lire, à compter et à vivre ensemble : c'est un métier pour les femmes comme pour les hommes.`, know: `Aujourd'hui, plus de 8 professeurs des écoles sur 10 sont des femmes : les garçons aussi peuvent choisir ce beau métier !`, src: { t: "Ministère de l'Éducation nationale, bilan du Pacte enseignant (juillet 2025), via l'agence AEF", u: 'https://media.ac-normandie.fr/-/communication/revue-presse/2025/07/09/AEF_nat_cri_National_Pacte%20enseignant,%20le%20minist%e8re%20pr%e9sente%20le%20bilan%20annuel%20aux%20syndicats,%20qui%20demandent%20un%20virage%20qualitatif.pdf' } },
        { ico: '✈️', name: "Pilote d'avion", text: `Piloter un avion demande de la concentration, de la précision et beaucoup d'entraînement, pour tout le monde.`, know: `En 1921, l'aviatrice française Adrienne Bolland est la première personne à traverser en avion la cordillère des Andes, de hautes montagnes d'Amérique du Sud.`, src: { t: "Vol d'Adrienne Bolland du 1er avril 1921" } },
        { ico: '🔧', name: 'Mécanicien ou mécanicienne', text: `Réparer des voitures, des vélos ou des machines, ça s'apprend. Il n'y a pas de métier d'homme ni de métier de femme.`, know: `Depuis 1983, la loi interdit de refuser un emploi à une personne parce que c'est une femme ou un homme.`, src: { t: "Loi du 13 juillet 1983 sur l'égalité professionnelle (loi Roudy)" } }
    ],
    loisirs: [
        { ico: '⚽', name: 'Le football', text: `Le football se joue partout dans le monde, par les filles comme par les garçons, à l'école, dans les clubs et dans les grandes compétitions.`, know: `La première Coupe du monde de football féminine a eu lieu en 1991.`, src: { t: "FIFA, Coupe du monde féminine 1991 (Chine)" } },
        { ico: '🩰', name: 'La danse', text: `La danse demande de la force, de la souplesse et du travail. Les danseurs et les danseuses s'entraînent tous les jours.`, know: `Le roi Louis XIV dansait lui-même dans les ballets. Il a créé l'Académie royale de danse en 1661.`, src: { t: "Lettres patentes de l'Académie royale de danse (1661)" } },
        { ico: '🥋', name: 'Le judo', text: `Les sports de combat apprennent le respect, le contrôle de soi et la confiance. Ils sont faits pour les filles comme pour les garçons.`, know: `La judokate française Clarisse Agbégnénou a été six fois championne du monde et championne olympique.`, src: { t: "Palmarès de la Fédération internationale de judo" } },
        { ico: '🧶', name: 'Le tricot et la couture', text: `Coudre ou tricoter, c'est créer avec ses mains. Ce n'est pas réservé aux filles ni aux mamies !`, know: `Beaucoup de grands couturiers sont des hommes, comme Christian Dior ou Yves Saint Laurent.` },
        { ico: '🎮', name: 'Les jeux vidéo', text: `On peut aimer jouer, créer des jeux ou programmer, que l'on soit une fille ou un garçon.`, know: `En France, presque la moitié des personnes qui jouent aux jeux vidéo sont des femmes.`, src: { t: "SELL et Médiamétrie, « Les Français et le jeu vidéo en 2025 »", u: 'https://www.sell.fr/sites/default/files/espace-presse/cp_etude_les_francais_et_le_jeu_video_en_2025.pdf' } },
        { ico: '🧗', name: "L'escalade", text: `Grimper demande de l'agilité, du courage et de la réflexion. Ces qualités ne dépendent pas d'être une fille ou un garçon.`, know: `En 1992, l'alpiniste française Catherine Destivelle a été la première femme à gravir seule, en hiver, la face nord de l'Eiger, une montagne très difficile de Suisse.`, src: { t: "Ascension de Catherine Destivelle, mars 1992" } }
    ],
    phrases: [
        { ico: '😢', name: '« Les garçons ne pleurent pas. »', answer: 'stereo', text: `Tout le monde ressent de la tristesse, de la peur ou de la joie. Pleurer est normal et fait du bien, que l'on soit une fille ou un garçon.`, know: `Exprimer ses émotions aide à aller mieux et à se faire aider. En parler, c'est être courageux.` },
        { ico: '➗', name: '« Les filles sont moins fortes en maths. »', answer: 'stereo', text: `Les filles et les garçons ont les mêmes capacités. Mais quand on entend souvent cette phrase, on finit par perdre confiance, et c'est ce qui crée l'écart.`, know: `En 2014, la mathématicienne Maryam Mirzakhani est la première femme à recevoir la médaille Fields, l'un des plus grands prix de mathématiques.`, src: { t: "Union mathématique internationale, médailles Fields 2014" } },
        { ico: '⚖️', name: '« En France, les filles et les garçons ont les mêmes droits. »', answer: 'vrai', text: `C'est vrai : la Constitution et les lois garantissent l'égalité entre les femmes et les hommes. Il faut encore la faire respecter dans la vie de tous les jours.`, know: `L'égalité est écrite dans la Constitution depuis 1946. Va voir la frise dans l'onglet ⚖️ Les droits.`, src: { t: "Préambule de la Constitution de 1946, alinéa 3" } },
        { ico: '🤫', name: '« Les filles sont plus calmes que les garçons. »', answer: 'stereo', text: `Certaines filles sont calmes, d'autres très énergiques, et c'est pareil pour les garçons. Chaque enfant a son propre caractère.`, know: `Un stéréotype met tout le monde dans la même case. Il oublie que chaque personne est unique.` },
        { ico: '🗳️', name: '« En France, les femmes peuvent voter depuis 1944. »', answer: 'vrai', text: `C'est vrai : elles ont obtenu le droit de vote le 21 avril 1944 et ont voté pour la première fois en 1945.`, know: `Aujourd'hui, à 18 ans, chaque citoyenne et chaque citoyen peut voter.`, src: { t: "Ordonnance du 21 avril 1944 ; Assemblée nationale", u: 'https://www2.assemblee-nationale.fr/decouvrir-l-assemblee/histoire/le-suffrage-universel/la-conquete-de-la-citoyennete-politique-des-femmes/les-33-femmes-elues-deputees-en-1945' } },
        { ico: '💶', name: '« La loi interdit de payer moins une femme pour le même travail. »', answer: 'vrai', text: `C'est vrai, depuis 1972 : à travail égal, salaire égal. Mais les femmes gagnent encore moins en moyenne, pour d'autres raisons (onglet 📊).`, know: `Les entreprises de 50 salariés ou plus doivent publier chaque année une note qui mesure l'égalité entre leurs salariées et leurs salariés.`, src: { t: "Loi du 22 décembre 1972 ; Index de l'égalité professionnelle (loi du 5 septembre 2018)" } }
    ]
};
const EGFG_STEREO_DEF = {
    text: `Un <b>stéréotype</b>, c'est une idée toute faite sur un groupe de personnes, par exemple « les filles aiment le rose » ou « les garçons sont forts ». On l'entend si souvent qu'on finit par croire que c'est vrai.`,
    other: `🚧 Les stéréotypes <b>enferment</b> : ils peuvent empêcher une fille ou un garçon de choisir le jeu, le sport ou le métier qu'il aime vraiment.`,
    know: `On parle aussi de « clichés ». Les publicités, les catalogues de jouets et les dessins animés en contiennent souvent : sauras-tu les repérer ?`
};

// 📊 Aujourd'hui : des chiffres (sur 10 personnes, ou en barres)
const EGFG_STATS = [
    { id: 'maires', ico: '🏛️', name: 'Les maires', kind: 'sur10', v: 2.3,
      q: 'À ton avis, sur 10 maires, combien sont des femmes ?',
      ans: 'Un peu plus de 2 maires sur 10 sont des femmes (environ 23 %).',
      text: `Les conseils municipaux comptent presque autant de femmes que d'hommes, grâce à la <b>parité</b> des listes. Mais pour le poste le plus important, celui de <b>maire</b>, les hommes restent beaucoup plus nombreux.`,
      know: `Le nombre de femmes maires augmente lentement : elles étaient un peu moins de 2 sur 10 en 2020.`,
      src: { t: "Oxfam France, « Index des femmes au pouvoir en France 2026 » (mai 2026)", u: 'https://www.oxfamfrance.org/app/uploads/2026/05/Oxfam_IndexFemmesAuPouvoirEnFrance2026_sous-embargo-6-mai26.pdf' } },
    { id: 'deputes', ico: '🏛️', name: "Les députés", kind: 'sur10', v: 3.6,
      q: 'À ton avis, sur 10 députés, combien sont des femmes ?',
      ans: 'Environ 4 députés sur 10 sont des femmes : 208 femmes sur 577 députés.',
      text: `Les <b>députés</b> votent les lois à l'Assemblée nationale. Pour que les lois soient faites pour tout le monde, il est important que les femmes et les hommes y soient représentés.`,
      know: `En 1945, pour les premières élections où les femmes pouvaient voter, 33 femmes seulement ont été élues députées.`,
      src: { t: "Résultats des élections législatives de juillet 2024 (208 femmes sur 577 députés), LCP", u: 'https://lcp.fr/index%2Ephp/actualites/assemblee-nationale-recul-de-la-parite-au-palais-bourbon-a-l-issue-des-legislatives' } },
    { id: 'ingenieurs', ico: '🧪', name: 'Élèves ingénieurs', kind: 'sur10', v: 3.0,
      q: "À ton avis, sur 10 élèves des écoles d'ingénieurs, combien sont des filles ?",
      ans: "Seulement 3 élèves ingénieurs sur 10 sont des filles.",
      text: `Les filles réussissent aussi bien que les garçons en sciences, mais elles choisissent moins souvent les études d'<b>ingénieur</b> ou d'<b>informatique</b>. Les stéréotypes (« ce n'est pas pour les filles ») y sont pour beaucoup.`,
      know: `Il y a 50 ans, à peine 1 élève ingénieur sur 20 était une fille.`,
      src: { t: "Ministère de l'Enseignement supérieur, données 2023, via l'Observatoire des inégalités", u: 'https://inegalites.fr/L-enseignement-superieur-se-feminise' } },
    { id: 'profs', ico: '🧑‍🏫', name: 'Professeurs des écoles', kind: 'sur10', v: 8.6,
      q: 'À ton avis, sur 10 professeurs des écoles, combien sont des femmes ?',
      ans: 'Plus de 8 professeurs des écoles sur 10 sont des femmes.',
      text: `Les stéréotypes jouent <b>dans les deux sens</b> : certains métiers où l'on s'occupe des autres (enseigner aux jeunes enfants, soigner, aider) attirent surtout des femmes. Les garçons peuvent aussi les choisir !`,
      know: `On dit qu'un métier est « mixte » quand il compte à peu près autant de femmes que d'hommes. C'est encore rare.`,
      src: { t: "Ministère de l'Éducation nationale, bilan du Pacte enseignant (juillet 2025), via l'agence AEF", u: 'https://media.ac-normandie.fr/-/communication/revue-presse/2025/07/09/AEF_nat_cri_National_Pacte%20enseignant,%20le%20minist%e8re%20pr%e9sente%20le%20bilan%20annuel%20aux%20syndicats,%20qui%20demandent%20un%20virage%20qualitatif.pdf' } },
    { id: 'salaire', ico: '💶', name: 'Les salaires', kind: 'bars', unit: '€',
      q: 'Pour 100 € gagnés par un homme, combien gagne une femme, en moyenne, pour le même temps de travail ?',
      bars: [{ l: '👨 Un homme', v: 100, t: '100 €', c: 'h' }, { l: '👩 Une femme', v: 86, t: '86 €', c: 'f' }], max: 100,
      ans: 'Environ 86 € : à temps de travail égal, les femmes gagnent en moyenne 14 % de moins.',
      text: `Pourquoi ? Les femmes travaillent plus souvent dans des métiers <b>moins bien payés</b>, elles accèdent moins aux postes les plus élevés, et leur carrière ralentit souvent à la naissance des enfants. Pour <b>le même poste chez le même employeur</b>, l'écart est d'environ 4 % : c'est interdit par la loi, c'est une <b>discrimination</b>.`,
      know: `Dans les années 1960, l'écart de salaire était bien plus grand qu'aujourd'hui : il diminue, mais lentement.`,
      src: { t: "Insee Focus, « Écart de salaire entre femmes et hommes en 2023 » (secteur privé)", u: 'https://www.insee.fr/fr/statistiques/8381248' } },
    { id: 'maison', ico: '🏠', name: 'Les tâches à la maison', kind: 'bars', unit: 'h',
      q: 'Chaque jour, combien de temps les femmes et les hommes passent-ils aux tâches de la maison (ménage, courses, cuisine, enfants) ?',
      bars: [{ l: '👩 Les femmes', v: 206, t: '3 h 26', c: 'f' }, { l: '👨 Les hommes', v: 120, t: '2 h', c: 'h' }], max: 240,
      ans: "Les femmes y passent en moyenne 3 h 26 par jour, contre 2 h pour les hommes.",
      text: `Le ménage, la cuisine, le linge, les courses, s'occuper des enfants : ces tâches sont encore surtout faites par les <b>femmes</b>. Les partager, c'est l'affaire de toute la famille, enfants compris !`,
      know: `Le temps passé aux tâches de la maison, c'est du temps en moins pour les loisirs, le sport ou le travail.`,
      src: { t: "Insee, enquête Emploi du temps 2009-2010 (la plus récente publiée), via l'Observatoire des inégalités", u: 'https://www.inegalites.fr/L-inegale-repartition-des-taches-domestiques-entre-les-femmes-et-les-hommes?id_mot=102' } }
];
const EGFG_CHIFFRES_INTRO = {
    text: `Les lois disent que les femmes et les hommes ont les mêmes droits. Mais dans la vie de tous les jours, il reste des <b>inégalités</b> : les chiffres permettent de les mesurer.`,
    know: `Le 8 mars, c'est la Journée internationale des droits des femmes : on y fait le point chaque année.`
};

// 🙋 Agir : situations à discuter (best = la meilleure réaction)
const EGFG_SITS = [
    { ico: '⚽', pic: '⚽👦👦👦 🙋‍♀️', title: 'Dans la cour', color: '#0891b2',
      story: `Inès veut jouer au football avec les garçons. Théo lui dit : « Non, c'est un jeu de garçons ! »`,
      choices: [
        { t: `Je ne dis rien, ce n'est pas mon problème.`, r: 'mid', fb: `Se taire, c'est laisser Inès seule face à une injustice. Tu peux l'aider, avec des mots calmes.` },
        { t: `Je dis à Théo que le foot est pour tout le monde, et je propose de faire les équipes ensemble.`, r: 'best', fb: `Bravo ! La cour et les jeux sont à tout le monde. Si le conflit continue, on peut en parler à un adulte ou au conseil d'élèves.` },
        { t: `Je dis à Inès d'aller jouer à un « jeu de filles ».`, r: 'bad', fb: `Il n'existe pas de « jeux de filles » ni de « jeux de garçons » : chacun choisit ce qu'il aime.` }
      ],
      rule: `À l'école, filles et garçons ont les mêmes droits, y compris dans la cour. Partager l'espace et le matériel fait partie du règlement de l'école.` },
    { ico: '🩰', pic: '🩰🧒 😂😂', title: 'La moquerie', color: '#db2777',
      story: `Hugo fait de la danse classique. Des élèves se moquent de lui : « La danse, c'est pour les filles ! »`,
      choices: [
        { t: `Je rigole avec les autres, c'est pour plaisanter.`, r: 'bad', fb: `Une moquerie répétée blesse, même « pour rire ». Elle peut devenir du harcèlement.` },
        { t: `Je dis aux autres d'arrêter, et je demande à Hugo de nous montrer ce qu'il sait faire.`, r: 'best', fb: `Très bien ! Tu défends Hugo et tu montres que la danse est un sport pour tout le monde.` },
        { t: `Je conseille à Hugo de faire plutôt du foot.`, r: 'mid', fb: `Ce n'est pas à Hugo de changer : il a le droit d'aimer la danse. Ce sont les moqueries qui doivent cesser.` }
      ],
      rule: `Se moquer de quelqu'un à cause de son sexe ou de ses goûts est interdit à l'école. Si cela se répète, il faut en parler à un adulte.` },
    { ico: '🪑', pic: '🪑🪑💪 🙋‍♀️', title: 'Ranger la classe', color: '#d97706',
      story: `L'enseignant demande « deux garçons costauds » pour porter les chaises. Lina lève la main : « Moi aussi, je peux ! »`,
      choices: [
        { t: `Lina a raison : on peut choisir les volontaires, filles ou garçons.`, r: 'best', fb: `Exactement ! Les tâches se répartissent entre tout le monde, sans tenir compte du sexe.` },
        { t: `Les garçons sont toujours plus forts, c'est normal.`, r: 'bad', fb: `C'est un stéréotype : certaines filles sont plus fortes que certains garçons. Et porter une chaise, tout le monde en est capable !` },
        { t: `Ce n'est pas grave, Lina peut essuyer les tables à la place.`, r: 'mid', fb: `Toutes les tâches sont utiles, mais pourquoi Lina ne pourrait-elle pas porter les chaises si elle le veut ?` }
      ],
      rule: `Les responsabilités de la classe (porter, ranger, distribuer, nettoyer) se partagent entre toutes et tous.` },
    { ico: '🗯️', pic: '🏃‍♀️💨 🗯️', title: "L'insulte", color: '#dc2626',
      story: `Pendant la course, Sami crie à Noah : « Tu cours comme une fille ! » et tout le monde rit.`,
      choices: [
        { t: `Je dis que ce n'est pas une insulte d'être une fille, et que certaines filles courent très vite !`, r: 'best', fb: `Bien vu ! Utiliser « fille » comme une insulte, c'est dire que les filles valent moins : c'est du sexisme.` },
        { t: `Je réponds à Sami par une autre insulte.`, r: 'bad', fb: `Répondre à une insulte par une insulte ne règle rien. On peut dire calmement que c'est blessant, puis prévenir un adulte.` },
        { t: `Je ris aussi, ce n'est qu'une expression.`, r: 'mid', fb: `Ces expressions semblent banales, mais elles rabaissent les filles et blessent les garçons visés.` }
      ],
      rule: `Les insultes et les moqueries sexistes sont interdites. Le respect de chacun fait partie des valeurs de l'école et de la République.` },
    { ico: '✈️', pic: '👧✈️ 🙄', title: 'Plus tard, je serai…', color: '#4f46e5',
      story: `Zoé dit qu'elle veut devenir pilote d'avion. Un camarade répond : « C'est un métier d'homme ! »`,
      choices: [
        { t: `Il a raison, il y a surtout des hommes pilotes.`, r: 'mid', fb: `C'est vrai qu'il y a encore plus d'hommes pilotes aujourd'hui, mais ce n'est pas une règle : Zoé peut tout à fait le devenir.` },
        { t: `Tous les métiers sont ouverts aux filles et aux garçons : Zoé peut devenir pilote si elle le souhaite.`, r: 'best', fb: `Oui ! La loi interdit de refuser un métier à quelqu'un parce que c'est une femme ou un homme.` },
        { t: `Zoé devrait plutôt devenir hôtesse de l'air.`, r: 'bad', fb: `Chacun choisit son métier selon ses goûts et ses talents, pas selon qu'il est une fille ou un garçon.` }
      ],
      rule: `Les métiers n'ont pas de sexe. Depuis 1983, la loi interdit de refuser un emploi à cause du sexe d'une personne.` },
    { ico: '🍽️', pic: '🍽️🧽 👩‍🦱 🛋️👨👦', title: 'À la maison', color: '#059669',
      story: `Après le repas, seules Maman et la grande sœur débarrassent et font la vaisselle. Les autres vont regarder la télé.`,
      choices: [
        { t: `C'est normal, ce sont des tâches de filles.`, r: 'bad', fb: `Il n'y a pas de « tâches de filles » : manger ensemble, puis ranger ensemble, c'est l'affaire de toute la famille.` },
        { t: `Je propose qu'on se répartisse les tâches à tour de rôle, et j'aide tout de suite.`, r: 'best', fb: `Parfait ! Partager les tâches, c'est plus juste, et tout le monde a plus de temps libre.` },
        { t: `J'aiderai seulement si on me le demande.`, r: 'mid', fb: `C'est un bon début, mais on peut prendre l'initiative : la maison appartient à tout le monde.` }
      ],
      rule: `À la maison aussi, l'égalité se vit au quotidien : les tâches se partagent entre toutes et tous, enfants compris.` }
];
const EGFG_AGIR_INTRO = {
    text: `L'égalité, ça se vit tous les jours : dans la cour, en classe, à la maison. Lis chaque situation, choisis la réaction qui te semble <b>la plus juste</b>, puis discutez-en ensemble.`,
    know: `Si tu es témoin ou victime d'une moquerie ou d'une insulte qui se répète, parles-en à un adulte de l'école ou à ta famille.`
};

// 📚 Liste complète des sources (bouton « 📚 Sources »)
const EGFG_SOURCES_EXTRA = [
    { t: "Observatoire des inégalités, « Les inégalités de salaires femmes-hommes se réduisent lentement » (écart dans les années 1960)", u: 'https://www.inegalites.fr/Les-inegalites-de-salaires-femmes-hommes-se-reduisent-lentement' },
    { t: "Assemblée nationale : 33 femmes élues députées le 21 octobre 1945", u: 'https://www2.assemblee-nationale.fr/decouvrir-l-assemblee/histoire/le-suffrage-universel/la-conquete-de-la-citoyennete-politique-des-femmes/les-33-femmes-elues-deputees-en-1945' }
];

// ── Petites fonctions utiles ──────────────────────────────────────────────
function _egfgSrc(src, label) {
    if (!src) return '';
    const t = _egfgEsc(src.t);
    return `<p class="egfg-src">📚 ${label === false ? '' : 'Source : '}${src.u ? `<a href="${_egfgEsc(src.u)}" target="_blank" rel="noopener noreferrer">${t}</a>` : t}</p>`;
}
function _egfgEsc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
let _egfgUid = 0;

// ── Création du widget ────────────────────────────────────────────────────
function createEgaliteFGWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };
    const uid = ++_egfgUid;

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'egalite-fg';
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
    container.className = 'egfg-container';
    container.dataset.mode = 'droits';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(760, Math.min(1180, Math.round(window.innerWidth * 0.68)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(560, Math.round(contW * 0.66));

    const header = document.createElement('div');
    header.className = 'egfg-header';
    header.innerHTML = `
        <span class="egfg-title">⚖️<span> L'égalité filles-garçons</span></span>
        <div class="egfg-tabs">
            <button class="egfg-tab on" data-mode="droits" title="Les droits, une conquête"><span class="egfg-tab-long">⚖️ Droits</span><span class="egfg-tab-short">⚖️ Droits</span></button>
            <button class="egfg-tab" data-mode="stereo" title="Les stéréotypes"><span class="egfg-tab-long">💭 Stéréotypes</span><span class="egfg-tab-short">💭 Clichés</span></button>
            <button class="egfg-tab" data-mode="chiffres" title="Les inégalités aujourd'hui"><span class="egfg-tab-long">📊 Aujourd'hui</span><span class="egfg-tab-short">📊 Chiffres</span></button>
            <button class="egfg-tab" data-mode="agir" title="Agir pour l'égalité"><span class="egfg-tab-long">🙋 Agir</span><span class="egfg-tab-short">🙋 Agir</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'egfg-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres leçons)
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.egfg-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // Ligne 1 : commandes de l'onglet
    const row1 = document.createElement('div');
    row1.className = 'egfg-row';
    row1.innerHTML = `
        <button class="egfg-btn egfg-btn-play egfg-only-droits" title="Faire défiler les dates une à une">▶ Lecture</button>
        <button class="egfg-btn egfg-prev egfg-only-droits" title="Date précédente">◀ Date</button>
        <button class="egfg-btn egfg-next egfg-only-droits" title="Date suivante">Date ▶</button>
        <button class="egfg-btn egfg-all egfg-only-droits" title="Voir toutes les dates">🔄 Vue d'ensemble</button>
        ${EGFG_GROUP_ORDER.map(k => `<button class="egfg-btn egfg-group egfg-only-stereo" data-group="${k}" title="${EGFG_GROUPS[k].name}">${EGFG_GROUPS[k].ico} ${EGFG_GROUPS[k].name}</button>`).join('')}
        <span class="egfg-sep egfg-only-stereo"></span>
        <button class="egfg-btn egfg-reveal-all egfg-only-stereo" title="Retourner toutes les cartes">👁 Tout révéler</button>
        <button class="egfg-btn egfg-reset-stereo egfg-only-stereo" title="Effacer les réponses de cette série">🔄 Recommencer</button>
        ${EGFG_STATS.map((st, i) => `<button class="egfg-btn egfg-stat egfg-only-chiffres" data-stat="${i}" title="${_egfgEsc(st.name)}">${st.ico} ${st.name}</button>`).join('')}
        <button class="egfg-btn egfg-prev-sit egfg-only-agir" title="Situation précédente">◀ Situation</button>
        <button class="egfg-btn egfg-next-sit egfg-only-agir" title="Situation suivante">Situation ▶</button>
        <button class="egfg-btn egfg-reset-agir egfg-only-agir" title="Effacer toutes les réponses">🔄 Recommencer</button>
        <span class="egfg-sep"></span>
        <button class="egfg-btn egfg-sources" title="D'où viennent les chiffres, les dates et les anecdotes de la leçon">📚 Sources</button>
    `;
    container.appendChild(row1);

    // Ligne 2 : dates / score / estimation / situations
    const row2 = document.createElement('div');
    row2.className = 'egfg-row';
    row2.innerHTML = `
        <span class="egfg-lbl egfg-only-droits">Dates :</span>
        ${EGFG_STEPS.map((s, i) => `<button class="egfg-btn egfg-stage-btn egfg-only-droits" data-stage="${i}" style="--st-c:${s.color}" title="${_egfgEsc(s.title)}">${s.year} ${s.ico} ${s.name}</button>`).join('')}
        <span class="egfg-lbl egfg-only-stereo">👉 Votez pour chaque carte, puis lisez l'explication dans la fiche.</span>
        <span class="egfg-val egfg-only-stereo egfg-stereo-val"></span>
        <div class="egfg-slider-box egfg-only-chiffres egfg-guess-box">
            <span class="egfg-lbl">🤔 Ton estimation :</span>
            <input type="range" class="egfg-slider egfg-guess" min="0" max="10" step="1" value="5" aria-label="Estimation sur 10">
            <span class="egfg-val egfg-guess-val"></span>
        </div>
        <button class="egfg-btn egfg-btn-go egfg-reveal egfg-only-chiffres" title="Afficher la réponse">👁 Révéler</button>
        <button class="egfg-btn egfg-hide egfg-only-chiffres" title="Cacher la réponse pour refaire deviner">🙈 Cacher</button>
        <span class="egfg-lbl egfg-only-agir">Situations :</span>
        ${EGFG_SITS.map((s, i) => `<button class="egfg-btn egfg-stage-btn egfg-sit-btn egfg-only-agir" data-sit="${i}" style="--st-c:${s.color}" title="${_egfgEsc(s.title)}">${i + 1}. ${s.ico} ${s.title}</button>`).join('')}
        <span class="egfg-val egfg-only-agir egfg-agir-val"></span>
    `;
    container.appendChild(row2);

    // Corps
    const body = document.createElement('div');
    body.className = 'egfg-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'egfg-scene-wrap';
    const scene = document.createElement('div');
    scene.className = 'egfg-scene';
    const hint = document.createElement('div');
    hint.className = 'egfg-hint';
    sceneWrap.appendChild(scene);
    sceneWrap.appendChild(hint);
    const side = document.createElement('div');
    side.className = 'egfg-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'egfg-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 L'égalité filles-garçons</h4>
        <p><b>⚖️ Les droits</b> : une frise en 8 dates montre comment l'égalité a été gagnée, de 1791 à 2000.
        <b>▶ Lecture</b> fait défiler les dates ; <b>◀ Date ▶</b>, les boutons de dates ou les pastilles de la frise vont directement à une date.
        <b>🔄 Vue d'ensemble</b> montre toutes les dates d'un coup.</p>
        <p><b>💭 Les stéréotypes</b> : pour chaque carte, la classe vote (👧 Filles, 👦 Garçons ou 🤝 Tout le monde ;
        ou ✔ Vrai / 💭 Stéréotype). La carte se retourne et la fiche de droite explique, avec un « Le savais-tu ? ».
        Quatre séries : jouets, métiers, sports et loisirs, phrases toutes faites.</p>
        <p><b>📊 Aujourd'hui</b> : choisissez un chiffre, faites <b>estimer</b> la classe avec le curseur, puis <b>👁 Révéler</b>.
        Les femmes sont en <b style="color:#7c3aed">violet</b> et les hommes en <b style="color:#d97706">orange</b> : ni rose ni bleu, exprès !</p>
        <p><b>🙋 Agir</b> : six situations de la cour, de la classe et de la maison. Choisissez une réaction, puis discutez :
        la meilleure est en vert, et la fiche rappelle ce que dit la règle.</p>
        <p><b>📚 Sources</b> : chaque fiche indique d'où vient l'information. Le bouton <b>📚 Sources</b> affiche la liste complète,
        avec des liens vers les documents officiels (Insee, Assemblée nationale, ministères, Service-Public.fr…).</p>
        <p style="color:#888">Chiffres arrondis pour les élèves. Les situations et les prénoms sont imaginaires.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'egfg-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const $ = sel => container.querySelector(sel);
    const playBtn = $('.egfg-btn-play');
    const guessSl = $('.egfg-guess'), guessVal = $('.egfg-guess-val'), guessBox = $('.egfg-guess-box');
    const stereoVal = $('.egfg-stereo-val'), agirVal = $('.egfg-agir-val');
    const srcBtn = $('.egfg-sources');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'droits';
    let step = 0, ov = true;            // frise : date choisie / vue d'ensemble
    let playing = false, playTimer = null;
    let group = 'jouets';               // série de cartes
    let answers = {};                   // 'jouets:2' → 'f' | 'g' | 't' | 'vrai' | 'stereo'
    let selCard = null;                 // 'jouets:2'
    let stat = 0;                       // chiffre choisi
    let guesses = {};                   // id → estimation (0 … 10)
    let revealed = {};                  // id → true
    let sit = 0;                        // situation
    let sitAns = {};                    // n° de situation → n° de réponse
    let showSources = false;            // fiche : liste complète des sources

    function save() { if (typeof saveBoard === 'function') saveBoard(); }
    const cardKey = (g, i) => g + ':' + i;

    // ── Rendu : ⚖️ Les droits ─────────────────────────────────────────────
    function friseHTML() {
        const n = EGFG_STEPS.length;
        const fill = ov ? 0 : (step / (n - 1)) * 100;
        return `<div class="egfg-frise">
            <div class="egfg-frise-fill" style="width:calc((100% - 2em) * ${fill / 100})"></div>
            ${EGFG_STEPS.map((s, i) => `<button class="egfg-dot${!ov && i === step ? ' on' : ''}${!ov && i < step ? ' past' : ''}" data-stage="${i}" style="--st-c:${s.color}" title="${s.year} : ${_egfgEsc(s.title)}">
                <span class="egfg-dot-c">${s.ico}</span><span class="egfg-dot-y">${s.year}</span></button>`).join('')}
        </div>`;
    }
    function renderDroits() {
        let h = friseHTML();
        if (ov) {
            h += `<p class="egfg-intro">L'égalité, une longue conquête : touche une date !</p>
                <div class="egfg-mosaic">${EGFG_STEPS.map((s, i) => `<button class="egfg-mini" data-stage="${i}" style="--st-c:${s.color}">
                    <div class="egfg-mini-y">${s.ico} ${s.year}</div><div class="egfg-mini-t">${s.title}</div></button>`).join('')}</div>`;
        } else {
            const s = EGFG_STEPS[step];
            h += `<div class="egfg-big" style="--st-c:${s.color}">
                <div class="egfg-big-ico">${s.ico}</div>
                <div><div class="egfg-big-y">${s.year}</div>
                    <div class="egfg-big-t">${s.title}</div>
                    <div class="egfg-big-c">${s.change}</div></div>
            </div>`;
            if (s.quote) h += `<p class="egfg-quote" style="--st-c:${s.color}">${s.quote}</p>`;
        }
        scene.innerHTML = h;
    }

    // ── Rendu : 💭 Les stéréotypes ────────────────────────────────────────
    const QUI_LABELS = { f: '👧 Filles', g: '👦 Garçons', t: '🤝 Tout le monde' };
    function cardResult(g, i) {
        const a = answers[cardKey(g, i)];
        if (a === undefined) return null;
        const c = EGFG_CARDS[g][i];
        if (EGFG_GROUPS[g].kind === 'vf') {
            const ok = a === c.answer;
            const lab = c.answer === 'vrai' ? '✔ Vrai' : '💭 Stéréotype';
            return { ok, html: (ok ? '✅ Bien vu : ' : '💡 Réponse : ') + lab };
        }
        if (a === 'reveal') return { ok: true, html: '🤝 Pour tout le monde !' };
        return a === 't' ? { ok: true, html: '✅ Oui : pour tout le monde !' }
                         : { ok: false, html: '💡 C\'est un stéréotype : c\'est pour tout le monde !' };
    }
    function stereoScore() {
        const cards = EGFG_CARDS[group];
        let done = 0, ok = 0;
        cards.forEach((c, i) => {
            const a = answers[cardKey(group, i)];
            if (a === undefined || a === 'reveal') return;
            done++;
            if (EGFG_GROUPS[group].kind === 'vf' ? a === c.answer : a === 't') ok++;
        });
        return { done, ok, n: cards.length };
    }
    function renderStereo() {
        const G = EGFG_GROUPS[group], cards = EGFG_CARDS[group];
        const sc = stereoScore();
        let h = `<div style="text-align:center"><span class="egfg-score">${G.ico} ${G.name} · ${G.kind === 'vf'
            ? `bonnes réponses : ${sc.ok} / ${sc.done}` : `« pour tout le monde » : ${sc.ok} / ${sc.done}`}</span></div>`;
        h += `<div class="egfg-cards">${cards.map((c, i) => {
            const k = cardKey(group, i), r = cardResult(group, i);
            const votes = G.kind === 'vf'
                ? `<button class="egfg-vote" data-vote="vrai">✔ Vrai</button><button class="egfg-vote" data-vote="stereo">💭 Stéréotype</button>`
                : `<button class="egfg-vote" data-vote="f">👧 Filles</button><button class="egfg-vote" data-vote="g">👦 Garçons</button><button class="egfg-vote" data-vote="t">🤝 Tout le monde</button>`;
            return `<div class="egfg-card${selCard === k ? ' sel' : ''}" data-card="${i}">
                <div class="egfg-card-ico">${c.ico}</div>
                <div class="egfg-card-n">${c.name}</div>
                ${r ? `<div class="egfg-res ${r.ok ? 'ok' : 'ko'}">${r.html}</div>`
                    : `<div class="egfg-card-q">${G.kind === 'vf' ? 'Vrai ou stéréotype ?' : "C'est pour qui ?"}</div><div class="egfg-votes">${votes}</div>`}
            </div>`;
        }).join('')}</div>`;
        scene.innerHTML = h;
        stereoVal.textContent = `✅ ${sc.ok} / ${sc.n}`;
    }

    // ── Rendu : 📊 Aujourd'hui ────────────────────────────────────────────
    function personSVG(i, frac) {
        // Silhouette neutre : seule la couleur (et la légende) distingue femmes et hommes
        const id = `egfg-clip-${uid}-${i}`;
        const shape = `<circle cx="20" cy="12" r="9"/><path d="M6 60V34a14 14 0 0 1 28 0v26z"/>`;
        if (frac === null) return `<svg viewBox="0 0 40 62" aria-hidden="true"><g fill="#cbd5e1">${shape}</g></svg>`;
        return `<svg viewBox="0 0 40 62" aria-hidden="true">
            <defs><clipPath id="${id}"><rect x="0" y="0" width="${40 * frac}" height="62"/></clipPath></defs>
            <g fill="var(--egfg-h)">${shape}</g>
            <g fill="var(--egfg-f)" clip-path="url(#${id})">${shape}</g></svg>`;
    }
    function renderChiffres() {
        const st = EGFG_STATS[stat], rev = !!revealed[st.id];
        let h = `<p class="egfg-q">${st.ico} ${st.q}</p>`;
        if (st.kind === 'sur10') {
            const g = guesses[st.id];
            h += `<div class="egfg-people">${Array.from({ length: 10 }, (_, i) => {
                const frac = rev ? Math.max(0, Math.min(1, st.v - i)) : null;
                const guess = !rev && g !== undefined && i < g;
                return `<div class="egfg-person${guess ? ' guess' : ''}">${personSVG(i, frac)}</div>`;
            }).join('')}</div>`;
            if (rev) h += `<div class="egfg-legend"><span><i style="background:var(--egfg-f)"></i>Femmes</span><span><i style="background:var(--egfg-h)"></i>Hommes</span></div>`;
            if (g !== undefined) h += `<p class="egfg-guess-txt">🤔 Estimation de la classe : <b>${g} sur 10</b>${rev ? ` · Réponse : environ <b>${Math.round(st.v)} sur 10</b>` : ''}</p>`;
            else if (!rev) h += `<p class="egfg-guess-txt">Déplace le curseur 🤔 pour faire une estimation, puis appuie sur 👁 Révéler.</p>`;
        } else {
            h += `<div class="egfg-bars">${st.bars.map(b => `<div class="egfg-bar-row">
                <div class="egfg-bar-l">${b.l}</div>
                <div class="egfg-bar-t"><div class="egfg-bar-f" style="width:${rev ? (b.v / st.max) * 100 : 0}%;background:var(--egfg-${b.c})">${rev ? b.t : ''}</div></div>
            </div>`).join('')}</div>`;
            if (!rev) h += `<p class="egfg-hidden-v">❓ Discutez-en ensemble, puis appuie sur 👁 Révéler.</p>`;
        }
        if (rev) h += `<div class="egfg-answer">${st.ans}</div>`;
        scene.innerHTML = h;
        // Barres : on part de 0 puis on anime jusqu'à la valeur
        if (rev && st.kind === 'bars') {
            const fills = scene.querySelectorAll('.egfg-bar-f');
            fills.forEach(f => { const w = f.style.width; f.style.width = '0%'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = w; })); });
        }
        guessBox.style.display = st.kind === 'sur10' ? '' : 'none';
        const g = guesses[st.id];
        guessSl.value = g === undefined ? 5 : g;
        guessVal.textContent = g === undefined ? '—' : `${g} sur 10`;
        $('.egfg-reveal').disabled = rev;
        $('.egfg-hide').disabled = !rev;
    }

    // ── Rendu : 🙋 Agir ───────────────────────────────────────────────────
    function agirScore() {
        let done = 0, best = 0;
        EGFG_SITS.forEach((s, i) => {
            if (sitAns[i] === undefined) return;
            done++;
            if (s.choices[sitAns[i]].r === 'best') best++;
        });
        return { done, best };
    }
    function renderAgir() {
        const s = EGFG_SITS[sit], a = sitAns[sit];
        const L = ['A', 'B', 'C'];
        let h = `<div class="egfg-sit" style="--st-c:${s.color}">
            <div class="egfg-sit-pic">${s.pic}</div>
            <div class="egfg-sit-t">Situation ${sit + 1} : ${s.title}</div>
            <div class="egfg-bubble">${s.story}<br><b>Que fais-tu ?</b></div>
            <div class="egfg-choices">${s.choices.map((c, i) => {
                let cls = '';
                if (a !== undefined) cls = c.r === 'best' ? ' best' : (i === a ? ' ' + c.r : ' dim');
                return `<button class="egfg-choice${cls}" data-choice="${i}" ${a !== undefined ? 'disabled' : ''}><b>${L[i]}</b><span>${c.t}</span></button>`;
            }).join('')}</div>`;
        if (a !== undefined) {
            const c = s.choices[a];
            h += `<div class="egfg-fb ${c.r}">${c.r === 'best' ? '🌟 ' : c.r === 'mid' ? '🤔 ' : '✋ '}${c.fb}</div>`;
        }
        h += `</div>`;
        scene.innerHTML = h;
        const sc = agirScore();
        agirVal.textContent = `🌟 ${sc.best} / ${EGFG_SITS.length}`;
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    function stepsList() {
        return `<ol class="egfg-steps">${EGFG_STEPS.map((s, i) =>
            `<li><button data-stage="${i}" class="${!ov && step === i ? 'on' : ''}" style="--st-c:${s.color}">${s.year} ${s.ico} ${s.title}</button></li>`).join('')}
            <li><button data-stage="-1" class="${ov ? 'on' : ''}" style="--st-c:#2A1F4A">🔄 Vue d'ensemble</button></li></ol>`;
    }
    function sitsList() {
        return `<ol class="egfg-steps">${EGFG_SITS.map((s, i) => {
            const a = sitAns[i];
            const mark = a === undefined ? '' : s.choices[a].r === 'best' ? ' 🌟' : ' ✔';
            return `<li><button data-sit="${i}" class="${sit === i ? 'on' : ''}" style="--st-c:${s.color}">${i + 1}. ${s.ico} ${s.title}${mark}</button></li>`;
        }).join('')}</ol>`;
    }
    function sourcesPanel() {
        const li = src => `<li>${_egfgSrc(src, false).replace(/^<p class="egfg-src">📚 /, '').replace(/<\/p>$/, '')}</li>`;
        const cardSrcs = [];
        EGFG_GROUP_ORDER.forEach(g => EGFG_CARDS[g].forEach(c => { if (c.src) cardSrcs.push(Object.assign({}, c.src, { t: c.name + ' — ' + c.src.t })); }));
        return `<h4>📚 Les sources de la leçon</h4>
            <p class="egfg-text">Tous les chiffres et toutes les dates viennent de documents officiels ou d'études publiques. Touchez un lien pour ouvrir le document.</p>
            <div class="egfg-srcs">
            <h5>📊 Les chiffres (onglet Aujourd'hui)</h5><ul>${EGFG_STATS.map(st => li(Object.assign({}, st.src, { t: st.name + ' — ' + st.src.t }))).join('')}${EGFG_SOURCES_EXTRA.map(li).join('')}</ul>
            <h5>⚖️ Les dates et les lois (onglet Les droits)</h5><ul>${EGFG_STEPS.map(s => li(Object.assign({}, s.src, { t: s.year + ' — ' + s.src.t }))).join('')}</ul>
            <h5>💭 Les « Le savais-tu ? » (onglet Les stéréotypes)</h5><ul>${cardSrcs.map(li).join('')}</ul>
            </div>
            <p class="egfg-src">Les situations de l'onglet 🙋 Agir et les prénoms sont imaginaires. Les chiffres sont arrondis pour les élèves. Sources vérifiées en novembre 2026.</p>
            <p><button class="egfg-btn egfg-src-close">✖ Fermer les sources</button></p>`;
    }
    function renderSide() {
        srcBtn.classList.toggle('on', showSources);
        if (showSources) { side.style.borderLeftColor = '#2A1F4A'; side.innerHTML = sourcesPanel(); return; }
        if (mode === 'droits') {
            if (ov) {
                side.style.borderLeftColor = '#7c3aed';
                side.innerHTML = `<h4>Les droits, une conquête</h4>
                    <div class="egfg-status">⚖️ <span style="color:#5b21b6">Des droits gagnés pas à pas</span></div>
                    <p class="egfg-text">${EGFG_OVERVIEW.text}</p>
                    <p class="egfg-change">${EGFG_OVERVIEW.other}</p>
                    <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${EGFG_OVERVIEW.know}</p>
                    ${stepsList()}`;
            } else {
                const s = EGFG_STEPS[step];
                side.style.borderLeftColor = s.color;
                side.innerHTML = `<h4>${s.year} · date ${step + 1} sur ${EGFG_STEPS.length}</h4>
                    <div class="egfg-status">${s.ico} <span style="color:${s.color}">${s.title}</span></div>
                    <p class="egfg-change">🔎 ${s.change}</p>
                    <p class="egfg-text">${s.text}</p>
                    <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${s.know}</p>
                    ${_egfgSrc(s.src)}
                    ${stepsList()}`;
            }
        } else if (mode === 'stereo') {
            const sel = selCard && selCard.split(':');
            const c = sel && EGFG_CARDS[sel[0]] && EGFG_CARDS[sel[0]][+sel[1]];
            if (c && sel[0] === group && answers[selCard] !== undefined) {
                const vf = EGFG_GROUPS[group].kind === 'vf';
                side.style.borderLeftColor = vf && c.answer === 'vrai' ? '#16a34a' : '#7c3aed';
                side.innerHTML = `<h4>${EGFG_GROUPS[group].ico} ${EGFG_GROUPS[group].name}</h4>
                    <div class="egfg-status">${c.ico} <span style="color:#5b21b6">${c.name}</span></div>
                    <p class="egfg-change">${vf ? (c.answer === 'vrai' ? '✔ <b>C\'est vrai.</b>' : '💭 <b>C\'est un stéréotype.</b>') : '🤝 <b>C\'est pour tout le monde !</b>'}</p>
                    <p class="egfg-text">${c.text}</p>
                    <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${c.know}</p>
                    ${_egfgSrc(c.src)}`;
            } else {
                side.style.borderLeftColor = '#7c3aed';
                side.innerHTML = `<h4>Les stéréotypes</h4>
                    <div class="egfg-status">💭 <span style="color:#5b21b6">C'est quoi, un stéréotype ?</span></div>
                    <p class="egfg-text">${EGFG_STEREO_DEF.text}</p>
                    <p class="egfg-change">${EGFG_STEREO_DEF.other}</p>
                    <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${EGFG_STEREO_DEF.know}</p>
                    <p class="egfg-text">👉 ${EGFG_GROUPS[group].kind === 'vf' ? 'Pour chaque phrase : vrai, ou stéréotype ?' : 'Pour chaque carte : c\'est pour les filles, pour les garçons, ou pour tout le monde ?'} Après le vote, touche une carte pour lire l'explication.</p>`;
            }
        } else if (mode === 'chiffres') {
            const st = EGFG_STATS[stat];
            side.style.borderLeftColor = '#7c3aed';
            side.innerHTML = `<h4>Aujourd'hui</h4>
                <div class="egfg-status">${st.ico} <span style="color:#5b21b6">${st.name}</span></div>
                ${revealed[st.id]
                    ? `<p class="egfg-change">📌 ${st.ans}</p><p class="egfg-text">${st.text}</p>
                       <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${st.know}</p>${_egfgSrc(st.src)}`
                    : `<p class="egfg-text">${EGFG_CHIFFRES_INTRO.text}</p>
                       <p class="egfg-change">🤔 Faites d'abord une <b>estimation</b> tous ensemble, puis révélez la réponse.</p>
                       <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${EGFG_CHIFFRES_INTRO.know}</p>`}`;
        } else {
            const s = EGFG_SITS[sit], a = sitAns[sit];
            const sc = agirScore();
            side.style.borderLeftColor = s.color;
            side.innerHTML = `<h4>Agir pour l'égalité</h4>
                <div class="egfg-status">${s.ico} <span style="color:${s.color}">${s.title}</span></div>
                ${a !== undefined ? `<p class="egfg-change">📏 <b>Ce que dit la règle :</b> ${s.rule}</p>` : `<p class="egfg-text">${EGFG_AGIR_INTRO.text}</p>`}
                <p class="egfg-know">💡 <b>Le savais-tu ?</b> ${EGFG_AGIR_INTRO.know}</p>
                <p class="egfg-text">🌟 Meilleures réactions : <b>${sc.best}</b> sur ${sc.done} situation${sc.done > 1 ? 's' : ''} discutée${sc.done > 1 ? 's' : ''}.</p>
                ${sitsList()}`;
        }
    }

    // ── Rendu général ─────────────────────────────────────────────────────
    function renderControls() {
        header.querySelectorAll('.egfg-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        row2.querySelectorAll('[data-stage]').forEach(b => b.classList.toggle('on', !ov && Number(b.dataset.stage) === step));
        row1.querySelectorAll('.egfg-group').forEach(b => b.classList.toggle('on', b.dataset.group === group));
        row1.querySelectorAll('.egfg-stat').forEach(b => b.classList.toggle('on', Number(b.dataset.stat) === stat));
        row2.querySelectorAll('.egfg-sit-btn').forEach(b => b.classList.toggle('on', Number(b.dataset.sit) === sit));
        playBtn.classList.toggle('on', playing);
        playBtn.textContent = playing ? '⏸ Pause' : '▶ Lecture';
        hint.textContent = mode === 'droits'
            ? 'Touche une date de la frise · ▶ Lecture fait défiler les dates'
            : mode === 'stereo'
                ? 'Votez pour chaque carte, puis touchez-la pour lire l\'explication'
                : mode === 'chiffres'
                    ? 'Estimez avec le curseur 🤔, puis 👁 Révéler'
                    : 'Choisissez une réaction, puis discutez-en ensemble';
    }
    function renderAll() {
        showSources = false;
        container.dataset.mode = mode;
        renderControls();
        if (mode === 'droits') renderDroits();
        else if (mode === 'stereo') renderStereo();
        else if (mode === 'chiffres') renderChiffres();
        else renderAgir();
        renderSide();
        fitFont();
    }
    // Texte de la scène proportionnel à sa taille (lisible au fond de la classe en plein écran)
    function fitFont() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (!W || !H) return;
        scene.style.fontSize = Math.max(12, Math.min(26, Math.min(W / 40, H / 24))) + 'px';
    }

    // ── Actions ───────────────────────────────────────────────────────────
    function setMode(m) {
        mode = ['droits', 'stereo', 'chiffres', 'agir'].includes(m) ? m : 'droits';
        if (playing) setPlaying(false);
        scene.scrollTop = 0;
        renderAll();
    }
    function jumpStep(i) {
        if (i < 0) { ov = true; }
        else { ov = false; step = Math.max(0, Math.min(EGFG_STEPS.length - 1, i)); }
        renderAll();
        save();
    }
    function setPlaying(v) {
        playing = !!v;
        clearInterval(playTimer); playTimer = null;
        if (playing) {
            if (ov) { ov = false; step = 0; }
            playTimer = setInterval(() => {
                if (!document.body.contains(widget)) { clearInterval(playTimer); return; }
                if (step >= EGFG_STEPS.length - 1) { setPlaying(false); return; }
                step++;
                renderAll();
            }, 9000);
        } else save();
        renderAll();
    }
    function vote(i, v) {
        const k = cardKey(group, i);
        if (answers[k] !== undefined) return;
        answers[k] = v;
        selCard = k;
        renderAll();
        save();
    }

    // ── Clics ─────────────────────────────────────────────────────────────
    [row1, row2, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); }, { passive: true });
    });
    const stop = e => e.stopPropagation();
    [scene, side].forEach(el => {
        el.addEventListener('pointerdown', stop);
        el.addEventListener('mousedown', stop);
        el.addEventListener('touchstart', stop, { passive: true });
    });

    header.querySelectorAll('.egfg-tab').forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        setMode(b.dataset.mode);
        save();
    }));
    playBtn.addEventListener('click', () => setPlaying(!playing));
    srcBtn.addEventListener('click', () => { showSources = !showSources; side.scrollTop = 0; renderSide(); });
    $('.egfg-prev').addEventListener('click', () => jumpStep(ov ? 0 : (step <= 0 ? EGFG_STEPS.length - 1 : step - 1)));
    $('.egfg-next').addEventListener('click', () => jumpStep(ov ? 0 : (step >= EGFG_STEPS.length - 1 ? 0 : step + 1)));
    $('.egfg-all').addEventListener('click', () => { if (playing) setPlaying(false); jumpStep(-1); });
    row2.querySelectorAll('.egfg-stage-btn[data-stage]').forEach(b => b.addEventListener('click', () => {
        const i = Number(b.dataset.stage);
        jumpStep(!ov && step === i ? -1 : i);
    }));
    row1.querySelectorAll('.egfg-group').forEach(b => b.addEventListener('click', () => {
        group = b.dataset.group; selCard = null; scene.scrollTop = 0; renderAll(); save();
    }));
    $('.egfg-reveal-all').addEventListener('click', () => {
        EGFG_CARDS[group].forEach((c, i) => {
            const k = cardKey(group, i);
            if (answers[k] === undefined) answers[k] = 'reveal';   // révélée sans vote : pas comptée dans le score
        });
        renderAll(); save();
    });
    $('.egfg-reset-stereo').addEventListener('click', () => {
        EGFG_CARDS[group].forEach((c, i) => { delete answers[cardKey(group, i)]; });
        selCard = null; renderAll(); save();
    });
    row1.querySelectorAll('.egfg-stat').forEach(b => b.addEventListener('click', () => {
        stat = Number(b.dataset.stat); renderAll(); save();
    }));
    guessSl.addEventListener('input', () => {
        const st = EGFG_STATS[stat];
        guesses[st.id] = Number(guessSl.value);
        renderAll();
    });
    guessSl.addEventListener('change', save);
    $('.egfg-reveal').addEventListener('click', () => { revealed[EGFG_STATS[stat].id] = true; renderAll(); save(); });
    $('.egfg-hide').addEventListener('click', () => { delete revealed[EGFG_STATS[stat].id]; renderAll(); save(); });
    $('.egfg-prev-sit').addEventListener('click', () => { sit = sit <= 0 ? EGFG_SITS.length - 1 : sit - 1; renderAll(); save(); });
    $('.egfg-next-sit').addEventListener('click', () => { sit = sit >= EGFG_SITS.length - 1 ? 0 : sit + 1; renderAll(); save(); });
    $('.egfg-reset-agir').addEventListener('click', () => { sitAns = {}; sit = 0; renderAll(); save(); });
    row2.querySelectorAll('.egfg-sit-btn').forEach(b => b.addEventListener('click', () => { sit = Number(b.dataset.sit); renderAll(); save(); }));

    // Scène : frise, cartes, votes, réponses
    scene.addEventListener('click', e => {
        e.stopPropagation();
        helpPopup.classList.remove('show');
        const st = e.target.closest('[data-stage]');
        if (st) { if (playing) setPlaying(false); jumpStep(Number(st.dataset.stage)); return; }
        const vb = e.target.closest('[data-vote]');
        if (vb) { vote(Number(vb.closest('[data-card]').dataset.card), vb.dataset.vote); return; }
        const cd = e.target.closest('[data-card]');
        if (cd) {
            const k = cardKey(group, Number(cd.dataset.card));
            if (answers[k] !== undefined) { selCard = selCard === k ? null : k; renderAll(); }
            return;
        }
        const ch = e.target.closest('[data-choice]');
        if (ch && sitAns[sit] === undefined) { sitAns[sit] = Number(ch.dataset.choice); renderAll(); save(); }
    });
    side.addEventListener('click', e => {
        if (e.target.closest('a')) { e.stopPropagation(); return; }   // lien vers une source : on laisse s'ouvrir
        if (e.target.closest('.egfg-src-close')) { e.stopPropagation(); showSources = false; renderSide(); return; }
        const b = e.target.closest('button[data-stage],button[data-sit]');
        if (!b) return;
        e.stopPropagation();
        if (b.dataset.stage !== undefined) { if (playing) setPlaying(false); jumpStep(Number(b.dataset.stage)); }
        else { sit = Number(b.dataset.sit); renderAll(); save(); }
    });

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

    let ro = null;
    if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            fitFont();
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
            window._wfMiniBarCollapse(widget, "⚖️ L'égalité filles-garçons", {
                onExpand: () => requestAnimationFrame(() => { applySize(); renderAll(); })
            });
        }
    });
    wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        wfMax.title = _isMax ? 'Quitter le plein écran' : 'Plein écran';
        requestAnimationFrame(fitFont);
    });
    function onKey(e) { if (_isMax && e.key === 'Escape' && document.body.contains(widget)) wfMax.click(); }
    document.addEventListener('keydown', onKey);
    wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        cleanup();
        widget.remove();
        save();
    });
    function cleanup() {
        clearInterval(playTimer); playTimer = null; playing = false;
        if (ro) ro.disconnect();
        document.removeEventListener('click', closeHelp);
        document.removeEventListener('keydown', onKey);
    }
    // Nettoyage aussi quand le widget est supprimé autrement (barre d'édition, effacer…)
    const mo = new MutationObserver(() => { if (!document.body.contains(widget)) { cleanup(); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true });

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
    setMode('droits');
    requestAnimationFrame(() => { fitFont(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._egfgGetData = () => ({
        containerW: contW, containerH: contH,
        mode, step, ov, group, answers: Object.assign({}, answers), selCard,
        stat, guesses: Object.assign({}, guesses), revealed: Object.assign({}, revealed),
        sit, sitAns: Object.assign({}, sitAns)
    });
    widget._egfgSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        const int = (v, lo, hi, def) => Number.isInteger(v) && v >= lo && v <= hi ? v : def;
        step = int(d.step, 0, EGFG_STEPS.length - 1, 0);
        ov = typeof d.ov === 'boolean' ? d.ov : true;
        group = EGFG_GROUPS[d.group] ? d.group : 'jouets';
        answers = {};
        if (d.answers && typeof d.answers === 'object') Object.keys(d.answers).forEach(k => {
            const [g, i] = k.split(':');
            const v = d.answers[k];
            if (EGFG_CARDS[g] && EGFG_CARDS[g][+i] && ['f', 'g', 't', 'vrai', 'stereo', 'reveal'].includes(v)) answers[k] = v;
        });
        selCard = typeof d.selCard === 'string' && answers[d.selCard] !== undefined ? d.selCard : null;
        stat = int(d.stat, 0, EGFG_STATS.length - 1, 0);
        guesses = {}; revealed = {};
        EGFG_STATS.forEach(st => {
            if (d.guesses && Number.isInteger(d.guesses[st.id]) && d.guesses[st.id] >= 0 && d.guesses[st.id] <= 10) guesses[st.id] = d.guesses[st.id];
            if (d.revealed && d.revealed[st.id] === true) revealed[st.id] = true;
        });
        sit = int(d.sit, 0, EGFG_SITS.length - 1, 0);
        sitAns = {};
        if (d.sitAns && typeof d.sitAns === 'object') Object.keys(d.sitAns).forEach(k => {
            const i = +k, v = d.sitAns[k];
            if (EGFG_SITS[i] && Number.isInteger(v) && v >= 0 && v < EGFG_SITS[i].choices.length) sitAns[i] = v;
        });
        setMode(d.mode || 'droits');
    };

    // Sur téléphone et tablette, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfAutoMaxPhoneTablet(widget, () => wfMax.click(), () => _isMax, '_egfgSetData');

    save();
    return widget;
}
