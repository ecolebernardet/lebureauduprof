// =========================================================================
// JEU « SIMON » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux divers » — mode jeu élèves
//
// Jeu de mémoire séquentielle : Simon allume une suite de touches (lumière
// + son), l'élève la répète. À chaque réussite, la suite s'allonge.
// Thèmes : couleurs (avec symboles), notes de musique, animaux, chiffres.
// Mode « à l'envers » : répéter la suite en commençant par la fin.
// 3 niveaux : facile   (4 touches, lent, 3 vies, 3 réécoutes)
//             moyen    (4 touches, plus rapide, 2 vies, 1 réécoute)
//             difficile(6 touches, rapide, 1 vie)
// Record gardé dans le navigateur (localStorage).
//
// Ouverture : createWidget('jeu-simon')
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


    // ── CSS du jeu (préfixe jsm-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-simon-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-simon-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-simon"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jsm-container {
            --jsm-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jsm-s)) calc(14px * var(--jsm-s)) calc(14px * var(--jsm-s));
            border-radius: calc(24px * var(--jsm-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jsm-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jsm-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jsm-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jsm-s));
            width: 100%; max-width: calc(672px * var(--jsm-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jsm-header { display: flex; align-items: center; gap: calc(10px * var(--jsm-s)); cursor: move; flex-wrap: wrap; }
        .jsm-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jsm-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jsm-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jsm-stats { display: flex; gap: calc(6px * var(--jsm-s)); align-items: center; margin-left: auto; }
        .jsm-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jsm-s)) calc(10px * var(--jsm-s));
            font-weight: 900; font-size: calc(14px * var(--jsm-s));
            white-space: nowrap;
        }
        .jsm-chip.gold { background: var(--or); color: var(--encre); }
        @keyframes jsm-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jsm-chip.bump { animation: jsm-bump .4s ease; }
        .jsm-icon-btn {
            width: calc(26px * var(--jsm-s)); height: calc(26px * var(--jsm-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jsm-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jsm-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + mode ── */
        .jsm-bar { display: flex; align-items: center; gap: calc(6px * var(--jsm-s)); flex-wrap: wrap; }
        .jsm-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jsm-s));
            padding: calc(5px * var(--jsm-s)) calc(12px * var(--jsm-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jsm-lvl:hover { background: rgba(255,255,255,0.1); }
        .jsm-lvl:active { transform: scale(0.95); }
        .jsm-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jsm-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jsm-s));
            padding: calc(4px * var(--jsm-s)) calc(8px * var(--jsm-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }
        .jsm-select.right { margin-left: auto; }

        /* ── Scène ── */
        .jsm-stage {
            position: relative;
            height: calc(376px * var(--jsm-s));
            border-radius: calc(18px * var(--jsm-s));
            overflow: hidden;
            background:
                radial-gradient(circle at 50% calc(174px * var(--jsm-s)), rgba(255,255,255,0.10) 0 calc(170px * var(--jsm-s)), transparent calc(171px * var(--jsm-s))),
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jsm-s)), transparent calc(2px * var(--jsm-s))) 0 0 / calc(24px * var(--jsm-s)) calc(24px * var(--jsm-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; align-items: flex-start; justify-content: center;
            padding-top: calc(14px * var(--jsm-s)); box-sizing: border-box;
        }
        .jsm-device {
            width: calc(320px * var(--jsm-s)); height: calc(320px * var(--jsm-s));
            border-radius: 50%;
            background: #1C1433;
            box-shadow: 0 calc(10px * var(--jsm-s)) 0 #120C24, 0 0 0 calc(8px * var(--jsm-s)) #2F2455, 0 calc(18px * var(--jsm-s)) calc(40px * var(--jsm-s)) rgba(0,0,0,0.4);
            position: relative;
        }
        .jsm-device svg { width: 100%; height: 100%; display: block; overflow: visible; }
        .jsm-pad { cursor: pointer; transition: filter .12s, transform .12s; transform-origin: 0 0; filter: brightness(0.62) saturate(0.85); }
        .jsm-pad:hover { filter: brightness(0.75) saturate(0.95); }
        .jsm-pad.lit { filter: brightness(1.2) saturate(1.1) drop-shadow(0 0 8px rgba(255,255,255,0.8)); transform: scale(1.035); }
        .jsm-pad.bad { filter: brightness(1) grayscale(0.2) drop-shadow(0 0 10px #FF4F5E); }
        .jsm-device.locked .jsm-pad { cursor: default; }
        .jsm-device.locked .jsm-pad:not(.lit):hover { filter: brightness(0.62) saturate(0.85); }
        .jsm-label { pointer-events: none; font-family: 'Lilita One', 'Nunito', sans-serif; fill: #fff; text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: rgba(0,0,0,0.25); stroke-width: 2px; }
        .jsm-center-bg { fill: #2A1F4A; stroke: #120C24; stroke-width: 3; }
        .jsm-center-title { font-family: 'Lilita One', sans-serif; fill: var(--or); text-anchor: middle; font-size: 15px; letter-spacing: 1px; }
        .jsm-center-num { font-family: 'Lilita One', sans-serif; fill: #fff; text-anchor: middle; dominant-baseline: central; font-size: 34px; }
        .jsm-center-state { font-family: 'Nunito', sans-serif; font-weight: 900; fill: rgba(255,255,255,0.75); text-anchor: middle; font-size: 10px; }
        @keyframes jsm-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .jsm-center.go { animation: jsm-pulse .8s ease-in-out infinite; transform-origin: 0 0; }

        /* Panneaux latéraux */
        .jsm-side {
            position: absolute; top: calc(16px * var(--jsm-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--jsm-s));
            color: #fff; font-weight: 900; font-size: calc(13px * var(--jsm-s));
        }
        .jsm-side.left { left: calc(16px * var(--jsm-s)); }
        .jsm-side.right { right: calc(16px * var(--jsm-s)); align-items: flex-end; }
        .jsm-box {
            background: rgba(0,0,0,0.25); border-radius: calc(12px * var(--jsm-s));
            padding: calc(6px * var(--jsm-s)) calc(10px * var(--jsm-s));
            text-align: center; min-width: calc(86px * var(--jsm-s));
        }
        .jsm-box small { display: block; font-size: calc(10px * var(--jsm-s)); opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; }
        .jsm-box b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jsm-s)); line-height: 1.1; }
        .jsm-lives { font-size: calc(18px * var(--jsm-s)); letter-spacing: 2px; }
        .jsm-lives .off { opacity: 0.2; filter: grayscale(1); }
        .jsm-dots {
            position: absolute; left: 50%; bottom: calc(10px * var(--jsm-s)); transform: translateX(-50%);
            display: flex; gap: calc(4px * var(--jsm-s)); flex-wrap: wrap; justify-content: center;
            max-width: 80%;
        }
        .jsm-dot { width: calc(10px * var(--jsm-s)); height: calc(10px * var(--jsm-s)); border-radius: 50%; background: rgba(255,255,255,0.18); }
        .jsm-dot.ok { background: var(--vert); }
        .jsm-dot.ko { background: var(--rouge); }
        .jsm-dot.show { background: var(--or); }

        /* ── Actions ── */
        .jsm-actions { display: flex; gap: calc(8px * var(--jsm-s)); justify-content: center; flex-wrap: wrap; }
        .jsm-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jsm-s));
            padding: calc(8px * var(--jsm-s)) calc(14px * var(--jsm-s));
            border-radius: calc(14px * var(--jsm-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jsm-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jsm-btn:hover { filter: brightness(1.05); }
        .jsm-btn:active { transform: translateY(calc(4px * var(--jsm-s))); box-shadow: 0 calc(1px * var(--jsm-s)) 0 #B9B2D6; }
        .jsm-btn:disabled { opacity: 0.45; cursor: default; transform: none; }
        .jsm-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jsm-s));
            padding: calc(8px * var(--jsm-s)) calc(22px * var(--jsm-s));
            box-shadow: 0 calc(5px * var(--jsm-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jsm-btn-go:active { box-shadow: 0 calc(1px * var(--jsm-s)) 0 #1C8A4F; }
        .jsm-btn:focus-visible, .jsm-lvl:focus-visible, .jsm-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jsm-talk { display: flex; align-items: center; gap: calc(10px * var(--jsm-s)); }
        .jsm-chef {
            width: calc(44px * var(--jsm-s)); height: calc(44px * var(--jsm-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jsm-s));
            box-shadow: 0 calc(3px * var(--jsm-s)) 0 #B3840B;
        }
        @keyframes jsm-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jsm-s))) rotate(-8deg); } }
        .jsm-chef.hop { animation: jsm-hop .4s ease; }
        .jsm-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jsm-s));
            padding: calc(8px * var(--jsm-s)) calc(12px * var(--jsm-s));
            font-weight: 700; font-size: calc(15px * var(--jsm-s)); line-height: 1.35;
            min-height: calc(22px * var(--jsm-s));
            border-left: calc(6px * var(--jsm-s)) solid var(--or);
        }
        .jsm-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jsm-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jsm-msg b { font-weight: 900; }

        /* ── Fin de partie ── */
        .jsm-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.45);
        }
        .jsm-overlay.show { display: flex; }
        .jsm-card {
            background: #fff; border-radius: calc(18px * var(--jsm-s));
            padding: calc(12px * var(--jsm-s)) calc(22px * var(--jsm-s)) calc(14px * var(--jsm-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jsm-s)) 0 #B9B2D6;
            animation: jsm-pop .35s ease-out;
            max-width: 90%;
        }
        @keyframes jsm-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jsm-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jsm-s)); color: var(--encre); }
        .jsm-card p { margin: calc(4px * var(--jsm-s)) 0 calc(8px * var(--jsm-s)); font-weight: 800; font-size: calc(14px * var(--jsm-s)); }
        .jsm-card .jsm-sub { font-size: calc(12px * var(--jsm-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jsm-s)); }
        .jsm-medal { font-size: calc(56px * var(--jsm-s)); line-height: 1; animation: jsm-pop .5s ease-out; }

        /* ── Aide ── */
        .jsm-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 340px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jsm-help.show { display: block; }
        .jsm-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jsm-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jsm-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jsm-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jsm-fall 1.8s ease-in forwards; }
        @keyframes jsm-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jsm-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jsm-container:hover .jsm-rh { opacity: 1; }
        .jsm-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jsm-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jsm-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jsm-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jsm-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jsm-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jsm-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jsm-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jsm-container *, .jsm-container *::before, .jsm-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // DONNÉES
    // =========================================================================
    const PAD_COLORS = ['#2FBF71', '#FF4F5E', '#FFC933', '#3BA7FF', '#9B6BFF', '#FF7A1A'];
    // Thèmes : ce qui est écrit sur chaque touche + la note jouée (Hz)
    const JSM_THEMES = {
        couleurs: { label: '🎨 Couleurs', chef: '🎨',
            labels: ['●', '▲', '■', '★', '◆', '♥'], shapes: true, size: 30,
            freqs: [392.0, 329.6, 261.6, 196.0, 440.0, 293.7] },
        notes: { label: '🎵 Notes de musique', chef: '🎵',
            labels4: ['Do', 'Mi', 'Sol', 'Do'], labels: ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La'], size: 22,
            freqs4: [261.6, 329.6, 392.0, 523.3], freqs: [261.6, 293.7, 329.6, 349.2, 392.0, 440.0] },
        animaux: { label: '🐾 Animaux', chef: '🐾',
            labels: ['🐸', '🐱', '🐶', '🐮', '🐷', '🐔'], size: 30,
            freqs: [220.0, 330.0, 277.2, 164.8, 247.0, 370.0] },
        chiffres: { label: '🔢 Chiffres', chef: '🔢',
            labels: ['1', '2', '3', '4', '5', '6'], size: 30,
            freqs: [261.6, 329.6, 392.0, 523.3, 293.7, 440.0] },
    };
    const JSM_LEVELS = {
        1: { pads: 4, lives: 3, on: 650, gap: 260, min: 380, replays: 3, gold: 8,  silver: 5 },
        2: { pads: 4, lives: 2, on: 480, gap: 180, min: 280, replays: 1, gold: 10, silver: 6 },
        3: { pads: 6, lives: 1, on: 400, gap: 150, min: 220, replays: 0, gold: 10, silver: 6 },
    };
    const RECORD_KEY = 'jeu-simon-records';
    const CONFETTI_COLORS = PAD_COLORS.concat(['#fff']);

    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // ── Sons (Web Audio, sans fichier) ─────────────────────────────────────
    let _jsmAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jsmAudio) _jsmAudio = new (window.AudioContext || window.webkitAudioContext)();
            if (_jsmAudio.state === 'suspended') _jsmAudio.resume();
            const ctx = _jsmAudio, t0 = ctx.currentTime + start;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
            g.gain.setValueAtTime(vol || 0.12, t0 + Math.max(0.02, dur - 0.06));
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(t0); o.stop(t0 + dur + 0.05);
        } catch (e) { /* audio indisponible */ }
    }
    const SFX = {
        error: () => { tone(160, 0, 0.35, 'square', 0.06); tone(120, 0.15, 0.4, 'square', 0.05); },
        level: () => [659, 784, 988].forEach((f, i) => tone(f, 0.08 * i, 0.12, 'triangle', 0.07)),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        over:  () => [392, 330, 262].forEach((f, i) => tone(f, 0.18 * i, 0.25, 'triangle', 0.08)),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuSimonWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-simon';
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

        const themeOptions = Object.keys(JSM_THEMES).map(k => `<option value="${k}">${JSM_THEMES[k].label}</option>`).join('');

        const container = document.createElement('div');
        container.className = 'jsm-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jsm-inner">
            <div class="jsm-header">
                <span class="jsm-title">Simon</span>
                <div class="jsm-stats">
                    <span class="jsm-chip" data-role="record" title="Record (sur cet ordinateur)">🏆 0</span>
                    <span class="jsm-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jsm-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jsm-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jsm-bar">
                <button class="jsm-lvl active" data-level="1">😊 Facile</button>
                <button class="jsm-lvl" data-level="2">😐 Moyen</button>
                <button class="jsm-lvl" data-level="3">😤 Difficile</button>
                <select class="jsm-select right" data-role="theme" title="Ce qui est dessiné sur les touches">${themeOptions}</select>
                <select class="jsm-select" data-role="order" title="Dans quel ordre répéter">
                    <option value="normal">➡️ À l'endroit</option>
                    <option value="reverse">⬅️ À l'envers</option>
                </select>
            </div>

            <div class="jsm-stage">
                <div class="jsm-side left">
                    <div class="jsm-box"><small>Suite</small><b data-role="len">0</b></div>
                    <div class="jsm-box"><small>Vies</small><span class="jsm-lives" data-role="lives"></span></div>
                </div>
                <div class="jsm-side right">
                    <div class="jsm-box"><small>Record</small><b data-role="rec2">0</b></div>
                    <div class="jsm-box"><small>Réécoutes</small><b data-role="replays">0</b></div>
                </div>
                <div class="jsm-device locked"><svg viewBox="-115 -115 230 230" xmlns="http://www.w3.org/2000/svg"></svg></div>
                <div class="jsm-dots"></div>
                <div class="jsm-overlay" data-role="win"><div class="jsm-card"></div></div>
            </div>

            <div class="jsm-talk">
                <div class="jsm-chef">🎨</div>
                <div class="jsm-msg"></div>
            </div>

            <div class="jsm-actions">
                <button class="jsm-btn jsm-btn-go" data-act="start">▶ Jouer</button>
                <button class="jsm-btn" data-act="replay">🔁 Réécouter</button>
                <button class="jsm-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="jsm-help">
                <h4>🎶 Comment jouer ?</h4>
                <p>Simon joue une suite de touches (lumière + son). <b>Regarde et écoute bien</b>, puis répète la même suite en cliquant sur les touches.</p>
                <p>✅ Si tu réussis, Simon ajoute une touche à la suite. Jusqu'où iras-tu ?</p>
                <p>😊 <b>Facile</b> : 4 touches, lent, 3 vies, 3 réécoutes.<br>😐 <b>Moyen</b> : 4 touches, plus rapide, 2 vies, 1 réécoute.<br>😤 <b>Difficile</b> : 6 touches, rapide, 1 vie.</p>
                <p>⬅️ <b>À l'envers</b> : il faut répéter la suite en commençant par la fin (très bon entraînement de la mémoire !).</p>
                <p style="margin:0">Au clavier : touches <b>1 à 6</b>. Le record est gardé sur cet ordinateur.</p>
            </div>
            <div class="jsm-confetti"></div>
            <div class="jsm-rh jsm-rh-nw" data-dir="nw"></div>
            <div class="jsm-rh jsm-rh-n"  data-dir="n"></div>
            <div class="jsm-rh jsm-rh-ne" data-dir="ne"></div>
            <div class="jsm-rh jsm-rh-e"  data-dir="e"></div>
            <div class="jsm-rh jsm-rh-se" data-dir="se"></div>
            <div class="jsm-rh jsm-rh-s"  data-dir="s"></div>
            <div class="jsm-rh jsm-rh-sw" data-dir="sw"></div>
            <div class="jsm-rh jsm-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jsm-inner');
        const device    = $('.jsm-device');
        const svg       = device.querySelector('svg');
        const dotsEl    = $('.jsm-dots');
        const lenEl     = $('[data-role="len"]');
        const livesEl   = $('[data-role="lives"]');
        const rec2El    = $('[data-role="rec2"]');
        const replaysEl = $('[data-role="replays"]');
        const msg       = $('.jsm-msg');
        const chef      = $('.jsm-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jsm-card');
        const recordEl  = $('[data-role="record"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jsm-help');
        const confetti  = $('.jsm-confetti');
        const themeSel  = $('[data-role="theme"]');
        const orderSel  = $('[data-role="order"]');
        const lvlBtns   = container.querySelectorAll('.jsm-lvl');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const NS = 'http://www.w3.org/2000/svg';

        // ── État ───────────────────────────────────────────────────────────
        let level = 1, theme = 'couleurs', reverse = false;
        let seq = [], inputPos = 0;
        let lives = 3, replays = 0, score = 0;
        let state = 'idle';          // idle | show | input | over
        let runId = 0;               // pour annuler une animation en cours
        let soundOn = true;
        let pads = [];
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const recKey = () => `${level}-${reverse ? 'r' : 'n'}`;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jsm-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jsm-s', sc.toFixed(4));
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jsm-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateSide() {
            const L = JSM_LEVELS[level];
            lenEl.textContent = seq.length;
            livesEl.innerHTML = Array.from({ length: L.lives }, (_, i) => `<span class="${i < lives ? '' : 'off'}">❤️</span>`).join('');
            const rec = records[recKey()] || 0;
            rec2El.textContent = rec;
            recordEl.textContent = '🏆 ' + rec;
            replaysEl.textContent = L.replays ? replays : '—';
            btn('replay').disabled = !(state === 'input' && replays > 0);
            btn('start').disabled = state === 'show' || state === 'input';
            btn('stop').disabled = state === 'idle' || state === 'over';
        }
        function renderDots(mode) {
            dotsEl.innerHTML = seq.map((_, i) => {
                let c = '';
                if (mode === 'input' && i < inputPos) c = ' ok';
                if (mode === 'show') c = '';
                return `<span class="jsm-dot${c}"></span>`;
            }).join('');
        }
        function setCenter(num, stateTxt, go) {
            const n = svg.querySelector('.jsm-center-num'), st = svg.querySelector('.jsm-center-state'), c = svg.querySelector('.jsm-center');
            if (n) n.textContent = num;
            if (st) st.textContent = stateTxt;
            if (c) c.classList.toggle('go', !!go);
        }

        // ── Construction de l'appareil (4 ou 6 touches) ────────────────────
        function sectorPath(i, n, R, r, gapDeg) {
            const a0 = (-90 + i * 360 / n + gapDeg / 2) * Math.PI / 180;
            const a1 = (-90 + (i + 1) * 360 / n - gapDeg / 2) * Math.PI / 180;
            // écart constant entre les touches (en unités) sur les deux cercles
            const g = 4;
            const oa0 = a0 + g / R, oa1 = a1 - g / R, ia0 = a0 + g / r, ia1 = a1 - g / r;
            const P = (a, rad) => `${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`;
            const large = (oa1 - oa0) > Math.PI ? 1 : 0;
            return `M ${P(oa0, R)} A ${R} ${R} 0 ${large} 1 ${P(oa1, R)} L ${P(ia1, r)} A ${r} ${r} 0 ${large} 0 ${P(ia0, r)} Z`;
        }
        function buildDevice() {
            const n = JSM_LEVELS[level].pads;
            const T = JSM_THEMES[theme];
            const labels = (n === 4 && T.labels4) ? T.labels4 : T.labels;
            svg.innerHTML = '';
            pads = [];
            for (let i = 0; i < n; i++) {
                const g = document.createElementNS(NS, 'g');
                g.setAttribute('class', 'jsm-pad');
                g.dataset.i = i;
                const p = document.createElementNS(NS, 'path');
                p.setAttribute('d', sectorPath(i, n, 106, 44, 0));
                p.setAttribute('fill', PAD_COLORS[i]);
                g.appendChild(p);
                const mid = (-90 + (i + 0.5) * 360 / n) * Math.PI / 180;
                const lx = Math.cos(mid) * 76, ly = Math.sin(mid) * 76;
                if (T.shapes) {
                    g.appendChild(shapeEl(i, lx, ly, n === 6 ? 11 : 13));
                } else {
                    const t = document.createElementNS(NS, 'text');
                    t.setAttribute('class', 'jsm-label');
                    t.setAttribute('x', lx.toFixed(1));
                    t.setAttribute('y', ly.toFixed(1));
                    t.setAttribute('font-size', T.size * (n === 6 ? 0.85 : 1));
                    t.textContent = labels[i];
                    g.appendChild(t);
                }
                g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); container.focus({ preventScroll: true }); press(i); });
                svg.appendChild(g);
                pads.push(g);
            }
            const c = document.createElementNS(NS, 'g');
            c.setAttribute('class', 'jsm-center');
            c.innerHTML = `
                <circle class="jsm-center-bg" r="40"/>
                <text class="jsm-center-title" y="-17">SIMON</text>
                <text class="jsm-center-num" y="4">0</text>
                <text class="jsm-center-state" y="27"></text>`;
            svg.appendChild(c);
            chef.textContent = T.chef;
        }
        // Symboles dessinés (couleurs) : aident aussi les élèves daltoniens
        function shapeEl(i, x, y, r) {
            const P = (pts) => pts.map(([a, b]) => `${(x + a * r).toFixed(1)},${(y + b * r).toFixed(1)}`).join(' ');
            let el;
            if (i === 0) {
                el = document.createElementNS(NS, 'circle');
                el.setAttribute('cx', x); el.setAttribute('cy', y); el.setAttribute('r', r * 0.9);
            } else {
                el = document.createElementNS(NS, 'polygon');
                const star = [];
                for (let k = 0; k < 10; k++) {
                    const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 0.45 : 1.05;
                    star.push([Math.cos(a) * rr, Math.sin(a) * rr]);
                }
                const heart = [];
                for (let k = 0; k < 24; k++) {
                    const t = k / 24 * Math.PI * 2;
                    heart.push([0.062 * 16 * Math.pow(Math.sin(t), 3), -0.062 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 0.1]);
                }
                const shapes = {
                    1: [[0, -1], [0.95, 0.75], [-0.95, 0.75]],
                    2: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]],
                    3: star,
                    4: [[0, -1.05], [0.8, 0], [0, 1.05], [-0.8, 0]],
                    5: heart,
                };
                el.setAttribute('points', P(shapes[i]));
            }
            el.setAttribute('fill', '#fff');
            el.setAttribute('stroke', 'rgba(0,0,0,0.25)');
            el.setAttribute('stroke-width', '1.5');
            el.setAttribute('stroke-linejoin', 'round');
            el.style.pointerEvents = 'none';
            return el;
        }
        function freqOf(i) {
            const n = JSM_LEVELS[level].pads, T = JSM_THEMES[theme];
            return ((n === 4 && T.freqs4) ? T.freqs4 : T.freqs)[i];
        }
        function flash(i, ms) {
            const p = pads[i];
            if (!p) return;
            p.classList.add('lit');
            if (soundOn) tone(freqOf(i), 0, ms / 1000, theme === 'notes' ? 'triangle' : 'sine', 0.14);
            setTimeout(() => p.classList.remove('lit'), ms);
        }

        // ── Déroulement ────────────────────────────────────────────────────
        function speed() {
            const L = JSM_LEVELS[level];
            const k = Math.max(0, seq.length - 4);
            return { on: Math.max(L.min, L.on - k * 22), gap: Math.max(110, L.gap - k * 8) };
        }
        async function playSequence() {
            const id = ++runId;
            state = 'show';
            device.classList.add('locked');
            updateSide();
            renderDots('show');
            setCenter(seq.length, 'ÉCOUTE…', false);
            await wait(650);
            const { on, gap } = speed();
            const dots = dotsEl.children;
            for (let i = 0; i < seq.length; i++) {
                if (id !== runId || !widget.isConnected) return;
                if (dots[i]) dots[i].classList.add('show');
                flash(seq[i], on);
                await wait(on + gap);
                if (dots[i]) dots[i].classList.remove('show');
            }
            if (id !== runId) return;
            state = 'input';
            inputPos = 0;
            device.classList.remove('locked');
            setCenter(seq.length, 'À TOI !', true);
            renderDots('input');
            updateSide();
            say(reverse
                ? `⬅️ À toi ! Répète la suite de <b>${seq.length}</b> en commençant par <b>la fin</b>.`
                : `👆 À toi ! Répète la suite de <b>${seq.length}</b> touche${seq.length > 1 ? 's' : ''}.`);
        }
        function nextRound() {
            seq.push(Math.floor(Math.random() * JSM_LEVELS[level].pads));
            playSequence();
        }
        function startGame() {
            runId++;
            seq = []; score = 0;
            lives = JSM_LEVELS[level].lives;
            replays = JSM_LEVELS[level].replays;
            winLayer.classList.remove('show');
            scoreEl.textContent = '⭐ 0';
            say('👀 Regarde et écoute bien…');
            nextRound();
        }
        function stopGame() {
            runId++;
            state = 'idle';
            device.classList.add('locked');
            pads.forEach(p => p.classList.remove('lit', 'bad'));
            seq = []; renderDots();
            setCenter(0, 'PRÊT ?', false);
            updateSide();
            say('⏹ Partie arrêtée. Clique sur <b>▶ Jouer</b> pour recommencer.');
        }

        // Touche pressée par l'élève
        function press(i) {
            if (state !== 'input') {
                if (state === 'idle' || state === 'over') flash(i, 220);   // on peut essayer les sons
                return;
            }
            const expected = reverse ? seq[seq.length - 1 - inputPos] : seq[inputPos];
            if (i === expected) {
                flash(i, 220);
                inputPos++;
                const d = dotsEl.children[inputPos - 1];
                if (d) d.classList.add('ok');
                if (inputPos >= seq.length) roundWon();
            } else {
                roundLost(i, expected);
            }
        }
        async function roundWon() {
            const id = runId;
            state = 'show';
            device.classList.add('locked');
            setCenter(seq.length, 'BRAVO !', false);
            score += seq.length;
            scoreEl.textContent = '⭐ ' + score;
            scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
            const k = recKey();
            const isRec = seq.length > (records[k] || 0);
            if (isRec) {
                records[k] = seq.length;
                try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) { /* stockage indisponible */ }
                recordEl.classList.add('gold');
                setTimeout(() => recordEl.classList.remove('gold'), 1200);
            }
            updateSide();
            await wait(250);
            sfx('level');
            const L = JSM_LEVELS[level];
            const tag = seq.length === L.gold ? ' Médaille d\'or en vue 🥇 !' : '';
            say(`✅ ${rnd(['Bravo', 'Super', 'Parfait', 'Génial', 'Excellent'])} ! Suite de <b>${seq.length}</b> réussie${isRec ? ' — <b>nouveau record</b> 🏆' : ''}.${tag}`, 'good');
            await wait(900);
            if (id !== runId || !widget.isConnected) return;
            nextRound();
        }
        async function roundLost(i, expected) {
            const id = ++runId;
            state = 'show';
            device.classList.add('locked');
            lives--;
            sfx('error');
            pads[i].classList.add('bad');
            const d = dotsEl.children[inputPos];
            if (d) d.classList.add('ko');
            setCenter(seq.length, 'OUPS !', false);
            updateSide();
            await wait(500);
            pads[i].classList.remove('bad');
            // Montrer la bonne touche
            flash(expected, 500);
            await wait(700);
            if (id !== runId) return;
            if (lives > 0) {
                say(`❌ Oups ! Ce n'était pas la bonne touche. Il te reste <b>${lives}</b> vie${lives > 1 ? 's' : ''}. Simon rejoue la même suite…`, 'bad');
                await wait(900);
                if (id !== runId) return;
                playSequence();
            } else {
                gameOver();
            }
        }
        function gameOver() {
            state = 'over';
            device.classList.add('locked');
            const L = JSM_LEVELS[level];
            const best = seq.length - 1;
            const medal = best >= L.gold ? '🥇' : best >= L.silver ? '🥈' : best >= 3 ? '🥉' : '🎈';
            const title = medal === '🥇' ? 'Mémoire d\'éléphant !' : medal === '🥈' ? 'Très belle mémoire !' : medal === '🥉' ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const rec = records[recKey()] || 0;
            setCenter(best, 'FINI', false);
            updateSide();
            winCard.innerHTML = `
                <div class="jsm-medal">${medal}</div>
                <h3>${title}</h3>
                <p>Plus longue suite réussie : <b>${best}</b></p>
                <p class="jsm-sub">Record ${reverse ? '(à l\'envers) ' : ''}: ${rec} · ${score} points</p>
                <button class="jsm-btn jsm-btn-go" data-act="again">🔄 Rejouer</button>`;
            winLayer.classList.add('show');
            if (medal === '🥇' || medal === '🥈') { sfx('win'); party(); } else sfx('over');
            say(`🏁 Partie terminée : suite de <b>${best}</b>. Tu peux rejouer, changer de niveau ou essayer à l'envers !`, best >= L.silver ? 'good' : '');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
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

        // ── Réglages ───────────────────────────────────────────────────────
        function reset(message) {
            runId++;
            state = 'idle';
            seq = [];
            lives = JSM_LEVELS[level].lives;
            replays = JSM_LEVELS[level].replays;
            winLayer.classList.remove('show');
            buildDevice();
            renderDots();
            setCenter(0, 'PRÊT ?', false);
            updateSide();
            say(message || '🎶 Clique sur <b>▶ Jouer</b> : Simon va te montrer une suite à répéter. Tu peux essayer les touches avant !');
        }
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            reset();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        themeSel.addEventListener('change', () => { theme = themeSel.value; reset(); });
        orderSel.addEventListener('change', () => {
            reverse = orderSel.value === 'reverse';
            reset(reverse ? '⬅️ Mode <b>à l\'envers</b> : il faudra répéter la suite en commençant par la dernière touche !' : undefined);
        });
        [themeSel, orderSel].forEach(el => {
            el.addEventListener('pointerdown', (e) => e.stopPropagation());
            el.addEventListener('mousedown', (e) => e.stopPropagation());
        });

        btn('start').addEventListener('click', () => { container.focus({ preventScroll: true }); startGame(); });
        btn('stop').addEventListener('click', stopGame);
        btn('replay').addEventListener('click', () => {
            if (state !== 'input' || replays <= 0) return;
            replays--;
            say('🔁 Simon rejoue la suite… (tu recommences depuis le début)');
            playSequence();
        });

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= pads.length) { e.preventDefault(); press(n - 1); }
            else if ((e.key === 'Enter' || e.key === ' ') && (state === 'idle' || state === 'over')) { e.preventDefault(); startGame(); }
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
            if (state === 'show' || state === 'input') stopGame();
            window._wfMiniBarCollapse(widget, '🎶 Simon', { onExpand: applyScale });
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
            runId++;
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
        container.querySelectorAll('.jsm-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, .jsm-device, .jsm-rh, .jsm-help')) {
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
            if (type === 'jeu-simon') return window.createJeuSimonWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-simon') return window.createJeuSimonWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
