// =========================================================================
// JEU « LE SUJET COMMANDE ! » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Accord sujet-verbe : une phrase s'affiche avec un trou à la place du
// verbe. L'élève actionne l'aiguillage vers la voie qui porte la bonne
// forme conjuguée. Le train part… ou se heurte à la barrière !
// 8 phrases par tournée.
// 3 niveaux : facile (sujet juste avant le verbe) / moyen (groupe sujet
//   long, sujets coordonnés) / difficile (sujet inversé, éloigné, « qui »,
//   pronom complément intercalé)
//
// Ouverture   : createWidget('jeu-sujet-commande')
// Sauvegarde  : widget._jscGetData()  → jscData dans save-load.js
// Restauration: createJeuSujetCommandeWidget(jscData)
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


    // ── CSS du jeu (préfixe jsc-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-sujet-commande-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-sujet-commande-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-sujet-commande"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jsc-container {
            --jsc-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --rail: #6B4A36;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --bleu: #3BA7FF;

            width: 680px;
            box-sizing: border-box;
            position: relative;
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jsc-s));
            padding: calc(12px * var(--jsc-s)) calc(14px * var(--jsc-s)) calc(14px * var(--jsc-s));
            border-radius: calc(24px * var(--jsc-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jsc-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jsc-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
            justify-content: center;
            overflow: hidden !important;
        }
        /* En plein écran, chaque bloc garde la largeur du jeu (× échelle) et se centre,
           et la scène prend une hauteur proportionnelle à l'échelle : tout tient
           dans l'écran sans défilement (l'échelle est calculée en JS). */
        .jsc-container.wf-fullboard > .jsc-header,
        .jsc-container.wf-fullboard > .jsc-bar,
        .jsc-container.wf-fullboard > .jsc-board,
        .jsc-container.wf-fullboard > .jsc-scene,
        .jsc-container.wf-fullboard > .jsc-talk,
        .jsc-container.wf-fullboard > .jsc-actions {
            width: 100%; box-sizing: border-box;
            max-width: calc(760px * var(--jsc-s));
            margin-left: auto; margin-right: auto;
        }
        /* Aucun bloc ne doit être écrasé par la colonne flex : sinon la phrase
           est coupée et la mesure de hauteur devient fausse. */
        .jsc-container > .jsc-header,
        .jsc-container > .jsc-bar,
        .jsc-container > .jsc-board,
        .jsc-container > .jsc-scene,
        .jsc-container > .jsc-talk,
        .jsc-container > .jsc-actions { flex-shrink: 0; }
        .jsc-container.wf-fullboard > .jsc-scene {
            aspect-ratio: auto;
            height: calc(250px * var(--jsc-s));
        }
        .jsc-container.wf-fullboard .jsc-help { right: 50%; transform: translateX(50%); }

        /* ── En-tête ── */
        .jsc-header { display: flex; align-items: center; gap: calc(10px * var(--jsc-s)); cursor: move; flex-wrap: wrap; }
        .jsc-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jsc-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jsc-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1.15;
        }
        .jsc-stats { display: flex; gap: calc(6px * var(--jsc-s)); align-items: center; margin-left: auto; }
        .jsc-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jsc-s)) calc(10px * var(--jsc-s));
            font-weight: 900; font-size: calc(14px * var(--jsc-s)); white-space: nowrap;
        }
        .jsc-chip.hot { background: #FF7A1A; }
        @keyframes jsc-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jsc-chip.bump { animation: jsc-bump .4s ease; }
        .jsc-icon-btn {
            width: calc(26px * var(--jsc-s)); height: calc(26px * var(--jsc-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jsc-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jsc-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Niveaux + progression ── */
        .jsc-bar { display: flex; align-items: center; gap: calc(6px * var(--jsc-s)); flex-wrap: wrap; }
        .jsc-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jsc-s));
            padding: calc(5px * var(--jsc-s)) calc(12px * var(--jsc-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jsc-lvl:hover { background: rgba(255,255,255,0.1); }
        .jsc-lvl:active { transform: scale(0.95); }
        .jsc-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jsc-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jsc-s)); align-items: center; }
        .jsc-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jsc-s)); margin-right: 2px; }
        .jsc-pdot {
            width: calc(14px * var(--jsc-s)); height: calc(14px * var(--jsc-s));
            border-radius: 50%; background: rgba(255,255,255,0.15);
        }
        .jsc-pdot.done { background: var(--vert); }
        .jsc-pdot.miss { background: #FF9F1A; }
        .jsc-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Tableau d'affichage (la phrase) ── */
        .jsc-board {
            background: #14284D;
            border: calc(4px * var(--jsc-s)) solid #0B1830;
            border-radius: calc(14px * var(--jsc-s));
            padding: calc(12px * var(--jsc-s)) calc(14px * var(--jsc-s));
            color: #fff; text-align: center;
            font-weight: 900; font-size: calc(26px * var(--jsc-s)); line-height: 1.45;
            box-shadow: inset 0 calc(-5px * var(--jsc-s)) 0 rgba(0,0,0,0.25);
            min-height: calc(40px * var(--jsc-s));
        }
        .jsc-board-label {
            display: block; font-size: calc(11px * var(--jsc-s)); letter-spacing: 2px;
            color: var(--or); text-transform: uppercase; margin-bottom: calc(2px * var(--jsc-s));
        }
        .jsc-subject { border-radius: calc(6px * var(--jsc-s)); padding: 0 calc(3px * var(--jsc-s)); transition: background .25s, color .25s; }
        .jsc-subject.show {
            background: var(--bleu); color: #fff;
            box-shadow: 0 calc(3px * var(--jsc-s)) 0 #1B6FB8;
        }
        .jsc-subject .jsc-pron {
            display: inline-block; font-size: 0.55em; vertical-align: top;
            background: var(--or); color: var(--encre); border-radius: 999px;
            padding: 0 calc(6px * var(--jsc-s)); margin-left: calc(4px * var(--jsc-s));
            line-height: 1.5;
        }
        .jsc-blank {
            display: inline-block; min-width: calc(90px * var(--jsc-s));
            border-bottom: calc(4px * var(--jsc-s)) dashed var(--or);
            color: var(--or); line-height: 1.1;
        }
        .jsc-blank.ok { border-bottom-style: solid; border-color: var(--vert); color: #7CF0AE; }
        @keyframes jsc-land { 0% { transform: translateY(calc(-10px * var(--jsc-s))) scale(1.2); } 100% { transform: none; } }
        .jsc-blank.ok { animation: jsc-land .3s ease-out; }

        /* ── Scène (aiguillage) ── */
        .jsc-scene {
            position: relative;
            border-radius: calc(18px * var(--jsc-s));
            overflow: hidden;
            background: linear-gradient(180deg, #7FD3FF 0%, #BDE9FF 55%, #FFE9B8 100%);
            flex-shrink: 0;
            aspect-ratio: 680 / 230;
        }
        .jsc-scene svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .jsc-cloud { position: absolute; background: #fff; border-radius: 999px; opacity: 0.9; width: calc(70px * var(--jsc-s)); height: calc(22px * var(--jsc-s)); }
        .jsc-cloud::before, .jsc-cloud::after { content: ''; position: absolute; background: #fff; border-radius: 50%; }
        .jsc-cloud::before { width: calc(34px * var(--jsc-s)); height: calc(34px * var(--jsc-s)); left: calc(10px * var(--jsc-s)); top: calc(-16px * var(--jsc-s)); }
        .jsc-cloud::after  { width: calc(26px * var(--jsc-s)); height: calc(26px * var(--jsc-s)); left: calc(34px * var(--jsc-s)); top: calc(-11px * var(--jsc-s)); }
        @keyframes jsc-drift { from { transform: translateX(0); } to { transform: translateX(calc(40px * var(--jsc-s))); } }
        .jsc-cloud.c1 { left: 6%;  top: 16%; animation: jsc-drift 14s ease-in-out infinite alternate; }
        .jsc-cloud.c2 { left: 34%; top: 30%; transform: scale(0.75); animation: jsc-drift 18s ease-in-out infinite alternate-reverse; }

        .jsc-dest { cursor: pointer; }
        .jsc-dest .jsc-panel { transition: filter .15s; }
        .jsc-dest:hover .jsc-panel { filter: brightness(1.12); }
        .jsc-dest.ok .jsc-panel { fill: var(--vert); }
        .jsc-dest.ko .jsc-panel { fill: var(--rouge); }
        .jsc-dest.dim { opacity: 0.45; }
        .jsc-dest text { pointer-events: none; font-family: 'Nunito', sans-serif; font-weight: 900; }
        .jsc-scene.locked .jsc-dest { cursor: default; }
        .jsc-scene.locked .jsc-dest:hover .jsc-panel { filter: none; }
        .jsc-route { transition: stroke .2s; }
        .jsc-route.sel { stroke: var(--or); }
        .jsc-route.bad { stroke: var(--rouge); }
        @keyframes jsc-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .jsc-dest.ko { animation: jsc-shake .35s ease 2; transform-box: fill-box; }
        .jsc-smoke { opacity: 0; }
        @keyframes jsc-puff { 0% { transform: translate(0,0) scale(0.4); opacity: 0.9; } 100% { transform: translate(-30px,-34px) scale(1.8); opacity: 0; } }
        .jsc-scene.moving .jsc-smoke { animation: jsc-puff 0.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
        .jsc-scene.moving .jsc-smoke.p2 { animation-delay: .27s; }
        .jsc-scene.moving .jsc-smoke.p3 { animation-delay: .54s; }

        /* ── Actions ── */
        .jsc-actions { display: flex; gap: calc(8px * var(--jsc-s)); justify-content: center; flex-wrap: wrap; }
        .jsc-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jsc-s));
            padding: calc(8px * var(--jsc-s)) calc(14px * var(--jsc-s));
            border-radius: calc(14px * var(--jsc-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jsc-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jsc-btn:hover { filter: brightness(1.05); }
        .jsc-btn:active { transform: translateY(calc(4px * var(--jsc-s))); box-shadow: 0 calc(1px * var(--jsc-s)) 0 #B9B2D6; }
        .jsc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .jsc-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jsc-s));
            padding: calc(8px * var(--jsc-s)) calc(22px * var(--jsc-s));
            box-shadow: 0 calc(5px * var(--jsc-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jsc-btn-go:active { box-shadow: 0 calc(1px * var(--jsc-s)) 0 #1C8A4F; }
        .jsc-btn:focus-visible, .jsc-lvl:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Chef de gare ── */
        .jsc-talk { display: flex; align-items: center; gap: calc(10px * var(--jsc-s)); }
        .jsc-chef {
            width: calc(44px * var(--jsc-s)); height: calc(44px * var(--jsc-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jsc-s));
            box-shadow: 0 calc(3px * var(--jsc-s)) 0 #B3840B;
        }
        @keyframes jsc-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jsc-s))) rotate(-8deg); } }
        .jsc-chef.hop { animation: jsc-hop .4s ease; }
        .jsc-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jsc-s));
            padding: calc(8px * var(--jsc-s)) calc(12px * var(--jsc-s));
            font-weight: 700; font-size: calc(15px * var(--jsc-s)); line-height: 1.35;
            min-height: calc(22px * var(--jsc-s));
            border-left: calc(6px * var(--jsc-s)) solid var(--or);
        }
        .jsc-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jsc-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jsc-msg b { font-weight: 900; }
        .jsc-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; }

        /* ── Écrans de fin ── */
        .jsc-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.35);
        }
        .jsc-overlay.show { display: flex; }
        @keyframes jsc-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jsc-card {
            background: #fff; border-radius: calc(18px * var(--jsc-s));
            padding: calc(12px * var(--jsc-s)) calc(22px * var(--jsc-s)) calc(14px * var(--jsc-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jsc-s)) 0 #B9B2D6;
            animation: jsc-pop .35s ease-out; max-width: 90%;
        }
        .jsc-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jsc-s)); color: var(--encre); }
        .jsc-card p { margin: calc(4px * var(--jsc-s)) 0 calc(8px * var(--jsc-s)); font-weight: 800; font-size: calc(14px * var(--jsc-s)); }
        .jsc-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jsc-s)); margin: calc(4px * var(--jsc-s)) 0; }
        .jsc-bigstars span { font-size: calc(34px * var(--jsc-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jsc-bigstars span.on { opacity: 1; filter: none; animation: jsc-pop .35s ease-out both; }
        .jsc-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jsc-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jsc-medal { font-size: calc(56px * var(--jsc-s)); line-height: 1; animation: jsc-pop .5s ease-out; }

        /* ── Aide ── */
        .jsc-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 320px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jsc-help.show { display: block; }
        .jsc-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jsc-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jsc-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jsc-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jsc-fall 1.8s ease-in forwards; }
        @keyframes jsc-fall { to { transform: translateY(600px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jsc-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jsc-container:hover .jsc-rh { opacity: 1; }
        .jsc-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jsc-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jsc-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jsc-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jsc-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jsc-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jsc-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jsc-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jsc-container *, .jsc-container *::before, .jsc-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // BANQUE DE PHRASES
    // Chaque entrée : [phrase avec ___, sujet (tel qu'écrit dans la phrase),
    //                  pronom de remplacement, bonne forme, intrus 1, intrus 2,
    //                  remarque facultative]
    // =========================================================================
    const JSC_PHRASES = {
        // Facile : le sujet est juste avant le verbe
        1: [
            ['Le chat ___ sur le canapé.', 'Le chat', 'il', 'dort', 'dorment', 'dors'],
            ['Les oiseaux ___ dans le ciel.', 'Les oiseaux', 'ils', 'volent', 'vole', 'voles'],
            ['Nous ___ une cabane.', 'Nous', 'nous', 'construisons', 'construisez', 'construisent'],
            ['Tu ___ ton goûter.', 'Tu', 'tu', 'manges', 'mange', 'mangent'],
            ['Ma sœur ___ de la guitare.', 'Ma sœur', 'elle', 'joue', 'jouent', 'joues'],
            ['Vous ___ très vite.', 'Vous', 'vous', 'courez', 'courons', 'court'],
            ['Les filles ___ une chanson.', 'Les filles', 'elles', 'chantent', 'chante', 'chantes'],
            ['Je ___ un livre.', 'Je', 'je', 'lis', 'lit', 'lisent'],
            ['Le maître ___ la leçon.', 'Le maître', 'il', 'explique', 'expliquent', 'expliques'],
            ['Les élèves ___ en silence.', 'Les élèves', 'ils', 'travaillent', 'travaille', 'travailles'],
            ['Paul ___ son vélo.', 'Paul', 'il', 'répare', 'réparent', 'répares'],
            ['Mes parents ___ au marché.', 'Mes parents', 'ils', 'vont', 'va', 'vas'],
            ['Le bébé ___ dans son lit.', 'Le bébé', 'il', 'pleure', 'pleurent', 'pleures'],
            ['On ___ au ballon.', 'On', 'il', 'joue', 'jouent', 'jouons', '« On » se conjugue comme « il ».'],
            ['Les fleurs ___ au printemps.', 'Les fleurs', 'elles', 'poussent', 'pousse', 'pousses'],
            ['Le vent ___ fort.', 'Le vent', 'il', 'souffle', 'soufflent', 'souffles'],
        ],
        // Moyen : groupe sujet allongé, sujets coordonnés
        2: [
            ['Les enfants du quartier ___ dans la cour.', 'Les enfants du quartier', 'ils', 'jouent', 'joue', 'jouons', 'Ce sont les enfants qui jouent, pas le quartier !'],
            ['Le chien de mes voisins ___ toute la nuit.', 'Le chien de mes voisins', 'il', 'aboie', 'aboient', 'aboies', 'Qui aboie ? Le chien, pas les voisins !'],
            ['Léa et Tom ___ leurs devoirs.', 'Léa et Tom', 'ils', 'font', 'fait', 'faisons'],
            ['Toi et moi ___ les meilleurs amis.', 'Toi et moi', 'nous', 'sommes', 'êtes', 'sont', '« Toi et moi », c\'est « nous ».'],
            ['La maîtresse des CM2 ___ une sortie.', 'La maîtresse des CM2', 'elle', 'organise', 'organisent', 'organises', 'Qui organise ? La maîtresse, pas les CM2 !'],
            ['Les feuilles de l\'arbre ___ en automne.', 'Les feuilles de l\'arbre', 'elles', 'tombent', 'tombe', 'tombes'],
            ['Mon frère et toi ___ au même club.', 'Mon frère et toi', 'vous', 'allez', 'vont', 'allons', '« Toi » + quelqu\'un d\'autre, c\'est « vous ».'],
            ['Le panier de pommes ___ sur la table.', 'Le panier de pommes', 'il', 'est', 'sont', 'es', 'C\'est le panier qui est sur la table : un seul panier !'],
            ['Les élèves de la classe ___ la sortie.', 'Les élèves de la classe', 'ils', 'attendent', 'attend', 'attends'],
            ['Le cri des mouettes ___ les touristes.', 'Le cri des mouettes', 'il', 'réveille', 'réveillent', 'réveilles', 'Qu\'est-ce qui réveille ? Le cri, pas les mouettes !'],
            ['Ma cousine et moi ___ à la piscine.', 'Ma cousine et moi', 'nous', 'nageons', 'nagent', 'nagez', '« Moi » + quelqu\'un d\'autre, c\'est « nous ».'],
            ['Les jouets de mon petit frère ___ partout.', 'Les jouets de mon petit frère', 'ils', 'traînent', 'traîne', 'traînes'],
            ['Le bouquet de roses ___ bon.', 'Le bouquet de roses', 'il', 'sent', 'sentent', 'sens', 'Un seul bouquet, même s\'il y a plusieurs roses !'],
            ['Le chat et le chien ___ ensemble.', 'Le chat et le chien', 'ils', 'dorment', 'dort', 'dors'],
            ['La voiture de mes grands-parents ___ en panne.', 'La voiture de mes grands-parents', 'elle', 'tombe', 'tombent', 'tombes'],
            ['Les crayons de Julie ___ cassés.', 'Les crayons de Julie', 'ils', 'sont', 'est', 'es'],
        ],
        // Difficile : sujet inversé, éloigné, pronom complément, « qui »
        3: [
            ['Dans la forêt ___ les loups.', 'les loups', 'ils', 'hurlent', 'hurle', 'hurlez', 'Le sujet est placé après le verbe : qui hurle ? Les loups.'],
            ['Les enfants les ___ souvent.', 'Les enfants', 'ils', 'regardent', 'regarde', 'regardes', '« les » devant le verbe n\'est pas le sujet : c\'est un pronom complément.'],
            ['Mes amis, je les ___ chaque jour.', 'je', 'je', 'vois', 'voient', 'voit', 'Qui voit ? « je ». « les » remplace « mes amis » : ce n\'est pas le sujet.'],
            ['C\'est moi qui ___ la porte.', 'qui', 'je', 'ferme', 'fermes', 'ferment', '« qui » remplace « moi » : le verbe se conjugue avec « je ».'],
            ['C\'est toi qui ___ le gagnant.', 'qui', 'tu', 'es', 'est', 'êtes', '« qui » remplace « toi » : le verbe se conjugue avec « tu ».'],
            ['Les voitures que je vois ___ rouges.', 'Les voitures', 'elles', 'sont', 'suis', 'est', 'Ce sont les voitures qui sont rouges, pas « je » !'],
            ['Sur la branche ___ deux moineaux.', 'deux moineaux', 'ils', 'chantent', 'chante', 'chantes', 'Le sujet est placé après le verbe : qui chante ? Deux moineaux.'],
            ['Le livre que mes amis m\'ont prêté ___ passionnant.', 'Le livre', 'il', 'est', 'sont', 'es', 'Qu\'est-ce qui est passionnant ? Le livre, pas mes amis !'],
            ['Où ___ tes parents ?', 'tes parents', 'ils', 'habitent', 'habite', 'habites', 'Dans une question, le sujet peut être après le verbe.'],
            ['Mes sœurs, souvent, me ___ des histoires.', 'Mes sœurs', 'elles', 'racontent', 'raconte', 'racontes', '« me » n\'est pas le sujet : qui raconte ? Mes sœurs.'],
            ['Les élèves, après la récréation, ___ en classe.', 'Les élèves', 'ils', 'rentrent', 'rentre', 'rentres', 'Le sujet est loin du verbe : qui rentre ? Les élèves.'],
            ['Les gâteaux que prépare ma grand-mère ___ délicieux.', 'Les gâteaux', 'ils', 'sont', 'est', 'es', 'Qu\'est-ce qui est délicieux ? Les gâteaux, pas la grand-mère !'],
            ['Au loin ___ le tonnerre.', 'le tonnerre', 'il', 'gronde', 'grondent', 'grondes', 'Le sujet est placé après le verbe : qu\'est-ce qui gronde ? Le tonnerre.'],
            ['Toi qui ___ si bien, aide-moi !', 'qui', 'tu', 'dessines', 'dessine', 'dessinent', '« qui » remplace « toi » : le verbe se conjugue avec « tu ».'],
            ['Les chiens que Pierre promène ___ sages.', 'Les chiens', 'ils', 'sont', 'est', 'es', 'Qui est sage ? Les chiens, pas Pierre !'],
            ['Que ___ les enfants ?', 'les enfants', 'ils', 'veulent', 'veut', 'veux', 'Dans une question, le sujet peut être après le verbe.'],
        ],
    };

    const PHRASES_PER_ROUND = 8;
    const PANEL_COLORS = ['#FF5D5D', '#3BA7FF', '#9B6BFF'];
    // Tracé des 3 voies (repère SVG 680 × 230)
    const ROUTES = [
        { d: 'M 0 130 L 230 130 C 300 130 330 62 400 62 L 452 62',   y: 62 },
        { d: 'M 0 130 L 452 130',                                      y: 130 },
        { d: 'M 0 130 L 230 130 C 300 130 330 198 400 198 L 452 198', y: 198 },
    ];
    const START_LEN = 125;

    // ── Utilitaires ────────────────────────────────────────────────────────
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jscAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jscAudio) _jscAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jscAudio, t0 = ctx.currentTime + start;
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
        lever:  () => { tone(300, 0, 0.06, 'square', 0.05); tone(450, 0.06, 0.06, 'square', 0.05); },
        good:   () => { tone(660, 0, 0.1, 'triangle', 0.1); tone(990, 0.1, 0.18, 'triangle', 0.1); },
        error:  () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        whistle:() => { tone(880, 0, 0.25, 'sine', 0.1); tone(1175, 0, 0.25, 'sine', 0.06); },
        win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:   () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // ── Dessin SVG de la scène ─────────────────────────────────────────────
    function sceneSVG() {
        const rails = ROUTES.map((r, i) => `
            <path d="${r.d}" fill="none" stroke="#6B4A36" stroke-width="16" stroke-dasharray="6 9"/>
            <path class="jsc-route" data-route="${i}" d="${r.d}" fill="none" stroke="#9AA3B5" stroke-width="4" stroke-linecap="round"/>`).join('');
        const dests = ROUTES.map((r, i) => `
            <g class="jsc-dest" data-dest="${i}">
                <rect class="jsc-panel" x="462" y="${r.y - 27}" width="206" height="54" rx="14" fill="${PANEL_COLORS[i]}" stroke="#fff" stroke-width="4"/>
                <circle cx="486" cy="${r.y}" r="13" fill="#fff"/>
                <text x="486" y="${r.y + 6}" text-anchor="middle" font-size="17" fill="#2A1F4A">${i + 1}</text>
                <text class="jsc-dest-label" x="580" y="${r.y + 9}" text-anchor="middle" font-size="27" fill="#fff"></text>
            </g>`).join('');
        return `
        <svg viewBox="0 0 680 230" preserveAspectRatio="xMidYMid meet" overflow="visible" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="245" rx="260" ry="90" fill="#8EDB9B"/>
            <ellipse cx="330" cy="255" rx="230" ry="80" fill="#6CCB84"/>
            <ellipse cx="760" cy="250" rx="200" ry="80" fill="#8EDB9B"/>
            <rect x="-600" y="212" width="1880" height="60" fill="#C9A26B"/>
            <path d="M -600 130 L 0 130" fill="none" stroke="#6B4A36" stroke-width="16" stroke-dasharray="6 9"/>
            <path d="M -600 130 L 0 130" fill="none" stroke="#9AA3B5" stroke-width="4"/>
            ${rails}
            <g class="jsc-lever" transform="translate(232 160)">
                <rect x="-14" y="0" width="28" height="12" rx="3" fill="#2A1F4A"/>
                <g class="jsc-lever-arm"><line x1="0" y1="2" x2="0" y2="-26" stroke="#2A1F4A" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-28" r="7" fill="#FF4F5E"/></g>
            </g>
            ${dests}
            <g class="jsc-train">
                <circle class="jsc-smoke"    cx="24" cy="-44" r="9" fill="#fff"/>
                <circle class="jsc-smoke p2" cx="24" cy="-44" r="9" fill="#fff"/>
                <circle class="jsc-smoke p3" cx="24" cy="-44" r="9" fill="#fff"/>
                <!-- wagon -->
                <rect x="-92" y="-30" width="46" height="26" rx="5" fill="#FFB020"/>
                <rect x="-88" y="-26" width="38" height="10" rx="3" fill="#FFF7E6"/>
                <circle cx="-80" cy="-2" r="7" fill="#2A1F4A"/><circle cx="-58" cy="-2" r="7" fill="#2A1F4A"/>
                <rect x="-48" y="-12" width="8" height="4" fill="#2A1F4A"/>
                <!-- locomotive (tournée vers la droite) -->
                <rect x="-40" y="-44" width="24" height="40" rx="4" fill="#E23B4A"/>
                <rect x="-43" y="-49" width="30" height="7" rx="3" fill="#2A1F4A"/>
                <rect x="-35" y="-38" width="14" height="12" rx="3" fill="#CFF1FF"/>
                <path d="M -18 -30 L 24 -30 Q 34 -30 34 -20 L 34 -4 L -18 -4 Z" fill="#2F6FEB"/>
                <rect x="16" y="-44" width="10" height="14" fill="#2A1F4A"/>
                <circle cx="36" cy="-20" r="5" fill="#FFC933"/>
                <circle cx="-28" cy="-2" r="8" fill="#2A1F4A"/><circle cx="-4" cy="-2" r="8" fill="#2A1F4A"/><circle cx="20" cy="-2" r="8" fill="#2A1F4A"/>
                <circle cx="-28" cy="-2" r="2.5" fill="#C8CDD8"/><circle cx="-4" cy="-2" r="2.5" fill="#C8CDD8"/><circle cx="20" cy="-2" r="2.5" fill="#C8CDD8"/>
            </g>
        </svg>`;
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // savedData (facultatif) : données issues de la sauvegarde du board
    // =========================================================================
    window.createJeuSujetCommandeWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-sujet-commande';
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
        container.className = 'jsc-container';
        container.innerHTML = `
            <div class="jsc-header">
                <span class="jsc-title">Le sujet commande !</span>
                <div class="jsc-stats">
                    <span class="jsc-chip" data-role="streak" title="Bonnes réponses du premier coup d'affilée">🔥 0</span>
                    <span class="jsc-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jsc-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jsc-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jsc-bar">
                <button class="jsc-lvl active" data-level="1">😊 Facile</button>
                <button class="jsc-lvl" data-level="2">😐 Moyen</button>
                <button class="jsc-lvl" data-level="3">😤 Difficile</button>
                <div class="jsc-progress" title="Phrases de la tournée">
                    <span class="jsc-progress-label">Phrase</span>
                    ${'<span class="jsc-pdot"></span>'.repeat(PHRASES_PER_ROUND)}
                </div>
            </div>

            <div class="jsc-board"><span class="jsc-board-label">Destination du train</span><span data-role="sentence"></span></div>

            <div class="jsc-scene">
                <div class="jsc-cloud c1"></div>
                <div class="jsc-cloud c2"></div>
                ${sceneSVG()}
                <div class="jsc-overlay" data-role="win"><div class="jsc-card"></div></div>
            </div>

            <div class="jsc-talk">
                <div class="jsc-chef">🚉</div>
                <div class="jsc-msg"></div>
            </div>

            <div class="jsc-actions">
                <button class="jsc-btn" data-act="hint">💡 Indice</button>
                <button class="jsc-btn" data-act="read">🗣️ Lire la phrase</button>
                <button class="jsc-btn jsc-btn-go" data-act="next" disabled>Phrase suivante ▶</button>
            </div>

            <div class="jsc-help">
                <h4>🚂 Comment jouer ?</h4>
                <p>Le train doit compléter la phrase. Choisis la voie qui porte la <b>bonne forme du verbe</b> : c'est le <b>sujet</b> qui commande l'accord !</p>
                <p>👆 Clique sur un panneau (ou tape 1, 2 ou 3 au clavier) pour actionner l'aiguillage.</p>
                <p>🔎 Pour trouver le sujet, demande-toi : « <b>Qui est-ce qui</b> … ? » puis remplace-le par un pronom (il, elle, ils, nous…).</p>
                <p>😊 <b>Facile</b> : le sujet est juste avant le verbe.<br>😐 <b>Moyen</b> : le groupe sujet est plus long.<br>😤 <b>Difficile</b> : sujet après le verbe, loin du verbe, « qui »…</p>
                <p style="margin:0">💡 Indice 1 : le sujet est surligné. Indice 2 : le pronom apparaît. 8 phrases = une tournée !</p>
            </div>

            <div class="jsc-confetti"></div>

            <div class="jsc-rh jsc-rh-nw" data-dir="nw"></div>
            <div class="jsc-rh jsc-rh-n"  data-dir="n"></div>
            <div class="jsc-rh jsc-rh-ne" data-dir="ne"></div>
            <div class="jsc-rh jsc-rh-e"  data-dir="e"></div>
            <div class="jsc-rh jsc-rh-se" data-dir="se"></div>
            <div class="jsc-rh jsc-rh-s"  data-dir="s"></div>
            <div class="jsc-rh jsc-rh-sw" data-dir="sw"></div>
            <div class="jsc-rh jsc-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const scene     = $('.jsc-scene');
        const trainEl   = $('.jsc-train');
        const leverArm  = $('.jsc-lever-arm');
        const routeEls  = Array.from(container.querySelectorAll('.jsc-route'));
        const destEls   = Array.from(container.querySelectorAll('.jsc-dest'));
        const sentEl    = $('[data-role="sentence"]');
        const msg       = $('.jsc-msg');
        const chef      = $('.jsc-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jsc-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jsc-help');
        const confetti  = $('.jsc-confetti');
        const lvlBtns   = container.querySelectorAll('.jsc-lvl');
        const pdots     = container.querySelectorAll('.jsc-pdot');
        const hintBtn   = $('[data-act="hint"]');
        const readBtn   = $('[data-act="read"]');
        const nextBtn   = $('[data-act="next"]');

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let cur = null;              // phrase en cours (tableau de données)
        let choices = [];            // 3 formes affichées, dans l'ordre des voies
        let answered = false;
        let errors = 0, hints = 0;
        let phraseNo = 1;            // 1..8
        let results = [];            // 'done' (1er coup sans indice) / 'miss'
        let score = 0, streak = 0;
        let usedIdx = [];
        let busy = false;
        let soundOn = true;
        let rafId = null;

        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 680;
        const FLOW_SEL = '.jsc-header, .jsc-bar, .jsc-board, .jsc-scene, .jsc-talk, .jsc-actions';
        function applyScale() {
            if (container.classList.contains('wf-fullboard')) { fitFullboard(); return; }
            const w = container.offsetWidth || BASE_W;
            const sc = Math.max(0.5, Math.min(3, w / BASE_W));
            container.style.setProperty('--jsc-s', sc.toFixed(4));
        }
        // Plein écran : l'échelle est la plus grande qui tient à la fois
        // en largeur ET en hauteur, pour ne jamais avoir à faire défiler.
        function contentHeightAt(sc) {
            container.style.setProperty('--jsc-s', sc.toFixed(4));
            const blocks = container.querySelectorAll(':scope > ' + FLOW_SEL.split(', ').join(', :scope > '));
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
            // Deux passes : le retour à la ligne des textes dépend de l'échelle
            for (let k = 0; k < 3; k++) {
                const h = contentHeightAt(sc);
                if (h <= availH) break;
                sc = Math.max(0.5, sc * (availH / h) * 0.98);
            }
            container.style.setProperty('--jsc-s', sc.toFixed(4));
        }
        const _onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', _onWinResize); return; }
            if (container.classList.contains('wf-fullboard')) fitFullboard();
        };
        window.addEventListener('resize', _onWinResize);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { if (widget.isConnected) applyScale(); });
        }

        // ── Chef de gare ───────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jsc-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
            // Un message plus long peut ajouter une ligne : réajuster en plein écran
            if (container.classList.contains('wf-fullboard')) fitFullboard();
        }

        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.classList.toggle('done', results[i] === 'done');
                d.classList.toggle('miss', results[i] === 'miss');
                d.classList.toggle('current', i === phraseNo - 1 && !results[i]);
            });
        }

        // ── Train : déplacement le long d'une voie ─────────────────────────
        function placeTrain(route, len) {
            const p = routeEls[route];
            const total = p.getTotalLength();
            const L = Math.max(0, Math.min(total, len));
            const a = p.getPointAtLength(L);
            const b = p.getPointAtLength(Math.min(total, L + 1));
            const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
            trainEl.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
        }
        function animateTrain(route, from, to, dur, done) {
            cancelAnimationFrame(rafId);
            scene.classList.add('moving');
            const t0 = performance.now();
            const step = (now) => {
                if (!widget.isConnected) return;
                const k = Math.min(1, (now - t0) / dur);
                const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
                placeTrain(route, from + (to - from) * e);
                if (k < 1) rafId = requestAnimationFrame(step);
                else { scene.classList.remove('moving'); if (done) done(); }
            };
            rafId = requestAnimationFrame(step);
        }
        function setLever(route) {
            const ang = route === 0 ? -35 : route === 2 ? 35 : 0;
            leverArm.setAttribute('transform', `rotate(${ang})`);
        }

        // ── Phrase : affichage ─────────────────────────────────────────────
        function renderSentence(filled) {
            const [phrase, sujet, pron] = cur;
            const blank = filled
                ? `<span class="jsc-blank ok">${esc(cur[3])}</span>`
                : '<span class="jsc-blank">&nbsp;?&nbsp;</span>';
            const subjClass = 'jsc-subject' + ((hints >= 1 || filled) ? ' show' : '');
            const subjHTML = `<span class="${subjClass}">${esc(sujet)}${(hints >= 2 || filled) && pron.toLowerCase() !== sujet.toLowerCase() ? `<span class="jsc-pron">${esc(pron)}</span>` : ''}</span>`;
            const parts = phrase.split('___');
            const render = (txt) => {
                const i = txt.indexOf(sujet);
                if (i === -1) return { html: esc(txt), found: false };
                return { html: esc(txt.slice(0, i)) + subjHTML + esc(txt.slice(i + sujet.length)), found: true };
            };
            const left = render(parts[0]);
            const right = left.found ? { html: esc(parts[1] || '') } : render(parts[1] || '');
            sentEl.innerHTML = left.html + blank + right.html;
        }

        // ── Nouvelle phrase ────────────────────────────────────────────────
        function pickPhrase() {
            const list = JSC_PHRASES[level];
            let free = list.map((_, i) => i).filter(i => !usedIdx.includes(i));
            if (!free.length) { usedIdx = []; free = list.map((_, i) => i); }
            const idx = rnd(free);
            usedIdx.push(idx);
            return list[idx];
        }

        function loadPhrase() {
            cur = pickPhrase();
            choices = shuffle([cur[3], cur[4], cur[5]]);
            answered = false; errors = 0; hints = 0;
            winLayer.classList.remove('show');
            scene.classList.remove('locked');
            destEls.forEach((d, i) => {
                d.classList.remove('ok', 'ko', 'dim');
                const lab = d.querySelector('.jsc-dest-label');
                lab.textContent = choices[i];
                // Rétrécir un verbe trop long pour son panneau
                lab.setAttribute('font-size', '27');
                try {
                    let fs = 27;
                    while (lab.getComputedTextLength() > 158 && fs > 14) { fs -= 1; lab.setAttribute('font-size', String(fs)); }
                } catch (e) { /* SVG pas encore rendu */ }
            });
            routeEls.forEach(r => r.classList.remove('sel', 'bad'));
            setLever(1);
            nextBtn.disabled = true;
            hintBtn.disabled = false;
            renderSentence(false);
            updateStats(false);
            busy = true;
            animateTrain(1, -40, START_LEN, 900, () => { busy = false; });
            const tips = {
                1: 'Trouve le <b>sujet</b> juste avant le verbe, puis choisis la bonne voie.',
                2: 'Attention, le groupe sujet est long : demande-toi <b>« Qui est-ce qui… ? »</b>',
                3: 'Piège ! Le sujet n\'est pas toujours juste avant le verbe. Cherche-le bien.'
            };
            say(`🚂 Phrase ${phraseNo} sur ${PHRASES_PER_ROUND}. ${tips[level]}`);
        }

        function newRound() {
            phraseNo = 1; results = []; usedIdx = [];
            loadPhrase();
        }

        // ── Choix d'une voie ───────────────────────────────────────────────
        function choose(route) {
            if (busy || answered || !cur) return;
            busy = true;
            const form = choices[route];
            const good = form === cur[3];
            sfx('lever');
            setLever(route);
            routeEls.forEach(r => r.classList.remove('sel', 'bad'));
            routeEls[route].classList.add('sel');
            const total = routeEls[route].getTotalLength();

            if (good) {
                answered = true;
                scene.classList.add('locked');
                animateTrain(route, START_LEN, total - 28, 1100, () => {
                    destEls[route].classList.add('ok');
                    destEls.forEach((d, i) => { if (i !== route) d.classList.add('dim'); });
                    sfx('good'); sfx('whistle');
                    renderSentence(true);
                    const perfect = errors === 0 && hints === 0;
                    let pts = 10;
                    if (hints === 1) pts = 7; else if (hints >= 2) pts = 5;
                    pts = Math.max(2, pts - errors * 3);
                    streak = perfect ? streak + 1 : 0;
                    const bonus = streak >= 3 ? 2 : 0;
                    score += pts + bonus;
                    results[phraseNo - 1] = perfect ? 'done' : 'miss';
                    updateStats(true);
                    const note = cur[6] ? ' ' + esc(cur[6]) : '';
                    say(`🎉 ${rnd(['Bravo', 'Super', 'Génial', 'Parfait', 'Bien joué'])} ! Le sujet est <b>${esc(cur[1])}</b> → <span class="k">${esc(cur[2])}</span> ${esc(cur[3])}.${note} <b>+${pts + bonus}</b>`, 'good');
                    hintBtn.disabled = true;
                    nextBtn.disabled = false;
                    nextBtn.textContent = phraseNo >= PHRASES_PER_ROUND ? '🏁 Fin de la tournée' : 'Phrase suivante ▶';
                    busy = false;
                });
            } else {
                errors++;
                animateTrain(route, START_LEN, total - 80, 800, () => {
                    destEls[route].classList.add('ko');
                    routeEls[route].classList.add('bad');
                    sfx('error');
                    say(wrongMessage(form), 'bad');
                    setTimeout(() => {
                        if (!widget.isConnected) return;
                        animateTrain(route, total - 80, START_LEN, 700, () => {
                            destEls[route].classList.remove('ko');
                            destEls[route].classList.add('dim');
                            routeEls[route].classList.remove('bad', 'sel');
                            setLever(1);
                            busy = false;
                        });
                    }, 900);
                });
            }
        }

        function wrongMessage(form) {
            if (errors === 1 && hints === 0) {
                return `🚫 Mauvaise voie ! « ${esc(form)} » ne va pas ici. Qui est-ce qui fait l'action ? Cherche le <b>sujet</b>.`;
            }
            const note = cur[6] ? ' ' + esc(cur[6]) : '';
            return `🚫 Pas « ${esc(form)} ». Le sujet est <b>${esc(cur[1])}</b>, on peut le remplacer par <span class="k">${esc(cur[2])}</span>.${note}`;
        }

        // ── Indice ─────────────────────────────────────────────────────────
        function giveHint() {
            if (busy || answered || !cur) return;
            hints++;
            renderSentence(false);
            if (hints === 1) {
                say(`💡 Le sujet est surligné en bleu : <b>${esc(cur[1])}</b>. Par quel pronom peux-tu le remplacer ?`);
            } else {
                hintBtn.disabled = true;
                say(`💡 <b>${esc(cur[1])}</b> = <span class="k">${esc(cur[2])}</span>. Quelle forme du verbe va avec « ${esc(cur[2])} » ?`);
            }
        }

        // ── Lecture à voix haute ───────────────────────────────────────────
        function readSentence() {
            if (!cur || !('speechSynthesis' in window)) {
                say('La lecture à voix haute n\'est pas disponible sur cet appareil.');
                return;
            }
            const text = cur[0].replace('___', answered ? cur[3] : '…');
            try {
                speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = 'fr-FR'; u.rate = 0.9;
                const v = speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang));
                if (v) u.voice = v;
                speechSynthesis.speak(u);
            } catch (e) { /* synthèse indisponible */ }
        }

        // ── Suite / fin de tournée ─────────────────────────────────────────
        function next() {
            if (busy || !answered) return;
            if (phraseNo >= PHRASES_PER_ROUND) { finalScreen(); return; }
            phraseNo++;
            loadPhrase();
        }

        function finalScreen() {
            const firstTry = results.filter(r => r === 'done').length;
            const st = firstTry >= 7 ? 3 : firstTry >= 5 ? 2 : 1;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : '🥉';
            const title = st === 3 ? 'Chef d\'aiguillage en or !' : st === 2 ? 'Super aiguilleur !' : 'Tournée terminée !';
            winCard.innerHTML = `
                <div class="jsc-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jsc-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${firstTry} phrase${firstTry > 1 ? 's' : ''} sur ${PHRASES_PER_ROUND} réussie${firstTry > 1 ? 's' : ''} du premier coup</p>
                <button class="jsc-btn jsc-btn-go" data-act="again">🔄 Nouvelle tournée</button>`;
            winLayer.classList.add('show');
            nextBtn.disabled = true;
            sfx('win');
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 250 * n); });
            party();
            say(`🏁 Tournée terminée : ${firstTry}/${PHRASES_PER_ROUND} du premier coup ! Rejoue ou essaie un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
            if (typeof saveBoard === 'function') saveBoard();
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = rnd(PANEL_COLORS.concat(['#FFC933', '#2FBF71', '#fff']));
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Niveaux ────────────────────────────────────────────────────────
        function setLevel(l, keepStreak) {
            level = l;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === l));
            if (!keepStreak) streak = 0;
            busy = false;
            newRound();
            if (typeof saveBoard === 'function') saveBoard();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));

        destEls.forEach((d, i) => d.addEventListener('click', (e) => { e.stopPropagation(); choose(i); }));
        hintBtn.addEventListener('click', giveHint);
        readBtn.addEventListener('click', readSentence);
        nextBtn.addEventListener('click', next);

        // Clavier : 1, 2, 3 pour les voies, Entrée pour la suite
        widget.addEventListener('keydown', (e) => {
            if (e.target.closest && e.target.closest('input, textarea, [contenteditable="true"]')) return;
            if (e.key === '1' || e.key === '2' || e.key === '3') { e.preventDefault(); choose(+e.key - 1); }
            else if (e.key === 'Enter' && answered) { e.preventDefault(); next(); }
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
            window._wfMiniBarCollapse(widget, '🚦 Le sujet commande', { onExpand: applyScale });
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
        container.querySelectorAll('.jsc-rh[data-dir]').forEach(handle => {
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
        widget._jscGetData = function () {
            return {
                level, score, streak, soundOn,
                containerW: _isMax ? (_savedW || null) : (container.style.width || null),
                containerH: _isMax ? null : (container.style.height || null),
                fullboard: _isMax
            };
        };

        // ── Init ───────────────────────────────────────────────────────────
        function _onWidgetDown(e) {
            if (e.target.closest && e.target.closest('button, .jsc-dest, .jsc-rh, .jsc-help')) {
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

        // Restauration des réglages sauvegardés (taille, niveau, score…)
        if (restoring) {
            if (savedData.containerW) container.style.width  = savedData.containerW;
            if (savedData.containerH) container.style.height = savedData.containerH;
            if (savedData.soundOn === false) { soundOn = false; soundBtn.textContent = '🔇'; soundBtn.title = 'Activer le son'; }
        }
        placeTrain(1, START_LEN);

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
            if (type === 'jeu-sujet-commande') return window.createJeuSujetCommandeWidget();
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
