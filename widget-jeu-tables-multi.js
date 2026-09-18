// =========================================================================
// WIDGET JEU DES TABLES DE MULTIPLICATION — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-tables-multi'.
// Design repris de widget-nature-gramm.js (redimensionnement libre,
// barre d'édition avec aide, réduire, plein écran board, fermer).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-tables-multi.js"></script>
//
//   2. Ajouter une carte dans le panneau Activités (rubrique mathématiques) :
//      <div class="act-card" onclick="createWidget('jeu-tables-multi');toggleActivitiesPanel()">
//          ...
//      </div>
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
    if (!document.getElementById('widget-jeu-tables-multi-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tables-multi-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-tables-multi"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jtm-container {
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
            min-width: 380px;
            min-height: 320px;
        }

        /* ── État plein écran ── */
        .jtm-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── État plein écran, adapté au téléphone ──
           Le padding-left de 52px (pensé pour dégager les onglets
           latéraux desktop) prend trop de place sur un petit écran, mais
           il en faut quand même un peu : les onglets latéraux (Jeux,
           Activités, etc. — voir style-phone.css) débordent d'environ
           33px sur le bord gauche de l'écran même en fullboard, il ne
           faut donc pas descendre en dessous pour ne pas les recouvrir. */
        .jtm-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jtm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jtm-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jtm-params-btn, .jtm-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .jtm-params-btn:hover, .jtm-help-btn:hover { background: #e0e0e0; color: #333; }
        .jtm-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .jtm-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jtm-help-popup.show { display: block; }
        .jtm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jtm-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jtm-params-panel.show { display: flex; }
        .jtm-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .jtm-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .jtm-table-check {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid transparent;
            background: #e0f0ff; color: #1565c0;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: all .15s;
            user-select: none;
        }
        .jtm-table-check input[type=checkbox] { display: none; }
        .jtm-table-check.checked { border-color: currentColor; }
        .jtm-table-check:not(.checked) { opacity: 0.4; }
        .jtm-table-check:hover { opacity: 1; }

        .jtm-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .jtm-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jtm-speed-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white;
        }
        .jtm-speed-select:focus { border-color: #4a90e2; }

        /* ── HUD (score / vies) ── */
        .jtm-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jtm-score { color: #2e7d32; }
        .jtm-timer { color: #374151; font-variant-numeric: tabular-nums; }
        .jtm-lives { letter-spacing: 2px; font-size: 15px; }

        /* ── Ciel de jeu ── */
        .jtm-sky {
            flex: 1;
            min-height: 120px;
            position: relative;
            border-radius: 12px;
            background: linear-gradient(180deg, #6fc3e8 0%, #bfe9f6 55%, #eaf9f0 85%, #d7f3d0 100%);
            border: 1.5px solid #b7dcf5;
            overflow: hidden;
        }
        .jtm-ground {
            position: absolute;
            left: 0; right: 0; bottom: 0;
            height: 10px;
            background: repeating-linear-gradient(90deg, #7cc576 0 14px, #6bb865 14px 28px);
            border-top: 2px solid #4f9c4a;
        }

        /* ── Nuages décoratifs dans le ciel ── */
        .jtm-clouds {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        }
        .jtm-cloud {
            position: absolute;
            background: rgba(255,255,255,0.92);
            border-radius: 30px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.06);
            animation: jtm-cloud-bob 7s ease-in-out infinite;
        }
        .jtm-cloud::before, .jtm-cloud::after {
            content: '';
            position: absolute;
            background: inherit;
            border-radius: 50%;
        }
        .jtm-cloud-sm { width: 46px; height: 16px; }
        .jtm-cloud-sm::before { width: 22px; height: 22px; top: -11px; left: 4px; }
        .jtm-cloud-sm::after  { width: 18px; height: 16px; top: -7px;  left: 24px; }

        .jtm-cloud-md { width: 66px; height: 22px; }
        .jtm-cloud-md::before { width: 32px; height: 32px; top: -15px; left: 6px; }
        .jtm-cloud-md::after  { width: 26px; height: 22px; top: -9px;  left: 36px; }

        .jtm-cloud-lg { width: 88px; height: 28px; }
        .jtm-cloud-lg::before { width: 42px; height: 42px; top: -19px; left: 8px; }
        .jtm-cloud-lg::after  { width: 34px; height: 28px; top: -11px; left: 48px; }

        @keyframes jtm-cloud-bob {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(6px); }
        }

        /* ── Boule qui tombe, en forme de ballon de baudruche (couleur propre à son couloir) ── */
        .jtm-ball {
            position: absolute;
            top: -110px;
            width: var(--jtm-ball-w, 110px);
            height: var(--jtm-ball-h, 126px);
            /* galbe ovoïde façon ballon de baudruche : haut bien rond, base légèrement resserrée */
            border-radius: 50% 50% 48% 48% / 58% 58% 42% 42%;
            background: radial-gradient(circle at 32% 26%, var(--jtm-ball-from, #90cdf4), var(--jtm-ball-mid, #3182ce) 68%, var(--jtm-ball-to, #2c5282));
            border: 3px solid var(--jtm-ball-border, #2b6cb0);
            box-shadow: 0 6px 12px rgba(0,0,0,0.22), inset -8px -10px 16px rgba(0,0,0,0.16), inset 6px 8px 10px rgba(255,255,255,0.25);
            color: white;
            font-weight: 800;
            font-size: var(--jtm-fs, 20px);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-sizing: border-box;
            transform: translateX(-50%) rotate(-3deg);
            animation: jtm-sway 2.6s ease-in-out infinite;
            will-change: top;
        }
        /* Reflet brillant façon latex gonflé */
        .jtm-ball::before {
            content: '';
            position: absolute;
            top: 16%;
            left: 20%;
            width: 26%;
            height: 16%;
            background: rgba(255,255,255,0.55);
            border-radius: 50%;
            filter: blur(1px);
            transform: rotate(-25deg);
            pointer-events: none;
        }
        /* Petit noeud du ballon */
        .jtm-ball::after {
            content: '';
            position: absolute;
            bottom: -9px;
            left: 50%;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 10px solid var(--jtm-ball-border, #2b6cb0);
            transform: translateX(-50%);
            filter: brightness(0.85);
            pointer-events: none;
        }
        .jtm-ball.correct {
            border-color: #1e5e2e;
            animation: jtm-burst .3s cubic-bezier(.4,0,.6,1) forwards;
            pointer-events: none;
        }
        .jtm-ball.wrong {
            background: radial-gradient(circle at 32% 26%, #feb2b2, #c53030 68%, #822727);
            border-color: #822727;
            animation: jtm-shake .35s ease;
        }
        .jtm-ball.missed {
            background: radial-gradient(circle at 32% 26%, #d1d5db, #6b7280 68%, #374151);
            border-color: #4b5563;
        }
        @keyframes jtm-sway {
            0%, 100% { transform: translateX(-50%) rotate(-3deg); }
            50%      { transform: translateX(-50%) rotate(3deg); }
        }

        /* ── Effet d'éclatement du ballon (bonne réponse) ── */
        @keyframes jtm-burst {
            0%   { transform: translateX(-50%) scale(1);    opacity: 1; }
            35%  { transform: translateX(-50%) scale(1.3);  opacity: 1; }
            60%  { transform: translateX(-50%) scale(1.45); opacity: 0.7; }
            100% { transform: translateX(-50%) scale(0.15); opacity: 0; }
        }
        /* Flash / onde de choc au moment de l'éclatement */
        .jtm-burst-ring {
            position: absolute;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.9);
            background: radial-gradient(circle, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 70%);
            transform: translate(-50%, -50%) scale(0.3);
            pointer-events: none;
            z-index: 6;
            animation: jtm-ring-expand .4s ease-out forwards;
        }
        @keyframes jtm-ring-expand {
            0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0.9; }
            100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
        /* Petits éclats de baudruche qui s'envolent */
        .jtm-burst-shard {
            position: absolute;
            width: 9px;
            height: 13px;
            border-radius: 3px 3px 8px 8px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 6;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            animation: jtm-shard-fly .5s ease-out forwards;
        }
        @keyframes jtm-shard-fly {
            0%   { transform: translate(-50%, -50%) rotate(0deg) scale(1); opacity: 1; }
            100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)) scale(0.4); opacity: 0; }
        }

        /* ── Groupe des 3 réponses, fixé au niveau du sol (même couleur que la boule) ── */
        .jtm-answer-group {
            position: absolute;
            bottom: 18px;
            display: flex;
            gap: 8px;
            justify-content: center;
            flex-wrap: nowrap;
            transform: translateX(-50%);
            z-index: 4;
        }
        .jtm-choice-btn {
            padding: 10px 14px;
            min-width: var(--jtm-btn-min-w, 52px);
            min-height: 42px;
            border-radius: 12px;
            background: var(--jtm-accent-bg, white);
            border: 2.5px solid var(--jtm-accent-border, #d1d5db);
            color: var(--jtm-accent-text, #374151);
            font-weight: 800;
            font-size: var(--jtm-fs-choice, 16px);
            cursor: pointer;
            box-shadow: 0 3px 7px rgba(0,0,0,0.18);
            transition: transform .1s, background .15s;
            touch-action: manipulation;
        }
        .jtm-choice-btn:hover { filter: brightness(0.96); }
        .jtm-choice-btn:active { transform: scale(0.93); }
        .jtm-choice-btn:disabled { pointer-events: none; opacity: 0.6; }
        .jtm-choice-btn.chosen-correct { background: #dcfce7 !important; border-color: #2f8f48 !important; color: #166534 !important; }
        .jtm-choice-btn.chosen-wrong   { background: #fee2e2 !important; border-color: #c53030 !important; color: #822727 !important; }

        @keyframes jtm-shake {
            0%,100% { transform: translateX(-50%); }
            25%     { transform: translateX(calc(-50% - 6px)); }
            75%     { transform: translateX(calc(-50% + 6px)); }
        }

        /* ── Overlay démarrage / fin de partie ── */
        .jtm-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.85);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 10px;
        }
        .jtm-overlay.hidden { display: none; }
        .jtm-overlay-title {
            font-size: 18px; font-weight: 800; color: #374151;
        }
        .jtm-overlay-sub {
            font-size: 13px; color: #6b7280;
        }
        .jtm-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #4a90e2; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
        }
        .jtm-start-btn:hover { background: #357abd; }
        .jtm-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jtm-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jtm-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jtm-btn:active { transform: scale(0.96); }
        .jtm-btn-reset { background: #6b7280; color: white; }
        .jtm-btn-reset:hover { background: #4b5563; }
        .jtm-btn-pause { background: #4a90e2; color: white; }
        .jtm-btn-pause:hover { background: #357abd; }

        /* ── Poignée resize ── */
        .jtm-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jtm-container:hover .jtm-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-tables-multi';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jtm-container">

  <!-- En-tête -->
  <div class="jtm-header">
    <span class="jtm-title">🎯 Tables de multiplication</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jtm-params-btn" title="Paramètres">⚙</button>
      <button class="jtm-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jtm-params-panel">
    <div class="jtm-params-title">Tables à réviser :</div>
    <div class="jtm-params-grid"></div>
    <div class="jtm-params-row">
      <label>Vitesse de chute :</label>
      <select class="jtm-speed-select">
        <option value="9000">🐢 Facile</option>
        <option value="6500" selected>🚶 Moyen</option>
        <option value="4200">🚀 Rapide</option>
        <option value="2200">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <!-- HUD -->
  <div class="jtm-hud">
    <span class="jtm-score">⭐ Score : 0</span>
    <span class="jtm-timer">⏱️ 00:00</span>
    <span class="jtm-lives">❤️❤️❤️</span>
  </div>

  <!-- Ciel de jeu -->
  <div class="jtm-sky">
    <div class="jtm-clouds">
      <div class="jtm-cloud jtm-cloud-md" style="top:6%; left:8%; animation-delay:-1s;"></div>
      <div class="jtm-cloud jtm-cloud-sm" style="top:14%; left:62%; animation-delay:-3.5s;"></div>
      <div class="jtm-cloud jtm-cloud-lg" style="top:4%; left:36%; animation-delay:-5s;"></div>
      <div class="jtm-cloud jtm-cloud-sm" style="top:22%; left:84%; animation-delay:-2s;"></div>
    </div>
    <div class="jtm-ground"></div>
    <div class="jtm-overlay">
      <div class="jtm-overlay-title">🎯 Tables de multiplication</div>
      <div class="jtm-overlay-sub">Clique sur le bon résultat avant que la boule touche le sol !</div>
      <button class="jtm-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jtm-controls">
    <button class="jtm-btn jtm-btn-reset">🔄 Réinitialiser</button>
    <button class="jtm-btn jtm-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jtm-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9 ; les tables du 0 et du 1 ne sont pas proposées) que tu veux voir apparaître dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse de chute</b> — Choisis la vitesse à laquelle les boules tombent : Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> (la vitesse augmente automatiquement toutes les 10 bonnes réponses, et peut finir par dépasser même le mode Extrême).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Des boules tombent du ciel avec une opération (ex. 7 × 8). Les 3 résultats proposés apparaissent tout de suite au niveau du sol, de la même couleur que la boule à laquelle ils correspondent. Clique sur le bon résultat avant que la boule n'atteigne ses réponses.</p>
    <p style="margin:0 0 6px">Une bonne réponse rapporte un point. Une mauvaise réponse ou une boule non traitée fait perdre une vie ❤️. Un chrono ⏱️ affiche le temps écoulé depuis le début de la partie.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Clique sur <b>🔄 Réinitialiser</b> pour rejouer.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jtm-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuTablesMultiWidget = function (widget) {

        const container     = widget.querySelector('.jtm-container');
        const paramsBtn      = widget.querySelector('.jtm-params-btn');
        const paramsPanel    = widget.querySelector('.jtm-params-panel');
        const paramsGrid     = widget.querySelector('.jtm-params-grid');
        const speedSelect    = widget.querySelector('.jtm-speed-select');
        const helpBtn        = widget.querySelector('.jtm-help-btn');
        const helpPopup      = widget.querySelector('.jtm-help-popup');
        const resizeHandle   = widget.querySelector('.jtm-resize-handle');
        const scoreEl        = widget.querySelector('.jtm-score');
        const timerEl         = widget.querySelector('.jtm-timer');
        const livesEl         = widget.querySelector('.jtm-lives');
        const sky             = widget.querySelector('.jtm-sky');
        const overlay         = widget.querySelector('.jtm-overlay');
        const overlayTitle    = widget.querySelector('.jtm-overlay-title');
        const overlaySub      = widget.querySelector('.jtm-overlay-sub');
        const startBtn        = widget.querySelector('.jtm-start-btn');
        const resetBtn        = widget.querySelector('.jtm-btn-reset');
        const pauseBtn         = widget.querySelector('.jtm-btn-pause');

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        let activeTables   = new Set([2,3,4,5,6,7,8,9]); // tables du 0 et du 1 exclues (trop triviales)
        let fallDuration   = 6500; // ms (vitesse effective courante)
        let score          = 0;
        let lives          = MAX_LIVES;
        let running        = false; // partie démarrée (avant game over)
        let paused         = true;  // en pause (y compris avant le premier départ)
        let balls          = [];    // { el, groupEl, laneIdx, progress, duration, finalTop, answered }
        let spawnAccum     = 0;
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;
        let ballDiameterPx = 110;  // tenu à jour par applyFontScale() (largeur du ballon)
        const BALL_HEIGHT_RATIO = 1.15; // galbe ovoïde du ballon (hauteur = largeur * ratio)

        // ── Mode de vitesse progressive : accélère toutes les 10 bonnes réponses ──
        const PROGRESSIVE_START_DURATION = 7500;  // ms, vitesse de départ (≈ Facile)
        const PROGRESSIVE_MIN_DURATION   = 900;   // ms, plancher (bien plus rapide que Difficile)
        const PROGRESSIVE_DECAY          = 0.75;  // facteur multiplicatif appliqué tous les 10 points (-25% à chaque palier)
        let isProgressiveMode = false;
        let lastProgressiveMilestone = 0; // dernier palier de 10 points déjà appliqué

        // ── Chrono de la partie ───────────────────────────────────────────
        let elapsedMs = 0;
        let lastShownSeconds = -1;

        // ── Couloirs de chute : chaque boule occupe un couloir dédié pour
        //    que les groupes de réponses (fixés au sol) ne se chevauchent jamais ──
        let numLanes            = 3;
        let laneWidthPx         = 200;
        let laneOccupied        = [];
        let pendingLaneRecompute = false;
        const LANE_MIN_WIDTH = 165; // largeur mini pour accueillir 3 réponses sans chevauchement

        // Une couleur par couloir : la boule et ses 3 réponses partagent la même teinte
        const BALL_COLORS = [
            { from: '#90cdf4', mid: '#3182ce', to: '#2c5282', border: '#2b6cb0', accentBg: '#e6f3ff', accentBorder: '#3182ce', accentText: '#1a4971' }, // bleu
            { from: '#feb2b2', mid: '#e53e3e', to: '#822727', border: '#c53030', accentBg: '#fff0f0', accentBorder: '#e53e3e', accentText: '#822727' }, // rouge
            { from: '#9ae6a0', mid: '#38a169', to: '#1e5e2e', border: '#2f855a', accentBg: '#eefcf0', accentBorder: '#38a169', accentText: '#1e5e2e' }, // vert
            { from: '#fbd38d', mid: '#dd6b20', to: '#7b341e', border: '#c05621', accentBg: '#fff7ec', accentBorder: '#dd6b20', accentText: '#7b341e' }, // orange
            { from: '#d6bcfa', mid: '#805ad5', to: '#44337a', border: '#6b46c1', accentBg: '#f6f0ff', accentBorder: '#805ad5', accentText: '#44337a' }, // violet
            { from: '#81e6d9', mid: '#319795', to: '#1d4044', border: '#2c7a7b', accentBg: '#effcfb', accentBorder: '#319795', accentText: '#1d4044' }, // turquoise
        ];

        function computeLanes() {
            const skyW = sky.clientWidth || 400;
            let n = Math.floor(skyW / LANE_MIN_WIDTH);
            n = Math.max(2, Math.min(BALL_COLORS.length, n));
            numLanes = n;
            laneWidthPx = skyW / numLanes;
            laneOccupied = new Array(numLanes).fill(false);
        }

        // Ne recalcule les couloirs que si aucune boule n'est active (sinon on
        // décale les couloirs en cours de partie) ; sinon on reporte le calcul.
        function maybeRecomputeLanes() {
            if (balls.length === 0) computeLanes();
            else pendingLaneRecompute = true;
        }

        function laneCenterX(idx) { return laneWidthPx * (idx + 0.5); }

        function pickFreeLane() {
            const free = [];
            for (let i = 0; i < numLanes; i++) if (!laneOccupied[i]) free.push(i);
            if (free.length === 0) return -1;
            return free[randInt(0, free.length - 1)];
        }

        // ── Helper tap stylet (pointer-safe) ────────────────────────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    const dx = eu.clientX - sx, dy = eu.clientY - sy;
                    if (Math.sqrt(dx*dx + dy*dy) < 12) {
                        eu.stopPropagation();
                        handler(eu);
                    }
                }
                el.addEventListener('pointerup',     onUp);
                el.addEventListener('pointercancel', onUp);
            });
        }

        // ── Construction des cases à cocher des tables (0 et 1 exclues, trop triviales) ──
        for (let n = 2; n <= 9; n++) {
            const label = document.createElement('label');
            label.className = 'jtm-table-check checked';
            label.dataset.table = n;
            label.innerHTML = `<input type="checkbox" value="${n}" checked> ×${n}`;
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                const cb = label.querySelector('input[type=checkbox]');
                cb.checked = !cb.checked;
                if (cb.checked) { activeTables.add(n); label.classList.add('checked'); }
                else { activeTables.delete(n); label.classList.remove('checked'); }
            });
            paramsGrid.appendChild(label);
        }

        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        speedSelect.addEventListener('change', () => {
            applySpeedSelection();
        });

        function applySpeedSelection() {
            if (speedSelect.value === 'progressive') {
                isProgressiveMode = true;
                fallDuration = PROGRESSIVE_START_DURATION;
                lastProgressiveMilestone = 0;
            } else {
                isProgressiveMode = false;
                fallDuration = parseInt(speedSelect.value, 10) || 6500;
            }
        }

        // Vérifie si un nouveau palier de 10 bonnes réponses est atteint et,
        // si oui, augmente la vitesse (réduit la durée de chute), sans jamais
        // descendre sous le plancher défini.
        function maybeAdvanceProgressiveSpeed() {
            if (!isProgressiveMode) return;
            const milestone = Math.floor(score / 10);
            if (milestone > lastProgressiveMilestone) {
                lastProgressiveMilestone = milestone;
                fallDuration = Math.max(PROGRESSIVE_MIN_DURATION, Math.round(PROGRESSIVE_START_DURATION * Math.pow(PROGRESSIVE_DECAY, milestone)));
            }
        }

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // ── Taille de police adaptative ───────────────────────────────────
        function applyFontScale() {
            const w  = container.offsetWidth || 700;
            const fs = Math.max(14, Math.min(26, Math.round(18 * w / 700)));
            const fsc = Math.max(16, Math.min(24, Math.round(18 * w / 700)));
            const bw  = Math.max(80, Math.min(160, Math.round(110 * w / 700)));
            const btnMinW = Math.max(52, Math.min(76, Math.round(58 * w / 700)));
            ballDiameterPx = bw;
            const bh = Math.round(bw * BALL_HEIGHT_RATIO);
            container.style.setProperty('--jtm-fs', fs + 'px');
            container.style.setProperty('--jtm-fs-choice', fsc + 'px');
            container.style.setProperty('--jtm-ball-w', bw + 'px');
            container.style.setProperty('--jtm-ball-h', bh + 'px');
            container.style.setProperty('--jtm-btn-min-w', btnMinW + 'px');
            maybeRecomputeLanes();
        }

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        if (wfMin) {
            makeTap(wfMin, () => {
                pauseGame();
                if (_isMax) {
                    _isMax = false;
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                    applyFontScale();
                }
                window._wfMiniBarCollapse(widget, '🎯 Tables de multiplication', {
                    onExpand: applyFontScale
                });
            });
        }
        if (wfMax) {
            makeTap(wfMax, () => {
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    if (typeof isMobileBoardMode === 'function' && isMobileBoardMode()) {
                        container.classList.add('jti-mobile');
                    }
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                applyFontScale();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                stopGame();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

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
                container.style.width  = Math.max(380, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(320, startH + ev.clientY - startY) + 'px';
                applyFontScale();
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup',   onEnd);
                saveDimsToDataset();
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup',   onEnd);
        });

        // =====================================================================
        // LOGIQUE DU JEU
        // =====================================================================

        function formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
            const ss = (totalSec % 60).toString().padStart(2, '0');
            return mm + ':' + ss;
        }

        function updateHUD() {
            scoreEl.textContent = '⭐ Score : ' + score;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, MAX_LIVES - lives));
        }

        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function generateOperation() {
            const tables = activeTables.size > 0 ? Array.from(activeTables) : [2,3,4,5,6,7,8,9];
            const a = tables[randInt(0, tables.length - 1)];
            const b = randInt(0, 9);
            const correct = a * b;

            // Génère 2 réponses fausses plausibles et distinctes
            const wrongSet = new Set();
            let guardCount = 0;
            while (wrongSet.size < 2 && guardCount < 30) {
                guardCount++;
                let candidate;
                const mode = randInt(0, 2);
                if (mode === 0) candidate = correct + randInt(1, 6) * (Math.random() < 0.5 ? -1 : 1);
                else if (mode === 1) candidate = a * (b + (Math.random() < 0.5 ? -1 : 1));
                else candidate = (a + (Math.random() < 0.5 ? -1 : 1)) * b;
                if (candidate === correct || candidate < 0) continue;
                wrongSet.add(candidate);
            }
            // Filet de sécurité si jamais on n'a pas trouvé 2 valeurs distinctes
            let fallback = correct + 1;
            while (wrongSet.size < 2) {
                if (fallback !== correct) wrongSet.add(fallback);
                fallback++;
            }
            const choices = [correct, ...Array.from(wrongSet)];
            // Mélange (Fisher-Yates)
            for (let i = choices.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }
            return { a, b, correct, choices };
        }

        function spawnBall() {
            const laneIdx = pickFreeLane();
            if (laneIdx === -1) return; // plus de couloir libre : on retentera au prochain tick
            laneOccupied[laneIdx] = true;

            const color = BALL_COLORS[laneIdx % BALL_COLORS.length];
            const { a, b, correct, choices } = generateOperation();
            const cx = laneCenterX(laneIdx);

            // ── Boule (tombe) ──
            const el = document.createElement('div');
            el.className = 'jtm-ball';
            el.textContent = a + ' × ' + b;
            el.style.left = cx + 'px';
            el.style.top = (-Math.round(ballDiameterPx * BALL_HEIGHT_RATIO) - 10) + 'px';
            el.style.setProperty('--jtm-ball-from', color.from);
            el.style.setProperty('--jtm-ball-mid', color.mid);
            el.style.setProperty('--jtm-ball-to', color.to);
            el.style.setProperty('--jtm-ball-border', color.border);

            // ── Groupe de réponses (fixe, au niveau du sol, même couleur) ──
            const groupEl = document.createElement('div');
            groupEl.className = 'jtm-answer-group';
            groupEl.style.left = cx + 'px';
            groupEl.style.setProperty('--jtm-accent-bg', color.accentBg);
            groupEl.style.setProperty('--jtm-accent-border', color.accentBorder);
            groupEl.style.setProperty('--jtm-accent-text', color.accentText);

            const ballObj = { el, groupEl, laneIdx, progress: 0, duration: fallDuration, finalTop: 0, answered: false, color };

            choices.forEach(val => {
                const btn = document.createElement('button');
                btn.className = 'jtm-choice-btn';
                btn.textContent = val;
                btn.dataset.correct = (val === correct) ? 'true' : 'false';
                makeTap(btn, () => onChoice(ballObj, btn));
                groupEl.appendChild(btn);
            });

            sky.appendChild(groupEl);
            sky.appendChild(el);
            balls.push(ballObj);

            // La boule s'arrête juste au-dessus du groupe de réponses (mesuré après ajout au DOM)
            const skyH = sky.clientHeight || 300;
            const groupH = groupEl.offsetHeight || 56;
            const gapBallToAnswers = 22; // espace pour laisser voir le petit noeud du ballon
            const ballHeightPx = Math.round(ballDiameterPx * BALL_HEIGHT_RATIO);
            ballObj.finalTop = skyH - groupH - gapBallToAnswers - ballHeightPx;
        }

        // ── Effet d'éclatement du ballon (flash + éclats de baudruche) ──────
        function spawnBurstEffect(ballObj) {
            const skyRect  = sky.getBoundingClientRect();
            const ballRect = ballObj.el.getBoundingClientRect();
            const cx = ballRect.left + ballRect.width  / 2 - skyRect.left;
            const cy = ballRect.top  + ballRect.height / 2 - skyRect.top;
            const c  = ballObj.color || {};
            const shardColor = c.mid || '#3182ce';

            // Onde de choc / flash
            const ring = document.createElement('div');
            ring.className = 'jtm-burst-ring';
            const ringSize = Math.round(ballDiameterPx * 1.3);
            ring.style.left = cx + 'px';
            ring.style.top = cy + 'px';
            ring.style.width = ringSize + 'px';
            ring.style.height = ringSize + 'px';
            sky.appendChild(ring);
            setTimeout(() => ring.remove(), 420);

            // Petits éclats de latex qui s'envolent dans toutes les directions
            const shardCount = 9;
            for (let i = 0; i < shardCount; i++) {
                const shard = document.createElement('div');
                shard.className = 'jtm-burst-shard';
                const angle = (Math.PI * 2 * i / shardCount) + (Math.random() * 0.5 - 0.25);
                const dist  = ballDiameterPx * (0.35 + Math.random() * 0.35);
                const dx = Math.round(Math.cos(angle) * dist);
                const dy = Math.round(Math.sin(angle) * dist);
                shard.style.left = cx + 'px';
                shard.style.top = cy + 'px';
                shard.style.setProperty('--dx', dx + 'px');
                shard.style.setProperty('--dy', dy + 'px');
                shard.style.setProperty('--rot', Math.round(Math.random() * 360) + 'deg');
                shard.style.background = shardColor;
                sky.appendChild(shard);
                setTimeout(() => shard.remove(), 520);
            }
        }

        function onChoice(ballObj, btn) {
            if (ballObj.answered || !running || paused) return;
            ballObj.answered = true;
            const isCorrect = btn.dataset.correct === 'true';
            ballObj.groupEl.querySelectorAll('.jtm-choice-btn').forEach(b => b.disabled = true);
            btn.classList.add(isCorrect ? 'chosen-correct' : 'chosen-wrong');

            if (isCorrect) {
                score++;
                ballObj.el.classList.add('correct');
                spawnBurstEffect(ballObj);
                maybeAdvanceProgressiveSpeed();
            } else {
                lives--;
                ballObj.el.classList.add('wrong');
            }
            updateHUD();
            removeBallSoon(ballObj);
            if (!isCorrect) checkGameOver();
        }

        function onBallMissed(ballObj) {
            ballObj.answered = true;
            ballObj.el.classList.add('missed');
            ballObj.groupEl.querySelectorAll('.jtm-choice-btn').forEach(b => b.disabled = true);
            lives--;
            updateHUD();
            removeBallSoon(ballObj);
            checkGameOver();
        }

        function removeBallSoon(ballObj) {
            setTimeout(() => {
                if (ballObj.el && ballObj.el.parentNode) ballObj.el.remove();
                if (ballObj.groupEl && ballObj.groupEl.parentNode) ballObj.groupEl.remove();
                balls = balls.filter(b => b !== ballObj);
                laneOccupied[ballObj.laneIdx] = false;
                if (balls.length === 0 && pendingLaneRecompute) {
                    pendingLaneRecompute = false;
                    computeLanes();
                }
            }, 450);
        }

        function checkGameOver() {
            if (lives <= 0) {
                lives = 0;
                updateHUD();
                endGame();
            }
        }

        function clearAllBalls() {
            balls.forEach(b => {
                if (b.el && b.el.parentNode) b.el.remove();
                if (b.groupEl && b.groupEl.parentNode) b.groupEl.remove();
            });
            balls = [];
            if (pendingLaneRecompute) { pendingLaneRecompute = false; computeLanes(); }
            else laneOccupied.fill(false);
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
                score = 0; lives = MAX_LIVES; clearAllBalls();
                elapsedMs = 0; lastShownSeconds = -1;
                applySpeedSelection();
                updateHUD();
                updateTimerDisplay(true);
            }
            running = true;
            paused = false;
            hideOverlay();
            paramsPanel.classList.remove('show');
            paramsBtn.classList.remove('active');
            pauseBtn.textContent = '⏸ Pause';
            lastTime = null;
            if (!rafId) rafId = requestAnimationFrame(gameLoop);
        }

        function pauseGame() {
            if (!running || paused) return;
            paused = true;
            pauseBtn.textContent = '▶ Reprendre';
            showOverlay('⏸ En pause', 'Clique sur Démarrer pour reprendre la partie.', '▶ Reprendre');
        }

        function togglePause() {
            if (!running) { startGame(); return; }
            if (paused) startGame(); else pauseGame();
        }

        function stopGame() {
            running = false;
            paused = true;
            destroyed = true;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            clearAllBalls();
        }

        function endGame() {
            running = false;
            paused = true;
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            clearAllBalls();
            computeLanes();
            applySpeedSelection();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            spawnAccum = 0; lastTime = null;
            elapsedMs = 0; lastShownSeconds = -1;
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('🎯 Tables de multiplication', 'Clique sur le bon résultat avant que la boule touche le sol !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);

                spawnAccum += dt;
                const curSpawnInterval = Math.max(1300, fallDuration / 2.6);
                if (spawnAccum >= curSpawnInterval) {
                    spawnAccum = 0;
                    spawnBall();
                }
                balls.forEach(ballObj => {
                    if (ballObj.answered) return;
                    ballObj.progress += dt / ballObj.duration;
                    const startTop = -Math.round(ballDiameterPx * BALL_HEIGHT_RATIO) - 10;
                    if (ballObj.progress >= 1) {
                        ballObj.progress = 1;
                        ballObj.el.style.top = ballObj.finalTop + 'px';
                        onBallMissed(ballObj);
                        return;
                    }
                    const top = startTop + (ballObj.finalTop - startTop) * ballObj.progress;
                    ballObj.el.style.top = top + 'px';
                });
            }
            rafId = requestAnimationFrame(gameLoop);
        }

        // ── Écouteurs des contrôles ─────────────────────────────────────
        makeTap(startBtn, () => startGame());
        makeTap(pauseBtn, () => togglePause());
        makeTap(resetBtn, () => resetGame());

        // ── Init ─────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            // Restaurer les dimensions sauvegardées si elles existent
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const isMobile = typeof isMobileBoardMode === 'function' && isMobileBoardMode();

            if (!isMobile) {
                // Le widget s'ouvre à 100px du bord gauche du board.
                widget.style.left = '100px';
                widget.dataset.leftPercent = (100 / curW) * 100;
            }

            if (isMobile) {
                const wPct = parseFloat(widget.dataset.widthPercent);
                const hPct = parseFloat(widget.dataset.contentHPercent);
                if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
                if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
                // Taille par défaut si aucune dimension sauvegardée
                if (!container.style.height) container.style.height = '520px';
            } else {
                // Sur PC, le jeu démarre toujours à 1000×800px.
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            // Ouvrir directement en plein écran board sur téléphone (mémorise
            // la taille normale pour pouvoir revenir dessus via le bouton ⤢).
            // Sur PC, le widget démarre à sa taille normale (1000×800px) ;
            // l'utilisateur peut toujours l'agrandir manuellement.
            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            }

            applyFontScale();
            updateHUD();
            resetGame();
            paramsPanel.classList.add('show');
            paramsBtn.classList.add('active');
            rafId = requestAnimationFrame(gameLoop);
        }));

        // ── Nettoyage si le widget est retiré du DOM autrement que via wfClose ──
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
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'jeu-tables-multi') initJeuTablesMultiWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-tables-multi') initJeuTablesMultiWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
