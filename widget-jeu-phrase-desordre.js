// =========================================================================
// JEU « PHRASE EN DÉSORDRE » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — mode jeu élèves
//
// Les mots d'une phrase sont mélangés : l'élève les remet dans l'ordre
// (clic ou glisser-déposer). Indices : la majuscule du premier mot et le
// point final (. ! ?). Option « sans indices ».
// 3 niveaux : facile   (4 à 6 mots, premier mot et point déjà placés)
//             moyen    (5 à 7 mots, questions et exclamations)
//             difficile(phrases longues)
// Lecture à voix haute de la phrase (synthèse vocale du navigateur).
//
// Ouverture : createWidget('jeu-phrase-desordre')
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


    // ── CSS du jeu (préfixe jpd2-) ─────────────────────────────────────────
    if (!document.getElementById('widget-jeu-phrase-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-phrase-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-phrase-desordre"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jph-container {
            --jph-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jph-s)) calc(14px * var(--jph-s)) calc(14px * var(--jph-s));
            border-radius: calc(24px * var(--jph-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jph-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
        }
        .jph-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jph-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jph-s));
            width: 100%; max-width: calc(672px * var(--jph-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jph-header { display: flex; align-items: center; gap: calc(10px * var(--jph-s)); cursor: move; flex-wrap: wrap; }
        .jph-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jph-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jph-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jph-stats { display: flex; gap: calc(6px * var(--jph-s)); align-items: center; margin-left: auto; }
        .jph-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jph-s)) calc(10px * var(--jph-s));
            font-weight: 900; font-size: calc(14px * var(--jph-s));
            white-space: nowrap;
        }
        .jph-chip.hot { background: #FF7A1A; }
        @keyframes jph-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jph-chip.bump { animation: jph-bump .4s ease; }
        .jph-icon-btn {
            width: calc(26px * var(--jph-s)); height: calc(26px * var(--jph-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jph-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jph-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Réglages ── */
        .jph-bar { display: flex; align-items: center; gap: calc(6px * var(--jph-s)); flex-wrap: wrap; }
        .jph-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jph-s));
            padding: calc(5px * var(--jph-s)) calc(12px * var(--jph-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jph-lvl:hover { background: rgba(255,255,255,0.1); }
        .jph-lvl:active { transform: scale(0.95); }
        .jph-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jph-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jph-s));
            padding: calc(4px * var(--jph-s)) calc(8px * var(--jph-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }
        .jph-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jph-s)); align-items: center; flex-shrink: 0; }
        .jph-pdot {
            width: calc(14px * var(--jph-s)); height: calc(14px * var(--jph-s));
            border-radius: 50%; background: rgba(255,255,255,0.15);
        }
        .jph-pdot.good { background: var(--vert); }
        .jph-pdot.meh { background: #FFB020; }
        .jph-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Atelier ── */
        .jph-stage {
            position: relative;
            border-radius: calc(18px * var(--jph-s));
            overflow: hidden;
            background: linear-gradient(180deg, #2E5E4E 0%, #27513F 100%);
            box-shadow: inset 0 0 0 calc(8px * var(--jph-s)) #8A5A33, inset 0 0 calc(40px * var(--jph-s)) rgba(0,0,0,0.35);
            padding: calc(16px * var(--jph-s)) calc(20px * var(--jph-s)) calc(14px * var(--jph-s));
            display: flex; flex-direction: column; gap: calc(10px * var(--jph-s));
        }
        .jph-zone-label {
            color: rgba(255,255,255,0.7); font-weight: 900; font-size: calc(11px * var(--jph-s));
            text-transform: uppercase; letter-spacing: 1.5px;
            display: flex; align-items: center; gap: calc(8px * var(--jph-s));
        }
        .jph-zone-label::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.2); }
        .jph-line {
            min-height: calc(120px * var(--jph-s));
            display: flex; flex-wrap: wrap; align-content: flex-start; align-items: flex-end;
            gap: calc(10px * var(--jph-s)) calc(8px * var(--jph-s));
            padding: calc(10px * var(--jph-s)) calc(4px * var(--jph-s)) calc(14px * var(--jph-s));
            background:
                repeating-linear-gradient(180deg, transparent 0 calc(58px * var(--jph-s)), rgba(255,255,255,0.35) calc(58px * var(--jph-s)) calc(60px * var(--jph-s)));
            border-radius: calc(10px * var(--jph-s));
            transition: background-color .15s;
        }
        .jph-line.over { background-color: rgba(255,255,255,0.07); }
        .jph-line-empty { color: rgba(255,255,255,0.45); font-weight: 800; font-size: calc(15px * var(--jph-s)); font-style: italic; padding: calc(12px * var(--jph-s)) calc(4px * var(--jph-s)); }
        .jph-pool {
            min-height: calc(60px * var(--jph-s));
            display: flex; flex-wrap: wrap; justify-content: center; align-content: flex-start;
            gap: calc(10px * var(--jph-s));
            padding: calc(8px * var(--jph-s));
            background: rgba(0,0,0,0.18);
            border-radius: calc(12px * var(--jph-s));
            transition: background .15s;
        }
        .jph-pool.over { background: rgba(0,0,0,0.3); }
        .jph-pool-empty { color: rgba(255,255,255,0.5); font-weight: 800; font-size: calc(13px * var(--jph-s)); align-self: center; padding: calc(10px * var(--jph-s)); }

        /* Étiquettes-mots */
        .jph-word {
            position: relative;
            background: linear-gradient(180deg, #FFFDF5, #FFF1D2);
            color: var(--encre);
            border-radius: calc(10px * var(--jph-s));
            padding: calc(8px * var(--jph-s)) calc(13px * var(--jph-s));
            font-weight: 900; font-size: calc(22px * var(--jph-s)); line-height: 1.1;
            box-shadow: 0 calc(4px * var(--jph-s)) 0 #C9A76A, 0 calc(6px * var(--jph-s)) calc(8px * var(--jph-s)) rgba(0,0,0,0.25);
            cursor: grab; touch-action: none;
            transition: transform .1s, box-shadow .1s, background .15s, opacity .15s;
            white-space: nowrap;
        }
        .jph-word:hover { transform: translateY(calc(-2px * var(--jph-s))); }
        .jph-word.punct {
            background: linear-gradient(180deg, #FFE27A, #FFC933); min-width: calc(30px * var(--jph-s)); text-align: center;
            box-shadow: 0 calc(4px * var(--jph-s)) 0 #B3840B, 0 calc(6px * var(--jph-s)) calc(8px * var(--jph-s)) rgba(0,0,0,0.25);
        }
        .jph-word.cap::first-letter { color: #D02F6E; }
        .jph-word.locked { cursor: default; }
        .jph-word.locked::after {
            content: '📌'; position: absolute; top: calc(-10px * var(--jph-s)); right: calc(-6px * var(--jph-s));
            font-size: calc(13px * var(--jph-s));
        }
        .jph-word.ghostsrc { opacity: 0.3; }
        .jph-word.ok  { background: linear-gradient(180deg, #E7FAEF, #BDF0D2); box-shadow: 0 calc(4px * var(--jph-s)) 0 #1C8A4F, 0 calc(6px * var(--jph-s)) calc(8px * var(--jph-s)) rgba(0,0,0,0.25); }
        .jph-word.ko  { background: linear-gradient(180deg, #FFEDEF, #FFC2C8); box-shadow: 0 calc(4px * var(--jph-s)) 0 #B32B38, 0 calc(6px * var(--jph-s)) calc(8px * var(--jph-s)) rgba(0,0,0,0.25); animation: jph-shake .4s ease; }
        .jph-word.hinted { box-shadow: 0 0 0 calc(3px * var(--jph-s)) var(--or), 0 calc(4px * var(--jph-s)) 0 #C9A76A; }
        @keyframes jph-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px) rotate(-2deg); }
            40% { transform: translateX(5px) rotate(2deg); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); }
        }
        @keyframes jph-in { 0% { transform: scale(0.6); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .jph-word.in { animation: jph-in .22s ease-out; }
        .jph-caret {
            width: calc(5px * var(--jph-s)); height: calc(40px * var(--jph-s));
            background: var(--or); border-radius: 3px; align-self: center;
            box-shadow: 0 0 calc(8px * var(--jph-s)) var(--or);
        }
        .jph-ghost {
            position: fixed; z-index: 99999; pointer-events: none;
            transform: translate(-50%, -50%) rotate(-4deg) scale(1.08);
            opacity: 0.95;
        }
        .jph-board-done .jph-word { cursor: default; }

        /* ── Actions ── */
        .jph-actions { display: flex; gap: calc(8px * var(--jph-s)); justify-content: center; flex-wrap: wrap; }
        .jph-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jph-s));
            padding: calc(8px * var(--jph-s)) calc(14px * var(--jph-s));
            border-radius: calc(14px * var(--jph-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jph-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jph-btn:hover { filter: brightness(1.05); }
        .jph-btn:active { transform: translateY(calc(4px * var(--jph-s))); box-shadow: 0 calc(1px * var(--jph-s)) 0 #B9B2D6; }
        .jph-btn:disabled { opacity: 0.45; cursor: default; }
        .jph-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jph-s));
            padding: calc(8px * var(--jph-s)) calc(22px * var(--jph-s));
            box-shadow: 0 calc(5px * var(--jph-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jph-btn-go:active { box-shadow: 0 calc(1px * var(--jph-s)) 0 #1C8A4F; }
        .jph-btn:focus-visible, .jph-lvl:focus-visible, .jph-select:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jph-talk { display: flex; align-items: center; gap: calc(10px * var(--jph-s)); }
        .jph-chef {
            width: calc(44px * var(--jph-s)); height: calc(44px * var(--jph-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jph-s));
            box-shadow: 0 calc(3px * var(--jph-s)) 0 #B3840B;
        }
        @keyframes jph-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jph-s))) rotate(-8deg); } }
        .jph-chef.hop { animation: jph-hop .4s ease; }
        .jph-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jph-s));
            padding: calc(8px * var(--jph-s)) calc(12px * var(--jph-s));
            font-weight: 700; font-size: calc(15px * var(--jph-s)); line-height: 1.35;
            min-height: calc(22px * var(--jph-s));
            border-left: calc(6px * var(--jph-s)) solid var(--or);
        }
        .jph-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jph-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jph-msg b { font-weight: 900; }

        /* ── Écrans ── */
        .jph-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.35);
        }
        .jph-overlay.show { display: flex; }
        .jph-card {
            background: #fff; border-radius: calc(18px * var(--jph-s));
            padding: calc(12px * var(--jph-s)) calc(22px * var(--jph-s)) calc(14px * var(--jph-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jph-s)) 0 #B9B2D6;
            animation: jph-pop .35s ease-out;
            max-width: 90%;
        }
        @keyframes jph-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jph-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jph-s)); color: var(--encre); }
        .jph-card p { margin: calc(4px * var(--jph-s)) 0 calc(8px * var(--jph-s)); font-weight: 800; font-size: calc(14px * var(--jph-s)); }
        .jph-card .jph-sentence { font-size: calc(18px * var(--jph-s)); color: #1C8A4F; }
        .jph-card .row { display: flex; gap: calc(8px * var(--jph-s)); justify-content: center; flex-wrap: wrap; }
        .jph-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jph-s)); margin: calc(4px * var(--jph-s)) 0; }
        .jph-bigstars span { font-size: calc(34px * var(--jph-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jph-bigstars span.on { opacity: 1; filter: none; animation: jph-pop .35s ease-out both; }
        .jph-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jph-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jph-medal { font-size: calc(56px * var(--jph-s)); line-height: 1; animation: jph-pop .5s ease-out; }

        /* ── Aide ── */
        .jph-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jph-help.show { display: block; }
        .jph-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jph-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jph-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jph-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jph-fall 1.8s ease-in forwards; }
        @keyframes jph-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jph-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jph-container:hover .jph-rh { opacity: 1; }
        .jph-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jph-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jph-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jph-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jph-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jph-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jph-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jph-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jph-container *, .jph-container *::before, .jph-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // PHRASES — choisies pour n'avoir qu'un seul ordre correct.
    // Quand un autre ordre est aussi juste, il est donné après « | ».
    // =========================================================================
    const JPH_SENTENCES = {
        1: [
            'Le chien court vite.', 'Ma sœur lit un livre.', 'Papa prépare le repas.', 'Les oiseaux chantent le matin.',
            'Tom mange une pomme.', 'La maîtresse écrit au tableau.', 'Le soleil brille fort.', 'Nous jouons au ballon.',
            'Mon chat aime le lait.', 'Les enfants rient beaucoup.', 'Léa dessine une maison.', 'Le bébé dort bien.',
            'Le lapin mange une carotte.', 'Maman chante une chanson.', 'Le train arrive en gare.', 'Les fleurs sont jolies.',
            'Je range ma chambre.', 'Le poisson nage vite.', 'Il fait très beau.', 'Tu as un joli vélo.',
        ],
        2: [
            'Le petit chien joue dans la cour.', 'Où as-tu caché le trésor ?', 'Quelle belle journée d\'été !',
            'La grenouille saute dans la mare.', 'Mon grand frère joue du piano.', 'Veux-tu venir jouer avec moi ?',
            'Le boulanger vend du pain frais.', 'Les vaches mangent l\'herbe du pré.', 'Attention au chien méchant !',
            'Julie a perdu sa trousse rouge.', 'Le pompier éteint un grand feu.', 'Pourquoi le ciel est-il bleu ?',
            'Les feuilles tombent en automne.', 'Mon oncle habite dans une grande ville.',
            'Nous partons à la mer demain.|Nous partons demain à la mer.',
            'Les élèves écoutent la maîtresse attentivement.|Les élèves écoutent attentivement la maîtresse.',
            'Mes parents regardent un film ce soir.', 'Quel gâteau délicieux !', 'As-tu fini ton dessin ?',
        ],
        3: [
            'Le vieux marin raconte des histoires de pirates.',
            'Les petits oiseaux construisent leur nid dans le grand arbre.',
            'Mon cousin a reçu un vélo pour son anniversaire.',
            'La sorcière prépare une potion magique dans son chaudron.|La sorcière prépare une potion dans son chaudron magique.',
            'Est-ce que tu as fini tes devoirs de mathématiques ?',
            'Les astronautes ont marché sur la lune.',
            'Ma grand-mère prépare une délicieuse tarte aux pommes.',
            'Nous avons visité un château très ancien.',
            'Quel magnifique arc-en-ciel apparaît dans le ciel !',
            'Le facteur apporte une lettre à mes voisins.',
            'Les dauphins nagent rapidement dans la mer bleue.|Les dauphins nagent dans la mer bleue rapidement.',
            'Combien de bonbons as-tu mangés ce matin ?',
            'Le petit prince habite sur une planète lointaine.',
            'Mon chien adore courir après les pigeons du parc.',
            'Les pompiers sont arrivés très vite sur place.',
            'Mes amis et moi construisons une cabane dans la forêt.',
            'La maîtresse nous lit une histoire chaque matin.',
            'Pourquoi les feuilles des arbres tombent-elles en automne ?',
        ],
    };
    // Noms propres : gardent leur majuscule même en mode « sans indices »
    const PROPER = ['Tom', 'Léa', 'Julie', 'Léo'];
    const PUNCT = ['.', '!', '?'];
    const JPH_LEVELS = {
        1: { lockEnds: true,  label: '4 à 6 mots, début et fin déjà placés' },
        2: { lockEnds: false, label: '5 à 7 mots, questions et exclamations' },
        3: { lockEnds: false, label: 'phrases longues' },
    };
    const ROUND_SIZE = 8;
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];

    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    // « Où as-tu caché le trésor ? » → ['Où', 'as-tu', 'caché', 'le', 'trésor', '?']
    function tokenize(sentence) {
        const m = sentence.trim().match(/^(.*?)\s*([.!?])$/);
        const words = m[1].split(/\s+/);
        return words.concat([m[2]]);
    }
    function joinTokens(tokens) {
        return tokens.join(' ').replace(/ \./g, '.').replace(/ ([!?])/g, '\u202F$1');
    }

    // ── Sons + lecture à voix haute ────────────────────────────────────────
    let _jphAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jphAudio) _jphAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jphAudio, t0 = ctx.currentTime + start;
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
        put:   () => tone(700, 0, 0.05, 'triangle', 0.06),
        back:  () => tone(420, 0, 0.05, 'triangle', 0.05),
        bad:   () => { tone(200, 0, 0.18, 'square', 0.05); tone(150, 0.16, 0.22, 'square', 0.05); },
        hint:  () => tone(880, 0, 0.15, 'sine', 0.08),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
    };
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function speak(text) {
        if (!canSpeak) return;
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'fr-FR'; u.rate = 0.85;
            const v = window.speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
            if (v) u.voice = v;
            window.speechSynthesis.speak(u);
        } catch (e) { /* lecture indisponible */ }
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuPhraseDesordreWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-phrase-desordre';
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
        container.className = 'jph-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jph-inner">
            <div class="jph-header">
                <span class="jph-title">Phrase en désordre</span>
                <div class="jph-stats">
                    <span class="jph-chip" data-role="streak" title="Phrases réussies du premier coup d'affilée">🔥 0</span>
                    <span class="jph-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jph-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jph-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jph-bar">
                <button class="jph-lvl active" data-level="1">😊 Facile</button>
                <button class="jph-lvl" data-level="2">😐 Moyen</button>
                <button class="jph-lvl" data-level="3">😤 Difficile</button>
                <select class="jph-select" title="Indices">
                    <option value="on">🔎 Avec indices</option>
                    <option value="off">🙈 Sans indices</option>
                </select>
                <div class="jph-progress" title="Phrases de la partie">${'<span class="jph-pdot"></span>'.repeat(ROUND_SIZE)}</div>
            </div>

            <div class="jph-stage">
                <div class="jph-zone-label">✏️ Ma phrase</div>
                <div class="jph-line"></div>
                <div class="jph-zone-label">🧺 Les mots en désordre</div>
                <div class="jph-pool"></div>
                <div class="jph-overlay" data-role="win"><div class="jph-card"></div></div>
            </div>

            <div class="jph-actions">
                <button class="jph-btn jph-btn-go" data-act="check">✔ Vérifier</button>
                <button class="jph-btn" data-act="hint">💡 Indice</button>
                <button class="jph-btn" data-act="listen">🔊 Écouter</button>
                <button class="jph-btn" data-act="clear">↩ Tout enlever</button>
                <button class="jph-btn" data-act="skip">⏭ Passer</button>
            </div>

            <div class="jph-talk">
                <div class="jph-chef">🦉</div>
                <div class="jph-msg"></div>
            </div>
          </div>

            <div class="jph-help">
                <h4>🦉 Comment jouer ?</h4>
                <p>Les mots d'une phrase sont en désordre. Remets-les dans le bon ordre pour écrire une phrase correcte !</p>
                <p>👆 <b>Clique</b> sur un mot pour l'ajouter à ta phrase, clique sur un mot de ta phrase pour le retirer. Tu peux aussi <b>faire glisser</b> les mots pour les ranger où tu veux.</p>
                <p>🔎 <b>Les indices</b> : le mot avec une <b>majuscule</b> commence la phrase, et le <b>point</b> (. ! ?) la termine.</p>
                <p>😊 <b>Facile</b> : phrases courtes, le premier mot et le point sont déjà placés 📌.<br>😐 <b>Moyen</b> : questions et exclamations.<br>😤 <b>Difficile</b> : phrases longues.</p>
                <p style="margin:0">🔊 <b>Écouter</b> lit la phrase à voix haute (compte comme un indice). ⭐⭐⭐ si tu réussis du premier coup sans aide.</p>
            </div>
            <div class="jph-confetti"></div>
            <div class="jph-rh jph-rh-nw" data-dir="nw"></div>
            <div class="jph-rh jph-rh-n"  data-dir="n"></div>
            <div class="jph-rh jph-rh-ne" data-dir="ne"></div>
            <div class="jph-rh jph-rh-e"  data-dir="e"></div>
            <div class="jph-rh jph-rh-se" data-dir="se"></div>
            <div class="jph-rh jph-rh-s"  data-dir="s"></div>
            <div class="jph-rh jph-rh-sw" data-dir="sw"></div>
            <div class="jph-rh jph-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.jph-inner');
        const stage    = $('.jph-stage');
        const lineEl   = $('.jph-line');
        const poolEl   = $('.jph-pool');
        const msg      = $('.jph-msg');
        const chef     = $('.jph-chef');
        const winLayer = $('[data-role="win"]');
        const winCard  = winLayer.querySelector('.jph-card');
        const streakEl = $('[data-role="streak"]');
        const scoreEl  = $('[data-role="score"]');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.jph-help');
        const confetti = $('.jph-confetti');
        const clueSel  = $('.jph-select');
        const lvlBtns  = container.querySelectorAll('.jph-lvl');
        const pdots    = container.querySelectorAll('.jph-pdot');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1, clues = true;
        let queue = [], qi = 0, results = [];
        let answers = [];            // ordres acceptés (listes de textes)
        let tokens = [];             // { id, text, punct, locked }
        let line = [], pool = [];    // ids
        let errors = 0, hints = 0;
        let score = 0, streak = 0, roundStars = 0;
        let done = false;
        let soundOn = true;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--jph-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jph-s', sc.toFixed(4));
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jph-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bump) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.className = 'jph-pdot' + (results[i] ? ' ' + results[i] : '') + (i === qi && !results[i] ? ' current' : '');
            });
        }
        const tok = (id) => tokens.find(t => t.id === id);
        function wordEl(t, where) {
            const el = document.createElement('div');
            el.className = 'jph-word' + (t.punct ? ' punct' : '') + (t.locked ? ' locked' : '') + (clues && /^[A-ZÀ-ÖØ-Þ]/.test(t.text) && !t.punct ? ' cap' : '');
            el.textContent = t.text;
            el.dataset.id = t.id;
            el.dataset.where = where;
            if (!t.locked) el.addEventListener('pointerdown', (e) => startDrag(e, t, el));
            return el;
        }
        function render(justId) {
            lineEl.innerHTML = '';
            poolEl.innerHTML = '';
            if (!line.length) lineEl.innerHTML = '<span class="jph-line-empty">Clique sur les mots dans l\'ordre pour écrire ta phrase…</span>';
            line.forEach(id => { const el = wordEl(tok(id), 'line'); if (id === justId) el.classList.add('in'); lineEl.appendChild(el); });
            if (!pool.length) poolEl.innerHTML = '<span class="jph-pool-empty">Tous les mots sont placés : clique sur ✔ Vérifier !</span>';
            pool.forEach(id => { const el = wordEl(tok(id), 'pool'); if (id === justId) el.classList.add('in'); poolEl.appendChild(el); });
            btn('check').disabled = pool.length > 0 || done;
        }

        // ── Déplacements ───────────────────────────────────────────────────
        // Place « id » dans la phrase à la position « at » (entre les mots bloqués)
        function lockBounds() {
            const first = line.length && tok(line[0]).locked ? 1 : 0;
            const last = line.length && tok(line[line.length - 1]).locked ? line.length - 1 : line.length;
            return [first, last];
        }
        function putInLine(id, at) {
            pool = pool.filter(x => x !== id);
            line = line.filter(x => x !== id);
            const [lo, hi] = lockBounds();
            if (at === undefined || at > hi) at = hi;
            if (at < lo) at = lo;
            line.splice(at, 0, id);
        }
        function putInPool(id) {
            line = line.filter(x => x !== id);
            if (!pool.includes(id)) pool.push(id);
        }
        function clearMarks() { container.querySelectorAll('.jph-word.ok, .jph-word.ko').forEach(el => el.classList.remove('ok', 'ko')); }

        // Glisser-déposer (ou simple clic)
        function startDrag(e, t, el) {
            if (done || winLayer.classList.contains('show')) return;
            e.preventDefault(); e.stopPropagation();
            container.focus({ preventScroll: true });
            const sx = e.clientX, sy = e.clientY;
            let ghost = null, caret = null, target = null;
            const from = el.dataset.where;
            const onMove = (ev) => {
                if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
                    ghost = el.cloneNode(true);
                    ghost.classList.add('jph-ghost');
                    ghost.classList.remove('in', 'ok', 'ko');
                    ghost.style.setProperty('--jph-s', getComputedStyle(container).getPropertyValue('--jph-s'));
                    ghost.style.fontSize = getComputedStyle(el).fontSize;
                    ghost.style.padding = getComputedStyle(el).padding;
                    document.body.appendChild(ghost);
                    el.classList.add('ghostsrc');
                    caret = document.createElement('div');
                    caret.className = 'jph-caret';
                }
                if (!ghost) return;
                ghost.style.left = ev.clientX + 'px';
                ghost.style.top = ev.clientY + 'px';
                const hit = document.elementFromPoint(ev.clientX, ev.clientY);
                const inLine = hit && (hit.closest('.jph-line') === lineEl);
                const inPool = hit && (hit.closest('.jph-pool') === poolEl);
                lineEl.classList.toggle('over', !!inLine);
                poolEl.classList.toggle('over', !!inPool);
                if (caret.parentNode) caret.remove();
                target = null;
                if (inLine) {
                    // Position d'insertion d'après les étiquettes de la phrase
                    const els = Array.from(lineEl.querySelectorAll('.jph-word')).filter(w => w !== el);
                    let idx = els.length, before = null;
                    for (let i = 0; i < els.length; i++) {
                        const r = els[i].getBoundingClientRect();
                        const sameRow = ev.clientY >= r.top - 8 && ev.clientY <= r.bottom + 8;
                        if ((sameRow && ev.clientX < r.left + r.width / 2) || ev.clientY < r.top - 8) { idx = i; before = els[i]; break; }
                    }
                    const ids = els.map(w => w.dataset.id);
                    target = { zone: 'line', at: idx, ids };
                    if (before) lineEl.insertBefore(caret, before); else lineEl.appendChild(caret);
                } else if (inPool) target = { zone: 'pool' };
            };
            const onUp = () => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.removeEventListener('pointercancel', onUp);
                lineEl.classList.remove('over'); poolEl.classList.remove('over');
                clearMarks();
                if (!ghost) {
                    // Simple clic : aller-retour entre la réserve et la phrase
                    if (from === 'pool') { putInLine(t.id); sfx('put'); }
                    else { putInPool(t.id); sfx('back'); }
                    render(t.id);
                    return;
                }
                ghost.remove();
                if (caret && caret.parentNode) caret.remove();
                if (target && target.zone === 'line') {
                    // Index dans « line » sans le mot déplacé
                    line = line.filter(x => x !== t.id);
                    pool = pool.filter(x => x !== t.id);
                    const anchorId = target.ids[target.at];
                    let at = anchorId ? line.indexOf(anchorId) : line.length;
                    putInLine(t.id, at);
                    sfx('put');
                } else if (target && target.zone === 'pool') {
                    putInPool(t.id); sfx('back');
                }
                render(t.id);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onUp);
        }

        // ── Nouvelle phrase ────────────────────────────────────────────────
        function loadSentence() {
            const raw = queue[qi];
            const variants = raw.split('|');
            answers = variants.map(v => {
                let tk = tokenize(v);
                if (!clues) {
                    tk = tk.filter(x => !PUNCT.includes(x));
                    if (!PROPER.includes(tk[0])) tk[0] = tk[0].charAt(0).toLowerCase() + tk[0].slice(1);
                }
                return tk;
            });
            const main = answers[0];
            tokens = main.map((text, i) => ({ id: 'w' + i, text, punct: PUNCT.includes(text), locked: false }));
            const L = JPH_LEVELS[level];
            line = []; pool = [];
            if (L.lockEnds && clues) {
                tokens[0].locked = true;
                tokens[tokens.length - 1].locked = true;
                line = [tokens[0].id, tokens[tokens.length - 1].id];
            }
            // Mélange : jamais dans l'ordre de départ
            let rest = tokens.filter(t => !line.includes(t.id)).map(t => t.id);
            let mixed;
            let tries = 0;
            do { mixed = shuffle(rest); tries++; } while (rest.length > 1 && mixed.join() === rest.join() && tries < 20);
            pool = mixed;
            errors = 0; hints = 0; done = false;
            winLayer.classList.remove('show');
            stage.classList.remove('jph-board-done');
            render();
            updateStats(false);
            btn('listen').style.display = canSpeak && level === 1 ? '' : 'none';
            say(L.lockEnds && clues
                ? `🦉 Phrase ${qi + 1} sur ${ROUND_SIZE}. Le premier mot et le point sont déjà placés 📌 : range les autres mots au milieu !`
                : clues
                    ? `🦉 Phrase ${qi + 1} sur ${ROUND_SIZE}. Cherche le mot avec une <b>majuscule</b> pour commencer, et garde le <b>point</b> pour la fin !`
                    : `🦉 Phrase ${qi + 1} sur ${ROUND_SIZE}. Sans indices : lis bien tous les mots avant de commencer.`);
        }
        function newRound() {
            const pool = shuffle(JPH_SENTENCES[level]);
            queue = pool.slice(0, Math.min(ROUND_SIZE, pool.length));
            qi = 0; results = []; roundStars = 0;
            loadSentence();
        }

        // ── Vérification ───────────────────────────────────────────────────
        function currentTexts() { return line.map(id => tok(id).text); }
        function check() {
            if (done || pool.length) return;
            const cur = currentTexts();
            const match = answers.find(a => a.join('\u0001') === cur.join('\u0001'));
            if (match) return win(match);
            errors++;
            streak = 0;
            sfx('bad');
            // Comparer avec la réponse la plus proche
            const best = answers.map(a => ({ a, n: a.filter((w, i) => cur[i] === w).length })).sort((x, y) => y.n - x.n)[0].a;
            const els = lineEl.querySelectorAll('.jph-word');
            els.forEach((el, i) => el.classList.add(cur[i] === best[i] ? 'ok' : 'ko'));
            const nGood = best.filter((w, i) => cur[i] === w).length;
            let tip = '';
            if (clues && cur[0] !== best[0]) tip = ' Le premier mot doit avoir une <b>majuscule</b>.';
            else if (clues && PUNCT.includes(best[best.length - 1]) && cur[cur.length - 1] !== best[best.length - 1]) tip = ' Le <b>point</b> se met toujours à la fin.';
            else if (errors >= 2) tip = ' Lis ta phrase à voix basse : est-ce qu\'elle veut dire quelque chose ?';
            say(`🤔 Pas encore ! <b>${nGood}</b> mot${nGood > 1 ? 's' : ''} sur ${best.length} ${nGood > 1 ? 'sont' : 'est'} à la bonne place (en vert).${tip}${errors >= 3 ? ' Besoin d\'aide ? Essaie 💡.' : ''}`, 'bad');
            updateStats(false);
        }
        function win(ans) {
            done = true;
            stage.classList.add('jph-board-done');
            const st = errors === 0 && hints === 0 ? 3 : errors + hints <= 2 ? 2 : 1;
            const perfect = st === 3;
            streak = perfect ? streak + 1 : 0;
            const pts = st * 10 + (streak >= 3 ? 5 : 0);
            score += pts; roundStars += st;
            results[qi] = perfect ? 'good' : 'meh';
            lineEl.querySelectorAll('.jph-word').forEach(el => el.classList.add('ok'));
            updateStats(true);
            sfx('win');
            party();
            const text = joinTokens(ans);
            say(`🎉 ${rnd(['Bravo', 'Parfait', 'Super', 'Excellent', 'Génial'])} ! Ta phrase est correcte. +${pts}${streak >= 3 ? ' 🔥' : ''}`, 'good');
            setTimeout(() => {
                if (!widget.isConnected) return;
                const last = qi >= queue.length - 1;
                winCard.innerHTML = `
                    <h3>${perfect ? 'Du premier coup !' : 'Phrase réussie !'}</h3>
                    <div class="jph-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                    <p class="jph-sentence">« ${esc(text)} »</p>
                    <div class="row">
                        ${canSpeak ? '<button class="jph-btn" data-act="say">🔊 Écouter</button>' : ''}
                        <button class="jph-btn jph-btn-go" data-act="next">${last ? '🏁 Fin de la partie' : 'Phrase suivante ▶'}</button>
                    </div>`;
                winLayer.classList.add('show');
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
                const sb = winCard.querySelector('[data-act="say"]');
                if (sb) sb.addEventListener('click', (e) => { e.stopPropagation(); speak(text); });
                winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (canSpeak) window.speechSynthesis.cancel();
                    if (last) finalScreen(); else { qi++; loadSentence(); }
                });
            }, 700);
        }
        function finalScreen() {
            const max = queue.length * 3;
            const medal = roundStars >= max - 2 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'As de la phrase !' : medal === '🥈' ? 'Très beau travail !' : 'Partie terminée !';
            qi = queue.length;
            updateStats(false);
            winCard.innerHTML = `
                <div class="jph-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${roundStars} ⭐ sur ${max} · ${score} points</p>
                <button class="jph-btn jph-btn-go" data-act="again">🔄 Nouvelle partie</button>`;
            winLayer.classList.add('show');
            sfx('win'); party();
            say('🏁 Partie terminée ! Rejoue ou essaie un autre niveau.', 'good');
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

        // ── Aides ──────────────────────────────────────────────────────────
        function giveHint() {
            if (done) return;
            clearMarks();
            const ans = answers[0];
            // Premier emplacement faux : on y met le bon mot
            const cur = currentTexts();
            let i = 0;
            while (i < ans.length && cur[i] === ans[i]) i++;
            if (i >= ans.length) { say('💡 Ta phrase est déjà dans le bon ordre : clique sur ✔ Vérifier !'); return; }
            // Trouver une étiquette portant ce texte (dans la réserve de préférence)
            const all = pool.concat(line.slice(i));
            const id = all.find(x => tok(x).text === ans[i] && !tok(x).locked);
            if (!id) return;
            hints++;
            // On retire de la phrase les mots mal placés à partir de i (sauf bloqués), puis on place le bon mot
            line.slice(i).forEach(x => { if (!tok(x).locked) putInPool(x); });
            putInLine(id, i);
            sfx('hint');
            render(id);
            const el = lineEl.querySelector(`[data-id="${id}"]`);
            if (el) el.classList.add('hinted');
            say(`💡 Le mot n°${i + 1} est « <b>${esc(ans[i])}</b> ».`);
        }
        btn('check').addEventListener('click', check);
        btn('hint').addEventListener('click', giveHint);
        btn('listen').addEventListener('click', () => {
            if (done) return;
            hints++;
            speak(joinTokens(answers[0]));
            say('🔊 Écoute bien la phrase, puis range les mots dans le même ordre.');
        });
        btn('clear').addEventListener('click', () => {
            if (done) return;
            line.forEach(id => { if (!tok(id).locked) putInPool(id); });
            clearMarks(); render();
        });
        btn('skip').addEventListener('click', () => {
            if (done) return;
            results[qi] = 'meh'; streak = 0;
            say(`⏭ La phrase était : « <b>${esc(joinTokens(answers[0]))}</b> »`);
            if (qi >= queue.length - 1) finalScreen(); else { qi++; loadSentence(); }
        });

        // ── Réglages ───────────────────────────────────────────────────────
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            streak = 0;
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        clueSel.addEventListener('change', () => { clues = clueSel.value === 'on'; streak = 0; newRound(); });
        clueSel.addEventListener('pointerdown', (e) => e.stopPropagation());
        clueSel.addEventListener('mousedown', (e) => e.stopPropagation());

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT') return;
            if (e.key === 'Enter') {
                e.preventDefault();
                if (winLayer.classList.contains('show')) { const b = winCard.querySelector('.jph-btn-go'); if (b) b.click(); }
                else check();
            } else if (e.key === 'Backspace' && !done) {
                e.preventDefault();
                const [lo, hi] = lockBounds();
                if (hi > lo) { putInPool(line[hi - 1]); sfx('back'); render(); }
            }
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
            window._wfMiniBarCollapse(widget, '🦉 Phrase en désordre', { onExpand: applyScale });
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
            if (canSpeak) window.speechSynthesis.cancel();
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
        container.querySelectorAll('.jph-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, .jph-stage, .jph-rh, .jph-help')) {
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
            if (type === 'jeu-phrase-desordre') return window.createJeuPhraseDesordreWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-phrase-desordre') return window.createJeuPhraseDesordreWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
