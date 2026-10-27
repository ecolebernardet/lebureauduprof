// ── Téléphone : ouverture directe en plein écran (bouton vert), comme le Taquin ──
// (bloc partagé, défini une seule fois pour tous les widgets)
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

// =========================================================================
// WIDGET HISTOIRE — LA SOCIÉTÉ AU MOYEN ÂGE — Le Bureau du Prof
// Trois vues dessinées et interactives (niveau CM1 / CM2) :
//   - 🔺 La pyramide : le roi au sommet, le clergé et la noblesse (les
//     privilégiés), puis le peuple : bourgeois, artisans, paysans, serfs.
//     « Ceux qui prient, ceux qui combattent, ceux qui travaillent ».
//     + infographie « Si le royaume ne comptait que 100 habitants ».
//   - 🏘 La seigneurie : château, forêt, ville, monastère, moulin, village,
//     église, four, péage, réserve, tenures.
//   - ⚖️ Qui doit quoi à qui ? : roi, grand seigneur, chevalier, paysans,
//     clergé et les liens entre eux (fief, hommage, protection, corvées,
//     dîme, prières, sacre).
// Clic sur un élément → son nom et sa fiche (rôle + « Le savais-tu ? »).
// Options : afficher / cacher les noms, mode devinette (noms cachés « ? »),
//   jeu « Qui suis-je ? » (l'élève clique sur la bonne réponse).
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

    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    if (document.getElementById('sm-style')) return;
    const s = document.createElement('style');
    s.id = 'sm-style';
    s.textContent = `
        .widget[data-type="histoire-societe-moyen-age"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .sm-container {
            --smfs: 14px;
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
        .sm-header {
            display: flex; align-items: center; justify-content: space-between;
            gap: 8px; cursor: move; user-select: none;
        }
        .sm-title { font-size: 13px; font-weight: 800; color: #374151; letter-spacing: 0.3px; pointer-events: none; }
        .sm-badge {
            font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
            letter-spacing: 0.3px; background: #f1e6ff; color: #5b3a8a;
        }

        /* Réduit / plein écran */
        .sm-container.wf-minimized > *:not(.sm-header) { display: none !important; }
        .sm-container.wf-minimized { gap: 0; }
        .sm-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 50px !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .sm-container.wf-fullboard {
                left: 40px !important;
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
                min-width: 0 !important;
                padding-left: calc(10px + env(safe-area-inset-left)) !important;
            }
        }

        /* Contrôles */
        .sm-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .sm-btn {
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #f0f0f0; color: #333; font-size: 11px; font-weight: 700;
            cursor: pointer; transition: background .15s, transform .1s, opacity .15s;
        }
        .sm-btn:hover { background: #e0e0e0; }
        .sm-btn:active { transform: scale(0.96); }
        .sm-btn.on { background: #4a90e2; color: #fff; border-color: #4a90e2; }
        .sm-btn.on:hover { background: #357abd; }
        .sm-btn.off-dim { opacity: .45; }
        .sm-btn-quiz.on { background: #e67e22; border-color: #e67e22; }
        .sm-btn-quiz.on:hover { background: #cf6d17; }

        .sm-views { display: flex; gap: 4px; margin-right: 6px; flex-wrap: wrap; }
        .sm-view-btn {
            padding: 5px 12px; border-radius: 8px; border: 1px solid #ddd;
            background: #f5f5f5; font-size: 11px; font-weight: 800; cursor: pointer;
            color: #666; transition: background .15s;
        }
        .sm-view-btn:hover { background: #e0e0e0; }
        .sm-view-btn.active { background: #f1e6ff; color: #5b3a8a; border-color: #cdb4ee; }

        /* Barre du jeu */
        .sm-quiz {
            display: none; align-items: center; gap: 8px; flex-wrap: wrap;
            padding: 8px 12px; border-radius: 10px;
            background: #fff4e6; border: 1.5px solid #f5c48a; color: #7a3f06;
            font-size: calc(var(--smfs) * 1.05); font-weight: 600;
        }
        .sm-quiz.show { display: flex; }
        .sm-quiz .sm-q-ask { flex: 1; min-width: 200px; }
        .sm-quiz .sm-q-ask b { color: #c2410c; font-size: 1.1em; }
        .sm-quiz .sm-q-fb { width: 100%; font-size: .9em; font-weight: 700; min-height: 1.2em; }
        .sm-quiz .sm-q-fb.ok { color: #15803d; }
        .sm-quiz .sm-q-fb.ko { color: #b91c1c; }
        .sm-quiz .sm-q-score { font-size: .9em; color: #9a5b14; white-space: nowrap; }
        .sm-q-btn {
            padding: 4px 10px; border-radius: 7px; border: 1px solid #f0b46f;
            background: #fff; color: #9a4b0a; font-size: 11px; font-weight: 700; cursor: pointer;
        }
        .sm-q-btn:hover { background: #ffe8cc; }

        /* Dessin + fiche */
        .sm-main { display: flex; flex-direction: column; gap: 10px; }
        .sm-stage {
            position: relative; width: 100%;
            border-radius: 12px; overflow: hidden;
            border: 1px solid #e5e7eb; background: #f6ecd2;
        }
        .sm-svg { display: block; width: 100%; height: auto; touch-action: manipulation; }
        .sm-svg.fade { animation: smFade .35s ease; }
        @keyframes smFade { from { opacity: 0; } to { opacity: 1; } }

        .sm-svg .sm-part { cursor: pointer; transition: filter .15s; }
        .sm-svg .sm-part:hover { filter: brightness(1.1); }
        .sm-svg .sm-part.sel { filter: drop-shadow(0 0 4px #ffd400) drop-shadow(0 0 3px #ffb000) brightness(1.1); }
        .sm-svg .sm-part.ok  { filter: drop-shadow(0 0 5px #22c55e) drop-shadow(0 0 4px #22c55e); }
        .sm-svg .sm-part.ko  { filter: drop-shadow(0 0 5px #ef4444) drop-shadow(0 0 4px #ef4444); }
        .sm-svg .sm-part.hint{ filter: drop-shadow(0 0 5px #3b82f6) drop-shadow(0 0 4px #3b82f6); }
        .sm-svg .sm-deco { pointer-events: none; }

        .sm-svg .sm-leaders { pointer-events: none; }
        .sm-svg .sm-leaders line { stroke: #1f2937; stroke-width: 1.6; }
        .sm-svg .sm-leaders circle { fill: #fff; stroke: #1f2937; stroke-width: 1.6; }
        .sm-svg .sm-lbl { cursor: pointer; }
        .sm-svg .sm-lbl rect { fill: #fff; stroke: #374151; stroke-width: 1.5; }
        .sm-svg .sm-lbl text { font: 700 15px "Segoe UI", system-ui, sans-serif; fill: #1f2937; pointer-events: none; }
        .sm-svg .sm-lbl:hover rect { fill: #f3f4f6; }
        .sm-svg .sm-lbl.q rect { fill: #fde68a; stroke: #b45309; }
        .sm-svg .sm-lbl.q text { fill: #92400e; }
        .sm-svg .sm-lbl.sel rect { fill: #fff7cc; stroke: #d97706; stroke-width: 2.5; }
        .sm-svg .sm-lbl.found rect { fill: #dcfce7; stroke: #16a34a; }

        .sm-detail {
            padding: 10px 14px;
            background: #fafafa;
            border: 1px solid #e5e7eb;
            border-left: 6px solid #8e6cc8;
            border-radius: 10px;
            color: #374151;
            line-height: 1.45;
            font-size: var(--smfs);
        }
        .sm-detail.hidden { display: none; }
        .sm-detail h4 { margin: 0 0 4px; font-weight: 900; font-size: 1.35em; color: #5b3a8a; }
        .sm-detail p { margin: 0 0 8px; }
        .sm-detail .sm-tag {
            display: inline-block; margin: 0 0 6px; padding: 2px 10px; border-radius: 20px;
            font-size: .85em; font-weight: 800; color: #fff;
        }
        .sm-detail .sm-fact {
            padding: 6px 10px; border-radius: 8px;
            background: #fff8e1; border: 1px dashed #e6c46a; color: #6b5310;
            margin-bottom: 6px;
        }
        .sm-detail .sm-hint { color: #6b7280; }
        .sm-go {
            margin-top: 4px;
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #7a4fb5; color: #fff; font-size: 12px; font-weight: 800; cursor: pointer;
        }
        .sm-go:hover { background: #643d99; }

        /* « Si le royaume ne comptait que 100 habitants » */
        .sm-hundred {
            margin-top: 4px; padding: 8px 10px; border-radius: 10px;
            background: #fff; border: 1px solid #eadfc8;
        }
        .sm-h-title { font-weight: 800; color: #6b4a1f; margin-bottom: 6px; }
        .sm-h-grid {
            display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; max-width: 560px;
        }
        .sm-h-cell {
            aspect-ratio: 1; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(var(--smfs) * .7); line-height: 1;
            animation: smPop .35s both;
        }
        @keyframes smPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .sm-h-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px; font-size: .92em; }
        .sm-h-legend i {
            display: inline-block; width: .9em; height: .9em; border-radius: 3px;
            vertical-align: -1px; margin-right: 4px;
        }
        .sm-h-note { margin-top: 6px; font-size: .9em; color: #6b7280; }

        .sm-container.wf-fullboard .sm-main { flex-direction: row; align-items: flex-start; }
        .sm-container.wf-fullboard .sm-stage { flex: 1; min-width: 0; }
        .sm-container.wf-fullboard .sm-svg { height: calc(100vh - 150px); }
        .sm-container.wf-fullboard .sm-detail { width: 360px; flex-shrink: 0; }
        @media (max-width: 900px) {
            .sm-container.wf-fullboard .sm-main { flex-direction: column; }
            .sm-container.wf-fullboard .sm-svg { height: auto; }
            .sm-container.wf-fullboard .sm-detail { width: auto; }
        }

        /* Aide */
        .sm-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5; color: #666;
            font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: background .15s;
        }
        .sm-help-btn:hover { background: #e0e0e0; color: #333; }
        .sm-help-popup {
            display: none; position: absolute; top: 36px; right: 10px;
            background: #fff; border: 1px solid #ddd; border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 330px;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .sm-help-popup.show { display: block; }
        .sm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .sm-help-popup p { margin: 0 0 6px; }
        .sm-help-popup p:last-child { margin-bottom: 0; }

        /* Resize handle */
        .sm-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .sm-container:hover .sm-resize-handle { opacity: 1; }
        .sm-container.wf-fullboard .sm-resize-handle { display: none; }
    
        /* Curseur : la flèche partout, la main sur la barre du haut (déplacement),
           le doigt sur tout ce qui est cliquable (y compris ce qu'il y a dedans) */
        .widget[data-type="histoire-societe-moyen-age"], .sm-container, .sm-container * { cursor: default !important; }
        .sm-container .sm-header, .sm-container .sm-header * { cursor: grab !important; }
        .sm-container .sm-header:active, .sm-container .sm-header:active * { cursor: grabbing !important; }
        .sm-container button, .sm-container button *, .sm-container .sm-header button,
        .sm-container .sm-header button *,
        .sm-container .sm-svg .sm-part, .sm-container .sm-svg .sm-part *,
        .sm-container .sm-svg .sm-lbl, .sm-container .sm-svg .sm-lbl * { cursor: pointer !important; }
        .sm-container button:disabled, .sm-container button:disabled * { cursor: default !important; }
        .sm-container input { cursor: text !important; }
        .sm-container .sm-resize-handle { cursor: se-resize !important; }

        /* ── Barre du haut : même style que les tables de multiplication ── */
        .sm-header {
            margin: -14px -16px 0; padding: 10px 14px 8px;
            background: #2A1F4A; flex-wrap: wrap; justify-content: flex-start; gap: 10px;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .sm-title {
            font-size: 22px; font-weight: 900; color: #FFC933; text-shadow: 0 2px 0 #B3470F;
            letter-spacing: .3px; white-space: nowrap; font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        }
        .sm-badge {
            background: rgba(255,255,255,.14); color: #fff; border-radius: 999px;
            padding: 3px 11px; font-size: 12px; font-weight: 800; letter-spacing: 0;
        }
        .sm-help-btn {
            width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0;
            background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: 900;
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            display: flex; align-items: center; justify-content: center;
        }
        .sm-help-btn:hover { background: rgba(255,255,255,.28); color: #fff; }
        .sm-help-popup { top: 56px; }
        .sm-container.wf-fullboard .sm-header { margin-left: -50px; padding-left: 64px; }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .sm-container.wf-fullboard .sm-header {
                margin-left: calc(-10px - env(safe-area-inset-left));
                padding-left: calc(14px + env(safe-area-inset-left));
            }
            .sm-title { font-size: 17px; }
        }
    `;
    document.head.appendChild(s);
})();

// ── Données ───────────────────────────────────────────────────────────────
// name : étiquette ; q : question du jeu « Qui suis-je ? » ;
// (lx, ly) centre de l'étiquette ; (ax, ay) point désigné ;
// tag : petit bandeau coloré dans la fiche ; go : bouton vers une autre vue.
const SM_VIEWS = {
    pyr:   { btn: '🔺 La pyramide',      badge: 'La pyramide de la société' },
    seig:  { btn: '🏘 La seigneurie',     badge: 'Une seigneurie' },
    liens: { btn: '⚖️ Qui doit quoi ?',  badge: 'Les liens entre les gens' }
};

const SM_DATA = {
    pyr: [
        { id: 'roi', name: 'Le roi', q: 'Qui est tout en haut et dirige le royaume ?',
          lx: 300, ly: 72, ax: 474, ay: 108, tag: ['👑 Au sommet', '#c79a12'], go: ['liens', '⚖️ Qui doit quoi à qui ?'],
          desc: "Il est au sommet de la société. Il dirige le royaume, fait la guerre et rend la justice. Mais au début du Moyen Âge, il est souvent moins puissant que certains grands seigneurs !",
          fact: "Le roi de France est sacré dans la cathédrale de Reims : un archevêque le bénit avec une huile sainte. On pense alors que son pouvoir vient de Dieu." },
        { id: 'clerge', name: 'Le clergé', q: 'Qui prie pour le salut de tout le monde ?',
          lx: 175, ly: 215, ax: 400, ay: 222, tag: ['🙏 Ceux qui prient · privilégiés', '#7a4fb5'],
          desc: "Ce sont les hommes et les femmes d'Église : évêques, prêtres (les curés des villages), moines et religieuses. Leur rôle est de prier pour tous. Ils enseignent aussi, soignent les malades et accueillent les pauvres et les voyageurs.",
          fact: "Les moines recopiaient les livres à la main, lettre par lettre ! On les appelle des moines copistes. Ce sont souvent les seuls à savoir lire et écrire." },
        { id: 'noblesse', name: 'La noblesse', q: 'Qui combat pour protéger les autres ?',
          lx: 825, ly: 215, ax: 600, ay: 222, tag: ['⚔️ Ceux qui combattent · privilégiés', '#c0392b'], go: ['seig', '🏘 Voir une seigneurie'],
          desc: "Ce sont les seigneurs et les chevaliers. Ils possèdent les terres et les châteaux. Leur rôle est de faire la guerre et de protéger les gens qui vivent sur leurs terres. En échange, les paysans doivent travailler pour eux et leur payer des taxes.",
          fact: "On est noble par sa naissance : le fils d'un seigneur sera seigneur à son tour. Un jeune noble commence à apprendre le métier des armes vers 7 ans." },
        { id: 'bourgeois', name: 'Les bourgeois', q: 'Qui habite dans les villes et fait du commerce ?',
          lx: 115, ly: 352, ax: 340, ay: 358, tag: ['🌾 Ceux qui travaillent · le peuple', '#2e8b57'],
          desc: "Ce sont les habitants des villes, qu'on appelait des « bourgs ». Beaucoup sont marchands : ils achètent et revendent des tissus, des épices, du vin… Certains deviennent très riches, parfois plus que des nobles !",
          fact: "À partir de l'an 1100 environ, les villes grandissent. Les bourgeois obtiennent du seigneur une « charte » : le droit de diriger eux-mêmes leur ville." },
        { id: 'artisans', name: 'Les artisans', q: 'Qui fabrique des objets avec ses mains ?',
          lx: 885, ly: 352, ax: 660, ay: 358, tag: ['🌾 Ceux qui travaillent · le peuple', '#2e8b57'],
          desc: "Forgerons, charpentiers, tisserands, cordonniers, boulangers… Ils fabriquent les objets dont tout le monde a besoin. En ville, leur atelier sert aussi de boutique.",
          fact: "Les artisans d'un même métier se regroupent en corporation. Un apprenti devient compagnon, puis maître s'il réussit son « chef-d'œuvre » : c'est l'origine de ce mot !" },
        { id: 'paysans', name: 'Les paysans', q: 'Qui travaille la terre pour nourrir tout le monde ?',
          lx: 90, ly: 492, ax: 250, ay: 495, tag: ['🌾 Ceux qui travaillent · le peuple', '#2e8b57'], go: ['liens', '⚖️ Que doivent-ils au seigneur ?'],
          desc: "Ce sont les plus nombreux : environ 9 personnes sur 10 ! Ils cultivent les champs, élèvent les animaux et nourrissent toute la population. Leur vie est très dure : ils travaillent du lever au coucher du soleil.",
          fact: "Les paysans libres (les « vilains ») peuvent quitter la seigneurie. Mais ils doivent quand même des corvées et des taxes au seigneur, et la dîme à l'Église." },
        { id: 'serfs', name: 'Les serfs', q: "Qui n'est pas libre et ne peut pas quitter la terre du seigneur ?",
          lx: 915, ly: 492, ax: 750, ay: 495, tag: ['🌾 Ceux qui travaillent · le peuple', '#2e8b57'],
          desc: "Ce sont des paysans qui ne sont pas libres. Ils sont attachés à la seigneurie : ils ne peuvent ni partir, ni se marier sans l'accord du seigneur. Ce ne sont pas des esclaves, mais ils dépendent entièrement de leur maître.",
          fact: "Peu à peu, beaucoup de serfs ont pu racheter leur liberté en payant le seigneur : on dit qu'ils ont été « affranchis »." }
    ],
    seig: [
        { id: 'chateau', name: 'Le château', q: 'Où habite le seigneur ?',
          lx: 335, ly: 62, ax: 258, ay: 100, go: ['liens', '⚖️ Qui doit quoi à qui ?'],
          desc: "C'est la demeure du seigneur et de sa famille. Construit en hauteur et bien fortifié, il domine toute la seigneurie. En cas d'attaque, les paysans viennent s'y réfugier.",
          fact: "Le seigneur rend la justice au château : il punit les voleurs et règle les disputes entre les paysans." },
        { id: 'foret', name: 'La forêt', q: 'Où seul le seigneur a-t-il le droit de chasser ?',
          lx: 430, ly: 150, ax: 430, ay: 222,
          desc: "Elle appartient au seigneur, qui y chasse le cerf et le sanglier avec ses chiens. Les paysans peuvent y ramasser du bois mort ou y mener leurs cochons manger des glands, mais ils n'ont pas le droit de chasser.",
          fact: "Un paysan pris en train de chasser le gibier du seigneur est un « braconnier » : il risquait de lourdes punitions !" },
        { id: 'ville', name: 'La ville', q: 'Où vivent les bourgeois et beaucoup d\'artisans ?',
          lx: 760, ly: 70, ax: 872, ay: 120,
          desc: "Entourée de remparts, la ville abrite des marchands et des artisans. On y trouve un marché, des ateliers et souvent une cathédrale. Les paysans viennent y vendre leurs produits.",
          fact: "Les rues étaient étroites, sales et sans trottoirs. Les cochons s'y promenaient librement et mangeaient les déchets !" },
        { id: 'monastere', name: 'Le monastère', q: 'Où vivent les moines ?',
          lx: 935, ly: 300, ax: 912, ay: 345,
          desc: "Les moines y vivent ensemble, sous l'autorité d'un abbé. Leur journée est partagée entre la prière, le travail (aux champs, à l'atelier) et l'étude. On l'appelle aussi une abbaye.",
          fact: "Les moines se réunissaient pour prier huit fois par jour, même au milieu de la nuit !" },
        { id: 'moulin', name: 'Le moulin', q: 'Où les paysans doivent-ils moudre leur grain en payant ?',
          lx: 70, ly: 432, ax: 108, ay: 400,
          desc: "C'est le moulin du seigneur : il transforme le grain en farine. Les paysans sont obligés de l'utiliser et doivent payer pour cela.",
          fact: "Le moulin, le four et le pressoir du seigneur s'appellent des « banalités ». Le mot « banal » vient de là : c'était le moulin que tout le monde devait utiliser !" },
        { id: 'village', name: 'Le village', q: 'Où vivent les familles de paysans ?',
          lx: 300, ly: 296, ax: 300, ay: 335,
          desc: "Les paysans vivent dans de petites maisons en bois et en torchis (de la terre mélangée à de la paille), avec un toit de chaume. Souvent, il n'y a qu'une seule pièce, que l'on partage l'hiver avec les animaux.",
          fact: "Les animaux dans la maison aidaient à la chauffer pendant l'hiver !" },
        { id: 'eglise', name: "L'église", q: 'Où le curé dit-il la messe ?',
          lx: 545, ly: 186, ax: 517, ay: 215,
          desc: "C'est le cœur de la vie du village. Le curé y célèbre la messe, les baptêmes et les mariages. Les cloches rythment la journée de travail et préviennent en cas de danger.",
          fact: "Les paysans doivent donner à l'Église environ un dixième de leurs récoltes : c'est la dîme." },
        { id: 'four', name: 'Le four', q: 'Où les paysans cuisent-ils leur pain en payant le seigneur ?',
          lx: 650, ly: 300, ax: 628, ay: 345,
          desc: "C'est le four du seigneur. Les paysans doivent y cuire leur pain et payer une taxe, souvent en laissant au seigneur une partie des pains.",
          fact: "C'est une autre « banalité », comme le moulin et le pressoir à raisin." },
        { id: 'peage', name: 'Le péage', q: 'Où faut-il payer pour traverser le pont ?',
          lx: 805, ly: 432, ax: 712, ay: 425,
          desc: "Pour traverser le pont du seigneur avec des marchandises, il faut payer une taxe : le péage. Sur leur route, les marchands en payaient beaucoup !",
          fact: "On parle encore de « péage » aujourd'hui sur les autoroutes." },
        { id: 'reserve', name: 'La réserve', q: 'Quels champs les paysans cultivent-ils gratuitement pour le seigneur ?',
          lx: 300, ly: 480, ax: 300, ay: 520,
          desc: "Ce sont les champs que le seigneur garde pour lui. Les paysans doivent venir les cultiver gratuitement plusieurs jours par an : ce sont les corvées. Toute la récolte revient au seigneur.",
          fact: "Les corvées servaient aussi à réparer les chemins, entretenir le château ou curer les fossés." },
        { id: 'tenures', name: 'Les tenures', q: 'Quels champs le seigneur confie-t-il aux familles de paysans ?',
          lx: 810, ly: 480, ax: 810, ay: 515,
          desc: "Ce sont les parcelles que le seigneur confie aux familles de paysans. Elles les cultivent pour se nourrir, mais doivent en échange donner au seigneur une partie de la récolte ou de l'argent : le cens.",
          fact: "On laissait un champ « au repos » une année sur trois pour que la terre reprenne des forces : c'est la jachère." }
    ],
    liens: [
        { id: 'roi', name: 'Le roi', q: 'Qui est le suzerain des grands seigneurs ?',
          lx: 90, ly: 95, ax: 170, ay: 95,
          desc: "Le roi est en haut de la chaîne : les grands seigneurs (ducs, comtes) sont ses vassaux. Il leur confie de grandes terres, et ils lui doivent fidélité.",
          fact: "Certains vassaux, comme le duc de Normandie, étaient plus riches et plus puissants que le roi de France lui-même !" },
        { id: 'seigneur', name: 'Le grand seigneur', q: "Qui est à la fois vassal du roi et suzerain d'un chevalier ?",
          lx: 90, ly: 295, ax: 170, ay: 295,
          desc: "Un duc ou un comte. Il est le vassal du roi, mais aussi le suzerain de seigneurs moins puissants à qui il confie une partie de ses terres. Chacun peut donc être à la fois vassal de quelqu'un et suzerain de quelqu'un d'autre.",
          fact: "Cette chaîne de liens entre seigneurs s'appelle la féodalité. Le mot vient de « fief »." },
        { id: 'chevalier', name: 'Le chevalier', q: 'Qui jure fidélité à son seigneur et combat pour lui ?',
          lx: 90, ly: 495, ax: 170, ay: 495, go: ['seig', '🏘 Voir une seigneurie'],
          desc: "C'est un petit seigneur, vassal d'un seigneur plus puissant. Il possède un fief avec un château et des paysans. Il doit aider son suzerain à la guerre.",
          fact: "Pour devenir chevalier, le jeune noble est d'abord page, puis écuyer. Vers 18 ans, il est « adoubé » : il reçoit ses armes lors d'une cérémonie." },
        { id: 'paysans', name: 'Les paysans', q: 'Qui doit des corvées et des taxes au seigneur ?',
          lx: 620, ly: 582, ax: 620, ay: 557,
          desc: "Ils vivent sur les terres du seigneur. Ils lui doivent des corvées et des taxes, et donnent la dîme à l'Église. En échange, le seigneur les protège et l'Église prie pour eux.",
          fact: "Ce sont eux qui nourrissent toute la société… mais ce sont aussi les plus pauvres !" },
        { id: 'clerge', name: 'Le clergé', q: 'Qui reçoit la dîme et prie pour tout le monde ?',
          lx: 850, ly: 336, ax: 850, ay: 312,
          desc: "Évêques, curés et moines prient pour tous. Ils vivent grâce à la dîme payée par les paysans et aux terres que les seigneurs leur donnent.",
          fact: "Les évêques et les abbés possédaient parfois d'immenses domaines : ils étaient aussi des seigneurs !" },
        { id: 'fief', name: 'Le fief', q: 'Comment appelle-t-on la terre donnée par le suzerain à son vassal ?',
          lx: 100, ly: 195, ax: 196, ay: 195, tag: ['Du suzerain → au vassal', '#b07d2b'],
          desc: "C'est la terre que le suzerain confie à son vassal pour qu'il en vive. Le vassal la garde tant qu'il reste fidèle. S'il trahit, le suzerain peut la lui reprendre.",
          fact: "À la mort du vassal, son fils peut hériter du fief s'il prête hommage à son tour." },
        { id: 'hommage', name: "L'hommage", q: "Comment s'appelle la cérémonie où le vassal jure fidélité ?",
          lx: 368, ly: 195, ax: 266, ay: 195, tag: ['Du vassal → au suzerain', '#2f5d9e'],
          desc: "Le vassal s'agenouille, met ses mains dans celles de son seigneur et jure de lui être fidèle. Il lui promet l'aide (combattre pour lui, environ 40 jours par an) et le conseil (le conseiller, l'aider à rendre la justice).",
          fact: "Le seigneur relève ensuite son vassal et lui remet un objet (une motte de terre, une branche…) qui représente le fief : c'est l'investiture." },
        { id: 'protection', name: 'La protection', q: 'Que donne le seigneur aux paysans en échange de leur travail ?',
          lx: 426, ly: 438, ax: 426, ay: 456, tag: ['Du seigneur → aux paysans', '#2e8b57'],
          desc: "Le seigneur protège les paysans contre les attaques et les pillards. En cas de danger, ils se réfugient derrière les murailles du château. Il rend aussi la justice.",
          fact: "Au Moyen Âge, les routes ne sont pas sûres : la protection d'un seigneur et de ses chevaliers est très précieuse." },
        { id: 'corvees', name: 'Corvées et taxes', q: 'Que doivent les paysans au seigneur ?',
          lx: 426, ly: 560, ax: 426, ay: 536, tag: ['Des paysans → au seigneur', '#c0392b'],
          desc: "Les paysans travaillent gratuitement pour le seigneur (les corvées) et lui paient des taxes : le cens pour leurs terres, la taille, et les banalités pour utiliser le moulin, le four ou le pressoir.",
          fact: "Aujourd'hui encore, on dit « quelle corvée ! » pour parler d'une tâche pénible." },
        { id: 'dime', name: 'La dîme', q: "Que donnent les paysans à l'Église ?",
          lx: 612, ly: 338, ax: 712, ay: 352, tag: ['Des paysans → au clergé', '#b8860b'],
          desc: "Les paysans donnent à l'Église environ un dixième de leurs récoltes. Cela sert à faire vivre le clergé, à entretenir les églises et à aider les pauvres.",
          fact: "« Dîme » vient du latin « decima », qui veut dire « dixième »." },
        { id: 'prieres', name: 'Prières et soins', q: 'Que fait le clergé pour tout le monde ?',
          lx: 905, ly: 420, ax: 758, ay: 394, tag: ['Du clergé → à tous', '#7a4fb5'],
          desc: "Le clergé prie pour le salut de tous, du roi au plus pauvre des paysans. Il accueille aussi les malades dans les hôtels-Dieu, nourrit les pauvres et instruit les enfants.",
          fact: "Au Moyen Âge, presque tout le monde croit en Dieu et a peur de l'enfer : les prières du clergé semblent donc indispensables." },
        { id: 'sacre', name: 'Le sacre', q: 'Quelle cérémonie montre que le roi est choisi par Dieu ?',
          lx: 541, ly: 132, ax: 541, ay: 151, tag: ['Du clergé → au roi', '#c79a12'],
          desc: "Le roi est couronné et béni par l'archevêque dans la cathédrale de Reims. Grâce au sacre, son pouvoir semble venir de Dieu : lui désobéir, c'est désobéir à Dieu !",
          fact: "Pendant des siècles, presque tous les rois de France ont été sacrés à Reims." }
    ]
};

// ── Utilitaires ───────────────────────────────────────────────────────────
function _smEsc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let _smCtx = null;
function _smTextW(txt, size, weight) {
    if (!_smCtx) _smCtx = document.createElement('canvas').getContext('2d');
    _smCtx.font = (weight || 400) + ' ' + size + 'px "Segoe UI", system-ui, sans-serif';
    return _smCtx.measureText(txt).width;
}

// Tap compatible souris, doigt et stylet (TBI) : on renvoie la cible du pointerdown.
function _smBindTap(el, fn) {
    const TOL = 20;
    let lastAt = 0;
    const fire = (t) => {
        const now = Date.now();
        if (now - lastAt < 450) return;
        lastAt = now;
        fn(t);
    };
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
    el.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button > 0) return;
        e.stopPropagation();
        const pid = e.pointerId, x0 = e.clientX, y0 = e.clientY, tgt = e.target;
        const cleanup = () => {
            window.removeEventListener('pointerup', onUp, true);
            window.removeEventListener('pointercancel', cleanup, true);
        };
        const onUp = (ev) => {
            if (ev.pointerId !== pid) return;
            cleanup();
            if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > TOL) return;
            fire(tgt);
        };
        window.addEventListener('pointerup', onUp, true);
        window.addEventListener('pointercancel', cleanup, true);
    });
    el.addEventListener('click', (e) => { e.stopPropagation(); fire(e.target); });
}

function _smShuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── Briques de dessin ─────────────────────────────────────────────────────
function _smMerlons(x1, x2, y, h, mw, gap, fill) {
    const n = Math.max(1, Math.floor((x2 - x1 + gap) / (mw + gap)));
    const used = n * mw + (n - 1) * gap, off = (x2 - x1 - used) / 2;
    let s = '';
    for (let i = 0; i < n; i++) {
        s += `<rect x="${(x1 + off + i * (mw + gap)).toFixed(1)}" y="${y}" width="${mw}" height="${h}" fill="${fill}" stroke="#8a7c63" stroke-width="1.2"/>`;
    }
    return s;
}

function _smCloud(cx, cy, k) {
    return `<g fill="#fff" opacity=".85"><ellipse cx="${cx}" cy="${cy}" rx="${40 * k}" ry="${13 * k}"/>`
        + `<ellipse cx="${cx - 12 * k}" cy="${cy - 9 * k}" rx="${18 * k}" ry="${13 * k}"/>`
        + `<ellipse cx="${cx + 12 * k}" cy="${cy - 11 * k}" rx="${20 * k}" ry="${15 * k}"/></g>`;
}

// Personnage : pieds en (x, y), hauteur ~60 × k.
// o.col (vêtement), o.robe (robe longue), o.cloak (manteau du roi), o.hood (capuche de moine),
// o.veil (foulard), coiffes : crown, mitre, helmet, hat, straw, feather, hennin ;
// objets : crozier, scepter, sword, shield, fork, hoe, hammer, axe, sickle, purse, book, basket, apron.
function _smPerson(x, y, k, o) {
    o = o || {};
    const col = o.col || '#777', skin = '#f1c9a0';
    let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
    // Objets tenus derrière
    if (o.crozier) s += `<line x1="15" y1="0" x2="15" y2="-64" stroke="#c9a227" stroke-width="2.5"/><path d="M15 -64 q0 -9 -7 -9 q-6 0 -6 6 q0 4 4 4" fill="none" stroke="#c9a227" stroke-width="2.5"/>`;
    if (o.fork) s += `<line x1="15" y1="0" x2="15" y2="-58" stroke="#7a5230" stroke-width="2.5"/><path d="M10 -58 H20 M10 -58 V-67 M15 -58 V-69 M20 -58 V-67" stroke="#8a8a8a" stroke-width="2" fill="none"/>`;
    if (o.hoe) s += `<line x1="15" y1="0" x2="15" y2="-56" stroke="#7a5230" stroke-width="2.5"/><path d="M15 -56 L4 -51 L5 -47 L15 -51 Z" fill="#8a8a8a"/>`;
    if (o.scepter) s += `<line x1="15" y1="-14" x2="15" y2="-56" stroke="#e0b52a" stroke-width="3"/><circle cx="15" cy="-58" r="4" fill="#e0b52a"/>`;
    if (o.cloak) s += `<path d="M-11 -36 H11 L17 0 H-17 Z" fill="${o.cloak}"/><rect x="-17" y="-4" width="34" height="4" fill="#fff"/><circle cx="-10" cy="-2" r="1" fill="#222"/><circle cx="0" cy="-2" r="1" fill="#222"/><circle cx="10" cy="-2" r="1" fill="#222"/>`;
    // Corps
    if (o.robe) {
        s += `<path d="M-9 -36 H9 L14 0 H-14 Z" fill="${col}"/>`;
    } else {
        const lg = o.legs || '#4a3b2c';
        s += `<rect x="-7" y="-14" width="5" height="14" fill="${lg}"/><rect x="2" y="-14" width="5" height="14" fill="${lg}"/>`;
        s += `<path d="M-9 -36 H9 L12 -12 H-12 Z" fill="${col}"/><rect x="-10.5" y="-22" width="21" height="3" fill="rgba(0,0,0,.28)"/>`;
    }
    if (o.apron) s += `<path d="M-6 -30 H6 L8 -12 H-8 Z" fill="#8b5a2b"/>`;
    if (o.hennin) s += `<path d="M-2 -50 L16 -78 L6 -48 Z" fill="#d24d8a"/><path d="M16 -78 q6 10 2 30" stroke="#f5d0e4" stroke-width="2" fill="none"/>`;
    // Bras + mains
    s += `<path d="M-8 -34 L-13 -19 M8 -34 L13 -19" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<circle cx="-13" cy="-17" r="2.6" fill="${skin}"/><circle cx="13" cy="-17" r="2.6" fill="${skin}"/>`;
    // Tête
    if (o.hood) s += `<circle cx="0" cy="-44" r="11" fill="${o.hood}"/>`;
    if (o.veil) s += `<path d="M-10 -42 A10 10 0 0 1 10 -42 L11 -33 L-11 -33 Z" fill="${o.veil}"/>`;
    s += `<circle cx="0" cy="-44" r="${o.hood ? 7 : 8}" fill="${skin}"/>`;
    if (!o.hood && !o.veil && !o.helmet) s += `<path d="M-8 -45 A8 8 0 0 1 8 -45 Z" fill="${o.hair || '#6b4423'}"/>`;
    s += `<circle cx="-3" cy="-43" r="1" fill="#333"/><circle cx="3" cy="-43" r="1" fill="#333"/>`
        + `<path d="M-3 -39.5 q3 2.2 6 0" stroke="#7a3b2a" stroke-width="1" fill="none"/>`;
    // Coiffes
    if (o.crown)   s += `<path d="M-8 -50 L-8 -59 L-4 -54 L0 -60 L4 -54 L8 -59 L8 -50 Z" fill="#e0b52a" stroke="#a07c10" stroke-width=".8"/><circle cx="0" cy="-53" r="1.4" fill="#c0392b"/>`;
    if (o.mitre)   s += `<path d="M-7 -50 L-7 -60 L0 -69 L7 -60 L7 -50 Z" fill="#fff" stroke="#c9a227" stroke-width="1.2"/><path d="M0 -66 V-52 M-4 -59 H4" stroke="#c9a227" stroke-width="1.5"/>`;
    if (o.helmet)  s += `<path d="M-9 -45 A9 9 0 0 1 9 -45 Z" fill="#9aa5ad" stroke="#6c757d"/><rect x="-1" y="-46" width="2" height="7" fill="#6c757d"/>`;
    if (o.hat)     s += `<ellipse cx="0" cy="-50" rx="11" ry="3" fill="${o.hat}"/><rect x="-7" y="-59" width="14" height="9" rx="2" fill="${o.hat}"/>`;
    if (o.straw)   s += `<ellipse cx="0" cy="-49" rx="13" ry="3.5" fill="#e8c86a" stroke="#b8963a" stroke-width=".8"/><path d="M-6 -49 Q0 -59 6 -49 Z" fill="#e8c86a" stroke="#b8963a" stroke-width=".8"/>`;
    if (o.feather) s += `<ellipse cx="0" cy="-51" rx="10" ry="4" fill="${o.feather}"/><path d="M5 -53 q9 -9 3 -17" stroke="#f4d03f" stroke-width="2.5" fill="none"/>`;
    // Objets tenus devant
    if (o.sword)  s += `<line x1="15" y1="-14" x2="15" y2="-52" stroke="#c0c6cc" stroke-width="3"/><line x1="10" y1="-20" x2="20" y2="-20" stroke="#8a6a2a" stroke-width="3"/>`;
    if (o.shield) s += `<path d="M-23 -36 h14 v10 q0 10 -7 14 q-7 -4 -7 -14 z" fill="${o.shield}" stroke="#c9a227" stroke-width="1.5"/><path d="M-16 -34 v18 M-21 -28 h10" stroke="#f4d03f" stroke-width="1.6"/>`;
    if (o.book)   s += `<rect x="-6" y="-27" width="12" height="9" rx="1" fill="#9b2c2c" stroke="#e0b52a" stroke-width="1"/><line x1="0" y1="-27" x2="0" y2="-18" stroke="#e0b52a" stroke-width=".8"/>`;
    if (o.purse)  s += `<line x1="13" y1="-17" x2="13" y2="-12" stroke="#5e3b1a" stroke-width="1.2"/><circle cx="13" cy="-8" r="5" fill="#a0522d" stroke="#e0b52a"/>`;
    if (o.hammer) s += `<line x1="15" y1="-14" x2="15" y2="-40" stroke="#7a5230" stroke-width="2.5"/><rect x="9" y="-46" width="13" height="6" rx="1" fill="#6c757d"/>`;
    if (o.axe)    s += `<line x1="15" y1="-12" x2="15" y2="-44" stroke="#7a5230" stroke-width="2.5"/><path d="M15 -44 q9 -2 10 8 q-6 -3 -10 0 Z" fill="#8e9aa3"/>`;
    if (o.sickle) s += `<path d="M13 -17 q2 -14 13 -14 q-8 4 -9 14" fill="none" stroke="#8a8a8a" stroke-width="2.2"/>`;
    if (o.basket) s += `<path d="M-22 -24 h13 l-2 11 h-9 z" fill="#c9a25a" stroke="#8a6a2a"/><circle cx="-18" cy="-25" r="2.5" fill="#d9534f"/><circle cx="-13" cy="-25" r="2.5" fill="#8cbf5a"/>`;
    s += '</g>';
    return s;
}

function _smDefs(u) {
    return `<defs>
        <linearGradient id="${u}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3f0"/><stop offset="1" stop-color="#e8f6fc"/></linearGradient>
        <linearGradient id="${u}-parch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3dc"/><stop offset="1" stop-color="#efdfb5"/></linearGradient>
        <linearGradient id="${u}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa0c4"/><stop offset="1" stop-color="#2f6f94"/></linearGradient>
        <linearGradient id="${u}-roof" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e2a1f"/><stop offset=".5" stop-color="#a8442f"/><stop offset="1" stop-color="#6e2a1f"/></linearGradient>
        <linearGradient id="${u}-wheat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset="1" stop-color="#d9ac45"/></linearGradient>
        <linearGradient id="${u}-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b6fd8"/><stop offset=".5" stop-color="#c0392b"/><stop offset="1" stop-color="#e6b422"/></linearGradient>
        <linearGradient id="${u}-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
        <radialGradient id="${u}-fire" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#d9480f"/></radialGradient>
        <pattern id="${u}-stone" width="30" height="14" patternUnits="userSpaceOnUse">
            <rect width="30" height="14" fill="#c9bca2"/>
            <path d="M0 0H30M0 7H30M15 0V7M0 7V14M30 7V14" stroke="#ad9f84" stroke-width="1" fill="none"/>
        </pattern>
    </defs>`;
}

function _smTree(x, y, s, c) {
    return `<rect x="${x - 3 * s}" y="${y - 14 * s}" width="${6 * s}" height="${14 * s}" fill="#6b4423"/>`
        + `<circle cx="${x}" cy="${y - 24 * s}" r="${14 * s}" fill="${c || '#3f7d3a'}"/>`
        + `<circle cx="${x - 8 * s}" cy="${y - 18 * s}" r="${9 * s}" fill="${c || '#3f7d3a'}"/>`
        + `<circle cx="${x + 8 * s}" cy="${y - 18 * s}" r="${9 * s}" fill="${c || '#3f7d3a'}"/>`;
}

function _smHouse(x, y, wall) {
    return `<rect x="${x}" y="${y - 34}" width="46" height="34" fill="${wall || '#ead9b0'}" stroke="#8a6a4a" stroke-width="1.2"/>`
        + `<path d="M${x} ${y - 20} H${x + 46} M${x + 12} ${y - 34} V${y} M${x + 34} ${y - 34} V${y}" stroke="#7a5230" stroke-width="1.5"/>`
        + `<path d="M${x - 6} ${y - 32} L${x + 23} ${y - 56} L${x + 52} ${y - 32} Z" fill="#c9a25a" stroke="#8a6a2a" stroke-width="1.2"/>`
        + `<path d="M${x + 8} ${y - 40} l8 -6 M${x + 26} ${y - 44} l8 6" stroke="#a8843e" stroke-width="1.2"/>`
        + `<rect x="${x + 17}" y="${y - 17}" width="12" height="17" fill="#6b4423"/>`
        + `<rect x="${x + 36}" y="${y - 30}" width="7" height="7" fill="#3a2a1c"/>`;
}

function _smArrow(x1, y1, x2, y2, col, o) {
    o = o || {};
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const bx = x2 - ux * 17, by = y2 - uy * 17, px = -uy, py = ux;
    let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="24"/>`;
    s += `<line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${col}" stroke-width="${o.w || 6}" stroke-linecap="round"${o.dash ? ' stroke-dasharray="10 8"' : ''}/>`;
    s += `<polygon points="${x2},${y2} ${(bx + px * 10).toFixed(1)},${(by + py * 10).toFixed(1)} ${(bx - px * 10).toFixed(1)},${(by - py * 10).toFixed(1)}" fill="${col}"/>`;
    if (o.icon) {
        const mx = o.mx != null ? o.mx : (x1 + x2) / 2, my = o.my != null ? o.my : (y1 + y2) / 2;
        s += `<circle cx="${mx}" cy="${my}" r="14" fill="#fff" stroke="${col}" stroke-width="3"/>`
            + `<text x="${mx}" y="${my + 5.5}" text-anchor="middle" font-size="15">${o.icon}</text>`;
    }
    return s;
}

function _smNode(cx, cy, ring, fill, inner) {
    return `<circle cx="${cx}" cy="${cy}" r="60" fill="${ring}" stroke="#6b4a1f" stroke-width="3"/>`
        + `<circle cx="${cx}" cy="${cy}" r="52" fill="${fill}"/>` + inner;
}

// ── Vue « La pyramide » ───────────────────────────────────────────────────
function _smPyrSVG(u) {
    const hw = (y) => (y - 40) * 0.7115;          // demi-largeur de la pyramide à la hauteur y
    const SH = `url(#${u}-shine)`;
    const half = (y1, y2, side, fill) => {        // moitié gauche (-1) ou droite (+1) d'un étage
        const a = hw(y1), b = hw(y2), g = 3;
        const pts = side < 0
            ? `${500 - a},${y1} ${500 - g},${y1} ${500 - g},${y2} ${500 - b},${y2}`
            : `${500 + g},${y1} ${500 + a},${y1} ${500 + b},${y2} ${500 + g},${y2}`;
        return `<polygon points="${pts}" fill="${fill}" stroke="#6b4a1f" stroke-width="2.5" stroke-linejoin="round"/>`
            + `<polygon points="${pts}" fill="${SH}"/>`;
    };
    const cap = (x, y, txt, col) => `<text class="sm-deco" x="${x}" y="${y}" text-anchor="middle" font-size="13" font-style="italic" font-weight="700" fill="${col}">${txt}</text>`;
    const sheaf = (x, y) => `<g><path d="M${x - 9} ${y} L${x} ${y - 30} L${x + 9} ${y} Z" fill="#e8c35a" stroke="#b8902e"/><path d="M${x - 11} ${y - 30} Q${x} ${y - 46} ${x + 11} ${y - 30}" fill="#f3d27a" stroke="#b8902e"/><rect x="${x - 9}" y="${y - 17}" width="18" height="4" fill="#8a6a2a"/></g>`;
    const pig = (x, y) => `<g><ellipse cx="${x}" cy="${y - 10}" rx="15" ry="9" fill="#f4a7b9"/><circle cx="${x + 14}" cy="${y - 13}" r="6" fill="#f4a7b9"/><ellipse cx="${x + 19}" cy="${y - 12}" rx="2.5" ry="2" fill="#e07a95"/><circle cx="${x + 15}" cy="${y - 15}" r="1" fill="#333"/><path d="M${x - 15} ${y - 12} q-5 -3 -2 -6" stroke="#e07a95" stroke-width="1.5" fill="none"/><rect x="${x - 9}" y="${y - 3}" width="3" height="4" fill="#e07a95"/><rect x="${x + 6}" y="${y - 3}" width="3" height="4" fill="#e07a95"/></g>`;
    const stall = (x, y) => `<g><rect x="${x}" y="${y - 22}" width="52" height="22" fill="#a8743f" stroke="#6b4423"/>`
        + `<path d="M${x - 4} ${y - 40} H${x + 56} L${x + 52} ${y - 30} H${x} Z" fill="#c0392b"/><path d="M${x + 6} ${y - 40} l-2 10 M${x + 20} ${y - 40} l-1 10 M${x + 34} ${y - 40} l1 10 M${x + 48} ${y - 40} l2 10" stroke="#fff" stroke-width="5"/>`
        + `<line x1="${x + 2}" y1="${y - 30}" x2="${x + 2}" y2="${y - 22}" stroke="#6b4423" stroke-width="2"/><line x1="${x + 50}" y1="${y - 30}" x2="${x + 50}" y2="${y - 22}" stroke="#6b4423" stroke-width="2"/>`
        + `<circle cx="${x + 12}" cy="${y - 25}" r="4" fill="#e67e22"/><circle cx="${x + 22}" cy="${y - 25}" r="4" fill="#8cbf5a"/><rect x="${x + 30}" y="${y - 29}" width="16" height="7" fill="#6d4c9a"/></g>`;
    const anvil = (x, y) => `<path d="M${x - 14} ${y - 18} H${x + 14} L${x + 6} ${y - 11} V${y - 4} H${x + 10} V${y} H${x - 10} V${y - 4} H${x - 6} V${y - 11} Z" fill="#555"/>`;
    const logs = (x, y) => `<g><rect x="${x - 18}" y="${y - 10}" width="36" height="10" rx="5" fill="#a0703f" stroke="#6b4423"/><rect x="${x - 12}" y="${y - 20}" width="28" height="10" rx="5" fill="#a0703f" stroke="#6b4423"/><circle cx="${x + 18}" cy="${y - 5}" r="4" fill="#d9b382"/></g>`;
    let stars = '';
    [[60, 60], [930, 50], [880, 120], [110, 140], [950, 250], [40, 300]].forEach(([x, y]) => {
        stars += `<path d="M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z" fill="#e6c46a" opacity=".7"/>`;
    });

    return `${_smDefs(u)}
    <rect width="1000" height="600" fill="url(#${u}-parch)"/>
    ${stars}
    <ellipse cx="500" cy="575" rx="420" ry="16" fill="#000" opacity=".08"/>
    <g class="sm-parts">
        <g class="sm-part" data-id="roi">
            <polygon points="500,40 ${500 + hw(148)},148 ${500 - hw(148)},148" fill="#f4c542" stroke="#6b4a1f" stroke-width="2.5" stroke-linejoin="round"/>
            <polygon points="500,40 ${500 + hw(148)},148 ${500 - hw(148)},148" fill="${SH}"/>
            ${_smPerson(500, 142, 1.02, { col: '#2f5d9e', cloak: '#b03a3a', robe: true, crown: true, scepter: true })}
        </g>
        <g class="sm-part" data-id="clerge">
            ${half(153, 290, -1, '#b9a2e3')}
            ${_smPerson(425, 262, 1.15, { col: '#7a4fb5', robe: true, mitre: true, crozier: true })}
            ${_smPerson(470, 262, 1.1, { col: '#7a5230', robe: true, hood: '#5e3b1a', book: true })}
            ${cap(415, 283, 'ceux qui prient', '#4d2f7a')}
        </g>
        <g class="sm-part" data-id="noblesse">
            ${half(153, 290, 1, '#ef9a93')}
            ${_smPerson(530, 262, 1.15, { col: '#7b2d8e', legs: '#3a2a4a', feather: '#2f5d9e', sword: true })}
            ${_smPerson(585, 262, 1.15, { col: '#8e9aa3', legs: '#555', helmet: true, shield: '#c0392b', sword: true })}
            ${cap(585, 283, 'ceux qui combattent', '#7a1f17')}
        </g>
        <g class="sm-part" data-id="bourgeois">
            ${half(295, 420, -1, '#9fd6cd')}
            ${_smPerson(330, 405, 1.1, { col: '#3d6b9e', robe: true, veil: '#f2efe6' })}
            ${_smPerson(385, 405, 1.1, { col: '#1f7a6d', hat: '#2f4858', purse: true })}
            ${stall(420, 405)}
        </g>
        <g class="sm-part" data-id="artisans">
            ${half(295, 420, 1, '#f3c58b')}
            ${_smPerson(545, 405, 1.1, { col: '#6d6d6d', apron: true, hammer: true })}
            ${anvil(585, 405)}
            ${_smPerson(635, 405, 1.1, { col: '#3f6e8c', axe: true })}
            ${logs(685, 405)}
        </g>
        <g class="sm-part" data-id="paysans">
            ${half(425, 560, -1, '#b5dd8a')}
            ${_smPerson(300, 540, 1.1, { col: '#8a6a3a', straw: true, fork: true })}
            ${_smPerson(360, 540, 1.1, { col: '#a0522d', robe: true, veil: '#e9e2cf', sickle: true })}
            ${sheaf(420, 540)}
            ${sheaf(450, 540)}
        </g>
        <g class="sm-part" data-id="serfs">
            ${half(425, 560, 1, '#d6c999')}
            ${_smPerson(570, 540, 1.1, { col: '#7d7358', legs: '#5a5040', hoe: true })}
            ${_smPerson(630, 540, 1.1, { col: '#6e6250', robe: true, veil: '#cfc6ae', basket: true })}
            ${pig(700, 540)}
        </g>
    </g>
    <g class="sm-deco"><rect x="430" y="541" width="140" height="19" rx="9" fill="#fbf3dc" stroke="#6b4a1f" stroke-width="1.2"/></g>
    ${cap(500, 555, 'ceux qui travaillent', '#2f5a1a')}
    <g class="sm-deco">
        <text x="500" y="590" text-anchor="middle" font-size="12" font-weight="700" fill="#8a6a3a" opacity=".85">▲ plus on monte, plus on a de pouvoir et de richesses… mais moins on est nombreux !</text>
    </g>
    <g class="sm-labels"></g>`;
}

// ── Vue « La seigneurie » ─────────────────────────────────────────────────
function _smSeigSVG(u) {
    const S = `url(#${u}-stone)`, ROOF = `url(#${u}-roof)`, FIRE = `url(#${u}-fire)`, WATER = `url(#${u}-water)`;
    let forest = '';
    [[352, 258, .9], [380, 250, 1.1], [410, 262, .95], [440, 248, 1.2], [470, 258, .9], [545, 252, 1.05], [575, 262, .9], [605, 250, 1.15], [640, 258, 1], [672, 250, 1.05], [700, 262, .9]].forEach(([x, y, k], i) => {
        forest += _smTree(x, y, k, i % 3 === 0 ? '#2f6b2c' : (i % 3 === 1 ? '#3f7d3a' : '#4f8f3a'));
    });
    const deer = `<g><ellipse cx="660" cy="270" rx="13" ry="6" fill="#a0703f"/><rect x="650" y="272" width="2" height="10" fill="#8a5a2b"/><rect x="668" y="272" width="2" height="10" fill="#8a5a2b"/>`
        + `<path d="M670 266 l8 -9 l3 2 l-6 9 z" fill="#a0703f"/><path d="M679 257 l-2 -8 M679 257 l5 -6 M677 252 l-4 -3" stroke="#6b4423" stroke-width="1.5"/></g>`;
    let waves = '';
    for (let x = 20; x < 1000; x += 60) waves += `<path d="M${x} ${420 + (x % 3) * 7} q8 -4 16 0 t16 0" stroke="#d6eef8" stroke-width="2" fill="none" opacity=".7"/>`;
    let wheatLines = '';
    for (let y = 470; y < 595; y += 14) wheatLines += `<path d="M24 ${y} H${592 - (y - 455) * 0.07}" stroke="#c8962f" stroke-width="1.2" opacity=".6"/>`;
    const stripCols = ['#7fb069', '#d9ac45', '#8b6b4a', '#a8cf72', '#e2c46b'];
    let strips = '';
    stripCols.forEach((c, i) => {
        const x = 635 + i * 70;
        strips += `<polygon points="${x},455 ${x + 70},455 ${x + 55},595 ${x - 15},595" fill="${c}" stroke="#6b4a2b" stroke-width="1"/>`;
        if (c === '#8b6b4a') for (let k = 1; k < 5; k++) strips += `<line x1="${x + k * 14}" y1="456" x2="${x - 15 + k * 14}" y2="594" stroke="#6b4a2b" stroke-width="1"/>`;
    });
    const ox = `<g><ellipse cx="770" cy="545" rx="24" ry="12" fill="#8a5a2b"/><circle cx="748" cy="538" r="8" fill="#8a5a2b"/><path d="M742 531 l-6 -6 M752 531 l4 -7" stroke="#e8dcc0" stroke-width="2"/>`
        + `<rect x="754" y="552" width="4" height="13" fill="#6b4423"/><rect x="782" y="552" width="4" height="13" fill="#6b4423"/><path d="M793 545 L830 560 L838 570" stroke="#5e3b1a" stroke-width="3" fill="none"/><path d="M832 568 l10 6" stroke="#8e9aa3" stroke-width="4"/></g>`;
    let sails = '';
    [0, 90, 180, 270].forEach(a => {
        sails += `<g transform="rotate(${a} 120 300)"><rect x="117" y="242" width="6" height="58" fill="#6b4423"/><rect x="123" y="246" width="14" height="48" fill="#f3ead6" stroke="#6b4423" stroke-width="1"/><path d="M123 258 H137 M123 270 H137 M123 282 H137" stroke="#6b4423" stroke-width=".8"/></g>`;
    });

    return `${_smDefs(u)}
    <rect width="1000" height="600" fill="url(#${u}-sky)"/>
    <circle cx="640" cy="70" r="26" fill="#ffd76a"/>
    ${_smCloud(470, 70, .9)}${_smCloud(620, 120, .7)}
    <path d="M0 250 Q160 200 340 235 T700 222 T1000 232 V420 H0 Z" fill="#a9cf8a"/>
    <rect y="262" width="1000" height="150" fill="#9cc77f"/>
    <path d="M20 255 Q55 172 180 160 Q300 172 345 255 Z" fill="#8db86a"/>
    <path d="M150 404 Q400 414 610 410" stroke="#d9c49a" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect y="410" width="1000" height="35" fill="${WATER}"/>
    ${waves}
    <rect y="445" width="1000" height="155" fill="#8fbf6a"/>
    <path d="M660 445 Q640 520 615 600" stroke="#d9c49a" stroke-width="12" fill="none"/>
    <g class="sm-parts">
        <g class="sm-part" data-id="foret">${forest}${deer}</g>
        <g class="sm-part" data-id="chateau">
            <rect x="92" y="85" width="34" height="75" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M86 87 L109 55 L132 87 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <rect x="234" y="85" width="34" height="75" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M228 87 L251 55 L274 87 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <rect x="126" y="110" width="108" height="50" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            ${_smMerlons(126, 234, 100, 10, 10, 7, S)}
            <rect x="155" y="56" width="50" height="58" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            ${_smMerlons(152, 208, 46, 10, 9, 6, S)}
            <line x1="180" y1="46" x2="180" y2="20" stroke="#555" stroke-width="2"/>
            <path d="M180 21 L206 28 L180 35 Z" fill="#c0392b"/>
            <rect x="175" y="72" width="10" height="16" rx="5" fill="#3a2f25"/>
            <rect x="105" y="105" width="7" height="14" rx="3" fill="#3a2f25"/><rect x="247" y="105" width="7" height="14" rx="3" fill="#3a2f25"/>
            <path d="M168 160 V143 A12 12 0 0 1 192 143 V160 Z" fill="#3a2a1c"/>
        </g>
        <g class="sm-part" data-id="ville">
            <path d="M828 186 L845 160 L862 186 Z" fill="${ROOF}"/><path d="M918 186 L935 162 L952 186 Z" fill="${ROOF}"/>
            <rect x="872" y="128" width="36" height="58" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <path d="M870 130 L881 96 L892 130 Z" fill="#7a8a99" stroke="#555" stroke-width="1"/>
            <path d="M888 130 L899 96 L910 130 Z" fill="#7a8a99" stroke="#555" stroke-width="1"/>
            <circle cx="890" cy="150" r="7" fill="url(#${u}-glass)" stroke="#555"/>
            <rect x="800" y="186" width="175" height="49" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            ${_smMerlons(800, 975, 177, 9, 9, 7, S)}
            <rect x="793" y="168" width="22" height="67" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M789 170 L804 148 L819 170 Z" fill="${ROOF}" stroke="#5a2118"/>
            <rect x="960" y="168" width="22" height="67" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M956 170 L971 148 L986 170 Z" fill="${ROOF}" stroke="#5a2118"/>
            <path d="M878 235 V220 A10 10 0 0 1 898 220 V235 Z" fill="#3a2a1c"/>
        </g>
        <g class="sm-part" data-id="monastere">
            <rect x="735" y="315" width="110" height="90" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <path d="M728 317 L790 282 L852 317 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <rect x="771" y="262" width="34" height="55" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <rect x="782" y="272" width="12" height="16" rx="6" fill="#2b231b"/>
            <path d="M766 264 L788 236 L810 264 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <path d="M788 236 V220 M782 226 H794" stroke="#c9a227" stroke-width="2.5"/>
            <circle cx="790" cy="345" r="10" fill="url(#${u}-glass)" stroke="#555" stroke-width="1.2"/>
            <path d="M778 405 V386 A12 12 0 0 1 802 386 V405 Z" fill="#5e3b1a"/>
            <rect x="845" y="347" width="70" height="58" fill="#e9dfc8" stroke="#9a8b70" stroke-width="1.5"/>
            <path d="M840 349 L880 327 L920 349 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <path d="M852 405 V384 a6 6 0 0 1 12 0 V405 M870 405 V384 a6 6 0 0 1 12 0 V405 M888 405 V384 a6 6 0 0 1 12 0 V405" fill="#5a4a3a"/>
            ${_smPerson(905, 405, .55, { col: '#7a5230', robe: true, hood: '#5e3b1a', book: true })}
        </g>
        <g class="sm-part" data-id="moulin">
            <ellipse cx="120" cy="402" rx="48" ry="7" fill="#86b06a"/>
            <path d="M100 400 L106 310 H134 L140 400 Z" fill="#e8dcc0" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M100 313 L120 290 L140 313 Z" fill="${ROOF}" stroke="#5a2118"/>
            <rect x="113" y="383" width="14" height="17" rx="6" fill="#6b4423"/>
            <rect x="115" y="335" width="10" height="10" fill="#3a2a1c"/>
            <g>${sails}<animateTransform attributeName="transform" type="rotate" from="0 120 300" to="360 120 300" dur="14s" repeatCount="indefinite"/></g>
            <circle cx="120" cy="300" r="5" fill="#5e3b1a"/>
        </g>
        <g class="sm-part" data-id="village">
            ${_smHouse(232, 375, '#e2cfa3')}${_smHouse(300, 372)}${_smHouse(368, 375, '#e2cfa3')}
            ${_smHouse(198, 405)}${_smHouse(266, 407, '#efe0bb')}${_smHouse(334, 405)}${_smHouse(402, 407, '#efe0bb')}
            ${_smPerson(258, 408, .5, { col: '#8a6a3a', straw: true, fork: true })}
            ${_smPerson(392, 408, .5, { col: '#a0522d', robe: true, veil: '#e9e2cf', basket: true })}
            <g><ellipse cx="455" cy="402" rx="6" ry="4.5" fill="#fff"/><circle cx="460" cy="398" r="2.8" fill="#fff"/><path d="M462 398 l3 1 -3 1z" fill="#e67e22"/><path d="M459 395 l1 -2 1 2" fill="#c0392b"/></g>
        </g>
        <g class="sm-part" data-id="eglise">
            <rect x="470" y="335" width="90" height="70" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <path d="M464 337 L515 307 L566 337 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <rect x="500" y="270" width="30" height="68" fill="#e3d7bf" stroke="#9a8b70" stroke-width="1.5"/>
            <rect x="509" y="282" width="12" height="15" rx="6" fill="#2b231b"/>
            <path d="M511 295 q4 -9 8 0 z" fill="#e0b52a"/>
            <path d="M496 272 L515 224 L534 272 Z" fill="#7a8a99" stroke="#555" stroke-width="1.2"/>
            <path d="M515 224 V205 M509 211 H521" stroke="#c9a227" stroke-width="2.5"/>
            <circle cx="515" cy="356" r="8" fill="url(#${u}-glass)" stroke="#555"/>
            <path d="M505 405 V385 A10 10 0 0 1 525 385 V405 Z" fill="#5e3b1a"/>
        </g>
        <g class="sm-part" data-id="four">
            <g fill="#9a9a9a" opacity=".5"><circle cx="645" cy="322" r="6"/><circle cx="651" cy="310" r="8"/><circle cx="645" cy="295" r="9"/></g>
            <rect x="640" y="330" width="10" height="25" fill="#8a7c63"/>
            <rect x="585" y="365" width="75" height="40" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M579 367 L622 345 L666 367 Z" fill="${ROOF}" stroke="#5a2118" stroke-width="1.2"/>
            <path d="M600 405 V392 Q614 376 628 392 V405 Z" fill="#2a1d14"/>
            <path d="M606 405 q3 -10 6 -6 q2 -7 5 -2 q2 5 1 8 z" fill="${FIRE}"/>
            <ellipse cx="645" cy="398" rx="8" ry="5" fill="#d9a35a" stroke="#8a5a2b"/>
        </g>
        <g class="sm-part" data-id="peage">
            <rect x="606" y="418" width="102" height="27" fill="${S}" stroke="#8a7c63" stroke-width="1.5"/>
            <path d="M620 445 V436 A12 12 0 0 1 644 436 V445 Z" fill="${WATER}"/>
            <path d="M668 445 V436 A12 12 0 0 1 692 436 V445 Z" fill="${WATER}"/>
            <path d="M600 408 H714 L708 420 H606 Z" fill="#b5a78e" stroke="#8a7c63" stroke-width="1.5"/>
            <line x1="712" y1="378" x2="712" y2="410" stroke="#5e3b1a" stroke-width="4"/>
            <line x1="712" y1="390" x2="664" y2="390" stroke="#c0392b" stroke-width="5"/>
            <line x1="712" y1="390" x2="664" y2="390" stroke="#fff" stroke-width="5" stroke-dasharray="8 8"/>
            ${_smPerson(728, 410, .55, { col: '#3f6e8c', helmet: true, purse: true })}
        </g>
        <g class="sm-part" data-id="reserve">
            <polygon points="20,455 600,455 592,595 20,595" fill="url(#${u}-wheat)" stroke="#a8843e" stroke-width="1.5"/>
            ${wheatLines}
            ${_smPerson(140, 585, .75, { col: '#8a6a3a', straw: true, sickle: true })}
            ${_smPerson(220, 590, .75, { col: '#a0522d', robe: true, veil: '#e9e2cf', sickle: true })}
            ${_smPerson(400, 588, .75, { col: '#7d7358', straw: true, fork: true })}
            <g transform="translate(460 590) scale(.75)"><path d="M-9 0 L0 -30 L9 0 Z" fill="#e8c35a" stroke="#b8902e"/><path d="M-11 -30 Q0 -46 11 -30" fill="#f3d27a" stroke="#b8902e"/><rect x="-9" y="-17" width="18" height="4" fill="#8a6a2a"/></g>
            ${_smPerson(545, 588, .75, { col: '#b03a3a', legs: '#4a2a2a', helmet: true })}
        </g>
        <g class="sm-part" data-id="tenures">
            ${strips}
            ${ox}
            ${_smPerson(870, 585, .75, { col: '#8a6a3a', straw: true })}
            ${_smPerson(700, 585, .7, { col: '#6e6250', robe: true, veil: '#cfc6ae', basket: true })}
        </g>
    </g>
    <g class="sm-labels"></g>`;
}

// ── Vue « Qui doit quoi à qui ? » ─────────────────────────────────────────
function _smLiensSVG(u) {
    const P = (x, y, k, o) => _smPerson(x, y, k, o);
    return `${_smDefs(u)}
    <rect width="1000" height="600" fill="url(#${u}-parch)"/>
    <rect x="8" y="8" width="984" height="584" rx="14" fill="none" stroke="#c9a96a" stroke-width="3" stroke-dasharray="2 6"/>
    <g class="sm-deco">
        <text x="640" y="48" text-anchor="middle" font-size="26" font-weight="900" fill="#6b4a1f">⚖️ Qui doit quoi à qui ?</text>
        <text x="640" y="74" text-anchor="middle" font-size="14" font-weight="600" fill="#8a6a3a">Clique sur un personnage ou sur une flèche</text>
        <text x="300" y="330" font-size="12" font-weight="700" font-style="italic" fill="#8a6a3a">vassal du roi</text>
        <text x="300" y="346" font-size="12" font-weight="700" font-style="italic" fill="#8a6a3a">et suzerain du chevalier</text>
    </g>
    <g class="sm-parts">
        <g class="sm-part" data-id="roi">${_smNode(230, 95, '#f4c542', '#fff3c4', P(230, 135, 1.1, { col: '#2f5d9e', cloak: '#b03a3a', robe: true, crown: true, scepter: true }))}</g>
        <g class="sm-part" data-id="seigneur">${_smNode(230, 295, '#ef9a93', '#fde3e0', P(230, 336, 1.1, { col: '#7b2d8e', legs: '#3a2a4a', feather: '#2f5d9e', sword: true }))}</g>
        <g class="sm-part" data-id="chevalier">${_smNode(230, 495, '#ef9a93', '#fde3e0', P(230, 536, 1.1, { col: '#8e9aa3', legs: '#555', helmet: true, shield: '#2f5d9e', sword: true }))}</g>
        <g class="sm-part" data-id="paysans">${_smNode(620, 495, '#b5dd8a', '#eef8e1', P(603, 535, 1, { col: '#8a6a3a', straw: true, fork: true }) + P(640, 535, 1, { col: '#a0522d', robe: true, veil: '#e9e2cf', sickle: true }))}</g>
        <g class="sm-part" data-id="clerge">${_smNode(850, 250, '#b9a2e3', '#f1e9fb', P(832, 290, 1, { col: '#7a4fb5', robe: true, mitre: true, crozier: true }) + P(870, 290, 1, { col: '#7a5230', robe: true, hood: '#5e3b1a', book: true }))}</g>

        <g class="sm-part" data-id="fief">
            ${_smArrow(210, 158, 210, 236, '#b07d2b', { icon: '🏞' })}
            ${_smArrow(210, 358, 210, 436, '#b07d2b', { icon: '🏞' })}
        </g>
        <g class="sm-part" data-id="hommage">
            ${_smArrow(252, 238, 252, 156, '#2f5d9e', { icon: '🤝' })}
            ${_smArrow(252, 438, 252, 356, '#2f5d9e', { icon: '🤝' })}
        </g>
        <g class="sm-part" data-id="protection">${_smArrow(298, 470, 556, 470, '#2e8b57', { icon: '🛡' })}</g>
        <g class="sm-part" data-id="corvees">${_smArrow(556, 522, 298, 522, '#c0392b', { icon: '💰' })}</g>
        <g class="sm-part" data-id="dime">${_smArrow(653, 436, 793, 287, '#b8860b', { icon: '🌾' })}</g>
        <g class="sm-part" data-id="prieres">
            ${_smArrow(817, 309, 677, 458, '#7a4fb5', { icon: '🙏' })}
            ${_smArrow(788, 268, 296, 300, '#7a4fb5', { dash: true, w: 4 })}
        </g>
        <g class="sm-part" data-id="sacre">${_smArrow(792, 226, 292, 104, '#c79a12', { icon: '👑', dash: true, w: 4 })}</g>
    </g>
    <g class="sm-labels"></g>`;
}

const SM_SVG = { pyr: _smPyrSVG, seig: _smSeigSVG, liens: _smLiensSVG };

// « Si le royaume ne comptait que 100 habitants »
function _smHundredHTML() {
    const groups = [
        { n: 2,  bg: '#d8c8f3', ico: '🙏', txt: 'clergé' },
        { n: 2,  bg: '#f7c6c1', ico: '⚔️', txt: 'noblesse' },
        { n: 6,  bg: '#fde2b8', ico: '🔨', txt: 'bourgeois et artisans (en ville)' },
        { n: 90, bg: '#d4ecb8', ico: '🌾', txt: 'paysans et serfs' }
    ];
    let cells = '', k = 0;
    groups.forEach(g => {
        for (let i = 0; i < g.n; i++, k++) {
            cells += `<div class="sm-h-cell" style="background:${g.bg};animation-delay:${(k * 9)}ms">${g.ico}</div>`;
        }
    });
    const legend = groups.map(g => `<span><i style="background:${g.bg}"></i><b>${g.n}</b> ${g.txt}</span>`).join('');
    return `<div class="sm-hundred">
        <div class="sm-h-title">👥 Si le royaume ne comptait que 100 habitants…</div>
        <div class="sm-h-grid">${cells}</div>
        <div class="sm-h-legend">${legend}</div>
        <div class="sm-h-note">Les privilégiés (clergé et noblesse) sont très peu nombreux, mais ils possèdent la plupart des terres. Les chiffres sont approximatifs.</div>
    </div>`;
}

// ── Création du widget ────────────────────────────────────────────────────
function createHistoireSocieteMoyenAgeWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();
    const pos = findFreePosition();
    const save = () => { if (typeof saveBoard === 'function') saveBoard(); };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'histoire-societe-moyen-age';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
    container.className = 'sm-container';
    const initW = Math.max(480, Math.min(1000, Math.round(window.innerWidth * 0.6)));
    container.style.width = initW + 'px';

    // En-tête
    const header = document.createElement('div');
    header.className = 'sm-header';
    header.innerHTML = `
        <span class="sm-title">👑 La société au Moyen Âge</span>
        <span class="sm-badge"></span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.sm-badge');
    container.appendChild(header);

    // Contrôles
    const controls = document.createElement('div');
    controls.className = 'sm-controls';
    controls.innerHTML = `
        <div class="sm-views">
            ${Object.keys(SM_VIEWS).map(v => `<button class="sm-view-btn" data-view="${v}">${SM_VIEWS[v].btn}</button>`).join('')}
        </div>
        <button class="sm-btn sm-btn-names on" title="Afficher / cacher les noms">🏷 Noms</button>
        <button class="sm-btn sm-btn-guess" title="Les noms sont remplacés par « ? » : clique pour les dévoiler">🙈 Devinette</button>
        <button class="sm-btn sm-btn-quiz" title="Jeu : réponds à la question en cliquant sur le dessin">🎯 Jeu : qui suis-je ?</button>
    `;
    const namesBtn = controls.querySelector('.sm-btn-names');
    const guessBtn = controls.querySelector('.sm-btn-guess');
    const quizBtn  = controls.querySelector('.sm-btn-quiz');
    container.appendChild(controls);

    // Barre du jeu
    const quizBar = document.createElement('div');
    quizBar.className = 'sm-quiz';
    container.appendChild(quizBar);

    // Dessin + fiche
    const main = document.createElement('div');
    main.className = 'sm-main';
    const stage = document.createElement('div');
    stage.className = 'sm-stage';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.setAttribute('class', 'sm-svg');
    stage.appendChild(svg);
    const detail = document.createElement('div');
    detail.className = 'sm-detail';
    main.appendChild(stage);
    main.appendChild(detail);
    container.appendChild(main);

    // Aide
    const helpBtn = document.createElement('button');
    helpBtn.className = 'sm-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'sm-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 La société au Moyen Âge</h4>
        <p>🔺 <b>La pyramide</b> : qui est en haut, qui est en bas ? Le roi, puis le clergé et la noblesse
        (les privilégiés), puis le peuple. Sous le dessin, une grille montre combien ils étaient.</p>
        <p>🏘 <b>La seigneurie</b> : le domaine d'un seigneur, avec son château, ses villages, ses champs…</p>
        <p>⚖️ <b>Qui doit quoi ?</b> : les liens entre les gens (fief, hommage, corvées, dîme…).
        Clique aussi sur les flèches !</p>
        <p>👆 Clique sur un élément (ou son étiquette) : il s'illumine et sa fiche apparaît.</p>
        <p>🙈 <b>Devinette</b> : les noms sont remplacés par « ? ». Fais deviner les élèves, puis clique pour dévoiler.</p>
        <p>🎯 <b>Qui suis-je ?</b> : une question s'affiche, l'élève clique sur la bonne réponse.
        Le score compte les bonnes réponses du premier coup.</p>
        <p style="color:#888">Redimensionne le widget avec le coin en bas à droite.</p>
    `;
    container.appendChild(helpPopup);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'sm-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // Seule la barre du haut déplace le widget (comme les autres activités) :
    // ailleurs, la flèche s'affiche et un appui ne fait pas glisser la fenêtre.
    ['pointerdown', 'mousedown', 'touchstart'].forEach(ev => container.addEventListener(ev, e => {
        if (e.target.closest('.sm-header') && !e.target.closest('button')) return;
        if (ev !== 'touchstart' && typeof bringToFront === 'function') bringToFront(widget);
        e.stopPropagation();
    }, ev === 'touchstart' ? { passive: true } : false));

    // ── État interne ──────────────────────────────────────────────────────
    const uid = 'sm' + Math.random().toString(36).slice(2, 9);
    const VIEWS = Object.keys(SM_VIEWS);
    const emptyRevealed = () => { const r = {}; VIEWS.forEach(v => r[v] = new Set()); return r; };
    let view = 'pyr';
    let showLabels = true;
    let guess = false;
    let revealed = emptyRevealed();
    let selected = null;
    let quiz = null;              // { order, i, score, miss, found, done, fb, fbCls }
    let partsG = null, labelsG = null;

    const els = () => SM_DATA[view];
    const elOf = (id) => els().find(e => e.id === id) || null;

    // ── Rendu ─────────────────────────────────────────────────────────────
    function buildSVG(anim) {
        svg.innerHTML = SM_SVG[view](uid);
        partsG = svg.querySelector('.sm-parts');
        labelsG = svg.querySelector('.sm-labels');
        if (anim) {
            svg.classList.remove('fade');
            void svg.getBoundingClientRect();
            svg.classList.add('fade');
        }
    }

    function renderLabels() {
        if (!labelsG) return;
        const visible = showLabels || guess || !!quiz;
        if (!visible) { labelsG.innerHTML = ''; return; }
        let lines = '', boxes = '';
        els().forEach(el => {
            let txt, cls = 'sm-lbl';
            if (quiz) {
                if (!quiz.found.has(el.id)) return;
                txt = el.name; cls += ' found';
            } else if (guess && !revealed[view].has(el.id)) {
                txt = '?'; cls += ' q';
            } else {
                if (!showLabels && !guess) return;
                txt = el.name;
            }
            if (!quiz && selected === el.id) cls += ' sel';
            const fsz = 15, h = 24;
            const w = Math.ceil(_smTextW(txt, fsz, 700)) + 16;
            const x = Math.max(2, Math.min(998 - w, el.lx - w / 2));
            const y = Math.max(2, Math.min(598 - h, el.ly - h / 2));
            const px = Math.max(x, Math.min(x + w, el.ax));
            const py = Math.max(y, Math.min(y + h, el.ay));
            if (Math.hypot(px - el.ax, py - el.ay) > 6) {
                lines += `<line x1="${el.ax}" y1="${el.ay}" x2="${px}" y2="${py}"/><circle cx="${el.ax}" cy="${el.ay}" r="3.5"/>`;
            }
            boxes += `<g class="${cls}" data-id="${el.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`
                + `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${_smEsc(txt)}</text></g>`;
        });
        labelsG.innerHTML = `<g class="sm-leaders">${lines}</g>${boxes}`;
    }

    function renderHighlight() {
        if (!partsG) return;
        partsG.querySelectorAll('.sm-part').forEach(p => {
            p.classList.toggle('sel', !quiz && p.dataset.id === selected);
        });
    }

    function defaultDetail() {
        if (view === 'pyr') {
            return `<p class="sm-hint">👆 Clique sur un étage de la pyramide pour découvrir qui étaient ces personnes.
                Au Moyen Âge, on disait que la société était faite de <b>trois ordres</b> :
                <b>ceux qui prient</b> (le clergé), <b>ceux qui combattent</b> (la noblesse)
                et <b>ceux qui travaillent</b> (le peuple).</p>${_smHundredHTML()}`;
        }
        if (view === 'seig') {
            return `<p class="sm-hint">🏘 Au Moyen Âge, les campagnes sont partagées en <b>seigneuries</b> : des terres qui
                appartiennent à un seigneur, avec son château, ses villages, ses champs et ses forêts.
                Clique sur un élément pour découvrir la vie de ceux qui y habitent.</p>
                <button class="sm-go" data-go="liens">⚖️ Qui doit quoi à qui ?</button>`;
        }
        return `<p class="sm-hint">⚖️ Au Moyen Âge, chacun doit quelque chose à quelqu'un !
            Les flèches montrent ce que l'un donne à l'autre. Clique sur un personnage ou sur une flèche
            (🏞 🤝 🛡 💰 🌾 🙏 👑) pour comprendre.</p>
            <button class="sm-go" data-go="pyr">🔺 Revoir la pyramide</button>`;
    }

    function renderDetail() {
        if (quiz) { detail.classList.add('hidden'); return; }
        detail.classList.remove('hidden');
        const el = selected ? elOf(selected) : null;
        if (!el || (guess && !revealed[view].has(el.id))) {
            detail.innerHTML = defaultDetail();
        } else {
            detail.innerHTML = `
                ${el.tag ? `<span class="sm-tag" style="background:${el.tag[1]}">${_smEsc(el.tag[0])}</span>` : ''}
                <h4>${_smEsc(el.name)}</h4>
                <p>${_smEsc(el.desc)}</p>
                ${el.fact ? `<div class="sm-fact">💡 <b>Le savais-tu ?</b> ${_smEsc(el.fact)}</div>` : ''}
                ${el.go ? `<button class="sm-go" data-go="${el.go[0]}">${_smEsc(el.go[1])}</button>` : ''}
            `;
        }
        detail.querySelectorAll('.sm-go').forEach(b => {
            b.addEventListener('mousedown', (e) => e.stopPropagation());
            b.addEventListener('click', (e) => { e.stopPropagation(); setView(b.dataset.go); save(); });
        });
    }

    function renderControls() {
        container.querySelectorAll('.sm-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        badge.textContent = SM_VIEWS[view].badge;
        namesBtn.classList.toggle('on', showLabels);
        namesBtn.classList.toggle('off-dim', guess || !!quiz);
        guessBtn.classList.toggle('on', guess);
        guessBtn.textContent = guess ? '👁 Tout révéler' : '🙈 Devinette';
        quizBtn.classList.toggle('on', !!quiz);
        quizBtn.textContent = quiz ? '✖ Arrêter le jeu' : '🎯 Jeu : qui suis-je ?';
    }

    function renderQuiz() {
        if (!quiz) { quizBar.classList.remove('show'); quizBar.innerHTML = ''; return; }
        quizBar.classList.add('show');
        const n = quiz.order.length;
        if (quiz.done) {
            const medal = quiz.score === n ? '🏆' : (quiz.score >= n * 0.6 ? '🥈' : '🎖');
            quizBar.innerHTML = `
                <span class="sm-q-ask">${medal} Terminé ! <b>${quiz.score}</b> bonne${quiz.score > 1 ? 's' : ''} réponse${quiz.score > 1 ? 's' : ''} du premier coup sur ${n}.</span>
                <button class="sm-q-btn" data-act="again">🔁 Rejouer</button>
                <button class="sm-q-btn" data-act="stop">✖ Arrêter</button>`;
        } else {
            const target = elOf(quiz.order[quiz.i]);
            quizBar.innerHTML = `
                <span class="sm-q-ask">🎯 <b>${_smEsc(target.q)}</b></span>
                <span class="sm-q-score">${quiz.i + 1} / ${n} · Score : ${quiz.score}</span>
                <button class="sm-q-btn" data-act="skip">⏭ Montre-moi</button>
                <button class="sm-q-btn" data-act="stop">✖ Arrêter</button>
                <div class="sm-q-fb ${quiz.fbCls || ''}">${quiz.fb || ''}</div>`;
        }
        quizBar.querySelectorAll('.sm-q-btn').forEach(b => {
            b.addEventListener('mousedown', (e) => e.stopPropagation());
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                const act = b.dataset.act;
                if (act === 'stop') stopQuiz();
                else if (act === 'again') startQuiz();
                else if (act === 'skip') quizSkip();
            });
        });
    }

    function update() {
        renderControls();
        renderLabels();
        renderHighlight();
        renderDetail();
        renderQuiz();
    }

    function flash(id, cls) {
        if (!partsG) return;
        partsG.querySelectorAll(`.sm-part[data-id="${id}"]`).forEach(p => {
            p.classList.remove('ok', 'ko', 'hint');
            void p.getBoundingClientRect();
            p.classList.add(cls);
            setTimeout(() => p.classList.remove(cls), 1100);
        });
    }

    // ── Jeu « Qui suis-je ? » ─────────────────────────────────────────────
    function startQuiz() {
        quiz = {
            order: _smShuffle(els().map(e => e.id)),
            i: 0, score: 0, miss: false, found: new Set(), done: false, fb: '', fbCls: ''
        };
        selected = null;
        update();
    }
    function stopQuiz() { quiz = null; update(); }
    function nextQuestion() {
        quiz.i++;
        quiz.miss = false;
        if (quiz.i >= quiz.order.length) { quiz.done = true; quiz.i = quiz.order.length - 1; }
    }
    function quizPick(id) {
        if (!quiz || quiz.done) return;
        const target = quiz.order[quiz.i];
        if (id === target) {
            if (!quiz.miss) quiz.score++;
            quiz.found.add(id);
            flash(id, 'ok');
            quiz.fb = '✅ Bravo ! C\'est bien : ' + elOf(id).name + '.';
            quiz.fbCls = 'ok';
            nextQuestion();
        } else {
            quiz.miss = true;
            flash(id, 'ko');
            quiz.fb = '❌ Non, ça c\'est : ' + elOf(id).name + '. Essaie encore !';
            quiz.fbCls = 'ko';
        }
        renderLabels();
        renderQuiz();
    }
    function quizSkip() {
        if (!quiz || quiz.done) return;
        const target = quiz.order[quiz.i];
        quiz.found.add(target);
        flash(target, 'hint');
        quiz.fb = '👉 La réponse était : ' + elOf(target).name + '.';
        quiz.fbCls = '';
        nextQuestion();
        renderLabels();
        renderQuiz();
    }

    // ── Interactions ──────────────────────────────────────────────────────
    function onPick(id) {
        if (quiz) { if (id) quizPick(id); return; }
        if (!id) {
            if (selected) { selected = null; update(); save(); }
            return;
        }
        if (guess && !revealed[view].has(id)) {
            revealed[view].add(id);
            selected = id;
        } else {
            selected = selected === id ? null : id;
        }
        update();
        save();
    }

    function setView(v, noAnim) {
        view = SM_VIEWS[v] ? v : 'pyr';
        selected = null;
        quiz = null;
        buildSVG(!noAnim);
        update();
    }

    _smBindTap(svg, (t) => {
        const hit = t && t.closest ? t.closest('[data-id]') : null;
        onPick(hit ? hit.dataset.id : null);
    });

    container.querySelectorAll('.sm-view-btn').forEach(b => {
        b.addEventListener('click', (e) => {
            e.stopPropagation();
            if (b.dataset.view !== view) { setView(b.dataset.view); save(); }
        });
    });
    namesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (guess || quiz) return;
        showLabels = !showLabels;
        update(); save();
    });
    guessBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quiz) quiz = null;
        if (guess) {
            guess = false;
        } else {
            guess = true;
            revealed = emptyRevealed();
            selected = null;
        }
        update(); save();
    });
    quizBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (quiz) stopQuiz(); else startQuiz();
    });

    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // Taille du texte de la fiche selon la largeur du widget
    function updateFont() {
        const W = container.clientWidth || initW;
        const fs = Math.max(12, Math.min(20, W / 62));
        container.style.setProperty('--smfs', fs.toFixed(1) + 'px');
    }
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(() => {
            if (!document.body.contains(widget)) { ro.disconnect(); return; }
            updateFont();
        });
        ro.observe(container);
    }

    // Redimensionnement (largeur ; la hauteur suit les proportions du dessin)
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startW = container.offsetWidth;
        document.onmousemove = (ev) => {
            container.style.width = Math.max(420, startW + ev.clientX - startX) + 'px';
            updateFont();
        };
        document.onmouseup = () => { document.onmousemove = null; document.onmouseup = null; save(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.touches[0].clientX, startW = container.offsetWidth;
        function onMove(ev) {
            container.style.width = Math.max(420, startW + ev.touches[0].clientX - startX) + 'px';
            updateFont();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            save();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null;
    let _isMax = false;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '👑 Société au Moyen Âge', {
            onExpand: () => requestAnimationFrame(updateFont)
        });
    });

    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedW = container.style.width;
            container.classList.add('wf-fullboard');
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedW) container.style.width = _savedW;
        }
        requestAnimationFrame(updateFont);
    });

    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        save();
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

    buildSVG(false);
    update();
    updateFont();

    // ── API pour save-load.js ─────────────────────────────────────────────
    widget._smGetData = () => {
        const rev = {};
        VIEWS.forEach(v => rev[v] = Array.from(revealed[v]));
        return {
            containerW: _isMax && _savedW ? parseInt(_savedW) : container.offsetWidth,
            view,
            showLabels,
            guess,
            revealed: rev,
            selected
        };
    };
    widget._smSetData = (d) => {
        if (!d) return;
        if (d.containerW) container.style.width = Math.max(420, d.containerW) + 'px';
        view = SM_VIEWS[d.view] ? d.view : 'pyr';
        showLabels = d.showLabels !== false;
        guess = !!d.guess;
        revealed = emptyRevealed();
        VIEWS.forEach(v => {
            const arr = d.revealed && Array.isArray(d.revealed[v]) ? d.revealed[v] : [];
            arr.forEach(id => { if (SM_DATA[v].some(e => e.id === id)) revealed[v].add(id); });
        });
        quiz = null;
        buildSVG(false);
        selected = (typeof d.selected === 'string' && elOf(d.selected)) ? d.selected : null;
        update();
        requestAnimationFrame(updateFont);
    };

    // Sur téléphone, ouverture directe en plein écran (bouton vert), comme le Taquin
    window._wfPhoneAutoMax(widget, () => wfMax.click(), () => _isMax, '_smSetData');

    save();
    return widget;
}
