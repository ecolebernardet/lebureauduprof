// =========================================================================
// BATTLE ARRONDIS / ENCADREMENTS — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Battles » — duel au TBI
//
// Deux élèves s'affrontent, un de chaque côté de l'écran (multi-touch).
// Un nombre s'affiche en grand au centre avec la consigne « Arrondi » ou
// « Encadrement » et le rang (à la dizaine, à la centaine, au millier…) ;
// chaque joueur dispose de 3 réponses possibles (mélangées différemment
// de chaque côté).
//   • Le premier qui touche la bonne réponse marque le point.
//   • Une erreur bloque son côté pour cette question,
//     ou, au choix dans les réglages, donne le point à l'adversaire.
//   • Les pièges : l'arrondi dans le mauvais sens, l'arrondi ou
//     l'encadrement au mauvais rang, un encadrement décalé.
//   • Après chaque question, la règle est expliquée (chiffre à regarder).
//
// 🏆 Mode tournoi (avec la liste 📂) : élimination directe, seuls les
//   gagnants jouent le tour suivant, jusqu'à la finale. Nombre impair de
//   joueurs : match de barrage (le perdant est éliminé, le vainqueur joue
//   encore un match). Égalité en fin de match : question décisive.
//
// 👤 Mode seul : N questions chronométrées, points selon la rapidité,
//   série 🔥 et record (mémorisé sur l'ordinateur).
//
// Niveaux : 1 = nombres jusqu'à 1 000 (dizaine, centaine)
//           2 = nombres jusqu'à 100 000 (dizaine, centaine, millier)
//           3 = grands nombres (millier, dizaine de mille) et décimaux
//               (unité, dixième)
//
// Ouverture   : createWidget('battle-arrondis')
// Sauvegarde  : widget._baGetData()  → baData dans save-load.js
// Restauration: createBattleArrondisWidget(baData)
// =========================================================================

(function () {

    var TYPE = 'battle-arrondis';
    var SETTINGS_KEY = 'battle-arrondis-settings';
    var CLASS_KEY = 'battle-arrondis-classe';

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

    // ── CSS du jeu (préfixe barr-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-arrondis-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-arrondis-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-arrondis"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .barr-container {
            --barr-s: 1;
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
            padding: calc(12px * var(--barr-s)) calc(14px * var(--barr-s)) calc(14px * var(--barr-s));
            border-radius: calc(24px * var(--barr-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--barr-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .barr-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .barr-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--barr-s));
            width: 100%; max-width: calc(732px * var(--barr-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .barr-header { display: flex; align-items: center; gap: calc(10px * var(--barr-s)); cursor: move; }
        .barr-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--barr-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--barr-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .barr-icon-btn {
            width: calc(26px * var(--barr-s)); height: calc(26px * var(--barr-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--barr-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .barr-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .barr-arena {
            position: relative;
            min-height: calc(390px * var(--barr-s));
            border-radius: calc(18px * var(--barr-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .barr-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--barr-s)), transparent calc(2px * var(--barr-s))) 0 0 / calc(24px * var(--barr-s)) calc(24px * var(--barr-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--barr-s));
            box-sizing: border-box;
            padding: calc(10px * var(--barr-s)) calc(14px * var(--barr-s)) calc(14px * var(--barr-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--barr-s));
            color: #fff;
        }
        .barr-label {
            font-size: calc(13px * var(--barr-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--barr-s));
        }
        .barr-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--barr-s)); justify-content: center; }
        .barr-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--barr-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--barr-s)); height: calc(52px * var(--barr-s)); padding: 0 calc(8px * var(--barr-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--barr-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .barr-type .barr-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--barr-s)); }
        .barr-type:hover { background: rgba(255,255,255,0.14); }
        .barr-type:active { transform: scale(0.95); }
        .barr-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .barr-small {
            min-width: calc(40px * var(--barr-s)); height: calc(38px * var(--barr-s)); padding: 0 calc(8px * var(--barr-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--barr-s));
            display: flex; align-items: center; justify-content: center;
        }
        .barr-small.barr-mode { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--barr-s)); padding: 0 calc(14px * var(--barr-s)); }
        .barr-hide { display: none !important; }
        [data-modebox] { display: flex; }
        .barr-small.barr-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--barr-s)); }
        .barr-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .barr-sub { display: none; }
        .barr-sub.visible { display: block; }

        .barr-params { display: flex; gap: calc(20px * var(--barr-s)); justify-content: center; flex-wrap: wrap; }
        .barr-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .barr-spinner-label { font-size: calc(11px * var(--barr-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .barr-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--barr-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--barr-s)) 0 #B9B2D6;
        }
        .barr-spinner-btn {
            width: calc(34px * var(--barr-s)); height: calc(42px * var(--barr-s)); border: none; background: transparent;
            font-size: calc(20px * var(--barr-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .barr-spinner-btn:hover { background: #F1EDFB; }
        .barr-spinner-val {
            width: calc(56px * var(--barr-s)); height: calc(42px * var(--barr-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--barr-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .barr-spinner-val::-webkit-inner-spin-button,
        .barr-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .barr-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--barr-s)) calc(14px * var(--barr-s));
            font-family: inherit; font-size: calc(12px * var(--barr-s)); font-weight: 800; color: #fff;
        }
        .barr-toggle .barr-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .barr-toggle.on { border-color: var(--or); }
        .barr-toggle.on .barr-dot { background: var(--or); }
        .barr-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--barr-s)); font-weight: 900; min-height: calc(16px * var(--barr-s)); }

        /* ══ DUEL ══ */
        .barr-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--barr-s)); background: #1B1433; }
        .barr-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--barr-s)), transparent calc(2px * var(--barr-s))) 0 0 / calc(24px * var(--barr-s)) calc(24px * var(--barr-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--barr-s)) calc(12px * var(--barr-s)) calc(10px * var(--barr-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--barr-s));
        }
        .barr-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--barr-s));
            padding: calc(6px * var(--barr-s)) calc(26px * var(--barr-s));
            min-width: calc(260px * var(--barr-s)); min-height: calc(72px * var(--barr-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--barr-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--barr-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .barr-calc.wait { color: #D9D2EE; }
        .barr-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--barr-s)) 0 #1C8A4F; }
        .barr-calc .barr-ans { color: #1C8A4F; }
        .barr-calc { gap: 0.25em; font-variant-numeric: normal; }
        .barr-kind {
            display: inline-flex; align-items: center; gap: 0.2em;
            font-family: 'Nunito', sans-serif; font-weight: 900; text-transform: uppercase;
            font-size: 0.36em; letter-spacing: 0.05em; line-height: 1;
            padding: 0.35em 0.6em; border-radius: 999px; color: #fff;
        }
        .barr-kind.arr { background: #14A38B; box-shadow: 0 0.12em 0 #0B6E5D; }
        .barr-place { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 0.4em; color: #5B3FB0; white-space: nowrap; }
        .barr-kind.enc { background: #D6336C; box-shadow: 0 0.12em 0 #9A1E4C; }
        .barr-kind i { font-style: normal; font-size: 1.35em; }
        .barr-word { white-space: nowrap; font-variant-numeric: tabular-nums; }
        .barr-arrow { color: #B9B2D6; font-size: 0.7em; }
        .barr-choice { font-size: calc(30px * var(--barr-s)); padding: 0 calc(10px * var(--barr-s)); box-sizing: border-box; font-variant-numeric: normal; overflow: hidden; }
        .barr-type .barr-type-ico.arr { color: #7CF0D9; }
        .barr-type .barr-type-ico.enc { color: #FF9EC0; }
        .barr-type.on .barr-type-ico.arr, .barr-type.on .barr-type-ico.enc { color: var(--encre); }
        .barr-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .barr-calc .barr-q { font-size: 0.9em; }
        .barr-timebar {
            width: 70%; height: calc(10px * var(--barr-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .barr-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .barr-timebar.low i { background: var(--rouge); }

        .barr-field { flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) calc(64px * var(--barr-s)) minmax(0, 1fr); }
        .barr-half { min-width: 0; }
        .barr-choices .barr-choice { min-width: 0; max-width: 100%; }
        .barr-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--barr-s));
            padding: calc(10px * var(--barr-s)) calc(10px * var(--barr-s)) calc(12px * var(--barr-s));
            transition: box-shadow .2s;
        }
        .barr-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .barr-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .barr-half.win { box-shadow: inset 0 0 0 calc(6px * var(--barr-s)) #7CFFB2; }
        .barr-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--barr-s));
            background: rgba(42,31,74,0.5);
        }
        .barr-phead { display: flex; align-items: center; gap: calc(10px * var(--barr-s)); }
        .barr-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--barr-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--barr-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--barr-s)); text-align: center;
        }
        @keyframes barr-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .barr-pscore.bump { animation: barr-bump .4s ease; }
        .barr-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--barr-s));
            width: calc(150px * var(--barr-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--barr-s)) calc(8px * var(--barr-s));
            user-select: text;
        }
        .barr-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .barr-choices { display: flex; flex-direction: column; gap: calc(9px * var(--barr-s)); width: 100%; align-items: center; }
        .barr-choice {
            width: 92%; height: calc(62px * var(--barr-s));
            border: none; border-radius: calc(18px * var(--barr-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--barr-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--barr-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .barr-choice:hover { background: #FFF3C4; }
        .barr-choice:active { transform: translateY(calc(4px * var(--barr-s))); box-shadow: 0 calc(2px * var(--barr-s)) 0 #B9B2D6; }
        .barr-choice.hidden { color: #D9D2EE; }
        .barr-ctext { display: inline-block; white-space: nowrap; }
        .barr-csep { font-size: 0.62em; opacity: 0.7; margin: 0 0.25em; vertical-align: 0.12em; }
        .barr-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--barr-s)) 0 #1C8A4F; }
        .barr-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--barr-s)) 0 #B32B38; }
        .barr-choice.hint { box-shadow: 0 0 0 calc(5px * var(--barr-s)) #7CFFB2, 0 calc(6px * var(--barr-s)) 0 #B9B2D6; }
        @keyframes barr-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .barr-choice.ko { animation: barr-shake .4s ease; }
        @keyframes barr-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .barr-choice.appear, .barr-calc.appear { animation: barr-pop .25s ease-out; }
        .barr-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--barr-s)); }

        .barr-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--barr-s)); color: #fff;
        }
        .barr-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--barr-s)); color: var(--or); line-height: 1; text-align: center; }
        .barr-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--barr-s)); color: rgba(255,255,255,0.6); }
        .barr-mid > small { font-size: calc(10px * var(--barr-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .barr-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--barr-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--barr-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .barr-ready.show { display: flex; animation: barr-pop .3s ease-out; }

        /* ── Actions ── */
        .barr-actions { display: flex; gap: calc(8px * var(--barr-s)); justify-content: center; flex-wrap: wrap; }
        .barr-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--barr-s));
            padding: calc(8px * var(--barr-s)) calc(14px * var(--barr-s));
            border-radius: calc(14px * var(--barr-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--barr-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .barr-btn:hover { filter: brightness(1.05); }
        .barr-btn:active { transform: translateY(calc(4px * var(--barr-s))); box-shadow: 0 calc(1px * var(--barr-s)) 0 #B9B2D6; }
        .barr-btn:disabled { opacity: 0.45; cursor: default; }
        .barr-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--barr-s));
            padding: calc(8px * var(--barr-s)) calc(22px * var(--barr-s));
            box-shadow: 0 calc(5px * var(--barr-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .barr-btn-go:active { box-shadow: 0 calc(1px * var(--barr-s)) 0 #1C8A4F; }
        .barr-btn:focus-visible, .barr-choice:focus-visible, .barr-type:focus-visible, .barr-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .barr-talk { display: flex; align-items: center; gap: calc(10px * var(--barr-s)); }
        .barr-chef {
            width: calc(44px * var(--barr-s)); height: calc(44px * var(--barr-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--barr-s));
            box-shadow: 0 calc(3px * var(--barr-s)) 0 #B3840B;
        }
        @keyframes barr-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--barr-s))) rotate(-8deg); } }
        .barr-chef.hop { animation: barr-hop .4s ease; }
        .barr-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--barr-s));
            padding: calc(8px * var(--barr-s)) calc(12px * var(--barr-s));
            font-weight: 700; font-size: calc(15px * var(--barr-s)); line-height: 1.35;
            min-height: calc(22px * var(--barr-s));
            border-left: calc(6px * var(--barr-s)) solid var(--or);
        }
        .barr-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .barr-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .barr-msg b { font-weight: 900; }

        /* ── Pause ── */
        .barr-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.92); cursor: pointer;
            border-radius: inherit;
        }
        .barr-pause.show { display: flex; animation: barr-pop .25s ease-out; }
        .barr-pause-card {
            text-align: center; color: #fff;
            font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--barr-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--barr-s)) 0 rgba(0,0,0,0.35);
        }
        .barr-pause-card small {
            display: block; margin-top: calc(8px * var(--barr-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--barr-s)); opacity: 0.8; text-shadow: none;
        }
        .barr-btn[hidden] { display: none; }
        .barr-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--barr-s)) 0 #B3840B; }

        /* ── Panneau élèves ── */
        .barr-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .barr-class.show { display: flex; }
        .barr-class-head { display: flex; align-items: baseline; gap: 8px; }
        .barr-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .barr-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .barr-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .barr-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px;
            background: #EFEAFB; color: var(--encre);
        }
        .barr-class-tools button:hover { background: #E1D8F8; }
        .barr-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .barr-class-tools button.go { background: var(--or); }
        .barr-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .barr-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .barr-st {
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 4px 8px; border-radius: 9px; background: #F7F4FE;
        }
        .barr-st:hover { background: #EFEAFB; }
        .barr-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .barr-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .barr-st.played .barr-st-name::before { content: '✔ '; color: var(--vert); }
        .barr-st.absent { opacity: 0.45; }
        .barr-st.absent .barr-st-name { text-decoration: line-through; }
        .barr-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .barr-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .barr-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .barr-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff;
            background: #8C82AE;
        }
        .barr-sc.win { background: var(--vert); }
        .barr-sc.lose { background: var(--rouge); }
        .barr-sc.tie { background: #E0A800; }
        .barr-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }
        .barr-icon-btn.on { background: var(--or); color: var(--encre); }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .barr-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .barr-container.barr-has-sides .barr-side { display: flex; }
        .barr-side-title {
            font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or);
            text-align: center; line-height: 1.1; margin-bottom: 2px;
        }
        .barr-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
        .barr-side .barr-st {
            background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em;
            border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0;
        }
        .barr-side .barr-st:hover { background: rgba(255,255,255,0.18); }
        .barr-side .barr-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .barr-side .barr-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .barr-side .barr-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .barr-side .barr-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .barr-side .barr-st.played .barr-st-name::before { color: #7CFFB2; }

        /* ── Tournoi ── */
        .barr-tour {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--barr-s)), transparent calc(2px * var(--barr-s))) 0 0 / calc(24px * var(--barr-s)) calc(24px * var(--barr-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--barr-s)); box-sizing: border-box;
            padding: calc(14px * var(--barr-s));
            display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
            gap: calc(10px * var(--barr-s)); color: #fff;
        }
        .barr-tour-tabs { display: flex; flex-wrap: wrap; gap: calc(5px * var(--barr-s)); justify-content: center; }
        .barr-tour-tab {
            font-family: inherit; font-weight: 900; font-size: calc(12px * var(--barr-s)); cursor: pointer;
            padding: calc(4px * var(--barr-s)) calc(11px * var(--barr-s)); border-radius: 999px;
            border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); color: #fff;
        }
        .barr-tour-tab.done { border-color: rgba(124,255,178,0.6); }
        .barr-tour-tab.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .barr-tour-sub { font-weight: 800; font-size: calc(13px * var(--barr-s)); color: rgba(255,255,255,0.85); text-align: center; }
        .barr-champ {
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--barr-s));
            background: var(--or); color: var(--encre); border-radius: 999px;
            padding: calc(6px * var(--barr-s)) calc(20px * var(--barr-s));
            box-shadow: 0 calc(4px * var(--barr-s)) 0 #B3840B; text-align: center;
        }
        .barr-champ b { font-weight: 400; }
        .barr-matches {
            display: grid; grid-template-columns: 1fr; gap: calc(6px * var(--barr-s));
            width: 100%; max-width: calc(540px * var(--barr-s));
            max-height: calc(250px * var(--barr-s)); overflow-y: auto; padding: 2px; box-sizing: border-box;
        }
        .barr-matches.two { grid-template-columns: 1fr 1fr; max-width: none; }
        .barr-match {
            display: grid; grid-template-columns: auto 1fr auto 1fr; align-items: center;
            gap: calc(6px * var(--barr-s)); min-width: 0;
            background: rgba(255,255,255,0.10); border-radius: calc(12px * var(--barr-s));
            padding: calc(5px * var(--barr-s)) calc(8px * var(--barr-s));
            font-weight: 900; font-size: calc(14px * var(--barr-s));
        }
        .barr-match.cur { background: #fff; color: var(--encre); box-shadow: 0 0 0 calc(3px * var(--barr-s)) var(--or); }
        .barr-match.todo { opacity: 0.7; }
        .barr-match.barrage { box-shadow: inset 0 0 0 2px rgba(255,201,51,0.7); }
        .barr-match.barrage.cur { box-shadow: 0 0 0 calc(3px * var(--barr-s)) var(--or); }
        .barr-mn {
            min-width: calc(20px * var(--barr-s)); height: calc(20px * var(--barr-s)); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.25); color: #fff; font-size: calc(11px * var(--barr-s));
        }
        .barr-mn-b { background: var(--or); }
        .barr-mp { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .barr-mp.L { text-align: right; } .barr-mp.R { text-align: left; }
        .barr-match.cur .barr-mp.L { color: #1F6FB5; } .barr-match.cur .barr-mp.R { color: #E0620F; }
        .barr-mp.win { color: #7CFFB2; }
        .barr-mp.win::after { content: ' ✔'; }
        .barr-mp.lose { opacity: 0.5; text-decoration: line-through; }
        .barr-mp-wait { font-style: italic; font-weight: 800; opacity: 0.7; font-size: 0.85em; }
        .barr-ms { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(15px * var(--barr-s)); color: var(--or); white-space: nowrap; text-align: center; }
        .barr-match.cur .barr-ms { color: #5B3FB0; }
        .barr-tinfo { text-align: center; font-weight: 800; font-size: calc(12px * var(--barr-s)); color: rgba(255,255,255,0.88); margin-top: calc(4px * var(--barr-s)); }
        .barr-tinfo b { color: var(--or); }
        .barr-st.t-out { opacity: 0.45; }
        .barr-st.t-out .barr-st-name { text-decoration: line-through; }
        .barr-st.t-champ { background: var(--or) !important; color: var(--encre) !important; }
        .barr-st.t-qualif .barr-st-state { color: var(--vert); }
        .barr-side .barr-st.t-qualif .barr-st-state { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .barr-draw {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--barr-s)), transparent calc(2px * var(--barr-s))) 0 0 / calc(24px * var(--barr-s)) calc(24px * var(--barr-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--barr-s)); box-sizing: border-box;
            padding: calc(16px * var(--barr-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--barr-s)); color: #fff;
        }
        .barr-draw-title {
            font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--barr-s)); color: var(--or);
            text-shadow: 0 calc(3px * var(--barr-s)) 0 #B3470F;
        }
        .barr-draw-row { display: flex; align-items: center; gap: calc(14px * var(--barr-s)); width: 100%; justify-content: center; }
        .barr-draw-card {
            flex: 1; max-width: calc(290px * var(--barr-s));
            border-radius: calc(20px * var(--barr-s));
            padding: calc(14px * var(--barr-s)) calc(10px * var(--barr-s));
            text-align: center; box-shadow: 0 calc(6px * var(--barr-s)) 0 rgba(0,0,0,0.3);
        }
        .barr-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .barr-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .barr-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--barr-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .barr-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(34px * var(--barr-s)); line-height: 1.1; margin-top: calc(4px * var(--barr-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--barr-s)) 0 rgba(0,0,0,0.25);
        }
        .barr-draw-card b.rolling { opacity: 0.75; }
        .barr-draw-card b.done { animation: barr-pop .35s ease-out; }
        .barr-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(36px * var(--barr-s)); color: var(--or); text-shadow: 0 calc(3px * var(--barr-s)) 0 #B3470F; }
        .barr-draw-info { font-weight: 800; font-size: calc(13px * var(--barr-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }
        .barr-card .barr-rec { font-size: calc(12px * var(--barr-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--barr-s)); }
        .barr-card .barr-final span { display: inline-block; vertical-align: top; }
        .barr-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--barr-s)); }

        /* ── Fin de partie ── */
        .barr-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .barr-overlay.show { display: flex; }
        .barr-card {
            background: #fff; border-radius: calc(18px * var(--barr-s));
            padding: calc(12px * var(--barr-s)) calc(24px * var(--barr-s)) calc(14px * var(--barr-s));
            text-align: center; box-shadow: 0 calc(6px * var(--barr-s)) 0 #B9B2D6;
            animation: barr-pop .35s ease-out; max-width: 90%;
        }
        .barr-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--barr-s)); color: var(--encre); }
        .barr-card p { margin: calc(4px * var(--barr-s)) 0 calc(8px * var(--barr-s)); font-weight: 800; font-size: calc(15px * var(--barr-s)); }
        .barr-card .barr-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--barr-s)); margin: calc(2px * var(--barr-s)) 0; }
        .barr-card .barr-final .L { color: #1F6FB5; } .barr-card .barr-final .R { color: #E0620F; }
        .barr-card .barr-sub { display: block; font-size: calc(12px * var(--barr-s)); color: #6A5E8E; margin-top: calc(-4px * var(--barr-s)); }
        .barr-medal { font-size: calc(54px * var(--barr-s)); line-height: 1; animation: barr-pop .5s ease-out; }
        .barr-card .barr-actions { margin-top: calc(4px * var(--barr-s)); }

        /* ── Statistiques (mode seul) ── */
        .barr-stats { display: flex; gap: calc(6px * var(--barr-s)); align-items: center; }
        .barr-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--barr-s)) calc(10px * var(--barr-s));
            font-weight: 900; font-size: calc(14px * var(--barr-s)); white-space: nowrap;
        }
        .barr-chip.hot { background: #FF7A1A; }
        .barr-chip.bump { animation: barr-bump .4s ease; }
        .barr-container.duel .barr-stats { display: none; }
        .barr-container:not(.duel) [data-role="class"] { display: none; }

        /* ── Mode seul ── */
        .barr-field.solo { display: flex; }
        .barr-half.S {
            flex: 1; gap: calc(14px * var(--barr-s));
            background: linear-gradient(160deg, #2E2270 0%, #4A3399 100%);
        }
        .barr-half.S .barr-choices { flex-direction: row; justify-content: center; gap: calc(14px * var(--barr-s)); }
        .barr-half.S .barr-choices.barr-wide { flex-direction: column; align-items: center; gap: calc(9px * var(--barr-s)); }
        .barr-half.S .barr-choices.barr-wide .barr-choice { width: 74%; height: calc(66px * var(--barr-s)); font-size: calc(38px * var(--barr-s)); }
        .barr-half.S .barr-choice { width: calc(230px * var(--barr-s)); height: calc(100px * var(--barr-s)); font-size: calc(34px * var(--barr-s)); }
        .barr-sprog {
            color: #fff; font-weight: 900; font-size: calc(15px * var(--barr-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(4px * var(--barr-s)) calc(16px * var(--barr-s));
        }
        .barr-sprog b { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); }
        .barr-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--barr-s)); margin: calc(4px * var(--barr-s)) 0; }
        .barr-bigstars span { font-size: calc(34px * var(--barr-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .barr-bigstars span.on { opacity: 1; filter: none; animation: barr-pop .35s ease-out both; }
        .barr-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .barr-bigstars span.on:nth-child(3) { animation-delay: .4s; }

        /* ── Aide ── */
        .barr-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .barr-help.show { display: block; }
        .barr-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .barr-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .barr-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .barr-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: barr-fall 1.8s ease-in forwards; }
        @keyframes barr-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .barr-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .barr-container:hover .barr-rh { opacity: 1; }
        .barr-container.wf-fullboard .barr-rh { display: none; }
        .barr-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .barr-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .barr-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .barr-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .barr-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .barr-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .barr-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .barr-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .barr-container *, .barr-container *::before, .barr-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // RÉGLAGES MÉMORISÉS
    // =========================================================================
    var DEFAULTS = { kinds: ['arr', 'enc'], levels: [1], speed: 10, count: 10, mode: 'count', goal: 5, voice: false, players: 'duel', org: 'free', err: 'lock' };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.kinds = Array.isArray(r.kinds) ? r.kinds.filter(function (k) { return k === 'arr' || k === 'enc'; }) : DEFAULTS.kinds.slice();
                r.levels = Array.isArray(r.levels) ? r.levels.filter(function (l) { return l >= 1 && l <= 3; }) : DEFAULTS.levels.slice();
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
    // Si aucune liste n'est encore chargée ici, celle de la Battle de calculs
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
    // GÉNÉRATEUR DE QUESTIONS
    // Les nombres sont manipulés en entiers : un décimal à 2 chiffres après la
    // virgule est stocké ×100 (12,47 → 1247) pour éviter les erreurs d'arrondi
    // de JavaScript.
    //   niveau 1 : nombres jusqu'à 1 000 · dizaine, centaine
    //   niveau 2 : nombres jusqu'à 100 000 · dizaine, centaine, millier
    //   niveau 3 : grands nombres (millier, dizaine de mille) et décimaux
    //              (unité, dixième)
    // =========================================================================
    function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }
    var KIND_LABEL = { arr: 'Arrondi', enc: 'Encadrement' };
    var KIND_ICO = { arr: '≈', enc: '‹›' };

    // Rangs. step = pas en « unités internes » (×100 pour les décimaux)
    //   digit : chiffre qu'on regarde pour arrondir · plural : nom pour l'encadrement
    var PLACES = {
        d:  { label: 'à la dizaine',         step: 10,    digit: 'unités',         plural: 'dizaines',         dec: 0, outDec: 0 },
        c:  { label: 'à la centaine',        step: 100,   digit: 'dizaines',       plural: 'centaines',        dec: 0, outDec: 0 },
        m:  { label: 'au millier',           step: 1000,  digit: 'centaines',      plural: 'milliers',         dec: 0, outDec: 0 },
        dm: { label: 'à la dizaine de mille', step: 10000, digit: 'unités de mille', plural: 'dizaines de mille', dec: 0, outDec: 0 },
        u:  { label: "à l'unité",            step: 100,   digit: 'dixièmes',       plural: 'unités',           dec: 2, outDec: 0 },
        x:  { label: 'au dixième',           step: 10,    digit: 'centièmes',      plural: 'dixièmes',         dec: 2, outDec: 1 }
    };
    // Rang « voisin » utilisé pour les pièges (arrondi au mauvais rang)
    var SMALLER = { c: 'd', m: 'c', dm: 'm', u: 'x' };
    var BIGGER  = { d: 'c', c: 'm', m: 'dm', x: 'u' };

    var NBSP = ' ';
    // Écriture française : espaces entre les classes, virgule décimale
    function fmtNum(v, dec, outDec) {
        var x = v / Math.pow(10, dec);
        var s = x.toFixed(outDec);
        var parts = s.split('.');
        var ip = parts[0];
        if (ip.length > 3) ip = ip.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
        return parts[1] ? ip + ',' + parts[1] : ip;
    }
    function plainNum(v, dec, outDec) { return fmtNum(v, dec, outDec).replace(/ /g, ''); }

    // Tire un nombre et un rang selon le niveau
    function drawNumber(level) {
        var N, place;
        if (level === 1) {
            place = pick(['d', 'c', 'c']);
            do { N = place === 'd' ? rnd(11, 999) : rnd(101, 999); } while (N % 10 === 0);
            return { N: N, place: place };
        }
        if (level === 2) {
            place = pick(['d', 'c', 'm', 'm']);
            do { N = rnd(1001, 99999); } while (N % 10 === 0 || N % PLACES[place].step === 0);
            return { N: N, place: place };
        }
        // Niveau 3 : moitié grands nombres, moitié décimaux
        if (Math.random() < 0.5) {
            place = pick(['m', 'dm']);
            do { N = rnd(10001, 999999); } while (N % 10 === 0 || N % PLACES[place].step === 0);
        } else {
            place = pick(['u', 'x']);
            do { N = rnd(101, 9999); } while (N % 10 === 0);  // 1,01 à 99,99 avec un chiffre des centièmes
        }
        return { N: N, place: place };
    }

    // Un item : { kind, N, place, ans, options, why, say, key }
    function makeItem(level, kind) {
        // Arrondi : on écarte les nombres pile au milieu (ex. 125 à la dizaine),
        // qui auraient deux réponses possibles (120 et 130).
        var d;
        do { d = drawNumber(level); }
        while (kind === 'arr' && (d.N % PLACES[d.place].step) * 2 === PLACES[d.place].step);
        var P = PLACES[d.place], N = d.N, st = P.step;
        var lo = Math.floor(N / st) * st, hi = lo + st;
        var F = function (v) { return fmtNum(v, P.dec, P.outDec); };
        var num = fmtNum(N, P.dec, 2 * (P.dec > 0));
        var digit = Math.floor((N - lo) / (st / 10));
        var up = digit >= 5;
        var why = {}, cands = [], ans;
        var addCand = function (txt, reason, trap) {
            if (!txt || txt === ans || cands.some(function (c) { return c.t === txt; })) return;
            cands.push({ t: txt, trap: !!trap });
            why[txt] = reason;
        };
        var other = function (key) {
            if (!key) return null;
            var Q = PLACES[key];
            return { P: Q, F: function (v) { return fmtNum(v, Q.dec, Q.outDec); } };
        };
        var sm = other(SMALLER[d.place]), bg = other(BIGGER[d.place]);

        if (kind === 'arr') {
            var aVal = up ? hi : lo;
            ans = F(aVal);
            // Piège n°1 : arrondi dans le mauvais sens
            addCand(F(up ? lo : hi),
                `Pour arrondir ${P.label}, regarde le chiffre des <b>${P.digit}</b> : c'est ${digit}, donc on arrondit ${up ? 'au-dessus' : 'en dessous'} !`, true);
            // Arrondi à un autre rang
            if (sm) {
                var s2 = sm.P.step, r = Math.floor(N / s2 + 0.5) * s2;
                addCand(sm.F(r), `<b>${sm.F(r)}</b> est l'arrondi ${sm.P.label}, pas ${P.label} !`);
            }
            if (bg) {
                var b2 = bg.P.step, r2 = Math.floor(N / b2 + 0.5) * b2;
                if (r2 > 0) addCand(bg.F(r2), `<b>${bg.F(r2)}</b> est l'arrondi ${bg.P.label}, pas ${P.label} !`);
            }
            // Secours : un rang trop loin
            addCand(F(hi + st), `<b>${F(hi + st)}</b> est trop loin de ${num} !`);
            if (lo - st > 0) addCand(F(lo - st), `<b>${F(lo - st)}</b> est trop loin de ${num} !`);
        } else {
            var enc = function (a, b, f) { return (f || F)(a) + ' < … < ' + (f || F)(b); };
            ans = enc(lo, hi);
            // Encadrement juste mais au mauvais rang (le piège)
            if (sm) {
                var s3 = sm.P.step, l3 = Math.floor(N / s3) * s3;
                addCand(enc(l3, l3 + s3, sm.F), `C'est un encadrement ${sm.P.label}, pas ${P.label} !`, true);
            }
            if (bg) {
                var b3 = bg.P.step, l4 = Math.floor(N / b3) * b3;
                addCand(enc(l4, l4 + b3, bg.F), `C'est un encadrement ${bg.P.label}, pas ${P.label} !`, true);
            }
            // Encadrements décalés : le nombre n'est pas dedans
            addCand(enc(hi, hi + st), `${num} est plus petit que ${F(hi)} : il n'est pas dans cet encadrement !`);
            if (lo - st >= 0) addCand(enc(lo - st, lo), `${num} est plus grand que ${F(lo)} : il n'est pas dans cet encadrement !`);
        }

        // 2 intrus : le piège en premier, puis un autre au hasard
        var traps = cands.filter(function (c) { return c.trap; });
        var opts = [];
        if (traps.length) opts.push(pick(traps).t);
        var rest = shuffle(cands.filter(function (c) { return opts.indexOf(c.t) < 0; }));
        while (opts.length < 2 && rest.length) opts.push(rest.shift().t);

        var plain = plainNum(N, P.dec, 2 * (P.dec > 0));
        return {
            kind: kind, N: N, place: d.place, P: P, num: num, ans: ans,
            lo: F(lo), hi: F(hi), digit: digit, up: up,
            options: [ans].concat(opts),
            why: why,
            say: (kind === 'arr' ? 'Arrondis ' : 'Encadre ') + plain + ' ' + P.label,
            key: kind + '_' + N + '_' + d.place
        };
    }

    function generateSeries(s) {
        var list = [], used = {};
        for (var i = 0; i < s.count; i++) {
            var kind = pick(s.kinds);
            // Alterner arrondis / encadrements quand les deux sont choisis
            if (s.kinds.length > 1 && list.length && Math.random() < 0.7)
                kind = list[list.length - 1].kind === 'arr' ? 'enc' : 'arr';
            var it = null;
            for (var t = 0; t < 30; t++) {
                it = makeItem(pick(s.levels), kind);
                if (!used[it.key] && (!list.length || list[list.length - 1].place !== it.place || t > 3)) break;
            }
            used[it.key] = true;
            list.push(it);
        }
        return list;
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _baAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_baAudio) _baAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _baAudio, t0 = ctx.currentTime + start;
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
    window.createBattleArrondisWidget = function (savedData) {
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
        container.className = 'barr-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="barr-inner">
            <div class="barr-header">
                <span class="barr-title">⚔️ Battle arrondis / encadrements</span>
                <div class="barr-stats">
                    <span class="barr-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="barr-chip" data-role="record" title="Record pour ces réglages (sur cet ordinateur)">🏆 0</span>
                    <span class="barr-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="barr-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="barr-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="barr-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="barr-arena"></div>

            <div class="barr-talk">
                <div class="barr-chef">⚔️</div>
                <div class="barr-msg"></div>
            </div>

            <div class="barr-actions">
                <button class="barr-btn barr-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="barr-btn" data-act="setup">⚙️ Réglages</button>
                <button class="barr-btn barr-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="barr-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="barr-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>👤 <b>Seul</b> : une série de questions chronométrées, 3 réponses possibles. Plus tu es rapide, plus tu gagnes de points ! 🏆 Bats ton record.</p>
                <p>👥 <b>À deux</b> : deux élèves au tableau, <b>un de chaque côté</b>. Un nombre apparaît au milieu avec la consigne <b style="color:#14A38B">ARRONDI</b> ou <b style="color:#D6336C">ENCADREMENT</b> et le rang : à la dizaine, à la centaine, au millier…</p>
                <p>≈ <b>Arrondir</b> : trouver le nombre « rond » le plus proche. On regarde le chiffre juste à droite du rang : <b>0 à 4</b> → en dessous, <b>5 à 9</b> → au-dessus.</p>
                <p>‹› <b>Encadrer</b> : trouver les deux nombres « ronds » qui se suivent, juste avant et juste après.</p>
                <p>Le premier qui touche la bonne réponse marque <b>1 point</b>. ⚠️ Attention aux pièges : arrondi dans le mauvais sens, ou au mauvais rang !</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour cette question. Ou bien, au choix dans ⚙️ Réglages, <b>le point va à l'adversaire 🎁</b>. Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>🏆 <b>Tournoi</b> (avec une liste 📂) : choisissez « 🏆 Tournoi » dans ⚙️ Réglages. Les élèves présents sont répartis en matchs ; seuls les <b>gagnants</b> passent au tour suivant, jusqu'à la <b>finale</b>. Nombre impair : un <b>match de barrage</b> est joué d'abord (le perdant est éliminé, le vainqueur joue encore un match). En cas d'égalité, une <b>question décisive</b> départage les joueurs.</p>
                <p>📂 Chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p style="margin:0">Clavier : seul <b>1</b> / <b>2</b> / <b>3</b> (ou ← / ↓ / →) · à deux : joueur bleu <b>A</b> / <b>Z</b> / <b>E</b>, joueur orange <b>I</b> / <b>O</b> / <b>P</b>.</p>
            </div>
            <div class="barr-side barr-side-L"><div class="barr-side-title">📂 Élèves</div><div class="barr-side-list"></div></div>
            <div class="barr-side barr-side-R"><div class="barr-side-title">📂 Élèves</div><div class="barr-side-list"></div></div>
            <div class="barr-class">
                <div class="barr-class-head"><h4>📂 Élèves</h4><span class="barr-class-count"></span></div>
                <div class="barr-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="barr-class-list"></div>
                <p class="barr-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="barr-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="barr-confetti"></div>
            <div class="barr-rh barr-rh-nw" data-dir="nw"></div>
            <div class="barr-rh barr-rh-n"  data-dir="n"></div>
            <div class="barr-rh barr-rh-ne" data-dir="ne"></div>
            <div class="barr-rh barr-rh-e"  data-dir="e"></div>
            <div class="barr-rh barr-rh-se" data-dir="se"></div>
            <div class="barr-rh barr-rh-s"  data-dir="s"></div>
            <div class="barr-rh barr-rh-sw" data-dir="sw"></div>
            <div class="barr-rh barr-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.barr-inner');
        const arena    = $('.barr-arena');
        const msg      = $('.barr-msg');
        const chef     = $('.barr-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.barr-help');
        const confetti = $('.barr-confetti');
        const classBtn   = $('[data-role="class"]');
        const classBox   = $('.barr-class');
        const classList  = $('.barr-class-list');
        const classFile  = $('.barr-class-file');
        const sideL = $('.barr-side-L'), sideR = $('.barr-side-R');
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
        const RECORD_KEY = 'battle-arrondis-records';
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
            container.classList.toggle('barr-has-sides', sides);
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
                container.style.setProperty('--barr-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--barr-s', sc.toFixed(4));
            fitCalc();
            fitChoices();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'barr-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            const spinner = (label, key, min, max) => `
                <div class="barr-spinner">
                    <div class="barr-spinner-label">${label}</div>
                    <div class="barr-spinner-inner">
                        <button class="barr-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="barr-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="barr-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            arena.innerHTML = `
              <div class="barr-setup">
                <div class="barr-label">Nombre de joueurs</div>
                <div class="barr-chips">
                    <button class="barr-small barr-mode" data-players="solo">👤 Seul</button>
                    <button class="barr-small barr-mode" data-players="duel">👥 À deux (duel au tableau)</button>
                    <button class="barr-small barr-mode" data-players="tour" title="Élimination directe avec la liste d'élèves 📂 : seuls les gagnants passent au tour suivant">🏆 Tournoi</button>
                </div>
                <div class="barr-label">Que faut-il faire ?</div>
                <div class="barr-chips">
                    <button class="barr-type" data-kind="arr" title="Trouver le nombre rond le plus proche"><span class="barr-type-ico arr">≈</span>Arrondis</button>
                    <button class="barr-type" data-kind="enc" title="Trouver les nombres ronds juste avant et juste après"><span class="barr-type-ico enc">‹›</span>Encadrements</button>
                </div>

                <div class="barr-label">Niveau</div>
                <div class="barr-chips">
                    <button class="barr-type" data-level="1" title="Nombres jusqu'à 1 000 : à la dizaine, à la centaine"><span class="barr-type-ico">😊</span>Facile<small style="font-size:0.8em;opacity:.8">≤ 1 000</small></button>
                    <button class="barr-type" data-level="2" title="Nombres jusqu'à 100 000 : à la dizaine, à la centaine, au millier"><span class="barr-type-ico">😐</span>Moyen<small style="font-size:0.8em;opacity:.8">≤ 100 000</small></button>
                    <button class="barr-type" data-level="3" title="Grands nombres (millier, dizaine de mille) et décimaux (unité, dixième)"><span class="barr-type-ico">😤</span>Difficile<small style="font-size:0.8em;opacity:.8">grands nb · décimaux</small></button>
                </div>

                <div data-duelonly>
                <div class="barr-label">Qui gagne le duel ?</div>
                <div class="barr-chips">
                    <button class="barr-small barr-mode" data-mode="count" title="Le duel s'arrête après un nombre fixe de questions">🔢 Le plus de points en N questions</button>
                    <button class="barr-small barr-mode" data-mode="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                </div>
                <div class="barr-label">En cas de mauvaise réponse</div>
                <div class="barr-chips">
                    <button class="barr-small barr-mode" data-err="lock" title="Le joueur qui se trompe ne peut plus répondre ; l'autre peut encore marquer">🔒 Son côté est bloqué</button>
                    <button class="barr-small barr-mode" data-err="gift" title="Une mauvaise réponse donne immédiatement le point à l'adversaire">🎁 Le point va à l'adversaire</button>
                </div>
                <div class="barr-tinfo" data-tinfo></div>
                </div>
                <div class="barr-params" style="margin-top:calc(6px * var(--barr-s))">
                    ${spinner('Secondes<br>par question', 'speed', 3, 60)}
                    <div data-modebox="count">${spinner('Nombre<br>de questions', 'count', 3, 40)}</div>
                    <div data-modebox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="barr-chips" style="margin-top:calc(4px * var(--barr-s))">
                    <button class="barr-toggle" data-opt="voice"><span class="barr-dot"></span>🔊 Lire la consigne à voix haute</button>
                </div>
                <div class="barr-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.barr-setup');
            const sync = () => {
                setupEl.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('on', S.kinds.indexOf(b.dataset.kind) >= 0));
                setupEl.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('on', S.levels.indexOf(+b.dataset.level) >= 0));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
                const duel = S.players === 'duel';
                const shown = S.players === 'solo' ? 'solo' : S.org === 'tour' ? 'tour' : 'duel';
                setupEl.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', b.dataset.players === shown));
                setupEl.querySelectorAll('[data-err]').forEach(b => b.classList.toggle('on', b.dataset.err === S.err));
                const ti = setupEl.querySelector('[data-tinfo]');
                if (ti) ti.innerHTML = tourOn() ? tourInfo() : '';
                setupEl.querySelectorAll('[data-duelonly]').forEach(el => el.classList.toggle('barr-hide', !duel));
                // En mode seul : uniquement « Nombre de mots »
                setupEl.querySelectorAll('[data-modebox]').forEach(el => el.classList.toggle('barr-hide', el.dataset.modebox !== (duel ? S.mode : 'count')));
                container.classList.toggle('duel', duel);
                updateStats(false);
                setupEl.querySelector('.barr-warn').textContent = '';
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
            const setupEl = arena.querySelector('.barr-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.barr-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (!S.kinds.length) { warn('Choisissez arrondis, encadrements ou les deux.'); return false; }
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
            $('.barr-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué`
                : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            const playing = state === 'wait' || state === 'go' || state === 'result';
            clBtn('draw').disabled = !hasClass() || playing || rolling || tourOn();
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && !isSolo() && CL.students.length > 0;
            if (wantSides !== container.classList.contains('barr-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="barr-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['barr-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (pair && pair.L === st.id) cls.push('cur-L');
                if (pair && pair.R === st.id) cls.push('cur-R');
                const ts = tourOn() ? tourStatus(st.id) : null;
                if (ts) cls.push('t-' + ts);
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="barr-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = (pair && (pair.L === st.id || pair.R === st.id)) ? 'au tableau'
                    : ts === 'champ' ? '🏆 champion' : ts === 'out' ? 'éliminé' : ts === 'qualif' ? 'qualifié' : ts === 'in' ? 'en lice'
                    : st.absent ? 'absent' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="barr-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="barr-st-state">${stateTxt}</span>` : ''}
                    <span class="barr-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('barr-has-sides')) return;
            const rows = classList.querySelectorAll('.barr-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.barr-side-list'), sideR.querySelector('.barr-side-list')];
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
                sd.querySelector('.barr-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.barr-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        [sideL, sideR].forEach(sd => {
            sd.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('.barr-st');
                if (row) toggleAbsent(row.dataset.id);
            });
        });
        classList.addEventListener('click', (e) => {
            const row = e.target.closest('.barr-st');
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
                `<button class="barr-tour-tab${i === vi ? ' on' : ''}${roundDone(r) ? ' done' : ''}" data-tv="${i}">${roundName(r, i)}${roundDone(r) ? ' ✔' : ''}</button>`).join('');
            let num = 0;
            const rows = R.matches.map((x) => {
                const isCur = x === m;
                const p = (id, side) => id
                    ? `<span class="barr-mp ${side}${x.w ? (x.w === id ? ' win' : ' lose') : ''}" title="${fn(id)}">${nm(id)}</span>`
                    : `<span class="barr-mp ${side} barr-mp-wait">⚔️ vainqueur du barrage</span>`;
                const mid = x.w ? `<span class="barr-ms">${x.sL} – ${x.sR}</span>` : `<span class="barr-ms">${isCur ? '▶' : 'vs'}</span>`;
                const tag = x.barrage ? '<span class="barr-mn barr-mn-b" title="Match de barrage : le perdant est éliminé">⚔️</span>' : `<span class="barr-mn">${++num}</span>`;
                return `<div class="barr-match ${x.w ? 'done' : isCur ? 'cur' : 'todo'}${x.barrage ? ' barrage' : ''}">${tag}${p(x.L, 'L')}${mid}${p(x.R, 'R')}</div>`;
            }).join('');
            const playedN = R.matches.filter(x => x.w).length;
            const champ = T.champion
                ? `<div class="barr-champ">🏆 <b>${fn(T.champion)}</b> remporte le tournoi !</div>`
                : `<div class="barr-tour-sub">${R.players.length} joueur${R.players.length > 1 ? 's' : ''}${hasBarrage(R) ? ' (nombre impair : ⚔️ barrage)' : ''} · match ${Math.min(playedN + 1, R.matches.length)} / ${R.matches.length}${vi < cur ? ' · tour terminé' : ''}</div>`;
            arena.innerHTML = `
              <div class="barr-tour">
                <div class="barr-draw-title">🏆 Tournoi</div>
                <div class="barr-tour-tabs">${tabs}</div>
                ${champ}
                <div class="barr-matches${R.matches.length > 4 ? ' two' : ''}">${rows}</div>
                <div class="barr-actions"><button class="barr-btn" data-tr="new">🔁 Nouveau tournoi</button></div>
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
              <div class="barr-draw">
                <div class="barr-draw-title">🎲 Tirage au sort</div>
                <div class="barr-draw-row">
                    <div class="barr-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="barr-draw-vs">VS</div>
                    <div class="barr-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="barr-draw-info"></div>
                <div class="barr-actions">
                    <button class="barr-btn" data-dr="again">🎲 Nouveau tirage</button>
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
            const elL = arena.querySelector('.barr-draw-card b[data-side="L"]');
            const elR = arena.querySelector('.barr-draw-card b[data-side="R"]');
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
            arena.querySelectorAll('.barr-draw-card b').forEach(el => {
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = el.dataset.side === 'L' ? shortName(stL) : shortName(stR);
                el.title = fullName(el.dataset.side === 'L' ? stL : stR);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.barr-draw-info');
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
                <div class="barr-half ${side}" data-side="${side}">
                    <div class="barr-phead">
                        <input class="barr-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="barr-pscore">${pts[side]}</div>
                    </div>
                    <div class="barr-choices" data-side="${side}">
                        <button class="barr-choice hidden" data-i="0">?</button>
                        <button class="barr-choice hidden" data-i="1">?</button>
                        <button class="barr-choice hidden" data-i="2">?</button>
                    </div>
                    <div class="barr-pkeys">clavier : ${KEYS[side].map(k => k.toUpperCase()).join(' / ')}</div>
                </div>`;
            arena.innerHTML = `
              <div class="barr-duel">
                <div class="barr-banner">
                    <div class="barr-calc wait">?</div>
                    <div class="barr-timebar"><i></i></div>
                </div>
                <div class="barr-field">
                    ${half('L')}
                    <div class="barr-mid"><small>Question</small><b data-role="round">${roundLabel(0)}</b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="barr-ready"></div>
              <div class="barr-pause"><div class="barr-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="barr-overlay"><div class="barr-card"></div></div>`;

            arena.querySelectorAll('.barr-pname').forEach(inp => {
                const side = inp.closest('.barr-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            arena.querySelector('.barr-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.barr-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.barr-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        // Arène du mode seul : le mot en haut, 3 grandes réponses en dessous
        function buildSolo() {
            arena.innerHTML = `
              <div class="barr-duel barr-solo">
                <div class="barr-banner">
                    <div class="barr-calc wait">?</div>
                    <div class="barr-timebar"><i></i></div>
                </div>
                <div class="barr-field solo">
                    <div class="barr-half S" data-side="S">
                        <div class="barr-sprog" data-role="round">${roundLabel(0)}</div>
                        <div class="barr-choices" data-side="S">
                            <button class="barr-choice hidden" data-i="0">?</button>
                            <button class="barr-choice hidden" data-i="1">?</button>
                            <button class="barr-choice hidden" data-i="2">?</button>
                        </div>
                        <div class="barr-pkeys">clavier : 1 / 2 / 3</div>
                    </div>
                </div>
              </div>
              <div class="barr-ready"></div>
              <div class="barr-pause"><div class="barr-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="barr-overlay"><div class="barr-card"></div></div>`;
            arena.querySelector('.barr-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            arena.querySelectorAll('.barr-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    answer('S', b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.barr-choices[data-side="${side}"] .barr-choice`);
        const allChoices = () => arena.querySelectorAll('.barr-choice');
        const calcEl = () => arena.querySelector('.barr-calc');
        const readyEl = () => arena.querySelector('.barr-ready');
        const overlay = () => arena.querySelector('.barr-overlay');

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
            const kind = `<span class="barr-kind ${it.kind}"><i>${KIND_ICO[it.kind]}</i>${KIND_LABEL[it.kind]}</span>`;
            const word = `<span class="barr-word">${esc(it.num)}</span><span class="barr-place">${esc(it.P.label)}</span>`;
            return kind + word + (withAns ? `<span class="barr-arrow">→</span><span class="barr-ans">${esc(it.ans)}</span>` : '');
        }
        // Phrase d'explication après la réponse
        function explainText(it) {
            if (it.kind === 'arr') {
                return `${esc(it.num)} est entre ${esc(it.lo)} et ${esc(it.hi)}. Chiffre des ${it.P.digit} : <b>${it.digit}</b>, `
                    + (it.up ? '5 ou plus → on arrondit au-dessus' : 'moins de 5 → on arrondit en dessous')
                    + ` : <b>${esc(it.ans)}</b>.`;
            }
            return `<b>${esc(it.lo)}</b> &lt; ${esc(it.num)} &lt; <b>${esc(it.hi)}</b> : ce sont les ${it.P.plural} juste avant et juste après.`;
        }
        // Une réponse trop longue (encadrement) doit tenir dans son bouton :
        // on mesure le texte lui-même (le bouton centre son contenu, donc
        // scrollWidth ne voit pas ce qui déborde à gauche).
        function choiceHTML(v) {
            const p = String(v).split(' < … < ');
            const inner = p.length === 2
                ? `${esc(p[0])}<span class="barr-csep">&lt; … &lt;</span>${esc(p[1])}`
                : esc(v);
            return `<span class="barr-ctext">${inner}</span>`;
        }
        function fitChoices() {
            allChoices().forEach(b => {
                b.style.fontSize = '';
                const t = b.querySelector('.barr-ctext');
                if (!t) return;
                const maxW = b.clientWidth - 14;
                let fs = parseFloat(getComputedStyle(b).fontSize) || 30;
                for (let i = 0; i < 6 && t.offsetWidth > maxW && maxW > 0; i++) {
                    fs = Math.max(10, fs * (maxW / t.offsetWidth) * 0.97);
                    b.style.fontSize = fs + 'px';
                }
            });
        }
        function revealAnswer() {
            const c = calcEl(), it = series[idx];
            c.className = 'barr-calc solved';
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
            arena.querySelectorAll('.barr-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'barr-choice hidden'; b.textContent = '?'; delete b.dataset.v; });
            const c = calcEl();
            c.className = 'barr-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.barr-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = roundLabel(idx + 1);
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'barr-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            // Mêmes 3 réponses de chaque côté, mais dans un ordre différent
            (isSolo() ? ['S'] : ['L', 'R']).forEach(side => {
                const opts = shuffle(it.options.slice());
                choiceBtns(side).forEach((b, i) => {
                    b.dataset.v = opts[i];
                    b.innerHTML = choiceHTML(opts[i]);
                    b.className = 'barr-choice appear';
                });
            });
            // Mode seul : les encadrements (plus longs) passent en lignes larges
            const soloBox = arena.querySelector('.barr-choices[data-side="S"]');
            if (soloBox) soloBox.classList.toggle('barr-wide', it.kind === 'enc');
            fitChoices();
            sfx('go');
            if (S.voice) speak(it.say);
            state = 'go';
            t0 = clock();
            runTimer(id);
        }
        function runTimer(id) {
            const limit = S.speed * 1000;
            const tb = arena.querySelector('.barr-timebar');
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
                // Série « sans fin » : on ajoute des mots tant que personne n'a gagné
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
                const half = arena.querySelector(`.barr-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.barr-pscore');
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
                const half = arena.querySelector(`.barr-half.${other}`);
                half.classList.add('win');
                const sc = half.querySelector('.barr-pscore');
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
                arena.querySelector(`.barr-half.${side}`).classList.add('lock');
                sfx('bad');
                const trap = it.why[b.dataset.v] ? ' ' + it.why[b.dataset.v] : '';
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour cette question !${trap}`, 'bad');
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
                const trap = it.why[b.dataset.v] ? it.why[b.dataset.v] + ' ' : '';
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
            const title = st === 3 ? 'As des arrondis !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > 0 && score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) {} }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.barr-card').innerHTML = `
                <div class="barr-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="barr-bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${n} · ${score} points</p>
                <p class="barr-sub">${times.length ? `Temps moyen : ${avg} s` : 'Aucune bonne réponse'}${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="barr-actions">
                    <button class="barr-btn barr-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="barr-btn" data-act="tosetup">⚙️ Réglages</button>
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
                <div class="barr-actions">
                    ${tm ? '<button class="barr-btn barr-btn-go" data-act="tour">🏆 Suite du tournoi</button>'
                         : hasClass() ? '<button class="barr-btn barr-btn-go" data-act="next">🎲 Duel suivant</button>' : ''}
                    <button class="barr-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            const recTxt = tourTxt ? `<p class="barr-rec">${tourTxt}</p>` : recorded ? '<p class="barr-rec">✔ Scores ajoutés dans la liste 📂</p>' : '';
            ov.querySelector('.barr-card').innerHTML = tie ? `
                <div class="barr-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="barr-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="barr-sub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} questions.</p>
                ${recTxt}${nextBtns}` : `
                <div class="barr-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="barr-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="barr-sub">sur ${nb} questions</p>
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
            const p = arena.querySelector('.barr-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (!playing) return;
            const p = arena.querySelector('.barr-pause');
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
            if (isSolo()) say(`⚡ ${series.length} questions, ${S.speed} s par question. Lis bien : arrondi ou encadrement, et à quel rang ?`);
            else say(`⚡ ${goalMode() ? `Le premier à ${S.goal} point${S.goal > 1 ? 's' : ''} gagne !` : `${series.length} questions.`} ${S.speed} s par question. Lis bien : arrondi ou encadrement, et à quel rang ? ${S.err === 'gift' ? 'Une erreur donne le point à ton adversaire 🎁 !' : 'Une erreur bloque ton côté !'}`);
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
            if (isSolo()) return '⚔️ Choisis arrondis et/ou encadrements et le niveau, puis clique sur <b>▶ Jouer</b> !';
            if (tourOn()) {
                if (CL.tour && !CL.tour.champion) return '🏆 Un tournoi est en cours : cliquez sur <b>▶ Reprendre le tournoi</b> pour voir le prochain match.';
                return hasClass()
                    ? '🏆 Tournoi : les élèves présents de la liste 📂 sont répartis en matchs. Seuls les gagnants passent au tour suivant, jusqu\'à la <b>finale</b> ! Cliquez sur <b>▶ Lancer le tournoi</b>.'
                    : '🏆 Pour un tournoi, chargez d\'abord une liste d\'élèves avec le bouton <b>📂</b> (au moins 2 élèves présents).';
            }
            return hasClass()
                ? `⚔️ Choisissez arrondis et/ou encadrements et le niveau, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.`
                : '⚔️ Choisissez arrondis et/ou encadrements et le niveau, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
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
            window._wfMiniBarCollapse(widget, '⚔️ Battle arrondis / encadrements', { onExpand: applyScale });
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
        container.querySelectorAll('.barr-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .barr-arena, .barr-rh, .barr-help, .barr-class, .barr-side')) {
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
        widget._baGetData = function () {
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

        // La police Lilita One arrive parfois après l'affichage : on réajuste
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => { if (widget.isConnected) { fitCalc(); fitChoices(); } });
        }
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
            if (type === TYPE) return window.createBattleArrondisWidget();
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
