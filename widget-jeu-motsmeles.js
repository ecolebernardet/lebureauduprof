// =========================================================================
// WIDGET JEU MOTS MÊLÉS — Le Bureau du Prof
// Version « jeu » du widget Mots Mêlés : grille interactive ludique,
// sélection des mots au glisser (ou tap-tap sur TBI), chrono, score,
// indices, étoiles et confettis.
//
// Basé sur widget-motsmeles.js (algorithme de génération, PDF, JSON).
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// Point d'entrée : createJeuMotsMelesWidget(savedData)
// =========================================================================

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
(function () {

    // Boutons fenêtre macOS (partagés avec widget-repro-quadrillage)
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

    // Police ludique (facultative : repli sur des polices système si hors ligne)
    if (!document.getElementById('jmm-font')) {
        const lf = document.createElement('link');
        lf.id = 'jmm-font';
        lf.rel = 'stylesheet';
        lf.href = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap';
        document.head.appendChild(lf);
    }

    if (document.getElementById('jmm-style')) return;
    const s = document.createElement('style');
    s.id = 'jmm-style';
    s.textContent = `
        .widget[data-type="jeu-motsmeles"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jmm-container {
            --jmm-font: 'Fredoka', 'Baloo 2', 'Nunito', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif;
            position: relative;
            width: 860px;
            box-sizing: border-box;
            padding: 12px 14px 16px;
            border-radius: 26px;
            background:
                radial-gradient(circle at 12% 8%,  rgba(255,255,255,.16) 0 55px, transparent 56px),
                radial-gradient(circle at 92% 88%, rgba(255,255,255,.12) 0 85px, transparent 86px),
                radial-gradient(circle at 70% 4%,  rgba(255,255,255,.10) 0 26px, transparent 27px),
                linear-gradient(150deg, #4f46e5 0%, #7c3aed 45%, #ec4899 100%);
            box-shadow: 0 12px 30px rgba(76,29,149,.35), inset 0 -6px 0 rgba(0,0,0,.15);
            font-family: var(--jmm-font);
            color: #1f2937;
            user-select: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow: hidden;
        }
        .jmm-container * { box-sizing: border-box; }
        /* Protection contre les styles globaux du tableau (fonds gris, transparences) */
        .jmm-container, .jmm-game, .jmm-main, .jmm-board, .jmm-grid-wrap, .jmm-grid,
        .jmm-side, .jmm-words-card, .jmm-card {
            opacity: 1 !important; filter: none !important;
        }
        .jmm-game, .jmm-main, .jmm-grid-wrap, .jmm-grid, .jmm-side {
            background: transparent !important;
        }
        .jmm-board, .jmm-words-card, .jmm-card { background: #fffdf7 !important; }
        .jmm-container .jmm-words, .jmm-container .jmm-words-title { background: transparent; opacity: 1; }
        .jmm-container .jmm-word { background: #f5f3ff; opacity: 1; }
        .jmm-container .jmm-word-dot { background: #ddd6fe; }
        .jmm-container .jmm-word.found .jmm-word-dot { background: rgba(255,255,255,.35); }

        /* ── En-tête ── */
        .jmm-header { display: flex; align-items: center; gap: 10px; cursor: move; }
        .jmm-logo {
            width: 42px; height: 42px; border-radius: 13px;
            background: #fde047; color: #7c2d12;
            display: flex; align-items: center; justify-content: center;
            font-size: 23px; box-shadow: 0 4px 0 #ca8a04;
            transform: rotate(-7deg); flex-shrink: 0; pointer-events: none;
            animation: jmmWobble 3s ease-in-out infinite;
        }
        .jmm-title {
            font-size: 25px; font-weight: 700; color: #fff; letter-spacing: .5px;
            text-shadow: 0 3px 0 rgba(0,0,0,.25); flex: 1; pointer-events: none;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .jmm-title small {
            font-size: 13px; background: #fde047; color: #7c2d12;
            padding: 2px 9px; border-radius: 20px; margin-left: 6px;
            vertical-align: middle; text-shadow: none; letter-spacing: 1px;
        }
        .jmm-round-btn {
            width: 30px; height: 30px; border-radius: 50%; border: none;
            background: rgba(255,255,255,.22); color: #fff; font-size: 15px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            font-family: var(--jmm-font); font-weight: 700; flex-shrink: 0;
            transition: background .15s, transform .1s;
        }
        .jmm-round-btn:hover { background: rgba(255,255,255,.38); }
        .jmm-round-btn:active { transform: scale(.9); }

        /* ── Cartes ── */
        .jmm-card {
            background: #fffdf7; border-radius: 20px; padding: 14px 16px;
            box-shadow: 0 5px 0 rgba(0,0,0,.14);
        }
        .jmm-step {
            display: flex; align-items: center; gap: 8px;
            font-weight: 700; font-size: 16px; color: #4c1d95; margin: 2px 0 9px;
        }
        .jmm-step b {
            width: 27px; height: 27px; border-radius: 50%;
            background: #7c3aed; color: #fff; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 3px 0 #4c1d95;
        }
        .jmm-setup { display: flex; flex-direction: column; gap: 10px; }
        .jmm-setup-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .jmm-setup-row > .jmm-card { flex: 1 1 260px; }

        /* ── Tuiles thèmes ── */
        .jmm-themes {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
            gap: 8px;
        }
        .jmm-tile {
            border: 3px solid transparent; border-radius: 15px;
            padding: 6px 4px 5px; text-align: center; cursor: pointer;
            box-shadow: 0 4px 0 rgba(0,0,0,.13);
            transition: transform .12s, border-color .12s, box-shadow .12s;
            font-family: var(--jmm-font);
        }
        .jmm-tile:hover { transform: translateY(-2px); }
        .jmm-tile:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.13); }
        .jmm-tile.active { border-color: #7c3aed; transform: scale(1.05); box-shadow: 0 4px 0 #7c3aed; }
        .jmm-tile-emo { font-size: 25px; line-height: 1.2; display: block; pointer-events: none; }
        .jmm-tile-lbl { font-size: 12px; font-weight: 700; color: #3b0764; display: block; pointer-events: none; }

        /* ── Champs ── */
        .jmm-label { font-size: 13px; font-weight: 700; color: #6d28d9; margin: 10px 0 4px; display: flex; justify-content: space-between; }
        .jmm-input {
            width: 100%; border: 2.5px solid #e9d5ff; border-radius: 13px;
            padding: 7px 11px; font-size: 15px; font-weight: 600; color: #3b0764;
            background: #fff; outline: none; font-family: var(--jmm-font);
            user-select: text;
        }
        .jmm-input:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,.2); }
        textarea.jmm-input { resize: vertical; min-height: 62px; }
        .jmm-count {
            font-size: 12px; background: #f3e8ff; color: #6d28d9;
            padding: 1px 9px; border-radius: 20px;
        }

        /* ── Pastilles (taille) ── */
        .jmm-chips { display: flex; gap: 7px; flex-wrap: wrap; }
        .jmm-chip {
            padding: 6px 14px; border-radius: 999px; border: 2.5px solid #e9d5ff;
            background: #fff; font-weight: 700; font-size: 14px; color: #6d28d9;
            cursor: pointer; font-family: var(--jmm-font);
            transition: transform .1s;
        }
        .jmm-chip:active { transform: scale(.94); }
        .jmm-chip.active { background: #7c3aed; color: #fff; border-color: #6d28d9; box-shadow: 0 3px 0 #4c1d95; }

        /* ── Difficulté ── */
        .jmm-diffs { display: flex; gap: 8px; flex-wrap: wrap; }
        .jmm-diff {
            flex: 1 1 90px; border-radius: 15px; border: 3px solid transparent;
            padding: 6px 6px 7px; cursor: pointer; text-align: center;
            font-family: var(--jmm-font); background: #f5f3ff;
            box-shadow: 0 4px 0 rgba(0,0,0,.13); transition: transform .1s;
        }
        .jmm-diff:active { transform: translateY(2px); }
        .jmm-diff-name { display: block; font-weight: 700; font-size: 15px; pointer-events: none; }
        .jmm-diff-arr  { display: block; font-size: 12px; letter-spacing: 2px; opacity: .85; pointer-events: none; }
        .jmm-diff[data-diff="easy"]   { color: #15803d; }
        .jmm-diff[data-diff="medium"] { color: #c2410c; }
        .jmm-diff[data-diff="expert"] { color: #b91c1c; }
        .jmm-diff.active[data-diff="easy"]   { background: #22c55e; color: #fff; border-color: #16a34a; box-shadow: 0 4px 0 #15803d; }
        .jmm-diff.active[data-diff="medium"] { background: #f97316; color: #fff; border-color: #ea580c; box-shadow: 0 4px 0 #c2410c; }
        .jmm-diff.active[data-diff="expert"] { background: #ef4444; color: #fff; border-color: #dc2626; box-shadow: 0 4px 0 #b91c1c; }

        /* ── Interrupteur ── */
        .jmm-switch { display: flex; align-items: center; gap: 9px; cursor: pointer; font-weight: 700; color: #4c1d95; font-size: 14px; margin-top: 12px; }
        .jmm-switch input { display: none; }
        .jmm-switch-track {
            width: 44px; height: 24px; border-radius: 20px; background: #ddd6fe;
            position: relative; transition: background .2s; flex-shrink: 0;
        }
        .jmm-switch-track::after {
            content: ''; position: absolute; top: 3px; left: 3px;
            width: 18px; height: 18px; border-radius: 50%; background: #fff;
            box-shadow: 0 2px 3px rgba(0,0,0,.2); transition: left .2s;
        }
        .jmm-switch input:checked + .jmm-switch-track { background: #22c55e; }
        .jmm-switch input:checked + .jmm-switch-track::after { left: 23px; }

        /* ── Boutons ── */
        .jmm-btn {
            padding: 7px 13px; border-radius: 13px; border: none;
            font-weight: 700; font-size: 13px; cursor: pointer;
            font-family: var(--jmm-font); color: #fff;
            box-shadow: 0 4px 0 rgba(0,0,0,.22);
            transition: transform .08s, box-shadow .08s, filter .15s;
            display: inline-flex; align-items: center; justify-content: center; gap: 5px;
            white-space: nowrap;
        }
        .jmm-btn:hover { filter: brightness(1.08); }
        .jmm-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,.22); }
        .jmm-btn:disabled { opacity: .45; cursor: default; }
        .jmm-btn-white  { background: #fff; color: #5b21b6; }
        .jmm-btn-yellow { background: #facc15; color: #713f12; }
        .jmm-btn-green  { background: #22c55e; }
        .jmm-btn-blue   { background: #3b82f6; }
        .jmm-btn-orange { background: #f97316; }
        .jmm-btn-pink   { background: #ec4899; }
        .jmm-btn-violet { background: #8b5cf6; }
        .jmm-btn-load input { display: none; }

        .jmm-setup-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .jmm-play {
            margin-left: auto; font-size: 23px; padding: 10px 36px; border-radius: 999px;
            background: linear-gradient(#fde047, #f59e0b); color: #7c2d12;
            box-shadow: 0 6px 0 #b45309, 0 10px 18px rgba(0,0,0,.25);
            border: none; font-weight: 700; cursor: pointer; font-family: var(--jmm-font);
            animation: jmmPulse 1.6s ease-in-out infinite; letter-spacing: 1px;
        }
        .jmm-play:active { transform: translateY(4px) scale(.98); box-shadow: 0 2px 0 #b45309; animation: none; }

        /* ── HUD ── */
        .jmm-hud { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .jmm-pill {
            background: rgba(255,255,255,.96); border-radius: 999px; padding: 5px 13px;
            font-weight: 700; font-size: 16px; color: #4c1d95;
            box-shadow: 0 3px 0 rgba(0,0,0,.18);
            display: flex; gap: 6px; align-items: center; white-space: nowrap;
        }
        .jmm-pill.bump { animation: jmmBump .45s; }
        .jmm-game-title {
            flex: 1; text-align: center; color: #fff; font-size: 21px; font-weight: 700;
            text-shadow: 0 2px 0 rgba(0,0,0,.25); min-width: 120px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Plateau ── */
        .jmm-main { display: flex; gap: 12px; flex-wrap: wrap; align-items: stretch; }
        .jmm-board {
            flex: 1 1 360px; min-width: 0;
            background: #fffdf7; border-radius: 22px; padding: 12px !important;
            box-shadow: 0 6px 0 rgba(0,0,0,.16);
            display: flex; justify-content: center; align-items: center;
        }
        .jmm-grid-wrap { position: relative !important; touch-action: none; padding: 0 !important; margin: 0 !important; flex-shrink: 0; }
        .jmm-grid { position: absolute !important; left: 0 !important; top: 0 !important; display: block !important; padding: 0 !important; margin: 0 !important; }
        .jmm-cell {
            position: absolute !important; box-sizing: border-box !important;
            margin: 0 !important; padding: 0 !important;
            min-width: 0 !important; min-height: 0 !important;
            display: flex; align-items: center; justify-content: center;
            background: #ffffff !important; background-image: none !important;
            opacity: 1 !important; filter: none !important;
            border-radius: 24%;
            border: 2px solid #ede9fe !important; box-shadow: 0 2px 0 #ddd6fe;
            font-weight: 700; color: #312e81 !important; cursor: pointer;
            text-transform: uppercase; line-height: 1 !important;
            z-index: 1;
            transition: transform .12s, background .2s;
        }
        .jmm-cell:hover { background: #ffffff !important; border-color: #c4b5fd !important; }
        .jmm-cell.found { color: #1e1b4b !important; }
        .jmm-cell.pop  { animation: jmmPop .45s ease; }
        .jmm-cell.hint { animation: jmmHint .5s ease-in-out infinite alternate; z-index: 3;
                         background: #fde047 !important; border-color: #eab308 !important; }
        .jmm-grid-wrap.shake { animation: jmmShake .38s; }
        .jmm-grid-wrap.locked .jmm-cell { cursor: default; }
        .jmm-overlay {
            position: absolute !important; left: 0 !important; top: 0 !important;
            margin: 0 !important; padding: 0 !important; max-width: none !important;
            pointer-events: none;
            mix-blend-mode: multiply; z-index: 2; overflow: visible;
            /* Le calque doit rester totalement transparent (hors surlignages) */
            background: transparent !important; background-color: transparent !important;
            background-image: none !important; border: none !important;
            box-shadow: none !important; outline: none !important;
            opacity: 1 !important; filter: none !important; fill: none;
        }
        .jmm-overlay * { filter: none !important; }

        /* ── Panneau latéral ── */
        .jmm-side { flex: 0 0 225px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
        .jmm-words-card {
            background: #fffdf7; border-radius: 20px; padding: 10px 12px;
            box-shadow: 0 5px 0 rgba(0,0,0,.14); flex: 1;
            display: flex; flex-direction: column; min-height: 0;
        }
        .jmm-words-title { font-weight: 700; color: #6d28d9; font-size: 15px; margin-bottom: 7px; text-align: center; }
        .jmm-words { display: flex; flex-direction: column; gap: 5px; overflow-y: auto; max-height: 420px; }
        .jmm-word {
            display: flex; align-items: center; gap: 7px; padding: 5px 10px;
            border-radius: 12px; background: #f5f3ff; font-weight: 700;
            font-size: 15px; color: #4c1d95; letter-spacing: 1px;
            transition: background .3s, color .3s;
        }
        .jmm-words.compact .jmm-word { font-size: 13px; padding: 3px 9px; }
        .jmm-word-dot {
            width: 14px; height: 14px; border-radius: 50%; background: #ddd6fe;
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
            font-size: 10px; color: #fff;
        }
        .jmm-word.found { color: #fff; animation: jmmBounce .5s; }
        .jmm-word.found .jmm-word-txt { text-decoration: line-through; text-decoration-thickness: 2px; }
        .jmm-word.found .jmm-word-dot { background: rgba(255,255,255,.35); }
        .jmm-side-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }

        /* ── Toast ── */
        .jmm-toast {
            position: absolute; left: 50%; top: 16px; transform: translate(-50%, -20px);
            background: #fff; color: #4c1d95; font-weight: 700; font-size: 17px;
            padding: 8px 20px; border-radius: 999px; box-shadow: 0 5px 0 rgba(0,0,0,.2);
            opacity: 0; pointer-events: none; transition: opacity .25s, transform .25s;
            z-index: 25; white-space: nowrap;
        }
        .jmm-toast.show { opacity: 1; transform: translate(-50%, 0); }
        .jmm-toast.good { background: #22c55e; color: #fff; }
        .jmm-toast.bad  { background: #f43f5e; color: #fff; }

        /* ── Victoire ── */
        .jmm-victory {
            position: absolute; inset: 0; display: none; align-items: center; justify-content: center;
            background: rgba(49,15,94,.55); z-index: 20;
        }
        .jmm-victory.show { display: flex; }
        .jmm-victory-card {
            background: #fffdf7; border-radius: 28px; padding: 22px 34px 24px;
            text-align: center; box-shadow: 0 10px 0 rgba(0,0,0,.22);
            animation: jmmZoom .55s cubic-bezier(.2,1.6,.4,1);
            max-width: 90%;
        }
        .jmm-victory-trophy { font-size: 56px; line-height: 1; animation: jmmWobble 1.2s ease-in-out infinite; }
        .jmm-victory-title { font-size: 38px; font-weight: 700; color: #7c3aed; text-shadow: 0 3px 0 #e9d5ff; margin: 4px 0; }
        .jmm-stars { font-size: 44px; letter-spacing: 6px; margin: 4px 0 8px; }
        .jmm-stars span { display: inline-block; animation: jmmStar .5s backwards; }
        .jmm-stars span.off { filter: grayscale(1); opacity: .25; }
        .jmm-victory-stats { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 14px; }
        .jmm-victory-stats .jmm-pill { background: #f5f3ff; box-shadow: none; }
        .jmm-victory-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .jmm-victory-btns .jmm-btn { font-size: 15px; padding: 9px 16px; }
        .jmm-confetti { position: absolute; inset: 0; pointer-events: none; z-index: 21;
                         background: transparent !important; border: none !important; box-shadow: none !important; }

        /* ── Aide ── */
        .jmm-help-popup {
            display: none; position: absolute; top: 60px; right: 14px;
            background: #fffdf7; border-radius: 18px; box-shadow: 0 8px 24px rgba(0,0,0,.25);
            padding: 12px 15px; width: 300px; font-size: 13px; color: #3b0764;
            z-index: 30; line-height: 1.5;
        }
        .jmm-help-popup.show { display: block; }
        .jmm-help-popup h4 { margin: 0 0 8px; font-size: 16px; color: #7c3aed; }
        .jmm-help-section { margin-bottom: 7px; padding-bottom: 7px; border-bottom: 2px dashed #ede9fe; }
        .jmm-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Plein écran ── */
        .jmm-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important;
            overflow-y: auto; padding-left: 50px !important;
        }
        .jmm-container.wf-fullboard .jmm-words { max-height: none; }

        /* ── Poignée de redimensionnement ── */
        .jmm-resize-handle {
            position: absolute; right: 0; bottom: 0; width: 22px; height: 22px;
            cursor: se-resize; z-index: 26;
            background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,.7) 50%);
            border-radius: 0 0 24px 0; opacity: 0; transition: opacity .2s;
        }
        .jmm-container:hover .jmm-resize-handle { opacity: 1; }

        /* ── Animations ── */
        @keyframes jmmPop    { 0%{transform:scale(1)} 45%{transform:scale(1.28) rotate(-6deg)} 100%{transform:scale(1)} }
        @keyframes jmmHint   { from{transform:scale(1);box-shadow:0 0 0 0 rgba(250,204,21,.9)}
                               to{transform:scale(1.14);box-shadow:0 0 0 6px rgba(250,204,21,.55)} }
        @keyframes jmmShake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)}
                               60%{transform:translateX(-5px)} 80%{transform:translateX(4px)} }
        @keyframes jmmBounce { 0%{transform:scale(1)} 40%{transform:scale(1.12)} 70%{transform:scale(.96)} 100%{transform:scale(1)} }
        @keyframes jmmBump   { 0%{transform:scale(1)} 40%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes jmmZoom   { from{transform:scale(.3);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes jmmStar   { from{transform:scale(0) rotate(-90deg)} to{transform:scale(1) rotate(0)} }
        @keyframes jmmPulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes jmmWobble { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
    `;
    document.head.appendChild(s);
})();

// ── Thèmes prédéfinis ─────────────────────────────────────────────────────
const JMM_THEMES = [
    { key: 'animaux',   emo: '🐾', lbl: 'Animaux',    bg: '#fef3c7', words: 'Lion, Tigre, Elephant, Girafe, Zebre, Singe, Kangourou, Panda, Renard, Loup, Ours, Lapin' },
    { key: 'ecole',     emo: '🏫', lbl: 'École',      bg: '#dbeafe', words: 'Crayon, Cahier, Gomme, Stylo, Maitre, Classe, Bureau, Ardoise, Ecole, Livre, Cartable, Regle' },
    { key: 'corps',     emo: '👤', lbl: 'Corps',      bg: '#fce7f3', words: 'Tete, Epaule, Genou, Pied, Main, Bras, Jambe, Doigt, Ventre, Dos, Bouche, Nez' },
    { key: 'fruits',    emo: '🍎', lbl: 'Fruits',     bg: '#fee2e2', words: 'Pomme, Banane, Fraise, Orange, Poire, Cerise, Raisin, Ananas, Melon, Peche, Kiwi, Citron' },
    { key: 'jours',     emo: '📅', lbl: 'Jours',      bg: '#e0e7ff', words: 'Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi, Dimanche, Semaine, Hier, Demain' },
    { key: 'mois',      emo: '🗓️', lbl: 'Mois',       bg: '#ede9fe', words: 'Janvier, Fevrier, Mars, Avril, Mai, Juin, Juillet, Aout, Septembre, Octobre, Novembre, Decembre' },
    { key: 'couleurs',  emo: '🎨', lbl: 'Couleurs',   bg: '#fae8ff', words: 'Rouge, Bleu, Vert, Jaune, Orange, Violet, Marron, Rose, Blanc, Noir, Gris, Beige' },
    { key: 'espace',    emo: '🚀', lbl: 'Espace',     bg: '#e0f2fe', words: 'Soleil, Lune, Terre, Mars, Jupiter, Saturne, Planete, Etoile, Galaxie, Comete, Fusee, Astronaute' },
    { key: 'sports',    emo: '⚽', lbl: 'Sports',     bg: '#dcfce7', words: 'Football, Basket, Tennis, Judo, Natation, Rugby, Karate, Escrime, Boxe, Danse, Yoga, Ski' },
    { key: 'musique',   emo: '🎸', lbl: 'Musique',    bg: '#ffedd5', words: 'Piano, Guitare, Violon, Flute, Trompette, Batterie, Harpe, Saxophone, Tambour' },
    { key: 'noel',      emo: '🎄', lbl: 'Noël',       bg: '#dcfce7', words: 'Sapin, Cadeau, Lutin, Traineau, Etoile, Boule, Guirlande, Flocon, Neige, Hotte, Renne' },
    { key: 'pays',      emo: '🌍', lbl: 'Pays',       bg: '#ccfbf1', words: 'France, Italie, Espagne, Belgique, Suisse, Monaco, Allemagne, Canada, Japon, Bresil, Maroc' },
    { key: 'metiers',   emo: '👷', lbl: 'Métiers',    bg: '#fef9c3', words: 'Docteur, Pompier, Policier, Boulanger, Avocat, Pilote, Facteur, Artiste, Juge, Marin' },
    { key: 'vetements', emo: '👕', lbl: 'Vêtements',  bg: '#e0e7ff', words: 'Pantalon, Chemise, Robe, Jupe, Veste, Bonnet, Echarpe, Gants, Chaussette, Chaussure' },
    { key: 'maison',    emo: '🏠', lbl: 'Maison',     bg: '#ffe4e6', words: 'Cuisine, Salon, Chambre, Jardin, Fenetre, Escalier, Toiture, Garage, Balcon, Entree' },
    { key: 'meteo',     emo: '⛅', lbl: 'Météo',      bg: '#e0f2fe', words: 'Soleil, Nuage, Pluie, Orage, Eclair, Tempete, Brouillard, Neige, Ouragan, Arcenciel' },
    { key: 'insectes',  emo: '🐝', lbl: 'Insectes',   bg: '#fef3c7', words: 'Abeille, Fourmi, Mouche, Papillon, Grillon, Cafard, Cigale, Guepe, Libellule, Luciole' },
    { key: 'ocean',     emo: '🐬', lbl: 'Océan',      bg: '#cffafe', words: 'Baleine, Requin, Dauphin, Tortue, Pieuvre, Corail, Algue, Meduse, Crevette, Etoile' },
    { key: 'geometrie', emo: '📐', lbl: 'Géométrie',  bg: '#f1f5f9', words: 'Carre, Cercle, Triangle, Losange, Ovale, Cube, Sphere, Pyramide, Angle, Droite' },
    { key: 'perso',     emo: '✏️', lbl: 'Mes mots',   bg: '#ffffff', words: '' }
];

// Directions autorisées par niveau ([dr, dc])
const JMM_DIRECTIONS = {
    easy:   [[0,1],[1,0]],
    medium: [[0,1],[1,0],[1,1],[-1,1]],
    expert: [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,-1],[1,-1],[-1,1]]
};

// Couleurs vives des mots trouvés
const JMM_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4',
    '#f97316', '#ec4899', '#14b8a6', '#6366f1', '#84cc16', '#eab308'
];

// Lettres de remplissage pondérées (fréquences approximatives du français)
const JMM_FILL = 'EEEEEEEEAAAAASSSSIIIIINNNNTTTTRRRRUUUULLLOOOODDDCCCMMMPPVVGBFHQJXYZK';

// ── Petits sons (WebAudio, sans fichier) ─────────────────────────────────
const JMM_SOUND = {
    ctx: null,
    get() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try { this.ctx = new AC(); } catch (e) { return null; }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
    },
    notes(list, type, vol) {
        const ctx = this.get();
        if (!ctx) return;
        let t = ctx.currentTime;
        list.forEach(([freq, dur]) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = type || 'square';
            o.frequency.value = freq;
            g.gain.setValueAtTime(vol || 0.06, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t); o.stop(t + dur + 0.02);
            t += dur * 0.85;
        });
    },
    tick()    { this.notes([[880, 0.04]], 'square', 0.025); },
    found()   { this.notes([[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.18]], 'square', 0.05); },
    wrong()   { this.notes([[196, 0.12], [147, 0.2]], 'sawtooth', 0.04); },
    hint()    { this.notes([[988, 0.08], [1319, 0.14]], 'triangle', 0.07); },
    victory() { this.notes([[523, .12], [523, .12], [523, .12], [659, .3], [587, .12], [659, .12], [784, .45]], 'square', 0.05); }
};

// ── Création du widget ────────────────────────────────────────────────────
function createJeuMotsMelesWidget(savedData) {
    if (!savedData && typeof snapshotNow === 'function') snapshotNow();
    const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 100 };

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'jeu-motsmeles';
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

    // ══════════════════════════════════════════════════════════════════════
    // STRUCTURE
    // ══════════════════════════════════════════════════════════════════════
    const container = document.createElement('div');
    container.className = 'jmm-container';

    const themeTiles = JMM_THEMES.map(t =>
        `<div class="jmm-tile" data-theme="${t.key}" style="background:${t.bg}">
            <span class="jmm-tile-emo">${t.emo}</span><span class="jmm-tile-lbl">${t.lbl}</span>
        </div>`).join('');

    container.innerHTML = `
        <div class="jmm-header">
            <div class="jmm-logo">🔍</div>
            <div class="jmm-title">Mots Mêlés <small>LE JEU</small></div>
            <button class="jmm-round-btn" data-role="sound" title="Son activé / coupé">🔊</button>
            <button class="jmm-round-btn" data-role="help" title="Aide">?</button>
            <div class="wf-btns" style="margin-left:4px">
                <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
            </div>
        </div>

        <div class="jmm-help-popup">
            <h4>💡 Comment jouer ?</h4>
            <div class="jmm-help-section"><b>🎨 1. Réglages</b><br>Choisis un thème (ou écris tes propres mots séparés par des <b>virgules</b>), la taille de la grille et la difficulté, puis clique sur <b>JOUER !</b></div>
            <div class="jmm-help-section"><b>👆 2. Trouver un mot</b><br><b>Glisse</b> ton doigt (ou la souris) de la première à la dernière lettre du mot.<br>Sur le TBI, tu peux aussi <b>toucher la première lettre</b>, puis <b>la dernière</b>.</div>
            <div class="jmm-help-section"><b>⭐ 3. Points</b><br>Chaque mot trouvé rapporte 10 points par lettre. Un <b>indice</b> 💡 montre la première lettre d'un mot… mais coûte 15 points !</div>
            <div class="jmm-help-section"><b>🏆 4. Victoire</b><br>Trouve tous les mots pour gagner jusqu'à <b>3 étoiles</b> (sans indice = 3 étoiles).</div>
            <div class="jmm-help-section"><b>🧑‍🏫 Pour l'enseignant</b><br><b>Solution</b> révèle les mots restants, <b>PDF</b> crée une fiche imprimable avec correction, <b>Sauvegarder / Charger</b> garde vos listes de mots.</div>
        </div>

        <!-- ═════════ ÉCRAN RÉGLAGES ═════════ -->
        <div class="jmm-setup">
            <div class="jmm-card">
                <div class="jmm-step"><b>1</b> Choisis un thème</div>
                <div class="jmm-themes">${themeTiles}</div>
                <div class="jmm-label"><span>Titre de la grille</span></div>
                <input type="text" class="jmm-input jmm-title-input" placeholder="Ex : Les animaux">
                <div class="jmm-label"><span>Mots à cacher (séparés par des virgules)</span><span class="jmm-count">0 mot</span></div>
                <textarea class="jmm-input jmm-words-input" rows="2" placeholder="Lion, Tigre, Éléphant…"></textarea>
            </div>
            <div class="jmm-setup-row">
                <div class="jmm-card">
                    <div class="jmm-step"><b>2</b> Taille de la grille</div>
                    <div class="jmm-chips jmm-sizes">
                        <button class="jmm-chip" data-size="8">8 × 8</button>
                        <button class="jmm-chip active" data-size="10">10 × 10</button>
                        <button class="jmm-chip" data-size="12">12 × 12</button>
                        <button class="jmm-chip" data-size="15">15 × 15</button>
                    </div>
                    <label class="jmm-switch">
                        <input type="checkbox" class="jmm-timer-check" checked>
                        <span class="jmm-switch-track"></span> ⏱️ Afficher le chronomètre
                    </label>
                </div>
                <div class="jmm-card">
                    <div class="jmm-step"><b>3</b> Difficulté</div>
                    <div class="jmm-diffs">
                        <button class="jmm-diff active" data-diff="easy"><span class="jmm-diff-name">😊 Facile</span><span class="jmm-diff-arr">→ ↓</span></button>
                        <button class="jmm-diff" data-diff="medium"><span class="jmm-diff-name">🤔 Moyen</span><span class="jmm-diff-arr">→ ↓ ↘ ↗</span></button>
                        <button class="jmm-diff" data-diff="expert"><span class="jmm-diff-name">🔥 Expert</span><span class="jmm-diff-arr">toutes directions</span></button>
                    </div>
                </div>
            </div>
            <div class="jmm-setup-actions">
                <label class="jmm-btn jmm-btn-white jmm-btn-load" title="Charger une liste depuis un fichier JSON">
                    📂 Charger<input type="file" accept=".json,.txt" class="jmm-file-input">
                </label>
                <button class="jmm-btn jmm-btn-white" data-role="save-json" title="Sauvegarder la liste dans un fichier JSON">💾 Sauvegarder</button>
                <button class="jmm-play" data-role="play">▶ JOUER !</button>
            </div>
        </div>

        <!-- ═════════ ÉCRAN JEU ═════════ -->
        <div class="jmm-game" style="display:none;flex-direction:column;gap:10px;">
            <div class="jmm-hud">
                <button class="jmm-btn jmm-btn-white" data-role="back" title="Retour aux réglages">⬅ Réglages</button>
                <div class="jmm-game-title"></div>
                <div class="jmm-pill jmm-pill-timer">⏱️ <span class="jmm-timer">00:00</span></div>
                <div class="jmm-pill jmm-pill-score">⭐ <span class="jmm-score">0</span></div>
                <div class="jmm-pill jmm-pill-found">🎯 <span class="jmm-found">0/0</span></div>
            </div>
            <div class="jmm-main">
                <div class="jmm-board">
                    <div class="jmm-grid-wrap">
                        <div class="jmm-grid"></div>
                        <svg class="jmm-overlay" xmlns="http://www.w3.org/2000/svg"></svg>
                    </div>
                </div>
                <div class="jmm-side">
                    <div class="jmm-words-card">
                        <div class="jmm-words-title">🔎 Mots à trouver</div>
                        <div class="jmm-words"></div>
                    </div>
                    <div class="jmm-side-btns">
                        <button class="jmm-btn jmm-btn-yellow" data-role="hint"    title="Montrer la première lettre d'un mot (−15 points)">💡 Indice</button>
                        <button class="jmm-btn jmm-btn-orange" data-role="reveal"  title="Montrer / cacher la solution">👁️ Solution</button>
                        <button class="jmm-btn jmm-btn-green"  data-role="shuffle" title="Nouvelle grille avec les mêmes mots">🔄 Mélanger</button>
                        <button class="jmm-btn jmm-btn-blue"   data-role="pdf"     title="Fiche imprimable + correction">📄 PDF</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="jmm-toast"></div>

        <div class="jmm-victory">
            <div class="jmm-victory-card">
                <div class="jmm-victory-trophy">🏆</div>
                <div class="jmm-victory-title">BRAVO !</div>
                <div class="jmm-stars"></div>
                <div class="jmm-victory-stats">
                    <div class="jmm-pill">⏱️ <span class="jmm-v-time">00:00</span></div>
                    <div class="jmm-pill">⭐ <span class="jmm-v-score">0</span> pts</div>
                    <div class="jmm-pill">💡 <span class="jmm-v-hints">0</span></div>
                </div>
                <div class="jmm-victory-btns">
                    <button class="jmm-btn jmm-btn-green"  data-role="replay">🔄 Rejouer</button>
                    <button class="jmm-btn jmm-btn-violet" data-role="settings">🎨 Autre thème</button>
                    <button class="jmm-btn jmm-btn-white"  data-role="close-victory">✖ Voir la grille</button>
                </div>
            </div>
        </div>
        <canvas class="jmm-confetti"></canvas>
        <div class="jmm-resize-handle"></div>
    `;
    widget.appendChild(container);

    // ── Raccourcis DOM ────────────────────────────────────────────────────
    const $  = sel => container.querySelector(sel);
    const $$ = sel => Array.from(container.querySelectorAll(sel));
    const header       = $('.jmm-header');
    const helpPopup    = $('.jmm-help-popup');
    const setupZone    = $('.jmm-setup');
    const gameZone     = $('.jmm-game');
    const titleInput   = $('.jmm-title-input');
    const wordsInput   = $('.jmm-words-input');
    const wordCountEl  = $('.jmm-count');
    const timerCheck   = $('.jmm-timer-check');
    const fileInput    = $('.jmm-file-input');
    const gameTitleEl  = $('.jmm-game-title');
    const boardEl      = $('.jmm-board');
    const gridWrap     = $('.jmm-grid-wrap');
    const gridEl       = $('.jmm-grid');
    const overlay      = $('.jmm-overlay');
    const wordsList    = $('.jmm-words');
    const timerEl      = $('.jmm-timer');
    const timerPill    = $('.jmm-pill-timer');
    const scoreEl      = $('.jmm-score');
    const scorePill    = $('.jmm-pill-score');
    const foundEl      = $('.jmm-found');
    const foundPill    = $('.jmm-pill-found');
    const toastEl      = $('.jmm-toast');
    const victoryEl    = $('.jmm-victory');
    const starsEl      = $('.jmm-stars');
    const confettiCv   = $('.jmm-confetti');
    const revealBtn    = $('[data-role="reveal"]');
    const hintBtn      = $('[data-role="hint"]');
    const soundBtn     = $('[data-role="sound"]');
    const resizeHandle = $('.jmm-resize-handle');

    // ══════════════════════════════════════════════════════════════════════
    // ÉTAT INTERNE
    // ══════════════════════════════════════════════════════════════════════
    let _theme     = 'animaux';
    let _size      = 10;
    let _diff      = 'easy';
    let _grid      = [];      // 2D : lettres
    let _gridSize  = 10;
    let _placed    = [];      // [{word, r1,c1,r2,c2, color}]
    let _found     = [];      // [{word, r1,c1,r2,c2, color}]
    let _score     = 0;
    let _hints     = 0;
    let _revealed  = false;
    let _usedReveal = false;
    let _won       = false;
    let _elapsed   = 0;       // ms cumulées
    let _tStart    = null;    // horodatage de reprise du chrono
    let _tInterval = null;
    let _muted     = false;
    let _cellSize  = 40;
    let _drag      = null;    // sélection en cours
    let _anchor    = null;    // première lettre (mode tap-tap)
    let _toastT    = null;
    const GAP      = 3;

    // ══════════════════════════════════════════════════════════════════════
    // RÉGLAGES
    // ══════════════════════════════════════════════════════════════════════
    function parseWords(raw) {
        return (raw || '').split(',').map(w => w.trim()).filter(w => w.length > 0);
    }
    function normalizeWord(w) {
        return w.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/Œ/g, 'OE').replace(/Æ/g, 'AE').replace(/[^A-Z]/g, '');
    }
    function updateWordCount() {
        const n = parseWords(wordsInput.value).length;
        wordCountEl.textContent = n + (n > 1 ? ' mots' : ' mot');
    }
    function selectTheme(key, fill) {
        _theme = key;
        $$('.jmm-tile').forEach(t => t.classList.toggle('active', t.dataset.theme === key));
        const th = JMM_THEMES.find(t => t.key === key);
        if (!th || !fill) return;
        if (key === 'perso') {
            titleInput.value = '';
            wordsInput.value = '';
            wordsInput.focus();
        } else {
            titleInput.value = th.lbl;
            wordsInput.value = th.words;
        }
        updateWordCount();
    }
    function selectSize(n) {
        _size = n;
        $$('.jmm-chip[data-size]').forEach(c => c.classList.toggle('active', parseInt(c.dataset.size) === n));
    }
    function selectDiff(d) {
        _diff = JMM_DIRECTIONS[d] ? d : 'easy';
        $$('.jmm-diff').forEach(b => b.classList.toggle('active', b.dataset.diff === _diff));
    }

    $$('.jmm-tile').forEach(t => t.addEventListener('click', () => { JMM_SOUND_play('tick'); selectTheme(t.dataset.theme, true); }));
    $$('.jmm-chip[data-size]').forEach(c => c.addEventListener('click', () => { JMM_SOUND_play('tick'); selectSize(parseInt(c.dataset.size)); }));
    $$('.jmm-diff').forEach(b => b.addEventListener('click', () => { JMM_SOUND_play('tick'); selectDiff(b.dataset.diff); }));
    wordsInput.addEventListener('input', () => {
        updateWordCount();
        // Dès que l'on modifie la liste, on passe en « Mes mots »
        const th = JMM_THEMES.find(t => t.key === _theme);
        if (th && th.key !== 'perso' && wordsInput.value !== th.words) selectTheme('perso', false);
    });

    function JMM_SOUND_play(name) {
        if (_muted) return;
        try { JMM_SOUND[name](); } catch (e) { /* audio indisponible */ }
    }

    // ══════════════════════════════════════════════════════════════════════
    // GÉNÉRATION DE LA GRILLE
    // ══════════════════════════════════════════════════════════════════════
    function canPlace(word, row, col, dr, dc) {
        const lastR = row + (word.length - 1) * dr;
        const lastC = col + (word.length - 1) * dc;
        if (lastR >= _gridSize || lastR < 0 || lastC >= _gridSize || lastC < 0) return false;
        for (let i = 0; i < word.length; i++) {
            const ch = _grid[row + i * dr][col + i * dc];
            if (ch !== '' && ch !== word[i]) return false;
        }
        return true;
    }

    function placeWord(word, row, col, dr, dc) {
        for (let i = 0; i < word.length; i++) _grid[row + i * dr][col + i * dc] = word[i];
        _placed.push({
            word,
            r1: row, c1: col,
            r2: row + (word.length - 1) * dr,
            c2: col + (word.length - 1) * dc,
            color: JMM_COLORS[_placed.length % JMM_COLORS.length]
        });
    }

    function generateGrid() {
        const rawWords = parseWords(wordsInput.value);
        if (!rawWords.length) { showToast('✏️ Ajoute des mots d\'abord !', 'bad'); JMM_SOUND_play('wrong'); return false; }

        _gridSize = _size;
        // Normaliser, dédoublonner, trier du plus long au plus court (meilleur remplissage)
        const seen = new Set();
        const words = [];
        let tooLong = 0;
        rawWords.forEach(w => {
            const n = normalizeWord(w);
            if (n.length < 2 || seen.has(n)) return;
            if (n.length > _gridSize) { tooLong++; return; }
            seen.add(n); words.push(n);
        });
        words.sort((a, b) => b.length - a.length || Math.random() - 0.5);

        const dirs = JMM_DIRECTIONS[_diff] || JMM_DIRECTIONS.easy;
        let bestGrid = null, bestPlaced = [];
        // Plusieurs essais complets : on garde celui qui place le plus de mots
        for (let attempt = 0; attempt < 6; attempt++) {
            _grid   = Array.from({ length: _gridSize }, () => Array(_gridSize).fill(''));
            _placed = [];
            words.forEach(word => {
                for (let tries = 0; tries < 300; tries++) {
                    const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
                    const row = Math.floor(Math.random() * _gridSize);
                    const col = Math.floor(Math.random() * _gridSize);
                    if (canPlace(word, row, col, dr, dc)) { placeWord(word, row, col, dr, dc); break; }
                }
            });
            if (!bestGrid || _placed.length > bestPlaced.length) {
                bestGrid = _grid.map(r => r.slice());
                bestPlaced = _placed.map(p => Object.assign({}, p));
            }
            if (_placed.length === words.length) break;
        }
        _grid = bestGrid; _placed = bestPlaced;
        // Recolorer dans l'ordre alphabétique pour une liste harmonieuse
        _placed.sort((a, b) => a.word.localeCompare(b.word, 'fr'))
               .forEach((p, i) => { p.color = JMM_COLORS[i % JMM_COLORS.length]; });

        // Remplissage
        for (let r = 0; r < _gridSize; r++)
            for (let c = 0; c < _gridSize; c++)
                if (_grid[r][c] === '') _grid[r][c] = JMM_FILL[Math.floor(Math.random() * JMM_FILL.length)];

        const notPlaced = tooLong + (words.length - _placed.length);
        resetGameState();
        renderGame(titleInput.value.trim() || 'Mots Mêlés');
        startTimer();
        if (notPlaced > 0) {
            showToast(`⚠️ ${notPlaced} mot${notPlaced > 1 ? 's' : ''} trop long${notPlaced > 1 ? 's' : ''} ou non placé${notPlaced > 1 ? 's' : ''}`, 'bad', 2800);
        }
        autoSave();
        return true;
    }

    function resetGameState() {
        _found = []; _score = 0; _hints = 0;
        _revealed = false; _usedReveal = false; _won = false;
        _elapsed = 0; _tStart = null; _anchor = null; _drag = null;
        stopTimer();
        victoryEl.classList.remove('show');
    }

    // ══════════════════════════════════════════════════════════════════════
    // AFFICHAGE
    // ══════════════════════════════════════════════════════════════════════
    function showSetup() {
        stopTimer();
        setupZone.style.display = '';
        gameZone.style.display = 'none';
        victoryEl.classList.remove('show');
        autoSave();
    }

    function computeCellSize() {
        const n = _gridSize || 10;
        const availW = (boardEl.clientWidth || 560) - 24;
        let availH = Infinity;
        if (container.classList.contains('wf-fullboard')) {
            availH = (container.clientHeight || window.innerHeight) - 150;
        }
        const fromW = Math.floor((availW - (n - 1) * GAP) / n);
        const fromH = availH === Infinity ? fromW : Math.floor((availH - (n - 1) * GAP) / n);
        const maxCs = container.classList.contains('wf-fullboard') ? 90 : 58;
        return Math.max(16, Math.min(fromW, fromH, maxCs));
    }

    function renderGame(title) {
        setupZone.style.display = 'none';
        gameZone.style.display  = 'flex';
        gameTitleEl.textContent = title;
        timerPill.style.display = timerCheck.checked ? '' : 'none';

        // Grille
        gridEl.innerHTML = '';
        for (let r = 0; r < _gridSize; r++) {
            for (let c = 0; c < _gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'jmm-cell';
                cell.textContent = _grid[r][c];
                cell.dataset.r = r;
                cell.dataset.c = c;
                gridEl.appendChild(cell);
            }
        }

        // Liste des mots
        wordsList.innerHTML = '';
        wordsList.classList.toggle('compact', _placed.length > 12);
        [..._placed].sort((a, b) => a.word.localeCompare(b.word, 'fr')).forEach(pw => {
            const el = document.createElement('div');
            el.className = 'jmm-word';
            el.dataset.word = pw.word;
            el.innerHTML = `<span class="jmm-word-dot"></span><span class="jmm-word-txt">${pw.word}</span>`;
            wordsList.appendChild(el);
        });

        revealBtn.textContent = '👁️ Solution';
        gridWrap.classList.remove('locked');
        layoutGrid();
        refreshWordsList();
        updateHud();
    }

    function layoutGrid() {
        if (!_grid.length || gameZone.style.display === 'none') return;
        _cellSize = computeCellSize();
        const fs = Math.max(10, Math.floor(_cellSize * 0.56));
        const total = gridPixelSize();
        // Zone de jeu parfaitement carrée
        [gridWrap, gridEl].forEach(el => {
            el.style.width  = total + 'px';
            el.style.height = total + 'px';
        });
        const step = _cellSize + GAP;
        Array.from(gridEl.children).forEach(cell => {
            const r = +cell.dataset.r, c = +cell.dataset.c;
            cell.style.left     = (c * step) + 'px';
            cell.style.top      = (r * step) + 'px';
            cell.style.width    = _cellSize + 'px';
            cell.style.height   = _cellSize + 'px';
            cell.style.fontSize = fs + 'px';
        });
        drawOverlay();
    }

    function gridPixelSize() { return _gridSize * _cellSize + (_gridSize - 1) * GAP; }

    function getCell(r, c) { return gridEl.children[r * _gridSize + c] || null; }

    // Centre d'une case : calculé exactement comme la position des cases
    // (aucune mesure DOM → aucun décalage, même si le tableau est zoomé ou pivoté)
    function cellCenter(r, c) {
        const step = _cellSize + GAP;
        return [c * step + _cellSize / 2, r * step + _cellSize / 2];
    }

    function svgCapsule(r1, c1, r2, c2, color, opts) {
        opts = opts || {};
        const [x1, y1] = cellCenter(r1, c1);
        const [x2, y2] = cellCenter(r2, c2);
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color);
        ln.setAttribute('stroke-width', _cellSize * (opts.width || 0.8));
        ln.setAttribute('stroke-linecap', 'round');
        ln.setAttribute('stroke-opacity', opts.opacity != null ? opts.opacity : 0.55);
        if (opts.dash) ln.setAttribute('stroke-dasharray', opts.dash);
        if (opts.cls) ln.setAttribute('class', opts.cls);
        overlay.appendChild(ln);
        return ln;
    }

    function drawOverlay(liveLine, liveColor) {
        const total = gridPixelSize();
        overlay.setAttribute('width',  total);
        overlay.setAttribute('height', total);
        overlay.setAttribute('viewBox', `0 0 ${total} ${total}`);
        overlay.style.setProperty('background', 'transparent', 'important');
        overlay.style.width  = total + 'px';
        overlay.style.height = total + 'px';
        overlay.innerHTML = '';

        // Solution (mots non trouvés)
        if (_revealed) {
            _placed.forEach(pw => {
                if (isFound(pw.word)) return;
                svgCapsule(pw.r1, pw.c1, pw.r2, pw.c2, pw.color, { opacity: 0.35 });
            });
        }
        // Mots trouvés
        _found.forEach(f => svgCapsule(f.r1, f.c1, f.r2, f.c2, f.color, { opacity: 0.55 }));

        // Première lettre choisie (mode tap-tap)
        if (_anchor && !liveLine) {
            const [x, y] = cellCenter(_anchor.r, _anchor.c);
            const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circ.setAttribute('cx', x); circ.setAttribute('cy', y);
            circ.setAttribute('r', _cellSize * 0.42);
            circ.setAttribute('fill', '#facc15'); circ.setAttribute('fill-opacity', '0.75');
            overlay.appendChild(circ);
        }
        // Sélection en cours
        if (liveLine && liveLine.length) {
            const a = liveLine[0], b = liveLine[liveLine.length - 1];
            svgCapsule(a[0], a[1], b[0], b[1], liveColor || '#facc15', { opacity: 0.7, width: 0.84 });
        }
    }

    function isFound(word) { return _found.some(f => f.word === word); }

    function refreshWordsList() {
        wordsList.querySelectorAll('.jmm-word').forEach(el => {
            const f = _found.find(x => x.word === el.dataset.word);
            const dot = el.querySelector('.jmm-word-dot');
            if (f) {
                el.classList.add('found');
                el.style.background = f.color;
                dot.textContent = '✓';
            } else {
                el.classList.remove('found');
                el.style.background = '';
                dot.textContent = '';
            }
        });
        gridEl.querySelectorAll('.jmm-cell.found').forEach(c => c.classList.remove('found'));
        _found.forEach(f => lineCells(f.r1, f.c1, f.r2, f.c2).forEach(([r, c]) => {
            const cell = getCell(r, c); if (cell) cell.classList.add('found');
        }));
    }

    function updateHud(bump) {
        scoreEl.textContent = _score;
        foundEl.textContent = _found.length + '/' + _placed.length;
        timerEl.textContent = fmtTime(currentElapsed());
        if (bump) {
            [scorePill, foundPill].forEach(p => { p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); });
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // CHRONOMÈTRE
    // ══════════════════════════════════════════════════════════════════════
    function currentElapsed() { return _elapsed + (_tStart ? Date.now() - _tStart : 0); }
    function fmtTime(ms) {
        const s = Math.floor(ms / 1000);
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function startTimer() {
        if (_won || _tStart) return;
        _tStart = Date.now();
        clearInterval(_tInterval);
        _tInterval = setInterval(() => {
            if (!document.body.contains(widget)) { clearInterval(_tInterval); return; }
            timerEl.textContent = fmtTime(currentElapsed());
        }, 500);
    }
    function stopTimer() {
        if (_tStart) { _elapsed += Date.now() - _tStart; _tStart = null; }
        clearInterval(_tInterval); _tInterval = null;
        timerEl.textContent = fmtTime(_elapsed);
    }

    // ══════════════════════════════════════════════════════════════════════
    // SÉLECTION DES MOTS (glisser ou tap-tap)
    // ══════════════════════════════════════════════════════════════════════
    function lineCells(r1, c1, r2, c2) {
        const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
        const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
        const out = [];
        for (let i = 0; i < len; i++) out.push([r1 + i * dr, c1 + i * dc]);
        return out;
    }

    // Aligne la sélection sur l'une des 8 directions
    function snapLine(r0, c0, r, c) {
        const dr = r - r0, dc = c - c0;
        if (dr === 0 && dc === 0) return [[r0, c0]];
        const k = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
        const sdr = Math.round(Math.sin(k * Math.PI / 4));
        const sdc = Math.round(Math.cos(k * Math.PI / 4));
        let len = (sdr !== 0 && sdc !== 0) ? Math.round((Math.abs(dr) + Math.abs(dc)) / 2)
                : Math.max(Math.abs(dr), Math.abs(dc));
        // Rester dans la grille
        while (len > 0) {
            const er = r0 + sdr * len, ec = c0 + sdc * len;
            if (er >= 0 && er < _gridSize && ec >= 0 && ec < _gridSize) break;
            len--;
        }
        const out = [];
        for (let i = 0; i <= len; i++) out.push([r0 + sdr * i, c0 + sdc * i]);
        return out;
    }

    function isAligned(r0, c0, r, c) {
        const dr = r - r0, dc = c - c0;
        return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && !(dr === 0 && dc === 0);
    }

    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const cell = el && el.closest ? el.closest('.jmm-cell') : null;
        return cell && gridEl.contains(cell) ? cell : null;
    }

    function canPlay() {
        return _grid.length && gameZone.style.display !== 'none' && !_revealed && !_won;
    }

    function onGridDown(e) {
        e.stopPropagation();
        if (!canPlay()) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        e.preventDefault();
        if (typeof bringToFront === 'function') bringToFront(widget);
        helpPopup.classList.remove('show');
        try { gridWrap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        startTimer();

        const r = +cell.dataset.r, c = +cell.dataset.c;
        if (_anchor && isAligned(_anchor.r, _anchor.c, r, c)) {
            // 2ᵉ touche en mode tap-tap : de l'ancre jusqu'ici
            _drag = { r0: _anchor.r, c0: _anchor.c, r, c, pid: e.pointerId, moved: true };
        } else {
            _drag = { r0: r, c0: c, r, c, pid: e.pointerId, moved: false };
        }
        JMM_SOUND_play('tick');
        drawOverlay(snapLine(_drag.r0, _drag.c0, _drag.r, _drag.c));
    }

    function onGridMove(e) {
        if (!_drag || e.pointerId !== _drag.pid) return;
        e.preventDefault(); e.stopPropagation();
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        const r = +cell.dataset.r, c = +cell.dataset.c;
        if (r === _drag.r && c === _drag.c) return;
        _drag.r = r; _drag.c = c;
        if (r !== _drag.r0 || c !== _drag.c0) _drag.moved = true;
        drawOverlay(snapLine(_drag.r0, _drag.c0, r, c));
    }

    function onGridUp(e) {
        if (!_drag || e.pointerId !== _drag.pid) return;
        e.stopPropagation();
        try { gridWrap.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        const d = _drag; _drag = null;
        const line = snapLine(d.r0, d.c0, d.r, d.c);

        if (!d.moved || line.length < 2) {
            // Simple touche : poser / retirer l'ancre
            if (_anchor && _anchor.r === d.r0 && _anchor.c === d.c0) _anchor = null;
            else _anchor = { r: d.r0, c: d.c0 };
            drawOverlay();
            return;
        }
        _anchor = null;
        evaluate(line);
    }

    function onGridCancel() { _drag = null; drawOverlay(); }

    gridWrap.addEventListener('pointerdown',   onGridDown);
    gridWrap.addEventListener('pointermove',   onGridMove);
    gridWrap.addEventListener('pointerup',     onGridUp);
    gridWrap.addEventListener('pointercancel', onGridCancel);
    ['mousedown', 'touchstart', 'click'].forEach(ev =>
        gridWrap.addEventListener(ev, e => e.stopPropagation(), { passive: false }));

    // ── Vérification d'une sélection ──────────────────────────────────────
    function evaluate(line) {
        const a = line[0], b = line[line.length - 1];
        const str = line.map(([r, c]) => _grid[r][c]).join('');
        const rev = str.split('').reverse().join('');

        // 1) correspondance exacte de position
        let pw = _placed.find(p => !isFound(p.word) &&
            ((p.r1 === a[0] && p.c1 === a[1] && p.r2 === b[0] && p.c2 === b[1]) ||
             (p.r1 === b[0] && p.c1 === b[1] && p.r2 === a[0] && p.c2 === a[1])));
        // 2) le mot apparaît ailleurs par hasard : on l'accepte aussi
        if (!pw) pw = _placed.find(p => !isFound(p.word) && (p.word === str || p.word === rev));

        if (pw) {
            const start = pw.word === str ? a : b;
            const end   = pw.word === str ? b : a;
            markFound(pw, start, end);
            return;
        }
        if (_placed.some(p => isFound(p.word) && (p.word === str || p.word === rev))) {
            showToast('😉 Déjà trouvé !');
            drawOverlay();
            return;
        }
        // Raté
        JMM_SOUND_play('wrong');
        drawOverlay();
        const miss = svgCapsule(a[0], a[1], b[0], b[1], '#f43f5e', { opacity: 0.6 });
        miss.style.transition = 'stroke-opacity .5s';
        setTimeout(() => { miss.setAttribute('stroke-opacity', 0); }, 120);
        setTimeout(() => { if (miss.parentNode) miss.remove(); }, 700);
        gridWrap.classList.remove('shake'); void gridWrap.offsetWidth; gridWrap.classList.add('shake');
    }

    function markFound(pw, start, end) {
        _found.push({ word: pw.word, r1: start[0], c1: start[1], r2: end[0], c2: end[1], color: pw.color });
        const gain = pw.word.length * 10;
        _score += gain;
        JMM_SOUND_play('found');
        drawOverlay();
        refreshWordsList();
        // Petite animation des lettres
        lineCells(start[0], start[1], end[0], end[1]).forEach(([r, c], i) => {
            const cell = getCell(r, c);
            if (!cell) return;
            setTimeout(() => { cell.classList.remove('pop'); void cell.offsetWidth; cell.classList.add('pop'); }, i * 45);
        });
        gridEl.querySelectorAll('.jmm-cell.hint').forEach(c => c.classList.remove('hint'));
        updateHud(true);
        showToast(`🎉 ${pw.word} +${gain}`, 'good');
        if (_found.length === _placed.length) setTimeout(victory, 650);
        autoSave();
    }

    // ══════════════════════════════════════════════════════════════════════
    // INDICE / SOLUTION
    // ══════════════════════════════════════════════════════════════════════
    function giveHint() {
        if (!canPlay()) return;
        const left = _placed.filter(p => !isFound(p.word));
        if (!left.length) return;
        const pw = left[Math.floor(Math.random() * left.length)];
        const cell = getCell(pw.r1, pw.c1);
        gridEl.querySelectorAll('.jmm-cell.hint').forEach(c => c.classList.remove('hint'));
        if (cell) {
            cell.classList.add('hint');
            setTimeout(() => cell.classList.remove('hint'), 3000);
        }
        _hints++;
        _score = Math.max(0, _score - 15);
        JMM_SOUND_play('hint');
        updateHud(true);
        showToast(`💡 Cherche « ${pw.word} » : il commence ici !`);
        autoSave();
    }

    function toggleReveal() {
        if (!_grid.length || _won) return;
        _revealed = !_revealed;
        if (_revealed) {
            _usedReveal = true;
            _anchor = null;
            stopTimer();
            revealBtn.textContent = '🙈 Cacher';
            gridWrap.classList.add('locked');
        } else {
            revealBtn.textContent = '👁️ Solution';
            gridWrap.classList.remove('locked');
        }
        drawOverlay();
        autoSave();
    }

    // ══════════════════════════════════════════════════════════════════════
    // VICTOIRE + CONFETTIS
    // ══════════════════════════════════════════════════════════════════════
    function computeStars() {
        if (_usedReveal) return 1;
        if (_hints === 0) return 3;
        if (_hints <= 2) return 2;
        return 1;
    }

    function victory(silent) {
        _won = true;
        stopTimer();
        $('.jmm-v-time').textContent  = fmtTime(_elapsed);
        $('.jmm-v-score').textContent = _score;
        $('.jmm-v-hints').textContent = _hints;
        const n = computeStars();
        starsEl.innerHTML = [0, 1, 2].map(i =>
            `<span class="${i < n ? '' : 'off'}" style="animation-delay:${0.25 + i * 0.25}s">⭐</span>`).join('');
        victoryEl.classList.add('show');
        if (!silent) {
            JMM_SOUND_play('victory');
            launchConfetti();
        }
        autoSave();
    }

    function launchConfetti() {
        const W = container.clientWidth, H = container.clientHeight;
        confettiCv.width = W; confettiCv.height = H;
        const ctx = confettiCv.getContext('2d');
        const parts = Array.from({ length: 160 }, () => ({
            x: W / 2 + (Math.random() - 0.5) * 120,
            y: H * 0.45,
            vx: (Math.random() - 0.5) * 14,
            vy: -Math.random() * 13 - 4,
            s: 6 + Math.random() * 7,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.4,
            col: JMM_COLORS[Math.floor(Math.random() * JMM_COLORS.length)]
        }));
        let frame = 0;
        (function step() {
            ctx.clearRect(0, 0, W, H);
            parts.forEach(p => {
                p.vy += 0.35; p.vx *= 0.99;
                p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y); ctx.rotate(p.rot);
                ctx.fillStyle = p.col;
                ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
                ctx.restore();
            });
            if (++frame < 190 && document.body.contains(widget)) requestAnimationFrame(step);
            else ctx.clearRect(0, 0, W, H);
        })();
    }

    // ── Toast ─────────────────────────────────────────────────────────────
    function showToast(msg, kind, dur) {
        toastEl.textContent = msg;
        toastEl.className = 'jmm-toast show' + (kind ? ' ' + kind : '');
        clearTimeout(_toastT);
        _toastT = setTimeout(() => { toastEl.className = 'jmm-toast'; }, dur || 1600);
    }

    // ══════════════════════════════════════════════════════════════════════
    // SAUVEGARDE (save-load.js)
    // ══════════════════════════════════════════════════════════════════════
    function getData() {
        return {
            theme: _theme, title: titleInput.value, words: wordsInput.value,
            size: _size, diff: _diff, timerOn: timerCheck.checked, muted: _muted,
            inGame: gameZone.style.display !== 'none' && _grid.length > 0,
            gameTitle: gameTitleEl.textContent,
            gridSize: _gridSize, grid: _grid, placed: _placed, found: _found,
            score: _score, hints: _hints, revealed: _revealed, usedReveal: _usedReveal,
            won: _won, elapsed: currentElapsed(),
            containerW: container.offsetWidth
        };
    }

    function setData(d) {
        if (!d) return;
        if (d.title != null) titleInput.value = d.title;
        if (d.words != null) wordsInput.value = d.words;
        selectTheme(d.theme || 'animaux', false);
        selectSize(d.size || 10);
        selectDiff(d.diff || 'easy');
        timerCheck.checked = d.timerOn !== false;
        _muted = !!d.muted;
        soundBtn.textContent = _muted ? '🔇' : '🔊';
        updateWordCount();
        if (d.containerW) container.style.width = d.containerW + 'px';

        if (d.inGame && d.grid && d.grid.length) {
            _grid = d.grid; _gridSize = d.gridSize || d.grid.length;
            _placed = d.placed || [];
            resetGameState();
            _found = d.found || [];
            _score = d.score || 0; _hints = d.hints || 0;
            _usedReveal = !!d.usedReveal;
            _elapsed = d.elapsed || 0;
            renderGame(d.gameTitle || d.title || 'Mots Mêlés');
            if (d.revealed) toggleReveal();
            if (d.won) victory(true);
            // Le chrono reprendra à la première interaction
            updateHud();
        }
    }

    // ── Export / import JSON (liste de mots) ──────────────────────────────
    function fileStamp(title) {
        const clean = (title || 'motsmeles').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '');
        const now = new Date();
        const ds = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        return `lebureauduprof_jeu_motsmeles_${clean}_${ds}`;
    }

    function exportJSON() {
        const data = { title: titleInput.value.trim(), words: wordsInput.value, size: _size, diff: _diff };
        const jsonStr = JSON.stringify(data, null, 2);
        const filename = fileStamp(data.title) + '.json';
        if (window.Android && window.Android.savePdfFromBase64) {
            window.Android.savePdfFromBase64(btoa(unescape(encodeURIComponent(jsonStr))), filename);
        } else {
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
    }

    function importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.title) titleInput.value = data.title;
                if (data.words) wordsInput.value = data.words;
                // Compatibilité avec les fichiers du widget Mots Mêlés classique
                if (data.size) selectSize([8, 10, 12, 15].reduce((p, v) => Math.abs(v - data.size) < Math.abs(p - data.size) ? v : p, 10));
                if (data.diff) selectDiff(data.diff === 'hard' ? 'medium' : data.diff);
                selectTheme('perso', false);
                updateWordCount();
                showSetup();
                showToast('📂 Liste chargée !', 'good');
            } catch (err) {
                showToast('❌ Fichier invalide', 'bad');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    // ── Export PDF (grille vierge + correction) ───────────────────────────
    function exportPDF() {
        if (!_grid.length) return;
        function doExport() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const title = gameTitleEl.textContent || titleInput.value.trim() || 'Mots Mêlés';
            const words = _placed.map(p => p.word).sort((a, b) => a.localeCompare(b, 'fr'));
            const cs = Math.min(10, Math.floor(170 / _gridSize));
            const startX = (210 - _gridSize * cs) / 2;
            const startY = 36;
            pdfPage(doc, title, startX, startY, cs, words, false);
            doc.addPage();
            pdfPage(doc, title + ' (CORRECTION)', startX, startY, cs, words, true);
            const filename = fileStamp(title) + '.pdf';
            if (window.Android && window.Android.savePdfFromBase64) {
                window.Android.savePdfFromBase64(doc.output('datauristring').split(',')[1], filename);
            } else {
                doc.save(filename);
            }
        }
        if (window.jspdf) doExport();
        else {
            const sc = document.createElement('script');
            sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            sc.onload = doExport;
            sc.onerror = () => showToast('❌ PDF indisponible (hors ligne ?)', 'bad');
            document.head.appendChild(sc);
        }
    }

    function pdfPage(doc, title, startX, startY, cs, words, showSol) {
        doc.setFont('helvetica', 'bold').setFontSize(18).text(title, 105, 20, { align: 'center' });
        if (showSol) {
            doc.setGState(new doc.GState({ opacity: 0.3 }));
            doc.setDrawColor(150, 150, 150);
            doc.setLineCap('round');
            doc.setLineWidth(cs - 3);
            _placed.forEach(p => {
                doc.line(startX + p.c1 * cs + cs / 2, startY + p.r1 * cs + cs / 2,
                         startX + p.c2 * cs + cs / 2, startY + p.r2 * cs + cs / 2);
            });
            doc.setGState(new doc.GState({ opacity: 1 }));
        }
        const fsz = Math.max(8, Math.round(cs * 1.35));
        _grid.forEach((row, r) => row.forEach((ch, c) => {
            const x = startX + c * cs, y = startY + r * cs;
            doc.setDrawColor(200).setLineWidth(0.1).rect(x, y, cs, cs);
            doc.setTextColor(0).setFont('helvetica', 'bold').setFontSize(fsz)
               .text(ch, x + cs / 2, y + cs / 2 + fsz * 0.12, { align: 'center' });
        }));
        const yList = startY + _gridSize * cs;
        doc.setTextColor(0).setFont('helvetica', 'bold').setFontSize(12).text('Mots à trouver :', startX, yList + 12);
        doc.setFont('helvetica', 'normal').setFontSize(10);
        const nbPerCol = Math.ceil(words.length / 3) || 1;
        words.forEach((w, i) => {
            doc.text('• ' + w, startX + Math.floor(i / nbPerCol) * 55, yList + 19 + (i % nbPerCol) * 5);
        });
    }

    // ── autoSave ──────────────────────────────────────────────────────────
    let _saveT = null;
    function autoSave() {
        clearTimeout(_saveT);
        _saveT = setTimeout(() => { if (typeof saveBoard === 'function') saveBoard(); }, 150);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ÉVÉNEMENTS
    // ══════════════════════════════════════════════════════════════════════
    // Empêcher le déplacement du widget quand on utilise un contrôle
    const INTERACTIVE = 'button, input, textarea, select, label, .jmm-tile, .jmm-chip, .jmm-diff, .jmm-words, .jmm-help-popup, .jmm-victory-card';
    ['mousedown', 'pointerdown', 'touchstart', 'pointerup'].forEach(ev =>
        container.addEventListener(ev, e => {
            if (e.target.closest && e.target.closest(INTERACTIVE)) e.stopPropagation();
        }, { passive: true }));
    // Focus correct au stylet dans les champs texte
    [titleInput, wordsInput].forEach(el =>
        el.addEventListener('pointerup', () => el.focus()));

    function on(role, fn) {
        const el = $(`[data-role="${role}"]`);
        if (el) el.addEventListener('click', e => { e.stopPropagation(); fn(e); });
    }
    on('play',     () => { JMM_SOUND_play('tick'); generateGrid(); });
    on('save-json', exportJSON);
    on('back',     showSetup);
    on('hint',     giveHint);
    on('reveal',   toggleReveal);
    on('shuffle',  () => { generateGrid(); });
    on('pdf',      exportPDF);
    on('replay',   () => { generateGrid(); });
    on('settings', showSetup);
    on('close-victory', () => victoryEl.classList.remove('show'));
    on('sound', () => {
        _muted = !_muted;
        soundBtn.textContent = _muted ? '🔇' : '🔊';
        if (!_muted) JMM_SOUND_play('tick');
        autoSave();
    });
    on('help', () => helpPopup.classList.toggle('show'));
    fileInput.addEventListener('change', importJSON);
    timerCheck.addEventListener('change', () => autoSave());
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target) || !e.target.closest('.jmm-help-popup')) helpPopup.classList.remove('show');
    });

    // ── Boutons fenêtre (min/max/close) ───────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false, _savedContainerW = null;

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🔍 Mots Mêlés – le jeu', { onExpand: () => requestAnimationFrame(layoutGrid) });
    });
    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) {
            _savedContainerW = container.style.width;
            container.classList.add('wf-fullboard');
        } else {
            container.classList.remove('wf-fullboard');
            if (_savedContainerW) container.style.width = _savedContainerW;
        }
        requestAnimationFrame(layoutGrid);
    });
    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        clearInterval(_tInterval);
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Redimensionnement (largeur) ───────────────────────────────────────
    let _resizeStartW = 0;
    resizeHandle.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        _resizeStartW = container.offsetWidth;
        const startX = e.clientX;
        try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        const onMove = ev => { container.style.width = Math.max(420, _resizeStartW + ev.clientX - startX) + 'px'; };
        const onUp = () => {
            resizeHandle.removeEventListener('pointermove', onMove);
            resizeHandle.removeEventListener('pointerup', onUp);
            resizeHandle.removeEventListener('pointercancel', onUp);
            autoSave();
        };
        resizeHandle.addEventListener('pointermove', onMove);
        resizeHandle.addEventListener('pointerup', onUp);
        resizeHandle.addEventListener('pointercancel', onUp);
    });
    ['mousedown', 'touchstart'].forEach(ev => resizeHandle.addEventListener(ev, e => e.stopPropagation(), { passive: true }));

    // Recalcul de la grille quand la taille change
    if (typeof ResizeObserver !== 'undefined') {
        let _raf = null;
        new ResizeObserver(() => {
            cancelAnimationFrame(_raf);
            _raf = requestAnimationFrame(layoutGrid);
        }).observe(container);
    }

    // Focus / premier plan
    function _widgetActivate(e) {
        if (e.target.closest && e.target.closest(INTERACTIVE)) return;
        if (typeof bringToFront === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    }
    widget.addEventListener('mousedown',   _widgetActivate);
    widget.addEventListener('pointerdown', _widgetActivate);

    // ══════════════════════════════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════════════════════════════
    selectTheme('animaux', true);
    selectSize(10);
    selectDiff('easy');

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    // Exposer getData/setData pour save-load.js
    widget._jmmGetData = getData;
    widget._jmmSetData = setData;

    if (savedData) {
        requestAnimationFrame(() => requestAnimationFrame(() => setData(savedData)));
    } else if (typeof saveBoard === 'function') {
        saveBoard();
    }
    return widget;
}

// ── Compatibilité : createWidget('jeu-motsmeles') ─────────────────────────
(function () {
    function install() {
        if (typeof window.createWidget !== 'function' || window.createWidget._jmmHooked) return;
        const orig = window.createWidget;
        const hooked = function (type) {
            if (type === 'jeu-motsmeles') return createJeuMotsMelesWidget();
            return orig.apply(this, arguments);
        };
        hooked._jmmHooked = true;
        window.createWidget = hooked;
    }
    install();
    window.addEventListener('DOMContentLoaded', install);
    window.addEventListener('load', install);
})();
