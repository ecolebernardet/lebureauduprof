// =========================================================================
// WIDGET CALCUL MENTAL — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'calcul'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-calcul.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('calcul');closeMainMenu()">
//          <span class="mm-ico">🧮</span>Calcul Mental
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
    const STYLE = `
    /* ── Wrapper externe ── */
    .widget[data-type="calcul"] .calc-outer {
        position: relative;
        width: 800px;
        height: 520px;
        min-width: 300px;
        min-height: 320px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
        cursor: move;
    }
    .widget[data-type="calcul"] .calc-outer button,
    .widget[data-type="calcul"] .calc-outer input,
    .widget[data-type="calcul"] .calc-outer label {
        cursor: default;
    }
    .widget[data-type="calcul"] .calc-outer button { cursor: pointer; }
    .widget[data-type="calcul"] .calc-outer input  { cursor: text; }

    .widget[data-type="calcul"] .calc-outer::-webkit-resizer { display: none; }
    .widget[data-type="calcul"]:hover .calc-outer,
    .widget[data-type="calcul"]:focus-within .calc-outer {
        outline: 2px dashed rgba(6,182,212,0.4);
    }

    /* ── Polices personnalisées ── */
    @font-face {
        font-family: 'Marelle';
        src: url('polices/marelle-regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    @font-face {
        font-family: 'Nunito';
        src: url('polices/nunito-regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }

    /* ── Widget intérieur — layout natif sans scale ── */
    .calc-widget {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
        box-sizing: border-box;
        background: #ffffff;
        border-radius: 16px;
        overflow: hidden;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    /* ── Header ── */
    .calc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 7px 10px 7px 14px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        flex-shrink: 0;
        cursor: move;
    }
    .calc-title {
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #06b6d4;
        pointer-events: none;
        user-select: none;
    }

    /* ── Boutons fenêtre (communs aux 3 widgets) ── */
    .wf-btns {
        display: flex;
        gap: 5px;
        align-items: center;
        flex-shrink: 0;
    }
    .wf-btn {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0;
        transition: filter 0.15s, transform 0.1s;
        flex-shrink: 0;
        position: relative;
    }
    .wf-btn:hover { filter: brightness(0.82); transform: scale(1.15); }
    .wf-btn:active { transform: scale(0.92); }
    .wf-btn-min   { background: #febc2e; }
    .wf-btn-max   { background: #28c840; }
    .wf-btn-close { background: #ff5f57; }
    /* Icônes visibles au survol du groupe */
    .wf-btns:hover .wf-btn::after {
        font-size: 8px;
        font-weight: 900;
        color: rgba(0,0,0,0.5);
        line-height: 1;
    }
    .wf-btns:hover .wf-btn-min::after   { content: '−'; }
    .wf-btns:hover .wf-btn-max::after   { content: '⤢'; font-size: 7px; }
    .wf-btns:hover .wf-btn-close::after { content: '×'; font-size: 10px; }

    /* ── État réduit ── */
    .calc-outer.wf-minimized .calc-widget {
        overflow: hidden;
    }
    .calc-outer.wf-minimized .calc-body {
        display: none;
    }

    /* ── État plein écran board ── */
    .calc-outer.wf-fullboard {
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
        transform: none !important;
        padding-left: 40px !important;
    }
    .calc-outer.wf-fullboard .calc-widget {
        border-radius: 0;
    }
    /* ── Corps ── */
    .calc-body {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 0;
    }
    .calc-body::-webkit-scrollbar { width: 4px; }
    .calc-body::-webkit-scrollbar-track { background: transparent; }
    .calc-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

    /* ── Section label ── */
    .calc-section-label {
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.12em;
        color: #333333;
        margin-bottom: 5px;
        text-align: center;
    }

	.calc-section-nbre {
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.12em;
        color: #555555;
        margin-bottom: 0px;
        text-align: center;
		padding: 5px 20px
    }
	
    /* ── Sélecteurs opérations — largeur fixe ── */
    .calc-ops-grid {
        display: flex;
        gap: 5px;
        justify-content: center;
    }
    .calc-op-label { cursor: pointer; }
    .calc-op-label input[type="checkbox"] { display: none; }
    .calc-op-frame {
        border: 2px solid #999999;
        border-radius: 20px;
        background: #f8fafc;
        width: 80px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        font-weight: 900;
        color: #555555;
        transition: all 0.18s;
        user-select: none;
    }
    .calc-op-label input:checked + .calc-op-frame {
        border-color: #06b6d4;
        background: #06b6d4;
        color: #4;
        box-shadow: 0 2px 8px rgba(6,182,212,0.3);
    }

    /* ── Tables ── */
    .calc-tables-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        justify-content: center;
    }
    .calc-table-label { cursor: pointer; }
    .calc-table-label input[type="checkbox"] { display: none; }
    .calc-table-frame {
        width: 40px;
        height: 40px;
        border: 1px solid #999999;
        border-radius: 20px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        font-weight: 900;
        color: #555555;
        transition: all 0.18s;
        user-select: none;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-table-all-frame {
        padding: 0 8px;
        width: auto;
        font-size: 8px;
        text-transform: uppercase;
		font-family: 'Nunito', sans-serif;
        letter-spacing: 0.05em;
    }
    .calc-table-label input:checked + .calc-table-frame {
        border-color: #06b6d4;
        background: #06b6d4;
        color: #fff;
    }

    /* ── Inputs paramètres — largeur fixe, centrés ── */
    .calc-params-wrap {
        display: flex;
        gap: 8px;
        justify-content: center;
    }
    .calc-field-group { display: flex; flex-direction: column; gap: 3px; align-items: center; }
    .calc-field-input {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 7px;
        padding: 7px;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        outline: none;
        text-align: center;
        width: 90px;
        box-sizing: border-box;
        transition: border-color 0.15s;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-field-input:focus { border-color: #06b6d4; }

    /* ── Timer row config — largeur fixe, centré ── */
    .calc-timer-wrap {
        display: flex;
        justify-content: center;
    }
    .calc-timer-sep { color: #94a3b8; font-weight: 900; font-size: 22px; margin: 0 4px; line-height: 1; }
    /* Spinner maison min/sec */
    .calc-spinner {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }
    .calc-spinner-label {
        font-size: 9px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .calc-spinner-inner {
        display: flex;
        align-items: center;
        gap: 0;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
    }
    .calc-spinner-btn {
        width: 32px;
        height: 44px;
        border: none;
        background: transparent;
        font-size: 20px;
        font-weight: 700;
        color: #06b6d4;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.12s;
        flex-shrink: 0;
        user-select: none;
    }
    .calc-spinner-btn:hover  { background: #e0f7fa; }
    .calc-spinner-btn:active { background: #b2ebf2; }
    .calc-spinner-val {
        width: 44px;
        height: 44px;
        text-align: center;
        border: none;
        border-left: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        background: #fff;
        font-size: 22px;
        font-weight: 800;
        color: #1e293b;
        outline: none;
        padding: 0;
        -moz-appearance: textfield;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-spinner-val::-webkit-inner-spin-button,
    .calc-spinner-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

    /* ── Bouton démarrer ── */
    .calc-start-btn {
        display: block;
        margin: 30px auto 0;
        padding: 20px 28px;
        border-radius: 50px;
        font-weight: 900;
        font-size: 11px;
        text-transform: uppercase;
        border: none;
        cursor: pointer;
        background: #06b6d4;
        color: #fff;
        letter-spacing: 0.06em;
        transition: transform 0.1s, box-shadow 0.15s;
        box-shadow: 0 3px 12px rgba(6,182,212,0.3);
    }
    .calc-start-btn:hover  { box-shadow: 0 5px 18px rgba(6,182,212,0.45); }
    .calc-start-btn:active { transform: scale(0.97); }

    /* ══ ZONE DE JEU ══ */
    .calc-game-zone { display: none; flex-direction: column; gap: 8px; height: 100%; }
    .calc-game-zone.active { display: flex; }

    /* ── Timer affiché ── */
    .calc-timer-display {
        display: none;
        text-align: center;
        padding: 6px 10px;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 9px;
        flex-shrink: 0;
    }
    .calc-timer-display.visible { display: block; }
    .calc-timer-value {
        font-size: 20px;
        font-weight: 900;
        color: #d97706;
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-timer-value.urgent { color: #dc2626; animation: calc-blink 0.6s infinite alternate; }
    @keyframes calc-blink { from { opacity:1; } to { opacity:0.3; } }

    /* ── Grille de questions ── */
    .calc-questions-grid {
        display: grid;
        gap: 20px;
        flex: 1;
        align-content: start;
        grid-template-columns: repeat(2, 1fr); /* valeur par défaut, overridée par JS */
    }
    .calc-q-card {
        background: #e6e8eb;
        border: 1.5px solid #abaeb3;
        border-radius: 10px;
        padding: 10px 10px 10px 22px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 80px;
        position: relative;
        transition: border-color 0.2s, background 0.2s;
    }
    .calc-q-num {
        position: absolute;
        top: 4px;
        left: 7px;
        font-size: 15px;
        font-weight: 900;
        color: #06b6d4;
    }
    .calc-q-text {
        font-size: 28px;
        font-weight: 900;
        color: #1e293b;
        white-space: nowrap;
        letter-spacing: -0.02em;
        line-height: 1.1;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-res-text {
        display: none;
        color: #047954;
        font-weight: 900;
        font-size: 28px;
        white-space: nowrap;
        line-height: 1.1;
        font-family: 'Marelle', 'Nunito', sans-serif;
    }
    .calc-res-text.visible { display: inline; }

    /* ── Boutons action jeu ── */
    .calc-action-btns {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 5px;
        flex-shrink: 0;
        max-width: 2000px;
    }
    .calc-action-btn {
        padding: 9px 6px;
        border: none;
        border-radius: 50px;
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        cursor: pointer;
        color: #fff;
        letter-spacing: 0.04em;
        transition: opacity 0.15s, transform 0.1s;
    }
    .calc-action-btn:hover  { opacity: 0.85; }
    .calc-action-btn:active { transform: scale(0.96); }
    .calc-btn-back    { background: #6b7280; }
    .calc-btn-correct { background: #10b981; }
    .calc-btn-new     { background: #f59e0b; }

    /* ── Poignée resize ── */
    .calc-resize-handle {
        position: absolute;
        right: 0; bottom: 0;
        width: 18px; height: 18px;
        cursor: se-resize;
        background: linear-gradient(135deg, transparent 50%, #aaa 50%);
        border-radius: 0 0 16px 0;
        opacity: 0;
        transition: opacity .2s;
        z-index: 5;
    }
    .calc-outer:hover .calc-resize-handle { opacity: 1; }

    /* ── Modale fin de temps ── */
    .calc-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 50;
        background: rgba(255,255,255,0.82);
        backdrop-filter: blur(4px);
        border-radius: 16px;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    .calc-modal-overlay.visible { display: flex; }
    .calc-modal-content {
        background: #fff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        width: 100%;
        max-width: 260px;
    }
    .calc-modal-icon  { font-size: 38px; margin-bottom: 8px; }
    .calc-modal-title { font-size: 15px; font-weight: 900; text-transform: uppercase; color: #1e293b; margin-bottom: 5px; }
    .calc-modal-sub   { font-size: 11px; color: #64748b; margin-bottom: 14px; }
    .calc-modal-btn {
        width: 100%;
        padding: 11px;
        border-radius: 50px;
        background: #06b6d4;
        color: #fff;
        border: none;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        cursor: pointer;
        transition: opacity 0.15s;
    }
    .calc-modal-btn:hover { opacity: 0.85; }
    `;

    if (!document.getElementById('calc-widget-style')) {
        const s = document.createElement('style');
        s.id = 'calc-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Template ─────────────────────────────────────────────────────────
    if (!document.getElementById('template-calcul')) {
        const tpl = document.createElement('template');
        tpl.id = 'template-calcul';
        tpl.innerHTML = `
<div class="calc-outer editor-container">
  <div class="calc-widget">

    <!-- HEADER -->
    <div class="calc-header">
      <span class="calc-title">🧮 Calcul Mental</span>
      <div class="wf-btns">
        <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
        <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
        <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
      </div>
    </div>

    <div class="calc-body">

      <!-- ── ZONE CONFIG ── -->
      <div class="calc-setup-zone" data-role="setup-zone">

        <!-- Opérations -->
        <div>
          <div class="calc-section-label" style="marging-top:15px">Opérations</div>
          <div class="calc-ops-grid">
            <label class="calc-op-label">
              <input type="checkbox" class="calc-op-cb" value="+" checked>
              <div class="calc-op-frame">➕</div>
            </label>
            <label class="calc-op-label">
              <input type="checkbox" class="calc-op-cb" value="-">
              <div class="calc-op-frame">➖</div>
            </label>
            <label class="calc-op-label">
              <input type="checkbox" class="calc-op-cb" value="x">
              <div class="calc-op-frame">✖️</div>
            </label>
            <label class="calc-op-label">
              <input type="checkbox" class="calc-op-cb" value=":">
              <div class="calc-op-frame">➗</div>
            </label>
          </div>
        </div>

        <!-- Tables -->
        <div>
          <div class="calc-section-label" style="margin-top:15px">Tables (× et ÷)</div>
          <div class="calc-tables-wrap" data-role="tables-wrap"></div>
        </div>

        <!-- Timer -->
        <div style="text-align: center;">
          <div class="calc-section-label" style="margin-top:25px">⏱ Temps imparti &nbsp;<span style="font-weight:400;text-transform:none;letter-spacing:0;">(0:00 = sans limite)</span></div>
          <div class="calc-timer-wrap" style="gap:8px;display:flex;align-items:center;justify-content:center;">
            <div class="calc-spinner">
              <div class="calc-spinner-label">min</div>
              <div class="calc-spinner-inner">
                <button class="calc-spinner-btn" data-role="timer-min-minus">−</button>
                <input type="number" class="calc-spinner-val" data-role="timer-min" value="0" min="0" max="59">
                <button class="calc-spinner-btn" data-role="timer-min-plus">+</button>
              </div>
            </div>
            <span class="calc-timer-sep" style="margin-top:15px;">:</span>
            <div class="calc-spinner">
              <div class="calc-spinner-label">sec</div>
              <div class="calc-spinner-inner">
                <button class="calc-spinner-btn" data-role="timer-sec-minus">−</button>
                <input type="number" class="calc-spinner-val" data-role="timer-sec" value="0" min="0" max="59">
                <button class="calc-spinner-btn" data-role="timer-sec-plus">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Paramètres -->
        <div>
          <div class="calc-params-wrap">
            <div class="calc-field-group">
              <div class="calc-section-nbre" style="margin-top:15px; margin-bottom:2px">Nbre min<br> dans les calculs</div>
              <input type="number" class="calc-field-input" data-role="min-val" value="1" min="0" max="999">
            </div>
            <div class="calc-field-group">
              <div class="calc-section-nbre" style="margin-top:15px; margin-bottom:2px">Nbre max<br> dans les calculs</div>
              <input type="number" class="calc-field-input" data-role="max-val" value="50" min="1" max="999">
            </div>
            <div class="calc-field-group">
              <div class="calc-section-nbre" style="margin-top:15px; margin-bottom:2px">Nbre de calculs<br> au total (max 50)</div>
              <input type="number" class="calc-field-input" data-role="nb-val" value="10" min="1" max="50">
            </div>
          </div>
        </div>

        <!-- Bouton démarrer -->
        <button class="calc-start-btn" data-role="start-btn">▶ Démarrer</button>
      </div>

      <!-- ── ZONE JEU ── -->
      <div class="calc-game-zone" data-role="game-zone">

        <!-- Timer affiché -->
        <div class="calc-timer-display" data-role="timer-display">
          <div class="calc-timer-value" data-role="timer-value">0:00</div>
        </div>

        <!-- Grille de questions -->
        <div class="calc-questions-grid" data-role="questions-grid"></div>

        <!-- Boutons action -->
        <div class="calc-action-btns">
            <button class="calc-action-btn calc-btn-back"    data-role="back-btn"><span style="font-size: 13px">⚙️</span> Réglages</button>
            <button class="calc-action-btn calc-btn-correct" data-role="correct-btn">Correction</button>
            <button class="calc-action-btn calc-btn-new"     data-role="new-btn"><span style="font-size: 13px">🔄</span> Nouveau</button>
        </div>
      </div>

    </div><!-- /calc-body -->

    <!-- Modale fin de temps -->
    <div class="calc-modal-overlay" data-role="modal-fin">
      <div class="calc-modal-content">
        <div class="calc-modal-icon">⏰</div>
        <div class="calc-modal-title">Temps écoulé !</div>
        <div class="calc-modal-sub">Le chrono est terminé. Prêt à voir les résultats ?</div>
        <button class="calc-modal-btn" data-role="modal-validate-btn">Afficher la correction</button>
      </div>
    </div>

  </div><!-- /calc-widget -->
  <div class="calc-resize-handle"></div>
</div><!-- /calc-outer -->`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // INITIALISATION
    // =========================================================================
    window.initCalculWidget = function (widget) {

        // ── Le widget s'ouvre à 100px du bord gauche du board ──────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW = window.innerWidth;
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;
        }));

        const outer     = widget.querySelector('.calc-outer');
        const questGrid = widget.querySelector('[data-role="questions-grid"]');

        // ── Mousedown / Pointerdown : laisser remonter pour le drag, bloquer sur contrôles ──
        function _handleInteractiveDown(e) {
            // Bloquer uniquement sur les éléments interactifs (sinon le drag remonte)
            const tag = e.target.tagName;
            if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'LABEL') {
                e.stopPropagation();
            }
            // Mettre au premier plan et donner le focus
            if (typeof bringToFront === 'function') bringToFront(widget);
            widget.focus();
            if (typeof positionActionBar === 'function') positionActionBar(widget);
        }
        outer.addEventListener('mousedown',   _handleInteractiveDown);
        outer.addEventListener('pointerdown', _handleInteractiveDown);

        // ── Constantes ───────────────────────────────────────────────────────
        const MAX_CALCULS       = 50;
        const MAX_ATTEMPTS_MULT = 100;
        const TABLES_DEFAULT    = [1,2,3,4,5,6,7,8,9,10];

        // ── Références DOM ───────────────────────────────────────────────────
        const setupZone    = widget.querySelector('[data-role="setup-zone"]');
        const gameZone     = widget.querySelector('[data-role="game-zone"]');
        const tablesWrap   = widget.querySelector('[data-role="tables-wrap"]');
        const timerMin     = widget.querySelector('[data-role="timer-min"]');
        const timerSec     = widget.querySelector('[data-role="timer-sec"]');
        const minVal       = widget.querySelector('[data-role="min-val"]');
        const maxVal       = widget.querySelector('[data-role="max-val"]');
        const nbVal        = widget.querySelector('[data-role="nb-val"]');
        const startBtn     = widget.querySelector('[data-role="start-btn"]');
        const timerDisplay = widget.querySelector('[data-role="timer-display"]');
        const timerValue   = widget.querySelector('[data-role="timer-value"]');
        const backBtn      = widget.querySelector('[data-role="back-btn"]');
        const correctBtn   = widget.querySelector('[data-role="correct-btn"]');
        const newBtn       = widget.querySelector('[data-role="new-btn"]');
        const modalFin     = widget.querySelector('[data-role="modal-fin"]');
        const modalValBtn  = widget.querySelector('[data-role="modal-validate-btn"]');

        // ── Spinners timer +/− ───────────────────────────────────────────────
        function _bindSpinner(inputEl, minusRole, plusRole, min, max) {
            const minusBtn = widget.querySelector(`[data-role="${minusRole}"]`);
            const plusBtn  = widget.querySelector(`[data-role="${plusRole}"]`);
            if (!minusBtn || !plusBtn || !inputEl) return;
            let _holdInterval = null;
            let _holdTimeout  = null;
            let _active       = false;

            function _step(delta) {
                const v = parseInt(inputEl.value) || 0;
                inputEl.value = Math.min(max, Math.max(min, v + delta));
            }
            function _startHold(delta) {
                if (_active) return;   // évite double-déclenchement souris synthétique
                _active = true;
                _step(delta);
                _holdTimeout = setTimeout(() => {
                    _holdInterval = setInterval(() => _step(delta), 80);
                }, 400);
            }
            function _stopHold() {
                _active = false;
                clearTimeout(_holdTimeout);
                clearInterval(_holdInterval);
                _holdTimeout = null;
                _holdInterval = null;
            }

            [minusBtn, plusBtn].forEach((btn, i) => {
                const delta = i === 0 ? -1 : +1;
                btn.addEventListener('pointerdown', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    btn.setPointerCapture(e.pointerId);
                    _startHold(delta);
                });
                btn.addEventListener('pointerup',     e => { btn.releasePointerCapture(e.pointerId); _stopHold(); });
                btn.addEventListener('pointercancel', e => { btn.releasePointerCapture(e.pointerId); _stopHold(); });
                btn.addEventListener('lostpointercapture', _stopHold);
            });
        }
        _bindSpinner(timerMin, 'timer-min-minus', 'timer-min-plus', 0, 59);
        _bindSpinner(timerSec, 'timer-sec-minus', 'timer-sec-plus', 0, 59);

        // ── État ─────────────────────────────────────────────────────────────
        let currentCalculs  = [];
        let countdown       = null;
        let correctionShown = false;

        // ── Grille responsive : colonnes selon la largeur réelle du widget ────
        function getColCount() {
            const w = outer.offsetWidth || 420;
            if (w >= 680) return 4;
            if (w >= 490) return 3;
            return 2;
        }

        function getFontSize(cols) {
            if (cols >= 4) return '28px';
            if (cols === 3) return '30px';
            return '32px';
        }

        function updateGridLayout() {
            const cols = getColCount();
            const fs   = getFontSize(cols);
            questGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            widget.querySelectorAll('.calc-q-text, .calc-res-text').forEach(el => {
                el.style.fontSize = fs;
            });
        }

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                updateGridLayout();
                // Sauvegarder la taille dans dataset pour la restauration
                if (outer.offsetWidth > 0)  widget.dataset.calcW = outer.offsetWidth;
                if (outer.offsetHeight > 0) widget.dataset.calcH = outer.offsetHeight;
            });
            ro.observe(outer);
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }

        // ── Initialisation tables ─────────────────────────────────────────────
        (function initTables() {
            let html = '';
            for (let i = 2; i <= 10; i++) {
                html += `<label class="calc-table-label">
                    <input type="checkbox" class="calc-table-cb" value="${i}">
                    <div class="calc-table-frame">${i}</div>
                </label>`;
            }
            html += `<label class="calc-table-label">
                <input type="checkbox" class="calc-all-tables-cb">
                <div class="calc-table-frame calc-table-all-frame">Toutes</div>
            </label>`;
            tablesWrap.innerHTML = html;

            // Toggle "Toutes" via pointerdown (stylet + souris)
            const allCb = tablesWrap.querySelector('.calc-all-tables-cb');
            allCb.addEventListener('change', function () {
                tablesWrap.querySelectorAll('.calc-table-cb').forEach(cb => cb.checked = this.checked);
            });
            // Pointerdown sur "Toutes"
            const allLbl = allCb.closest('label') || allCb.parentElement;
            allLbl.addEventListener('pointerdown', e => {
                e.stopPropagation();
                e.preventDefault();
                allCb.checked = !allCb.checked;
                allCb.dispatchEvent(new Event('change', { bubbles: true }));
            });
            allLbl.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
            // Pointerdown sur chaque table individuelle
            tablesWrap.querySelectorAll('.calc-table-cb').forEach(cb => {
                const lbl = cb.closest('label') || cb.parentElement;
                lbl.addEventListener('pointerdown', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    cb.checked = !cb.checked;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                    // Synchroniser "Toutes"
                    const allChecked = Array.from(tablesWrap.querySelectorAll('.calc-table-cb')).every(c => c.checked);
                    allCb.checked = allChecked;
                });
                lbl.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
            });
        })();

        // ── Toggle opérations via pointerdown (stylet + souris) ──────────────
        widget.querySelectorAll('.calc-op-label').forEach(lbl => {
            lbl.addEventListener('pointerdown', e => {
                e.stopPropagation();
                e.preventDefault();
                const cb = lbl.querySelector('input[type="checkbox"]');
                if (!cb) return;
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            });
            lbl.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
        });

        // ── Sons ─────────────────────────────────────────────────────────────
        function playBeep() {
            try {
                var ctx = new (window.AudioContext || window.webkitAudioContext)();
                [[880,0,0.18],[880,0.22,0.18],[1318,0.44,0.4]].forEach(function (p) {
                    var osc = ctx.createOscillator(), gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.frequency.value = p[0]; osc.type = 'sine';
                    gain.gain.setValueAtTime(0.5, ctx.currentTime + p[1]);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + p[1] + p[2]);
                    osc.start(ctx.currentTime + p[1]);
                    osc.stop(ctx.currentTime + p[1] + p[2] + 0.05);
                });
            } catch (e) {}
        }

        // ── Timer ─────────────────────────────────────────────────────────────
        function startTimer() {
            clearInterval(countdown);
            countdown = null;
            const mins = parseInt(timerMin.value) || 0;
            const secs = parseInt(timerSec.value) || 0;
            let timeLeft = mins * 60 + secs;
            if (timeLeft <= 0) { timerDisplay.classList.remove('visible'); return; }
            timerDisplay.classList.add('visible');
            function updateDisplay() {
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                timerValue.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
                timerValue.classList.toggle('urgent', timeLeft <= 10);
                if (timeLeft <= 0) {
                    clearInterval(countdown); countdown = null;
                    playBeep();
                    modalFin.classList.add('visible');
                }
                timeLeft--;
            }
            updateDisplay();
            countdown = setInterval(updateDisplay, 1000);
        }

        function stopTimer() {
            clearInterval(countdown);
            countdown = null;
        }

        // ── Génération d'un calcul ────────────────────────────────────────────
        function generateCalcul(op, selectedTables, min, max) {
            let a, b, res, q;
            if (op === 'x' || op === ':') {
                const tables = selectedTables.length > 0 ? selectedTables : TABLES_DEFAULT;
                b = tables[Math.floor(Math.random() * tables.length)];
                const f = Math.floor(Math.random() * 10) + 1;
                if (op === 'x') { a = f; res = a * b; q = `${a} × ${b}`; }
                else { a = f * b; res = f; q = `${a} ÷ ${b}`; }
            } else {
                a = Math.floor(Math.random() * (max - min + 1)) + min;
                b = Math.floor(Math.random() * (max - min + 1)) + min;
                if (op === '+') { res = a + b; q = `${a} + ${b}`; }
                else { if (a < b) [a, b] = [b, a]; res = a - b; q = `${a} − ${b}`; }
            }
            return { q, r: res };
        }

        // ── Génération de la série ────────────────────────────────────────────
        function generateSeries() {
            const selectedOps    = Array.from(widget.querySelectorAll('.calc-op-cb:checked')).map(el => el.value);
            const selectedTables = Array.from(widget.querySelectorAll('.calc-table-cb:checked')).map(el => parseInt(el.value));
            const min            = parseInt(minVal.value) || 1;
            const max            = parseInt(maxVal.value) || 50;
            const nb             = Math.min(parseInt(nbVal.value) || 10, MAX_CALCULS);

            if (selectedOps.length === 0) return;

            currentCalculs  = [];
            correctionShown = false;
            let attempts = 0;
            while (currentCalculs.length < nb && attempts < nb * MAX_ATTEMPTS_MULT) {
                attempts++;
                const op = selectedOps[Math.floor(Math.random() * selectedOps.length)];
                const calcul = generateCalcul(op, selectedTables, min, max);
                if (!currentCalculs.some(c => c.q === calcul.q)) currentCalculs.push(calcul);
            }

            renderQuestions();
            correctBtn.textContent = '👁 Afficher la Correction';
            setupZone.style.display = 'none';
            gameZone.classList.add('active');
            startTimer();
        }

        // ── Rendu des questions (mode VPI) ────────────────────────────────────
        function renderQuestions() {
            questGrid.innerHTML = '';
            const cols = getColCount();
            const fs   = getFontSize(cols);
            questGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

            currentCalculs.forEach(function (calc, i) {
                const card = document.createElement('div');
                card.className = 'calc-q-card';
                card.innerHTML = `
                    <span class="calc-q-num">${i + 1})</span>
                    <span class="calc-q-text" style="font-size:${fs}">${calc.q} =</span>
                    <span class="calc-res-text" style="font-size:${fs}">${calc.r}</span>
                `;
                questGrid.appendChild(card);
            });
        }

        // ── Correction ────────────────────────────────────────────────────────
        function showCorrection() {
            if (correctionShown) {
                widget.querySelectorAll('.calc-res-text').forEach(el => el.classList.remove('visible'));
                correctionShown = false;
                correctBtn.textContent = 'Afficher la correction';
            } else {
                stopTimer();
                widget.querySelectorAll('.calc-res-text').forEach(el => el.classList.add('visible'));
                correctionShown = true;
                correctBtn.textContent = 'Masquer la correction';
            }
        }

        // ── Retour config ─────────────────────────────────────────────────────
        function retourConfig() {
            stopTimer();
            timerDisplay.classList.remove('visible');
            modalFin.classList.remove('visible');
            correctionShown = false;
            gameZone.classList.remove('active');
            setupZone.style.display = '';
        }

        // ── Événements ───────────────────────────────────────────────────────
        startBtn.addEventListener('click',    generateSeries);
        backBtn.addEventListener('click',     retourConfig);
        correctBtn.addEventListener('click',  showCorrection);
        newBtn.addEventListener('click',      generateSeries);
        modalValBtn.addEventListener('click', function () {
            modalFin.classList.remove('visible');
            showCorrection();
        });

        // ── Boutons fenêtre ───────────────────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');

        // Sauvegardes pour restauration
        let _savedW = null, _savedH = null;
        let _isMin = false, _isMax = false;

        if (wfMin) {
            wfMin.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMax) wfMax.click();
                window._wfMiniBarCollapse(widget, '🧮 Calcul Mental', {
                    onExpand: updateGridLayout
                });
            });
        }

        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                if (_isMin) { // sortir du mode réduit
                    _isMin = false;
                    outer.classList.remove('wf-minimized');
                }
                _isMax = !_isMax;
                if (_isMax) {
                    _savedW = outer.style.width  || outer.offsetWidth  + 'px';
                    _savedH = outer.style.height || outer.offsetHeight + 'px';
                    outer.classList.add('wf-fullboard');
                } else {
                    outer.classList.remove('wf-fullboard');
                    outer.style.width  = _savedW || '800px';
                    outer.style.height = _savedH || '520px';
                }
                updateGridLayout();
            });
        }

        if (wfClose) {
            wfClose.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof snapshotNow === 'function') snapshotNow();
                widget.remove();
                if (typeof saveBoard === 'function') saveBoard();
            });
        }

        // ── Poignée resize ───────────────────────────────────────────────────
        const resizeHandle = widget.querySelector('.calc-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                e.preventDefault(); e.stopPropagation();
                const startX = e.clientX, startY = e.clientY;
                const startW = outer.offsetWidth, startH = outer.offsetHeight;
                document.onmousemove = (ev) => {
                    outer.style.width  = Math.max(300, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(320, startH + ev.clientY - startY) + 'px';
                    updateGridLayout();
                };
                document.onmouseup = () => { document.onmousemove = null; };
            });
            resizeHandle.addEventListener('touchstart', (e) => {
                e.preventDefault(); e.stopPropagation();
                const t0 = e.touches[0];
                const startX = t0.clientX, startY = t0.clientY;
                const startW = outer.offsetWidth, startH = outer.offsetHeight;
                function onMove(ev) {
                    const t = ev.touches[0];
                    outer.style.width  = Math.max(300, startW + t.clientX - startX) + 'px';
                    outer.style.height = Math.max(320, startH + t.clientY - startY) + 'px';
                    updateGridLayout();
                }
                function onEnd() {
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onEnd);
                }
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            }, { passive: false });
        }

        // Nettoyage si le widget est retiré du DOM
        const obs = new MutationObserver(function () {
            if (!document.contains(widget)) { stopTimer(); obs.disconnect(); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    };

    // =========================================================================
    // HOOK dans restoreBoardFromJSON — restaurer la taille de calc-outer
    // =========================================================================
    (function patchRestoreCalcSize() {
        const _origRestore = window.restoreBoardFromJSON;
        if (typeof _origRestore !== 'function') {
            // Pas encore chargé — on patche après DOMContentLoaded
            document.addEventListener('DOMContentLoaded', patchRestoreCalcSize);
            return;
        }
        window.restoreBoardFromJSON = function(json) {
            // Pré-parser pour récupérer calcW/calcH avant la restauration
            let calcSizes = {};
            try {
                const parsed = JSON.parse(json);
                const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                widgets.forEach(w => {
                    if (w.type === 'calcul' && (w.calcW || w.calcH)) {
                        // Clé par position pour retrouver le bon widget après restauration
                        const key = (w.leftPercent||0).toFixed(1) + '_' + (w.topPercent||0).toFixed(1);
                        calcSizes[key] = { w: w.calcW, h: w.calcH };
                    }
                });
            } catch(e) {}

            _origRestore.apply(this, arguments);

            // Après restauration, appliquer les tailles sur .calc-outer
            setTimeout(() => {
                document.querySelectorAll('.widget[data-type="calcul"]').forEach(widget => {
                    const outer = widget.querySelector('.calc-outer');
                    if (!outer) return;
                    // Priorité 1 : valeurs depuis le JSON (calcW/calcH)
                    const key = (parseFloat(widget.dataset.leftPercent)||0).toFixed(1) + '_' + (parseFloat(widget.dataset.topPercent)||0).toFixed(1);
                    const fromJson = calcSizes[key];
                    const w = fromJson?.w || parseFloat(widget.dataset.calcW);
                    const h = fromJson?.h || parseFloat(widget.dataset.calcH);
                    if (w > 0) outer.style.width  = w + 'px';
                    if (h > 0) outer.style.height = h + 'px';
                });
            }, 150);
        };
    })();

    // =========================================================================
    // HOOK dans buildBoardState — inclure calcW/calcH dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        const _origBuild = window.buildBoardState;
        if (typeof _origBuild !== 'function') return;
        window.buildBoardState = function() {
            const state = _origBuild.apply(this, arguments);
            // Enrichir les widgets calcul avec leurs dimensions réelles
            document.querySelectorAll('.widget[data-type="calcul"]').forEach((widget, i) => {
                const outer = widget.querySelector('.calc-outer');
                if (!outer) return;
                const match = state.widgets.find((w, j) => w.type === 'calcul' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 0.1);
                if (match) {
                    match.calcW = outer.offsetWidth;
                    match.calcH = outer.offsetHeight;
                    // Mettre à jour aussi le dataset pour la prochaine lecture
                    widget.dataset.calcW = outer.offsetWidth;
                    widget.dataset.calcH = outer.offsetHeight;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function (type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'calcul') initCalculWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'calcul') initCalculWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
