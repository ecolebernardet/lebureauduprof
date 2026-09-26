// =========================================================================
// JEU « SINGULIER / PLURIEL EXPRESS » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Un tapis roulant amène des colis portant des groupes nominaux.
//   🧺 Trier   : ranger chaque colis dans la caisse Singulier ou Pluriel
//                avant qu'il tombe du tapis.
//   ✏️ Corriger : le déterminant donne le nombre ; cliquer sur les mots mal
//                accordés (nom, adjectifs) pour les corriger, puis valider.
// Groupes nominaux fabriqués automatiquement (déterminant + nom + adjectifs,
// élision l', cet…). Le tapis accélère petit à petit.
// 3 niveaux : facile   (pluriels en -s)
//             moyen    (-eau/-eu → x, -al → aux, -ou → oux, noms en s/x/z)
//             difficile(exceptions : pneus, bals, yeux, travaux…)
//
// Ouverture : createWidget('jeu-sing-plur')
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


    // ── CSS du jeu (préfixe jsp-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-sing-plur-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-sing-plur-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-sing-plur"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jsp-container {
            --jsp-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --sing: #3BA7FF;
            --plur: #FF7A1A;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jsp-s)) calc(14px * var(--jsp-s)) calc(14px * var(--jsp-s));
            border-radius: calc(24px * var(--jsp-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jsp-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jsp-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jsp-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jsp-s));
            width: 100%; max-width: calc(672px * var(--jsp-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jsp-header { display: flex; align-items: center; gap: calc(10px * var(--jsp-s)); cursor: move; flex-wrap: wrap; }
        .jsp-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jsp-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jsp-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jsp-stats { display: flex; gap: calc(6px * var(--jsp-s)); align-items: center; margin-left: auto; }
        .jsp-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jsp-s)) calc(10px * var(--jsp-s));
            font-weight: 900; font-size: calc(14px * var(--jsp-s));
            white-space: nowrap;
        }
        .jsp-chip.hot { background: #FF7A1A; }
        @keyframes jsp-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jsp-chip.bump { animation: jsp-bump .4s ease; }
        .jsp-icon-btn {
            width: calc(26px * var(--jsp-s)); height: calc(26px * var(--jsp-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jsp-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jsp-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + mode + progression ── */
        .jsp-bar { display: flex; align-items: center; gap: calc(6px * var(--jsp-s)); flex-wrap: wrap; }
        .jsp-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jsp-s));
            padding: calc(5px * var(--jsp-s)) calc(12px * var(--jsp-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jsp-lvl:hover { background: rgba(255,255,255,0.1); }
        .jsp-lvl:active { transform: scale(0.95); }
        .jsp-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jsp-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jsp-s));
            padding: calc(4px * var(--jsp-s)) calc(8px * var(--jsp-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }
        .jsp-count { margin-left: auto; color: #fff; font-weight: 900; font-size: calc(13px * var(--jsp-s)); display: flex; gap: calc(8px * var(--jsp-s)); }
        .jsp-count .ok { color: #7CE8A8; }
        .jsp-count .ko { color: #FF9AA3; }

        /* ── Usine ── */
        .jsp-scene {
            position: relative;
            height: calc(250px * var(--jsp-s));
            border-radius: calc(18px * var(--jsp-s));
            overflow: hidden;
            flex-shrink: 0;
            background:
                repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0 calc(2px * var(--jsp-s)), transparent calc(2px * var(--jsp-s)) calc(28px * var(--jsp-s))),
                repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 calc(2px * var(--jsp-s)), transparent calc(2px * var(--jsp-s)) calc(56px * var(--jsp-s))),
                linear-gradient(180deg, #CFE8F5 0%, #B8D8EA 100%);
        }
        .jsp-sign {
            position: absolute; left: calc(14px * var(--jsp-s)); top: calc(12px * var(--jsp-s));
            background: var(--encre); color: var(--or);
            font-family: 'Lilita One', sans-serif; font-size: calc(15px * var(--jsp-s));
            padding: calc(3px * var(--jsp-s)) calc(12px * var(--jsp-s));
            border-radius: calc(8px * var(--jsp-s));
            border: calc(3px * var(--jsp-s)) solid var(--or);
            box-shadow: 0 calc(3px * var(--jsp-s)) 0 rgba(0,0,0,0.2);
            letter-spacing: 0.5px;
        }
        .jsp-lamp {
            position: absolute; top: calc(14px * var(--jsp-s)); right: calc(16px * var(--jsp-s));
            width: calc(16px * var(--jsp-s)); height: calc(16px * var(--jsp-s)); border-radius: 50%;
            background: #7CE8A8; box-shadow: 0 0 calc(10px * var(--jsp-s)) #2FBF71;
        }
        .jsp-lamp.off { background: #999; box-shadow: none; }
        @keyframes jsp-blink { 50% { background: var(--rouge); box-shadow: 0 0 calc(10px * var(--jsp-s)) var(--rouge); } }
        .jsp-lamp.alarm { animation: jsp-blink .25s steps(2) 4; }

        /* Tapis roulant */
        .jsp-belt {
            position: absolute; left: 0; top: calc(150px * var(--jsp-s));
            width: calc(470px * var(--jsp-s)); height: calc(26px * var(--jsp-s));
            background:
                repeating-linear-gradient(90deg, #3E3A52 0 calc(14px * var(--jsp-s)), #2E2A40 calc(14px * var(--jsp-s)) calc(28px * var(--jsp-s)));
            border-radius: 0 calc(13px * var(--jsp-s)) calc(13px * var(--jsp-s)) 0;
            box-shadow: inset 0 calc(3px * var(--jsp-s)) 0 rgba(255,255,255,0.15), 0 calc(4px * var(--jsp-s)) 0 #1C1830;
        }
        .jsp-legs {
            position: absolute; left: 0; top: calc(176px * var(--jsp-s));
            width: calc(470px * var(--jsp-s)); height: calc(74px * var(--jsp-s));
            background:
                linear-gradient(90deg, transparent calc(40px * var(--jsp-s)), #6B6784 calc(40px * var(--jsp-s)) calc(52px * var(--jsp-s)), transparent calc(52px * var(--jsp-s))),
                linear-gradient(90deg, transparent calc(220px * var(--jsp-s)), #6B6784 calc(220px * var(--jsp-s)) calc(232px * var(--jsp-s)), transparent calc(232px * var(--jsp-s))),
                linear-gradient(90deg, transparent calc(420px * var(--jsp-s)), #6B6784 calc(420px * var(--jsp-s)) calc(432px * var(--jsp-s)), transparent calc(432px * var(--jsp-s)));
        }
        .jsp-end {
            position: absolute; left: calc(462px * var(--jsp-s)); top: calc(118px * var(--jsp-s));
            width: calc(6px * var(--jsp-s)); height: calc(58px * var(--jsp-s));
            background: repeating-linear-gradient(180deg, var(--rouge) 0 calc(8px * var(--jsp-s)), #fff calc(8px * var(--jsp-s)) calc(16px * var(--jsp-s)));
            border-radius: 3px; opacity: 0.8;
        }

        /* Caisses */
        .jsp-crate {
            position: absolute; top: calc(140px * var(--jsp-s));
            width: calc(90px * var(--jsp-s)); height: calc(96px * var(--jsp-s));
            border-radius: calc(8px * var(--jsp-s));
            display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
            padding-bottom: calc(8px * var(--jsp-s)); box-sizing: border-box;
            color: #fff; font-weight: 900; font-size: calc(12px * var(--jsp-s)); text-align: center; line-height: 1.1;
            cursor: pointer;
            background:
                repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 calc(3px * var(--jsp-s)), transparent calc(3px * var(--jsp-s)) calc(24px * var(--jsp-s))),
                var(--cc);
            box-shadow: inset 0 calc(-6px * var(--jsp-s)) 0 rgba(0,0,0,0.2), 0 calc(4px * var(--jsp-s)) 0 rgba(0,0,0,0.2);
            transition: transform .1s, filter .15s;
        }
        .jsp-crate:hover { filter: brightness(1.08); }
        .jsp-crate:active { transform: scale(0.96); }
        .jsp-crate.sing { left: calc(482px * var(--jsp-s)); --cc: var(--sing); }
        .jsp-crate.plur { left: calc(578px * var(--jsp-s)); --cc: var(--plur); }
        .jsp-crate.ship { left: calc(530px * var(--jsp-s)); --cc: var(--vert); cursor: default; }
        .jsp-crate b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--jsp-s)); display: block; }
        .jsp-crate .n { position: absolute; top: calc(-10px * var(--jsp-s)); right: calc(-8px * var(--jsp-s)); background: #fff; color: var(--encre); border-radius: 999px; min-width: calc(22px * var(--jsp-s)); padding: 0 calc(5px * var(--jsp-s)); box-sizing: border-box; font-size: calc(12px * var(--jsp-s)); line-height: calc(22px * var(--jsp-s)); box-shadow: 0 2px 0 rgba(0,0,0,0.2); }
        @keyframes jsp-crate-hit { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(4px * var(--jsp-s))) scale(1.04, 0.96); } }
        .jsp-crate.hit { animation: jsp-crate-hit .3s ease; }
        .jsp-container.mode-fix .jsp-crate.sing, .jsp-container.mode-fix .jsp-crate.plur { display: none; }
        .jsp-container:not(.mode-fix) .jsp-crate.ship { display: none; }

        /* Cartes (groupes nominaux) */
        .jsp-card {
            position: absolute; left: 0; bottom: calc(100px * var(--jsp-s));
            background: #fff; color: var(--encre);
            border-radius: calc(10px * var(--jsp-s));
            border: calc(3px * var(--jsp-s)) solid #D9CBB0;
            padding: calc(7px * var(--jsp-s)) calc(12px * var(--jsp-s));
            font-weight: 900; font-size: calc(19px * var(--jsp-s));
            white-space: nowrap;
            box-shadow: 0 calc(4px * var(--jsp-s)) 0 rgba(0,0,0,0.18);
            will-change: transform;
            transform-origin: 50% 100%;
        }
        .jsp-card::before { /* petit carton */
            content: '📦'; position: absolute; left: calc(-6px * var(--jsp-s)); top: calc(-14px * var(--jsp-s));
            font-size: calc(16px * var(--jsp-s));
        }
        .jsp-card.lead { border-color: var(--or); box-shadow: 0 0 0 calc(3px * var(--jsp-s)) rgba(255,201,51,0.45), 0 calc(4px * var(--jsp-s)) 0 rgba(0,0,0,0.18); }
        .jsp-card.dim { opacity: 0.8; }
        .jsp-card.fly { transition: transform .45s cubic-bezier(.4,1.4,.6,1), opacity .45s; }
        .jsp-card.good { border-color: var(--vert); background: #E7FAEF; }
        .jsp-card.bad  { border-color: var(--rouge); background: #FFEDEF; }
        @keyframes jsp-fall { to { transform: translate(var(--fx), calc(160px * var(--jsp-s))) rotate(35deg); opacity: 0; } }
        .jsp-card.falling { animation: jsp-fall .8s ease-in forwards; }

        .jsp-w { display: inline-block; }
        .jsp-w + .jsp-w { margin-left: 0.28em; }
        .jsp-w.el + .jsp-w { margin-left: 0; }
        .jsp-w.det { color: #6A3FD0; }
        .jsp-container.mode-fix .jsp-card.lead .jsp-w.tog {
            cursor: pointer; border-bottom: calc(3px * var(--jsp-s)) dashed #B9B2D6; border-radius: 3px;
            padding: 0 2px; transition: background .12s;
        }
        .jsp-container.mode-fix .jsp-card.lead .jsp-w.tog:hover { background: #FFF3C4; }
        .jsp-container.mode-fix .jsp-card.lead .jsp-w.det { border-bottom: calc(3px * var(--jsp-s)) solid #6A3FD0; }
        @keyframes jsp-flip { 0% { transform: rotateX(0); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
        .jsp-w.flip { animation: jsp-flip .22s ease; }
        @keyframes jsp-no { 0%,100% { transform: translateX(0); } 30% { transform: translateX(-3px); } 70% { transform: translateX(3px); } }
        .jsp-w.no { animation: jsp-no .25s ease; }
        .jsp-container.mode-fix .jsp-card { font-size: calc(22px * var(--jsp-s)); padding: calc(9px * var(--jsp-s)) calc(14px * var(--jsp-s)); }

        .jsp-paused {
            position: absolute; inset: 0; z-index: 8; display: none;
            align-items: center; justify-content: center;
            background: rgba(42,31,74,0.5); color: #fff;
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jsp-s));
            cursor: pointer;
        }
        .jsp-paused.show { display: flex; }
        .jsp-start {
            position: absolute; inset: 0; z-index: 7; display: flex;
            align-items: center; justify-content: center; flex-direction: column; gap: calc(8px * var(--jsp-s));
            background: rgba(42,31,74,0.35);
        }
        .jsp-start.hide { display: none; }
        .jsp-start p { margin: 0; color: #fff; font-weight: 900; font-size: calc(15px * var(--jsp-s)); text-shadow: 0 2px 0 rgba(0,0,0,0.3); text-align: center; max-width: 80%; }

        /* ── Actions ── */
        .jsp-actions { display: flex; gap: calc(8px * var(--jsp-s)); justify-content: center; flex-wrap: wrap; }
        .jsp-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jsp-s));
            padding: calc(8px * var(--jsp-s)) calc(14px * var(--jsp-s));
            border-radius: calc(14px * var(--jsp-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jsp-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jsp-btn:hover { filter: brightness(1.05); }
        .jsp-btn:active { transform: translateY(calc(4px * var(--jsp-s))); box-shadow: 0 calc(1px * var(--jsp-s)) 0 #B9B2D6; }
        .jsp-btn.big {
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(19px * var(--jsp-s)); color: #fff;
            padding: calc(8px * var(--jsp-s)) calc(22px * var(--jsp-s));
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jsp-btn.sing { background: var(--sing); box-shadow: 0 calc(5px * var(--jsp-s)) 0 #1F6FB5; }
        .jsp-btn.plur { background: var(--plur); box-shadow: 0 calc(5px * var(--jsp-s)) 0 #B3470F; }
        .jsp-btn.ok, .jsp-btn.go { background: var(--vert); box-shadow: 0 calc(5px * var(--jsp-s)) 0 #1C8A4F; }
        .jsp-btn.big:active { box-shadow: 0 calc(1px * var(--jsp-s)) 0 rgba(0,0,0,0.3); }
        .jsp-container.mode-fix .jsp-btn.sing, .jsp-container.mode-fix .jsp-btn.plur { display: none; }
        .jsp-container:not(.mode-fix) .jsp-btn.ok { display: none; }
        .jsp-btn:focus-visible, .jsp-lvl:focus-visible, .jsp-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jsp-talk { display: flex; align-items: center; gap: calc(10px * var(--jsp-s)); }
        .jsp-chef {
            width: calc(44px * var(--jsp-s)); height: calc(44px * var(--jsp-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jsp-s));
            box-shadow: 0 calc(3px * var(--jsp-s)) 0 #B3840B;
        }
        @keyframes jsp-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jsp-s))) rotate(-8deg); } }
        .jsp-chef.hop { animation: jsp-hop .4s ease; }
        .jsp-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jsp-s));
            padding: calc(8px * var(--jsp-s)) calc(12px * var(--jsp-s));
            font-weight: 700; font-size: calc(15px * var(--jsp-s)); line-height: 1.35;
            min-height: calc(40px * var(--jsp-s));
            border-left: calc(6px * var(--jsp-s)) solid var(--or);
        }
        .jsp-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jsp-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jsp-msg b { font-weight: 900; }
        .jsp-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; white-space: nowrap; }

        /* ── Fin de partie ── */
        .jsp-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.45);
        }
        .jsp-overlay.show { display: flex; }
        .jsp-card-end {
            background: #fff; border-radius: calc(18px * var(--jsp-s));
            padding: calc(8px * var(--jsp-s)) calc(20px * var(--jsp-s)) calc(10px * var(--jsp-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jsp-s)) 0 #B9B2D6;
            animation: jsp-pop .35s ease-out;
            max-width: 90%; max-height: 94%; overflow-y: auto; box-sizing: border-box;
        }
        @keyframes jsp-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jsp-card-end h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(21px * var(--jsp-s)); color: var(--encre); }
        .jsp-card-end p { margin: calc(2px * var(--jsp-s)) 0 calc(6px * var(--jsp-s)); font-weight: 800; font-size: calc(14px * var(--jsp-s)); }
        .jsp-card-end .jsp-sub { font-size: calc(12px * var(--jsp-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jsp-s)); }
        .jsp-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jsp-s)); margin: calc(4px * var(--jsp-s)) 0; }
        .jsp-bigstars span { font-size: calc(26px * var(--jsp-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jsp-bigstars span.on { opacity: 1; filter: none; animation: jsp-pop .35s ease-out both; }
        .jsp-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jsp-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jsp-medal { font-size: calc(38px * var(--jsp-s)); line-height: 1; animation: jsp-pop .5s ease-out; }
        .jsp-review { text-align: left; font-size: calc(13px * var(--jsp-s)); font-weight: 800; margin: 0 0 calc(8px * var(--jsp-s)); max-height: calc(56px * var(--jsp-s)); overflow-y: auto; }
        .jsp-review div { padding: 1px 0; }
        .jsp-review s { color: var(--rouge); }

        /* ── Aide ── */
        .jsp-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jsp-help.show { display: block; }
        .jsp-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jsp-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jsp-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jsp-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jsp-fallc 1.8s ease-in forwards; }
        @keyframes jsp-fallc { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jsp-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jsp-container:hover .jsp-rh { opacity: 1; }
        .jsp-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jsp-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jsp-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jsp-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jsp-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jsp-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jsp-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jsp-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jsp-container *, .jsp-container *::before, .jsp-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // DONNÉES : noms et adjectifs (singulier / pluriel), déterminants
    // lv = niveau à partir duquel le mot apparaît
    // =========================================================================
    // Noms : [singulier, pluriel, genre, niveau, règle particulière]
    const NOUNS = [
        // Niveau 1 : pluriel régulier en -s
        ['chat', 'chats', 'm', 1], ['chien', 'chiens', 'm', 1], ['livre', 'livres', 'm', 1], ['crayon', 'crayons', 'm', 1],
        ['arbre', 'arbres', 'm', 1], ['vélo', 'vélos', 'm', 1], ['ballon', 'ballons', 'm', 1], ['garçon', 'garçons', 'm', 1],
        ['stylo', 'stylos', 'm', 1], ['jouet', 'jouets', 'm', 1], ['lapin', 'lapins', 'm', 1], ['camion', 'camions', 'm', 1],
        ['ami', 'amis', 'm', 1], ['avion', 'avions', 'm', 1], ['éléphant', 'éléphants', 'm', 1], ['cahier', 'cahiers', 'm', 1],
        ['fille', 'filles', 'f', 1], ['maison', 'maisons', 'f', 1], ['pomme', 'pommes', 'f', 1], ['fleur', 'fleurs', 'f', 1],
        ['table', 'tables', 'f', 1], ['voiture', 'voitures', 'f', 1], ['étoile', 'étoiles', 'f', 1], ['école', 'écoles', 'f', 1],
        ['amie', 'amies', 'f', 1], ['robe', 'robes', 'f', 1], ['porte', 'portes', 'f', 1], ['tortue', 'tortues', 'f', 1],
        ['poupée', 'poupées', 'f', 1], ['chanson', 'chansons', 'f', 1], ['idée', 'idées', 'f', 1], ['orange', 'oranges', 'f', 1],
        // Niveau 2 : -eau/-eu → x, -al → aux, -ou → oux, noms terminés par s, x, z
        ['oiseau', 'oiseaux', 'm', 2, 'x'], ['gâteau', 'gâteaux', 'm', 2, 'x'], ['bateau', 'bateaux', 'm', 2, 'x'],
        ['château', 'châteaux', 'm', 2, 'x'], ['cheveu', 'cheveux', 'm', 2, 'x'], ['jeu', 'jeux', 'm', 2, 'x'],
        ['feu', 'feux', 'm', 2, 'x'], ['cheval', 'chevaux', 'm', 2, 'aux'], ['journal', 'journaux', 'm', 2, 'aux'],
        ['animal', 'animaux', 'm', 2, 'aux'], ['bijou', 'bijoux', 'm', 2, 'oux'], ['genou', 'genoux', 'm', 2, 'oux'],
        ['caillou', 'cailloux', 'm', 2, 'oux'], ['hibou', 'hiboux', 'm', 2, 'oux'], ['nez', 'nez', 'm', 2, 'inv'],
        ['prix', 'prix', 'm', 2, 'inv'], ['bois', 'bois', 'm', 2, 'inv'], ['repas', 'repas', 'm', 2, 'inv'],
        ['tapis', 'tapis', 'm', 2, 'inv'], ['souris', 'souris', 'f', 2, 'inv'], ['noix', 'noix', 'f', 2, 'inv'],
        ['voix', 'voix', 'f', 2, 'inv'], ['croix', 'croix', 'f', 2, 'inv'], ['peau', 'peaux', 'f', 2, 'x'], ['eau', 'eaux', 'f', 2, 'x'],
        // Niveau 3 : pluriels irréguliers et exceptions
        ['œil', 'yeux', 'm', 3, 'irr'], ['travail', 'travaux', 'm', 3, 'ail'], ['vitrail', 'vitraux', 'm', 3, 'ail'],
        ['corail', 'coraux', 'm', 3, 'ail'], ['pneu', 'pneus', 'm', 3, 'exc'], ['bal', 'bals', 'm', 3, 'exc'],
        ['festival', 'festivals', 'm', 3, 'exc'], ['carnaval', 'carnavals', 'm', 3, 'exc'], ['clou', 'clous', 'm', 3, 'exc'],
        ['trou', 'trous', 'm', 3, 'exc'], ['kangourou', 'kangourous', 'm', 3, 'exc'], ['chou', 'choux', 'm', 3, 'oux'],
        ['pou', 'poux', 'm', 3, 'oux'], ['bleu', 'bleus', 'm', 3, 'exc'], ['récital', 'récitals', 'm', 3, 'exc'],
    ];
    // Adjectifs : [masc. sing., masc. plur., fém. sing., fém. plur., place (a = après, b = avant), niveau]
    const ADJS = [
        ['noir', 'noirs', 'noire', 'noires', 'a', 1], ['vert', 'verts', 'verte', 'vertes', 'a', 1],
        ['petit', 'petits', 'petite', 'petites', 'b', 1], ['grand', 'grands', 'grande', 'grandes', 'b', 1],
        ['joli', 'jolis', 'jolie', 'jolies', 'b', 1], ['rouge', 'rouges', 'rouge', 'rouges', 'a', 1],
        ['jaune', 'jaunes', 'jaune', 'jaunes', 'a', 1], ['rapide', 'rapides', 'rapide', 'rapides', 'a', 1],
        ['drôle', 'drôles', 'drôle', 'drôles', 'a', 1], ['bleu', 'bleus', 'bleue', 'bleues', 'a', 1],
        ['rond', 'ronds', 'ronde', 'rondes', 'a', 1], ['neuf', 'neufs', 'neuve', 'neuves', 'a', 1],
        ['gris', 'gris', 'grise', 'grises', 'a', 2], ['gros', 'gros', 'grosse', 'grosses', 'b', 2],
        ['heureux', 'heureux', 'heureuse', 'heureuses', 'a', 2], ['beau', 'beaux', 'belle', 'belles', 'b', 2],
        ['nouveau', 'nouveaux', 'nouvelle', 'nouvelles', 'b', 2], ['gentil', 'gentils', 'gentille', 'gentilles', 'a', 2],
        ['blanc', 'blancs', 'blanche', 'blanches', 'a', 2], ['mauvais', 'mauvais', 'mauvaise', 'mauvaises', 'b', 2],
        ['génial', 'géniaux', 'géniale', 'géniales', 'a', 3], ['vieux', 'vieux', 'vieille', 'vieilles', 'b', 3],
        ['doux', 'doux', 'douce', 'douces', 'a', 3], ['royal', 'royaux', 'royale', 'royales', 'a', 3],
        ['jaloux', 'jaloux', 'jalouse', 'jalouses', 'a', 3], ['original', 'originaux', 'originale', 'originales', 'a', 3],
        ['frais', 'frais', 'fraîche', 'fraîches', 'a', 3], ['long', 'longs', 'longue', 'longues', 'b', 3],
    ];
    // Adjectifs qui changent de forme devant une voyelle (bel, nouvel, vieil) : on les évite devant voyelle
    const NO_BEFORE_VOWEL = ['beau', 'nouveau', 'vieux'];
    const DET = {
        m:  ['le', 'un', 'mon', 'ton', 'son', 'ce', 'notre', 'leur'],
        mv: ['l\'', 'un', 'mon', 'ton', 'son', 'cet', 'notre', 'leur'],
        f:  ['la', 'une', 'ma', 'ta', 'sa', 'cette', 'notre', 'leur'],
        fv: ['l\'', 'une', 'mon', 'ton', 'son', 'cette', 'notre', 'leur'],
        p:  ['les', 'des', 'mes', 'tes', 'ses', 'ces', 'nos', 'leurs', 'deux', 'trois', 'quatre', 'quelques', 'plusieurs'],
    };
    const RULES = {
        x:   (s, p) => `les noms en <b>-eau</b> et <b>-eu</b> prennent un <b>x</b> au pluriel (${s} → ${p}).`,
        aux: (s, p) => `les noms en <b>-al</b> font leur pluriel en <b>-aux</b> (${s} → ${p}).`,
        oux: (s, p) => `7 noms en <b>-ou</b> prennent un <b>x</b> : bijou, caillou, chou, genou, hibou, joujou, pou (${s} → ${p}).`,
        inv: (s) => `« ${s} » se termine déjà par <b>s, x ou z</b> : il ne change pas au pluriel !`,
        ail: (s, p) => `quelques noms en <b>-ail</b> font <b>-aux</b> (${s} → ${p}).`,
        irr: (s, p) => `pluriel très irrégulier : un ${s} → des ${p} !`,
        exc: (s, p) => `c'est une exception : ${s} → ${p} (avec un simple <b>s</b>).`,
    };
    const JSP_LEVELS = {
        1: { sort: 52, fix: 18, adj: 0.45, adj2: 0,    label: 'pluriels en -s' },
        2: { sort: 64, fix: 21, adj: 0.6,  adj2: 0.15, label: '-x, -aux, noms invariables' },
        3: { sort: 76, fix: 24, adj: 0.7,  adj2: 0.25, label: 'exceptions et pluriels irréguliers' },
    };
    const CARDS = { sort: 16, fix: 10 };
    const BELT_END = 468;
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];

    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const isVowel = (w) => /^[aeiouyàâäéèêëîïôöùûüœ]/i.test(w);
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // ── Fabrication d'un groupe nominal ────────────────────────────────────
    // Renvoie { n: 'sg'|'pl', words: [{ sg, pl, det, noun, rule }] }
    function makeGN(level, lastNoun) {
        const L = JSP_LEVELS[level];
        const pool = NOUNS.filter(x => x[3] <= level);
        const fresh = pool.filter(x => x[3] === level);
        let N;
        do { N = (level > 1 && Math.random() < 0.6) ? rnd(fresh) : rnd(pool); } while (N[0] === lastNoun && pool.length > 1);
        const [ns, np, g, , rule] = N;
        const adjPool = ADJS.filter(a => a[5] <= level);
        const words = [];
        let before = null, after = null;
        if (Math.random() < L.adj) {
            const a = rnd(adjPool);
            if (a[4] === 'b' && !(NO_BEFORE_VOWEL.includes(a[0]) && isVowel(ns))) before = a;
            else if (a[4] === 'a') after = a;
        }
        if (Math.random() < L.adj2) {
            const a2 = rnd(adjPool.filter(a => a[4] === 'a' && a !== after));
            if (a2 && !after) after = a2;
        }
        const n = Math.random() < 0.5 ? 'sg' : 'pl';
        const first = before ? (g === 'm' ? before[0] : before[2]) : ns;
        // Déterminant
        let dets = n === 'pl' ? DET.p.slice() : DET[g + (isVowel(first) ? 'v' : '')];
        if (n === 'pl' && before) dets = dets.filter(d => d !== 'des');   // « de petits chiens » : on évite
        const d = rnd(dets);
        words.push({ sg: d, pl: d, det: true });
        if (before) words.push({ sg: g === 'm' ? before[0] : before[2], pl: g === 'm' ? before[1] : before[3] });
        words.push({ sg: ns, pl: np, noun: true, rule });
        if (after) words.push({ sg: g === 'm' ? after[0] : after[2], pl: g === 'm' ? after[1] : after[3] });
        return { n, words, noun: ns };
    }
    function gnText(gn, forms) {
        return gn.words.map((w, i) => {
            const f = forms ? forms[i] : gn.n;
            const t = w[f];
            return t;
        }).join(' ').replace(/' /g, '\'');
    }

    // ── Sons ───────────────────────────────────────────────────────────────
    let _jspAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jspAudio) _jspAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jspAudio, t0 = ctx.currentTime + start;
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
        good:  () => { tone(660, 0, 0.08, 'triangle', 0.09); tone(990, 0.07, 0.12, 'triangle', 0.08); },
        bad:   () => { tone(200, 0, 0.18, 'square', 0.05); tone(150, 0.16, 0.22, 'square', 0.05); },
        flip:  () => tone(880, 0, 0.05, 'triangle', 0.05),
        fall:  () => { tone(500, 0, 0.3, 'sawtooth', 0.04); tone(120, 0.25, 0.2, 'triangle', 0.08); },
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
        start: () => [392, 523].forEach((f, i) => tone(f, 0.1 * i, 0.12, 'triangle', 0.08)),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuSingPlurWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-sing-plur';
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
        container.className = 'jsp-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jsp-inner">
            <div class="jsp-header">
                <span class="jsp-title">Singulier / pluriel express</span>
                <div class="jsp-stats">
                    <span class="jsp-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="jsp-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jsp-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jsp-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jsp-bar">
                <button class="jsp-lvl active" data-level="1">😊 Facile</button>
                <button class="jsp-lvl" data-level="2">😐 Moyen</button>
                <button class="jsp-lvl" data-level="3">😤 Difficile</button>
                <select class="jsp-select" title="Choisir le jeu">
                    <option value="sort">🧺 Trier</option>
                    <option value="fix">✏️ Corriger l'accord</option>
                </select>
                <div class="jsp-count"><span data-role="num">0 / 16</span><span class="ok" data-role="ok">✔ 0</span><span class="ko" data-role="ko">✘ 0</span></div>
            </div>

            <div class="jsp-scene">
                <div class="jsp-sign">🏭 Usine des accords</div>
                <div class="jsp-lamp off"></div>
                <div class="jsp-legs"></div>
                <div class="jsp-belt"></div>
                <div class="jsp-end" title="Fin du tapis"></div>
                <div class="jsp-crate sing" data-crate="sg" title="Singulier (touche S ou ←)"><span class="n">0</span><b>1</b>SINGULIER</div>
                <div class="jsp-crate plur" data-crate="pl" title="Pluriel (touche P ou →)"><span class="n">0</span><b>1+</b>PLURIEL</div>
                <div class="jsp-crate ship"><span class="n">0</span><b>✔</b>COLIS<br>VÉRIFIÉS</div>
                <div class="jsp-cards"></div>
                <div class="jsp-start"><button class="jsp-btn big go" data-act="go">▶ Démarrer le tapis</button><p data-role="startTxt"></p></div>
                <div class="jsp-paused" title="Clique pour reprendre">⏸ Pause</div>
                <div class="jsp-overlay" data-role="win"><div class="jsp-card-end"></div></div>
            </div>

            <div class="jsp-actions">
                <button class="jsp-btn big sing" data-act="sg">◀ Singulier</button>
                <button class="jsp-btn big plur" data-act="pl">Pluriel ▶</button>
                <button class="jsp-btn big ok" data-act="check">✔ C'est bien accordé !</button>
                <button class="jsp-btn" data-act="pause">⏸ Pause</button>
                <button class="jsp-btn" data-act="restart">🔄 Recommencer</button>
            </div>

            <div class="jsp-talk">
                <div class="jsp-chef">👷</div>
                <div class="jsp-msg"></div>
            </div>
          </div>

            <div class="jsp-help">
                <h4>🏭 Comment jouer ?</h4>
                <p>Des colis arrivent sur le tapis roulant. Chacun porte un <b>groupe nominal</b> (un déterminant, un nom, parfois un adjectif).</p>
                <p>🧺 <b>Trier</b> : range le colis dans la caisse <b>Singulier</b> ou <b>Pluriel</b> avant qu'il tombe du tapis. Boutons, clic sur les caisses, ou touches ← / → (S / P).</p>
                <p>✏️ <b>Corriger</b> : le <b>déterminant</b> (en violet) dit s'il y en a un ou plusieurs. Clique sur les mots mal accordés pour les changer, puis sur <b>✔ C'est bien accordé</b> (ou Entrée). Attention : certains colis sont déjà justes !</p>
                <p>😊 <b>Facile</b> : pluriels en -s.<br>😐 <b>Moyen</b> : -eau, -eu, -al, -ou, noms en s, x, z.<br>😤 <b>Difficile</b> : exceptions (pneus, bals, yeux, travaux…).</p>
                <p style="margin:0">Le colis à traiter brille en jaune. Le tapis accélère petit à petit !</p>
            </div>
            <div class="jsp-confetti"></div>
            <div class="jsp-rh jsp-rh-nw" data-dir="nw"></div>
            <div class="jsp-rh jsp-rh-n"  data-dir="n"></div>
            <div class="jsp-rh jsp-rh-ne" data-dir="ne"></div>
            <div class="jsp-rh jsp-rh-e"  data-dir="e"></div>
            <div class="jsp-rh jsp-rh-se" data-dir="se"></div>
            <div class="jsp-rh jsp-rh-s"  data-dir="s"></div>
            <div class="jsp-rh jsp-rh-sw" data-dir="sw"></div>
            <div class="jsp-rh jsp-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jsp-inner');
        const cardsEl   = $('.jsp-cards');
        const beltEl    = $('.jsp-belt');
        const lamp      = $('.jsp-lamp');
        const crateSg   = $('.jsp-crate.sing'), cratePl = $('.jsp-crate.plur'), crateShip = $('.jsp-crate.ship');
        const startLay  = $('.jsp-start');
        const startTxt  = $('[data-role="startTxt"]');
        const pausedEl  = $('.jsp-paused');
        const msg       = $('.jsp-msg');
        const chef      = $('.jsp-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jsp-card-end');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const numEl     = $('[data-role="num"]');
        const okEl      = $('[data-role="ok"]');
        const koEl      = $('[data-role="ko"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jsp-help');
        const confetti  = $('.jsp-confetti');
        const modeSel   = $('.jsp-select');
        const lvlBtns   = container.querySelectorAll('.jsp-lvl');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1, mode = 'sort';
        let cards = [];              // { el, x, w, gn, forms, done }
        let spawned = 0, handled = 0, good = 0, bad = 0;
        let score = 0, streak = 0;
        let running = false, paused = false;
        let mistakes = [];
        let lastNoun = '';
        let curScale = 1, beltOffset = 0;
        let soundOn = true;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jsp-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            curScale = sc;
            container.style.setProperty('--jsp-s', sc.toFixed(4));
            cards.forEach(c => { c.w = c.el.offsetWidth / sc; if (!c.done) place(c); });
        }

        // ── Messages / compteurs ───────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jsp-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateCounts(bump) {
            const total = CARDS[mode];
            numEl.textContent = `${Math.min(handled, total)} / ${total}`;
            okEl.textContent = '✔ ' + good;
            koEl.textContent = '✘ ' + bad;
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
        }
        function setCrateCount(el, n) { el.querySelector('.n').textContent = n; }
        function hitCrate(el) {
            setCrateCount(el, +el.querySelector('.n').textContent + 1);
            el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
        }

        // ── Cartes ─────────────────────────────────────────────────────────
        function place(c) { c.el.style.transform = `translateX(${(c.x * curScale).toFixed(1)}px)`; }
        function lead() { return cards.find(c => !c.done); }
        function renderCard(c) {
            c.el.innerHTML = c.gn.words.map((w, i) => {
                const t = w[c.forms[i]];
                const cls = ['jsp-w'];
                if (w.det) cls.push('det');
                else if (w.sg !== w.pl) cls.push('tog');
                else cls.push('tog', 'inv');
                if (t.endsWith('\'')) cls.push('el');
                return `<span class="${cls.join(' ')}" data-i="${i}">${esc(t)}</span>`;
            }).join('');
        }
        function spawn() {
            const gn = makeGN(level, lastNoun);
            lastNoun = gn.noun;
            // En mode correction : 1 ou 2 mots mal accordés (sauf 1 fois sur 4 : colis déjà juste)
            const forms = gn.words.map(() => gn.n);
            if (mode === 'fix' && Math.random() > 0.25) {
                const idx = gn.words.map((w, i) => i).filter(i => !gn.words[i].det && gn.words[i].sg !== gn.words[i].pl);
                const other = gn.n === 'sg' ? 'pl' : 'sg';
                idx.sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.6 ? 1 : 2).forEach(i => { forms[i] = other; });
            }
            const el = document.createElement('div');
            el.className = 'jsp-card';
            const c = { el, gn, forms, x: 0, w: 0, done: false };
            renderCard(c);
            cardsEl.appendChild(el);
            c.w = el.offsetWidth / curScale;
            c.x = -c.w - 10;
            place(c);
            el.addEventListener('pointerdown', (e) => {
                const wEl = e.target.closest('.jsp-w');
                if (mode !== 'fix' || !wEl || c !== lead() || !running || paused) return;
                e.stopPropagation(); e.preventDefault();
                toggleWord(c, +wEl.dataset.i, wEl);
            });
            cards.push(c);
            spawned++;
            markLead();
        }
        function markLead() {
            const L = lead();
            cards.forEach(c => { if (!c.done) { c.el.classList.toggle('lead', c === L); c.el.classList.toggle('dim', c !== L); } });
        }
        function toggleWord(c, i, wEl) {
            const w = c.gn.words[i];
            if (w.det) { say(`🔒 Le déterminant « <b>${esc(w.sg)}</b> » ne change pas : c'est lui qui donne le nombre !`); wEl.classList.remove('no'); void wEl.offsetWidth; wEl.classList.add('no'); return; }
            if (w.sg === w.pl) { say(`« <b>${esc(w.sg)}</b> » s'écrit pareil au singulier et au pluriel.`); wEl.classList.remove('no'); void wEl.offsetWidth; wEl.classList.add('no'); return; }
            c.forms[i] = c.forms[i] === 'sg' ? 'pl' : 'sg';
            sfx('flip');
            renderCard(c);
            const nw = c.el.querySelector(`[data-i="${i}"]`);
            if (nw) nw.classList.add('flip');
            c.w = c.el.offsetWidth / curScale;
        }

        // ── Explications ───────────────────────────────────────────────────
        function explain(gn) {
            const d = gn.words[0].sg;
            const nounW = gn.words.find(w => w.noun);
            let t = /^(deux|trois|quatre|quelques|plusieurs)$/.test(d)
                ? `« <b>${esc(d)}</b> » veut dire qu'il y en a plusieurs : c'est le <b>pluriel</b>.`
                : `« <b>${esc(d)}</b> » est un déterminant <b>${gn.n === 'sg' ? 'singulier' : 'pluriel'}</b>.`;
            if (nounW.rule && RULES[nounW.rule]) t += ' Attention : ' + RULES[nounW.rule](nounW.sg, nounW.pl);
            return t;
        }

        // ── Réponses ───────────────────────────────────────────────────────
        function answerSort(n) {
            if (!running || paused || mode !== 'sort') return;
            const c = lead();
            if (!c) return;
            c.done = true;
            const ok = n === c.gn.n;
            const crate = n === 'sg' ? crateSg : cratePl;
            finishCard(c, ok, crate, ok ? '' : `C'était du <b>${c.gn.n === 'sg' ? 'singulier' : 'pluriel'}</b>.`);
        }
        function answerFix() {
            if (!running || paused || mode !== 'fix') return;
            const c = lead();
            if (!c) return;
            c.done = true;
            const ok = c.forms.every((f, i) => c.gn.words[i].det || c.gn.words[i].sg === c.gn.words[i].pl || f === c.gn.n);
            finishCard(c, ok, crateShip, ok ? '' : `Il fallait écrire : <span class="k">${esc(gnText(c.gn))}</span>.`);
        }
        function finishCard(c, ok, crate, wrongTxt) {
            handled++;
            const pts = ok ? 10 + Math.max(0, Math.round((1 - (c.x + c.w) / BELT_END) * 5)) + (streak >= 2 ? 2 : 0) : 0;
            if (ok) { good++; streak++; score += pts; sfx('good'); }
            else {
                bad++; streak = 0; sfx('bad');
                lamp.classList.remove('alarm'); void lamp.offsetWidth; lamp.classList.add('alarm');
                mistakes.push({ shown: mode === 'fix' ? gnText(c.gn, c.forms) : gnText(c.gn), right: gnText(c.gn), n: c.gn.n });
            }
            c.el.classList.add(ok ? 'good' : 'bad', 'fly');
            c.el.classList.remove('lead', 'dim');
            // Voler vers la caisse (ou tomber si mal placé)
            if (ok || mode === 'sort') {
                const r = crate.getBoundingClientRect(), s = cardsEl.getBoundingClientRect();
                const k = r.width / crate.offsetWidth || 1;   // zoom éventuel
                const tx = (r.left - s.left) / k + crate.offsetWidth / 2 - c.el.offsetWidth / 2;
                c.el.style.transform = `translate(${tx}px, ${-8 * curScale}px) scale(0.5)`;
                c.el.style.opacity = '0';
                setTimeout(() => { c.el.remove(); hitCrate(crate); }, 450);
            } else {
                c.el.classList.remove('fly');
                c.el.style.setProperty('--fx', (c.x * curScale + 60 * curScale) + 'px');
                c.el.classList.add('falling');
                setTimeout(() => c.el.remove(), 800);
            }
            updateCounts(ok);
            say(ok
                ? `✅ ${rnd(['Bravo', 'Exact', 'Parfait', 'Bien vu', 'Super'])} ! <span class="k">${esc(gnText(c.gn))}</span> +${pts}${streak >= 3 ? ' 🔥' : ''}<br><small>${explain(c.gn)}</small>`
                : `❌ ${wrongTxt} <small>${explain(c.gn)}</small>`, ok ? 'good' : 'bad');
            cards = cards.filter(x => x !== c);
            markLead();
            checkEnd();
        }
        function dropCard(c) {
            // Le colis arrive au bout du tapis sans réponse
            c.done = true;
            handled++; bad++; streak = 0;
            sfx('fall');
            lamp.classList.remove('alarm'); void lamp.offsetWidth; lamp.classList.add('alarm');
            mistakes.push({ shown: mode === 'fix' ? gnText(c.gn, c.forms) : gnText(c.gn), right: gnText(c.gn), n: c.gn.n, late: true });
            c.el.classList.remove('lead', 'dim');
            c.el.classList.add('bad');
            c.el.style.setProperty('--fx', (c.x * curScale + 40 * curScale) + 'px');
            c.el.classList.add('falling');
            setTimeout(() => c.el.remove(), 800);
            updateCounts(false);
            say(`💥 Trop tard, le colis est tombé ! ${mode === 'fix' ? `Il fallait : <span class="k">${esc(gnText(c.gn))}</span>. ` : `C'était du <b>${c.gn.n === 'sg' ? 'singulier' : 'pluriel'}</b>. `}<small>${explain(c.gn)}</small>`, 'bad');
            cards = cards.filter(x => x !== c);
            markLead();
            checkEnd();
        }
        function checkEnd() {
            if (handled >= CARDS[mode]) setTimeout(endRound, 700);
        }

        // ── Boucle du tapis ────────────────────────────────────────────────
        let lastT = performance.now();
        function frame(t) {
            if (!widget.isConnected) return;
            const dt = Math.min(0.05, (t - lastT) / 1000);
            lastT = t;
            const frozen = !running || paused || helpBox.classList.contains('show') || document.hidden;
            if (!frozen) {
                const L = JSP_LEVELS[level];
                const base = mode === 'sort' ? L.sort : L.fix;
                const v = base * (1 + handled * 0.03);
                beltOffset = (beltOffset + v * dt) % 28;
                beltEl.style.backgroundPosition = `${(beltOffset * curScale).toFixed(1)}px 0`;
                const live = cards.filter(c => !c.done);
                // Un colis qui entre arrive vite sur le tapis, puis avance à la vitesse normale
                live.forEach(c => { c.x += (c.x < 8 ? Math.max(v, 260) : v) * dt; place(c); });
                const L0 = lead();
                if (L0 && L0.x + L0.w > BELT_END) dropCard(L0);
                // Nouveau colis quand il y a de la place
                const last = live[live.length - 1];
                const gap = mode === 'sort' ? 70 : 150;
                if (spawned < CARDS[mode] && (!last || last.x > gap)) spawn();
            }
            requestAnimationFrame(frame);
        }

        // ── Parties ────────────────────────────────────────────────────────
        function resetRound() {
            running = false; paused = false;
            cards.forEach(c => c.el.remove());
            cards = []; spawned = 0; handled = 0; good = 0; bad = 0; mistakes = [];
            streak = 0;
            [crateSg, cratePl, crateShip].forEach(el => setCrateCount(el, 0));
            winLayer.classList.remove('show');
            pausedEl.classList.remove('show');
            btn('pause').textContent = '⏸ Pause';
            startLay.classList.remove('hide');
            lamp.classList.add('off');
            container.classList.toggle('mode-fix', mode === 'fix');
            startTxt.textContent = mode === 'sort'
                ? `${CARDS.sort} colis à ranger : singulier ou pluriel ? (${JSP_LEVELS[level].label})`
                : `${CARDS.fix} colis à vérifier : corrige les mots mal accordés ! (${JSP_LEVELS[level].label})`;
            updateCounts(false);
            say(mode === 'sort'
                ? '👷 Range chaque colis dans la bonne caisse avant qu\'il tombe du tapis. Regarde bien le <b>déterminant</b> !'
                : '👷 Le déterminant (en violet) donne le nombre. Clique sur les mots mal accordés pour les corriger.');
        }
        function startRound() {
            container.focus({ preventScroll: true });
            startLay.classList.add('hide');
            lamp.classList.remove('off');
            running = true;
            sfx('start');
            lastT = performance.now();
            spawn();
        }
        function endRound() {
            if (!running) return;
            running = false;
            lamp.classList.add('off');
            const total = CARDS[mode];
            const pct = good / total;
            const st = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.4 ? 1 : 0;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : st === 1 ? '🥉' : '🧰';
            const title = st === 3 ? 'Chef d\'usine !' : st === 2 ? 'Très bon travail !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const review = mistakes.slice(0, 8).map(m =>
                (mode === 'fix'
                    ? `<div>${m.late ? '⏱' : '✘'} <s>${esc(m.shown)}</s> → <b>${esc(m.right)}</b></div>`
                    : `<div>${m.late ? '⏱' : '✘'} ${esc(m.right)} → <b>${m.n === 'sg' ? 'singulier' : 'pluriel'}</b></div>`)).join('');
            winCard.innerHTML = `
                <div class="jsp-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jsp-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${total} · ${score} points</p>
                ${review ? `<p class="jsp-sub">À revoir :</p><div class="jsp-review">${review}</div>` : ''}
                <button class="jsp-btn big go" data-act="again">🔄 Rejouer</button>`;
            winLayer.classList.add('show');
            if (st >= 2) { sfx('win'); party(); }
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
            say(`🏁 Fin du tapis : ${good} sur ${total} !${bad ? ' Regarde les colis à revoir.' : ' Aucune erreur, bravo !'}`, st >= 2 ? 'good' : '');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); resetRound(); startRound(); });
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
        function setPaused(p) {
            if (!running) return;
            paused = p;
            pausedEl.classList.toggle('show', p);
            btn('pause').textContent = p ? '▶ Reprendre' : '⏸ Pause';
        }

        // ── Commandes ──────────────────────────────────────────────────────
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            score = 0;
            resetRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        modeSel.addEventListener('change', () => { mode = modeSel.value; score = 0; resetRound(); });
        modeSel.addEventListener('pointerdown', (e) => e.stopPropagation());
        modeSel.addEventListener('mousedown', (e) => e.stopPropagation());
        btn('go').addEventListener('click', (e) => { e.stopPropagation(); startRound(); });
        btn('sg').addEventListener('click', () => answerSort('sg'));
        btn('pl').addEventListener('click', () => answerSort('pl'));
        btn('check').addEventListener('click', answerFix);
        btn('pause').addEventListener('click', () => setPaused(!paused));
        btn('restart').addEventListener('click', () => { score = 0; resetRound(); });
        crateSg.addEventListener('click', () => answerSort('sg'));
        cratePl.addEventListener('click', () => answerSort('pl'));
        pausedEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); setPaused(false); });

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if (!running) {
                if ((k === 'enter' || k === ' ') && !startLay.classList.contains('hide')) { e.preventDefault(); startRound(); }
                return;
            }
            if (mode === 'sort' && (k === 'arrowleft' || k === 's')) { e.preventDefault(); answerSort('sg'); }
            else if (mode === 'sort' && (k === 'arrowright' || k === 'p')) { e.preventDefault(); answerSort('pl'); }
            else if (mode === 'fix' && k === 'enter') { e.preventDefault(); answerFix(); }
            else if (k === ' ') { e.preventDefault(); setPaused(!paused); }
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
            setPaused(true);
            window._wfMiniBarCollapse(widget, '🏭 Singulier / pluriel express', { onExpand: applyScale });
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
        container.querySelectorAll('.jsp-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, .jsp-scene, .jsp-rh, .jsp-help')) {
                e.stopPropagation();
                if (!e.target.closest('select')) container.focus({ preventScroll: true });
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
            container.focus({ preventScroll: true });
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
            if (type === 'jeu-sing-plur') return window.createJeuSingPlurWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-sing-plur') return window.createJeuSingPlurWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
