// =========================================================================
// WIDGET JEU « MULTI-RUN » (tables de multiplication) — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-multi-run'.
// Design repris de widget-jeu-tables-multi.js (redimensionnement libre,
// barre d'édition avec paramètres, aide, réduire, plein écran board, fermer).
//
// Principe : un petit renard court automatiquement sur une piste. À chaque
// vague, une opération s'affiche et 3 plateformes arrivent, chacune portant
// un résultat. L'élève saute (Espace / ↑ / tap sur la piste / bouton Sauter)
// pour atterrir sur la plateforme qui porte le bon résultat.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-multi-run.js"></script>
//   2. Ajouter une carte dans le panneau Jeux (rubrique Jeux de maths) :
//      <div class="act-card" onclick="createWidget('jeu-multi-run');toggleJeuxPanel()">…</div>
//
// 📌 Sauvegarde / restauration (save-load.js) :
//   - widget._jtmaGetData()  → { tables, speed, wPct, hPct, fullboard, best }
//   - restauration : save-load.js pose window._jtmaNextPendingData avant
//     createWidget('jeu-multi-run'), le hook ci-dessous le transmet à l'init.
// =========================================================================

(function () {

    // ── Fonction utilitaire mini-barre collapse (injectée une seule fois, partagée) ──
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
            expandBtn.addEventListener('pointerup', (e) => {
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

    // ── CSS boutons fenêtre (injecté une seule fois, partagé) ────────────
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

    // ── CSS spécifique au widget ──────────────────────────────────────────
    if (!document.getElementById('widget-jeu-multi-run-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-multi-run-style';
        s.textContent = `
        .widget[data-type="jeu-multi-run"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jtma-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 700px;
            min-width: 420px;
            min-height: 380px;
        }
        .jtma-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }
        .jtma-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jtma-header { display:flex; align-items:center; gap:8px; cursor:move; user-select:none; flex-shrink:0; }
        .jtma-title { font-size:13px; font-weight:800; color:#374151; letter-spacing:.3px; pointer-events:none; white-space:nowrap; }

        .jtma-params-btn, .jtma-help-btn {
            width:22px; height:22px; border-radius:50%;
            border:1px solid #bbb; background:#f5f5f5;
            color:#666; font-size:12px; font-weight:700;
            cursor:pointer; display:flex; align-items:center;
            justify-content:center; flex-shrink:0; transition:background .15s;
        }
        .jtma-params-btn:hover, .jtma-help-btn:hover { background:#e0e0e0; color:#333; }
        .jtma-params-btn.active { background:#4a90e2; color:white; border-color:#357abd; }

        /* ── Popup aide ── */
        .jtma-help-popup {
            display:none; position:absolute; top:42px; right:10px;
            background:#fff; border:1px solid #ddd; border-radius:10px;
            box-shadow:0 4px 16px rgba(0,0,0,0.15);
            padding:12px 14px; width:330px;
            font-size:11px; color:#444; z-index:20; line-height:1.6;
        }
        .jtma-help-popup.show { display:block; }
        .jtma-help-popup h4 { margin:0 0 8px; font-size:12px; color:#374151; }

        /* ── Paramètres ── */
        .jtma-params-panel {
            background:#f8f9fa; border:1px solid #e5e7eb; border-radius:10px;
            padding:10px 14px; display:none; flex-direction:column; gap:8px; flex-shrink:0;
        }
        .jtma-params-panel.show { display:flex; }
        .jtma-params-title { font-size:11px; font-weight:700; color:#374151; margin-bottom:2px; }
        .jtma-params-grid { display:flex; flex-wrap:wrap; gap:6px; }
        .jtma-table-check {
            display:flex; align-items:center; gap:4px; padding:4px 10px;
            border-radius:20px; border:1.5px solid transparent;
            background:#fff4e0; color:#b45309; cursor:pointer;
            font-size:11px; font-weight:700; transition:all .15s; user-select:none;
        }
        .jtma-table-check input[type=checkbox] { display:none; }
        .jtma-table-check.checked { border-color:currentColor; }
        .jtma-table-check:not(.checked) { opacity:.4; }
        .jtma-table-check:hover { opacity:1; }
        .jtma-params-row { display:flex; align-items:center; gap:8px; }
        .jtma-params-row label { font-size:11px; font-weight:600; color:#374151; white-space:nowrap; }
        .jtma-speed-select {
            padding:5px 10px; border-radius:7px; border:1px solid #d1d5db; font-size:12px;
            font-family:'Segoe UI', system-ui, sans-serif; outline:none; cursor:pointer; background:white;
        }
        .jtma-speed-select:focus { border-color:#4a90e2; }

        /* ── HUD ── */
        .jtma-hud {
            display:flex; align-items:center; justify-content:space-between;
            font-size:14px; font-weight:800; color:#374151; flex-shrink:0; padding:0 2px; gap:8px;
        }
        .jtma-score { color:#2e7d32; }
        .jtma-best  { color:#b45309; }
        .jtma-timer { font-variant-numeric:tabular-nums; }
        .jtma-lives { letter-spacing:2px; font-size:15px; }

        /* ── Scène de course ── */
        .jtma-stage {
            flex:1; min-height:180px; position:relative;
            border-radius:12px; overflow:hidden;
            background:linear-gradient(180deg, #5bb8ec 0%, #a9def5 55%, #e4f6fb 100%);
            border:1.5px solid #b7dcf5;
            touch-action:none; cursor:pointer;
        }
        .jtma-clouds {
            position:absolute; left:0; right:0; top:0; height:50%;
            pointer-events:none; z-index:0;
            background-image:
                radial-gradient(ellipse 52px 18px at 80px 46px, rgba(255,255,255,.95) 97%, transparent 100%),
                radial-gradient(ellipse 30px 18px at 100px 34px, rgba(255,255,255,.95) 97%, transparent 100%),
                radial-gradient(ellipse 64px 20px at 320px 96px, rgba(255,255,255,.9) 97%, transparent 100%),
                radial-gradient(ellipse 36px 20px at 300px 82px, rgba(255,255,255,.9) 97%, transparent 100%);
            background-size:480px 100%;
            background-repeat:repeat-x;
        }
        .jtma-hills {
            position:absolute; left:0; right:0; height:32%;
            bottom:var(--jtma-ground-h, 60px);
            pointer-events:none; z-index:0;
            background-image:
                radial-gradient(ellipse 140px 100% at 110px 100%, #8fd18a 97%, transparent 100%),
                radial-gradient(ellipse 100px 70% at 310px 100%, #7cc576 97%, transparent 100%);
            background-size:420px 100%;
            background-repeat:repeat-x;
        }
        .jtma-ground {
            position:absolute; left:0; right:0; bottom:0;
            height:var(--jtma-ground-h, 60px);
            z-index:1; pointer-events:none;
            background-image:
                linear-gradient(180deg, #5cc04a 0, #5cc04a 9px, #3f9a33 9px, #3f9a33 13px, transparent 13px),
                repeating-linear-gradient(90deg, #c08a52 0 30px, #b07a44 30px 60px);
            border-top:2px solid #2f7d26;
        }

        /* ── Bannière question ── */
        .jtma-banner {
            position:absolute; top:10px; left:50%; transform:translateX(-50%);
            background:#fff; border:3px solid #374151; border-radius:14px;
            padding:4px 18px; font-size:var(--jtma-fs-banner, 26px); font-weight:900;
            color:#1f2937; z-index:5; white-space:nowrap; pointer-events:none;
            box-shadow:0 4px 0 rgba(0,0,0,.18); font-variant-numeric:tabular-nums;
            transition:background .2s, border-color .2s, color .2s;
        }
        .jtma-banner.ok { background:#dcfce7; border-color:#2f8f48; color:#166534; }
        .jtma-banner.ko { background:#fee2e2; border-color:#c53030; color:#822727; }
        .jtma-hint {
            position:absolute; right:10px; bottom:calc(var(--jtma-ground-h, 60px) + 6px);
            font-size:11px; font-weight:700; color:rgba(31,41,55,.55); z-index:2; pointer-events:none;
        }

        /* ── Coureur (renard original) ── */
        .jtma-runner {
            position:absolute; z-index:4; pointer-events:none;
            width:var(--jtma-char-w, 80px); height:var(--jtma-char-h, 80px);
        }
        .jtma-runner svg { width:100%; height:100%; display:block; overflow:visible; }
        .jtma-runner .jtma-body { animation:jtma-bob .32s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 100%; }
        .jtma-runner .jtma-leg { transform-box:fill-box; transform-origin:50% 0; }
        .jtma-runner .jtma-leg-a { animation:jtma-leg .32s ease-in-out infinite alternate; }
        .jtma-runner .jtma-leg-b { animation:jtma-leg .32s ease-in-out infinite alternate-reverse; }
        .jtma-runner .jtma-tail  { transform-box:fill-box; transform-origin:100% 80%; animation:jtma-tail .64s ease-in-out infinite; }
        .jtma-runner.idle .jtma-body, .jtma-runner.idle .jtma-leg-a,
        .jtma-runner.idle .jtma-leg-b, .jtma-runner.idle .jtma-tail { animation-play-state:paused; }
        .jtma-runner.air .jtma-body { animation:none; }
        .jtma-runner.air .jtma-leg-a { animation:none; transform:rotate(38deg); }
        .jtma-runner.air .jtma-leg-b { animation:none; transform:rotate(-30deg); }
        .jtma-runner.hurt { animation:jtma-blink .12s linear 6; }
        @keyframes jtma-bob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6%); } }
        @keyframes jtma-leg  { from { transform:rotate(-32deg); } to { transform:rotate(32deg); } }
        @keyframes jtma-tail { 0%,100% { transform:rotate(-6deg); } 50% { transform:rotate(10deg); } }
        @keyframes jtma-blink { 0%,100% { opacity:1; } 50% { opacity:.25; } }

        /* ── Plateformes ── */
        .jtma-plat {
            position:absolute; z-index:3; box-sizing:border-box;
            border:2.5px solid #6b4220; border-radius:10px 10px 18px 18px;
            background:linear-gradient(180deg, #5cc04a 0, #5cc04a 24%, #3f9a33 24%, #3f9a33 32%, #b8804a 32%, #9c6a3a 100%);
            box-shadow:0 6px 10px rgba(0,0,0,.22);
            display:flex; align-items:center; justify-content:center;
            transition:filter .2s, opacity .2s;
        }
        .jtma-plat-num {
            margin-top:12%;
            font-size:var(--jtma-fs-plat, 24px); font-weight:900; color:#fff;
            text-shadow:0 2px 0 #4a2c12, 2px 0 0 #4a2c12, -2px 0 0 #4a2c12, 0 -2px 0 #4a2c12;
            font-variant-numeric:tabular-nums; pointer-events:none;
        }
        .jtma-plat.correct { box-shadow:0 0 0 4px #22c55e, 0 0 18px 6px rgba(34,197,94,.7); }
        .jtma-plat.wrong   { filter:sepia(1) hue-rotate(-50deg) saturate(3); box-shadow:0 0 0 4px #ef4444; }
        .jtma-plat.reveal  { box-shadow:0 0 0 4px #22c55e; animation:jtma-pulse .5s ease-in-out 3; }
        .jtma-plat.disabled { opacity:.5; }
        @keyframes jtma-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.07); } }

        /* ── Pièces / +1 ── */
        .jtma-coin {
            position:absolute; z-index:6; pointer-events:none;
            width:18px; height:18px; border-radius:50%;
            background:radial-gradient(circle at 35% 30%, #fff6b0, #f7c51e 55%, #c98a00);
            border:2px solid #a86f00; box-sizing:border-box;
            transform:translate(-50%, 50%);
            animation:jtma-coin-fly .7s ease-out forwards;
        }
        @keyframes jtma-coin-fly {
            0%   { transform:translate(-50%, 50%) scale(.6); opacity:1; }
            100% { transform:translate(calc(-50% + var(--dx)), calc(50% + var(--dy))) scale(1); opacity:0; }
        }
        .jtma-plus {
            position:absolute; z-index:6; pointer-events:none;
            font-size:var(--jtma-fs-plat, 24px); font-weight:900; color:#16a34a;
            text-shadow:0 2px 0 #fff;
            transform:translate(-50%, 0);
            animation:jtma-plus-up .8s ease-out forwards;
        }
        @keyframes jtma-plus-up {
            0%   { transform:translate(-50%, 0); opacity:1; }
            100% { transform:translate(-50%, -60px); opacity:0; }
        }

        /* ── Overlay ── */
        .jtma-overlay {
            position:absolute; inset:0; display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:10px;
            background:rgba(255,255,255,0.85); backdrop-filter:blur(1px);
            z-index:10; text-align:center; padding:10px; cursor:default;
        }
        .jtma-overlay.hidden { display:none; }
        .jtma-overlay-title { font-size:18px; font-weight:800; color:#374151; }
        .jtma-overlay-sub { font-size:13px; color:#6b7280; max-width:440px; }
        .jtma-start-btn {
            padding:10px 22px; border-radius:10px; border:none;
            background:#f59e0b; color:white; font-size:14px; font-weight:800;
            cursor:pointer; transition:background .15s, transform .1s;
        }
        .jtma-start-btn:hover { background:#d97706; }
        .jtma-start-btn:active { transform:scale(0.96); }

        /* ── Contrôles bas ── */
        .jtma-controls { display:flex; gap:8px; align-items:center; flex-wrap:wrap; flex-shrink:0; }
        .jtma-btn {
            padding:5px 12px; border-radius:8px; border:none;
            font-size:11px; font-weight:700; cursor:pointer;
            transition:background .15s, transform .1s; touch-action:manipulation;
        }
        .jtma-btn:active { transform:scale(0.96); }
        .jtma-btn-reset { background:#6b7280; color:white; }
        .jtma-btn-reset:hover { background:#4b5563; }
        .jtma-btn-pause { background:#4a90e2; color:white; }
        .jtma-btn-pause:hover { background:#357abd; }
        .jtma-btn-jump {
            margin-left:auto; background:#f59e0b; color:white;
            font-size:14px; padding:8px 22px; border-radius:10px;
        }
        .jtma-btn-jump:hover { background:#d97706; }

        /* ── Poignée resize ── */
        .jtma-resize-handle {
            position:absolute; right:0; bottom:0; width:18px; height:18px; cursor:se-resize;
            background:linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius:0 0 14px 0; opacity:0; transition:opacity .2s; z-index:15;
        }
        .jtma-container:hover .jtma-resize-handle { opacity:1; }
        `;
        document.head.appendChild(s);
    }

    // ── Personnage original : un petit renard coureur ───────────────────────
    const FOX_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <g class="jtma-leg jtma-leg-b"><rect x="22" y="45" width="6" height="14" rx="3" fill="#8a4214"/></g>
  <g class="jtma-leg jtma-leg-b"><rect x="38" y="45" width="6" height="14" rx="3" fill="#8a4214"/></g>
  <g class="jtma-body">
    <g class="jtma-tail">
      <path d="M19 40 C6 40 1 28 6 18 C10 28 16 32 24 34 Z" fill="#ef7d2d" stroke="#8a4214" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6 18 C3 23 3 27 5 30 C6.5 26 7 22 6 18 Z" fill="#fff8ee"/>
    </g>
    <ellipse cx="32" cy="40" rx="15" ry="10" fill="#f28c3c" stroke="#8a4214" stroke-width="1.5"/>
    <ellipse cx="35" cy="44" rx="8" ry="4.5" fill="#fff3e3"/>
    <path d="M36 31 Q45 36 53 32 L54 36 Q45 41 36 35 Z" fill="#1fa3d8"/>
    <path d="M38 34 L31 41 L35 42 Z" fill="#1688b6"/>
    <polygon points="39,20 40,7 47,16" fill="#f28c3c" stroke="#8a4214" stroke-width="1.5" stroke-linejoin="round"/>
    <polygon points="47,15 53,5 55,18" fill="#f28c3c" stroke="#8a4214" stroke-width="1.5" stroke-linejoin="round"/>
    <polygon points="41,17 41.5,10 45,15" fill="#3b2314"/>
    <circle cx="47" cy="25" r="10.5" fill="#f28c3c" stroke="#8a4214" stroke-width="1.5"/>
    <path d="M50 26 L63 29 L50 34 Z" fill="#fff3e3" stroke="#8a4214" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="62.5" cy="29" r="2" fill="#222"/>
    <circle cx="50" cy="22" r="2.2" fill="#222"/>
    <circle cx="50.7" cy="21.3" r=".7" fill="#fff"/>
  </g>
  <g class="jtma-leg jtma-leg-a"><rect x="26" y="45" width="6" height="14" rx="3" fill="#b85a1e"/></g>
  <g class="jtma-leg jtma-leg-a"><rect x="42" y="45" width="6" height="14" rx="3" fill="#b85a1e"/></g>
</svg>`;

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-multi-run';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jtma-container">

  <div class="jtma-header">
    <span class="jtma-title">🦊 Multi-Run — Tables de multiplication</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jtma-params-btn" title="Paramètres">⚙</button>
      <button class="jtma-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <div class="jtma-params-panel">
    <div class="jtma-params-title">Tables à réviser :</div>
    <div class="jtma-params-grid"></div>
    <div class="jtma-params-row">
      <label>Vitesse de course :</label>
      <select class="jtma-speed-select">
        <option value="7000">🐢 Facile</option>
        <option value="5000" selected>🚶 Moyen</option>
        <option value="3600">🚀 Rapide</option>
        <option value="2400">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <div class="jtma-hud">
    <span class="jtma-score">⭐ Score : 0</span>
    <span class="jtma-best">🏆 Record : 0</span>
    <span class="jtma-timer">⏱️ 00:00</span>
    <span class="jtma-lives">❤️❤️❤️</span>
  </div>

  <div class="jtma-stage">
    <div class="jtma-clouds"></div>
    <div class="jtma-hills"></div>
    <div class="jtma-ground"></div>
    <div class="jtma-banner">Prêt ?</div>
    <div class="jtma-hint">Espace / ↑ ou touche la piste pour sauter</div>
    <div class="jtma-runner idle">${FOX_SVG}</div>
    <div class="jtma-overlay">
      <div class="jtma-overlay-title">🦊 Multi-Run</div>
      <div class="jtma-overlay-sub">Saute au bon moment pour atterrir sur la plateforme qui porte le bon résultat !</div>
      <button class="jtma-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <div class="jtma-controls">
    <button class="jtma-btn jtma-btn-reset">🔄 Réinitialiser</button>
    <button class="jtma-btn jtma-btn-pause">⏸ Pause</button>
    <button class="jtma-btn jtma-btn-jump">⬆ Sauter</button>
  </div>

  <div class="jtma-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9) qui apparaîtront dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse de course</b> — Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> : le renard accélère toutes les 10 bonnes réponses.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Le renard court tout seul. Une opération s'affiche en haut (ex. 7 × 8 = ?) et 3 plateformes arrivent, chacune avec un résultat.</p>
    <p style="margin:0 0 6px">Pour sauter : touche <b>Espace</b> ou <b>↑</b>, touche/clique sur la piste, ou utilise le bouton <b>⬆ Sauter</b> (pratique au TBI). Atterris sur la plateforme du bon résultat pour gagner un point ⭐.</p>
    <p style="margin:0 0 6px">Atterrir sur une mauvaise plateforme, ou laisser passer les 3 sans sauter, fait perdre une vie ❤️.</p>
    <p style="margin:0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Le record est conservé avec le tableau.</p>
  </div>

  <div class="jtma-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuMultiRunWidget = function (widget, savedData) {

        const restoreData = savedData || null;

        const container    = widget.querySelector('.jtma-container');
        const paramsBtn    = widget.querySelector('.jtma-params-btn');
        const paramsPanel  = widget.querySelector('.jtma-params-panel');
        const paramsGrid   = widget.querySelector('.jtma-params-grid');
        const speedSelect  = widget.querySelector('.jtma-speed-select');
        const helpBtn      = widget.querySelector('.jtma-help-btn');
        const helpPopup    = widget.querySelector('.jtma-help-popup');
        const resizeHandle = widget.querySelector('.jtma-resize-handle');
        const scoreEl      = widget.querySelector('.jtma-score');
        const bestEl       = widget.querySelector('.jtma-best');
        const timerEl      = widget.querySelector('.jtma-timer');
        const livesEl      = widget.querySelector('.jtma-lives');
        const stage        = widget.querySelector('.jtma-stage');
        const cloudsEl     = widget.querySelector('.jtma-clouds');
        const hillsEl      = widget.querySelector('.jtma-hills');
        const groundEl     = widget.querySelector('.jtma-ground');
        const bannerEl     = widget.querySelector('.jtma-banner');
        const runnerEl     = widget.querySelector('.jtma-runner');
        const overlay      = widget.querySelector('.jtma-overlay');
        const overlayTitle = widget.querySelector('.jtma-overlay-title');
        const overlaySub   = widget.querySelector('.jtma-overlay-sub');
        const startBtn     = widget.querySelector('.jtma-start-btn');
        const resetBtn     = widget.querySelector('.jtma-btn-reset');
        const pauseBtn     = widget.querySelector('.jtma-btn-pause');
        const jumpBtn      = widget.querySelector('.jtma-btn-jump');

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        const JUMP_TIME = 0.82; // s, durée totale d'un saut depuis le sol
        let activeTables = new Set([2,3,4,5,6,7,8,9]);
        let crossTime    = 5000; // ms pour qu'une plateforme traverse toute la scène
        let score = 0, best = 0, lives = MAX_LIVES;
        let running = false, paused = true, destroyed = false;
        let rafId = null, lastTime = null;
        let elapsedMs = 0, lastShownSeconds = -1;
        let plats = [];   // { el, x, val, correct, wave }
        let wave  = null; // { op, plats, answered, resolvedMs }
        let bgOffset = 0;

        const PROGRESSIVE_START = 7000, PROGRESSIVE_MIN = 1600, PROGRESSIVE_DECAY = 0.82;
        let isProgressiveMode = false, lastProgressiveMilestone = 0;

        // Géométrie de la scène (recalculée au redimensionnement)
        const G = { stageW: 600, stageH: 300, groundH: 50, charH: 70, charW: 66, thick: 30, P: 120, apex: 160, platW: 120, cx: 120, vy0: 0, g: 0 };

        // Coureur
        const runner = { h: 0, vy: 0, grounded: true, onPlat: null };

        // ── Helper tap stylet ─────────────────────────────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup', onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx + dy*dy) < 12) { eu.stopPropagation(); handler(eu); }
                }
                el.addEventListener('pointerup', onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        function persist() { if (typeof saveBoard === 'function') saveBoard(); }

        // ── Cases à cocher des tables ────────────────────────────────────
        const tableLabels = {};
        for (let n = 2; n <= 9; n++) {
            const label = document.createElement('label');
            label.className = 'jtma-table-check checked';
            label.innerHTML = `<input type="checkbox" value="${n}" checked> ×${n}`;
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (activeTables.has(n)) activeTables.delete(n); else activeTables.add(n);
                syncTableLabels();
                persist();
            });
            paramsGrid.appendChild(label);
            tableLabels[n] = label;
        }
        function syncTableLabels() {
            for (let n = 2; n <= 9; n++) {
                const on = activeTables.has(n);
                tableLabels[n].classList.toggle('checked', on);
                tableLabels[n].querySelector('input').checked = on;
            }
        }

        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
            requestAnimationFrame(computeGeom);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('change', () => { applySpeedSelection(); persist(); });

        function applySpeedSelection() {
            if (speedSelect.value === 'progressive') {
                isProgressiveMode = true;
                crossTime = PROGRESSIVE_START;
                lastProgressiveMilestone = 0;
            } else {
                isProgressiveMode = false;
                crossTime = parseInt(speedSelect.value, 10) || 5000;
            }
        }
        function maybeAdvanceProgressiveSpeed() {
            if (!isProgressiveMode) return;
            const milestone = Math.floor(score / 10);
            if (milestone > lastProgressiveMilestone) {
                lastProgressiveMilestone = milestone;
                crossTime = Math.max(PROGRESSIVE_MIN, Math.round(PROGRESSIVE_START * Math.pow(PROGRESSIVE_DECAY, milestone)));
            }
        }
        function currentSpeed() { return G.stageW / (crossTime / 1000); } // px/s

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        const onDocPointerDown = (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); };
        document.addEventListener('pointerdown', onDocPointerDown);

        // ── Géométrie & tailles adaptatives ──────────────────────────────
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        function computeGeom() {
            const oldW = G.stageW;
            G.stageW  = stage.clientWidth  || 600;
            G.stageH  = stage.clientHeight || 300;
            G.groundH = Math.round(clamp(G.stageH * 0.13, 22, 90));
            G.charH   = Math.round(clamp(G.stageH * 0.15, 40, 120));
            G.charW   = Math.round(G.charH * 1.0);
            G.thick   = Math.round(clamp(G.charH * 0.45, 22, 54));
            G.P       = Math.round(G.charH * 1.25 + G.thick);
            G.apex    = Math.round(G.P + G.charH * 0.6);
            G.platW   = Math.round(clamp(G.charW * 1.9, 84, 230));
            G.cx      = Math.round(G.stageW * 0.2);
            G.vy0     = 4 * G.apex / JUMP_TIME;
            G.g       = 8 * G.apex / (JUMP_TIME * JUMP_TIME);

            stage.style.setProperty('--jtma-ground-h', G.groundH + 'px');
            stage.style.setProperty('--jtma-char-w', G.charW + 'px');
            stage.style.setProperty('--jtma-char-h', G.charH + 'px');
            stage.style.setProperty('--jtma-fs-plat', Math.round(clamp(G.thick * 0.62, 14, 34)) + 'px');

            if (oldW > 0 && oldW !== G.stageW) {
                const r = G.stageW / oldW;
                plats.forEach(p => { p.x *= r; });
            }
            plats.forEach(p => { p.el.style.width = G.platW + 'px'; p.el.style.height = G.thick + 'px'; });
            if (runner.onPlat) runner.h = G.P;
            render();
        }

        function applyFontScale() {
            const w = container.offsetWidth || 700;
            container.style.setProperty('--jtma-fs-banner', Math.round(clamp(26 * w / 700, 18, 44)) + 'px');
            computeGeom();
        }

        let ro = null;
        if (typeof ResizeObserver === 'function') {
            ro = new ResizeObserver(() => { if (!destroyed) applyFontScale(); });
            ro.observe(stage);
        }

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');
        let _savedW = null, _savedH = null, _isMax = false;

        makeTap(wfMin, () => {
            pauseGame();
            if (_isMax) {
                _isMax = false;
                container.classList.remove('wf-fullboard', 'jti-mobile');
                if (_savedW) container.style.width  = _savedW;
                if (_savedH) container.style.height = _savedH;
                applyFontScale();
            }
            window._wfMiniBarCollapse(widget, '🦊 Multi-Run', { onExpand: applyFontScale });
        });
        makeTap(wfMax, () => {
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = container.style.width;
                _savedH = container.style.height;
                if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) container.classList.add('jti-mobile');
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard', 'jti-mobile');
                if (_savedW) container.style.width  = _savedW;
                if (_savedH) container.style.height = _savedH;
            }
            applyFontScale();
            persist();
        });
        makeTap(wfClose, () => {
            stopGame();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            persist();
        });

        // ── Resize 2D ────────────────────────────────────────────────────
        function saveDimsToDataset() {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
            widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
        }
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(420, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(380, startH + ev.clientY - startY) + 'px';
                applyFontScale();
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup', onEnd);
                saveDimsToDataset();
                persist();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup', onEnd);
        });

        // =====================================================================
        // LOGIQUE DU JEU
        // =====================================================================
        function formatTime(ms) {
            const t = Math.floor(ms / 1000);
            return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
        }
        function updateHUD() {
            scoreEl.textContent = '⭐ Score : ' + score;
            bestEl.textContent  = '🏆 Record : ' + best;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, MAX_LIVES - lives));
        }
        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }
        function setBanner(text, cls) {
            bannerEl.textContent = text;
            bannerEl.classList.remove('ok', 'ko');
            if (cls) bannerEl.classList.add(cls);
        }

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function generateOperation() {
            const tables = activeTables.size > 0 ? Array.from(activeTables) : [2,3,4,5,6,7,8,9];
            const a = tables[randInt(0, tables.length - 1)];
            const b = randInt(0, 9);
            const correct = a * b;
            const wrongSet = new Set();
            let guard = 0;
            while (wrongSet.size < 2 && guard < 30) {
                guard++;
                let c;
                const mode = randInt(0, 2);
                if (mode === 0) c = correct + randInt(1, 6) * (Math.random() < 0.5 ? -1 : 1);
                else if (mode === 1) c = a * (b + (Math.random() < 0.5 ? -1 : 1));
                else c = (a + (Math.random() < 0.5 ? -1 : 1)) * b;
                if (c === correct || c < 0) continue;
                wrongSet.add(c);
            }
            let fb = correct + 1;
            while (wrongSet.size < 2) { if (fb !== correct) wrongSet.add(fb); fb++; }
            const choices = [correct, ...Array.from(wrongSet)];
            for (let i = choices.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }
            return { a, b, correct, choices };
        }

        function spawnWave() {
            const op = generateOperation();
            const v  = currentSpeed();
            const gap = Math.max(G.charW * 1.6, v * 0.32);
            const startX = G.stageW + 30;
            const wv = { op, plats: [], answered: false, resolvedMs: 0 };
            op.choices.forEach((val, i) => {
                const el = document.createElement('div');
                el.className = 'jtma-plat';
                el.innerHTML = '<span class="jtma-plat-num">' + val + '</span>';
                el.style.width  = G.platW + 'px';
                el.style.height = G.thick + 'px';
                stage.appendChild(el);
                const p = { el, x: startX + i * (G.platW + gap), val, correct: val === op.correct, wave: wv };
                plats.push(p);
                wv.plats.push(p);
            });
            wave = wv;
            setBanner(op.a + ' × ' + op.b + ' = ?', '');
        }

        function jump() {
            if (!running || paused) return;
            if (!(runner.grounded || runner.onPlat)) return;
            runner.vy = G.vy0;
            runner.grounded = false;
            runner.onPlat = null;
        }

        function overlaps(p) {
            const l = G.cx - G.charW * 0.3, r = G.cx + G.charW * 0.3;
            return r > p.x && l < p.x + G.platW;
        }

        function updateRunner(dt) {
            if (runner.grounded) return;
            if (runner.onPlat) {
                runner.h = G.P;
                if (runner.onPlat.x + G.platW < G.cx - G.charW * 0.3) { runner.onPlat = null; runner.vy = 0; }
                return;
            }
            const prevH = runner.h;
            runner.vy -= G.g * dt;
            runner.h  += runner.vy * dt;
            if (runner.vy < 0 && wave && !wave.answered && prevH >= G.P && runner.h <= G.P) {
                const target = wave.plats.find(overlaps);
                if (target) { landOn(target); return; }
            }
            if (runner.h <= 0) { runner.h = 0; runner.vy = 0; runner.grounded = true; }
        }

        function hurtRunner() {
            runnerEl.classList.remove('hurt');
            void runnerEl.offsetWidth;
            runnerEl.classList.add('hurt');
            setTimeout(() => runnerEl.classList.remove('hurt'), 760);
        }

        function landOn(p) {
            runner.onPlat = p; runner.h = G.P; runner.vy = 0;
            wave.answered = true;
            const op = wave.op;
            wave.plats.forEach(q => { if (q !== p) q.el.classList.add('disabled'); });
            if (p.correct) {
                score++;
                if (score > best) best = score;
                p.el.classList.add('correct');
                setBanner(op.a + ' × ' + op.b + ' = ' + op.correct + ' ✓', 'ok');
                spawnCoins(p);
                maybeAdvanceProgressiveSpeed();
                updateHUD();
            } else {
                lives--;
                p.el.classList.add('wrong');
                const good = wave.plats.find(q => q.correct);
                if (good) { good.el.classList.remove('disabled'); good.el.classList.add('reveal'); }
                setBanner(op.a + ' × ' + op.b + ' = ' + op.correct, 'ko');
                hurtRunner();
                updateHUD();
                checkGameOver();
            }
        }

        function onMiss() {
            wave.answered = true;
            const op = wave.op;
            wave.plats.forEach(q => q.el.classList.add(q.correct ? 'reveal' : 'disabled'));
            setBanner(op.a + ' × ' + op.b + ' = ' + op.correct, 'ko');
            lives--;
            hurtRunner();
            updateHUD();
            checkGameOver();
        }

        function spawnCoins(p) {
            const x = p.x + G.platW / 2;
            const y = G.groundH + G.P; // distance depuis le bas de la scène
            for (let i = 0; i < 7; i++) {
                const c = document.createElement('div');
                c.className = 'jtma-coin';
                c.style.left = x + 'px';
                c.style.bottom = y + 'px';
                const ang = -Math.PI / 2 + (i - 3) * 0.32;
                const dist = G.charH * (0.7 + Math.random() * 0.5);
                c.style.setProperty('--dx', Math.round(Math.cos(ang) * dist) + 'px');
                c.style.setProperty('--dy', Math.round(Math.sin(ang) * dist) + 'px');
                stage.appendChild(c);
                setTimeout(() => c.remove(), 750);
            }
            const plus = document.createElement('div');
            plus.className = 'jtma-plus';
            plus.textContent = '+1';
            plus.style.left = x + 'px';
            plus.style.bottom = (y + G.charH) + 'px';
            stage.appendChild(plus);
            setTimeout(() => plus.remove(), 850);
        }

        function checkGameOver() {
            if (lives <= 0) { lives = 0; updateHUD(); endGame(); }
        }

        function render() {
            runnerEl.style.left   = (G.cx - G.charW / 2) + 'px';
            runnerEl.style.bottom = (G.groundH + runner.h) + 'px';
            const inAir = !runner.grounded && !runner.onPlat;
            runnerEl.classList.toggle('air', inAir);
            runnerEl.classList.toggle('idle', !running || paused);
            const platBottom = G.groundH + G.P - G.thick;
            plats.forEach(p => {
                p.el.style.left   = p.x + 'px';
                p.el.style.bottom = platBottom + 'px';
            });
            cloudsEl.style.backgroundPositionX = (-bgOffset * 0.12) + 'px';
            hillsEl.style.backgroundPositionX  = (-bgOffset * 0.35) + 'px';
            groundEl.style.backgroundPositionX = (-bgOffset) + 'px';
        }

        function clearPlats() {
            plats.forEach(p => p.el.remove());
            plats = [];
            wave = null;
            runner.h = 0; runner.vy = 0; runner.grounded = true; runner.onPlat = null;
        }

        function showOverlay(title, sub, btnLabel) {
            overlayTitle.textContent = title;
            overlaySub.textContent = sub;
            startBtn.textContent = btnLabel;
            overlay.classList.remove('hidden');
        }
        function hideOverlay() { overlay.classList.add('hidden'); }

        function startGame() {
            if (running && !paused) return;
            if (!running) {
                score = 0; lives = MAX_LIVES; clearPlats();
                elapsedMs = 0; lastShownSeconds = -1;
                applySpeedSelection();
                updateHUD(); updateTimerDisplay(true);
                setBanner('Prêt ?', '');
            }
            running = true; paused = false;
            hideOverlay();
            if (paramsPanel.classList.contains('show')) {
                paramsPanel.classList.remove('show');
                paramsBtn.classList.remove('active');
            }
            pauseBtn.textContent = '⏸ Pause';
            lastTime = null;
            window._jtmaActive = widget;
            requestAnimationFrame(computeGeom);
            if (!rafId) rafId = requestAnimationFrame(gameLoop);
        }

        function pauseGame() {
            if (!running || paused) return;
            paused = true;
            pauseBtn.textContent = '▶ Reprendre';
            showOverlay('⏸ En pause', 'Clique sur Reprendre pour continuer la course.', '▶ Reprendre');
            render();
        }
        function togglePause() {
            if (!running) { startGame(); return; }
            if (paused) startGame(); else pauseGame();
        }

        function stopGame() {
            running = false; paused = true; destroyed = true;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            clearPlats();
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('pointerdown', onDocPointerDown);
            if (ro) { ro.disconnect(); ro = null; }
            if (window._jtmaActive === widget) window._jtmaActive = null;
        }

        function endGame() {
            running = false; paused = true;
            render();
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Record : ' + best + '. Clique sur Rejouer pour une nouvelle course.', '▶ Rejouer');
            persist(); // mémorise le record
        }

        function resetGame() {
            clearPlats();
            applySpeedSelection();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            lastTime = null; elapsedMs = 0; lastShownSeconds = -1;
            updateHUD(); updateTimerDisplay(true);
            setBanner('Prêt ?', '');
            computeGeom();
            showOverlay('🦊 Multi-Run', 'Saute au bon moment pour atterrir sur la plateforme qui porte le bon résultat !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            let dtMs = now - lastTime;
            lastTime = now;
            if (dtMs > 60) dtMs = 60; // évite les sauts après un onglet en arrière-plan

            if (running && !paused) {
                const dt = dtMs / 1000;
                elapsedMs += dtMs;
                updateTimerDisplay(false);

                const v = currentSpeed();
                bgOffset += v * dt;
                plats.forEach(p => { p.x -= v * dt; });

                updateRunner(dt);

                if (running && wave && !wave.answered) {
                    const last = wave.plats[wave.plats.length - 1];
                    if (last.x + G.platW < G.cx - G.charW * 0.3) onMiss();
                }

                if (running && wave && wave.answered) wave.resolvedMs += dtMs;
                if (running && lives > 0) {
                    const last = wave ? wave.plats[wave.plats.length - 1] : null;
                    if (!wave || (wave.answered && wave.resolvedMs >= 500 && last.x + G.platW < G.cx)) spawnWave();
                }

                plats = plats.filter(p => {
                    if (p.x + G.platW < -30 && p !== runner.onPlat) { p.el.remove(); return false; }
                    return true;
                });

                render();
            }
            rafId = requestAnimationFrame(gameLoop);
        }

        // ── Commandes de saut ────────────────────────────────────────────
        stage.addEventListener('pointerdown', (e) => {
            if (!overlay.classList.contains('hidden') && overlay.contains(e.target)) return;
            e.stopPropagation();
            e.preventDefault();
            window._jtmaActive = widget;
            jump();
        });
        jumpBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            window._jtmaActive = widget;
            jump();
        });
        container.addEventListener('pointerdown', () => { window._jtmaActive = widget; });

        function isActiveWidget() {
            if (!document.body.contains(widget)) return false;
            if (widget.querySelector('.wf-mini-bar')) return false;
            if (container.classList.contains('wf-fullboard')) return true;
            if (container.matches(':hover')) return true;
            return window._jtmaActive === widget;
        }
        function onKey(e) {
            if (destroyed) return;
            const isJumpKey = e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp';
            if (!isJumpKey) return;
            const t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
            if (!running || paused || !isActiveWidget()) return;
            e.preventDefault();
            e.stopPropagation();
            if (!e.repeat) jump();
        }
        document.addEventListener('keydown', onKey, true);

        makeTap(startBtn, () => startGame());
        makeTap(pauseBtn, () => togglePause());
        makeTap(resetBtn, () => resetGame());

        // ── Sauvegarde : données exposées à save-load.js ─────────────────
        widget._jtmaGetData = function () {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wStr = _isMax ? _savedW : container.style.width;
            const hStr = _isMax ? _savedH : container.style.height;
            const wPx = parseFloat(wStr) || (_isMax ? 1000 : container.offsetWidth);
            const hPx = parseFloat(hStr) || (_isMax ? 800  : container.offsetHeight);
            return {
                tables:    Array.from(activeTables).sort((a, b) => a - b),
                speed:     speedSelect.value,
                wPct:      (wPx / curW)  * 100,
                hPct:      (hPx / curVH) * 100,
                fullboard: _isMax,
                best:      best
            };
        };

        function applyRestoredSettings(d) {
            if (Array.isArray(d.tables)) {
                const t = d.tables.map(Number).filter(n => n >= 2 && n <= 9);
                activeTables = new Set(t);
                syncTableLabels();
            }
            if (d.speed && speedSelect.querySelector('option[value="' + d.speed + '"]')) speedSelect.value = d.speed;
            if (typeof d.best === 'number' && d.best > 0) best = d.best;
            applySpeedSelection();
        }

        // ── Init ─────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const isMobile = typeof isMobileBoardMode === 'function' && isMobileBoardMode();

            if (restoreData) applyRestoredSettings(restoreData);

            if (!restoreData && !isMobile) {
                // Nouveau widget sur PC : ouverture à 100px du bord gauche
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }

            if (restoreData && !isMobile) {
                container.style.width  = (restoreData.wPct > 0 ? (restoreData.wPct / 100) * curW  : 1000) + 'px';
                container.style.height = (restoreData.hPct > 0 ? (restoreData.hPct / 100) * curVH : 800)  + 'px';
            } else if (isMobile) {
                const wPct = restoreData ? restoreData.wPct : parseFloat(widget.dataset.widthPercent);
                const hPct = restoreData ? restoreData.hPct : parseFloat(widget.dataset.contentHPercent);
                if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
                if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
                if (!container.style.height) container.style.height = '520px';
            } else {
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile || (restoreData && restoreData.fullboard)) {
                if (isMobile) container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            }

            updateHUD();
            if (!restoreData) {
                paramsPanel.classList.add('show');
                paramsBtn.classList.add('active');
            }
            applyFontScale();
            resetGame();
            rafId = requestAnimationFrame(gameLoop);
        }));

        // ── Nettoyage si le widget est retiré du DOM ─────────────────────
        const _observer = new MutationObserver(() => {
            if (!document.body.contains(widget)) {
                stopGame();
                _observer.disconnect();
            }
        });
        _observer.observe(document.body, { childList: true, subtree: true });
    };

    // =========================================================================
    // HOOK dans createWidget
    // (save-load.js pose window._jtmaNextPendingData avant l'appel pour la restauration)
    // =========================================================================
    function hook(orig) {
        return function (type) {
            var widget = orig.apply(this, arguments);
            if (type === 'jeu-multi-run' && widget) {
                initJeuMultiRunWidget(widget, window._jtmaNextPendingData || null);
            }
            return widget;
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
