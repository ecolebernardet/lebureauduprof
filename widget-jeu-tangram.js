// =========================================================================
// JEU « LE TANGRAM » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — mode jeu élèves
//
// Reproduire une figure avec les 7 pièces du tangram (2 grands triangles,
// 1 moyen, 2 petits, 1 carré, 1 parallélogramme).
// Glisser = déplacer, clic = tourner de 45°, bouton ⇋ = retourner.
// 14 figures (animaux, objets, formes géométriques), toutes vérifiées :
// chacune a une solution exacte avec les 7 pièces.
// 3 niveaux : facile   (on voit la place de chaque pièce)
//             moyen    (silhouette seule, pièces tournées au hasard)
//             difficile(petit modèle, construction libre sur le plateau)
//
// Ouverture : createWidget('jeu-tangram')
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


    // ── CSS du jeu (préfixe jtg-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-tangram-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tangram-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-tangram"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jtg-container {
            --jtg-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jtg-s)) calc(14px * var(--jtg-s)) calc(14px * var(--jtg-s));
            border-radius: calc(24px * var(--jtg-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jtg-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jtg-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jtg-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jtg-s));
            width: 100%; max-width: calc(672px * var(--jtg-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jtg-header { display: flex; align-items: center; gap: calc(10px * var(--jtg-s)); cursor: move; flex-wrap: wrap; }
        .jtg-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jtg-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jtg-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jtg-stats { display: flex; gap: calc(6px * var(--jtg-s)); align-items: center; margin-left: auto; }
        .jtg-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jtg-s)) calc(10px * var(--jtg-s));
            font-weight: 900; font-size: calc(14px * var(--jtg-s));
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        @keyframes jtg-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jtg-chip.bump { animation: jtg-bump .4s ease; }
        .jtg-icon-btn {
            width: calc(26px * var(--jtg-s)); height: calc(26px * var(--jtg-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jtg-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jtg-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + figures + progression ── */
        .jtg-bar { display: flex; align-items: center; gap: calc(6px * var(--jtg-s)); flex-wrap: wrap; }
        .jtg-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtg-s));
            padding: calc(5px * var(--jtg-s)) calc(12px * var(--jtg-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jtg-lvl:hover { background: rgba(255,255,255,0.1); }
        .jtg-lvl:active { transform: scale(0.95); }
        .jtg-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jtg-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtg-s));
            padding: calc(4px * var(--jtg-s)) calc(8px * var(--jtg-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer; max-width: calc(200px * var(--jtg-s));
        }
        .jtg-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jtg-s)); align-items: center; flex-shrink: 0; }
        .jtg-pdot {
            width: calc(16px * var(--jtg-s)); height: calc(16px * var(--jtg-s));
            border-radius: 50%; background: rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center;
            font-size: calc(9px * var(--jtg-s)); color: #fff; font-weight: 900;
        }
        .jtg-pdot.done { background: var(--vert); }
        .jtg-pdot.done::after { content: '✓'; }
        .jtg-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Plateau ── */
        .jtg-board {
            position: relative;
            border-radius: calc(18px * var(--jtg-s));
            overflow: hidden;
            background:
                radial-gradient(circle, rgba(42,31,74,0.10) calc(1.4px * var(--jtg-s)), transparent calc(1.6px * var(--jtg-s))) 0 0 / calc(39.53px * var(--jtg-s)) calc(39.53px * var(--jtg-s)),
                linear-gradient(135deg, #FFF3D6, #FFE2A8);
            box-shadow: inset 0 calc(-6px * var(--jtg-s)) 0 rgba(0,0,0,0.08);
            touch-action: none;
        }
        .jtg-board svg { display: block; width: 100%; height: auto; overflow: visible; }
        .jtg-zone-label {
            position: absolute; top: calc(8px * var(--jtg-s));
            font-weight: 900; font-size: calc(12px * var(--jtg-s)); color: rgba(42,31,74,0.45);
            text-transform: uppercase; letter-spacing: 1px; pointer-events: none;
        }
        .jtg-zone-label.left { left: calc(12px * var(--jtg-s)); }
        .jtg-zone-label.right { right: calc(12px * var(--jtg-s)); }
        .jtg-figname {
            position: absolute; right: calc(12px * var(--jtg-s)); bottom: calc(10px * var(--jtg-s));
            background: #fff; border-radius: 999px; padding: calc(3px * var(--jtg-s)) calc(12px * var(--jtg-s));
            font-weight: 900; font-size: calc(15px * var(--jtg-s)); color: var(--encre);
            box-shadow: 0 calc(3px * var(--jtg-s)) 0 rgba(0,0,0,0.12);
            pointer-events: none;
        }

        .jtg-sil { fill: #3B2F63; stroke: #3B2F63; stroke-width: 0.03; stroke-linejoin: round; }
        .jtg-sil.lines { stroke: rgba(255,255,255,0.45); stroke-width: 0.045; }
        .jtg-sil.free { fill: rgba(47,191,113,0.45); }
        .jtg-model-bg { fill: #fff; stroke: #D9CBB0; stroke-width: 0.05; }
        .jtg-sep { stroke: rgba(42,31,74,0.18); stroke-width: 0.05; stroke-dasharray: 0.2 0.2; }

        .jtg-piece { cursor: grab; }
        .jtg-piece polygon {
            stroke: #fff; stroke-width: 0.07; stroke-linejoin: round;
            filter: drop-shadow(0 0.06px 0 rgba(0,0,0,0.25));
            transition: filter .15s;
        }
        .jtg-piece.sel polygon { stroke: var(--encre); stroke-width: 0.09; }
        .jtg-piece.drag { cursor: grabbing; }
        .jtg-piece.drag polygon { filter: drop-shadow(0 0.18px 0.15px rgba(0,0,0,0.35)); }
        .jtg-piece.placed polygon { stroke: rgba(255,255,255,0.9); }
        @keyframes jtg-flash { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        .jtg-piece.snap polygon { animation: jtg-flash .3s ease 2; }
        .jtg-board.won .jtg-piece polygon { stroke: #fff; animation: jtg-flash .5s ease 3; }

        /* ── Outils ── */
        .jtg-tools { display: flex; gap: calc(8px * var(--jtg-s)); justify-content: center; flex-wrap: wrap; }
        .jtg-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jtg-s));
            padding: calc(8px * var(--jtg-s)) calc(14px * var(--jtg-s));
            border-radius: calc(14px * var(--jtg-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jtg-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jtg-btn:hover { filter: brightness(1.05); }
        .jtg-btn:active { transform: translateY(calc(4px * var(--jtg-s))); box-shadow: 0 calc(1px * var(--jtg-s)) 0 #B9B2D6; }
        .jtg-btn.rot { font-size: calc(18px * var(--jtg-s)); padding: calc(6px * var(--jtg-s)) calc(14px * var(--jtg-s)); }
        .jtg-btn.dim { opacity: 0.5; }
        .jtg-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jtg-s));
            padding: calc(8px * var(--jtg-s)) calc(22px * var(--jtg-s));
            box-shadow: 0 calc(5px * var(--jtg-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jtg-btn-go:active { box-shadow: 0 calc(1px * var(--jtg-s)) 0 #1C8A4F; }
        .jtg-btn:focus-visible, .jtg-lvl:focus-visible, .jtg-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jtg-talk { display: flex; align-items: center; gap: calc(10px * var(--jtg-s)); }
        .jtg-chef {
            width: calc(44px * var(--jtg-s)); height: calc(44px * var(--jtg-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jtg-s));
            box-shadow: 0 calc(3px * var(--jtg-s)) 0 #B3840B;
        }
        @keyframes jtg-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jtg-s))) rotate(-8deg); } }
        .jtg-chef.hop { animation: jtg-hop .4s ease; }
        .jtg-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jtg-s));
            padding: calc(8px * var(--jtg-s)) calc(12px * var(--jtg-s));
            font-weight: 700; font-size: calc(15px * var(--jtg-s)); line-height: 1.35;
            min-height: calc(22px * var(--jtg-s));
            border-left: calc(6px * var(--jtg-s)) solid var(--or);
        }
        .jtg-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jtg-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jtg-msg b { font-weight: 900; }

        /* ── Écrans de victoire ── */
        .jtg-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.3);
        }
        .jtg-overlay.show { display: flex; }
        .jtg-card {
            background: #fff; border-radius: calc(18px * var(--jtg-s));
            padding: calc(12px * var(--jtg-s)) calc(22px * var(--jtg-s)) calc(14px * var(--jtg-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jtg-s)) 0 #B9B2D6;
            animation: jtg-pop .35s ease-out;
            max-width: 90%;
        }
        @keyframes jtg-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jtg-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jtg-s)); color: var(--encre); }
        .jtg-card p { margin: calc(4px * var(--jtg-s)) 0 calc(8px * var(--jtg-s)); font-weight: 800; font-size: calc(14px * var(--jtg-s)); }
        .jtg-card .jtg-sub { font-size: calc(12px * var(--jtg-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jtg-s)); }
        .jtg-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jtg-s)); margin: calc(4px * var(--jtg-s)) 0; }
        .jtg-bigstars span { font-size: calc(34px * var(--jtg-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jtg-bigstars span.on { opacity: 1; filter: none; animation: jtg-pop .35s ease-out both; }
        .jtg-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jtg-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jtg-medal { font-size: calc(56px * var(--jtg-s)); line-height: 1; animation: jtg-pop .5s ease-out; }

        /* ── Aide ── */
        .jtg-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 340px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jtg-help.show { display: block; }
        .jtg-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jtg-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jtg-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jtg-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jtg-fall 1.8s ease-in forwards; }
        @keyframes jtg-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jtg-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jtg-container:hover .jtg-rh { opacity: 1; }
        .jtg-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jtg-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jtg-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jtg-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jtg-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jtg-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jtg-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jtg-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jtg-container *, .jtg-container *::before, .jtg-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // DONNÉES
    // Unité : côté du petit carré = 1. Chaque figure est donnée par la position
    // exacte de ses 7 pièces (solutions vérifiées). y vers le bas.
    // =========================================================================
    const JTG_FIGURES = [{"id":"chat","name":"Le chat","emoji":"🐱","cat":"objets","pieces":[["LT",[[1.4142,4.2426],[4.2426,4.2426],[2.8284,2.8284]]],["LT",[[4.2426,4.2426],[4.2426,1.4142],[2.8284,2.8284]]],["SQ",[[3.5355,2.1213],[4.2426,1.4142],[3.5355,0.7071],[2.8284,1.4142]]],["ST",[[2.8284,1.4142],[3.5355,0.7071],[2.8284,0.0]]],["ST",[[3.5355,0.7071],[4.2426,1.4142],[4.2426,0.0]]],["PA",[[1.4142,4.2426],[2.1213,3.5355],[0.7071,3.5355],[0.0,4.2426]]],["MT",[[4.2426,4.2426],[5.6569,4.2426],[4.2426,2.8284]]]]},{"id":"poisson","name":"Le poisson","emoji":"🐟","cat":"objets","pieces":[["LT",[[1.4142,4.2426],[1.4142,1.4142],[0.0,2.8284]]],["LT",[[1.4142,4.2426],[1.4142,1.4142],[2.8284,2.8284]]],["MT",[[4.2426,2.8284],[2.8284,2.8284],[4.2426,4.2426]]],["ST",[[2.8284,2.8284],[4.2426,2.8284],[3.5355,2.1213]]],["ST",[[3.5355,2.1213],[4.2426,2.8284],[4.2426,1.4142]]],["PA",[[2.1213,2.1213],[2.1213,0.7071],[1.4142,0.0],[1.4142,1.4142]]],["SQ",[[1.4142,4.2426],[2.1213,3.5355],[2.8284,4.2426],[2.1213,4.9497]]]]},{"id":"bateau","name":"Le bateau","emoji":"⛵","cat":"objets","pieces":[["LT",[[2,3],[4,3],[2,1]]],["LT",[[2,3],[0,3],[2,1]]],["PA",[[1,4],[2,4],[1,3],[0,3]]],["MT",[[2,3],[4,3],[3,4]]],["ST",[[2,3],[1,3],[2,4]]],["ST",[[2,4],[3,4],[2,3]]],["SQ",[[2,1],[3,1],[3,0],[2,0]]]]},{"id":"fusee","name":"La fusée","emoji":"🚀","cat":"objets","pieces":[["LT",[[2,4],[2,2],[0,4]]],["LT",[[1,1],[1,3],[3,1]]],["MT",[[1,1],[3,1],[2,0]]],["ST",[[2,4],[3,4],[2,3]]],["PA",[[4,4],[3,4],[2,3],[3,3]]],["SQ",[[2,3],[3,3],[3,2],[2,2]]],["ST",[[3,2],[3,1],[2,2]]]]},{"id":"maison","name":"La maison","emoji":"🏠","cat":"objets","pieces":[["LT",[[2,2],[2,0],[0,2]]],["LT",[[3,4],[3,2],[1,4]]],["ST",[[1,3],[1,4],[2,3]]],["SQ",[[1,3],[2,3],[2,2],[1,2]]],["MT",[[2,1],[2,3],[3,2]]],["PA",[[3,2],[3,1],[2,0],[2,1]]],["ST",[[3,2],[4,2],[3,1]]]]},{"id":"sablier","name":"Le sablier","emoji":"⏳","cat":"objets","pieces":[["LT",[[2,4],[2,2],[0,4]]],["PA",[[2,1],[1,1],[0,0],[1,0]]],["MT",[[3,1],[1,1],[2,2]]],["ST",[[2,0],[1,0],[2,1]]],["LT",[[2,4],[4,4],[2,2]]],["SQ",[[2,1],[3,1],[3,0],[2,0]]],["ST",[[3,0],[3,1],[4,0]]]]},{"id":"chapeau","name":"Le chapeau","emoji":"🎩","cat":"objets","pieces":[["PA",[[0,3],[1,3],[2,2],[1,2]]],["ST",[[2,3],[2,2],[1,3]]],["LT",[[2,3],[4,3],[2,1]]],["LT",[[4,1],[2,1],[4,3]]],["MT",[[2,1],[4,1],[3,0]]],["SQ",[[4,3],[5,3],[5,2],[4,2]]],["ST",[[5,3],[6,3],[5,2]]]]},{"id":"chaise","name":"La chaise","emoji":"🪑","cat":"objets","pieces":[["SQ",[[0,5],[1,5],[1,4],[0,4]]],["LT",[[0,4],[2,4],[0,2]]],["MT",[[1,3],[1,1],[0,2]]],["PA",[[1,0],[1,1],[0,2],[0,1]]],["ST",[[0,0],[0,1],[1,0]]],["LT",[[3,3],[1,3],[3,5]]],["ST",[[2,5],[3,5],[2,4]]]]},{"id":"carre","name":"Le carré","emoji":"🟥","cat":"formes","pieces":[["LT",[[0.0,2.8284],[2.8284,2.8284],[1.4142,1.4142]]],["LT",[[0.0,2.8284],[1.4142,1.4142],[0.0,0.0]]],["ST",[[2.8284,2.8284],[2.8284,1.4142],[2.1213,2.1213]]],["SQ",[[1.4142,1.4142],[2.1213,2.1213],[2.8284,1.4142],[2.1213,0.7071]]],["MT",[[2.8284,1.4142],[2.8284,0.0],[1.4142,0.0]]],["ST",[[1.4142,1.4142],[2.1213,0.7071],[0.7071,0.7071]]],["PA",[[0.0,0.0],[0.7071,0.7071],[2.1213,0.7071],[1.4142,0.0]]]]},{"id":"triangle","name":"Le triangle","emoji":"🔺","cat":"formes","pieces":[["LT",[[2,4],[2,2],[0,4]]],["PA",[[1,2],[1,3],[0,4],[0,3]]],["ST",[[0,2],[0,3],[1,2]]],["SQ",[[0,2],[1,2],[1,1],[0,1]]],["ST",[[0,1],[1,1],[0,0]]],["MT",[[1,1],[1,3],[2,2]]],["LT",[[2,4],[4,4],[2,2]]]]},{"id":"rectangle","name":"Le rectangle","emoji":"▬","cat":"formes","pieces":[["LT",[[0,2],[2,2],[0,0]]],["LT",[[2,0],[0,0],[2,2]]],["PA",[[2,2],[3,2],[4,1],[3,1]]],["MT",[[2,0],[2,2],[3,1]]],["ST",[[3,0],[2,0],[3,1]]],["ST",[[4,2],[4,1],[3,2]]],["SQ",[[3,1],[4,1],[4,0],[3,0]]]]},{"id":"parallelogramme","name":"Le parallélogramme","emoji":"▱","cat":"formes","pieces":[["LT",[[2,2],[2,0],[0,2]]],["LT",[[2,2],[4,2],[2,0]]],["PA",[[4,1],[3,1],[2,0],[3,0]]],["MT",[[5,1],[3,1],[4,2]]],["ST",[[4,0],[3,0],[4,1]]],["SQ",[[4,1],[5,1],[5,0],[4,0]]],["ST",[[5,0],[5,1],[6,0]]]]},{"id":"trapeze","name":"Le trapèze","emoji":"⏢","cat":"formes","pieces":[["LT",[[2,2],[2,0],[0,2]]],["PA",[[2,2],[3,2],[4,1],[3,1]]],["MT",[[2,0],[2,2],[3,1]]],["ST",[[3,0],[2,0],[3,1]]],["ST",[[4,2],[4,1],[3,2]]],["SQ",[[3,1],[4,1],[4,0],[3,0]]],["LT",[[4,2],[6,2],[4,0]]]]},{"id":"hexagone","name":"L'hexagone","emoji":"⬡","cat":"formes","pieces":[["PA",[[2,2],[1,2],[0,1],[1,1]]],["ST",[[1,1],[1,0],[0,1]]],["ST",[[2,1],[1,1],[2,2]]],["SQ",[[1,1],[2,1],[2,0],[1,0]]],["LT",[[2,2],[4,2],[2,0]]],["LT",[[4,0],[2,0],[4,2]]],["MT",[[4,0],[4,2],[5,1]]]]}];

    // Pièces (forme de base, avant rotation / retournement)
    const JTG_SHAPES = {
        LT: [[0, 0], [2, 0], [0, 2]],               // grand triangle
        MT: [[0, 0], [2, 0], [1, 1]],               // triangle moyen
        ST: [[0, 0], [1, 0], [0, 1]],               // petit triangle
        SQ: [[0, 0], [1, 0], [1, 1], [0, 1]],       // carré
        PA: [[0, 0], [1, 0], [2, 1], [1, 1]],       // parallélogramme
    };
    const JTG_SET = [
        { t: 'LT', color: '#FF4F5E' }, { t: 'LT', color: '#3BA7FF' }, { t: 'MT', color: '#2FBF71' },
        { t: 'ST', color: '#FFC933' }, { t: 'ST', color: '#FF7A1A' }, { t: 'SQ', color: '#36C9C6' },
        { t: 'PA', color: '#9B6BFF' },
    ];
    const JTG_NAMES = { LT: 'grand triangle', MT: 'triangle moyen', ST: 'petit triangle', SQ: 'carré', PA: 'parallélogramme' };

    // Plateau (unités) : zone des pièces à gauche, zone de la figure à droite
    const VB_W = 17, VB_H = 8;
    const TARGET_BOX = { x: 8.8, y: 0.5, w: 7.9, h: 7.0 };
    const SPAWN = [[1.4, 1.6], [4.3, 1.5], [7.0, 1.8], [1.3, 4.9], [4.1, 4.4], [7.0, 5.0], [4.2, 6.9]];
    const ROUND_SIZE = 5;

    const JTG_LEVELS = {
        1: { lines: true,  randomRot: false, model: false },
        2: { lines: false, randomRot: true,  model: false },
        3: { lines: false, randomRot: true,  model: true  },
    };
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A', '#36C9C6'];

    // ── Géométrie ──────────────────────────────────────────────────────────
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function centroid(pts) {
        let x = 0, y = 0; pts.forEach(p => { x += p[0]; y += p[1]; });
        return [x / pts.length, y / pts.length];
    }
    // Forme centrée sur son centre de gravité
    const LOCAL = {};
    Object.keys(JTG_SHAPES).forEach(t => {
        const c = centroid(JTG_SHAPES[t]);
        LOCAL[t] = JTG_SHAPES[t].map(p => [p[0] - c[0], p[1] - c[1]]);
    });
    // Sommets d'une pièce dans le plateau : v = R(r·45°)·(f ? -x : x, y) + (x, y)
    function worldPts(p) {
        const a = p.r * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
        return LOCAL[p.t].map(([x, y]) => {
            const fx = p.f ? -x : x;
            return [fx * c - y * s + p.x, fx * s + y * c + p.y];
        });
    }
    // Deux formes identiques (même orientation) une fois centrées ?
    function sameShape(ptsA, ptsB, tol) {
        if (ptsA.length !== ptsB.length) return false;
        const ca = centroid(ptsA), cb = centroid(ptsB);
        const A = ptsA.map(p => [p[0] - ca[0], p[1] - ca[1]]);
        const B = ptsB.map(p => [p[0] - cb[0], p[1] - cb[1]]);
        const used = new Set();
        return A.every(a => {
            for (let i = 0; i < B.length; i++) {
                if (!used.has(i) && Math.abs(a[0] - B[i][0]) < tol && Math.abs(a[1] - B[i][1]) < tol) { used.add(i); return true; }
            }
            return false;
        });
    }
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jtgAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jtgAudio) _jtgAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtgAudio, t0 = ctx.currentTime + start;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0); o.stop(t0 + dur + 0.05);
        } catch (e) { /* audio indisponible */ }
    }
    const SFX = {
        pick:  () => tone(520, 0, 0.06, 'triangle', 0.06),
        turn:  () => tone(760, 0, 0.05, 'triangle', 0.05),
        flip:  () => { tone(600, 0, 0.05, 'triangle', 0.05); tone(900, 0.05, 0.06, 'triangle', 0.05); },
        snap:  () => { tone(880, 0, 0.07, 'triangle', 0.08); tone(1320, 0.05, 0.1, 'triangle', 0.07); },
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
        hint:  () => tone(880, 0, 0.15, 'sine', 0.08),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuTangramWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-tangram';
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

        const figOptions = JTG_FIGURES.map(f => `<option value="fig:${f.id}">${f.emoji} ${f.name}</option>`).join('');

        const container = document.createElement('div');
        container.className = 'jtg-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jtg-inner">
            <div class="jtg-header">
                <span class="jtg-title">Le tangram</span>
                <div class="jtg-stats">
                    <span class="jtg-chip" data-role="time" title="Temps">⏱ 0:00</span>
                    <span class="jtg-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jtg-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jtg-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jtg-bar">
                <button class="jtg-lvl active" data-level="1">😊 Facile</button>
                <button class="jtg-lvl" data-level="2">😐 Moyen</button>
                <button class="jtg-lvl" data-level="3">😤 Difficile</button>
                <select class="jtg-select" title="Choisir les figures">
                    <optgroup label="Séries de 5 figures">
                        <option value="all">🎲 Toutes les figures</option>
                        <option value="objets">🐱 Animaux et objets</option>
                        <option value="formes">📐 Formes géométriques</option>
                    </optgroup>
                    <optgroup label="Une seule figure">${figOptions}</optgroup>
                </select>
                <div class="jtg-progress" title="Figures de la partie"></div>
            </div>

            <div class="jtg-board">
                <svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg">
                    <line class="jtg-sep" x1="8.45" y1="0.4" x2="8.45" y2="${VB_H - 0.4}"/>
                    <g data-role="target"></g>
                    <g data-role="pieces"></g>
                </svg>
                <span class="jtg-zone-label left">Les pièces</span>
                <span class="jtg-zone-label right" data-role="zone"></span>
                <span class="jtg-figname"></span>
                <div class="jtg-overlay" data-role="win"><div class="jtg-card"></div></div>
            </div>

            <div class="jtg-tools">
                <button class="jtg-btn rot" data-act="left"  title="Tourner à gauche (touche E)">↺</button>
                <button class="jtg-btn rot" data-act="right" title="Tourner à droite (touche R)">↻</button>
                <button class="jtg-btn" data-act="flip" title="Retourner la pièce (touche F)">⇋ Retourner</button>
                <button class="jtg-btn" data-act="hint">💡 Indice</button>
                <button class="jtg-btn" data-act="reset">🔄 Recommencer</button>
            </div>

            <div class="jtg-talk">
                <div class="jtg-chef">🧩</div>
                <div class="jtg-msg"></div>
            </div>
          </div>

            <div class="jtg-help">
                <h4>🧩 Comment jouer ?</h4>
                <p>Le tangram est un puzzle chinois de <b>7 pièces</b> : 2 grands triangles, 1 moyen, 2 petits, 1 carré et 1 parallélogramme. Il faut toutes les utiliser, sans les superposer, pour reproduire la figure.</p>
                <p>✋ <b>Fais glisser</b> une pièce pour la déplacer.<br>👆 <b>Clique</b> sur une pièce pour la tourner (↻). Clic droit ou ↺ : dans l'autre sens.<br>⇋ <b>Retourner</b> sert surtout pour le parallélogramme !</p>
                <p>😊 <b>Facile</b> : on voit la place de chaque pièce.<br>😐 <b>Moyen</b> : seulement l'ombre de la figure.<br>😤 <b>Difficile</b> : un petit modèle, et tu construis où tu veux.</p>
                <p style="margin:0">Les pièces s'aimantent quand elles sont bien placées. Au clavier : R et E pour tourner, F pour retourner.</p>
            </div>
            <div class="jtg-confetti"></div>
            <div class="jtg-rh jtg-rh-nw" data-dir="nw"></div>
            <div class="jtg-rh jtg-rh-n"  data-dir="n"></div>
            <div class="jtg-rh jtg-rh-ne" data-dir="ne"></div>
            <div class="jtg-rh jtg-rh-e"  data-dir="e"></div>
            <div class="jtg-rh jtg-rh-se" data-dir="se"></div>
            <div class="jtg-rh jtg-rh-s"  data-dir="s"></div>
            <div class="jtg-rh jtg-rh-sw" data-dir="sw"></div>
            <div class="jtg-rh jtg-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jtg-inner');
        const boardEl   = $('.jtg-board');
        const svg       = boardEl.querySelector('svg');
        const gTarget   = $('[data-role="target"]');
        const gPieces   = $('[data-role="pieces"]');
        const zoneLbl   = $('[data-role="zone"]');
        const figName   = $('.jtg-figname');
        const msg       = $('.jtg-msg');
        const chef      = $('.jtg-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jtg-card');
        const timeEl    = $('[data-role="time"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jtg-help');
        const confetti  = $('.jtg-confetti');
        const selectEl  = $('.jtg-select');
        const progressEl= $('.jtg-progress');
        const lvlBtns   = container.querySelectorAll('.jtg-lvl');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const NS = 'http://www.w3.org/2000/svg';

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let collection = 'all';
        let queue = [], qi = 0;
        let fig = null;              // figure en cours
        let slots = [];              // { t, pts, c, piece } (pièces de la solution, placées sur le plateau)
        let pieces = [];             // { t, color, x, y, r, f, g, poly, slot }
        let selected = null;
        let hints = 0, modelLines = false;
        let score = 0, roundStars = 0;
        let busy = false;
        let soundOn = true;
        let t0 = Date.now(), elapsed = 0;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jtg-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jtg-s', sc.toFixed(4));
        }

        // ── Messages ───────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jtg-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function renderProgress() {
            progressEl.innerHTML = queue.length > 1 ? queue.map((_, i) =>
                `<span class="jtg-pdot${i < qi ? ' done' : ''}${i === qi ? ' current' : ''}"></span>`).join('') : '';
        }
        function bumpScore() {
            scoreEl.textContent = '⭐ ' + score;
            scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
        }

        // ── Chronomètre ────────────────────────────────────────────────────
        const clock = setInterval(() => {
            if (!widget.isConnected) { clearInterval(clock); return; }
            if (busy || !fig) return;
            elapsed = Math.floor((Date.now() - t0) / 1000);
            timeEl.textContent = '⏱ ' + Math.floor(elapsed / 60) + ':' + String(elapsed % 60).padStart(2, '0');
        }, 500);

        // ── Coordonnées pointeur → plateau ─────────────────────────────────
        function toSvg(e) {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const m = svg.getScreenCTM();
            return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
        }

        // ── Dessin des pièces ──────────────────────────────────────────────
        function drawPiece(p, angle) {
            const deg = (angle !== undefined ? angle : p.r * 45);
            p.g.setAttribute('transform', `translate(${p.x.toFixed(4)} ${p.y.toFixed(4)}) rotate(${deg}) scale(${p.f ? -1 : 1} 1)`);
        }
        function select(p) {
            if (selected) selected.g.classList.remove('sel');
            selected = p;
            if (p) { p.g.classList.add('sel'); gPieces.appendChild(p.g); }
        }

        // ── Figure (silhouette ou modèle) ──────────────────────────────────
        function buildTarget() {
            gTarget.innerHTML = '';
            const L = JTG_LEVELS[level];
            const all = fig.pieces.flatMap(([, pts]) => pts);
            const w = Math.max(...all.map(p => p[0])), h = Math.max(...all.map(p => p[1]));
            let sc = 1, ox, oy;
            if (L.model) {
                // Modèle réduit en haut à droite ; la construction se fait dans la zone de droite
                sc = Math.min(0.5, 2.8 / Math.max(w, h));
                const bw = w * sc + 0.6, bh = h * sc + 0.6;
                const bx = VB_W - bw - 0.3, by = 0.35;
                const bg = document.createElementNS(NS, 'rect');
                bg.setAttribute('class', 'jtg-model-bg');
                bg.setAttribute('x', bx); bg.setAttribute('y', by);
                bg.setAttribute('width', bw); bg.setAttribute('height', bh); bg.setAttribute('rx', 0.25);
                gTarget.appendChild(bg);
                ox = bx + 0.3; oy = by + 0.3;
            } else {
                ox = TARGET_BOX.x + (TARGET_BOX.w - w) / 2;
                oy = TARGET_BOX.y + (TARGET_BOX.h - h) / 2;
            }
            slots = [];
            fig.pieces.forEach(([t, pts]) => {
                const wp = pts.map(p => [p[0] * sc + ox, p[1] * sc + oy]);
                const poly = document.createElementNS(NS, 'polygon');
                poly.setAttribute('points', wp.map(p => p.join(',')).join(' '));
                poly.setAttribute('class', 'jtg-sil' + ((L.lines || (L.model && modelLines)) ? ' lines' : ''));
                if (L.model) poly.style.strokeWidth = (L.lines || modelLines) ? '0.03' : '0.015';
                gTarget.appendChild(poly);
                // Solution en taille réelle (pour la vérification)
                const real = pts.map(p => [p[0] + ox, p[1] + oy]);
                slots.push({ t, pts: L.model ? pts.map(p => [p[0], p[1]]) : real, c: centroid(L.model ? pts : real), poly, piece: null });
            });
            zoneLbl.textContent = L.model ? '' : 'La figure';
            zoneLbl.style.display = L.model ? 'none' : '';
            figName.textContent = `${fig.emoji} ${fig.name}`;
        }

        // ── Pièces ─────────────────────────────────────────────────────────
        function buildPieces() {
            gPieces.innerHTML = '';
            selected = null;
            const L = JTG_LEVELS[level];
            const spots = shuffle(SPAWN);
            pieces = JTG_SET.map((d, i) => {
                const p = { t: d.t, color: d.color, x: spots[i][0], y: spots[i][1], r: L.randomRot ? Math.floor(Math.random() * 8) : 0, f: false, slot: null };
                p.g = document.createElementNS(NS, 'g');
                p.g.setAttribute('class', 'jtg-piece');
                p.poly = document.createElementNS(NS, 'polygon');
                p.poly.setAttribute('points', LOCAL[d.t].map(q => q.join(',')).join(' '));
                p.poly.setAttribute('fill', d.color);
                p.g.appendChild(p.poly);
                const title = document.createElementNS(NS, 'title');
                title.textContent = JTG_NAMES[d.t];
                p.g.appendChild(title);
                gPieces.appendChild(p.g);
                drawPiece(p);
                p.g.addEventListener('pointerdown', (e) => startDrag(e, p));
                p.g.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); if (!busy) { select(p); turn(p, -1); } });
                p.g.addEventListener('wheel', (e) => { if (busy) return; e.preventDefault(); e.stopPropagation(); select(p); turn(p, e.deltaY > 0 ? 1 : -1); }, { passive: false });
                return p;
            });
        }

        // ── Glisser / cliquer ──────────────────────────────────────────────
        function startDrag(e, p) {
            if (busy || e.button === 2) return;
            e.stopPropagation(); e.preventDefault();
            container.focus({ preventScroll: true });
            select(p);
            const start = toSvg(e);
            const ox = p.x, oy = p.y;
            let moved = false;
            const sx = e.clientX, sy = e.clientY;
            const onMove = (ev) => {
                if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 5) {
                    moved = true; p.g.classList.add('drag'); sfx('pick');
                    if (p.slot) { p.slot.piece = null; p.slot = null; p.g.classList.remove('placed'); }
                }
                if (!moved) return;
                const q = toSvg(ev);
                p.x = Math.max(0.2, Math.min(VB_W - 0.2, ox + q.x - start.x));
                p.y = Math.max(0.2, Math.min(VB_H - 0.2, oy + q.y - start.y));
                drawPiece(p);
            };
            const onUp = () => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.removeEventListener('pointercancel', onUp);
                p.g.classList.remove('drag');
                if (!moved) { turn(p, 1); return; }
                afterMove(p);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onUp);
        }

        // Rotation animée de ±45°
        function turn(p, dir) {
            if (busy || !p) return;
            if (p.slot) { p.slot.piece = null; p.slot = null; p.g.classList.remove('placed'); }
            const from = p.r * 45, to = from + dir * 45;
            p.r = ((p.r + dir) % 8 + 8) % 8;
            sfx('turn');
            const t1 = performance.now();
            const step = (now) => {
                const k = Math.min(1, (now - t1) / 140);
                drawPiece(p, from + (to - from) * (1 - Math.pow(1 - k, 2)));
                if (k < 1) requestAnimationFrame(step); else { drawPiece(p); afterMove(p); }
            };
            requestAnimationFrame(step);
        }
        function flip(p) {
            if (busy || !p) return;
            if (p.slot) { p.slot.piece = null; p.slot = null; p.g.classList.remove('placed'); }
            p.f = !p.f;
            sfx('flip');
            drawPiece(p);
            afterMove(p);
        }

        // ── Après un déplacement : aimant + vérification ───────────────────
        function afterMove(p) {
            const L = JTG_LEVELS[level];
            const wp = worldPts(p);
            const c = centroid(wp);
            if (!L.model) {
                // Aimant vers la bonne place
                let best = null, bestD = 0.75, almost = null;
                slots.forEach(s => {
                    if (s.t !== p.t || (s.piece && s.piece !== p)) return;
                    const d = dist(c, s.c);
                    if (d < bestD && sameShape(wp, s.pts, 0.06)) { best = s; bestD = d; }
                    else if (d < 0.75) almost = s;
                });
                if (best) {
                    p.x += best.c[0] - c[0]; p.y += best.c[1] - c[1];
                    best.piece = p; p.slot = best;
                    drawPiece(p);
                    p.g.classList.add('placed');
                    p.g.classList.remove('snap'); void p.g.getBBox(); p.g.classList.add('snap');
                    sfx('snap');
                    const n = pieces.filter(q => q.slot).length;
                    if (n < 7) say(`✨ Bien placé ! Encore <b>${7 - n}</b> pièce${7 - n > 1 ? 's' : ''}.`, 'good');
                } else if (almost) {
                    say(p.t === 'PA'
                        ? '🔄 Presque ! Tourne le parallélogramme… ou essaie de le <b>retourner</b> ⇋.'
                        : `🔄 C'est le bon endroit pour le ${JTG_NAMES[p.t]}, mais il faut le <b>tourner</b>.`);
                }
            } else {
                // Difficile : aimant entre les pièces (sommet contre sommet)
                let best = null, bestD = 0.3;
                pieces.forEach(q => {
                    if (q === p) return;
                    const qp = worldPts(q);
                    wp.forEach(a => qp.forEach(b => {
                        const d = dist(a, b);
                        if (d < bestD) { bestD = d; best = [b[0] - a[0], b[1] - a[1]]; }
                    }));
                });
                if (best) { p.x += best[0]; p.y += best[1]; drawPiece(p); sfx('snap'); }
            }
            checkWin();
        }

        function checkWin() {
            if (busy) return;
            const L = JTG_LEVELS[level];
            let ok;
            if (!L.model) {
                ok = pieces.every(p => p.slot);
            } else {
                // La figure doit être reproduite n'importe où (même forme, même orientation)
                ok = false;
                const W = pieces.map(p => ({ p, pts: worldPts(p) }));
                W.forEach(w => { w.c = centroid(w.pts); });
                const p0 = W[0];
                for (const s0 of slots) {
                    if (s0.t !== p0.p.t || !sameShape(p0.pts, s0.pts, 0.06)) continue;
                    const dx = s0.c[0] - p0.c[0], dy = s0.c[1] - p0.c[1];
                    const used = new Set();
                    const all = W.every(w => {
                        const s = slots.find(s => !used.has(s) && s.t === w.p.t &&
                            Math.abs(s.c[0] - (w.c[0] + dx)) < 0.08 && Math.abs(s.c[1] - (w.c[1] + dy)) < 0.08 &&
                            sameShape(w.pts, s.pts, 0.06));
                        if (s) { used.add(s); return true; }
                        return false;
                    });
                    if (all) { ok = true; break; }
                }
            }
            if (ok) win();
        }

        // ── Indice ─────────────────────────────────────────────────────────
        function giveHint() {
            if (busy || !fig) return;
            const L = JTG_LEVELS[level];
            if (L.model) {
                if (!modelLines) {
                    modelLines = true; hints++;
                    buildTarget();
                    sfx('hint');
                    say('💡 Regarde le modèle : on voit maintenant la place de chaque pièce !');
                } else {
                    say('💡 Commence par placer les <b>deux grands triangles</b>, puis complète avec les petites pièces.');
                }
                return;
            }
            // Place une pièce à sa bonne place (les grandes d'abord)
            const order = ['LT', 'MT', 'PA', 'SQ', 'ST'];
            const todo = pieces.filter(p => !p.slot).sort((a, b) => order.indexOf(a.t) - order.indexOf(b.t));
            const p = todo[0];
            if (!p) return;
            const s = slots.find(s => !s.piece && s.t === p.t);
            if (!s) return;
            // Trouver la rotation / le retournement qui correspond
            for (let f = 0; f < 2; f++) {
                for (let r = 0; r < 8; r++) {
                    const test = { t: p.t, x: s.c[0], y: s.c[1], r, f: !!f };
                    if (sameShape(worldPts(test), s.pts, 0.06)) {
                        hints++;
                        sfx('hint');
                        select(p);
                        const fx = p.x, fy = p.y;
                        p.r = r; p.f = !!f;
                        const t1 = performance.now();
                        const step = (now) => {
                            const k = Math.min(1, (now - t1) / 400), e = 1 - Math.pow(1 - k, 3);
                            p.x = fx + (s.c[0] - fx) * e; p.y = fy + (s.c[1] - fy) * e;
                            drawPiece(p);
                            if (k < 1) requestAnimationFrame(step); else { p.x = s.c[0]; p.y = s.c[1]; afterMove(p); }
                        };
                        requestAnimationFrame(step);
                        say(`💡 Voici la place du <b>${JTG_NAMES[p.t]}</b>.`);
                        return;
                    }
                }
            }
        }

        // ── Victoire ───────────────────────────────────────────────────────
        function win() {
            busy = true;
            select(null);
            elapsed = Math.floor((Date.now() - t0) / 1000);
            const st = hints === 0 ? 3 : hints === 1 ? 2 : 1;
            const fast = elapsed < (level === 1 ? 60 : level === 2 ? 120 : 180);
            const pts = st * 10 + (fast ? 5 : 0);
            score += pts; roundStars += st;
            bumpScore();
            boardEl.classList.add('won');
            // La silhouette devient verte
            gTarget.querySelectorAll('.jtg-sil').forEach(pl => pl.classList.add('free'));
            sfx('win');
            party();
            say(`🎉 Bravo ! Tu as construit ${fig.name.toLowerCase()} ${fig.emoji} en ${Math.floor(elapsed / 60)} min ${String(elapsed % 60).padStart(2, '0')} s.`, 'good');
            setTimeout(() => {
                if (!widget.isConnected) return;
                const last = qi >= queue.length - 1;
                winCard.innerHTML = `
                    <h3>${fig.emoji} ${hints === 0 ? 'Sans aide !' : 'Figure réussie !'}</h3>
                    <div class="jtg-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                    <p>+${pts} points</p>
                    ${fast ? '<p class="jtg-sub">dont +5 bonus rapidité ⏱</p>' : ''}
                    <button class="jtg-btn jtg-btn-go" data-act="next">${last ? '🏁 Fin de la partie' : 'Figure suivante ▶'}</button>`;
                winLayer.classList.add('show');
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
                winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (last) finalScreen();
                    else { qi++; loadFigure(); }
                });
            }, 1300);
        }
        function finalScreen() {
            const max = queue.length * 3;
            const medal = roundStars >= max - 1 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'Maître du tangram !' : medal === '🥈' ? 'Très bel architecte !' : 'Partie terminée !';
            qi = queue.length;
            renderProgress();
            winCard.innerHTML = `
                <div class="jtg-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${roundStars} ⭐ sur ${max} · ${score} points</p>
                <button class="jtg-btn jtg-btn-go" data-act="again">🔄 Nouvelle partie</button>`;
            winLayer.classList.add('show');
            sfx('win');
            party();
            say('🏁 Partie terminée ! Choisis un autre niveau ou d\'autres figures.', 'good');
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

        // ── Parties ────────────────────────────────────────────────────────
        function loadFigure() {
            fig = queue[qi];
            hints = 0; modelLines = false; busy = false;
            winLayer.classList.remove('show');
            boardEl.classList.remove('won');
            buildTarget();
            buildPieces();
            renderProgress();
            t0 = Date.now(); elapsed = 0;
            timeEl.textContent = '⏱ 0:00';
            const L = JTG_LEVELS[level];
            say(L.model
                ? `🧩 Reproduis ${fig.name.toLowerCase()} ${fig.emoji} en regardant le modèle. Construis-le où tu veux à droite !`
                : `🧩 Remplis ${fig.name.toLowerCase()} ${fig.emoji} avec les 7 pièces. Glisse pour déplacer, clique pour tourner.`);
        }
        function newRound() {
            if (collection.startsWith('fig:')) {
                queue = [JTG_FIGURES.find(f => f.id === collection.slice(4))];
            } else {
                const pool = JTG_FIGURES.filter(f => collection === 'all' || f.cat === collection);
                queue = shuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
            }
            qi = 0; roundStars = 0;
            loadFigure();
        }
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        selectEl.addEventListener('change', () => { collection = selectEl.value; newRound(); });
        selectEl.addEventListener('pointerdown', (e) => e.stopPropagation());
        selectEl.addEventListener('mousedown', (e) => e.stopPropagation());

        // ── Outils ─────────────────────────────────────────────────────────
        const needSel = () => { if (!selected) { say('👆 Clique d\'abord sur une pièce pour la choisir.'); return false; } return true; };
        btn('left').addEventListener('click', () => { if (needSel()) turn(selected, -1); });
        btn('right').addEventListener('click', () => { if (needSel()) turn(selected, 1); });
        btn('flip').addEventListener('click', () => { if (needSel()) flip(selected); });
        btn('hint').addEventListener('click', giveHint);
        btn('reset').addEventListener('click', () => { if (fig) loadFigure(); });
        // Clic dans le vide : désélectionner
        svg.addEventListener('pointerdown', (e) => { if (!e.target.closest('.jtg-piece')) select(null); });

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey || !selected) return;
            const k = e.key.toLowerCase();
            if (k === 'r') { e.preventDefault(); turn(selected, e.shiftKey ? -1 : 1); }
            else if (k === 'e') { e.preventDefault(); turn(selected, -1); }
            else if (k === 'f') { e.preventDefault(); flip(selected); }
        };
        document.addEventListener('keydown', onKey);

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
            window._wfMiniBarCollapse(widget, '🧩 Le tangram', { onExpand: applyScale });
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
            clearInterval(clock);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
        const onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
            if (_isMax) applyScale();
        };
        window.addEventListener('resize', onWinResize);

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jtg-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, .jtg-board, .jtg-rh, .jtg-help')) {
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
            if (type === 'jeu-tangram') return window.createJeuTangramWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-tangram') return window.createJeuTangramWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
