// =========================================================================
// WIDGET CONVERSION — Le Bureau du Prof
// Génère des exercices de conversion (longueurs, masses, contenances, aires).
// 3 niveaux : facile / moyen / difficile
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS (injecté une seule fois) ──────────────────────────────────────────
(function () {

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
                widget.style.top    = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left   = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width  = widget.dataset.wfMiniSavedW    || '';
                widget.style.height = widget.dataset.wfMiniSavedH    || '';
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

    if (!document.getElementById('wconv-style')) {
        const s = document.createElement('style');
        s.id = 'wconv-style';
        s.textContent = `
        .widget[data-type="conversion"] {
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
        .wconv-container {
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
            min-width: 320px;
        }
        .wconv-container input {
            user-select: text;
            -webkit-user-select: text;
        }
        .wconv-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
        }
        .wconv-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }
        .wconv-level-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: none;
        }
        .wconv-level-badge.show { display: inline-block; }
        .wconv-level-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .wconv-level-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .wconv-level-badge.difficile { background: #f8d7da; color: #842029; }
        .wconv-type-bar {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        .wconv-type-btn {
            padding: 4px 10px;
            border-radius: 20px;
            border: 1.5px solid #e5e7eb;
            background: #f9fafb;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            color: #6b7280;
            transition: all .15s;
            white-space: nowrap;
        }
        .wconv-type-btn:hover { background: #f3f4f6; border-color: #d1d5db; }
        .wconv-type-btn.active { background: #4a90e2; color: white; border-color: #4a90e2; }
        .wconv-level-btns { display: flex; gap: 4px; }
        .wconv-lvl-btn {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .wconv-lvl-btn:hover { background: #e0e0e0; }
        .wconv-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .wconv-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .wconv-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }
        .wconv-nb-input {
            width: 44px;
            padding: 4px 6px;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            outline: none;
            color: #374151;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif !important;
            touch-action: auto;
            pointer-events: auto;
            -webkit-user-select: text;
            user-select: text;
        }
        .wconv-table-wrap { overflow-x: auto; }
        .wconv-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 18px;
            table-layout: fixed;
			margin-bottom:20px;
        }
        .wconv-table th, .wconv-table td {
            border: 1px solid #d1d5db;
            text-align: center;
            padding: 5px 2px;
            font-size: 23px;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif !important;
        }
        .wconv-table th { background: #f3f4f6; font-weight: 900; color: #374151; }
        .wconv-table td { background: #fff; height: 50px; color: #6b7280; }
        .wconv-exos-zone {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            overflow-y: auto;
            min-height: 80px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #f8f9fa;
            padding: 6px 8px;
            box-sizing: border-box;
            counter-reset: exo-counter;
            gap: 4px 8px;
			margin-bottom:20px;
        }
        .wconv-exo-row {
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 700;
            font-size: 12px;
            padding: 10px 2px;
            border-bottom: 1px solid #e5e7eb;
            counter-increment: exo-counter;
            flex-wrap: nowrap;
        }
        .wconv-exo-row:nth-last-child(-n+4) { border-bottom: none; }
        .wconv-exo-row::before {
            content: counter(exo-counter) ")";
            min-width: 14px;
            font-size: 10px;
            font-weight: 800;
            color: #6688cc;
            flex-shrink: 0;
        }
        .wconv-exo-val {
            min-width: 0;
            text-align: right;
            white-space: nowrap;
            color: #374151;
            font-size: 23px;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif !important;
            flex-shrink: 1;
			padding: 0px 0px 0px 10px;
        }
        .wconv-exo-input {
            min-width: 60px;
            width: 60px;
            background: #fff;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            padding: 3px 8px;
            text-align: center;
            color: #4a90e2;
            font-weight: 700;
            font-size: 23px;
            font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif !important;
            outline: none;
            transition: border-color .15s, width .1s ease;
            flex-shrink: 0;
            user-select: text;
            -webkit-user-select: text;
            box-sizing: content-box;
        }
        .wconv-exo-input:focus { border-color: #4a90e2; }
        .wconv-exo-input.correct { border-color: #28a745; background: #f0fff4; color: #1a7a3a; }
        .wconv-exo-input.wrong   { border-color: #dc3545; background: #fff5f5; color: #9c1c28; }
        .wconv-exo-unit { min-width: 28px; color: #374151; font-size: 23px; font-family: 'MarelleBaton', 'Segoe UI', system-ui, sans-serif !important; flex-shrink: 0; }
        .wconv-controls { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .wconv-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .wconv-btn:active { transform: scale(0.96); }
        .wconv-btn-gen { background: #4a90e2; color: white; }
        .wconv-btn-gen:hover { background: #357abd; }
        .wconv-btn-corr { background: #22c55e; color: white; }
        .wconv-btn-corr:hover { background: #16a34a; }
        .wconv-btn-corr.revealed { background: #f97316; color: white; }
        .wconv-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5;
            color: #666; font-size: 12px; font-weight: 700;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0;
            transition: background .15s;
        }
        .wconv-help-btn:hover { background: #e0e0e0; color: #333; }
        .wconv-help-popup {
            display: none;
            position: fixed;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            padding: 12px 14px;
            width: 300px;
            font-size: 11px;
            color: #444;
            z-index: 10000;
            line-height: 1.5;
        }
        .wconv-help-popup.show { display: block; }
        .wconv-help-popup h4 { margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #374151; }
        .wconv-help-popup .help-section { margin-bottom: 7px; padding-bottom: 7px; border-bottom: 1px solid #eee; }
        .wconv-help-popup .help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .wconv-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
            padding: 20px 40px !important;
			padding-left: 70px !important;
        }
        .wconv-container.wf-fullboard .wconv-exos-zone { max-height: none; }
        .wconv-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .wconv-container:hover .wconv-resize-handle { opacity: 1; }
        `;
        document.head.appendChild(s);
    }
})();

// ── Données ───────────────────────────────────────────────────────────────
const CONV_UNITS_DATA = {
    longueurs:   ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
    masses:      ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'],
    contenances: ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'],
    aires:       ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²']
};
const CONV_TYPE_LABELS = {
    longueurs: '📏 Longueurs', masses: '⚖️ Masses',
    contenances: '🧴 Contenances', aires: '⬛ Aires'
};

function _convConvert(value, from, to, type) {
    const units = CONV_UNITS_DATA[type];
    const power = type === 'aires' ? 2 : 1;
    const diff = (units.indexOf(to) - units.indexOf(from)) * power;
    const num = parseFloat(value.toString().replace(',', '.'));
    const result = num * Math.pow(10, diff);
    // Arrondir pour corriger les imprécisions virgule flottante (ex: 19,58 hm² → mm²)
    // toPrecision(12) élimine les parasites sans tronquer les vrais résultats
    const inputDecimals = (value.toString().replace(',', '.').split('.')[1] || '').length;
    const expectedDecimals = Math.max(0, inputDecimals - diff);
    const rounded = diff >= 0 ? parseFloat(result.toPrecision(12)) : result;
    const maxDec = diff < 0 ? Math.max(5, Math.abs(diff) + 4) : expectedDecimals;
    return rounded.toLocaleString('fr-FR', { maximumFractionDigits: maxDec }).replace(/\s/g, '');
}

function _convGenExos(type, count, diff) {
    const units = CONV_UNITS_DATA[type];
    const exos = [];
    for (let i = 0; i < count; i++) {
        let fromIdx, toIdx, val;
        let d = diff;
        const r = Math.random();
        if (diff === 2 && r < 0.2) d = 1;
        if (diff === 3 && r < 0.2) d = 2;
        const maxEcart = d === 1 ? 3 : d === 2 ? 2 : units.length;
        if (d === 1) {
            fromIdx = Math.floor(Math.random() * (units.length - 1));
            toIdx = fromIdx + 1 + Math.floor(Math.random() * (Math.min(fromIdx + maxEcart, units.length - 1) - fromIdx));
            val = String(Math.floor(Math.random() * 95) + 1);
        } else if (d === 2) {
            fromIdx = Math.floor(Math.random() * units.length);
            do { toIdx = Math.floor(Math.random() * units.length); } while (fromIdx === toIdx || Math.abs(fromIdx - toIdx) > maxEcart);
            val = String(Math.floor(Math.random() * 95) + 1);
        } else {
            fromIdx = Math.floor(Math.random() * units.length);
            do { toIdx = Math.floor(Math.random() * units.length); } while (fromIdx === toIdx);
            val = (Math.random() * 95).toFixed(2).replace('.', ',');
        }
        const u1 = units[fromIdx], u2 = units[toIdx];
        exos.push({ val, u1, u2, result: _convConvert(val, u1, u2, type) });
    }
    return exos;
}

function _convBuildTable(type) {
    const units = CONV_UNITS_DATA[type];
    let html = '<table class="wconv-table"><tr>';
    units.forEach(u => { html += type === 'aires' ? `<th colspan="2">${u}</th>` : `<th>${u}</th>`; });
    html += '</tr><tr>';
    units.forEach(() => { html += type === 'aires' ? '<td></td><td></td>' : '<td></td>'; });
    return html + '</tr></table>';
}

// =========================================================================
// createConversionWidget
// =========================================================================
function createConversionWidget(opts) {
    opts = opts || {};
    snapshotNow();

    // ── Widget (identique à monnaie) ──────────────────────────────────────
    const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'conversion';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
    widget.tabIndex = 0;
    widget.innerHTML =
        '<div class="drag-handle" title="Déplacer">✥</div>' +
        '<div class="widget-rotate-handle" title="Faire pivoter">↻</div>' +
        '<div class="widget-action-bar">' +
            '<div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest(\'.widget,.shape-widget\'))" title="Menu">☰</div>' +
            '<div class="widget-pin-handle" onclick="togglePin(this.closest(\'.widget\'))" title="Épingler">📌</div>' +
            '<div class="widget-back-handle" onclick="sendToBack(this.closest(\'.widget\'))" title="Envoyer derrière">🔽</div>' +
            '<div class="widget-close-handle" onclick="snapshotNow();this.closest(\'.widget\').remove();saveBoard();" title="Fermer">×</div>' +
        '</div>' +
        '<div class="widget-ctx-menu"></div>';

    // ── Container ─────────────────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'wconv-container';
    container.style.width = Math.min(900, Math.round(window.innerWidth * 0.60)) + 'px';

    // ── Header ────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'wconv-header';
    header.innerHTML = `
        <span class="wconv-title">📐 Conversion</span>
        <span class="wconv-level-badge"></span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wconv-help-btn" title="Aide">?</button>
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);

    // ── Popup aide ────────────────────────────────────────────────────────
    const helpPopup = document.createElement('div');
    helpPopup.className = 'wconv-help-popup';
                (function() {
        var h4 = document.createElement('h4');
        h4.textContent = 'Mode d emploi';
        h4.style.cssText = 'margin:0 0 8px;font-size:12px;font-weight:800;color:#374151;';
        helpPopup.appendChild(h4);

        var sections = [
            {
                title: '1. Configuration',
                text: 'Sélectionnez le type de mesure (longueurs, masses, etc.), le nombre d\'exercices et le niveau de difficulté. Cliquez sur Générer pour créer la fiche.'
            },
            {
                title: '2. Niveaux',
                items: [
                    'Facile : Nombres entiers, conversions vers une unité plus petite, écart max 3.',
                    'Moyen : Nombres entiers, sens aléatoire, écart max 2.',
                    'Difficile : Tout est possible, nombres décimaux.'
                ],
                note: 'Les modes Moyen et Difficile incluent 20% de questions du niveau inférieur.'
            },
            {
                title: '3. Correction',
                text: 'Cliquez sur l\'oeil pour vérifier les réponses. Les bonnes réponses deviennent vertes, les erreurs rouges.'
            }
        ];

        sections.forEach(function(sec) {
            var div = document.createElement('div');
            div.style.cssText = 'margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid #eee;';
            var strong = document.createElement('strong');
            strong.textContent = sec.title;
            div.appendChild(strong);
            if (sec.text) {
                var br = document.createElement('br');
                div.appendChild(br);
                div.appendChild(document.createTextNode(sec.text));
            }
            if (sec.items) {
                var ul = document.createElement('ul');
                ul.style.cssText = 'margin:4px 0 0 14px;padding:0;line-height:1.6;';
                sec.items.forEach(function(item) {
                    var li = document.createElement('li');
                    li.textContent = item;
                    ul.appendChild(li);
                });
                div.appendChild(ul);
            }
            if (sec.note) {
                var p = document.createElement('p');
                p.style.cssText = 'margin:4px 0 0;font-style:italic;font-size:10px;';
                p.textContent = sec.note;
                div.appendChild(p);
            }
            helpPopup.appendChild(div);
        });
    })();
    container.appendChild(helpPopup);

    // ── Barre de type ─────────────────────────────────────────────────────
    const typeBar = document.createElement('div');
    typeBar.className = 'wconv-type-bar';
    Object.entries(CONV_TYPE_LABELS).forEach(([key, label]) => {
        const btn = document.createElement('button');
        btn.className = 'wconv-type-btn' + (key === 'longueurs' ? ' active' : '');
        btn.dataset.ctype = key;
        btn.textContent = label;
        typeBar.appendChild(btn);
    });
    container.appendChild(typeBar);

    // ── Niveau + nb exercices ─────────────────────────────────────────────
    const controlsTop = document.createElement('div');
    controlsTop.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px';
    controlsTop.innerHTML = `
        <div class="wconv-level-btns">
            <button class="wconv-lvl-btn active-facile" data-level="1">🟢 Facile</button>
            <button class="wconv-lvl-btn" data-level="2">🟡 Moyen</button>
            <button class="wconv-lvl-btn" data-level="3">🔴 Difficile</button>
        </div>
        <label style="font-size:10px;font-weight:700;color:#6b7280;white-space:nowrap;">
            Nb : <input type="number" class="wconv-nb-input" value="8" min="2" max="20">
        </label>
    `;
    container.appendChild(controlsTop);

    // ── Tableau de conversion ─────────────────────────────────────────────
    const tableWrap = document.createElement('div');
    tableWrap.className = 'wconv-table-wrap';
    container.appendChild(tableWrap);

    // ── Zone exercices ────────────────────────────────────────────────────
    const exosZone = document.createElement('div');
    exosZone.className = 'wconv-exos-zone';
    exosZone.innerHTML = '<div style="color:#aaa;font-size:11px;text-align:center;padding:20px 0;">Clique sur <b>Générer</b> pour créer des exercices.</div>';
    container.appendChild(exosZone);

    // ── Contrôles bas ─────────────────────────────────────────────────────
    const controlsBot = document.createElement('div');
    controlsBot.className = 'wconv-controls';
    const genBtn  = document.createElement('button');
    genBtn.className = 'wconv-btn wconv-btn-gen';
    genBtn.textContent = '🔄 Générer';
    const corrBtn = document.createElement('button');
    corrBtn.className = 'wconv-btn wconv-btn-corr';
    corrBtn.textContent = '👁 Correction';
    corrBtn.style.display = 'none';
    controlsBot.appendChild(genBtn);
    controlsBot.appendChild(corrBtn);
    container.appendChild(controlsBot);

    // ── Resize handle (coin bas-droit) ────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'wconv-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État ──────────────────────────────────────────────────────────────
    let currentType   = 'longueurs';
    let currentDiff   = 1;
    let currentExos   = [];
    let isShowingCorr = false;
    const nbInput     = controlsTop.querySelector('.wconv-nb-input');
    const levelBadge  = header.querySelector('.wconv-level-badge');

    function updateTypeButtons() {
        typeBar.querySelectorAll('.wconv-type-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.ctype === currentType));
    }

    function updateLevelButtons() {
        const names = { 1: 'facile', 2: 'moyen', 3: 'difficile' };
        const name  = names[currentDiff];
        controlsTop.querySelectorAll('.wconv-lvl-btn').forEach(b => {
            b.className = 'wconv-lvl-btn';
            if (parseInt(b.dataset.level) === currentDiff) b.classList.add('active-' + name);
        });
        levelBadge.className = 'wconv-level-badge show ' + name;
        levelBadge.textContent = name;
    }

    function renderTable() {
        tableWrap.innerHTML = _convBuildTable(currentType);
    }

    // ── Auto-resize input selon le contenu ───────────────────────────────
    function autoResizeInput(inp) {
        const ghost = document.createElement('span');
        const computedFont = window.getComputedStyle(inp).font;
        ghost.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-size:23px;font-weight:700;padding:0 8px;';
        ghost.style.font = computedFont || "700 23px 'MarelleBaton', 'Segoe UI', system-ui, sans-serif";
        ghost.textContent = inp.value || inp.placeholder || '?';
        document.body.appendChild(ghost);
        const newW = Math.max(60, ghost.offsetWidth + 12);
        ghost.remove();
        inp.style.width = newW + 'px';
    }

    function generate() {
        const count = Math.max(2, Math.min(20, parseInt(nbInput.value) || 8));
        currentExos   = _convGenExos(currentType, count, currentDiff);
        isShowingCorr = false;
        renderTable();
        let html = '';
        currentExos.forEach((ex, i) => {
            html += `<div class="wconv-exo-row">
                <span class="wconv-exo-val">${ex.val} ${ex.u1} =</span>
                <input type="text" class="wconv-exo-input" data-index="${i}" placeholder="?">
                <span class="wconv-exo-unit">${ex.u2}</span>
            </div>`;
        });
        exosZone.innerHTML = html;
        exosZone.querySelectorAll('.wconv-exo-input').forEach(inp => {
            inp.addEventListener('mousedown', (e) => e.stopPropagation());
            inp.addEventListener('click',     (e) => { e.stopPropagation(); inp.focus(); });
            inp.addEventListener('input', () => autoResizeInput(inp));
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const next = exosZone.querySelector(`.wconv-exo-input[data-index="${parseInt(inp.dataset.index) + 1}"]`);
                    if (next) next.focus();
                }
            });
            autoResizeInput(inp);
        });
        exosZone.style.maxHeight = '';
        corrBtn.textContent = '👁 Correction';
        corrBtn.classList.remove('revealed');
        corrBtn.style.display = '';
        updateLevelButtons();
        if (typeof saveBoard === 'function') saveBoard();
    }

    function toggleCorrection() {
        const inputs = exosZone.querySelectorAll('.wconv-exo-input');
        if (!isShowingCorr) {
            inputs.forEach(inp => {
                const correct = currentExos[parseInt(inp.dataset.index)].result;
                const userVal = inp.value.trim().replace(/\s/g, '').replace(',', '.');
                const corrVal = correct.replace(/\s/g, '').replace(',', '.');
                const isOk    = userVal !== '' && parseFloat(userVal) === parseFloat(corrVal);
                inp.dataset.status = isOk ? 'done' : 'error';
                inp.className  = 'wconv-exo-input ' + (isOk ? 'correct' : 'wrong');
                inp.value      = correct;
                inp.disabled   = true;
            });
            requestAnimationFrame(() => {
                inputs.forEach(inp => autoResizeInput(inp));
            });
            corrBtn.textContent = '🙈 Masquer';
            corrBtn.classList.add('revealed');
            isShowingCorr = true;
        } else {
            inputs.forEach(inp => {
                if (inp.dataset.status === 'error') {
                    inp.value = ''; inp.className = 'wconv-exo-input'; inp.disabled = false;
                    autoResizeInput(inp);
                }
            });
            corrBtn.textContent = '👁 Correction';
            corrBtn.classList.remove('revealed');
            isShowingCorr = false;
        }
    }

    // ── Listeners UI ─────────────────────────────────────────────────────
    typeBar.querySelectorAll('.wconv-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentType = btn.dataset.ctype;
            updateTypeButtons();
            renderTable();
            if (currentExos.length > 0) generate();
        });
    });
    controlsTop.querySelectorAll('.wconv-lvl-btn').forEach(btn => {
        btn.addEventListener('click', () => { currentDiff = parseInt(btn.dataset.level); updateLevelButtons(); });
    });

    // Correction : On s'assure que l'élément est bien ciblé et on écoute les changements
    if (nbInput) {
        ['input', 'change'].forEach(evt => {
            nbInput.addEventListener(evt, () => {
                generate();
            });
        });
        
        // Empêcher la propagation pour éviter que le drag du widget ne s'active
        // — mousedown pour souris, pointerdown pour stylet / écran tactile
        nbInput.addEventListener('mousedown',   (e) => e.stopPropagation());
        nbInput.addEventListener('pointerdown', (e) => { e.stopPropagation(); nbInput.focus(); });
        nbInput.addEventListener('touchstart',  (e) => { e.stopPropagation(); nbInput.focus(); }, { passive: true });
    }

    genBtn.addEventListener('click', () => generate());
    corrBtn.addEventListener('click', () => { if (currentExos.length > 0) toggleCorrection(); });

    const helpBtn = header.querySelector('.wconv-help-btn');
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!helpPopup.classList.contains('show')) {
            // Positionner en fixed juste sous le bouton
            const rect = helpBtn.getBoundingClientRect();
            helpPopup.style.top  = (rect.bottom + 6) + 'px';
            helpPopup.style.left = Math.max(8, rect.right - 300) + 'px';
        }
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    // ── Resize (coin bas-droit seulement, comme monnaie) ─────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = exosZone.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(320, startW + ev.clientX - startX) + 'px';
            const newH = Math.max(80, startH + ev.clientY - startY);
            exosZone.style.height    = newH + 'px';
            exosZone.style.maxHeight = newH + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; if (typeof saveBoard === 'function') saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0], startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = exosZone.offsetHeight;
        const onMove = (ev) => {
            const t = ev.touches[0];
            container.style.width  = Math.max(320, startW + t.clientX - startX) + 'px';
            const newH = Math.max(80, startH + t.clientY - startY);
            exosZone.style.height    = newH + 'px';
            exosZone.style.maxHeight = newH + 'px';
        };
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            if (typeof saveBoard === 'function') saveBoard();
        };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _savedW = null, _isMax = false;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '📐 Conversion');
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                _savedW = container.style.width;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedW) container.style.width = _savedW;
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

    // ── Init (identique à monnaie) ────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    renderTable();
    updateLevelButtons();

    // ── Exposition pour save-load.js ──────────────────────────────────────
    widget._convGetData = function() {
        return {
            type:       currentType,
            diff:       currentDiff,
            nb:         parseInt(nbInput.value) || 8,
            containerW: container.offsetWidth,
            exosZoneH:  parseInt(exosZone.style.maxHeight) || null
        };
    };
    widget._convSetData = function(data) {
        if (!data) return;
        if (data.type && CONV_UNITS_DATA[data.type]) { currentType = data.type; updateTypeButtons(); }
        if (data.diff) currentDiff = data.diff;
        if (data.nb)   nbInput.value = data.nb;
        if (data.containerW) container.style.width = data.containerW + 'px';
        if (data.exosZoneH)  exosZone.style.maxHeight = data.exosZoneH + 'px';
        generate();
    };

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
