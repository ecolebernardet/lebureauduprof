// =========================================================================
// WIDGET DROITE NUMÉRIQUE — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'droite-num'.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-droite-num.js"></script>
//
//   2. Ajouter dans le panneau Activités (rubrique Mathématiques) :
//      <div class="act-card" onclick="createWidget('droite-num');toggleActivitiesPanel()">
//          ...
//      </div>
// =========================================================================

(function () {

    // ── Réutilise la mini-barre collapse partagée (définie dans widget-nature-gramm.js) ──
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

    // ── Boutons macOS (injectés une seule fois) ────────────────────────────
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

    // ── CSS du widget ──────────────────────────────────────────────────────
    if (!document.getElementById('widget-droite-num-style')) {
        const s = document.createElement('style');
        s.id = 'widget-droite-num-style';
        s.textContent = `
        /* ── Widget transparent ── */
        .widget[data-type="droite-num"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .dn-container {
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
            width: 1000px;
            min-width: 400px;
            min-height: 240px;
        }

        /* ── Plein écran board ── */
        .dn-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 52px !important;
        }

        /* ── En-tête ── */
        .dn-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .dn-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Boutons icônes ── */
        .dn-icon-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 13px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .dn-icon-btn:hover { background: #e0e0e0; color: #333; }
        .dn-icon-btn.active { background: #4a90e2; color: white; border-color: #357abd; }

        /* ── Popup aide ── */
        .dn-help-popup {
            display: none; position: absolute;
            top: 42px; right: 10px;
            background: #fff; border: 1px solid #ddd;
            border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px; width: 320px;
            font-size: 11px; color: #444; z-index: 20; line-height: 1.6;
        }
        .dn-help-popup.show { display: block; }
        .dn-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }

        /* ── Panneau paramètres ── */
        .dn-params-panel {
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 14px;
            display: none;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }
        .dn-params-panel.show { display: flex; }

        .dn-params-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        .dn-params-row label {
            font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap;
        }
        .dn-params-row input[type=number], .dn-params-row input[type=text] {
            width: 72px; padding: 4px 8px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            outline: none; transition: border-color .15s;
        }
        .dn-params-row input[type=number]:focus,
        .dn-params-row input[type=text]:focus { border-color: #4a90e2; }

        .dn-params-row select {
            padding: 4px 7px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px;
            background: white; cursor: pointer; outline: none;
        }

        /* Toggle switch mode */
        .dn-toggle-row {
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .dn-toggle-label {
            font-size: 11px; font-weight: 600; color: #374151;
        }
        .dn-toggle-group {
            display: flex; border-radius: 8px; overflow: hidden;
            border: 1px solid #d1d5db;
        }
        .dn-toggle-btn {
            padding: 4px 10px; font-size: 11px; font-weight: 600;
            cursor: pointer; border: none; background: #f3f4f6; color: #6b7280;
            transition: background .15s, color .15s;
        }
        .dn-toggle-btn.active { background: #4a90e2; color: white; }

        .dn-params-apply-btn {
            padding: 5px 14px; border-radius: 7px; border: none;
            background: #4a90e2; color: white; font-size: 11px;
            font-weight: 700; cursor: pointer; transition: background .15s;
            white-space: nowrap; align-self: flex-end;
        }
        .dn-params-apply-btn:hover { background: #357abd; }

        /* ── Zone droite numérique ── */
        .dn-line-zone {
            flex: 1;
            overflow: hidden;
            position: relative;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .dn-svg-wrap {
            width: 100%;
            height: 100%;
            position: relative;
            min-height: 120px;
        }

        .dn-svg {
            width: 100%;
            height: 100%;
            overflow: visible;
            display: block;
        }

        /* ── Jetons à placer ── */
        .dn-tokens-zone {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
            align-items: center;
            padding: 8px 10px;
            background: #fffbea;
            border: 1.5px solid #fde68a;
            border-radius: 10px;
            min-height: 42px;
            flex-shrink: 0;
        }
        .dn-tokens-label {
            font-size: 10px; font-weight: 700; color: #92400e;
            text-transform: uppercase; letter-spacing: 0.5px;
            width: 100%; margin-bottom: -2px;
        }

        .dn-token {
            padding: 0.3em 0.8em;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            cursor: grab;
            user-select: none;
            background: white;
            border: 1.5px solid #d1d5db;
            color: #374151;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            white-space: nowrap;
            transition: opacity .2s, border-color .12s, box-shadow .12s;
            touch-action: none;
        }
        .dn-token:hover { border-color: #f59e0b; box-shadow: 0 3px 8px rgba(245,158,11,0.2); }
        .dn-token.placed { opacity: 0.3; cursor: default; pointer-events: none; border-style: dashed; }
        .dn-token.is-dragging { opacity: 0.15; }

        /* Fantôme drag */
        .dn-drag-ghost {
            position: fixed; pointer-events: none; z-index: 99999;
            padding: 0.3em 0.9em; border-radius: 6px; font-weight: 700;
            background: #f59e0b; color: white; border: 1.5px solid #d97706;
            box-shadow: 0 6px 18px rgba(245,158,11,0.45);
            transform: translate(-50%, -50%) rotate(2deg);
            white-space: nowrap; font-family: 'Segoe UI', system-ui, sans-serif;
            font-size: 13px;
        }

        /* ── Barre contrôles ── */
        .dn-controls {
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
            flex-shrink: 0;
        }
        .dn-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .dn-btn:active { transform: scale(0.96); }
        .dn-btn-reset  { background: #6b7280; color: white; }
        .dn-btn-reset:hover  { background: #4b5563; }
        .dn-btn-check  { background: #4a90e2; color: white; }
        .dn-btn-check:hover  { background: #357abd; }
        .dn-btn-add    { background: #10b981; color: white; }
        .dn-btn-add:hover    { background: #059669; }

        .dn-result-text {
            font-size: 16px; font-weight: 800; color: #28a745;
            opacity: 0; transition: opacity .3s;
        }
        .dn-result-text.show { opacity: 1; }

        /* ── Poignée resize ── */
        .dn-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .dn-container:hover .dn-resize-handle { opacity: 1; }

        /* Marqueurs sur la droite */
        .dn-marker-group { cursor: pointer; }
        .dn-marker-circle {
            fill: #4a90e2; stroke: #2563eb; stroke-width: 1.5;
            transition: r .1s;
        }
        .dn-marker-circle:hover { r: 10; }
        .dn-marker-label {
            font-family: 'Segoe UI', system-ui, sans-serif;
            font-weight: 700; font-size: 13px;
            fill: #1e3a5f; text-anchor: middle;
        }
        .dn-marker-group.correct .dn-marker-circle { fill: #22c55e; stroke: #16a34a; }
        .dn-marker-group.wrong   .dn-marker-circle { fill: #ef4444; stroke: #dc2626; }

        /* Zones de dépôt sur la droite (invisibles mais larges) */
        .dn-drop-zone {
            cursor: crosshair;
        }
        .dn-drop-zone.drag-over { /* feedback visuel géré en JS */ }

        /* Zone input nombre personnalisé */
        .dn-custom-input-row {
            display: flex; align-items: center; gap: 6px;
        }
        .dn-custom-input-row input {
            width: 80px; padding: 4px 8px; border-radius: 7px;
            border: 1px solid #d1d5db; font-size: 12px; outline: none;
        }
        .dn-custom-input-row input:focus { border-color: #4a90e2; }

        @keyframes dn-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-4px); }
            40%, 80% { transform: translateX(4px); }
        }
        .dn-marker-group.wrong { animation: dn-shake 0.6s ease; }
        `;
        document.head.appendChild(s);
    }

    // =========================================================================
    // FONCTION D'INITIALISATION
    // =========================================================================
    window.initDroiteNumWidget = function(widget, savedData) {
        if (!widget) return;
        widget.dataset.type    = 'pdf';         // détection par draw.js (_attachHoverToPdfWidget)
        widget.dataset.subtype = 'droite-num';  // identifie le widget pour les autres systèmes

        // ── Vider le contenu par défaut du widget ──────────────────────────
        const wContent = widget.querySelector('.widget-content');
        if (wContent) wContent.innerHTML = '';
        else { widget.innerHTML = ''; }

        // ── Conteneur principal ────────────────────────────────────────────
        const container = document.createElement('div');
        container.className = 'dn-container';

        // ── En-tête ────────────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'dn-header';

        const title = document.createElement('span');
        title.className = 'dn-title';
        title.textContent = '📏 Droite numérique';

        const spacer = document.createElement('span');
        spacer.style.cssText = 'flex:1;';

        const paramsBtn = document.createElement('button');
        paramsBtn.className = 'dn-icon-btn';
        paramsBtn.title = 'Paramètres';
        paramsBtn.textContent = '⚙';

        const helpBtn = document.createElement('button');
        helpBtn.className = 'dn-icon-btn';
        helpBtn.title = 'Aide';
        helpBtn.textContent = '?';

        // Boutons macOS
        const wfBtns = document.createElement('div');
        wfBtns.className = 'wf-btns';
        const minBtn = document.createElement('button');
        minBtn.className = 'wf-btn wf-btn-min'; minBtn.title = 'Réduire';
        const maxBtn = document.createElement('button');
        maxBtn.className = 'wf-btn wf-btn-max'; maxBtn.title = 'Plein écran';
        const closeBtn = document.createElement('button');
        closeBtn.className = 'wf-btn wf-btn-close'; closeBtn.title = 'Fermer';
        wfBtns.appendChild(minBtn); wfBtns.appendChild(maxBtn); wfBtns.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(spacer);
        header.appendChild(paramsBtn);
        header.appendChild(helpBtn);
        header.appendChild(wfBtns);

        // ── Popup aide ─────────────────────────────────────────────────────
        const helpPopup = document.createElement('div');
        helpPopup.className = 'dn-help-popup';
        helpPopup.innerHTML = `
            <h4>📏 Comment utiliser la droite numérique ?</h4>
            <b>Mode Placement :</b> faites glisser un jeton depuis la zone jaune vers la droite numérique pour placer un nombre.<br><br>
            <b>Mode Libre :</b> cliquez directement sur la droite pour placer un point à cet endroit précis.<br><br>
            <b>Paramètres ⚙ :</b> définissez les bornes min/max, le pas des graduations, le type de nombres (entiers, décimaux, fractions), et les nombres à placer.<br><br>
            <b>Correction :</b> si des solutions sont définies, le bouton ✔ vérifie les placements (vert = correct, rouge = erreur).<br><br>
            <b>Effacer :</b> supprime tous les points placés et recommence.
        `;

        // ── Panneau paramètres ─────────────────────────────────────────────
        const paramsPanel = document.createElement('div');
        paramsPanel.className = 'dn-params-panel';

        // Ligne 1 : min, max, pas
        const row1 = document.createElement('div');
        row1.className = 'dn-params-row';

        const mkLabel = (txt) => { const l = document.createElement('label'); l.textContent = txt; return l; };
        const mkInput = (type, val, min, max, step) => {
            const i = document.createElement('input');
            i.type = type; i.value = val;
            if (min !== undefined) i.min = min;
            if (max !== undefined) i.max = max;
            if (step !== undefined) i.step = step;
            return i;
        };

        const inputMin = mkInput('number', 0);
        const inputMax = mkInput('number', 10);
        const inputPas = mkInput('number', 1, 0.01, 100, 0.01);
        inputPas.style.width = '60px';
        const inputSub = mkInput('number', 0, 0, 10, 1); // subdivisions entre graduations
        inputSub.style.width = '50px';

        row1.appendChild(mkLabel('Min :')); row1.appendChild(inputMin);
        row1.appendChild(mkLabel('Max :')); row1.appendChild(inputMax);
        row1.appendChild(mkLabel('Pas :')); row1.appendChild(inputPas);
        row1.appendChild(mkLabel('Subdivisions :')); row1.appendChild(inputSub);

        // Ligne 2 : type de nombres à afficher sur la droite
        const row2 = document.createElement('div');
        row2.className = 'dn-params-row';

        const selType = document.createElement('select');
        [['entiers','Entiers'],['decimaux','Décimaux'],['fractions','Fractions']].forEach(([v,l]) => {
            const o = document.createElement('option'); o.value = v; o.textContent = l; selType.appendChild(o);
        });

        const selFracDen = document.createElement('select');
        [2,3,4,5,6,8,10].forEach(d => {
            const o = document.createElement('option'); o.value = d; o.textContent = '/' + d; selFracDen.appendChild(o);
        });
        selFracDen.title = 'Dénominateur des fractions';
        const fracDenLabel = mkLabel('Dénominateur :');

        row2.appendChild(mkLabel('Type de nombres :')); row2.appendChild(selType);
        row2.appendChild(fracDenLabel); row2.appendChild(selFracDen);

        // Ligne 3 : nombres à placer (jetons)
        const row3 = document.createElement('div');
        row3.className = 'dn-params-row';
        const inputTokens = mkInput('text', '');
        inputTokens.style.width = '200px';
        inputTokens.placeholder = 'ex : 3, -2, 1/2, 0.5';
        inputTokens.title = 'Nombres à placer (séparés par des virgules)';
        row3.appendChild(mkLabel('Nombres à placer :')); row3.appendChild(inputTokens);

        // Ligne 4 : mode
        const row4 = document.createElement('div');
        row4.className = 'dn-toggle-row';
        row4.appendChild(mkLabel('Mode :'));
        const modeGroup = document.createElement('div');
        modeGroup.className = 'dn-toggle-group';
        const modeJeton = document.createElement('button');
        modeJeton.className = 'dn-toggle-btn active'; modeJeton.textContent = '🎯 Jetons'; modeJeton.dataset.mode = 'jetons';
        const modeLibre = document.createElement('button');
        modeLibre.className = 'dn-toggle-btn'; modeLibre.textContent = '✏️ Libre'; modeLibre.dataset.mode = 'libre';
        modeGroup.appendChild(modeJeton); modeGroup.appendChild(modeLibre);
        row4.appendChild(modeGroup);

        // Bouton Appliquer
        const applyBtn = document.createElement('button');
        applyBtn.className = 'dn-params-apply-btn';
        applyBtn.textContent = '✔ Appliquer';

        paramsPanel.appendChild(row1);
        paramsPanel.appendChild(row2);
        paramsPanel.appendChild(row3);
        paramsPanel.appendChild(row4);
        paramsPanel.appendChild(applyBtn);

        // ── Zone droite numérique (SVG) ────────────────────────────────────
        const lineZone = document.createElement('div');
        lineZone.className = 'dn-line-zone';

        const svgWrap = document.createElement('div');
        svgWrap.className = 'dn-svg-wrap';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.className = 'dn-svg';
        svgWrap.appendChild(svg);
        lineZone.appendChild(svgWrap);

        // ── Zone jetons ────────────────────────────────────────────────────
        const tokensZone = document.createElement('div');
        tokensZone.className = 'dn-tokens-zone';
        const tokensLabel = document.createElement('div');
        tokensLabel.className = 'dn-tokens-label';
        tokensLabel.textContent = 'Jetons à placer — glisse sur la droite';
        tokensZone.appendChild(tokensLabel);

        // ── Barre contrôles ────────────────────────────────────────────────
        const controls = document.createElement('div');
        controls.className = 'dn-controls';

        const checkBtn = document.createElement('button');
        checkBtn.className = 'dn-btn dn-btn-check'; checkBtn.textContent = '✔ Corriger';
        const resetBtn = document.createElement('button');
        resetBtn.className = 'dn-btn dn-btn-reset'; resetBtn.textContent = '🔄 Effacer';
        const resultText = document.createElement('span');
        resultText.className = 'dn-result-text';

        controls.appendChild(checkBtn);
        controls.appendChild(resetBtn);
        controls.appendChild(resultText);

        // ── Poignée resize ─────────────────────────────────────────────────
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'dn-resize-handle';

        // ── Assemblage ─────────────────────────────────────────────────────
        container.appendChild(header);
        container.appendChild(helpPopup);
        container.appendChild(paramsPanel);
        container.appendChild(lineZone);
        container.appendChild(tokensZone);
        container.appendChild(controls);
        container.appendChild(resizeHandle);

        if (wContent) wContent.appendChild(container);
        else widget.appendChild(container);

        // =========================================================================
        // CANVAS D'ANNOTATION DRAW.JS
        // =========================================================================
        // Faux pdf-canvas-wrap (toujours display:block) pour satisfaire _findActivePdfWidget.
        const _dnFakeWrap = document.createElement('div');
        _dnFakeWrap.className = 'pdf-canvas-wrap';
        _dnFakeWrap.style.cssText = 'display:block;position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:visible;';

        const annotCanvas = document.createElement('canvas');
        annotCanvas.className = 'pdf-annot-canvas';
        annotCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:51;touch-action:none;display:block;border-radius:16px;';

        // Overlay transparent qui capte TOUS les events quand le mode annotation est actif.
        const _dnAnnotOverlay = document.createElement('div');
        _dnAnnotOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:52;pointer-events:none;touch-action:none;cursor:inherit;';

        _dnFakeWrap.appendChild(annotCanvas);
        _dnFakeWrap.appendChild(_dnAnnotOverlay);
        // Placer dans wContent/widget, par-dessus le container.
        if (wContent) wContent.appendChild(_dnFakeWrap);
        else widget.appendChild(_dnFakeWrap);

        let _dnSyncLocked = false;  // bloque le resize canvas pendant un trait actif

        function _dnSyncAnnotCanvas() {
            if (_dnSyncLocked) return;
            const w = container.offsetWidth;
            const h = container.offsetHeight;
            if (w === 0 || h === 0) return;
            const dpr  = window.devicePixelRatio || 1;
            const newW = Math.round(w * dpr);
            const newH = Math.round(h * dpr);
            if (annotCanvas.width === newW && annotCanvas.height === newH) return;
            // Sauvegarder le contenu avant redimensionnement
            let saved = null;
            if (annotCanvas.width > 0 && annotCanvas.height > 0) {
                try { saved = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height); } catch(e) {}
            }
            annotCanvas.width  = newW;
            annotCanvas.height = newH;
            if (saved && saved.width > 0 && saved.height > 0) {
                const tmp = document.createElement('canvas');
                tmp.width = saved.width; tmp.height = saved.height;
                tmp.getContext('2d').putImageData(saved, 0, 0);
                actx.drawImage(tmp, 0, 0, saved.width, saved.height, 0, 0, newW, newH);
            } else {
                _dnRedrawAnnotations();
            }
        }

        // Données d'annotation (strokes normalisés 0->1)
        const _dnAnnotLayer = { strokes: [], history: [], redoHistory: [] };
        let   _dnIsDrawing  = false;
        let   _dnCurStroke  = null;

        const actx = annotCanvas.getContext('2d');



        function _dnToNorm(px, py) {
            const dpr = window.devicePixelRatio || 1;
            const cw = annotCanvas.width;
            const ch = annotCanvas.height;
            return { x: px / cw, y: py / ch };
        }
        function _dnFromNorm(nx, ny) {
            return { x: nx * annotCanvas.width, y: ny * annotCanvas.height };
        }

        function _dnBuildSnapshot() {
            _dnAnnotLayer._snapshot = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
        }
        function _dnInvalidateSnapshot() { _dnAnnotLayer._snapshot = null; }

        function _dnDrawStroke(ctx, stroke) {
            const cw = annotCanvas.width;
            const displayW = annotCanvas.getBoundingClientRect().width || cw;
            const sizeScaled = stroke.size * cw / displayW;
            if (stroke.tool === 'text') {
                const pos = _dnFromNorm(stroke.nx, stroke.ny);
                const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * cw / 600);
                ctx.save();
                ctx.font = fontSize + 'px \'Segoe UI\', sans-serif';
                ctx.fillStyle = stroke.color; ctx.globalAlpha = 1;
                const lines = (stroke.text || '').split('\n');
                if (stroke.rotation) {
                    const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                    const textH = lines.length * fontSize * 1.3;
                    ctx.translate(pos.x + textW/2, pos.y + textH/2);
                    ctx.rotate(stroke.rotation);
                    ctx.translate(-(pos.x + textW/2), -(pos.y + textH/2));
                }
                lines.forEach((line, i) => ctx.fillText(line, pos.x, pos.y + (i + 1) * fontSize * 1.3));
                ctx.restore(); return;
            }
            if (stroke.tool === 'figure') {
                if (!stroke.pts || stroke.pts.length < 2) return;
                const pxPts = stroke.pts.map(p => _dnFromNorm(p.x, p.y));
                ctx.save();
                ctx.strokeStyle = stroke.color; ctx.lineWidth = sizeScaled;
                ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1;
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
                if (stroke.fillColor && stroke.fillOpacity > 0) {
                    ctx.globalAlpha = stroke.fillOpacity; ctx.fillStyle = stroke.fillColor; ctx.fill();
                }
                ctx.restore(); return;
            }
            if (!stroke.pts || stroke.pts.length === 0) return;
            const pxPts = stroke.pts.map(p => _dnFromNorm(p.x, p.y));
            ctx.save();
            if (stroke.dot) {
                ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
                ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
                const r = Math.max(1, sizeScaled / 2);
                ctx.beginPath(); ctx.arc(pxPts[0].x, pxPts[0].y, r, 0, Math.PI * 2);
                ctx.fillStyle = stroke.color; ctx.fill();
            } else if (stroke.tool === 'highlighter') {
                const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'multiply';
                ctx.strokeStyle = stroke.color; ctx.lineWidth = lw;
                ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (stroke.tool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = sizeScaled * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else {
                ctx.globalAlpha = 1; ctx.strokeStyle = stroke.color;
                ctx.lineWidth = sizeScaled; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath();
                pxPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
            ctx.restore();
        }

        function _dnRedrawAnnotations() {
            actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
            if (_dnAnnotLayer._snapshot) {
                actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
            } else {
                _dnAnnotLayer.strokes.forEach(s => _dnDrawStroke(actx, s));
            }
        }

        // _pdfAnnotAPI : interface attendue par draw.js
        widget._pdfAnnotAPI = {
            startStroke(color, size, tool, px, py) {
                _dnSyncLocked = true;  // bloquer tout resize pendant le trait
                const norm = _dnToNorm(px, py);
                _dnCurStroke = { tool, color, size, pts: [norm] };
                _dnIsDrawing = true;
                _dnBuildSnapshot();
            },
            continueStroke(color, size, tool, px, py) {
                if (!_dnIsDrawing || !_dnCurStroke) return;
                const norm = _dnToNorm(px, py);
                const pts  = _dnCurStroke.pts;
                const prev = pts[pts.length - 1];
                pts.push(norm);
                _dnCurStroke.color = color; _dnCurStroke.size = size; _dnCurStroke.tool = tool;
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = size * cw / displayW;
                const pPrev = _dnFromNorm(prev.x, prev.y);
                const pCur  = _dnFromNorm(norm.x, norm.y);
                actx.save();
                if (tool === 'highlighter') {
                    if (pts.length % 20 === 0) {
                        if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                        else actx.clearRect(0, 0, cw, annotCanvas.height);
                        const pxPts = pts.map(p => _dnFromNorm(p.x, p.y));
                        const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                        actx.globalAlpha = 0.35; actx.globalCompositeOperation = 'multiply';
                        actx.strokeStyle = color; actx.lineWidth = lw;
                        actx.lineCap = 'butt'; actx.lineJoin = 'round';
                        actx.beginPath();
                        pxPts.forEach((p, i) => i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y));
                        actx.stroke();
                    } else {
                        const lw = Math.max(sizeScaled * 6, 24 * (cw / displayW));
                        actx.globalAlpha = 0.35; actx.globalCompositeOperation = 'multiply';
                        actx.strokeStyle = color; actx.lineWidth = lw;
                        actx.lineCap = 'round'; actx.lineJoin = 'round';
                        actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                    }
                } else if (tool === 'eraser') {
                    actx.globalCompositeOperation = 'destination-out';
                    actx.lineWidth = sizeScaled * 2; actx.lineCap = 'round';
                    actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                } else {
                    actx.strokeStyle = color; actx.lineWidth = sizeScaled;
                    actx.lineCap = 'round'; actx.lineJoin = 'round';
                    actx.beginPath(); actx.moveTo(pPrev.x, pPrev.y); actx.lineTo(pCur.x, pCur.y); actx.stroke();
                }
                actx.restore();
            },
            endStroke() {
                if (!_dnIsDrawing || !_dnCurStroke) return;
                _dnIsDrawing = false;
                if (_dnCurStroke.pts.length === 1) _dnCurStroke.dot = true;
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(_dnCurStroke);
                _dnCurStroke = null;
                _dnInvalidateSnapshot();   // invalider le snapshot vide AVANT de redessiner
                _dnRedrawAnnotations();
                setTimeout(() => { _dnSyncLocked = false; }, 100);
            },
            undo() {
                if (_dnAnnotLayer.history.length > 0) {
                    _dnAnnotLayer.redoHistory.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes = _dnAnnotLayer.history.pop();
                } else if (_dnAnnotLayer.strokes.length > 0) {
                    _dnAnnotLayer.redoHistory.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes.pop();
                }
                _dnAnnotLayer._snapshot = null;
                _dnRedrawAnnotations();
            },
            redo() {
                if (_dnAnnotLayer.redoHistory.length > 0) {
                    _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                    _dnAnnotLayer.strokes = _dnAnnotLayer.redoHistory.pop();
                    _dnAnnotLayer._snapshot = null;
                    _dnRedrawAnnotations();
                }
            },
            clear() {
                if (_dnAnnotLayer.strokes.length > 0) _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                _dnAnnotLayer.strokes = [];
                _dnAnnotLayer._snapshot = null;
                _dnAnnotLayer.redoHistory = [];
                _dnRedrawAnnotations();
            },
            getAnnotCanvas()  { return annotCanvas; },
            getPdfDoc()       { return null; },
            getTotalPages()   { return 1; },
            getAnnotLayers()  { return { 1: _dnAnnotLayer }; },
            drawStrokeOn(ctx, stroke) { _dnDrawStroke(ctx, stroke); },
            addTextStroke(text, color, size, px, py) {
                const norm = _dnToNorm(px, py);
                const stroke = { tool: 'text', color, size, text, nx: norm.x, ny: norm.y };
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(stroke);
                _dnRedrawAnnotations();
            },
            previewFigure(color, size, pts, fillColor, fillOpacity) {
                _dnRedrawAnnotations();
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const sizeScaled = size * cw / displayW;
                actx.save();
                actx.strokeStyle = color; actx.lineWidth = sizeScaled;
                actx.lineCap = 'round'; actx.lineJoin = 'round';
                actx.setLineDash([6, 4]); actx.globalAlpha = 0.7;
                actx.beginPath();
                pts.forEach((p, i) => i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y));
                if (fillColor && fillOpacity > 0) {
                    actx.save(); actx.globalAlpha = fillOpacity * 0.7;
                    actx.fillStyle = fillColor; actx.setLineDash([]); actx.fill(); actx.restore();
                    actx.setLineDash([6, 4]);
                }
                actx.stroke(); actx.setLineDash([]); actx.restore();
            },
            addFigureStroke(color, size, pts, fillColor, fillOpacity) {
                const normPts = pts.map(p => _dnToNorm(p.x, p.y));
                const stroke = { tool: 'figure', color, size, pts: normPts };
                if (fillColor && fillOpacity > 0) { stroke.fillColor = fillColor; stroke.fillOpacity = fillOpacity; }
                _dnAnnotLayer.redoHistory = [];
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnAnnotLayer.strokes.push(stroke); _dnRedrawAnnotations(); _dnInvalidateSnapshot();
            },
            previewEraser(px, py, r) {
                if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                else _dnRedrawAnnotations();
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const rScaled = r * cw / displayW;
                actx.save(); actx.globalCompositeOperation = 'source-over';
                actx.beginPath(); actx.arc(px, py, rScaled, 0, Math.PI * 2);
                actx.strokeStyle = 'rgba(80,80,80,0.9)'; actx.lineWidth = 1.5;
                actx.setLineDash([4, 3]); actx.stroke();
                actx.beginPath(); actx.arc(px, py, 2, 0, Math.PI * 2);
                actx.fillStyle = 'rgba(80,80,80,0.7)'; actx.fill();
                actx.setLineDash([]); actx.restore();
            },
            eraseAt(px, py, r) {
                const cw = annotCanvas.width;
                const displayW = annotCanvas.getBoundingClientRect().width || 600;
                const rScaled = r * cw / displayW;
                actx.save(); actx.globalCompositeOperation = 'destination-out';
                actx.beginPath(); actx.arc(px, py, rScaled, 0, Math.PI * 2);
                actx.fill(); actx.restore();
            },
            saveEraserSnapshot() {
                const imgData = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                _dnAnnotLayer._snapshot = imgData;
                _dnAnnotLayer.strokes = [];
            },
            redrawAnnotations() { _dnRedrawAnnotations(); },
            drawTextSelection(index) {
                const s = _dnAnnotLayer.strokes[index];
                if (!s || s.tool !== 'text') return;
                if (_dnAnnotLayer._snapshot) actx.putImageData(_dnAnnotLayer._snapshot, 0, 0);
                else _dnRedrawAnnotations();
                _dnDrawStroke(actx, s);
            },
            moveTextStroke(index, px, py) {
                const norm = _dnToNorm(px, py);
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.strokes[index] = { ..._dnAnnotLayer.strokes[index], nx: norm.x, ny: norm.y };
                if (_dnAnnotLayer._snapshot) { actx.putImageData(_dnAnnotLayer._snapshot, 0, 0); _dnDrawStroke(actx, _dnAnnotLayer.strokes[index]); }
                else _dnRedrawAnnotations();
            },
            saveTextMove(index) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnInvalidateSnapshot();
            },
            rotateTextStroke(index, angle) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.strokes[index] = { ..._dnAnnotLayer.strokes[index], rotation: angle };
                if (_dnAnnotLayer._snapshot) { actx.putImageData(_dnAnnotLayer._snapshot, 0, 0); _dnDrawStroke(actx, _dnAnnotLayer.strokes[index]); }
                else _dnRedrawAnnotations();
            },
            saveTextTransform(index) {
                if (!_dnAnnotLayer.strokes[index]) return;
                _dnAnnotLayer.history.push([..._dnAnnotLayer.strokes]);
                if (_dnAnnotLayer.history.length > 30) _dnAnnotLayer.history.shift();
                _dnInvalidateSnapshot();
            },
            detachNativeEvents() {},
        };

        // Sync canvas taille via ResizeObserver.
        // Quand les dimensions changent, on sauvegarde le contenu via ImageData
        // avant de redimensionner, puis on restaure — le canvas n'est jamais vidé.
        requestAnimationFrame(() => _dnSyncAnnotCanvas());
        const _dnResizeObs = new ResizeObserver(() => _dnSyncAnnotCanvas());
        _dnResizeObs.observe(widget);

        // Activation / desactivation du mode annotation
        // draw.js ajoute la classe 'pdf-annot-target' sur le widget quand il active l'annotation.
        function _dnEnterAnnotMode() {
            _dnAnnotOverlay.style.pointerEvents = 'auto';
            svgWrap.style.pointerEvents = 'none';
            tokensZone.style.pointerEvents = 'none';
            controls.style.pointerEvents = 'none';
        }
        function _dnLeaveAnnotMode() {
            _dnAnnotOverlay.style.pointerEvents = 'none';
            svgWrap.style.pointerEvents = '';
            tokensZone.style.pointerEvents = '';
            controls.style.pointerEvents = '';
        }
        const _dnAnnotObserver = new MutationObserver(() => {
            if (widget.classList.contains('pdf-annot-target')) {
                _dnEnterAnnotMode();
            } else {
                _dnLeaveAnnotMode();
            }
        });
        _dnAnnotObserver.observe(widget, { attributes: true, attributeFilter: ['class'] });

        // =========================================================================
        // ÉTAT INTERNE
        // =========================================================================
        let config = {
            min: 0, max: 10, pas: 1, subdivisions: 0,
            typeNombre: 'entiers', fracDen: 4,
            tokensStr: '',
            mode: 'jetons',     // 'jetons' | 'libre'
        };

        // Jetons : { text, value, placed, markerId }
        let tokens = [];
        // Marqueurs sur la droite : { id, value, text, tokenIdx (ou null si libre) }
        let markers = [];
        let markerIdCounter = 0;

        let dragToken = null;   // token en cours de drag
        let ghost = null;

        // ── Helpers ───────────────────────────────────────────────────────
        function parseFrac(s) {
            s = s.trim();
            if (s.includes('/')) {
                const parts = s.split('/');
                if (parts.length === 2) {
                    const n = parseFloat(parts[0]), d = parseFloat(parts[1]);
                    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
                }
            }
            const v = parseFloat(s);
            return isNaN(v) ? null : v;
        }

        function formatNumber(v, type, den) {
            if (type === 'fractions') {
                // Convertir en fraction avec le dénominateur donné
                const num = Math.round(v * den);
                if (num % den === 0) return String(num / den);
                return num + '/' + den;
            }
            if (type === 'decimaux') {
                // Afficher avec 1 ou 2 décimales selon le pas
                const decPlaces = config.pas < 1 ? (String(config.pas).split('.')[1] || '').length : 0;
                return v.toFixed(Math.max(0, decPlaces));
            }
            return String(Math.round(v));
        }

        // ── Rendu SVG ─────────────────────────────────────────────────────
        function getLineDims() {
            const rect = svgWrap.getBoundingClientRect();
            const W = rect.width  || 780;
            const H = rect.height || 140;
            return { W, H };
        }

        function valueToX(v, W) {
            const pad = 40;
            return pad + (v - config.min) / (config.max - config.min) * (W - pad * 2);
        }

        function xToValue(x, W) {
            const pad = 40;
            const raw = config.min + (x - pad) / (W - pad * 2) * (config.max - config.min);
            // Arrondir au pas le plus proche
            const snapped = Math.round(raw / config.pas) * config.pas;
            return Math.max(config.min, Math.min(config.max, snapped));
        }

        function drawLine() {
            const { W, H } = getLineDims();
            const cy = H / 2;
            const pad = 40;
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

            // Vider
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            // ── Flèches ───────────────────────────────────────────────────
            // Ligne principale
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', pad - 10); line.setAttribute('y1', cy);
            line.setAttribute('x2', W - pad + 10); line.setAttribute('y2', cy);
            line.setAttribute('stroke', '#374151'); line.setAttribute('stroke-width', '2');
            svg.appendChild(line);

            // Flèche droite
            const arrowR = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            arrowR.setAttribute('points', `${W-pad+10},${cy} ${W-pad},${cy-5} ${W-pad},${cy+5}`);
            arrowR.setAttribute('fill', '#374151');
            svg.appendChild(arrowR);

            // ── Graduations ────────────────────────────────────────────────
            const totalSteps = Math.round((config.max - config.min) / config.pas);
            for (let i = 0; i <= totalSteps; i++) {
                const v = config.min + i * config.pas;
                const x = valueToX(v, W);
                const mainTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                mainTick.setAttribute('x1', x); mainTick.setAttribute('y1', cy - 10);
                mainTick.setAttribute('x2', x); mainTick.setAttribute('y2', cy + 10);
                mainTick.setAttribute('stroke', '#374151'); mainTick.setAttribute('stroke-width', '1.5');
                svg.appendChild(mainTick);

                // Label graduation
                const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                labelEl.setAttribute('x', x); labelEl.setAttribute('y', cy + 24);
                labelEl.setAttribute('text-anchor', 'middle');
                labelEl.setAttribute('font-size', '11');
                labelEl.setAttribute('fill', '#6b7280');
                labelEl.setAttribute('font-family', 'Segoe UI, system-ui, sans-serif');
                labelEl.textContent = formatNumber(v, config.typeNombre, config.fracDen);
                svg.appendChild(labelEl);

                // Subdivisions
                if (config.subdivisions > 0 && i < totalSteps) {
                    for (let j = 1; j <= config.subdivisions; j++) {
                        const sv = v + (config.pas / (config.subdivisions + 1)) * j;
                        const sx = valueToX(sv, W);
                        const subTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        subTick.setAttribute('x1', sx); subTick.setAttribute('y1', cy - 5);
                        subTick.setAttribute('x2', sx); subTick.setAttribute('y2', cy + 5);
                        subTick.setAttribute('stroke', '#9ca3af'); subTick.setAttribute('stroke-width', '1');
                        svg.appendChild(subTick);
                    }
                }
            }

            // ── Zone de dépôt invisible sur toute la ligne ────────────────
            const dropZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            dropZone.setAttribute('x', pad - 10); dropZone.setAttribute('y', cy - 30);
            dropZone.setAttribute('width', W - 2 * pad + 20); dropZone.setAttribute('height', 60);
            dropZone.setAttribute('fill', 'transparent'); dropZone.className = 'dn-drop-zone';
            svg.appendChild(dropZone);

            // Gérer le clic en mode libre
            dropZone.addEventListener('click', (e) => {
                if (config.mode !== 'libre') return;
                const rect2 = svg.getBoundingClientRect();
                const rawX = (e.clientX - rect2.left) * (W / rect2.width);
                const v = xToValue(rawX, W);
                const text = formatNumber(v, config.typeNombre, config.fracDen);
                addMarker(v, text, null);
                if (typeof saveBoard === 'function') saveBoard();
            });

            // ── Redessiner les marqueurs existants ─────────────────────────
            markers.forEach(m => renderMarker(m, W, cy));
        }

        function renderMarker(m, W, cy) {
            if (W === undefined) {
                const { W: w2, H } = getLineDims();
                W = w2; cy = H / 2;
            }
            const x = valueToX(m.value, W);

            // Supprimer l'ancien groupe si existant
            const old = svg.querySelector(`[data-marker-id="${m.id}"]`);
            if (old) old.remove();

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('data-marker-id', m.id);
            g.className = 'dn-marker-group' + (m.correct === true ? ' correct' : '') + (m.correct === false ? ' wrong' : '');
            g.style.cursor = 'pointer';

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x); circle.setAttribute('cy', cy);
            circle.setAttribute('r', '8'); circle.className = 'dn-marker-circle';
            circle.setAttribute('fill', '#4a90e2'); circle.setAttribute('stroke', '#2563eb'); circle.setAttribute('stroke-width', '1.5');

            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x); label.setAttribute('y', cy - 14);
            label.setAttribute('text-anchor', 'middle');
            label.className = 'dn-marker-label';
            label.setAttribute('font-size', '13');
            label.setAttribute('fill', '#1e3a5f');
            label.setAttribute('font-family', 'Segoe UI, system-ui, sans-serif');
            label.setAttribute('font-weight', '700');
            label.textContent = m.text;

            // Croix de suppression
            const delBtn = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            delBtn.setAttribute('x', x + 10); delBtn.setAttribute('y', cy - 8);
            delBtn.setAttribute('text-anchor', 'middle');
            delBtn.setAttribute('font-size', '11');
            delBtn.setAttribute('fill', '#9ca3af');
            delBtn.setAttribute('cursor', 'pointer');
            delBtn.textContent = '✕';
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeMarker(m.id);
                if (typeof saveBoard === 'function') saveBoard();
            });

            g.appendChild(circle); g.appendChild(label); g.appendChild(delBtn);
            svg.appendChild(g);
        }

        function addMarker(value, text, tokenIdx) {
            const id = ++markerIdCounter;
            markers.push({ id, value, text, tokenIdx, correct: undefined });
            if (tokenIdx !== null && tokenIdx !== undefined) {
                if (tokens[tokenIdx]) tokens[tokenIdx].placed = true;
                renderTokens();
            }
            const { W, H } = getLineDims();
            renderMarker(markers[markers.length - 1], W, H / 2);
            resultText.textContent = '';
            resultText.classList.remove('show');
        }

        function removeMarker(id) {
            const idx = markers.findIndex(m => m.id === id);
            if (idx === -1) return;
            const m = markers[idx];
            if (m.tokenIdx !== null && m.tokenIdx !== undefined && tokens[m.tokenIdx]) {
                tokens[m.tokenIdx].placed = false;
                renderTokens();
            }
            markers.splice(idx, 1);
            const el = svg.querySelector(`[data-marker-id="${id}"]`);
            if (el) el.remove();
            resultText.textContent = '';
            resultText.classList.remove('show');
        }

        // ── Rendu jetons ──────────────────────────────────────────────────
        function renderTokens() {
            // Supprimer les anciens jetons (sauf le label)
            Array.from(tokensZone.querySelectorAll('.dn-token')).forEach(el => el.remove());
            tokens.forEach((tok, idx) => {
                const el = document.createElement('div');
                el.className = 'dn-token' + (tok.placed ? ' placed' : '');
                el.textContent = tok.text;
                el.dataset.tokenIdx = idx;
                if (!tok.placed) setupTokenDrag(el, idx);
                tokensZone.appendChild(el);
            });
            // Afficher la zone jetons seulement en mode jetons
            tokensZone.style.display = (config.mode === 'jetons' && tokens.length > 0) ? 'flex' : 'none';
        }

        // ── Drag & drop jetons ────────────────────────────────────────────
        function setupTokenDrag(el, idx) {
            el.addEventListener('pointerdown', (e) => {
                e.stopPropagation(); e.preventDefault();
                dragToken = idx;
                el.classList.add('is-dragging');
                ghost = document.createElement('div');
                ghost.className = 'dn-drag-ghost';
                ghost.textContent = tokens[idx].text;
                document.body.appendChild(ghost);
                moveGhost(e.clientX, e.clientY);

                const onMove = (ev) => {
                    moveGhost(ev.clientX, ev.clientY);
                    highlightDropZone(ev);
                };
                const onUp = (ev) => {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                    el.classList.remove('is-dragging');
                    if (ghost) { ghost.remove(); ghost = null; }
                    clearHighlight();
                    tryDropOnLine(ev.clientX, ev.clientY, idx);
                    dragToken = null;
                };
                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });
        }

        function moveGhost(cx, cy) {
            if (!ghost) return;
            ghost.style.left = cx + 'px';
            ghost.style.top  = cy + 'px';
        }

        function highlightDropZone(ev) {
            const dropZone = svg.querySelector('.dn-drop-zone');
            if (!dropZone) return;
            const rect = dropZone.getBoundingClientRect();
            const over = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
            dropZone.setAttribute('fill', over ? 'rgba(74,144,226,0.12)' : 'transparent');
        }

        function clearHighlight() {
            const dropZone = svg.querySelector('.dn-drop-zone');
            if (dropZone) dropZone.setAttribute('fill', 'transparent');
        }

        function tryDropOnLine(cx, cy, tokenIdx) {
            const { W } = getLineDims();
            const rect = svg.getBoundingClientRect();
            if (cx < rect.left || cx > rect.right || cy < rect.top || cy > rect.bottom) return;
            const rawX = (cx - rect.left) * (W / rect.width);
            const v = xToValue(rawX, W);
            const text = tokens[tokenIdx].text;
            addMarker(v, text, tokenIdx);
            if (typeof saveBoard === 'function') saveBoard();
        }

        // ── Appliquer config ──────────────────────────────────────────────
        function applyConfig() {
            // Lire les inputs (NaN → valeur par défaut, mais 0 est valide !)
            const _min = parseFloat(inputMin.value);
            const _max = parseFloat(inputMax.value);
            const _pas = parseFloat(inputPas.value);
            const _sub = parseInt(inputSub.value);
            config.min  = isNaN(_min) ? -10 : _min;
            config.max  = isNaN(_max) ?  10 : _max;
            config.pas  = isNaN(_pas) || _pas <= 0 ? 1 : _pas;
            config.subdivisions = isNaN(_sub) ? 0 : _sub;
            config.typeNombre = selType.value;
            config.fracDen = parseInt(selFracDen.value) || 4;
            config.tokensStr = inputTokens.value;
            config.mode = modeGroup.querySelector('.active')?.dataset.mode || 'jetons';

            // Clamp
            if (config.max <= config.min) config.max = config.min + config.pas;

            // Reconstruire les jetons
            tokens = [];
            markers = [];
            markerIdCounter = 0;

            if (config.mode === 'jetons' && config.tokensStr.trim()) {
                config.tokensStr.split(',').forEach(part => {
                    const txt = part.trim();
                    const val = parseFrac(txt);
                    if (txt && val !== null) {
                        tokens.push({ text: txt, value: val, placed: false });
                    }
                });
            }

            // Afficher/masquer le sélecteur de dénominateur
            fracDenLabel.style.display = config.typeNombre === 'fractions' ? '' : 'none';
            selFracDen.style.display   = config.typeNombre === 'fractions' ? '' : 'none';

            renderTokens();
            drawLine();
            resultText.textContent = '';
            resultText.classList.remove('show');
            if (typeof saveBoard === 'function') saveBoard();
        }

        // ── Résultat affiché initial ───────────────────────────────────────
        fracDenLabel.style.display = 'none';
        selFracDen.style.display   = 'none';

        // ── Événements header ─────────────────────────────────────────────
        let helpVisible = false;
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpVisible = !helpVisible;
            helpPopup.classList.toggle('show', helpVisible);
            helpBtn.classList.toggle('active', helpVisible);
        });
        document.addEventListener('pointerdown', (e) => {
            if (!helpPopup.contains(e.target) && e.target !== helpBtn) {
                helpVisible = false;
                helpPopup.classList.remove('show');
                helpBtn.classList.remove('active');
            }
        });

        let paramsVisible = false;
        paramsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            paramsVisible = !paramsVisible;
            paramsPanel.classList.toggle('show', paramsVisible);
            paramsBtn.classList.toggle('active', paramsVisible);
        });

        applyBtn.addEventListener('click', () => {
            applyConfig();
        });

        // Mode toggle
        [modeJeton, modeLibre].forEach(btn => {
            btn.addEventListener('click', () => {
                [modeJeton, modeLibre].forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                config.mode = btn.dataset.mode;
            });
        });

        // Type nombre → afficher/masquer dénominateur
        selType.addEventListener('change', () => {
            const isFrac = selType.value === 'fractions';
            fracDenLabel.style.display = isFrac ? '' : 'none';
            selFracDen.style.display   = isFrac ? '' : 'none';
        });

        // ── Bouton Réduire ────────────────────────────────────────────────
        minBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window._wfMiniBarCollapse(widget, '📏 Droite numérique');
        });

        // ── Bouton Plein écran ─────────────────────────────────────────────
        maxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.toggle('wf-fullboard');
            if (typeof saveBoard === 'function') saveBoard();
            setTimeout(drawLine, 50);
        });

        // ── Bouton Fermer ─────────────────────────────────────────────────
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Bouton Vérifier ───────────────────────────────────────────────
        checkBtn.addEventListener('click', () => {
            if (config.mode === 'jetons') {
                // Correction : chaque marqueur issu d'un jeton doit être à la bonne valeur
                // (la valeur théorique = la valeur du jeton lui-même)
                let correct = 0, wrong = 0;
                markers.forEach(m => {
                    if (m.tokenIdx === null || m.tokenIdx === undefined) return;
                    const tok = tokens[m.tokenIdx];
                    if (!tok) return;
                    const expected = tok.value;
                    const tol = config.pas * 0.3;
                    const ok = Math.abs(m.value - expected) <= tol;
                    m.correct = ok;
                    if (ok) correct++; else wrong++;
                    const { W, H } = getLineDims();
                    renderMarker(m, W, H / 2);
                });
                if (markers.filter(m => m.tokenIdx !== null && m.tokenIdx !== undefined).length === 0) {
                    resultText.textContent = '⚠️ Aucun jeton placé !';
                    resultText.style.color = '#e67e22';
                } else if (wrong === 0) {
                    resultText.textContent = '✅ Bravo, tout est correct !';
                    resultText.style.color = '#28a745';
                } else {
                    resultText.textContent = `❌ ${correct} correct${correct > 1 ? 's' : ''}, ${wrong} erreur${wrong > 1 ? 's' : ''}`;
                    resultText.style.color = '#dc3545';
                }
            } else {
                resultText.textContent = markers.length === 0 ? '⚠️ Aucun point placé !' : `${markers.length} point${markers.length > 1 ? 's' : ''} placé${markers.length > 1 ? 's' : ''}`;
                resultText.style.color = markers.length === 0 ? '#e67e22' : '#28a745';
            }
            resultText.classList.add('show');
        });

        // ── Bouton Effacer ────────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            markers.forEach(m => {
                const el = svg.querySelector(`[data-marker-id="${m.id}"]`);
                if (el) el.remove();
                if (m.tokenIdx !== null && m.tokenIdx !== undefined && tokens[m.tokenIdx]) {
                    tokens[m.tokenIdx].placed = false;
                }
            });
            markers = [];
            markerIdCounter = 0;
            renderTokens();
            resultText.textContent = '';
            resultText.classList.remove('show');
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Drag de l'en-tête (déplacer le widget) ────────────────────────
        header.addEventListener('pointerdown', (e) => {
            if (e.target === paramsBtn || e.target === helpBtn || wfBtns.contains(e.target)) return;
            e.preventDefault(); e.stopPropagation();
            const board = document.getElementById('board');
            header.setPointerCapture(e.pointerId);
            const startX = e.clientX - widget.offsetLeft;
            const startY = e.clientY - widget.offsetTop;
            const onMove = (ev) => {
                widget.style.left = Math.max(0, ev.clientX - startX) + 'px';
                widget.style.top  = Math.max(0, ev.clientY - startY) + 'px';
            };
            const onUp = () => {
                header.removeEventListener('pointermove', onMove);
                header.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            header.addEventListener('pointermove', onMove);
            header.addEventListener('pointerup', onUp);
        });

        // ── Resize handle ─────────────────────────────────────────────────
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            resizeHandle.setPointerCapture(e.pointerId);
            const startX = e.clientX, startY = e.clientY;
            const startW = container.offsetWidth, startH = container.offsetHeight;
            const onMove = (ev) => {
                const newW = Math.max(400, startW + ev.clientX - startX);
                const newH = Math.max(240, startH + ev.clientY - startY);
                container.style.width  = newW + 'px';
                container.style.height = newH + 'px';
                drawLine();
            };
            const onUp = () => {
                resizeHandle.removeEventListener('pointermove', onMove);
                resizeHandle.removeEventListener('pointerup', onUp);
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.widthPercent    = (container.offsetWidth  / curW)  * 100;
                widget.dataset.contentHPercent = (container.offsetHeight / curVH) * 100;
                if (typeof saveBoard === 'function') saveBoard();
            };
            resizeHandle.addEventListener('pointermove', onMove);
            resizeHandle.addEventListener('pointerup', onUp);
        });

        // ── ResizeObserver pour redessiner la droite si le conteneur change ─
        // Désactivé pendant l'init/restauration pour éviter qu'il redessine
        // avec les valeurs par défaut après _dnSetData.
        let roEnabled = false;
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(() => { if (roEnabled) drawLine(); });
            ro.observe(svgWrap);
        }

        // =========================================================================
        // DONNÉES GET / SET (pour save-load.js)
        // =========================================================================
        widget._dnGetData = function() {
            const { W, H } = getLineDims();
            return {
                config: { ...config },
                markers: markers.map(m => ({ ...m })),
                markerIdCounter,
                containerW: container.offsetWidth,
                containerH: container.offsetHeight,
                fullboard: container.classList.contains('wf-fullboard')
            };
        };

        widget._dnSetData = function(data) {
            if (!data) return;
            if (data.config) {
                Object.assign(config, data.config);
                // Remettre les inputs à jour
                inputMin.value = config.min;
                inputMax.value = config.max;
                inputPas.value = config.pas;
                inputSub.value = config.subdivisions;
                selType.value  = config.typeNombre;
                selFracDen.value = config.fracDen;
                inputTokens.value = config.tokensStr || '';
                // Mode
                [modeJeton, modeLibre].forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === config.mode);
                });
                // Fractions dénominateur
                const isFrac = config.typeNombre === 'fractions';
                fracDenLabel.style.display = isFrac ? '' : 'none';
                selFracDen.style.display   = isFrac ? '' : 'none';
            }
            // Reconstruire les jetons depuis la config
            tokens = [];
            if (config.mode === 'jetons' && config.tokensStr && config.tokensStr.trim()) {
                config.tokensStr.split(',').forEach(part => {
                    const txt = part.trim();
                    const val = parseFrac(txt);
                    if (txt && val !== null) tokens.push({ text: txt, value: val, placed: false });
                });
            }
            // Restaurer marqueurs
            markers = [];
            markerIdCounter = data.markerIdCounter || 0;
            if (data.markers && Array.isArray(data.markers)) {
                data.markers.forEach(m => {
                    markers.push({ ...m });
                    // Remettre les jetons comme placés
                    if (m.tokenIdx !== null && m.tokenIdx !== undefined && tokens[m.tokenIdx]) {
                        tokens[m.tokenIdx].placed = true;
                    }
                });
            }
            renderTokens();
            drawLine();
        };

        // ── Initialisation ─────────────────────────────────────────────────
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const curW  = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            const wPct = parseFloat(widget.dataset.widthPercent);
            const hPct = parseFloat(widget.dataset.contentHPercent);
            if (wPct > 0) container.style.width  = (wPct / 100) * curW  + 'px';
            if (hPct > 0) container.style.height = (hPct / 100) * curVH + 'px';
            if (!container.style.height) container.style.height = '700px';
            // Le widget s'ouvre à 100px du bord gauche du board.
            widget.style.left = '100px';
            widget.dataset.leftPercent = (100 / curW) * 100;

            if (savedData) {
                widget._dnSetData(savedData);
            } else {
                renderTokens();
                drawLine();
            }
            // Activer le ResizeObserver seulement après le premier rendu complet
            requestAnimationFrame(() => { roEnabled = true; });
        }));
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    var _orig = window.createWidget;
    if (typeof _orig === 'function') {
        window.createWidget = function(type) {
            var widget = _orig.apply(this, arguments);
            if (type === 'droite-num') {
                // Consommer les données de restauration posées juste avant l'appel
                const pending = window._dnNextPendingData || null;
                initDroiteNumWidget(widget, pending);
            }
            return widget;
        };
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            var orig = window.createWidget;
            if (typeof orig === 'function') {
                window.createWidget = function(type) {
                    var widget = orig.apply(this, arguments);
                    if (type === 'droite-num') {
                        const pending = window._dnNextPendingData || null;
                        initDroiteNumWidget(widget, pending);
                    }
                    return widget;
                };
            }
        });
    }

})();
