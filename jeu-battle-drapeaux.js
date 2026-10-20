// =========================================================================
// JEU « BATTLE DRAPEAUX » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Battles » — mode jeu élèves
//
// Un drapeau apparaît : taper le plus vite possible sur le bon nom de pays
// parmi 3. Sens inverse : un nom de pays apparaît, taper sur le bon drapeau.
// Consigne au choix : drapeau → pays, pays → drapeau, ou mélangé.
//   👤 Seul    : 20 questions chronométrées, points selon la rapidité, record.
//   👥 À deux  : écran partagé pour le TBI (un joueur de chaque côté, multi-
//               touch). Une erreur bloque son côté (ou, au choix, donne le
//               point à l'adversaire). Victoire au choix :
//               premier à N points, ou le plus de points en N manches.
//               Liste de classe (bouton 📂, fichier .txt « prénom;nom »),
//               tirage au sort, mode 🏆 Tournoi (comme Battle comparaison).
// Zones : monde entier, Europe, Afrique, Amériques, Asie et Océanie.
// 3 niveaux : facile (pays très connus), moyen (pays voisins),
//             difficile (drapeaux qui se ressemblent).
// Images des drapeaux : flagcdn.com (sans connexion : émojis drapeaux).
//
// Fichier : jeu-battle-drapeaux.js (construit sur jeu-battle-comparaison.js)
// Ouverture : createWidget('battle-drapeaux')
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


    // ── CSS du jeu (préfixe jbd-) ──────────────────────────────────────────
    if (!document.getElementById('widget-battle-drapeaux-style')) {
        const s = document.createElement('style');
        s.id = 'widget-battle-drapeaux-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-drapeaux"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .jbd-container {
            --jbd-s: 1;
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
            padding: calc(12px * var(--jbd-s)) calc(14px * var(--jbd-s)) calc(14px * var(--jbd-s));
            border-radius: calc(24px * var(--jbd-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--jbd-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .jbd-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .jbd-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--jbd-s));
            width: 100%; max-width: calc(672px * var(--jbd-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .jbd-header { display: flex; align-items: center; gap: calc(10px * var(--jbd-s)); cursor: move; flex-wrap: wrap; }
        .jbd-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--jbd-s));
            color: var(--or);
            letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--jbd-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;   /* pousse les statistiques et les boutons à droite */
        }
        .jbd-stats { display: flex; gap: calc(6px * var(--jbd-s)); align-items: center; }
        .jbd-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--jbd-s)) calc(10px * var(--jbd-s));
            font-weight: 900; font-size: calc(14px * var(--jbd-s));
            white-space: nowrap;
        }
        .jbd-chip.hot { background: #FF7A1A; }
        @keyframes jbd-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .jbd-chip.bump { animation: jbd-bump .4s ease; }
        .jbd-container.duel .jbd-stats { display: none; }
        .jbd-icon-btn {
            width: calc(26px * var(--jbd-s)); height: calc(26px * var(--jbd-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--jbd-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .jbd-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Réglages ── */
        .jbd-bar { display: flex; align-items: center; gap: calc(6px * var(--jbd-s)); flex-wrap: wrap; }
        .jbd-seg { display: inline-flex; background: rgba(255,255,255,0.08); border-radius: 999px; padding: 2px; }
        .jbd-seg button, .jbd-lvl {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jbd-s));
            padding: calc(5px * var(--jbd-s)) calc(11px * var(--jbd-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: transparent; color: #fff; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jbd-seg button { border-color: transparent; }
        .jbd-seg button.active { background: #fff; color: var(--encre); }
        .jbd-lvl:hover { background: rgba(255,255,255,0.1); }
        .jbd-lvl:active { transform: scale(0.95); }
        .jbd-lvl.active { background: var(--or); color: var(--encre); border-color: var(--or); }
        .jbd-select {
            font-family: inherit; font-weight: 800; font-size: calc(13px * var(--jbd-s));
            padding: calc(4px * var(--jbd-s)) calc(8px * var(--jbd-s));
            border-radius: 999px; border: 2px solid rgba(255,255,255,0.25);
            background: #3B2F63; color: #fff; cursor: pointer;
        }

        /* ── Arène ── */
        .jbd-arena {
            position: relative;
            height: calc(330px * var(--jbd-s));
            border-radius: calc(18px * var(--jbd-s));
            overflow: hidden;
            flex-shrink: 0;
        }
        .jbd-arena.solo {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jbd-s)), transparent calc(2px * var(--jbd-s))) 0 0 / calc(24px * var(--jbd-s)) calc(24px * var(--jbd-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(18px * var(--jbd-s));
        }
        .jbd-arena.duel { display: grid; grid-template-columns: 1fr calc(54px * var(--jbd-s)) 1fr; grid-template-rows: auto 1fr; height: calc(400px * var(--jbd-s)); }

        .jbd-order {
            color: #fff; font-weight: 900; font-size: calc(20px * var(--jbd-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(6px * var(--jbd-s)) calc(18px * var(--jbd-s));
            text-align: center; white-space: nowrap;
        }
        .jbd-order b { font-family: 'Lilita One', sans-serif; font-weight: 400; letter-spacing: 0.5px; }
        .jbd-order.big b { color: #7CFFB2; }
        .jbd-order.small b { color: #FFB3D0; }
        @keyframes jbd-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .jbd-order.pop { animation: jbd-pop .3s ease-out; }

        .jbd-pair { display: flex; align-items: center; justify-content: center; gap: calc(14px * var(--jbd-s)); }
        .jbd-vs { color: rgba(255,255,255,0.7); font-family: 'Lilita One', sans-serif; font-size: calc(22px * var(--jbd-s)); }
        .jbd-num {
            min-width: calc(180px * var(--jbd-s)); height: calc(120px * var(--jbd-s));
            padding: 0 calc(14px * var(--jbd-s));
            border: none; border-radius: calc(22px * var(--jbd-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(44px * var(--jbd-s)); line-height: 1;
            box-shadow: 0 calc(8px * var(--jbd-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .jbd-num:hover { background: #FFF3C4; }
        .jbd-num:active { transform: translateY(calc(5px * var(--jbd-s))); box-shadow: 0 calc(3px * var(--jbd-s)) 0 #B9B2D6; }
        .jbd-num.hidden { color: #D9D2EE; }
        .jbd-num.ok  { background: var(--vert); color: #fff; box-shadow: 0 calc(8px * var(--jbd-s)) 0 #1C8A4F; }
        .jbd-num.ko  { background: var(--rouge); color: #fff; box-shadow: 0 calc(8px * var(--jbd-s)) 0 #B32B38; }
        .jbd-num.hint { box-shadow: 0 0 0 calc(5px * var(--jbd-s)) var(--vert), 0 calc(8px * var(--jbd-s)) 0 #B9B2D6; }
        @keyframes jbd-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .jbd-num.ko { animation: jbd-shake .4s ease; }
        .jbd-num.appear { animation: jbd-pop .25s ease-out; }
        .jbd-frac { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; font-size: 0.8em; }
        .jbd-frac span:first-child { border-bottom: calc(4px * var(--jbd-s)) solid currentColor; padding: 0 0.12em 0.06em; }
        .jbd-frac span:last-child { padding-top: 0.06em; }
        .jbd-num small { font-size: 0.72em; }

        .jbd-timewrap {
            display: flex !important; align-items: center; gap: calc(10px * var(--jbd-s));
            width: 70%; visibility: visible !important; opacity: 1 !important;
        }
        .jbd-timebar {
            flex: 1; display: block !important; position: relative;
            height: calc(16px * var(--jbd-s)) !important; min-height: 8px;
            background: rgba(0,0,0,0.35); border-radius: 999px; overflow: hidden;
            box-shadow: inset 0 0 0 2px rgba(255,255,255,0.25);
        }
        .jbd-timebar .jbd-timefill {
            position: absolute; left: 0; top: 0; bottom: 0;
            display: block !important; width: 100%;
            background: var(--or); border-radius: 999px; transition: background .2s;
        }
        .jbd-timebar.low .jbd-timefill { background: var(--rouge); }
        .jbd-timesec {
            min-width: calc(40px * var(--jbd-s)); text-align: right;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(20px * var(--jbd-s));
            color: #fff; line-height: 1; font-variant-numeric: tabular-nums;
            text-shadow: 0 calc(2px * var(--jbd-s)) 0 rgba(0,0,0,0.3);
        }
        .jbd-timewrap.low .jbd-timesec { color: #FFB3BA; }
        @keyframes jbd-blink { 50% { opacity: 0.45; } }
        .jbd-timewrap.low .jbd-timebar { animation: jbd-blink .5s ease-in-out infinite; }
        /* Duel : une seule barre commune, en haut (comme la Battle de calculs) */
        .jbd-duelbar {
            grid-column: 1 / -1;
            display: flex; align-items: center; justify-content: center;
            padding: calc(9px * var(--jbd-s)) calc(12px * var(--jbd-s));
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jbd-s)), transparent calc(2px * var(--jbd-s))) 0 0 / calc(24px * var(--jbd-s)) calc(24px * var(--jbd-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
        }

        /* Duel */
        .jbd-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--jbd-s));
            padding: calc(10px * var(--jbd-s));
            transition: background .2s;
        }
        .jbd-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); border-radius: 0 0 0 calc(18px * var(--jbd-s)); }
        .jbd-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); border-radius: 0 0 calc(18px * var(--jbd-s)) 0; }
        .jbd-half.win { box-shadow: inset 0 0 0 calc(6px * var(--jbd-s)) #7CFFB2; }
        .jbd-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--jbd-s));
            background: rgba(42,31,74,0.45); border-radius: inherit;
        }
        .jbd-half .jbd-order { font-size: calc(15px * var(--jbd-s)); padding: calc(4px * var(--jbd-s)) calc(12px * var(--jbd-s)); }
        .jbd-half .jbd-pair { flex-direction: column; gap: calc(9px * var(--jbd-s)); width: 100%; }
        .jbd-half .jbd-num { min-width: 0; width: 86%; height: calc(62px * var(--jbd-s)); font-size: calc(32px * var(--jbd-s)); box-shadow: 0 calc(6px * var(--jbd-s)) 0 #B9B2D6; }
        .jbd-phead { display: flex; align-items: center; gap: calc(8px * var(--jbd-s)); }
        .jbd-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jbd-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--jbd-s)) 0 rgba(0,0,0,0.25);
        }
        .jbd-pscore.bump { animation: jbd-bump .4s ease; }
        .jbd-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jbd-s));
            width: calc(150px * var(--jbd-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--jbd-s)) calc(8px * var(--jbd-s));
            user-select: text;
        }
        .jbd-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .jbd-pkeys { color: rgba(255,255,255,0.7); font-weight: 800; font-size: calc(11px * var(--jbd-s)); }
        .jbd-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--jbd-s)); color: #fff;
        }
        .jbd-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--jbd-s)); color: var(--or); }
        .jbd-mid small { font-size: calc(10px * var(--jbd-s)); font-weight: 900; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .jbd-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(46px * var(--jbd-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--jbd-s)) 0 rgba(0,0,0,0.3);
        }
        .jbd-ready.show { display: flex; animation: jbd-pop .3s ease-out; }

        /* ── Actions ── */
        .jbd-actions { display: flex; gap: calc(8px * var(--jbd-s)); justify-content: center; flex-wrap: wrap; }
        .jbd-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--jbd-s));
            padding: calc(8px * var(--jbd-s)) calc(14px * var(--jbd-s));
            border-radius: calc(14px * var(--jbd-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--jbd-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .jbd-btn:hover { filter: brightness(1.05); }
        .jbd-btn:active { transform: translateY(calc(4px * var(--jbd-s))); box-shadow: 0 calc(1px * var(--jbd-s)) 0 #B9B2D6; }
        .jbd-btn:disabled { opacity: 0.45; cursor: default; }
        .jbd-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--jbd-s));
            padding: calc(8px * var(--jbd-s)) calc(22px * var(--jbd-s));
            box-shadow: 0 calc(5px * var(--jbd-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .jbd-btn-go:active { box-shadow: 0 calc(1px * var(--jbd-s)) 0 #1C8A4F; }
        .jbd-btn:focus-visible, .jbd-lvl:focus-visible, .jbd-select:focus-visible, .jbd-num:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .jbd-talk { display: flex; align-items: center; gap: calc(10px * var(--jbd-s)); }
        .jbd-chef {
            width: calc(44px * var(--jbd-s)); height: calc(44px * var(--jbd-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--jbd-s));
            box-shadow: 0 calc(3px * var(--jbd-s)) 0 #B3840B;
        }
        @keyframes jbd-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--jbd-s))) rotate(-8deg); } }
        .jbd-chef.hop { animation: jbd-hop .4s ease; }
        .jbd-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--jbd-s));
            padding: calc(8px * var(--jbd-s)) calc(12px * var(--jbd-s));
            font-weight: 700; font-size: calc(15px * var(--jbd-s)); line-height: 1.35;
            min-height: calc(22px * var(--jbd-s));
            border-left: calc(6px * var(--jbd-s)) solid var(--or);
        }
        .jbd-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .jbd-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .jbd-msg b { font-weight: 900; }
        .jbd-msg .jbd-frac { font-size: 0.85em; vertical-align: middle; }
        .jbd-msg .jbd-frac span:first-child { border-bottom-width: 2px; }

        /* ── Fin de partie ── */
        .jbd-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.45);
        }
        .jbd-overlay.show { display: flex; }
        .jbd-card {
            background: #fff; border-radius: calc(18px * var(--jbd-s));
            padding: calc(12px * var(--jbd-s)) calc(22px * var(--jbd-s)) calc(14px * var(--jbd-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jbd-s)) 0 #B9B2D6;
            animation: jbd-pop .35s ease-out;
            max-width: 90%;
        }
        .jbd-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(24px * var(--jbd-s)); color: var(--encre); }
        .jbd-card p { margin: calc(4px * var(--jbd-s)) 0 calc(8px * var(--jbd-s)); font-weight: 800; font-size: calc(14px * var(--jbd-s)); }
        .jbd-card .jbd-sub { font-size: calc(12px * var(--jbd-s)); color: #6A5E8E; margin-top: calc(-4px * var(--jbd-s)); }
        .jbd-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--jbd-s)); margin: calc(4px * var(--jbd-s)) 0; }
        .jbd-bigstars span { font-size: calc(34px * var(--jbd-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .jbd-bigstars span.on { opacity: 1; filter: none; animation: jbd-pop .35s ease-out both; }
        .jbd-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .jbd-bigstars span.on:nth-child(3) { animation-delay: .4s; }
        .jbd-medal { font-size: calc(56px * var(--jbd-s)); line-height: 1; animation: jbd-pop .5s ease-out; }

        /* ── Réglages du duel ── */
        .jbd-duelset { display: none; align-items: center; gap: calc(6px * var(--jbd-s)); }
        .jbd-container.duel .jbd-duelset { display: inline-flex; }
        .jbd-step {
            display: inline-flex; align-items: center; background: #fff; border-radius: 999px; overflow: hidden;
            box-shadow: 0 calc(3px * var(--jbd-s)) 0 #B9B2D6;
        }
        .jbd-step button {
            border: none; background: transparent; color: #5B3FB0; cursor: pointer;
            font-family: inherit; font-weight: 900; font-size: calc(15px * var(--jbd-s));
            width: calc(26px * var(--jbd-s)); height: calc(26px * var(--jbd-s));
        }
        .jbd-step button:hover { background: #EFEAFB; }
        .jbd-step span {
            min-width: calc(26px * var(--jbd-s)); text-align: center; color: var(--encre);
            font-family: 'Lilita One', sans-serif; font-size: calc(16px * var(--jbd-s));
        }
        .jbd-endlbl { color: #fff; font-weight: 800; font-size: calc(13px * var(--jbd-s)); }
        .jbd-container:not(.duel) [data-role="class"] { display: none; }
        .jbd-icon-btn.on { background: var(--or); color: var(--encre); }
        .jbd-btn[hidden] { display: none; }
        .jbd-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--jbd-s)) 0 #B3840B; }

        /* ── Pause ── */
        .jbd-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: #2A1F4A; cursor: pointer; border-radius: inherit;
        }
        .jbd-pause.show { display: flex; animation: jbd-pop .25s ease-out; }
        .jbd-pause-card {
            text-align: center; color: #fff; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--jbd-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--jbd-s)) 0 rgba(0,0,0,0.35);
        }
        .jbd-pause-card small {
            display: block; margin-top: calc(8px * var(--jbd-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--jbd-s)); opacity: 0.8; text-shadow: none;
        }

        /* ── Fin du duel ── */
        .jbd-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--jbd-s)); margin: calc(2px * var(--jbd-s)) 0; }
        .jbd-final > span { display: inline-block; vertical-align: top; }
        .jbd-final .L { color: #1F6FB5; } .jbd-final .R { color: #E0620F; }
        .jbd-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--jbd-s)); }
        .jbd-card .jbd-rec { font-size: calc(12px * var(--jbd-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--jbd-s)); }
        .jbd-card .jbd-actions { margin-top: calc(4px * var(--jbd-s)); }

        /* ── Panneau élèves ── */
        .jbd-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .jbd-class.show { display: flex; }
        .jbd-class-head { display: flex; align-items: baseline; gap: 8px; }
        .jbd-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .jbd-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .jbd-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .jbd-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px; background: #EFEAFB; color: var(--encre);
        }
        .jbd-class-tools button:hover { background: #E1D8F8; }
        .jbd-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .jbd-class-tools button.go { background: var(--or); }
        .jbd-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .jbd-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .jbd-st { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 9px; background: #F7F4FE; }
        .jbd-st:hover { background: #EFEAFB; }
        .jbd-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .jbd-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .jbd-st.played .jbd-st-name::before { content: '✔ '; color: var(--vert); }
        .jbd-st.absent { opacity: 0.45; }
        .jbd-st.absent .jbd-st-name { text-decoration: line-through; }
        .jbd-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .jbd-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .jbd-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .jbd-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff; background: #8C82AE;
        }
        .jbd-sc.win { background: var(--vert); }
        .jbd-sc.lose { background: var(--rouge); }
        .jbd-sc.tie { background: #E0A800; }
        .jbd-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .jbd-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .jbd-container.jbd-has-sides .jbd-side { display: flex; }
        .jbd-side-title { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); text-align: center; line-height: 1.1; margin-bottom: 2px; }
        .jbd-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; }
        .jbd-side .jbd-st { background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em; border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0; }
        .jbd-side .jbd-st:hover { background: rgba(255,255,255,0.18); }
        .jbd-side .jbd-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .jbd-side .jbd-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .jbd-side .jbd-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .jbd-side .jbd-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .jbd-side .jbd-st.played .jbd-st-name::before { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .jbd-arena.draw {
            height: calc(370px * var(--jbd-s));
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jbd-s)), transparent calc(2px * var(--jbd-s))) 0 0 / calc(24px * var(--jbd-s)) calc(24px * var(--jbd-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--jbd-s)); color: #fff; padding: calc(16px * var(--jbd-s)); box-sizing: border-box;
        }
        .jbd-draw-title { font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--jbd-s)); color: var(--or); text-shadow: 0 calc(3px * var(--jbd-s)) 0 #B3470F; }
        .jbd-draw-row { display: flex; align-items: center; gap: calc(14px * var(--jbd-s)); width: 100%; justify-content: center; }
        .jbd-draw-card {
            flex: 1; max-width: calc(270px * var(--jbd-s)); min-width: 0;
            border-radius: calc(20px * var(--jbd-s)); padding: calc(14px * var(--jbd-s)) calc(10px * var(--jbd-s));
            text-align: center; box-shadow: 0 calc(6px * var(--jbd-s)) 0 rgba(0,0,0,0.3);
        }
        .jbd-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .jbd-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .jbd-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--jbd-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .jbd-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(32px * var(--jbd-s)); line-height: 1.1; margin-top: calc(4px * var(--jbd-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--jbd-s)) 0 rgba(0,0,0,0.25);
        }
        .jbd-draw-card b.rolling { opacity: 0.75; }
        .jbd-draw-card b.done { animation: jbd-pop .35s ease-out; }
        .jbd-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--jbd-s)); color: var(--or); text-shadow: 0 calc(3px * var(--jbd-s)) 0 #B3470F; }
        .jbd-draw-info { font-weight: 800; font-size: calc(13px * var(--jbd-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }

        /* ── Tournoi ── */
        .jbd-arena.tour {
            height: auto; min-height: calc(370px * var(--jbd-s));
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jbd-s)), transparent calc(2px * var(--jbd-s))) 0 0 / calc(24px * var(--jbd-s)) calc(24px * var(--jbd-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            gap: calc(10px * var(--jbd-s)); color: #fff; padding: calc(14px * var(--jbd-s)); box-sizing: border-box;
        }
        .jbd-tour-tabs { display: flex; flex-wrap: wrap; gap: calc(5px * var(--jbd-s)); justify-content: center; }
        .jbd-tour-tab {
            font-family: inherit; font-weight: 900; font-size: calc(12px * var(--jbd-s)); cursor: pointer;
            padding: calc(4px * var(--jbd-s)) calc(11px * var(--jbd-s)); border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); color: #fff;
        }
        .jbd-tour-tab.done { border-color: rgba(124,255,178,0.6); }
        .jbd-tour-tab.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .jbd-tour-sub { font-weight: 800; font-size: calc(13px * var(--jbd-s)); color: rgba(255,255,255,0.85); }
        .jbd-champ {
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--jbd-s));
            background: var(--or); color: var(--encre); border-radius: 999px;
            padding: calc(6px * var(--jbd-s)) calc(20px * var(--jbd-s));
            box-shadow: 0 calc(4px * var(--jbd-s)) 0 #B3840B; animation: jbd-pop .4s ease-out; text-align: center;
        }
        .jbd-champ b { font-weight: 400; }
        .jbd-matches {
            display: grid; grid-template-columns: 1fr; gap: calc(6px * var(--jbd-s));
            width: 100%; max-width: calc(520px * var(--jbd-s));
            max-height: calc(250px * var(--jbd-s)); overflow-y: auto; padding: 2px;
        }
        .jbd-matches.two { grid-template-columns: 1fr 1fr; max-width: none; }
        .jbd-match {
            display: grid; grid-template-columns: auto 1fr auto 1fr; align-items: center;
            gap: calc(6px * var(--jbd-s)); min-width: 0;
            background: rgba(255,255,255,0.10); border-radius: calc(12px * var(--jbd-s));
            padding: calc(5px * var(--jbd-s)) calc(8px * var(--jbd-s));
            font-weight: 900; font-size: calc(14px * var(--jbd-s));
        }
        .jbd-match.cur { background: #fff; color: var(--encre); box-shadow: 0 0 0 calc(3px * var(--jbd-s)) var(--or); animation: jbd-pop .3s ease-out; }
        .jbd-match.todo { opacity: 0.7; }
        .jbd-match.barrage { box-shadow: inset 0 0 0 2px rgba(255,201,51,0.7); }
        .jbd-match.barrage.cur { box-shadow: 0 0 0 calc(3px * var(--jbd-s)) var(--or); }
        .jbd-mn-b { background: var(--or); }
        .jbd-mp-wait { font-style: italic; font-weight: 800; opacity: 0.7; font-size: 0.85em; }
        .jbd-mn {
            min-width: calc(20px * var(--jbd-s)); height: calc(20px * var(--jbd-s)); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.25); color: #fff; font-size: calc(11px * var(--jbd-s));
        }
        .jbd-mp { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .jbd-mp.L { text-align: right; } .jbd-mp.R { text-align: left; }
        .jbd-match.cur .jbd-mp.L { color: #1F6FB5; } .jbd-match.cur .jbd-mp.R { color: #E0620F; }
        .jbd-mp.win { color: #7CFFB2; }
        .jbd-mp.win::after { content: ' ✔'; }
        .jbd-mp.lose { opacity: 0.5; text-decoration: line-through; }
        .jbd-ms { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(15px * var(--jbd-s)); color: var(--or); white-space: nowrap; text-align: center; }
        .jbd-match.cur .jbd-ms { color: #5B3FB0; }
        .jbd-st.t-out { opacity: 0.45; }
        .jbd-st.t-out .jbd-st-name { text-decoration: line-through; }
        .jbd-st.t-champ { background: var(--or) !important; color: var(--encre) !important; }
        .jbd-st.t-qualif .jbd-st-state { color: var(--vert); }
        .jbd-side .jbd-st.t-qualif .jbd-st-state { color: #7CFFB2; }

        /* ══ ÉCRAN DE RÉGLAGES (comme la Battle de calculs) ══ */
        .jbd-arena.setup {
            height: auto; min-height: calc(370px * var(--jbd-s));
            box-sizing: border-box;
            padding: calc(10px * var(--jbd-s)) calc(14px * var(--jbd-s)) calc(14px * var(--jbd-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--jbd-s));
            color: #fff;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--jbd-s)), transparent calc(2px * var(--jbd-s))) 0 0 / calc(24px * var(--jbd-s)) calc(24px * var(--jbd-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
        }
        .jbd-label {
            font-size: calc(13px * var(--jbd-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--jbd-s));
        }
        .jbd-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--jbd-s)); justify-content: center; }
        .jbd-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--jbd-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(80px * var(--jbd-s)); height: calc(52px * var(--jbd-s)); padding: 0 calc(8px * var(--jbd-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--jbd-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .jbd-chips-types { flex-wrap: nowrap; gap: calc(5px * var(--jbd-s)); }
        .jbd-chips-types .jbd-type {
            flex: 1 1 auto; min-width: 0; padding: 0 calc(5px * var(--jbd-s));
            font-size: calc(11px * var(--jbd-s)); white-space: nowrap;
        }
        .jbd-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--jbd-s)); }
        .jbd-type:hover, .jbd-small:hover { background: rgba(255,255,255,0.14); }
        .jbd-type:active, .jbd-small:active { transform: scale(0.95); }
        .jbd-small {
            min-width: calc(40px * var(--jbd-s)); height: calc(38px * var(--jbd-s)); padding: 0 calc(14px * var(--jbd-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--jbd-s));
            display: flex; align-items: center; justify-content: center; white-space: nowrap;
        }
        .jbd-type.on, .jbd-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .jbd-setup-row { display: flex; gap: calc(22px * var(--jbd-s)); justify-content: center; flex-wrap: wrap; }
        .jbd-sub { display: none; }
        .jbd-sub.visible { display: block; }
        .jbd-hide { display: none !important; }
        .jbd-params { display: flex; gap: calc(20px * var(--jbd-s)); justify-content: center; align-items: flex-end; flex-wrap: wrap; margin-top: calc(6px * var(--jbd-s)); }
        .jbd-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .jbd-spinner-label { font-size: calc(11px * var(--jbd-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .jbd-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--jbd-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--jbd-s)) 0 #B9B2D6;
        }
        .jbd-spinner-btn {
            width: calc(34px * var(--jbd-s)); height: calc(42px * var(--jbd-s)); border: none; background: transparent;
            font-size: calc(20px * var(--jbd-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .jbd-spinner-btn:hover { background: #F1EDFB; }
        .jbd-spinner-val {
            width: calc(56px * var(--jbd-s)); height: calc(42px * var(--jbd-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--jbd-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .jbd-spinner-val::-webkit-inner-spin-button,
        .jbd-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .jbd-info {
            text-align: center; font-weight: 800; font-size: calc(13px * var(--jbd-s));
            color: rgba(255,255,255,0.88); margin-top: calc(8px * var(--jbd-s));
        }
        .jbd-info b { color: var(--or); font-weight: 900; }
        .jbd-type:focus-visible, .jbd-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Aide ── */
        .jbd-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 350px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .jbd-help.show { display: block; }
        .jbd-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .jbd-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .jbd-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .jbd-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: jbd-fall 1.8s ease-in forwards; }
        @keyframes jbd-fall { to { transform: translateY(700px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .jbd-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .jbd-container:hover .jbd-rh { opacity: 1; }
        .jbd-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .jbd-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .jbd-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .jbd-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .jbd-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .jbd-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .jbd-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .jbd-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        /* ── Drapeaux ── */
        .jbd-flag {
            display: block; max-width: 100%; max-height: 100%; height: auto;
            object-fit: contain; pointer-events: none; user-select: none;
            border-radius: calc(4px * var(--jbd-s));
            box-shadow: 0 0 0 1px rgba(0,0,0,0.18);
        }
        .jbd-flag-emo { font-family: 'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif; font-size: 1.6em; line-height: 1; }
        .jbd-q {
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.25); border-radius: calc(16px * var(--jbd-s));
            padding: calc(8px * var(--jbd-s)) calc(16px * var(--jbd-s));
            color: #fff; text-align: center; box-sizing: border-box; max-width: 96%;
        }
        .jbd-q.pop { animation: jbd-pop .3s ease-out; }
        .jbd-q.flag { height: calc(118px * var(--jbd-s)); background: rgba(255,255,255,0.92); padding: calc(8px * var(--jbd-s)); }
        .jbd-q.flag .jbd-flag { height: 100%; width: auto; }
        .jbd-q.flag .jbd-flag-emo { font-size: calc(80px * var(--jbd-s)); }
        .jbd-q.name {
            min-height: calc(64px * var(--jbd-s));
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(34px * var(--jbd-s)); line-height: 1.1; color: #FFE27A;
            text-shadow: 0 calc(3px * var(--jbd-s)) 0 rgba(0,0,0,0.3);
        }
        .jbd-q.wait { opacity: 0.5; font-size: calc(30px * var(--jbd-s)); color: #fff; }
        .jbd-num.txt {
            font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(22px * var(--jbd-s));
            white-space: normal; line-height: 1.1; text-align: center; padding: 0 calc(10px * var(--jbd-s));
            width: calc(195px * var(--jbd-s)); min-width: 0;
        }
        .jbd-num.txt.long { font-size: calc(18px * var(--jbd-s)); }
        .jbd-num.img { padding: calc(10px * var(--jbd-s)); width: calc(195px * var(--jbd-s)); min-width: 0; }
        .jbd-num.img .jbd-flag { height: 100%; width: auto; }
        .jbd-num.ok .jbd-flag, .jbd-num.ko .jbd-flag { box-shadow: 0 0 0 2px #fff; }
        .jbd-arena.solo .jbd-pair { gap: calc(12px * var(--jbd-s)); }
        .jbd-arena.solo { gap: calc(14px * var(--jbd-s)); height: calc(360px * var(--jbd-s)); }
        .jbd-arena.duel { height: calc(470px * var(--jbd-s)); }
        .jbd-half .jbd-q.flag { height: calc(74px * var(--jbd-s)); padding: calc(5px * var(--jbd-s)); }
        .jbd-half .jbd-q.flag .jbd-flag-emo { font-size: calc(50px * var(--jbd-s)); }
        .jbd-half .jbd-q.name { min-height: calc(50px * var(--jbd-s)); font-size: calc(22px * var(--jbd-s)); padding: calc(4px * var(--jbd-s)) calc(10px * var(--jbd-s)); }
        .jbd-half .jbd-num.txt { width: 86%; font-size: calc(19px * var(--jbd-s)); }
        .jbd-half .jbd-num.txt.long { font-size: calc(15px * var(--jbd-s)); }
        .jbd-half .jbd-num.img { width: 86%; height: calc(70px * var(--jbd-s)); padding: calc(6px * var(--jbd-s)); }
        .jbd-msg .jbd-flag { display: inline-block; height: 1.3em; width: auto; vertical-align: middle; margin: 0 0.2em; }
        .jbd-hintflag { font-size: calc(13px * var(--jbd-s)); }

        @media (prefers-reduced-motion: reduce) {
            .jbd-container *, .jbd-container *::before, .jbd-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // PAYS ET DRAPEAUX
    // c : code ISO (image du drapeau), n : nom en français,
    // z : zone (eu, af, am, as, oc), l : 1 = très connu, 2 = connu, 3 = plus rare
    // Les images viennent de flagcdn.com (connexion internet nécessaire) ;
    // sans connexion, l'émoji drapeau est affiché à la place.
    // =========================================================================
    const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const COUNTRIES = [
        // Europe
        ['fr','France','eu',1], ['de','Allemagne','eu',1], ['it','Italie','eu',1], ['es','Espagne','eu',1],
        ['gb','Royaume-Uni','eu',1], ['be','Belgique','eu',1], ['ch','Suisse','eu',1], ['pt','Portugal','eu',1],
        ['gr','Grèce','eu',1], ['se','Suède','eu',1], ['nl','Pays-Bas','eu',2], ['lu','Luxembourg','eu',2],
        ['ie','Irlande','eu',2], ['at','Autriche','eu',2], ['pl','Pologne','eu',2], ['no','Norvège','eu',2],
        ['dk','Danemark','eu',2], ['fi','Finlande','eu',2], ['ru','Russie','eu',2], ['ua','Ukraine','eu',2],
        ['hr','Croatie','eu',2], ['is','Islande','eu',3], ['ro','Roumanie','eu',3], ['bg','Bulgarie','eu',3],
        ['hu','Hongrie','eu',3], ['cz','Tchéquie','eu',3], ['sk','Slovaquie','eu',3], ['si','Slovénie','eu',3],
        ['rs','Serbie','eu',3], ['mc','Monaco','eu',3], ['ad','Andorre','eu',3], ['md','Moldavie','eu',3],
        ['ee','Estonie','eu',3], ['lv','Lettonie','eu',3], ['lt','Lituanie','eu',3], ['mt','Malte','eu',3],
        ['al','Albanie','eu',3], ['cy','Chypre','eu',3],
        // Afrique
        ['ma','Maroc','af',1], ['eg','Égypte','af',1], ['za','Afrique du Sud','af',1], ['dz','Algérie','af',2],
        ['tn','Tunisie','af',2], ['sn','Sénégal','af',2], ['ci','Côte d\'Ivoire','af',2], ['cm','Cameroun','af',2],
        ['ng','Nigeria','af',2], ['ke','Kenya','af',2], ['mg','Madagascar','af',2], ['ml','Mali','af',3],
        ['gn','Guinée','af',3], ['td','Tchad','af',3], ['et','Éthiopie','af',3], ['gh','Ghana','af',3],
        ['cd','RD Congo','af',3], ['cg','Congo','af',3], ['ne','Niger','af',3], ['bf','Burkina Faso','af',3],
        ['tz','Tanzanie','af',3], ['ly','Libye','af',3], ['ga','Gabon','af',3], ['bj','Bénin','af',3],
        ['rw','Rwanda','af',3], ['lr','Liberia','af',3],
        // Amériques
        ['us','États-Unis','am',1], ['ca','Canada','am',1], ['mx','Mexique','am',1], ['br','Brésil','am',1],
        ['ar','Argentine','am',1], ['cl','Chili','am',2], ['co','Colombie','am',2], ['pe','Pérou','am',2],
        ['cu','Cuba','am',2], ['jm','Jamaïque','am',2], ['ve','Venezuela','am',3], ['ec','Équateur','am',3],
        ['uy','Uruguay','am',3], ['py','Paraguay','am',3], ['bo','Bolivie','am',3], ['ht','Haïti','am',3],
        ['gt','Guatemala','am',3], ['hn','Honduras','am',3], ['sv','Salvador','am',3], ['ni','Nicaragua','am',3],
        ['cr','Costa Rica','am',3], ['pa','Panama','am',3], ['do','Rép. dominicaine','am',3],
        // Asie
        ['cn','Chine','as',1], ['jp','Japon','as',1], ['in','Inde','as',1], ['kr','Corée du Sud','as',1],
        ['tr','Turquie','as',2], ['vn','Viêt Nam','as',2], ['th','Thaïlande','as',2], ['id','Indonésie','as',2],
        ['ph','Philippines','as',2], ['pk','Pakistan','as',2], ['np','Népal','as',2], ['sa','Arabie saoudite','as',2],
        ['ir','Iran','as',2], ['il','Israël','as',2], ['lb','Liban','as',2], ['kp','Corée du Nord','as',3],
        ['my','Malaisie','as',3], ['sg','Singapour','as',3], ['bd','Bangladesh','as',3], ['iq','Irak','as',3],
        ['sy','Syrie','as',3], ['ye','Yémen','as',3], ['ae','Émirats arabes unis','as',3], ['qa','Qatar','as',3],
        ['bh','Bahreïn','as',3], ['mn','Mongolie','as',3], ['kz','Kazakhstan','as',3], ['af','Afghanistan','as',3],
        ['lk','Sri Lanka','as',3], ['tj','Tadjikistan','as',3],
        // Océanie
        ['au','Australie','oc',1], ['nz','Nouvelle-Zélande','oc',2], ['fj','Fidji','oc',3],
        ['pg','Papouasie-Nouvelle-Guinée','oc',3], ['to','Tonga','oc',3],
    ].map(([c, n, z, l]) => ({ c, n, z, l }));
    const BY_CODE = {};
    COUNTRIES.forEach(p => { BY_CODE[p.c] = p; });

    // Drapeaux qui se ressemblent : utilisés comme pièges au niveau difficile
    const LOOKALIKE = [
        ['td', 'ad', 'md', 'be'], ['ro', 'ad', 'md'], ['id', 'pl', 'sg'], ['mc', 'pl', 'sg'],
        ['ie', 'ci', 'it', 'mx', 'ne', 'in'], ['nl', 'lu', 'py', 'hr', 'fr', 'ru'],
        ['ru', 'si', 'sk', 'rs'], ['au', 'nz', 'fj', 'gb'], ['no', 'is', 'dk', 'se', 'fi'],
        ['be', 'de', 'ug'], ['co', 'ec', 've'], ['ml', 'sn', 'gn', 'cm', 'bj'],
        ['at', 'lv', 'lb', 'pe', 'ca'], ['ar', 'uy', 'sv', 'ni', 'hn', 'gt'], ['jp', 'bd', 'kr'],
        ['us', 'lr', 'my', 'cu'], ['cn', 'vn', 'ma'], ['qa', 'bh'], ['ye', 'eg', 'sy', 'iq'],
        ['tr', 'tn', 'dz', 'pk'], ['ch', 'dk', 'to'], ['hu', 'bg', 'it', 'ir', 'tj'],
        ['ee', 'fi', 'bw'], ['et', 'gh', 'bf', 'bo', 'ml'], ['cd', 'cg', 'tz'], ['ae', 'ly', 'sd', 'jo'],
    ];
    // Drapeaux presque identiques : jamais proposés ensemble (ce serait injouable)
    const TWINS = [['td', 'ro'], ['id', 'mc']];
    const twins = (a, b) => TWINS.some(t => t.indexOf(a) >= 0 && t.indexOf(b) >= 0);

    // Petites astuces pour les drapeaux qui se ressemblent
    const TIPS = {
        ie: 'Irlande : <b>vert</b> près du mât. Côte d\'Ivoire : <b>orange</b> près du mât.',
        ci: 'Côte d\'Ivoire : <b>orange</b> près du mât. Irlande : <b>vert</b> près du mât.',
        it: 'Italie : vert, blanc, rouge. Le Mexique a les mêmes couleurs, avec un aigle au centre.',
        mx: 'Mexique : vert, blanc, rouge avec un <b>aigle</b> au centre.',
        nl: 'Pays-Bas : rouge, blanc, <b>bleu foncé</b>. Luxembourg : rouge, blanc, <b>bleu ciel</b>.',
        lu: 'Luxembourg : rouge, blanc, <b>bleu ciel</b>. Pays-Bas : bleu plus foncé.',
        be: 'Belgique : bandes <b>verticales</b> noir, jaune, rouge. Allemagne : bandes <b>horizontales</b>.',
        de: 'Allemagne : bandes <b>horizontales</b> noir, rouge, or. Belgique : bandes verticales.',
        pl: 'Pologne : <b>blanc en haut</b>, rouge en bas. Indonésie et Monaco : rouge en haut.',
        id: 'Indonésie : <b>rouge en haut</b>, blanc en bas (l\'inverse de la Pologne).',
        mc: 'Monaco : <b>rouge en haut</b>, blanc en bas (l\'inverse de la Pologne).',
        fr: 'France : bandes <b>verticales</b> bleu, blanc, rouge (le bleu près du mât).',
        ru: 'Russie : bandes <b>horizontales</b> blanc, bleu, rouge.',
        au: 'Australie : étoiles <b>blanches</b>. Nouvelle-Zélande : étoiles <b>rouges</b>.',
        nz: 'Nouvelle-Zélande : 4 étoiles <b>rouges</b>. Australie : étoiles blanches.',
        se: 'Suède : croix <b>jaune</b> sur fond bleu.',
        dk: 'Danemark : croix <b>blanche</b> sur fond rouge.',
        no: 'Norvège : croix bleue bordée de blanc sur fond rouge.',
        fi: 'Finlande : croix <b>bleue</b> sur fond blanc.',
        ch: 'Suisse : drapeau <b>carré</b>, croix blanche sur fond rouge.',
        jp: 'Japon : disque <b>rouge</b> sur fond blanc. Bangladesh : disque rouge sur fond vert.',
        bd: 'Bangladesh : disque rouge sur fond <b>vert</b>.',
        co: 'Colombie : la bande <b>jaune</b> prend la moitié du drapeau.',
        ml: 'Mali : vert, jaune, rouge, <b>sans étoile</b>. Sénégal : avec une étoile verte.',
        sn: 'Sénégal : vert, jaune, rouge avec une <b>étoile verte</b>.',
        cm: 'Cameroun : vert, rouge, jaune avec une <b>étoile jaune</b>.',
        gn: 'Guinée : rouge, jaune, vert (le <b>rouge</b> près du mât).',
        at: 'Autriche : rouge, blanc, rouge, en bandes horizontales.',
        cn: 'Chine : une grande étoile jaune et 4 petites. Viêt Nam : une seule étoile.',
        vn: 'Viêt Nam : une seule grande étoile jaune sur fond rouge.',
        us: 'États-Unis : 50 étoiles et 13 bandes rouges et blanches.',
        tr: 'Turquie : croissant et étoile <b>blancs</b> sur fond rouge.',
        ca: 'Canada : une <b>feuille d\'érable</b> rouge au centre.',
        lb: 'Liban : un <b>cèdre</b> vert au centre.',
        br: 'Brésil : un losange jaune et un globe bleu.',
        ar: 'Argentine : bleu ciel et blanc avec un soleil.',
        gb: 'Royaume-Uni : l\'« Union Jack », croix rouges et blanches sur fond bleu.',
    };

    // Zones (remplacent les « types de nombres »)
    const TYPES = {
        monde: { label: 'Monde entier', zones: null },
        eu:    { label: 'Europe', zones: ['eu'] },
        af:    { label: 'Afrique', zones: ['af'] },
        am:    { label: 'Amériques', zones: ['am'] },
        as:    { label: 'Asie et Océanie', zones: ['as', 'oc'] },
    };
    // Pays jouables selon la zone et le niveau (on élargit si la liste est trop courte)
    function poolFor(t, l) {
        const zs = TYPES[t].zones;
        const inZone = COUNTRIES.filter(p => !zs || zs.indexOf(p.z) >= 0);
        let pool = inZone.filter(p => p.l <= l);
        if (pool.length < 8) pool = inZone.filter(p => p.l <= Math.min(3, l + 1));
        if (pool.length < 8) pool = inZone;
        return pool;
    }
    // Évite de reposer trop vite le même pays
    let _recent = [];
    // Un pays à trouver + 2 autres pays. Renvoie [bonne réponse, intrus, intrus]
    function gen3(t, l) {
        const pool = poolFor(t, l);
        const fresh = pool.filter(p => _recent.indexOf(p.c) < 0);
        const ans = rnd(fresh.length ? fresh : pool);
        _recent.push(ans.c);
        if (_recent.length > Math.min(12, Math.floor(pool.length / 2))) _recent.shift();
        const ok = (p, chosen) => chosen.every(q => q.c !== p.c && !twins(q.c, p.c));
        const out = [ans];
        const add = (cands) => {
            shuffle(cands.slice()).forEach(p => { if (out.length < 3 && ok(p, out)) out.push(p); });
        };
        if (l === 3) {
            // Pièges : drapeaux qui ressemblent à la bonne réponse (même hors zone)
            const look = [];
            LOOKALIKE.forEach(g => { if (g.indexOf(ans.c) >= 0) g.forEach(c => { if (BY_CODE[c]) look.push(BY_CODE[c]); }); });
            add(look);
        }
        if (l >= 2) {
            // Moyen : des pays de la même zone géographique
            add(pool.filter(p => p.z === ans.z));
        }
        add(pool);
        add(COUNTRIES);
        return out;
    }
    // Image d'un drapeau (alt vide : le nom du pays ne doit pas apparaître)
    const FLAG_URL = (c) => `https://flagcdn.com/w320/${c}.png`;
    const flagEmoji = (c) => c.toUpperCase().replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
    const flagImg = (c) => `<img class="jbd-flag" src="${FLAG_URL(c)}" alt="" draggable="false" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'jbd-flag-emo',textContent:'${flagEmoji(c)}'}))">`;
    const _flagCache = {};
    // Précharge les drapeaux ; renvoie une promesse résolue quand ils sont prêts (ou au bout de 1,5 s)
    function preloadFlags(codes) {
        const ps = codes.map(c => new Promise(res => {
            if (_flagCache[c] && _flagCache[c].complete) return res();
            const im = _flagCache[c] || new Image();
            _flagCache[c] = im;
            im.onload = im.onerror = () => res();
            if (!im.src) im.src = FLAG_URL(c);
        }));
        return Promise.race([Promise.all(ps), new Promise(r => setTimeout(r, 1500))]);
    }
    const JBD_LEVELS = {
        1: { time: 6000, label: 'pays très connus' },
        2: { time: 4500, label: 'pays voisins' },
        3: { time: 3500, label: 'drapeaux qui se ressemblent' },
    };
    const SOLO_ROUNDS = 20;
    const DUEL_KEY = 'battle-drapeaux-duel';       // fin du duel (points / manches)
    const CLASS_KEY = 'battle-drapeaux-classe';    // liste d'élèves + scores
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    function loadDuel() {
        const d = { end: 'goal', goal: 10, count: 10, org: 'free', err: 'lock' };
        try { Object.assign(d, JSON.parse(localStorage.getItem(DUEL_KEY) || '{}')); } catch (e) {}
        if (d.end !== 'count') d.end = 'goal';
        if (d.org !== 'tour') d.org = 'free';      // free = duels tirés au sort · tour = tournoi
        if (d.err !== 'gift') d.err = 'lock';      // erreur : lock = côté bloqué · gift = point à l'adversaire
        d.goal = Math.max(1, Math.min(30, d.goal | 0 || 10));
        d.count = Math.max(3, Math.min(40, d.count | 0 || 10));
        return d;
    }
    function saveDuel(d) { try { localStorage.setItem(DUEL_KEY, JSON.stringify(d)); } catch (e) {} }

    // Réglages mémorisés : nombre de joueurs, niveau, nombres, consigne
    const SETTINGS_KEY = 'battle-drapeaux-settings';
    function loadSettings() {
        const d = { mode: 'solo', level: 1, type: 'monde', orderMode: 'flag', speed: 6 };
        try { Object.assign(d, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch (e) {}
        if (d.mode !== 'duel') d.mode = 'solo';
        d.level = [1, 2, 3].indexOf(+d.level) >= 0 ? +d.level : 1;
        if (!TYPES[d.type]) d.type = 'monde';
        if (['flag', 'name', 'mix'].indexOf(d.orderMode) < 0) d.orderMode = 'flag';
        d.speed = Math.max(2, Math.min(30, d.speed | 0 || 6));
        return d;
    }

    // Liste d'élèves (fichier .txt « prénom;nom »)
    // { students: [{ id, prenom, nom, absent, scores: [{ pts, opp, adv }] }], played: [id…] }
    function loadClass() {
        try {
            const c = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
            if (c && Array.isArray(c.students)) {
                c.played = Array.isArray(c.played) ? c.played : [];
                c.students.forEach(st => { if (!Array.isArray(st.scores)) st.scores = []; });
                // Tournoi en cours : { rounds: [{ players, matches: [{ L, R, w, sL, sR, barrage, wait }] }], champion, barr }
                if (!c.tour || !Array.isArray(c.tour.rounds) || !c.tour.rounds.length || !Array.isArray(c.tour.barr)) c.tour = null;
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
    const RECORD_KEY = 'battle-drapeaux-records';
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // ── Sons ───────────────────────────────────────────────────────────────
    let _jbdAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_jbdAudio) _jbdAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _jbdAudio, t0 = ctx.currentTime + start;
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
    window.createBattleDrapeauxWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'battle-drapeaux';
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
        container.className = 'jbd-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="jbd-inner">
            <div class="jbd-header">
                <span class="jbd-title">Battle drapeaux</span>
                <div class="jbd-stats">
                    <span class="jbd-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="jbd-chip" data-role="record" title="Record (sur cet ordinateur)">🏆 0</span>
                    <span class="jbd-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="jbd-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="jbd-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="jbd-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="jbd-arena"></div>

            <div class="jbd-talk">
                <div class="jbd-chef">🌍</div>
                <div class="jbd-msg"></div>
            </div>

            <div class="jbd-actions">
                <button class="jbd-btn jbd-btn-go" data-act="start">▶ Jouer</button>
                <button class="jbd-btn" data-act="setup">⚙️ Réglages</button>
                <button class="jbd-btn jbd-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="jbd-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="jbd-help">
                <h4>🌍 Comment jouer ?</h4>
                <p>⚙️ <b>Réglages</b> : choisissez le nombre de joueurs, la zone du monde, le niveau et la consigne, puis <b>▶ Jouer</b> (ou <b>▶ Lancer le duel</b> à deux).</p>
                <p>🏳️ → 🔤 <b>Drapeau → pays</b> : un drapeau apparaît, tape <b>le plus vite possible</b> sur le bon nom de pays.</p>
                <p>🔤 → 🏳️ <b>Pays → drapeau</b> : un nom de pays apparaît, tape sur le bon drapeau. 🔀 <b>Mélangé</b> : les deux à la suite.</p>
                <p>👤 <b>Seul</b> : 20 questions, chacune avec un temps limité. Plus tu es rapide, plus tu gagnes de points ! Le temps se règle dans ⚙️ Réglages (secondes par question).</p>
                <p>👥 <b>À deux</b> (au TBI) : un joueur de chaque côté de l'écran. Le premier qui tape la bonne réponse marque le point. Si tu te trompes, au choix dans ⚙️ Réglages : ton côté est <b>bloqué 🔒</b> pour cette manche, ou <b>le point va à ton adversaire 🎁</b>. Victoire : <b>premier à N points</b> ou <b>le plus de points en N manches</b>.</p>
                <p>🏆 <b>Tournoi</b> (à deux, avec une liste 📂) : seuls les <b>gagnants</b> passent au tour suivant, jusqu'à la <b>finale</b>. Nombre impair : <b>match de barrage</b>. Égalité : <b>manche décisive</b>.</p>
                <p>⏸ <b>Pause</b> possible pendant la partie (ou touche Espace / Échap).</p>
                <p>📂 À deux, chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel.</p>
                <p>Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
                <p style="margin:0">😊 <b>Facile</b> : pays très connus. 😐 <b>Moyen</b> : pays voisins. 😤 <b>Difficile</b> : drapeaux qui se ressemblent (Irlande / Côte d'Ivoire, Pays-Bas / Luxembourg…). Les drapeaux s'affichent avec une connexion internet.</p>
            </div>
            <div class="jbd-side jbd-side-L"><div class="jbd-side-title">📂 Élèves</div><div class="jbd-side-list"></div></div>
            <div class="jbd-side jbd-side-R"><div class="jbd-side-title">📂 Élèves</div><div class="jbd-side-list"></div></div>
            <div class="jbd-class">
                <div class="jbd-class-head"><h4>📂 Élèves</h4><span class="jbd-class-count"></span></div>
                <div class="jbd-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="jbd-class-list"></div>
                <p class="jbd-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="jbd-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="jbd-confetti"></div>
            <div class="jbd-rh jbd-rh-nw" data-dir="nw"></div>
            <div class="jbd-rh jbd-rh-n"  data-dir="n"></div>
            <div class="jbd-rh jbd-rh-ne" data-dir="ne"></div>
            <div class="jbd-rh jbd-rh-e"  data-dir="e"></div>
            <div class="jbd-rh jbd-rh-se" data-dir="se"></div>
            <div class="jbd-rh jbd-rh-s"  data-dir="s"></div>
            <div class="jbd-rh jbd-rh-sw" data-dir="sw"></div>
            <div class="jbd-rh jbd-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.jbd-inner');
        const arena    = $('.jbd-arena');
        const msg      = $('.jbd-msg');
        const chef     = $('.jbd-chef');
        const streakEl = $('[data-role="streak"]');
        const recordEl = $('[data-role="record"]');
        const scoreEl  = $('[data-role="score"]');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.jbd-help');
        const confetti = $('.jbd-confetti');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const classBtn  = $('[data-role="class"]');
        const classBox  = $('.jbd-class');
        const classList = $('.jbd-class-list');
        const classFile = $('.jbd-class-file');
        const clBtn = (a) => classBox.querySelector(`[data-cl="${a}"]`);
        const sideL = $('.jbd-side-L'), sideR = $('.jbd-side-R');

        // ── État ───────────────────────────────────────────────────────────
        const ST0 = loadSettings();   // réglages mémorisés
        let mode = ST0.mode, level = ST0.level, type = ST0.type, orderMode = ST0.orderMode;
        let speed = ST0.speed;          // secondes par question
        const qTime = () => speed * 1000;
        let state = 'setup';         // setup | draw | wait | go | result | over
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
            container.classList.toggle('jbd-has-sides', sides);
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
                container.style.setProperty('--jbd-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--jbd-s', sc.toFixed(4));
        }

        // ── Affichages ─────────────────────────────────────────────────────
        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'jbd-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }
        function updateStats(bump) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 5);
            scoreEl.textContent = '⭐ ' + score;
            recordEl.textContent = '🏆 ' + (records[recKey()] || 0);
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
        }
        // Question affichée : le drapeau (order = 'flag') ou le nom du pays (order = 'name')
        const qHTML = (o) => o === 'flag' ? flagImg(pair[0].c) : esc(pair[0].n);
        const qWait = () => '<div class="jbd-q wait">?</div>';
        const ansHTML = (p, o) => o === 'flag' ? esc(p.n) : flagImg(p.c);
        const ansCls = (p, o) => o === 'flag' ? 'jbd-num txt' + (p.n.length > 14 ? ' long' : '') : 'jbd-num img';
        const consTxt = (o) => o === 'flag' ? 'Quel est ce pays ?' : 'Quel est son drapeau ?';

        // Construit l'arène selon le mode
        function buildArena() {
            arena.className = 'jbd-arena ' + mode;
            container.classList.toggle('duel', mode === 'duel');
            if (mode === 'solo') {
                arena.innerHTML = `
                    <div class="jbd-order big">🌍 <b>${orderMode === 'name' ? consTxt('name') : orderMode === 'flag' ? consTxt('flag') : 'Drapeau ou pays ?'}</b></div>
                    <div class="jbd-qslot">${qWait()}</div>
                    <div class="jbd-pair" data-side="S">
                        <button class="jbd-num hidden" data-k="0">?</button>
                        <button class="jbd-num hidden" data-k="1">?</button>
                        <button class="jbd-num hidden" data-k="2">?</button>
                    </div>
                    <div class="jbd-timewrap"><div class="jbd-timebar"><div class="jbd-timefill"></div></div><span class="jbd-timesec"></span></div>
                    <div class="jbd-ready"></div>
                    <div class="jbd-pause"><div class="jbd-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
                    <div class="jbd-overlay"><div class="jbd-card"></div></div>`;
            } else {
                const half = (side, keys) => `
                    <div class="jbd-half ${side}" data-side="${side}">
                        <div class="jbd-phead">
                            <input class="jbd-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                            <div class="jbd-pscore">${pts[side]}</div>
                        </div>
                        <div class="jbd-qslot">${qWait()}</div>
                        <div class="jbd-pair" data-side="${side}">
                            <button class="jbd-num hidden" data-k="0">?</button>
                            <button class="jbd-num hidden" data-k="1">?</button>
                            <button class="jbd-num hidden" data-k="2">?</button>
                        </div>
                        <div class="jbd-pkeys">${keys}</div>
                    </div>`;
                arena.innerHTML = `
                    <div class="jbd-duelbar"><div class="jbd-timewrap"><div class="jbd-timebar"><div class="jbd-timefill"></div></div><span class="jbd-timesec"></span></div></div>
                    ${half('L', 'clavier : A / Z / E')}
                    <div class="jbd-mid"><small>Manche</small><b data-role="dround">0</b><small data-role="endtxt">${endTxt()}</small></div>
                    ${half('R', 'clavier : I / O / P')}
                    <div class="jbd-ready"></div>
                    <div class="jbd-pause"><div class="jbd-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
                    <div class="jbd-overlay"><div class="jbd-card"></div></div>`;
                arena.querySelectorAll('.jbd-pname').forEach(inp => {
                    const side = inp.closest('.jbd-half').dataset.side;
                    inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                    ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
                });
            }
            arena.querySelector('.jbd-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // Réponses : pointerdown (réactif et compatible multi-touch au TBI)
            arena.querySelectorAll('.jbd-num').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.jbd-pair').dataset.side;
                    answer(side, +b.dataset.k);
                });
            });
        }
        // =====================================================================
        // ÉCRAN DE RÉGLAGES (au lancement, comme la Battle de calculs)
        // =====================================================================
        const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode, level, type, orderMode, speed })); } catch (e) {} };
        const TYPE_ICO = { monde: '🌐', eu: '🇪🇺', af: '🌍', am: '🌎', as: '🌏' };
        const TYPE_LBL = { monde: 'Monde entier', eu: 'Europe', af: 'Afrique', am: 'Amériques', as: 'Asie, Océanie' };
        function setupMsg() {
            if (mode === 'solo') return '🌍 Choisis la zone, le niveau et la consigne, puis clique sur <b>▶ Jouer</b> !';
            if (DS.org === 'tour') {
                if (CL.tour && !CL.tour.champion) return '🏆 Un tournoi est en cours : cliquez sur <b>▶ Reprendre le tournoi</b> pour voir le prochain match.';
                return hasClass()
                    ? '🏆 Tournoi : les élèves présents de la liste 📂 sont répartis en matchs. Seuls les gagnants passent au tour suivant, jusqu\'à la <b>finale</b> ! Cliquez sur <b>▶ Lancer le tournoi</b>.'
                    : '🏆 Pour un tournoi, chargez d\'abord une liste d\'élèves avec le bouton <b>📂</b> (au moins 2 élèves présents).';
            }
            return hasClass()
                ? '👥 Choisissez les réglages, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.'
                : '👥 Choisissez les réglages, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
        }
        // Valeurs des compteurs : secondes par question (réglages) ou fin du duel (DS)
        const getVal = (key) => key === 'speed' ? speed : DS[key];
        const setVal = (key, v) => {
            if (key === 'speed') { speed = v; saveSettings(); }
            else { DS[key] = v; saveDuel(DS); }
        };
        function buildSetup() {
            arena.className = 'jbd-arena setup';
            container.classList.toggle('duel', mode === 'duel');
            const spinner = (label, key, min, max) => `
                <div class="jbd-spinner">
                    <div class="jbd-spinner-label">${label}</div>
                    <div class="jbd-spinner-inner">
                        <button class="jbd-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="jbd-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${getVal(key)}">
                        <button class="jbd-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            const types = Object.keys(TYPES).map(k =>
                `<button class="jbd-type" data-type="${k}" title="${TYPES[k].label}"><span class="jbd-type-ico jbd-flag-emo" style="font-size:1.25em">${TYPE_ICO[k] || '?'}</span>${TYPE_LBL[k] || TYPES[k].label}</button>`).join('');
            arena.innerHTML = `
                <div class="jbd-label">Nombre de joueurs</div>
                <div class="jbd-chips">
                    <button class="jbd-small" data-mode="solo">👤 Seul</button>
                    <button class="jbd-small" data-mode="duel">👥 À deux (duel au tableau)</button>
                    <button class="jbd-small" data-mode="tour" title="Élimination directe avec la liste d'élèves 📂 : seuls les gagnants passent au tour suivant">🏆 Tournoi</button>
                </div>
                <div class="jbd-label">Quels pays ?</div>
                <div class="jbd-chips jbd-chips-types">${types}</div>
                <div class="jbd-setup-row">
                    <div>
                        <div class="jbd-label">Niveau</div>
                        <div class="jbd-chips">
                            <button class="jbd-small" data-level="1" title="Pays très connus">😊 Facile</button>
                            <button class="jbd-small" data-level="2" title="Plus de pays, et des pays voisins proposés ensemble">😐 Moyen</button>
                            <button class="jbd-small" data-level="3" title="Tous les pays, avec des drapeaux qui se ressemblent">😤 Difficile</button>
                        </div>
                    </div>
                    <div>
                        <div class="jbd-label">Consigne</div>
                        <div class="jbd-chips">
                            <button class="jbd-small" data-order="flag" title="Un drapeau apparaît : trouver le nom du pays">🏳️ → Pays</button>
                            <button class="jbd-small" data-order="name" title="Un nom de pays apparaît : trouver son drapeau">Pays → 🏳️</button>
                            <button class="jbd-small" data-order="mix">🔀 Mélangé</button>
                        </div>
                    </div>
                </div>
                <div class="jbd-sub" data-sub="duel">
                    <div class="jbd-label">Qui gagne le duel ?</div>
                    <div class="jbd-chips">
                        <button class="jbd-small" data-end="count" title="Le duel s'arrête après un nombre fixe de manches">🔢 Le plus de points en N manches</button>
                        <button class="jbd-small" data-end="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                    </div>
                    <div class="jbd-label">En cas de mauvaise réponse</div>
                    <div class="jbd-chips">
                        <button class="jbd-small" data-err="lock" title="Le joueur qui se trompe ne peut plus répondre pendant cette manche ; l'autre peut encore marquer">🔒 Son côté est bloqué</button>
                        <button class="jbd-small" data-err="gift" title="Une mauvaise réponse donne immédiatement le point à l'adversaire">🎁 Le point va à l'adversaire</button>
                    </div>
                </div>
                <div class="jbd-params">
                    ${spinner('Secondes<br>par question', 'speed', 2, 30)}
                    <div data-endbox="count">${spinner('Nombre<br>de manches', 'count', 3, 40)}</div>
                    <div data-endbox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="jbd-info"></div>`;

            const q = (sel) => arena.querySelectorAll(sel);
            const sync = () => {
                const shown = mode === 'solo' ? 'solo' : DS.org === 'tour' ? 'tour' : 'duel';
                q('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === shown));
                q('[data-type]').forEach(b => b.classList.toggle('on', b.dataset.type === type));
                q('[data-level]').forEach(b => b.classList.toggle('on', +b.dataset.level === level));
                q('[data-order]').forEach(b => b.classList.toggle('on', b.dataset.order === orderMode));
                q('[data-end]').forEach(b => b.classList.toggle('on', b.dataset.end === DS.end));
                q('[data-err]').forEach(b => b.classList.toggle('on', b.dataset.err === DS.err));
                q('[data-endbox]').forEach(el => el.classList.toggle('jbd-hide', el.dataset.endbox !== DS.end));
                q('[data-key]').forEach(inp => { inp.value = getVal(inp.dataset.key); });
                q('[data-endbox]').forEach(el => { if (mode !== 'duel') el.classList.add('jbd-hide'); });
                arena.querySelector('[data-sub="duel"]').classList.toggle('visible', mode === 'duel');
                container.classList.toggle('duel', mode === 'duel');
                const sec = speed;
                arena.querySelector('.jbd-info').innerHTML = mode === 'solo'
                    ? `👤 <b>${SOLO_ROUNDS}</b> questions · <b>${poolFor(type, level).length}</b> pays · <b>${sec} s</b> par question · 🏆 Record : <b>${records[recKey()] || 0}</b> pts`
                    : DS.org === 'tour' ? tourInfo(sec)
                    : `👥 Un joueur de chaque côté du tableau · <b>${sec} s</b> par question · ${errTxt()}`;
                updateStats(false);
                updateButtons();
            };
            const changed = (modeChanged) => {
                saveSettings(); sync();
                if (modeChanged) {
                    if (mode !== 'duel') classBox.classList.remove('show');
                    say(setupMsg());
                    requestAnimationFrame(applyScale);
                }
            };
            // Seul / À deux / Tournoi (le tournoi est une suite de duels : mode « duel » + DS.org)
            q('[data-mode]').forEach(b => b.addEventListener('click', () => {
                const before = mode + DS.org;
                mode = b.dataset.mode === 'solo' ? 'solo' : 'duel';
                if (b.dataset.mode !== 'solo') { DS.org = b.dataset.mode === 'tour' ? 'tour' : 'free'; saveDuel(DS); }
                changed(before !== mode + DS.org);
            }));
            q('[data-type]').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; changed(); }));
            q('[data-level]').forEach(b => b.addEventListener('click', () => { level = +b.dataset.level; changed(); }));
            q('[data-order]').forEach(b => b.addEventListener('click', () => { orderMode = b.dataset.order; changed(); }));
            q('[data-end]').forEach(b => b.addEventListener('click', () => { DS.end = b.dataset.end; saveDuel(DS); sync(); }));
            q('[data-err]').forEach(b => b.addEventListener('click', () => { DS.err = b.dataset.err; saveDuel(DS); sync(); }));

            // Spinners +/− avec appui long
            q('[data-key]').forEach(input => {
                const key = input.dataset.key, min = +input.min, max = +input.max;
                const set = (v) => {
                    v = Math.max(min, Math.min(max, v | 0));
                    input.value = v; setVal(key, v); sync();
                };
                q(`[data-spin="${key}"]`).forEach(b => {
                    const d = +b.dataset.d;
                    let hold = null, delay = null;
                    b.addEventListener('pointerdown', (e) => {
                        e.stopPropagation(); e.preventDefault();
                        try { b.setPointerCapture(e.pointerId); } catch (err) {}
                        set((+input.value || 0) + d);
                        delay = setTimeout(() => { hold = setInterval(() => set((+input.value || 0) + d), 90); }, 400);
                    });
                    const stop = () => { clearTimeout(delay); clearInterval(hold); delay = hold = null; };
                    b.addEventListener('pointerup', stop);
                    b.addEventListener('pointercancel', stop);
                    b.addEventListener('lostpointercapture', stop);
                });
                input.addEventListener('change', () => set(+input.value));
                ['pointerdown', 'mousedown'].forEach(ev => input.addEventListener(ev, (e) => e.stopPropagation()));
                input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') input.blur(); });
            });
            sync();
        }
        // Relit les champs numériques (valeur tapée au clavier sans validation)
        function readSetupInputs() {
            arena.querySelectorAll('.jbd-spinner-val[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) setVal(inp.dataset.key, Math.max(+inp.min, Math.min(+inp.max, v)));
            });
        }

        const numBtns = (side) => arena.querySelectorAll(`.jbd-pair[data-side="${side}"] .jbd-num`);
        const readyEl = () => arena.querySelector('.jbd-ready');
        const overlay = () => arena.querySelector('.jbd-overlay');

        function showHidden() {
            arena.querySelectorAll('.jbd-num').forEach(b => { b.className = 'jbd-num hidden'; b.innerHTML = '?'; b.dataset.k = b.dataset.k; });
            arena.querySelectorAll('.jbd-qslot').forEach(q => { q.innerHTML = qWait(); });
        }
        // Affiche la question et les 3 réponses (ordre mélangé indépendamment de chaque côté)
        function showPair() {
            const sides = mode === 'solo' ? ['S'] : ['L', 'R'];
            sides.forEach(side => {
                const perm = [0, 1, 2].sort(() => Math.random() - 0.5);
                const bs = numBtns(side);
                bs.forEach((b, i) => {
                    const idx = perm[i];
                    b.dataset.k = idx;
                    b.innerHTML = ansHTML(pair[idx], order);
                    b.className = ansCls(pair[idx], order) + ' appear';
                });
            });
            arena.querySelectorAll('.jbd-qslot').forEach(q => {
                q.innerHTML = `<div class="jbd-q pop ${order}">${qHTML(order)}</div>`;
            });
            arena.querySelectorAll('.jbd-order').forEach(o => {
                o.className = 'jbd-order pop big';
                o.innerHTML = '🌍 <b>' + consTxt(order) + '</b>';
            });
        }
        // La bonne réponse est toujours pair[0] (affichée à une place au hasard)
        const correctIdx = () => 0;
        function explainTxt() {
            const p = pair[0];
            return `C'est ${flagImg(p.c)} <b>${esc(p.n)}</b>.`;
        }
        const tipTxt = () => TIPS[pair[0].c] ? `<small>💡 ${TIPS[pair[0].c]}</small>` : '';

        // ── Manche ─────────────────────────────────────────────────────────
        async function newRound() {
            const id = ++runId;
            state = 'wait';
            pair = gen3(type, level);
            order = orderMode === 'mix' ? (Math.random() < 0.5 ? 'flag' : 'name') : orderMode;
            const flagsReady = preloadFlags(pair.map(p => p.c));
            locked = { L: false, R: false };
            arena.querySelectorAll('.jbd-half').forEach(h => h.classList.remove('lock', 'win'));
            showHidden();
            setTimeBar(1, speed);
            const r = readyEl();
            if (mode === 'duel') {
                duelRound++;
                const dr = arena.querySelector('[data-role="dround"]'); if (dr) dr.textContent = DS.end === 'count' ? (duelRound > DS.count ? '⚡' : `${duelRound}/${DS.count}`) : duelRound;
            }
            // Petite attente aléatoire : impossible d'anticiper
            await Promise.all([pwait(mode === 'duel' ? 700 + Math.random() * 900 : 350 + Math.random() * 450), flagsReady]);
            if (id !== runId) return;
            while (paused) { await pwait(100); if (id !== runId) return; }
            r.classList.remove('show');
            showPair();
            sfx('go');
            state = 'go';
            t0 = clock();
            runTimer(id);
        }
        // Barre de temps + secondes restantes (seul : 1 barre ; duel : 1 de chaque côté)
        function setTimeBar(k, secLeft) {
            k = Math.max(0, Math.min(1, k));
            const low = k < 0.3;
            arena.querySelectorAll('.jbd-timewrap').forEach(wrap => {
                wrap.querySelector('.jbd-timefill').style.width = (k * 100) + '%';
                wrap.querySelector('.jbd-timebar').classList.toggle('low', low);
                wrap.classList.toggle('low', low);
                wrap.querySelector('.jbd-timesec').textContent = Math.max(0, Math.ceil(secLeft)) + ' s';
            });
        }
        function runTimer(id) {
            const limit = qTime();
            const step = () => {
                if (id !== runId || state !== 'go' || !widget.isConnected) return;
                const left = limit - (clock() - t0);
                const k = Math.max(0, left / limit);
                setTimeBar(k, left / 1000);
                if (k <= 0) {
                    if (mode === 'solo') soloResult(null);
                    else duelTimeout(id);
                    return;
                }
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
        async function duelTimeout(id) {
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
                const limit = qTime();
                const gain = 10 + Math.round(Math.max(0, 1 - ms / limit) * 10) + (streak >= 5 ? 3 : 0);
                score += gain; times.push(ms);
                bs.forEach(b => { if (+b.dataset.k === ci) b.classList.add('ok'); });
                sfx('good');
                say(`✅ ${rnd(['Bravo', 'Exact', 'Super', 'Rapide', 'Bien vu'])} ! ${(ms / 1000).toFixed(2).replace('.', ',')} s · +${gain}${streak >= 5 ? ' 🔥' : ''} &nbsp; ${explainTxt()}`, 'good');
            } else {
                streak = 0;
                bs.forEach(b => {
                    if (+b.dataset.k === ci) b.classList.add('hint');
                    else if (k !== null && +b.dataset.k === k) b.classList.add('ko');
                });
                sfx('bad');
                say(`${k === null ? '⏱ Trop tard !' : '❌ Oups !'} ${explainTxt()} ${tipTxt()}`, 'bad');
            }
            updateStats(k === ci);
            await pwait(k === ci ? 800 : 2000);
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
                const half = arena.querySelector(`.jbd-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.jbd-pscore');
                sc.textContent = pts[side];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                sfx(side === 'L' ? 'pointL' : 'pointR');
                const ms = ((clock() - t0) / 1000).toFixed(2).replace('.', ',');
                const balle = DS.end === 'goal' && pts[side] === DS.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} Point pour <b>${esc(names[side])}</b> en ${ms} s ! ${explainTxt()}${balle}`, 'good');
                await pwait(1300);
                duelNext(id);
            } else if (DS.err === 'gift') {
                // Mode « point à l'adversaire » : la manche s'arrête, l'autre joueur marque
                state = 'result';
                pts[other]++;
                bs.forEach(b => {
                    if (+b.dataset.k === k) b.classList.add('ko');
                    else if (+b.dataset.k === ci) b.classList.add('hint');
                });
                numBtns(other).forEach(b => { if (+b.dataset.k === ci) b.classList.add('hint'); });
                const half = arena.querySelector(`.jbd-half.${other}`);
                half.classList.add('win');
                const sc = half.querySelector('.jbd-pscore');
                sc.textContent = pts[other];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                sfx('bad');
                setTimeout(() => sfx(other === 'L' ? 'pointL' : 'pointR'), 250);
                const balle = DS.end === 'goal' && pts[other] === DS.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : 🎁 le point va à ${other === 'L' ? '🔵' : '🟠'} <b>${esc(names[other])}</b> ! ${explainTxt()}${balle}`, 'bad');
                await pwait(1800);
                duelNext(id);
            } else {
                locked[side] = true;
                bs.forEach(b => { if (+b.dataset.k === k) b.classList.add('ko'); });
                arena.querySelector(`.jbd-half.${side}`).classList.add('lock');
                sfx('bad');
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour cette manche !`, 'bad');
                if (locked[other]) {
                    state = 'result';
                    [...numBtns('L'), ...numBtns('R')].forEach(b => { if (+b.dataset.k === ci) b.classList.add('hint'); });
                    say(`😅 Les deux joueurs se sont trompés ! ${explainTxt()} ${tipTxt()}`, 'bad');
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
            const title = st === 3 ? 'As de la géographie !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) { /* stockage indisponible */ } }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.jbd-card').innerHTML = `
                <div class="jbd-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="jbd-bigstars">${[1, 2, 3].map(n => `<span class="${n <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${SOLO_ROUNDS} · ${score} points</p>
                <p class="jbd-sub">Temps moyen : ${avg} s${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="jbd-actions">
                    <button class="jbd-btn jbd-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="jbd-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            ov.classList.add('show');
            if (st >= 2 || isRec) { sfx('win'); party(); }
            [1, 2, 3].forEach(n => { if (n <= st) setTimeout(() => sfx('star'), 200 * n); });
            say(`🏁 Partie terminée : ${good} sur ${SOLO_ROUNDS}, temps moyen ${avg} s.${isRec ? ' Nouveau record 🏆 !' : ''}`, st >= 2 ? 'good' : '');
            ov.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
            updateButtons();
        }
        // Après chaque manche : fin du duel ou manche suivante
        function duelNext(id) {
            if (id !== runId) return;
            const over = (DS.end === 'goal' && (pts.L >= DS.goal || pts.R >= DS.goal))
                      || (DS.end === 'count' && duelRound >= DS.count);
            if (over && tourMatch() && pts.L === pts.R) {
                // Tournoi : il faut un gagnant → manche décisive (le prochain point gagne)
                say(`⚖️ Égalité ${pts.L} à ${pts.R} ! <b>Manche décisive</b> : le prochain point gagne le match.`);
                newRound();
            }
            else if (over) duelEnd();
            else newRound();
        }
        function duelEnd() {
            resetPause();
            state = 'over';
            runId++;
            const ov = overlay();
            const tie = pts.L === pts.R;
            const side = pts.L > pts.R ? 'L' : 'R';
            const tm = tie ? null : tourMatch();
            let tourTxt = '';
            if (tm) {
                tm.w = side === 'L' ? duo.L : duo.R; tm.sL = pts.L; tm.sR = pts.R;
                const isBarrage = !!tm.barrage;
                const res = tourAdvance();
                const last = isBarrage ? tourCur().matches.find(x => x.wait) : null;
                tourTxt = isBarrage
                    ? `⚔️ ${esc(names[side])} gagne le barrage et reste en lice !` + (last ? ` Prochain adversaire : ${esc(shortName(stById(last.L)))}.` : '')
                    : res === 'champion'
                    ? `🏆 ${esc(names[side])} remporte le tournoi !`
                    : `🏆 ${esc(names[side])} est qualifié(e) pour le tour suivant !` + (res === 'newround' ? ' · Ce tour est terminé.' : '');
            }
            const recorded = recordDuel();
            const finalHTML = `<div class="jbd-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>`;
            ov.querySelector('.jbd-card').innerHTML = `
                <div class="jbd-medal">${tie ? '🤝' : (side === 'L' ? '🔵' : '🟠') + '🏆'}</div>
                <h3>${tie ? 'Égalité parfaite !' : esc(names[side]) + ' gagne !'}</h3>
                ${finalHTML}
                <p class="jbd-sub">en ${duelRound} manche${duelRound > 1 ? 's' : ''}</p>
                ${tourTxt ? `<p class="jbd-rec">${tourTxt}</p>` : recorded ? '<p class="jbd-rec">✔ Scores ajoutés dans la liste 📂</p>' : ''}
                <div class="jbd-actions">
                    ${tm ? '<button class="jbd-btn jbd-btn-go" data-act="tour">🏆 Suite du tournoi</button>'
                         : hasClass() ? '<button class="jbd-btn jbd-btn-go" data-act="next">🎲 Duel suivant</button>'
                                 : '<button class="jbd-btn jbd-btn-go" data-act="again">🔄 Revanche</button>'}
                    <button class="jbd-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            ov.classList.add('show');
            sfx('win'); party();
            say(tie
                ? `🤝 Égalité ${pts.L} à ${pts.R} ! Bravo à tous les deux.`
                : `🏆 Victoire de <b>${esc(names[side])}</b> ${pts.L} à ${pts.R} ! Bravo !`, 'good');
            const tb = ov.querySelector('[data-act="tour"]');
            if (tb) tb.addEventListener('click', (e) => { e.stopPropagation(); showTournament(); });
            const nx = ov.querySelector('[data-act="next"]');
            if (nx) nx.addEventListener('click', (e) => { e.stopPropagation(); showDraw(true); });
            const ag = ov.querySelector('[data-act="again"]');
            if (ag) ag.addEventListener('click', (e) => { e.stopPropagation(); start(); });
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
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
        const errTxt = () => DS.err === 'gift' ? 'une erreur donne le point à l\'adversaire 🎁' : 'une erreur bloque son côté 🔒';
        const endTxt = () => DS.end === 'goal' ? `Premier à ${DS.goal}` : `En ${DS.count} manches`;

        // ── Pause (seul et duel) ───────────────────────────────────────────────────
        function resetPause() {
            paused = false; pauseStart = 0; pausedTotal = 0;
            rolling = false;
            const p = arena.querySelector('.jbd-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            if (!playing()) return;
            const p = arena.querySelector('.jbd-pause');
            if (!paused) {
                paused = true; pauseStart = performance.now();
                if (p) p.classList.add('show');
                say(mode === 'duel' ? '⏸ Duel en pause. Cliquez sur <b>▶ Reprendre</b> pour continuer.'
                                    : '⏸ Pause. Clique sur <b>▶ Reprendre</b> pour continuer.');
            } else {
                pausedTotal += performance.now() - pauseStart;
                paused = false;
                if (p) p.classList.remove('show');
                say(mode === 'duel' ? `▶ C'est reparti ! (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)})`
                                    : `▶ C'est reparti ! (${round} / ${SOLO_ROUNDS} · ${score} points)`);
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
            $('.jbd-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué` : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            clBtn('draw').disabled = !hasClass() || playing() || rolling || tourOn();
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && mode === 'duel' && CL.students.length > 0;
            if (wantSides !== container.classList.contains('jbd-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="jbd-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['jbd-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (duo && duo.L === st.id) cls.push('cur-L');
                if (duo && duo.R === st.id) cls.push('cur-R');
                const ts = tourOn() ? tourStatus(st.id) : null;
                if (ts) cls.push('t-' + ts);
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="jbd-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = (duo && (duo.L === st.id || duo.R === st.id)) ? 'au tableau'
                    : ts === 'champ' ? '🏆 champion' : ts === 'out' ? 'éliminé' : ts === 'qualif' ? 'qualifié' : ts === 'in' ? 'en lice'
                    : st.absent ? 'absent' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="jbd-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="jbd-st-state">${stateTxt}</span>` : ''}
                    <span class="jbd-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('jbd-has-sides')) return;
            const rows = classList.querySelectorAll('.jbd-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.jbd-side-list'), sideR.querySelector('.jbd-side-list')];
            lists.forEach(l => { l.innerHTML = ''; });
            rows.forEach((r, i) => lists[i < half ? 0 : 1].appendChild(r.cloneNode(true)));
            const n = half || 1;
            const h = sideL.clientHeight || (container.clientHeight - 28);
            const fs = Math.max(10, Math.min(20, ((h - 50) / n - 3) * 0.52));
            [sideL, sideR].forEach(sd => {
                sd.querySelector('.jbd-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.jbd-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
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
        classList.addEventListener('click', (e) => { const r = e.target.closest('.jbd-st'); if (r) toggleAbsent(r.dataset.id); });
        [sideL, sideR].forEach(sd => sd.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = e.target.closest('.jbd-st'); if (r) toggleAbsent(r.dataset.id);
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
            if (state === 'tour') showSetup();
        });


        // =====================================================================
        // TOURNOI (élimination directe) : 1er tour, puis seuls les gagnants
        // jouent le tour suivant… jusqu'à la finale.
        // Nombre impair de joueurs : MATCH DE BARRAGE. Deux élèves (jamais les
        // mêmes si possible) s'affrontent d'abord, le perdant est éliminé et le
        // vainqueur joue ensuite le dernier match du tour contre l'élève resté
        // seul. Tout le monde joue donc à chaque tour.
        // Match : { L, R, w, sL, sR, barrage?, wait? }  (wait : R = vainqueur du barrage)
        // =====================================================================
        const tourOn = () => mode === 'duel' && DS.org === 'tour';
        const tourCur = () => CL.tour ? CL.tour.rounds[CL.tour.rounds.length - 1] : null;
        const curMatch = () => { const R = tourCur(); return R && !CL.tour.champion ? R.matches.find(m => !m.w && m.R) || null : null; };
        // Le match en cours de jeu (si le duel au tableau est un match du tournoi)
        const tourMatch = () => {
            if (!tourOn() || !duo) return null;
            const m = curMatch();
            return m && m.L === duo.L && m.R === duo.R ? m : null;
        };
        const roundDone = (R) => R.matches.every(m => m.w);
        const hasBarrage = (R) => R.matches.some(m => m.barrage);
        function roundName(R, i) {
            // Nombre de joueurs après le barrage éventuel
            const n = R.players.length - (hasBarrage(R) ? 1 : 0);
            if (n <= 2) return 'Finale';
            if (n <= 4) return 'Demi-finales';
            if (n <= 8) return 'Quarts de finale';
            if (n <= 16) return 'Huitièmes de finale';
            return i === 0 ? '1er tour' : (i + 1) + 'e tour';
        }
        const nbRounds = (n) => n < 2 ? 0 : Math.ceil(Math.log2(n));
        function tourInfo(sec) {
            if (CL.tour && !CL.tour.champion) {
                const R = tourCur();
                return `🏆 Tournoi en cours : <b>${roundName(R, CL.tour.rounds.length - 1)}</b> · ${R.matches.filter(m => m.w).length} / ${R.matches.length} matchs joués · <b>${sec} s</b> par question`;
            }
            const n = CL.students.filter(st => !st.absent).length;
            if (n < 2) return '🏆 Tournoi : chargez d\'abord une liste d\'élèves 📂';
            return `🏆 Tournoi : <b>${n}</b> élèves présents · nombre impair = <b>match de barrage</b> · égalité = manche décisive`;
        }
        function makeRound(ids) {
            const T = CL.tour;
            const list = shuffle(ids.slice());
            const matches = [];
            let alone = null;
            if (list.length % 2) {
                // Barrage : deux élèves qui n'ont pas encore joué de barrage (si possible)
                const fresh = list.filter(id => T.barr.indexOf(id) < 0);
                const pool = fresh.length >= 2 ? fresh : list;
                const a = pool[0], b = pool[1];
                [a, b].forEach(id => { list.splice(list.indexOf(id), 1); T.barr.push(id); });
                matches.push({ L: a, R: b, w: null, sL: 0, sR: 0, barrage: true });
                alone = list.pop();          // affrontera le vainqueur du barrage
            }
            for (let i = 0; i + 1 < list.length; i += 2) matches.push({ L: list[i], R: list[i + 1], w: null, sL: 0, sR: 0 });
            // Le match « élève seul contre vainqueur du barrage » se joue en dernier :
            // le vainqueur du barrage a le temps de souffler.
            if (alone) matches.push({ L: alone, R: null, w: null, sL: 0, sR: 0, wait: true });
            T.rounds.push({ players: ids.slice(), matches });
        }
        function createTournament() {
            const ids = CL.students.filter(st => !st.absent).map(st => st.id);
            CL.tour = { rounds: [], champion: null, barr: [] };
            makeRound(ids);
            saveClass(CL);
        }
        // Après un match : barrage → son vainqueur rejoint le dernier match ;
        // tour terminé → tour suivant avec les gagnants (ou champion)
        function tourAdvance() {
            const R = tourCur();
            let res = '';
            const b = R.matches.find(m => m.barrage);
            const x = R.matches.find(m => m.wait);
            if (b && b.w && x && !x.R) { x.R = b.w; res = 'barrage'; }
            if (roundDone(R)) {
                const winners = R.matches.filter(m => !m.barrage).map(m => m.w);
                if (winners.length <= 1) { CL.tour.champion = winners[0]; res = 'champion'; }
                else { makeRound(winners); res = 'newround'; }
            }
            saveClass(CL);
            return res;
        }
        function tourStatus(id) {
            const T = CL.tour;
            if (!T || T.rounds[0].players.indexOf(id) < 0) return null;
            if (T.champion) return T.champion === id ? 'champ' : 'out';
            const R = tourCur();
            if (R.players.indexOf(id) < 0) return 'out';
            if (R.matches.some(m => m.w && m.w !== id && (m.L === id || m.R === id))) return 'out';
            if (R.matches.some(m => m.w === id && !m.barrage)) return 'qualif';
            return 'in';
        }
        function newTournament(askFirst) {
            if (askFirst && CL.tour && !CL.tour.champion && CL.tour.rounds.some(r => r.matches.some(m => m.w))
                && !confirm('Un tournoi est en cours. Le recommencer depuis le début ?')) return;
            if (!hasClass()) { CL.tour = null; saveClass(CL); showSetup('⚠️ Pour un tournoi, il faut une liste d\'élèves 📂 avec au moins 2 présents.'); return; }
            createTournament();
            showTournament();
            sfx('pointL');
        }
        function showTournament(view) {
            if (!CL.tour) {
                if (!hasClass()) { showSetup('⚠️ Pour un tournoi, chargez d\'abord une liste d\'élèves avec le bouton <b>📂</b> (au moins 2 présents).'); return; }
                createTournament();
            }
            runId++;
            resetPause();
            state = 'tour';
            duo = null;
            const T = CL.tour, cur = T.rounds.length - 1;
            const vi = view == null ? cur : Math.max(0, Math.min(cur, view));
            const R = T.rounds[vi];
            const m = curMatch();
            const nm = (id) => esc(shortName(stById(id)) || '?');
            const fn = (id) => { const st = stById(id); return st ? esc(fullName(st)) : '?'; };
            const tabs = T.rounds.map((r, i) =>
                `<button class="jbd-tour-tab${i === vi ? ' on' : ''}${roundDone(r) ? ' done' : ''}" data-tv="${i}">${roundName(r, i)}${roundDone(r) ? ' ✔' : ''}</button>`).join('');
            let num = 0;
            const rows = R.matches.map((x) => {
                const isCur = x === m;
                const p = (id, side) => id
                    ? `<span class="jbd-mp ${side}${x.w ? (x.w === id ? ' win' : ' lose') : ''}" title="${fn(id)}">${nm(id)}</span>`
                    : `<span class="jbd-mp ${side} jbd-mp-wait">⚔️ vainqueur du barrage</span>`;
                const mid = x.w ? `<span class="jbd-ms">${x.sL} – ${x.sR}</span>` : `<span class="jbd-ms">${isCur ? '▶' : 'vs'}</span>`;
                const tag = x.barrage ? '<span class="jbd-mn jbd-mn-b" title="Match de barrage : le perdant est éliminé">⚔️</span>' : `<span class="jbd-mn">${++num}</span>`;
                return `<div class="jbd-match ${x.w ? 'done' : isCur ? 'cur' : 'todo'}${x.barrage ? ' barrage' : ''}">${tag}${p(x.L, 'L')}${mid}${p(x.R, 'R')}</div>`;
            }).join('');
            const playedN = R.matches.filter(x => x.w).length;
            const champ = T.champion
                ? `<div class="jbd-champ">🏆 <b>${fn(T.champion)}</b> remporte le tournoi !</div>`
                : `<div class="jbd-tour-sub">${R.players.length} joueur${R.players.length > 1 ? 's' : ''}${hasBarrage(R) ? ' (nombre impair : ⚔️ barrage)' : ''} · match ${Math.min(playedN + 1, R.matches.length)} / ${R.matches.length}${vi < cur ? ' · tour terminé' : ''}</div>`;
            arena.className = 'jbd-arena tour';
            arena.innerHTML = `
                <div class="jbd-draw-title">🏆 Tournoi</div>
                <div class="jbd-tour-tabs">${tabs}</div>
                ${champ}
                <div class="jbd-matches${R.matches.length > 4 ? ' two' : ''}">${rows}</div>
                <div class="jbd-actions"><button class="jbd-btn" data-tr="new">🔁 Nouveau tournoi</button></div>`;
            arena.querySelectorAll('[data-tv]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); showTournament(+b.dataset.tv); }));
            arena.querySelector('[data-tr="new"]').addEventListener('click', (e) => { e.stopPropagation(); newTournament(true); });
            if (T.champion) {
                say(`🏆 Bravo à <b>${fn(T.champion)}</b>, vainqueur du tournoi ! Cliquez sur <b>🔁 Nouveau tournoi</b> pour recommencer.`, 'good');
                if (view == null) { sfx('win'); party(); }
            } else if (m) {
                const fresh = playedN === 0 && vi === cur;
                const head = fresh ? `🏆 <b>${roundName(tourCur(), cur)}</b> ! ` : '';
                say(m.barrage
                    ? `${head}⚔️ <b>Match de barrage</b> (nombre impair de joueurs) : <b>${fn(m.L)}</b> 🔵 contre 🟠 <b>${fn(m.R)}</b>. Le perdant est éliminé, le vainqueur jouera encore un match dans ce tour. Venez au tableau, puis <b>▶ Jouer le match</b>.`
                    : `${head}Prochain match${m.wait ? ' (contre le vainqueur du barrage)' : ''} : <b>${fn(m.L)}</b> 🔵 contre 🟠 <b>${fn(m.R)}</b>. Venez au tableau, puis <b>▶ Jouer le match</b>.`, 'good');
            }
            updateButtons();
            requestAnimationFrame(applyScale);
        }

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
            if (!hasClass()) { showSetup(); return; }
            runId++;
            resetPause();
            state = 'draw';
            arena.className = 'jbd-arena draw';
            arena.innerHTML = `
                <div class="jbd-draw-title">🎲 Tirage au sort</div>
                <div class="jbd-draw-row">
                    <div class="jbd-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="jbd-draw-vs">VS</div>
                    <div class="jbd-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="jbd-draw-info"></div>
                <div class="jbd-actions"><button class="jbd-btn" data-dr="again">🎲 Nouveau tirage</button></div>`;
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
            const els = [...arena.querySelectorAll('.jbd-draw-card b')];
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
            arena.querySelectorAll('.jbd-draw-card b').forEach(el => {
                const st = el.dataset.side === 'L' ? stL : stR;
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = shortName(st); el.title = fullName(st);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.jbd-draw-info');
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
            if (!confirm('Effacer tous les scores, recommencer le tour de tirage et effacer le tournoi en cours ?')) return;
            CL.students.forEach(st => { st.scores = []; });
            CL.played = [];
            CL.tour = null;
            if (state === 'tour') showSetup();
            saveClass(CL); renderClass();
            say('♻️ Scores remis à zéro : tout le monde peut de nouveau être tiré au sort.');
        });
        clBtn('clear').addEventListener('click', () => {
            if (!confirm('Retirer la liste d\'élèves et leurs scores ?')) return;
            CL = { students: [], played: [] };
            duo = null;
            names = { L: 'Joueur bleu', R: 'Joueur orange' };
            saveClass(CL); renderClass();
            if (state === 'draw' || state === 'tour') showSetup();
            say('🗑 Liste d\'élèves retirée.');
        });

        // ── Démarrer / arrêter ─────────────────────────────────────────────
        function updateButtons() {
            const pl = playing();
            btn('start').textContent = pl ? (tourMatch() ? '🔄 Rejouer le match' : '🔄 Recommencer')
                : state === 'tour' ? (CL.tour && CL.tour.champion ? '🔁 Nouveau tournoi' : '▶ Jouer le match')
                : mode !== 'duel' ? '▶ Jouer'
                : tourOn() ? (CL.tour && !CL.tour.champion ? '▶ Reprendre le tournoi' : '▶ Lancer le tournoi')
                : '▶ Lancer le duel';
            btn('start').disabled = rolling;
            btn('stop').disabled = !pl;
            // Pendant la partie : « Pause » à la place de « Réglages »
            btn('setup').disabled = state === 'setup';
            btn('setup').hidden = pl;
            const pb = btn('pause');
            pb.hidden = !pl;
            pb.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
            pb.title = paused ? 'Reprendre la partie' : 'Mettre la partie en pause';
            pb.classList.toggle('on', paused);
            renderClass();
        }
        async function start() {
            if (rolling) return;
            preloadFlags(poolFor(type, level).map(p => p.c));
            if (state === 'setup') { readSetupInputs(); saveSettings(); }
            if (tourOn()) {
                // Tournoi : on joue le prochain match du tableau (ou on rejoue le match en cours)
                if (state === 'tour' && CL.tour && CL.tour.champion) { newTournament(false); return; }
                const m = curMatch();
                const replay = playing() && tourMatch();
                if (!m || (state !== 'tour' && !replay)) { showTournament(); return; }
                duo = { L: m.L, R: m.R };
            }
            // Duel avec une liste d'élèves : on passe d'abord par le tirage au sort
            else if (hasClass() && (state === 'setup' || state === 'over' || !duo)) {
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
                : `⚡ ${DS.end === 'goal' ? `Premier à ${DS.goal} point${DS.goal > 1 ? 's' : ''} !` : `${DS.count} manches : le plus de points gagne !`} Attention : ${DS.err === 'gift' ? 'une erreur donne le point à ton adversaire 🎁 !' : 'une erreur bloque ton côté pour la manche 🔒.'}`);
            await pwait(400);
            if (id !== runId) return;
            newRound();
        }
        // Retour à l'écran de réglages
        function showSetup(message) {
            runId++;
            resetPause();
            state = 'setup';
            if (mode !== 'duel') classBox.classList.remove('show');
            buildSetup();
            updateStats(false);
            updateButtons();
            say(message || setupMsg());
            requestAnimationFrame(applyScale);
        }
        btn('start').addEventListener('click', start);
        btn('setup').addEventListener('click', () => showSetup());
        btn('stop').addEventListener('click', () => {
            if (!playing()) return;
            if (tourMatch()) {
                const t = `⏹ Match arrêté (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)}) : il n'est pas compté, vous pourrez le rejouer.`;
                showTournament();
                say(t);
                return;
            }
            showSetup(mode === 'duel'
                ? `⏹ Duel arrêté (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)}).`
                : '⏹ Partie arrêtée.');
        });

        function setLevel(l) {
            level = [1, 2, 3].indexOf(+l) >= 0 ? +l : 1;
            saveSettings();
            showSetup();
        }

        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'SELECT' || ae.tagName === 'INPUT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if ((k === 'enter' || k === ' ') && (state === 'setup' || state === 'draw' || state === 'tour' || (state === 'over' && mode === 'solo'))) { e.preventDefault(); start(); return; }
            if ((k === ' ' || k === 'escape') && playing()) { e.preventDefault(); togglePause(); return; }
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
            if (playing() || state === 'draw' || state === 'tour') showSetup('⏹ Partie arrêtée.');
            classBox.classList.remove('show');
            window._wfMiniBarCollapse(widget, '🌍 Battle drapeaux', { onExpand: applyScale });
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
        container.querySelectorAll('.jbd-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .jbd-arena, .jbd-rh, .jbd-help, .jbd-class, .jbd-side')) {
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
            showSetup();
            applyScale();
            container.focus({ preventScroll: true });
            if ((typeof isPhoneScreen === 'function' && isPhoneScreen()) || (window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches) || (typeof isMobileBoardMode === 'function' && isMobileBoardMode())) {
                wfMax.click();
            } else if (!(typeof isRestoringState !== 'undefined' && isRestoringState)) {
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
            if (type === 'battle-drapeaux') return window.createBattleDrapeauxWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'battle-drapeaux') return window.createBattleDrapeauxWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
