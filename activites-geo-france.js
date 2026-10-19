// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// open()   : bascule le plein écran du widget ; isOpen() : vrai s'il est en plein écran.
// setKey   : nom de la fonction de restauration (widget._xxSetData) : si le widget est
//            restauré depuis une sauvegarde, le plein écran automatique est annulé.
// launchOnly : n'ouvrir que si le widget vient d'être lancé depuis un panneau.
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

// ── Petit écran (téléphone) : même détection que ci-dessus ──
if (!window._wfIsPhone) {
    window._wfIsPhone = function () {
        if (typeof isMobileBoardMode === 'function') { try { if (isMobileBoardMode()) return true; } catch (e) {} }
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    };
}

// =========================================================================
// WIDGET GÉOGRAPHIE DE LA FRANCE — Le Bureau du Prof
// Carte de France interactive : 10 plus grandes villes, 4 grands fleuves
// (Seine, Loire, Garonne, Rhône), 5 massifs montagneux (Alpes, Pyrénées,
// Massif central, Jura, Vosges), pays frontaliers (en partie) et mers.
// Clic sur un élément : zoom sur l'élément + fiche d'information.
// Options : calques affichables, masquer les noms (mode devinette).
// Trois cartes au choix : France physique, régions (13), départements (96).
// Contours des régions et départements : IGN Admin Express (Licence ouverte),
// via le jeu de données france-geojson, simplifiés.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;

            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';

            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

            widget.style.top          = MARGIN_TOP + 'px';
            widget.style.left         = occupiedX + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.zIndex       = '9000';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.display      = 'block';
            widget.style.overflow     = 'hidden';
            widget.style.padding      = '0';

            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }

            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');

            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation();
                e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup', onUp);
            });

            const curW = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // Taille des pastilles réduire / plein écran / fermer.
    // Injecté à part, avec !important : s'applique même si un autre script
    // a déjà défini « wf-btns-style » avec l'ancienne taille.
    if (!document.getElementById('wf-btns-size')) {
        const wz = document.createElement('style');
        wz.id = 'wf-btns-size';
        wz.textContent = `
    .wf-btns { gap:8px !important; }
    .wf-btns .wf-btn { width:22px !important; height:22px !important;
        min-width:22px !important; min-height:22px !important; padding:0 !important; }
    .wf-btns:hover .wf-btn::after       { font-size:14px !important; }
    .wf-btns:hover .wf-btn-max::after   { font-size:12px !important; }
    .wf-btns:hover .wf-btn-close::after { font-size:17px !important; }
        `;
        document.head.appendChild(wz);
    }

    // CSS partagé boutons fenêtre (injecté une seule fois)
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .wf-btn { width:22px; height:22px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:14px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:12px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:17px; }
        `;
        document.head.appendChild(ws);
    }

    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="geo-france"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gf-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }

        /* En-tête */
        .gf-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .gf-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .gf-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e3f1fb;
            color: #1f5f8b;
        }

        /* Réduit / plein écran */
        .gf-container.wf-minimized > *:not(.gf-header) { display: none !important; }
        .gf-container.wf-minimized { gap: 0; }
        .gf-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        /* Plein écran : la carte et la fiche occupent exactement la hauteur restante (pas de défilement) */
        .gf-container.wf-fullboard > * { flex-shrink: 0; }
        .gf-container.wf-fullboard > .gf-body { flex: 1 1 0; min-height: 0; }
        .gf-container.wf-fullboard .gf-map-wrap { height: auto !important; }
        .gf-container.wf-fullboard .gf-map { position: absolute; inset: 0; }
        .gf-container.wf-fullboard .gf-side { max-height: 100%; }

        /* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gf-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .gf-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .gf-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: 1px solid #ddd;
            background: #f0f0f0;
            color: #333;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .gf-btn:hover { background: #e0e0e0; }
        .gf-btn:active { transform: scale(0.96); }
        .gf-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .gf-btn.on:hover { background: #357abd; }
        .gf-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .gf-btn-reveal:hover { background: #218838; }
        .gf-layers { display: flex; gap: 4px; margin-left: auto; align-items: center; flex-wrap: wrap; }
        .gf-layers-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .gf-layer-btn {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            color: #999;
            transition: background .15s;
        }
        .gf-layer-btn:hover { background: #e0e0e0; }
        .gf-layer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Corps : carte + fiche */
        .gf-body { display: flex; gap: 10px; align-items: stretch; }
        .gf-map-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border: 1px solid #c9dbe6;
            border-radius: 10px;
            overflow: hidden;
            background: #cfe6f3;
        }
        .gf-map { display: block; width: 100%; height: 100%; touch-action: none; }
        .gf-side {
            flex: 0 0 26%;
            min-width: 200px;
            max-width: 380px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 6px solid #9ca3af;
            border-radius: 10px;
            padding: 10px 12px;
            box-sizing: border-box;
            color: #374151;
            line-height: 1.45;
            overflow-y: auto;
        }
        .gf-side h4 { margin: 0 0 2px; font-weight: 900; }
        .gf-side .gf-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .gf-side p { margin: 0 0 6px; }
        .gf-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .gf-side li { margin-bottom: 4px; }
        .gf-side .gf-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .gf-side .gf-sw { width: 22px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .gf-side .gf-hint { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .gf-back-btn {
            margin-top: 6px;
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .gf-back-btn:hover { background: #f0f0f0; }

        /* Éléments de la carte */
        .gf-map text { font-family: 'Segoe UI', system-ui, sans-serif; paint-order: stroke; stroke-linejoin: round; }
        .gf-item { cursor: pointer; transition: opacity .25s; }
        .gf-has-sel .gf-item:not(.gf-sel) { opacity: .3; }
        .gf-has-sel .gf-country:not(.gf-sel),
        .gf-has-sel .gf-monaco:not(.gf-sel) { opacity: 1; fill: #eceee7; }
        .gf-country { fill: #e4e6dc; stroke: #ffffff; stroke-width: 1.2; }
        .gf-country:hover { fill: #d5dbc8; }
        .gf-country.gf-sel { fill: #cfe0b8; }
        .gf-other { fill: #ebece6; stroke: #ffffff; stroke-width: 1; }
        .gf-france { fill: #fdf6e1; stroke: #8a6d3b; stroke-width: 2; }
        .gf-massif { fill: url(#gf-hatch); stroke: #9a6a3a; stroke-width: 1; stroke-opacity: .55; }
        .gf-massif:hover, .gf-massif.gf-sel { stroke-width: 2.5; stroke-opacity: 1; }
        .gf-river { fill: none; stroke: #2b7bd0; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        .gf-river.gf-sel { stroke-width: 6; }
        .gf-river-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
        .gf-river-hit:hover + .gf-river { stroke-width: 5; }
        .gf-lake { fill: #9ccbe8; stroke: #2b7bd0; stroke-width: 1.5; }
        .gf-city { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gf-city.gf-sel { fill: #a51d1d; }
        .gf-capital { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gf-lbl-city    { fill: #1f2937; font-weight: 800; stroke: #ffffff; stroke-width: 4; }
        .gf-lbl-river   { fill: #1d5fa8; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .gf-lbl-massif  { fill: #7a4b1c; font-weight: 800; font-style: italic; stroke: #fdf6e1; stroke-width: 4; }
        .gf-lbl-country { fill: #6b7280; font-weight: 700; font-style: italic; stroke: #e4e6dc; stroke-width: 4; letter-spacing: 1px; }
        .gf-lbl-sea     { fill: #3b7fae; font-weight: 600; font-style: italic; stroke: #cfe6f3; stroke-width: 3; letter-spacing: 1px; }
        .gf-lbl.gf-hidden { fill: #d63384; font-style: normal; }
        .gf-monaco { fill: #e4e6dc; stroke: #6b7280; stroke-width: 1.5; }
        .gf-monaco.gf-sel { fill: #cfe0b8; }

        /* Choix de la carte (physique / régions / départements) */
        .gf-views { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
        .gf-view-btn {
            padding: 6px 14px;
            border-radius: 8px;
            border: 1px solid #cfd6e4;
            background: #f5f7fb;
            color: #4b5563;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .gf-view-btn:hover { background: #e6ebf5; }
        .gf-view-btn:active { transform: scale(0.96); }
        .gf-view-btn.active { background: #2f4f9e; color: #fff; border-color: #2f4f9e; }

        /* Visibilité selon la carte choisie */
        .gf-map:not(.gf-view-physique) .gf-V-phys,
        .gf-map:not(.gf-view-regions) .gf-V-reg,
        .gf-map:not(.gf-view-departements) .gf-V-dep,
        .gf-map.gf-view-physique .gf-V-adm { display: none; }

        /* Régions et départements */
        .gf-adm-gap { fill: #e4e6dc; stroke: none; pointer-events: none; }
        .gf-has-sel .gf-adm-gap { fill: #eceee7; }
        .gf-off-pays .gf-adm-gap { fill: #ebece6; }
        .gf-region, .gf-dep { fill-rule: evenodd; }
        .gf-region { stroke-width: 0.6; }
        .gf-dep { stroke: #ffffff; stroke-width: 0.9; }
        .gf-region:hover, .gf-dep:hover { filter: brightness(0.93); }
        .gf-dep.gf-sel { stroke: #1f2937; stroke-width: 2.5; }
        .gf-reg-outline { display: none; stroke: #1f2937; stroke-width: 3; }
        .gf-reg-outline.gf-sel { display: inline; }
        .gf-adm-line { fill: none; pointer-events: none; stroke-linejoin: round; stroke-linecap: round; }
        .gf-adm-depline  { stroke: #ffffff; stroke-width: 0.8; stroke-opacity: .9; }
        .gf-adm-regline  { stroke: #ffffff; stroke-width: 2.6; }
        .gf-adm-regline2 { stroke: #4b5563; stroke-width: 2; }
        .gf-adm-outer    { stroke: #8a6d3b; stroke-width: 1.6; }
        .gf-chef { fill: #1f2937; stroke: #ffffff; stroke-width: 1.6; }
        .gf-pref { fill: #374151; stroke: #ffffff; stroke-width: 1.2; }
        .gf-lbl-reg  { fill: #2d3748; font-weight: 900; stroke: rgba(255,255,255,0.85); stroke-width: 4; letter-spacing: 0.3px; }
        .gf-lbl-dep  { fill: #1f2937; font-weight: 800; stroke: rgba(255,255,255,0.85); stroke-width: 3; }
        .gf-lbl-chef { fill: #1f2937; font-weight: 700; stroke: #ffffff; stroke-width: 3; }
        .gf-lbl-pref { fill: #374151; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 3; }
        .gf-side .gf-reg-row {
            display: flex; align-items: center; gap: 8px; width: 100%;
            margin: 0 0 3px; padding: 3px 6px; border: none; border-radius: 6px;
            background: transparent; cursor: pointer; text-align: left;
            font: inherit; color: inherit;
        }
        .gf-side .gf-reg-row:hover { background: #eef1f6; }
        .gf-chips { display: flex; flex-wrap: wrap; gap: 4px; margin: 2px 0 8px; }
        .gf-chip {
            padding: 2px 7px; border-radius: 6px; border: 1px solid #d6dbe4;
            background: #fff; font: inherit; font-size: 0.85em; color: #374151; cursor: pointer;
        }
        .gf-chip:hover { background: #eef1f6; }
        .gf-link {
            padding: 0; border: none; background: none; font: inherit; font-weight: 700;
            color: #2f4f9e; text-decoration: underline; cursor: pointer;
        }

        /* Calques désactivés */
        .gf-off-rchefs .gf-L-rchefs,
        .gf-off-rdeps .gf-L-rdeps,
        .gf-off-prefs .gf-L-prefs,
        .gf-off-dreg .gf-L-dreg,
        .gf-off-villes .gf-L-villes,
        .gf-off-fleuves .gf-L-fleuves,
        .gf-off-massifs .gf-L-massifs,
        .gf-off-mers .gf-L-mers,
        .gf-off-pays .gf-L-pays { display: none; }
        .gf-off-pays .gf-country { fill: #ebece6; pointer-events: none; }

        /* Aide */
        .gf-help-btn {
            width: 22px; height: 22px;
            border-radius: 50%;
            border: 1px solid #bbb;
            background: #f5f5f5;
            color: #666;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .gf-help-btn:hover { background: #e0e0e0; color: #333; }
        .gf-help-popup {
            display: none;
            position: absolute;
            top: 36px;
            right: 10px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 310px;
            font-size: 11px;
            color: #444;
            z-index: 10;
            line-height: 1.5;
        }
        .gf-help-popup.show { display: block; }
        .gf-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .gf-help-popup p { margin: 0 0 6px; }
        .gf-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .gf-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .gf-container:hover .gf-resize-handle { opacity: 1; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .gf-title, .gf-badge { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .gf-container.wf-fullboard .gf-resize-handle { display: none; }
        .gf-tx-s { display: none; }
        @media (pointer: coarse) { .gf-resize-handle { opacity: .6; width: 24px; height: 24px; } }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gf-container { padding: 10px 10px 8px; gap: 7px; }
            .gf-container.wf-fullboard { overflow: hidden; }
            .gf-title { font-size: 12px; }
            .gf-controls, .gf-layers, .gf-views { gap: 4px; }
            .gf-layers { margin-left: 0; }
            .gf-layers-lbl { display: none; }
            .gf-btn, .gf-layer-btn, .gf-view-btn { min-height: 30px; padding: 4px 9px; font-size: 11px; touch-action: manipulation; }
            .gf-tx { display: none; }
            .gf-tx-s { display: inline; }
            .gf-help-btn { width: 26px; height: 26px; }
            .gf-help-popup { left: 10px; right: 10px; width: auto; max-height: 70vh; overflow-y: auto; }
            .gf-side { padding: 8px 10px; }
            .gf-back-btn { min-height: 32px; }
        }
        /* Téléphone tenu en portrait : la fiche passe sous la carte */
        @media (max-width: 768px) and (orientation: portrait) {
            .gf-body { flex-direction: column; }
            .gf-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 45vh; }
            .gf-container.wf-fullboard .gf-map-wrap { flex: 1 1 0; min-height: 180px; }
            .gf-container.wf-fullboard .gf-side { flex: 0 1 auto; max-height: 42%; }
        }
        /* Téléphone tenu en paysage : fiche plus étroite à droite */
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .gf-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Projection (longitude / latitude → coordonnées SVG) ───────────────────
const GF_LON0 = -5.6, GF_LON1 = 10.4, GF_LAT0 = 41.0, GF_LAT1 = 51.6;
const GF_K = 100, GF_COS = Math.cos(46.3 * Math.PI / 180);
const GF_W = (GF_LON1 - GF_LON0) * GF_COS * GF_K;
const GF_H = (GF_LAT1 - GF_LAT0) * GF_K;

function _gfP(lon, lat) { return [(lon - GF_LON0) * GF_COS * GF_K, (GF_LAT1 - lat) * GF_K]; }
function _gfPath(pts, closed) {
    return pts.map((p, i) => {
        const [x, y] = _gfP(p[0], p[1]);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + (closed ? ' Z' : '');
}
// Courbe lissée (Catmull-Rom) pour les fleuves
function _gfSmooth(pts) {
    const P = pts.map(p => _gfP(p[0], p[1]));
    let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ' C' + c1.map(v => v.toFixed(1)).join(' ') + ' ' + c2.map(v => v.toFixed(1)).join(' ') + ' ' + p2.map(v => v.toFixed(1)).join(' ');
    }
    return d;
}
const _gfRev = a => a.slice().reverse();

// ── Frontières (tracé simplifié) ──────────────────────────────────────────
const GF_B_BE = [[2.55,51.09],[2.65,50.95],[2.9,50.7],[3.15,50.78],[3.29,50.52],[3.65,50.45],[3.67,50.33],[4.03,50.36],[4.2,50.27],[4.15,50.0],[4.43,49.95],[4.82,50.15],[4.87,49.8],[5.1,49.77],[5.43,49.6],[5.82,49.55]];
const GF_B_LU = [[5.82,49.55],[6.1,49.46],[6.37,49.47]];
const GF_B_DE = [[6.37,49.47],[6.73,49.17],[7.1,49.15],[7.45,49.17],[7.65,49.05],[8.2,48.97],[7.95,48.6],[7.75,48.3],[7.62,48.0],[7.55,47.75],[7.59,47.58]];
const GF_B_CH = [[7.59,47.58],[7.3,47.45],[7.0,47.48],[6.95,47.25],[6.45,46.98],[6.1,46.6],[6.13,46.4],[5.97,46.2],[6.15,46.15],[6.17,46.27],[6.5,46.4],[6.8,46.39],[6.82,46.12],[7.05,45.92],[6.86,45.83]];
const GF_B_IT = [[6.86,45.83],[7.0,45.6],[7.13,45.45],[6.95,45.2],[6.65,45.1],[6.9,44.85],[6.9,44.65],[6.85,44.5],[7.0,44.25],[7.4,44.12],[7.7,44.06],[7.53,43.78]];
const GF_C_MED = [[7.53,43.78],[7.27,43.68],[7.0,43.54],[6.65,43.3],[6.2,43.08],[5.95,43.1],[5.6,43.18],[5.37,43.25],[5.0,43.4],[4.85,43.36],[4.6,43.4],[4.1,43.55],[3.7,43.4],[3.25,43.25],[3.05,42.95],[3.05,42.6],[3.17,42.43]];
const GF_B_ES = [[3.17,42.43],[2.9,42.42],[2.5,42.35],[2.0,42.4],[1.78,42.58],[1.6,42.65],[1.45,42.6],[1.0,42.75],[0.7,42.85],[0.0,42.7],[-0.5,42.8],[-1.0,43.02],[-1.4,43.05],[-1.78,43.37]];
const GF_C_ATL = [[-1.78,43.37],[-1.5,43.53],[-1.3,44.0],[-1.2,44.6],[-1.25,44.66],[-1.15,45.5],[-1.06,45.57],[-1.0,45.63],[-1.2,45.85],[-1.15,46.16],[-1.8,46.5],[-2.1,46.85],[-2.15,47.1],[-2.5,47.3],[-3.0,47.55],[-3.4,47.7],[-4.2,47.8],[-4.37,47.8],[-4.73,48.04],[-4.5,48.2],[-4.78,48.35],[-4.6,48.6],[-4.0,48.72],[-3.5,48.83],[-3.0,48.78],[-2.76,48.55],[-2.3,48.65],[-2.0,48.65],[-1.6,48.62],[-1.55,48.75],[-1.6,49.2],[-1.85,49.55],[-1.95,49.72],[-1.62,49.65],[-1.25,49.7],[-1.1,49.35],[-0.5,49.33],[0.1,49.45],[0.2,49.7],[1.0,49.92],[1.5,50.15],[1.58,50.5],[1.6,50.9],[1.85,50.96],[2.55,51.09]];

const GF_FRANCE  = [].concat(GF_B_BE, GF_B_LU, GF_B_DE, GF_B_CH, GF_B_IT, GF_C_MED, GF_B_ES, GF_C_ATL);
const GF_CORSICA = [[9.4,43.0],[9.47,42.8],[9.53,42.4],[9.4,42.0],[9.35,41.7],[9.2,41.38],[8.85,41.55],[8.62,41.9],[8.6,42.2],[8.7,42.57],[9.1,42.7],[9.3,42.95]];

const GF_SHAPES_OTHER = {
    paysbas:  [[3.37,51.37],[4.25,51.37],[5.0,51.45],[5.85,51.15],[5.75,51.0],[5.68,50.76],[6.02,50.76],[6.1,51.1],[6.2,51.4],[6.0,51.85],[6.8,51.95],[7.1,52.4],[4.4,52.4],[4.1,52.0],[3.6,51.6]],
    autriche: [[9.55,47.53],[9.9,47.55],[10.5,47.4],[11.3,47.5],[11.3,46.9],[10.45,46.9],[9.6,47.05]],
    sardaigne:[[8.2,40.4],[8.15,40.6],[8.25,40.95],[8.6,40.85],[9.2,41.25],[9.55,41.1],[9.7,40.8],[9.8,40.4]]
};

// ── Pays frontaliers ──────────────────────────────────────────────────────
const GF_COUNTRIES = [
    { id: 'belgique', name: 'Belgique', lbl: [4.55, 50.62], size: 1,
      shape: [].concat(GF_B_BE, [[5.9,49.75],[5.8,49.95],[6.1,50.15],[6.4,50.32],[6.05,50.72],[6.02,50.76],[5.68,50.76],[5.75,51.0],[5.85,51.15],[5.0,51.45],[4.25,51.37],[3.37,51.37]]),
      info: { capitale: 'Bruxelles', langues: 'néerlandais, français et allemand', fact: 'La frontière franco-belge mesure environ 620 km : c\'est la plus longue frontière terrestre de la France métropolitaine.' } },
    { id: 'luxembourg', name: 'Luxembourg', lbl: [6.12, 49.82], size: 0.62,
      shape: [].concat(GF_B_LU, [[6.52,49.75],[6.1,50.15],[5.8,49.95],[5.9,49.75]]),
      info: { capitale: 'Luxembourg', langues: 'luxembourgeois, français et allemand', fact: 'C\'est l\'un des plus petits pays d\'Europe. Beaucoup de Lorrains y travaillent chaque jour.' } },
    { id: 'allemagne', name: 'Allemagne', lbl: [8.75, 49.75], size: 1,
      shape: [].concat(GF_B_DE, [[8.2,47.6],[8.6,47.8],[9.0,47.68],[9.55,47.53],[9.9,47.55],[10.5,47.4],[11.3,47.5],[11.3,52.4],[7.1,52.4],[6.8,51.95],[6.0,51.85],[6.2,51.4],[6.1,51.1],[6.02,50.76],[6.05,50.72],[6.4,50.32],[6.1,50.15],[6.52,49.75]]),
      info: { capitale: 'Berlin', langues: 'allemand', fact: 'Le Rhin forme une grande partie de la frontière entre la France et l\'Allemagne, en Alsace.' } },
    { id: 'suisse', name: 'Suisse', lbl: [8.15, 46.82], size: 1,
      shape: [].concat(GF_B_CH, [[7.5,45.95],[7.9,45.95],[8.4,46.45],[8.6,46.1],[8.9,45.85],[9.05,45.83],[9.3,46.4],[9.5,46.3],[10.1,46.25],[10.45,46.55],[10.45,46.9],[9.6,47.05],[9.55,47.53],[9.0,47.68],[8.6,47.8],[8.2,47.6]]),
      info: { capitale: 'Berne', langues: 'allemand, français, italien et romanche', fact: 'La frontière franco-suisse passe par le massif du Jura et au milieu du lac Léman.' } },
    { id: 'italie', name: 'Italie', lbl: [8.9, 45.05], size: 1,
      shape: [].concat(GF_B_IT, [[8.0,43.88],[8.2,44.0],[8.45,44.3],[8.93,44.41],[9.5,44.2],[9.85,44.05],[10.2,43.9],[10.3,43.55],[10.5,43.0],[11.3,43.0],[11.3,46.9],[10.45,46.9],[10.45,46.55],[10.1,46.25],[9.5,46.3],[9.3,46.4],[9.05,45.83],[8.9,45.85],[8.6,46.1],[8.4,46.45],[7.9,45.95],[7.5,45.95],[7.05,45.92]]),
      info: { capitale: 'Rome', langues: 'italien', fact: 'La frontière franco-italienne suit la ligne de crête des Alpes, du Mont Blanc jusqu\'à Menton.' } },
    { id: 'monaco', name: 'Monaco', point: [7.42, 43.74], lbl: [7.62, 43.52], size: 0.6,
      info: { capitale: 'Monaco', langues: 'français', fact: 'C\'est le deuxième plus petit pays du monde (2 km²). Il est entièrement entouré par la France, sauf du côté de la mer.' } },
    { id: 'andorre', name: 'Andorre', lbl: [1.6, 42.3], size: 0.62,
      shape: [[1.78,42.58],[1.6,42.65],[1.45,42.6],[1.42,42.5],[1.55,42.43],[1.72,42.5]],
      info: { capitale: 'Andorre-la-Vieille', langues: 'catalan', fact: 'Petit pays perché dans les Pyrénées, entre la France et l\'Espagne. Le président de la République française en est l\'un des deux « coprinces ».' } },
    { id: 'espagne', name: 'Espagne', lbl: [-2.3, 42.25], size: 1,
      shape: [].concat([[-6.5,43.6],[-5.8,43.62],[-4.5,43.42],[-3.8,43.47],[-3.0,43.38],[-2.0,43.32]], _gfRev(GF_B_ES), [[3.3,42.25],[3.1,41.95],[2.8,41.7],[2.2,41.4],[1.5,41.15],[0.9,40.95],[0.6,40.4],[-6.5,40.4]]),
      info: { capitale: 'Madrid', langues: 'espagnol (castillan), catalan, basque, galicien', fact: 'La chaîne des Pyrénées forme une frontière naturelle entre la France et l\'Espagne.' } },
    { id: 'royaumeuni', name: 'Royaume-Uni', lbl: [-2.2, 51.25], size: 1,
      shape: [[-5.9,52.4],[-5.2,51.72],[-4.2,51.62],[-3.2,51.45],[-2.7,51.5],[-3.0,51.2],[-4.2,51.1],[-5.0,50.55],[-5.75,50.05],[-5.2,49.96],[-4.6,50.3],[-4.2,50.35],[-3.6,50.25],[-3.4,50.6],[-2.9,50.7],[-2.45,50.6],[-1.95,50.6],[-1.3,50.78],[-0.8,50.75],[0.25,50.75],[0.95,50.92],[1.38,51.15],[1.42,51.38],[0.6,51.45],[0.9,51.6],[1.3,51.85],[1.7,52.4]],
      info: { capitale: 'Londres', langues: 'anglais', fact: 'Pas de frontière terrestre avec la France métropolitaine : les deux pays sont séparés par la Manche et reliés par le tunnel sous la Manche (50 km).' } }
];

// ── Villes (10 communes les plus peuplées) ────────────────────────────────
const GF_CITIES = [
    { id: 'paris',       name: 'Paris',       p: [2.35, 48.86],  lp: 'r', rank: 1,  pop: '2,1 millions', region: 'Île-de-France', fleuve: 'la Seine', fact: 'Capitale de la France. Avec son agglomération, plus de 12 millions de personnes y vivent.' },
    { id: 'marseille',   name: 'Marseille',   p: [5.37, 43.30],  lp: 'b', rank: 2,  pop: '870 000', region: 'Provence-Alpes-Côte d\'Azur', fleuve: null, fact: 'Plus grand port de France, au bord de la mer Méditerranée. Fondée par les Grecs il y a 2 600 ans.' },
    { id: 'lyon',        name: 'Lyon',        p: [4.84, 45.76],  lp: 'l', rank: 3,  pop: '520 000', region: 'Auvergne-Rhône-Alpes', fleuve: 'le Rhône et la Saône', fact: 'Ville située au confluent (point de rencontre) du Rhône et de la Saône.' },
    { id: 'toulouse',    name: 'Toulouse',    p: [1.44, 43.60],  lp: 'r', rank: 4,  pop: '500 000', region: 'Occitanie', fleuve: 'la Garonne', fact: 'Surnommée « la ville rose » à cause de ses briques. Capitale européenne de l\'aéronautique (avions Airbus, fusées).' },
    { id: 'nice',        name: 'Nice',        p: [7.26, 43.70],  lp: 'l', rank: 5,  pop: '350 000', region: 'Provence-Alpes-Côte d\'Azur', fleuve: null, fact: 'Grande ville touristique de la Côte d\'Azur, entre mer et montagne, tout près de l\'Italie.' },
    { id: 'nantes',      name: 'Nantes',      p: [-1.55, 47.22], lp: 'b', rank: 6,  pop: '320 000', region: 'Pays de la Loire', fleuve: 'la Loire', fact: 'Ancienne capitale des ducs de Bretagne, située près de l\'embouchure de la Loire.' },
    { id: 'montpellier', name: 'Montpellier', p: [3.88, 43.61],  lp: 'r', rank: 7,  pop: '300 000', region: 'Occitanie', fleuve: null, fact: 'Ville universitaire très ancienne, à une dizaine de kilomètres de la mer Méditerranée.' },
    { id: 'strasbourg',  name: 'Strasbourg',  p: [7.75, 48.58],  lp: 'l', rank: 8,  pop: '290 000', region: 'Grand Est', fleuve: 'le Rhin (et l\'Ill)', fact: 'Ville frontière avec l\'Allemagne. Siège du Parlement européen.' },
    { id: 'bordeaux',    name: 'Bordeaux',    p: [-0.58, 44.84], lp: 'r', rank: 9,  pop: '260 000', region: 'Nouvelle-Aquitaine', fleuve: 'la Garonne', fact: 'Grand port sur la Garonne, célèbre dans le monde entier pour ses vins.' },
    { id: 'lille',       name: 'Lille',       p: [3.06, 50.63],  lp: 'b', rank: 10, pop: '235 000', region: 'Hauts-de-France', fleuve: null, fact: 'Grande ville du Nord, toute proche de la Belgique. Elle est reliée à Londres et Bruxelles par le TGV.' }
];

// ── Fleuves ───────────────────────────────────────────────────────────────
const GF_RIVERS = [
    { id: 'loire', name: 'Loire', lbl: [0.35, 47.62],
      path: [[4.22,44.84],[3.95,45.05],[4.05,45.25],[4.1,45.5],[4.07,46.04],[3.98,46.48],[3.45,46.83],[3.16,46.99],[2.95,47.3],[2.85,47.6],[2.63,47.68],[2.2,47.85],[1.9,47.9],[1.33,47.59],[0.69,47.39],[-0.08,47.26],[-0.55,47.38],[-1.0,47.35],[-1.55,47.21],[-2.2,47.27]],
      info: { longueur: '1 006 km', source: 'Mont Gerbier-de-Jonc (Massif central, Ardèche)', mer: 'l\'océan Atlantique (à Saint-Nazaire)', villes: 'Orléans, Blois, Tours, Angers, Nantes', fact: 'C\'est le plus long fleuve de France. On l\'appelle « le dernier fleuve sauvage d\'Europe ». Ses rives sont bordées de nombreux châteaux.' } },
    { id: 'seine', name: 'Seine', lbl: [3.55, 48.62],
      path: [[4.72,47.49],[4.57,47.86],[4.08,48.3],[3.5,48.5],[2.95,48.38],[2.65,48.54],[2.35,48.85],[2.1,48.95],[1.7,49.0],[1.4,49.2],[1.1,49.43],[0.75,49.43],[0.4,49.45],[0.15,49.45]],
      info: { longueur: '777 km', source: 'plateau de Langres (Côte-d\'Or)', mer: 'la Manche (au Havre)', villes: 'Troyes, Paris, Rouen, Le Havre', fact: 'Elle traverse Paris. C\'est un fleuve très utilisé pour transporter des marchandises en péniche.' } },
    { id: 'garonne', name: 'Garonne', lbl: [0.7, 44.32],
      path: [[0.95,42.65],[0.72,42.95],[0.72,43.1],[1.1,43.3],[1.44,43.6],[1.2,43.95],[0.62,44.2],[0.17,44.5],[-0.3,44.7],[-0.57,44.84],[-0.75,45.1],[-1.03,45.58]],
      info: { longueur: '529 km', source: 'val d\'Aran, dans les Pyrénées espagnoles', mer: 'l\'océan Atlantique, par l\'estuaire de la Gironde', villes: 'Toulouse, Agen, Bordeaux', fact: 'Après Bordeaux, elle rejoint la Dordogne pour former l\'estuaire de la Gironde, le plus grand estuaire d\'Europe occidentale.' } },
    { id: 'rhone', name: 'Rhône', lbl: [5.25, 44.55],
      path: [[8.38,46.58],[7.9,46.3],[7.36,46.23],[7.07,46.1],[6.9,46.35],[6.5,46.43],[6.15,46.21],[5.85,46.05],[5.8,45.75],[5.35,45.85],[4.85,45.76],[4.87,45.52],[4.85,45.2],[4.88,44.93],[4.73,44.55],[4.7,44.2],[4.8,43.95],[4.63,43.68],[4.75,43.38]],
      info: { longueur: '812 km (dont 545 km en France)', source: 'glacier du Rhône, dans les Alpes suisses', mer: 'la mer Méditerranée (delta de la Camargue)', villes: 'Genève, Lyon, Valence, Avignon, Arles', fact: 'C\'est le fleuve le plus puissant de France. Il traverse le lac Léman. De nombreux barrages et centrales électriques sont installés sur son cours.' } }
];
const GF_LEMAN = [[6.15,46.21],[6.3,46.33],[6.5,46.45],[6.8,46.43],[6.9,46.38],[6.7,46.38],[6.5,46.38],[6.25,46.25]];

// ── Massifs montagneux ────────────────────────────────────────────────────
const GF_MASSIFS = [
    { id: 'alpes', name: 'Alpes', lbl: [6.3, 44.95],
      shape: [[7.25,43.85],[6.5,43.95],[6.0,44.1],[5.5,44.35],[5.3,44.8],[5.45,45.3],[5.75,45.75],[6.2,46.15],[6.9,46.35],[7.6,46.45],[8.6,46.65],[9.6,46.9],[10.4,47.0],[10.4,46.1],[9.5,46.0],[8.6,45.9],[7.7,45.65],[7.3,45.2],[7.25,44.75],[7.6,44.3],[7.75,43.95]],
      info: { sommet: 'le Mont Blanc (4 806 m)', age: 'montagne jeune : sommets élevés, pointus et enneigés, glaciers', fact: 'Plus haute chaîne de montagnes d\'Europe. Elle s\'étend aussi en Italie, en Suisse, en Allemagne, en Autriche et au-delà. Grande région de sports d\'hiver.' } },
    { id: 'pyrenees', name: 'Pyrénées', lbl: [0.45, 42.6],
      shape: [[-1.6,43.25],[-1.0,43.15],[0.0,43.05],[1.0,42.95],[2.0,42.75],[3.0,42.55],[3.1,42.4],[2.5,42.2],[1.5,42.15],[0.5,42.3],[-0.5,42.55],[-1.3,42.85],[-1.8,43.05]],
      info: { sommet: 'l\'Aneto (3 404 m, en Espagne) ; côté français : le Vignemale (3 298 m)', age: 'montagne jeune : sommets élevés et escarpés', fact: 'Elles forment une frontière naturelle entre la France et l\'Espagne, de l\'océan Atlantique à la mer Méditerranée.' } },
    { id: 'massifcentral', name: 'Massif central', lbl: [3.05, 45.0],
      shape: [[2.3,46.1],[3.3,46.2],[4.3,45.9],[4.6,45.3],[4.5,44.6],[4.0,44.0],[3.3,43.6],[2.6,43.65],[2.0,44.2],[1.7,45.0],[1.6,45.6]],
      info: { sommet: 'le Puy de Sancy (1 885 m)', age: 'montagne ancienne : sommets arrondis, anciens volcans (chaîne des Puys)', fact: 'Il occupe le centre-sud de la France. Ses volcans sont endormis depuis des milliers d\'années. La Loire y prend sa source.' } },
    { id: 'jura', name: 'Jura', lbl: [6.35, 46.72],
      shape: [[5.55,46.25],[5.85,46.0],[6.15,46.2],[6.6,46.6],[7.1,47.0],[7.7,47.35],[7.5,47.55],[6.9,47.45],[6.3,47.2],[5.9,46.9],[5.55,46.6]],
      info: { sommet: 'le Crêt de la Neige (1 720 m)', age: 'montagne de moyenne altitude, aux plis réguliers', fact: 'Il est partagé entre la France et la Suisse. Il a donné son nom à une période de la préhistoire des dinosaures : le Jurassique.' } },
    { id: 'vosges', name: 'Vosges', lbl: [6.55, 48.2],
      shape: [[6.75,47.75],[7.15,47.85],[7.35,48.2],[7.35,48.6],[7.25,48.95],[7.0,48.9],[6.95,48.4],[6.7,48.0]],
      info: { sommet: 'le Grand Ballon (1 424 m)', age: 'montagne ancienne : sommets arrondis appelés « ballons »', fact: 'Elles séparent l\'Alsace de la Lorraine. Leurs forêts de sapins sont très étendues.' } }
];

// ── Mers et océan ─────────────────────────────────────────────────────────
const GF_SEAS = [
    { id: 'manche', name: 'Manche', lbl: [-2.6, 49.95],
      info: 'Bras de mer qui sépare la France du Royaume-Uni. C\'est l\'une des mers les plus fréquentées du monde par les bateaux. Elle connaît de très fortes marées (Mont-Saint-Michel).' },
    { id: 'merdunord', name: 'Mer du Nord', lbl: [2.35, 51.38],
      info: 'Mer peu profonde qui borde le nord de la France, la Belgique, les Pays-Bas, l\'Allemagne et le Royaume-Uni. Dunkerque est le principal port français sur cette mer.' },
    { id: 'atlantique', name: 'Océan Atlantique', lbl: [-3.9, 45.3], lines: ['Océan', 'Atlantique'],
      info: 'Le deuxième plus grand océan du monde. Il borde l\'ouest de la France, de la Bretagne au Pays basque. La Loire et la Garonne s\'y jettent.' },
    { id: 'mediterranee', name: 'Mer Méditerranée', lbl: [5.4, 42.35], lines: ['Mer', 'Méditerranée'],
      info: 'Mer presque fermée, entourée par l\'Europe, l\'Asie et l\'Afrique. Elle borde le sud de la France et la Corse. Ses marées sont très faibles. Le Rhône s\'y jette.' }
];

const GF_LAYERS = {
    villes:  { label: '🏙 Villes',   kindName: 'Ville' },
    fleuves: { label: '🌊 Fleuves',  kindName: 'Fleuve' },
    massifs: { label: '⛰ Massifs',  kindName: 'Massif montagneux' },
    pays:    { label: '🗺 Pays',     kindName: 'Pays frontalier' },
    mers:    { label: '⚓ Mers',     kindName: 'Mer / océan' }
};
const GF_COLORS = { villes: '#d63b3b', fleuves: '#2b7bd0', massifs: '#9a6a3a', pays: '#6b8f4e', mers: '#3b7fae' };

// ── Régions et départements (contours : IGN Admin Express via france-geojson, Licence ouverte) ──
// Coordonnées déjà projetées (mêmes unités que la carte physique), au 1/2 d'unité,
// sous forme d'arcs partagés entre départements voisins (codage différentiel).
const GF_ADM_Q = 2;
const GF_ADM_ARCS = ["1434,1085,22,-69,2,4,5,-3,8,6,7,-3,2,2,3,-4,10,0,1,8,14,5", "1508,1031,2,3,-4,3,11,7,-2,2,6,7,-1,4,3,-7,2,7,5,0,0,10,10,-1,14,-15,0,4,9,3,2,10,18,0,29,-31", "1597,1094,5,-9,0,-3,-4,-1,1,-4,21,-7,-3,-8,3,-1,6,-16,-14,-8", "1580,1132,-4,-14,2,-19,10,4,0,-7,9,-2", "1551,1198,3,-5,6,-2,-1,-4,4,-4,-2,-5,8,1,3,-4,1,-19,7,-24", "1479,1158,8,1,4,7,6,0,8,-8,1,-8,8,-7,11,10,-2,6,14,18,7,4,-2,2,-2,-3,1,6,7,3,3,9", "1434,1085,3,7,-7,9,1,25,-4,5,7,1,5,6,-1,3,6,-4,3,2,5,6,1,14,26,-1", "1212,318,7,-4,16,3,2,-4,20,3,6,-7,11,6,3,-3,2,2,-1,-3,9,-5,13,6,4,-2,7,8,13,-7,0,10,14,5,8,-2", "1346,324,8,2,-1,3,6,-1", "1333,439,-1,-7,4,-1,-4,-5,0,-8,5,-2,0,-4,-4,-1,4,-5,-7,-11,2,-3,10,2,2,-10,7,-3,10,-12,-6,-4,7,-21,0,-5,-6,-2,3,-9", "1255,550,5,-11,6,-1,2,-6,4,-1,-2,-3,4,-1,2,-7,6,-2,-3,-6,-10,0,3,-7,5,0,-6,-9,3,-6,10,-1,1,3,7,-3,0,-5,-4,1,-3,-6,-3,2,-3,-3,3,-6,-5,-15,21,-9,8,3,1,-8,-4,-4,11,2,2,-3,5,7,5,-1,2,4,3,0,2,-9", "1198,497,13,3,-1,4,3,6,2,-1,-4,9,5,0,4,7,3,0,2,7,5,-2,4,8,5,-4,2,12,9,2,1,4,4,-2", "1198,497,10,-9,-5,-1,-1,-6,-1,8,-1,-8,-8,-4,-4,0,0,4,4,0,1,5,-6,-5,-3,1,-1,-9,7,0,1,4,3,-3,-1,-11,-5,0,-5,-7,5,-4,6,3,7,-11,0,-11,10,-1,-8,-6,2,-5,-3,-2,5,-8,-1,-11,-5,-5,3,-1,-1,-7,3,1,-1,-9", "1205,379,-3,-12,-5,-1,3,-10,-4,-2,4,-2,-2,-7,7,-2,1,-9,10,-10,-6,-2,2,-4", "1193,961,3,9,10,4,5,8,7,2,7,-7,5,0,2,5,5,1,4,-6,6,0,4,5,0,8,4,0,4,-7,7,0,-2,-7,7,-1,-3,-4,2,-4,5,3", "1275,970,1,9,9,9,2,11,3,0,-1,11,10,6,6,-2,-1,3,4,0,-1,5,14,0,-1,3,3,-1,4,4,-4,12,1,14,3,1,-8,1,0,4,-8,3,2,2", "1284,1134,2,-9,6,2,1,-3,3,2,7,-5,-3,-9,2,-11,-4,-3,-1,-8,3,-3,-6,-15,6,0,1,-4,12,-3", "1128,1091,12,5,3,-10,7,-2,1,-9,11,6,3,-11,13,0,2,6,-4,2,0,7,6,1,2,10,5,0,2,4,10,-3,1,7,4,2,24,1,5,2,-1,2,12,-6,6,3,0,10,18,-3,5,12,7,1,2,6", "1089,1036,0,7,7,1,1,3,-3,0,-2,5,9,6,4,-4,3,9,4,-2,5,3,-1,3,5,5,7,19", "1089,1036,2,-10,4,0,4,-9,18,-4,2,3,6,0,10,-7,-2,-8,-4,-2,4,-7,-5,-3,5,-3,3,3,0,-7,7,-2,6,-9,2,-1,4,6,4,0,0,-3,8,2,0,-4,10,-10,16,0", "1559,1482,15,-5,16,5,1,-3,-3,0,-10,-13,2,-6,5,1,1,5,6,4,1,-12,-5,-2,1,-3,6,-6,1,-6,9,-4,6,-7,2,2,1,-8,9,3,11,17,5,-6,-4,-11,8,-3,3,3,4,-1,-1,-8,3,-3,8,11,3,-1,5,5,22,1,7,-19,7,-2,5,-8,11,-4,9,-10,5,1", "1725,1448,1,-12,8,-2,-12,-13,-1,-8,11,-8,0,-6,5,-3,-3,-7", "1691,1562,10,-4,-6,-4,2,-5,3,0,-4,-7,10,4,12,-10,7,6,8,-1,-9,-12,-4,0,-1,-7,-13,-10,1,-8,-9,-17,5,-18,5,-1,0,-4,4,1,2,-11,11,-6", "1569,1574,4,-5,6,1,3,6,6,-1,1,-6,3,-1,2,6,7,3,5,9,12,-15,6,1,8,-12,6,0,1,4,12,9,8,-3,1,-8,3,-2,7,2,5,-4,3,7,6,-6,7,3", "1534,1497,0,10,6,-1,0,10,-4,5,-1,9,7,1,3,6,4,0,-5,11,-4,2,0,7,4,-3,11,1,14,19", "1534,1497,7,-7,4,0,-1,-8,5,0,4,4,-1,4,6,1,1,-4,-5,0,0,-3,5,-2", "1639,1295,3,3,7,-3,6,8,-2,3,10,1,2,3,5,-1,-1,-8,4,-3,6,2,4,-5,7,3", "1690,1298,6,18,10,1,-1,5,4,6,-3,10,16,12,7,1,3,-4,12,8,-3,7,11,22,-13,-2,-5,7", "1559,1482,1,-15,-6,0,-1,-7,-4,-1,3,-6,-13,1,-2,-4,-5,2,-4,-6,-4,0,2,-4,-4,-7,4,-2,5,3,3,-3,-6,-5,0,-8,19,7,4,-7,5,0,-4,-7,-5,-2,7,-13,-1,-8,14,2,1,-4,6,1,5,-6,0,-3,-4,-1", "1575,1379,4,-11,7,3,3,-3,7,0,4,-4,-4,-5,8,-3,2,-4,5,5,10,-10,5,3,11,0,8,-5,3,5,4,-1,0,-18,-4,0,-2,-7,2,-4,-10,1,-7,-3,2,-11,4,-1,-3,-8,5,-3", "1725,1448,5,1,6,9,-1,3,5,2,3,11,8,-1,10,7,3,-2,16,14,9,-1,1,6,6,-2,4,3,0,-4,5,1,5,-4,17,-1,3,-6,6,1,-3,9,7,9,-2,9,-6,3,0,10,-12,5,-1,10,-10,7,5,16,-6,7,-4,-2,-6,8,-10,1,-1,8,-3,-6,0,4,-10,-1,-4,9,-2,-3,-5,1,-5,10,3,11,-3,2,-3,-6,-9,7,-1,-3,-6,0,-6,5,2,6,-3,3", "1691,1562,3,8,3,-2,4,4,6,0,3,7,-2,8,5,8,16,5,-5,14,3,1,-2,5,7,4", "1393,1273,1,1", "1394,1274,3,0,0,-3,4,2,9,-3,-2,-5,1,-3,4,0,-2,-4,4,-1,2,-5,14,-5", "1431,1247,1,9,5,4", "1416,1454,2,-19,5,-4,-1,-23,3,-5,4,0,5,-13,-2,-26,8,-7,0,-5,3,0,2,-13,4,-6,-7,-14,3,-12,-4,-1,0,-6,-4,-5,4,-5,-3,-3,-1,-27", "1416,1454,0,12", "1326,1428,6,3,-1,5,5,3,-4,2,2,16,2,-3,9,-1,1,4,5,-1,1,4,11,7,3,-10,6,-5,9,-1,0,11,7,1,1,-11,8,-1,7,9,7,4,4,-1,1,3", "1308,1371,2,3,-3,4,1,3,3,-1,-3,4,4,5,1,12,8,7,5,20", "1308,1371,8,-4,-2,-3,2,1,3,-10,3,-1,2,4,1,-5,1,3,1,-4,3,2,2,-9,17,0,10,-19,11,0,-3,-4,1,-7,11,-2,0,-4,-5,-2,2,-7,6,-1,-4,-8,6,1,2,6,1,-3,3,1,-2,-9,5,-5,1,-8", "1393,1273,1,1", "1359,328,10,-2,19,7,11,-3,8,-7,15,-2,1,-13,-3,-1,3,-6,7,-3,10,-12,1,3,7,0,0,12,-6,0,1,5,-3,2,3,4,-7,12,0,4,8,2,5,7,-5,10,4,9,-4,5,11,2,2,-3,7,0,9,8,5,-1,4,11,4,-2,1,5,17,1,7,7,-4,4,1,5,4,-1,0,-3,7,3", "1458,473,6,-6,8,-2,-4,-12,4,-7,7,-2,-4,-5,6,-3,-3,-5,2,-3,-7,-9,5,-4,2,-13,5,0,2,5,10,-1,6,5,16,-14", "1333,439,20,1,14,9,2,6,9,0,3,7,7,3,19,-4,7,13,6,-5,7,0,2,3,10,-2,7,4,2,-6,4,-1,4,1,-2,2,4,3", "1007,1665,5,10,-2,8,5,0,5,7,3,-2,7,3,0,-3,0,3,4,0,1,6,3,-4,6,4,1,10,-3,0,0,3,5,1,1,16,3,1,-7,-1,-3,5,7,3,0,11,-15,3,-2,7,5,2,4,6,-3,2,6,7,18,-4,1,4,11,7,0,7", "1021,1805,12,-1,3,-7,10,0,4,-9,23,-1", "892,1755,9,7,5,-3,4,4,13,-1,11,16,10,-4,3,3,14,-1,-1,3,6,4,6,16,6,-1,0,-8,12,-1,5,6,19,2,-2,5,9,3", "892,1755,-4,-18,8,-3,-1,-6,10,-1,6,-4,3,-5,-4,-3,-1,-9,4,-2,-1,-7,5,3,2,-9,5,2,5,-4,6,5,2,-2,8,11,9,-8,-4,-5,-8,-1,2,-7,13,0,0,-3,8,-4,-1,-4,-8,-1,2,-3,-6,0,2,-7,8,-3,12,21,8,-2,-2,-14,3,0,0,4,4,-2,3,5,1,-4,9,4,0,4,4,-9,3,1", "1246,642,1,-5,-5,-2,2,-9,-3,-2,7,-2,-4,-8,11,-2,-2,-7,12,-9", "1265,596,4,7,6,1,2,9,13,-1,13,5,5,-4,-2,-9,7,1,2,-6,9,-4,2,-8,9,0,2,-7,8,3,4,-5,10,2,1,-3,8,0,5,8,-3,5,3,4,-3,3,12,11,12,4,3,-2,4,5,4,-5,10,-1,-1,2,5,3", "1419,614,-2,12,-4,2,7,3,4,11,8,0,-1,5,12,5,-4,4,7,11,-4,8,4,3,-4,8,0,13,-14,-3,-4,6,-7,2,5,1,4,6,-2,5", "1367,735,2,-7,34,-1,-3,-8,6,-5,18,2", "1246,642,1,6,4,-3,8,2,5,6,-1,3,7,4,-2,3,6,3,1,3,-4,4,3,2,-5,9,7,-2,4,10,6,-1,1,-6,5,2,-2,6,8,3,5,17,6,4,-5,2,1,3,4,3,1,-5,3,0,0,15,13,-3,7,3,2,-4,7,4,7,-7,5,4,0,-7,4,1,2,8,7,1", "1007,1665,4,-4,-2,-2,5,-2,-2,-5,13,-1,-2,-10,3,0,-1,-4,4,-1,1,-5,6,5,0,5,5,-6,8,3,6,-2,-1,-3", "1054,1633,4,1,2,7,14,-4,4,6,3,-1,0,-8,5,-5,19,8,4,-4,9,-1,10,3", "1128,1635,1,1", "1129,1636,3,4,-5,1,-2,10,6,2,4,10,3,-3,4,1,4,-5,1,8,9,5,7,-10,-2,-3,10,-3,-3,-7,3,-2,3,11,7,3,8,-2,1,9,3,-2,6,5,9,0,0,3,8,-1,6,7", "1194,1752,3,-15,-3,-3,0,-7,4,-14,10,-20,14,-16", "1073,1787,4,3,10,-12,4,2,9,-6,-2,-14,-4,-5,5,-4,14,2,7,-3,28,4,6,-3,5,-10,11,-5,2,4,22,12", "1079,1396,1,-6,15,-4,3,6,19,-2,2,-8,9,-6,-3,-1,1,-6,2,-5,5,-2,0,-11,4,-6,4,1,3,-7,4,0,3,-7,6,4,1,13,3,-4,8,0,-1,5,5,13,4,-2,3,4,-1,3,-3,-1,3,2,1,16,6,6", "1186,1391,13,14,-1,15,7,5,3,7,-3,15,5,11,-5,5,0,5,5,-3,1,6,9,3,-4,8,19,-3,5,7", "1238,1538,-1,-7,14,-15,-9,-7,-6,1,-2,-6,-6,2,-3,-5,7,-2,3,-11,5,-2", "1179,1581,7,-3,7,4,4,-1,0,-28,20,5,6,-4,-2,-8,5,-6,8,2,4,-4", "1049,1490,9,-4,-1,-4,7,3,1,-4,6,-1,0,4,4,0,2,4,6,-1,-7,6,12,-3,3,2,-1,4,6,-1,3,5,5,1,3,8,7,1,4,6,1,7,4,2,-4,6,7,3,0,8,4,2,-2,8,13,17,15,5,3,-5,5,-1,12,4,3,9", "1034,1452,-3,2,3,5,-2,3,14,3,-1,7,-3,-2,-7,9,3,4,3,-1,1,4,1,-3,4,1,2,6", "1034,1452,4,-5,-6,-6,1,-6,-4,-2,-1,-9,6,-1,0,-4,5,4,-1,-4,7,-3,3,-6,7,-2,3,-5,0,4,3,-4,3,3,7,0,8,-6,0,-4", "1429,1535,19,4,14,8,7,7,2,8,20,11,5,-3,11,2,29,16,16,-1,5,-6,6,1,6,-7", "1558,1684,1,-11,11,-6,-5,-10,-6,-1,3,-7,-3,-9,10,0,5,-4,-13,-12,4,-14,-10,-5,5,-2,-2,-5,4,-7,13,-3,2,-6,-8,-7", "1358,1628,24,3,18,-2,8,6,0,5,-5,3,4,5,11,3,15,-1,8,4,12,-9,-1,-3,-3,7,-6,-4,4,-3,-5,-1,4,-1,-6,-5,8,3,-3,-9,3,7,3,-2,-1,5,5,-6,6,2,0,5,4,0,-2,3,8,12,27,-1,11,-6,6,8,-3,8,5,4,-5,10,17,0,5,3,5,-4,9,11,4,-6,6,2", "1358,1628,1,-7,12,-6,-1,-6,3,4,17,-11,2,-4,-7,-3,9,-15,7,-2,12,5,-2,-9,6,-11,-2,-10,4,-2,-4,-1,0,-4,8,-3,6,-8", "1464,1620,4,-11,3,6,10,1,4,13,5,-6,5,-1,1,8,-4,0,1,2,-9,8,-11,0,-1,-13,-7,-1,-1,-6", "619,449,6,-7,19,-1,22,9,53,3,24,11,30,-8,19,-17,13,-5,10,0", "815,434,0,12,3,5,-2,12,11,0,0,4,-7,2,-1,3,9,6,-1,11,7,3,-5,6,3,7,-4,-1,-3,5,2,4,8,2,-4,15", "658,570,22,-14,-3,-5,8,1,0,3,9,-3,1,2,19,-9,4,1,2,5,4,-1,-2,3,3,2,4,-3,-1,-4,4,0,14,3,10,6,-2,-4,10,-1,5,-7,4,1,-1,-3,10,-3,3,-8,8,-2,4,5,4,-4,6,1,2,-5,12,4,5,-6,5,5", "619,449,-2,17,8,8,4,0,8,7,5,-1,3,-6,6,5,-6,9,-4,0,4,0,-1,2,7,4,-5,6,5,-4,2,2,1,8,-3,6,4,3,-3,0,-15,17,-8,1,-2,3,7,1,-8,9,-3,-2,-9,12,6,0,5,9,15,0,2,-3,10,7,8,-3,-2,4", "1120,1224,5,0,-1,5,5,-2,5,3,2,-4,1,5,8,1,-1,7,5,5,13,-4,8,5,3,-2,5,3,3,12,10,5,5,-4,1,-6,7,-3", "1204,1250,0,5,-3,0,3,3,-4,4,10,-1,1,5,7,-2,3,13,5,1,-2,8,4,10,10,3,-11,0,5,4,-3,10,2,3,4,-1,-2,3,4,-1,3,3,-4,3,2,3", "1186,1391,4,-13,4,-1,-2,-4,3,-14,3,-6,4,0,2,-12,4,-2,6,9,7,-5,2,-11,5,3,10,-9", "1059,1325,2,9,4,2,-3,3,1,7,11,15,-6,19,4,0,1,12,6,4", "1059,1325,11,-4,-7,-12,7,-6,4,1,1,-11,7,-5,-6,-12,7,-5,4,-9,3,1,4,-8,6,-2,1,-12,-3,-3,5,-1,13,9,7,-4,-5,-5,2,-13", "760,1126,8,-4,-1,-5,4,-3,-3,-5,9,0,7,-8,4,1,-1,-3,6,0,4,5,4,-3", "801,1101,4,0,7,7,16,-2,3,4,5,0,4,-5,-2,-3,-3,1,0,-4,7,-6,6,10,8,2,3,-4,10,0,-2,-4,5,-5,16,2", "861,1177,7,-9,4,0,0,-9,10,3,0,-6,5,-8,-2,-2,3,-2,-2,-10,11,1,8,-9,-5,-10,-8,0,0,-3,-6,-3,2,-16", "861,1177,0,1", "774,1282,6,-7,7,-1,6,4,5,-10,4,0,2,-6,7,-2,-3,-13,3,-11,7,-3,-2,-5,3,3,7,-8,8,-1,-1,-3,5,-7,6,-3,0,-15,2,-3,5,3,10,-16", "760,1126,1,7,-8,1,0,6,5,6,-4,5,-2,13,-1,-3,-8,4,-2,-6,-8,0,-2,4,-13,0,-8,9,8,1,-3,5,6,10,-4,1,-3,6,7,0,1,4,11,8,-4,6,10,3,-2,2,4,3,-7,8,2,-1,4,4,-1,5,3,0,-11,6,4,6,5,-1,-1,4,-4,-2,0,9,8,-3,16,6,-1,9,9,-1,7,4,0,8", "558,1071,4,9,9,-1,20,12,9,-3,-5,-6,-19,-3,3,-5,-7,0,-4,6,-4,-5,6,-1,-4,-6,-8,3", "618,1058,1,-3,6,2,5,-7,9,0,7,-4,-5,10,15,1,2,-5,5,-1,-1,3,8,5", "670,1059,0,12,9,6,-1,7,4,-1,2,4,7,2,-5,1,2,3,11,-2,5,8,9,2,2,-4,1,5,3,1,2,-3,3,5,10,-2,2,6,11,0,8,15,5,2", "768,1300,1,-8,5,-2,-3,-2,3,-6", "632,1205,26,28,12,23,5,-2,11,3,6,-1,2,-4,2,9,12,0,8,4,0,14,4,11,6,-4,4,6,5,-1,4,7,12,4,5,-1,3,-5,9,4", "618,1058,2,10,-12,9,0,5,-6,7,12,0,-2,3,7,5,-3,2,6,2,1,8,5,4,0,8,-9,-1,8,10,-5,0,3,2,-3,14,-10,4,5,10,-13,2,-2,9,2,14,4,1,-4,-3,4,-2,20,15,5,-1,4,10,-5,0", "578,1111,6,1,9,10,10,1,0,12,7,8,-3,5,1,7,-4,5,-5,-16,-17,-14,0,-11,-4,-8", "1083,796,7,-2,12,9,10,-5,6,8,8,-1,6,3,3,7,6,3,0,5,10,-3,0,-8,7,4,2,5,11,-5", "1171,816,8,16,-9,19,1,5,15,12,-1,6,8,26,-2,7,8,7,0,17,-4,7,3,12,-5,11", "1073,1035,16,1", "1028,876,0,8,-9,10,15,6,6,0,5,-5,5,0,1,6,7,-2,0,7,-4,6,11,7,-5,14,12,5,-4,6,-6,2,-1,7,-5,0,10,10,-7,9,4,6,5,0,4,4,-3,5,7,5,-4,17,6,15,-7,4,2,7", "1028,876,4,3,5,-2,2,-4,-4,-3,7,-8,12,5,7,-4,8,1,3,-4,-1,-4,-3,0,-2,-10,-2,1,0,-6,2,-5,3,3,7,-7,2,7,4,0,2,-18,-7,1,3,-5,-3,-7,-9,0,-1,-7,16,-7", "1036,1180,3,-3,4,2,0,-4,6,1,1,-6,8,-3,4,7,11,-1,6,4,-2,3,2,-3,2,4,7,1,-1,5,3,0,7,-3,1,-6,12,2,8,-8", "1118,1172,4,5,1,12,-1,3,-5,0,-3,9,4,7,4,1,-2,15", "974,1316,3,1,7,-6,3,0,0,3,12,-1,20,22,6,0,13,-11,4,1,0,4,9,-5,8,1", "947,1231,6,2,-6,7,3,-1,0,4,3,-3,4,4,-9,12,-3,-1,-1,11,6,3,0,4,-7,6,9,3,-2,5,-3,0,5,5,17,3,-5,5,10,16", "947,1231,2,-7,12,2,8,-12,6,-1,-1,-4,19,0,1,-4,6,-1,8,-11,8,-2,5,-8,5,4,8,0,0,-3,4,0,-2,-4", "1343,895,-1,-4,10,-1", "1343,895,8,2,1,-7", "1424,716,4,3,8,-1,2,5,-3,4,9,1,2,3,-5,7,4,3,5,-6,5,11,4,1,1,7,3,0,0,6,-10,5,7,5,0,13,9,-5,0,4,4,-1,-2,4,11,6,7,-7,0,6,8,7,3,-2,0,10,6,-6,6,-1,2,4,2,-3", "1516,799,4,2,3,-7,8,4,1,17,-3,0,-4,7,-5,-2,0,6,-4,1,1,3,9,0,-1,12,8,0,0,12,-3,3,6,2", "1500,924,8,-6,-5,-3,1,-5,7,-6,8,-1,9,-18,-2,-5,5,-3,1,-15,4,-3", "1355,889,4,3,1,-2,4,9,10,0,2,9,3,-5,5,1,-2,4,4,5,9,1,2,4,6,-2,-1,6,3,0,7,10,7,1,-1,5,3,2,7,-5,6,2,1,-3,15,-4,2,-4,12,2,8,-4,7,4,0,3,0,-3,13,-2,3,-4,5,2", "1341,852,5,-3,-4,9,2,13,7,-1,8,10,-4,9", "1341,852,0,-7,-4,0,0,-13,3,2,0,-3,4,-1,-2,-11,14,-19,0,-6,5,-5,-3,-5,8,-1,-7,-7,14,-8,-1,-17,-8,1,-3,-7,8,-6,-2,-4", "480,599,4,7,7,1,0,5,5,-5", "496,607,5,4,-1,9,-3,2,8,-10", "458,693,2,-3,5,1,-2,-3,4,-3,-1,-7,6,0,1,-9,10,1,-1,-5,4,0,0,-4,4,-1,4,4,3,0,1,-4,5,1,-1,-10,5,0,-3,-19,6,-8,-1,-11,-2,-3,-2,2", "281,683,18,0,0,6,3,2,11,-5,1,4,8,2,8,-1,7,-5,2,2,5,-10,10,1,3,1,2,8,11,-2,10,6,6,-1,4,5,0,7,3,-6,7,0,5,-4,3,7,-4,7,2,6,5,0,6,-7,5,-1,-1,-5,5,-5,-2,-7,7,1,-1,-2,10,-2,7,12,11,-4", "268,588,1,10,3,4,6,1,-1,6,3,-1,4,4,-9,12,8,5,-6,5,-2,8,8,2,0,13,5,-1,-5,4,5,4,-6,10,5,8,-6,1", "268,588,2,-2", "270,586,1,0", "271,586,1,-3,2,3,7,-3,-3,-1,0,-5,5,-3,0,-4,-5,-1,0,-5,7,-4,-1,-5,8,0,1,-3,3,5,4,-1,-2,4,7,0,10,-8,8,1,4,-7,4,7,-4,8,2,2,7,-14,12,-4,-3,1,4,2,-3,0,2,8,-6,12,3,-1,4,-11,9,0,1,4,-6,3,3,0,1,4,9,-1,3,3,-2,7,16,13,0,11,16,9,-1,6,5,7,0,-8,7,1,11,-15,9,-2,3,-4,-3,-3,7,-2,4,4,11,-7,1,-4,1,4,4,0,-7,9,3,3,10,-7,-1,6,5,4,0,4,3,-3,-1,-4,2,7,4,-3,-2,-3,3,-3,3,3", "1118,1172,-8,-5,0,-5,-6,-8,6,-1,1,-6,7,0,1,-4,7,-4,2,-10,7,-3,-3,-4,1,-9,-4,-2,-3,-8,2,-12", "969,1051,5,3,-5,10,3,2,-4,1,2,5,-7,5,6,8,7,-1,-1,6,4,3,2,-2,1,5,-3,3,8,5,-1,16,6,4,-10,9,6,4,11,-4,2,9,-3,-2,0,3,-4,1,1,5,8,4,9,-1,6,-6,2,8,5,4,3,-3,6,5,3,7,-4,1,0,7,3,5", "969,1051,12,-10,2,-6,4,1,0,5,10,-6,3,8,6,-7,6,6,4,-3,1,-10,5,0,6,6,10,-4,2,3,8,-2,13,6,12,-3", "861,1177,0,1", "861,1178,4,5,9,-2,7,5,-3,12,3,4,4,-1,1,4,5,-2,3,-7,3,4,7,-3,11,1,2,9,6,7,7,-3,5,4,-7,10,7,0,2,4,7,-1,1,5,2,-2", "922,1405,4,1,0,-6,7,-7,-1,-7,13,-4,4,-7,3,2,1,-6,3,1,1,-5,-5,-5,10,-4,0,-7,11,-6,-4,-7,4,-1,-4,-18,5,-3", "815,1368,6,5,1,16,10,2,12,-7,6,3,5,-7,4,2,1,-3,4,1,1,5,10,0,11,-5,2,6,4,0,-5,8,2,6,5,0,9,-8,6,-1,4,6,10,5,-1,3", "768,1300,4,-4,6,0,6,9,-10,26,5,6,-10,13,8,0,2,5,4,1,3,-3,3,0,0,3,11,0,8,-8,-1,-3,5,1,5,4,-3,5,-4,0,5,13", "1714,807,3,4,11,-1,1,5,5,3,-1,5,-2,-3,-3,1,5,12", "1622,1008,-4,-3,4,-5,19,-18,23,-15,2,-5,-4,-4,5,-16,-4,-8,8,-9,2,2,15,-5,6,-8,5,-1,3,-4,-4,-2,4,-5,4,0,-1,-4,11,-5,8,-13,9,-6,0,-12,8,-1,1,-6,7,-2,-1,-5,-5,-3,-19,5,5,-10,4,-1,0,-6", "1562,867,2,9,3,4,6,1,0,5,4,0,2,5,-3,7,-5,3,2,8,-7,0,3,3,-1,5,6,-1,1,-5,3,1,-1,5,10,4,5,-4,-1,6,5,-1,-1,2,5,2,-3,5,5,2,-2,5,5,4,-1,4,3,-1,-1,4,4,2,3,-3,18,17,-3,7,-16,10,5,9,-7,7,10,11,2,-1", "1562,867,6,0,18,-11,3,2,-1,-4,5,1,-1,-4,8,4,2,-3,4,2,7,-4,2,-5,3,3,1,-7,8,1,2,-3,-3,-1,5,-4,6,4,-2,-4,4,1,0,-4,4,0,1,-8,10,-6,12,0,2,6,4,-5,8,4,3,-2,0,-9,4,3,6,-1,1,-9,16,9,4,-6", "1437,1260,8,-2,3,3,15,-10,5,6,5,0,2,7,9,-4,-3,10,8,0,4,7,-5,0,3,19,-8,9,5,2,1,-4,5,0,4,5,8,-1,3,3,2,-3,7,6,-1,-4,5,2,8,-9,2,3,-3,7,4,9,-4,34,3,0,-4,6,13,6,0,-6,13,14,8,-1,7,7,6,-2", "1416,1454,16,1,6,4,1,15,8,-6,8,0,18,-10,1,4,6,3,8,-8,-3,7,2,11,9,3,2,-4,12,5,4,-2,4,3,0,9,7,1,2,6,7,1", "1447,1450,3,2,0,7,13,2,5,-14,3,1,4,-4,-7,-2,-1,-5,-6,-3,-8,4,-1,7,-5,5", "815,434,6,-2", "821,432,23,-9,11,11,8,-3,-2,4,5,5,13,-4,3,2,3,-3,2,6,8,0,1,4,5,-2,2,8,-7,-1,-6,4,8,3,-1,3,7,-5,3,6,-2,3,8,3,-2,3,10,-2,-2,-8,11,-2,5,-7,15,0,5,-17,5,-1,-1,-2,6,-4,0,3,8,-1,13,5,6,-2,3,6,4,-1,3,3,6,1,3,-3", "1009,473,1,-6,7,-1,4,5,2,-5,-1,-4,-3,0,-2,-16,-6,-8", "996,504,7,-10,2,-16,4,-5", "981,532,2,-3,-3,-2,4,-3,-7,1,1,-9,-3,-1,-1,-6,8,-1,0,-5,2,3,12,-2", "886,586,5,-2,5,-8,7,2,5,-4,9,0,4,-6,7,3,1,-9,13,6,16,0,6,-4,-2,-11,14,-7,1,-6,-3,-5,7,-3", "831,530,-4,8,5,2,0,3,18,2,4,-4,1,4,4,-1,-2,4,4,1,-3,5,21,12,-2,2,4,5,-7,6,6,2,0,5,6,0", "981,532,2,4,4,0,-1,3,4,4,-3,3,8,6,-3,2,2,3,-3,5,1,6,7,2,-7,9,4,3,-1,6,6,2,3,7,7,0,0,8,6,0,4,4,-2,9,4,9,4,-1,4,6,9,-3", "1040,629,0,10,7,1,-1,4,3,3,-3,2,2,5,-3,4,4,5", "984,724,-1,-10,5,0,-1,-3,7,3,4,-8,6,-1,1,3,2,-3,9,2,7,-5,9,1,7,-11,-2,-4,3,-3,6,1,-3,-5,4,0,-2,-12,4,-6", "890,699,16,1,6,-6,6,0,-7,8,17,2,0,8,7,2,-1,3,6,8,-2,1,8,-2,3,4,4,-2,2,3,8,0,2,-5,7,1,0,-7,12,6", "884,681,5,6,4,-1,7,4,0,3,-9,0,-1,6", "884,681,5,-4,-6,-9,2,-6,-7,-2,2,-5,6,-5,4,1,10,-5,5,-6,-1,-4,5,-4,-6,-5,5,-12,-7,-3,3,-2,-2,-2,-9,-3,-2,-7,-4,0,-1,-12", "281,683,-20,8,-3,10,5,0,-2,6,5,1,5,15,12,-2,4,4,5,0,3,6,7,-6,3,3,-1,20,-7,-1,-1,6,-4,2,-5,-5", "285,752,-1,-4,3,2", "285,752,0,1", "285,753,0,2", "285,755,0,2", "285,757,2,1", "287,758,0,1", "286,764,1,-5", "286,764,0,2", "271,586,-1,-5,-5,2,-7,-5,-7,2,-5,-3,0,3,-2,-2,-3,4,1,6,-2,-3,2,9,3,0,-5,3,2,2,-9,-14,-5,4,1,10,-1,-14,-3,0,-1,-5,2,-4,-4,-1,-1,3,-1,-3,-7,5,0,5,-3,-4,-10,0,-10,7,3,2,-10,0,-2,3,-4,-1,3,-5,-4,-2,-15,4,5,4,-7,-1,-7,4,-7,-3,-3,4,13,8,-7,-4,-9,0,-1,-3,-2,6,4,4,10,2,-11,-1,-4,-5,-14,4,-8,13,3,5,6,-1,-7,2,-4,10,5,6,-4,5,5,-1,-4,1,1,6,9,0,2,-5,13,3,16,-9,7,1,1,-4,4,2,17,-10,-22,15,-3,8,6,-3,0,3,5,0,1,-4,3,1,3,-4,-1,4,10,-4,-10,9,6,1,5,-3,-4,3,5,2,3,-3,-2,3,6,0,-12,4,5,5,5,-1,9,4,7,-3,-5,4,-11,-2,-1,-3,-4,2,-6,-6,4,-2,-5,-2,-16,5,-1,-4,-12,3,0,-6,-5,5,-2,-4,4,-7,-7,3,2,8,-7,1,-1,5,11,1,-4,3,3,5,-1,8,6,-4,2,-9,5,-1,12,4,0,3,7,0,5,5,-1,5,3,0,-3,13,-11,-4,-16,5,-7,-1,-1,3,-23,2,2,3,-4,2,11,4,3,-2,8,6,5,-3,1,-5,5,0,-5,1,-1,5,11,5,13,18,2,13,-5,2,2,5,20,1,1,-4,5,2,3,-7,-8,-6,3,1,2,-4,2,6,8,-3,-7,-6,7,-8,-2,-4,3,-4,-1,7,4,1,-3,-2,-6,6,6,11,3,-3,4,4,-5,-1,7,3,8,-2,-2,-6,3,-3,9,7,-2,2,4,0,-1,4,6,9,16,-1,-1,-9,2,7,13,-5,-12,5,6,6,6,-3,-1,3,3,1,13,0", "268,588,2,-2", "64,629,6,0,-3,3,2,1,9,-6,-5,-4,-9,6", "1959,1844,9,1,1,3,23,9,6,-3,0,7,6,8,3,-1,2,5,15,6,4,16,7,4,2,13,3,3,8,-1,-1,23,5,1,-3,12,10,1,2,3,7,-7,4,0", "1959,1844,-5,1,2,9,5,-5,4,1,1,4,-4,3,9,3,4,7,-21,5,6,7,-3,7,4,0,-5,5,5,-1,-2,4,5,-1,6,7,5,-3,7,11,0,4,-12,6,0,8,-9,1,4,5,-2,9,4,-3,13,0,2,-5,8,6,-3,4,1,7,-5,1,5,3,-2,4,-4,0,-1,3,-3,-2,2,6,-10,7,7,0,0,4,10,-4,0,8,4,-3,15,6,-5,3,-1,5,-3,-1,-4,4,-3,-2,-2,4,0,13,9,2,-2,5,5,-1,6,7,14,2,1,4,7,-4,-1,7,7,0,-4,10,6,-1,6,7,6,0,6,-11,-1,-2,-6,5,1,-7,9,-8,0,-4,-3,0,3,-3,-2,-3,10,-6,3,-6,-7,-3,-3,4,-2,-3,4,-6,1,3,6,0,-2,-4,6,-3,-2,-7,4,-2,1,-9,-2,-25", "1959,1844,-1,0,1,-1,0,1", "1959,1844,1,0", "1960,1844,3,-1,0,-6,8,-2,-2,-4,3,0,1,-6,-4,-1,3,-8,7,-1,0,-12,1,4,9,1,1,-9,10,-1,1,-4,7,-3,5,2,12,-4,0,-8,13,-8,10,0,11,12,6,-11,0,-14,-5,-6,4,-7,-2,-7,5,-5,-3,-14,13,-3,4,4,-1,8,5,23,-6,34,12,21,0,40,4,15,0,19,-1,16,-20,32,-2,17", "1240,1486,7,3,3,6,10,0,3,3,3,-3,10,1,0,-11,5,-2,17,12,16,-4,2,-7,7,3,-2,-6,-3,0,1,-10,4,-3,-6,-3,-1,-5,4,-7,-3,0,-6,-12,9,-1,-1,-3,2,1,5,-10", "1416,1466,4,6,-1,5,6,1,1,26,5,-2,9,15,3,0,0,6,-4,-1,0,6,-10,7", "1340,1609,6,5,-3,2,1,6,14,6", "1238,1538,8,-1,3,3,-1,7,12,-6,1,8,8,2,2,-2,-3,-3,6,-9,3,0,0,4,0,-4,4,1,2,-9,14,-3,1,6,5,1,-3,12,3,2,12,-5,1,7,8,2,-2,9,5,-3,8,10,3,-1,1,4,7,2,7,21,-6,10,-9,-1,4,4,-2,3", "906,1563,15,-3,2,-3,4,4,7,-5,9,10,7,-3,0,-4,2,2,10,-4,-2,-5,-5,2,-2,-3,9,-1,0,-8,12,4,4,-7,2,4,5,-7,3,1", "988,1537,1,-1", "988,1537,1,-1", "988,1537,1,10,5,4,-1,6,9,4,0,9,8,7,-6,4,8,1,1,7,-3,0,-3,6,11,4,2,4,8,1,7,14,14,7,3,-7,4,0,1,5,-4,2,-1,5,2,3", "840,1780,5,2,12,-3,10,3,1,-7,-2,-5,-4,-1,4,-3,-3,-3,3,-3,1,-11,6,-1,19,7", "840,1780,-4,-6,3,-29,12,3,6,-15,6,-6,-4,-1,-1,-4,3,-2,-3,-7,-11,7,1,-8,4,1,0,-8,-9,-4,-2,-4,-5,1,2,-2,-3,-2,11,-12,-1,-4,8,-2,-3,-4,12,-11,-4,-3", "858,1658,8,-2,6,-11,5,-1,0,-8,8,4,1,-3,15,2,3,5,3,-2,0,4,4,1,0,-9,4,0,3,-9,-4,-4,8,-6,-3,-2,4,-2,-3,-3,6,1,2,-4,6,0,1,-4,5,1,-1,-7,-5,0,-4,-8,-6,0,2,-3,-7,-3,2,-6,-11,-7,-4,-9", "784,1524,9,-4,0,5,3,0,7,-10,12,7,3,-1,-1,-3,10,1,2,-4,6,-1,2,-5,14,0,5,-5,9,11,11,-8", "876,1507,3,7,7,-5,7,3,-7,3,2,6,-9,13,11,3,3,-2,6,5,-3,2,4,7,-3,3,4,1,-3,10,8,0", "760,1604,8,-7,4,2,1,8,8,9,9,1,2,10,5,4,-5,5,6,4,0,5,10,1,7,-4,1,5,3,-2,0,6,9,-2,0,4,4,2,3,-3,6,3,4,-2,13,5", "740,1603,10,-2,2,3,8,0", "740,1603,0,-6,-5,0,0,-5,5,-3,-1,-11,8,-5,0,-3,-4,0,2,-3,-3,-9,4,1,2,-5,-3,-5,3,-4,-7,-3,1,-4,15,-7,3,4,0,-4,4,0,5,-8,6,6,-4,6,11,6,2,-8,-3,-5,3,-4", "754,1475,8,-2,7,-7,-6,-17,14,-4,-5,-9,3,-5,-4,-9,1,-5,4,-2,-2,-5,10,0,1,-7,10,-5,-2,-6,2,2,4,-5,-1,-3,-5,1,-1,-4,-4,0,0,-5,5,0,0,-5,3,1,3,-4,2,5,3,0,1,-8,3,3,7,-2", "601,1426,20,-6,4,-6,13,6,-1,8,-5,7,15,-4,15,5,4,-4,12,0,4,-3,5,2,-2,9,16,7,1,5,12,3,0,5,7,3,-1,15,21,2,1,-11,5,-3,7,9", "601,1426,-1,-16,5,-6,3,-15,7,-2,0,5,20,-2,-9,-9,5,0,-19,-16,0,6,-9,10,-1,14,-3,-1,14,-128,1,-42,9,-17,9,-2", "1222,1677,22,-15,15,4,18,-23,12,-3,0,-4,7,-2,21,-20,17,-6,6,1", "1128,1635,1,1", "1129,1636,5,-2,5,-8,3,1,-1,-10,3,0,-9,-10,4,-19,11,3,6,6,6,-5,14,-3,3,-8", "480,599,-2,-6,13,-1,-1,3,3,0,0,4,5,4,-2,4", "505,612,-3,1,1,-4,-4,-5,5,1,-1,-4,-7,-1,-3,-10,5,-2,2,-5,4,1,2,-5,5,3,8,-4,1,6,-5,7,6,7,9,2,27,-5", "557,595,6,9,-1,7,6,11,7,1,1,5,7,1,5,-3,-1,-3,9,-4,4,-8,26,7", "603,758,3,-4,-1,-5,4,-2,-1,-5,3,-1,2,-13,7,-6,6,2,7,-3,0,-15,-5,-7,-6,-29,1,-8,6,-7,-1,-13,-4,-5,3,-7,-1,-12", "602,765,1,-7", "484,794,16,-12,4,4,13,-8,28,0,4,-10,5,-4,17,-5,-2,-6,13,1,3,6,17,5", "458,693,5,8,-1,6,12,-3,-3,6,-7,-1,-4,4,-2,9,7,-2,7,4,6,-1,9,13,-5,5,0,9,6,0,2,-4,2,7,-1,4,-3,0,0,5,-8,4,9,4,-10,6,5,18", "957,883,17,-11,12,4,-1,-7,9,0,0,-4,8,0,0,3,9,-3,8,9,3,-2,6,4", "936,1043,2,2,3,-3,1,5,6,-3,6,2,3,-3,-2,-2,6,-1,8,11", "894,970,6,4,2,6,-5,14,3,7,7,5,7,0,1,7,10,-1,6,5,2,13,4,1,0,3,4,-1,-5,10", "894,970,5,-2,7,5,4,-6,4,1,-4,-9,5,-8,2,-19,4,-3,-1,-8,6,-7,8,-2,13,4,5,-10,3,0,0,-6,6,-1,1,-3,-5,-13", "859,781,3,-3,1,5,4,-3,5,4,5,-3,11,4,5,-3,-3,9,3,2,0,7,5,-1,2,-5,11,2,0,7,4,-5,3,2,3,7,2,-1,-5,8,4,1,2,13,4,-1,2,3,-2,4,-4,0,5,7,-3,18,8,7,2,-4,9,0,12,21", "781,887,4,4,0,5,6,-2,5,6,3,-3,3,5,-4,6,13,-2,-1,5,6,-2,1,12,-3,1,5,12,5,-4,11,4,9,-6,13,1,-5,-10,7,-1,2,5,9,2,1,15,10,8,-1,2,4,0,2,12,8,8", "781,887,0,-7,4,-3,0,-15,8,-9,0,-5,6,-4,-4,-4,4,-3,0,-8,5,-9,1,-6,-3,1,-1,-4,5,-6,0,-7", "806,798,3,-1,18,9,2,-5,-5,-5,3,-5,6,6,5,-6,11,-2,10,-8", "1551,1198,15,27,1,8,8,-1,15,10,3,-5,-4,1,3,-6,-1,-7,7,-3,11,10,12,1,8,12,-3,4,4,0,-1,7,-8,6,-1,12,5,5,-2,10,7,-2,4,5,4,-2,1,5", "1431,1229,0,18", "1431,1229,16,-14,-13,-12,6,-1,5,3,5,-6,14,0,1,-4,5,2,0,-6,10,-9,-1,-2,8,-2,-3,-5,-7,-2,1,-5,-4,1,-1,-5,4,1,2,-5", "1536,859,8,10,9,0,4,-4,5,2", "1612,1037,3,-5,-2,-5,11,-14,-2,-5", "1500,924,1,11,6,-3,4,11,9,-2,1,6,6,1,2,4,0,3,-8,-2,-11,4,1,4,8,5,-4,8,4,0,1,10,4,3,-2,3,4,3,-7,5,3,2,-1,4,-6,0,-1,3,0,9,9,4,0,4,-7,4,-7,-1,-1,4", "563,1614,7,-2,1,5,5,0,2,4,8,0,10,-1,17,-9,5,6,-5,1,-1,4,4,0,8,-6,13,3,-2,-7,22,0,0,-3,6,0,3,-5,9,8,1,-4,8,-3,-1,4,8,3,4,-4,4,3,13,-10,2,3,-4,2,1,4,7,-4,10,4,7,-7,5,0", "563,1614,11,-22,19,-101,8,-65", "754,1475,2,15,18,0,5,4,13,1,-10,20,2,9", "984,724,6,-2,-6,12,5,2,5,8,-9,10,6,7,-3,5,7,6,-2,3,4,-2,1,-5,13,5,3,15,7,5,3,-4,5,0,0,-7,3,0,-1,3,10,-1,4,5,6,-5,27,0,1,4,3,0,1,8", "859,781,-2,2,-3,-6,6,-7,7,-4,4,1,-2,-4,3,0,9,-11,-2,-12,4,-2,4,4,-1,-8,5,-2,-4,-9,3,-10,-6,0,0,-7,7,-2,0,-3,-5,-1,4,-1", "1313,1065,-1,13,11,1,2,7,6,0,10,-6,4,5,7,0,3,-4,2,3,5,-2,-1,6,4,1,9,-7,3,2,3,-8", "1380,1076,5,2,-4,3,6,5,-2,6,-7,-2,-6,3,-3,13,-8,4,9,9,-9,4,13,11,-3,5,2,5,8,3,-2,16,-4,2,1,5,6,1,-5,14,6,9,9,6,-1,3,21,2,3,7,3,-1,-2,-4,5,-1,0,4,-5,4,0,8,7,3,3,-4,5,8", "1312,1249,2,4,4,-8,6,0,5,8,3,-4,4,4,2,-5,10,-1,-1,-4,4,-2,3,3,7,-1,3,5,9,-2,4,6,-5,4,6,4,-3,5,5,4,7,-4,6,8", "1284,1134,8,6,0,4,-5,2,2,8,-5,9,6,2,-1,5,7,5,0,7,6,12,16,10,3,15,3,2,-3,12,-9,5,0,11", "1238,1326,7,4,1,11,8,17,12,-5,4,2,1,-11,6,0,4,5,-1,5,11,-2,2,8,2,-1,5,8,4,-2,0,6,4,0", "1204,1250,9,0,8,-9,6,0,2,-5,4,1,1,4,4,-6,3,5,11,0,5,-6,3,6,8,1,5,11,7,-4,2,-5,4,2,-1,3,11,2,1,-6,4,-2,3,1,0,4,8,2", "434,830,4,-5,4,4,12,-1,2,-11,5,0,2,4,9,-3,-1,3,4,1,1,-6,8,-3,0,-19", "602,765,-2,9,9,2,6,19,20,7,-8,7,3,2,-1,8,4,3,7,-1,3,13,0,9,-4,3,-23,0,-6,4,-15,2,-8,7,8,0,6,12,4,1,3,-3,3,3,2,13,-10,7,2,4,-4,4,11,1,2,5,6,1,-1,5,-4,2", "500,914,5,7,4,0,2,7,10,1,0,5,12,0,1,8,24,6,8,-4,-6,-9,4,-3,-4,-3,-1,-13,7,-4,4,1,2,22,13,-6,-2,-15,5,-3,7,2,-2,-1,5,-9,10,9,7,2", "434,830,3,7,-7,0,-10,8,5,2,3,6,-1,7,-5,2,14,6,4,0,0,-4,6,0,10,9,16,-9,3,22,-12,8,27,7,10,13", "1180,687,12,6,3,13,10,8,-3,3,4,6,-3,8,-14,10,-1,6,5,3,-3,3,2,10,-6,0,-7,5,-11,0,-1,9,5,-1,6,12,4,2,-3,6,6,10", "1171,816,-4,-4,2,-3,14,0,2,-3", "1049,663,14,-2,2,-3,0,3,8,-1,-2,-3,4,1,3,-7,6,3,0,6,3,-3,4,1,4,-5,4,5,7,-2", "1106,656,3,13,6,0,7,5,0,13,-5,0,-6,8,2,1,9,-1,2,-3,24,3,7,-5,-3,-3,9,-1,-1,6,4,2,6,-5,10,-2", "921,1444,10,-3,0,4,-7,1,-1,3,5,3,1,5,8,1,-1,4,5,4,3,-2,2,3,1,-4,7,-2,-3,12,7,1,3,5,12,-8,4,-8,5,2,3,3,-1,4,4,2,5,-3,-4,-7,3,-1,-1,-3,3,-1,7,7,-1,-6,4,2,10,-7,5,3,2,-5,6,2,7,-3", "921,1444,-11,-33,4,1,8,-7", "876,1507,1,-7,3,-3,4,1,-1,-7,10,4,4,-3,0,-6,-4,0,-1,-4,7,0,3,-15,3,-1,-4,-6,-4,1,-3,-3,3,-4,0,-10,4,-1,3,6,8,-3,7,2,2,-4", "603,758,12,7,18,-1,6,4,3,-1,-2,-4,3,-2,15,9,0,-4,3,0,10,6,11,1,7,0,3,-4,8,1,2,-7,9,6,6,-2,-1,-3,5,4", "721,768,2,9,27,0,-7,5,4,8,6,3,5,0,1,-5,12,5,2,-3,3,6,14,3,4,5,5,-3,0,-4,7,1", "760,907,1,-7,8,3,0,-9,7,-9,5,2", "651,925,5,1,1,-4,8,-3,10,4,6,-4,3,3,7,-1,8,-7,-3,-6,9,-5,5,1,-3,2,1,3,2,-3,8,1,1,-5,11,0,5,-3,12,2,2,-3,5,1,-4,8,10,0", "615,914,13,5,11,-3,2,5,4,-3,6,7", "655,620,1,-4,9,-6,7,-15,-5,-4,5,-8,-8,-4,-4,-6,-4,1,2,-4", "626,618,7,4,7,-1,1,-4,5,0,2,4,7,-1", "557,595,15,1,7,-5,8,2,-7,-4,3,-6,-9,6,0,-3,-8,-3,-2,-7,-8,-6,1,-12,-5,-6,4,-4,2,-14,2,7,-1,-26,3,-2,4,3,-6,-4,-4,3,0,5,-3,-5,-2,-16,4,-7,-4,-16,6,-1,-6,-2,-2,5,-7,-14,3,0,-8,-9,4,-1,-6,1,-8,-10,4,1,-2,-2,-5,2,-5,-26,-6,-4,0,-4,7,-7,-2,-13,-3,-4,-10,-3,0,-10,5,0,3,4,6,-2,3,5,19,3,1,3,9,0,-2,3,3,0,0,-3,12,1,6,-8,7,-2,22,2,5,18,-4,-2,-2,9,1,-3,-5,1,-1,8,19,25,-1,10,8,2", "1458,473,6,5,-7,4,8,21,0,7,-5,5,10,0,0,6,-5,0,5,6,-3,6,-9,1,-5,5,-1,7,4,6,-7,5,1,4,6,1,1,4,9,6,1,6,-3,0,2,2,-3,3", "1419,614,17,0,1,-8,-3,1,-2,-6,13,-4,-2,-7,-10,0,1,-4,6,-2,6,3,6,-5,4,3,3,-3,4,1", "1255,550,1,7,-12,1,5,1,1,4,-5,0,-2,6,5,-1,2,5,3,-1,1,10,-5,3,2,8,10,-2,-1,2,5,3", "1463,583,3,1,-1,14,5,-1,2,-4,2,8,7,0,1,4,6,2,7,8,15,3,3,6,7,1,1,6,7,5", "1528,636,1,0", "1528,636,1,0", "1528,636,-9,6,7,2,-4,8,2,2,6,-5,7,1,8,14,4,-2,5,3,-1,7,7,1,6,7,-7,4,-2,15,-3,0,-2,5,4,2,1,-3,7,8,4,-1,7,11,-3,3,1,5,3,2,6,-6,5,10", "1516,799,7,-15,15,1,4,-6,3,0,2,7,13,-3,0,-11,3,-1,0,-4,-5,-3,2,-8,8,0,2,-8,9,2,1,-8,2,-3,5,1,0,-5", "655,620,6,9,5,-2,2,6,7,-3,-3,-2,1,-3,4,2,3,-4,3,1,2,7,7,-6,5,1,6,-8,17,0,-1,2,5,3,6,-8,6,4,4,-5,-1,-7,6,0,9,7,-4,4,3,11,14,0,-1,15", "721,768,0,-8,-6,-1,-3,-5,5,-6,5,1,1,-5,-5,-3,-1,-5,19,-7,-4,-2,-1,-8,-4,-1,0,-7,9,-4,6,1,-1,-8,3,-3,-4,-2,-1,-7,14,-9,-2,-11,4,-8,-3,-8,4,0,-1,-5,3,-2,8,-1", "1530,420,10,-3,1,-3,8,5,3,-8,4,-2,13,3,3,-5,16,14", "1588,421,7,3,-3,21,8,6,-5,2,5,6,4,-1,-1,7,4,5,0,4,-7,6,0,3,7,4,-7,4,4,6,-11,1,-1,4,3,1,2,8,12,6,-2,6,6,1,1,3,5,-1,2,7,13,-1,0,3,6,-2,3,4,3,-1,2,5,-4,2,2,4,-4,4,8,2,-6,2,8,2,0,7,7,1,4,-3,10,9,8,-2,5,8,9,2,0,7,2,-3,2,3,9,0,0,4,10,1,3,5,8,0,3,-3,2,5,9,0,-3,4,6,2,2,6,5,1,-4,2,3,0", "1752,613,-2,2,4,2", "1754,617,4,0", "1754,617,4,0", "1570,621,20,0,-3,5,2,5,-6,7,6,1,0,-6,4,0,-3,6,6,1,0,8,5,2,13,-2,1,-5,4,6,5,-5,0,-6,4,0,1,3,7,-1,6,-6,6,5,8,-2,1,5,6,-5,6,1,6,-4,9,3,-3,-5,8,-7,3,10,10,0,10,6,9,-8,3,4,3,-1,11,-12,16,-7", "1530,420,-2,9,4,1,-2,4,5,2,-2,3,-7,0,5,2,0,3,3,-6,20,-5,6,4,0,5,7,7,-3,6,7,4,-7,11,3,3,-2,8,5,-1,-2,9,3,4,-3,3,2,3,8,-1,-2,10,4,-1,3,5,-4,1,-3,9,6,8,-8,1,-1,4,-5,1,6,7,-4,2,3,9,-4,7,3,1,-6,4,1,4,-4,1,7,8,-3,10,2,7,7,-1,-2,4,-4,-1,-7,6,2,5,7,3,-2,9", "1519,397,9,10,-2,3,3,5,-3,1,4,4", "1529,636,7,2,0,-4,8,0,3,-3,4,4,-1,-4,5,-3,-2,-2,11,2,6,-7", "288,790,7,6,7,-2,-3,-3,-11,-1", "323,846,2,-4,7,5,6,0,2,7,12,4,-5,6,-10,-4,-9,1,-5,-15", "286,766,10,15,10,-1,5,-11,-7,-10,1,-4,7,17,3,-2,-1,-3,1,2,5,-4,0,-4,-3,10,-6,2,1,4,-3,1,7,0,4,5,-4,-3,-7,2,10,0,10,9,3,-7,-3,-3,4,1,-1,-3,4,0,0,-5,-4,-3,6,3,2,-4,-1,5,6,0,-3,0,0,4,-3,-2,-3,3,4,0,-3,4,-4,-1,-3,3,2,10,4,1,4,7,1,7,-4,4,4,10,6,1,-6,-10,1,-16,5,4,-1,3,6,-1,1,-3,4,4,0,-5,2,5,2,-4,1,5,7,1,-5,-6,2,-2,-3,-3,3,-1,-3,-9,2,7,3,-1,-2,5,3,3,2,-3,-1,4,4,2,0,-6,5,1,0,-5,10,1,-1,-3,5,-1,2,5,-5,-1,9,5,-1,-4,3,2,0,-3,-3,-2,1,-3,3,1,-2,2,3,5,-3,6,-2,-2,-2,9,-4,1,-3,-4,-3,3,-2,-3,0,4,-4,0,-4,-6,-6,3,8,4,4,8,6,1,7,-4,9,3,2,-6,5,0,-6,-5,6,3,2,-7,1,7,3,-3,-1,-4,1,3,3,-1,-3,3,2,2,-5,0,-3,5,4,-3,13,-1,8,4,-2,4,-6,-2,1,9,5,0", "286,764,1,-5", "285,757,2,1", "285,753,0,2", "285,752,2,-2", "1752,613,13,1,13,-12,-2,-2,4,-6,-3,0,6,-6,-5,0,-3,-7,9,-14,-3,-7,-4,0,0,-4,-4,-2,-6,0,0,-4,-6,1,-2,9,-7,3,-2,-3,3,-3,-5,0,0,-6,6,-1,0,-3,-6,1,0,-3,-13,-4,-2,-8,4,2,3,-7,5,1,0,-7,7,-12,-1,-5,7,1,-3,1,3,12,24,6,-1,4,4,2,18,-5,12,8,6,-5,8,-20", "1588,421,10,0,2,9,9,0,1,-3,7,2,3,-7,5,0,1,-4,15,1,4,6,8,3,10,-3,16,10,-2,4,9,7,-5,5,14,13,-1,5,4,1,1,7,4,-1,-2,6,4,5,6,-1,7,4,4,-6,-4,-6,9,0,4,-3,3,4,12,3,2,15,5,-3,0,-5,10,7,12,-2,7,3,4,-6,5,0,1,-6,11,-2,-2,4,8,-1,0,7,5,8,14,4,1,4", "1185,806,6,3,11,-7,3,2,0,8,2,-1,4,6,5,-2,6,8,6,-4,7,7,6,-3,1,-5,14,3,2,-13,2,8,9,4,0,9,5,-2,7,3,8,11,8,-2,0,3,6,2,-1,-5,6,-6,4,4,-5,4,1,5,11,-2,1,-3,6,17,4,0,3,-6,8,0", "1352,890,3,-1", "1275,970,21,2,3,8,6,-5,12,-3,9,-8,9,0,0,-8,-3,-3,8,-7,-8,-7,0,-16,-4,3,-2,-3,8,-5,3,-9,-5,-4,1,-7,10,-3", "1187,293,4,-4,3,1,3,-5,4,1,-3,8,-8,3,-3,-4", "1060,119,7,3,-2,-3,6,-6,4,6,-1,-4,3,0,0,-3,3,2,18,-6,7,2,21,-8,3,17,5,3,4,9,-6,5,3,10,-2,4,5,7,11,0,10,18,8,0,8,7,6,-12,9,-5,10,1,4,-5,5,1,6,13,9,4,1,6,-4,3,6,13,1,14,11,4,1,3,11,-3,3,-6,6,2,-2,8,7,-3,8,1,7,8,2,11,-3,7,7,12,1,-3,2,2,1,-8,4,-1,11,0,6,3,0,3,20,-6,6,9,6,1,2,10,5,-1,-3,-3,2,-3,6,3,2,5,-10,7,1,11,-4,5,10,0,4,14,-11,5,-2,5,4,4,-3,3", "1201,309,4,6,7,3", "1060,119,9,8,11,31,10,7,4,-2,7,3,1,-3,5,4,-10,5,7,8,-4,3,2,3,4,-2,12,10,6,-3,1,4,7,-3,6,4,5,-1,0,-3,10,7,2,-6,5,0,-5,-3,1,-3,6,-1,8,8,-11,9,4,3,-3,4,1,5,12,-3,0,8,10,-3,10,7,-4,4,2,3,3,1,4,-4,0,7,-12,4,3,9,11,9,-5,4,1,3,-3,-2,-3,4,15,0,9,7,-8,7,4,4,-8,3,5,5,-6,4,3,3,-1,5,-3,0,1,5", "1020,368,8,4,-3,3,4,5,7,0,4,-4,4,4,2,-4,11,3,0,4,13,-1,3,-3,9,0,10,5,2,-2,7,7,11,0,4,7,4,-4,5,5,3,-1,-1,3,3,2,7,-3,0,6,3,2,5,-11,14,3,2,-10,7,0,1,-5,4,3,-3,-6,2,-3,1,3,4,-1,4,7,0,-5,6,-3,4,6,6,-7,3,1,-1,4,6,-3", "1132,504,6,-6,8,9,5,-2,0,3,7,-2,-2,-3,6,-3,6,6,7,-3,5,2,3,-3,4,4,1,-4,9,1,1,-6", "1009,473,5,2,-3,4,3,5,9,-1,5,2,-1,2,6,-2,1,3,12,-5,4,2,10,-7,3,0,2,5,3,-2,1,3,4,0,0,3,8,-3,0,6,7,-1,7,-6,4,7,4,-2,17,8,-2,3,6,1,0,-4,3,-1,0,5,5,4", "1011,438,10,-19,-3,-2,-3,5,-4,-3,4,-7,-3,0,-1,-8,-3,2,4,-4,-3,0,3,-6,-3,-5,7,-10,-3,-1,-2,4,-3,-3,3,-2,-1,-6,4,0,2,-6,4,1", "766,644,5,-3,11,3,2,-6,12,-6,-2,-4,4,2,-1,-2,6,-3,12,-1,8,4,4,7,-2,8,3,13,11,4,3,-2,0,6,9,7,11,2,-1,-5,7,1,10,15,6,-3", "1000,249,5,5,11,-6,8,0,13,10,7,-4,-2,8,18,7,2,11,7,-2,2,4,3,-4,10,0,3,-4,4,4,5,-1,0,-5,4,7,6,-6,7,1,6,6,-12,5,-5,12,7,6,4,-9,8,-2,3,5,3,-6,4,1,-2,5,3,2,5,-1,1,3,8,0,1,3,1,-10,9,3,1,6,-5,8,4,1,11,-8,3,6,-2,6,12,-7,3,3,6,-4,9,3,2,-2", "999,248,1,1", "999,247,0,1", "999,247,-10,-6,4,-29,10,7,-11,-12,-3,-27,2,-6,0,3,1,-3,3,1,1,-9,-4,-20,8,-1,19,-16,41,-10", "731,1750,-2,-14,6,-3,-2,-12,5,-4,0,-5,6,1,5,-4,-3,-2,1,-10,3,1,4,-4,3,-10,2,3,5,-2,0,-10,3,2,4,-8,-3,-6,2,-9,5,1,3,-4,-5,-5,1,-14,-9,6,0,-10,6,-2,-4,-4,1,-7,-3,-5,-4,1,-1,-7", "563,1614,-10,19,-9,6,0,3,-17,2,-1,3,8,7,0,6,9,-3,7,2,-1,7,3,4,4,0,2,-8,4,-1,13,6,4,-2,4,4,0,13,-3,2,-2,11,-8,7,5,9,12,3,1,-13,3,-4,7,-1,-5,10,6,5,5,-2,8,3,4,6,5,-2,3,4,10,1,5,7,23,2,8,-4,4,10,-2,4,2,3,6,0,11,11,0,5,5,0,-1,5,6,-2,4,-8,8,7,8,-1,4,-7,6,-3", "758,1653,1,5,5,0,-1,-12,-4,0,3,7,-4,0", "754,1666,5,-8,3,11,-5,3,-3,-6", "731,1750,13,11,6,2,2,-3,6,15,6,1,2,6,8,1,24,-10,7,4,4,-1,5,9,10,-10,8,7,8,-2", "1021,1805,-8,5,-1,10,15,3,7,7,7,-1,4,15,7,7,14,-7,4,-8,9,1,7,-5,8,2,6,6,10,1,0,4,11,8,9,-5,13,4,-3,-9,3,0,0,-4,7,-4,8,3,8,-10,11,1,3,-5,4,3,10,-2,6,10,12,-2,-2,-8,-4,-1,1,-7,-12,-6,-1,-59", "1044,1827,4,4,4,-1,-4,-4,1,-5,-5,6", "1821,696,13,-22,3,-15,7,-4,-2,-15,5,-18,6,-6,-1,-14,5,-11,8,-4,10,-12,0,-7,6,0,3,-6,5,0,4,-4,7,-20,6,-9,5,-2,-20,-5,-7,-6,-8,-1,-6,-7,-2,4,-4,-2,-3,3,-9,-6,-5,4,-18,-2", "1768,658,11,1,4,4,-2,3,6,-1,-3,3,2,3,4,-1,17,9,-1,9,7,2,0,5,8,1", "1758,617,1,3,-5,0,3,3,-4,16,3,6,-4,5,8,4,6,-2,2,6", "1759,819,4,3,6,-1,-4,9,3,3,6,-1,1,4,8,-4,11,2,10,-8,-5,-2,1,-3,8,3,4,-3,-2,-5,4,0,-4,-4,9,-8,3,1,1,-6,-10,-11,-1,-7,5,-7,-3,-11,5,-11,-1,-9,3,-1,1,-10,5,-6,-7,-12,1,-18", "1720,755,3,9,6,0,17,11,-1,5,3,4,-2,6,-3,0,-1,10,11,1,8,14,-2,4", "1720,755,10,-4,-3,-9,4,-3,-2,-3,4,-16,10,-6,2,-9,8,-9,-4,-5,19,-33", "1380,1076,1,-13,5,-4,8,3,2,4,6,0,3,-5,5,6,4,-7,7,-1,4,5,-5,4,8,5,-2,9,4,4,4,-1", "1587,735,5,-4,2,-7,3,4,-4,4,3,1,3,-5,5,0,3,-8,14,-5,5,9,-3,2,8,4,0,4,10,-5,16,-1,6,3,6,12,9,-3,2,-6,7,-3,7,10,17,9,6,7", "1714,807,2,-3,-6,-7,4,-4,-7,-18,1,-7,9,-11", "1690,1298,7,-6,8,1,4,-5,11,7,7,-3,-1,-6,8,0,2,-8,11,-3,5,3,8,-9,-4,-14,4,-1,-1,-3,5,-3,3,-9,-10,-6,-2,-7,-7,0,1,-5,-8,-2,0,-13,-3,-3,3,-11,-4,-3,-8,1,-1,-6,-5,0,-7,-6,-2,-14", "1580,1132,4,2,2,21,4,0,1,4,7,-2,-1,4,3,0,-1,5,3,4,14,1,1,3,0,-6,9,1,4,5,-1,7,6,-2,-1,5,15,-3,6,-13,-2,-2,9,-7,3,-11,8,-10,9,6,-2,4,-3,-1,2,8,7,7,8,-2,3,4,1,11,4,0,6,-9,6,-2", "1597,1094,13,-4,12,2,12,-13,9,-3,3,-7,-3,-2,-4,3,-3,-7,2,-8,8,-9,5,0,1,4,5,2,16,-13,7,2,23,-3,11,3,0,4,-5,4,4,7,9,6,0,5,-8,11,-1,15,14,2,-4,15,9,-3,12,16,-2,3,5,8,-6,6,0,5,-8,6,-9,-1,-1,5,-7,-3,-2,12", "1094,540,-1,0,0,1,-3,1,0,1,-1,0,0,1,-3,0,-1,1,-3,1,-1,3,3,1,1,1,0,2,2,0,0,1,2,0,2,1,5,1,0,1", "1094,540,11,0,0,3,1,1,1,0,0,4,1,2", "1096,557,2,0,1,-1,0,1,1,0,3,-1,3,-2,0,1,3,0,1,1,2,0,1,1,1,0,0,-2,1,0,-1,-1,1,-1,-1,-1,0,-1,-3,0,0,1,-2,0,-1,-1,0,2,-1,0,1,-3", "965,307,4,2,1,-3,4,0,1,7,8,4,14,16,9,3,7,21,7,11", "821,432,-30,-5,-8,-8,13,-36,6,-6,17,-5,35,-23,26,-3,26,-10,10,1,11,-4,38,-26", "1129,582,0,-1,2,0,-1,-1,-1,0,0,-3,1,0,1,-3,1,0,0,-2,-1,0,0,-1,1,0,0,-1,1,1,0,-3,2,0,0,-2,-1,-1,-1,0,0,1,-1,0,-1,-1,0,-1,1,0,-1,-1,1,0,0,-1,1,-1,-1,-1,1,-1,-1,0,0,-1", "1127,518,2,0,-1,1,1,0,0,1,1,0,0,4,-2,0,0,1,2,3,1,1,1,0,0,3,1,0,0,3,-1,0,-1,1,1,1,0,2,-1,0,0,2,-1,0,0,1,-1,-1,0,1,-1,0,-1,1,1,0,0,1,1,0,0,2,1,1,1,0,0,2,-2,0,2,4,0,2,1,-1,0,3,1,1,-1,0", "1127,518,-3,-3,8,-4,-3,-2,3,-5", "1180,687,-1,-3,6,-3,-1,-2,5,0,6,-9,-5,-11,5,-11,8,2,5,-5,16,2,1,-3,14,2,1,-6,6,2", "1106,656,-1,-3,5,0,0,-6,5,-2,1,-4,10,-1,-7,-8,0,-17,6,-14,-4,-7,4,0,-1,-6,2,-3,3,2,0,-5", "996,504,9,0,7,7,15,-6,5,4,-1,8,7,-7,4,6,7,0,3,4,9,0,6,-4,0,6,8,4,-1,4,5,0,-1,8", "1078,538,-4,3,-1,0,0,3,-1,0,-1,1,0,1,1,0,-1,1,1,0,-1,1,0,1,1,1,-1,0,-1,3,1,2,0,2,1,0,1,1,0,-1,1,0,1,1,0,2,1,0,-1,1,3,-1,0,1,1,0,0,1,1,1,1,0,0,2", "1081,565,1,1", "1040,629,-2,-4,3,-1,1,-7,5,-2,-6,-7,11,1,3,-10,4,-2,-7,-5,0,-4,2,1,2,-7,8,-1,1,-9,4,1,2,-4,5,0,0,-4,6,1", "760,907,2,16,7,-1,-2,6,6,11,-4,6,9,4,-1,3,-5,-2,-5,4,8,3,-5,5,1,6,8,6,-5,2,-2,9,-8,9,6,1,4,-4,-2,6,5,0,2,5,-7,5,3,5,-6,3,1,8,-3,0,1,3,4,-1,0,16,7,4,-3,10,9,4,6,-9,7,3,-3,6,3,5,-6,3,2,7,-5,4,0,5,3,0,3,6,9,-1,-3,13", "651,925,-2,2,5,1,-2,3,5,0,-2,2,7,3,-3,7,6,8,12,6,-4,10,10,12,-3,3,6,5,-3,6,6,2,-2,10,4,8,-6,2,0,4,5,10,-5,12,3,1,3,-5,8,5,-2,6,-7,0,-6,9,-7,-2,-3,5,-4,-1", "965,307,10,-9,3,-12,7,-8,5,-1,4,6,12,1,-2,-7,-6,0,-4,-8,-5,0,-3,-5,3,-17,10,0", "999,248,1,1", "989,1536,3,-4,-6,-1,0,-3,12,0,-1,-3,6,-4,-1,-3,6,-2,1,-6,-6,-4,2,-4,-3,-1,0,-4,10,-1,7,5,4,-6,5,4,0,-8,7,0,2,3,1,-7,4,4,7,-1", "1663,1715,0,4,5,-2,5,-8,-10,6", "1654,1719,5,2,2,-3,-2,-2,-5,3", "1626,1719,4,5,8,-4,-2,-5,-4,5,-6,-1", "1569,1574,0,1", "1558,1684,3,7,3,-1,4,4,3,-2,0,5,6,1,-3,8,5,4,5,0,4,-6,3,3,5,-1,-2,-3,-6,1,2,-5,-4,-1,6,-3,1,5,11,-1,1,5,14,-1,2,8,-5,1,0,3,11,-1,-4,-5,7,-12,11,-1,5,2,1,4,7,0,-1,-9,5,-3,15,-1,8,-7,7,6,4,-2,0,-4,5,-2,-3,-6,5,-7,-3,-3,-1,3,-4,-2,-6,3,-1,-4,11,-6,1,-6,6,-1,4,-15,15,2,0,-4,5,0,6,-10", "442,975,5,6,11,1,-8,-8,-8,1", "500,914,-7,4,-5,15,-7,5,1,3,-6,1,1,12,38,40,8,27,5,0,9,9,8,3,0,3,21,4,5,12,17,-1,7,11,3,0,-3,0,0,-7,12,12,1,-10,5,-2,5,3", "455,915,7,-1,5,3,0,5,-3,-2,1,5,11,5,1,11,-10,-14,-7,0,-5,-12", "888,1094,3,-2,-2,-9,-6,-5,2,-3,6,-1,0,-4,7,-8,15,2,6,-17,11,4,0,-4,6,-4", "1717,757,3,-2", "1733,833,8,-3,-2,-9,5,-2,8,3,7,-3", "1081,565,1,0,0,1", "1082,566,0,1,2,0,0,1,4,0,0,1,1,0,0,1,1,0,-2,2,0,1,2,0,1,-1,1,0,0,2,2,0,0,-1,-1,-1,1,0,0,-2", "1094,570,2,0,0,1,1,0,0,1,3,0,0,-1,1,0,0,5,3,0,0,-1,1,1,0,-1,2,0,0,1,1,0,1,-1,2,0,0,1,1,1,0,-1,1,0,0,-1,1,0,1,-1,6,-1,1,5,1,0,1,3,1,-1,0,1,1,0,0,1,3,0", "1090,530,3,0,1,1,2,0,0,1,1,0,0,2,-1,0,0,1,-2,2,-1,0,1,1,0,2", "1094,570,-1,0,0,-2,1,0,0,-2,1,-1,0,-2,-1,-1,1,-3,-1,0,0,-1,1,0,1,-1", "1078,538,1,0,0,-1,1,0,2,-3,1,0,2,-2,1,0,0,-1,4,-1", "1108,550,2,0,0,-1,1,0,1,1,0,-1,3,0,0,-1,4,0,0,1,2,0,0,1,2,0,0,1,1,0,0,1,1,1,2,0,0,1,1,0,0,1,1,0,0,2,1,1,2,0", "1090,530,1,0,-1,-2,1,-1,1,0,0,1,1,-1,0,1,2,0,1,1,1,-1,0,-1,1,-1,1,1,0,-1,1,-1,5,2,0,1,1,0,0,1,1,-1,3,0,0,1,4,0,0,-1,2,-2,0,1,1,-1,0,1,1,-1,0,-1,2,0,-1,-1,2,0,0,-1,1,0,0,-1,2,-3,3,0,0,-1"];
// [code, nom, région, préfecture, xÉtiquette, yÉtiquette, xPréf, yPréf, superficie km², anneaux (indices d'arcs, ~i = sens inverse)]
const GF_DEPS = [
    ["01", "Ain", "84", "Bourg-en-Bresse", 744.0, 549.0, 749.3, 539.6, "5 800", "0 1 -3 -4 -5 -6 -7"],
    ["02", "Aisne", "32", "Laon", 634.5, 189.5, 637.1, 203.2, "7 400", "7 8 -10 -11 -12 12 13"],
    ["03", "Allier", "84", "Moulins", 616.5, 523.5, 616.7, 503.6, "7 400", "14 15 -17 -18 -19 19"],
    ["04", "Alpes-de-Haute-Provence", "93", "Digne-les-Bains", 821.5, 752.0, 817.7, 750.9, "7 000", "20 -22 -23 -24 -25 25"],
    ["05", "Hautes-Alpes", "93", "Gap", 836.0, 691.0, 805.9, 702.1, "5 700", "26 27 -21 28 29"],
    ["06", "Alpes-Maritimes", "93", "Nice", 886.0, 766.5, 887.0, 788.7, "4 300", "30 -32 22"],
    ["07", "Ardèche", "84", "Privas", 686.0, 696.5, 704.3, 687.8, "5 600", "32 33 34 -36 36 -38 -39 39 -41"],
    ["08", "Ardennes", "44", "Charleville-Mézières", 703.5, 202.0, 712.8, 182.5, "5 200", "41 -43 -44 9"],
    ["09", "Ariège", "76", "Foix", 493.0, 866.5, 498.0, 863.5, "4 900", "44 -46 -47 47"],
    ["10", "Aube", "44", "Troyes", 676.0, 331.5, 668.6, 330.4, "6 000", "48 49 50 -52 -53"],
    ["11", "Aude", "76", "Carcassonne", 549.0, 850.0, 548.9, 839.1, "6 300", "53 54 55 56 -58 -59 -45"],
    ["12", "Aveyron", "76", "Rodez", 571.0, 725.0, 564.2, 724.2, "8 800", "59 60 -62 -63 -64 -65 65"],
    ["13", "Bouches-du-Rhône", "93", "Marseille", 723.5, 792.0, 761.4, 830.7, "5 100", "66 -68 -69 69;-71"],
    ["14", "Calvados", "28", "Caen", 353.5, 249.5, 361.4, 241.5, "5 600", "71 72 -74 -75"],
    ["15", "Cantal", "84", "Aurillac", 564.0, 646.0, 555.6, 667.5, "5 800", "75 76 -78 -60 -79 79"],
    ["16", "Charente", "75", "Angoulême", 403.5, 579.5, 397.0, 595.3, "6 000", "80 81 -83 83 -85 -86"],
    ["17", "Charente-Maritime", "75", "La Rochelle", 336.5, 570.5, 305.7, 543.9, "7 000", "-87;87 88 85 -90 -91 -92;92"],
    ["18", "Cher", "24", "Bourges", 563.5, 452.5, 553.0, 452.5, "7 300", "93 94 -20 -96 -97 97"],
    ["19", "Corrèze", "75", "Tulle", 510.5, 630.0, 508.7, 632.6, "5 900", "98 99 -80 -101 -102 102"],
    ["21", "Côte-d'Or", "27", "Dijon", 720.0, 427.0, 735.0, 427.7, "8 800", "103 -105;51 105 106 -108 -109 -110 110"],
    ["22", "Côtes-d'Armor", "53", "Saint-Brieuc", 168.0, 312.5, 196.0, 308.5, "7 000", "111 112 -114 -115 -116 116 117 118"],
    ["23", "Creuse", "75", "Guéret", 528.0, 550.0, 516.2, 543.8, "5 600", "95 18 -120 -99 -121 121"],
    ["24", "Dordogne", "75", "Périgueux", 436.5, 651.0, 435.9, 640.7, "9 200", "122 123 101 -125 -126 -127 89 84 -84"],
    ["25", "Doubs", "27", "Besançon", 824.5, 442.0, 802.8, 434.4, "5 200", "127 -129 -130 130"],
    ["26", "Drôme", "84", "Valence", 742.5, 694.0, 726.4, 667.8, "6 500", "131 -29 -26 -133 35;133"],
    ["27", "Eure", "28", "Évreux", 451.0, 260.0, 465.7, 258.0, "6 000", "134 135 -137 -138 -139 -140 -141 -73"],
    ["28", "Eure-et-Loir", "24", "Chartres", 483.5, 326.5, 490.8, 315.2, "5 900", "139 141 142 -144 -145 -146 146"],
    ["29", "Finistère", "53", "Quimper", 117.0, 320.0, 104.2, 360.2, "6 700", "115 147 -149 149 150 151 152 153 -155 155 -157 -118 -158;-159"],
    ["2A", "Corse-du-Sud", "94", "Ajaccio", 1009.5, 974.0, 988.1, 966.5, "4 000", "159 -161"],
    ["2B", "Haute-Corse", "94", "Bastia", 1021.5, 917.0, 1038.0, 891.4, "4 700", "-160 161 162 163"],
    ["30", "Gard", "76", "Nîmes", 684.0, 760.5, 687.2, 775.6, "5 900", "164 37 165 -70 -167 -168 61"],
    ["31", "Haute-Garonne", "76", "Toulouse", 488.5, 810.5, 485.8, 800.4, "6 300", "168 169 -171 171 -54 -48 -173 173 174"],
    ["32", "Gers", "76", "Auch", 420.0, 790.5, 426.7, 794.6, "6 300", "175 176 -175 -178 -179 179"],
    ["33", "Gironde", "75", "Bordeaux", 349.0, 679.0, 347.2, 674.2, "10 400", "90 126 -181 -182 182"],
    ["34", "Hérault", "76", "Montpellier", 622.0, 801.5, 654.2, 798.7, "6 200", "167 -184 -57 -56 184 185 62"],
    ["35", "Ille-et-Vilaine", "53", "Rennes", 280.0, 345.0, 270.7, 348.8, "6 800", "186 -112;187 188 -190 -191 -192 -193 113"],
    ["36", "Indre", "24", "Châteauroux", 495.0, 484.0, 504.1, 479.7, "6 900", "193 96 -122 -195 -196 196"],
    ["37", "Indre-et-Loire", "24", "Tours", 432.0, 428.5, 435.0, 420.0, "6 100", "197 -197 -199 199 200"],
    ["38", "Isère", "84", "Grenoble", 787.5, 643.5, 782.2, 641.7, "7 900", "201 -30 -132 -35 -203 203 5"],
    ["39", "Jura", "27", "Lons-le-Saunier", 784.0, 489.0, 770.8, 492.5, "5 000", "204 129 -206 -2 -207 107"],
    ["40", "Landes", "75", "Mont-de-Marsan", 332.0, 764.5, 353.0, 770.0, "9 300", "-208 208 181 209 -180"],
    ["41", "Loir-et-Cher", "24", "Blois", 488.5, 410.5, 477.1, 401.8, "6 400", "144 210 -98 -194 -198 211"],
    ["42", "Loire", "84", "Saint-Étienne", 667.0, 579.5, 692.2, 617.4, "4 800", "212 213 202 -34 -33 -215 -216 16"],
    ["43", "Haute-Loire", "84", "Le Puy-en-Velay", 652.5, 651.5, 656.0, 657.1, "5 000", "214 40 -40 -217 -77 217"],
    ["44", "Loire-Atlantique", "52", "Nantes", 265.0, 424.5, 279.9, 436.8, "7 000", "218 191 219 -221 -222"],
    ["45", "Loiret", "24", "Orléans", 538.0, 366.5, 519.3, 371.7, "6 800", "222 -224 -94 -211 143 224 225"],
    ["46", "Lot", "76", "Cahors", 502.0, 691.0, 486.4, 715.0, "5 200", "100 78 -66 -227 227 124"],
    ["47", "Lot-et-Garonne", "75", "Agen", 417.5, 725.0, 430.2, 739.7, "5 400", "125 -228 -229 -176 -210 180"],
    ["48", "Lozère", "76", "Mende", 630.0, 707.5, 627.4, 707.1, "5 200", "216 38 -165 -61 77"],
    ["49", "Maine-et-Loire", "52", "Angers", 353.0, 420.0, 348.5, 412.4, "7 200", "190 229 230 -200 -232 -233 -234 -220"],
    ["50", "Manche", "28", "Saint-Lô", 301.5, 252.5, 312.4, 249.1, "6 000", "74 -235 -236 -189 236"],
    ["51", "Marne", "44", "Châlons-en-Champagne", 674.5, 258.0, 689.3, 263.5, "8 200", "43 237 -239 -50 -240 10"],
    ["52", "Haute-Marne", "44", "Chaumont", 748.5, 353.0, 742.0, 350.1, "6 200", "238 240 241 -243 243 -245 -106 -51"],
    ["53", "Mayenne", "52", "Laval", 340.5, 342.5, 334.0, 353.9, "5 200", "235 245 -247 -230 189"],
    ["54", "Meurthe-et-Moselle", "44", "Nancy", 809.0, 295.0, 813.6, 291.0, "5 300", "247 248 249 250 -252 -253 -254"],
    ["55", "Meuse", "44", "Bar-le-Duc", 760.5, 258.5, 743.6, 283.6, "6 200", "42 254 253 -256 -242 -241 -238"],
    ["56", "Morbihan", "53", "Vannes", 188.5, 373.5, 196.4, 394.1, "6 800", "-257;257;114 192 -219 -259 -156 259 -154 -261 -152 -262 -150 262 -148"],
    ["57", "Moselle", "44", "Metz", 826.5, 244.5, 814.8, 249.1, "6 200", "-264 -249 264"],
    ["58", "Nièvre", "27", "Nevers", 631.5, 451.0, 604.9, 461.2, "6 900", "223 265 109 -267 -104 -268 -15 -95"],
    ["59", "Nord", "32", "Lille", 625.5, 137.0, 597.3, 96.9, "5 700", "268;269 -8 -271 -272"],
    ["60", "Oise", "32", "Beauvais", 542.5, 217.5, 531.0, 216.4, "5 900", "272 -13 -274 -275 136 275"],
    ["61", "Orne", "28", "Alençon", 401.5, 290.0, 393.1, 316.9, "6 100", "73 140 -147 -277 -246 234"],
    ["62", "Pas-de-Calais", "32", "Arras", 526.5, 102.0, 577.9, 131.0, "6 700", "271 -278 -279 -280 280;-269"],
    ["63", "Puy-de-Dôme", "84", "Clermont-Ferrand", 596.5, 588.0, 602.1, 581.4, "8 000", "17 215 -218 -76 -100 119"],
    ["64", "Pyrénées-Atlantiques", "75", "Pau", 346.5, 836.0, 362.7, 828.0, "7 700", "178 -282 -283 207;283;-285"],
    ["65", "Hautes-Pyrénées", "76", "Tarbes", 397.5, 862.5, 391.4, 836.6, "4 500", "284;-284;177 -174 -286 281"],
    ["66", "Pyrénées-Orientales", "76", "Perpignan", 568.0, 897.5, 587.2, 890.4, "4 100", "58 -287 45;287"],
    ["67", "Bas-Rhin", "44", "Strasbourg", 911.0, 287.0, 923.5, 302.9, "4 800", "-289 -290 -291 -251 -250 263"],
    ["68", "Haut-Rhin", "44", "Colmar", 887.5, 371.5, 897.1, 348.9, "3 500", "289 -292 -293 293"],
    ["69", "Rhône", "84", "Lyon", 708.5, 585.0, 721.0, 584.5, "3 300", "294 6 -204 -214"],
    ["70", "Haute-Saône", "27", "Vesoul", 804.0, 395.0, 812.1, 396.8, "5 400", "295 -297 -131 -205 -107 244"],
    ["71", "Saône-et-Loire", "27", "Mâcon", 695.0, 498.0, 719.4, 529.9, "8 600", "104 266 108 206 -1 -295 -213 -16 267"],
    ["72", "Sarthe", "52", "Le Mans", 404.5, 362.5, 400.7, 361.1, "6 200", "276 145 -212 -201 -231 246"],
    ["73", "Savoie", "84", "Chambéry", 842.5, 616.0, 795.1, 601.7, "6 300", "-298 -27 -202 4 298"],
    ["74", "Haute-Savoie", "84", "Annecy", 837.5, 549.5, 809.6, 569.9, "4 600", "-299 3 299"],
    ["75", "Paris", "11", "Paris", 549.5, 274.5, 548.8, 274.4, "105", "-301 301 -303"],
    ["76", "Seine-Maritime", "28", "Rouen", 460.0, 196.0, 462.4, 215.8, "6 300", "303 -276 -136 304"],
    ["77", "Seine-et-Marne", "11", "Melun", 594.0, 295.5, 570.6, 305.6, "5 900", "305 -307 307 273 11 239 -49 -309 -226 309"],
    ["78", "Yvelines", "11", "Versailles", 516.0, 277.0, 533.3, 279.7, "2 300", "310 311 312 -314 -142 138"],
    ["79", "Deux-Sèvres", "75", "Niort", 361.0, 477.5, 354.7, 527.1, "6 000", "232 314 -81 -89 -316"],
    ["80", "Somme", "32", "Amiens", 533.5, 165.5, 545.2, 170.0, "6 200", "316 279 317 277 270 -14 -273 -304"],
    ["81", "Tarn", "76", "Albi", 533.5, 779.5, 535.2, 767.4, "5 800", "63 -186 -185 -55 -172 170 318"],
    ["82", "Tarn-et-Garonne", "76", "Montauban", 467.0, 756.0, 481.1, 757.7, "3 700", "226 64 -319 -170 -169 -177 228"],
    ["83", "Var", "93", "Toulon", 816.5, 819.0, 796.7, 846.2, "6 000", "-320;-321;-322;-323 23 31 -324 67"],
    ["84", "Vaucluse", "93", "Avignon", 745.5, 759.5, 721.3, 766.4, "3 600", "-134;-37 132 24 322 -67 -166"],
    ["85", "Vendée", "52", "La Roche-sur-Yon", 306.0, 494.5, 289.6, 493.2, "6 800", "-325;233 315 -88 -326 220;326"],
    ["86", "Vienne", "75", "Poitiers", 419.5, 504.5, 411.7, 501.7, "7 000", "231 198 195 -328 -82 -315"],
    ["87", "Haute-Vienne", "75", "Limoges", 470.5, 579.0, 473.3, 574.6, "5 500", "327 194 120 -103 -124 -123 82"],
    ["88", "Vosges", "44", "Épinal", 839.0, 342.5, 834.6, 343.7, "5 900", "252 251 290 -294 -329 -296 -244 242 255"],
    ["89", "Yonne", "27", "Auxerre", 628.5, 376.0, 634.3, 380.6, "7 400", "308 52 -111 -266 -223"],
    ["90", "Territoire de Belfort", "27", "Belfort", 864.0, 391.5, 859.8, 395.3, "610", "328 292 -330 -128 296"],
    ["91", "Essonne", "11", "Évry-Courcouronnes", 542.5, 309.0, 555.5, 297.1, "1 800", "330 331 332 -310 -225 -143 313 -313"],
    ["92", "Hauts-de-Seine", "11", "Nanterre", 543.5, 280.5, 539.4, 270.4, "175", "333 300 -335 -332 -331 -312 335"],
    ["93", "Seine-Saint-Denis", "11", "Bobigny", 559.0, 269.0, 555.3, 269.2, "240", "306 -337 -302 -334 337"],
    ["94", "Val-de-Marne", "11", "Créteil", 560.5, 281.5, 556.5, 281.6, "240", "302 336 -306 -333 334"],
    ["95", "Val-d'Oise", "11", "Cergy", 543.0, 254.5, 528.5, 256.0, "1 200", "-308 -338 -336 -311 137 274"]
];
// [code, nom, lignes du libellé, chef-lieu, population, couleur, xÉtiquette, yÉtiquette, xChef-lieu, yChef-lieu, superficie km²]
const GF_REGIONS = [
    ["11", "Île-de-France", ["Île-de-France"], "Paris", "12,3 millions", "#f6c1c9", 594.5, 295.5, 548.8, 274.4, "12 000"],
    ["24", "Centre-Val de Loire", ["Centre-", "Val de Loire"], "Orléans", "2,6 millions", "#f9dfa6", 494.5, 484.0, 519.3, 371.7, "39 400"],
    ["27", "Bourgogne-Franche-Comté", ["Bourgogne-", "Franche-Comté"], "Dijon", "2,8 millions", "#c9b8e8", 719.5, 427.0, 735.0, 427.7, "47 900"],
    ["28", "Normandie", ["Normandie"], "Rouen", "3,3 millions", "#b6e0c8", 451.5, 259.5, 462.4, 215.8, "30 000"],
    ["32", "Hauts-de-France", ["Hauts-de-France"], "Lille", "6 millions", "#a9d3ef", 634.5, 189.0, 597.3, 96.9, "31 800"],
    ["44", "Grand Est", ["Grand Est"], "Strasbourg", "5,6 millions", "#f7cfa9", 696.0, 262.0, 923.5, 302.9, "57 500"],
    ["52", "Pays de la Loire", ["Pays de", "la Loire"], "Nantes", "3,9 millions", "#d9e9a6", 353.5, 420.0, 279.9, 436.8, "32 300"],
    ["53", "Bretagne", ["Bretagne"], "Rennes", "3,4 millions", "#f2b8d8", 279.5, 345.0, 270.7, 348.8, "27 400"],
    ["75", "Nouvelle-Aquitaine", ["Nouvelle-", "Aquitaine"], "Bordeaux", "6,1 millions", "#a8dcd7", 436.5, 651.0, 347.2, 674.2, "85 000"],
    ["76", "Occitanie", ["Occitanie"], "Toulouse", "6 millions", "#f4b6a6", 533.5, 779.5, 485.8, 800.4, "73 200"],
    ["84", "Auvergne-Rhône-Alpes", ["Auvergne-", "Rhône-Alpes"], "Lyon", "8,1 millions", "#bcc9f0", 597.5, 588.5, 721.0, 584.5, "70 700"],
    ["93", "Provence-Alpes-Côte d'Azur", ["Provence-Alpes-", "Côte d'Azur"], "Marseille", "5,1 millions", "#f8e08e", 820.5, 752.5, 761.4, 830.7, "31 600"],
    ["94", "Corse", ["Corse"], "Ajaccio", "350 000", "#d7c3a6", 1021.5, 917.0, 988.1, 966.5, "8 700"]
];
// Tracé réel des frontières terrestres (comble l'écart avec les pays voisins dessinés à la main)
const GF_ADM_BORDERS = ["631,1381,-5,0,7,5,0,5,-18,1,0,-5,-6,1,-4,16,-5,6,1,16,-8,65,-19,101,-21,41,-9,6,0,3,-18,3,1,5,7,4,0,6,9,-3,7,2,-1,7,3,4,4,0,2,-8,4,-1,13,6,4,-2,4,4,0,13,-3,2,-2,11,-8,7,5,9,12,3,1,-13,3,-4,7,-1,-5,10,6,5,5,-2,8,3,4,6,5,-2,3,4,10,1,5,7,23,2,8,-4,4,10,-2,4,2,3,6,0,11,11,0,5,5,0,-1,5,6,-2,4,-8,8,7,8,-1,4,-7,6,-3,13,11,6,2,2,-3,6,15,6,1,2,6,8,1,24,-10,7,4,4,-1,5,9,10,-10,8,7,24,-3,11,3,1,-7,-2,-5,-4,-1,4,-4,-3,-2,3,-3,-1,-8,8,-4,8,5,10,1,10,8,5,-3,4,4,13,-1,11,16,10,-4,3,3,14,-1,-1,3,6,4,6,16,6,-1,0,-8,12,-1,5,6,13,0,6,2,-2,5,8,1", "1020,1804,-8,-2,2,-5,-19,-2,-5,-6,-12,1,0,8,-6,1,-6,-16,-6,-4,1,-3,-14,1,-3,-3,-10,4,-11,-16,-13,1,-3,-4,-6,3,-10,-8,-10,-1,-8,-5,-6,1,-1,11,-3,3,3,2,-4,4,4,1,2,5,-1,7,-10,-3,-25,3,-8,-7,-10,10,-5,-9,-4,1,-5,-4,-10,5,-6,-1,-3,4,-5,-1,-2,3,-8,-1,-2,-6,-6,-1,-6,-15,-2,3,-6,-2,-13,-11,-6,3,-4,7,-8,1,-8,-7,-4,8,-6,2,1,-5,-5,0,0,-5,-11,-11,-6,0,-2,-3,2,-4,-4,-10,-8,4,-23,-2,-5,-7,-10,-1,-3,-4,-5,2,0,-3,-12,-6,-5,2,-6,-5,5,-10,-7,1,-3,4,-1,13,-12,-3,-5,-9,8,-7,2,-11,3,-2,0,-13,-4,-4,-4,2,-13,-6,-4,1,-2,8,-4,0,-3,-4,1,-7,-7,-2,-9,3,0,-6,-7,-4,1,-5"];

// Population municipale des départements (INSEE, recensement 2023)
const GF_DEP_POP = {
    '01': 679344, '02': 523342, '03': 333298, '04': 168054, '05': 143467, '06': 1128418, '07': 334231, '08': 265893,
    '09': 155722, '10': 310447, '11': 379648, '12': 279609, '13': 2087658, '14': 709441, '15': 144196, '16': 352683,
    '17': 672279, '18': 298660, '19': 240826, '2A': 168306, '2B': 187180, '21': 540100, '22': 611859, '23': 115527,
    '24': 417614, '25': 547163, '26': 524207, '27': 602714, '28': 433129, '29': 933455, '30': 770940, '31': 1471468,
    '32': 192645, '33': 1690493, '34': 1230289, '35': 1120666, '36': 216069, '37': 619362, '38': 1298990, '39': 257973,
    '40': 433570, '41': 328543, '42': 774133, '43': 228654, '44': 1487570, '45': 691268, '46': 176473, '47': 333602,
    '48': 76486, '49': 833776, '50': 497522, '51': 563076, '52': 168331, '53': 305468, '54': 732236, '55': 180290,
    '56': 783390, '57': 1051309, '58': 201417, '59': 2615635, '60': 829899, '61': 275201, '62': 1457905, '63': 664453,
    '64': 706564, '65': 231349, '66': 496855, '67': 1163810, '68': 770738, '69': 1914667, '70': 233185, '71': 550310,
    '72': 566733, '73': 448226, '74': 861158, '75': 2103778, '76': 1260964, '77': 1468108, '78': 1485086, '79': 375229,
    '80': 565413, '81': 397352, '82': 265817, '83': 1119307, '84': 572056, '85': 713609, '86': 438897, '87': 373167,
    '88': 357248, '89': 332267, '90': 140255, '91': 1338485, '92': 1654712, '93': 1704316, '94': 1426929, '95': 1281653
};
// 566733 → « 566 733 » ; pour une région : « 8,3 millions » ou « 355 000 »
function _gfNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function _gfPopRound(n) {
    if (n >= 1e6) { const m = Math.round(n / 1e5) / 10; return String(m).replace('.', ',') + (m >= 2 ? ' millions' : ' million'); }
    return _gfNum(Math.round(n / 1000) * 1000);
}

// Faits marquants des régions
const GF_REG_FACTS = {
    '11': 'Région la plus peuplée de France : près d\'un habitant sur cinq y vit. C\'est aussi la plus petite région de métropole après la Corse.',
    '24': 'Région traversée par la Loire. Elle est célèbre pour ses châteaux de la Loire (Chambord, Chenonceau…).',
    '27': 'Région frontalière de la Suisse, où se trouve une partie du massif du Jura. Elle est connue pour ses vignobles de Bourgogne.',
    '28': 'Région bordée par la Manche. On y trouve le Mont-Saint-Michel et les plages du Débarquement de 1944.',
    '32': 'Région frontalière de la Belgique, bordée par la Manche et la mer du Nord. Le tunnel sous la Manche y débouche, près de Calais.',
    '44': 'Seule région frontalière de quatre pays : la Belgique, le Luxembourg, l\'Allemagne et la Suisse.',
    '52': 'Région traversée par la Loire, qui se jette dans l\'océan Atlantique à Saint-Nazaire.',
    '53': 'Région très maritime, entourée par la Manche et l\'océan Atlantique, avec des côtes très découpées et de nombreuses îles.',
    '75': 'La plus grande région de France métropolitaine, de la Vienne jusqu\'aux Pyrénées et à l\'océan Atlantique.',
    '76': 'Deuxième plus grande région de métropole, bordée par les Pyrénées et la mer Méditerranée.',
    '84': 'Région des Alpes, du Mont Blanc et des volcans d\'Auvergne. Le Rhône et la Saône s\'y rejoignent à Lyon.',
    '93': 'De la Camargue aux Alpes du Sud, en passant par la Côte d\'Azur. Elle borde la mer Méditerranée et l\'Italie.',
    '94': 'Une île de la mer Méditerranée, surnommée « l\'île de Beauté ». Elle compte deux départements.'
};

// Interrupteurs d'affichage, selon la carte choisie
const GF_VIEWS = {
    physique:     { label: '⛰ <span class="gf-tx">France </span>physique', name: 'France physique' },
    regions:      { label: '🧩 Régions',         name: 'Régions' },
    departements: { label: '🔢 Départements',    name: 'Départements' }
};
const GF_TOGGLES = [
    { k: 'villes',  label: GF_LAYERS.villes.label,  views: ['physique'] },
    { k: 'fleuves', label: GF_LAYERS.fleuves.label, views: ['physique'] },
    { k: 'massifs', label: GF_LAYERS.massifs.label, views: ['physique'] },
    { k: 'rchefs',  label: '🏛 Chefs-lieux',   views: ['regions'] },
    { k: 'rdeps',   label: '▦ Départements',  views: ['regions'] },
    { k: 'dnum',    label: '🔢 Numéros',       views: ['departements'] },
    { k: 'dnoms',   label: '🔤 Noms',          views: ['departements'] },
    { k: 'prefs',   label: '🏛 Préfectures',   views: ['departements'] },
    { k: 'dreg',    label: '🧩 Régions',       views: ['departements'] },
    { k: 'pays',    label: GF_LAYERS.pays.label, views: ['physique', 'regions', 'departements'] },
    { k: 'mers',    label: GF_LAYERS.mers.label, views: ['physique', 'regions', 'departements'] }
];
GF_LAYERS.regions      = { label: '', kindName: 'Région' };
GF_LAYERS.departements = { label: '', kindName: 'Département' };

// Décodage des arcs (une seule fois)
let _gfAdmCache = null;
function _gfAdm() {
    if (_gfAdmCache) return _gfAdmCache;
    const dec = s => {
        const v = s.split(',').map(Number), pts = [];
        let x = 0, y = 0;
        for (let i = 0; i < v.length; i += 2) { x += v[i]; y += v[i + 1]; pts.push([x / GF_ADM_Q, y / GF_ADM_Q]); }
        return pts;
    };
    const arcs = GF_ADM_ARCS.map(dec);
    const ptsD = (pts, close) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + (close ? 'Z' : '');
    const arcUse = arcs.map(() => []);
    const deps = {};
    GF_DEPS.forEach(r => {
        const [code, name, reg, pref, lx, ly, px, py, area, ringsS] = r;
        const rings = ringsS.split(';').map(s => s.split(' ').map(Number));
        let d = '';
        rings.forEach(ring => {
            let pts = [];
            ring.forEach(ai => {
                const a = ai >= 0 ? arcs[ai] : arcs[~ai].slice().reverse();
                pts = pts.length ? pts.concat(a.slice(1)) : a.slice();
                arcUse[ai >= 0 ? ai : ~ai].push(code);
            });
            d += ptsD(pts, true);
        });
        deps[code] = { code, name, reg, pref, lbl: [lx, ly], prefXY: [px, py], area, d, neighbors: new Set() };
    });
    let dDep = '', dReg = '', dOuter = '';
    const regOutline = {};   // contour extérieur de chaque région (pour la sélection)
    const addOut = (reg, s) => { regOutline[reg] = (regOutline[reg] || '') + s; };
    arcUse.forEach((u, i) => {
        const s = ptsD(arcs[i], false);
        if (u.length < 2) { dOuter += s; if (u[0]) addOut(deps[u[0]].reg, s); return; }
        const [a, b] = u;
        deps[a].neighbors.add(b); deps[b].neighbors.add(a);
        if (deps[a].reg !== deps[b].reg) { dReg += s; addOut(deps[a].reg, s); addOut(deps[b].reg, s); }
        else dDep += s;
    });
    const borders = GF_ADM_BORDERS.map(dec);
    _gfAdmCache = { deps, dDep, dReg, dOuter, borders, regOutline };
    return _gfAdmCache;
}

// Coupe un nom long en deux lignes (au tiret ou à l'espace le plus central)
function _gfSplitName(n) {
    if (n.length <= 11) return [n];
    let best = null;
    for (let i = 1; i < n.length - 1; i++) {
        if (n[i] !== '-' && n[i] !== ' ') continue;
        const a = n[i] === '-' ? n.slice(0, i + 1) : n.slice(0, i), b = n.slice(i + 1);
        const score = Math.max(a.length, b.length);
        if (!best || score < best.score) best = { score, lines: [a, b] };
    }
    return best ? best.lines : [n];
}

// Mélange une couleur hexadécimale avec du blanc (t > 0) ou du noir (t < 0)
function _gfMix(hex, t) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

function _gfEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoFranceWidget() {
    snapshotNow();
    const pos = findFreePosition();

    // Petit écran : largeur presque pleine, tailles minimales réduites
    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 560;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-france';
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
    container.className = 'gf-container';

    // Taille initiale : 70% de la largeur de la page (presque toute la largeur sur téléphone)
    const initW = _phone ? Math.max(260, window.innerWidth - 54) : Math.round(window.innerWidth * 0.7);
    container.style.width = initW + 'px';
    let mapH = _phone ? Math.max(220, Math.round((initW - 22) * GF_H / GF_W))
                      : Math.max(320, Math.round((initW * 0.72 - 30) * GF_H / GF_W));

    // En-tête
    const header = document.createElement('div');
    header.className = 'gf-header';
    header.innerHTML = `
        <span class="gf-title">🗺 Géographie de la France</span>
        <span class="gf-badge">Vue d'ensemble</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.gf-badge');
    container.appendChild(header);

    // Choix de la carte
    const viewsBar = document.createElement('div');
    viewsBar.className = 'gf-views';
    viewsBar.innerHTML = `
        <span class="gf-layers-lbl">Carte :</span>
        ${Object.keys(GF_VIEWS).map(k => `<button class="gf-view-btn" data-view="${k}">${GF_VIEWS[k].label}</button>`).join('')}
    `;
    container.appendChild(viewsBar);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'gf-controls';
    controls.innerHTML = `
        <button class="gf-btn gf-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈<span class="gf-tx"> Masquer les noms</span></button>
        <button class="gf-btn gf-btn-reveal" style="display:none" title="Tout révéler">👁<span class="gf-tx"> Tout révéler</span></button>
        <button class="gf-btn gf-btn-home" title="Revenir à la carte entière">🔍<span class="gf-tx"> Vue d'ensemble</span></button>
        <div class="gf-layers">
            <span class="gf-layers-lbl">Afficher :</span>
            ${GF_TOGGLES.map(t => `<button class="gf-layer-btn active" data-layer="${t.k}" data-views="${t.views.join(' ')}">${t.label}</button>`).join('')}
        </div>
    `;
    const hideBtn   = controls.querySelector('.gf-btn-hide');
    const revealBtn = controls.querySelector('.gf-btn-reveal');
    const homeBtn   = controls.querySelector('.gf-btn-home');
    container.appendChild(controls);

    // Corps : carte + fiche
    const body = document.createElement('div');
    body.className = 'gf-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'gf-map-wrap';
    const side = document.createElement('div');
    side.className = 'gf-side';
    body.appendChild(mapWrap);
    body.appendChild(side);
    container.appendChild(body);

    // ── Construction de la carte SVG ──────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gf-map');
    svg.setAttribute('viewBox', `0 0 ${GF_W.toFixed(1)} ${GF_H.toFixed(1)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const clipId = 'gf-clip-' + Math.random().toString(36).slice(2, 8);
    svg.innerHTML = `
        <defs>
            <pattern id="gf-hatch" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)">
                <rect width="9" height="9" fill="#c99a63" fill-opacity="0.38"></rect>
                <line x1="0" y1="0" x2="0" y2="9" stroke="#9a6a3a" stroke-width="2.2" stroke-opacity="0.45"></line>
            </pattern>
            <clipPath id="${clipId}"><rect x="0" y="0" width="${GF_W.toFixed(1)}" height="${GF_H.toFixed(1)}"></rect></clipPath>
        </defs>
        <rect x="-5000" y="-5000" width="12000" height="12000" fill="#cfe6f3"></rect>
        <g clip-path="url(#${clipId})">
            <g class="gf-g-land"></g>
            <g class="gf-g-countries"></g>
            <g class="gf-V-phys gf-g-france"></g>
            <g class="gf-V-adm gf-g-adm">
                <path class="gf-adm-gap"></path>
                <g class="gf-V-reg gf-g-reg"></g>
                <g class="gf-V-dep gf-g-dep"></g>
                <path class="gf-adm-line gf-adm-depline gf-V-reg gf-L-rdeps" vector-effect="non-scaling-stroke"></path>
                <path class="gf-adm-line gf-adm-regline gf-V-reg" vector-effect="non-scaling-stroke"></path>
                <path class="gf-adm-line gf-adm-regline2 gf-V-dep gf-L-dreg" vector-effect="non-scaling-stroke"></path>
                <path class="gf-adm-line gf-adm-outer" vector-effect="non-scaling-stroke"></path>
                <g class="gf-V-reg gf-L-rchefs gf-g-chefs"></g>
                <g class="gf-V-dep gf-L-prefs gf-g-prefs"></g>
            </g>
            <g class="gf-V-phys gf-L-massifs gf-g-massifs"></g>
            <g class="gf-g-lake"></g>
            <g class="gf-V-phys gf-L-fleuves gf-g-rivers"></g>
            <g class="gf-V-phys gf-L-villes gf-g-cities"></g>
            <g class="gf-g-labels">
                <g class="gf-L-mers"></g>
                <g class="gf-L-pays"></g>
                <g class="gf-V-phys gf-L-massifs"></g>
                <g class="gf-V-phys gf-L-fleuves"></g>
                <g class="gf-V-phys gf-L-villes"></g>
                <g class="gf-V-reg gf-L-regions"></g>
                <g class="gf-V-reg gf-L-rchefs"></g>
                <g class="gf-V-dep gf-L-departements"></g>
                <g class="gf-V-dep gf-L-prefs"></g>
            </g>
        </g>
    `;
    mapWrap.appendChild(svg);

    const gLand      = svg.querySelector('.gf-g-land');
    const gCountries = svg.querySelector('.gf-g-countries');
    const gFrance    = svg.querySelector('.gf-g-france');
    const gMassifs   = svg.querySelector('.gf-g-massifs');
    const gLake      = svg.querySelector('.gf-g-lake');
    const gRivers    = svg.querySelector('.gf-g-rivers');
    const gCities    = svg.querySelector('.gf-g-cities');
    const gAdm       = svg.querySelector('.gf-g-adm');
    const gReg       = svg.querySelector('.gf-g-reg');
    const gDep       = svg.querySelector('.gf-g-dep');
    const gChefs     = svg.querySelector('.gf-g-chefs');
    const gPrefs     = svg.querySelector('.gf-g-prefs');
    const gLabels    = {};
    ['mers', 'pays', 'massifs', 'fleuves', 'villes', 'regions', 'rchefs', 'departements', 'prefs'].forEach(k => {
        gLabels[k] = svg.querySelector('.gf-g-labels .gf-L-' + k);
    });

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    const items = {};     // id -> { id, layer, name, data, shapes:[], label, zoom }
    const labels = [];    // { el, ax, ay, dx, dy, size, lines, item }
    const scalables = []; // cercles dont le rayon suit le zoom { el, r }

    // opts : { xy: true (coordonnées déjà projetées), kind: 'dep' | 'sub', maxW, sw (épaisseur du contour) }
    function addLabel(item, layer, cls, lonlat, size, dx, dy, anchor, lines, opts) {
        opts = opts || {};
        const [ax, ay] = opts.xy ? lonlat : _gfP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'gf-lbl ' + cls + ' gf-item', 'text-anchor': anchor || 'middle', 'data-id': item.id }, gLabels[layer]);
        const lb = { el: t, ax, ay, dx: dx || 0, dy: dy || 0, size, lines: lines || [item.name], item,
                     kind: opts.kind || 'main', maxW: opts.maxW || 0, sw: opts.sw || (cls === 'gf-lbl-sea' ? 3 : 4), cur: [] };
        labels.push(lb);
        if (lb.kind !== 'sub') item.label = lb;
        item.shapes.push(t);
        return lb;
    }

    // Terres non concernées (Pays-Bas, Autriche, Sardaigne)
    Object.values(GF_SHAPES_OTHER).forEach(pts => el('path', { class: 'gf-other', d: _gfPath(pts, true) }, gLand));

    // Pays frontaliers (Andorre dessinée en dernier pour ne pas être recouverte par l'Espagne)
    GF_COUNTRIES.slice().sort((a, b) => (a.id === 'andorre') - (b.id === 'andorre')).forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'pays', name: c.name, data: c, shapes: [] };
        if (c.shape) {
            it.shapes.push(el('path', { class: 'gf-country gf-item', d: _gfPath(c.shape, true), 'data-id': c.id }, gCountries));
        }
        const fs = 21 * (c.size || 1);
        addLabel(it, 'pays', 'gf-lbl-country', c.lbl, fs, 0, fs * 0.35, 'middle');
        it.zoom = { p: c.point || c.lbl, w: c.id === 'monaco' ? 260 : (c.size < 1 ? 320 : 520) };
    });

    // France métropolitaine
    el('path', { class: 'gf-france', d: _gfPath(GF_FRANCE, true) }, gFrance);
    el('path', { class: 'gf-france', d: _gfPath(GF_CORSICA, true) }, gFrance);

    // Monaco (point) — après la France pour rester visible
    (function () {
        const c = GF_COUNTRIES.find(x => x.id === 'monaco');
        const [x, y] = _gfP(c.point[0], c.point[1]);
        const circ = el('circle', { class: 'gf-monaco gf-item', cx: x, cy: y, r: 5, 'data-id': 'monaco' }, gCountries.parentNode);
        gAdm.after(circ);
        items.monaco.shapes.push(circ);
        scalables.push({ el: circ, r: 5 });
    })();

    // Massifs
    GF_MASSIFS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'massifs', name: m.name, data: m, shapes: [] };
        it.shapes.push(el('path', { class: 'gf-massif gf-item', d: _gfPath(m.shape, true), 'data-id': m.id }, gMassifs));
        addLabel(it, 'massifs', 'gf-lbl-massif', m.lbl, 21, 0, 7, 'middle', m.name === 'Massif central' ? ['Massif', 'central'] : null);
        it.zoom = { bbox: true };
    });

    // Lac Léman
    el('path', { class: 'gf-lake', d: _gfPath(GF_LEMAN, true) }, gLake);

    // Fleuves
    GF_RIVERS.forEach(r => {
        const it = items[r.id] = { id: r.id, layer: 'fleuves', name: r.name, data: r, shapes: [] };
        const d = _gfSmooth(r.path);
        it.shapes.push(el('path', { class: 'gf-river-hit gf-item', d, 'data-id': r.id }, gRivers));
        const line = el('path', { class: 'gf-river gf-item', d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, gRivers);
        it.shapes.push(line);
        it.mainShape = line;
        addLabel(it, 'fleuves', 'gf-lbl-river', r.lbl, 19, 0, 6, 'middle');
        it.zoom = { bbox: true };
    });

    // Villes
    GF_CITIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'villes', name: c.name, data: c, shapes: [] };
        const [x, y] = _gfP(c.p[0], c.p[1]);
        const r = c.id === 'paris' ? 8 : 6;
        const dot = el('circle', { class: 'gf-city gf-item', cx: x, cy: y, r, 'data-id': c.id }, gCities);
        it.shapes.push(dot);
        scalables.push({ el: dot, r });
        const pos = { r: [13, 6, 'start'], l: [-13, 6, 'end'], b: [0, 28, 'middle'] }[c.lp] || [13, 6, 'start'];
        addLabel(it, 'villes', 'gf-lbl-city', c.p, c.id === 'paris' ? 22 : 19, pos[0], pos[1], pos[2]);
        it.zoom = { p: c.p, w: 480 };
    });

    // Mers et océan
    GF_SEAS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'mers', name: m.name, data: m, shapes: [] };
        addLabel(it, 'mers', 'gf-lbl-sea', m.lbl, 18, 0, 6, 'middle', m.lines || null);
        it.zoom = { p: m.lbl, w: 600 };
    });

    // ── Régions et départements ───────────────────────────────────────────
    const ADM = _gfAdm();
    const regColor = {};
    GF_REGIONS.forEach(r => { regColor[r[0]] = r[5]; });

    // Comble l'écart entre le tracé réel de la frontière et les pays voisins dessinés à la main
    (function () {
        const hand = [[].concat(GF_B_BE, GF_B_LU, GF_B_DE, GF_B_CH, GF_B_IT), GF_B_ES];
        let d = '';
        ADM.borders.forEach((real, i) => {
            const back = hand[i].slice().reverse().map(p => _gfP(p[0], p[1]));
            d += real.concat(back).map((p, j) => (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z';
        });
        gAdm.querySelector('.gf-adm-gap').setAttribute('d', d);
    })();
    gAdm.querySelector('.gf-adm-depline').setAttribute('d', ADM.dDep + ADM.dReg);
    gAdm.querySelector('.gf-adm-regline').setAttribute('d', ADM.dReg);
    gAdm.querySelector('.gf-adm-regline2').setAttribute('d', ADM.dReg);
    gAdm.querySelector('.gf-adm-outer').setAttribute('d', ADM.dOuter);

    const depLabels = [], prefLabels = [];   // pour éviter les chevauchements
    // Départements : couleur de leur région, légèrement nuancée
    const _shade = [0, 0.32, -0.07, 0.18, 0.42, 0.08];
    const _regCount = {};
    GF_DEPS.forEach(r => {
        const dep = ADM.deps[r[0]];
        const id = 'd-' + dep.code;
        const it = items[id] = { id, layer: 'departements', name: dep.name, data: dep, shapes: [] };
        const n = _regCount[dep.reg] = (_regCount[dep.reg] || 0) + 1;
        const fill = _gfMix(regColor[dep.reg], _shade[(n - 1) % _shade.length]);
        const path = el('path', { class: 'gf-dep gf-item', d: dep.d, fill, 'data-id': id, 'vector-effect': 'non-scaling-stroke' }, gDep);
        it.shapes.push(path);
        it.mainShape = path;
        const small = ['75', '92', '93', '94'].includes(dep.code);
        const lb = addLabel(it, 'departements', 'gf-lbl-dep', dep.lbl, 14, 0, 0, 'middle', null,
            { xy: true, kind: 'dep', maxW: small ? 330 : 0, sw: 3 });
        depLabels.push(lb);
        lb.nameLines = _gfSplitName(dep.name);
        const dot = el('circle', { class: 'gf-pref gf-item', cx: dep.prefXY[0], cy: dep.prefXY[1], r: 2.8, 'data-id': id, 'vector-effect': 'non-scaling-stroke' }, gPrefs);
        it.shapes.push(dot);
        scalables.push({ el: dot, r: 2.8 });
        if (dep.pref !== dep.name) {   // pas d'étiquette « Paris » en double
            const pl = addLabel(it, 'prefs', 'gf-lbl-pref', dep.prefXY, 10, 6, 3.5, 'start', [dep.pref],
                { xy: true, kind: 'sub', maxW: small ? 140 : 330, sw: 3 });
            pl.pref = true;
            prefLabels.push(pl);
        }
        it.zoom = { bbox: true, min: small ? 45 : 70 };
    });

    // Régions : une seule forme par région (réunion des départements, sans couture)
    GF_REGIONS.forEach(r => {
        const [code, name, lines, chef, pop, color, lx, ly, cx, cy, area] = r;
        const id = 'r-' + code;
        const deps = GF_DEPS.filter(d => d[2] === code).map(d => ADM.deps[d[0]]);
        const popN = deps.reduce((t, d) => t + (GF_DEP_POP[d.code] || 0), 0);
        const data = { code, name, chef, pop: popN ? _gfPopRound(popN) : pop, color, area, deps };
        const it = items[id] = { id, layer: 'regions', name, data, shapes: [] };
        const path = el('path', { class: 'gf-region gf-item', d: deps.map(d => d.d).join(''), fill: color, stroke: color, 'data-id': id }, gReg);
        it.shapes.push(path);
        it.mainShape = path;
        // contour de sélection : seulement le bord extérieur de la région
        const outline = el('path', { class: 'gf-adm-line gf-reg-outline', d: ADM.regOutline[code] || '', 'vector-effect': 'non-scaling-stroke' });
        gAdm.insertBefore(outline, gChefs);
        it.shapes.push(outline);
        // quelques étiquettes décalées pour ne pas chevaucher le chef-lieu
        const shift = { '53': [-80, 4], '27': [6, 48], '11': [8, 14], '75': [30, -22] }[code] || [0, 0];
        addLabel(it, 'regions', 'gf-lbl-reg', [lx + shift[0], ly + shift[1]], code === '11' ? 15 : 21, 0, 7, 'middle', lines, { xy: true });
        const dot = el('circle', { class: 'gf-chef gf-item', cx, cy, r: 4.5, 'data-id': id, 'vector-effect': 'non-scaling-stroke' }, gChefs);
        it.shapes.push(dot);
        scalables.push({ el: dot, r: 4.5 });
        const side = { 'Paris': [-8, 4, 'end'], 'Strasbourg': [-8, 4, 'end'], 'Lille': [0, -9, 'middle'],
                       'Ajaccio': [-8, 4, 'end'], 'Marseille': [0, 16, 'middle'], 'Nantes': [0, 16, 'middle'] }[chef] || [8, 4, 'start'];
        addLabel(it, 'rchefs', 'gf-lbl-chef', [cx, cy], 14, side[0], side[1], side[2], [chef], { xy: true, kind: 'sub', sw: 3 });
        it.zoom = { bbox: true };
    });

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gf-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gf-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Géographie de la France</h4>
        <p>🗺 <b>Carte</b> : choisis la France <b>physique</b>, les <b>13 régions</b>
        ou les <b>96 départements</b>.</p>
        <p>La carte physique présente les <b>10 plus grandes villes</b>, les <b>4 grands fleuves</b>,
        les <b>5 massifs montagneux</b>, les <b>pays frontaliers</b> et les <b>mers</b>.</p>
        <p>👆 <b>Clique sur un élément</b> (ville, fleuve, massif, pays, mer) : la carte zoome
        dessus et sa fiche s'affiche à droite. Clique à nouveau dessus, ou sur
        <b>Vue d'ensemble</b>, pour revenir à la carte entière.</p>
        <p>🗂 <b>Afficher</b> : active ou désactive chaque catégorie d'éléments.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms sont remplacés par « ? ». Clique sur un élément
        pour dévoiler son nom. Idéal pour faire réviser les élèves !</p>
        <p>🔗 Dans la fiche d'une région, clique sur un département pour l'ouvrir (et inversement).</p>
        <p style="color:#888">Les pays voisins ne sont montrés qu'en partie. Le tracé de la carte
        est simplifié (régions et départements : IGN Admin Express, Licence ouverte).
        Redimensionne le widget avec le coin en bas à droite.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gf-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    const layers = { villes: true, fleuves: true, massifs: true, pays: true, mers: true,
                     rchefs: true, rdeps: false, dnum: true, dnoms: false, prefs: false, dreg: true };
    let view = 'physique';
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let vb = { x: 0, y: 0, w: GF_W, h: GF_H };
    let animId = null;

    // ── Vue (viewBox) ─────────────────────────────────────────────────────
    function aspect() {
        const w = svg.clientWidth, h = svg.clientHeight;
        return (w && h) ? w / h : GF_W / GF_H;
    }
    function fullView() {
        const a = aspect();
        if (a > GF_W / GF_H) { const w = GF_H * a; return { x: (GF_W - w) / 2, y: 0, w, h: GF_H }; }
        const h = GF_W / a; return { x: 0, y: (GF_H - h) / 2, w: GF_W, h };
    }
    function fitRect(cx, cy, w, h) {
        const a = aspect();
        if (w / h < a) w = h * a; else h = w / a;
        const full = fullView();
        if (w >= full.w || h >= full.h) return full;
        let x = cx - w / 2, y = cy - h / 2;
        x = Math.max(full.x, Math.min(full.x + full.w - w, x));
        y = Math.max(full.y, Math.min(full.y + full.h - h, y));
        return { x, y, w, h };
    }
    function targetView() {
        const it = selected && items[selected];
        if (!it) return fullView();
        if (it.zoom.bbox) {
            const shape = it.mainShape || it.shapes[0];
            const b = shape.getBBox();
            let x0 = Math.max(0, b.x), y0 = Math.max(0, b.y);
            let x1 = Math.min(GF_W, b.x + b.width), y1 = Math.min(GF_H, b.y + b.height);
            const pad = 0.18;
            const min = it.zoom.min || 220;
            const w = Math.max(min, (x1 - x0) * (1 + pad * 2));
            const h = Math.max(min, (y1 - y0) * (1 + pad * 2));
            return fitRect((x0 + x1) / 2, (y0 + y1) / 2, w, h);
        }
        const [cx, cy] = _gfP(it.zoom.p[0], it.zoom.p[1]);
        return fitRect(cx, cy, it.zoom.w, it.zoom.w * 0.8);
    }

    // Sur téléphone, la carte est petite : on grossit les noms et les points pour qu'ils restent lisibles
    function lblBoost() {
        const w = svg.clientWidth;
        if (!w || !window._wfIsPhone()) return 1;
        return Math.max(1, Math.min(2.2, 720 / w));
    }

    function setView(v) {
        vb = v;
        svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
        const s = Math.min(1, Math.pow(v.w / GF_W, 0.7)) * lblBoost();
        scalables.forEach(o => o.el.setAttribute('r', (o.r * s).toFixed(2)));
        labels.forEach(lb => {
            // certaines étiquettes n'apparaissent qu'en zoomant (petits départements, préfectures)
            lb.el.style.display = (lb.maxW && v.w > lb.maxW) ? 'none' : '';
            lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
            // style en ligne : l'emporte sur l'épaisseur fixée dans le CSS, pour que le contour suive le zoom
            lb.el.style.strokeWidth = (lb.sw * s).toFixed(2) + 'px';
            const x = lb.ax + lb.dx * s, y = lb.ay + lb.dy * s;
            lb.el.setAttribute('x', x.toFixed(1));
            lb.el.setAttribute('y', y.toFixed(1));
            const tsp = lb.el.querySelectorAll('tspan');
            const hs = lb.cur.map(l => lb.size * (l.k || 1) * s * 1.1);
            const total = hs.reduce((a, b) => a + b, 0);
            let acc = -total / 2;
            tsp.forEach((t, i) => {
                const k = (lb.cur[i] && lb.cur[i].k) || 1;
                const c = acc + hs[i] / 2;
                acc += hs[i];
                t.setAttribute('x', x.toFixed(1));
                t.setAttribute('y', (y + c + (lb.kind === 'dep' ? 0.36 * lb.size * k * s : 0)).toFixed(1));
                if (k !== 1) t.setAttribute('font-size', (lb.size * k * s).toFixed(2));
            });
        });
        placePrefLabels(s);
    }

    // Place le nom de chaque préfecture à droite, à gauche, en dessous ou au-dessus
    // de son point, du côté où il ne chevauche pas le numéro / nom d'un département.
    function placePrefLabels(s) {
        if (view !== 'departements' || !layers.prefs) return;
        const CW = 0.58;   // largeur moyenne d'un caractère (en fraction de la taille de police)
        const boxes = [];
        depLabels.forEach(lb => {
            if (!lb.cur.length || lb.el.style.display === 'none') return;
            const hs = lb.cur.map(l => lb.size * (l.k || 1) * s * 1.1);
            const h = hs.reduce((a, b) => a + b, 0);
            const w = Math.max(...lb.cur.map(l => l.t.length * CW * lb.size * (l.k || 1) * s));
            const p = 1.5 * s;
            boxes.push([lb.ax - w / 2 - p, lb.ay - h / 2 - p, lb.ax + w / 2 + p, lb.ay + h / 2 + p]);
        });
        const overlap = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
                                  Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
        prefLabels.forEach(lb => {
            if (!lb.cur.length || lb.el.style.display === 'none') return;
            const fs = lb.size * s, w = lb.lines[0].length * CW * fs, g = 5.5 * s;
            const cands = [
                ['start',  lb.ax + g, lb.ay + 0.35 * fs, [lb.ax + g, lb.ay - 0.5 * fs, lb.ax + g + w, lb.ay + 0.5 * fs]],
                ['end',    lb.ax - g, lb.ay + 0.35 * fs, [lb.ax - g - w, lb.ay - 0.5 * fs, lb.ax - g, lb.ay + 0.5 * fs]],
                ['middle', lb.ax, lb.ay + g + 0.85 * fs, [lb.ax - w / 2, lb.ay + g, lb.ax + w / 2, lb.ay + g + fs]],
                ['middle', lb.ax, lb.ay - g - 0.15 * fs, [lb.ax - w / 2, lb.ay - g - fs, lb.ax + w / 2, lb.ay - g]]
            ];
            let best = null;
            for (const c of cands) {
                const o = boxes.reduce((t, b) => t + overlap(c[3], b), 0);
                if (!best || o < best.o - 1e-6) best = { c, o };
                if (o === 0) break;
            }
            const [anchor, x, y] = best.c;
            lb.el.setAttribute('text-anchor', anchor);
            lb.el.setAttribute('x', x.toFixed(1));
            lb.el.setAttribute('y', y.toFixed(1));
            lb.el.querySelectorAll('tspan').forEach(t => { t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', y.toFixed(1)); });
            boxes.push(best.c[3]);   // les préfectures s'évitent aussi entre elles
        });
    }

    function animateView(to) {
        if (animId) cancelAnimationFrame(animId);
        const from = { ...vb };
        const t0 = performance.now(), dur = 450;
        const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur), e = ease(k);
            setView({
                x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
                w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e
            });
            if (k < 1 && document.body.contains(widget)) animId = requestAnimationFrame(step);
            else animId = null;
        };
        animId = requestAnimationFrame(step);
    }

    // ── Noms (affichés / masqués) ─────────────────────────────────────────
    function applyLabels() {
        labels.forEach(lb => {
            const hidden = hideNames && !revealed.has(lb.item.id);
            lb.el.classList.toggle('gf-hidden', hidden);
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            let lines;
            if (lb.kind === 'sub') {
                lines = hidden ? [] : lb.lines.map(t => ({ t }));
            } else if (lb.kind === 'dep') {
                lines = [];
                if (layers.dnum) lines.push({ t: lb.item.data.code, k: 1, w: 900 });
                if (layers.dnoms) lb.nameLines.forEach(t => lines.push({ t, k: layers.dnum ? 0.62 : 0.72 }));
                if (lines.length && hidden) lines = [{ t: '?', k: 1 }];
            } else {
                lines = hidden ? [{ t: '?' }] : lb.lines.map(t => ({ t }));
            }
            lb.cur = lines;
            lines.forEach(line => {
                const t = document.createElementNS(NS, 'tspan');
                t.textContent = line.t;
                if (line.w) t.setAttribute('font-weight', line.w);
                lb.el.appendChild(t);
            });
        });
        setView(vb);
        renderSide();
    }

    // ── Sélection ─────────────────────────────────────────────────────────
    function applySelection() {
        svg.classList.toggle('gf-has-sel', !!selected);
        Object.values(items).forEach(it => {
            it.shapes.forEach(s => s.classList.toggle('gf-sel', it.id === selected));
        });
        const it = selected && items[selected];
        // la forme sélectionnée passe au premier plan pour que son contour soit entier
        if (it && it.mainShape && (it.layer === 'regions' || it.layer === 'departements')) {
            it.mainShape.parentNode.appendChild(it.mainShape);
        }
        badge.textContent = it ? 'Zoom : ' + it.name : (view === 'physique' ? 'Vue d\'ensemble' : GF_VIEWS[view].name);
        renderSide();
    }

    // Un élément est-il cliquable / visible dans la carte actuelle ?
    function isActive(it) {
        if (!it) return false;
        if (it.layer === 'regions') return view === 'regions';
        if (it.layer === 'departements') return view === 'departements';
        if (it.layer === 'pays' || it.layer === 'mers') return !!layers[it.layer];
        return view === 'physique' && !!layers[it.layer];
    }

    // Change de carte : physique, régions ou départements
    function setViewMode(v, animate) {
        if (!GF_VIEWS[v]) v = 'physique';
        view = v;
        Object.keys(GF_VIEWS).forEach(k => svg.classList.toggle('gf-view-' + k, k === v));
        viewsBar.querySelectorAll('.gf-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === v));
        controls.querySelectorAll('.gf-layer-btn').forEach(b => {
            b.style.display = b.dataset.views.split(' ').includes(v) ? '' : 'none';
        });
        if (selected && !isActive(items[selected])) selected = null;
        applyLabels();
        applySelection();
        const to = targetView();
        if (animate === false) setView(to); else animateView(to);
    }

    function select(id, animate) {
        selected = id;
        applySelection();
        const to = targetView();
        if (animate === false) setView(to); else animateView(to);
    }

    function onItemClick(id) {
        const it = items[id];
        if (!isActive(it)) return;
        if (hideNames && !revealed.has(id)) {
            revealed.add(id);
            applyLabels();
            saveBoard();
            return;
        }
        select(selected === id ? null : id);
        saveBoard();
    }

    // ── Fiche latérale ────────────────────────────────────────────────────
    function row(lbl, val) { return `<li><b>${lbl} :</b> ${_gfEsc(val)}</li>`; }

    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(window._wfIsPhone() ? 15 : 18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it && view === 'regions') {
            side.style.borderLeftColor = '#2f4f9e';
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">Les 13 régions</h4>
                <div class="gf-hint">Clique sur une région (sur la carte ou dans la liste) pour zoomer dessus et découvrir sa fiche.</div>
                ${GF_REGIONS.map(r => `
                    <button class="gf-reg-row" data-goto="r-${r[0]}">
                        <span class="gf-sw" style="background:${r[5]};border:1px solid ${_gfMix(r[5], -0.25)}"></span>
                        <span>${_gfEsc(hideNames && !revealed.has('r-' + r[0]) ? '?' : r[1])}</span>
                    </button>`).join('')}
                <p style="margin-top:10px;color:#6b7280">Depuis le 1er janvier 2016, la France métropolitaine compte <b>13 régions</b>.
                Avec les 5 régions d'outre-mer (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte), la France en compte <b>18</b>.</p>
            `;
            wireSide();
            return;
        }
        if (!it && view === 'departements') {
            side.style.borderLeftColor = '#2f4f9e';
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">Les 96 départements</h4>
                <div class="gf-hint">Clique sur un département pour zoomer dessus et découvrir sa fiche.
                Zoome sur l'Île-de-France pour voir les plus petits départements.</div>
                <p>Les départements ont été créés en <b>1790</b>, pendant la Révolution française.</p>
                <p>Leur <b>numéro</b> suit à peu près l'ordre alphabétique de leur nom à l'époque :
                01 Ain, 02 Aisne, 03 Allier…</p>
                <p>La Corse compte deux départements : <b>2A</b> (Corse-du-Sud) et <b>2B</b> (Haute-Corse).</p>
                <p style="color:#6b7280">Avec les 5 départements d'outre-mer (971 Guadeloupe, 972 Martinique, 973 Guyane,
                974 La Réunion, 976 Mayotte), la France compte <b>101 départements</b>.</p>
            `;
            wireSide();
            return;
        }
        if (!it) {
            side.style.borderLeftColor = '#9ca3af';
            const counts = { villes: GF_CITIES.length, fleuves: GF_RIVERS.length, massifs: GF_MASSIFS.length, pays: GF_COUNTRIES.length, mers: GF_SEAS.length };
            const sw = {
                villes:  'background:#d63b3b;border-radius:50%;width:14px;height:14px;margin:0 4px;',
                fleuves: 'background:#2b7bd0;height:4px;',
                massifs: 'background:repeating-linear-gradient(45deg,#c99a63 0 3px,#e6cfae 3px 6px);',
                pays:    'background:#e4e6dc;border:1px solid #b9bdae;',
                mers:    'background:#cfe6f3;border:1px solid #9cc3dc;'
            };
            const names = { villes: 'grandes villes', fleuves: 'grands fleuves', massifs: 'massifs montagneux', pays: 'pays frontaliers', mers: 'mers et océan' };
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">France métropolitaine</h4>
                <div class="gf-hint">Clique sur un élément de la carte pour zoomer dessus et découvrir sa fiche.</div>
                ${Object.keys(names).map(k => `
                    <div class="gf-legend-row" style="opacity:${layers[k] ? 1 : .35}">
                        <span class="gf-sw" style="${sw[k]}"></span>
                        <span><b>${counts[k]}</b> ${names[k]}</span>
                    </div>`).join('')}
                <p style="margin-top:10px;color:#6b7280">Capitale : <b>Paris</b><br>Environ <b>66 millions</b> d'habitants en métropole.</p>
            `;
            return;
        }
        const d = it.data;
        const color = it.layer === 'regions' ? _gfMix(d.color, -0.5)
                    : it.layer === 'departements' ? _gfMix(regColor[d.reg], -0.5)
                    : GF_COLORS[it.layer];
        side.style.borderLeftColor = color;
        let html = `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${color}">${_gfEsc(it.name)}</h4>`;
        html += `<div class="gf-kind">${GF_LAYERS[it.layer].kindName}</div>`;
        if (it.layer === 'villes') {
            html += '<ul>' + row('Rang', d.rank === 1 ? '1re ville de France' : d.rank + 'e ville de France')
                + row('Habitants', 'environ ' + d.pop)
                + row('Région', d.region)
                + (d.fleuve ? row('Fleuve / rivière', d.fleuve) : row('Littoral', d.id === 'lille' ? 'non (ville du Nord)' : 'proche de la mer Méditerranée'))
                + '</ul>';
            html += `<p>${_gfEsc(d.fact)}</p>`;
        } else if (it.layer === 'fleuves') {
            const i = d.info;
            html += '<ul>' + row('Longueur', i.longueur) + row('Source', i.source) + row('Se jette dans', i.mer) + row('Villes traversées', i.villes) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'massifs') {
            const i = d.info;
            html += '<ul>' + row('Plus haut sommet', i.sommet) + row('Type', i.age) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'pays') {
            const i = d.info;
            html += '<ul>' + row('Capitale', i.capitale) + row('Langue(s)', i.langues) + '</ul>';
            html += `<p>${_gfEsc(i.fact)}</p>`;
        } else if (it.layer === 'mers') {
            html += `<p>${_gfEsc(d.info)}</p>`;
        } else if (it.layer === 'regions') {
            const nm = dep => (hideNames && !revealed.has('d-' + dep.code)) ? '?' : dep.name;
            html += '<ul>' + row('Chef-lieu', d.chef)
                + row('Habitants', 'environ ' + d.pop + ' (2023)')
                + row('Superficie', 'environ ' + d.area + ' km²')
                + row('Départements', String(d.deps.length))
                + '</ul>';
            html += `<div class="gf-chips">${d.deps.map(dep =>
                `<button class="gf-chip" data-goto="d-${dep.code}" title="Voir ce département">${dep.code} ${_gfEsc(nm(dep))}</button>`).join('')}</div>`;
            html += `<p>${_gfEsc(GF_REG_FACTS[d.code] || '')}</p>`;
        } else if (it.layer === 'departements') {
            const reg = items['r-' + d.reg];
            const regName = (hideNames && !revealed.has(reg.id)) ? '?' : reg.name;
            html += '<ul>' + row('Numéro', d.code)
                + (GF_DEP_POP[d.code] ? row('Habitants', _gfNum(GF_DEP_POP[d.code]) + ' (2023)') : '')
                + `<li><b>Région :</b> <button class="gf-link" data-goto="${reg.id}" title="Voir cette région">${_gfEsc(regName)}</button></li>`
                + row('Préfecture', d.pref)
                + row('Superficie', 'environ ' + d.area + ' km²')
                + '</ul>';
            const nb = Array.from(d.neighbors).sort();
            html += `<div><b>Départements voisins :</b></div>`;
            html += `<div class="gf-chips">${nb.map(c => {
                const o = ADM.deps[c];
                const n = (hideNames && !revealed.has('d-' + c)) ? '?' : o.name;
                return `<button class="gf-chip" data-goto="d-${c}">${c} ${_gfEsc(n)}</button>`;
            }).join('') || '<i>aucun (île)</i>'}</div>`;
        }
        html += `<button class="gf-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        wireSide();
    }

    // Boutons de la fiche : retour, et liens vers une région / un département
    function wireSide() {
        side.querySelectorAll('button').forEach(b => {
            b.addEventListener('mousedown', (e) => e.stopPropagation());
            b.addEventListener('pointerdown', (e) => e.stopPropagation());
        });
        const back = side.querySelector('.gf-back-btn');
        if (back) back.addEventListener('click', (e) => { e.stopPropagation(); select(null); saveBoard(); });
        side.querySelectorAll('[data-goto]').forEach(b => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = b.dataset.goto;
                const target = items[id];
                if (!target) return;
                const v = target.layer === 'regions' ? 'regions' : 'departements';
                if (v !== view) { selected = null; setViewMode(v, false); }
                if (hideNames && !revealed.has(id)) { revealed.add(id); applyLabels(); }
                select(id);
                saveBoard();
            });
        });
    }

    // ── Calques ───────────────────────────────────────────────────────────
    function applyLayers() {
        Object.keys(layers).forEach(k => svg.classList.toggle('gf-off-' + k, !layers[k]));
        controls.querySelectorAll('.gf-layer-btn').forEach(b => b.classList.toggle('active', !!layers[b.dataset.layer]));
        if (selected && !isActive(items[selected])) select(null);
        else renderSide();
    }

    function setHideNames(v) {
        hideNames = !!v;
        hideBtn.classList.toggle('on', hideNames);
        hideBtn.innerHTML = hideNames ? '🙉<span class="gf-tx"> Afficher les noms</span>' : '🙈<span class="gf-tx"> Masquer les noms</span>';
        hideBtn.title = hideNames ? 'Afficher les noms' : 'Cacher les noms pour faire deviner les élèves';
        revealBtn.style.display = hideNames ? '' : 'none';
        applyLabels();
    }

    // ── Événements ────────────────────────────────────────────────────────
    // Gestion « tap » compatible souris, doigt et stylet (vidéoprojecteur
    // interactif, TBI). Le stylet envoie des événements pointer/touch : si le
    // déplacement du widget les intercepte, le « click » n'arrive jamais sur
    // l'élément. On détecte donc nous-mêmes le tap (pointerdown → pointerup),
    // avec une tolérance de mouvement, et on garde le click en secours.
    const _TAP_TOL = 20;          // px de tremblement toléré pour le stylet
    let _lastTapAt = 0;
    const _itemFrom = (target) => {
        const t = target && target.closest ? target.closest('[data-id]') : null;
        return (t && svg.contains(t)) ? t : null;
    };
    const _activate = (t) => {
        const now = Date.now();
        if (now - _lastTapAt < 450) return;   // évite le double déclenchement pointerup + click
        _lastTapAt = now;
        onItemClick(t.getAttribute('data-id'));
    };
    const _stopIfItem = (e) => {
        if (e.target.closest && e.target.closest('.gf-item')) e.stopPropagation();
    };
    svg.addEventListener('mousedown', _stopIfItem);
    svg.addEventListener('touchstart', _stopIfItem, { passive: true });
    svg.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;   // clic droit / milieu
        const t = _itemFrom(e.target);
        if (!t) return;
        e.stopPropagation();
        const pid = e.pointerId, x0 = e.clientX, y0 = e.clientY;
        const cleanup = () => {
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', cleanup, true);
        };
        const onUp = (ev) => {
            if (ev.pointerId !== pid) return;
            cleanup();
            if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > _TAP_TOL) return;
            _activate(t);
        };
        // écoute sur window (phase de capture) : fonctionne même si un autre
        // script a capturé le pointeur entre-temps
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('pointercancel', cleanup, true);
    });
    svg.addEventListener('click', (e) => {
        const t = _itemFrom(e.target);
        if (!t) return;
        e.stopPropagation();
        _activate(t);
    });
    hideBtn.addEventListener('click', () => {
        revealed = new Set();
        if (!hideNames && selected) select(null);
        setHideNames(!hideNames);
        saveBoard();
    });
    revealBtn.addEventListener('click', () => {
        Object.keys(items).forEach(id => revealed.add(id));
        applyLabels();
        saveBoard();
    });
    homeBtn.addEventListener('click', () => { select(null); saveBoard(); });
    controls.querySelectorAll('.gf-layer-btn').forEach(b => {
        b.addEventListener('click', () => {
            layers[b.dataset.layer] = !layers[b.dataset.layer];
            applyLayers();
            applyLabels();
            saveBoard();
        });
    });
    viewsBar.querySelectorAll('.gf-view-btn').forEach(b => {
        b.addEventListener('mousedown', (e) => e.stopPropagation());
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (b.dataset.view === view) { select(null); saveBoard(); return; }
            setViewMode(b.dataset.view);
            saveBoard();
        });
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    function applySize() {
        mapWrap.style.height = mapH + 'px';
    }

    // Resize 2D (largeur du widget + hauteur de la carte)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = mapH;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(_minW(), startW + ev.clientX - startX) + 'px';
            mapH = Math.max(240, startH + ev.clientY - startY);
            applySize();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = mapH;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width = Math.max(_minW(), startW + t.clientX - startX) + 'px';
            mapH = Math.max(240, startH + t.clientY - startY);
            applySize();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // Recalcul de la vue quand la taille de la carte change
    let _lastSize = '';
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            const sz = svg.clientWidth + 'x' + svg.clientHeight;
            if (sz !== _lastSize && svg.clientWidth) {
                _lastSize = sz;
                if (animId) { cancelAnimationFrame(animId); animId = null; }
                setView(targetView());
                renderSide();
            }
        });
        ro.observe(mapWrap);
        ro.observe(side);
    }

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _savedH = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🗺 Géographie de la France', {
            onExpand: () => requestAnimationFrame(() => { setView(targetView()); renderSide(); })
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            _savedH = mapH;
            container.classList.add('wf-fullboard');
            mapH = Math.max(mapH, window.innerHeight - 130);
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
            if (_savedH) mapH = _savedH;
        }
        applySize();
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    applySize();
    applyLabels();
    applyLayers();
    setViewMode(view, false);
    requestAnimationFrame(() => { setView(targetView()); renderSide(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._gfGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        mapH:       _isMax && _savedH ? _savedH : mapH,
        layers:     { ...layers },
        hideNames,
        revealed:   Array.from(revealed),
        selected,
        view
    });
    widget._gfSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = _fitW(d.containerW) + 'px';
        if (d.mapH) mapH = Math.max(240, d.mapH);
        applySize();
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(id => items[id]));
        setHideNames(!!d.hideNames);
        view = GF_VIEWS[d.view] ? d.view : 'physique';
        selected = (d.selected && items[d.selected]) ? d.selected : null;
        applyLayers();
        setViewMode(view, false);
        requestAnimationFrame(() => { setView(targetView()); renderSide(); });
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_gfSetData');

    saveBoard();
    return widget;
}
