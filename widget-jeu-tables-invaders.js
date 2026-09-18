// =========================================================================
// WIDGET JEU INVADERS DES TABLES DE MULTIPLICATION — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-tables-invaders'.
// Design repris de widget-jeu-tables-multi.js (redimensionnement libre,
// barre d'édition avec aide, réduire, plein écran board, fermer).
//
// Principe : une opération s'affiche en haut. Cinq vaisseaux extraterrestres
// portant chacun un résultat possible descendent depuis l'espace. L'élève
// doit toucher (cliquer / tap) le vaisseau qui porte le bon résultat avant
// qu'il n'atteigne la planète, comme dans un Space Invaders.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-tables-invaders.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-tables-invaders');toggleJeuxPanel()">
//          ...
//      </div>
// =========================================================================

(function () {

    // ── Fonction utilitaire mini-barre collapse (partagée, déjà injectée par
    //    widget-jeu-tables-multi.js ou un autre widget — on ne la redéfinit pas) ──
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

    // ── CSS boutons fenêtre (partagée — déjà injectée par d'autres widgets) ──
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
    if (!document.getElementById('widget-jeu-tables-invaders-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tables-invaders-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-tables-invaders"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal (thème clair) ── */
        .jti-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 700px;
            min-width: 420px;
            min-height: 320px;
            color: #374151;
        }

        /* ── État plein écran ── */
        .jti-container.wf-fullboard {
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
        .jti-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jti-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jti-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jti-params-btn, .jti-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
            touch-action: manipulation;
        }
        .jti-params-btn:hover, .jti-help-btn:hover { background: #e0e0e0; color: #333; }
        .jti-params-btn.active { background: #6c5ce7; color: white; border-color: #5546c8; }

        /* ── Popup aide ── */
        .jti-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jti-help-popup.show { display: block; }
        .jti-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jti-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jti-params-panel.show { display: flex; }
        .jti-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .jti-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .jti-table-check {
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
            touch-action: manipulation;
        }
        .jti-table-check input[type=checkbox] { display: none; }
        .jti-table-check.checked { border-color: currentColor; }
        .jti-table-check:not(.checked) { opacity: 0.4; }
        .jti-table-check:hover { opacity: 1; }

        .jti-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .jti-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jti-speed-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white; color: #374151;
        }
        .jti-speed-select:focus { border-color: #6c5ce7; }

        /* ── HUD (score / question / chrono / vies) — tout sur une seule ligne
               pour libérer un maximum de hauteur au profit de l'espace de jeu ── */
        .jti-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jti-score {
            color: #2e7d32;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .jti-hud-right {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
            white-space: nowrap;
        }
        .jti-timer { color: #374151; font-variant-numeric: tabular-nums; }
        .jti-lives { letter-spacing: 2px; font-size: 15px; }

        /* ── Question / opération courante, désormais au centre du HUD ── */
        .jti-op-row {
            flex: 1 1 auto;
            min-width: 0;
            text-align: center;
        }
        .jti-op {
            display: inline-block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: var(--jti-op-fs, 18px);
            font-weight: 900;
            color: #1b5e20;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            background: #eafbe7;
            border: 1.5px solid #bfe6bf;
            border-radius: 8px;
            padding: 2px 12px;
        }

        /* ── Espace de jeu (fond noir étoilé façon arcade Space Invaders) ── */
        .jti-space {
            flex: 1;
            min-height: 120px;
            position: relative;
            border-radius: 12px;
            background: radial-gradient(ellipse at 50% 0%, #0d0d1f 0%, #05050c 55%, #000000 100%);
            border: 1.5px solid #2a2a3e;
            overflow: hidden;
            box-shadow: inset 0 0 40px rgba(0,0,0,0.6);
        }
        /* Couche 1 : petites étoiles scintillantes */
        .jti-space::before {
            content: '';
            position: absolute; inset: 0;
            background-image:
                radial-gradient(1.6px 1.6px at 20px 30px, #ffffff, transparent),
                radial-gradient(1.2px 1.2px at 90px 80px, #ffffff, transparent),
                radial-gradient(1.6px 1.6px at 150px 20px, #ffffff, transparent),
                radial-gradient(1.2px 1.2px at 200px 95px, #ffffff, transparent),
                radial-gradient(1.2px 1.2px at 260px 40px, #ffffff, transparent),
                radial-gradient(1.6px 1.6px at 320px 110px, #ffffff, transparent),
                radial-gradient(1.3px 1.3px at 40px 130px, #ffffff, transparent),
                radial-gradient(1.5px 1.5px at 280px 15px, #ffffff, transparent);
            background-repeat: repeat;
            background-size: 340px 150px;
            opacity: 0.85;
            pointer-events: none;
            animation: jti-twinkle 3.2s ease-in-out infinite;
        }
        /* Couche 2 : étoiles plus fines, décalées, clignotement différent (profondeur) */
        .jti-space::after {
            content: '';
            position: absolute; inset: 0;
            background-image:
                radial-gradient(1px 1px at 60px 10px, #9ad8ff, transparent),
                radial-gradient(1px 1px at 130px 70px, #9ad8ff, transparent),
                radial-gradient(1px 1px at 190px 30px, #ffffff, transparent),
                radial-gradient(1px 1px at 250px 100px, #9ad8ff, transparent),
                radial-gradient(1px 1px at 305px 60px, #ffffff, transparent),
                radial-gradient(1px 1px at 10px 90px, #9ad8ff, transparent);
            background-repeat: repeat;
            background-size: 260px 140px;
            opacity: 0.5;
            pointer-events: none;
            animation: jti-twinkle 4.4s ease-in-out infinite 1.1s;
        }
        @keyframes jti-twinkle {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.95; }
        }
        .jti-ground {
            position: absolute;
            left: 0; right: 0; bottom: 0;
            height: 14px;
            background: repeating-linear-gradient(90deg, #39ff6a 0 14px, #1fb84e 14px 28px);
            border-top: 2px solid #0d7a2e;
            box-shadow: 0 0 10px rgba(57,255,106,0.35);
        }
        .jti-ground.flash { animation: jti-ground-flash .4s ease; }
        @keyframes jti-ground-flash {
            0%, 100% { box-shadow: none; }
            50% { box-shadow: inset 0 0 24px 8px rgba(229,57,53,0.75); }
        }

        /* ── Canon fixe au centre bas ── */
        .jti-cannon {
            position: absolute;
            bottom: 12px; left: 50%;
            transform: translateX(-50%);
            width: 30px; height: 22px;
            z-index: 3; pointer-events: none;
        }
        .jti-cannon::before {
            content: '';
            position: absolute; left: 50%; bottom: 0;
            transform: translateX(-50%);
            width: 28px; height: 12px;
            background: linear-gradient(180deg, #8f7dfa, #4a3fb0);
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(74,63,176,0.4);
        }
        .jti-cannon::after {
            content: '';
            position: absolute; left: 50%; bottom: 10px;
            transform: translateX(-50%);
            width: 8px; height: 16px;
            background: linear-gradient(180deg, #b6a9ff, #6c5ce7);
            border-radius: 3px 3px 0 0;
            box-shadow: 0 2px 5px rgba(108,92,231,0.4);
        }

        /* ── Vaisseau façon Space Invaders (pixel art) qui descend ── */
        .jti-alien {
            position: absolute;
            top: -90px;
            width: var(--jti-alien-w, 70px);
            height: var(--jti-alien-h, 76px);
            transform: translateX(-50%);
            will-change: top;
            cursor: pointer;
            box-sizing: border-box;
            /* Reset des styles natifs de <button> */
            appearance: none;
            -webkit-appearance: none;
            border: none;
            background: transparent;
            padding: 0;
            margin: 0;
            font: inherit;
            outline: none;
            /* Fiabilité tactile / stylet (tablette, VPI) */
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            z-index: 4;
        }
        .jti-invader-body,
        .jti-invader-body svg,
        .jti-invader-body rect,
        .jti-alien-badge {
            pointer-events: none;
        }
        .jti-invader-body {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 68%;
            color: var(--jti-alien-color, #43a047);
            filter: drop-shadow(0 3px 3px rgba(0,0,0,0.25));
        }
        .jti-invader-body svg { display: block; width: 100%; height: 100%; }
        .jti-invader-body rect { fill: currentColor; }
        .jti-alien-badge {
            position: absolute;
            left: 50%; bottom: 0;
            transform: translateX(-50%);
            min-width: 60%;
            padding: 2px 7px;
            background: #fff;
            border: 2px solid var(--jti-alien-color, #43a047);
            border-radius: 8px;
            font-weight: 900;
            font-size: var(--jti-fs, 16px);
            color: var(--jti-alien-color-dark, #1b5e20);
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            white-space: nowrap;
        }
        .jti-alien.wrong .jti-invader-body { color: #c53030; filter: grayscale(0.15) drop-shadow(0 3px 3px rgba(0,0,0,0.2)); opacity: 0.65; }
        .jti-alien.wrong .jti-alien-badge { border-color: #c53030; color: #822727; opacity: 0.75; }
        .jti-alien.missed .jti-invader-body { color: #c53030; }
        .jti-alien.missed .jti-alien-badge { border-color: #c53030; color: #822727; background: #fdeaea; }

        /* ── Explosion (impact laser) ── */
        .jti-explosion {
            position: absolute;
            width: 10px; height: 10px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 6;
        }
        .jti-explosion.good {
            background: radial-gradient(circle, #fff9c4, #7CFC7C 40%, transparent 72%);
            animation: jti-explode .45s ease forwards;
        }
        .jti-explosion.bad {
            background: radial-gradient(circle, #fff, #ff6b6b 40%, transparent 72%);
            animation: jti-explode .45s ease forwards;
        }
        @keyframes jti-explode {
            0%   { width: 10px; height: 10px; opacity: 1; }
            100% { width: 100px; height: 100px; opacity: 0; }
        }

        /* ── Tir laser du canon vers la cible ── */
        .jti-laser {
            position: absolute;
            width: 4px;
            background: linear-gradient(180deg, rgba(255,255,255,0), var(--jti-laser-color, #7CFC7C) 45%, #fff);
            border-radius: 2px;
            box-shadow: 0 0 8px var(--jti-laser-color, #7CFC7C);
            pointer-events: none;
            z-index: 5;
            transform-origin: bottom center;
            animation: jti-laser-fade .25s ease forwards;
        }
        @keyframes jti-laser-fade {
            0%   { opacity: 1; }
            100% { opacity: 0; }
        }

        /* ── Overlay démarrage / fin de partie ── */
        .jti-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.88);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 10px;
        }
        .jti-overlay.hidden { display: none; }
        .jti-overlay-title {
            font-size: 18px; font-weight: 800; color: #374151;
        }
        .jti-overlay-sub {
            font-size: 13px; color: #6b7280;
        }
        .jti-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #6c5ce7; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
            box-shadow: 0 0 14px rgba(108,92,231,0.6);
            touch-action: manipulation;
        }
        .jti-start-btn:hover { background: #5546c8; }
        .jti-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jti-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jti-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
            touch-action: manipulation;
        }
        .jti-btn:active { transform: scale(0.96); }
        .jti-btn-reset { background: #6b7280; color: white; }
        .jti-btn-reset:hover { background: #4b5563; }
        .jti-btn-pause { background: #6c5ce7; color: white; }
        .jti-btn-pause:hover { background: #5546c8; }

        /* ── Poignée resize ── */
        .jti-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jti-container:hover .jti-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-tables-invaders';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jti-container">

  <!-- En-tête -->
  <div class="jti-header">
    <span class="jti-title">👾 Invasion des tables</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jti-params-btn" title="Paramètres">⚙</button>
      <button class="jti-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jti-params-panel">
    <div class="jti-params-title">Tables à réviser :</div>
    <div class="jti-params-grid"></div>
    <div class="jti-params-row">
      <label>Vitesse d'invasion :</label>
      <select class="jti-speed-select">
        <option value="9000">🐢 Facile</option>
        <option value="6500" selected>🚶 Moyen</option>
        <option value="4200">🚀 Rapide</option>
        <option value="2200">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <!-- HUD : score, question et chrono/vies regroupés sur une seule ligne -->
  <div class="jti-hud">
    <span class="jti-score">🚀 Score : 0</span>
    <div class="jti-op-row"><span class="jti-op">❓ …</span></div>
    <span class="jti-hud-right">
      <span class="jti-timer">⏱️ 00:00</span>
      <span class="jti-lives">❤️❤️❤️</span>
    </span>
  </div>

  <!-- Espace de jeu -->
  <div class="jti-space">
    <div class="jti-ground"></div>
    <div class="jti-cannon"></div>
    <div class="jti-overlay">
      <div class="jti-overlay-title">👾 Invasion des tables</div>
      <div class="jti-overlay-sub">Détruis le vaisseau qui porte le bon résultat avant qu'il n'envahisse la planète !</div>
      <button class="jti-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jti-controls">
    <button class="jti-btn jti-btn-reset">🔄 Réinitialiser</button>
    <button class="jti-btn jti-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jti-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9 ; les tables du 0 et du 1 ne sont pas proposées) que tu veux voir apparaître dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse d'invasion</b> — Choisis la vitesse à laquelle les vaisseaux descendent : Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> (la vitesse augmente automatiquement toutes les 10 bonnes réponses).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Une opération s'affiche en haut (ex. 7 × 8 = ?). Cinq vaisseaux descendent depuis l'espace, chacun affichant un résultat possible. Touche le vaisseau qui porte le bon résultat pour le détruire avec le canon !</p>
    <p style="margin:0 0 6px">Une bonne réponse rapporte un point. Toucher un mauvais vaisseau, ou laisser le bon vaisseau atteindre la planète, fait perdre une vie ❤️. Un chrono ⏱️ affiche le temps écoulé depuis le début de la partie.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Clique sur <b>🔄 Réinitialiser</b> pour rejouer.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jti-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuTablesInvadersWidget = function (widget) {

        const container     = widget.querySelector('.jti-container');
        const paramsBtn      = widget.querySelector('.jti-params-btn');
        const paramsPanel    = widget.querySelector('.jti-params-panel');
        const paramsGrid     = widget.querySelector('.jti-params-grid');
        const speedSelect    = widget.querySelector('.jti-speed-select');
        const helpBtn        = widget.querySelector('.jti-help-btn');
        const helpPopup      = widget.querySelector('.jti-help-popup');
        const resizeHandle   = widget.querySelector('.jti-resize-handle');
        const scoreEl        = widget.querySelector('.jti-score');
        const timerEl        = widget.querySelector('.jti-timer');
        const livesEl        = widget.querySelector('.jti-lives');
        const opEl            = widget.querySelector('.jti-op');
        const space            = widget.querySelector('.jti-space');
        const groundEl         = widget.querySelector('.jti-ground');
        const cannonEl          = widget.querySelector('.jti-cannon');
        const overlay          = widget.querySelector('.jti-overlay');
        const overlayTitle     = widget.querySelector('.jti-overlay-title');
        const overlaySub       = widget.querySelector('.jti-overlay-sub');
        const startBtn          = widget.querySelector('.jti-start-btn');
        const resetBtn          = widget.querySelector('.jti-btn-reset');
        const pauseBtn           = widget.querySelector('.jti-btn-pause');

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        const NUM_LANES = 5; // toujours 5 vaisseaux (1 bonne réponse + 4 fausses)
        let activeTables   = new Set([2,3,4,5,6,7,8,9]); // tables du 0 et du 1 exclues (trop triviales)
        let fallDuration   = 6500; // ms (vitesse effective courante)
        let score          = 0;
        let lives          = MAX_LIVES;
        let running        = false; // partie démarrée (avant game over)
        let paused         = true;  // en pause (y compris avant le premier départ)
        let currentWave    = null;  // { aliens:[...], answered, ending }
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;
        let alienWPx        = 88;   // tenu à jour par applyFontScale()
        let alienHPx         = 60;
        let laneWidthPx      = 200;

        // ── Mode de vitesse progressive : accélère toutes les 10 bonnes réponses ──
        const PROGRESSIVE_START_DURATION = 7500;  // ms, vitesse de départ (≈ Facile)
        const PROGRESSIVE_MIN_DURATION   = 900;   // ms, plancher (bien plus rapide que Extrême)
        const PROGRESSIVE_DECAY          = 0.75;  // facteur multiplicatif appliqué tous les 10 points
        let isProgressiveMode = false;
        let lastProgressiveMilestone = 0;

        // ── Chrono de la partie ───────────────────────────────────────────
        let elapsedMs = 0;
        let lastShownSeconds = -1;

        // Une couleur par vaisseau/lane (5 teintes bien distinctes)
        const ALIEN_COLORS = [
            { mid: '#38a169', dark: '#1e5e2e' },  // vert
            { mid: '#d53fb0', dark: '#6f1f5b' },  // magenta
            { mid: '#22a9d6', dark: '#0f4d63' },  // cyan
            { mid: '#e08a1e', dark: '#7a4a0a' },  // orange
            { mid: '#6c5ce7', dark: '#3a2f8f' },  // violet
        ];

        // ── Silhouette pixel-art façon Space Invaders (motif "crabe" classique) ──
        // 1 = pixel plein, 0 = vide — grille 11 colonnes x 8 lignes
        const INVADER_PIXEL_MAP = [
            '00100000100',
            '00010001000',
            '00111111100',
            '01101110110',
            '11111111111',
            '10111111101',
            '10100000101',
            '00011011000'
        ];
        function buildInvaderSvg() {
            const cols = INVADER_PIXEL_MAP[0].length;
            const rows = INVADER_PIXEL_MAP.length;
            let rects = '';
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (INVADER_PIXEL_MAP[r][c] === '1') {
                        rects += '<rect x="' + c + '" y="' + r + '" width="1" height="1"/>';
                    }
                }
            }
            return '<svg viewBox="0 0 ' + cols + ' ' + rows + '" preserveAspectRatio="xMidYMid meet">' + rects + '</svg>';
        }
        const INVADER_SVG_MARKUP = buildInvaderSvg();

        function computeLanes() {
            const spaceW = space.clientWidth || 400;
            laneWidthPx = spaceW / NUM_LANES;
        }
        function laneCenterX(idx) { return laneWidthPx * (idx + 0.5); }

        // ── Helper tap stylet (pointer-safe, tactile / stylet VPI) ────────
        function makeTap(el, handler) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const pid = e.pointerId;
                try { el.setPointerCapture(pid); } catch (err) {}
                const sx = e.clientX, sy = e.clientY;
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    el.removeEventListener('pointerup',     onUp);
                    el.removeEventListener('pointercancel', onUp);
                    try { el.releasePointerCapture(pid); } catch (err) {}
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

        // ── Construction des cases à cocher des tables (0 et 1 exclues) ──
        for (let n = 2; n <= 9; n++) {
            const label = document.createElement('label');
            label.className = 'jti-table-check checked';
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
        speedSelect.addEventListener('change', () => { applySpeedSelection(); });

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

        // ── Taille adaptative ───────────────────────────────────────────
        function applyFontScale() {
            const w   = container.offsetWidth || 700;
            const fs  = Math.max(11, Math.min(18, Math.round(13 * w / 700)));
            const ops = Math.max(16, Math.min(26, Math.round(20 * w / 700)));
            computeLanes(); // laneWidthPx à jour avant de dimensionner les vaisseaux
            // Largeur des vaisseaux contrainte par la largeur de couloir (5 lanes)
            const awFromWidth = Math.max(48, Math.min(96, Math.round(72 * w / 700)));
            const aw = Math.min(awFromWidth, Math.round(laneWidthPx * 0.82));
            const ah = Math.round(aw * 1.05); // corps pixel-art + badge résultat
            alienWPx = aw; alienHPx = ah;
            container.style.setProperty('--jti-fs', fs + 'px');
            container.style.setProperty('--jti-op-fs', ops + 'px');
            container.style.setProperty('--jti-alien-w', aw + 'px');
            container.style.setProperty('--jti-alien-h', ah + 'px');
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
                window._wfMiniBarCollapse(widget, '👾 Invasion des tables', {
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
            scoreEl.textContent = '🚀 Score : ' + score;
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
            const wrongCount = NUM_LANES - 1; // ex. 4 mauvaises réponses pour 5 vaisseaux

            const wrongSet = new Set();
            let guardCount = 0;
            while (wrongSet.size < wrongCount && guardCount < 80) {
                guardCount++;
                let candidate;
                const mode = randInt(0, 3);
                if (mode === 0) candidate = correct + randInt(1, 8) * (Math.random() < 0.5 ? -1 : 1);
                else if (mode === 1) candidate = a * (b + randInt(1, 3) * (Math.random() < 0.5 ? -1 : 1));
                else if (mode === 2) candidate = (a + randInt(1, 2) * (Math.random() < 0.5 ? -1 : 1)) * b;
                else candidate = correct + randInt(1, 3) * 10 * (Math.random() < 0.5 ? -1 : 1);
                if (candidate === correct || candidate < 0) continue;
                wrongSet.add(candidate);
            }
            let fallback = correct + 1;
            while (wrongSet.size < wrongCount) {
                if (fallback !== correct) wrongSet.add(fallback);
                fallback++;
            }
            const choices = [correct, ...Array.from(wrongSet)];
            for (let i = choices.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }
            return { a, b, correct, choices };
        }

        // ── Gestion d'une vague (une opération, 5 vaisseaux) ──────────────
        function spawnWave() {
            if (destroyed) return;
            const { a, b, correct, choices } = generateOperation();
            opEl.textContent = '❓ ' + a + ' × ' + b + ' = ?';

            const wave = { answered: false, ending: false, aliens: [] };
            currentWave = wave;

            const skyH = space.clientHeight || 300;
            const groundH = 14;
            const cannonZone = 46;
            const finalTop = skyH - groundH - cannonZone - alienHPx;

            choices.forEach((val, idx) => {
                const color = ALIEN_COLORS[idx % ALIEN_COLORS.length];
                const cx = laneCenterX(idx);
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'jti-alien';
                el.style.left = cx + 'px';
                el.style.top = (-alienHPx - 10) + 'px';
                el.style.setProperty('--jti-alien-color', color.mid);
                el.style.setProperty('--jti-alien-color-dark', color.dark);
                el.innerHTML =
                    '<div class="jti-invader-body">' + INVADER_SVG_MARKUP + '</div>' +
                    '<div class="jti-alien-badge">' + val + '</div>';

                const alienObj = {
                    el, laneIdx: idx, correct: val === correct,
                    progress: 0, duration: fallDuration, finalTop,
                    tapped: false, landed: false
                };
                makeTap(el, () => onAlienTap(alienObj));
                space.appendChild(el);
                wave.aliens.push(alienObj);
            });
        }

        function clearWave() {
            if (currentWave) {
                currentWave.aliens.forEach(a => { if (a.el && a.el.parentNode) a.el.remove(); });
            }
            currentWave = null;
        }

        function removeAlienSoon(alienObj) {
            setTimeout(() => {
                if (alienObj.el && alienObj.el.parentNode) alienObj.el.remove();
            }, 400);
        }

        function groundFlash() {
            groundEl.classList.add('flash');
            setTimeout(() => groundEl.classList.remove('flash'), 400);
        }

        function fireLaser(tx, ty, color) {
            const spaceRect  = space.getBoundingClientRect();
            const cannonRect = cannonEl.getBoundingClientRect();
            const cx = cannonRect.left + cannonRect.width / 2 - spaceRect.left;
            const cy = cannonRect.top - spaceRect.top;
            const dx = tx - cx, dy = ty - cy;
            const dist = Math.max(4, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
            const laser = document.createElement('div');
            laser.className = 'jti-laser';
            laser.style.left = cx + 'px';
            laser.style.top = (cy - dist) + 'px';
            laser.style.height = dist + 'px';
            laser.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
            laser.style.setProperty('--jti-laser-color', color);
            space.appendChild(laser);
            setTimeout(() => { if (laser.parentNode) laser.remove(); }, 260);
        }

        function spawnExplosion(x, y, kind) {
            const ex = document.createElement('div');
            ex.className = 'jti-explosion ' + kind;
            ex.style.left = x + 'px';
            ex.style.top = y + 'px';
            space.appendChild(ex);
            setTimeout(() => { if (ex.parentNode) ex.remove(); }, 480);
        }

        function targetPoint(alienObj) {
            const spaceRect = space.getBoundingClientRect();
            const alienRect = alienObj.el.getBoundingClientRect();
            return {
                x: alienRect.left + alienRect.width / 2 - spaceRect.left,
                y: alienRect.top + alienRect.height / 2 - spaceRect.top
            };
        }

        function onAlienTap(alienObj) {
            if (!currentWave || currentWave.answered || alienObj.tapped || alienObj.landed || !running || paused) return;
            alienObj.tapped = true;
            const { x, y } = targetPoint(alienObj);

            if (alienObj.correct) {
                fireLaser(x, y, '#2e7d32');
                currentWave.answered = true;
                score++;
                updateHUD();
                spawnExplosion(x, y, 'good');
                alienObj.el.style.transition = 'opacity .2s';
                alienObj.el.style.opacity = '0';
                maybeAdvanceProgressiveSpeed();
                endWaveSoon();
            } else {
                fireLaser(x, y, '#c53030');
                lives--;
                updateHUD();
                spawnExplosion(x, y, 'bad');
                alienObj.el.classList.add('wrong');
                checkGameOver();
                removeAlienSoon(alienObj);
            }
        }

        function onAlienLanded(alienObj) {
            if (alienObj.correct) {
                lives--;
                updateHUD();
                alienObj.el.classList.add('missed');
                groundFlash();
                checkGameOver();
                endWaveSoon();
            } else {
                removeAlienSoon(alienObj);
            }
        }

        function endWaveSoon() {
            if (!currentWave || currentWave.ending) return;
            const waveRef = currentWave;
            currentWave.ending = true;
            currentWave.answered = true;
            setTimeout(() => {
                if (currentWave !== waveRef) return;
                clearWave();
                if (running && !paused && lives > 0) spawnWave();
            }, 500);
        }

        function checkGameOver() {
            if (lives <= 0) {
                lives = 0;
                updateHUD();
                endGame();
            }
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
                score = 0; lives = MAX_LIVES; clearWave();
                elapsedMs = 0; lastShownSeconds = -1;
                applySpeedSelection();
                updateHUD();
                updateTimerDisplay(true);
                spawnWave();
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
            clearWave();
        }

        function endGame() {
            running = false;
            paused = true;
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            clearWave();
            computeLanes();
            applySpeedSelection();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            lastTime = null;
            elapsedMs = 0; lastShownSeconds = -1;
            opEl.textContent = '❓ …';
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('👾 Invasion des tables', 'Détruis le vaisseau qui porte le bon résultat avant qu\'il n\'envahisse la planète !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);

                if (currentWave) {
                    currentWave.aliens.forEach(alienObj => {
                        if (alienObj.landed || alienObj.tapped) return;
                        alienObj.progress += dt / alienObj.duration;
                        const startTop = -alienHPx - 10;
                        if (alienObj.progress >= 1) {
                            alienObj.progress = 1;
                            alienObj.landed = true;
                            alienObj.el.style.top = alienObj.finalTop + 'px';
                            onAlienLanded(alienObj);
                            return;
                        }
                        const top = startTop + (alienObj.finalTop - startTop) * alienObj.progress;
                        alienObj.el.style.top = top + 'px';
                    });
                }
            }
            rafId = requestAnimationFrame(gameLoop);
        }

        // ── Écouteurs des contrôles ─────────────────────────────────────
        makeTap(startBtn, () => startGame());
        makeTap(pauseBtn, () => togglePause());
        makeTap(resetBtn, () => resetGame());

        // ── Init ─────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
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
                if (!container.style.height) container.style.height = '520px';
            } else {
                // Sur PC, le jeu démarre toujours à 1000×800px.
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            _savedW = container.style.width;
            _savedH = container.style.height;

            // Le lancement automatique en plein écran (fullboard) ne se fait
            // que sur téléphone, où le jeu a besoin de toute la place. Sur
            // PC, le widget démarre à sa taille normale, comme les autres
            // widgets — l'utilisateur peut toujours l'agrandir manuellement
            // via le bouton "maximiser".
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
            if (type === 'jeu-tables-invaders') initJeuTablesInvadersWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-tables-invaders') initJeuTablesInvadersWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
