// =========================================================================
// JEU « PLUS GRAND / PLUS PETIT » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — mode jeu élèves
//
// Trois nombres apparaissent : taper le plus vite possible sur le plus grand
// (ou le plus petit, ou consigne mélangée). Avec 3 réponses, cliquer au
// hasard ne paie plus (1 chance sur 3).
//   👤 Seul    : 20 questions chronométrées, points selon la rapidité, record.
//   👥 À deux  : écran partagé pour le TBI (un joueur de chaque côté, multi-
//               touch). Une erreur bloque son côté. Victoire au choix :
//               premier à N points, ou le plus de points en N manches.
//               Bouton ⏸ Pause pendant le duel.
//               Liste de classe (bouton 📂, fichier .txt « prénom;nom ») :
//               tirage au sort de 2 élèves par duel (chacun passe une fois
//               par tour), scores affichés à côté du nom de chaque élève,
//               liste visible à gauche et à droite en plein écran.
// Nombres : jusqu'à 20, 100, 1 000, grands nombres, décimaux, fractions, calculs.
// 3 niveaux : facile (écart large), moyen (nombres proches), difficile (pièges).
//
// Ouverture : createWidget('jeu-plus-grand')
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


    // ── CSS du jeu (préfixe jpg-) ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-plus-grand-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-plus-grand-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-plus-grand"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jpg-container {
            --jpg-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --bleu: #3BA7FF;
            --orange: #FF7A1A;

            width: 700px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--jpg-s)) calc(14px * var(--jpg-s)) calc(14px * var(--jpg-s));
            border-radius: calc(24px * var(--jpg-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jpg-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .jpg-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jpg-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jpg-s));
            width: 100%; max-width: calc(672px * var(--jpg-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jpg-header { display: flex; align-items: center; gap: calc(10px * var(--jpg-s)); cursor: move; flex-wrap: wrap; }
        .jpg-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jpg-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jpg-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .jpg-stats { display: flex; gap: calc(6px * var(--jpg-s)); align-items: center; margin-left: auto; }
        .jpg-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jpg-s)) calc(10px * var(--jpg-s));
            font-weight: 900; font-size: calc(14px * var(--jpg-s));
            white-space: nowrap;
        }
        .jpg-chip.hot { background: #FF7A1A; }
        @keyframes jpg-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jpg-chip.bump { animation: jpg-bump .4s ease; }
        .jpg-container.duel .jpg-stats { display: none; }
        .jpg-icon-btn {
            width: calc(26px * var(--jpg-s)); height: calc(26px * var(--jpg-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jpg-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jpg-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Réglages ── */
        .jpg-bar { display: flex; align-items: center; gap: calc(6px * var(--jpg-s)); flex-wrap: wrap; }
        .jpg-seg { display: inline-flex; background: rgba(255,255,255,0.08); border-radius: 999px; padding: 2px; }
        .jpg-seg button, .jpg-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jpg-s));
            padding: calc(5px * var(--jpg-s)) calc(11px * var(--jpg-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jpg-seg button { border-color: transparent; }
        .jpg-seg button.active { background: #fff; color: var(--encre); }
        .jpg-lvl:hover { background: rgba(255,255,255,0.1); }
        .jpg-lvl:active { transform: scale(0.95); }
        .jpg-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jpg-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jpg-s));
            padding: calc(4px * var(--jpg-s)) calc(8px * var(--jpg-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }

        /* ── Arène ── */
        .jpg-arena {
            position: relative;
            height: calc(330px * var(--jpg-s));
            border-radius: calc(18px * var(--jpg-s));
            overflow: hidden;
            flex-shrink: 0;
        }
        .jpg-arena.solo {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jpg-s)), transparent calc(2px * var(--jpg-s))) 0 0 / calc(24px * var(--jpg-s)) calc(24px * var(--jpg-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(18px * var(--jpg-s));
        }
        .jpg-arena.duel { display: grid; grid-template-columns: 1fr calc(54px * var(--jpg-s)) 1fr; height: calc(370px * var(--jpg-s)); }

        .jpg-order {
            color: #fff; font-weight: 900; font-size: calc(20px * var(--jpg-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(6px * var(--jpg-s)) calc(18px * var(--jpg-s));
            text-align: center; white-space: nowrap;
        }
        .jpg-order b { font-family: 'Lilita One', sans-serif; font-weight: 400; letter-spacing: 0.5px; }
        .jpg-order.big b { color: #7CFFB2; }
        .jpg-order.small b { color: #FFB3D0; }
        @keyframes jpg-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .jpg-order.pop { animation: jpg-pop .3s ease-out; }

        .jpg-pair { display: flex; align-items: center; justify-content: center; gap: calc(14px * var(--jpg-s)); }
        .jpg-vs { color: rgba(255,255,255,0.7); font-family: 'Lilita One', sans-serif; font-size: calc(22px * var(--jpg-s)); }
        .jpg-num {
            min-width: calc(180px * var(--jpg-s)); height: calc(120px * var(--jpg-s));
            padding: 0 calc(14px * var(--jpg-s));
            border: none; border-radius: calc(22px * var(--jpg-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(44px * var(--jpg-s)); line-height: 1;
            box-shadow: 0 calc(8px * var(--jpg-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .jpg-num:hover { background: #FFF3C4; }
        .jpg-num:active { transform: translateY(calc(5px * var(--jpg-s))); box-shadow: 0 calc(3px * var(--jpg-s)) 0 #B9B2D6; }
        .jpg-num.hidden { color: #D9D2EE; }
        .jpg-num.ok  { background: var(--vert); color: #fff; box-shadow: 0 calc(8px * var(--jpg-s)) 0 #1C8A4F; }
        .jpg-num.ko  { background: var(--rouge); color: #fff; box-shadow: 0 calc(8px * var(--jpg-s)) 0 #B32B38; }
        .jpg-num.hint { box-shadow: 0 0 0 calc(5px * var(--jpg-s)) var(--vert), 0 calc(8px * var(--jpg-s)) 0 #B9B2D6; }
        @keyframes jpg-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .jpg-num.ko { animation: jpg-shake .4s ease; }
        .jpg-num.appear { animation: jpg-pop .25s ease-out; }
        .jpg-frac { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; font-size: 0.8em; }
        .jpg-frac span:first-child { border-bottom: calc(4px * var(--jpg-s)) solid currentColor; padding: 0 0.12em 0.06em; }
        .jpg-frac span:last-child { padding-top: 0.06em; }
        .jpg-num small { font-size: 0.72em; }

        .jpg-timebar {
            width: 60%; height: calc(10px * var(--jpg-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .jpg-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .jpg-timebar.low i { background: var(--rouge); }

        /* Duel */
        .jpg-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--jpg-s));
            padding: calc(10px * var(--jpg-s));
            transition: background .2s;
        }
        .jpg-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); border-radius: calc(18px * var(--jpg-s)) 0 0 calc(18px * var(--jpg-s)); }
        .jpg-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); border-radius: 0 calc(18px * var(--jpg-s)) calc(18px * var(--jpg-s)) 0; }
        .jpg-half.win { box-shadow: inset 0 0 0 calc(6px * var(--jpg-s)) #7CFFB2; }
        .jpg-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--jpg-s));
            background: rgba(42,31,74,0.45); border-radius: inherit;
        }
        .jpg-half .jpg-order { font-size: calc(15px * var(--jpg-s)); padding: calc(4px * var(--jpg-s)) calc(12px * var(--jpg-s)); }
        .jpg-half .jpg-pair { flex-direction: column; gap: calc(9px * var(--jpg-s)); width: 100%; }
        .jpg-half .jpg-num { min-width: 0; width: 86%; height: calc(62px * var(--jpg-s)); font-size: calc(32px * var(--jpg-s)); box-shadow: 0 calc(6px * var(--jpg-s)) 0 #B9B2D6; }
        .jpg-phead { display: flex; align-items: center; gap: calc(8px * var(--jpg-s)); }
        .jpg-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jpg-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--jpg-s)) 0 rgba(0,0,0,0.25);
        }
        .jpg-pscore.bump { animation: jpg-bump .4s ease; }
        .jpg-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jpg-s));
            width: calc(150px * var(--jpg-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--jpg-s)) calc(8px * var(--jpg-s));
            user-select: text;
        }
        .jpg-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .jpg-pkeys { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(11px * var(--jpg-s)); }
        .jpg-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--jpg-s)); color: #fff;
        }
        .jpg-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--jpg-s)); color: var(--or); }
        .jpg-mid small { font-size: calc(10px * var(--jpg-s)); font-weight: 900; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .jpg-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(46px * var(--jpg-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--jpg-s)) 0 rgba(0,0,0,0.3);
        }
        .jpg-ready.show { display: flex; animation: jpg-pop .3s ease-out; }

        /* ── Actions ── */
        .jpg-actions { display: flex; gap: calc(8px * var(--jpg-s)); justify-content: center; flex-wrap: wrap; }
        .jpg-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jpg-s));
            padding: calc(8px * var(--jpg-s)) calc(14px * var(--jpg-s));
            border-radius: calc(14px * var(--jpg-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jpg-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jpg-btn:hover { filter: brightness(1.05); }
        .jpg-btn:active { transform: translateY(calc(4px * var(--jpg-s))); box-shadow: 0 calc(1px * var(--jpg-s)) 0 #B9B2D6; }
        .jpg-btn:disabled { opacity: 0.45; cursor: default; }
        .jpg-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jpg-s));
            padding: calc(8px * var(--jpg-s)) calc(22px * var(--jpg-s));
            box-shadow: 0 calc(5px * var(--jpg-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jpg-btn-go:active { box-shadow: 0 calc(1px * var(--jpg-s)) 0 #1C8A4F; }
        .jpg-btn:focus-visible, .jpg-lvl:focus-visible, .jpg-select:focus-visible, .jpg-num:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jpg-talk { display: flex; align-items: center; gap: calc(10px * var(--jpg-s)); }
        .jpg-chef {
            width: calc(44px * var(--jpg-s)); height: calc(44px * var(--jpg-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jpg-s));
            box-shadow: 0 calc(3px * var(--jpg-s)) 0 #B3840B;
        }
        @keyframes jpg-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jpg-s))) rotate(-8deg); } }
        .jpg-chef.hop { animation: jpg-hop .4s ease; }
        .jpg-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jpg-s));
            padding: calc(8px * var(--jpg-s)) calc(12px * var(--jpg-s));
            font-weight: 700; font-size: calc(15px * var(--jpg-s)); line-height: 1.35;
            min-height: calc(22px * var(--jpg-s));
            border-left: calc(6px * var(--jpg-s)) solid var(--or);
        }
        .jpg-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jpg-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jpg-msg b { font-weight: 900; }
        .jpg-msg .jpg-frac { font-size: 0.85em; vertical-align: middle; }
        .jpg-msg .jpg-frac span:first-child { border-bottom-width: 2px; }

        /* ── Fin de partie ── */
        .jpg-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.45);
        }
        .jpg-overlay.show { display: flex; }
        .jpg-card {
            background: #fff; border-radius: calc(18px * var(--jpg-s));
            padding: calc(12px * var(--jpg-s)) calc(22px * var(--jpg-s)) calc(14px * var(--jpg-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jpg-s)) 0 #B9B2D6;
            animation: jpg-pop .35s ease-out;
            max-width: 90%;
        }
        .jpg-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jpg-s)); color: var(--encre); }
        .jpg-card p { margin: calc(4px * var(--jpg-s)) 0 calc(8px * var(--jpg-s)); font-weight: 800; font-size: calc(14px * var(--jpg-s)); }
        .jpg-card .jpg-sub { font-size: calc(12px * var(--jpg-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jpg-s)); }
        .jpg-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jpg-s)); margin: calc(4px * var(--jpg-s)) 0; }
        .jpg-bigstars span { font-size: calc(34px * var(--jpg-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jpg-bigstars span.on { opacity: 1; filter: none; animation: jpg-pop .35s ease-out both; }
        .jpg-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jpg-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jpg-medal { font-size: calc(56px * var(--jpg-s)); line-height: 1; animation: jpg-pop .5s ease-out; }

        /* ── Réglages du duel ── */
        .jpg-duelset { display: none; align-items: center; gap: calc(6px * var(--jpg-s)); }
        .jpg-container.duel .jpg-duelset { display: inline-flex; }
        .jpg-step {
            display: inline-flex; align-items: center; background: #fff; border-radius: 999px; overflow: hidden;
            box-shadow: 0 calc(3px * var(--jpg-s)) 0 #B9B2D6;
        }
        .jpg-step button {
            border: none; background: transparent; color: #5B3FB0; cursor: pointer;
            font-family: inherit; font-weight: 900; font-size: calc(15px * var(--jpg-s));
            width: calc(26px * var(--jpg-s)); height: calc(26px * var(--jpg-s));
        }
        .jpg-step button:hover { background: #EFEAFB; }
        .jpg-step span {
            min-width: calc(26px * var(--jpg-s)); text-align: center; color: var(--encre);
            font-family: 'Lilita One', sans-serif; font-size: calc(16px * var(--jpg-s));
        }
        .jpg-endlbl { color: #fff; font-weight: 800; font-size: calc(13px * var(--jpg-s)); }
        .jpg-container:not(.duel) [data-role="class"] { display: none; }
        .jpg-icon-btn.on { background: var(--or); color: var(--encre); }
        .jpg-btn[hidden] { display: none; }
        .jpg-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--jpg-s)) 0 #B3840B; }

        /* ── Pause ── */
        .jpg-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: #2A1F4A; cursor: pointer; border-radius: inherit;
        }
        .jpg-pause.show { display: flex; animation: jpg-pop .25s ease-out; }
        .jpg-pause-card {
            text-align: center; color: #fff; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--jpg-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--jpg-s)) 0 rgba(0,0,0,0.35);
        }
        .jpg-pause-card small {
            display: block; margin-top: calc(8px * var(--jpg-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--jpg-s)); opacity: 0.8; text-shadow: none;
        }

        /* ── Fin du duel ── */
        .jpg-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--jpg-s)); margin: calc(2px * var(--jpg-s)) 0; }
        .jpg-final > span { display: inline-block; vertical-align: top; }
        .jpg-final .L { color: #1F6FB5; } .jpg-final .R { color: #E0620F; }
        .jpg-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--jpg-s)); }
        .jpg-card .jpg-rec { font-size: calc(12px * var(--jpg-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--jpg-s)); }
        .jpg-card .jpg-actions { margin-top: calc(4px * var(--jpg-s)); }

        /* ── Panneau élèves ── */
        .jpg-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .jpg-class.show { display: flex; }
        .jpg-class-head { display: flex; align-items: baseline; gap: 8px; }
        .jpg-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .jpg-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .jpg-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .jpg-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px; background: #EFEAFB; color: var(--encre);
        }
        .jpg-class-tools button:hover { background: #E1D8F8; }
        .jpg-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .jpg-class-tools button.go { background: var(--or); }
        .jpg-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .jpg-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .jpg-st { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 9px; background: #F7F4FE; }
        .jpg-st:hover { background: #EFEAFB; }
        .jpg-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .jpg-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .jpg-st.played .jpg-st-name::before { content: '✔ '; color: var(--vert); }
        .jpg-st.absent { opacity: 0.45; }
        .jpg-st.absent .jpg-st-name { text-decoration: line-through; }
        .jpg-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .jpg-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .jpg-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .jpg-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff; background: #8C82AE;
        }
        .jpg-sc.win { background: var(--vert); }
        .jpg-sc.lose { background: var(--rouge); }
        .jpg-sc.tie { background: #E0A800; }
        .jpg-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .jpg-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .jpg-container.jpg-has-sides .jpg-side { display: flex; }
        .jpg-side-title { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); text-align: center; line-height: 1.1; margin-bottom: 2px; }
        .jpg-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; }
        .jpg-side .jpg-st { background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em; border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0; }
        .jpg-side .jpg-st:hover { background: rgba(255,255,255,0.18); }
        .jpg-side .jpg-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .jpg-side .jpg-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .jpg-side .jpg-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .jpg-side .jpg-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .jpg-side .jpg-st.played .jpg-st-name::before { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .jpg-arena.draw {
            height: calc(370px * var(--jpg-s));
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jpg-s)), transparent calc(2px * var(--jpg-s))) 0 0 / calc(24px * var(--jpg-s)) calc(24px * var(--jpg-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--jpg-s)); color: #fff; padding: calc(16px * var(--jpg-s)); box-sizing: border-box;
        }
        .jpg-draw-title { font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--jpg-s)); color: var(--or); text-shadow: 0 calc(3px * var(--jpg-s)) 0 #B3470F; }
        .jpg-draw-row { display: flex; align-items: center; gap: calc(14px * var(--jpg-s)); width: 100%; justify-content: center; }
        .jpg-draw-card {
            flex: 1; max-width: calc(270px * var(--jpg-s)); min-width: 0;
            border-radius: calc(20px * var(--jpg-s)); padding: calc(14px * var(--jpg-s)) calc(10px * var(--jpg-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jpg-s)) 0 rgba(0,0,0,0.3);
        }
        .jpg-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .jpg-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .jpg-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--jpg-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .jpg-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(32px * var(--jpg-s)); line-height: 1.1; margin-top: calc(4px * var(--jpg-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--jpg-s)) 0 rgba(0,0,0,0.25);
        }
        .jpg-draw-card b.rolling { opacity: 0.75; }
        .jpg-draw-card b.done { animation: jpg-pop .35s ease-out; }
        .jpg-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jpg-s)); color: var(--or); text-shadow: 0 calc(3px * var(--jpg-s)) 0 #B3470F; }
        .jpg-draw-info { font-weight: 800; font-size: calc(13px * var(--jpg-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }

        /* ── Aide ── */
        .jpg-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jpg-help.show { display: block; }
        .jpg-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jpg-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jpg-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jpg-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jpg-fall 1.8s ease-in forwards; }
        @keyframes jpg-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jpg-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jpg-container:hover .jpg-rh { opacity: 1; }
        .jpg-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jpg-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jpg-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jpg-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jpg-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jpg-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jpg-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jpg-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .jpg-container *, .jpg-container *::before, .jpg-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // NOMBRES À COMPARER
    // Chaque générateur renvoie deux objets { v: valeur, h: affichage HTML, t: texte }
    // lvl : 1 = écart large, 2 = écart moyen, 3 = nombres très proches (pièges)
    // =========================================================================
    const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    const fmtDec = (n, d) => n.toFixed(d).replace('.', ',');
    const I = (n) => ({ v: n, h: fmtInt(n), t: fmtInt(n) });
    function permute(n) {
        const d = String(n).split('');
        for (let k = 0; k < 10; k++) {
            const a = ri(0, d.length - 1), b = ri(0, d.length - 1);
            if (a !== b && d[a] !== d[b] && !(Math.min(a, b) === 0 && (d[a] === '0' || d[b] === '0'))) {
                [d[a], d[b]] = [d[b], d[a]];
                return +d.join('');
            }
        }
        return n + ri(1, 9);
    }
    const TYPES = {
        n20: { label: 'Nombres jusqu\'à 20', tip: 'Pense à la file numérique : le plus grand est le plus loin.',
            gen(l) { const gap = l === 1 ? ri(4, 10) : l === 2 ? ri(2, 4) : 1; const a = ri(0, 20 - gap); return [I(a), I(a + gap)]; } },
        n100: { label: 'Nombres jusqu\'à 100', tip: 'Compare d\'abord les <b>dizaines</b>, puis les unités.',
            gen(l) {
                if (l === 1) { let a = ri(0, 99), b; do { b = ri(0, 99); } while (Math.abs(a - b) < 10); return [I(a), I(b)]; }
                if (l === 2) { const a = ri(12, 98); const b = permute(a); return [I(a), I(b !== a ? b : a - 1)]; }
                const t = ri(1, 9) * 10, u = ri(0, 8); return [I(t + u), I(t + u + ri(1, 9 - u))];
            } },
        n1000: { label: 'Nombres jusqu\'à 1 000', tip: 'Compare les <b>centaines</b>, puis les dizaines, puis les unités.',
            gen(l) {
                if (l === 1) { let a = ri(100, 999), b; do { b = ri(100, 999); } while (Math.floor(a / 100) === Math.floor(b / 100)); return [I(a), I(b)]; }
                if (l === 2) { const h = ri(1, 9) * 100; let a = h + ri(0, 99), b; do { b = h + ri(0, 99); } while (b === a); return [I(a), I(b)]; }
                let a; do { a = ri(102, 987); } while (new Set(String(a)).size < 2); let b = permute(a); if (b === a || b > 999) b = a + 1; return [I(a), I(b)];
            } },
        n1m: { label: 'Grands nombres', tip: 'Compte d\'abord les <b>chiffres</b> : plus il y en a, plus le nombre est grand. Sinon, compare de gauche à droite.',
            gen(l) {
                if (l === 1) { const a = ri(1000, 99999); let b = ri(100000, 999999); if (Math.random() < 0.5) b = ri(10000, 99999); return b === a ? [I(a), I(a + 1)] : [I(a), I(b)]; }
                if (l === 2) { const len = ri(5, 6); const a = ri(10 ** (len - 1), 10 ** len - 1); let b; do { b = ri(10 ** (len - 1), 10 ** len - 1); } while (String(b)[0] !== String(a)[0] || b === a); return [I(a), I(b)]; }
                const a = ri(100000, 999999); const b = permute(a); return [I(a), I(b !== a ? b : a + 10)];
            } },
        dec: { label: 'Nombres décimaux', tip: 'Compare d\'abord la <b>partie entière</b>, puis les <b>dixièmes</b>, puis les centièmes. Ce n\'est pas le nombre le plus long qui gagne !',
            gen(l) {
                const D = (v, d) => ({ v, h: fmtDec(v, d), t: fmtDec(v, d) });
                if (l === 1) { let a = ri(10, 99) / 10, b; do { b = ri(10, 99) / 10; } while (Math.abs(a - b) < 0.3); return [D(a, 1), D(b, 1)]; }
                if (l === 2) { const e = ri(0, 9); const a = e + ri(1, 9) / 10; let b; do { b = e + ri(1, 99) / 100; } while (Math.abs(a - b) < 0.005 || Math.round(b * 100) % 10 === 0); return [D(a, 1), D(b, 2)]; }
                const e = ri(0, 5); const traps = [
                    () => [D(e + ri(1, 9) / 10, 1), D(e + ri(10, 99) / 100, 2)],
                    () => { const x = ri(1, 9); return [D(e + x / 10, 1), D(e + x / 100, 2)]; },
                    () => { const x = ri(1, 9), y = ri(1, 9); return [D(e + x / 10 + y / 100, 2), D(e + y / 10 + x / 100, 2)]; },
                    () => [D(e + ri(1, 9) / 10, 1), D(e + ri(100, 999) / 1000, 3)],
                ];
                let p; do { p = rnd(traps)(); } while (Math.abs(p[0].v - p[1].v) < 0.0005);
                return p;
            } },
        frac: { label: 'Fractions', tip: 'Même dénominateur : on compare les numérateurs. Même numérateur : la plus grande part est celle qui a le <b>plus petit</b> dénominateur.',
            gen(l) {
                const F = (n, d) => ({ v: n / d, h: `<span class="jpg-frac"><span>${n}</span><span>${d}</span></span>`, t: `${n}/${d}` });
                let a, b;
                do {
                    if (l === 1) { const d = rnd([2, 3, 4, 5, 6, 8, 10]); const n1 = ri(1, d * 2 - 1), n2 = ri(1, d * 2 - 1); a = F(n1, d); b = F(n2, d); }
                    else if (l === 2) { const n = ri(1, 5); const d1 = ri(n + 1, 10), d2 = ri(n + 1, 10); a = F(n, d1); b = F(n, d2); }
                    else { a = F(ri(1, 9), ri(2, 10)); b = F(ri(1, 9), ri(2, 10)); }
                } while (Math.abs(a.v - b.v) < 1e-9);
                return [a, b];
            } },
        calc: { label: 'Calculs', tip: 'Calcule les deux résultats, puis compare-les.',
            gen(l) {
                const C = (txt, v) => ({ v, h: txt.replace('×', '<small>×</small>'), t: txt, res: v });
                let a, b;
                do {
                    if (l === 1) { const x = ri(1, 10), y = ri(1, 10), z = ri(1, 10), w = ri(1, 10); a = C(`${x} + ${y}`, x + y); b = C(`${z} + ${w}`, z + w); }
                    else if (l === 2) {
                        const mk = () => { if (Math.random() < 0.5) { const x = ri(5, 40), y = ri(2, 30); return C(`${x} + ${y}`, x + y); } const x = ri(20, 60), y = ri(2, 19); return C(`${x} − ${y}`, x - y); };
                        a = mk(); b = mk();
                    } else { const x = ri(2, 9), y = ri(2, 10), z = ri(2, 9), w = ri(2, 10); a = C(`${x} × ${y}`, x * y); b = C(`${z} × ${w}`, z * w); }
                } while (a.v === b.v || Math.abs(a.v - b.v) > (l === 1 ? 8 : 15));
                return [a, b];
            } },
    };
    // ── 3 nombres : la paire du générateur + un 3e nombre ─────────────────
    // Facile : 3e nombre au hasard. Moyen / difficile : on garde un 3e nombre
    // proche des deux autres pour que le choix reste exigeant.
    function gen3(t, l) {
        const g = TYPES[t].gen, p = g(l);
        const distinct = (x) => p.every(q => Math.abs(q.v - x.v) > 1e-9);
        const cands = [];
        for (let i = 0; i < 30; i++) g(l).forEach(x => { if (distinct(x)) cands.push(x); });
        // Fractions : le 3e nombre suit la même règle que la paire
        // (facile = même dénominateur, moyen = même numérateur)
        if (t === 'frac' && l < 3) {
            const nd = p[0].t.split('/').map(Number);
            const ok = cands.filter(x => { const xd = x.t.split('/').map(Number); return l === 1 ? xd[1] === nd[1] : xd[0] === nd[0]; });
            if (ok.length) return p.concat([rnd(ok)]);
            const F = (n, d) => ({ v: n / d, h: `<span class="jpg-frac"><span>${n}</span><span>${d}</span></span>`, t: `${n}/${d}` });
            for (let i = 0; i < 40; i++) {
                const x = l === 1 ? F(ri(1, nd[1] * 2 - 1), nd[1]) : F(nd[0], ri(nd[0] + 1, 12));
                if (distinct(x)) return p.concat([x]);
            }
        }
        if (!cands.length) return p;
        if (l === 1) return p.concat([rnd(cands)]);
        const lo = Math.min(p[0].v, p[1].v), hi = Math.max(p[0].v, p[1].v);
        const dist = (x) => x.v < lo ? lo - x.v : x.v > hi ? x.v - hi : 0;
        cands.sort((a, b) => dist(a) - dist(b));
        return p.concat([rnd(cands.slice(0, 4))]);
    }
    const JPG_LEVELS = {
        1: { time: 6000, label: 'écart large' },
        2: { time: 4500, label: 'nombres proches' },
        3: { time: 3500, label: 'pièges' },
    };
    const SOLO_ROUNDS = 20;
    const DUEL_KEY = 'jeu-plus-grand-duel';       // fin du duel (points / manches)
    const CLASS_KEY = 'jeu-plus-grand-classe';    // liste d'élèves + scores
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    function loadDuel() {
        const d = { end: 'goal', goal: 10, count: 10 };
        try { Object.assign(d, JSON.parse(localStorage.getItem(DUEL_KEY) || '{}')); } catch (e) {}
        if (d.end !== 'count') d.end = 'goal';
        d.goal = Math.max(1, Math.min(30, d.goal | 0 || 10));
        d.count = Math.max(3, Math.min(40, d.count | 0 || 10));
        return d;
    }
    function saveDuel(d) { try { localStorage.setItem(DUEL_KEY, JSON.stringify(d)); } catch (e) {} }

    // Liste d'élèves (fichier .txt « prénom;nom »)
    // { students: [{ id, prenom, nom, absent, scores: [{ pts, opp, adv }] }], played: [id…] }
    function loadClass() {
        try {
            const c = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
            if (c && Array.isArray(c.students)) {
                c.played = Array.isArray(c.played) ? c.played : [];
                c.students.forEach(st => { if (!Array.isArray(st.scores)) st.scores = []; });
                return c;
            }
        } catch (e) {}
        return { students: [], played: [] };
    }
    function saveClass(c) { try { localStorage.setItem(CLASS_KEY, JSON.stringify(c)); } catch (e) {} }
    function parseClassList(text) {
        const out = [];
        text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/).forEach((line, i) => {
            line = line.trim();
            if (!line) return;
            const parts = line.split(/[;\t,]/).map(x => x.trim().replace(/^"|"$/g, ''));
            const prenom = parts[0] || '', nom = parts.slice(1).join(' ').trim();
            if (!prenom && !nom) return;
            if (i === 0 && /^pr[ée]nom$/i.test(prenom) && (!nom || /^nom$/i.test(nom))) return;   // en-tête
            out.push({ id: 'e' + Date.now().toString(36) + '_' + out.length, prenom, nom, absent: false, scores: [] });
        });
        return out;
    }
    const fullName = (st) => (st.prenom + ' ' + st.nom).trim();
    const RECORD_KEY = 'jeu-plus-grand-records';
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // ── Sons ───────────────────────────────────────────────────────────────
    let _jpgAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jpgAudio) _jpgAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jpgAudio, t0 = ctx.currentTime + start;
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
        good:  () => { tone(660, 0, 0.08, 'triangle', 0.09); tone(990, 0.06, 0.12, 'triangle', 0.08); },
        bad:   () => { tone(200, 0, 0.18, 'square', 0.05); tone(150, 0.16, 0.22, 'square', 0.05); },
        go:    () => tone(880, 0, 0.1, 'square', 0.05),
        tick:  () => tone(440, 0, 0.05, 'square', 0.03),
        pointL:() => [523, 784].forEach((f, i) => tone(f, 0.07 * i, 0.12, 'triangle', 0.09)),
        pointR:() => [587, 880].forEach((f, i) => tone(f, 0.07 * i, 0.12, 'triangle', 0.09)),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
    };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuPlusGrandWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-plus-grand';
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

        const typeOptions = Object.keys(TYPES).map(k => `<option value="${k}">${TYPES[k].label}</option>`).join('');

        const container = document.createElement('div');
        container.className = 'jpg-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jpg-inner">
            <div class="jpg-header">
                <span class="jpg-title">Plus grand / plus petit</span>
                <div class="jpg-stats">
                    <span class="jpg-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="jpg-chip" data-role="record" title="Record (sur cet ordinateur)">🏆 0</span>
                    <span class="jpg-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jpg-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jpg-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="jpg-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jpg-bar">
                <div class="jpg-seg" title="Nombre de joueurs">
                    <button class="active" data-mode="solo">👤 Seul</button>
                    <button data-mode="duel">👥 À deux</button>
                </div>
                <button class="jpg-lvl active" data-level="1">😊 Facile</button>
                <button class="jpg-lvl" data-level="2">😐 Moyen</button>
                <button class="jpg-lvl" data-level="3">😤 Difficile</button>
                <select class="jpg-select" data-role="type" title="Quels nombres ?">${typeOptions}</select>
                <select class="jpg-select" data-role="order" title="Que faut-il choisir ?">
                    <option value="big">⬆️ Le plus grand</option>
                    <option value="small">⬇️ Le plus petit</option>
                    <option value="mix">🔀 Mélangé</option>
                </select>
                <div class="jpg-duelset" title="Qui gagne le duel ?">
                    <div class="jpg-seg">
                        <button data-end="goal" title="Le premier qui atteint ce nombre de points gagne">🏁 Premier à</button>
                        <button data-end="count" title="Le plus de points après ce nombre de manches">🔢 En</button>
                    </div>
                    <div class="jpg-step">
                        <button data-step="-1" title="Moins">−</button><span data-role="endn">10</span><button data-step="1" title="Plus">+</button>
                    </div>
                    <span class="jpg-endlbl" data-role="endlbl">points</span>
                </div>
            </div>

            <div class="jpg-arena"></div>

            <div class="jpg-talk">
                <div class="jpg-chef">⚖️</div>
                <div class="jpg-msg"></div>
            </div>

            <div class="jpg-actions">
                <button class="jpg-btn jpg-btn-go" data-act="start">▶ Jouer</button>
                <button class="jpg-btn jpg-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="jpg-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="jpg-help">
                <h4>⚖️ Comment jouer ?</h4>
                <p>Trois nombres apparaissent : tape <b>le plus vite possible</b> sur le plus grand (ou le plus petit, selon la consigne affichée).</p>
                <p>👤 <b>Seul</b> : 20 questions, chacune avec un temps limité. Plus tu es rapide, plus tu gagnes de points !</p>
                <p>👥 <b>À deux</b> (au TBI) : un joueur de chaque côté de l'écran. Le premier qui tape le bon nombre marque le point. Si tu te trompes, ton côté est <b>bloqué 🔒</b> pour cette manche. Victoire : <b>premier à N points</b> ou <b>le plus de points en N manches</b> (au choix). ⏸ Pause possible pendant le duel.</p>
                <p>📂 À deux, chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p>Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
                <p style="margin:0">😊 <b>Facile</b> : nombres bien différents. 😐 <b>Moyen</b> : nombres proches. 😤 <b>Difficile</b> : pièges (3,5 et 3,25 ; 358 et 385…).</p>
            </div>
            <div class="jpg-side jpg-side-L"><div class="jpg-side-title">📂 Élèves</div><div class="jpg-side-list"></div></div>
            <div class="jpg-side jpg-side-R"><div class="jpg-side-title">📂 Élèves</div><div class="jpg-side-list"></div></div>
            <div class="jpg-class">
                <div class="jpg-class-head"><h4>📂 Élèves</h4><span class="jpg-class-count"></span></div>
                <div class="jpg-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="jpg-class-list"></div>
                <p class="jpg-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="jpg-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="jpg-confetti"></div>
            <div class="jpg-rh jpg-rh-nw" data-dir="nw"></div>
            <div class="jpg-rh jpg-rh-n"  data-dir="n"></div>
            <div class="jpg-rh jpg-rh-ne" data-dir="ne"></div>
            <div class="jpg-rh jpg-rh-e"  data-dir="e"></div>
            <div class="jpg-rh jpg-rh-se" data-dir="se"></div>
            <div class="jpg-rh jpg-rh-s"  data-dir="s"></div>
            <div class="jpg-rh jpg-rh-sw" data-dir="sw"></div>
            <div class="jpg-rh jpg-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.jpg-inner');
        const arena    = $('.jpg-arena');
        const msg      = $('.jpg-msg');
        const chef     = $('.jpg-chef');
        const streakEl = $('[data-role="streak"]');
        const recordEl = $('[data-role="record"]');
        const scoreEl  = $('[data-role="score"]');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.jpg-help');
        const confetti = $('.jpg-confetti');
        const typeSel  = $('[data-role="type"]');
        const orderSel = $('[data-role="order"]');
        const lvlBtns  = container.querySelectorAll('.jpg-lvl');
        const modeBtns = container.querySelectorAll('.jpg-seg button[data-mode]');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const classBtn  = $('[data-role="class"]');
        const classBox  = $('.jpg-class');
        const classList = $('.jpg-class-list');
        const classFile = $('.jpg-class-file');
        const clBtn = (a) => classBox.querySelector(`[data-cl="${a}"]`);
        const sideL = $('.jpg-side-L'), sideR = $('.jpg-side-R');
        const endBtns = container.querySelectorAll('[data-end]');
        const endN = $('[data-role="endn"]'), endLbl = $('[data-role="endlbl"]');

        // ── État ───────────────────────────────────────────────────────────
        let mode = 'solo', level = 1, type = 'n20', orderMode = 'big';
        let state = 'idle';          // idle | draw | wait | go | result | over
        let runId = 0;
        let pair = null, order = 'big', t0 = 0;
        // Solo
        let round = 0, good = 0, score = 0, streak = 0, times = [];
        // Duel
        let pts = { L: 0, R: 0 }, locked = { L: false, R: false }, names = { L: 'Joueur bleu', R: 'Joueur orange' }, duelRound = 0;
        let soundOn = true;
        let DS = loadDuel();          // fin du duel : { end: 'goal' | 'count', goal, count }
        let CL = loadClass();         // liste d'élèves
        let duo = null;               // { L: id, R: id } : élèves tirés au sort
        let rolling = false;          // animation de tirage en cours
        // Pause : une horloge qui s'arrête quand le jeu est en pause
        let paused = false, pauseStart = 0, pausedTotal = 0;
        const clock = () => performance.now() - pausedTotal - (paused ? performance.now() - pauseStart : 0);
        const pwait = (ms) => new Promise(res => {
            const end = clock() + ms;
            const tick = () => {
                const left = end - clock();
                if (left <= 0) res();
                else setTimeout(tick, paused ? 100 : Math.min(left, 100));
            };
            tick();
        });
        const playing = () => state === 'wait' || state === 'go' || state === 'result';
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const recKey = () => `${type}-${level}-${orderMode}`;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 700;
        function applyScale() {
            const full = container.classList.contains('wf-fullboard');
            // Plein écran + duel + liste chargée : les élèves s'affichent à gauche et à droite
            const sides = full && mode === 'duel' && CL.students.length > 0;
            container.classList.toggle('jpg-has-sides', sides);
            let reserve = 0;
            if (sides) {
                const cw = container.clientWidth;
                const sideW = Math.round(Math.max(150, Math.min(280, cw * 0.17)));
                const gap = 14;
                sideL.style.left = (40 + gap) + 'px'; sideL.style.width = sideW + 'px';
                sideR.style.right = gap + 'px';      sideR.style.width = sideW + 'px';
                container.style.setProperty('padding-left', (40 + sideW + 2 * gap) + 'px', 'important');
                container.style.setProperty('padding-right', (sideW + 2 * gap) + 'px', 'important');
                reserve = 2 * sideW + 3 * gap + 26;
                renderSides();
            } else {
                container.style.removeProperty('padding-left');
                container.style.removeProperty('padding-right');
            }
            const w = (container.clientWidth - reserve) || BASE_W;
            let sc = w / BASE_W;
            if (full) {
                container.style.setProperty('--jpg-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jpg-s', sc.toFixed(4));
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jpg-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bump) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 5);
            scoreEl.textContent = '⭐ ' + score;
            recordEl.textContent = '🏆 ' + (records[recKey()] || 0);
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
        }
        const orderHTML = (o) => o === 'big' ? 'Tape sur le <b>PLUS GRAND</b> !' : 'Tape sur le <b>PLUS PETIT</b> !';
        const orderHTMLshort = (o) => o === 'big' ? '⬆️ <b>PLUS GRAND</b>' : '⬇️ <b>PLUS PETIT</b>';

        // Construit l'arène selon le mode
        function buildArena() {
            arena.className = 'jpg-arena ' + mode;
            container.classList.toggle('duel', mode === 'duel');
            if (mode === 'solo') {
                arena.innerHTML = `
                    <div class="jpg-order big">${orderHTML(orderMode === 'small' ? 'small' : 'big')}</div>
                    <div class="jpg-pair" data-side="S">
                        <button class="jpg-num hidden" data-k="0">?</button>
                        <button class="jpg-num hidden" data-k="1">?</button>
                        <button class="jpg-num hidden" data-k="2">?</button>
                    </div>
                    <div class="jpg-timebar"><i></i></div>
                    <div class="jpg-ready"></div>
                    <div class="jpg-overlay"><div class="jpg-card"></div></div>`;
            } else {
                const half = (side, keys) => `
                    <div class="jpg-half ${side}" data-side="${side}">
                        <div class="jpg-phead">
                            <input class="jpg-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                            <div class="jpg-pscore">${pts[side]}</div>
                        </div>
                        <div class="jpg-order big">${orderHTMLshort(orderMode === 'small' ? 'small' : 'big')}</div>
                        <div class="jpg-pair" data-side="${side}">
                            <button class="jpg-num hidden" data-k="0">?</button>
                            <button class="jpg-num hidden" data-k="1">?</button>
                            <button class="jpg-num hidden" data-k="2">?</button>
                        </div>
                        <div class="jpg-pkeys">${keys}</div>
                    </div>`;
                arena.innerHTML = `
                    ${half('L', 'clavier : A / Z / E')}
                    <div class="jpg-mid"><small>Manche</small><b data-role="dround">0</b><small data-role="endtxt">${endTxt()}</small></div>
                    ${half('R', 'clavier : I / O / P')}
                    <div class="jpg-ready"></div>
                    <div class="jpg-pause"><div class="jpg-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
                    <div class="jpg-overlay"><div class="jpg-card"></div></div>`;
                arena.querySelector('.jpg-pause').addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (paused) togglePause();
                });
                arena.querySelectorAll('.jpg-pname').forEach(inp => {
                    const side = inp.closest('.jpg-half').dataset.side;
                    inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                    ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
                });
            }
            // Réponses : pointerdown (réactif et compatible multi-touch au TBI)
            arena.querySelectorAll('.jpg-num').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.jpg-pair').dataset.side;
                    answer(side, +b.dataset.k);
                });
            });
        }
        const numBtns = (side) => arena.querySelectorAll(`.jpg-pair[data-side="${side}"] .jpg-num`);
        const readyEl = () => arena.querySelector('.jpg-ready');
        const overlay = () => arena.querySelector('.jpg-overlay');

        function showHidden() {
            arena.querySelectorAll('.jpg-num').forEach(b => { b.className = 'jpg-num hidden'; b.innerHTML = '?'; b.dataset.k = b.dataset.k; });
        }
        // Affiche les 3 nombres (ordre mélangé indépendamment de chaque côté)
        function showPair() {
            const sides = mode === 'solo' ? ['S'] : ['L', 'R'];
            sides.forEach(side => {
                const perm = [0, 1, 2].sort(() => Math.random() - 0.5);
                const bs = numBtns(side);
                bs.forEach((b, i) => {
                    const idx = perm[i];
                    b.dataset.k = idx;
                    b.innerHTML = pair[idx].h;
                    b.className = 'jpg-num appear';
                });
            });
            arena.querySelectorAll('.jpg-order').forEach(o => {
                o.className = 'jpg-order pop ' + order;
                o.innerHTML = mode === 'solo' ? orderHTML(order) : orderHTMLshort(order);
            });
        }
        // Les nombres rangés selon la consigne : le premier est la bonne réponse
        const ranked = () => pair.map((p, i) => i).sort((a, b) => order === 'big' ? pair[b].v - pair[a].v : pair[a].v - pair[b].v);
        const correctIdx = () => ranked()[0];
        function explainTxt() {
            const r = ranked().map(i => pair[i]);
            const sign = order === 'big' ? ' &gt; ' : ' &lt; ';
            const val = (p) => p.res !== undefined ? `${p.h} = <b>${fmtInt(p.res)}</b>` : `<b>${p.h}</b>`;
            let t = r.map((p, i) => i === 0 ? val(p) : val(p).replace(/<\/?b>/g, '')).join(sign);
            if (type === 'frac') t += ` (≈ ${r.map(p => fmtDec(p.v, 2)).join(' ; ')})`;
            return t;
        }

        // ── Manche ─────────────────────────────────────────────────────────
        async function newRound() {
            const id = ++runId;
            state = 'wait';
            pair = gen3(type, level);
            order = orderMode === 'mix' ? (Math.random() < 0.5 ? 'big' : 'small') : orderMode;
            locked = { L: false, R: false };
            arena.querySelectorAll('.jpg-half').forEach(h => h.classList.remove('lock', 'win'));
            showHidden();
            const tb = arena.querySelector('.jpg-timebar');
            if (tb) { tb.classList.remove('low'); tb.firstElementChild.style.width = '100%'; }
            const r = readyEl();
            if (mode === 'duel') {
                duelRound++;
                const dr = arena.querySelector('[data-role="dround"]'); if (dr) dr.textContent = DS.end === 'count' ? `${duelRound}/${DS.count}` : duelRound;
            }
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(mode === 'duel' ? 700 + Math.random() * 900 : 350 + Math.random() * 450);
            if (id !== runId) return;
            r.classList.remove('show');
            showPair();
            sfx('go');
            state = 'go';
            t0 = clock();
            if (mode === 'solo') runTimer(id);
            else duelTimeout(id);
        }
        function runTimer(id) {
            const limit = JPG_LEVELS[level].time;
            const tb = arena.querySelector('.jpg-timebar');
            const step = () => {
                if (id !== runId || state !== 'go' || !widget.isConnected) return;
                const el = clock() - t0;
                const k = Math.max(0, 1 - el / limit);
                tb.firstElementChild.style.width = (k * 100) + '%';
                tb.classList.toggle('low', k < 0.3);
                if (k <= 0) { soloResult(null); return; }
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
        async function duelTimeout(id) {
            await pwait(JPG_LEVELS[level].time + 3000);
            if (id !== runId || state !== 'go') return;
            state = 'result';
            numBtns('L')[0] && [...numBtns('L'), ...numBtns('R')].forEach(b => { if (+b.dataset.k === correctIdx()) b.classList.add('hint'); });
            say(`⏱ Personne n'a répondu à temps ! ${explainTxt()}`);
            await pwait(1600);
            duelNext(id);
        }

        // ── Réponses ───────────────────────────────────────────────────────
        function answer(side, k) {
            if (state !== 'go' || paused) return;
            if (mode === 'solo') { if (side === 'S') soloResult(k); return; }
            if (locked[side]) return;
            duelAnswer(side, k);
        }
        async function soloResult(k) {
            const id = runId;
            state = 'result';
            const ms = clock() - t0;
            const ci = correctIdx();
            const bs = numBtns('S');
            round++;
            if (k === ci) {
                good++; streak++;
                const limit = JPG_LEVELS[level].time;
                const gain = 10 + Math.round(Math.max(0, 1 - ms / limit) * 10) + (streak >= 5 ? 3 : 0);
                score += gain; times.push(ms);
                bs.forEach(b => { if (+b.dataset.k === ci) b.classList.add('ok'); });
                sfx('good');
                say(`✅ ${rnd(['Bravo', 'Exact', 'Super', 'Rapide', 'Bien vu'])} ! ${(ms / 1000).toFixed(2).replace('.', ',')} s · +${gain}${streak >= 5 ? ' 🔥' : ''} &nbsp; <small>${explainTxt()}</small>`, 'good');
            } else {
                streak = 0;
                bs.forEach(b => {
                    if (+b.dataset.k === ci) b.classList.add('hint');
                    else if (k !== null && +b.dataset.k === k) b.classList.add('ko');
                });
                sfx('bad');
                say(`${k === null ? '⏱ Trop tard !' : '❌ Oups !'} ${explainTxt()} <small>${TYPES[type].tip}</small>`, 'bad');
            }
            updateStats(k === ci);
            await wait(k === ci ? 800 : 2000);
            if (id !== runId) return;
            if (round >= SOLO_ROUNDS) soloEnd();
            else newRound();
        }
        async function duelAnswer(side, k) {
            const id = runId;
            const ci = correctIdx();
            const other = side === 'L' ? 'R' : 'L';
            const bs = numBtns(side);
            if (k === ci) {
                state = 'result';
                pts[side]++;
                bs.forEach(b => { if (+b.dataset.k === ci) b.classList.add('ok'); });
                numBtns(other).forEach(b => { if (+b.dataset.k === ci) b.classList.add('hint'); });
                const half = arena.querySelector(`.jpg-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.jpg-pscore');
                sc.textContent = pts[side];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                sfx(side === 'L' ? 'pointL' : 'pointR');
                const ms = ((clock() - t0) / 1000).toFixed(2).replace('.', ',');
                const balle = DS.end === 'goal' && pts[side] === DS.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} Point pour <b>${esc(names[side])}</b> en ${ms} s ! ${explainTxt()}${balle}`, 'good');
                await pwait(1300);
                duelNext(id);
            } else {
                locked[side] = true;
                bs.forEach(b => { if (+b.dataset.k === k) b.classList.add('ko'); });
                arena.querySelector(`.jpg-half.${side}`).classList.add('lock');
                sfx('bad');
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour cette manche !`, 'bad');
                if (locked[other]) {
                    state = 'result';
                    [...numBtns('L'), ...numBtns('R')].forEach(b => { if (+b.dataset.k === ci) b.classList.add('hint'); });
                    say(`😅 Les deux joueurs se sont trompés ! ${explainTxt()}`, 'bad');
                    await pwait(1800);
                    duelNext(id);
                }
            }
        }
        function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

        // ── Fins de partie ─────────────────────────────────────────────────
        function soloEnd() {
            state = 'over';
            const st = good >= 19 ? 3 : good >= 15 ? 2 : good >= 10 ? 1 : 0;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : st === 1 ? '🥉' : '🎈';
            const title = st === 3 ? 'Œil de lynx !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) { /* stockage indisponible */ } }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.jpg-card').innerHTML = `
                <div class="jpg-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jpg-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${SOLO_ROUNDS} · ${score} points</p>
                <p class="jpg-sub">Temps moyen : ${avg} s${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <button class="jpg-btn jpg-btn-go" data-act="again">🔄 Rejouer</button>`;
            ov.classList.add('show');
            if (st >= 2 || isRec) { sfx('win'); party(); }
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
            say(`🏁 Partie terminée : ${good} sur ${SOLO_ROUNDS}, temps moyen ${avg} s.${isRec ? ' Nouveau record 🏆 !' : ''}`, st >= 2 ? 'good' : '');
            ov.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            updateButtons();
        }
        // Après chaque manche : fin du duel ou manche suivante
        function duelNext(id) {
            if (id !== runId) return;
            if (DS.end === 'goal' && (pts.L >= DS.goal || pts.R >= DS.goal)) duelEnd();
            else if (DS.end === 'count' && duelRound >= DS.count) duelEnd();
            else newRound();
        }
        function duelEnd() {
            resetPause();
            state = 'over';
            runId++;
            const ov = overlay();
            const tie = pts.L === pts.R;
            const side = pts.L > pts.R ? 'L' : 'R';
            const recorded = recordDuel();
            const finalHTML = `<div class="jpg-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>`;
            ov.querySelector('.jpg-card').innerHTML = `
                <div class="jpg-medal">${tie ? '🤝' : (side === 'L' ? '🔵' : '🟠') + '🏆'}</div>
                <h3>${tie ? 'Égalité parfaite !' : esc(names[side]) + ' gagne !'}</h3>
                ${finalHTML}
                <p class="jpg-sub">en ${duelRound} manche${duelRound > 1 ? 's' : ''}</p>
                ${recorded ? '<p class="jpg-rec">✔ Scores ajoutés dans la liste 📂</p>' : ''}
                ${hasClass() ? '<div class="jpg-actions"><button class="jpg-btn jpg-btn-go" data-act="next">🎲 Duel suivant</button></div>' : ''}`;
            ov.classList.add('show');
            sfx('win'); party();
            say(tie
                ? `🤝 Égalité ${pts.L} à ${pts.R} ! Bravo à tous les deux.`
                : `🏆 Victoire de <b>${esc(names[side])}</b> ${pts.L} à ${pts.R} ! Bravo !`, 'good');
            const nx = ov.querySelector('[data-act="next"]');
            if (nx) nx.addEventListener('click', (e) => { e.stopPropagation(); showDraw(true); });
            updateButtons();
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

        // ── Fin du duel : premier à N points / N manches ──────────────────
        const endTxt = () => DS.end === 'goal' ? `Premier à ${DS.goal}` : `En ${DS.count} manches`;
        function syncDuelSet() {
            endBtns.forEach(b => b.classList.toggle('active', b.dataset.end === DS.end));
            endN.textContent = DS.end === 'goal' ? DS.goal : DS.count;
            const n = DS.end === 'goal' ? DS.goal : DS.count;
            endLbl.textContent = DS.end === 'goal' ? (n > 1 ? 'points' : 'point') : 'manches';
            const et = arena.querySelector('[data-role="endtxt"]');
            if (et) et.textContent = endTxt();
        }
        function duelSetChanged() {
            saveDuel(DS); syncDuelSet();
            if (playing()) reset('⚙️ Réglage modifié : le duel est arrêté. Cliquez sur <b>▶ Jouer</b> pour relancer.');
        }
        endBtns.forEach(b => b.addEventListener('click', () => { DS.end = b.dataset.end; duelSetChanged(); }));
        container.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
            const d = +b.dataset.step;
            if (DS.end === 'goal') DS.goal = Math.max(1, Math.min(30, DS.goal + d));
            else DS.count = Math.max(3, Math.min(40, DS.count + d));
            duelSetChanged();
        }));
        syncDuelSet();

        // ── Pause (duel) ───────────────────────────────────────────────────
        function resetPause() {
            paused = false; pauseStart = 0; pausedTotal = 0;
            rolling = false;
            const p = arena.querySelector('.jpg-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            if (mode !== 'duel' || !playing()) return;
            const p = arena.querySelector('.jpg-pause');
            if (!paused) {
                paused = true; pauseStart = performance.now();
                if (p) p.classList.add('show');
                say('⏸ Duel en pause. Cliquez sur <b>▶ Reprendre</b> pour continuer.');
            } else {
                pausedTotal += performance.now() - pauseStart;
                paused = false;
                if (p) p.classList.remove('show');
                say(`▶ C'est reparti ! (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)})`);
            }
            updateButtons();
            container.focus({ preventScroll: true });
        }
        btn('pause').addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });

        // ── Élèves : liste, tirage au sort, scores ────────────────────────
        const hasClass = () => mode === 'duel' && CL.students.filter(st => !st.absent).length >= 2;
        const stById = (id) => CL.students.find(st => st.id === id);
        function shortName(st) {
            if (!st) return '';
            const n = st.nom ? ' ' + st.nom.charAt(0).toUpperCase() + '.' : '';
            return (st.prenom || st.nom) + n;
        }
        function renderClass() {
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            $('.jpg-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué` : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            clBtn('draw').disabled = !hasClass() || playing() || rolling;
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && mode === 'duel' && CL.students.length > 0;
            if (wantSides !== container.classList.contains('jpg-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="jpg-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['jpg-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (duo && duo.L === st.id) cls.push('cur-L');
                if (duo && duo.R === st.id) cls.push('cur-R');
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="jpg-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = st.absent ? 'absent' : (duo && (duo.L === st.id || duo.R === st.id)) ? 'au tableau' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="jpg-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="jpg-st-state">${stateTxt}</span>` : ''}
                    <span class="jpg-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('jpg-has-sides')) return;
            const rows = classList.querySelectorAll('.jpg-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.jpg-side-list'), sideR.querySelector('.jpg-side-list')];
            lists.forEach(l => { l.innerHTML = ''; });
            rows.forEach((r, i) => lists[i < half ? 0 : 1].appendChild(r.cloneNode(true)));
            const n = half || 1;
            const h = sideL.clientHeight || (container.clientHeight - 28);
            const fs = Math.max(10, Math.min(20, ((h - 50) / n - 3) * 0.52));
            [sideL, sideR].forEach(sd => {
                sd.querySelector('.jpg-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.jpg-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        function toggleAbsent(id) {
            const st = stById(id);
            if (!st) return;
            if (duo && (duo.L === st.id || duo.R === st.id) && (playing() || rolling)) return;
            st.absent = !st.absent;
            if (st.absent && duo && (duo.L === st.id || duo.R === st.id)) {
                duo = null;
                if (state === 'draw') showDraw(true);
            }
            saveClass(CL); renderClass();
        }
        classList.addEventListener('click', (e) => { const r = e.target.closest('.jpg-st'); if (r) toggleAbsent(r.dataset.id); });
        [sideL, sideR].forEach(sd => sd.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = e.target.closest('.jpg-st'); if (r) toggleAbsent(r.dataset.id);
        }));

        // Lecture du fichier (UTF-8, ou Windows-1252 pour les exports Excel)
        const readText = (file, enc) => new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result); r.onerror = () => rej(r.error);
            r.readAsText(file, enc);
        });
        classFile.addEventListener('change', async () => {
            const f = classFile.files && classFile.files[0];
            classFile.value = '';
            if (!f) return;
            let txt = '';
            try {
                txt = await readText(f, 'utf-8');
                if (txt.indexOf('\uFFFD') >= 0) txt = await readText(f, 'windows-1252');
            } catch (e) { say('⚠️ Impossible de lire ce fichier.', 'bad'); return; }
            const list = parseClassList(txt);
            if (list.length < 2) { say('⚠️ Il faut au moins 2 élèves dans le fichier (une ligne par élève : <b>prénom;nom</b>).', 'bad'); return; }
            if (CL.students.some(st => st.scores.length) && !confirm('Remplacer la liste actuelle ? Les scores enregistrés seront effacés.')) return;
            CL = { students: list, played: [] };
            duo = null;
            saveClass(CL); renderClass();
            classBox.classList.add('show');
            say(`✅ <b>${list.length} élèves</b> chargés ! Cliquez sur <b>🎲 Tirer au sort</b> ou <b>▶ Jouer</b>.`, 'good');
            if (state === 'draw') showDraw(true);
        });

        // Choix de 2 élèves : d'abord ceux qui n'ont pas encore joué dans le tour
        function pickDuo() {
            const present = CL.students.filter(st => !st.absent);
            let notice = '';
            let pool = present.filter(st => CL.played.indexOf(st.id) < 0);
            if (pool.length === 0) { CL.played = []; pool = present.slice(); notice = '🔁 Tout le monde a joué : nouveau tour !'; }
            shuffle(pool);
            let a = pool[0], b = pool[1];
            if (!b) {
                b = shuffle(present.filter(st => st.id !== a.id))[0];
                notice = `Dernier élève du tour : <b>${esc(shortName(b))}</b> est repêché pour l'affronter.`;
            }
            if (Math.random() < 0.5) [a, b] = [b, a];
            return { duo: { L: a.id, R: b.id }, notice };
        }
        function applyDuoNames() {
            if (!duo) return;
            names.L = shortName(stById(duo.L)) || 'Joueur bleu';
            names.R = shortName(stById(duo.R)) || 'Joueur orange';
        }
        function showDraw(roll) {
            if (!hasClass()) { reset(); return; }
            runId++;
            resetPause();
            state = 'draw';
            arena.className = 'jpg-arena draw';
            arena.innerHTML = `
                <div class="jpg-draw-title">🎲 Tirage au sort</div>
                <div class="jpg-draw-row">
                    <div class="jpg-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="jpg-draw-vs">VS</div>
                    <div class="jpg-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="jpg-draw-info"></div>
                <div class="jpg-actions"><button class="jpg-btn" data-dr="again">🎲 Nouveau tirage</button></div>`;
            arena.querySelector('[data-dr="again"]').addEventListener('click', () => { if (!rolling) { duo = null; showDraw(true); } });
            updateButtons();
            requestAnimationFrame(applyScale);
            if (roll || !duo || !stById(duo.L) || !stById(duo.R)) rollDraw();
            else finishDraw('');
        }
        function rollDraw() {
            const id = runId;
            const res = pickDuo();
            const present = CL.students.filter(st => !st.absent);
            const els = [...arena.querySelectorAll('.jpg-draw-card b')];
            rolling = true; duo = null;
            updateButtons();
            say('🎲 Tirage au sort en cours…');
            let n = 0;
            const total = 14;
            const step = () => {
                if (id !== runId) return;
                if (n < total) {
                    els.forEach(el => { el.classList.add('rolling'); el.textContent = shortName(rnd(present)); });
                    if (n % 2 === 0) sfx('tick');
                    n++;
                    setTimeout(step, 50 + n * n);     // ralentit progressivement
                    return;
                }
                duo = res.duo; rolling = false;
                finishDraw(res.notice);
            };
            step();
        }
        function finishDraw(notice) {
            applyDuoNames();
            const stL = stById(duo.L), stR = stById(duo.R);
            arena.querySelectorAll('.jpg-draw-card b').forEach(el => {
                const st = el.dataset.side === 'L' ? stL : stR;
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = shortName(st); el.title = fullName(st);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.jpg-draw-info');
            if (info) info.innerHTML = (notice ? notice + '<br>' : '') + `Déjà passés dans ce tour : ${played} / ${present.length}`;
            sfx('pointL');
            say(`🎲 <b>${esc(fullName(stL))}</b> 🔵 contre 🟠 <b>${esc(fullName(stR))}</b> ! Venez au tableau, puis <b>▶ Jouer</b>.`, 'good');
            updateButtons();
        }
        function recordDuel() {
            if (!duo) return false;
            const stL = stById(duo.L), stR = stById(duo.R);
            if (!stL || !stR) { duo = null; return false; }
            stL.scores.push({ pts: pts.L, opp: pts.R, adv: fullName(stR) });
            stR.scores.push({ pts: pts.R, opp: pts.L, adv: fullName(stL) });
            [stL.id, stR.id].forEach(id => { if (CL.played.indexOf(id) < 0) CL.played.push(id); });
            duo = null;
            saveClass(CL); renderClass();
            return true;
        }

        // Boutons du panneau
        classBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpBox.classList.remove('show');
            if (!CL.students.length) { classFile.click(); return; }
            renderClass();
            classBox.classList.toggle('show');
        });
        classBox.addEventListener('click', (e) => e.stopPropagation());
        clBtn('load').addEventListener('click', () => classFile.click());
        clBtn('draw').addEventListener('click', () => { classBox.classList.remove('show'); duo = null; showDraw(true); });
        clBtn('reset').addEventListener('click', () => {
            if (!confirm('Effacer tous les scores et recommencer le tour de tirage ?')) return;
            CL.students.forEach(st => { st.scores = []; });
            CL.played = [];
            saveClass(CL); renderClass();
            say('♻️ Scores remis à zéro : tout le monde peut de nouveau être tiré au sort.');
        });
        clBtn('clear').addEventListener('click', () => {
            if (!confirm('Retirer la liste d\'élèves et leurs scores ?')) return;
            CL = { students: [], played: [] };
            duo = null;
            names = { L: 'Joueur bleu', R: 'Joueur orange' };
            saveClass(CL); renderClass();
            if (state === 'draw') reset();
            say('🗑 Liste d\'élèves retirée.');
        });

        // ── Démarrer / arrêter ─────────────────────────────────────────────
        function updateButtons() {
            btn('start').textContent = playing() ? '🔄 Recommencer' : '▶ Jouer';
            btn('start').disabled = rolling;
            btn('stop').disabled = !playing();
            const pb = btn('pause');
            pb.hidden = !(mode === 'duel' && playing());
            pb.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
            pb.title = paused ? 'Reprendre le duel' : 'Mettre le duel en pause';
            pb.classList.toggle('on', paused);
            renderClass();
        }
        async function start() {
            if (rolling) return;
            // Duel avec une liste d'élèves : on passe d'abord par le tirage au sort
            if (hasClass() && (state === 'idle' || state === 'over' || !duo)) {
                if (state !== 'draw' || !duo) { showDraw(!duo); return; }
            }
            if (mode === 'duel') applyDuoNames();
            container.focus({ preventScroll: true });
            runId++;
            resetPause();
            round = 0; good = 0; score = 0; streak = 0; times = [];
            pts = { L: 0, R: 0 }; duelRound = 0;
            buildArena();
            updateStats(false);
            state = 'wait';
            updateButtons();
            const r = readyEl();
            const id = runId;
            for (const t of ['3', '2', '1']) {
                r.textContent = t; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
                sfx('tick');
                await pwait(550);
                if (id !== runId) return;
            }
            r.textContent = 'Partez !'; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
            say(mode === 'solo' ? `⚡ ${SOLO_ROUNDS} questions : sois rapide et précis !`
                : `⚡ ${DS.end === 'goal' ? `Premier à ${DS.goal} point${DS.goal > 1 ? 's' : ''} !` : `${DS.count} manches : le plus de points gagne !`} Attention : une erreur bloque ton côté pour la manche.`);
            await pwait(400);
            if (id !== runId) return;
            newRound();
        }
        function reset(message) {
            runId++;
            resetPause();
            state = 'idle';
            if (mode !== 'duel') classBox.classList.remove('show');
            buildArena();
            updateStats(false);
            updateButtons();
            say(message || (mode === 'solo'
                ? '⚖️ Clique sur <b>▶ Jouer</b> : trois nombres vont apparaître, tape vite sur le bon !'
                : hasClass()
                    ? '👥 Cliquez sur <b>▶ Jouer</b> : deux élèves de la liste 📂 seront tirés au sort.'
                    : '👥 Un joueur de chaque côté du tableau ! Écrivez vos noms puis cliquez sur <b>▶ Jouer</b>. (📂 pour charger une liste d\'élèves)'));
            requestAnimationFrame(applyScale);
        }
        btn('start').addEventListener('click', start);
        btn('stop').addEventListener('click', () => reset('⏹ Partie arrêtée.'));

        function setLevel(l) {
            level = +l || 1;
            lvlBtns.forEach(b => b.classList.toggle('active', +b.dataset.level === level));
            reset();
        }
        lvlBtns.forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
        modeBtns.forEach(b => b.addEventListener('click', () => {
            mode = b.dataset.mode;
            modeBtns.forEach(x => x.classList.toggle('active', x === b));
            reset();
        }));
        typeSel.addEventListener('change', () => { type = typeSel.value; reset(); });
        orderSel.addEventListener('change', () => { orderMode = orderSel.value; reset(); });
        [typeSel, orderSel].forEach(el => {
            el.addEventListener('pointerdown', (e) => e.stopPropagation());
            el.addEventListener('mousedown', (e) => e.stopPropagation());
        });

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT' || ae.tagName === 'INPUT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if ((k === 'enter' || k === ' ') && (state === 'idle' || state === 'draw' || (state === 'over' && mode === 'solo'))) { e.preventDefault(); start(); return; }
            if ((k === ' ' || k === 'escape') && mode === 'duel' && playing()) { e.preventDefault(); togglePause(); return; }
            const pick = (side, i) => { const b = numBtns(side)[i]; if (b) { e.preventDefault(); answer(side, +b.dataset.k); } };
            if (mode === 'solo') {
                if (k === 'arrowleft' || k === '1' || k === '&') pick('S', 0);
                else if (k === 'arrowdown' || k === '2' || k === 'é') pick('S', 1);
                else if (k === 'arrowright' || k === '3' || k === '"') pick('S', 2);
            } else {
                if (k === 'a') pick('L', 0);
                else if (k === 'z') pick('L', 1);
                else if (k === 'e') pick('L', 2);
                else if (k === 'i') pick('R', 0);
                else if (k === 'o') pick('R', 1);
                else if (k === 'p') pick('R', 2);
            }
        };
        document.addEventListener('keydown', onKey);

        soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundOn = !soundOn;
            soundBtn.textContent = soundOn ? '🔊' : '🔇';
            soundBtn.title = soundOn ? 'Couper le son' : 'Activer le son';
        });
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpBox.classList.toggle('show'); classBox.classList.remove('show'); });
        const closeHelp = () => {
            if (!widget.isConnected) { document.removeEventListener('click', closeHelp); return; }
            helpBox.classList.remove('show');
            classBox.classList.remove('show');
        };
        document.addEventListener('click', closeHelp);

        // ── Boutons fenêtre ────────────────────────────────────────────────
        const wfMin = $('[data-role="wf-min"]'), wfMax = $('[data-role="wf-max"]'), wfClose = $('[data-role="wf-close"]');
        let _isMax = false, _savedW = null, _savedH = null;
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            if (state !== 'idle' && state !== 'over') reset('⏹ Partie arrêtée.');
            classBox.classList.remove('show');
            window._wfMiniBarCollapse(widget, '⚖️ Plus grand / plus petit', { onExpand: applyScale });
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
        container.querySelectorAll('.jpg-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .jpg-arena, .jpg-rh, .jpg-help, .jpg-class, .jpg-side')) {
                e.stopPropagation();
                if (!e.target.closest('select, input')) container.focus({ preventScroll: true });
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
            if (type === 'jeu-plus-grand') return window.createJeuPlusGrandWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-plus-grand') return window.createJeuPlusGrandWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
