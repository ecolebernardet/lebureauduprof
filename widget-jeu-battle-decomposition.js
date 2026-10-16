// =========================================================================
// BATTLE DÉCOMPOSITION — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Battles » — duel au TBI
//
// Deux élèves s'affrontent, un de chaque côté de l'écran (multi-touch).
// Une décomposition s'affiche en grand au centre (3 c + 4 u, 300 + 40 + 5,
// 13 d + 2 u…) : il faut toucher le nombre correspondant parmi 3 réponses
// (mélangées différemment de chaque côté) plus vite que l'adversaire.
// Variante « Nombre → unités » : le nombre est donné, il faut trouver sa
// décomposition.
//   • Le premier qui touche la bonne réponse marque le point.
//   • Une erreur bloque son côté pour cette question (pas de clic au hasard !),
//     ou, au choix dans les réglages, donne le point à l'adversaire.
//   • Si personne ne répond dans le temps imparti, la réponse est montrée,
//     avec le calcul (300 + 4 = 304 : là où il n'y a rien, on écrit un 0).
//   • Les intrus sont des erreurs typiques : chiffres collés (3 c + 4 u → 34),
//     chiffre au mauvais rang (340, 3 004), échange oublié (13 d → 3 d)…
//
// Types : c, d, u · jusqu'à 9 999 (m, c, d, u) · somme (300 + 40 + 5) ·
// nombre → unités · dans le désordre · échanges (13 d + 2 u) · décimaux
// (3 + 0,4 + 0,07). Les questions sont tirées au hasard.
//
// 🏆 Mode tournoi (avec la liste 📂) : élimination directe, seuls les
//   gagnants jouent le tour suivant, jusqu'à la finale. Nombre impair de
//   joueurs : match de barrage (le perdant est éliminé, le vainqueur joue
//   encore un match). Égalité en fin de match : question décisive.
//
// 👤 Mode seul : N questions chronométrées, points selon la rapidité,
//   série 🔥 et record (mémorisé sur l'ordinateur).
//
// Ouverture   : createWidget('battle-decomposition')
// Sauvegarde  : widget._bdcGetData()  → bdcData dans save-load.js
// Restauration: createBattleDecompositionWidget(bdcData)
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'battle-decomposition';
    var SETTINGS_KEY = 'battle-decomposition-settings';
    var CLASS_KEY = 'battle-decomposition-classe';

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

    // ── CSS du jeu (préfixe bdc-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-decomposition-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-decomposition-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-decomposition"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .bdc-container {
            --bdc-s: 1;
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
            padding: calc(12px * var(--bdc-s)) calc(14px * var(--bdc-s)) calc(14px * var(--bdc-s));
            border-radius: calc(24px * var(--bdc-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--bdc-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .bdc-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .bdc-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--bdc-s));
            width: 100%; max-width: calc(732px * var(--bdc-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .bdc-header { display: flex; align-items: center; gap: calc(10px * var(--bdc-s)); cursor: move; }
        .bdc-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--bdc-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--bdc-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .bdc-icon-btn {
            width: calc(26px * var(--bdc-s)); height: calc(26px * var(--bdc-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--bdc-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .bdc-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .bdc-arena {
            position: relative;
            min-height: calc(390px * var(--bdc-s));
            border-radius: calc(18px * var(--bdc-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .bdc-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bdc-s)), transparent calc(2px * var(--bdc-s))) 0 0 / calc(24px * var(--bdc-s)) calc(24px * var(--bdc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bdc-s));
            box-sizing: border-box;
            padding: calc(10px * var(--bdc-s)) calc(14px * var(--bdc-s)) calc(14px * var(--bdc-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--bdc-s));
            color: #fff;
        }
        .bdc-label {
            font-size: calc(13px * var(--bdc-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--bdc-s));
        }
        .bdc-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--bdc-s)); justify-content: center; }
        .bdc-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--bdc-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--bdc-s)); height: calc(52px * var(--bdc-s)); padding: 0 calc(8px * var(--bdc-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--bdc-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .bdc-type .bdc-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--bdc-s)); }
        .bdc-type:hover { background: rgba(255,255,255,0.14); }
        .bdc-type:active { transform: scale(0.95); }
        .bdc-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bdc-small {
            min-width: calc(40px * var(--bdc-s)); height: calc(38px * var(--bdc-s)); padding: 0 calc(8px * var(--bdc-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--bdc-s));
            display: flex; align-items: center; justify-content: center;
        }
        .bdc-small.bdc-mode { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--bdc-s)); padding: 0 calc(14px * var(--bdc-s)); }
        .bdc-hide { display: none !important; }
        [data-modebox] { display: flex; }
        .bdc-small.bdc-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--bdc-s)); }
        .bdc-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bdc-sub { display: none; }
        .bdc-sub.visible { display: block; }

        .bdc-params { display: flex; gap: calc(20px * var(--bdc-s)); justify-content: center; flex-wrap: wrap; }
        .bdc-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .bdc-spinner-label { font-size: calc(11px * var(--bdc-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .bdc-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--bdc-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--bdc-s)) 0 #B9B2D6;
        }
        .bdc-spinner-btn {
            width: calc(34px * var(--bdc-s)); height: calc(42px * var(--bdc-s)); border: none; background: transparent;
            font-size: calc(20px * var(--bdc-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .bdc-spinner-btn:hover { background: #F1EDFB; }
        .bdc-spinner-val {
            width: calc(56px * var(--bdc-s)); height: calc(42px * var(--bdc-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--bdc-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .bdc-spinner-val::-webkit-inner-spin-button,
        .bdc-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bdc-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--bdc-s)) calc(14px * var(--bdc-s));
            font-family: inherit; font-size: calc(12px * var(--bdc-s)); font-weight: 800; color: #fff;
        }
        .bdc-toggle .bdc-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .bdc-toggle.on { border-color: var(--or); }
        .bdc-toggle.on .bdc-dot { background: var(--or); }
        .bdc-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--bdc-s)); font-weight: 900; min-height: calc(16px * var(--bdc-s)); }

        /* ══ DUEL ══ */
        .bdc-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--bdc-s)); background: #1B1433; }
        .bdc-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bdc-s)), transparent calc(2px * var(--bdc-s))) 0 0 / calc(24px * var(--bdc-s)) calc(24px * var(--bdc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--bdc-s)) calc(12px * var(--bdc-s)) calc(10px * var(--bdc-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--bdc-s));
        }
        .bdc-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--bdc-s));
            padding: calc(6px * var(--bdc-s)) calc(26px * var(--bdc-s));
            min-width: calc(260px * var(--bdc-s)); min-height: calc(72px * var(--bdc-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--bdc-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bdc-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .bdc-calc.wait { color: #D9D2EE; }
        .bdc-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--bdc-s)) 0 #1C8A4F; }
        .bdc-calc .bdc-ans { color: #1C8A4F; }
        .bdc-calc { gap: 0.25em; font-variant-numeric: normal; }
        .bdc-kind {
            display: inline-flex; align-items: center; gap: 0.2em;
            font-family: 'Nunito', sans-serif; font-weight: 900; text-transform: uppercase;
            font-size: 0.36em; letter-spacing: 0.05em; line-height: 1;
            padding: 0.35em 0.6em; border-radius: 999px; color: #fff;
        }
        .bdc-kind.syn { background: #14A38B; box-shadow: 0 0.12em 0 #0B6E5D; }
        .bdc-kind.ant { background: #D6336C; box-shadow: 0 0.12em 0 #9A1E4C; }
        .bdc-kind i { font-style: normal; font-size: 1.35em; }
        .bdc-word { white-space: nowrap; }
        .bdc-arrow { color: #B9B2D6; font-size: 0.7em; }
        .bdc-choice { font-size: calc(30px * var(--bdc-s)); padding: 0 calc(10px * var(--bdc-s)); box-sizing: border-box; font-variant-numeric: normal; overflow: hidden; }
        .bdc-type .bdc-type-ico.syn { color: #7CF0D9; }
        .bdc-type .bdc-type-ico.ant { color: #FF9EC0; }
        .bdc-type.on .bdc-type-ico.syn, .bdc-type.on .bdc-type-ico.ant { color: var(--encre); }
        .bdc-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .bdc-calc .bdc-q { font-size: 0.9em; }
        .bdc-timebar {
            width: 70%; height: calc(10px * var(--bdc-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .bdc-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .bdc-timebar.low i { background: var(--rouge); }

        .bdc-field { flex: 1; display: grid; grid-template-columns: 1fr calc(64px * var(--bdc-s)) 1fr; }
        .bdc-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--bdc-s));
            padding: calc(10px * var(--bdc-s)) calc(10px * var(--bdc-s)) calc(12px * var(--bdc-s));
            transition: box-shadow .2s;
        }
        .bdc-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bdc-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bdc-half.win { box-shadow: inset 0 0 0 calc(6px * var(--bdc-s)) #7CFFB2; }
        .bdc-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--bdc-s));
            background: rgba(42,31,74,0.5);
        }
        .bdc-phead { display: flex; align-items: center; gap: calc(10px * var(--bdc-s)); }
        .bdc-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--bdc-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--bdc-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--bdc-s)); text-align: center;
        }
        @keyframes bdc-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .bdc-pscore.bump { animation: bdc-bump .4s ease; }
        .bdc-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bdc-s));
            width: calc(150px * var(--bdc-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--bdc-s)) calc(8px * var(--bdc-s));
            user-select: text;
        }
        .bdc-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .bdc-choices { display: flex; flex-direction: column; gap: calc(9px * var(--bdc-s)); width: 100%; align-items: center; }
        .bdc-choice {
            width: 86%; height: calc(62px * var(--bdc-s));
            border: none; border-radius: calc(18px * var(--bdc-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--bdc-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bdc-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .bdc-choice:hover { background: #FFF3C4; }
        .bdc-choice:active { transform: translateY(calc(4px * var(--bdc-s))); box-shadow: 0 calc(2px * var(--bdc-s)) 0 #B9B2D6; }
        .bdc-choice.hidden { color: #D9D2EE; }
        .bdc-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--bdc-s)) 0 #1C8A4F; }
        .bdc-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--bdc-s)) 0 #B32B38; }
        .bdc-choice.hint { box-shadow: 0 0 0 calc(5px * var(--bdc-s)) #7CFFB2, 0 calc(6px * var(--bdc-s)) 0 #B9B2D6; }
        @keyframes bdc-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .bdc-choice.ko { animation: bdc-shake .4s ease; }
        @keyframes bdc-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .bdc-choice.appear, .bdc-calc.appear { animation: bdc-pop .25s ease-out; }
        .bdc-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--bdc-s)); }

        .bdc-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--bdc-s)); color: #fff;
        }
        .bdc-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--bdc-s)); color: var(--or); line-height: 1; text-align: center; }
        .bdc-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--bdc-s)); color: rgba(255,255,255,0.6); }
        .bdc-mid > small { font-size: calc(10px * var(--bdc-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .bdc-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--bdc-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--bdc-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .bdc-ready.show { display: flex; animation: bdc-pop .3s ease-out; }

        /* ── Actions ── */
        .bdc-actions { display: flex; gap: calc(8px * var(--bdc-s)); justify-content: center; flex-wrap: wrap; }
        .bdc-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bdc-s));
            padding: calc(8px * var(--bdc-s)) calc(14px * var(--bdc-s));
            border-radius: calc(14px * var(--bdc-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--bdc-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .bdc-btn:hover { filter: brightness(1.05); }
        .bdc-btn:active { transform: translateY(calc(4px * var(--bdc-s))); box-shadow: 0 calc(1px * var(--bdc-s)) 0 #B9B2D6; }
        .bdc-btn:disabled { opacity: 0.45; cursor: default; }
        .bdc-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--bdc-s));
            padding: calc(8px * var(--bdc-s)) calc(22px * var(--bdc-s));
            box-shadow: 0 calc(5px * var(--bdc-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .bdc-btn-go:active { box-shadow: 0 calc(1px * var(--bdc-s)) 0 #1C8A4F; }
        .bdc-btn:focus-visible, .bdc-choice:focus-visible, .bdc-type:focus-visible, .bdc-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .bdc-talk { display: flex; align-items: center; gap: calc(10px * var(--bdc-s)); }
        .bdc-chef {
            width: calc(44px * var(--bdc-s)); height: calc(44px * var(--bdc-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--bdc-s));
            box-shadow: 0 calc(3px * var(--bdc-s)) 0 #B3840B;
        }
        @keyframes bdc-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--bdc-s))) rotate(-8deg); } }
        .bdc-chef.hop { animation: bdc-hop .4s ease; }
        .bdc-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--bdc-s));
            padding: calc(8px * var(--bdc-s)) calc(12px * var(--bdc-s));
            font-weight: 700; font-size: calc(15px * var(--bdc-s)); line-height: 1.35;
            min-height: calc(22px * var(--bdc-s));
            border-left: calc(6px * var(--bdc-s)) solid var(--or);
        }
        .bdc-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .bdc-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .bdc-msg b { font-weight: 900; }

        /* ── Pause ── */
        .bdc-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.92); cursor: pointer;
            border-radius: inherit;
        }
        .bdc-pause.show { display: flex; animation: bdc-pop .25s ease-out; }
        .bdc-pause-card {
            text-align: center; color: #fff;
            font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--bdc-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--bdc-s)) 0 rgba(0,0,0,0.35);
        }
        .bdc-pause-card small {
            display: block; margin-top: calc(8px * var(--bdc-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--bdc-s)); opacity: 0.8; text-shadow: none;
        }
        .bdc-btn[hidden] { display: none; }
        .bdc-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--bdc-s)) 0 #B3840B; }

        /* ── Panneau élèves ── */
        .bdc-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .bdc-class.show { display: flex; }
        .bdc-class-head { display: flex; align-items: baseline; gap: 8px; }
        .bdc-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .bdc-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .bdc-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .bdc-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px;
            background: #EFEAFB; color: var(--encre);
        }
        .bdc-class-tools button:hover { background: #E1D8F8; }
        .bdc-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .bdc-class-tools button.go { background: var(--or); }
        .bdc-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .bdc-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .bdc-st {
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 4px 8px; border-radius: 9px; background: #F7F4FE;
        }
        .bdc-st:hover { background: #EFEAFB; }
        .bdc-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bdc-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .bdc-st.played .bdc-st-name::before { content: '✔ '; color: var(--vert); }
        .bdc-st.absent { opacity: 0.45; }
        .bdc-st.absent .bdc-st-name { text-decoration: line-through; }
        .bdc-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .bdc-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .bdc-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .bdc-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff;
            background: #8C82AE;
        }
        .bdc-sc.win { background: var(--vert); }
        .bdc-sc.lose { background: var(--rouge); }
        .bdc-sc.tie { background: #E0A800; }
        .bdc-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }
        .bdc-icon-btn.on { background: var(--or); color: var(--encre); }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .bdc-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .bdc-container.bdc-has-sides .bdc-side { display: flex; }
        .bdc-side-title {
            font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or);
            text-align: center; line-height: 1.1; margin-bottom: 2px;
        }
        .bdc-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
        .bdc-side .bdc-st {
            background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em;
            border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0;
        }
        .bdc-side .bdc-st:hover { background: rgba(255,255,255,0.18); }
        .bdc-side .bdc-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .bdc-side .bdc-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .bdc-side .bdc-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .bdc-side .bdc-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .bdc-side .bdc-st.played .bdc-st-name::before { color: #7CFFB2; }

        /* ── Tournoi ── */
        .bdc-tour {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bdc-s)), transparent calc(2px * var(--bdc-s))) 0 0 / calc(24px * var(--bdc-s)) calc(24px * var(--bdc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bdc-s)); box-sizing: border-box;
            padding: calc(14px * var(--bdc-s));
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            gap: calc(10px * var(--bdc-s)); color: #fff;
        }
        .bdc-tour-tabs { display: flex; flex-wrap: wrap; gap: calc(5px * var(--bdc-s)); justify-content: center; }
        .bdc-tour-tab {
            font-family: inherit; font-weight: 900; font-size: calc(12px * var(--bdc-s)); cursor: pointer;
            padding: calc(4px * var(--bdc-s)) calc(11px * var(--bdc-s)); border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); color: #fff;
        }
        .bdc-tour-tab.done { border-color: rgba(124,255,178,0.6); }
        .bdc-tour-tab.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bdc-tour-sub { font-weight: 800; font-size: calc(13px * var(--bdc-s)); color: rgba(255,255,255,0.85); text-align: center; }
        .bdc-champ {
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bdc-s));
            background: var(--or); color: var(--encre); border-radius: 999px;
            padding: calc(6px * var(--bdc-s)) calc(20px * var(--bdc-s));
            box-shadow: 0 calc(4px * var(--bdc-s)) 0 #B3840B; text-align: center;
        }
        .bdc-champ b { font-weight: 400; }
        .bdc-matches {
            display: grid; grid-template-columns: 1fr; gap: calc(6px * var(--bdc-s));
            width: 100%; max-width: calc(540px * var(--bdc-s));
            max-height: calc(250px * var(--bdc-s)); overflow-y: auto; padding: 2px; box-sizing: border-box;
        }
        .bdc-matches.two { grid-template-columns: 1fr 1fr; max-width: none; }
        .bdc-match {
            display: grid; grid-template-columns: auto 1fr auto 1fr; align-items: center;
            gap: calc(6px * var(--bdc-s)); min-width: 0;
            background: rgba(255,255,255,0.10); border-radius: calc(12px * var(--bdc-s));
            padding: calc(5px * var(--bdc-s)) calc(8px * var(--bdc-s));
            font-weight: 900; font-size: calc(14px * var(--bdc-s));
        }
        .bdc-match.cur { background: #fff; color: var(--encre); box-shadow: 0 0 0 calc(3px * var(--bdc-s)) var(--or); }
        .bdc-match.todo { opacity: 0.7; }
        .bdc-match.barrage { box-shadow: inset 0 0 0 2px rgba(255,201,51,0.7); }
        .bdc-match.barrage.cur { box-shadow: 0 0 0 calc(3px * var(--bdc-s)) var(--or); }
        .bdc-mn {
            min-width: calc(20px * var(--bdc-s)); height: calc(20px * var(--bdc-s)); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.25); color: #fff; font-size: calc(11px * var(--bdc-s));
        }
        .bdc-mn-b { background: var(--or); }
        .bdc-mp { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .bdc-mp.L { text-align: right; } .bdc-mp.R { text-align: left; }
        .bdc-match.cur .bdc-mp.L { color: #1F6FB5; } .bdc-match.cur .bdc-mp.R { color: #E0620F; }
        .bdc-mp.win { color: #7CFFB2; }
        .bdc-mp.win::after { content: ' ✔'; }
        .bdc-mp.lose { opacity: 0.5; text-decoration: line-through; }
        .bdc-mp-wait { font-style: italic; font-weight: 800; opacity: 0.7; font-size: 0.85em; }
        .bdc-ms { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(15px * var(--bdc-s)); color: var(--or); white-space: nowrap; text-align: center; }
        .bdc-match.cur .bdc-ms { color: #5B3FB0; }
        .bdc-tinfo { text-align: center; font-weight: 800; font-size: calc(12px * var(--bdc-s)); color: rgba(255,255,255,0.88); margin-top: calc(4px * var(--bdc-s)); }
        .bdc-tinfo b { color: var(--or); }
        .bdc-st.t-out { opacity: 0.45; }
        .bdc-st.t-out .bdc-st-name { text-decoration: line-through; }
        .bdc-st.t-champ { background: var(--or) !important; color: var(--encre) !important; }
        .bdc-st.t-qualif .bdc-st-state { color: var(--vert); }
        .bdc-side .bdc-st.t-qualif .bdc-st-state { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .bdc-draw {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bdc-s)), transparent calc(2px * var(--bdc-s))) 0 0 / calc(24px * var(--bdc-s)) calc(24px * var(--bdc-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bdc-s)); box-sizing: border-box;
            padding: calc(16px * var(--bdc-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--bdc-s)); color: #fff;
        }
        .bdc-draw-title {
            font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--bdc-s)); color: var(--or);
            text-shadow: 0 calc(3px * var(--bdc-s)) 0 #B3470F;
        }
        .bdc-draw-row { display: flex; align-items: center; gap: calc(14px * var(--bdc-s)); width: 100%; justify-content: center; }
        .bdc-draw-card {
            flex: 1; max-width: calc(290px * var(--bdc-s));
            border-radius: calc(20px * var(--bdc-s));
            padding: calc(14px * var(--bdc-s)) calc(10px * var(--bdc-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bdc-s)) 0 rgba(0,0,0,0.3);
        }
        .bdc-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bdc-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bdc-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--bdc-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .bdc-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(34px * var(--bdc-s)); line-height: 1.1; margin-top: calc(4px * var(--bdc-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--bdc-s)) 0 rgba(0,0,0,0.25);
        }
        .bdc-draw-card b.rolling { opacity: 0.75; }
        .bdc-draw-card b.done { animation: bdc-pop .35s ease-out; }
        .bdc-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(36px * var(--bdc-s)); color: var(--or); text-shadow: 0 calc(3px * var(--bdc-s)) 0 #B3470F; }
        .bdc-draw-info { font-weight: 800; font-size: calc(13px * var(--bdc-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }
        .bdc-card .bdc-rec { font-size: calc(12px * var(--bdc-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--bdc-s)); }
        .bdc-card .bdc-final span { display: inline-block; vertical-align: top; }
        .bdc-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--bdc-s)); }

        /* ── Fin de partie ── */
        .bdc-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .bdc-overlay.show { display: flex; }
        .bdc-card {
            background: #fff; border-radius: calc(18px * var(--bdc-s));
            padding: calc(12px * var(--bdc-s)) calc(24px * var(--bdc-s)) calc(14px * var(--bdc-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bdc-s)) 0 #B9B2D6;
            animation: bdc-pop .35s ease-out; max-width: 90%;
        }
        .bdc-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bdc-s)); color: var(--encre); }
        .bdc-card p { margin: calc(4px * var(--bdc-s)) 0 calc(8px * var(--bdc-s)); font-weight: 800; font-size: calc(15px * var(--bdc-s)); }
        .bdc-card .bdc-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--bdc-s)); margin: calc(2px * var(--bdc-s)) 0; }
        .bdc-card .bdc-final .L { color: #1F6FB5; } .bdc-card .bdc-final .R { color: #E0620F; }
        .bdc-card .bdc-sub { display: block; font-size: calc(12px * var(--bdc-s)); color: #6A5E8E; margin-top: calc(-4px * var(--bdc-s)); }
        .bdc-medal { font-size: calc(54px * var(--bdc-s)); line-height: 1; animation: bdc-pop .5s ease-out; }
        .bdc-card .bdc-actions { margin-top: calc(4px * var(--bdc-s)); }

        /* ── Statistiques (mode seul) ── */
        .bdc-stats { display: flex; gap: calc(6px * var(--bdc-s)); align-items: center; }
        .bdc-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--bdc-s)) calc(10px * var(--bdc-s));
            font-weight: 900; font-size: calc(14px * var(--bdc-s)); white-space: nowrap;
        }
        .bdc-chip.hot { background: #FF7A1A; }
        .bdc-chip.bump { animation: bdc-bump .4s ease; }
        .bdc-container.duel .bdc-stats { display: none; }
        .bdc-container:not(.duel) [data-role="class"] { display: none; }

        /* ── Mode seul ── */
        .bdc-field.solo { display: flex; }
        .bdc-half.S {
            flex: 1; gap: calc(14px * var(--bdc-s));
            background: linear-gradient(160deg, #2E2270 0%, #4A3399 100%);
        }
        .bdc-half.S .bdc-choices { flex-direction: row; justify-content: center; gap: calc(14px * var(--bdc-s)); }
        .bdc-half.S .bdc-choice { width: calc(215px * var(--bdc-s)); height: calc(100px * var(--bdc-s)); font-size: calc(34px * var(--bdc-s)); }
        .bdc-sprog {
            color: #fff; font-weight: 900; font-size: calc(15px * var(--bdc-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(4px * var(--bdc-s)) calc(16px * var(--bdc-s));
        }
        .bdc-sprog b { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); }
        .bdc-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--bdc-s)); margin: calc(4px * var(--bdc-s)) 0; }
        .bdc-bigstars span { font-size: calc(34px * var(--bdc-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .bdc-bigstars span.on { opacity: 1; filter: none; animation: bdc-pop .35s ease-out both; }
        .bdc-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .bdc-bigstars span.on:nth-child(3) { animation-delay: .4s; }

        /* ── Aide ── */
        .bdc-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .bdc-help.show { display: block; }
        .bdc-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .bdc-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .bdc-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .bdc-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: bdc-fall 1.8s ease-in forwards; }
        @keyframes bdc-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .bdc-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .bdc-container:hover .bdc-rh { opacity: 1; }
        .bdc-container.wf-fullboard .bdc-rh { display: none; }
        .bdc-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .bdc-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .bdc-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .bdc-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .bdc-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .bdc-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .bdc-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .bdc-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        /* ── Décomposition ── */
        .bdc-calc { font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(50px * var(--bdc-s)); gap: 0.22em; min-height: calc(84px * var(--bdc-s)); }
        .bdc-calc.wait { font-size: calc(54px * var(--bdc-s)); }
        .bdc-calc.appear > * { animation: bdcPop 0.25s ease-out; }
        @keyframes bdcPop { from { transform: scale(0.9); opacity: 0.4; } to { transform: scale(1); opacity: 1; } }
        .bdc-t { display: inline-flex; align-items: baseline; white-space: nowrap; }
        .bdc-t b { font-weight: 400; }
        .bdc-t i { font-style: normal; font-size: 0.72em; margin-left: 0.12em; }
        .bdc-plus { margin: 0 0.22em; color: #8A80B0; }
        .bdc-m { color: #7B4FE0; } .bdc-c { color: #D93A48; } .bdc-d { color: #1E9E5A; } .bdc-u { color: #1F6FB5; }
        .bdc-eq { color: #8A80B0; }
        .bdc-q {
            display: inline-block; min-width: 0.9em; padding: 0 0.12em; text-align: center; line-height: 1.05;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em; color: #5B3FB0; background: #F1EDFB;
        }
        .bdc-ans { color: #1C8A4F; display: inline-flex; align-items: baseline; }
        .bdc-ans .bdc-t i { color: inherit; opacity: 0.85; }
        .bdc-choice { font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(36px * var(--bdc-s)); font-variant-numeric: tabular-nums; white-space: nowrap; }
        .bdc-half.S .bdc-choice { font-size: calc(42px * var(--bdc-s)); }
        .bdc-choice .bdc-plus { margin: 0 0.12em; }
        .bdc-choice.ok .bdc-t i, .bdc-choice.ko .bdc-t i { color: inherit; }
        .bdc-msg .bdc-t i { font-size: 0.85em; }
        .bdc-type .bdc-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(13px * var(--bdc-s)); white-space: nowrap; opacity: 0.85; }
        .bdc-type { min-width: calc(96px * var(--bdc-s)); height: calc(50px * var(--bdc-s)); }

        @media (prefers-reduced-motion: reduce) {
            .bdc-container *, .bdc-container *::before, .bdc-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // TYPES DE DÉCOMPOSITIONS
    // m = unités de mille, c = centaines, d = dizaines, u = unités
    // =========================================================================
    var GROUPS = [
        { id: 'cdu',  label: 'c, d, u',               ico: '3 c + 4 u' },
        { id: 'mcdu', label: 'Jusqu\'à 9 999',        ico: '5 m + 2 d' },
        { id: 'add',  label: 'Somme',                 ico: '300 + 40 + 5' },
        { id: 'inv',  label: 'Nombre → unités',       ico: '304 = ?' },
        { id: 'des',  label: 'Dans le désordre',      ico: '4 u + 2 c' },
        { id: 'ech',  label: 'Échanges',              ico: '13 d + 2 u' },
        { id: 'dec',  label: 'Décimaux',              ico: '3 + 0,4 + 0,07' }
    ];
    var GROUP_BY = {};
    GROUPS.forEach(function (g) { GROUP_BY[g.id] = g; });
    // =========================================================================
    // RÉGLAGES MÉMORISÉS
    // =========================================================================
    var DEFAULTS = { groups: ['cdu', 'add', 'des'], speed: 10, count: 10, mode: 'count', goal: 5, voice: false, players: 'duel', org: 'free', err: 'lock' };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.groups = Array.isArray(r.groups) ? r.groups.filter(function (g) { return GROUP_BY[g]; }) : DEFAULTS.groups.slice();
                if (r.players !== 'solo') r.players = 'duel';
                if (r.org !== 'tour') r.org = 'free';     // free = duels tirés au sort · tour = tournoi
                if (r.err !== 'gift') r.err = 'lock';     // erreur : lock = côté bloqué · gift = point à l'adversaire
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
                // Tournoi en cours : { rounds: [{ players, matches: [{ L, R, w, sL, sR, barrage, wait }] }], champion, barr }
                if (!c.tour || !Array.isArray(c.tour.rounds) || !c.tour.rounds.length || !Array.isArray(c.tour.barr)) c.tour = null;
                return c;
            }
            var other = null;
            ['battle-droite-graduee-classe', 'battle-calculs-classe', 'battle-fonctions-classe', 'battle-temps-verbes-classe', 'battle-homophones-classe', 'battle-synonymes-classe', 'battle-nature-mots-classe', 'jeu-plus-grand-classe'].some(function (k) {
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


    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    // ── Écriture des nombres ───────────────────────────────────────────────
    function fmtInt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    // Décimal représenté en millièmes (entier) : 3470 → « 3,47 »
    function fmtMil(u) {
        var ip = Math.floor(u / 1000), fp = String(u % 1000);
        while (fp.length < 3) fp = '0' + fp;
        fp = fp.replace(/0+$/, '');
        return fmtInt(ip) + (fp ? ',' + fp : '');
    }
    var UNIT = ['u', 'd', 'c', 'm'];                 // rang → lettre
    var UNIT_NAME = ['unité', 'dizaine', 'centaine', 'millier'];
    // Termes [{ n, p }] : n unités du rang p (10^p)
    function termsValue(terms) { return terms.reduce(function (s, t) { return s + t.n * Math.pow(10, t.p); }, 0); }
    function termsKey(terms) { return terms.map(function (t) { return t.n + UNIT[t.p]; }).join('+'); }
    // Affichage « 3 c + 4 u » avec la lettre du rang en couleur
    function unitsHTML(key) {
        return key.split('+').map(function (t) {
            var m = t.match(/^(\d+)([mcdu])$/);
            return m ? '<span class="bdc-t"><b>' + m[1] + '</b><i class="bdc-' + m[2] + '">' + m[2] + '</i></span>' : esc(t);
        }).join('<span class="bdc-plus">+</span>');
    }
    function unitsSay(key) {
        var nm = { m: 'milliers', c: 'centaines', d: 'dizaines', u: 'unités' };
        return key.split('+').map(function (t) { var m = t.match(/^(\d+)([mcdu])$/); return m ? m[1] + ' ' + nm[m[2]] : t; }).join(' plus ');
    }
    // Une réponse est soit un nombre (« 3 004 »), soit une décomposition (« 3c+4u »)
    function dispVal(v) { return /[mcdu]$/.test(v) ? unitsHTML(v) : esc(v); }

    // Chiffres d'un nombre → termes non nuls, du plus grand rang au plus petit
    function digitsTerms(nbr) {
        var t = [], s = String(nbr);
        for (var i = 0; i < s.length; i++) {
            var p = s.length - 1 - i, n = +s[i];
            if (n) t.push({ n: n, p: p });
        }
        return t;
    }
    // Nombre avec (souvent) un ou deux zéros : c'est là que sont les pièges
    function randNumber(digits) {
        var min = Math.pow(10, digits - 1);
        for (var i = 0; i < 30; i++) {
            var x = rnd(min, min * 10 - 1);
            var zeros = (String(x).slice(1).match(/0/g) || []).length;
            if (Math.random() < 0.6 ? zeros >= 1 && zeros < digits - 1 : zeros === 0) return x;
        }
        return rnd(min, min * 10 - 1);
    }
    // Erreurs typiques sur une liste de termes
    function wrongNumbers(terms) {
        var out = [], val = termsValue(terms);
        // Chiffres écrits côte à côte dans l'ordre affiché (oubli des zéros, ordre lu)
        out.push(+terms.map(function (t) { return t.n; }).join(''));
        // Un terme au mauvais rang
        terms.forEach(function (t, i) {
            [-1, 1].forEach(function (dp) {
                var p = t.p + dp;
                if (p < 0 || p > 4 || terms.some(function (x) { return x.p === p; })) return;
                var c = terms.map(function (x, j) { return j === i ? { n: x.n, p: p } : x; });
                out.push(termsValue(c));
            });
        });
        // Deux chiffres échangés
        if (terms.length > 1) {
            var a = rnd(0, terms.length - 1), b = (a + 1) % terms.length;
            if (terms[a].n !== terms[b].n) {
                out.push(termsValue(terms.map(function (x, j) { return j === a ? { n: terms[b].n, p: x.p } : j === b ? { n: terms[a].n, p: x.p } : x; })));
            }
        }
        return out.filter(function (x) { return x > 0 && x !== val; });
    }

    // ── Fabrication d'une question ─────────────────────────────────────────
    // it = { kind, q (HTML de la question), ans, options[3], explain, say, key }
    function genItem(kind) {
        var it = { kind: kind }, wrong = [], near = [], prio = [], terms, val;

        if (kind === 'dec') {
            var a = rnd(0, 19), b = rnd(0, 9), c = rnd(1, 9);
            if (Math.random() < 0.3) b = 0;
            val = a * 1000 + b * 100 + c * 10;
            var parts = [];
            if (a) parts.push(fmtInt(a));
            if (b) parts.push('0,' + b);
            parts.push('0,0' + c);
            if (parts.length > 2 && Math.random() < 0.3) parts = shuffle(parts);
            it.q = esc(parts.join(' + '));
            it.ans = fmtMil(val);
            wrong = [fmtMil(a * 1000 + c * 100 + b * 10),           // dixièmes et centièmes inversés
                     fmtMil(a * 1000 + b * 100 + c),                 // 3,407
                     fmtMil(a * 10000 + b * 1000 + c * 100)];        // 34,7
            if (!b) wrong.push(fmtMil(a * 1000 + c * 100));          // 3,7 au lieu de 3,07
            near = [fmtMil(val + 100), fmtMil(Math.max(0, val - 100)), fmtMil(val + 10), fmtMil(Math.max(0, val - 10))];
            it.explain = (b ? '0,' + b + ' = ' + b + ' dixième' + (b > 1 ? 's' : '') + ', ' : '')
                + '0,0' + c + ' = ' + c + ' centième' + (c > 1 ? 's' : '') + ' : <b>' + parts.join(' + ') + ' = ' + it.ans + '</b>.';
            it.say = parts.join(' plus ') + ' égale ?';
        } else if (kind === 'inv') {
            val = randNumber(Math.random() < 0.5 ? 3 : 4);
            terms = digitsTerms(val);
            it.q = esc(fmtInt(val));
            it.ans = termsKey(terms);
            // Décompositions fausses : un chiffre au mauvais rang, ou deux chiffres échangés
            terms.forEach(function (t, i) {
                [-1, 1].forEach(function (dp) {
                    var p = t.p + dp;
                    if (p < 0 || p > 3 || terms.some(function (x) { return x.p === p; })) return;
                    var c2 = terms.map(function (x, j) { return j === i ? { n: x.n, p: p } : x; });
                    c2.sort(function (x, y) { return y.p - x.p; });
                    wrong.push(termsKey(c2));
                });
            });
            if (terms.length > 1) {
                for (var s = 0; s + 1 < terms.length; s++) {
                    if (terms[s].n === terms[s + 1].n) continue;
                    near.push(termsKey(terms.map(function (x, j) { return j === s ? { n: terms[s + 1].n, p: x.p } : j === s + 1 ? { n: terms[s].n, p: x.p } : x; })));
                }
            }
            terms.forEach(function (t, i) {
                [t.n - 1, t.n + 1].forEach(function (n2) {
                    if (n2 < 1 || n2 > 9) return;
                    near.push(termsKey(terms.map(function (x, j) { return j === i ? { n: n2, p: x.p } : x; })));
                });
            });
            // Forme « 30 d + 4 u » (juste mais pas la décomposition en chiffres) : jamais proposée
            it.explain = '<b>' + fmtInt(val) + '</b> : ' + terms.map(function (t) { return t.n + ' ' + UNIT_NAME[t.p] + (t.n > 1 ? 's' : ''); }).join(', ')
                + (String(val).indexOf('0') > 0 ? ' (le 0 indique qu\'il n\'y a rien à ce rang)' : '') + '.';
            it.say = 'Comment se décompose ' + val + ' ?';
        } else if (kind === 'ech') {
            // Un rang contient 10 ou plus : il faut faire un échange
            var base = rnd(1, 8), big = rnd(10, 19), small = rnd(0, 9);
            var form = pick(['cd', 'du', 'cu']);
            if (form === 'cd') terms = [{ n: base, p: 2 }, { n: big, p: 1 }].concat(small ? [{ n: small, p: 0 }] : []);
            else if (form === 'du') terms = [{ n: base, p: 2 }, { n: small || 1, p: 1 }, { n: big, p: 0 }];
            else terms = [{ n: base, p: 2 }, { n: big, p: 0 }];
            if (Math.random() < 0.4) terms = shuffle(terms.slice());
            val = termsValue(terms);
            it.q = unitsHTML(termsKey(terms));
            it.ans = fmtInt(val);
            var bigT = terms.filter(function (t) { return t.n >= 10; })[0];
            // Oubli de l'échange : on garde seulement le chiffre des unités du grand nombre
            prio = [fmtInt(val - Math.floor(bigT.n / 10) * Math.pow(10, bigT.p + 1)),   // échange oublié
                    fmtInt(+terms.map(function (t) { return t.n; }).join(''))];           // chiffres collés
            wrong = wrongNumbers(terms);
            near = [val + 10, val - 10, val + 100, val - 100].filter(function (x) { return x > 0; });
            wrong = wrong.map(fmtInt); near = near.map(fmtInt);
            it.explain = bigT.n + ' ' + UNIT_NAME[bigT.p] + 's = ' + Math.floor(bigT.n / 10) + ' ' + UNIT_NAME[bigT.p + 1] + ' et ' + (bigT.n % 10) + ' ' + UNIT_NAME[bigT.p] + (bigT.n % 10 > 1 ? 's' : '')
                + ' : <b>' + terms.map(function (t) { return fmtInt(t.n * Math.pow(10, t.p)); }).join(' + ') + ' = ' + it.ans + '</b>.';
            it.say = unitsSay(termsKey(terms)) + ', ça fait combien ?';
        } else {
            val = randNumber(kind === 'mcdu' ? 4 : kind === 'cdu' ? 3 : (Math.random() < 0.5 ? 3 : 4));
            terms = digitsTerms(val);
            if (kind === 'des') {
                for (var tries = 0; tries < 10; tries++) {
                    var sh = shuffle(terms.slice());
                    if (termsKey(sh) !== termsKey(terms)) { terms = sh; break; }
                }
                if (terms.length < 2) { terms = digitsTerms(val = rnd(3, 9) * 100 + rnd(1, 9) * 10 + rnd(1, 9)); terms.reverse(); }
            }
            it.q = kind === 'add'
                ? esc(terms.map(function (t) { return fmtInt(t.n * Math.pow(10, t.p)); }).join(' + '))
                : unitsHTML(termsKey(terms));
            it.ans = fmtInt(val);
            wrong = wrongNumbers(terms).map(fmtInt);
            var glued = fmtInt(+terms.map(function (t) { return t.n; }).join(''));
            if (glued !== it.ans) prio = [glued];                      // chiffres collés : 3 c + 4 u → 34
            near = [val + 10, val - 10, val + 100, val - 100, val + 1, val - 1].filter(function (x) { return x > 0; }).map(fmtInt);
            var hasZero = String(val).slice(1).indexOf('0') >= 0;
            it.explain = '<b>' + terms.map(function (t) { return fmtInt(t.n * Math.pow(10, t.p)); }).join(' + ') + ' = ' + it.ans + '</b>'
                + (hasZero ? ' : là où il n\'y a rien, on écrit un <b>0</b>.' : '.');
            it.say = (kind === 'add' ? terms.map(function (t) { return t.n * Math.pow(10, t.p); }).join(' plus ') : unitsSay(termsKey(terms))) + ', ça fait combien ?';
        }

        // Choix des 2 intrus : une erreur typique + une réponse voisine (si possible)
        var seen = {};
        seen[it.ans] = true;
        var ok = function (v) { return v && !seen[v] && !/^0(?!,)|-/.test(v); };
        var opts = [it.ans];
        shuffle(prio).forEach(function (v) { if (opts.length < 2 && ok(v)) { opts.push(v); seen[v] = true; } });
        var pools = Math.random() < 0.75 ? [shuffle(wrong.slice()), shuffle(near.slice())] : [shuffle(near.slice()), shuffle(wrong.slice())];
        pools.forEach(function (pool) {
            for (var i = 0; i < pool.length && opts.length < 3; i++) {
                if (ok(pool[i])) { opts.push(pool[i]); seen[pool[i]] = true; break; }
            }
        });
        wrong.concat(near).forEach(function (v) { if (opts.length < 3 && ok(v)) { opts.push(v); seen[v] = true; } });
        it.options = opts;
        it.key = kind + '|' + it.q;
        return it;
    }

    // Répartition équilibrée des types, en évitant deux fois le même à la suite
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
    function generateSeries(s) {
        var list = [], used = {};
        balancedGroups(s.groups, s.count).forEach(function (gid) {
            var it = genItem(gid);
            for (var i = 0; i < 12 && (used[it.key] || it.options.length < 3); i++) it = genItem(gid);
            used[it.key] = true;
            list.push(it);
        });
        return list;
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _bdcAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_bdcAudio) _bdcAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _bdcAudio, t0 = ctx.currentTime + start;
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
    window.createBattleDecompositionWidget = function (savedData) {
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
        container.className = 'bdc-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="bdc-inner">
            <div class="bdc-header">
                <span class="bdc-title">⚔️ Battle décomposition</span>
                <div class="bdc-stats">
                    <span class="bdc-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="bdc-chip" data-role="record" title="Record pour ces réglages (sur cet ordinateur)">🏆 0</span>
                    <span class="bdc-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="bdc-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="bdc-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="bdc-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="bdc-arena"></div>

            <div class="bdc-talk">
                <div class="bdc-chef">⚔️</div>
                <div class="bdc-msg"></div>
            </div>

            <div class="bdc-actions">
                <button class="bdc-btn bdc-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="bdc-btn" data-act="setup">⚙️ Réglages</button>
                <button class="bdc-btn bdc-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="bdc-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="bdc-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>👤 <b>Seul</b> : une série de questions chronométrées. Touche le bon nombre le plus vite possible pour gagner plus de points ! 🏆 Bats ton record.</p>
                <p>👥 <b>À deux</b> :</p>
                <p>Deux élèves au tableau, <b>un de chaque côté</b>. Une décomposition apparaît au milieu : <b class="bdc-m">m</b> = milliers, <b class="bdc-c">c</b> = centaines, <b class="bdc-d">d</b> = dizaines, <b class="bdc-u">u</b> = unités.</p>
                <p>Chaque joueur touche le <b>bon nombre</b> de son côté (pas dans le même ordre que l'adversaire). Le premier qui trouve marque <b>1 point</b>.</p>
                <p>💡 Attention aux pièges : <b>3 c + 4 u</b> fait <b>304</b> (pas 34 !), les unités peuvent être dans le désordre, et <b>13 d</b> = 1 c + 3 d.</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour cette question : inutile de cliquer au hasard ! Ou bien, au choix dans ⚙️ Réglages, <b>le point va à l'adversaire 🎁</b>. Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>🏆 <b>Tournoi</b> (avec une liste 📂) : choisissez « 🏆 Tournoi » dans ⚙️ Réglages. Les élèves présents sont répartis en matchs ; seuls les <b>gagnants</b> passent au tour suivant, jusqu'à la <b>finale</b>. Nombre impair : un <b>match de barrage</b> est joué d'abord (le perdant est éliminé, le vainqueur joue encore un match). En cas d'égalité, une <b>question décisive</b> départage les joueurs.</p>
                <p>Selon les réglages : celui qui a le plus de points à la fin de la série gagne, ou bien le <b>premier à atteindre</b> le nombre de points choisi.</p>
                <p>📂 Chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p style="margin:0">Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
            </div>
            <div class="bdc-side bdc-side-L"><div class="bdc-side-title">📂 Élèves</div><div class="bdc-side-list"></div></div>
            <div class="bdc-side bdc-side-R"><div class="bdc-side-title">📂 Élèves</div><div class="bdc-side-list"></div></div>
            <div class="bdc-class">
                <div class="bdc-class-head"><h4>📂 Élèves</h4><span class="bdc-class-count"></span></div>
                <div class="bdc-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="bdc-class-list"></div>
                <p class="bdc-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="bdc-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="bdc-confetti"></div>
            <div class="bdc-rh bdc-rh-nw" data-dir="nw"></div>
            <div class="bdc-rh bdc-rh-n"  data-dir="n"></div>
            <div class="bdc-rh bdc-rh-ne" data-dir="ne"></div>
            <div class="bdc-rh bdc-rh-e"  data-dir="e"></div>
            <div class="bdc-rh bdc-rh-se" data-dir="se"></div>
            <div class="bdc-rh bdc-rh-s"  data-dir="s"></div>
            <div class="bdc-rh bdc-rh-sw" data-dir="sw"></div>
            <div class="bdc-rh bdc-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.bdc-inner');
        const arena    = $('.bdc-arena');
        const msg      = $('.bdc-msg');
        const chef     = $('.bdc-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.bdc-help');
        const confetti = $('.bdc-confetti');
        const classBtn   = $('[data-role="class"]');
        const classBox   = $('.bdc-class');
        const classList  = $('.bdc-class-list');
        const classFile  = $('.bdc-class-file');
        const sideL = $('.bdc-side-L'), sideR = $('.bdc-side-R');
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
        let decisive = false;         // tournoi : égalité → manche décisive en cours
        let names = { L: 'Joueur bleu', R: 'Joueur orange' };
        let CL = loadClass();
        let pair = null;              // { L: id, R: id } : élèves tirés au sort
        let rolling = false;          // animation de tirage en cours
        let soundOn = true;
        // Mode seul
        let good = 0, score = 0, streak = 0, times = [];
        const RECORD_KEY = 'battle-decomposition-records';
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
            container.classList.toggle('bdc-has-sides', sides);
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
                container.style.setProperty('--bdc-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--bdc-s', sc.toFixed(4));
            fitCalc();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'bdc-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            const spinner = (label, key, min, max) => `
                <div class="bdc-spinner">
                    <div class="bdc-spinner-label">${label}</div>
                    <div class="bdc-spinner-inner">
                        <button class="bdc-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="bdc-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="bdc-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
                        const chip = (g) => `<button class="bdc-type" data-grp="${g.id}">${esc(g.label)}<span class="bdc-type-ico">${esc(g.ico)}</span></button>`;
            arena.innerHTML = `
              <div class="bdc-setup">
                <div class="bdc-label">Nombre de joueurs</div>
                <div class="bdc-chips">
                    <button class="bdc-small bdc-mode" data-players="solo">👤 Seul</button>
                    <button class="bdc-small bdc-mode" data-players="duel">👥 À deux (duel au tableau)</button>
                    <button class="bdc-small bdc-mode" data-players="tour" title="Élimination directe avec la liste d'élèves 📂 : seuls les gagnants passent au tour suivant">🏆 Tournoi</button>
                </div>
                <div class="bdc-label">Décompositions</div>
                <div class="bdc-chips">${GROUPS.map(chip).join('')}</div>

                <div data-duelonly>
                <div class="bdc-label">Qui gagne le duel ?</div>
                <div class="bdc-chips">
                    <button class="bdc-small bdc-mode" data-mode="count" title="Le duel s'arrête après un nombre fixe de questions">🔢 Le plus de points en N questions</button>
                    <button class="bdc-small bdc-mode" data-mode="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                </div>
                <div class="bdc-label">En cas de mauvaise réponse</div>
                <div class="bdc-chips">
                    <button class="bdc-small bdc-mode" data-err="lock" title="Le joueur qui se trompe ne peut plus répondre ; l'autre peut encore marquer">🔒 Son côté est bloqué</button>
                    <button class="bdc-small bdc-mode" data-err="gift" title="Une mauvaise réponse donne immédiatement le point à l'adversaire">🎁 Le point va à l'adversaire</button>
                </div>
                <div class="bdc-tinfo" data-tinfo></div>
                </div>
                <div class="bdc-params" style="margin-top:calc(6px * var(--bdc-s))">
                    ${spinner('Secondes<br>par question', 'speed', 3, 60)}
                    <div data-modebox="count">${spinner('Nombre<br>de questions', 'count', 3, 40)}</div>
                    <div data-modebox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="bdc-chips" style="margin-top:calc(4px * var(--bdc-s))">
                    <button class="bdc-toggle" data-opt="voice"><span class="bdc-dot"></span>🔊 Lire la consigne à voix haute</button>
                </div>
                <div class="bdc-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.bdc-setup');
            const sync = () => {
                setupEl.querySelectorAll('[data-grp]').forEach(b => b.classList.toggle('on', S.groups.indexOf(b.dataset.grp) >= 0));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
                const duel = S.players === 'duel';
                const shown = S.players === 'solo' ? 'solo' : S.org === 'tour' ? 'tour' : 'duel';
                setupEl.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', b.dataset.players === shown));
                setupEl.querySelectorAll('[data-err]').forEach(b => b.classList.toggle('on', b.dataset.err === S.err));
                const ti = setupEl.querySelector('[data-tinfo]');
                if (ti) ti.innerHTML = tourOn() ? tourInfo() : '';
                setupEl.querySelectorAll('[data-duelonly]').forEach(el => el.classList.toggle('bdc-hide', !duel));
                // En mode seul : uniquement « Nombre de questions »
                setupEl.querySelectorAll('[data-modebox]').forEach(el => el.classList.toggle('bdc-hide', el.dataset.modebox !== (duel ? S.mode : 'count')));
                container.classList.toggle('duel', duel);
                updateStats(false);
                setupEl.querySelector('.bdc-warn').textContent = '';
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
            setupEl.querySelectorAll('[data-err]').forEach(b => b.addEventListener('click', () => {
                S.err = b.dataset.err; sync(); saveSettings(S);
            }));
            setupEl.querySelectorAll('[data-players]').forEach(b => b.addEventListener('click', () => {
                // Seul / À deux / Tournoi (le tournoi est une suite de duels : players « duel » + org « tour »)
                const np = b.dataset.players === 'solo' ? 'solo' : 'duel';
                const no = b.dataset.players === 'solo' ? S.org : b.dataset.players === 'tour' ? 'tour' : 'free';
                if (S.players === np && S.org === no) return;
                S.players = np; S.org = no; sync(); saveSettings(S);
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
            const setupEl = arena.querySelector('.bdc-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.bdc-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (!S.groups.length) { warn('Choisissez au moins un type de décomposition.'); return false; }
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
            $('.bdc-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué`
                : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            const playing = state === 'wait' || state === 'go' || state === 'result';
            clBtn('draw').disabled = !hasClass() || playing || rolling || tourOn();
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && !isSolo() && CL.students.length > 0;
            if (wantSides !== container.classList.contains('bdc-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="bdc-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['bdc-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (pair && pair.L === st.id) cls.push('cur-L');
                if (pair && pair.R === st.id) cls.push('cur-R');
                const ts = tourOn() ? tourStatus(st.id) : null;
                if (ts) cls.push('t-' + ts);
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="bdc-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = (pair && (pair.L === st.id || pair.R === st.id)) ? 'au tableau'
                    : ts === 'champ' ? '🏆 champion' : ts === 'out' ? 'éliminé' : ts === 'qualif' ? 'qualifié' : ts === 'in' ? 'en lice'
                    : st.absent ? 'absent' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="bdc-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="bdc-st-state">${stateTxt}</span>` : ''}
                    <span class="bdc-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('bdc-has-sides')) return;
            const rows = classList.querySelectorAll('.bdc-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.bdc-side-list'), sideR.querySelector('.bdc-side-list')];
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
                sd.querySelector('.bdc-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.bdc-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        [sideL, sideR].forEach(sd => {
            sd.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('.bdc-st');
                if (row) toggleAbsent(row.dataset.id);
            });
        });
        classList.addEventListener('click', (e) => {
            const row = e.target.closest('.bdc-st');
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
        const isPlaying = () => state === 'wait' || state === 'go' || state === 'result';
        const tourOn = () => !isSolo() && S.org === 'tour';
        const tourCur = () => CL.tour ? CL.tour.rounds[CL.tour.rounds.length - 1] : null;
        const curMatch = () => { const R = tourCur(); return R && !CL.tour.champion ? R.matches.find(m => !m.w && m.R) || null : null; };
        // Le match en cours de jeu (si le duel au tableau est un match du tournoi)
        const tourMatch = () => {
            if (!tourOn() || !pair) return null;
            const m = curMatch();
            return m && m.L === pair.L && m.R === pair.R ? m : null;
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
        function tourInfo() {
            if (CL.tour && !CL.tour.champion) {
                const R = tourCur();
                return `🏆 Tournoi en cours : <b>${roundName(R, CL.tour.rounds.length - 1)}</b> · ${R.matches.filter(m => m.w).length} / ${R.matches.length} matchs joués`;
            }
            const n = CL.students.filter(st => !st.absent).length;
            if (n < 2) return '🏆 Tournoi : chargez d\'abord une liste d\'élèves avec le bouton 📂';
            return `🏆 Tournoi : <b>${n}</b> élèves présents · nombre impair = <b>match de barrage</b> · égalité = question décisive`;
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
            stopSpeech();
            resetPause();
            state = 'tour';
            pair = null;
            const T = CL.tour, cur = T.rounds.length - 1;
            const vi = view == null ? cur : Math.max(0, Math.min(cur, view));
            const R = T.rounds[vi];
            const m = curMatch();
            const nm = (id) => esc(shortName(stById(id)) || '?');
            const fn = (id) => { const st = stById(id); return st ? esc(fullName(st)) : '?'; };
            const tabs = T.rounds.map((r, i) =>
                `<button class="bdc-tour-tab${i === vi ? ' on' : ''}${roundDone(r) ? ' done' : ''}" data-tv="${i}">${roundName(r, i)}${roundDone(r) ? ' ✔' : ''}</button>`).join('');
            let num = 0;
            const rows = R.matches.map((x) => {
                const isCur = x === m;
                const p = (id, side) => id
                    ? `<span class="bdc-mp ${side}${x.w ? (x.w === id ? ' win' : ' lose') : ''}" title="${fn(id)}">${nm(id)}</span>`
                    : `<span class="bdc-mp ${side} bdc-mp-wait">⚔️ vainqueur du barrage</span>`;
                const mid = x.w ? `<span class="bdc-ms">${x.sL} – ${x.sR}</span>` : `<span class="bdc-ms">${isCur ? '▶' : 'vs'}</span>`;
                const tag = x.barrage ? '<span class="bdc-mn bdc-mn-b" title="Match de barrage : le perdant est éliminé">⚔️</span>' : `<span class="bdc-mn">${++num}</span>`;
                return `<div class="bdc-match ${x.w ? 'done' : isCur ? 'cur' : 'todo'}${x.barrage ? ' barrage' : ''}">${tag}${p(x.L, 'L')}${mid}${p(x.R, 'R')}</div>`;
            }).join('');
            const playedN = R.matches.filter(x => x.w).length;
            const champ = T.champion
                ? `<div class="bdc-champ">🏆 <b>${fn(T.champion)}</b> remporte le tournoi !</div>`
                : `<div class="bdc-tour-sub">${R.players.length} joueur${R.players.length > 1 ? 's' : ''}${hasBarrage(R) ? ' (nombre impair : ⚔️ barrage)' : ''} · match ${Math.min(playedN + 1, R.matches.length)} / ${R.matches.length}${vi < cur ? ' · tour terminé' : ''}</div>`;
            arena.innerHTML = `
              <div class="bdc-tour">
                <div class="bdc-draw-title">🏆 Tournoi</div>
                <div class="bdc-tour-tabs">${tabs}</div>
                ${champ}
                <div class="bdc-matches${R.matches.length > 4 ? ' two' : ''}">${rows}</div>
                <div class="bdc-actions"><button class="bdc-btn" data-tr="new">🔁 Nouveau tournoi</button></div>
              </div>`;
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
                if (S.voice && view == null) { const a = stById(m.L), b = stById(m.R); if (a && b) speak(`${a.prenom} contre ${b.prenom}`); }
            }
            updateButtons();
            requestAnimationFrame(applyScale);
        }

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
              <div class="bdc-draw">
                <div class="bdc-draw-title">🎲 Tirage au sort</div>
                <div class="bdc-draw-row">
                    <div class="bdc-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="bdc-draw-vs">VS</div>
                    <div class="bdc-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="bdc-draw-info"></div>
                <div class="bdc-actions">
                    <button class="bdc-btn" data-dr="again">🎲 Nouveau tirage</button>
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
            const elL = arena.querySelector('.bdc-draw-card b[data-side="L"]');
            const elR = arena.querySelector('.bdc-draw-card b[data-side="R"]');
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
            arena.querySelectorAll('.bdc-draw-card b').forEach(el => {
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = el.dataset.side === 'L' ? shortName(stL) : shortName(stR);
                el.title = fullName(el.dataset.side === 'L' ? stL : stR);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.bdc-draw-info');
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
                <div class="bdc-half ${side}" data-side="${side}">
                    <div class="bdc-phead">
                        <input class="bdc-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="bdc-pscore">${pts[side]}</div>
                    </div>
                    <div class="bdc-choices" data-side="${side}">
                        <button class="bdc-choice hidden" data-i="0">?</button>
                        <button class="bdc-choice hidden" data-i="1">?</button>
                        <button class="bdc-choice hidden" data-i="2">?</button>
                    </div>
                    <div class="bdc-pkeys">clavier : ${KEYS[side].map(k => k.toUpperCase()).join(' / ')}</div>
                </div>`;
            arena.innerHTML = `
              <div class="bdc-duel">
                <div class="bdc-banner">
                    <div class="bdc-calc wait">?</div>
                    <div class="bdc-timebar"><i></i></div>
                </div>
                <div class="bdc-field">
                    ${half('L')}
                    <div class="bdc-mid"><small>Question</small><b data-role="round">${roundLabel(0)}</b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="bdc-ready"></div>
              <div class="bdc-pause"><div class="bdc-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bdc-overlay"><div class="bdc-card"></div></div>`;

            arena.querySelectorAll('.bdc-pname').forEach(inp => {
                const side = inp.closest('.bdc-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            arena.querySelector('.bdc-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.bdc-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.bdc-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        // Arène du mode seul : la question en haut, les réponses en dessous
        function buildSolo() {
            arena.innerHTML = `
              <div class="bdc-duel bdc-solo">
                <div class="bdc-banner">
                    <div class="bdc-calc wait">?</div>
                    <div class="bdc-timebar"><i></i></div>
                </div>
                <div class="bdc-field solo">
                    <div class="bdc-half S" data-side="S">
                        <div class="bdc-sprog" data-role="round">${roundLabel(0)}</div>
                        <div class="bdc-choices" data-side="S">
                            <button class="bdc-choice hidden" data-i="0">?</button>
                            <button class="bdc-choice hidden" data-i="1">?</button>
                            <button class="bdc-choice hidden" data-i="2">?</button>
                        </div>
                        <div class="bdc-pkeys">clavier : 1 / 2 / 3</div>
                    </div>
                </div>
              </div>
              <div class="bdc-ready"></div>
              <div class="bdc-pause"><div class="bdc-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bdc-overlay"><div class="bdc-card"></div></div>`;
            arena.querySelector('.bdc-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            arena.querySelectorAll('.bdc-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    answer('S', b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.bdc-choices[data-side="${side}"] .bdc-choice`);
        const allChoices = () => arena.querySelectorAll('.bdc-choice');
        const calcEl = () => arena.querySelector('.bdc-calc');
        const readyEl = () => arena.querySelector('.bdc-ready');
        const overlay = () => arena.querySelector('.bdc-overlay');

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
            const right = withAns ? `<span class="bdc-ans">${dispVal(it.ans)}</span>` : '<span class="bdc-q">?</span>';
            return `<span class="bdc-t">${it.q}</span><span class="bdc-eq">=</span>${right}`;
        }
        // Explication après la réponse : le calcul complet
        function explainText(it) { return it.explain; }
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
            c.className = 'bdc-calc solved';
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
            arena.querySelectorAll('.bdc-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'bdc-choice hidden'; b.textContent = '?'; b.style.display = ''; delete b.dataset.v; });
            const c = calcEl();
            c.className = 'bdc-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.bdc-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = roundLabel(idx + 1);
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'bdc-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            // Mêmes réponses (2 ou 3) de chaque côté, mais dans un ordre différent
            (isSolo() ? ['S'] : ['L', 'R']).forEach(side => {
                const opts = shuffle(it.options.slice());
                choiceBtns(side).forEach((b, i) => {
                    if (i >= opts.length) { b.style.display = 'none'; return; }
                    b.style.display = '';
                    b.dataset.v = opts[i];
                    b.innerHTML = dispVal(opts[i]);
                    b.className = 'bdc-choice appear';
                });
                // Touches clavier : autant que de réponses proposées (2 ou 3)
                const pk = arena.querySelector(`.bdc-half[data-side="${side}"] .bdc-pkeys`);
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
            const tb = arena.querySelector('.bdc-timebar');
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
            if (isSolo()) return `Question <b>${n}</b> / ${series.length}`;
            if (decisive) return `⚡<small>décisive</small>`;
            return goalMode() ? `${n}<small>1er à ${S.goal}</small>` : `${n}<small>/ ${series.length}</small>`;
        }
        function nextRound() {
            idx++;
            if (goalMode()) {
                // Série « sans fin » : on ajoute des questions tant que personne n'a gagné
                if (idx >= series.length) series = series.concat(generateSeries(Object.assign({}, S, { count: 10 })));
                newRound();
                return;
            }
            if (idx >= series.length && !isSolo() && pts.L === pts.R && tourMatch()) {
                // Tournoi : il faut un gagnant → question décisive (le prochain point gagne)
                decisive = true;
                series = series.concat(generateSeries(Object.assign({}, S, { count: 1 })));
                say(`⚖️ Égalité ${pts.L} à ${pts.R} ! <b>Question décisive</b> : le prochain point gagne le match.`);
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
                const half = arena.querySelector(`.bdc-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.bdc-pscore');
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
            } else if (S.err === 'gift') {
                // Mode « point à l'adversaire » : la manche s'arrête, l'autre joueur marque
                state = 'result';
                stopSpeech();
                pts[other]++;
                b.classList.add('ko');
                const half = arena.querySelector(`.bdc-half.${other}`);
                half.classList.add('win');
                const sc = half.querySelector('.bdc-pscore');
                sc.textContent = pts[other];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                revealAnswer();
                sfx('bad');
                setTimeout(() => sfx(other === 'L' ? 'pointL' : 'pointR'), 250);
                const balle = goalMode() && pts[other] === S.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : 🎁 le point va à ${other === 'L' ? '🔵' : '🟠'} <b>${esc(names[other])}</b> ! ${explainText(it)}${balle}`, 'bad');
                await pwait(1900);
                if (id !== runId) return;
                if (goalMode() && pts[other] >= S.goal) duelEnd();
                else nextRound();
            } else {
                locked[side] = true;
                b.classList.add('ko');
                arena.querySelector(`.bdc-half.${side}`).classList.add('lock');
                sfx('bad');
                // Pas d'explication ici : avec 2 formes, elle donnerait la réponse à l'adversaire
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour cette question !`, 'bad');
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
                say(`❌ Oups ! Pas <b>${dispVal(b.dataset.v)}</b>. ${explainText(it)}`, 'bad');
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
            const title = st === 3 ? 'As de la numération !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > 0 && score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) {} }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.bdc-card').innerHTML = `
                <div class="bdc-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="bdc-bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${n} · ${score} points</p>
                <p class="bdc-sub">${times.length ? `Temps moyen : ${avg} s` : 'Aucune bonne réponse'}${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="bdc-actions">
                    <button class="bdc-btn bdc-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="bdc-btn" data-act="tosetup">⚙️ Réglages</button>
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
            const tm = tie ? null : tourMatch();
            let tourTxt = '';
            if (tm) {
                tm.w = w === 'L' ? pair.L : pair.R; tm.sL = pts.L; tm.sR = pts.R;
                const isBarrage = !!tm.barrage;
                const res = tourAdvance();
                const last = isBarrage ? tourCur().matches.find(x => x.wait) : null;
                tourTxt = isBarrage
                    ? `⚔️ ${esc(names[w])} gagne le barrage et reste en lice !` + (last ? ` Prochain adversaire : ${esc(shortName(stById(last.L)))}.` : '')
                    : res === 'champion'
                        ? `🏆 ${esc(names[w])} remporte le tournoi !`
                        : `🏆 ${esc(names[w])} est qualifié(e) pour le tour suivant !` + (res === 'newround' ? ' · Ce tour est terminé.' : '');
            }
            const recorded = recordDuel();
            const nextBtns = `
                <div class="bdc-actions">
                    ${tm ? '<button class="bdc-btn bdc-btn-go" data-act="tour">🏆 Suite du tournoi</button>'
                         : hasClass() ? '<button class="bdc-btn bdc-btn-go" data-act="next">🎲 Duel suivant</button>' : ''}
                    <button class="bdc-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            const recTxt = tourTxt ? `<p class="bdc-rec">${tourTxt}</p>` : recorded ? '<p class="bdc-rec">✔ Scores ajoutés dans la liste 📂</p>' : '';
            ov.querySelector('.bdc-card').innerHTML = tie ? `
                <div class="bdc-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="bdc-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bdc-sub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} questions.</p>
                ${recTxt}${nextBtns}` : `
                <div class="bdc-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="bdc-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bdc-sub">sur ${nb} questions</p>
                ${recTxt}${nextBtns}`;
            ov.classList.add('show');
            sfx('win'); party();
            say(tie
                ? `🤝 Égalité ${pts.L} à ${pts.R} ! Bravo à tous les deux.`
                : `🏆 Victoire de <b>${esc(names[w])}</b> ${pts.L} à ${pts.R} ! Bravo !`, 'good');
            ov.querySelector('[data-act="tosetup"]').addEventListener('click', (e) => { e.stopPropagation(); showSetup(); });
            const tb = ov.querySelector('[data-act="tour"]');
            if (tb) tb.addEventListener('click', (e) => { e.stopPropagation(); showTournament(); });
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
            btn('start').textContent = playing ? (tourMatch() ? '🔄 Rejouer le match' : '🔄 Recommencer')
                : state === 'tour' ? (CL.tour && CL.tour.champion ? '🔁 Nouveau tournoi' : '▶ Jouer le match')
                : isSolo() ? '▶ Jouer'
                : tourOn() ? (CL.tour && !CL.tour.champion ? '▶ Reprendre le tournoi' : '▶ Lancer le tournoi')
                : '▶ Lancer le duel';
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
            const p = arena.querySelector('.bdc-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (!playing) return;
            const p = arena.querySelector('.bdc-pause');
            if (!paused) {
                paused = true; pauseStart = performance.now();
                stopSpeech();
                if (p) p.classList.add('show');
                say(isSolo() ? '⏸ Pause. Clique sur <b>▶ Reprendre</b> pour continuer.' : '⏸ Duel en pause. Cliquez sur <b>▶ Reprendre</b> pour continuer.');
            } else {
                pausedTotal += performance.now() - pauseStart;
                paused = false;
                if (p) p.classList.remove('show');
                say(isSolo() ? `▶ C'est reparti ! (question ${idx + 1} / ${series.length} · ${score} points)`
                             : `▶ C'est reparti ! (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)})`);
                if (state === 'go' && S.voice && series[idx]) speak(series[idx].say);
            }
            updateButtons();
            container.focus({ preventScroll: true });
        }
        async function start() {
            if (rolling) return;
            if (state === 'setup' && !validateSettings()) return;
            if (tourOn()) {
                // Tournoi : on joue le prochain match du tableau (ou on rejoue le match en cours)
                if (state === 'tour' && CL.tour && CL.tour.champion) { newTournament(false); return; }
                const m = curMatch();
                const replay = isPlaying() && tourMatch();
                if (!m || (state !== 'tour' && !replay)) { showTournament(); return; }
                pair = { L: m.L, R: m.R };
            }
            // Classe chargée : on passe d'abord par l'écran de tirage au sort
            else if (hasClass() && (state === 'setup' || state === 'over' || !pair)) {
                if (state !== 'draw' || !pair) { showDraw(!pair); return; }
            }
            if (pair) applyPairNames();
            container.focus({ preventScroll: true });
            runId++;
            stopSpeech();
            series = generateSeries(goalMode() ? Object.assign({}, S, { count: Math.max(10, S.goal * 2) }) : S);
            idx = 0;
            decisive = false;
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
            if (isSolo()) say(`⚡ ${series.length} questions, ${S.speed} s par question : trouve le bon nombre !`);
            else say(`⚡ ${goalMode() ? `Le premier à ${S.goal} point${S.goal > 1 ? 's' : ''} gagne !` : `${series.length} questions.`} ${S.speed} s par question. ${S.err === 'gift' ? 'Une erreur donne le point à ton adversaire 🎁 : réfléchis avant de toucher !' : 'Une erreur bloque ton côté : réfléchis avant de toucher !'}`);
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
            if (isSolo()) return '⚔️ Choisis les décompositions, puis clique sur <b>▶ Jouer</b> : trouve le bon nombre !';
            if (tourOn()) {
                if (CL.tour && !CL.tour.champion) return '🏆 Un tournoi est en cours : cliquez sur <b>▶ Reprendre le tournoi</b> pour voir le prochain match.';
                return hasClass()
                    ? '🏆 Tournoi : les élèves présents de la liste 📂 sont répartis en matchs. Seuls les gagnants passent au tour suivant, jusqu\'à la <b>finale</b> ! Cliquez sur <b>▶ Lancer le tournoi</b>.'
                    : '🏆 Pour un tournoi, chargez d\'abord une liste d\'élèves avec le bouton <b>📂</b> (au moins 2 élèves présents).';
            }
            return hasClass()
                ? `⚔️ Choisissez les décompositions, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.`
                : '⚔️ Choisissez les décompositions, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
        }
        btn('start').addEventListener('click', start);
        btn('setup').addEventListener('click', () => showSetup());
        btn('pause').addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
        btn('stop').addEventListener('click', () => {
            if (state !== 'wait' && state !== 'go' && state !== 'result') return;
            if (tourMatch()) {
                const t = `⏹ Match arrêté (${esc(names.L)} ${pts.L} – ${pts.R} ${esc(names.R)}) : il n'est pas compté, vous pourrez le rejouer.`;
                showTournament();
                say(t);
                return;
            }
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
            if ((k === 'enter' || k === ' ') && (state === 'setup' || state === 'draw' || state === 'tour' || (state === 'over' && isSolo()))) { e.preventDefault(); start(); return; }
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
            pair = null;
            names = { L: 'Joueur bleu', R: 'Joueur orange' };
            saveClass(CL); renderClass();
            if (state === 'draw' || state === 'tour') showSetup();
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
            if (state === 'wait' || state === 'go' || state === 'result' || state === 'draw' || state === 'tour') showSetup(isSolo() ? '⏹ Partie arrêtée.' : '⏹ Duel arrêté.');
            window._wfMiniBarCollapse(widget, '⚔️ Battle décomposition', { onExpand: applyScale });
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
        container.querySelectorAll('.bdc-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .bdc-arena, .bdc-rh, .bdc-help, .bdc-class, .bdc-side')) {
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
        widget._bdcGetData = function () {
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
            if (type === TYPE) return window.createBattleDecompositionWidget();
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
