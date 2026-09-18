// =========================================================================
// WIDGET LE COMPTE EST BON — Le Bureau du Prof
// Tirage de 6 nombres + cible à atteindre avec +, −, ×, ÷
// 3 niveaux : facile / moyen / difficile
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

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
            const others = Array.from(document.querySelectorAll('.widget')).filter(w => w !== widget && w.querySelector('.wf-mini-bar'));
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // ── CSS injecté une seule fois ─────────────────────────────────────────
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

    if (!document.getElementById('widget-ceb-style')) {
        const s = document.createElement('style');
        s.id = 'widget-ceb-style';
        s.textContent = `
        /* ── Police chiffres ── */
        @font-face {
            font-family: 'MarelleBaton';
            src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        /* ── Widget transparent ── */
        .widget[data-type="compte-est-bon"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        /* Variables de scale (recalculées par JS) :
           --ceb-s   : facteur global (1 = taille de référence à 620px)
           Toutes les tailles en em ou calc(X * var(--ceb-s)) */
        .ceb-container {
            --ceb-s: 1;
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: calc(16px * var(--ceb-s));
            padding: calc(14px * var(--ceb-s)) calc(16px * var(--ceb-s)) calc(12px * var(--ceb-s));
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: calc(10px * var(--ceb-s));
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow-y: auto;
            overflow-x: hidden;
            width: 620px;
        }
        .ceb-container input, .ceb-container select, .ceb-container textarea {
            user-select: text;
            -webkit-user-select: text;
        }

        /* ── État réduit ── */
        .ceb-container.wf-minimized > *:not(.ceb-header) { display: none !important; }
        .ceb-container.wf-minimized { gap: 0; }

        /* ── État plein écran ── */
        .ceb-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 40px !important;
        }
        .ceb-container.wf-fullboard .ceb-history-zone {
            max-height: none;
            overflow-y: visible;
        }

        /* ── En-tête ── */
        .ceb-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: calc(8px * var(--ceb-s));
            cursor: move;
            user-select: none;
        }
        .ceb-title {
            font-size: calc(13px * var(--ceb-s));
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
        }
        .ceb-level-badge {
            font-size: calc(10px * var(--ceb-s));
            font-weight: 700;
            padding: calc(2px * var(--ceb-s)) calc(8px * var(--ceb-s));
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .ceb-level-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .ceb-level-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .ceb-level-badge.difficile { background: #f8d7da; color: #842029; }

        /* ── Contrôles ── */
        .ceb-controls {
            display: flex;
            gap: calc(6px * var(--ceb-s));
            flex-wrap: wrap;
            align-items: center;
        }
        .ceb-btn {
            padding: calc(5px * var(--ceb-s)) calc(12px * var(--ceb-s));
            border-radius: calc(8px * var(--ceb-s));
            border: none;
            font-size: calc(11px * var(--ceb-s));
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
            white-space: nowrap;
        }
        .ceb-btn:active { transform: scale(0.96); }
        .ceb-btn-new    { background: #4a90e2; color: white; }
        .ceb-btn-new:hover { background: #357abd; }
        .ceb-btn-solution { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .ceb-btn-solution:hover { background: #e0e0e0; }
        .ceb-btn-solution.revealed { background: #28a745; color: white; border-color: #28a745; }
        .ceb-btn-clear  { background: #f0f0f0; color: #666; border: 1px solid #ddd; }
        .ceb-btn-clear:hover { background: #e0e0e0; }

        .ceb-level-btns { display: flex; gap: calc(4px * var(--ceb-s)); margin-left: auto; }
        .ceb-lvl-btn {
            padding: calc(4px * var(--ceb-s)) calc(9px * var(--ceb-s));
            border-radius: calc(6px * var(--ceb-s));
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: calc(10px * var(--ceb-s));
            font-weight: 700;
            cursor: pointer; color: #666; transition: background .15s;
            white-space: nowrap;
        }
        .ceb-lvl-btn:hover { background: #e0e0e0; }
        .ceb-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .ceb-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .ceb-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }

        /* ── Zone cible ── */
        .ceb-target-zone {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: calc(14px * var(--ceb-s));
            padding: calc(10px * var(--ceb-s));
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: calc(10px * var(--ceb-s));
        }
        .ceb-target-label {
            font-size: calc(12px * var(--ceb-s));
            color: #888;
            font-weight: 600;
        }
        .ceb-target-number {
            font-size: calc(44px * var(--ceb-s));
            font-weight: 900;
            color: #dc3545;
            letter-spacing: -1px;
            line-height: 1;
            min-width: calc(90px * var(--ceb-s));
            text-align: center;
            font-variant-numeric: tabular-nums;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Plaques tirées ── */
        .ceb-tiles-zone {
            display: flex;
            flex-wrap: wrap;
            gap: calc(8px * var(--ceb-s));
            align-items: center;
            justify-content: center;
            padding: calc(10px * var(--ceb-s));
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: calc(10px * var(--ceb-s));
            min-height: calc(58px * var(--ceb-s));
        }
        .ceb-tile {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: calc(50px * var(--ceb-s));
            height: calc(50px * var(--ceb-s));
            padding: 0 calc(10px * var(--ceb-s));
            border-radius: calc(10px * var(--ceb-s));
            font-size: calc(20px * var(--ceb-s));
            font-weight: 800;
            cursor: pointer;
            border: calc(2px * var(--ceb-s)) solid #d1d5db;
            background: white;
            color: #1e3a5f;
            box-shadow: 0 2px 6px rgba(0,0,0,0.10);
            transition: background .12s, border-color .12s, transform .1s, opacity .15s;
            user-select: none;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }
        .ceb-tile:hover:not(.used) { border-color: #4a90e2; background: #eff6ff; }
        .ceb-tile.selected { border-color: #4a90e2; background: #dbeafe; color: #1d4ed8; }
        .ceb-tile.used { opacity: 0.28; cursor: default; }
        .ceb-tile.grand { background: #fff7ed; border-color: #f97316; color: #9a3412; }
        .ceb-tile.grand:hover:not(.used) { background: #ffedd5; border-color: #ea580c; }
        .ceb-tile.grand.selected { background: #fed7aa; border-color: #c2410c; color: #7c2d12; }

        /* ── Zone opérations (calcul en cours) ── */
        .ceb-solution-host {
            position: relative;
        }
        .ceb-solution-content {
            display: flex;
            flex-direction: column;
            gap: calc(10px * var(--ceb-s));
            transition: filter .15s;
        }
        .ceb-solution-content.ceb-blur-behind {
            filter: blur(5px);
            pointer-events: none;
            user-select: none;
        }
        .ceb-ops-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(8px * var(--ceb-s));
            min-height: calc(120px * var(--ceb-s));
            justify-content: center;
        }
        .ceb-ops-title {
            font-size: calc(13px * var(--ceb-s));
            font-weight: 700;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: center;
        }
        .ceb-op-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: calc(8px * var(--ceb-s));
            flex-wrap: wrap;
            width: 100%;
        }
        .ceb-op-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: calc(64px * var(--ceb-s));
            height: calc(52px * var(--ceb-s));
            padding: 0 calc(12px * var(--ceb-s));
            border-radius: calc(10px * var(--ceb-s));
            font-size: calc(24px * var(--ceb-s));
            font-weight: 800;
            background: #f3f4f6;
            border: calc(1.5px * var(--ceb-s)) dashed #d1d5db;
            color: #6b7280;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }
        .ceb-op-box.filled {
            background: white;
            border-style: solid;
            border-color: #4a90e2;
            color: #1e3a5f;
        }
        .ceb-op-box.result {
            background: #eff6ff;
            border-color: #93c5fd;
            color: #1d4ed8;
            font-size: calc(22px * var(--ceb-s));
        }
        .ceb-op-btns {
            display: flex;
            gap: calc(6px * var(--ceb-s));
        }
        .ceb-op-btn {
            width: calc(46px * var(--ceb-s));
            height: calc(46px * var(--ceb-s));
            border-radius: calc(10px * var(--ceb-s));
            border: calc(1.5px * var(--ceb-s)) solid #d1d5db;
            background: white;
            font-size: calc(22px * var(--ceb-s));
            font-weight: 900;
            color: #374151;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background .12s, border-color .12s;
        }
        .ceb-op-btn:hover { background: #f3f4f6; border-color: #9ca3af; }
        .ceb-op-btn.active { background: #dbeafe; border-color: #3b82f6; color: #1d4ed8; }

        /* ── Historique des étapes ── */
        .ceb-history-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: calc(6px * var(--ceb-s));
            max-height: calc(190px * var(--ceb-s));
            overflow-y: auto;
            scroll-behavior: smooth;
            padding-bottom: calc(2px * var(--ceb-s));
            width: 100%;
        }
        .ceb-history-step {
            display: flex;
            align-items: center;
            gap: calc(10px * var(--ceb-s));
            padding: calc(7px * var(--ceb-s)) calc(14px * var(--ceb-s));
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: calc(10px * var(--ceb-s));
            font-size: calc(16px * var(--ceb-s));
            width: 90%;
            max-width: calc(420px * var(--ceb-s));
            box-sizing: border-box;
        }
        .ceb-history-step .step-expr { font-weight: 700; color: #374151; flex: 1; font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; }
        .ceb-history-step .step-result { font-weight: 800; color: #1d4ed8; min-width: calc(48px * var(--ceb-s)); text-align: right; font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; }
        .ceb-history-step .step-del {
            width: calc(20px * var(--ceb-s)); height: calc(20px * var(--ceb-s)); border-radius: 50%;
            border: none; background: #fee2e2; color: #dc3545;
            font-size: calc(12px * var(--ceb-s)); font-weight: 900; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: background .1s;
        }
        .ceb-history-step .step-del:hover { background: #fca5a5; }
        .ceb-history-step.best-step { background: #f0fff4; border-color: #86efac; }
        .ceb-history-step.best-step .step-result { color: #16a34a; }

        /* ── Zone résultat / feedback ── */
        .ceb-result-zone {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: calc(8px * var(--ceb-s));
            min-height: calc(30px * var(--ceb-s));
            flex-wrap: wrap;
            text-align: center;
            width: 100%;
        }
        .ceb-result-text {
            font-size: calc(20px * var(--ceb-s));
            font-weight: 800;
            opacity: 0;
            transition: opacity .3s;
        }
        .ceb-result-text.show { opacity: 1; }
        .ceb-result-text.exact  { color: #16a34a; }
        .ceb-result-text.proche { color: #d97706; }
        .ceb-result-text.loin   { color: #dc3545; }

        /* ── Zone solution (révélée) — superposée à l'opération en cours ── */
        .ceb-solution-zone {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: auto;
            background: rgba(255, 255, 255, 0.35);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border-radius: calc(10px * var(--ceb-s));
            z-index: 5;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: calc(10px * var(--ceb-s));
        }
        .ceb-solution-zone.show { display: flex; }
        .ceb-solution-card {
            background: #f0fff4;
            border: 1px solid #86efac;
            border-radius: calc(10px * var(--ceb-s));
            box-shadow: 0 6px 20px rgba(0,0,0,0.18);
            padding: calc(16px * var(--ceb-s)) calc(22px * var(--ceb-s));
            font-size: calc(23px * var(--ceb-s));
            color: #166534;
            line-height: 1.8;
            text-align: center;
            max-width: 100%;
            box-sizing: border-box;
        }
        .ceb-solution-card strong { font-size: calc(24px * var(--ceb-s)); }

        /* ── Bouton aide ── */
        .ceb-help-btn {
            width: calc(22px * var(--ceb-s)); height: calc(22px * var(--ceb-s)); border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: calc(12px * var(--ceb-s)); font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .ceb-help-btn:hover { background: #e0e0e0; color: #333; }

        /* ── Popup aide (taille fixe, non scalée) ── */
        .ceb-help-popup {
            display: none;
            position: absolute;
            top: 36px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 290px;
            font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ceb-help-popup.show { display: block; }
        .ceb-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .ceb-help-popup .help-level {
            margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;
        }
        .ceb-help-popup .help-level:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .help-badge-ceb {
            display: inline-block; font-size: 9px; font-weight: 700;
            padding: 1px 6px; border-radius: 10px; text-transform: uppercase;
            margin-right: 4px; vertical-align: middle;
        }
        .help-badge-ceb.facile    { background: #d4edda; color: #1a7a3a; }
        .help-badge-ceb.moyen     { background: #fff3cd; color: #8a5c00; }
        .help-badge-ceb.difficile { background: #f8d7da; color: #842029; }

        /* ── Poignées resize 8 directions ── */
        .ceb-rh {
            position: absolute; z-index: 10; opacity: 0; transition: opacity .2s;
        }
        .ceb-container:hover .ceb-rh { opacity: 1; }

        /* Coins */
        .ceb-rh-se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; }
        .ceb-rh-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: sw-resize;
            background: linear-gradient(225deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 0 14px; }
        .ceb-rh-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: ne-resize;
            background: linear-gradient(45deg, transparent 50%, #aaa 50%);
            border-radius: 0 14px 0 0; }
        .ceb-rh-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nw-resize;
            background: linear-gradient(315deg, transparent 50%, #aaa 50%);
            border-radius: 14px 0 0 0; }

        /* Bords */
        .ceb-rh-n  { top: 0; left: 14px; right: 14px; height: 5px; cursor: n-resize;
            background: transparent; }
        .ceb-rh-s  { bottom: 0; left: 14px; right: 14px; height: 5px; cursor: s-resize;
            background: transparent; }
        .ceb-rh-e  { top: 14px; bottom: 14px; right: 0; width: 5px; cursor: e-resize;
            background: transparent; }
        .ceb-rh-w  { top: 14px; bottom: 14px; left: 0; width: 5px; cursor: w-resize;
            background: transparent; }

        /* Zone visible au survol des bords */
        .ceb-rh-n:hover, .ceb-rh-s:hover { background: rgba(74,144,226,0.18); }
        .ceb-rh-e:hover, .ceb-rh-w:hover { background: rgba(74,144,226,0.18); }

        /* ── Consigne ── */
        .ceb-consigne {
            font-size: calc(11px * var(--ceb-s)); color: #888; font-style: italic;
        }

        @keyframes ceb-pulse {
            0%,100% { transform: scale(1); }
            50%      { transform: scale(1.06); }
        }
        .ceb-target-number.pulse { animation: ceb-pulse 0.4s ease; }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // NIVEAUX
    // =========================================================================
    const CEB_NIVEAUX = {
        facile: {
            label: 'Facile',
            // 5 petites plaques (1–10), cible entre 20 et 99, atteignable en 2-3 opérations
            petits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            grands: [],
            nbPetits: 5,
            nbGrands: 0,
            cibleMin: null,
            cibleMax: null,
        },
        moyen: {
            label: 'Moyen',
            petits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            grands: [25, 50, 75, 100],
            nbPetits: 4,
            nbGrands: 2,
            cibleMin: 100,
            cibleMax: 999,
        },
        difficile: {
            label: 'Difficile',
            petits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            grands: [25, 50, 75, 100],
            nbPetits: 3,
            nbGrands: 3,
            cibleMin: 100,
            cibleMax: 999,
        }
    };

    // =========================================================================
    // SOLVEUR FACILE (sans division, × uniquement si a<10 et b<10)
    // =========================================================================

    function cebSolveFacile(numbers, target) {
        let best = null;

        function rec(nums, steps) {
            for (let i = 0; i < nums.length; i++) {
                for (let j = 0; j < nums.length; j++) {
                    if (i === j) continue;
                    const a = nums[i], b = nums[j];
                    const candidates = [
                        { op: '+', r: a + b },
                        { op: '−', r: a - b },
                    ];
                    // Multiplication : uniquement si les DEUX opérandes sont < 10
                    if (a < 10 && b < 10) candidates.push({ op: '×', r: a * b });

                    for (const { op, r } of candidates) {
                        if (r === null || r <= 0) continue;
                        const newStep = `${a} ${op} ${b} = ${r}`;
                        const newSteps = [...steps, newStep];
                        const newNums = nums.filter((_, k) => k !== i && k !== j).concat(r);

                        const dist = Math.abs(r - target);
                        if (!best || dist < Math.abs(best.result - target)) {
                            best = { steps: newSteps, result: r };
                        }
                        if (r === target) return;
                        if (newNums.length > 1) rec(newNums, newSteps);
                        if (best && best.result === target) return;
                    }
                    if (best && best.result === target) return;
                }
                if (best && best.result === target) return;
            }
        }

        rec(numbers, []);
        return best;
    }

    // =========================================================================
    // SOLVEUR GÉNÉRAL (recherche de solution)
    // =========================================================================

    function cebSolve(numbers, target) {
        // Recherche récursive — retourne la meilleure solution trouvée
        // { steps: [...], result: number } ou null
        let best = null;

        function rec(nums, steps) {
            for (let i = 0; i < nums.length; i++) {
                for (let j = 0; j < nums.length; j++) {
                    if (i === j) continue;
                    const a = nums[i], b = nums[j];
                    const ops = [
                        { op: '+', r: a + b },
                        { op: '−', r: a - b },
                        { op: '×', r: a * b },
                        { op: '÷', r: b !== 0 && a % b === 0 ? a / b : null },
                    ];
                    for (const { op, r } of ops) {
                        if (r === null || r <= 0) continue;
                        const newStep = `${a} ${op} ${b} = ${r}`;
                        const newSteps = [...steps, newStep];
                        const newNums = nums.filter((_, k) => k !== i && k !== j).concat(r);

                        // Évaluer la qualité
                        const dist = Math.abs(r - target);
                        if (!best || dist < Math.abs(best.result - target)) {
                            best = { steps: newSteps, result: r };
                        }
                        if (r === target) return; // solution exacte trouvée

                        if (newNums.length > 1) rec(newNums, newSteps);
                        if (best && best.result === target) return;
                    }
                    if (best && best.result === target) return;
                }
                if (best && best.result === target) return;
            }
        }

        rec(numbers, []);
        return best;
    }

    // =========================================================================
    // GÉNÉRATEUR DE TIRAGE
    // =========================================================================

    function cebGenerate(levelKey) {
        const niveau = CEB_NIVEAUX[levelKey];

        // Tirer les petits nombres (avec remise possible)
        const petitsPool = [...niveau.petits, ...niveau.petits];
        const shufflePetits = petitsPool.sort(() => Math.random() - 0.5);
        const petits = shufflePetits.slice(0, niveau.nbPetits);

        // Tirer les grands (sans remise)
        const shuffleGrands = [...niveau.grands].sort(() => Math.random() - 0.5);
        const grands = shuffleGrands.slice(0, niveau.nbGrands);

        const plaques = [...petits, ...grands].sort(() => Math.random() - 0.5);

        // ── Mode FACILE : cible entre 20 et 99, solution sans ÷, × seulement <10×<10, ≥3 étapes ──
        if (levelKey === 'facile') {
            // Chercher une cible nécessitant exactement 3 étapes (ou au moins 3)
            for (let attempt = 0; attempt < 60; attempt++) {
                const cible = 20 + Math.floor(Math.random() * 80); // 20–99
                const sol = cebSolveFacile([...plaques], cible);
                if (sol && sol.result === cible && sol.steps.length >= 3) {
                    return { plaques, cible };
                }
            }
            // Fallback : accepter 2 étapes minimum
            for (let attempt = 0; attempt < 40; attempt++) {
                const cible = 20 + Math.floor(Math.random() * 80);
                const sol = cebSolveFacile([...plaques], cible);
                if (sol && sol.result === cible && sol.steps.length >= 2) {
                    return { plaques, cible };
                }
            }
            // Dernier fallback : n'importe quelle solution exacte
            for (let attempt = 0; attempt < 30; attempt++) {
                const cible = 20 + Math.floor(Math.random() * 80);
                const sol = cebSolveFacile([...plaques], cible);
                if (sol && sol.result === cible) {
                    return { plaques, cible };
                }
            }
            const sorted = [...plaques].sort((a,b) => b - a);
            return { plaques, cible: sorted[0] + sorted[1] };
        }

        // ── Niveaux moyen / difficile : cible aléatoire classique ──
        const cible = niveau.cibleMin + Math.floor(Math.random() * (niveau.cibleMax - niveau.cibleMin + 1));
        return { plaques, cible };
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================

    window.createCompteEstBonWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = findFreePosition();

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'compte-est-bon';
        widget.dataset.transparent = 'true';
        widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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

        // ── Conteneur principal ────────────────────────────────────────────
        const container = document.createElement('div');
        container.className = 'ceb-container';

        // ── En-tête ────────────────────────────────────────────────────────
        container.innerHTML = `
            <div class="ceb-header">
                <span class="ceb-title">🔢 Le Compte est Bon</span>
                <span class="ceb-level-badge facile">Facile</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="ceb-help-btn" title="Aide sur les niveaux">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <!-- Contrôles -->
            <div class="ceb-controls">
                <button class="ceb-btn ceb-btn-new">🔄 Nouveau</button>
                <button class="ceb-btn ceb-btn-solution">👁 Voir la solution</button>
                <button class="ceb-btn ceb-btn-clear">🗑 Effacer</button>
                <div class="ceb-level-btns">
                    <button class="ceb-lvl-btn active-facile" data-level="facile">😊 Facile</button>
                    <button class="ceb-lvl-btn" data-level="moyen">😐 Moyen</button>
                    <button class="ceb-lvl-btn" data-level="difficile">😤 Difficile</button>
                </div>
            </div>

            <!-- Cible -->
            <div class="ceb-target-zone">
                <span class="ceb-target-label">Cible à atteindre :</span>
                <span class="ceb-target-number">—</span>
            </div>

            <!-- Consigne -->
            <div class="ceb-consigne">Clique sur 2 plaques puis un opérateur pour faire un calcul. Utilise chaque plaque au maximum une fois.</div>

            <!-- Plaques tirées -->
            <div class="ceb-tiles-zone"></div>

            <!-- Opération en cours + Historique + Résultat, avec superposition solution -->
            <div class="ceb-solution-host">
                <div class="ceb-solution-content">
                    <!-- Opération en cours -->
                    <div class="ceb-ops-zone">
                        <div class="ceb-ops-title">Opération en cours</div>
                        <div class="ceb-op-row">
                            <div class="ceb-op-box" data-role="op-a">?</div>
                            <div class="ceb-op-btns">
                                <button class="ceb-op-btn" data-op="+">+</button>
                                <button class="ceb-op-btn" data-op="−">−</button>
                                <button class="ceb-op-btn" data-op="×">×</button>
                                <button class="ceb-op-btn" data-op="÷">÷</button>
                            </div>
                            <div class="ceb-op-box" data-role="op-b">?</div>
                            <div style="font-size:18px;font-weight:900;color:#9ca3af">=</div>
                            <div class="ceb-op-box result" data-role="op-result">?</div>
                            <button class="ceb-btn" id="ceb-validate-btn" style="background:#16a34a;color:white;display:none">✓ Valider</button>
                        </div>
                    </div>

                    <!-- Historique -->
                    <div class="ceb-ops-title" style="font-size:calc(13px * var(--ceb-s));font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;text-align:center">Mes calculs</div>
                    <div class="ceb-history-zone"></div>

                    <!-- Résultat -->
                    <div class="ceb-result-zone">
                        <span class="ceb-result-text"></span>
                    </div>
                </div>
                <!-- Solution révélée (superposée à l'opération en cours + historique + résultat) -->
                <div class="ceb-solution-zone">
                    <div class="ceb-solution-card"></div>
                </div>
            </div>

            <!-- Popup aide -->
            <div class="ceb-help-popup">
                <h4>💡 Les niveaux de jeu</h4>
                <div class="help-level">
                    <span class="help-badge-ceb facile">😊 Facile</span><br>
                    5 petites plaques (1 à 10)<br>
                    Cible : entre 20 et 99<br>
                    Solution en 2 ou 3 opérations, sans grands nombres
                </div>
                <div class="help-level">
                    <span class="help-badge-ceb moyen">😐 Moyen</span><br>
                    4 petites plaques + 2 grandes (25, 50, 75, 100)<br>
                    Cible : 100 à 999
                </div>
                <div class="help-level">
                    <span class="help-badge-ceb difficile">😤 Difficile</span><br>
                    3 petites plaques + 3 grandes (25, 50, 75, 100)<br>
                    Cible : 100 à 999<br>
                    La solution peut nécessiter toutes les plaques !
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:10px;color:#888">
                    Règles : divisions entières uniquement, résultats intermédiaires > 0, chaque plaque utilisée au plus une fois.
                </div>
            </div>

            <!-- Poignées resize 8 directions -->
            <div class="ceb-rh ceb-rh-nw" data-dir="nw"></div>
            <div class="ceb-rh ceb-rh-n"  data-dir="n"></div>
            <div class="ceb-rh ceb-rh-ne" data-dir="ne"></div>
            <div class="ceb-rh ceb-rh-e"  data-dir="e"></div>
            <div class="ceb-rh ceb-rh-se" data-dir="se"></div>
            <div class="ceb-rh ceb-rh-s"  data-dir="s"></div>
            <div class="ceb-rh ceb-rh-sw" data-dir="sw"></div>
            <div class="ceb-rh ceb-rh-w"  data-dir="w"></div>
        `;

        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const badge       = container.querySelector('.ceb-level-badge');
        const newBtn      = container.querySelector('.ceb-btn-new');
        const solBtn      = container.querySelector('.ceb-btn-solution');
        const clearBtn    = container.querySelector('.ceb-btn-clear');
        const lvlBtns     = container.querySelectorAll('.ceb-lvl-btn');
        const targetEl    = container.querySelector('.ceb-target-number');
        const tilesZone   = container.querySelector('.ceb-tiles-zone');
        const opBoxA      = container.querySelector('[data-role="op-a"]');
        const opBoxB      = container.querySelector('[data-role="op-b"]');
        const opBoxResult = container.querySelector('[data-role="op-result"]');
        const opBtns      = container.querySelectorAll('.ceb-op-btn');
        const validateBtn = container.querySelector('#ceb-validate-btn');
        const historyZone = container.querySelector('.ceb-history-zone');
        const resultText  = container.querySelector('.ceb-result-text');
        const solutionZone= container.querySelector('.ceb-solution-zone');
        const solutionCard= container.querySelector('.ceb-solution-card');
        const opsZone     = container.querySelector('.ceb-solution-content');
        const helpBtn     = container.querySelector('.ceb-help-btn');
        const helpPopup   = container.querySelector('.ceb-help-popup');

        // ── État interne ───────────────────────────────────────────────────
        let currentLevel  = 'facile';
        let currentCible  = 0;
        let currentPlaques = [];
        let solutionShown = false;

        // ── Scale proportionnel ────────────────────────────────────────────
        // Largeur de référence = 620px → --ceb-s = 1
        const BASE_W = 620;
        function applyScale() {
            const w = container.offsetWidth || BASE_W;
            const s = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--ceb-s', s.toFixed(4));
        }

        // État de l'opération en cours
        let selA = null;   // index dans currentPlaques
        let selOp = null;  // '+', '−', '×', '÷'
        let selB = null;   // index dans currentPlaques

        // Historique des étapes : { exprStr, resultVal, idA, idB, newId }
        let history = [];
        // Plaques disponibles (incluant résultats intermédiaires) :
        // currentPlaques + résultats intermédiaires non utilisés
        let availableTiles = []; // { id, valeur, isGrand, source: 'plaque'|'calc', usedBy: null }

        let nextId = 100;

        // ── Initialiser un tirage ──────────────────────────────────────────
        function newGame() {
            const { plaques, cible } = cebGenerate(currentLevel);
            currentCible = cible;
            currentPlaques = plaques;
            solutionShown = false;
            solBtn.textContent = '👁 Voir la solution';
            solBtn.classList.remove('revealed');
            solutionZone.classList.remove('show');
            solutionCard.innerHTML = '';
            opsZone.classList.remove('ceb-blur-behind');

            // Initialiser les tuiles disponibles
            nextId = 100;
            availableTiles = plaques.map((v, i) => ({
                id: nextId++,
                valeur: v,
                isGrand: CEB_NIVEAUX[currentLevel].grands.includes(v),
                source: 'plaque',
                usedBy: null,
            }));

            history = [];
            resetOp();
            renderTiles();
            renderHistory();
            updateResult(null);

            targetEl.textContent = cible;
            targetEl.classList.add('pulse');
            setTimeout(() => targetEl.classList.remove('pulse'), 500);

            if (typeof saveBoard === 'function') saveBoard();
        }

        // ── Réinitialiser l'opération en cours ────────────────────────────
        function resetOp() {
            selA = null; selOp = null; selB = null;
            opBoxA.textContent = '?'; opBoxA.classList.remove('filled');
            opBoxB.textContent = '?'; opBoxB.classList.remove('filled');
            opBoxResult.textContent = '?';
            opBtns.forEach(b => b.classList.remove('active'));
            validateBtn.style.display = 'none';
            // Désélectionner visuellement
            tilesZone.querySelectorAll('.ceb-tile').forEach(t => t.classList.remove('selected'));
        }

        // ── Rendu des tuiles ───────────────────────────────────────────────
        function renderTiles() {
            tilesZone.innerHTML = '';
            availableTiles.forEach(tile => {
                const el = document.createElement('div');
                el.className = 'ceb-tile' + (tile.isGrand ? ' grand' : '');
                el.textContent = tile.valeur;
                el.dataset.tileId = tile.id;
                if (tile.usedBy !== null) {
                    el.classList.add('used');
                } else {
                    el.addEventListener('pointerdown', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onTileClick(tile.id, el);
                    });
                }
                tilesZone.appendChild(el);
            });
        }

        // ── Clic sur une tuile ─────────────────────────────────────────────
        function onTileClick(tileId, el) {
            const tile = availableTiles.find(t => t.id === tileId);
            if (!tile || tile.usedBy !== null) return;

            // Si c'est déjà selA, désélectionner
            if (selA === tileId) {
                selA = null;
                opBoxA.textContent = '?'; opBoxA.classList.remove('filled');
                el.classList.remove('selected');
                updateOpResult();
                return;
            }
            // Si c'est déjà selB, désélectionner
            if (selB === tileId) {
                selB = null;
                opBoxB.textContent = '?'; opBoxB.classList.remove('filled');
                el.classList.remove('selected');
                updateOpResult();
                return;
            }

            if (selA === null) {
                selA = tileId;
                opBoxA.textContent = tile.valeur; opBoxA.classList.add('filled');
                el.classList.add('selected');
            } else if (selB === null) {
                selB = tileId;
                opBoxB.textContent = tile.valeur; opBoxB.classList.add('filled');
                el.classList.add('selected');
            } else {
                // Les deux slots pris : remplacer B
                const oldBEl = tilesZone.querySelector(`[data-tile-id="${selB}"]`);
                if (oldBEl) oldBEl.classList.remove('selected');
                selB = tileId;
                opBoxB.textContent = tile.valeur; opBoxB.classList.add('filled');
                el.classList.add('selected');
            }
            updateOpResult();
        }

        // ── Clic sur un opérateur ──────────────────────────────────────────
        opBtns.forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                selOp = btn.dataset.op;
                opBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateOpResult();
            });
        });

        // ── Mise à jour du résultat affiché ────────────────────────────────
        function updateOpResult() {
            if (selA === null || selB === null || selOp === null) {
                opBoxResult.textContent = '?';
                validateBtn.style.display = 'none';
                return;
            }
            const tA = availableTiles.find(t => t.id === selA);
            const tB = availableTiles.find(t => t.id === selB);
            if (!tA || !tB) { opBoxResult.textContent = '?'; return; }

            const a = tA.valeur, b = tB.valeur;
            let r = null;

            // En mode facile : pas de division
            if (currentLevel === 'facile' && selOp === '÷') {
                opBoxResult.textContent = '✗'; validateBtn.style.display = 'none'; return;
            }

            if (selOp === '+') r = a + b;
            else if (selOp === '−') r = a - b;
            else if (selOp === '×') r = a * b;
            else if (selOp === '÷') r = (b !== 0 && a % b === 0) ? a / b : null;

            if (r === null || r <= 0) {
                opBoxResult.textContent = '✗';
                validateBtn.style.display = 'none';
            } else {
                opBoxResult.textContent = r;
                validateBtn.style.display = '';
            }
        }

        // ── Valider une opération ──────────────────────────────────────────
        validateBtn.addEventListener('click', () => {
            if (selA === null || selB === null || selOp === null) return;
            const tA = availableTiles.find(t => t.id === selA);
            const tB = availableTiles.find(t => t.id === selB);
            if (!tA || !tB) return;

            const a = tA.valeur, b = tB.valeur;

            // Garde-fou facile : division interdite uniquement
            if (currentLevel === 'facile' && selOp === '÷') return;

            let r = null;
            if (selOp === '+') r = a + b;
            else if (selOp === '−') r = a - b;
            else if (selOp === '×') r = a * b;
            else if (selOp === '÷') r = (b !== 0 && a % b === 0) ? a / b : null;
            if (r === null || r <= 0) return;

            const newId = nextId++;
            const exprStr = `${a} ${selOp} ${b} = ${r}`;

            // Marquer les deux tuiles comme utilisées
            tA.usedBy = newId;
            tB.usedBy = newId;

            // Ajouter la nouvelle tuile résultat
            availableTiles.push({
                id: newId,
                valeur: r,
                isGrand: false,
                source: 'calc',
                usedBy: null,
            });

            // Historique
            history.push({ exprStr, resultVal: r, idA: selA, idB: selB, newId });

            resetOp();
            renderTiles();
            renderHistory();
            checkWin();
        });

        // ── Effacer la dernière étape ──────────────────────────────────────
        function undoStep(stepIndex) {
            // Annuler toutes les étapes depuis stepIndex (cascade)
            for (let i = history.length - 1; i >= stepIndex; i--) {
                const step = history[i];
                // Libérer les tuiles utilisées
                const tA = availableTiles.find(t => t.id === step.idA);
                const tB = availableTiles.find(t => t.id === step.idB);
                if (tA) tA.usedBy = null;
                if (tB) tB.usedBy = null;
                // Retirer la tuile résultat
                const idx = availableTiles.findIndex(t => t.id === step.newId);
                if (idx !== -1) availableTiles.splice(idx, 1);
            }
            history = history.slice(0, stepIndex);
            resetOp();
            renderTiles();
            renderHistory();
            updateResult(null);
        }

        // ── Rendu historique ───────────────────────────────────────────────
        function renderHistory() {
            historyZone.innerHTML = '';
            if (history.length === 0) {
                historyZone.innerHTML = '<div style="font-size:11px;color:#bbb;font-style:italic;padding:4px 8px">Aucun calcul encore</div>';
                return;
            }
            history.forEach((step, i) => {
                const row = document.createElement('div');
                const isBest = Math.abs(step.resultVal - currentCible) < 10;
                row.className = 'ceb-history-step' + (isBest ? ' best-step' : '');
                row.innerHTML = `
                    <span class="step-expr">${step.exprStr}</span>
                    <span class="step-result">${step.resultVal}</span>
                    <button class="step-del" title="Annuler jusqu'ici">×</button>
                `;
                row.querySelector('.step-del').addEventListener('click', () => undoStep(i));
                historyZone.appendChild(row);
            });
            // Faire défiler vers le bas pour que la dernière opération soit toujours entièrement visible
            historyZone.scrollTop = historyZone.scrollHeight;
        }

        // ── Vérifier si on a gagné / afficher le meilleur résultat ─────────
        function checkWin() {
            // Chercher la tuile non utilisée la plus proche de la cible
            const free = availableTiles.filter(t => t.usedBy === null);
            if (free.length === 0) { updateResult(null); return; }
            const best = free.reduce((b, t) => Math.abs(t.valeur - currentCible) < Math.abs(b.valeur - currentCible) ? t : b);
            updateResult(best.valeur);
        }

        // ── Afficher le feedback de résultat ──────────────────────────────
        function updateResult(val) {
            if (val === null) {
                resultText.textContent = '';
                resultText.classList.remove('show');
                return;
            }
            const diff = Math.abs(val - currentCible);
            resultText.classList.remove('exact', 'proche', 'loin');
            if (diff === 0) {
                resultText.textContent = '🎉 Compte exact !';
                resultText.classList.add('exact');
            } else if (diff <= 10) {
                resultText.textContent = `😊 À ${diff} près !`;
                resultText.classList.add('proche');
            } else if (diff <= 25) {
                resultText.textContent = `😐 À ${diff} du compte`;
                resultText.classList.add('loin');
            } else {
                resultText.textContent = `😕 À ${diff} du compte`;
                resultText.classList.add('loin');
            }
            resultText.classList.add('show');
        }

        // ── Effacer tout ───────────────────────────────────────────────────
        clearBtn.addEventListener('click', () => {
            // Réinitialiser toutes les tuiles
            nextId = 100;
            const niveauData = CEB_NIVEAUX[currentLevel];
            availableTiles = currentPlaques.map(v => ({
                id: nextId++,
                valeur: v,
                isGrand: niveauData.grands.includes(v),
                source: 'plaque',
                usedBy: null,
            }));
            history = [];
            resetOp();
            renderTiles();
            renderHistory();
            updateResult(null);
        });

        // ── Voir / cacher la solution ──────────────────────────────────────
        solBtn.addEventListener('click', () => {
            if (!solutionShown) {
                solutionShown = true;
                solBtn.textContent = '🙈 Cacher';
                solBtn.classList.add('revealed');
                // Calculer la solution
                const sol = currentLevel === 'facile'
                    ? cebSolveFacile([...currentPlaques], currentCible)
                    : cebSolve([...currentPlaques], currentCible);
                if (sol) {
                    const diff = Math.abs(sol.result - currentCible);
                    const header = diff === 0
                        ? `<strong>✅ Solution exacte :</strong>`
                        : `<strong>⚠️ Meilleure approche trouvée (à ${diff} près) :</strong>`;
                    solutionCard.innerHTML = header + '<br>' + sol.steps.map(s => `<span>→ ${s}</span>`).join('<br>');
                } else {
                    solutionCard.innerHTML = '<strong>Aucune solution trouvée.</strong>';
                }
                solutionZone.classList.add('show');
                opsZone.classList.add('ceb-blur-behind');
                // Le conteneur solution-host a une hauteur automatique basée sur son
                // contenu normal (opération + historique + résultat). Comme un % de
                // hauteur ne fonctionne pas sur un enfant absolu dont l'ancêtre n'a
                // pas de hauteur explicite, on fixe la hauteur de la superposition
                // en JS pour qu'elle couvre TOUJOURS au moins tout ce contenu (et
                // davantage si la carte solution est elle-même plus haute), afin
                // que rien ne reste net/visible en dessous.
                requestAnimationFrame(() => {
                    const contentH = opsZone.offsetHeight;
                    const cardH = solutionCard.offsetHeight + 20; // + padding de la superposition
                    solutionZone.style.height = Math.max(contentH, cardH) + 'px';
                });
            } else {
                solutionShown = false;
                solBtn.textContent = '👁 Voir la solution';
                solBtn.classList.remove('revealed');
                solutionZone.classList.remove('show');
                solutionZone.style.height = '';
                opsZone.classList.remove('ceb-blur-behind');
            }
        });

        // ── Changer de niveau ──────────────────────────────────────────────
        function setLevel(level) {
            currentLevel = level;
            badge.className = `ceb-level-badge ${level}`;
            badge.textContent = CEB_NIVEAUX[level].label;
            lvlBtns.forEach(btn => {
                btn.className = 'ceb-lvl-btn';
                if (btn.dataset.level === level) btn.classList.add(`active-${level}`);
            });
            // Masquer ÷ en mode facile
            const divBtn = container.querySelector('.ceb-op-btn[data-op="÷"]');
            if (divBtn) divBtn.style.display = level === 'facile' ? 'none' : '';
            // Si l'op sélectionnée est ÷ et qu'on passe en facile, la réinitialiser
            if (level === 'facile' && selOp === '÷') {
                selOp = null;
                opBtns.forEach(b => b.classList.remove('active'));
                updateOpResult();
            }
            newGame();
        }

        lvlBtns.forEach(btn => btn.addEventListener('click', () => setLevel(btn.dataset.level)));
        newBtn.addEventListener('click', newGame);

        // ── Aide ───────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('show'));

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _isMin = false, _isMax = false, _savedW = null;

        if (wfMin) {
            wfMin.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMax) wfMax.click();
                window._wfMiniBarCollapse(widget, '🔢 Le Compte est Bon');
            });
        }
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMin) { _isMin = false; container.classList.remove('wf-minimized'); }
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    if (_savedW) container.style.width = _savedW;
                }
            });
        }
        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.ceb-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;

            function startResize(clientX, clientY) {
                const startX  = clientX, startY = clientY;
                const startW  = container.offsetWidth;
                const startH  = container.offsetHeight;
                const startL  = widget.offsetLeft;
                const startT  = widget.offsetTop;

                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;

                    if (dir.includes('e')) newW = Math.max(380, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(380, startW - dx); newL = startL + (startW - newW); }
                    if (dir.includes('s')) newH = Math.max(200, startH + dy);
                    if (dir.includes('n')) { newH = Math.max(200, startH - dy); newT = startT + (startH - newH); }

                    container.style.width  = newW + 'px';
                    container.style.height = newH + 'px';
                    if (dir.includes('w')) widget.style.left = newL + 'px';
                    if (dir.includes('n')) widget.style.top  = newT + 'px';
                    applyScale();
                };

                const onMouseMove = (ev) => onMove(ev.clientX, ev.clientY);
                const onTouchMove = (ev) => onMove(ev.touches[0].clientX, ev.touches[0].clientY);
                const stop = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup',   stop);
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend',  stop);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup',   stop);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend',  stop);
            }

            handle.addEventListener('mousedown', (e) => {
                e.preventDefault(); e.stopPropagation();
                startResize(e.clientX, e.clientY);
            });
            handle.addEventListener('touchstart', (e) => {
                e.preventDefault(); e.stopPropagation();
                startResize(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: false });
        });

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            // Bloquer la propagation vers le drag pour tous les éléments interactifs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
                e.target.classList.contains('ceb-tile') ||
                e.target.classList.contains('ceb-op-btn') ||
                e.target.classList.contains('ceb-lvl-btn') ||
                e.target.classList.contains('ceb-btn') ||
                e.target.classList.contains('step-del')) {
                e.stopPropagation();
                return;
            }
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus();
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        widget.addEventListener('mousedown',   _onWidgetDown);
        widget.addEventListener('pointerdown', _onWidgetDown);

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            setLevel('facile');
            applyScale();
            // Le widget s'ouvre à 100px du bord gauche du board.
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));

        widget._setLevel = setLevel;
        if (typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            if (type === 'compte-est-bon') return window.createCompteEstBonWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'compte-est-bon') return window.createCompteEstBonWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }

})();
