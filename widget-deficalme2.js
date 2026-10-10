// =========================================================================
// WIDGET DÉFI CALME 2 (DESSIN) — Le Bureau du Prof
// Un dessin se trace petit à petit au silence (micro) — 3 modes :
//   Crayon   : tous les contours se tracent, puis les couleurs arrivent
//   Peinture : chaque forme est tracée puis coloriée, l'une après l'autre
//   Magie    : les formes apparaissent une par une
// Paramètres identiques au Défi Calme : mode, tolérance, durée,
//   import (SVG), URL (SVG), dessin aléatoire, aperçu, masquer les contrôles.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── Mini-barre collapse (partagée avec les autres widgets) ─────────────────
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

// ── Boutons fenêtre (CSS partagé) ──────────────────────────────────────────
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

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="deficalme2"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Thème clair (body.menu-light) ── */
        body.menu-light .dc2-container {
            background: #f0f2f5;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc2-controls {
            background: #e2e6ea;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        body.menu-light .dc2-label { opacity: 0.55; color: #1a1a1a; }
        body.menu-light .dc2-mode-wrap { background: rgba(0,0,0,0.07); }
        body.menu-light .dc2-mode-btn { border-color: rgba(0,0,0,0.12); color: rgba(0,0,0,0.5); }
        body.menu-light .dc2-time-pill { background: rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.12); }
        body.menu-light .dc2-time-val { color: #1a1a1a; }
        body.menu-light .dc2-url-input {
            background: rgba(0,0,0,0.06);
            border-color: rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc2-url-input::placeholder { color: rgba(0,0,0,0.35); }
        body.menu-light .dc2-resize-handle {
            background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%);
        }

        .dc2-container {
            background: #121212;
            border-radius: 5px;
            display: flex;
            flex-direction: column;
            width: 600px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: #fff;
            position: relative;
            user-select: none;
        }

        /* ── Zone dessin (feuille de papier) ── */
        .dc2-image-zone {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #fdfcf8;
            overflow: hidden;
            flex-shrink: 0;
        }
        .dc2-svg {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
        }
        .dc2-pen {
            pointer-events: none;
            transition: opacity 0.2s;
        }

        .dc2-msg-start {
            position: absolute;
            inset: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 1rem;
            font-size: 0.85rem;
            font-weight: 700;
            pointer-events: none;
            color: #2d2a32;
            opacity: 0.55;
        }

        /* ── Barre micro (en bas) ── */
        .dc2-mic-bar-wrap {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 5px;
            background: rgba(0,0,0,0.08);
            z-index: 8;
        }
        .dc2-mic-bar-fill {
            height: 100%;
            width: 0%;
            background: #3b82f6;
            transition: width 0.08s;
        }

        /* ── Barre progression (à droite) ── */
        .dc2-prog-bar-wrap {
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 10px;
            background: rgba(0,0,0,0.08);
            z-index: 8;
            display: flex;
            flex-direction: column-reverse;
        }
        .dc2-prog-bar-fill {
            width: 100%;
            height: 0%;
            background: #3b82f6;
            transition: height 0.15s;
        }
        .dc2-percent-badge {
            position: absolute;
            top: 6px;
            right: 15px;
            font-size: 14px;
            font-weight: 900;
            color: #fff;
            opacity: 0.9;
            z-index: 9;
            text-shadow: 0 1px 3px rgba(0,0,0,1);
        }

        /* ── Panneau contrôles ── */
        .dc2-controls {
            padding: 8px 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            background: #1a1a1a;
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .dc2-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        .dc2-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }
        .dc2-label {
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.4;
            flex-shrink: 0;
        }

        .dc2-mode-wrap {
            display: flex;
            background: rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 3px;
            gap: 3px;
        }
        .dc2-mode-btn {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
            background: transparent;
            color: rgba(255,255,255,0.5);
            transition: all 0.15s;
        }
        .dc2-mode-btn.active {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
        }

        .dc2-time-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 50px;
            padding: 3px 10px;
        }
        .dc2-time-val {
            font-size: 12px;
            font-weight: 900;
            min-width: 42px;
            text-align: center;
        }
        .dc2-time-btn {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #3b82f6;
            border: none;
            color: #fff;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.15s;
            user-select: none;
        }
        .dc2-time-btn:active { transform: scale(0.88); }

        /* Colonne de réglages à droite (durée / tolérance) */
        .dc2-settings-col {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            margin-left: auto;
        }
        .dc2-settings-col .dc2-group { gap: 6px; }
        .dc2-settings-col .dc2-label { min-width: 52px; text-align: right; }
        .dc2-time-pill.dc2-compact { padding: 2px 6px; gap: 4px; }
        .dc2-time-pill.dc2-compact .dc2-time-val { font-size: 11px; min-width: 34px; }
        .dc2-time-pill.dc2-compact .dc2-time-btn { width: 17px; height: 17px; font-size: 11px; }

        /* Boutons action flottants (sur le dessin, en bas à gauche) */
        .dc2-action-row {
            position: absolute;
            bottom: 8px;
            left: 15px;
            z-index: 15;
            display: flex;
            gap: 6px;
        }
        .dc2-float-action-btn {
            background: rgba(0,0,0,0.0);
            border: 1px solid rgba(0,0,0,0.25);
            color: rgba(0,0,0,0.55);
            font-size: 9px;
            font-weight: 900;
            padding: 5px 10px;
            border-radius: 6px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.2s;
        }
        .dc2-float-action-btn:hover {
            background: rgba(0,0,0,0.8);
            border-color: rgba(255,255,255,0.8);
            color: #fff;
        }
        .dc2-float-action-btn:active { transform: scale(0.96); }
        .dc2-float-action-btn.dc2-stop:hover { border-color: #ef4444; color: #ef4444; }
        .dc2-float-action-btn.dc2-hidden { display: none !important; }
        .dc2-float-action-btn.dc2-start,
        .dc2-float-action-btn.dc2-start:hover {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
        }
        .dc2-float-action-btn.dc2-start:hover { opacity: 0.88; }
        .dc2-float-action-btn.dc2-new,
        .dc2-float-action-btn.dc2-new:hover {
            background: #10b981 !important;
            border-color: #10b981 !important;
            color: #fff !important;
        }
        .dc2-float-action-btn.dc2-new:hover { opacity: 0.88; }

        .dc2-url-input {
            flex: 1;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 7px;
            color: #fff;
            font-size: 10px;
            padding: 4px 8px;
            outline: none;
            min-width: 0;
        }
        .dc2-url-input::placeholder { color: rgba(255,255,255,0.35); }
        .dc2-url-input:focus { border-color: #3b82f6; }
        .dc2-url-btn {
            padding: 4px 10px;
            border-radius: 7px;
            background: #3b82f6;
            border: none;
            color: #fff;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
            white-space: nowrap;
        }

        .dc2-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%);
            border-radius: 0 0 16px 0;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 20;
        }
        .dc2-container:hover .dc2-resize-handle { opacity: 1; }

        /* En-tête (titre + boutons fenêtre) */
        .dc2-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .dc2-title {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.03em;
            margin-right: auto;
            pointer-events: none;
            white-space: nowrap;
        }

        /* Plein écran (fullboard) */
        .dc2-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            padding-left: 40px;
            box-sizing: border-box;
            background: #000 !important; /* même en thème clair */
        }
        .dc2-container.wf-fullboard .dc2-image-zone {
            align-self: center;
            margin: auto 0;
        }
        .dc2-container.wf-fullboard .dc2-resize-handle { display: none; }

        /* ── Téléphone : plein écran du bouton vert à la hauteur réelle de l'écran (la marge gauche laisse déjà les onglets visibles) ── */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .dc2-container.wf-fullboard {
                height: 100dvh !important;
            }
        }
        /* En plein écran, masquer les poignées du tableau (déplacer, pivoter, menu…) */
        .widget.dc2-is-full > .drag-handle,
        .widget.dc2-is-full > .widget-rotate-handle,
        .widget.dc2-is-full > .widget-action-bar,
        .widget.dc2-is-full > .widget-ctx-menu {
            display: none !important;
        }
    `;
    document.head.appendChild(s);
})();

// ── Constantes ────────────────────────────────────────────────────────────
const DC2_CONFIG = {
    volumeMultiplier: 3,
    baseThreshold: 60,
    sensitivityFactor: 0.55,
    timeAdjustUnit: 15,
    minTimeSeconds: 5,
    maxTimeSeconds: 3600,
    penColor: '#2d2a32'
};

// ── Bibliothèque de dessins (viewBox 160 × 90, ordre = ordre de tracé) ───
const DC2_DRAWINGS = [
    {
        name: 'Montagne et lac',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#cfe8f7" data-nostroke="1"/>
        <circle cx="128" cy="18" r="8" fill="#ffd23f"/>
        <path d="M138.0 18.0 L141.0 18.0 M135.1 25.1 L137.2 27.2 M128.0 28.0 L128.0 31.0 M120.9 25.1 L118.8 27.2 M118.0 18.0 L115.0 18.0 M120.9 10.9 L118.8 8.8 M128.0 8.0 L128.0 5.0 M135.1 10.9 L137.2 8.8" fill="none"/>
        <path d="M14 24 C14 19 21 17 23 21 C26 16 34 18 33 24 Z" fill="#ffffff"/>
        <path d="M86 13 C86 9.0 91.6 7.3999999999999995 93.2 10.6 C95.6 6.6 102.0 8.2 101.2 13 Z" fill="#ffffff"/>
        <path d="M60 14 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M46 22 q2.25 -2.25 4.5 0 q2.25 -2.25 4.5 0" fill="none"/>
        <path d="M100 28 q1.75 -1.75 3.5 0 q1.75 -1.75 3.5 0" fill="none"/>
        <path d="M-2 54 L20 36 L34 46 L52 30 L70 46 L96 28 L118 44 L140 32 L162 46 L162 62 L-2 62 Z" fill="#b7c7d8"/>
        <path d="M-2 62 L40 24 L62 44 L84 20 L120 58 L162 42 L162 66 L-2 66 Z" fill="#8aa1b8"/>
        <path d="M33.4 30.2 L40 24 L46.6 30 L43.5 28.6 L40 32 L36.5 28.6 Z" fill="#ffffff"/>
        <path d="M77.4 27.2 L84 20 L90.6 27.4 L87.5 25.8 L84 29.5 L80.5 25.8 Z" fill="#ffffff"/>
        <path d="M52 52 L58 47 M98 42 L103 48 M68 54 L74 49 M140 50 L146 47" fill="none"/>
        <rect x="-2" y="66" width="164" height="26" fill="#5fa8d3"/>
        <path d="M20 73 q2.5 -3 5 0 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke="#ffffff"/>
        <path d="M70 82 q2.5 -3 5 0 q2.5 -3 5 0 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke="#ffffff"/>
        <path d="M126 76 q3.0 -3 6 0 q3.0 -3 6 0" fill="none" stroke="#ffffff"/>
        <path d="M-2 65 C12 62 32 62 48 66 C34 69 14 70 -2 72 Z" fill="#7cbf5a"/>
        <path d="M6.4 66 L12 50 L17.6 66 Z" fill="#2f7d4a"/>
        <path d="M12 66 L12 68.5" fill="none"/>
        <path d="M17.3 66 L25 44 L32.7 66 Z" fill="#3b8f57"/>
        <path d="M25 66 L25 68.5" fill="none"/>
        <path d="M32.1 66 L37 52 L41.9 66 Z" fill="#2f7d4a"/>
        <path d="M37 66 L37 68.5" fill="none"/>
        <path d="M44 72 L44 64 M46 72 L47 63 M48.5 72 L50 65" fill="none"/>
        <ellipse cx="44" cy="63.5" rx="0.8" ry="2" fill="#8a5a3b"/>
        <ellipse cx="47.2" cy="62.5" rx="0.8" ry="2" fill="#8a5a3b"/>
        <circle cx="5" cy="68" r="1.2" fill="#ff7aa8"/>
        <circle cx="9" cy="69.5" r="1.2" fill="#ffd23f"/>
        <circle cx="31" cy="67.5" r="1.2" fill="#b47aff"/>
        <path d="M124 66 C136 61 152 61 162 62 L162 70 C150 68 136 69 124 69 Z" fill="#7cbf5a"/>
        <rect x="140" y="56" width="12" height="9" fill="#c98b5a"/>
        <path d="M138 57 L146 50 L154 57 Z" fill="#8a3b2a"/>
        <rect x="149" y="50" width="2" height="4" fill="#8a3b2a"/>
        <path d="M150 48 C148 46 152 44 150 42 C148 40 151 38 150 36" fill="none"/>
        <rect x="143" y="59.5" width="3" height="5.5" fill="#6b4a2f"/>
        <rect x="148" y="58.5" width="2.5" height="2.5" fill="#ffe680"/>
        <path d="M94 70 L116 70 L112 75 L98 75 Z" fill="#c0533a"/>
        <path d="M105 70 L105 52" fill="none"/>
        <path d="M105.6 56 L105.6 68.5 L114 68.5 Z" fill="#ffffff"/>
        <path d="M104.4 58 L104.4 68.5 L98 68.5 Z" fill="#ffd23f"/>
        <path d="M105 52 L109.5 53.5 L105 55 Z" fill="#e04b4b"/>
        <path d="M60 76 C63 72 68 72 70 75 C68 77.5 63 78 60 76 Z" fill="#ff8c42"/>
        <path d="M60 76 L56 73 L57 78.5 Z" fill="#ff8c42"/>
        <circle cx="67.5" cy="74.5" r="0.6" fill="#2d2a32"/>
        <path d="M53 80 q2 -2 4 0 M71 80 q2 -2 4 0" fill="none" stroke="#ffffff"/>`
    },
    {
        name: 'Fusée dans l\'espace',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#1e2a4a" data-nostroke="1"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(112 14) scale(1)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(140 40) scale(1)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(18 66) scale(1)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(60 12) scale(1)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(150 12) scale(0.7)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(8 30) scale(0.8)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(40 46) scale(0.6)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(122 84) scale(0.7)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(70 84) scale(0.6)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#fff7b0" transform="translate(100 6) scale(0.5)"/>
        <circle cx="30" cy="26" r="12" fill="#e8a33d"/>
        <path d="M19 22 C26 20 34 20 41 23 M18.5 28 C26 30 34 30 41.5 28" fill="none" stroke="#c47c22"/>
        <ellipse cx="30" cy="26" rx="21" ry="5" fill="none" stroke="#f6d38a"/>
        <circle cx="36" cy="21" r="2" fill="#f6c26b"/>
        <circle cx="134" cy="70" r="11" fill="#d9d9d9"/>
        <circle cx="130" cy="66" r="2.5" fill="#bdbdbd"/>
        <circle cx="138" cy="74" r="2" fill="#bdbdbd"/>
        <circle cx="139" cy="65" r="1.3" fill="#bdbdbd"/>
        <circle cx="129" cy="75" r="1.1" fill="#bdbdbd"/>
        <path d="M-2 92 L-2 78 C20 70 46 76 58 92 Z" fill="#3a7bd5"/>
        <path d="M6 84 C12 79 20 80 24 85 C18 88 10 88 6 84 Z" fill="#5bb04a"/>
        <path d="M118 26 L148 18" fill="none" stroke="#9fd8ff"/>
        <circle cx="116" cy="26.5" r="2.2" fill="#cfeeff"/>
        <rect x="52" y="62" width="8" height="5" fill="#9aa5b1"/>
        <path d="M50 64.5 L44 64.5 M60 64.5 L66 64.5" fill="none"/>
        <rect x="40" y="62" width="4" height="5" fill="#3b82f6"/>
        <rect x="66" y="62" width="4" height="5" fill="#3b82f6"/>
        <path d="M56 62 L56 58" fill="none"/>
        <circle cx="56" cy="57.5" r="1" fill="#e04b4b"/>
        <g transform="rotate(30 85 52)">
        <path d="M85 20 C96 31 98 52 93 68 L77 68 C72 52 74 31 85 20 Z" fill="#f2f2f2"/>
        <path d="M85 20 C88.5 23 90.5 27 91.5 31 L78.5 31 C79.5 27 81.5 23 85 20 Z" fill="#e04b4b"/>
        <rect x="75.5" y="50" width="19" height="3" fill="#e04b4b"/>
        <circle cx="85" cy="42" r="6.2" fill="#9aa5b1"/>
        <circle cx="85" cy="42" r="4.6" fill="#6ec1e4"/>
        <path d="M82.5 40 C83 38.5 84.5 37.6 86 37.8" fill="none" stroke="#ffffff"/>
        <circle cx="79" cy="36" r="0.6" fill="#9aa5b1"/>
        <circle cx="91" cy="36" r="0.6" fill="#9aa5b1"/>
        <circle cx="79" cy="48" r="0.6" fill="#9aa5b1"/>
        <circle cx="91" cy="48" r="0.6" fill="#9aa5b1"/>
        <path d="M77.5 56 L68 72 L77.5 68 Z" fill="#e04b4b"/>
        <path d="M92.5 56 L102 72 L92.5 68 Z" fill="#e04b4b"/>
        <path d="M85 58 L85 70" fill="none"/>
        <path d="M79 68 L85 86 L91 68 Z" fill="#ffb02e"/>
        <path d="M81.5 68 L85 79 L88.5 68 Z" fill="#ffe14d"/>
        </g>
        <circle cx="56" cy="82" r="3" fill="#c9c9c9"/>
        <circle cx="62" cy="86" r="2.3" fill="#c9c9c9"/>
        <circle cx="51" cy="87" r="1.8" fill="#c9c9c9"/>`
    },
    {
        name: 'Maison et arbre',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#d8f0ff" data-nostroke="1"/>
        <circle cx="22" cy="18" r="8" fill="#ffd23f"/>
        <path d="M32.0 18.0 L35.0 18.0 M30.1 23.9 L32.5 25.6 M25.1 27.5 L26.0 30.4 M18.9 27.5 L18.0 30.4 M13.9 23.9 L11.5 25.6 M12.0 18.0 L9.0 18.0 M13.9 12.1 L11.5 10.4 M18.9 8.5 L18.0 5.6 M25.1 8.5 L26.0 5.6 M30.1 12.1 L32.5 10.4" fill="none"/>
        <path d="M98 20 C98 15 105 13 107 17 C110 12 118 14 117 20 Z" fill="#ffffff"/>
        <path d="M140 12 C140 9.0 144.2 7.8 145.4 10.2 C147.2 7.2 152.0 8.4 151.4 12 Z" fill="#ffffff"/>
        <path d="M52 14 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M30 40 q1.75 -1.75 3.5 0 q1.75 -1.75 3.5 0" fill="none"/>
        <path d="M-2 64 C40 56 110 56 162 62 L162 92 L-2 92 Z" fill="#8cc96b"/>
        <path d="M63 70 C60 76 54 82 50 92 L64 92 C66 84 68 77 72 70 Z" fill="#e8d3a6"/>
        <rect x="80" y="26" width="7" height="12" fill="#a0503c"/>
        <path d="M83 22 C79 18 87 15 83 11 C79 7 86 5 84 2" fill="none"/>
        <rect x="46" y="40" width="44" height="30" fill="#f4d6a0"/>
        <path d="M40 41 L68 20 L96 41 Z" fill="#c0533a"/>
        <path d="M48 36 L88 36 M53 32 L83 32 M58 28 L78 28 M63 24 L73 24" fill="none"/>
        <circle cx="68" cy="31" r="3" fill="#bfe6ff"/>
        <path d="M68 28 L68 34 M65 31 L71 31" fill="none"/>
        <rect x="62" y="52" width="11" height="18" fill="#8a5a3b"/>
        <circle cx="70.5" cy="61.5" r="0.9" fill="#ffd23f"/>
        <path d="M62 52 L73 52" fill="none"/>
        <rect x="50" y="46" width="9" height="9" fill="#bfe6ff"/>
        <path d="M54.5 46 L54.5 55 M50 50.5 L59 50.5" fill="none"/>
        <rect x="49" y="55" width="11" height="2.5" fill="#a0503c"/>
        <circle cx="51" cy="54" r="1.1" fill="#ff5a5f"/>
        <circle cx="54.5" cy="54" r="1.1" fill="#ffd23f"/>
        <circle cx="58" cy="54" r="1.1" fill="#ff7aa8"/>
        <rect x="77" y="46" width="9" height="9" fill="#bfe6ff"/>
        <path d="M81.5 46 L81.5 55 M77 50.5 L86 50.5" fill="none"/>
        <path d="M77 46 L79.5 49 M86 46 L83.5 49" fill="none"/>
        <path d="M8 70 L8 64 L10 62 L12 64 L12 70 M18 70 L18 64 L20 62 L22 64 L22 70 M28 70 L28 64 L30 62 L32 64 L32 70 M4 66 L36 66 M4 68.5 L36 68.5" fill="none"/>
        <rect x="124" y="50" width="6" height="20" fill="#8a5a3b"/>
        <path d="M124 56 L120 52 M130 60 L134 56" fill="none"/>
        <circle cx="127" cy="40" r="13" fill="#3f9b4f"/>
        <circle cx="118" cy="47" r="8" fill="#48a85a"/>
        <circle cx="136" cy="47" r="8" fill="#48a85a"/>
        <circle cx="122" cy="36" r="1.8" fill="#e04b4b"/>
        <circle cx="132" cy="42" r="1.8" fill="#e04b4b"/>
        <circle cx="126" cy="47" r="1.8" fill="#e04b4b"/>
        <circle cx="138" cy="48" r="1.8" fill="#e04b4b"/>
        <circle cx="116" cy="74" r="1.8" fill="#e04b4b"/>
        <path d="M134 64 L134 72 M144 64 L144 72" fill="none"/>
        <rect x="132" y="62" width="14" height="1.5" fill="#a0703f"/>
        <rect x="136" y="71" width="6" height="1.5" fill="#a0703f"/>
        <ellipse cx="100" cy="74" rx="4" ry="2.6" fill="#f2a65a"/>
        <circle cx="104" cy="71.5" r="2" fill="#f2a65a"/>
        <path d="M103 70 L103.5 68.5 L104.5 70 M105 70 L105.8 68.6 L106.3 70.3" fill="none"/>
        <path d="M96 74 C93 72 93 69 95 68" fill="none"/>
        <circle cx="104.6" cy="71.3" r="0.4" fill="#2d2a32"/>
        <path d="M14 82 L14 76" fill="none"/>
        <circle cx="14" cy="74" r="2.6" fill="#ff7aa8"/>
        <circle cx="14" cy="74" r="1" fill="#ffd23f"/>
        <path d="M24 84 L24 78" fill="none"/>
        <circle cx="24" cy="76" r="2.6" fill="#ffd23f"/>
        <circle cx="24" cy="76" r="1" fill="#ffd23f"/>
        <path d="M34 82 L34 76" fill="none"/>
        <circle cx="34" cy="74" r="2.6" fill="#b47aff"/>
        <circle cx="34" cy="74" r="1" fill="#ffd23f"/>
        <path d="M88 82 L87 79 M89 82 L89 78 M90 82 L91 79" fill="none"/>
        <path d="M110 86 L109 83 M111 86 L111 82 M112 86 L113 83" fill="none"/>
        <path d="M150 80 L149 77 M151 80 L151 76 M152 80 L153 77" fill="none"/>
        <path d="M4 80 L3 77 M5 80 L5 76 M6 80 L7 77" fill="none"/>
        <rect x="146" y="66" width="4" height="4" fill="#3b82f6"/>
        <path d="M148 70 L148 76" fill="none"/>
        <path d="M150 66 L152 66 L152 68" fill="none" stroke="#e04b4b"/>`
    },
    {
        name: 'Sous la mer',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#2a7fb8" data-nostroke="1"/>
        <path d="M20 -2 L40 -2 L60 70 L44 70 Z" fill="#ffffff" fill-opacity="0.12" data-nostroke="1"/>
        <path d="M90 -2 L104 -2 L120 70 L108 70 Z" fill="#ffffff" fill-opacity="0.12" data-nostroke="1"/>
        <path d="M-2 74 C40 68 90 78 162 70 L162 92 L-2 92 Z" fill="#f0d9a0"/>
        <path d="M8 84 q2 -1 4 0 M40 82 q2 -1 4 0 M118 84 q2 -1 4 0 M150 80 q2 -1 4 0" fill="none"/>
        <ellipse cx="36" cy="76" rx="8" ry="4" fill="#8a8f99"/>
        <ellipse cx="44" cy="78" rx="5" ry="3" fill="#a3a9b3"/>
        <path d="M18 76 C12 64 24 58 18 44 C28 56 22 66 26 76 Z" fill="#3aa35a"/>
        <path d="M8 76 C4 68 12 62 8 52 C16 60 12 70 14 76 Z" fill="#2f9150"/>
        <path d="M140 74 C134 62 146 56 140 40 C150 54 144 64 148 74 Z" fill="#2f9150"/>
        <path d="M128 76 C124 68 132 64 129 54 C136 62 132 70 134 76 Z" fill="#3aa35a"/>
        <path d="M104 76 L104 66 M104 70 L100 64 M104 69 L108 62 M100 64 L98 61 M108 62 L110 59" fill="none" stroke="#ff7a7a" stroke-width="2"/>
        <ellipse cx="70" cy="40" rx="16" ry="9" fill="#ff8c42"/>
        <path d="M86 40 L98 31 L98 49 Z" fill="#ff8c42"/>
        <path d="M66 31.5 L72 26 L76 32 Z" fill="#f2702a"/>
        <path d="M68 32 C65 36 65 44 68 48 M76 32 C73 36 73 44 76 48" fill="none" stroke="#ffffff"/>
        <path d="M70 48 L73 53 L76 48 Z" fill="#f2702a"/>
        <circle cx="61" cy="38" r="2.2" fill="#ffffff"/>
        <circle cx="60.6" cy="38" r="1" fill="#2d2a32"/>
        <path d="M55 42 C56.5 43 58 43 59 42" fill="none"/>
        <ellipse cx="112" cy="22" rx="9" ry="5" fill="#ffe14d"/>
        <path d="M103 22 L96 17 L96 27 Z" fill="#ffe14d"/>
        <circle cx="116" cy="21" r="1.2" fill="#2d2a32"/>
        <path d="M109 18 L109 26 M113 18 L113 26" fill="none" stroke="#3b82f6"/>
        <ellipse cx="36" cy="12" rx="5" ry="3.5" fill="#b47aff"/>
        <circle cx="33.5" cy="14" r="0.4" fill="#2d2a32"/>
        <path d="M41 12 L45 9 L45 15 Z" fill="#b47aff"/>
        <path d="M124 40 C124 33 136 33 136 40 Z" fill="#ffb3d9"/>
        <path d="M125 40 C124 44 126 46 125 50 M128 40 C127 45 129 47 128 52 M131 40 C132 45 130 47 131 52 M134 40 C135 44 133 46 134 50" fill="none" stroke="#ffb3d9"/>
        <circle cx="50" cy="26" r="2" fill="none" stroke="#dff3ff"/>
        <circle cx="46" cy="18" r="1.4" fill="none" stroke="#dff3ff"/>
        <circle cx="51" cy="11" r="2.4" fill="none" stroke="#dff3ff"/>
        <circle cx="118" cy="12" r="1.6" fill="none" stroke="#dff3ff"/>
        <circle cx="121" cy="5" r="1.1" fill="none" stroke="#dff3ff"/>
        <rect x="78" y="68" width="16" height="9" fill="#a0703f"/>
        <path d="M78 68 C78 62 94 62 94 68 Z" fill="#c08a50"/>
        <path d="M78 72 L94 72" fill="none"/>
        <rect x="84.5" y="70" width="3" height="3" fill="#ffd23f"/>
        <circle cx="82" cy="66" r="1.2" fill="#ffd23f"/>
        <circle cx="86" cy="64.5" r="1.2" fill="#ffd23f"/>
        <circle cx="90" cy="66" r="1.2" fill="#ffd23f"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#ff5a5f" transform="translate(66 80) scale(1.6)"/>
        <path d="M108 82 C108 76 118 76 118 82 Z" fill="#ffc0cb"/>
        <path d="M110 82 L111.5 78 M113 82 L113 77.5 M116 82 L114.5 78" fill="none"/>
        <ellipse cx="146" cy="84" rx="4" ry="2.5" fill="#e04b4b"/>
        <path d="M142 84 L139 81 M150 84 L153 81 M143 86 L141 88 M149 86 L151 88" fill="none"/>
        <circle cx="144.5" cy="81.5" r="0.6" fill="#2d2a32"/>
        <circle cx="147.5" cy="81.5" r="0.6" fill="#2d2a32"/>`
    },
    {
        name: 'Montgolfière',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#ffe3c4" data-nostroke="1"/>
        <circle cx="140" cy="16" r="7" fill="#ffb347"/>
        <path d="M16 26 C16 21 23 19 25 23 C28 18 36 20 35 26 Z" fill="#ffffff"/>
        <path d="M118 40 C118 35 125 33 127 37 C130 32 138 34 137 40 Z" fill="#ffffff"/>
        <path d="M52 16 C52 13.0 56.2 11.8 57.4 14.2 C59.2 11.2 64.0 12.4 63.4 16 Z" fill="#ffffff"/>
        <path d="M30 14 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M104 22 q2.0 -2.0 4.0 0 q2.0 -2.0 4.0 0" fill="none"/>
        <path d="M112 16 q1.5 -1.5 3.0 0 q1.5 -1.5 3.0 0" fill="none"/>
        <path d="M-2 70 C20 60 50 62 80 66 C110 60 140 60 162 64 L162 92 L-2 92 Z" fill="#b9d98f"/>
        <path d="M-2 76 C30 64 60 72 90 68 C120 64 140 72 162 68 L162 92 L-2 92 Z" fill="#9bc96e"/>
        <path d="M10 84 C40 78 70 82 100 78 M30 90 C60 84 100 88 140 82 M120 80 C130 78 150 78 162 76" fill="none"/>
        <rect x="18" y="66" width="10" height="7" fill="#f4d6a0"/>
        <path d="M16 67 L23 61 L30 67 Z" fill="#c0533a"/>
        <rect x="21.5" y="69" width="3" height="4" fill="#8a5a3b"/>
        <rect x="132" y="64" width="10" height="7" fill="#ffffff"/>
        <path d="M130 65 L137 59 L144 65 Z" fill="#3b82f6"/>
        <rect x="135.5" y="67" width="3" height="4" fill="#8a5a3b"/>
        <circle cx="44" cy="70" r="4" fill="#3f9b4f"/>
        <path d="M44 74 L44 77" fill="none"/>
        <circle cx="150" cy="70" r="3.5" fill="#48a85a"/>
        <path d="M150 73.5 L150 76" fill="none"/>
        <path d="M80 10 C102 10 110 30 101 46 L89 60 L71 60 L59 46 C50 30 58 10 80 10 Z" fill="#e85d75"/>
        <path d="M80 10 C69 22 69 44 75 60 L85 60 C91 44 91 22 80 10 Z" fill="#ffd23f"/>
        <path d="M80 10 C77 24 77 44 80 60" fill="none"/>
        <path d="M62 40 C72 43 88 43 98 40" fill="none" stroke="#3b82f6" stroke-width="1.6"/>
        <rect x="71" y="59" width="18" height="2.5" fill="#a0703f"/>
        <path d="M71 61 L74 68 M89 61 L86 68 M76 61 L77 68 M84 61 L83 68" fill="none"/>
        <rect x="73" y="68" width="14" height="9" fill="#a0703f"/>
        <path d="M73 72 L87 72 M77 68 L77 77 M83 68 L83 77" fill="none"/>
        <circle cx="77" cy="66" r="1.8" fill="#f2c29b"/>
        <circle cx="83" cy="66.2" r="1.6" fill="#f2c29b"/>
        <path d="M75.3 65 C76 63.5 78 63.5 78.7 65" fill="none" stroke="#e04b4b"/>
        <path d="M86 64 L90 61" fill="none"/>
        <path d="M90 61 L94 62 L90 63.5 Z" fill="#3b82f6"/>
        <path d="M124 18 C130 18 132 24 129 28 L126 31 L122 31 L119 28 C116 24 118 18 124 18 Z" fill="#6ec1e4"/>
        <path d="M124 18 C122 23 122 28 123 31" fill="none"/>
        <rect x="122" y="33" width="4" height="3" fill="#a0703f"/>
        <path d="M122 31 L122.5 33 M126 31 L125.5 33" fill="none"/>`
    },
    {
        name: 'Château fort',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#cfe8f7" data-nostroke="1"/>
        <circle cx="20" cy="16" r="7" fill="#ffd23f"/>
        <path d="M28.3 19.4 L31.1 20.5 M23.5 24.3 L24.7 27.0 M16.6 24.3 L15.5 27.1 M11.7 19.5 L9.0 20.7 M11.7 12.6 L8.9 11.5 M16.5 7.7 L15.3 5.0 M23.4 7.7 L24.5 4.9 M28.3 12.5 L31.0 11.3" fill="none"/>
        <path d="M64 14 C64 9 71 7 73 11 C76 6 84 8 83 14 Z" fill="#ffffff"/>
        <path d="M130 8 C130 4.5 134.9 3.1000000000000005 136.3 5.9 C138.4 2.4000000000000004 144.0 3.8000000000000007 143.3 8 Z" fill="#ffffff"/>
        <path d="M98 14 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M108 20 q1.75 -1.75 3.5 0 q1.75 -1.75 3.5 0" fill="none"/>
        <path d="M-2 66 C30 58 60 60 90 62 C120 58 140 60 162 64 L162 74 L-2 74 Z" fill="#a8d48a"/>
        <rect x="-2" y="74" width="164" height="18" fill="#5fa8d3"/>
        <path d="M10 82 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke="#ffffff"/>
        <path d="M120 84 q2.5 -3 5 0 q2.5 -3 5 0 q2.5 -3 5 0" fill="none" stroke="#ffffff"/>
        <path d="M-2 68 C40 64 120 64 162 68 L162 75 L-2 75 Z" fill="#8cc96b"/>
        <rect x="50" y="42" width="60" height="28" fill="#cfc8bb"/>
        <path d="M50 42 L50 37 L56 37 L56 42 L62 42 L62 37 L68 37 L68 42 L74 42 L74 37 L80 37 L80 42 L86 42 L86 37 L92 37 L92 42 L98 42 L98 37 L104 37 L104 42 L110 42" fill="none"/>
        <path d="M54 50 L62 50 M66 56 L74 56 M94 50 L102 50 M98 62 L106 62 M54 62 L60 62" fill="none"/>
        <rect x="68" y="22" width="24" height="20" fill="#c4bdb0"/>
        <path d="M66 22 L80 8 L94 22 Z" fill="#3b82f6"/>
        <path d="M80 8 L80 2" fill="none"/>
        <path d="M80 2 L86 4 L80 6 Z" fill="#ffd23f"/>
        <path d="M76 34 L76 30 C76 27 84 27 84 30 L84 34 Z" fill="#2d2a32"/>
        <rect x="32" y="28" width="18" height="42" fill="#b9b2a6"/>
        <path d="M30 28 L30 21 L34.5 21 L34.5 24 L39 24 L39 21 L43 21 L43 24 L47.5 24 L47.5 21 L52 21 L52 28 Z" fill="#b9b2a6"/>
        <rect x="110" y="28" width="18" height="42" fill="#b9b2a6"/>
        <path d="M108 28 L108 21 L112.5 21 L112.5 24 L117 24 L117 21 L121 21 L121 24 L125.5 24 L125.5 21 L130 21 L130 28 Z" fill="#b9b2a6"/>
        <path d="M38 44 L38 39 C38 35 44 35 44 39 L44 44 Z" fill="#2d2a32"/>
        <path d="M116 44 L116 39 C116 35 122 35 122 39 L122 44 Z" fill="#2d2a32"/>
        <path d="M39 58 L39 53 C39 51 43 51 43 53 L43 58 Z" fill="#2d2a32"/>
        <path d="M117 58 L117 53 C117 51 121 51 121 53 L121 58 Z" fill="#2d2a32"/>
        <path d="M71 70 L71 58 C71 50 89 50 89 58 L89 70 Z" fill="#6b4a2f"/>
        <path d="M75 53 L75 70 M80 51.5 L80 70 M85 53 L85 70 M71 60 L89 60 M71 65 L89 65" fill="none"/>
        <path d="M41 21 L41 9" fill="none"/>
        <path d="M41 9 L50 12 L41 15 Z" fill="#e04b4b"/>
        <path d="M119 21 L119 9" fill="none"/>
        <path d="M119 9 L128 12 L119 15 Z" fill="#3b82f6"/>
        <path d="M58 44 L66 44 L66 54 L62 57 L58 54 Z" fill="#e04b4b"/>
        <path d="M62 46 L62 55 M59 49 L65 49" fill="none" stroke="#ffd23f"/>
        <path d="M94 44 L102 44 L102 54 L98 57 L94 54 Z" fill="#3b82f6"/>
        <path d="M98 46 L98 55 M95 49 L101 49" fill="none" stroke="#ffd23f"/>
        <path d="M71 70 L66 80 L94 80 L89 70 Z" fill="#a0703f"/>
        <path d="M68 75 L92 75" fill="none"/>
        <path d="M71 60 L66 78 M89 60 L94 78" fill="none"/>
        <path d="M7.1000000000000005 68 L12 54 L16.9 68 Z" fill="#2f7d4a"/>
        <path d="M12 68 L12 70.5" fill="none"/>
        <path d="M142.4 66 L148 50 L153.6 66 Z" fill="#3b8f57"/>
        <path d="M148 66 L148 68.5" fill="none"/>
        <circle cx="140" cy="64" r="4" fill="#48a85a"/>
        <path d="M140 68 L140 70" fill="none"/>
        <path d="M30 86 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <ellipse cx="124" cy="79" rx="3" ry="1.6" fill="#ffffff"/>
        <circle cx="126.5" cy="77" r="1.2" fill="#ffffff"/>
        <path d="M127.5 77 L129.5 77.3" fill="none" stroke="#ffb02e"/>`
    },
    {
        name: 'Phare au bord de mer',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#bfe3f5" data-nostroke="1"/>
        <circle cx="140" cy="22" r="8" fill="#ffd23f"/>
        <path d="M12 20 C12 15 19 13 21 17 C24 12 32 14 31 20 Z" fill="#ffffff"/>
        <path d="M100 10 C100 6.5 104.9 5.1000000000000005 106.3 7.9 C108.4 4.4 114.0 5.800000000000001 113.3 10 Z" fill="#ffffff"/>
        <path d="M89 21 L132 12 L132 30 Z" fill="#fff3a0" fill-opacity="0.7"/>
        <path d="M77 21 L34 12 L34 30 Z" fill="#fff3a0" fill-opacity="0.7"/>
        <path d="M112 40 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M30 42 q2.25 -2.25 4.5 0 q2.25 -2.25 4.5 0" fill="none"/>
        <path d="M120 34 q1.5 -1.5 3.0 0 q1.5 -1.5 3.0 0" fill="none"/>
        <path d="M-2 62 C30 58 60 64 90 60 C120 56 140 62 162 60 L162 92 L-2 92 Z" fill="#3f8fc4"/>
        <path d="M-2 72 C30 68 70 74 110 70 C130 68 150 72 162 70 L162 92 L-2 92 Z" fill="#357fb0"/>
        <path d="M14 70 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M118 76 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M128 66 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M30 84 q2.0 -3 4 0 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M136 86 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M60 80 C58 72 66 68 74 70 C80 64 94 66 98 72 C106 72 110 78 106 82 L62 82 Z" fill="#8a8a8a"/>
        <path d="M70 76 C72 74 76 74 78 76 M90 74 C92 72 96 72 98 74" fill="none"/>
        <path d="M72 74 L76 30 L90 30 L94 74 Z" fill="#ffffff"/>
        <path d="M75.1 40 L90.9 40 L91.6 48 L74.4 48 Z" fill="#e04b4b"/>
        <path d="M73.5 58 L92.5 58 L93.3 66 L72.7 66 Z" fill="#e04b4b"/>
        <rect x="81.5" y="51" width="3" height="4" fill="#bfe6ff"/>
        <rect x="82" y="33" width="2.5" height="4" fill="#bfe6ff"/>
        <path d="M80 74 L80 68 C80 65 86 65 86 68 L86 74 Z" fill="#6b4a2f"/>
        <rect x="73" y="27" width="20" height="3" fill="#555555"/>
        <path d="M74 27 L74 24 M78 27 L78 24 M82 27 L82 24 M86 27 L86 24 M90 27 L90 24 M73 24 L93 24" fill="none"/>
        <rect x="77" y="17" width="12" height="7" fill="#ffe680"/>
        <path d="M83 17 L83 24" fill="none"/>
        <path d="M75 17 L83 9 L91 17 Z" fill="#e04b4b"/>
        <circle cx="83" cy="8.5" r="1" fill="#2d2a32"/>
        <path d="M28 66 L48 66 L45 70 L31 70 Z" fill="#ffffff"/>
        <path d="M38 66 L38 52" fill="none"/>
        <path d="M38.6 53 L38.6 64.5 L46 64.5 Z" fill="#e04b4b"/>
        <path d="M37.4 55 L37.4 64.5 L31 64.5 Z" fill="#ffd23f"/>
        <path d="M120 82 L120 76 C120 74 124 74 124 76 L124 82 Z" fill="#e04b4b"/>
        <path d="M120 79 L124 79" fill="none" stroke="#ffffff"/>
        <ellipse cx="100" cy="84" rx="3.5" ry="2.2" fill="#ff7a3d"/>
        <path d="M97 84 L95 82 M103 84 L105 82" fill="none"/>
        <circle cx="99" cy="82" r="0.5" fill="#2d2a32"/>
        <circle cx="101" cy="82" r="0.5" fill="#2d2a32"/>
        <ellipse cx="56" cy="60" rx="2.5" ry="1.4" fill="#ffffff"/>
        <circle cx="58.5" cy="58.5" r="1" fill="#ffffff"/>
        <path d="M59.5 58.5 L61 58.8" fill="none" stroke="#ffb02e"/>`
    },
    {
        name: 'Bonhomme de neige',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#cfe3f2" data-nostroke="1"/>
        <circle cx="140" cy="14" r="6" fill="#fff7d6"/>
        <circle cx="142" cy="12" r="5.5" fill="#cfe3f2" data-nostroke="1"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#ffffff" transform="translate(20 10) scale(0.6)"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#ffffff" transform="translate(110 8) scale(0.5)"/>
        <path d="M-2 58 C30 50 60 54 90 52 C120 50 140 54 162 52 L162 70 L-2 70 Z" fill="#e8f1f8"/>
        <rect x="108" y="44" width="16" height="10" fill="#d9a066"/>
        <path d="M106 45 L116 37 L126 45 Z" fill="#8a3b2a"/>
        <path d="M106 45 L116 37 L126 45 L124 46.5 L116 40 L108 46.5 Z" fill="#ffffff"/>
        <rect x="111" y="47" width="3.5" height="3.5" fill="#ffe680"/>
        <rect x="118" y="47" width="3.5" height="7" fill="#6b4a2f"/>
        <rect x="120" y="36" width="2.5" height="5" fill="#8a3b2a"/>
        <path d="M121 34 C119 32 123 30 121 28" fill="none"/>
        <path d="M-2 68 C40 60 120 60 162 66 L162 92 L-2 92 Z" fill="#ffffff"/>
        <path d="M18.9 66 L28 40 L37.1 66 Z" fill="#2f7d4a"/>
        <path d="M28 66 L28 68.5" fill="none"/>
        <path d="M22 54 L28 40 L34 54 L31 52 L28 55 L25 52 Z" fill="#ffffff"/>
        <path d="M19 62 L28 50 L37 62 L33 60 L28 64 L23 60 Z" fill="#ffffff"/>
        <path d="M128.2 64 L138 36 L147.8 64 Z" fill="#3b8f57"/>
        <path d="M138 64 L138 66.5" fill="none"/>
        <path d="M132 50 L138 36 L144 50 L141 48 L138 51 L135 48 Z" fill="#ffffff"/>
        <path d="M145.1 66 L150 52 L154.9 66 Z" fill="#2f7d4a"/>
        <path d="M150 66 L150 68.5" fill="none"/>
        <circle cx="80" cy="66" r="16" fill="#ffffff"/>
        <circle cx="80" cy="44" r="12" fill="#ffffff"/>
        <circle cx="80" cy="27" r="9" fill="#ffffff"/>
        <path d="M68 44 L52 35 M56.5 37.5 L53 32 M58 38.5 L56 41" fill="none"/>
        <path d="M92 44 L108 35 M103.5 37.5 L107 32 M102 38.5 L104 41" fill="none"/>
        <ellipse cx="106" cy="32" rx="2.6" ry="1.8" fill="#e04b4b"/>
        <circle cx="108" cy="30.5" r="1.2" fill="#e04b4b"/>
        <path d="M109 30.5 L110.5 30.8" fill="none" stroke="#ffb02e"/>
        <circle cx="108.3" cy="30.2" r="0.3" fill="#2d2a32"/>
        <path d="M70 35 C75 38.5 85 38.5 90 35 L90 38.5 C85 42 75 42 70 38.5 Z" fill="#e04b4b"/>
        <path d="M84 39 L88 50 L84 51 L81 40 Z" fill="#e04b4b"/>
        <path d="M84.8 43 L87.2 42.2 M85.8 46.5 L88 45.8" fill="none" stroke="#ffffff"/>
        <rect x="70" y="17" width="20" height="2.5" fill="#2d2a32"/>
        <rect x="74" y="6" width="12" height="11" fill="#2d2a32"/>
        <rect x="74" y="13" width="12" height="2.5" fill="#3b82f6"/>
        <circle cx="76.5" cy="25" r="1.1" fill="#2d2a32"/>
        <circle cx="83.5" cy="25" r="1.1" fill="#2d2a32"/>
        <path d="M80 27.5 L89 29.5 L80 30.5 Z" fill="#ff8c1a"/>
        <path d="M76 32 C78 34 82 34 84 32" fill="none"/>
        <circle cx="74.5" cy="29" r="1.2" fill="#ffc0cb" fill-opacity="0.7"/>
        <circle cx="85.5" cy="29" r="1.2" fill="#ffc0cb" fill-opacity="0.7"/>
        <circle cx="80" cy="45" r="1.3" fill="#2d2a32"/>
        <circle cx="80" cy="51" r="1.3" fill="#2d2a32"/>
        <circle cx="80" cy="62" r="1.3" fill="#2d2a32"/>
        <circle cx="80" cy="69" r="1.3" fill="#2d2a32"/>
        <path d="M40 80 L58 80 M42 80 C41 77 43 76 44 76 L56 76 M44 76 L44 80 M54 76 L54 80" fill="none"/>
        <rect x="44" y="74" width="12" height="2" fill="#c0533a"/>
        <path d="M98 84 l2 -1 M104 82 l2 -1 M110 84 l2 -1 M116 82 l2 -1 M122 84 l2 -1" fill="none"/>
        <path d="M48.4 14 L51.6 14 M50 12.4 L50 15.6 M48.9 12.9 L51.1 15.1 M48.9 15.1 L51.1 12.9" fill="none" stroke="#ffffff"/>
        <path d="M110.4 22 L113.6 22 M112 20.4 L112 23.6 M110.9 20.9 L113.1 23.1 M110.9 23.1 L113.1 20.9" fill="none" stroke="#ffffff"/>
        <path d="M58.4 56 L61.6 56 M60 54.4 L60 57.6 M58.9 54.9 L61.1 57.1 M58.9 57.1 L61.1 54.9" fill="none" stroke="#ffffff"/>
        <path d="M120.4 60 L123.6 60 M122 58.4 L122 61.6 M120.9 58.9 L123.1 61.1 M120.9 61.1 L123.1 58.9" fill="none" stroke="#ffffff"/>
        <path d="M12.4 24 L15.6 24 M14 22.4 L14 25.6 M12.9 22.9 L15.1 25.1 M12.9 25.1 L15.1 22.9" fill="none" stroke="#ffffff"/>
        <path d="M34.4 8 L37.6 8 M36 6.4 L36 9.6 M34.9 6.9 L37.1 9.1 M34.9 9.1 L37.1 6.9" fill="none" stroke="#ffffff"/>
        <path d="M98.4 14 L101.6 14 M100 12.4 L100 15.6 M98.9 12.9 L101.1 15.1 M98.9 15.1 L101.1 12.9" fill="none" stroke="#ffffff"/>
        <path d="M148.4 34 L151.6 34 M150 32.4 L150 35.6 M148.9 32.9 L151.1 35.1 M148.9 35.1 L151.1 32.9" fill="none" stroke="#ffffff"/>
        <path d="M6.4 44 L9.6 44 M8 42.4 L8 45.6 M6.9 42.9 L9.1 45.1 M6.9 45.1 L9.1 42.9" fill="none" stroke="#ffffff"/>
        <path d="M128.4 26 L131.6 26 M130 24.4 L130 27.6 M128.9 24.9 L131.1 27.1 M128.9 27.1 L131.1 24.9" fill="none" stroke="#ffffff"/>`
    },
    {
        name: 'Papillon et fleurs',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#dff2ff" data-nostroke="1"/>
        <circle cx="142" cy="16" r="8" fill="#ffd23f"/>
        <path d="M152.0 16.0 L155.0 16.0 M149.1 23.1 L151.2 25.2 M142.0 26.0 L142.0 29.0 M134.9 23.1 L132.8 25.2 M132.0 16.0 L129.0 16.0 M134.9 8.9 L132.8 6.8 M142.0 6.0 L142.0 3.0 M149.1 8.9 L151.2 6.8" fill="none"/>
        <path d="M10 70 C10 30 70 10 110 40" fill="none" stroke="#ff7a7a" stroke-width="2"/>
        <path d="M14 70 C14 34 70 15 107 43" fill="none" stroke="#ffd23f" stroke-width="2"/>
        <path d="M18 70 C18 38 70 20 104 46" fill="none" stroke="#6ec1e4" stroke-width="2"/>
        <path d="M100 14 C100 10.0 105.6 8.399999999999999 107.2 11.6 C109.6 7.6 116.0 9.2 115.2 14 Z" fill="#ffffff"/>
        <path d="M4 72 C4 68.5 8.899999999999999 67.1 10.3 69.9 C12.399999999999999 66.4 18.0 67.8 17.299999999999997 72 Z" fill="#ffffff"/>
        <path d="M-2 70 C40 64 110 66 162 70 L162 92 L-2 92 Z" fill="#8cc96b"/>
        <path d="M30 70 L30 52" fill="none"/>
        <path d="M30 62 C25 58 21 60 20 62 C24 64 27 64 30 62 Z" fill="#5bb04a"/>
        <circle cx="30" cy="44" r="4" fill="#ff7aa8"/>
        <circle cx="37" cy="48.5" r="4" fill="#ff7aa8"/>
        <circle cx="34" cy="56" r="4" fill="#ff7aa8"/>
        <circle cx="26" cy="56" r="4" fill="#ff7aa8"/>
        <circle cx="23" cy="48.5" r="4" fill="#ff7aa8"/>
        <circle cx="30" cy="50.5" r="3.5" fill="#ffd23f"/>
        <path d="M54 72 L54 58" fill="none"/>
        <path d="M54 66 C58 62 62 64 63 66 C59 68 56 68 54 66 Z" fill="#5bb04a"/>
        <circle cx="54" cy="51" r="3.5" fill="#b47aff"/>
        <circle cx="60" cy="55" r="3.5" fill="#b47aff"/>
        <circle cx="57" cy="61" r="3.5" fill="#b47aff"/>
        <circle cx="51" cy="61" r="3.5" fill="#b47aff"/>
        <circle cx="48" cy="55" r="3.5" fill="#b47aff"/>
        <circle cx="54" cy="56.5" r="3" fill="#ffffff"/>
        <path d="M130 72 L130 58" fill="none"/>
        <path d="M130 66 C135 62 139 64 140 66 C136 68 133 68 130 66 Z" fill="#5bb04a"/>
        <circle cx="130" cy="54" r="5.5" fill="#ffb02e"/>
        <circle cx="130" cy="54" r="2.5" fill="#c0533a"/>
        <path d="M150 74 L150 64" fill="none"/>
        <path d="M146 64 C146 58 154 58 154 64 L152 62 L150 64 L148 62 Z" fill="#e04b4b"/>
        <rect x="108" y="72" width="3" height="6" fill="#f4e3c4"/>
        <path d="M103 73 C103 66 116 66 116 73 Z" fill="#e04b4b"/>
        <circle cx="107" cy="70" r="0.9" fill="#ffffff"/>
        <circle cx="112" cy="69.5" r="1.1" fill="#ffffff"/>
        <path d="M40 30 C52 20 64 40 80 34" fill="none"/>
        <path d="M95 38 C85 20 68 22 72 35 C74 42 88 42 95 38 Z" fill="#b47aff"/>
        <path d="M95 38 C105 20 122 22 118 35 C116 42 102 42 95 38 Z" fill="#b47aff"/>
        <path d="M95 40 C86 42 77 52 85 55 C91 57 95 47 95 40 Z" fill="#ff7aa8"/>
        <path d="M95 40 C104 42 113 52 105 55 C99 57 95 47 95 40 Z" fill="#ff7aa8"/>
        <circle cx="82" cy="32" r="2.5" fill="#ffffff"/>
        <circle cx="108" cy="32" r="2.5" fill="#ffffff"/>
        <circle cx="88" cy="48" r="1.5" fill="#ffd23f"/>
        <circle cx="102" cy="48" r="1.5" fill="#ffd23f"/>
        <ellipse cx="95" cy="41" rx="1.8" ry="9" fill="#2d2a32"/>
        <path d="M94.5 33 C92.5 28 90.5 26.5 88 25.5 M95.5 33 C97.5 28 99.5 26.5 102 25.5" fill="none"/>
        <circle cx="88" cy="25.5" r="0.8" fill="#2d2a32"/>
        <circle cx="102" cy="25.5" r="0.8" fill="#2d2a32"/>
        <ellipse cx="126" cy="30" rx="3.5" ry="2.5" fill="#ffd23f"/>
        <path d="M125 27.6 L125 32.4 M127.2 27.8 L127.2 32.2" fill="none" stroke="#2d2a32"/>
        <ellipse cx="124" cy="27" rx="2" ry="1.4" fill="#ffffff" fill-opacity="0.8"/>
        <ellipse cx="128" cy="27" rx="2" ry="1.4" fill="#ffffff" fill-opacity="0.8"/>
        <circle cx="129.6" cy="29.6" r="0.4" fill="#2d2a32"/>
        <path d="M118 34 C120 36 122 34 123 32" fill="none"/>
        <path d="M70 80 C70 74 80 74 80 80 Z" fill="#e04b4b"/>
        <circle cx="75" cy="79.5" r="0.7" fill="#2d2a32"/>
        <circle cx="72.5" cy="78" r="0.6" fill="#2d2a32"/>
        <circle cx="77.5" cy="78" r="0.6" fill="#2d2a32"/>
        <path d="M75 75 L75 80" fill="none"/>
        <circle cx="68.5" cy="79" r="1.2" fill="#2d2a32"/>
        <circle cx="92" cy="82" r="3.5" fill="#e8a33d"/>
        <path d="M92 82 m-1.8 0 a1.8 1.8 0 1 1 1.8 1.8" fill="none"/>
        <path d="M88.5 85 L99 85 C100 83 99 81 97.5 81" fill="none"/>
        <path d="M98 81 L98.5 78.5 M99.5 81 L100.5 79" fill="none"/>
        <path d="M8 84 L7 81 M9 84 L9 80 M10 84 L11 81" fill="none"/>
        <path d="M40 80 L39 77 M41 80 L41 76 M42 80 L43 77" fill="none"/>
        <path d="M118 84 L117 81 M119 84 L119 80 M120 84 L121 81" fill="none"/>
        <path d="M140 82 L139 79 M141 82 L141 78 M142 82 L143 79" fill="none"/>
        <path d="M60 86 L59 83 M61 86 L61 82 M62 86 L63 83" fill="none"/>`
    },
    {
        name: 'Île tropicale',
        svg: `
        <rect x="0" y="0" width="160" height="90" fill="#bfe9f7" data-nostroke="1"/>
        <circle cx="26" cy="20" r="9" fill="#ffd23f"/>
        <path d="M37.0 20.0 L40.0 20.0 M34.9 26.5 L37.3 28.2 M29.4 30.5 L30.3 33.3 M22.6 30.5 L21.7 33.3 M17.1 26.5 L14.7 28.2 M15.0 20.0 L12.0 20.0 M17.1 13.5 L14.7 11.8 M22.6 9.5 L21.7 6.7 M29.4 9.5 L30.3 6.7 M34.9 13.5 L37.3 11.8" fill="none"/>
        <path d="M110 14 C110 9 117 7 119 11 C122 6 130 8 129 14 Z" fill="#ffffff"/>
        <path d="M56 10 C56 7.0 60.2 5.8 61.4 8.2 C63.2 5.2 68.0 6.4 67.4 10 Z" fill="#ffffff"/>
        <path d="M60 22 q2.5 -2.5 5 0 q2.5 -2.5 5 0" fill="none"/>
        <path d="M132 30 q2.0 -2.0 4.0 0 q2.0 -2.0 4.0 0" fill="none"/>
        <rect x="-2" y="56" width="164" height="36" fill="#2fa3c7"/>
        <path d="M-2 70 C40 66 120 74 162 68 L162 92 L-2 92 Z" fill="#2a93b5"/>
        <path d="M28 68 C44 52 106 52 124 68 Z" fill="#f2d58a"/>
        <path d="M70 64 C72 48 76 36 84 26 L87.5 28 C80 38 76.5 50 75.5 64 Z" fill="#a0703f"/>
        <path d="M71 58 L76 59 M72 52 L77.5 53 M74 46 L79 47.5 M76.5 40 L81 41.5 M79.5 34 L83.5 35.5" fill="none"/>
        <path d="M85 26 C75 17 61 19 55 28 C66 24 76 25 85 26 Z" fill="#3aa35a"/>
        <path d="M85 26 C92 15 107 15 113 24 C103 21 94 23 85 26 Z" fill="#3aa35a"/>
        <path d="M85 26 C79 30 72 38 69 47 C76 39 81 33 85 26 Z" fill="#2f9150"/>
        <path d="M85 26 C94 28 103 36 105 45 C98 37 91 31 85 26 Z" fill="#2f9150"/>
        <path d="M85 26 C82 18 84 10 90 6 C88 13 87 19 85 26 Z" fill="#48a85a"/>
        <circle cx="83" cy="30" r="2.3" fill="#6b4a2f"/>
        <circle cx="87.5" cy="30.5" r="2.3" fill="#6b4a2f"/>
        <circle cx="85" cy="33.5" r="2.1" fill="#6b4a2f"/>
        <path d="M100 60 L100 50" fill="none"/>
        <path d="M92 51 C94 45 106 45 108 51 Z" fill="#ff5a5f"/>
        <path d="M96 51 C97 47 100 46 100 46 M104 51 C103 47 100 46 100 46" fill="none" stroke="#ffffff"/>
        <rect x="42" y="60" width="12" height="4" fill="#6ec1e4" transform="rotate(-8 48 62)"/>
        <path d="M44 62 L52 60.8" fill="none" stroke="#ffffff"/>
        <path d="M112 62 C112 59 118 59 118 62 Z" fill="#ff7a3d"/>
        <path d="M111 62 L109 60 M119 62 L121 60" fill="none"/>
        <circle cx="114" cy="59.8" r="0.4" fill="#2d2a32"/>
        <circle cx="116" cy="59.8" r="0.4" fill="#2d2a32"/>
        <path d="M0 -3.5 L1 -1 L3.6 -1 L1.6 0.7 L2.3 3.3 L0 1.8 L-2.3 3.3 L-1.6 0.7 L-3.6 -1 L-1 -1 Z" fill="#ff8c42" transform="translate(58 64) scale(0.8)"/>
        <path d="M128 50 L144 50 L141 54 L131 54 Z" fill="#c0533a"/>
        <path d="M136 50 L136 38" fill="none"/>
        <path d="M136.6 39 L136.6 48.5 L143 48.5 Z" fill="#ffffff"/>
        <path d="M135.4 41 L135.4 48.5 L130 48.5 Z" fill="#ffd23f"/>
        <path d="M16 80 C20 72 30 72 34 78 C30 79 24 80 16 80 Z" fill="#7aa7c7"/>
        <path d="M24 74 L22 70 L27 73 Z" fill="#7aa7c7"/>
        <path d="M34 78 L38 75 L37 81 Z" fill="#7aa7c7"/>
        <circle cx="30" cy="76" r="0.5" fill="#2d2a32"/>
        <ellipse cx="140" cy="80" rx="5" ry="3.5" fill="#5bb04a"/>
        <path d="M136 78 L140 82 M144 78 L140 82 M140 76.5 L140 83.5" fill="none" stroke="#3b7d34"/>
        <circle cx="146" cy="79" r="1.6" fill="#7cbf5a"/>
        <path d="M135 82 L133 84 M145 82 L147 84" fill="none"/>
        <path d="M10 64 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M128 74 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M62 84 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M90 76 q2.0 -3 4 0 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M150 62 q2.0 -3 4 0" fill="none" stroke="#ffffff"/>
        <path d="M100 66 C102 63 106 63 108 66 Z" fill="#ff5a5f"/>`
    }
];

// ── Création du widget ────────────────────────────────────────────────────
// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

function createDeficalme2Widget() {
    snapshotNow();
    const pos = findFreePosition();
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'deficalme2';
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

    // ── Container principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'dc2-container';

    // ── Zone dessin ───────────────────────────────────────────────────────
    const imageZone = document.createElement('div');
    imageZone.className = 'dc2-image-zone';

    const drawSvg = document.createElementNS(SVG_NS, 'svg');
    drawSvg.setAttribute('class', 'dc2-svg');
    drawSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    drawSvg.style.overflow = 'hidden';

    const msgStart = document.createElement('div');
    msgStart.className = 'dc2-msg-start';
    msgStart.innerHTML = '🤫 Restez silencieux<br>pour faire apparaître le dessin…';

    const micBarWrap = document.createElement('div');
    micBarWrap.className = 'dc2-mic-bar-wrap';
    const micBarFill = document.createElement('div');
    micBarFill.className = 'dc2-mic-bar-fill';
    micBarWrap.appendChild(micBarFill);

    const progBarWrap = document.createElement('div');
    progBarWrap.className = 'dc2-prog-bar-wrap';
    const progBarFill = document.createElement('div');
    progBarFill.className = 'dc2-prog-bar-fill';
    progBarWrap.appendChild(progBarFill);

    const percentBadge = document.createElement('div');
    percentBadge.className = 'dc2-percent-badge';
    percentBadge.textContent = '0%';

    imageZone.appendChild(drawSvg);
    imageZone.appendChild(msgStart);
    imageZone.appendChild(micBarWrap);
    imageZone.appendChild(progBarWrap);
    imageZone.appendChild(percentBadge);

    // ── Panneau contrôles ─────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'dc2-controls';

    // En-tête : titre + boutons réduire / plein écran / fermer
    const header = document.createElement('div');
    header.className = 'dc2-header';
    header.innerHTML = `
        <span class="dc2-title">✏️ Défi calme — Dessin</span>
        <div class="wf-btns">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    controls.appendChild(header);

    // Ligne 1 : Mode + Tolérance + Durée
    const row1 = document.createElement('div');
    row1.className = 'dc2-row';
    row1.style.justifyContent = 'space-between';

    const modeLabel = document.createElement('span');
    modeLabel.className = 'dc2-label';
    modeLabel.textContent = 'Mode';

    const modeWrap = document.createElement('div');
    modeWrap.className = 'dc2-mode-wrap';
    const modes = [
        { key: 'crayon',   label: 'Crayon',   title: 'Les contours se tracent, puis les couleurs arrivent' },
        { key: 'peinture', label: 'Peinture', title: 'Chaque forme est tracée puis coloriée' },
        { key: 'magie',    label: 'Magie',    title: 'Les formes apparaissent une par une' }
    ];
    const modeBtns = {};
    modes.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'dc2-mode-btn' + (m.key === 'crayon' ? ' active' : '');
        btn.textContent = m.label;
        btn.title = m.title;
        btn.dataset.mode = m.key;
        modeWrap.appendChild(btn);
        modeBtns[m.key] = btn;
    });

    function makePill(initial) {
        const pill = document.createElement('div');
        pill.className = 'dc2-time-pill';
        const minus = document.createElement('button');
        minus.className = 'dc2-time-btn';
        minus.textContent = '−';
        const val = document.createElement('span');
        val.className = 'dc2-time-val';
        val.textContent = initial;
        const plus = document.createElement('button');
        plus.className = 'dc2-time-btn';
        plus.textContent = '+';
        pill.appendChild(minus);
        pill.appendChild(val);
        pill.appendChild(plus);
        return { pill, minus, val, plus };
    }

    const sensLabel = document.createElement('span');
    sensLabel.className = 'dc2-label';
    sensLabel.textContent = 'Tolérance';
    const sens = makePill('40');

    const durLabel = document.createElement('span');
    durLabel.className = 'dc2-label';
    durLabel.textContent = 'Durée';
    const dur = makePill('10:00');

    const groupMode = document.createElement('div');
    groupMode.className = 'dc2-group';
    groupMode.style.flex = '1';
    groupMode.style.justifyContent = 'flex-start';
    groupMode.appendChild(modeLabel);
    groupMode.appendChild(modeWrap);

    const groupSens = document.createElement('div');
    groupSens.className = 'dc2-group';
    groupSens.style.justifyContent = 'flex-end';
    groupSens.appendChild(sensLabel);
    groupSens.appendChild(sens.pill);

    const groupDur = document.createElement('div');
    groupDur.className = 'dc2-group';
    groupDur.style.justifyContent = 'flex-end';
    groupDur.appendChild(durLabel);
    groupDur.appendChild(dur.pill);

    // Durée et tolérance empilées à droite
    const groupRight = document.createElement('div');
    groupRight.className = 'dc2-settings-col';
    groupRight.appendChild(groupDur);
    groupRight.appendChild(groupSens);
    dur.pill.classList.add('dc2-compact');
    sens.pill.classList.add('dc2-compact');

    row1.appendChild(groupMode);
    row1.appendChild(groupRight);

    // Ligne 2 : Dessin (import SVG / URL / aléatoire / aperçu / transparence)
    const row3 = document.createElement('div');
    row3.className = 'dc2-row';

    const imgLabel = document.createElement('span');
    imgLabel.className = 'dc2-label';
    imgLabel.textContent = 'Dessin';

    const urlInput = document.createElement('input');
    urlInput.className = 'dc2-url-input';
    urlInput.type = 'text';

    const importFileInput = document.createElement('input');
    importFileInput.type = 'file';
    importFileInput.accept = '.svg,image/svg+xml';
    importFileInput.style.display = 'none';

    const btnImport = document.createElement('button');
    btnImport.className = 'dc2-url-btn';
    btnImport.style.background = '#059669';
    btnImport.textContent = '📁';
    btnImport.title = 'Importer un dessin SVG depuis votre appareil';

    const randBtn = document.createElement('button');
    randBtn.className = 'dc2-url-btn';
    randBtn.style.background = '#6366f1';
    randBtn.textContent = '🎲';
    randBtn.title = 'Autre dessin';

    const btnApercu = document.createElement('button');
    btnApercu.className = 'dc2-url-btn';
    btnApercu.style.background = '#6366f1';
    btnApercu.textContent = '👁';
    btnApercu.title = 'Aperçu';

    const btnTransp = document.createElement('button');
    btnTransp.className = 'dc2-url-btn';
    btnTransp.style.background = '#374151';
    btnTransp.title = 'Masquer/afficher le panneau de contrôle';
    btnTransp.textContent = '⬜';

    row3.appendChild(imgLabel);
    row3.appendChild(btnImport);
    row3.appendChild(importFileInput);
    row3.appendChild(urlInput);
    row3.appendChild(randBtn);
    row3.appendChild(btnApercu);
    row3.appendChild(btnTransp);

    // Boutons action flottants
    const btnRow = document.createElement('div');
    btnRow.className = 'dc2-action-row';

    const btnStart = document.createElement('button');
    btnStart.className = 'dc2-float-action-btn dc2-start';
    btnStart.textContent = '▶ Démarrer';

    const btnStop = document.createElement('button');
    btnStop.className = 'dc2-float-action-btn dc2-stop dc2-hidden';
    btnStop.textContent = '■ Stop';

    const btnReset = document.createElement('button');
    btnReset.className = 'dc2-float-action-btn dc2-new dc2-hidden';
    btnReset.textContent = '🔄 Nouveau défi';

    btnRow.appendChild(btnStart);
    btnRow.appendChild(btnStop);
    btnRow.appendChild(btnReset);
    imageZone.appendChild(btnRow);

    controls.appendChild(row1);
    controls.appendChild(row3);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'dc2-resize-handle';

    container.appendChild(controls);
    container.appendChild(imageZone);
    container.appendChild(resizeHandle);
    widget.appendChild(container);

    // ═════════════════════════════════════════════════════════════════════
    // LOGIQUE INTERNE
    // ═════════════════════════════════════════════════════════════════════

    let isPlaying = false;
    let progress = 0;
    let lastTime = 0;
    let currentMode = 'crayon';
    let totalSeconds = 600;
    let sensValue = 40;
    let apercuActive = false;
    let drawingIndex = Math.floor(Math.random() * DC2_DRAWINGS.length);

    // Éléments du dessin courant
    let items = [];        // { el, wrap, len, start, w, wStart, fo, cx, cy }
    let totalLen = 0;
    let totalW = 0;
    let totalAll = 0;
    let penMarker = null;

    let audioContext = null;
    let analyser = null;
    let audioStream = null;

    const clamp01 = v => Math.max(0, Math.min(1, v));

    // ── Temps / tolérance ────────────────────────────────────────────────
    function formatTime(s) {
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function adjustTime(delta) {
        totalSeconds = Math.max(DC2_CONFIG.minTimeSeconds, Math.min(DC2_CONFIG.maxTimeSeconds, totalSeconds + delta * DC2_CONFIG.timeAdjustUnit));
        dur.val.textContent = formatTime(totalSeconds);
    }
    function adjustSens(delta) {
        sensValue = Math.max(1, Math.min(100, sensValue + delta));
        sens.val.textContent = sensValue;
    }

    // ── Chargement d'un dessin ───────────────────────────────────────────
    function sanitizeSvg(root) {
        root.querySelectorAll('script, style, foreignObject, image, use[href^="http"]').forEach(n => n.remove());
        root.querySelectorAll('*').forEach(n => {
            [...n.attributes].forEach(a => {
                if (/^on/i.test(a.name)) n.removeAttribute(a.name);
                if (/href$/i.test(a.name) && /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
            });
        });
    }

    // content : élément <svg> source (ses enfants sont copiés), viewBox : "x y w h"
    function buildDrawing(sourceSvg, viewBox) {
        drawSvg.innerHTML = '';
        drawSvg.setAttribute('viewBox', viewBox);
        const vb = viewBox.split(/[\s,]+/).map(Number);
        const penW = Math.max(vb[2], vb[3]) / 180;

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('stroke-linecap', 'round');
        g.setAttribute('stroke-linejoin', 'round');
        [...sourceSvg.childNodes].forEach(n => g.appendChild(document.importNode(n, true)));
        drawSvg.appendChild(g);

        // Pointe du crayon
        penMarker = document.createElementNS(SVG_NS, 'circle');
        penMarker.setAttribute('class', 'dc2-pen');
        penMarker.setAttribute('r', penW * 2.2);
        penMarker.setAttribute('fill', DC2_CONFIG.penColor);
        penMarker.setAttribute('stroke', '#ffffff');
        penMarker.setAttribute('stroke-width', penW * 0.8);
        penMarker.style.opacity = '0';
        drawSvg.appendChild(penMarker);

        const nodes = [...g.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')]
            .filter(el => !el.closest('defs, clipPath, mask, pattern, symbol, marker'));

        // Une forme qui couvre (presque) tout le dessin est un fond :
        // on ne lui trace pas de contour (sinon un cadre noir apparaît autour du dessin)
        function isBackground(el) {
            if (el.hasAttribute('data-nostroke')) return true;
            try {
                const b = el.getBBox();
                return b.x <= vb[0] + vb[2] * 0.02 && b.y <= vb[1] + vb[3] * 0.02 &&
                       b.x + b.width  >= vb[0] + vb[2] * 0.98 &&
                       b.y + b.height >= vb[1] + vb[3] * 0.98;
            } catch (e) { return false; }
        }

        items = [];
        nodes.forEach(el => {
            const cs = getComputedStyle(el);
            const noStroke = isBackground(el);
            if (noStroke) {
                el.style.stroke = 'none';
            } else if (cs.stroke === 'none' || !cs.stroke) {
                el.style.stroke = DC2_CONFIG.penColor;
                el.style.strokeWidth = penW;
            }
            const fo = parseFloat(cs.fillOpacity);

            let len = 0;
            try { len = el.getTotalLength(); } catch (e) { len = 0; }
            if (!len || !isFinite(len)) {
                try { const b = el.getBBox(); len = 2 * (b.width + b.height); } catch (e) { len = 1; }
            }
            len = Math.max(len, 0.5);
            // Pas de contour à tracer : le crayon ne s'y attarde pas
            if (noStroke) len = 0.5;

            // Groupe enveloppe (pour le mode Magie : zoom autour du centre)
            const wrap = document.createElementNS(SVG_NS, 'g');
            el.parentNode.insertBefore(wrap, el);
            wrap.appendChild(el);
            let cx = 0, cy = 0;
            try { const b = wrap.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } catch (e) {}

            // Poids visuels : longueur du contour à tracer, et surface à colorier
            // (racine de la surface, pour être comparable à une longueur)
            const hasFill = cs.fill && cs.fill !== 'none' && (isFinite(fo) ? fo : 1) > 0;
            let area = 0;
            try {
                const b = el.getBBox();
                area = Math.max(0, b.width) * Math.max(0, b.height);
                area = Math.min(area, vb[2] * vb[3]);
            } catch (e) {}
            const sw = noStroke ? 0 : len;
            const fw = hasFill ? 2 * Math.sqrt(area) : 0;

            items.push({ el, wrap, len, sw, fw, fo: isFinite(fo) ? fo : 1, cx, cy });
        });

        // Positions cumulées : chaque étape dure en proportion de ce qu'elle
        // ajoute au dessin, pour une apparition régulière du début à la fin.
        totalLen = 0;   // somme des contours
        totalW = 0;     // somme des surfaces
        items.forEach(it => { it.sStart = totalLen; totalLen += it.sw; });
        items.forEach(it => { it.fStart = totalW; totalW += it.fw; });
        let acc = 0;    // contour + coloriage enchaînés forme par forme
        items.forEach(it => { it.pStart = acc; acc += it.sw + it.fw; });
        totalAll = acc;

        updateUI();
    }

    function loadBuiltin(index) {
        drawingIndex = index;
        const d = DC2_DRAWINGS[index];
        const tmp = new DOMParser().parseFromString(
            `<svg xmlns="${SVG_NS}" viewBox="0 0 160 90">${d.svg}</svg>`, 'image/svg+xml');
        buildDrawing(tmp.documentElement, '0 0 160 90');
        urlInput.value = '';
        urlInput.placeholder = d.name + ' (ou URL d\'un dessin SVG…)';
    }

    function loadSvgText(text, label) {
        const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
        const root = doc.documentElement;
        if (!root || root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) {
            alert('Ce fichier n\'est pas un dessin SVG lisible. Choisissez un fichier .svg.');
            return false;
        }
        sanitizeSvg(root);
        let vb = root.getAttribute('viewBox');
        if (!vb) {
            const w = parseFloat(root.getAttribute('width')) || 160;
            const h = parseFloat(root.getAttribute('height')) || 90;
            vb = `0 0 ${w} ${h}`;
        }
        buildDrawing(root, vb);
        urlInput.value = label || '';
        return true;
    }

    async function loadFromUrl(url) {
        url = url.trim();
        if (!url) return;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.status);
            const text = await res.text();
            if (loadSvgText(text, url)) { resetDefi(); setApercu(true); }
        } catch (e) {
            alert('Impossible de charger ce dessin. Vérifiez que l\'adresse mène à un fichier .svg accessible, ou importez-le avec 📁.');
        }
    }

    // ── Rendu progressif ─────────────────────────────────────────────────
    function setStroke(it, f) {
        const el = it.el;
        if (f >= 1) {
            el.style.strokeDasharray = 'none';
            el.style.strokeDashoffset = '0';
            el.style.strokeOpacity = '';
        } else if (f <= 0) {
            el.style.strokeOpacity = '0';
        } else {
            el.style.strokeOpacity = '';
            el.style.strokeDasharray = `${it.len} ${it.len + 1}`;
            el.style.strokeDashoffset = String(it.len * (1 - f));
        }
    }
    function setFill(it, f) {
        it.el.style.fillOpacity = String(f * it.fo);
    }
    function setWrap(it, f) {
        if (f >= 1) {
            it.wrap.removeAttribute('transform');
            it.wrap.style.opacity = '';
            return;
        }
        // léger rebond à l'apparition
        const s = 0.4 + 0.6 * (1 - Math.pow(1 - f, 3)) + Math.sin(f * Math.PI) * 0.08;
        it.wrap.setAttribute('transform', `translate(${it.cx} ${it.cy}) scale(${s}) translate(${-it.cx} ${-it.cy})`);
        it.wrap.style.opacity = String(f);
    }

    function placePen(it, f) {
        if (!penMarker) return;
        if (!it || !isPlaying || f <= 0 || f >= 1) { penMarker.style.opacity = '0'; return; }
        try {
            const p = it.el.getPointAtLength(it.len * f);
            const m = drawSvg.getScreenCTM().inverse().multiply(it.el.getScreenCTM());
            const pt = drawSvg.createSVGPoint();
            pt.x = p.x; pt.y = p.y;
            const q = pt.matrixTransform(m);
            penMarker.setAttribute('cx', q.x);
            penMarker.setAttribute('cy', q.y);
            penMarker.style.opacity = '1';
        } catch (e) {
            penMarker.style.opacity = '0';
        }
    }

    // Avancement (0 → 1) d'une étape qui commence à « start » et dure « w »
    function frac(t, start, w) {
        if (w <= 0) return t > start ? 1 : 0;
        return clamp01((t - start) / w);
    }

    function renderDrawing(prog) {
        const N = items.length;
        if (!N) return;
        let penItem = null, penF = 0;
        const p = clamp01(prog / 100);

        if (currentMode === 'crayon') {
            // Tous les contours, puis toutes les couleurs, au même rythme
            const t = p * (totalLen + totalW);
            items.forEach(it => {
                const fs = frac(t, it.sStart, it.sw);
                setWrap(it, 1);
                setStroke(it, fs);
                setFill(it, frac(t - totalLen, it.fStart, it.fw));
                if (fs > 0 && fs < 1) { penItem = it; penF = fs; }
            });
        } else if (currentMode === 'peinture') {
            // Chaque forme : contour puis coloriage, l'une après l'autre
            const t = p * totalAll;
            items.forEach(it => {
                const fs = frac(t, it.pStart, it.sw);
                setWrap(it, 1);
                setStroke(it, fs);
                setFill(it, frac(t, it.pStart + it.sw, it.fw));
                if (fs > 0 && fs < 1) { penItem = it; penF = fs; }
            });
        } else { // magie : chaque forme apparaît, plus ou moins longuement selon sa taille
            const t = p * totalAll;
            items.forEach(it => {
                setStroke(it, 1);
                setFill(it, 1);
                setWrap(it, frac(t, it.pStart, it.sw + it.fw));
            });
        }
        placePen(penItem, penF);
    }

    // ── Visualisation ─────────────────────────────────────────────────────
    function currentThreshold() {
        return DC2_CONFIG.baseThreshold - (sensValue * DC2_CONFIG.sensitivityFactor);
    }
    function updateMicBar(vol) {
        micBarFill.style.width = Math.min(vol * DC2_CONFIG.volumeMultiplier, 100) + '%';
        micBarFill.style.background = vol < currentThreshold() ? '#22c55e' : '#ef4444';
    }
    function updateProgress(prog) {
        const pStr = Math.floor(prog) + '%';
        percentBadge.textContent = pStr;
        progBarFill.style.height = pStr;
    }
    function updateUI() {
        updateProgress(progress);
        renderDrawing(apercuActive ? 100 : progress);
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    async function initAudio() {
        if (audioContext) return true;
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            audioContext.createMediaStreamSource(audioStream).connect(analyser);
            return true;
        } catch (err) {
            alert('🎤 Micro non accessible. Vérifiez les permissions.');
            return false;
        }
    }
    function getVolume() {
        if (!analyser) return 0;
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        return arr.reduce((a, b) => a + b) / arr.length;
    }
    function stopAudio() {
        if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
        if (audioContext) { audioContext.close(); audioContext = null; }
        analyser = null;
    }

    // ── Jeu ───────────────────────────────────────────────────────────────
    let rafId = null;

    function gameLoop(now) {
        if (!isPlaying) return;
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        const vol = getVolume();
        updateMicBar(vol);

        const speed = 100 / totalSeconds;
        if (vol < currentThreshold()) {
            progress = Math.min(100, progress + speed * delta);
        } else {
            progress = Math.max(0, progress - speed * delta * 2);
        }
        updateUI();

        if (progress >= 100) {
            isPlaying = false;
            rafId = null;
            if (penMarker) penMarker.style.opacity = '0';
            btnStart.classList.add('dc2-hidden');
            btnStop.classList.add('dc2-hidden');
            btnReset.classList.remove('dc2-hidden');
            return;
        }
        rafId = requestAnimationFrame(gameLoop);
    }

    async function toggleStart() {
        if (!isPlaying) {
            const ok = await initAudio();
            if (!ok) return;
            isPlaying = true;
            lastTime = performance.now();
            msgStart.style.display = 'none';
            rafId = requestAnimationFrame(gameLoop);
            btnStart.textContent = '⏸ Pause';
            btnStart.classList.remove('dc2-start');
            btnStop.classList.remove('dc2-hidden');
        } else {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            if (penMarker) penMarker.style.opacity = '0';
            btnStart.textContent = '▶ Reprendre';
            btnStart.classList.add('dc2-start');
        }
    }

    function stopDefi() {
        isPlaying = false;
        progress = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopAudio();
        micBarFill.style.width = '0%';
        updateUI();
        btnStart.textContent = '▶ Démarrer';
        btnStart.classList.add('dc2-hidden', 'dc2-start');
        btnStop.classList.add('dc2-hidden');
        btnReset.classList.remove('dc2-hidden');
        msgStart.style.display = 'flex';
    }

    function resetDefi() {
        isPlaying = false;
        progress = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopAudio();
        micBarFill.style.width = '0%';
        if (apercuActive) setApercu(false);
        updateUI();
        btnStart.textContent = '▶ Démarrer';
        btnStart.classList.add('dc2-start');
        btnStart.classList.remove('dc2-hidden');
        btnStop.classList.add('dc2-hidden');
        btnReset.classList.add('dc2-hidden');
        msgStart.style.display = 'flex';
    }

    // ── Mode ──────────────────────────────────────────────────────────────
    function setMode(mode) {
        currentMode = mode;
        Object.values(modeBtns).forEach(b => b.classList.remove('active'));
        modeBtns[mode].classList.add('active');
        updateUI();
    }

    // ── Aperçu ────────────────────────────────────────────────────────────
    function setApercu(on) {
        apercuActive = on;
        btnApercu.textContent = on ? '🙈' : '👁';
        btnApercu.title = on ? 'Cacher le dessin' : 'Aperçu';
        btnApercu.style.background = on ? '#ef4444' : '#6366f1';
        msgStart.style.visibility = on ? 'hidden' : '';
        updateUI();
    }
    btnApercu.addEventListener('click', () => setApercu(!apercuActive));

    // ── Resize ────────────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = container.offsetWidth;
        document.onmousemove = (ev) => {
            const newW = Math.max(320, startW + ev.clientX - startX);
            container.style.width = newW + 'px';
            widget.dataset.widthPercent = (newW / window.innerWidth) * 100;
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.touches[0].clientX;
        const startW = container.offsetWidth;
        function onMove(ev) {
            const newW = Math.max(320, startW + ev.touches[0].clientX - startX);
            container.style.width = newW + 'px';
            widget.dataset.widthPercent = (newW / window.innerWidth) * 100;
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // ── Fond transparent / masquer les contrôles ──────────────────────────
    let isTransparent = false;
    btnTransp.addEventListener('click', () => {
        isTransparent = !isTransparent;
        controls.style.display = isTransparent ? 'none' : 'flex';
        container.style.background = isTransparent ? 'transparent' : '';
        container.style.boxShadow = isTransparent ? 'none' : '';
        widget.dataset.transparent = isTransparent ? 'true' : 'false';
        floatBtn.style.display = isTransparent ? 'block' : 'none';
        btnTransp.textContent = isTransparent ? '🔲' : '⬜';
        btnTransp.title = isTransparent ? 'Afficher les contrôles' : 'Fond transparent';
        btnTransp.style.background = isTransparent ? '#ef4444' : '#374151';
        saveBoard();
    });

    const floatBtn = document.createElement('button');
    const styleNormal = `
        display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
        background: rgba(0,0,0,0.0); border: 1px solid rgba(0,0,0,0.2);
        color: rgba(0,0,0,0.5); font-size: 8px; font-weight: 800; padding: 4px 8px;
        border-radius: 6px; cursor: pointer;
        text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
    `;
    const styleHover = `
        display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
        background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.8);
        color: rgba(255,255,255,0.85); font-size: 8px; font-weight: 800; padding: 4px 8px;
        border-radius: 6px; cursor: pointer;
        text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
    `;
    floatBtn.style.cssText = styleNormal;
    floatBtn.onmouseover = () => { floatBtn.style.cssText = styleHover; };
    floatBtn.onmouseout = () => { floatBtn.style.cssText = styleNormal; };
    floatBtn.textContent = '🔲 Contrôles';
    floatBtn.addEventListener('click', () => btnTransp.click());
    imageZone.appendChild(floatBtn);

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false;

    // En plein écran, le dessin garde son format 16/9 et occupe la place restante
    function fitFullboard() {
        if (!_isMax) { imageZone.style.width = ''; return; }
        const cs = getComputedStyle(container);
        const availW = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        const availH = container.clientHeight - controls.offsetHeight;
        imageZone.style.width = Math.max(100, Math.min(availW, availH * 16 / 9)) + 'px';
        updateUI();
    }

    [wfMin, wfMax, wfClose].forEach(b => b.addEventListener('mousedown', (e) => e.stopPropagation()));

    wfMin.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_isMax) wfMax.click();
        if (isPlaying) stopDefi();
        window._wfMiniBarCollapse(widget, '✏️ Défi calme — Dessin', { onExpand: updateUI });
    });
    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        widget.classList.toggle('dc2-is-full', _isMax);
        wfMax.title = _isMax ? 'Quitter le plein écran' : 'Plein écran';
        requestAnimationFrame(() => { fitFullboard(); updateUI(); });
    });

    // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
    // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
    {
        const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
        container.addEventListener('touchstart',  stopInMax, { passive: true });
        container.addEventListener('pointerdown', stopInMax);
        container.addEventListener('mousedown',   stopInMax);
    }
    wfClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) stopDefi();
        stopAudio();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });
    const onWinResize = () => {
        if (!widget.isConnected) { window.removeEventListener('resize', onWinResize); return; }
        if (_isMax) fitFullboard();
    };
    window.addEventListener('resize', onWinResize);
    const onEscKey = (e) => {
        if (!widget.isConnected) { document.removeEventListener('keydown', onEscKey); return; }
        if (e.key === 'Escape' && _isMax) wfMax.click();
    };
    document.addEventListener('keydown', onEscKey);

    // ── Boutons de jeu ────────────────────────────────────────────────────
    btnStart.addEventListener('click', () => {
        if (apercuActive) setApercu(false);
        toggleStart();
    });
    btnStop.addEventListener('click', stopDefi);
    btnReset.addEventListener('click', resetDefi);

    Object.values(modeBtns).forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // Appui long sur + / − (souris et tactile)
    function bindRepeat(btn, fn) {
        btn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            fn();
            const iv = setInterval(fn, 120);
            window.addEventListener('mouseup', () => clearInterval(iv), { once: true });
        });
        btn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            fn();
            const iv = setInterval(fn, 120);
            window.addEventListener('touchend', () => clearInterval(iv), { once: true });
        }, { passive: true });
    }
    bindRepeat(dur.minus, () => adjustTime(-1));
    bindRepeat(dur.plus, () => adjustTime(1));
    bindRepeat(sens.minus, () => adjustSens(-1));
    bindRepeat(sens.plus, () => adjustSens(1));

    // ── Choix du dessin ───────────────────────────────────────────────────
    urlInput.addEventListener('mousedown', (e) => e.stopPropagation());
    urlInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') loadFromUrl(urlInput.value);
    });
    randBtn.addEventListener('click', () => {
        let next = drawingIndex;
        if (DC2_DRAWINGS.length > 1) {
            while (next === drawingIndex) next = Math.floor(Math.random() * DC2_DRAWINGS.length);
        }
        loadBuiltin(next);
        resetDefi();
        // Le nouveau dessin reste visible jusqu'au clic sur « Cacher le dessin »
        setApercu(true);
    });
    btnImport.addEventListener('click', (e) => {
        e.stopPropagation();
        importFileInput.click();
    });
    importFileInput.addEventListener('change', () => {
        const file = importFileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (loadSvgText(String(reader.result), file.name)) { resetDefi(); setApercu(true); }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    // Nettoyage à la suppression du widget
    const observer = new MutationObserver(() => {
        if (!widget.isConnected) {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            stopAudio();
            observer.disconnect();
        }
    });

    // ── Init ──────────────────────────────────────────────────────────────
    board.appendChild(widget);
    observer.observe(widget.parentNode || document.body, { childList: true });
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Le dessin est construit une fois le widget dans la page (mesure des tracés)
    loadBuiltin(drawingIndex);
    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && !_isMax) wfMax.click();
    saveBoard();
    return widget;
}
