// =========================================================================
// WIDGET LE MOT LE PLUS LONG — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Tirage de lettres : l'élève compose le mot le plus long possible.
// 3 niveaux : facile (7 lettres) / moyen (8 lettres) / difficile (10 lettres)
// Dictionnaire : le même que l'activité « Le mot le plus long »
//   → nécessite widget-mot-le-plus-long.js chargé AVANT ce fichier.
//
// Dépendances : widget-mot-le-plus-long.js, board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    // ── Mini-barre collapse (partagée avec les autres widgets) ─────────────
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

    // ── Boutons fenêtre (CSS partagé) ──────────────────────────────────────
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

    // ── CSS du jeu ─────────────────────────────────────────────────────────
    if (!document.getElementById('widget-jeu-mlpl-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-mlpl-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Patrick+Hand&display=swap');

        .widget[data-type="jeu-mot-le-plus-long"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Palette : ciel, encre, tomate (voyelles), prune (consonnes), soleil, menthe, papier */
        .jmlpl-container {
            --jmlpl-s: 1;
            --ciel: #8FD3FE;
            --ciel-fonce: #5DB8F2;
            --encre: #1F2A5A;
            --tomate: #FF6B6B;
            --tomate-fonce: #D94848;
            --prune: #7B6CF6;
            --prune-fonce: #5646D6;
            --soleil: #FFD23F;
            --soleil-fonce: #E0A800;
            --menthe: #3DD9B3;
            --menthe-fonce: #1FAE8B;
            --papier: #FFFDF6;

            width: 620px;
            box-sizing: border-box;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: calc(10px * var(--jmlpl-s));
            padding: calc(14px * var(--jmlpl-s)) calc(16px * var(--jmlpl-s)) calc(14px * var(--jmlpl-s));
            border-radius: calc(22px * var(--jmlpl-s));
            border: calc(4px * var(--jmlpl-s)) solid #fff;
            background-color: var(--ciel);
            background-image: radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 1.6px);
            background-size: calc(18px * var(--jmlpl-s)) calc(18px * var(--jmlpl-s));
            box-shadow: 0 calc(8px * var(--jmlpl-s)) 0 var(--ciel-fonce), 0 12px 28px rgba(31,42,90,0.25);
            font-family: 'Fredoka', 'Comic Sans MS', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .jmlpl-container.wf-minimized > *:not(.jmlpl-header) { display: none !important; }
        .jmlpl-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: auto !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 40px !important;
        }

        /* ── En-tête ── */
        .jmlpl-header {
            display: flex; align-items: center; gap: calc(8px * var(--jmlpl-s));
            cursor: move;
        }
        .jmlpl-title {
            font-size: calc(22px * var(--jmlpl-s));
            font-weight: 700;
            color: #fff;
            text-shadow: 0 calc(2px * var(--jmlpl-s)) 0 var(--encre), 0 0 calc(1px * var(--jmlpl-s)) var(--encre);
            -webkit-text-stroke: calc(1px * var(--jmlpl-s)) var(--encre);
            paint-order: stroke fill;
            letter-spacing: 0.5px;
            pointer-events: none;
            white-space: nowrap;
        }
        .jmlpl-title-owl { font-size: calc(26px * var(--jmlpl-s)); pointer-events: none; }
        .jmlpl-help-btn {
            width: calc(24px * var(--jmlpl-s)); height: calc(24px * var(--jmlpl-s));
            border-radius: 50%; border: 2px solid var(--encre); background: #fff;
            color: var(--encre); font-family: inherit; font-weight: 700;
            font-size: calc(13px * var(--jmlpl-s)); cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .jmlpl-help-btn:hover { background: var(--soleil); }

        /* ── Niveaux + chrono ── */
        .jmlpl-levels { display: flex; gap: calc(6px * var(--jmlpl-s)); flex-wrap: wrap; align-items: center; }
        .jmlpl-lvl {
            font-family: inherit; font-weight: 600;
            font-size: calc(13px * var(--jmlpl-s));
            padding: calc(5px * var(--jmlpl-s)) calc(12px * var(--jmlpl-s));
            border-radius: 999px; border: 2px solid var(--encre);
            background: rgba(255,255,255,0.7); color: var(--encre);
            cursor: pointer; transition: transform .1s, background .15s;
        }
        .jmlpl-lvl:hover { background: #fff; }
        .jmlpl-lvl:active { transform: scale(0.95); }
        .jmlpl-lvl.active { background: var(--encre); color: #fff; }
        .jmlpl-lvl small { font-weight: 500; opacity: 0.75; font-size: 0.8em; }
        .jmlpl-chrono-toggle { margin-left: auto; }
        .jmlpl-chrono-toggle.on { background: var(--menthe); color: var(--encre); }

        /* ── Plateau de lettres ── */
        .jmlpl-stage {
            background: rgba(255,255,255,0.45);
            border: 3px dashed rgba(255,255,255,0.9);
            border-radius: calc(18px * var(--jmlpl-s));
            padding: calc(12px * var(--jmlpl-s)) calc(8px * var(--jmlpl-s)) calc(10px * var(--jmlpl-s));
            display: flex; flex-direction: column; gap: calc(10px * var(--jmlpl-s));
        }
        .jmlpl-tiles {
            display: flex; flex-wrap: wrap; justify-content: center;
            gap: calc(7px * var(--jmlpl-s));
            min-height: calc(64px * var(--jmlpl-s));
        }
        .jmlpl-tile, .jmlpl-slot-tile {
            --r: 0deg;
            display: inline-flex; align-items: center; justify-content: center;
            width: calc(46px * var(--jmlpl-s)); height: calc(52px * var(--jmlpl-s));
            border-radius: calc(12px * var(--jmlpl-s));
            font-family: 'Fredoka', 'Comic Sans MS', sans-serif;
            font-weight: 700;
            font-size: calc(30px * var(--jmlpl-s));
            color: #fff;
            text-shadow: 0 2px 0 rgba(0,0,0,0.18);
            cursor: pointer;
            transform: rotate(var(--r));
            transition: transform .12s, opacity .15s, box-shadow .12s;
            position: relative;
            box-sizing: border-box;
            border: 3px solid rgba(255,255,255,0.55);
        }
        .jmlpl-tile.voyelle, .jmlpl-slot-tile.voyelle {
            background: var(--tomate);
            box-shadow: 0 calc(6px * var(--jmlpl-s)) 0 var(--tomate-fonce);
        }
        .jmlpl-tile.consonne, .jmlpl-slot-tile.consonne {
            background: var(--prune);
            box-shadow: 0 calc(6px * var(--jmlpl-s)) 0 var(--prune-fonce);
        }
        .jmlpl-tile:hover:not(.used) { transform: rotate(0deg) translateY(calc(-3px * var(--jmlpl-s))) scale(1.06); }
        .jmlpl-tile:active:not(.used) { transform: translateY(calc(4px * var(--jmlpl-s))); box-shadow: 0 calc(2px * var(--jmlpl-s)) 0 rgba(0,0,0,0.25); }
        .jmlpl-tile.used {
            opacity: 0.22; cursor: default;
            transform: rotate(var(--r)) translateY(calc(5px * var(--jmlpl-s)));
            box-shadow: none;
        }
        .jmlpl-container.locked .jmlpl-tile { cursor: not-allowed; }

        @keyframes jmlpl-drop {
            0%   { transform: translateY(calc(-60px * var(--jmlpl-s))) rotate(-20deg); opacity: 0; }
            60%  { transform: translateY(calc(6px * var(--jmlpl-s))) rotate(var(--r)); opacity: 1; }
            100% { transform: translateY(0) rotate(var(--r)); opacity: 1; }
        }
        .jmlpl-tile.drop { animation: jmlpl-drop .45s cubic-bezier(.3,1.4,.6,1) both; }

        /* ── Chrono ── */
        .jmlpl-timer { display: none; align-items: center; gap: calc(8px * var(--jmlpl-s)); padding: 0 calc(6px * var(--jmlpl-s)); }
        .jmlpl-timer.show { display: flex; }
        .jmlpl-timer-track {
            flex: 1; height: calc(12px * var(--jmlpl-s)); border-radius: 999px;
            background: rgba(31,42,90,0.15); overflow: hidden;
            border: 2px solid var(--encre);
        }
        .jmlpl-timer-fill { height: 100%; width: 100%; background: var(--menthe); transition: width 1s linear, background .3s; }
        .jmlpl-timer-fill.urgent { background: var(--tomate); }
        .jmlpl-timer-label { font-weight: 700; font-size: calc(15px * var(--jmlpl-s)); min-width: calc(44px * var(--jmlpl-s)); text-align: right; }

        /* ── Rail de réponse ── */
        .jmlpl-answer {
            display: flex; justify-content: center; flex-wrap: wrap;
            gap: calc(6px * var(--jmlpl-s));
            min-height: calc(60px * var(--jmlpl-s));
            padding: calc(8px * var(--jmlpl-s));
            border-radius: calc(16px * var(--jmlpl-s));
            background: var(--encre);
            box-shadow: inset 0 calc(4px * var(--jmlpl-s)) 0 rgba(0,0,0,0.25);
        }
        .jmlpl-slot {
            width: calc(44px * var(--jmlpl-s)); height: calc(48px * var(--jmlpl-s));
            border-radius: calc(10px * var(--jmlpl-s));
            border: 2px dashed rgba(255,255,255,0.35);
            box-sizing: border-box;
        }
        .jmlpl-answer .jmlpl-slot-tile {
            width: calc(44px * var(--jmlpl-s)); height: calc(48px * var(--jmlpl-s));
            font-size: calc(26px * var(--jmlpl-s));
        }
        .jmlpl-answer .jmlpl-slot-tile:hover { transform: translateY(calc(-2px * var(--jmlpl-s))); filter: brightness(1.08); }
        .jmlpl-answer .jmlpl-slot-tile.hint { outline: 3px solid var(--soleil); outline-offset: 2px; }
        @keyframes jmlpl-pop { 0% { transform: scale(0.4); } 70% { transform: scale(1.12); } 100% { transform: scale(1); } }
        .jmlpl-slot-tile.pop { animation: jmlpl-pop .22s ease-out; }
        @keyframes jmlpl-shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(calc(-8px * var(--jmlpl-s))); }
            40% { transform: translateX(calc(8px * var(--jmlpl-s))); }
            60% { transform: translateX(calc(-5px * var(--jmlpl-s))); }
            80% { transform: translateX(calc(5px * var(--jmlpl-s))); }
        }
        .jmlpl-answer.shake { animation: jmlpl-shake .4s ease; }
        @keyframes jmlpl-glow { 0%,100% { box-shadow: inset 0 4px 0 rgba(0,0,0,0.25); } 50% { box-shadow: inset 0 4px 0 rgba(0,0,0,0.25), 0 0 0 6px var(--menthe); } }
        .jmlpl-answer.good { animation: jmlpl-glow .6s ease; }

        /* ── Boutons d'action ── */
        .jmlpl-actions { display: flex; justify-content: center; gap: calc(8px * var(--jmlpl-s)); flex-wrap: wrap; }
        .jmlpl-btn {
            font-family: inherit; font-weight: 600;
            font-size: calc(14px * var(--jmlpl-s));
            padding: calc(7px * var(--jmlpl-s)) calc(14px * var(--jmlpl-s));
            border-radius: calc(12px * var(--jmlpl-s));
            border: 2px solid var(--encre);
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(4px * var(--jmlpl-s)) 0 var(--encre);
            cursor: pointer; white-space: nowrap;
            transition: transform .08s, box-shadow .08s, background .15s;
        }
        .jmlpl-btn:hover { background: #F2F6FF; }
        .jmlpl-btn:active { transform: translateY(calc(3px * var(--jmlpl-s))); box-shadow: 0 calc(1px * var(--jmlpl-s)) 0 var(--encre); }
        .jmlpl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jmlpl-btn-go {
            background: var(--soleil); font-weight: 700;
            font-size: calc(16px * var(--jmlpl-s));
            padding: calc(7px * var(--jmlpl-s)) calc(22px * var(--jmlpl-s));
        }
        .jmlpl-btn-go:hover { background: #FFDD66; }
        .jmlpl-btn.on { background: var(--menthe); }
        .jmlpl-btn:focus-visible, .jmlpl-lvl:focus-visible, .jmlpl-tile:focus-visible { outline: 3px solid var(--soleil); outline-offset: 2px; }

        /* ── Chouette qui parle ── */
        .jmlpl-talk { display: flex; align-items: flex-end; gap: calc(8px * var(--jmlpl-s)); }
        .jmlpl-owl { font-size: calc(40px * var(--jmlpl-s)); line-height: 1; flex-shrink: 0; transform-origin: bottom center; }
        @keyframes jmlpl-hop { 0%,100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(calc(-10px * var(--jmlpl-s))) rotate(-8deg); } 60% { transform: translateY(0) rotate(6deg); } }
        .jmlpl-owl.hop { animation: jmlpl-hop .5s ease; }
        .jmlpl-bubble {
            flex: 1; position: relative;
            background: #fff; border: 2px solid var(--encre);
            border-radius: calc(16px * var(--jmlpl-s));
            padding: calc(8px * var(--jmlpl-s)) calc(12px * var(--jmlpl-s));
            font-size: calc(15px * var(--jmlpl-s)); font-weight: 500; line-height: 1.35;
            min-height: calc(22px * var(--jmlpl-s));
        }
        .jmlpl-bubble::before {
            content: ''; position: absolute; left: calc(-10px * var(--jmlpl-s)); bottom: calc(10px * var(--jmlpl-s));
            border-width: calc(7px * var(--jmlpl-s)) calc(10px * var(--jmlpl-s)) calc(7px * var(--jmlpl-s)) 0;
            border-style: solid; border-color: transparent var(--encre) transparent transparent;
        }
        .jmlpl-bubble::after {
            content: ''; position: absolute; left: calc(-6px * var(--jmlpl-s)); bottom: calc(12px * var(--jmlpl-s));
            border-width: calc(5px * var(--jmlpl-s)) calc(7px * var(--jmlpl-s)) calc(5px * var(--jmlpl-s)) 0;
            border-style: solid; border-color: transparent #fff transparent transparent;
        }
        .jmlpl-bubble.good { background: #E4FBF4; }
        .jmlpl-bubble.good::after { border-right-color: #E4FBF4; }
        .jmlpl-bubble.bad  { background: #FFF0F0; }
        .jmlpl-bubble.bad::after { border-right-color: #FFF0F0; }
        .jmlpl-bubble.tip  { background: #FFF8D6; }
        .jmlpl-bubble.tip::after { border-right-color: #FFF8D6; }
        .jmlpl-bubble b { font-weight: 700; letter-spacing: 1px; }

        /* ── Cahier « Mes mots » ── */
        .jmlpl-notebook-host { position: relative; }
        .jmlpl-notebook {
            position: relative;
            background-color: var(--papier);
            background-image:
                linear-gradient(90deg, transparent calc(38px * var(--jmlpl-s)), #F5A3A3 calc(38px * var(--jmlpl-s)), #F5A3A3 calc(40px * var(--jmlpl-s)), transparent calc(40px * var(--jmlpl-s))),
                repeating-linear-gradient(180deg, transparent 0, transparent calc(27px * var(--jmlpl-s)), #C9D8F5 calc(27px * var(--jmlpl-s)), #C9D8F5 calc(28px * var(--jmlpl-s)));
            border-radius: calc(6px * var(--jmlpl-s)) calc(16px * var(--jmlpl-s)) calc(16px * var(--jmlpl-s)) calc(6px * var(--jmlpl-s));
            border: 2px solid var(--encre);
            box-shadow: calc(4px * var(--jmlpl-s)) calc(4px * var(--jmlpl-s)) 0 rgba(31,42,90,0.2);
            padding: calc(6px * var(--jmlpl-s)) calc(12px * var(--jmlpl-s)) calc(10px * var(--jmlpl-s)) calc(50px * var(--jmlpl-s));
            min-height: calc(110px * var(--jmlpl-s));
            transition: filter .15s;
        }
        .jmlpl-notebook.blur-behind { filter: blur(5px); pointer-events: none; }
        .jmlpl-notebook-head {
            display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
            flex-wrap: wrap;
            font-weight: 700; font-size: calc(15px * var(--jmlpl-s));
            line-height: calc(28px * var(--jmlpl-s));
        }
        .jmlpl-best { font-weight: 500; font-size: calc(14px * var(--jmlpl-s)); }
        .jmlpl-stars { letter-spacing: 2px; font-size: calc(16px * var(--jmlpl-s)); }
        .jmlpl-words {
            display: flex; flex-wrap: wrap; gap: 0 calc(18px * var(--jmlpl-s));
            max-height: calc(168px * var(--jmlpl-s)); overflow-y: auto;
        }
        .jmlpl-container.wf-fullboard .jmlpl-words { max-height: none; }
        .jmlpl-word {
            font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
            font-size: calc(21px * var(--jmlpl-s));
            line-height: calc(28px * var(--jmlpl-s));
            color: #2B3A8C;
            white-space: nowrap;
        }
        .jmlpl-word sup { font-family: 'Fredoka', sans-serif; font-size: 0.55em; color: #8A93B8; margin-left: 2px; }
        .jmlpl-word.best { color: var(--menthe-fonce); }
        .jmlpl-word.best::after { content: ' ★'; color: var(--soleil-fonce); }
        .jmlpl-empty {
            font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
            font-size: calc(18px * var(--jmlpl-s)); line-height: calc(28px * var(--jmlpl-s));
            color: #9AA3C7;
        }

        /* ── Solutions (superposées au cahier) ── */
        .jmlpl-solution {
            display: none; position: absolute; inset: 0;
            align-items: center; justify-content: center;
            background: rgba(255,255,255,0.3);
            border-radius: calc(16px * var(--jmlpl-s));
            z-index: 5; padding: calc(8px * var(--jmlpl-s)); box-sizing: border-box;
        }
        .jmlpl-solution.show { display: flex; }
        .jmlpl-solution-card {
            background: #fff; border: 3px solid var(--encre);
            border-radius: calc(16px * var(--jmlpl-s));
            box-shadow: 0 calc(6px * var(--jmlpl-s)) 0 var(--encre);
            padding: calc(12px * var(--jmlpl-s)) calc(18px * var(--jmlpl-s));
            text-align: center; max-width: 100%; box-sizing: border-box;
        }
        .jmlpl-solution-card h4 { margin: 0 0 calc(6px * var(--jmlpl-s)); font-size: calc(16px * var(--jmlpl-s)); }
        .jmlpl-sol-group { margin: calc(4px * var(--jmlpl-s)) 0; }
        .jmlpl-sol-len { font-size: calc(12px * var(--jmlpl-s)); color: #6B7399; font-weight: 600; }
        .jmlpl-sol-words { display: flex; flex-wrap: wrap; justify-content: center; gap: calc(6px * var(--jmlpl-s)); margin-top: 2px; }
        .jmlpl-sol-word {
            background: var(--soleil); border-radius: 999px;
            padding: calc(2px * var(--jmlpl-s)) calc(10px * var(--jmlpl-s));
            font-weight: 700; letter-spacing: 1.5px; font-size: calc(15px * var(--jmlpl-s));
        }
        .jmlpl-sol-word { color: var(--encre); text-decoration: none; cursor: pointer; }
        .jmlpl-sol-word:hover { filter: brightness(1.06); text-decoration: underline; }
        .jmlpl-sol-word.found { background: var(--menthe); }

        /* ── Barre du bas ── */
        .jmlpl-bottom { display: flex; gap: calc(8px * var(--jmlpl-s)); flex-wrap: wrap; justify-content: center; }

        /* ── Aide ── */
        .jmlpl-help-popup {
            display: none; position: absolute; top: 48px; right: 12px;
            width: 300px; z-index: 20;
            background: #fff; border: 3px solid var(--encre); border-radius: 14px;
            box-shadow: 0 6px 0 var(--encre);
            padding: 12px 14px; font-size: 13px; line-height: 1.45;
        }
        .jmlpl-help-popup.show { display: block; }
        .jmlpl-help-popup h4 { margin: 0 0 6px; font-size: 15px; }
        .jmlpl-help-popup p { margin: 0 0 8px; }
        .jmlpl-help-popup .mini {
            display: inline-block; width: 16px; height: 16px; border-radius: 4px; vertical-align: -3px;
        }

        /* ── Confettis ── */
        .jmlpl-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 30; border-radius: inherit; }
        .jmlpl-confetti i {
            position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px;
            animation: jmlpl-fall 1.6s ease-in forwards;
        }
        @keyframes jmlpl-fall {
            to { transform: translateY(520px) rotate(540deg); opacity: 0; }
        }

        /* ── Poignées resize ── */
        .jmlpl-rh { position: absolute; z-index: 10; opacity: 0; transition: opacity .2s; }
        .jmlpl-container:hover .jmlpl-rh { opacity: 1; }
        .jmlpl-rh-se { bottom: 0; right: 0; width: 16px; height: 16px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, #fff 50%); border-radius: 0 0 16px 0; }
        .jmlpl-rh-sw { bottom: 0; left: 0; width: 16px; height: 16px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, #fff 50%); border-radius: 0 0 0 16px; }
        .jmlpl-rh-ne { top: 0; right: 0; width: 16px; height: 16px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, #fff 50%); border-radius: 0 16px 0 0; }
        .jmlpl-rh-nw { top: 0; left: 0; width: 16px; height: 16px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, #fff 50%); border-radius: 16px 0 0 0; }
        .jmlpl-rh-n { top: 0; left: 16px; right: 16px; height: 5px; cursor: n-resize; }
        .jmlpl-rh-s { bottom: 0; left: 16px; right: 16px; height: 5px; cursor: s-resize; }
        .jmlpl-rh-e { top: 16px; bottom: 16px; right: 0; width: 5px; cursor: e-resize; }
        .jmlpl-rh-w { top: 16px; bottom: 16px; left: 0; width: 5px; cursor: w-resize; }
        .jmlpl-rh-n:hover, .jmlpl-rh-s:hover, .jmlpl-rh-e:hover, .jmlpl-rh-w:hover { background: rgba(255,255,255,0.5); }

        @media (prefers-reduced-motion: reduce) {
            .jmlpl-container *, .jmlpl-container *::before, .jmlpl-container *::after {
                animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // DICTIONNAIRE — le même que l'activité « Le mot le plus long »
    // Le jeu utilise directement les fonctions de widget-mot-le-plus-long.js
    // (chargé avant ce fichier dans index.html) :
    //   • en ligne : liste de 336 000 mots vérifiés avec le Wiktionnaire ;
    //   • hors ligne : dictionnaire intégré de l'activité (9 000 mots courants).
    // Mêmes règles : noms, adjectifs (pluriels, féminins), infinitifs et mots
    // invariables. Refusés : verbes conjugués, noms propres, onomatopées,
    // mots étrangers.
    // =========================================================================
    function dicoOK() {
        return typeof _mlGetDico === 'function' && typeof _mlSolve === 'function' &&
               typeof _mlSolveExternal === 'function' && typeof _mlCheckWord === 'function';
    }
    function mlplNorm(w) {
        if (typeof _mlNorm === 'function') return _mlNorm(w);
        return String(w).replace(/œ/g, 'oe').replace(/æ/g, 'ae')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
    }
    function wikiLink(word) {
        const base = (typeof ML_WIKI_PAGE === 'string') ? ML_WIKI_PAGE : 'https://fr.wiktionary.org/wiki/';
        return base + encodeURIComponent(word);
    }

    // =========================================================================
    // NIVEAUX
    // =========================================================================
    const MLPL_NIVEAUX = {
        facile:    { label: 'Facile',    nb: 7,  cibleMin: 5, cibleMax: 6, chrono: 180 },
        moyen:     { label: 'Moyen',     nb: 8,  cibleMin: 6, cibleMax: 7, chrono: 120 },
        difficile: { label: 'Difficile', nb: 10, cibleMin: 8, cibleMax: 9, chrono: 90  },
    };

    const VOYELLES = 'AEIOUY';
    // Lettres de complément (fréquences simplifiées, sans lettres rares)
    const POOL_VOY = 'EEEEEEAAAAIIIIOOOUUU';
    const POOL_CONS = 'SSSSNNNNRRRRTTTTLLLLDDDCCCMMMPPPBBGGVVFFH';

    const isVoy = (c) => VOYELLES.includes(c);
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function countLetters(str) {
        const m = {};
        for (const c of str) m[c] = (m[c] || 0) + 1;
        return m;
    }
    function canForm(word, counts) {
        const m = {};
        for (const c of word) {
            m[c] = (m[c] || 0) + 1;
            if (m[c] > (counts[c] || 0)) return false;
        }
        return true;
    }

    // Tirage : un mot « caché » du dictionnaire + lettres complémentaires
    // → il y a toujours un mot long à trouver
    const _candCache = {};
    function mlplGenerate(levelKey) {
        const cfg = MLPL_NIVEAUX[levelKey];
        if (!_candCache[levelKey]) {
            _candCache[levelKey] = Array.from(new Set(
                _mlGetDico().map(d => d.n)
                    .filter(n => n.length >= cfg.cibleMin && n.length <= cfg.cibleMax && !/[JKQWXYZ]/.test(n))
            ));
        }
        const candidates = _candCache[levelKey];
        const hidden = candidates.length ? rnd(candidates) : 'MAISON';
        const letters = hidden.split('');
        while (letters.length < cfg.nb) {
            const v = letters.filter(isVoy).length / cfg.nb;
            let c;
            if (v < 0.35) c = rnd(POOL_VOY);
            else if (v > 0.55) c = rnd(POOL_CONS);
            else c = Math.random() < 0.42 ? rnd(POOL_VOY) : rnd(POOL_CONS);
            // Pas plus de 3 fois la même lettre
            if (letters.filter(x => x === c).length >= 3) continue;
            letters.push(c);
        }
        return shuffle(letters);
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuMotLePlusLongWidget = function () {
        // Préchargement du grand dictionnaire en ligne (comme l'activité)
        if (typeof _mlLoadExternal === 'function') { try { _mlLoadExternal(); } catch (e) {} }
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-mot-le-plus-long';
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

        const container = document.createElement('div');
        container.className = 'jmlpl-container';
        container.innerHTML = `
            <div class="jmlpl-header">
                <span class="jmlpl-title-owl">🦉</span>
                <span class="jmlpl-title">Le mot le plus long</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="jmlpl-help-btn" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jmlpl-levels">
                <button class="jmlpl-lvl active" data-level="facile">😊 Facile <small>7 lettres</small></button>
                <button class="jmlpl-lvl" data-level="moyen">😐 Moyen <small>8 lettres</small></button>
                <button class="jmlpl-lvl" data-level="difficile">😤 Difficile <small>10 lettres</small></button>
                <button class="jmlpl-lvl jmlpl-chrono-toggle" title="Jouer contre la montre">⏱️ Chrono</button>
            </div>

            <div class="jmlpl-stage">
                <div class="jmlpl-tiles"></div>
                <div class="jmlpl-timer">
                    <span>⏳</span>
                    <div class="jmlpl-timer-track"><div class="jmlpl-timer-fill"></div></div>
                    <span class="jmlpl-timer-label">0:00</span>
                </div>
            </div>

            <div class="jmlpl-answer" title="Clique sur une lettre pour la retirer"></div>

            <div class="jmlpl-actions">
                <button class="jmlpl-btn" data-act="back">⌫ Retirer</button>
                <button class="jmlpl-btn" data-act="clear">🧹 Tout retirer</button>
                <button class="jmlpl-btn" data-act="shuffle">🔀 Mélanger</button>
                <button class="jmlpl-btn jmlpl-btn-go" data-act="validate">✓ Valider</button>
            </div>

            <div class="jmlpl-talk">
                <span class="jmlpl-owl">🦉</span>
                <div class="jmlpl-bubble"></div>
            </div>

            <div class="jmlpl-notebook-host">
                <div class="jmlpl-notebook">
                    <div class="jmlpl-notebook-head">
                        <span>📒 Mes mots</span>
                        <span class="jmlpl-best"></span>
                    </div>
                    <div class="jmlpl-words"></div>
                </div>
                <div class="jmlpl-solution"><div class="jmlpl-solution-card"></div></div>
            </div>

            <div class="jmlpl-bottom">
                <button class="jmlpl-btn" data-act="new">🎲 Nouvelles lettres</button>
                <button class="jmlpl-btn" data-act="hint">💡 Indice</button>
                <button class="jmlpl-btn" data-act="solution">👁 Voir les solutions</button>
            </div>

            <div class="jmlpl-help-popup">
                <h4>🦉 Comment jouer ?</h4>
                <p>Clique sur les lettres (ou tape-les au clavier) pour former le <b>mot le plus long</b> possible. Chaque lettre ne sert qu'une fois.</p>
                <p><span class="mini" style="background:#FF6B6B"></span> voyelles &nbsp; <span class="mini" style="background:#7B6CF6"></span> consonnes</p>
                <p>Les accents ne comptent pas : E peut devenir É, È ou Ê.</p>
                <p>✅ Noms, adjectifs (au pluriel ou au féminin aussi), verbes à l'infinitif.<br>❌ Verbes conjugués, noms propres, onomatopées.</p>
                <p style="color:#6B7399">📚 Même dictionnaire que l'activité « Le mot le plus long » : vérifié avec le Wiktionnaire quand l'ordinateur est connecté à internet.</p>
                <p>⌨️ <b>Entrée</b> valide, <b>Retour arrière</b> retire la dernière lettre.</p>
                <p style="margin:0">⭐⭐⭐ si tu trouves un mot aussi long que le plus long possible !</p>
            </div>

            <div class="jmlpl-confetti"></div>

            <div class="jmlpl-rh jmlpl-rh-nw" data-dir="nw"></div>
            <div class="jmlpl-rh jmlpl-rh-n"  data-dir="n"></div>
            <div class="jmlpl-rh jmlpl-rh-ne" data-dir="ne"></div>
            <div class="jmlpl-rh jmlpl-rh-e"  data-dir="e"></div>
            <div class="jmlpl-rh jmlpl-rh-se" data-dir="se"></div>
            <div class="jmlpl-rh jmlpl-rh-s"  data-dir="s"></div>
            <div class="jmlpl-rh jmlpl-rh-sw" data-dir="sw"></div>
            <div class="jmlpl-rh jmlpl-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const tilesZone   = $('.jmlpl-tiles');
        const answerZone  = $('.jmlpl-answer');
        const bubble      = $('.jmlpl-bubble');
        const owl         = $('.jmlpl-owl');
        const wordsZone   = $('.jmlpl-words');
        const bestEl      = $('.jmlpl-best');
        const notebook    = $('.jmlpl-notebook');
        const solZone     = $('.jmlpl-solution');
        const solCard     = $('.jmlpl-solution-card');
        const helpBtn     = $('.jmlpl-help-btn');
        const helpPopup   = $('.jmlpl-help-popup');
        const confetti    = $('.jmlpl-confetti');
        const lvlBtns     = container.querySelectorAll('.jmlpl-lvl[data-level]');
        const chronoBtn   = $('.jmlpl-chrono-toggle');
        const timerBox    = $('.jmlpl-timer');
        const timerFill   = $('.jmlpl-timer-fill');
        const timerLabel  = $('.jmlpl-timer-label');
        const btn = (act) => container.querySelector(`[data-act="${act}"]`);
        const hintBtn = btn('hint'), solBtn = btn('solution');

        // ── État ───────────────────────────────────────────────────────────
        let level = 'facile';
        let tiles = [];          // { id, letter, used }
        let answer = [];         // ids de tuiles
        let found = [];          // mots trouvés : { n (sans accents), w (écriture) }
        let solutions = [];      // [{ n, w, link }] triés du plus long au plus court
        let dicoSource = 'local';// 'ext' (en ligne) ou 'local' (intégré)
        let searching = false;   // recherche dans le grand dictionnaire en cours
        let searchToken = 0;     // invalide les recherches d'un ancien tirage
        let checking = false;    // vérification d'un mot en cours
        let introPending = false;// la chouette n'a pas encore annoncé la longueur max
        let maxLen = 0;
        let hintWord = '';
        let hintLevel = 0;
        let solutionShown = false;
        let locked = false;
        let chronoOn = false;
        let timerId = null, timeLeft = 0, timeTotal = 0;

        // ── Scale proportionnel ────────────────────────────────────────────
        const BASE_W = 620;
        function applyScale() {
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jmlpl-s', sc.toFixed(4));
        }

        // ── Chouette ───────────────────────────────────────────────────────
        function say(html, mood) {
            introPending = false;
            bubble.innerHTML = html;
            bubble.className = 'jmlpl-bubble' + (mood ? ' ' + mood : '');
            owl.classList.remove('hop'); void owl.offsetWidth; owl.classList.add('hop');
        }
        const BRAVO = ['Bravo !', 'Super !', 'Génial !', 'Bien joué !', 'Excellent !', 'Chouette !'];

        // ── Nouveau tirage ─────────────────────────────────────────────────
        function computeBest() {
            maxLen = solutions.length ? solutions[0].n.length : 0;
            const longest = solutions.filter(x => x.n.length === maxLen);
            const pick = longest.length ? rnd(longest).n : '';
            if (!hintWord || !longest.some(x => x.n === hintWord)) hintWord = pick;
        }

        function newGame() {
            if (!dicoOK()) {
                tilesZone.innerHTML = '';
                say('⚠️ Le dictionnaire de l\'activité « Le mot le plus long » (widget-mot-le-plus-long.js) n\'est pas chargé : le jeu ne peut pas démarrer.', 'bad');
                return;
            }
            const letters = mlplGenerate(level);
            tiles = letters.map((l, i) => ({ id: i, letter: l, used: false, r: (Math.random() * 10 - 5).toFixed(1) }));
            answer = []; found = []; hintLevel = 0; hintWord = ''; locked = false; checking = false;
            container.classList.remove('locked');
            btn('validate').disabled = false;

            // Solution immédiate avec le dictionnaire intégré de l'activité…
            solutions = _mlSolve(letters);
            dicoSource = 'local';
            computeBest();
            hideSolution();
            renderTiles(true);
            renderAnswer();
            renderWords();
            hintBtn.disabled = false;
            say(`Voici tes ${letters.length} lettres ! Forme le mot le plus long possible.`);
            introPending = true;
            if (chronoOn) startTimer(); else stopTimer(true);

            // …puis recherche dans le grand dictionnaire en ligne (comme l'activité)
            const token = ++searchToken;
            searching = true;
            (async () => {
                let res = null;
                try { res = await _mlSolveExternal(letters); } catch (e) { res = null; }
                if (token !== searchToken || !widget.isConnected) return;
                searching = false;
                if (res && res.length) { solutions = res; dicoSource = 'ext'; }
                const best = found.length ? Math.max(...found.map(f => f.n.length)) : 0;
                computeBest();
                if (best > maxLen) maxLen = best;
                renderWords();
                if (solutionShown) showSolution();
                if (introPending && !found.length) {
                    say(`Voici tes ${letters.length} lettres ! Le mot le plus long que je connais en a <b>${maxLen}</b>. À toi de jouer !`);
                }
            })();

            if (typeof saveBoard === 'function') saveBoard();
        }

        // ── Rendu tuiles ───────────────────────────────────────────────────
        function renderTiles(animate) {
            tilesZone.innerHTML = '';
            tiles.forEach((t, i) => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'jmlpl-tile ' + (isVoy(t.letter) ? 'voyelle' : 'consonne') + (t.used ? ' used' : '');
                el.style.setProperty('--r', t.r + 'deg');
                el.textContent = t.letter;
                el.setAttribute('aria-label', 'Lettre ' + t.letter);
                if (animate) { el.classList.add('drop'); el.style.animationDelay = (i * 70) + 'ms'; }
                el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); pickTile(t.id); });
                tilesZone.appendChild(el);
            });
        }

        function renderAnswer(popLast) {
            answerZone.innerHTML = '';
            const total = tiles.length;
            answer.forEach((id, i) => {
                const t = tiles.find(x => x.id === id);
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'jmlpl-slot-tile ' + (isVoy(t.letter) ? 'voyelle' : 'consonne');
                if (popLast && i === answer.length - 1) el.classList.add('pop');
                el.textContent = t.letter;
                el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); removeAt(i); });
                answerZone.appendChild(el);
            });
            for (let i = answer.length; i < total; i++) {
                const s = document.createElement('div');
                s.className = 'jmlpl-slot';
                answerZone.appendChild(s);
            }
        }

        function renderWords() {
            wordsZone.innerHTML = '';
            if (!found.length) {
                wordsZone.innerHTML = '<span class="jmlpl-empty">Tes mots s\'écriront ici…</span>';
                bestEl.innerHTML = '';
                return;
            }
            const best = Math.max(...found.map(f => f.n.length));
            const sorted = [...found].sort((a, b) => b.n.length - a.n.length || a.n.localeCompare(b.n));
            sorted.forEach(f => {
                const sp = document.createElement('span');
                sp.className = 'jmlpl-word' + (f.n.length === best ? ' best' : '');
                sp.innerHTML = `${f.w.toLowerCase()}<sup>${f.n.length}</sup>`;
                wordsZone.appendChild(sp);
            });
            const stars = best >= maxLen ? 3 : best >= maxLen - 1 ? 2 : 1;
            bestEl.innerHTML = `Record : <b>${best}</b> lettres <span class="jmlpl-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`;
        }

        // ── Actions sur les lettres ────────────────────────────────────────
        function pickTile(id) {
            if (locked) return;
            const t = tiles.find(x => x.id === id);
            if (!t || t.used) return;
            t.used = true;
            answer.push(id);
            renderTiles(false);
            renderAnswer(true);
        }
        function removeAt(i) {
            if (locked) return;
            const id = answer[i];
            if (id === undefined) return;
            answer.splice(i, 1);
            const t = tiles.find(x => x.id === id);
            if (t) t.used = false;
            renderTiles(false);
            renderAnswer(false);
        }
        function clearAnswer() {
            answer.forEach(id => { const t = tiles.find(x => x.id === id); if (t) t.used = false; });
            answer = [];
            renderTiles(false);
            renderAnswer(false);
        }
        function shuffleTiles() {
            shuffle(tiles);
            tiles.forEach(t => t.r = (Math.random() * 10 - 5).toFixed(1));
            renderTiles(true);
        }
        function typeLetter(ch) {
            const t = tiles.find(x => !x.used && x.letter === ch);
            if (t) pickTile(t.id);
        }

        // ── Validation (même vérification que l'activité) ──────────────────
        const REASONS = {
            conjugue:   (w) => `<b>${w}</b> est un verbe conjugué : seuls les verbes à l'infinitif sont acceptés (comme <i>chanter</i>).`,
            onomatopee: (w) => `<b>${w}</b> est une onomatopée ou une interjection : ce n'est pas accepté.`,
            propre:     (w) => `<b>${w}</b> est un nom propre : ce n'est pas accepté.`,
            etranger:   (w) => `<b>${w}</b> n'est pas un mot français.`,
            autre:      (w) => `<b>${w}</b> n'est pas accepté : il faut un nom, un adjectif, un verbe à l'infinitif ou un petit mot invariable.`,
            absent:     (w) => `Je ne trouve pas <b>${w}</b> dans le dictionnaire. Vérifie l'orthographe ou essaie un autre mot.`
        };

        async function validate() {
            if (locked || checking || !dicoOK()) return;
            const word = answer.map(id => tiles.find(x => x.id === id).letter).join('');
            if (word.length < 2) {
                say('Choisis au moins <b>2 lettres</b> pour former un mot.', 'tip');
                return;
            }
            if (found.some(f => f.n === word)) {
                say(`Tu as déjà trouvé <b>${word}</b> ! Cherche un autre mot.`, 'tip');
                bump(false);
                return;
            }
            const token = searchToken;
            checking = true;
            btn('validate').disabled = true;
            say('🔎 Je vérifie dans le dictionnaire…', 'tip');
            let res;
            try { res = await _mlCheckWord(word.toLowerCase(), word); } catch (e) { res = { ok: null }; }
            checking = false;
            btn('validate').disabled = false;
            if (token !== searchToken || !widget.isConnected) return;

            if (res.ok === null) {
                say(`Je ne peux pas vérifier <b>${word}</b> sans connexion internet. Demande à ton enseignant !`, 'tip');
                bump(false);
                return;
            }
            if (!res.ok) {
                say((REASONS[res.reason] || REASONS.absent)(word), 'bad');
                bump(false);
                return;
            }
            const shown = (res.w || word).toUpperCase();
            const prevBest = found.length ? Math.max(...found.map(f => f.n.length)) : 0;
            found.push({ n: word, w: res.w || word.toLowerCase() });
            if (word.length > maxLen) maxLen = word.length;   // mieux que la solution trouvée !
            renderWords();
            bump(true);
            clearAnswer();
            if (solutionShown) showSolution();
            if (word.length >= maxLen) {
                say(`🏆 ${rnd(BRAVO)} <b>${shown}</b> fait ${word.length} lettres : c'est le mot le plus long possible !`, 'good');
                party();
                stopTimer(false);
            } else if (word.length > prevBest) {
                const reste = maxLen - word.length;
                say(`${rnd(BRAVO)} <b>${shown}</b> : ${word.length} lettres ! Il existe un mot plus long de ${reste} lettre${reste > 1 ? 's' : ''}…`, 'good');
            } else {
                say(`<b>${shown}</b> est bien un mot ! Essaie d'en trouver un plus long.`, 'good');
            }
        }
        function bump(ok) {
            const cls = ok ? 'good' : 'shake';
            answerZone.classList.remove('good', 'shake'); void answerZone.offsetWidth;
            answerZone.classList.add(cls);
            setTimeout(() => answerZone.classList.remove(cls), 650);
        }

        // ── Indice ─────────────────────────────────────────────────────────
        function giveHint() {
            if (!hintWord) return;
            const maxHint = Math.max(1, hintWord.length - 2);
            hintLevel = Math.min(hintLevel + 1, maxHint);
            const debut = hintWord.slice(0, hintLevel);
            say(`💡 Un mot de <b>${hintWord.length}</b> lettres commence par <b>${debut}…</b>`, 'tip');
            if (hintLevel >= maxHint) hintBtn.disabled = true;
        }

        // ── Solutions ──────────────────────────────────────────────────────
        function showSolution() {
            solutionShown = true;
            solBtn.textContent = '🙈 Cacher les solutions';
            solBtn.classList.add('on');
            const wait = searching ? '<div class="jmlpl-sol-len" style="margin-top:6px">🔎 Je cherche encore dans le grand dictionnaire…</div>' : '';
            if (!solutions.length) {
                solCard.innerHTML = (searching ? '<h4>🔎 Recherche des solutions…</h4>' : '<h4>Aucun mot trouvé avec ces lettres.</h4>');
            } else {
                const groups = {};
                solutions.forEach(x => { (groups[x.n.length] = groups[x.n.length] || []).push(x); });
                const lens = Object.keys(groups).map(Number).sort((a, b) => b - a).slice(0, 2);
                const source = dicoSource === 'ext'
                    ? '📚 Mots vérifiés avec le Wiktionnaire'
                    : (searching ? '' : '📴 Hors ligne : dictionnaire intégré');
                solCard.innerHTML = '<h4>🦉 Les mots les plus longs</h4>' + lens.map(len => {
                    const list = groups[len].slice(0, len === lens[0] ? 10 : 8);
                    return `<div class="jmlpl-sol-group"><div class="jmlpl-sol-len">${len} lettres</div><div class="jmlpl-sol-words">${
                        list.map(x => `<a class="jmlpl-sol-word${found.some(f => f.n === x.n) ? ' found' : ''}" href="${wikiLink(x.link || x.w.split(' / ')[0])}" target="_blank" rel="noopener" title="Voir la définition sur le Wiktionnaire">${x.w.toUpperCase()}</a>`).join('')
                    }</div></div>`;
                }).join('') + wait + (source ? `<div class="jmlpl-sol-len" style="margin-top:6px;font-weight:500">${source}</div>` : '');
            }
            notebook.classList.add('blur-behind');
            solZone.classList.add('show');
            // Agrandir le cahier si la carte des solutions est plus haute que lui
            requestAnimationFrame(() => {
                notebook.style.minHeight = '';
                notebook.style.minHeight = (solCard.offsetHeight + 20) + 'px';
            });
        }
        function hideSolution() {
            solutionShown = false;
            solBtn.textContent = '👁 Voir les solutions';
            solBtn.classList.remove('on');
            notebook.classList.remove('blur-behind');
            solZone.classList.remove('show');
            notebook.style.minHeight = '';
        }

        // ── Chrono ─────────────────────────────────────────────────────────
        function fmt(sec) { return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
        function startTimer() {
            stopTimer(false);
            timeTotal = timeLeft = MLPL_NIVEAUX[level].chrono;
            timerBox.classList.add('show');
            timerFill.style.width = '100%';
            timerFill.classList.remove('urgent');
            timerLabel.textContent = fmt(timeLeft);
            timerId = setInterval(() => {
                if (!widget.isConnected) { clearInterval(timerId); return; }
                timeLeft--;
                timerLabel.textContent = fmt(Math.max(0, timeLeft));
                timerFill.style.width = Math.max(0, (timeLeft / timeTotal) * 100) + '%';
                if (timeLeft <= timeTotal * 0.2) timerFill.classList.add('urgent');
                if (timeLeft <= 0) {
                    clearInterval(timerId); timerId = null;
                    locked = true;
                    container.classList.add('locked');
                    const best = found.length ? Math.max(...found.map(w => w.length)) : 0;
                    say(best
                        ? `⏰ Temps écoulé ! Ton plus long mot fait <b>${best}</b> lettres. Regarde les solutions ou tire de nouvelles lettres.`
                        : `⏰ Temps écoulé ! Regarde les solutions ou tire de nouvelles lettres pour rejouer.`, 'tip');
                }
            }, 1000);
        }
        function stopTimer(hide) {
            if (timerId) { clearInterval(timerId); timerId = null; }
            if (hide) timerBox.classList.remove('show');
        }

        // ── Confettis ──────────────────────────────────────────────────────
        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const colors = ['#FF6B6B', '#7B6CF6', '#FFD23F', '#3DD9B3', '#fff'];
            for (let i = 0; i < 36; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = rnd(colors);
                c.style.animationDelay = (Math.random() * 0.4) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2200);
        }

        // ── Niveaux ────────────────────────────────────────────────────────
        function setLevel(l) {
            level = l;
            lvlBtns.forEach(b => b.classList.toggle('active', b.dataset.level === l));
            newGame();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));
        chronoBtn.addEventListener('click', () => {
            chronoOn = !chronoOn;
            chronoBtn.classList.toggle('on', chronoOn);
            if (chronoOn) { newGame(); }
            else {
                stopTimer(true);
                if (locked) { locked = false; container.classList.remove('locked'); }
            }
        });

        // ── Boutons ────────────────────────────────────────────────────────
        btn('back').addEventListener('click', () => removeAt(answer.length - 1));
        btn('clear').addEventListener('click', () => { if (!locked) clearAnswer(); });
        btn('shuffle').addEventListener('click', shuffleTiles);
        btn('validate').addEventListener('click', validate);
        btn('new').addEventListener('click', newGame);
        hintBtn.addEventListener('click', giveHint);
        solBtn.addEventListener('click', () => solutionShown ? hideSolution() : showSolution());

        // ── Clavier ────────────────────────────────────────────────────────
        widget.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key;
            if (k === 'Enter') { e.preventDefault(); e.stopPropagation(); validate(); return; }
            if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); e.stopPropagation(); removeAt(answer.length - 1); return; }
            if (k === 'Escape') { e.stopPropagation(); clearAnswer(); return; }
            if (k.length === 1) {
                const ch = mlplNorm(k);
                if (/^[A-Z]$/.test(ch)) { e.preventDefault(); e.stopPropagation(); typeLetter(ch); }
            }
        });

        // ── Aide ───────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
        const closeHelp = () => { if (!widget.isConnected) { document.removeEventListener('click', closeHelp); return; } helpPopup.classList.remove('show'); };
        document.addEventListener('click', closeHelp);

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin = $('[data-role="wf-min"]'), wfMax = $('[data-role="wf-max"]'), wfClose = $('[data-role="wf-close"]');
        let _isMax = false, _savedW = null;
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🦉 Le mot le plus long');
        });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) { _savedW = container.style.width; container.classList.add('wf-fullboard'); }
            else { container.classList.remove('wf-fullboard'); if (_savedW) container.style.width = _savedW; }
            requestAnimationFrame(applyScale);
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            stopTimer(true);
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jmlpl-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                const startX = clientX, startY = clientY;
                const startW = container.offsetWidth, startH = container.offsetHeight;
                const startL = widget.offsetLeft, startT = widget.offsetTop;
                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (dir.includes('e')) newW = Math.max(380, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(380, startW - dx); newL = startL + (startW - newW); }
                    if (dir.includes('s')) newH = Math.max(260, startH + dy);
                    if (dir.includes('n')) { newH = Math.max(260, startH - dy); newT = startT + (startH - newH); }
                    container.style.width = newW + 'px';
                    container.style.height = newH + 'px';
                    if (dir.includes('w')) widget.style.left = newL + 'px';
                    if (dir.includes('n')) widget.style.top = newT + 'px';
                    applyScale();
                };
                const onMouseMove = (ev) => onMove(ev.clientX, ev.clientY);
                const onTouchMove = (ev) => onMove(ev.touches[0].clientX, ev.touches[0].clientY);
                const stop = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', stop);
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', stop);
                    if (typeof saveBoard === 'function') saveBoard();
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', stop);
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', stop);
            }
            handle.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); startResize(e.clientX, e.clientY); });
            handle.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); startResize(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
        });

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, a, .jmlpl-tile, .jmlpl-slot-tile, .jmlpl-rh')) {
                e.stopPropagation();
                widget.focus({ preventScroll: true });
                return;
            }
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus({ preventScroll: true });
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        widget.addEventListener('mousedown', _onWidgetDown);
        widget.addEventListener('pointerdown', _onWidgetDown);

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            applyScale();
            setLevel('facile');
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
            widget.focus({ preventScroll: true });
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
            if (type === 'jeu-mot-le-plus-long') return window.createJeuMotLePlusLongWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-mot-le-plus-long') return window.createJeuMotLePlusLongWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }

})();
