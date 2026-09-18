// =========================================================================
// WIDGET LOTO DES MULTIPLICATIONS — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'loto-multi'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-loto-multi.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('loto-multi');closeMainMenu()">
//          <span class="mm-ico">✖️</span>Loto des multiplications
//      </div>
// =========================================================================

(function () {

    // ── Utilitaire mini-barre collapse (réutilise celle de nature-gramm si présente) ──
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

    // ── CSS ────────────────────────────────────────────────────────────────
    if (!window._wfBtnsStyleInjected) {
        window._wfBtnsStyleInjected = true;
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
    }

    if (!document.getElementById('widget-loto-multi-style')) {
        const s = document.createElement('style');
        s.id = 'widget-loto-multi-style';
        s.textContent = `
        .widget[data-type="loto-multi"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .lm-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 18px;
            padding: 16px 18px 14px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
            width: 1000px;
            min-width: 500px;
            min-height: 800px;
        }

        .lm-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── En-tête ── */
        .lm-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .lm-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }
        .lm-params-btn, .lm-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 13px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .lm-params-btn:hover, .lm-help-btn:hover { background: #e0e0e0; color: #333; }
        .lm-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Panneau paramètres ── */
        .lm-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px 14px;
            display: none;
            flex-direction: column;
            gap: 10px;
            flex-shrink: 0;
        }
        .lm-params-panel.show { display: flex; }
        .lm-params-title {
            font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .lm-params-row {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .lm-params-row label {
            font-size: 11px; color: #374151; white-space: nowrap; font-weight: 600;
        }
        .lm-params-row input[type=number] {
            width: 60px; padding: 4px 8px; border-radius: 6px;
            border: 1px solid #d1d5db; background: #ffffff;
            color: #374151; font-size: 12px; outline: none;
        }
        .lm-params-row input[type=number]:focus { border-color: #4a90e2; }
        .lm-params-apply-btn {
            padding: 5px 14px; border-radius: 7px; border: none;
            background: #4a90e2; color: white; font-size: 11px;
            font-weight: 700; cursor: pointer; transition: background .15s;
        }
        .lm-params-apply-btn:hover { background: #357abd; }
        .lm-params-download-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 7px;
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            color: #166534;
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }
        .lm-params-download-btn:hover { background: #dcfce7; border-color: #4ade80; }

        /* ── Zone affichage multiplication ── */
        .lm-display-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 20px;
            background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
            border-radius: 14px;
            border: 1px solid #d1d5db;
            flex-shrink: 0;
            min-height: 200px;
            position: relative;
        }

        @font-face {
			font-family: 'Marelle';
            src: url('polices/Marelle-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
		
		@font-face {
			font-family: 'Nunito';
            src: url('polices/Nunito-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        .lm-mult-display {
            font-size: 100px;
            font-family: 'Marelle', 'Segoe UI', system-ui, sans-serif;
            font-weight: 900;
            color: #ffd700;
            letter-spacing: 2px;
            text-shadow: 0 0 30px rgba(255,215,0,0.4);
            line-height: 1;
            text-align: center;
        }

        .lm-mult-idle {
			font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
            font-size: 18px;
            color: #9ca3af;
            text-align: center;
        }

        /* ── Timer ── */
        .lm-timer-wrap {
            display: flex;
            align-items: center;
			padding : 20px 0px 0px 0px;
            gap: 8px;
            width: 100%;
            max-width: 320px;
        }
        .lm-timer-bar-bg {
            flex: 1;
            height: 8px;
            background: rgba(255,255,255,0.15);
            border-radius: 4px;
            overflow: hidden;
        }
        .lm-timer-bar {
            height: 100%;
            background: linear-gradient(90deg, #48bb78, #ffd700, #fc8181);
            border-radius: 4px;
            transition: width 0.1s linear, background 0.3s;
            width: 100%;
        }
        .lm-timer-text {
            font-size: 13px;
            font-weight: 700;
            color: #e2e8f0;
            min-width: 28px;
            text-align: right;
        }

        /* ── Compteur ── */
        .lm-counter {
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
        }

        /* ── Contrôles principaux ── */
        .lm-controls {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
            flex-shrink: 0;
        }
        .lm-btn {
            padding: 7px 16px;
            border-radius: 8px;
            border: none;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all .15s;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .lm-btn-start {
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
        }
        .lm-btn-start:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .lm-btn-pause {
            background: #ed8936;
            color: white;
        }
        .lm-btn-pause:hover { filter: brightness(1.1); }
        .lm-btn-reset {
            background: #f3f4f6;
            color: #6b7280;
            border: 1px solid #d1d5db;
        }
        .lm-btn-reset:hover { background: #e5e7eb; color: #374151; }
        .lm-btn-next {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        .lm-btn-next:hover { filter: brightness(1.1); }
        .lm-btn-verif {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }
        .lm-btn-verif:hover { filter: brightness(1.1); }
        .lm-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            transform: none !important;
            filter: none !important;
        }

        /* ── Historique des tirages ── */
        .lm-history-zone {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 8px 12px;
            overflow-y: auto;
            min-height: 80px;
            display: none;
        }
        .lm-history-zone.show { display: block; }
        .lm-history-title {
            font-size: 10px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        .lm-history-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        .lm-history-item {
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 700;
            color: #374151;
            white-space: nowrap;
        }
        .lm-history-item .lm-result-num {
            color: #1d4ed8;
            margin-left: 3px;
        }
        .lm-btn-history {
            background: #f3f4f6;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 5px 12px;
            border-radius: 7px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s;
        }
        .lm-btn-history:hover { background: #e5e7eb; color: #374151; }
        .lm-btn-history.active { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }

        /* ── Zone vérification ── */
        .lm-verif-zone {
            background: #ddd;
            border: 2px solid #f59e0b;
            border-radius: 12px;
            padding: 16px 18px;
            display: none;
            flex-direction: column;
            gap: 12px;
            flex-shrink: 0;
        }
        .lm-verif-zone.show { display: flex; }
        .lm-verif-title {
            font-size: 20px; font-weight: 800; color: #92400e; letter-spacing: 0.2px;
        }
        .lm-verif-input-row {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        .lm-verif-input-row label {
            font-size: 12px; color: #78350f; white-space: nowrap; font-weight: 600;
        }
        .lm-verif-numbers {
            flex: 1;
            padding: 10px 14px;
            border-radius: 9px;
            border: 2px solid #f59e0b;
            background: #ffffff;
            color: #374151;
            font-size: 20px;
            font-weight: 700;
            outline: none;
            min-width: 160px;
        }
        .lm-verif-numbers:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
        .lm-btn-check-verif {
            background: #f59e0b;
            color: white;
            padding: 10px 20px;
            border-radius: 9px;
            border: none;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            transition: background .15s;
            white-space: nowrap;
        }
        .lm-btn-check-verif:hover { background: #d97706; }

        .lm-verif-result {
            font-size: 15px;
            font-weight: 700;
            line-height: 1.8;
            display: none;
            background: #ffffff;
            border-radius: 8px;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
        }
        .lm-verif-result.show { display: block; }
        .lm-verif-items-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 12px;
        }
        .lm-verif-ok-item {
            color: #15803d;
        }
        .lm-verif-err-item {
            color: #dc2626;
        }

        .lm-btn-continue {
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 9px 20px;
            border-radius: 8px;
            border: none;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            transition: all .15s;
            display: none;
            align-self: flex-start;
        }
        .lm-btn-continue.show { display: block; }
        .lm-btn-continue:hover { filter: brightness(1.1); }

        /* ── Popup aide ── */
        .lm-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.7;
        }
        .lm-help-popup.show { display: block; }
        .lm-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .lm-help-popup p  { margin: 0 0 6px; }
        .lm-help-popup b  { color: #374151; }

        /* ── Poignée resize ── */
        .lm-resize-handle {
            position: absolute;
            bottom: 4px; right: 4px;
            width: 16px; height: 16px;
            cursor: se-resize;
            opacity: 0.3;
            background: linear-gradient(135deg, transparent 50%, #6b7280 50%);
            border-radius: 0 0 4px 0;
        }
        .lm-resize-handle:hover { opacity: 0.7; }

        /* ── État pause ── */
        .lm-paused-overlay {
            display: none;
            position: absolute;
            inset: 0;
            background: rgba(15, 39, 68, 0.55);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border-radius: 14px;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 900;
            color: #ffd700;
            letter-spacing: 3px;
            text-shadow: 0 2px 12px rgba(0,0,0,0.5);
            z-index: 5;
        }
        .lm-paused-overlay.show { display: flex; }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-loto-multi';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="lm-container">

  <!-- En-tête -->
  <div class="lm-header">
    <span class="lm-title">✖️ Loto des Multiplications</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="lm-params-btn" title="Paramètres">⚙</button>
      <button class="lm-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="lm-params-panel">
    <div class="lm-params-title">⚙ Paramètres</div>
    <div class="lm-params-row">
      <label>⏱ Durée par multiplication :</label>
      <input type="number" class="lm-timer-input" value="15" min="3" max="120" step="1">
      <label>secondes</label>
    </div>
    <div class="lm-params-row">
      <button class="lm-params-apply-btn">✔ Appliquer</button>
    </div>
    <div style="height:1px;background:#e5e7eb;margin:2px 0;"></div>
    <div class="lm-params-row">
      <a class="lm-params-download-btn" href="docs/cartons-loto-multiplications.pdf" download>
        📥 Télécharger les cartons (PDF)
      </a>
    </div>
  </div>

  <!-- Zone affichage multiplication -->
  <div class="lm-display-zone">
    <div class="lm-mult-display lm-mult-idle-el">
      <span class="lm-mult-idle">Appuie sur ▶ Démarrer pour commencer</span>
    </div>
    <div class="lm-timer-wrap" style="display:none">
      <div class="lm-timer-bar-bg"><div class="lm-timer-bar"></div></div>
      <div class="lm-timer-text">15</div>
    </div>
    <div class="lm-counter"></div>
    <div class="lm-paused-overlay">⏸ PAUSE</div>
  </div>

  <!-- Contrôles principaux -->
  <div class="lm-controls">
    <button class="lm-btn lm-btn-start">▶ Démarrer</button>
    <button class="lm-btn lm-btn-pause" disabled>⏸ Pause</button>
    <button class="lm-btn lm-btn-next"  disabled>⏭ Suivant</button>
    <button class="lm-btn lm-btn-reset">🔄 Réinitialiser</button>
    <button class="lm-btn lm-btn-verif" disabled>🔍 Vérifier un carton</button>
    <button class="lm-btn-history" disabled>📋 Tirages</button>
  </div>

  <!-- Zone vérification carton élève -->
  <div class="lm-verif-zone">
    <div class="lm-verif-title">🔍 Vérification du carton</div>
    <div class="lm-verif-input-row">
      <label>Résultats cochés par l'élève :</label>
      <input type="text" class="lm-verif-numbers" placeholder="Ex : 6 12 24 36…">
      <button class="lm-btn-check-verif">Vérifier</button>
    </div>
    <div class="lm-verif-result"></div>
    <button class="lm-btn-continue">▶ Continuer le jeu</button>
  </div>

  <!-- Historique des tirages (caché par défaut) -->
  <div class="lm-history-zone">
    <div class="lm-history-title">📋 Multiplications déjà tirées</div>
    <div class="lm-history-list"></div>
  </div>

  <!-- Popup aide -->
  <div class="lm-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>
    <p><b>⚙ Paramètres</b> — Règle la durée d'affichage de chaque multiplication et la valeur max des facteurs.</p>
    <p><b>▶ Démarrer</b> — Lance le jeu. Une multiplication s'affiche, le compte à rebours démarre. La prochaine multiplication s'affiche automatiquement quand le temps est écoulé.</p>
    <p><b>⏭ Suivant</b> — Passe à la multiplication suivante sans attendre la fin du timer.</p>
    <p><b>⏸ Pause</b> — Suspend le timer (sans changer de multiplication).</p>
    <p><b>🔄 Réinitialiser</b> — Remet tout à zéro pour une nouvelle partie.</p>
    <p><b>🔍 Vérifier un carton</b> — Un élève pense avoir une quine ou un carton plein ? Tape les résultats qu'il déclare avoir cochés, séparés par des espaces. Le widget vérifie si les multiplications correspondantes sont bien sorties.</p>
    <p><b>Note</b> — Deux multiplications avec le même résultat (ex. 2×6 et 3×4) ne peuvent pas sortir toutes les deux : le résultat est tiré une seule fois.</p>
  </div>

  <!-- Poignée resize -->
  <div class="lm-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initLotoMultiWidget = function (widget) {

        const container   = widget.querySelector('.lm-container');
        const paramsBtn   = widget.querySelector('.lm-params-btn');
        const paramsPanel = widget.querySelector('.lm-params-panel');
        const timerInput  = widget.querySelector('.lm-timer-input');
        const applyBtn    = widget.querySelector('.lm-params-apply-btn');
        const multDisplay = widget.querySelector('.lm-mult-display');
        const timerWrap   = widget.querySelector('.lm-timer-wrap');
        const timerBar    = widget.querySelector('.lm-timer-bar');
        const timerText   = widget.querySelector('.lm-timer-text');
        const counter     = widget.querySelector('.lm-counter');
        const pausedOverlay = widget.querySelector('.lm-paused-overlay');
        const btnStart    = widget.querySelector('.lm-btn-start');
        const btnPause    = widget.querySelector('.lm-btn-pause');
        const btnNext     = widget.querySelector('.lm-btn-next');
        const btnReset    = widget.querySelector('.lm-btn-reset');
        const btnVerif    = widget.querySelector('.lm-btn-verif');
        const btnHistory  = widget.querySelector('.lm-btn-history');
        const verifZone   = widget.querySelector('.lm-verif-zone');
        const verifNumbers= widget.querySelector('.lm-verif-numbers');
        const btnCheckV   = widget.querySelector('.lm-btn-check-verif');
        const verifResult = widget.querySelector('.lm-verif-result');
        const btnContinue = widget.querySelector('.lm-btn-continue');
        const historyList = widget.querySelector('.lm-history-list');
        const historyZone = widget.querySelector('.lm-history-zone');
        const helpBtn     = widget.querySelector('.lm-help-btn');
        const helpPopup   = widget.querySelector('.lm-help-popup');
        const resizeHandle= widget.querySelector('.lm-resize-handle');

        // ── État ──────────────────────────────────────────────────────────
        let timerDuration = 15;   // secondes
        let isRunning     = false;
        let isPaused      = false;
        let timerInterval = null;
        let timerRemaining= timerDuration;
        let drawnResults  = new Set();  // résultats déjà tirés
        let drawnHistory  = [];         // [{a, b, result}, ...]
        let currentMult   = null;       // {a, b, result} en cours
        let totalPossible = 0;

        // ── Génère toutes les multiplications possibles (résultats uniques) ──
        function buildPool(max) {
            const byResult = new Map();
            for (let a = 0; a <= max; a++) {
                for (let b = a; b <= max; b++) {
                    const r = a * b;
                    if (!byResult.has(r)) {
                        byResult.set(r, { a, b, result: r });
                    }
                }
            }
            return byResult; // Map<result, {a, b, result}>
        }

        let pool = buildPool(9);
        totalPossible = pool.size;

        // ── Utilitaire tap ─────────────────────────────────────────────────
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

        // ── Tire une multiplication non encore sortie ──────────────────────
        function drawNext() {
            const remaining = [];
            pool.forEach((val, key) => {
                if (!drawnResults.has(key)) remaining.push(val);
            });
            if (remaining.length === 0) return null;
            const idx = Math.floor(Math.random() * remaining.length);
            return remaining[idx];
        }

        // ── Affiche la multiplication courante ──────────────────────────────
        function showMult(mult) {
            currentMult = mult;
            validateCurrent(); // enregistre immédiatement dès l'affichage
            // Mélange a et b aléatoirement pour l'affichage
            const [a, b] = Math.random() < 0.5 ? [mult.a, mult.b] : [mult.b, mult.a];
            multDisplay.innerHTML = `<span>${a}</span><span style="color:#fff;margin:0 6px">×</span><span>${b}</span>`;
            multDisplay.style.fontSize = '';
            timerWrap.style.display = 'flex';
            counter.textContent = `${drawnHistory.length} / ${totalPossible} multiplications`;
        }

        // ── Démarre le timer pour la multiplication courante ───────────────
        function startTimer(duration) {
            timerRemaining = duration;
            timerText.textContent = timerRemaining;
            timerBar.style.width = '100%';
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (isPaused) return;
                timerRemaining--;
                timerText.textContent = timerRemaining;
                const pct = (timerRemaining / timerDuration) * 100;
                timerBar.style.width = pct + '%';
                if (timerRemaining <= 0) {
                    clearInterval(timerInterval);
                    validateAndNext();
                }
            }, 1000);
        }

        // ── Enregistre la multiplication courante comme sortie ─────────────
        function validateCurrent() {
            if (!currentMult) return;
            if (drawnResults.has(currentMult.result)) return; // déjà enregistrée
            drawnResults.add(currentMult.result);
            drawnHistory.push(currentMult);
            addHistoryItem(currentMult);
        }

        // ── Valide la multiplication courante et passe à la suivante ───────
        function validateAndNext() {
            if (!currentMult) return;
            validateCurrent(); // enregistre si pas déjà fait
            // Tirer la suivante
            const next = drawNext();
            if (!next) {
                // Plus de multiplications
                multDisplay.innerHTML = '<span style="font-size:22px;color:#15803d">🎉 Toutes les multiplications sont passées !</span>';
                timerWrap.style.display = 'none';
                counter.textContent = `${drawnHistory.length} / ${totalPossible} — Partie terminée !`;
                isRunning = false;
                btnStart.textContent = '▶ Démarrer';
                btnPause.disabled = true;
                btnNext.disabled = true;
                clearInterval(timerInterval);
                return;
            }
            showMult(next);
            startTimer(timerDuration);
        }

        // ── Ajoute un item dans l'historique ──────────────────────────────
        function addHistoryItem(mult) {
            const item = document.createElement('div');
            item.className = 'lm-history-item';
            // Affiche l'opération et le résultat
            item.innerHTML = `${mult.a}×${mult.b} =<span class="lm-result-num">${mult.result}</span>`;
            historyList.insertBefore(item, historyList.firstChild);
        }

        // ── Réinitialise tout ─────────────────────────────────────────────
        function resetGame() {
            clearInterval(timerInterval);
            isRunning = false;
            isPaused  = false;
            drawnResults.clear();
            drawnHistory = [];
            currentMult  = null;
            pool = buildPool(9);
            totalPossible = pool.size;
            historyList.innerHTML = '';
            multDisplay.innerHTML = '<span class="lm-mult-idle">Appuie sur ▶ Démarrer pour commencer</span>';
            timerWrap.style.display = 'none';
            counter.textContent = '';
            pausedOverlay.classList.remove('show');
            btnStart.textContent = '▶ Démarrer';
            btnStart.disabled    = false;
            btnPause.disabled    = true;
            btnNext.disabled     = true;
            btnVerif.disabled    = true;
            btnHistory.disabled  = true;
            btnHistory.classList.remove('active');
            historyZone.classList.remove('show');
            verifZone.classList.remove('show');
            verifResult.classList.remove('show');
            verifResult.innerHTML = '';
            btnContinue.classList.remove('show');
            verifNumbers.value = '';
        }

        // ── Bouton Démarrer ───────────────────────────────────────────────
        makeTap(btnStart, () => {
            if (isRunning) return;
            isRunning = true;
            isPaused  = false;
            pausedOverlay.classList.remove('show');
            btnStart.disabled  = true;
            btnPause.disabled  = false;
            btnNext.disabled   = false;
            btnVerif.disabled  = false;
            btnHistory.disabled = false;
            const next = drawNext();
            if (!next) return;
            showMult(next);
            startTimer(timerDuration);
        });

        // ── Bouton Pause ──────────────────────────────────────────────────
        makeTap(btnPause, () => {
            if (!isRunning) return;
            isPaused = !isPaused;
            if (isPaused) {
                btnPause.textContent = '▶ Reprendre';
                pausedOverlay.classList.add('show');
            } else {
                btnPause.textContent = '⏸ Pause';
                pausedOverlay.classList.remove('show');
            }
        });

        // ── Bouton Suivant ────────────────────────────────────────────────
        makeTap(btnNext, () => {
            if (!isRunning || isPaused) return;
            clearInterval(timerInterval);
            validateAndNext();
        });

        // ── Bouton Réinitialiser ──────────────────────────────────────────
        makeTap(btnReset, () => {
            resetGame();
        });

        // ── Bouton Historique ─────────────────────────────────────────────
        makeTap(btnHistory, () => {
            const open = historyZone.classList.toggle('show');
            btnHistory.classList.toggle('active', open);
        });

        // ── Bouton Vérifier un carton ─────────────────────────────────────
        makeTap(btnVerif, () => {
            if (!isRunning && drawnHistory.length === 0) return;
            // Pause le timer pendant la vérification
            if (!isPaused && isRunning) {
                isPaused = true;
                btnPause.textContent = '▶ Reprendre';
                pausedOverlay.classList.add('show');
            }
            verifZone.classList.toggle('show');
            verifResult.classList.remove('show');
            verifResult.innerHTML = '';
            btnContinue.classList.remove('show');
            verifNumbers.value = '';
        });

        // ── Bouton Vérifier (dans la zone vérification) ───────────────────
        btnCheckV.addEventListener('pointerdown', (e) => e.stopPropagation());
        btnCheckV.addEventListener('click', () => {
            const raw = verifNumbers.value.trim();
            if (!raw) return;
            // Parse les numéros
            const nums = raw.split(/[\s,;]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            if (nums.length === 0) {
                verifResult.innerHTML = '<span style="color:#fc8181">⚠️ Aucun numéro reconnu.</span>';
                verifResult.classList.add('show');
                return;
            }

            // Pour chaque numéro, vérifier s'il a été tiré
            let html = '';
            let hasError = false;

            nums.forEach(n => {
                const matchMult = drawnHistory.find(m => m.result === n);
                if (matchMult) {
                    html += `<div class="lm-verif-ok-item">✅ ${n} → ${matchMult.a} × ${matchMult.b} = ${matchMult.result} ✔ sorti</div>`;
                } else {
                    // Chercher la multiplication correspondante dans le pool (pas encore sortie)
                    const poolEntry = pool.get(n);
                    if (poolEntry) {
                        html += `<div class="lm-verif-err-item">❌ ${n} → ${poolEntry.a} × ${poolEntry.b} = ${poolEntry.result} — PAS encore sorti !</div>`;
                    } else {
                        html += `<div class="lm-verif-err-item">❌ ${n} — ce résultat n'existe pas dans les tables (0 à 9)</div>`;
                    }
                    hasError = true;
                }
            });

            const header = !hasError
                ? '<div style="color:#15803d;font-weight:900;font-size:14px;margin-bottom:6px">🎉 Bravo ! Tous les résultats sont corrects !</div>'
                : '<div style="color:#dc2626;font-weight:900;font-size:14px;margin-bottom:6px">⚠️ Attention !</div>';

            verifResult.innerHTML = header + '<div class="lm-verif-items-grid">' + html + '</div>';
            verifResult.classList.add('show');
            btnContinue.classList.add('show');
        });

        // ── Bouton Continuer ──────────────────────────────────────────────
        makeTap(btnContinue, () => {
            verifZone.classList.remove('show');
            verifResult.classList.remove('show');
            btnContinue.classList.remove('show');
            // Reprendre la pause si elle était active à cause de la vérification
            if (isPaused && isRunning) {
                isPaused = false;
                btnPause.textContent = '⏸ Pause';
                pausedOverlay.classList.remove('show');
            }
        });

        // ── Panneau paramètres ────────────────────────────────────────────
        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());
        timerInput.addEventListener('pointerdown', (e) => e.stopPropagation());
        timerInput.style.pointerEvents = 'auto';
        timerInput.style.userSelect = 'text';

        // Utiliser 'click' (et non makeTap) car paramsPanel stoppe les pointerdown,
        // ce qui empêche makeTap de poser son listener pointerup.
        applyBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
        applyBtn.addEventListener('click', () => {
            const t = parseInt(timerInput.value);
            if (!isNaN(t) && t >= 3) timerDuration = t;
            timerInput.value = timerDuration;
            // Si le jeu est en cours, on repart avec la nouvelle durée
            // sans réinitialiser — on relance juste le timer depuis la nouvelle valeur
            if (isRunning && !isPaused) {
                clearInterval(timerInterval);
                startTimer(timerDuration);
            }
            paramsPanel.classList.remove('show');
            paramsBtn.classList.remove('active');
        });

        // ── Aide ──────────────────────────────────────────────────────────
        makeTap(helpBtn, () => { helpPopup.classList.toggle('show'); });
        document.addEventListener('pointerdown', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show');
        });

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
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                // Transférer les dims du container sur le widget avant réduction
                // pour que _wfMiniBarCollapse puisse les sauvegarder et les restaurer
                widget.style.width  = container.offsetWidth  + 'px';
                widget.style.height = container.offsetHeight + 'px';
                window._wfMiniBarCollapse(widget, '✖️ Loto des Multiplications', {
                    onExpand: () => {
                        // Remettre les dims sur le container et nettoyer le widget
                        container.style.width  = widget.style.width  || '';
                        container.style.height = widget.style.height || '';
                        widget.style.width  = '';
                        widget.style.height = '';
                    }
                });
            });
        }
        if (wfMax) {
            makeTap(wfMax, () => {
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = container.style.width;
                    _savedH = container.style.height;
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
                clearInterval(timerInterval);
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Resize ────────────────────────────────────────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            function onMove(ev) {
                container.style.width  = Math.max(380, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(400, startH + ev.clientY - startY) + 'px';
            }
            function onEnd() {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup', onEnd);
                const curW  = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
                widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            }
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup', onEnd);
        });

        // ── Init ──────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
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
            if (type === 'loto-multi') initLotoMultiWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'loto-multi') initLotoMultiWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
