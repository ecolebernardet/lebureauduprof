// =========================================================================
// BATTLE SYNONYMES / CONTRAIRES — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — duel au TBI
//
// Deux élèves s'affrontent, un de chaque côté de l'écran (multi-touch).
// Un mot s'affiche en grand au centre avec la consigne « Synonyme » ou
// « Contraire » ; chaque joueur dispose de 3 réponses possibles (mélangées
// différemment de chaque côté).
//   • Le premier qui touche la bonne réponse marque le point.
//   • Une erreur bloque son côté pour ce mot (pas de clic au hasard !).
//   • Si personne ne répond dans le temps imparti, la réponse est montrée.
//   • Le piège : parmi les intrus, il y a souvent le CONTRAIRE quand on
//     demande un synonyme (et inversement).
//
// 👤 Mode seul : N mots chronométrés, 3 réponses possibles, points selon
//   la rapidité, série 🔥 et record (mémorisé sur l'ordinateur).
//
// Même moteur que la Battle de calculs : réglages (synonymes / contraires,
// niveaux, secondes par mot, nombre de mots ou « premier à N points »,
// lecture à voix haute), liste d'élèves .txt avec tirage au sort et scores.
//
// Ouverture   : createWidget('battle-synonymes')
// Sauvegarde  : widget._bsGetData()  → bsData dans save-load.js
// Restauration: createBattleSynonymesWidget(bsData)
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'battle-synonymes';
    var SETTINGS_KEY = 'battle-synonymes-settings';
    var CLASS_KEY = 'battle-synonymes-classe';

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

    // ── CSS du jeu (préfixe bs-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-synonymes-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-synonymes-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-synonymes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .bs-container {
            --bs-s: 1;
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
            padding: calc(12px * var(--bs-s)) calc(14px * var(--bs-s)) calc(14px * var(--bs-s));
            border-radius: calc(24px * var(--bs-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--bs-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .bs-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .bs-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--bs-s));
            width: 100%; max-width: calc(732px * var(--bs-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .bs-header { display: flex; align-items: center; gap: calc(10px * var(--bs-s)); cursor: move; }
        .bs-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--bs-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--bs-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .bs-icon-btn {
            width: calc(26px * var(--bs-s)); height: calc(26px * var(--bs-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--bs-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .bs-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .bs-arena {
            position: relative;
            min-height: calc(390px * var(--bs-s));
            border-radius: calc(18px * var(--bs-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .bs-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bs-s)), transparent calc(2px * var(--bs-s))) 0 0 / calc(24px * var(--bs-s)) calc(24px * var(--bs-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bs-s));
            box-sizing: border-box;
            padding: calc(10px * var(--bs-s)) calc(14px * var(--bs-s)) calc(14px * var(--bs-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--bs-s));
            color: #fff;
        }
        .bs-label {
            font-size: calc(13px * var(--bs-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--bs-s));
        }
        .bs-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--bs-s)); justify-content: center; }
        .bs-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--bs-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--bs-s)); height: calc(52px * var(--bs-s)); padding: 0 calc(8px * var(--bs-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--bs-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .bs-type .bs-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--bs-s)); }
        .bs-type:hover { background: rgba(255,255,255,0.14); }
        .bs-type:active { transform: scale(0.95); }
        .bs-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bs-small {
            min-width: calc(40px * var(--bs-s)); height: calc(38px * var(--bs-s)); padding: 0 calc(8px * var(--bs-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--bs-s));
            display: flex; align-items: center; justify-content: center;
        }
        .bs-small.bs-mode { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--bs-s)); padding: 0 calc(14px * var(--bs-s)); }
        .bs-hide { display: none !important; }
        [data-modebox] { display: flex; }
        .bs-small.bs-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--bs-s)); }
        .bs-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bs-sub { display: none; }
        .bs-sub.visible { display: block; }

        .bs-params { display: flex; gap: calc(20px * var(--bs-s)); justify-content: center; flex-wrap: wrap; }
        .bs-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .bs-spinner-label { font-size: calc(11px * var(--bs-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .bs-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--bs-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--bs-s)) 0 #B9B2D6;
        }
        .bs-spinner-btn {
            width: calc(34px * var(--bs-s)); height: calc(42px * var(--bs-s)); border: none; background: transparent;
            font-size: calc(20px * var(--bs-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .bs-spinner-btn:hover { background: #F1EDFB; }
        .bs-spinner-val {
            width: calc(56px * var(--bs-s)); height: calc(42px * var(--bs-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--bs-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .bs-spinner-val::-webkit-inner-spin-button,
        .bs-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bs-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--bs-s)) calc(14px * var(--bs-s));
            font-family: inherit; font-size: calc(12px * var(--bs-s)); font-weight: 800; color: #fff;
        }
        .bs-toggle .bs-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .bs-toggle.on { border-color: var(--or); }
        .bs-toggle.on .bs-dot { background: var(--or); }
        .bs-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--bs-s)); font-weight: 900; min-height: calc(16px * var(--bs-s)); }

        /* ══ DUEL ══ */
        .bs-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--bs-s)); background: #1B1433; }
        .bs-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bs-s)), transparent calc(2px * var(--bs-s))) 0 0 / calc(24px * var(--bs-s)) calc(24px * var(--bs-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--bs-s)) calc(12px * var(--bs-s)) calc(10px * var(--bs-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--bs-s));
        }
        .bs-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--bs-s));
            padding: calc(6px * var(--bs-s)) calc(26px * var(--bs-s));
            min-width: calc(260px * var(--bs-s)); min-height: calc(72px * var(--bs-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--bs-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bs-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .bs-calc.wait { color: #D9D2EE; }
        .bs-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--bs-s)) 0 #1C8A4F; }
        .bs-calc .bs-ans { color: #1C8A4F; }
        .bs-calc { gap: 0.25em; font-variant-numeric: normal; }
        .bs-kind {
            display: inline-flex; align-items: center; gap: 0.2em;
            font-family: 'Nunito', sans-serif; font-weight: 900; text-transform: uppercase;
            font-size: 0.36em; letter-spacing: 0.05em; line-height: 1;
            padding: 0.35em 0.6em; border-radius: 999px; color: #fff;
        }
        .bs-kind.syn { background: #14A38B; box-shadow: 0 0.12em 0 #0B6E5D; }
        .bs-kind.ant { background: #D6336C; box-shadow: 0 0.12em 0 #9A1E4C; }
        .bs-kind i { font-style: normal; font-size: 1.35em; }
        .bs-word { white-space: nowrap; }
        .bs-arrow { color: #B9B2D6; font-size: 0.7em; }
        .bs-choice { font-size: calc(30px * var(--bs-s)); padding: 0 calc(10px * var(--bs-s)); box-sizing: border-box; font-variant-numeric: normal; overflow: hidden; }
        .bs-type .bs-type-ico.syn { color: #7CF0D9; }
        .bs-type .bs-type-ico.ant { color: #FF9EC0; }
        .bs-type.on .bs-type-ico.syn, .bs-type.on .bs-type-ico.ant { color: var(--encre); }
        .bs-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .bs-calc .bs-q { font-size: 0.9em; }
        .bs-timebar {
            width: 70%; height: calc(10px * var(--bs-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .bs-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .bs-timebar.low i { background: var(--rouge); }

        .bs-field { flex: 1; display: grid; grid-template-columns: 1fr calc(64px * var(--bs-s)) 1fr; }
        .bs-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--bs-s));
            padding: calc(10px * var(--bs-s)) calc(10px * var(--bs-s)) calc(12px * var(--bs-s));
            transition: box-shadow .2s;
        }
        .bs-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bs-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bs-half.win { box-shadow: inset 0 0 0 calc(6px * var(--bs-s)) #7CFFB2; }
        .bs-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--bs-s));
            background: rgba(42,31,74,0.5);
        }
        .bs-phead { display: flex; align-items: center; gap: calc(10px * var(--bs-s)); }
        .bs-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--bs-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--bs-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--bs-s)); text-align: center;
        }
        @keyframes bs-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .bs-pscore.bump { animation: bs-bump .4s ease; }
        .bs-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bs-s));
            width: calc(150px * var(--bs-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--bs-s)) calc(8px * var(--bs-s));
            user-select: text;
        }
        .bs-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .bs-choices { display: flex; flex-direction: column; gap: calc(9px * var(--bs-s)); width: 100%; align-items: center; }
        .bs-choice {
            width: 86%; height: calc(62px * var(--bs-s));
            border: none; border-radius: calc(18px * var(--bs-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--bs-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bs-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .bs-choice:hover { background: #FFF3C4; }
        .bs-choice:active { transform: translateY(calc(4px * var(--bs-s))); box-shadow: 0 calc(2px * var(--bs-s)) 0 #B9B2D6; }
        .bs-choice.hidden { color: #D9D2EE; }
        .bs-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--bs-s)) 0 #1C8A4F; }
        .bs-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--bs-s)) 0 #B32B38; }
        .bs-choice.hint { box-shadow: 0 0 0 calc(5px * var(--bs-s)) #7CFFB2, 0 calc(6px * var(--bs-s)) 0 #B9B2D6; }
        @keyframes bs-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .bs-choice.ko { animation: bs-shake .4s ease; }
        @keyframes bs-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .bs-choice.appear, .bs-calc.appear { animation: bs-pop .25s ease-out; }
        .bs-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--bs-s)); }

        .bs-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--bs-s)); color: #fff;
        }
        .bs-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--bs-s)); color: var(--or); line-height: 1; text-align: center; }
        .bs-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--bs-s)); color: rgba(255,255,255,0.6); }
        .bs-mid > small { font-size: calc(10px * var(--bs-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .bs-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--bs-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--bs-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .bs-ready.show { display: flex; animation: bs-pop .3s ease-out; }

        /* ── Actions ── */
        .bs-actions { display: flex; gap: calc(8px * var(--bs-s)); justify-content: center; flex-wrap: wrap; }
        .bs-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bs-s));
            padding: calc(8px * var(--bs-s)) calc(14px * var(--bs-s));
            border-radius: calc(14px * var(--bs-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--bs-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .bs-btn:hover { filter: brightness(1.05); }
        .bs-btn:active { transform: translateY(calc(4px * var(--bs-s))); box-shadow: 0 calc(1px * var(--bs-s)) 0 #B9B2D6; }
        .bs-btn:disabled { opacity: 0.45; cursor: default; }
        .bs-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--bs-s));
            padding: calc(8px * var(--bs-s)) calc(22px * var(--bs-s));
            box-shadow: 0 calc(5px * var(--bs-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .bs-btn-go:active { box-shadow: 0 calc(1px * var(--bs-s)) 0 #1C8A4F; }
        .bs-btn:focus-visible, .bs-choice:focus-visible, .bs-type:focus-visible, .bs-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .bs-talk { display: flex; align-items: center; gap: calc(10px * var(--bs-s)); }
        .bs-chef {
            width: calc(44px * var(--bs-s)); height: calc(44px * var(--bs-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--bs-s));
            box-shadow: 0 calc(3px * var(--bs-s)) 0 #B3840B;
        }
        @keyframes bs-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--bs-s))) rotate(-8deg); } }
        .bs-chef.hop { animation: bs-hop .4s ease; }
        .bs-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--bs-s));
            padding: calc(8px * var(--bs-s)) calc(12px * var(--bs-s));
            font-weight: 700; font-size: calc(15px * var(--bs-s)); line-height: 1.35;
            min-height: calc(22px * var(--bs-s));
            border-left: calc(6px * var(--bs-s)) solid var(--or);
        }
        .bs-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .bs-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .bs-msg b { font-weight: 900; }

        /* ── Pause ── */
        .bs-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.92); cursor: pointer;
            border-radius: inherit;
        }
        .bs-pause.show { display: flex; animation: bs-pop .25s ease-out; }
        .bs-pause-card {
            text-align: center; color: #fff;
            font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--bs-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--bs-s)) 0 rgba(0,0,0,0.35);
        }
        .bs-pause-card small {
            display: block; margin-top: calc(8px * var(--bs-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--bs-s)); opacity: 0.8; text-shadow: none;
        }
        .bs-btn[hidden] { display: none; }
        .bs-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--bs-s)) 0 #B3840B; }

        /* ── Panneau élèves ── */
        .bs-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .bs-class.show { display: flex; }
        .bs-class-head { display: flex; align-items: baseline; gap: 8px; }
        .bs-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .bs-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .bs-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .bs-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px;
            background: #EFEAFB; color: var(--encre);
        }
        .bs-class-tools button:hover { background: #E1D8F8; }
        .bs-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .bs-class-tools button.go { background: var(--or); }
        .bs-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .bs-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .bs-st {
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 4px 8px; border-radius: 9px; background: #F7F4FE;
        }
        .bs-st:hover { background: #EFEAFB; }
        .bs-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bs-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .bs-st.played .bs-st-name::before { content: '✔ '; color: var(--vert); }
        .bs-st.absent { opacity: 0.45; }
        .bs-st.absent .bs-st-name { text-decoration: line-through; }
        .bs-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .bs-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .bs-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .bs-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff;
            background: #8C82AE;
        }
        .bs-sc.win { background: var(--vert); }
        .bs-sc.lose { background: var(--rouge); }
        .bs-sc.tie { background: #E0A800; }
        .bs-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }
        .bs-icon-btn.on { background: var(--or); color: var(--encre); }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .bs-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .bs-container.bs-has-sides .bs-side { display: flex; }
        .bs-side-title {
            font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or);
            text-align: center; line-height: 1.1; margin-bottom: 2px;
        }
        .bs-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
        .bs-side .bs-st {
            background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em;
            border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0;
        }
        .bs-side .bs-st:hover { background: rgba(255,255,255,0.18); }
        .bs-side .bs-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .bs-side .bs-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .bs-side .bs-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .bs-side .bs-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .bs-side .bs-st.played .bs-st-name::before { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .bs-draw {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bs-s)), transparent calc(2px * var(--bs-s))) 0 0 / calc(24px * var(--bs-s)) calc(24px * var(--bs-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bs-s)); box-sizing: border-box;
            padding: calc(16px * var(--bs-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--bs-s)); color: #fff;
        }
        .bs-draw-title {
            font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--bs-s)); color: var(--or);
            text-shadow: 0 calc(3px * var(--bs-s)) 0 #B3470F;
        }
        .bs-draw-row { display: flex; align-items: center; gap: calc(14px * var(--bs-s)); width: 100%; justify-content: center; }
        .bs-draw-card {
            flex: 1; max-width: calc(290px * var(--bs-s));
            border-radius: calc(20px * var(--bs-s));
            padding: calc(14px * var(--bs-s)) calc(10px * var(--bs-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bs-s)) 0 rgba(0,0,0,0.3);
        }
        .bs-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bs-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bs-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--bs-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .bs-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(34px * var(--bs-s)); line-height: 1.1; margin-top: calc(4px * var(--bs-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--bs-s)) 0 rgba(0,0,0,0.25);
        }
        .bs-draw-card b.rolling { opacity: 0.75; }
        .bs-draw-card b.done { animation: bs-pop .35s ease-out; }
        .bs-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(36px * var(--bs-s)); color: var(--or); text-shadow: 0 calc(3px * var(--bs-s)) 0 #B3470F; }
        .bs-draw-info { font-weight: 800; font-size: calc(13px * var(--bs-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }
        .bs-card .bs-rec { font-size: calc(12px * var(--bs-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--bs-s)); }
        .bs-card .bs-final span { display: inline-block; vertical-align: top; }
        .bs-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--bs-s)); }

        /* ── Fin de partie ── */
        .bs-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .bs-overlay.show { display: flex; }
        .bs-card {
            background: #fff; border-radius: calc(18px * var(--bs-s));
            padding: calc(12px * var(--bs-s)) calc(24px * var(--bs-s)) calc(14px * var(--bs-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bs-s)) 0 #B9B2D6;
            animation: bs-pop .35s ease-out; max-width: 90%;
        }
        .bs-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bs-s)); color: var(--encre); }
        .bs-card p { margin: calc(4px * var(--bs-s)) 0 calc(8px * var(--bs-s)); font-weight: 800; font-size: calc(15px * var(--bs-s)); }
        .bs-card .bs-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--bs-s)); margin: calc(2px * var(--bs-s)) 0; }
        .bs-card .bs-final .L { color: #1F6FB5; } .bs-card .bs-final .R { color: #E0620F; }
        .bs-card .bs-sub { display: block; font-size: calc(12px * var(--bs-s)); color: #6A5E8E; margin-top: calc(-4px * var(--bs-s)); }
        .bs-medal { font-size: calc(54px * var(--bs-s)); line-height: 1; animation: bs-pop .5s ease-out; }
        .bs-card .bs-actions { margin-top: calc(4px * var(--bs-s)); }

        /* ── Statistiques (mode seul) ── */
        .bs-stats { display: flex; gap: calc(6px * var(--bs-s)); align-items: center; }
        .bs-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--bs-s)) calc(10px * var(--bs-s));
            font-weight: 900; font-size: calc(14px * var(--bs-s)); white-space: nowrap;
        }
        .bs-chip.hot { background: #FF7A1A; }
        .bs-chip.bump { animation: bs-bump .4s ease; }
        .bs-container.duel .bs-stats { display: none; }
        .bs-container:not(.duel) [data-role="class"] { display: none; }

        /* ── Mode seul ── */
        .bs-field.solo { display: flex; }
        .bs-half.S {
            flex: 1; gap: calc(14px * var(--bs-s));
            background: linear-gradient(160deg, #2E2270 0%, #4A3399 100%);
        }
        .bs-half.S .bs-choices { flex-direction: row; justify-content: center; gap: calc(14px * var(--bs-s)); }
        .bs-half.S .bs-choice { width: calc(215px * var(--bs-s)); height: calc(100px * var(--bs-s)); font-size: calc(34px * var(--bs-s)); }
        .bs-sprog {
            color: #fff; font-weight: 900; font-size: calc(15px * var(--bs-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(4px * var(--bs-s)) calc(16px * var(--bs-s));
        }
        .bs-sprog b { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); }
        .bs-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--bs-s)); margin: calc(4px * var(--bs-s)) 0; }
        .bs-bigstars span { font-size: calc(34px * var(--bs-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .bs-bigstars span.on { opacity: 1; filter: none; animation: bs-pop .35s ease-out both; }
        .bs-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .bs-bigstars span.on:nth-child(3) { animation-delay: .4s; }

        /* ── Aide ── */
        .bs-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .bs-help.show { display: block; }
        .bs-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .bs-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .bs-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .bs-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: bs-fall 1.8s ease-in forwards; }
        @keyframes bs-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .bs-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .bs-container:hover .bs-rh { opacity: 1; }
        .bs-container.wf-fullboard .bs-rh { display: none; }
        .bs-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .bs-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .bs-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .bs-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .bs-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .bs-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .bs-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .bs-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .bs-container *, .bs-container *::before, .bs-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // RÉGLAGES MÉMORISÉS
    // =========================================================================
    var DEFAULTS = { kinds: ['syn', 'ant'], levels: [1], speed: 10, count: 10, mode: 'count', goal: 5, voice: false, players: 'duel' };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.kinds = Array.isArray(r.kinds) ? r.kinds.filter(function (k) { return k === 'syn' || k === 'ant'; }) : DEFAULTS.kinds.slice();
                r.levels = Array.isArray(r.levels) ? r.levels.filter(function (l) { return l >= 1 && l <= 3; }) : DEFAULTS.levels.slice();
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
    // Si aucune liste n'est encore chargée ici, celle de la Battle de calculs
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
            var other = JSON.parse(localStorage.getItem('battle-calculs-classe') || 'null');
            if (other && Array.isArray(other.students) && other.students.length) {
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

    // =========================================================================
    // BANQUE DE MOTS
    // [niveau, nature, mot, [synonymes], [contraires], [proches facultatifs]]
    //   proches : mots de sens voisin qui ne doivent JAMAIS servir d'intrus
    //   (ils ne sont jamais proposés comme réponse non plus)
    //   niveau : 1 facile · 2 moyen · 3 difficile
    //   nature : adj · verbe · nom · adv (les intrus sont pris dans la même nature)
    // =========================================================================
    var WORDS = [
        // ── Facile ──
        [1, 'adj', 'content',   ['joyeux', 'heureux'], ['triste', 'mécontent'], ['amusant', 'drôle', 'comique', 'optimiste', 'confiant']],
        [1, 'adj', 'grand',     ['immense', 'haut'],   ['petit'], ['énorme', 'gigantesque', 'gros', 'minuscule', 'infime', 'mince', 'maigre']],
        [1, 'adj', 'rapide',    ['vif'],               ['lent'], ['agité']],
        [1, 'adj', 'chaud',     ['brûlant'],           ['froid']],
        [1, 'adj', 'beau',      ['joli'],              ['laid', 'moche']],
        [1, 'adj', 'propre',    ['net'],               ['sale']],
        [1, 'adj', 'facile',    ['simple'],            ['difficile', 'compliqué']],
        [1, 'adj', 'gentil',    ['aimable'],           ['méchant'], ['poli', 'courtois', 'généreux', 'charitable', 'impoli', 'grossier', 'égoïste', 'honnête']],
        [1, 'adj', 'fort',      ['puissant'],          ['faible'], ['solide', 'résistant', 'fragile', 'délicat', 'courageux', 'brave', 'vaillant']],
        [1, 'adj', 'riche',     ['fortuné'],           ['pauvre'], ['avare', 'radin', 'généreux']],
        [1, 'adj', 'plein',     ['rempli'],            ['vide'], ['abondant', 'copieux', 'rare']],
        [1, 'adj', 'calme',     ['tranquille'],        ['agité'], ['paisible', 'serein', 'silencieux', 'bruyant', 'sonore', 'reposé']],
        [1, 'adj', 'vieux',     ['âgé'],               ['jeune']],
        [1, 'adj', 'mouillé',   ['trempé'],            ['sec']],
        [1, 'adj', 'gros',      ['énorme'],            ['mince', 'maigre'], ['grand', 'immense', 'haut', 'petit', 'gigantesque', 'lourd', 'léger']],
        [1, 'verbe', 'commencer', ['débuter'],         ['finir', 'terminer'], ['avancer']],
        [1, 'verbe', 'monter',    ['grimper'],         ['descendre'], ['augmenter', 'accroître', 'diminuer', 'baisser', 'avancer', 'progresser', 'reculer']],
        [1, 'verbe', 'ouvrir',    [],                  ['fermer'], ['allumer', 'éteindre']],
        [1, 'verbe', 'aimer',     ['adorer'],          ['détester'], ['admirer', 'mépriser', 'accepter']],
        [1, 'verbe', 'gagner',    ['remporter'],       ['perdre'], ['réussir', 'échouer', 'rater']],
        [1, 'verbe', 'crier',     ['hurler'],          ['chuchoter']],
        [1, 'verbe', 'rire',      ['rigoler'],         ['pleurer']],
        [1, 'verbe', 'donner',    ['offrir'],          ['prendre', 'recevoir'], ['accepter', 'refuser']],
        [1, 'verbe', 'allumer',   [],                  ['éteindre']],
        [1, 'nom', 'début',       ['commencement'],    ['fin']],
        [1, 'nom', 'ami',         ['copain'],          ['ennemi']],
        [1, 'adv', 'vite',        ['rapidement'],      ['lentement']],

        // ── Moyen ──
        [2, 'adj', 'courageux',  ['brave', 'vaillant'], ['peureux', 'lâche'], ['audacieux', 'téméraire', 'imprudent', 'prudent', 'timide', 'réservé', 'fort', 'puissant']],
        [2, 'adj', 'généreux',   ['charitable'],        ['avare', 'égoïste']],
        [2, 'adj', 'étroit',     ['serré'],             ['large'], ['mince', 'maigre', 'petit']],
        [2, 'adj', 'léger',      [],                    ['lourd'], ['mince', 'maigre', 'gros', 'énorme', 'fragile', 'délicat']],
        [2, 'adj', 'sombre',     ['obscur'],            ['clair', 'lumineux'], ['limpide', 'transparent', 'trouble', 'triste', 'beau']],
        [2, 'adj', 'ancien',     ['vieux'],             ['moderne', 'récent']],
        [2, 'adj', 'poli',       ['courtois'],          ['impoli', 'grossier']],
        [2, 'adj', 'honnête',    ['loyal'],             ['malhonnête']],
        [2, 'adj', 'fatigué',    ['épuisé'],            ['reposé'], ['paresseux', 'fainéant']],
        [2, 'adj', 'paresseux',  ['fainéant'],          ['travailleur']],
        [2, 'adj', 'bruyant',    ['sonore'],            ['silencieux']],
        [2, 'adj', 'amusant',    ['drôle', 'comique'],  ['ennuyeux']],
        [2, 'adj', 'timide',     ['réservé'],           ['audacieux'], ['modeste', 'humble', 'peureux', 'orgueilleux', 'vaniteux']],
        [2, 'verbe', 'réparer',   ['arranger'],         ['casser', 'abîmer'], ['construire', 'bâtir', 'détruire']],
        [2, 'verbe', 'construire',['bâtir'],            ['détruire']],
        [2, 'verbe', 'accepter',  ['admettre'],         ['refuser'], ['rejeter']],
        [2, 'verbe', 'augmenter', ['accroître'],        ['diminuer', 'baisser'], ['progresser', 'avancer', 'reculer', 'remplir', 'vider']],
        [2, 'verbe', 'cacher',    ['dissimuler'],       ['montrer']],
        [2, 'verbe', 'réussir',   [],                   ['échouer', 'rater']],
        [2, 'verbe', 'remplir',   [],                   ['vider']],
        [2, 'nom', 'victoire',    ['succès'],           ['défaite'], ['courage']],
        [2, 'nom', 'joie',        ['bonheur'],          ['tristesse', 'chagrin'], ['richesse']],
        [2, 'nom', 'courage',     ['bravoure'],         ['peur', 'lâcheté']],
        [2, 'adv', 'souvent',     ['fréquemment'],      ['rarement']],
        [2, 'adv', 'toujours',    ['constamment'],      ['jamais'], ['souvent', 'fréquemment', 'parfois', 'rarement', 'longtemps']],

        // ── Difficile ──
        [3, 'adj', 'fragile',    ['délicat'],           ['solide', 'résistant']],
        [3, 'adj', 'habile',     ['adroit'],            ['maladroit']],
        [3, 'adj', 'avare',      ['radin'],             ['généreux', 'dépensier']],
        [3, 'adj', 'minuscule',  ['infime'],            ['gigantesque', 'énorme']],
        [3, 'adj', 'prudent',    ['vigilant'],          ['imprudent', 'téméraire']],
        [3, 'adj', 'abondant',   ['copieux'],           ['rare']],
        [3, 'adj', 'optimiste',  ['confiant'],          ['pessimiste']],
        [3, 'adj', 'modeste',    ['humble'],            ['orgueilleux', 'vaniteux']],
        [3, 'adj', 'paisible',   ['serein'],            ['agité']],
        [3, 'adj', 'limpide',    ['transparent'],       ['trouble']],
        [3, 'adj', 'furieux',    ['enragé'],            ['calme']],
        [3, 'verbe', 'autoriser',  ['permettre'],       ['interdire', 'défendre'], ['accepter', 'refuser']],
        [3, 'verbe', 'encourager', ['soutenir'],        ['décourager']],
        [3, 'verbe', 'avancer',    ['progresser'],      ['reculer']],
        [3, 'verbe', 'rassembler', ['réunir'],          ['disperser'], ['remplir']],
        [3, 'verbe', 'admirer',    [],                  ['mépriser']],
        [3, 'nom', 'richesse',     ['fortune'],         ['pauvreté', 'misère']],
        [3, 'nom', 'vérité',       [],                  ['mensonge']],
        [3, 'nom', 'sagesse',      [],                  ['folie']],
        [3, 'adv', 'calmement',    ['tranquillement'],  ['nerveusement']],

        // ══ Mots ajoutés (banque enrichie) ══
        // ── Facile ──
        [1, 'adj', 'doux',      ['tendre'],            ['dur'], ['moelleux', 'mou', 'lisse', 'rugueux', 'sucré', 'gentil', 'aimable', 'calme']],
        [1, 'adj', 'long',      ['interminable'],      ['court'], ['grand', 'haut', 'bref']],
        [1, 'adj', 'nouveau',   ['neuf'],              ['vieux', 'ancien'], ['moderne', 'récent', 'jeune', 'âgé', 'usé']],
        [1, 'adj', 'vrai',      ['exact'],             ['faux'], ['juste', 'correct', 'précis', 'sincère', 'honnête']],
        [1, 'adj', 'bon',       ['délicieux'],         ['mauvais'], ['savoureux', 'excellent', 'gentil', 'méchant']],
        [1, 'adj', 'gai',       ['joyeux'],            ['triste'], ['content', 'heureux', 'malheureux', 'amusant']],
        [1, 'adj', 'heureux',   ['ravi'],              ['malheureux', 'triste'], ['content', 'joyeux', 'gai', 'mécontent']],
        [1, 'adj', 'triste',    ['malheureux'],        ['joyeux', 'gai'], ['content', 'heureux', 'mécontent', 'sombre']],
        [1, 'adj', 'froid',     ['glacé'],             ['chaud'], ['gelé', 'frais', 'tiède', 'brûlant']],
        [1, 'adj', 'petit',     ['minuscule'],         ['grand'], ['infime', 'court', 'mince', 'bas', 'gigantesque', 'immense', 'énorme', 'gros', 'haut']],
        [1, 'adj', 'méchant',   ['cruel'],             ['gentil'], ['aimable', 'mauvais', 'dur', 'sévère', 'bon']],
        [1, 'adj', 'lent',      ['lambin'],            ['rapide'], ['vif', 'calme']],
        [1, 'adj', 'sale',      ['crasseux'],          ['propre'], ['net', 'boueux']],
        [1, 'adj', 'joli',      ['mignon'],            ['laid', 'moche'], ['beau']],
        [1, 'adj', 'haut',      ['élevé'],             ['bas'], ['grand', 'immense', 'petit', 'profond']],
        [1, 'adj', 'vide',      ['désert'],            ['plein', 'rempli'], ['abondant']],
        [1, 'adj', 'intelligent', ['malin'],           ['bête', 'stupide'], ['habile', 'adroit', 'sage', 'maladroit']],
        [1, 'adj', 'sage',      ['obéissant'],         ['désobéissant', 'turbulent'], ['calme', 'tranquille', 'agité', 'gentil', 'poli', 'docile', 'intelligent']],
        [1, 'adj', 'bavard',    ['causant'],           ['silencieux', 'muet'], ['bruyant', 'sonore', 'réservé', 'timide', 'discret', 'calme']],
        [1, 'adj', 'jeune',     [],                    ['vieux', 'âgé'], ['nouveau', 'neuf', 'ancien', 'récent', 'moderne']],
        [1, 'verbe', 'entrer',    ['pénétrer'],        ['sortir'], ['arriver', 'partir', 'quitter']],
        [1, 'verbe', 'arriver',   ['venir'],           ['partir'], ['entrer', 'sortir', 'quitter', 'rester', "s'en aller"]],
        [1, 'verbe', 'partir',    ["s'en aller"],      ['rester', 'arriver'], ['quitter', 'sortir', 'entrer', 'venir', 'fuir']],
        [1, 'verbe', 'parler',    ['discuter'],        ['se taire'], ['bavarder', 'crier', 'hurler', 'chuchoter', 'murmurer', 'répondre']],
        [1, 'verbe', 'trouver',   ['découvrir'],       ['perdre'], ['égarer', 'chercher', 'gagner']],
        [1, 'verbe', 'perdre',    ['égarer'],          ['trouver', 'gagner'], ['découvrir', 'remporter', 'échouer', 'rater', 'gaspiller']],
        [1, 'verbe', 'finir',     ['terminer', 'achever'], ['commencer', 'débuter'], ['arrêter', 'cesser']],
        [1, 'verbe', 'tirer',     ['traîner'],         ['pousser']],
        [1, 'verbe', 'nettoyer',  ['laver'],           ['salir'], ['ranger', 'tacher']],
        [1, 'verbe', 'casser',    ['briser'],          ['réparer'], ['abîmer', 'détruire', 'arranger', 'déchirer']],
        [1, 'verbe', 'aider',     ['secourir'],        ['gêner'], ['soutenir', 'encourager', 'déranger', 'protéger']],
        [1, 'verbe', 'sauter',    ['bondir'],          []],
        [1, 'verbe', 'naître',    [],                  ['mourir']],
        [1, 'verbe', 'gonfler',   [],                  ['dégonfler'], ['grossir', 'enfler']],
        [1, 'verbe', 'détester',  ['haïr'],            ['aimer', 'adorer'], ['mépriser', 'admirer']],
        [1, 'nom', 'jour',        ['journée'],         ['nuit'], ['matin', 'soir']],
        [1, 'nom', 'nuit',        [],                  ['jour', 'journée'], ['soir', 'soirée']],
        [1, 'nom', 'matin',       ['matinée'],         ['soir', 'soirée'], ['jour', 'nuit']],
        [1, 'nom', 'entrée',      ['accès'],           ['sortie']],
        [1, 'nom', 'bruit',       ['vacarme'],         ['silence'], ['calme', 'son']],
        [1, 'nom', 'silence',     [],                  ['bruit', 'vacarme'], ['calme']],
        [1, 'nom', 'peur',        ['frayeur', 'crainte'], ['courage'], ['bravoure', 'lâcheté', 'angoisse']],
        [1, 'nom', 'cadeau',      ['présent'],         []],
        [1, 'nom', 'maison',      ['habitation'],      [], ['logement', 'demeure']],
        [1, 'nom', 'ville',       ['cité'],            ['campagne']],
        [1, 'nom', 'enfant',      ['gamin'],           ['adulte']],
        [1, 'nom', 'voiture',     ['automobile'],      []],
        [1, 'nom', 'professeur',  ['enseignant', 'maître'], [], ['élève']],
        [1, 'nom', 'erreur',      ['faute'],           [], ['échec', 'défaut']],
        [1, 'nom', 'hiver',       [],                  ['été']],
        [1, 'adv', 'beaucoup',    ['énormément'],      ['peu']],
        [1, 'adv', 'tôt',         [],                  ['tard']],
        [1, 'adv', 'tard',        [],                  ['tôt']],
        [1, 'adv', 'devant',      [],                  ['derrière'], ['avant', 'après']],
        [1, 'adv', 'dessus',      [],                  ['dessous']],
        [1, 'adv', 'dedans',      ["à l'intérieur"],   ['dehors']],
        [1, 'adv', 'loin',        [],                  ['près']],
        [1, 'adv', 'bien',        [],                  ['mal']],
        [1, 'adv', 'avant',       [],                  ['après'], ['devant', 'derrière', 'tôt', 'tard']],
        [1, 'adv', 'lentement',   [],                  ['vite', 'rapidement'], ['doucement', 'calmement', 'tranquillement']],

        // ── Moyen ──
        [2, 'adj', 'mou',        ['moelleux'],          ['dur'], ['doux', 'tendre', 'solide']],
        [2, 'adj', 'dur',        ['solide'],            ['mou', 'tendre'], ['doux', 'moelleux', 'résistant', 'fragile', 'difficile', 'sévère']],
        [2, 'adj', 'mince',      ['fin'],               ['gros', 'épais'], ['maigre', 'étroit', 'léger', 'énorme', 'large', 'petit']],
        [2, 'adj', 'clair',      ['lumineux'],          ['sombre', 'obscur'], ['limpide', 'transparent', 'trouble', 'net']],
        [2, 'adj', 'immense',    ['gigantesque'],       ['minuscule'], ['énorme', 'grand', 'haut', 'petit', 'infime', 'gros']],
        [2, 'adj', 'sec',        ['aride'],             ['mouillé', 'humide'], ['trempé']],
        [2, 'adj', 'humide',     ['mouillé'],           ['sec'], ['trempé', 'aride']],
        [2, 'adj', 'malheureux', ['triste'],            ['heureux'], ['content', 'joyeux', 'gai', 'ravi', 'mécontent']],
        [2, 'adj', 'utile',      ['pratique'],          ['inutile']],
        [2, 'adj', 'possible',   ['faisable'],          ['impossible'], ['facile', 'difficile']],
        [2, 'adj', 'célèbre',    ['connu', 'fameux'],   ['inconnu']],
        [2, 'adj', 'ordonné',    ['rangé'],             ['désordonné'], ['propre', 'sale']],
        [2, 'adj', 'patient',    [],                    ['impatient'], ['calme', 'nerveux']],
        [2, 'adj', 'lisse',      ['uni'],               ['rugueux'], ['doux', 'dur']],
        [2, 'adj', 'proche',     ['voisin'],            ['lointain', 'éloigné']],
        [2, 'adj', 'cher',       ['coûteux'],           ['bon marché'], ['riche', 'pauvre']],
        [2, 'adj', 'pareil',     ['identique', 'semblable'], ['différent']],
        [2, 'adj', 'nerveux',    ['agité'],             ['calme', 'détendu'], ['paisible', 'serein', 'tranquille', 'furieux', 'enragé', 'impatient', 'patient']],
        [2, 'adj', 'sucré',      [],                    ['salé'], ['doux', 'amer']],
        [2, 'adj', 'stupide',    ['bête'],              ['intelligent'], ['malin', 'sage', 'maladroit']],
        [2, 'adj', 'désobéissant', ['indiscipliné'],    ['obéissant'], ['sage', 'docile', 'turbulent']],
        [2, 'verbe', 'acheter',   ['acquérir'],         ['vendre'], ['dépenser', 'économiser']],
        [2, 'verbe', 'fermer',    ['clore'],            ['ouvrir'], ['allumer', 'éteindre']],
        [2, 'verbe', 'descendre', ['dévaler'],          ['monter', 'grimper'], ['baisser', 'diminuer', 'reculer']],
        [2, 'verbe', 'chuchoter', ['murmurer'],         ['crier', 'hurler'], ['parler', 'discuter', 'se taire']],
        [2, 'verbe', 'pleurer',   ['sangloter'],        ['rire'], ['rigoler']],
        [2, 'verbe', 'recevoir',  ['obtenir'],          ['donner', 'envoyer'], ['offrir', 'prendre', 'accepter', 'gagner', 'remporter', 'expédier']],
        [2, 'verbe', 'envoyer',   ['expédier'],         ['recevoir'], ['donner', 'obtenir', 'lancer']],
        [2, 'verbe', 'prêter',    [],                   ['emprunter'], ['donner', 'rendre']],
        [2, 'verbe', 'ajouter',   ['additionner'],      ['retirer', 'enlever'], ['augmenter', 'diminuer', 'soustraire', 'mettre']],
        [2, 'verbe', 'enlever',   ['retirer'],          ['mettre', 'ajouter'], ['ôter', 'additionner', 'prendre']],
        [2, 'verbe', 'habiller',  ['vêtir'],            ['déshabiller']],
        [2, 'verbe', 'refuser',   ['rejeter'],          ['accepter'], ['admettre', 'interdire', 'autoriser', 'permettre', 'jeter']],
        [2, 'verbe', 'chauffer',  ['réchauffer'],       ['refroidir'], ['brûler', 'geler']],
        [2, 'verbe', 'mouiller',  ['tremper'],          ['sécher']],
        [2, 'verbe', 'agrandir',  ['élargir'],          ['réduire', 'rétrécir'], ['augmenter', 'accroître', 'diminuer', 'baisser', 'grossir']],
        [2, 'verbe', 'diminuer',  ['réduire'],          ['augmenter'], ['baisser', 'accroître', 'agrandir', 'élargir', 'rétrécir', 'grossir', 'maigrir']],
        [2, 'verbe', 'détruire',  ['démolir'],          ['construire', 'bâtir'], ['casser', 'briser', 'abîmer', 'réparer', 'arranger']],
        [2, 'verbe', 'salir',     ['tacher'],           ['nettoyer', 'laver'], ['abîmer']],
        [2, 'verbe', 'ranger',    ['classer'],          ['déranger'], ['nettoyer', 'trier', 'ordonner', 'mélanger']],
        [2, 'verbe', 'arrêter',   ['stopper'],          ['continuer', 'poursuivre'], ['finir', 'terminer', 'cesser', 'commencer', 'débuter', 'achever']],
        [2, 'verbe', 'continuer', ['poursuivre'],       ['arrêter', 'cesser'], ['stopper', 'finir', 'terminer', 'commencer', 'débuter', 'achever']],
        [2, 'verbe', 'mélanger',  ['mêler'],            ['trier', 'séparer'], ['ranger', 'classer', 'réunir', 'unir', 'rassembler', 'disperser']],
        [2, 'verbe', 'obéir',     [],                   ['désobéir'], ['commander', 'ordonner', 'écouter', 'respecter']],
        [2, 'verbe', 'baisser',   ['diminuer'],         ['monter', 'augmenter'], ['réduire', 'descendre', 'lever', 'accroître', 'grimper']],
        [2, 'verbe', 'garder',    ['conserver'],        ['jeter'], ['perdre', 'lâcher', 'économiser', 'protéger', 'lancer', 'rejeter']],
        [2, 'verbe', 'lâcher',    ['relâcher'],         ['tenir', 'attraper'], ['saisir', 'jeter', 'garder', 'prendre', 'abandonner']],
        [2, 'verbe', 'attraper',  ['saisir'],           ['lâcher'], ['prendre', 'tenir', 'jeter', 'lancer', 'ramasser', 'relâcher']],
        [2, 'verbe', 'répondre',  ['répliquer'],        ['demander', 'questionner'], ['interroger', 'parler', 'discuter']],
        [2, 'verbe', 'apparaître', ['surgir'],          ['disparaître'], ['montrer', 'cacher', 'arriver', 'venir', 'partir']],
        [2, 'verbe', 'protéger',  ['défendre'],         ['attaquer'], ['aider', 'secourir', 'garder', 'interdire', 'soutenir', 'assaillir']],
        [2, 'verbe', 'grossir',   ['enfler'],           ['maigrir', 'mincir'], ['gonfler', 'dégonfler', 'augmenter', 'diminuer', 'agrandir', 'rétrécir', 'accroître']],
        [2, 'verbe', 'accélérer', [],                   ['ralentir'], ['avancer', 'freiner']],
        [2, 'verbe', 'montrer',   ['présenter'],        ['cacher', 'dissimuler'], ['apparaître', 'disparaître']],
        [2, 'nom', 'tristesse',   ['chagrin', 'peine'], ['joie', 'bonheur'], ['malheur']],
        [2, 'nom', 'question',    ['interrogation'],    ['réponse'], ['demande']],
        [2, 'nom', 'guerre',      ['conflit'],          ['paix'], ['combat', 'bataille', 'dispute']],
        [2, 'nom', 'paix',        ['tranquillité'],     ['guerre', 'conflit'], ['calme', 'silence', 'sérénité']],
        [2, 'nom', 'ennemi',      ['adversaire'],       ['ami', 'allié'], ['copain']],
        [2, 'nom', 'force',       ['puissance'],        ['faiblesse'], ['courage', 'énergie']],
        [2, 'nom', 'gentillesse', ['bonté'],            ['méchanceté'], ['générosité', 'politesse', 'courtoisie']],
        [2, 'nom', 'santé',       [],                   ['maladie']],
        [2, 'nom', 'chance',      ['veine'],            ['malchance'], ['succès', 'réussite']],
        [2, 'nom', 'colère',      ['rage'],             ['calme'], ['fureur', 'tranquillité', 'sérénité', 'paix']],
        [2, 'nom', 'échec',       ['défaite'],          ['réussite', 'succès'], ['victoire', 'erreur', 'faute']],
        [2, 'nom', 'mensonge',    ['tromperie'],        ['vérité'], ['erreur', 'faute']],
        [2, 'nom', 'arrivée',     [],                   ['départ'], ['entrée', 'sortie', 'fin', 'début']],
        [2, 'adv', 'rapidement',  ['vite'],             ['lentement'], ['tôt', 'soudainement', 'aussitôt', 'immédiatement']],
        [2, 'adv', 'rarement',    [],                   ['souvent', 'fréquemment'], ['parfois', 'quelquefois', 'jamais', 'toujours']],
        [2, 'adv', 'gentiment',   ['aimablement'],      ['méchamment'], ['poliment', 'doucement', 'calmement']],
        [2, 'adv', 'heureusement', [],                  ['malheureusement']],
        [2, 'adv', 'ensemble',    [],                   ['séparément']],
        [2, 'adv', 'parfois',     ['quelquefois'],      [], ['souvent', 'rarement', 'fréquemment', 'toujours', 'jamais']],

        // ── Difficile ──
        [3, 'adj', 'visible',    ['apparent'],          ['invisible'], ['clair', 'transparent', 'caché']],
        [3, 'adj', 'profond',    [],                    ['superficiel'], ['bas', 'haut']],
        [3, 'adj', 'obéissant',  ['docile'],            ['désobéissant'], ['sage', 'turbulent', 'indiscipliné', 'poli']],
        [3, 'adj', 'fier',       ['orgueilleux'],       ['modeste', 'humble'], ['vaniteux', 'content', 'timide']],
        [3, 'adj', 'sincère',    ['franc'],             ['hypocrite', 'menteur'], ['honnête', 'loyal', 'vrai', 'malhonnête']],
        [3, 'adj', 'immobile',   ['figé'],              ['mobile'], ['calme', 'agité', 'tranquille']],
        [3, 'adj', 'nombreux',   ['multiple'],          ['rare'], ['abondant', 'copieux', 'plein']],
        [3, 'adj', 'certain',    ['sûr'],               ['incertain', 'douteux'], ['vrai', 'exact', 'confiant', 'précis']],
        [3, 'adj', 'dangereux',  ['périlleux'],         ['inoffensif'], ['imprudent', 'téméraire', 'prudent', 'méchant']],
        [3, 'adj', 'ennuyeux',   ['lassant'],           ['passionnant', 'amusant'], ['drôle', 'comique', 'intéressant']],
        [3, 'adj', 'précis',     ['exact'],             ['approximatif', 'vague'], ['vrai', 'juste', 'correct', 'clair', 'net', 'faux', 'certain']],
        [3, 'adj', 'droit',      ['rectiligne'],        ['tordu', 'courbe'], ['honnête', 'loyal', 'malhonnête']],
        [3, 'adj', 'superflu',   ['inutile'],           ['indispensable', 'nécessaire'], ['utile', 'pratique']],
        [3, 'adj', 'audacieux',  ['hardi'],             ['craintif'], ['courageux', 'brave', 'vaillant', 'téméraire', 'peureux', 'timide', 'réservé', 'lâche', 'imprudent']],
        [3, 'adj', 'rusé',       ['malin'],             ['naïf'], ['intelligent', 'habile', 'bête', 'stupide']],
        [3, 'verbe', 'affirmer',   ['assurer'],         ['nier'], ['dire', 'mentir']],
        [3, 'verbe', 'gaspiller',  ['dilapider'],       ['économiser', 'épargner'], ['dépenser', 'perdre', 'garder', 'conserver']],
        [3, 'verbe', 'économiser', ['épargner'],        ['dépenser', 'gaspiller'], ['garder', 'conserver', 'acheter', 'dilapider']],
        [3, 'verbe', 'attaquer',   ['assaillir'],       ['défendre', 'protéger'], ['aider', 'secourir', 'interdire']],
        [3, 'verbe', 'calmer',     ['apaiser'],         ['énerver', 'exciter'], ['rassurer', 'tranquilliser', 'inquiéter', 'effrayer']],
        [3, 'verbe', 'rassurer',   ['tranquilliser'],   ['inquiéter', 'effrayer'], ['calmer', 'apaiser', 'énerver', 'encourager', 'terrifier', 'épouvanter']],
        [3, 'verbe', 'effrayer',   ['terrifier', 'épouvanter'], ['rassurer', 'tranquilliser'], ['inquiéter', 'calmer', 'apaiser', 'énerver']],
        [3, 'verbe', 'commander',  ['ordonner'],        ['obéir'], ['désobéir', 'diriger', 'demander', 'ranger', 'classer']],
        [3, 'verbe', 'unir',       ['réunir'],          ['séparer', 'diviser'], ['rassembler', 'disperser', 'mélanger', 'trier', 'mêler']],
        [3, 'verbe', 'fuir',       ["s'enfuir"],        ['affronter'], ['partir', 'quitter', "s'en aller", 'attaquer']],
        [3, 'verbe', 'reculer',    ['régresser'],       ['avancer', 'progresser'], ['descendre', 'diminuer', 'baisser']],
        [3, 'verbe', 'punir',      ['sanctionner'],     ['récompenser'], ['féliciter', 'encourager']],
        [3, 'verbe', 'interdire',  ['défendre'],        ['autoriser', 'permettre'], ['refuser', 'accepter', 'protéger', 'attaquer']],
        [3, 'verbe', 'disperser',  ['éparpiller'],      ['rassembler', 'réunir'], ['unir', 'séparer', 'diviser', 'mélanger', 'trier']],
        [3, 'nom', 'beauté',       ['splendeur'],       ['laideur']],
        [3, 'nom', 'politesse',    ['courtoisie'],      ['impolitesse', 'grossièreté'], ['gentillesse', 'bonté', 'méchanceté']],
        [3, 'nom', 'défaut',       ['imperfection'],    ['qualité'], ['erreur', 'faute']],
        [3, 'nom', 'danger',       ['péril'],           ['sécurité'], ['peur', 'risque']],
        [3, 'nom', 'liberté',      ['indépendance'],    ['captivité'], ['paix']],
        [3, 'nom', 'avantage',     ['atout'],           ['inconvénient'], ['qualité', 'défaut', 'chance']],
        [3, 'nom', 'espoir',       ['espérance'],       ['désespoir'], ['confiance', 'peur', 'crainte']],
        [3, 'nom', 'abondance',    ['profusion'],       ['pénurie', 'manque'], ['richesse', 'fortune', 'pauvreté', 'misère']],
        [3, 'nom', 'travail',      ['labeur'],          ['repos', 'loisir']],
        [3, 'nom', 'patience',     [],                  ['impatience'], ['calme', 'colère', 'sagesse']],
        [3, 'nom', 'pauvreté',     ['misère'],          ['richesse', 'fortune'], ['abondance', 'pénurie', 'manque']],
        [3, 'adv', 'facilement',   ['aisément'],        ['difficilement'], ['simplement']],
        [3, 'adv', 'bruyamment',   [],                  ['silencieusement'], ['calmement', 'tranquillement', 'doucement']],
        [3, 'adv', 'prudemment',   [],                  ['imprudemment'], ['calmement', 'doucement', 'lentement']],
        [3, 'adv', 'soudainement', ['brusquement'],     ['progressivement'], ['rapidement', 'vite', 'aussitôt', 'immédiatement', 'lentement']],
        [3, 'adv', 'longtemps',    [],                  ['brièvement'], ['toujours', 'souvent', 'rarement']],
        [3, 'adv', 'aussitôt',     ['immédiatement'],   [], ['vite', 'rapidement', 'soudainement', 'tôt', 'tard']],
        [3, 'adv', 'nerveusement', ['fébrilement'],     ['calmement', 'tranquillement'], ['rapidement', 'lentement', 'doucement']],
    ];

    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }
    var Q = '<span class="bs-q">?</span>';
    var KIND_LABEL = { syn: 'Synonyme', ant: 'Contraire' };

    // Mots « liés » à un mot : tous les mots des entrées où il apparaît.
    // Un intrus ne doit jamais être lié au mot demandé ni à la bonne réponse
    // (sinon ce serait aussi une bonne réponse… ou une réponse ambiguë).
    var RELATED = {};
    WORDS.forEach(function (e) {
        var all = [e[2]].concat(e[3], e[4], e[5] || []);
        all.forEach(function (w) {
            RELATED[w] = RELATED[w] || {};
            all.forEach(function (x) { RELATED[w][x] = true; });
        });
    });
    function isRelated(a, b) { return !!(RELATED[a] && RELATED[a][b]); }
    // Lien « indirect » (2 sauts) : a et b partagent un mot lié.
    // Ex. : diminuer ~ réduire ~ agrandir → « agrandir » ne doit pas être un
    // intrus pour « contraire de diminuer ».
    var RELATED2 = {};
    function related2Set(a) {
        if (RELATED2[a]) return RELATED2[a];
        var out = {};
        Object.keys(RELATED[a] || {}).forEach(function (x) {
            out[x] = true;
            Object.keys(RELATED[x] || {}).forEach(function (y) { out[y] = true; });
        });
        return (RELATED2[a] = out);
    }
    function isRelated2(a, b) { return !!related2Set(a)[b]; }

    // Un item : { kind, word, ans, options, say, key, entry }
    function makeItem(e, kind) {
        var word = e[2];
        var good = kind === 'syn' ? e[3] : e[4];
        var other = kind === 'syn' ? e[4] : e[3];
        var ans = pick(good);
        var opts = [];
        // Intrus n°1 : le piège, un mot de l'autre famille (le contraire quand on
        // demande un synonyme, et inversement)
        if (other.length) opts.push(pick(other));
        // Intrus suivants : mots de même nature, sans lien (même indirect) avec
        // le mot ni la réponse. Si la réserve est trop maigre, on assouplit.
        var tries = [
            { same: true,  rel: isRelated2 },
            { same: true,  rel: isRelated },
            { same: false, rel: isRelated2 },
            { same: false, rel: isRelated }
        ];
        for (var t = 0; t < tries.length && opts.length < 2; t++) {
            var tr = tries[t], pool = [];
            WORDS.forEach(function (o) {
                if (o === e || (tr.same && o[1] !== e[1])) return;
                [o[2]].concat(o[3], o[4]).forEach(function (w) {
                    if (w === word || w === ans || opts.indexOf(w) >= 0 || pool.indexOf(w) >= 0) return;
                    if (tr.rel(word, w) || tr.rel(ans, w)) return;
                    pool.push(w);
                });
            });
            shuffle(pool);
            while (opts.length < 2 && pool.length) {
                var w = pool.pop();
                if (!opts.some(function (x) { return isRelated(x, w); })) opts.push(w);
            }
        }
        return {
            kind: kind, word: word, ans: ans, entry: e,
            options: [ans].concat(opts.slice(0, 2)),
            say: (kind === 'syn' ? 'Trouve un synonyme de ' : 'Trouve le contraire de ') + word,
            key: kind + '_' + word
        };
    }

    function generateSeries(s) {
        var entries = WORDS.filter(function (e) { return s.levels.indexOf(e[0]) >= 0; });
        var cands = [];
        entries.forEach(function (e) {
            s.kinds.forEach(function (k) {
                if ((k === 'syn' ? e[3] : e[4]).length) cands.push({ e: e, k: k });
            });
        });
        var list = [], used = {}, lastWord = '';
        for (var i = 0; i < s.count; i++) {
            var free = cands.filter(function (c) { return !used[c.k + '_' + c.e[2]] && c.e[2] !== lastWord; });
            if (!free.length) { used = {}; free = cands.filter(function (c) { return c.e[2] !== lastWord; }); }
            if (!free.length) free = cands;
            // Alterner synonymes / contraires quand les deux sont choisis
            if (s.kinds.length > 1 && list.length) {
                var want = list[list.length - 1].kind === 'syn' ? 'ant' : 'syn';
                var alt = free.filter(function (c) { return c.k === want; });
                if (alt.length && Math.random() < 0.7) free = alt;
            }
            var c = pick(free);
            var it = makeItem(c.e, c.k);
            used[it.key] = true; lastWord = it.word;
            list.push(it);
        }
        return list;
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _bsAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_bsAudio) _bsAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _bsAudio, t0 = ctx.currentTime + start;
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
    window.createBattleSynonymesWidget = function (savedData) {
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
        container.className = 'bs-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="bs-inner">
            <div class="bs-header">
                <span class="bs-title">⚔️ Battle synonymes / contraires</span>
                <div class="bs-stats">
                    <span class="bs-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="bs-chip" data-role="record" title="Record pour ces réglages (sur cet ordinateur)">🏆 0</span>
                    <span class="bs-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="bs-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="bs-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="bs-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="bs-arena"></div>

            <div class="bs-talk">
                <div class="bs-chef">⚔️</div>
                <div class="bs-msg"></div>
            </div>

            <div class="bs-actions">
                <button class="bs-btn bs-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="bs-btn" data-act="setup">⚙️ Réglages</button>
                <button class="bs-btn bs-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="bs-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="bs-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>👤 <b>Seul</b> : une série de mots chronométrés, 3 réponses possibles. Plus tu es rapide, plus tu gagnes de points ! 🏆 Bats ton record.</p>
                <p>👥 <b>À deux</b> :</p>
                <p>Deux élèves au tableau, <b>un de chaque côté</b>. Un mot apparaît en grand au milieu, avec la consigne <b style="color:#14A38B">SYNONYME</b> (même sens) ou <b style="color:#D6336C">CONTRAIRE</b> (sens opposé).</p>
                <p>Chaque joueur a <b>3 réponses possibles</b> de son côté (pas dans le même ordre que l'adversaire). Le premier qui touche la bonne réponse marque <b>1 point</b>.</p>
                <p>⚠️ Attention au piège : on te propose souvent le <b>contraire</b> quand on demande un synonyme… et l'inverse ! Lis bien la consigne.</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour ce mot : inutile de cliquer au hasard ! Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>Selon les réglages : celui qui a le plus de points à la fin de la série gagne, ou bien le <b>premier à atteindre</b> le nombre de points choisi.</p>
                <p>📂 Chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p style="margin:0">Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
            </div>
            <div class="bs-side bs-side-L"><div class="bs-side-title">📂 Élèves</div><div class="bs-side-list"></div></div>
            <div class="bs-side bs-side-R"><div class="bs-side-title">📂 Élèves</div><div class="bs-side-list"></div></div>
            <div class="bs-class">
                <div class="bs-class-head"><h4>📂 Élèves</h4><span class="bs-class-count"></span></div>
                <div class="bs-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="bs-class-list"></div>
                <p class="bs-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="bs-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="bs-confetti"></div>
            <div class="bs-rh bs-rh-nw" data-dir="nw"></div>
            <div class="bs-rh bs-rh-n"  data-dir="n"></div>
            <div class="bs-rh bs-rh-ne" data-dir="ne"></div>
            <div class="bs-rh bs-rh-e"  data-dir="e"></div>
            <div class="bs-rh bs-rh-se" data-dir="se"></div>
            <div class="bs-rh bs-rh-s"  data-dir="s"></div>
            <div class="bs-rh bs-rh-sw" data-dir="sw"></div>
            <div class="bs-rh bs-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.bs-inner');
        const arena    = $('.bs-arena');
        const msg      = $('.bs-msg');
        const chef     = $('.bs-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.bs-help');
        const confetti = $('.bs-confetti');
        const classBtn   = $('[data-role="class"]');
        const classBox   = $('.bs-class');
        const classList  = $('.bs-class-list');
        const classFile  = $('.bs-class-file');
        const sideL = $('.bs-side-L'), sideR = $('.bs-side-R');
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
        const RECORD_KEY = 'battle-synonymes-records';
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const isSolo = () => S.players === 'solo';
        // Un record par combinaison de réglages
        const recKey = () => [S.kinds.slice().sort().join('+'), S.levels.slice().sort().join(''), S.speed + 's', S.count].join('|');
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
            container.classList.toggle('bs-has-sides', sides);
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
                container.style.setProperty('--bs-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--bs-s', sc.toFixed(4));
            fitCalc();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'bs-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            const spinner = (label, key, min, max) => `
                <div class="bs-spinner">
                    <div class="bs-spinner-label">${label}</div>
                    <div class="bs-spinner-inner">
                        <button class="bs-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="bs-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="bs-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            const nb = (lv) => WORDS.filter(e => e[0] === lv).length;
            arena.innerHTML = `
              <div class="bs-setup">
                <div class="bs-label">Nombre de joueurs</div>
                <div class="bs-chips">
                    <button class="bs-small bs-mode" data-players="solo">👤 Seul</button>
                    <button class="bs-small bs-mode" data-players="duel">👥 À deux (duel au tableau)</button>
                </div>
                <div class="bs-label">Que faut-il trouver ?</div>
                <div class="bs-chips">
                    <button class="bs-type" data-kind="syn" title="Un mot de même sens"><span class="bs-type-ico syn">=</span>Synonymes</button>
                    <button class="bs-type" data-kind="ant" title="Un mot de sens opposé"><span class="bs-type-ico ant">≠</span>Contraires</button>
                </div>

                <div class="bs-label">Niveau des mots</div>
                <div class="bs-chips">
                    <button class="bs-type" data-level="1" title="${nb(1)} mots"><span class="bs-type-ico">😊</span>Facile</button>
                    <button class="bs-type" data-level="2" title="${nb(2)} mots"><span class="bs-type-ico">😐</span>Moyen</button>
                    <button class="bs-type" data-level="3" title="${nb(3)} mots"><span class="bs-type-ico">😤</span>Difficile</button>
                </div>

                <div data-duelonly>
                <div class="bs-label">Qui gagne le duel ?</div>
                <div class="bs-chips">
                    <button class="bs-small bs-mode" data-mode="count" title="Le duel s'arrête après un nombre fixe de mots">🔢 Le plus de points en N mots</button>
                    <button class="bs-small bs-mode" data-mode="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                </div>
                </div>
                <div class="bs-params" style="margin-top:calc(6px * var(--bs-s))">
                    ${spinner('Secondes<br>par mot', 'speed', 3, 60)}
                    <div data-modebox="count">${spinner('Nombre<br>de mots', 'count', 3, 40)}</div>
                    <div data-modebox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="bs-chips" style="margin-top:calc(4px * var(--bs-s))">
                    <button class="bs-toggle" data-opt="voice"><span class="bs-dot"></span>🔊 Lire la consigne à voix haute</button>
                </div>
                <div class="bs-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.bs-setup');
            const sync = () => {
                setupEl.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('on', S.kinds.indexOf(b.dataset.kind) >= 0));
                setupEl.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('on', S.levels.indexOf(+b.dataset.level) >= 0));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
                const duel = S.players === 'duel';
                setupEl.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', b.dataset.players === S.players));
                setupEl.querySelectorAll('[data-duelonly]').forEach(el => el.classList.toggle('bs-hide', !duel));
                // En mode seul : uniquement « Nombre de mots »
                setupEl.querySelectorAll('[data-modebox]').forEach(el => el.classList.toggle('bs-hide', el.dataset.modebox !== (duel ? S.mode : 'count')));
                container.classList.toggle('duel', duel);
                updateStats(false);
                setupEl.querySelector('.bs-warn').textContent = '';
            };

            setupEl.querySelectorAll('[data-kind]').forEach(b => b.addEventListener('click', () => {
                const k = b.dataset.kind, i = S.kinds.indexOf(k);
                if (i >= 0) S.kinds.splice(i, 1); else S.kinds.push(k);
                sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
                const l = +b.dataset.level, i = S.levels.indexOf(l);
                if (i >= 0) S.levels.splice(i, 1); else S.levels.push(l);
                S.levels.sort();
                sync(); saveSettings(S);
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
            const setupEl = arena.querySelector('.bs-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.bs-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (!S.kinds.length) { warn('Choisissez synonymes, contraires ou les deux.'); return false; }
            if (!S.levels.length) { warn('Choisissez au moins un niveau.'); return false; }
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
            $('.bs-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué`
                : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            const playing = state === 'wait' || state === 'go' || state === 'result';
            clBtn('draw').disabled = !hasClass() || playing || rolling;
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && !isSolo() && CL.students.length > 0;
            if (wantSides !== container.classList.contains('bs-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="bs-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['bs-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (pair && pair.L === st.id) cls.push('cur-L');
                if (pair && pair.R === st.id) cls.push('cur-R');
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="bs-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = st.absent ? 'absent' : (pair && (pair.L === st.id || pair.R === st.id)) ? 'au tableau' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="bs-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="bs-st-state">${stateTxt}</span>` : ''}
                    <span class="bs-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('bs-has-sides')) return;
            const rows = classList.querySelectorAll('.bs-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.bs-side-list'), sideR.querySelector('.bs-side-list')];
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
                sd.querySelector('.bs-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.bs-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        [sideL, sideR].forEach(sd => {
            sd.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('.bs-st');
                if (row) toggleAbsent(row.dataset.id);
            });
        });
        classList.addEventListener('click', (e) => {
            const row = e.target.closest('.bs-st');
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
              <div class="bs-draw">
                <div class="bs-draw-title">🎲 Tirage au sort</div>
                <div class="bs-draw-row">
                    <div class="bs-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="bs-draw-vs">VS</div>
                    <div class="bs-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="bs-draw-info"></div>
                <div class="bs-actions">
                    <button class="bs-btn" data-dr="again">🎲 Nouveau tirage</button>
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
            const elL = arena.querySelector('.bs-draw-card b[data-side="L"]');
            const elR = arena.querySelector('.bs-draw-card b[data-side="R"]');
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
            arena.querySelectorAll('.bs-draw-card b').forEach(el => {
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = el.dataset.side === 'L' ? shortName(stL) : shortName(stR);
                el.title = fullName(el.dataset.side === 'L' ? stL : stR);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.bs-draw-info');
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
                <div class="bs-half ${side}" data-side="${side}">
                    <div class="bs-phead">
                        <input class="bs-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="bs-pscore">${pts[side]}</div>
                    </div>
                    <div class="bs-choices" data-side="${side}">
                        <button class="bs-choice hidden" data-i="0">?</button>
                        <button class="bs-choice hidden" data-i="1">?</button>
                        <button class="bs-choice hidden" data-i="2">?</button>
                    </div>
                    <div class="bs-pkeys">clavier : ${KEYS[side].map(k => k.toUpperCase()).join(' / ')}</div>
                </div>`;
            arena.innerHTML = `
              <div class="bs-duel">
                <div class="bs-banner">
                    <div class="bs-calc wait">?</div>
                    <div class="bs-timebar"><i></i></div>
                </div>
                <div class="bs-field">
                    ${half('L')}
                    <div class="bs-mid"><small>Mot</small><b data-role="round">${roundLabel(0)}</b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="bs-ready"></div>
              <div class="bs-pause"><div class="bs-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bs-overlay"><div class="bs-card"></div></div>`;

            arena.querySelectorAll('.bs-pname').forEach(inp => {
                const side = inp.closest('.bs-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            arena.querySelector('.bs-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.bs-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.bs-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        // Arène du mode seul : le mot en haut, 3 grandes réponses en dessous
        function buildSolo() {
            arena.innerHTML = `
              <div class="bs-duel bs-solo">
                <div class="bs-banner">
                    <div class="bs-calc wait">?</div>
                    <div class="bs-timebar"><i></i></div>
                </div>
                <div class="bs-field solo">
                    <div class="bs-half S" data-side="S">
                        <div class="bs-sprog" data-role="round">${roundLabel(0)}</div>
                        <div class="bs-choices" data-side="S">
                            <button class="bs-choice hidden" data-i="0">?</button>
                            <button class="bs-choice hidden" data-i="1">?</button>
                            <button class="bs-choice hidden" data-i="2">?</button>
                        </div>
                        <div class="bs-pkeys">clavier : 1 / 2 / 3</div>
                    </div>
                </div>
              </div>
              <div class="bs-ready"></div>
              <div class="bs-pause"><div class="bs-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bs-overlay"><div class="bs-card"></div></div>`;
            arena.querySelector('.bs-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            arena.querySelectorAll('.bs-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    answer('S', b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.bs-choices[data-side="${side}"] .bs-choice`);
        const allChoices = () => arena.querySelectorAll('.bs-choice');
        const calcEl = () => arena.querySelector('.bs-calc');
        const readyEl = () => arena.querySelector('.bs-ready');
        const overlay = () => arena.querySelector('.bs-overlay');

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
        function calcHTML(it, withAns) {
            const kind = `<span class="bs-kind ${it.kind}"><i>${it.kind === 'syn' ? '=' : '≠'}</i>${KIND_LABEL[it.kind]}</span>`;
            const word = `<span class="bs-word">${esc(it.word)}</span>`;
            return kind + word + (withAns ? `<span class="bs-arrow">→</span><span class="bs-ans">${esc(it.ans)}</span>` : '');
        }
        // Phrase d'explication après la réponse
        function explainText(it) {
            return it.kind === 'syn'
                ? `<b>${esc(it.ans)}</b> est un <b>synonyme</b> de <b>${esc(it.word)}</b> : ils ont le même sens.`
                : `<b>${esc(it.ans)}</b> est le <b>contraire</b> de <b>${esc(it.word)}</b> : ils ont un sens opposé.`;
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
            c.className = 'bs-calc solved';
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
            arena.querySelectorAll('.bs-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'bs-choice hidden'; b.textContent = '?'; delete b.dataset.v; });
            const c = calcEl();
            c.className = 'bs-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.bs-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = roundLabel(idx + 1);
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'bs-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            // Mêmes 3 réponses de chaque côté, mais dans un ordre différent
            (isSolo() ? ['S'] : ['L', 'R']).forEach(side => {
                const opts = shuffle(it.options.slice());
                choiceBtns(side).forEach((b, i) => {
                    b.dataset.v = opts[i];
                    b.textContent = opts[i];
                    b.className = 'bs-choice appear';
                });
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
            const tb = arena.querySelector('.bs-timebar');
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
            if (isSolo()) return `Mot <b>${n}</b> / ${series.length}`;
            return goalMode() ? `${n}<small>1er à ${S.goal}</small>` : `${n}<small>/ ${series.length}</small>`;
        }
        function nextRound() {
            idx++;
            if (goalMode()) {
                // Série « sans fin » : on ajoute des mots tant que personne n'a gagné
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
                const half = arena.querySelector(`.bs-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.bs-pscore');
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
                arena.querySelector(`.bs-half.${side}`).classList.add('lock');
                sfx('bad');
                const trap = (it.kind === 'syn' ? it.entry[4] : it.entry[3]).indexOf(b.dataset.v) >= 0
                    ? ` Attention : <b>${esc(b.dataset.v)}</b> est le ${it.kind === 'syn' ? 'contraire' : 'synonyme'}, pas le ${it.kind === 'syn' ? 'synonyme' : 'contraire'} !`
                    : '';
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour ce mot !${trap}`, 'bad');
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
                const trap = (it.kind === 'syn' ? it.entry[4] : it.entry[3]).indexOf(b.dataset.v) >= 0
                    ? `Attention : <b>${esc(b.dataset.v)}</b> est le ${it.kind === 'syn' ? 'contraire' : 'synonyme'}, pas le ${it.kind === 'syn' ? 'synonyme' : 'contraire'} ! `
                    : '';
                say(`❌ Oups ! ${trap}${explainText(it)}`, 'bad');
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
            const title = st === 3 ? 'As du vocabulaire !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > 0 && score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) {} }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.bs-card').innerHTML = `
                <div class="bs-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="bs-bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${n} · ${score} points</p>
                <p class="bs-sub">${times.length ? `Temps moyen : ${avg} s` : 'Aucune bonne réponse'}${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="bs-actions">
                    <button class="bs-btn bs-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="bs-btn" data-act="tosetup">⚙️ Réglages</button>
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
                <div class="bs-actions">
                    ${hasClass() ? '<button class="bs-btn bs-btn-go" data-act="next">🎲 Duel suivant</button>' : ''}
                    <button class="bs-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            const recTxt = recorded ? '<p class="bs-rec">✔ Scores ajoutés dans la liste 📂</p>' : '';
            ov.querySelector('.bs-card').innerHTML = tie ? `
                <div class="bs-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="bs-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bs-sub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} mots.</p>
                ${recTxt}${nextBtns}` : `
                <div class="bs-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="bs-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bs-sub">sur ${nb} mots</p>
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
            const p = arena.querySelector('.bs-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (!playing) return;
            const p = arena.querySelector('.bs-pause');
            if (!paused) {
                paused = true; pauseStart = performance.now();
                stopSpeech();
                if (p) p.classList.add('show');
                say(isSolo() ? '⏸ Pause. Clique sur <b>▶ Reprendre</b> pour continuer.' : '⏸ Duel en pause. Cliquez sur <b>▶ Reprendre</b> pour continuer.');
            } else {
                pausedTotal += performance.now() - pauseStart;
                paused = false;
                if (p) p.classList.remove('show');
                say(isSolo() ? `▶ C'est reparti ! (mot ${idx + 1} / ${series.length} · ${score} points)`
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
            if (isSolo()) say(`⚡ ${series.length} mots, ${S.speed} s par mot. Lis bien la consigne : synonyme ou contraire ?`);
            else say(`⚡ ${goalMode() ? `Le premier à ${S.goal} point${S.goal > 1 ? 's' : ''} gagne !` : `${series.length} mots.`} ${S.speed} s par mot. Lis bien la consigne : synonyme ou contraire ? Une erreur bloque ton côté !`);
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
            if (isSolo()) return '⚔️ Choisis synonymes et/ou contraires et le niveau, puis clique sur <b>▶ Jouer</b> !';
            return hasClass()
                ? `⚔️ Choisissez synonymes et/ou contraires et le niveau, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.`
                : '⚔️ Choisissez synonymes et/ou contraires et le niveau, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
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
            window._wfMiniBarCollapse(widget, '⚔️ Battle synonymes / contraires', { onExpand: applyScale });
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
        container.querySelectorAll('.bs-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .bs-arena, .bs-rh, .bs-help, .bs-class, .bs-side')) {
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
        widget._bsGetData = function () {
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
            } else if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
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
            if (type === TYPE) return window.createBattleSynonymesWidget();
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
