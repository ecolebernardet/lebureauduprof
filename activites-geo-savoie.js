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
// WIDGET GÉOGRAPHIE DE LA SAVOIE — Le Bureau du Prof
// Carte interactive du département de la Savoie (73) : villes, rivières
// (Isère, Arc, Rhône), lacs (Bourget, Aiguebelette), massifs (Bauges,
// Chartreuse, Beaufortain, Vanoise, Belledonne, Lauzière, Arves), vallées
// (Maurienne, Tarentaise, Combe de Savoie), grands sommets et voisins.
// Clic sur un élément : zoom sur l'élément + fiche d'information.
// Options : calques affichables, masquer les noms (mode devinette).
// Sur téléphone : ouverture directe en plein écran (bouton vert).
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
        .widget[data-type="geo-savoie"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .gs-container {
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
        .gs-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .gs-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .gs-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            letter-spacing: 0.3px;
            background: #e6f2e4;
            color: #2f6b2a;
        }

        /* Réduit / plein écran */
        .gs-container.wf-minimized > *:not(.gs-header) { display: none !important; }
        .gs-container.wf-minimized { gap: 0; }
        .gs-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }

        /* Téléphone : plein écran en laissant 40 px à gauche pour les onglets latéraux (comme le Taquin) */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gs-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .gs-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .gs-btn {
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
        .gs-btn:hover { background: #e0e0e0; }
        .gs-btn:active { transform: scale(0.96); }
        .gs-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .gs-btn.on:hover { background: #357abd; }
        .gs-btn-reveal { background: #28a745; color: #fff; border-color: #28a745; }
        .gs-btn-reveal:hover { background: #218838; }
        .gs-layers { display: flex; gap: 4px; margin-left: auto; align-items: center; flex-wrap: wrap; }
        .gs-layers-lbl { font-size: 10px; font-weight: 700; color: #888; margin-right: 2px; }
        .gs-layer-btn {
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
        .gs-layer-btn:hover { background: #e0e0e0; }
        .gs-layer-btn.active { background: #e8eefc; color: #2f4f9e; border-color: #b7c7f0; }

        /* Corps : carte + fiche */
        .gs-body { display: flex; gap: 10px; align-items: stretch; }
        .gs-map-wrap {
            flex: 1 1 auto;
            min-width: 0;
            position: relative;
            border: 1px solid #c9d6c0;
            border-radius: 10px;
            overflow: hidden;
            background: #ebece6;
        }
        .gs-map { display: block; width: 100%; height: 100%; touch-action: none; }
        .gs-side {
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
        .gs-side h4 { margin: 0 0 2px; font-weight: 900; }
        .gs-side .gs-kind { font-weight: 700; color: #6b7280; margin-bottom: 8px; }
        .gs-side p { margin: 0 0 6px; }
        .gs-side ul { margin: 0 0 6px; padding-left: 0; list-style: none; }
        .gs-side li { margin-bottom: 4px; }
        .gs-side .gs-legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .gs-side .gs-sw { width: 22px; height: 14px; border-radius: 3px; flex-shrink: 0; }
        .gs-side .gs-hint { color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .gs-back-btn {
            margin-top: 6px;
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #fff; color: #333; font-size: 12px; font-weight: 700; cursor: pointer;
        }
        .gs-back-btn:hover { background: #f0f0f0; }

        /* Éléments de la carte */
        .gs-map text { font-family: 'Segoe UI', system-ui, sans-serif; paint-order: stroke; stroke-linejoin: round; }
        .gs-item { cursor: pointer; transition: opacity .25s; }
        .gs-has-sel .gs-item:not(.gs-sel) { opacity: .3; }
        .gs-has-sel .gs-country:not(.gs-sel) { opacity: 1; fill: #eceee7; }
        .gs-country { fill: #e4e6dc; stroke: #ffffff; stroke-width: 2; }
        .gs-country:hover { fill: #d5dbc8; }
        .gs-country.gs-sel { fill: #cfe0b8; }
        .gs-other { fill: #ebece6; stroke: #ffffff; stroke-width: 2; }
        .gs-savoie { fill: #fdf6e1; stroke: #8a6d3b; stroke-width: 3; stroke-linejoin: round; }
        .gs-massif { stroke: #9a6a3a; stroke-width: 1.5; stroke-opacity: .55; }
        .gs-massif:hover, .gs-massif.gs-sel { stroke-width: 3.5; stroke-opacity: 1; }
        .gs-valley { fill: none; stroke: #5fa85a; stroke-opacity: .33; stroke-width: 30; stroke-linecap: round; stroke-linejoin: round; }
        .gs-valley:hover { stroke-opacity: .5; }
        .gs-valley.gs-sel { stroke-opacity: .6; }
        .gs-river { fill: none; stroke: #2b7bd0; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        .gs-river.gs-sel { stroke-width: 6; }
        .gs-river-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
        .gs-river-hit:hover + .gs-river { stroke-width: 5; }
        .gs-lake { fill: #9ccbe8; stroke: #2b7bd0; stroke-width: 1.5; }
        .gs-lake.gs-sel { fill: #6fb2e0; stroke-width: 2.5; }
        .gs-lake-deco { fill: #b9d9ec; stroke: #7fb0d4; stroke-width: 1; pointer-events: none; }
        .gs-city { fill: #d63b3b; stroke: #ffffff; stroke-width: 2; }
        .gs-city.gs-sel { fill: #a51d1d; }
        .gs-city-deco { fill: #9aa0a6; stroke: #ffffff; stroke-width: 1.5; pointer-events: none; }
        .gs-peak { fill: #5b4636; stroke: #ffffff; stroke-width: 1.5; stroke-linejoin: round; }
        .gs-peak.gs-sel { fill: #2d1f14; }
        .gs-lbl-city    { fill: #1f2937; font-weight: 800; stroke: #ffffff; stroke-width: 4; }
        .gs-lbl-river   { fill: #1d5fa8; font-weight: 700; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .gs-lbl-lake    { fill: #0f4c8a; font-weight: 800; font-style: italic; stroke: #ffffff; stroke-width: 4; }
        .gs-lbl-massif  { fill: #7a4b1c; font-weight: 800; font-style: italic; stroke: #fdf6e1; stroke-width: 4; letter-spacing: 1px; }
        .gs-lbl-valley  { fill: #2f6b2a; font-weight: 800; stroke: #ffffff; stroke-width: 4; letter-spacing: 1px; text-transform: uppercase; }
        .gs-lbl-peak    { fill: #4a3626; font-weight: 700; stroke: #ffffff; stroke-width: 4; }
        .gs-lbl-country { fill: #6b7280; font-weight: 700; font-style: italic; stroke: #e4e6dc; stroke-width: 4; letter-spacing: 1px; }
        .gs-lbl-deco    { fill: #8b9096; font-weight: 600; font-style: italic; stroke: #ebece6; stroke-width: 3; pointer-events: none; }
        .gs-lbl.gs-hidden { fill: #d63384; font-style: normal; text-transform: none; }

        /* Calques désactivés */
        .gs-off-villes .gs-L-villes,
        .gs-off-rivieres .gs-L-rivieres,
        .gs-off-lacs .gs-L-lacs,
        .gs-off-massifs .gs-L-massifs,
        .gs-off-vallees .gs-L-vallees,
        .gs-off-sommets .gs-L-sommets,
        .gs-off-voisins .gs-L-voisins { display: none; }
        .gs-off-voisins .gs-country { fill: #ebece6; pointer-events: none; }

        /* Aide */
        .gs-help-btn {
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
        .gs-help-btn:hover { background: #e0e0e0; color: #333; }
        .gs-help-popup {
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
        .gs-help-popup.show { display: block; }
        .gs-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .gs-help-popup p { margin: 0 0 6px; }
        .gs-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .gs-resize-handle {
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
        .gs-container:hover .gs-resize-handle { opacity: 1; }

        /* ── Petits écrans (téléphone, petite tablette) ── */
        .gs-title, .gs-badge { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .gs-container.wf-fullboard .gs-resize-handle { display: none; }
        .gs-tx-s { display: none; }
        @media (pointer: coarse) { .gs-resize-handle { opacity: .6; width: 24px; height: 24px; } }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .gs-container { padding: 10px 10px 8px; gap: 7px; }
            .gs-container.wf-fullboard { overflow: hidden; }
            .gs-title { font-size: 12px; }
            .gs-controls, .gs-layers { gap: 4px; }
            .gs-layers { margin-left: 0; }
            .gs-layers-lbl { display: none; }
            .gs-btn, .gs-layer-btn { min-height: 30px; padding: 4px 9px; font-size: 11px; touch-action: manipulation; }
            .gs-tx { display: none; }
            .gs-tx-s { display: inline; }
            .gs-help-btn { width: 26px; height: 26px; }
            .gs-help-popup { left: 10px; right: 10px; width: auto; max-height: 70vh; overflow-y: auto; }
            .gs-side { padding: 8px 10px; }
            .gs-back-btn { min-height: 32px; }
            /* Plein écran : la carte et la fiche remplissent l'écran, sans défilement */
            .gs-container.wf-fullboard > * { flex-shrink: 0; }
            .gs-container.wf-fullboard > .gs-body { flex: 1 1 0; min-height: 0; }
            .gs-container.wf-fullboard .gs-map-wrap { height: auto !important; }
            .gs-container.wf-fullboard .gs-map { position: absolute; inset: 0; }
            .gs-container.wf-fullboard .gs-side { max-height: 100%; }
        }
        /* Téléphone tenu en portrait : la fiche passe sous la carte */
        @media (max-width: 768px) and (orientation: portrait) {
            .gs-body { flex-direction: column; }
            .gs-side { flex: 0 1 auto; width: auto; min-width: 0; max-width: none; max-height: 45vh; }
            .gs-container.wf-fullboard .gs-map-wrap { flex: 1 1 0; min-height: 180px; }
            .gs-container.wf-fullboard .gs-side { flex: 0 1 auto; max-height: 42%; }
        }
        /* Téléphone tenu en paysage : fiche plus étroite à droite */
        @media (max-height: 500px) and (pointer: coarse) and (orientation: landscape), (max-width: 768px) and (orientation: landscape) {
            .gs-side { flex: 0 0 34%; min-width: 150px; max-width: 300px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Projection (longitude / latitude → coordonnées SVG) ───────────────────
const GS_LON0 = 5.45, GS_LON1 = 7.35, GS_LAT0 = 44.98, GS_LAT1 = 46.02;
const GS_K = 600, GS_COS = Math.cos(45.5 * Math.PI / 180);
const GS_W = (GS_LON1 - GS_LON0) * GS_COS * GS_K;
const GS_H = (GS_LAT1 - GS_LAT0) * GS_K;

function _gsP(lon, lat) { return [(lon - GS_LON0) * GS_COS * GS_K, (GS_LAT1 - lat) * GS_K]; }
function _gsPath(pts, closed) {
    return pts.map((p, i) => {
        const [x, y] = _gsP(p[0], p[1]);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ') + (closed ? ' Z' : '');
}
// Courbe lissée (Catmull-Rom) — ouverte (rivières, vallées) ou fermée (contours)
function _gsSmooth(pts, closed) {
    const P = pts.map(p => _gsP(p[0], p[1]));
    const n = P.length;
    const at = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
        const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        d += ' C' + c1.map(v => v.toFixed(1)).join(' ') + ' ' + c2.map(v => v.toFixed(1)).join(' ') + ' ' + p2.map(v => v.toFixed(1)).join(' ');
    }
    return d + (closed ? ' Z' : '');
}
const _gsRev = a => a.slice().reverse();

// ── Limites du département (tracé simplifié) ──────────────────────────────
// Nord : limite avec la Haute-Savoie (d'ouest en est)
const GS_B_HS = [[5.83,45.94],[5.87,45.90],[5.93,45.87],[5.98,45.83],[6.03,45.80],[6.09,45.78],[6.15,45.76],[6.20,45.73],[6.26,45.71],[6.31,45.69],[6.36,45.71],[6.41,45.77],[6.45,45.79],[6.50,45.82],[6.56,45.84],[6.62,45.85],[6.68,45.83],[6.73,45.80],[6.80,45.78]];
// Est : frontière avec l'Italie (du nord au sud)
const GS_B_IT = [[6.80,45.78],[6.84,45.73],[6.88,45.68],[6.95,45.64],[7.00,45.58],[7.05,45.52],[7.06,45.47],[7.12,45.43],[7.18,45.41],[7.17,45.33],[7.12,45.25],[7.06,45.22],[6.97,45.21],[6.90,45.17],[6.82,45.15],[6.74,45.14],[6.68,45.13],[6.62,45.11],[6.57,45.11]];
// Sud : limite avec les Hautes-Alpes (d'est en ouest)
const GS_B_HA = [[6.57,45.11],[6.50,45.10],[6.43,45.07],[6.38,45.10],[6.30,45.12]];
// Sud-ouest : limite avec l'Isère (Belledonne, puis Chartreuse et Guiers)
const GS_B_IS = [[6.30,45.12],[6.24,45.16],[6.18,45.20],[6.15,45.26],[6.12,45.31],[6.10,45.36],[6.08,45.41],[6.05,45.45],[6.01,45.49],[5.96,45.48],[5.93,45.465],[5.89,45.44],[5.84,45.40],[5.79,45.42],[5.75,45.43],[5.72,45.46],[5.70,45.50],[5.67,45.54],[5.64,45.57],[5.62,45.61]];
// Ouest : le Rhône, limite avec l'Ain (du sud au nord)
const GS_B_AIN = [[5.62,45.61],[5.66,45.64],[5.71,45.68],[5.75,45.72],[5.77,45.77],[5.77,45.82],[5.81,45.87],[5.83,45.94]];

const GS_SAVOIE = [].concat(GS_B_HS, GS_B_IT.slice(1), GS_B_HA.slice(1), GS_B_IS.slice(1), GS_B_AIN.slice(1, -1));

// Terre hors voisins directs (Suisse, coin nord-est)
const GS_SUISSE = [[7.04,45.92],[7.20,45.87],[7.50,45.95],[7.50,46.20],[6.90,46.20],[6.98,46.05]];

// ── Départements et pays voisins ──────────────────────────────────────────
const GS_NEIGHBORS = [
    { id: 'hautesavoie', name: 'Haute-Savoie', lbl: [6.45, 45.93], size: 1,
      shape: [].concat([[5.86,46.20],[5.85,46.05]], GS_B_HS, [[6.87,45.83],[6.95,45.87],[7.04,45.92],[6.98,46.05],[6.90,46.20]]),
      info: { type: 'Département (74)', chef: 'Annecy (préfecture)', fact: 'Avec la Savoie, elle forme les « Pays de Savoie ». On y trouve le Mont Blanc, le lac d\'Annecy et une partie du lac Léman.' } },
    { id: 'dept-isere', name: 'Isère', lbl: [5.62, 45.28], size: 1,
      shape: [].concat([[5.30,45.78],[5.50,45.72]], _gsRev(GS_B_IS), [[6.25,45.00],[6.15,44.80],[5.30,44.80]]),
      info: { type: 'Département (38)', chef: 'Grenoble (préfecture)', fact: 'Les massifs de la Chartreuse et de Belledonne sont partagés entre la Savoie et l\'Isère. La rivière Isère, après avoir quitté la Savoie, traverse Grenoble.' } },
    { id: 'ain', name: 'Ain', lbl: [5.56, 45.93], size: 1,
      shape: [].concat([[5.30,46.20],[5.86,46.20],[5.85,46.05]], _gsRev(GS_B_AIN), [[5.50,45.72],[5.30,45.78]]),
      info: { type: 'Département (01)', chef: 'Bourg-en-Bresse (préfecture)', fact: 'La Savoie et l\'Ain sont séparés par le Rhône, qui forme une frontière naturelle entre les deux départements.' } },
    { id: 'hautesalpes', name: 'Hautes-Alpes', lbl: [6.48, 45.02], size: 0.8,
      shape: [].concat([[6.15,44.80],[6.25,45.00]], _gsRev(GS_B_HA), [[6.68,45.02],[6.75,44.90],[6.90,44.80]]),
      info: { type: 'Département (05)', chef: 'Gap (préfecture)', fact: 'Le col du Galibier (2 642 m) relie la Maurienne (Savoie) à la vallée de la Guisane et à Briançon (Hautes-Alpes). C\'est un col célèbre du Tour de France.' } },
    { id: 'italie', name: 'Italie', lbl: [7.24, 45.74], size: 1,
      shape: [].concat([[6.90,44.80],[6.75,44.90],[6.68,45.02]], _gsRev(GS_B_IT), [[6.87,45.83],[6.95,45.87],[7.04,45.92],[7.20,45.87],[7.50,45.95],[7.50,44.80]]),
      info: { type: 'Pays voisin (régions Vallée d\'Aoste et Piémont)', chef: 'Rome (capitale de l\'Italie)', fact: 'La frontière suit la crête des montagnes. On passe en Italie par le col du Petit-Saint-Bernard (Tarentaise), le col du Mont-Cenis ou le tunnel du Fréjus (Maurienne).' } }
];

// ── Villes ────────────────────────────────────────────────────────────────
const GS_CITIES = [
    { id: 'chambery', name: 'Chambéry', p: [5.92, 45.566], lp: 'r', big: true, statut: 'Préfecture de la Savoie', pop: '60 000', lieu: 'cluse de Chambéry, entre les Bauges et la Chartreuse',
      fact: 'Ancienne capitale des États de Savoie. On y visite le château des ducs de Savoie et la célèbre fontaine des Éléphants.' },
    { id: 'aix', name: 'Aix-les-Bains', p: [5.909, 45.688], lp: 'r', statut: 'Commune', pop: '31 000', lieu: 'au bord du lac du Bourget',
      fact: 'Ville thermale célèbre pour ses sources d\'eau chaude, depuis l\'époque romaine. Elle possède un grand port de plaisance sur le lac du Bourget.' },
    { id: 'albertville', name: 'Albertville', p: [6.392, 45.676], lp: 'b', statut: 'Sous-préfecture', pop: '19 000', lieu: 'confluent de l\'Isère et de l\'Arly, porte de la Tarentaise et du Beaufortain',
      fact: 'Elle a accueilli les Jeux olympiques d\'hiver de 1992. Sur la colline, la cité médiévale de Conflans domine la ville.' },
    { id: 'stjean', name: 'Saint-Jean-de-Maurienne', p: [6.348, 45.277], lp: 'l', statut: 'Sous-préfecture', pop: '7 500', lieu: 'vallée de la Maurienne',
      fact: 'Capitale historique de la Maurienne. Une grande usine d\'aluminium y fonctionne grâce à l\'électricité produite par les barrages de montagne.' },
    { id: 'bourg', name: 'Bourg-Saint-Maurice', p: [6.77, 45.618], lp: 'r', statut: 'Commune', pop: '7 000', lieu: 'Haute-Tarentaise',
      fact: 'Un funiculaire relie la ville à la station des Arcs. C\'est aussi la route vers l\'Italie par le col du Petit-Saint-Bernard.' },
    { id: 'moutiers', name: 'Moûtiers', p: [6.531, 45.486], lp: 'r', statut: 'Commune', pop: '3 500', lieu: 'Tarentaise, au confluent de l\'Isère et du Doron de Bozel',
      fact: 'Porte d\'entrée des « Trois Vallées » (Courchevel, Méribel, Val Thorens), l\'un des plus grands domaines skiables du monde.' },
    { id: 'modane', name: 'Modane', p: [6.664, 45.2], lp: 'b', statut: 'Commune', pop: '3 000', lieu: 'Haute-Maurienne',
      fact: 'Ville frontière : le tunnel ferroviaire du Fréjus (1871) et le tunnel routier (1980) permettent de passer en Italie sous la montagne.' },
    { id: 'montmelian', name: 'Montmélian', p: [6.046, 45.501], lp: 'l', statut: 'Commune', pop: '4 300', lieu: 'Combe de Savoie',
      fact: 'Ancienne place forte qui gardait l\'entrée de la Savoie. C\'est aujourd\'hui la capitale du vignoble savoyard.' },
    { id: 'ugine', name: 'Ugine', p: [6.416, 45.751], lp: 'r', statut: 'Commune', pop: '7 000', lieu: 'val d\'Arly',
      fact: 'Ville industrielle connue pour son aciérie, qui fabrique de l\'acier inoxydable depuis plus d\'un siècle.' },
    { id: 'beaufort', name: 'Beaufort', p: [6.572, 45.719], lp: 'r', statut: 'Commune', pop: '2 100', lieu: 'Beaufortain',
      fact: 'Ce village a donné son nom au célèbre fromage beaufort, fabriqué avec le lait des vaches qui pâturent dans les alpages.' },
    { id: 'valdisere', name: 'Val-d\'Isère', p: [6.98, 45.448], lp: 'r', statut: 'Station de ski', pop: '1 600 (bien plus en hiver)', lieu: 'Haute-Tarentaise, près de la source de l\'Isère',
      fact: 'Grande station de sports d\'hiver, au pied du col de l\'Iseran (2 764 m), l\'un des plus hauts cols routiers des Alpes.' }
];
// Villes repères hors de Savoie (simple décor)
const GS_CITIES_DECO = [
    { name: 'Annecy',   p: [6.13, 45.90] },
    { name: 'Grenoble', p: [5.72, 45.19] }
];

// ── Rivières ──────────────────────────────────────────────────────────────
const GS_RIVERS = [
    { id: 'isere', name: 'Isère', lbl: [6.92, 45.56],
      path: [[7.09,45.42],[7.02,45.44],[6.98,45.45],[6.93,45.47],[6.88,45.50],[6.84,45.54],[6.80,45.59],[6.76,45.62],[6.70,45.60],[6.65,45.56],[6.60,45.52],[6.53,45.49],[6.49,45.54],[6.45,45.60],[6.41,45.65],[6.38,45.67],[6.33,45.63],[6.27,45.59],[6.20,45.55],[6.13,45.52],[6.06,45.49],[6.00,45.45],[5.95,45.38],[5.87,45.30],[5.78,45.23],[5.72,45.19],[5.60,45.14],[5.45,45.10]],
      info: { longueur: '286 km', source: 'glaciers au-dessus de Val-d\'Isère (Haute-Tarentaise)', mer: 'le Rhône, près de Valence', villes: 'Val-d\'Isère, Bourg-Saint-Maurice, Moûtiers, Albertville, Montmélian, puis Grenoble',
              fact: 'Elle a donné son nom au département de l\'Isère. En Savoie, elle creuse la vallée de la Tarentaise, puis la Combe de Savoie, où elle reçoit l\'Arc.' } },
    { id: 'arc', name: 'Arc', lbl: [6.9, 45.262],
      path: [[7.15,45.38],[7.08,45.37],[7.04,45.36],[7.00,45.32],[6.94,45.30],[6.88,45.28],[6.81,45.28],[6.75,45.24],[6.70,45.21],[6.66,45.20],[6.60,45.20],[6.53,45.20],[6.47,45.22],[6.40,45.25],[6.35,45.28],[6.31,45.32],[6.29,45.37],[6.28,45.43],[6.29,45.49],[6.27,45.53],[6.23,45.55],[6.20,45.555]],
      info: { longueur: 'environ 130 km', source: 'glaciers des sources de l\'Arc, au-dessus de Bonneval-sur-Arc (frontière italienne)', mer: 'l\'Isère, près de Chamousset (Combe de Savoie)', villes: 'Bonneval-sur-Arc, Lanslebourg, Modane, Saint-Michel, Saint-Jean-de-Maurienne',
              fact: 'L\'Arc coule tout au long de la vallée de la Maurienne. Ses eaux font tourner de nombreuses centrales hydroélectriques.' } },
    { id: 'rhone', name: 'Rhône', lbl: [5.69, 45.82],
      path: [[5.84,46.05],[5.83,45.97],[5.81,45.90],[5.78,45.84],[5.76,45.78],[5.74,45.73],[5.69,45.67],[5.63,45.61],[5.58,45.65],[5.50,45.72],[5.40,45.76],[5.30,45.78]],
      info: { longueur: '812 km (dont 545 km en France)', source: 'glacier du Rhône, dans les Alpes suisses', mer: 'la mer Méditerranée (delta de la Camargue)', villes: 'Genève, Seyssel, puis Lyon, Valence, Avignon',
              fact: 'Le Rhône forme la limite ouest de la Savoie avec l\'Ain. Le canal de Savières relie le lac du Bourget au Rhône.' } }
];

// ── Lacs ──────────────────────────────────────────────────────────────────
const GS_LAKES = [
    { id: 'bourget', name: 'Lac du Bourget', lines: ['Lac du', 'Bourget'], lbl: [5.835, 45.745], anchor: 'end',
      shape: [[5.875,45.80],[5.89,45.77],[5.905,45.73],[5.90,45.69],[5.885,45.65],[5.865,45.64],[5.855,45.67],[5.855,45.72],[5.86,45.77]],
      info: { taille: 'environ 44 km²', dims: '18 km de long, 1,6 à 3,5 km de large', prof: '145 m', alt: '231 m',
              eau: 'reçoit la Leysse (qui traverse Chambéry) et le Sierroz ; ses eaux rejoignent le Rhône par le canal de Savières',
              rives: 'Aix-les-Bains, Le Bourget-du-Lac, Brison-Saint-Innocent, Chanaz',
              fact: 'C\'est le plus grand lac naturel situé entièrement en France. Il a été creusé par un glacier il y a plusieurs milliers d\'années.',
              more: [
                  'Le poète Alphonse de Lamartine l\'a rendu célèbre avec son poème « Le Lac » (1820).',
                  'Sur sa rive ouest, au pied de la Dent du Chat, l\'abbaye d\'Hautecombe abrite les tombeaux de nombreux princes de Savoie.',
                  'On y pêche le lavaret, un poisson typique des grands lacs alpins.'
              ] } },
    { id: 'aiguebelette', name: 'Lac d\'Aiguebelette', lines: ['Lac', 'd\'Aiguebelette'], lbl: [5.778, 45.552], anchor: 'end',
      shape: [[5.79,45.575],[5.81,45.57],[5.82,45.55],[5.81,45.53],[5.795,45.53],[5.785,45.55]],
      info: { taille: 'environ 5,4 km²', dims: 'environ 4 km de long sur 2 km de large', prof: '71 m', alt: '374 m',
              eau: 'alimenté par de petits ruisseaux et des sources ; il se déverse dans le Tiers, affluent du Guiers',
              rives: 'Aiguebelette-le-Lac, Lépin-le-Lac, Novalaise, Nances, Saint-Alban-de-Montbel',
              fact: 'Il se trouve au pied de la montagne de l\'Épine, dans l\'Avant-Pays savoyard, entre Chambéry et le Rhône.',
              more: [
                  'Les bateaux à moteur y sont interdits : on y circule à la rame, à la voile ou en pédalo.',
                  'En été, son eau peut dépasser 25 °C : c\'est l\'un des lacs naturels les plus chauds des Alpes.',
                  'Il compte deux petites îles ; sur la plus petite se trouve une chapelle.',
                  'Grand lieu d\'aviron, il a accueilli les championnats du monde en 1997 et en 2015.'
              ] } }
];
const GS_LAKE_ANNECY = [[6.12,45.905],[6.16,45.87],[6.19,45.83],[6.22,45.80],[6.235,45.795],[6.22,45.82],[6.19,45.86],[6.15,45.90]];

// ── Massifs montagneux ────────────────────────────────────────────────────
const GS_MASSIFS = [
    { id: 'bauges', name: 'Bauges', lbl: [6.11, 45.765],
      shape: [[5.97,45.60],[5.99,45.68],[6.04,45.75],[6.10,45.80],[6.17,45.79],[6.25,45.74],[6.31,45.69],[6.30,45.64],[6.22,45.60],[6.12,45.56],[6.03,45.55]],
      info: { sommet: 'l\'Arcalod (2 217 m)', type: 'Préalpes calcaires : falaises, forêts et alpages', protection: 'Parc naturel régional (1995), Géoparc mondial de l\'UNESCO',
              fact: 'Le massif des Bauges se trouve entre Chambéry, Aix-les-Bains, Annecy et Albertville. On y fabrique la tome des Bauges.' } },
    { id: 'chartreuse', name: 'Chartreuse', lbl: [5.82, 45.36],
      shape: [[5.78,45.55],[5.88,45.53],[5.95,45.49],[5.97,45.42],[5.92,45.32],[5.84,45.24],[5.75,45.22],[5.68,45.30],[5.70,45.42],[5.73,45.50]],
      info: { sommet: 'Chamechaude (2 082 m, en Isère) ; côté savoyard : le Mont Granier (1 933 m)', type: 'Préalpes calcaires : hautes falaises et forêts', protection: 'Parc naturel régional (1995)',
              fact: 'Le massif est partagé entre la Savoie et l\'Isère. Il abrite le monastère de la Grande Chartreuse, où les moines inventèrent une liqueur célèbre.' } },
    { id: 'beaufortain', name: 'Beaufortain', lbl: [6.6, 45.8],
      shape: [[6.45,45.70],[6.50,45.78],[6.58,45.83],[6.68,45.83],[6.76,45.78],[6.77,45.70],[6.72,45.63],[6.62,45.59],[6.52,45.60],[6.46,45.64]],
      info: { sommet: 'la pointe de Roignais (2 995 m)', type: 'massif cristallin aux grands alpages', protection: 'pas de parc, mais des alpages très préservés',
              fact: 'Pays des alpages et du fromage beaufort. On y trouve la Pierra Menta et le grand barrage de Roselend.' } },
    { id: 'vanoise', name: 'Vanoise', lbl: [6.66, 45.325],
      shape: [[6.55,45.45],[6.62,45.50],[6.72,45.53],[6.84,45.52],[6.93,45.45],[7.00,45.38],[6.96,45.32],[6.85,45.30],[6.74,45.26],[6.62,45.24],[6.52,45.27],[6.48,45.35]],
      info: { sommet: 'la Grande Casse (3 855 m), point culminant de la Savoie', type: 'haute montagne : glaciers et sommets enneigés', protection: 'Parc national de la Vanoise (1963), le premier parc national de France',
              fact: 'Entre la Tarentaise et la Maurienne. On peut y observer des bouquetins, des chamois, des marmottes et même des gypaètes barbus.' } },
    { id: 'belledonne', name: 'Belledonne', lbl: [6.11, 45.32],
      shape: [[6.06,45.46],[6.14,45.50],[6.22,45.52],[6.26,45.47],[6.25,45.38],[6.20,45.28],[6.12,45.18],[6.00,45.10],[5.92,45.15],[5.97,45.28],[6.02,45.38]],
      info: { sommet: 'le Grand Pic de Belledonne (2 977 m, en Isère)', type: 'massif cristallin, longue chaîne de sommets', protection: 'aucune protection d\'ensemble',
              fact: 'Longue chaîne qui s\'étend de Grenoble jusqu\'à la Maurienne. Elle est parsemée de lacs d\'altitude, comme les lacs des Sept Laux.' } },
    { id: 'lauziere', name: 'Lauzière', lbl: [6.39, 45.445],
      shape: [[6.30,45.55],[6.37,45.60],[6.45,45.58],[6.50,45.50],[6.47,45.42],[6.38,45.37],[6.32,45.42]],
      info: { sommet: 'le Grand Pic de la Lauzière (2 829 m)', type: 'massif cristallin aux crêtes très découpées', protection: 'une réserve naturelle protège ses forêts',
              fact: 'Petit massif sauvage coincé entre la Maurienne et la Tarentaise, au-dessus de la Combe de Savoie.' } },
    { id: 'arves', name: 'Arves', lbl: [6.33, 45.175],
      shape: [[6.20,45.22],[6.30,45.25],[6.42,45.22],[6.46,45.15],[6.38,45.10],[6.25,45.12]],
      info: { sommet: 'les Aiguilles d\'Arves (3 514 m)', type: 'haute montagne aux pics rocheux pointus', protection: 'aucune protection d\'ensemble',
              fact: 'Au sud de Saint-Jean-de-Maurienne. Les cols de la Croix-de-Fer et du Galibier, célèbres au Tour de France, sont tout proches.' } }
];

// ── Vallées ───────────────────────────────────────────────────────────────
const GS_VALLEYS = [
    { id: 'maurienne', name: 'Maurienne', lbl: [6.47, 45.258],
      path: [[7.04,45.36],[6.94,45.30],[6.81,45.28],[6.70,45.21],[6.60,45.20],[6.47,45.22],[6.35,45.28],[6.29,45.37],[6.28,45.45],[6.27,45.53]],
      info: { riviere: 'l\'Arc', villes: 'Saint-Jean-de-Maurienne, Saint-Michel, Modane, Lanslebourg, Bonneval-sur-Arc', longueur: 'environ 120 km',
              fact: 'L\'une des plus longues vallées des Alpes. C\'est une grande voie de passage vers l\'Italie (tunnel du Fréjus, col du Mont-Cenis). Les cols du Galibier, de l\'Iseran et de la Croix-de-Fer y mènent.' } },
    { id: 'tarentaise', name: 'Tarentaise', lbl: [6.66, 45.545],
      path: [[6.98,45.45],[6.88,45.50],[6.80,45.59],[6.76,45.62],[6.65,45.56],[6.53,45.49],[6.45,45.60],[6.39,45.67]],
      info: { riviere: 'l\'Isère', villes: 'Albertville, Moûtiers, Aime, Bourg-Saint-Maurice, Val-d\'Isère', longueur: 'environ 100 km',
              fact: 'La vallée des grandes stations de ski : Val-d\'Isère, Tignes, Les Arcs, La Plagne, Courchevel, Méribel, Val Thorens… Elle a accueilli de nombreuses épreuves des JO de 1992.' } },
    { id: 'combe', name: 'Combe de Savoie', lines: ['Combe', 'de Savoie'], lbl: [6.19, 45.505],
      path: [[6.38,45.66],[6.27,45.59],[6.20,45.55],[6.13,45.52],[6.06,45.49]],
      info: { riviere: 'l\'Isère (qui y reçoit l\'Arc)', villes: 'Albertville, Saint-Pierre-d\'Albigny, Montmélian', longueur: 'environ 40 km',
              fact: 'Large vallée plate et ensoleillée entre les Bauges et Belledonne. On y cultive la vigne (vins de Savoie) et les arbres fruitiers.' } }
];

// ── Sommets ───────────────────────────────────────────────────────────────
const GS_PEAKS = [
    { id: 'montblanc', name: 'Mont Blanc', p: [6.865, 45.833], ldy: -16, alt: '4 806 m', massif: 'massif du Mont-Blanc (Haute-Savoie / Italie)',
      fact: 'Plus haut sommet des Alpes et d\'Europe occidentale. Il n\'est pas en Savoie mais en Haute-Savoie, à la frontière italienne. On le voit depuis de nombreux endroits de Savoie.' },
    { id: 'grandecasse', name: 'Grande Casse', p: [6.827, 45.405], alt: '3 855 m', massif: 'Vanoise',
      fact: 'C\'est le plus haut sommet du département de la Savoie. Sa face nord est couverte d\'un glacier.' },
    { id: 'aiguillesarves', name: 'Aiguilles d\'Arves', p: [6.36, 45.123], alt: '3 514 m', massif: 'Arves',
      fact: 'Trois aiguilles rocheuses très pointues, faciles à reconnaître de loin. Les alpinistes les escaladent depuis le XIXe siècle.' },
    { id: 'pierramenta', name: 'Pierra Menta', p: [6.637, 45.664], alt: '2 714 m', massif: 'Beaufortain',
      fact: 'Un gros rocher planté sur une crête. La légende raconte que Gargantua l\'y aurait lancé d\'un coup de pied ! Une célèbre course de ski-alpinisme porte son nom.' },
    { id: 'arcalod', name: 'Arcalod', p: [6.21, 45.677], alt: '2 217 m', massif: 'Bauges',
      fact: 'Le point culminant du massif des Bauges, très apprécié des randonneurs.' },
    { id: 'granier', name: 'Mont Granier', p: [5.93, 45.465], alt: '1 933 m', massif: 'Chartreuse',
      fact: 'Immense falaise au-dessus de Chambéry. En 1248, un énorme pan de la montagne s\'est effondré et a enseveli plusieurs villages : ce sont aujourd\'hui les « abîmes de Myans ».' },
    { id: 'dentduchat', name: 'Dent du Chat', p: [5.83, 45.665], alt: '1 390 m', massif: 'chaîne de l\'Épine (Jura méridional)',
      fact: 'Elle domine le lac du Bourget. Selon la légende, un chat monstrueux qui terrorisait la région y aurait été vaincu par le roi Arthur.' }
];

const GS_LAYERS = {
    villes:   { label: '🏙 Villes',    kindName: 'Ville' },
    rivieres: { label: '🌊 Rivières',  kindName: 'Rivière / fleuve' },
    lacs:     { label: '💧 Lacs',      kindName: 'Lac' },
    massifs:  { label: '⛰ Massifs',   kindName: 'Massif montagneux' },
    vallees:  { label: '🏞 Vallées',   kindName: 'Vallée' },
    sommets:  { label: '🔺 Sommets',   kindName: 'Sommet' },
    voisins:  { label: '🗺 Voisins',   kindName: 'Département / pays voisin' }
};
const GS_COLORS = { villes: '#d63b3b', rivieres: '#2b7bd0', lacs: '#2b88c4', massifs: '#9a6a3a', vallees: '#3f8a3a', sommets: '#5b4636', voisins: '#6b8f4e' };

function _gsEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Création du widget ────────────────────────────────────────────────────
function createGeoSavoieWidget() {
    snapshotNow();
    const pos = findFreePosition();

    // Petit écran : largeur presque pleine, tailles minimales réduites
    const _phone = window._wfIsPhone();
    const _minW = () => window._wfIsPhone() ? 260 : 560;
    const _fitW = w => window._wfIsPhone() ? Math.min(w, Math.max(260, window.innerWidth - 54)) : w;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'geo-savoie';
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
    container.className = 'gs-container';

    // Taille initiale : 70% de la largeur de la page
    const initW = _phone ? Math.max(260, window.innerWidth - 54) : Math.round(window.innerWidth * 0.7);
    container.style.width = initW + 'px';
    let mapH = _phone ? Math.max(220, Math.round((initW - 22) * GS_H / GS_W))
                      : Math.max(320, Math.round((initW * 0.72 - 30) * GS_H / GS_W));

    // En-tête
    const header = document.createElement('div');
    header.className = 'gs-header';
    header.innerHTML = `
        <span class="gs-title">⛰ Géographie de la Savoie</span>
        <span class="gs-badge">Vue d'ensemble</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.gs-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'gs-controls';
    controls.innerHTML = `
        <button class="gs-btn gs-btn-hide" title="Cacher les noms pour faire deviner les élèves">🙈<span class="gs-tx"> Masquer les noms</span></button>
        <button class="gs-btn gs-btn-reveal" style="display:none" title="Tout révéler">👁<span class="gs-tx"> Tout révéler</span></button>
        <button class="gs-btn gs-btn-home" title="Revenir à la carte entière">🔍<span class="gs-tx"> Vue d'ensemble</span></button>
        <div class="gs-layers">
            <span class="gs-layers-lbl">Afficher :</span>
            ${Object.keys(GS_LAYERS).map(k => `<button class="gs-layer-btn active" data-layer="${k}">${GS_LAYERS[k].label}</button>`).join('')}
        </div>
    `;
    const hideBtn   = controls.querySelector('.gs-btn-hide');
    const revealBtn = controls.querySelector('.gs-btn-reveal');
    const homeBtn   = controls.querySelector('.gs-btn-home');
    container.appendChild(controls);

    // Corps : carte + fiche
    const body = document.createElement('div');
    body.className = 'gs-body';
    const mapWrap = document.createElement('div');
    mapWrap.className = 'gs-map-wrap';
    const side = document.createElement('div');
    side.className = 'gs-side';
    body.appendChild(mapWrap);
    body.appendChild(side);
    container.appendChild(body);

    // ── Construction de la carte SVG ──────────────────────────────────────
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gs-map');
    svg.setAttribute('viewBox', `0 0 ${GS_W.toFixed(1)} ${GS_H.toFixed(1)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const uid = Math.random().toString(36).slice(2, 8);
    const clipId = 'gs-clip-' + uid, hatchId = 'gs-hatch-' + uid;
    svg.innerHTML = `
        <defs>
            <pattern id="${hatchId}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                <rect width="10" height="10" fill="#c99a63" fill-opacity="0.34"></rect>
                <line x1="0" y1="0" x2="0" y2="10" stroke="#9a6a3a" stroke-width="2.4" stroke-opacity="0.42"></line>
            </pattern>
            <clipPath id="${clipId}"><rect x="0" y="0" width="${GS_W.toFixed(1)}" height="${GS_H.toFixed(1)}"></rect></clipPath>
        </defs>
        <rect x="-5000" y="-5000" width="12000" height="12000" fill="#ebece6"></rect>
        <g clip-path="url(#${clipId})">
            <g class="gs-g-land"></g>
            <g class="gs-g-countries"></g>
            <g class="gs-g-savoie"></g>
            <g class="gs-L-massifs gs-g-massifs"></g>
            <g class="gs-L-vallees gs-g-valleys"></g>
            <g class="gs-g-lakes"></g>
            <g class="gs-L-rivieres gs-g-rivers"></g>
            <g class="gs-L-sommets gs-g-peaks"></g>
            <g class="gs-g-cities-deco gs-L-voisins"></g>
            <g class="gs-L-villes gs-g-cities"></g>
            <g class="gs-g-labels">
                <g class="gs-L-voisins"></g>
                <g class="gs-L-vallees"></g>
                <g class="gs-L-massifs"></g>
                <g class="gs-L-lacs"></g>
                <g class="gs-L-rivieres"></g>
                <g class="gs-L-sommets"></g>
                <g class="gs-L-villes"></g>
            </g>
        </g>
    `;
    mapWrap.appendChild(svg);

    const gLand      = svg.querySelector('.gs-g-land');
    const gCountries = svg.querySelector('.gs-g-countries');
    const gSavoie    = svg.querySelector('.gs-g-savoie');
    const gMassifs   = svg.querySelector('.gs-g-massifs');
    const gValleys   = svg.querySelector('.gs-g-valleys');
    const gLakes     = svg.querySelector('.gs-g-lakes');
    const gRivers    = svg.querySelector('.gs-g-rivers');
    const gPeaks     = svg.querySelector('.gs-g-peaks');
    const gCityDeco  = svg.querySelector('.gs-g-cities-deco');
    const gCities    = svg.querySelector('.gs-g-cities');
    const gLabels    = {};
    ['voisins', 'vallees', 'massifs', 'lacs', 'rivieres', 'sommets', 'villes'].forEach(k => {
        gLabels[k] = svg.querySelector('.gs-g-labels .gs-L-' + k);
    });

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    const items = {};     // id -> { id, layer, name, data, shapes:[], label, zoom }
    const labels = [];    // { el, ax, ay, dx, dy, size, lines, item }
    const scalables = []; // éléments dont la taille suit le zoom : fonction(s)

    function addLabel(item, layer, cls, lonlat, size, dx, dy, anchor, lines) {
        const [ax, ay] = _gsP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'gs-lbl ' + cls + ' gs-item', 'text-anchor': anchor || 'middle', 'data-id': item.id }, gLabels[layer]);
        const lb = { el: t, ax, ay, dx: dx || 0, dy: dy || 0, size, lines: lines || [item.name], item };
        labels.push(lb);
        item.label = lb;
        item.shapes.push(t);
        return lb;
    }
    // Étiquette simple, non cliquable (décor)
    const decoLabels = [];
    function addDecoLabel(text, lonlat, size, dx, dy, anchor, parent) {
        const [ax, ay] = _gsP(lonlat[0], lonlat[1]);
        const t = el('text', { class: 'gs-lbl-deco', 'text-anchor': anchor || 'middle' }, parent);
        t.textContent = text;
        decoLabels.push({ el: t, ax, ay, dx: dx || 0, dy: dy || 0, size });
    }

    // Suisse (hors voisins directs)
    el('path', { class: 'gs-other', d: _gsPath(GS_SUISSE, true) }, gLand);
    addDecoLabel('Suisse', [7.28, 45.985], 15, 0, 0, 'middle', gLand);

    // Voisins
    GS_NEIGHBORS.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'voisins', name: c.name, data: c, shapes: [] };
        it.shapes.push(el('path', { class: 'gs-country gs-item', d: _gsPath(c.shape, true), 'data-id': c.id }, gCountries));
        const fs = 20 * (c.size || 1);
        addLabel(it, 'voisins', 'gs-lbl-country', c.lbl, fs, 0, fs * 0.35, 'middle');
        it.zoom = { p: c.lbl, w: 420 };
    });

    // Lac d'Annecy (décor, en Haute-Savoie)
    el('path', { class: 'gs-lake-deco', d: _gsSmooth(GS_LAKE_ANNECY, true) }, gCountries);

    // Département de la Savoie
    el('path', { class: 'gs-savoie', d: _gsPath(GS_SAVOIE, true) }, gSavoie);

    // Massifs
    GS_MASSIFS.forEach(m => {
        const it = items[m.id] = { id: m.id, layer: 'massifs', name: m.name, data: m, shapes: [] };
        it.shapes.push(el('path', { class: 'gs-massif gs-item', d: _gsSmooth(m.shape, true), style: `fill:url(#${hatchId})`, 'data-id': m.id }, gMassifs));
        addLabel(it, 'massifs', 'gs-lbl-massif', m.lbl, 20, 0, 7, 'middle', m.lines || null);
        it.zoom = { bbox: true };
    });

    // Vallées (larges bandes vertes le long des rivières)
    GS_VALLEYS.forEach(v => {
        const it = items[v.id] = { id: v.id, layer: 'vallees', name: v.name, data: v, shapes: [] };
        const p = el('path', { class: 'gs-valley gs-item', d: _gsSmooth(v.path), 'data-id': v.id }, gValleys);
        it.shapes.push(p);
        it.mainShape = p;
        addLabel(it, 'vallees', 'gs-lbl-valley', v.lbl, 17, 0, 6, 'middle', v.lines || null);
        it.zoom = { bbox: true };
    });

    // Lacs
    GS_LAKES.forEach(l => {
        const it = items[l.id] = { id: l.id, layer: 'lacs', name: l.name, data: l, shapes: [] };
        const p = el('path', { class: 'gs-lake gs-item gs-L-lacs-shape', d: _gsSmooth(l.shape, true), 'data-id': l.id }, gLakes);
        it.shapes.push(p);
        it.mainShape = p;
        addLabel(it, 'lacs', 'gs-lbl-lake', l.lbl, 17, -4, 5, l.anchor || 'middle', l.lines || null);
        it.zoom = { bbox: true };
    });

    // Rivières
    GS_RIVERS.forEach(r => {
        const it = items[r.id] = { id: r.id, layer: 'rivieres', name: r.name, data: r, shapes: [] };
        const d = _gsSmooth(r.path);
        it.shapes.push(el('path', { class: 'gs-river-hit gs-item', d, 'data-id': r.id }, gRivers));
        const line = el('path', { class: 'gs-river gs-item', d, 'data-id': r.id, 'vector-effect': 'non-scaling-stroke' }, gRivers);
        it.shapes.push(line);
        it.mainShape = line;
        addLabel(it, 'rivieres', 'gs-lbl-river', r.lbl, 18, 0, 6, 'middle');
        it.zoom = { bbox: true };
    });

    // Sommets (triangles)
    GS_PEAKS.forEach(pk => {
        const it = items[pk.id] = { id: pk.id, layer: 'sommets', name: pk.name, data: pk, shapes: [] };
        const [x, y] = _gsP(pk.p[0], pk.p[1]);
        const tri = el('path', { class: 'gs-peak gs-item', 'data-id': pk.id }, gPeaks);
        const R = 9;
        scalables.push(s => {
            const r = R * s;
            tri.setAttribute('d', `M${x.toFixed(1)} ${(y - r).toFixed(1)} L${(x + r * 0.95).toFixed(1)} ${(y + r * 0.7).toFixed(1)} L${(x - r * 0.95).toFixed(1)} ${(y + r * 0.7).toFixed(1)} Z`);
        });
        it.shapes.push(tri);
        addLabel(it, 'sommets', 'gs-lbl-peak', pk.p, 14, 0, pk.ldy || 26, 'middle');
        it.zoom = { p: pk.p, w: 260 };
    });

    // Villes repères hors Savoie (décor)
    GS_CITIES_DECO.forEach(c => {
        const [x, y] = _gsP(c.p[0], c.p[1]);
        const dot = el('circle', { class: 'gs-city-deco', cx: x, cy: y, r: 4 }, gCityDeco);
        scalables.push(s => dot.setAttribute('r', (4 * s).toFixed(2)));
        addDecoLabel(c.name, c.p, 14, 9, 5, 'start', gCityDeco);
    });

    // Villes
    GS_CITIES.forEach(c => {
        const it = items[c.id] = { id: c.id, layer: 'villes', name: c.name, data: c, shapes: [] };
        const [x, y] = _gsP(c.p[0], c.p[1]);
        const r0 = c.big ? 8 : 5.5;
        const dot = el('circle', { class: 'gs-city gs-item', cx: x, cy: y, r: r0, 'data-id': c.id }, gCities);
        it.shapes.push(dot);
        scalables.push(s => dot.setAttribute('r', (r0 * s).toFixed(2)));
        const fs = c.big ? 20 : 16;
        const pos = { r: [11, 6, 'start'], l: [-11, 6, 'end'], b: [0, 24, 'middle'], t: [0, -12, 'middle'] }[c.lp] || [11, 6, 'start'];
        addLabel(it, 'villes', 'gs-lbl-city', c.p, fs, pos[0], pos[1], pos[2]);
        it.zoom = { p: c.p, w: 300 };
    });

    // Bouton aide (dans le header, avant le bouton jaune)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'gs-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'gs-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Géographie de la Savoie</h4>
        <p>La carte présente les <b>villes</b>, les <b>rivières</b> (Isère, Arc, Rhône), les <b>lacs</b>,
        les <b>massifs</b> (Bauges, Chartreuse, Beaufortain, Vanoise…), les <b>vallées</b>
        (Maurienne, Tarentaise, Combe de Savoie), les grands <b>sommets</b> et les <b>voisins</b>.</p>
        <p>👆 <b>Clique sur un élément</b> : la carte zoome dessus et sa fiche s'affiche à droite.
        Clique à nouveau dessus, ou sur <b>Vue d'ensemble</b>, pour revenir à la carte entière.</p>
        <p>🗂 <b>Afficher</b> : active ou désactive chaque catégorie d'éléments.</p>
        <p>🙈 <b>Masquer les noms</b> : les noms sont remplacés par « ? ». Clique sur un élément
        pour dévoiler son nom. Idéal pour faire réviser les élèves !</p>
        <p style="color:#888">Le tracé de la carte et des massifs est simplifié.
        Redimensionne le widget avec le coin en bas à droite.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'gs-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    const layers = { villes: true, rivieres: true, lacs: true, massifs: true, vallees: true, sommets: true, voisins: true };
    let hideNames = false;
    let revealed = new Set();
    let selected = null;
    let vb = { x: 0, y: 0, w: GS_W, h: GS_H };
    let animId = null;

    // ── Vue (viewBox) ─────────────────────────────────────────────────────
    function aspect() {
        const w = svg.clientWidth, h = svg.clientHeight;
        return (w && h) ? w / h : GS_W / GS_H;
    }
    function fullView() {
        const a = aspect();
        if (a > GS_W / GS_H) { const w = GS_H * a; return { x: (GS_W - w) / 2, y: 0, w, h: GS_H }; }
        const h = GS_W / a; return { x: 0, y: (GS_H - h) / 2, w: GS_W, h };
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
            let x1 = Math.min(GS_W, b.x + b.width), y1 = Math.min(GS_H, b.y + b.height);
            const pad = 0.2;
            const w = Math.max(180, (x1 - x0) * (1 + pad * 2));
            const h = Math.max(180, (y1 - y0) * (1 + pad * 2));
            return fitRect((x0 + x1) / 2, (y0 + y1) / 2, w, h);
        }
        const [cx, cy] = _gsP(it.zoom.p[0], it.zoom.p[1]);
        return fitRect(cx, cy, it.zoom.w, it.zoom.w * 0.8);
    }

    // Sur téléphone, la carte est petite : on grossit les noms et les points pour qu'ils restent lisibles
    function lblBoost() {
        const w = svg.clientWidth;
        if (!w || !window._wfIsPhone()) return 1;
        return Math.max(1, Math.min(1.6, 600 / w));   // carte dense : grossissement modéré
    }

    function setView(v) {
        vb = v;
        svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
        const s = Math.min(1, Math.pow(v.w / GS_W, 0.7)) * lblBoost();
        scalables.forEach(fn => fn(s));
        const placeLabel = (lb, lines) => {
            lb.el.setAttribute('font-size', (lb.size * s).toFixed(2));
            lb.el.setAttribute('stroke-width', (4 * s).toFixed(2));
            const x = lb.ax + lb.dx * s, y = lb.ay + lb.dy * s;
            lb.el.setAttribute('x', x.toFixed(1));
            lb.el.setAttribute('y', y.toFixed(1));
            const tsp = lb.el.querySelectorAll('tspan');
            const n = tsp.length;
            tsp.forEach((t, i) => {
                t.setAttribute('x', x.toFixed(1));
                t.setAttribute('y', (y + (i - (n - 1) / 2) * lb.size * s * 1.1).toFixed(1));
            });
        };
        labels.forEach(lb => placeLabel(lb));
        decoLabels.forEach(lb => placeLabel(lb));
        // Les vallées gardent une largeur lisible quand on zoome
        svg.querySelectorAll('.gs-valley').forEach(p => p.style.strokeWidth = (30 * Math.max(0.55, s)).toFixed(1));
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
            lb.el.classList.toggle('gs-hidden', hidden);
            while (lb.el.firstChild) lb.el.removeChild(lb.el.firstChild);
            const lines = hidden ? ['?'] : lb.lines;
            lines.forEach(line => {
                const t = document.createElementNS(NS, 'tspan');
                t.textContent = line;
                lb.el.appendChild(t);
            });
        });
        setView(vb);
    }

    // ── Sélection ─────────────────────────────────────────────────────────
    function applySelection() {
        svg.classList.toggle('gs-has-sel', !!selected);
        Object.values(items).forEach(it => {
            it.shapes.forEach(s => s.classList.toggle('gs-sel', it.id === selected));
        });
        const it = selected && items[selected];
        badge.textContent = it ? 'Zoom : ' + it.name : 'Vue d\'ensemble';
        renderSide();
    }

    function select(id, animate) {
        selected = id;
        applySelection();
        const to = targetView();
        if (animate === false) setView(to); else animateView(to);
    }

    function onItemClick(id) {
        const it = items[id];
        if (!it || !layers[it.layer]) return;
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
    function row(lbl, val) { return `<li><b>${lbl} :</b> ${_gsEsc(val)}</li>`; }

    function renderSide() {
        const W = side.clientWidth || 260;
        const fs = Math.max(12, Math.min(window._wfIsPhone() ? 15 : 18, W / 19));
        side.style.fontSize = fs + 'px';
        const it = selected && items[selected];
        if (!it) {
            side.style.borderLeftColor = '#9ca3af';
            const counts = { villes: GS_CITIES.length, rivieres: GS_RIVERS.length, lacs: GS_LAKES.length, massifs: GS_MASSIFS.length, vallees: GS_VALLEYS.length, sommets: GS_PEAKS.length, voisins: GS_NEIGHBORS.length };
            const sw = {
                villes:   'background:#d63b3b;border-radius:50%;width:14px;height:14px;margin:0 4px;',
                rivieres: 'background:#2b7bd0;height:4px;',
                lacs:     'background:#9ccbe8;border:1px solid #2b7bd0;border-radius:7px;',
                massifs:  'background:repeating-linear-gradient(45deg,#c99a63 0 3px,#e6cfae 3px 6px);',
                vallees:  'background:rgba(95,168,90,.45);border-radius:7px;',
                sommets:  'background:#5b4636;clip-path:polygon(50% 0,100% 100%,0 100%);',
                voisins:  'background:#e4e6dc;border:1px solid #b9bdae;'
            };
            const names = { villes: 'villes', rivieres: 'rivières et fleuve', lacs: 'lacs', massifs: 'massifs montagneux', vallees: 'grandes vallées', sommets: 'sommets', voisins: 'voisins' };
            side.innerHTML = `
                <h4 style="font-size:${Math.round(fs * 1.25)}px;color:#374151">La Savoie (73)</h4>
                <div class="gs-hint">Clique sur un élément de la carte pour zoomer dessus et découvrir sa fiche.</div>
                ${Object.keys(names).map(k => `
                    <div class="gs-legend-row" style="opacity:${layers[k] ? 1 : .35}">
                        <span class="gs-sw" style="${sw[k]}"></span>
                        <span><b>${counts[k]}</b> ${names[k]}</span>
                    </div>`).join('')}
                <p style="margin-top:10px;color:#6b7280">Préfecture : <b>Chambéry</b><br>
                Environ <b>440 000</b> habitants · <b>6 028 km²</b><br>
                Région Auvergne-Rhône-Alpes<br>
                Point culminant : <b>Grande Casse</b> (3 855 m)<br>
                Ancien duché, la Savoie est devenue française en <b>1860</b>.</p>
            `;
            return;
        }
        const color = GS_COLORS[it.layer];
        const d = it.data;
        side.style.borderLeftColor = color;
        let html = `<h4 style="font-size:${Math.round(fs * 1.4)}px;color:${color}">${_gsEsc(it.name)}</h4>`;
        html += `<div class="gs-kind">${GS_LAYERS[it.layer].kindName}</div>`;
        if (it.layer === 'villes') {
            html += '<ul>' + row('Statut', d.statut) + row('Habitants', 'environ ' + d.pop) + row('Situation', d.lieu) + '</ul>';
            html += `<p>${_gsEsc(d.fact)}</p>`;
        } else if (it.layer === 'rivieres') {
            const i = d.info;
            html += '<ul>' + row('Longueur', i.longueur) + row('Source', i.source) + row('Se jette dans', i.mer) + row('Villes traversées', i.villes) + '</ul>';
            html += `<p>${_gsEsc(i.fact)}</p>`;
        } else if (it.layer === 'lacs') {
            const i = d.info;
            html += '<ul>' + row('Superficie', i.taille) + row('Dimensions', i.dims) + row('Profondeur maximale', i.prof)
                + row('Altitude', i.alt) + row('Eaux', i.eau) + row('Communes au bord', i.rives) + '</ul>';
            html += `<p>${_gsEsc(i.fact)}</p>`;
            if (i.more && i.more.length) html += '<ul>' + i.more.map(m => `<li>💧 ${_gsEsc(m)}</li>`).join('') + '</ul>';
        } else if (it.layer === 'massifs') {
            const i = d.info;
            html += '<ul>' + row('Plus haut sommet', i.sommet) + row('Type', i.type) + row('Protection', i.protection) + '</ul>';
            html += `<p>${_gsEsc(i.fact)}</p>`;
        } else if (it.layer === 'vallees') {
            const i = d.info;
            html += '<ul>' + row('Rivière', i.riviere) + row('Longueur', i.longueur) + row('Villes et villages', i.villes) + '</ul>';
            html += `<p>${_gsEsc(i.fact)}</p>`;
        } else if (it.layer === 'sommets') {
            html += '<ul>' + row('Altitude', d.alt) + row('Massif', d.massif) + '</ul>';
            html += `<p>${_gsEsc(d.fact)}</p>`;
        } else if (it.layer === 'voisins') {
            const i = d.info;
            html += '<ul>' + row('Type', i.type) + row('Ville principale', i.chef) + '</ul>';
            html += `<p>${_gsEsc(i.fact)}</p>`;
        }
        html += `<button class="gs-back-btn">↩ Vue d'ensemble</button>`;
        side.innerHTML = html;
        const back = side.querySelector('.gs-back-btn');
        back.addEventListener('mousedown', (e) => e.stopPropagation());
        back.addEventListener('click', (e) => { e.stopPropagation(); select(null); saveBoard(); });
    }

    // ── Calques ───────────────────────────────────────────────────────────
    function applyLayers() {
        Object.keys(layers).forEach(k => svg.classList.toggle('gs-off-' + k, !layers[k]));
        // Les lacs restent dessinés (ce sont des surfaces d'eau) mais ne sont plus cliquables
        gLakes.querySelectorAll('.gs-lake').forEach(p => p.style.pointerEvents = layers.lacs ? '' : 'none');
        controls.querySelectorAll('.gs-layer-btn').forEach(b => b.classList.toggle('active', !!layers[b.dataset.layer]));
        if (selected && !layers[items[selected].layer]) select(null);
        else renderSide();
    }

    function setHideNames(v) {
        hideNames = !!v;
        hideBtn.classList.toggle('on', hideNames);
        hideBtn.innerHTML = hideNames ? '🙉<span class="gs-tx"> Afficher les noms</span>' : '🙈<span class="gs-tx"> Masquer les noms</span>';
        hideBtn.title = hideNames ? 'Afficher les noms' : 'Cacher les noms pour faire deviner les élèves';
        revealBtn.style.display = hideNames ? '' : 'none';
        applyLabels();
    }

    // ── Événements ────────────────────────────────────────────────────────
    // Gestion « tap » compatible souris, doigt et stylet (vidéoprojecteur
    // interactif, TBI) : on détecte nous-mêmes le tap (pointerdown → pointerup),
    // avec une tolérance de mouvement, et on garde le click en secours.
    const _TAP_TOL = 20;
    let _lastTapAt = 0;
    const _itemFrom = (target) => {
        const t = target && target.closest ? target.closest('[data-id]') : null;
        return (t && svg.contains(t)) ? t : null;
    };
    const _activate = (t) => {
        const now = Date.now();
        if (now - _lastTapAt < 450) return;
        _lastTapAt = now;
        onItemClick(t.getAttribute('data-id'));
    };
    const _stopIfItem = (e) => {
        if (e.target.closest && e.target.closest('.gs-item')) e.stopPropagation();
    };
    svg.addEventListener('mousedown', _stopIfItem);
    svg.addEventListener('touchstart', _stopIfItem, { passive: true });
    svg.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;
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
    controls.querySelectorAll('.gs-layer-btn').forEach(b => {
        b.addEventListener('click', () => {
            layers[b.dataset.layer] = !layers[b.dataset.layer];
            applyLayers();
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
        // La fiche ne dépasse pas la hauteur de la carte (elle défile si besoin)
        side.style.maxHeight = mapH + 'px';
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
        window._wfMiniBarCollapse(widget, '⛰ Géographie de la Savoie', {
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
            // Téléphone : la fiche passe sous la carte, on laisse la carte occuper l'écran
            if (window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches) {
                const fitH = Math.round((mapWrap.clientWidth || window.innerWidth) * GS_H / GS_W) + 10;
                mapH = Math.max(240, Math.min(fitH, Math.round(window.innerHeight * 0.75)));
            }
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
    applySelection();
    requestAnimationFrame(() => { setView(targetView()); renderSide(); });

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._gsGetData = () => ({
        containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
        mapH:       _isMax && _savedH ? _savedH : mapH,
        layers:     { ...layers },
        hideNames,
        revealed:   Array.from(revealed),
        selected
    });
    widget._gsSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = _fitW(d.containerW) + 'px';
        if (d.mapH) mapH = Math.max(240, d.mapH);
        applySize();
        if (d.layers) Object.keys(layers).forEach(k => { if (typeof d.layers[k] === 'boolean') layers[k] = d.layers[k]; });
        if (Array.isArray(d.revealed)) revealed = new Set(d.revealed.filter(id => items[id]));
        setHideNames(!!d.hideNames);
        selected = (d.selected && items[d.selected]) ? d.selected : null;
        applyLayers();
        applySelection();
        requestAnimationFrame(() => { setView(targetView()); renderSide(); });
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_gsSetData');

    saveBoard();
    return widget;
}
