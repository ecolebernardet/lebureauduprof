// =========================================================================
// BATTLE HOMOPHONES — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Battles » — duel au TBI
//
// Deux élèves s'affrontent, un de chaque côté de l'écran (multi-touch).
// Une phrase à trou s'affiche en grand au centre : il faut toucher le bon
// homophone (a / à, et / est, son / sont, ces / ses / c'est…) plus vite
// que l'adversaire. Les boutons proposent les 2 ou 3 formes du groupe,
// mélangées différemment de chaque côté.
//   • Le premier qui touche la bonne forme marque le point.
//   • Une erreur bloque son côté pour cette phrase (pas de clic au hasard !).
//   • Si personne ne répond dans le temps imparti, la réponse est montrée,
//     avec l'astuce pour ne plus se tromper (« on peut dire avait »…).
//
// 👤 Mode seul : N phrases chronométrées, points selon la rapidité,
//   série 🔥 et record (mémorisé sur l'ordinateur).
//
// Même moteur que les autres Battles : réglages (groupes d'homophones,
// secondes par phrase, nombre de phrases ou « premier à N points »,
// lecture à voix haute), liste d'élèves .txt avec tirage au sort et scores.
// La lecture à voix haute lit la phrase complète : les homophones se
// prononcent pareil, elle n'aide donc pas à trouver la réponse.
//
// Ouverture   : createWidget('battle-homophones')
// Sauvegarde  : widget._bhGetData()  → bhData dans save-load.js
// Restauration: createBattleHomophonesWidget(bhData)
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'battle-homophones';
    var SETTINGS_KEY = 'battle-homophones-settings';
    var CLASS_KEY = 'battle-homophones-classe';

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

    // ── CSS du jeu (préfixe bh-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-homophones-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-homophones-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-homophones"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .bh-container {
            --bh-s: 1;
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
            padding: calc(12px * var(--bh-s)) calc(14px * var(--bh-s)) calc(14px * var(--bh-s));
            border-radius: calc(24px * var(--bh-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--bh-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .bh-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .bh-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--bh-s));
            width: 100%; max-width: calc(732px * var(--bh-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .bh-header { display: flex; align-items: center; gap: calc(10px * var(--bh-s)); cursor: move; }
        .bh-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--bh-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--bh-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .bh-icon-btn {
            width: calc(26px * var(--bh-s)); height: calc(26px * var(--bh-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--bh-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .bh-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .bh-arena {
            position: relative;
            min-height: calc(390px * var(--bh-s));
            border-radius: calc(18px * var(--bh-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .bh-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bh-s)), transparent calc(2px * var(--bh-s))) 0 0 / calc(24px * var(--bh-s)) calc(24px * var(--bh-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bh-s));
            box-sizing: border-box;
            padding: calc(10px * var(--bh-s)) calc(14px * var(--bh-s)) calc(14px * var(--bh-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--bh-s));
            color: #fff;
        }
        .bh-label {
            font-size: calc(13px * var(--bh-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--bh-s));
        }
        .bh-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--bh-s)); justify-content: center; }
        .bh-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--bh-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--bh-s)); height: calc(52px * var(--bh-s)); padding: 0 calc(8px * var(--bh-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--bh-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .bh-type .bh-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--bh-s)); }
        .bh-type:hover { background: rgba(255,255,255,0.14); }
        .bh-type:active { transform: scale(0.95); }
        .bh-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bh-small {
            min-width: calc(40px * var(--bh-s)); height: calc(38px * var(--bh-s)); padding: 0 calc(8px * var(--bh-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--bh-s));
            display: flex; align-items: center; justify-content: center;
        }
        .bh-small.bh-mode { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--bh-s)); padding: 0 calc(14px * var(--bh-s)); }
        .bh-hide { display: none !important; }
        [data-modebox] { display: flex; }
        .bh-small.bh-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--bh-s)); }
        .bh-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bh-sub { display: none; }
        .bh-sub.visible { display: block; }

        .bh-params { display: flex; gap: calc(20px * var(--bh-s)); justify-content: center; flex-wrap: wrap; }
        .bh-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .bh-spinner-label { font-size: calc(11px * var(--bh-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .bh-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--bh-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--bh-s)) 0 #B9B2D6;
        }
        .bh-spinner-btn {
            width: calc(34px * var(--bh-s)); height: calc(42px * var(--bh-s)); border: none; background: transparent;
            font-size: calc(20px * var(--bh-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .bh-spinner-btn:hover { background: #F1EDFB; }
        .bh-spinner-val {
            width: calc(56px * var(--bh-s)); height: calc(42px * var(--bh-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--bh-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .bh-spinner-val::-webkit-inner-spin-button,
        .bh-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bh-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--bh-s)) calc(14px * var(--bh-s));
            font-family: inherit; font-size: calc(12px * var(--bh-s)); font-weight: 800; color: #fff;
        }
        .bh-toggle .bh-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .bh-toggle.on { border-color: var(--or); }
        .bh-toggle.on .bh-dot { background: var(--or); }
        .bh-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--bh-s)); font-weight: 900; min-height: calc(16px * var(--bh-s)); }

        /* ══ DUEL ══ */
        .bh-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--bh-s)); background: #1B1433; }
        .bh-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bh-s)), transparent calc(2px * var(--bh-s))) 0 0 / calc(24px * var(--bh-s)) calc(24px * var(--bh-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--bh-s)) calc(12px * var(--bh-s)) calc(10px * var(--bh-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--bh-s));
        }
        .bh-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--bh-s));
            padding: calc(6px * var(--bh-s)) calc(26px * var(--bh-s));
            min-width: calc(260px * var(--bh-s)); min-height: calc(72px * var(--bh-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--bh-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bh-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .bh-calc.wait { color: #D9D2EE; }
        .bh-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--bh-s)) 0 #1C8A4F; }
        .bh-calc .bh-ans { color: #1C8A4F; }
        .bh-calc { gap: 0.25em; font-variant-numeric: normal; }
        .bh-kind {
            display: inline-flex; align-items: center; gap: 0.2em;
            font-family: 'Nunito', sans-serif; font-weight: 900; text-transform: uppercase;
            font-size: 0.36em; letter-spacing: 0.05em; line-height: 1;
            padding: 0.35em 0.6em; border-radius: 999px; color: #fff;
        }
        .bh-kind.syn { background: #14A38B; box-shadow: 0 0.12em 0 #0B6E5D; }
        .bh-kind.ant { background: #D6336C; box-shadow: 0 0.12em 0 #9A1E4C; }
        .bh-kind i { font-style: normal; font-size: 1.35em; }
        .bh-word { white-space: nowrap; }
        .bh-arrow { color: #B9B2D6; font-size: 0.7em; }
        .bh-choice { font-size: calc(30px * var(--bh-s)); padding: 0 calc(10px * var(--bh-s)); box-sizing: border-box; font-variant-numeric: normal; overflow: hidden; }
        .bh-type .bh-type-ico.syn { color: #7CF0D9; }
        .bh-type .bh-type-ico.ant { color: #FF9EC0; }
        .bh-type.on .bh-type-ico.syn, .bh-type.on .bh-type-ico.ant { color: var(--encre); }
        .bh-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .bh-calc .bh-q { font-size: 0.9em; }
        .bh-timebar {
            width: 70%; height: calc(10px * var(--bh-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .bh-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .bh-timebar.low i { background: var(--rouge); }

        .bh-field { flex: 1; display: grid; grid-template-columns: 1fr calc(64px * var(--bh-s)) 1fr; }
        .bh-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--bh-s));
            padding: calc(10px * var(--bh-s)) calc(10px * var(--bh-s)) calc(12px * var(--bh-s));
            transition: box-shadow .2s;
        }
        .bh-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bh-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bh-half.win { box-shadow: inset 0 0 0 calc(6px * var(--bh-s)) #7CFFB2; }
        .bh-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--bh-s));
            background: rgba(42,31,74,0.5);
        }
        .bh-phead { display: flex; align-items: center; gap: calc(10px * var(--bh-s)); }
        .bh-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--bh-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--bh-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--bh-s)); text-align: center;
        }
        @keyframes bh-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .bh-pscore.bump { animation: bh-bump .4s ease; }
        .bh-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bh-s));
            width: calc(150px * var(--bh-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--bh-s)) calc(8px * var(--bh-s));
            user-select: text;
        }
        .bh-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .bh-choices { display: flex; flex-direction: column; gap: calc(9px * var(--bh-s)); width: 100%; align-items: center; }
        .bh-choice {
            width: 86%; height: calc(62px * var(--bh-s));
            border: none; border-radius: calc(18px * var(--bh-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--bh-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bh-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .bh-choice:hover { background: #FFF3C4; }
        .bh-choice:active { transform: translateY(calc(4px * var(--bh-s))); box-shadow: 0 calc(2px * var(--bh-s)) 0 #B9B2D6; }
        .bh-choice.hidden { color: #D9D2EE; }
        .bh-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--bh-s)) 0 #1C8A4F; }
        .bh-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--bh-s)) 0 #B32B38; }
        .bh-choice.hint { box-shadow: 0 0 0 calc(5px * var(--bh-s)) #7CFFB2, 0 calc(6px * var(--bh-s)) 0 #B9B2D6; }
        @keyframes bh-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .bh-choice.ko { animation: bh-shake .4s ease; }
        @keyframes bh-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .bh-choice.appear, .bh-calc.appear { animation: bh-pop .25s ease-out; }
        .bh-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--bh-s)); }

        .bh-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--bh-s)); color: #fff;
        }
        .bh-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--bh-s)); color: var(--or); line-height: 1; text-align: center; }
        .bh-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--bh-s)); color: rgba(255,255,255,0.6); }
        .bh-mid > small { font-size: calc(10px * var(--bh-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .bh-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--bh-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--bh-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .bh-ready.show { display: flex; animation: bh-pop .3s ease-out; }

        /* ── Actions ── */
        .bh-actions { display: flex; gap: calc(8px * var(--bh-s)); justify-content: center; flex-wrap: wrap; }
        .bh-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bh-s));
            padding: calc(8px * var(--bh-s)) calc(14px * var(--bh-s));
            border-radius: calc(14px * var(--bh-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--bh-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .bh-btn:hover { filter: brightness(1.05); }
        .bh-btn:active { transform: translateY(calc(4px * var(--bh-s))); box-shadow: 0 calc(1px * var(--bh-s)) 0 #B9B2D6; }
        .bh-btn:disabled { opacity: 0.45; cursor: default; }
        .bh-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--bh-s));
            padding: calc(8px * var(--bh-s)) calc(22px * var(--bh-s));
            box-shadow: 0 calc(5px * var(--bh-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .bh-btn-go:active { box-shadow: 0 calc(1px * var(--bh-s)) 0 #1C8A4F; }
        .bh-btn:focus-visible, .bh-choice:focus-visible, .bh-type:focus-visible, .bh-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .bh-talk { display: flex; align-items: center; gap: calc(10px * var(--bh-s)); }
        .bh-chef {
            width: calc(44px * var(--bh-s)); height: calc(44px * var(--bh-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--bh-s));
            box-shadow: 0 calc(3px * var(--bh-s)) 0 #B3840B;
        }
        @keyframes bh-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--bh-s))) rotate(-8deg); } }
        .bh-chef.hop { animation: bh-hop .4s ease; }
        .bh-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--bh-s));
            padding: calc(8px * var(--bh-s)) calc(12px * var(--bh-s));
            font-weight: 700; font-size: calc(15px * var(--bh-s)); line-height: 1.35;
            min-height: calc(22px * var(--bh-s));
            border-left: calc(6px * var(--bh-s)) solid var(--or);
        }
        .bh-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .bh-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .bh-msg b { font-weight: 900; }

        /* ── Pause ── */
        .bh-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.92); cursor: pointer;
            border-radius: inherit;
        }
        .bh-pause.show { display: flex; animation: bh-pop .25s ease-out; }
        .bh-pause-card {
            text-align: center; color: #fff;
            font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--bh-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--bh-s)) 0 rgba(0,0,0,0.35);
        }
        .bh-pause-card small {
            display: block; margin-top: calc(8px * var(--bh-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--bh-s)); opacity: 0.8; text-shadow: none;
        }
        .bh-btn[hidden] { display: none; }
        .bh-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--bh-s)) 0 #B3840B; }

        /* ── Panneau élèves ── */
        .bh-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .bh-class.show { display: flex; }
        .bh-class-head { display: flex; align-items: baseline; gap: 8px; }
        .bh-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .bh-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .bh-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .bh-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px;
            background: #EFEAFB; color: var(--encre);
        }
        .bh-class-tools button:hover { background: #E1D8F8; }
        .bh-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .bh-class-tools button.go { background: var(--or); }
        .bh-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .bh-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .bh-st {
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 4px 8px; border-radius: 9px; background: #F7F4FE;
        }
        .bh-st:hover { background: #EFEAFB; }
        .bh-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bh-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .bh-st.played .bh-st-name::before { content: '✔ '; color: var(--vert); }
        .bh-st.absent { opacity: 0.45; }
        .bh-st.absent .bh-st-name { text-decoration: line-through; }
        .bh-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .bh-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .bh-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .bh-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff;
            background: #8C82AE;
        }
        .bh-sc.win { background: var(--vert); }
        .bh-sc.lose { background: var(--rouge); }
        .bh-sc.tie { background: #E0A800; }
        .bh-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }
        .bh-icon-btn.on { background: var(--or); color: var(--encre); }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .bh-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .bh-container.bh-has-sides .bh-side { display: flex; }
        .bh-side-title {
            font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or);
            text-align: center; line-height: 1.1; margin-bottom: 2px;
        }
        .bh-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
        .bh-side .bh-st {
            background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em;
            border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0;
        }
        .bh-side .bh-st:hover { background: rgba(255,255,255,0.18); }
        .bh-side .bh-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .bh-side .bh-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .bh-side .bh-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .bh-side .bh-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .bh-side .bh-st.played .bh-st-name::before { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .bh-draw {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bh-s)), transparent calc(2px * var(--bh-s))) 0 0 / calc(24px * var(--bh-s)) calc(24px * var(--bh-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bh-s)); box-sizing: border-box;
            padding: calc(16px * var(--bh-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--bh-s)); color: #fff;
        }
        .bh-draw-title {
            font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--bh-s)); color: var(--or);
            text-shadow: 0 calc(3px * var(--bh-s)) 0 #B3470F;
        }
        .bh-draw-row { display: flex; align-items: center; gap: calc(14px * var(--bh-s)); width: 100%; justify-content: center; }
        .bh-draw-card {
            flex: 1; max-width: calc(290px * var(--bh-s));
            border-radius: calc(20px * var(--bh-s));
            padding: calc(14px * var(--bh-s)) calc(10px * var(--bh-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bh-s)) 0 rgba(0,0,0,0.3);
        }
        .bh-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bh-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bh-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--bh-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .bh-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(34px * var(--bh-s)); line-height: 1.1; margin-top: calc(4px * var(--bh-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--bh-s)) 0 rgba(0,0,0,0.25);
        }
        .bh-draw-card b.rolling { opacity: 0.75; }
        .bh-draw-card b.done { animation: bh-pop .35s ease-out; }
        .bh-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(36px * var(--bh-s)); color: var(--or); text-shadow: 0 calc(3px * var(--bh-s)) 0 #B3470F; }
        .bh-draw-info { font-weight: 800; font-size: calc(13px * var(--bh-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }
        .bh-card .bh-rec { font-size: calc(12px * var(--bh-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--bh-s)); }
        .bh-card .bh-final span { display: inline-block; vertical-align: top; }
        .bh-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--bh-s)); }

        /* ── Fin de partie ── */
        .bh-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .bh-overlay.show { display: flex; }
        .bh-card {
            background: #fff; border-radius: calc(18px * var(--bh-s));
            padding: calc(12px * var(--bh-s)) calc(24px * var(--bh-s)) calc(14px * var(--bh-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bh-s)) 0 #B9B2D6;
            animation: bh-pop .35s ease-out; max-width: 90%;
        }
        .bh-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bh-s)); color: var(--encre); }
        .bh-card p { margin: calc(4px * var(--bh-s)) 0 calc(8px * var(--bh-s)); font-weight: 800; font-size: calc(15px * var(--bh-s)); }
        .bh-card .bh-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--bh-s)); margin: calc(2px * var(--bh-s)) 0; }
        .bh-card .bh-final .L { color: #1F6FB5; } .bh-card .bh-final .R { color: #E0620F; }
        .bh-card .bh-sub { display: block; font-size: calc(12px * var(--bh-s)); color: #6A5E8E; margin-top: calc(-4px * var(--bh-s)); }
        .bh-medal { font-size: calc(54px * var(--bh-s)); line-height: 1; animation: bh-pop .5s ease-out; }
        .bh-card .bh-actions { margin-top: calc(4px * var(--bh-s)); }

        /* ── Statistiques (mode seul) ── */
        .bh-stats { display: flex; gap: calc(6px * var(--bh-s)); align-items: center; }
        .bh-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--bh-s)) calc(10px * var(--bh-s));
            font-weight: 900; font-size: calc(14px * var(--bh-s)); white-space: nowrap;
        }
        .bh-chip.hot { background: #FF7A1A; }
        .bh-chip.bump { animation: bh-bump .4s ease; }
        .bh-container.duel .bh-stats { display: none; }
        .bh-container:not(.duel) [data-role="class"] { display: none; }

        /* ── Mode seul ── */
        .bh-field.solo { display: flex; }
        .bh-half.S {
            flex: 1; gap: calc(14px * var(--bh-s));
            background: linear-gradient(160deg, #2E2270 0%, #4A3399 100%);
        }
        .bh-half.S .bh-choices { flex-direction: row; justify-content: center; gap: calc(14px * var(--bh-s)); }
        .bh-half.S .bh-choice { width: calc(215px * var(--bh-s)); height: calc(100px * var(--bh-s)); font-size: calc(34px * var(--bh-s)); }
        .bh-sprog {
            color: #fff; font-weight: 900; font-size: calc(15px * var(--bh-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(4px * var(--bh-s)) calc(16px * var(--bh-s));
        }
        .bh-sprog b { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); }
        .bh-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--bh-s)); margin: calc(4px * var(--bh-s)) 0; }
        .bh-bigstars span { font-size: calc(34px * var(--bh-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .bh-bigstars span.on { opacity: 1; filter: none; animation: bh-pop .35s ease-out both; }
        .bh-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .bh-bigstars span.on:nth-child(3) { animation-delay: .4s; }

        /* ── Aide ── */
        .bh-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .bh-help.show { display: block; }
        .bh-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .bh-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .bh-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .bh-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: bh-fall 1.8s ease-in forwards; }
        @keyframes bh-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .bh-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .bh-container:hover .bh-rh { opacity: 1; }
        .bh-container.wf-fullboard .bh-rh { display: none; }
        .bh-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .bh-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .bh-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .bh-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .bh-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .bh-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .bh-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .bh-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        /* ── Homophones : phrase à trou ── */
        .bh-calc {
            font-family: 'Nunito', sans-serif; font-weight: 900;
            font-size: calc(34px * var(--bh-s)); gap: 0;
        }
        .bh-calc.wait { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(46px * var(--bh-s)); }
        .bh-sent { white-space: nowrap; }
        .bh-gap {
            display: inline-block; min-width: 2.4em; text-align: center;
            margin: 0 0.12em; padding: 0 0.2em; line-height: 1.15;
            color: #5B3FB0; background: #F1EDFB;
            border-bottom: 0.1em dashed #5B3FB0; border-radius: 0.18em 0.18em 0 0;
        }
        .bh-gap.done { color: #fff; background: var(--vert); border-bottom: 0.1em solid #1C8A4F; border-radius: 0.2em; }
        .bh-choice { font-size: calc(34px * var(--bh-s)); }
        .bh-half.S .bh-choice { font-size: calc(40px * var(--bh-s)); }
        .bh-type .bh-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(17px * var(--bh-s)); white-space: nowrap; }
        .bh-type { min-width: calc(92px * var(--bh-s)); height: calc(46px * var(--bh-s)); }

        @media (prefers-reduced-motion: reduce) {
            .bh-container *, .bh-container *::before, .bh-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // GROUPES D'HOMOPHONES ET BANQUE DE PHRASES
    // forms : les orthographes proposées (2 ou 3 boutons), avec l'astuce
    //         qui justifie chacune d'elles (affichée après la réponse).
    // items : la bonne forme est entre [crochets]. Si le trou est en début
    //         de phrase, les boutons sont affichés avec une majuscule.
    // =========================================================================
    var GROUPS = [
        { id: 'a', forms: [
            { f: 'a', why: 'c\'est le verbe <b>avoir</b>, on peut le remplacer par « avait »' },
            { f: 'à', why: 'on ne peut pas le remplacer par « avait »' } ],
          items: [
            'Léa [a] un nouveau vélo.', 'Il [a] mangé une pomme.', 'Mon chien [a] faim.',
            'Tom [a] perdu son bonnet.', 'Elle [a] deux petites sœurs.', 'Le bébé [a] sommeil.',
            'Ma voisine [a] un grand jardin.', 'Le maître [a] corrigé les cahiers.',
            'Nous allons [à] la piscine.', 'Il habite [à] Paris.', 'Je pense [à] toi.',
            'Le film commence [à] huit heures.', 'Elle parle [à] sa voisine.', 'Ils jouent [à] la marelle.',
            'J\'ai mangé une tarte [à] la fraise.', 'Mamie arrive [à] la gare.'
          ] },
        { id: 'et', forms: [
            { f: 'et', why: 'il relie deux mots ou deux idées, on peut dire « et puis »' },
            { f: 'est', why: 'c\'est le verbe <b>être</b>, on peut le remplacer par « était »' } ],
          items: [
            'Le ciel [est] bleu.', 'Mon frère [est] malade.', 'La porte [est] fermée.',
            'Ce gâteau [est] délicieux.', 'Elle [est] dans le jardin.', 'Paul [est] en retard.',
            'La soupe [est] trop chaude.', 'Mon chat [est] tout noir.',
            'Tom [et] Léa jouent ensemble.', 'J\'ai un chat [et] un chien.', 'Il mange [et] il boit.',
            'Le pain [et] le beurre sont sur la table.', 'Elle chante [et] elle danse.', 'Prends ta règle [et] ton crayon.',
            'Il fait beau [et] chaud.', 'Les filles [et] les garçons sortent.'
          ] },
        { id: 'son', forms: [
            { f: 'son', why: 'c\'est un déterminant devant un nom, on peut le remplacer par « mon »' },
            { f: 'sont', why: 'c\'est le verbe <b>être</b>, on peut le remplacer par « étaient »' } ],
          items: [
            'Les enfants [sont] contents.', 'Mes amis [sont] partis.', 'Les fleurs [sont] belles.',
            'Ils [sont] dans la cour.', 'Les pommes [sont] mûres.', 'Les volets [sont] fermés.',
            'Elles [sont] très fatiguées.',
            'Il range [son] cartable.', 'Elle promène [son] chien.', 'Léo a perdu [son] stylo.',
            'Marie lave [son] vélo.', '[Son] frère est très grand.', 'Le chat mange dans [son] bol.',
            'Tom fête [son] anniversaire.'
          ] },
        { id: 'on', forms: [
            { f: 'on', why: 'c\'est un pronom, on peut le remplacer par « il »' },
            { f: 'ont', why: 'c\'est le verbe <b>avoir</b>, on peut le remplacer par « avaient »' } ],
          items: [
            'Les élèves [ont] fini leurs exercices.', 'Mes parents [ont] une voiture rouge.', 'Ils [ont] froid.',
            'Les chats [ont] mangé leurs croquettes.', 'Elles [ont] gagné le match.', 'Les oiseaux [ont] fait un nid.',
            'Mes cousins [ont] un chien.',
            '[On] va au cinéma ce soir.', '[On] entend les oiseaux chanter.', 'Demain, [on] partira tôt.',
            'Ici, [on] parle français.', '[On] a sonné à la porte.', 'Le soir, [on] regarde les étoiles.',
            'Avec mes amis, [on] joue au ballon.'
          ] },
        { id: 'ou', forms: [
            { f: 'ou', why: 'il indique un choix, on peut le remplacer par « ou bien »' },
            { f: 'où', why: 'il indique un lieu ou un moment, on ne peut pas dire « ou bien »' } ],
          items: [
            'Tu veux du lait [ou] du jus ?', 'Il viendra lundi [ou] mardi.', 'Tu préfères le rouge [ou] le bleu ?',
            'Tu joues [ou] tu lis ?', 'Une pomme [ou] une poire ?', 'On ira à la mer [ou] à la montagne.',
            '[Où] est mon cahier ?', 'La ville [où] j\'habite est belle.', 'Je ne sais pas [où] il est.',
            '[Où] vas-tu ?', 'Le jour [où] il a neigé, nous avons fait un bonhomme.', 'Dis-moi [où] tu as caché la clé.'
          ] },
        { id: 'ce', forms: [
            { f: 'ce', why: 'il est devant un nom, on peut dire « ce … -là »' },
            { f: 'se', why: 'il est devant un verbe, on peut dire « je <b>me</b> » à la place' } ],
          items: [
            '[Ce] chien est gentil.', 'J\'aime beaucoup [ce] livre.', '[Ce] matin, il pleut.',
            'Regarde [ce] château !', 'Je veux [ce] gâteau.', '[Ce] garçon court vite.',
            'Il [se] lave les mains.', 'Elle [se] lève tôt.', 'Le chat [se] cache sous le lit.',
            'Ils [se] parlent souvent.', 'Tom [se] brosse les dents.', 'Le soleil [se] couche.'
          ] },
        { id: 'ces', forms: [
            { f: 'ces', why: 'il montre quelque chose, on peut dire « ces … -là »' },
            { f: 'ses', why: 'il indique à qui c\'est, on peut le remplacer par « mes »' },
            { f: 'c\'est', why: 'cela veut dire « cela est », on peut dire « c\'était »' } ],
          items: [
            '[Ces] fleurs sentent bon.', 'Regarde [ces] nuages !', 'J\'aime bien [ces] chaussures.',
            'Il range [ses] jouets.', 'Elle a oublié [ses] lunettes.', 'Tom invite [ses] amis.',
            '[C\'est] mon anniversaire.', '[C\'est] l\'heure de partir.', 'Regarde, [c\'est] un écureuil !',
            'Qui a fait [ces] dessins ?', 'Le chat lèche [ses] pattes.', 'Demain, [c\'est] mercredi.'
          ] },
        { id: 'la', forms: [
            { f: 'la', why: 'c\'est un déterminant ou un pronom, on peut dire « le » ou « une »' },
            { f: 'là', why: 'il indique un lieu, on peut le remplacer par « ici »' },
            { f: 'l\'a', why: 'on peut le remplacer par « l\'avait »' } ],
          items: [
            'Il ouvre [la] fenêtre.', 'Je vois [la] mer.', 'Tom [la] regarde jouer.',
            'Pose ton sac [là].', 'Viens [là] tout de suite !', 'Mon chat est [là], sous la table.',
            'Son vélo ? Il [l\'a] réparé.', 'Cette lettre, elle [l\'a] lue.', 'Le gâteau ? Léa [l\'a] mangé.',
            'Prends [la] balle rouge.', 'Je suis [là] pour t\'aider.', 'Ton livre, maman [l\'a] rangé.'
          ] },
        { id: 'mes', forms: [
            { f: 'mes', why: 'c\'est un déterminant devant un nom, on peut le remplacer par « tes »' },
            { f: 'mais', why: 'il marque une opposition, on peut le remplacer par « pourtant »' } ],
          items: [
            'Je range [mes] affaires.', 'J\'ai perdu [mes] clés.', '[Mes] parents sont gentils.',
            'Je lave [mes] mains.', 'J\'invite [mes] amis.',
            'Il pleut, [mais] il fait chaud.', 'Je voudrais venir, [mais] je suis malade.',
            'Il est petit [mais] rapide.', 'Elle a cherché, [mais] elle n\'a rien trouvé.', 'C\'est difficile [mais] amusant.'
          ] },
        { id: 'peu', forms: [
            { f: 'peu', why: 'il veut dire « pas beaucoup »' },
            { f: 'peut', why: 'c\'est le verbe <b>pouvoir</b> avec il, elle ou on : on peut dire « pouvait »' },
            { f: 'peux', why: 'c\'est le verbe <b>pouvoir</b> avec je ou tu : on peut dire « pouvais »' } ],
          items: [
            'Il [peut] venir demain.', 'Elle [peut] sauter très haut.', 'On [peut] jouer dehors.',
            'Je [peux] t\'aider.', 'Tu [peux] entrer.', 'Est-ce que je [peux] sortir ?',
            'Il mange très [peu].', 'J\'ai un [peu] froid.', 'Il reste [peu] de gâteau.',
            'Le bébé [peut] marcher seul.', 'Tu [peux] fermer la porte ?', 'Attends un [peu] !'
          ] },
        { id: 'leur', forms: [
            { f: 'leur', why: 'devant un verbe (« lui » au pluriel) ou devant un nom au singulier, il ne prend pas de s' },
            { f: 'leurs', why: 'il est devant un nom au pluriel, il prend un s' } ],
          items: [
            'Les enfants rangent [leurs] jouets.', 'Ils ont pris [leurs] vélos.', 'Elles lavent [leurs] mains.',
            'Mes voisins promènent [leur] chien.', 'Je [leur] donne un bonbon.', 'Le maître [leur] explique la leçon.',
            'Les oiseaux nourrissent [leurs] petits.', 'Mes cousins ont vendu [leur] maison.', 'Je [leur] écris une lettre.'
          ] },
        { id: 'quel', forms: [
            { f: 'quel', why: 'il est devant un nom masculin' },
            { f: 'quelle', why: 'il est devant un nom féminin' },
            { f: 'qu\'elle', why: 'on peut le remplacer par « qu\'il »' } ],
          items: [
            '[Quel] âge as-tu ?', '[Quel] beau temps !', 'Dans [quel] livre as-tu lu ça ?',
            '[Quelle] heure est-il ?', '[Quelle] belle robe !', 'De [quelle] couleur est ton vélo ?',
            'Je pense [qu\'elle] viendra.', 'Il faut [qu\'elle] se repose.', 'Je sais [qu\'elle] aime les chats.'
          ] }
    ];
    var GROUP_BY = {};
    GROUPS.forEach(function (g) {
        g.why = {};
        g.forms.forEach(function (x) { g.why[x.f] = x.why; });
        GROUP_BY[g.id] = g;
    });
    // =========================================================================
    // RÉGLAGES MÉMORISÉS
    // =========================================================================
    var DEFAULTS = { groups: ['a', 'et', 'son', 'on'], speed: 10, count: 10, mode: 'count', goal: 5, voice: false, players: 'duel' };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.groups = Array.isArray(r.groups) ? r.groups.filter(function (g) { return GROUP_BY[g]; }) : DEFAULTS.groups.slice();
                if (r.players !== 'solo') r.players = 'duel';
                return r;
            }
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {} }

    // =========================================================================
    // LISTE D'ÉLÈVES (fichier .txt « prénom;nom »)
    // Classe : { students: [{ id, prenom, nom, absent, scores: [{ pts, opp, adv }] }],
    //            played: [id…] (élèves déjà tirés dans le tour en cours) }
    // Si aucune liste n'est encore chargée ici, celle d'une autre Battle
    // est reprise (sans ses scores) pour éviter de la recharger.
    // =========================================================================
    function loadClass() {
        try {
            var c = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
            if (c && Array.isArray(c.students)) {
                c.played = Array.isArray(c.played) ? c.played : [];
                c.students.forEach(function (st) { if (!Array.isArray(st.scores)) st.scores = []; });
                return c;
            }
            var other = null;
            ['battle-synonymes-classe', 'battle-calculs-classe', 'battle-nature-mots-classe', 'jeu-plus-grand-classe'].some(function (k) {
                var o = JSON.parse(localStorage.getItem(k) || 'null');
                if (o && Array.isArray(o.students) && o.students.length) { other = o; return true; }
                return false;
            });
            if (other) {
                return {
                    students: other.students.map(function (st) {
                        return { id: st.id, prenom: st.prenom || '', nom: st.nom || '', absent: !!st.absent, scores: [] };
                    }),
                    played: []
                };
            }
        } catch (e) {}
        return { students: [], played: [] };
    }
    function saveClass(c) { try { localStorage.setItem(CLASS_KEY, JSON.stringify(c)); } catch (e) {} }
    function parseClassList(text) {
        var out = [];
        text.replace(/^﻿/, '').split(/\r\n|\r|\n/).forEach(function (line, i) {
            line = line.trim();
            if (!line) return;
            var parts = line.split(/[;\t,]/).map(function (x) { return x.trim().replace(/^"|"$/g, ''); });
            var prenom = parts[0] || '', nom = parts.slice(1).join(' ').trim();
            if (!prenom && !nom) return;
            if (i === 0 && /^pr[ée]nom$/i.test(prenom) && (!nom || /^nom$/i.test(nom))) return;
            out.push({ id: 'e' + Date.now().toString(36) + '_' + out.length, prenom: prenom, nom: nom, absent: false, scores: [] });
        });
        return out;
    }
    function fullName(st) { return (st.prenom + ' ' + st.nom).trim(); }


    // Analyse « Il [a] un vélo. » → { pre, ans, post } (ans = forme en minuscules)
    var ITEMS = [];
    GROUPS.forEach(function (g) {
        g.items.forEach(function (raw) {
            var m = raw.match(/^(.*?)\[(.+?)\](.*)$/);
            if (!m) return;
            var ans = m[2].toLowerCase();
            if (!g.why[ans]) { if (window.console) console.warn('[battle-homophones] forme inconnue :', raw); return; }
            ITEMS.push({
                grp: g, pre: m[1], ans: ans, post: m[3], key: g.id + '|' + raw,
                cap: m[1].trim() === '',
                options: g.forms.map(function (x) { return x.f; }),
                say: m[1] + m[2] + m[3]
            });
        });
    });
    // Forme affichée : majuscule si le trou est en début de phrase
    function dispForm(it, f) { return it.cap ? f.charAt(0).toUpperCase() + f.slice(1) : f; }

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    // Répartition équilibrée des groupes, en évitant deux fois le même à la suite
    function balancedGroups(groups, count) {
        var n = groups.length, base = Math.floor(count / n), rest = count % n;
        var extra = shuffle(groups.slice()).slice(0, rest);
        var pool = [];
        groups.forEach(function (g) {
            var k = base + (extra.indexOf(g) >= 0 ? 1 : 0);
            for (var i = 0; i < k; i++) pool.push(g);
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
    // Phrases déjà proposées : on évite de les reproposer tant qu'il en reste d'autres
    var _usedKeys = {};
    function generateSeries(s) {
        var list = [];
        balancedGroups(s.groups, s.count).forEach(function (gid) {
            var pool = ITEMS.filter(function (it) { return it.grp.id === gid; });
            var free = pool.filter(function (it) { return !_usedKeys[it.key]; });
            if (!free.length) {           // tout a été vu : on recommence pour ce groupe
                pool.forEach(function (it) { delete _usedKeys[it.key]; });
                free = pool;
            }
            // On tire d'abord la forme attendue, pour que chaque forme sorte aussi souvent
            var forms = shuffle(GROUP_BY[gid].forms.map(function (x) { return x.f; }));
            var it = null;
            for (var i = 0; i < forms.length && !it; i++) {
                var withForm = free.filter(function (x) { return x.ans === forms[i]; });
                if (withForm.length) it = pick(withForm);
            }
            it = it || pick(free);
            _usedKeys[it.key] = true;
            list.push(it);
        });
        return list;
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _bhAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_bhAudio) _bhAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _bhAudio, t0 = ctx.currentTime + start;
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
        star:  () => tone(1320, 0, 0.12, 'sine', 0.07),
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
    window.createBattleHomophonesWidget = function (savedData) {
        const restoring = !!savedData;
        if (!restoring && typeof snapshotNow === 'function') snapshotNow();
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
        container.className = 'bh-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="bh-inner">
            <div class="bh-header">
                <span class="bh-title">⚔️ Battle homophones</span>
                <div class="bh-stats">
                    <span class="bh-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="bh-chip" data-role="record" title="Record pour ces réglages (sur cet ordinateur)">🏆 0</span>
                    <span class="bh-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="bh-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="bh-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="bh-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="bh-arena"></div>

            <div class="bh-talk">
                <div class="bh-chef">⚔️</div>
                <div class="bh-msg"></div>
            </div>

            <div class="bh-actions">
                <button class="bh-btn bh-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="bh-btn" data-act="setup">⚙️ Réglages</button>
                <button class="bh-btn bh-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="bh-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="bh-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>👤 <b>Seul</b> : une série de phrases chronométrées. Touche le bon mot le plus vite possible pour gagner plus de points ! 🏆 Bats ton record.</p>
                <p>👥 <b>À deux</b> :</p>
                <p>Deux élèves au tableau, <b>un de chaque côté</b>. Une phrase à trou apparaît au milieu : il manque un <b>homophone</b> (des mots qui se prononcent pareil mais s'écrivent différemment).</p>
                <p>Chaque joueur touche la bonne orthographe de son côté (pas dans le même ordre que l'adversaire). Le premier qui trouve marque <b>1 point</b>.</p>
                <p>💡 Pense aux astuces : <b>a</b> → on peut dire « avait », <b>est</b> → « était », <b>sont</b> → « étaient », <b>ont</b> → « avaient »… L'astuce s'affiche après chaque phrase.</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour cette phrase : inutile de cliquer au hasard ! Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>Selon les réglages : celui qui a le plus de points à la fin de la série gagne, ou bien le <b>premier à atteindre</b> le nombre de points choisi.</p>
                <p>📂 Chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p style="margin:0">Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
            </div>
            <div class="bh-side bh-side-L"><div class="bh-side-title">📂 Élèves</div><div class="bh-side-list"></div></div>
            <div class="bh-side bh-side-R"><div class="bh-side-title">📂 Élèves</div><div class="bh-side-list"></div></div>
            <div class="bh-class">
                <div class="bh-class-head"><h4>📂 Élèves</h4><span class="bh-class-count"></span></div>
                <div class="bh-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="bh-class-list"></div>
                <p class="bh-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="bh-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="bh-confetti"></div>
            <div class="bh-rh bh-rh-nw" data-dir="nw"></div>
            <div class="bh-rh bh-rh-n"  data-dir="n"></div>
            <div class="bh-rh bh-rh-ne" data-dir="ne"></div>
            <div class="bh-rh bh-rh-e"  data-dir="e"></div>
            <div class="bh-rh bh-rh-se" data-dir="se"></div>
            <div class="bh-rh bh-rh-s"  data-dir="s"></div>
            <div class="bh-rh bh-rh-sw" data-dir="sw"></div>
            <div class="bh-rh bh-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.bh-inner');
        const arena    = $('.bh-arena');
        const msg      = $('.bh-msg');
        const chef     = $('.bh-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.bh-help');
        const confetti = $('.bh-confetti');
        const classBtn   = $('[data-role="class"]');
        const classBox   = $('.bh-class');
        const classList  = $('.bh-class-list');
        const classFile  = $('.bh-class-file');
        const sideL = $('.bh-side-L'), sideR = $('.bh-side-R');
        const clBtn = (a) => classBox.querySelector(`[data-cl="${a}"]`);
        const btn = (a) => container.querySelector(`[data-act="${a}"]`);
        const streakEl = $('[data-role="streak"]');
        const recordEl = $('[data-role="record"]');
        const scoreEl  = $('[data-role="score"]');

        // ── État ───────────────────────────────────────────────────────────
        let S = loadSettings();
        let state = 'setup';         // setup | draw | wait | go | result | over
        let runId = 0;
        let series = [], idx = 0, t0 = 0;
        let pts = { L: 0, R: 0 }, locked = { L: false, R: false };
        let names = { L: 'Joueur bleu', R: 'Joueur orange' };
        let CL = loadClass();
        let pair = null;              // { L: id, R: id } : élèves tirés au sort
        let rolling = false;          // animation de tirage en cours
        let soundOn = true;
        // Mode seul
        let good = 0, score = 0, streak = 0, times = [];
        const RECORD_KEY = 'battle-homophones-records';
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const isSolo = () => S.players === 'solo';
        // Un record par combinaison de réglages
        const recKey = () => [S.groups.slice().sort().join('+'), S.speed + 's', S.count].join('|');
        function updateStats(bump) {
            streakEl.textContent = '🔥 ' + streak;
            streakEl.classList.toggle('hot', streak >= 5);
            scoreEl.textContent = '⭐ ' + score;
            recordEl.textContent = '🏆 ' + (records[recKey()] || 0);
            if (bump) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
        }
        // Pause : une horloge qui s'arrête quand le jeu est en pause
        let paused = false, pauseStart = 0, pausedTotal = 0;
        const clock = () => performance.now() - pausedTotal - (paused ? performance.now() - pauseStart : 0);
        // Attente qui ne s'écoule pas pendant la pause
        const pwait = (ms) => new Promise(res => {
            const end = clock() + ms;
            const tick = () => {
                const left = end - clock();
                if (left <= 0) res();
                else setTimeout(tick, paused ? 100 : Math.min(left, 100));
            };
            tick();
        });
        const sfx = (name) => { if (soundOn && SFX[name]) SFX[name](); };

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 760;
        function applyScale() {
            const full = container.classList.contains('wf-fullboard');
            // Plein écran + liste chargée : la liste des élèves s'affiche à gauche et à droite
            const sides = full && !isSolo() && CL.students.length > 0;
            container.classList.toggle('bh-has-sides', sides);
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
                container.style.setProperty('--bh-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--bh-s', sc.toFixed(4));
            fitCalc();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'bh-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            const spinner = (label, key, min, max) => `
                <div class="bh-spinner">
                    <div class="bh-spinner-label">${label}</div>
                    <div class="bh-spinner-inner">
                        <button class="bh-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="bh-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="bh-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            const nb = (g) => ITEMS.filter(it => it.grp.id === g.id).length;
            const chip = (g) => `<button class="bh-type" data-grp="${g.id}" title="${nb(g)} phrases"><span class="bh-type-ico">${g.forms.map(f => esc(f.f)).join(' / ')}</span></button>`;
            arena.innerHTML = `
              <div class="bh-setup">
                <div class="bh-label">Nombre de joueurs</div>
                <div class="bh-chips">
                    <button class="bh-small bh-mode" data-players="solo">👤 Seul</button>
                    <button class="bh-small bh-mode" data-players="duel">👥 À deux (duel au tableau)</button>
                </div>
                <div class="bh-label">Homophones à travailler</div>
                <div class="bh-chips">${GROUPS.map(chip).join('')}</div>

                <div data-duelonly>
                <div class="bh-label">Qui gagne le duel ?</div>
                <div class="bh-chips">
                    <button class="bh-small bh-mode" data-mode="count" title="Le duel s'arrête après un nombre fixe de phrases">🔢 Le plus de points en N phrases</button>
                    <button class="bh-small bh-mode" data-mode="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                </div>
                </div>
                <div class="bh-params" style="margin-top:calc(6px * var(--bh-s))">
                    ${spinner('Secondes<br>par phrase', 'speed', 3, 60)}
                    <div data-modebox="count">${spinner('Nombre<br>de phrases', 'count', 3, 40)}</div>
                    <div data-modebox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="bh-chips" style="margin-top:calc(4px * var(--bh-s))">
                    <button class="bh-toggle" data-opt="voice"><span class="bh-dot"></span>🔊 Lire les phrases à voix haute</button>
                </div>
                <div class="bh-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.bh-setup');
            const sync = () => {
                setupEl.querySelectorAll('[data-grp]').forEach(b => b.classList.toggle('on', S.groups.indexOf(b.dataset.grp) >= 0));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
                const duel = S.players === 'duel';
                setupEl.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', b.dataset.players === S.players));
                setupEl.querySelectorAll('[data-duelonly]').forEach(el => el.classList.toggle('bh-hide', !duel));
                // En mode seul : uniquement « Nombre de phrases »
                setupEl.querySelectorAll('[data-modebox]').forEach(el => el.classList.toggle('bh-hide', el.dataset.modebox !== (duel ? S.mode : 'count')));
                container.classList.toggle('duel', duel);
                updateStats(false);
                setupEl.querySelector('.bh-warn').textContent = '';
            };

            const sortGroups = () => S.groups.sort((x, y) => GROUPS.indexOf(GROUP_BY[x]) - GROUPS.indexOf(GROUP_BY[y]));
            setupEl.querySelectorAll('[data-grp]').forEach(b => b.addEventListener('click', () => {
                const g = b.dataset.grp, i = S.groups.indexOf(g);
                if (i >= 0) S.groups.splice(i, 1); else S.groups.push(g);
                sortGroups(); sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
                S.mode = b.dataset.mode; sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-players]').forEach(b => b.addEventListener('click', () => {
                if (S.players === b.dataset.players) return;
                S.players = b.dataset.players; sync(); saveSettings(S);
                if (isSolo()) classBox.classList.remove('show');
                updateButtons();
                say(setupMsg());
                requestAnimationFrame(applyScale);
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
                    input.value = v; S[key] = v; saveSettings(S); updateStats(false);
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
            const setupEl = arena.querySelector('.bh-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.bh-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (!S.groups.length) { warn('Choisissez au moins un groupe d\'homophones.'); return false; }
            if (S.mode !== 'goal') S.mode = 'count';
            saveSettings(S);
            return true;
        }

        // =====================================================================
        // ÉLÈVES : liste, tirage au sort, scores
        // =====================================================================
        const hasClass = () => !isSolo() && CL.students.filter(st => !st.absent).length >= 2;
        const stById = (id) => CL.students.find(st => st.id === id);
        // Nom court pour le duel : « Prénom N. » (ou prénom seul)
        function shortName(st) {
            if (!st) return '';
            const n = st.nom ? ' ' + st.nom.charAt(0).toUpperCase() + '.' : '';
            return (st.prenom || st.nom) + n;
        }
        function renderClass() {
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            $('.bh-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué`
                : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            const playing = state === 'wait' || state === 'go' || state === 'result';
            clBtn('draw').disabled = !hasClass() || playing || rolling;
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && !isSolo() && CL.students.length > 0;
            if (wantSides !== container.classList.contains('bh-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="bh-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['bh-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (pair && pair.L === st.id) cls.push('cur-L');
                if (pair && pair.R === st.id) cls.push('cur-R');
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="bh-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = st.absent ? 'absent' : (pair && (pair.L === st.id || pair.R === st.id)) ? 'au tableau' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="bh-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="bh-st-state">${stateTxt}</span>` : ''}
                    <span class="bh-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('bh-has-sides')) return;
            const rows = classList.querySelectorAll('.bh-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.bh-side-list'), sideR.querySelector('.bh-side-list')];
            lists.forEach(l => { l.innerHTML = ''; });
            rows.forEach((r, i) => lists[i < half ? 0 : 1].appendChild(r.cloneNode(true)));
            layoutSides();
        }
        // Taille du texte adaptée au nombre d'élèves et à la hauteur disponible
        function layoutSides() {
            const n = Math.ceil(CL.students.length / 2) || 1;
            const h = sideL.clientHeight || (container.clientHeight - 28);
            const rowH = (h - 20 - 30) / n - 3;
            const fs = Math.max(10, Math.min(20, rowH * 0.52));
            [sideL, sideR].forEach(sd => {
                sd.querySelector('.bh-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.bh-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        [sideL, sideR].forEach(sd => {
            sd.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('.bh-st');
                if (row) toggleAbsent(row.dataset.id);
            });
        });
        classList.addEventListener('click', (e) => {
            const row = e.target.closest('.bh-st');
            if (row) toggleAbsent(row.dataset.id);
        });
        function toggleAbsent(id) {
            const st = stById(id);
            if (!st) return;
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (pair && (pair.L === st.id || pair.R === st.id) && (playing || rolling)) return;
            st.absent = !st.absent;
            if (st.absent && pair && (pair.L === st.id || pair.R === st.id)) {
                pair = null;
                if (state === 'draw') showDraw(true);
            }
            saveClass(CL); renderClass();
        }

        // Lecture du fichier (UTF-8, ou Windows-1252 pour les exports Excel)
        function readText(file, enc) {
            return new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(r.result);
                r.onerror = () => rej(r.error);
                r.readAsText(file, enc);
            });
        }
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
            const hasScores = CL.students.some(st => st.scores.length);
            if (hasScores && !confirm('Remplacer la liste actuelle ? Les scores enregistrés seront effacés.')) return;
            CL = { students: list, played: [] };
            pair = null;
            saveClass(CL);
            renderClass();
            classBox.classList.add('show');
            say(`✅ <b>${list.length} élèves</b> chargés ! Cliquez sur <b>🎲 Tirer au sort</b> ou <b>▶ Lancer le duel</b>.`, 'good');
            if (state === 'draw') showDraw(true);
        });

        // Choix de 2 élèves : d'abord ceux qui n'ont pas encore joué dans le tour
        function pickPair() {
            const present = CL.students.filter(st => !st.absent);
            let notice = '';
            let pool = present.filter(st => CL.played.indexOf(st.id) < 0);
            if (pool.length === 0) {
                CL.played = [];
                pool = present.slice();
                notice = '🔁 Tout le monde a joué : nouveau tour !';
            }
            shuffle(pool);
            let a = pool[0], b = pool[1];
            if (!b) {
                // Un seul élève n'a pas encore joué : son adversaire est repêché parmi les autres
                const others = shuffle(present.filter(st => st.id !== a.id));
                b = others[0];
                notice = `Dernier élève du tour : <b>${esc(shortName(b))}</b> est repêché pour l'affronter.`;
            }
            if (Math.random() < 0.5) { const t = a; a = b; b = t; }
            return { pair: { L: a.id, R: b.id }, notice };
        }
        function applyPairNames() {
            if (!pair) return;
            names.L = shortName(stById(pair.L)) || 'Joueur bleu';
            names.R = shortName(stById(pair.R)) || 'Joueur orange';
        }

        // Écran de tirage au sort
        function showDraw(roll) {
            if (!hasClass()) { showSetup(); return; }
            runId++;
            stopSpeech();
            resetPause();
            state = 'draw';
            arena.innerHTML = `
              <div class="bh-draw">
                <div class="bh-draw-title">🎲 Tirage au sort</div>
                <div class="bh-draw-row">
                    <div class="bh-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="bh-draw-vs">VS</div>
                    <div class="bh-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="bh-draw-info"></div>
                <div class="bh-actions">
                    <button class="bh-btn" data-dr="again">🎲 Nouveau tirage</button>
                </div>
              </div>`;
            arena.querySelector('[data-dr="again"]').addEventListener('click', () => { if (!rolling) { pair = null; showDraw(true); } });
            updateButtons();
            requestAnimationFrame(applyScale);
            if (roll || !pair || !stById(pair.L) || !stById(pair.R)) rollDraw();
            else finishDraw('');
        }
        function rollDraw() {
            const id = runId;
            const res = pickPair();
            const present = CL.students.filter(st => !st.absent);
            const elL = arena.querySelector('.bh-draw-card b[data-side="L"]');
            const elR = arena.querySelector('.bh-draw-card b[data-side="R"]');
            rolling = true;
            pair = null;
            updateButtons(); renderClass();
            say('🎲 Tirage au sort en cours…');
            let n = 0;
            const total = 14;
            const step = () => {
                if (id !== runId) return;
                if (n < total) {
                    [elL, elR].forEach(el => { el.classList.add('rolling'); el.textContent = shortName(pick(present)); });
                    if (n % 2 === 0) sfx('tick');
                    n++;
                    setTimeout(step, 50 + n * n);   // ralentit progressivement
                    return;
                }
                pair = res.pair;
                rolling = false;
                finishDraw(res.notice);
            };
            step();
        }
        function finishDraw(notice) {
            applyPairNames();
            const stL = stById(pair.L), stR = stById(pair.R);
            arena.querySelectorAll('.bh-draw-card b').forEach(el => {
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = el.dataset.side === 'L' ? shortName(stL) : shortName(stR);
                el.title = fullName(el.dataset.side === 'L' ? stL : stR);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.bh-draw-info');
            if (info) info.innerHTML = (notice ? notice + '<br>' : '') + `Déjà passés dans ce tour : ${played} / ${present.length}`;
            sfx('pointL');
            if (S.voice) speak(`${stL.prenom} contre ${stR.prenom}`);
            say(`🎲 <b>${esc(fullName(stL))}</b> 🔵 contre 🟠 <b>${esc(fullName(stR))}</b> ! Venez au tableau, puis <b>▶ Lancer le duel</b>.`, 'good');
            updateButtons(); renderClass();
        }
        // Enregistre le résultat du duel pour les deux élèves tirés au sort
        function recordDuel() {
            if (!pair) return false;
            const stL = stById(pair.L), stR = stById(pair.R);
            if (!stL || !stR) { pair = null; return false; }
            stL.scores.push({ pts: pts.L, opp: pts.R, adv: fullName(stR) });
            stR.scores.push({ pts: pts.R, opp: pts.L, adv: fullName(stL) });
            [stL.id, stR.id].forEach(id => { if (CL.played.indexOf(id) < 0) CL.played.push(id); });
            pair = null;
            saveClass(CL);
            renderClass();
            return true;
        }

        // =====================================================================
        // ARÈNE DU DUEL
        // =====================================================================
        function buildDuel() {
            const half = (side) => `
                <div class="bh-half ${side}" data-side="${side}">
                    <div class="bh-phead">
                        <input class="bh-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="bh-pscore">${pts[side]}</div>
                    </div>
                    <div class="bh-choices" data-side="${side}">
                        <button class="bh-choice hidden" data-i="0">?</button>
                        <button class="bh-choice hidden" data-i="1">?</button>
                        <button class="bh-choice hidden" data-i="2">?</button>
                    </div>
                    <div class="bh-pkeys">clavier : ${KEYS[side].map(k => k.toUpperCase()).join(' / ')}</div>
                </div>`;
            arena.innerHTML = `
              <div class="bh-duel">
                <div class="bh-banner">
                    <div class="bh-calc wait">?</div>
                    <div class="bh-timebar"><i></i></div>
                </div>
                <div class="bh-field">
                    ${half('L')}
                    <div class="bh-mid"><small>Phrase</small><b data-role="round">${roundLabel(0)}</b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="bh-ready"></div>
              <div class="bh-pause"><div class="bh-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bh-overlay"><div class="bh-card"></div></div>`;

            arena.querySelectorAll('.bh-pname').forEach(inp => {
                const side = inp.closest('.bh-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            arena.querySelector('.bh-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.bh-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.bh-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        // Arène du mode seul : la phrase en haut, les réponses en dessous
        function buildSolo() {
            arena.innerHTML = `
              <div class="bh-duel bh-solo">
                <div class="bh-banner">
                    <div class="bh-calc wait">?</div>
                    <div class="bh-timebar"><i></i></div>
                </div>
                <div class="bh-field solo">
                    <div class="bh-half S" data-side="S">
                        <div class="bh-sprog" data-role="round">${roundLabel(0)}</div>
                        <div class="bh-choices" data-side="S">
                            <button class="bh-choice hidden" data-i="0">?</button>
                            <button class="bh-choice hidden" data-i="1">?</button>
                            <button class="bh-choice hidden" data-i="2">?</button>
                        </div>
                        <div class="bh-pkeys">clavier : 1 / 2 / 3</div>
                    </div>
                </div>
              </div>
              <div class="bh-ready"></div>
              <div class="bh-pause"><div class="bh-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bh-overlay"><div class="bh-card"></div></div>`;
            arena.querySelector('.bh-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            arena.querySelectorAll('.bh-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    answer('S', b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.bh-choices[data-side="${side}"] .bh-choice`);
        const allChoices = () => arena.querySelectorAll('.bh-choice');
        const calcEl = () => arena.querySelector('.bh-calc');
        const readyEl = () => arena.querySelector('.bh-ready');
        const overlay = () => arena.querySelector('.bh-overlay');

        // Le mot et sa consigne doivent tenir dans le bandeau
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
        // Une seule <span> : dans un conteneur flex, les espaces autour du trou seraient perdus
        function calcHTML(it, withAns) {
            const gap = withAns
                ? `<span class="bh-gap done">${esc(dispForm(it, it.ans))}</span>`
                : `<span class="bh-gap">…</span>`;
            return `<span class="bh-sent">${esc(it.pre)}${gap}${esc(it.post)}</span>`;
        }
        // Astuce après la réponse : pourquoi cette orthographe
        function explainText(it) {
            return `On écrit <b>${esc(dispForm(it, it.ans))}</b> : ${it.grp.why[it.ans]}.`;
        }
        // Un mot trop long doit tenir dans son bouton
        function fitChoices() {
            allChoices().forEach(b => {
                b.style.fontSize = '';
                let fs = parseFloat(getComputedStyle(b).fontSize) || 30;
                const maxW = b.clientWidth - 8;
                for (let i = 0; i < 3 && b.scrollWidth > b.clientWidth && maxW > 0; i++) {
                    fs = Math.max(11, fs * (maxW / b.scrollWidth));
                    b.style.fontSize = fs + 'px';
                }
            });
        }
        function revealAnswer() {
            const c = calcEl(), it = series[idx];
            c.className = 'bh-calc solved';
            c.innerHTML = calcHTML(it, true);
            fitCalc();
            allChoices().forEach(b => { if (b.dataset.v === it.ans && !b.classList.contains('ok')) b.classList.add('hint'); });
        }

        // ── Manche ─────────────────────────────────────────────────────────
        async function newRound() {
            const id = ++runId;
            state = 'wait';
            const it = series[idx];
            locked = { L: false, R: false };
            arena.querySelectorAll('.bh-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'bh-choice hidden'; b.textContent = '?'; b.style.display = ''; delete b.dataset.v; });
            const c = calcEl();
            c.className = 'bh-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.bh-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = roundLabel(idx + 1);
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'bh-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            // Mêmes réponses (2 ou 3) de chaque côté, mais dans un ordre différent
            (isSolo() ? ['S'] : ['L', 'R']).forEach(side => {
                const opts = shuffle(it.options.slice());
                choiceBtns(side).forEach((b, i) => {
                    if (i >= opts.length) { b.style.display = 'none'; return; }
                    b.style.display = '';
                    b.dataset.v = opts[i];
                    b.textContent = dispForm(it, opts[i]);
                    b.className = 'bh-choice appear';
                });
                // Touches clavier : autant que de réponses proposées (2 ou 3)
                const pk = arena.querySelector(`.bh-half[data-side="${side}"] .bh-pkeys`);
                const keys = side === 'S' ? ['1', '2', '3'] : KEYS[side].map(k => k.toUpperCase());
                if (pk) pk.textContent = 'clavier : ' + keys.slice(0, opts.length).join(' / ');
            });
            fitChoices();
            sfx('go');
            if (S.voice) speak(it.say);
            state = 'go';
            t0 = clock();
            runTimer(id);
        }
        function runTimer(id) {
            const limit = S.speed * 1000;
            const tb = arena.querySelector('.bh-timebar');
            const step = () => {
                if (id !== runId || state !== 'go' || !widget.isConnected) return;
                const k = Math.max(0, 1 - (clock() - t0) / limit);
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
            if (isSolo()) {
                streak = 0; updateStats(false);
                say(`⏱ Trop tard ! ${explainText(series[idx])}`, 'bad');
            } else {
                say(`⏱ Temps écoulé ! Personne ne marque. ${explainText(series[idx])}`);
            }
            await pwait(1800);
            if (id === runId) nextRound();
        }
        const goalMode = () => S.mode === 'goal' && !isSolo();
        function roundLabel(n) {
            if (isSolo()) return `Phrase <b>${n}</b> / ${series.length}`;
            return goalMode() ? `${n}<small>1er à ${S.goal}</small>` : `${n}<small>/ ${series.length}</small>`;
        }
        function nextRound() {
            idx++;
            if (goalMode()) {
                // Série « sans fin » : on ajoute des phrases tant que personne n'a gagné
                if (idx >= series.length) series = series.concat(generateSeries(Object.assign({}, S, { count: 10 })));
                newRound();
                return;
            }
            if (idx >= series.length) { if (isSolo()) soloEnd(); else duelEnd(); }
            else newRound();
        }

        // ── Réponses ───────────────────────────────────────────────────────
        async function answer(side, b) {
            if (paused || state !== 'go' || locked[side] || b.dataset.v === undefined) return;
            if (isSolo()) { soloAnswer(b); return; }
            const id = runId;
            const it = series[idx];
            const other = side === 'L' ? 'R' : 'L';
            if (b.dataset.v === it.ans) {
                state = 'result';
                stopSpeech();
                pts[side]++;
                b.classList.add('ok');
                const half = arena.querySelector(`.bh-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.bh-pscore');
                sc.textContent = pts[side];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                revealAnswer();
                sfx(side === 'L' ? 'pointL' : 'pointR');
                const s = ((clock() - t0) / 1000).toFixed(1).replace('.', ',');
                const balle = goalMode() && pts[side] === S.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} Point pour <b>${esc(names[side])}</b> en ${s} s ! ${explainText(it)}${balle}`, 'good');
                await pwait(1400);
                if (id !== runId) return;
                if (goalMode() && pts[side] >= S.goal) duelEnd();
                else nextRound();
            } else {
                locked[side] = true;
                b.classList.add('ko');
                arena.querySelector(`.bh-half.${side}`).classList.add('lock');
                sfx('bad');
                // Pas d'explication ici : avec 2 formes, elle donnerait la réponse à l'adversaire
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour cette phrase !`, 'bad');
                if (locked[other]) {
                    state = 'result';
                    revealAnswer();
                    say(`😅 Les deux joueurs se sont trompés ! ${explainText(it)}`, 'bad');
                    await pwait(1900);
                    if (id === runId) nextRound();
                }
            }
        }

        // ── Mode seul : réponse et fin de partie ───────────────────────────
        async function soloAnswer(b) {
            const id = runId, it = series[idx];
            state = 'result';
            stopSpeech();
            const ms = clock() - t0;
            const ok = b.dataset.v === it.ans;
            if (ok) {
                good++; streak++;
                const gain = 10 + Math.round(Math.max(0, 1 - ms / (S.speed * 1000)) * 10) + (streak >= 5 ? 3 : 0);
                score += gain; times.push(ms);
                b.classList.add('ok');
                revealAnswer();
                sfx('good');
                say(`✅ ${pick(['Bravo', 'Exact', 'Super', 'Rapide', 'Bien vu'])} ! ${(ms / 1000).toFixed(2).replace('.', ',')} s · +${gain}${streak >= 5 ? ' 🔥' : ''} &nbsp;<small>${explainText(it)}</small>`, 'good');
            } else {
                streak = 0;
                b.classList.add('ko');
                revealAnswer();
                sfx('bad');
                say(`❌ Oups ! Pas <b>${esc(dispForm(it, b.dataset.v))}</b> ici. ${explainText(it)}`, 'bad');
            }
            updateStats(ok);
            await pwait(ok ? 1100 : 2400);
            if (id === runId) nextRound();
        }
        function soloEnd() {
            resetPause();
            state = 'over';
            runId++;
            stopSpeech();
            const n = series.length, ratio = n ? good / n : 0;
            const st = ratio >= 0.95 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
            const medal = st === 3 ? '🥇' : st === 2 ? '🥈' : st === 1 ? '🥉' : '🎈';
            const title = st === 3 ? 'As de l\'orthographe !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > 0 && score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) {} }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.bh-card').innerHTML = `
                <div class="bh-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="bh-bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${n} · ${score} points</p>
                <p class="bh-sub">${times.length ? `Temps moyen : ${avg} s` : 'Aucune bonne réponse'}${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="bh-actions">
                    <button class="bh-btn bh-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="bh-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            ov.classList.add('show');
            if (st >= 2 || isRec) { sfx('win'); party(); }
            [1, 2, 3].forEach(i => { if (i <= st) setTimeout(() => sfx('star'), 200 * i); });
            say(`🏁 Partie terminée : ${good} sur ${n}${times.length ? `, temps moyen ${avg} s` : ''}.${isRec ? ' Nouveau record 🏆 !' : ''}`, st >= 2 ? 'good' : '');
            ov.querySelector('[data-act="again"]').addEventListener('click', (e) => { e.stopPropagation(); start(); });
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
            updateButtons();
        }

        // ── Fin de duel ────────────────────────────────────────────────────
        function duelEnd() {
            resetPause();
            state = 'over';
            runId++;
            stopSpeech();
            const ov = overlay();
            const tie = pts.L === pts.R;
            const w = pts.L > pts.R ? 'L' : 'R';
            const nb = goalMode() ? idx + 1 : series.length;
            const recorded = recordDuel();
            const nextBtns = `
                <div class="bh-actions">
                    ${hasClass() ? '<button class="bh-btn bh-btn-go" data-act="next">🎲 Duel suivant</button>' : ''}
                    <button class="bh-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            const recTxt = recorded ? '<p class="bh-rec">✔ Scores ajoutés dans la liste 📂</p>' : '';
            ov.querySelector('.bh-card').innerHTML = tie ? `
                <div class="bh-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="bh-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bh-sub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} phrases.</p>
                ${recTxt}${nextBtns}` : `
                <div class="bh-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="bh-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bh-sub">sur ${nb} phrases</p>
                ${recTxt}${nextBtns}`;
            ov.classList.add('show');
            sfx('win'); party();
            say(tie
                ? `🤝 Égalité ${pts.L} à ${pts.R} ! Bravo à tous les deux.`
                : `🏆 Victoire de <b>${esc(names[w])}</b> ${pts.L} à ${pts.R} ! Bravo !`, 'good');
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
            const nx = ov.querySelector('[data-act="next"]');
            if (nx) nx.addEventListener('click', (e) => { e.stopPropagation(); showDraw(true); });
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
            btn('start').textContent = playing ? '🔄 Recommencer' : (isSolo() ? '▶ Jouer' : '▶ Lancer le duel');
            btn('stop').disabled = !playing;
            btn('setup').disabled = state === 'setup';
            // Pendant le duel : « Pause » à la place de « Réglages »
            btn('setup').hidden = playing;
            const pb = btn('pause');
            pb.hidden = !playing;
            pb.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
            pb.title = paused ? 'Reprendre le duel' : 'Mettre le duel en pause';
            pb.classList.toggle('on', paused);
            btn('start').disabled = rolling;
            renderClass();
        }
        function resetPause() {
            paused = false; pauseStart = 0; pausedTotal = 0;
            rolling = false;
            const p = arena.querySelector('.bh-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (!playing) return;
            const p = arena.querySelector('.bh-pause');
            if (!paused) {
                paused = true; pauseStart = performance.now();
                stopSpeech();
                if (p) p.classList.add('show');
                say(isSolo() ? '⏸ Pause. Clique sur <b>▶ Reprendre</b> pour continuer.' : '⏸ Duel en pause. Cliquez sur <b>▶ Reprendre</b> pour continuer.');
            } else {
                pausedTotal += performance.now() - pauseStart;
                paused = false;
                if (p) p.classList.remove('show');
                say(isSolo() ? `▶ C'est reparti ! (phrase ${idx + 1} / ${series.length} · ${score} points)`
                             : `▶ C'est reparti ! (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)})`);
                if (state === 'go' && S.voice && series[idx]) speak(series[idx].say);
            }
            updateButtons();
            container.focus({ preventScroll: true });
        }
        async function start() {
            if (rolling) return;
            if (state === 'setup' && !validateSettings()) return;
            // Classe chargée : on passe d'abord par l'écran de tirage au sort
            if (hasClass() && (state === 'setup' || state === 'over' || !pair)) {
                if (state !== 'draw' || !pair) { showDraw(!pair); return; }
            }
            if (pair) applyPairNames();
            container.focus({ preventScroll: true });
            runId++;
            stopSpeech();
            series = generateSeries(goalMode() ? Object.assign({}, S, { count: Math.max(10, S.goal * 2) }) : S);
            idx = 0;
            pts = { L: 0, R: 0 };
            paused = false; pauseStart = 0; pausedTotal = 0;
            good = 0; score = 0; streak = 0; times = [];
            if (isSolo()) buildSolo(); else buildDuel();
            updateStats(false);
            applyScale();
            state = 'wait';
            updateButtons();
            const r = readyEl();
            const id = runId;
            if (isSolo()) say(`⚡ ${series.length} phrases, ${S.speed} s par phrase : trouve la bonne orthographe !`);
            else say(`⚡ ${goalMode() ? `Le premier à ${S.goal} point${S.goal > 1 ? 's' : ''} gagne !` : `${series.length} phrases.`} ${S.speed} s par phrase. Une erreur bloque ton côté : réfléchis avant de toucher !`);
            for (const t of ['3', '2', '1']) {
                r.textContent = t; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
                sfx('tick');
                await pwait(600);
                if (id !== runId) return;
            }
            r.textContent = isSolo() ? 'Partez !' : 'Battle !'; r.classList.remove('show'); void r.offsetWidth; r.classList.add('show');
            await pwait(500);
            if (id !== runId) return;
            r.classList.remove('show');
            newRound();
        }
        function showSetup(message) {
            runId++;
            stopSpeech();
            resetPause();
            state = 'setup';
            if (isSolo()) classBox.classList.remove('show');
            buildSetup();
            updateButtons();
            requestAnimationFrame(applyScale);
            say(message || setupMsg());
        }
        function setupMsg() {
            if (isSolo()) return '⚔️ Choisis les homophones, puis clique sur <b>▶ Jouer</b> : complète la phrase avec la bonne orthographe !';
            return hasClass()
                ? `⚔️ Choisissez les homophones, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.`
                : '⚔️ Choisissez les homophones, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
        }
        btn('start').addEventListener('click', start);
        btn('setup').addEventListener('click', () => showSetup());
        btn('pause').addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
        btn('stop').addEventListener('click', () => {
            if (state !== 'wait' && state !== 'go' && state !== 'result') return;
            showSetup(isSolo() ? `⏹ Partie arrêtée (${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''}, ${score} points).`
                               : `⏹ Duel arrêté (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)}).`);
        });

        // ── Clavier ────────────────────────────────────────────────────────
        const onKey = (e) => {
            if (!widget.isConnected) { document.removeEventListener('keydown', onKey); return; }
            const ae = document.activeElement;
            if (!ae || !widget.contains(ae) || ae.tagName === 'INPUT' || ae.tagName === 'SELECT') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key.toLowerCase();
            if ((k === 'enter' || k === ' ') && (state === 'setup' || state === 'draw' || (state === 'over' && isSolo()))) { e.preventDefault(); start(); return; }
            if ((k === ' ' || k === 'escape') && (state === 'wait' || state === 'go' || state === 'result')) { e.preventDefault(); togglePause(); return; }
            if (isSolo()) {
                const i = ['1', '&', 'arrowleft'].indexOf(k) >= 0 ? 0 : ['2', 'é', 'arrowdown'].indexOf(k) >= 0 ? 1 : ['3', '"', 'arrowright'].indexOf(k) >= 0 ? 2 : -1;
                if (i >= 0) { const b = choiceBtns('S')[i]; if (b) { e.preventDefault(); answer('S', b); } }
                return;
            }
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
            if (typeof saveBoard === 'function') saveBoard();
        });
        helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpBox.classList.toggle('show'); classBox.classList.remove('show'); });
        classBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpBox.classList.remove('show');
            if (!CL.students.length) { classFile.click(); return; }
            renderClass();
            classBox.classList.toggle('show');
        });
        classBox.addEventListener('click', (e) => e.stopPropagation());
        clBtn('load').addEventListener('click', () => classFile.click());
        clBtn('draw').addEventListener('click', () => {
            if (state === 'setup' && !validateSettings()) return;
            classBox.classList.remove('show');
            pair = null;
            showDraw(true);
        });
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
            pair = null;
            names = { L: 'Joueur bleu', R: 'Joueur orange' };
            saveClass(CL); renderClass();
            if (state === 'draw') showSetup();
            say('🗑 Liste d\'élèves retirée.');
        });
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
            if (_isMax) setMax(false);
            if (state === 'wait' || state === 'go' || state === 'result' || state === 'draw') showSetup(isSolo() ? '⏹ Partie arrêtée.' : '⏹ Duel arrêté.');
            window._wfMiniBarCollapse(widget, '⚔️ Battle homophones', { onExpand: applyScale });
        });
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            setMax(!_isMax);
            if (typeof saveBoard === 'function') saveBoard();
        });
        function setMax(on) {
            if (on === _isMax) return;
            _isMax = on;
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
        }
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
        container.querySelectorAll('.bh-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .bh-arena, .bh-rh, .bh-help, .bh-class, .bh-side')) {
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

        // ── Sauvegarde / restauration (appelées par save-load.js) ──────────
        // Les réglages et la liste d'élèves sont déjà gardés en localStorage ;
        // ici on garde la fenêtre : taille, plein écran, son.
        widget._bhGetData = function () {
            return {
                soundOn,
                containerW: _isMax ? (_savedW || null) : (container.style.width || null),
                containerH: _isMax ? (_savedH || null) : (container.style.height || null),
                fullboard: _isMax
            };
        };
        if (restoring) {
            if (savedData.containerW) container.style.width  = savedData.containerW;
            if (savedData.containerH) container.style.height = savedData.containerH;
            if (savedData.soundOn === false) { soundOn = false; soundBtn.textContent = '🔇'; soundBtn.title = 'Activer le son'; }
        }

        board.appendChild(widget);
        if (!restoring && typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        if (typeof bringToFront === 'function') bringToFront(widget);
        if (typeof makeDraggable === 'function') makeDraggable(widget);
        if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            showSetup();
            applyScale();
            container.focus({ preventScroll: true });
            if (restoring) {
                if (savedData.fullboard) setMax(true);
            } else if ((typeof isPhoneScreen === 'function' && isPhoneScreen()) || (window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches) || (typeof isMobileBoardMode === 'function' && isMobileBoardMode())) {
                setMax(true);
            } else {
                const curW = window.innerWidth;
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }
        }));

        if (!restoring && typeof saveBoard === 'function') saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function hook(orig) {
        return function (type) {
            if (type === TYPE) return window.createBattleHomophonesWidget();
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
