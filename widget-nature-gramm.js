// =========================================================================
// WIDGET NATURE GRAMMATICALE — Le Bureau du Prof
// Fichier autonome : injecte son propre <template> dans le DOM
// et initialise les widgets de type 'nature-gramm'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-nature-gramm.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Widgets) :
//      <div class="mm-sub-item" onclick="createWidget('nature-gramm');closeMainMenu()">
//          <span class="mm-ico">🏷️</span>Nature grammaticale
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

    if (!document.getElementById('widget-nature-gramm-style')) {
        const s = document.createElement('style');
        s.id = 'widget-nature-gramm-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="nature-gramm"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .ng-container {
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
            width: 800px;
            min-width: 400px;
            min-height: 300px;
        }

        /* ── État plein écran ── */
        .ng-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── En-tête ── */
        .ng-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .ng-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Bouton paramètres ── */
        .ng-params-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 13px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content:center; flex-shrink: 0;
            transition: background .15s;
        }
        .ng-params-btn:hover { background: #e0e0e0; color: #333; }
        .ng-params-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Bouton aide ── */
        .ng-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .ng-help-btn:hover { background: #e0e0e0; color: #333; }

        /* ── Popup aide ── */
        .ng-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .ng-help-popup.show { display: block; }
        .ng-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .ng-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .ng-params-panel.show { display: flex; }
        .ng-params-title {
            font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 2px;
        }
        .ng-params-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .ng-nature-check {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid transparent;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all .15s;
            user-select: none;
        }
        .ng-nature-check input[type=checkbox] { display: none; }
        .ng-nature-check.checked { border-color: currentColor; }

        /* couleurs par nature */
        .ng-nature-check[data-nature="det"]   { background: #e0f0ff; color: #1565c0; }
        .ng-nature-check[data-nature="nom"]   { background: #e8f5e9; color: #2e7d32; }
        .ng-nature-check[data-nature="adj"]   { background: #fff3e0; color: #e65100; }
        .ng-nature-check[data-nature="verbe"] { background: #fce4ec; color: #880e4f; }
        .ng-nature-check[data-nature="pron"]  { background: #f3e5f5; color: #6a1b9a; }
        .ng-nature-check[data-nature="inv"]   { background: #e0f2f1; color: #00695c; }

        .ng-nature-check:not(.checked) { opacity: 0.45; }
        .ng-nature-check:hover { opacity: 1; }

        .ng-params-input-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ng-params-input-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .ng-params-input-row input[type=text] {
            flex: 1; padding: 5px 10px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; transition: border-color .15s;
        }
        .ng-params-input-row input[type=text]:focus { border-color: #4a90e2; }
        .ng-params-apply-btn {
            padding: 5px 14px; border-radius: 7px; border: none;
            background: #4a90e2; color: white; font-size: 11px;
            font-weight: 700; cursor: pointer; transition: background .15s;
            white-space: nowrap;
        }
        .ng-params-apply-btn:hover { background: #357abd; }

        /* ── Zone phrase ── */
        .ng-sentence-zone {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            align-items: center;
            padding: 10px 12px;
            background: #fffbea;
            border: 1.5px solid #fde68a;
            border-radius: 10px;
            min-height: 46px;
            flex-shrink: 0;
        }
        .ng-sentence-label {
            font-size: 10px; font-weight: 700; color: #92400e;
            text-transform: uppercase; letter-spacing: 0.5px;
            width: 100%; margin-bottom: -2px;
        }

        /* Jeton mot dans la phrase */
        .ng-word-token {
            padding: 0.3em 0.75em;
            border-radius: 6px;
            font-size: var(--ng-fs, 14px);
            font-weight: 700;
            cursor: grab;
            user-select: none;
            background: white;
            border: 1.5px solid #d1d5db;
            color: #374151;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            white-space: nowrap;
            transition: opacity .25s, border-color .12s, box-shadow .12s, color .25s, background .25s;
        }
        .ng-word-token:hover { border-color: #f59e0b; box-shadow: 0 3px 8px rgba(245,158,11,0.2); }
        .ng-word-token.placed {
            opacity: 0.35;
            cursor: default;
            pointer-events: none;
            border-style: dashed;
        }
        .ng-word-token.is-dragging { opacity: 0.2; }

        /* ── Tableau des natures ── */
        .ng-table-wrap {
            flex: 1;
            overflow: auto;
            min-height: 80px;
        }
        .ng-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .ng-table th {
            padding: 6px 8px;
            font-size: 14px; font-weight: 800;
            text-align: center;
            border-radius: 6px 6px 0 0;
            position: sticky; top: 0; z-index: 2;
        }
        .ng-table td {
            vertical-align: top;
            padding: 6px 6px;
            border: 1.5px solid #e5e7eb;
            min-height: 200px;
        }
        .ng-col-det   th { background: #e0f0ff; color: #1565c0; border-bottom: 2px solid #90caf9; }
        .ng-col-nom   th { background: #e8f5e9; color: #2e7d32; border-bottom: 2px solid #a5d6a7; }
        .ng-col-adj   th { background: #fff3e0; color: #e65100; border-bottom: 2px solid #ffcc80; }
        .ng-col-verbe th { background: #fce4ec; color: #880e4f; border-bottom: 2px solid #f48fb1; }
        .ng-col-pron  th { background: #f3e5f5; color: #6a1b9a; border-bottom: 2px solid #ce93d8; }
        .ng-col-inv   th { background: #e0f2f1; color: #00695c; border-bottom: 2px solid #80cbc4; }

        .ng-col-det   td { background: #f5faff; }
        .ng-col-nom   td { background: #f5fbf5; }
        .ng-col-adj   td { background: #fffcf5; }
        .ng-col-verbe td { background: #fdf5f8; }
        .ng-col-pron  td { background: #fbf5ff; }
        .ng-col-inv   td { background: #f5fbfa; }

        /* td en mode drag-over */
        .ng-col-cell.drag-over {
            outline: 2px dashed #4a90e2;
            outline-offset: -2px;
            background: #e8f0fb !important;
        }

        /* ── Mot dans une colonne ── */
        .ng-placed-word {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 0.3em 0.75em;
            margin: 3px;
            border-radius: 6px;
            font-size: var(--ng-fs, 13px);
            font-weight: 700;
            cursor: grab;
            user-select: none;
            white-space: nowrap;
            border: 1.5px solid transparent;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            transition: box-shadow .12s;
        }
        .ng-placed-word:hover { box-shadow: 0 3px 8px rgba(0,0,0,0.18); }
        .ng-placed-word.is-dragging { opacity: 0.2; }

        /* Couleurs des mots placés selon colonne */
        .ng-col-det   .ng-placed-word { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
        .ng-col-nom   .ng-placed-word { background: #dcfce7; color: #166534; border-color: #86efac; }
        .ng-col-adj   .ng-placed-word { background: #ffedd5; color: #9a3412; border-color: #fdba74; }
        .ng-col-verbe .ng-placed-word { background: #fce7f3; color: #9d174d; border-color: #f9a8d4; }
        .ng-col-pron  .ng-placed-word { background: #f5d0fe; color: #6b21a8; border-color: #d8b4fe; }
        .ng-col-inv   .ng-placed-word { background: #ccfbf1; color: #0f766e; border-color: #5eead4; }

        /* Correction */
        .ng-placed-word.correct { border: 3px solid #2f8f48 !important; border-radius: 50px; }
        .ng-placed-word.wrong   { border: 5px solid #d92323 !important; border-radius: 50px; animation: ng-shake 1s infinite; }

        /* Bouton supprimer dans le mot placé */
        .ng-placed-word .ng-rm-btn {
            font-size: 10px; line-height: 1; cursor: pointer;
            color: rgba(0,0,0,0.35); transition: color .1s;
            flex-shrink: 0;
        }
        .ng-placed-word .ng-rm-btn:hover { color: rgba(0,0,0,0.7); }

        /* ── Fantôme drag ── */
        .ng-drag-ghost {
            position: fixed; pointer-events: none; z-index: 99999;
            padding: 0.3em 0.9em; border-radius: 6px; font-weight: 700;
            background: #f59e0b; color: white; border: 1.5px solid #d97706;
            box-shadow: 0 6px 18px rgba(245,158,11,0.45);
            transform: translate(-50%, -50%) rotate(2deg);
            white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Barre contrôles bas ── */
        .ng-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .ng-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .ng-btn:active { transform: scale(0.96); }
        .ng-btn-reset  { background: #6b7280; color: white; }
        .ng-btn-reset:hover { background: #4b5563; }
        .ng-btn-check  { background: #4a90e2; color: white; }
        .ng-btn-check:hover { background: #357abd; }

        .ng-result-text {
            font-size: 18px; font-weight: 800; color: #28a745;
            opacity: 0; transition: opacity .3s;
        }
        .ng-result-text.show { opacity: 1; }

        /* ── Poignée resize ── */
        .ng-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .ng-container:hover .ng-resize-handle { opacity: 1; }

        /* ── Section correction dans paramètres ── */
        .ng-correction-section {
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .ng-correction-title {
            font-size: 11px; font-weight: 700; color: #374151;
        }
        .ng-correction-hint {
            font-size: 10px; color: #9ca3af; font-style: italic;
        }
        .ng-correction-tokens {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        /* Jeton dans le panneau correction */
        .ng-corr-token {
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px; font-weight: 700;
            cursor: pointer;
            border: 1.5px solid #d1d5db;
            background: white;
            color: #374151;
            position: relative;
            transition: border-color .12s, box-shadow .12s;
            user-select: none;
        }
        .ng-corr-token:hover { border-color: #4a90e2; box-shadow: 0 2px 6px rgba(74,144,226,0.2); }
        .ng-corr-token.assigned { color: white; border-color: transparent; }
        .ng-corr-token[data-assigned="det"]   { background: #1565c0; }
        .ng-corr-token[data-assigned="nom"]   { background: #2e7d32; }
        .ng-corr-token[data-assigned="adj"]   { background: #e65100; }
        .ng-corr-token[data-assigned="verbe"] { background: #880e4f; }
        .ng-corr-token[data-assigned="pron"]  { background: #6a1b9a; }
        .ng-corr-token[data-assigned="inv"]   { background: #00695c; }

        /* Popup picker de nature */
        .ng-nature-picker {
            position: fixed;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.18);
            padding: 8px;
            display: none;
            flex-direction: column;
            gap: 4px;
            z-index: 99999;
            min-width: 180px;
        }
        .ng-nature-picker.show { display: flex; }
        .ng-nature-picker-title {
            font-size: 10px; font-weight: 700; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2px 4px;
        }
        .ng-picker-option {
            padding: 5px 10px;
            border-radius: 7px;
            font-size: 11px; font-weight: 700;
            cursor: pointer;
            border: none;
            text-align: left;
            transition: opacity .1s;
        }
        .ng-picker-option:hover { opacity: 0.85; }
        .ng-picker-option[data-nature="det"]   { background: #dbeafe; color: #1e40af; }
        .ng-picker-option[data-nature="nom"]   { background: #dcfce7; color: #166534; }
        .ng-picker-option[data-nature="adj"]   { background: #ffedd5; color: #9a3412; }
        .ng-picker-option[data-nature="verbe"] { background: #fce7f3; color: #9d174d; }
        .ng-picker-option[data-nature="pron"]  { background: #f5d0fe; color: #6b21a8; }
        .ng-picker-option[data-nature="inv"]   { background: #ccfbf1; color: #0f766e; }
        .ng-picker-option-clear { background: #f3f4f6; color: #6b7280; }

        @keyframes ng-shake {
            0%,100% { transform: translateX(0); }
            25%      { transform: translateX(-4px); }
            75%      { transform: translateX(4px); }
        }
        `;
        document.head.appendChild(s);
    }

    // ── Template HTML ──────────────────────────────────────────────────────
    const TEMPLATE_ID = 'template-nature-gramm';
    if (!document.getElementById(TEMPLATE_ID)) {
        const tpl = document.createElement('template');
        tpl.id = TEMPLATE_ID;
        tpl.innerHTML = `
<div class="ng-container">

  <!-- En-tête -->
  <div class="ng-header">
    <span class="ng-title">🏷️ Nature grammaticale</span>
    <div class="wf-btns" style="margin-left:auto">
      <button class="ng-params-btn" title="Paramètres">⚙</button>
      <button class="ng-help-btn"   title="Aide">?</button>
      <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
      <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
      <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
    </div>
  </div>

  <!-- Panneau paramètres -->
  <div class="ng-params-panel">
    <div class="ng-params-title">Natures à classer :</div>
    <div class="ng-params-grid">
      <label class="ng-nature-check checked" data-nature="det">
        <input type="checkbox" value="det" checked> Déterminants
      </label>
      <label class="ng-nature-check checked" data-nature="nom">
        <input type="checkbox" value="nom" checked> Noms
      </label>
      <label class="ng-nature-check checked" data-nature="adj">
        <input type="checkbox" value="adj" checked> Adjectifs qualificatifs
      </label>
      <label class="ng-nature-check checked" data-nature="verbe">
        <input type="checkbox" value="verbe" checked> Verbes
      </label>
      <label class="ng-nature-check checked" data-nature="pron">
        <input type="checkbox" value="pron" checked> Pronoms
      </label>
      <label class="ng-nature-check checked" data-nature="inv">
        <input type="checkbox" value="inv" checked> Mots invariables
      </label>
    </div>
    <div class="ng-params-input-row">
      <label>Phrase :</label>
      <input type="text" class="ng-phrase-input" placeholder="Saisissez votre phrase ici…" />
      <button class="ng-params-apply-btn">Valider</button>
    </div>
    <!-- Section correction -->
    <div class="ng-correction-section">
      <div class="ng-correction-title">🔑 Correction — assigner une nature à chaque mot :</div>
      <div class="ng-correction-hint">Cliquez sur un mot pour lui attribuer sa nature grammaticale.</div>
      <div class="ng-correction-tokens"></div>
    </div>
  </div>

  <!-- Popup picker de nature (positionnée en fixed) -->
  <div class="ng-nature-picker"></div>

  <!-- Zone phrase (tokens) -->
  <div class="ng-sentence-zone">
    <span class="ng-sentence-label">Phrase</span>
  </div>

  <!-- Tableau des natures -->
  <div class="ng-table-wrap">
    <table class="ng-table">
      <thead class="ng-thead"></thead>
      <tbody class="ng-tbody"></tbody>
    </table>
  </div>

  <!-- Contrôles -->
  <div class="ng-controls">
    <button class="ng-btn ng-btn-reset">🔄 Recommencer</button>
    <button class="ng-btn ng-btn-check">✔ Corriger</button>
    <span class="ng-result-text"></span>
  </div>

  <!-- Popup aide -->
  <div class="ng-help-popup">
    <h4>💡 Comment utiliser ce widget ?</h4>

    <p style="margin:0 0 8px;font-weight:700;color:#374151">⚙ Le bouton Paramètres</p>
    <p style="margin:0 0 6px"><b>Natures à classer</b> — Coche ou décoche les natures grammaticales que tu veux faire apparaître dans le tableau. Seules les colonnes cochées seront affichées.</p>
    <p style="margin:0 0 6px"><b>Phrase</b> — Saisis ta propre phrase dans le champ, puis clique sur <b>Valider</b>. Les mots apparaissent automatiquement. Les signes de ponctuation et les mots avec apostrophe (ex. <i>j'aime</i> → <i>j'</i> + <i>aime</i>) sont gérés automatiquement.</p>
    <p style="margin:0 0 10px"><b>🔑 Correction</b> — Clique sur chaque mot de la phrase pour lui attribuer sa nature grammaticale. Ces informations serviront à corriger automatiquement le travail de l'élève. Si aucune nature n'est attribuée, le widget vérifie simplement que tous les mots sont placés.</p>

    <p style="margin:0 0 8px;font-weight:700;color:#374151">🎮 Comment jouer ?</p>
    <p style="margin:0 0 6px">Glisse chaque mot de la phrase dans la colonne qui correspond à sa nature grammaticale. Tu peux déplacer un mot d'une colonne à une autre, ou cliquer sur <b>✕</b> pour le remettre dans la phrase.</p>
    <p style="margin:0 0 0;font-style:italic;color:#888">Clique sur <b>✔ Corriger</b> quand tous les mots sont placés.</p>
  </div>

  <!-- Poignée resize -->
  <div class="ng-resize-handle"></div>

</div>`;
        document.body.appendChild(tpl);
    }

    // =========================================================================
    // DÉFINITIONS DES NATURES
    // =========================================================================

    const NATURE_DEFS = {
        det:   { key: 'det',   label: 'Déterminants',            short: 'Dét.',    colClass: 'ng-col-det'   },
        nom:   { key: 'nom',   label: 'Noms',                    short: 'Nom',     colClass: 'ng-col-nom'   },
        adj:   { key: 'adj',   label: 'Adjectifs qualificatifs', short: 'Adj.',    colClass: 'ng-col-adj'   },
        verbe: { key: 'verbe', label: 'Verbes',                  short: 'Verbe',   colClass: 'ng-col-verbe' },
        pron:  { key: 'pron',  label: 'Pronoms',                 short: 'Pron.',   colClass: 'ng-col-pron'  },
        inv:   { key: 'inv',   label: 'Mots invariables',        short: 'Inv.',    colClass: 'ng-col-inv'   },
    };

    const NATURE_ORDER = ['det', 'nom', 'adj', 'verbe', 'pron', 'inv'];

    // =========================================================================
    // INITIALISATION DU WIDGET
    // =========================================================================
    window.initNatureGrammWidget = function (widget) {

        const container      = widget.querySelector('.ng-container');
        const paramsBtn      = widget.querySelector('.ng-params-btn');
        const paramsPanel    = widget.querySelector('.ng-params-panel');
        const phraseInput    = widget.querySelector('.ng-phrase-input');
        const applyBtn       = widget.querySelector('.ng-params-apply-btn');
        const corrTokensZone = widget.querySelector('.ng-correction-tokens');
        const naturePicker   = widget.querySelector('.ng-nature-picker');
        const sentenceZone   = widget.querySelector('.ng-sentence-zone');
        const thead          = widget.querySelector('.ng-thead');
        const tbody          = widget.querySelector('.ng-tbody');
        const resetBtn       = widget.querySelector('.ng-btn-reset');
        const checkBtn       = widget.querySelector('.ng-btn-check');
        const resultText     = widget.querySelector('.ng-result-text');
        const helpBtn        = widget.querySelector('.ng-help-btn');
        const helpPopup      = widget.querySelector('.ng-help-popup');
        const resizeHandle   = widget.querySelector('.ng-resize-handle');
        const natureChecks   = widget.querySelectorAll('.ng-nature-check');

        // ── État ──────────────────────────────────────────────────────────
        let currentPhrase  = 'Le petit chat dort sur le canapé rouge .';
        let allTokens      = []; // tous les tokens incl. ponctuation (pour affichage phrase)
        let wordTokens     = []; // uniquement les mots classables
        let activeNatures  = new Set(NATURE_ORDER);
        let columnWords    = {}; // { 'det': ['Le', ...], ... }
        let solutionMap    = {}; // { idx: 'det'|'nom'|... }  — défini par le prof
        let pickerTarget   = null; // {idx} du token en cours d'assignation

        // ── Ponctuation pure (non classable) ─────────────────────────────
        function isPunct(text) {
            return /^[.,;:!?…«»""''()\[\]{}\-–—/\\]+$/.test(text);
        }

        // ── Mots composés avec apostrophe à ne PAS découper ─────────────
        const APOSTROPHE_COMPOUNDS = new Set([
            "aujourd'hui", "presqu'île", "prud'homme", "prud'hommes",
            "quelqu'un", "quelqu'une", "quelqu'uns", "quelqu'unes",
        ]);

        // ── Tokenisation : découpe espaces + apostrophes ─────────────────
        // "j'écris" → ["j'", "écris"]   "d'être" → ["d'", "être"]
        // "aujourd'hui" → ["aujourd'hui"]  (mot composé, non découpé)
        function tokenizePhrase(phrase) {
            // Normaliser apostrophes courbes
            const normalized = phrase.trim().replace(/[\u2019\u2018]/g, "'");
            const bySpace = normalized.split(/\s+/).filter(Boolean);
            const result = [];
            bySpace.forEach(tok => {
                // Vérifier si c'est un mot composé connu (insensible à la casse)
                if (APOSTROPHE_COMPOUNDS.has(tok.toLowerCase())) {
                    result.push(tok);
                    return;
                }
                // Découpe sur apostrophe entre deux caractères alphabétiques
                const parts = tok.split(/(?<=[a-zA-ZÀ-ÿ]')(?=[a-zA-ZÀ-ÿ])/);
                parts.forEach(p => { if (p) result.push(p); });
            });
            return result;
        }

        // ── Taille de police ─────────────────────────────────────────────
        function applyFontScale() {
            const w  = container.offsetWidth || 800;
            const fs = Math.max(12, Math.min(28, Math.round(13 * w / 700)));
            container.style.setProperty('--ng-fs', fs + 'px');
        }


        // ── Helper tap stylet (pointer-safe) ────────────────────────────
        // Déclenche handler sur pointerup si le stylet/doigt n'a pas glissé (< 12px).
        // Le stopPropagation sur pointerdown suffit car widgets.js vérifie désormais
        // les classes interactives ng-* avant de lancer le drag.
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
        // ── Cases à cocher des natures ───────────────────────────────────
        natureChecks.forEach(label => {
            label.addEventListener('pointerdown', (e) => e.stopPropagation());
            label.addEventListener('click', (e) => {
                e.stopPropagation();
                const cb  = label.querySelector('input[type=checkbox]');
                const key = label.dataset.nature;
                cb.checked = !cb.checked;
                if (cb.checked) {
                    activeNatures.add(key);
                    label.classList.add('checked');
                } else {
                    activeNatures.delete(key);
                    label.classList.remove('checked');
                }
            });
        });

        // ── Panneau paramètres ───────────────────────────────────────────
        makeTap(paramsBtn, () => {
            const open = paramsPanel.classList.toggle('show');
            paramsBtn.classList.toggle('active', open);
        });

        // ── Champ phrase : empêcher le drag du widget de capturer les events ──
        phraseInput.addEventListener('pointerdown', (e) => e.stopPropagation());
        phraseInput.style.userSelect = 'text';
        phraseInput.style.pointerEvents = 'auto';

        makeTap(applyBtn, () => {
            const txt = phraseInput.value.trim();
            if (txt) {
                currentPhrase = txt;
                solutionMap = {}; // réinitialiser la correction si nouvelle phrase
            }
            renderCorrectionTokens();
            initGame();
        });

        // Empêcher que le click dans le panel ferme la popup aide
        paramsPanel.addEventListener('pointerdown', (e) => e.stopPropagation());

        // ── Picker de nature ──────────────────────────────────────────────
        function buildPicker() {
            naturePicker.innerHTML = '';
            const title = document.createElement('div');
            title.className = 'ng-nature-picker-title';
            title.textContent = 'Nature du mot';
            naturePicker.appendChild(title);

            NATURE_ORDER.forEach(k => {
                if (!activeNatures.has(k)) return;
                const btn = document.createElement('button');
                btn.className = 'ng-picker-option';
                btn.dataset.nature = k;
                btn.textContent = NATURE_DEFS[k].label;
                btn.addEventListener('pointerdown', (e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (pickerTarget !== null) {
                        solutionMap[pickerTarget] = k;
                        renderCorrectionTokens();
                    }
                    closePicker();
                });
                naturePicker.appendChild(btn);
            });

            // Option effacer
            const clearBtn = document.createElement('button');
            clearBtn.className = 'ng-picker-option ng-picker-option-clear';
            clearBtn.textContent = '✕ Effacer';
            clearBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); e.preventDefault();
                if (pickerTarget !== null) delete solutionMap[pickerTarget];
                renderCorrectionTokens();
                closePicker();
            });
            naturePicker.appendChild(clearBtn);
        }

        function openPicker(tokenEl, idx) {
            pickerTarget = idx;
            buildPicker();
            naturePicker.classList.add('show');
            // Positionner sous le token
            const rect = tokenEl.getBoundingClientRect();
            let left = rect.left;
            let top  = rect.bottom + 4;
            // Éviter de sortir de l'écran
            const pickerW = 190;
            if (left + pickerW > window.innerWidth) left = window.innerWidth - pickerW - 8;
            naturePicker.style.left = left + 'px';
            naturePicker.style.top  = top  + 'px';
        }

        function closePicker() {
            naturePicker.classList.remove('show');
            pickerTarget = null;
        }

        // Fermer picker si clic ailleurs
        document.addEventListener('pointerdown', (e) => { if (!naturePicker.contains(e.target)) closePicker(); });
        

        // ── Rendu des jetons de correction ───────────────────────────────
        function renderCorrectionTokens() {
            corrTokensZone.innerHTML = '';
            const raw = tokenizePhrase(currentPhrase);
            let wIdx = 0;
            raw.forEach((text) => {
                if (isPunct(text)) return; // ignorer la ponctuation
                const idx = wIdx++;
                const tok = document.createElement('span');
                tok.className = 'ng-corr-token';
                tok.dataset.idx = idx;
                const assigned = solutionMap[idx];
                if (assigned) {
                    tok.classList.add('assigned');
                    tok.dataset.assigned = assigned;
                    tok.textContent = text + ' (' + NATURE_DEFS[assigned].short + ')';
                } else {
                    tok.textContent = text;
                }
                makeTap(tok, () => {
                    openPicker(tok, idx);
                });
                corrTokensZone.appendChild(tok);
            });
        }

        // ── Aide ─────────────────────────────────────────────────────────
        makeTap(helpBtn, () => {
            helpPopup.classList.toggle('show');
        });
        document.addEventListener('pointerdown', (e) => { if (!helpPopup.contains(e.target) && e.target !== helpBtn) helpPopup.classList.remove('show'); });

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
                    applyFontScale();
                }
                window._wfMiniBarCollapse(widget, '🏷️ Nature grammaticale', {
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
                    container.classList.add('wf-fullboard');
                } else {
                    container.classList.remove('wf-fullboard');
                    if (_savedW) container.style.width  = _savedW;
                    if (_savedH) container.style.height = _savedH;
                }
                applyFontScale();
            });
        }
        if (wfClose) {
            makeTap(wfClose, () => {
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
                container.style.width  = Math.max(400, startW + ev.clientX - startX) + 'px';
                container.style.height = Math.max(300, startH + ev.clientY - startY) + 'px';
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

        // ── Initialisation du jeu ─────────────────────────────────────────
        function initGame() {
            resultText.textContent = '';
            resultText.classList.remove('show');

            // Reset colonnes
            columnWords = {};
            NATURE_ORDER.forEach(k => { columnWords[k] = []; });

            // Tokeniser la phrase — découpe espaces + apostrophes, exclut ponctuation pure
            const raw = tokenizePhrase(currentPhrase);
            let wIdx = 0;
            allTokens = raw.map((text, idx) => {
                const punct = isPunct(text);
                const entry = { text, idx, isPunct: punct, wordIdx: punct ? -1 : wIdx };
                if (!punct) wIdx++;
                return entry;
            });
            wordTokens = allTokens
                .filter(t => !t.isPunct)
                .map((t, i) => ({ text: t.text, idx: i, placed: false }));

            renderSentence();
            renderTable();
            applyFontScale();
        }

        // ── Rendu de la phrase ────────────────────────────────────────────
        function renderSentence() {
            const label = sentenceZone.querySelector('.ng-sentence-label');
            sentenceZone.innerHTML = '';
            if (label) sentenceZone.appendChild(label);

            allTokens.forEach((atok) => {
                if (atok.isPunct) {
                    const punct = document.createElement('span');
                    punct.textContent = atok.text;
                    punct.style.cssText = 'font-size:var(--ng-fs,14px);font-weight:700;color:#9ca3af;user-select:none;align-self:center;';
                    sentenceZone.appendChild(punct);
                    return;
                }
                const wTok = wordTokens[atok.wordIdx];
                if (!wTok) return;

                const token = document.createElement('div');
                token.className = 'ng-word-token' + (wTok.placed ? ' placed' : '');
                token.textContent = wTok.text;
                token.dataset.tokenIdx = wTok.idx;

                if (!wTok.placed) {
                    token.addEventListener('pointerdown', (e) => {
                        e.stopPropagation(); e.preventDefault();
                        startDragFromSentence(token, wTok, e.clientX, e.clientY);
                    });
                }
                sentenceZone.appendChild(token);
            });
        }

        // ── Rendu du tableau ─────────────────────────────────────────────
        function renderTable() {
            const natures = NATURE_ORDER.filter(k => activeNatures.has(k));

            // ── Thead ──
            thead.innerHTML = '';
            const tr = document.createElement('tr');
            natures.forEach(k => {
                const def = NATURE_DEFS[k];
                const th  = document.createElement('th');
                th.textContent = def.label;
                const col = document.createElement('col');
                tr.appendChild(th);
                // Colorer la colonne
                const td = document.createElement('th');
                // On utilise le colClass sur la <td> via un col-wrapper
            });
            // On construit via <col> pour la classe
            natures.forEach(k => {
                const def = NATURE_DEFS[k];
                const th  = document.createElement('th');
                th.textContent = def.label;
            });
            // Rebuild proprement
            const trHead = document.createElement('tr');
            natures.forEach(k => {
                const def  = NATURE_DEFS[k];
                const td   = document.createElement('td');
                td.style.cssText = 'padding:0; border:none;';
                const inner = document.createElement('div');
                inner.className = 'ng-col-' + k;
                const th = document.createElement('table');
                th.style.cssText = 'width:100%;border-collapse:collapse;';
                const thr = document.createElement('tr');
                const thc = document.createElement('th');
                thc.textContent = def.label;
                thc.style.padding = '7px 6px';
                thr.appendChild(thc);
                th.appendChild(thr);
                inner.appendChild(th);
                td.appendChild(inner);
                trHead.appendChild(td);
            });

            // Utilisons une approche plus simple : thead avec tr et th directement colorés
            thead.innerHTML = '';
            const headTr = document.createElement('tr');
            natures.forEach(k => {
                const def = NATURE_DEFS[k];
                const th  = document.createElement('th');
                th.textContent = def.label;
                th.className   = 'ng-col-' + k;
                th.style.cssText = 'padding:8px 6px; border:1.5px solid #e5e7eb; font-size:18px; font-weight:800; text-align:center;';
                // Couleurs inline selon nature
                const colors = {
                    det:   { bg:'#e0f0ff', color:'#1565c0', border:'#90caf9' },
                    nom:   { bg:'#e8f5e9', color:'#2e7d32', border:'#a5d6a7' },
                    adj:   { bg:'#fff3e0', color:'#e65100', border:'#ffcc80' },
                    verbe: { bg:'#fce4ec', color:'#880e4f', border:'#f48fb1' },
                    pron:  { bg:'#f3e5f5', color:'#6a1b9a', border:'#ce93d8' },
                    inv:   { bg:'#e0f2f1', color:'#00695c', border:'#80cbc4' },
                };
                const c = colors[k];
                th.style.background   = c.bg;
                th.style.color        = c.color;
                th.style.borderBottom = '2.5px solid ' + c.border;
                headTr.appendChild(th);
            });
            thead.appendChild(headTr);

            // ── Tbody ──
            tbody.innerHTML = '';
            const bodyTr = document.createElement('tr');
            natures.forEach(k => {
                const td = document.createElement('td');
                td.className = 'ng-col-cell ng-col-' + k;
                td.dataset.nature = k;
                td.style.cssText = 'vertical-align:top; padding:0; border:1.5px solid #e5e7eb;';

                const cellColors = {
                    det:   '#f5faff', nom:'#f5fbf5', adj:'#fffcf5',
                    verbe: '#fdf5f8', pron:'#fbf5ff', inv:'#f5fbfa',
                };
                td.style.background = cellColors[k];

                // Div interne : c'est lui qui reçoit les mots et impose la hauteur min
                const inner = document.createElement('div');
                inner.style.cssText = 'min-height:200px; padding:6px; box-sizing:border-box; display:flex; flex-wrap:wrap; align-content:flex-start; gap:4px;';

                // Mots déjà placés dans cette colonne
                (columnWords[k] || []).forEach(wordText => {
                    inner.appendChild(makePlacedWord(wordText, k));
                });

                td.appendChild(inner);

                // Drag-over highlight — cibler le td
                td.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    td.classList.add('drag-over');
                });
                td.addEventListener('dragleave', () => td.classList.remove('drag-over'));

                bodyTr.appendChild(td);
            });
            tbody.appendChild(bodyTr);
        }

        // ── Créer un mot placé dans le tableau ───────────────────────────
        function makePlacedWord(wordText, nature) {
            const span = document.createElement('span');
            span.className = 'ng-placed-word ng-col-' + nature;
            span.dataset.word   = wordText;
            span.dataset.nature = nature;

            const textNode = document.createElement('span');
            textNode.textContent = wordText;

            const rmBtn = document.createElement('span');
            rmBtn.className = 'ng-rm-btn';
            rmBtn.textContent = '✕';
            rmBtn.title = 'Remettre dans la phrase';
            makeTap(rmBtn, () => {
                removeFromColumn(wordText, nature);
            });

            span.appendChild(textNode);
            span.appendChild(rmBtn);

            // Drag depuis la colonne vers une autre colonne
            span.addEventListener('pointerdown', (e) => {
                if (e.target === rmBtn) return;
                e.stopPropagation(); e.preventDefault();
                startDragFromColumn(span, wordText, nature, e.clientX, e.clientY);
            });

            return span;
        }

        // ── Retirer un mot d'une colonne → retour dans la phrase ─────────
        function removeFromColumn(wordText, nature) {
            // Retirer de columnWords
            columnWords[nature] = columnWords[nature].filter(w => w !== wordText);

            // Trouver le token dans wordTokens et le remettre disponible
            // On cherche le DERNIER token placé avec ce texte (en cas de doublons)
            const tok = wordTokens.slice().reverse().find(t => t.text === wordText && t.placed);
            if (tok) tok.placed = false;

            resultText.textContent = ''; resultText.classList.remove('show');
            renderSentence();
            renderTable();
        }

        // ── Drag depuis la phrase vers une colonne ───────────────────────
        function startDragFromSentence(tokenEl, tok, startX, startY) {
            const ghost = createGhost(tok.text, startX, startY);

            tokenEl.classList.add('is-dragging');

            function onMove(e) {
                const cx = e.clientX;
                const cy = e.clientY;
                ghost.style.left = cx + 'px'; ghost.style.top = cy + 'px';
                clearCellHighlights();
                const el   = document.elementFromPoint(cx, cy);
                const cell = el && el.closest('.ng-col-cell');
                if (cell) cell.classList.add('drag-over');
            }

            function onUp(e) {
                cleanup(e);
                ghost.remove();
                tokenEl.classList.remove('is-dragging');
                clearCellHighlights();

                const cx = e.clientX;
                const cy = e.clientY;
                const el   = document.elementFromPoint(cx, cy);
                const cell = el && el.closest('.ng-col-cell');

                if (cell && activeNatures.has(cell.dataset.nature)) {
                    const nat = cell.dataset.nature;
                    tok.placed = true;
                    columnWords[nat].push(tok.text);
                    resultText.textContent = ''; resultText.classList.remove('show');
                    renderSentence();
                    renderTable();
                }
            }

            function cleanup(e) {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup',   onUp);
            }

            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup',   onUp);
        }

        // ── Drag depuis une colonne vers une autre colonne ───────────────
        function startDragFromColumn(placedEl, wordText, srcNature, startX, startY) {
            const ghost = createGhost(wordText, startX, startY);
            placedEl.classList.add('is-dragging');

            function onMove(e) {
                const cx = e.clientX;
                const cy = e.clientY;
                ghost.style.left = cx + 'px'; ghost.style.top = cy + 'px';
                clearCellHighlights();
                const el   = document.elementFromPoint(cx, cy);
                const cell = el && el.closest('.ng-col-cell');
                if (cell) cell.classList.add('drag-over');
            }

            function onUp(e) {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup',   onUp);
                ghost.remove();
                placedEl.classList.remove('is-dragging');
                clearCellHighlights();

                const cx = e.clientX;
                const cy = e.clientY;
                const el   = document.elementFromPoint(cx, cy);
                const cell = el && el.closest('.ng-col-cell');

                if (cell && activeNatures.has(cell.dataset.nature)) {
                    const destNat = cell.dataset.nature;
                    if (destNat !== srcNature) {
                        // Déplacer vers nouvelle colonne
                        columnWords[srcNature] = columnWords[srcNature].filter(w => w !== wordText);
                        columnWords[destNat].push(wordText);
                        // Remettre drapeau placed (il était déjà true)
                        resultText.textContent = ''; resultText.classList.remove('show');
                        renderTable();
                    }
                } else if (!cell) {
                    // Relâché hors tableau → retour phrase
                    removeFromColumn(wordText, srcNature);
                }
            }

            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup',   onUp);
        }

        // ── Utilitaires drag ─────────────────────────────────────────────
        function createGhost(text, x, y) {
            const ghost = document.createElement('div');
            ghost.className = 'ng-drag-ghost';
            ghost.textContent = text;
            const fs = getComputedStyle(container).getPropertyValue('--ng-fs').trim() || '13px';
            ghost.style.fontSize = fs;
            ghost.style.left = x + 'px'; ghost.style.top = y + 'px';
            document.body.appendChild(ghost);
            return ghost;
        }

        function clearCellHighlights() {
            widget.querySelectorAll('.ng-col-cell.drag-over').forEach(c => c.classList.remove('drag-over'));
        }

        // ── Correction ───────────────────────────────────────────────────
        makeTap(checkBtn, () => {
            // Vérifie que tous les mots classables sont placés.
            // Un mot est "non classable" si le prof lui a assigné une nature désactivée,
            // ou s'il n'a pas de nature assignée du tout (solutionMap partiel).
            const hasSolution = Object.keys(solutionMap).length > 0;
            const classifiableTokens = wordTokens.filter(t => {
                if (!hasSolution) return true; // sans solutionMap : tous les mots doivent être placés
                const expectedNat = solutionMap[t.idx];
                if (!expectedNat) return false; // pas de nature assignée : on ne force pas le placement
                if (!activeNatures.has(expectedNat)) return false; // nature désactivée : non classable
                return true;
            });
            const nbPlaced = classifiableTokens.filter(t => t.placed).length;
            if (nbPlaced < classifiableTokens.length) {
                resultText.textContent = '⚠️ Place tous les mots !';
                resultText.style.color = '#e67e22';
                resultText.classList.add('show');
                return;
            }

            // Vérifie que le prof a défini une solution
            if (!hasSolution) {
                // Pas de solution définie : validation simple (tous placés = OK)
                resultText.textContent = '✅ Tous les mots sont classés !';
                resultText.style.color = '#28a745';
                resultText.classList.add('show');
                widget.querySelectorAll('.ng-placed-word').forEach(el => {
                    el.classList.remove('wrong'); el.classList.add('correct');
                });
                return;
            }

            // Correction mot par mot grâce à solutionMap
            // Pour chaque token, on vérifie que la nature dans laquelle il est placé
            // correspond à solutionMap[idx].
            // On ignore les tokens dont la nature attendue est dans une colonne désactivée.
            // On construit un index inversé : wordText → liste d'idx attendus dans chaque nature
            // (gère les mots en double dans la phrase)

            // Construire un mapping : pour chaque (nature, wordText) → liste des idx attendus
            const expectedInNature = {}; // expectedInNature[nat][text] = [idx, idx, ...]
            NATURE_ORDER.forEach(k => { expectedInNature[k] = {}; });
            wordTokens.forEach(tok => {
                const expectedNat = solutionMap[tok.idx];
                if (!expectedNat) return;
                // Ignorer les tokens dont la nature attendue est désactivée
                if (!activeNatures.has(expectedNat)) return;
                if (!expectedInNature[expectedNat][tok.text]) expectedInNature[expectedNat][tok.text] = [];
                expectedInNature[expectedNat][tok.text].push(tok.idx);
            });

            // Pour chaque mot placé dans une colonne, vérifier
            let nbCorrect = 0, nbWrong = 0;
            // On parcourt les colonnes et leurs mots
            // columnWords[nat] = [text, text, ...] dans l'ordre où ils ont été ajoutés
            // Pour la correction, on consomme les idx attendus un par un (pour les doublons)
            const consumed = {}; // consumed[nat][text] = compteur

            widget.querySelectorAll('.ng-placed-word').forEach(el => {
                el.classList.remove('correct', 'wrong');
            });

            NATURE_ORDER.filter(k => activeNatures.has(k)).forEach(nat => {
                if (!consumed[nat]) consumed[nat] = {};
                (columnWords[nat] || []).forEach(wordText => {
                    if (!consumed[nat][wordText]) consumed[nat][wordText] = 0;
                    const expectedList = (expectedInNature[nat][wordText] || []);
                    const isCorrect = consumed[nat][wordText] < expectedList.length;
                    consumed[nat][wordText]++;

                    // Trouver l'élément DOM correspondant dans cette colonne
                    const cells = widget.querySelectorAll('.ng-col-cell[data-nature="' + nat + '"] .ng-placed-word');
                    // On applique correct/wrong dans l'ordre des mots de la colonne
                    // (le même mot peut apparaître plusieurs fois)
                    let found = false;
                    cells.forEach(el => {
                        if (found) return;
                        const elText = el.querySelector('span:first-child') ? el.querySelector('span:first-child').textContent : el.textContent.replace('✕','').trim();
                        if (elText === wordText && !el.classList.contains('correct') && !el.classList.contains('wrong')) {
                            el.classList.add(isCorrect ? 'correct' : 'wrong');
                            found = true;
                            if (isCorrect) nbCorrect++; else nbWrong++;
                        }
                    });
                });
            });

            if (nbWrong === 0) {
                resultText.textContent = '✅ Bravo, tout est correct !';
                resultText.style.color = '#28a745';
            } else {
                resultText.textContent = `❌ ${nbCorrect} correct${nbCorrect > 1 ? 's' : ''}, ${nbWrong} erreur${nbWrong > 1 ? 's' : ''}.`;
                resultText.style.color = '#dc3545';
            }
            resultText.classList.add('show');
        });

        // ── Reset ─────────────────────────────────────────────────────────
        makeTap(resetBtn, () => {
            initGame();
        });

        // ── Init ─────────────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            // Restaurer les dimensions sauvegardées si elles existent
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            // Taille par défaut si aucune dimension sauvegardée
            if (!container.style.height) container.style.height = '600px';

            renderCorrectionTokens();
            initGame();
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
            if (type === 'nature-gramm') initNatureGrammWidget(widget);
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function (type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'nature-gramm') initNatureGrammWidget(widget);
                    return widget;
                };
            }
        });
    }

})();
