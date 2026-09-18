// =========================================================================
// WIDGET JEU PAC-MULTI — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-tables-pacman'.
// Design repris de widget-jeu-tables-invaders.js (thème clair, redimensionnement
// libre, barre d'édition avec aide, réduire, plein écran board, fermer).
//
// Principe : Pac-Man se déplace dans un petit labyrinthe dont plusieurs
// couloirs se terminent par une pastille-nombre. Une opération s'affiche
// en haut (ex. "7 × 8 = ?") et l'élève doit diriger Pac-Man (flèches du
// clavier, glisser du doigt/stylet, ou pavé directionnel tactile) vers la
// bonne pastille, en évitant un fantôme qui rôde dans le labyrinthe.
// Bonne pastille = mangée + point ; mauvaise pastille ou contact avec le
// fantôme = vie perdue.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-tables-pacman.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-tables-pacman');toggleJeuxPanel()">
//          ...
//      </div>
// =========================================================================

(function () {

    // ── Fonction utilitaire mini-barre collapse (partagée, déjà injectée par
    //    un autre widget-jeu — on ne la redéfinit pas si elle existe déjà) ──
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
    if (!document.getElementById('widget-jeu-tables-pacman-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tables-pacman-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-tables-pacman"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal (thème clair) ── */
        .jtp-container {
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
            width: 860px;
            min-width: 620px;
            min-height: 520px;
            color: #374151;
        }

        /* ── État plein écran ── */
        .jtp-container.wf-fullboard {
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
        .jtp-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jtp-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jtp-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jtp-params-btn, .jtp-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
            touch-action: manipulation;
        }
        .jtp-params-btn:hover, .jtp-help-btn:hover { background: #e0e0e0; color: #333; }
        .jtp-params-btn.active { background: #4a7bf0; color: white; border-color: #3a63d0; }

        /* ── Popup aide ── */
        .jtp-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jtp-help-popup.show { display: block; }
        .jtp-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jtp-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jtp-params-panel.show { display: flex; }
        .jtp-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .jtp-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .jtp-table-check {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid transparent;
            background: #fff3cf; color: #8a6300;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: all .15s;
            user-select: none;
            touch-action: manipulation;
        }
        .jtp-table-check input[type=checkbox] { display: none; }
        .jtp-table-check.checked { border-color: currentColor; }
        .jtp-table-check:not(.checked) { opacity: 0.4; }
        .jtp-table-check:hover { opacity: 1; }

        .jtp-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .jtp-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jtp-speed-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white; color: #374151;
        }
        .jtp-speed-select:focus { border-color: #4a7bf0; }

        /* ── HUD (score / vies) ── */
        .jtp-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jtp-score { color: #2e7d32; }
        .jtp-timer { color: #374151; font-variant-numeric: tabular-nums; }
        .jtp-lives { letter-spacing: 2px; font-size: 15px; }

        /* ── Ligne opération courante ── */
        .jtp-op-row { text-align: center; flex-shrink: 0; }
        .jtp-op {
            display: inline-block;
            font-size: var(--jtp-op-fs, 20px);
            font-weight: 900;
            color: #8a5a00;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            background: #fff3cf;
            border: 1.5px solid #f4dc9a;
            border-radius: 8px;
            padding: 2px 12px;
        }

        /* ── Espace de jeu (labyrinthe) ── */
        .jtp-space {
            flex: 1;
            min-height: 160px;
            position: relative;
            border-radius: 12px;
            background: #000000;
            border: 1.5px solid #10102a;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            box-shadow: inset 0 0 40px rgba(0,0,0,0.7);
        }
        .jtp-maze-layer {
            position: relative;
            background-color: #000000;
            background-image: radial-gradient(#ffd400 1.3px, transparent 1.3px);
            background-size: 22px 22px;
            border-radius: 4px;
            box-shadow: 0 0 0 1px #0b0b2a, inset 0 0 24px rgba(33,54,255,0.15);
            flex-shrink: 0;
        }
        .jtp-wall {
            position: absolute;
            background: linear-gradient(145deg, #3947ff, #1015b0);
            border-radius: 4px;
            box-shadow: inset 0 0 0 1.5px rgba(140,160,255,0.55), 0 0 6px rgba(51,84,255,0.75), 0 0 1px rgba(180,195,255,0.9);
        }

        /* ── Pac-Man ── */
        .jtp-pacman {
            position: absolute;
            z-index: 5;
            box-sizing: border-box;
        }
        .jtp-pacman-mouth {
            position: absolute; inset: 0;
            border-radius: 50%;
            background: #ffd400;
            box-shadow: 0 0 10px rgba(255,212,0,0.7), 0 2px 5px rgba(0,0,0,0.4);
            animation: jtp-chomp 0.32s linear infinite;
        }
        @keyframes jtp-chomp {
            0%, 100% { clip-path: polygon(100% 50%, 55% 50%, 100% 50%, 100% 0%, 0% 0%, 0% 100%, 100% 100%); }
            50%      { clip-path: polygon(100% 85%, 55% 50%, 100% 15%, 100% 0%, 0% 0%, 0% 100%, 100% 100%); }
        }

        /* ── Fantôme ── */
        .jtp-ghost {
            position: absolute;
            clip-path: polygon(0% 45%, 6% 20%, 22% 3%, 50% 0%, 78% 3%, 94% 20%, 100% 45%, 100% 100%, 85% 82%, 70% 100%, 55% 82%, 45% 82%, 30% 100%, 15% 82%, 0% 100%);
            background: linear-gradient(160deg, #ff5c68, #e02030);
            box-shadow: 0 0 8px rgba(224,32,48,0.6);
            z-index: 4;
            box-sizing: border-box;
            animation: jtp-bob 0.5s ease-in-out infinite alternate;
        }
        .jtp-ghost::before, .jtp-ghost::after {
            content: '';
            position: absolute;
            top: 30%;
            width: 24%; height: 24%;
            background: radial-gradient(circle at 50% 62%, #1a2ad0 24%, #ffffff 27%);
            border-radius: 50%;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
        }
        .jtp-ghost::before { left: 16%; }
        .jtp-ghost::after  { right: 16%; }
        @keyframes jtp-bob {
            0% { transform: translateY(0); }
            100% { transform: translateY(-3%); }
        }
        .jtp-ghost.hit { filter: grayscale(0.4) brightness(1.5) hue-rotate(160deg); }

        /* ── Pastille-résultat ── */
        .jtp-pellet {
            position: absolute;
            border-radius: 50%;
            background: #fffdf5;
            border: 2.5px solid #ffd400;
            color: #8a6d00;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            box-shadow: 0 0 10px rgba(255,212,0,0.55), 0 2px 5px rgba(0,0,0,0.35);
            z-index: 3;
            transition: transform .18s ease, opacity .3s ease;
        }
        .jtp-pellet.eaten {
            transform: scale(1.5);
            opacity: 0;
        }
        .jtp-pellet.wrong-hit {
            animation: jtp-pellet-shake .35s ease;
            border-color: #c53030;
            color: #822727;
            background: #fdeaea;
        }
        @keyframes jtp-pellet-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px) scale(1.1); }
            75% { transform: translateX(4px) scale(1.1); }
        }

        /* ── Pavé directionnel tactile ── */
        .jtp-dpad {
            position: absolute;
            right: 8px; bottom: 8px;
            display: grid;
            grid-template-columns: repeat(3, 30px);
            grid-template-rows: repeat(3, 30px);
            gap: 3px;
            z-index: 8;
            opacity: 0.88;
        }
        .jtp-dpad-btn {
            width: 30px; height: 30px;
            border-radius: 8px;
            border: none;
            background: rgba(74,91,208,0.85);
            color: #fff;
            font-size: 14px;
            font-weight: 900;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            padding: 0;
            touch-action: none;
            -webkit-tap-highlight-color: transparent;
            transition: background .1s, transform .1s;
        }
        .jtp-dpad-btn:active { background: rgba(58,74,180,0.95); transform: scale(0.92); }
        .jtp-dpad-up    { grid-column: 2; grid-row: 1; }
        .jtp-dpad-left  { grid-column: 1; grid-row: 2; }
        .jtp-dpad-right { grid-column: 3; grid-row: 2; }
        .jtp-dpad-down  { grid-column: 2; grid-row: 3; }

        /* ── Overlay démarrage / fin de partie ── */
        .jtp-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 10px;
        }
        .jtp-overlay.hidden { display: none; }
        .jtp-overlay-title {
            font-size: 18px; font-weight: 800; color: #374151;
        }
        .jtp-overlay-sub {
            font-size: 13px; color: #6b7280;
            max-width: 90%;
        }
        .jtp-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #4a5bd0; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
            box-shadow: 0 0 14px rgba(74,91,208,0.5);
            touch-action: manipulation;
        }
        .jtp-start-btn:hover { background: #3a4ab0; }
        .jtp-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jtp-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jtp-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
            touch-action: manipulation;
        }
        .jtp-btn:active { transform: scale(0.96); }
        .jtp-btn-reset { background: #6b7280; color: white; }
        .jtp-btn-reset:hover { background: #4b5563; }
        .jtp-btn-pause { background: #4a5bd0; color: white; }
        .jtp-btn-pause:hover { background: #3a4ab0; }

        /* ── Poignée resize ── */
        .jtp-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jtp-container:hover .jtp-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-tables-pacman';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jtp-container">

  <!-- En-tête -->
  <div class="jtp-header">
    <span class="jtp-title">🟡 Pac-Multi</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jtp-params-btn" title="Paramètres">⚙</button>
      <button class="jtp-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jtp-params-panel">
    <div class="jtp-params-title">Tables à réviser :</div>
    <div class="jtp-params-grid"></div>
    <div class="jtp-params-row">
      <label>Vitesse :</label>
      <select class="jtp-speed-select">
        <option value="420">🐢 Facile</option>
        <option value="300" selected>🚶 Moyen</option>
        <option value="210">🚀 Rapide</option>
        <option value="140">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <!-- HUD -->
  <div class="jtp-hud">
    <span class="jtp-score">🟡 Score : 0</span>
    <span class="jtp-timer">⏱️ 00:00</span>
    <span class="jtp-lives">❤️❤️❤️</span>
  </div>
  <div class="jtp-op-row"><span class="jtp-op">❓ …</span></div>

  <!-- Espace de jeu -->
  <div class="jtp-space">
    <div class="jtp-maze-layer">
      <div class="jtp-pacman"><div class="jtp-pacman-mouth"></div></div>
      <div class="jtp-ghost"></div>
    </div>
    <div class="jtp-dpad">
      <button class="jtp-dpad-btn jtp-dpad-up"    title="Haut">▲</button>
      <button class="jtp-dpad-btn jtp-dpad-left"  title="Gauche">◀</button>
      <button class="jtp-dpad-btn jtp-dpad-right" title="Droite">▶</button>
      <button class="jtp-dpad-btn jtp-dpad-down"  title="Bas">▼</button>
    </div>
    <div class="jtp-overlay">
      <div class="jtp-overlay-title">🟡 Pac-Multi</div>
      <div class="jtp-overlay-sub">Dirige Pac-Man vers la pastille qui porte le bon résultat, et évite le fantôme !</div>
      <button class="jtp-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jtp-controls">
    <button class="jtp-btn jtp-btn-reset">🔄 Réinitialiser</button>
    <button class="jtp-btn jtp-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jtp-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9 ; les tables du 0 et du 1 ne sont pas proposées) que tu veux voir apparaître dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse</b> — Choisis la vitesse de déplacement de Pac-Man et du fantôme : Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> (la vitesse augmente automatiquement toutes les 10 bonnes réponses).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Une opération s'affiche en haut (ex. 7 × 8 = ?). Plusieurs pastilles-nombres apparaissent au bout des couloirs du labyrinthe. Dirige Pac-Man vers la pastille qui porte le bon résultat avec les <b>flèches du clavier</b>, en <b>glissant le doigt ou le stylet</b> sur le labyrinthe, ou avec le <b>pavé directionnel</b> en bas à droite.</p>
    <p style="margin:0 0 6px">Manger la bonne pastille rapporte un point. Manger une mauvaise pastille, ou toucher le fantôme qui rôde, fait perdre une vie ❤️. Un chrono ⏱️ affiche le temps écoulé depuis le début de la partie.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Clique sur <b>🔄 Réinitialiser</b> pour rejouer.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jtp-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuTablesPacmanWidget = function (widget) {

        const container    = widget.querySelector('.jtp-container');
        const paramsBtn     = widget.querySelector('.jtp-params-btn');
        const paramsPanel   = widget.querySelector('.jtp-params-panel');
        const paramsGrid    = widget.querySelector('.jtp-params-grid');
        const speedSelect   = widget.querySelector('.jtp-speed-select');
        const helpBtn       = widget.querySelector('.jtp-help-btn');
        const helpPopup     = widget.querySelector('.jtp-help-popup');
        const resizeHandle  = widget.querySelector('.jtp-resize-handle');
        const scoreEl       = widget.querySelector('.jtp-score');
        const timerEl       = widget.querySelector('.jtp-timer');
        const livesEl       = widget.querySelector('.jtp-lives');
        const opEl          = widget.querySelector('.jtp-op');
        const space         = widget.querySelector('.jtp-space');
        const mazeLayer     = widget.querySelector('.jtp-maze-layer');
        const pacmanEl      = widget.querySelector('.jtp-pacman');
        const ghostEl       = widget.querySelector('.jtp-ghost');
        const dpadUp        = widget.querySelector('.jtp-dpad-up');
        const dpadDown       = widget.querySelector('.jtp-dpad-down');
        const dpadLeft        = widget.querySelector('.jtp-dpad-left');
        const dpadRight        = widget.querySelector('.jtp-dpad-right');
        const overlay          = widget.querySelector('.jtp-overlay');
        const overlayTitle     = widget.querySelector('.jtp-overlay-title');
        const overlaySub       = widget.querySelector('.jtp-overlay-sub');
        const startBtn          = widget.querySelector('.jtp-start-btn');
        const resetBtn          = widget.querySelector('.jtp-btn-reset');
        const pauseBtn           = widget.querySelector('.jtp-btn-pause');

        // ── Labyrinthe (grille statique) ────────────────────────────────
        // # = mur, . = couloir. 15 colonnes x 11 lignes.
        // 5 galeries horizontales entièrement ouvertes, reliées chacune par
        // 6 couloirs verticaux, plus un bloc central façon « maison des
        // fantômes » pour retrouver la silhouette caractéristique d'un
        // labyrinthe de Pac-Man. Encore plus de chemins alternatifs
        // possibles pour rejoindre une pastille en évitant le fantôme.
        const MAZE_MAP = [
            '###############',
            '#.............#',
            '##.#.#.#.#.#.##',
            '#.............#',
            '##.#.#####.#.##',
            '#.....###.....#',
            '##.#.#####.#.##',
            '#.............#',
            '##.#.#.#.#.#.##',
            '#.............#',
            '###############'
        ];
        const MAZE_ROWS = MAZE_MAP.length;
        const MAZE_COLS = MAZE_MAP[0].length;
        function isOpen(r, c) {
            return r >= 0 && r < MAZE_ROWS && c >= 0 && c < MAZE_COLS && MAZE_MAP[r][c] !== '#';
        }

        // Emplacements possibles des pastilles, répartis autour du labyrinthe
        const SLOTS = [
            { r: 1, c: 2 }, { r: 1, c: 12 },
            { r: 5, c: 2 }, { r: 5, c: 12 },
            { r: 9, c: 2 }, { r: 9, c: 12 }
        ];
        const PAC_START   = { r: 7, c: 7 };
        const GHOST_START = { r: 3, c: 7 };

        const DIRS = {
            up:    { dr: -1, dc: 0, deg: 270 },
            down:  { dr: 1,  dc: 0, deg: 90  },
            left:  { dr: 0,  dc: -1, deg: 180 },
            right: { dr: 0,  dc: 1,  deg: 0   }
        };
        const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const CHASE_PROB = 0.45;
        const GHOST_SLOWDOWN_RATIO = 1.55; // le fantôme met 55% de temps en plus que Pac-Man à parcourir une case
        const GHOST_START_DELAY_MS = 1800; // répit avant que le fantôme ne commence à se déplacer

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        let activeTables   = new Set([2,3,4,5,6,7,8,9]); // tables du 0 et du 1 exclues (trop triviales)
        let moveIntervalMs      = 300; // ms par case pour Pac-Man
        let ghostMoveIntervalMs = 480; // ms par case pour le fantôme (nettement plus lent au départ)
        let score          = 0;
        let lives          = MAX_LIVES;
        let running        = false;
        let paused         = true;
        let currentRound   = null; // { ending, pellets:[...] }
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;
        let cellPx         = 40;
        let pacAcc = 0, ghostAcc = 0;
        let invulnerable = false;
        let ghostDelayRemaining = 0; // ms restants avant que le fantôme ne puisse bouger

        let pacman = { row: PAC_START.r, col: PAC_START.c, dir: null, queuedDir: null };
        let ghost  = { row: GHOST_START.r, col: GHOST_START.c, dir: null };

        // ── Mode de vitesse progressive : accélère toutes les 10 bonnes réponses ──
        const PROGRESSIVE_START_DURATION = 460;
        const PROGRESSIVE_MIN_DURATION   = 130;
        const PROGRESSIVE_DECAY          = 0.82;
        let isProgressiveMode = false;
        let lastProgressiveMilestone = 0;

        // ── Chrono de la partie ───────────────────────────────────────────
        let elapsedMs = 0;
        let lastShownSeconds = -1;

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
            label.className = 'jtp-table-check checked';
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

        function applyTransitionDurations() {
            pacmanEl.style.transitionDuration = moveIntervalMs + 'ms';
            ghostEl.style.transitionDuration  = ghostMoveIntervalMs + 'ms';
        }

        function applySpeedSelection() {
            if (speedSelect.value === 'progressive') {
                isProgressiveMode = true;
                moveIntervalMs = PROGRESSIVE_START_DURATION;
                lastProgressiveMilestone = 0;
            } else {
                isProgressiveMode = false;
                moveIntervalMs = parseInt(speedSelect.value, 10) || 300;
            }
            ghostMoveIntervalMs = Math.round(moveIntervalMs * GHOST_SLOWDOWN_RATIO);
            applyTransitionDurations();
        }

        function maybeAdvanceProgressiveSpeed() {
            if (!isProgressiveMode) return;
            const milestone = Math.floor(score / 10);
            if (milestone > lastProgressiveMilestone) {
                lastProgressiveMilestone = milestone;
                moveIntervalMs = Math.max(PROGRESSIVE_MIN_DURATION, Math.round(PROGRESSIVE_START_DURATION * Math.pow(PROGRESSIVE_DECAY, milestone)));
                ghostMoveIntervalMs = Math.round(moveIntervalMs * GHOST_SLOWDOWN_RATIO);
                applyTransitionDurations();
            }
        }

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // ── Construction des murs (une seule fois) ─────────────────────
        let wallEls = [];
        function buildMazeDOM() {
            wallEls.forEach(w => { if (w.el.parentNode) w.el.remove(); });
            wallEls = [];
            for (let r = 0; r < MAZE_ROWS; r++) {
                for (let c = 0; c < MAZE_COLS; c++) {
                    if (MAZE_MAP[r][c] === '#') {
                        const el = document.createElement('div');
                        el.className = 'jtp-wall';
                        mazeLayer.appendChild(el);
                        wallEls.push({ el, r, c });
                    }
                }
            }
        }

        // ── Positionnement pixel d'une entité (instantané ou animé) ────
        function positionEntity(el, row, col, instant) {
            if (instant) {
                const prevTransition = el.style.transition;
                el.style.transitionDuration = '0s';
                el.style.left = (col * cellPx) + 'px';
                el.style.top  = (row * cellPx) + 'px';
                void el.offsetWidth;
                el.style.transitionDuration = '';
                if (prevTransition) el.style.transition = prevTransition;
            } else {
                el.style.left = (col * cellPx) + 'px';
                el.style.top  = (row * cellPx) + 'px';
            }
        }

        // ── Redimensionnement / disposition du labyrinthe ───────────────
        function layoutMaze() {
            const spaceW = space.clientWidth  || 400;
            const spaceH = space.clientHeight || 260;
            cellPx = Math.max(24, Math.floor(Math.min(spaceW / MAZE_COLS, spaceH / MAZE_ROWS)));
            const mazeW = cellPx * MAZE_COLS, mazeH = cellPx * MAZE_ROWS;
            mazeLayer.style.width  = mazeW + 'px';
            mazeLayer.style.height = mazeH + 'px';

            const fs  = Math.max(11, Math.min(18, Math.round(cellPx * 0.34)));
            const ops = Math.max(16, Math.min(26, Math.round(container.offsetWidth / 700 * 20)));
            container.style.setProperty('--jtp-op-fs', ops + 'px');

            wallEls.forEach(w => {
                w.el.style.left   = (w.c * cellPx) + 'px';
                w.el.style.top    = (w.r * cellPx) + 'px';
                w.el.style.width  = cellPx + 'px';
                w.el.style.height = cellPx + 'px';
            });

            const pacSize = Math.round(cellPx * 0.82);
            pacmanEl.style.width = pacSize + 'px'; pacmanEl.style.height = pacSize + 'px';
            pacmanEl.style.marginLeft = ((cellPx - pacSize) / 2) + 'px';
            pacmanEl.style.marginTop  = ((cellPx - pacSize) / 2) + 'px';
            ghostEl.style.width = pacSize + 'px'; ghostEl.style.height = pacSize + 'px';
            ghostEl.style.marginLeft = ((cellPx - pacSize) / 2) + 'px';
            ghostEl.style.marginTop  = ((cellPx - pacSize) / 2) + 'px';

            const pelletSize = Math.round(cellPx * 0.7);
            if (currentRound) {
                currentRound.pellets.forEach(p => {
                    p.el.style.width = pelletSize + 'px'; p.el.style.height = pelletSize + 'px';
                    p.el.style.marginLeft = ((cellPx - pelletSize) / 2) + 'px';
                    p.el.style.marginTop  = ((cellPx - pelletSize) / 2) + 'px';
                    p.el.style.fontSize = fs + 'px';
                    positionEntity(p.el, p.row, p.col, true);
                });
            }
            positionEntity(pacmanEl, pacman.row, pacman.col, true);
            positionEntity(ghostEl, ghost.row, ghost.col, true);
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
                    layoutMaze();
                }
                window._wfMiniBarCollapse(widget, '🟡 Pac-Multi', {
                    onExpand: layoutMaze
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
                layoutMaze();
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
                container.style.width  = Math.max(620, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(520, startH + ev.clientY - startY) + 'px';
                layoutMaze();
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
            scoreEl.textContent = '🟡 Score : ' + score;
            livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🤍'.repeat(Math.max(0, MAX_LIVES - lives));
        }

        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        function generateOperation() {
            const tables = activeTables.size > 0 ? Array.from(activeTables) : [2,3,4,5,6,7,8,9];
            const a = tables[randInt(0, tables.length - 1)];
            const b = randInt(0, 9);
            const correct = a * b;
            const wrongCount = Math.min(SLOTS.length - 1, 4);

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
            shuffleArray(choices);
            return { a, b, correct, choices };
        }

        // ── Gestion d'une manche (une opération, pastilles au bout des couloirs) ──
        // Distance (à vol d'oiseau, en cases) minimale souhaitée entre la position
        // actuelle de Pac-Man et un emplacement où une nouvelle pastille peut
        // apparaître : évite qu'une pastille ne réapparaisse pile là où il vient
        // de manger, ou juste à côté, ce qui le forcerait à la manger sans choix.
        function manhattan(r1, c1, r2, c2) { return Math.abs(r1 - r2) + Math.abs(c1 - c2); }
        function pickRoundSlots(count) {
            let minDist = 4;
            let candidates = [];
            while (minDist >= 0) {
                candidates = SLOTS.filter(s => manhattan(s.r, s.c, pacman.row, pacman.col) >= minDist);
                if (candidates.length >= count) break;
                minDist--;
            }
            if (candidates.length === 0) candidates = SLOTS.slice();
            return shuffleArray(candidates.slice()).slice(0, count);
        }

        function spawnRound() {
            if (destroyed) return;
            const { a, b, correct, choices } = generateOperation();
            opEl.textContent = '❓ ' + a + ' × ' + b + ' = ?';

            const slots = pickRoundSlots(choices.length);
            const round = { ending: false, pellets: [] };
            currentRound = round;

            const pelletSize = Math.round(cellPx * 0.7);
            const fs = Math.max(11, Math.min(18, Math.round(cellPx * 0.34)));

            slots.forEach((slot, idx) => {
                const val = choices[idx];
                const el = document.createElement('div');
                el.className = 'jtp-pellet';
                el.textContent = val;
                el.style.width = pelletSize + 'px'; el.style.height = pelletSize + 'px';
                el.style.marginLeft = ((cellPx - pelletSize) / 2) + 'px';
                el.style.marginTop  = ((cellPx - pelletSize) / 2) + 'px';
                el.style.fontSize = fs + 'px';
                mazeLayer.appendChild(el);
                positionEntity(el, slot.r, slot.c, true);
                round.pellets.push({ el, row: slot.r, col: slot.c, correct: val === correct, consumed: false });
            });
        }

        function clearRound() {
            if (currentRound) {
                currentRound.pellets.forEach(p => { if (p.el && p.el.parentNode) p.el.remove(); });
            }
            currentRound = null;
        }

        function removePelletSoon(pellet) {
            setTimeout(() => { if (pellet.el && pellet.el.parentNode) pellet.el.remove(); }, 380);
        }

        function endRoundSoon() {
            if (!currentRound || currentRound.ending) return;
            const ref = currentRound;
            currentRound.ending = true;
            setTimeout(() => {
                if (currentRound !== ref) return;
                clearRound();
                if (running && !paused && lives > 0) spawnRound();
            }, 480);
        }

        function checkPelletCollision() {
            if (!currentRound || currentRound.ending) return;
            const pellet = currentRound.pellets.find(p => !p.consumed && p.row === pacman.row && p.col === pacman.col);
            if (!pellet) return;
            pellet.consumed = true;
            if (pellet.correct) {
                score++;
                updateHUD();
                pellet.el.classList.add('eaten');
                maybeAdvanceProgressiveSpeed();
                endRoundSoon();
            } else {
                lives--;
                updateHUD();
                pellet.el.classList.add('wrong-hit');
                removePelletSoon(pellet);
                checkGameOver();
            }
        }

        function checkGhostCollision() {
            if (invulnerable || !running || paused) return;
            if (pacman.row === ghost.row && pacman.col === ghost.col) {
                invulnerable = true;
                lives--;
                updateHUD();
                ghostEl.classList.add('hit');
                setTimeout(() => {
                    pacman.row = PAC_START.r; pacman.col = PAC_START.c; pacman.dir = null; pacman.queuedDir = null;
                    ghost.row = GHOST_START.r; ghost.col = GHOST_START.c; ghost.dir = null;
                    positionEntity(pacmanEl, pacman.row, pacman.col, true);
                    positionEntity(ghostEl, ghost.row, ghost.col, true);
                    applyTransitionDurations();
                    pacmanEl.style.transform = 'rotate(0deg)';
                    ghostEl.classList.remove('hit');
                    invulnerable = false;
                    ghostDelayRemaining = 900;
                }, 550);
                checkGameOver();
            }
        }

        function checkGameOver() {
            if (lives <= 0) {
                lives = 0;
                updateHUD();
                endGame();
            }
        }

        function stepPacman() {
            if (pacman.queuedDir) {
                const qd = DIRS[pacman.queuedDir];
                if (isOpen(pacman.row + qd.dr, pacman.col + qd.dc)) {
                    pacman.dir = pacman.queuedDir;
                    pacman.queuedDir = null;
                }
            }
            if (pacman.dir) {
                const d = DIRS[pacman.dir];
                if (isOpen(pacman.row + d.dr, pacman.col + d.dc)) {
                    pacman.row += d.dr; pacman.col += d.dc;
                    positionEntity(pacmanEl, pacman.row, pacman.col, false);
                    pacmanEl.style.transform = 'rotate(' + d.deg + 'deg)';
                    checkPelletCollision();
                    checkGhostCollision();
                }
            }
        }

        function stepGhost() {
            let opts = [];
            for (const key of ['up', 'down', 'left', 'right']) {
                const d = DIRS[key];
                if (isOpen(ghost.row + d.dr, ghost.col + d.dc)) opts.push(key);
            }
            if (opts.length > 1 && ghost.dir) {
                const rev = OPPOSITE[ghost.dir];
                const filtered = opts.filter(k => k !== rev);
                if (filtered.length > 0) opts = filtered;
            }
            if (opts.length === 0) return;
            let chosen;
            if (Math.random() < CHASE_PROB) {
                let bestKey = opts[0], bestDist = Infinity;
                opts.forEach(key => {
                    const d = DIRS[key];
                    const nr = ghost.row + d.dr, nc = ghost.col + d.dc;
                    const dist = Math.abs(nr - pacman.row) + Math.abs(nc - pacman.col);
                    if (dist < bestDist) { bestDist = dist; bestKey = key; }
                });
                chosen = bestKey;
            } else {
                chosen = opts[randInt(0, opts.length - 1)];
            }
            const d = DIRS[chosen];
            ghost.row += d.dr; ghost.col += d.dc; ghost.dir = chosen;
            positionEntity(ghostEl, ghost.row, ghost.col, false);
            checkGhostCollision();
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
                score = 0; lives = MAX_LIVES; clearRound();
                elapsedMs = 0; lastShownSeconds = -1;
                pacAcc = 0; ghostAcc = 0; invulnerable = false; ghostDelayRemaining = GHOST_START_DELAY_MS;
                pacman.row = PAC_START.r; pacman.col = PAC_START.c; pacman.dir = null; pacman.queuedDir = null;
                ghost.row = GHOST_START.r; ghost.col = GHOST_START.c; ghost.dir = null;
                positionEntity(pacmanEl, pacman.row, pacman.col, true);
                positionEntity(ghostEl, ghost.row, ghost.col, true);
                pacmanEl.style.transform = 'rotate(0deg)';
                applySpeedSelection();
                updateHUD();
                updateTimerDisplay(true);
                spawnRound();
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
            clearRound();
            document.removeEventListener('keydown', onKeyDown);
        }

        function endGame() {
            running = false;
            paused = true;
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            clearRound();
            layoutMaze();
            applySpeedSelection();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            lastTime = null; pacAcc = 0; ghostAcc = 0; invulnerable = false; ghostDelayRemaining = GHOST_START_DELAY_MS;
            elapsedMs = 0; lastShownSeconds = -1;
            pacman.row = PAC_START.r; pacman.col = PAC_START.c; pacman.dir = null; pacman.queuedDir = null;
            ghost.row = GHOST_START.r; ghost.col = GHOST_START.c; ghost.dir = null;
            positionEntity(pacmanEl, pacman.row, pacman.col, true);
            positionEntity(ghostEl, ghost.row, ghost.col, true);
            pacmanEl.style.transform = 'rotate(0deg)';
            ghostEl.classList.remove('hit');
            opEl.textContent = '❓ …';
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('🟡 Pac-Multi', 'Dirige Pac-Man vers la pastille qui porte le bon résultat, et évite le fantôme !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);
                pacAcc += dt;
                let guard = 0;
                while (pacAcc >= moveIntervalMs && guard < 8) { pacAcc -= moveIntervalMs; stepPacman(); guard++; }

                if (ghostDelayRemaining > 0) {
                    ghostDelayRemaining -= dt;
                    ghostAcc = 0;
                } else {
                    ghostAcc += dt;
                    guard = 0;
                    while (ghostAcc >= ghostMoveIntervalMs && guard < 8) { ghostAcc -= ghostMoveIntervalMs; stepGhost(); guard++; }
                }
            }
            rafId = requestAnimationFrame(gameLoop);
        }

        // ── Contrôles clavier (flèches) ─────────────────────────────────
        function onKeyDown(e) {
            if (!running || paused) return;
            let dir = null;
            if (e.key === 'ArrowUp')    dir = 'up';
            else if (e.key === 'ArrowDown')  dir = 'down';
            else if (e.key === 'ArrowLeft')  dir = 'left';
            else if (e.key === 'ArrowRight') dir = 'right';
            if (dir) { e.preventDefault(); pacman.queuedDir = dir; }
        }
        document.addEventListener('keydown', onKeyDown);

        // ── Glisser (swipe) sur le labyrinthe ───────────────────────────
        let swipeState = null;
        space.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            try { space.setPointerCapture(e.pointerId); } catch (err) {}
            swipeState = { id: e.pointerId, x: e.clientX, y: e.clientY };
        });
        space.addEventListener('pointermove', (e) => {
            if (!swipeState || e.pointerId !== swipeState.id) return;
            const dx = e.clientX - swipeState.x, dy = e.clientY - swipeState.y;
            const TH = 18;
            if (Math.abs(dx) < TH && Math.abs(dy) < TH) return;
            pacman.queuedDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            swipeState.x = e.clientX; swipeState.y = e.clientY;
        });
        function endSwipe(e) {
            if (swipeState && e.pointerId === swipeState.id) {
                try { space.releasePointerCapture(swipeState.id); } catch (err) {}
                swipeState = null;
            }
        }
        space.addEventListener('pointerup', endSwipe);
        space.addEventListener('pointercancel', endSwipe);

        // ── Pavé directionnel tactile ────────────────────────────────────
        function makeDirButton(el, dirKey) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); e.preventDefault();
                try { el.setPointerCapture(e.pointerId); } catch (err) {}
                pacman.queuedDir = dirKey;
            });
            el.addEventListener('pointerup', (e) => { try { el.releasePointerCapture(e.pointerId); } catch (err) {} });
        }
        makeDirButton(dpadUp, 'up');
        makeDirButton(dpadDown, 'down');
        makeDirButton(dpadLeft, 'left');
        makeDirButton(dpadRight, 'right');

        // ── Écouteurs des contrôles ─────────────────────────────────────
        makeTap(startBtn, () => startGame());
        makeTap(pauseBtn, () => togglePause());
        makeTap(resetBtn, () => resetGame());

        // ── Init ─────────────────────────────────────────────────────────
        buildMazeDOM();

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
                if (!container.style.height) container.style.height = '680px';
            } else {
                // Sur PC, le jeu démarre toujours à 1000×800px.
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            }

            layoutMaze();
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
            if (type === 'jeu-tables-pacman') initJeuTablesPacmanWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-tables-pacman') initJeuTablesPacmanWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
