// =========================================================================
// JEU « LE CORRECTEUR FOU » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Un professeur un peu fou a écrit un court texte en glissant 5 fautes
// (majuscules, pluriels, accords, conjugaison, infinitifs, participes,
// homophones, orthographe d'usage). L'élève clique sur les mots faux, puis
// choisit la bonne correction parmi 3. Attention aux fausses alertes !
// Chrono, compteur de fautes, indices (la phrase, puis le mot).
// 3 copies par tournée · 3 niveaux · 18 textes · 90 fautes.
//
// Ouverture   : createWidget('jeu-correcteur-fou')
// Sauvegarde  : widget._jcfGetData()  → jcfData dans save-load.js
// Restauration: createJeuCorrecteurFouWidget(jcfData)
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


    // ── CSS du jeu (préfixe jcf-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-correcteur-fou-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-correcteur-fou-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-correcteur-fou"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jcf-container {
            --jcf-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --stylo: #E0263A;

            width: 680px;
            box-sizing: border-box;
            position: relative;
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jcf-s));
            padding: calc(12px * var(--jcf-s)) calc(14px * var(--jcf-s)) calc(14px * var(--jcf-s));
            border-radius: calc(24px * var(--jcf-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jcf-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jcf-container > .jcf-header,
        .jcf-container > .jcf-bar,
        .jcf-container > .jcf-paper,
        .jcf-container > .jcf-talk,
        .jcf-container > .jcf-actions { flex-shrink: 0; }
        .jcf-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
            justify-content: center;
            overflow: hidden !important;
        }
        .jcf-container.wf-fullboard > .jcf-header,
        .jcf-container.wf-fullboard > .jcf-bar,
        .jcf-container.wf-fullboard > .jcf-paper,
        .jcf-container.wf-fullboard > .jcf-talk,
        .jcf-container.wf-fullboard > .jcf-actions {
            width: 100%; box-sizing: border-box;
            max-width: calc(760px * var(--jcf-s));
            margin-left: auto; margin-right: auto;
        }
        .jcf-container.wf-fullboard .jcf-help { right: 50%; transform: translateX(50%); }

        /* ── En-tête ── */
        .jcf-header { display: flex; align-items: center; gap: calc(10px * var(--jcf-s)); cursor: move; flex-wrap: wrap; }
        .jcf-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jcf-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jcf-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1.15;
        }
        .jcf-stats { display: flex; gap: calc(6px * var(--jcf-s)); align-items: center; margin-left: auto; }
        .jcf-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jcf-s)) calc(10px * var(--jcf-s));
            font-weight: 900; font-size: calc(14px * var(--jcf-s)); white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }
        .jcf-chip.found { background: #1C8A4F; }
        @keyframes jcf-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jcf-chip.bump { animation: jcf-bump .4s ease; }
        .jcf-icon-btn {
            width: calc(26px * var(--jcf-s)); height: calc(26px * var(--jcf-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jcf-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jcf-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + progression ── */
        .jcf-bar { display: flex; align-items: center; gap: calc(6px * var(--jcf-s)); flex-wrap: wrap; }
        .jcf-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jcf-s));
            padding: calc(5px * var(--jcf-s)) calc(12px * var(--jcf-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jcf-lvl:hover { background: rgba(255,255,255,0.1); }
        .jcf-lvl:active { transform: scale(0.95); }
        .jcf-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jcf-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jcf-s)); align-items: center; }
        .jcf-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jcf-s)); margin-right: 2px; }
        .jcf-pdot {
            width: calc(22px * var(--jcf-s)); height: calc(16px * var(--jcf-s)); border-radius: calc(3px * var(--jcf-s));
            background: rgba(255,255,255,0.15);
        }
        .jcf-pdot.done { background: var(--vert); }
        .jcf-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── La copie (cahier Seyès) ── */
        .jcf-paper {
            position: relative;
            border-radius: calc(12px * var(--jcf-s));
            background-color: #FFFDF5;
            background-image:
                linear-gradient(90deg, transparent calc(46px * var(--jcf-s)), #F28B9B calc(46px * var(--jcf-s)), #F28B9B calc(48px * var(--jcf-s)), transparent calc(48px * var(--jcf-s))),
                repeating-linear-gradient(180deg, transparent 0, transparent calc(47px * var(--jcf-s)), #9FB8E8 calc(47px * var(--jcf-s)), #9FB8E8 calc(48px * var(--jcf-s)));
            background-position: 0 calc(10px * var(--jcf-s));
            box-shadow: 0 calc(6px * var(--jcf-s)) 0 #CFC6E8, inset 0 0 0 calc(2px * var(--jcf-s)) #E8E0C8;
            padding: calc(18px * var(--jcf-s)) calc(18px * var(--jcf-s)) calc(18px * var(--jcf-s)) calc(62px * var(--jcf-s));
            min-height: calc(220px * var(--jcf-s));
            box-sizing: border-box;
        }
        .jcf-paper-head {
            position: absolute; left: calc(56px * var(--jcf-s)); top: calc(-2px * var(--jcf-s));
            font-family: 'Lilita One', sans-serif; font-size: calc(13px * var(--jcf-s));
            color: #fff; background: var(--stylo); padding: calc(2px * var(--jcf-s)) calc(10px * var(--jcf-s));
            border-radius: 0 0 calc(8px * var(--jcf-s)) calc(8px * var(--jcf-s)); letter-spacing: 0.5px;
        }
        .jcf-text {
            font-size: calc(22px * var(--jcf-s)); line-height: 2.18; font-weight: 800;
            color: #23375F; word-spacing: 0.08em;
        }
        .jcf-w {
            position: relative; display: inline-block; cursor: pointer;
            border-radius: calc(5px * var(--jcf-s)); padding: 0 calc(1px * var(--jcf-s));
            line-height: 1.3; transition: background .12s;
        }
        .jcf-w:hover { background: rgba(255,201,51,0.45); }
        .jcf-paper.done .jcf-w { cursor: default; }
        .jcf-paper.done .jcf-w:hover { background: none; }
        .jcf-w.sel { background: rgba(255,201,51,0.8); box-shadow: 0 0 0 calc(2px * var(--jcf-s)) var(--or); }
        @keyframes jcf-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .jcf-w.false { animation: jcf-shake .35s ease 2; background: rgba(255,79,94,0.25); }
        .jcf-w.fixed { color: #1C8A4F; cursor: default; }
        .jcf-w.fixed:hover { background: none; }
        .jcf-w.fixed::before {
            content: attr(data-old);
            position: absolute; left: 50%; bottom: 82%; transform: translateX(-50%) rotate(-3deg);
            font-family: 'Nunito', sans-serif; font-size: 0.6em; font-weight: 900; line-height: 1;
            color: var(--stylo); text-decoration: line-through; text-decoration-thickness: 2px;
            white-space: nowrap; pointer-events: none;
        }
        .jcf-w.fixed::after {
            content: ''; position: absolute; left: 0; right: 0; bottom: -0.05em; height: 0.12em;
            border-radius: 2px; background: var(--vert);
        }
        .jcf-w.revealed { color: #B3470F; }
        .jcf-w.revealed::after { background: #FF9F1A; }
        @keyframes jcf-wave { 0%,100% { box-shadow: 0 0 0 0 rgba(255,159,26,0.0); } 50% { box-shadow: 0 0 0 calc(5px * var(--jcf-s)) rgba(255,159,26,0.55); } }
        .jcf-w.hint { animation: jcf-wave 1s ease-in-out 4; background: rgba(255,159,26,0.25); }
        .jcf-sent.hint { background: rgba(255,201,51,0.28); border-radius: calc(6px * var(--jcf-s)); box-decoration-break: clone; -webkit-box-decoration-break: clone; }

        /* ── Bulle de correction ── */
        .jcf-pop {
            position: absolute; z-index: 20; display: none;
            background: #fff; border-radius: calc(14px * var(--jcf-s));
            padding: calc(8px * var(--jcf-s)) calc(10px * var(--jcf-s));
            box-shadow: 0 calc(5px * var(--jcf-s)) 0 #B9B2D6, 0 10px 26px rgba(20,10,50,0.3);
            text-align: center; min-width: calc(200px * var(--jcf-s));
        }
        .jcf-pop.show { display: block; animation: jcf-pop .2s ease-out; }
        .jcf-pop::after {
            content: ''; position: absolute; left: var(--arrow-x, 50%); top: 100%; transform: translateX(-50%);
            border: calc(9px * var(--jcf-s)) solid transparent; border-top-color: #fff;
        }
        .jcf-pop.below::after { top: auto; bottom: 100%; border-top-color: transparent; border-bottom-color: #fff; }
        .jcf-pop-q { font-weight: 900; font-size: calc(13px * var(--jcf-s)); margin-bottom: calc(6px * var(--jcf-s)); color: #5B3FB0; }
        .jcf-pop-q b { color: var(--stylo); }
        .jcf-pop-opts { display: flex; gap: calc(6px * var(--jcf-s)); justify-content: center; flex-wrap: wrap; }
        .jcf-opt {
            font-family: inherit; font-weight: 900; font-size: calc(18px * var(--jcf-s));
            padding: calc(6px * var(--jcf-s)) calc(12px * var(--jcf-s)); border-radius: calc(10px * var(--jcf-s));
            border: none; cursor: pointer; background: #EFEAFB; color: var(--encre);
            box-shadow: 0 calc(3px * var(--jcf-s)) 0 #CFC6E8;
        }
        .jcf-opt:hover { background: #FFF3C4; }
        .jcf-opt.ko { background: var(--rouge); color: #fff; box-shadow: 0 calc(3px * var(--jcf-s)) 0 #B32B38; cursor: default; opacity: 0.6; }
        .jcf-pop-cancel {
            margin-top: calc(6px * var(--jcf-s)); font-family: inherit; font-weight: 800; font-size: calc(11px * var(--jcf-s));
            background: none; border: none; color: #8C82AE; cursor: pointer; text-decoration: underline;
        }

        /* ── Actions ── */
        .jcf-actions { display: flex; gap: calc(8px * var(--jcf-s)); justify-content: center; flex-wrap: wrap; }
        .jcf-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jcf-s));
            padding: calc(8px * var(--jcf-s)) calc(14px * var(--jcf-s));
            border-radius: calc(14px * var(--jcf-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jcf-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jcf-btn:hover { filter: brightness(1.05); }
        .jcf-btn:active { transform: translateY(calc(4px * var(--jcf-s))); box-shadow: 0 calc(1px * var(--jcf-s)) 0 #B9B2D6; }
        .jcf-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jcf-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jcf-s));
            padding: calc(8px * var(--jcf-s)) calc(22px * var(--jcf-s));
            box-shadow: 0 calc(5px * var(--jcf-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jcf-btn-go:active { box-shadow: 0 calc(1px * var(--jcf-s)) 0 #1C8A4F; }
        .jcf-btn:focus-visible, .jcf-lvl:focus-visible, .jcf-opt:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Le professeur ── */
        .jcf-talk { display: flex; align-items: center; gap: calc(10px * var(--jcf-s)); }
        .jcf-chef {
            width: calc(44px * var(--jcf-s)); height: calc(44px * var(--jcf-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jcf-s));
            box-shadow: 0 calc(3px * var(--jcf-s)) 0 #B3840B;
        }
        @keyframes jcf-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jcf-s))) rotate(-8deg); } }
        .jcf-chef.hop { animation: jcf-hop .4s ease; }
        .jcf-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jcf-s));
            padding: calc(8px * var(--jcf-s)) calc(12px * var(--jcf-s));
            font-weight: 700; font-size: calc(15px * var(--jcf-s)); line-height: 1.35;
            min-height: calc(22px * var(--jcf-s));
            border-left: calc(6px * var(--jcf-s)) solid var(--or);
        }
        .jcf-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jcf-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jcf-msg b { font-weight: 900; }
        .jcf-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; }

        /* ── Écrans de fin ── */
        .jcf-overlay { position: absolute; inset: 0; z-index: 30; display: none; align-items: center; justify-content: center; background: rgba(42,31,74,0.45); border-radius: inherit; }
        .jcf-overlay.show { display: flex; }
        @keyframes jcf-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jcf-card {
            background: #fff; border-radius: calc(18px * var(--jcf-s));
            padding: calc(12px * var(--jcf-s)) calc(22px * var(--jcf-s)) calc(14px * var(--jcf-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jcf-s)) 0 #B9B2D6;
            animation: jcf-pop .35s ease-out; max-width: 90%;
        }
        .jcf-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jcf-s)); color: var(--encre); }
        .jcf-card p { margin: calc(4px * var(--jcf-s)) 0 calc(8px * var(--jcf-s)); font-weight: 800; font-size: calc(14px * var(--jcf-s)); }
        .jcf-card .jcf-detail { font-size: calc(12px * var(--jcf-s)); color: #6A5E8E; }
        .jcf-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jcf-s)); margin: calc(4px * var(--jcf-s)) 0; }
        .jcf-bigstars span { font-size: calc(34px * var(--jcf-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jcf-bigstars span.on { opacity: 1; filter: none; animation: jcf-pop .35s ease-out both; }
        .jcf-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jcf-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jcf-medal { font-size: calc(56px * var(--jcf-s)); line-height: 1; animation: jcf-pop .5s ease-out; }

        /* ── Aide ── */
        .jcf-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 330px; z-index: 40;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jcf-help.show { display: block; }
        .jcf-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jcf-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jcf-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 45; border-radius: inherit; }
        .jcf-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jcf-fall 1.8s ease-in forwards; }
        @keyframes jcf-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jcf-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jcf-container:hover .jcf-rh { opacity: 1; }
        .jcf-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jcf-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jcf-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jcf-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jcf-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jcf-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jcf-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jcf-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jcf-container *, .jcf-container *::before, .jcf-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUE DE TEXTES
    // Chaque faute est notée {faute|correction|type|intrus 1|intrus 2|explication}
    // (un seul mot). Types : maj · plur · accord · verbe · infinitif · participe
    //                        · homo (homophone) · ortho (orthographe d'usage)
    // =========================================================================
    const JCF_TEXTS = {
        1: [
            "{hier|Hier|maj|Hiers|Yer|Une phrase commence toujours par une majuscule.}, Léo est allé au parc avec ses deux {chien|chiens|plur|chiene|chienne|« deux » : il y en a plusieurs, donc « chiens » prend un s.}. Il {à|a|homo|as|ah|On peut dire « il avait lancé » : c'est le verbe avoir, sans accent.} lancé une balle très loin. Les chiens ont couru {est|et|homo|ai|es|On peut dire « et puis » : c'est « et », le mot qui relie.} ils ont ramené la balle. Léo était très {contant|content|ortho|contents|comptant|« content » s'écrit avec « en ».}.",
            "Le chat de Julie {dor|dort|verbe|dors|dorent|Avec « il » (le chat), le verbe dormir s'écrit « dort ».} sur le canapé. Il a de longues {moustache|moustaches|plur|moustach|moustachs|« de longues » : il y en a plusieurs, donc « moustaches » prend un s.}. Quand Julie rentre de l'école, le chat saute {a|à|homo|as|ah|On ne peut pas dire « avait » : c'est le petit mot « à », avec un accent.} terre pour l'accueillir. Julie {et|est|homo|ai|es|On peut dire « était » : c'est le verbe être, « est ».} très heureuse de le voir. Elle le caresse {doucemant|doucement|ortho|doussement|doucemment|Les adverbes en « -ment » s'écrivent souvent « -ement » : doucement.}.",
            "{les|Les|maj|Lés|Lais|Une phrase commence toujours par une majuscule.} élèves de la classe préparent une fête. Ils {décore|décorent|verbe|décores|décorer|Avec « ils », le verbe se termine par « -ent ».} la salle avec des {ballon|ballons|plur|ballone|balons|« des » : il y en a plusieurs, donc « ballons » prend un s.} rouges. La maîtresse apporte un gâteau {o|au|homo|aux|eau|« au chocolat » : un seul chocolat, on écrit « au ».} chocolat. Tout le monde chante {est|et|homo|ai|es|On peut dire « et puis » : c'est « et ».} danse.",
            "Dimanche, nous {somme|sommes|verbe|sont|ses|Avec « nous », le verbe être s'écrit « sommes ».} allés à la mer. Le sable était chaud et l'eau était {froid|froide|accord|froides|frois|« l'eau » est féminin singulier : on écrit « froide ».}. Mon frère a construit un grand {chatau|château|ortho|châteaux|chatô|« château » s'écrit avec « â » et « eau » ; ici il n'y en a qu'un, donc pas de x.} de sable. Papa {à|a|homo|as|ah|On peut dire « avait pris » : c'est le verbe avoir, sans accent.} pris des photos. Le soir, mes parents étaient très {fatiguer|fatigués|accord|fatigué|fatiguait|« mes parents » est au pluriel : l'adjectif « fatigués » prend un s.}.",
            "Il était une fois un petit lapin qui {habiter|habitait|verbe|habitais|habitaient|Avec « qui » (le lapin), l'imparfait s'écrit « habitait ».} dans la forêt. Un jour, il a rencontré un {renar|renard|ortho|renart|renards|« renard » se termine par un d muet (pense à « renarde »).}. Le renard voulait le manger, mais le lapin {cour|court|verbe|courent|courre|Avec « il », le verbe courir s'écrit « court ».} très vite. Il {c'est|s'est|homo|ces|ses|On peut dire « il se cache » : c'est « s'est » (se + est).} caché dans son terrier. {le|Le|maj|Lé|Leu|Une phrase commence toujours par une majuscule.} renard est reparti tout seul.",
            "Mes grands-parents {habite|habitent|verbe|habites|habiter|Avec « ils » (mes grands-parents), le verbe se termine par « -ent ».} à la campagne. Ils ont des poules, des vaches {est|et|homo|ai|es|On peut dire « et puis » : c'est « et ».} un cheval. Le matin, je ramasse les {œuf|œufs|plur|œufes|œuff|« les » : il y en a plusieurs, donc « œufs » prend un s.} avec ma grand-mère. {elle|Elle|maj|Èle|Ell|Une phrase commence toujours par une majuscule.} me prépare un bon {gatau|gâteau|ortho|gâtau|gatô|« gâteau » s'écrit avec « â » et « eau ».}.",
        ],
        2: [
            "Les enfants {son|sont|homo|sons|sent|On peut dire « étaient partis » : c'est le verbe être, « sont ».} partis en classe verte. Ils {on|ont|homo|onts|om|On peut dire « avaient pris » : c'est le verbe avoir, « ont ».} pris le car tôt le matin. Le paysage était {magnifiques|magnifique|accord|magnifiquent|magnifik|« le paysage » est au singulier : « magnifique », sans s.}. Ce soir, les élèves {mange|mangent|verbe|manges|manger|Avec « ils » (les élèves), le verbe se termine par « -ent ».} tous ensemble, puis ils vont {regardé|regarder|infinitif|regardait|regardez|Après « vont », le verbe est à l'infinitif : on peut dire « vont voir ».} les étoiles.",
            "Lucas cherche {ces|ses|homo|c'est|s'est|Ce sont les affaires de Lucas, les siennes : « ses ».} affaires dans {sont|son|homo|sons|çon|C'est le cartable de Lucas, le sien : « son ».} cartable. Sa maman lui dit : « Tu as {oublier|oublié|participe|oubliais|oubliez|Après « tu as », on peut dire « tu as pris » : c'est le participe passé « oublié ».} ta trousse ! » {on|On|maj|Ont|Hon|Une phrase commence toujours par une majuscule.} la retrouve enfin sous le lit. Lucas est {soulager|soulagé|participe|soulageait|soulagez|On peut dire « Lucas est content » : « soulagé », avec « é ».}.",
            "Chaque été, mes cousins {vienne|viennent|verbe|viens|vient|Avec « ils » (mes cousins), le verbe se termine par « -ent ».} chez nous. Nous {jouont|jouons|verbe|joue|jouez|Avec « nous », le verbe se termine par « -ons ».} au football dans le jardin. Les filles {son|sont|homo|sons|sent|On peut dire « étaient » : c'est « sont ».} très fortes ! Le soir, on mange des glaces {o|aux|homo|au|eau|« aux fruits » : plusieurs fruits, on écrit « aux ».} fruits. Ce sont des vacances {merveilleuse|merveilleuses|accord|merveilleux|merveilleus|« des vacances » est au pluriel : « merveilleuses ».}.",
            "La forêt est pleine d'animaux. Les écureuils {grimpe|grimpent|verbe|grimpes|grimper|Avec « ils » (les écureuils), le verbe se termine par « -ent ».} aux arbres. Un hibou {dor|dort|verbe|dors|dorment|Avec « il » (le hibou), dormir s'écrit « dort ».} sur une branche. Les biches {on|ont|homo|onts|om|On peut dire « avaient » : c'est le verbe avoir, « ont ».} peur du bruit. Il faut {marché|marcher|infinitif|marchait|marchez|Après « il faut », le verbe est à l'infinitif : on peut dire « il faut courir ».} en silence pour ne pas les {effrayé|effrayer|infinitif|effrayait|effrayez|Après « pour ne pas les », on peut dire « pour ne pas les voir » : infinitif en « -er ».}.",
            "Ce matin, il {pleuvais|pleuvait|verbe|pleuvaient|pleuvez|Avec « il », l'imparfait s'écrit « pleuvait ».} très fort. Les enfants {on|ont|homo|onts|om|On peut dire « avaient mis » : c'est « ont ».} mis leurs bottes. Dans la cour, il y avait de grandes {flaque|flaques|plur|flacques|flaquent|« de grandes » : il y en a plusieurs, donc « flaques » prend un s.}. Léa a sauté dedans {est|et|homo|ai|es|On peut dire « et puis » : c'est « et ».} elle s'est éclaboussée. Sa maîtresse n'était pas très {contante|contente|ortho|comptante|contantes|« contente » s'écrit avec « en ».}.",
            "Mon père {et|est|homo|ai|es|On peut dire « était » : c'est le verbe être, « est ».} boulanger. Il se lève très tôt pour {préparé|préparer|infinitif|préparait|préparez|Après « pour », le verbe est à l'infinitif : on peut dire « pour faire ».} le pain. Ses croissants {son|sont|homo|sons|sent|On peut dire « étaient » : c'est « sont ».} délicieux. Les clients {arrive|arrivent|verbe|arrives|arriver|Avec « ils » (les clients), le verbe se termine par « -ent ».} dès sept heures. Ils achètent des baguettes {croustillante|croustillantes|accord|croustillant|croustillants|« des baguettes » est au féminin pluriel : « croustillantes ».}.",
        ],
        3: [
            "Hier, les élèves sont {aller|allés|participe|allé|allaient|Avec « être », le participe passé s'accorde avec le sujet : « les élèves sont allés ».} au musée. Le guide {leurs|leur|homo|leure|leurre|Devant un verbe, « leur » (= à eux) ne prend jamais de s.} a montré des tableaux très anciens. Les enfants ont {regarder|regardé|participe|regardait|regardez|Après « ont », on peut dire « ont pris » : c'est le participe passé « regardé ».} les statues avec attention. {quel|Quelle|accord|Quel|Quels|« journée » est féminin singulier, et la phrase commence par une majuscule : « Quelle ».} belle journée ! En rentrant, ils {ce|se|homo|ceux|seu|Devant le verbe, c'est le pronom « se » (ils se reposent).} sont reposés.",
            "Le chat de ma voisine {c'est|s'est|homo|ces|ses|On peut dire « il se perd » : c'est « s'est » (se + est).} perdu. Elle l'{à|a|homo|as|ah|On peut dire « l'avait cherché » : c'est le verbe avoir, sans accent.} cherché pendant trois jours. Elle a collé des affiches dans {tout|toutes|accord|tous|toute|« les rues » est au féminin pluriel : « toutes les rues ».} les rues du quartier. Enfin, des enfants l'ont {trouver|trouvé|participe|trouvait|trouvez|Après « ont », on peut dire « l'ont pris » : c'est le participe passé « trouvé ».} dans un jardin. Ma voisine était {ravis|ravie|accord|ravies|ravi|« ma voisine » est féminin singulier : « ravie ».}.",
            "Demain, nous {iront|irons|verbe|irent|irions|Avec « nous », le futur se termine par « -ons » : nous irons.} à la piscine. Vous {devré|devrez|verbe|devrai|devraient|Avec « vous », le futur se termine par « -ez » : vous devrez.} apporter un maillot et une serviette. Le maître va {vérifié|vérifier|infinitif|vérifiait|vérifiez|Après « va », le verbe est à l'infinitif : on peut dire « va prendre ».} que tout le monde sait nager. Les élèves qui ont {peu|peur|homo|peut|peux|« avoir peur » : le nom « peur » se termine par un r.} resteront dans le petit bassin. Ce sera une {journé|journée|ortho|journet|journées|Beaucoup de noms féminins en [é] s'écrivent « -ée » : journée.} amusante.",
            "Les oiseaux migrateurs {quitte|quittent|verbe|quittes|quitter|Avec « ils » (les oiseaux), le verbe se termine par « -ent ».} nos régions à l'automne. Ils {parcours|parcourent|verbe|parcourt|parcourre|Avec « ils », le verbe parcourir s'écrit « parcourent ».} des milliers de kilomètres. {Leur|Leurs|accord|Leure|Leurres|Devant un nom au pluriel (« ailes »), « leurs » prend un s.} ailes sont très puissantes. Au printemps, ils {revienne|reviennent|verbe|revient|reviens|Avec « ils », le verbe se termine par « -ent ».} pour faire leur nid. C'est un spectacle {magnifiques|magnifique|accord|magnifiquent|magnifik|« un spectacle » est au singulier : « magnifique ».} !",
            "Quand j'étais petit, je {voulait|voulais|verbe|voulaient|voulez|Avec « je », l'imparfait se termine par « -ais ».} devenir pompier. Mes parents m'{on|ont|homo|onts|om|On peut dire « m'avaient offert » : c'est le verbe avoir, « ont ».} offert un camion rouge. Je {jouer|jouais|verbe|jouait|jouez|Avec « je », l'imparfait se termine par « -ais » : je jouais.} avec lui toute la journée. Aujourd'hui, je préfère les {avion|avions|plur|avionts|avionne|« les » : il y en a plusieurs, donc « avions » prend un s.} : je veux être pilote ! {quel|Quel|maj|Quelle|Quels|Une phrase commence toujours par une majuscule.} métier choisiras-tu ?",
            "Ce matin, Emma {c'est|s'est|homo|ces|ses|On peut dire « elle se lève » : c'est « s'est » (se + est).} levée en retard. Elle {à|a|homo|as|ah|On peut dire « elle avait couru » : c'est le verbe avoir, sans accent.} couru jusqu'à l'arrêt de bus. Malheureusement, le bus était déjà {partit|parti|participe|partis|partie|Le participe passé de « partir » se termine par i : « le bus était parti ».}. Sa maman a dû l'{emmené|emmener|infinitif|emmenait|emmenez|Après « a dû », le verbe est à l'infinitif : on peut dire « a dû la prendre ».} à l'école en voiture. Emma est arrivée à l'heure, {mes|mais|homo|met|mets|On peut dire « pourtant » : c'est « mais », le mot qui oppose.} elle était très essoufflée.",
        ],
    };
    const JCF_CATS = {
        maj: 'majuscule', plur: 'pluriel du nom', accord: 'accord', verbe: 'conjugaison',
        infinitif: 'infinitif en -er', participe: 'participe passé', homo: 'homophone', ortho: 'orthographe d\'un mot'
    };
    const TEXTS_PER_ROUND = 3;
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#fff'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

    // Découpe un texte en phrases → morceaux (mots cliquables, fautes, ponctuation)
    const WORD_RE = /([A-Za-zÀ-ÖØ-öø-ÿŒœÆæ'’-]+)/;
    function parseText(src) {
        const errors = [];
        const sentences = [[]];
        const pushTok = (tok) => {
            sentences[sentences.length - 1].push(tok);
            if (tok.kind === 'punct' && /[.!?]/.test(tok.text)) sentences.push([]);
        };
        const re = /\{([^}]*)\}/g;
        let last = 0, m;
        const plain = (txt) => {
            txt.split(WORD_RE).forEach((piece, i) => {
                if (!piece) return;
                if (i % 2 === 1) pushTok({ kind: 'word', text: piece });
                else pushTok({ kind: 'punct', text: piece });
            });
        };
        while ((m = re.exec(src))) {
            plain(src.slice(last, m.index));
            const f = m[1].split('|');
            const err = { wrong: f[0], right: f[1], cat: f[2], alts: [f[3], f[4]], note: f[5] || '', found: false, revealed: false, tries: 0 };
            errors.push(err);
            pushTok({ kind: 'word', text: err.wrong, err: errors.length - 1 });
            last = re.lastIndex;
        }
        plain(src.slice(last));
        return { sentences: sentences.filter(s => s.length), errors };
    }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jcfAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jcfAudio) _jcfAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jcfAudio, t0 = ctx.currentTime + start;
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
        open:  () => tone(700, 0, 0.06, 'triangle', 0.07),
        good:  () => { tone(660, 0, 0.1, 'triangle', 0.1); tone(990, 0.1, 0.18, 'triangle', 0.1); },
        error: () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        boing: () => { tone(320, 0, 0.12, 'sine', 0.08); tone(220, 0.1, 0.18, 'sine', 0.07); },
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // savedData (facultatif) : données issues de la sauvegarde du board
    // =========================================================================
    window.createJeuCorrecteurFouWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-correcteur-fou';
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
        container.className = 'jcf-container';
        container.innerHTML = `
            <div class="jcf-header">
                <span class="jcf-title">Le correcteur fou</span>
                <div class="jcf-stats">
                    <span class="jcf-chip" data-role="found" title="Fautes corrigées">🔍 0 / 5</span>
                    <span class="jcf-chip" data-role="time" title="Temps">⏱ 0:00</span>
                    <span class="jcf-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jcf-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jcf-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jcf-bar">
                <button class="jcf-lvl active" data-level="1">😊 Facile</button>
                <button class="jcf-lvl" data-level="2">😐 Moyen</button>
                <button class="jcf-lvl" data-level="3">😤 Difficile</button>
                <div class="jcf-progress" title="Copies de la tournée">
                    <span class="jcf-progress-label">Copie</span>
                    ${'<span class="jcf-pdot"></span>'.repeat(TEXTS_PER_ROUND)}
                </div>
            </div>

            <div class="jcf-paper">
                <div class="jcf-paper-head">5 fautes cachées</div>
                <div class="jcf-text"></div>
                <div class="jcf-pop">
                    <div class="jcf-pop-q"></div>
                    <div class="jcf-pop-opts"></div>
                    <button class="jcf-pop-cancel">Annuler</button>
                </div>
                <div class="jcf-overlay" data-role="win"><div class="jcf-card"></div></div>
            </div>

            <div class="jcf-talk">
                <div class="jcf-chef">🤪</div>
                <div class="jcf-msg"></div>
            </div>

            <div class="jcf-actions">
                <button class="jcf-btn" data-act="hint">💡 Indice</button>
                <button class="jcf-btn" data-act="reveal" title="Montrer les fautes qui restent">🏳️ Voir les fautes</button>
                <button class="jcf-btn jcf-btn-go" data-act="new">🔄 Autre copie</button>
            </div>

            <div class="jcf-help">
                <h4>🖍️ Comment jouer ?</h4>
                <p>Le correcteur fou a écrit un texte avec <b>5 fautes</b>. À toi de les trouver !</p>
                <p>👆 Clique sur un mot que tu crois faux, puis choisis la <b>bonne correction</b> parmi trois. Le mot corrigé devient vert.</p>
                <p>⚠️ Attention aux <b>fausses alertes</b> : si tu cliques sur un mot bien écrit, tu perds des points !</p>
                <p>Pense à vérifier : les <b>majuscules</b>, les <b>pluriels</b>, les <b>accords</b>, les <b>terminaisons des verbes</b> et les <b>homophones</b> (a/à, et/est, son/sont, on/ont…).</p>
                <p style="margin:0">💡 L'indice montre d'abord la phrase, puis le mot. 3 copies = une tournée !</p>
            </div>

            <div class="jcf-confetti"></div>

            <div class="jcf-rh jcf-rh-nw" data-dir="nw"></div>
            <div class="jcf-rh jcf-rh-n"  data-dir="n"></div>
            <div class="jcf-rh jcf-rh-ne" data-dir="ne"></div>
            <div class="jcf-rh jcf-rh-e"  data-dir="e"></div>
            <div class="jcf-rh jcf-rh-se" data-dir="se"></div>
            <div class="jcf-rh jcf-rh-s"  data-dir="s"></div>
            <div class="jcf-rh jcf-rh-sw" data-dir="sw"></div>
            <div class="jcf-rh jcf-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const paper     = $('.jcf-paper');
        const textEl    = $('.jcf-text');
        const pop       = $('.jcf-pop');
        const popQ      = $('.jcf-pop-q');
        const popOpts   = $('.jcf-pop-opts');
        const msg       = $('.jcf-msg');
        const chef      = $('.jcf-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jcf-card');
        const foundEl   = $('[data-role="found"]');
        const timeEl    = $('[data-role="time"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jcf-help');
        const confetti  = $('.jcf-confetti');
        const lvlBtns   = container.querySelectorAll('.jcf-lvl');
        const pdots     = container.querySelectorAll('.jcf-pdot');
        const hintBtn   = $('[data-act="hint"]');
        const revealBtn = $('[data-act="reveal"]');
        const newBtn    = $('[data-act="new"]');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let order = [];              // textes de la tournée (index dans la banque)
        let textNo = 1;              // 1..3
        let results = [];            // étoiles par copie
        let doc = null;              // { sentences, errors }
        let falseAlarms = 0, badChoices = 0, hints = 0;
        let hintErr = -1, hintStep = 0;
        let openErr = -1;
        let finished = false;
        let t0 = 0, elapsed = 0;
        let score = 0;
        let soundOn = true;

        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };
        const isFull = () => container.classList.contains('wf-fullboard');

        // ── Échelle proportionnelle (+ plein écran sans défilement) ────────
        const BASE_W = 680;
        const FLOW = ['.jcf-header', '.jcf-bar', '.jcf-paper', '.jcf-talk', '.jcf-actions'];
        function applyScale() {
            closePop();
            if (isFull()) { fitFullboard(); return; }
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jcf-s', sc.toFixed(4));
        }
        function contentHeightAt(sc) {
            container.style.setProperty('--jcf-s', sc.toFixed(4));
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
            for (let k = 0; k < 4; k++) {
                const h = contentHeightAt(sc);
                if (h <= availH) break;
                sc = Math.max(0.5, sc * (availH / h) * 0.98);
            }
            container.style.setProperty('--jcf-s', sc.toFixed(4));
        }
        const _onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', _onWinResize); return; }
            closePop();
            if (isFull()) fitFullboard();
        };
        window.addEventListener('resize', _onWinResize);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { if (widget.isConnected) applyScale(); });
        }

        // ── Professeur ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jcf-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
            if (isFull()) fitFullboard();
        }

        function updateStats(bump) {
            const n = doc ? doc.errors.filter(e => e.found).length : 0;
            const total = doc ? doc.errors.length : 5;
            foundEl.textContent = `🔍 ${n} / ${total}`;
            foundEl.classList.toggle('found', n === total);
            scoreEl.textContent = '⭐ ' + score;
            if (bump) { foundEl.classList.remove('bump'); void foundEl.offsetWidth; foundEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.classList.toggle('done', results[i] !== undefined);
                d.classList.toggle('current', i === textNo - 1 && results[i] === undefined);
            });
        }

        // ── Chronomètre ────────────────────────────────────────────────────
        const curTime = () => finished ? elapsed : elapsed + (t0 ? performance.now() - t0 : 0);
        const timer = setInterval(() => {
            if (!widget.isConnected) { clearInterval(timer); return; }
            timeEl.textContent = '⏱ ' + fmtTime(curTime());
        }, 250);

        // ── Rendu de la copie ──────────────────────────────────────────────
        function renderText() {
            textEl.innerHTML = '';
            doc.sentences.forEach((sent, si) => {
                const sEl = document.createElement('span');
                sEl.className = 'jcf-sent';
                sEl.dataset.s = si;
                sent.forEach(tok => {
                    if (tok.kind === 'punct') { sEl.appendChild(document.createTextNode(tok.text)); return; }
                    const w = document.createElement('span');
                    w.className = 'jcf-w';
                    w.textContent = tok.text;
                    if (tok.err !== undefined) w.dataset.err = tok.err;
                    w.addEventListener('click', (e) => { e.stopPropagation(); clickWord(w); });
                    sEl.appendChild(w);
                });
                textEl.appendChild(sEl);
            });
        }

        // ── Nouvelle copie / tournée ───────────────────────────────────────
        function loadText() {
            const src = JCF_TEXTS[level][order[textNo - 1]];
            doc = parseText(src);
            falseAlarms = 0; badChoices = 0; hints = 0;
            hintErr = -1; hintStep = 0;
            finished = false; elapsed = 0; t0 = performance.now();
            closePop();
            winLayer.classList.remove('show');
            paper.classList.remove('done');
            renderText();
            hintBtn.disabled = false; revealBtn.disabled = false;
            updateStats(false);
            const intro = {
                1: 'Regarde bien les majuscules, les pluriels et les petits mots comme <b>a / à</b> et <b>et / est</b>.',
                2: 'Vérifie les homophones (<b>son / sont</b>, <b>on / ont</b>, <b>ses / ces</b>…) et les terminaisons des verbes.',
                3: 'Attention aux accords, aux participes passés et aux infinitifs en <b>-er</b> !'
            };
            say(`🤪 Copie ${textNo} sur ${TEXTS_PER_ROUND} : j'ai glissé <b>5 fautes</b> dans mon texte. Trouve-les ! ${intro[level]}`);
        }
        function newRound() {
            order = shuffle(JCF_TEXTS[level].map((_, i) => i)).slice(0, TEXTS_PER_ROUND);
            textNo = 1; results = [];
            loadText();
        }

        // ── Clic sur un mot ────────────────────────────────────────────────
        function clickWord(w) {
            if (finished || winLayer.classList.contains('show')) return;
            if (w.classList.contains('fixed')) return;
            if (w.dataset.err === undefined) {
                closePop();
                falseAlarms++;
                w.classList.remove('false'); void w.offsetWidth; w.classList.add('false');
                setTimeout(() => w.classList.remove('false'), 800);
                sfx('boing');
                say(`😜 Fausse alerte ! « <b>${esc(w.textContent)}</b> » est bien écrit. Relis bien avant de corriger.`, 'bad');
                return;
            }
            openPop(w);
        }

        function openPop(w) {
            const i = +w.dataset.err;
            const err = doc.errors[i];
            openErr = i;
            container.querySelectorAll('.jcf-w.sel').forEach(x => x.classList.remove('sel'));
            w.classList.add('sel');
            popQ.innerHTML = `Comment corriger « <b>${esc(err.wrong)}</b> » ?`;
            popOpts.innerHTML = '';
            shuffle([err.right].concat(err.alts)).forEach(opt => {
                const b = document.createElement('button');
                b.className = 'jcf-opt';
                b.textContent = opt;
                b.addEventListener('click', (e) => { e.stopPropagation(); choose(w, i, opt, b); });
                popOpts.appendChild(b);
            });
            pop.classList.add('show');
            sfx('open');
            placePop(w);
        }
        function placePop(w) {
            const pr = paper.getBoundingClientRect();
            const wr = w.getBoundingClientRect();
            const ph = pop.offsetHeight, pw = pop.offsetWidth;
            const gap = 12;
            let top = wr.top - pr.top - ph - gap;
            let below = false;
            if (top < 4) { top = wr.bottom - pr.top + gap; below = true; }
            const cx = wr.left - pr.left + wr.width / 2;
            let left = Math.max(6, Math.min(pr.width - pw - 6, cx - pw / 2));
            pop.style.top = top + 'px';
            pop.style.left = left + 'px';
            pop.style.setProperty('--arrow-x', Math.max(14, Math.min(pw - 14, cx - left)) + 'px');
            pop.classList.toggle('below', below);
        }
        function closePop() {
            pop.classList.remove('show');
            openErr = -1;
            container.querySelectorAll('.jcf-w.sel').forEach(x => x.classList.remove('sel'));
        }

        function choose(w, i, opt, b) {
            const err = doc.errors[i];
            if (b.classList.contains('ko')) return;
            if (opt === err.right) {
                err.found = true;
                closePop();
                w.classList.remove('hint');
                w.dataset.old = err.wrong;
                w.textContent = err.right;
                w.classList.add('fixed');
                textEl.querySelectorAll('.jcf-sent.hint').forEach(s => s.classList.remove('hint'));
                if (hintErr === i) { hintErr = -1; hintStep = 0; }
                sfx('good');
                updateStats(true);
                const left = doc.errors.filter(e => !e.found).length;
                say(`✅ Bien vu ! <b>${esc(err.wrong)}</b> → <b>${esc(err.right)}</b>. ${esc(err.note)}${left ? ` <b>Encore ${left} faute${left > 1 ? 's' : ''}.</b>` : ''}`, 'good');
                if (!left) setTimeout(() => finishText(false), 700);
            } else {
                err.tries++;
                badChoices++;
                b.classList.add('ko');
                sfx('error');
                say(`❌ Ce n'est pas « ${esc(opt)} ». C'est une faute de <span class="k">${esc(JCF_CATS[err.cat] || err.cat)}</span> : réfléchis encore !`, 'bad');
            }
        }

        // ── Indice : la phrase, puis le mot ────────────────────────────────
        function giveHint() {
            if (finished) return;
            closePop();
            const remaining = doc.errors.map((e, i) => i).filter(i => !doc.errors[i].found);
            if (!remaining.length) return;
            if (hintErr < 0 || doc.errors[hintErr].found) { hintErr = remaining[0]; hintStep = 0; }
            const w = textEl.querySelector(`.jcf-w[data-err="${hintErr}"]`);
            const sentEl = w.closest('.jcf-sent');
            const err = doc.errors[hintErr];
            hints++;
            textEl.querySelectorAll('.jcf-sent.hint').forEach(s => s.classList.remove('hint'));
            if (hintStep === 0) {
                sentEl.classList.add('hint');
                hintStep = 1;
                say(`💡 Il y a une faute de <span class="k">${esc(JCF_CATS[err.cat] || err.cat)}</span> dans la phrase surlignée.`);
            } else {
                w.classList.remove('hint'); void w.offsetWidth; w.classList.add('hint');
                say(`💡 Regarde bien le mot « <b>${esc(err.wrong)}</b> » : clique dessus pour le corriger.`);
            }
        }

        // ── Voir les fautes restantes ──────────────────────────────────────
        function revealAll() {
            if (finished) return;
            closePop();
            doc.errors.forEach((err, i) => {
                if (err.found) return;
                err.revealed = true;
                const w = textEl.querySelector(`.jcf-w[data-err="${i}"]`);
                w.dataset.old = err.wrong;
                w.textContent = err.right;
                w.classList.add('fixed', 'revealed');
            });
            finishText(true);
        }

        // ── Fin de copie ───────────────────────────────────────────────────
        function finishText(gaveUp) {
            if (finished) return;
            finished = true;
            elapsed += performance.now() - t0;
            paper.classList.add('done');
            hintBtn.disabled = true; revealBtn.disabled = true;
            textEl.querySelectorAll('.jcf-sent.hint').forEach(s => s.classList.remove('hint'));
            let pts = 0;
            doc.errors.forEach(e => { if (e.found) pts += Math.max(4, 10 - 3 * e.tries); });
            pts = Math.max(0, pts - 2 * falseAlarms - 2 * hints);
            const pen = falseAlarms + badChoices + hints;
            const anyRevealed = doc.errors.some(e => e.revealed);
            const st = anyRevealed ? (doc.errors.some(e => e.found) ? 1 : 0) : pen === 0 ? 3 : pen <= 2 ? 2 : 1;
            score += pts;
            results[textNo - 1] = st;
            updateStats(true);
            timeEl.textContent = '⏱ ' + fmtTime(elapsed);
            const last = textNo >= TEXTS_PER_ROUND;
            const detail = `Fausses alertes : ${falseAlarms} · Mauvaises corrections : ${badChoices} · Indices : ${hints}`;
            if (anyRevealed) {
                say(`🏳️ Voici les fautes qui restaient, en orange. Relis-les bien : la prochaine fois, tu les trouveras !`);
            } else {
                say(`🎉 ${rnd(['Bravo', 'Super', 'Génial', 'Quel œil', 'Bien joué'])} ! Tu as corrigé les 5 fautes du correcteur fou en ${fmtTime(elapsed)}.`, 'good');
                sfx('win');
                party();
            }
            setTimeout(() => {
                if (!widget.isConnected) return;
                winCard.innerHTML = `
                    <h3>${anyRevealed ? 'Copie corrigée' : (pen === 0 ? 'Copie parfaite !' : 'Copie corrigée !')}</h3>
                    <div class="jcf-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                    <p>+${pts} points · ⏱ ${fmtTime(elapsed)}</p>
                    <p class="jcf-detail">${detail}</p>
                    <button class="jcf-btn jcf-btn-go" data-act="next">${last ? '🏁 Fin de la tournée' : 'Copie suivante ▶'}</button>
                    <button class="jcf-btn" data-act="look">👀 Revoir la copie</button>`;
                winLayer.classList.add('show');
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 220 * n); });
                winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (last) finalScreen(); else { textNo++; loadText(); }
                });
                winCard.querySelector('[data-act="look"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    winLayer.classList.remove('show');
                    newBtn.textContent = last ? '🏁 Fin de la tournée' : 'Copie suivante ▶';
                    newBtn.dataset.mode = last ? 'final' : 'next';
                });
            }, anyRevealed ? 1600 : 1200);
            if (typeof saveBoard === 'function') saveBoard();
        }

        function finalScreen() {
            const total = results.reduce((a, b) => a + b, 0);
            const max = TEXTS_PER_ROUND * 3;
            const medal = total >= max - 1 ? '🥇' : total >= Math.round(max * 0.55) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'Correcteur en chef !' : medal === '🥈' ? 'Très bon correcteur !' : 'Tournée terminée !';
            winCard.innerHTML = `
                <div class="jcf-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${total} ⭐ sur ${max} pour cette tournée</p>
                <button class="jcf-btn jcf-btn-go" data-act="again">🔄 Nouvelle tournée</button>`;
            winLayer.classList.add('show');
            sfx('win'); party();
            say(`🏁 Tournée terminée avec ${total} étoiles ! Rejoue ou essaie un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); resetNewBtn(); newRound(); });
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

        // ── Boutons ────────────────────────────────────────────────────────
        function resetNewBtn() { newBtn.textContent = '🔄 Autre copie'; delete newBtn.dataset.mode; }
        newBtn.addEventListener('click', () => {
            const mode = newBtn.dataset.mode;
            resetNewBtn();
            if (mode === 'final') { finalScreen(); return; }
            if (mode === 'next') { textNo++; loadText(); return; }
            // Autre copie : remplace la copie en cours par une autre du même niveau
            const used = new Set(order);
            const free = JCF_TEXTS[level].map((_, i) => i).filter(i => !used.has(i));
            if (free.length) order[textNo - 1] = rnd(free);
            else order[textNo - 1] = rnd(JCF_TEXTS[level].map((_, i) => i).filter(i => i !== order[textNo - 1]));
            loadText();
        });
        hintBtn.addEventListener('click', giveHint);
        revealBtn.addEventListener('click', revealAll);
        $('.jcf-pop-cancel').addEventListener('click', (e) => { e.stopPropagation(); closePop(); });
        pop.addEventListener('click', (e) => e.stopPropagation());
        paper.addEventListener('click', () => closePop());
        widget.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });

        function setLevel(l) {
            level = l;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === l));
            resetNewBtn();
            newRound();
            if (typeof saveBoard === 'function') saveBoard();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));

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
            closePop();
            window._wfMiniBarCollapse(widget, '🖍️ Le correcteur fou', { onExpand: applyScale });
        });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            setMax(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            clearInterval(timer);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jcf-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                closePop();
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
        widget._jcfGetData = function () {
            return {
                level, score, soundOn,
                containerW: _isMax ? (_savedW || null) : (container.style.width || null),
                containerH: _isMax ? null : (container.style.height || null),
                fullboard: _isMax
            };
        };

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, .jcf-paper, .jcf-rh, .jcf-help')) {
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
        }

        requestAnimationFrame(() => requestAnimationFrame(() => {
            applyScale();
            if (restoring) {
                const lv = [1, 2, 3].includes(+savedData.level) ? +savedData.level : 1;
                score = +savedData.score || 0;
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
            if (type === 'jeu-correcteur-fou') return window.createJeuCorrecteurFouWidget();
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
