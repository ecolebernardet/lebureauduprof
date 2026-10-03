// =========================================================================
// BATTLE DE CALCULS — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — duel au TBI
//
// Deux élèves s'affrontent en calcul mental, un de chaque côté de l'écran
// (multi-touch). Un calcul s'affiche en grand au centre ; chaque joueur
// dispose de 3 réponses possibles (mélangées différemment de chaque côté).
//   • Le premier qui touche la bonne réponse marque le point.
//   • Une erreur bloque son côté pour ce calcul (pas de clic au hasard !).
//   • Si personne ne répond dans le temps imparti, la réponse est montrée.
//   • À la fin de la série, le joueur qui a le plus de points gagne.
//
// Réglages repris du Calcul flash : additions, soustractions (nombres min /
// max de chaque terme), tables, compléments à 10 / 100, doubles, moitiés,
// secondes par calcul, nombre de calculs, lecture à voix haute.
//
// Ouverture : createWidget('battle-calculs')
// 📌 Intégration dans index.html :
//   1. <script src="widget-jeu-battle-calculs.js"></script> (après widgets.js)
//   2. Carte du panneau Jeux (rubrique Jeux de maths) :
//      onclick="createWidget('battle-calculs');toggleJeuxPanel()"
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'battle-calculs';
    var SETTINGS_KEY = 'battle-calculs-settings';

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

    // ── CSS du jeu (préfixe bc-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-calculs-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-calculs-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-calculs"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .bc-container {
            --bc-s: 1;
            --encre: #2A1F4A;
            --creme: #FFF7E6;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --bleu: #3BA7FF;
            --orange: #FF7A1A;

            width: 760px;
            box-sizing: border-box;
            position: relative;
            padding: calc(12px * var(--bc-s)) calc(14px * var(--bc-s)) calc(14px * var(--bc-s));
            border-radius: calc(24px * var(--bc-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--bc-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .bc-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .bc-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--bc-s));
            width: 100%; max-width: calc(732px * var(--bc-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .bc-header { display: flex; align-items: center; gap: calc(10px * var(--bc-s)); cursor: move; }
        .bc-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--bc-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--bc-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .bc-icon-btn {
            width: calc(26px * var(--bc-s)); height: calc(26px * var(--bc-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--bc-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .bc-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .bc-arena {
            position: relative;
            min-height: calc(390px * var(--bc-s));
            border-radius: calc(18px * var(--bc-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .bc-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bc-s)), transparent calc(2px * var(--bc-s))) 0 0 / calc(24px * var(--bc-s)) calc(24px * var(--bc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bc-s));
            box-sizing: border-box;
            padding: calc(10px * var(--bc-s)) calc(14px * var(--bc-s)) calc(14px * var(--bc-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--bc-s));
            color: #fff;
        }
        .bc-label {
            font-size: calc(13px * var(--bc-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--bc-s));
        }
        .bc-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--bc-s)); justify-content: center; }
        .bc-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--bc-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--bc-s)); height: calc(52px * var(--bc-s)); padding: 0 calc(8px * var(--bc-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--bc-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .bc-type .bc-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--bc-s)); }
        .bc-type:hover { background: rgba(255,255,255,0.14); }
        .bc-type:active { transform: scale(0.95); }
        .bc-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bc-small {
            min-width: calc(40px * var(--bc-s)); height: calc(38px * var(--bc-s)); padding: 0 calc(8px * var(--bc-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--bc-s));
            display: flex; align-items: center; justify-content: center;
        }
        .bc-small.bc-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--bc-s)); }
        .bc-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bc-sub { display: none; }
        .bc-sub.visible { display: block; }

        .bc-params { display: flex; gap: calc(20px * var(--bc-s)); justify-content: center; flex-wrap: wrap; }
        .bc-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .bc-spinner-label { font-size: calc(11px * var(--bc-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .bc-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--bc-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--bc-s)) 0 #B9B2D6;
        }
        .bc-spinner-btn {
            width: calc(34px * var(--bc-s)); height: calc(42px * var(--bc-s)); border: none; background: transparent;
            font-size: calc(20px * var(--bc-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .bc-spinner-btn:hover { background: #F1EDFB; }
        .bc-spinner-val {
            width: calc(56px * var(--bc-s)); height: calc(42px * var(--bc-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--bc-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .bc-spinner-val::-webkit-inner-spin-button,
        .bc-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bc-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--bc-s)) calc(14px * var(--bc-s));
            font-family: inherit; font-size: calc(12px * var(--bc-s)); font-weight: 800; color: #fff;
        }
        .bc-toggle .bc-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .bc-toggle.on { border-color: var(--or); }
        .bc-toggle.on .bc-dot { background: var(--or); }
        .bc-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--bc-s)); font-weight: 900; min-height: calc(16px * var(--bc-s)); }

        /* ══ DUEL ══ */
        .bc-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--bc-s)); background: #1B1433; }
        .bc-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bc-s)), transparent calc(2px * var(--bc-s))) 0 0 / calc(24px * var(--bc-s)) calc(24px * var(--bc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--bc-s)) calc(12px * var(--bc-s)) calc(10px * var(--bc-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--bc-s));
        }
        .bc-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--bc-s));
            padding: calc(6px * var(--bc-s)) calc(26px * var(--bc-s));
            min-width: calc(260px * var(--bc-s)); min-height: calc(72px * var(--bc-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--bc-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bc-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .bc-calc.wait { color: #D9D2EE; }
        .bc-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--bc-s)) 0 #1C8A4F; }
        .bc-calc .bc-ans { color: #1C8A4F; }
        .bc-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .bc-calc .bc-q { font-size: 0.9em; }
        .bc-timebar {
            width: 70%; height: calc(10px * var(--bc-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .bc-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .bc-timebar.low i { background: var(--rouge); }

        .bc-field { flex: 1; display: grid; grid-template-columns: 1fr calc(64px * var(--bc-s)) 1fr; }
        .bc-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--bc-s));
            padding: calc(10px * var(--bc-s)) calc(10px * var(--bc-s)) calc(12px * var(--bc-s));
            transition: box-shadow .2s;
        }
        .bc-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bc-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bc-half.win { box-shadow: inset 0 0 0 calc(6px * var(--bc-s)) #7CFFB2; }
        .bc-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--bc-s));
            background: rgba(42,31,74,0.5);
        }
        .bc-phead { display: flex; align-items: center; gap: calc(10px * var(--bc-s)); }
        .bc-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--bc-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--bc-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--bc-s)); text-align: center;
        }
        @keyframes bc-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .bc-pscore.bump { animation: bc-bump .4s ease; }
        .bc-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bc-s));
            width: calc(150px * var(--bc-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--bc-s)) calc(8px * var(--bc-s));
            user-select: text;
        }
        .bc-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .bc-choices { display: flex; flex-direction: column; gap: calc(9px * var(--bc-s)); width: 100%; align-items: center; }
        .bc-choice {
            width: 86%; height: calc(62px * var(--bc-s));
            border: none; border-radius: calc(18px * var(--bc-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--bc-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bc-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .bc-choice:hover { background: #FFF3C4; }
        .bc-choice:active { transform: translateY(calc(4px * var(--bc-s))); box-shadow: 0 calc(2px * var(--bc-s)) 0 #B9B2D6; }
        .bc-choice.hidden { color: #D9D2EE; }
        .bc-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--bc-s)) 0 #1C8A4F; }
        .bc-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--bc-s)) 0 #B32B38; }
        .bc-choice.hint { box-shadow: 0 0 0 calc(5px * var(--bc-s)) #7CFFB2, 0 calc(6px * var(--bc-s)) 0 #B9B2D6; }
        @keyframes bc-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .bc-choice.ko { animation: bc-shake .4s ease; }
        @keyframes bc-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .bc-choice.appear, .bc-calc.appear { animation: bc-pop .25s ease-out; }
        .bc-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--bc-s)); }

        .bc-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--bc-s)); color: #fff;
        }
        .bc-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--bc-s)); color: var(--or); line-height: 1; text-align: center; }
        .bc-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--bc-s)); color: rgba(255,255,255,0.6); }
        .bc-mid > small { font-size: calc(10px * var(--bc-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .bc-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--bc-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--bc-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .bc-ready.show { display: flex; animation: bc-pop .3s ease-out; }

        /* ── Actions ── */
        .bc-actions { display: flex; gap: calc(8px * var(--bc-s)); justify-content: center; flex-wrap: wrap; }
        .bc-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bc-s));
            padding: calc(8px * var(--bc-s)) calc(14px * var(--bc-s));
            border-radius: calc(14px * var(--bc-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--bc-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .bc-btn:hover { filter: brightness(1.05); }
        .bc-btn:active { transform: translateY(calc(4px * var(--bc-s))); box-shadow: 0 calc(1px * var(--bc-s)) 0 #B9B2D6; }
        .bc-btn:disabled { opacity: 0.45; cursor: default; }
        .bc-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--bc-s));
            padding: calc(8px * var(--bc-s)) calc(22px * var(--bc-s));
            box-shadow: 0 calc(5px * var(--bc-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .bc-btn-go:active { box-shadow: 0 calc(1px * var(--bc-s)) 0 #1C8A4F; }
        .bc-btn:focus-visible, .bc-choice:focus-visible, .bc-type:focus-visible, .bc-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .bc-talk { display: flex; align-items: center; gap: calc(10px * var(--bc-s)); }
        .bc-chef {
            width: calc(44px * var(--bc-s)); height: calc(44px * var(--bc-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--bc-s));
            box-shadow: 0 calc(3px * var(--bc-s)) 0 #B3840B;
        }
        @keyframes bc-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--bc-s))) rotate(-8deg); } }
        .bc-chef.hop { animation: bc-hop .4s ease; }
        .bc-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--bc-s));
            padding: calc(8px * var(--bc-s)) calc(12px * var(--bc-s));
            font-weight: 700; font-size: calc(15px * var(--bc-s)); line-height: 1.35;
            min-height: calc(22px * var(--bc-s));
            border-left: calc(6px * var(--bc-s)) solid var(--or);
        }
        .bc-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .bc-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .bc-msg b { font-weight: 900; }

        /* ── Fin de partie ── */
        .bc-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .bc-overlay.show { display: flex; }
        .bc-card {
            background: #fff; border-radius: calc(18px * var(--bc-s));
            padding: calc(12px * var(--bc-s)) calc(24px * var(--bc-s)) calc(14px * var(--bc-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bc-s)) 0 #B9B2D6;
            animation: bc-pop .35s ease-out; max-width: 90%;
        }
        .bc-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bc-s)); color: var(--encre); }
        .bc-card p { margin: calc(4px * var(--bc-s)) 0 calc(8px * var(--bc-s)); font-weight: 800; font-size: calc(15px * var(--bc-s)); }
        .bc-card .bc-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--bc-s)); margin: calc(2px * var(--bc-s)) 0; }
        .bc-card .bc-final .L { color: #1F6FB5; } .bc-card .bc-final .R { color: #E0620F; }
        .bc-card .bc-sub { font-size: calc(12px * var(--bc-s)); color: #6A5E8E; margin-top: calc(-4px * var(--bc-s)); }
        .bc-medal { font-size: calc(54px * var(--bc-s)); line-height: 1; animation: bc-pop .5s ease-out; }
        .bc-card .bc-actions { margin-top: calc(4px * var(--bc-s)); }

        /* ── Aide ── */
        .bc-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .bc-help.show { display: block; }
        .bc-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .bc-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .bc-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .bc-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: bc-fall 1.8s ease-in forwards; }
        @keyframes bc-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .bc-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .bc-container:hover .bc-rh { opacity: 1; }
        .bc-container.wf-fullboard .bc-rh { display: none; }
        .bc-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .bc-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .bc-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .bc-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .bc-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .bc-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .bc-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .bc-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .bc-container *, .bc-container *::before, .bc-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // RÉGLAGES MÉMORISÉS (même logique que le Calcul flash)
    // =========================================================================
    var ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    var DEFAULTS = { addMin: 1, addMax: 20, types: ['tables'], tables: ALL_TABLES.slice(), limit: 20, speed: 10, count: 10, voice: false };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.types = Array.isArray(r.types) ? r.types.slice() : DEFAULTS.types.slice();
                r.tables = Array.isArray(r.tables) ? r.tables.slice() : DEFAULTS.tables.slice();
                return r;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }

    // =========================================================================
    // GÉNÉRATEURS DE CALCULS (repris du Calcul flash)
    // Chaque calcul : { html, ans, say, key, type, a, b, n }
    // =========================================================================
    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }
    var fmtInt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F'); };
    var Q = '<span class="bc-q">?</span>';

    function addRange(s) {
        var a = Math.max(0, Math.min(999, s.addMin | 0)), b = Math.max(0, Math.min(999, s.addMax | 0));
        return a <= b ? [a, b] : [b, a];
    }
    var GEN = {
        add: function (s) {
            var r = addRange(s), a = rnd(r[0], r[1]), b = rnd(r[0], r[1]);
            return { type: 'add', a: a, b: b, html: a + ' + ' + b, ans: a + b, say: a + ' plus ' + b, key: 'a' + Math.min(a, b) + '_' + Math.max(a, b) };
        },
        sub: function (s) {
            var r = addRange(s), a = rnd(r[0], r[1]), b = rnd(r[0], r[1]);
            if (a < b) { var t = a; a = b; b = t; }      // résultat jamais négatif
            return { type: 'sub', a: a, b: b, html: a + ' − ' + b, ans: a - b, say: a + ' moins ' + b, key: 's' + a + '_' + b };
        },
        tables: function (s) {
            var t = pick(s.tables.length ? s.tables : DEFAULTS.tables), n = rnd(1, 10);
            var a = t, b = n;
            if (Math.random() < 0.5) { a = n; b = t; }
            return { type: 'tables', a: a, b: b, html: a + ' × ' + b, ans: a * b, say: a + ' fois ' + b, key: 'x' + Math.min(a, b) + '_' + Math.max(a, b) };
        },
        c10: function () {
            var a = rnd(1, 9);
            return { type: 'c10', a: a, html: a + ' + ' + Q + ' = 10', ans: 10 - a, say: a + ' plus combien égale 10 ?', key: 'c10_' + a };
        },
        c100: function () {
            var a = Math.random() < 0.35 ? rnd(1, 9) * 10 : rnd(1, 99);
            return { type: 'c100', a: a, html: a + ' + ' + Q + ' = 100', ans: 100 - a, say: a + ' plus combien égale 100 ?', key: 'c100_' + a };
        },
        doubles: function (s) {
            var n = rnd(1, s.limit);
            return { type: 'doubles', n: n, html: 'double de ' + n, ans: 2 * n, say: 'le double de ' + n, key: 'd' + n };
        },
        moities: function (s) {
            var n = 2 * rnd(1, Math.max(1, Math.floor(s.limit / 2)));
            return { type: 'moities', n: n, html: 'moitié de ' + n, ans: n / 2, say: 'la moitié de ' + n, key: 'm' + n };
        }
    };

    // Répartition équilibrée des types, en évitant deux fois le même type à la suite
    function balancedTypes(types, count) {
        var n = types.length, base = Math.floor(count / n), rest = count % n;
        var extra = shuffle(types.slice()).slice(0, rest);
        var pool = [];
        types.forEach(function (t) {
            var k = base + (extra.indexOf(t) >= 0 ? 1 : 0);
            for (var i = 0; i < k; i++) pool.push(t);
        });
        var best = shuffle(pool.slice()), bestRuns = Infinity;
        for (var attempt = 0; attempt < 40 && n > 1; attempt++) {
            var cand = shuffle(pool.slice()), runs = 0;
            for (var i = 1; i < cand.length; i++) if (cand[i] === cand[i - 1]) runs++;
            if (runs < bestRuns) { best = cand; bestRuns = runs; }
            if (runs === 0) break;
        }
        return best;
    }
    function generateSeries(s) {
        var list = [], used = {}, last = '';
        var order = balancedTypes(s.types, s.count);
        for (var i = 0; i < s.count; i++) {
            var type = order[i], item = null;
            for (var tries = 0; tries < 60; tries++) {
                var it = GEN[type](s);
                if (it.key === last) continue;
                if (used[it.key] && tries < 50) continue;
                item = it; break;
            }
            if (!item) item = GEN[type](s);
            used[item.key] = true; last = item.key;
            item.options = makeOptions(item);
            list.push(item);
        }
        return list;
    }

    // =========================================================================
    // 3 RÉPONSES POSSIBLES : la bonne + 2 erreurs « plausibles »
    // (erreurs typiques d'élèves plutôt que des nombres au hasard)
    // =========================================================================
    function makeOptions(it) {
        var a = it.ans, typical = [], near = [];
        switch (it.type) {
            case 'add':
                typical = [a + 10, a - 10, a + 1, a - 1, Math.abs(it.a - it.b)];
                near = [a + 2, a - 2, a + 11, a - 9];
                break;
            case 'sub':
                typical = [a + 10, a - 10, a + 1, a - 1, it.a + it.b];
                near = [a + 2, a - 2, a + 9, a - 11];
                break;
            case 'tables':
                typical = [it.a * (it.b + 1), it.a * (it.b - 1), (it.a + 1) * it.b, (it.a - 1) * it.b, it.a + it.b];
                near = [a + 1, a - 1, a + 2, a - 2, a + 10];
                break;
            case 'c10':
                typical = [a + 1, a - 1, 10 + it.a, it.a];
                near = [a + 2, a - 2];
                break;
            case 'c100':
                typical = [a + 10, a - 10, it.a % 10 ? (10 - Math.floor(it.a / 10)) * 10 + (10 - it.a % 10) : a + 5, a + 1, a - 1];
                near = [a + 2, a - 2, 100 + it.a];
                break;
            case 'doubles':
                typical = [it.n + 2, a + 2, a - 2, a + 1, a - 1];
                near = [a + 10, a - 10, it.n * 3];
                break;
            case 'moities':
                typical = [it.n * 2, a + 1, a - 1, a + 2, a - 2];
                near = [a + 5, a - 5, a + 10];
                break;
        }
        var seen = {}; seen[a] = true;
        var ok = function (v) { return Number.isInteger(v) && v >= 0 && !seen[v]; };
        var out = [];
        [shuffle(typical.slice()), shuffle(near.slice())].forEach(function (list) {
            list.forEach(function (v) { if (out.length < 2 && ok(v)) { seen[v] = true; out.push(v); } });
        });
        for (var d = 1; out.length < 2 && d < 50; d++) {
            [a + d, a - d].forEach(function (v) { if (out.length < 2 && ok(v)) { seen[v] = true; out.push(v); } });
        }
        return [a].concat(out);
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _bcAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_bcAudio) _bcAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _bcAudio, t0 = ctx.currentTime + start;
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
        bad:   () => { tone(200, 0, 0.18, 'square', 0.05); tone(150, 0.16, 0.22, 'square', 0.05); },
        go:    () => tone(880, 0, 0.1, 'square', 0.05),
        tick:  () => tone(440, 0, 0.05, 'square', 0.03),
        pointL:() => [523, 784].forEach((f, i) => tone(f, 0.07 * i, 0.12, 'triangle', 0.09)),
        pointR:() => [587, 880].forEach((f, i) => tone(f, 0.07 * i, 0.12, 'triangle', 0.09)),
        miss:  () => tone(330, 0, 0.25, 'triangle', 0.07),
        win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.22, 'triangle', 0.1)),
    };
    function speak(text) {
        if (!window.speechSynthesis) return;
        try {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'fr-FR'; u.rate = 0.95;
            const v = speechSynthesis.getVoices().find(v => /^fr/i.test(v.lang));
            if (v) u.voice = v;
            speechSynthesis.speak(u);
        } catch (e) {}
    }
    function stopSpeech() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }

    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#9B6BFF', '#FF7A1A'];
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

    // Touches clavier (AZERTY) : bleu A / Z / E · orange I / O / P
    const KEYS = { L: ['a', 'z', 'e'], R: ['i', 'o', 'p'] };

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createBattleCalculsWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = TYPE;
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
        container.className = 'bc-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="bc-inner">
            <div class="bc-header">
                <span class="bc-title">⚔️ Battle de calculs</span>
                <div class="wf-btns">
                    <button class="bc-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="bc-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="bc-arena"></div>

            <div class="bc-talk">
                <div class="bc-chef">⚔️</div>
                <div class="bc-msg"></div>
            </div>

            <div class="bc-actions">
                <button class="bc-btn bc-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="bc-btn" data-act="setup">⚙️ Réglages</button>
                <button class="bc-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="bc-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>Deux élèves au tableau, <b>un de chaque côté</b>. Un calcul apparaît en grand au milieu.</p>
                <p>Chaque joueur a <b>3 réponses possibles</b> de son côté (pas dans le même ordre que l'adversaire). Le premier qui touche la bonne réponse marque <b>1 point</b>.</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour ce calcul : inutile de cliquer au hasard ! Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>À la fin de la série, celui qui a le plus de points gagne.</p>
                <p style="margin:0">Clavier : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
            </div>
            <div class="bc-confetti"></div>
            <div class="bc-rh bc-rh-nw" data-dir="nw"></div>
            <div class="bc-rh bc-rh-n"  data-dir="n"></div>
            <div class="bc-rh bc-rh-ne" data-dir="ne"></div>
            <div class="bc-rh bc-rh-e"  data-dir="e"></div>
            <div class="bc-rh bc-rh-se" data-dir="se"></div>
            <div class="bc-rh bc-rh-s"  data-dir="s"></div>
            <div class="bc-rh bc-rh-sw" data-dir="sw"></div>
            <div class="bc-rh bc-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.bc-inner');
        const arena    = $('.bc-arena');
        const msg      = $('.bc-msg');
        const chef     = $('.bc-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.bc-help');
        const confetti = $('.bc-confetti');
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);

        // ── État ───────────────────────────────────────────────────────────
        let S = loadSettings();
        let state = 'setup';         // setup | wait | go | result | over
        let runId = 0;
        let series = [], idx = 0, t0 = 0;
        let pts = { L: 0, R: 0 }, locked = { L: false, R: false };
        let names = { L: 'Joueur bleu', R: 'Joueur orange' };
        let soundOn = true;
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 760;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--bc-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--bc-s', sc.toFixed(4));
            fitCalc();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'bc-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            let tablesHtml = '';
            ALL_TABLES.forEach(i => { tablesHtml += `<button class="bc-small" data-table="${i}">${i}</button>`; });
            tablesHtml += '<button class="bc-small bc-all" data-table="all">Toutes</button>';
            const spinner = (label, key, min, max) => `
                <div class="bc-spinner">
                    <div class="bc-spinner-label">${label}</div>
                    <div class="bc-spinner-inner">
                        <button class="bc-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="bc-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="bc-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            arena.innerHTML = `
              <div class="bc-setup">
                <div class="bc-label">Types de calculs</div>
                <div class="bc-chips">
                    <button class="bc-type" data-type="add"><span class="bc-type-ico">+</span>Additions</button>
                    <button class="bc-type" data-type="sub"><span class="bc-type-ico">−</span>Soustractions</button>
                    <button class="bc-type" data-type="tables"><span class="bc-type-ico">×</span>Tables</button>
                    <button class="bc-type" data-type="c10" title="Compléments à 10"><span class="bc-type-ico">…+?=10</span>Compl. à 10</button>
                    <button class="bc-type" data-type="c100" title="Compléments à 100"><span class="bc-type-ico">…+?=100</span>Compl. à 100</button>
                    <button class="bc-type" data-type="doubles"><span class="bc-type-ico">2 ×</span>Doubles</button>
                    <button class="bc-type" data-type="moities"><span class="bc-type-ico">½</span>Moitiés</button>
                </div>

                <div class="bc-sub" data-sub="addsub">
                    <div class="bc-label">Additions et soustractions : nombres de chaque terme</div>
                    <div class="bc-params">
                        ${spinner('Nombre<br>minimum', 'addMin', 0, 999)}
                        ${spinner('Nombre<br>maximum', 'addMax', 0, 999)}
                    </div>
                </div>
                <div class="bc-sub" data-sub="tables">
                    <div class="bc-label">Tables</div>
                    <div class="bc-chips">${tablesHtml}</div>
                </div>
                <div class="bc-sub" data-sub="limit">
                    <div class="bc-label">Doubles et moitiés : nombres jusqu'à</div>
                    <div class="bc-chips">
                        <button class="bc-small" data-limit="10">10</button>
                        <button class="bc-small" data-limit="20">20</button>
                        <button class="bc-small" data-limit="50">50</button>
                        <button class="bc-small" data-limit="100">100</button>
                    </div>
                </div>

                <div class="bc-params" style="margin-top:calc(6px * var(--bc-s))">
                    ${spinner('Secondes<br>par calcul', 'speed', 3, 60)}
                    ${spinner('Nombre<br>de calculs', 'count', 3, 40)}
                </div>
                <div class="bc-chips" style="margin-top:calc(4px * var(--bc-s))">
                    <button class="bc-toggle" data-opt="voice"><span class="bc-dot"></span>🔊 Lire les calculs à voix haute</button>
                </div>
                <div class="bc-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.bc-setup');
            const sync = () => {
                setupEl.querySelectorAll('.bc-type').forEach(b => b.classList.toggle('on', S.types.indexOf(b.dataset.type) >= 0));
                setupEl.querySelectorAll('[data-table]').forEach(b => {
                    if (b.dataset.table === 'all') b.classList.toggle('on', S.tables.length === 9);
                    else b.classList.toggle('on', S.tables.indexOf(+b.dataset.table) >= 0);
                });
                setupEl.querySelectorAll('[data-limit]').forEach(b => b.classList.toggle('on', +b.dataset.limit === S.limit));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelector('[data-sub="addsub"]').classList.toggle('visible', S.types.indexOf('add') >= 0 || S.types.indexOf('sub') >= 0);
                setupEl.querySelector('[data-sub="tables"]').classList.toggle('visible', S.types.indexOf('tables') >= 0);
                setupEl.querySelector('[data-sub="limit"]').classList.toggle('visible', S.types.indexOf('doubles') >= 0 || S.types.indexOf('moities') >= 0);
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelector('.bc-warn').textContent = '';
            };

            setupEl.querySelectorAll('.bc-type').forEach(b => b.addEventListener('click', () => {
                const t = b.dataset.type, i = S.types.indexOf(t);
                if (i >= 0) S.types.splice(i, 1); else S.types.push(t);
                sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-table]').forEach(b => b.addEventListener('click', () => {
                if (b.dataset.table === 'all') S.tables = S.tables.length === 9 ? [] : ALL_TABLES.slice();
                else {
                    const n = +b.dataset.table, i = S.tables.indexOf(n);
                    if (i >= 0) S.tables.splice(i, 1); else S.tables.push(n);
                    S.tables.sort((x, y) => x - y);
                }
                sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-limit]').forEach(b => b.addEventListener('click', () => {
                S.limit = +b.dataset.limit; sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
                S[b.dataset.opt] = !S[b.dataset.opt]; sync(); saveSettings(S);
                if (b.dataset.opt === 'voice' && S.voice) speak('Lecture activée');
            }));

            // Spinners +/− avec appui long
            setupEl.querySelectorAll('[data-key]').forEach(input => {
                const key = input.dataset.key, min = +input.min, max = +input.max;
                const set = (v) => {
                    v = Math.max(min, Math.min(max, v | 0));
                    input.value = v; S[key] = v; saveSettings(S);
                };
                setupEl.querySelectorAll(`[data-spin="${key}"]`).forEach(b => {
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

        function validateSettings() {
            const setupEl = arena.querySelector('.bc-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.bc-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (!S.types.length) { warn('Choisissez au moins un type de calculs.'); return false; }
            if (S.types.length === 1 && S.types[0] === 'tables' && !S.tables.length) { warn('Choisissez au moins une table.'); return false; }
            if ((S.types.indexOf('add') >= 0 || S.types.indexOf('sub') >= 0) && S.addMin === 0 && S.addMax === 0) {
                warn('Indiquez un nombre maximum pour les additions et soustractions.'); return false;
            }
            saveSettings(S);
            return true;
        }

        // =====================================================================
        // ARÈNE DU DUEL
        // =====================================================================
        function buildDuel() {
            const half = (side) => `
                <div class="bc-half ${side}" data-side="${side}">
                    <div class="bc-phead">
                        <input class="bc-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="bc-pscore">${pts[side]}</div>
                    </div>
                    <div class="bc-choices" data-side="${side}">
                        <button class="bc-choice hidden" data-i="0">?</button>
                        <button class="bc-choice hidden" data-i="1">?</button>
                        <button class="bc-choice hidden" data-i="2">?</button>
                    </div>
                    <div class="bc-pkeys">clavier : ${KEYS[side].map(k => k.toUpperCase()).join(' / ')}</div>
                </div>`;
            arena.innerHTML = `
              <div class="bc-duel">
                <div class="bc-banner">
                    <div class="bc-calc wait">?</div>
                    <div class="bc-timebar"><i></i></div>
                </div>
                <div class="bc-field">
                    ${half('L')}
                    <div class="bc-mid"><small>Calcul</small><b data-role="round">0<small>/ ${series.length}</small></b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="bc-ready"></div>
              <div class="bc-overlay"><div class="bc-card"></div></div>`;

            arena.querySelectorAll('.bc-pname').forEach(inp => {
                const side = inp.closest('.bc-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.bc-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.bc-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.bc-choices[data-side="${side}"] .bc-choice`);
        const allChoices = () => arena.querySelectorAll('.bc-choice');
        const calcEl = () => arena.querySelector('.bc-calc');
        const readyEl = () => arena.querySelector('.bc-ready');
        const overlay = () => arena.querySelector('.bc-overlay');

        // Le calcul doit tenir dans le bandeau
        function fitCalc() {
            const c = calcEl();
            if (!c) return;
            c.style.fontSize = '';
            const banner = c.parentElement;
            const maxW = banner.clientWidth * 0.94;
            let fs = parseFloat(getComputedStyle(c).fontSize) || 54;
            for (let i = 0; i < 3 && c.scrollWidth > maxW && maxW > 0; i++) {
                fs = Math.max(14, fs * (maxW / c.scrollWidth));
                c.style.fontSize = fs + 'px';
            }
        }
        function calcHTML(it, withAns) {
            const ans = `<span class="bc-ans">${fmtInt(it.ans)}</span>`;
            if (it.html.indexOf('bc-q') >= 0) return withAns ? it.html.replace(Q, ans) : it.html;
            return it.html + ' = ' + (withAns ? ans : Q);
        }
        function revealAnswer() {
            const c = calcEl(), it = series[idx];
            c.className = 'bc-calc solved';
            c.innerHTML = calcHTML(it, true);
            fitCalc();
            allChoices().forEach(b => { if (+b.dataset.v === it.ans && !b.classList.contains('ok')) b.classList.add('hint'); });
        }

        // ── Manche ─────────────────────────────────────────────────────────
        async function newRound() {
            const id = ++runId;
            state = 'wait';
            const it = series[idx];
            locked = { L: false, R: false };
            arena.querySelectorAll('.bc-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'bc-choice hidden'; b.textContent = '?'; delete b.dataset.v; });
            const c = calcEl();
            c.className = 'bc-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.bc-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = `${idx + 1}<small>/ ${series.length}</small>`;
            // Petite attente aléatoire : impossible d'anticiper
            await wait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'bc-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            // Mêmes 3 réponses de chaque côté, mais dans un ordre différent
            ['L', 'R'].forEach(side => {
                const opts = shuffle(it.options.slice());
                choiceBtns(side).forEach((b, i) => {
                    b.dataset.v = opts[i];
                    b.textContent = fmtInt(opts[i]);
                    b.className = 'bc-choice appear';
                });
            });
            sfx('go');
            if (S.voice) speak(it.say);
            state = 'go';
            t0 = performance.now();
            runTimer(id);
        }
        function runTimer(id) {
            const limit = S.speed * 1000;
            const tb = arena.querySelector('.bc-timebar');
            const step = () => {
                if (id !== runId || state !== 'go' || !widget.isConnected) return;
                const k = Math.max(0, 1 - (performance.now() - t0) / limit);
                tb.firstElementChild.style.width = (k * 100) + '%';
                tb.classList.toggle('low', k < 0.3);
                if (k <= 0) { timeUp(id); return; }
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
        async function timeUp(id) {
            state = 'result';
            revealAnswer();
            sfx('miss');
            say(`⏱ Temps écoulé ! Personne ne marque. La réponse était <b>${fmtInt(series[idx].ans)}</b>.`);
            await wait(1800);
            if (id === runId) nextRound();
        }
        function nextRound() {
            idx++;
            if (idx >= series.length) duelEnd();
            else newRound();
        }

        // ── Réponses ───────────────────────────────────────────────────────
        async function answer(side, b) {
            if (state !== 'go' || locked[side] || b.dataset.v === undefined) return;
            const id = runId;
            const it = series[idx];
            const other = side === 'L' ? 'R' : 'L';
            if (+b.dataset.v === it.ans) {
                state = 'result';
                stopSpeech();
                pts[side]++;
                b.classList.add('ok');
                const half = arena.querySelector(`.bc-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.bc-pscore');
                sc.textContent = pts[side];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                revealAnswer();
                sfx(side === 'L' ? 'pointL' : 'pointR');
                const s = ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',');
                say(`${side === 'L' ? '🔵' : '🟠'} Point pour <b>${esc(names[side])}</b> en ${s} s ! ${calcHTML(it, true).replace(/<[^>]+>/g, '')}`, 'good');
                await wait(1400);
                if (id === runId) nextRound();
            } else {
                locked[side] = true;
                b.classList.add('ko');
                arena.querySelector(`.bc-half.${side}`).classList.add('lock');
                sfx('bad');
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour ce calcul !`, 'bad');
                if (locked[other]) {
                    state = 'result';
                    revealAnswer();
                    say(`😅 Les deux joueurs se sont trompés ! La réponse était <b>${fmtInt(it.ans)}</b>.`, 'bad');
                    await wait(1900);
                    if (id === runId) nextRound();
                }
            }
        }

        // ── Fin de duel ────────────────────────────────────────────────────
        function duelEnd() {
            state = 'over';
            runId++;
            stopSpeech();
            const ov = overlay();
            const tie = pts.L === pts.R;
            const w = pts.L > pts.R ? 'L' : 'R';
            const nb = series.length;
            ov.querySelector('.bc-card').innerHTML = tie ? `
                <div class="bc-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="bc-final"><span class="L">${pts.L}</span> – <span class="R">${pts.R}</span></div>
                <p class="bc-sub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} calculs.</p>
                <div class="bc-actions">
                    <button class="bc-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>` : `
                <div class="bc-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="bc-final"><span class="L">${pts.L}</span> – <span class="R">${pts.R}</span></div>
                <p class="bc-sub">sur ${nb} calculs</p>
                <div class="bc-actions">
                    <button class="bc-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            ov.classList.add('show');
            sfx('win'); party();
            say(tie
                ? `🤝 Égalité ${pts.L} à ${pts.R} ! Bravo à tous les deux.`
                : `🏆 Victoire de <b>${esc(names[w])}</b> ${pts.L} à ${pts.R} ! Bravo !`, 'good');
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
            updateButtons();
        }
        function party() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            for (let i = 0; i < 40; i++) {
                const c = document.createElement('i');
                c.style.left = (Math.random() * 100) + '%';
                c.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 2500);
        }

        // ── Démarrer / arrêter ─────────────────────────────────────────────
        function updateButtons() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            btn('start').textContent = playing ? '🔄 Recommencer' : '▶ Lancer le duel';
            btn('stop').disabled = !playing;
            btn('setup').disabled = state === 'setup';
        }
        async function start() {
            if (state === 'setup' && !validateSettings()) return;
            container.focus({ preventScroll: true });
            runId++;
            stopSpeech();
            series = generateSeries(S);
            idx = 0;
            pts = { L: 0, R: 0 };
            buildDuel();
            applyScale();
            state = 'wait';
            updateButtons();
            const r = readyEl();
            const id = runId;
            say(`⚡ ${series.length} calculs, ${S.speed} s chacun. Une erreur bloque ton côté : réfléchis avant de toucher !`);
            for (const t of ['3', '2', '1']) {
                r.textContent = t; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
                sfx('tick');
                await wait(600);
                if (id !== runId) return;
            }
            r.textContent = 'Battle !'; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
            await wait(500);
            if (id !== runId) return;
            r.classList.remove('show');
            newRound();
        }
        function showSetup(message) {
            runId++;
            stopSpeech();
            state = 'setup';
            buildSetup();
            updateButtons();
            requestAnimationFrame(applyScale);
            say(message || '⚔️ Choisissez les calculs, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau !');
        }
        btn('start').addEventListener('click', start);
        btn('setup').addEventListener('click', () => showSetup());
        btn('stop').addEventListener('click', () => {
            if (state !== 'wait' && state !== 'go' && state !== 'result') return;
            showSetup(`⏹ Duel arrêté (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)}).`);
        });

        // ── Clavier ────────────────────────────────────────────────────────
        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'INPUT' || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if ((k === 'enter' || k === ' ') && state === 'setup') { e.preventDefault(); start(); return; }
            ['L', 'R'].forEach(side => {
                const i = KEYS[side].indexOf(k);
                if (i >= 0) { const b = choiceBtns(side)[i]; if (b) { e.preventDefault(); answer(side, b); } }
            });
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
            if (state === 'wait' || state === 'go' || state === 'result') showSetup('⏹ Duel arrêté.');
            window._wfMiniBarCollapse(widget, '⚔️ Battle de calculs', { onExpand: applyScale });
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
            stopSpeech();
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
        container.querySelectorAll('.bc-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                const startX = clientX, startY = clientY;
                const startW = container.offsetWidth, startH = container.offsetHeight;
                const startL = widget.offsetLeft, startT = widget.offsetTop;
                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (dir.includes('e')) newW = Math.max(460, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(460, startW - dx); newL = startL + (startW - newW); }
                    if (dir.includes('s')) newH = Math.max(320, startH + dy);
                    if (dir.includes('n')) { newH = Math.max(320, startH - dy); newT = startT + (startH - newH); }
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
            if (e.target.closest && e.target.closest('button, select, input, .bc-arena, .bc-rh, .bc-help')) {
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

        // Nettoyage si le widget est retiré du tableau
        const obs = new MutationObserver(() => {
            if (!document.contains(widget)) { runId++; stopSpeech(); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            showSetup();
            applyScale();
            container.focus({ preventScroll: true });
            if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                wfMax.click();
            } else {
                const curW = window.innerWidth;
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }
        }));

        if (typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function hook(orig) {
        return function (type) {
            if (type === TYPE) return window.createBattleCalculsWidget();
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
