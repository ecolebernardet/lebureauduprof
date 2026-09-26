// =========================================================================
// JEU « LA CHASSE AUX HOMOPHONES » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Stand de tir de fête foraine : une phrase à trou s'affiche, des canards
// défilent en portant des homophones. L'élève tire sur le canard qui porte
// le mot correct. 10 phrases par partie.
// 3 niveaux : facile   (a/à, et/est, on/ont, son/sont)
//             moyen    (facile + ou/où, ces/ses, ce/se, mes/mais)
//             difficile(facile + moyen + c'est/s'est, peu/peut/peux,
//                       sa/ça, leur/leurs)
// Un menu permet de ne travailler qu'un seul couple d'homophones.
//
// Ouverture : createWidget('jeu-homophones')
// Dépendances : board, findFreePosition(), makeDraggable(),
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


    // ── CSS du jeu (préfixe jch-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-homophones-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-homophones-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-homophones"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jch-container {
            --jch-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --bois: #E8B36A;
            --bois-fonce: #B97A35;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jch-s)) calc(14px * var(--jch-s)) calc(14px * var(--jch-s));
            border-radius: calc(24px * var(--jch-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jch-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jch-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jch-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jch-s));
            width: 100%; max-width: calc(672px * var(--jch-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jch-header { display: flex; align-items: center; gap: calc(10px * var(--jch-s)); cursor: move; flex-wrap: wrap; }
        .jch-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jch-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jch-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jch-stats { display: flex; gap: calc(6px * var(--jch-s)); align-items: center; margin-left: auto; }
        .jch-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jch-s)) calc(10px * var(--jch-s));
            font-weight: 900; font-size: calc(14px * var(--jch-s));
            white-space: nowrap;
        }
        .jch-chip.hot { background: #FF7A1A; }
        @keyframes jch-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jch-chip.bump { animation: jch-bump .4s ease; }
        .jch-icon-btn {
            width: calc(26px * var(--jch-s)); height: calc(26px * var(--jch-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jch-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jch-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + choix + progression ── */
        .jch-bar { display: flex; align-items: center; gap: calc(6px * var(--jch-s)); flex-wrap: wrap; }
        .jch-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jch-s));
            padding: calc(5px * var(--jch-s)) calc(12px * var(--jch-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jch-lvl:hover { background: rgba(255,255,255,0.1); }
        .jch-lvl:active { transform: scale(0.95); }
        .jch-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jch-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jch-s));
            padding: calc(4px * var(--jch-s)) calc(8px * var(--jch-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }
        .jch-progress { margin-left: auto; display: flex; gap: calc(3px * var(--jch-s)); align-items: center; flex-shrink: 0; }
        .jch-pdot {
            width: calc(10px * var(--jch-s)); height: calc(10px * var(--jch-s));
            border-radius: 50%; background: rgba(255,255,255,0.15);
        }
        .jch-pdot.good { background: var(--vert); }
        .jch-pdot.meh  { background: #FFB020; }
        .jch-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Stand de tir ── */
        .jch-scene {
            position: relative;
            height: calc(312px * var(--jch-s));
            border-radius: calc(18px * var(--jch-s));
            overflow: hidden;
            flex-shrink: 0;
            cursor: crosshair;
            background:
                radial-gradient(circle at 50% 110%, rgba(255,201,51,0.25), transparent 60%),
                linear-gradient(180deg, #3D2C8D 0%, #5B3FB0 55%, #7A55C9 100%);
        }
        .jch-curtain {
            position: absolute; left: 0; right: 0; top: 0; height: calc(26px * var(--jch-s));
            background: repeating-linear-gradient(90deg, #FF4F5E 0 calc(30px * var(--jch-s)), #fff calc(30px * var(--jch-s)) calc(60px * var(--jch-s)));
            z-index: 3;
        }
        .jch-curtain::after {
            content: ''; position: absolute; left: 0; right: 0; top: 100%; height: calc(12px * var(--jch-s));
            background:
                radial-gradient(ellipse calc(15px * var(--jch-s)) calc(12px * var(--jch-s)) at calc(15px * var(--jch-s)) 0, #FF4F5E 97%, transparent 100%) 0 0 / calc(60px * var(--jch-s)) 100% repeat-x,
                radial-gradient(ellipse calc(15px * var(--jch-s)) calc(12px * var(--jch-s)) at calc(45px * var(--jch-s)) 0, #fff 97%, transparent 100%) 0 0 / calc(60px * var(--jch-s)) 100% repeat-x;
        }
        .jch-bulbs {
            position: absolute; left: 0; right: 0; top: calc(40px * var(--jch-s)); height: calc(10px * var(--jch-s));
            background: radial-gradient(circle, #FFE27A 0 calc(3px * var(--jch-s)), rgba(255,226,122,0.35) calc(4px * var(--jch-s)), transparent calc(6px * var(--jch-s))) 0 0 / calc(34px * var(--jch-s)) 100% repeat-x;
            animation: jch-twinkle 1.4s steps(2) infinite;
        }
        @keyframes jch-twinkle { 50% { opacity: 0.55; } }

        /* Panneau de la phrase */
        .jch-board {
            position: absolute; left: calc(18px * var(--jch-s)); right: calc(18px * var(--jch-s)); top: calc(54px * var(--jch-s));
            min-height: calc(56px * var(--jch-s));
            background: var(--creme);
            border: calc(4px * var(--jch-s)) solid var(--bois-fonce);
            border-radius: calc(12px * var(--jch-s));
            box-shadow: 0 calc(5px * var(--jch-s)) 0 #7C4E1E;
            display: flex; align-items: center; justify-content: center; text-align: center;
            padding: calc(6px * var(--jch-s)) calc(14px * var(--jch-s));
            box-sizing: border-box;
            font-weight: 900; font-size: calc(23px * var(--jch-s)); line-height: 1.25;
            color: var(--encre);
            cursor: default; z-index: 2;
        }
        .jch-blank {
            display: inline-block; min-width: calc(62px * var(--jch-s));
            padding: 0 calc(6px * var(--jch-s));
            border-radius: calc(6px * var(--jch-s));
            background: rgba(255,201,51,0.35);
            border-bottom: calc(3px * var(--jch-s)) dashed #B3470F;
            color: transparent;
        }
        .jch-blank.filled { color: #fff; background: var(--vert); border-bottom-color: transparent; animation: jch-pop .35s ease-out; }
        .jch-blank.wrong  { color: #fff; background: var(--rouge); border-bottom-color: transparent; text-decoration: line-through; animation: jch-shake .4s ease; }
        @keyframes jch-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes jch-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px) rotate(-3deg); }
            40% { transform: translateX(5px) rotate(3deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
        }
        .jch-board.enter { animation: jch-pop .35s ease-out; }

        /* Rangées de canards */
        .jch-row {
            position: absolute; left: 0; right: 0; height: calc(100px * var(--jch-s));
            overflow: hidden;
        }
        .jch-row.r1 { top: calc(114px * var(--jch-s)); }
        .jch-row.r2 { top: calc(212px * var(--jch-s)); }
        .jch-waves {
            position: absolute; left: calc(-40px * var(--jch-s)); right: calc(-40px * var(--jch-s)); bottom: 0;
            height: calc(26px * var(--jch-s)); z-index: 2; pointer-events: none;
            background:
                radial-gradient(circle at 50% 100%, var(--wv) 0 calc(20px * var(--jch-s)), transparent calc(21px * var(--jch-s))) 0 calc(-6px * var(--jch-s)) / calc(40px * var(--jch-s)) 100% repeat-x,
                linear-gradient(var(--wv), var(--wv)) 0 100% / 100% 45% no-repeat;
        }
        .jch-row.r1 .jch-waves { --wv: #3BA7FF; animation: jch-wave 2.4s ease-in-out infinite alternate; }
        .jch-row.r2 .jch-waves { --wv: #2F6FEB; animation: jch-wave 2s ease-in-out infinite alternate-reverse; }
        @keyframes jch-wave { to { transform: translateX(calc(20px * var(--jch-s))); } }
        .jch-rail {
            position: absolute; left: 0; right: 0; bottom: calc(22px * var(--jch-s));
            height: calc(5px * var(--jch-s)); background: rgba(0,0,0,0.25);
        }

        .jch-duck {
            position: absolute; left: 0; bottom: calc(10px * var(--jch-s));
            width: calc(116px * var(--jch-s)); height: calc(86px * var(--jch-s));
            cursor: crosshair; touch-action: none;
            will-change: transform;
        }
        .jch-sign {
            position: absolute; left: 50%; top: calc(6px * var(--jch-s)); transform: translateX(-50%);
            background: #fff; color: var(--encre);
            border: calc(3px * var(--jch-s)) solid var(--encre);
            border-radius: calc(9px * var(--jch-s));
            padding: calc(1px * var(--jch-s)) calc(10px * var(--jch-s));
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(22px * var(--jch-s)); line-height: 1.15;
            white-space: nowrap; z-index: 1;
            box-shadow: 0 calc(3px * var(--jch-s)) 0 rgba(0,0,0,0.25);
            transition: background .15s, color .15s;
        }
        .jch-duck:hover .jch-sign { background: #FFF3C4; }
        .jch-stick {
            position: absolute; left: 50%; top: calc(32px * var(--jch-s)); transform: translateX(-50%);
            width: calc(5px * var(--jch-s)); height: calc(14px * var(--jch-s)); background: var(--encre);
        }
        .jch-bird {
            position: absolute; left: 0; right: 0; bottom: 0; height: calc(46px * var(--jch-s));
            transform-origin: 50% 100%;
        }
        .jch-row.r2 .jch-bird { transform: scaleX(-1); }
        .jch-body {
            position: absolute; left: 18%; bottom: 0; width: 60%; height: 64%;
            background: var(--dc, #FFC933);
            border-radius: 55% 45% 40% 60% / 70% 60% 40% 30%;
            box-shadow: inset 0 calc(-5px * var(--jch-s)) 0 rgba(0,0,0,0.12);
        }
        .jch-body::after { /* aile */
            content: ''; position: absolute; left: 22%; top: 22%; width: 42%; height: 46%;
            background: rgba(0,0,0,0.12); border-radius: 50% 50% 50% 50% / 30% 30% 70% 70%;
        }
        .jch-head {
            position: absolute; right: 12%; bottom: 44%; width: 30%; height: 70%;
            background: var(--dc, #FFC933); border-radius: 50%;
        }
        .jch-head::before { /* œil */
            content: ''; position: absolute; left: 48%; top: 30%;
            width: calc(7px * var(--jch-s)); height: calc(7px * var(--jch-s)); border-radius: 50%;
            background: var(--encre); box-shadow: calc(1px * var(--jch-s)) calc(-1px * var(--jch-s)) 0 calc(-2px * var(--jch-s)) #fff inset;
        }
        .jch-head::after { /* bec */
            content: ''; position: absolute; right: calc(-12px * var(--jch-s)); top: 48%;
            width: calc(16px * var(--jch-s)); height: calc(9px * var(--jch-s));
            background: #FF7A1A; border-radius: 0 50% 50% 0;
        }
        @keyframes jch-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(calc(-4px * var(--jch-s))); } }
        .jch-duck .jch-bird-wrap { position: absolute; inset: 0; animation: jch-bob 1.1s ease-in-out infinite; }
        .jch-duck:nth-child(2n) .jch-bird-wrap { animation-delay: -.5s; }

        /* Touché / raté */
        @keyframes jch-down { 0% { transform: rotateX(0); } 30% { transform: rotateX(-25deg) translateY(-6px); } 100% { transform: rotateX(90deg) translateY(30px); opacity: 0.2; } }
        .jch-duck.hit .jch-bird-wrap { animation: jch-down .7s ease-in forwards; transform-origin: 50% 100%; }
        .jch-duck.hit .jch-sign { background: var(--vert); color: #fff; }
        .jch-duck.miss .jch-sign { background: var(--rouge); color: #fff; animation: jch-shake .4s ease; }
        .jch-duck.glow .jch-sign { box-shadow: 0 0 0 calc(4px * var(--jch-s)) var(--or), 0 0 calc(18px * var(--jch-s)) var(--or); }
        .jch-duck.off { pointer-events: none; opacity: 0.45; }
        .jch-boom {
            position: absolute; z-index: 5; pointer-events: none;
            font-size: calc(34px * var(--jch-s)); transform: translate(-50%, -50%);
            animation: jch-boom .45s ease-out forwards;
        }
        @keyframes jch-boom { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; } }

        .jch-paused {
            position: absolute; inset: 0; z-index: 8; display: none;
            align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55); color: #fff;
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jch-s));
            cursor: pointer;
        }
        .jch-paused.show { display: flex; }

        /* ── Actions ── */
        .jch-actions { display: flex; gap: calc(8px * var(--jch-s)); justify-content: center; flex-wrap: wrap; }
        .jch-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jch-s));
            padding: calc(8px * var(--jch-s)) calc(14px * var(--jch-s));
            border-radius: calc(14px * var(--jch-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jch-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jch-btn:hover { filter: brightness(1.05); }
        .jch-btn:active { transform: translateY(calc(4px * var(--jch-s))); box-shadow: 0 calc(1px * var(--jch-s)) 0 #B9B2D6; }
        .jch-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jch-s));
            padding: calc(8px * var(--jch-s)) calc(22px * var(--jch-s));
            box-shadow: 0 calc(5px * var(--jch-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jch-btn-go:active { box-shadow: 0 calc(1px * var(--jch-s)) 0 #1C8A4F; }
        .jch-btn:focus-visible, .jch-lvl:focus-visible, .jch-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Forain (messages) ── */
        .jch-talk { display: flex; align-items: center; gap: calc(10px * var(--jch-s)); }
        .jch-chef {
            width: calc(44px * var(--jch-s)); height: calc(44px * var(--jch-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jch-s));
            box-shadow: 0 calc(3px * var(--jch-s)) 0 #B3840B;
        }
        @keyframes jch-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jch-s))) rotate(-8deg); } }
        .jch-chef.hop { animation: jch-hop .4s ease; }
        .jch-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jch-s));
            padding: calc(8px * var(--jch-s)) calc(12px * var(--jch-s));
            font-weight: 700; font-size: calc(15px * var(--jch-s)); line-height: 1.35;
            min-height: calc(40px * var(--jch-s));
            border-left: calc(6px * var(--jch-s)) solid var(--or);
        }
        .jch-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jch-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jch-msg b { font-weight: 900; }
        .jch-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; white-space: nowrap; }

        /* ── Écran de fin ── */
        .jch-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.45); cursor: default;
        }
        .jch-overlay.show { display: flex; }
        .jch-card {
            background: #fff; border-radius: calc(18px * var(--jch-s));
            padding: calc(12px * var(--jch-s)) calc(22px * var(--jch-s)) calc(14px * var(--jch-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jch-s)) 0 #B9B2D6;
            animation: jch-pop .35s ease-out;
            max-width: 90%;
        }
        .jch-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jch-s)); color: var(--encre); }
        .jch-card p { margin: calc(4px * var(--jch-s)) 0 calc(8px * var(--jch-s)); font-weight: 800; font-size: calc(14px * var(--jch-s)); }
        .jch-card .jch-sub { font-size: calc(12px * var(--jch-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jch-s)); }
        .jch-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jch-s)); margin: calc(4px * var(--jch-s)) 0; }
        .jch-bigstars span { font-size: calc(34px * var(--jch-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jch-bigstars span.on { opacity: 1; filter: none; animation: jch-pop .35s ease-out both; }
        .jch-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jch-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jch-medal { font-size: calc(56px * var(--jch-s)); line-height: 1; animation: jch-pop .5s ease-out; }

        /* ── Aide ── */
        .jch-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 340px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jch-help.show { display: block; }
        .jch-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jch-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jch-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jch-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jch-fall 1.8s ease-in forwards; }
        @keyframes jch-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jch-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jch-container:hover .jch-rh { opacity: 1; }
        .jch-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jch-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jch-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jch-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jch-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jch-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jch-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jch-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jch-container *, .jch-container *::before, .jch-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUE DE PHRASES — « _ » marque le trou à compléter
    // =========================================================================
    const JCH_GROUPS = {
        'a-à': {
            opts: ['a', 'à'],
            tip: '<b>a</b> (verbe avoir) peut se remplacer par <b>avait</b>. Si ça ne marche pas, on écrit <b>à</b>.',
            test: { 'a': 'avait', 'à': 'avait' },
            items: [
                ['Léa _ un joli vélo rouge.', 'a'], ['Nous allons _ la piscine demain.', 'à'],
                ['Mon frère _ perdu sa casquette.', 'a'], ['Il habite _ Paris depuis trois ans.', 'à'],
                ['Le chien _ très faim ce soir.', 'a'], ['Je donne une pomme _ la maîtresse.', 'à'],
                ['Papa _ réparé la vieille voiture.', 'a'], ['Tu joues _ cache-cache avec nous ?', 'à'],
                ['Cette tarte _ un goût de fraise.', 'a'], ['Le train part _ huit heures.', 'à'],
            ],
        },
        'et-est': {
            opts: ['et', 'est'],
            tip: '<b>est</b> (verbe être) peut se remplacer par <b>était</b>. <b>et</b> relie deux mots ou deux idées : on peut dire <b>et puis</b>.',
            test: { 'est': 'était', 'et': 'et puis' },
            items: [
                ['Le ciel _ tout bleu aujourd\'hui.', 'est'], ['J\'aime les pommes _ les poires.', 'et'],
                ['Mon chat _ caché sous le lit.', 'est'], ['Tom _ Lina jouent au ballon.', 'et'],
                ['La soupe _ trop chaude.', 'est'], ['Il prend son sac _ il part à l\'école.', 'et'],
                ['Ce livre _ passionnant.', 'est'], ['Elle chante _ elle danse.', 'et'],
                ['Le magasin _ fermé le dimanche.', 'est'], ['Du pain _ du fromage, s\'il te plaît !', 'et'],
            ],
        },
        'on-ont': {
            opts: ['on', 'ont'],
            tip: '<b>ont</b> (verbe avoir) peut se remplacer par <b>avaient</b>. <b>on</b> peut se remplacer par <b>il</b>.',
            test: { 'ont': 'avaient', 'on': 'il' },
            items: [
                ['Les enfants _ construit une cabane.', 'ont'], ['Ce soir, _ va au cinéma.', 'on'],
                ['Mes cousins _ une grande maison.', 'ont'], ['Quand il pleut, _ reste à la maison.', 'on'],
                ['Les oiseaux _ fait leur nid.', 'ont'], ['À la récré, _ joue à chat.', 'on'],
                ['Mes parents _ acheté un chiot.', 'ont'], ['Demain, _ partira en vacances.', 'on'],
                ['Les élèves _ fini leurs exercices.', 'ont'], ['Chez nous, _ mange à midi.', 'on'],
            ],
        },
        'son-sont': {
            opts: ['son', 'sont'],
            tip: '<b>sont</b> (verbe être) peut se remplacer par <b>étaient</b>. <b>son</b> peut se remplacer par <b>mon</b>.',
            test: { 'sont': 'étaient', 'son': 'mon' },
            items: [
                ['Les fleurs _ très jolies.', 'sont'], ['Lucas a oublié _ cartable.', 'son'],
                ['Mes amis _ en vacances.', 'sont'], ['Elle promène _ chien au parc.', 'son'],
                ['Les gâteaux _ dans le four.', 'sont'], ['Le bébé serre _ doudou.', 'son'],
                ['Les rues _ pleines de neige.', 'sont'], ['Julie range _ bureau.', 'son'],
                ['Ces bonbons _ délicieux.', 'sont'], ['Le pirate cache _ trésor.', 'son'],
            ],
        },
        'ou-où': {
            opts: ['ou', 'où'],
            tip: '<b>ou</b> peut se remplacer par <b>ou bien</b> : c\'est un choix. <b>où</b> indique un lieu ou un moment.',
            test: { 'ou': 'ou bien', 'où': 'ou bien' },
            items: [
                ['Tu veux du jus _ du lait ?', 'ou'], ['Dis-moi _ tu habites.', 'où'],
                ['Rouge _ bleu, choisis ta couleur !', 'ou'], ['Je connais la ville _ tu es né.', 'où'],
                ['On part lundi _ mardi ?', 'ou'], ['C\'est le jour _ il a neigé.', 'où'],
                ['Tu dessines _ tu lis ?', 'ou'], ['Voici la maison _ j\'ai grandi.', 'où'],
            ],
        },
        'ces-ses': {
            opts: ['ces', 'ses'],
            tip: '<b>ses</b> veut dire « les siens » (à lui, à elle) : on peut dire <b>mes</b>. <b>ces</b> sert à montrer : on peut dire <b>ces … -là</b>.',
            test: { 'ses': 'mes', 'ces': 'ces … -là' },
            items: [
                ['Paul range _ jouets dans le coffre.', 'ses'], ['Regarde _ nuages noirs là-bas !', 'ces'],
                ['Mamie cherche _ lunettes.', 'ses'], ['Tu as vu _ beaux papillons ?', 'ces'],
                ['Le chat lèche _ pattes.', 'ses'], ['J\'adore _ chaussures-là !', 'ces'],
                ['Emma invite _ amies.', 'ses'], ['Qui a dessiné _ animaux ?', 'ces'],
            ],
        },
        'ce-se': {
            opts: ['ce', 'se'],
            tip: '<b>se</b> est devant un verbe : on peut dire <b>me</b> (il se lave → je me lave). <b>ce</b> est devant un nom ou veut dire <b>cela</b>.',
            test: { 'se': 'me', 'ce': 'cela' },
            items: [
                ['Le chat _ lave les pattes.', 'se'], ['J\'aime beaucoup _ film.', 'ce'],
                ['Les enfants _ cachent derrière l\'arbre.', 'se'], ['Qui a pris _ crayon ?', 'ce'],
                ['Elle _ brosse les dents.', 'se'], ['Il fait froid _ matin.', 'ce'],
                ['Mon frère _ lève tôt.', 'se'], ['Tu connais _ garçon ?', 'ce'],
            ],
        },
        'mes-mais': {
            opts: ['mes', 'mais'],
            tip: '<b>mais</b> peut se remplacer par <b>pourtant</b>. <b>mes</b> peut se remplacer par <b>tes</b> (ce sont les miens).',
            test: { 'mais': 'pourtant', 'mes': 'tes' },
            items: [
                ['J\'ai perdu _ clés.', 'mes'], ['Il pleut, _ je sors quand même.', 'mais'],
                ['Je range _ livres.', 'mes'], ['Il est petit _ très rapide.', 'mais'],
                ['Où sont _ chaussettes ?', 'mes'], ['Je voulais venir, _ j\'étais malade.', 'mais'],
                ['J\'invite _ cousins.', 'mes'], ['C\'est bon, _ c\'est trop sucré.', 'mais'],
            ],
        },
        'c\'est-s\'est': {
            opts: ['c\'est', 's\'est'],
            tip: '<b>c\'est</b> peut se remplacer par <b>cela est</b>. <b>s\'est</b> est devant un verbe : on peut dire <b>je me suis</b> (il s\'est lavé → je me suis lavé).',
            test: {},
            items: [
                ['Mon frère _ coupé le doigt.', 's\'est'], ['Regarde, _ mon meilleur ami !', 'c\'est'],
                ['Le chien _ caché sous la table.', 's\'est'], ['Dépêche-toi, _ l\'heure !', 'c\'est'],
                ['Julie _ endormie très tard.', 's\'est'], ['Je crois que _ fini.', 'c\'est'],
                ['Pierre _ trompé de route.', 's\'est'], ['Tu sais, _ très facile !', 'c\'est'],
            ],
        },
        'peu-peut-peux': {
            opts: ['peu', 'peut', 'peux'],
            tip: '<b>peut</b> et <b>peux</b> viennent du verbe pouvoir (→ <b>pouvait</b>) : <b>je / tu peux</b>, <b>il / elle / on peut</b>. <b>peu</b> est le contraire de <b>beaucoup</b>.',
            test: {},
            items: [
                ['Il _ venir avec nous.', 'peut'], ['Je _ t\'aider si tu veux.', 'peux'],
                ['J\'ai un _ froid.', 'peu'], ['Est-ce que tu _ fermer la porte ?', 'peux'],
                ['Elle _ nager très longtemps.', 'peut'], ['Il reste _ de gâteau.', 'peu'],
                ['Tu _ jouer dehors.', 'peux'], ['Mon chat mange très _.', 'peu'],
                ['On _ partir maintenant.', 'peut'],
            ],
        },
        'sa-ça': {
            opts: ['sa', 'ça'],
            tip: '<b>ça</b> peut se remplacer par <b>cela</b>. <b>sa</b> peut se remplacer par <b>ma</b> (c\'est la sienne).',
            test: { 'ça': 'cela', 'sa': 'ma' },
            items: [
                ['Léo cherche _ trousse.', 'sa'], ['Franchement, _ ne me plaît pas.', 'ça'],
                ['Elle a cassé _ montre.', 'sa'], ['Tu as vu _ ?', 'ça'],
                ['Mon oncle lave _ voiture.', 'sa'], ['Comment _ va ?', 'ça'],
                ['Le lapin mange _ carotte.', 'sa'], ['Arrête de faire _ !', 'ça'],
            ],
        },
        'leur-leurs': {
            opts: ['leur', 'leurs'],
            tip: '<b>leurs</b> (avec un s) se met devant un nom au pluriel. <b>leur</b> se met devant un nom au singulier, ou devant un verbe (il veut dire « à eux ») : là, il ne prend jamais de s.',
            test: {},
            items: [
                ['Les enfants rangent _ jouets.', 'leurs'], ['Je _ donne un bonbon.', 'leur'],
                ['Ils promènent _ chien.', 'leur'], ['Les oiseaux nourrissent _ petits.', 'leurs'],
                ['La maîtresse _ explique la leçon.', 'leur'], ['Mes voisins ont vendu _ maison.', 'leur'],
                ['Elles ont mis _ bottes.', 'leurs'], ['Nous _ avons écrit une lettre.', 'leur'],
            ],
        },
    };

    // Niveaux cumulatifs : chaque niveau reprend les homophones des niveaux précédents
    const JCH_G1 = ['a-à', 'et-est', 'on-ont', 'son-sont'];
    const JCH_G2 = ['ou-où', 'ces-ses', 'ce-se', 'mes-mais'];
    const JCH_G3 = ['c\'est-s\'est', 'peu-peut-peux', 'sa-ça', 'leur-leurs'];
    const JCH_LEVELS = {
        1: { groups: JCH_G1, speed: 42, perRow: 3 },
        2: { groups: JCH_G1.concat(JCH_G2), speed: 58, perRow: 3 },
        3: { groups: JCH_G1.concat(JCH_G2, JCH_G3), speed: 74, perRow: 3 },
    };
    const SENTENCES_PER_ROUND = 10;
    const DUCK_COLORS = ['#FFC933', '#FFFFFF', '#FF9EC7', '#8EE3A5', '#9FD4FF'];
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6', '#fff'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jchAudio = null;
    function tone(freq, start, dur, type, vol, slideTo) {
        try {
            if (!_jchAudio) _jchAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jchAudio, t0 = ctx.currentTime + start;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
            if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0); o.stop(t0 + dur + 0.05);
        } catch (e) { /* audio indisponible */ }
    }
    const SFX = {
        shot:  () => tone(900, 0, 0.12, 'square', 0.05, 120),
        quack: () => { tone(620, 0.05, 0.09, 'sawtooth', 0.06, 420); tone(560, 0.16, 0.12, 'sawtooth', 0.06, 360); },
        error: () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        ding:  () => { tone(1320, 0, 0.12, 'triangle', 0.08); tone(1760, 0.08, 0.2, 'triangle', 0.07); },
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuHomophonesWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-homophones';
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

        const duckHTML = `
            <div class="jch-sign"></div>
            <div class="jch-stick"></div>
            <div class="jch-bird-wrap"><div class="jch-bird"><div class="jch-body"></div><div class="jch-head"></div></div></div>`;

        const container = document.createElement('div');
        container.className = 'jch-container';
        container.innerHTML = `
          <div class="jch-inner">
            <div class="jch-header">
                <span class="jch-title">La chasse aux homophones</span>
                <div class="jch-stats">
                    <span class="jch-chip" data-role="streak" title="Bonnes réponses du premier coup d'affilée">🔥 0</span>
                    <span class="jch-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jch-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jch-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jch-bar">
                <button class="jch-lvl active" data-level="1">😊 Facile</button>
                <button class="jch-lvl" data-level="2">😐 Moyen</button>
                <button class="jch-lvl" data-level="3">😤 Difficile</button>
                <select class="jch-select" title="Choisir les homophones à travailler"></select>
                <div class="jch-progress" title="Phrases de la partie">
                    ${'<span class="jch-pdot"></span>'.repeat(SENTENCES_PER_ROUND)}
                </div>
            </div>

            <div class="jch-scene">
                <div class="jch-curtain"></div>
                <div class="jch-bulbs"></div>
                <div class="jch-board"></div>
                <div class="jch-row r1"><div class="jch-rail"></div><div class="jch-waves"></div></div>
                <div class="jch-row r2"><div class="jch-rail"></div><div class="jch-waves"></div></div>
                <div class="jch-paused" title="Clique pour reprendre">⏸ Pause</div>
                <div class="jch-overlay" data-role="win"><div class="jch-card"></div></div>
            </div>

            <div class="jch-talk">
                <div class="jch-chef">🎯</div>
                <div class="jch-msg"></div>
            </div>

            <div class="jch-actions">
                <button class="jch-btn" data-act="hint">💡 Astuce</button>
                <button class="jch-btn" data-act="pause">⏸ Pause</button>
                <button class="jch-btn" data-act="restart">🔄 Recommencer</button>
            </div>
          </div>

            <div class="jch-help">
                <h4>🎯 Comment jouer ?</h4>
                <p>Lis la phrase sur le panneau. Il manque un mot ! Des canards passent avec des mots qui <b>se prononcent pareil</b> mais ne s'écrivent pas pareil : ce sont des <b>homophones</b>.</p>
                <p>🎯 Clique sur le canard qui porte le <b>bon mot</b> pour compléter la phrase.</p>
                <p>💡 L'<b>astuce</b> te donne le truc pour choisir (par exemple : si on peut dire <i>avait</i>, on écrit <i>a</i>). Un 2<sup>e</sup> clic fait briller les bons canards.</p>
                <p>😊 <b>Facile</b> : a/à, et/est, on/ont, son/sont.<br>😐 <b>Moyen</b> : ceux du niveau facile + ou/où, ces/ses, ce/se, mes/mais.<br>😤 <b>Difficile</b> : tous les précédents + c'est/s'est, peu/peut/peux, sa/ça, leur/leurs.</p>
                <p style="margin:0">Le menu déroulant permet de travailler un seul couple d'homophones. 10 phrases = une partie !</p>
            </div>
            <div class="jch-confetti"></div>
            <div class="jch-rh jch-rh-nw" data-dir="nw"></div>
            <div class="jch-rh jch-rh-n"  data-dir="n"></div>
            <div class="jch-rh jch-rh-ne" data-dir="ne"></div>
            <div class="jch-rh jch-rh-e"  data-dir="e"></div>
            <div class="jch-rh jch-rh-se" data-dir="se"></div>
            <div class="jch-rh jch-rh-s"  data-dir="s"></div>
            <div class="jch-rh jch-rh-sw" data-dir="sw"></div>
            <div class="jch-rh jch-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jch-inner');
        const scene     = $('.jch-scene');
        const boardEl   = $('.jch-board');
        const rowEls    = [$('.jch-row.r1'), $('.jch-row.r2')];
        const pausedEl  = $('.jch-paused');
        const msg       = $('.jch-msg');
        const chef      = $('.jch-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jch-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jch-help');
        const confetti  = $('.jch-confetti');
        const selectEl  = $('.jch-select');
        const lvlBtns   = container.querySelectorAll('.jch-lvl');
        const pdots     = container.querySelectorAll('.jch-pdot');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const pauseBtn  = btn('pause');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let groupFilter = 'all';
        let queue = [];              // phrases de la partie : { g, s, a }
        let idx = 0;                 // phrase en cours
        let results = [];            // 'good' / 'meh' par phrase
        let errors = 0, hints = 0;
        let score = 0, streak = 0;
        let busy = false, paused = false;
        let soundOn = true;
        let curScale = 1;
        const rows = [{ el: rowEls[0], dir: 1, offset: 0, ducks: [] }, { el: rowEls[1], dir: -1, offset: 0, ducks: [] }];
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jch-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            curScale = sc;
            container.style.setProperty('--jch-s', sc.toFixed(4));
        }

        // ── Messages ───────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jch-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.className = 'jch-pdot' + (results[i] ? ' ' + results[i] : '') + (i === idx && !results[i] ? ' current' : '');
            });
        }

        // ── Choix des homophones ───────────────────────────────────────────
        function fillSelect() {
            const gs = JCH_LEVELS[level].groups;
            selectEl.innerHTML = '<option value="all">🎯 Tous</option>' +
                gs.map(g => `<option value="${esc(g)}">${esc(JCH_GROUPS[g].opts.join(' / '))}</option>`).join('');
            selectEl.value = 'all';
            groupFilter = 'all';
        }
        function buildQueue() {
            const gs = groupFilter === 'all' ? JCH_LEVELS[level].groups : [groupFilter];
            let pool = [];
            gs.forEach(g => JCH_GROUPS[g].items.forEach(([s, a]) => pool.push({ g, s, a })));
            pool = shuffle(pool);
            const out = [];
            while (out.length < SENTENCES_PER_ROUND) out.push(...pool.slice(0, SENTENCES_PER_ROUND - out.length));
            // Éviter deux phrases identiques à la suite (petites banques)
            for (let i = 1; i < out.length; i++) {
                if (out[i].s === out[i - 1].s) { const j = (i + 2) % out.length; [out[i], out[j]] = [out[j], out[i]]; }
            }
            return out;
        }

        // ── Canards ────────────────────────────────────────────────────────
        function makeDucks() {
            const q = queue[idx];
            const opts = JCH_GROUPS[q.g].opts;
            const per = JCH_LEVELS[level].perRow;
            // Chaque rangée contient tous les mots au moins une fois quand c'est possible
            rows.forEach((row, r) => {
                row.el.querySelectorAll('.jch-duck').forEach(d => d.remove());
                row.ducks = [];
                let words = shuffle(opts).slice(0, per);
                while (words.length < per) words.push(rnd(opts));
                if (!words.includes(q.a)) words[0] = q.a;
                words = shuffle(words);
                words.forEach((w, i) => {
                    const d = document.createElement('div');
                    d.className = 'jch-duck';
                    d.innerHTML = duckHTML;
                    d.querySelector('.jch-sign').textContent = w;
                    d.style.setProperty('--dc', rnd(DUCK_COLORS));
                    d.dataset.word = w;
                    d.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); shoot(d, e); });
                    row.el.insertBefore(d, row.el.querySelector('.jch-waves'));
                    row.ducks.push(d);
                });
                row.offset = Math.random() * 400;
            });
            placeDucks();
        }
        function placeDucks() {
            const duckW = 116 * curScale;
            rows.forEach(row => {
                const W = row.el.clientWidth || 670;
                const n = row.ducks.length;
                if (!n) return;
                const period = Math.max(W + duckW, n * duckW * 1.6);
                row.ducks.forEach((d, i) => {
                    let x = ((row.offset + i * period / n) % period + period) % period - duckW;
                    if (row.dir < 0) x = W - x - duckW;
                    d.style.transform = `translateX(${x.toFixed(1)}px)`;
                });
            });
        }
        let lastT = performance.now();
        function frame(t) {
            if (!widget.isConnected) return;
            const dt = Math.min(0.05, (t - lastT) / 1000);
            lastT = t;
            const frozen = paused || winLayer.classList.contains('show') || helpBox.classList.contains('show') || document.hidden;
            if (!frozen) {
                const v = JCH_LEVELS[level].speed * curScale;
                rows.forEach(row => { row.offset += v * dt; });
                placeDucks();
            }
            requestAnimationFrame(frame);
        }

        // ── Phrase ─────────────────────────────────────────────────────────
        function renderSentence(fill, cls) {
            const q = queue[idx];
            const [before, after] = q.s.split('_');
            const blank = `<span class="jch-blank${cls ? ' ' + cls : ''}">${fill ? esc(fill) : '&nbsp;?&nbsp;'}</span>`;
            boardEl.innerHTML = `<span>${esc(before)}${blank}${esc(after)}</span>`;
        }
        function loadSentence() {
            errors = 0; hints = 0; busy = false;
            renderSentence();
            boardEl.classList.remove('enter'); void boardEl.offsetWidth; boardEl.classList.add('enter');
            makeDucks();
            updateStats(false);
            const opts = JCH_GROUPS[queue[idx].g].opts.map(o => `<b>${esc(o)}</b>`).join(' ou ');
            say(`🎯 Phrase ${idx + 1} sur ${SENTENCES_PER_ROUND} : faut-il écrire ${opts} ? Vise le bon canard !`);
        }
        function newRound() {
            queue = buildQueue();
            idx = 0; results = [];
            winLayer.classList.remove('show');
            setPaused(false);
            loadSentence();
        }

        // ── Tir ────────────────────────────────────────────────────────────
        function boom(e, emoji) {
            const r = scene.getBoundingClientRect();
            const b = document.createElement('div');
            b.className = 'jch-boom';
            b.textContent = emoji;
            b.style.left = ((e.clientX - r.left) / (r.width / scene.offsetWidth)) + 'px';
            b.style.top  = ((e.clientY - r.top) / (r.height / scene.offsetHeight)) + 'px';
            scene.appendChild(b);
            setTimeout(() => b.remove(), 500);
        }
        // Astuce + test de remplacement sur la phrase (withProof : donne la conclusion)
        const PROOFS = {
            'a-à':      ['avait',   'a'],
            'et-est':   ['était',   'est'],
            'on-ont':   ['avaient', 'ont'],
            'son-sont': ['étaient', 'sont'],
            'mes-mais': ['pourtant','mais'],
            'sa-ça':    ['cela',    'ça'],
        };
        function explain(withProof) {
            const q = queue[idx], G = JCH_GROUPS[q.g];
            let proof = '';
            const P = PROOFS[q.g];
            if (withProof && P) {
                const [b, a] = q.s.split('_');
                const other = G.opts.find(o => o !== P[1]);
                proof = ` Essaie : « ${esc(b)}<b>${P[0]}</b>${esc(a)} » ` +
                    (q.a === P[1] ? `✅ ça marche, donc <b>${esc(P[1])}</b>.` : `❌ ça ne marche pas, donc <b>${esc(other)}</b>.`);
            }
            return G.tip + proof;
        }
        function shoot(duck, e) {
            if (busy || paused || winLayer.classList.contains('show')) return;
            const q = queue[idx];
            const word = duck.dataset.word;
            sfx('shot');
            if (word === q.a) {
                busy = true;
                boom(e, '💥');
                rows.forEach(r => r.ducks.forEach(d => { if (d !== duck) d.classList.add('off'); }));
                duck.classList.add('hit');
                setTimeout(() => sfx('quack'), 80);
                renderSentence(q.a, 'filled');
                const first = errors === 0 && hints === 0;
                streak = first ? streak + 1 : 0;
                const pts = (first ? 10 : (errors + hints <= 1 ? 5 : 2)) + (streak >= 3 ? 2 : 0);
                score += pts;
                results[idx] = first ? 'good' : 'meh';
                updateStats(true);
                say(`🎉 ${rnd(['Touché', 'Dans le mille', 'Bravo', 'Excellent', 'Bien visé'])} ! On écrit <span class="k">${esc(q.a)}</span>. +${pts} points${streak >= 3 ? ' (série 🔥)' : ''}<br><small>${JCH_GROUPS[q.g].tip}</small>`, 'good');
                setTimeout(() => {
                    if (!widget.isConnected) return;
                    if (idx >= SENTENCES_PER_ROUND - 1) finalScreen();
                    else { idx++; loadSentence(); }
                }, 2300);
            } else {
                errors++;
                boom(e, '💨');
                sfx('error');
                duck.classList.remove('miss'); void duck.offsetWidth; duck.classList.add('miss');
                setTimeout(() => duck.classList.remove('miss'), 600);
                renderSentence(word, 'wrong');
                setTimeout(() => { if (queue[idx] === q && !busy) renderSentence(); }, 900);
                streak = 0;
                updateStats(false);
                say(`🙈 Raté : ici, ce n'est pas <b>${esc(word)}</b>. ${explain(errors >= 2)}${errors >= 2 ? ' Les bons canards brillent ✨' : ''}`, 'bad');
                if (errors >= 2) glowAnswer();
            }
        }
        function glowAnswer() {
            const a = queue[idx].a;
            rows.forEach(r => r.ducks.forEach(d => d.classList.toggle('glow', d.dataset.word === a)));
        }

        // ── Astuce ─────────────────────────────────────────────────────────
        function giveHint() {
            if (busy || winLayer.classList.contains('show')) return;
            hints++;
            if (hints === 1) {
                say(`💡 ${explain(false)} Essaie de remplacer dans ta tête !`);
            } else {
                glowAnswer();
                say('💡 Regarde bien : les bons canards brillent ✨ Vise l\'un d\'eux !');
            }
            updateStats(false);
        }

        // ── Fin de partie ──────────────────────────────────────────────────
        function finalScreen() {
            busy = true;
            const good = results.filter(r => r === 'good').length;
            const st = good >= 9 ? 3 : good >= 6 ? 2 : 1;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : '🥉';
            const title = st === 3 ? 'Tireur d\'élite !' : st === 2 ? 'Beau tableau de chasse !' : 'Partie terminée !';
            idx = SENTENCES_PER_ROUND;
            updateStats(false);
            winCard.innerHTML = `
                <div class="jch-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jch-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} phrase${good > 1 ? 's' : ''} sur ${SENTENCES_PER_ROUND} réussie${good > 1 ? 's' : ''} du premier coup</p>
                <p class="jch-sub">Score total : ${score} points</p>
                <button class="jch-btn jch-btn-go" data-act="again">🔄 Nouvelle partie</button>`;
            winLayer.classList.add('show');
            sfx('win');
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 250 * n); });
            party();
            say(`🏁 Partie terminée : ${good} sur ${SENTENCES_PER_ROUND} du premier coup ! Rejoue ou choisis un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
        }
        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = rnd(CONFETTI_COLORS);
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Pause ──────────────────────────────────────────────────────────
        function setPaused(p) {
            paused = p;
            pausedEl.classList.toggle('show', p);
            pauseBtn.textContent = p ? '▶ Reprendre' : '⏸ Pause';
        }
        pauseBtn.addEventListener('click', () => { if (!winLayer.classList.contains('show')) setPaused(!paused); });
        pausedEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); setPaused(false); });

        // ── Niveaux ────────────────────────────────────────────────────────
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            streak = 0;
            fillSelect();
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        selectEl.addEventListener('change', () => { groupFilter = selectEl.value; streak = 0; newRound(); });
        selectEl.addEventListener('pointerdown', (e) => e.stopPropagation());
        selectEl.addEventListener('mousedown', (e) => e.stopPropagation());

        btn('hint').addEventListener('click', giveHint);
        btn('restart').addEventListener('click', () => { streak = 0; newRound(); });

        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundOn = !soundOn;
            soundBtn.textContent = soundOn ? '🔊' : '🔇';
            soundBtn.title = soundOn ? 'Couper le son' : 'Activer le son';
        });
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpBox.classList.toggle('show'); });
        const closeHelp = () => {
            if (!widget.isConnected) { document.removeEventListener('click', closeHelp); return; }
            helpBox.classList.remove('show');
        };
        document.addEventListener('click', closeHelp);

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin = $('[data-role="wf-min"]'), wfMax = $('[data-role="wf-max"]'), wfClose = $('[data-role="wf-close"]');
        let _isMax = false, _savedW = null, _savedH = null;
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            setPaused(true);
            window._wfMiniBarCollapse(widget, '🎯 La chasse aux homophones', { onExpand: applyScale });
        });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = container.style.width; _savedH = container.style.height;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                container.style.width = _savedW || '';
                container.style.height = _savedH || '';
            }
            requestAnimationFrame(applyScale);
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
        const onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
            if (_isMax) applyScale();
        };
        window.addEventListener('resize', onWinResize);

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jch-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                const startX = clientX, startY = clientY;
                const startW = container.offsetWidth, startH = container.offsetHeight;
                const startL = widget.offsetLeft, startT = widget.offsetTop;
                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (dir.includes('e')) newW = Math.max(420, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(420, startW - dx); newL = startL + (startW - newW); }
                    if (dir.includes('s')) newH = Math.max(300, startH + dy);
                    if (dir.includes('n')) { newH = Math.max(300, startH - dy); newT = startT + (startH - newH); }
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
            if (e.target.closest && e.target.closest('button, select, .jch-scene, .jch-rh, .jch-help')) {
                e.stopPropagation();
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
            setLevel(1);
            lastT = performance.now();
            requestAnimationFrame(frame);
            if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                wfMax.click();
            } else {
                const curW = window.innerWidth;
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }
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
            if (type === 'jeu-homophones') return window.createJeuHomophonesWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-homophones') return window.createJeuHomophonesWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
