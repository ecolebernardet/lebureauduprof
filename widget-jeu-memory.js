// =========================================================================
// WIDGET JEU DE MEMORY — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-memory'.
// Design et fonctionnalités repris de widget-jeu-tables-multi.js
// (redimensionnement libre, barre d'édition avec aide, réduire,
// plein écran board, fermer, panneau paramètres ouvert par défaut).
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-jeu-memory.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-memory');toggleJeuxPanel()">
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
    if (!document.getElementById('widget-jeu-memory-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-memory-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-memory"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jmm-container {
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
        .jmm-container.wf-fullboard {
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
           faut donc pas descendre en dessous pour ne pas les recouvrir.
           min-width est aussi annulé : sans ça, le min-width fixe pensé
           pour desktop empêchait le conteneur de rétrécir sous l'écran
           du téléphone et le faisait déborder à droite. */
        .jmm-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jmm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jmm-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jmm-params-btn, .jmm-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .jmm-params-btn:hover, .jmm-help-btn:hover { background: #e0e0e0; color: #333; }
        .jmm-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .jmm-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jmm-help-popup.show { display: block; }
        .jmm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jmm-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jmm-params-panel.show { display: flex; }
        .jmm-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .jmm-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jmm-content-select, .jmm-pairs-select, .jmm-color-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white;
        }
        .jmm-content-select:focus, .jmm-pairs-select:focus, .jmm-color-select:focus { border-color: #4a90e2; }
        .jmm-custom-row { display: none; flex-direction: column; align-items: stretch; gap: 4px; }
        .jmm-custom-row.show { display: flex; }
        .jmm-custom-textarea {
            width: 100%; box-sizing: border-box;
            min-height: 74px; resize: vertical;
            border: 1px solid #d1d5db; border-radius: 8px;
            padding: 7px 9px; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none;
        }
        .jmm-custom-textarea:focus { border-color: #4a90e2; }
        .jmm-custom-hint { font-size: 10px; color: #888; }
        .jmm-custom-hint.ok { color: #2e7d32; }
        .jmm-custom-hint.bad { color: #c53030; }

        /* ── HUD ── */
        .jmm-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jmm-moves { color: #374151; }
        .jmm-timer { color: #374151; font-variant-numeric: tabular-nums; }
        .jmm-matches { color: #2e7d32; }

        /* ── Zone de jeu ── */
        .jmm-board-zone {
            flex: 1;
            min-height: 140px;
            position: relative;
            border-radius: 12px;
            background: linear-gradient(180deg, #eef4ff 0%, #f7fbff 100%);
            border: 1.5px solid #d9e6f7;
            overflow: hidden;
            padding: 10px;
            box-sizing: border-box;
        }
        .jmm-grid {
            display: grid;
            gap: var(--jmm-gap, 8px);
            grid-template-columns: repeat(var(--jmm-cols, 4), var(--jmm-cell, 1fr));
            grid-auto-rows: var(--jmm-cell, 90px);
            justify-content: center;
            align-content: center;
            height: 100%;
        }

        /* ── Carte ── */
        .jmm-card {
            width: 100%;
            height: 100%;
            perspective: 700px;
            cursor: pointer;
            /* reset des styles natifs de <button> */
            display: block;
            background: none;
            border: none;
            padding: 0;
            margin: 0;
            font: inherit;
            outline: none;
            -webkit-tap-highlight-color: transparent;
        }
        .jmm-card.matched { cursor: default; }
        .jmm-card-inner {
            position: relative;
            width: 100%; height: 100%;
            transition: transform .4s cubic-bezier(.4,0,.2,1);
            transform-style: preserve-3d;
            pointer-events: none;
        }
        .jmm-card.flipped .jmm-card-inner,
        .jmm-card.matched .jmm-card-inner {
            transform: rotateY(180deg);
        }
        .jmm-card-face {
            position: absolute; inset: 0;
            backface-visibility: hidden;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            text-align: center;
            box-sizing: border-box;
            padding: 4px;
            font-weight: 800;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .jmm-card-back {
            background: radial-gradient(circle at 35% 30%, #90cdf4, #3182ce 70%, #2c5282);
            border: 2px solid #2b6cb0;
            color: white;
            font-size: 22px;
        }
        .jmm-card-front {
            background: var(--jmm-card-bg, white);
            border: 2px solid var(--jmm-card-border, #d1d5db);
            color: var(--jmm-card-text, #374151);
            transform: rotateY(180deg);
            font-size: var(--jmm-fs, 15px);
            word-break: break-word;
        }
        .jmm-card-front-flag {
            font-size: calc(var(--jmm-fs, 15px) * 2.4);
        }
        .jmm-frac {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            line-height: 1.15;
        }
        .jmm-frac-num {
            border-bottom: 2px solid currentColor;
            padding: 0 4px 2px;
        }
        .jmm-frac-den {
            padding: 2px 4px 0;
        }
        .jmm-card.matched .jmm-card-front {
            animation: jmm-pop .35s ease;
        }
        .jmm-card.mismatch .jmm-card-inner {
            animation: jmm-shake .35s ease;
        }
        @keyframes jmm-pop {
            0%   { filter: brightness(1); }
            50%  { filter: brightness(1.25); }
            100% { filter: brightness(1); }
        }
        @keyframes jmm-shake {
            0%,100% { transform: rotateY(180deg) translateX(0); }
            25%     { transform: rotateY(180deg) translateX(-6px); }
            75%     { transform: rotateY(180deg) translateX(6px); }
        }

        /* ── Overlay démarrage / fin de partie ── */
        .jmm-overlay {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 10px;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(1px);
            z-index: 10;
            text-align: center;
            padding: 14px;
            border-radius: 12px;
        }
        .jmm-overlay.hidden { display: none; }
        .jmm-overlay-title { font-size: 18px; font-weight: 800; color: #374151; }
        .jmm-overlay-sub { font-size: 13px; color: #6b7280; max-width: 340px; }
        .jmm-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #4a90e2; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
        }
        .jmm-start-btn:hover { background: #357abd; }
        .jmm-start-btn:active { transform: scale(0.96); }
        .jmm-start-btn:disabled { background: #b7c6d9; cursor: not-allowed; }

        /* ── Barre contrôles bas ── */
        .jmm-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jmm-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jmm-btn:active { transform: scale(0.96); }
        .jmm-btn-reset { background: #6b7280; color: white; }
        .jmm-btn-reset:hover { background: #4b5563; }
        .jmm-btn-pause { background: #4a90e2; color: white; }
        .jmm-btn-pause:hover { background: #357abd; }

        /* ── Poignée resize ── */
        .jmm-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jmm-container:hover .jmm-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-memory';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jmm-container">

  <!-- En-tête -->
  <div class="jmm-header">
    <span class="jmm-title">🧠 Jeu de memory</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jmm-params-btn" title="Paramètres">⚙</button>
      <button class="jmm-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jmm-params-panel">
    <div class="jmm-params-row">
      <label>Contenu des paires :</label>
      <select class="jmm-content-select">
        <option value="tables">✖️ Tables de multiplication</option>
        <option value="division">➗ Divisions</option>
        <option value="doubles">✳️ Doubles</option>
        <option value="decimaux">🔢 Fractions décimales et nombres décimaux</option>
        <option value="romains">🏛️ Nombres romains</option>
        <option value="nature">🔤 Nature des mots</option>
        <option value="conjugaison">📖 Conjugaison</option>
        <option value="capitales">🌍 Pays et capitales</option>
        <option value="drapeaux">🚩 Drapeaux et pays</option>
        <option value="synonymes">🔗 Synonymes</option>
        <option value="antonymes">↔️ Antonymes (contraires)</option>
        <option value="custom">✏️ Personnalisé</option>
      </select>
      <label>Nombre de paires :</label>
      <select class="jmm-pairs-select">
        <option value="6">6</option>
        <option value="8" selected>8</option>
        <option value="10">10</option>
        <option value="12">12</option>
      </select>
      <label>Cartes :</label>
      <select class="jmm-color-select">
        <option value="colored" selected>🎨 Colorées</option>
        <option value="plain">⬜ Sans couleur</option>
      </select>
    </div>
    <div class="jmm-params-row jmm-custom-row">
      <label>Mes paires (une par ligne, format « recto ; verso ») :</label>
      <textarea class="jmm-custom-textarea" placeholder="Paris ; France&#10;Rome ; Italie&#10;Berlin ; Allemagne"></textarea>
      <div class="jmm-custom-hint">Saisis au moins 3 paires.</div>
    </div>
  </div>

  <!-- HUD -->
  <div class="jmm-hud">
    <span class="jmm-moves">🔄 Essais : 0</span>
    <span class="jmm-timer">⏱️ 00:00</span>
    <span class="jmm-matches">✅ 0/8</span>
  </div>

  <!-- Zone de jeu -->
  <div class="jmm-board-zone">
    <div class="jmm-grid"></div>
    <div class="jmm-overlay">
      <div class="jmm-overlay-title">🧠 Jeu de memory</div>
      <div class="jmm-overlay-sub">Retrouve les paires en retournant deux cartes à la fois !</div>
      <button class="jmm-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jmm-controls">
    <button class="jmm-btn jmm-btn-reset">🔄 Réinitialiser</button>
    <button class="jmm-btn jmm-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jmm-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Contenu des paires</b> — Tables de multiplication (opération / résultat), Divisions (opération / résultat, inverse des tables), Doubles (nombre / son double), Fractions décimales et nombres décimaux (ex. 7/10 / 0,7), Nombres romains (ex. XIV / 14), Nature des mots (mot / classe grammaticale), Conjugaison (infinitif + pronom / forme conjuguée au présent), Pays et capitales, Drapeaux et pays, Synonymes, Antonymes, ou Personnalisé (tape tes propres paires, une par ligne, au format « recto ; verso »).</p>
    <p style="margin:0 0 10px"><b>Nombre de paires</b> — Choisis la taille de la grille (6 à 12 paires, soit 12 à 24 cartes). Non applicable en mode Personnalisé : le nombre de paires dépend alors de ce que tu as saisi.</p>
    <p style="margin:0 0 10px"><b>Cartes</b> — En mode <i>Colorées</i>, chaque paire a sa propre couleur une fois retournée, ce qui peut aider à repérer les paires. Choisis <i>Sans couleur</i> pour un jeu plus exigeant, où seul le contenu compte.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Clique sur deux cartes pour les retourner. Si elles forment une paire, elles restent révélées. Sinon, elles se retournent après un court instant.</p>
    <p style="margin:0 0 6px">Le nombre d'essais et le temps écoulé sont affichés en haut. Retrouve toutes les paires pour gagner !</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">Clique sur <b>🔄 Réinitialiser</b> pour rejouer avec une nouvelle grille.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jmm-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuMemoryWidget = function (widget) {

        const container      = widget.querySelector('.jmm-container');
        const paramsBtn       = widget.querySelector('.jmm-params-btn');
        const paramsPanel     = widget.querySelector('.jmm-params-panel');
        const contentSelect   = widget.querySelector('.jmm-content-select');
        const pairsSelect     = widget.querySelector('.jmm-pairs-select');
        const colorSelect     = widget.querySelector('.jmm-color-select');
        const customRow       = widget.querySelector('.jmm-custom-row');
        const customTextarea  = widget.querySelector('.jmm-custom-textarea');
        const customHint      = widget.querySelector('.jmm-custom-hint');
        const helpBtn         = widget.querySelector('.jmm-help-btn');
        const helpPopup       = widget.querySelector('.jmm-help-popup');
        const resizeHandle    = widget.querySelector('.jmm-resize-handle');
        const movesEl         = widget.querySelector('.jmm-moves');
        const timerEl         = widget.querySelector('.jmm-timer');
        const matchesEl       = widget.querySelector('.jmm-matches');
        const boardZone       = widget.querySelector('.jmm-board-zone');
        const grid             = widget.querySelector('.jmm-grid');
        const overlay          = widget.querySelector('.jmm-overlay');
        const overlayTitle     = widget.querySelector('.jmm-overlay-title');
        const overlaySub       = widget.querySelector('.jmm-overlay-sub');
        const startBtn         = widget.querySelector('.jmm-start-btn');
        const resetBtn         = widget.querySelector('.jmm-btn-reset');
        const pauseBtn         = widget.querySelector('.jmm-btn-pause');

        // ── Palette de couleurs par paire (cohérente avec le jeu des tables) ──
        const PAIR_COLORS = [
            { bg: '#e6f3ff', border: '#3182ce', text: '#1a4971' }, // bleu
            { bg: '#fff0f0', border: '#e53e3e', text: '#822727' }, // rouge
            { bg: '#eefcf0', border: '#38a169', text: '#1e5e2e' }, // vert
            { bg: '#fff7ec', border: '#dd6b20', text: '#7b341e' }, // orange
            { bg: '#f6f0ff', border: '#805ad5', text: '#44337a' }, // violet
            { bg: '#effcfb', border: '#319795', text: '#1d4044' }, // turquoise
            { bg: '#fff5f7', border: '#d53f8c', text: '#702459' }, // rose
            { bg: '#fefce8', border: '#ca8a04', text: '#713f12' }, // jaune
        ];

        // ── État du jeu ──────────────────────────────────────────────────
        let cards          = [];   // { id, pairId, text, colorIdx, matched, el, innerEl }
        let flipped        = [];   // cartes actuellement retournées (max 2)
        let moves          = 0;
        let matches        = 0;
        let totalPairs     = 8;
        let running        = false;
        let paused         = true;
        let locked         = false; // verrou pendant l'évaluation d'une paire
        let elapsedMs      = 0;
        let lastShownSeconds = -1;
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;

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

        function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

        // ── Paramètres (toujours affichés) ──────────────────────────────
        paramsPanel.classList.add('show');
        paramsBtn.classList.add('active');
        if (paramsBtn) paramsBtn.style.display = 'none';
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        contentSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        pairsSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        colorSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        customTextarea.addEventListener('pointerdown', (e) => e.stopPropagation());

        function refreshCustomVisibility() {
            const isCustom = contentSelect.value === 'custom';
            customRow.classList.toggle('show', isCustom);
            pairsSelect.disabled = isCustom;
            pairsSelect.style.opacity = isCustom ? '0.5' : '1';
            updateCustomHint();
        }
        function parseCustomPairs() {
            const lines = customTextarea.value.split('\n').map(l => l.trim()).filter(Boolean);
            const pairs = [];
            lines.forEach(line => {
                const sep = line.includes(';') ? ';' : (line.includes('=') ? '=' : null);
                if (!sep) return;
                const parts = line.split(sep);
                if (parts.length < 2) return;
                const a = parts[0].trim(), b = parts.slice(1).join(sep).trim();
                if (a && b) pairs.push([a, b]);
            });
            return pairs.slice(0, 15);
        }
        function updateCustomHint() {
            if (contentSelect.value !== 'custom') return;
            const n = parseCustomPairs().length;
            customHint.textContent = n + ' paire(s) valide(s) détectée(s)' + (n < 3 ? ' — ajoute au moins 3 paires.' : '.');
            customHint.classList.toggle('ok', n >= 3);
            customHint.classList.toggle('bad', n < 3);
        }
        contentSelect.addEventListener('change', refreshCustomVisibility);
        customTextarea.addEventListener('input', updateCustomHint);
        refreshCustomVisibility();

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // ── Taille de police / grille adaptative ───────────────────────────
        function applyFontScale() {
            updateGridColumns();
        }

        // Choisit le nombre de colonnes et la taille de carte qui permettent
        // d'afficher TOUTES les cartes en même temps, sans avoir à scroller,
        // en tenant compte à la fois de la largeur ET de la hauteur disponibles.
        function updateGridColumns() {
            const nCards = cards.length || (totalPairs * 2) || 16;
            const gap = 8;
            const zoneW = Math.max(60, (boardZone.clientWidth  || 600) - 20);
            const zoneH = Math.max(60, (boardZone.clientHeight || 300) - 20);

            let bestCols = 4, bestSize = 0;
            const maxCols = Math.min(nCards, 12);
            for (let c = 1; c <= maxCols; c++) {
                const rows = Math.ceil(nCards / c);
                const cellW = (zoneW - gap * (c - 1)) / c;
                const cellH = (zoneH - gap * (rows - 1)) / rows;
                const size = Math.min(cellW, cellH);
                if (size > bestSize) { bestSize = size; bestCols = c; }
            }

            const cellPx = Math.max(36, Math.floor(bestSize));
            container.style.setProperty('--jmm-cols', bestCols);
            container.style.setProperty('--jmm-cell', cellPx + 'px');
            container.style.setProperty('--jmm-gap', gap + 'px');

            const fs = Math.max(9, Math.min(20, Math.round(cellPx * 0.19)));
            container.style.setProperty('--jmm-fs', fs + 'px');
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
                window._wfMiniBarCollapse(widget, '🧠 Jeu de memory', {
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
        window.addEventListener('resize', () => updateGridColumns());

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
            movesEl.textContent = '🔄 Essais : ' + moves;
            matchesEl.textContent = '✅ ' + matches + '/' + totalPairs;
        }
        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        // ── Banque de pays et capitales (pour le mode "🌍 Pays et capitales") ──
        const COUNTRY_CAPITALS = [
            ['France', 'Paris'], ['Espagne', 'Madrid'], ['Italie', 'Rome'],
            ['Allemagne', 'Berlin'], ['Portugal', 'Lisbonne'], ['Royaume-Uni', 'Londres'],
            ['Belgique', 'Bruxelles'], ['Pays-Bas', 'Amsterdam'], ['Suisse', 'Berne'],
            ['Autriche', 'Vienne'], ['Grèce', 'Athènes'], ['Irlande', 'Dublin'],
            ['Pologne', 'Varsovie'], ['Suède', 'Stockholm'], ['Norvège', 'Oslo'],
            ['Danemark', 'Copenhague'], ['Finlande', 'Helsinki'], ['Russie', 'Moscou'],
            ['Ukraine', 'Kiev'], ['Roumanie', 'Bucarest'], ['Hongrie', 'Budapest'],
            ['République tchèque', 'Prague'], ['Islande', 'Reykjavik'], ['Turquie', 'Ankara'],
            ['Maroc', 'Rabat'], ['Algérie', 'Alger'], ['Tunisie', 'Tunis'],
            ['Égypte', 'Le Caire'], ['Sénégal', 'Dakar'], ['Côte d\'Ivoire', 'Yamoussoukro'],
            ['Mali', 'Bamako'], ['Nigeria', 'Abuja'], ['Kenya', 'Nairobi'],
            ['Afrique du Sud', 'Pretoria'], ['Madagascar', 'Antananarivo'],
            ['États-Unis', 'Washington'], ['Canada', 'Ottawa'], ['Mexique', 'Mexico'],
            ['Brésil', 'Brasilia'], ['Argentine', 'Buenos Aires'], ['Chili', 'Santiago'],
            ['Pérou', 'Lima'], ['Colombie', 'Bogota'],
            ['Chine', 'Pékin'], ['Japon', 'Tokyo'], ['Inde', 'New Delhi'],
            ['Corée du Sud', 'Séoul'], ['Vietnam', 'Hanoï'], ['Thaïlande', 'Bangkok'],
            ['Indonésie', 'Jakarta'], ['Australie', 'Canberra'],
        ];

        // ── Banque de drapeaux et pays (pour le mode "🚩 Drapeaux et pays") ──
        const COUNTRY_FLAGS = [
            ['🇫🇷', 'France'], ['🇪🇸', 'Espagne'], ['🇮🇹', 'Italie'],
            ['🇩🇪', 'Allemagne'], ['🇵🇹', 'Portugal'], ['🇬🇧', 'Royaume-Uni'],
            ['🇧🇪', 'Belgique'], ['🇳🇱', 'Pays-Bas'], ['🇨🇭', 'Suisse'],
            ['🇦🇹', 'Autriche'], ['🇬🇷', 'Grèce'], ['🇮🇪', 'Irlande'],
            ['🇵🇱', 'Pologne'], ['🇸🇪', 'Suède'], ['🇳🇴', 'Norvège'],
            ['🇩🇰', 'Danemark'], ['🇫🇮', 'Finlande'], ['🇷🇺', 'Russie'],
            ['🇺🇦', 'Ukraine'], ['🇷🇴', 'Roumanie'], ['🇭🇺', 'Hongrie'],
            ['🇨🇿', 'République tchèque'], ['🇮🇸', 'Islande'], ['🇹🇷', 'Turquie'],
            ['🇲🇦', 'Maroc'], ['🇩🇿', 'Algérie'], ['🇹🇳', 'Tunisie'],
            ['🇪🇬', 'Égypte'], ['🇸🇳', 'Sénégal'], ['🇨🇮', 'Côte d\'Ivoire'],
            ['🇲🇱', 'Mali'], ['🇳🇬', 'Nigeria'], ['🇰🇪', 'Kenya'],
            ['🇿🇦', 'Afrique du Sud'], ['🇲🇬', 'Madagascar'],
            ['🇺🇸', 'États-Unis'], ['🇨🇦', 'Canada'], ['🇲🇽', 'Mexique'],
            ['🇧🇷', 'Brésil'], ['🇦🇷', 'Argentine'], ['🇨🇱', 'Chili'],
            ['🇵🇪', 'Pérou'], ['🇨🇴', 'Colombie'],
            ['🇨🇳', 'Chine'], ['🇯🇵', 'Japon'], ['🇮🇳', 'Inde'],
            ['🇰🇷', 'Corée du Sud'], ['🇻🇳', 'Vietnam'], ['🇹🇭', 'Thaïlande'],
            ['🇮🇩', 'Indonésie'], ['🇦🇺', 'Australie'],
        ];

        // ── Banque de synonymes (pour le mode "🔗 Synonymes") ──
        const SYNONYMS = [
            ['grand', 'immense'], ['petit', 'minuscule'], ['beau', 'magnifique'],
            ['content', 'heureux'], ['triste', 'malheureux'], ['fatigué', 'épuisé'],
            ['gentil', 'aimable'], ['intelligent', 'malin'], ['courageux', 'brave'],
            ['drôle', 'amusant'], ['difficile', 'compliqué'], ['facile', 'simple'],
            ['fort', 'puissant'], ['rapide', 'vif'], ['calme', 'tranquille'],
            ['peur', 'crainte'], ['maison', 'demeure'], ['chemin', 'route'],
            ['regarder', 'observer'], ['parler', 'discuter'], ['manger', 'dévorer'],
            ['courir', 'galoper'], ['commencer', 'débuter'], ['finir', 'terminer'],
            ['aider', 'assister'], ['chercher', 'rechercher'], ['donner', 'offrir'],
            ['vieux', 'âgé'],
        ];

        // ── Banque d'antonymes (pour le mode "↔️ Antonymes") ──
        const ANTONYMS = [
            ['grand', 'petit'], ['chaud', 'froid'], ['jour', 'nuit'],
            ['noir', 'blanc'], ['haut', 'bas'], ['rapide', 'lent'],
            ['fort', 'faible'], ['beau', 'laid'], ['gentil', 'méchant'],
            ['content', 'triste'], ['facile', 'difficile'], ['plein', 'vide'],
            ['propre', 'sale'], ['riche', 'pauvre'], ['ouvert', 'fermé'],
            ['commencer', 'finir'], ['monter', 'descendre'], ['gagner', 'perdre'],
            ['acheter', 'vendre'], ['donner', 'recevoir'], ['aimer', 'détester'],
            ['vrai', 'faux'], ['jeune', 'vieux'], ['léger', 'lourd'],
            ['doux', 'dur'], ['calme', 'agité'], ['premier', 'dernier'],
            ['avant', 'après'], ['dedans', 'dehors'], ['dessus', 'dessous'],
        ];

        // ── Banque de conjugaisons (pour le mode "📖 Conjugaison") — présent de l'indicatif ──
        const CONJUGATIONS = [
            ['aimer (je)', "j'aime"], ['aimer (tu)', 'tu aimes'], ['aimer (il)', 'il aime'],
            ['aimer (nous)', 'nous aimons'], ['aimer (vous)', 'vous aimez'], ['aimer (ils)', 'ils aiment'],
            ['chanter (nous)', 'nous chantons'], ['jouer (ils)', 'ils jouent'], ['manger (je)', 'je mange'],
            ['manger (nous)', 'nous mangeons'],
            ['finir (je)', 'je finis'], ['finir (tu)', 'tu finis'], ['finir (nous)', 'nous finissons'],
            ['finir (ils)', 'ils finissent'], ['choisir (je)', 'je choisis'], ['choisir (vous)', 'vous choisissez'],
            ['être (je)', 'je suis'], ['être (tu)', 'tu es'], ['être (il)', 'il est'],
            ['être (nous)', 'nous sommes'], ['être (vous)', 'vous êtes'], ['être (ils)', 'ils sont'],
            ['avoir (je)', "j'ai"], ['avoir (tu)', 'tu as'], ['avoir (il)', 'il a'],
            ['avoir (nous)', 'nous avons'], ['avoir (vous)', 'vous avez'], ['avoir (ils)', 'ils ont'],
            ['aller (je)', 'je vais'], ['aller (tu)', 'tu vas'], ['aller (il)', 'il va'],
            ['aller (nous)', 'nous allons'], ['aller (ils)', 'ils vont'],
            ['faire (je)', 'je fais'], ['faire (il)', 'il fait'], ['faire (nous)', 'nous faisons'],
            ['faire (ils)', 'ils font'],
            ['venir (je)', 'je viens'], ['venir (il)', 'il vient'], ['venir (nous)', 'nous venons'],
            ['pouvoir (je)', 'je peux'], ['pouvoir (il)', 'il peut'], ['pouvoir (ils)', 'ils peuvent'],
            ['vouloir (je)', 'je veux'], ['vouloir (il)', 'il veut'],
            ['dire (je)', 'je dis'], ['dire (il)', 'il dit'], ['dire (vous)', 'vous dites'],
            ['prendre (je)', 'je prends'], ['prendre (il)', 'il prend'], ['prendre (nous)', 'nous prenons'],
            ['voir (je)', 'je vois'], ['voir (il)', 'il voit'],
            ['savoir (je)', 'je sais'], ['savoir (il)', 'il sait'],
        ];

        // ── Banque « nature des mots » (pour le mode "🔤 Nature des mots") ──
        const WORD_NATURES = [
            ['chien', 'nom commun'], ['table', 'nom commun'], ['bonheur', 'nom commun'],
            ['Paris', 'nom propre'], ['Léa', 'nom propre'], ['France', 'nom propre'],
            ['courir', 'verbe'], ['manger', 'verbe'], ['réfléchir', 'verbe'], ['partir', 'verbe'],
            ['bleu', 'adjectif'], ['grand', 'adjectif'], ['joyeux', 'adjectif'], ['rapide', 'adjectif'],
            ['rapidement', 'adverbe'], ['souvent', 'adverbe'], ['ici', 'adverbe'], ['très', 'adverbe'],
            ['il', 'pronom'], ['nous', 'pronom'], ['celui-ci', 'pronom'], ['qui', 'pronom'],
            ['le', 'article'], ['une', 'article'], ['des', 'article'],
            ['dans', 'préposition'], ['sur', 'préposition'], ['avec', 'préposition'], ['chez', 'préposition'],
            ['et', 'conjonction'], ['mais', 'conjonction'], ['ou', 'conjonction'], ['parce que', 'conjonction'],
            ['wahou', 'interjection'], ['aïe', 'interjection'],
            ['mon', 'déterminant possessif'], ['ce', 'déterminant démonstratif'],
        ];

        // Convertit un entier (1-3999) en chiffres romains
        function toRoman(num) {
            const table = [
                [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
                [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
                [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
            ];
            let n = num, result = '';
            for (const [value, symbol] of table) {
                while (n >= value) { result += symbol; n -= value; }
            }
            return result;
        }

        // Sélectionne n paires distinctes au hasard dans une banque [terme, terme]
        function pickRandomPairs(bank, n) {
            const indices = bank.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            return indices.slice(0, n).map(i => bank[i]);
        }

        // Génère les N paires de contenu selon le mode choisi
        function generatePairPool(n) {
            const mode = contentSelect.value;
            const pool = [];
            const usedTexts = new Set();

            if (mode === 'custom') {
                const custom = parseCustomPairs();
                custom.forEach(([a, b]) => pool.push([a, b]));
                return pool;
            }

            if (mode === 'synonymes') return pickRandomPairs(SYNONYMS, n);
            if (mode === 'conjugaison') return pickRandomPairs(CONJUGATIONS, n);
            if (mode === 'nature') return pickRandomPairs(WORD_NATURES, n);

            if (mode === 'romains') {
                const usedN = new Set();
                let guard = 0;
                while (pool.length < n && guard < 500) {
                    guard++;
                    const num = randInt(1, 100);
                    if (usedN.has(num)) continue;
                    const a = toRoman(num), b = String(num);
                    if (usedTexts.has(a) || usedTexts.has(b)) continue;
                    usedN.add(num); usedTexts.add(a); usedTexts.add(b);
                    pool.push([a, b]);
                }
                return pool;
            }
            if (mode === 'antonymes') return pickRandomPairs(ANTONYMS, n);

            if (mode === 'drapeaux') {
                const indices = COUNTRY_FLAGS.map((_, i) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = randInt(0, i);
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                indices.slice(0, n).forEach(i => pool.push(COUNTRY_FLAGS[i]));
                return pool;
            }

            if (mode === 'capitales') {
                const indices = COUNTRY_CAPITALS.map((_, i) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = randInt(0, i);
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                indices.slice(0, n).forEach(i => pool.push(COUNTRY_CAPITALS[i]));
                return pool;
            }

            if (mode === 'doubles') {
                const usedN = new Set();
                let guard = 0;
                while (pool.length < n && guard < 500) {
                    guard++;
                    const num = randInt(2, 20);
                    if (usedN.has(num)) continue;
                    const a = String(num), b = String(num * 2);
                    if (usedTexts.has(a) || usedTexts.has(b)) continue;
                    usedN.add(num); usedTexts.add(a); usedTexts.add(b);
                    pool.push([a, b]);
                }
                return pool;
            }

            if (mode === 'division') {
                const usedOps = new Set();
                let guard = 0;
                while (pool.length < n && guard < 500) {
                    guard++;
                    const x = randInt(2, 9), y = randInt(2, 9);
                    const key = x + 'x' + y;
                    if (usedOps.has(key)) continue;
                    const dividend = x * y;
                    const a = dividend + ' : ' + x, b = String(y);
                    if (usedTexts.has(a) || usedTexts.has(b)) continue;
                    usedOps.add(key); usedTexts.add(a); usedTexts.add(b);
                    pool.push([a, b]);
                }
                return pool;
            }

            if (mode === 'decimaux') {
                const usedFrac = new Set();
                let guard = 0;
                const denomChoices = [10, 100, 1000];
                while (pool.length < n && guard < 500) {
                    guard++;
                    const denom = denomChoices[randInt(0, denomChoices.length - 1)];
                    const decimals = denom === 10 ? 1 : (denom === 100 ? 2 : 3);
                    const maxNum = denom === 10 ? 99 : (denom === 100 ? 250 : 2500);
                    const num = randInt(1, maxNum);
                    if (num % denom === 0) continue; // évite les fractions valant un nombre entier (trop simples)
                    const key = num + '/' + denom;
                    if (usedFrac.has(key)) continue;
                    const a = num + '/' + denom;
                    const b = (num / denom).toFixed(decimals).replace('.', ',');
                    if (usedTexts.has(a) || usedTexts.has(b)) continue;
                    usedFrac.add(key); usedTexts.add(a); usedTexts.add(b);
                    pool.push([a, b]);
                }
                return pool;
            }

            // mode 'tables' (par défaut) — tables du 2 au 9 (0 et 1 exclus, trop triviales)
            const usedOps = new Set();
            let guard = 0;
            while (pool.length < n && guard < 500) {
                guard++;
                const x = randInt(2, 9), y = randInt(2, 9);
                const key = x + 'x' + y;
                if (usedOps.has(key)) continue;
                const a = x + ' × ' + y, b = String(x * y);
                if (usedTexts.has(a) || usedTexts.has(b)) continue;
                usedOps.add(key); usedTexts.add(a); usedTexts.add(b);
                pool.push([a, b]);
            }
            return pool;
        }

        function buildBoard() {
            grid.innerHTML = '';
            flipped = [];
            locked = false;

            const requestedN = parseInt(pairsSelect.value, 10) || 8;
            let pool = generatePairPool(requestedN);
            totalPairs = pool.length;

            cards = [];
            pool.forEach((pair, idx) => {
                const color = PAIR_COLORS[idx % PAIR_COLORS.length];
                [0, 1].forEach(side => {
                    cards.push({
                        id: idx + '-' + side,
                        pairId: idx,
                        text: pair[side],
                        color,
                        matched: false,
                        el: null
                    });
                });
            });
            // Mélange (Fisher-Yates)
            for (let i = cards.length - 1; i > 0; i--) {
                const j = randInt(0, i);
                [cards[i], cards[j]] = [cards[j], cards[i]];
            }

            cards.forEach(card => {
                const el = document.createElement('button');
                el.type = 'button';
                el.className = 'jmm-card';
                const inner = document.createElement('div');
                inner.className = 'jmm-card-inner';
                const back = document.createElement('div');
                back.className = 'jmm-card-face jmm-card-back';
                back.textContent = '❓';
                const front = document.createElement('div');
                front.className = 'jmm-card-face jmm-card-front';
                const fracMatch = /^(\d+)\/(\d+)$/.exec(card.text);
                if (fracMatch) {
                    front.innerHTML = '<span class="jmm-frac"><span class="jmm-frac-num"></span><span class="jmm-frac-den"></span></span>';
                    front.querySelector('.jmm-frac-num').textContent = fracMatch[1];
                    front.querySelector('.jmm-frac-den').textContent = fracMatch[2];
                } else {
                    front.textContent = card.text;
                }
                if (colorSelect.value === 'colored') {
                    front.style.setProperty('--jmm-card-bg', card.color.bg);
                    front.style.setProperty('--jmm-card-border', card.color.border);
                    front.style.setProperty('--jmm-card-text', card.color.text);
                }
                // Les drapeaux (emoji) sont peu lisibles à la taille de police normale
                if (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(card.text)) {
                    front.classList.add('jmm-card-front-flag');
                }
                inner.appendChild(back);
                inner.appendChild(front);
                el.appendChild(inner);
                card.el = el;
                makeTap(el, () => onCardClick(card));
                grid.appendChild(el);
            });

            updateGridColumns();
            updateHUD();
        }

        function onCardClick(card) {
            if (!running || paused || locked) return;
            if (card.matched || card.el.classList.contains('flipped')) return;
            if (flipped.length >= 2) return;

            card.el.classList.add('flipped');
            flipped.push(card);

            if (flipped.length === 2) {
                moves++;
                updateHUD();
                locked = true;
                const [c1, c2] = flipped;
                if (c1.pairId === c2.pairId) {
                    setTimeout(() => {
                        c1.matched = true; c2.matched = true;
                        c1.el.classList.add('matched');
                        c2.el.classList.add('matched');
                        matches++;
                        updateHUD();
                        flipped = [];
                        locked = false;
                        if (matches >= totalPairs) endGame();
                    }, 260);
                } else {
                    c1.el.classList.add('mismatch');
                    c2.el.classList.add('mismatch');
                    setTimeout(() => {
                        c1.el.classList.remove('flipped', 'mismatch');
                        c2.el.classList.remove('flipped', 'mismatch');
                        flipped = [];
                        locked = false;
                    }, 900);
                }
            }
        }

        function showOverlay(title, sub, btnLabel, btnDisabled) {
            overlayTitle.textContent = title;
            overlaySub.textContent = sub;
            startBtn.textContent = btnLabel;
            startBtn.disabled = !!btnDisabled;
            overlay.classList.remove('hidden');
        }
        function hideOverlay() { overlay.classList.add('hidden'); }

        function canStart() {
            if (contentSelect.value === 'custom') return parseCustomPairs().length >= 3;
            return true;
        }

        function startGame() {
            if (running && !paused) return;
            if (!canStart()) {
                showOverlay('🧠 Jeu de memory', 'Ajoute au moins 3 paires personnalisées dans les paramètres ⚙ avant de démarrer.', '▶ Démarrer', true);
                return;
            }
            if (!running) {
                buildBoard();
                moves = 0; matches = 0;
                elapsedMs = 0; lastShownSeconds = -1;
                updateHUD();
                updateTimerDisplay(true);
            }
            running = true;
            paused = false;
            hideOverlay();
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
        }

        function endGame() {
            running = false;
            paused = true;
            showOverlay('🏆 Bravo !', 'Toutes les paires trouvées en ' + moves + ' essais et ' + formatTime(elapsedMs) + '. Clique sur Démarrer pour rejouer.', '▶ Rejouer');
        }

        function resetGame() {
            grid.innerHTML = '';
            cards = []; flipped = []; locked = false;
            moves = 0; matches = 0; totalPairs = parseInt(pairsSelect.value, 10) || 8;
            running = false; paused = true;
            elapsedMs = 0; lastShownSeconds = -1;
            updateHUD();
            updateTimerDisplay(true);
            showOverlay('🧠 Jeu de memory', 'Retrouve les paires en retournant deux cartes à la fois !', '▶ Démarrer');
        }

        function gameLoop(now) {
            if (destroyed) return;
            if (lastTime === null) lastTime = now;
            const dt = now - lastTime;
            lastTime = now;

            if (running && !paused) {
                elapsedMs += dt;
                updateTimerDisplay(false);
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
                // Sur PC, le jeu démarre toujours à 1000×800px, comme les
                // autres jeux (Invaders, Pacman, Serpent, Multi, Taupe).
                container.style.width  = '1000px';
                container.style.height = '800px';
            }

            // Ouvrir directement en plein écran board sur téléphone (mémorise
            // la taille normale pour pouvoir revenir dessus via le bouton ⤢).
            // Sur PC, le widget démarre à sa taille normale (1000×800px).
            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            }

            applyFontScale();
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
            if (type === 'jeu-memory') initJeuMemoryWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-memory') initJeuMemoryWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
