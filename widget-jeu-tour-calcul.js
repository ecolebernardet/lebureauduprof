// =========================================================================
// JEU « TOUR DE CALCUL » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — mode jeu élèves
//
// Façon Tetris : des blocs portant un calcul tombent ; l'élève les guide
// dans la colonne de leur résultat. Bonne colonne : le bloc explose (et
// efface un bloc gris de la colonne). Mauvaise colonne : le bloc reste coincé.
// Si une colonne monte jusqu'en haut, la partie est perdue.
// 5 vagues de 8 bonnes réponses (nouveaux résultats, chute plus rapide).
// Opérations : +, −, ×, ÷ (seules ou mélangées).
// 3 niveaux : facile   (4 colonnes, résultats ≤ 10, tables de 2 à 5)
//             moyen    (5 colonnes, résultats ≤ 30, tables de 2 à 9)
//             difficile(5 colonnes, résultats ≤ 100, toutes les tables)
//
// Ouverture : createWidget('jeu-tour-calcul')
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


    // ── CSS du jeu (préfixe jtc-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-tour-calcul-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tour-calcul-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-tour-calcul"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jtc-container {
            --jtc-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jtc-s)) calc(14px * var(--jtc-s)) calc(14px * var(--jtc-s));
            border-radius: calc(24px * var(--jtc-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jtc-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jtc-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jtc-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jtc-s));
            width: 100%; max-width: calc(672px * var(--jtc-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jtc-header { display: flex; align-items: center; gap: calc(10px * var(--jtc-s)); cursor: move; flex-wrap: wrap; }
        .jtc-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jtc-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jtc-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jtc-stats { display: flex; gap: calc(6px * var(--jtc-s)); align-items: center; margin-left: auto; }
        .jtc-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jtc-s)) calc(10px * var(--jtc-s));
            font-weight: 900; font-size: calc(14px * var(--jtc-s));
            white-space: nowrap;
        }
        .jtc-chip.hot { background: #FF7A1A; }
        @keyframes jtc-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jtc-chip.bump { animation: jtc-bump .4s ease; }
        .jtc-icon-btn {
            width: calc(26px * var(--jtc-s)); height: calc(26px * var(--jtc-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jtc-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jtc-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Réglages ── */
        .jtc-bar { display: flex; align-items: center; gap: calc(6px * var(--jtc-s)); flex-wrap: wrap; }
        .jtc-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtc-s));
            padding: calc(5px * var(--jtc-s)) calc(12px * var(--jtc-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jtc-lvl:hover { background: rgba(255,255,255,0.1); }
        .jtc-lvl:active { transform: scale(0.95); }
        .jtc-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jtc-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jtc-s));
            padding: calc(4px * var(--jtc-s)) calc(8px * var(--jtc-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer; margin-left: auto;
        }

        /* ── Zone de jeu ── */
        .jtc-play { display: flex; gap: calc(10px * var(--jtc-s)); align-items: stretch; }
        .jtc-well {
            position: relative; flex-shrink: 0;
            width: calc(470px * var(--jtc-s));
            border-radius: calc(14px * var(--jtc-s));
            overflow: hidden;
            background:
                radial-gradient(circle, rgba(255,255,255,0.05) calc(1.2px * var(--jtc-s)), transparent calc(1.6px * var(--jtc-s))) 0 0 / calc(20px * var(--jtc-s)) calc(20px * var(--jtc-s)),
                linear-gradient(180deg, #1A1440 0%, #2A1F5E 100%);
            box-shadow: inset 0 0 0 calc(4px * var(--jtc-s)) #3E3470;
            cursor: pointer; touch-action: none;
        }
        .jtc-cols { position: absolute; left: 0; top: 0; right: 0; display: flex; }
        .jtc-col { flex: 1; border-right: calc(2px * var(--jtc-s)) dashed rgba(255,255,255,0.08); transition: background .15s; }
        .jtc-col:last-child { border-right: none; }
        .jtc-col.cur { background: linear-gradient(180deg, rgba(255,201,51,0.02), rgba(255,201,51,0.13)); }
        .jtc-danger {
            position: absolute; left: 0; right: 0; height: calc(3px * var(--jtc-s));
            background: repeating-linear-gradient(90deg, var(--rouge) 0 calc(10px * var(--jtc-s)), transparent calc(10px * var(--jtc-s)) calc(20px * var(--jtc-s)));
            opacity: 0.7;
        }
        .jtc-targets {
            position: absolute; left: 0; right: 0; bottom: 0; display: flex;
            background: #120D2E; border-top: calc(3px * var(--jtc-s)) solid var(--or);
        }
        .jtc-target {
            flex: 1; display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', sans-serif; font-size: calc(28px * var(--jtc-s)); color: var(--or);
            text-shadow: 0 calc(2px * var(--jtc-s)) 0 #B3470F;
            border-right: calc(2px * var(--jtc-s)) solid rgba(255,255,255,0.08);
            transition: background .2s;
        }
        .jtc-target:last-child { border-right: none; }
        .jtc-target.cur { background: rgba(255,201,51,0.15); }
        .jtc-target.flash-ok { background: rgba(47,191,113,0.55); color: #fff; }
        .jtc-target.flash-ko { background: rgba(255,79,94,0.55); color: #fff; }
        @keyframes jtc-newt { 0% { transform: scale(0.3) rotate(-20deg); opacity: 0; } 70% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }
        .jtc-target span { display: inline-block; }
        .jtc-target.new span { animation: jtc-newt .5s ease-out both; }

        .jtc-block {
            position: absolute; left: 0; top: 0;
            display: flex; align-items: center; justify-content: center;
            border-radius: calc(9px * var(--jtc-s));
            font-weight: 900; font-size: calc(20px * var(--jtc-s)); color: #fff;
            text-shadow: 0 calc(2px * var(--jtc-s)) 0 rgba(0,0,0,0.25);
            box-shadow: inset 0 calc(-5px * var(--jtc-s)) 0 rgba(0,0,0,0.22), inset 0 calc(3px * var(--jtc-s)) 0 rgba(255,255,255,0.3);
            white-space: nowrap; box-sizing: border-box;
            will-change: transform;
            pointer-events: none;
        }
        .jtc-block.add { background: #2FBF71; }
        .jtc-block.sub { background: #3BA7FF; }
        .jtc-block.mul { background: #FF7A1A; }
        .jtc-block.div { background: #9B6BFF; }
        .jtc-block.falling { box-shadow: inset 0 calc(-5px * var(--jtc-s)) 0 rgba(0,0,0,0.22), inset 0 calc(3px * var(--jtc-s)) 0 rgba(255,255,255,0.3), 0 0 0 calc(3px * var(--jtc-s)) #fff, 0 0 calc(14px * var(--jtc-s)) rgba(255,255,255,0.5); }
        .jtc-block.wrong { background: #5A5372; color: #E8E4F4; border: calc(2px * var(--jtc-s)) solid var(--rouge); font-size: calc(16px * var(--jtc-s)); letter-spacing: -0.3px; }
        .jtc-well.c5 .jtc-block { font-size: calc(18px * var(--jtc-s)); }
        .jtc-well.c5 .jtc-block.wrong { font-size: calc(13px * var(--jtc-s)); }
        .jtc-block.wrong small { font-size: 0.8em; color: #FFB3BB; margin-left: 0.3em; }
        @keyframes jtc-boom { 0% { transform: var(--pos) scale(1); opacity: 1; } 100% { transform: var(--pos) scale(1.6); opacity: 0; } }
        .jtc-block.boom { animation: jtc-boom .35s ease-out forwards; }
        @keyframes jtc-land { 0% { filter: brightness(1.8); } 100% { filter: brightness(1); } }
        .jtc-block.land { animation: jtc-land .35s ease-out; }
        .jtc-float {
            position: absolute; pointer-events: none; z-index: 5;
            font-family: 'Lilita One', sans-serif; font-size: calc(22px * var(--jtc-s)); color: #7CFFB2;
            text-shadow: 0 calc(2px * var(--jtc-s)) 0 rgba(0,0,0,0.4);
            animation: jtc-up .8s ease-out forwards;
        }
        @keyframes jtc-up { to { transform: translateY(calc(-40px * var(--jtc-s))); opacity: 0; } }

        .jtc-cover {
            position: absolute; inset: 0; z-index: 8;
            display: flex; align-items: center; justify-content: center; flex-direction: column;
            gap: calc(8px * var(--jtc-s));
            background: rgba(18,13,46,0.7); color: #fff; text-align: center;
            cursor: default;
        }
        .jtc-cover.hide { display: none; }
        .jtc-cover h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(28px * var(--jtc-s)); color: var(--or); }
        .jtc-cover p { margin: 0; font-weight: 800; font-size: calc(14px * var(--jtc-s)); max-width: 85%; }
        .jtc-cover .medal { font-size: calc(48px * var(--jtc-s)); line-height: 1; }

        /* Panneau latéral */
        .jtc-side { flex: 1; display: flex; flex-direction: column; gap: calc(8px * var(--jtc-s)); min-width: 0; }
        .jtc-box {
            background: #3B2F63; border-radius: calc(12px * var(--jtc-s));
            padding: calc(8px * var(--jtc-s)); color: #fff; text-align: center;
        }
        .jtc-box small { display: block; font-size: calc(10px * var(--jtc-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; margin-bottom: calc(4px * var(--jtc-s)); }
        .jtc-next { min-height: calc(40px * var(--jtc-s)); display: flex; align-items: center; justify-content: center; }
        .jtc-next .jtc-block { position: static; padding: calc(8px * var(--jtc-s)) calc(10px * var(--jtc-s)); font-size: calc(17px * var(--jtc-s)); }
        .jtc-wave b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--jtc-s)); color: var(--or); }
        .jtc-meter { height: calc(9px * var(--jtc-s)); border-radius: 999px; background: rgba(0,0,0,0.3); overflow: hidden; margin-top: calc(4px * var(--jtc-s)); }
        .jtc-meter i { display: block; height: 100%; width: 0; background: var(--vert); border-radius: 999px; transition: width .3s; }
        .jtc-pad { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: calc(6px * var(--jtc-s)); }
        .jtc-pad button {
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--jtc-s));
            height: calc(52px * var(--jtc-s)); border: none; border-radius: calc(12px * var(--jtc-s));
            background: #fff; color: var(--encre); cursor: pointer; touch-action: manipulation;
            box-shadow: 0 calc(5px * var(--jtc-s)) 0 #B9B2D6;
        }
        .jtc-pad button:active { transform: translateY(calc(4px * var(--jtc-s))); box-shadow: 0 calc(1px * var(--jtc-s)) 0 #B9B2D6; }
        .jtc-pad button.drop { background: var(--or); box-shadow: 0 calc(5px * var(--jtc-s)) 0 #B3840B; }
        .jtc-legend { color: rgba(255,255,255,0.65); font-weight: 800; font-size: calc(11px * var(--jtc-s)); line-height: 1.4; text-align: center; }

        /* ── Actions ── */
        .jtc-actions { display: flex; gap: calc(6px * var(--jtc-s)); justify-content: center; flex-wrap: wrap; }
        .jtc-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jtc-s));
            padding: calc(8px * var(--jtc-s)) calc(12px * var(--jtc-s));
            border-radius: calc(14px * var(--jtc-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jtc-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jtc-btn:hover { filter: brightness(1.05); }
        .jtc-btn:active { transform: translateY(calc(4px * var(--jtc-s))); box-shadow: 0 calc(1px * var(--jtc-s)) 0 #B9B2D6; }
        .jtc-btn:disabled { opacity: 0.45; cursor: default; }
        .jtc-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jtc-s));
            padding: calc(8px * var(--jtc-s)) calc(22px * var(--jtc-s));
            box-shadow: 0 calc(5px * var(--jtc-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jtc-btn-go:active { box-shadow: 0 calc(1px * var(--jtc-s)) 0 #1C8A4F; }
        .jtc-btn:focus-visible, .jtc-lvl:focus-visible, .jtc-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jtc-talk { display: flex; align-items: center; gap: calc(10px * var(--jtc-s)); }
        .jtc-chef {
            width: calc(44px * var(--jtc-s)); height: calc(44px * var(--jtc-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jtc-s));
            box-shadow: 0 calc(3px * var(--jtc-s)) 0 #B3840B;
        }
        @keyframes jtc-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jtc-s))) rotate(-8deg); } }
        .jtc-chef.hop { animation: jtc-hop .4s ease; }
        .jtc-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jtc-s));
            padding: calc(8px * var(--jtc-s)) calc(12px * var(--jtc-s));
            font-weight: 700; font-size: calc(15px * var(--jtc-s)); line-height: 1.35;
            min-height: calc(22px * var(--jtc-s));
            border-left: calc(6px * var(--jtc-s)) solid var(--or);
        }
        .jtc-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jtc-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jtc-msg b { font-weight: 900; }
        .jtc-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; white-space: nowrap; }

        /* ── Aide ── */
        .jtc-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jtc-help.show { display: block; }
        .jtc-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jtc-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jtc-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jtc-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jtc-fall 1.8s ease-in forwards; }
        @keyframes jtc-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jtc-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jtc-container:hover .jtc-rh { opacity: 1; }
        .jtc-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jtc-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jtc-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jtc-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jtc-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jtc-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jtc-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jtc-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jtc-container *, .jtc-container *::before, .jtc-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // RÉGLAGES ET CALCULS
    // =========================================================================
    const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    const OPS = {
        add: '+', sub: '−', mul: '×', div: '÷',
    };
    const OP_SETS = {
        add: { label: '➕ Additions', ops: ['add'] },
        sub: { label: '➖ Soustractions', ops: ['sub'] },
        addsub: { label: '➕➖ Additions et soustractions', ops: ['add', 'sub'] },
        mul: { label: '✖️ Multiplications', ops: ['mul'] },
        div: { label: '➗ Divisions', ops: ['div'] },
        muldiv: { label: '✖️➗ Multiplications et divisions', ops: ['mul', 'div'] },
        all: { label: '🎲 Les 4 opérations', ops: ['add', 'sub', 'mul', 'div'] },
    };
    // Par niveau : colonnes, vitesse (rangées / s), bornes des calculs
    const JTC_LEVELS = {
        1: { cols: 4, speed: 0.42, res: [2, 10],  addMax: 10,  subMax: 20,  tables: [2, 3, 4, 5],                 divMax: 5,  label: 'résultats jusqu\'à 10, tables de 2 à 5' },
        2: { cols: 5, speed: 0.55, res: [5, 30],  addMax: 30,  subMax: 50,  tables: [2, 3, 4, 5, 6, 7, 8, 9],     divMax: 9,  label: 'résultats jusqu\'à 30, tables de 2 à 9' },
        3: { cols: 5, speed: 0.7,  res: [10, 100], addMax: 100, subMax: 100, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10], divMax: 10, label: 'résultats jusqu\'à 100, toutes les tables' },
    };
    const ROWS = 8;                 // hauteur du puits (en blocs)
    const PER_WAVE = 8;             // bonnes réponses pour passer à la vague suivante
    const WAVES = 5;
    const WELL_W = 470, CELL_H = 40, TARGET_H = 50;
    const WELL_H = ROWS * CELL_H + TARGET_H;
    const RECORD_KEY = 'jeu-tour-calcul-records';
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];

    // Résultats possibles pour une multiplication (tables choisies)
    function products(L) {
        const set = new Set();
        L.tables.forEach(t => { for (let k = 2; k <= 10; k++) set.add(t * k); });
        return Array.from(set).filter(v => v >= 2);
    }
    // Quelles opérations peuvent donner la valeur v ?
    function canMake(op, v, L) {
        if (op === 'add') return v >= 2 && v <= L.addMax;
        if (op === 'sub') return v >= 0 && v < L.subMax;
        if (op === 'mul') return L.tables.some(t => v % t === 0 && v / t >= 2 && v / t <= 10);
        if (op === 'div') return v >= 1 && v <= 10;
        return false;
    }
    // Choisit les résultats des colonnes pour une vague
    function makeTargets(L, ops) {
        let pool = [];
        if (ops.includes('add') || ops.includes('sub')) {
            const lo = (ops.includes('sub') && !ops.includes('add')) ? Math.max(0, L.res[0] - 2) : L.res[0];
            for (let v = lo; v <= L.res[1]; v++) pool.push(v);
        } else {
            const set = new Set();
            if (ops.includes('mul')) products(L).forEach(v => set.add(v));
            if (ops.includes('div')) for (let v = 1; v <= 10; v++) set.add(v);
            pool = Array.from(set);
        }
        // Chaque colonne doit pouvoir être atteinte par au moins une opération
        pool = pool.filter(v => ops.some(op => canMake(op, v, L)));
        return shuffle(pool).slice(0, L.cols).sort((a, b) => a - b);
    }
    // Fabrique un calcul dont le résultat est v
    function makeCalc(v, L, ops) {
        const possible = ops.filter(op => canMake(op, v, L));
        const op = rnd(possible.length ? possible : ops);
        let a, b;
        if (op === 'add') { a = ri(1, v - 1); b = v - a; }
        else if (op === 'sub') { b = ri(1, Math.max(1, Math.min(L.subMax - v, v < 10 ? 10 : v))); a = v + b; }
        else if (op === 'mul') {
            const pairs = [];
            L.tables.forEach(t => { if (v % t === 0 && v / t >= 2 && v / t <= 10) pairs.push([t, v / t]); });
            const p = rnd(pairs); [a, b] = Math.random() < 0.5 ? p : [p[1], p[0]];
        } else { b = ri(2, L.divMax); a = v * b; }
        return { op, a, b, v, text: `${a} ${OPS[op]} ${b}` };
    }

    // ── Sons ───────────────────────────────────────────────────────────────
    let _jtcAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jtcAudio) _jtcAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jtcAudio, t0 = ctx.currentTime + start;
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
        move:  () => tone(520, 0, 0.04, 'square', 0.03),
        drop:  () => tone(300, 0, 0.06, 'square', 0.04),
        good:  () => { tone(660, 0, 0.07, 'square', 0.05); tone(990, 0.06, 0.1, 'square', 0.05); tone(1320, 0.12, 0.12, 'square', 0.04); },
        bad:   () => { tone(180, 0, 0.2, 'square', 0.06); },
        wave:  () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.08 * i, 0.12, 'square', 0.05)),
        over:  () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.16 * i, 0.22, 'square', 0.05)),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuTourCalculWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-tour-calcul';
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

        const opOptions = Object.keys(OP_SETS).map(k => `<option value="${k}">${OP_SETS[k].label}</option>`).join('');

        const container = document.createElement('div');
        container.className = 'jtc-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jtc-inner">
            <div class="jtc-header">
                <span class="jtc-title">Tour de calcul</span>
                <div class="jtc-stats">
                    <span class="jtc-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="jtc-chip" data-role="record" title="Record (sur cet ordinateur)">🏆 0</span>
                    <span class="jtc-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jtc-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jtc-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jtc-bar">
                <button class="jtc-lvl active" data-level="1">😊 Facile</button>
                <button class="jtc-lvl" data-level="2">😐 Moyen</button>
                <button class="jtc-lvl" data-level="3">😤 Difficile</button>
                <select class="jtc-select" title="Choisir les opérations">${opOptions}</select>
            </div>

            <div class="jtc-play">
                <div class="jtc-well">
                    <div class="jtc-cols"></div>
                    <div class="jtc-danger"></div>
                    <div class="jtc-blocks"></div>
                    <div class="jtc-targets"></div>
                    <div class="jtc-cover"></div>
                </div>
                <div class="jtc-side">
                    <div class="jtc-box"><small>Bloc suivant</small><div class="jtc-next"></div></div>
                    <div class="jtc-box jtc-wave"><small>Vague</small><b data-role="wave">1 / ${WAVES}</b>
                        <div class="jtc-meter"><i data-role="meter"></i></div></div>
                    <div class="jtc-pad">
                        <button data-act="left" title="Gauche (←)">◀</button>
                        <button class="drop" data-act="drop" title="Lâcher (↓ ou Espace)">⬇</button>
                        <button data-act="right" title="Droite (→)">▶</button>
                    </div>
                    <div class="jtc-legend">Clique sur une colonne pour y lâcher le bloc.<br>Clavier : ← → pour déplacer, ↓ ou Espace pour lâcher, P pour pause.</div>
                    <div class="jtc-actions">
                        <button class="jtc-btn" data-act="pause">⏸ Pause</button>
                        <button class="jtc-btn" data-act="restart">🔄</button>
                    </div>
                </div>
            </div>

            <div class="jtc-talk">
                <div class="jtc-chef">🧱</div>
                <div class="jtc-msg"></div>
            </div>
          </div>

            <div class="jtc-help">
                <h4>🧱 Comment jouer ?</h4>
                <p>Des blocs portant des calculs tombent dans le puits. En bas, chaque colonne a un <b>résultat</b>. Guide chaque bloc dans la colonne de <b>son résultat</b> !</p>
                <p>✅ Bonne colonne : le bloc explose… et il fait aussi disparaître un bloc gris de cette colonne.<br>❌ Mauvaise colonne : le bloc reste coincé, en gris. Si une colonne monte jusqu'en haut, c'est perdu !</p>
                <p>👆 <b>Clique sur une colonne</b> pour y lâcher le bloc, ou utilise ◀ ⬇ ▶ (ou les flèches du clavier).</p>
                <p>Toutes les ${PER_WAVE} bonnes réponses : nouvelle <b>vague</b>, nouveaux résultats, et ça tombe plus vite. Termine les ${WAVES} vagues pour gagner !</p>
                <p style="margin:0">Couleurs : <b style="color:#2FBF71">+</b> <b style="color:#3BA7FF">−</b> <b style="color:#FF7A1A">×</b> <b style="color:#9B6BFF">÷</b></p>
            </div>
            <div class="jtc-confetti"></div>
            <div class="jtc-rh jtc-rh-nw" data-dir="nw"></div>
            <div class="jtc-rh jtc-rh-n"  data-dir="n"></div>
            <div class="jtc-rh jtc-rh-ne" data-dir="ne"></div>
            <div class="jtc-rh jtc-rh-e"  data-dir="e"></div>
            <div class="jtc-rh jtc-rh-se" data-dir="se"></div>
            <div class="jtc-rh jtc-rh-s"  data-dir="s"></div>
            <div class="jtc-rh jtc-rh-sw" data-dir="sw"></div>
            <div class="jtc-rh jtc-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.jtc-inner');
        const well     = $('.jtc-well');
        const colsEl   = $('.jtc-cols');
        const blocksEl = $('.jtc-blocks');
        const targetsEl= $('.jtc-targets');
        const dangerEl = $('.jtc-danger');
        const cover    = $('.jtc-cover');
        const nextEl   = $('.jtc-next');
        const waveEl   = $('[data-role="wave"]');
        const meterEl  = $('[data-role="meter"]');
        const msg      = $('.jtc-msg');
        const chef     = $('.jtc-chef');
        const streakEl = $('[data-role="streak"]');
        const recordEl = $('[data-role="record"]');
        const scoreEl  = $('[data-role="score"]');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.jtc-help');
        const confetti = $('.jtc-confetti');
        const opSel    = $('.jtc-select');
        const lvlBtns  = container.querySelectorAll('.jtc-lvl');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1, opKey = 'add';
        let targets = [];            // résultats des colonnes
        let stacks = [];             // blocs gris coincés : [{calc, el}]
        let cur = null;              // bloc qui tombe : { calc, col, y, el, fast }
        let nextCalc = null;
        let running = false, paused = false, over = false;
        let wave = 1, waveGood = 0, good = 0, bad = 0, score = 0, streak = 0;
        let curScale = 1;
        let soundOn = true;
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const recKey = () => `${opKey}-${level}`;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };
        const L = () => JTC_LEVELS[level];
        const ops = () => OP_SETS[opKey].ops;
        const colW = () => WELL_W / L().cols;

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jtc-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            curScale = sc;
            container.style.setProperty('--jtc-s', sc.toFixed(4));
            layout();
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jtc-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bump) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 5);
            scoreEl.textContent = '⭐ ' + score;
            recordEl.textContent = '🏆 ' + (records[recKey()] || 0);
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            waveEl.textContent = `${Math.min(wave, WAVES)} / ${WAVES}`;
            meterEl.style.width = (waveGood / PER_WAVE * 100) + '%';
        }
        function blockSize() { return { w: colW() - 10, h: CELL_H - 6 }; }
        function posBlock(el, col, y) {
            const { w, h } = blockSize();
            const x = col * colW() + 5;
            el.style.width = (w * curScale) + 'px';
            el.style.height = (h * curScale) + 'px';
            const t = `translate(${(x * curScale).toFixed(1)}px, ${((y + 3) * curScale).toFixed(1)}px)`;
            el.style.transform = t;
            el.style.setProperty('--pos', t);
        }
        function layout() {
            well.style.height = (WELL_H * curScale) + 'px';
            const n = L().cols;
            colsEl.style.height = (ROWS * CELL_H * curScale) + 'px';
            targetsEl.style.height = (TARGET_H * curScale) + 'px';
            dangerEl.style.top = (CELL_H * curScale) + 'px';
            stacks.forEach((st, c) => st.forEach((b, k) => posBlock(b.el, c, (ROWS - 1 - k) * CELL_H)));
            if (cur) posBlock(cur.el, cur.col, cur.y);
            void n;
        }
        function renderColumns() {
            const n = L().cols;
            well.classList.toggle('c5', n >= 5);
            colsEl.innerHTML = Array.from({ length: n }, () => '<div class="jtc-col"></div>').join('');
            targetsEl.innerHTML = targets.map(v => `<div class="jtc-target new"><span>${v}</span></div>`).join('');
            setTimeout(() => targetsEl.querySelectorAll('.jtc-target').forEach(t => t.classList.remove('new')), 600);
            markCol();
        }
        function markCol() {
            const c = cur ? cur.col : -1;
            colsEl.querySelectorAll('.jtc-col').forEach((el, i) => el.classList.toggle('cur', i === c));
            targetsEl.querySelectorAll('.jtc-target').forEach((el, i) => el.classList.toggle('cur', i === c));
        }
        function blockEl(calc, cls) {
            const el = document.createElement('div');
            el.className = `jtc-block ${calc.op} ${cls || ''}`;
            el.innerHTML = cls && cls.includes('wrong') ? `${calc.text}<small>= ${calc.v}</small>` : calc.text;
            return el;
        }
        function renderNext() {
            nextEl.innerHTML = '';
            if (nextCalc) {
                const el = blockEl(nextCalc);
                nextEl.appendChild(el);
            }
        }

        // ── Blocs ──────────────────────────────────────────────────────────
        function newCalc() { return makeCalc(rnd(targets), L(), ops()); }
        function spawn() {
            if (!running || over) return;
            const calc = nextCalc || newCalc();
            nextCalc = newCalc();
            renderNext();
            const el = blockEl(calc, 'falling');
            blocksEl.appendChild(el);
            cur = { calc, col: Math.floor(L().cols / 2), y: -CELL_H * 0.6, el, fast: false };
            posBlock(el, cur.col, cur.y);
            markCol();
        }
        function landY(col) { return (ROWS - 1 - stacks[col].length) * CELL_H; }
        function move(dir) {
            if (!cur || paused || !running) return;
            const nc = cur.col + dir;
            if (nc < 0 || nc >= L().cols) return;
            // Ne pas traverser une pile plus haute que le bloc
            if (cur.y + CELL_H > landY(nc) + 2) return;
            cur.col = nc;
            posBlock(cur.el, cur.col, cur.y);
            markCol();
            sfx('move');
        }
        function drop() {
            if (!cur || paused || !running) return;
            cur.fast = true;
            sfx('drop');
        }
        function dropIn(col) {
            if (!cur || paused || !running) return;
            if (col < 0 || col >= L().cols) return;
            // Aller dans la colonne si le chemin est libre
            const step = col > cur.col ? 1 : -1;
            while (cur.col !== col) {
                const nc = cur.col + step;
                if (cur.y + CELL_H > landY(nc) + 2) break;
                cur.col = nc;
            }
            posBlock(cur.el, cur.col, cur.y);
            markCol();
            drop();
        }
        function land() {
            const b = cur;
            cur = null;
            const col = b.col;
            const ok = b.calc.v === targets[col];
            const tEl = targetsEl.children[col];
            b.el.classList.remove('falling');
            if (ok) {
                good++; waveGood++; streak++;
                const gain = 10 + (streak >= 5 ? 5 : 0) + (wave - 1) * 2;
                score += gain;
                posBlock(b.el, col, landY(col));
                b.el.classList.add('boom');
                setTimeout(() => b.el.remove(), 360);
                floatTxt(`+${gain}`, col, landY(col));
                if (tEl) { tEl.classList.add('flash-ok'); setTimeout(() => tEl.classList.remove('flash-ok'), 350); }
                sfx('good');
                // Bonus : un bloc gris de cette colonne disparaît
                let cleaned = false;
                if (stacks[col].length) {
                    const gone = stacks[col].pop();
                    gone.el.classList.add('boom');
                    setTimeout(() => gone.el.remove(), 360);
                    cleaned = true;
                }
                say(`✅ <span class="k">${b.calc.text} = ${b.calc.v}</span> ${rnd(['Bravo', 'Exact', 'Super', 'Bien joué'])} ! +${gain}${cleaned ? ' · un bloc gris s\'efface 🧹' : ''}${streak >= 5 ? ' 🔥' : ''}`, 'good');
                updateStats(true);
                if (waveGood >= PER_WAVE) return nextWave();
            } else {
                bad++; streak = 0;
                b.el.remove();
                const w = blockEl(b.calc, 'wrong land');
                blocksEl.appendChild(w);
                stacks[col].push({ calc: b.calc, el: w });
                posBlock(w, col, (ROWS - stacks[col].length) * CELL_H);
                if (tEl) { tEl.classList.add('flash-ko'); setTimeout(() => tEl.classList.remove('flash-ko'), 400); }
                sfx('bad');
                const right = targets.indexOf(b.calc.v);
                say(`❌ <span class="k">${b.calc.text} = ${b.calc.v}</span>, pas ${targets[col]} ! ${right >= 0 ? `Il fallait la colonne <b>${b.calc.v}</b>.` : ''} Le bloc reste coincé…`, 'bad');
                updateStats(false);
                if (stacks[col].length >= ROWS - 1) return gameOver();
            }
            setTimeout(spawn, 280);
        }
        function floatTxt(t, col, y) {
            const f = document.createElement('div');
            f.className = 'jtc-float';
            f.textContent = t;
            f.style.left = ((col * colW() + colW() / 2 - 16) * curScale) + 'px';
            f.style.top = (y * curScale) + 'px';
            blocksEl.appendChild(f);
            setTimeout(() => f.remove(), 800);
        }

        // ── Vagues ─────────────────────────────────────────────────────────
        function nextWave() {
            if (wave >= WAVES) return victory();
            wave++; waveGood = 0;
            running = false;
            sfx('wave');
            updateStats(false);
            showCover(`<div class="medal">🌊</div><h3>Vague ${wave} !</h3><p>Nouveaux résultats en bas… et ça tombe plus vite !</p>`);
            setTimeout(() => {
                if (!widget.isConnected || over) return;
                // Les blocs gris restent : leurs résultats peuvent ne plus exister → on les efface d'une rangée
                stacks.forEach(st => { const g = st.shift(); if (g) g.el.remove(); });
                targets = makeTargets(L(), ops());
                renderColumns();
                layout();
                nextCalc = null;
                hideCover();
                running = true;
                say(`🌊 Vague ${wave} sur ${WAVES} : de nouveaux résultats sont apparus en bas !`);
                spawn();
            }, 1600);
        }

        // ── Boucle ─────────────────────────────────────────────────────────
        let lastT = performance.now();
        function frame(t) {
            if (!widget.isConnected) return;
            const dt = Math.min(0.05, (t - lastT) / 1000);
            lastT = t;
            const frozen = !running || paused || over || helpBox.classList.contains('show') || document.hidden;
            if (!frozen && cur) {
                const v = cur.fast ? 16 : L().speed * (1 + (wave - 1) * 0.15) * (1 + Math.min(good, 40) * 0.004);
                cur.y += v * CELL_H * dt;
                const ly = landY(cur.col);
                if (cur.y >= ly) { cur.y = ly; posBlock(cur.el, cur.col, cur.y); land(); }
                else posBlock(cur.el, cur.col, cur.y);
            }
            requestAnimationFrame(frame);
        }

        // ── Écrans ─────────────────────────────────────────────────────────
        function showCover(html) { cover.innerHTML = html; cover.classList.remove('hide'); }
        function hideCover() { cover.classList.add('hide'); }
        function saveRecord() {
            const k = recKey();
            const isRec = score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) { /* stockage indisponible */ } }
            updateStats(false);
            return isRec;
        }
        function gameOver() {
            over = true; running = false;
            if (cur) { cur.el.remove(); cur = null; }
            sfx('over');
            const isRec = saveRecord();
            showCover(`<div class="medal">🧱</div><h3>La tour est pleine !</h3>
                <p>Vague ${wave} · ${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} · ${score} points${isRec ? ' · 🏆 record !' : ''}</p>
                <button class="jtc-btn jtc-btn-go" data-act="again">🔄 Rejouer</button>`);
            cover.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            say(`🧱 Une colonne est montée jusqu'en haut ! Tu as atteint la vague ${wave}. Rejoue pour faire mieux !`, 'bad');
        }
        function victory() {
            over = true; running = false;
            sfx('win'); party();
            const isRec = saveRecord();
            const acc = good / Math.max(1, good + bad);
            const medal = acc >= 0.9 ? '🥇' : acc >= 0.75 ? '🥈' : '🥉';
            showCover(`<div class="medal">${medal}</div><h3>Tour terminée !</h3>
                <p>Les ${WAVES} vagues sont passées : ${good} bonnes réponses, ${bad} erreur${bad > 1 ? 's' : ''} · ${score} points${isRec ? ' · 🏆 record !' : ''}</p>
                <button class="jtc-btn jtc-btn-go" data-act="again">🔄 Rejouer</button>`);
            cover.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            say(`🏆 Bravo, tu as terminé les ${WAVES} vagues ! Essaie un niveau plus difficile ou d'autres opérations.`, 'good');
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
        function reset() {
            running = false; paused = false; over = false;
            blocksEl.innerHTML = '';
            cur = null; nextCalc = null;
            stacks = Array.from({ length: L().cols }, () => []);
            wave = 1; waveGood = 0; good = 0; bad = 0; score = 0; streak = 0;
            targets = makeTargets(L(), ops());
            renderColumns();
            renderNext();
            layout();
            updateStats(false);
            btn('pause').textContent = '⏸ Pause';
            showCover(`<div class="medal">🧱</div><h3>Tour de calcul</h3>
                <p>${OP_SETS[opKey].label} · ${L().label}</p>
                <button class="jtc-btn jtc-btn-go" data-act="go">▶ Jouer</button>`);
            cover.querySelector('[data-act="go"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            say('🧱 Guide chaque bloc-calcul vers la colonne de son <b>résultat</b>. Clique sur <b>▶ Jouer</b> !');
        }
        function start() {
            reset();
            hideCover();
            container.focus({ preventScroll: true });
            running = true;
            lastT = performance.now();
            say(`🧱 C'est parti ! Vague 1 sur ${WAVES}.`);
            spawn();
        }
        function setPaused(p) {
            if (!running && !paused) return;
            paused = p;
            btn('pause').textContent = p ? '▶ Reprendre' : '⏸ Pause';
            if (p) showCover('<h3>⏸ Pause</h3><p>Clique ici pour reprendre</p>');
            else hideCover();
        }
        cover.addEventListener('pointerdown', (e) => { if (paused) { e.stopPropagation(); setPaused(false); } });

        // ── Commandes ──────────────────────────────────────────────────────
        well.addEventListener('pointerdown', (e) => {
            if (!cur || paused || !running) return;
            e.preventDefault();
            container.focus({ preventScroll: true });
            const r = well.getBoundingClientRect();
            const k = r.width / well.offsetWidth || 1;
            const x = (e.clientX - r.left) / k / curScale;
            dropIn(Math.floor(x / colW()));
        });
        btn('left').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); move(-1); });
        btn('right').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); move(1); });
        btn('drop').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); drop(); });
        btn('pause').addEventListener('click', () => setPaused(!paused));
        btn('restart').addEventListener('click', () => reset());

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if (k === 'arrowleft') { e.preventDefault(); move(-1); }
            else if (k === 'arrowright') { e.preventDefault(); move(1); }
            else if (k === 'arrowdown' || k === ' ') { e.preventDefault(); if (!running && !paused && !over && !cover.classList.contains('hide')) start(); else drop(); }
            else if (k === 'p') { e.preventDefault(); setPaused(!paused); }
            else if (k === 'enter' && (over || !running) && !paused) { e.preventDefault(); start(); }
        };
        document.addEventListener('keydown', onKey);

        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            reset();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        opSel.addEventListener('change', () => { opKey = opSel.value; reset(); });
        opSel.addEventListener('pointerdown', (e) => e.stopPropagation());
        opSel.addEventListener('mousedown', (e) => e.stopPropagation());

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
            if (running) setPaused(true);
            window._wfMiniBarCollapse(widget, '🧱 Tour de calcul', { onExpand: applyScale });
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
        container.querySelectorAll('.jtc-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, .jtc-well, .jtc-rh, .jtc-help')) {
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
            if (type === 'jeu-tour-calcul') return window.createJeuTourCalculWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-tour-calcul') return window.createJeuTourCalculWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
