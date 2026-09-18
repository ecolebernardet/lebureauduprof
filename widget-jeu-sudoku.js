// =========================================================================
// WIDGET JEU DE SUDOKU — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-sudoku'.
// Algorithme de génération repris de gene_sudokus.html (backtracking +
// perçage de trous selon la difficulté).
// Design et fonctionnalités repris de widget-jeu-memory.js
// (redimensionnement libre, barre d'édition avec aide, réduire,
// plein écran board, fermer, panneau paramètres ouvert par défaut).
//
// Différence avec la version "générateur" (gene_sudokus.html) : ici
// l'élève ne tape pas les chiffres au clavier, il glisse une étiquette
// chiffre depuis le bandeau du bas jusque dans la case vide voulue
// (glisser-déposer tactile/souris via Pointer Events).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-sudoku.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-sudoku');toggleJeuxPanel()">
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
    if (!document.getElementById('widget-jeu-sudoku-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-sudoku-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-sudoku"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jsk-container {
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
            width: 760px;
            min-width: 340px;
            min-height: 420px;
        }

        /* ── État plein écran ── */
        .jsk-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── État plein écran, adapté au téléphone (voir widget-jeu-memory.js) ── */
        .jsk-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jsk-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jsk-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jsk-params-btn, .jsk-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .jsk-params-btn:hover, .jsk-help-btn:hover { background: #e0e0e0; color: #333; }
        .jsk-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .jsk-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jsk-help-popup.show { display: block; }
        .jsk-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jsk-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jsk-params-panel.show { display: flex; }
        .jsk-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .jsk-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jsk-size-group {
            display: flex; gap: 3px; background: #e9ecef; padding: 3px; border-radius: 8px;
        }
        .jsk-size-btn {
            padding: 5px 10px; border: none; border-radius: 6px;
            background: transparent; color: #374151; font-size: 11px; font-weight: 700;
            cursor: pointer; transition: background .15s, color .15s;
        }
        .jsk-size-btn.active { background: #4a90e2; color: white; }
        .jsk-difficulty {
            flex: 1; min-width: 90px; accent-color: #4a90e2; cursor: pointer;
        }
        .jsk-holes-count {
            background: #4a90e2; color: white; font-size: 10px; font-weight: 800;
            padding: 3px 8px; border-radius: 999px; white-space: nowrap;
        }
        .jsk-btn-generate {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #4a90e2; color: white; font-size: 11px; font-weight: 800;
            cursor: pointer; transition: background .15s, transform .1s;
        }
        .jsk-btn-generate:hover { background: #357abd; }
        .jsk-btn-generate:active { transform: scale(0.96); }

        /* ── HUD ── */
        .jsk-hud {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
            text-align: center;
            min-height: 16px;
        }
        .jsk-hud.jsk-status-ok  { color: #2e7d32; }
        .jsk-hud.jsk-status-bad { color: #c53030; }

        /* ── Zone de jeu ── */
        .jsk-board-zone {
            flex: 1;
            min-height: 140px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            border-radius: 12px;
            background: linear-gradient(180deg, #eef4ff 0%, #f7fbff 100%);
            border: 1.5px solid #d9e6f7;
            padding: 10px;
            box-sizing: border-box;
            position: relative;
            touch-action: none;
        }
        .jsk-grid-zone {
            flex: 1;
            min-height: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .jsk-grid-wrap {
            width: 320px;
            height: 320px;
            background: #000000;
            border: 2.5px solid #000000;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .jsk-grid {
            display: grid;
            width: 100%;
            height: 100%;
            gap: 0;
        }
        .jsk-cell {
            background: #ffffff;
            border: 0.5px solid rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--jsk-fs, 18px);
            font-weight: 900;
            color: #111827;
            box-sizing: border-box;
            transition: background-color .15s;
        }
        .jsk-cell.cell-fixed {
            color: #111827;
            opacity: 0.78;
        }
        .jsk-cell.cell-input {
            cursor: pointer;
            color: #1a4971;
            touch-action: none;
        }
        .jsk-cell.cell-input.jsk-drop-hover {
            background: #dbeafe;
        }
        .jsk-cell.cell-input.jsk-correct {
            color: #22c55e !important;
        }
        .jsk-cell.cell-input.jsk-incorrect {
            color: #ef4444 !important;
            background: #fef2f2;
        }
        .jsk-cell.cell-input.jsk-revealed {
            color: #994231 !important;
            background: #fff7ec;
            cursor: default;
        }

        /* ── Bandeau étiquettes chiffres ── */
        .jsk-tray {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            flex-shrink: 0;
            padding: 6px 4px 2px;
        }
        .jsk-tile {
            width: 40px; height: 40px;
            border-radius: 9px;
            background: #ffffff;
            border: 2px solid #4a90e2;
            color: #2c5282;
            font-size: 18px;
            font-weight: 900;
            display: flex; align-items: center; justify-content: center;
            cursor: grab;
            touch-action: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.12);
            transition: transform .1s, box-shadow .1s;
            flex-shrink: 0;
        }
        .jsk-tile:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.18); }
        .jsk-tile:active { cursor: grabbing; }
        .jsk-drag-ghost {
            position: fixed;
            width: 44px; height: 44px;
            border-radius: 10px;
            background: #4a90e2;
            color: white;
            font-size: 20px;
            font-weight: 900;
            display: flex; align-items: center; justify-content: center;
            pointer-events: none;
            z-index: 99999;
            box-shadow: 0 6px 16px rgba(0,0,0,0.35);
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.95;
        }

        /* ── Overlay fin de grille ── */
        .jsk-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.94);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
        }
        .jsk-overlay.hidden { display: none; }
        .jsk-overlay-title { font-size: 20px; font-weight: 800; color: #374151; }
        .jsk-overlay-sub { font-size: 13px; color: #6b7280; max-width: 340px; }
        .jsk-overlay-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #2e7d32; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
        }
        .jsk-overlay-btn:hover { background: #256428; }
        .jsk-overlay-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jsk-controls {
            display: flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jsk-btn {
            padding: 6px 14px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer; color: white;
            transition: background .15s, transform .1s;
        }
        .jsk-btn:active { transform: scale(0.96); }
        .jsk-btn-clear    { background: #6b7280; }
        .jsk-btn-clear:hover    { background: #4b5563; }
        .jsk-btn-check    { background: #22c55e; }
        .jsk-btn-check:hover    { background: #16a34a; }
        .jsk-btn-solution { background: #f97316; }
        .jsk-btn-solution:hover { background: #ea580c; }

        /* ── Mini confirmation (solution) ── */
        .jsk-confirm-popup {
            display: none; position: absolute;
            bottom: 46px; left: 50%; transform: translateX(-50%);
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            padding: 12px 14px; width: 240px;
            font-size: 12px; color: #374151; z-index: 25; text-align: center;
        }
        .jsk-confirm-popup.show { display: block; }
        .jsk-confirm-row { display: flex; gap: 8px; margin-top: 10px; }
        .jsk-confirm-row button {
            flex: 1; padding: 7px; border-radius: 7px; border: none;
            font-size: 11px; font-weight: 800; cursor: pointer; color: white;
        }
        .jsk-confirm-no  { background: #6b7280; }
        .jsk-confirm-yes { background: #f97316; }

        /* ── Poignée resize ── */
        .jsk-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jsk-container:hover .jsk-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-sudoku';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jsk-container">

  <!-- En-tête -->
  <div class="jsk-header">
    <span class="jsk-title">🧩 Sudoku</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jsk-params-btn" title="Paramètres">⚙</button>
      <button class="jsk-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jsk-params-panel">
    <div class="jsk-params-row">
      <label>Taille :</label>
      <div class="jsk-size-group">
        <button class="jsk-size-btn" data-size="4">4×4</button>
        <button class="jsk-size-btn" data-size="6">6×6</button>
        <button class="jsk-size-btn" data-size="9">9×9</button>
      </div>
      <label>Cases vides :</label>
      <input type="range" class="jsk-difficulty" min="15" max="55" value="35">
      <span class="jsk-holes-count">0 cases</span>
      <button class="jsk-btn-generate">🔄 Nouvelle grille</button>
    </div>
  </div>

  <!-- HUD -->
  <div class="jsk-hud">Glisse un chiffre de la barre du bas dans une case vide.</div>

  <!-- Zone de jeu -->
  <div class="jsk-board-zone">
    <div class="jsk-grid-zone">
      <div class="jsk-grid-wrap">
        <div class="jsk-grid"></div>
      </div>
    </div>
    <div class="jsk-tray"></div>

    <div class="jsk-overlay hidden">
      <div class="jsk-overlay-title">🏆 Bravo !</div>
      <div class="jsk-overlay-sub">Grille complétée sans erreur.</div>
      <button class="jsk-overlay-btn">🔄 Nouvelle grille</button>
    </div>

    <!-- Mini confirmation avant d'afficher la solution -->
    <div class="jsk-confirm-popup">
      <div>Afficher la solution complète ?</div>
      <div class="jsk-confirm-row">
        <button class="jsk-confirm-no">Non</button>
        <button class="jsk-confirm-yes">Oui</button>
      </div>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jsk-controls">
    <button class="jsk-btn jsk-btn-clear">🧹 Effacer mes réponses</button>
    <button class="jsk-btn jsk-btn-check">👁️ Correction</button>
    <button class="jsk-btn jsk-btn-solution">🔓 Solution</button>
  </div>

  <!-- Popup aide -->
  <div class="jsk-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Les réglages</p>
    <p style="margin:0 0 6px"><b>Taille</b> — Choisis la taille de la grille : 4×4, 6×6 ou 9×9.</p>
    <p style="margin:0 0 10px"><b>Cases vides</b> — Règle le curseur pour choisir la difficulté (plus il y a de cases vides, plus c'est difficile). Clique sur <b>🔄 Nouvelle grille</b> pour générer une nouvelle grille avec ces réglages.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px"><b>Glisse</b> une étiquette-chiffre de la barre du bas jusque dans la case vide de ton choix pour la déposer.</p>
    <p style="margin:0 0 6px">Pour <b>effacer</b> une case que tu as remplie, touche-la simplement (les cases grisées de départ ne peuvent pas être modifiées).</p>
    <p style="margin:0 0 6px"><b>👁️ Correction</b> colore en vert les bonnes réponses et en rouge les erreurs. <b>🔓 Solution</b> affiche la grille complète. <b>🧹 Effacer mes réponses</b> vide toutes les cases remplies par l'élève.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">Une grille complétée sans erreur affiche un message de réussite 🏆</p>
  </div>

  <!-- Poignée resize -->
  <div class="jsk-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuSudokuWidget = function (widget) {

        const container      = widget.querySelector('.jsk-container');
        const paramsBtn       = widget.querySelector('.jsk-params-btn');
        const paramsPanel     = widget.querySelector('.jsk-params-panel');
        const sizeBtns        = Array.from(widget.querySelectorAll('.jsk-size-btn'));
        const difficultyInput = widget.querySelector('.jsk-difficulty');
        const holesCountEl    = widget.querySelector('.jsk-holes-count');
        const generateBtn     = widget.querySelector('.jsk-btn-generate');
        const helpBtn         = widget.querySelector('.jsk-help-btn');
        const helpPopup       = widget.querySelector('.jsk-help-popup');
        const resizeHandle    = widget.querySelector('.jsk-resize-handle');
        const hudEl            = widget.querySelector('.jsk-hud');
        const boardZone        = widget.querySelector('.jsk-board-zone');
        const gridZone          = widget.querySelector('.jsk-grid-zone');
        const gridWrap          = widget.querySelector('.jsk-grid-wrap');
        const gridEl             = widget.querySelector('.jsk-grid');
        const trayEl            = widget.querySelector('.jsk-tray');
        const overlay           = widget.querySelector('.jsk-overlay');
        const overlayBtn        = widget.querySelector('.jsk-overlay-btn');
        const clearBtn          = widget.querySelector('.jsk-btn-clear');
        const checkBtn          = widget.querySelector('.jsk-btn-check');
        const solutionBtn       = widget.querySelector('.jsk-btn-solution');
        const confirmPopup      = widget.querySelector('.jsk-confirm-popup');
        const confirmYes        = widget.querySelector('.jsk-confirm-yes');
        const confirmNo         = widget.querySelector('.jsk-confirm-no');

        // ── État du jeu ──────────────────────────────────────────────────
        let currentSize   = 9;
        let currentGrid   = null;  // { puzzle, solution, size, blockWidth, blockHeight }
        let cellEls       = [];    // référence [r][c] -> élément .jsk-cell
        let solved        = false;
        let destroyed     = false;

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

        // ── Paramètres (toujours affichés, comme widget-jeu-memory) ──────
        paramsPanel.classList.add('show');
        if (paramsBtn) { paramsBtn.classList.add('active'); paramsBtn.style.display = 'none'; }
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());

        function setActiveSizeBtn() {
            sizeBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.size, 10) === currentSize));
        }
        function updateHolesDisplay() {
            const holes = computeHoles(currentSize, parseInt(difficultyInput.value, 10));
            holesCountEl.textContent = holes + ' cases';
        }
        sizeBtns.forEach(btn => {
            makeTap(btn, () => {
                currentSize = parseInt(btn.dataset.size, 10);
                setActiveSizeBtn();
                updateHolesDisplay();
            });
        });
        difficultyInput.addEventListener('pointerdown', (e) => e.stopPropagation());
        difficultyInput.addEventListener('input', updateHolesDisplay);
        setActiveSizeBtn();
        updateHolesDisplay();

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // =====================================================================
        // ALGORITHME DE GÉNÉRATION (repris de gene_sudokus.html)
        // =====================================================================
        function computeHoles(size, difficultyPercent) {
            let holes = Math.floor((difficultyPercent / 100) * (size * size));
            const maxHoles = Math.floor((size * size) * 0.75);
            if (holes > maxHoles) holes = maxHoles;
            if (size === 4 && holes > 11) holes = 11;
            return holes;
        }

        function generateSudokuData(size, difficultyPercent) {
            const blockWidth  = (size === 6 || size === 9) ? 3 : 2;
            const blockHeight = (size === 4 || size === 6) ? 2 : 3;
            let grid = Array.from({ length: size }, () => Array(size).fill(0));

            const isValid = (grid, row, col, value) => {
                for (let i = 0; i < size; i++) {
                    if (grid[row][i] === value || grid[i][col] === value) return false;
                }
                let startRow = Math.floor(row / blockHeight) * blockHeight;
                let startCol = Math.floor(col / blockWidth) * blockWidth;
                for (let i = 0; i < blockHeight; i++) {
                    for (let j = 0; j < blockWidth; j++) {
                        if (grid[i + startRow][j + startCol] === value) return false;
                    }
                }
                return true;
            };

            const solve = (grid) => {
                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        if (grid[row][col] === 0) {
                            let numbers = Array.from({ length: size }, (_, i) => i + 1)
                                .sort(() => Math.random() - 0.5);
                            for (let value of numbers) {
                                if (isValid(grid, row, col, value)) {
                                    grid[row][col] = value;
                                    if (solve(grid)) return true;
                                    grid[row][col] = 0;
                                }
                            }
                            return false;
                        }
                    }
                }
                return true;
            };

            solve(grid);

            let puzzle = grid.map(row => [...row]);
            let holes = computeHoles(size, difficultyPercent);

            while (holes > 0) {
                let row = Math.floor(Math.random() * size);
                let col = Math.floor(Math.random() * size);
                if (puzzle[row][col] !== 0) {
                    puzzle[row][col] = 0;
                    holes--;
                }
            }

            return { solution: grid, puzzle: puzzle, size: size, blockWidth: blockWidth, blockHeight: blockHeight };
        }

        // =====================================================================
        // RENDU DE LA GRILLE
        // =====================================================================
        function buildGridDOM(data) {
            gridEl.innerHTML = '';
            gridEl.style.gridTemplateColumns = `repeat(${data.size}, 1fr)`;
            gridEl.style.gridTemplateRows = `repeat(${data.size}, 1fr)`;
            cellEls = Array.from({ length: data.size }, () => Array(data.size).fill(null));

            data.puzzle.forEach((row, r) => {
                row.forEach((val, c) => {
                    const cell = document.createElement('div');
                    cell.dataset.r = r;
                    cell.dataset.c = c;

                    let borderStyle = '';
                    if ((c + 1) % data.blockWidth === 0 && (c + 1) < data.size) {
                        borderStyle += 'border-right:2.5px solid #000000;';
                    }
                    if ((r + 1) % data.blockHeight === 0 && (r + 1) < data.size) {
                        borderStyle += 'border-bottom:2.5px solid #000000;';
                    }
                    cell.style.cssText = borderStyle;

                    if (val !== 0) {
                        cell.className = 'jsk-cell cell-fixed';
                        cell.textContent = val;
                    } else {
                        cell.className = 'jsk-cell cell-input';
                        cell.dataset.ans = data.solution[r][c];
                    }
                    gridEl.appendChild(cell);
                    cellEls[r][c] = cell;
                });
            });
        }

        function buildTray(size) {
            trayEl.innerHTML = '';
            for (let v = 1; v <= size; v++) {
                const tile = document.createElement('div');
                tile.className = 'jsk-tile';
                tile.dataset.value = v;
                tile.textContent = v;
                trayEl.appendChild(tile);
                attachTileDrag(tile);
            }
        }

        // =====================================================================
        // GLISSER-DÉPOSER (Pointer Events, souris + tactile + stylet)
        // =====================================================================
        let hoveredCell = null;

        function clearHover() {
            if (hoveredCell) { hoveredCell.classList.remove('jsk-drop-hover'); hoveredCell = null; }
        }

        function cellAtPoint(x, y) {
            const el = document.elementFromPoint(x, y);
            if (!el) return null;
            return el.closest('.jsk-cell.cell-input');
        }

        function attachTileDrag(tile) {
            tile.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (solved) return;
                const value = tile.dataset.value;
                const pid = e.pointerId;

                const ghost = document.createElement('div');
                ghost.className = 'jsk-drag-ghost';
                ghost.textContent = value;
                ghost.style.left = e.clientX + 'px';
                ghost.style.top  = e.clientY + 'px';
                document.body.appendChild(ghost);

                function onMove(ev) {
                    if (ev.pointerId !== pid) return;
                    ghost.style.left = ev.clientX + 'px';
                    ghost.style.top  = ev.clientY + 'px';
                    const cell = cellAtPoint(ev.clientX, ev.clientY);
                    if (cell !== hoveredCell) {
                        clearHover();
                        if (cell && !cell.classList.contains('jsk-revealed')) {
                            cell.classList.add('jsk-drop-hover');
                            hoveredCell = cell;
                        }
                    }
                }
                function onUp(eu) {
                    if (eu.pointerId !== pid) return;
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup',   onUp);
                    document.removeEventListener('pointercancel', onUp);
                    ghost.remove();
                    const cell = cellAtPoint(eu.clientX, eu.clientY);
                    clearHover();
                    if (cell && !cell.classList.contains('jsk-revealed')) {
                        placeValue(cell, value);
                    }
                }
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup',   onUp);
                document.addEventListener('pointercancel', onUp);
            });
        }

        function placeValue(cell, value) {
            cell.textContent = value;
            cell.classList.add('filled');
            cell.classList.remove('jsk-correct', 'jsk-incorrect');
            updateHUD();
        }

        function clearCell(cell) {
            cell.textContent = '';
            cell.classList.remove('filled', 'jsk-correct', 'jsk-incorrect');
            updateHUD();
        }

        // Tap sur une case remplie par l'élève => l'efface
        gridEl.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            const cell = e.target.closest('.jsk-cell.cell-input.filled');
            if (!cell || solved || cell.classList.contains('jsk-revealed')) return;
            const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
            function onUp(eu) {
                if (eu.pointerId !== pid) return;
                cell.removeEventListener('pointerup',     onUp);
                cell.removeEventListener('pointercancel', onUp);
                const dx = eu.clientX - sx, dy = eu.clientY - sy;
                if (Math.sqrt(dx*dx + dy*dy) < 10) {
                    clearCell(cell);
                }
            }
            cell.addEventListener('pointerup',     onUp);
            cell.addEventListener('pointercancel', onUp);
        });

        // =====================================================================
        // HUD / STATUT
        // =====================================================================
        function setHudMessage(text, mode) {
            hudEl.textContent = text;
            hudEl.classList.remove('jsk-status-ok', 'jsk-status-bad');
            if (mode === 'ok')  hudEl.classList.add('jsk-status-ok');
            if (mode === 'bad') hudEl.classList.add('jsk-status-bad');
        }

        function updateHUD() {
            if (!currentGrid) return;
            let total = 0, filled = 0;
            currentGrid.puzzle.forEach(row => row.forEach(v => { if (v === 0) total++; }));
            gridEl.querySelectorAll('.jsk-cell.cell-input.filled').forEach(() => filled++);
            if (solved) return;
            setHudMessage('📝 ' + filled + ' / ' + total + ' cases complétées');
        }

        // =====================================================================
        // CORRECTION / SOLUTION
        // =====================================================================
        function showCorrection() {
            if (!currentGrid || solved) return;
            let hasError = false, isComplete = true;
            gridEl.querySelectorAll('.jsk-cell.cell-input').forEach(cell => {
                cell.classList.remove('jsk-correct', 'jsk-incorrect');
                if (!cell.classList.contains('filled')) { isComplete = false; return; }
                const val = cell.textContent.trim();
                const ans = String(cell.dataset.ans);
                if (val === ans) {
                    cell.classList.add('jsk-correct');
                } else {
                    cell.classList.add('jsk-incorrect');
                    hasError = true;
                }
            });
            if (isComplete && !hasError) {
                showWinOverlay();
            } else if (!isComplete) {
                setHudMessage('👁️ Continue, il reste des cases vides.', null);
            } else {
                setHudMessage('👁️ Des erreurs sont indiquées en rouge.', 'bad');
            }
        }

        function revealSolution() {
            if (!currentGrid) return;
            gridEl.querySelectorAll('.jsk-cell.cell-input').forEach(cell => {
                const r = parseInt(cell.dataset.r, 10), c = parseInt(cell.dataset.c, 10);
                cell.textContent = currentGrid.solution[r][c];
                cell.classList.add('filled', 'jsk-revealed');
                cell.classList.remove('jsk-correct', 'jsk-incorrect');
            });
            solved = true;
            setHudMessage('🔓 Solution affichée.', null);
        }

        function clearAnswers() {
            if (!currentGrid || solved) return;
            gridEl.querySelectorAll('.jsk-cell.cell-input').forEach(cell => clearCell(cell));
            updateHUD();
        }

        function showWinOverlay() {
            overlay.classList.remove('hidden');
            setHudMessage('🏆 Bravo, grille complétée !', 'ok');
        }
        function hideOverlay() {
            overlay.classList.add('hidden');
        }

        // =====================================================================
        // GÉNÉRATION D'UNE NOUVELLE GRILLE
        // =====================================================================
        function generateNewGrid() {
            hideOverlay();
            solved = false;
            const difficultyPercent = parseInt(difficultyInput.value, 10);
            currentGrid = generateSudokuData(currentSize, difficultyPercent);
            buildGridDOM(currentGrid);
            buildTray(currentSize);
            updateGridSize();
            updateHUD();
        }

        makeTap(generateBtn, generateNewGrid);
        makeTap(overlayBtn, generateNewGrid);
        makeTap(clearBtn, clearAnswers);
        makeTap(checkBtn, showCorrection);

        // ── Confirmation avant d'afficher la solution ──────────────────────
        makeTap(solutionBtn, () => { confirmPopup.classList.add('show'); });
        makeTap(confirmNo,  () => { confirmPopup.classList.remove('show'); });
        makeTap(confirmYes, () => { confirmPopup.classList.remove('show'); revealSolution(); });
        document.addEventListener('pointerdown', (e) => {
            if (!confirmPopup.contains(e.target) && e.target !== solutionBtn) confirmPopup.classList.remove('show');
        });

        // =====================================================================
        // TAILLE DE LA GRILLE / POLICE (adaptatif)
        // =====================================================================
        function updateGridSize() {
            const size = currentGrid ? currentGrid.size : currentSize;
            const availW = Math.max(80, gridZone.clientWidth - 4);
            const availH = Math.max(80, gridZone.clientHeight - 4);
            const side = Math.max(120, Math.min(availW, availH));
            gridWrap.style.width  = side + 'px';
            gridWrap.style.height = side + 'px';
            const cellPx = side / size;
            const fs = Math.max(9, Math.min(30, Math.round(cellPx * 0.46)));
            container.style.setProperty('--jsk-fs', fs + 'px');
        }

        // ── Boutons fenêtre ───────────────────────────────────────────────
        const wfMin   = container.querySelector('[data-role="wf-min"]');
        const wfMax   = container.querySelector('[data-role="wf-max"]');
        const wfClose = container.querySelector('[data-role="wf-close"]');

        let _savedW = null, _savedH = null, _isMax = false;

        if (wfMin) {
            makeTap(wfMin, () => {
                if (_isMax) {
                    _isMax = false;
                    container.classList.remove('wf-fullboard');
                    container.classList.remove('jti-mobile');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                    updateGridSize();
                }
                window._wfMiniBarCollapse(widget, '🧩 Sudoku', {
                    onExpand: updateGridSize
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
                updateGridSize();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                destroyed = true;
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
                container.style.width  = Math.max(340, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(420, startH + ev.clientY - startY) + 'px';
                updateGridSize();
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
        window.addEventListener('resize', () => updateGridSize());

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
                if (!container.style.height) container.style.height = '560px';
            } else {
                // Sur PC, taille de départ cohérente avec les autres jeux du board.
                container.style.width  = '760px';
                container.style.height = '700px';
            }

            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            }

            generateNewGrid();
            paramsPanel.classList.add('show');
            if (paramsBtn) paramsBtn.classList.add('active');
        }));

        // ── Nettoyage si le widget est retiré du DOM autrement que via wfClose ──
        const _observer = new MutationObserver(() => {
            if (!document.body.contains(widget)) {
                destroyed = true;
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
            if (type === 'jeu-sudoku') initJeuSudokuWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-sudoku') initJeuSudokuWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
