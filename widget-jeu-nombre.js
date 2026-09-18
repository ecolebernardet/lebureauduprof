// =========================================================================
// WIDGET JEU DES NOMBRES — Le Bureau du Prof
// L'élève doit écrire, en chiffres ou en lettres, un nombre proposé
// aléatoirement (en cliquant sur des étiquettes), avant la fin du chrono.
// Le professeur choisit les classes de grandeur autorisées (unités,
// milliers, millions, milliards), le sens de l'exercice et le chrono.
//
// Inspiré de :
//   - widget-nombres-chiffres-lettres.js (moteur de conversion nombre <-> mots
//     français, système d'étiquettes cliquables, étiquettes fausses en rouge,
//     overlay de félicitations flouté)
//   - widget-jeu-tables-invaders.js (habillage "jeu" : score, vies, chrono,
//     panneau de paramètres, overlay démarrer/pause/fin de partie)
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-nombre.js"></script>
//   2. Ajouter un bouton / une carte quelque part :
//      <div class="act-card" onclick="createWidget('jeu-nombre')">...</div>
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
    if (!document.getElementById('widget-jn-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jn-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@600;700&display=swap');

        .widget[data-type="jeu-nombre"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jn-container {
            --jn-s: 1;
            background:
                radial-gradient(circle at 100% 0%, rgba(255,110,199,0.10), transparent 55%),
                radial-gradient(circle at 0% 100%, rgba(53,208,186,0.10), transparent 55%),
                linear-gradient(180deg, #fdfcff 0%, #f3efff 100%);
            border: 1.5px solid #e4dbff;
            border-radius: calc(20px * var(--jn-s));
            padding: calc(16px * var(--jn-s)) calc(18px * var(--jn-s)) calc(14px * var(--jn-s));
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: calc(10px * var(--jn-s));
            font-family: 'Baloo 2', 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 12px 34px rgba(124,92,255,0.20), 0 2px 8px rgba(0,0,0,0.06);
            position: relative;
            user-select: none;
            overflow-y: auto;
            overflow-x: hidden;
            width: 640px;
        }
        .jn-container::before {
            content: '';
            position: absolute; top: 0; left: calc(18px * var(--jn-s)); right: calc(18px * var(--jn-s));
            height: 5px; border-radius: 0 0 8px 8px; pointer-events: none;
            background: linear-gradient(90deg, #7c5cff, #ff6ec7, #ffb648, #35d0ba, #7c5cff);
            background-size: 300% 100%;
            animation: jnRainbowSlide 7s linear infinite;
            opacity: 0.85;
        }
        @keyframes jnRainbowSlide { 0% { background-position: 0% 0; } 100% { background-position: 300% 0; } }
        .jn-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }
        .jn-container.wf-minimized > *:not(.jn-header) { display: none !important; }
        .jn-container.wf-minimized { gap: 0; }

        /* ── En-tête ── */
        .jn-header { display: flex; align-items: center; gap: calc(8px * var(--jn-s)); flex-wrap: wrap; }
        .jn-title {
            font-size: calc(16px * var(--jn-s)); font-weight: 800; white-space: nowrap;
            background: linear-gradient(90deg, #6c5ce7, #ff6ec7);
            -webkit-background-clip: text; background-clip: text; color: transparent;
            letter-spacing: 0.2px;
        }
        .jn-params-btn, .jn-help-btn {
            width: calc(24px * var(--jn-s)); height: calc(24px * var(--jn-s)); border-radius: 50%;
            border: 1.5px solid #e4dbff; background: #ffffff; color: #6c5ce7; font-size: calc(12px * var(--jn-s));
            font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: transform .15s, box-shadow .15s, background .15s;
            box-shadow: 0 2px 6px rgba(108,92,231,0.18);
        }
        .jn-params-btn:hover, .jn-help-btn:hover { transform: translateY(-1px) scale(1.06); box-shadow: 0 4px 10px rgba(108,92,231,0.3); }
        .jn-params-btn.active { background: linear-gradient(135deg,#7c5cff,#6c5ce7); color: white; border-color: #5546c8; }

        /* ── Panneau de paramètres ── */
        .jn-params-panel {
            background: linear-gradient(180deg,#ffffff,#f7f5ff); border: 1.5px solid #e9e2ff; border-radius: calc(12px * var(--jn-s));
            padding: calc(10px * var(--jn-s)) calc(14px * var(--jn-s));
            display: none; flex-direction: column; gap: calc(8px * var(--jn-s)); flex-shrink: 0;
            box-shadow: 0 4px 14px rgba(108,92,231,0.08);
        }
        .jn-params-panel.show { display: flex; }
        .jn-params-title { font-size: calc(11px * var(--jn-s)); font-weight: 700; color: #4c3fae; }
        .jn-params-grid { display: flex; flex-wrap: wrap; gap: calc(6px * var(--jn-s)); }
        .jn-class-check {
            display: flex; align-items: center; gap: 4px;
            padding: calc(4px * var(--jn-s)) calc(11px * var(--jn-s)); border-radius: 20px;
            border: 1.5px solid transparent; background: #e0f0ff; color: #1565c0;
            cursor: pointer; font-size: calc(11px * var(--jn-s)); font-weight: 700;
            transition: all .15s; user-select: none; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .jn-class-check input[type=checkbox] { display: none; }
        .jn-class-check.checked { border-color: currentColor; box-shadow: 0 3px 8px rgba(0,0,0,0.12); transform: scale(1.03); }
        .jn-class-check:not(.checked) { opacity: 0.4; }
        .jn-class-check:hover { opacity: 1; transform: scale(1.05); }
        .jn-class-check.c-unites   { background: #dbeafe; color: #1d4ed8; }
        .jn-class-check.c-mille    { background: #d1fae5; color: #065f46; }
        .jn-class-check.c-million  { background: #ede9fe; color: #5b21b6; }
        .jn-class-check.c-milliard { background: #ffedd5; color: #9a3412; }
        .jn-params-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .jn-params-row label { font-size: calc(11px * var(--jn-s)); font-weight: 700; color: #4c3fae; white-space: nowrap; }
        .jn-select {
            padding: 5px 10px; border-radius: 8px; border: 1.5px solid #e4dbff; font-size: calc(12px * var(--jn-s));
            font-family: 'Baloo 2', 'Segoe UI', system-ui, sans-serif; font-weight: 600; outline: none; cursor: pointer;
            background: white; color: #374151; transition: border-color .15s, box-shadow .15s;
        }
        .jn-select:focus { border-color: #6c5ce7; box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
        .jn-select:hover { border-color: #b9a8ff; }

        .jn-controls { display: flex; gap: calc(6px * var(--jn-s)); flex-shrink: 0; }

        /* ── HUD ── */
        .jn-hud {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
            gap: calc(6px * var(--jn-s)); font-size: calc(12px * var(--jn-s)); font-weight: 800; flex-shrink: 0;
        }
        .jn-hud > span {
            display: inline-flex; align-items: center; gap: 4px;
            padding: calc(4px * var(--jn-s)) calc(10px * var(--jn-s)); border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06); background: white; transition: transform .15s;
        }
        .jn-hud > span:hover { transform: translateY(-1px); }
        .jn-score  { color: #1a7a34; background: linear-gradient(180deg,#eafff1,#d7f7e3) !important; }
        .jn-streak { color: #b8790a; background: linear-gradient(180deg,#fff8e6,#ffedc0) !important; }
        .jn-timer  { font-variant-numeric: tabular-nums; color: #375ba8; background: linear-gradient(180deg,#eef4ff,#dde9ff) !important; }
        .jn-timer.low { color: #dc3545; background: linear-gradient(180deg,#fff0f0,#ffd9d9) !important; animation: jnPulseSoft 1s ease-in-out infinite; }
        .jn-lives { letter-spacing: 2px; font-size: calc(13px * var(--jn-s)); background: linear-gradient(180deg,#fff0f5,#ffe1ec) !important; }
        @keyframes jnPulseSoft { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }

        .jn-timerbar {
            height: calc(7px * var(--jn-s)); background: #ece9fb; border-radius: 6px; overflow: hidden; flex-shrink: 0;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
        }
        .jn-timerbar-fill {
            height: 100%; width: 100%; background: linear-gradient(90deg,#4a90e2,#6c5ce7,#ff6ec7);
            background-size: 200% 100%;
            box-shadow: 0 0 8px rgba(108,92,231,0.5);
            transition: width .25s linear, background .25s;
        }
        .jn-timerbar-fill.low { background: linear-gradient(90deg,#dc3545,#f97316); box-shadow: 0 0 8px rgba(220,53,69,0.55); }

        /* ── Zone d'énoncé (le nombre à écrire) ── */
        .jn-prompt-zone {
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
            background: linear-gradient(180deg,#f6f4ff,#eef2ff);
            border: 1.5px solid #d3c9ff; border-radius: calc(14px * var(--jn-s));
            padding: calc(12px * var(--jn-s)) calc(12px * var(--jn-s)); flex-shrink: 0; text-align: center;
            box-shadow: 0 4px 16px rgba(108,92,231,0.14), inset 0 1px 0 rgba(255,255,255,0.6);
            position: relative;
        }
        .jn-prompt-badge {
            font-size: calc(10px * var(--jn-s)); font-weight: 800; color: white;
            background: linear-gradient(135deg,#7c5cff,#ff6ec7); padding: 3px 12px; border-radius: 10px;
            box-shadow: 0 2px 6px rgba(108,92,231,0.35); letter-spacing: 0.3px;
        }
        .jn-prompt-value {
            font-size: calc(28px * var(--jn-s)); font-weight: 900; color: #2b2560;
            letter-spacing: 0.5px; word-break: break-word;
            text-shadow: 0 2px 0 rgba(255,255,255,0.7);
        }
        .jn-prompt-value.words { font-size: calc(19px * var(--jn-s)); font-style: italic; color: #4c3fae; }

        /* ── Étiquettes (palette + réponse), repris du widget Nombres en chiffres/lettres ── */
        .jn-palette-zone { display: flex; flex-direction: column; gap: calc(4px * var(--jn-s)); }
        .jn-palette-row { display: flex; flex-wrap: wrap; gap: calc(4px * var(--jn-s)); align-items: center; justify-content: center; }
        .jn-tile {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: calc(38px * var(--jn-s)); height: calc(26px * var(--jn-s));
            padding: 0 calc(8px * var(--jn-s)); border-radius: calc(9px * var(--jn-s));
            font-size: calc(12px * var(--jn-s)); font-weight: 700; cursor: pointer;
            border: calc(1.5px * var(--jn-s)) solid #d1d5db; background: white; color: #1e3a5f;
            box-shadow: 0 2px 0 rgba(0,0,0,0.06), 0 3px 6px rgba(0,0,0,0.08);
            transition: background .12s, border-color .12s, transform .12s, box-shadow .12s;
            user-select: none; touch-action: manipulation;
        }
        .jn-tile:hover { border-color: #4a90e2; background: #eff6ff; transform: translateY(-2px); box-shadow: 0 4px 0 rgba(0,0,0,0.06), 0 6px 10px rgba(74,144,226,0.25); }
        .jn-tile:active { transform: scale(0.94) translateY(0); box-shadow: 0 1px 0 rgba(0,0,0,0.06); }
        .jn-tile.word-tile {
            flex-direction: column; height: auto; min-height: calc(23px * var(--jn-s));
            padding: calc(1px * var(--jn-s)) calc(8px * var(--jn-s)); line-height: 1.05; gap: 0;
        }
        .jn-tile-word { pointer-events: none; }
        .jn-tile-num { font-size: calc(8px * var(--jn-s)); font-weight: 600; opacity: 0.6; pointer-events: none; }
        .jn-tile.digit-tile {
            min-width: calc(38px * var(--jn-s)); font-size: calc(17px * var(--jn-s));
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }
        .jn-palette-row-digits { gap: calc(8px * var(--jn-s)); }
        .jn-palette-row-digits .jn-tile.digit-tile {
            width: calc(46px * var(--jn-s)); min-width: calc(46px * var(--jn-s));
            height: calc(38px * var(--jn-s)); font-size: calc(19px * var(--jn-s));
            border-radius: calc(11px * var(--jn-s));
        }
        .jn-tile-row0 { background: linear-gradient(180deg,#eaf3ff,#dbeafe); border-color: #93c5fd; color: #1e40af; }
        .jn-tile-row0:hover { background: linear-gradient(180deg,#dceeff,#bfdbfe); border-color: #60a5fa; }
        .jn-tile-row1 { background: linear-gradient(180deg,#e2fbf0,#d1fae5); border-color: #6ee7b7; color: #065f46; }
        .jn-tile-row1:hover { background: linear-gradient(180deg,#c9f7e2,#a7f3d0); border-color: #34d399; }
        .jn-tile-row2 { background: linear-gradient(180deg,#f2eeff,#ede9fe); border-color: #c4b5fd; color: #5b21b6; }
        .jn-tile-row2:hover { background: linear-gradient(180deg,#e6ddff,#ddd6fe); border-color: #a78bfa; }
        .jn-tile-row3 { background: linear-gradient(180deg,#fff2e0,#ffedd5); border-color: #fdba74; color: #9a3412; }
        .jn-tile-row3:hover { background: linear-gradient(180deg,#ffe4c2,#fed7aa); border-color: #fb923c; }

        .jn-answer-zone {
            display: flex; flex-wrap: wrap; align-items: center; gap: calc(4px * var(--jn-s));
            min-height: calc(44px * var(--jn-s)); padding: calc(3px * var(--jn-s)) calc(10px * var(--jn-s));
            background: linear-gradient(180deg,#fffef8,#fffaef);
            border: calc(2px * var(--jn-s)) dashed #e5c97a;
            border-radius: calc(12px * var(--jn-s));
            box-shadow: inset 0 1px 4px rgba(229,201,122,0.18);
        }
        .jn-answer-zone.digits-mode {
            flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; justify-content: flex-start;
            padding-right: calc(20px * var(--jn-s));
        }
        .jn-answer-empty { font-size: calc(11px * var(--jn-s)); color: #bbb; font-style: italic; }
        .jn-answer-tile {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: calc(38px * var(--jn-s)); height: calc(30px * var(--jn-s));
            padding: 0 calc(9px * var(--jn-s)); border-radius: calc(9px * var(--jn-s));
            font-size: calc(13px * var(--jn-s)); font-weight: 700; cursor: pointer;
            border: calc(1.5px * var(--jn-s)) solid #f9a8d4; background: linear-gradient(180deg,#fff0f8,#fce7f3); color: #9d174d;
            box-shadow: 0 2px 5px rgba(157,23,77,0.14);
            flex-shrink: 0; transition: background .12s, border-color .12s, transform .12s;
        }
        .jn-answer-tile:hover { background: #fee2e2; border-color: #dc3545; color: #dc3545; transform: translateY(-1px); }
        .jn-answer-tile.jn-answer-tile-wrong {
            background: #fee2e2 !important; border-color: #dc3545 !important; color: #dc3545 !important;
            box-shadow: 0 0 0 calc(3px * var(--jn-s)) rgba(220,53,69,0.28);
            animation: jnWrongShake .4s ease;
        }
        @keyframes jnWrongShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); } 40% { transform: translateX(4px); }
            60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
        }
        .jn-answer-tile.digit-tile {
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; font-size: calc(16px * var(--jn-s));
            min-width: calc(30px * var(--jn-s)); padding: 0 calc(5px * var(--jn-s));
        }
        .jn-answer-sep { color: #d4a017; font-weight: 900; font-size: calc(14px * var(--jn-s)); flex-shrink: 0; }
        .jn-answer-groupsep { display: inline-block; width: calc(10px * var(--jn-s)); flex-shrink: 0; }

        @keyframes jnTileSlideIn {
            0%   { opacity: 0; transform: translateY(-22px) scale(0.7) rotate(-6deg); }
            60%  { opacity: 1; transform: translateY(3px) scale(1.08) rotate(2deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        .jn-anim-in { animation: jnTileSlideIn 0.4s cubic-bezier(.25,.8,.35,1) both; }

        /* ── Overlay de félicitations, par-dessus les étiquettes qui se floutent ── */
        .jn-tiles-wrap { position: relative; display: flex; flex-direction: column; gap: calc(8px * var(--jn-s)); }
        .jn-tiles-wrap > .jn-answer-zone,
        .jn-tiles-wrap > .jn-palette-zone { transition: filter .35s ease; }
        .jn-tiles-wrap.jn-success-active > .jn-answer-zone,
        .jn-tiles-wrap.jn-success-active > .jn-palette-zone { filter: blur(6px); pointer-events: none; }
        .jn-success-overlay {
            position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: calc(8px * var(--jn-s)); opacity: 0; transform: scale(0.85);
            pointer-events: none; transition: opacity .35s ease, transform .35s ease; z-index: 6;
        }
        .jn-success-overlay.show { opacity: 1; transform: scale(1); }
        .jn-success-overlay.show .jn-success-emoji { animation: jnSuccessBounce .6s ease .05s 1; }
        .jn-success-emoji { font-size: calc(46px * var(--jn-s)); line-height: 1; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.18)); }
        @keyframes jnSuccessBounce {
            0% { transform: scale(0.4) rotate(-15deg); }
            50% { transform: scale(1.25) rotate(8deg); }
            75% { transform: scale(0.95) rotate(-3deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        .jn-success-msg {
            font-size: calc(24px * var(--jn-s)); font-weight: 900; color: #16a34a;
            background: rgba(255,255,255,0.95);
            padding: calc(7px * var(--jn-s)) calc(22px * var(--jn-s));
            border-radius: calc(14px * var(--jn-s)); box-shadow: 0 8px 24px rgba(22,163,74,0.25);
            text-align: center; white-space: nowrap; border: 1.5px solid #bbf7d0;
        }

        /* ── Zone résultat / boutons d'action ── */
        .jn-result-zone {
            display: flex; align-items: center; justify-content: center; gap: calc(8px * var(--jn-s));
            min-height: calc(28px * var(--jn-s)); flex-wrap: wrap; text-align: center; flex-shrink: 0;
        }
        .jn-btn {
            padding: calc(6px * var(--jn-s)) calc(15px * var(--jn-s)); border-radius: calc(9px * var(--jn-s));
            border: 1.5px solid #d1d5db; background: linear-gradient(180deg,#ffffff,#f0f0f0); color: #333;
            font-size: calc(12px * var(--jn-s)); font-family: 'Baloo 2', 'Segoe UI', system-ui, sans-serif;
            font-weight: 700; cursor: pointer; transition: background .15s, transform .12s, box-shadow .15s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
        }
        .jn-btn:hover { background: linear-gradient(180deg,#f5f5f5,#e6e6e6); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
        .jn-btn:active { transform: scale(0.96); }
        .jn-btn-validate { background: linear-gradient(180deg,#22c55e,#16a34a); color: white; border: none; box-shadow: 0 3px 8px rgba(22,163,74,0.35); }
        .jn-btn-validate:hover { background: linear-gradient(180deg,#16c157,#128a3e); }
        .jn-btn-continue { background: linear-gradient(180deg,#5ea2ec,#4a90e2); color: white; border: none; box-shadow: 0 3px 8px rgba(74,144,226,0.35); }
        .jn-btn-continue:hover { background: linear-gradient(180deg,#4a90e2,#357abd); }
        .jn-btn-continue.hidden { display: none; }
        .jn-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
        .jn-answer-tile.jn-answer-tile-solution {
            background: #e0ecff !important; border-color: #93c5fd !important; color: #1d4ed8 !important;
            cursor: default;
        }
        .jn-result-text { font-size: calc(13px * var(--jn-s)); font-weight: 800; opacity: 0; transition: opacity .3s; }
        .jn-result-text.show { opacity: 1; }
        .jn-result-text.exact { color: #16a34a; }
        .jn-result-text.faux  { color: #dc3545; }

        /* ── Aide ── */
        .jn-help-popup {
            display: none; position: absolute; top: 36px; right: 10px; background: linear-gradient(180deg,#ffffff,#faf9ff);
            border: 1.5px solid #e4dbff; border-radius: 12px; box-shadow: 0 8px 24px rgba(108,92,231,0.2);
            padding: 12px 14px; width: 300px; font-size: 11px; color: #444; z-index: 20; line-height: 1.5;
        }
        .jn-help-popup.show { display: block; }
        .jn-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #4c3fae; }

        /* ── Zone de jeu (enveloppe l'overlay démarrer/pause/fin, pour ne jamais
           masquer l'en-tête, le HUD ni le panneau de paramètres) ── */
        .jn-game-area {
            position: relative; display: flex; flex-direction: column;
            gap: calc(9px * var(--jn-s)); flex: 1; min-height: 0;
        }

        /* ── Overlay démarrer / pause / fin de partie ── */
        .jn-overlay {
            position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center;
            background: radial-gradient(circle at 30% 20%, rgba(124,92,255,0.10), transparent 55%),
                        radial-gradient(circle at 80% 80%, rgba(255,110,199,0.10), transparent 55%),
                        rgba(255,255,255,0.94);
            border-radius: calc(14px * var(--jn-s));
            transition: opacity .2s; padding: 16px;
        }
        .jn-overlay.hidden { display: none; }
        .jn-overlay-card {
            text-align: center; max-width: 360px; background: #ffffff;
            border: 1.5px solid #e9e2ff; border-radius: calc(16px * var(--jn-s));
            padding: calc(20px * var(--jn-s)) calc(24px * var(--jn-s));
            box-shadow: 0 14px 34px rgba(108,92,231,0.22);
        }
        .jn-overlay-title {
            font-size: calc(21px * var(--jn-s)); font-weight: 900; margin-bottom: 6px;
            background: linear-gradient(90deg,#6c5ce7,#ff6ec7);
            -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .jn-overlay-sub { font-size: calc(12px * var(--jn-s)); color: #666; margin-bottom: 16px; line-height: 1.5; }
        .jn-overlay-btn {
            padding: 10px 28px; border-radius: 12px; border: none;
            background: linear-gradient(135deg,#7c5cff,#6c5ce7); color: white;
            font-size: calc(14px * var(--jn-s)); font-weight: 800; cursor: pointer;
            font-family: 'Baloo 2', 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 6px 16px rgba(108,92,231,0.4);
            transition: background .15s, transform .12s, box-shadow .15s;
        }
        .jn-overlay-btn:hover { background: linear-gradient(135deg,#8a6dff,#5546c8); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(108,92,231,0.5); }
        .jn-overlay-btn:active { transform: scale(0.96); }

        .jn-rh { position: absolute; z-index: 20; opacity: 0; transition: opacity .2s; }
        .widget[data-type="jeu-nombre"]:hover .jn-rh { opacity: 1; }
        .jn-rh-se { bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%); border-radius: 0 0 14px 0; }
        .jn-rh-sw { bottom: 0; left: 0; width: 14px; height: 14px; cursor: sw-resize;
            background: linear-gradient(225deg, transparent 50%, #aaa 50%); border-radius: 0 0 0 14px; }
        .jn-rh-ne { top: 0; right: 0; width: 14px; height: 14px; cursor: ne-resize;
            background: linear-gradient(45deg, transparent 50%, #aaa 50%); border-radius: 0 14px 0 0; }
        .jn-rh-nw { top: 0; left: 0; width: 14px; height: 14px; cursor: nw-resize;
            background: linear-gradient(315deg, transparent 50%, #aaa 50%); border-radius: 14px 0 0 0; }
        .jn-rh-n  { top: 0; left: 14px; right: 14px; height: 5px; cursor: n-resize; background: transparent; }
        .jn-rh-s  { bottom: 0; left: 14px; right: 14px; height: 5px; cursor: s-resize; background: transparent; }
        .jn-rh-e  { top: 14px; bottom: 14px; right: 0; width: 5px; cursor: e-resize; background: transparent; }
        .jn-rh-w  { top: 14px; bottom: 14px; left: 0; width: 5px; cursor: w-resize; background: transparent; }
        .jn-rh-n:hover, .jn-rh-s:hover { background: rgba(74,144,226,0.18); }
        .jn-rh-e:hover, .jn-rh-w:hover { background: rgba(74,144,226,0.18); }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // MOTEUR DE CONVERSION NOMBRE -> LETTRES (français, sans "et" superflu)
    // (repris de widget-nombres-chiffres-lettres.js)
    // =========================================================================
    const JN_WORD_TILE_ROWS = [
        ['un','deux','trois','quatre','cinq','six','sept','huit','neuf'],
        ['dix','onze','douze','treize','quatorze','quinze','seize'],
        ['vingt','vingts','trente','quarante','cinquante','soixante'],
        ['cent','cents','mille','million','millions','milliard','milliards','et']
    ];
    const JN_DIGIT_TILES = ['0','1','2','3','4','5','6','7','8','9'];
    // Disposition façon cadran de téléphone : 1-2-3 / 4-5-6 / 7-8-9 / 0
    const JN_DIGIT_PAD_ROWS = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['0']];
    const JN_WORD_TILE_VALUES = {
        un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
        dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
        vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
        cent: 100, cents: 100, mille: 1000,
        million: 1000000, millions: 1000000,
        milliard: 1000000000, milliards: 1000000000
    };
    const JN_UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const JN_TEENS = { 10: 'dix', 11: 'onze', 12: 'douze', 13: 'treize', 14: 'quatorze', 15: 'quinze', 16: 'seize' };
    const JN_TENS  = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };

    function jnTwoDigits(n, isLast) {
        n = Math.round(n);
        if (n <= 0) return [];
        if (n < 10) return [JN_UNITS[n]];
        if (JN_TEENS[n]) return [JN_TEENS[n]];
        if (n < 20) return ['dix', JN_UNITS[n - 10]];
        const t = Math.floor(n / 10), u = n % 10;
        if (t === 7) {
            if (u === 1) return ['soixante', 'et', 'onze'];
            return ['soixante', ...jnTwoDigits(10 + u, isLast)];
        }
        if (t === 8) {
            if (u === 0) return isLast ? ['quatre', 'vingts'] : ['quatre', 'vingt'];
            return ['quatre', 'vingt', ...jnTwoDigits(u, isLast)];
        }
        if (t === 9) return ['quatre', 'vingt', ...jnTwoDigits(10 + u, isLast)];
        const tensWord = JN_TENS[t];
        if (u === 0) return [tensWord];
        if (u === 1) return [tensWord, 'et', 'un'];
        return [tensWord, ...jnTwoDigits(u, isLast)];
    }

    function jnThreeDigits(n, isLast) {
        n = Math.round(n);
        if (n <= 0) return [];
        const h = Math.floor(n / 100), rest = n % 100;
        let tokens = [];
        if (h > 0) {
            if (h === 1) {
                tokens.push('cent');
            } else {
                tokens.push(JN_UNITS[h]);
                tokens.push(rest === 0 ? (isLast ? 'cents' : 'cent') : 'cent');
            }
        }
        tokens = tokens.concat(jnTwoDigits(rest, isLast));
        return tokens;
    }

    // Convertit un entier positif en tableau d'étiquettes-mots (1 à 999 999 999 999)
    function jnNumberToTokens(n) {
        n = Math.round(n);
        if (!isFinite(n) || n <= 0 || n > 999999999999) return null;
        const milliard = Math.floor(n / 1e9);
        const million  = Math.floor((n % 1e9) / 1e6);
        const mille    = Math.floor((n % 1e6) / 1e3);
        const unit     = n % 1000;
        let tokens = [];
        if (milliard > 0) {
            tokens = tokens.concat(jnThreeDigits(milliard, false));
            tokens.push(milliard === 1 ? 'milliard' : 'milliards');
        }
        if (million > 0) {
            tokens = tokens.concat(jnThreeDigits(million, false));
            tokens.push(million === 1 ? 'million' : 'millions');
        }
        if (mille > 0) {
            if (mille === 1) {
                tokens.push('mille');
            } else {
                tokens = tokens.concat(jnThreeDigits(mille, false));
                tokens.push('mille');
            }
        }
        if (unit > 0) tokens = tokens.concat(jnThreeDigits(unit, true));
        return tokens;
    }

    // Regroupe une chaîne de chiffres par tranches de 3 en partant de la droite
    // (ex: "1234567" -> "1 234 567"), pour un affichage lisible du nombre proposé.
    function jnGroupDigits(digitsStr) {
        return digitsStr.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    }

    // ── Classes de grandeur proposées ───────────────────────────────────────
    const JN_CLASSES = [
        { key: 'unites',   label: 'Unités',    range: [1, 999],               weight: 1 },
        { key: 'mille',    label: 'Milliers',  range: [1000, 999999],         weight: 2 },
        { key: 'million',  label: 'Millions',  range: [1000000, 999999999],   weight: 3 },
        { key: 'milliard', label: 'Milliards', range: [1000000000, 999999999999], weight: 4 }
    ];

    function jnRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // Renvoie l'ensemble des indices de `student` qui font partie de la plus longue
    // sous-séquence commune avec `expected` (ordre respecté, mais pas forcément la
    // même position). Permet de ne signaler comme fausses que les étiquettes vraiment
    // fautives, sans faire "décaler" et marquer en rouge toutes celles qui suivent
    // une étiquette en trop ou manquante.
    function jnLCSMatchedIndices(student, expected) {
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

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================

    window.createJeuNombreWidget = function (savedData) {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = typeof findFreePosition === 'function' ? findFreePosition() : { x: 80, y: 80 };
        const initialLeft = Math.min(pos.x, 100);

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-nombre';
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
        container.className = 'jn-container';

        container.innerHTML = `
            <div class="jn-header">
                <span class="jn-title">🔢 Le Jeu des Nombres</span>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="jn-params-btn" title="Paramètres">⚙️</button>
                    <button class="jn-help-btn" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jn-params-panel">
                <div class="jn-params-title">Classes de nombres à utiliser :</div>
                <div class="jn-params-grid">
                    <label class="jn-class-check c-unites checked"><input type="checkbox" data-class="unites" checked>Unités (1 à 999)</label>
                    <label class="jn-class-check c-mille checked"><input type="checkbox" data-class="mille" checked>Milliers (1 000 à 999 999)</label>
                    <label class="jn-class-check c-million"><input type="checkbox" data-class="million">Millions (1 000 000 à 999 999 999)</label>
                    <label class="jn-class-check c-milliard"><input type="checkbox" data-class="milliard">Milliards (1 000 000 000 à 999 999 999 999)</label>
                </div>
                <div class="jn-params-row">
                    <label>Sens :</label>
                    <select class="jn-select jn-mode-select">
                        <option value="c2l">🔢➜🔤 Chiffres → Lettres</option>
                        <option value="l2c">🔤➜🔢 Lettres → Chiffres</option>
                        <option value="mixte" selected>🔀 Mélange des deux</option>
                    </select>
                </div>
                <div class="jn-params-row">
                    <label>Chrono par nombre :</label>
                    <select class="jn-select jn-timer-select">
                        <option value="0">Pas de chrono</option>
                        <option value="20">20 s</option>
                        <option value="30" selected>30 s</option>
                        <option value="45">45 s</option>
                        <option value="60">60 s</option>
                    </select>
                    <label>Vies :</label>
                    <select class="jn-select jn-lives-select">
                        <option value="3" selected>❤️❤️❤️ (3)</option>
                        <option value="5">❤️×5</option>
                        <option value="99">∞ illimitées</option>
                    </select>
                </div>
            </div>

            <div class="jn-controls">
                <button class="jn-btn jn-btn-pause">⏸ Pause</button>
                <button class="jn-btn jn-btn-reset">🔄 Recommencer</button>
            </div>

            <div class="jn-hud">
                <span class="jn-score">⭐ Score : <b>0</b></span>
                <span class="jn-streak">🔥 Série : <b>0</b></span>
                <span class="jn-timer">⏱ --</span>
                <span class="jn-lives">❤️❤️❤️</span>
            </div>
            <div class="jn-timerbar"><div class="jn-timerbar-fill"></div></div>

            <div class="jn-game-area">
                <div class="jn-prompt-zone">
                    <span class="jn-prompt-badge"></span>
                    <div class="jn-prompt-value">…</div>
                </div>

                <div class="jn-tiles-wrap">
                    <div class="jn-answer-zone"><span class="jn-answer-empty">Clique sur les étiquettes…</span></div>
                    <div class="jn-palette-zone"></div>
                    <div class="jn-success-overlay">
                        <span class="jn-success-emoji">🎉</span>
                        <span class="jn-success-msg">Bravo, c'est exact !</span>
                    </div>
                </div>

                <div class="jn-result-zone">
                    <button class="jn-btn jn-btn-clear">🗑 Effacer</button>
                    <button class="jn-btn jn-btn-validate">✓ Valider</button>
                    <button class="jn-btn jn-btn-solution">👁 Solution</button>
                    <button class="jn-btn jn-btn-continue hidden">▶ Continuer</button>
                    <span class="jn-result-text"></span>
                </div>

                <div class="jn-overlay hidden">
                    <div class="jn-overlay-card">
                        <div class="jn-overlay-title"></div>
                        <div class="jn-overlay-sub"></div>
                        <button class="jn-overlay-btn"></button>
                    </div>
                </div>
            </div>

            <div class="jn-help-popup">
                <h4>💡 Comment ça marche ?</h4>
                Un nombre s'affiche (en chiffres ou en lettres). Clique sur les étiquettes pour l'écrire dans l'autre écriture, avant la fin du chrono si celui-ci est activé.<br><br>
                ✓ <b>Valider</b> vérifie la réponse. Une bonne réponse rapporte des points (plus le nombre est grand, plus elle en rapporte). Une erreur ou un temps écoulé coûte une vie.<br><br>
                ⚙️ Choisis dans les paramètres les classes de nombres (unités, milliers, millions, milliards), le sens de l'exercice, le chrono et le nombre de vies.
            </div>
        `;

        widget.appendChild(container);

        // ── Poignées de redimensionnement ───────────────────────────────────
        const rhDirs = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
        rhDirs.forEach(dir => {
            const rh = document.createElement('div');
            rh.className = 'jn-rh jn-rh-' + dir;
            rh.dataset.dir = dir;
            widget.appendChild(rh);
        });

        // ── Références ───────────────────────────────────────────────────────
        const pauseBtn        = container.querySelector('.jn-btn-pause');
        const resetBtn         = container.querySelector('.jn-btn-reset');
        const paramsBtn      = container.querySelector('.jn-params-btn');
        const paramsPanel    = container.querySelector('.jn-params-panel');
        const classChecks    = container.querySelectorAll('.jn-class-check');
        const modeSelect      = container.querySelector('.jn-mode-select');
        const timerSelect      = container.querySelector('.jn-timer-select');
        const livesSelect      = container.querySelector('.jn-lives-select');
        const scoreEl         = container.querySelector('.jn-score b');
        const streakEl         = container.querySelector('.jn-streak b');
        const timerEl          = container.querySelector('.jn-timer');
        const livesEl           = container.querySelector('.jn-lives');
        const timerBarFill      = container.querySelector('.jn-timerbar-fill');
        const promptBadge      = container.querySelector('.jn-prompt-badge');
        const promptValue      = container.querySelector('.jn-prompt-value');
        const tilesWrap         = container.querySelector('.jn-tiles-wrap');
        const answerZone        = container.querySelector('.jn-answer-zone');
        const paletteZone       = container.querySelector('.jn-palette-zone');
        const successOverlay    = container.querySelector('.jn-success-overlay');
        const clearBtn           = container.querySelector('.jn-btn-clear');
        const validateBtn        = container.querySelector('.jn-btn-validate');
        const solutionBtn        = container.querySelector('.jn-btn-solution');
        const continueBtn         = container.querySelector('.jn-btn-continue');
        const resultText          = container.querySelector('.jn-result-text');
        const helpBtn             = container.querySelector('.jn-help-btn');
        const helpPopup            = container.querySelector('.jn-help-popup');
        const gameOverlay          = container.querySelector('.jn-overlay');
        const overlayTitle         = container.querySelector('.jn-overlay-title');
        const overlaySub           = container.querySelector('.jn-overlay-sub');
        const overlayBtn           = container.querySelector('.jn-overlay-btn');

        // ── État de jeu ──────────────────────────────────────────────────────
        let running = false;
        let score = 0, streak = 0, lives = 3, maxLives = 3;
        let currentMode = 'c2l';           // sens de la manche en cours
        let currentNumber = 0;
        let targetTokens = null;           // réponse attendue en mode c2l (mots)
        let targetDigits = null;           // réponse attendue en mode l2c (chiffres)
        let studentTiles = [];
        let insertCursor = null;           // position où insérer la prochaine étiquette (null = à la fin)
        let solutionShown = false;         // true tant que la solution est affichée, en attente du clic sur Continuer
        let timerDuration = 30;            // secondes, 0 = pas de chrono
        let timerRemaining = 0;
        let timerHandle = null;
        let destroyed = false;

        // ── Scale proportionnel ─────────────────────────────────────────────
        const BASE_W = 640;
        function applyScale() {
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jn-s', sc.toFixed(4));
        }

        // ── Paramètres : classes cochées ────────────────────────────────────
        function getCheckedClasses() {
            return JN_CLASSES.filter(c => {
                const cb = container.querySelector('.jn-class-check input[data-class="' + c.key + '"]');
                return cb && cb.checked;
            });
        }
        classChecks.forEach(label => {
            const cb = label.querySelector('input');
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                cb.checked = !cb.checked;
                label.classList.toggle('checked', cb.checked);
                if (typeof saveBoard === 'function') saveBoard();
            });
        });
        paramsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', paramsPanel.classList.contains('show'));
        });
        modeSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        timerSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        livesSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        modeSelect.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });
        timerSelect.addEventListener('change', () => {
            timerDuration = parseInt(timerSelect.value, 10) || 0;
            if (typeof saveBoard === 'function') saveBoard();
        });
        livesSelect.addEventListener('change', () => {
            maxLives = parseInt(livesSelect.value, 10) || 3;
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Aide ─────────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
        document.addEventListener('click', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        });

        // ── HUD ──────────────────────────────────────────────────────────────
        function updateHUD() {
            scoreEl.textContent = score;
            streakEl.textContent = streak;
            livesEl.textContent = lives >= 99 ? '∞' : '❤️'.repeat(Math.max(0, lives));
        }

        // ── Overlay démarrer / pause / fin ──────────────────────────────────
        function showOverlay(title, sub, btnLabel) {
            overlayTitle.textContent = title;
            overlaySub.textContent = sub;
            overlayBtn.textContent = btnLabel;
            gameOverlay.classList.remove('hidden');
        }
        function hideOverlay() { gameOverlay.classList.add('hidden'); }

        // ── Overlay de félicitations / étiquettes fausses ──────────────────
        function hideSuccessOverlay() {
            successOverlay.classList.remove('show');
            tilesWrap.classList.remove('jn-success-active');
        }
        function showSuccessOverlay() {
            successOverlay.classList.add('show');
            tilesWrap.classList.add('jn-success-active');
        }
        function clearWrongTiles() {
            answerZone.querySelectorAll('.jn-answer-tile-wrong').forEach(el => el.classList.remove('jn-answer-tile-wrong'));
        }
        function highlightWrongTiles() {
            const expected = currentMode === 'c2l' ? (targetTokens || []) : (targetDigits ? targetDigits.split('') : []);
            const matched = jnLCSMatchedIndices(studentTiles, expected);
            const tileEls = answerZone.querySelectorAll('.jn-answer-tile');
            tileEls.forEach((el, i) => {
                if (!matched.has(i)) el.classList.add('jn-answer-tile-wrong');
            });
        }

        // ── Insertion d'une étiquette : comble en priorité le trou laissé par une
        // étiquette retirée (insertCursor), sinon l'ajoute à la fin comme avant ──
        function insertStudentTile(val) {
            if (insertCursor !== null && insertCursor >= 0 && insertCursor <= studentTiles.length) {
                studentTiles.splice(insertCursor, 0, val);
                insertCursor = null; // une étiquette comble le trou, on repasse en mode "ajout à la fin"
            } else {
                studentTiles.push(val);
            }
        }

        // ── Rendu palette ────────────────────────────────────────────────────
        function renderPalette() {
            paletteZone.innerHTML = '';
            if (currentMode === 'c2l') {
                JN_WORD_TILE_ROWS.forEach((row, rowIdx) => {
                    const rowEl = document.createElement('div');
                    rowEl.className = 'jn-palette-row';
                    row.forEach(val => {
                        const el = document.createElement('div');
                        el.className = 'jn-tile jn-tile-row' + rowIdx + ' word-tile';
                        el.dataset.value = val;
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'jn-tile-word';
                        wordSpan.textContent = val;
                        el.appendChild(wordSpan);
                        const num = JN_WORD_TILE_VALUES[val];
                        if (num !== undefined) {
                            const numSpan = document.createElement('span');
                            numSpan.className = 'jn-tile-num';
                            numSpan.textContent = '(' + num.toLocaleString('fr-FR') + ')';
                            el.appendChild(numSpan);
                        }
                        el.addEventListener('pointerdown', (e) => e.stopPropagation());
                        el.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!running || solutionShown) return;
                            insertStudentTile(val);
                            renderAnswer(true);
                            if (typeof saveBoard === 'function') saveBoard();
                        });
                        rowEl.appendChild(el);
                    });
                    paletteZone.appendChild(rowEl);
                });
            } else {
                JN_DIGIT_PAD_ROWS.forEach(row => {
                    const rowEl = document.createElement('div');
                    rowEl.className = 'jn-palette-row jn-palette-row-digits';
                    row.forEach(val => {
                        const el = document.createElement('div');
                        el.className = 'jn-tile digit-tile';
                        el.dataset.value = val;
                        el.textContent = val;
                        el.addEventListener('pointerdown', (e) => e.stopPropagation());
                        el.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!running || solutionShown) return;
                            insertStudentTile(val);
                            renderAnswer(true);
                            if (typeof saveBoard === 'function') saveBoard();
                        });
                        rowEl.appendChild(el);
                    });
                    paletteZone.appendChild(rowEl);
                });
            }
        }

        // ── Rendu réponse ────────────────────────────────────────────────────
        function renderAnswer(animate) {
            answerZone.classList.toggle('digits-mode', currentMode === 'l2c');
            answerZone.innerHTML = '';
            if (studentTiles.length === 0) {
                const empty = document.createElement('span');
                empty.className = 'jn-answer-empty';
                empty.textContent = 'Dépose ici les étiquettes…';
                answerZone.appendChild(empty);
                return;
            }
            studentTiles.forEach((val, idx) => {
                if (idx > 0 && currentMode === 'c2l') {
                    const sep = document.createElement('span');
                    sep.className = 'jn-answer-sep';
                    sep.textContent = '-';
                    if (animate) { sep.classList.add('jn-anim-in'); sep.style.animationDelay = (idx * 90) + 'ms'; }
                    answerZone.appendChild(sep);
                }
                const el = document.createElement('div');
                el.className = 'jn-answer-tile' + (currentMode === 'l2c' ? ' digit-tile' : '');
                el.textContent = val;
                el.title = 'Cliquer pour retirer';
                if (animate) { el.classList.add('jn-anim-in'); el.style.animationDelay = (idx * 90) + 'ms'; }
                el.addEventListener('pointerdown', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (!running || solutionShown) return;
                    studentTiles.splice(idx, 1);
                    insertCursor = idx;
                    renderAnswer();
                    if (typeof saveBoard === 'function') saveBoard();
                });
                answerZone.appendChild(el);
                if (currentMode === 'l2c') {
                    const fromEnd = studentTiles.length - idx - 1;
                    if (fromEnd > 0 && fromEnd % 3 === 0) {
                        const groupSep = document.createElement('span');
                        groupSep.className = 'jn-answer-groupsep';
                        if (animate) { groupSep.classList.add('jn-anim-in'); groupSep.style.animationDelay = (idx * 90) + 'ms'; }
                        answerZone.appendChild(groupSep);
                    }
                }
            });
        }

        // ── Rendu de la solution, dans le cadre "Dépose ici les étiquettes…" ──
        function renderSolutionTiles() {
            const expected = currentMode === 'c2l' ? (targetTokens || []) : (targetDigits ? targetDigits.split('') : []);
            answerZone.classList.toggle('digits-mode', currentMode === 'l2c');
            answerZone.innerHTML = '';
            expected.forEach((val, idx) => {
                if (idx > 0 && currentMode === 'c2l') {
                    const sep = document.createElement('span');
                    sep.className = 'jn-answer-sep';
                    sep.textContent = '-';
                    answerZone.appendChild(sep);
                }
                const el = document.createElement('div');
                el.className = 'jn-answer-tile jn-answer-tile-solution' + (currentMode === 'l2c' ? ' digit-tile' : '');
                el.textContent = val;
                answerZone.appendChild(el);
                if (currentMode === 'l2c') {
                    const fromEnd = expected.length - idx - 1;
                    if (fromEnd > 0 && fromEnd % 3 === 0) {
                        const groupSep = document.createElement('span');
                        groupSep.className = 'jn-answer-groupsep';
                        answerZone.appendChild(groupSep);
                    }
                }
            });
        }

        // ── Chrono par question ─────────────────────────────────────────────
        function stopTimer() {
            if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
        }
        function updateTimerDisplay() {
            if (timerDuration <= 0) {
                timerEl.textContent = '⏱ —';
                timerEl.classList.remove('low');
                timerBarFill.style.width = '100%';
                timerBarFill.classList.remove('low');
                return;
            }
            timerEl.textContent = '⏱ ' + timerRemaining + ' s';
            const pct = Math.max(0, (timerRemaining / timerDuration) * 100);
            timerBarFill.style.width = pct + '%';
            const low = timerRemaining <= Math.min(5, Math.ceil(timerDuration * 0.2));
            timerEl.classList.toggle('low', low);
            timerBarFill.classList.toggle('low', low);
        }
        function startTimer() {
            stopTimer();
            timerDuration = parseInt(timerSelect.value, 10) || 0;
            if (timerDuration <= 0) { updateTimerDisplay(); return; }
            timerRemaining = timerDuration;
            updateTimerDisplay();
            timerHandle = setInterval(() => {
                if (!running) return;
                timerRemaining -= 1;
                updateTimerDisplay();
                if (timerRemaining <= 0) {
                    stopTimer();
                    onTimeUp();
                }
            }, 1000);
        }

        // ── Génération d'une manche ──────────────────────────────────────────
        function pickMode() {
            const v = modeSelect.value;
            if (v === 'mixte') return Math.random() < 0.5 ? 'c2l' : 'l2c';
            return v;
        }
        function pickClass() {
            const checked = getCheckedClasses();
            if (checked.length === 0) return null;
            return checked[jnRandInt(0, checked.length - 1)];
        }
        function newRound() {
            clearWrongTiles();
            hideSuccessOverlay();
            resultText.classList.remove('show', 'exact', 'faux');
            resultText.textContent = '';
            solutionShown = false;
            validateBtn.disabled = false;
            clearBtn.disabled = false;
            solutionBtn.disabled = false;
            continueBtn.classList.add('hidden');

            const cls = pickClass();
            if (!cls) {
                showOverlay('⚠️ Aucune classe sélectionnée', 'Coche au moins une classe de nombres dans les paramètres (⚙️, en haut à droite), puis réessaie.', '🔄 Réessayer');
                running = false;
                overlayBtn.onclick = () => startGame();
                return;
            }

            currentNumber = jnRandInt(cls.range[0], cls.range[1]);
            currentMode = pickMode();
            targetDigits = String(currentNumber);
            targetTokens = jnNumberToTokens(currentNumber);
            studentTiles = [];
            insertCursor = null;

            if (currentMode === 'c2l') {
                promptBadge.textContent = '🔢➜🔤 Écris ce nombre en lettres';
                promptValue.textContent = jnGroupDigits(targetDigits);
                promptValue.classList.remove('words');
            } else {
                promptBadge.textContent = '🔤➜🔢 Écris ce nombre en chiffres';
                promptValue.textContent = targetTokens.join('-');
                promptValue.classList.add('words');
            }

            renderPalette();
            renderAnswer();
            startTimer();
        }

        // ── Validation ───────────────────────────────────────────────────────
        // Décrémente une vie. Retourne true si la partie se termine (plus de vie).
        // Ne touche plus à resultText : c'est à l'appelant de composer son message,
        // en y ajoutant le nombre de vies restantes une fois loseLife() résolue.
        function loseLife() {
            lives = Math.max(0, lives - 1);
            streak = 0;
            updateHUD();
            if (lives <= 0) {
                endGame();
                return true;
            }
            return false;
        }
        function livesLeftLabel() {
            return lives >= 99 ? '∞' : lives;
        }

        function onValidate() {
            if (!running || solutionShown) return;
            let ok = false;
            if (currentMode === 'c2l') {
                ok = studentTiles.join('-') === (targetTokens || []).join('-');
            } else {
                ok = studentTiles.join('') === targetDigits;
            }
            resultText.classList.remove('exact', 'faux');
            hideSuccessOverlay();
            clearWrongTiles();

            if (ok) {
                const cls = JN_CLASSES.find(c => currentNumber >= c.range[0] && currentNumber <= c.range[1]) || JN_CLASSES[0];
                score += cls.weight;
                streak += 1;
                updateHUD();
                resultText.textContent = '';
                showSuccessOverlay();
                stopTimer();
                setTimeout(() => { if (running) newRound(); }, 1100);
            } else {
                highlightWrongTiles();
                const gameOver = loseLife();
                if (!gameOver) {
                    resultText.textContent = '❌ Ce n\'est pas encore ça — il te reste ' + livesLeftLabel() + ' vie(s).';
                    resultText.classList.add('faux', 'show');
                }
            }
        }

        // ── Affiche la solution dans le cadre de réponse et attend "Continuer" ──
        function revealSolution(prefix) {
            if (!running || solutionShown) return;
            resultText.classList.remove('exact', 'faux');
            hideSuccessOverlay();
            clearWrongTiles();
            stopTimer();
            solutionShown = true;
            renderSolutionTiles();
            validateBtn.disabled = true;
            clearBtn.disabled = true;
            solutionBtn.disabled = true;

            const gameOver = loseLife();
            if (gameOver) return; // l'overlay de fin de partie prend le relais

            continueBtn.classList.remove('hidden');
            resultText.textContent = (prefix || '💡 Voici la solution') + ' — il te reste ' + livesLeftLabel() + ' vie(s).';
            resultText.classList.add('faux', 'show');
        }
        function continueAfterSolution() {
            solutionShown = false;
            validateBtn.disabled = false;
            clearBtn.disabled = false;
            solutionBtn.disabled = false;
            continueBtn.classList.add('hidden');
            if (running) newRound();
        }

        function onTimeUp() {
            revealSolution('⏱ Temps écoulé !');
        }

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!running || solutionShown) return;
            studentTiles = [];
            insertCursor = null;
            renderAnswer();
            resultText.classList.remove('show', 'exact', 'faux');
            hideSuccessOverlay();
            clearWrongTiles();
            if (typeof saveBoard === 'function') saveBoard();
        });
        validateBtn.addEventListener('click', (e) => { e.stopPropagation(); onValidate(); });
        solutionBtn.addEventListener('click', (e) => { e.stopPropagation(); revealSolution('💡 Voici la solution'); });
        continueBtn.addEventListener('click', (e) => { e.stopPropagation(); continueAfterSolution(); });

        // ── Boutons fenêtre ──────────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');
        let _isMax = false, _savedW = null;

        if (wfMin) {
            wfMin.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMax) wfMax.click();
                window._wfMiniBarCollapse(widget, '🔢 Le Jeu des Nombres');
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
                stopTimer();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Resize 8 directions ─────────────────────────────────────────────
        widget.querySelectorAll('.jn-rh[data-dir]').forEach(handle => {
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

        // ── Cycle de jeu ─────────────────────────────────────────────────────
        function startGame() {
            running = true;
            pauseBtn.textContent = '⏸ Pause';
            paramsPanel.classList.remove('show');
            paramsBtn.classList.remove('active');
            hideOverlay();
            newRound();
        }
        function pauseGame() {
            if (!running) return;
            running = false;
            pauseBtn.textContent = '▶ Reprendre';
            stopTimer();
            showOverlay('⏸ En pause', 'Clique sur Reprendre pour continuer la partie.', '▶ Reprendre');
            overlayBtn.onclick = () => startGame();
        }
        function endGame() {
            running = false;
            stopTimer();
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Meilleure série : ' + streak + '. Clique sur Rejouer pour continuer.', '🔄 Rejouer');
            overlayBtn.onclick = () => resetGame();
        }
        function resetGame() {
            stopTimer();
            pauseBtn.textContent = '⏸ Pause';
            score = 0; streak = 0; lives = maxLives = parseInt(livesSelect.value, 10) || 3;
            studentTiles = [];
            insertCursor = null;
            solutionShown = false;
            validateBtn.disabled = false;
            clearBtn.disabled = false;
            solutionBtn.disabled = false;
            continueBtn.classList.add('hidden');
            updateHUD();
            resultText.classList.remove('show', 'exact', 'faux');
            hideSuccessOverlay();
            promptBadge.textContent = '';
            promptValue.textContent = '…';
            answerZone.innerHTML = '';
            paletteZone.innerHTML = '';
            showOverlay('🔢 Le Jeu des Nombres', 'Écris chaque nombre proposé, en chiffres ou en lettres, avant la fin du chrono. Réglages disponibles via ⚙️.', '▶ Démarrer');
            overlayBtn.onclick = () => startGame();
        }

        function togglePause() {
            if (!running) { startGame(); return; }
            pauseGame();
        }
        pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
        resetBtn.addEventListener('click', (e) => { e.stopPropagation(); resetGame(); });

        // ── Init ─────────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' ||
                e.target.classList.contains('jn-tile') || e.target.classList.contains('jn-answer-tile') ||
                e.target.classList.contains('jn-class-check')) {
                e.stopPropagation();
                return;
            }
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus();
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        widget.addEventListener('mousedown', _onWidgetDown);
        widget.addEventListener('pointerdown', _onWidgetDown);

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (savedData) {
                if (savedData.timerDuration !== undefined) { timerSelect.value = String(savedData.timerDuration); timerDuration = savedData.timerDuration; }
                if (savedData.mode) modeSelect.value = savedData.mode;
                if (savedData.livesSetting) { livesSelect.value = String(savedData.livesSetting); maxLives = savedData.livesSetting; }
                if (Array.isArray(savedData.classes)) {
                    classChecks.forEach(label => {
                        const cb = label.querySelector('input');
                        const key = cb.dataset.class;
                        cb.checked = savedData.classes.includes(key);
                        label.classList.toggle('checked', cb.checked);
                    });
                }
                if (savedData.fullboard) { _isMax = true; container.classList.add('wf-fullboard'); }
                else {
                    if (savedData.containerW) container.style.width = savedData.containerW + 'px';
                    if (savedData.containerH) container.style.height = savedData.containerH + 'px';
                }
            } else {
                container.style.width = '900px';
                container.style.height = '760px';
            }
            applyScale();
            if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
            lives = maxLives = parseInt(livesSelect.value, 10) || 3;
            timerDuration = parseInt(timerSelect.value, 10) || 0;
            updateHUD();
            resetGame();
        }));

        // ── Export des données pour la sauvegarde ───────────────────────────
        widget._jnGetData = function () {
            return {
                mode: modeSelect.value,
                timerDuration: parseInt(timerSelect.value, 10) || 0,
                livesSetting: parseInt(livesSelect.value, 10) || 3,
                classes: Array.from(classChecks).filter(l => l.querySelector('input').checked).map(l => l.querySelector('input').dataset.class),
                containerW: container.classList.contains('wf-fullboard') ? null : container.offsetWidth,
                containerH: container.classList.contains('wf-fullboard') ? null : container.offsetHeight,
                fullboard: container.classList.contains('wf-fullboard')
            };
        };

        // ── Nettoyage si le widget est retiré du DOM autrement que via wfClose ──
        const _observer = new MutationObserver(() => {
            if (!document.body.contains(widget)) {
                stopTimer();
                destroyed = true;
                _observer.disconnect();
            }
        });
        _observer.observe(document.body, { childList: true, subtree: true });

        if (typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _origJn = window.createWidget;
    if (typeof _origJn === 'function') {
        window.createWidget = function (type) {
            if (type === 'jeu-nombre') return window.createJeuNombreWidget();
            return _origJn.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-nombre') return window.createJeuNombreWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }

})();
