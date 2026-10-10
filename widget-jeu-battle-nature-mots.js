// =========================================================================
// BATTLE NATURE DES MOTS — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de français » — duel au TBI
//
// Deux élèves s'affrontent, un de chaque côté de l'écran (multi-touch).
// Une phrase s'affiche en grand au centre avec un mot surligné : il faut
// toucher sa nature (déterminant, nom, adjectif, pronom, verbe ou mot
// invariable) plus vite que l'adversaire.
//   • Le premier qui touche la bonne nature marque le point.
//   • Une erreur bloque son côté pour ce mot (pas de clic au hasard !).
//   • Si personne ne répond dans le temps imparti, la réponse est montrée.
//   • Victoire au choix : le plus de points en N mots, ou premier à N points.
//   • Bouton ⏸ Pause pendant le duel.
//
// 👤 Mode seul : N mots chronométrés, points selon la rapidité, série 🔥
//   et record (mémorisé sur l'ordinateur).
//
// Réglages : natures proposées, pièges (la / le / leur pronoms, marche nom
// ou verbe…), secondes par mot, fin du duel, lecture à voix haute.
//
// Liste d'élèves (bouton 📂) : fichier .txt « prénom;nom », tirage au sort
// de 2 élèves par duel (chacun passe une fois par tour), scores affichés
// à côté du nom de chaque élève (et à gauche / à droite en plein écran).
// Liste et scores gardés en localStorage.
//
// Ouverture : createWidget('battle-nature-mots')
// 📌 Intégration dans index.html :
//   1. <script src="widget-jeu-battle-nature-mots.js"></script> (après widgets.js)
//   2. Carte du panneau Jeux (rubrique Jeux de français) :
//      onclick="createWidget('battle-nature-mots');toggleJeuxPanel()"
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

(function () {

    var TYPE = 'battle-nature-mots';
    var SETTINGS_KEY = 'battle-nature-mots-settings';
    var CLASS_KEY = 'battle-nature-mots-classe';

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

    // ── CSS du jeu (préfixe bn-) ───────────────────────────────────────────
    if (!document.getElementById('widget-jeu-battle-nature-mots-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-battle-nature-mots-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="battle-nature-mots"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .bn-container {
            --bn-s: 1;
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
            padding: calc(12px * var(--bn-s)) calc(14px * var(--bn-s)) calc(14px * var(--bn-s));
            border-radius: calc(24px * var(--bn-s));
            background: var(--encre);
            box-shadow: 0 calc(8px * var(--bn-s)) 0 #16102B, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: var(--encre);
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
            outline: none;
            touch-action: manipulation;
        }
        .bn-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
        }
        .bn-inner {
            display: flex; flex-direction: column;
            gap: calc(10px * var(--bn-s));
            width: 100%; max-width: calc(732px * var(--bn-s));
            margin: 0 auto;
        }

        /* ── En-tête ── */
        .bn-header { display: flex; align-items: center; gap: calc(10px * var(--bn-s)); cursor: move; }
        .bn-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: calc(26px * var(--bn-s));
            color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 calc(3px * var(--bn-s)) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
            margin-right: auto;
        }
        .bn-icon-btn {
            width: calc(26px * var(--bn-s)); height: calc(26px * var(--bn-s));
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: calc(13px * var(--bn-s)); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .bn-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Arène ── */
        .bn-arena {
            position: relative;
            min-height: calc(390px * var(--bn-s));
            border-radius: calc(18px * var(--bn-s));
            overflow: hidden;
            flex-shrink: 0;
        }

        /* ══ RÉGLAGES ══ */
        .bn-setup {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bn-s)), transparent calc(2px * var(--bn-s))) 0 0 / calc(24px * var(--bn-s)) calc(24px * var(--bn-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bn-s));
            box-sizing: border-box;
            padding: calc(10px * var(--bn-s)) calc(14px * var(--bn-s)) calc(14px * var(--bn-s));
            display: flex; flex-direction: column; gap: calc(6px * var(--bn-s));
            color: #fff;
        }
        .bn-label {
            font-size: calc(13px * var(--bn-s)); font-weight: 900; color: rgba(255,255,255,0.85);
            text-align: center; margin-top: calc(4px * var(--bn-s));
        }
        .bn-chips { display: flex; flex-wrap: wrap; gap: calc(6px * var(--bn-s)); justify-content: center; }
        .bn-type {
            border: 2px solid rgba(255,255,255,0.3); border-radius: calc(16px * var(--bn-s));
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            min-width: calc(88px * var(--bn-s)); height: calc(52px * var(--bn-s)); padding: 0 calc(8px * var(--bn-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            font-family: inherit; font-size: calc(12px * var(--bn-s)); font-weight: 900; line-height: 1.15;
            transition: background .15s, border-color .15s, transform .1s;
        }
        .bn-type .bn-type-ico { font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; font-size: calc(18px * var(--bn-s)); }
        .bn-type:hover { background: rgba(255,255,255,0.14); }
        .bn-type:active { transform: scale(0.95); }
        .bn-type.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bn-small {
            min-width: calc(40px * var(--bn-s)); height: calc(38px * var(--bn-s)); padding: 0 calc(8px * var(--bn-s));
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px;
            background: rgba(255,255,255,0.06); color: #fff; cursor: pointer;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(16px * var(--bn-s));
            display: flex; align-items: center; justify-content: center;
        }
        .bn-small.bn-mode { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(13px * var(--bn-s)); padding: 0 calc(14px * var(--bn-s)); }
        .bn-hide { display: none !important; }
        [data-modebox] { display: flex; }
        .bn-small.bn-all { font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(11px * var(--bn-s)); }
        .bn-small.on { background: var(--or); border-color: var(--or); color: var(--encre); }
        .bn-sub { display: none; }
        .bn-sub.visible { display: block; }

        .bn-params { display: flex; gap: calc(20px * var(--bn-s)); justify-content: center; flex-wrap: wrap; }
        .bn-spinner { display: inline-flex; flex-direction: column; align-items: center; gap: 3px; }
        .bn-spinner-label { font-size: calc(11px * var(--bn-s)); font-weight: 900; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.15; }
        .bn-spinner-inner {
            display: flex; align-items: center;
            background: #fff; border-radius: calc(12px * var(--bn-s)); overflow: hidden;
            box-shadow: 0 calc(4px * var(--bn-s)) 0 #B9B2D6;
        }
        .bn-spinner-btn {
            width: calc(34px * var(--bn-s)); height: calc(42px * var(--bn-s)); border: none; background: transparent;
            font-size: calc(20px * var(--bn-s)); font-weight: 900; color: #5B3FB0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .bn-spinner-btn:hover { background: #F1EDFB; }
        .bn-spinner-val {
            width: calc(56px * var(--bn-s)); height: calc(42px * var(--bn-s)); text-align: center; border: none;
            border-left: 1px solid #E3DDF3; border-right: 1px solid #E3DDF3;
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(22px * var(--bn-s));
            outline: none; padding: 0; -moz-appearance: textfield; user-select: text;
        }
        .bn-spinner-val::-webkit-inner-spin-button,
        .bn-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .bn-toggle {
            display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 999px; background: rgba(255,255,255,0.06);
            padding: calc(6px * var(--bn-s)) calc(14px * var(--bn-s));
            font-family: inherit; font-size: calc(12px * var(--bn-s)); font-weight: 800; color: #fff;
        }
        .bn-toggle .bn-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.3); }
        .bn-toggle.on { border-color: var(--or); }
        .bn-toggle.on .bn-dot { background: var(--or); }
        .bn-warn { text-align: center; color: #FFB3BA; font-size: calc(13px * var(--bn-s)); font-weight: 900; min-height: calc(16px * var(--bn-s)); }

        /* ══ DUEL ══ */
        .bn-duel { display: flex; flex-direction: column; min-height: calc(390px * var(--bn-s)); background: #1B1433; }
        .bn-banner {
            position: relative;
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bn-s)), transparent calc(2px * var(--bn-s))) 0 0 / calc(24px * var(--bn-s)) calc(24px * var(--bn-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            padding: calc(10px * var(--bn-s)) calc(12px * var(--bn-s)) calc(10px * var(--bn-s));
            display: flex; flex-direction: column; align-items: center; gap: calc(8px * var(--bn-s));
        }
        .bn-calc {
            background: #fff; color: var(--encre);
            border-radius: calc(18px * var(--bn-s));
            padding: calc(6px * var(--bn-s)) calc(26px * var(--bn-s));
            min-width: calc(260px * var(--bn-s)); min-height: calc(72px * var(--bn-s));
            box-sizing: border-box;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-size: calc(54px * var(--bn-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bn-s)) 0 #B9B2D6;
            white-space: nowrap; font-variant-numeric: tabular-nums;
            max-width: 100%;
        }
        .bn-calc.wait { color: #D9D2EE; }
        .bn-calc.solved { background: #E7FAEF; box-shadow: 0 calc(6px * var(--bn-s)) 0 #1C8A4F; }
        .bn-calc .bn-ans { color: #1C8A4F; }
        .bn-q {
            display: inline-block; min-width: 0.85em; padding: 0 0.1em; margin: 0 0.05em;
            border: 0.06em solid #5B3FB0; border-radius: 0.14em;
            color: #5B3FB0; text-align: center; line-height: 1.05;
        }
        .bn-calc .bn-q { font-size: 0.9em; }
        .bn-timebar {
            width: 70%; height: calc(10px * var(--bn-s));
            background: rgba(0,0,0,0.25); border-radius: 999px; overflow: hidden;
        }
        .bn-timebar i { display: block; height: 100%; width: 100%; background: var(--or); border-radius: 999px; }
        .bn-timebar.low i { background: var(--rouge); }

        .bn-field { flex: 1; display: grid; grid-template-columns: 1fr calc(64px * var(--bn-s)) 1fr; }
        .bn-half {
            position: relative;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(8px * var(--bn-s));
            padding: calc(10px * var(--bn-s)) calc(10px * var(--bn-s)) calc(12px * var(--bn-s));
            transition: box-shadow .2s;
        }
        .bn-half.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bn-half.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bn-half.win { box-shadow: inset 0 0 0 calc(6px * var(--bn-s)) #7CFFB2; }
        .bn-half.lock::after {
            content: '🔒'; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(46px * var(--bn-s));
            background: rgba(42,31,74,0.5);
        }
        .bn-phead { display: flex; align-items: center; gap: calc(10px * var(--bn-s)); }
        .bn-pscore {
            font-family: 'Lilita One', sans-serif; font-size: calc(34px * var(--bn-s)); color: #fff; line-height: 1;
            text-shadow: 0 calc(3px * var(--bn-s)) 0 rgba(0,0,0,0.25);
            min-width: calc(30px * var(--bn-s)); text-align: center;
        }
        @keyframes bn-bump { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .bn-pscore.bump { animation: bn-bump .4s ease; }
        .bn-pname {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bn-s));
            width: calc(150px * var(--bn-s)); text-align: center;
            background: rgba(255,255,255,0.2); color: #fff;
            border: none; border-radius: 999px; padding: calc(3px * var(--bn-s)) calc(8px * var(--bn-s));
            user-select: text;
        }
        .bn-pname:focus { outline: 2px solid #fff; background: rgba(255,255,255,0.3); }
        .bn-choices { display: flex; flex-direction: column; gap: calc(9px * var(--bn-s)); width: 100%; align-items: center; }
        .bn-choice {
            width: 86%; height: calc(62px * var(--bn-s));
            border: none; border-radius: calc(18px * var(--bn-s));
            background: #fff; color: var(--encre);
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400;
            font-size: calc(36px * var(--bn-s)); line-height: 1;
            box-shadow: 0 calc(6px * var(--bn-s)) 0 #B9B2D6;
            cursor: pointer; touch-action: manipulation;
            display: flex; align-items: center; justify-content: center;
            transition: transform .08s, box-shadow .08s, background .15s;
            white-space: nowrap; font-variant-numeric: tabular-nums;
        }
        .bn-choice:hover { background: #FFF3C4; }
        .bn-choice:active { transform: translateY(calc(4px * var(--bn-s))); box-shadow: 0 calc(2px * var(--bn-s)) 0 #B9B2D6; }
        .bn-choice.hidden { color: #D9D2EE; }
        .bn-choice.ok   { background: var(--vert); color: #fff; box-shadow: 0 calc(6px * var(--bn-s)) 0 #1C8A4F; }
        .bn-choice.ko   { background: var(--rouge); color: #fff; box-shadow: 0 calc(6px * var(--bn-s)) 0 #B32B38; }
        .bn-choice.hint { box-shadow: 0 0 0 calc(5px * var(--bn-s)) #7CFFB2, 0 calc(6px * var(--bn-s)) 0 #B9B2D6; }
        @keyframes bn-shake {
            0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); }
            40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); }
        }
        .bn-choice.ko { animation: bn-shake .4s ease; }
        @keyframes bn-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .bn-choice.appear, .bn-calc.appear { animation: bn-pop .25s ease-out; }
        .bn-pkeys { color: rgba(255,255,255,0.75); font-weight: 800; font-size: calc(11px * var(--bn-s)); }

        /* ── Nature des mots : phrase + 6 boutons ── */
        .bn-calc {
            font-family: 'Nunito', sans-serif; font-weight: 900;
            font-size: calc(34px * var(--bn-s)); min-height: calc(72px * var(--bn-s));
        }
        .bn-calc.wait { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(46px * var(--bn-s)); }
        .bn-target {
            background: var(--or); color: var(--encre); border-radius: 0.2em; padding: 0 0.18em; margin: 0 0.14em;
            box-shadow: 0 0.08em 0 #B3840B;
        }
        .bn-target.done { background: var(--nc); color: #fff; box-shadow: 0 0.08em 0 rgba(0,0,0,0.25); }
        .bn-tag {
            display: inline-block; vertical-align: middle; margin: 0 0.25em;
            font-size: 0.5em; font-weight: 900; color: #fff; background: var(--nc);
            border-radius: 999px; padding: 0.1em 0.6em; line-height: 1.3;
        }
        .bn-choices { display: grid; grid-template-columns: 1fr 1fr; gap: calc(8px * var(--bn-s)); width: 94%; }
        .bn-choice {
            position: relative; width: 100%; height: calc(54px * var(--bn-s));
            font-size: calc(19px * var(--bn-s)); color: var(--nc);
            box-shadow: 0 calc(5px * var(--bn-s)) 0 var(--nc);
            border-radius: calc(14px * var(--bn-s)); padding: 0 calc(6px * var(--bn-s));
        }
        .bn-choice:active { box-shadow: 0 calc(1px * var(--bn-s)) 0 var(--nc); }
        .bn-choice.hidden { color: var(--nc); opacity: 0.55; }
        .bn-choice .bn-k {
            position: absolute; top: calc(3px * var(--bn-s)); left: calc(6px * var(--bn-s));
            font-style: normal; font-family: 'Nunito', sans-serif; font-weight: 900;
            font-size: calc(10px * var(--bn-s)); opacity: 0.55;
        }
        .bn-choice.ok .bn-k, .bn-choice.ko .bn-k { color: #fff; }
        .bn-choice[data-v="det"], .bn-type[data-type="det"] { --nc: #7B4FE0; }
        .bn-choice[data-v="nom"], .bn-type[data-type="nom"] { --nc: #D93A48; }
        .bn-choice[data-v="adj"], .bn-type[data-type="adj"] { --nc: #1E9E5A; }
        .bn-choice[data-v="pro"], .bn-type[data-type="pro"] { --nc: #E07A10; }
        .bn-choice[data-v="ver"], .bn-type[data-type="ver"] { --nc: #1F6FB5; }
        .bn-choice[data-v="inv"], .bn-type[data-type="inv"] { --nc: #6B6B80; }
        .bn-type .bn-type-ico { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: calc(11px * var(--bn-s)); opacity: 0.85; }
        .bn-type.on { background: var(--nc); border-color: var(--nc); color: #fff; }
        .bn-type { min-width: calc(100px * var(--bn-s)); }

        .bn-mid {
            background: var(--encre);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(6px * var(--bn-s)); color: #fff;
        }
        .bn-mid b { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(22px * var(--bn-s)); color: var(--or); line-height: 1; text-align: center; }
        .bn-mid b small { display: block; writing-mode: horizontal-tb; transform: none; font-size: calc(13px * var(--bn-s)); color: rgba(255,255,255,0.6); }
        .bn-mid > small { font-size: calc(10px * var(--bn-s)); font-weight: 900; opacity: 0.7; letter-spacing: 1px; writing-mode: vertical-rl; transform: rotate(180deg); }

        .bn-ready {
            position: absolute; inset: 0; z-index: 5; display: none;
            align-items: center; justify-content: center; pointer-events: none;
            font-family: 'Lilita One', sans-serif; font-size: calc(64px * var(--bn-s)); color: #fff;
            text-shadow: 0 calc(4px * var(--bn-s)) 0 rgba(0,0,0,0.35);
            background: rgba(42,31,74,0.35);
        }
        .bn-ready.show { display: flex; animation: bn-pop .3s ease-out; }

        /* ── Actions ── */
        .bn-actions { display: flex; gap: calc(8px * var(--bn-s)); justify-content: center; flex-wrap: wrap; }
        .bn-btn {
            font-family: inherit; font-weight: 900; font-size: calc(14px * var(--bn-s));
            padding: calc(8px * var(--bn-s)) calc(14px * var(--bn-s));
            border-radius: calc(14px * var(--bn-s)); border: none; cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 calc(5px * var(--bn-s)) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s, filter .15s, opacity .15s;
            white-space: nowrap;
        }
        .bn-btn:hover { filter: brightness(1.05); }
        .bn-btn:active { transform: translateY(calc(4px * var(--bn-s))); box-shadow: 0 calc(1px * var(--bn-s)) 0 #B9B2D6; }
        .bn-btn:disabled { opacity: 0.45; cursor: default; }
        .bn-btn-go {
            background: var(--vert); color: #fff;
            font-family: 'Lilita One', 'Nunito', sans-serif; font-weight: 400; letter-spacing: 0.5px;
            font-size: calc(18px * var(--bn-s));
            padding: calc(8px * var(--bn-s)) calc(22px * var(--bn-s));
            box-shadow: 0 calc(5px * var(--bn-s)) 0 #1C8A4F;
            text-shadow: 0 2px 0 rgba(0,0,0,0.2);
        }
        .bn-btn-go:active { box-shadow: 0 calc(1px * var(--bn-s)) 0 #1C8A4F; }
        .bn-btn:focus-visible, .bn-choice:focus-visible, .bn-type:focus-visible, .bn-small:focus-visible { outline: 3px solid var(--or); outline-offset: 2px; }

        /* ── Messages ── */
        .bn-talk { display: flex; align-items: center; gap: calc(10px * var(--bn-s)); }
        .bn-chef {
            width: calc(44px * var(--bn-s)); height: calc(44px * var(--bn-s)); border-radius: 50%;
            background: var(--or); flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-size: calc(24px * var(--bn-s));
            box-shadow: 0 calc(3px * var(--bn-s)) 0 #B3840B;
        }
        @keyframes bn-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(calc(-8px * var(--bn-s))) rotate(-8deg); } }
        .bn-chef.hop { animation: bn-hop .4s ease; }
        .bn-msg {
            flex: 1; background: var(--creme); color: var(--encre);
            border-radius: calc(14px * var(--bn-s));
            padding: calc(8px * var(--bn-s)) calc(12px * var(--bn-s));
            font-weight: 700; font-size: calc(15px * var(--bn-s)); line-height: 1.35;
            min-height: calc(22px * var(--bn-s));
            border-left: calc(6px * var(--bn-s)) solid var(--or);
        }
        .bn-msg.good { border-left-color: var(--vert); background: #E7FAEF; }
        .bn-msg.bad  { border-left-color: var(--rouge); background: #FFEDEF; }
        .bn-msg b { font-weight: 900; }

        /* ── Pause ── */
        .bn-pause {
            position: absolute; inset: 0; z-index: 8;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.92); cursor: pointer;
            border-radius: inherit;
        }
        .bn-pause.show { display: flex; animation: bn-pop .25s ease-out; }
        .bn-pause-card {
            text-align: center; color: #fff;
            font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(54px * var(--bn-s)); line-height: 1.05;
            text-shadow: 0 calc(4px * var(--bn-s)) 0 rgba(0,0,0,0.35);
        }
        .bn-pause-card small {
            display: block; margin-top: calc(8px * var(--bn-s));
            font-family: 'Nunito', sans-serif; font-weight: 800;
            font-size: calc(15px * var(--bn-s)); opacity: 0.8; text-shadow: none;
        }
        .bn-btn[hidden] { display: none; }
        .bn-btn-pause.on { background: var(--or); box-shadow: 0 calc(5px * var(--bn-s)) 0 #B3840B; }

        /* ── Panneau élèves ── */
        .bn-class {
            display: none; position: absolute; top: 50px; right: 14px; width: 400px; z-index: 31;
            max-height: calc(100% - 70px); box-sizing: border-box;
            flex-direction: column; gap: 8px;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.35; font-weight: 700; color: var(--encre);
        }
        .bn-class.show { display: flex; }
        .bn-class-head { display: flex; align-items: baseline; gap: 8px; }
        .bn-class-head h4 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 18px; }
        .bn-class-count { margin-left: auto; font-size: 12px; color: #6A5E8E; font-weight: 800; }
        .bn-class-tools { display: flex; flex-wrap: wrap; gap: 6px; }
        .bn-class-tools button {
            font-family: inherit; font-weight: 900; font-size: 12px; cursor: pointer;
            border: none; border-radius: 10px; padding: 6px 9px;
            background: #EFEAFB; color: var(--encre);
        }
        .bn-class-tools button:hover { background: #E1D8F8; }
        .bn-class-tools button:disabled { opacity: 0.4; cursor: default; }
        .bn-class-tools button.go { background: var(--or); }
        .bn-class-list { overflow-y: auto; min-height: 40px; max-height: 340px; display: flex; flex-direction: column; gap: 3px; padding-right: 2px; }
        .bn-class-empty { text-align: center; color: #6A5E8E; padding: 14px 6px; }
        .bn-st {
            display: flex; align-items: center; gap: 8px; cursor: pointer;
            padding: 4px 8px; border-radius: 9px; background: #F7F4FE;
        }
        .bn-st:hover { background: #EFEAFB; }
        .bn-st-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bn-st-state { font-size: 11px; color: #6A5E8E; font-weight: 800; white-space: nowrap; }
        .bn-st.played .bn-st-name::before { content: '✔ '; color: var(--vert); }
        .bn-st.absent { opacity: 0.45; }
        .bn-st.absent .bn-st-name { text-decoration: line-through; }
        .bn-st.cur-L { box-shadow: inset 4px 0 0 #1F6FB5; background: #E3F1FF; }
        .bn-st.cur-R { box-shadow: inset 4px 0 0 #E0620F; background: #FFEBDD; }
        .bn-st-scores { display: flex; gap: 3px; flex-wrap: wrap; justify-content: flex-end; }
        .bn-sc {
            min-width: 22px; padding: 1px 6px; border-radius: 999px; text-align: center;
            font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 14px; color: #fff;
            background: #8C82AE;
        }
        .bn-sc.win { background: var(--vert); }
        .bn-sc.lose { background: var(--rouge); }
        .bn-sc.tie { background: #E0A800; }
        .bn-class-hint { margin: 0; font-size: 11px; color: #6A5E8E; font-weight: 700; }
        .bn-icon-btn.on { background: var(--or); color: var(--encre); }

        /* ── Liste des élèves sur les côtés (plein écran) ── */
        .bn-side {
            display: none; position: absolute; top: 14px; bottom: 14px; z-index: 2;
            flex-direction: column; gap: 4px; box-sizing: border-box;
            padding: 10px 8px; border-radius: 16px;
            background: rgba(255,255,255,0.06); color: #fff; overflow: hidden;
        }
        .bn-container.bn-has-sides .bn-side { display: flex; }
        .bn-side-title {
            font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or);
            text-align: center; line-height: 1.1; margin-bottom: 2px;
        }
        .bn-side-list { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; justify-content: flex-start; }
        .bn-side .bn-st {
            background: rgba(255,255,255,0.10); color: #fff; padding: 0.22em 0.5em;
            border-radius: 0.6em; font-weight: 800; gap: 0.4em; flex-shrink: 0;
        }
        .bn-side .bn-st:hover { background: rgba(255,255,255,0.18); }
        .bn-side .bn-st-state { color: rgba(255,255,255,0.75); font-size: 0.75em; }
        .bn-side .bn-st.cur-L { background: #1F6FB5; box-shadow: inset 0.3em 0 0 #7CC4FF; }
        .bn-side .bn-st.cur-R { background: #C4540F; box-shadow: inset 0.3em 0 0 #FFC08A; }
        .bn-side .bn-sc { font-size: 0.95em; min-width: 1.4em; padding: 0 0.35em; }
        .bn-side .bn-st.played .bn-st-name::before { color: #7CFFB2; }

        /* ── Tirage au sort ── */
        .bn-draw {
            background:
                radial-gradient(circle, rgba(255,255,255,0.06) calc(1.5px * var(--bn-s)), transparent calc(2px * var(--bn-s))) 0 0 / calc(24px * var(--bn-s)) calc(24px * var(--bn-s)),
                linear-gradient(160deg, #3D2C8D 0%, #5B3FB0 60%, #7A55C9 100%);
            min-height: calc(390px * var(--bn-s)); box-sizing: border-box;
            padding: calc(16px * var(--bn-s));
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: calc(16px * var(--bn-s)); color: #fff;
        }
        .bn-draw-title {
            font-family: 'Lilita One', sans-serif; font-size: calc(30px * var(--bn-s)); color: var(--or);
            text-shadow: 0 calc(3px * var(--bn-s)) 0 #B3470F;
        }
        .bn-draw-row { display: flex; align-items: center; gap: calc(14px * var(--bn-s)); width: 100%; justify-content: center; }
        .bn-draw-card {
            flex: 1; max-width: calc(290px * var(--bn-s));
            border-radius: calc(20px * var(--bn-s));
            padding: calc(14px * var(--bn-s)) calc(10px * var(--bn-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bn-s)) 0 rgba(0,0,0,0.3);
        }
        .bn-draw-card.L { background: linear-gradient(160deg, #1F6FB5, #3BA7FF); }
        .bn-draw-card.R { background: linear-gradient(200deg, #B3470F, #FF7A1A); }
        .bn-draw-card small { display: block; font-weight: 900; font-size: calc(12px * var(--bn-s)); opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; }
        .bn-draw-card b {
            display: block; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: calc(34px * var(--bn-s)); line-height: 1.1; margin-top: calc(4px * var(--bn-s));
            min-height: 1.1em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 calc(3px * var(--bn-s)) 0 rgba(0,0,0,0.25);
        }
        .bn-draw-card b.rolling { opacity: 0.75; }
        .bn-draw-card b.done { animation: bn-pop .35s ease-out; }
        .bn-draw-vs { font-family: 'Lilita One', sans-serif; font-size: calc(36px * var(--bn-s)); color: var(--or); text-shadow: 0 calc(3px * var(--bn-s)) 0 #B3470F; }
        .bn-draw-info { font-weight: 800; font-size: calc(13px * var(--bn-s)); color: rgba(255,255,255,0.85); text-align: center; min-height: 1.3em; }
        .bn-card .bn-rec { font-size: calc(12px * var(--bn-s)); color: #1C8A4F; font-weight: 900; margin: 0 0 calc(6px * var(--bn-s)); }
        .bn-card .bn-final span { display: inline-block; vertical-align: top; }
        .bn-final small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: calc(12px * var(--bn-s)); }

        /* ── Fin de partie ── */
        .bn-overlay {
            position: absolute; inset: 0; z-index: 10;
            display: none; align-items: center; justify-content: center;
            background: rgba(42,31,74,0.55);
        }
        .bn-overlay.show { display: flex; }
        .bn-card {
            background: #fff; border-radius: calc(18px * var(--bn-s));
            padding: calc(12px * var(--bn-s)) calc(24px * var(--bn-s)) calc(14px * var(--bn-s));
            text-align: center; box-shadow: 0 calc(6px * var(--bn-s)) 0 #B9B2D6;
            animation: bn-pop .35s ease-out; max-width: 90%;
        }
        .bn-card h3 { margin: 0; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(26px * var(--bn-s)); color: var(--encre); }
        .bn-card p { margin: calc(4px * var(--bn-s)) 0 calc(8px * var(--bn-s)); font-weight: 800; font-size: calc(15px * var(--bn-s)); }
        .bn-card .bn-final { font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: calc(36px * var(--bn-s)); margin: calc(2px * var(--bn-s)) 0; }
        .bn-card .bn-final .L { color: #1F6FB5; } .bn-card .bn-final .R { color: #E0620F; }
        .bn-card .bn-csub { font-size: calc(12px * var(--bn-s)); color: #6A5E8E; margin-top: calc(-4px * var(--bn-s)); }
        .bn-medal { font-size: calc(54px * var(--bn-s)); line-height: 1; animation: bn-pop .5s ease-out; }
        .bn-card .bn-actions { margin-top: calc(4px * var(--bn-s)); }

        /* ── Statistiques (mode seul) ── */
        .bn-stats { display: flex; gap: calc(6px * var(--bn-s)); align-items: center; }
        .bn-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: calc(3px * var(--bn-s)) calc(10px * var(--bn-s));
            font-weight: 900; font-size: calc(14px * var(--bn-s)); white-space: nowrap;
        }
        .bn-chip.hot { background: #FF7A1A; }
        .bn-chip.bump { animation: bn-bump .4s ease; }
        .bn-container.duel .bn-stats { display: none; }
        .bn-container:not(.duel) [data-role="class"] { display: none; }

        /* ── Mode seul ── */
        .bn-field.solo { display: flex; }
        .bn-half.S {
            flex: 1; gap: calc(14px * var(--bn-s));
            background: linear-gradient(160deg, #2E2270 0%, #4A3399 100%);
        }
        .bn-half.S .bn-choices { grid-template-columns: repeat(3, 1fr); gap: calc(12px * var(--bn-s)); width: 90%; }
        .bn-half.S .bn-choice { height: calc(70px * var(--bn-s)); font-size: calc(24px * var(--bn-s)); }
        .bn-half.S .bn-choice .bn-k { font-size: calc(12px * var(--bn-s)); }
        .bn-sprog {
            color: #fff; font-weight: 900; font-size: calc(15px * var(--bn-s));
            background: rgba(0,0,0,0.25); border-radius: 999px;
            padding: calc(4px * var(--bn-s)) calc(16px * var(--bn-s));
        }
        .bn-sprog b { font-family: 'Lilita One', sans-serif; font-weight: 400; color: var(--or); }
        .bn-bigstars { display: flex; justify-content: center; gap: calc(6px * var(--bn-s)); margin: calc(4px * var(--bn-s)) 0; }
        .bn-bigstars span { font-size: calc(34px * var(--bn-s)); line-height: 1; opacity: 0.2; filter: grayscale(1); }
        .bn-bigstars span.on { opacity: 1; filter: none; animation: bn-pop .35s ease-out both; }
        .bn-bigstars span.on:nth-child(2) { animation-delay: .2s; }
        .bn-bigstars span.on:nth-child(3) { animation-delay: .4s; }

        /* ── Aide ── */
        .bn-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 360px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .bn-help.show { display: block; }
        .bn-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .bn-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .bn-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .bn-confetti i { position: absolute; top: -12px; width: 9px; height: 14px; border-radius: 2px; animation: bn-fall 1.8s ease-in forwards; }
        @keyframes bn-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .bn-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .bn-container:hover .bn-rh { opacity: 1; }
        .bn-container.wf-fullboard .bn-rh { display: none; }
        .bn-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .bn-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .bn-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .bn-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .bn-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .bn-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .bn-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .bn-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .bn-container *, .bn-container *::before, .bn-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // NATURES ET RÉGLAGES MÉMORISÉS
    // =========================================================================
    var NAT = [
        { id: 'det', label: 'Déterminant',    un: 'un déterminant',    ex: 'le, ma, ces…',      tip: 'Le déterminant se place devant le nom et l\'introduit.' },
        { id: 'nom', label: 'Nom',            un: 'un nom',            ex: 'chat, Paris…',      tip: 'Le nom désigne une personne, un animal, une chose ou une idée.' },
        { id: 'adj', label: 'Adjectif',       un: 'un adjectif',       ex: 'grand, rouge…',     tip: 'L\'adjectif précise le nom : il s\'accorde avec lui.' },
        { id: 'pro', label: 'Pronom',         un: 'un pronom',         ex: 'il, nous, la…',     tip: 'Le pronom remplace un nom ou désigne une personne.' },
        { id: 'ver', label: 'Verbe',          un: 'un verbe',          ex: 'court, manger…',    tip: 'Le verbe exprime une action ou un état ; il se conjugue.' },
        { id: 'inv', label: 'Mot invariable', un: 'un mot invariable', ex: 'très, sous, et…',   tip: 'Le mot invariable ne change jamais de forme.' }
    ];
    var NAT_BY = {};
    NAT.forEach(function (n) { NAT_BY[n.id] = n; });
    var DEFAULTS = { types: NAT.map(function (n) { return n.id; }), traps: false, speed: 10, count: 10, mode: 'count', goal: 5, voice: false, players: 'duel' };
    function loadSettings() {
        try {
            var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
            if (s && typeof s === 'object') {
                var r = Object.assign({}, DEFAULTS, s);
                r.types = Array.isArray(r.types) ? r.types.filter(function (t) { return NAT_BY[t]; }) : DEFAULTS.types.slice();
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
    // =========================================================================
    function loadClass() {
        try {
            var c = JSON.parse(localStorage.getItem(CLASS_KEY) || 'null');
            if (c && Array.isArray(c.students)) {
                c.played = Array.isArray(c.played) ? c.played : [];
                c.students.forEach(function (st) { if (!Array.isArray(st.scores)) st.scores = []; });
                return c;
            }
        } catch (e) {}
        return { students: [], played: [] };
    }
    function saveClass(c) { try { localStorage.setItem(CLASS_KEY, JSON.stringify(c)); } catch (e) {} }
    function parseClassList(text) {
        var out = [];
        text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/).forEach(function (line, i) {
            line = line.trim();
            if (!line) return;
            var parts = line.split(/[;\t,]/).map(function (x) { return x.trim().replace(/^"|"$/g, ''); });
            var prenom = parts[0] || '', nom = parts.slice(1).join(' ').trim();
            if (!prenom && !nom) return;
            // Ligne d'en-tête éventuelle (« prénom;nom »)
            if (i === 0 && /^pr[ée]nom$/i.test(prenom) && (!nom || /^nom$/i.test(nom))) return;
            out.push({ id: 'e' + Date.now().toString(36) + '_' + out.length, prenom: prenom, nom: nom, absent: false, scores: [] });
        });
        return out;
    }
    function fullName(st) { return (st.prenom + ' ' + st.nom).trim(); }

    // =========================================================================
    // BANQUE DE PHRASES
    // Le mot à analyser est entre [crochets]. « ! » en tête = piège
    // (mot qui peut avoir une autre nature ailleurs : la, le, leur, marche…).
    // =========================================================================
    var BANK = {
        det: [
            '[Le] chien aboie dans le jardin.',
            'J\'ai mangé [une] pomme rouge.',
            '[Les] enfants jouent dans la cour.',
            '[Ma] sœur lit un roman.',
            '[Ces] fleurs sentent bon.',
            '[Notre] maison est au bout de la rue.',
            '[Trois] oiseaux chantent sur la branche.',
            'Il a acheté [des] bonbons.',
            '[Cette] histoire est vraiment drôle.',
            '[Mon] frère adore le football.',
            '[Chaque] élève a un cahier.',
            'Tu prends [ton] vélo ?',
            '[Quelques] nuages cachent le soleil.',
            '[Votre] chat dort sur le canapé.',
            '[Ce] garçon court très vite.',
            'Elle porte [sa] robe bleue.',
            'Nous visitons [la] ville.',
            'Il boit [du] lait chaque matin.',
            '[Aucun] bruit ne trouble la nuit.',
            '[Mes] parents travaillent à la ferme.',
            '!Il ramasse [leur] ballon.',
            '![La] voisine arrose les fleurs.',
            '!Tom range [les] jouets.',
            '![Le] dîner est prêt.'
        ],
        nom: [
            'Le [chat] dort sur le canapé.',
            'Ma grand-mère prépare une [tarte].',
            'La [mer] est calme aujourd\'hui.',
            '[Paris] est une grande ville.',
            'Les [élèves] écoutent la maîtresse.',
            'J\'ai perdu mes [clés].',
            'Le [boulanger] ouvre sa boutique.',
            'Une [étoile] brille dans le ciel.',
            'Mon [vélo] est tout neuf.',
            'Nous avons vu un [éléphant] au zoo.',
            'La [pluie] tombe depuis ce matin.',
            '[Léa] range ses livres.',
            'Le [courage] du pompier est admirable.',
            'Cette [montagne] est très haute.',
            'Le [jardinier] taille les rosiers.',
            'Il a reçu une [lettre].',
            'La [joie] se lit sur son visage.',
            'Le [train] part à huit heures.',
            'Les [abeilles] fabriquent du miel.',
            'Léa range ses [livres].',
            '!Il a fait une longue [marche].',
            '!Le [dîner] est prêt.',
            '!Le [rire] de Tom est contagieux.',
            '!Une [personne] attend devant la porte.',
            '!La [porte] de la classe est ouverte.'
        ],
        adj: [
            'Le chat [noir] dort sur le canapé.',
            'Une [grande] maison se trouve sur la colline.',
            'Ce gâteau est [délicieux].',
            'Il porte un pull [rouge].',
            'La [petite] fille sourit.',
            'Mon frère est très [gentil].',
            'Nous avons vu un film [effrayant].',
            'La soupe est encore [chaude].',
            'Ce [vieux] chêne a cent ans.',
            'Les routes sont [glissantes] ce matin.',
            'Elle a de [beaux] yeux verts.',
            'Elle a de beaux yeux [verts].',
            'Un [joli] papillon se pose sur la fleur.',
            'Mes chaussures sont [sales].',
            'Le ciel devient [gris].',
            'Tu as une idée [géniale] !',
            'Le lion est un animal [sauvage].',
            'Cette [longue] journée se termine enfin.',
            'Le chien semble [fatigué].',
            'Les fraises sont [mûres].',
            '!Le [premier] coureur franchit la ligne.',
            '!Ce pull [orange] me plaît beaucoup.',
            '!Ce gâteau est [bon].'
        ],
        pro: [
            '[Il] mange une pomme.',
            '[Nous] partons en vacances demain.',
            '[Elles] chantent une chanson.',
            'Ce cahier est à [moi].',
            '[Je] range ma chambre.',
            '[Tu] viens avec nous ?',
            'Marie [lui] donne un livre.',
            '[On] frappe à la porte.',
            '[Vous] êtes en retard.',
            '[Ils] construisent une cabane.',
            'Je [te] remercie.',
            'Viens avec [moi] au parc.',
            '[Celui-ci] est plus grand.',
            '[Chacun] range ses affaires.',
            '[Elle] dessine un cheval.',
            '[Rien] ne bouge dans la forêt.',
            '[Quelqu\'un] a laissé la lumière allumée.',
            '!Tom [la] regarde jouer.',
            '!Le chien [les] suit partout.',
            '![Personne] n\'est venu.',
            '!Mes parents ? Je [leur] téléphone ce soir.',
            '!Ce gâteau, Tom [le] mange en entier.'
        ],
        ver: [
            'Le chat [dort] sur le canapé.',
            'Les enfants [jouent] dans la cour.',
            'Je [mange] une pomme.',
            'Nous [partirons] demain matin.',
            'Tu [chantes] très bien.',
            'Elle [court] vite.',
            'Il faut [écouter] la maîtresse.',
            'Le soleil [brille].',
            'Vous [avez] un beau jardin.',
            'Mon frère [est] malade.',
            'Les oiseaux [volaient] au-dessus du lac.',
            'Nous [regardons] un film.',
            'Le bébé [pleure] dans son lit.',
            'Ils [finissent] leurs devoirs.',
            'Elle aime [lire] des bandes dessinées.',
            'Tom [ouvre] la fenêtre.',
            'Le vent [souffle] fort.',
            'Maman [prépare] le repas.',
            'Les élèves [écrivent] la date.',
            '!Je [marche] dans la forêt.',
            '!Nous allons [dîner] ensemble.',
            '!Il [porte] un sac très lourd.',
            'Les enfants [rient] aux éclats.'
        ],
        inv: [
            'Le chat dort [sous] la table.',
            'Il court [très] vite.',
            'Nous partons [demain].',
            'Tom [et] Léa jouent ensemble.',
            'Il pleut, [mais] il fait chaud.',
            'Elle marche [lentement].',
            'Le livre est [sur] l\'étagère.',
            '[Hier], nous sommes allés au cinéma.',
            'Viens [vite] !',
            'Il travaille [beaucoup].',
            'Je ne mange [jamais] de piment.',
            'Il parle [avec] son ami.',
            'Le chien attend [devant] la porte.',
            'Tu veux du thé [ou] du lait ?',
            'Il fait [trop] chaud.',
            'Elle habite [près] de l\'école.',
            'Il est [toujours] souriant.',
            'Nous jouons [dans] le jardin.',
            'Il est parti [sans] son manteau.',
            'Mon frère est [aussi] grand que moi.',
            '[Ensuite], nous rentrerons à la maison.',
            'Le chat se cache [derrière] le rideau.'
        ]
    };

    // Analyse « Le [chat] dort. » → { pre, word, post }
    var ITEMS = [];
    Object.keys(BANK).forEach(function (type) {
        BANK[type].forEach(function (raw) {
            var trap = raw.charAt(0) === '!';
            var txt = trap ? raw.slice(1) : raw;
            var m = txt.match(/^(.*?)\[(.+?)\](.*)$/);
            if (!m) return;
            ITEMS.push({ type: type, trap: trap, pre: m[1], word: m[2], post: m[3], key: txt,
                         say: m[1] + m[2] + m[3] + ' Quelle est la nature du mot : ' + m[2] + ' ?' });
        });
    });

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        return arr;
    }

    // Répartition équilibrée des natures, en évitant deux fois la même à la suite
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
    // Mots déjà proposés : on évite de les reproposer tant qu'il en reste d'autres
    var _usedKeys = {};
    function generateSeries(s, fresh) {
        if (fresh) _usedKeys = {};
        var list = [];
        var order = balancedTypes(s.types, s.count);
        order.forEach(function (type) {
            var pool = ITEMS.filter(function (it) { return it.type === type && (s.traps || !it.trap); });
            var free = pool.filter(function (it) { return !_usedKeys[it.key]; });
            if (!free.length) {           // tout a été vu : on recommence pour cette nature
                pool.forEach(function (it) { delete _usedKeys[it.key]; });
                free = pool;
            }
            // Avec les pièges activés, on les fait ressortir un peu plus souvent
            var traps = free.filter(function (it) { return it.trap; });
            var it = (s.traps && traps.length && Math.random() < 0.45) ? pick(traps) : pick(free);
            _usedKeys[it.key] = true;
            list.push(it);
        });
        return list;
    }

    // =========================================================================
    // SONS
    // =========================================================================
    let _bnAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_bnAudio) _bnAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _bnAudio, t0 = ctx.currentTime + start;
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

    // Touches clavier (AZERTY), dans l'ordre des boutons : bleu A Z E Q S D · orange I O P K L M
    const KEYS = { L: ['a', 'z', 'e', 'q', 's', 'd'], R: ['i', 'o', 'p', 'k', 'l', 'm'] };
    // Mode seul : chiffres 1 à 6 (rangée du haut AZERTY sans Maj aussi)
    const SOLO_KEYS = [['1', '&'], ['2', 'é'], ['3', '"'], ['4', "'"], ['5', '('], ['6', '-']];

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createBattleNatureMotsWidget = function () {
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
        container.className = 'bn-container';
        container.tabIndex = -1;
        container.innerHTML = `
          <div class="bn-inner">
            <div class="bn-header">
                <span class="bn-title">⚔️ Battle nature des mots</span>
                <div class="bn-stats">
                    <span class="bn-chip" data-role="streak" title="Bonnes réponses d'affilée">🔥 0</span>
                    <span class="bn-chip" data-role="record" title="Record pour ces réglages (sur cet ordinateur)">🏆 0</span>
                    <span class="bn-chip" data-role="score" title="Points">⭐ 0</span>
                </div>
                <div class="wf-btns">
                    <button class="bn-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="bn-icon-btn" data-role="class" title="Élèves : charger une liste .txt et tirer au sort">📂</button>
                    <button class="bn-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <div class="bn-arena"></div>

            <div class="bn-talk">
                <div class="bn-chef">⚔️</div>
                <div class="bn-msg"></div>
            </div>

            <div class="bn-actions">
                <button class="bn-btn bn-btn-go" data-act="start">▶ Lancer le duel</button>
                <button class="bn-btn" data-act="setup">⚙️ Réglages</button>
                <button class="bn-btn bn-btn-pause" data-act="pause" hidden>⏸ Pause</button>
                <button class="bn-btn" data-act="stop">⏹ Arrêter</button>
            </div>
          </div>

            <div class="bn-help">
                <h4>⚔️ Comment jouer ?</h4>
                <p>👤 <b>Seul</b> : une série de mots chronométrés. Touche la bonne nature le plus vite possible pour gagner plus de points ! 🏆 Bats ton record.</p>
                <p>👥 <b>À deux</b> :</p>
                <p>Deux élèves au tableau, <b>un de chaque côté</b>. Une phrase apparaît au milieu avec un <b>mot surligné</b>.</p>
                <p>Touche la <b>nature</b> de ce mot : déterminant, nom, adjectif, pronom, verbe ou mot invariable. Le premier qui trouve marque <b>1 point</b>.</p>
                <p>Une erreur <b>bloque ton côté 🔒</b> pour ce mot : inutile de cliquer au hasard ! Si personne ne trouve à temps, la réponse est montrée.</p>
                <p>🪤 Avec les <b>pièges</b>, certains mots changent de nature selon la phrase : « la » déterminant ou pronom, « marche » nom ou verbe…</p>
                <p>📂 Chargez une liste d'élèves (.txt, une ligne <b>prénom;nom</b>) : deux élèves sont tirés au sort pour chaque duel et leurs scores s'affichent à côté de leur nom.</p>
                <p style="margin:0">Clavier : seul, touches <b>1</b> à <b>6</b> · à deux, la lettre est écrite sur chaque bouton (bleu <b>A Z E Q S D</b>, orange <b>I O P K L M</b>). Espace ou Échap : pause.</p>
            </div>
            <div class="bn-side bn-side-L"><div class="bn-side-title">📂 Élèves</div><div class="bn-side-list"></div></div>
            <div class="bn-side bn-side-R"><div class="bn-side-title">📂 Élèves</div><div class="bn-side-list"></div></div>
            <div class="bn-class">
                <div class="bn-class-head"><h4>📂 Élèves</h4><span class="bn-class-count"></span></div>
                <div class="bn-class-tools">
                    <button data-cl="load" title="Fichier .txt : une ligne par élève, prénom;nom">📂 Charger une liste .txt</button>
                    <button data-cl="draw" class="go">🎲 Tirer au sort</button>
                    <button data-cl="reset" title="Effacer les scores et recommencer le tour">♻️ Scores à zéro</button>
                    <button data-cl="clear" title="Retirer la liste d'élèves">🗑</button>
                </div>
                <div class="bn-class-list"></div>
                <p class="bn-class-hint">Fichier .txt : une ligne par élève, <b>prénom;nom</b>. Touchez un élève pour le marquer absent / présent. ✔ = a déjà joué dans ce tour.</p>
                <input type="file" class="bn-class-file" accept=".txt,.csv,text/plain" hidden>
            </div>
            <div class="bn-confetti"></div>
            <div class="bn-rh bn-rh-nw" data-dir="nw"></div>
            <div class="bn-rh bn-rh-n"  data-dir="n"></div>
            <div class="bn-rh bn-rh-ne" data-dir="ne"></div>
            <div class="bn-rh bn-rh-e"  data-dir="e"></div>
            <div class="bn-rh bn-rh-se" data-dir="se"></div>
            <div class="bn-rh bn-rh-s"  data-dir="s"></div>
            <div class="bn-rh bn-rh-sw" data-dir="sw"></div>
            <div class="bn-rh bn-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const inner    = $('.bn-inner');
        const arena    = $('.bn-arena');
        const msg      = $('.bn-msg');
        const chef     = $('.bn-chef');
        const soundBtn = $('[data-role="sound"]');
        const helpBtn  = $('[data-role="help"]');
        const helpBox  = $('.bn-help');
        const confetti = $('.bn-confetti');
        const classBtn   = $('[data-role="class"]');
        const classBox   = $('.bn-class');
        const classList  = $('.bn-class-list');
        const classFile  = $('.bn-class-file');
        const sideL = $('.bn-side-L'), sideR = $('.bn-side-R');
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
        const RECORD_KEY = 'battle-nature-mots-records';
        let records = {};
        try { records = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}'); } catch (e) { records = {}; }
        const isSolo = () => S.players === 'solo';
        // Un record par combinaison de réglages
        const recKey = () => [S.types.join('+'), S.traps ? 'pieges' : '', S.speed + 's', S.count].join('|');
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
            container.classList.toggle('bn-has-sides', sides);
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
                container.style.setProperty('--bn-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--bn-s', sc.toFixed(4));
            fitCalc();
        }

        function say(html, mood) {
            msg.innerHTML = html;
            msg.className = 'bn-msg' + (mood ? ' ' + mood : '');
            chef.classList.remove('hop'); void chef.offsetWidth; chef.classList.add('hop');
        }

        // =====================================================================
        // ÉCRAN DE RÉGLAGES
        // =====================================================================
        function buildSetup() {
            const spinner = (label, key, min, max) => `
                <div class="bn-spinner">
                    <div class="bn-spinner-label">${label}</div>
                    <div class="bn-spinner-inner">
                        <button class="bn-spinner-btn" data-spin="${key}" data-d="-1">−</button>
                        <input type="number" class="bn-spinner-val" data-key="${key}" min="${min}" max="${max}" value="${S[key]}">
                        <button class="bn-spinner-btn" data-spin="${key}" data-d="1">+</button>
                    </div>
                </div>`;
            arena.innerHTML = `
              <div class="bn-setup">
                <div class="bn-label">Nombre de joueurs</div>
                <div class="bn-chips">
                    <button class="bn-small bn-mode" data-players="solo">👤 Seul</button>
                    <button class="bn-small bn-mode" data-players="duel">👥 À deux (duel au tableau)</button>
                </div>
                <div class="bn-label">Natures à trouver</div>
                <div class="bn-chips">
                    ${NAT.map(n => `<button class="bn-type" data-type="${n.id}">${n.label}<span class="bn-type-ico">${n.ex}</span></button>`).join('')}
                </div>
                <div class="bn-chips" style="margin-top:calc(4px * var(--bn-s))">
                    <button class="bn-toggle" data-opt="traps" title="Mots qui changent de nature selon la phrase : la, le, les, leur, marche, dîner, porte…"><span class="bn-dot"></span>🪤 Pièges (la, leur, marche…)</button>
                </div>

                <div data-duelonly>
                <div class="bn-label">Qui gagne le duel ?</div>
                <div class="bn-chips">
                    <button class="bn-small bn-mode" data-mode="count" title="Le duel s'arrête après un nombre fixe de mots">🔢 Le plus de points en N mots</button>
                    <button class="bn-small bn-mode" data-mode="goal" title="Le duel s'arrête dès qu'un joueur atteint le nombre de points">🏁 Le premier à N points</button>
                </div>
                </div>
                <div class="bn-params" style="margin-top:calc(6px * var(--bn-s))">
                    ${spinner('Secondes<br>par mot', 'speed', 3, 60)}
                    <div data-modebox="count">${spinner('Nombre<br>de mots', 'count', 3, 40)}</div>
                    <div data-modebox="goal">${spinner('Points pour<br>gagner', 'goal', 1, 30)}</div>
                </div>
                <div class="bn-chips" style="margin-top:calc(4px * var(--bn-s))">
                    <button class="bn-toggle" data-opt="voice"><span class="bn-dot"></span>🔊 Lire les phrases à voix haute</button>
                </div>
                <div class="bn-warn"></div>
              </div>`;

            const setupEl = arena.querySelector('.bn-setup');
            const sync = () => {
                setupEl.querySelectorAll('.bn-type').forEach(b => b.classList.toggle('on', S.types.indexOf(b.dataset.type) >= 0));
                setupEl.querySelectorAll('[data-opt]').forEach(b => b.classList.toggle('on', !!S[b.dataset.opt]));
                setupEl.querySelectorAll('[data-key]').forEach(inp => { inp.value = S[inp.dataset.key]; });
                setupEl.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
                const duel = S.players === 'duel';
                setupEl.querySelectorAll('[data-players]').forEach(b => b.classList.toggle('on', b.dataset.players === S.players));
                setupEl.querySelectorAll('[data-duelonly]').forEach(el => el.classList.toggle('bn-hide', !duel));
                // En mode seul : uniquement « Nombre de mots »
                setupEl.querySelectorAll('[data-modebox]').forEach(el => el.classList.toggle('bn-hide', el.dataset.modebox !== (duel ? S.mode : 'count')));
                container.classList.toggle('duel', duel);
                updateStats(false);
                setupEl.querySelector('.bn-warn').textContent = '';
            };
            setupEl.querySelectorAll('.bn-type').forEach(b => b.addEventListener('click', () => {
                const t = b.dataset.type, i = S.types.indexOf(t);
                if (i >= 0) S.types.splice(i, 1); else S.types.push(t);
                S.types.sort((x, y) => NAT.findIndex(n => n.id === x) - NAT.findIndex(n => n.id === y));
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
            const setupEl = arena.querySelector('.bn-setup');
            const warn = (t) => { if (setupEl) setupEl.querySelector('.bn-warn').textContent = t; say('⚠️ ' + t, 'bad'); };
            if (setupEl) setupEl.querySelectorAll('[data-key]').forEach(inp => {
                const v = parseInt(inp.value, 10);
                if (!isNaN(v)) S[inp.dataset.key] = Math.max(+inp.min, Math.min(+inp.max, v));
            });
            if (S.types.length < 2) { warn('Choisissez au moins deux natures.'); return false; }
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
            $('.bn-class-count').textContent = CL.students.length
                ? `${present.length} présent${present.length > 1 ? 's' : ''} · ${played} ont joué`
                : '';
            classBtn.classList.toggle('on', CL.students.length > 0);
            const playing = state === 'wait' || state === 'go' || state === 'result';
            clBtn('draw').disabled = !hasClass() || playing || rolling;
            clBtn('reset').disabled = !CL.students.length;
            clBtn('clear').disabled = !CL.students.length;
            const wantSides = container.classList.contains('wf-fullboard') && !isSolo() && CL.students.length > 0;
            if (wantSides !== container.classList.contains('bn-has-sides')) requestAnimationFrame(applyScale);
            if (!CL.students.length) {
                classList.innerHTML = '<div class="bn-class-empty">Aucune liste chargée.<br>Cliquez sur <b>📂 Charger une liste .txt</b>.</div>';
                return;
            }
            classList.innerHTML = CL.students.map(st => {
                const cls = ['bn-st'];
                if (CL.played.indexOf(st.id) >= 0) cls.push('played');
                if (st.absent) cls.push('absent');
                if (pair && pair.L === st.id) cls.push('cur-L');
                if (pair && pair.R === st.id) cls.push('cur-R');
                const sc = st.scores.map(r => {
                    const k = r.pts > r.opp ? 'win' : r.pts < r.opp ? 'lose' : 'tie';
                    return `<span class="bn-sc ${k}" title="${esc(r.pts + ' – ' + r.opp + ' contre ' + r.adv)}">${r.pts}</span>`;
                }).join('');
                const stateTxt = st.absent ? 'absent' : (pair && (pair.L === st.id || pair.R === st.id)) ? 'au tableau' : '';
                return `<div class="${cls.join(' ')}" data-id="${st.id}">
                    <span class="bn-st-name">${esc(fullName(st))}</span>
                    ${stateTxt ? `<span class="bn-st-state">${stateTxt}</span>` : ''}
                    <span class="bn-st-scores">${sc}</span>
                </div>`;
            }).join('');
            renderSides();
        }
        // Colonnes latérales (plein écran) : 1re moitié à gauche, 2e moitié à droite
        function renderSides() {
            if (!container.classList.contains('bn-has-sides')) return;
            const rows = classList.querySelectorAll('.bn-st');
            const half = Math.ceil(rows.length / 2);
            const lists = [sideL.querySelector('.bn-side-list'), sideR.querySelector('.bn-side-list')];
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
                sd.querySelector('.bn-side-list').style.fontSize = fs + 'px';
                sd.querySelector('.bn-side-title').style.fontSize = Math.max(14, Math.min(22, fs * 1.15)) + 'px';
            });
        }
        [sideL, sideR].forEach(sd => {
            sd.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.target.closest('.bn-st');
                if (row) toggleAbsent(row.dataset.id);
            });
        });
        classList.addEventListener('click', (e) => {
            const row = e.target.closest('.bn-st');
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
              <div class="bn-draw">
                <div class="bn-draw-title">🎲 Tirage au sort</div>
                <div class="bn-draw-row">
                    <div class="bn-draw-card L"><small>Joueur bleu</small><b data-side="L">?</b></div>
                    <div class="bn-draw-vs">VS</div>
                    <div class="bn-draw-card R"><small>Joueur orange</small><b data-side="R">?</b></div>
                </div>
                <div class="bn-draw-info"></div>
                <div class="bn-actions">
                    <button class="bn-btn" data-dr="again">🎲 Nouveau tirage</button>
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
            const elL = arena.querySelector('.bn-draw-card b[data-side="L"]');
            const elR = arena.querySelector('.bn-draw-card b[data-side="R"]');
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
            arena.querySelectorAll('.bn-draw-card b').forEach(el => {
                el.classList.remove('rolling', 'done'); void el.offsetWidth; el.classList.add('done');
                el.textContent = el.dataset.side === 'L' ? shortName(stL) : shortName(stR);
                el.title = fullName(el.dataset.side === 'L' ? stL : stR);
            });
            const present = CL.students.filter(st => !st.absent);
            const played = present.filter(st => CL.played.indexOf(st.id) >= 0).length;
            const info = arena.querySelector('.bn-draw-info');
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
                <div class="bn-half ${side}" data-side="${side}">
                    <div class="bn-phead">
                        <input class="bn-pname" value="${esc(names[side])}" maxlength="16" title="Clique pour écrire le nom">
                        <div class="bn-pscore">${pts[side]}</div>
                    </div>
                    <div class="bn-choices" data-side="${side}">
                        ${S.types.map((t, i) => `<button class="bn-choice hidden" data-v="${t}"><i class="bn-k">${(KEYS[side][i] || '').toUpperCase()}</i>${NAT_BY[t].label}</button>`).join('')}
                    </div>
                </div>`;
            arena.innerHTML = `
              <div class="bn-duel">
                <div class="bn-banner">
                    <div class="bn-calc wait">?</div>
                    <div class="bn-timebar"><i></i></div>
                </div>
                <div class="bn-field">
                    ${half('L')}
                    <div class="bn-mid"><small>Mot</small><b data-role="round">${roundLabel(0)}</b><small>Duel</small></div>
                    ${half('R')}
                </div>
              </div>
              <div class="bn-ready"></div>
              <div class="bn-pause"><div class="bn-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bn-overlay"><div class="bn-card"></div></div>`;

            arena.querySelectorAll('.bn-pname').forEach(inp => {
                const side = inp.closest('.bn-half').dataset.side;
                inp.addEventListener('input', () => { names[side] = inp.value.trim() || (side === 'L' ? 'Joueur bleu' : 'Joueur orange'); });
                ['pointerdown', 'mousedown', 'keydown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation()));
            });
            arena.querySelector('.bn-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            // pointerdown : réactif et compatible multi-touch au TBI
            arena.querySelectorAll('.bn-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const side = b.closest('.bn-choices').dataset.side;
                    answer(side, b);
                });
            });
        }
        // Arène du mode seul : la phrase en haut, les natures en grille en dessous
        function buildSolo() {
            arena.innerHTML = `
              <div class="bn-duel bn-solo">
                <div class="bn-banner">
                    <div class="bn-calc wait">?</div>
                    <div class="bn-timebar"><i></i></div>
                </div>
                <div class="bn-field solo">
                    <div class="bn-half S" data-side="S">
                        <div class="bn-sprog" data-role="round">${roundLabel(0)}</div>
                        <div class="bn-choices" data-side="S">
                            ${S.types.map((t, i) => `<button class="bn-choice hidden" data-v="${t}"><i class="bn-k">${i + 1}</i>${NAT_BY[t].label}</button>`).join('')}
                        </div>
                    </div>
                </div>
              </div>
              <div class="bn-ready"></div>
              <div class="bn-pause"><div class="bn-pause-card">⏸<br>Pause<small>Touchez ici ou sur ▶ Reprendre pour continuer</small></div></div>
              <div class="bn-overlay"><div class="bn-card"></div></div>`;
            arena.querySelector('.bn-pause').addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (paused) togglePause();
            });
            arena.querySelectorAll('.bn-choice').forEach(b => {
                b.addEventListener('pointerdown', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    answer('S', b);
                });
            });
        }
        const choiceBtns = (side) => arena.querySelectorAll(`.bn-choices[data-side="${side}"] .bn-choice`);
        const allChoices = () => arena.querySelectorAll('.bn-choice');
        const calcEl = () => arena.querySelector('.bn-calc');
        const readyEl = () => arena.querySelector('.bn-ready');
        const overlay = () => arena.querySelector('.bn-overlay');

        // La phrase doit tenir dans le bandeau
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
            const n = NAT_BY[it.type];
            const col = withAns ? ` style="--nc:${getNatColor(it.type)}"` : '';
            return esc(it.pre)
                + `<span class="bn-target${withAns ? ' done' : ''}"${col}>${esc(it.word)}</span>`
                + (withAns ? `<span class="bn-tag"${col}>${n.label}</span>` : '')
                + esc(it.post);
        }
        const NAT_COLORS = { det: '#7B4FE0', nom: '#D93A48', adj: '#1E9E5A', pro: '#E07A10', ver: '#1F6FB5', inv: '#6B6B80' };
        const getNatColor = (t) => NAT_COLORS[t] || '#5B3FB0';
        // « chat » est un nom.
        const answerTxt = (it) => `« ${esc(it.word)} » est <b>${NAT_BY[it.type].un}</b>.`;
        function revealAnswer() {
            const c = calcEl(), it = series[idx];
            c.className = 'bn-calc solved';
            c.innerHTML = calcHTML(it, true);
            fitCalc();
            allChoices().forEach(b => { if (b.dataset.v === it.type && !b.classList.contains('ok')) b.classList.add('hint'); });
        }

        // ── Manche ─────────────────────────────────────────────────────────
        async function newRound() {
            const id = ++runId;
            state = 'wait';
            const it = series[idx];
            locked = { L: false, R: false };
            arena.querySelectorAll('.bn-half').forEach(h => h.classList.remove('lock', 'win'));
            allChoices().forEach(b => { b.className = 'bn-choice hidden'; });
            const c = calcEl();
            c.className = 'bn-calc wait'; c.textContent = '?'; c.style.fontSize = '';
            const tb = arena.querySelector('.bn-timebar');
            tb.classList.remove('low'); tb.firstElementChild.style.width = '100%';
            arena.querySelector('[data-role="round"]').innerHTML = roundLabel(idx + 1);
            // Petite attente aléatoire : impossible d'anticiper
            await pwait(600 + Math.random() * 700);
            if (id !== runId) return;
            c.className = 'bn-calc appear';
            c.innerHTML = calcHTML(it, false);
            fitCalc();
            allChoices().forEach(b => { b.className = 'bn-choice appear'; });
            sfx('go');
            if (S.voice) speak(it.say);
            state = 'go';
            t0 = clock();
            runTimer(id);
        }
        function runTimer(id) {
            const limit = S.speed * 1000;
            const tb = arena.querySelector('.bn-timebar');
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
                say(`⏱ Trop tard ! ${series[idx].trap ? '🪤 Piège ! ' : ''}${answerTxt(series[idx])} <small>${NAT_BY[series[idx].type].tip}</small>`, 'bad');
            } else {
                say(`⏱ Temps écoulé ! Personne ne marque. ${series[idx].trap ? '🪤 Piège ! ' : ''}${answerTxt(series[idx])} <small>${NAT_BY[series[idx].type].tip}</small>`);
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
            if (paused || state !== 'go' || locked[side] || !b.dataset.v) return;
            if (isSolo()) { soloAnswer(b); return; }
            const id = runId;
            const it = series[idx];
            const other = side === 'L' ? 'R' : 'L';
            if (b.dataset.v === it.type) {
                state = 'result';
                stopSpeech();
                pts[side]++;
                b.classList.add('ok');
                const half = arena.querySelector(`.bn-half.${side}`);
                half.classList.add('win');
                const sc = half.querySelector('.bn-pscore');
                sc.textContent = pts[side];
                sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
                revealAnswer();
                sfx(side === 'L' ? 'pointL' : 'pointR');
                const s = ((clock() - t0) / 1000).toFixed(1).replace('.', ',');
                const balle = goalMode() && pts[side] === S.goal - 1 ? ' ⚡ Balle de match !' : '';
                say(`${side === 'L' ? '🔵' : '🟠'} Point pour <b>${esc(names[side])}</b> en ${s} s ! ${answerTxt(it)}${balle}`, 'good');
                await pwait(1400);
                if (id !== runId) return;
                if (goalMode() && pts[side] >= S.goal) duelEnd();
                else nextRound();
            } else {
                locked[side] = true;
                b.classList.add('ko');
                arena.querySelector(`.bn-half.${side}`).classList.add('lock');
                sfx('bad');
                say(`${side === 'L' ? '🔵' : '🟠'} <b>${esc(names[side])}</b> s'est trompé : côté bloqué pour ce mot !`, 'bad');
                if (locked[other]) {
                    state = 'result';
                    revealAnswer();
                    say(`😅 Les deux joueurs se sont trompés ! ${it.trap ? '🪤 Piège ! ' : ''}${answerTxt(it)} <small>${NAT_BY[it.type].tip}</small>`, 'bad');
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
            const ok = b.dataset.v === it.type;
            if (ok) {
                good++; streak++;
                const gain = 10 + Math.round(Math.max(0, 1 - ms / (S.speed * 1000)) * 10) + (streak >= 5 ? 3 : 0);
                score += gain; times.push(ms);
                b.classList.add('ok');
                revealAnswer();
                sfx('good');
                say(`✅ ${pick(['Bravo', 'Exact', 'Super', 'Rapide', 'Bien vu'])} ! ${(ms / 1000).toFixed(2).replace('.', ',')} s · +${gain}${streak >= 5 ? ' 🔥' : ''} &nbsp;${it.trap ? '🪤 Piège déjoué ! ' : ''}${answerTxt(it)}`, 'good');
            } else {
                streak = 0;
                b.classList.add('ko');
                revealAnswer();
                sfx('bad');
                say(`❌ Oups ! ${it.trap ? '🪤 Piège ! ' : ''}${answerTxt(it)} <small>${NAT_BY[it.type].tip}</small>`, 'bad');
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
            const title = st === 3 ? 'As de la grammaire !' : st === 2 ? 'Très bien joué !' : st === 1 ? 'Bien joué !' : 'On s\'entraîne encore ?';
            const avg = times.length ? (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2).replace('.', ',') : '—';
            const k = recKey();
            const isRec = score > 0 && score > (records[k] || 0);
            if (isRec) { records[k] = score; try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (e) {} }
            updateStats(false);
            const ov = overlay();
            ov.querySelector('.bn-card').innerHTML = `
                <div class="bn-medal">${medal}</div>
                <h3>${title}</h3>
                <div class="bn-bigstars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">⭐</span>`).join('')}</div>
                <p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${n} · ${score} points</p>
                <p class="bn-csub">${times.length ? `Temps moyen : ${avg} s` : 'Aucune bonne réponse'}${isRec ? ' · 🏆 Nouveau record !' : ''}</p>
                <div class="bn-actions">
                    <button class="bn-btn bn-btn-go" data-act="again">🔄 Rejouer</button>
                    <button class="bn-btn" data-act="tosetup">⚙️ Réglages</button>
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
                <div class="bn-actions">
                    ${hasClass() ? '<button class="bn-btn bn-btn-go" data-act="next">🎲 Duel suivant</button>' : ''}
                    <button class="bn-btn" data-act="tosetup">⚙️ Réglages</button>
                </div>`;
            const recTxt = recorded ? '<p class="bn-rec">✔ Scores ajoutés dans la liste 📂</p>' : '';
            ov.querySelector('.bn-card').innerHTML = tie ? `
                <div class="bn-medal">🤝</div>
                <h3>Égalité parfaite !</h3>
                <div class="bn-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bn-csub">${esc(names.L)} et ${esc(names.R)} sont à égalité sur ${nb} mots.</p>
                ${recTxt}${nextBtns}` : `
                <div class="bn-medal">${w === 'L' ? '🔵' : '🟠'}🏆</div>
                <h3>${esc(names[w])} gagne !</h3>
                <div class="bn-final"><span class="L">${pts.L}<small>${esc(names.L)}</small></span> – <span class="R">${pts.R}<small>${esc(names.R)}</small></span></div>
                <p class="bn-csub">sur ${nb} mots</p>
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
            const p = arena.querySelector('.bn-pause');
            if (p) p.classList.remove('show');
        }
        function togglePause() {
            const playing = state === 'wait' || state === 'go' || state === 'result';
            if (!playing) return;
            const p = arena.querySelector('.bn-pause');
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
            series = generateSeries(goalMode() ? Object.assign({}, S, { count: Math.max(10, S.goal * 2) }) : S, true);
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
            if (isSolo()) say(`⚡ ${series.length} mots, ${S.speed} s par mot : trouve la nature du mot surligné !`);
            else say(`⚡ ${goalMode() ? `Le premier à ${S.goal} point${S.goal > 1 ? 's' : ''} gagne !` : `${series.length} mots.`} ${S.speed} s par mot. Une erreur bloque ton côté : réfléchis avant de toucher !`);
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
            if (isSolo()) return '⚔️ Choisis les natures, puis clique sur <b>▶ Jouer</b> : trouve la nature du mot surligné le plus vite possible !';
            return hasClass()
                ? `⚔️ Choisissez les natures, puis cliquez sur <b>▶ Lancer le duel</b> : deux élèves de la liste 📂 seront tirés au sort.`
                : '⚔️ Choisissez les natures, puis cliquez sur <b>▶ Lancer le duel</b>. Un élève de chaque côté du tableau ! (📂 pour charger une liste d\'élèves)';
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
                const i = SOLO_KEYS.findIndex(ks => ks.indexOf(k) >= 0);
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
            if (_isMax) wfMax.click();
            if (state === 'wait' || state === 'go' || state === 'result' || state === 'draw') showSetup(isSolo() ? '⏹ Partie arrêtée.' : '⏹ Duel arrêté.');
            window._wfMiniBarCollapse(widget, '⚔️ Battle nature des mots', { onExpand: applyScale });
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
        container.querySelectorAll('.bn-rh[data-dir]').forEach(handle => {
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
            if (e.target.closest && e.target.closest('button, select, input, .bn-arena, .bn-rh, .bn-help, .bn-class, .bn-side')) {
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
            if ((typeof isPhoneScreen === 'function' && isPhoneScreen()) || (window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches) || (typeof isMobileBoardMode === 'function' && isMobileBoardMode())) {
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
            if (type === TYPE) return window.createBattleNatureMotsWidget();
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
