// =========================================================================
// JEU « LA CAISSE DU MARCHAND » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — mode jeu élèves
//
// Un client (animal) achète au marché et paie avec un billet. L'élève doit
// lui rendre la monnaie en prenant les pièces et billets dans le tiroir-caisse.
// 5 clients par tournée.
// 3 niveaux : facile   (prix ronds, pièces 1 € / 2 €, billets 5 € / 10 €)
//             moyen    (prix avec dizaines de centimes, pièces dès 10 c)
//             difficile(2 articles à additionner, tous les centimes,
//                       total caché, paiement parfois avec appoint)
//
// Pièces et billets : mêmes images que le widget « Monnaie »
//   (images/monnaie-piece-XXX.png, images/monnaie-billet-XX.jpg)
//   avec un dessin de secours si une image est absente.
//
// Ouverture : createWidget('jeu-caisse-marchand')
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

    // ── CSS du jeu (préfixe jcm-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-caisse-marchand-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-caisse-marchand-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-caisse-marchand"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jcm-container {
            --jcm-s: 1;
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
            padding: calc(12px * var(--jcm-s)) calc(14px * var(--jcm-s)) calc(14px * var(--jcm-s));
            border-radius: calc(24px * var(--jcm-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jcm-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .jcm-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jcm-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jcm-s));
            width: 100%; max-width: calc(672px * var(--jcm-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jcm-header { display: flex; align-items: center; gap: calc(10px * var(--jcm-s)); cursor: move; flex-wrap: wrap; }
        .jcm-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jcm-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jcm-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jcm-stats { display: flex; gap: calc(6px * var(--jcm-s)); align-items: center; margin-left: auto; }
        .jcm-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jcm-s)) calc(10px * var(--jcm-s));
            font-weight: 900; font-size: calc(14px * var(--jcm-s));
            white-space: nowrap;
        }
        .jcm-chip.hot { background: #FF7A1A; }
        @keyframes jcm-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jcm-chip.bump { animation: jcm-bump .4s ease; }
        .jcm-icon-btn {
            width: calc(26px * var(--jcm-s)); height: calc(26px * var(--jcm-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jcm-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jcm-icon-btn:hover { background: rgba(255,255,255,0.25); }
        .jcm-icon-btn.off { opacity: 0.45; }

        /* ── Niveaux + progression ── */
        .jcm-bar { display: flex; align-items: center; gap: calc(6px * var(--jcm-s)); flex-wrap: wrap; }
        .jcm-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jcm-s));
            padding: calc(5px * var(--jcm-s)) calc(12px * var(--jcm-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jcm-lvl:hover { background: rgba(255,255,255,0.1); }
        .jcm-lvl:active { transform: scale(0.95); }
        .jcm-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jcm-progress { margin-left: auto; display: flex; gap: calc(4px * var(--jcm-s)); align-items: center; }
        .jcm-progress-label { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(12px * var(--jcm-s)); margin-right: 2px; }
        .jcm-pdot {
            width: calc(18px * var(--jcm-s)); height: calc(18px * var(--jcm-s));
            border-radius: 50%;
            background: rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center;
            font-size: calc(10px * var(--jcm-s)); color: #fff; font-weight: 900;
        }
        .jcm-pdot.done { background: var(--vert); }
        .jcm-pdot.done::after { content: '✓'; }
        .jcm-pdot.current { background: rgba(255,201,51,0.5); box-shadow: 0 0 0 2px var(--or); }

        /* ── Scène du marché ── */
        .jcm-scene {
            position: relative;
            height: calc(250px * var(--jcm-s));
            border-radius: calc(18px * var(--jcm-s));
            overflow: hidden;
            flex-shrink: 0;
            background:
                repeating-linear-gradient(90deg, rgba(0,0,0,0.035) 0 calc(2px * var(--jcm-s)), transparent calc(2px * var(--jcm-s)) calc(46px * var(--jcm-s))),
                linear-gradient(180deg, #FFE9C2 0%, #FFD99A 100%);
        }
        .jcm-awning {
            position: absolute; left: 0; right: 0; top: 0; height: calc(38px * var(--jcm-s));
            background: repeating-linear-gradient(90deg, #FF4F5E 0 calc(36px * var(--jcm-s)), #fff calc(36px * var(--jcm-s)) calc(72px * var(--jcm-s)));
            z-index: 2;
        }
        .jcm-awning::after {
            content: ''; position: absolute; left: 0; right: 0; top: 100%; height: calc(14px * var(--jcm-s));
            background:
                radial-gradient(ellipse calc(18px * var(--jcm-s)) calc(14px * var(--jcm-s)) at calc(18px * var(--jcm-s)) 0, #FF4F5E 97%, transparent 100%) 0 0 / calc(72px * var(--jcm-s)) 100% repeat-x,
                radial-gradient(ellipse calc(18px * var(--jcm-s)) calc(14px * var(--jcm-s)) at calc(54px * var(--jcm-s)) 0, #fff 97%, transparent 100%) 0 0 / calc(72px * var(--jcm-s)) 100% repeat-x;
            filter: drop-shadow(0 calc(3px * var(--jcm-s)) 0 rgba(0,0,0,0.08));
        }
        .jcm-sign {
            position: absolute; left: 50%; top: calc(6px * var(--jcm-s)); transform: translateX(-50%);
            background: #fff; color: var(--encre); z-index: 3;
            font-family: 'Lilita One', sans-serif; font-size: calc(15px * var(--jcm-s));
            padding: calc(2px * var(--jcm-s)) calc(12px * var(--jcm-s));
            border-radius: calc(6px * var(--jcm-s)); border: calc(3px * var(--jcm-s)) solid var(--vert);
            box-shadow: 0 calc(3px * var(--jcm-s)) 0 rgba(0,0,0,0.15);
            white-space: nowrap;
        }

        /* Client */
        .jcm-client {
            position: absolute; left: calc(22px * var(--jcm-s)); bottom: calc(76px * var(--jcm-s));
            width: calc(112px * var(--jcm-s));
            display: flex; flex-direction: column; align-items: center;
            z-index: 1;
        }
        .jcm-face { position: relative; font-size: calc(64px * var(--jcm-s)); line-height: 1; }
        .jcm-mood {
            position: absolute; right: calc(-12px * var(--jcm-s)); top: calc(-4px * var(--jcm-s));
            font-size: calc(26px * var(--jcm-s));
            background: #fff; border-radius: 50%;
            width: calc(34px * var(--jcm-s)); height: calc(34px * var(--jcm-s));
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 calc(2px * var(--jcm-s)) 0 rgba(0,0,0,0.15);
        }
        @keyframes jcm-moodpop { 0% { transform: scale(0.3); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .jcm-mood.pop { animation: jcm-moodpop .35s ease-out; }
        .jcm-name {
            margin-top: calc(2px * var(--jcm-s));
            background: var(--encre); color: #fff;
            font-weight: 900; font-size: calc(11px * var(--jcm-s));
            padding: calc(1px * var(--jcm-s)) calc(8px * var(--jcm-s));
            border-radius: 999px; white-space: nowrap;
        }
        .jcm-patience {
            margin-top: calc(4px * var(--jcm-s));
            width: 90%; height: calc(7px * var(--jcm-s));
            background: rgba(0,0,0,0.15); border-radius: 999px; overflow: hidden;
        }
        .jcm-patience i { display: block; height: 100%; width: 100%; background: var(--vert); border-radius: 999px; transition: width .25s linear, background .3s; }
        .jcm-patience.mid i { background: #FFB020; }
        .jcm-patience.low i { background: var(--rouge); }
        .jcm-container.no-timer .jcm-patience { visibility: hidden; }
        @keyframes jcm-arrive { 0% { transform: translateX(-160%); } 75% { transform: translateX(6%); } 100% { transform: translateX(0); } }
        @keyframes jcm-leave  { 0% { transform: translateX(0); } 20% { transform: translateY(calc(-10px * var(--jcm-s))); } 100% { transform: translateX(-180%); opacity: 0; } }
        @keyframes jcm-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(calc(-5px * var(--jcm-s))); } }
        .jcm-client.arrive { animation: jcm-arrive .9s cubic-bezier(.2,.7,.3,1) both; }
        .jcm-client.leave  { animation: jcm-leave 1s ease-in forwards; }
        .jcm-client.arrive .jcm-face, .jcm-client.leave .jcm-face { animation: jcm-bob .25s ease-in-out infinite; }
        .jcm-client.gone { visibility: hidden; }

        /* Bulle */
        .jcm-bubble {
            position: absolute; left: calc(146px * var(--jcm-s)); top: calc(58px * var(--jcm-s));
            right: calc(214px * var(--jcm-s));
            background: #fff; color: var(--encre);
            border-radius: calc(14px * var(--jcm-s));
            padding: calc(7px * var(--jcm-s)) calc(11px * var(--jcm-s));
            font-weight: 800; font-size: calc(14px * var(--jcm-s)); line-height: 1.3;
            box-shadow: 0 calc(3px * var(--jcm-s)) 0 rgba(0,0,0,0.12);
            z-index: 1;
        }
        .jcm-bubble::before {
            content: ''; position: absolute; left: calc(-12px * var(--jcm-s)); bottom: calc(14px * var(--jcm-s));
            border-style: solid; border-color: transparent #fff transparent transparent;
            border-width: calc(8px * var(--jcm-s)) calc(13px * var(--jcm-s)) calc(8px * var(--jcm-s)) 0;
        }
        .jcm-bubble b { font-weight: 900; color: #B3470F; }
        @keyframes jcm-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); } }
        .jcm-bubble.pop { animation: jcm-pop .3s ease-out; }
        .jcm-bubble.hidden { visibility: hidden; }

        /* Caisse enregistreuse */
        .jcm-register {
            position: absolute; right: calc(16px * var(--jcm-s)); bottom: calc(64px * var(--jcm-s));
            width: calc(186px * var(--jcm-s));
            display: flex; flex-direction: column; align-items: stretch;
            z-index: 1;
        }
        .jcm-reg-screen {
            background: #1E2A3A; color: #7CFFB2;
            border: calc(4px * var(--jcm-s)) solid #5A6B85;
            border-radius: calc(10px * var(--jcm-s)) calc(10px * var(--jcm-s)) calc(4px * var(--jcm-s)) calc(4px * var(--jcm-s));
            padding: calc(5px * var(--jcm-s)) calc(8px * var(--jcm-s));
            font-family: 'Courier New', Consolas, monospace; font-weight: 700;
            font-size: calc(13px * var(--jcm-s)); line-height: 1.35;
            text-shadow: 0 0 calc(6px * var(--jcm-s)) rgba(124,255,178,0.6);
        }
        .jcm-reg-line { display: flex; justify-content: space-between; gap: 6px; white-space: nowrap; }
        .jcm-reg-line span:first-child { opacity: 0.75; }
        .jcm-reg-line.big { font-size: 1.1em; color: #FFE27A; text-shadow: 0 0 calc(6px * var(--jcm-s)) rgba(255,226,122,0.6); }
        @keyframes jcm-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        .jcm-reg-line .q { animation: jcm-blink 1.2s steps(2) infinite; }
        .jcm-reg-body {
            height: calc(34px * var(--jcm-s));
            margin: 0 calc(-8px * var(--jcm-s));
            background: #2F6FEB;
            border-radius: calc(6px * var(--jcm-s)) calc(6px * var(--jcm-s)) 0 0;
            box-shadow: inset 0 calc(-6px * var(--jcm-s)) 0 rgba(0,0,0,0.18);
            display: grid; grid-template-columns: repeat(6, 1fr); gap: calc(3px * var(--jcm-s));
            padding: calc(5px * var(--jcm-s)) calc(12px * var(--jcm-s)) calc(9px * var(--jcm-s));
            box-sizing: border-box;
        }
        .jcm-reg-body i { background: #CFE0FF; border-radius: calc(3px * var(--jcm-s)); box-shadow: 0 calc(2px * var(--jcm-s)) 0 #1B4DB5; }
        .jcm-reg-body i:nth-child(6n) { background: var(--or); }

        /* Comptoir */
        .jcm-counter {
            position: absolute; left: 0; right: 0; bottom: 0; height: calc(70px * var(--jcm-s));
            background:
                linear-gradient(180deg, var(--bois) 0 calc(10px * var(--jcm-s)), var(--bois-fonce) calc(10px * var(--jcm-s)) calc(13px * var(--jcm-s)), transparent calc(13px * var(--jcm-s))),
                repeating-linear-gradient(90deg, #C98A4B 0 calc(58px * var(--jcm-s)), #B97A35 calc(58px * var(--jcm-s)) calc(61px * var(--jcm-s)));
            display: flex; align-items: center;
            gap: calc(12px * var(--jcm-s));
            padding: calc(13px * var(--jcm-s)) calc(14px * var(--jcm-s)) 0;
            box-sizing: border-box;
            z-index: 2;
        }
        .jcm-goods { display: flex; gap: calc(8px * var(--jcm-s)); align-items: center; }
        .jcm-good {
            display: flex; align-items: center; gap: calc(4px * var(--jcm-s));
            background: var(--creme); border-radius: calc(10px * var(--jcm-s));
            padding: calc(3px * var(--jcm-s)) calc(8px * var(--jcm-s)) calc(3px * var(--jcm-s)) calc(4px * var(--jcm-s));
            box-shadow: 0 calc(3px * var(--jcm-s)) 0 rgba(0,0,0,0.2);
        }
        .jcm-good-ico { font-size: calc(30px * var(--jcm-s)); line-height: 1; }
        .jcm-tag {
            background: var(--or); color: var(--encre);
            font-weight: 900; font-size: calc(14px * var(--jcm-s));
            padding: calc(1px * var(--jcm-s)) calc(7px * var(--jcm-s));
            border-radius: calc(5px * var(--jcm-s));
            white-space: nowrap;
            position: relative;
        }
        .jcm-paid {
            margin-left: auto;
            display: flex; align-items: center; gap: calc(5px * var(--jcm-s));
            background: rgba(255,255,255,0.28);
            border: calc(2px * var(--jcm-s)) dashed rgba(255,255,255,0.7);
            border-radius: calc(10px * var(--jcm-s));
            padding: calc(3px * var(--jcm-s)) calc(8px * var(--jcm-s));
            --k: 0.62;
        }
        .jcm-paid-lbl { font-weight: 900; font-size: calc(12px * var(--jcm-s)); color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,0.3); white-space: nowrap; }
        .jcm-paid-money { display: flex; align-items: center; gap: calc(4px * var(--jcm-s)); flex-wrap: wrap; }

        /* ── Pièces et billets ── */
        .jcm-money { position: relative; flex-shrink: 0; box-sizing: border-box; }
        .jcm-money img { display: block; width: 100%; height: 100%; pointer-events: none; -webkit-user-drag: none; }
        .jcm-coin {
            width:  calc(var(--d) * var(--jcm-s) * var(--k, 1));
            height: calc(var(--d) * var(--jcm-s) * var(--k, 1));
            border-radius: 50%;
            filter: drop-shadow(0 calc(2px * var(--jcm-s)) 0 rgba(0,0,0,0.3));
        }
        .jcm-coin img { object-fit: contain; }
        .jcm-bill {
            width:  calc(96px * var(--jcm-s) * var(--k, 1));
            height: calc(48px * var(--jcm-s) * var(--k, 1));
            border-radius: calc(4px * var(--jcm-s));
            overflow: hidden;
            box-shadow: 0 calc(2px * var(--jcm-s)) 0 rgba(0,0,0,0.3);
        }
        .jcm-bill img { object-fit: cover; }
        /* Dessin de secours si l'image manque */
        .jcm-money.fb {
            background: var(--fb);
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; color: #3A2A10;
        }
        .jcm-coin.fb {
            border: calc(2px * var(--jcm-s)) solid rgba(0,0,0,0.25);
            font-size: calc(var(--d) * var(--jcm-s) * var(--k, 1) * 0.28);
        }
        .jcm-bill.fb {
            color: #fff; text-shadow: 0 1px 0 rgba(0,0,0,0.35);
            font-size: calc(17px * var(--jcm-s) * var(--k, 1));
            border: calc(3px * var(--jcm-s)) solid rgba(255,255,255,0.55);
        }
        .jcm-money.fb span { white-space: nowrap; line-height: 1; }

        /* ── Plateau de rendu ── */
        .jcm-tray {
            position: relative;
            display: flex; align-items: stretch; gap: calc(10px * var(--jcm-s));
            background: #3B2F63;
            border-radius: calc(16px * var(--jcm-s));
            padding: calc(8px * var(--jcm-s)) calc(10px * var(--jcm-s));
            box-shadow: inset 0 calc(-7px * var(--jcm-s)) 0 rgba(0,0,0,0.2);
            transition: background .15s;
        }
        .jcm-tray.over { background: #4A3C7A; }
        .jcm-tray-side {
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            gap: calc(4px * var(--jcm-s)); flex-shrink: 0;
            width: calc(110px * var(--jcm-s));
            color: #fff; text-align: center;
        }
        .jcm-tray-title { font-weight: 900; font-size: calc(13px * var(--jcm-s)); line-height: 1.15; }
        .jcm-tray-sum {
            background: var(--creme); color: var(--encre);
            font-weight: 900; font-size: calc(16px * var(--jcm-s));
            border-radius: 999px; padding: calc(2px * var(--jcm-s)) calc(10px * var(--jcm-s));
            white-space: nowrap;
        }
        .jcm-tray-items {
            flex: 1; min-width: 0;
            min-height: calc(62px * var(--jcm-s));
            border-radius: 999px / 60%;
            background: radial-gradient(ellipse at center, #F3F0FA 0%, #D9D2EE 70%, #BFB4DE 100%);
            box-shadow: inset 0 calc(3px * var(--jcm-s)) calc(8px * var(--jcm-s)) rgba(0,0,0,0.25);
            display: flex; flex-wrap: wrap; align-items: center; justify-content: center; align-content: center;
            gap: calc(5px * var(--jcm-s));
            padding: calc(6px * var(--jcm-s)) calc(18px * var(--jcm-s));
            --k: 0.78;
        }
        .jcm-tray-empty { color: #6A5E8E; font-weight: 800; font-size: calc(13px * var(--jcm-s)); text-align: center; }
        .jcm-tray-items .jcm-money { cursor: pointer; transition: transform .1s; }
        .jcm-tray-items .jcm-money:hover { transform: translateY(calc(-3px * var(--jcm-s))) rotate(-4deg); }
        .jcm-tray-items .jcm-money.hinted { outline: calc(3px * var(--jcm-s)) solid var(--or); outline-offset: 1px; }
        @keyframes jcm-land { 0% { transform: translateY(calc(-18px * var(--jcm-s))) scale(1.15); } 60% { transform: translateY(2px) scale(0.95); } 100% { transform: none; } }
        .jcm-money.land { animation: jcm-land .25s ease-out; }
        @keyframes jcm-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-1deg); }
            40% { transform: translateX(6px) rotate(1deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .jcm-tray.ko .jcm-tray-items { animation: jcm-shake .45s ease; box-shadow: inset 0 0 0 calc(3px * var(--jcm-s)) var(--rouge); }
        .jcm-tray.ok .jcm-tray-items { box-shadow: inset 0 0 0 calc(3px * var(--jcm-s)) var(--vert); }
        @keyframes jcm-fly { to { transform: translate(calc(-120px * var(--jcm-s)), calc(-160px * var(--jcm-s))) scale(0.4); opacity: 0; } }
        .jcm-tray-items.fly .jcm-money { animation: jcm-fly .8s ease-in forwards; }

        /* ── Tiroir-caisse ── */
        .jcm-drawer {
            background: #2E3A4F;
            border-radius: calc(16px * var(--jcm-s));
            padding: calc(8px * var(--jcm-s)) calc(10px * var(--jcm-s)) calc(12px * var(--jcm-s));
            box-shadow: inset 0 calc(-7px * var(--jcm-s)) 0 rgba(0,0,0,0.25), 0 calc(4px * var(--jcm-s)) 0 #1A2231;
            display: flex; flex-direction: column; gap: calc(7px * var(--jcm-s));
        }
        .jcm-drawer-head {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            color: rgba(255,255,255,0.7); font-weight: 900; font-size: calc(12px * var(--jcm-s));
            letter-spacing: 1px; text-transform: uppercase;
        }
        .jcm-drawer-head::before, .jcm-drawer-head::after { content: ''; flex: 1; height: 2px; background: rgba(255,255,255,0.12); border-radius: 2px; }
        .jcm-drawer-row { display: flex; justify-content: center; align-items: flex-end; gap: calc(7px * var(--jcm-s)); flex-wrap: wrap; }
        .jcm-slot {
            display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
            gap: calc(3px * var(--jcm-s));
            background: #1E2736;
            border-radius: calc(10px * var(--jcm-s));
            padding: calc(6px * var(--jcm-s)) calc(7px * var(--jcm-s)) calc(4px * var(--jcm-s));
            box-shadow: inset 0 calc(3px * var(--jcm-s)) calc(5px * var(--jcm-s)) rgba(0,0,0,0.45);
            cursor: pointer; touch-action: none;
            transition: transform .1s, background .15s;
            --k: 0.95;
        }
        .jcm-slot:hover { background: #28344A; transform: translateY(calc(-3px * var(--jcm-s))); }
        .jcm-slot:active { transform: scale(0.95); }
        .jcm-slot-lbl { color: #fff; font-weight: 900; font-size: calc(11px * var(--jcm-s)); white-space: nowrap; }
        .jcm-slot.dragging .jcm-money { opacity: 0.35; }
        .jcm-ghost {
            position: fixed; z-index: 99999; pointer-events: none;
            transform: translate(-50%, -50%) rotate(-6deg) scale(1.1);
            filter: drop-shadow(0 12px 14px rgba(0,0,0,0.35));
        }

        /* ── Actions ── */
        .jcm-actions { display: flex; gap: calc(8px * var(--jcm-s)); justify-content: center; flex-wrap: wrap; }
        .jcm-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jcm-s));
            padding: calc(8px * var(--jcm-s)) calc(14px * var(--jcm-s));
            border-radius: calc(14px * var(--jcm-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jcm-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s;
            white-space: nowrap;
        }
        .jcm-btn:hover { filter: brightness(1.05); }
        .jcm-btn:active { transform: translateY(calc(4px * var(--jcm-s))); box-shadow: 0 calc(1px * var(--jcm-s)) 0 #B9B2D6; }
        .jcm-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jcm-s));
            padding: calc(8px * var(--jcm-s)) calc(22px * var(--jcm-s));
            box-shadow: 0 calc(5px * var(--jcm-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jcm-btn-go:active { box-shadow: 0 calc(1px * var(--jcm-s)) 0 #1C8A4F; }
        .jcm-btn:focus-visible, .jcm-lvl:focus-visible, .jcm-slot:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Marchand (messages) ── */
        .jcm-talk { display: flex; align-items: center; gap: calc(10px * var(--jcm-s)); }
        .jcm-chef {
            width: calc(44px * var(--jcm-s)); height: calc(44px * var(--jcm-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jcm-s));
            box-shadow: 0 calc(3px * var(--jcm-s)) 0 #B3840B;
        }
        @keyframes jcm-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jcm-s))) rotate(-8deg); } }
        .jcm-chef.hop { animation: jcm-hop .4s ease; }
        .jcm-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jcm-s));
            padding: calc(8px * var(--jcm-s)) calc(12px * var(--jcm-s));
            font-weight: 700; font-size: calc(15px * var(--jcm-s)); line-height: 1.35;
            min-height: calc(22px * var(--jcm-s));
            border-left: calc(6px * var(--jcm-s)) solid var(--or);
        }
        .jcm-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jcm-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jcm-msg b { font-weight: 900; }
        .jcm-msg .k { display: inline-block; background: var(--or); border-radius: 4px; padding: 0 4px; font-weight: 900; white-space: nowrap; }

        /* ── Écrans de victoire ── */
        .jcm-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.35);
        }
        .jcm-overlay.show { display: flex; }
        .jcm-card {
            background: #fff; border-radius: calc(18px * var(--jcm-s));
            padding: calc(12px * var(--jcm-s)) calc(22px * var(--jcm-s)) calc(14px * var(--jcm-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jcm-s)) 0 #B9B2D6;
            animation: jcm-pop .35s ease-out;
            max-width: 90%;
        }
        .jcm-card h3 {
            margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(24px * var(--jcm-s)); color: var(--encre);
        }
        .jcm-card p { margin: calc(4px * var(--jcm-s)) 0 calc(8px * var(--jcm-s)); font-weight: 800; font-size: calc(14px * var(--jcm-s)); }
        .jcm-card .jcm-bonus { font-size: calc(12px * var(--jcm-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jcm-s)); }
        .jcm-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jcm-s)); margin: calc(4px * var(--jcm-s)) 0; }
        .jcm-bigstars span { font-size: calc(34px * var(--jcm-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jcm-bigstars span.on { opacity: 1; filter: none; animation: jcm-pop .35s ease-out both; }
        .jcm-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jcm-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jcm-medal { font-size: calc(56px * var(--jcm-s)); line-height: 1; animation: jcm-pop .5s ease-out; }

        /* ── Aide ── */
        .jcm-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 330px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jcm-help.show { display: block; }
        .jcm-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jcm-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jcm-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jcm-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jcm-fall 1.8s ease-in forwards; }
        .jcm-confetti i.coin { width: 14px; height: 14px; border-radius: 50%; }
        @keyframes jcm-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jcm-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jcm-container:hover .jcm-rh { opacity: 1; }
        .jcm-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jcm-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jcm-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jcm-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jcm-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jcm-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jcm-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jcm-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jcm-container *, .jcm-container *::before, .jcm-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // DONNÉES
    // =========================================================================

    // Pièces et billets (valeurs en centimes) — mêmes images que widget-monnaie
    const JCM_MONEY = {
        1:    { type: 'coin', d: 40, label: '1 c',  src: 'images/monnaie-piece-001.png', fb: '#C77A3A' },
        2:    { type: 'coin', d: 42, label: '2 c',  src: 'images/monnaie-piece-002.png', fb: '#C77A3A' },
        5:    { type: 'coin', d: 45, label: '5 c',  src: 'images/monnaie-piece-005.png', fb: '#C77A3A' },
        10:   { type: 'coin', d: 46, label: '10 c', src: 'images/monnaie-piece-010.png', fb: '#E3B341' },
        20:   { type: 'coin', d: 49, label: '20 c', src: 'images/monnaie-piece-020.png', fb: '#E3B341' },
        50:   { type: 'coin', d: 52, label: '50 c', src: 'images/monnaie-piece-050.png', fb: '#E3B341' },
        100:  { type: 'coin', d: 54, label: '1 €',  src: 'images/monnaie-piece-1.png',   fb: 'radial-gradient(circle, #E3B341 0 54%, #C9CED6 57%)' },
        200:  { type: 'coin', d: 58, label: '2 €',  src: 'images/monnaie-piece-2.png',   fb: 'radial-gradient(circle, #C9CED6 0 54%, #E3B341 57%)' },
        500:  { type: 'bill', label: '5 €',   src: 'images/monnaie-billet-5.jpg',   fb: '#8E9AA8' },
        1000: { type: 'bill', label: '10 €',  src: 'images/monnaie-billet-10.jpg',  fb: '#D9654A' },
        2000: { type: 'bill', label: '20 €',  src: 'images/monnaie-billet-20.jpg',  fb: '#4F80CC' },
        5000: { type: 'bill', label: '50 €',  src: 'images/monnaie-billet-50.jpg',  fb: '#E8943A' },
    };

    const JCM_LEVELS = {
        1: { label: '😊 Facile',    drawer: [1000, 500, 200, 100], patience: 60 },
        2: { label: '😐 Moyen',     drawer: [1000, 500, 200, 100, 50, 20, 10], patience: 75 },
        3: { label: '😤 Difficile', drawer: [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1], patience: 100 },
    };

    const JCM_CLIENTS = [
        { e: '🐰', n: 'Madame Lapin' },    { e: '🦊', n: 'Monsieur Renard' },
        { e: '🐻', n: 'Monsieur Ours' },   { e: '🐼', n: 'Madame Panda' },
        { e: '🐸', n: 'Monsieur Grenouille' }, { e: '🐷', n: 'Madame Cochon' },
        { e: '🐨', n: 'Madame Koala' },    { e: '🐯', n: 'Monsieur Tigre' },
        { e: '🦁', n: 'Monsieur Lion' },   { e: '🐵', n: 'Madame Singe' },
        { e: '🐮', n: 'Madame Vache' },    { e: '🐭', n: 'Monsieur Souris' },
    ];

    const JCM_GOODS = [
        ['🍎', 'un sac de pommes'], ['🍌', 'des bananes'], ['🥕', 'des carottes'], ['🍓', 'des fraises'],
        ['🥖', 'une baguette'], ['🧀', 'un fromage'], ['🍉', 'une pastèque'], ['🥦', 'un brocoli'],
        ['🍇', 'du raisin'], ['🍍', 'un ananas'], ['🥚', 'des œufs'], ['🍯', 'un pot de miel'],
        ['🍋', 'des citrons'], ['🥐', 'des croissants'], ['🍅', 'des tomates'], ['🌽', 'du maïs'],
        ['🥥', 'une noix de coco'], ['🍐', 'des poires'], ['🧃', 'un jus de fruits'], ['💐', 'un bouquet de fleurs'],
        ['🍒', 'des cerises'], ['🥔', 'des pommes de terre'], ['🍄', 'des champignons'], ['🥜', 'des cacahuètes'],
    ];

    const CLIENTS_PER_ROUND = 5;
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7AC6', '#fff'];

    // ── Utilitaires ────────────────────────────────────────────────────────
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    }
    // 650 → « 6,50 € »
    function fmtE(c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; }
    // 50 → « 50 c », 300 → « 3 € », 350 → « 3,50 € »
    function fmtS(c) { return c < 100 ? c + ' c' : (c % 100 ? fmtE(c) : (c / 100) + ' €'); }
    // Décomposition gloutonne (optimale pour les euros)
    function greedy(amount, denoms) {
        const out = [];
        const d = denoms.slice().sort((a, b) => b - a);
        for (const v of d) { while (amount >= v) { out.push(v); amount -= v; } }
        return amount === 0 ? out : null;
    }
    // Méthode du marchand : compter en avançant du prix jusqu'à la somme reçue
    function countUp(price, paid) {
        const off = (price % 100 === paid % 100) ? price % 100 : 0;
        let cur = price - off;
        const end = paid - off;
        const steps = [];
        for (const unit of [10, 100, 500, 1000]) {
            const nxt = Math.ceil(cur / unit) * unit;
            if (nxt > cur && nxt <= end) { steps.push({ add: nxt - cur, to: nxt + off }); cur = nxt; }
        }
        while (cur < end) {
            const add = end - cur >= 1000 ? Math.floor((end - cur) / 1000) * 1000 : end - cur;
            cur += add; steps.push({ add, to: cur + off });
        }
        return steps;
    }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _jcmAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jcmAudio) _jcmAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jcmAudio, t0 = ctx.currentTime + start;
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
        coin:   () => { tone(1980, 0, 0.09, 'triangle', 0.07); tone(2640, 0.04, 0.12, 'triangle', 0.05); },
        bill:   () => { tone(320, 0, 0.06, 'sawtooth', 0.03); tone(260, 0.05, 0.06, 'sawtooth', 0.025); },
        pick:   () => tone(660, 0, 0.08, 'triangle', 0.08),
        error:  () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        kaching:() => { tone(1568, 0, 0.12, 'triangle', 0.1); tone(2093, 0.1, 0.35, 'triangle', 0.1); tone(2637, 0.1, 0.35, 'sine', 0.05); },
        arrive: () => { tone(988, 0, 0.12, 'sine', 0.08); tone(784, 0.14, 0.18, 'sine', 0.08); },
        win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:   () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuCaisseMarchandWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-caisse-marchand';
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
        container.className = 'jcm-container';
        container.innerHTML = `
          <div class="jcm-inner">
            <div class="jcm-header">
                <span class="jcm-title">La caisse du marchand</span>
                <div class="jcm-stats">
                    <span class="jcm-chip" data-role="streak" title="Clients servis du premier coup d'affilée">🔥 0</span>
                    <span class="jcm-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jcm-icon-btn" data-role="timer" title="Désactiver la patience des clients">⏱</button>
                    <button class="jcm-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jcm-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jcm-bar">
                <button class="jcm-lvl active" data-level="1">😊 Facile</button>
                <button class="jcm-lvl" data-level="2">😐 Moyen</button>
                <button class="jcm-lvl" data-level="3">😤 Difficile</button>
                <div class="jcm-progress" title="Clients de la tournée">
                    <span class="jcm-progress-label">Client</span>
                    ${'<span class="jcm-pdot"></span>'.repeat(CLIENTS_PER_ROUND)}
                </div>
            </div>

            <div class="jcm-scene">
                <div class="jcm-awning"></div>
                <div class="jcm-sign">🍎 Au petit marché 🥕</div>
                <div class="jcm-client gone">
                    <div class="jcm-face"><span data-role="face"></span><span class="jcm-mood">🙂</span></div>
                    <div class="jcm-name"></div>
                    <div class="jcm-patience" title="Patience du client"><i></i></div>
                </div>
                <div class="jcm-bubble hidden"></div>
                <div class="jcm-register">
                    <div class="jcm-reg-screen"></div>
                    <div class="jcm-reg-body">${'<i></i>'.repeat(6)}</div>
                </div>
                <div class="jcm-counter">
                    <div class="jcm-goods"></div>
                    <div class="jcm-paid">
                        <span class="jcm-paid-lbl">Reçu :</span>
                        <div class="jcm-paid-money"></div>
                    </div>
                </div>
                <div class="jcm-overlay" data-role="win"><div class="jcm-card"></div></div>
            </div>

            <div class="jcm-tray" title="Le plateau : la monnaie que tu vas rendre au client">
                <div class="jcm-tray-side">
                    <span class="jcm-tray-title">🪙 Monnaie<br>à rendre</span>
                    <span class="jcm-tray-sum">0,00 €</span>
                </div>
                <div class="jcm-tray-items"></div>
            </div>

            <div class="jcm-drawer">
                <div class="jcm-drawer-head">Tiroir-caisse</div>
                <div class="jcm-drawer-row" data-row="bill"></div>
                <div class="jcm-drawer-row" data-row="coin"></div>
            </div>

            <div class="jcm-talk">
                <div class="jcm-chef">🧺</div>
                <div class="jcm-msg"></div>
            </div>

            <div class="jcm-actions">
                <button class="jcm-btn" data-act="hint">💡 Indice</button>
                <button class="jcm-btn" data-act="clear">🧹 Vider le plateau</button>
                <button class="jcm-btn jcm-btn-go" data-act="give">🤝 Rendre la monnaie !</button>
            </div>
          </div>

            <div class="jcm-help">
                <h4>🧺 Comment jouer ?</h4>
                <p>Tu es le marchand ! Le client achète quelque chose et te donne de l'argent. Tu dois lui <b>rendre la monnaie</b> : la différence entre ce qu'il te donne et le prix.</p>
                <p>👆 Clique sur une pièce ou un billet du <b>tiroir-caisse</b> pour le poser sur le plateau (ou fais-le glisser). Clique sur une pièce du plateau pour la reprendre.</p>
                <p>🧮 <b>Astuce du marchand</b> : pars du prix et compte en avançant jusqu'à la somme reçue.</p>
                <p>😊 <b>Facile</b> : prix ronds, pièces de 1 € et 2 €.<br>😐 <b>Moyen</b> : prix avec des centimes.<br>😤 <b>Difficile</b> : 2 articles à additionner, total caché, tous les centimes.</p>
                <p style="margin:0">⭐⭐⭐ si tu rends juste du premier coup sans indice. Bonus si tu rends avec le moins de pièces possible, ou avant que le client s'impatiente ⏱. 5 clients = une tournée !</p>
            </div>
            <div class="jcm-confetti"></div>
            <div class="jcm-rh jcm-rh-nw" data-dir="nw"></div>
            <div class="jcm-rh jcm-rh-n"  data-dir="n"></div>
            <div class="jcm-rh jcm-rh-ne" data-dir="ne"></div>
            <div class="jcm-rh jcm-rh-e"  data-dir="e"></div>
            <div class="jcm-rh jcm-rh-se" data-dir="se"></div>
            <div class="jcm-rh jcm-rh-s"  data-dir="s"></div>
            <div class="jcm-rh jcm-rh-sw" data-dir="sw"></div>
            <div class="jcm-rh jcm-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner     = $('.jcm-inner');
        const clientEl  = $('.jcm-client');
        const faceEl    = $('[data-role="face"]');
        const moodEl    = $('.jcm-mood');
        const nameEl    = $('.jcm-name');
        const patEl     = $('.jcm-patience');
        const patBar    = patEl.querySelector('i');
        const bubble    = $('.jcm-bubble');
        const screen    = $('.jcm-reg-screen');
        const goodsEl   = $('.jcm-goods');
        const paidEl    = $('.jcm-paid-money');
        const tray      = $('.jcm-tray');
        const trayItems = $('.jcm-tray-items');
        const traySum   = $('.jcm-tray-sum');
        const rowBill   = $('[data-row="bill"]');
        const rowCoin   = $('[data-row="coin"]');
        const msg       = $('.jcm-msg');
        const chef      = $('.jcm-chef');
        const winLayer  = $('[data-role="win"]');
        const winCard   = winLayer.querySelector('.jcm-card');
        const streakEl  = $('[data-role="streak"]');
        const scoreEl   = $('[data-role="score"]');
        const timerBtn  = $('[data-role="timer"]');
        const soundBtn  = $('[data-role="sound"]');
        const helpBtn   = $('[data-role="help"]');
        const helpBox   = $('.jcm-help');
        const confetti  = $('.jcm-confetti');
        const lvlBtns   = container.querySelectorAll('.jcm-lvl');
        const pdots     = container.querySelectorAll('.jcm-pdot');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let level = 1;
        let cur = null;              // client en cours : { client, goods, price, paidList, paid, change, round }
        let given = [];              // valeurs posées sur le plateau (triées décroissant)
        let hintedCount = 0;         // nb de pièces posées par l'indice (surlignées)
        let totalShown = true;       // total affiché sur la caisse (caché au niveau difficile)
        let errors = 0, hints = 0;
        let clientNo = 1;
        let roundStars = 0;
        let score = 0, streak = 0;
        let lastClient = null;
        let busy = false;
        let soundOn = true, timerOn = true;
        let patience = 0, patienceMax = 60, impatient = false;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Pièces / billets ───────────────────────────────────────────────
        function moneyEl(v) {
            const m = JCM_MONEY[v];
            const el = document.createElement('div');
            el.className = 'jcm-money jcm-' + m.type;
            el.dataset.v = v;
            if (m.d) el.style.setProperty('--d', m.d + 'px');
            const img = document.createElement('img');
            img.alt = m.label; img.draggable = false;
            img.onerror = () => {
                img.remove();
                el.classList.add('fb');
                el.style.setProperty('--fb', m.fb);
                el.innerHTML = `<span>${m.label}</span>`;
            };
            img.src = m.src;
            el.appendChild(img);
            return el;
        }

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        let curScale = 1;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                // En plein écran : ne pas dépasser la hauteur disponible
                container.style.setProperty('--jcm-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            curScale = sc;
            container.style.setProperty('--jcm-s', sc.toFixed(4));
        }

        // ── Messages ───────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jcm-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function setMood(e) {
            moodEl.textContent = e;
            moodEl.classList.remove('pop'); void moodEl.offsetWidth; moodEl.classList.add('pop');
        }
        function setBubble(html) {
            bubble.innerHTML = html;
            bubble.classList.remove('hidden', 'pop'); void bubble.offsetWidth; bubble.classList.add('pop');
        }
        function updateStats(bumpScore) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 3);
            scoreEl.textContent = '⭐ ' + score;
            if (bumpScore) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
            pdots.forEach((d, i) => {
                d.classList.toggle('done', i < clientNo - 1);
                d.classList.toggle('current', i === clientNo - 1);
            });
        }

        // ── Génération d'un client ─────────────────────────────────────────
        function pickBill(price, bills) {
            const ok = bills.filter(b => b > price);
            return ok[Math.random() < 0.75 ? 0 : Math.min(1, ok.length - 1)];
        }
        function genClient() {
            let client;
            do { client = rnd(JCM_CLIENTS); } while (client === lastClient);
            lastClient = client;
            const items = shuffle(JCM_GOODS);
            let goods, price, paidList, round = false;

            if (level === 1) {
                price = randInt(1, 18) * 100;
                goods = [{ g: items[0], p: price }];
                paidList = [pickBill(price, [500, 1000, 2000])];
            } else if (level === 2) {
                price = randInt(5, 199) * 10;
                if (price % 100 === 0 && Math.random() < 0.7) price = Math.min(1990, price + 50);
                goods = [{ g: items[0], p: price }];
                paidList = [pickBill(price, [500, 1000, 2000])];
            } else {
                const p1 = randInt(40, 1400), p2 = randInt(40, 1400);
                price = p1 + p2;
                goods = [{ g: items[0], p: p1 }, { g: items[1], p: p2 }];
                paidList = [pickBill(price, [1000, 2000, 5000])];
                // Parfois le client fait l'appoint pour recevoir un compte rond
                if (price % 100 !== 0 && Math.random() < 0.3) {
                    const extra = greedy(price % 100, [50, 20, 10, 5, 2, 1]);
                    paidList = paidList.concat(extra);
                    round = true;
                }
            }
            const paid = paidList.reduce((a, b) => a + b, 0);
            return { client, goods, price, paidList, paid, change: paid - price, round };
        }

        // ── Rendu de la scène ──────────────────────────────────────────────
        function renderRegister() {
            const q = '<span class="q">? ? ?</span>';
            let html = '';
            if (cur.goods.length > 1) {
                html += `<div class="jcm-reg-line"><span>TOTAL</span><span>${totalShown ? fmtE(cur.price) : q}</span></div>`;
            } else {
                html += `<div class="jcm-reg-line"><span>PRIX</span><span>${fmtE(cur.price)}</span></div>`;
            }
            html += `<div class="jcm-reg-line"><span>REÇU</span><span>${fmtE(cur.paid)}</span></div>`;
            html += `<div class="jcm-reg-line big"><span>À RENDRE</span><span>${busy && winLayer.classList.contains('show') ? fmtE(cur.change) : q}</span></div>`;
            screen.innerHTML = html;
        }
        function renderScene() {
            faceEl.textContent = cur.client.e;
            nameEl.textContent = cur.client.n;
            moodEl.textContent = '🙂';
            goodsEl.innerHTML = '';
            cur.goods.forEach(({ g, p }) => {
                const el = document.createElement('div');
                el.className = 'jcm-good';
                el.title = g[1];
                el.innerHTML = `<span class="jcm-good-ico">${g[0]}</span><span class="jcm-tag">${fmtE(p)}</span>`;
                goodsEl.appendChild(el);
            });
            paidEl.innerHTML = '';
            cur.paidList.forEach(v => paidEl.appendChild(moneyEl(v)));
            renderRegister();
        }
        function renderDrawer() {
            rowBill.innerHTML = ''; rowCoin.innerHTML = '';
            JCM_LEVELS[level].drawer.forEach(v => {
                const m = JCM_MONEY[v];
                const slot = document.createElement('div');
                slot.className = 'jcm-slot';
                slot.tabIndex = 0;
                slot.title = 'Rendre ' + m.label;
                slot.appendChild(moneyEl(v));
                const lbl = document.createElement('span');
                lbl.className = 'jcm-slot-lbl';
                lbl.textContent = m.label;
                slot.appendChild(lbl);
                slot.addEventListener('pointerdown', (e) => startPointer(e, slot, v));
                slot.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToTray(v); } });
                (m.type === 'bill' ? rowBill : rowCoin).appendChild(slot);
            });
        }
        function sumGiven() { return given.reduce((a, b) => a + b, 0); }
        function renderTray(landValue) {
            trayItems.innerHTML = '';
            tray.classList.remove('ok', 'ko');
            if (!given.length) {
                trayItems.innerHTML = '<span class="jcm-tray-empty">Clique sur les pièces et les billets du tiroir-caisse<br>pour rendre la monnaie au client</span>';
            } else {
                let landed = false;
                given.forEach((v, i) => {
                    const el = moneyEl(v);
                    el.title = 'Clique pour reprendre';
                    el.addEventListener('click', (e) => { e.stopPropagation(); removeFromTray(i); });
                    if (landValue === v && !landed) { el.classList.add('land'); landed = true; }
                    trayItems.appendChild(el);
                });
            }
            traySum.textContent = level === 3 ? '? €' : fmtE(sumGiven());
            traySum.title = level === 3 ? 'Au niveau difficile, compte toi-même !' : '';
        }

        // ── Plateau ────────────────────────────────────────────────────────
        function addToTray(v) {
            if (busy || !cur) return;
            if (given.length >= 30) { say('Le plateau est plein ! Reprends des pièces ou vide le plateau 🧹', 'bad'); return; }
            given.push(v);
            given.sort((a, b) => b - a);
            sfx(JCM_MONEY[v].type === 'bill' ? 'bill' : 'coin');
            renderTray(v);
        }
        function removeFromTray(i) {
            if (busy) return;
            given.splice(i, 1);
            sfx('pick');
            renderTray();
        }
        function clearTray() {
            if (busy) return;
            given = [];
            renderTray();
        }

        // Pointeur : clic court = poser sur le plateau, glisser = déposer sur le plateau
        function startPointer(e, slot, v) {
            if (busy) return;
            e.stopPropagation(); e.preventDefault();
            const sx = e.clientX, sy = e.clientY;
            let ghost = null;
            const overTray = (x, y) => {
                const hit = document.elementFromPoint(x, y);
                return !!(hit && hit.closest('.jcm-tray') && container.contains(hit));
            };
            const onMove = (ev) => {
                if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
                    ghost = moneyEl(v);
                    ghost.classList.add('jcm-ghost');
                    ghost.style.setProperty('--jcm-s', curScale);
                    ghost.style.setProperty('--k', 1);
                    document.body.appendChild(ghost);
                    slot.classList.add('dragging');
                }
                if (ghost) {
                    ghost.style.left = ev.clientX + 'px';
                    ghost.style.top = ev.clientY + 'px';
                    tray.classList.toggle('over', overTray(ev.clientX, ev.clientY));
                }
            };
            const onUp = (ev) => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                document.removeEventListener('pointercancel', onUp);
                tray.classList.remove('over');
                slot.classList.remove('dragging');
                if (!ghost) { addToTray(v); return; }
                ghost.remove();
                if (overTray(ev.clientX, ev.clientY)) addToTray(v);
            };
            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
            document.addEventListener('pointercancel', onUp);
        }

        // ── Nouveau client ─────────────────────────────────────────────────
        function loadClient() {
            cur = genClient();
            given = []; hintedCount = 0;
            errors = 0; hints = 0;
            totalShown = level !== 3;
            patienceMax = JCM_LEVELS[level].patience;
            patience = patienceMax; impatient = false;
            updatePatience();
            winLayer.classList.remove('show');
            renderScene();
            renderTray();
            updateStats(false);

            busy = true;
            bubble.classList.add('hidden');
            clientEl.classList.remove('gone', 'leave', 'arrive'); void clientEl.offsetWidth;
            clientEl.classList.add('arrive');
            sfx('arrive');
            setTimeout(() => {
                clientEl.classList.remove('arrive');
                busy = false;
                const list = cur.goods.map(({ g }) => `${g[1]} ${g[0]}`).join(' et ');
                const hello = rnd(['Bonjour !', 'Bonjour marchand !', 'Coucou !', 'Bonjour à vous !']);
                setBubble(`${hello} Je voudrais ${list}. Voici <b>${fmtE(cur.paid)}</b>.` +
                    (cur.round ? ' Comme ça, vous me rendez un compte rond !' : ''));
            }, 900);

            const tips = {
                1: 'Combien dois-tu lui rendre ? Pose la monnaie sur le plateau.',
                2: 'Attention aux centimes ! Compte en avançant à partir du prix.',
                3: 'Commence par <b>additionner les prix</b>, puis calcule la monnaie à rendre.',
            };
            say(`🛒 Client n°${clientNo} ! ${tips[level]}`);
        }
        function newRound() {
            clientNo = 1; roundStars = 0;
            loadClient();
        }

        // ── Patience ───────────────────────────────────────────────────────
        function updatePatience() {
            const pct = patienceMax ? Math.max(0, patience / patienceMax) : 0;
            patBar.style.width = (pct * 100) + '%';
            patEl.classList.toggle('mid', pct <= 0.5 && pct > 0.25);
            patEl.classList.toggle('low', pct <= 0.25);
        }
        const patTimer = setInterval(() => {
            if (!widget.isConnected) { clearInterval(patTimer); return; }
            if (!timerOn || busy || !cur || helpBox.classList.contains('show') || document.hidden) return;
            if (patience <= 0) return;
            patience = Math.max(0, patience - 0.25);
            updatePatience();
            if (patience <= 0 && !impatient) {
                impatient = true;
                setMood('😤');
                setBubble(rnd(['Ça va être long ?', 'Je suis un peu pressé…', 'Hum hum… ma monnaie ?']));
                say('⏱ Le client s\'impatiente… mais prends ton temps pour bien compter !');
            }
        }, 250);

        // ── Indice ─────────────────────────────────────────────────────────
        function giveHint() {
            if (busy || !cur) return;
            if (!totalShown) {
                totalShown = true;
                hints++;
                renderRegister();
                say(`💡 Additionne les prix : <span class="k">${cur.goods.map(g => fmtE(g.p)).join(' + ')} = ${fmtE(cur.price)}</span>. Maintenant, calcule la monnaie à rendre !`);
                return;
            }
            const rest = cur.change - sumGiven();
            if (rest < 0) {
                say(`💡 Tu as posé trop d'argent sur le plateau ! Clique sur une pièce ou un billet pour le reprendre.`, 'bad');
                return;
            }
            if (rest === 0) {
                say('💡 Le compte est bon : clique sur <b>Rendre la monnaie</b> ! 🤝');
                return;
            }
            // Pièce suivante dans l'ordre « compter en avançant » (petites pièces d'abord)
            const drawer = JCM_LEVELS[level].drawer;
            const seq = [].concat(...countUp(cur.price, cur.paid).map(st => (greedy(st.add, drawer) || []).reverse()));
            const left = given.slice();
            let next = null;
            for (const v of seq) {
                const k = left.indexOf(v);
                if (k !== -1) left.splice(k, 1);
                else { next = v; break; }
            }
            if (next === null || next > rest) next = greedy(rest, drawer)[0];
            hints++;
            addToTray(next);
            const el = trayItems.querySelector('.land');
            if (el) el.classList.add('hinted');
            const steps = countUp(cur.price, cur.paid).map(s => `${fmtS(s.add)} → ${fmtE(s.to)}`).join(' ; ');
            say(`💡 Je pose <b>${JCM_MONEY[next].label}</b> sur le plateau. ` +
                (hints === 1 || (hints === 2 && level === 3) ? `Compte en avançant à partir de <b>${fmtE(cur.price)}</b> : <span class="k">${steps}</span>` : 'Continue !'));
        }

        // ── Validation ─────────────────────────────────────────────────────
        function giveChange() {
            if (busy || !cur) return;
            if (!given.length) {
                say('📭 Le plateau est vide ! Prends des pièces et des billets dans le tiroir-caisse.', 'bad');
                sfx('error');
                return;
            }
            const s = sumGiven();
            if (s === cur.change) return victory();

            errors++;
            sfx('error');
            tray.classList.remove('ko'); void tray.offsetWidth; tray.classList.add('ko');
            setMood('🤨');
            let txt;
            if (s < cur.change) {
                setBubble(rnd(['Hé ! Il en manque…', 'Vous êtes sûr ? Ça ne fait pas le compte !', 'Il me manque de l\'argent !']));
                txt = level === 3
                    ? '🤨 Il manque de l\'argent ! Le client n\'a pas assez de monnaie.'
                    : `🤨 Tu rends <b>${fmtE(s)}</b> : il manque <span class="k">${fmtS(cur.change - s)}</span>.`;
            } else {
                setBubble(rnd(['Oh, c\'est trop !', 'Vous me rendez trop, marchand !', 'Hmm, c\'est beaucoup…']));
                txt = level === 3
                    ? '🤨 Tu rends trop d\'argent ! Le marchand va perdre des sous.'
                    : `🤨 Tu rends <b>${fmtE(s)}</b> : c'est <span class="k">${fmtS(s - cur.change)}</span> de trop.`;
            }
            if (errors >= 2) {
                const steps = countUp(cur.price, cur.paid).map(st => `+${fmtS(st.add)} → ${fmtE(st.to)}`).join(' ; ');
                txt += ` Astuce : pars de <b>${fmtE(cur.price)}</b> et compte jusqu'à <b>${fmtE(cur.paid)}</b> : <span class="k">${steps}</span>`;
            }
            if (errors >= 3) txt += ' Besoin d\'aide ? Essaie l\'indice 💡';
            say(txt, 'bad');
        }

        function starsFor() {
            let st = 3 - Math.min(2, errors);
            if (hints >= 1) st = Math.min(st, 2);
            if (hints >= 3) st = 1;
            return st;
        }

        function victory() {
            busy = true;
            const st = starsFor();
            const perfect = errors === 0 && hints === 0;
            const optimal = hints === 0 && given.length === greedy(cur.change, JCM_LEVELS[level].drawer).length;
            const fast = timerOn && patience > 0;
            streak = perfect ? streak + 1 : 0;
            const bonus = [];
            if (streak >= 3) bonus.push({ p: 5, t: 'série 🔥' });
            if (optimal) bonus.push({ p: 3, t: 'moins de pièces possible 🪙' });
            if (fast) bonus.push({ p: 2, t: 'rapidité ⏱' });
            const pts = st * 10 + bonus.reduce((a, b) => a + b.p, 0);
            score += pts;
            roundStars += st;
            totalShown = true;
            updateStats(true);
            tray.classList.add('ok');
            setMood('😍');
            setBubble(rnd(['Merci beaucoup, marchand !', 'Parfait, merci ! Au revoir !', 'Le compte est bon ! Merci !', 'Super, à bientôt !']));
            sfx('kaching');
            say(`🎉 ${rnd(['Bravo', 'Super', 'Génial', 'Parfait', 'Bien joué'])} ! ${fmtE(cur.paid)} − ${fmtE(cur.price)} = <span class="k">${fmtE(cur.change)}</span>. Le compte est bon !` +
                (optimal ? ' Et avec le moins de pièces possible 🪙' : ''), 'good');

            setTimeout(() => { trayItems.classList.add('fly'); }, 350);
            setTimeout(() => {
                trayItems.classList.remove('fly');
                bubble.classList.add('hidden');
                clientEl.classList.add('leave');
            }, 1200);
            setTimeout(() => {
                clientEl.classList.add('gone');
                clientEl.classList.remove('leave');
                given = [];
                renderTray();
                sfx('win');
                party();
                const last = clientNo >= CLIENTS_PER_ROUND;
                winCard.innerHTML = `
                    <h3>${perfect ? 'Du premier coup !' : 'Client servi !'}</h3>
                    <div class="jcm-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                    <p>+${pts} points</p>
                    ${bonus.length ? `<p class="jcm-bonus">Bonus : ${bonus.map(b => '+' + b.p + ' ' + b.t).join(' · ')}</p>` : ''}
                    <button class="jcm-btn jcm-btn-go" data-act="next">${last ? '🏁 Fin de la tournée' : 'Client suivant ▶'}</button>`;
                winLayer.classList.add('show');
                renderRegister();
                [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
                winCard.querySelector('[data-act="next"]').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (last) finalScreen();
                    else { clientNo++; loadClient(); }
                });
            }, 2200);
        }

        function finalScreen() {
            const max = CLIENTS_PER_ROUND * 3;
            const medal = roundStars >= max - 2 ? '🥇' : roundStars >= Math.round(max * 0.6) ? '🥈' : '🥉';
            const title = medal === '🥇' ? 'Marchand en or !' : medal === '🥈' ? 'Super marchand !' : 'Journée terminée !';
            clientNo = CLIENTS_PER_ROUND + 1;
            updateStats(false);
            winCard.innerHTML = `
                <div class="jcm-medal">${medal}</div>
                <h3>${title}</h3>
                <p>${roundStars} ⭐ sur ${max} pour cette journée au marché</p>
                <button class="jcm-btn jcm-btn-go" data-act="again">🔄 Nouvelle journée</button>`;
            winLayer.classList.add('show');
            sfx('win');
            party();
            say(`🏁 Le marché ferme ! ${roundStars} étoiles aujourd'hui. Tu peux rejouer ou essayer un autre niveau.`, 'good');
            winCard.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); newRound(); });
        }

        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                if (i % 3 === 0) { c.className = 'coin'; c.style.background = rnd(['#E3B341', '#C9CED6', '#C77A3A']); }
                else c.style.background = rnd(CONFETTI_COLORS);
                c.style.left = (Math.random() * 100) + '%';
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Niveaux ────────────────────────────────────────────────────────
        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            streak = 0;
            renderDrawer();
            newRound();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => {
            if (!busy || winLayer.classList.contains('show')) { busy = false; setLevel(+b.dataset.level); }
        }));

        btn('hint').addEventListener('click', giveHint);
        btn('clear').addEventListener('click', clearTray);
        btn('give').addEventListener('click', giveChange);

        timerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            timerOn = !timerOn;
            timerBtn.classList.toggle('off', !timerOn);
            container.classList.toggle('no-timer', !timerOn);
            timerBtn.title = timerOn ? 'Désactiver la patience des clients' : 'Activer la patience des clients';
        });
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
            window._wfMiniBarCollapse(widget, '🧺 La caisse du marchand', { onExpand: applyScale });
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
            clearInterval(patTimer);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
        const onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
            if (_isMax) applyScale();
        };
        window.addEventListener('resize', onWinResize);

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.jcm-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, .jcm-slot, .jcm-tray-items .jcm-money, .jcm-rh, .jcm-help')) {
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
            if (type === 'jeu-caisse-marchand') return window.createJeuCaisseMarchandWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-caisse-marchand') return window.createJeuCaisseMarchandWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
