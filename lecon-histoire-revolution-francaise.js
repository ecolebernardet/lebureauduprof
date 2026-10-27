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
// WIDGET LA RÉVOLUTION FRANÇAISE — Le Bureau du Prof
// Pour des élèves de cycle 3 (CM1 – CM2 – 6e), dans la suite de « La société
// médiévale ». Trois onglets :
//  ⚖️ Les trois ordres :
//     • 1788 : la pyramide de la société d'ordres (le roi, le clergé, la
//       noblesse, le tiers état), avec « 💰 Les impôts » (qui paie quoi, à
//       qui) et « 👥 La population » (sur 200 Français…).
//     • Mai 1789 : les États généraux, le vote par ordre ou par tête.
//     • 4 août 1789 : la pyramide s'effondre, tous deviennent des citoyens
//       égaux en droits (animation).
//  📅 Les grandes dates : une frise de 1789 à 1804, avec les grandes périodes
//     et 18 événements ; « ▶ Raconter » les présente l'un après l'autre.
//  📜 La Déclaration des droits de l'homme et du citoyen (26 août 1789) :
//     les 17 articles (texte original et explication simple), et un jeu
//     « 🧩 Quel droit ? » : quel article protège cette situation ?
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
    if (document.getElementById('rvf-style')) return;
    const s = document.createElement('style');
    s.id = 'rvf-style';
    s.textContent = `
        .widget[data-type="histoire-revolution"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .rvf-container {
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
        .rvf-header { display: flex; align-items: center; gap: 8px; cursor: move; flex-shrink: 0; }
        .rvf-title { font-size: 14px; font-weight: 800; color: #374151; pointer-events: none; }
        .rvf-header .wf-btns { gap: 8px; }
        .rvf-header .wf-btn { width: 18px; height: 18px; }
        .rvf-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rvf-container.wf-fullboard {
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
        .rvf-tabs { display: inline-flex; background: #eef0f8; border-radius: 11px; padding: 3px; gap: 3px; }
        .rvf-tab {
            min-height: 34px; padding: 4px 13px; border: none; border-radius: 9px;
            background: transparent; color: #4b5563; font-size: 13px; font-weight: 800;
            font-family: inherit; cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .rvf-tab.on { background: #fff; color: #1e3a8a; box-shadow: 0 1px 4px rgba(0,0,0,.12); }

        .rvf-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; flex-shrink: 0; }
        .rvf-btn {
            min-height: 34px; padding: 5px 12px; border-radius: 9px;
            border: 1px solid #d6d9de; background: #f0f0f0; color: #333;
            font-size: 13px; font-weight: 700; font-family: inherit;
            cursor: pointer; touch-action: manipulation; white-space: nowrap;
        }
        .rvf-btn:hover { background: #e0e0e0; }
        .rvf-btn:active { transform: scale(0.96); }
        .rvf-btn.on { background: #1e3a8a; color: #fff; border-color: #1e3a8a; }
        .rvf-btn-stage { border-left: 5px solid var(--st-c, #bbb); }
        .rvf-btn-stage.on { background: var(--st-c, #1e3a8a); border-color: var(--st-c, #1e3a8a); }
        .rvf-btn-play.on { background: #16a34a; border-color: #16a34a; }
        .rvf-sep { width: 1px; align-self: stretch; background: #e5e7eb; margin: 2px; }
        .rvf-score { margin-left: auto; font-size: 13px; font-weight: 800; color: #1e3a8a; white-space: nowrap; }

        /* Corps */
        .rvf-body { flex: 1 1 auto; display: flex; gap: 10px; min-height: 0; }
        .rvf-scene-wrap {
            flex: 1 1 auto; min-width: 0; position: relative;
            border-radius: 12px; overflow: hidden; background: #f7f3ea;
        }
        .rvf-canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: pointer; }
        .rvf-doc {
            position: absolute; inset: 0; overflow-y: auto; display: none; padding: 14px;
            background: radial-gradient(circle at 50% 0%, #fbf3dc, #efe0bb); color: #3b2a12;
            font-family: Georgia, 'Times New Roman', serif; line-height: 1.45;
        }
        .rvf-scene-wrap.doc .rvf-doc { display: block; }
        .rvf-scene-wrap.doc .rvf-canvas { display: none; }
        .rvf-parch { max-width: 820px; margin: 0 auto; border: 3px double #8a6a2a; border-radius: 10px; padding: 14px 18px; background: rgba(255,250,235,.6); }
        .rvf-parch h3 { text-align: center; margin: 0 0 2px; font-size: 1.25em; letter-spacing: .02em; }
        .rvf-parch .rvf-sub { text-align: center; margin: 0 0 8px; font-style: italic; color: #6b4f1d; }
        .rvf-tric { height: 6px; border-radius: 3px; background: linear-gradient(90deg, #1f3f99 33%, #fff 33% 66%, #e1262d 66%); margin: 6px auto 10px; max-width: 260px; border: 1px solid #c9b48d; }
        .rvf-pre { font-size: .93em; margin: 0 0 10px; color: #4a3714; }
        .rvf-art {
            display: block; width: 100%; text-align: left; border: 1px solid transparent; border-radius: 8px;
            background: transparent; padding: 6px 8px; margin: 0 0 3px; cursor: pointer; font: inherit; color: inherit;
            touch-action: manipulation;
        }
        .rvf-art:hover { background: rgba(255,255,255,.55); }
        .rvf-art.on { background: #fff8e1; border-color: #b45309; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
        .rvf-art b { color: #7c2d12; }
        .rvf-art .rvf-tt { font-family: 'Segoe UI', system-ui, sans-serif; font-size: .78em; font-weight: 800; color: #fff; background: #b45309; border-radius: 6px; padding: 1px 6px; margin-left: 4px; }
        .rvf-game { max-width: 760px; margin: 0 auto; font-family: 'Segoe UI', system-ui, sans-serif; }
        .rvf-sit { background: #fff; border: 2px solid #b45309; border-radius: 14px; padding: 14px 16px; font-size: 1.25em; font-weight: 700; color: #1f2937; margin: 6px 0 12px; line-height: 1.35; }
        .rvf-sit small { display: block; font-size: .6em; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
        .rvf-choices { display: grid; gap: 8px; }
        .rvf-choice {
            min-height: 48px; border-radius: 12px; border: 2px solid #d6c49d; background: #fffdf6; text-align: left;
            font-size: 1.05em; font-weight: 800; font-family: inherit; color: #3b2a12; padding: 8px 12px; cursor: pointer; touch-action: manipulation;
        }
        .rvf-choice:hover { background: #fff6dc; }
        .rvf-choice.good { background: #16a34a; border-color: #16a34a; color: #fff; }
        .rvf-choice.wrong { background: #dc2626; border-color: #dc2626; color: #fff; }
        .rvf-choice:disabled { cursor: default; }
        .rvf-fb { margin: 12px 0 0; padding: 10px 12px; border-radius: 12px; font-weight: 700; }
        .rvf-fb.ok { background: #dcfce7; color: #166534; } .rvf-fb.ko { background: #fee2e2; color: #991b1b; }
        .rvf-fb q { display: block; font-family: Georgia, serif; font-weight: 400; color: #3b2a12; margin-top: 6px; font-style: italic; }

        .rvf-side {
            flex: 0 0 31%; min-width: 230px; max-width: 390px;
            background: #fafafa; border: 1px solid #e5e7eb; border-left: 6px solid #1e3a8a;
            border-radius: 10px; padding: 10px 12px; box-sizing: border-box;
            color: #374151; line-height: 1.4; overflow-y: auto; font-size: 14px;
        }
        .rvf-side h4 { margin: 0 0 4px; font-size: .9em; font-weight: 800; color: #6b7280; text-transform: uppercase; letter-spacing: .03em; }
        .rvf-status { font-size: 1.2em; font-weight: 900; margin: 2px 0 6px; }
        .rvf-date { background: #fdf3e2; border-radius: 8px; padding: 5px 9px; margin: 0 0 6px; color: #7a4b12; font-weight: 800; }
        .rvf-text { margin: 0 0 6px; }
        .rvf-box { background: #eef2fb; border-radius: 8px; padding: 6px 9px; margin: 0 0 6px; color: #1e3a8a; }
        .rvf-quote { background: #fffaf0; border-left: 4px solid #b45309; border-radius: 6px; padding: 6px 9px; margin: 0 0 6px; font-family: Georgia, serif; font-style: italic; color: #4a3714; }
        .rvf-know { background: #fff6ec; border-radius: 8px; padding: 7px 9px; color: #5b3a17; margin: 0 0 8px; }
        .rvf-facts { display: grid; gap: 4px; margin: 0 0 6px; }
        .rvf-facts div { background: #f3f4f6; border-radius: 8px; padding: 5px 9px; }
        .rvf-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .rvf-list button, .rvf-go {
            width: 100%; text-align: left; min-height: 32px; border-radius: 8px;
            border: 1px solid #e0e3e8; border-left: 5px solid var(--st-c, #bbb);
            background: #fff; font-size: 13px; font-weight: 700; font-family: inherit; color: #374151;
            cursor: pointer; padding: 4px 8px; touch-action: manipulation;
        }
        .rvf-list button.on { background: var(--st-c, #1e3a8a); color: #fff; }
        .rvf-go { text-align: center; background: #eef2fb; color: #1e3a8a; margin: 0 0 8px; border-left-width: 1px; }
        .rvf-small { font-weight: 600; opacity: .75; font-size: .9em; }

        /* Aide */
        .rvf-help-btn {
            width: 28px; height: 28px; border-radius: 50%; border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 14px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0; touch-action: manipulation;
        }
        .rvf-help-popup {
            display: none; position: absolute; top: 46px; right: 12px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,.15);
            padding: 12px 14px; width: 400px; max-width: calc(100% - 24px);
            font-size: 12px; color: #444; z-index: 10; line-height: 1.5;
        }
        .rvf-help-popup.show { display: block; }
        .rvf-help-popup h4 { margin: 0 0 8px; font-size: 13px; color: #374151; }
        .rvf-help-popup p { margin: 0 0 6px; }

        .rvf-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 24px; height: 24px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 55%, #b5bac2 55%);
            border-radius: 0 0 14px 0; opacity: .6; z-index: 5; touch-action: none;
        }
        .rvf-resize-handle:hover { opacity: 1; }
        .rvf-container:not([data-mode="ordres"]) .rvf-only-ordres,
        .rvf-container:not([data-mode="dates"]) .rvf-only-dates,
        .rvf-container:not([data-mode="ddhc"]) .rvf-only-ddhc { display: none !important; }
        .rvf-container:not([data-stage="ordres"]) .rvf-only-st-ordres,
        .rvf-container:not([data-stage="etats"]) .rvf-only-st-etats { display: none !important; }
        .rvf-container:not([data-dmode="jeu"]) .rvf-only-jeu { display: none !important; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .rvf-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 0 1 auto; }
        .rvf-tab-short { display: none; }
        .rvf-header { min-width: 0; max-width: 100%; }
        .rvf-tabs { flex: 0 1 auto; min-width: 0; overflow: hidden; }
        .rvf-tab { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        .rvf-header .wf-btns { flex-shrink: 0; }
        .rvf-container.wf-fullboard .rvf-resize-handle { display: none; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rvf-container { padding: 10px 10px 8px; gap: 6px; }
            .rvf-header { gap: 6px; }
            .rvf-title { font-size: 13px; }
            .rvf-tab { min-height: 32px; padding: 3px 8px; font-size: 12px; }
            .rvf-row { gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: thin;
                       -webkit-overflow-scrolling: touch; padding-bottom: 2px; }
            .rvf-row > * { flex-shrink: 0; }
            .rvf-btn { min-height: 32px; padding: 4px 9px; font-size: 12px; }
            .rvf-sep { display: none; }
            .rvf-side { padding: 8px 10px; font-size: 13px; }
            .rvf-doc { padding: 8px; }
            .rvf-parch { padding: 10px; }
            .rvf-sit { font-size: 1.05em; }
            .rvf-help-popup { left: 10px; right: 10px; width: auto; max-width: none; max-height: 70vh; overflow-y: auto; }
        }
        @media (max-width: 620px) {
            .rvf-title { display: none; }
            .rvf-tab { padding: 3px 7px; font-size: 11.5px; }
            .rvf-tab-long { display: none; }
            .rvf-tab-short { display: inline; }
            .rvf-header .wf-btns { gap: 6px; }
        }
        @media (max-width: 768px) and (orientation: portrait) {
            .rvf-body { flex-direction: column; }
            .rvf-scene-wrap { flex: 1 1 0; min-height: 220px; }
            .rvf-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 42%; }
        }
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .rvf-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="histoire-revolution"], .rvf-container, .rvf-container * { cursor: default !important; }
        .rvf-container .rvf-header, .rvf-container .rvf-header * { cursor: grab !important; }
        .rvf-container .rvf-header:active, .rvf-container .rvf-header:active * { cursor: grabbing !important; }
        .rvf-container button, .rvf-container button *, .rvf-container .rvf-header button,
        .rvf-container .rvf-header button *,
        .rvf-container input[type="range"] { cursor: pointer !important; }
        .rvf-container button:disabled, .rvf-container button:disabled *,
        .rvf-container .rvf-canvas { cursor: default !important; }
        .rvf-container input { cursor: text !important; }
        .rvf-container .rvf-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .rvf-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .rvf-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .rvf-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .rvf-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .rvf-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .rvf-help-popup { top: 56px; }
        .rvf-container.wf-fullboard .rvf-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rvf-container.wf-fullboard .rvf-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .rvf-title { font-size: 17px; }
        }
        .rvf-tabs { background: transparent; padding: 0; gap: 6px; border-radius: 0; margin-left: 6px; }
        .rvf-tab {
            min-height: 0; border: 2px solid rgba(255,255,255,.25); background: transparent; color: #fff;
            border-radius: 999px; padding: 5px 14px; font-size: 14px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif; box-shadow: none;
        }
        .rvf-tab:hover { background: rgba(255,255,255,.1); }
        .rvf-tab.on { background: #FFC933; border-color: #FFC933; color: #2A1F4A; box-shadow: none; }
        /* Trois onglets longs : ils passent sur une 2e ligne de la barre au lieu d'être coupés */
        .rvf-header { flex-wrap: wrap; row-gap: 8px; }
        .rvf-tabs { order: 3; flex: 1 1 100%; margin-left: 0; overflow-x: auto; scrollbar-width: none; }
        .rvf-tab { flex: 0 0 auto; overflow: visible; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .rvf-header { margin: -10px -10px 0; padding: 8px 10px 7px; gap: 6px; }
            .rvf-container.wf-fullboard .rvf-header {
                margin-right: calc(-10px - env(safe-area-inset-right));
                padding-right: calc(10px + env(safe-area-inset-right));
            }
            .rvf-tab { padding: 3px 10px; font-size: 12px; }
            .rvf-help-popup { top: 50px; }
        }
        @media (max-width: 620px) {
            .rvf-tab { padding: 3px 8px; font-size: 11.5px; }
        }
    `;
    document.head.appendChild(s);
})();

// =========================================================================
//  CONTENU PÉDAGOGIQUE
// =========================================================================
// Les ordres (onglet 1)
const RVF_ORDRES = {
    roi: { name: 'Le roi', ico: '👑', color: '#b7791f', light: '#f6e7b0',
        text: '<b>Louis XVI</b> est roi de France depuis 1774. C\'est une <b>monarchie absolue de droit divin</b> : le roi tient son pouvoir de Dieu et il a <b>tous les pouvoirs</b>. Il fait les lois, les fait appliquer et rend la justice. Il vit à Versailles, avec la reine <b>Marie-Antoinette</b>.',
        know: 'Avec une « lettre de cachet », le roi pouvait faire enfermer quelqu\'un en prison sans jugement.' },
    clerge: { name: 'Le clergé', ico: '⛪', color: '#7e22ce', light: '#ede4f7', sub: 'ceux qui prient', pct: '0,5 %',
        text: 'Le <b>premier ordre</b> : les évêques, les abbés, les curés, les moines et les religieuses (environ 120 000 personnes). Ils prient, mais tiennent aussi les registres des naissances, des mariages et des décès, les écoles et les hôpitaux.',
        priv: 'Ne paie pas les impôts du roi. Reçoit la <b>dîme</b> (une partie des récoltes des paysans). Possède beaucoup de terres.',
        know: 'Le clergé n\'est pas un groupe égal : les évêques, souvent nobles, sont très riches, alors que beaucoup de curés de campagne sont pauvres.' },
    noblesse: { name: 'La noblesse', ico: '⚔️', color: '#1d4ed8', light: '#dfe8fb', sub: 'ceux qui combattent', pct: '1,5 %',
        text: 'Le <b>deuxième ordre</b> : les nobles (environ 350 000 personnes). Certains vivent à la cour de Versailles, près du roi ; d\'autres sont des seigneurs de campagne. On est noble surtout par la <b>naissance</b>.',
        priv: 'Ne paie pas la taille (le principal impôt). Reçoit des <b>droits seigneuriaux</b> et la <b>corvée</b> des paysans. A le droit de porter l\'épée et de chasser. Les postes d\'officiers lui sont réservés.',
        know: 'On disait de certains nobles qu\'ils avaient « le sang bleu », pour montrer qu\'ils n\'étaient pas comme les autres.' },
    tiers: { name: 'Le tiers état', ico: '🧑‍🌾', color: '#a16207', light: '#f6ead2', sub: 'ceux qui travaillent', pct: '98 %',
        text: 'Le <b>troisième ordre</b>, c\'est presque tout le monde : les <b>paysans</b> (les plus nombreux), les artisans, les ouvriers, les commerçants et les <b>bourgeois</b> (banquiers, avocats, médecins…). Certains bourgeois sont riches et instruits, mais ils n\'ont aucun privilège.',
        priv: 'Aucun privilège. Paie <b>tous les impôts</b> : la taille et la gabelle (impôt sur le sel) au roi, la dîme au clergé, les droits seigneuriaux et la corvée au seigneur.',
        know: 'En 1789, l\'abbé Sieyès écrit : « Qu\'est-ce que le tiers état ? Tout. Qu\'a-t-il été jusqu\'à présent ? Rien. Qu\'est-ce qu\'il demande ? À devenir quelque chose. »' }
};
const RVF_STAGES = {
    ordres: { ico: '🏰', name: '1788 : la société d\'ordres', color: '#7c2d12' },
    etats:  { ico: '🗳️', name: 'Mai 1789 : les États généraux', color: '#1e3a8a' },
    egaux:  { ico: '⚖️', name: '4 août 1789 : la fin des privilèges', color: '#b91c1c' }
};

// Les grandes dates (onglet 2) : y = année décimale pour la frise
const RVF_EVENTS = [
    { id: 'etats', y: 1789.344, date: '5 mai 1789', short: 'États généraux', ico: '🏛️',
      text: 'Le royaume est ruiné. Pour trouver de l\'argent, Louis XVI réunit à Versailles les <b>États généraux</b> : des députés des trois ordres. Avant, chaque village a écrit un <b>cahier de doléances</b> pour dire ce qui ne va pas.',
      know: 'Les Français ont rédigé environ 60 000 cahiers de doléances !', link: { tab: 'ordres', stage: 'etats', txt: '🗳️ Voir le vote aux États généraux' } },
    { id: 'jeudepaume', y: 1789.469, date: '20 juin 1789', short: 'Serment du Jeu de paume', ico: '✋',
      text: 'Les députés du tiers état se sont déclarés <b>Assemblée nationale</b> (17 juin). Trouvant leur salle fermée, ils se réunissent dans une salle de jeu de paume et <b>jurent de ne pas se séparer</b> avant d\'avoir donné une <b>constitution</b> à la France.',
      know: 'Le jeu de paume est l\'ancêtre du tennis : on frappait la balle avec la paume de la main.' },
    { id: 'bastille', y: 1789.536, date: '14 juillet 1789', short: 'Prise de la Bastille', ico: '🏰',
      text: 'Le peuple de Paris, qui craint que le roi envoie l\'armée contre l\'Assemblée, cherche des armes. Il prend la <b>Bastille</b>, une prison-forteresse, symbole du pouvoir absolu du roi.',
      know: 'Ce jour-là, il n\'y avait que 7 prisonniers dans la Bastille. Elle a ensuite été démolie pierre par pierre.' },
    { id: 'privileges', y: 1789.592, date: '4 août 1789', short: 'Abolition des privilèges', ico: '⚖️',
      text: 'Pendant la nuit du 4 août, les députés votent l\'<b>abolition des privilèges</b> : la société d\'ordres disparaît. Tous les Français doivent payer l\'impôt, et tous les emplois sont ouverts à tous.',
      know: 'Cette nuit-là, ce sont des nobles qui ont proposé eux-mêmes de renoncer à leurs privilèges.', link: { tab: 'ordres', stage: 'egaux', txt: '⚖️ Voir la pyramide s\'effondrer' } },
    { id: 'ddhc', y: 1789.652, date: '26 août 1789', short: 'Déclaration des droits', ico: '📜',
      text: 'L\'Assemblée vote la <b>Déclaration des droits de l\'homme et du citoyen</b>. Elle affirme que « les hommes naissent et demeurent libres et égaux en droits ».',
      know: 'Cette Déclaration fait toujours partie de notre Constitution aujourd\'hui.', link: { tab: 'ddhc', txt: '📜 Lire la Déclaration' } },
    { id: 'octobre', y: 1789.761, date: '5-6 octobre 1789', short: 'Marche sur Versailles', ico: '🥖',
      text: 'Le pain manque et coûte très cher. Des milliers de <b>femmes de Paris</b> marchent jusqu\'à Versailles et ramènent la famille royale à Paris, au palais des Tuileries.',
      know: 'Les Parisiens criaient qu\'ils ramenaient « le boulanger, la boulangère et le petit mitron » : le roi, la reine et leur fils.' },
    { id: 'federation', y: 1790.536, date: '14 juillet 1790', short: 'Fête de la Fédération', ico: '🎉',
      text: 'Un an après la prise de la Bastille, une grande fête réunit à Paris, au Champ-de-Mars, des délégués venus de toute la France. Le roi jure fidélité à la Nation et à la loi.',
      know: 'C\'est l\'une des deux dates que rappelle notre fête nationale du 14 Juillet.' },
    { id: 'varennes', y: 1791.469, date: '20-21 juin 1791', short: 'Fuite à Varennes', ico: '🐎',
      text: 'Déguisé, le roi s\'enfuit en secret avec sa famille pour rejoindre l\'étranger. Il est reconnu et arrêté à <b>Varennes</b>. Beaucoup de Français n\'ont plus confiance en lui.',
      know: 'On raconte que le roi a été reconnu grâce à son portrait imprimé sur les billets de banque (les assignats).' },
    { id: 'constitution', y: 1791.672, date: '3 septembre 1791', short: 'Première Constitution', ico: '📘',
      text: 'La France a sa <b>première Constitution</b> : c\'est une <b>monarchie constitutionnelle</b>. Le roi doit obéir à la loi et partager le pouvoir : l\'Assemblée fait les lois, le roi les fait appliquer, les juges rendent la justice (<b>séparation des pouvoirs</b>).',
      know: 'Seuls les hommes assez riches pour payer un certain impôt peuvent voter : on les appelle les « citoyens actifs ».' },
    { id: 'guerre', y: 1792.302, date: '20 avril 1792', short: 'La guerre', ico: '⚔️',
      text: 'La France déclare la <b>guerre</b> au roi de Bohême et de Hongrie (l\'Autriche), qui veut aider Louis XVI. Des volontaires partent défendre la « patrie en danger ».',
      know: 'C\'est à ce moment que Rouget de Lisle écrit à Strasbourg le chant qui deviendra <b>La Marseillaise</b>.' },
    { id: 'tuileries', y: 1792.608, date: '10 août 1792', short: 'Chute de la monarchie', ico: '👑',
      text: 'Le peuple de Paris et les <b>sans-culottes</b> prennent le palais des Tuileries. Le roi est enfermé avec sa famille : c\'est la <b>fin de la monarchie</b>.',
      know: 'On appelait « sans-culottes » les révolutionnaires du peuple : ils portaient un pantalon et non la culotte courte des nobles.' },
    { id: 'republique', y: 1792.722, date: '21-22 septembre 1792', short: 'La République', ico: '🇫🇷',
      text: 'La nouvelle assemblée, la <b>Convention</b>, élue par tous les hommes, abolit la royauté et proclame la <b>République</b>. C\'est la Première République.',
      know: 'Les révolutionnaires ont créé un nouveau calendrier : le 22 septembre 1792 devient le 1er jour de l\'an I de la République.' },
    { id: 'louis16', y: 1793.055, date: '21 janvier 1793', short: 'Exécution du roi', ico: '⚰️',
      text: 'Jugé pour trahison, <b>Louis XVI</b> (appelé « Louis Capet ») est condamné à mort et <b>guillotiné</b> à Paris, sur l\'actuelle place de la Concorde. La reine Marie-Antoinette est exécutée en octobre 1793.',
      know: 'La guillotine devait rendre les exécutions plus rapides et égales pour tous : avant, seuls les nobles avaient le droit d\'avoir la tête tranchée.' },
    { id: 'terreur', y: 1793.68, date: '1793 – 1794', short: 'La Terreur', ico: '😨',
      text: 'La République est attaquée par les rois d\'Europe et par des révoltes en France. <b>Robespierre</b> et le Comité de salut public gouvernent par la <b>Terreur</b> : les suspects sont arrêtés, et plus de 16 000 personnes sont condamnées à mort.',
      know: 'Pendant la Terreur, les libertés de la Déclaration des droits ne sont plus respectées.' },
    { id: 'esclavage', y: 1794.092, date: '4 février 1794', short: 'Abolition de l\'esclavage', ico: '⛓️',
      text: 'La Convention <b>abolit l\'esclavage</b> dans les colonies françaises, après la révolte des esclaves de Saint-Domingue (aujourd\'hui Haïti).',
      know: 'Napoléon Bonaparte rétablit l\'esclavage en 1802. Il est aboli définitivement en <b>1848</b>, grâce à Victor Schœlcher.' },
    { id: 'thermidor', y: 1794.571, date: '27 juillet 1794', short: 'Chute de Robespierre', ico: '🔚',
      text: 'Les députés font arrêter <b>Robespierre</b>, qui est guillotiné le lendemain : c\'est la <b>fin de la Terreur</b>. En 1795, un nouveau gouvernement, le <b>Directoire</b>, dirige la République.',
      know: 'Dans le calendrier révolutionnaire, cette journée s\'appelle le 9 thermidor an II. Thermidor était le mois de la chaleur.' },
    { id: 'metre', y: 1795.266, date: '7 avril 1795', short: 'Le système métrique', ico: '📏',
      text: 'Avant, chaque région avait ses mesures (pieds, pouces, aunes…). La Révolution crée le <b>système métrique</b> : le <b>mètre</b>, le litre et le gramme, les mêmes pour toute la France.',
      know: 'Le mètre a été défini à partir de la taille de la Terre : c\'est la dix-millionième partie de la distance entre le pôle Nord et l\'équateur.' },
    { id: 'directoire', y: 1795.818, date: '26 octobre 1795', short: 'Le Directoire', ico: '🖋️',
      text: 'Une nouvelle Constitution confie le gouvernement à <b>cinq directeurs</b> : c\'est le <b>Directoire</b>. Seuls les citoyens qui paient un impôt peuvent voter. La France est toujours en guerre et les difficultés continuent.',
      know: 'Pendant le Directoire, un jeune général se fait connaître par ses victoires en Italie : Napoléon Bonaparte.' },
    { id: 'brumaire', y: 1799.855, date: '9 novembre 1799', short: 'Coup d\'État de Bonaparte', ico: '🎖️',
      text: 'Le général <b>Napoléon Bonaparte</b>, devenu célèbre par ses victoires, prend le pouvoir par un coup d\'État : c\'est le 18 brumaire. Il devient <b>Premier consul</b>. On dit souvent que c\'est la <b>fin de la Révolution</b>.',
      know: 'Le 18 brumaire est une date du calendrier républicain : brumaire était le mois des brumes.' },
    { id: 'sacre', y: 1804.919, date: '2 décembre 1804', short: 'Sacre de Napoléon', ico: '🦅',
      text: 'À Notre-Dame de Paris, Napoléon Bonaparte est sacré <b>empereur des Français</b> : c\'est le <b>Premier Empire</b>. La République disparaît, mais beaucoup d\'idées de la Révolution restent : l\'égalité devant la loi, le Code civil (1804), les départements, le système métrique.',
      know: 'Pendant la cérémonie, Napoléon a pris la couronne et l\'a posée lui-même sur sa tête.' }
];
// La frise : les grandes périodes
const RVF_PERIODS = [
    { from: 1788.7, to: 1789.344, name: 'Monarchie absolue', short: 'Abs.', color: '#b7791f' },
    { from: 1789.344, to: 1792.608, name: 'Monarchie constitutionnelle', short: 'Monarchie constit.', color: '#2563eb' },
    { from: 1792.722, to: 1795.818, name: 'La Convention', color: '#b91c1c' },
    { from: 1795.818, to: 1799.855, name: 'Le Directoire', color: '#7c3aed' },
    { from: 1799.855, to: 1804.38, name: 'Le Consulat', color: '#0f766e' },
    { from: 1804.38, to: 1805.3, name: 'L\'Empire', short: 'Emp.', color: '#475569' }
];
const RVF_Y0 = 1788.7, RVF_Y1 = 1805.3;
// Les zooms de la frise
const RVF_ZOOMS = {
    all:  { name: '🌐 Tout', a: RVF_Y0, b: RVF_Y1 },
    z89:  { name: '1789', a: 1789.22, b: 1789.86 },
    z90:  { name: '1790 – 1792', a: 1790.3, b: 1792.85 },
    z92:  { name: '1792 – 1795', a: 1792.6, b: 1795.45 },
    z95:  { name: '1795 – 1804', a: 1795.45, b: 1805.3 }
};
const RVF_MONTHS = ['janv.', 'févr.', 'mars', 'avril', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// La Déclaration (onglet 3)
const RVF_ARTS = [
    { t: 'Libres et égaux', txt: 'Les hommes naissent et demeurent libres et égaux en droits. Les distinctions sociales ne peuvent être fondées que sur l\'utilité commune.',
      ex: 'Tout le monde naît <b>libre</b> et avec les <b>mêmes droits</b>. On ne peut plus avoir des privilèges parce qu\'on est né noble.', auj: 'C\'est le début de notre devise : Liberté, Égalité.' },
    { t: 'Les droits naturels', txt: 'Le but de toute association politique est la conservation des droits naturels et imprescriptibles de l\'homme. Ces droits sont la liberté, la propriété, la sûreté, et la résistance à l\'oppression.',
      ex: 'La société doit protéger quatre droits : être <b>libre</b>, <b>posséder</b> des biens, être en <b>sécurité</b> et pouvoir <b>se défendre</b> contre un pouvoir injuste.', auj: 'Ces droits sont « imprescriptibles » : on ne peut jamais les perdre.' },
    { t: 'La souveraineté de la nation', txt: 'Le principe de toute souveraineté réside essentiellement dans la nation. Nul corps, nul individu ne peut exercer d\'autorité qui n\'en émane expressément.',
      ex: 'Le pouvoir n\'appartient plus au roi seul : il appartient à la <b>nation</b>, c\'est-à-dire à l\'ensemble des citoyens.', auj: 'Aujourd\'hui, les citoyens choisissent leurs représentants en votant.' },
    { t: 'La liberté', txt: 'La liberté consiste à pouvoir faire tout ce qui ne nuit pas à autrui : ainsi, l\'exercice des droits naturels de chaque homme n\'a de bornes que celles qui assurent aux autres membres de la société la jouissance de ces mêmes droits. Ces bornes ne peuvent être déterminées que par la loi.',
      ex: 'Être libre, c\'est pouvoir faire ce que l\'on veut… <b>tant que cela ne fait pas de mal aux autres</b>.', auj: 'On dit souvent : « Ma liberté s\'arrête là où commence celle des autres. »' },
    { t: 'Ce que la loi permet', txt: 'La loi n\'a le droit de défendre que les actions nuisibles à la société. Tout ce qui n\'est pas défendu par la loi ne peut être empêché, et nul ne peut être contraint à faire ce qu\'elle n\'ordonne pas.',
      ex: 'La loi n\'interdit que ce qui fait du tort à la société. <b>Tout ce que la loi n\'interdit pas est permis.</b>', auj: 'Personne ne peut t\'obliger à faire quelque chose que la loi n\'exige pas.' },
    { t: 'La loi est la même pour tous', txt: 'La loi est l\'expression de la volonté générale. Tous les citoyens ont droit de concourir personnellement, ou par leurs représentants, à sa formation. Elle doit être la même pour tous, soit qu\'elle protège, soit qu\'elle punisse. Tous les citoyens étant égaux à ses yeux sont également admissibles à toutes dignités, places et emplois publics, selon leur capacité, et sans autre distinction que celle de leurs vertus et de leurs talents.',
      ex: 'La loi est faite par les citoyens ou leurs représentants, et elle est <b>la même pour tous</b>. Chacun peut devenir maire, juge ou ministre <b>selon ses talents</b>, et non selon sa naissance.', auj: 'Ce sont les députés, élus par les citoyens, qui votent les lois.' },
    { t: 'Pas d\'arrestation arbitraire', txt: 'Nul homme ne peut être accusé, arrêté ni détenu que dans les cas déterminés par la loi, et selon les formes qu\'elle a prescrites. Ceux qui sollicitent, expédient, exécutent ou font exécuter des ordres arbitraires, doivent être punis ; mais tout citoyen appelé ou saisi en vertu de la loi doit obéir à l\'instant : il se rend coupable par la résistance.',
      ex: 'On ne peut pas arrêter ou enfermer quelqu\'un <b>sans une raison prévue par la loi</b>. C\'est la fin des « lettres de cachet » du roi.', auj: 'Pour arrêter quelqu\'un, la police doit respecter des règles précises.' },
    { t: 'Des peines justes', txt: 'La loi ne doit établir que des peines strictement et évidemment nécessaires, et nul ne peut être puni qu\'en vertu d\'une loi établie et promulguée antérieurement au délit, et légalement appliquée.',
      ex: 'Une punition doit être <b>prévue par la loi avant la faute</b>, et ne pas être plus sévère que nécessaire.', auj: 'On ne peut pas être puni pour quelque chose qui était permis au moment où on l\'a fait.' },
    { t: 'La présomption d\'innocence', txt: 'Tout homme étant présumé innocent jusqu\'à ce qu\'il ait été déclaré coupable, s\'il est jugé indispensable de l\'arrêter, toute rigueur qui ne serait pas nécessaire pour s\'assurer de sa personne doit être sévèrement réprimée par la loi.',
      ex: 'Une personne accusée est <b>innocente tant qu\'un tribunal n\'a pas prouvé qu\'elle est coupable</b>.', auj: 'C\'est la « présomption d\'innocence » : elle protège chacun d\'entre nous.' },
    { t: 'La liberté d\'opinion', txt: 'Nul ne doit être inquiété pour ses opinions, même religieuses, pourvu que leur manifestation ne trouble pas l\'ordre public établi par la loi.',
      ex: 'Chacun peut <b>penser ce qu\'il veut</b> et avoir la <b>religion</b> de son choix, ou aucune, sans être embêté.', auj: 'Avec la laïcité, l\'État respecte toutes les croyances et n\'en favorise aucune.' },
    { t: 'La liberté d\'expression', txt: 'La libre communication des pensées et des opinions est un des droits les plus précieux de l\'homme : tout citoyen peut donc parler, écrire, imprimer librement, sauf à répondre de l\'abus de cette liberté dans les cas déterminés par la loi.',
      ex: 'Chacun peut <b>parler, écrire et publier</b> librement ses idées. Mais on n\'a pas le droit d\'insulter ou de mentir pour faire du mal à quelqu\'un.', auj: 'C\'est la liberté d\'expression et la liberté de la presse.' },
    { t: 'La force publique', txt: 'La garantie des droits de l\'homme et du citoyen nécessite une force publique : cette force est donc instituée pour l\'avantage de tous, et non pour l\'utilité particulière de ceux auxquels elle est confiée.',
      ex: 'Il faut une <b>police</b> et une <b>armée</b> pour protéger les droits de tous, et non pour servir ceux qui les commandent.', auj: 'Les policiers et les gendarmes sont au service de tous les citoyens.' },
    { t: 'L\'impôt payé par tous', txt: 'Pour l\'entretien de la force publique, et pour les dépenses d\'administration, une contribution commune est indispensable : elle doit être également répartie entre tous les citoyens, en raison de leurs facultés.',
      ex: '<b>Tout le monde paie des impôts</b>, selon ses moyens : celui qui a plus paie plus. Fini les privilégiés qui ne payaient pas !', auj: 'Les impôts servent à payer les écoles, les hôpitaux, les routes…' },
    { t: 'Les citoyens décident de l\'impôt', txt: 'Tous les citoyens ont le droit de constater, par eux-mêmes ou par leurs représentants, la nécessité de la contribution publique, de la consentir librement, d\'en suivre l\'emploi, et d\'en déterminer la quotité, l\'assiette, le recouvrement et la durée.',
      ex: 'Les citoyens, par leurs députés, <b>décident des impôts</b> et vérifient comment l\'argent est dépensé.', auj: 'Chaque année, les députés votent le budget de l\'État.' },
    { t: 'Rendre des comptes', txt: 'La société a le droit de demander compte à tout agent public de son administration.',
      ex: 'Ceux qui travaillent pour l\'État doivent <b>rendre des comptes</b> aux citoyens sur ce qu\'ils font.', auj: 'Des juges vérifient comment l\'argent public est utilisé.' },
    { t: 'La séparation des pouvoirs', txt: 'Toute société dans laquelle la garantie des droits n\'est pas assurée, ni la séparation des pouvoirs déterminée, n\'a point de constitution.',
      ex: 'Pour que les droits soient protégés, les <b>pouvoirs doivent être séparés</b> : ceux qui font les lois, ceux qui les appliquent et ceux qui jugent ne sont pas les mêmes.', auj: 'C\'est l\'idée du philosophe Montesquieu : « le pouvoir arrête le pouvoir ».' },
    { t: 'Le droit de propriété', txt: 'La propriété étant un droit inviolable et sacré, nul ne peut en être privé, si ce n\'est lorsque la nécessité publique, légalement constatée, l\'exige évidemment, et sous la condition d\'une juste et préalable indemnité.',
      ex: 'Personne ne peut <b>te prendre ce qui t\'appartient</b>. Si l\'État en a vraiment besoin pour tous, il doit te payer un juste prix.', auj: 'Par exemple, pour construire une route sur un terrain, l\'État doit indemniser le propriétaire.' }
];
// Le jeu « Quel droit ? » : situation → numéro d'article (1 à 17)
const RVF_SITUATIONS = [
    { s: 'Tom veut écrire dans le journal de l\'école ce qu\'il pense de la cantine.', a: 11 },
    { s: 'Un homme est accusé d\'avoir volé un vélo. Tant que le juge n\'a rien prouvé, on doit le considérer comme innocent.', a: 9 },
    { s: 'Amina va à la mosquée, Lucas va au temple, Jade ne croit en aucun dieu : personne n\'a le droit de les embêter pour ça.', a: 10 },
    { s: 'Avant 1789, un noble ne payait pas la taille. Aujourd\'hui, chacun paie des impôts selon ses moyens.', a: 13 },
    { s: 'Max joue de la batterie à 2 heures du matin et réveille tout l\'immeuble. Sa liberté a des limites !', a: 4 },
    { s: 'La fille d\'un boulanger peut devenir juge ou ministre, si elle en a les capacités.', a: 6 },
    { s: 'Avant, le roi pouvait faire enfermer quelqu\'un sans jugement avec une lettre de cachet. Ce n\'est plus possible.', a: 7 },
    { s: 'La mairie veut construire une route sur le champ de M. Martin : elle doit lui payer un juste prix.', a: 17 },
    { s: 'Les députés votent le budget de l\'État et contrôlent comment l\'argent est dépensé.', a: 14 },
    { s: 'Le pouvoir n\'appartient plus au roi seul, mais à l\'ensemble des citoyens.', a: 3 },
    { s: 'Un enfant de paysan et un enfant de noble naissent avec exactement les mêmes droits.', a: 1 },
    { s: 'Ceux qui font les lois, ceux qui les appliquent et ceux qui jugent ne doivent pas être les mêmes personnes.', a: 16 }
];

// =========================================================================
//  DESSIN DES PERSONNAGES (pieds en x, y ; hauteur s)
// =========================================================================
function _rvfFig(ctx, type, x, y, s, opt) {
    opt = opt || {};
    const u = s / 100, SK = '#f1c9a5';
    const rect = (x0, y0, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + x0 * u, y + y0 * u, w * u, h * u); };
    const poly = (pts, c) => { ctx.fillStyle = c; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(x + p[0] * u, y + p[1] * u) : ctx.moveTo(x + p[0] * u, y + p[1] * u)); ctx.closePath(); ctx.fill(); };
    const circ = (cx, cy, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + cx * u, y + cy * u, r * u, 0, 2 * Math.PI); ctx.fill(); };
    const line = (x1, y1, x2, y2, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + x1 * u, y + y1 * u); ctx.lineTo(x + x2 * u, y + y2 * u); ctx.stroke(); };
    const legs = (c, shoe) => { rect(-8, -36, 6.5, 33, c); rect(1.5, -36, 6.5, 33, c); circ(-5, -2, 4.5, shoe || '#2b2118'); circ(5, -2, 4.5, shoe || '#2b2118'); };
    const coat = (c, bottom) => poly([[-13, -80], [13, -80], [16, bottom], [-16, bottom]], c);
    const robe = (c) => poly([[-12, -80], [12, -80], [20, 0], [-20, 0]], c);
    const arms = (c, l, r) => { line(-12, -76, l[0], l[1], c, 6); line(12, -76, r[0], r[1], c, 6); circ(l[0], l[1], 3.5, SK); circ(r[0], r[1], 3.5, SK); };
    const head = () => { rect(-3.5, -86, 7, 7, SK); circ(0, -92, 9.5, SK); circ(-3.2, -93, 1.1, '#2b2118'); circ(3.2, -93, 1.1, '#2b2118'); };
    const wig = () => { circ(-9, -90, 4.5, '#f5f5f4'); circ(9, -90, 4.5, '#f5f5f4'); poly([[-10, -96], [10, -96], [8, -103], [-8, -103]], '#f5f5f4'); };
    switch (type) {
        case 'roi':
            robe('#1e3a8a');
            for (let k = 0; k < 7; k++) circ(-10 + (k % 3) * 9 + (k > 2 ? 4 : 0), -60 + Math.floor(k / 3) * 18, 1.8, '#facc15');
            poly([[-17, -80], [17, -80], [14, -66], [-14, -66]], '#fafaf9');
            for (let k = 0; k < 5; k++) circ(-12 + k * 6, -72, 0.9, '#111');
            arms('#1e3a8a', [-16, -52], [18, -56]);
            line(19, -54, 24, -104, '#d4a017', 2.4); circ(24, -106, 3.2, '#d4a017');
            head(); wig();
            poly([[-9, -100], [-9, -108], [-5, -104], [0, -111], [5, -104], [9, -108], [9, -100]], '#d4a017');
            break;
        case 'eveque':
            robe('#6b21a8'); poly([[-13, -80], [13, -80], [15, -42], [-15, -42]], '#f8fafc');
            arms('#f8fafc', [-18, -50], [16, -54]);
            line(-19, 0, -19, -108, '#d4a017', 2.4);
            ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 2.4 * u; ctx.beginPath(); ctx.arc(x - 15 * u, y - 108 * u, 4 * u, Math.PI, 0.2 * Math.PI); ctx.stroke();
            head();
            poly([[-9, -100], [9, -100], [6, -114], [0, -122], [-6, -114]], '#f8fafc');
            line(0, -101, 0, -120, '#d4a017', 1.6); line(-8, -101, 8, -101, '#d4a017', 1.6);
            break;
        case 'cure':
            robe('#1f2937'); rect(-3, -81, 6, 4, '#f8fafc');
            arms('#1f2937', [-14, -48], [14, -48]);
            rect(-5, -58, 10, 12, '#7f1d1d');                          // livre
            head();
            ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.ellipse(x, y - 100 * u, 15 * u, 3.2 * u, 0, 0, 2 * Math.PI); ctx.fill();
            circ(0, -103, 7, '#111827');
            break;
        case 'noble':
            legs('#f8fafc', '#111'); coat('#1d4ed8', -30); rect(-3, -80, 6, 46, '#e5e7eb');
            for (let k = 0; k < 4; k++) circ(4.5, -74 + k * 10, 1.3, '#facc15');
            line(10, -40, 26, -8, '#9ca3af', 2.2); line(8, -42, 14, -38, '#d4a017', 2.6);   // épée
            arms('#1d4ed8', [-17, -48], [17, -48]);
            head(); wig();
            poly([[-14, -100], [14, -100], [0, -110]], '#111827');
            break;
        case 'dame':
            poly([[-8, -62], [8, -62], [30, 0], [-30, 0]], '#f472b6');
            poly([[-10, -80], [10, -80], [8, -60], [-8, -60]], '#ec4899');
            for (let k = 0; k < 3; k++) line(-24 + k * 24, -6, -6 + k * 6, -58, 'rgba(255,255,255,.35)', 1.5);
            arms('#f9a8d4', [-16, -54], [16, -60]);
            poly([[16, -60], [26, -68], [24, -56]], '#fde68a');            // éventail
            head();
            ctx.fillStyle = '#f5f5f4'; ctx.beginPath(); ctx.ellipse(x, y - 108 * u, 10 * u, 15 * u, 0, 0, 2 * Math.PI); ctx.fill();
            circ(6, -116, 3, '#f472b6');
            break;
        case 'paysan':
            legs('#78716c'); coat('#8b5a2b', -32); rect(-3, -80, 6, 10, '#e7d7b8');
            arms('#8b5a2b', [-15, -46], [18, -50]);
            line(20, 2, 22, -112, '#7c4a1e', 2.6);
            line(16, -112, 28, -112, '#6b7280', 1.6); for (const d of [16, 22, 28]) line(d, -112, d, -121, '#6b7280', 1.4);
            head();
            ctx.fillStyle = '#e4c26a'; ctx.beginPath(); ctx.ellipse(x, y - 100 * u, 16 * u, 3.5 * u, 0, 0, 2 * Math.PI); ctx.fill();
            poly([[-8, -100], [8, -100], [6, -108], [-6, -108]], '#e4c26a');
            break;
        case 'paysanne':
            poly([[-12, -60], [12, -60], [19, 0], [-19, 0]], '#b91c1c');
            poly([[-8, -58], [8, -58], [11, -14], [-11, -14]], '#fafaf9');
            poly([[-11, -80], [11, -80], [10, -58], [-10, -58]], '#57534e');
            arms('#57534e', [-16, -50], [17, -46]);
            ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(x + 21 * u, y - 46 * u, 6 * u, Math.PI, 0); ctx.stroke();
            rect(13, -46, 16, 9, '#a16207');
            head();
            ctx.fillStyle = '#fafaf9'; ctx.beginPath(); ctx.arc(x, y - 95 * u, 11 * u, Math.PI, 0); ctx.fill();
            break;
        case 'artisan':
            legs('#44403c'); coat('#e7e5e4', -32); poly([[-10, -70], [10, -70], [12, -30], [-12, -30]], '#78350f');
            arms('#e7e5e4', [-15, -48], [17, -54]);
            line(17, -54, 21, -72, '#7c4a1e', 2.4); rect(16, -78, 10, 5, '#6b7280');
            head(); poly([[-9, -98], [9, -98], [7, -104], [-7, -104]], '#7f1d1d');
            break;
        case 'boulanger':
            legs('#e7e5e4'); coat('#fafaf9', -32); rect(-12, -50, 24, 18, '#f5f5f4');
            arms('#fafaf9', [-14, -50], [14, -52]);
            ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.ellipse(x + 2 * u, y - 52 * u, 15 * u, 4.5 * u, -0.25, 0, 2 * Math.PI); ctx.fill();
            head(); circ(0, -104, 9, '#fafaf9'); rect(-9, -103, 18, 4, '#fafaf9');
            break;
        case 'bourgeois':
            legs('#1f2937', '#111'); coat('#14532d', -28); rect(-3, -80, 6, 44, '#e5e7eb');
            arms('#14532d', [-16, -50], [16, -50]);
            rect(13, -58, 9, 12, '#7c2d12');
            head(); circ(-8, -95, 4, '#6b4423'); circ(8, -95, 4, '#6b4423');
            poly([[-14, -99], [14, -99], [0, -109]], '#111827');
            break;
    }
    if (opt.cocarde) {
        for (const [r, c] of [[5, '#1f3f99'], [3.4, '#ffffff'], [1.8, '#e1262d']]) circ(-6, -70, r, c);
    }
}

// ── Création du widget ────────────────────────────────────────────────────
function createRevolutionFrancaiseWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 100, y: 80 };

    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 680;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;
    const _minH = () => window._wfIsPhone() ? 300 : 480;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'histoire-revolution';
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
    container.className = 'rvf-container';
    container.dataset.mode = 'ordres';
    container.dataset.stage = 'ordres';
    container.dataset.dmode = 'lire';
    let contW = _phone ? Math.max(260, window.innerWidth - 54)
                       : Math.max(860, Math.min(1260, Math.round(window.innerWidth * 0.74)));
    let contH = _phone ? Math.max(320, Math.min(window.innerHeight - 70, Math.round(contW * 1.7)))
                       : Math.max(600, Math.round(contW * 0.64));

    const header = document.createElement('div');
    header.className = 'rvf-header';
    header.innerHTML = `
        <span class="rvf-title">🇫🇷<span> La Révolution française</span></span>
        <div class="rvf-tabs">
            <button class="rvf-tab on" data-mode="ordres" title="La société d'ordres et sa fin"><span class="rvf-tab-long">⚖️ Les trois ordres</span><span class="rvf-tab-short">⚖️ Ordres</span></button>
            <button class="rvf-tab" data-mode="dates" title="Les grandes dates de la Révolution"><span class="rvf-tab-long">📅 Les grandes dates</span><span class="rvf-tab-short">📅 Dates</span></button>
            <button class="rvf-tab" data-mode="ddhc" title="La Déclaration des droits de l'homme et du citoyen"><span class="rvf-tab-long">📜 La Déclaration des droits</span><span class="rvf-tab-short">📜 Droits</span></button>
        </div>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);
    const helpBtn = document.createElement('button');
    helpBtn.className = 'rvf-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);
    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.rvf-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    const row1 = document.createElement('div');
    row1.className = 'rvf-row';
    row1.innerHTML = `
        ${Object.keys(RVF_STAGES).map(k => `<button class="rvf-btn rvf-btn-stage rvf-only-ordres" data-stage="${k}" style="--st-c:${RVF_STAGES[k].color}" title="${RVF_STAGES[k].name}">${RVF_STAGES[k].ico} ${RVF_STAGES[k].name}</button>`).join('')}
        <span class="rvf-sep rvf-only-ordres"></span>
        <button class="rvf-btn rvf-tax rvf-only-ordres rvf-only-st-ordres" title="Qui paie les impôts, et à qui ?">💰 Les impôts</button>
        <button class="rvf-btn rvf-pop rvf-only-ordres rvf-only-st-ordres" title="Combien y a-t-il de personnes dans chaque ordre ?">👥 La population</button>
        <button class="rvf-btn rvf-vote rvf-only-ordres rvf-only-st-etats" data-vote="ordre" title="Chaque ordre a une voix">🗳️ Vote par ordre</button>
        <button class="rvf-btn rvf-vote rvf-only-ordres rvf-only-st-etats" data-vote="tete" title="Chaque député a une voix">🙋 Vote par tête</button>

        <button class="rvf-btn rvf-prev rvf-only-dates" title="Événement précédent">◀ Précédent</button>
        <button class="rvf-btn rvf-next rvf-only-dates" title="Événement suivant">Suivant ▶</button>
        <button class="rvf-btn rvf-btn-play rvf-only-dates" title="Présenter les événements l'un après l'autre">▶ Raconter</button>
        <span class="rvf-sep rvf-only-dates"></span>
        <span class="rvf-only-dates" style="font-size:12px;font-weight:800;color:#6b7280">🔍 Zoom :</span>
        ${Object.keys(RVF_ZOOMS).map(k => `<button class="rvf-btn rvf-zoom rvf-only-dates" data-zoom="${k}" title="Zoomer sur ${RVF_ZOOMS[k].name}">${RVF_ZOOMS[k].name}</button>`).join('')}

        <button class="rvf-btn rvf-dm rvf-only-ddhc" data-dmode="lire" title="Lire la Déclaration">📜 Lire la Déclaration</button>
        <button class="rvf-btn rvf-dm rvf-only-ddhc" data-dmode="jeu" title="Retrouver l'article qui correspond à une situation">🧩 Jeu : quel droit ?</button>
        <span class="rvf-score rvf-only-ddhc rvf-only-jeu"></span>
    `;
    container.appendChild(row1);

    const body = document.createElement('div');
    body.className = 'rvf-body';
    const sceneWrap = document.createElement('div');
    sceneWrap.className = 'rvf-scene-wrap';
    const canvas = document.createElement('canvas');
    canvas.className = 'rvf-canvas';
    const doc = document.createElement('div');
    doc.className = 'rvf-doc';
    sceneWrap.appendChild(canvas);
    sceneWrap.appendChild(doc);
    const side = document.createElement('div');
    side.className = 'rvf-side';
    body.appendChild(sceneWrap);
    body.appendChild(side);
    container.appendChild(body);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'rvf-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La Révolution française</h4>
        <p><b>⚖️ Les trois ordres</b> : trois moments. <b>🏰 1788</b> : touche un étage de la pyramide (le roi, le clergé,
        la noblesse, le tiers état) ; <b>💰 Les impôts</b> montre qui paie et à qui, <b>👥 La population</b> combien ils sont.
        <b>🗳️ Mai 1789</b> : compare le vote par ordre et le vote par tête aux États généraux.
        <b>⚖️ 4 août 1789</b> : la pyramide s'effondre, tous deviennent égaux en droits.</p>
        <p><b>📅 Les grandes dates</b> : touche un événement de la frise pour lire sa fiche. <b>🔍 Zoom</b> (ou touche une
        période de la frise) agrandit une période : 1789 est alors détaillée mois par mois. <b>▶ Raconter</b> présente les
        événements l'un après l'autre.</p>
        <p><b>📜 La Déclaration des droits</b> : touche un article pour l'expliquer simplement. <b>🧩 Jeu</b> : retrouve
        quel article protège chaque situation.</p>
    `;
    container.appendChild(helpPopup);
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'rvf-resize-handle';
    resizeHandle.title = 'Redimensionner';
    container.appendChild(resizeHandle);

    const ctx = canvas.getContext('2d');
    const $ = sel => container.querySelector(sel);
    const taxBtn = $('.rvf-tax'), popBtn = $('.rvf-pop'), playBtn = $('.rvf-btn-play'), scoreEl = $('.rvf-score');

    // ── État ──────────────────────────────────────────────────────────────
    let mode = 'ordres', stage = 'ordres', selOrdre = null, showTax = false, showPop = false, vote = 'ordre';
    let collapseT = 1;                     // 0 → 1 : animation du 4 août
    let selEv = -1, playing = false, playT = 0, panX = 0;
    let zoom = 'all', viewA = RVF_Y0, viewB = RVF_Y1, zoomFrom = null, zoomT = 1, bandHits = [];
    let dmode = 'lire', selArt = -1, game = null;
    let animId = null, lastT = 0, drawPending = false, time = 0;
    let cssW = 0, cssH = 0, dpr = 1, S = 1, OX = 0, OY = 0;
    let hits = [];

    function syncSize() {
        const W = sceneWrap.clientWidth, H = sceneWrap.clientHeight;
        if (W <= 0 || H <= 0) return false;
        const r = Math.min(window.devicePixelRatio || 1, 3);
        cssW = W; cssH = H; dpr = r;
        const pw = Math.round(W * r), ph = Math.round(H * r);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
        S = Math.min(W / 1000, H / 620); OX = (W - 1000 * S) / 2; OY = (H - 620 * S) / 2;
        return true;
    }
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    }
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };
    const scene = () => ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * OX, dpr * OY);
    const screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
    function txt(t, x, y, font, color, align, base) {
        ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'middle'; ctx.fillText(t, x, y);
    }

    // =====================================================================
    //  ONGLET 1 : LES TROIS ORDRES (coordonnées 1000 × 620)
    // =====================================================================
    const LEVELS = [
        { id: 'roi', y0: 40, y1: 150, h0: 0, h1: 95 },
        { id: 'clerge', y0: 156, y1: 266, h0: 98, h1: 170 },
        { id: 'noblesse', y0: 272, y1: 382, h0: 173, h1: 245 },
        { id: 'tiers', y0: 388, y1: 566, h0: 248, h1: 360 }
    ];
    // personnages : position dans la pyramide, puis sur la ligne des citoyens égaux
    const PEOPLE = [
        { t: 'roi', lv: 'roi', x: 500, y: 148, s: 74 },
        { t: 'eveque', lv: 'clerge', x: 455, y: 262, s: 76 },
        { t: 'cure', lv: 'clerge', x: 545, y: 262, s: 76 },
        { t: 'noble', lv: 'noblesse', x: 445, y: 378, s: 78 },
        { t: 'dame', lv: 'noblesse', x: 560, y: 378, s: 78 },
        { t: 'paysan', lv: 'tiers', x: 255, y: 560, s: 92 },
        { t: 'paysanne', lv: 'tiers', x: 378, y: 560, s: 92 },
        { t: 'artisan', lv: 'tiers', x: 500, y: 560, s: 92 },
        { t: 'boulanger', lv: 'tiers', x: 622, y: 560, s: 92 },
        { t: 'bourgeois', lv: 'tiers', x: 745, y: 560, s: 92 }
    ];
    const ROW = ['paysan', 'dame', 'artisan', 'cure', 'paysanne', 'noble', 'boulanger', 'eveque', 'bourgeois'];
    function trap(L) {
        return [[500 - L.h0, L.y0], [500 + L.h0, L.y0], [500 + L.h1, L.y1], [500 - L.h1, L.y1]];
    }
    function drawPyramid(alphaK) {
        const k = 1 - collapseT;              // pendant l'effondrement : les étages tombent
        LEVELS.forEach((L, i) => {
            const O = RVF_ORDRES[L.id];
            const pts = trap(L);
            ctx.save();
            if (stage === 'egaux') {
                const t = ease((collapseT - i * 0.06) / 0.55);
                ctx.globalAlpha = Math.max(0, 1 - t);
                ctx.translate(500, (L.y0 + L.y1) / 2);
                ctx.rotate((i % 2 ? 1 : -1) * 0.25 * t);
                ctx.translate(-500, -(L.y0 + L.y1) / 2 + 420 * t * t);
            }
            ctx.beginPath(); pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
            const on = selOrdre === L.id;
            ctx.fillStyle = on ? O.light : O.light + 'cc'; ctx.fill();
            ctx.strokeStyle = O.color; ctx.lineWidth = on ? 5 : 2.5; ctx.stroke();
            // étiquettes de chaque côté
            if (stage === 'ordres') {
                const ly = (L.y0 + L.y1) / 2;
                const lx = 500 - (L.h0 + L.h1) / 2 - 18;
                txt(O.ico + ' ' + O.name.toUpperCase(), lx, ly - (O.sub ? 9 : 0), "900 19px 'Segoe UI', sans-serif", O.color, 'right');
                if (O.sub) txt(O.sub, lx, ly + 13, "italic 700 14px 'Segoe UI', sans-serif", O.color, 'right');
                if (O.pct && !showTax) {
                    const rx = 500 + (L.h0 + L.h1) / 2 + 18;
                    txt(O.pct, rx, ly - 8, "900 24px 'Segoe UI', sans-serif", O.color, 'left');
                    txt('de la population', rx, ly + 14, "700 12px 'Segoe UI', sans-serif", O.color, 'left');
                }
            }
            ctx.restore();
            void k; void alphaK;
        });
    }
    function drawCoinPath(p0, p1, p2, color, label, lx, ly) {
        ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -time * 30;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(p2[0], p2[1]); ctx.lineTo(p2[0] - 16 * Math.cos(ang - 0.45), p2[1] - 16 * Math.sin(ang - 0.45)); ctx.lineTo(p2[0] - 16 * Math.cos(ang + 0.45), p2[1] - 16 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
        for (let k = 0; k < 3; k++) {             // pièces qui montent
            const t = (time * 0.35 + k / 3) % 1, a = 1 - t;
            const x = a * a * p0[0] + 2 * a * t * p1[0] + t * t * p2[0], y = a * a * p0[1] + 2 * a * t * p1[1] + t * t * p2[1];
            ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, 8, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        }
        ctx.font = "800 14px 'Segoe UI', sans-serif";
        const w = ctx.measureText(label).width + 16;
        ctx.fillStyle = '#fff'; roundRect(lx - w / 2, ly - 13, w, 26, 8); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        txt(label, lx, ly + 1, "800 14px 'Segoe UI', sans-serif", color);
    }
    function drawOrdres() {
        ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-OX / S, -OY / S, cssW / S, cssH / S);
        drawPyramid();
        hits = LEVELS.map(L => ({ id: L.id, poly: trap(L) }));
        PEOPLE.forEach(p => _rvfFig(ctx, p.t, p.x, p.y, p.s));
        if (showTax) {
            drawCoinPath([800, 520], [1010, 250], [568, 96], '#b7791f', 'Taille, gabelle → au roi', 880, 150);
            drawCoinPath([760, 500], [905, 330], [655, 212], '#7e22ce', 'Dîme → au clergé', 850, 262);
            drawCoinPath([720, 488], [790, 420], [735, 330], '#1d4ed8', 'Droits seigneuriaux, corvée → au seigneur', 800, 372);
            ctx.font = "900 15px 'Segoe UI', sans-serif";
            const tagx = (t, x, y, c) => { const w = ctx.measureText(t).width + 16; ctx.fillStyle = c; roundRect(x - w / 2, y - 13, w, 26, 13); ctx.fill(); txt(t, x, y + 1, "900 15px 'Segoe UI', sans-serif", '#fff'); };
            tagx('Exemptés de taille ✋', 500, 170, '#7e22ce');
            tagx('Exemptés de taille ✋', 500, 287, '#1d4ed8');
            tagx('Paie tous les impôts 😓', 500, 404, '#a16207');
        }
        if (showPop) {
            const x0 = 10, y0 = 14, w = 285, h = 156;
            ctx.fillStyle = 'rgba(255,255,255,0.96)'; roundRect(x0, y0, w, h, 12); ctx.fill();
            ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2; ctx.stroke();
            txt('Sur 200 Français en 1789 :', x0 + w / 2, y0 + 16, "900 14px 'Segoe UI', sans-serif", '#374151');
            for (let i = 0; i < 200; i++) {
                const cx = x0 + 18 + (i % 25) * 10.4, cy = y0 + 36 + Math.floor(i / 25) * 10.5;
                ctx.fillStyle = i === 0 ? '#7e22ce' : i < 4 ? '#1d4ed8' : '#d29a4b';
                ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 2 * Math.PI); ctx.fill();
            }
            // légende : une pastille de couleur devant chaque groupe
            ctx.font = "800 12px 'Segoe UI', sans-serif";
            const leg = [['1 du clergé', '#7e22ce'], ['3 nobles', '#1d4ed8'], ['196 du tiers état', '#d29a4b']];
            const tw = leg.reduce((acc, l) => acc + 12 + ctx.measureText(l[0]).width + 12, -12);
            let lx = x0 + (w - tw) / 2;
            for (const [t, c] of leg) {
                ctx.fillStyle = c; ctx.beginPath(); ctx.arc(lx + 4.5, y0 + h - 16, 4.5, 0, 7); ctx.fill();
                txt(t, lx + 12, y0 + h - 15, "800 12px 'Segoe UI', sans-serif", '#374151', 'left');
                lx += 12 + ctx.measureText(t).width + 12;
            }
        }
    }
    function drawEtats() {
        ctx.fillStyle = '#efe6d2'; ctx.fillRect(-OX / S, -OY / S, cssW / S, cssH / S);
        // salle : colonnes et estrade royale
        ctx.fillStyle = '#e4d6b8'; for (let x = 40; x < 1000; x += 120) ctx.fillRect(x, 0, 26, 190);
        ctx.fillStyle = '#9f1239'; roundRect(420, 40, 160, 130, 10); ctx.fill();
        ctx.fillStyle = '#d4a017'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(440 + k * 24, 52, 4, 0, 7); ctx.fill(); }
        _rvfFig(ctx, 'roi', 500, 165, 82);
        txt('5 mai 1789 · Versailles', 500, 22, "italic 800 18px Georgia, serif", '#7c2d12');
        const blocks = [
            { id: 'clerge', n: 291, x: 40, w: 270, cols: 26, color: '#7e22ce', name: 'Clergé' },
            { id: 'noblesse', n: 270, x: 330, w: 250, cols: 24, color: '#1d4ed8', name: 'Noblesse' },
            { id: 'tiers', n: 578, x: 600, w: 370, cols: 37, color: '#a16207', name: 'Tiers état' }
        ];
        hits = [];
        for (const b of blocks) {
            txt(`${b.name} : ${b.n} députés`, b.x + b.w / 2, 205, "900 17px 'Segoe UI', sans-serif", b.color);
            for (let i = 0; i < b.n; i++) {
                const cx = b.x + 5 + (i % b.cols) * 10, cy = 225 + Math.floor(i / b.cols) * 10;
                ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(cx, cy, 3.8, 0, 7); ctx.fill();
            }
            hits.push({ id: b.id, rect: [b.x, 195, b.w, 200] });
        }
        // résultat du vote
        const y0 = 420;
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(30, y0, 940, 185, 14); ctx.fill();
        ctx.strokeStyle = vote === 'ordre' ? '#7c2d12' : '#166534'; ctx.lineWidth = 3; ctx.stroke();
        txt('Question : « Faut-il que tout le monde paie l\'impôt ? »', 500, y0 + 22, "800 17px 'Segoe UI', sans-serif", '#374151');
        if (vote === 'ordre') {
            txt('🗳️ VOTE PAR ORDRE : chaque ordre a 1 voix', 500, y0 + 52, "900 19px 'Segoe UI', sans-serif", '#7c2d12');
            const urns = [['Clergé', 'NON', '#7e22ce'], ['Noblesse', 'NON', '#1d4ed8'], ['Tiers état', 'OUI', '#a16207']];
            urns.forEach((u2, i) => {
                const cx = 220 + i * 280;
                ctx.fillStyle = u2[2]; roundRect(cx - 70, y0 + 72, 140, 52, 10); ctx.fill();
                txt(`${u2[0]} : ${u2[1]}`, cx, y0 + 98, "900 17px 'Segoe UI', sans-serif", '#fff');
            });
            txt('➜ 2 voix contre 1 : les privilégiés gagnent toujours !', 500, y0 + 152, "900 20px 'Segoe UI', sans-serif", '#b91c1c');
        } else {
            txt('🙋 VOTE PAR TÊTE : chaque député a 1 voix', 500, y0 + 52, "900 19px 'Segoe UI', sans-serif", '#166534');
            const tot = 1139, bx = 90, bw = 820;
            const w1 = bw * 578 / tot;
            ctx.fillStyle = '#a16207'; roundRect(bx, y0 + 74, w1, 46, 8); ctx.fill();
            ctx.fillStyle = '#6366f1'; roundRect(bx + w1 + 2, y0 + 74, bw - w1 - 2, 46, 8); ctx.fill();
            txt('Tiers état : 578', bx + w1 / 2, y0 + 97, "900 17px 'Segoe UI', sans-serif", '#fff');
            txt('Clergé + noblesse : 561', bx + w1 + (bw - w1) / 2, y0 + 97, "900 17px 'Segoe UI', sans-serif", '#fff');
            txt('➜ Le tiers état a plus de députés : avec l\'aide de quelques curés et nobles, il peut gagner !', 500, y0 + 152, "800 16px 'Segoe UI', sans-serif", '#166534');
        }
    }
    function drawEgaux() {
        ctx.fillStyle = '#f7f3ea'; ctx.fillRect(-OX / S, -OY / S, cssW / S, cssH / S);
        drawPyramid();
        const t = ease((collapseT - 0.3) / 0.7);
        // le roi s'éloigne en haut à droite
        const r = PEOPLE[0];
        ctx.globalAlpha = 1 - 0.4 * t;
        _rvfFig(ctx, 'roi', r.x + (905 - r.x) * t, r.y + (150 - r.y) * t, r.s * (1 - 0.25 * t));
        ctx.globalAlpha = 1;
        PEOPLE.slice(1).forEach(p => {
            const idx = ROW.indexOf(p.t), tx = 95 + idx * 101, ty = 470, ts = 96;
            const k = ease((collapseT - 0.25 - idx * 0.03) / 0.6);
            _rvfFig(ctx, p.t, p.x + (tx - p.x) * k, p.y + (ty - p.y) * k, p.s + (ts - p.s) * k, { cocarde: k > 0.95 });
        });
        if (t > 0) {
            ctx.globalAlpha = t;
            ctx.fillStyle = '#7c2d12'; ctx.fillRect(40, 474, 920, 6);
            ctx.fillStyle = 'rgba(255,255,255,0.95)'; roundRect(170, 20, 660, 66, 14); ctx.fill();
            ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 3; ctx.stroke();
            txt('Nuit du 4 août 1789 : abolition des privilèges', 500, 42, "900 22px 'Segoe UI', sans-serif", '#b91c1c');
            txt('La société d\'ordres disparaît : il n\'y a plus que des citoyens.', 500, 68, "700 16px 'Segoe UI', sans-serif", '#374151');
            txt('« Les hommes naissent et demeurent libres et égaux en droits. »', 500, 522, "italic 800 22px Georgia, serif", '#1e3a8a');
            txt('Article 1 de la Déclaration des droits de l\'homme et du citoyen (26 août 1789)', 500, 552, "700 14px 'Segoe UI', sans-serif", '#4b5563');
            txt('Le roi reste roi,', 905, 186, "800 13px 'Segoe UI', sans-serif", '#7c2d12');
            txt('mais doit obéir à la loi', 905, 202, "800 13px 'Segoe UI', sans-serif", '#7c2d12');
            ctx.globalAlpha = 1;
        }
        hits = [];
    }

    // =====================================================================
    //  ONGLET 2 : LA FRISE DES GRANDES DATES (coordonnées écran)
    // =====================================================================
    let cards = [];
    // Événements visibles dans un zoom, et disposition des cartes
    const zoomOf = y => ['z89', 'z90', 'z92', 'z95'].find(k => y >= RVF_ZOOMS[k].a && y <= RVF_ZOOMS[k].b) || 'all';
    const visible = z => RVF_EVENTS.map((e, i) => i).filter(i => RVF_EVENTS[i].y >= RVF_ZOOMS[z].a && RVF_EVENTS[i].y <= RVF_ZOOMS[z].b);
    function datesLayout() {
        const vis = visible(zoom), m = vis.length;
        const lanes = m <= 8 ? 2 : 4;
        const perLane = Math.ceil(m / lanes);
        const compact = (cssW - 30) / perLane < (lanes === 2 ? 120 : 110);
        const minCw = compact ? 62 : (lanes === 2 ? 150 : 116);
        const contentW = Math.max(cssW - 30, perLane * (minCw + 14));
        const cw = m <= 1 ? Math.min(240, contentW) : Math.min(lanes === 2 ? 240 : 170, (lanes * contentW - 10 * (m - 1)) / (m - 1 + lanes));
        const ch = compact ? 48 : lanes === 2 ? Math.max(64, Math.min(96, cssH * 0.17)) : Math.max(52, Math.min(70, cssH * 0.12));
        return { vis, m, lanes, compact, contentW, cw, ch };
    }
    const cardX = (k, m, L, Wd, cw) => m <= 1 ? L + Wd / 2 : L + cw / 2 + k * (Wd - cw) / (m - 1);
    function drawDates() {
        ctx.fillStyle = '#fbf7ef'; ctx.fillRect(0, 0, cssW, cssH);
        const Lay = datesLayout(), { vis, m, lanes, compact, contentW, cw, ch } = Lay;
        const maxPan = Math.max(0, contentW - (cssW - 30));
        panX = Math.max(0, Math.min(maxPan, panX));
        const L = 15 - panX, Wd = contentW;
        const X = yr => L + (yr - viewA) / (viewB - viewA) * Wd;
        const axisY = cssH * 0.5;
        const big = lanes === 2 && !compact;
        // périodes (découpées au bord de la vue)
        const bh = big ? 28 : 22;
        bandHits = [];
        ctx.save(); ctx.beginPath(); ctx.rect(8, 0, cssW - 16, cssH); ctx.clip();
        for (const p of RVF_PERIODS) {
            const a = Math.max(X(p.from), L - 4), b = Math.min(X(p.to), L + Wd + 4);
            if (b <= a + 1) continue;
            ctx.fillStyle = p.color; roundRect(a + 1, axisY - bh / 2, b - a - 2, bh, 6); ctx.fill();
            ctx.font = `800 ${compact ? 10 : big ? 14 : 12}px 'Segoe UI', sans-serif`;
            let t = p.name; if (ctx.measureText(t).width > b - a - 8) t = p.short || t;
            if (ctx.measureText(t).width < b - a - 6) txt(t, (a + b) / 2, axisY + 1, ctx.font, '#fff');
            bandHits.push({ x: a, y: axisY - bh / 2 - 6, w: b - a, h: bh + 12 });
        }
        const r0 = Math.max(viewA, 1792.722), r1 = Math.min(viewB, 1804.38);
        if (r1 > r0) {
            txt('Première République (1792 – 1804)', (X(r0) + X(r1)) / 2, axisY + bh / 2 + 12, `800 ${compact ? 10 : 12}px 'Segoe UI', sans-serif`, '#7c2d12');
            ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(X(r0), axisY + bh / 2 + 3); ctx.lineTo(X(r1), axisY + bh / 2 + 3); ctx.stroke();
        }
        // graduations : les mois quand on zoome sur une année, sinon les années
        const span = viewB - viewA;
        const tick = (x, major) => { ctx.strokeStyle = '#6b7280'; ctx.lineWidth = major ? 1.5 : 1; ctx.beginPath(); ctx.moveTo(x, axisY - bh / 2 - (major ? 8 : 5)); ctx.lineTo(x, axisY - bh / 2); ctx.stroke(); };
        const tf = `700 ${compact ? 9 : big ? 13 : 11}px 'Segoe UI', sans-serif`;
        if (span <= 1.3) {
            let first = true;
            for (let mo = Math.ceil(viewA * 12); mo <= Math.floor(viewB * 12); mo++) {
                const yr = mo / 12, x = X(yr), mi = ((mo % 12) + 12) % 12;
                tick(x, mi === 0);
                if (!compact || mi % 2 === 0) txt(RVF_MONTHS[mi] + (first || mi === 0 ? ' ' + Math.floor(yr + 1e-6) : ''), x, axisY - bh / 2 - 16, tf, '#4b5563');
                first = false;
            }
        } else {
            for (let yr = Math.ceil(viewA * 2) / 2; yr <= viewB; yr += 0.5) {
                const whole = Math.abs(yr - Math.round(yr)) < 1e-6;
                if (!whole && span > 5) continue;
                const x = X(yr);
                tick(x, whole);
                if (whole && (!compact || span < 5 || Math.round(yr) % 3 === 0)) txt(String(Math.round(yr)), x, axisY - bh / 2 - 16, tf, '#4b5563');
            }
        }
        ctx.restore();
        // cartes
        cards = [];
        const gapN = compact ? 26 : big ? 40 : 34;
        vis.forEach((i, k) => {
            const ev = RVF_EVENTS[i];
            const lane = k % lanes, above = lane % 2 === 0, far = lane >= 2;
            const cx = cardX(k, m, L, Wd, cw);
            const off = gapN + (far ? ch + 12 : 0) + ch / 2 + 14;
            const cy = above ? axisY - off : axisY + off + 10;
            const x = X(ev.y), on = selEv === i;
            ctx.strokeStyle = on ? '#b91c1c' : 'rgba(124,45,18,0.45)'; ctx.lineWidth = on ? 2.5 : 1.3;
            ctx.beginPath(); ctx.moveTo(x, axisY + (above ? -bh / 2 : bh / 2)); ctx.lineTo(cx, cy + (above ? ch / 2 : -ch / 2)); ctx.stroke();
            ctx.fillStyle = on ? '#b91c1c' : '#7c2d12'; ctx.beginPath(); ctx.arc(x, axisY + (above ? -bh / 2 : bh / 2), on ? 5.5 : 4, 0, 7); ctx.fill();
            const w = cw;
            ctx.fillStyle = on ? '#fff1f2' : '#ffffff'; roundRect(cx - w / 2, cy - ch / 2, w, ch, 10); ctx.fill();
            ctx.strokeStyle = on ? '#b91c1c' : '#d6c49d'; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
            if (compact) {
                txt(ev.ico, cx, cy - 8, '18px sans-serif', '#000');
                txt(zoom === 'all' ? ev.date.replace(/^.* (\d{4})$/, '$1') : ev.date.replace(/ \d{4}$/, '').replace('septembre', 'sept.').replace('octobre', 'oct.').replace('novembre', 'nov.').replace('décembre', 'déc.').replace('juillet', 'juil.').replace('janvier', 'janv.').replace('février', 'févr.'), cx, cy + 14, "800 10px 'Segoe UI', sans-serif", '#7c2d12');
            } else {
                const fs = big ? Math.max(12, Math.min(16, cw / 12)) : Math.max(10.5, Math.min(13, cw / 12));
                const icoS = big ? 28 : 20, pad = big ? 46 : 40;
                txt(ev.ico, cx - w / 2 + pad / 2 - 2, cy, `${icoS}px sans-serif`, '#000');
                let dfs = fs * 0.9;                                          // la date rétrécit si elle est trop longue
                ctx.font = `800 ${dfs}px 'Segoe UI', sans-serif`;
                const room = w - pad - 4, dw = ctx.measureText(ev.date).width;
                if (dw > room) { dfs = Math.max(8, dfs * room / dw); ctx.font = `800 ${dfs}px 'Segoe UI', sans-serif`; }
                txt(ev.date, cx + pad / 2 - 6, cy - ch / 2 + fs * (big ? 1.2 : 0.95), ctx.font, '#b45309');
                ctx.font = `900 ${fs}px 'Segoe UI', sans-serif`;
                const lines = wrapTxt(ev.short, w - pad - 6);
                lines.slice(0, 2).forEach((l, kk) => txt(l, cx + pad / 2 - 6, cy + (big ? 8 : 4) + kk * fs * 1.15 - (lines.length > 1 ? fs * 0.3 : -fs * 0.15), ctx.font, '#1f2937'));
            }
            cards.push({ i, x: cx - w / 2, y: cy - ch / 2, w, h: ch });
        });
        // indications
        const hf = "700 12px 'Segoe UI', sans-serif";
        if (zoom === 'all') txt('🔍 Touche une période de la frise pour zoomer', 14, 16, hf, '#9a3412', 'left');
        else txt(`🔍 Zoom : ${RVF_ZOOMS[zoom].name} · « 🌐 Tout » pour revenir`, 14, 16, hf, '#9a3412', 'left');
        if (maxPan > 0) txt('↔ Fais glisser la frise', cssW - 80, cssH - 12, "700 11px 'Segoe UI', sans-serif", '#9ca3af');
        return { maxPan, X };
    }
    function wrapTxt(t, maxW) {
        const words = t.split(' '), lines = [];
        let cur = '';
        for (const w of words) { const tt = cur ? cur + ' ' + w : w; if (ctx.measureText(tt).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
        if (cur) lines.push(cur);
        return lines;
    }
    function ensureVisible(i) {
        if (i < 0 || !cssW) return;
        const Lay = datesLayout(), k = Lay.vis.indexOf(i);
        if (k < 0) return;
        const cx = cardX(k, Lay.m, 0, Lay.contentW, Lay.cw);
        panX = Math.max(0, Math.min(Lay.contentW - (cssW - 30), cx - (cssW - 30) / 2));
    }
    // Zoom animé de la frise
    function setZoom(z, instant) {
        zoom = RVF_ZOOMS[z] ? z : 'all';
        panX = 0;
        zoomFrom = { a: viewA, b: viewB }; zoomT = instant ? 1 : 0;
        if (instant) { viewA = RVF_ZOOMS[zoom].a; viewB = RVF_ZOOMS[zoom].b; }
        if (selEv >= 0) ensureVisible(selEv);
        refresh();
    }
    // Sélectionne un événement ; en mode zoom, change de période si besoin
    function selectEvent(i) {
        selEv = i;
        if (i >= 0 && zoom !== 'all' && !visible(zoom).includes(i)) setZoom(zoomOf(RVF_EVENTS[i].y));
        ensureVisible(i);
    }

    // =====================================================================
    //  ONGLET 3 : LA DÉCLARATION (HTML)
    // =====================================================================
    function renderDoc() {
        if (dmode === 'lire') {
            doc.innerHTML = `<div class="rvf-parch">
                <h3>Déclaration des droits de l'homme et du citoyen</h3>
                <p class="rvf-sub">votée par l'Assemblée nationale le 26 août 1789</p>
                <div class="rvf-tric"></div>
                <p class="rvf-pre">« Les représentants du peuple français, constitués en Assemblée nationale, considérant que l'ignorance, l'oubli ou le mépris des droits de l'homme sont les seules causes des malheurs publics et de la corruption des gouvernements, ont résolu d'exposer, dans une déclaration solennelle, les droits naturels, inaliénables et sacrés de l'homme… »</p>
                ${RVF_ARTS.map((a, i) => `<button class="rvf-art ${selArt === i ? 'on' : ''}" data-art="${i}"><b>Article ${i + 1}.</b><span class="rvf-tt">${a.t}</span><br>${a.txt}</button>`).join('')}
            </div>`;
            if (selArt >= 0) { const el = doc.querySelector(`.rvf-art[data-art="${selArt}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
        } else {
            if (!game) newGame();
            const g = game;
            if (g.done) {
                doc.innerHTML = `<div class="rvf-game"><div class="rvf-sit"><small>Résultat</small>🏆 ${g.score} / ${g.order.length} bonnes réponses !</div>
                    <button class="rvf-choice" data-action="regame">🔄 Rejouer</button></div>`;
            } else {
                const sit = RVF_SITUATIONS[g.order[g.i]];
                doc.innerHTML = `<div class="rvf-game">
                    <div class="rvf-sit"><small>Situation ${g.i + 1} sur ${g.order.length} · Quel article de la Déclaration protège ce droit ?</small>${sit.s}</div>
                    <div class="rvf-choices">${g.choices.map(a => {
                        const cls = g.answered ? (a === sit.a ? 'good' : a === g.pick ? 'wrong' : '') : '';
                        return `<button class="rvf-choice ${cls}" data-pick="${a}" ${g.answered ? 'disabled' : ''}>Article ${a} · ${RVF_ARTS[a - 1].t}</button>`;
                    }).join('')}</div>
                    ${g.answered ? `<div class="rvf-fb ${g.pick === sit.a ? 'ok' : 'ko'}">${g.pick === sit.a ? '✅ Bravo !' : `❌ Non : c'est l'article ${sit.a}.`}<q>Article ${sit.a} : ${RVF_ARTS[sit.a - 1].txt}</q></div>
                    <div style="margin-top:10px"><button class="rvf-choice" data-action="nextsit" style="text-align:center;background:#16a34a;color:#fff;border-color:#16a34a">${g.i + 1 < g.order.length ? 'Situation suivante ▶' : 'Voir le résultat 🏆'}</button></div>` : ''}
                </div>`;
            }
        }
    }
    function newGame() {
        const idx = RVF_SITUATIONS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 8);
        game = { order: idx, i: 0, score: 0, answered: false, pick: 0, choices: [], done: false };
        makeChoices();
    }
    function makeChoices() {
        const a = RVF_SITUATIONS[game.order[game.i]].a;
        const others = [];
        while (others.length < 2) { const k = 1 + Math.floor(Math.random() * 17); if (k !== a && !others.includes(k)) others.push(k); }
        game.choices = [a, ...others].sort(() => Math.random() - 0.5);
        game.answered = false; game.pick = 0;
    }

    // ── Dessin principal ──────────────────────────────────────────────────
    function draw() {
        if (mode === 'ddhc') { updateInfo(); return; }
        if (!syncSize()) return;
        screen(); ctx.clearRect(0, 0, cssW, cssH); ctx.setLineDash([]);
        if (mode === 'ordres') {
            scene();
            if (stage === 'ordres') drawOrdres(); else if (stage === 'etats') drawEtats(); else drawEgaux();
            screen();
        } else drawDates();
        updateInfo();
    }

    // ── Fiche latérale et boutons ─────────────────────────────────────────
    let lastInfoKey = '';
    function ordresList() {
        return `<ol class="rvf-list">${['roi', 'clerge', 'noblesse', 'tiers'].map(k => `<li><button data-ordre="${k}" class="${selOrdre === k ? 'on' : ''}" style="--st-c:${RVF_ORDRES[k].color}">${RVF_ORDRES[k].ico} ${RVF_ORDRES[k].name}${RVF_ORDRES[k].pct ? ` <span class="rvf-small">${RVF_ORDRES[k].pct}</span>` : ''}</button></li>`).join('')}</ol>`;
    }
    function updateInfo() {
        row1.querySelectorAll('.rvf-btn-stage').forEach(b => b.classList.toggle('on', b.dataset.stage === stage));
        taxBtn.classList.toggle('on', showTax); popBtn.classList.toggle('on', showPop);
        row1.querySelectorAll('.rvf-vote').forEach(b => b.classList.toggle('on', b.dataset.vote === vote));
        playBtn.classList.toggle('on', playing); playBtn.textContent = playing ? '⏸ Pause' : '▶ Raconter';
        row1.querySelectorAll('.rvf-dm').forEach(b => b.classList.toggle('on', b.dataset.dmode === dmode));
        row1.querySelectorAll('.rvf-zoom').forEach(b => b.classList.toggle('on', b.dataset.zoom === zoom));
        if (scoreEl) scoreEl.textContent = game ? `⭐ ${game.score} / ${game.order.length}` : '';
        container.dataset.stage = stage;
        container.dataset.dmode = dmode;
        const key = [mode, stage, selOrdre, vote, collapseT >= 1, selEv, dmode, selArt, game && [game.i, game.answered, game.done].join(',')].join('|');
        if (key === lastInfoKey) return;
        lastInfoKey = key;
        const scroll = side.scrollTop;
        if (mode === 'ordres') {
            if (stage === 'etats') {
                side.style.borderLeftColor = '#1e3a8a';
                side.innerHTML = `<h4>Mai – juin 1789</h4>
                    <div class="rvf-status" style="color:#1e3a8a">🗳️ Les États généraux</div>
                    <p class="rvf-date">📅 5 mai 1789, à Versailles</p>
                    <p class="rvf-text">Le royaume est ruiné. Louis XVI réunit les <b>États généraux</b> : <b>1 139 députés</b> élus par les trois ordres. Le tiers état a obtenu autant de députés que les deux autres ordres réunis.</p>
                    <div class="rvf-facts">
                        <div>🗳️ <b>Vote par ordre</b> : chaque ordre a <b>une seule voix</b>. Le clergé et la noblesse, d'accord pour garder leurs privilèges, gagnent toujours 2 contre 1.</div>
                        <div>🙋 <b>Vote par tête</b> : chaque député a une voix. Le tiers état, plus nombreux, peut alors l'emporter.</div>
                    </div>
                    <p class="rvf-box">Le roi refuse le vote par tête. Le <b>17 juin</b>, les députés du tiers état se proclament <b>Assemblée nationale</b>, et le <b>20 juin</b>, ils jurent de donner une constitution à la France : c'est le <b>serment du Jeu de paume</b>.</p>
                    <p class="rvf-know">💡 <b>Le savais-tu ?</b> Avant les États généraux, les Français ont écrit environ 60 000 <b>cahiers de doléances</b> pour dire ce qui n'allait pas.</p>
                    <button class="rvf-go" data-stage-go="egaux">⚖️ Suite : la nuit du 4 août 1789 ▶</button>`;
            } else if (stage === 'egaux') {
                side.style.borderLeftColor = '#b91c1c';
                side.innerHTML = `<h4>Été 1789</h4>
                    <div class="rvf-status" style="color:#b91c1c">⚖️ La fin de la société d'ordres</div>
                    <p class="rvf-date">📅 Nuit du 4 août 1789</p>
                    <p class="rvf-text">Après la prise de la Bastille, des révoltes éclatent dans les campagnes. Pour ramener le calme, les députés votent l'<b>abolition des privilèges</b> : il n'y a plus de clergé, de noblesse ni de tiers état, seulement des <b>citoyens</b>.</p>
                    <div class="rvf-facts">
                        <div>💰 Tout le monde doit payer l'<b>impôt</b>, selon ses moyens.</div>
                        <div>🎓 Tous les emplois sont <b>ouverts à tous</b>, selon les talents.</div>
                        <div>⛪ La dîme est supprimée.</div>
                    </div>
                    <p class="rvf-quote">« Les hommes naissent et demeurent libres et égaux en droits. » (article 1, 26 août 1789)</p>
                    <p class="rvf-know">💡 <b>Mais…</b> les femmes n'ont pas les mêmes droits que les hommes, et le roi reste au pouvoir. Il faudra attendre la République, en 1792.</p>
                    <button class="rvf-go" data-action="replay">🔁 Revoir l'effondrement</button>
                    <button class="rvf-go" data-go-tab="ddhc">📜 Lire la Déclaration des droits ▶</button>`;
            } else if (selOrdre) {
                const O = RVF_ORDRES[selOrdre];
                side.style.borderLeftColor = O.color;
                side.innerHTML = `<h4>La société d'ordres (1788)</h4>
                    <div class="rvf-status" style="color:${O.color}">${O.ico} ${O.name}</div>
                    ${O.pct ? `<p class="rvf-date">👥 ${O.pct} de la population · ${O.sub}</p>` : ''}
                    <p class="rvf-text">${O.text}</p>
                    ${O.priv ? `<p class="rvf-box">${selOrdre === 'tiers' ? '😓' : '⭐'} <b>${selOrdre === 'tiers' ? 'Ses charges' : 'Ses privilèges'}</b> : ${O.priv}</p>` : ''}
                    <p class="rvf-know">💡 <b>Le savais-tu ?</b> ${O.know}</p>
                    <button class="rvf-go" data-action="overview">🔙 Vue d'ensemble</button>
                    ${ordresList()}`;
            } else {
                side.style.borderLeftColor = '#7c2d12';
                side.innerHTML = `<h4>Avant la Révolution</h4>
                    <div class="rvf-status" style="color:#7c2d12">🏰 La société d'ordres</div>
                    <p class="rvf-text">En 1788, la France compte environ <b>28 millions d'habitants</b>, gouvernés par un roi tout-puissant. Comme au Moyen Âge, la société est divisée en <b>trois ordres</b> : ceux qui <b>prient</b>, ceux qui <b>combattent</b> et ceux qui <b>travaillent</b>.</p>
                    <p class="rvf-box">Les deux premiers ordres ont des <b>privilèges</b> : des droits que les autres n'ont pas. On appartient à un ordre surtout par sa <b>naissance</b>.</p>
                    ${ordresList()}
                    <div style="height:8px"></div>
                    <p class="rvf-know">💡 Touche <b>💰 Les impôts</b> et <b>👥 La population</b> pour comprendre pourquoi le tiers état est en colère !</p>
                    <button class="rvf-go" data-stage-go="etats">🗳️ Suite : les États généraux (mai 1789) ▶</button>`;
            }
        } else if (mode === 'dates') {
            if (selEv < 0) {
                side.style.borderLeftColor = '#7c2d12';
                side.innerHTML = `<h4>1789 – 1799</h4>
                    <div class="rvf-status" style="color:#7c2d12">📅 Les grandes dates</div>
                    <p class="rvf-text">En dix ans, la France passe de la <b>monarchie absolue</b> à la <b>monarchie constitutionnelle</b>, puis à la <b>République</b>. La Révolution s'achève quand Napoléon Bonaparte prend le pouvoir, en 1799.</p>
                    <p class="rvf-box">👆 Touche un événement de la frise, ou appuie sur <b>▶ Raconter</b>.</p>
                    <ol class="rvf-list">${RVF_EVENTS.map((e, i) => `<li><button data-ev="${i}" style="--st-c:#b45309">${e.ico} ${e.short} <span class="rvf-small">${e.date}</span></button></li>`).join('')}</ol>`;
            } else {
                const e = RVF_EVENTS[selEv];
                const per = RVF_PERIODS.find(p => e.y >= p.from && e.y < p.to);
                const lk = e.link && e.link.txt ? `<button class="rvf-go" data-link="${selEv}">${e.link.txt}</button>` : '';
                side.style.borderLeftColor = '#b45309';
                side.innerHTML = `<h4>Événement ${selEv + 1} sur ${RVF_EVENTS.length}${per ? ' · ' + per.name : ''}</h4>
                    <div class="rvf-status" style="color:#7c2d12">${e.ico} ${e.short}</div>
                    <p class="rvf-date">📅 ${e.date}</p>
                    <p class="rvf-text">${e.text}</p>
                    <p class="rvf-know">💡 <b>Le savais-tu ?</b> ${e.know}</p>
                    ${lk}
                    <button class="rvf-go" data-action="overview">🔙 Toutes les dates</button>`;
            }
        } else {
            if (dmode === 'jeu') {
                side.style.borderLeftColor = '#b45309';
                side.innerHTML = `<h4>Jeu</h4>
                    <div class="rvf-status" style="color:#b45309">🧩 Quel droit ?</div>
                    <p class="rvf-text">Lis la situation, puis choisis l'<b>article de la Déclaration</b> qui protège ce droit.</p>
                    <p class="rvf-box">⭐ Score : <b>${game ? game.score : 0}</b> / ${game ? game.order.length : 8}</p>
                    <p class="rvf-know">💡 Besoin d'aide ? Retourne dans <b>📜 Lire la Déclaration</b> pour relire les articles.</p>`;
            } else if (selArt < 0) {
                side.style.borderLeftColor = '#b45309';
                side.innerHTML = `<h4>26 août 1789</h4>
                    <div class="rvf-status" style="color:#7c2d12">📜 La Déclaration des droits de l'homme et du citoyen</div>
                    <p class="rvf-text">Votée par l'<b>Assemblée nationale</b>, elle compte <b>17 articles</b>. Elle s'inspire des philosophes des <b>Lumières</b> (Voltaire, Montesquieu, Rousseau) et de la Déclaration d'indépendance des États-Unis (1776).</p>
                    <p class="rvf-box">👆 Touche un article pour l'expliquer simplement.</p>
                    <p class="rvf-know">💡 <b>Ses limites :</b> les femmes en sont oubliées. En 1791, <b>Olympe de Gouges</b> écrit une <b>Déclaration des droits de la femme et de la citoyenne</b>. Et l'esclavage continue dans les colonies jusqu'en 1794.</p>
                    <p class="rvf-box">🇫🇷 Aujourd'hui encore, elle fait partie de notre <b>Constitution</b>.</p>`;
            } else {
                const a = RVF_ARTS[selArt];
                side.style.borderLeftColor = '#b45309';
                side.innerHTML = `<h4>Article ${selArt + 1} sur 17</h4>
                    <div class="rvf-status" style="color:#7c2d12">📜 ${a.t}</div>
                    <p class="rvf-text">🗣️ <b>En clair :</b> ${a.ex}</p>
                    <p class="rvf-box">🇫🇷 <b>Aujourd'hui :</b> ${a.auj}</p>
                    <button class="rvf-go" data-art-step="-1">◀ Article précédent</button>
                    <button class="rvf-go" data-art-step="1">Article suivant ▶</button>
                    <button class="rvf-go" data-action="overview">🔙 Présentation</button>`;
            }
        }
        side.scrollTop = scroll;
    }

    // ── Animation ─────────────────────────────────────────────────────────
    function needAnim() {
        return (mode === 'ordres' && ((stage === 'ordres' && showTax) || (stage === 'egaux' && collapseT < 1))) || (mode === 'dates' && (playing || zoomT < 1));
    }
    function loop(t) {
        if (!widget.isConnected) { animId = null; return; }
        const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
        lastT = t; time += dt;
        if (sceneWrap.clientWidth === 0) { animId = null; lastT = 0; return; }
        if (mode === 'ordres' && stage === 'egaux' && collapseT < 1) collapseT = Math.min(1, collapseT + dt / 3.2);
        if (mode === 'dates' && zoomT < 1) {
            zoomT = Math.min(1, zoomT + dt / 0.6);
            const k = ease(zoomT), Z = RVF_ZOOMS[zoom];
            viewA = zoomFrom.a + (Z.a - zoomFrom.a) * k; viewB = zoomFrom.b + (Z.b - zoomFrom.b) * k;
        }
        if (mode === 'dates' && playing) {
            playT += dt;
            if (playT > 7) { playT = 0; selectEvent((selEv + 1) % RVF_EVENTS.length); }
        }
        draw();
        if (needAnim()) animId = requestAnimationFrame(loop);
        else { animId = null; lastT = 0; }
    }
    function startLoop() { if (!animId) { lastT = 0; animId = requestAnimationFrame(loop); } }
    function refresh() {
        lastInfoKey = '';
        if (mode === 'ddhc') { renderDoc(); updateInfo(); return; }
        if (animId) return;
        if (needAnim()) startLoop();
        else if (!drawPending) { drawPending = true; requestAnimationFrame(() => { drawPending = false; draw(); }); }
    }
    function setStage(s, animate) {
        stage = RVF_STAGES[s] ? s : 'ordres';
        container.dataset.stage = stage;
        if (stage === 'egaux') collapseT = animate === false ? 1 : 0;
        refresh();
    }
    function setMode(md) {
        mode = ['ordres', 'dates', 'ddhc'].includes(md) ? md : 'ordres';
        container.dataset.mode = mode;
        header.querySelectorAll('.rvf-tab').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
        sceneWrap.classList.toggle('doc', mode === 'ddhc');
        if (mode !== 'dates') playing = false;
        side.scrollTop = 0;
        refresh();
    }

    // ── Interaction sur le dessin ─────────────────────────────────────────
    const TAP_TOL = 14;
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
        drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, moved: false };
        window.addEventListener('pointerup', onEnd, true);
        window.addEventListener('pointercancel', onEnd, true);
    });
    // Curseur du dessin : doigt au-dessus d'un élément touchable, main pour faire défiler
    let _cur = '';
    function setCursor(c) { if (c !== _cur) { _cur = c; canvas.style.setProperty('cursor', c, 'important'); } }
    function hoverCursor(e) {
        if (drag) { setCursor(drag.moved && mode === 'dates' ? 'grabbing' : _cur || 'default'); return; }
        const L = local(e), x = L.x, y = L.y;
        let hit = false;
        if (mode === 'ordres') {
            const dx = (x - OX) / S, dy = (y - OY) / S;
            if (stage === 'ordres') hit = hits.some(h => h.poly && inPoly(dx, dy, h.poly));
            else if (stage === 'etats') hit = hits.some(h => h.rect && dx >= h.rect[0] && dx <= h.rect[0] + h.rect[2] && dy >= h.rect[1] && dy <= h.rect[1] + h.rect[3]);
            else hit = collapseT >= 1;
            setCursor(hit ? 'pointer' : 'default');
        } else if (mode === 'dates') {
            hit = cards.some(c => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h)
               || (zoom === 'all' && bandHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h));
            setCursor(hit ? 'pointer' : 'grab');
        } else setCursor('default');
    }
    canvas.addEventListener('pointermove', hoverCursor);
    canvas.addEventListener('pointerup', hoverCursor);
    canvas.addEventListener('pointerleave', () => { if (!drag) setCursor('default'); });
    canvas.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        if (e.pointerType === 'mouse' && e.buttons === 0) { onEnd(e); return; }
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_TOL) { drag.moved = true; drag.lx = e.clientX; }
        if (drag.moved && mode === 'dates') { panX -= e.clientX - drag.lx; drag.lx = e.clientX; refresh(); }
    });
    function onEnd(e) {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        window.removeEventListener('pointerup', onEnd, true);
        window.removeEventListener('pointercancel', onEnd, true);
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
        if (e.type === 'pointercancel' || d.moved) return;
        const L = local(e); onTap(L.x, L.y);
    }
    function inPoly(x, y, P) {
        let ins = false;
        for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
            if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) ins = !ins;
        }
        return ins;
    }
    function onTap(x, y) {
        if (mode === 'ordres') {
            const dx = (x - OX) / S, dy = (y - OY) / S;
            if (stage === 'ordres') {
                const h = hits.find(hh => inPoly(dx, dy, hh.poly));
                selOrdre = h ? (selOrdre === h.id ? null : h.id) : null;
            } else if (stage === 'etats') {
                const h = hits.find(hh => dx >= hh.rect[0] && dx <= hh.rect[0] + hh.rect[2] && dy >= hh.rect[1] && dy <= hh.rect[1] + hh.rect[3]);
                if (h) { stage = 'ordres'; selOrdre = h.id; container.dataset.stage = 'ordres'; }
            } else if (collapseT >= 1) { collapseT = 0; }
            refresh(); save();
        } else if (mode === 'dates') {
            const c = cards.find(cc => x >= cc.x && x <= cc.x + cc.w && y >= cc.y && y <= cc.y + cc.h);
            if (c) { selEv = selEv === c.i ? -1 : c.i; playing = false; playT = 0; }
            else if (zoom === 'all' && bandHits.some(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)) {
                const Lay = datesLayout(), yr = viewA + (x - (15 - panX)) / Lay.contentW * (viewB - viewA);
                const z = zoomOf(yr) !== 'all' ? zoomOf(yr) : (yr < 1790.3 ? 'z89' : yr < 1792.6 ? 'z90' : yr < 1795.45 ? 'z92' : 'z95');
                setZoom(z);
            }
            refresh(); save();
        }
    }

    // ── Contrôles ─────────────────────────────────────────────────────────
    [row1, header].forEach(el => {
        el.addEventListener('pointerdown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('mousedown', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); });
        el.addEventListener('touchstart', e => { if (e.target.closest('button,input,select')) e.stopPropagation(); }, { passive: true });
    });
    [side, doc].forEach(el => {
        el.addEventListener('pointerdown', stop);
        el.addEventListener('mousedown', stop);
        el.addEventListener('touchstart', stop, { passive: true });
    });
    function onPanelClick(e) {
        const b = e.target.closest('button');
        if (!b || b.disabled) return;
        e.stopPropagation();
        if (b.dataset.ordre) { selOrdre = selOrdre === b.dataset.ordre ? null : b.dataset.ordre; }
        else if (b.dataset.stageGo) { setStage(b.dataset.stageGo); save(); return; }
        else if (b.dataset.goTab) { setMode(b.dataset.goTab); save(); return; }
        else if (b.dataset.action === 'overview') { selOrdre = null; selEv = -1; selArt = -1; playing = false; }
        else if (b.dataset.action === 'replay') { collapseT = 0; }
        else if (b.dataset.ev) { selectEvent(Number(b.dataset.ev)); playing = false; }
        else if (b.dataset.link) {
            const ln = RVF_EVENTS[Number(b.dataset.link)].link;
            setMode(ln.tab);
            if (ln.stage) setStage(ln.stage);
            save(); return;
        }
        else if (b.dataset.art) { const i = Number(b.dataset.art); selArt = selArt === i ? -1 : i; }
        else if (b.dataset.artStep) { selArt = Math.max(0, Math.min(16, selArt + Number(b.dataset.artStep))); }
        else if (b.dataset.pick) {
            const g = game, a = Number(b.dataset.pick);
            if (g.answered) return;
            g.answered = true; g.pick = a;
            if (a === RVF_SITUATIONS[g.order[g.i]].a) g.score++;
        }
        else if (b.dataset.action === 'nextsit') {
            if (game.i + 1 >= game.order.length) game.done = true;
            else { game.i++; makeChoices(); }
        }
        else if (b.dataset.action === 'regame') { newGame(); }
        refresh(); save();
    }
    side.addEventListener('click', onPanelClick);
    doc.addEventListener('click', onPanelClick);
    header.querySelectorAll('.rvf-tab').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setMode(b.dataset.mode); save(); }));
    row1.querySelectorAll('.rvf-btn-stage').forEach(b => b.addEventListener('click', () => { setStage(b.dataset.stage); save(); }));
    taxBtn.addEventListener('click', () => { showTax = !showTax; refresh(); save(); });
    popBtn.addEventListener('click', () => { showPop = !showPop; refresh(); save(); });
    row1.querySelectorAll('.rvf-vote').forEach(b => b.addEventListener('click', () => { vote = b.dataset.vote; refresh(); save(); }));
    $('.rvf-prev').addEventListener('click', () => { playing = false; selectEvent(selEv <= 0 ? RVF_EVENTS.length - 1 : selEv - 1); refresh(); save(); });
    $('.rvf-next').addEventListener('click', () => { playing = false; selectEvent((selEv + 1) % RVF_EVENTS.length); refresh(); save(); });
    playBtn.addEventListener('click', () => {
        playing = !playing; playT = 0;
        if (playing && selEv < 0) selectEvent(0);
        refresh();
    });
    row1.querySelectorAll('.rvf-zoom').forEach(b => b.addEventListener('click', () => { setZoom(b.dataset.zoom); save(); }));
    row1.querySelectorAll('.rvf-dm').forEach(b => b.addEventListener('click', () => { dmode = b.dataset.dmode; if (dmode === 'jeu' && !game) newGame(); doc.scrollTop = 0; refresh(); save(); }));

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
            refresh();
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
        playing = false;
        if (typeof window._wfMiniBarCollapse === 'function') {
            window._wfMiniBarCollapse(widget, '🇫🇷 La Révolution française', {
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
    setMode('ordres');

    // ── API pour save-load.js ─────────────────────────────────────────────
    // (le jeu « Quel droit ? » recommence au rechargement)
    widget._rvfGetData = () => ({
        containerW: contW, containerH: contH,
        mode, stage, selOrdre, showTax, showPop, vote, selEv, dmode, selArt, zoom
    });
    widget._rvfSetData = (d) => {
        if (!d) return;
        if (d.containerW) contW = _fitW(Math.max(_minW(), d.containerW));
        if (d.containerH) contH = Math.max(_minH(), _phone ? Math.min(d.containerH, window.innerHeight - 40) : d.containerH);
        applySize();
        selOrdre = RVF_ORDRES[d.selOrdre] ? d.selOrdre : null;
        showTax = !!d.showTax; showPop = !!d.showPop;
        vote = d.vote === 'tete' ? 'tete' : 'ordre';
        selEv = typeof d.selEv === 'number' ? Math.max(-1, Math.min(RVF_EVENTS.length - 1, d.selEv)) : -1;
        dmode = d.dmode === 'jeu' ? 'jeu' : 'lire';
        selArt = typeof d.selArt === 'number' ? Math.max(-1, Math.min(16, d.selArt)) : -1;
        game = null;
        stage = RVF_STAGES[d.stage] ? d.stage : 'ordres';
        collapseT = 1;
        setMode(d.mode || 'ordres');
        container.dataset.stage = stage;
        zoom = RVF_ZOOMS[d.zoom] ? d.zoom : 'all';
        viewA = RVF_ZOOMS[zoom].a; viewB = RVF_ZOOMS[zoom].b; zoomT = 1; panX = 0;
        if (selEv >= 0) requestAnimationFrame(() => { ensureVisible(selEv); refresh(); });
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Cycle de l'eau
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_rvfSetData');

    save();
    return widget;
}
