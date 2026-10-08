// =========================================================================
// JEU « LE TIR AUX FONCTIONS » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Stand de tir de fête foraine : un groupe de mots est surligné dans une
// phrase. L'élève tire sur la cible qui porte sa fonction grammaticale.
// Les cibles défilent sur deux étagères (on peut les arrêter).
// 10 tirs par tournée.
// 3 niveaux : facile (sujet, verbe, COD) / moyen (+ COI, CC) /
//   difficile (CC de lieu, de temps, de manière, attribut du sujet)
//
// Ouverture   : createWidget('jeu-tir-fonctions')
// Sauvegarde  : widget._jtfGetData()  → jtfData dans save-load.js
// Restauration: createJeuTirFonctionsWidget(jtfData)
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


    // ── CSS du jeu (préfixe jtf-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-tir-fonctions-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tir-fonctions-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-tir-fonctions"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jtf-container {
            --jtf-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --marqueur: #FF9F1A;

            width: 680px;
            box-sizing: border-box;
            position: relative;
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jtf-s));
            padding: calc(12px * var(--jtf-s)) calc(14px * var(--jtf-s)) calc(14px * var(--jtf-s));
            border-radius: calc(24px * var(--jtf-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jtf-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jtf-container > .jtf-header,
        .jtf-container > .jtf-bar,
        .jtf-container > .jtf-board,
        .jtf-container > .jtf-scene,
        .jtf-container > .jtf-talk,
        .jtf-container > .jtf-actions { flex-shrink: 0; }
        .jtf-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
            justify-content: center;
            overflow: hidden !important;
        }
        .jtf-container.wf-fullboard > .jtf-header,
        .jtf-container.wf-fullboard > .jtf-bar,
        .jtf-container.wf-fullboard > .jtf-board,
        .jtf-container.wf-fullboard > .jtf-scene,
        .jtf-container.wf-fullboard > .jtf-talk,
        .jtf-container.wf-fullboard > .jtf-actions {
            width: 100%; box-sizing: border-box;
            max-width: calc(760px * var(--jtf-s));
            margin-left: auto; margin-right: auto;
        }
        .jtf-container.wf-fullboard > .jtf-scene { aspect-ratio: auto; height: calc(270px * var(--jtf-s)); }
        .jtf-container.wf-fullboard .jtf-help { right: 50%; transform: translateX(50%); }

        /* ── En-tête ── */
        .jtf-header { display: flex; align-items: center; gap: calc(10px * var(--jtf-s)); cursor: move; flex-wrap: wrap; }
        .jtf-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jtf-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jtf-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1.15;
        }
        .jtf-stats { display: flex; gap: calc(6px * var(--jtf-s)); align-items: center; margin-left: auto; }
        .jtf-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jtf-s)) calc(10px * var(--jtf-s));
            font-weight: 900; font-size: calc(14px * var(--jtf-s)); white-space: nowrap;
        }
        .jtf-chip.hot { background: #FF7A1A; }
        @keyframes jtf-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jtf-chip.bump { animation: jtf-bump .4s ease; }
        .jtf-icon-btn {
            width: calc(26px * var(--jtf-s)); height: calc(26px * var(--jtf-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jtf-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jtf-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + progression ── */
        .jtf-bar { display: flex; align-items: center; gap: calc(6px * var(--jtf-s)); flex-wrap: wrap; }
        .jtf-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtf-s));
            padding: calc(5px * var(--jtf-s)) calc(12px * var(--jtf-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jtf-lvl:hover { background: rgba(255,255,255,0.1); }
        .jtf-lvl:active { transform: scale(0.95); }
        .jtf-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jtf-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jtf-s)); align-items: center; }
        .jtf-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jtf-s)); margin-right: 2px; }
        .jtf-pdot { width: calc(14px * var(--jtf-s)); height: calc(14px * var(--jtf-s)); border-radius: 50%; background: rgba(255,255,255,0.15); }
        .jtf-pdot.done { background: var(--vert); }
        .jtf-pdot.miss { background: #FF9F1A; }
        .jtf-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Tableau (la phrase) ── */
        .jtf-board {
            background: #14284D;
            border: calc(4px * var(--jtf-s)) solid #0B1830;
            border-radius: calc(14px * var(--jtf-s));
            padding: calc(10px * var(--jtf-s)) calc(14px * var(--jtf-s)) calc(12px * var(--jtf-s));
            color: #fff; text-align: center;
            font-weight: 900; font-size: calc(25px * var(--jtf-s)); line-height: 2;
            box-shadow: inset 0 calc(-5px * var(--jtf-s)) 0 rgba(0,0,0,0.25);
        }
        .jtf-board-label {
            display: block; font-size: calc(11px * var(--jtf-s)); letter-spacing: 2px;
            color: var(--or); text-transform: uppercase; margin-bottom: calc(2px * var(--jtf-s));
        }
        .jtf-grp { position: relative; display: inline; border-radius: calc(6px * var(--jtf-s)); padding: 0 calc(3px * var(--jtf-s)); }
        .jtf-grp.target {
            background: var(--marqueur); color: var(--encre);
            box-shadow: 0 calc(3px * var(--jtf-s)) 0 #B86A00;
        }
        @keyframes jtf-glow { 0%,100% { box-shadow: 0 calc(3px * var(--jtf-s)) 0 #B86A00; } 50% { box-shadow: 0 calc(3px * var(--jtf-s)) 0 #B86A00, 0 0 0 calc(4px * var(--jtf-s)) rgba(255,159,26,0.45); } }
        .jtf-grp.target.wait { animation: jtf-glow 1.4s ease-in-out infinite; }
        .jtf-grp.target.solved { background: var(--vert); color: #fff; box-shadow: 0 calc(3px * var(--jtf-s)) 0 #1C8A4F; }
        .jtf-tag {
            position: absolute; left: 50%; top: 100%; transform: translate(-50%, -30%);
            font-size: 0.42em; line-height: 1.2; letter-spacing: 0.5px;
            color: var(--or); text-transform: uppercase; white-space: nowrap;
            pointer-events: none;
        }
        .jtf-grp.target .jtf-tag { color: #7CF0AE; }
        .jtf-target.snap { transition: left .45s ease; }

        /* ── Stand de tir ── */
        .jtf-scene {
            position: relative;
            border-radius: calc(18px * var(--jtf-s));
            overflow: hidden;
            aspect-ratio: 680 / 270;
            background:
                repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0 2px, transparent 2px calc(46px * var(--jtf-s))),
                linear-gradient(180deg, #7C3AED 0%, #5B21B6 100%);
            cursor: crosshair;
        }
        .jtf-scene.locked { cursor: default; }
        .jtf-awning {
            position: absolute; left: 0; right: 0; top: 0; height: 14%;
            background: repeating-linear-gradient(90deg, #FF4F5E 0 calc(34px * var(--jtf-s)), #FFF7E6 calc(34px * var(--jtf-s)) calc(68px * var(--jtf-s)));
            box-shadow: 0 calc(4px * var(--jtf-s)) 0 rgba(0,0,0,0.2);
        }
        .jtf-awning::after {
            content: ''; position: absolute; left: 0; right: 0; bottom: calc(-9px * var(--jtf-s)); height: calc(10px * var(--jtf-s));
            background: radial-gradient(circle at calc(17px * var(--jtf-s)) 0, #FF4F5E calc(10px * var(--jtf-s)), transparent calc(11px * var(--jtf-s))) 0 0 / calc(68px * var(--jtf-s)) 100% repeat-x,
                        radial-gradient(circle at calc(51px * var(--jtf-s)) 0, #FFF7E6 calc(10px * var(--jtf-s)), transparent calc(11px * var(--jtf-s))) 0 0 / calc(68px * var(--jtf-s)) 100% repeat-x;
        }
        .jtf-bulbs { position: absolute; left: 2%; right: 2%; top: 18%; display: flex; justify-content: space-between; pointer-events: none; }
        .jtf-bulbs i { width: calc(8px * var(--jtf-s)); height: calc(8px * var(--jtf-s)); border-radius: 50%; background: #FFE680; box-shadow: 0 0 calc(8px * var(--jtf-s)) #FFD84D; }
        @keyframes jtf-blink { 50% { opacity: 0.35; } }
        .jtf-bulbs i:nth-child(odd) { animation: jtf-blink 1.2s steps(1) infinite; }
        .jtf-shelf {
            position: absolute; left: 0; right: 0; height: calc(12px * var(--jtf-s));
            background: linear-gradient(180deg, #E8B36A, #B97A35);
            box-shadow: 0 calc(4px * var(--jtf-s)) 0 rgba(0,0,0,0.25);
        }
        .jtf-shelf.r1 { top: 56%; }
        .jtf-shelf.r2 { top: 93%; }

        .jtf-target {
            position: absolute; transform: translate(-50%, -100%);
            border: none; background: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; align-items: center;
            cursor: crosshair; font-family: inherit;
            width: calc(110px * var(--jtf-s));
            transform-origin: 50% 100%;
        }
        .jtf-scene.locked .jtf-target { cursor: default; }
        .jtf-disc {
            width: calc(50px * var(--jtf-s)); height: calc(50px * var(--jtf-s)); border-radius: 50%;
            background: radial-gradient(circle, #FF4F5E 0 18%, #fff 19% 36%, #FF4F5E 37% 54%, #fff 55% 72%, #FF4F5E 73% 100%);
            border: calc(3px * var(--jtf-s)) solid #2A1F4A; box-sizing: border-box;
            transition: transform .25s;
        }
        .jtf-plaque {
            margin-top: calc(-4px * var(--jtf-s));
            background: var(--creme); color: var(--encre);
            border: calc(3px * var(--jtf-s)) solid #2A1F4A; border-radius: calc(8px * var(--jtf-s));
            padding: calc(2px * var(--jtf-s)) calc(6px * var(--jtf-s));
            font-weight: 900; font-size: calc(15px * var(--jtf-s)); line-height: 1.2;
            white-space: nowrap; max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis;
        }
        .jtf-stick { width: calc(6px * var(--jtf-s)); height: calc(12px * var(--jtf-s)); background: #2A1F4A; }
        .jtf-target:hover .jtf-disc { transform: scale(1.08); }
        .jtf-scene.locked .jtf-target:hover .jtf-disc { transform: none; }
        @keyframes jtf-shake { 0%,100% { transform: translate(-50%,-100%); } 20% { transform: translate(calc(-50% - 6px),-100%) rotate(-6deg); } 60% { transform: translate(calc(-50% + 6px),-100%) rotate(6deg); } }
        .jtf-target.ko { animation: jtf-shake .4s ease; }
        .jtf-target.ko .jtf-plaque { background: #FFD3D8; }
        .jtf-target.fallen { opacity: 0.35; pointer-events: none; transform: translate(-50%,-100%) rotateX(70deg); transition: transform .35s, opacity .35s; }
        @keyframes jtf-spin { 0% { transform: translate(-50%,-100%) rotateY(0); } 100% { transform: translate(-50%,-100%) rotateY(720deg); } }
        .jtf-target.ok { animation: jtf-spin .7s ease-out; }
        .jtf-target.ok .jtf-disc { background: radial-gradient(circle, #2FBF71 0 30%, #fff 31% 50%, #2FBF71 51% 100%); }
        .jtf-target.ok .jtf-plaque { background: var(--vert); color: #fff; }
        .jtf-target.dim { opacity: 0.4; }
        .jtf-hole {
            position: absolute; width: calc(12px * var(--jtf-s)); height: calc(12px * var(--jtf-s)); border-radius: 50%;
            background: #1A1330; box-shadow: 0 0 0 calc(2px * var(--jtf-s)) rgba(0,0,0,0.25);
            transform: translate(-50%, -50%); pointer-events: none;
        }
        .jtf-pow {
            position: absolute; transform: translate(-50%, -50%); pointer-events: none; z-index: 5;
            font-size: calc(34px * var(--jtf-s)); line-height: 1;
            animation: jtf-pow .45s ease-out forwards;
        }
        @keyframes jtf-pow { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; } }

        /* ── Actions ── */
        .jtf-actions { display: flex; gap: calc(8px * var(--jtf-s)); justify-content: center; flex-wrap: wrap; }
        .jtf-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jtf-s));
            padding: calc(8px * var(--jtf-s)) calc(14px * var(--jtf-s));
            border-radius: calc(14px * var(--jtf-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jtf-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jtf-btn:hover { filter: brightness(1.05); }
        .jtf-btn:active { transform: translateY(calc(4px * var(--jtf-s))); box-shadow: 0 calc(1px * var(--jtf-s)) 0 #B9B2D6; }
        .jtf-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jtf-btn.on { background: var(--or); }
        .jtf-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jtf-s));
            padding: calc(8px * var(--jtf-s)) calc(22px * var(--jtf-s));
            box-shadow: 0 calc(5px * var(--jtf-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jtf-btn-go:active { box-shadow: 0 calc(1px * var(--jtf-s)) 0 #1C8A4F; }
        .jtf-btn:focus-visible, .jtf-lvl:focus-visible, .jtf-target:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Forain ── */
        .jtf-talk { display: flex; align-items: center; gap: calc(10px * var(--jtf-s)); }
        .jtf-chef {
            width: calc(44px * var(--jtf-s)); height: calc(44px * var(--jtf-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jtf-s));
            box-shadow: 0 calc(3px * var(--jtf-s)) 0 #B3840B;
        }
        @keyframes jtf-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jtf-s))) rotate(-8deg); } }
        .jtf-chef.hop { animation: jtf-hop .4s ease; }
        .jtf-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jtf-s));
            padding: calc(8px * var(--jtf-s)) calc(12px * var(--jtf-s));
            font-weight: 700; font-size: calc(15px * var(--jtf-s)); line-height: 1.35;
            min-height: calc(22px * var(--jtf-s));
            border-left: calc(6px * var(--jtf-s)) solid var(--or);
        }
        .jtf-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jtf-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jtf-msg b { font-weight: 900; }
        .jtf-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; }

        /* ── Écrans de fin ── */
        .jtf-overlay { position: absolute; inset: 0; z-index: 10; display: none; align-items: center; justify-content: center; background: rgba(42,31,74,0.35); }
        .jtf-overlay.show { display: flex; }
        @keyframes jtf-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jtf-card {
            background: #fff; border-radius: calc(18px * var(--jtf-s));
            padding: calc(12px * var(--jtf-s)) calc(22px * var(--jtf-s)) calc(14px * var(--jtf-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jtf-s)) 0 #B9B2D6;
            animation: jtf-pop .35s ease-out; max-width: 90%; cursor: default;
        }
        .jtf-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jtf-s)); color: var(--encre); }
        .jtf-card p { margin: calc(4px * var(--jtf-s)) 0 calc(8px * var(--jtf-s)); font-weight: 800; font-size: calc(14px * var(--jtf-s)); }
        .jtf-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jtf-s)); margin: calc(4px * var(--jtf-s)) 0; }
        .jtf-bigstars span { font-size: calc(34px * var(--jtf-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jtf-bigstars span.on { opacity: 1; filter: none; animation: jtf-pop .35s ease-out both; }
        .jtf-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jtf-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jtf-medal { font-size: calc(56px * var(--jtf-s)); line-height: 1; animation: jtf-pop .5s ease-out; }

        /* ── Aide ── */
        .jtf-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 340px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jtf-help.show { display: block; }
        .jtf-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jtf-help p { margin: 0 0 7px; }
        .jtf-help table { border-collapse: collapse; width: 100%; margin: 0 0 7px; font-size: 12px; }
        .jtf-help td { padding: 2px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
        .jtf-help td:first-child { font-weight: 900; white-space: nowrap; color: #B86A00; }

        /* ── Confettis ── */
        .jtf-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jtf-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jtf-fall 1.8s ease-in forwards; }
        @keyframes jtf-fall { to { transform: translateY(600px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jtf-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jtf-container:hover .jtf-rh { opacity: 1; }
        .jtf-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jtf-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jtf-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jtf-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jtf-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jtf-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jtf-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jtf-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jtf-container *, .jtf-container *::before, .jtf-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUE DE PHRASES
    // Chaque groupe est noté {FONCTION|texte}. Fonctions :
    //   S sujet · V verbe · COD · COI · CCL / CCT / CCM (compléments
    //   circonstanciels de lieu, de temps, de manière) · ATT attribut du sujet
    // Le 1er nombre est la difficulté de la phrase (1, 2 ou 3).
    // =========================================================================
    const JTF_PHRASES = [
        [1, '{S|Le chat} {V|attrape} {COD|une souris}.'],
        [1, '{S|Les enfants} {V|regardent} {COD|un dessin animé}.'],
        [1, '{S|Léa} {V|mange} {COD|une pomme}.'],
        [1, '{S|Mon père} {V|lave} {COD|la voiture}.'],
        [1, '{S|Nous} {V|écoutons} {COD|la musique}.'],
        [1, '{S|Le maître} {V|corrige} {COD|les cahiers}.'],
        [1, '{S|Tom} {V|lance} {COD|le ballon}.'],
        [1, '{S|Les oiseaux} {V|construisent} {COD|un nid}.'],
        [1, '{S|Tu} {V|lis} {COD|un roman}.'],
        [1, '{S|Ma grand-mère} {V|prépare} {COD|une tarte}.'],
        [1, '{S|Le boulanger} {V|vend} {COD|du pain}.'],
        [1, '{S|Les élèves} {V|rangent} {COD|leurs affaires}.'],
        [1, '{S|Le petit garçon} {V|dessine} {COD|un dragon}.'],
        [1, '{S|Vous} {V|ouvrez} {COD|la fenêtre}.'],

        [2, '{S|Paul} {V|parle} {COI|à sa sœur}.'],
        [2, '{S|Les enfants} {V|jouent} {CCL|dans la cour}.'],
        [2, '{CCT|Ce matin}, {S|le facteur} {V|a apporté} {COD|une lettre}.'],
        [2, '{S|Je} {V|pense} {COI|à mes vacances}.'],
        [2, '{S|Le chien} {V|dort} {CCL|sous la table}.'],
        [2, '{S|Elle} {V|chante} {CCM|joyeusement}.'],
        [2, '{S|Mes cousins} {V|arriveront} {CCT|demain}.'],
        [2, '{S|Le chat de Julie} {V|boit} {COD|son lait} {CCL|dans la cuisine}.'],
        [2, '{S|La maîtresse} {V|raconte} {COD|une histoire} {CCT|chaque vendredi}.'],
        [2, '{S|Les touristes} {V|visitent} {COD|le château} {CCT|en été}.'],
        [2, '{S|Ce garçon} {V|obéit} {COI|à ses parents}.'],
        [2, '{S|Nous} {V|rêvons} {COI|de la mer}.'],
        [2, '{S|Le vent} {V|souffle} {CCM|très fort}.'],
        [2, '{CCL|Au marché}, {S|maman} {V|achète} {COD|des légumes}.'],

        [3, '{S|Mon frère} {V|est} {ATT|très grand}.'],
        [3, '{S|Le ciel} {V|devient} {ATT|gris}.'],
        [3, '{S|Ces fleurs} {V|semblent} {ATT|fanées}.'],
        [3, '{CCL|Dans la forêt} {V|vivent} {S|des cerfs}.'],
        [3, '{S|Le vieux pêcheur} {V|répare} {COD|son filet} {CCM|avec patience}.'],
        [3, '{CCT|Pendant la nuit}, {S|la neige} {V|est tombée} {CCM|en silence}.'],
        [3, '{S|Les élèves de CM2} {V|participent} {COI|au spectacle} {CCT|samedi}.'],
        [3, '{S|Ce gâteau} {V|paraît} {ATT|délicieux}.'],
        [3, '{S|Le renard} {V|guette} {COD|les poules} {CCL|derrière la haie}.'],
        [3, '{CCM|Lentement}, {S|la tortue} {V|traverse} {COD|la route}.'],
        [3, '{S|Le directeur} {V|parle} {COI|de la kermesse} {CCL|dans le préau}.'],
        [3, '{S|Ma cousine} {V|deviendra} {ATT|pilote}.'],
        [3, '{CCT|Hier soir}, {S|les pompiers} {V|ont éteint} {COD|l\'incendie} {CCM|rapidement}.'],
        [3, '{S|Les feuilles} {V|restent} {ATT|vertes} {CCT|tout l\'été}.'],
    ];

    // Étiquettes de cibles et correspondance des fonctions selon le niveau
    const JTF_LEVELS = {
        1: { labels: ['Sujet', 'Verbe', 'COD'],
             map: { S: 'Sujet', V: 'Verbe', COD: 'COD' },
             phrases: [1], speed: 5 },
        2: { labels: ['Sujet', 'Verbe', 'COD', 'COI', 'CC'],
             map: { S: 'Sujet', V: 'Verbe', COD: 'COD', COI: 'COI', CCL: 'CC', CCT: 'CC', CCM: 'CC' },
             phrases: [1, 2], speed: 6.5 },
        3: { labels: ['Sujet', 'Verbe', 'COD', 'COI', 'CC lieu', 'CC temps', 'CC manière', 'Attribut'],
             map: { S: 'Sujet', V: 'Verbe', COD: 'COD', COI: 'COI', CCL: 'CC lieu', CCT: 'CC temps', CCM: 'CC manière', ATT: 'Attribut' },
             phrases: [2, 3], speed: 7.5 },
    };
    const QUESTIONS_PER_ROUND = 10;
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#fff'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // Découpe « {S|Le chat} {V|mange}. » en morceaux texte / groupes
    function parsePhrase(markup) {
        const parts = [];
        const re = /\{(\w+)\|([^}]*)\}/g;
        let last = 0, m;
        while ((m = re.exec(markup))) {
            if (m.index > last) parts.push({ text: markup.slice(last, m.index) });
            parts.push({ tag: m[1], text: m[2] });
            last = re.lastIndex;
        }
        if (last < markup.length) parts.push({ text: markup.slice(last) });
        return parts;
    }

    // Explication de la fonction d'un groupe
    function explain(tag, g, parts) {
        const vp = parts.find(p => p.tag === 'V');
        const v = vp ? vp.text : 'le verbe';
        const G = `« ${esc(g)} »`;
        switch (tag) {
            case 'S':   return `Qui est-ce qui <b>${esc(v)}</b> ? → ${G} : c'est le <span class="k">sujet</span>.`;
            case 'V':   return `${G} est le <span class="k">verbe</span> : il se conjugue et change si on dit « hier » ou « demain ».`;
            case 'COD': return `On se demande : « ${esc(v)} <b>quoi ?</b> » (ou qui ?) → ${G} : c'est le <span class="k">COD</span>, sans préposition.`;
            case 'COI': return `On se demande : « ${esc(v)} <b>à qui ? à quoi ? de quoi ?</b> » → ${G} : c'est un <span class="k">COI</span>, il commence par une préposition (à, au, de…).`;
            case 'CCL': return `${G} répond à la question <b>où ?</b> et on peut le déplacer : c'est un <span class="k">CC de lieu</span>.`;
            case 'CCT': return `${G} répond à la question <b>quand ?</b> et on peut le déplacer : c'est un <span class="k">CC de temps</span>.`;
            case 'CCM': return `${G} répond à la question <b>comment ?</b> et on peut le supprimer : c'est un <span class="k">CC de manière</span>.`;
            case 'ATT': return `Après le verbe d'état « ${esc(v)} », ${G} dit comment est le sujet : c'est un <span class="k">attribut du sujet</span>.`;
        }
        return '';
    }
    // Méthode pour une fonction (sans donner la réponse)
    const METHOD = {
        S:   'Pose la question « <b>Qui est-ce qui</b> + verbe ? ».',
        V:   'Cherche le mot qui change quand on dit « hier » ou « demain ».',
        COD: 'Pose la question « verbe + <b>quoi ?</b> » ou « verbe + <b>qui ?</b> ».',
        COI: 'Pose la question « verbe + <b>à qui ? à quoi ? de quoi ?</b> ».',
        CCL: 'Ce groupe peut-il se déplacer ? Répond-il à <b>où ?</b>',
        CCT: 'Ce groupe peut-il se déplacer ? Répond-il à <b>quand ?</b>',
        CCM: 'Ce groupe peut-il se supprimer ? Répond-il à <b>comment ?</b>',
        ATT: 'Regarde le verbe : est-ce un verbe d\'état (être, sembler, devenir, paraître, rester) ?',
    };

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jtfAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jtfAudio) _jtfAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtfAudio, t0 = ctx.currentTime + start;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0); o.stop(t0 + dur + 0.05);
        } catch (e) { /* audio indisponible */ }
    }
    function noise(dur, vol) {
        try {
            if (!_jtfAudio) _jtfAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtfAudio, len = Math.floor(ctx.sampleRate * dur);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate), data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
            const src = ctx.createBufferSource(), g = ctx.createGain();
            g.gain.value = vol || 0.15; src.buffer = buf; src.connect(g); g.connect(ctx.destination); src.start();
        } catch (e) { /* audio indisponible */ }
    }
    const SFX = {
        shot:  () => noise(0.12, 0.18),
        good:  () => { tone(660, 0.05, 0.1, 'triangle', 0.1); tone(990, 0.15, 0.18, 'triangle', 0.1); },
        error: () => { tone(200, 0.05, 0.18, 'square', 0.05); tone(160, 0.23, 0.25, 'square', 0.05); },
        drop:  () => tone(300, 0, 0.15, 'sine', 0.06),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // savedData (facultatif) : données issues de la sauvegarde du board
    // =========================================================================
    window.createJeuTirFonctionsWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-tir-fonctions';
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
        container.className = 'jtf-container';
        container.innerHTML = `
            <div class="jtf-header">
                <span class="jtf-title">Le tir aux fonctions</span>
                <div class="jtf-stats">
                    <span class="jtf-chip" data-role="streak" title="Cibles touchées du premier coup d'affilée">🔥 0</span>
                    <span class="jtf-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jtf-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jtf-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jtf-bar">
                <button class="jtf-lvl active" data-level="1">😊 Facile</button>
                <button class="jtf-lvl" data-level="2">😐 Moyen</button>
                <button class="jtf-lvl" data-level="3">😤 Difficile</button>
                <div class="jtf-progress" title="Questions de la tournée">
                    <span class="jtf-progress-label">Tir</span>
                    ${'<span class="jtf-pdot"></span>'.repeat(QUESTIONS_PER_ROUND)}
                </div>
            </div>

            <div class="jtf-board"><span class="jtf-board-label">Quelle est la fonction du groupe surligné ?</span><span data-role="sentence"></span></div>

            <div class="jtf-scene">
                <div class="jtf-awning"></div>
                <div class="jtf-bulbs">${'<i></i>'.repeat(14)}</div>
                <div class="jtf-shelf r1"></div>
                <div class="jtf-shelf r2"></div>
                <div class="jtf-targets"></div>
                <div class="jtf-overlay" data-role="win"><div class="jtf-card"></div></div>
            </div>

            <div class="jtf-talk">
                <div class="jtf-chef">🎪</div>
                <div class="jtf-msg"></div>
            </div>

            <div class="jtf-actions">
                <button class="jtf-btn" data-act="hint">💡 Indice</button>
                <button class="jtf-btn" data-act="freeze" title="Arrêter ou relancer le défilement des cibles">⏸️ Cibles fixes</button>
                <button class="jtf-btn jtf-btn-go" data-act="next" disabled>Question suivante ▶</button>
            </div>

            <div class="jtf-help">
                <h4>🎯 Comment jouer ?</h4>
                <p>Un groupe de mots est <b>surligné</b> dans la phrase. Vise la cible qui porte sa <b>fonction</b> et clique dessus !</p>
                <table>
                    <tr><td>Sujet</td><td>Qui est-ce qui + verbe ?</td></tr>
                    <tr><td>Verbe</td><td>Il change avec « hier » / « demain ».</td></tr>
                    <tr><td>COD</td><td>verbe + quoi ? / qui ? (sans préposition)</td></tr>
                    <tr><td>COI</td><td>verbe + à qui ? de quoi ? (avec à, de…)</td></tr>
                    <tr><td>CC</td><td>où ? quand ? comment ? — on peut le déplacer ou le supprimer</td></tr>
                    <tr><td>Attribut</td><td>après être, sembler, devenir, paraître, rester</td></tr>
                </table>
                <p>💡 L'indice fait tomber une mauvaise cible. ⏸️ « Cibles fixes » arrête le défilement.</p>
                <p style="margin:0">😊 Sujet / Verbe / COD · 😐 + COI et CC · 😤 CC de lieu, temps, manière et attribut. 10 tirs = une tournée !</p>
            </div>

            <div class="jtf-confetti"></div>

            <div class="jtf-rh jtf-rh-nw" data-dir="nw"></div>
            <div class="jtf-rh jtf-rh-n"  data-dir="n"></div>
            <div class="jtf-rh jtf-rh-ne" data-dir="ne"></div>
            <div class="jtf-rh jtf-rh-e"  data-dir="e"></div>
            <div class="jtf-rh jtf-rh-se" data-dir="se"></div>
            <div class="jtf-rh jtf-rh-s"  data-dir="s"></div>
            <div class="jtf-rh jtf-rh-sw" data-dir="sw"></div>
            <div class="jtf-rh jtf-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const scene     = $('.jtf-scene');
        const targetsEl = $('.jtf-targets');
        const sentEl    = $('[data-role="sentence"]');
        const msg       = $('.jtf-msg');
        const chef      = $('.jtf-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jtf-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jtf-help');
        const confetti  = $('.jtf-confetti');
        const lvlBtns   = container.querySelectorAll('.jtf-lvl');
        const pdots     = container.querySelectorAll('.jtf-pdot');
        const hintBtn   = $('[data-act="hint"]');
        const freezeBtn = $('[data-act="freeze"]');
        const nextBtn   = $('[data-act="next"]');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let parts = [];              // phrase découpée
        let askIdx = -1;             // index (dans parts) du groupe demandé
        let answerLabel = '';        // étiquette attendue
        let targets = [];            // { el, label, x, row }
        let answered = false;
        let errors = 0, hints = 0;
        let qNo = 1;
        let results = [];
        let score = 0, streak = 0;
        let usedKeys = [];
        let soundOn = true;
        let frozen = false;
        let rafId = null, lastT = 0;

        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };
        const isFull = () => container.classList.contains('wf-fullboard');

        // ── Échelle proportionnelle (+ plein écran sans défilement) ────────
        const BASE_W = 680;
        const FLOW = ['.jtf-header', '.jtf-bar', '.jtf-board', '.jtf-scene', '.jtf-talk', '.jtf-actions'];
        function applyScale() {
            if (isFull()) { fitFullboard(); return; }
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jtf-s', sc.toFixed(4));
        }
        function contentHeightAt(sc) {
            container.style.setProperty('--jtf-s', sc.toFixed(4));
            const blocks = FLOW.map(sel => container.querySelector(':scope > ' + sel)).filter(Boolean);
            let h = 0;
            blocks.forEach(b => { h += Math.max(b.offsetHeight, b.scrollHeight); });
            const cs = getComputedStyle(container);
            h += (parseFloat(cs.rowGap) || 0) * (blocks.length - 1);
            h += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
            return h;
        }
        function fitFullboard() {
            const cs0 = getComputedStyle(container);
            const availW = container.clientWidth - parseFloat(cs0.paddingLeft) - parseFloat(cs0.paddingRight);
            const availH = container.clientHeight;
            if (!availW || !availH) return;
            let sc = Math.min(3, availW / BASE_W);
            for (let k = 0; k < 3; k++) {
                const h = contentHeightAt(sc);
                if (h <= availH) break;
                sc = Math.max(0.5, sc * (availH / h) * 0.98);
            }
            container.style.setProperty('--jtf-s', sc.toFixed(4));
        }
        const _onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', _onWinResize); return; }
            if (isFull()) fitFullboard();
        };
        window.addEventListener('resize', _onWinResize);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { if (widget.isConnected) applyScale(); });
        }

        // ── Forain ─────────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jtf-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
            if (isFull()) fitFullboard();
        }

        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.classList.toggle('done', results[i] === 'done');
                d.classList.toggle('miss', results[i] === 'miss');
                d.classList.toggle('current', i === qNo - 1 && !results[i]);
            });
        }

        // ── Phrase ─────────────────────────────────────────────────────────
        function renderSentence(reveal) {
            const map = JTF_LEVELS[level].map;
            sentEl.innerHTML = parts.map((p, i) => {
                if (!p.tag) return esc(p.text);
                const lab = map[p.tag];
                const isT = i === askIdx;
                const cls = 'jtf-grp' + (isT ? ' target' + (reveal ? ' solved' : ' wait') : '');
                const tag = reveal && lab ? `<span class="jtf-tag">${esc(lab)}</span>` : '';
                return `<span class="${cls}">${esc(p.text)}${tag}</span>`;
            }).join('');
        }

        // ── Cibles ─────────────────────────────────────────────────────────
        function buildTargets() {
            targetsEl.innerHTML = '';
            const labels = shuffle(JTF_LEVELS[level].labels);
            const n = labels.length;
            const row1 = Math.ceil(n / 2);
            targets = labels.map((label, i) => {
                const row = i < row1 ? 0 : 1;
                const k = row === 0 ? i : i - row1;
                const count = row === 0 ? row1 : n - row1;
                const span = 124 / count;
                const el = document.createElement('button');
                el.className = 'jtf-target';
                el.innerHTML = `<span class="jtf-disc"></span><span class="jtf-stick"></span><span class="jtf-plaque">${esc(label)}</span>`;
                el.style.top = row === 0 ? '56%' : '93%';
                const t = { el, label, row, k, count, x: evenX(k, count, row) };
                el.addEventListener('click', (e) => { e.stopPropagation(); shoot(t, e); });
                targetsEl.appendChild(el);
                return t;
            });
            placeTargets();
        }
        // Position régulière bien visible (en % de la largeur du stand)
        function evenX(k, count, row) { return (k + 0.5) * 100 / count; }
        function snapTargets() {
            targets.forEach(t => {
                t.x = evenX(t.k, t.count, t.row);
                t.el.classList.add('snap');
                setTimeout(() => t.el.classList.remove('snap'), 500);
            });
            placeTargets();
        }
        function placeTargets() { targets.forEach(t => { t.el.style.left = t.x.toFixed(2) + '%'; }); }

        function loop(now) {
            if (!widget.isConnected) return;
            const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0;
            lastT = now;
            const moving = !frozen && !answered && !winLayer.classList.contains('show');
            if (moving && dt) {
                const sp = JTF_LEVELS[level].speed;
                targets.forEach(t => {
                    if (t.el.classList.contains('fallen')) return;
                    t.x += (t.row === 0 ? 1 : -1) * sp * dt;
                    if (t.x > 112) t.x -= 124;
                    if (t.x < -12) t.x += 124;
                });
                placeTargets();
            }
            rafId = requestAnimationFrame(loop);
        }

        // ── Question ───────────────────────────────────────────────────────
        function pickQuestion() {
            const cfg = JTF_LEVELS[level];
            const pool = JTF_PHRASES.filter(p => cfg.phrases.includes(p[0]));
            const cands = [];
            pool.forEach((p, pi) => {
                parsePhrase(p[1]).forEach((g, gi) => {
                    if (!g.tag || !cfg.map[g.tag]) return;
                    const w = (g.tag === 'S' || g.tag === 'V') ? 1 : 2;   // un peu plus de compléments
                    for (let k = 0; k < w; k++) cands.push({ key: p[1] + '#' + gi, markup: p[1], gi });
                });
            });
            let free = cands.filter(c => !usedKeys.includes(c.key));
            if (!free.length) { usedKeys = []; free = cands; }
            // Évite deux fois de suite la même phrase
            const lastMarkup = usedKeys.length ? usedKeys[usedKeys.length - 1].split('#')[0] : null;
            const notSame = free.filter(c => c.markup !== lastMarkup);
            const c = rnd(notSame.length ? notSame : free);
            usedKeys.push(c.key);
            return c;
        }

        function loadQuestion() {
            const q = pickQuestion();
            parts = parsePhrase(q.markup);
            askIdx = q.gi;
            answerLabel = JTF_LEVELS[level].map[parts[askIdx].tag];
            answered = false; errors = 0; hints = 0;
            winLayer.classList.remove('show');
            scene.classList.remove('locked');
            buildTargets();
            renderSentence(false);
            nextBtn.disabled = true;
            hintBtn.disabled = false;
            updateStats(false);
            const intro = {
                1: 'Sujet, verbe ou COD ? Vise la bonne cible !',
                2: 'Sujet, verbe, COD, COI ou complément circonstanciel ? À toi de viser !',
                3: 'Attention aux détails : quel genre de CC ? Attribut ou COD ?'
            };
            say(`🎯 Tir ${qNo} sur ${QUESTIONS_PER_ROUND}. ${intro[level]}`);
        }

        function newRound() {
            qNo = 1; results = []; usedKeys = [];
            loadQuestion();
        }

        // ── Tir ────────────────────────────────────────────────────────────
        function effect(e, t) {
            const r = scene.getBoundingClientRect();
            const x = e && e.clientX ? e.clientX - r.left : t.el.offsetLeft;
            const y = e && e.clientY ? e.clientY - r.top  : t.el.offsetTop;
            const pow = document.createElement('span');
            pow.className = 'jtf-pow'; pow.textContent = '💥';
            pow.style.left = x + 'px'; pow.style.top = y + 'px';
            scene.appendChild(pow);
            setTimeout(() => pow.remove(), 500);
            // impact sur la cible (coordonnées locales à la cible)
            const tr = t.el.getBoundingClientRect();
            if (e && e.clientX) {
                const hole = document.createElement('span');
                hole.className = 'jtf-hole';
                hole.style.left = (e.clientX - tr.left) + 'px';
                hole.style.top  = (e.clientY - tr.top)  + 'px';
                t.el.appendChild(hole);
            }
        }

        function shoot(t, e) {
            if (answered || winLayer.classList.contains('show') || t.el.classList.contains('fallen')) return;
            sfx('shot');
            effect(e, t);
            const tag = parts[askIdx].tag;
            const g = parts[askIdx].text;
            if (t.label === answerLabel) {
                answered = true;
                scene.classList.add('locked');
                t.el.classList.add('ok');
                targets.forEach(o => { if (o !== t && !o.el.classList.contains('fallen')) o.el.classList.add('dim'); });
                sfx('good');
                renderSentence(true);
                const perfect = errors === 0 && hints === 0;
                const pts = Math.max(2, 10 - errors * 3 - hints * 2);
                streak = perfect ? streak + 1 : 0;
                const bonus = streak >= 3 ? 2 : 0;
                score += pts + bonus;
                results[qNo - 1] = perfect ? 'done' : 'miss';
                updateStats(true);
                say(`🎉 ${rnd(['En plein dans le mille', 'Touché', 'Bravo', 'Quel tireur', 'Bien visé'])} ! ${explain(tag, g, parts)} <b>+${pts + bonus}</b>`, 'good');
                hintBtn.disabled = true;
                nextBtn.disabled = false;
                nextBtn.textContent = qNo >= QUESTIONS_PER_ROUND ? '🏁 Fin de la tournée' : 'Question suivante ▶';
            } else {
                errors++;
                t.el.classList.remove('ko'); void t.el.offsetWidth; t.el.classList.add('ko');
                sfx('error');
                setTimeout(() => { t.el.classList.remove('ko'); t.el.classList.add('fallen'); sfx('drop'); }, 420);
                const tips = errors === 1
                    ? 'Pose-toi les bonnes questions : <b>qui est-ce qui… ?</b> <b>… quoi ?</b> <b>… à qui ?</b> <b>où ? quand ? comment ?</b>'
                    : '💡 ' + METHOD[tag];
                say(`🚫 Raté ! « ${esc(g)} » n'est pas « ${esc(t.label)} ». ${tips}`, 'bad');
            }
        }

        // ── Indice : fait tomber une mauvaise cible ────────────────────────
        function giveHint() {
            if (answered) return;
            const wrong = targets.filter(t => t.label !== answerLabel && !t.el.classList.contains('fallen'));
            if (wrong.length <= 1) {
                hintBtn.disabled = true;
                say('💡 ' + METHOD[parts[askIdx].tag]);
                return;
            }
            hints++;
            const t = rnd(wrong);
            t.el.classList.add('fallen');
            sfx('drop');
            say(`💡 Ce n'est pas « ${esc(t.label)} » : cette cible est tombée. ${METHOD[parts[askIdx].tag]}`);
            if (wrong.length - 1 <= 1) hintBtn.disabled = true;
        }

        function setFrozen(on) {
            frozen = on;
            freezeBtn.classList.toggle('on', frozen);
            freezeBtn.textContent = frozen ? '▶️ Cibles mobiles' : '⏸️ Cibles fixes';
            if (frozen && targets.length) snapTargets();
        }

        // ── Suite / fin de tournée ─────────────────────────────────────────
        function next() {
            if (!answered) return;
            if (qNo >= QUESTIONS_PER_ROUND) { finalScreen(); return; }
            qNo++;
            loadQuestion();
        }

        function finalScreen() {
            const firstTry = results.filter(r => r === 'done').length;
            const st = firstTry >= 9 ? 3 : firstTry >= 6 ? 2 : 1;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : '🥉';
            const title = st === 3 ? 'Tireur d\'élite !' : st === 2 ? 'Très bon tireur !' : 'Tournée terminée !';
            winCard.innerHTML = `
                <div class="jtf-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jtf-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${firstTry} cible${firstTry > 1 ? 's' : ''} sur ${QUESTIONS_PER_ROUND} touchée${firstTry > 1 ? 's' : ''} du premier coup</p>
                <button class="jtf-btn jtf-btn-go" data-act="again">🔄 Nouvelle tournée</button>`;
            winLayer.classList.add('show');
            nextBtn.disabled = true;
            sfx('win');
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 250 * n); });
            party();
            say(`🏁 Tournée terminée : ${firstTry}/${QUESTIONS_PER_ROUND} du premier coup ! Rejoue ou essaie un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
            if (typeof saveBoard === 'function') saveBoard();
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

        // ── Niveaux et boutons ─────────────────────────────────────────────
        function setLevel(l) {
            level = l;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === l));
            streak = 0;
            newRound();
            if (typeof saveBoard === 'function') saveBoard();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        hintBtn.addEventListener('click', giveHint);
        freezeBtn.addEventListener('click', () => { setFrozen(!frozen); if (typeof saveBoard === 'function') saveBoard(); });
        nextBtn.addEventListener('click', next);
        widget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && answered) { e.preventDefault(); next(); }
        });

        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundOn = !soundOn;
            soundBtn.textContent = soundOn ? '🔊' : '🔇';
            soundBtn.title = soundOn ? 'Couper le son' : 'Activer le son';
            if (typeof saveBoard === 'function') saveBoard();
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
        function setMax(on) {
            _isMax = on;
            if (_isMax) { _savedW = container.style.width; container.classList.add('wf-fullboard'); }
            else { container.classList.remove('wf-fullboard'); if (_savedW) container.style.width = _savedW; }
            requestAnimationFrame(applyScale);
        }
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) setMax(false);
            window._wfMiniBarCollapse(widget, '🎯 Le tir aux fonctions', { onExpand: applyScale });
        });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            setMax(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            cancelAnimationFrame(rafId);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jtf-rh[data-dir]').forEach(handle => {
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

        // ── Sauvegarde / restauration (appelées par save-load.js) ──────────
        widget._jtfGetData = function () {
            return {
                level, score, streak, soundOn, frozen,
                containerW: _isMax ? (_savedW || null) : (container.style.width || null),
                containerH: _isMax ? null : (container.style.height || null),
                fullboard: _isMax
            };
        };

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, .jtf-scene, .jtf-rh, .jtf-help')) {
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
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        if (restoring) {
            if (savedData.containerW) container.style.width  = savedData.containerW;
            if (savedData.containerH) container.style.height = savedData.containerH;
            if (savedData.soundOn === false) { soundOn = false; soundBtn.textContent = '🔇'; soundBtn.title = 'Activer le son'; }
            if (savedData.frozen) setFrozen(true);
        }

        rafId = requestAnimationFrame(loop);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            applyScale();
            if (restoring) {
                const lv = [1, 2, 3].includes(+savedData.level) ? +savedData.level : 1;
                score  = +savedData.score  || 0;
                streak = +savedData.streak || 0;
                level = lv;
                lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === lv));
                newRound();
                if (savedData.fullboard) setMax(true);
            } else {
                setLevel(1);
                if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                    wfMax.click();
                } else {
                    const curW = window.innerWidth;
                    widget.style.left = '100px';
                    widget.dataset.leftPercent = (100 / curW) * 100;
                }
            }
        }));

        widget._setLevel = setLevel;
        if (!restoring && typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function hook(orig) {
        return function (type) {
            if (type === 'jeu-tir-fonctions') return window.createJeuTirFonctionsWidget();
            return orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') {
        window.createWidget = hook(window.createWidget);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.createWidget === 'function') window.createWidget = hook(window.createWidget);
        });
    }

})();
