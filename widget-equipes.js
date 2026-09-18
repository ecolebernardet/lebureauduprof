// =========================================================================
// WIDGET ÉQUIPES ÉQUILIBRÉES — Le Bureau du Prof
// Inspiré de outils_equipes.html (OutilsProfs)
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-equipes.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createEquipesWidget();closeMainMenu()">
//          <span class="mm-ico">👥</span>Équipes équilibrées
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="equipes"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="equipes"] .equipes-outer {
        position: relative;
        width: 620px;
        height: 720px;
        min-width: 300px;
        min-height: 220px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="equipes"] .equipes-outer::-webkit-resizer { display: none; }

    /* ── Container intérieur plein ── */
    .equipes-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1.5px solid #d1d5db;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 18px rgba(0,0,0,0.12);
        font-family: 'Segoe UI', system-ui, sans-serif;
        color: #374151;
        user-select: none;
        box-sizing: border-box;
        position: relative;
    }

    /* ── Header ── */
    .equipes-header {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
        cursor: move;
    }
    .equipes-header-title {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3px;
        flex-grow: 1;
        color: #374151;
        pointer-events: none;
    }

    /* ── Import zone ── */
    .equipes-import-zone {
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
    }
    .equipes-import-btn {
        padding: 7px 16px;
        border-radius: 8px;
        border: none;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background .15s, transform .1s;
        font-family: inherit;
        background: #4a90e2;
        color: #fff;
    }
    .equipes-import-btn:hover { background: #357abd; }
    .equipes-import-btn:active { transform: scale(0.96); }
    .equipes-status {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-align: center;
    }
    .equipes-status.ok  { color: #059669; }
    .equipes-status.err { color: #dc2626; }

    /* ── Onglets niveau ── */
    .equipes-level-tabs {
        display: none;
        flex-wrap: wrap;
        gap: 4px;
        padding: 6px 10px;
        align-items: center;
        flex-shrink: 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .equipes-level-tab {
        padding: 3px 9px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid #ddd;
        transition: all .15s;
        font-family: inherit;
        background: #f5f5f5;
        color: #666;
    }

    /* ── Grille élèves (présence) ── */
    .equipes-body {
        padding: 8px 12px 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
        min-height: 0;
        max-height: 42%;
        flex-shrink: 1;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
        --pill-fs: 8px;
        --pill-pad: 2px;
        --pill-gap: 2px;
    }
    .equipes-level-label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 8px;
        margin-bottom: 4px;
        text-align: center;
        color: #6b7280;
    }
    .equipes-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--pill-gap, 4px);
    }
    .equipes-pill {
		padding : 2px;
        border-radius: 6px;
        font-size: var(--pill-fs, 8px);
        font-weight: 700;
        text-align: center;
        cursor: pointer;
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
        transition: all .15s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-tap-highlight-color: transparent;
        color: #374151;
    }
    .equipes-pill:hover { border-color: #9ca3af; background: #f0f2f5; }
    .equipes-pill.girl { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
    .equipes-pill.girl:hover { background: #dcfce7; }
    .equipes-pill.boy  { color: #ea580c; border-color: #fed7aa; background: #fff7ed; }
    .equipes-pill.boy:hover  { background: #ffedd5; }
    .equipes-pill.absent {
        background: #f9fafb !important;
        color: #d1d5db !important;
        text-decoration: line-through;
        border-color: #e5e7eb !important;
        opacity: 0.6;
        transform: scale(0.94);
    }

    /* ── Panneau de configuration ── */
    .equipes-config {
        padding: 8px 12px;
        flex-shrink: 0;
        border-top: 1px solid #e5e7eb;
        display: none;
    }
    .equipes-config-label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #9ca3af;
        text-align: center;
        margin-bottom: 6px;
    }
    .equipes-selector {
        display: flex;
        justify-content: center;
        gap: 5px;
        flex-wrap: wrap;
        margin-bottom: 8px;
    }
    .equipes-num-btn {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        color: #374151;
        transition: all .15s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: inherit;
    }
    .equipes-num-btn:hover { border-color: #9ca3af; background: #f0f2f5; }
    .equipes-num-btn.selected {
        background: #4a90e2;
        color: #fff;
        border-color: #4a90e2;
    }
    .equipes-generate-btn {
        display: block;
        width: 50%;
        margin: 0 auto;
        padding: 7px 16px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: background .15s, transform .1s;
        font-family: inherit;
        background: #4a90e2;
        color: #fff;
    }
    .equipes-generate-btn:hover { background: #357abd; }
    .equipes-generate-btn:active { transform: scale(0.96); }

    /* ── Résultats équipes ── */
    .equipes-results-wrapper {
        flex: 1;
        min-height: 0;
        display: none;
        position: relative;
        flex-direction: column;
    }
    .equipes-results {
        flex: 1;
        overflow-y: auto;
        padding: 8px 10px;
        min-height: 0;
        scrollbar-width: none;
        display: block;
    }
    .equipes-results::-webkit-scrollbar { display: none; }

    /* ── Boutons de défilement tactiles ── */
    .equipes-scroll-btn {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 28px;
        border-radius: 20px;
        border: 1.5px solid #d1d5db;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        color: #6b7280;
        font-size: 14px;
        font-weight: 900;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s, background .15s;
        line-height: 1;
    }
    .equipes-scroll-btn.visible {
        opacity: 1;
        pointer-events: auto;
    }
    .equipes-scroll-btn:hover { background: #f0f4ff; border-color: #4a90e2; color: #4a90e2; }
    .equipes-scroll-btn:active { background: #dbeafe; transform: translateX(-50%) scale(0.95); }
    .equipes-scroll-up   { top: 4px; }
    .equipes-scroll-down { bottom: 4px; }
    .equipes-results-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
    }
    .equipes-results-grid.cols-4 {
        grid-template-columns: repeat(4, 1fr);
    }
    .equipes-team-card {
        border-radius: 10px;
        padding: 8px;
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
    }
    .equipes-team-header {
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 5px;
        padding-bottom: 3px;
    }
    .equipes-team-title {
        font-weight: 900;
        font-size: 12px;
        color: #374151;
        text-transform: uppercase;
        display: block;
    }
    .equipes-team-stats {
        font-size: 9px;
        color: #9ca3af;
        display: block;
        line-height: 1.4;
    }
    .equipes-team-member {
        display: flex;
        align-items: center;
        margin-bottom: 3px;
        font-size: 15px;
        font-weight: 700;
    }
    .equipes-results-grid.cols-4 .equipes-team-member {
        font-size: 18px;
    }
    .equipes-tag {
        font-size: 8px;
        font-weight: 700;
        margin-right: 5px;
        padding: 1px 5px;
        border-radius: 999px;
        color: #fff;
        min-width: 28px;
        text-align: center;
        flex-shrink: 0;
    }
    .equipes-name-f { color: #16a34a; }
    .equipes-name-m { color: #ea580c; }

    /* ── Footer RàZ ── */
    .equipes-footer {
        padding: 0 12px 10px;
        flex-shrink: 0;
        display: none;
    }
    .equipes-reset-btn {
        display: block;
        margin: 0 auto;
        width: 30%;
        min-width: 180px;
        padding: 7px 16px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        font-family: inherit;
        background: #f87171;
        color: #fff;
        transition: background .15s, transform .1s;
    }
    .equipes-reset-btn:hover { background: #ef4444; }
    .equipes-reset-btn:active { transform: scale(0.98); }

    /* ── Modal confirmation ── */
    .equipes-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 200;
        background: rgba(0,0,0,0.35);
        backdrop-filter: blur(4px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        border-radius: 16px;
        box-sizing: border-box;
    }
    .equipes-modal-overlay.open { display: flex; }
    .equipes-modal-box {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        width: 100%;
        max-width: 290px;
        color: #374151;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
    }
    .equipes-modal-title {
        font-size: 13px;
        font-weight: 800;
        text-align: center;
        margin-bottom: 7px;
        color: #374151;
    }
    .equipes-modal-text {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
        line-height: 1.5;
        font-weight: 500;
        white-space: pre-line;
    }
    .equipes-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
    }
    .equipes-modal-btn {
        flex: 1;
        padding: 8px;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 11px;
        cursor: pointer;
        font-family: inherit;
        transition: background .15s, transform .1s;
    }
    .equipes-modal-btn:active { transform: scale(0.96); }
    .equipes-modal-cancel { background: #f3f4f6; color: #6b7280; }
    .equipes-modal-cancel:hover { background: #e5e7eb; }

    /* ── Popup aide ── */
    .equipes-help-popup {
        display: none;
        position: absolute;
        top: 42px;
        right: 10px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 12px 14px;
        width: 260px;
        font-size: 11px;
        color: #4b5563;
        z-index: 10;
        line-height: 1.6;
    }
    .equipes-help-popup.show { display: block; }
    .equipes-help-popup h4 {
        margin: 0 0 8px;
        font-size: 12px;
        color: #374151;
        font-weight: 800;
    }
    `;

    if (!document.getElementById('equipes-widget-style')) {
        const s = document.createElement('style');
        s.id = 'equipes-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // Injecter le CSS des boutons wf si pas déjà fait
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

    // ── Constantes ────────────────────────────────────────────────────────
    const EQUIPES_LEVEL_COLORS = {
        'CP': '#ec4899', 'CE1': '#3b82f6', 'CE2': '#eab308',
        'CM1': '#ef4444', 'CM2': '#22c55e', 'AUTRE': '#a855f7'
    };
    const EQUIPES_LEVEL_ORDER = ['CP','CE1','CE2','CM1','CM2','AUTRE'];
    const EQUIPES_THEME       = '#4a90e2';
    const ALGORITHM_ITERATIONS = 300;
    const TEAM_MIN = 2;
    const TEAM_MAX = 8;
    const DEFAULT_TEAM_COUNT = 4;

    // ── HTML interne partagé (création + restauration) ────────────────────
    function equipesInnerHTML() {
        return `
        <div class="equipes-inner">
            <div class="equipes-header">
                <div class="equipes-header-title">👥 Équipes équilibrées</div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="equipes-help-btn-wf" title="Aide" onmousedown="event.stopPropagation()" style="width:22px;height:22px;border-radius:50%;border:1px solid #bbb;background:#f5f5f5;color:#666;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-family:inherit;">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                </div>
            </div>
            <div class="equipes-help-popup">
                <h4>💡 Comment ça marche</h4>
                <p>• Importez une liste d'élèves (.txt ou .csv)<br>
                Format : <em>Prénom;NOM;sexe;NIVEAU;date</em><br><br>
                • Cliquez sur un élève pour le marquer absent (il ne sera pas inclus).<br>
                • Choisissez le nombre d'équipes (2 à 8).<br>
                • L'algorithme équilibre les équipes par genre et par niveau.</p>
            </div>
            <div class="equipes-import-zone">
                <button class="equipes-import-btn">📄 Importer une liste d'élèves</button>
                <input type="file" class="equipes-file-input" accept=".txt,.csv" style="display:none;">
                <div class="equipes-status">Format : Prénom;NOM;sexe;NIVEAU;date</div>
            </div>
            <div class="equipes-level-tabs"></div>
            <div class="equipes-body" style="display:none;"></div>
            <div class="equipes-config">
                <div class="equipes-config-label">Nombre d'équipes</div>
                <div class="equipes-selector"></div>
                <button class="equipes-generate-btn">⚖️ Générer les équipes</button>
            </div>
            <div class="equipes-results-wrapper">
                <button class="equipes-scroll-btn equipes-scroll-up" title="Défiler vers le haut">▲</button>
                <div class="equipes-results">
                    <div class="equipes-results-grid"></div>
                </div>
                <button class="equipes-scroll-btn equipes-scroll-down" title="Défiler vers le bas">▼</button>
            </div>
            <div class="equipes-footer">
                <button class="equipes-reset-btn">⚠️ Effacer les équipes</button>
            </div>
            <div class="equipes-modal-overlay">
                <div class="equipes-modal-box">
                    <div class="equipes-modal-title">Confirmation</div>
                    <p class="equipes-modal-text"></p>
                    <div class="equipes-modal-btns">
                        <button class="equipes-modal-btn equipes-modal-cancel">Annuler</button>
                        <button class="equipes-modal-btn equipes-modal-confirm" style="background:#4a90e2;color:#fff;">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initEquipesWidget = function (widget) {

        const outer = widget.querySelector('.equipes-outer');

        // Bloquer la remontée mousedown depuis l'intérieur
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // ── Header draggable (une seule fois) ─────────────────────────────
        const equipesHeader = widget.querySelector('.equipes-header');
        if (equipesHeader && !equipesHeader._dragInit) {
            equipesHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            equipesHeader.addEventListener('mousedown',  onHeaderDown);
            equipesHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const importZone    = widget.querySelector('.equipes-import-zone');
        const importBtn     = widget.querySelector('.equipes-import-btn');
        const fileInput     = widget.querySelector('.equipes-file-input');
        const statusEl      = widget.querySelector('.equipes-status');
        const levelTabs     = widget.querySelector('.equipes-level-tabs');
        const body          = widget.querySelector('.equipes-body');
        const configPanel   = widget.querySelector('.equipes-config');
        const selector      = widget.querySelector('.equipes-selector');
        const generateBtn   = widget.querySelector('.equipes-generate-btn');
        const resultsWrapper = widget.querySelector('.equipes-results-wrapper');
        const resultsPanel  = widget.querySelector('.equipes-results');
        const resultsGrid   = widget.querySelector('.equipes-results-grid');
        const scrollUpBtn   = widget.querySelector('.equipes-scroll-up');
        const scrollDownBtn = widget.querySelector('.equipes-scroll-down');
        const footer        = widget.querySelector('.equipes-footer');
        const resetBtn      = widget.querySelector('.equipes-reset-btn');
        const modalOverlay  = widget.querySelector('.equipes-modal-overlay');
        const helpBtn       = widget.querySelector('.equipes-help-btn-wf');
        const helpPopup     = widget.querySelector('.equipes-help-popup');

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        function equipesCollapse() {
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.equipesW) || 620;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.equipesH) || 720;
            widget.dataset.equipesW = savedW;
            widget.dataset.equipesH = savedH;

            // Sauvegarder la position ORIGINALE avant de modifier le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.equipesLeftSaved = widget.offsetLeft;
            widget.dataset.equipesTopSaved  = widget.offsetTop;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            // Cacher le contenu et les poignées
            outer.style.display = 'none';
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                  .forEach(el => el.style.display = 'none');

            // Dimensionner le widget en mini-barre et le placer en haut à gauche
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.dataset.collapsed === '1'
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top  = MARGIN_TOP + 'px';
            widget.style.left = occupiedX  + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.overflow     = 'hidden';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.dataset.collapsed = '1';

            // Créer la mini-barre
            const miniBar = document.createElement('div');
            miniBar.className = 'equipes-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '👥 Équipes équilibrées';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); equipesExpand(); });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            // Mini-barre draggable
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp   = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup',   onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup',   onUp);
            });

            if (typeof saveBoard === 'function') saveBoard();
        }

        function equipesExpand() {
            const savedW    = parseFloat(widget.dataset.equipesW)        || 620;
            const savedH    = parseFloat(widget.dataset.equipesH)        || 720;
            const savedLeft = parseFloat(widget.dataset.equipesLeftSaved);
            const savedTop  = parseFloat(widget.dataset.equipesTopSaved);

            // Supprimer la mini-barre
            widget.querySelectorAll('.equipes-mini-bar').forEach(el => el.remove());

            // Réinitialiser tous les styles inline du widget (comme une actualisation)
            widget.removeAttribute('style');
            widget.style.left = (!isNaN(savedLeft) ? savedLeft : widget.offsetLeft) + 'px';
            widget.style.top  = (!isNaN(savedTop)  ? savedTop  : widget.offsetTop)  + 'px';

            const wc = widget.querySelector('.widget-content');
            if (wc) wc.removeAttribute('style');

            widget.dataset.collapsed = '0';

            // Réafficher et redimensionner outer
            outer.style.display = '';
            outer.style.width   = savedW + 'px';
            outer.style.height  = savedH + 'px';

            // Réinjecter le HTML interne et réinitialiser (comme l'actualisation)
            outer.innerHTML = equipesInnerHTML();
            initEquipesWidget(widget);

            // Mettre à jour les % de position
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        // Exposer expand sur le widget pour que la mini-barre de restauration puisse l'appeler
        widget._equipesExpand = equipesExpand;

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); equipesCollapse(); });
        }
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                _isMax = !_isMax;
                const inner = widget.querySelector('.equipes-inner');
                if (_isMax) {
                    inner.style.position = 'fixed';
                    inner.style.inset = '0';
                    inner.style.width = '100%';
                    inner.style.height = '100%';
                    inner.style.zIndex = '9999';
                    inner.style.borderRadius = '0';
                } else {
                    inner.style.position = '';
                    inner.style.inset = '';
                    inner.style.width = '';
                    inner.style.height = '';
                    inner.style.zIndex = '';
                    inner.style.borderRadius = '';
                }
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

        // ── Aide popup ────────────────────────────────────────────────────
        if (helpBtn && helpPopup) {
            helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                helpPopup.classList.toggle('show');
            });
            helpBtn.addEventListener('mouseover', () => { helpBtn.style.background = '#e0e0e0'; helpBtn.style.color = '#333'; });
            helpBtn.addEventListener('mouseout',  () => { helpBtn.style.background = '#f5f5f5'; helpBtn.style.color = '#666'; });
            document.addEventListener('click', () => helpPopup.classList.remove('show'));
        }

        // ── État ──────────────────────────────────────────────────────────
        let allStudents    = [];
        let absentSet      = new Set();
        let selectedCount  = DEFAULT_TEAM_COUNT;
        let currentLevel   = 'tous';
        let savedTeams     = null;

        // Restaurer depuis dataset si données présentes
        if (widget.dataset.equipesStudents) {
            try {
                allStudents = JSON.parse(widget.dataset.equipesStudents);
                absentSet   = new Set(JSON.parse(widget.dataset.equipesAbsents || '[]'));
                selectedCount = parseInt(widget.dataset.equipesCount || DEFAULT_TEAM_COUNT);
                savedTeams  = widget.dataset.equipesTeams ? JSON.parse(widget.dataset.equipesTeams) : null;
                showLoadedState();
                if (savedTeams) renderTeams(savedTeams);
            } catch(e) { console.warn('equipes: erreur restauration dataset', e); }
        } else {
            // Chercher liste dans localStorage (partagée avec tirage)
            try {
                const saved = localStorage.getItem('tirage_students_list') || localStorage.getItem('maListeEleves');
                if (saved) {
                    const raw = JSON.parse(saved);
                    allStudents = normalizeStudents(raw);
                    setStatus('✓ ' + allStudents.length + ' élève(s) (liste mémorisée)', 'ok');
                    showLoadedState();
                }
            } catch(e) {}
        }

        // ── Normalisation des données élèves ─────────────────────────────
        // Supporte le format tirage (prenom/nom/sexe/niveau) et le format outils (identite/sexe/niveau)
        function normalizeStudents(raw) {
            return raw.map((s, i) => {
                if (s.prenom !== undefined) {
                    // Format widget-tirage : {id, prenom, nom, sexe, niveau}
                    return {
                        id:     s.id !== undefined ? s.id : i,
                        prenom: s.prenom,
                        nom:    s.nom || '',
                        sexe:   s.sexe || '',
                        niveau: (s.niveau || 'AUTRE').trim().toUpperCase()
                    };
                } else if (s.identite !== undefined) {
                    // Format outils_equipes : {id, identite, sexe, niveau}
                    const parts = s.identite.trim().split(' ');
                    return {
                        id:     s.id !== undefined ? s.id : i,
                        prenom: parts[0] || '',
                        nom:    parts.slice(1).join(' ') || '',
                        sexe:   s.sexe || '',
                        niveau: (s.niveau || 'AUTRE').toString().trim().toUpperCase()
                    };
                }
                return s;
            });
        }

        // ── Import ────────────────────────────────────────────────────────
        importBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => parseStudents(ev.target.result);
            reader.readAsText(file, 'UTF-8');
            e.target.value = '';
        });

        function parseStudents(text) {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const students = [];
            lines.forEach((line, i) => {
                const parts = line.split(';').map(s => s.trim());
                if (!parts[0]) return;
                students.push({
                    id:     i,
                    prenom: parts[0],
                    nom:    parts[1] || '',
                    sexe:   parts[2] || '',
                    niveau: (parts[3] || 'AUTRE').trim().toUpperCase()
                });
            });
            if (!students.length) { setStatus('Aucun élève trouvé.', 'err'); return; }
            allStudents = students;
            absentSet   = new Set();
            savedTeams  = null;
            setStatus('✓ ' + students.length + ' élève(s) chargé(s)', 'ok');
            try { localStorage.setItem('tirage_students_list', JSON.stringify(allStudents)); } catch(e) {}
            persistData();
            showLoadedState();
            resultsGrid.innerHTML = '';
            resultsWrapper.style.display = 'none';
            footer.style.display = 'none';
        }

        function showLoadedState() {
            importZone.style.display  = 'none';
            body.style.display        = 'flex';
            configPanel.style.display = 'block';
            buildLevelTabs();
            buildSelector();
            renderAttendance();
        }

        function setStatus(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className   = 'equipes-status' + (cls ? ' ' + cls : '');
        }

        function persistData() {
            widget.dataset.equipesStudents = JSON.stringify(allStudents);
            widget.dataset.equipesAbsents  = JSON.stringify(Array.from(absentSet));
            widget.dataset.equipesCount    = selectedCount;
            widget.dataset.equipesTeams    = savedTeams ? JSON.stringify(savedTeams) : '';
        }

        // ── Onglets niveau ────────────────────────────────────────────────
        function buildLevelTabs() {
            const niveaux = [...new Set(allStudents.map(s => s.niveau))].sort((a, b) =>
                (EQUIPES_LEVEL_ORDER.indexOf(a) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(a)) -
                (EQUIPES_LEVEL_ORDER.indexOf(b) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(b))
            );
            levelTabs.innerHTML = '';
            levelTabs.style.display = 'flex';

            // Bouton "Changer de classe"
            const changeBtn = document.createElement('button');
            changeBtn.className = 'equipes-level-tab equipes-change-class-btn';
            changeBtn.title = 'Charger une autre liste';
            changeBtn.textContent = '📂';
            changeBtn.style.cssText = 'margin-right:auto;background:#f0f4ff;border-color:#c7d9f8;color:#4a90e2;';
            changeBtn.addEventListener('click', () => fileInput.click());
            levelTabs.appendChild(changeBtn);

            if (niveaux.length > 1) {
                levelTabs.appendChild(makeTab('Tous', 'tous'));
                niveaux.forEach(niv => levelTabs.appendChild(makeTab(niv, niv)));
                setActiveTab('tous');
            }
        }

        function makeTab(label, value) {
            const tab = document.createElement('button');
            tab.className    = 'equipes-level-tab';
            tab.textContent  = label;
            tab.dataset.level = value;
            tab.addEventListener('click', () => { currentLevel = value; setActiveTab(value); renderAttendance(); });
            return tab;
        }

        function setActiveTab(value) {
            levelTabs.querySelectorAll('.equipes-level-tab').forEach(t => {
                const isActive = t.dataset.level === value;
                const color    = t.dataset.level === 'tous' ? EQUIPES_THEME : getLevelColor(t.dataset.level);
                t.style.backgroundColor = isActive ? color  : '#f0f0f0';
                t.style.borderColor     = isActive ? color  : '#e0e0e0';
                t.style.color           = isActive ? '#fff' : '#999';
            });
        }

        function getLevelColor(niv) { return EQUIPES_LEVEL_COLORS[niv] || '#a855f7'; }

        // ── Sélecteur nombre d'équipes ────────────────────────────────────
        function buildSelector() {
            selector.innerHTML = '';
            for (let i = TEAM_MIN; i <= TEAM_MAX; i++) {
                const btn = document.createElement('button');
                btn.className = 'equipes-num-btn' + (i === selectedCount ? ' selected' : '');
                btn.textContent = i;
                btn.dataset.count = i;
                btn.addEventListener('click', () => selectCount(i));
                selector.appendChild(btn);
            }
        }

        function selectCount(count) {
            selectedCount = count;
            selector.querySelectorAll('.equipes-num-btn').forEach(btn => {
                btn.classList.toggle('selected', parseInt(btn.dataset.count) === count);
            });
            persistData();
        }

        // ── Rendu grille présence ─────────────────────────────────────────
        function getFiltered() {
            return currentLevel === 'tous' ? allStudents : allStudents.filter(s => s.niveau === currentLevel);
        }

        function hasDupPrenom(p) {
            return allStudents.filter(s => s.prenom.toLowerCase() === p.toLowerCase()).length > 1;
        }

        function displayName(s) {
            return hasDupPrenom(s.prenom) ? s.prenom + ' ' + (s.nom.charAt(0) || '') + '.' : s.prenom;
        }

        function renderAttendance() {
            body.innerHTML = '';
            const students = getFiltered();
            const groups   = {};
            students.forEach(s => { if (!groups[s.niveau]) groups[s.niveau] = []; groups[s.niveau].push(s); });

            const sortedLevels = Object.keys(groups).sort((a, b) =>
                (EQUIPES_LEVEL_ORDER.indexOf(a) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(a)) -
                (EQUIPES_LEVEL_ORDER.indexOf(b) === -1 ? 99 : EQUIPES_LEVEL_ORDER.indexOf(b))
            );

            sortedLevels.forEach(niv => {
                const block = document.createElement('div');
                if (sortedLevels.length > 1) {
                    const lbl = document.createElement('div');
                    lbl.className = 'equipes-level-label';
                    lbl.style.color = getLevelColor(niv);
                    lbl.textContent = niv;
                    block.appendChild(lbl);
                }
                const grid = document.createElement('div');
                grid.className = 'equipes-grid';
                groups[niv].sort((a, b) => a.prenom.localeCompare(b.prenom)).forEach(s => {
                    const pill = document.createElement('div');
                    pill.className = 'equipes-pill';
                    const isAbsent = absentSet.has(String(s.id));
                    if (isAbsent) {
                        pill.classList.add('absent');
                    } else {
                        pill.classList.add(s.sexe.toLowerCase().startsWith('f') ? 'girl' : 'boy');
                    }
                    pill.textContent = displayName(s);
                    pill.title       = s.prenom + ' ' + s.nom + (isAbsent ? ' (absent)' : '');
                    pill.addEventListener('click', () => toggleAbsent(s.id));
                    grid.appendChild(pill);
                });
                block.appendChild(grid);
                body.appendChild(block);
            });
        }

        function toggleAbsent(id) {
            const key = String(id);
            if (absentSet.has(key)) absentSet.delete(key);
            else absentSet.add(key);
            persistData();
            renderAttendance();
        }

        // ── Algorithme de génération d'équipes ────────────────────────────
        generateBtn.addEventListener('click', generateBalancedTeams);

        function isFemale(s) { return s.sexe.toLowerCase().startsWith('f'); }

        function getTeamStats(team) {
            const stats = { f: 0, m: 0, total: team.length, levels: {} };
            EQUIPES_LEVEL_ORDER.forEach(level => {
                stats.levels[level] = { f: 0, m: 0, total: 0 };
            });
            team.forEach(s => {
                const female = isFemale(s);
                const level  = s.niveau;
                if (female) stats.f++; else stats.m++;
                if (stats.levels[level]) {
                    stats.levels[level].total++;
                    if (female) stats.levels[level].f++;
                    else stats.levels[level].m++;
                }
            });
            return stats;
        }

        // Score = pénalités (plus bas = mieux) ; on ANNULE l'échange si newScore >= currentScore
        function calculateScore(stats1, stats2) {
            let score = 0;
            score += Math.abs(stats1.f - stats2.f) * 10;
            score += Math.abs(stats1.m - stats2.m) * 10;
            EQUIPES_LEVEL_ORDER.forEach(level => {
                score += Math.abs(stats1.levels[level].f     - stats2.levels[level].f)     * 20;
                score += Math.abs(stats1.levels[level].total - stats2.levels[level].total)  * 5;
            });
            return score;
        }

        function generateBalancedTeams() {
            const pool = currentLevel === 'tous'
                ? allStudents
                : allStudents.filter(s => s.niveau === currentLevel);
            const present = pool.filter(s => !absentSet.has(String(s.id)));

            if (present.length < selectedCount) {
                showAlert(`Pas assez d'élèves présents (${present.length}) pour former ${selectedCount} équipes.`);
                return;
            }

            // Distribution initiale aléatoire
            let teams = Array.from({ length: selectedCount }, () => []);
            const shuffled = [...present].sort(() => Math.random() - 0.5);
            shuffled.forEach((s, idx) => teams[idx % selectedCount].push(s));

            // Optimisation par échanges (300 itérations)
            for (let iter = 0; iter < ALGORITHM_ITERATIONS; iter++) {
                for (let i = 0; i < teams.length; i++) {
                    for (let j = i + 1; j < teams.length; j++) {
                        const currentScore = calculateScore(getTeamStats(teams[i]), getTeamStats(teams[j]));
                        for (let x = 0; x < teams[i].length; x++) {
                            for (let y = 0; y < teams[j].length; y++) {
                                // Tenter l'échange
                                const tmp = teams[i][x];
                                teams[i][x] = teams[j][y];
                                teams[j][y] = tmp;
                                const newScore = calculateScore(getTeamStats(teams[i]), getTeamStats(teams[j]));
                                if (newScore >= currentScore) {
                                    // Annuler si pas d'amélioration
                                    teams[j][y] = teams[i][x];
                                    teams[i][x] = tmp;
                                }
                            }
                        }
                    }
                }
            }

            savedTeams = teams;
            persistData();
            renderTeams(teams);
        }

        // ── Rendu des équipes ─────────────────────────────────────────────
        function renderTeams(teams) {
            resultsGrid.innerHTML = '';
            resultsGrid.classList.toggle('cols-4', teams.length >= 4);

            teams.forEach((team, idx) => {
                const stats = getTeamStats(team);
                const card = document.createElement('div');
                card.className = 'equipes-team-card';

                const header = document.createElement('div');
                header.className = 'equipes-team-header';
                header.innerHTML = `<span class="equipes-team-title">Équipe ${idx + 1}</span><span class="equipes-team-stats">${stats.f}F / ${stats.m}G</span>`;
                card.appendChild(header);

                // Trier par niveau
                const sorted = [...team].sort((a, b) => {
                    const ia = EQUIPES_LEVEL_ORDER.indexOf(a.niveau);
                    const ib = EQUIPES_LEVEL_ORDER.indexOf(b.niveau);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                });

                sorted.forEach(s => {
                    const color     = getLevelColor(s.niveau);
                    const nameClass = isFemale(s) ? 'equipes-name-f' : 'equipes-name-m';
                    const member    = document.createElement('div');
                    member.className = 'equipes-team-member';
                    member.innerHTML = `<span class="equipes-tag" style="background:${color}">${s.niveau}</span><span class="${nameClass}">${displayName(s)}</span>`;
                    card.appendChild(member);
                });

                resultsGrid.appendChild(card);
            });

            resultsWrapper.style.display = 'flex';
            footer.style.display       = 'block';
            updateScrollButtons();
        }

        // ── RàZ équipes ───────────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            showConfirm('Effacer les équipes ?', 'Les équipes générées seront supprimées.', () => {
                savedTeams = null;
                resultsGrid.innerHTML = '';
                resultsWrapper.style.display = 'none';
                footer.style.display       = 'none';
                persistData();
            });
        });

        // Restaurer les équipes sauvegardées
        if (savedTeams) renderTeams(savedTeams);

        // ── Modal ─────────────────────────────────────────────────────────
        function showAlert(text) {
            modalOverlay.querySelector('.equipes-modal-title').textContent = 'Information';
            modalOverlay.querySelector('.equipes-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.equipes-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.equipes-modal-confirm');
            cancelBtn.style.display = 'none';
            confirmBtn.textContent  = 'OK';
            confirmBtn.onclick      = closeModal;
            modalOverlay.classList.add('open');
        }

        function showConfirm(title, text, onConfirm, confirmLabel) {
            modalOverlay.querySelector('.equipes-modal-title').textContent = title;
            modalOverlay.querySelector('.equipes-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.equipes-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.equipes-modal-confirm');
            confirmBtn.textContent = confirmLabel || 'Confirmer';
            cancelBtn.style.display = '';
            confirmBtn.onclick = () => { closeModal(); onConfirm(); };
            modalOverlay.classList.add('open');
        }
        function closeModal() { modalOverlay.classList.remove('open'); }
        modalOverlay.querySelector('.equipes-modal-cancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        // ── Boutons de défilement tactiles pour equipes-results ───────────
        const SCROLL_STEP = 120;

        function updateScrollButtons() {
            if (!resultsPanel || !scrollUpBtn || !scrollDownBtn) return;
            const canUp   = resultsPanel.scrollTop > 2;
            const canDown = resultsPanel.scrollTop < resultsPanel.scrollHeight - resultsPanel.clientHeight - 2;
            scrollUpBtn.classList.toggle('visible', canUp);
            scrollDownBtn.classList.toggle('visible', canDown);
        }

        if (resultsPanel) {
            resultsPanel.addEventListener('scroll', updateScrollButtons);
        }

        // Scroll au clic (avec répétition maintien appui)
        function makeScrollHandler(direction) {
            let interval = null;
            function doScroll() {
                resultsPanel.scrollBy({ top: direction * SCROLL_STEP, behavior: 'smooth' });
            }
            return {
                start: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    doScroll();
                    interval = setInterval(doScroll, 300);
                },
                stop: () => {
                    clearInterval(interval);
                    interval = null;
                    setTimeout(updateScrollButtons, 350);
                }
            };
        }

        if (scrollUpBtn) {
            const h = makeScrollHandler(-1);
            scrollUpBtn.addEventListener('pointerdown', h.start);
            scrollUpBtn.addEventListener('pointerup',   h.stop);
            scrollUpBtn.addEventListener('pointerleave',h.stop);
            scrollUpBtn.addEventListener('pointercancel',h.stop);
        }
        if (scrollDownBtn) {
            const h = makeScrollHandler(1);
            scrollDownBtn.addEventListener('pointerdown', h.start);
            scrollDownBtn.addEventListener('pointerup',   h.stop);
            scrollDownBtn.addEventListener('pointerleave',h.stop);
            scrollDownBtn.addEventListener('pointercancel',h.stop);
        }

        // ── Mise à l'échelle des pills selon la largeur du widget ─────────
        function updatePillScale() {
            const w = outer.offsetWidth || 420;
            const minW = 300, maxW = 700;
            const t = Math.max(0, Math.min(1, (w - minW) / (maxW - minW)));
            const fs  = (9  + t * 7).toFixed(1)  + 'px';
            const pad = (4  + t * 5).toFixed(1)  + 'px';
            const gap = (4  + t * 5).toFixed(1)  + 'px';
            body.style.setProperty('--pill-fs',  fs);
            body.style.setProperty('--pill-pad', pad);
            body.style.setProperty('--pill-gap', gap);
        }

        // ── Poignée de redimensionnement custom ───────────────────────────
        if (!widget.querySelector('.custom-resize-handle')) {
            const handle = document.createElement('div');
            handle.className = 'custom-resize-handle';
            handle.title = 'Redimensionner';
            widget.appendChild(handle);

            handle.addEventListener('pointerdown', (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                e.stopPropagation();
                e.preventDefault();
                handle.setPointerCapture(e.pointerId);
                const startX = e.clientX, startY = e.clientY;
                const startW = outer.offsetWidth,  startH = outer.offsetHeight;
                const minW = 300, minH = 220;

                function onMove(ev) {
                    ev.preventDefault();
                    outer.style.width  = Math.max(minW, startW + ev.clientX - startX) + 'px';
                    outer.style.height = Math.max(minH, startH + ev.clientY - startY) + 'px';
                }
                function onUp() {
                    handle.removeEventListener('pointermove',   onMove);
                    handle.removeEventListener('pointerup',     onUp);
                    handle.removeEventListener('pointercancel', onUp);
                    if (typeof saveBoard === 'function') saveBoard();
                }
                handle.addEventListener('pointermove',   onMove);
                handle.addEventListener('pointerup',     onUp);
                handle.addEventListener('pointercancel', onUp);
            });
        }

        // ── Sauvegarder la taille via ResizeObserver ──────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                if (outer.dataset.collapsed !== '1') {
                    if (outer.offsetWidth  > 0) widget.dataset.equipesW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.equipesH = outer.offsetHeight;
                }
                updatePillScale();
            });
            ro.observe(outer);
            updatePillScale();
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createEquipesWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 140, y: 90 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'equipes';
        widget.dataset.transparent = 'true';
        // Le widget s'ouvre à 100px du bord gauche du board.
        widget.style.cssText = `left:100px; top:${pos.y}px;`;
        widget.tabIndex = 0;

        widget.innerHTML = `
            <div class="drag-handle" title="Déplacer">✥</div>
            <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
            <div class="widget-action-bar">
                <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
                <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
                <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
                <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
            </div>
            <div class="widget-ctx-menu"></div>
            <div class="equipes-outer">${equipesInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initEquipesWidget(widget);
        saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — inclure dimensions + données dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function') return;
        window.buildBoardState = function () {
            const state = _orig.apply(this, arguments);
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            document.querySelectorAll('.widget[data-type="equipes"]').forEach(widget => {
                const outer     = widget.querySelector('.equipes-outer');
                const collapsed = widget.dataset.collapsed === '1';
                if (!outer) return;

                // Quand réduit, corriger leftPercent/topPercent avec la position d'origine
                if (collapsed) {
                    const origLeft = parseFloat(widget.dataset.equipesLeftSaved);
                    const origTop  = parseFloat(widget.dataset.equipesTopSaved);
                    if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                    if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                }

                const match = (state.widgets || []).find(w => w.type === 'equipes' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                );
                if (match) {
                    const w = parseFloat(widget.dataset.equipesW) || outer.offsetWidth;
                    const h = parseFloat(widget.dataset.equipesH) || outer.offsetHeight;
                    if (w > 0) match.equipesW = w;
                    if (h > 0) match.equipesH = h;
                    match.widthPercent    = 0;
                    match.contentHPercent = 0;
                    if (collapsed) {
                        match.leftPercent = parseFloat(widget.dataset.leftPercent);
                        match.topPercent  = parseFloat(widget.dataset.topPercent);
                    }
                    match.equipesCollapsed  = collapsed;
                    if (widget.dataset.equipesLeftSaved) match.equipesLeftSaved = widget.dataset.equipesLeftSaved;
                    if (widget.dataset.equipesTopSaved)  match.equipesTopSaved  = widget.dataset.equipesTopSaved;
                    if (widget.dataset.equipesStudents)  match.equipesStudents  = widget.dataset.equipesStudents;
                    if (widget.dataset.equipesAbsents)   match.equipesAbsents   = widget.dataset.equipesAbsents;
                    if (widget.dataset.equipesCount)     match.equipesCount     = widget.dataset.equipesCount;
                    if (widget.dataset.equipesTeams)     match.equipesTeams     = widget.dataset.equipesTeams;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreEquipes() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                // Pré-parser : stocker les données equipes dans un tableau ordonné
                let equipesList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'equipes') equipesList.push(w); });
                } catch(e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="equipes"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.equipes-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'equipes-outer';
                            widget.appendChild(outer);
                        }
                        if (!outer.querySelector('.equipes-inner')) {
                            outer.innerHTML = equipesInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = equipesList[idx];

                        if (saved) {
                            if (saved.equipesStudents)  widget.dataset.equipesStudents  = saved.equipesStudents;
                            if (saved.equipesAbsents)   widget.dataset.equipesAbsents   = saved.equipesAbsents;
                            if (saved.equipesCount)     widget.dataset.equipesCount     = saved.equipesCount;
                            if (saved.equipesTeams)     widget.dataset.equipesTeams     = saved.equipesTeams;
                            if (saved.equipesLeftSaved) widget.dataset.equipesLeftSaved = saved.equipesLeftSaved;
                            if (saved.equipesTopSaved)  widget.dataset.equipesTopSaved  = saved.equipesTopSaved;
                            const w = saved.equipesW || parseFloat(widget.dataset.equipesW);
                            const h = saved.equipesH || parseFloat(widget.dataset.equipesH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.equipesW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.equipesH = h; }

                            // Restaurer position d'origine si le widget était réduit
                            if (saved.equipesCollapsed) {
                                const origLeft = parseFloat(saved.equipesLeftSaved);
                                const origTop  = parseFloat(saved.equipesTopSaved);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initEquipesWidget(widget);

                        // Appliquer l'état réduit APRÈS init (qui remet outer visible)
                        if (saved && saved.equipesCollapsed) {
                            outer.style.display = 'none';
                            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle')
                                  .forEach(el => el.style.display = 'none');
                            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
                            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                                w !== widget && w.dataset.collapsed === '1'
                            );
                            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
                            widget.style.top  = MARGIN_TOP + 'px';
                            widget.style.left = occupiedX  + 'px';
                            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
                            widget.style.overflow = 'hidden'; widget.style.background = '#2a2a3e';
                            widget.style.borderRadius = '8px'; widget.style.border = 'none'; widget.style.padding = '0';
                            const wc = widget.querySelector('.widget-content');
                            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
                            widget.dataset.collapsed = '1';

                            // Créer la mini-barre
                            if (!widget.querySelector('.equipes-mini-bar')) {
                                const miniBar = document.createElement('div');
                                miniBar.className = 'equipes-mini-bar';
                                miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
                                const labelEl = document.createElement('span');
                                labelEl.textContent = '👥 Équipes équilibrées';
                                labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
                                const expandBtn = document.createElement('button');
                                expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
                                expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
                                expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
                                expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
                                expandBtn.addEventListener('click', e => {
                                    e.stopPropagation(); e.preventDefault();
                                    if (typeof widget._equipesExpand === 'function') widget._equipesExpand();
                                });
                                miniBar.appendChild(labelEl);
                                miniBar.appendChild(expandBtn);
                                miniBar.addEventListener('pointerdown', (e) => {
                                    if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                                    e.stopPropagation(); e.preventDefault();
                                    miniBar.setPointerCapture(e.pointerId);
                                    const startX = e.clientX - widget.offsetLeft;
                                    const startY = e.clientY - widget.offsetTop;
                                    const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                                    const onUp   = () => {
                                        miniBar.removeEventListener('pointermove', onMove);
                                        miniBar.removeEventListener('pointerup', onUp);
                                        const curW = window.innerWidth;
                                        const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                                        widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
                                        widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                                        if (typeof saveBoard === 'function') saveBoard();
                                    };
                                    miniBar.addEventListener('pointermove', onMove);
                                    miniBar.addEventListener('pointerup', onUp);
                                });
                                widget.appendChild(miniBar);
                            }
                        }
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'equipes'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'equipes') return window.createEquipesWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
