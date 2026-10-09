// =========================================================================
// JEU « LE TIR AUX NATURES » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Stand de tir de fête foraine : un mot est surligné dans une phrase.
// L'élève tire sur la cible qui porte sa nature (classe grammaticale).
// Les cibles défilent sur deux étagères (on peut les arrêter).
// 10 tirs par tournée.
// 3 niveaux :
//   😊 facile    : déterminant, nom, adjectif, verbe
//   😐 moyen     : + pronom, mot invariable
//   😤 difficile : adverbe, préposition, conjonction distingués
//                  + pièges (la / le / les / leur, marche nom ou verbe…)
//
// Ouverture   : createWidget('jeu-tir-natures')
// Sauvegarde  : widget._jtnGetData()  → jtnData dans save-load.js
// Restauration: createJeuTirNaturesWidget(jtnData)
// 📌 Intégration dans index.html :
//   1. <script src="widget-jeu-tir-natures.js"></script> (après widgets.js)
//   2. Carte du panneau Jeux (rubrique Jeux de français) :
//      onclick="createWidget('jeu-tir-natures');toggleJeuxPanel()"
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'jeu-tir-natures';

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

    // ── CSS du jeu (préfixe jtn-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-tir-natures-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tir-natures-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-tir-natures"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jtn-container {
            --jtn-s: 1;
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
            gap: calc(10px * var(--jtn-s));
            padding: calc(12px * var(--jtn-s)) calc(14px * var(--jtn-s)) calc(14px * var(--jtn-s));
            border-radius: calc(24px * var(--jtn-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jtn-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jtn-container > .jtn-header,
        .jtn-container > .jtn-bar,
        .jtn-container > .jtn-board,
        .jtn-container > .jtn-scene,
        .jtn-container > .jtn-talk,
        .jtn-container > .jtn-actions { flex-shrink: 0; }
        .jtn-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
            justify-content: center;
            overflow: hidden !important;
        }
        .jtn-container.wf-fullboard > .jtn-header,
        .jtn-container.wf-fullboard > .jtn-bar,
        .jtn-container.wf-fullboard > .jtn-board,
        .jtn-container.wf-fullboard > .jtn-scene,
        .jtn-container.wf-fullboard > .jtn-talk,
        .jtn-container.wf-fullboard > .jtn-actions {
            width: 100%; box-sizing: border-box;
            max-width: calc(760px * var(--jtn-s));
            margin-left: auto; margin-right: auto;
        }
        .jtn-container.wf-fullboard > .jtn-scene { aspect-ratio: auto; height: calc(270px * var(--jtn-s)); }
        .jtn-container.wf-fullboard .jtn-help { right: 50%; transform: translateX(50%); }

        /* ── En-tête ── */
        .jtn-header { display: flex; align-items: center; gap: calc(10px * var(--jtn-s)); cursor: move; flex-wrap: wrap; }
        .jtn-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jtn-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jtn-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1.15;
        }
        .jtn-stats { display: flex; gap: calc(6px * var(--jtn-s)); align-items: center; margin-left: auto; }
        .jtn-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jtn-s)) calc(10px * var(--jtn-s));
            font-weight: 900; font-size: calc(14px * var(--jtn-s)); white-space: nowrap;
        }
        .jtn-chip.hot { background: #FF7A1A; }
        @keyframes jtn-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jtn-chip.bump { animation: jtn-bump .4s ease; }
        .jtn-icon-btn {
            width: calc(26px * var(--jtn-s)); height: calc(26px * var(--jtn-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jtn-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jtn-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + progression ── */
        .jtn-bar { display: flex; align-items: center; gap: calc(6px * var(--jtn-s)); flex-wrap: wrap; }
        .jtn-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtn-s));
            padding: calc(5px * var(--jtn-s)) calc(12px * var(--jtn-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jtn-lvl:hover { background: rgba(255,255,255,0.1); }
        .jtn-lvl:active { transform: scale(0.95); }
        .jtn-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jtn-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jtn-s)); align-items: center; }
        .jtn-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jtn-s)); margin-right: 2px; }
        .jtn-pdot { width: calc(14px * var(--jtn-s)); height: calc(14px * var(--jtn-s)); border-radius: 50%; background: rgba(255,255,255,0.15); }
        .jtn-pdot.done { background: var(--vert); }
        .jtn-pdot.miss { background: #FF9F1A; }
        .jtn-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Tableau (la phrase) ── */
        .jtn-board {
            background: #14284D;
            border: calc(4px * var(--jtn-s)) solid #0B1830;
            border-radius: calc(14px * var(--jtn-s));
            padding: calc(10px * var(--jtn-s)) calc(14px * var(--jtn-s)) calc(12px * var(--jtn-s));
            color: #fff; text-align: center;
            font-weight: 900; font-size: calc(25px * var(--jtn-s)); line-height: 2;
            box-shadow: inset 0 calc(-5px * var(--jtn-s)) 0 rgba(0,0,0,0.25);
        }
        .jtn-board-label {
            display: block; font-size: calc(11px * var(--jtn-s)); letter-spacing: 2px;
            color: var(--or); text-transform: uppercase; margin-bottom: calc(2px * var(--jtn-s));
        }
        .jtn-word {
            position: relative; display: inline; border-radius: calc(6px * var(--jtn-s));
            padding: 0 calc(4px * var(--jtn-s));
            background: var(--marqueur); color: var(--encre);
            box-shadow: 0 calc(3px * var(--jtn-s)) 0 #B86A00;
        }
        @keyframes jtn-glow { 0%,100% { box-shadow: 0 calc(3px * var(--jtn-s)) 0 #B86A00; } 50% { box-shadow: 0 calc(3px * var(--jtn-s)) 0 #B86A00, 0 0 0 calc(4px * var(--jtn-s)) rgba(255,159,26,0.45); } }
        .jtn-word.wait { animation: jtn-glow 1.4s ease-in-out infinite; }
        .jtn-word.solved { background: var(--nc, var(--vert)); color: #fff; box-shadow: 0 calc(3px * var(--jtn-s)) 0 rgba(0,0,0,0.3); }
        .jtn-tag {
            position: absolute; left: 50%; top: 100%; transform: translate(-50%, -30%);
            font-size: 0.42em; line-height: 1.2; letter-spacing: 0.5px;
            color: #7CF0AE; text-transform: uppercase; white-space: nowrap;
            pointer-events: none;
        }
        .jtn-target.snap { transition: left .45s ease; }

        /* ── Stand de tir ── */
        .jtn-scene {
            position: relative;
            border-radius: calc(18px * var(--jtn-s));
            overflow: hidden;
            aspect-ratio: 680 / 270;
            background:
                repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px calc(46px * var(--jtn-s))),
                linear-gradient(180deg, #0E8A94 0%, #075B63 100%);
            cursor: crosshair;
        }
        .jtn-scene.locked { cursor: default; }
        .jtn-awning {
            position: absolute; left: 0; right: 0; top: 0; height: 14%;
            background: repeating-linear-gradient(90deg, #3BA7FF 0 calc(34px * var(--jtn-s)), #FFF7E6 calc(34px * var(--jtn-s)) calc(68px * var(--jtn-s)));
            box-shadow: 0 calc(4px * var(--jtn-s)) 0 rgba(0,0,0,0.2);
        }
        .jtn-awning::after {
            content: ''; position: absolute; left: 0; right: 0; bottom: calc(-9px * var(--jtn-s)); height: calc(10px * var(--jtn-s));
            background: radial-gradient(circle at calc(17px * var(--jtn-s)) 0, #3BA7FF calc(10px * var(--jtn-s)), transparent calc(11px * var(--jtn-s))) 0 0 / calc(68px * var(--jtn-s)) 100% repeat-x,
                        radial-gradient(circle at calc(51px * var(--jtn-s)) 0, #FFF7E6 calc(10px * var(--jtn-s)), transparent calc(11px * var(--jtn-s))) 0 0 / calc(68px * var(--jtn-s)) 100% repeat-x;
        }
        .jtn-bulbs { position: absolute; left: 2%; right: 2%; top: 18%; display: flex; justify-content: space-between; pointer-events: none; }
        .jtn-bulbs i { width: calc(8px * var(--jtn-s)); height: calc(8px * var(--jtn-s)); border-radius: 50%; background: #FFE680; box-shadow: 0 0 calc(8px * var(--jtn-s)) #FFD84D; }
        @keyframes jtn-blink { 50% { opacity: 0.35; } }
        .jtn-bulbs i:nth-child(odd) { animation: jtn-blink 1.2s steps(1) infinite; }
        .jtn-shelf {
            position: absolute; left: 0; right: 0; height: calc(12px * var(--jtn-s));
            background: linear-gradient(180deg, #E8B36A, #B97A35);
            box-shadow: 0 calc(4px * var(--jtn-s)) 0 rgba(0,0,0,0.25);
        }
        .jtn-shelf.r1 { top: 56%; }
        .jtn-shelf.r2 { top: 93%; }

        .jtn-target {
            position: absolute; transform: translate(-50%, -100%);
            border: none; background: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; align-items: center;
            cursor: crosshair; font-family: inherit;
            width: calc(126px * var(--jtn-s));
            transform-origin: 50% 100%;
        }
        .jtn-scene.locked .jtn-target { cursor: default; }
        .jtn-disc {
            width: calc(50px * var(--jtn-s)); height: calc(50px * var(--jtn-s)); border-radius: 50%;
            background: radial-gradient(circle, #FF4F5E 0 18%, #fff 19% 36%, #FF4F5E 37% 54%, #fff 55% 72%, #FF4F5E 73% 100%);
            border: calc(3px * var(--jtn-s)) solid #2A1F4A; box-sizing: border-box;
            transition: transform .25s;
        }
        .jtn-plaque {
            margin-top: calc(-4px * var(--jtn-s));
            background: var(--creme); color: var(--nc, var(--encre));
            border: calc(3px * var(--jtn-s)) solid #2A1F4A; border-radius: calc(8px * var(--jtn-s));
            box-shadow: inset 0 calc(-4px * var(--jtn-s)) 0 var(--nc, transparent);
            padding: calc(2px * var(--jtn-s)) calc(6px * var(--jtn-s)) calc(5px * var(--jtn-s));
            font-weight: 900; font-size: calc(14px * var(--jtn-s)); line-height: 1.2;
            white-space: nowrap; max-width: 100%; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis;
        }
        .jtn-stick { width: calc(6px * var(--jtn-s)); height: calc(12px * var(--jtn-s)); background: #2A1F4A; }
        .jtn-target:hover .jtn-disc { transform: scale(1.08); }
        .jtn-scene.locked .jtn-target:hover .jtn-disc { transform: none; }
        @keyframes jtn-shake { 0%,100% { transform: translate(-50%,-100%); } 20% { transform: translate(calc(-50% - 6px),-100%) rotate(-6deg); } 60% { transform: translate(calc(-50% + 6px),-100%) rotate(6deg); } }
        .jtn-target.ko { animation: jtn-shake .4s ease; }
        .jtn-target.ko .jtn-plaque { background: #FFD3D8; }
        .jtn-target.fallen { opacity: 0.35; pointer-events: none; transform: translate(-50%,-100%) rotateX(70deg); transition: transform .35s, opacity .35s; }
        @keyframes jtn-spin { 0% { transform: translate(-50%,-100%) rotateY(0); } 100% { transform: translate(-50%,-100%) rotateY(720deg); } }
        .jtn-target.ok { animation: jtn-spin .7s ease-out; }
        .jtn-target.ok .jtn-disc { background: radial-gradient(circle, #2FBF71 0 30%, #fff 31% 50%, #2FBF71 51% 100%); }
        .jtn-target.ok .jtn-plaque { background: var(--nc, var(--vert)); color: #fff; }
        .jtn-target.dim { opacity: 0.4; }
        .jtn-hole {
            position: absolute; width: calc(12px * var(--jtn-s)); height: calc(12px * var(--jtn-s)); border-radius: 50%;
            background: #1A1330; box-shadow: 0 0 0 calc(2px * var(--jtn-s)) rgba(0,0,0,0.25);
            transform: translate(-50%, -50%); pointer-events: none;
        }
        .jtn-pow {
            position: absolute; transform: translate(-50%, -50%); pointer-events: none; z-index: 5;
            font-size: calc(34px * var(--jtn-s)); line-height: 1;
            animation: jtn-pow .45s ease-out forwards;
        }
        @keyframes jtn-pow { 0% { transform: translate(-50%,-50%) scale(0.3); opacity: 1; } 100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; } }

        /* Couleurs des natures (code couleur commun avec la Battle nature des mots) */
        [data-nat="Déterminant"]    { --nc: #7B4FE0; }
        [data-nat="Nom"]            { --nc: #D93A48; }
        [data-nat="Adjectif"]       { --nc: #1E9E5A; }
        [data-nat="Pronom"]         { --nc: #E07A10; }
        [data-nat="Verbe"]          { --nc: #1F6FB5; }
        [data-nat="Mot invariable"] { --nc: #6B6B80; }
        [data-nat="Adverbe"]        { --nc: #6B6B80; }
        [data-nat="Préposition"]    { --nc: #8A5A2B; }
        [data-nat="Conjonction"]    { --nc: #C23E8F; }

        /* ── Actions ── */
        .jtn-actions { display: flex; gap: calc(8px * var(--jtn-s)); justify-content: center; flex-wrap: wrap; }
        .jtn-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jtn-s));
            padding: calc(8px * var(--jtn-s)) calc(14px * var(--jtn-s));
            border-radius: calc(14px * var(--jtn-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jtn-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jtn-btn:hover { filter: brightness(1.05); }
        .jtn-btn:active { transform: translateY(calc(4px * var(--jtn-s))); box-shadow: 0 calc(1px * var(--jtn-s)) 0 #B9B2D6; }
        .jtn-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jtn-btn.on { background: var(--or); }
        .jtn-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jtn-s));
            padding: calc(8px * var(--jtn-s)) calc(22px * var(--jtn-s));
            box-shadow: 0 calc(5px * var(--jtn-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jtn-btn-go:active { box-shadow: 0 calc(1px * var(--jtn-s)) 0 #1C8A4F; }
        .jtn-btn:focus-visible, .jtn-lvl:focus-visible, .jtn-target:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Forain ── */
        .jtn-talk { display: flex; align-items: center; gap: calc(10px * var(--jtn-s)); }
        .jtn-chef {
            width: calc(44px * var(--jtn-s)); height: calc(44px * var(--jtn-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jtn-s));
            box-shadow: 0 calc(3px * var(--jtn-s)) 0 #B3840B;
        }
        @keyframes jtn-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jtn-s))) rotate(-8deg); } }
        .jtn-chef.hop { animation: jtn-hop .4s ease; }
        .jtn-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jtn-s));
            padding: calc(8px * var(--jtn-s)) calc(12px * var(--jtn-s));
            font-weight: 700; font-size: calc(15px * var(--jtn-s)); line-height: 1.35;
            min-height: calc(22px * var(--jtn-s));
            border-left: calc(6px * var(--jtn-s)) solid var(--or);
        }
        .jtn-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jtn-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jtn-msg b { font-weight: 900; }
        .jtn-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; }

        /* ── Écrans de fin ── */
        .jtn-overlay { position: absolute; inset: 0; z-index: 10; display: none; align-items: center; justify-content: center; background: rgba(42,31,74,0.35); }
        .jtn-overlay.show { display: flex; }
        @keyframes jtn-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jtn-card {
            background: #fff; border-radius: calc(18px * var(--jtn-s));
            padding: calc(12px * var(--jtn-s)) calc(22px * var(--jtn-s)) calc(14px * var(--jtn-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jtn-s)) 0 #B9B2D6;
            animation: jtn-pop .35s ease-out; max-width: 90%; cursor: default;
        }
        .jtn-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jtn-s)); color: var(--encre); }
        .jtn-card p { margin: calc(4px * var(--jtn-s)) 0 calc(8px * var(--jtn-s)); font-weight: 800; font-size: calc(14px * var(--jtn-s)); }
        .jtn-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jtn-s)); margin: calc(4px * var(--jtn-s)) 0; }
        .jtn-bigstars span { font-size: calc(34px * var(--jtn-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jtn-bigstars span.on { opacity: 1; filter: none; animation: jtn-pop .35s ease-out both; }
        .jtn-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jtn-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jtn-medal { font-size: calc(56px * var(--jtn-s)); line-height: 1; animation: jtn-pop .5s ease-out; }

        /* ── Aide ── */
        .jtn-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jtn-help.show { display: block; }
        .jtn-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jtn-help p { margin: 0 0 7px; }
        .jtn-help table { border-collapse: collapse; width: 100%; margin: 0 0 7px; font-size: 12px; }
        .jtn-help td { padding: 2px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
        .jtn-help td:first-child { font-weight: 900; white-space: nowrap; color: var(--nc, #B86A00); }

        /* ── Confettis ── */
        .jtn-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jtn-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jtn-fall 1.8s ease-in forwards; }
        @keyframes jtn-fall { to { transform: translateY(600px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jtn-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jtn-container:hover .jtn-rh { opacity: 1; }
        .jtn-container.wf-fullboard .jtn-rh { display: none; }
        .jtn-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jtn-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jtn-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jtn-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jtn-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jtn-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jtn-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jtn-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jtn-container *, .jtn-container *::before, .jtn-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUE DE PHRASES
    // Chaque mot analysable est noté {NATURE|mot}. Natures :
    //   D déterminant · N nom · A adjectif · P pronom · V verbe
    //   ADV adverbe · PREP préposition · CONJ conjonction
    // Un « * » après la nature signale un piège (mot qui change de nature
    // selon la phrase : la, le, les, leur, marche, dîner, porte…).
    // Le 1er nombre est la difficulté de la phrase (1, 2 ou 3).
    // =========================================================================
    const JTN_PHRASES = [
        [1, '{D|Le} {N|chat} {A|noir} {V|dort}.'],
        [1, '{D|Les} {N|enfants} {V|mangent} {D|une} {N|tarte}.'],
        [1, '{D|Ma} {A|petite} {N|sœur} {V|dessine} {D|un} {N|dragon}.'],
        [1, '{D|Ce} {N|gâteau} {V|est} {A|délicieux}.'],
        [1, '{D|Mon} {N|père} {V|lave} {D|la} {A|vieille} {N|voiture}.'],
        [1, '{D|Trois} {N|oiseaux} {V|chantent}.'],
        [1, '{N|Léa} {V|lit} {D|un} {A|gros} {N|livre}.'],
        [1, '{D|Cette} {N|maison} {V|semble} {A|immense}.'],
        [1, '{D|Le} {N|boulanger} {V|vend} {D|du} {N|pain} {A|frais}.'],
        [1, '{D|Ces} {A|jolies} {N|roses} {V|fleurissent}.'],
        [1, '{D|Notre} {N|chien} {V|ronge} {D|un} {N|os}.'],
        [1, '{N|Tom} {V|porte} {D|un} {N|pull} {A|rouge}.'],
        [1, '{D|La} {N|mer} {V|devient} {A|calme}.'],
        [1, '{D|Mes} {N|parents} {V|achètent} {D|une} {A|grande} {N|table}.'],
        [1, '{D|Chaque} {N|élève} {V|range} {D|son} {N|cahier}.'],
        [1, '{D|Le} {A|vieux} {N|pêcheur} {V|répare} {D|son} {N|filet}.'],
        [1, '{D|Ses} {N|chaussures} {V|sont} {A|sales}.'],
        [1, '{D|Un} {A|joli} {N|papillon} {V|vole}.'],

        [2, '{P|Il} {V|court} {ADV|très} {ADV|vite}.'],
        [2, '{P|Nous} {V|jouons} {PREP|dans} {D|le} {N|jardin}.'],
        [2, '{D|Le} {N|chat} {V|dort} {PREP|sous} {D|la} {N|table}.'],
        [2, '{N|Tom} {CONJ|et} {N|Léa} {V|regardent} {D|un} {N|film}.'],
        [2, '{P|Elle} {V|chante} {ADV|joyeusement}.'],
        [2, '{P|Je} {V|range} {D|ma} {N|chambre} {ADV|aujourd\'hui}.'],
        [2, '{P|Tu} {V|veux} {D|du} {N|thé} {CONJ|ou} {D|du} {N|lait} ?'],
        [2, '{P|Ils} {V|partiront} {ADV|demain} {PREP|avec} {D|leurs} {N|cousins}.'],
        [2, '{P|On} {V|frappe} {PREP|à} {D|la} {N|porte}.'],
        [2, '{D|Le} {N|vent} {V|souffle} {ADV|fort}, {CONJ|mais} {D|le} {N|soleil} {V|brille}.'],
        [2, '{P|Vous} {V|êtes} {ADV|toujours} {A|souriants}.'],
        [2, '{D|Les} {N|abeilles} {V|volent} {PREP|vers} {D|la} {N|ruche}.'],
        [2, '{N|Marie} {P|lui} {V|donne} {D|un} {N|livre}.'],
        [2, '{P|Elles} {V|construisent} {D|une} {N|cabane} {PREP|derrière} {D|la} {N|maison}.'],
        [2, '{ADV|Hier}, {P|nous} {V|avons visité} {D|un} {A|beau} {N|château}.'],
        [2, '{D|Le} {N|bébé} {V|pleure} {CONJ|car} {P|il} {V|a} {N|faim}.'],
        [2, '{D|Le} {N|lion} {V|est} {ADV|trop} {A|dangereux}.'],
        [2, '{P|Il} {V|est parti} {PREP|sans} {D|son} {N|manteau}.'],

        [3, '{N|Tom} {P*|la} {V|regarde} {ADV|attentivement}.'],
        [3, '{D*|La} {N|voisine} {V|arrose} {D|les} {N|fleurs}.'],
        [3, '{P|Je} {V*|marche} {PREP|dans} {D|la} {N|forêt}.'],
        [3, '{P|Il} {V|a fait} {D|une} {A|longue} {N*|marche}.'],
        [3, 'Mes amis ? {P|Je} {P*|leur} {V|écris} {ADV|souvent}.'],
        [3, '{P|Il} {V|ramasse} {D*|leur} {N|ballon}.'],
        [3, '{D|Le} {N*|dîner} {V|est} {A|prêt}.'],
        [3, '{P|Nous} {V|allons} {V*|dîner} {ADV|ensemble}.'],
        [3, '{D|La} {N*|porte} {V|est} {A|ouverte}.'],
        [3, '{P|Il} {V*|porte} {D|un} {N|sac} {ADV|très} {A|lourd}.'],
        [3, '{D|Ce} {N|gâteau}, {N|Tom} {P*|le} {V|mange} {PREP|en} {D|une} {N|minute}.'],
        [3, '{D|Le} {N|chien} {P*|les} {V|suit} {ADV|partout}.'],
        [3, '{D|Ce} {N|pull} {A*|orange} {P|me} {V|plaît} {ADV|beaucoup}.'],
        [3, '{D|Le} {A*|premier} {N|coureur} {V|franchit} {D|la} {N|ligne}.'],
        [3, '{P|Il} {V|pleut}, {CONJ|donc} {P|nous} {V|restons} {PREP|chez} {P|nous}.'],
        [3, '{D|Le} {N|chat} {V|saute} {PREP|sur} {D|le} {N|lit}.'],
        [3, '{N|Julie} {V|travaille} {ADV|lentement} {CONJ|mais} {ADV|sérieusement}.'],
        [3, '{P|Celui-ci} {V|est} {ADV|plus} {A|grand}.'],
        [3, '{D|Le} {N|maître} {V|parle} {PREP|avec} {D|les} {N|parents}.'],
        [3, '{P|Je} {V|ne mange} {ADV|jamais} {PREP|de} {N|piment}.'],
        [3, '{ADV|Ensuite}, {P|nous} {V|rentrerons} {CONJ|et} {P|nous} {V|lirons}.'],
    ];

    // Étiquettes de cibles et correspondance des natures selon le niveau
    const JTN_LEVELS = {
        1: { labels: ['Déterminant', 'Nom', 'Adjectif', 'Verbe'],
             map: { D: 'Déterminant', N: 'Nom', A: 'Adjectif', V: 'Verbe' },
             phrases: [1], speed: 5 },
        2: { labels: ['Déterminant', 'Nom', 'Adjectif', 'Pronom', 'Verbe', 'Mot invariable'],
             map: { D: 'Déterminant', N: 'Nom', A: 'Adjectif', P: 'Pronom', V: 'Verbe', ADV: 'Mot invariable', PREP: 'Mot invariable', CONJ: 'Mot invariable' },
             phrases: [1, 2], speed: 6.5 },
        3: { labels: ['Déterminant', 'Nom', 'Adjectif', 'Pronom', 'Verbe', 'Adverbe', 'Préposition', 'Conjonction'],
             map: { D: 'Déterminant', N: 'Nom', A: 'Adjectif', P: 'Pronom', V: 'Verbe', ADV: 'Adverbe', PREP: 'Préposition', CONJ: 'Conjonction' },
             phrases: [2, 3], speed: 7.5 },
    };
    const UN = {
        'Déterminant': 'un déterminant', 'Nom': 'un nom', 'Adjectif': 'un adjectif', 'Pronom': 'un pronom',
        'Verbe': 'un verbe', 'Mot invariable': 'un mot invariable', 'Adverbe': 'un adverbe',
        'Préposition': 'une préposition', 'Conjonction': 'une conjonction'
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

    // Découpe « {D|Le} {N|chat} dort. » en morceaux texte / mots notés
    function parsePhrase(markup) {
        const parts = [];
        const re = /\{(\w+)(\*?)\|([^}]*)\}/g;
        let last = 0, m;
        while ((m = re.exec(markup))) {
            if (m.index > last) parts.push({ text: markup.slice(last, m.index) });
            parts.push({ tag: m[1], trap: m[2] === '*', text: m[3] });
            last = re.lastIndex;
        }
        if (last < markup.length) parts.push({ text: markup.slice(last) });
        return parts;
    }

    // Mot noté le plus proche (dir = +1 après, -1 avant)
    function findTag(parts, i, tag, dir) {
        for (let k = i + dir; k >= 0 && k < parts.length; k += dir) if (parts[k].tag === tag) return parts[k].text;
        return null;
    }
    function prevTagged(parts, i) {
        for (let k = i - 1; k >= 0; k--) if (parts[k].tag) return parts[k];
        return null;
    }

    // Explication de la nature du mot demandé
    function explain(parts, i, label) {
        const p = parts[i];
        const W = `« ${esc(p.text)} »`;
        const K = `<span class="k">${UN[label] || label}</span>`;
        const inv2 = label === 'Mot invariable';
        let t = '';
        switch (p.tag) {
            case 'D': {
                const n = findTag(parts, i, 'N', 1);
                t = `${W} est placé devant le nom${n ? ` « ${esc(n)} »` : ''} pour l'introduire : c'est ${K}.`;
                break;
            }
            case 'N': {
                const prev = prevTagged(parts, i);
                const proper = /^[A-ZÉÈÀÂ]/.test(p.text) && !(prev && (prev.tag === 'D' || prev.tag === 'A'));
                t = proper
                    ? `${W} est le nom d'une personne ou d'un lieu, avec une majuscule : c'est ${K} propre.`
                    : `${W} désigne une personne, un animal, une chose ou une idée ; on peut mettre « un » ou « le » devant : c'est ${K}.`;
                break;
            }
            case 'A': {
                const prev = prevTagged(parts, i);
                const attr = prev && (prev.tag === 'V' || (prev.tag === 'ADV' && findTag(parts, i, 'V', -1)));
                const v = findTag(parts, i, 'V', -1);
                if (attr && v) {
                    t = `Après le verbe « ${esc(v)} », ${W} dit comment est le sujet et s'accorde avec lui : c'est ${K}.`;
                } else {
                    const n = findTag(parts, i, 'N', 1) || findTag(parts, i, 'N', -1);
                    t = `${W} précise le nom${n ? ` « ${esc(n)} »` : ''} et s'accorde avec lui : c'est ${K}.`;
                }
                break;
            }
            case 'P': {
                const v = findTag(parts, i, 'V', 1);
                t = `${W} remplace un nom ou désigne une personne${v ? ` ; il accompagne le verbe « ${esc(v)} »` : ''} : c'est ${K}.`;
                break;
            }
            case 'V':
                t = `${W} exprime une action ou un état ; il se conjugue (il change si on dit « hier » ou « demain ») : c'est ${K}.`;
                break;
            case 'ADV':
                t = inv2 ? `${W} ne change jamais de forme : c'est ${K} (un adverbe).`
                         : `${W} ne change jamais de forme et précise un verbe, un adjectif ou toute la phrase : c'est ${K}.`;
                break;
            case 'PREP':
                t = `${W} ne change jamais de forme et introduit le groupe qui le suit : c'est ${K}${inv2 ? ' (une préposition)' : ''}.`;
                break;
            case 'CONJ':
                t = `${W} ne change jamais de forme et relie deux mots ou deux phrases : c'est ${K}${inv2 ? ' (une conjonction)' : ''}.`;
                break;
        }
        if (p.trap && TRAP_NOTE[p.tag]) t = `🪤 Piège déjoué ! ${t} ${TRAP_NOTE[p.tag]}`;
        return t;
    }
    const TRAP_NOTE = {
        D: 'Devant un verbe, ce même mot serait un pronom.',
        P: 'Devant un nom, ce même mot serait un déterminant.',
        N: 'Avec « je » ou « il » devant, ce même mot serait un verbe.',
        V: 'Avec « un » ou « le » devant, ce même mot serait un nom.',
        A: 'Ailleurs, ce même mot peut être un nom (« une orange », « le premier »).',
    };
    // Méthode pour une nature (sans donner la réponse)
    const METHOD = {
        D:    'Ce mot est-il juste devant un nom pour l\'introduire (le, un, mon, ces…) ?',
        N:    'Peux-tu mettre « un », « une » ou « le » devant ce mot ?',
        A:    'Ce mot précise-t-il un nom ? Change-t-il au féminin ou au pluriel avec lui ?',
        P:    'Ce mot remplace-t-il un nom ? Est-il placé devant un verbe (je, il, la, leur…) ?',
        V:    'Ce mot change-t-il si on dit « hier » ou « demain » ?',
        ADV:  'Ce mot change-t-il de forme ? Répond-il à <b>comment ? quand ? combien ?</b>',
        PREP: 'Ce petit mot invariable introduit-il un groupe (dans, sous, avec, pour, sans…) ?',
        CONJ: 'Ce petit mot relie-t-il deux mots ou deux phrases (mais, ou, et, donc, or, ni, car) ?',
    };

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jtnAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jtnAudio) _jtnAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtnAudio, t0 = ctx.currentTime + start;
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
            if (!_jtnAudio) _jtnAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtnAudio, len = Math.floor(ctx.sampleRate * dur);
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
    window.createJeuTirNaturesWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
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
        container.className = 'jtn-container';
        container.innerHTML = `
            <div class="jtn-header">
                <span class="jtn-title">Le tir aux natures</span>
                <div class="jtn-stats">
                    <span class="jtn-chip" data-role="streak" title="Cibles touchées du premier coup d'affilée">🔥 0</span>
                    <span class="jtn-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jtn-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jtn-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jtn-bar">
                <button class="jtn-lvl active" data-level="1">😊 Facile</button>
                <button class="jtn-lvl" data-level="2">😐 Moyen</button>
                <button class="jtn-lvl" data-level="3">😤 Difficile</button>
                <div class="jtn-progress" title="Questions de la tournée">
                    <span class="jtn-progress-label">Tir</span>
                    ${'<span class="jtn-pdot"></span>'.repeat(QUESTIONS_PER_ROUND)}
                </div>
            </div>

            <div class="jtn-board"><span class="jtn-board-label">Quelle est la nature du mot surligné ?</span><span data-role="sentence"></span></div>

            <div class="jtn-scene">
                <div class="jtn-awning"></div>
                <div class="jtn-bulbs">${'<i></i>'.repeat(14)}</div>
                <div class="jtn-shelf r1"></div>
                <div class="jtn-shelf r2"></div>
                <div class="jtn-targets"></div>
                <div class="jtn-overlay" data-role="win"><div class="jtn-card"></div></div>
            </div>

            <div class="jtn-talk">
                <div class="jtn-chef">🎡</div>
                <div class="jtn-msg"></div>
            </div>

            <div class="jtn-actions">
                <button class="jtn-btn" data-act="hint">💡 Indice</button>
                <button class="jtn-btn" data-act="freeze" title="Arrêter ou relancer le défilement des cibles">⏸️ Cibles fixes</button>
                <button class="jtn-btn jtn-btn-go" data-act="next" disabled>Question suivante ▶</button>
            </div>

            <div class="jtn-help">
                <h4>🎯 Comment jouer ?</h4>
                <p>Un mot est <b>surligné</b> dans la phrase. Vise la cible qui porte sa <b>nature</b> et clique dessus !</p>
                <table>
                    <tr data-nat="Déterminant"><td>Déterminant</td><td>devant le nom : le, un, ma, ces, trois…</td></tr>
                    <tr data-nat="Nom"><td>Nom</td><td>on peut mettre « un » ou « le » devant</td></tr>
                    <tr data-nat="Adjectif"><td>Adjectif</td><td>précise le nom et s'accorde avec lui</td></tr>
                    <tr data-nat="Pronom"><td>Pronom</td><td>remplace un nom : il, nous, la, leur…</td></tr>
                    <tr data-nat="Verbe"><td>Verbe</td><td>change avec « hier » / « demain »</td></tr>
                    <tr data-nat="Mot invariable"><td>Mot invariable</td><td>ne change jamais : adverbe (très, vite), préposition (dans, sous), conjonction (et, mais, ou)</td></tr>
                </table>
                <p>💡 L'indice fait tomber une mauvaise cible. ⏸️ « Cibles fixes » arrête le défilement.</p>
                <p style="margin:0">😊 Dét. / Nom / Adj. / Verbe · 😐 + pronom et mot invariable · 😤 adverbe, préposition, conjonction et 🪤 pièges (la, leur, marche…). 10 tirs = une tournée !</p>
            </div>

            <div class="jtn-confetti"></div>

            <div class="jtn-rh jtn-rh-nw" data-dir="nw"></div>
            <div class="jtn-rh jtn-rh-n"  data-dir="n"></div>
            <div class="jtn-rh jtn-rh-ne" data-dir="ne"></div>
            <div class="jtn-rh jtn-rh-e"  data-dir="e"></div>
            <div class="jtn-rh jtn-rh-se" data-dir="se"></div>
            <div class="jtn-rh jtn-rh-s"  data-dir="s"></div>
            <div class="jtn-rh jtn-rh-sw" data-dir="sw"></div>
            <div class="jtn-rh jtn-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const scene     = $('.jtn-scene');
        const targetsEl = $('.jtn-targets');
        const sentEl    = $('[data-role="sentence"]');
        const msg       = $('.jtn-msg');
        const chef      = $('.jtn-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jtn-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jtn-help');
        const confetti  = $('.jtn-confetti');
        const lvlBtns   = container.querySelectorAll('.jtn-lvl');
        const pdots     = container.querySelectorAll('.jtn-pdot');
        const hintBtn   = $('[data-act="hint"]');
        const freezeBtn = $('[data-act="freeze"]');
        const nextBtn   = $('[data-act="next"]');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let parts = [];              // phrase découpée
        let askIdx = -1;             // index (dans parts) du mot demandé
        let answerLabel = '';        // étiquette attendue
        let targets = [];            // { el, label, x, row }
        let answered = false;
        let errors = 0, hints = 0;
        let qNo = 1;
        let results = [];
        let score = 0, streak = 0;
        let usedKeys = [];
        let askedLabels = [];        // natures déjà demandées dans la tournée
        let soundOn = true;
        let frozen = false;
        let rafId = null, lastT = 0;

        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };
        const isFull = () => container.classList.contains('wf-fullboard');

        // ── Échelle proportionnelle (+ plein écran sans défilement) ────────
        const BASE_W = 680;
        const FLOW = ['.jtn-header', '.jtn-bar', '.jtn-board', '.jtn-scene', '.jtn-talk', '.jtn-actions'];
        function applyScale() {
            if (isFull()) { fitFullboard(); return; }
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jtn-s', sc.toFixed(4));
        }
        function contentHeightAt(sc) {
            container.style.setProperty('--jtn-s', sc.toFixed(4));
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
            container.style.setProperty('--jtn-s', sc.toFixed(4));
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
            msg.className = 'jtn-msg' + (mood ? ' ' + mood : '');
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
            sentEl.innerHTML = parts.map((p, i) => {
                if (i !== askIdx) return esc(p.text);
                const tag = reveal ? `<span class="jtn-tag">${esc(answerLabel)}</span>` : '';
                return `<span class="jtn-word ${reveal ? 'solved' : 'wait'}" data-nat="${esc(answerLabel)}">${esc(p.text)}${tag}</span>`;
            }).join('');
        }

        // ── Cibles ─────────────────────────────────────────────────────────
        function buildTargets() {
            targetsEl.innerHTML = '';
            const labels = shuffle(JTN_LEVELS[level].labels);
            const n = labels.length;
            const row1 = Math.ceil(n / 2);
            targets = labels.map((label, i) => {
                const row = i < row1 ? 0 : 1;
                const k = row === 0 ? i : i - row1;
                const count = row === 0 ? row1 : n - row1;
                const el = document.createElement('button');
                el.className = 'jtn-target';
                el.dataset.nat = label;
                el.innerHTML = `<span class="jtn-disc"></span><span class="jtn-stick"></span><span class="jtn-plaque">${esc(label)}</span>`;
                el.style.top = row === 0 ? '56%' : '93%';
                const t = { el, label, row, k, count, x: evenX(k, count) };
                el.addEventListener('click', (e) => { e.stopPropagation(); shoot(t, e); });
                targetsEl.appendChild(el);
                return t;
            });
            placeTargets();
        }
        // Position régulière bien visible (en % de la largeur du stand)
        function evenX(k, count) { return (k + 0.5) * 100 / count; }
        function snapTargets() {
            targets.forEach(t => {
                t.x = evenX(t.k, t.count);
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
                const sp = JTN_LEVELS[level].speed;
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

        // ── Question : on choisit d'abord une nature (répartition équilibrée),
        //    puis un mot de cette nature pas encore demandé ─────────────────
        function pickQuestion() {
            const cfg = JTN_LEVELS[level];
            const byLabel = {};
            JTN_PHRASES.forEach(p => {
                if (!cfg.phrases.includes(p[0])) return;
                parsePhrase(p[1]).forEach((g, gi) => {
                    const lab = g.tag && cfg.map[g.tag];
                    if (!lab) return;
                    (byLabel[lab] = byLabel[lab] || []).push({ key: p[1] + '#' + gi, markup: p[1], gi, trap: g.trap });
                });
            });
            const labels = cfg.labels.filter(l => byLabel[l] && byLabel[l].length);
            const count = (l) => askedLabels.filter(x => x === l).length;
            const lastLabel = askedLabels[askedLabels.length - 1];
            let pool = labels.filter(l => l !== lastLabel);
            if (!pool.length) pool = labels;
            const min = Math.min(...pool.map(count));
            const label = rnd(pool.filter(l => count(l) === min));

            const cands = byLabel[label];
            let free = cands.filter(c => !usedKeys.includes(c.key));
            if (!free.length) {
                usedKeys = usedKeys.filter(k => !cands.some(c => c.key === k));
                free = cands;
            }
            // Évite deux fois de suite la même phrase
            const lastMarkup = usedKeys.length ? usedKeys[usedKeys.length - 1].split('#')[0] : null;
            let choice = free.filter(c => c.markup !== lastMarkup);
            if (!choice.length) choice = free;
            // Au niveau difficile, les pièges ressortent un peu plus souvent
            const traps = choice.filter(c => c.trap);
            const c = (level === 3 && traps.length && Math.random() < 0.4) ? rnd(traps) : rnd(choice);
            usedKeys.push(c.key);
            askedLabels.push(label);
            return c;
        }

        function loadQuestion() {
            const q = pickQuestion();
            parts = parsePhrase(q.markup);
            askIdx = q.gi;
            answerLabel = JTN_LEVELS[level].map[parts[askIdx].tag];
            answered = false; errors = 0; hints = 0;
            winLayer.classList.remove('show');
            scene.classList.remove('locked');
            buildTargets();
            renderSentence(false);
            nextBtn.disabled = true;
            hintBtn.disabled = false;
            updateStats(false);
            const intro = {
                1: 'Déterminant, nom, adjectif ou verbe ? Vise la bonne cible !',
                2: 'Déterminant, nom, adjectif, pronom, verbe ou mot invariable ? À toi de viser !',
                3: 'Attention aux pièges 🪤 : un même mot peut changer de nature selon la phrase !'
            };
            say(`🎯 Tir ${qNo} sur ${QUESTIONS_PER_ROUND}. ${intro[level]}`);
        }

        function newRound() {
            qNo = 1; results = []; usedKeys = []; askedLabels = [];
            loadQuestion();
        }

        // ── Tir ────────────────────────────────────────────────────────────
        function effect(e, t) {
            const r = scene.getBoundingClientRect();
            const x = e && e.clientX ? e.clientX - r.left : t.el.offsetLeft;
            const y = e && e.clientY ? e.clientY - r.top  : t.el.offsetTop;
            const pow = document.createElement('span');
            pow.className = 'jtn-pow'; pow.textContent = '💥';
            pow.style.left = x + 'px'; pow.style.top = y + 'px';
            scene.appendChild(pow);
            setTimeout(() => pow.remove(), 500);
            const tr = t.el.getBoundingClientRect();
            if (e && e.clientX) {
                const hole = document.createElement('span');
                hole.className = 'jtn-hole';
                hole.style.left = (e.clientX - tr.left) + 'px';
                hole.style.top  = (e.clientY - tr.top)  + 'px';
                t.el.appendChild(hole);
            }
        }

        function shoot(t, e) {
            if (answered || winLayer.classList.contains('show') || t.el.classList.contains('fallen')) return;
            sfx('shot');
            effect(e, t);
            const p = parts[askIdx];
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
                say(`🎉 ${rnd(['En plein dans le mille', 'Touché', 'Bravo', 'Quel tireur', 'Bien visé'])} ! ${explain(parts, askIdx, answerLabel)} <b>+${pts + bonus}</b>`, 'good');
                hintBtn.disabled = true;
                nextBtn.disabled = false;
                nextBtn.textContent = qNo >= QUESTIONS_PER_ROUND ? '🏁 Fin de la tournée' : 'Question suivante ▶';
            } else {
                errors++;
                t.el.classList.remove('ko'); void t.el.offsetWidth; t.el.classList.add('ko');
                sfx('error');
                setTimeout(() => { t.el.classList.remove('ko'); t.el.classList.add('fallen'); sfx('drop'); }, 420);
                let tips = errors === 1
                    ? 'Regarde bien les mots autour : est-il <b>devant un nom</b> ? <b>devant un verbe</b> ? <b>change-t-il</b> avec « hier » ou au pluriel ?'
                    : '💡 ' + METHOD[p.tag];
                if (p.trap && errors >= 2) tips += ' 🪤 Attention, c\'est un piège : ce mot peut changer de nature selon la phrase !';
                say(`🚫 Raté ! « ${esc(p.text)} » n'est pas ${esc(UN[t.label] || t.label)}. ${tips}`, 'bad');
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
            say(`💡 Ce n'est pas ${esc(UN[t.label] || t.label)} : cette cible est tombée. ${METHOD[parts[askIdx].tag]}`);
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
                <div class="jtn-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jtn-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${firstTry} cible${firstTry > 1 ? 's' : ''} sur ${QUESTIONS_PER_ROUND} touchée${firstTry > 1 ? 's' : ''} du premier coup</p>
                <button class="jtn-btn jtn-btn-go" data-act="again">🔄 Nouvelle tournée</button>`;
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
            window._wfMiniBarCollapse(widget, '🎯 Le tir aux natures', { onExpand: applyScale });
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
        container.querySelectorAll('.jtn-rh[data-dir]').forEach(handle => {
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
        widget._jtnGetData = function () {
            return {
                level, score, streak, soundOn, frozen,
                containerW: _isMax ? (_savedW || null) : (container.style.width || null),
                containerH: _isMax ? null : (container.style.height || null),
                fullboard: _isMax
            };
        };

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, .jtn-scene, .jtn-rh, .jtn-help')) {
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
            if (type === TYPE) return window.createJeuTirNaturesWidget();
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
