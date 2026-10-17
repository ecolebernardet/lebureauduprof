// =========================================================================
// WIDGET PAUSE CALME — Le Bureau du Prof
// Exercice de respiration guidée avec animation de cercle.
// 3 modes : Cohérence Cardiaque / Respiration Carrée / Urgence Calme
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Réutiliser la mini-barre collapse partagée (injectée par widget-monnaie.js ou ici)
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
                e.stopPropagation(); e.preventDefault();
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
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW2 = window.innerWidth;
                    const curVH2 = typeof virtualH === 'function' ? virtualH(curW2) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW2) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH2) * 100;
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

    // CSS boutons fenêtre (partagé, injecté une seule fois)
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

    // Police arrondie (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const f = document.createElement('link');
        f.id = 'wpc-font';
        f.rel = 'stylesheet';
        f.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(f);
    }

    // Taille des pastilles (identique à la calculatrice)
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

    // CSS spécifique au widget pause-calme (style calculatrice)
    if (!document.getElementById('wpc-style-v3')) {
        const s = document.createElement('style');
        s.id = 'wpc-style-v3';
        s.textContent = `
        .widget[data-type="pause-calme"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Fond pastel + reflet, comme la calculatrice ── */
        .wpc-container {
            --wpc-ink:     #14202E;
            --wpc-muted:   rgba(20,32,46,0.6);
            --wpc-line:    rgba(20,32,46,0.12);
            --wpc-glass:   rgba(255,255,255,0.62);
            --wpc-bg:      #7FD6A6;
            --wpc-op:      #23915A;
            --wpc-inhale:  #6AAEF2;
            --wpc-hold:    #F2BE5C;
            --wpc-exhale:  #5CCB98;
            --wpc-idle:    var(--wpc-bg);
            --wpc-deep:    #14202E;
            --wpc-phase:   var(--wpc-idle);

            background-color: var(--wpc-bg);
            background-image:
                radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
                radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
            border-radius: 24px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            color: var(--wpc-ink);
            box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
            position: relative;
            user-select: none;
            overflow: visible;
            width: 420px;
            transition: background-color .3s;
        }
        .widget[data-type="pause-calme"]:hover .wpc-container:not(.wf-fullboard),
        .widget[data-type="pause-calme"]:focus-within .wpc-container:not(.wf-fullboard) {
            outline: 2px dashed rgba(20,32,46,0.35);
            outline-offset: 2px;
        }
        .wpc-container[data-phase="inspire"] { --wpc-phase: var(--wpc-inhale); }
        .wpc-container[data-phase="hold"]    { --wpc-phase: var(--wpc-hold); }
        .wpc-container[data-phase="expire"],
        .wpc-container[data-phase="done"]    { --wpc-phase: var(--wpc-exhale); }

        /* ── Plein écran ── */
        .wpc-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            padding-left: 70px;
        }

        /* ── Téléphone : plein écran à la hauteur réelle de l'écran (la marge gauche laisse les onglets visibles) ── */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .wpc-container.wf-fullboard {
                height: 100dvh !important;
                padding-left: 44px;
            }
        }

        /* ── En-tête : pastilles « verre » ── */
        .wpc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 16px 10px;
            cursor: move;
            flex-shrink: 0;
            position: relative;
            z-index: 10;
        }
        .wpc-title,
        .wpc-tools {
            display: flex;
            align-items: center;
            background: var(--wpc-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            border-radius: 999px;
            box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        }
        .wpc-title {
            gap: 8px;
            padding: 7px 16px 7px 12px;
            font-size: 15px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            min-width: 0;
            pointer-events: none;
        }
        .wpc-title span { overflow: hidden; text-overflow: ellipsis; }
        .wpc-title svg { width: 18px; height: 18px; flex-shrink: 0; }
        .wpc-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; cursor: default; }
        .wpc-tools-slot { display: flex; align-items: center; gap: 2px; }
        .wpc-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

        .wpc-icon-btn {
            width: 32px; height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: none;
            background: transparent;
            color: var(--wpc-ink);
            cursor: pointer;
            padding: 0;
            transition: background .15s;
        }
        .wpc-icon-btn svg { width: 18px; height: 18px; }
        .wpc-icon-btn:hover,
        .wpc-icon-btn.is-on { background: rgba(20,32,46,0.12); }

        /* ── Corps : carte claire autour du cercle ── */
        .wpc-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0 16px;
            padding: 14px 16px 10px;
            min-height: 0;
            border-radius: 22px;
            background: rgba(255,255,255,0.55);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
        }
        .wpc-session-title {
            font-weight: 700;
            color: var(--wpc-ink);
            white-space: nowrap;
            text-align: center;
            line-height: 1.3;
        }
        .wpc-timer {
            font-weight: 600;
            color: var(--wpc-muted);
            white-space: nowrap;
            text-align: center;
            font-variant-numeric: tabular-nums;
            margin-top: 2px;
        }

        /* ── Le cercle de respiration ── */
        .wpc-circle-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px 0 6px;
            /* width/height posés par JS */
        }
        .wpc-ripple,
        .wpc-circle {
            position: absolute;
            width: 78%;
            height: 78%;
            border-radius: 50%;
            transform: scale(0.55);
            will-change: transform;
        }
        .wpc-ripple {
            border: 2px solid var(--wpc-phase);
            opacity: 0.55;
            transition: border-color 1.2s ease;
        }
        .wpc-ripple.r2 { opacity: 0.28; }
        .wpc-circle {
            background-color: var(--wpc-phase);
            background-image:
                radial-gradient(circle at 34% 28%, rgba(255,255,255,0.65), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 80%, rgba(20,32,46,0.14), rgba(20,32,46,0) 60%);
            box-shadow: 0 0 60px -10px var(--wpc-phase), 0 10px 24px -12px rgba(10,20,35,0.45);
            transition: transform 0.5s ease-out, background-color 1.2s ease, box-shadow 1.2s ease;
        }
        .wpc-center {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            color: var(--wpc-deep);
        }
        .wpc-circle-text { font-weight: 700; line-height: 1.1; }
        .wpc-phase-count {
            font-weight: 700;
            opacity: 0.6;
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            min-height: 1.1em;
        }

        /* ── Contrôles ── */
        .wpc-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px 18px;
            padding: 12px 20px 4px;
            flex-shrink: 0;
        }
        .wpc-btn-main {
            font-family: inherit;
            border-radius: 999px;
            border: none;
            font-size: 16px;
            font-weight: 700;
            padding: 11px 32px;
            cursor: pointer;
            background: var(--wpc-op);
            color: #fff;
            box-shadow: 0 3px 0 rgba(10,20,35,0.22);
            transition: transform .08s, box-shadow .08s, filter .15s, background-color .2s, color .2s;
        }
        .wpc-btn-main:hover  { filter: brightness(1.08); }
        .wpc-btn-main:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.22); }
        .wpc-container.is-running .wpc-btn-main {
            background: rgba(255,255,255,0.85);
            color: var(--wpc-ink);
        }

        .wpc-music-row {
            display: flex;
            align-items: center;
            gap: 9px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            color: var(--wpc-muted);
            padding: 6px 12px 6px 8px;
            border-radius: 999px;
            background: var(--wpc-glass);
        }
        .wpc-music-row em { font-style: normal; color: var(--wpc-ink); }
        .wpc-switch-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .wpc-switch {
            position: relative;
            width: 38px; height: 22px;
            border-radius: 999px;
            background: rgba(20,32,46,0.2);
            transition: background .2s;
            flex-shrink: 0;
        }
        .wpc-switch::before {
            content: "";
            position: absolute;
            width: 16px; height: 16px;
            left: 3px; top: 3px;
            border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            transition: transform .2s;
        }
        .wpc-switch-input:checked + .wpc-switch { background: var(--wpc-op); }
        .wpc-switch-input:checked + .wpc-switch::before { transform: translateX(16px); }
        .wpc-switch-input:focus-visible + .wpc-switch { outline: 2px solid var(--wpc-ink); outline-offset: 2px; }

        /* ── Réglages : carte « verre » ── */
        .wpc-settings {
            background: var(--wpc-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            margin: 12px 16px 16px;
            padding: 12px 14px 14px;
            border-radius: 18px;
            flex-shrink: 0;
            transition: opacity 0.3s;
        }
        .wpc-settings.disabled { opacity: 0.4; pointer-events: none; }
        .wpc-settings-inner {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 560px;
            margin: 0 auto;
        }
        .wpc-modes {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .wpc-mode {
            font-family: inherit;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 9px 11px;
            border-radius: 14px;
            border: none;
            background: rgba(255,255,255,0.82);
            color: var(--wpc-ink);
            cursor: pointer;
            box-shadow: 0 3px 0 rgba(10,20,35,0.14);
            transition: transform .08s, box-shadow .08s, background-color .2s, color .2s;
        }
        .wpc-mode:hover { filter: brightness(1.04); }
        .wpc-mode:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(10,20,35,0.14); }
        .wpc-mode-name { font-size: 12.5px; font-weight: 700; line-height: 1.2; }
        .wpc-mode-rhythm { font-size: 11px; font-weight: 700; color: var(--wpc-muted); font-variant-numeric: tabular-nums; }
        .wpc-mode[aria-checked="true"] {
            background: var(--wpc-op);
            color: #fff;
        }
        .wpc-mode[aria-checked="true"] .wpc-mode-rhythm { color: rgba(255,255,255,0.85); }

        .wpc-duration-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 12.5px;
            font-weight: 700;
            color: var(--wpc-muted);
            margin-bottom: 8px;
        }
        .wpc-duration-label { color: var(--wpc-ink); font-weight: 700; font-variant-numeric: tabular-nums; }

        .wpc-range {
            --fill: 50%;
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 8px;
            margin: 0;
            border-radius: 999px;
            background: linear-gradient(to right, var(--wpc-op) var(--fill), rgba(20,32,46,0.14) var(--fill));
            cursor: pointer;
        }
        .wpc-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px; height: 20px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid var(--wpc-op);
            box-shadow: 0 2px 6px rgba(10,20,35,0.3);
        }
        .wpc-range::-moz-range-thumb {
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid var(--wpc-op);
        }
        .wpc-range:focus-visible { outline: 2px solid var(--wpc-ink); outline-offset: 6px; }

        .wpc-unit { font-weight: 600; }

        .wpc-btn-main:focus-visible,
        .wpc-mode:focus-visible,
        .wpc-icon-btn:focus-visible { outline: 2px solid var(--wpc-ink); outline-offset: 2px; }

        /* ── Aide (panneau blanc, comme la calculatrice) ── */
        .wpc-help-popup {
            display: none;
            position: absolute;
            top: 56px;
            right: 16px;
            background: rgba(255,255,255,0.96);
            border-radius: 16px;
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            padding: 14px 16px;
            width: 280px;
            max-width: calc(100% - 32px);
            box-sizing: border-box;
            font-size: 12.5px;
            font-weight: 600;
            color: rgba(20,32,46,0.75);
            z-index: 20;
            line-height: 1.5;
            cursor: default;
            user-select: text;
        }
        .wpc-help-popup.show { display: block; }
        .wpc-help-popup h4 { margin: 0 0 10px; font-size: 14px; font-weight: 700; color: var(--wpc-ink); }
        .wpc-help-guide { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 5px; }
        .wpc-help-guide li { display: flex; align-items: center; gap: 8px; }
        .wpc-help-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .wpc-help-guide b { color: var(--wpc-ink); font-weight: 700; }
        .wpc-help-section { padding: 8px 0; border-top: 1px solid var(--wpc-line); }
        .wpc-help-section b { color: var(--wpc-ink); font-weight: 700; display: block; }
        .wpc-help-tip { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--wpc-line); font-size: 11.5px; }

        /* ── Choix de la couleur ── */
        .wpc-theme-pop {
            position: absolute;
            top: 56px;
            right: 16px;
            z-index: 21;
            display: none;
            flex-direction: column;
            gap: 10px;
            padding: 12px 14px 14px;
            border-radius: 16px;
            background: rgba(255,255,255,0.96);
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            cursor: default;
        }
        .wpc-theme-pop.show { display: flex; }
        .wpc-pop-title { font-size: 13px; font-weight: 700; }
        .wpc-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
        .wpc-swatch {
            width: 28px; height: 28px;
            border-radius: 50%;
            border: 2px solid rgba(20,32,46,0.15);
            cursor: pointer;
            padding: 0;
        }
        .wpc-swatch.is-on { border-color: var(--wpc-ink); box-shadow: 0 0 0 2px #fff inset; }

        /* ── Poignée de redimensionnement ── */
        .wpc-resize-handle {
            position: absolute;
            right: 6px; bottom: 6px;
            width: 18px; height: 18px;
            cursor: nwse-resize;
            background: radial-gradient(circle, rgba(20,32,46,0.55) 1.3px, transparent 1.7px) 0 0 / 6px 6px;
            -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                    mask: linear-gradient(135deg, transparent 50%, #000 50%);
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .wpc-container:hover .wpc-resize-handle { opacity: 1; }
        .wpc-container.wf-fullboard .wpc-resize-handle { display: none; }

        @media (prefers-reduced-motion: reduce) {
            .wpc-ripple { display: none; }
        }
        `;
        document.head.appendChild(s);
    }

})();

// ── Couleurs disponibles (mêmes teintes que la calculatrice) ─────────────
const WPC_THEMES = {
    bleu:   { name: 'Bleu',   bg: '#8EC5F2', op: '#2F6FB3' },
    vert:   { name: 'Vert',   bg: '#7FD6A6', op: '#23915A' },
    jaune:  { name: 'Jaune',  bg: '#F6D86A', op: '#B9770E' },
    rose:   { name: 'Rose',   bg: '#F4A9C0', op: '#C2456E' },
    violet: { name: 'Violet', bg: '#C2B2F0', op: '#6A4FC2' },
    gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' }
};
const WPC_DEFAULT_THEME = 'vert';
const WPC_ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7" r="1.1" fill="currentColor"/><circle cx="15" cy="7.5" r="1.1" fill="currentColor"/></svg>';
const WPC_ICON_HELP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';

// ── Modes de respiration ──────────────────────────────────────────────────
const WPC_MODES = {
    coherence: { inspire: 5, bloqueIn: 0, expire: 5,  bloqueEx: 0, label: 'Cohérence cardiaque', rhythm: '5 s / 5 s'      },
    carre:     { inspire: 4, bloqueIn: 4, expire: 4,  bloqueEx: 4, label: 'Respiration carrée',  rhythm: '4 / 4 / 4 / 4'  },
    urgence:   { inspire: 3, bloqueIn: 1, expire: 7,  bloqueEx: 0, label: 'Urgence calme',       rhythm: '3 s / 7 s'      }
};

// ── Créer le widget ───────────────────────────────────────────────────────
// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

function createPauseCalmWidget() {
    // ── DOM widget ────────────────────────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'pause-calme';
    widget.tabIndex = 0;
    widget.style.cssText = 'position:absolute;';

    // Positionnement initial
    const pos = (typeof findFreePosition === 'function')
        ? findFreePosition(370, 440)
        : { left: 60, top: 60 };
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left = '100px';
    widget.style.top  = pos.top  + 'px';

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

    // ── Contenu principal ─────────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'wpc-container';
    container.dataset.phase = 'idle';
    container.style.width = '420px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'wpc-header';
    header.innerHTML = `
        <div class="wpc-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
                <path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity=".55"/>
            </svg>
            <span>Pause calme</span>
        </div>
        <div class="wpc-tools">
            <span class="wpc-tools-slot"></span>
            <span class="wpc-sep"></span>
            <div class="wf-btns">
                <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
            </div>
        </div>
    `;

    // Outils de l'en-tête : couleur + aide
    const themeBtn = document.createElement('button');
    themeBtn.className = 'wpc-icon-btn';
    themeBtn.title = 'Couleur';
    themeBtn.innerHTML = WPC_ICON_PALETTE;

    const helpBtn = document.createElement('button');
    helpBtn.className = 'wpc-icon-btn';
    helpBtn.title = 'Aide';
    helpBtn.innerHTML = WPC_ICON_HELP;
    const toolsSlot = header.querySelector('.wpc-tools-slot');
    toolsSlot.appendChild(themeBtn);
    toolsSlot.appendChild(helpBtn);

    const themePop = document.createElement('div');
    themePop.className = 'wpc-theme-pop';
    themePop.innerHTML = '<div class="wpc-pop-title">Couleur</div><div class="wpc-swatches">'
        + Object.keys(WPC_THEMES).map(id => '<button class="wpc-swatch" data-theme="' + id + '" title="'
        + WPC_THEMES[id].name + '" style="background:' + WPC_THEMES[id].bg + '"></button>').join('')
        + '</div>';
    header.appendChild(themePop);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'wpc-help-popup';
    helpPopup.innerHTML = `
        <h4>Suivre le cercle</h4>
        <ul class="wpc-help-guide">
            <li><span class="wpc-help-dot" style="background:var(--wpc-inhale)"></span><span><b>Il grandit</b> : on inspire par le nez</span></li>
            <li><span class="wpc-help-dot" style="background:var(--wpc-hold)"></span><span><b>Il s'arrête</b> : on retient doucement</span></li>
            <li><span class="wpc-help-dot" style="background:var(--wpc-exhale)"></span><span><b>Il rétrécit</b> : on expire lentement</span></li>
        </ul>
        <div class="wpc-help-section"><b>Cohérence cardiaque</b>5 s pour inspirer, 5 s pour expirer. Fait baisser le stress.</div>
        <div class="wpc-help-section"><b>Respiration carrée</b>4 temps de 4 s. Aide à se concentrer.</div>
        <div class="wpc-help-section"><b>Urgence calme</b>3 s pour inspirer, 7 s pour expirer. Pour une forte émotion ou de l'agitation.</div>
        <div class="wpc-help-tip">Dos droit, jambes décroisées, épaules relâchées.</div>
    `;
    header.appendChild(helpPopup);
    container.appendChild(header);

    // ── Corps central ─────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'wpc-body';
    body.innerHTML = `
        <div class="wpc-session-title" data-role="session-title">Prêt ?</div>
        <div class="wpc-timer" data-role="timer"></div>
        <div class="wpc-circle-wrap" data-role="circle-wrap">
            <div class="wpc-ripple r2" data-role="ripple2"></div>
            <div class="wpc-ripple r1" data-role="ripple1"></div>
            <div class="wpc-circle" data-role="circle"></div>
            <div class="wpc-center" aria-live="polite">
                <span class="wpc-circle-text" data-role="circle-text">Prêt ?</span>
                <span class="wpc-phase-count" data-role="phase-count"></span>
            </div>
        </div>
    `;
    container.appendChild(body);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'wpc-controls';
    controls.innerHTML = `
        <label class="wpc-music-row" title="Gnossienne n°1, Erik Satie">
            <input type="checkbox" class="wpc-switch-input" data-role="toggle-music" checked>
            <span class="wpc-switch"></span>
            <span>Musique <em>Satie</em></span>
        </label>
        <button class="wpc-btn-main" data-role="btn-main">Commencer</button>
    `;
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'wpc-settings';
    settings.dataset.role = 'settings';
    const modeButtons = Object.entries(WPC_MODES).map(([key, m]) => `
        <button class="wpc-mode" role="radio" data-mode="${key}" aria-checked="false">
            <span class="wpc-mode-name">${m.label}</span>
            <span class="wpc-mode-rhythm">${m.rhythm}</span>
        </button>`).join('');
    settings.innerHTML = `
        <div class="wpc-settings-inner">
            <div class="wpc-modes" role="radiogroup" aria-label="Type de respiration">${modeButtons}</div>
            <select data-role="select-type" hidden>
                <option value="coherence">Cohérence cardiaque</option>
                <option value="carre">Respiration carrée</option>
                <option value="urgence">Urgence calme</option>
            </select>
            <div>
                <div class="wpc-duration-head">
                    <span>Durée</span>
                    <span data-role="val-duree" class="wpc-duration-label"></span>
                </div>
                <input type="range" class="wpc-range" data-role="input-duree" min="0.5" max="5" step="0.5" value="2" aria-label="Durée de la séance">
            </div>
        </div>
    `;
    container.appendChild(settings);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'wpc-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Références DOM ────────────────────────────────────────────────────
    const circleWrap   = container.querySelector('[data-role="circle-wrap"]');
    const circle       = container.querySelector('[data-role="circle"]');
    const ripple1      = container.querySelector('[data-role="ripple1"]');
    const ripple2      = container.querySelector('[data-role="ripple2"]');
    const circleText   = container.querySelector('[data-role="circle-text"]');
    const phaseCount   = container.querySelector('[data-role="phase-count"]');
    const sessionTitle = container.querySelector('[data-role="session-title"]');
    const timerEl      = container.querySelector('[data-role="timer"]');
    const btnMain      = container.querySelector('[data-role="btn-main"]');
    const selectType   = container.querySelector('[data-role="select-type"]');
    const inputDuree   = container.querySelector('[data-role="input-duree"]');
    const valDuree     = container.querySelector('[data-role="val-duree"]');
    const toggleMusic  = container.querySelector('[data-role="toggle-music"]');
    const modeBtns     = Array.from(container.querySelectorAll('.wpc-mode'));

    // ── Mise à l'échelle proportionnelle ──────────────────────────────────
    // Le cercle suit la largeur utile ; en plein écran ou après un
    // redimensionnement vertical, il est aussi limité par la hauteur.
    const CIRCLE_RATIO = 0.82;
    const MAX_CIRCLE   = 720;
    const MIN_CIRCLE   = 120;

    function applyScale() {
        const cs = getComputedStyle(container);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const usable = Math.max(160, (container.clientWidth || 420) - padL - 40);
        let d = Math.min(Math.round(usable * CIRCLE_RATIO), MAX_CIRCLE);

        const constrained = container.classList.contains('wf-fullboard') || !!container.style.height;
        if (constrained) {
            const fixed = header.offsetHeight + controls.offsetHeight + settings.offsetHeight
                        + sessionTitle.offsetHeight + timerEl.offsetHeight + 90;
            d = Math.min(d, container.clientHeight - fixed);
        }
        d = Math.max(MIN_CIRCLE, d);

        circleWrap.style.width  = d + 'px';
        circleWrap.style.height = d + 'px';
        circleText.style.fontSize = Math.round(d * 0.09) + 'px';
        phaseCount.style.fontSize = Math.round(d * 0.065) + 'px';

        const ratio = Math.min(usable / 360, 1.6);
        sessionTitle.style.fontSize = Math.round(17 * ratio) + 'px';
        timerEl.style.fontSize      = Math.round(13 * ratio) + 'px';
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    const audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.innerHTML = `<source src="sons/musique-satie-gnossienne1.mp3" type="audio/mpeg">`;
    widget.appendChild(audio);

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => applyScale());
        ro.observe(container);
    }
    requestAnimationFrame(() => applyScale());

    function audioPlay() {
        if (!toggleMusic.checked) return;
        audio.volume = 0.4;
        const p = audio.play();
        if (p) p.catch(() => {});
    }
    function audioStop() {
        audio.pause();
        audio.currentTime = 0;
    }

    // ── Formatage durée ───────────────────────────────────────────────────
    function formatDuration(minutesDecimal) {
        const totalSeconds = Math.round(minutesDecimal * 60);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        if (m === 0) return `${s} <span class="wpc-unit">s</span>`;
        return s === 0
            ? `${m} <span class="wpc-unit">min</span>`
            : `${m} <span class="wpc-unit">min</span> ${s < 10 ? '0' + s : s}`;
    }
    function formatClock(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' + s : s}`;
    }

    function updateDurationDisplay() {
        valDuree.innerHTML = formatDuration(parseFloat(inputDuree.value));
        const min = parseFloat(inputDuree.min), max = parseFloat(inputDuree.max);
        inputDuree.style.setProperty('--fill', ((inputDuree.value - min) / (max - min) * 100) + '%');
        if (!isRunning) timerEl.innerHTML = `Séance de ${formatDuration(parseFloat(inputDuree.value))}`;
    }

    // ── Choix du mode ─────────────────────────────────────────────────────
    function syncModes() {
        modeBtns.forEach(b => b.setAttribute('aria-checked', b.dataset.mode === selectType.value ? 'true' : 'false'));
        if (!isRunning && container.dataset.phase !== 'done') {
            sessionTitle.textContent = WPC_MODES[selectType.value].label;
        }
    }
    modeBtns.forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        selectType.value = b.dataset.mode;
        if (container.dataset.phase === 'done') resetVisual();
        syncModes();
        if (typeof saveBoard === 'function') saveBoard();
    }));

    // ── Respiration ───────────────────────────────────────────────────────
    let isRunning     = false;
    let timerInterval = null;
    let phaseTick     = null;
    let timeLeft      = 0;
    let sessionId     = 0;

    const SCALE_MIN = 0.55;
    const SCALE_MAX = 1.0;

    updateDurationDisplay();
    inputDuree.addEventListener('input', updateDurationDisplay);
    inputDuree.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });
    syncModes();

    function wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    // Les deux ondes s'écartent du cercle à l'inspiration et s'y replient à l'expiration
    function setScale(scale, seconds, easing) {
        const t = (seconds || 0) + 's ' + (easing || 'cubic-bezier(.45,0,.55,1)');
        const k = (scale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
        circle.style.transition  = `transform ${t}, background-color 1.2s ease, box-shadow 1.2s ease`;
        ripple1.style.transition = `transform ${t}, border-color 1.2s ease`;
        ripple2.style.transition = `transform ${t}, border-color 1.2s ease`;
        circle.style.transform  = `scale(${scale})`;
        ripple1.style.transform = `scale(${scale * (1 + 0.10 * k)})`;
        ripple2.style.transform = `scale(${scale * (1 + 0.20 * k)})`;
    }

    function setPhase(kind, label, seconds, scale) {
        container.dataset.phase = kind;
        circleText.textContent = label;
        if (scale != null) setScale(scale, seconds);
        clearInterval(phaseTick);
        let n = seconds;
        phaseCount.textContent = n;
        phaseTick = setInterval(() => {
            n--;
            if (n > 0) phaseCount.textContent = n;
            else clearInterval(phaseTick);
        }, 1000);
    }

    async function runCycle(mode, id) {
        const alive = () => isRunning && id === sessionId;
        while (alive()) {
            setPhase('inspire', 'Inspire', mode.inspire, SCALE_MAX);
            await wait(mode.inspire);
            if (!alive()) return;
            if (mode.bloqueIn > 0) {
                setPhase('hold', 'Retiens', mode.bloqueIn, null);
                await wait(mode.bloqueIn);
                if (!alive()) return;
            }
            setPhase('expire', 'Expire', mode.expire, SCALE_MIN);
            await wait(mode.expire);
            if (!alive()) return;
            if (mode.bloqueEx > 0) {
                setPhase('hold', 'Retiens', mode.bloqueEx, null);
                await wait(mode.bloqueEx);
            }
        }
    }

    function startSession() {
        isRunning = true;
        const id = ++sessionId;
        const mode = WPC_MODES[selectType.value];
        timeLeft   = Math.round(parseFloat(inputDuree.value) * 60);
        audioPlay();
        container.classList.add('is-running');
        sessionTitle.textContent = mode.label;
        timerEl.textContent = formatClock(timeLeft);
        btnMain.textContent = 'Arrêter';
        settings.classList.add('disabled');
        runCycle(mode, id);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = formatClock(Math.max(0, timeLeft));
            if (timeLeft <= 0) stopSession(true);
        }, 1000);
    }

    function resetVisual() {
        container.dataset.phase = 'idle';
        circleText.textContent = 'Prêt ?';
        sessionTitle.textContent = WPC_MODES[selectType.value].label;
        updateDurationDisplay();
    }

    function stopSession(finished) {
        sessionId++;
        isRunning = false;
        clearInterval(timerInterval);
        clearInterval(phaseTick);
        audioStop();
        container.classList.remove('is-running');
        btnMain.textContent = 'Commencer';
        settings.classList.remove('disabled');
        phaseCount.textContent = '';
        setScale(SCALE_MIN, 0.8, 'ease-out');
        if (finished === true) {
            container.dataset.phase = 'done';
            sessionTitle.textContent = 'Séance terminée';
            circleText.textContent = 'Bravo';
            timerEl.innerHTML = `Séance de ${formatDuration(parseFloat(inputDuree.value))}`;
        } else {
            resetVisual();
        }
    }

    btnMain.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isRunning) stopSession(); else startSession();
    });

    // ── Popup aide ────────────────────────────────────────────────────────
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeThemePop();
        helpPopup.classList.toggle('show');
        helpBtn.classList.toggle('is-on', helpPopup.classList.contains('show'));
    });
    document.addEventListener('click', () => {
        helpPopup.classList.remove('show');
        helpBtn.classList.remove('is-on');
        closeThemePop();
    });

    // ── Couleur ───────────────────────────────────────────────────────────
    let themeId = WPC_DEFAULT_THEME;
    function setTheme(id) {
        if (!WPC_THEMES[id]) id = WPC_DEFAULT_THEME;
        themeId = id;
        container.style.setProperty('--wpc-bg', WPC_THEMES[id].bg);
        container.style.setProperty('--wpc-op', WPC_THEMES[id].op);
        themePop.querySelectorAll('.wpc-swatch').forEach(sw => sw.classList.toggle('is-on', sw.dataset.theme === id));
    }
    function closeThemePop() {
        themePop.classList.remove('show');
        themeBtn.classList.remove('is-on');
    }
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.remove('show');
        helpBtn.classList.remove('is-on');
        const open = !themePop.classList.contains('show');
        themePop.classList.toggle('show', open);
        themeBtn.classList.toggle('is-on', open);
    });
    ['mousedown', 'pointerdown'].forEach(ev => themePop.addEventListener(ev, e => e.stopPropagation()));
    themePop.addEventListener('click', (e) => {
        e.stopPropagation();
        const sw = e.target.closest('.wpc-swatch');
        if (!sw) return;
        setTheme(sw.dataset.theme);
        closeThemePop();
        if (typeof saveBoard === 'function') saveBoard();
    });
    setTheme(WPC_DEFAULT_THEME);
    helpPopup.addEventListener('click', e => e.stopPropagation());
    helpPopup.addEventListener('mousedown', e => e.stopPropagation());
    helpPopup.addEventListener('pointerdown', e => e.stopPropagation());

    // ── Resize ────────────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            const nw = Math.max(280, startW + ev.clientX - startX);
            const nh = Math.max(240, startH + ev.clientY - startY);
            container.style.width  = nw + 'px';
            container.style.height = nh + 'px';
            applyScale();
        };
        document.onmouseup = () => { document.onmousemove = null; if (typeof saveBoard === 'function') saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            const nw = Math.max(280, startW + t.clientX - startX);
            const nh = Math.max(240, startH + t.clientY - startY);
            container.style.width  = nw + 'px';
            container.style.height = nh + 'px';
            applyScale();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            if (typeof saveBoard === 'function') saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = container.querySelector('[data-role="wf-min"]');
    const wfMax   = container.querySelector('[data-role="wf-max"]');
    const wfClose = container.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedW = null, _savedH = null;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🧘 Pause Calme', {
                onExpand: () => {}
            });
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = container.style.width;
                _savedH = container.style.height;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedW) container.style.width  = _savedW;
                if (_savedH) container.style.height = _savedH;
            }
        });
    }

    // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
    // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
    {
        const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
        container.addEventListener('touchstart',  stopInMax, { passive: true });
        container.addEventListener('pointerdown', stopInMax);
        container.addEventListener('mousedown',   stopInMax);
    }

    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            stopSession();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Getter/Setter pour save-load ──────────────────────────────────────
    widget._wpcGetData = function() {
        return {
            // En plein écran, on enregistre la taille normale du cadre (pas celle de l'écran)
            containerW: _isMax ? (parseFloat(_savedW) || 420) : container.offsetWidth,
            containerH: _isMax ? (parseFloat(_savedH) || container.offsetHeight) : container.offsetHeight,
            mode: selectType.value,
            duree: parseFloat(inputDuree.value),
            musicOn: toggleMusic.checked,
            theme: themeId,
            fullboard: container.classList.contains('wf-fullboard')
        };
    };
    widget._wpcSetData = function(d) {
        if (!d) return;
        if (d.mode && selectType.querySelector(`option[value="${d.mode}"]`)) { selectType.value = d.mode; syncModes(); }
        if (d.duree) { inputDuree.value = d.duree; updateDurationDisplay(); }
        if (d.musicOn !== undefined) toggleMusic.checked = d.musicOn;
        if (d.theme) setTheme(d.theme);
        if (d.containerW) container.style.width  = d.containerW + 'px';
        if (d.containerH) container.style.height = d.containerH + 'px';
        if (d.fullboard) container.classList.add('wf-fullboard');
    };

    // ── Init widget dans le board ─────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.closest('input, button, select, label')) return;
        if (typeof bringToFront  === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront  === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && !_isMax) wfMax.click();

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
