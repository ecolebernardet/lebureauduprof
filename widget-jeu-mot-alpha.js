// =========================================================================
// JEU « LE TRAIN DE L'ALPHABET » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Clone ludique du widget « Ordre alphabétique » (widget-mots-alpha.js) :
// l'élève charge les caisses (mots) dans les wagons dans l'ordre
// alphabétique, puis fait partir le train. 5 trains par tournée.
// 3 niveaux : facile (initiales différentes) / moyen (même initiale) /
//             difficile (mêmes 3 premières lettres)
//
// Ouverture : createWidget('jeu-mot-alpha')
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

    // ── CSS du jeu (préfixe jma-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-mot-alpha-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-mot-alpha-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-mot-alpha"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Palette : encre, crème, bois, rail, et 6 couleurs de wagons */
        .jma-container {
            --jma-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --bois: #E8B36A;
            --bois-fonce: #B97A35;
            --rail: #6B4A36;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 680px;
            box-sizing: border-box;
            position: relative;
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jma-s));
            padding: calc(12px * var(--jma-s)) calc(14px * var(--jma-s)) calc(14px * var(--jma-s));
            border-radius: calc(24px * var(--jma-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jma-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jma-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }

        /* ── En-tête ── */
        .jma-header { display: flex; align-items: center; gap: calc(10px * var(--jma-s)); cursor: move; flex-wrap: wrap; }
        .jma-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jma-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jma-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jma-stats { display: flex; gap: calc(6px * var(--jma-s)); align-items: center; margin-left: auto; }
        .jma-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jma-s)) calc(10px * var(--jma-s));
            font-weight: 900; font-size: calc(14px * var(--jma-s));
            white-space: nowrap;
        }
        .jma-chip.hot { background: #FF7A1A; }
        @keyframes jma-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jma-chip.bump { animation: jma-bump .4s ease; }
        .jma-icon-btn {
            width: calc(26px * var(--jma-s)); height: calc(26px * var(--jma-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jma-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jma-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + progression ── */
        .jma-bar { display: flex; align-items: center; gap: calc(6px * var(--jma-s)); flex-wrap: wrap; }
        .jma-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jma-s));
            padding: calc(5px * var(--jma-s)) calc(12px * var(--jma-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jma-lvl:hover { background: rgba(255,255,255,0.1); }
        .jma-lvl:active { transform: scale(0.95); }
        .jma-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jma-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jma-s)); align-items: center; }
        .jma-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jma-s)); margin-right: 2px; }
        .jma-pdot {
            width: calc(22px * var(--jma-s)); height: calc(14px * var(--jma-s));
            border-radius: calc(4px * var(--jma-s)) calc(4px * var(--jma-s)) calc(2px * var(--jma-s)) calc(2px * var(--jma-s));
            background: rgba(255,255,255,0.15); position: relative;
        }
        .jma-pdot.done { background: var(--vert); }
        .jma-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Scène (paysage + rails + train) ── */
        .jma-scene {
            position: relative;
            height: calc(220px * var(--jma-s));
            border-radius: calc(18px * var(--jma-s));
            overflow: hidden;
            background: linear-gradient(180deg, #7FD3FF 0%, #BDE9FF 55%, #FFE9B8 100%);
            flex-shrink: 0;
        }
        .jma-sun {
            position: absolute; right: calc(60px * var(--jma-s)); top: calc(18px * var(--jma-s));
            width: calc(54px * var(--jma-s)); height: calc(54px * var(--jma-s)); border-radius: 50%;
            background: #FFD84D; box-shadow: 0 0 0 calc(10px * var(--jma-s)) rgba(255,216,77,0.3), 0 0 0 calc(22px * var(--jma-s)) rgba(255,216,77,0.15);
        }
        .jma-cloud {
            position: absolute; background: #fff; border-radius: 999px; opacity: 0.95;
            width: calc(70px * var(--jma-s)); height: calc(22px * var(--jma-s));
        }
        .jma-cloud::before, .jma-cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
        .jma-cloud::before { width: calc(34px * var(--jma-s)); height: calc(34px * var(--jma-s)); left: calc(10px * var(--jma-s)); top: calc(-16px * var(--jma-s)); }
        .jma-cloud::after  { width: calc(26px * var(--jma-s)); height: calc(26px * var(--jma-s)); left: calc(34px * var(--jma-s)); top: calc(-11px * var(--jma-s)); }
        @keyframes jma-drift { from { transform: translateX(0); } to { transform: translateX(calc(40px * var(--jma-s))); } }
        .jma-cloud.c1 { left: 8%;  top: calc(30px * var(--jma-s)); animation: jma-drift 14s ease-in-out infinite alternate; }
        .jma-cloud.c2 { left: 46%; top: calc(52px * var(--jma-s)); transform: scale(0.75); animation: jma-drift 18s ease-in-out infinite alternate-reverse; }
        .jma-hill {
            position: absolute; border-radius: 50%;
        }
        .jma-hill.h1 { left: -10%; bottom: calc(40px * var(--jma-s)); width: 70%; height: calc(120px * var(--jma-s)); background: #8EDB9B; }
        .jma-hill.h2 { right: -15%; bottom: calc(34px * var(--jma-s)); width: 75%; height: calc(140px * var(--jma-s)); background: #6CCB84; }
        .jma-hill.h3 { left: 25%; bottom: calc(30px * var(--jma-s)); width: 60%; height: calc(90px * var(--jma-s)); background: #56B870; }
        .jma-sign {
            position: absolute; left: calc(14px * var(--jma-s)); top: calc(14px * var(--jma-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', sans-serif; font-size: calc(15px * var(--jma-s));
            padding: calc(3px * var(--jma-s)) calc(10px * var(--jma-s));
            border-radius: calc(6px * var(--jma-s)); border: calc(3px * var(--jma-s)) solid #2F6FEB;
            box-shadow: 0 calc(3px * var(--jma-s)) 0 rgba(0,0,0,0.15);
        }
        .jma-ground {
            position: absolute; left: 0; right: 0; bottom: 0; height: calc(40px * var(--jma-s));
            background: #C9A26B;
        }
        .jma-rails {
            position: absolute; left: 0; right: 0; bottom: calc(18px * var(--jma-s)); height: calc(12px * var(--jma-s));
            background: repeating-linear-gradient(90deg, var(--rail) 0, var(--rail) calc(8px * var(--jma-s)), transparent calc(8px * var(--jma-s)), transparent calc(20px * var(--jma-s)));
        }
        .jma-rails::before {
            content: ''; position: absolute; left: 0; right: 0; top: calc(-2px * var(--jma-s)); height: calc(4px * var(--jma-s));
            background: #9AA3B5; border-radius: 2px;
        }

        /* ── Train ── */
        .jma-train {
            position: absolute; left: calc(12px * var(--jma-s)); right: calc(12px * var(--jma-s));
            bottom: calc(22px * var(--jma-s));
            display: flex; align-items: flex-end; flex-direction: row;
            gap: calc(5px * var(--jma-s));
        }
        @keyframes jma-depart { 0% { transform: translateX(0); } 15% { transform: translateX(8px); } 100% { transform: translateX(-115%); } }
        @keyframes jma-arrive { 0% { transform: translateX(115%); } 80% { transform: translateX(-6px); } 100% { transform: translateX(0); } }
        .jma-train.depart { animation: jma-depart 1.9s cubic-bezier(.5,0,.8,.4) forwards; }
        .jma-train.arrive { animation: jma-arrive 1.3s cubic-bezier(.2,.7,.3,1) both; }

        .jma-loco {
            position: relative; flex-shrink: 0;
            width: calc(82px * var(--jma-s)); height: calc(82px * var(--jma-s));
            transform: scaleX(-1);  /* locomotive tournée vers la gauche */
        }
        .jma-loco-cab {
            position: absolute; left: 0; bottom: calc(14px * var(--jma-s));
            width: calc(34px * var(--jma-s)); height: calc(56px * var(--jma-s));
            background: #E23B4A; border-radius: calc(6px * var(--jma-s)) calc(6px * var(--jma-s)) 0 0;
            box-shadow: inset 0 calc(-6px * var(--jma-s)) 0 rgba(0,0,0,0.15);
        }
        .jma-loco-cab::before { /* toit */
            content: ''; position: absolute; left: calc(-4px * var(--jma-s)); right: calc(-4px * var(--jma-s)); top: calc(-6px * var(--jma-s));
            height: calc(8px * var(--jma-s)); background: var(--encre); border-radius: calc(4px * var(--jma-s));
        }
        .jma-loco-cab::after { /* fenêtre */
            content: ''; position: absolute; left: calc(7px * var(--jma-s)); top: calc(8px * var(--jma-s));
            width: calc(20px * var(--jma-s)); height: calc(16px * var(--jma-s)); background: #CFF1FF; border-radius: calc(4px * var(--jma-s));
        }
        .jma-loco-boiler {
            position: absolute; left: calc(30px * var(--jma-s)); bottom: calc(14px * var(--jma-s));
            width: calc(46px * var(--jma-s)); height: calc(34px * var(--jma-s));
            background: #2F6FEB; border-radius: 0 calc(16px * var(--jma-s)) 0 0;
            box-shadow: inset 0 calc(-6px * var(--jma-s)) 0 rgba(0,0,0,0.15);
        }
        .jma-loco-boiler::after { /* phare */
            content: ''; position: absolute; right: calc(-5px * var(--jma-s)); top: calc(8px * var(--jma-s));
            width: calc(10px * var(--jma-s)); height: calc(10px * var(--jma-s)); border-radius: 50%;
            background: var(--or); box-shadow: 0 0 calc(8px * var(--jma-s)) var(--or);
        }
        .jma-chimney {
            position: absolute; left: calc(56px * var(--jma-s)); bottom: calc(46px * var(--jma-s));
            width: calc(14px * var(--jma-s)); height: calc(18px * var(--jma-s));
            background: var(--encre); border-radius: calc(3px * var(--jma-s)) calc(3px * var(--jma-s)) 0 0;
        }
        .jma-chimney::before {
            content: ''; position: absolute; left: calc(-3px * var(--jma-s)); right: calc(-3px * var(--jma-s)); top: calc(-4px * var(--jma-s));
            height: calc(6px * var(--jma-s)); background: var(--encre); border-radius: calc(3px * var(--jma-s));
        }
        .jma-smoke {
            position: absolute; left: calc(52px * var(--jma-s)); bottom: calc(64px * var(--jma-s));
            width: calc(18px * var(--jma-s)); height: calc(18px * var(--jma-s)); border-radius: 50%;
            background: rgba(255,255,255,0.9); opacity: 0; pointer-events: none;
        }
        @keyframes jma-puff {
            0% { transform: translate(0,0) scale(0.4); opacity: 0.9; }
            100% { transform: translate(calc(-40px * var(--jma-s)), calc(-50px * var(--jma-s))) scale(1.8); opacity: 0; }
        }
        .jma-train.puffing .jma-smoke { animation: jma-puff 0.9s ease-out infinite; }
        .jma-train.puffing .jma-smoke.p2 { animation-delay: .3s; }
        .jma-train.puffing .jma-smoke.p3 { animation-delay: .6s; }

        .jma-wheels { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-around; }
        .jma-wheel {
            width: calc(18px * var(--jma-s)); height: calc(18px * var(--jma-s)); border-radius: 50%;
            background: radial-gradient(circle, #C8CDD8 0 22%, var(--encre) 24% 100%);
            border: calc(2px * var(--jma-s)) solid #1A1330; box-sizing: border-box;
            background-clip: padding-box;
        }
        .jma-wheel::after {
            content: ''; display: block; width: 100%; height: 2px; background: #C8CDD8;
            margin-top: calc(50% - 1px);
        }
        @keyframes jma-spin { to { transform: rotate(-360deg); } }
        .jma-train.depart .jma-wheel, .jma-train.arrive .jma-wheel { animation: jma-spin .35s linear infinite; }
        .jma-loco .jma-wheel { width: calc(22px * var(--jma-s)); height: calc(22px * var(--jma-s)); }

        /* Wagons */
        .jma-wagon {
            position: relative; flex: 1 1 0; min-width: 0;
            height: calc(76px * var(--jma-s));
        }
        .jma-wagon::before { /* attelage */
            content: ''; position: absolute; left: calc(-6px * var(--jma-s)); bottom: calc(18px * var(--jma-s));
            width: calc(8px * var(--jma-s)); height: calc(4px * var(--jma-s)); background: var(--encre);
        }
        .jma-wagon-body {
            position: absolute; left: 0; right: 0; bottom: calc(12px * var(--jma-s)); top: calc(8px * var(--jma-s));
            border-radius: calc(8px * var(--jma-s)) calc(8px * var(--jma-s)) calc(4px * var(--jma-s)) calc(4px * var(--jma-s));
            background: var(--wc, #FF5D5D);
            box-shadow: inset 0 calc(-7px * var(--jma-s)) 0 rgba(0,0,0,0.16), inset 0 calc(3px * var(--jma-s)) 0 rgba(255,255,255,0.3);
            display: flex; align-items: center; justify-content: center;
            padding: calc(5px * var(--jma-s)) calc(5px * var(--jma-s)) calc(10px * var(--jma-s));
            box-sizing: border-box;
            transition: transform .15s;
        }
        .jma-wagon-num {
            position: absolute; top: calc(-2px * var(--jma-s)); left: 50%; transform: translateX(-50%);
            min-width: calc(20px * var(--jma-s)); height: calc(20px * var(--jma-s)); border-radius: 999px;
            background: var(--encre); color: #fff; font-weight: 900; font-size: calc(12px * var(--jma-s));
            display: flex; align-items: center; justify-content: center; z-index: 2;
            border: calc(2px * var(--jma-s)) solid #fff; box-sizing: border-box;
        }
        .jma-hold {
            width: 100%; height: 100%;
            border-radius: calc(6px * var(--jma-s));
            border: calc(2px * var(--jma-s)) dashed rgba(255,255,255,0.75);
            background: rgba(0,0,0,0.12);
            display: flex; align-items: center; justify-content: center;
            box-sizing: border-box; min-width: 0;
            transition: background .15s, border-color .15s;
        }
        .jma-wagon.over .jma-hold { background: rgba(255,255,255,0.45); border-color: #fff; border-style: solid; }
        .jma-wagon.over .jma-wagon-body { transform: translateY(calc(-3px * var(--jma-s))); }
        .jma-wagon.filled .jma-hold { border-style: solid; border-color: transparent; background: transparent; }
        .jma-wagon .jma-wheels { padding: 0 8%; justify-content: space-between; }

        /* Mots (caisses) */
        .jma-word {
            font-family: 'Nunito', sans-serif; font-weight: 900;
            font-size: calc(16px * var(--jma-s));
            color: var(--encre); white-space: nowrap; overflow: hidden;
            cursor: grab; touch-action: none;
            box-sizing: border-box;
        }
        .jma-wagon .jma-word {
            width: 100%; text-align: center;
            background: var(--creme);
            border-radius: calc(5px * var(--jma-s));
            padding: calc(7px * var(--jma-s)) calc(3px * var(--jma-s));
            box-shadow: 0 calc(2px * var(--jma-s)) 0 rgba(0,0,0,0.2);
        }
        .jma-wagon .jma-word.locked { cursor: default; box-shadow: 0 0 0 calc(3px * var(--jma-s)) var(--or); }
        .jma-wagon .jma-word.locked::before { content: '🔒'; font-size: 0.7em; margin-right: 2px; }
        @keyframes jma-land { 0% { transform: translateY(calc(-14px * var(--jma-s))) scale(1.1); } 60% { transform: translateY(2px) scale(0.97); } 100% { transform: none; } }
        .jma-word.land { animation: jma-land .25s ease-out; }

        .jma-lamp {
            position: absolute; top: calc(-8px * var(--jma-s)); right: calc(-4px * var(--jma-s));
            width: calc(22px * var(--jma-s)); height: calc(22px * var(--jma-s)); border-radius: 50%;
            display: none; align-items: center; justify-content: center;
            font-size: calc(12px * var(--jma-s)); font-weight: 900; color: #fff; z-index: 3;
            border: calc(2px * var(--jma-s)) solid #fff; box-sizing: border-box;
        }
        .jma-wagon.ok .jma-lamp { display: flex; background: var(--vert); }
        .jma-wagon.ok .jma-lamp::after { content: '✓'; }
        .jma-wagon.ko .jma-lamp { display: flex; background: var(--rouge); }
        .jma-wagon.ko .jma-lamp::after { content: '✗'; }
        @keyframes jma-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px) rotate(-2deg); }
            40% { transform: translateX(5px) rotate(2deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
        }
        .jma-wagon.ko .jma-wagon-body { animation: jma-shake .45s ease; }

        /* ── Quai (caisses à charger) ── */
        .jma-quai {
            position: relative;
            background: #3B2F63;
            border-radius: calc(16px * var(--jma-s));
            padding: calc(12px * var(--jma-s)) calc(10px * var(--jma-s)) calc(14px * var(--jma-s));
            min-height: calc(62px * var(--jma-s));
            display: flex; flex-wrap: wrap; justify-content: center; align-content: center;
            gap: calc(10px * var(--jma-s));
            box-shadow: inset 0 calc(-8px * var(--jma-s)) 0 rgba(0,0,0,0.2);
            transition: background .15s;
        }
        .jma-quai.over { background: #4A3C7A; }
        .jma-quai-empty { color: rgba(255,255,255,0.55); font-weight: 800; font-size: calc(14px * var(--jma-s)); align-self: center; }
        .jma-quai .jma-word {
            background: var(--bois);
            background-image: repeating-linear-gradient(180deg, transparent 0, transparent calc(11px * var(--jma-s)), rgba(0,0,0,0.08) calc(11px * var(--jma-s)), rgba(0,0,0,0.08) calc(13px * var(--jma-s)));
            border: calc(3px * var(--jma-s)) solid var(--bois-fonce);
            border-radius: calc(8px * var(--jma-s));
            padding: calc(8px * var(--jma-s)) calc(14px * var(--jma-s));
            box-shadow: 0 calc(5px * var(--jma-s)) 0 #7C4E1E;
            max-width: 100%;
            transition: transform .1s;
        }
        .jma-quai .jma-word:hover { transform: translateY(calc(-3px * var(--jma-s))) rotate(-1.5deg); }
        .jma-word.dragging { opacity: 0.25; }
        .jma-ghost {
            position: fixed; z-index: 99999; pointer-events: none;
            transform: translate(-50%, -60%) rotate(-4deg) scale(1.08);
            background: var(--bois); border: 3px solid var(--bois-fonce);
            border-radius: 8px; padding: 8px 14px;
            font-family: 'Nunito', sans-serif; font-weight: 900; color: #2A1F4A;
            box-shadow: 0 14px 24px rgba(0,0,0,0.3);
            white-space: nowrap;
        }

        /* ── Actions ── */
        .jma-actions { display: flex; gap: calc(8px * var(--jma-s)); justify-content: center; flex-wrap: wrap; }
        .jma-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jma-s));
            padding: calc(8px * var(--jma-s)) calc(14px * var(--jma-s));
            border-radius: calc(14px * var(--jma-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jma-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jma-btn:hover { filter: brightness(1.05); }
        .jma-btn:active { transform: translateY(calc(4px * var(--jma-s))); box-shadow: 0 calc(1px * var(--jma-s)) 0 #B9B2D6; }
        .jma-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jma-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jma-s));
            padding: calc(8px * var(--jma-s)) calc(22px * var(--jma-s));
            box-shadow: 0 calc(5px * var(--jma-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jma-btn-go:active { box-shadow: 0 calc(1px * var(--jma-s)) 0 #1C8A4F; }
        .jma-btn:focus-visible, .jma-lvl:focus-visible, .jma-word:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Chef de gare ── */
        .jma-talk { display: flex; align-items: center; gap: calc(10px * var(--jma-s)); }
        .jma-chef {
            width: calc(44px * var(--jma-s)); height: calc(44px * var(--jma-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jma-s));
            box-shadow: 0 calc(3px * var(--jma-s)) 0 #B3840B;
        }
        @keyframes jma-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jma-s))) rotate(-8deg); } }
        .jma-chef.hop { animation: jma-hop .4s ease; }
        .jma-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jma-s));
            padding: calc(8px * var(--jma-s)) calc(12px * var(--jma-s));
            font-weight: 700; font-size: calc(15px * var(--jma-s)); line-height: 1.35;
            min-height: calc(22px * var(--jma-s));
            border-left: calc(6px * var(--jma-s)) solid var(--or);
        }
        .jma-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jma-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jma-msg b { font-weight: 900; }
        .jma-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; }

        /* ── Écrans de victoire ── */
        .jma-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.35);
        }
        .jma-overlay.show { display: flex; }
        @keyframes jma-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jma-card {
            background: #fff; border-radius: calc(18px * var(--jma-s));
            padding: calc(12px * var(--jma-s)) calc(22px * var(--jma-s)) calc(14px * var(--jma-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jma-s)) 0 #B9B2D6;
            animation: jma-pop .35s ease-out;
            max-width: 90%;
        }
        .jma-card h3 {
            margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(24px * var(--jma-s)); color: var(--encre);
        }
        .jma-card p { margin: calc(4px * var(--jma-s)) 0 calc(8px * var(--jma-s)); font-weight: 800; font-size: calc(14px * var(--jma-s)); }
        .jma-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jma-s)); margin: calc(4px * var(--jma-s)) 0; }
        .jma-bigstars span {
            font-size: calc(34px * var(--jma-s)); line-height: 1; opacity: 0.2; filter: grayscale(1);
        }
        .jma-bigstars span.on { opacity: 1; filter: none; animation: jma-pop .35s ease-out both; }
        .jma-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jma-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jma-medal { font-size: calc(56px * var(--jma-s)); line-height: 1; animation: jma-pop .5s ease-out; }

        /* ── Aide ── */
        .jma-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 310px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jma-help.show { display: block; }
        .jma-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jma-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jma-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jma-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jma-fall 1.8s ease-in forwards; }
        @keyframes jma-fall { to { transform: translateY(600px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jma-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jma-container:hover .jma-rh { opacity: 1; }
        .jma-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jma-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jma-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jma-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jma-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jma-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jma-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jma-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jma-container *, .jma-container *::before, .jma-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUES DE MOTS (reprises du widget « Ordre alphabétique », revues pour
    // les élèves : mots anglais, doublons et mots peu adaptés remplacés)
    // =========================================================================
    const JMA_WORDS = {
        // Facile : 6 mots d'initiales différentes
        1: [
            ['avion','banane','cerise','datte','étoile','forêt'],
            ['girafe','hibou','iris','jardin','lune','mouton'],
            ['neige','orange','papillon','renard','savane','tulipe'],
            ['univers','vague','wagon','xylophone','yacht','zèbre'],
            ['arbre','bateau','cheval','dauphin','écureuil','fusée'],
            ['gâteau','herbe','image','jungle','lapin','maison'],
            ['nuage','ourson','puma','ruche','sable','tigre'],
            ['koala','quiche','valise','robot','soleil','tortue'],
            ['ananas','ballon','canard','dessin','éléphant','fleur'],
            ['guitare','hérisson','insecte','jouet','livre','marmotte'],
            ['nid','oiseau','plume','queue','sapin','trompette'],
            ['usine','vache','wapiti','xylophone','yaourt','zoo'],
            ['armoire','biscuit','citron','domino','escargot','fraise'],
            ['grenouille','hutte','île','jonquille','lampe','montagne'],
            ['noisette','orage','panda','radis','souris','tambour'],
            ['kangourou','quartier','uniforme','verre','yéti','zéro'],
            ['abeille','brosse','coccinelle','drapeau','épée','feuille'],
            ['genou','hache','ketchup','licorne','melon','navire'],
            ['ombre','poire','requin','sirène','toboggan','vélo'],
            ['gorille','journal','kiwi','moto','plage','train'],
        ],
        // Moyen : 6 mots avec la même initiale
        2: [
            ['balcon','bateau','bison','bleu','bonbon','brevet'],
            ['cabane','cactus','canard','castor','cerise','coton'],
            ['daim','datte','décor','dessin','dîner','domino'],
            ['fable','facile','famille','faucon','feuille','forêt'],
            ['galère','garçon','gâteau','genou','girafe','gorille'],
            ['jardin','jasmin','jeton','joli','jouet','jungle'],
            ['labyrinthe','lacet','lagon','lampe','lapin','larme'],
            ['machine','madame','maison','maman','manche','marché'],
            ['nappe','natation','navire','neige','nénuphar','nœud'],
            ['palais','panda','papier','paquet','pardon','pastel'],
            ['radis','radeau','raison','rampe','rapide','rasoir'],
            ['sabot','sable','safari','salade','sanglier','sapin'],
            ['tableau','tablier','tache','taille','talon','tambour'],
            ['valeur','valise','vampire','vapeur','varié','vase'],
            ['moineau','montagne','moto','mouche','mouton','musique'],
            ['abeille','acacia','agneau','aigle','ananas','armoire'],
            ['écharpe','éléphant','émotion','épée','escalier','étoile'],
            ['habit','herbe','hibou','horloge','humain','hyène'],
            ['objet','oiseau','olive','ombre','orage','ourson'],
            ['idée','île','image','igloo','insecte','iris'],
        ],
        // Difficile : 6 mots avec les mêmes 3 premières lettres
        3: [
            ['abricot','abrité','abreuver','abrupt','abréviation','abricotier'],
            ['charmant','charnière','charbon','charpente','charrue','chardon'],
            ['complet','complice','compliment','complot','composer','comprendre'],
            ['courber','courbure','coureur','courir','couronne','courroie'],
            ['drapeau','draper','drastique','dragon','dragée','drame'],
            ['escalier','escargot','escorte','escalade','escroc','espace'],
            ['fabricant','fabriquer','fabuleux','fable','fabrication','fabulation'],
            ['flambeau','flamber','flamme','flambant','flamboyant','flambée'],
            ['glorieux','gloire','global','glissement','glouton','gloussement'],
            ['marché','mardi','marée','marginal','marina','marionnette'],
            ['partir','partout','partage','partenaire','parterre','participe'],
            ['planche','planète','planifier','planton','plantation','planquer'],
            ['premier','prendre','prénom','présent','presque','prêter'],
            ['serveur','service','servile','servant','servante','serviette'],
            ['trancher','tranche','transit','transporter','transaction','transparent'],
            ['garçon','garage','garantie','garder','gare','gardien'],
            ['poupée','poulain','poulet','poumon','poupe','pouce'],
            ['cheval','chemin','chemise','chercher','cheveu','chèvre'],
            ['classe','clair','clairière','clameur','clapier','claquer'],
            ['montagne','monde','monnaie','montage','montre','monument'],
        ],
    };

    const JMA_LEVELS = {
        1: { key: 'facile',    label: '😊 Facile' },
        2: { key: 'moyen',     label: '😐 Moyen' },
        3: { key: 'difficile', label: '😤 Difficile' },
    };
    const TRAINS_PER_ROUND = 5;
    const WAGON_COLORS = ['#FF5D5D', '#FFB020', '#36C98E', '#3BA7FF', '#9B6BFF', '#FF7AC6'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const cmp = (a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' });
    function plain(w) {
        return w.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // Explique pourquoi « a » doit venir après « b » (a et b mal rangés)
    function explainPair(a, b) {
        const pa = plain(a), pb = plain(b);
        let k = 0;
        while (k < pa.length && k < pb.length && pa[k] === pb[k]) k++;
        if (k >= pb.length) {
            return `<b>${esc(b)}</b> est plus court que <b>${esc(a)}</b> et commence pareil : il passe avant !`;
        }
        const rang = k === 0 ? '1<sup>re</sup>' : (k + 1) + '<sup>e</sup>';
        return `Compare <b>${esc(b)}</b> et <b>${esc(a)}</b> : regarde la ${rang} lettre. <span class="k">${pb[k].toUpperCase()}</span> vient avant <span class="k">${pa[k].toUpperCase()}</span> dans l'alphabet.`;
    }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jmaAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jmaAudio) _jmaAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jmaAudio, t0 = ctx.currentTime + start;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0); o.stop(t0 + dur + 0.05);
        } catch (e) { /* audio indisponible */ }
    }
    const SFX = {
        pick:   () => tone(660, 0, 0.08, 'triangle', 0.08),
        drop:   () => { tone(520, 0, 0.07, 'triangle', 0.09); tone(780, 0.05, 0.08, 'triangle', 0.07); },
        error:  () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        whistle:() => { tone(880, 0, 0.25, 'sine', 0.1); tone(1175, 0, 0.25, 'sine', 0.06); tone(880, 0.32, 0.45, 'sine', 0.1); tone(1175, 0.32, 0.45, 'sine', 0.06); },
        win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:   () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuMotAlphaWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-mot-alpha';
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

        const wheels = (n) => `<div class="jma-wheels">${'<div class="jma-wheel"></div>'.repeat(n)}</div>`;

        const container = document.createElement('div');
        container.className = 'jma-container';
        container.innerHTML = `
            <div class="jma-header">
                <span class="jma-title">Le train de l'alphabet</span>
                <div class="jma-stats">
                    <span class="jma-chip" data-role="streak" title="Trains réussis du premier coup d'affilée">🔥 0</span>
                    <span class="jma-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jma-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jma-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jma-bar">
                <button class="jma-lvl active" data-level="1">😊 Facile</button>
                <button class="jma-lvl" data-level="2">😐 Moyen</button>
                <button class="jma-lvl" data-level="3">😤 Difficile</button>
                <div class="jma-progress" title="Trains de la tournée">
                    <span class="jma-progress-label">Train</span>
                    ${'<span class="jma-pdot"></span>'.repeat(TRAINS_PER_ROUND)}
                </div>
            </div>

            <div class="jma-scene">
                <div class="jma-sun"></div>
                <div class="jma-cloud c1"></div>
                <div class="jma-cloud c2"></div>
                <div class="jma-hill h1"></div>
                <div class="jma-hill h2"></div>
                <div class="jma-hill h3"></div>
                <div class="jma-sign">A → Z</div>
                <div class="jma-ground"></div>
                <div class="jma-rails"></div>
                <div class="jma-train">
                    <div class="jma-loco">
                        <div class="jma-smoke"></div><div class="jma-smoke p2"></div><div class="jma-smoke p3"></div>
                        <div class="jma-chimney"></div>
                        <div class="jma-loco-cab"></div>
                        <div class="jma-loco-boiler"></div>
                        ${wheels(3)}
                    </div>
                </div>
                <div class="jma-overlay" data-role="win"><div class="jma-card"></div></div>
            </div>

            <div class="jma-quai" title="Le quai : clique sur une caisse ou fais-la glisser dans un wagon"></div>

            <div class="jma-talk">
                <div class="jma-chef">🚉</div>
                <div class="jma-msg"></div>
            </div>

            <div class="jma-actions">
                <button class="jma-btn" data-act="hint">💡 Indice</button>
                <button class="jma-btn" data-act="unload">📦 Tout décharger</button>
                <button class="jma-btn jma-btn-go" data-act="go">🚦 Faire partir le train !</button>
            </div>

            <div class="jma-help">
                <h4>🚂 Comment jouer ?</h4>
                <p>Charge les caisses dans les wagons pour que les mots soient rangés dans l'<b>ordre alphabétique</b>, du wagon 1 au wagon 6.</p>
                <p>👆 Clique sur une caisse pour la mettre dans le premier wagon libre, ou fais-la glisser où tu veux. Clique sur un mot dans un wagon pour le remettre sur le quai.</p>
                <p>😊 <b>Facile</b> : regarde la 1<sup>re</sup> lettre.<br>😐 <b>Moyen</b> : même 1<sup>re</sup> lettre, regarde la 2<sup>e</sup>.<br>😤 <b>Difficile</b> : les 3 premières lettres sont pareilles !</p>
                <p style="margin:0">⭐⭐⭐ si le train part du premier coup sans indice. 5 trains = une tournée !</p>
            </div>

            <div class="jma-confetti"></div>

            <div class="jma-rh jma-rh-nw" data-dir="nw"></div>
            <div class="jma-rh jma-rh-n"  data-dir="n"></div>
            <div class="jma-rh jma-rh-ne" data-dir="ne"></div>
            <div class="jma-rh jma-rh-e"  data-dir="e"></div>
            <div class="jma-rh jma-rh-se" data-dir="se"></div>
            <div class="jma-rh jma-rh-s"  data-dir="s"></div>
            <div class="jma-rh jma-rh-sw" data-dir="sw"></div>
            <div class="jma-rh jma-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const train     = $('.jma-train');
        const quai      = $('.jma-quai');
        const msg       = $('.jma-msg');
        const chef      = $('.jma-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jma-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jma-help');
        const confetti  = $('.jma-confetti');
        const lvlBtns   = container.querySelectorAll('.jma-lvl');
        const pdots     = container.querySelectorAll('.jma-pdot');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const hintBtn = btn('hint'), goBtn = btn('go'), unloadBtn = btn('unload');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let words = [];              // les 6 mots du train
        let solution = [];           // ordre attendu
        let slots = [null, null, null, null, null, null];
        let pool = [];               // mots sur le quai
        let lockedSlots = new Set(); // wagons remplis par un indice
        let marks = [];              // 'ok' / 'ko' après vérification
        let errors = 0, hints = 0;
        let trainNo = 1;             // 1..5
        let roundStars = 0;
        let score = 0, streak = 0;
        let usedLists = [];
        let busy = false;            // animation en cours
        let soundOn = true;

        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Wagons (créés une fois) ────────────────────────────────────────
        const wagonEls = [];
        for (let i = 0; i < 6; i++) {
            const w = document.createElement('div');
            w.className = 'jma-wagon';
            w.dataset.slot = i;
            w.style.setProperty('--wc', WAGON_COLORS[i]);
            w.innerHTML = `<div class="jma-wagon-body"><span class="jma-wagon-num">${i + 1}</span><span class="jma-lamp"></span><div class="jma-hold"></div></div>${wheels(2)}`;
            train.appendChild(w);
            wagonEls.push(w);
        }

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 680;
        function applyScale() {
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jma-s', sc.toFixed(4));
            requestAnimationFrame(fitWords);
        }
        // Réduit la police d'un mot trop long pour son wagon
        function fitWords() {
            container.querySelectorAll('.jma-wagon .jma-word').forEach(el => {
                el.style.fontSize = '';
                let fs = parseFloat(getComputedStyle(el).fontSize);
                let guard = 40;
                while (el.scrollWidth > el.clientWidth + 1 && fs > 7 && guard--) {
                    fs -= 0.5; el.style.fontSize = fs + 'px';
                }
            });
        }

        // ── Chef de gare ───────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jma-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.classList.toggle('done', i < trainNo - 1);
                d.classList.toggle('current', i === trainNo - 1);
            });
        }

        // ── Nouveau train ──────────────────────────────────────────────────
        function pickList() {
            const lists = JMA_WORDS[level];
            let free = lists.map((_, i) => i).filter(i => !usedLists.includes(i));
            if (!free.length) { usedLists = []; free = lists.map((_, i) => i); }
            const idx = rnd(free);
            usedLists.push(idx);
            return lists[idx];
        }

        function loadTrain(animate) {
            words = pickList().slice();
            solution = words.slice().sort(cmp);
            slots = [null, null, null, null, null, null];
            pool = shuffle(words);
            lockedSlots = new Set();
            marks = [];
            errors = 0; hints = 0;
            winLayer.classList.remove('show');
            train.classList.remove('depart', 'puffing');
            render();
            updateStats(false);
            if (animate) {
                busy = true;
                train.classList.remove('arrive'); void train.offsetWidth;
                train.classList.add('arrive', 'puffing');
                setTimeout(() => { train.classList.remove('arrive', 'puffing'); busy = false; }, 1350);
            }
            const tips = {
                1: 'Regarde bien la <b>première lettre</b> de chaque mot.',
                2: 'Tous les mots commencent pareil : regarde la <b>2<sup>e</sup> lettre</b> !',
                3: 'Les <b>3 premières lettres</b> sont identiques : cherche la lettre qui change.'
            };
            say(`🚂 Train n°${trainNo} en gare ! Charge les caisses dans l'ordre alphabétique. ${tips[level]}`);
        }

        function newRound() {
            trainNo = 1; roundStars = 0; usedLists = [];
            loadTrain(true);
        }

        // ── Rendu ──────────────────────────────────────────────────────────
        function makeWord(word, from, index) {
            const el = document.createElement('div');
            el.className = 'jma-word';
            el.textContent = word;
            el.dataset.word = word;
            if (from === 'slot' && lockedSlots.has(index)) {
                el.classList.add('locked');
            } else {
                el.addEventListener('pointerdown', (e) => startPointer(e, el, from, index));
            }
            return el;
        }

        function render(landIndex) {
            wagonEls.forEach((w, i) => {
                const hold = w.querySelector('.jma-hold');
                hold.innerHTML = '';
                w.classList.toggle('filled', !!slots[i]);
                w.classList.remove('ok', 'ko');
                if (marks[i]) w.classList.add(marks[i]);
                if (slots[i]) {
                    const el = makeWord(slots[i], 'slot', i);
                    if (landIndex === i) el.classList.add('land');
                    hold.appendChild(el);
                }
            });
            quai.innerHTML = '';
            if (!pool.length) {
                quai.innerHTML = '<span class="jma-quai-empty">Quai vide : tout est chargé ! Vérifie l\'ordre puis fais partir le train 🚦</span>';
            } else {
                pool.forEach((w, i) => quai.appendChild(makeWord(w, 'pool', i)));
            }
            requestAnimationFrame(fitWords);
        }

        // ── Déplacements ───────────────────────────────────────────────────
        function clearMarks() { marks = []; }

        function moveToSlot(word, from, fromIndex, target) {
            if (lockedSlots.has(target)) return false;
            if (from === 'slot' && fromIndex === target) return false;
            const occupant = slots[target];
            if (from === 'pool') {
                pool.splice(pool.indexOf(word), 1);
                if (occupant) pool.push(occupant);
            } else {
                slots[fromIndex] = occupant;       // échange entre wagons
            }
            slots[target] = word;
            clearMarks();
            sfx('drop');
            render(target);
            return true;
        }
        function moveToPool(word, fromIndex) {
            if (lockedSlots.has(fromIndex)) return;
            slots[fromIndex] = null;
            pool.push(word);
            clearMarks();
            sfx('pick');
            render();
        }
        function tapWord(word, from, index) {
            if (from === 'pool') {
                const free = slots.findIndex((s, i) => !s && !lockedSlots.has(i));
                if (free === -1) { say('Tous les wagons sont pleins ! Clique sur un mot dans un wagon pour le remettre sur le quai.'); return; }
                moveToSlot(word, 'pool', index, free);
            } else {
                moveToPool(word, index);
            }
        }

        // Pointeur : clic court = placement rapide, glisser = déposer où on veut
        function startPointer(e, el, from, index) {
            if (busy) return;
            e.stopPropagation(); e.preventDefault();
            const word = el.dataset.word;
            const sx = e.clientX, sy = e.clientY;
            let ghost = null;

            const targetAt = (x, y) => {
                const hit = document.elementFromPoint(x, y);
                if (!hit) return null;
                const w = hit.closest('.jma-wagon');
                if (w && container.contains(w)) return { type: 'slot', index: +w.dataset.slot };
                const q = hit.closest('.jma-quai');
                if (q && container.contains(q)) return { type: 'pool' };
                return null;
            };
            const clearOver = () => { wagonEls.forEach(w => w.classList.remove('over')); quai.classList.remove('over'); };

            const onMove = (ev) => {
                const dx = ev.clientX - sx, dy = ev.clientY - sy;
                if (!ghost && Math.hypot(dx, dy) > 6) {
                    ghost = document.createElement('div');
                    ghost.className = 'jma-ghost';
                    ghost.textContent = word;
                    ghost.style.fontSize = getComputedStyle(el).fontSize;
                    document.body.appendChild(ghost);
                    el.classList.add('dragging');
                    sfx('pick');
                }
                if (ghost) {
                    ghost.style.left = ev.clientX + 'px';
                    ghost.style.top = ev.clientY + 'px';
                    clearOver();
                    const t = targetAt(ev.clientX, ev.clientY);
                    if (t && t.type === 'slot' && !lockedSlots.has(t.index)) wagonEls[t.index].classList.add('over');
                    if (t && t.type === 'pool' && from === 'slot') quai.classList.add('over');
                }
            };
            const onUp = (ev) => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.removeEventListener('pointercancel', onUp);
                clearOver();
                if (!ghost) { tapWord(word, from, index); return; }
                ghost.remove();
                el.classList.remove('dragging');
                const t = targetAt(ev.clientX, ev.clientY);
                if (t && t.type === 'slot') moveToSlot(word, from, index, t.index);
                else if (t && t.type === 'pool' && from === 'slot') moveToPool(word, index);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onUp);
        }

        // ── Indice : place le prochain bon mot et le verrouille ────────────
        function giveHint() {
            if (busy) return;
            const i = solution.findIndex((w, k) => slots[k] !== w);
            if (i === -1) { say('Tout est déjà bien rangé : fais partir le train ! 🚦'); return; }
            const word = solution[i];
            const at = slots.indexOf(word);
            const occupant = slots[i];
            if (at !== -1) slots[at] = occupant;               // échange
            else { pool.splice(pool.indexOf(word), 1); if (occupant) pool.push(occupant); }
            slots[i] = word;
            lockedSlots.add(i);
            hints++;
            clearMarks();
            sfx('drop');
            render(i);
            say(`💡 <b>${esc(word)}</b> va dans le wagon ${i + 1}. Il est accroché pour de bon !`);
        }

        function unloadAll() {
            if (busy) return;
            slots.forEach((w, i) => { if (w && !lockedSlots.has(i)) { pool.push(w); slots[i] = null; } });
            clearMarks();
            render();
        }

        // ── Départ du train (vérification) ─────────────────────────────────
        function go() {
            if (busy) return;
            if (slots.some(s => !s)) {
                say(`📦 Il reste ${pool.length} caisse${pool.length > 1 ? 's' : ''} sur le quai ! Remplis tous les wagons avant de partir.`, 'bad');
                sfx('error');
                return;
            }
            marks = slots.map((w, i) => w === solution[i] ? 'ok' : 'ko');
            if (marks.every(m => m === 'ok')) return victory();

            errors++;
            render();
            sfx('error');
            // Première paire mal rangée → explication
            let expl = '';
            for (let i = 0; i < 5; i++) {
                if (cmp(slots[i], slots[i + 1]) > 0) { expl = explainPair(slots[i], slots[i + 1]); break; }
            }
            const nbKo = marks.filter(m => m === 'ko').length;
            say(`🚫 Le train ne peut pas partir : ${nbKo} wagon${nbKo > 1 ? 's sont mal placés' : ' est mal placé'}. ${expl}${errors >= 3 ? ' Besoin d\'aide ? Essaie l\'indice 💡' : ''}`, 'bad');
        }

        function starsFor() {
            let st = 3 - Math.min(2, errors);
            if (hints >= 1) st = Math.min(st, 2);
            if (hints >= 3) st = 1;
            return st;
        }

        function victory() {
            busy = true;
            render();
            const st = starsFor();
            const perfect = errors === 0 && hints === 0;
            streak = perfect ? streak + 1 : 0;
            const bonus = streak >= 3 ? 5 : 0;
            const pts = st * 10 + bonus;
            score += pts;
            roundStars += st;
            updateStats(true);
            say(`🎉 ${rnd(['Bravo', 'Super', 'Génial', 'Parfait', 'Bien joué'])} ! Tous les wagons sont dans l'ordre alphabétique. Tchou tchou !`, 'good');
            sfx('whistle');
            setTimeout(() => {
                train.classList.add('depart', 'puffing');
            }, 450);
            setTimeout(() => {
                sfx('win');
                party();
                const last = trainNo >= TRAINS_PER_ROUND;
                winCard.innerHTML = `
                    <h3>${perfect ? 'Du premier coup !' : 'Le train est parti !'}</h3>
                    <div class="jma-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                    <p>+${pts} points${bonus ? ' (dont +5 bonus série 🔥)' : ''}</p>
                    <button class="jma-btn jma-btn-go" data-act="next">${last ? '🏁 Fin de la tournée' : 'Train suivant ▶'}</button>`;
                winLayer.classList.add('show');
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
                winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (last) finalScreen();
                    else { trainNo++; loadTrain(true); }
                });
            }, 2300);
        }

        function finalScreen() {
            const max = TRAINS_PER_ROUND * 3;
            const medal = roundStars >= max - 2 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'Chef de gare en or !' : medal === '🥈' ? 'Super conducteur !' : 'Tournée terminée !';
            trainNo = TRAINS_PER_ROUND + 1;
            updateStats(false);
            winCard.innerHTML = `
                <div class="jma-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${roundStars} ⭐ sur ${max} pour cette tournée</p>
                <button class="jma-btn jma-btn-go" data-act="again">🔄 Nouvelle tournée</button>`;
            winLayer.classList.add('show');
            sfx('win');
            party();
            say(`🏁 Tournée terminée avec ${roundStars} étoiles ! Tu peux rejouer ou essayer un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = rnd(WAGON_COLORS.concat(['#FFC933', '#fff']));
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Niveaux ────────────────────────────────────────────────────────
        function setLevel(l) {
            level = l;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === l));
            streak = 0;
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => { if (!busy || winLayer.classList.contains('show')) { busy = false; setLevel(+b.dataset.level); } }));

        hintBtn.addEventListener('click', giveHint);
        unloadBtn.addEventListener('click', unloadAll);
        goBtn.addEventListener('click', go);

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
        let _isMax = false, _savedW = null;
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, "🚂 Le train de l'alphabet", { onExpand: applyScale });
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
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jma-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                const startX = clientX, startY = clientY;
                const startW = container.offsetWidth, startH = container.offsetHeight;
                const startL = widget.offsetLeft, startT = widget.offsetTop;
                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (dir.includes('e')) newW = Math.max(400, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(400, startW - dx); newL = startL + (startW - newW); }
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
            if (e.target.closest && e.target.closest('button, .jma-word, .jma-rh, .jma-help')) {
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
            if (type === 'jeu-mot-alpha') return window.createJeuMotAlphaWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-mot-alpha') return window.createJeuMotAlphaWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }

})();
