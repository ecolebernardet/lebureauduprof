// =========================================================================
// WIDGET JEU SERPENT DES TABLES 🐍 — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-tables-serpent'.
// Design repris de widget-jeu-tables-pacman.js (thème clair, redimensionnement
// libre, barre d'édition avec aide, réduire, plein écran board, fermer).
//
// Principe : un serpent façon Snake se déplace sur une grille ouverte.
// Une opération s'affiche en haut (ex. "7 × 8 = ?") et plusieurs pastilles-
// nombres apparaissent sur la grille. L'élève doit diriger le serpent
// (flèches du clavier, glisser du doigt/stylet, ou pavé directionnel
// tactile) vers la pastille qui porte le bon résultat, en évitant les
// mauvaises pastilles, les bords de la grille et son propre corps.
// Bonne pastille = le serpent grandit + point ; mauvaise pastille = perte
// d'un segment + vie ; toucher un bord ou son corps = perte de vie et le
// serpent revient à sa taille de départ.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-tables-serpent.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-tables-serpent');toggleJeuxPanel()">
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
    if (!document.getElementById('widget-jeu-tables-serpent-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-tables-serpent-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-tables-serpent"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal (thème clair) ── */
        .jts-container {
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
        .jts-container.wf-fullboard {
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
        .jts-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jts-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jts-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jts-params-btn, .jts-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
            touch-action: manipulation;
        }
        .jts-params-btn:hover, .jts-help-btn:hover { background: #e0e0e0; color: #333; }
        .jts-params-btn.active { background: #2e9e4f; color: white; border-color: #22803e; }

        /* ── Popup aide ── */
        .jts-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jts-help-popup.show { display: block; }
        .jts-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jts-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jts-params-panel.show { display: flex; }
        .jts-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .jts-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .jts-table-check {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid transparent;
            background: #e3f6e8; color: #1f6b34;
            cursor: pointer;
            font-size: 11px;
            font-weight: 700;
            transition: all .15s;
            user-select: none;
            touch-action: manipulation;
        }
        .jts-table-check input[type=checkbox] { display: none; }
        .jts-table-check.checked { border-color: currentColor; }
        .jts-table-check:not(.checked) { opacity: 0.4; }
        .jts-table-check:hover { opacity: 1; }

        .jts-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .jts-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jts-speed-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white; color: #374151;
        }
        .jts-speed-select:focus { border-color: #2e9e4f; }

        /* ── HUD (score / vies) ── */
        .jts-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jts-score { color: #2e7d32; }
        .jts-timer { color: #374151; font-variant-numeric: tabular-nums; }
        .jts-lives { letter-spacing: 2px; font-size: 15px; }

        /* ── Ligne opération courante ── */
        .jts-op-row { text-align: center; flex-shrink: 0; }
        .jts-op {
            display: inline-block;
            font-size: var(--jts-op-fs, 20px);
            font-weight: 900;
            color: #8a5a00;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            background: #fff3cf;
            border: 1.5px solid #f4dc9a;
            border-radius: 8px;
            padding: 2px 12px;
        }

        /* ── Espace de jeu (grille) ── */
        .jts-space {
            flex: 1;
            min-height: 160px;
            position: relative;
            border-radius: 12px;
            background: radial-gradient(ellipse at center, #f3fbf1 0%, #dcefdc 65%, #c3e6c6 100%);
            border: 1.5px solid #b9e3c1;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
        }
        .jts-grid-layer {
            position: relative;
            background-color: #e7f6e6;
            background-image:
                repeating-conic-gradient(#e9f7e8 0% 25%, #dcf0da 0% 50%);
            background-position: 0 0;
            border-radius: 6px;
            box-shadow: inset 0 0 0 2px rgba(46,158,79,0.14), 0 2px 14px rgba(46,158,79,0.18);
            flex-shrink: 0;
        }

        /* ── Serpent ── */
        .jts-head, .jts-body {
            position: absolute;
            box-sizing: border-box;
        }
        .jts-head {
            background: linear-gradient(155deg, #8bec97 0%, #3cae5c 55%, #21813d 100%);
            box-shadow: 0 3px 6px rgba(0,0,0,0.25), inset 0 -3px 4px rgba(0,0,0,0.15), inset 0 2px 3px rgba(255,255,255,0.45);
            border-radius: 48% 48% 32% 32%;
            z-index: 6;
        }
        .jts-head::before, .jts-head::after {
            content: '';
            position: absolute;
            top: 20%;
            width: 15%; height: 15%;
            background: #fff;
            border-radius: 50%;
            box-shadow: inset 0 0 0 2px #1a2e20;
        }
        .jts-head::before { left: 19%; }
        .jts-head::after  { right: 19%; }
        .jts-head.hit { filter: grayscale(0.6) brightness(1.4); }
        .jts-tongue {
            position: absolute;
            left: 50%;
            top: -18%;
            width: 12%;
            height: 28%;
            background: #e5433b;
            transform: translateX(-50%);
            clip-path: polygon(50% 100%, 15% 35%, 40% 35%, 50% 0%, 60% 35%, 85% 35%);
            z-index: 1;
        }
        .jts-body {
            border-radius: 42%;
            background-image:
                radial-gradient(circle at 30% 28%, rgba(255,255,255,0.4) 0%, transparent 42%),
                linear-gradient(155deg, #a6eeae 0%, #5cc27a 55%, #379a53 100%);
            box-shadow: inset 0 -2px 3px rgba(0,0,0,0.14), inset 0 2px 2px rgba(255,255,255,0.35);
            z-index: 5;
        }
        .jts-body.jts-alt {
            background-image:
                radial-gradient(circle at 30% 28%, rgba(255,255,255,0.28) 0%, transparent 42%),
                linear-gradient(155deg, #92e39d 0%, #47b566 55%, #2c8c48 100%);
        }
        .jts-body.jts-tail {
            border-radius: 50%;
            opacity: 0.92;
            transform: scale(0.8);
        }

        /* ── Pastille-résultat ── */
        .jts-pellet {
            position: absolute;
            border-radius: 50%;
            background: #fffdf5;
            border: 2.5px solid #f4b400;
            color: #8a6d00;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            box-shadow: 0 2px 5px rgba(0,0,0,0.12);
            z-index: 3;
            transition: transform .18s ease, opacity .3s ease;
        }
        .jts-pellet.eaten {
            transform: scale(1.5);
            opacity: 0;
        }
        .jts-pellet.wrong-hit {
            animation: jts-pellet-shake .35s ease;
            border-color: #c53030;
            color: #822727;
            background: #fdeaea;
        }
        @keyframes jts-pellet-shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px) scale(1.1); }
            75% { transform: translateX(4px) scale(1.1); }
        }

        /* ── Pavé directionnel tactile ── */
        .jts-dpad {
            position: absolute;
            right: 8px; bottom: 8px;
            display: grid;
            grid-template-columns: repeat(3, 30px);
            grid-template-rows: repeat(3, 30px);
            gap: 3px;
            z-index: 8;
            opacity: 0.88;
        }
        .jts-dpad-btn {
            width: 30px; height: 30px;
            border-radius: 8px;
            border: none;
            background: rgba(46,158,79,0.85);
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
        .jts-dpad-btn:active { background: rgba(34,128,62,0.95); transform: scale(0.92); }
        .jts-dpad-up    { grid-column: 2; grid-row: 1; }
        .jts-dpad-left  { grid-column: 1; grid-row: 2; }
        .jts-dpad-right { grid-column: 3; grid-row: 2; }
        .jts-dpad-down  { grid-column: 2; grid-row: 3; }

        /* ── Overlay démarrage / fin de partie ── */
        .jts-overlay {
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
        .jts-overlay.hidden { display: none; }
        .jts-overlay-title {
            font-size: 18px; font-weight: 800; color: #374151;
        }
        .jts-overlay-sub {
            font-size: 13px; color: #6b7280;
            max-width: 90%;
        }
        .jts-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #2e9e4f; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
            box-shadow: 0 0 14px rgba(46,158,79,0.5);
            touch-action: manipulation;
        }
        .jts-start-btn:hover { background: #22803e; }
        .jts-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jts-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jts-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
            touch-action: manipulation;
        }
        .jts-btn:active { transform: scale(0.96); }
        .jts-btn-reset { background: #6b7280; color: white; }
        .jts-btn-reset:hover { background: #4b5563; }
        .jts-btn-pause { background: #2e9e4f; color: white; }
        .jts-btn-pause:hover { background: #22803e; }

        /* ── Poignée resize ── */
        .jts-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jts-container:hover .jts-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-tables-serpent';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jts-container">

  <!-- En-tête -->
  <div class="jts-header">
    <span class="jts-title">🐍 Serpent des tables</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jts-params-btn" title="Paramètres">⚙</button>
      <button class="jts-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jts-params-panel">
    <div class="jts-params-title">Tables à réviser :</div>
    <div class="jts-params-grid"></div>
    <div class="jts-params-row">
      <label>Vitesse :</label>
      <select class="jts-speed-select">
        <option value="420">🐢 Facile</option>
        <option value="300" selected>🚶 Moyen</option>
        <option value="210">🚀 Rapide</option>
        <option value="140">🔥 Extrême</option>
        <option value="progressive">⚡ Progressif (accélère toutes les 10 bonnes réponses)</option>
      </select>
    </div>
  </div>

  <!-- HUD -->
  <div class="jts-hud">
    <span class="jts-score">🐍 Score : 0</span>
    <span class="jts-timer">⏱️ 00:00</span>
    <span class="jts-lives">❤️❤️❤️</span>
  </div>
  <div class="jts-op-row"><span class="jts-op">❓ …</span></div>

  <!-- Espace de jeu -->
  <div class="jts-space">
    <div class="jts-grid-layer"></div>
    <div class="jts-dpad">
      <button class="jts-dpad-btn jts-dpad-up"    title="Haut">▲</button>
      <button class="jts-dpad-btn jts-dpad-left"  title="Gauche">◀</button>
      <button class="jts-dpad-btn jts-dpad-right" title="Droite">▶</button>
      <button class="jts-dpad-btn jts-dpad-down"  title="Bas">▼</button>
    </div>
    <div class="jts-overlay">
      <div class="jts-overlay-title">🐍 Serpent des tables</div>
      <div class="jts-overlay-sub">Dirige le serpent vers la pastille qui porte le bon résultat, évite les mauvaises, les bords et ton propre corps !</div>
      <button class="jts-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jts-controls">
    <button class="jts-btn jts-btn-reset">🔄 Réinitialiser</button>
    <button class="jts-btn jts-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jts-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Tables à réviser</b> — Coche ou décoche les tables (de 2 à 9 ; les tables du 0 et du 1 ne sont pas proposées) que tu veux voir apparaître dans le jeu.</p>
    <p style="margin:0 0 10px"><b>Vitesse</b> — Choisis la vitesse de déplacement du serpent : Facile, Moyen, Rapide, Extrême, ou <b>Progressif</b> (la vitesse augmente automatiquement toutes les 10 bonnes réponses).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Une opération s'affiche en haut (ex. 7 × 8 = ?). Plusieurs pastilles-nombres apparaissent sur la grille. Dirige le serpent vers la pastille qui porte le bon résultat avec les <b>flèches du clavier</b>, en <b>glissant le doigt ou le stylet</b> sur la grille, ou avec le <b>pavé directionnel</b> en bas à droite.</p>
    <p style="margin:0 0 6px">Manger la bonne pastille fait grandir le serpent et rapporte un point. Manger une mauvaise pastille fait perdre un segment et une vie ❤️. Toucher un bord de la grille ou son propre corps fait perdre une vie et remet le serpent à sa taille de départ. Un chrono ⏱️ affiche le temps écoulé depuis le début de la partie.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">La partie se termine quand les 3 vies sont perdues. Clique sur <b>🔄 Réinitialiser</b> pour rejouer.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jts-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuTablesSerpentWidget = function (widget) {

        const container    = widget.querySelector('.jts-container');
        const paramsBtn     = widget.querySelector('.jts-params-btn');
        const paramsPanel   = widget.querySelector('.jts-params-panel');
        const paramsGrid    = widget.querySelector('.jts-params-grid');
        const speedSelect   = widget.querySelector('.jts-speed-select');
        const helpBtn       = widget.querySelector('.jts-help-btn');
        const helpPopup     = widget.querySelector('.jts-help-popup');
        const resizeHandle  = widget.querySelector('.jts-resize-handle');
        const scoreEl       = widget.querySelector('.jts-score');
        const timerEl       = widget.querySelector('.jts-timer');
        const livesEl       = widget.querySelector('.jts-lives');
        const opEl          = widget.querySelector('.jts-op');
        const space         = widget.querySelector('.jts-space');
        const gridLayer     = widget.querySelector('.jts-grid-layer');
        const dpadUp        = widget.querySelector('.jts-dpad-up');
        const dpadDown      = widget.querySelector('.jts-dpad-down');
        const dpadLeft      = widget.querySelector('.jts-dpad-left');
        const dpadRight     = widget.querySelector('.jts-dpad-right');
        const overlay       = widget.querySelector('.jts-overlay');
        const overlayTitle  = widget.querySelector('.jts-overlay-title');
        const overlaySub    = widget.querySelector('.jts-overlay-sub');
        const startBtn      = widget.querySelector('.jts-start-btn');
        const resetBtn      = widget.querySelector('.jts-btn-reset');
        const pauseBtn      = widget.querySelector('.jts-btn-pause');

        // ── Grille de jeu (ouverte, sans mur intérieur) ─────────────────
        const GRID_COLS = 15;
        const GRID_ROWS = 11;

        const DIRS = {
            up:    { dr: -1, dc: 0,  deg: 0   },
            right: { dr: 0,  dc: 1,  deg: 90  },
            down:  { dr: 1,  dc: 0,  deg: 180 },
            left:  { dr: 0,  dc: -1, deg: 270 }
        };
        const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

        // ── État du jeu ──────────────────────────────────────────────────
        const MAX_LIVES = 3;
        const START_LENGTH = 3;
        let activeTables   = new Set([2,3,4,5,6,7,8,9]); // tables du 0 et du 1 exclues (trop triviales)
        let moveIntervalMs = 300; // ms par case pour le serpent
        let score          = 0;
        let lives          = MAX_LIVES;
        let running        = false;
        let paused         = true;
        let currentRound   = null; // { ending, pellets:[...] }
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;
        let cellPx         = 40;
        let moveAcc        = 0;
        let respawning     = false;

        let snake = { segments: [], dir: 'right', queuedDir: null };
        let segmentEls = [];

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
            label.className = 'jts-table-check checked';
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
            segmentEls.forEach(el => { el.style.transitionDuration = moveIntervalMs + 'ms'; });
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
            applyTransitionDurations();
        }

        function maybeAdvanceProgressiveSpeed() {
            if (!isProgressiveMode) return;
            const milestone = Math.floor(score / 10);
            if (milestone > lastProgressiveMilestone) {
                lastProgressiveMilestone = milestone;
                moveIntervalMs = Math.max(PROGRESSIVE_MIN_DURATION, Math.round(PROGRESSIVE_START_DURATION * Math.pow(PROGRESSIVE_DECAY, milestone)));
                applyTransitionDurations();
            }
        }

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

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

        // ── Construction / gestion des segments du serpent ──────────────
        function initialSegments() {
            const row = Math.floor(GRID_ROWS / 2);
            const startCol = Math.floor(GRID_COLS / 2);
            const segs = [];
            for (let i = 0; i < START_LENGTH; i++) segs.push({ row, col: startCol - i });
            return segs;
        }

        function sizeSegmentEl(el) {
            const segSize = Math.max(6, Math.round(cellPx * 0.86));
            el.style.width = segSize + 'px'; el.style.height = segSize + 'px';
            el.style.marginLeft = ((cellPx - segSize) / 2) + 'px';
            el.style.marginTop  = ((cellPx - segSize) / 2) + 'px';
        }

        function createSegmentEl(isHead) {
            const el = document.createElement('div');
            el.className = isHead ? 'jts-head' : 'jts-body';
            el.style.transitionDuration = moveIntervalMs + 'ms';
            sizeSegmentEl(el);
            if (isHead) {
                const tongue = document.createElement('div');
                tongue.className = 'jts-tongue';
                el.appendChild(tongue);
            }
            gridLayer.appendChild(el);
            return el;
        }

        // ── Classes visuelles (tête / écailles alternées / queue arrondie) ──
        function updateBodyStyling() {
            segmentEls.forEach((el, i) => {
                if (i === 0) { el.className = 'jts-head'; return; }
                const isTail = i === segmentEls.length - 1;
                el.className = 'jts-body' + (isTail ? ' jts-tail' : (i % 2 === 0 ? ' jts-alt' : ''));
            });
        }

        function rebuildSnakeEls() {
            segmentEls.forEach(el => { if (el.parentNode) el.remove(); });
            segmentEls = snake.segments.map((seg, i) => createSegmentEl(i === 0));
            updateBodyStyling();
            if (segmentEls[0]) segmentEls[0].style.transform = 'rotate(' + (DIRS[snake.dir] ? DIRS[snake.dir].deg : 0) + 'deg)';
        }

        function renderSnakePositions(instant) {
            snake.segments.forEach((seg, i) => {
                const el = segmentEls[i];
                if (el) positionEntity(el, seg.row, seg.col, instant);
            });
        }

        function growSnakeTail() {
            const tailSeg = snake.segments[snake.segments.length - 1];
            const el = createSegmentEl(false);
            segmentEls.push(el);
            positionEntity(el, tailSeg.row, tailSeg.col, true);
            updateBodyStyling();
        }

        function shrinkSnakeTail() {
            if (snake.segments.length <= 1) return;
            snake.segments.pop();
            const el = segmentEls.pop();
            if (el && el.parentNode) el.remove();
            updateBodyStyling();
        }

        // ── Redimensionnement / disposition de la grille ────────────────
        function layoutGrid() {
            const spaceW = space.clientWidth  || 400;
            const spaceH = space.clientHeight || 260;
            cellPx = Math.max(22, Math.floor(Math.min(spaceW / GRID_COLS, spaceH / GRID_ROWS)));
            const gridW = cellPx * GRID_COLS, gridH = cellPx * GRID_ROWS;
            gridLayer.style.width  = gridW + 'px';
            gridLayer.style.height = gridH + 'px';
            gridLayer.style.backgroundSize = (cellPx * 2) + 'px ' + (cellPx * 2) + 'px';

            const fs  = Math.max(11, Math.min(18, Math.round(cellPx * 0.34)));
            const ops = Math.max(16, Math.min(26, Math.round(container.offsetWidth / 700 * 20)));
            container.style.setProperty('--jts-op-fs', ops + 'px');

            segmentEls.forEach(el => sizeSegmentEl(el));

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
            renderSnakePositions(true);
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
                    layoutGrid();
                }
                window._wfMiniBarCollapse(widget, '🐍 Serpent des tables', {
                    onExpand: layoutGrid
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
                layoutGrid();
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
                layoutGrid();
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
            scoreEl.textContent = '🐍 Score : ' + score;
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
            const wrongCount = 4;

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

        // ── Gestion d'une manche (une opération, pastilles sur la grille) ──
        function manhattan(r1, c1, r2, c2) { return Math.abs(r1 - r2) + Math.abs(c1 - c2); }

        function pickRoundCells(count) {
            const head = snake.segments[0];
            let minDist = 4;
            let candidates = [];
            while (minDist >= 0) {
                candidates = [];
                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        if (snake.segments.some(seg => seg.row === r && seg.col === c)) continue;
                        if (manhattan(r, c, head.row, head.col) < minDist) continue;
                        candidates.push({ r, c });
                    }
                }
                if (candidates.length >= count) break;
                minDist--;
            }
            if (candidates.length === 0) {
                for (let r = 0; r < GRID_ROWS; r++) {
                    for (let c = 0; c < GRID_COLS; c++) {
                        if (!snake.segments.some(seg => seg.row === r && seg.col === c)) candidates.push({ r, c });
                    }
                }
            }
            return shuffleArray(candidates.slice()).slice(0, count);
        }

        function spawnRound() {
            if (destroyed) return;
            const { a, b, correct, choices } = generateOperation();
            opEl.textContent = '❓ ' + a + ' × ' + b + ' = ?';

            const cells = pickRoundCells(choices.length);
            const round = { ending: false, pellets: [] };
            currentRound = round;

            const pelletSize = Math.round(cellPx * 0.7);
            const fs = Math.max(11, Math.min(18, Math.round(cellPx * 0.34)));
            const n = Math.min(cells.length, choices.length);

            for (let idx = 0; idx < n; idx++) {
                const cell = cells[idx];
                const val = choices[idx];
                const el = document.createElement('div');
                el.className = 'jts-pellet';
                el.textContent = val;
                el.style.width = pelletSize + 'px'; el.style.height = pelletSize + 'px';
                el.style.marginLeft = ((cellPx - pelletSize) / 2) + 'px';
                el.style.marginTop  = ((cellPx - pelletSize) / 2) + 'px';
                el.style.fontSize = fs + 'px';
                gridLayer.appendChild(el);
                positionEntity(el, cell.r, cell.c, true);
                round.pellets.push({ el, row: cell.r, col: cell.c, correct: val === correct, consumed: false });
            }
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

        function handlePelletHit(pellet) {
            if (!currentRound || currentRound.ending || pellet.consumed) return;
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
                shrinkSnakeTail();
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

        function resetSnakePosition() {
            clearRound();
            snake.segments = initialSegments();
            snake.dir = 'right'; snake.queuedDir = null;
            rebuildSnakeEls();
            layoutGrid();
            applyTransitionDurations();
            if (segmentEls[0]) segmentEls[0].classList.remove('hit');
            moveAcc = 0;
            if (running && !paused && lives > 0) spawnRound();
        }

        function handleFatalCollision() {
            if (respawning || !running || paused) return;
            respawning = true;
            lives--;
            updateHUD();
            if (segmentEls[0]) segmentEls[0].classList.add('hit');
            setTimeout(() => {
                resetSnakePosition();
                respawning = false;
            }, 550);
            checkGameOver();
        }

        function stepSnake() {
            if (snake.queuedDir) {
                const canTurn = snake.segments.length <= 1 || OPPOSITE[snake.queuedDir] !== snake.dir;
                if (canTurn) snake.dir = snake.queuedDir;
                snake.queuedDir = null;
            }
            if (!snake.dir) return;
            const d = DIRS[snake.dir];
            const head = snake.segments[0];
            const newRow = head.row + d.dr, newCol = head.col + d.dc;

            // Bord de la grille
            if (newRow < 0 || newRow >= GRID_ROWS || newCol < 0 || newCol >= GRID_COLS) {
                handleFatalCollision();
                return;
            }

            // Pastille présente à la nouvelle case ?
            let hitPellet = null;
            if (currentRound && !currentRound.ending) {
                hitPellet = currentRound.pellets.find(p => !p.consumed && p.row === newRow && p.col === newCol);
            }
            const growing = !!(hitPellet && hitPellet.correct);

            // Collision avec son propre corps (la queue se libère si le serpent ne grandit pas)
            const bodyToCheck = growing ? snake.segments : snake.segments.slice(0, -1);
            if (bodyToCheck.some(seg => seg.row === newRow && seg.col === newCol)) {
                handleFatalCollision();
                return;
            }

            // Déplacement
            snake.segments.unshift({ row: newRow, col: newCol });
            if (growing) {
                growSnakeTail();
            } else {
                snake.segments.pop();
            }
            renderSnakePositions(false);
            if (segmentEls[0]) segmentEls[0].style.transform = 'rotate(' + d.deg + 'deg)';

            if (hitPellet) handlePelletHit(hitPellet);
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
                moveAcc = 0; respawning = false;
                snake.segments = initialSegments();
                snake.dir = 'right'; snake.queuedDir = null;
                rebuildSnakeEls();
                applySpeedSelection();
                layoutGrid();
                applyTransitionDurations();
                if (segmentEls[0]) segmentEls[0].classList.remove('hit');
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
            document.removeEventListener('keydown', onKeyDown);
        }

        function endGame() {
            running = false;
            paused = true;
            showOverlay('🏁 Partie terminée !', 'Score final : ' + score + ' — Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            clearRound();
            applySpeedSelection();
            score = 0; lives = MAX_LIVES; running = false; paused = true;
            lastTime = null; moveAcc = 0; respawning = false;
            elapsedMs = 0; lastShownSeconds = -1;
            snake.segments = initialSegments();
            snake.dir = 'right'; snake.queuedDir = null;
            rebuildSnakeEls();
            layoutGrid();
            applyTransitionDurations();
            if (segmentEls[0]) segmentEls[0].classList.remove('hit');
            opEl.textContent = '❓ …';
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('🐍 Serpent des tables', 'Dirige le serpent vers la pastille qui porte le bon résultat, évite les mauvaises, les bords et ton propre corps !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);
                if (!respawning) {
                    moveAcc += dt;
                    let guard = 0;
                    while (moveAcc >= moveIntervalMs && guard < 8) { moveAcc -= moveIntervalMs; stepSnake(); guard++; }
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
            if (dir) { e.preventDefault(); snake.queuedDir = dir; }
        }
        document.addEventListener('keydown', onKeyDown);

        // ── Glisser (swipe) sur la grille ───────────────────────────────
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
            snake.queuedDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
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
                snake.queuedDir = dirKey;
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

            layoutGrid();
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
            if (type === 'jeu-tables-serpent') initJeuTablesSerpentWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-tables-serpent') initJeuTablesSerpentWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
