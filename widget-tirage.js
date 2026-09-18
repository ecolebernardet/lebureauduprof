// =========================================================================
// WIDGET TIRAGE AU SORT — Le Bureau du Prof
// Inspiré de outils_tirage.html (OutilsProfs)
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-tirage.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createTirageWidget();closeMainMenu()">
//          <span class="mm-ico">🎡</span>Tirage au Sort
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="tirage"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="tirage"] .tirage-outer {
        position: relative;
        width: 600px;
        height: 700px;
        min-width: 280px;
        min-height: 200px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 16px;
    }
    .widget[data-type="tirage"] .tirage-outer::-webkit-resizer { display: none; }

    /* ── Container intérieur plein ── */
    .tirage-inner {
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
    .tirage-header {
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
    .tirage-header-title {
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.3px;
        flex-grow: 1;
        color: #374151;
        pointer-events: none;
    }
    /* Boutons aide (legacy, gardés pour compatibilité) */
    .tirage-header-btn {
        width: 22px; height: 22px;
        border-radius: 50%;
        border: 1px solid #bbb;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px;
        font-weight: 700;
        background: #f5f5f5;
        color: #666;
        transition: background .15s;
        flex-shrink: 0;
    }
    .tirage-header-btn:hover { background: #e0e0e0; color: #333; }
    /* Bouton import dans le header */
    .tirage-import-header-btn {
        font-size: 14px;
        background: transparent;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
        line-height: 1;
        padding: 2px;
        transition: transform .15s;
    }
    .tirage-import-header-btn:hover { transform: scale(1.15); }

    /* ── Import zone ── */
    .tirage-import-zone {
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
    }
    .tirage-import-btn {
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
    .tirage-import-btn:hover { background: #357abd; }
    .tirage-import-btn:active { transform: scale(0.96); }
    .tirage-status {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-align: center;
    }
    .tirage-status.ok  { color: #059669; }
    .tirage-status.err { color: #dc2626; }

    /* ── Filtres niveau ── */
    .tirage-level-tabs {
        display: none;
        flex-wrap: wrap;
        gap: 4px;
        padding: 6px 10px;
        align-items: center;
        flex-shrink: 0;
        border-bottom: 1px solid #e5e7eb;
    }
    .tirage-level-tab {
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

    /* ── Grille élèves ── */
    .tirage-body {
        padding: 10px 14px 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow-y: auto;
        min-height: 0;
        max-height: 55%;
        flex-shrink: 1;
        scrollbar-width: thin;
        scrollbar-color: #d1d5db transparent;
        --pill-fs: 9px;
        --pill-pad: 4px;
        --pill-gap: 4px;
    }
    .tirage-level-label {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 10px;
        margin-bottom: 6px;
        text-align: center;
        color: #6b7280;
    }
    .tirage-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--pill-gap, 4px);
    }
    .tirage-pill {
        padding: var(--pill-pad, 4px) 2px;
        border-radius: 6px;
        font-size: var(--pill-fs, 9px);
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
    .tirage-pill:hover { border-color: #9ca3af; background: #f0f2f5; }
    .tirage-pill.girl { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }
    .tirage-pill.girl:hover { background: #dcfce7; }
    .tirage-pill.boy  { color: #ea580c; border-color: #fed7aa; background: #fff7ed; }
    .tirage-pill.boy:hover  { background: #ffedd5; }
    .tirage-pill.drawn {
        background: #f9fafb !important;
        color: #d1d5db !important;
        text-decoration: line-through;
        border-color: #e5e7eb !important;
        opacity: 0.6;
        transform: scale(0.94);
    }

    /* ── Carte résultat ── */
    .tirage-result-card {
        display: flex;
        margin: 8px auto;
        background: #f8f9fa;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 10px 12px;
        width: 30%;
        min-width: 200px;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }
    .tirage-result-display {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        height: 60px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 800;
        transition: transform .2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color .2s;
    }
    .tirage-draw-btn {
        width: 80%;
        padding: 7px 16px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        margin-top: 4px;
        transition: background .15s, transform .1s;
        font-family: inherit;
        background: #4a90e2;
        color: #fff;
    }
    .tirage-draw-btn:hover { background: #357abd; }
    .tirage-draw-btn:active { transform: scale(0.96); }
    .tirage-draw-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.5); }
    .tirage-stats {
        font-size: 10px;
        color: #9ca3af;
        font-weight: 600;
    }

    /* ── Footer RàZ ── */
    .tirage-footer {
        padding: 0 12px 12px;
        flex-shrink: 0;
    }
    .tirage-reset-btn {
        display: block;
        margin: 0 auto;
        width: 25%;
        min-width: 200px;
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
    .tirage-reset-btn:hover { background: #ef4444; }
    .tirage-reset-btn:active { transform: scale(0.98); }

    /* ── Modal confirmation ── */
    .tirage-modal-overlay {
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
    .tirage-modal-overlay.open { display: flex; }
    .tirage-modal-box {
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        width: 100%;
        max-width: 290px;
        color: #374151;
        box-shadow: 0 16px 40px rgba(0,0,0,0.2);
    }
    .tirage-modal-title {
        font-size: 13px;
        font-weight: 800;
        text-align: center;
        margin-bottom: 7px;
        color: #374151;
    }
    .tirage-modal-text {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
        line-height: 1.5;
        font-weight: 500;
        white-space: pre-line;
    }
    .tirage-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
    }
    .tirage-modal-btn {
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
    .tirage-modal-btn:active { transform: scale(0.96); }
    .tirage-modal-cancel { background: #f3f4f6; color: #6b7280; }
    .tirage-modal-cancel:hover { background: #e5e7eb; }

    /* ── Popup aide (style monnaie) ── */
    .tirage-help-popup {
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
    .tirage-help-popup.show { display: block; }
    .tirage-help-popup h4 {
        margin: 0 0 8px;
        font-size: 12px;
        color: #374151;
        font-weight: 800;
    }
    `;

    if (!document.getElementById('tirage-widget-style')) {
        const s = document.createElement('style');
        s.id = 'tirage-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // Injecter le CSS des boutons wf si pas déjà fait (normalement par widget-monnaie)
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
    const TIRAGE_LEVEL_COLORS = {
        'CP': '#ec4899', 'CE1': '#3b82f6', 'CE2': '#eab308',
        'CM1': '#ef4444', 'CM2': '#22c55e', 'AUTRE': '#a855f7'
    };
    const TIRAGE_LEVEL_ORDER = ['CP','CE1','CE2','CM1','CM2','AUTRE'];
    const TIRAGE_THEME       = '#4a90e2';
    const DRAW_ITERATIONS    = 15;
    const DRAW_INTERVAL      = 70;

    // ── HTML interne partagé (création + restauration) ────────────────────
    function tirageInnerHTML() {
        return `
        <div class="tirage-inner">
            <div class="tirage-header">
                <div class="tirage-header-title">🎲 Tirage au Sort</div>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="tirage-help-btn-wf" title="Aide" onmousedown="event.stopPropagation()" style="width:22px;height:22px;border-radius:50%;border:1px solid #bbb;background:#f5f5f5;color:#666;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;font-family:inherit;">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"      onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"  onmousedown="event.stopPropagation()"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"       onmousedown="event.stopPropagation()"></button>
                </div>
            </div>
            <div class="tirage-help-popup">
                <h4>💡 Comment ça marche</h4>
                <p>• Importez une liste d'élèves (.txt ou .csv)<br>
                Format : <em>Prénom;NOM;sexe;NIVEAU;date</em><br><br>
                • Cliquez sur un prénom pour l'exclure (absent).<br>
                • Cliquez à nouveau pour le remettre.<br>
                • Le tirage se fait parmi les élèves restants du niveau affiché.</p>
            </div>
            <div class="tirage-import-zone">
                <button class="tirage-import-btn">📄 Importer une liste d'élèves</button>
                <input type="file" class="tirage-file-input" accept=".txt,.csv" style="display:none;">
                <div class="tirage-status">Format : Prénom;NOM;sexe;NIVEAU;date</div>
            </div>
            <div class="tirage-level-tabs"></div>
            <div class="tirage-body" style="display:none;"></div>
            <div class="tirage-result-card" style="display:none;">
                <div class="tirage-result-display" style="color:#4a90e2;">PRÊT</div>
                <button class="tirage-draw-btn" disabled>🎲 Tirer un prénom</button>
                <div class="tirage-stats">--</div>
            </div>
            <div class="tirage-footer" style="display:none;">
                <button class="tirage-reset-btn">⚠️ RàZ du tirage</button>
            </div>
            <div class="tirage-modal-overlay">
                <div class="tirage-modal-box">
                    <div class="tirage-modal-title">Confirmation</div>
                    <p class="tirage-modal-text"></p>
                    <div class="tirage-modal-btns">
                        <button class="tirage-modal-btn tirage-modal-cancel">Annuler</button>
                        <button class="tirage-modal-btn tirage-modal-confirm" style="background:#4a90e2;color:#fff;">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initTirageWidget = function (widget) {

        const outer = widget.querySelector('.tirage-outer');

        // Bloquer la remontée mousedown depuis l'intérieur (sinon le drag se déclenche)
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // ── Header draggable (une seule fois) ─────────────────────────────
        const tirageHeader = widget.querySelector('.tirage-header');
        if (tirageHeader && !tirageHeader._dragInit) {
            tirageHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            tirageHeader.addEventListener('mousedown',  onHeaderDown);
            tirageHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const importZone      = widget.querySelector('.tirage-import-zone');
        const importBtn       = widget.querySelector('.tirage-import-btn');
        const fileInput       = widget.querySelector('.tirage-file-input');
        const statusEl        = widget.querySelector('.tirage-status');
        const levelTabs       = widget.querySelector('.tirage-level-tabs');
        const body            = widget.querySelector('.tirage-body');
        const resultCard      = widget.querySelector('.tirage-result-card');
        const resultDisplay   = widget.querySelector('.tirage-result-display');
        const drawBtn         = widget.querySelector('.tirage-draw-btn');
        const statsEl         = widget.querySelector('.tirage-stats');
        const footer          = widget.querySelector('.tirage-footer');
        const resetBtn        = widget.querySelector('.tirage-reset-btn');
        const modalOverlay    = widget.querySelector('.tirage-modal-overlay');
        const helpBtn         = widget.querySelector('.tirage-help-btn-wf');
        const helpPopup       = widget.querySelector('.tirage-help-popup');

        // ── Boutons fenêtre wf-btns ───────────────────────────────────────
        const wfMin   = widget.querySelector('[data-role="wf-min"]');
        const wfMax   = widget.querySelector('[data-role="wf-max"]');
        const wfClose = widget.querySelector('[data-role="wf-close"]');
        let _isMax = false;

        function tirageCollapse() {
            const savedW = outer.offsetWidth  || parseFloat(widget.dataset.tirageW) || 600;
            const savedH = outer.offsetHeight || parseFloat(widget.dataset.tirageH) || 700;
            widget.dataset.tirageW = savedW;
            widget.dataset.tirageH = savedH;

            // Sauvegarder la position ORIGINALE avant de déplacer le widget
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.tirageSavedLeft = widget.offsetLeft;
            widget.dataset.tirageSavedTop  = widget.offsetTop;
            // Aussi sauvegarder les % pour que buildBoardState les retrouve
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
            miniBar.className = 'tirage-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';

            const labelEl = document.createElement('span');
            labelEl.textContent = '🎲 Tirage au Sort';
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';

            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); tirageExpand(); });

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

        function tirageExpand() {
            const savedW    = parseFloat(widget.dataset.tirageW)    || 600;
            const savedH    = parseFloat(widget.dataset.tirageH)    || 700;
            const savedLeft = parseFloat(widget.dataset.tirageSavedLeft);
            const savedTop  = parseFloat(widget.dataset.tirageSavedTop);

            // Supprimer la mini-barre
            widget.querySelectorAll('.tirage-mini-bar').forEach(el => el.remove());

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
            outer.innerHTML = tirageInnerHTML();
            initTirageWidget(widget);

            // Mettre à jour les % de position
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW)  * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;

            if (typeof saveBoard === 'function') saveBoard();
        }

        // Exposer expand sur le widget pour que la mini-barre de restauration puisse l'appeler
        widget._tirageExpand = tirageExpand;

        if (wfMin) {
            wfMin.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            wfMin.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            wfMin.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); tirageCollapse(); });
        }
        if (wfMax) {
            wfMax.addEventListener('click', (e) => {
                e.stopPropagation();
                _isMax = !_isMax;
                const inner = widget.querySelector('.tirage-inner');
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
        let allStudents  = [];
        let remaining    = [];
        let isDrawing    = false;
        let currentLevel = 'tous';

        // Restaurer depuis dataset si données présentes (priorité board JSON)
        // Sinon, chercher dans localStorage (liste permanente)
        if (widget.dataset.tirageStudents) {
            try {
                allStudents = JSON.parse(widget.dataset.tirageStudents);
                remaining   = JSON.parse(widget.dataset.tirageRemaining || '[]').map(Number);
                if (!remaining.length && allStudents.length)
                    remaining = allStudents.map(s => Number(s.id));
                showLoadedState();
            } catch(e) { console.warn('tirage: erreur restauration dataset', e); }
        } else {
            // Charger la liste depuis localStorage si disponible
            try {
                const saved = localStorage.getItem('tirage_students_list');
                if (saved) {
                    allStudents = JSON.parse(saved);
                    remaining   = allStudents.map(s => s.id); // toujours full au premier chargement
                    setStatus('✓ ' + allStudents.length + ' élève(s) (liste mémorisée)', 'ok');
                    showLoadedState();
                }
            } catch(e) {}
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
                    niveau: (parts[3] || 'AUTRE').trim().toUpperCase(),
                    dob:    parts[4] || ''
                });
            });
            if (!students.length) { setStatus('Aucun élève trouvé.', 'err'); return; }
            allStudents = students;
            remaining   = students.map(s => s.id);
            setStatus('✓ ' + students.length + ' élève(s) chargé(s)', 'ok');
            persistData();
            showLoadedState();
        }

        function showLoadedState() {
            importZone.style.display  = 'none';
            body.style.display        = 'flex';
            resultCard.style.display  = 'flex';
            footer.style.display      = 'block';
            drawBtn.disabled          = false;
            buildLevelTabs();
            renderList();
        }

        function setStatus(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className   = 'tirage-status' + (cls ? ' ' + cls : '');
        }

        function normalizeRemaining() {
            remaining = [...new Set(remaining.map(Number))];
        }

        function persistData() {
            normalizeRemaining();
            widget.dataset.tirageStudents  = JSON.stringify(allStudents);
            widget.dataset.tirageRemaining = JSON.stringify(remaining);
            if (allStudents.length) {
                try { localStorage.setItem('tirage_students_list', JSON.stringify(allStudents)); } catch(e) {}
            }
            // NE PAS appeler saveBoard() ici — cela déclencherait restoreBoardFromJSON
            // qui rappellerait initTirageWidget et écraserait remaining en mémoire
        }

        // ── Onglets niveau ────────────────────────────────────────────────
        function buildLevelTabs() {
            const niveaux = [...new Set(allStudents.map(s => s.niveau))].sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );
            levelTabs.innerHTML = '';
            levelTabs.style.display = 'flex';

            // Bouton "Changer de classe" toujours présent dans la barre
            const changeBtn = document.createElement('button');
            changeBtn.className = 'tirage-level-tab tirage-change-class-btn';
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
            tab.className    = 'tirage-level-tab';
            tab.textContent  = label;
            tab.dataset.level = value;
            tab.addEventListener('click', () => { currentLevel = value; setActiveTab(value); renderList(); });
            return tab;
        }

        function setActiveTab(value) {
            levelTabs.querySelectorAll('.tirage-level-tab').forEach(t => {
                const isActive = t.dataset.level === value;
                const color    = t.dataset.level === 'tous' ? TIRAGE_THEME : getLevelColor(t.dataset.level);
                t.style.backgroundColor = isActive ? color  : '#f0f0f0';
                t.style.borderColor     = isActive ? color  : '#e0e0e0';
                t.style.color           = isActive ? '#fff' : '#999';
            });
        }

        function getLevelColor(niv) { return TIRAGE_LEVEL_COLORS[niv] || '#a855f7'; }

        // ── Rendu grille ──────────────────────────────────────────────────
        function getFiltered() {
            return currentLevel === 'tous' ? allStudents : allStudents.filter(s => s.niveau === currentLevel);
        }

        function hasDupPrenom(p) {
            return allStudents.filter(s => s.prenom.toLowerCase() === p.toLowerCase()).length > 1;
        }

        function displayName(s) {
            return hasDupPrenom(s.prenom) ? s.prenom + ' ' + s.nom.charAt(0) + '.' : s.prenom;
        }

        function renderList() {
            body.innerHTML = '';
            const students = getFiltered();
            const groups   = {};
            students.forEach(s => { if (!groups[s.niveau]) groups[s.niveau] = []; groups[s.niveau].push(s); });

            const sortedLevels = Object.keys(groups).sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );

            sortedLevels.forEach(niv => {
                const block = document.createElement('div');
                if (sortedLevels.length > 1) {
                    const lbl = document.createElement('div');
                    lbl.className = 'tirage-level-label';
                    lbl.style.color = getLevelColor(niv);
                    lbl.textContent = niv;
                    block.appendChild(lbl);
                }
                const grid = document.createElement('div');
                grid.className = 'tirage-grid';
                groups[niv].sort((a, b) => a.prenom.localeCompare(b.prenom)).forEach(s => {
                    const pill = document.createElement('div');
                    pill.className = 'tirage-pill';
                    const isDrawn = !remaining.includes(Number(s.id));
                    pill.classList.add(isDrawn ? 'drawn' : (s.sexe.toLowerCase().startsWith('f') ? 'girl' : 'boy'));
                    pill.textContent = displayName(s);
                    pill.title       = s.prenom + ' ' + s.nom + (isDrawn ? ' (tiré)' : '');
                    pill.addEventListener('click', () => toggleStudent(s.id));
                    grid.appendChild(pill);
                });
                block.appendChild(grid);
                body.appendChild(block);
            });
            updateStats();
        }

        function updateStats() {
            const filtered = getFiltered();
            const remFilt  = filtered.filter(s => remaining.includes(Number(s.id))).length;
            statsEl.textContent = remFilt + ' restant' + (remFilt > 1 ? 's' : '') + ' / ' + filtered.length;
            const hasRem = remaining.length > 0;
            drawBtn.disabled    = !hasRem || isDrawing;
            drawBtn.textContent = hasRem ? '🎲 Tirer un prénom' : 'Session terminée';
        }

        function toggleStudent(id) {
            id = Number(id);
            if (remaining.includes(id)) remaining = remaining.filter(r => Number(r) !== id);
            else remaining = [...new Set([...remaining.map(Number), id])];
            persistData();
            renderList();
        }

        // ── Tirage ────────────────────────────────────────────────────────
        drawBtn.addEventListener('click', drawName);

        function drawName() {
            const pool = getFiltered().map(s => Number(s.id)).filter(id => remaining.includes(id));
            if (!pool.length || isDrawing) return;
            isDrawing = true;
            drawBtn.disabled = true;
            resultDisplay.style.color     = '#ccc';
            resultDisplay.style.transform = 'scale(0.95)';

            const winnerId = Number(pool[Math.floor(Math.random() * pool.length)]);
            const winner   = allStudents.find(s => Number(s.id) === winnerId);

            const STEP_MS   = 70;
            const NB_STEPS  = 14;
            let step = 0;
            // Rotation sur TOUT le pool (y compris le gagnant) pour un défilement fluide
            let rotIdx = Math.floor(Math.random() * pool.length);

            function nextStep() {
                if (step < NB_STEPS) {
                    const tempId = pool[rotIdx % pool.length];
                    rotIdx++;
                    resultDisplay.textContent = displayName(allStudents.find(s => s.id === tempId));
                    step++;
                    setTimeout(nextStep, STEP_MS);
                } else {
                    remaining = remaining.filter(r => Number(r) !== winnerId);
                    resultDisplay.textContent     = displayName(winner);
                    resultDisplay.style.color     = TIRAGE_THEME;
                    resultDisplay.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        resultDisplay.style.transform = 'scale(1)';
                        isDrawing = false;
                        persistData();
                        renderList();
                    }, 250);
                }
            }

            nextStep();
        }

        // ── RàZ ───────────────────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            showConfirm('Remettre à zéro ?', 'Tous les élèves seront à nouveau disponibles.', () => {
                remaining = allStudents.map(s => s.id);
                resultDisplay.textContent = 'PRÊT';
                resultDisplay.style.color = TIRAGE_THEME;
                persistData();
                renderList();
            });
        });

        // ── Modal ─────────────────────────────────────────────────────────
        function showConfirm(title, text, onConfirm, confirmLabel) {
            modalOverlay.querySelector('.tirage-modal-title').textContent = title;
            modalOverlay.querySelector('.tirage-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.tirage-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.tirage-modal-confirm');
            confirmBtn.textContent = confirmLabel || 'Confirmer';
            if (onConfirm) {
                cancelBtn.style.display = '';
                confirmBtn.onclick = () => { closeModal(); onConfirm(); };
            } else {
                cancelBtn.style.display = 'none';
                confirmBtn.onclick = closeModal;
            }
            modalOverlay.classList.add('open');
        }
        function closeModal() { modalOverlay.classList.remove('open'); }
        modalOverlay.querySelector('.tirage-modal-cancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        // ── Mise à l'échelle des pills selon la largeur du widget ─────────
        function updatePillScale() {
            const w = outer.offsetWidth || 380;
            // On interpole la font-size et le padding entre 280px et 700px
            const minW = 280, maxW = 700;
            const t = Math.max(0, Math.min(1, (w - minW) / (maxW - minW)));
            const fs  = (9  + t * 9).toFixed(1)  + 'px'; // 9px → 18px
            const pad = (4  + t * 6).toFixed(1)  + 'px'; // 4px → 10px
            const gap = (4  + t * 6).toFixed(1)  + 'px'; // 4px → 10px
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
                const minW = 280, minH = 200;

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
                // Ne pas écraser les dimensions sauvegardées si le widget est réduit
                if (outer.dataset.collapsed !== '1') {
                    if (outer.offsetWidth  > 0) widget.dataset.tirageW = outer.offsetWidth;
                    if (outer.offsetHeight > 0) widget.dataset.tirageH = outer.offsetHeight;
                }
                updatePillScale();
            });
            ro.observe(outer);
            updatePillScale(); // appel initial
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createTirageWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'tirage';
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
            <div class="tirage-outer">${tirageInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initTirageWidget(widget);
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
            document.querySelectorAll('.widget[data-type="tirage"]').forEach(widget => {
                const outer     = widget.querySelector('.tirage-outer');
                const collapsed = widget.dataset.collapsed === '1';
                if (!outer) return;

                // Quand réduit, leftPercent/topPercent dans le dataset = position d'ORIGINE (sauvée avant collapse)
                // save-load.js les a recalculés sur la mini-barre → on les corrige ici
                if (collapsed) {
                    const origLeft = parseFloat(widget.dataset.tirageSavedLeft);
                    const origTop  = parseFloat(widget.dataset.tirageSavedTop);
                    if (!isNaN(origLeft)) widget.dataset.leftPercent = (origLeft / curW)  * 100;
                    if (!isNaN(origTop))  widget.dataset.topPercent  = (origTop  / curVH) * 100;
                }

                const match = (state.widgets || []).find(w => w.type === 'tirage' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 1
                );
                if (match) {
                    const w = parseFloat(widget.dataset.tirageW) || outer.offsetWidth;
                    const h = parseFloat(widget.dataset.tirageH) || outer.offsetHeight;
                    if (w > 0) match.tirageW = w;
                    if (h > 0) match.tirageH = h;
                    match.widthPercent    = 0;
                    match.contentHPercent = 0;
                    // Corriger la position dans le JSON si réduit
                    if (collapsed) {
                        match.leftPercent = parseFloat(widget.dataset.leftPercent);
                        match.topPercent  = parseFloat(widget.dataset.topPercent);
                    }
                    match.tirageCollapsed = collapsed;
                    if (widget.dataset.tirageSavedLeft) match.tirageSavedLeft = widget.dataset.tirageSavedLeft;
                    if (widget.dataset.tirageSavedTop)  match.tirageSavedTop  = widget.dataset.tirageSavedTop;
                    if (widget.dataset.tirageStudents)  match.tirageStudents  = widget.dataset.tirageStudents;
                    if (widget.dataset.tirageRemaining) match.tirageRemaining = widget.dataset.tirageRemaining;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreTirage() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                // Pré-parser : stocker les données tirage dans un tableau ordonné
                let tirageList = [];
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => { if (w.type === 'tirage') tirageList.push(w); });
                } catch(e) {}

                _orig.apply(this, arguments);

                setTimeout(() => {
                    const domWidgets = document.querySelectorAll('.widget[data-type="tirage"]');
                    domWidgets.forEach((widget, idx) => {
                        let outer = widget.querySelector('.tirage-outer');
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'tirage-outer';
                            widget.appendChild(outer);
                        }
                        if (!outer.querySelector('.tirage-inner')) {
                            outer.innerHTML = tirageInnerHTML();
                        }

                        // Correspondance par index d'ordre
                        const saved = tirageList[idx];

                        if (saved) {
                            if (saved.tirageStudents)  widget.dataset.tirageStudents  = saved.tirageStudents;
                            if (saved.tirageRemaining) widget.dataset.tirageRemaining = saved.tirageRemaining;
                            if (saved.tirageSavedLeft) widget.dataset.tirageSavedLeft = saved.tirageSavedLeft;
                            if (saved.tirageSavedTop)  widget.dataset.tirageSavedTop  = saved.tirageSavedTop;
                            const w = saved.tirageW || parseFloat(widget.dataset.tirageW);
                            const h = saved.tirageH || parseFloat(widget.dataset.tirageH);
                            if (w > 0) { outer.style.width  = w + 'px'; widget.dataset.tirageW = w; }
                            if (h > 0) { outer.style.height = h + 'px'; widget.dataset.tirageH = h; }

                            // Restaurer position d'origine si le widget était réduit
                            if (saved.tirageCollapsed) {
                                const origLeft = parseFloat(saved.tirageSavedLeft);
                                const origTop  = parseFloat(saved.tirageSavedTop);
                                if (!isNaN(origLeft)) widget.style.left = origLeft + 'px';
                                if (!isNaN(origTop))  widget.style.top  = origTop  + 'px';
                            }
                        }

                        initTirageWidget(widget);

                        // Appliquer l'état réduit APRÈS init (qui remet outer visible)
                        if (saved && saved.tirageCollapsed) {
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
                            if (!widget.querySelector('.tirage-mini-bar')) {
                                const miniBar = document.createElement('div');
                                miniBar.className = 'tirage-mini-bar';
                                miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
                                const labelEl = document.createElement('span');
                                labelEl.textContent = '🎲 Tirage au Sort';
                                labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
                                const expandBtn = document.createElement('button');
                                expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
                                expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;z-index:2;position:relative;';
                                expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
                                expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
                                expandBtn.addEventListener('click', e => {
                                    e.stopPropagation(); e.preventDefault();
                                    if (typeof widget._tirageExpand === 'function') widget._tirageExpand();
                                });
                                miniBar.appendChild(labelEl);
                                miniBar.appendChild(expandBtn);
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
    // HOOK createWidget — intercepter type 'tirage'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'tirage') return window.createTirageWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
