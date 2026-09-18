// =========================================================================
// WIDGET EMPLOI DU TEMPS — Le Bureau du Prof
// Choix des jours d'enseignement, saisie des matières avec horaires,
// grille visuelle proportionnelle à la durée, couleur par matière,
// export PDF.
// Basé sur la structure de widget-plan.js, intégré dans le même système
// widget que celui-ci.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Fonction utilitaire mini-barre collapse (injectée une seule fois, partagée avec les autres widgets)
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;

            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';

            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);

            widget.style.top          = MARGIN_TOP + 'px';
            widget.style.left         = occupiedX + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.zIndex       = '9000';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.display      = 'block';
            widget.style.overflow     = 'hidden';
            widget.style.padding      = '0';

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
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });

            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);

            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation();
                e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup', onUp);
            });

            const curW = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    // CSS partagé boutons fenêtre (injecté une seule fois, partagé avec les autres widgets)
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

    // CSS spécifique au widget emploi du temps (injecté une seule fois)
    if (!document.getElementById('edt-widget-style')) {
        const s = document.createElement('style');
        s.id = 'edt-widget-style';
        s.textContent = `
        .widget[data-type="edt"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .edt-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }

        /* ── En-tête ── */
        .edt-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            cursor: move;
            user-select: none;
        }
        .edt-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        /* ── Barre outils ── */
        .edt-toolbar {
            display: flex;
            gap: 5px;
            align-items: center;
            flex-wrap: wrap;
            position: relative;
        }
        .edt-btn {
            padding: 5px 10px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: #f5f5f5;
            color: #444;
            transition: background .15s, transform .1s;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        .edt-btn:active { transform: scale(0.96); }
        .edt-btn:hover { background: #e8e8e8; }
        .edt-btn-danger { background: #fff0f0; color: #c0392b; border-color: #f5c6c6; }
        .edt-btn-danger:hover { background: #fdd; }
        .edt-sep {
            width: 1px;
            height: 22px;
            background: #e0e0e0;
            flex-shrink: 0;
        }
        .edt-font-ctrl {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            background: #f5f5f5;
        }
        .edt-font-ctrl-icon {
            font-size: 11px;
            font-weight: 800;
            color: #6b7280;
        }
        .edt-font-btn {
            width: 18px;
            height: 18px;
            border-radius: 5px;
            border: 1px solid #d5d5d5;
            background: #fff;
            color: #444;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .edt-font-btn:hover { background: #eee; }
        .edt-font-btn:active { transform: scale(0.92); }
        .edt-font-val {
            font-size: 11px;
            font-weight: 700;
            color: #374151;
            min-width: 16px;
            text-align: center;
        }

        /* ── Menu jours ── */
        .edt-days-menu {
            display: none;
            position: absolute;
            top: 40px;
            left: 0;
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            padding: 10px 14px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            z-index: 300;
            flex-direction: column;
            gap: 7px;
            min-width: 150px;
        }
        .edt-days-menu.show { display: flex; }
        .edt-days-menu-title {
            font-size: 10px;
            font-weight: 800;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: .4px;
            margin-bottom: 2px;
        }
        .edt-days-menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            cursor: pointer;
        }
        .edt-days-menu-item input { cursor: pointer; width: 14px; height: 14px; }

        /* ── Légende matières ── */
        .edt-legend {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .edt-legend-chip {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 2px 9px 2px 6px;
            border-radius: 20px;
            background: #f3f4f6;
            font-size: 10px;
            font-weight: 700;
            color: #4b5563;
        }
        .edt-legend-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        /* ── Zone grille ── */
        .edt-grid-wrap {
            flex: 1;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
            min-height: 200px;
        }
        .edt-days-header {
            display: flex;
            height: 28px;
            flex-shrink: 0;
            border-bottom: 1.5px solid #e5e7eb;
            background: #ffffff;
            margin-bottom: 6px;
        }
        .edt-axis-spacer { width: 40px; flex-shrink: 0; }
        .edt-day-head {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10.5px;
            font-weight: 800;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: .3px;
            border-left: 1px solid #eef0f2;
        }
        .edt-body {
            flex: 1;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .edt-body-inner {
            position: relative;
            display: flex;
            min-height: 100%;
        }
        .edt-axis {
            width: 40px;
            flex-shrink: 0;
            position: relative;
        }
        .edt-hour-label {
            position: absolute;
            left: 0;
            right: 5px;
            text-align: right;
            font-size: 9.5px;
            font-weight: 600;
            color: #9ca3af;
            transform: translateY(-50%);
            pointer-events: none;
        }
        .edt-days {
            flex: 1;
            display: flex;
            position: relative;
        }
        .edt-day-col {
            flex: 1;
            position: relative;
            border-left: 1px solid #eef0f2;
        }
        .edt-grid-lines {
            position: absolute;
            top: 0; bottom: 0; right: 0;
            left: 40px;
            pointer-events: none;
            z-index: 0;
        }
        .edt-grid-line {
            position: absolute;
            left: 0; right: 0;
            height: 1px;
            background: #eef0f2;
        }
        .edt-block {
            position: absolute;
            border-radius: 6px;
            box-sizing: border-box;
            padding: 3px 6px;
            overflow: hidden;
            color: #fff;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.18);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 1;
            transition: filter .1s;
        }
        .edt-block:hover { filter: brightness(1.1); z-index: 2; }
        .edt-block-name {
            font-size: 12px;
            font-weight: 800;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .edt-block-time {
            font-size: 9.5px;
            font-weight: 600;
            opacity: .85;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 1px;
        }
        .edt-empty-msg {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
            pointer-events: none;
        }

        /* ── Modal ajout / édition cours ── */
        .edt-modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(3px);
            align-items: center;
            justify-content: center;
        }
        .edt-modal-overlay.show { display: flex; }
        .edt-modal-box {
            background: #fff;
            border-radius: 16px;
            padding: 22px;
            width: 320px;
            max-width: 92vw;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .edt-modal-box h3 {
            margin: 0 0 14px;
            font-size: 14px;
            font-weight: 800;
            color: #374151;
        }
        .edt-field { margin-bottom: 12px; }
        .edt-field label {
            display: block;
            font-size: 10.5px;
            font-weight: 800;
            color: #6b7280;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: .3px;
        }
        .edt-field select, .edt-field input {
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            outline: none;
            transition: border-color .2s;
            font-family: inherit;
        }
        .edt-field select:focus, .edt-field input:focus { border-color: #4a90e2; }
        .edt-color-hint {
            flex: 1;
            min-width: 0;
            font-size: 10.5px;
            color: #9ca3af;
            line-height: 1.3;
            word-wrap: break-word;
        }
        .edt-modal-days-check {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 7px 10px;
            margin-top: 2px;
        }
        .edt-modal-day-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #374151;
            cursor: pointer;
        }
        .edt-modal-day-item input {
            cursor: pointer;
            width: 14px;
            height: 14px;
            flex-shrink: 0;
        }
        .edt-modal-day-item.edt-day-hidden { color: #b0b5bd; font-weight: 600; }
        .edt-field-row { display: flex; gap: 8px; }
        .edt-field-row .edt-field { flex: 1; margin-bottom: 12px; }
        .edt-color-dot {
            display: inline-block;
            width: 13px;
            height: 13px;
            border-radius: 4px;
            vertical-align: middle;
            margin-left: 7px;
            border: 1px solid rgba(0,0,0,0.15);
        }
        .edt-modal-btns { display: flex; gap: 8px; margin-top: 6px; }
        .edt-modal-cancel {
            flex: 1;
            padding: 9px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            background: #f5f5f5;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }
        .edt-modal-ok {
            flex: 1;
            padding: 9px;
            border-radius: 8px;
            border: none;
            background: #4a90e2;
            color: white;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }
        .edt-modal-ok:hover { background: #357abd; }
        .edt-modal-delete {
            padding: 9px 12px;
            border-radius: 8px;
            border: 1px solid #f5c6c6;
            background: #fff0f0;
            color: #c0392b;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }
        .edt-modal-delete:hover { background: #fdd; }

        /* ── Resize handle ── */
        .edt-resize-handle {
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
        .edt-container:hover .edt-resize-handle { opacity: 1; }

        /* ── État réduit ── */
        .edt-container.wf-minimized > *:not(.edt-header) { display: none !important; }
        .edt-container.wf-minimized { gap: 0; }

        /* ── État plein écran board ── */
        .edt-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
        }
        `;
        document.head.appendChild(s);
    }
})();

// ── Constantes emploi du temps ──────────────────────────────────────────
const EDT_DAYS_ALL = [
    { key: 'lundi',     label: 'Lundi'     },
    { key: 'mardi',     label: 'Mardi'     },
    { key: 'mercredi',  label: 'Mercredi'  },
    { key: 'jeudi',     label: 'Jeudi'     },
    { key: 'vendredi',  label: 'Vendredi'  },
    { key: 'samedi',    label: 'Samedi'    },
    { key: 'dimanche',  label: 'Dimanche'  },
];
const EDT_DEFAULT_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'];

const EDT_PALETTE = [
    '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
    '#06b6d4', '#f43f5e', '#8b5cf6', '#10b981', '#0ea5e9',
];

function edtDefaultData() {
    return { days: EDT_DEFAULT_DAYS.slice(), courses: [], colors: {} };
}

function edtParseTime(t) {
    if (!t || typeof t !== 'string') return 0;
    const parts = t.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
}

// Choisit une couleur de texte (clair ou foncé) lisible sur une couleur de fond donnée
function edtContrastColor(hex) {
    if (!hex) return '#ffffff';
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return '#ffffff';
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000; // luminance perçue
    return yiq >= 150 ? '#1f2937' : '#ffffff';
}

function edtAssignColor(data, name) {
    const key = (name || '').trim().toLowerCase();
    if (!key) return '#9ca3af';
    if (data.colors[key]) return data.colors[key];
    const used = Object.keys(data.colors).length;
    const color = EDT_PALETTE[used % EDT_PALETTE.length];
    data.colors[key] = color;
    return color;
}

function edtEscapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Répartit en colonnes les cours d'une même journée qui se chevauchent dans le temps.
// Le nombre de colonnes est calculé séparément pour chaque groupe de cours qui se
// chevauchent réellement (pas pour toute la journée) : un cours seul sur son créneau
// garde toute la largeur, même si un autre créneau de la même journée est partagé.
function edtLayoutOverlaps(courses) {
    const sorted = courses.slice().sort((a, b) => edtParseTime(a.start) - edtParseTime(b.start));
    let i = 0;
    while (i < sorted.length) {
        // Constituer le groupe de cours qui se chevauchent (en chaîne) à partir de i
        let clusterEnd = edtParseTime(sorted[i].end);
        let j = i + 1;
        while (j < sorted.length && edtParseTime(sorted[j].start) < clusterEnd) {
            clusterEnd = Math.max(clusterEnd, edtParseTime(sorted[j].end));
            j++;
        }
        const cluster = sorted.slice(i, j);
        const colsEnd = []; // fin (min) du dernier cours placé dans chaque colonne, pour ce groupe
        cluster.forEach(c => {
            const s = edtParseTime(c.start);
            let placed = false;
            for (let k = 0; k < colsEnd.length; k++) {
                if (colsEnd[k] <= s) { colsEnd[k] = edtParseTime(c.end); c._col = k; placed = true; break; }
            }
            if (!placed) { colsEnd.push(edtParseTime(c.end)); c._col = colsEnd.length - 1; }
        });
        const totalCols = Math.max(colsEnd.length, 1);
        cluster.forEach(c => { c._totalCols = totalCols; });
        i = j;
    }
    return sorted;
}

// ── Création du widget ────────────────────────────────────────────────────
function createEdtWidget() {
    snapshotNow();
    const pos = findFreePosition();
    const uid = 'edt' + Date.now() + Math.floor(Math.random() * 1000);

    let edtData = edtDefaultData();
    let editingCourseId = null;

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'edt';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:100px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
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
    `;

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'edt-container';

    const initW = Math.min(Math.round(window.innerWidth * 0.75), 780);
    const initH = Math.round(initW * 0.62);
    container.style.width  = initW + 'px';
    container.style.height = initH + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'edt-header';
    header.innerHTML = `
        <span class="edt-title">🗓️ Emploi du temps</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);

    // ── Barre d'outils ────────────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.className = 'edt-toolbar';

    // Bouton jours (avec menu déroulant)
    const daysWrapper = document.createElement('div');
    daysWrapper.style.position = 'relative';

    const btnDays = document.createElement('button');
    btnDays.className = 'edt-btn';
    btnDays.title = 'Choisir les jours d\'enseignement';
    btnDays.innerHTML = '📅 Jours';

    const daysMenu = document.createElement('div');
    daysMenu.className = 'edt-days-menu';
    daysMenu.innerHTML = `<div class="edt-days-menu-title">Jours enseignés</div>` +
        EDT_DAYS_ALL.map(d => `
            <label class="edt-days-menu-item">
                <input type="checkbox" data-day="${d.key}">
                ${d.label}
            </label>
        `).join('');

    daysWrapper.appendChild(btnDays);
    daysWrapper.appendChild(daysMenu);

    const btnAdd = document.createElement('button');
    btnAdd.className = 'edt-btn';
    btnAdd.title = 'Ajouter un cours';
    btnAdd.innerHTML = '➕ Ajouter un cours';

    const sep1 = document.createElement('div');
    sep1.className = 'edt-sep';

    const btnClear = document.createElement('button');
    btnClear.className = 'edt-btn edt-btn-danger';
    btnClear.title = 'Effacer tout l\'emploi du temps';
    btnClear.innerHTML = '🗑️ Tout effacer';

    const sep2 = document.createElement('div');
    sep2.className = 'edt-sep';

    // Bouton export JSON (sauvegarder le fichier pour le réutiliser ailleurs)
    const btnExportJson = document.createElement('button');
    btnExportJson.className = 'edt-btn';
    btnExportJson.title = 'Sauvegarder l\'emploi du temps en fichier (à réutiliser sur un autre ordinateur)';
    btnExportJson.textContent = '💾 Sauvegarder';

    // Bouton import JSON (charger un fichier précédemment sauvegardé)
    const btnImportJson = document.createElement('button');
    btnImportJson.className = 'edt-btn';
    btnImportJson.title = 'Charger un emploi du temps depuis un fichier sauvegardé';
    btnImportJson.textContent = '📂 Charger';

    // Input fichier JSON caché
    const fileInputJson = document.createElement('input');
    fileInputJson.type = 'file';
    fileInputJson.accept = '.json';
    fileInputJson.style.display = 'none';
    container.appendChild(fileInputJson);

    const sep3 = document.createElement('div');
    sep3.className = 'edt-sep';

    const btnExportPdf = document.createElement('button');
    btnExportPdf.className = 'edt-btn';
    btnExportPdf.title = 'Exporter l\'emploi du temps en PDF';
    btnExportPdf.textContent = '🖨️ PDF';

    toolbar.appendChild(daysWrapper);
    toolbar.appendChild(btnAdd);
    toolbar.appendChild(sep1);
    toolbar.appendChild(btnClear);
    toolbar.appendChild(sep2);
    toolbar.appendChild(btnExportJson);
    toolbar.appendChild(btnImportJson);
    toolbar.appendChild(sep3);
    toolbar.appendChild(btnExportPdf);
    container.appendChild(toolbar);

    // ── Légende matières ──────────────────────────────────────────────────
    // ── Zone grille ───────────────────────────────────────────────────────
    const gridWrap = document.createElement('div');
    gridWrap.className = 'edt-grid-wrap';

    const daysHeader = document.createElement('div');
    daysHeader.className = 'edt-days-header';

    const body = document.createElement('div');
    body.className = 'edt-body';

    const bodyInner = document.createElement('div');
    bodyInner.className = 'edt-body-inner';

    const axis = document.createElement('div');
    axis.className = 'edt-axis';

    const gridLines = document.createElement('div');
    gridLines.className = 'edt-grid-lines';

    const daysBody = document.createElement('div');
    daysBody.className = 'edt-days';

    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'edt-empty-msg';
    emptyMsg.textContent = 'Aucun cours. Cliquez sur ➕ Ajouter un cours pour commencer.';

    bodyInner.appendChild(axis);
    bodyInner.appendChild(gridLines);
    bodyInner.appendChild(daysBody);
    body.appendChild(bodyInner);
    body.appendChild(emptyMsg);
    gridWrap.appendChild(daysHeader);
    gridWrap.appendChild(body);
    container.appendChild(gridWrap);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'edt-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Modal ajout / édition d'un cours ───────────────────────────────────
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'edt-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="edt-modal-box">
            <h3 class="edt-modal-title">Ajouter un cours</h3>
            <div class="edt-field">
                <label>Jour(s)</label>
                <div class="edt-modal-days-check"></div>
            </div>
            <div class="edt-field">
                <label>Matière / activité</label>
                <input type="text" class="edt-modal-name" list="${uid}-subjects" placeholder="Ex : Mathématiques" maxlength="40">
                <datalist id="${uid}-subjects"></datalist>
            </div>
            <div class="edt-field">
                <label>Couleur</label>
                <div style="display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;">
                    <div class="cpick-wrap" id="cpick-${uid}-course-color">
                        <div class="cpick-swatch" style="background:#3b82f6;width:32px;height:32px;border-radius:8px;border:2px solid #e0e0e0;cursor:pointer;flex-shrink:0;"></div>
                        <div class="cpick-popup" id="cpick-pop-${uid}-course-color" style="z-index:100000;"></div>
                    </div>
                    <span class="edt-color-hint">S'applique à tous les cours de cette matière</span>
                </div>
            </div>
            <div class="edt-field-row">
                <div class="edt-field">
                    <label>Heure de début</label>
                    <input type="time" class="edt-modal-start" value="08:30">
                </div>
                <div class="edt-field">
                    <label>Heure de fin</label>
                    <input type="time" class="edt-modal-end" value="09:30">
                </div>
            </div>
            <div class="edt-field">
                <label>Taille du texte</label>
                <div class="edt-font-ctrl">
                    <span class="edt-font-ctrl-icon">Aa</span>
                    <button class="edt-font-btn edt-font-minus" type="button">−</button>
                    <span class="edt-font-val">12</span>
                    <button class="edt-font-btn edt-font-plus" type="button">+</button>
                </div>
            </div>
            <div class="edt-field">
                <label class="edt-modal-day-item" style="font-size:10.5px;font-weight:600;color:#6b7280;">
                    <input type="checkbox" class="edt-modal-show-time" checked>
                    afficher les horaires entre parenthèses
                </label>
            </div>
            <div class="edt-modal-btns">
                <button class="edt-modal-delete" style="display:none">Supprimer</button>
                <button class="edt-modal-cancel">Annuler</button>
                <button class="edt-modal-ok">Enregistrer</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const modalTitle      = modalOverlay.querySelector('.edt-modal-title');
    const modalDaysCheck   = modalOverlay.querySelector('.edt-modal-days-check');
    const modalName         = modalOverlay.querySelector('.edt-modal-name');
    const modalStart          = modalOverlay.querySelector('.edt-modal-start');
    const modalEnd              = modalOverlay.querySelector('.edt-modal-end');
    const modalSubjectsDL        = modalOverlay.querySelector(`#${uid}-subjects`);
    const modalDelete             = modalOverlay.querySelector('.edt-modal-delete');
    const modalCancel              = modalOverlay.querySelector('.edt-modal-cancel');
    const modalOk                    = modalOverlay.querySelector('.edt-modal-ok');

    // ── Taille du texte du cours (propre à chaque cours) ───────────────────
    const EDT_FONT_MIN = 8, EDT_FONT_MAX = 22;
    const modalFontMinus = modalOverlay.querySelector('.edt-font-minus');
    const modalFontPlus  = modalOverlay.querySelector('.edt-font-plus');
    const modalFontVal   = modalOverlay.querySelector('.edt-font-val');
    function setModalFontSize(size) {
        modalFontVal.textContent = Math.max(EDT_FONT_MIN, Math.min(EDT_FONT_MAX, size));
    }
    function getModalFontSize() {
        return parseInt(modalFontVal.textContent, 10) || 12;
    }
    modalFontMinus.addEventListener('click', (e) => { e.stopPropagation(); setModalFontSize(getModalFontSize() - 1); });
    modalFontPlus.addEventListener('click', (e) => { e.stopPropagation(); setModalFontSize(getModalFontSize() + 1); });

    const modalShowTime = modalOverlay.querySelector('.edt-modal-show-time');

    // ── Sélecteur de couleur (color-picker.js, grille + hex + natif) ──────
    const cpickId = uid + '-course-color';
    const colorSwatch = modalOverlay.querySelector(`#cpick-${cpickId} .cpick-swatch`);

    let colorTouched = false; // true dès que l'utilisateur ouvre/modifie lui-même la couleur
    colorSwatch.addEventListener('click', () => {
        colorTouched = true;
        if (typeof cpickOpen === 'function') cpickOpen(cpickId, colorSwatch);
    });

    function setModalColor(color) {
        if (typeof cpickSet === 'function') {
            cpickSet(cpickId, color, false);
        } else {
            colorSwatch.style.background = color; // secours si color-picker.js absent
        }
    }
    function getModalColor() {
        if (typeof cpickGetValue === 'function') {
            const v = cpickGetValue(cpickId);
            if (v) return v;
        }
        return colorSwatch.style.background || '#3b82f6';
    }

    function activeDaysList() {
        return EDT_DAYS_ALL.filter(d => edtData.days.includes(d.key));
    }

    // checkedDays : tableau des jours à cocher par défaut à l'ouverture (ex : ['lundi'] ou [] )
    function refreshModalDayOptions(checkedDays) {
        checkedDays = checkedDays || [];
        let list = activeDaysList();
        // Si on édite un cours dont le jour a été démasqué depuis, on le rajoute quand même
        checkedDays.forEach(dayKey => {
            if (!list.find(d => d.key === dayKey)) {
                const d0 = EDT_DAYS_ALL.find(d => d.key === dayKey);
                if (d0) list = list.concat([d0]);
            }
        });
        modalDaysCheck.innerHTML = list.map(d => {
            const hidden = !edtData.days.includes(d.key);
            const checked = checkedDays.includes(d.key) ? 'checked' : '';
            return `
                <label class="edt-modal-day-item${hidden ? ' edt-day-hidden' : ''}">
                    <input type="checkbox" value="${d.key}" ${checked}>
                    ${d.label}${hidden ? ' (masqué)' : ''}
                </label>
            `;
        }).join('');
    }

    function getCheckedDays() {
        return Array.from(modalDaysCheck.querySelectorAll('input:checked')).map(cb => cb.value);
    }

    function refreshSubjectsDatalist() {
        const seen = {};
        const names = [];
        edtData.courses.forEach(c => {
            const key = c.name.trim().toLowerCase();
            if (!seen[key]) { seen[key] = true; names.push(c.name); }
        });
        modalSubjectsDL.innerHTML = names.map(n => `<option value="${edtEscapeHtml(n)}"></option>`).join('');
    }

    // Couleur déjà utilisée pour cette matière, ou prochaine couleur libre de la palette
    function suggestColorFor(name) {
        const key = name.trim().toLowerCase();
        if (key && edtData.colors[key]) return edtData.colors[key];
        const used = Object.keys(edtData.colors).length;
        return EDT_PALETTE[used % EDT_PALETTE.length];
    }

    modalName.addEventListener('input', () => {
        if (!colorTouched) setModalColor(suggestColorFor(modalName.value));
    });

    function openAddModal() {
        if (edtData.days.length === 0) {
            alert('Choisis d\'abord au moins un jour d\'enseignement avec le bouton 📅 Jours.');
            return;
        }
        editingCourseId = null;
        colorTouched = false;
        modalTitle.textContent = 'Ajouter un cours';
        refreshModalDayOptions([edtData.days[0]]);
        modalName.value = '';
        setModalColor(suggestColorFor(''));
        modalStart.value = '08:30';
        modalEnd.value = '09:30';
        setModalFontSize(12);
        modalShowTime.checked = true;
        modalDelete.style.display = 'none';
        refreshSubjectsDatalist();
        modalOverlay.classList.add('show');
        setTimeout(() => modalName.focus(), 80);
    }

    function openEditModal(course) {
        editingCourseId = course.id;
        colorTouched = false;
        modalTitle.textContent = 'Modifier ce cours';
        refreshModalDayOptions([course.day]);
        modalName.value = course.name;
        setModalColor(suggestColorFor(course.name));
        modalStart.value = course.start;
        modalEnd.value = course.end;
        setModalFontSize(course.fontSize || 12);
        modalShowTime.checked = course.showTime !== false;
        modalDelete.style.display = 'inline-block';
        refreshSubjectsDatalist();
        modalOverlay.classList.add('show');
    }

    function closeModal() { modalOverlay.classList.remove('show'); }

    modalCancel.addEventListener('click', closeModal);
    modalOverlay.addEventListener('mousedown', (e) => { if (e.target === modalOverlay) closeModal(); });

    modalOk.addEventListener('click', () => {
        const name = modalName.value.trim();
        const days = getCheckedDays();
        const start = modalStart.value;
        const end = modalEnd.value;
        const fontSize = getModalFontSize();
        const showTime = modalShowTime.checked;
        if (!name) { alert('Indique le nom de la matière ou de l\'activité.'); return; }
        if (days.length === 0) { alert('Coche au moins un jour.'); return; }
        if (!start || !end) { alert('Indique une heure de début et une heure de fin.'); return; }
        if (edtParseTime(end) <= edtParseTime(start)) { alert('L\'heure de fin doit être après l\'heure de début.'); return; }

        // La couleur choisie s'applique à toutes les occurrences de cette matière
        edtData.colors[name.toLowerCase()] = getModalColor();

        // En édition : on retire l'ancien cours puis on recrée une entrée par jour coché
        // (permet, en éditant, d'étendre ou de réduire le nombre de jours concernés)
        if (editingCourseId) {
            edtData.courses = edtData.courses.filter(c => c.id !== editingCourseId);
        }
        days.forEach((day, i) => {
            edtData.courses.push({ id: 'c' + Date.now() + i + Math.floor(Math.random() * 1000), day, name, start, end, fontSize, showTime });
        });

        closeModal();
        drawEdt();
        saveBoard();
    });

    modalDelete.addEventListener('click', () => {
        if (!editingCourseId) return;
        if (!window.confirm('Supprimer ce cours de l\'emploi du temps ?')) return;
        edtData.courses = edtData.courses.filter(c => c.id !== editingCourseId);
        closeModal();
        drawEdt();
        saveBoard();
    });

    // ── Menu jours ────────────────────────────────────────────────────────
    btnDays.addEventListener('click', (e) => {
        e.stopPropagation();
        EDT_DAYS_ALL.forEach(d => {
            const cb = daysMenu.querySelector(`input[data-day="${d.key}"]`);
            if (cb) cb.checked = edtData.days.includes(d.key);
        });
        daysMenu.classList.toggle('show');
    });
    daysMenu.addEventListener('click', (e) => e.stopPropagation());
    daysMenu.addEventListener('change', (e) => {
        const cb = e.target.closest('input[data-day]');
        if (!cb) return;
        const key = cb.dataset.day;
        if (cb.checked) {
            if (!edtData.days.includes(key)) edtData.days.push(key);
        } else {
            edtData.days = edtData.days.filter(k => k !== key);
        }
        drawEdt();
        saveBoard();
    });
    document.addEventListener('click', () => daysMenu.classList.remove('show'));

    btnAdd.addEventListener('click', (e) => { e.stopPropagation(); openAddModal(); });

    btnClear.addEventListener('click', (e) => {
        e.stopPropagation();
        if (edtData.courses.length === 0) return;
        if (!window.confirm('Effacer tous les cours de l\'emploi du temps ?')) return;
        edtData.courses = [];
        drawEdt();
        saveBoard();
    });

    // ── Applique un jeu de données (import fichier ou restauration) ────────
    function _applyEdtData(data) {
        edtData = Object.assign(edtDefaultData(), data);
        if (!Array.isArray(edtData.days)) edtData.days = EDT_DEFAULT_DAYS.slice();
        if (!Array.isArray(edtData.courses)) edtData.courses = [];
        if (!edtData.colors || typeof edtData.colors !== 'object') edtData.colors = {};
        drawEdt();
    }

    // ── Export / Import fichier JSON (pour réutiliser sur un autre ordinateur) ─
    btnExportJson.addEventListener('click', (e) => {
        e.stopPropagation();
        const exportData = {
            _type: 'lebureauduprof-edt',
            _version: 1,
            exportedAt: Date.now(),
            data: edtData
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const fileName = _getFileName('json');
        // Support Android (WebView)
        if (window.Android && window.Android.savePdfFromBase64) {
            const reader = new FileReader();
            reader.onload = () => {
                const b64 = reader.result.split(',')[1];
                window.Android.savePdfFromBase64(b64, fileName);
            };
            reader.readAsDataURL(blob);
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
    });

    btnImportJson.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInputJson.value = '';
        fileInputJson.click();
    });

    fileInputJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                const data = (parsed && parsed._type === 'lebureauduprof-edt' && parsed.data) ? parsed.data
                    : (parsed && Array.isArray(parsed.days) && Array.isArray(parsed.courses)) ? parsed
                    : null;
                if (!data) { alert('Fichier non reconnu. Choisis un fichier exporté depuis ce widget.'); return; }
                if (edtData.courses.length > 0 && !window.confirm(
                    'Remplacer l\'emploi du temps actuel par le fichier importé ?'
                )) return;
                _applyEdtData(data);
                saveBoard();
            } catch (err) {
                alert('Erreur lors de la lecture du fichier.');
            }
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    });

    // ── Calcul de la plage horaire affichée ─────────────────────────────────
    function computeRange() {
        let startMin = 8 * 60, endMin = 17 * 60; // valeurs par défaut si aucun cours saisi
        if (edtData.courses.length > 0) {
            let minStart = Infinity, maxEnd = -Infinity;
            edtData.courses.forEach(c => {
                const s = edtParseTime(c.start), e = edtParseTime(c.end);
                if (s < minStart) minStart = s;
                if (e > maxEnd) maxEnd = e;
            });
            startMin = minStart;
            endMin = maxEnd;
        }
        return { startMin, endMin };
    }

    // Formate une minute absolue en libellé horaire ("8h" ou "8h30")
    function edtFormatMinuteLabel(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return m === 0 ? (h + 'h') : (h + 'h' + String(m).padStart(2, '0'));
    }

    // Détermine combien de pixels représente 1 minute, en se basant sur la durée
    // du cours le plus court, pour garantir qu'aucune case n'a besoin d'être
    // "gonflée" au-delà de sa vraie place (donc plus aucun chevauchement).
    const EDT_FREE_PX_PER_MIN = 0.3; // échelle fixe pour les plages libres pour tous les jours
    const EDT_BUSY_PX_PER_MIN = 1.6; // échelle fixe pour les plages avec cours
    function computePxPerMin() {
        return EDT_BUSY_PX_PER_MIN;
    }

    // Construit les segments de la plage horaire : "occupé" (au moins un cours ce
    // jour-là) à l'échelle normale, "libre" (aucun cours, tous jours confondus)
    // à une échelle réduite.
    function computeScaleSegments(startMin, endMin) {
        const activeDayKeys = activeDaysList().map(d => d.key);
        const intervals = [];
        edtData.courses.forEach(c => {
            if (!activeDayKeys.includes(c.day)) return;
            const s = Math.max(edtParseTime(c.start), startMin);
            const e = Math.min(edtParseTime(c.end), endMin);
            if (e > s) intervals.push([s, e]);
        });
        intervals.sort((a, b) => a[0] - b[0]);
        const busy = [];
        intervals.forEach(iv => {
            if (busy.length && iv[0] <= busy[busy.length - 1][1]) {
                busy[busy.length - 1][1] = Math.max(busy[busy.length - 1][1], iv[1]);
            } else {
                busy.push(iv.slice());
            }
        });

        const busyPxPerMin = computePxPerMin();
        const segments = [];
        let cursor = startMin;
        busy.forEach(iv => {
            if (iv[0] > cursor) segments.push({ start: cursor, end: iv[0], pxPerMin: EDT_FREE_PX_PER_MIN });
            segments.push({ start: iv[0], end: iv[1], pxPerMin: busyPxPerMin });
            cursor = iv[1];
        });
        if (cursor < endMin) segments.push({ start: cursor, end: endMin, pxPerMin: EDT_FREE_PX_PER_MIN });
        if (segments.length === 0) segments.push({ start: startMin, end: endMin, pxPerMin: EDT_FREE_PX_PER_MIN });
        return segments;
    }

    // Convertit une minute absolue en position pixel, en tenant compte des segments à échelle variable
    function edtMinuteToPx(minute, segments) {
        let px = 0;
        for (const seg of segments) {
            if (minute >= seg.end) {
                px += (seg.end - seg.start) * seg.pxPerMin;
            } else if (minute > seg.start) {
                px += (minute - seg.start) * seg.pxPerMin;
                break;
            } else {
                break;
            }
        }
        return px;
    }

    let _edtRedrawScheduled = false;
    function scheduleRedraw() {
        if (_edtRedrawScheduled) return;
        _edtRedrawScheduled = true;
        requestAnimationFrame(() => { _edtRedrawScheduled = false; drawEdt(); });
    }
    if (window.ResizeObserver) {
        new ResizeObserver(() => scheduleRedraw()).observe(body);
    }

    // ── Rendu de la grille ────────────────────────────────────────────────
    function drawEdt() {
        const activeDays = activeDaysList();

        daysHeader.innerHTML = '';
        daysBody.innerHTML = '';
        axis.innerHTML = '';
        gridLines.innerHTML = '';

        if (activeDays.length === 0) {
            emptyMsg.textContent = 'Aucun jour d\'enseignement sélectionné. Clique sur 📅 Jours pour en choisir.';
            emptyMsg.style.display = 'flex';
            bodyInner.style.height = '';
            return;
        }
        if (edtData.courses.length === 0) {
            emptyMsg.textContent = 'Aucun cours. Cliquez sur ➕ Ajouter un cours pour commencer.';
            emptyMsg.style.display = 'flex';
        } else {
            emptyMsg.style.display = 'none';
        }

        // En-têtes des jours
        const axisSpacer = document.createElement('div');
        axisSpacer.className = 'edt-axis-spacer';
        daysHeader.appendChild(axisSpacer);
        activeDays.forEach(d => {
            const h = document.createElement('div');
            h.className = 'edt-day-head';
            h.textContent = d.label;
            daysHeader.appendChild(h);
        });

        // Échelle : pixels réels par segment (plages libres compressées à 0,25 px/min)
        const { startMin, endMin } = computeRange();
        const segments = computeScaleSegments(startMin, endMin);
        const contentH = edtMinuteToPx(endMin, segments);
        const availH = body.clientHeight || 200;
        bodyInner.style.height = Math.max(contentH, availH) + 'px';

        // Axe horaire + lignes de grille : heure exacte de début/fin, bornes de chaque
        // plage libre partagée par tous les jours (ex : pause méridienne), et heures
        // pleines à l'intérieur des plages occupées uniquement (pas dans les plages libres).
        const marks = new Map(); // minute -> libellé (Map pour dédoublonner)
        marks.set(startMin, edtFormatMinuteLabel(startMin));
        marks.set(endMin, edtFormatMinuteLabel(endMin));
        segments.forEach(seg => {
            marks.set(seg.start, edtFormatMinuteLabel(seg.start));
            marks.set(seg.end, edtFormatMinuteLabel(seg.end));
        });
        function isInsideFreeSegment(min) {
            return segments.some(seg => seg.pxPerMin === EDT_FREE_PX_PER_MIN && min > seg.start + 0.5 && min < seg.end - 0.5);
        }
        for (let h = Math.ceil(startMin / 60); h <= Math.floor(endMin / 60); h++) {
            const hMin = h * 60;
            if (hMin > startMin + 0.5 && hMin < endMin - 0.5 && !isInsideFreeSegment(hMin)) {
                marks.set(hMin, edtFormatMinuteLabel(hMin));
            }
        }
        Array.from(marks.keys()).sort((a, b) => a - b).forEach(min => {
            const topPx = edtMinuteToPx(min, segments);
            const lab = document.createElement('div');
            lab.className = 'edt-hour-label';
            lab.style.top = topPx + 'px';
            // Le tout premier et le tout dernier repère ne doivent pas être centrés
            // sur la ligne (sinon la moitié du texte est coupée en haut/bas de la grille)
            if (min === startMin) lab.style.transform = 'translateY(0)';
            else if (min === endMin) lab.style.transform = 'translateY(-100%)';
            lab.textContent = marks.get(min);
            axis.appendChild(lab);
            const line = document.createElement('div');
            line.className = 'edt-grid-line';
            line.style.top = topPx + 'px';
            gridLines.appendChild(line);
        });

        // Colonnes des jours + cours
        activeDays.forEach(d => {
            const col = document.createElement('div');
            col.className = 'edt-day-col';
            const dayCourses = edtLayoutOverlaps(edtData.courses.filter(c => c.day === d.key));
            dayCourses.forEach(c => {
                const s = edtParseTime(c.start), e = edtParseTime(c.end);
                const topPx = edtMinuteToPx(s, segments);
                const heightPx = edtMinuteToPx(e, segments) - topPx;
                const gap = 1.5; // % d'espacement entre colonnes superposées
                const width = (100 / c._totalCols);
                const left = c._col * width;
                const block = document.createElement('div');
                block.className = 'edt-block';
                block.style.top = topPx + 'px';
                block.style.height = heightPx + 'px';
                block.style.left = left + '%';
                block.style.width = `calc(${width}% - ${gap}px)`;
                block.style.background = edtAssignColor(edtData, c.name);
                block.style.color = edtContrastColor(edtAssignColor(edtData, c.name));
                block.title = `${c.name} — ${c.start} à ${c.end}`;
                const nameSize = c.fontSize || 12;
                const timeSize = Math.max(6, nameSize - 5);
                // On n'affiche les horaires (sous le nom) que si la case est assez haute
                // pour les deux lignes ; sinon, seul le nom (centré) est affiché.
                const neededForTwoLines = nameSize * 1.15 + timeSize * 1.15 + 7; // + marge/padding approximative
                const canShowTime = (c.showTime !== false) && heightPx >= neededForTwoLines;
                const timeHtml = canShowTime
                    ? `<div class="edt-block-time" style="font-size:${timeSize}px">(${c.start}–${c.end})</div>`
                    : '';
                block.innerHTML = `<div class="edt-block-name" style="font-size:${nameSize}px">${edtEscapeHtml(c.name)}</div>${timeHtml}`;
                block.addEventListener('click', (e2) => { e2.stopPropagation(); openEditModal(c); });
                col.appendChild(block);
            });
            daysBody.appendChild(col);
        });
    }

    // ── Export PDF ────────────────────────────────────────────────────────
    function _getFileName(ext) {
        const d = new Date();
        const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        const nomProf = (localStorage.getItem('nom_enseignant') || 'classe')
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        return `emploi_du_temps_${nomProf}_${dateStr}.${ext}`;
    }

    btnExportPdf.addEventListener('click', (e) => {
        e.stopPropagation();
        btnExportPdf.textContent = '⏳';
        btnExportPdf.disabled = true;

        function _doExportPdf() {
            toolbar.style.visibility = 'hidden';
            resizeHandle.style.visibility = 'hidden';
            daysMenu.classList.remove('show');

            // La grille peut être plus haute que la zone visible (scroll) : on la déplie
            // entièrement le temps de la capture pour que le PDF contienne tout.
            const origContainerH = container.style.height;
            const origGridWrapH  = gridWrap.style.height;
            const origGridWrapOf = gridWrap.style.overflow;
            const origBodyH      = body.style.height;
            const origBodyOf     = body.style.overflow;

            container.style.height = 'auto';
            gridWrap.style.height = 'auto';
            gridWrap.style.overflow = 'visible';
            body.style.overflow = 'visible';
            body.style.height = bodyInner.offsetHeight + 'px';

            const restore = () => {
                toolbar.style.visibility = '';
                resizeHandle.style.visibility = '';
                container.style.height = origContainerH;
                gridWrap.style.height = origGridWrapH;
                gridWrap.style.overflow = origGridWrapOf;
                body.style.height = origBodyH;
                body.style.overflow = origBodyOf;
                btnExportPdf.textContent = '🖨️ PDF';
                btnExportPdf.disabled = false;
            };

            window.html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            }).then((canvas) => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('l', 'mm', 'a4');
                const pageW = 297, pageH = 210;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text('EMPLOI DU TEMPS', pageW / 2, 14, { align: 'center' });

                const marginX = 12, top = 20, bottomMargin = 10;
                const maxW = pageW - marginX * 2;
                const maxH = pageH - top - bottomMargin;
                const ratio = canvas.width / canvas.height;
                let imgW = maxW, imgH = imgW / ratio;
                if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio; }
                const imgX = (pageW - imgW) / 2;

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                doc.addImage(imgData, 'JPEG', imgX, top, imgW, imgH);

                const fileName = _getFileName('pdf');
                if (window.Android && window.Android.savePdfFromBase64) {
                    const b64 = doc.output('datauristring').split(',')[1];
                    window.Android.savePdfFromBase64(b64, fileName);
                } else {
                    doc.save(fileName);
                }
                restore();
            }).catch(() => {
                alert('Erreur lors de la génération du PDF.');
                restore();
            });
        }

        function _ensureJsPdf(cb) {
            if (window.jspdf && window.jspdf.jsPDF) { cb(); return; }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = cb;
            script.onerror = () => {
                alert('Impossible de charger jsPDF. Vérifiez votre connexion internet.');
                btnExportPdf.textContent = '🖨️ PDF';
                btnExportPdf.disabled = false;
            };
            document.head.appendChild(script);
        }

        if (window.html2canvas) {
            _ensureJsPdf(_doExportPdf);
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => _ensureJsPdf(_doExportPdf);
            script.onerror = () => {
                alert('Impossible de charger html2canvas. Vérifiez votre connexion internet.');
                btnExportPdf.textContent = '🖨️ PDF';
                btnExportPdf.disabled = false;
            };
            document.head.appendChild(script);
        }
    });

    // ── Resize handle ─────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(340, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(220, startH + ev.clientY - startY) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            container.style.width  = Math.max(340, startW + t.clientX - startX) + 'px';
            container.style.height = Math.max(220, startH + t.clientY - startY) + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedW = null, _savedH = null;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🗓️ Emploi du temps', {});
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
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
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            modalOverlay.remove();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Init widget ───────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Premier rendu
    requestAnimationFrame(() => requestAnimationFrame(() => {
        drawEdt();
    }));

    // ── Exposition pour save-load.js ────────────────────────────────────────
    Object.defineProperty(widget, '_edtData', { get: () => edtData });
    widget._setEdtData = function (data) {
        if (data && typeof data === 'object') _applyEdtData(data);
    };

    saveBoard();
    return widget;
}

// ── Hook createWidget — intercepter le type 'edt' ──────────────────────────
(function patchCreateWidgetForEdt() {
    function doPatch() {
        const _orig = window.createWidget;
        if (typeof _orig !== 'function') return;
        window.createWidget = function (type) {
            if (type === 'edt') return window.createEdtWidget();
            return _orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') doPatch();
    else document.addEventListener('DOMContentLoaded', doPatch);
})();
