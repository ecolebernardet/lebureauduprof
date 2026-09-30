// =========================================================================
// JEU « MATHMASTER » — Le Bureau du Prof
// Panneau « Jeux » › rubrique « Jeux de maths » — mode jeu élèves
//
// Adaptation en widget de l'application MathMaster Pro (calcul mental).
// L'élève choisit son avatar, son prénom, un niveau, les opérations et
// une durée, puis répond au plus vite avec le pavé numérique (ou le clavier).
//
// Niveaux  : 🌱 Facile (×0,7) · 🔥 Moyen (×1) · 💀 Difficile (×1,3)
// Paliers  : la difficulté monte tous les 10 points (5 paliers)
// Modes    : Flash 30 s · Standard 60 s · Longue 90 s · Survie (1 erreur = fin)
// Classement top 10 + statistiques conservés dans le navigateur.
//
// Ouverture : createWidget('jeu-mathmaster')
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

    // ── CSS du jeu (préfixe mms-) ──────────────────────────────────────────
    // S(n) est remplacé par calc(npx * var(--mms-s)) pour la mise à l'échelle.
    if (!document.getElementById('widget-jeu-mathmaster-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-mathmaster-style';
        s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@700;800;900&display=swap');

        .widget[data-type="jeu-mathmaster"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .mms-container {
            --mms-s: 1;
            --encre: #211A4D;
            --encre-2: #2E2566;
            --creme: #FFF8E8;
            --or: #FFC933;
            --vert: #2FBF71;
            --rouge: #FF4F5E;
            --bleu: #3BA7FF;
            --orange: #FF8A1F;
            --rose: #FF5FB0;
            --violet: #8B6CFF;

            width: 560px;
            box-sizing: border-box;
            position: relative;
            padding: S(12) S(14) S(14);
            border-radius: S(24);
            background:
                radial-gradient(circle at 12% 8%, rgba(139,108,255,0.35) 0, transparent 40%),
                radial-gradient(circle at 92% 95%, rgba(255,95,176,0.25) 0, transparent 45%),
                var(--encre);
            box-shadow: 0 S(8) 0 #120E2E, 0 14px 34px rgba(20,10,50,0.35);
            font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            color: #fff;
            user-select: none;
            overflow-y: auto; overflow-x: hidden;
        }
        .mms-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: auto !important;
            z-index: 9999 !important; border-radius: 0 !important;
            padding-left: 40px !important;
            display: flex; align-items: center;
        }
        .mms-inner {
            display: flex; flex-direction: column;
            gap: S(10);
            width: 100%; max-width: S(532);
            margin: 0 auto;
        }
        .mms-container:focus-within, .widget[data-type="jeu-mathmaster"]:focus { outline: none; }

        /* ── En-tête ── */
        .mms-header { display: flex; align-items: center; gap: S(8); cursor: move; }
        .mms-logo {
            font-size: S(26); line-height: 1; pointer-events: none;
            animation: mms-wobble 3.5s ease-in-out infinite;
        }
        @keyframes mms-wobble { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg) translateY(-2px); } }
        .mms-title {
            font-family: 'Lilita One', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif;
            font-size: S(26); color: var(--or); letter-spacing: 0.5px;
            text-shadow: 0 S(3) 0 #B3470F;
            pointer-events: none; white-space: nowrap; line-height: 1;
        }
        .mms-title small { font-size: 0.55em; color: #fff; text-shadow: none; opacity: 0.6; margin-left: 4px; }
        .mms-header .wf-btns { margin-left: auto; }
        .mms-icon-btn {
            width: S(26); height: S(26);
            border-radius: 50%; border: none; cursor: pointer; padding: 0;
            background: rgba(255,255,255,0.12); color: #fff;
            font-size: S(13); font-weight: 900; font-family: inherit;
            display: flex; align-items: center; justify-content: center;
        }
        .mms-icon-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Écrans ── */
        .mms-screen { display: none; flex-direction: column; gap: S(10); }
        .mms-screen.show { display: flex; animation: mms-in .3s ease-out; }
        @keyframes mms-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .mms-label {
            font-weight: 900; font-size: S(13); color: rgba(255,255,255,0.75);
            margin-bottom: S(5); display: block;
        }

        /* Avatars */
        .mms-avatars { display: grid; grid-template-columns: repeat(8, 1fr); gap: S(6); }
        .mms-avatar {
            aspect-ratio: 1; border-radius: 50%; cursor: pointer; padding: 0;
            border: S(3) solid transparent; background: rgba(255,255,255,0.08);
            font-size: S(26); line-height: 1;
            display: flex; align-items: center; justify-content: center;
            transition: transform .15s, background .15s;
        }
        .mms-avatar:hover { transform: translateY(-2px) rotate(-5deg); background: rgba(255,255,255,0.16); }
        .mms-avatar.sel { border-color: var(--or); background: rgba(255,201,51,0.22); transform: scale(1.08); }

        .mms-name {
            width: 100%; box-sizing: border-box;
            font-family: inherit; font-weight: 900; font-size: S(17);
            padding: S(9) S(16); border-radius: 999px;
            border: S(3) solid rgba(255,255,255,0.18);
            background: var(--creme); color: var(--encre);
            outline: none; text-align: center; user-select: auto;
        }
        .mms-name:focus { border-color: var(--or); }
        .mms-name.err { border-color: var(--rouge); animation: mms-shake .4s; }

        /* Niveaux */
        .mms-row3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: S(8); }
        .mms-row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: S(8); }
        .mms-choice {
            font-family: inherit; font-weight: 900; font-size: S(14); color: #fff;
            border: none; border-radius: S(14); cursor: pointer;
            padding: S(8) S(4);
            background: rgba(255,255,255,0.08);
            box-shadow: 0 S(4) 0 rgba(0,0,0,0.28);
            display: flex; flex-direction: column; align-items: center; gap: S(2);
            transition: transform .1s, background .15s, box-shadow .1s;
        }
        .mms-choice .ico { font-size: S(22); line-height: 1; }
        .mms-choice:hover { background: rgba(255,255,255,0.15); }
        .mms-choice:active { transform: translateY(S(3)); box-shadow: 0 S(1) 0 rgba(0,0,0,0.28); }
        .mms-choice.on[data-diff="easy"]   { background: var(--vert);   box-shadow: 0 S(4) 0 #1D8A50; }
        .mms-choice.on[data-diff="medium"] { background: var(--orange); box-shadow: 0 S(4) 0 #B35A0A; }
        .mms-choice.on[data-diff="hard"]   { background: var(--rouge);  box-shadow: 0 S(4) 0 #B32A37; }
        .mms-choice.on[data-mode] { background: var(--violet); box-shadow: 0 S(4) 0 #5B41C4; }

        /* Opérations */
        .mms-op {
            font-family: 'Lilita One', sans-serif; font-size: S(34); line-height: 1;
            height: S(58); border: none; border-radius: S(16); cursor: pointer; color: #fff;
            background: rgba(255,255,255,0.08);
            box-shadow: 0 S(5) 0 rgba(0,0,0,0.28);
            opacity: 0.55; transition: transform .1s, opacity .15s, background .15s;
        }
        .mms-op:hover { opacity: 0.8; }
        .mms-op:active { transform: translateY(S(3)); }
        .mms-op.on { opacity: 1; }
        .mms-op.on[data-op="+"] { background: var(--vert);   box-shadow: 0 S(5) 0 #1D8A50; }
        .mms-op.on[data-op="-"] { background: var(--bleu);   box-shadow: 0 S(5) 0 #1E6FB8; }
        .mms-op.on[data-op="x"] { background: var(--orange); box-shadow: 0 S(5) 0 #B35A0A; }
        .mms-op.on[data-op="÷"] { background: var(--rose);   box-shadow: 0 S(5) 0 #B8337A; }

        /* Gros boutons */
        .mms-actions { display: flex; gap: S(8); }
        .mms-btn {
            flex: 1; font-family: 'Lilita One', sans-serif; font-weight: 400;
            font-size: S(19); letter-spacing: 0.3px;
            padding: S(11) S(12); border: none; border-radius: S(16); cursor: pointer;
            color: var(--encre); background: #fff;
            box-shadow: 0 S(5) 0 #B9B2D6;
            transition: transform .1s, box-shadow .1s, filter .15s;
        }
        .mms-btn:hover { filter: brightness(1.05); }
        .mms-btn:active { transform: translateY(S(4)); box-shadow: 0 S(1) 0 #B9B2D6; }
        .mms-btn.go { background: var(--or); box-shadow: 0 S(5) 0 #C98A00; flex: 2; font-size: S(22); }
        .mms-btn.go:active { box-shadow: 0 S(1) 0 #C98A00; }
        .mms-btn.green { background: var(--vert); color: #fff; box-shadow: 0 S(5) 0 #1D8A50; }
        .mms-btn.green:active { box-shadow: 0 S(1) 0 #1D8A50; }
        .mms-link {
            background: none; border: none; cursor: pointer; font-family: inherit;
            color: rgba(255,255,255,0.5); font-weight: 800; font-size: S(12);
            text-decoration: underline; align-self: center; padding: S(2);
        }
        .mms-link:hover { color: var(--rouge); }
        .mms-link.armed { color: var(--rouge); text-decoration: none; }

        /* ── Jeu ── */
        .mms-hud { display: flex; align-items: center; gap: S(8); }
        .mms-hud-avatar {
            width: S(46); height: S(46); border-radius: 50%; flex-shrink: 0;
            background: rgba(255,255,255,0.1); border: S(3) solid var(--or);
            display: flex; align-items: center; justify-content: center; font-size: S(26);
        }
        .mms-hud-avatar.hop { animation: mms-hop .45s ease; }
        @keyframes mms-hop { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-8px) rotate(-8deg); } }
        .mms-hud-name { font-weight: 900; font-size: S(15); line-height: 1.1; }
        .mms-hud-name small { display: block; color: var(--or); font-size: S(11); font-weight: 800; }
        .mms-chips { display: flex; gap: S(6); margin-left: auto; }
        .mms-chip {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(255,255,255,0.1); color: #fff;
            border-radius: 999px; padding: S(4) S(12);
            font-weight: 900; font-size: S(16); white-space: nowrap;
        }
        .mms-chip.ok { background: rgba(47,191,113,0.25); }
        .mms-chip.ko { background: rgba(255,79,94,0.25); }
        @keyframes mms-bump { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .mms-chip.bump { animation: mms-bump .4s ease; }
        .mms-stop {
            font-family: inherit; font-weight: 900; font-size: S(13);
            border: none; border-radius: 999px; cursor: pointer;
            padding: S(6) S(12); color: #fff; background: var(--rouge);
            box-shadow: 0 S(3) 0 #B32A37;
        }
        .mms-stop:active { transform: translateY(S(2)); box-shadow: 0 S(1) 0 #B32A37; }

        .mms-bars { display: flex; flex-direction: column; gap: S(5); }
        .mms-track {
            position: relative; height: S(18); border-radius: 999px;
            background: rgba(0,0,0,0.3); overflow: hidden;
        }
        .mms-track.thin { height: S(10); }
        .mms-fill {
            position: absolute; left: 0; top: 0; bottom: 0; width: 100%;
            border-radius: 999px;
            background: repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 S(8), transparent S(8) S(16)), linear-gradient(90deg, var(--vert), #7BE3A8);
            background-size: S(22) S(22), 100% 100%;
            animation: mms-stripes 1s linear infinite;
            transition: width .12s linear;
        }
        .mms-fill.low { background: repeating-linear-gradient(-45deg, rgba(255,255,255,0.18) 0 S(8), transparent S(8) S(16)), linear-gradient(90deg, var(--rouge), var(--orange)); background-size: S(22) S(22), 100% 100%; }
        .mms-fill.surv { background: repeating-linear-gradient(-45deg, rgba(255,255,255,0.12) 0 S(8), transparent S(8) S(16)), linear-gradient(90deg, var(--violet), var(--rose)); background-size: S(22) S(22), 100% 100%; }
        .mms-fill.prec { background: linear-gradient(90deg, var(--bleu), var(--violet)); animation: none; transition: width .3s ease; }
        @keyframes mms-stripes { to { background-position: S(22) 0, 0 0; } }
        .mms-track-txt {
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: S(12); color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .mms-track.thin .mms-track-txt { font-size: S(9); }

        .mms-card {
            position: relative;
            background: var(--creme); color: var(--encre);
            border-radius: S(22); padding: S(10) S(14) S(14);
            box-shadow: 0 S(6) 0 #CFC3A4;
            display: flex; flex-direction: column; align-items: center; gap: S(6);
        }
        .mms-card-top { display: flex; width: 100%; align-items: center; justify-content: space-between; min-height: S(24); }
        .mms-palier {
            font-weight: 900; font-size: S(12); padding: S(3) S(10); border-radius: 999px;
            background: rgba(33,26,77,0.08); color: #5A4E8E;
        }
        .mms-combo {
            font-family: 'Lilita One', sans-serif; font-size: S(16);
            color: #fff; background: var(--orange); padding: S(2) S(12); border-radius: 999px;
            box-shadow: 0 S(3) 0 #B35A0A;
            animation: mms-pulse .6s ease-in-out infinite alternate;
        }
        .mms-combo:empty { display: none; }
        @keyframes mms-pulse { from { transform: scale(1); } to { transform: scale(1.08); } }
        .mms-question {
            font-family: 'Lilita One', sans-serif; font-size: S(64); line-height: 1.05;
            color: var(--encre); white-space: nowrap; letter-spacing: 1px;
        }
        .mms-question.pop { animation: mms-qpop .25s ease-out; }
        @keyframes mms-qpop { from { transform: scale(0.7); opacity: 0.2; } to { transform: scale(1); opacity: 1; } }
        .mms-answer {
            min-width: S(180); height: S(62); padding: 0 S(18); box-sizing: border-box;
            border-radius: S(16); border: S(4) dashed #C9BEE8;
            background: #fff;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Lilita One', sans-serif; font-size: S(42); color: var(--violet);
            transition: border-color .15s, background .15s;
        }
        .mms-answer.empty::before { content: '?'; color: #D5CDEF; }
        .mms-answer.ok  { border-style: solid; border-color: var(--vert);  background: #E4F9EE; color: var(--vert); }
        .mms-answer.bad { border-style: solid; border-color: var(--rouge); background: #FFE6E8; color: var(--rouge); }
        .mms-fx {
            position: absolute; right: S(18); top: 50%; font-size: S(36); pointer-events: none;
            animation: mms-fx .7s ease-out forwards;
        }
        @keyframes mms-fx { from { transform: translateY(0) scale(0.6); opacity: 1; } to { transform: translateY(-40px) scale(1.3); opacity: 0; } }
        .mms-correction { font-weight: 900; font-size: S(14); color: var(--rouge); min-height: S(18); }

        .mms-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: S(8); }
        .mms-key {
            font-family: 'Lilita One', sans-serif; font-size: S(30); line-height: 1;
            height: S(58); border: none; border-radius: S(16); cursor: pointer;
            background: #fff; color: var(--encre);
            box-shadow: 0 S(5) 0 #B9B2D6;
            transition: transform .08s, box-shadow .08s;
        }
        .mms-key:active, .mms-key.press { transform: translateY(S(4)); box-shadow: 0 S(1) 0 #B9B2D6; }
        .mms-key.del { background: #FFE0E3; color: var(--rouge); box-shadow: 0 S(5) 0 #E8A3AA; }
        .mms-key.del:active, .mms-key.del.press { box-shadow: 0 S(1) 0 #E8A3AA; }
        .mms-key.ok { background: var(--vert); color: #fff; box-shadow: 0 S(5) 0 #1D8A50; }
        .mms-key.ok:active, .mms-key.ok.press { box-shadow: 0 S(1) 0 #1D8A50; }

        @keyframes mms-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .mms-card.shake { animation: mms-shake .45s ease; }

        /* ── Résultats ── */
        .mms-res-head { text-align: center; }
        .mms-medal { font-size: S(58); line-height: 1; animation: mms-pop .5s ease-out; }
        .mms-res-title { font-family: 'Lilita One', sans-serif; font-size: S(28); color: var(--or); text-shadow: 0 S(3) 0 #B3470F; }
        .mms-res-sub { font-weight: 800; font-size: S(13); color: rgba(255,255,255,0.65); }
        @keyframes mms-pop { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .mms-bigscore {
            align-self: center; min-width: S(140); text-align: center;
            font-family: 'Lilita One', sans-serif; font-size: S(64); line-height: 1;
            color: var(--encre); background: var(--or);
            border-radius: S(22); padding: S(8) S(24) S(4);
            box-shadow: 0 S(6) 0 #C98A00;
            animation: mms-pop .45s ease-out .1s both;
        }
        .mms-bigscore small { display: block; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: S(12); opacity: 0.7; padding-bottom: S(4); }
        .mms-statgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: S(8); }
        .mms-statgrid.four { grid-template-columns: repeat(4, 1fr); }
        .mms-stat {
            background: rgba(255,255,255,0.08); border-radius: S(14);
            padding: S(7) S(6); text-align: center;
        }
        .mms-stat b { display: block; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: S(24); line-height: 1.1; }
        .mms-stat span { font-weight: 800; font-size: S(11); color: rgba(255,255,255,0.65); }
        .mms-stat.ko b { color: #FF8C96; }
        .mms-stat.ok b { color: #7BE3A8; }

        .mms-board {
            background: var(--creme); color: var(--encre);
            border-radius: S(18); padding: S(8) S(10);
            box-shadow: 0 S(5) 0 #CFC3A4;
        }
        .mms-board-title { font-family: 'Lilita One', sans-serif; font-size: S(17); text-align: center; margin-bottom: S(4); }
        .mms-board-list { max-height: S(190); overflow-y: auto; }
        .mms-row {
            display: flex; align-items: center; gap: S(8);
            padding: S(4) S(6); border-radius: S(10);
            font-weight: 800; font-size: S(14);
        }
        .mms-row:nth-child(odd) { background: rgba(33,26,77,0.05); }
        .mms-row.me { background: rgba(255,201,51,0.35) !important; }
        .mms-rank {
            width: S(24); height: S(24); border-radius: 50%; flex-shrink: 0;
            background: #E4DDF7; color: var(--encre);
            display: flex; align-items: center; justify-content: center;
            font-weight: 900; font-size: S(12);
        }
        .mms-row:nth-child(1) .mms-rank { background: #FFC933; }
        .mms-row:nth-child(2) .mms-rank { background: #D6DCE4; }
        .mms-row:nth-child(3) .mms-rank { background: #E8A86A; }
        .mms-row-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mms-row-name small { color: #8A80AE; font-size: S(11); margin-left: 4px; }
        .mms-row-pts { font-family: 'Lilita One', sans-serif; font-size: S(18); color: var(--violet); }
        .mms-empty { text-align: center; color: #8A80AE; font-weight: 800; padding: S(14) 0; font-size: S(14); }

        /* ── Aide ── */
        .mms-help {
            display: none; position: absolute; top: 50px; right: 14px; width: 330px; z-index: 30;
            background: #fff; border-radius: 14px; padding: 12px 14px;
            box-shadow: 0 6px 0 #B9B2D6, 0 10px 30px rgba(0,0,0,0.3);
            font-size: 13px; line-height: 1.45; font-weight: 700; color: var(--encre);
        }
        .mms-help.show { display: block; }
        .mms-help h4 { margin: 0 0 6px; font-family: 'Lilita One', sans-serif; font-weight: 400; font-size: 17px; }
        .mms-help p { margin: 0 0 7px; }

        /* ── Confettis ── */
        .mms-confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 40; border-radius: inherit; }
        .mms-confetti i { position: absolute; top: -14px; width: 9px; height: 14px; border-radius: 2px; animation: mms-fall 1.8s ease-in forwards; }
        .mms-confetti i.sym { width: auto; height: auto; background: none !important; font-style: normal; font-family: 'Lilita One', sans-serif; font-size: 20px; }
        @keyframes mms-fall { to { transform: translateY(760px) rotate(600deg); opacity: 0; } }

        /* ── Poignées resize ── */
        .mms-rh { position: absolute; z-index: 50; opacity: 0; transition: opacity .2s; }
        .mms-container:hover .mms-rh { opacity: 1; }
        .mms-container.wf-fullboard .mms-rh { display: none; }
        .mms-rh-se { bottom: 0; right: 0; width: 18px; height: 18px; cursor: se-resize; background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 18px 0; }
        .mms-rh-sw { bottom: 0; left: 0; width: 18px; height: 18px; cursor: sw-resize; background: linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 0 0 18px; }
        .mms-rh-ne { top: 0; right: 0; width: 18px; height: 18px; cursor: ne-resize; background: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 0 18px 0 0; }
        .mms-rh-nw { top: 0; left: 0; width: 18px; height: 18px; cursor: nw-resize; background: linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.6) 50%); border-radius: 18px 0 0 0; }
        .mms-rh-n { top: 0; left: 18px; right: 18px; height: 5px; cursor: n-resize; }
        .mms-rh-s { bottom: 0; left: 18px; right: 18px; height: 5px; cursor: s-resize; }
        .mms-rh-e { top: 18px; bottom: 18px; right: 0; width: 5px; cursor: e-resize; }
        .mms-rh-w { top: 18px; bottom: 18px; left: 0; width: 5px; cursor: w-resize; }

        @media (prefers-reduced-motion: reduce) {
            .mms-container *, .mms-container *::before, .mms-container *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important;
            }
        }
        `.replace(/S\((-?[\d.]+)\)/g, 'calc($1px * var(--mms-s))');
        document.head.appendChild(s);
    }

    // =========================================================================
    // DONNÉES
    // =========================================================================
    const MMS_AVATARS = ['🐱', '🐼', '🐵', '🐭', '🦊', '🐸', '🐯', '🐰'];
    const MMS_DIFF = {
        easy:   { label: 'Facile',    ico: '🌱', mult: 0.7 },
        medium: { label: 'Moyen',     ico: '🔥', mult: 1 },
        hard:   { label: 'Difficile', ico: '💀', mult: 1.3 },
    };
    const MMS_MODES = [
        { v: '30',       ico: '⚡', label: 'Flash 30 s' },
        { v: '60',       ico: '⏱️', label: 'Standard 60 s' },
        { v: '90',       ico: '⏳', label: 'Longue 90 s' },
        { v: 'survival', ico: '💀', label: 'Survie' },
    ];
    const MMS_PALIERS = ['Découverte', 'Apprentissage', 'Maîtrise', 'Expert', 'Maître'];
    const KEY_SCORES = 'bdp-mathmaster-scores';
    const KEY_STATS  = 'bdp-mathmaster-stats';
    const CONFETTI_COLORS = ['#FF4F5E', '#FFC933', '#2FBF71', '#3BA7FF', '#8B6CFF', '#FF5FB0', '#fff'];

    // ── Stockage (protégé) ─────────────────────────────────────────────────
    function loadJSON(key, def) {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
    }
    function saveJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* stockage indisponible */ }
    }
    function esc(t) { return String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    // ── Petits sons (Web Audio, sans fichier) ──────────────────────────────
    let _mmsAudio = null;
    function tone(freq, start, dur, type, vol) {
        try {
            if (!_mmsAudio) _mmsAudio = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = _mmsAudio, t0 = ctx.currentTime + start;
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
        key:     () => tone(520, 0, 0.05, 'triangle', 0.05),
        correct: () => { tone(880, 0, 0.08, 'triangle', 0.1); tone(1320, 0.07, 0.12, 'triangle', 0.08); },
        wrong:   () => { tone(200, 0, 0.18, 'square', 0.05); tone(160, 0.18, 0.25, 'square', 0.05); },
        combo:   () => { tone(1200, 0, 0.08, 'sine', 0.08); tone(1600, 0.07, 0.14, 'sine', 0.07); },
        palier:  () => [660, 880, 1100].forEach((f, i) => tone(f, 0.09 * i, 0.16, 'triangle', 0.08)),
        tick:    () => tone(1000, 0, 0.04, 'sine', 0.05),
        start:   () => [392, 523, 659].forEach((f, i) => tone(f, 0.1 * i, 0.15, 'triangle', 0.09)),
        end:     () => [784, 659, 523, 659, 1047].forEach((f, i) => tone(f, 0.12 * i, 0.2, 'triangle', 0.09)),
    };

    // =========================================================================
    // GÉNÉRATION DES CALCULS (reprise fidèle de MathMaster)
    // =========================================================================
    function palierFor(score) {
        if (score <= 10) return 1;
        if (score <= 20) return 2;
        if (score <= 30) return 3;
        if (score <= 40) return 4;
        return 5;
    }
    function makeQuestion(ops, difficulty, score) {
        let op = ops[Math.floor(Math.random() * ops.length)];
        const lvl = palierFor(score);
        const m = MMS_DIFF[difficulty].mult;
        const r = (n) => Math.floor(Math.random() * n);
        let n1, n2, ans;

        if (op === '+') {
            const max = [10, 20, 50, 100, 150][lvl - 1];
            n1 = r(max * m) + 1; n2 = r(max * m) + 1;
            ans = n1 + n2;
        } else if (op === '-') {
            if (lvl === 1)      { n1 = r(15 * m) + 5;   n2 = r(Math.min(10, n1)); }
            else if (lvl === 2) { n1 = r(30 * m) + 10;  n2 = r(n1 - 5); }
            else if (lvl === 3) { n1 = r(70 * m) + 20;  n2 = r(n1 - 10); }
            else if (lvl === 4) { n1 = r(120 * m) + 30; n2 = r(n1 - 15); }
            else                { n1 = r(200 * m) + 50; n2 = r(n1 - 20); }
            ans = n1 - n2;
        } else if (op === 'x') {
            const t = [[5, 10], [10, 10], [15, 12], [20, 15], [25, 20]][lvl - 1];
            n1 = r(t[0] * m) + 1; n2 = r(t[1]) + 1;
            ans = n1 * n2;
            op = '×';
        } else {
            const t = [[4, 8], [7, 10], [9, 15], [11, 20], [14, 25]][lvl - 1];
            n2 = r(t[0] * m) + 2;
            ans = r(t[1]) + 1;
            n1 = n2 * ans;
            op = '÷';
        }
        if (op === '-') op = '−';
        return { text: `${n1} ${op} ${n2}`, answer: ans, palier: lvl };
    }

    // =========================================================================
    // CRÉATION DU WIDGET
    // =========================================================================
    window.createJeuMathMasterWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 100, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'jeu-mathmaster';
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
        container.className = 'mms-container';
        container.innerHTML = `
          <div class="mms-inner">
            <div class="mms-header">
                <span class="mms-logo">🧮</span>
                <span class="mms-title">MathMaster<small>calcul mental</small></span>
                <div class="wf-btns">
                    <button class="mms-icon-btn" data-role="sound" title="Couper le son">🔊</button>
                    <button class="mms-icon-btn" data-role="help" title="Comment jouer ?">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>

            <!-- ÉCRAN RÉGLAGES -->
            <div class="mms-screen show" data-screen="setup">
                <div>
                    <span class="mms-label">Choisis ton avatar</span>
                    <div class="mms-avatars">
                        ${MMS_AVATARS.map((a, i) => `<button class="mms-avatar${i === 0 ? ' sel' : ''}" data-av="${a}">${a}</button>`).join('')}
                    </div>
                </div>
                <input class="mms-name" type="text" maxlength="20" placeholder="Écris ton prénom…" autocomplete="off" spellcheck="false">
                <div>
                    <span class="mms-label">Niveau</span>
                    <div class="mms-row3">
                        ${Object.entries(MMS_DIFF).map(([k, d]) => `<button class="mms-choice${k === 'medium' ? ' on' : ''}" data-diff="${k}"><span class="ico">${d.ico}</span>${d.label}</button>`).join('')}
                    </div>
                </div>
                <div>
                    <span class="mms-label">Opérations</span>
                    <div class="mms-row4">
                        <button class="mms-op on" data-op="+" title="Additions">+</button>
                        <button class="mms-op on" data-op="-" title="Soustractions">−</button>
                        <button class="mms-op" data-op="x" title="Multiplications">×</button>
                        <button class="mms-op" data-op="÷" title="Divisions">÷</button>
                    </div>
                </div>
                <div>
                    <span class="mms-label">Durée de la partie</span>
                    <div class="mms-row4">
                        ${MMS_MODES.map(mo => `<button class="mms-choice${mo.v === '60' ? ' on' : ''}" data-mode="${mo.v}"><span class="ico">${mo.ico}</span>${mo.label}</button>`).join('')}
                    </div>
                </div>
                <div class="mms-actions">
                    <button class="mms-btn" data-act="scores">🏆 Classement</button>
                    <button class="mms-btn go" data-act="start">▶ C'est parti !</button>
                </div>
            </div>

            <!-- ÉCRAN JEU -->
            <div class="mms-screen" data-screen="game">
                <div class="mms-hud">
                    <div class="mms-hud-avatar" data-role="hud-av">🐱</div>
                    <div class="mms-hud-name" data-role="hud-name"></div>
                    <div class="mms-chips">
                        <span class="mms-chip ok" data-role="score" title="Bonnes réponses">⭐ 0</span>
                        <span class="mms-chip ko" data-role="errors" title="Erreurs">❌ 0</span>
                    </div>
                    <button class="mms-stop" data-act="stop" title="Arrêter la partie">■ Stop</button>
                </div>
                <div class="mms-bars">
                    <div class="mms-track" title="Temps restant">
                        <div class="mms-fill" data-role="time-bar"></div>
                        <div class="mms-track-txt" data-role="time-txt">--</div>
                    </div>
                    <div class="mms-track thin" title="Précision">
                        <div class="mms-fill prec" data-role="prec-bar"></div>
                        <div class="mms-track-txt" data-role="prec-txt">🎯 100 %</div>
                    </div>
                </div>
                <div class="mms-card">
                    <div class="mms-card-top">
                        <span class="mms-palier" data-role="palier">Palier 1 · Découverte</span>
                        <span class="mms-combo" data-role="combo"></span>
                    </div>
                    <div class="mms-question" data-role="question">-- + --</div>
                    <div class="mms-answer empty" data-role="answer"></div>
                    <div class="mms-correction" data-role="correction"></div>
                </div>
                <div class="mms-pad">
                    ${['1','2','3','4','5','6','7','8','9'].map(k => `<button class="mms-key" data-key="${k}">${k}</button>`).join('')}
                    <button class="mms-key del" data-key="C" title="Effacer">⌫</button>
                    <button class="mms-key" data-key="0">0</button>
                    <button class="mms-key ok" data-key="Enter" title="Valider">✓</button>
                </div>
            </div>

            <!-- ÉCRAN RÉSULTATS / CLASSEMENT -->
            <div class="mms-screen" data-screen="result">
                <div class="mms-res-head">
                    <div class="mms-medal" data-role="medal">🎉</div>
                    <div class="mms-res-title" data-role="res-title">Résultats !</div>
                    <div class="mms-res-sub" data-role="res-sub"></div>
                </div>
                <div class="mms-bigscore" data-role="bigscore">0<small>bonnes réponses</small></div>
                <div class="mms-statgrid" data-role="statgrid"></div>
                <div class="mms-board">
                    <div class="mms-board-title">🏆 Top 10</div>
                    <div class="mms-board-list" data-role="board"></div>
                </div>
                <div class="mms-actions">
                    <button class="mms-btn" data-act="menu">🏠 Menu</button>
                    <button class="mms-btn green" data-act="again">🔁 Rejouer</button>
                </div>
                <button class="mms-link" data-act="clear">🗑 Réinitialiser les records</button>
            </div>
          </div>

            <div class="mms-help">
                <h4>🧮 Comment jouer ?</h4>
                <p>Choisis ton avatar, écris ton prénom, puis règle le <b>niveau</b>, les <b>opérations</b> et la <b>durée</b>.</p>
                <p>⌨️ Tape le résultat avec le pavé ou le clavier, puis valide avec <b>✓</b> ou <b>Entrée</b>. <b>⌫</b> ou <b>Échap</b> pour effacer.</p>
                <p>📈 Tous les 10 points, les calculs deviennent plus difficiles : 5 paliers, de <i>Découverte</i> à <i>Maître</i>.</p>
                <p>🔥 3 bonnes réponses d'affilée = <b>combo</b> !</p>
                <p style="margin:0">💀 <b>Survie</b> : pas de chrono, mais la partie s'arrête à la première erreur.</p>
            </div>
            <div class="mms-confetti"></div>
            <div class="mms-rh mms-rh-nw" data-dir="nw"></div>
            <div class="mms-rh mms-rh-n"  data-dir="n"></div>
            <div class="mms-rh mms-rh-ne" data-dir="ne"></div>
            <div class="mms-rh mms-rh-e"  data-dir="e"></div>
            <div class="mms-rh mms-rh-se" data-dir="se"></div>
            <div class="mms-rh mms-rh-s"  data-dir="s"></div>
            <div class="mms-rh mms-rh-sw" data-dir="sw"></div>
            <div class="mms-rh mms-rh-w"  data-dir="w"></div>
        `;
        widget.appendChild(container);

        // ── Références ─────────────────────────────────────────────────────
        const $ = (sel) => container.querySelector(sel);
        const role = (r) => container.querySelector(`[data-role="${r}"]`);
        const act = (a) => container.querySelector(`[data-act="${a}"]`);
        const inner     = $('.mms-inner');
        const screens   = container.querySelectorAll('.mms-screen');
        const nameIn    = $('.mms-name');
        const scoreEl   = role('score');
        const errEl     = role('errors');
        const timeBar   = role('time-bar');
        const timeTxt   = role('time-txt');
        const precBar   = role('prec-bar');
        const precTxt   = role('prec-txt');
        const palierEl  = role('palier');
        const comboEl   = role('combo');
        const qEl       = role('question');
        const ansEl     = role('answer');
        const corrEl    = role('correction');
        const card      = $('.mms-card');
        const hudAv     = role('hud-av');
        const soundBtn  = role('sound');
        const helpBtn   = role('help');
        const helpBox   = $('.mms-help');
        const confetti  = $('.mms-confetti');

        // ── État ───────────────────────────────────────────────────────────
        let avatar = MMS_AVATARS[0];
        let difficulty = 'medium';
        let ops = ['+', '-'];
        let mode = '60';
        let soundOn = true;
        let score = 0, errors = 0, combo = 0, bestCombo = 0;
        let q = null, typed = '';
        let timeLeft = 0, initialTime = 0, isSurvival = false;
        let timerId = null, startTime = 0, locked = false, playing = false;
        let lastPalier = 1, lastTick = -1;
        const sfx = (n) => { if (soundOn && SFX[n]) SFX[n](); };

        function show(name) {
            screens.forEach(sc => sc.classList.toggle('show', sc.dataset.screen === name));
            requestAnimationFrame(applyScale);
        }

        // ── Échelle proportionnelle ────────────────────────────────────────
        const BASE_W = 560;
        function applyScale() {
            const w = container.clientWidth || BASE_W;
            let sc = w / BASE_W;
            if (container.classList.contains('wf-fullboard')) {
                container.style.setProperty('--mms-s', '1');
                const natH = inner.offsetHeight + 26;
                const availH = container.clientHeight;
                if (natH > 0 && availH > 0) sc = Math.min(sc, (availH / natH) * 0.98);
            }
            sc = Math.max(0.5, Math.min(3, sc));
            container.style.setProperty('--mms-s', sc.toFixed(4));
        }

        // ── Réglages ───────────────────────────────────────────────────────
        container.querySelectorAll('.mms-avatar').forEach(b => b.addEventListener('click', () => {
            container.querySelectorAll('.mms-avatar').forEach(x => x.classList.remove('sel'));
            b.classList.add('sel'); avatar = b.dataset.av; sfx('key');
        }));
        container.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => {
            container.querySelectorAll('[data-diff]').forEach(x => x.classList.remove('on'));
            b.classList.add('on'); difficulty = b.dataset.diff; sfx('key');
        }));
        container.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
            container.querySelectorAll('[data-mode]').forEach(x => x.classList.remove('on'));
            b.classList.add('on'); mode = b.dataset.mode; sfx('key');
        }));
        container.querySelectorAll('.mms-op').forEach(b => b.addEventListener('click', () => {
            const op = b.dataset.op;
            if (ops.includes(op)) {
                if (ops.length === 1) { b.classList.remove('bump'); void b.offsetWidth; return; } // au moins une
                ops = ops.filter(o => o !== op); b.classList.remove('on');
            } else { ops.push(op); b.classList.add('on'); }
            sfx('key');
        }));
        nameIn.addEventListener('input', () => nameIn.classList.remove('err'));
        nameIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); startGame(); } e.stopPropagation(); });
        nameIn.addEventListener('pointerdown', (e) => e.stopPropagation());
        nameIn.addEventListener('mousedown', (e) => e.stopPropagation());

        // ── Affichage en jeu ───────────────────────────────────────────────
        function renderAnswer(state) {
            ansEl.textContent = typed;
            ansEl.className = 'mms-answer' + (typed ? '' : ' empty') + (state ? ' ' + state : '');
        }
        function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
        function updateChips() {
            scoreEl.textContent = '⭐ ' + score;
            errEl.textContent = '❌ ' + errors;
        }
        function accuracy() {
            const t = score + errors;
            return t > 0 ? Math.round((score / t) * 100) : 100;
        }
        function updatePrecision() {
            const a = accuracy();
            precBar.style.width = a + '%';
            precTxt.textContent = '🎯 ' + a + ' %';
        }
        function updateCombo() {
            if (combo >= 3) { comboEl.textContent = `🔥 Combo ×${combo}`; sfx('combo'); }
            else comboEl.textContent = '';
        }
        function nextQuestion() {
            q = makeQuestion(ops, difficulty, score);
            if (q.palier > lastPalier) {
                lastPalier = q.palier;
                sfx('palier');
                burst(14, true);
            }
            palierEl.textContent = `Palier ${q.palier} · ${MMS_PALIERS[q.palier - 1]}`;
            qEl.textContent = q.text + ' =';
            qEl.classList.remove('pop'); void qEl.offsetWidth; qEl.classList.add('pop');
            typed = ''; corrEl.textContent = '';
            renderAnswer();
            fitQuestion();
        }
        // Réduit la police si le calcul est trop long pour la carte
        function fitQuestion() {
            qEl.style.fontSize = '';
            const max = card.clientWidth - 20;
            if (qEl.scrollWidth > max && qEl.scrollWidth > 0) {
                const cur = parseFloat(getComputedStyle(qEl).fontSize);
                qEl.style.fontSize = Math.floor(cur * max / qEl.scrollWidth) + 'px';
            }
        }
        function fx(ch) {
            const f = document.createElement('div');
            f.className = 'mms-fx'; f.textContent = ch;
            card.appendChild(f);
            setTimeout(() => f.remove(), 750);
        }

        // ── Partie ─────────────────────────────────────────────────────────
        function startGame() {
            const name = nameIn.value.trim();
            if (!name) {
                nameIn.classList.remove('err'); void nameIn.offsetWidth; nameIn.classList.add('err');
                nameIn.placeholder = 'Écris ton prénom pour commencer !';
                nameIn.focus();
                sfx('wrong');
                return;
            }
            score = 0; errors = 0; combo = 0; bestCombo = 0; lastPalier = 1; lastTick = -1;
            locked = false; playing = true;
            startTime = Date.now();
            hudAv.textContent = avatar;
            role('hud-name').innerHTML = `${esc(name)}<small>${MMS_DIFF[difficulty].ico} ${MMS_DIFF[difficulty].label}</small>`;
            updateChips(); updatePrecision(); updateCombo();

            isSurvival = (mode === 'survival');
            initialTime = timeLeft = isSurvival ? 0 : parseInt(mode, 10);
            timeBar.classList.remove('low', 'surv');
            clearInterval(timerId);
            if (isSurvival) {
                timeBar.classList.add('surv');
                timeBar.style.width = '100%';
                timeTxt.textContent = '💀 Survie : aucune erreur !';
            } else {
                timeBar.style.width = '100%';
                timeTxt.textContent = initialTime + ' s';
                timerId = setInterval(tick, 100);
            }
            show('game');
            nextQuestion();
            sfx('start');
            widget.focus({ preventScroll: true });
        }
        function tick() {
            if (!widget.isConnected) { clearInterval(timerId); return; }
            timeLeft = Math.max(0, timeLeft - 0.1);
            timeBar.style.width = (timeLeft / initialTime * 100) + '%';
            const secs = Math.ceil(timeLeft);
            timeTxt.textContent = secs + ' s';
            if (timeLeft <= 10) {
                timeBar.classList.add('low');
                if (secs !== lastTick && secs <= 5 && secs > 0) { lastTick = secs; sfx('tick'); }
            }
            if (timeLeft <= 0) endGame();
        }
        function pressKey(k) {
            if (!playing || locked) return;
            if (k === 'C') { typed = typed.slice(0, -1); }
            else if (k === 'Enter') { checkAnswer(); return; }
            else if (typed.length < 6) { typed += k; }
            sfx('key');
            renderAnswer();
        }
        function checkAnswer() {
            if (!playing || locked || typed === '') return;
            const val = parseInt(typed, 10);
            if (val === q.answer) {
                score++; combo++; bestCombo = Math.max(bestCombo, combo);
                updateChips(); bump(scoreEl); updatePrecision();
                renderAnswer('ok'); fx('✨');
                hudAv.classList.remove('hop'); void hudAv.offsetWidth; hudAv.classList.add('hop');
                sfx('correct'); updateCombo();
                locked = true;
                setTimeout(() => { locked = false; if (playing) nextQuestion(); }, 180);
            } else {
                errors++; combo = 0;
                updateChips(); bump(errEl); updatePrecision(); updateCombo();
                renderAnswer('bad'); fx('💥');
                corrEl.textContent = `C'était ${q.answer}`;
                card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
                sfx('wrong');
                locked = true;
                setTimeout(() => {
                    locked = false;
                    if (!playing) return;
                    if (isSurvival) endGame(); else nextQuestion();
                }, 900);
            }
        }
        function endGame() {
            if (!playing) return;
            playing = false;
            clearInterval(timerId); timerId = null;
            sfx('end');

            const name = nameIn.value.trim();
            const minutes = Math.floor((Date.now() - startTime) / 60000);
            const acc = accuracy();

            // Classement
            const entry = { name, score, avatar, difficulty, time: new Date().toLocaleDateString('fr-FR'), id: Date.now() };
            let scores = loadJSON(KEY_SCORES, []);
            scores.push(entry);
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 10);
            saveJSON(KEY_SCORES, scores);

            // Statistiques
            const st = loadJSON(KEY_STATS, { totalGames: 0, bestScore: 0, wins: 0, totalPrecision: 0, totalTime: 0, streak: 0 });
            st.totalGames++;
            st.bestScore = Math.max(st.bestScore, score);
            if (errors === 0 && score > 0) { st.wins++; st.streak++; } else st.streak = 0;
            st.totalPrecision += acc;
            st.totalTime += minutes;
            saveJSON(KEY_STATS, st);

            // Écran de résultats
            let medal = '💪', title = 'Continue !';
            if (errors === 0 && score > 0) { medal = '🏆'; title = 'Parfait !'; }
            else if (acc >= 90) { medal = '⭐'; title = 'Excellent !'; }
            else if (acc >= 75) { medal = '👍'; title = 'Bien joué !'; }
            role('medal').textContent = medal;
            role('res-title').textContent = title;
            role('res-sub').textContent = `${avatar} ${name} · ${MMS_DIFF[difficulty].ico} ${MMS_DIFF[difficulty].label} · palier ${palierFor(score)} atteint`;
            role('bigscore').innerHTML = `${score}<small>bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}</small>`;
            const sg = role('statgrid');
            sg.className = 'mms-statgrid four';
            sg.innerHTML = `
                <div class="mms-stat ko"><b>${errors}</b><span>Erreurs</span></div>
                <div class="mms-stat ok"><b>${acc} %</b><span>Précision</span></div>
                <div class="mms-stat"><b>×${bestCombo}</b><span>Meilleur combo</span></div>
                <div class="mms-stat"><b>${st.bestScore}</b><span>Record</span></div>`;
            renderBoard(entry.id);
            resetClearBtn();
            act('again').style.display = '';
            show('result');
            if (score > 0) burst(60, false);
        }

        function renderBoard(highlightId) {
            const scores = loadJSON(KEY_SCORES, []);
            const board = role('board');
            if (!scores.length) { board.innerHTML = '<div class="mms-empty">🏆 Aucun record pour l’instant</div>'; return; }
            board.innerHTML = scores.map((s, i) => `
                <div class="mms-row${s.id && s.id === highlightId ? ' me' : ''}">
                    <span class="mms-rank">${i + 1}</span>
                    <span class="mms-row-name">${s.avatar || ''} ${esc(s.name || '?')} ${MMS_DIFF[s.difficulty] ? MMS_DIFF[s.difficulty].ico : ''}<small>${esc(s.time || '')}</small></span>
                    <span class="mms-row-pts">${s.score}</span>
                </div>`).join('');
        }

        function showHighScores() {
            const st = loadJSON(KEY_STATS, { totalGames: 0, bestScore: 0, wins: 0, totalPrecision: 0, totalTime: 0, streak: 0 });
            const avg = st.totalGames > 0 ? Math.round(st.totalPrecision / st.totalGames) : 0;
            role('medal').textContent = '🏆';
            role('res-title').textContent = 'Hall of Fame';
            const h = Math.floor(st.totalTime / 60), mn = st.totalTime % 60;
            role('res-sub').textContent = `Temps de jeu : ${h > 0 ? h + ' h ' : ''}${mn} min · Série parfaite : ${st.streak}`;
            role('bigscore').innerHTML = `${st.bestScore}<small>meilleur score</small>`;
            const sg = role('statgrid');
            sg.className = 'mms-statgrid four';
            sg.innerHTML = `
                <div class="mms-stat"><b>${st.totalGames}</b><span>Parties jouées</span></div>
                <div class="mms-stat ok"><b>${st.wins}</b><span>Parties parfaites</span></div>
                <div class="mms-stat ok"><b>${avg} %</b><span>Précision moy.</span></div>
                <div class="mms-stat"><b>${st.streak}</b><span>Série actuelle</span></div>`;
            renderBoard(null);
            resetClearBtn();
            act('again').style.display = 'none';
            show('result');
        }

        // Réinitialisation en deux clics (pas de boîte de dialogue)
        let clearArmed = null;
        function resetClearBtn() {
            clearTimeout(clearArmed); clearArmed = null;
            const b = act('clear');
            b.classList.remove('armed');
            b.textContent = '🗑 Réinitialiser les records';
        }
        act('clear').addEventListener('click', () => {
            const b = act('clear');
            if (!clearArmed) {
                b.classList.add('armed');
                b.textContent = '⚠️ Clique encore pour tout effacer';
                clearArmed = setTimeout(resetClearBtn, 3000);
                return;
            }
            saveJSON(KEY_SCORES, []);
            saveJSON(KEY_STATS, { totalGames: 0, bestScore: 0, wins: 0, totalPrecision: 0, totalTime: 0, streak: 0 });
            resetClearBtn();
            if (act('again').style.display === 'none') showHighScores(); else renderBoard(null);
        });

        function backToMenu() {
            playing = false; clearInterval(timerId); timerId = null;
            show('setup');
        }

        // ── Confettis ──────────────────────────────────────────────────────
        function burst(n, symbols) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const w = container.clientWidth;
            for (let i = 0; i < n; i++) {
                const c = document.createElement('i');
                if (symbols) { c.className = 'sym'; c.textContent = ['+', '−', '×', '÷', '='][i % 5]; c.style.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]; }
                else c.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
                c.style.left = Math.random() * w + 'px';
                c.style.animationDelay = (Math.random() * 0.5) + 's';
                c.style.animationDuration = (1.4 + Math.random() * 1) + 's';
                confetti.appendChild(c);
            }
            setTimeout(() => { confetti.innerHTML = ''; }, 3000);
        }

        // ── Boutons ────────────────────────────────────────────────────────
        act('start').addEventListener('click', startGame);
        act('scores').addEventListener('click', showHighScores);
        act('stop').addEventListener('click', endGame);
        act('menu').addEventListener('click', backToMenu);
        act('again').addEventListener('click', startGame);
        container.querySelectorAll('.mms-key').forEach(b => b.addEventListener('click', () => pressKey(b.dataset.key)));

        // Clavier : actif quand le widget a le focus (clic dessus)
        widget.addEventListener('keydown', (e) => {
            if (e.target === nameIn) return;
            if (!playing) {
                if (e.key === 'Enter' && screens[0].classList.contains('show')) { e.preventDefault(); startGame(); }
                return;
            }
            let k = null;
            if (e.key >= '0' && e.key <= '9') k = e.key;
            else if (e.key === 'Enter') k = 'Enter';
            else if (e.key === 'Backspace' || e.key === 'Escape' || e.key === 'Delete') k = 'C';
            if (!k) return;
            e.preventDefault(); e.stopPropagation();
            pressKey(k);
            const btnK = container.querySelector(`.mms-key[data-key="${k}"]`);
            if (btnK) { btnK.classList.add('press'); setTimeout(() => btnK.classList.remove('press'), 110); }
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
        const wfMin = role('wf-min'), wfMax = role('wf-max'), wfClose = role('wf-close');
        let _isMax = false, _savedW = null, _savedH = null;
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🧮 MathMaster', { onExpand: applyScale });
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
            requestAnimationFrame(() => { applyScale(); if (playing) fitQuestion(); });
            widget.focus({ preventScroll: true });
        });
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            clearInterval(timerId);
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
        const onWinResize = () => {
            if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
            if (_isMax) { applyScale(); if (playing) fitQuestion(); }
        };
        window.addEventListener('resize', onWinResize);

        // ── Resize 8 directions ────────────────────────────────────────────
        container.querySelectorAll('.mms-rh[data-dir]').forEach(handle => {
            const dir = handle.dataset.dir;
            function startResize(clientX, clientY) {
                const startX = clientX, startY = clientY;
                const startW = container.offsetWidth, startH = container.offsetHeight;
                const startL = widget.offsetLeft, startT = widget.offsetTop;
                const onMove = (cx, cy) => {
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (dir.includes('e')) newW = Math.max(340, startW + dx);
                    if (dir.includes('w')) { newW = Math.max(340, startW - dx); newL = startL + (startW - newW); }
                    if (dir.includes('s')) newH = Math.max(300, startH + dy);
                    if (dir.includes('n')) { newH = Math.max(300, startH - dy); newT = startT + (startH - newH); }
                    container.style.width = newW + 'px';
                    if (dir.includes('n') || dir.includes('s')) container.style.height = newH + 'px';
                    if (dir.includes('w')) widget.style.left = newL + 'px';
                    if (dir.includes('n')) widget.style.top = newT + 'px';
                    applyScale();
                    if (playing) fitQuestion();
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
            if (e.target.closest && e.target.closest('button, input, .mms-rh, .mms-help, .mms-board-list')) {
                e.stopPropagation();
                if (!e.target.closest('input')) {
                    if (typeof bringToFront === 'function') bringToFront(widget);
                    // garder le clavier actif sur le widget pendant la partie
                    setTimeout(() => { if (document.activeElement !== nameIn) widget.focus({ preventScroll: true }); }, 0);
                }
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
            if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                wfMax.click();
            } else if (widget.dataset.leftPercent === undefined) {
                // Nouveau widget (pas une restauration de sauvegarde)
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
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            if (type === 'jeu-mathmaster') return window.createJeuMathMasterWidget();
            return _orig.apply(this, arguments);
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    if (type === 'jeu-mathmaster') return window.createJeuMathMasterWidget();
                    return orig.apply(this, arguments);
                };
            }
        });
    }
})();
