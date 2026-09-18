// =========================================================================
// WIDGET FRACTIONS — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'fractions'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-fractions.js"></script>
//
//   2. Ajouter dans le panneau Activités (rubrique mathématiques) :
//      <div class="act-card" onclick="createWidget('fractions');toggleActivitiesPanel()">
//          <div class="act-card-ico">...</div>
//          <div class="act-card-name">Fractions</div>
//          <div class="act-card-desc">Manipuler des fractions avec des figures partagées</div>
//      </div>
// =========================================================================

(function () {

    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
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

    // ── CSS injecté une seule fois ────────────────────────────────────────
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

    if (!document.getElementById('widget-fractions-style')) {
        const s = document.createElement('style');
        s.id = 'widget-fractions-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="fractions"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        @font-face {
            font-family: 'MarelleBaton';
            src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        /* ── Conteneur principal ── */
        .frac-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 700px;
            min-width: 360px;
            min-height: 280px;
        }

        /* ── État plein écran ── */
        .frac-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 70px !important;
        }

        /* ── En-tête ── */
        .frac-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .frac-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Bouton paramètres ── */
        .frac-params-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 13px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content:center; flex-shrink: 0;
            transition: background .15s;
        }
        .frac-params-btn:hover { background: #e0e0e0; color: #333; }
        .frac-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Bouton aide ── */
        .frac-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .frac-help-btn:hover { background: #e0e0e0; color: #333; }

        /* ── Popup aide ── */
        .frac-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .frac-help-popup.show { display: block; }
        .frac-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .frac-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: row;
            gap: 50px;
            flex-shrink: 0;
        }
        .frac-params-panel.show { display: flex; }

        .frac-params-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .frac-params-row label {
            font-size: 11px; font-weight: 700; color: #374151; white-space: nowrap;
        }

        /* ── Sélecteur de forme ── */
        .frac-shape-btns {
            display: flex; gap: 6px;
        }
        .frac-shape-btn {
            padding: 4px 12px; border-radius: 20px; border: 1.5px solid #d1d5db;
            background: white; font-size: 11px; font-weight: 700; color: #6b7280;
            cursor: pointer; transition: all .15s;
            touch-action: manipulation;
        }
        .frac-shape-btn.active {
            background: #4a90e2; color: white; border-color: #357abd;
        }
        .frac-shape-btn:hover:not(.active) { border-color: #4a90e2; color: #4a90e2; }

        /* ── Sélecteur nombre de fractions ── */
        .frac-count-btns {
            display: flex; gap: 5px;
        }
        .frac-count-btn {
            width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #d1d5db;
            background: white; font-size: 11px; font-weight: 800; color: #6b7280;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all .15s;
            touch-action: manipulation;
        }
        .frac-count-btn.active {
            background: #6366f1; color: white; border-color: #4f46e5;
        }
        .frac-count-btn:hover:not(.active) { border-color: #6366f1; color: #6366f1; }

        /* ── Couleur de remplissage ── */
        .frac-color-swatches {
            display: flex; gap: 5px; align-items: center;
        }
        .frac-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid transparent; cursor: pointer;
            transition: transform .15s, border-color .1s;
            touch-action: manipulation;
        }
        .frac-swatch:hover { transform: scale(1.2); }
        .frac-swatch.active { border-color: #374151; transform: scale(1.15); }

        /* ── Zone principale des fractions ── */
        /* ── Zone principale : 4 colonnes égales, toujours ── */
        .frac-main {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(var(--frac-cols, 1), 1fr);
            overflow: auto;
            padding: 8px 0;
            gap: 0;
            min-height: 0;
        }

        /* ── Une colonne de fraction ── */
        .frac-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 0;
            border-right: 1.5px dashed #e5e7eb;
            box-sizing: border-box;
            min-width: 0;
        }
        .frac-col:last-child { border-right: none; }

        /* ── Ligne controls + signe = + figure : largeur selon nombre de colonnes ── */
        .frac-inner {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: var(--frac-inner-w, 85%);
            min-width: 0;
        }

        /* ── Le cercle a un ratio 1:1, il grossit trop vite en % : on plafonne sa taille ── */
        .frac-col.shape-circle .frac-inner {
            max-width: min(var(--frac-circle-max, 320px), 90%);
        }

        /* ── Zone figure : prend tout l'espace disponible ── */
        .frac-figures {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* ── SVG responsive dans sa zone ── */
        .frac-figure {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }
        .frac-figure svg {
            width: 100%;
            height: auto;
            display: block;
            overflow: visible;
        }

        /* Pour compatibilité */
        .frac-row { display: contents; }

        /* ── Contrôles numérateur / dénominateur ── */
        .frac-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }
        .frac-notation {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }
        .frac-num-input, .frac-den-input {
            display: none;
        }
        /* Stepper numérateur / dénominateur */
        .frac-stepper {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .frac-step-btn {
            width: 26px; height: 26px;
            border-radius: 6px;
            border: 1.5px solid #d1d5db;
            background: #fff;
            font-size: 16px; font-weight: 900;
            color: #374151; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            line-height: 1;
            transition: background .12s, transform .1s;
            flex-shrink: 0;
            touch-action: manipulation;
        }
        .frac-step-btn:hover  { background: #e5e7eb; }
        .frac-step-btn:active { transform: scale(0.9); background: #d1d5db; }
        .frac-step-val {
            min-width: 28px;
            text-align: center;
            font-size: 16px; font-weight: 800;
            color: #374151;
            user-select: none;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
        }
        .frac-step-val.num { color: #4a90e2; }
        .frac-step-val.den { color: #e06c4a; }
        .frac-bar {
            width: 44px; height: 2px; background: #374151; border-radius: 1px;
        }
        .frac-label-num {
            font-size: 9px; font-weight: 700; color: #4a90e2;
            text-transform: uppercase; letter-spacing: 0.4px;
        }
        .frac-label-den {
            font-size: 9px; font-weight: 700; color: #e06c4a;
            text-transform: uppercase; letter-spacing: 0.4px;
        }
        .frac-label-eq {
            font-size: 22px; font-weight: 900; color: #374151;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
            margin: 0 4px;
        }

        /* ── Parties cliquables ── */
        .frac-figure .frac-part {
            transition: fill .15s, opacity .12s;
            cursor: pointer;
        }
        .frac-figure .frac-part:hover {
            opacity: 0.75;
        }

        /* ── Texte fraction affiché sous la figure ── */
        .frac-fig-label {
            text-align: center;
            font-size: 22px;
            font-weight: 800;
            color: #374151;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif;
            margin-top: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            line-height: 1.1;
        }
        .frac-fig-label .fn { color: #4a90e2; font-size: 22px; font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; }
        .frac-fig-label .fb { width: 24px; height: 2px; background: #374151; margin: 2px 0; }
        .frac-fig-label .fd { color: #e06c4a; font-size: 22px; font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif; }

        /* ── Bouton œil pour cacher/montrer la fraction ── */
        .frac-label-wrap {
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 4px;
        }
        .frac-eye-btn {
            width: 20px; height: 20px;
            border: none; background: none;
            cursor: pointer; font-size: 14px;
            display: flex; align-items: center; justify-content: center;
            opacity: 0.4; border-radius: 4px;
            transition: opacity .15s;
            flex-shrink: 0;
            touch-action: manipulation;
            padding: 0;
        }
        .frac-eye-btn:hover { opacity: 1; }
        .frac-eye-btn.hidden { opacity: 0.25; }
        .frac-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .frac-btn:active { transform: scale(0.96); }
        .frac-btn-reset  { background: #6b7280; color: white; }
        .frac-btn-reset:hover { background: #4b5563; }

        /* ── Message d'erreur ── */
        .frac-error {
            font-size: 11px; font-weight: 700; color: #ef4444;
            display: none;
        }
        .frac-error.show { display: inline; }

        /* ── Barre de contrôles bas ── */
        .frac-bottom {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }

        /* ── Poignée resize ── */
        .frac-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .frac-container:hover .frac-resize-handle { opacity: 1; }

        /* ── Séparateur entre fractions multiples ── */
        .frac-separator {
            width: 1.5px; height: 60px; background: #e5e7eb;
            flex-shrink: 0;
        }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-fractions';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="frac-container">

  <!-- En-tête -->
  <div class="frac-header">
    <span class="frac-title">➗ Fractions</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="frac-params-btn" title="Paramètres">⚙</button>
      <button class="frac-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="frac-params-panel">
    <div class="frac-params-row">
      <label>Forme :</label>
      <div class="frac-shape-btns">
        <button class="frac-shape-btn active" data-shape="rect">▭ Rectangle</button>
        <button class="frac-shape-btn" data-shape="circle">◯ Cercle</button>
      </div>
    </div>
    <div class="frac-params-row">
      <label>Nombre de figures :</label>
      <div class="frac-count-btns">
        <button class="frac-count-btn active" data-count="1">1</button>
        <button class="frac-count-btn" data-count="2">2</button>
        <button class="frac-count-btn" data-count="3">3</button>
        <button class="frac-count-btn" data-count="4">4</button>
      </div>
    </div>
  </div>

  <!-- Zone principale -->
  <div class="frac-main"></div>

  <!-- Popup aide -->
  <div class="frac-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">✏️ Saisir une fraction</p>
    <p style="margin:0 0 6px">Écris le <b style="color:#4a90e2">numérateur</b> (partie coloriée) dans la case du haut et le <b style="color:#e06c4a">dénominateur</b> (nombre total de parts) dans la case du bas. La figure se met à jour automatiquement.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">🖱️ Cliquer sur les parts</p>
    <p style="margin:0 0 6px">Tu peux aussi <b>cliquer directement sur chaque part</b> de la figure pour la colorier ou la décolorier. Les cases numérateur/dénominateur se mettent à jour automatiquement.</p>
    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Paramètres</p>
    <p style="margin:0 0 6px"><b>Forme</b> — Choisis entre un rectangle ou un cercle.<br><b>Nombre de figures</b> — Affiche jusqu'à 4 fractions en même temps pour les comparer.<br><b>Couleur</b> — Change la couleur des parts coloriées.</p>
  </div>

  <!-- Poignée resize -->
  <div class="frac-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initFractionsWidget = function (widget) {

        const container   = widget.querySelector('.frac-container');
        const paramsBtn   = widget.querySelector('.frac-params-btn');
        const paramsPanel = widget.querySelector('.frac-params-panel');
        const helpBtn     = widget.querySelector('.frac-help-btn');
        const helpPopup   = widget.querySelector('.frac-help-popup');
        const mainZone    = widget.querySelector('.frac-main');
        const resizeHandle = widget.querySelector('.frac-resize-handle');
        const shapeBtns   = widget.querySelectorAll('.frac-shape-btn');
        const countBtns   = widget.querySelectorAll('.frac-count-btn');

        // ── État ──────────────────────────────────────────────────────────
        let shape      = 'rect';    // 'rect' | 'circle'
        let fracCount  = 1;         // nombre de fractions affichées
        let fillColor  = '#3b82f6'; // couleur de remplissage
        let showLabel  = true;      // afficher la fraction sous la forme
        // fractions[i] = { num: number, den: number, colored: Set<partIndex> }
        let fractions  = [];

        function defaultFrac() {
            return { num: 1, den: 4, colored: new Set([0]), cols: 4, rows: 1, color: fillColor, labelVisible: showLabel };
        }

        function initFractions() {
            fractions = [];
            for (let i = 0; i < fracCount; i++) fractions.push(defaultFrac());
            renderAll();
        }

        // ── Rendu SVG rectangle ────────────────────────────────────────────
        // Grille cols × rows — den = cols * rows, parts numérotées ligne par ligne
        function buildRectSVG(frac, figIdx, scale) {
            scale = scale || 1;
            const W = Math.round(220 * scale), H = Math.round(140 * scale);
            const MARGIN = 2;
            const RW = W - MARGIN * 2, RH = H - MARGIN * 2;
            const cols = Math.max(1, frac.cols || 1);
            const rows = Math.max(1, frac.rows || 1);
            const partW = RW / cols;
            const partH = RH / rows;
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

            const clipId = 'frac-clip-' + figIdx + '-' + Math.floor(Math.random()*99999);
            const defs = document.createElementNS(ns, 'defs');
            const clipPath = document.createElementNS(ns, 'clipPath');
            clipPath.setAttribute('id', clipId);
            const clipRect = document.createElementNS(ns, 'rect');
            clipRect.setAttribute('x', MARGIN); clipRect.setAttribute('y', MARGIN);
            clipRect.setAttribute('width', RW); clipRect.setAttribute('height', RH);
            clipRect.setAttribute('rx', 0);
            clipPath.appendChild(clipRect);
            defs.appendChild(clipPath);
            svg.appendChild(defs);

            const g = document.createElementNS(ns, 'g');
            g.setAttribute('clip-path', `url(#${clipId})`);

            // Parts : numérotées de gauche à droite, de haut en bas
            let partIdx = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const zone = document.createElementNS(ns, 'rect');
                    zone.setAttribute('x', MARGIN + c * partW);
                    zone.setAttribute('y', MARGIN + r * partH);
                    zone.setAttribute('width', partW);
                    zone.setAttribute('height', partH);
                    zone.setAttribute('fill', frac.colored.has(partIdx) ? (frac.color || fillColor) : '#f3f4f6');
                    zone.classList.add('frac-part');
                    zone.dataset.partIdx = partIdx;
                    zone.dataset.figIdx  = figIdx;
                    g.appendChild(zone);
                    partIdx++;
                }
            }

            // Traits verticaux intérieurs
            for (let c = 1; c < cols; c++) {
                const line = document.createElementNS(ns, 'line');
                line.setAttribute('x1', MARGIN + c * partW); line.setAttribute('y1', MARGIN);
                line.setAttribute('x2', MARGIN + c * partW); line.setAttribute('y2', MARGIN + RH);
                line.setAttribute('stroke', '#9ca3af'); line.setAttribute('stroke-width', '1.2');
                line.style.pointerEvents = 'none';
                g.appendChild(line);
            }
            // Traits horizontaux intérieurs
            for (let r = 1; r < rows; r++) {
                const line = document.createElementNS(ns, 'line');
                line.setAttribute('x1', MARGIN);           line.setAttribute('y1', MARGIN + r * partH);
                line.setAttribute('x2', MARGIN + RW);      line.setAttribute('y2', MARGIN + r * partH);
                line.setAttribute('stroke', '#9ca3af'); line.setAttribute('stroke-width', '1.2');
                line.style.pointerEvents = 'none';
                g.appendChild(line);
            }

            svg.appendChild(g);

            const border = document.createElementNS(ns, 'rect');
            border.setAttribute('x', MARGIN); border.setAttribute('y', MARGIN);
            border.setAttribute('width', RW); border.setAttribute('height', RH);
            border.setAttribute('rx', 0);
            border.setAttribute('fill', 'none');
            border.setAttribute('stroke', '#6b7280');
            border.setAttribute('stroke-width', '2');
            border.style.pointerEvents = 'none';
            svg.appendChild(border);

            return svg;
        }

        // ── Synchronise den = cols * rows, préserve les parts coloriées ──────
        function syncDenFromGrid(frac, figIdx) {
            const newDen = frac.cols * frac.rows;
            // Garder uniquement les parts qui existent encore
            const newColored = new Set();
            frac.colored.forEach(i => { if (i < newDen) newColored.add(i); });
            frac.colored = newColored;
            frac.den = newDen;
            frac.num = frac.colored.size;
        }

        // ── Rendu SVG cercle (camembert) ───────────────────────────────────
        function buildCircleSVG(frac, figIdx, scale) {
            scale = scale || 1;
            const R = Math.round(80 * scale), CX = Math.round(82 * scale), CY = Math.round(82 * scale), SIZE = Math.round(164 * scale);
            const den = Math.max(1, frac.den);
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

            if (den === 1) {
                // Cercle plein unique
                const circle = document.createElementNS(ns, 'circle');
                circle.setAttribute('cx', CX); circle.setAttribute('cy', CY); circle.setAttribute('r', R);
                const colored = frac.colored.has(0);
                circle.setAttribute('fill', colored ? (frac.color || fillColor) : '#f3f4f6');
                circle.setAttribute('stroke', '#d1d5db');
                circle.setAttribute('stroke-width', '1.5');
                circle.classList.add('frac-part');
                circle.dataset.partIdx = 0;
                circle.dataset.figIdx  = figIdx;
                svg.appendChild(circle);
                return svg;
            }

            const angleStep = (2 * Math.PI) / den;
            // Départ à -π/2 (haut)
            for (let i = 0; i < den; i++) {
                const startAngle = -Math.PI / 2 + i * angleStep;
                const endAngle   = startAngle + angleStep;
                const x1 = CX + R * Math.cos(startAngle);
                const y1 = CY + R * Math.sin(startAngle);
                const x2 = CX + R * Math.cos(endAngle);
                const y2 = CY + R * Math.sin(endAngle);
                const largeArc = angleStep > Math.PI ? 1 : 0;
                const d = `M ${CX} ${CY} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
                const path = document.createElementNS(ns, 'path');
                path.setAttribute('d', d);
                const colored = frac.colored.has(i);
                path.setAttribute('fill', colored ? (frac.color || fillColor) : '#f3f4f6');
                path.setAttribute('stroke', '#374151');
                path.setAttribute('stroke-width', '2');
                path.classList.add('frac-part');
                path.dataset.partIdx = i;
                path.dataset.figIdx  = figIdx;
                svg.appendChild(path);
            }
            // Contour cercle
            const outline = document.createElementNS(ns, 'circle');
            outline.setAttribute('cx', CX); outline.setAttribute('cy', CY); outline.setAttribute('r', R);
            outline.setAttribute('fill', 'none');
            outline.setAttribute('stroke', '#374151');
            outline.setAttribute('stroke-width', '2');
            outline.style.pointerEvents = 'none';
            svg.appendChild(outline);
            return svg;
        }

        // ── Construire une figure (SVG + label) ────────────────────────────
        function buildFigure(frac, figIdx) {
            const figDiv = document.createElement('div');
            figDiv.className = 'frac-figure';
            figDiv.dataset.figIdx = figIdx;

            // Helper : bande de swatches couleur pour une fraction
            function makeSwatches() {
                const COLORS = ['#3b82f6','#ef4444','#22c55e','#ec4899','#e3d72d'];
                const swatchWrap = document.createElement('div');
                swatchWrap.style.cssText = 'display:flex;gap:4px;align-items:center;justify-content:center;margin-bottom:4px;';
                COLORS.forEach(c => {
                    const sw = document.createElement('div');
                    sw.style.cssText = `width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${(frac.color||fillColor)===c ? '#374151' : 'transparent'};transition:transform .15s,border-color .1s;flex-shrink:0;`;
                    let _lastSw = 0;
                    function onSwClick(e) {
                        const now = Date.now();
                        if (now - _lastSw < 300) return;
                        _lastSw = now;
                        e.stopPropagation();
                        frac.color = c;
                        renderFigure(figIdx);
                        if (typeof saveBoard === 'function') saveBoard();
                    }
                    sw.addEventListener('mousedown',   e => e.stopPropagation());
                    sw.addEventListener('pointerdown', e => e.stopPropagation());
                    sw.addEventListener('click',     onSwClick);
                    sw.addEventListener('pointerup', onSwClick);
                    swatchWrap.appendChild(sw);
                });
                return swatchWrap;
            }

            // Contrôles AU-DESSUS du SVG
            // Helper générique stepper +/− (partagé rect et circle)
            function makeAxisCtrl(label, getValue, onMinus, onPlus, skipSync) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;align-items:center;gap:3px;';
                const lbl = document.createElement('span');
                lbl.style.cssText = 'font-size:10px;color:#6b7280;font-weight:700;';
                lbl.textContent = label;
                const btnM = document.createElement('button');
                btnM.textContent = '−';
                btnM.style.cssText = 'width:18px;height:18px;border-radius:50%;border:1.5px solid #d1d5db;background:#f3f4f6;color:#6b7280;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;touch-action:manipulation;';
                const valEl = document.createElement('span');
                valEl.style.cssText = 'font-size:11px;font-weight:800;color:#374151;min-width:14px;text-align:center;';
                valEl.textContent = getValue();
                const btnP = document.createElement('button');
                btnP.textContent = '+';
                btnP.style.cssText = 'width:18px;height:18px;border-radius:50%;border:1.5px solid #d1d5db;background:#f3f4f6;color:#6b7280;cursor:pointer;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;touch-action:manipulation;';

                function makeStepHandler(fn) {
                    // Dédup par horodatage (au lieu d'un simple drapeau _done) : robuste
                    // même quand un stylet/écran interactif émet un pointerup en trop
                    // ou dans un ordre inattendu par rapport au click.
                    let _last = 0;
                    function fire() {
                        const now = Date.now();
                        if (now - _last < 300) return;
                        _last = now;
                        fn();
                        valEl.textContent = getValue();
                        if (!skipSync) syncDenFromGrid(frac, figIdx);
                        renderFigure(figIdx);
                        syncInputs(figIdx);
                        if (typeof saveBoard === 'function') saveBoard();
                    }
                    return {
                        onPointerUp: function(e) { e.stopPropagation(); fire(); },
                        onClick: function(e) { e.stopPropagation(); e.preventDefault(); fire(); }
                    };
                }
                const handlerM = makeStepHandler(onMinus);
                const handlerP = makeStepHandler(onPlus);
                [btnM, btnP].forEach(b => {
                    b.addEventListener('mousedown',   e => e.stopPropagation());
                    b.addEventListener('pointerdown', e => e.stopPropagation());
                });
                btnM.addEventListener('pointerup', (e) => handlerM.onPointerUp(e));
                btnM.addEventListener('click',     (e) => handlerM.onClick(e));
                btnP.addEventListener('pointerup', (e) => handlerP.onPointerUp(e));
                btnP.addEventListener('click',     (e) => handlerP.onClick(e));

                wrap.appendChild(lbl); wrap.appendChild(btnM); wrap.appendChild(valEl); wrap.appendChild(btnP);
                return wrap;
            }

            // Label fraction AU-DESSUS de la figure + bouton œil
            const lblWrap = document.createElement('div');
            lblWrap.className = 'frac-label-wrap';

            const fracLabelVisible = frac.labelVisible !== undefined ? frac.labelVisible : showLabel;

            const eyeBtn = document.createElement('button');
            eyeBtn.className = 'frac-eye-btn' + (fracLabelVisible ? '' : ' hidden');
            eyeBtn.title = fracLabelVisible ? 'Cacher la fraction' : 'Afficher la fraction';
            eyeBtn.textContent = '👁';

            const lbl = document.createElement('div');
            lbl.className = 'frac-fig-label';
            const num = Math.max(0, Math.min(frac.num, frac.den));
            const den = Math.max(1, frac.den);
            lbl.innerHTML = `<span class="fn">${num}</span><div class="fb"></div><span class="fd">${den}</span>`;
            lbl.style.visibility = fracLabelVisible ? '' : 'hidden';

            let _eyeDone = false;
            function toggleLabel(e) {
                e.stopPropagation(); e.preventDefault();
                const visible = lbl.style.visibility !== 'hidden';
                lbl.style.visibility = visible ? 'hidden' : '';
                eyeBtn.classList.toggle('hidden', visible);
                eyeBtn.title = visible ? 'Afficher la fraction' : 'Cacher la fraction';
                frac.labelVisible = !visible;
                if (typeof saveBoard === 'function') saveBoard();
            }
            eyeBtn.addEventListener('pointerup', (e) => { toggleLabel(e); _eyeDone = true; });
            eyeBtn.addEventListener('click',     (e) => { if (_eyeDone) { _eyeDone = false; return; } toggleLabel(e); });
            eyeBtn.addEventListener('pointerdown', e => e.stopPropagation());
            eyeBtn.addEventListener('mousedown',   e => e.stopPropagation());

            lblWrap.appendChild(eyeBtn);
            lblWrap.appendChild(lbl);
            figDiv.appendChild(lblWrap);

            // Figure (SVG)
            const svgEl = shape === 'rect' ? buildRectSVG(frac, figIdx, 1) : buildCircleSVG(frac, figIdx, 1);
            figDiv.appendChild(svgEl);

            // Contrôles SOUS la figure : couleur + lignes/colonnes (ou parts pour le cercle)
            if (shape === 'rect') {
                figDiv.appendChild(makeSwatches());

                const gridCtrl = document.createElement('div');
                gridCtrl.style.cssText = 'display:flex;gap:10px;align-items:center;margin-top:4px;justify-content:center;flex-wrap:wrap;';

                const rowCtrl = makeAxisCtrl('lignes',
                    () => frac.rows,
                    () => { if (frac.rows > 1) frac.rows--; },
                    () => { if (frac.rows < 8) frac.rows++; }
                );
                const colCtrl = makeAxisCtrl('colonnes',
                    () => frac.cols,
                    () => { if (frac.cols > 1) frac.cols--; },
                    () => { if (frac.cols < 8) frac.cols++; }
                );

                gridCtrl.appendChild(rowCtrl);
                const sep = document.createElement('span');
                sep.textContent = '×';
                sep.style.cssText = 'font-size:11px;color:#9ca3af;font-weight:700;';
                gridCtrl.appendChild(sep);
                gridCtrl.appendChild(colCtrl);
                figDiv.appendChild(gridCtrl);

            } else if (shape === 'circle') {
                figDiv.appendChild(makeSwatches());

                const circleCtrl = document.createElement('div');
                circleCtrl.style.cssText = 'display:flex;gap:10px;align-items:center;margin-top:4px;justify-content:center;';
                const partsCtrl = makeAxisCtrl('parts',
                    () => frac.den,
                    () => {
                        if (frac.den > 1) {
                            frac.den--;
                            frac.num = Math.min(frac.num, frac.den);
                            const nc = new Set(); for (let i = 0; i < frac.num; i++) nc.add(i);
                            frac.colored = nc;
                        }
                    },
                    () => { if (frac.den < 32) frac.den++; },
                    true // skipSync : den géré directement, pas via cols×rows
                );
                circleCtrl.appendChild(partsCtrl);
                figDiv.appendChild(circleCtrl);
            }

            // Click sur une part (pointerup + click avec dédup pour éviter double déclenchement)
            let _lastPartEvent = 0;
            function onPartActivate(e) {
                const now = Date.now();
                if (now - _lastPartEvent < 300) return;
                _lastPartEvent = now;
                const part = e.target.closest('.frac-part');
                if (!part) return;
                const pIdx = parseInt(part.dataset.partIdx);
                if (frac.colored.has(pIdx)) {
                    frac.colored.delete(pIdx);
                } else {
                    frac.colored.add(pIdx);
                }
                frac.num = frac.colored.size;
                renderFigure(figIdx);
                syncInputs(figIdx);
                if (typeof saveBoard === 'function') saveBoard();
            }
            svgEl.addEventListener('click',     onPartActivate);
            svgEl.addEventListener('pointerup', onPartActivate);

            return figDiv;
        }

        // ── Construire le contrôle de saisie pour une fraction ─────────────
        function buildControls(frac, figIdx) {
            const wrap = document.createElement('div');
            wrap.className = 'frac-controls';
            wrap.dataset.figIdx = figIdx;

            const notation = document.createElement('div');
            notation.className = 'frac-notation';

            // Inputs cachés (conservés pour compatibilité syncInputs)
            const numInput = document.createElement('input');
            numInput.type = 'number'; numInput.min = 0;
            numInput.className = 'frac-num-input';
            numInput.value = frac.num;

            const denInput = document.createElement('input');
            denInput.type = 'number'; denInput.min = 1; denInput.max = 64;
            denInput.className = 'frac-den-input';
            denInput.value = frac.den;

            // Helper stepper
            function makeStepperFrac(labelClass, getVal, onMinus, onPlus) {
                const lblEl = document.createElement('div');
                lblEl.className = labelClass === 'num' ? 'frac-label-num' : 'frac-label-den';
                lblEl.textContent = labelClass === 'num' ? 'Numérateur' : 'Dénominateur';

                const stepWrap = document.createElement('div');
                stepWrap.className = 'frac-stepper';

                const btnM = document.createElement('button');
                btnM.className = 'frac-step-btn';
                btnM.textContent = '−';

                const valEl = document.createElement('span');
                valEl.className = 'frac-step-val ' + labelClass;
                valEl.textContent = getVal();

                const btnP = document.createElement('button');
                btnP.className = 'frac-step-btn';
                btnP.textContent = '+';

                // Dédup par horodatage (au lieu d'un drapeau _done) : robuste même
                // quand un stylet/écran interactif émet un pointerup en trop.
                let _lastM = 0, _lastP = 0;
                const handlerM = {
                    onPointerUp(e) { e.stopPropagation(); _fireM(); },
                    onClick(e) { e.stopPropagation(); e.preventDefault(); _fireM(); }
                };
                function _fireM() {
                    const now = Date.now();
                    if (now - _lastM < 300) return;
                    _lastM = now;
                    onMinus(); valEl.textContent = getVal();
                    renderFigure(figIdx); syncInputs(figIdx);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                const handlerP = {
                    onPointerUp(e) { e.stopPropagation(); _fireP(); },
                    onClick(e) { e.stopPropagation(); e.preventDefault(); _fireP(); }
                };
                function _fireP() {
                    const now = Date.now();
                    if (now - _lastP < 300) return;
                    _lastP = now;
                    onPlus(); valEl.textContent = getVal();
                    renderFigure(figIdx); syncInputs(figIdx);
                    if (typeof saveBoard === 'function') saveBoard();
                }

                [btnM, btnP].forEach(b => {
                    b.addEventListener('mousedown',   e => e.stopPropagation());
                    b.addEventListener('pointerdown', e => e.stopPropagation());
                });
                btnM.addEventListener('pointerup', (e) => handlerM.onPointerUp(e));
                btnM.addEventListener('click',     (e) => handlerM.onClick(e));
                btnP.addEventListener('pointerup', (e) => handlerP.onPointerUp(e));
                btnP.addEventListener('click',     (e) => handlerP.onClick(e));

                stepWrap.appendChild(btnM);
                stepWrap.appendChild(valEl);
                stepWrap.appendChild(btnP);
                return { lblEl, stepWrap };
            }

            const bar = document.createElement('div');
            bar.className = 'frac-bar';

            // Numérateur
            const sNum = makeStepperFrac('num',
                () => frac.num,
                () => { frac.num = Math.max(0, frac.num - 1); frac.colored = new Set(); for (let i = 0; i < frac.num; i++) frac.colored.add(i); numInput.value = frac.num; },
                () => { frac.num = Math.min(frac.den, frac.num + 1); frac.colored = new Set(); for (let i = 0; i < frac.num; i++) frac.colored.add(i); numInput.value = frac.num; }
            );

            // Dénominateur
            const sDen = makeStepperFrac('den',
                () => frac.den,
                () => {
                    if (frac.den <= 1) return;
                    frac.den--;
                    frac.cols = frac.rows === 1 ? frac.den : frac.cols;
                    frac.rows = frac.cols === 1 ? frac.den : frac.rows;
                    if (frac.rows === 1) frac.cols = frac.den;
                    frac.num = Math.min(frac.num, frac.den);
                    const nc = new Set(); let ct = 0;
                    for (let i = 0; i < frac.den; i++) { if (frac.colored.has(i) && ct < frac.den) { nc.add(i); ct++; } }
                    frac.colored = nc;
                    denInput.value = frac.den; numInput.value = frac.num;
                },
                () => {
                    if (frac.den >= 64) return;
                    frac.den++;
                    if (frac.rows === 1) frac.cols = frac.den;
                    else if (frac.cols === 1) frac.rows = frac.den;
                    else { frac.cols = frac.den; frac.rows = 1; }
                    denInput.value = frac.den;
                }
            );

            notation.appendChild(sNum.lblEl);
            notation.appendChild(sNum.stepWrap);
            notation.appendChild(numInput);
            notation.appendChild(bar);
            notation.appendChild(sDen.stepWrap);
            notation.appendChild(denInput);
            notation.appendChild(sDen.lblEl);
            wrap.appendChild(notation);
            return wrap;
        }

        // ── Render une figure (mise à jour partielle) ─────────────────────
        function renderFigure(figIdx) {
            const frac = fractions[figIdx];
            const col = mainZone.querySelector('.frac-col[data-col-idx="' + figIdx + '"]');
            if (!col) return;
            const figZone = col.querySelector('.frac-figures');
            if (!figZone) return;
            figZone.innerHTML = '';
            figZone.appendChild(buildFigure(frac, figIdx));
        }

        // ── Synchroniser les inputs depuis l'état interne ──────────────────
        function syncInputs(figIdx) {
            const frac = fractions[figIdx];
            const col = mainZone.querySelector('.frac-col[data-col-idx="' + figIdx + '"]');
            if (!col) return;
            const lbl = col.querySelector('.frac-fig-label');
            if (lbl) {
                const num = Math.max(0, Math.min(frac.num, frac.den));
                lbl.innerHTML = `<span class="fn">${num}</span><div class="fb"></div><span class="fd">${frac.den}</span>`;
            }
        }

        // ── Cercle : diamètre max ≈ largeur du widget ÷ nombre de formes (comme le rectangle) ──
        // mais sans jamais dépasser la hauteur disponible (le cercle est carré, contrairement au rectangle)
        function updateCircleMax() {
            const n = Math.max(1, fractions.length);
            const zoneW = mainZone.offsetWidth  || container.offsetWidth  || 0;
            const zoneH = mainZone.offsetHeight || container.offsetHeight || 0;
            if (!zoneW) return;
            // Facteur plus réduit quand il y a peu de cercles (sinon ils paraissent trop grands)
            const widthFactor = n === 1 ? 0.32 : n === 2 ? 0.60 : 0.92;
            const widthBased = (zoneW / n) * widthFactor;
            // On réserve de la place pour le label au-dessus et les contrôles en dessous de la figure
            const RESERVED_V = 110;
            const heightBased = Math.max(60, zoneH - RESERVED_V);
            const px = Math.max(90, Math.round(Math.min(widthBased, heightBased)));
            mainZone.style.setProperty('--frac-circle-max', px + 'px');
        }
        if (!widget._wfCircleResizeObs && typeof ResizeObserver === 'function') {
            widget._wfCircleResizeObs = new ResizeObserver(() => updateCircleMax());
            widget._wfCircleResizeObs.observe(mainZone);
        }

        // ── Rendu complet — toutes les fractions côte à côte ─────────────
        // ── Rendu complet — N colonnes selon le nombre de fractions actives ──
        function renderAll() {
            mainZone.innerHTML = '';
            mainZone.style.setProperty('--frac-cols', fractions.length);
            const innerW = fractions.length === 1 ? '45%' : fractions.length === 2 ? '80%' : '95%';
            mainZone.style.setProperty('--frac-inner-w', innerW);
            fractions.forEach((frac, i) => {
                const col = document.createElement('div');
                col.className = 'frac-col shape-' + shape;
                col.dataset.colIdx = i;

                const inner = document.createElement('div');
                inner.className = 'frac-inner';

                const figZone = document.createElement('div');
                figZone.className = 'frac-figures';
                figZone.appendChild(buildFigure(frac, i));
                inner.appendChild(figZone);

                col.appendChild(inner);
                mainZone.appendChild(col);
            });
            updateCircleMax();
        }

        // ── Mettre à jour la couleur sans tout rerender ────────────────────
        function updateColor() {
            mainZone.querySelectorAll('.frac-part').forEach(part => {
                const figIdx = parseInt(part.dataset.figIdx);
                const pIdx   = parseInt(part.dataset.partIdx);
                const frac   = fractions[figIdx];
                if (frac && frac.colored.has(pIdx)) {
                    part.setAttribute('fill', frac.color || fillColor);
                }
            });
        }

        // ── Panneau paramètres ─────────────────────────────────────────────
        paramsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });

        // ── Choix de la forme ──────────────────────────────────────────────
        shapeBtns.forEach(btn => {
            let _lastShapeEvent = 0;
            function onShapeActivate(e) {
                const now = Date.now();
                if (now - _lastShapeEvent < 300) return;
                _lastShapeEvent = now;
                e.stopPropagation();
                shapeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                shape = btn.dataset.shape;
                // Passage vers cercle : plafonner den à 32
                if (shape === 'circle') {
                    fractions.forEach(f => {
                        if (f.den > 32) {
                            f.den = 32;
                            f.num = Math.min(f.num, 32);
                            const nc = new Set();
                            for (let i = 0; i < f.num; i++) nc.add(i);
                            f.colored = nc;
                        }
                    });
                }
                // Passage vers rectangle : plafonner cols et rows à 8
                if (shape === 'rect') {
                    fractions.forEach(f => {
                        f.cols = Math.min(f.cols || f.den, 8);
                        f.rows = Math.min(f.rows || 1, 8);
                        f.den  = f.cols * f.rows;
                        f.num  = Math.min(f.num, f.den);
                        const nc = new Set();
                        for (let i = 0; i < f.num; i++) nc.add(i);
                        f.colored = nc;
                    });
                }
                renderAll();
                if (typeof saveBoard === 'function') saveBoard();
            }
            btn.addEventListener('click',     onShapeActivate);
            btn.addEventListener('pointerup', onShapeActivate);
        });

        // ── Choix du nombre de fractions ───────────────────────────────────
        countBtns.forEach(btn => {
            let _lastCountEvent = 0;
            function onCountActivate(e) {
                const now = Date.now();
                if (now - _lastCountEvent < 300) return;
                _lastCountEvent = now;
                e.stopPropagation();
                countBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const newCount = parseInt(btn.dataset.count);
                if (newCount > fracCount) {
                    for (let i = fracCount; i < newCount; i++) fractions.push(defaultFrac());
                } else {
                    fractions = fractions.slice(0, newCount);
                }
                fracCount = newCount;
                renderAll();
                if (typeof saveBoard === 'function') saveBoard();
            }
            btn.addEventListener('click',     onCountActivate);
            btn.addEventListener('pointerup', onCountActivate);
        });

        // ── Aide ───────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) {
                helpPopup.classList.remove('show');
            }
        }, true);

        // ── Boutons wf (min / max / close) ────────────────────────────────
        widget.querySelector('[data-role="wf-min"]').addEventListener('click', (e) => {
            e.stopPropagation();
            window._wfMiniBarCollapse(widget, '➗ Fractions');
        });

        widget.querySelector('[data-role="wf-max"]').addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('wf-fullboard');
            if (typeof saveBoard === 'function') saveBoard();
        });

        widget.querySelector('[data-role="wf-close"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Drag du widget via l'en-tête ──────────────────────────────────
        const header = container.querySelector('.frac-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            // Laisser le système de drag natif du widget s'en occuper
        });

        // ── Redimensionnement libre ────────────────────────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            const onMove = (ev) => {
                const newW = Math.max(360, startW + ev.clientX - startX);
                const newH = Math.max(220, startH + ev.clientY - startY);
                container.style.width  = newW + 'px';
                container.style.height = newH + 'px';
            };
            const onUp = () => {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
                widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup', onUp);
        });

        // ── getData / setData pour save-load ──────────────────────────────
        widget._fracGetData = function () {
            return {
                shape,
                fracCount,
                fillColor,
                showLabel,
                fractions: fractions.map(f => ({
                    num: f.num,
                    den: f.den,
                    colored: Array.from(f.colored),
                    splitDir: f.splitDir || 'v',
                    cols: f.cols || 1,
                    rows: f.rows || 1,
                    color: f.color || fillColor,
                    labelVisible: f.labelVisible !== undefined ? f.labelVisible : showLabel
                })),
                containerW: container.offsetWidth,
                containerH: container.offsetHeight,
                fullboard: container.classList.contains('wf-fullboard')
            };
        };

        widget._fracSetData = function (data) {
            if (!data) return;
            if (data.shape) {
                shape = data.shape;
                shapeBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.shape === shape);
                });
            }
            if (data.fracCount) {
                fracCount = data.fracCount;
                countBtns.forEach(b => {
                    b.classList.toggle('active', parseInt(b.dataset.count) === fracCount);
                });
            }
            if (data.fillColor) {
                fillColor = data.fillColor;
                swatches.forEach(s => {
                    s.classList.toggle('active', s.dataset.color === fillColor);
                });
            }
            if (typeof data.showLabel === 'boolean') {
                showLabel = data.showLabel;
            }
            if (data.fractions && Array.isArray(data.fractions)) {
                fractions = data.fractions.map(f => ({
                    num: f.num,
                    den: f.den,
                    colored: new Set(f.colored || []),
                    splitDir: f.splitDir || 'v',
                    cols: f.cols || f.den || 1,
                    rows: f.rows || 1,
                    color: f.color || fillColor,
                    labelVisible: f.labelVisible !== undefined ? f.labelVisible : showLabel
                }));
                fracCount = fractions.length;
                countBtns.forEach(b => {
                    b.classList.toggle('active', parseInt(b.dataset.count) === fracCount);
                });
            }
            renderAll();
            if (data.fullboard) container.classList.add('wf-fullboard');
        };

        // ── Init ──────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            initFractions();
            // Le widget s'ouvre à 100px du bord gauche du board.
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'fractions') initFractionsWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'fractions') initFractionsWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
