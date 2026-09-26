// =========================================================================
// JEU « LE PENDU » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Deviner un mot lettre par lettre. Version ludique : chaque erreur fait
// éclater un ballon du petit personnage qui descend vers l'eau (plouf !).
// Le bouton ✏️ affiche le pendu classique dessiné à la craie.
// 12 thèmes de mots déjà prêts + « Mes mots » (liste saisie par l'enseignant,
// gardée dans le navigateur). 5 mots par partie.
// 3 niveaux : facile   (mots courts, 10 essais, 1re lettre donnée)
//             moyen    (5 à 8 lettres, 8 essais)
//             difficile(8 lettres et plus, 6 essais)
//
// Ouverture : createWidget('jeu-pendu')
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


    // ── CSS du jeu (préfixe jpd-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-pendu-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-pendu-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-pendu"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jpd-container {
            --jpd-s: 1;
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
            padding: calc(12px * var(--jpd-s)) calc(14px * var(--jpd-s)) calc(14px * var(--jpd-s));
            border-radius: calc(24px * var(--jpd-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jpd-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jpd-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jpd-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jpd-s));
            width: 100%; max-width: calc(672px * var(--jpd-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jpd-header { display: flex; align-items: center; gap: calc(10px * var(--jpd-s)); cursor: move; flex-wrap: wrap; }
        .jpd-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jpd-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jpd-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jpd-stats { display: flex; gap: calc(6px * var(--jpd-s)); align-items: center; margin-left: auto; }
        .jpd-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jpd-s)) calc(10px * var(--jpd-s));
            font-weight: 900; font-size: calc(14px * var(--jpd-s));
            white-space: nowrap;
        }
        .jpd-chip.hot { background: #FF7A1A; }
        @keyframes jpd-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jpd-chip.bump { animation: jpd-bump .4s ease; }
        .jpd-icon-btn {
            width: calc(26px * var(--jpd-s)); height: calc(26px * var(--jpd-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jpd-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jpd-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + thème + progression ── */
        .jpd-bar { display: flex; align-items: center; gap: calc(6px * var(--jpd-s)); flex-wrap: wrap; }
        .jpd-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jpd-s));
            padding: calc(5px * var(--jpd-s)) calc(12px * var(--jpd-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jpd-lvl:hover { background: rgba(255,255,255,0.1); }
        .jpd-lvl:active { transform: scale(0.95); }
        .jpd-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jpd-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jpd-s));
            padding: calc(4px * var(--jpd-s)) calc(8px * var(--jpd-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer; max-width: calc(210px * var(--jpd-s));
        }
        .jpd-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jpd-s)); align-items: center; flex-shrink: 0; }
        .jpd-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jpd-s)); margin-right: 2px; }
        .jpd-pdot {
            width: calc(16px * var(--jpd-s)); height: calc(16px * var(--jpd-s));
            border-radius: 50%; background: rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center;
            font-size: calc(9px * var(--jpd-s)); color: #fff; font-weight: 900;
        }
        .jpd-pdot.win  { background: var(--vert); }
        .jpd-pdot.win::after { content: '✓'; }
        .jpd-pdot.lose { background: var(--rouge); }
        .jpd-pdot.lose::after { content: '✗'; }
        .jpd-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Scène ── */
        .jpd-scene {
            position: relative;
            height: calc(240px * var(--jpd-s));
            border-radius: calc(18px * var(--jpd-s));
            overflow: hidden;
            flex-shrink: 0;
            background: linear-gradient(180deg, #7FD3FF 0%, #BDE9FF 70%, #DFF5FF 100%);
        }
        .jpd-cloud {
            position: absolute; background: #fff; border-radius: 999px; opacity: 0.95;
            width: calc(70px * var(--jpd-s)); height: calc(22px * var(--jpd-s));
        }
        .jpd-cloud::before, .jpd-cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
        .jpd-cloud::before { width: calc(34px * var(--jpd-s)); height: calc(34px * var(--jpd-s)); left: calc(10px * var(--jpd-s)); top: calc(-16px * var(--jpd-s)); }
        .jpd-cloud::after  { width: calc(26px * var(--jpd-s)); height: calc(26px * var(--jpd-s)); left: calc(34px * var(--jpd-s)); top: calc(-11px * var(--jpd-s)); }
        @keyframes jpd-drift { from { transform: translateX(0); } to { transform: translateX(calc(40px * var(--jpd-s))); } }
        .jpd-cloud.c1 { left: 6%;  top: calc(36px * var(--jpd-s)); animation: jpd-drift 14s ease-in-out infinite alternate; }
        .jpd-cloud.c2 { left: 70%; top: calc(66px * var(--jpd-s)); transform: scale(0.75); animation: jpd-drift 18s ease-in-out infinite alternate-reverse; }
        .jpd-sun {
            position: absolute; right: calc(34px * var(--jpd-s)); top: calc(16px * var(--jpd-s));
            width: calc(44px * var(--jpd-s)); height: calc(44px * var(--jpd-s)); border-radius: 50%;
            background: #FFD84D; box-shadow: 0 0 0 calc(8px * var(--jpd-s)) rgba(255,216,77,0.3), 0 0 0 calc(18px * var(--jpd-s)) rgba(255,216,77,0.15);
        }
        .jpd-theme {
            position: absolute; left: calc(12px * var(--jpd-s)); top: calc(12px * var(--jpd-s)); z-index: 3;
            background: #fff; color: var(--encre);
            font-weight: 900; font-size: calc(14px * var(--jpd-s));
            padding: calc(3px * var(--jpd-s)) calc(10px * var(--jpd-s));
            border-radius: calc(8px * var(--jpd-s)); border: calc(3px * var(--jpd-s)) solid #2F6FEB;
            box-shadow: 0 calc(3px * var(--jpd-s)) 0 rgba(0,0,0,0.15);
            max-width: 40%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .jpd-lives {
            position: absolute; right: calc(12px * var(--jpd-s)); bottom: calc(52px * var(--jpd-s)); z-index: 3;
            background: rgba(42,31,74,0.8); color: #fff;
            font-weight: 900; font-size: calc(14px * var(--jpd-s));
            padding: calc(3px * var(--jpd-s)) calc(10px * var(--jpd-s));
            border-radius: 999px;
        }
        .jpd-lives.low { background: var(--rouge); }
        .jpd-water {
            position: absolute; left: calc(-40px * var(--jpd-s)); right: calc(-40px * var(--jpd-s)); bottom: 0;
            height: calc(44px * var(--jpd-s)); z-index: 2;
            background:
                radial-gradient(circle at 50% 100%, #3BA7FF 0 calc(20px * var(--jpd-s)), transparent calc(21px * var(--jpd-s))) 0 calc(-8px * var(--jpd-s)) / calc(40px * var(--jpd-s)) 100% repeat-x,
                linear-gradient(#3BA7FF, #2F6FEB) 0 100% / 100% 70% no-repeat;
            animation: jpd-wave 2.4s ease-in-out infinite alternate;
        }
        @keyframes jpd-wave { to { transform: translateX(calc(20px * var(--jpd-s))); } }
        .jpd-croc {
            position: absolute; bottom: calc(14px * var(--jpd-s)); z-index: 3;
            font-size: calc(34px * var(--jpd-s)); line-height: 1;
            animation: jpd-swim 16s linear infinite;
        }
        @keyframes jpd-swim { 0% { left: -12%; transform: scaleX(-1); } 49% { left: 100%; transform: scaleX(-1); } 50% { left: 100%; transform: scaleX(1); } 100% { left: -12%; transform: scaleX(1); } }

        /* Le petit personnage et ses ballons */
        .jpd-flyer {
            position: absolute; left: 50%; top: calc(4px * var(--jpd-s));
            width: calc(240px * var(--jpd-s)); height: calc(200px * var(--jpd-s));
            margin-left: calc(-120px * var(--jpd-s));
            transform: translateY(var(--drop, 0px));
            transition: transform .6s cubic-bezier(.3,1.4,.6,1);
            z-index: 1;
        }
        .jpd-flyer svg { position: absolute; left: 0; top: 0; width: 100%; height: calc(170px * var(--jpd-s)); overflow: visible; }
        @keyframes jpd-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .jpd-sway { position: absolute; inset: 0; transform-origin: 50% 75%; animation: jpd-sway 3s ease-in-out infinite; }
        .jpd-kid {
            position: absolute; left: 50%; top: calc(116px * var(--jpd-s)); transform: translateX(-50%);
            font-size: calc(44px * var(--jpd-s)); line-height: 1;
        }
        .jpd-balloon { transform-box: fill-box; transform-origin: 50% 100%; }
        @keyframes jpd-in { 0% { transform: scale(0); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
        .jpd-balloon.in { animation: jpd-in .35s ease-out both; }
        @keyframes jpd-burst { 0% { transform: scale(0.4); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
        .jpd-burst { transform-box: fill-box; transform-origin: 50% 50%; animation: jpd-burst .45s ease-out forwards; }
        .jpd-flyer.fall { transition: transform 1s cubic-bezier(.6,0,.9,.5); transform: translateY(calc(280px * var(--jpd-s))); }
        .jpd-flyer.fly  { transition: transform 1.6s cubic-bezier(.5,0,.8,.4); transform: translateY(calc(-300px * var(--jpd-s))); }
        .jpd-splash {
            position: absolute; left: 50%; bottom: calc(20px * var(--jpd-s)); transform: translateX(-50%);
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jpd-s)); color: #fff;
            text-shadow: 0 calc(3px * var(--jpd-s)) 0 #1B4DB5; z-index: 4; display: none;
        }
        .jpd-splash.show { display: block; animation: jpd-pop .5s ease-out; }

        /* Mode classique : ardoise */
        .jpd-classic {
            position: absolute; left: 50%; top: calc(14px * var(--jpd-s)); margin-left: calc(-110px * var(--jpd-s));
            width: calc(220px * var(--jpd-s)); height: calc(190px * var(--jpd-s)); display: none;
        }
        .jpd-classic svg { width: 100%; height: 100%; overflow: visible; }
        .jpd-classic .part { stroke: #fff; stroke-width: 5; stroke-linecap: round; fill: none; opacity: 0; filter: drop-shadow(0 0 1px rgba(255,255,255,0.6)); }
        .jpd-classic .part.on { opacity: 0.95; animation: jpd-draw .4s ease-out; }
        @keyframes jpd-draw { from { stroke-dasharray: 200; stroke-dashoffset: 200; } to { stroke-dasharray: 200; stroke-dashoffset: 0; } }
        .jpd-scene.classic { background: #2E5E4E; box-shadow: inset 0 0 0 calc(8px * var(--jpd-s)) #8A5A33, inset 0 0 calc(40px * var(--jpd-s)) rgba(0,0,0,0.4); }
        .jpd-scene.classic .jpd-classic { display: block; }
        .jpd-scene.classic .jpd-flyer,
        .jpd-scene.classic .jpd-water,
        .jpd-scene.classic .jpd-croc,
        .jpd-scene.classic .jpd-cloud,
        .jpd-scene.classic .jpd-sun,
        .jpd-scene.classic .jpd-splash { display: none; }
        .jpd-scene.classic .jpd-lives { bottom: calc(14px * var(--jpd-s)); }
        .jpd-scene.classic .jpd-theme { border-color: var(--or); }

        /* ── Mot à deviner ── */
        .jpd-word {
            display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-end;
            gap: calc(6px * var(--jpd-s));
            background: var(--creme);
            border-radius: calc(16px * var(--jpd-s));
            padding: calc(10px * var(--jpd-s)) calc(10px * var(--jpd-s)) calc(12px * var(--jpd-s));
            min-height: calc(50px * var(--jpd-s));
            box-shadow: inset 0 calc(-6px * var(--jpd-s)) 0 rgba(0,0,0,0.08);
        }
        .jpd-tile {
            width: calc(34px * var(--jpd-s)); height: calc(42px * var(--jpd-s));
            border-bottom: calc(4px * var(--jpd-s)) solid var(--encre);
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(30px * var(--jpd-s)); line-height: 1; color: var(--encre);
            text-transform: uppercase;
        }
        .jpd-tile.sep { border-bottom-color: transparent; width: calc(18px * var(--jpd-s)); }
        .jpd-tile.shown { animation: jpd-pop .35s ease-out; }
        .jpd-tile.hinted { color: #B3470F; }
        .jpd-tile.missed { color: var(--rouge); }
        .jpd-word.won .jpd-tile { color: var(--vert); border-bottom-color: var(--vert); }
        @keyframes jpd-pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes jpd-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px) rotate(-2deg); }
            40% { transform: translateX(5px) rotate(2deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
        }

        /* ── Clavier ── */
        .jpd-keys {
            display: grid; grid-template-columns: repeat(13, 1fr);
            gap: calc(5px * var(--jpd-s));
        }
        .jpd-key {
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(20px * var(--jpd-s));
            height: calc(40px * var(--jpd-s));
            border: none; border-radius: calc(10px * var(--jpd-s));
            background: #fff; color: var(--encre); cursor: pointer; padding: 0;
            box-shadow: 0 calc(4px * var(--jpd-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, background .15s;
        }
        .jpd-key:hover:not(:disabled) { background: #FFF3C4; }
        .jpd-key:active:not(:disabled) { transform: translateY(calc(3px * var(--jpd-s))); box-shadow: 0 calc(1px * var(--jpd-s)) 0 #B9B2D6; }
        .jpd-key.good { background: var(--vert); color: #fff; box-shadow: 0 calc(4px * var(--jpd-s)) 0 #1C8A4F; }
        .jpd-key.bad  { background: #6B5E8E; color: rgba(255,255,255,0.6); box-shadow: none; text-decoration: line-through; }
        .jpd-key.bad.fresh { animation: jpd-shake .4s ease; background: var(--rouge); color: #fff; }
        .jpd-key:disabled { cursor: default; }

        /* ── Actions ── */
        .jpd-actions { display: flex; gap: calc(8px * var(--jpd-s)); justify-content: center; flex-wrap: wrap; }
        .jpd-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jpd-s));
            padding: calc(8px * var(--jpd-s)) calc(14px * var(--jpd-s));
            border-radius: calc(14px * var(--jpd-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jpd-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jpd-btn:hover { filter: brightness(1.05); }
        .jpd-btn:active { transform: translateY(calc(4px * var(--jpd-s))); box-shadow: 0 calc(1px * var(--jpd-s)) 0 #B9B2D6; }
        .jpd-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jpd-s));
            padding: calc(8px * var(--jpd-s)) calc(22px * var(--jpd-s));
            box-shadow: 0 calc(5px * var(--jpd-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jpd-btn-go:active { box-shadow: 0 calc(1px * var(--jpd-s)) 0 #1C8A4F; }
        .jpd-btn:focus-visible, .jpd-lvl:focus-visible, .jpd-key:focus-visible, .jpd-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jpd-talk { display: flex; align-items: center; gap: calc(10px * var(--jpd-s)); }
        .jpd-chef {
            width: calc(44px * var(--jpd-s)); height: calc(44px * var(--jpd-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jpd-s));
            box-shadow: 0 calc(3px * var(--jpd-s)) 0 #B3840B;
        }
        @keyframes jpd-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jpd-s))) rotate(-8deg); } }
        .jpd-chef.hop { animation: jpd-hop .4s ease; }
        .jpd-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jpd-s));
            padding: calc(8px * var(--jpd-s)) calc(12px * var(--jpd-s));
            font-weight: 700; font-size: calc(15px * var(--jpd-s)); line-height: 1.35;
            min-height: calc(22px * var(--jpd-s));
            border-left: calc(6px * var(--jpd-s)) solid var(--or);
        }
        .jpd-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jpd-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jpd-msg b { font-weight: 900; }
        .jpd-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; white-space: nowrap; }

        /* ── Écrans de fin ── */
        .jpd-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.35);
        }
        .jpd-overlay.show { display: flex; }
        .jpd-card {
            background: #fff; border-radius: calc(18px * var(--jpd-s));
            padding: calc(12px * var(--jpd-s)) calc(22px * var(--jpd-s)) calc(14px * var(--jpd-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jpd-s)) 0 #B9B2D6;
            animation: jpd-pop .35s ease-out;
            max-width: 90%;
        }
        .jpd-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jpd-s)); color: var(--encre); }
        .jpd-card p { margin: calc(4px * var(--jpd-s)) 0 calc(8px * var(--jpd-s)); font-weight: 800; font-size: calc(14px * var(--jpd-s)); }
        .jpd-card .jpd-reveal { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--jpd-s)); color: #B3470F; text-transform: uppercase; letter-spacing: 1px; }
        .jpd-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jpd-s)); margin: calc(4px * var(--jpd-s)) 0; }
        .jpd-bigstars span { font-size: calc(34px * var(--jpd-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jpd-bigstars span.on { opacity: 1; filter: none; animation: jpd-pop .35s ease-out both; }
        .jpd-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jpd-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jpd-medal { font-size: calc(56px * var(--jpd-s)); line-height: 1; animation: jpd-pop .5s ease-out; }

        /* ── Panneaux (aide, mes mots) ── */
        .jpd-help, .jpd-custom {
            display: none; position: absolute; top: 50px; right: 14px; width: 340px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jpd-help.show, .jpd-custom.show { display: block; }
        .jpd-help h4, .jpd-custom h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jpd-help p, .jpd-custom p { margin: 0 0 7px; }
        .jpd-custom textarea {
            width: 100%; box-sizing: border-box; height: 130px; resize: vertical;
            font-family: 'Nunito', sans-serif; font-weight: 700; font-size: 14px;
            border: 2px solid #B9B2D6; border-radius: 10px; padding: 8px;
            user-select: text;
        }
        .jpd-custom .row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
        .jpd-custom .jpd-btn { font-size: 13px; padding: 6px 12px; }

        /* ── Confettis ── */
        .jpd-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jpd-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jpd-fall 1.8s ease-in forwards; }
        @keyframes jpd-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jpd-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jpd-container:hover .jpd-rh { opacity: 1; }
        .jpd-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jpd-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jpd-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jpd-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jpd-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jpd-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jpd-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jpd-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jpd-container *, .jpd-container *::before, .jpd-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // LISTES DE MOTS PAR THÈMES
    // (lettres accentuées acceptées : la touche E révèle aussi é, è, ê, ë)
    // =========================================================================
    const JPD_THEMES = {
        animaux: { label: '🐾 Les animaux', words: [
            'lapin', 'girafe', 'crocodile', 'papillon', 'tortue', 'dauphin', 'hibou', 'kangourou', 'pingouin',
            'écureuil', 'hérisson', 'éléphant', 'zèbre', 'chameau', 'renard', 'grenouille', 'abeille', 'coccinelle',
            'requin', 'baleine', 'perroquet', 'hamster', 'mouton', 'cochon', 'cheval', 'loup', 'ours', 'chat',
            'souris', 'poule', 'canard', 'escargot', 'chenille', 'hippopotame', 'rhinocéros', 'panthère'] },
        fruits: { label: '🍎 Fruits et légumes', words: [
            'banane', 'cerise', 'fraise', 'framboise', 'ananas', 'citron', 'pastèque', 'abricot', 'carotte',
            'tomate', 'poireau', 'courgette', 'aubergine', 'haricot', 'brocoli', 'radis', 'concombre', 'poivron',
            'citrouille', 'champignon', 'myrtille', 'clémentine', 'mangue', 'noisette', 'épinard', 'pomme',
            'poire', 'kiwi', 'melon', 'prune', 'raisin', 'salade', 'navet', 'oignon', 'patate'] },
        ecole: { label: '🏫 L\'école', words: [
            'cartable', 'trousse', 'crayon', 'cahier', 'règle', 'gomme', 'ciseaux', 'compas', 'tableau',
            'maîtresse', 'récréation', 'cantine', 'dictée', 'calcul', 'lecture', 'classeur', 'feutre', 'colle',
            'équerre', 'bureau', 'élève', 'leçon', 'devoirs', 'stylo', 'taille-crayon', 'livre', 'craie',
            'ardoise', 'classe', 'préau', 'cour', 'poésie', 'dessin', 'agenda'] },
        maison: { label: '🏠 La maison', words: [
            'cuisine', 'chambre', 'salon', 'fenêtre', 'escalier', 'grenier', 'placard', 'armoire', 'canapé',
            'fauteuil', 'réfrigérateur', 'lavabo', 'baignoire', 'oreiller', 'couverture', 'lampe', 'rideau',
            'étagère', 'tapis', 'balcon', 'jardin', 'garage', 'cheminée', 'toiture', 'sonnette', 'porte', 'lit',
            'table', 'chaise', 'douche', 'miroir', 'cave', 'four', 'tiroir'] },
        nature: { label: '🌍 Nature et météo', words: [
            'montagne', 'rivière', 'forêt', 'volcan', 'désert', 'cascade', 'océan', 'nuage', 'orage', 'tonnerre',
            'éclair', 'arc-en-ciel', 'soleil', 'tempête', 'brouillard', 'neige', 'prairie', 'colline', 'rocher',
            'plage', 'falaise', 'étoile', 'planète', 'glacier', 'tornade', 'pluie', 'vent', 'lune', 'lac',
            'arbre', 'fleur', 'feuille', 'vague', 'grêle'] },
        metiers: { label: '👩‍🚒 Les métiers', words: [
            'boulanger', 'pompier', 'médecin', 'facteur', 'fermier', 'coiffeur', 'dentiste', 'pilote',
            'cuisinier', 'jardinier', 'infirmier', 'policier', 'vétérinaire', 'astronaute', 'plombier',
            'menuisier', 'boucher', 'architecte', 'journaliste', 'musicien', 'peintre', 'pharmacien',
            'électricien', 'bibliothécaire', 'maçon', 'juge', 'chef', 'marin', 'clown', 'garagiste'] },
        sports: { label: '⚽ Sports et loisirs', words: [
            'football', 'natation', 'tennis', 'judo', 'escalade', 'gymnastique', 'basket', 'rugby', 'vélo', 'ski',
            'patinage', 'danse', 'équitation', 'athlétisme', 'karaté', 'handball', 'badminton', 'volley',
            'marathon', 'surf', 'voile', 'golf', 'pétanque', 'trampoline', 'ballon', 'raquette', 'arbitre',
            'médaille', 'piscine', 'stade', 'équipe'] },
        transports: { label: '🚗 Les transports', words: [
            'voiture', 'camion', 'autobus', 'bateau', 'avion', 'fusée', 'hélicoptère', 'trottinette', 'métro',
            'tramway', 'tracteur', 'moto', 'sous-marin', 'montgolfière', 'voilier', 'ambulance', 'train', 'taxi',
            'péniche', 'bicyclette', 'planeur', 'paquebot', 'scooter', 'remorque', 'locomotive', 'car', 'roue',
            'gare', 'aéroport', 'port'] },
        contes: { label: '🏰 Contes et fêtes', words: [
            'sorcière', 'dragon', 'château', 'princesse', 'chevalier', 'fantôme', 'trésor', 'pirate', 'licorne',
            'cadeau', 'anniversaire', 'guirlande', 'bougie', 'sapin', 'lutin', 'fée', 'baguette', 'carrosse',
            'couronne', 'ogre', 'géant', 'magicien', 'déguisement', 'galette', 'roi', 'reine', 'potion',
            'citrouille', 'lanterne', 'confettis'] },
        corps: { label: '🧍 Le corps', words: [
            'tête', 'épaule', 'genou', 'cheville', 'coude', 'poignet', 'oreille', 'sourcil', 'menton', 'estomac',
            'poumon', 'squelette', 'cheveux', 'doigt', 'orteil', 'talon', 'mollet', 'narine', 'paupière',
            'gencive', 'cerveau', 'muscle', 'langue', 'nombril', 'cou', 'bouche', 'nez', 'dent', 'main', 'pied',
            'ventre', 'jambe'] },
        couleurs: { label: '🎨 Couleurs et formes', words: [
            'rouge', 'jaune', 'orange', 'violet', 'marron', 'turquoise', 'blanc', 'noir', 'rose', 'gris', 'bleu',
            'vert', 'cercle', 'carré', 'triangle', 'rectangle', 'losange', 'étoile', 'ovale', 'hexagone',
            'pentagone', 'spirale', 'cube', 'sphère', 'cylindre', 'pyramide'] },
        vetements: { label: '👕 Les vêtements', words: [
            'pantalon', 'chemise', 'chaussette', 'chaussure', 'écharpe', 'bonnet', 'manteau', 'pyjama', 'jupe',
            'robe', 'casquette', 'gants', 'blouson', 'pull', 'short', 'ceinture', 'cravate', 'botte', 'sandale',
            'tablier', 'maillot', 'imperméable', 'chapeau', 'lunettes', 'moufle', 'gilet'] },
    };
    const JPD_CUSTOM_KEY = 'jeu-pendu-mes-mots';

    const JPD_LEVELS = {
        1: { lives: 10, min: 3, max: 6,  revealFirst: true  },
        2: { lives: 8,  min: 5, max: 8,  revealFirst: false },
        3: { lives: 6,  min: 8, max: 99, revealFirst: false },
    };
    const WORDS_PER_ROUND = 5;
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const BALLOON_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6', '#FF7A1A', '#36C9C6', '#E23B4A', '#8EDB9B'];
    const KIDS = ['🧒', '👧', '👦', '🐻', '🐰', '🐱', '🐶', '🐸', '🐵', '🐼'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    // Lettre de base (sans accent) : é → E, ç → C, œ → OE
    function base(ch) {
        return ch.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }
    const isLetter = (ch) => /[a-zà-öø-ÿœæ]/i.test(ch);
    const letterCount = (w) => w.split('').filter(isLetter).length;
    function cleanWord(w) {
        return w.trim().toLowerCase().replace(/[’`]/g, '\'').replace(/\s+/g, ' ')
            .replace(/[^a-zà-öø-ÿœæ' -]/gi, '');
    }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jpdAudio = null;
    function tone(freq, start, dur, type, vol, slideTo) {
        try {
            if (!_jpdAudio) _jpdAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jpdAudio, t0 = ctx.currentTime + start;
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
        good:  () => { tone(660, 0, 0.08, 'triangle', 0.09); tone(990, 0.06, 0.12, 'triangle', 0.08); },
        pop:   () => { tone(1400, 0, 0.06, 'square', 0.06, 200); tone(180, 0.03, 0.12, 'triangle', 0.08); },
        splash:() => { tone(400, 0, 0.5, 'sawtooth', 0.05, 60); tone(90, 0.1, 0.4, 'sine', 0.1); },
        chalk: () => tone(2400, 0, 0.12, 'sawtooth', 0.02, 1800),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
        hint:  () => tone(880, 0, 0.15, 'sine', 0.08, 1320),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuPenduWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-pendu';
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

        const themeOptions = Object.keys(JPD_THEMES).map(k => `<option value="${k}">${esc(JPD_THEMES[k].label)}</option>`).join('');

        const container = document.createElement('div');
        container.className = 'jpd-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jpd-inner">
            <div class="jpd-header">
                <span class="jpd-title">Le pendu</span>
                <div class="jpd-stats">
                    <span class="jpd-chip" data-role="streak" title="Mots trouvés sans erreur d'affilée">🔥 0</span>
                    <span class="jpd-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jpd-icon-btn" data-role="mode" title="Dessin classique (ardoise)">✏️</button>
                    <button class="jpd-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jpd-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jpd-bar">
                <button class="jpd-lvl active" data-level="1">😊 Facile</button>
                <button class="jpd-lvl" data-level="2">😐 Moyen</button>
                <button class="jpd-lvl" data-level="3">😤 Difficile</button>
                <select class="jpd-select" title="Choisir le thème des mots">
                    <option value="all">🎲 Tous les thèmes</option>
                    ${themeOptions}
                    <option value="custom">✏️ Mes mots…</option>
                </select>
                <div class="jpd-progress" title="Mots de la partie">
                    <span class="jpd-progress-label">Mot</span>
                    ${'<span class="jpd-pdot"></span>'.repeat(WORDS_PER_ROUND)}
                </div>
            </div>

            <div class="jpd-scene">
                <div class="jpd-sun"></div>
                <div class="jpd-cloud c1"></div>
                <div class="jpd-cloud c2"></div>
                <div class="jpd-theme"></div>
                <div class="jpd-flyer">
                    <div class="jpd-sway">
                        <svg viewBox="0 0 240 170" data-role="balloons"></svg>
                        <div class="jpd-kid"></div>
                    </div>
                </div>
                <div class="jpd-classic">
                    <svg viewBox="0 0 200 175">
                        <line class="part" x1="20"  y1="165" x2="120" y2="165"/>
                        <line class="part" x1="50"  y1="165" x2="50"  y2="12"/>
                        <line class="part" x1="50"  y1="12"  x2="135" y2="12"/>
                        <line class="part" x1="50"  y1="40"  x2="78"  y2="12"/>
                        <line class="part" x1="135" y1="12"  x2="135" y2="34"/>
                        <circle class="part" cx="135" cy="48" r="14"/>
                        <line class="part" x1="135" y1="62"  x2="135" y2="108"/>
                        <line class="part" x1="135" y1="74"  x2="114" y2="94"/>
                        <line class="part" x1="135" y1="74"  x2="156" y2="94"/>
                        <line class="part" x1="135" y1="108" x2="117" y2="140"/>
                        <line class="part" x1="135" y1="108" x2="153" y2="140"/>
                    </svg>
                </div>
                <div class="jpd-water"></div>
                <div class="jpd-croc">🐊</div>
                <div class="jpd-splash">PLOUF !</div>
                <div class="jpd-lives"></div>
                <div class="jpd-overlay" data-role="win"><div class="jpd-card"></div></div>
            </div>

            <div class="jpd-word"></div>
            <div class="jpd-keys"></div>

            <div class="jpd-talk">
                <div class="jpd-chef">🎈</div>
                <div class="jpd-msg"></div>
            </div>

            <div class="jpd-actions">
                <button class="jpd-btn" data-act="hint">💡 Indice</button>
                <button class="jpd-btn" data-act="skip">⏭ Autre mot</button>
                <button class="jpd-btn" data-act="restart">🔄 Recommencer</button>
            </div>
          </div>

            <div class="jpd-help">
                <h4>🎈 Comment jouer ?</h4>
                <p>Devine le mot caché lettre par lettre ! Clique sur les lettres du clavier (ou tape-les au clavier de l'ordinateur).</p>
                <p>✅ Si la lettre est dans le mot, elle apparaît à toutes ses places. Les accents sont automatiques : la touche <b>E</b> fait aussi apparaître é, è, ê.</p>
                <p>🎈 Chaque erreur fait éclater un ballon. S'il n'y en a plus… plouf, à l'eau ! (Le bouton ✏️ affiche le pendu classique à la craie.)</p>
                <p>😊 <b>Facile</b> : mots courts, 10 ballons, 1<sup>re</sup> lettre donnée.<br>😐 <b>Moyen</b> : mots de 5 à 8 lettres, 8 ballons.<br>😤 <b>Difficile</b> : mots longs, 6 ballons.</p>
                <p style="margin:0">Le menu permet de choisir un thème, ou d'entrer <b>ses propres mots</b> (✏️ Mes mots…). 5 mots = une partie !</p>
            </div>
            <div class="jpd-custom">
                <h4>✏️ Mes mots</h4>
                <p>Écris tes mots séparés par des virgules ou un mot par ligne (mots de la semaine, dictée…). Ils sont gardés sur cet ordinateur.</p>
                <textarea spellcheck="false" placeholder="exemple : papillon, chocolat, maîtresse"></textarea>
                <div class="row">
                    <button class="jpd-btn" data-act="custom-cancel">Annuler</button>
                    <button class="jpd-btn jpd-btn-go" data-act="custom-ok">✔ Jouer avec ces mots</button>
                </div>
            </div>
            <div class="jpd-confetti"></div>
            <div class="jpd-rh jpd-rh-nw" data-dir="nw"></div>
            <div class="jpd-rh jpd-rh-n"  data-dir="n"></div>
            <div class="jpd-rh jpd-rh-ne" data-dir="ne"></div>
            <div class="jpd-rh jpd-rh-e"  data-dir="e"></div>
            <div class="jpd-rh jpd-rh-se" data-dir="se"></div>
            <div class="jpd-rh jpd-rh-s"  data-dir="s"></div>
            <div class="jpd-rh jpd-rh-sw" data-dir="sw"></div>
            <div class="jpd-rh jpd-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jpd-inner');
        const scene     = $('.jpd-scene');
        const themeEl   = $('.jpd-theme');
        const flyer     = $('.jpd-flyer');
        const balloonSvg= $('[data-role="balloons"]');
        const kidEl     = $('.jpd-kid');
        const splash    = $('.jpd-splash');
        const livesEl   = $('.jpd-lives');
        const parts     = container.querySelectorAll('.jpd-classic .part');
        const wordEl    = $('.jpd-word');
        const keysEl    = $('.jpd-keys');
        const msg       = $('.jpd-msg');
        const chef      = $('.jpd-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jpd-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const modeBtn   = $('[data-role="mode"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jpd-help');
        const customBox = $('.jpd-custom');
        const customTxt = customBox.querySelector('textarea');
        const confetti  = $('.jpd-confetti');
        const selectEl  = $('.jpd-select');
        const lvlBtns   = container.querySelectorAll('.jpd-lvl');
        const pdots     = container.querySelectorAll('.jpd-pdot');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let theme = 'all';
        let lastTheme = 'all';
        let customWords = [];
        try { customWords = JSON.parse(localStorage.getItem(JPD_CUSTOM_KEY) || '[]'); } catch (e) { customWords = []; }
        let word = '', wordTheme = '';
        let guessed = new Set();     // lettres de base proposées
        let hintedPos = new Set();   // positions révélées par l'indice
        let errors = 0, hints = 0, lives = 10;
        let wordNo = 1, results = [], roundStars = 0;
        let score = 0, streak = 0;
        let used = [];
        let busy = false;
        let soundOn = true;
        let classic = false;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Clavier (créé une fois) ────────────────────────────────────────
        const keyEls = {};
        ALPHABET.forEach(L => {
            const k = document.createElement('button');
            k.className = 'jpd-key';
            k.textContent = L;
            k.addEventListener('click', (e) => { e.stopPropagation(); guess(L); });
            keysEl.appendChild(k);
            keyEls[L] = k;
        });

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jpd-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jpd-s', sc.toFixed(4));
            updateDrop();
        }

        // ── Messages ───────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jpd-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.className = 'jpd-pdot' + (results[i] ? ' ' + results[i] : '') + (i === wordNo - 1 && !results[i] ? ' current' : '');
            });
        }

        // ── Ballons ────────────────────────────────────────────────────────
        const NS = 'http://www.w3.org/2000/svg';
        let balloonPos = [];
        function buildBalloons() {
            balloonSvg.innerHTML = '';
            const n = JPD_LEVELS[level].lives;
            const hand = { x: 120, y: 122 };
            balloonPos = [];
            const cols = shuffle(BALLOON_COLORS);
            for (let i = 0; i < n; i++) {
                const t = n === 1 ? 0.5 : i / (n - 1);
                const x = 32 + t * 176;
                const arc = Math.pow(Math.abs(t - 0.5) * 2, 2);
                const y = 26 + arc * 22 + (i % 2) * 20;
                balloonPos.push({ x, y });
                const g = document.createElementNS(NS, 'g');
                g.setAttribute('class', 'jpd-balloon in');
                g.style.animationDelay = (i * 0.05) + 's';
                g.innerHTML = `
                    <path d="M${x} ${y + 21} Q ${(x + hand.x) / 2 + (i % 2 ? 8 : -8)} ${(y + hand.y) / 2 + 10} ${hand.x} ${hand.y}" stroke="#555" stroke-width="1.2" fill="none"/>
                    <ellipse cx="${x}" cy="${y}" rx="17" ry="20" fill="${cols[i % cols.length]}"/>
                    <ellipse cx="${x - 6}" cy="${y - 8}" rx="4" ry="6" fill="rgba(255,255,255,0.55)"/>
                    <path d="M${x - 4} ${y + 23} L${x} ${y + 19} L${x + 4} ${y + 23} Z" fill="${cols[i % cols.length]}"/>`;
                balloonSvg.appendChild(g);
            }
        }
        function popBalloon() {
            const alive = Array.from(balloonSvg.querySelectorAll('.jpd-balloon:not(.gone)'));
            if (!alive.length) return;
            const b = rnd(alive);
            b.classList.add('gone');
            const ell = b.querySelector('ellipse');
            const x = ell.getAttribute('cx'), y = ell.getAttribute('cy');
            b.remove();
            const burst = document.createElementNS(NS, 'text');
            burst.setAttribute('x', x); burst.setAttribute('y', +y + 8);
            burst.setAttribute('text-anchor', 'middle'); burst.setAttribute('font-size', '26');
            burst.setAttribute('class', 'jpd-burst');
            burst.textContent = '💥';
            balloonSvg.appendChild(burst);
            setTimeout(() => burst.remove(), 500);
        }
        // Le personnage descend vers l'eau à chaque erreur
        function updateDrop() {
            const sc = parseFloat(container.style.getPropertyValue('--jpd-s')) || 1;
            const max = JPD_LEVELS[level].lives;
            flyer.style.setProperty('--drop', ((errors / max) * 30 * sc).toFixed(1) + 'px');
        }
        function updateClassic() {
            const max = JPD_LEVELS[level].lives;
            const show = errors >= max ? parts.length : Math.floor(errors / max * parts.length);
            parts.forEach((p, i) => p.classList.toggle('on', i < show));
        }
        function updateLives() {
            const left = lives - errors;
            livesEl.textContent = (classic ? '❤️ × ' : '🎈 × ') + left;
            livesEl.classList.toggle('low', left <= 2);
        }

        // ── Choix du mot ───────────────────────────────────────────────────
        function pickWord() {
            const L = JPD_LEVELS[level];
            let key = theme;
            let list;
            if (theme === 'custom') {
                list = customWords.slice();
                key = 'custom';
            } else {
                if (theme === 'all') {
                    const keys = Object.keys(JPD_THEMES);
                    do { key = rnd(keys); } while (keys.length > 1 && key === lastTheme);
                    lastTheme = key;
                }
                const all = JPD_THEMES[key].words;
                list = all.filter(w => { const n = letterCount(w); return n >= L.min && n <= L.max; });
                if (list.length < 5) list = all.slice();
            }
            let free = list.filter(w => !used.includes(w));
            if (!free.length) { used = used.filter(w => !list.includes(w)); free = list; }
            const w = rnd(free);
            used.push(w);
            return { w, key };
        }

        // ── Rendu du mot ───────────────────────────────────────────────────
        function isFound(ch, i) {
            return !isLetter(ch) || hintedPos.has(i) || base(ch).split('').every(b => guessed.has(b));
        }
        function renderWord(justLetter, revealAll) {
            wordEl.innerHTML = '';
            wordEl.classList.remove('won');
            word.split('').forEach((ch, i) => {
                const t = document.createElement('div');
                t.className = 'jpd-tile';
                if (!isLetter(ch)) {
                    t.classList.add('sep');
                    t.textContent = ch === ' ' ? '' : ch;
                } else if (isFound(ch, i)) {
                    t.textContent = ch;
                    if (hintedPos.has(i) && !base(ch).split('').every(b => guessed.has(b))) t.classList.add('hinted');
                    if (justLetter && base(ch).includes(justLetter)) t.classList.add('shown');
                } else if (revealAll) {
                    t.textContent = ch;
                    t.classList.add('missed', 'shown');
                }
                wordEl.appendChild(t);
            });
        }
        function allFound() { return word.split('').every((ch, i) => isFound(ch, i)); }

        // ── Nouveau mot ────────────────────────────────────────────────────
        function loadWord() {
            if (theme === 'custom' && !customWords.length) { openCustom(); return; }
            const p = pickWord();
            word = p.w; wordTheme = p.key;
            guessed = new Set(); hintedPos = new Set();
            errors = 0; hints = 0; busy = false;
            lives = JPD_LEVELS[level].lives;
            if (JPD_LEVELS[level].revealFirst) {
                const first = word.split('').find(isLetter);
                if (first) base(first).split('').forEach(b => guessed.add(b));
            }
            winLayer.classList.remove('show');
            splash.classList.remove('show');
            flyer.classList.remove('fall', 'fly');
            kidEl.textContent = rnd(KIDS);
            buildBalloons();
            updateDrop(); updateClassic(); updateLives();
            ALPHABET.forEach(L => {
                const k = keyEls[L];
                k.disabled = false;
                k.className = 'jpd-key' + (guessed.has(L) ? ' good' : '');
                if (guessed.has(L)) k.disabled = true;
            });
            themeEl.textContent = wordTheme === 'custom' ? '✏️ Mes mots' : JPD_THEMES[wordTheme].label;
            renderWord();
            updateStats(false);
            const n = letterCount(word);
            say(`🔎 Mot n°${wordNo} : ${n} lettres${JPD_LEVELS[level].revealFirst ? ', la première est donnée' : ''}. Propose une lettre !`);
        }
        function newRound() {
            wordNo = 1; results = []; roundStars = 0;
            loadWord();
        }

        // ── Proposer une lettre ────────────────────────────────────────────
        function guess(L) {
            if (busy || winLayer.classList.contains('show') || !word) return;
            if (guessed.has(L)) { say(`Tu as déjà proposé la lettre <span class="k">${L}</span> !`); return; }
            guessed.add(L);
            const k = keyEls[L];
            k.disabled = true;
            const count = word.split('').filter(ch => isLetter(ch) && base(ch).includes(L)).length;
            if (count) {
                k.classList.add('good');
                sfx('good');
                renderWord(L);
                if (allFound()) return winWord();
                say(`✅ Oui ! ${count > 1 ? `Il y a <b>${count}</b> « ${L} »` : `Il y a un « ${L} »`} dans le mot.`, 'good');
            } else {
                errors++;
                streak = 0;
                k.classList.add('bad', 'fresh');
                setTimeout(() => k.classList.remove('fresh'), 450);
                if (classic) sfx('chalk'); else { sfx('pop'); popBalloon(); }
                updateDrop(); updateClassic(); updateLives();
                updateStats(false);
                const left = lives - errors;
                if (left <= 0) return loseWord();
                say(`❌ Pas de « ${L} » dans ce mot… ${classic ? '' : '🎈 Pop ! '}Il reste <b>${left}</b> ${classic ? 'essai' : 'ballon'}${left > 1 ? 's' : ''}.`, 'bad');
            }
        }

        // ── Indice : révèle une lettre manquante (coûte une étoile) ────────
        function giveHint() {
            if (busy || winLayer.classList.contains('show') || !word) return;
            const missing = [];
            word.split('').forEach((ch, i) => { if (!isFound(ch, i)) missing.push(i); });
            if (!missing.length) return;
            if (missing.length === 1) { say('💡 Il ne reste qu\'une lettre : à toi de la trouver !'); return; }
            // Révéler toutes les places de la lettre choisie
            const i = rnd(missing);
            const L = base(word[i])[0];
            hints++;
            guessed.add(L);
            keyEls[L].disabled = true;
            keyEls[L].classList.add('good');
            sfx('hint');
            renderWord(L);
            if (allFound()) return winWord();
            say(`💡 Voici la lettre <span class="k">${L}</span> ! (un indice coûte une étoile)`);
        }

        // ── Fin d'un mot ───────────────────────────────────────────────────
        function starsFor() {
            const max = JPD_LEVELS[level].lives;
            let st = errors === 0 ? 3 : errors <= Math.floor(max / 3) ? 2 : 1;
            st = Math.max(1, st - hints);
            return st;
        }
        function winWord() {
            busy = true;
            const st = starsFor();
            const perfect = errors === 0 && hints === 0;
            streak = perfect ? streak + 1 : 0;
            const bonus = streak >= 3 ? 5 : 0;
            const pts = st * 10 + bonus;
            score += pts; roundStars += st;
            results[wordNo - 1] = 'win';
            updateStats(true);
            renderWord();
            wordEl.classList.add('won');
            say(`🎉 ${rnd(['Bravo', 'Super', 'Génial', 'Bien joué', 'Excellent'])} ! Tu as trouvé le mot <span class="k">${esc(word.toUpperCase())}</span>.`, 'good');
            sfx('win');
            if (!classic) flyer.classList.add('fly');
            setTimeout(() => showCard(true, st, pts, bonus), classic ? 700 : 1300);
        }
        function loseWord() {
            busy = true;
            streak = 0;
            results[wordNo - 1] = 'lose';
            updateStats(false);
            renderWord(null, true);
            say(`😵 Perdu ! Le mot était <span class="k">${esc(word.toUpperCase())}</span>. Tu feras mieux au prochain !`, 'bad');
            if (!classic) {
                setTimeout(() => { flyer.classList.add('fall'); sfx('splash'); }, 250);
                setTimeout(() => splash.classList.add('show'), 900);
            }
            setTimeout(() => showCard(false, 0, 0, 0), classic ? 900 : 1900);
        }
        function showCard(won, st, pts, bonus) {
            if (!widget.isConnected) return;
            const last = wordNo >= WORDS_PER_ROUND;
            winCard.innerHTML = won ? `
                <h3>${errors === 0 && hints === 0 ? 'Sans aucune erreur !' : 'Mot trouvé !'}</h3>
                <div class="jpd-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>+${pts} points${bonus ? ' (dont +5 bonus série 🔥)' : ''}</p>
                <button class="jpd-btn jpd-btn-go" data-act="next">${last ? '🏁 Fin de la partie' : 'Mot suivant ▶'}</button>` : `
                <h3>${classic ? 'Pendu !' : 'Plouf !'}</h3>
                <p>Le mot était :</p>
                <div class="jpd-reveal">${esc(word)}</div>
                <p></p>
                <button class="jpd-btn jpd-btn-go" data-act="next">${last ? '🏁 Fin de la partie' : 'Mot suivant ▶'}</button>`;
            winLayer.classList.add('show');
            if (won) {
                party();
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
            }
            winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                e.stopPropagation();
                if (last) finalScreen();
                else { wordNo++; loadWord(); }
            });
        }
        function finalScreen() {
            const max = WORDS_PER_ROUND * 3;
            const found = results.filter(r => r === 'win').length;
            const medal = roundStars >= max - 2 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'Champion des mots !' : medal === '🥈' ? 'Très beau score !' : 'Partie terminée !';
            wordNo = WORDS_PER_ROUND + 1;
            updateStats(false);
            winCard.innerHTML = `
                <div class="jpd-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${found} mot${found > 1 ? 's' : ''} trouvé${found > 1 ? 's' : ''} sur ${WORDS_PER_ROUND} · ${roundStars} ⭐ sur ${max}</p>
                <button class="jpd-btn jpd-btn-go" data-act="again">🔄 Nouvelle partie</button>`;
            winLayer.classList.add('show');
            sfx('win');
            party();
            say(`🏁 Partie terminée : ${found} mot${found > 1 ? 's' : ''} sur ${WORDS_PER_ROUND} ! Rejoue ou change de thème.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
        }
        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = rnd(BALLOON_COLORS.concat(['#fff']));
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Mes mots ───────────────────────────────────────────────────────
        function openCustom() {
            helpBox.classList.remove('show');
            customTxt.value = customWords.join(', ');
            customBox.classList.add('show');
            setTimeout(() => customTxt.focus(), 50);
        }
        btn('custom-ok').addEventListener('click', (e) => {
            e.stopPropagation();
            const list = customTxt.value.split(/[,;\n]+/).map(cleanWord).filter(w => letterCount(w) >= 2 && w.length <= 24);
            const uniq = Array.from(new Set(list));
            if (!uniq.length) { customTxt.focus(); customTxt.style.borderColor = '#FF4F5E'; return; }
            customTxt.style.borderColor = '';
            customWords = uniq;
            try { localStorage.setItem(JPD_CUSTOM_KEY, JSON.stringify(customWords)); } catch (err) { /* stockage indisponible */ }
            customBox.classList.remove('show');
            theme = 'custom'; selectEl.value = 'custom';
            used = [];
            newRound();
        });
        btn('custom-cancel').addEventListener('click', (e) => {
            e.stopPropagation();
            customBox.classList.remove('show');
            if (!customWords.length) { theme = 'all'; selectEl.value = 'all'; if (!word) newRound(); }
            else selectEl.value = theme;
        });
        customBox.addEventListener('click', (e) => e.stopPropagation());
        customBox.addEventListener('keydown', (e) => e.stopPropagation());

        // ── Niveaux / thème ────────────────────────────────────────────────
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            streak = 0; used = [];
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        selectEl.addEventListener('change', () => {
            if (selectEl.value === 'custom') { openCustom(); return; }
            theme = selectEl.value; streak = 0; used = [];
            newRound();
        });
        selectEl.addEventListener('pointerdown', (e) => e.stopPropagation());
        selectEl.addEventListener('mousedown', (e) => e.stopPropagation());

        btn('hint').addEventListener('click', giveHint);
        btn('skip').addEventListener('click', () => {
            if (busy || winLayer.classList.contains('show')) return;
            streak = 0;
            say('⏭ Mot passé.');
            loadWord();
        });
        btn('restart').addEventListener('click', () => { streak = 0; used = []; newRound(); });

        // ── Clavier physique ───────────────────────────────────────────────
        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae)) return;
            if (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT' || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Enter' && winLayer.classList.contains('show')) {
                const b = winCard.querySelector('button'); if (b) { e.preventDefault(); b.click(); } return;
            }
            if (e.key.length !== 1) return;
            const L = base(e.key)[0];
            if (L && /[A-Z]/.test(L)) { e.preventDefault(); e.stopPropagation(); guess(L); }
        };
        document.addEventListener('keydown', onKey);

        // ── Mode de dessin ─────────────────────────────────────────────────
        modeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            classic = !classic;
            scene.classList.toggle('classic', classic);
            modeBtn.textContent = classic ? '🎈' : '✏️';
            modeBtn.title = classic ? 'Dessin avec les ballons' : 'Dessin classique (ardoise)';
            chef.textContent = classic ? '✏️' : '🎈';
            updateClassic(); updateLives();
        });
        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundOn = !soundOn;
            soundBtn.textContent = soundOn ? '🔊' : '🔇';
            soundBtn.title = soundOn ? 'Couper le son' : 'Activer le son';
        });
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); customBox.classList.remove('show'); helpBox.classList.toggle('show'); });
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
            window._wfMiniBarCollapse(widget, '🎈 Le pendu', { onExpand: applyScale });
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
            container.focus({ preventScroll: true });
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
        container.querySelectorAll('.jpd-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, textarea, .jpd-rh, .jpd-help, .jpd-custom')) {
                e.stopPropagation();
                if (!e.target.closest('textarea, select')) container.focus({ preventScroll: true });
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
            widget.focus({ preventScroll: true });
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
            if (type === 'jeu-pendu') return window.createJeuPenduWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-pendu') return window.createJeuPenduWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
