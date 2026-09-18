// =========================================================================
// WIDGET NOMBRES EN CHIFFRES / LETTRES — Le Bureau du Prof
// Le professeur tape un nombre (en chiffres ou en lettres) et l'élève doit
// cliquer sur les étiquettes pour former ce nombre dans l'autre écriture.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    // ── Fonction utilitaire mini-barre collapse (partagée, injectée une seule fois) ──
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

    // ── CSS boutons fenêtre (partagé, injecté une seule fois) ──────────────
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

    // ── CSS propre au widget ────────────────────────────────────────────────
    if (!document.getElementById('widget-ncl-style')) {
        const s = document.createElement('style');
        s.id = 'widget-ncl-style';
        s.textContent = `
        .widget[data-type="nombres-chiffres-lettres"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .ncl-container {
            --ncl-s: 1;
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: calc(16px * var(--ncl-s));
            padding: calc(14px * var(--ncl-s)) calc(16px * var(--ncl-s)) calc(12px * var(--ncl-s));
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: calc(10px * var(--ncl-s));
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow-y: auto;
            overflow-x: hidden;
            width: 720px;
        }
        .ncl-container input, .ncl-container select, .ncl-container textarea {
            user-select: text;
            -webkit-user-select: text;
        }

        .ncl-container.wf-minimized > *:not(.ncl-header) { display: none !important; }
        .ncl-container.wf-minimized { gap: 0; }

        .ncl-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding-left: 40px !important;
        }

        .ncl-header {
            display: flex; align-items: center; justify-content: space-between;
            gap: calc(8px * var(--ncl-s)); cursor: move; user-select: none;
        }
        .ncl-title {
            font-size: calc(13px * var(--ncl-s)); font-weight: 800; color: #374151;
            letter-spacing: 0.3px; pointer-events: none; white-space: nowrap;
        }
        .ncl-mode-badge {
            font-size: calc(10px * var(--ncl-s)); font-weight: 700;
            padding: calc(2px * var(--ncl-s)) calc(8px * var(--ncl-s));
            border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px;
            white-space: nowrap; background: #dbeafe; color: #1d4ed8;
        }
        .ncl-mode-badge.l2c { background: #ffedd5; color: #9a3412; }

        .ncl-controls {
            display: flex; gap: calc(6px * var(--ncl-s)); flex-wrap: wrap; align-items: center;
        }
        .ncl-mode-btns { display: flex; gap: calc(4px * var(--ncl-s)); }
        .ncl-mode-btn {
            padding: calc(2px * var(--ncl-s)) calc(10px * var(--ncl-s));
            border-radius: calc(8px * var(--ncl-s)); border: 1px solid #ddd; background: #f5f5f5;
            font-size: calc(7px * var(--ncl-s)); font-weight: 700; cursor: pointer;
            color: #666; transition: background .15s; white-space: nowrap;
        }
        .ncl-mode-btn:hover { background: #e0e0e0; }
        .ncl-mode-btn.active-c2l { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
        .ncl-mode-btn.active-l2c { background: #ffedd5; color: #9a3412; border-color: #fdba74; }

        .ncl-btn {
            padding: calc(2px * var(--ncl-s)) calc(12px * var(--ncl-s));
            border-radius: calc(8px * var(--ncl-s)); border: none;
            font-size: calc(8px * var(--ncl-s)); font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s; white-space: nowrap;
            background: #f0f0f0; color: #333; border: 1px solid #ddd;
        }
        .ncl-btn:hover { background: #e0e0e0; }
        .ncl-btn:active { transform: scale(0.96); }
        .ncl-btn-new { background: #4a90e2; color: white; border: none; margin-left: auto; }
        .ncl-btn-new:hover { background: #357abd; }
        .ncl-btn-validate { background: #16a34a; color: white; border: none; }
        .ncl-btn-validate:hover { background: #128a3e; }
        .ncl-btn-solution { background: #f0f0f0; color: #333; }

        .ncl-target-zone {
            display: flex; align-items: center; justify-content: center; gap: calc(10px * var(--ncl-s));
            padding: 2px 10px; background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: calc(10px * var(--ncl-s)); flex-wrap: wrap; text-align: center;
        }
        .ncl-target-label { font-size: calc(12px * var(--ncl-s)); color: #888; font-weight: 600; white-space: nowrap; }
        .ncl-target-input {
            font-size: calc(28px * var(--ncl-s)); font-weight: 900; color: #dc3545;
            line-height: 1.25; text-align: center; background: transparent;
            border: none; border-bottom: calc(2px * var(--ncl-s)) dashed #d1d5db;
            outline: none; min-width: calc(160px * var(--ncl-s)); width: 100%; max-width: 100%;
            font-family: 'Segoe UI', system-ui, sans-serif; padding: calc(2px * var(--ncl-s)) calc(4px * var(--ncl-s));
            resize: none; overflow: hidden; white-space: pre-wrap; word-break: break-word;
            box-sizing: border-box; display: block;
        }
        .ncl-target-input::placeholder { color: #bbb; font-weight: 700; font-size: calc(10px * var(--ncl-s)); }
        .ncl-target-input:focus { border-bottom-color: #4a90e2; }
        .ncl-target-input.invalid { border-bottom-color: #dc3545; color: #b91c1c; }

        .ncl-consigne { font-size: calc(8px * var(--ncl-s)); color: #888; font-style: italic; }

        .ncl-palette-zone {
            display: flex; flex-direction: column; gap: calc(6px * var(--ncl-s));
            padding: calc(10px * var(--ncl-s)); background: #f8f9fa;
            border: 1px solid #e5e7eb; border-radius: calc(10px * var(--ncl-s));
        }
        .ncl-palette-row {
            display: flex; flex-wrap: wrap; gap: calc(6px * var(--ncl-s)); align-items: center; justify-content: center;
        }
        .ncl-tile {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: calc(38px * var(--ncl-s)); height: calc(25px * var(--ncl-s));
            padding: 0 calc(8px * var(--ncl-s)); border-radius: calc(8px * var(--ncl-s));
            font-size: calc(12px * var(--ncl-s)); font-weight: 700; cursor: grab;
            border: calc(1.5px * var(--ncl-s)) solid #d1d5db; background: white; color: #1e3a5f;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08); transition: background .12s, border-color .12s, transform .1s;
            user-select: none; touch-action: none;
        }
        .ncl-tile:hover { border-color: #4a90e2; background: #eff6ff; }
        .ncl-tile:active { cursor: grabbing; transform: scale(0.95); }
        .ncl-tile.word-tile {
            flex-direction: column; height: auto;
            min-height: calc(23px * var(--ncl-s));
            padding: calc(1px * var(--ncl-s)) calc(8px * var(--ncl-s));
            line-height: 1.05; gap: 0;
        }
        .ncl-tile-word { pointer-events: none; }
        .ncl-tile-num {
            font-size: calc(8px * var(--ncl-s)); font-weight: 600; opacity: 0.6;
            pointer-events: none;
        }
        .ncl-tile.digit-tile {
            min-width: calc(38px * var(--ncl-s)); font-size: calc(17px * var(--ncl-s));
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }
        /* Couleurs pastel par ligne, pour mieux différencier les familles d'étiquettes */
        .ncl-tile-row0 { background: #dbeafe; border-color: #93c5fd; color: #1e40af; } /* un..neuf : bleu */
        .ncl-tile-row0:hover { background: #bfdbfe; border-color: #60a5fa; }
        .ncl-tile-row1 { background: #d1fae5; border-color: #6ee7b7; color: #065f46; } /* dix..seize : vert */
        .ncl-tile-row1:hover { background: #a7f3d0; border-color: #34d399; }
        .ncl-tile-row2 { background: #ede9fe; border-color: #c4b5fd; color: #5b21b6; } /* vingt..soixante : violet */
        .ncl-tile-row2:hover { background: #ddd6fe; border-color: #a78bfa; }
        .ncl-tile-row3 { background: #ffedd5; border-color: #fdba74; color: #9a3412; } /* cent..milliards, et : orange */
        .ncl-tile-row3:hover { background: #fed7aa; border-color: #fb923c; }
        .ncl-answer-host { display: flex; flex-direction: column; gap: calc(6px * var(--ncl-s)); }
        .ncl-answer-label { font-size: calc(11px * var(--ncl-s)); color: #888; font-weight: 700; }
        .ncl-answer-zone {
            display: flex; flex-wrap: wrap; align-items: center; gap: calc(4px * var(--ncl-s));
            min-height: calc(52px * var(--ncl-s)); padding: calc(3px * var(--ncl-s)) calc(10px * var(--ncl-s));
            background: #fffdf5; border: calc(2px * var(--ncl-s)) dashed #e5c97a;
            border-radius: calc(10px * var(--ncl-s));
        }
        .ncl-answer-zone.digits-mode {
            flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; justify-content: flex-start;
            padding-left: calc(20px * var(--ncl-s));
        }

        .ncl-answer-empty { font-size: calc(11px * var(--ncl-s)); color: #bbb; font-style: italic; }
        .ncl-answer-tile {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: calc(38px * var(--ncl-s)); height: calc(30px * var(--ncl-s));
            padding: 0 calc(9px * var(--ncl-s)); border-radius: calc(8px * var(--ncl-s));
            font-size: calc(13px * var(--ncl-s)); font-weight: 700; cursor: pointer;
            border: calc(1.5px * var(--ncl-s)) solid #f9a8d4; background: #fce7f3; color: #9d174d;
            flex-shrink: 0;
        }
        .ncl-answer-tile:hover { background: #fee2e2; border-color: #dc3545; color: #dc3545; }
        .ncl-answer-tile.ncl-answer-tile-wrong {
            background: #fee2e2 !important;
            border-color: #dc3545 !important;
            color: #dc3545 !important;
            box-shadow: 0 0 0 calc(3px * var(--ncl-s)) rgba(220,53,69,0.28);
            animation: nclWrongShake .4s ease;
        }
        @keyframes nclWrongShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
        }
        .ncl-answer-tile.digit-tile {
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; font-size: calc(16px * var(--ncl-s));
            min-width: calc(30px * var(--ncl-s)); padding: 0 calc(5px * var(--ncl-s));
        }
        .ncl-answer-sep { color: #d4a017; font-weight: 900; font-size: calc(14px * var(--ncl-s)); flex-shrink: 0; }
        .ncl-answer-groupsep { display: inline-block; width: calc(10px * var(--ncl-s)); flex-shrink: 0; }

        @keyframes nclTileSlideIn {
            0%   { opacity: 0; transform: translateY(-22px) scale(0.7) rotate(-6deg); }
            60%  { opacity: 1; transform: translateY(3px) scale(1.08) rotate(2deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        .ncl-anim-in { animation: nclTileSlideIn 0.4s cubic-bezier(.25,.8,.35,1) both; }

        .ncl-result-zone {
            display: flex; align-items: center; justify-content: center; gap: calc(10px * var(--ncl-s));
            min-height: calc(30px * var(--ncl-s)); flex-wrap: wrap; text-align: center;
        }
        .ncl-result-text { font-size: calc(15px * var(--ncl-s)); font-weight: 800; opacity: 0; transition: opacity .3s; }
        .ncl-result-text.show { opacity: 1; }
        .ncl-result-text.exact { color: #16a34a; }
        .ncl-result-text.faux  { color: #dc3545; }

        /* ── Overlay de félicitations (par-dessus les étiquettes, qui se floutent) ── */
        .ncl-tiles-wrap { position: relative; }
        .ncl-tiles-wrap > .ncl-answer-host,
        .ncl-tiles-wrap > .ncl-palette-zone {
            transition: filter .35s ease;
        }
        .ncl-tiles-wrap.ncl-success-active > .ncl-answer-host,
        .ncl-tiles-wrap.ncl-success-active > .ncl-palette-zone {
            filter: blur(6px);
            pointer-events: none;
        }
        .ncl-success-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: calc(8px * var(--ncl-s));
            opacity: 0;
            transform: scale(0.85);
            pointer-events: none;
            transition: opacity .35s ease, transform .35s ease;
            z-index: 6;
        }
        .ncl-success-overlay.show {
            opacity: 1;
            transform: scale(1);
        }
        .ncl-success-emoji {
            font-size: calc(46px * var(--ncl-s));
            line-height: 1;
            filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18));
        }
        .ncl-success-msg {
            font-size: calc(26px * var(--ncl-s));
            font-weight: 900;
            color: #16a34a;
            background: rgba(255,255,255,0.92);
            padding: calc(8px * var(--ncl-s)) calc(22px * var(--ncl-s));
            border-radius: calc(14px * var(--ncl-s));
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            text-align: center;
            white-space: nowrap;
        }

        .ncl-help-btn {
            width: calc(18px * var(--ncl-s)); height: calc(18px * var(--ncl-s)); border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5; color: #666; font-size: calc(12px * var(--ncl-s));
            font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: background .15s;
        }
        .ncl-help-btn:hover { background: #e0e0e0; color: #333; }

        .ncl-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: #fff;
            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 300px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .ncl-help-popup.show { display: block; }
        .ncl-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .ncl-help-popup .help-mode { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .ncl-help-popup .help-mode:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .help-badge-ncl {
            display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 6px;
            border-radius: 10px; margin-right: 4px; vertical-align: middle;
        }
        .help-badge-ncl.c2l { background: #dbeafe; color: #1d4ed8; }
        .help-badge-ncl.l2c { background: #ffedd5; color: #9a3412; }

        .ncl-rh { position: absolute; z-index: 20; opacity: 0; transition: opacity .2s; }
        .widget[data-type="nombres-chiffres-lettres"]:hover .ncl-rh { opacity: 1; }
        .ncl-rh-se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%); border-radius: 0 0 14px 0; }
        .ncl-rh-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: sw-resize;
            background: linear-gradient(225deg, transparent 50%, #aaa 50%); border-radius: 0 0 0 14px; }
        .ncl-rh-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: ne-resize;
            background: linear-gradient(45deg, transparent 50%, #aaa 50%); border-radius: 0 14px 0 0; }
        .ncl-rh-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nw-resize;
            background: linear-gradient(315deg, transparent 50%, #aaa 50%); border-radius: 14px 0 0 0; }
        .ncl-rh-n  { top: 0; left: 14px; right: 14px; height: 5px; cursor: n-resize; background: transparent; }
        .ncl-rh-s  { bottom: 0; left: 14px; right: 14px; height: 5px; cursor: s-resize; background: transparent; }
        .ncl-rh-e  { top: 14px; bottom: 14px; right: 0; width: 5px; cursor: e-resize; background: transparent; }
        .ncl-rh-w  { top: 14px; bottom: 14px; left: 0; width: 5px; cursor: w-resize; background: transparent; }
        .ncl-rh-n:hover, .ncl-rh-s:hover { background: rgba(74,144,226,0.18); }
        .ncl-rh-e:hover, .ncl-rh-w:hover { background: rgba(74,144,226,0.18); }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // MOTEUR DE CONVERSION NOMBRE <-> LETTRES (français, sans "et")
    // =========================================================================
    const WORD_TILE_ROWS = [
        ['un','deux','trois','quatre','cinq','six','sept','huit','neuf'],
        ['dix','onze','douze','treize','quatorze','quinze','seize'],
        ['vingt','vingts','trente','quarante','cinquante','soixante'],
        ['cent','cents','mille','million','millions','milliard','milliards','et']
    ];
    const DIGIT_TILES = ['0','1','2','3','4','5','6','7','8','9'];
    // Disposition façon cadran de téléphone : 1-2-3 / 4-5-6 / 7-8-9 / 0
    const DIGIT_KEYPAD_ROWS = [
        ['1','2','3'],
        ['4','5','6'],
        ['7','8','9'],
        ['0']
    ];

    // Valeur numérique affichée sous chaque étiquette-mot (entre parenthèses)
    const WORD_TILE_VALUES = {
        un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
        dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
        vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
        cent: 100, cents: 100, mille: 1000,
        million: 1000000, millions: 1000000,
        milliard: 1000000000, milliards: 1000000000
        // "et" n'a pas de valeur numérique propre
    };

    const NCL_UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const NCL_TEENS = { 10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze', 16: 'seize' };
    const NCL_TENS  = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

    function nclTwoDigits(n, isLast) {
        n = Math.round(n);
        if (n <= 0) return [];
        if (n < 10) return [NCL_UNITS[n]];
        if (NCL_TEENS[n]) return [NCL_TEENS[n]];
        if (n < 20) return ['dix', NCL_UNITS[n - 10]];
        const t = Math.floor(n / 10), u = n % 10;
        if (t === 7) {
            if (u === 1) return ['soixante', 'et', 'onze']; // 71 = soixante et onze
            return ['soixante', ...nclTwoDigits(10 + u, isLast)];
        }
        if (t === 8) {
            if (u === 0) return isLast ? ['quatre', 'vingts'] : ['quatre', 'vingt'];
            return ['quatre', 'vingt', ...nclTwoDigits(u, isLast)]; // pas de "et" (81, 91)
        }
        if (t === 9) return ['quatre', 'vingt', ...nclTwoDigits(10 + u, isLast)];
        const tensWord = NCL_TENS[t];
        if (u === 0) return [tensWord];
        if (u === 1) return [tensWord, 'et', 'un']; // 21,31,41,51,61 = vingt et un, trente et un...
        return [tensWord, ...nclTwoDigits(u, isLast)];
    }

    function nclThreeDigits(n, isLast) {
        n = Math.round(n);
        if (n <= 0) return [];
        const h = Math.floor(n / 100), rest = n % 100;
        let tokens = [];
        if (h > 0) {
            if (h === 1) {
                tokens.push('cent');
            } else {
                tokens.push(NCL_UNITS[h]);
                tokens.push(rest === 0 ? (isLast ? 'cents' : 'cent') : 'cent');
            }
        }
        tokens = tokens.concat(nclTwoDigits(rest, isLast));
        return tokens;
    }

    // Convertit un entier positif en tableau d'étiquettes-mots (1 à 999 999 999 999)
    function nclNumberToTokens(n) {
        n = Math.round(n);
        if (!isFinite(n) || n <= 0 || n > 999999999999) return null;
        const milliard = Math.floor(n / 1e9);
        const million  = Math.floor((n % 1e9) / 1e6);
        const mille    = Math.floor((n % 1e6) / 1e3);
        const unit     = n % 1000;
        let tokens = [];
        if (milliard > 0) {
            tokens = tokens.concat(nclThreeDigits(milliard, false));
            tokens.push(milliard === 1 ? 'milliard' : 'milliards');
        }
        if (million > 0) {
            tokens = tokens.concat(nclThreeDigits(million, false));
            tokens.push(million === 1 ? 'million' : 'millions');
        }
        if (mille > 0) {
            if (mille === 1) {
                tokens.push('mille');
            } else {
                tokens = tokens.concat(nclThreeDigits(mille, false));
                tokens.push('mille');
            }
        }
        if (unit > 0) tokens = tokens.concat(nclThreeDigits(unit, true));
        return tokens;
    }

    const NCL_UNIT_VAL = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9 };
    const NCL_TEEN_VAL = { dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16 };
    const NCL_TENS_VAL = { vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60 };

    function nclParseUpTo99(tokens, i) {
        const w = tokens[i];
        if (w === undefined) return [0, i];
        if (w === 'quatre' && (tokens[i + 1] === 'vingt' || tokens[i + 1] === 'vingts')) {
            i += 2;
            if (tokens[i] === 'dix' || NCL_TEEN_VAL[tokens[i]] !== undefined) {
                const [sub, j] = nclParseUpTo99(tokens, i);
                return [80 + sub, j];
            }
            if (NCL_UNIT_VAL[tokens[i]]) return [80 + NCL_UNIT_VAL[tokens[i]], i + 1];
            return [80, i];
        }
        if (w === 'soixante') {
            i += 1;
            if (tokens[i] === 'dix' || NCL_TEEN_VAL[tokens[i]] !== undefined) {
                const [sub, j] = nclParseUpTo99(tokens, i);
                return [60 + sub, j];
            }
            if (NCL_UNIT_VAL[tokens[i]]) return [60 + NCL_UNIT_VAL[tokens[i]], i + 1];
            return [60, i];
        }
        if (NCL_TENS_VAL[w] !== undefined) {
            const base = NCL_TENS_VAL[w];
            i += 1;
            if (NCL_UNIT_VAL[tokens[i]]) return [base + NCL_UNIT_VAL[tokens[i]], i + 1];
            return [base, i];
        }
        if (w === 'dix') {
            i += 1;
            if (NCL_UNIT_VAL[tokens[i]] && NCL_UNIT_VAL[tokens[i]] >= 7) return [10 + NCL_UNIT_VAL[tokens[i]], i + 1];
            return [10, i];
        }
        if (NCL_TEEN_VAL[w] !== undefined) return [NCL_TEEN_VAL[w], i + 1];
        if (NCL_UNIT_VAL[w] !== undefined) return [NCL_UNIT_VAL[w], i + 1];
        return [0, i];
    }

    function nclParseHundredGroup(tokens, i) {
        let hundred = 0;
        if (NCL_UNIT_VAL[tokens[i]] && (tokens[i + 1] === 'cent' || tokens[i + 1] === 'cents')) {
            hundred = NCL_UNIT_VAL[tokens[i]]; i += 2;
        } else if (tokens[i] === 'cent' || tokens[i] === 'cents') {
            hundred = 1; i += 1;
        }
        if (hundred > 0) {
            const [rest, j] = nclParseUpTo99(tokens, i);
            return [hundred * 100 + rest, j];
        }
        return nclParseUpTo99(tokens, i);
    }

    // Convertit un texte libre en lettres vers l'entier correspondant (ou null si invalide)
    function nclParseWordsToNumber(text) {
        if (!text) return null;
        const norm = text.toLowerCase().trim().replace(/[’']/g, ' ').replace(/[-\s]+/g, ' ')
            .split(' ').filter(w => w && w !== 'et');
        if (norm.length === 0) return null;
        let i = 0, total = 0, v, j;
        [v, j] = nclParseHundredGroup(norm, i);
        if (norm[j] === 'milliard' || norm[j] === 'milliards') {
            total += (v === 0 ? 1 : v) * 1e9; i = j + 1;
            [v, j] = nclParseHundredGroup(norm, i);
        }
        if (norm[j] === 'million' || norm[j] === 'millions') {
            total += (v === 0 ? 1 : v) * 1e6; i = j + 1;
            [v, j] = nclParseHundredGroup(norm, i);
        }
        if (norm[j] === 'mille') {
            total += (v === 0 ? 1 : v) * 1e3; i = j + 1;
            [v, j] = nclParseHundredGroup(norm, i);
        }
        total += v; i = j;
        if (i < norm.length) return null;
        if (total <= 0) return null;
        return total;
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================

    // Renvoie l'ensemble des indices de `student` qui font partie de la plus longue
    // sous-séquence commune avec `expected` (ordre respecté, mais pas forcément la
    // même position). Permet de ne signaler comme fausses que les étiquettes vraiment
    // fautives, sans faire "décaler" et marquer en rouge toutes celles qui suivent
    // une étiquette en trop ou manquante.
    function nclLCSMatchedIndices(student, expected) {
        const n = student.length, m = expected.length;
        const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = student[i] === expected[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
        const matched = new Set();
        let i = 0, j = 0;
        while (i < n && j < m) {
            if (student[i] === expected[j] && dp[i][j] === dp[i + 1][j + 1] + 1) {
                matched.add(i); i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                i++;
            } else {
                j++;
            }
        }
        return matched;
    }

    window.createNombresLettresWidget = function (savedData) {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = findFreePosition();
        // Ouvre le widget près des onglets à gauche plutôt qu'à la position par défaut
        // (qui peut être loin à droite selon le nombre de widgets déjà présents).
        const initialLeft = Math.min(pos.x, 100);

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'nombres-chiffres-lettres';
        widget.dataset.transparent = 'true';
        widget.style.cssText = `left:${initialLeft}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
        container.className = 'ncl-container';

        container.innerHTML = `
            <div class="ncl-header">
                <span class="ncl-title">🔤 Nombres en Chiffres/Lettres</span>
                <span class="ncl-mode-badge c2l">Chiffres → Lettres</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="ncl-help-btn" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="ncl-controls">
                <div class="ncl-mode-btns">
                    <button class="ncl-mode-btn active-c2l" data-mode="c2l">🔢➜🔤 Chiffres → Lettres</button>
                    <button class="ncl-mode-btn" data-mode="l2c">🔤➜🔢 Lettres → Chiffres</button>
                </div>
                <button class="ncl-btn ncl-btn-clear">🗑 Effacer réponse</button>
                <button class="ncl-btn ncl-btn-new">🔄 Nouveau</button>
            </div>

            <div class="ncl-target-zone">
                <label class="ncl-target-label">Nombre proposé :</label>
                <textarea class="ncl-target-input" rows="1" inputmode="numeric" autocomplete="off" placeholder="Tape un nombre, ex : 123"></textarea>
            </div>

       

            <div class="ncl-tiles-wrap">
                <div class="ncl-answer-host">
                    <div class="ncl-answer-zone"><span class="ncl-answer-empty">Clique sur les étiquettes…</span></div>
                </div>

                <div class="ncl-palette-zone"></div>

                <div class="ncl-success-overlay">
                    <span class="ncl-success-emoji">🎉</span>
                    <span class="ncl-success-msg">Bravo, c'est exact !</span>
                </div>
            </div>

            <div class="ncl-result-zone">
                <button class="ncl-btn ncl-btn-validate">✓ Valider</button>
                <button class="ncl-btn ncl-btn-solution">👁 Voir la solution</button>
                <span class="ncl-result-text"></span>
            </div>

            <div class="ncl-help-popup">
                <h4>💡 Comment ça marche ?</h4>
                <div class="help-mode">
                    <span class="help-badge-ncl c2l">🔢➜🔤 Chiffres → Lettres</span><br>
                    Le professeur tape un nombre en chiffres.<br>
                    L'élève clique sur les étiquettes-mots pour l'écrire en lettres, séparées par des traits d'union.
                </div>
                <div class="help-mode">
                    <span class="help-badge-ncl l2c">🔤➜🔢 Lettres → Chiffres</span><br>
                    Le professeur tape un nombre en lettres (ex : cent vingt-trois).<br>
                    L'élève clique sur les étiquettes-chiffres pour former ce nombre.
                </div>
                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:10px;color:#888">
                    Astuce : clique sur une étiquette de ta réponse pour la retirer.
                </div>
            </div>
        `;

        widget.appendChild(container);

        // ── Poignées de redimensionnement (enfants du widget, PAS du conteneur
        //    scrollable, pour ne jamais être masquées par la barre de défilement) ──
        const rhDirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        rhDirs.forEach(dir => {
            const rh = document.createElement('div');
            rh.className = 'ncl-rh ncl-rh-' + dir;
            rh.dataset.dir = dir;
            widget.appendChild(rh);
        });

        // ── Références ─────────────────────────────────────────────────────
        const modeBadge    = container.querySelector('.ncl-mode-badge');
        const modeBtns     = container.querySelectorAll('.ncl-mode-btn');
        const clearBtn      = container.querySelector('.ncl-btn-clear');
        const newBtn         = container.querySelector('.ncl-btn-new');
        const inputEl       = container.querySelector('.ncl-target-input');
        const consigneEl    = container.querySelector('.ncl-consigne');
        const paletteZone   = container.querySelector('.ncl-palette-zone');
        const answerZone    = container.querySelector('.ncl-answer-zone');
        const validateBtn   = container.querySelector('.ncl-btn-validate');
        const solutionBtn   = container.querySelector('.ncl-btn-solution');
        const resultText    = container.querySelector('.ncl-result-text');
        const helpBtn       = container.querySelector('.ncl-help-btn');
        const helpPopup      = container.querySelector('.ncl-help-popup');
        const tilesWrap        = container.querySelector('.ncl-tiles-wrap');
        const successOverlay   = container.querySelector('.ncl-success-overlay');

        function hideSuccessOverlay() {
            successOverlay.classList.remove('show');
            tilesWrap.classList.remove('ncl-success-active');
        }
        function showSuccessOverlay() {
            successOverlay.classList.add('show');
            tilesWrap.classList.add('ncl-success-active');
        }
        function clearWrongTiles() {
            answerZone.querySelectorAll('.ncl-answer-tile-wrong').forEach(el => el.classList.remove('ncl-answer-tile-wrong'));
        }
        // Surligne, parmi les étiquettes déposées, celles qui ne correspondent pas
        // à la bonne étiquette attendue à cette position (mauvaise étiquette ou
        // étiquette en trop).
        function highlightWrongTiles() {
            const expected = currentMode === 'c2l' ? (targetTokens || []) : (targetDigits ? targetDigits.split('') : []);
            const matched = nclLCSMatchedIndices(studentTiles, expected);
            const tileEls = answerZone.querySelectorAll('.ncl-answer-tile');
            tileEls.forEach((el, i) => {
                if (!matched.has(i)) {
                    el.classList.add('ncl-answer-tile-wrong');
                }
            });
        }

        // ── État interne ───────────────────────────────────────────────────
        let currentMode = 'c2l';          // 'c2l' (chiffres->lettres) | 'l2c' (lettres->chiffres)
        let targetTokens = null;          // tableau d'étiquettes attendues (mode c2l)
        let targetDigits = null;          // chaîne de chiffres attendue (mode l2c)
        let studentTiles = [];            // étiquettes placées par l'élève (dans l'ordre)
        let insertCursor = null;          // position où insérer la prochaine étiquette (null = à la fin)
        let targetTooLong = false;        // true si le nombre tapé dépasse 12 chiffres

        // ── Scale proportionnel ───────────────────────────────────────────
        const BASE_W = 720;
        function applyScale() {
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--ncl-s', sc.toFixed(4));
            autoGrowTarget();
        }

        // ── Rendu palette ──────────────────────────────────────────────────
        function renderPalette() {
            paletteZone.innerHTML = '';
            if (currentMode === 'c2l') {
                WORD_TILE_ROWS.forEach((row, rowIdx) => {
                    const rowEl = document.createElement('div');
                    rowEl.className = 'ncl-palette-row';
                    row.forEach(val => {
                        const el = document.createElement('div');
                        el.className = 'ncl-tile ncl-tile-row' + rowIdx + ' word-tile';
                        el.dataset.value = val;
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'ncl-tile-word';
                        wordSpan.textContent = val;
                        el.appendChild(wordSpan);
                        const num = WORD_TILE_VALUES[val];
                        if (num !== undefined) {
                            const numSpan = document.createElement('span');
                            numSpan.className = 'ncl-tile-num';
                            numSpan.textContent = '(' + num.toLocaleString('fr-FR') + ')';
                            el.appendChild(numSpan);
                        }
                        attachDragBehavior(el, val);
                        rowEl.appendChild(el);
                    });
                    paletteZone.appendChild(rowEl);
                });
            } else {
                DIGIT_KEYPAD_ROWS.forEach(row => {
                    const rowEl = document.createElement('div');
                    rowEl.className = 'ncl-palette-row';
                    row.forEach(val => {
                        const el = document.createElement('div');
                        el.className = 'ncl-tile digit-tile';
                        el.textContent = val;
                        el.dataset.value = val;
                        attachDragBehavior(el, val);
                        rowEl.appendChild(el);
                    });
                    paletteZone.appendChild(rowEl);
                });
            }
        }

        // ── Clic sur une étiquette : l'ajoute à la réponse ──────────────────
        function attachDragBehavior(el, value) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); e.preventDefault();
                addTileToAnswer(value);
            });
        }

        function addTileToAnswer(value) {
            if (insertCursor !== null && insertCursor >= 0 && insertCursor <= studentTiles.length) {
                studentTiles.splice(insertCursor, 0, value);
                insertCursor = null; // une étiquette comble le trou, on repasse en mode "ajout à la fin"
            } else {
                studentTiles.push(value);
            }
            renderAnswer();
            if (typeof saveBoard === 'function') saveBoard();
        }

        function renderAnswer(animate) {
            answerZone.classList.toggle('digits-mode', currentMode === 'l2c');
            answerZone.innerHTML = '';
            if (studentTiles.length === 0) {
                const empty = document.createElement('span');
                empty.className = 'ncl-answer-empty';
                empty.textContent = 'Dépose ici les étiquettes…';
                answerZone.appendChild(empty);
                return;
            }
            studentTiles.forEach((val, idx) => {
                if (idx > 0 && currentMode === 'c2l') {
                    const sep = document.createElement('span');
                    sep.className = 'ncl-answer-sep';
                    sep.textContent = '-';
                    if (animate) { sep.classList.add('ncl-anim-in'); sep.style.animationDelay = (idx * 90) + 'ms'; }
                    answerZone.appendChild(sep);
                }
                const el = document.createElement('div');
                el.className = 'ncl-answer-tile' + (currentMode === 'l2c' ? ' digit-tile' : '');
                el.textContent = val;
                el.title = 'Cliquer pour retirer';
                if (animate) { el.classList.add('ncl-anim-in'); el.style.animationDelay = (idx * 90) + 'ms'; }
                el.addEventListener('pointerdown', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    studentTiles.splice(idx, 1);
                    insertCursor = idx;
                    renderAnswer();
                    if (typeof saveBoard === 'function') saveBoard();
                });
                answerZone.appendChild(el);
                // Mode lettres → chiffres : espace entre les classes (milliers), calculé
                // depuis la fin de la suite (comme un séparateur de milliers classique)
                if (currentMode === 'l2c') {
                    const fromEnd = studentTiles.length - idx - 1;
                    if (fromEnd > 0 && fromEnd % 3 === 0) {
                        const groupSep = document.createElement('span');
                        groupSep.className = 'ncl-answer-groupsep';
                        if (animate) { groupSep.classList.add('ncl-anim-in'); groupSep.style.animationDelay = (idx * 90) + 'ms'; }
                        answerZone.appendChild(groupSep);
                    }
                }
            });
        }

        // ── Calcul de la cible à partir de la saisie du professeur ─────────
        function autoGrowTarget() {
            inputEl.style.height = 'auto';
            inputEl.style.height = inputEl.scrollHeight + 'px';
        }
        function updateTarget() {
            autoGrowTarget();
            const raw = inputEl.value;
            resultText.classList.remove('show', 'exact', 'faux');
            resultText.textContent = '';
            hideSuccessOverlay();
            inputEl.classList.remove('invalid');
            targetTooLong = false;
            if (currentMode === 'c2l') {
                const cleaned = raw.replace(/\s+/g, '');
                const n = cleaned === '' ? NaN : parseInt(cleaned, 10);
                if (!cleaned || isNaN(n) || n <= 0 || /[^0-9]/.test(cleaned)) {
                    targetTokens = null;
                    if (cleaned) inputEl.classList.add('invalid');
                    return;
                }
                if (cleaned.length > 12) {
                    targetTokens = null;
                    targetTooLong = true;
                    inputEl.classList.add('invalid');
                    return;
                }
                targetTokens = nclNumberToTokens(n);
                if (!targetTokens) { inputEl.classList.add('invalid'); return; }
            } else {
                if (!raw || !raw.trim()) { targetDigits = null; return; }
                const n = nclParseWordsToNumber(raw);
                if (n === null) { targetDigits = null; inputEl.classList.add('invalid'); return; }
                if (String(n).length > 12) {
                    targetDigits = null;
                    targetTooLong = true;
                    inputEl.classList.add('invalid');
                    return;
                }
                targetDigits = String(n);
            }
        }

        // ── Changement de mode ──────────────────────────────────────────────
        function setMode(mode) {
            currentMode = mode;
            studentTiles = [];
            insertCursor = null;
            inputEl.value = '';
            targetTokens = null; targetDigits = null;
            modeBtns.forEach(b => b.classList.toggle('active-c2l', mode === 'c2l' && b.dataset.mode === 'c2l'));
            modeBtns.forEach(b => b.classList.toggle('active-l2c', mode === 'l2c' && b.dataset.mode === 'l2c'));
            modeBadge.classList.toggle('l2c', mode === 'l2c');
            modeBadge.textContent = mode === 'c2l' ? 'Chiffres → Lettres' : 'Lettres → Chiffres';
            if (mode === 'c2l') {
                inputEl.placeholder = 'Tape un nombre, ex : 123';
                inputEl.inputMode = 'numeric';
                if (consigneEl) consigneEl.textContent = "Clique sur les étiquettes-mots pour former ce nombre en lettres (elles seront séparées par des traits d'union).";
            } else {
                inputEl.placeholder = 'Tape un nombre en lettres, ex : cent vingt-trois';
                inputEl.inputMode = 'text';
                if (consigneEl) consigneEl.textContent = 'Clique sur les étiquettes-chiffres pour former ce nombre.';
            }
            renderPalette();
            renderAnswer();
            updateTarget();
            if (typeof saveBoard === 'function') saveBoard();
        }

        modeBtns.forEach(btn => {
            btn.addEventListener('pointerdown', (e) => e.stopPropagation());
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setMode(btn.dataset.mode);
            });
        });

        inputEl.addEventListener('pointerdown', (e) => e.stopPropagation());
        inputEl.addEventListener('mousedown', (e) => e.stopPropagation());
        inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
        inputEl.addEventListener('input', () => { updateTarget(); if (typeof saveBoard === 'function') saveBoard(); });

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            studentTiles = [];
            insertCursor = null;
            renderAnswer();
            resultText.classList.remove('show', 'exact', 'faux');
            hideSuccessOverlay();
            if (typeof saveBoard === 'function') saveBoard();
        });

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            inputEl.value = '';
            studentTiles = [];
            insertCursor = null;
            targetTokens = null; targetDigits = null;
            renderAnswer();
            updateTarget();
            resultText.classList.remove('show', 'exact', 'faux');
            hideSuccessOverlay();
            inputEl.focus();
            if (typeof saveBoard === 'function') saveBoard();
        });

        validateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let ok = false;
            if (currentMode === 'c2l') {
                ok = targetTokens !== null && studentTiles.join('-') === targetTokens.join('-');
            } else {
                ok = targetDigits !== null && studentTiles.join('') === targetDigits;
            }
            resultText.classList.remove('exact', 'faux');
            hideSuccessOverlay();
            clearWrongTiles();
            if (targetTooLong) {
                resultText.textContent = '⚠️ Nombre limité à 12 chiffres maximum.';
                resultText.classList.add('faux');
                resultText.classList.add('show');
            } else if (targetTokens === null && targetDigits === null) {
                resultText.textContent = '⚠️ Le professeur doit d\'abord taper un nombre.';
                resultText.classList.add('faux');
                resultText.classList.add('show');
            } else if (ok) {
                resultText.textContent = '';
                showSuccessOverlay();
            } else {
                resultText.textContent = '❌ Ce n\'est pas encore ça, réessaie.';
                resultText.classList.add('faux');
                resultText.classList.add('show');
                highlightWrongTiles();
            }
        });

        solutionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resultText.classList.remove('exact', 'faux');
            hideSuccessOverlay();
            let solutionTiles = null;
            if (currentMode === 'c2l' && targetTokens) {
                solutionTiles = targetTokens.slice();
            } else if (currentMode === 'l2c' && targetDigits) {
                solutionTiles = targetDigits.split('');
            }
            if (!solutionTiles) {
                resultText.textContent = targetTooLong
                    ? '⚠️ Nombre limité à 12 chiffres maximum.'
                    : '⚠️ Le professeur doit d\'abord taper un nombre.';
                resultText.classList.add('show');
                return;
            }
            studentTiles = solutionTiles;
            insertCursor = null;
            renderAnswer(true);
            resultText.textContent = '💡 Voici la solution !';
            resultText.classList.add('show');
            if (typeof saveBoard === 'function') saveBoard();
        });

        helpBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        });

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _isMax = false, _savedW = null;

        if (wfMin) {
            wfMin.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMax) wfMax.click();
                window._wfMiniBarCollapse(widget, '🔤 Nombres en Chiffres/Lettres');
            });
        }
        if (wfMax) {
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
        widget.querySelectorAll('.ncl-rh[data-dir]').forEach(handle => {
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
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
                e.target.classList.contains('ncl-tile') ||
                e.target.classList.contains('ncl-answer-tile') ||
                e.target.classList.contains('ncl-mode-btn')) {
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

        // ── Restauration éventuelle des données sauvegardées ────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (savedData) {
                currentMode = savedData.mode === 'l2c' ? 'l2c' : 'c2l';
                modeBtns.forEach(b => b.classList.toggle('active-c2l', currentMode === 'c2l' && b.dataset.mode === 'c2l'));
                modeBtns.forEach(b => b.classList.toggle('active-l2c', currentMode === 'l2c' && b.dataset.mode === 'l2c'));
                modeBadge.classList.toggle('l2c', currentMode === 'l2c');
                modeBadge.textContent = currentMode === 'c2l' ? 'Chiffres → Lettres' : 'Lettres → Chiffres';
                if (currentMode === 'c2l') {
                    inputEl.placeholder = 'Tape un nombre, ex : 123';
                    if (consigneEl) consigneEl.textContent = "Clique sur les étiquettes-mots pour former ce nombre en lettres (elles seront séparées par des traits d'union).";
                } else {
                    inputEl.placeholder = 'Tape un nombre en lettres, ex : cent vingt-trois';
                    if (consigneEl) consigneEl.textContent = 'Clique sur les étiquettes-chiffres pour former ce nombre.';
                }
                renderPalette();
                inputEl.value = savedData.profValue || '';
                updateTarget();
                studentTiles = Array.isArray(savedData.studentTiles) ? savedData.studentTiles.slice() : [];
                insertCursor = null;
                renderAnswer();
                if (savedData.fullboard) {
                    _isMax = true;
                    container.classList.add('wf-fullboard');
                } else {
                    if (savedData.containerW) container.style.width  = savedData.containerW + 'px';
                    if (savedData.containerH) container.style.height = savedData.containerH + 'px';
                }
            } else {
                renderPalette();
                renderAnswer();
                updateTarget();
                container.style.width  = '1100px';
                container.style.height = '800px';
            }
            applyScale();
            // Re-clamp après application de la taille définitive (1000x800), car au premier
            // clamp (juste après board.appendChild) le widget avait encore sa petite taille
            // par défaut : il pouvait donc déborder à droite une fois agrandi.
            if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        }));

        // ── Export des données pour la sauvegarde ───────────────────────────
        widget._nclGetData = function () {
            return {
                mode: currentMode,
                profValue: inputEl.value || '',
                studentTiles: studentTiles.slice(),
                containerW: container.classList.contains('wf-fullboard') ? null : container.offsetWidth,
                containerH: container.classList.contains('wf-fullboard') ? null : container.offsetHeight,
                fullboard: container.classList.contains('wf-fullboard')
            };
        };

        if (typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _origNcl = window.createWidget;
    if (typeof _origNcl === 'function') {
        window.createWidget = function (type) {
            if (type === 'nombres-chiffres-lettres') return window.createNombresLettresWidget();
            return _origNcl.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'nombres-chiffres-lettres') return window.createNombresLettresWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }

})();
