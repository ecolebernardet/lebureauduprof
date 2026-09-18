// =========================================================================
// WIDGET JEU DE CONJUGAISON — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'jeu-conju'.
// Design et fonctionnalités repris de widget-jeu-memory.js
// (redimensionnement libre, barre d'édition avec aide, réduire,
// plein écran board, fermer, panneau paramètres ouvert par défaut).
//
// Principe du jeu : des étiquettes de verbes conjugués (avec leur
// pronom) sont à glisser dans la bonne catégorie de temps : Présent,
// Futur simple, Imparfait, Passé composé.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js, par ex. juste après
//      widget-jeu-memory.js) :
//      <script src="widget-jeu-conju.js"></script>
//
//   2. Ajouter une carte dans le panneau Jeux :
//      <div class="act-card" onclick="createWidget('jeu-conju');toggleJeuxPanel()">
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
    if (!document.getElementById('widget-jeu-conju-style')) {
        const s = document.createElement('style');
        s.id = 'widget-jeu-conju-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="jeu-conju"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .jcj-container {
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
            min-width: 420px;
            min-height: 380px;
        }

        /* ── État plein écran ── */
        .jcj-container.wf-fullboard {
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
        .jcj-container.wf-fullboard.jti-mobile {
            min-width: unset !important;
            width: 100% !important;
            padding-left: calc(40px + env(safe-area-inset-left)) !important;
            padding-right: calc(8px + env(safe-area-inset-right)) !important;
            padding-top: calc(8px + env(safe-area-inset-top)) !important;
            padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
        }

        /* ── En-tête ── */
        .jcj-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .jcj-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons paramètres / aide ── */
        .jcj-params-btn, .jcj-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .jcj-params-btn:hover, .jcj-help-btn:hover { background: #e0e0e0; color: #333; }
        .jcj-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .jcj-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .jcj-help-popup.show { display: block; }
        .jcj-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .jcj-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .jcj-params-panel.show { display: flex; }
        .jcj-params-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .jcj-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .jcj-count-select, .jcj-group-select {
            padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; cursor: pointer; background: white;
        }
        .jcj-count-select:focus, .jcj-group-select:focus { border-color: #4a90e2; }

        /* ── HUD ── */
        .jcj-hud {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
            flex-shrink: 0;
            padding: 0 2px;
        }
        .jcj-score { color: #2e7d32; }
        .jcj-errors { color: #c53030; }
        .jcj-timer { color: #374151; font-variant-numeric: tabular-nums; }

        /* ── Bandeau message de correction ── */
        .jcj-message {
            display: none;
            padding: 8px 14px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 700;
            text-align: center;
            flex-shrink: 0;
            box-sizing: border-box;
        }
        .jcj-message.show { display: block; }
        .jcj-message.success { background: #eafcef; color: #1e5e2e; border: 1.5px solid #38a169; }
        .jcj-message.error   { background: #fff0f0; color: #822727; border: 1.5px solid #e53e3e; }

        /* ── Zone de jeu ── */
        .jcj-play-zone {
            flex: 1;
            min-height: 160px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative;
        }

        /* ── Réservoir d'étiquettes ── */
        .jcj-pool {
            flex: 0 0 auto;
            max-height: 38%;
            overflow-y: auto;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            gap: 8px;
            padding: 10px;
            border-radius: 12px;
            background: linear-gradient(180deg, #eef4ff 0%, #f7fbff 100%);
            border: 1.5px solid #d9e6f7;
            box-sizing: border-box;
        }

        /* ── Grille des 4 catégories ── */
        .jcj-zones {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 10px;
            min-height: 140px;
        }
        .jcj-zone {
            border-radius: 12px;
            border: 2.5px dashed #cbd5e0;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            overflow: hidden;
            box-sizing: border-box;
            transition: filter .15s, box-shadow .15s;
        }
        .jcj-zone[data-tense="present"]       { border-color: #3182ce; background: #eaf4ff; }
        .jcj-zone[data-tense="futur"]         { border-color: #38a169; background: #eafcef; }
        .jcj-zone[data-tense="imparfait"]     { border-color: #dd6b20; background: #fff6ec; }
        .jcj-zone[data-tense="passecompose"]  { border-color: #805ad5; background: #f5f0ff; }
        .jcj-zone.jcj-zone-hover {
            box-shadow: inset 0 0 0 3px rgba(0,0,0,0.18);
            border-color: #374151;
        }
        .jcj-zone-title {
            font-weight: 800;
            font-size: 12px;
            text-align: center;
            flex-shrink: 0;
            color: #374151;
        }
        .jcj-zone-drops {
            flex: 1;
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            gap: 6px;
            overflow-y: auto;
        }

        /* ── Étiquette ── */
        .jcj-tag {
            padding: 8px 13px;
            border-radius: 20px;
            background: white;
            border: 2px solid #cbd5e0;
            color: #374151;
            font-weight: 700;
            font-size: var(--jcj-fs, 13px);
            cursor: grab;
            user-select: none;
            touch-action: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            white-space: nowrap;
            box-sizing: border-box;
        }
        .jcj-tag.is-dragging { opacity: 0.3; }
        .jcj-tag.placed {
            cursor: grab;
            font-size: 12px;
            padding: 6px 10px;
            background: white;
        }
        .jcj-tag.correct {
            cursor: default;
            border-color: #38a169;
            color: #1e5e2e;
            background: #eafcef;
        }
        .jcj-tag.correct::before { content: '✓ '; }
        .jcj-tag.incorrect {
            cursor: grab;
            border-color: #e53e3e;
            color: #822727;
            background: #fff0f0;
        }
        .jcj-tag.incorrect::before { content: '✗ '; }

        /* ── Fantôme drag (suit le curseur/doigt/stylet, n'intercepte jamais les clics) ── */
        .jcj-drag-ghost {
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            padding: 8px 13px;
            border-radius: 20px;
            font-weight: 700;
            background: #4a90e2;
            color: white;
            border: 2px solid #357abd;
            box-shadow: 0 6px 18px rgba(74,144,226,0.45);
            transform: translate(-50%, -50%) rotate(2deg);
            white-space: nowrap;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Overlay démarrage / fin de partie ── */
        .jcj-overlay {
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
        .jcj-overlay.hidden { display: none; }
        .jcj-overlay-title { font-size: 18px; font-weight: 800; color: #374151; }
        .jcj-overlay-sub { font-size: 13px; color: #6b7280; max-width: 380px; }
        .jcj-start-btn {
            padding: 10px 22px; border-radius: 10px; border: none;
            background: #4a90e2; color: white; font-size: 14px;
            font-weight: 800; cursor: pointer; transition: background .15s, transform .1s;
        }
        .jcj-start-btn:hover { background: #357abd; }
        .jcj-start-btn:active { transform: scale(0.96); }

        /* ── Barre contrôles bas ── */
        .jcj-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .jcj-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .jcj-btn:active { transform: scale(0.96); }
        .jcj-btn-reset { background: #6b7280; color: white; }
        .jcj-btn-reset:hover { background: #4b5563; }
        .jcj-btn-pause { background: #4a90e2; color: white; }
        .jcj-btn-pause:hover { background: #357abd; }
        .jcj-btn-correction { background: #f59e0b; color: white; }
        .jcj-btn-correction:hover { background: #d97e06; }
        .jcj-btn-correction:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
        .jcj-btn-correction:disabled:hover { background: #f59e0b; }

        /* ── Poignée resize ── */
        .jcj-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .jcj-container:hover .jcj-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-jeu-conju';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="jcj-container">

  <!-- En-tête -->
  <div class="jcj-header">
    <span class="jcj-title">📖 Jeu de conjugaison</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="jcj-params-btn" title="Paramètres">⚙</button>
      <button class="jcj-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="jcj-params-panel">
    <div class="jcj-params-row">
      <label>Nombre de verbes :</label>
      <select class="jcj-count-select">
        <option value="10" selected>10</option>
        <option value="20">20</option>
      </select>
      <label>Groupes de verbes :</label>
      <select class="jcj-group-select">
        <option value="tous" selected>🔤 Tous les groupes</option>
        <option value="er">1️⃣ 1er groupe (-er)</option>
        <option value="ir-re">2️⃣ 2e et 3e groupes (-ir, -re)</option>
        <option value="irr">⭐ Verbes irréguliers</option>
      </select>
    </div>
  </div>

  <!-- HUD -->
  <div class="jcj-hud">
    <span class="jcj-score">🗂️ 0/10 placées</span>
    <span class="jcj-errors">❌ —</span>
    <span class="jcj-timer">⏱️ 00:00</span>
  </div>

  <!-- Message de correction -->
  <div class="jcj-message"></div>

  <!-- Zone de jeu -->
  <div class="jcj-play-zone">
    <div class="jcj-pool"></div>
    <div class="jcj-zones">
      <div class="jcj-zone" data-tense="present">
        <div class="jcj-zone-title">☀️ Présent</div>
        <div class="jcj-zone-drops"></div>
      </div>
      <div class="jcj-zone" data-tense="futur">
        <div class="jcj-zone-title">🚀 Futur simple</div>
        <div class="jcj-zone-drops"></div>
      </div>
      <div class="jcj-zone" data-tense="imparfait">
        <div class="jcj-zone-title">🌙 Imparfait</div>
        <div class="jcj-zone-drops"></div>
      </div>
      <div class="jcj-zone" data-tense="passecompose">
        <div class="jcj-zone-title">⏳ Passé composé</div>
        <div class="jcj-zone-drops"></div>
      </div>
    </div>
    <div class="jcj-overlay">
      <div class="jcj-overlay-title">📖 Jeu de conjugaison</div>
      <div class="jcj-overlay-sub">Glisse chaque étiquette dans le bon temps de conjugaison !</div>
      <button class="jcj-start-btn">▶ Démarrer</button>
    </div>
  </div>

  <!-- Contrôles -->
  <div class="jcj-controls">
    <button class="jcj-btn jcj-btn-reset">🔄 Réinitialiser</button>
    <button class="jcj-btn jcj-btn-correction" disabled>✔️ Correction</button>
    <button class="jcj-btn jcj-btn-pause">⏸ Pause</button>
  </div>

  <!-- Popup aide -->
  <div class="jcj-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Nombre de verbes</b> — Choisis 10 ou 20 étiquettes de verbes conjugués à classer.</p>
    <p style="margin:0 0 10px"><b>Groupes de verbes</b> — Tous les groupes, uniquement le 1er groupe (-er), les 2e et 3e groupes (-ir, -re), ou uniquement les verbes irréguliers (être, avoir, aller, faire...).</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Chaque étiquette affiche un verbe conjugué avec son pronom (ex. « tu chantais »). Fais-la glisser dans une catégorie : Présent, Futur simple, Imparfait ou Passé composé.</p>
    <p style="margin:0 0 6px">Aucune erreur n'est signalée pendant le jeu : tu peux placer une étiquette où tu veux, et même la déplacer d'une catégorie à une autre avant la correction.</p>
    <p style="margin:0 0 6px">Une fois <b>toutes</b> les étiquettes placées, clique sur <b>✔️ Correction</b> pour découvrir ton score. Les bonnes réponses passent en vert et se verrouillent, les erreurs passent en rouge.</p>
    <p style="margin:0 0 6px">Les étiquettes rouges restent glissables : replace-les dans la bonne catégorie puis clique de nouveau sur <b>✔️ Correction</b>, autant de fois que nécessaire, jusqu'à ce que tout soit vert.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">Clique sur <b>🔄 Réinitialiser</b> pour rejouer avec de nouvelles étiquettes.</p>
  </div>

  <!-- Poignée resize -->
  <div class="jcj-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // BANQUE DE VERBES CONJUGUÉS
    // =========================================================================
    // pronoms utilisés : je/j', tu, il, elle, nous, vous, ils (7 formes par temps)
    const VERBS = [
        { inf: 'aimer', group: 'er', forms: {
            present:      ["j'aime", 'tu aimes', 'il aime', 'elle aime', 'nous aimons', 'vous aimez', 'ils aiment'],
            futur:        ["j'aimerai", 'tu aimeras', 'il aimera', 'elle aimera', 'nous aimerons', 'vous aimerez', 'ils aimeront'],
            imparfait:    ["j'aimais", 'tu aimais', 'il aimait', 'elle aimait', 'nous aimions', 'vous aimiez', 'ils aimaient'],
            passecompose: ["j'ai aimé", 'tu as aimé', 'il a aimé', 'elle a aimé', 'nous avons aimé', 'vous avez aimé', 'ils ont aimé'],
        }},
        { inf: 'chanter', group: 'er', forms: {
            present:      ['je chante', 'tu chantes', 'il chante', 'elle chante', 'nous chantons', 'vous chantez', 'ils chantent'],
            futur:        ['je chanterai', 'tu chanteras', 'il chantera', 'elle chantera', 'nous chanterons', 'vous chanterez', 'ils chanteront'],
            imparfait:    ['je chantais', 'tu chantais', 'il chantait', 'elle chantait', 'nous chantions', 'vous chantiez', 'ils chantaient'],
            passecompose: ["j'ai chanté", 'tu as chanté', 'il a chanté', 'elle a chanté', 'nous avons chanté', 'vous avez chanté', 'ils ont chanté'],
        }},
        { inf: 'manger', group: 'er', forms: {
            present:      ['je mange', 'tu manges', 'il mange', 'elle mange', 'nous mangeons', 'vous mangez', 'ils mangent'],
            futur:        ['je mangerai', 'tu mangeras', 'il mangera', 'elle mangera', 'nous mangerons', 'vous mangerez', 'ils mangeront'],
            imparfait:    ['je mangeais', 'tu mangeais', 'il mangeait', 'elle mangeait', 'nous mangions', 'vous mangiez', 'ils mangeaient'],
            passecompose: ["j'ai mangé", 'tu as mangé', 'il a mangé', 'elle a mangé', 'nous avons mangé', 'vous avez mangé', 'ils ont mangé'],
        }},
        { inf: 'jouer', group: 'er', forms: {
            present:      ['je joue', 'tu joues', 'il joue', 'elle joue', 'nous jouons', 'vous jouez', 'ils jouent'],
            futur:        ['je jouerai', 'tu joueras', 'il jouera', 'elle jouera', 'nous jouerons', 'vous jouerez', 'ils joueront'],
            imparfait:    ['je jouais', 'tu jouais', 'il jouait', 'elle jouait', 'nous jouions', 'vous jouiez', 'ils jouaient'],
            passecompose: ["j'ai joué", 'tu as joué', 'il a joué', 'elle a joué', 'nous avons joué', 'vous avez joué', 'ils ont joué'],
        }},
        { inf: 'donner', group: 'er', forms: {
            present:      ['je donne', 'tu donnes', 'il donne', 'elle donne', 'nous donnons', 'vous donnez', 'ils donnent'],
            futur:        ['je donnerai', 'tu donneras', 'il donnera', 'elle donnera', 'nous donnerons', 'vous donnerez', 'ils donneront'],
            imparfait:    ['je donnais', 'tu donnais', 'il donnait', 'elle donnait', 'nous donnions', 'vous donniez', 'ils donnaient'],
            passecompose: ["j'ai donné", 'tu as donné', 'il a donné', 'elle a donné', 'nous avons donné', 'vous avez donné', 'ils ont donné'],
        }},
        { inf: 'finir', group: 'ir', forms: {
            present:      ['je finis', 'tu finis', 'il finit', 'elle finit', 'nous finissons', 'vous finissez', 'ils finissent'],
            futur:        ['je finirai', 'tu finiras', 'il finira', 'elle finira', 'nous finirons', 'vous finirez', 'ils finiront'],
            imparfait:    ['je finissais', 'tu finissais', 'il finissait', 'elle finissait', 'nous finissions', 'vous finissiez', 'ils finissaient'],
            passecompose: ["j'ai fini", 'tu as fini', 'il a fini', 'elle a fini', 'nous avons fini', 'vous avez fini', 'ils ont fini'],
        }},
        { inf: 'choisir', group: 'ir', forms: {
            present:      ['je choisis', 'tu choisis', 'il choisit', 'elle choisit', 'nous choisissons', 'vous choisissez', 'ils choisissent'],
            futur:        ['je choisirai', 'tu choisiras', 'il choisira', 'elle choisira', 'nous choisirons', 'vous choisirez', 'ils choisiront'],
            imparfait:    ['je choisissais', 'tu choisissais', 'il choisissait', 'elle choisissait', 'nous choisissions', 'vous choisissiez', 'ils choisissaient'],
            passecompose: ["j'ai choisi", 'tu as choisi', 'il a choisi', 'elle a choisi', 'nous avons choisi', 'vous avez choisi', 'ils ont choisi'],
        }},
        { inf: 'grandir', group: 'ir', forms: {
            present:      ['je grandis', 'tu grandis', 'il grandit', 'elle grandit', 'nous grandissons', 'vous grandissez', 'ils grandissent'],
            futur:        ['je grandirai', 'tu grandiras', 'il grandira', 'elle grandira', 'nous grandirons', 'vous grandirez', 'ils grandiront'],
            imparfait:    ['je grandissais', 'tu grandissais', 'il grandissait', 'elle grandissait', 'nous grandissions', 'vous grandissiez', 'ils grandissaient'],
            passecompose: ["j'ai grandi", 'tu as grandi', 'il a grandi', 'elle a grandi', 'nous avons grandi', 'vous avez grandi', 'ils ont grandi'],
        }},
        { inf: 'vendre', group: 're', forms: {
            present:      ['je vends', 'tu vends', 'il vend', 'elle vend', 'nous vendons', 'vous vendez', 'ils vendent'],
            futur:        ['je vendrai', 'tu vendras', 'il vendra', 'elle vendra', 'nous vendrons', 'vous vendrez', 'ils vendront'],
            imparfait:    ['je vendais', 'tu vendais', 'il vendait', 'elle vendait', 'nous vendions', 'vous vendiez', 'ils vendaient'],
            passecompose: ["j'ai vendu", 'tu as vendu', 'il a vendu', 'elle a vendu', 'nous avons vendu', 'vous avez vendu', 'ils ont vendu'],
        }},
        { inf: 'attendre', group: 're', forms: {
            present:      ["j'attends", 'tu attends', 'il attend', 'elle attend', 'nous attendons', 'vous attendez', 'ils attendent'],
            futur:        ["j'attendrai", 'tu attendras', 'il attendra', 'elle attendra', 'nous attendrons', 'vous attendrez', 'ils attendront'],
            imparfait:    ["j'attendais", 'tu attendais', 'il attendait', 'elle attendait', 'nous attendions', 'vous attendiez', 'ils attendaient'],
            passecompose: ["j'ai attendu", 'tu as attendu', 'il a attendu', 'elle a attendu', 'nous avons attendu', 'vous avez attendu', 'ils ont attendu'],
        }},
        { inf: 'être', group: 'irr', forms: {
            present:      ['je suis', 'tu es', 'il est', 'elle est', 'nous sommes', 'vous êtes', 'ils sont'],
            futur:        ['je serai', 'tu seras', 'il sera', 'elle sera', 'nous serons', 'vous serez', 'ils seront'],
            imparfait:    ["j'étais", 'tu étais', 'il était', 'elle était', 'nous étions', 'vous étiez', 'ils étaient'],
            passecompose: ["j'ai été", 'tu as été', 'il a été', 'elle a été', 'nous avons été', 'vous avez été', 'ils ont été'],
        }},
        { inf: 'avoir', group: 'irr', forms: {
            present:      ["j'ai", 'tu as', 'il a', 'elle a', 'nous avons', 'vous avez', 'ils ont'],
            futur:        ["j'aurai", 'tu auras', 'il aura', 'elle aura', 'nous aurons', 'vous aurez', 'ils auront'],
            imparfait:    ["j'avais", 'tu avais', 'il avait', 'elle avait', 'nous avions', 'vous aviez', 'ils avaient'],
            passecompose: ["j'ai eu", 'tu as eu', 'il a eu', 'elle a eu', 'nous avons eu', 'vous avez eu', 'ils ont eu'],
        }},
        { inf: 'aller', group: 'irr', forms: {
            present:      ['je vais', 'tu vas', 'il va', 'elle va', 'nous allons', 'vous allez', 'ils vont'],
            futur:        ["j'irai", 'tu iras', 'il ira', 'elle ira', 'nous irons', 'vous irez', 'ils iront'],
            imparfait:    ["j'allais", 'tu allais', 'il allait', 'elle allait', 'nous allions', 'vous alliez', 'ils allaient'],
            passecompose: ['je suis allé', 'tu es allé', 'il est allé', 'elle est allée', 'nous sommes allés', 'vous êtes allés', 'ils sont allés'],
        }},
        { inf: 'faire', group: 'irr', forms: {
            present:      ['je fais', 'tu fais', 'il fait', 'elle fait', 'nous faisons', 'vous faites', 'ils font'],
            futur:        ['je ferai', 'tu feras', 'il fera', 'elle fera', 'nous ferons', 'vous ferez', 'ils feront'],
            imparfait:    ['je faisais', 'tu faisais', 'il faisait', 'elle faisait', 'nous faisions', 'vous faisiez', 'ils faisaient'],
            passecompose: ["j'ai fait", 'tu as fait', 'il a fait', 'elle a fait', 'nous avons fait', 'vous avez fait', 'ils ont fait'],
        }},
        { inf: 'venir', group: 'irr', forms: {
            present:      ['je viens', 'tu viens', 'il vient', 'elle vient', 'nous venons', 'vous venez', 'ils viennent'],
            futur:        ['je viendrai', 'tu viendras', 'il viendra', 'elle viendra', 'nous viendrons', 'vous viendrez', 'ils viendront'],
            imparfait:    ['je venais', 'tu venais', 'il venait', 'elle venait', 'nous venions', 'vous veniez', 'ils venaient'],
            passecompose: ['je suis venu', 'tu es venu', 'il est venu', 'elle est venue', 'nous sommes venus', 'vous êtes venus', 'ils sont venus'],
        }},
        { inf: 'pouvoir', group: 'irr', forms: {
            present:      ['je peux', 'tu peux', 'il peut', 'elle peut', 'nous pouvons', 'vous pouvez', 'ils peuvent'],
            futur:        ['je pourrai', 'tu pourras', 'il pourra', 'elle pourra', 'nous pourrons', 'vous pourrez', 'ils pourront'],
            imparfait:    ['je pouvais', 'tu pouvais', 'il pouvait', 'elle pouvait', 'nous pouvions', 'vous pouviez', 'ils pouvaient'],
            passecompose: ["j'ai pu", 'tu as pu', 'il a pu', 'elle a pu', 'nous avons pu', 'vous avez pu', 'ils ont pu'],
        }},
        { inf: 'vouloir', group: 'irr', forms: {
            present:      ['je veux', 'tu veux', 'il veut', 'elle veut', 'nous voulons', 'vous voulez', 'ils veulent'],
            futur:        ['je voudrai', 'tu voudras', 'il voudra', 'elle voudra', 'nous voudrons', 'vous voudrez', 'ils voudront'],
            imparfait:    ['je voulais', 'tu voulais', 'il voulait', 'elle voulait', 'nous voulions', 'vous vouliez', 'ils voulaient'],
            passecompose: ["j'ai voulu", 'tu as voulu', 'il a voulu', 'elle a voulu', 'nous avons voulu', 'vous avez voulu', 'ils ont voulu'],
        }},
        { inf: 'dire', group: 'irr', forms: {
            present:      ['je dis', 'tu dis', 'il dit', 'elle dit', 'nous disons', 'vous dites', 'ils disent'],
            futur:        ['je dirai', 'tu diras', 'il dira', 'elle dira', 'nous dirons', 'vous direz', 'ils diront'],
            imparfait:    ['je disais', 'tu disais', 'il disait', 'elle disait', 'nous disions', 'vous disiez', 'ils disaient'],
            passecompose: ["j'ai dit", 'tu as dit', 'il a dit', 'elle a dit', 'nous avons dit', 'vous avez dit', 'ils ont dit'],
        }},
        { inf: 'prendre', group: 'irr', forms: {
            present:      ['je prends', 'tu prends', 'il prend', 'elle prend', 'nous prenons', 'vous prenez', 'ils prennent'],
            futur:        ['je prendrai', 'tu prendras', 'il prendra', 'elle prendra', 'nous prendrons', 'vous prendrez', 'ils prendront'],
            imparfait:    ['je prenais', 'tu prenais', 'il prenait', 'elle prenait', 'nous prenions', 'vous preniez', 'ils prenaient'],
            passecompose: ["j'ai pris", 'tu as pris', 'il a pris', 'elle a pris', 'nous avons pris', 'vous avez pris', 'ils ont pris'],
        }},
        { inf: 'voir', group: 'irr', forms: {
            present:      ['je vois', 'tu vois', 'il voit', 'elle voit', 'nous voyons', 'vous voyez', 'ils voient'],
            futur:        ['je verrai', 'tu verras', 'il verra', 'elle verra', 'nous verrons', 'vous verrez', 'ils verront'],
            imparfait:    ['je voyais', 'tu voyais', 'il voyait', 'elle voyait', 'nous voyions', 'vous voyiez', 'ils voyaient'],
            passecompose: ["j'ai vu", 'tu as vu', 'il a vu', 'elle a vu', 'nous avons vu', 'vous avez vu', 'ils ont vu'],
        }},
    ];

    const TENSES = ['present', 'futur', 'imparfait', 'passecompose'];

    function getFilteredVerbs(groupFilter) {
        if (groupFilter === 'er')    return VERBS.filter(v => v.group === 'er');
        if (groupFilter === 'ir-re') return VERBS.filter(v => v.group === 'ir' || v.group === 're');
        if (groupFilter === 'irr')   return VERBS.filter(v => v.group === 'irr');
        return VERBS.slice();
    }

    function shuffleArr(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Construit un jeu de n étiquettes réparties équitablement sur les 4 temps
    function buildDeck(n, groupFilter) {
        let pool = getFilteredVerbs(groupFilter);
        if (pool.length === 0) pool = VERBS.slice();

        const perTense = Math.floor(n / TENSES.length);
        let remainder = n - perTense * TENSES.length;

        const deck = [];
        let uid = 0;
        TENSES.forEach((tense) => {
            let count = perTense + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder--;

            // Toutes les formes possibles pour ce temps dans le pool filtré
            let candidates = [];
            pool.forEach(v => {
                (v.forms[tense] || []).forEach(text => candidates.push(text));
            });
            candidates = shuffleArr(candidates);

            const seen = new Set();
            const picked = [];
            for (let i = 0; i < candidates.length && picked.length < count; i++) {
                const text = candidates[i];
                if (seen.has(text)) continue;
                seen.add(text);
                picked.push(text);
            }
            picked.forEach(text => deck.push({ id: 'jcj_' + (uid++), text, tense }));
        });

        return shuffleArr(deck);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initJeuConjuWidget = function (widget) {

        const container      = widget.querySelector('.jcj-container');
        const paramsBtn       = widget.querySelector('.jcj-params-btn');
        const paramsPanel     = widget.querySelector('.jcj-params-panel');
        const countSelect     = widget.querySelector('.jcj-count-select');
        const groupSelect     = widget.querySelector('.jcj-group-select');
        const helpBtn         = widget.querySelector('.jcj-help-btn');
        const helpPopup       = widget.querySelector('.jcj-help-popup');
        const resizeHandle    = widget.querySelector('.jcj-resize-handle');
        const scoreEl         = widget.querySelector('.jcj-score');
        const errorsEl        = widget.querySelector('.jcj-errors');
        const timerEl         = widget.querySelector('.jcj-timer');
        const messageEl        = widget.querySelector('.jcj-message');
        const pool            = widget.querySelector('.jcj-pool');
        const zones           = Array.from(widget.querySelectorAll('.jcj-zone'));
        const overlay          = widget.querySelector('.jcj-overlay');
        const overlayTitle     = widget.querySelector('.jcj-overlay-title');
        const overlaySub       = widget.querySelector('.jcj-overlay-sub');
        const startBtn         = widget.querySelector('.jcj-start-btn');
        const resetBtn         = widget.querySelector('.jcj-btn-reset');
        const pauseBtn         = widget.querySelector('.jcj-btn-pause');
        const correctionBtn    = widget.querySelector('.jcj-btn-correction');

        // ── État du jeu ──────────────────────────────────────────────────
        let deck           = [];
        let totalCards     = 10;
        let score           = 0;
        let errors          = 0;
        let running        = false;
        let paused         = true;
        let hasCorrected   = false;
        let boardBuilt     = false;
        let elapsedMs      = 0;
        let lastShownSeconds = -1;
        let lastTime       = null;
        let rafId          = null;
        let destroyed      = false;

        // ── Helper tap stylet (pointer-safe) pour les boutons ──────────────
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

        // ── Paramètres (toujours affichés, comme le jeu de memory) ────────
        paramsPanel.classList.add('show');
        paramsBtn.classList.add('active');
        if (paramsBtn) paramsBtn.style.display = 'none';
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        countSelect.addEventListener('pointerdown', (e) => e.stopPropagation());
        groupSelect.addEventListener('pointerdown', (e) => e.stopPropagation());

        // Un clic dans la zone de jeu (réservoir, catégories) ne doit jamais
        // déplacer le widget entier — seul l'en-tête (.jcj-header) sert de
        // poignée de déplacement.
        pool.addEventListener('mousedown', (e) => e.stopPropagation());
        pool.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        pool.addEventListener('pointerdown', (e) => e.stopPropagation());
        zones.forEach(z => {
            z.addEventListener('mousedown', (e) => e.stopPropagation());
            z.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
            z.addEventListener('pointerdown', (e) => e.stopPropagation());
        });

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

        // ── Taille de police adaptative ─────────────────────────────────
        function applyFontScale() {
            const w = container.offsetWidth || 760;
            const fs = Math.max(11, Math.min(16, Math.round(w / 52)));
            container.style.setProperty('--jcj-fs', fs + 'px');
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
                window._wfMiniBarCollapse(widget, '📖 Jeu de conjugaison', {
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
                container.style.width  = Math.max(420, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(380, startH + ev.clientY - startY) + 'px';
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
        window.addEventListener('resize', () => applyFontScale());

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
            if (!hasCorrected) {
                const placed = boardBuilt ? (totalCards - pool.children.length) : 0;
                scoreEl.textContent  = '🗂️ ' + placed + '/' + totalCards + ' placées';
                errorsEl.textContent = '❌ —';
            } else {
                scoreEl.textContent  = '✅ ' + score + '/' + totalCards;
                errorsEl.textContent = '❌ ' + errors;
            }
        }

        function updateCorrectionButton() {
            const allPlaced = boardBuilt && pool.children.length === 0;
            const fullySolved = hasCorrected && errors === 0;
            correctionBtn.disabled = !(allPlaced && running && !fullySolved);
        }

        function showMessage(text, type) {
            messageEl.textContent = text;
            messageEl.classList.remove('success', 'error');
            messageEl.classList.add('show', type);
        }
        function hideMessage() {
            messageEl.classList.remove('show', 'success', 'error');
        }
        function updateTimerDisplay(force) {
            const sec = Math.floor(elapsedMs / 1000);
            if (!force && sec === lastShownSeconds) return;
            lastShownSeconds = sec;
            timerEl.textContent = '⏱️ ' + formatTime(elapsedMs);
        }

        function clearZoneHover() {
            zones.forEach(z => z.classList.remove('jcj-zone-hover'));
        }

        function evaluateDrop(tag, zone) {
            tag.classList.remove('correct', 'incorrect');
            hideMessage();
            if (!zone) {
                // Relâchée hors d'une catégorie : retour au réservoir
                tag.classList.remove('placed');
                pool.appendChild(tag);
                updateHUD();
                updateCorrectionButton();
                return;
            }

            // Pendant le jeu, aucune vérification : l'étiquette est acceptée
            // dans n'importe quelle catégorie. Elle peut être redéplacée
            // librement jusqu'au clic sur "Correction".
            tag.classList.add('placed');
            const drops = zone.querySelector('.jcj-zone-drops');
            drops.appendChild(tag);
            updateHUD();
            updateCorrectionButton();
        }

        // ── Drag maison (souris + tactile/stylet), identique au pattern
        // éprouvé de widget-mots-alpha.js : l'étiquette d'origine reste en
        // place (juste estompée) pendant le glisser, seul un « fantôme »
        // (position: fixed, pointer-events: none, attaché à document.body)
        // suit le curseur/doigt/stylet. Les écouteurs mousemove/mouseup et
        // touchmove/touchend sont posés sur document, exactement comme dans
        // le widget mots-alpha qui fonctionne sans conflit avec le
        // déplacement du widget lui-même.
        function startDrag(tag, startX, startY, pointerId) {
            const ghost = document.createElement('div');
            ghost.className = 'jcj-drag-ghost';
            ghost.textContent = tag.textContent;
            const fs = getComputedStyle(container).getPropertyValue('--jcj-fs').trim() || '13px';
            ghost.style.fontSize = fs;
            ghost.style.left = startX + 'px';
            ghost.style.top  = startY + 'px';
            document.body.appendChild(ghost);

            tag.classList.add('is-dragging');
            let lastZone = null;

            function onMove(e) {
                if (pointerId != null && e.pointerId !== pointerId) return;
                const cx = e.clientX, cy = e.clientY;
                ghost.style.left = cx + 'px';
                ghost.style.top  = cy + 'px';
                const under = document.elementFromPoint(cx, cy);
                const zone = under ? under.closest('.jcj-zone') : null;
                if (zone !== lastZone) {
                    if (lastZone) lastZone.classList.remove('jcj-zone-hover');
                    if (zone) zone.classList.add('jcj-zone-hover');
                    lastZone = zone;
                }
            }

            function onUp(e) {
                if (pointerId != null && e.pointerId !== pointerId) return;
                document.removeEventListener('pointermove',   onMove);
                document.removeEventListener('pointerup',     onUp);
                document.removeEventListener('pointercancel', onUp);
                ghost.remove();
                tag.classList.remove('is-dragging');
                clearZoneHover();

                const cx = e.clientX, cy = e.clientY;
                const under = document.elementFromPoint(cx, cy);
                const zone = under ? under.closest('.jcj-zone') : null;
                evaluateDrop(tag, zone);
            }

            document.addEventListener('pointermove',   onMove);
            document.addEventListener('pointerup',     onUp);
            document.addEventListener('pointercancel', onUp);
        }

        function attachDragHandlers(tag) {
            // Pointer Events uniquement : couvre souris, doigt ET stylet en un
            // seul système (évite qu'un stylet, qui ne déclenche pas toujours
            // mousedown/touchstart de façon fiable, fasse remonter l'événement
            // jusqu'au déplacement du widget entier).
            tag.addEventListener('pointerdown', (e) => {
                if (tag.dataset.locked === 'true') return;
                if (!running || paused) return;
                e.stopPropagation();
                e.preventDefault();
                startDrag(tag, e.clientX, e.clientY, e.pointerId);
            });
        }

        function clearZones() {
            widget.querySelectorAll('.jcj-zone-drops').forEach(z => { z.innerHTML = ''; });
        }

        function buildBoard() {
            pool.innerHTML = '';
            clearZones();
            const n = parseInt(countSelect.value, 10) || 10;
            deck = buildDeck(n, groupSelect.value);
            totalCards = deck.length;
            score = 0;
            errors = 0;
            hasCorrected = false;
            boardBuilt = true;
            hideMessage();
            deck.forEach(card => {
                const tag = document.createElement('div');
                tag.className = 'jcj-tag';
                tag.textContent = card.text;
                tag.dataset.tense = card.tense;
                tag.dataset.id = card.id;
                attachDragHandlers(tag);
                pool.appendChild(tag);
            });
            applyFontScale();
            updateHUD();
            updateCorrectionButton();
        }

        // La correction peut être déclenchée plusieurs fois : les étiquettes
        // correctes sont validées (vertes, verrouillées) et les étiquettes
        // mal placées passent en rouge et restent glissables pour être
        // corrigées, jusqu'à ce que tout soit vert.
        function performCorrection() {
            if (pool.children.length > 0) return; // sécurité : toutes les étiquettes doivent être placées
            hasCorrected = true;
            let currentScore = 0, currentErrors = 0;
            zones.forEach(zone => {
                const tense = zone.dataset.tense;
                Array.from(zone.querySelectorAll('.jcj-tag')).forEach(tag => {
                    if (tag.dataset.locked === 'true') { currentScore++; return; } // déjà validée précédemment
                    const ok = tag.dataset.tense === tense;
                    tag.classList.remove('correct', 'incorrect');
                    if (ok) {
                        tag.classList.add('correct');
                        tag.dataset.locked = 'true';
                        currentScore++;
                    } else {
                        tag.classList.add('incorrect');
                        currentErrors++;
                    }
                });
            });
            score = currentScore;
            errors = currentErrors;
            updateHUD();
            updateCorrectionButton();
            if (errors === 0) {
                running = false;
                paused = true;
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                showMessage('🎉 Bravo, tout est correct ! ' + score + '/' + totalCards + ' bonnes réponses en ' + formatTime(elapsedMs) + '.', 'success');
            } else {
                showMessage('❌ ' + errors + ' erreur(s) sur ' + totalCards + '. Fais glisser les étiquettes rouges dans la bonne catégorie, puis clique de nouveau sur Correction.', 'error');
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
                buildBoard();
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

        function resetGame() {
            pool.innerHTML = '';
            clearZones();
            deck = [];
            totalCards = parseInt(countSelect.value, 10) || 10;
            score = 0; errors = 0;
            hasCorrected = false;
            boardBuilt = false;
            running = false; paused = true;
            elapsedMs = 0; lastShownSeconds = -1;
            hideMessage();
            updateHUD();
            updateCorrectionButton();
            updateTimerDisplay(true);
            showOverlay('📖 Jeu de conjugaison', 'Glisse chaque étiquette dans le bon temps de conjugaison !', '▶ Démarrer');
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
        makeTap(correctionBtn, () => performCorrection());

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
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            // Taille par défaut si aucune dimension sauvegardée : 1000×800px
            if (!container.style.width)  container.style.width  = '1000px';
            if (!container.style.height) container.style.height = '800px';

            // Sur téléphone, ouvre directement en plein écran board (le jeu a
            // besoin de toute la place). Sur PC, ouvre en taille normale.
            _savedW = container.style.width;
            _savedH = container.style.height;
            if (isMobile) {
                container.classList.add('jti-mobile');
                _isMax = true;
                container.classList.add('wf-fullboard');
            } else {
                _isMax = false;
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
            if (type === 'jeu-conju') initJeuConjuWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'jeu-conju') initJeuConjuWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
