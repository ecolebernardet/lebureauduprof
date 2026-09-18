// =========================================================================
// WIDGET HEURE — Le Bureau du Prof
// 8 horloges à lire OU 6 calculs de durées
// 3 niveaux de précision : facile / moyen / difficile
// L'utilisateur choisit le mode (lecture / durée) via des boutons bascule
// Choix de la période : matin / après-midi
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
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
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
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown',   e => e.stopPropagation());
            expandBtn.addEventListener('click', e => {
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
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', e => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
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

    if (document.getElementById('wh-style')) return;
    const s = document.createElement('style');
    s.id = 'wh-style';
    s.textContent = `
        @font-face {
            font-family: 'MarelleBaton';
            src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        .widget[data-type="heure"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .heure-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px 52px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .heure-container input { user-select: text; -webkit-user-select: text; }

        .heure-header {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: move;
            user-select: none;
            flex-wrap: wrap;
        }
        .heure-title {
            font-size: 13px;
            font-weight: 800;
            color: #374151;
            letter-spacing: 0.3px;
            pointer-events: none;
            white-space: nowrap;
        }

        .heure-container.wf-minimized > *:not(.heure-header) { display: none !important; }
        .heure-container.wf-minimized { gap: 0; }

        .heure-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
        }

        .heure-level-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            flex-shrink: 0;
        }
        .heure-level-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .heure-level-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .heure-level-badge.difficile { background: #f8d7da; color: #842029; }

        .heure-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .heure-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
            white-space: nowrap;
        }
        .heure-btn:active { transform: scale(0.96); }
        .heure-btn-new   { background: #4a90e2; color: white; }
        .heure-btn-new:hover { background: #357abd; }
        .heure-btn-answer { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .heure-btn-answer:hover { background: #e0e0e0; }
        .heure-btn-answer.revealed { background: #28a745; color: white; border-color: #28a745; }
        .heure-btn-check { background: #4a90e2; color: white; }
        .heure-btn-check:hover { background: #357abd; }

        /* Bascule mode */
        .heure-mode-btns {
            display: flex;
            border-radius: 8px;
            overflow: hidden;
            border: 1.5px solid #d1d5db;
            flex-shrink: 0;
        }
        .heure-mode-btn {
            padding: 4px 11px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: #f5f5f5;
            color: #666;
            transition: background .15s, color .15s;
            white-space: nowrap;
        }
        .heure-mode-btn + .heure-mode-btn { border-left: 1.5px solid #d1d5db; }
        .heure-mode-btn.active-lecture { background: #4a90e2; color: white; }
        .heure-mode-btn.active-duree   { background: #7c3aed; color: white; }

        /* Bascule matin / après-midi */
        .heure-period-btns {
            display: flex;
            border-radius: 8px;
            overflow: hidden;
            border: 1.5px solid #d1d5db;
            flex-shrink: 0;
        }
        .heure-period-btn {
            padding: 4px 11px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: #f5f5f5;
            color: #666;
            transition: background .15s, color .15s;
            white-space: nowrap;
        }
        .heure-period-btn + .heure-period-btn { border-left: 1.5px solid #d1d5db; }
        .heure-period-btn.active-matin  { background: #f59e0b; color: white; }
        .heure-period-btn.active-aprem  { background: #6366f1; color: white; }

        .heure-level-btns { display: flex; gap: 4px; margin-left: auto; }
        .heure-lvl-btn {
            padding: 4px 9px; border-radius: 6px; border: 1px solid #ddd;
            background: #f5f5f5; font-size: 10px; font-weight: 700;
            cursor: pointer; color: #666; transition: background .15s; white-space: nowrap;
        }
        .heure-lvl-btn:hover { background: #e0e0e0; }
        .heure-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .heure-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .heure-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }

        /* Grille */
        .heure-clocks-zone {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px 10px;
            padding: 12px;
            background: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-sizing: border-box;
        }
        .heure-clocks-zone.cols-3 {
            grid-template-columns: repeat(3, 1fr);
        }

        /* Numéro d'horloge */
        .heure-clock-num {
            font-size: 14px;
            font-weight: 900;
            color: #374151;
            line-height: 1;
            flex-shrink: 0;
			padding-right: 5px;
            font-family: 'MarelleBaton', sans-serif !important;
        }

        /* Cellule lecture */
        .heure-clock-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }

        /* Cellule durée */
        .heure-pair-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }
        .heure-pair-clocks {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
            width: 100%;
        }
        .heure-arrow {
            font-size: 14px;
            font-weight: 900;
            color: #374151;
            flex-shrink: 0;
        }

        /* Zone de saisie sous l'horloge */
        .heure-cell-input-zone {
            display: flex;
            align-items: center;
            gap: 3px;
        }
        .heure-input {
            width: 52px;
            padding: 5px 2px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 20px;
            font-weight: 700;
            outline: none;
            text-align: center;
            transition: border-color .2s, background .2s;
            background: #fff;
            font-family: 'MarelleBaton', sans-serif !important;
        }
        .heure-input:focus { border-color: #4a90e2; }
        .heure-input.correct { border-color: #28a745 !important; background: #f0fff4; color: #1a7a3a; }
        .heure-input.wrong   { border-color: #dc3545 !important; background: #fff5f5; color: #9c1c28; }
        .heure-input-sep  { font-size: 20px; font-weight: 900; color: #555; font-family: 'MarelleBaton', sans-serif !important; }
        .heure-input-unit { font-size: 20px; color: #888; font-weight: 600; font-family: 'MarelleBaton', sans-serif !important; }

        /* Feedback global */
        .heure-feedback-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 24px;
        }
        .heure-feedback-text {
            font-size: 18px;
            font-weight: 800;
            color: #28a745;
            opacity: 0;
            transition: opacity .3s;
        }
        .heure-feedback-text.show { opacity: 1; }

        .heure-help-btn {
            width: 22px; height: 22px; border-radius: 50%;
            border: 1px solid #bbb; background: #f5f5f5; color: #666;
            font-size: 12px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: background .15s;
        }
        .heure-help-btn:hover { background: #e0e0e0; color: #333; }

        .heure-help-popup {
            display: none; position: absolute; top: 36px; right: 10px;
            background: #fff; border: 1px solid #ddd; border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 12px 14px;
            width: 260px; font-size: 11px; color: #444; z-index: 10; line-height: 1.5;
        }
        .heure-help-popup.show { display: block; }
        .heure-help-popup h4 { margin: 0 0 8px; font-size: 12px; color: #374151; }
        .heure-help-popup .help-level { margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .heure-help-popup .help-level:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
        .heure-help-badge {
            display: inline-block; font-size: 9px; font-weight: 700;
            padding: 1px 6px; border-radius: 10px; text-transform: uppercase; margin-right: 4px;
        }
        .heure-help-badge.facile    { background: #d4edda; color: #1a7a3a; }
        .heure-help-badge.moyen     { background: #fff3cd; color: #8a5c00; }
        .heure-help-badge.difficile { background: #f8d7da; color: #842029; }

        .heure-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .heure-container:hover .heure-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Précisions par niveau ─────────────────────────────────────────────────
const HEURE_NIVEAUX = {
    facile:    { label: 'Facile',    precisions: ['heure', 'demie'] },
    moyen:     { label: 'Moyen',     precisions: ['heure', 'demie', 'quart'] },
    difficile: { label: 'Difficile', precisions: ['5min'] }
};

function _randomHeureNiv(precisions, period) {
    const prec = precisions[Math.floor(Math.random() * precisions.length)];
    // Heure de base sur le cadran (1-12)
    const hBase = Math.floor(Math.random() * 12) + 1;
    let m = 0;
    if (prec === 'demie') m = [0, 30][Math.floor(Math.random() * 2)];
    if (prec === 'quart') m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    if (prec === '5min')  m = Math.floor(Math.random() * 12) * 5;

    // Calcul de l'heure réelle selon la période
    let h;
    if (period === 'matin') {
        // 0h à 11h : hBase 12 → 0h, hBase 1-11 → 1h-11h
        h = hBase === 12 ? 0 : hBase;
    } else {
        // après-midi : 12h à 23h : hBase 12 → 12h, hBase 1-11 → 13h-23h
        h = hBase === 12 ? 12 : hBase + 12;
    }
    return { h, m };
}

function _genLecture(niveauKey, period) {
    const { precisions } = HEURE_NIVEAUX[niveauKey];

    // Construire le pool de toutes les heures possibles selon le niveau
    const hBases = [1,2,3,4,5,6,7,8,9,10,11,12];
    let mValues;
    if (precisions.includes('5min'))        mValues = [0,5,10,15,20,25,30,35,40,45,50,55];
    else if (precisions.includes('quart'))  mValues = [0,15,30,45];
    else                                    mValues = [0,30]; // facile : pile et demie

    const pool = [];
    for (const hBase of hBases) {
        for (const m of mValues) {
            const h = period === 'matin'
                ? (hBase === 12 ? 0 : hBase)
                : (hBase === 12 ? 12 : hBase + 12);
            pool.push({ h, m });
        }
    }

    // Mélanger (Fisher-Yates) et prendre les 8 premiers
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return { mode: 'lecture', clocks: pool.slice(0, 8) };
}

function _genDuree(niveauKey, period) {
    const { precisions } = HEURE_NIVEAUX[niveauKey];
    const step = precisions.includes('5min') ? 5 : precisions.includes('quart') ? 15 : 30;
    const pairs = [];
    for (let i = 0; i < 6; i++) {
        const start = _randomHeureNiv(precisions, period);
        const minSteps = Math.max(1, Math.floor(15 / step));
        const maxSteps = Math.floor(240 / step);
        const durationMin = (minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1))) * step;
        // Calcul heure de fin sur cadran 12h (les durées restent toujours en relatif)
        const startCadran = ((start.h % 12) || 12);
        const totalM2 = (startCadran * 60 + start.m + durationMin) % 720;
        const endCadran = Math.floor(totalM2 / 60) || 12;
        const endM = totalM2 % 60;
        pairs.push({ start, end: { h: endCadran, m: endM }, durationMin });
    }
    return { mode: 'duree', pairs };
}

// ── SVG horloge ───────────────────────────────────────────────────────────
function _clockSVG(h, m, size) {
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;
    const hourDeg = (h % 12) * 30 + m * 0.5;
    const minDeg  = m * 6;
    let marks = '', numbers = '';
    for (let i = 0; i < 60; i++) {
        const a = (i * 6 - 90) * Math.PI / 180;
        const isH = i % 5 === 0;
        const r1 = r * (isH ? 0.80 : 0.88), r2 = r * 0.96;
        marks += `<line x1="${(cx+r1*Math.cos(a)).toFixed(1)}" y1="${(cy+r1*Math.sin(a)).toFixed(1)}" x2="${(cx+r2*Math.cos(a)).toFixed(1)}" y2="${(cy+r2*Math.sin(a)).toFixed(1)}" stroke="#bbb" stroke-width="${isH?1.5:0.7}"/>`;
    }
    for (let i = 1; i <= 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const tx = cx + (r - size * 0.16) * Math.cos(a);
        const ty = cy + (r - size * 0.16) * Math.sin(a);
        numbers += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="${(size*0.08).toFixed(1)}" font-weight="800" fill="#111827" font-family="MarelleBaton, sans-serif">${i}</text>`;
    }
    const hA = (hourDeg - 90) * Math.PI / 180;
    const mA = (minDeg  - 90) * Math.PI / 180;
    const hx = cx + r * 0.50 * Math.cos(hA), hy = cy + r * 0.50 * Math.sin(hA);
    const mx = cx + r * 0.72 * Math.cos(mA), my = cy + r * 0.72 * Math.sin(mA);
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width:${size}px;height:${size}px;display:block;flex-shrink:0;">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="1.8"/>
        ${marks}${numbers}
        <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#A12912" stroke-width="${Math.max(1.5,size*0.028).toFixed(1)}" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#1B3AB3" stroke-width="${Math.max(1,size*0.020).toFixed(1)}" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="${(size*0.045).toFixed(1)}" fill="#111827"/>
    </svg>`;
}

// ── Création du widget ────────────────────────────────────────────────────
function createHeureWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'heure';
    widget.dataset.transparent = 'true';
    // Le widget s'ouvre à 100px du bord gauche du board.
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

    const container = document.createElement('div');
    container.className = 'heure-container';
    const initW = Math.min(Math.round(window.innerWidth * 0.75), 960);
    container.style.width = initW + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'heure-header';
    header.innerHTML = `
        <span class="heure-title">🕐 Quelle heure est-il ?</span>
        <span class="heure-level-badge facile">Facile</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    const badge = header.querySelector('.heure-level-badge');
    container.appendChild(header);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'heure-controls';
    controls.innerHTML = `
        <button class="heure-btn heure-btn-new">🔄 Nouveau</button>
        <div class="heure-mode-btns">
            <button class="heure-mode-btn active-lecture" data-mode="lecture">🕐 Lire l'heure</button>
            <button class="heure-mode-btn" data-mode="duree">⏱ Durée</button>
        </div>
        <div class="heure-period-btns">
            <button class="heure-period-btn active-matin" data-period="matin">🌅 Matin</button>
            <button class="heure-period-btn" data-period="aprem">🌇 Après-midi</button>
        </div>
        <button class="heure-btn heure-btn-answer">👁 Voir les réponses</button>
        <button class="heure-btn heure-btn-check">✓ Vérifier</button>
        <div class="heure-level-btns">
            <button class="heure-lvl-btn active-facile" data-level="facile">😊 Facile</button>
            <button class="heure-lvl-btn" data-level="moyen">😐 Moyen</button>
            <button class="heure-lvl-btn" data-level="difficile">😤 Difficile</button>
        </div>
    `;
    const newBtn   = controls.querySelector('.heure-btn-new');
    const showBtn  = controls.querySelector('.heure-btn-answer');
    const checkBtn = controls.querySelector('.heure-btn-check');
    container.appendChild(controls);

    // ── Zone grille ───────────────────────────────────────────────────────
    const clocksZone = document.createElement('div');
    clocksZone.className = 'heure-clocks-zone';
    clocksZone.style.height = '500px';
    container.appendChild(clocksZone);

    // ── Barre feedback ────────────────────────────────────────────────────
    const feedbackBar = document.createElement('div');
    feedbackBar.className = 'heure-feedback-bar';
    const feedbackText = document.createElement('span');
    feedbackText.className = 'heure-feedback-text';
    feedbackBar.appendChild(feedbackText);
    container.appendChild(feedbackBar);

    // ── Bouton aide ───────────────────────────────────────────────────────
    const helpBtn = document.createElement('button');
    helpBtn.className = 'heure-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    header.querySelector('.wf-btns').insertBefore(helpBtn, header.querySelector('.wf-btns').firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'heure-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Les niveaux</h4>
        <div class="help-level">
            <span class="heure-help-badge facile">😊 Facile</span><br>
            Heures pile et demi-heures
        </div>
        <div class="help-level">
            <span class="heure-help-badge moyen">😐 Moyen</span><br>
            Heures pile, demi-heures, quarts d'heure
        </div>
        <div class="help-level">
            <span class="heure-help-badge difficile">😤 Difficile</span><br>
            Toutes les 5 minutes
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;font-size:10px;color:#666;">
            <b>🕐 Lire l'heure</b> : 8 horloges indépendantes<br>
            <b>⏱ Durée</b> : 6 paires d'horloges, trouver le temps écoulé
        </div>
    `;
    container.appendChild(helpPopup);

    // ── Poignée resize ────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'heure-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let currentLevel    = 'facile';
    let currentMode     = 'lecture';
    let currentPeriod   = 'matin'; // 'matin' | 'aprem'
    let currentExercice = null;
    let answerRevealed  = false;
    let inputRefs       = []; // { hInput, mInput, ansH, ansM }

    // ── Taille d'horloge selon largeur ET hauteur de la zone ─────────────
    function computeClockSize(nbPerCell) {
        const zw = clocksZone.offsetWidth  || (container.offsetWidth - 32);
        const zh = clocksZone.offsetHeight || 300;

        // Depuis la largeur : 4 colonnes (lecture) ou 3 colonnes (durée), gap 10px, padding 12px×2
        const nbCols = nbPerCell === 2 ? 3 : 4;
        const cellW  = (zw - 10 * (nbCols - 1) - 24) / nbCols;
        const clockW = nbPerCell === 2 ? Math.floor((cellW - 20) / 2) : cellW;

        // Depuis la hauteur : 2 lignes, gap 12px, padding 12px×2
        // INPUT_H = hauteur input + sep (~50px avec les grands inputs)
        const cellH  = (zh - 12 * 1 - 24) / 2;
        const clockH = Math.max(0, cellH - 50);

        return Math.max(48, Math.min(200, Math.floor(Math.min(clockW, clockH))));
    }

    // ── Crée la zone de saisie sous une horloge ───────────────────────────
    function makeInputZone(ansH, ansM, isDuree, num) {
        const zone = document.createElement('div');
        zone.className = 'heure-cell-input-zone';

        if (num !== undefined) {
            const numEl = document.createElement('span');
            numEl.className = 'heure-clock-num';
            numEl.textContent = num + ')';
            zone.appendChild(numEl);
        }

        const hIn = document.createElement('input');
        hIn.className = 'heure-input';
        hIn.type = 'text';
        hIn.placeholder = isDuree ? '...' : '...';
        hIn.maxLength = 2;
        hIn.inputMode = 'numeric';

        const sep = document.createElement('span');
        sep.className = 'heure-input-sep';
        sep.textContent = 'h';

        const mIn = document.createElement('input');
        mIn.className = 'heure-input';
        mIn.type = 'text';
        mIn.placeholder = '...';
        mIn.maxLength = 2;
        mIn.inputMode = 'numeric';

        zone.append(hIn, sep, mIn);
        if (isDuree) {
            const unit = document.createElement('span');
            unit.className = 'heure-input-unit';
            unit.textContent = '';
            zone.appendChild(unit);
        }

        hIn.addEventListener('input', () => { if (hIn.value.length === 2) mIn.focus(); });
        hIn.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault(); mIn.focus(); }
        });
        mIn.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') hIn.focus();
            if (e.key === 'Enter') checkAnswer();
        });
        [hIn, mIn].forEach(inp => {
            inp.addEventListener('mousedown', e => e.stopPropagation());
            inp.addEventListener('click', e => { e.stopPropagation(); inp.focus(); });
        });

        inputRefs.push({ hInput: hIn, mInput: mIn, ansH, ansM });
        return zone;
    }

    // ── Rendu de l'exercice ───────────────────────────────────────────────
    function renderExercice(ex, keepValues) {
        // Sauvegarder les valeurs actuelles des inputs avant de re-rendre
        const savedValues = keepValues ? inputRefs.map(r => ({
            h: r.hInput.value,
            m: r.mInput.value,
            hClass: r.hInput.className,
            mClass: r.mInput.className
        })) : null;

        currentExercice = ex;
        if (!keepValues) {
            answerRevealed  = false;
            feedbackText.textContent = '';
            feedbackText.classList.remove('show');
            showBtn.textContent = '👁 Voir les réponses';
            showBtn.classList.remove('revealed');
        }
        inputRefs = [];
        clocksZone.innerHTML = '';

        if (ex.mode === 'lecture') {
            clocksZone.classList.remove('cols-3');
            const periodLabel = currentPeriod === 'matin' ? ' (matin)' : ' (après-midi)';
            header.querySelector('.heure-title').textContent = '🕐 Quelle heure est-il ?' + periodLabel;
            const size = computeClockSize(1);

            ex.clocks.forEach((clock, i) => {
                const cell = document.createElement('div');
                cell.className = 'heure-clock-cell';
                cell.innerHTML = _clockSVG(clock.h, clock.m, size);
                cell.appendChild(makeInputZone(clock.h, clock.m, false, i + 1));
                clocksZone.appendChild(cell);
            });

        } else {
            clocksZone.classList.add('cols-3');
            header.querySelector('.heure-title').textContent = '⏱ Combien de temps s\'est écoulé ?';
            const size = computeClockSize(2);

            ex.pairs.forEach((pair, i) => {
                const cell = document.createElement('div');
                cell.className = 'heure-pair-cell';

                const clocksRow = document.createElement('div');
                clocksRow.className = 'heure-pair-clocks';
                clocksRow.innerHTML = _clockSVG(pair.start.h, pair.start.m, size);
                const arrow = document.createElement('span');
                arrow.className = 'heure-arrow';
                arrow.textContent = '➔';
                clocksRow.appendChild(arrow);
                clocksRow.insertAdjacentHTML('beforeend', _clockSVG(pair.end.h, pair.end.m, size));
                cell.appendChild(clocksRow);

                const ansH = Math.floor(pair.durationMin / 60);
                const ansM = pair.durationMin % 60;
                cell.appendChild(makeInputZone(ansH, ansM, true, i + 1));
                clocksZone.appendChild(cell);
            });
        }

        // Restaurer les valeurs des inputs après resize
        if (savedValues) {
            inputRefs.forEach((ref, i) => {
                if (!savedValues[i]) return;
                ref.hInput.value     = savedValues[i].h;
                ref.mInput.value     = savedValues[i].m;
                ref.hInput.className = savedValues[i].hClass;
                ref.mInput.className = savedValues[i].mClass;
            });
        }
    }

    // ── Nouvel exercice ───────────────────────────────────────────────────
    function newExercice() {
        const ex = currentMode === 'lecture'
            ? _genLecture(currentLevel, currentPeriod)
            : _genDuree(currentLevel, currentPeriod);
        renderExercice(ex);
        saveBoard();
    }

    // ── Changer de niveau ─────────────────────────────────────────────────
    function setLevel(level) {
        currentLevel = level;
        widget.dataset.heureLevel = level;
        badge.className = `heure-level-badge ${level}`;
        badge.textContent = HEURE_NIVEAUX[level].label;
        container.querySelectorAll('.heure-lvl-btn').forEach(btn => {
            btn.className = 'heure-lvl-btn';
            if (btn.dataset.level === level) btn.classList.add(`active-${level}`);
        });
        newExercice();
    }

    // ── Changer de mode ───────────────────────────────────────────────────
    function setMode(mode) {
        currentMode = mode;
        widget.dataset.heureMode = mode;
        container.querySelectorAll('.heure-mode-btn').forEach(btn => {
            btn.className = 'heure-mode-btn';
            if (btn.dataset.mode === mode) btn.classList.add('active-' + mode);
        });
        newExercice();
    }

    // ── Changer de période (matin / après-midi) ───────────────────────────
    function setPeriod(period) {
        currentPeriod = period;
        widget.dataset.heurePeriod = period;
        container.querySelectorAll('.heure-period-btn').forEach(btn => {
            btn.className = 'heure-period-btn';
            if (btn.dataset.period === period) btn.classList.add('active-' + period);
        });
        newExercice();
    }

    // ── Vérifier ─────────────────────────────────────────────────────────
    function checkAnswer() {
        let allCorrect = true;
        inputRefs.forEach(({ hInput, mInput, ansH, ansM }) => {
            const userH = parseInt(hInput.value, 10);
            const userM = parseInt(mInput.value, 10);
            const ok = (userH === ansH) && (userM === ansM);
            if (!ok) allCorrect = false;
            hInput.classList.remove('correct', 'wrong');
            mInput.classList.remove('correct', 'wrong');
            hInput.classList.add(ok ? 'correct' : 'wrong');
            mInput.classList.add(ok ? 'correct' : 'wrong');
        });
        feedbackText.textContent = allCorrect ? '✅ Bravo !' : '❌ Essaie encore !';
        feedbackText.classList.add('show');
    }

    // ── Voir / cacher les réponses ────────────────────────────────────────
    function toggleAnswer() {
        if (!answerRevealed) {
            answerRevealed = true;
            const ex = currentExercice;
            if (!ex) return;

            if (ex.mode === 'lecture') {
                ex.clocks.forEach((clock, i) => {
                    if (!inputRefs[i]) return;
                    inputRefs[i].hInput.value = String(clock.h).padStart(2, '0');
                    inputRefs[i].mInput.value = String(clock.m).padStart(2, '0');
                    inputRefs[i].hInput.classList.remove('wrong'); inputRefs[i].hInput.classList.add('correct');
                    inputRefs[i].mInput.classList.remove('wrong'); inputRefs[i].mInput.classList.add('correct');
                });
            } else {
                ex.pairs.forEach((pair, i) => {
                    if (!inputRefs[i]) return;
                    inputRefs[i].hInput.value = String(Math.floor(pair.durationMin / 60));
                    inputRefs[i].mInput.value = String(pair.durationMin % 60).padStart(2, '0');
                    inputRefs[i].hInput.classList.remove('wrong'); inputRefs[i].hInput.classList.add('correct');
                    inputRefs[i].mInput.classList.remove('wrong'); inputRefs[i].mInput.classList.add('correct');
                });
            }
            feedbackText.textContent = '';
            feedbackText.classList.remove('show');
            showBtn.textContent = '🙈 Cacher';
            showBtn.classList.add('revealed');
        } else {
            answerRevealed = false;
            inputRefs.forEach(({ hInput, mInput }) => {
                hInput.value = ''; mInput.value = '';
                hInput.classList.remove('correct', 'wrong');
                mInput.classList.remove('correct', 'wrong');
            });
            showBtn.textContent = '👁 Voir les réponses';
            showBtn.classList.remove('revealed');
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────
    newBtn.addEventListener('click', newExercice);
    showBtn.addEventListener('click', toggleAnswer);
    checkBtn.addEventListener('click', checkAnswer);
    helpBtn.addEventListener('click', e => { e.stopPropagation(); helpPopup.classList.toggle('show'); });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));

    controls.querySelectorAll('.heure-lvl-btn').forEach(btn => {
        btn.addEventListener('click', () => setLevel(btn.dataset.level));
    });
    controls.querySelectorAll('.heure-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });
    controls.querySelectorAll('.heure-period-btn').forEach(btn => {
        btn.addEventListener('click', () => setPeriod(btn.dataset.period));
    });

    // ── Resize 2D avec re-render proportionnel des horloges ──────────────
    function applyResize(newW, newZH) {
        if (newW  !== null) container.style.width  = Math.max(400, newW)  + 'px';
        if (newZH !== null) clocksZone.style.height = Math.max(160, newZH) + 'px';
        if (currentExercice) renderExercice(currentExercice, true);
    }

    resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        const startX  = e.clientX, startY  = e.clientY;
        const startW  = container.offsetWidth;
        const startZH = clocksZone.offsetHeight;
        const onMove  = ev => applyResize(startW + ev.clientX - startX, startZH + ev.clientY - startY);
        const onUp    = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            saveBoard();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    resizeHandle.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX  = t0.clientX, startY  = t0.clientY;
        const startW  = container.offsetWidth;
        const startZH = clocksZone.offsetHeight;
        const onMove  = ev => applyResize(startW + ev.touches[0].clientX - startX, startZH + ev.touches[0].clientY - startY);
        const onEnd   = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            saveBoard();
        };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false, _savedW = null;

    if (wfMin) wfMin.addEventListener('click', e => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        window._wfMiniBarCollapse(widget, '🕐 Heure', {});
    });
    if (wfMax) wfMax.addEventListener('click', e => {
        e.stopPropagation();
        _isMax = !_isMax;
        if (_isMax) { _savedW = container.style.width; container.classList.add('wf-fullboard'); }
        else { container.classList.remove('wf-fullboard'); if (_savedW) container.style.width = _savedW; }
    });
    if (wfClose) wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', e => {
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

    requestAnimationFrame(() => requestAnimationFrame(() => setLevel('facile')));

    widget._setLevel  = setLevel;
    widget._setMode   = setMode;
    widget._setPeriod = setPeriod;

    saveBoard();
    return widget;
}
