// =========================================================================
// WIDGET DÉFI CALME — Le Bureau du Prof
// Révèle une image au silence (micro) — 7 modes : pixels, flou, zoom, mosaïque, spirale, pinceau, peinture
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
        .widget[data-type="deficalme"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Thème clair (body.menu-light) ── */
        body.menu-light .dc-container {
            background: #f0f2f5;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc-controls {
            background: #e2e6ea;
            border-bottom: 1px solid rgba(0,0,0,0.1);
        }
        body.menu-light .dc-label {
            opacity: 0.55;
            color: #1a1a1a;
        }
        body.menu-light .dc-mode-wrap {
            background: rgba(0,0,0,0.07);
        }
        body.menu-light .dc-mode-btn {
            border-color: rgba(0,0,0,0.12);
            color: rgba(0,0,0,0.5);
        }
        body.menu-light .dc-time-pill {
            background: rgba(0,0,0,0.07);
            border-color: rgba(0,0,0,0.12);
        }
        body.menu-light .dc-time-val {
            color: #1a1a1a;
        }
        body.menu-light .dc-slider {
            background: rgba(0,0,0,0.12);
        }
        body.menu-light .dc-url-input {
            background: rgba(0,0,0,0.06);
            border-color: rgba(0,0,0,0.15);
            color: #1a1a1a;
        }
        body.menu-light .dc-url-input::placeholder {
            color: rgba(0,0,0,0.35);
        }
        body.menu-light .dc-pixel-block {
            background: #f0f2f5;
        }
        body.menu-light .dc-msg-start {
            color: #1a1a1a;
        }
        body.menu-light .dc-resize-handle {
            background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%);
        }

        .dc-container {
            background: #121212;
            border: 0px solid rgba(255,255,255,0.12);
			border-radius: 5px;
            display: flex;
            flex-direction: column;
            width: 800px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: #fff;
            position: relative;
            user-select: none;
        }

        /* ── Image zone ── */
        .dc-image-zone {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            background: #000;
            overflow: hidden;
            flex-shrink: 0;
        }

        .dc-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: filter 0.3s ease, transform 0.3s ease;
        }

        .dc-pixel-grid {
            position: absolute;
            inset: 0;
            display: grid;
            pointer-events: none;
            z-index: 5;
        }

        .dc-pixel-block {
            background: #121212;
            transition: opacity 0.2s ease;
        }
        .dc-pixel-block.dc-revealed { opacity: 0; }

        /* Mode mosaïque : image pixelisée qui s'affine */
        .dc-mosaic-canvas, .dc-brush-canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 4;
            display: none;
            image-rendering: pixelated;
        }
        /* Pinceau : bords adoucis par un léger flou, canvas débordant pour
           que le flou n'éclaircisse pas les bords de l'image */
        .dc-brush-canvas.dc-brush-canvas {
            inset: -8px;
            width: calc(100% + 16px);
            height: calc(100% + 16px);
            filter: blur(3px);
            image-rendering: auto;
        }
        /* Peinture : esquisse au crayon puis couleur, rendu lissé */
        .dc-mosaic-canvas.dc-paint-canvas {
            image-rendering: auto;
            z-index: 4;
        }


        .dc-msg-start {
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
            opacity: 0.45;
            pointer-events: none;
            color: #fff;
        }

        /* Aperçu avant défi */
        .dc-preview-overlay {
            position: absolute;
            inset: 0;
            z-index: 12;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.45);
            pointer-events: none;
        }
        .dc-preview-overlay.active { display: flex; }
        .dc-preview-label {
            font-size: 13px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #fff;
            text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        }
        .dc-preview-countdown {
            font-size: 52px;
            font-weight: 900;
            color: #fff;
            text-shadow: 0 4px 16px rgba(0,0,0,0.8);
            line-height: 1;
            margin-top: 4px;
        }

        /* ── Barre micro (en bas de l'image) ── */
        .dc-mic-bar-wrap {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 5px;
            background: rgba(255,255,255,0.08);
            z-index: 8;
        }
        .dc-mic-bar-fill {
            height: 100%;
            width: 0%;
            background: #3b82f6;
            transition: width 0.08s;
        }

        /* ── Barre progression (à droite de l'image) ── */
        .dc-prog-bar-wrap {
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 10px;
            background: rgba(255,255,255,0.08);
            z-index: 8;
            display: flex;
            flex-direction: column-reverse;
        }
        .dc-prog-bar-fill {
            width: 100%;
            height: 0%;
            background: #3b82f6;
            transition: height 0.15s;
        }
        .dc-percent-badge {
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

        /* ── Panneau contrôles (compact, sous l'image) ── */
        .dc-controls {
            padding: 8px 12px 10px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            background: #1a1a1a;
            border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .dc-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .dc-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .dc-label {
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.4;
            flex-shrink: 0;
        }

        /* Mode selector */
        .dc-mode-wrap {
            display: flex;
            flex-wrap: wrap;
            background: rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 3px;
            gap: 3px;
        }
        .dc-mode-btn {
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
        .dc-mode-btn.active {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
        }

        /* Durée */
        .dc-time-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 50px;
            padding: 3px 10px;
        }
        .dc-time-val {
            font-size: 12px;
            font-weight: 900;
            min-width: 42px;
            text-align: center;
        }
        .dc-time-btn {
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
        .dc-time-btn:active { transform: scale(0.88); }

        /* Colonne de réglages à droite (durée / tolérance) */
        .dc-settings-col {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            margin-left: auto;
        }
        .dc-settings-col .dc-group { gap: 6px; }
        .dc-settings-col .dc-label { min-width: 52px; text-align: right; }
        .dc-time-pill.dc-compact { padding: 2px 6px; gap: 4px; }
        .dc-time-pill.dc-compact .dc-time-val { font-size: 11px; min-width: 34px; }
        .dc-time-pill.dc-compact .dc-time-btn { width: 17px; height: 17px; font-size: 11px; }

        /* Sensibilité */
        .dc-slider {
            flex: 1;
            height: 6px;
            border-radius: 4px;
            background: rgba(255,255,255,0.1);
            accent-color: #3b82f6;
            cursor: pointer;
            min-width: 60px;
        }
        .dc-sens-val {
            font-size: 10px;
            font-weight: 900;
            background: #3b82f6;
            color: #fff;
            padding: 1px 6px;
            border-radius: 4px;
            min-width: 28px;
            text-align: center;
        }

        /* Boutons action */
        .dc-btn-row {
            display: flex;
            gap: 6px;
            justify-content: center;
        }
        .dc-action-btn {
            flex: 1;
            max-width: 160px;
            padding: 7px 10px;
            border-radius: 10px;
            font-weight: 900;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            cursor: pointer;
            border: none;
            background: #3b82f6;
            color: #fff;
            transition: opacity 0.15s, transform 0.1s;
        }
        .dc-action-btn:active { transform: scale(0.96); }
        .dc-action-btn:hover { opacity: 0.88; }
        .dc-action-btn.dc-hidden { display: none !important; }
        .dc-action-btn.dc-stop { background: #ef4444; }
        .dc-action-btn.dc-new  { background: #10b981; }

        /* Boutons action flottants (sur l'image, transparents hors survol) */
        .dc-action-row {
            position: absolute;
            bottom: 8px;
            left: 15px;
            z-index: 15;
            display: flex;
            gap: 6px;
        }
        .dc-float-action-btn {
            background: rgba(0,0,0,0.0);
            border: 1px solid rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.55);
            font-size: 9px;
            font-weight: 900;
            padding: 5px 10px;
            border-radius: 6px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: all 0.2s;
        }
        .dc-float-action-btn:hover {
            background: rgba(0,0,0,0.8);
            border-color: rgba(255,255,255,0.8);
            color: #fff;
        }
        .dc-float-action-btn:active { transform: scale(0.96); }
        .dc-float-action-btn.dc-stop:hover { border-color: #ef4444; color: #ef4444; }
        .dc-float-action-btn.dc-hidden { display: none !important; }
        /* Le bouton Démarrer / Reprendre reste bien visible hors phase de lecture */
        .dc-float-action-btn.dc-start {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
        }
        .dc-float-action-btn.dc-start:hover {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
            opacity: 0.88;
        }
        /* Le bouton "Nouveau défi" reste bien visible une fois le défi stoppé */
        .dc-float-action-btn.dc-new {
            background: #10b981 !important;
            border-color: #10b981 !important;
            color: #fff !important;
        }
        .dc-float-action-btn.dc-new:hover {
            background: #10b981 !important;
            border-color: #10b981 !important;
            color: #fff !important;
            opacity: 0.88;
        }

        /* Image URL input */
        .dc-url-input {
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
        .dc-url-input::placeholder { color: rgba(255,255,255,0.25); }
        .dc-url-input:focus { border-color: #3b82f6; }
        .dc-url-btn {
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

        /* Resize */
        .dc-resize-handle {
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
        .dc-container:hover .dc-resize-handle { opacity: 1; }

        /* En-tête (titre + boutons fenêtre) */
        .dc-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .dc-title {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.03em;
            margin-right: auto;
            pointer-events: none;
            white-space: nowrap;
        }

        /* Plein écran (fullboard) */
        .dc-container.wf-fullboard {
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
        /* En plein écran, masquer les poignées du tableau (déplacer, pivoter, menu…) */
        .widget.dc-is-full > .drag-handle,
        .widget.dc-is-full > .widget-rotate-handle,
        .widget.dc-is-full > .widget-action-bar,
        .widget.dc-is-full > .widget-ctx-menu {
            display: none !important;
        }
        .dc-container.wf-fullboard .dc-image-zone {
            align-self: center;
            margin: auto 0;
        }
        .dc-container.wf-fullboard .dc-resize-handle { display: none; }

        /* ── Téléphone : plein écran du bouton vert à la hauteur réelle de l'écran (la marge gauche laisse déjà les onglets visibles) ── */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .dc-container.wf-fullboard {
                height: 100dvh !important;
            }
        }
    `;
    document.head.appendChild(s);
})();

// ── Constantes ────────────────────────────────────────────────────────────
const DC_CONFIG = {
    volumeMultiplier: 3,
    baseThreshold: 60,
    sensitivityFactor: 0.55,
    timeAdjustUnit: 15,
    minTimeSeconds: 5,
    maxTimeSeconds: 3600,
    pixelDensityFactor: 0.4,
    // Courbe de révélation : [temps écoulé %, image révélée %]
    // (interpolation linéaire entre les points)
    brushSize: 0.015, // rayon du pinceau (fraction de la largeur de l'image) — modes pinceau et spirale
    revealCurve: [[0, 0], [50, 30], [80, 55], [90, 70], [95, 80], [100, 100]],
    defaultImageUrl: 'https://picsum.photos/900/500?random=' + Math.floor(Math.random() * 1000)
};

// ── Création du widget ────────────────────────────────────────────────────
// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

function createDeficalmeWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'deficalme';
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

    // ── Container principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'dc-container';

    // ── Zone image ────────────────────────────────────────────────────────
    const imageZone = document.createElement('div');
    imageZone.className = 'dc-image-zone';

    const imgEl = document.createElement('img');
    imgEl.className = 'dc-image';
    imgEl.src = DC_CONFIG.defaultImageUrl;
    imgEl.alt = 'Défi Calme';
    imgEl.crossOrigin = 'anonymous';

    const pixelGrid = document.createElement('div');
    pixelGrid.className = 'dc-pixel-grid';

    const msgStart = document.createElement('div');
    msgStart.className = 'dc-msg-start';
    msgStart.innerHTML = '🤫 Restez silencieux<br>pour révéler l\'image…';

    const micBarWrap = document.createElement('div');
    micBarWrap.className = 'dc-mic-bar-wrap';
    const micBarFill = document.createElement('div');
    micBarFill.className = 'dc-mic-bar-fill';
    micBarWrap.appendChild(micBarFill);

    const progBarWrap = document.createElement('div');
    progBarWrap.className = 'dc-prog-bar-wrap';
    const progBarFill = document.createElement('div');
    progBarFill.className = 'dc-prog-bar-fill';
    progBarWrap.appendChild(progBarFill);

    const percentBadge = document.createElement('div');
    percentBadge.className = 'dc-percent-badge';
    percentBadge.textContent = '0%';

    imageZone.appendChild(imgEl);
    imageZone.appendChild(pixelGrid);

    const mosaicCanvas = document.createElement('canvas');
    mosaicCanvas.className = 'dc-mosaic-canvas';
    imageZone.appendChild(mosaicCanvas);

    const brushCanvas = document.createElement('canvas');
    brushCanvas.className = 'dc-brush-canvas';
    imageZone.appendChild(brushCanvas);

    const paintCanvas = document.createElement('canvas');
    paintCanvas.className = 'dc-mosaic-canvas dc-paint-canvas';
    imageZone.appendChild(paintCanvas);
    imageZone.appendChild(msgStart);
    imageZone.appendChild(micBarWrap);
    imageZone.appendChild(progBarWrap);
    imageZone.appendChild(percentBadge);

    // ── Panneau contrôles (au-dessus de l'image) ──────────────────────────
    const controls = document.createElement('div');
    controls.className = 'dc-controls';

    // En-tête : titre + boutons réduire / plein écran / fermer
    const header = document.createElement('div');
    header.className = 'dc-header';
    header.innerHTML = `
        <span class="dc-title">🤫 Défi calme</span>
        <div class="wf-btns">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    controls.appendChild(header);

    // Ligne 1 : Mode + Durée
    const row1 = document.createElement('div');
    row1.className = 'dc-row';

    const modeLabel = document.createElement('span');
    modeLabel.className = 'dc-label';
    modeLabel.textContent = 'Mode';

    const modeWrap = document.createElement('div');
    modeWrap.className = 'dc-mode-wrap';
    const modes = [
        { key: 'pixels', label: 'Pixels' },
        { key: 'flou',   label: 'Flou'   },
        { key: 'zoom',   label: 'Zoom'   },
        { key: 'mosaique', label: 'Mosaïque' },
        { key: 'spirale', label: 'Spirale' },
        { key: 'pinceau', label: 'Pinceau' },
        { key: 'peinture', label: 'Peinture' }
    ];
    const modeBtns = {};
    modes.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'dc-mode-btn' + (m.key === 'pixels' ? ' active' : '');
        btn.textContent = m.label;
        btn.dataset.mode = m.key;
        modeWrap.appendChild(btn);
        modeBtns[m.key] = btn;
    });

    const durLabel = document.createElement('span');
    durLabel.className = 'dc-label';
    durLabel.textContent = 'Durée';

    const timePill = document.createElement('div');
    timePill.className = 'dc-time-pill';

    const timeMinus = document.createElement('button');
    timeMinus.className = 'dc-time-btn';
    timeMinus.textContent = '−';

    const timeVal = document.createElement('span');
    timeVal.className = 'dc-time-val';
    timeVal.textContent = '10:00';

    const timePlus = document.createElement('button');
    timePlus.className = 'dc-time-btn';
    timePlus.textContent = '+';

    timePill.appendChild(timeMinus);
    timePill.appendChild(timeVal);
    timePill.appendChild(timePlus);

    // Tolérance (placée entre le choix des modes et le choix de la durée)
    const sensLabel = document.createElement('span');
    sensLabel.className = 'dc-label';
    sensLabel.textContent = 'Tolérance';

    const sensPill = document.createElement('div');
    sensPill.className = 'dc-time-pill';

    const sensMinus = document.createElement('button');
    sensMinus.className = 'dc-time-btn';
    sensMinus.textContent = '−';

    const sensVal = document.createElement('span');
    sensVal.className = 'dc-time-val';
    sensVal.textContent = '40';

    const sensPlus = document.createElement('button');
    sensPlus.className = 'dc-time-btn';
    sensPlus.textContent = '+';

    sensPill.appendChild(sensMinus);
    sensPill.appendChild(sensVal);
    sensPill.appendChild(sensPlus);

    row1.style.justifyContent = 'space-between';

    const groupMode = document.createElement('div');
    groupMode.className = 'dc-group';
    groupMode.style.flex = '1';
    groupMode.style.justifyContent = 'flex-start';
    groupMode.appendChild(modeLabel);
    groupMode.appendChild(modeWrap);

    const groupSens = document.createElement('div');
    groupSens.className = 'dc-group';
    groupSens.style.justifyContent = 'flex-end';
    groupSens.appendChild(sensLabel);
    groupSens.appendChild(sensPill);

    const groupDur = document.createElement('div');
    groupDur.className = 'dc-group';
    groupDur.style.justifyContent = 'flex-end';
    groupDur.appendChild(durLabel);
    groupDur.appendChild(timePill);

    // Durée et tolérance empilées à droite
    const groupRight = document.createElement('div');
    groupRight.className = 'dc-settings-col';
    groupRight.appendChild(groupDur);
    groupRight.appendChild(groupSens);
    timePill.classList.add('dc-compact');
    sensPill.classList.add('dc-compact');

    row1.appendChild(groupMode);
    row1.appendChild(groupRight);

    // Ligne 3 : Image URL
    const row3 = document.createElement('div');
    row3.className = 'dc-row';

    const imgLabel = document.createElement('span');
    imgLabel.className = 'dc-label';
    imgLabel.textContent = 'Image';

    const urlInput = document.createElement('input');
    urlInput.className = 'dc-url-input';
    urlInput.type = 'text';
    urlInput.placeholder = 'URL de l\'image ou picsum.photos/…';

    // Bouton import image locale
    const importFileInput = document.createElement('input');
    importFileInput.type = 'file';
    importFileInput.accept = 'image/*';
    importFileInput.style.display = 'none';

    const btnImport = document.createElement('button');
    btnImport.className = 'dc-url-btn';
    btnImport.style.background = '#059669';
    btnImport.textContent = '📁';
    btnImport.title = 'Importer une image depuis votre appareil';

    const randBtn = document.createElement('button');
    randBtn.className = 'dc-url-btn';
    randBtn.style.background = '#6366f1';
    randBtn.textContent = '🎲';
    randBtn.title = 'Image aléatoire';

    const btnTransp = document.createElement('button');
    btnTransp.className = 'dc-url-btn';
    btnTransp.style.background = '#374151';
    btnTransp.title = 'Masquer/afficher le panneau de contrôle';
    btnTransp.textContent = '⬜';

    const btnApercu = document.createElement('button');
    btnApercu.className = 'dc-url-btn';
    btnApercu.style.background = '#6366f1';
    btnApercu.textContent = '👁';
    btnApercu.title = 'Aperçu';

    row3.appendChild(imgLabel);
    row3.appendChild(btnImport);
    row3.appendChild(importFileInput);
    row3.appendChild(urlInput);
    row3.appendChild(randBtn);
    row3.appendChild(btnApercu);
    row3.appendChild(btnTransp);

    // Boutons action (flottants, sur l'image en bas à gauche)
    const btnRow = document.createElement('div');
    btnRow.className = 'dc-action-row';

    const btnStart = document.createElement('button');
    btnStart.className = 'dc-float-action-btn dc-start';
    btnStart.textContent = '▶ Démarrer';

    const btnStop = document.createElement('button');
    btnStop.className = 'dc-float-action-btn dc-stop dc-hidden';
    btnStop.textContent = '■ Stop';

    const btnReset = document.createElement('button');
    btnReset.className = 'dc-float-action-btn dc-new dc-hidden';
    btnReset.textContent = '🔄 Nouveau défi';

    btnRow.appendChild(btnStart);
    btnRow.appendChild(btnStop);
    btnRow.appendChild(btnReset);
    imageZone.appendChild(btnRow);

    controls.appendChild(row1);
    controls.appendChild(row3);

    // Poignée resize
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'dc-resize-handle';

    container.appendChild(controls);
    container.appendChild(imageZone);
    container.appendChild(resizeHandle);
    widget.appendChild(container);

    // ═════════════════════════════════════════════════════════════════════
    // LOGIQUE INTERNE
    // ═════════════════════════════════════════════════════════════════════

    // ── État ─────────────────────────────────────────────────────────────
    let isPlaying = false;
    let progress = 0;
    let lastTime = 0;
    let currentMode = 'pixels';
    let totalSeconds = 600;
    let sensValue = 40;
    let pixelsOrder = [];

    // Audio
    let audioContext = null;
    let analyser = null;
    let scriptProcessor = null;
    let audioStream = null;

    // ── Temps ─────────────────────────────────────────────────────────────
    function formatTime(s) {
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function adjustTime(delta) {
        totalSeconds = Math.max(DC_CONFIG.minTimeSeconds, Math.min(DC_CONFIG.maxTimeSeconds, totalSeconds + delta * DC_CONFIG.timeAdjustUnit));
        timeVal.textContent = formatTime(totalSeconds);
        generateGrid();
    }

    // ── Tolérance ─────────────────────────────────────────────────────────
    function adjustSens(delta) {
        sensValue = Math.max(1, Math.min(100, sensValue + delta));
        sensVal.textContent = sensValue;
    }

    // ── Grille pixels ─────────────────────────────────────────────────────
    function usesGrid() {
        return currentMode === 'pixels';
    }
    function usesBrush() {
        return currentMode === 'pinceau' || currentMode === 'spirale';
    }

    function generateGrid() {
        if (usesBrush()) { generateBrushPath(); return; }
        const density = Math.max(4, Math.round(3 + (totalSeconds * DC_CONFIG.pixelDensityFactor)));
        const rows = Math.min(density, 40);
        const cols = Math.round(rows * (16 / 9));
        pixelGrid.innerHTML = '';
        pixelGrid.style.gap = '0'; // pas d'espace : l'image ne doit pas transparaître entre les pièces
        pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        pixelGrid.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;
        pixelsOrder = [];
        for (let i = 0; i < rows * cols; i++) {
            const p = document.createElement('div');
            p.className = 'dc-pixel-block';
            pixelGrid.appendChild(p);
            pixelsOrder.push(p);
        }
        // Fisher-Yates
        for (let i = pixelsOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pixelsOrder[i], pixelsOrder[j]] = [pixelsOrder[j], pixelsOrder[i]];
        }
    }

    function revealPixels(prog) {
        const n = Math.floor((prog / 100) * pixelsOrder.length);
        pixelsOrder.forEach((p, i) => { p.classList.toggle('dc-revealed', i < n); });
    }


    // ── Mosaïque (pixelisation) ───────────────────────────────────────────
    const mosaicSmall = document.createElement('canvas');
    let lastMosaicKey = '';
    function drawMosaic(prog) {
        const w = imageZone.clientWidth, h = imageZone.clientHeight;
        if (!w || !h || !imgEl.complete || !imgEl.naturalWidth) return;
        if (prog >= 100) { mosaicCanvas.style.display = 'none'; lastMosaicKey = ''; return; }
        mosaicCanvas.style.display = 'block';
        // Nombre de blocs en largeur : de 4 (très gros) jusqu'à la largeur réelle
        const minCols = 4, maxCols = w;
        const cols = Math.max(minCols, Math.round(minCols * Math.pow(maxCols / minCols, prog / 100)));
        const rows = Math.max(1, Math.round(cols * h / w));
        const key = cols + 'x' + rows + '@' + w + 'x' + h + '|' + imgEl.src;
        if (key === lastMosaicKey) return;
        lastMosaicKey = key;
        // Recadrage "cover" identique à l'image affichée
        const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
        const scale = Math.max(w / iw, h / ih);
        const sw = w / scale, sh = h / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        mosaicSmall.width = cols; mosaicSmall.height = rows;
        const sctx = mosaicSmall.getContext('2d');
        sctx.imageSmoothingEnabled = true;
        sctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, cols, rows);
        mosaicCanvas.width = w; mosaicCanvas.height = h;
        const ctx = mosaicCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(mosaicSmall, 0, 0, cols, rows, 0, 0, w, h);
    }
    imgEl.addEventListener('load', () => { lastMosaicKey = ''; if (currentMode === 'mosaique') updateUI(); });

    // ── Pinceau aléatoire ─────────────────────────────────────────────────
    // Un trajet aléatoire est pré-calculé ; on mémorise la surface révélée
    // à chaque pas, pour que la surface visible suive la courbe de révélation.
    const BRUSH_H = 9 / 16;           // hauteur en unités de largeur
    const BRUSH_GX = 128, BRUSH_GY = 72; // grille de suivi (fine pour les petits pinceaux)
    let brushPts = [];                // {x, y, r}
    let brushCov = [];                // surface révélée (0 → 1) après chaque pas
    let brushDrawnIdx = -1;           // dernier pas dessiné
    let brushSizeKey = '';

    function generateBrushPath() {
        const R = DC_CONFIG.brushSize;
        const step = R * 0.35;
        const covered = new Uint8Array(BRUSH_GX * BRUSH_GY);
        const total = covered.length;
        let count = 0;
        const cell = 1 / BRUSH_GX;
        function mark(x, y, r) {
            let added = 0;
            const c0 = Math.max(0, Math.floor((x - r) / cell)), c1 = Math.min(BRUSH_GX - 1, Math.floor((x + r) / cell));
            const r0 = Math.max(0, Math.floor((y - r) / cell)), r1 = Math.min(BRUSH_GY - 1, Math.floor((y + r) / cell));
            for (let gy = r0; gy <= r1; gy++) {
                for (let gx = c0; gx <= c1; gx++) {
                    const idx = gy * BRUSH_GX + gx;
                    if (covered[idx]) continue;
                    if (Math.hypot((gx + 0.5) * cell - x, (gy + 0.5) * cell - y) <= r) {
                        covered[idx] = 1; count++; added++;
                    }
                }
            }
            return added;
        }
        function randomUncovered() {
            for (let t = 0; t < 40; t++) {
                const i = Math.floor(Math.random() * total);
                if (!covered[i]) return i;
            }
            const free = [];
            for (let i = 0; i < total; i++) if (!covered[i]) free.push(i);
            return free.length ? free[Math.floor(Math.random() * free.length)] : -1;
        }

        if (currentMode === 'spirale') {
            // Spirale d'Archimède de l'extérieur vers le centre, tracée avec l'épaisseur du pinceau.
            // L'écart entre deux tours est un peu inférieur au diamètre du pinceau
            // pour que les tours se chevauchent sans laisser de trous.
            const cx = 0.5, cy = BRUSH_H / 2;
            const gap = 2 * R * 0.85;
            const b = gap / (2 * Math.PI);
            const rMax = Math.hypot(cx, cy) + R;
            const a0 = Math.random() * Math.PI * 2; // départ orienté au hasard
            let theta = 0;
            const pts = [];
            while (true) {
                const rad = b * theta;
                if (rad > rMax) break;
                pts.push({ x: cx + Math.cos(theta + a0) * rad, y: cy + Math.sin(theta + a0) * rad, r: R });
                theta += step / Math.max(rad, step);
            }
            pts.reverse(); // on parcourt la spirale depuis le bord jusqu'au centre
            brushPts = [];
            brushCov = [];
            pts.forEach(pt => {
                const added = mark(pt.x, pt.y, pt.r);
                // ignorer le début du tracé situé hors de l'image (coins)
                if (!brushPts.length && added === 0) return;
                brushPts.push(pt);
                brushCov.push(count / total);
            });
            brushCov[brushCov.length - 1] = 1;
            brushDrawnIdx = -1;
            return;
        }
        const minX = R * 0.5, maxX = 1 - R * 0.5, minY = R * 0.5, maxY = BRUSH_H - R * 0.5;
        let x = minX + Math.random() * (maxX - minX);
        let y = minY + Math.random() * (maxY - minY);
        let heading = Math.random() * Math.PI * 2;
        let r = R;
        let idle = 0, target = -1;
        mark(x, y, r);
        brushPts = [{ x, y, r }];
        brushCov = [count / total];
        let guard = 0;
        while (count < total && guard++ < 40000) {
            // Si le pinceau repasse trop longtemps sur du déjà révélé,
            // il se dirige vers une zone encore cachée
            if (target >= 0 && covered[target]) target = -1;
            if (idle > 12 && target < 0) target = randomUncovered();
            if (target >= 0) {
                const tx = (target % BRUSH_GX + 0.5) * cell, ty = (Math.floor(target / BRUSH_GX) + 0.5) * cell;
                let diff = Math.atan2(ty - y, tx - x) - heading;
                diff = Math.atan2(Math.sin(diff), Math.cos(diff));
                heading += Math.max(-0.3, Math.min(0.3, diff));
            } else {
                heading += (Math.random() - 0.5) * 0.7;
            }
            x += Math.cos(heading) * step;
            y += Math.sin(heading) * step;
            // Rebond sur les bords
            if (x < minX || x > maxX) { heading = Math.PI - heading; x = Math.max(minX, Math.min(maxX, x)); }
            if (y < minY || y > maxY) { heading = -heading; y = Math.max(minY, Math.min(maxY, y)); }
            // Épaisseur qui varie doucement, comme un vrai coup de pinceau
            r = Math.max(R * 0.75, Math.min(R * 1.25, r + (Math.random() - 0.5) * R * 0.12));
            if (mark(x, y, r) === 0) idle++; else idle = 0;
            brushPts.push({ x, y, r });
            brushCov.push(count / total);
        }
        brushDrawnIdx = -1;
    }

    function brushIndexFor(prog) {
        const target = prog / 100;
        let lo = 0, hi = brushCov.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (brushCov[mid] >= target) hi = mid; else lo = mid + 1;
        }
        return lo;
    }

    function drawBrush(prog) {
        const M = 8; // débordement du canvas (voir CSS)
        const w = imageZone.clientWidth, h = imageZone.clientHeight;
        if (!w || !h) return;
        if (!brushPts.length) generateBrushPath();
        if (prog >= 100) { brushCanvas.style.display = 'none'; brushDrawnIdx = -1; return; }
        brushCanvas.style.display = 'block';
        const idx = prog <= 0 ? 0 : brushIndexFor(prog);
        const ctx = brushCanvas.getContext('2d');
        const sizeKey = w + 'x' + h;
        // Redessin complet si taille changée, recul de la progression ou thème changé
        if (sizeKey !== brushSizeKey || idx < brushDrawnIdx || brushDrawnIdx < 0) {
            brushSizeKey = sizeKey;
            brushCanvas.width = w + 2 * M; brushCanvas.height = h + 2 * M;
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = document.body.classList.contains('menu-light') ? '#f0f2f5' : '#121212';
            ctx.fillRect(0, 0, w + 2 * M, h + 2 * M);
            brushDrawnIdx = 0;
        }
        if (idx <= brushDrawnIdx) return;
        const sx = w, sy = h / BRUSH_H;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000';
        for (let i = Math.max(1, brushDrawnIdx); i <= idx; i++) {
            const a = brushPts[i - 1], b = brushPts[i];
            ctx.lineWidth = b.r * 2 * w;
            ctx.beginPath();
            ctx.moveTo(M + a.x * sx, M + a.y * sy);
            ctx.lineTo(M + b.x * sx, M + b.y * sy);
            ctx.stroke();
        }
        brushDrawnIdx = idx;
    }

    // ── Peinture : esquisse au crayon, puis couleur ───────────────────────
    // 0 → 80 % du temps : un crayon dessine les traits de la photo un par un,
    //   comme un dessinateur : d'abord les grands contours (en passant d'un
    //   élément à son voisin), puis les traits plus fins (tracés plus vite),
    //   puis quelques hachures dans les ombres.
    // 80 → 100 % : la couleur est posée couleur par couleur (bleus, violets,
    //   rouges, orangés, jaunes, verts, puis les tons neutres). Chaque zone est
    //   remplie au pinceau à partir d'un point, jusqu'aux bords qui la limitent.
    const PAINT_SKETCH_END = 80;          // % du temps où finit l'esquisse
    const PAINT_PAPER = [244, 239, 228];  // couleur du papier
    const PAINT_GRAPHITE = [48, 48, 58];  // couleur du crayon
    const PAINT_COLOR_END = 0.94;         // part de la phase couleur pour tout peindre (le reste : les traits s'effacent)
    const PAINT_FILL_FADE = 0.012;        // adoucit le bord de la peinture qui avance
    let paint = null;                     // données précalculées pour l'image courante
    let paintKey = '';
    let paintLastStep = -1;
    let apercuActive = false;             // image affichée en clair (bouton « Cacher l'image »)

    function paintClamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function paintSmooth(a, b, v) { const t = paintClamp((v - a) / (b - a)); return t * t * (3 - 2 * t); }

    // Bruit doux (grille aléatoire interpolée)
    function paintLowNoise(W, H, gx, gy) {
        const grid = new Float32Array((gx + 1) * (gy + 1));
        for (let i = 0; i < grid.length; i++) grid[i] = Math.random();
        const out = new Float32Array(W * H);
        for (let y = 0; y < H; y++) {
            const fy = y / H * gy, iy = Math.floor(fy), ty = fy - iy;
            for (let x = 0; x < W; x++) {
                const fx = x / W * gx, ix = Math.floor(fx), tx = fx - ix;
                const a = grid[iy * (gx + 1) + ix], b = grid[iy * (gx + 1) + ix + 1];
                const c = grid[(iy + 1) * (gx + 1) + ix], d = grid[(iy + 1) * (gx + 1) + ix + 1];
                const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
                out[y * W + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
            }
        }
        return out;
    }

    // Flou boîte séparable (atténue le bruit avant l'analyse)
    function paintBlur(src, W, H, r) {
        const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
        const n = 2 * r + 1;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                let sum = 0;
                for (let k = -r; k <= r; k++) sum += src[y * W + Math.min(W - 1, Math.max(0, x + k))];
                tmp[y * W + x] = sum / n;
            }
        }
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                let sum = 0;
                for (let k = -r; k <= r; k++) sum += tmp[Math.min(H - 1, Math.max(0, y + k)) * W + x];
                out[y * W + x] = sum / n;
            }
        }
        return out;
    }

    function paintMix(a) {
        const c = PAINT_PAPER.map((p, k) => Math.round(p * (1 - a) + PAINT_GRAPHITE[k] * a));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
    }

    // Ordre de passage des couleurs : bleus, violets, rouges, orangés, jaunes,
    // verts, cyans, puis les tons neutres (des plus clairs aux plus foncés)
    function paintHueKey(r, g, b) {
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn;
        const sat = dl === 0 ? 0 : dl / (1 - Math.abs(2 * l - 1));
        if (sat < 0.2 || dl < 0.08 || l < 0.12 || l > 0.92) return 1000 + (1 - l);
        let hue;
        if (mx === r) hue = ((g - b) / dl) % 6; else if (mx === g) hue = (b - r) / dl + 2; else hue = (r - g) / dl + 4;
        hue *= 60; if (hue < 0) hue += 360;
        return (hue - 200 + 360) % 360;
    }

    function buildPaintData(w, h) {
        const W = Math.max(2, Math.min(800, Math.round(w)));
        const H = Math.max(2, Math.round(W * h / w));
        // Recadrage "cover" identique à l'image affichée
        const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
        const scale = Math.max(W / iw, H / ih);
        const sw = W / scale, sh = H / scale;
        const sx = (iw - sw) / 2, sy = (ih - sh) / 2;
        const color = document.createElement('canvas');
        color.width = W; color.height = H;
        const cctx = color.getContext('2d', { willReadFrequently: true });
        cctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, W, H);
        let px;
        try { px = cctx.getImageData(0, 0, W, H).data; }
        catch (e) { return { W, H, tainted: true }; } // image protégée (CORS) : rendu de secours

        const N = W * H;
        const br = Math.max(1, Math.round(W / 400));
        const ch = [0, 1, 2].map(c => {
            const a = new Float32Array(N);
            for (let i = 0; i < N; i++) a[i] = px[i * 4 + c] / 255;
            return paintBlur(a, W, H, br);
        });
        const lum = new Float32Array(N);
        for (let i = 0; i < N; i++) lum[i] = 0.299 * ch[0][i] + 0.587 * ch[1][i] + 0.114 * ch[2][i];

        // ── 1. Contours fins : gradient de couleur + amincissement ─────────
        const mag = new Float32Array(N), dirA = new Uint8Array(N);
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const i = y * W + x;
                let best = 0, bgx = 0, bgy = 0;
                for (let c = 0; c < 3; c++) {
                    const a = ch[c];
                    const gx = -a[i - W - 1] - 2 * a[i - 1] - a[i + W - 1] + a[i - W + 1] + 2 * a[i + 1] + a[i + W + 1];
                    const gy = -a[i - W - 1] - 2 * a[i - W] - a[i - W + 1] + a[i + W - 1] + 2 * a[i + W] + a[i + W + 1];
                    const m = gx * gx + gy * gy;
                    if (m > best) { best = m; bgx = gx; bgy = gy; }
                }
                mag[i] = Math.sqrt(best);
                let ang = Math.atan2(bgy, bgx) * 180 / Math.PI; if (ang < 0) ang += 180;
                dirA[i] = ang < 22.5 || ang >= 157.5 ? 0 : ang < 67.5 ? 1 : ang < 112.5 ? 2 : 3;
            }
        }
        const DOFF = [1, W + 1, W, W - 1];
        const nms = new Float32Array(N);
        let maxN = 0, cntN = 0;
        for (let y = 1; y < H - 1; y++) {
            for (let x = 1; x < W - 1; x++) {
                const i = y * W + x, m = mag[i];
                if (m < 0.05) continue;
                const o = DOFF[dirA[i]];
                if (m >= mag[i + o] && m > mag[i - o]) { nms[i] = m; if (m > maxN) maxN = m; cntN++; }
            }
        }
        const HB = 512, hist = new Uint32Array(HB);
        for (let i = 0; i < N; i++) if (nms[i] > 0) hist[Math.min(HB - 1, Math.floor(nms[i] / maxN * HB))]++;
        let acc = 0, hiBin = HB - 1;
        for (let b = 0; b < HB; b++) { acc += hist[b]; if (acc >= cntN * 0.7) { hiBin = b; break; } }
        const hiT = Math.max(0.15, (hiBin + 1) / HB * maxN);
        const loT = Math.max(0.07, hiT * 0.4);
        // Hystérésis : on garde les contours forts et les faibles qui les prolongent
        const edge = new Uint8Array(N);
        const NB8 = [1, -1, W, -W, W + 1, W - 1, -W + 1, -W - 1];
        const stack = [];
        for (let i = 0; i < N; i++) if (nms[i] >= hiT) { edge[i] = 1; stack.push(i); }
        while (stack.length) {
            const i = stack.pop();
            for (let k = 0; k < 8; k++) { const j = i + NB8[k]; if (!edge[j] && nms[j] >= loT) { edge[j] = 1; stack.push(j); } }
        }

        // ── 2. Contours → traits (suivre chaque ligne pixel par pixel) ─────
        const NBX = [1, 1, 0, -1, -1, -1, 0, 1], NBY = [0, 1, 1, 1, 0, -1, -1, -1];
        const used = new Uint8Array(N);
        function follow(i0) {
            const path = [];
            let i = i0, pdx = 0, pdy = 0;
            for (;;) {
                const x = i % W, y = (i / W) | 0;
                let bj = -1, bs = -9, bdx = 0, bdy = 0;
                for (let k = 0; k < 8; k++) {
                    const nx = x + NBX[k], ny = y + NBY[k];
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    const j = ny * W + nx;
                    if (!edge[j] || used[j]) continue;
                    const len = Math.hypot(NBX[k], NBY[k]);
                    const sc = (pdx || pdy) ? (NBX[k] * pdx + NBY[k] * pdy) / len : 1 / len;
                    if (sc > bs) { bs = sc; bj = j; bdx = NBX[k] / len; bdy = NBY[k] / len; }
                }
                if (bj < 0) break;
                used[bj] = 1; path.push(bj);
                pdx = pdx * 0.5 + bdx; pdy = pdy * 0.5 + bdy;
                const n = Math.hypot(pdx, pdy) || 1; pdx /= n; pdy /= n;
                i = bj;
            }
            return path;
        }
        function toPts(path) {
            const n = path.length, xs = new Float32Array(n), ys = new Float32Array(n);
            for (let k = 0; k < n; k++) {
                let ax = 0, ay = 0, c = 0;
                for (let q = -2; q <= 2; q++) {
                    const m = k + q; if (m < 0 || m >= n) continue;
                    ax += path[m] % W + 0.5; ay += ((path[m] / W) | 0) + 0.5; c++;
                }
                xs[k] = ax / c; ys[k] = ay / c;
            }
            return { xs, ys };
        }
        const lines = [];
        for (let i = 0; i < N; i++) {
            if (!edge[i] || used[i]) continue;
            used[i] = 1;
            const a = follow(i), b = follow(i);
            const path = b.reverse(); path.push(i); for (const j of a) path.push(j);
            if (path.length < 6) continue;
            let sum = 0; for (const j of path) sum += nms[j];
            const s = paintClamp(sum / path.length / (hiT * 2.2));
            const pts = toPts(path);
            lines.push({ xs: pts.xs, ys: pts.ys, s, imp: s * Math.sqrt(path.length) });
        }
        // Trois niveaux : grands contours, contours moyens, traits fins
        lines.sort((a, b) => b.imp - a.imp);
        const TIERS = [
            { from: 0,    to: 0.25, perPt: 1,    lift: 6 },
            { from: 0.25, to: 0.6,  perPt: 0.55, lift: 3 },
            { from: 0.6,  to: 1,    perPt: 0.25, lift: 1 }
        ];
        const ordered = [];
        let penX = Math.random() * W, penY = Math.random() * H * 0.5;
        TIERS.forEach(t => {
            const rem = lines.slice(Math.floor(t.from * lines.length), Math.floor(t.to * lines.length));
            // Le crayon va toujours vers l'élément le plus proche : élément après élément
            while (rem.length) {
                let bi = 0, bd = Infinity, brev = false;
                for (let k = 0; k < rem.length; k++) {
                    const L = rem[k], n = L.xs.length - 1;
                    const d0 = (L.xs[0] - penX) ** 2 + (L.ys[0] - penY) ** 2;
                    const d1 = (L.xs[n] - penX) ** 2 + (L.ys[n] - penY) ** 2;
                    if (d0 < bd) { bd = d0; bi = k; brev = false; }
                    if (d1 < bd) { bd = d1; bi = k; brev = true; }
                }
                const L = rem[bi]; rem[bi] = rem[rem.length - 1]; rem.pop();
                if (brev) { L.xs.reverse(); L.ys.reverse(); }
                L.perPt = t.perPt; L.lift = t.lift;
                L.width = 0.9 + 1.3 * L.s;
                L.col = paintMix(0.55 + 0.45 * L.s);
                ordered.push(L);
                penX = L.xs[L.xs.length - 1]; penY = L.ys[L.ys.length - 1];
            }
        });

        // ── 3. Hachures dans les ombres (à la fin, zone par zone) ──────────
        const hatches = [];
        const SP = Math.max(4, Math.round(W / 150));
        const CELL = Math.max(40, Math.round(W / 10));
        function hatchFamily(sign, thr) {
            // sign = 1 : lignes « / » ; sign = -1 : lignes « \ »
            const cMin = sign > 0 ? 0 : -(H - 1), cMax = sign > 0 ? W + H - 2 : W - 1;
            for (let c = cMin; c <= cMax; c += SP) {
                let run = [];
                const flush = () => {
                    if (run.length >= 8) {
                        for (let st = 0; st < run.length; st += 40) {
                            const part = run.slice(st, st + 40);
                            if (part.length < 6) continue;
                            let sl = 0; for (const q of part) sl += lum[q];
                            const dark = paintClamp((thr - sl / part.length) / thr);
                            const xs = new Float32Array(part.length), ys = new Float32Array(part.length);
                            part.forEach((q, k) => { xs[k] = q % W + 0.5; ys[k] = ((q / W) | 0) + 0.5; });
                            const cx = xs[0], cy = ys[0];
                            const row = Math.floor(cy / CELL), col = Math.floor(cx / CELL);
                            hatches.push({ xs, ys, s: 0, perPt: 0.1, lift: 0.3, width: 0.8,
                                col: paintMix(0.25 + 0.4 * dark),
                                key: row * 10000 + (row % 2 ? (999 - col) : col) * 10 + Math.random() });
                        }
                    }
                    run = [];
                };
                for (let x = 0; x < W; x++) {
                    const y = sign > 0 ? c - x : x - c;
                    if (y < 0 || y >= H) { flush(); continue; }
                    const q = y * W + x;
                    if (lum[q] < thr && !edge[q]) run.push(q); else flush();
                }
                flush();
            }
        }
        hatchFamily(1, 0.38);
        hatchFamily(-1, 0.2);
        hatches.sort((a, b) => a.key - b.key);

        // ── 4. Calendrier du crayon ────────────────────────────────────────
        // Les hachures ne prennent que la fin de l'esquisse (~15 % du temps)
        let tLines = 0, hatchPts = 0;
        ordered.forEach(L => { tLines += L.lift + L.xs.length * L.perPt; });
        hatches.forEach(L => { hatchPts += L.xs.length; });
        if (hatchPts) {
            const hp = tLines * 0.18 / hatchPts;
            hatches.forEach(L => { L.perPt = hp; L.lift = 0; });
        }
        const strokes = ordered.concat(hatches);
        const S = strokes.length;
        let P = 0; strokes.forEach(L => { P += L.xs.length; });
        const ptX = new Float32Array(P), ptY = new Float32Array(P), ptTime = new Float32Array(P);
        const strokeStart = new Int32Array(S + 1), strokeW = new Float32Array(S), strokeCol = [];
        let t = 0, idx = 0;
        strokes.forEach((L, k) => {
            strokeStart[k] = idx; strokeW[k] = L.width; strokeCol.push(L.col);
            t += L.lift;
            for (let q = 0; q < L.xs.length; q++) { t += L.perPt; ptX[idx] = L.xs[q]; ptY[idx] = L.ys[q]; ptTime[idx] = t; idx++; }
        });
        strokeStart[S] = P;
        const tTot = t || 1;
        for (let k = 0; k < P; k++) ptTime[k] /= tTot;

        // Papier (avec grain)
        const paper = document.createElement('canvas');
        paper.width = W; paper.height = H;
        const pimg = new ImageData(W, H);
        for (let i = 0; i < N; i++) {
            const g = (Math.random() - 0.5) * 10;
            pimg.data[i * 4] = PAINT_PAPER[0] + g; pimg.data[i * 4 + 1] = PAINT_PAPER[1] + g;
            pimg.data[i * 4 + 2] = PAINT_PAPER[2] + g; pimg.data[i * 4 + 3] = 255;
        }
        paper.getContext('2d').putImageData(pimg, 0, 0);
        const sketch = document.createElement('canvas');
        sketch.width = W; sketch.height = H;
        sketch.getContext('2d').drawImage(paper, 0, 0);

        const data = { W, H, N, px, P, S, ptX, ptY, ptTime, strokeStart, strokeW, strokeCol, paper, sketch, drawnPt: 0 };
        // Esquisse complète (sert de fond à la phase couleur)
        const full = document.createElement('canvas');
        full.width = W; full.height = H;
        const fctx = full.getContext('2d');
        fctx.drawImage(paper, 0, 0);
        paintDrawPts(fctx, data, 0, P);
        data.sketchData = fctx.getImageData(0, 0, W, H).data;

        // ── 5. Couleurs : regrouper l'image en grandes zones de couleur ────
        const K = 8;
        const stride = Math.max(1, Math.floor(Math.sqrt(N / 6000)));
        const samples = [];
        for (let y = 0; y < H; y += stride) for (let x = 0; x < W; x += stride) samples.push(y * W + x);
        const cen = new Float32Array(K * 3);
        const dist2 = (i, k) => {
            const dr = ch[0][i] - cen[k * 3], dg = ch[1][i] - cen[k * 3 + 1], db = ch[2][i] - cen[k * 3 + 2];
            return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        };
        { // initialisation k-means++
            const f = samples[Math.floor(Math.random() * samples.length)];
            for (let c = 0; c < 3; c++) cen[c] = ch[c][f];
            const dmin = new Float32Array(samples.length).fill(Infinity);
            for (let k = 1; k < K; k++) {
                let tot = 0;
                for (let s = 0; s < samples.length; s++) { const dd = dist2(samples[s], k - 1); if (dd < dmin[s]) dmin[s] = dd; tot += dmin[s]; }
                let r = Math.random() * tot, pick = samples[samples.length - 1];
                for (let s = 0; s < samples.length; s++) { r -= dmin[s]; if (r <= 0) { pick = samples[s]; break; } }
                for (let c = 0; c < 3; c++) cen[k * 3 + c] = ch[c][pick];
            }
        }
        const nearest = i => { let bk = 0, bd = Infinity; for (let k = 0; k < K; k++) { const dd = dist2(i, k); if (dd < bd) { bd = dd; bk = k; } } return bk; };
        for (let it = 0; it < 10; it++) {
            const sum = new Float64Array(K * 4);
            for (const i of samples) { const k = nearest(i); sum[k * 4] += ch[0][i]; sum[k * 4 + 1] += ch[1][i]; sum[k * 4 + 2] += ch[2][i]; sum[k * 4 + 3]++; }
            for (let k = 0; k < K; k++) if (sum[k * 4 + 3]) for (let c = 0; c < 3; c++) cen[k * 3 + c] = sum[k * 4 + c] / sum[k * 4 + 3];
        }
        let lab = new Uint8Array(N);
        for (let i = 0; i < N; i++) lab[i] = nearest(i);
        // Filtre majoritaire : évite les mouchetures
        for (let pass = 0; pass < 2; pass++) {
            const out = new Uint8Array(lab), cnt = new Uint8Array(K);
            for (let y = 1; y < H - 1; y++) {
                for (let x = 1; x < W - 1; x++) {
                    cnt.fill(0);
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cnt[lab[(y + dy) * W + x + dx]]++;
                    let bk = lab[y * W + x], bc = 0;
                    for (let k = 0; k < K; k++) if (cnt[k] > bc) { bc = cnt[k]; bk = k; }
                    out[y * W + x] = bk;
                }
            }
            lab = out;
        }
        // Zones connexes de même couleur
        const reg = new Int32Array(N).fill(-1);
        const queue = new Int32Array(N);
        const regions = [];
        for (let i = 0; i < N; i++) {
            if (reg[i] >= 0) continue;
            const id = regions.length, L = lab[i];
            let qh = 0, qt = 0; queue[qt++] = i; reg[i] = id;
            let cx = 0, cy = 0;
            while (qh < qt) {
                const q = queue[qh++], x = q % W, y = (q / W) | 0;
                cx += x; cy += y;
                if (x > 0 && reg[q - 1] < 0 && lab[q - 1] === L) { reg[q - 1] = id; queue[qt++] = q - 1; }
                if (x < W - 1 && reg[q + 1] < 0 && lab[q + 1] === L) { reg[q + 1] = id; queue[qt++] = q + 1; }
                if (y > 0 && reg[q - W] < 0 && lab[q - W] === L) { reg[q - W] = id; queue[qt++] = q - W; }
                if (y < H - 1 && reg[q + W] < 0 && lab[q + W] === L) { reg[q + W] = id; queue[qt++] = q + W; }
            }
            regions.push({ id, label: L, pix: queue.slice(0, qt), cx: cx / qt, cy: cy / qt });
        }
        // Ordre des couleurs et temps accordé à chacune (selon sa surface)
        const area = new Float64Array(K);
        for (let i = 0; i < N; i++) area[lab[i]]++;
        const colOrder = [];
        for (let k = 0; k < K; k++) if (area[k] > 0) colOrder.push(k);
        colOrder.sort((a, b) => paintHueKey(cen[a * 3], cen[a * 3 + 1], cen[a * 3 + 2]) - paintHueKey(cen[b * 3], cen[b * 3 + 1], cen[b * 3 + 2]));
        let wTot = 0; colOrder.forEach(k => { wTot += Math.pow(area[k], 0.8); });
        const span = PAINT_COLOR_END - PAINT_FILL_FADE;
        const tC = new Float32Array(N);
        const brushN = paintLowNoise(W, H, Math.max(2, Math.round(W / 30)), Math.max(2, Math.round(H / 30)));
        const dist = new Float32Array(N);
        let tc = 0;
        let penRX = W / 2, penRY = H / 2;
        colOrder.forEach(k => {
            const cSpan = Math.pow(area[k], 0.8) / wTot * span;
            const regs = regions.filter(r => r.label === k);
            const bigMin = N * 0.001;
            // Grandes zones d'abord (en passant à la plus proche), puis les petites
            const big = regs.filter(r => r.pix.length >= bigMin), small = regs.filter(r => r.pix.length < bigMin);
            const seq = [];
            while (big.length) {
                let bi = 0, bd = Infinity;
                big.forEach((r, j) => { const dd = (r.cx - penRX) ** 2 + (r.cy - penRY) ** 2; if (dd < bd) { bd = dd; bi = j; } });
                const r = big[bi]; big[bi] = big[big.length - 1]; big.pop();
                seq.push(r); penRX = r.cx; penRY = r.cy;
            }
            const band = Math.max(20, H / 12);
            small.sort((a, b) => {
                const ra = Math.floor(a.cy / band), rb = Math.floor(b.cy / band);
                return ra !== rb ? ra - rb : (ra % 2 ? b.cx - a.cx : a.cx - b.cx);
            });
            seq.push(...small);
            const cArea = area[k];
            seq.forEach(r => {
                const n = r.pix.length, rSpan = cSpan * n / cArea;
                if (n < 3) { for (const q of r.pix) tC[q] = tc + rSpan; tc += rSpan; return; }
                // Le pinceau part d'un point de la zone et s'étale jusqu'à ses bords
                const seed = r.pix[Math.floor(Math.random() * n)];
                for (const q of r.pix) dist[q] = -1;
                let qh = 0, qt = 0; queue[qt++] = seed; dist[seed] = 0;
                while (qh < qt) {
                    const q = queue[qh++], x = q % W, y = (q / W) | 0, dq = dist[q] + 1;
                    if (x > 0 && reg[q - 1] === r.id && dist[q - 1] < 0) { dist[q - 1] = dq; queue[qt++] = q - 1; }
                    if (x < W - 1 && reg[q + 1] === r.id && dist[q + 1] < 0) { dist[q + 1] = dq; queue[qt++] = q + 1; }
                    if (y > 0 && reg[q - W] === r.id && dist[q - W] < 0) { dist[q - W] = dq; queue[qt++] = q - W; }
                    if (y < H - 1 && reg[q + W] === r.id && dist[q + W] < 0) { dist[q + W] = dq; queue[qt++] = q + W; }
                }
                // Coups de pinceau : bord irrégulier et traces allongées
                // (distance à vol d'oiseau, plus le détour imposé par la forme de la zone :
                //  la peinture s'étale en rond et contourne les obstacles)
                const ang = Math.random() * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang);
                const sxs = seed % W, sys = (seed / W) | 0;
                const keys = new Float32Array(n), order = new Uint32Array(n);
                for (let j = 0; j < n; j++) {
                    const q = r.pix[j], x = q % W, y = (q / W) | 0;
                    const dx = Math.abs(x - sxs), dy = Math.abs(y - sys);
                    const geo = Math.hypot(dx, dy) + Math.max(0, dist[q] - dx - dy);
                    keys[j] = geo + 18 * brushN[q] + 4 * Math.sin((x * ca + y * sa) / 2.2) + 3 * Math.random();
                    order[j] = j;
                }
                order.sort((a, b) => keys[a] - keys[b]);
                for (let j = 0; j < n; j++) tC[r.pix[order[j]]] = tc + (j + 1) / n * rSpan;
                tc += rSpan;
            });
        });
        data.tC = tC;
        data.outImg = new ImageData(W, H);
        return data;
    }

    // Dessine les points de crayon [from, to) sur ctx, trait par trait
    function paintDrawPts(ctx, d, from, to) {
        if (to <= from) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let lo = 0, hi = d.S - 1; // trait contenant le point « from »
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (d.strokeStart[mid] <= from) lo = mid; else hi = mid - 1; }
        for (let k = lo; k < d.S && d.strokeStart[k] < to; k++) {
            const a = d.strokeStart[k], b = d.strokeStart[k + 1];
            const st = Math.max(a, from - 1), en = Math.min(b, to);
            if (en - st < 2) continue;
            ctx.strokeStyle = d.strokeCol[k];
            ctx.lineWidth = d.strokeW[k];
            ctx.beginPath();
            ctx.moveTo(d.ptX[st], d.ptY[st]);
            for (let q = st + 1; q < en; q++) ctx.lineTo(d.ptX[q], d.ptY[q]);
            ctx.stroke();
        }
    }

    // Esquisse à l'avancement s (0 → 1) : le crayon reprend là où il s'était arrêté
    function paintSketchTo(d, s) {
        let lo = 0, hi = d.P;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (d.ptTime[mid] <= s) lo = mid + 1; else hi = mid; }
        const target = lo;
        const ctx = d.sketch.getContext('2d');
        if (target < d.drawnPt) { ctx.drawImage(d.paper, 0, 0); d.drawnPt = 0; } // retour en arrière : on redessine
        paintDrawPts(ctx, d, d.drawnPt, target);
        d.drawnPt = target;
    }

    // Couleur à l'avancement p (0 → 1) de la phase couleur
    function paintColorTo(d, p) {
        const out = d.outImg.data, sk = d.sketchData, col = d.px, tC = d.tC;
        const lf = paintSmooth(PAINT_COLOR_END, 1, p); // effacement final des traits
        for (let i = 0, o = 0; i < d.N; i++, o += 4) {
            let a = (p - tC[i]) / PAINT_FILL_FADE;
            if (a <= 0) { out[o] = sk[o]; out[o + 1] = sk[o + 1]; out[o + 2] = sk[o + 2]; out[o + 3] = 255; continue; }
            if (a > 1) a = 1;
            for (let c = 0; c < 3; c++) {
                const s = sk[o + c], m = s * col[o + c] / 255;   // la peinture se mêle au crayon
                const f = m + (col[o + c] - m) * lf;
                out[o + c] = s + (f - s) * a;
            }
            out[o + 3] = 255;
        }
    }

    function drawPaint(rawProg) {
        const w = imageZone.clientWidth, h = imageZone.clientHeight;
        if (!w || !h || !imgEl.complete || !imgEl.naturalWidth) return;
        if (rawProg >= 100) { paintCanvas.style.display = 'none'; paintLastStep = -1; return; }
        const key = imgEl.src + '|' + w + 'x' + h;
        if (key !== paintKey) {
            paintKey = key;
            paint = buildPaintData(w, h);
            paintLastStep = -1;
            if (!paint.tainted) { paintCanvas.width = paint.W; paintCanvas.height = paint.H; }
        }
        const t = Math.max(0, rawProg);
        if (paint.tainted) {
            // Image non lisible (CORS) : esquisse simulée en noir et blanc
            paintCanvas.style.display = 'none';
            if (t < PAINT_SKETCH_END) {
                const s = t / PAINT_SKETCH_END;
                imgEl.style.filter = `grayscale(1) contrast(${3 - s * 1.5}) brightness(${2.2 - s * 1.1}) blur(${(1 - s) * 6}px)`;
            } else {
                imgEl.style.filter = `grayscale(${1 - (t - PAINT_SKETCH_END) / (100 - PAINT_SKETCH_END)})`;
            }
            return;
        }
        paintCanvas.style.display = 'block';
        const step = Math.round(t * 5); // un nouveau rendu tous les 0,2 %
        if (step === paintLastStep) return;
        paintLastStep = step;
        const tq = step / 5;
        const ctx = paintCanvas.getContext('2d');
        const d = paint;
        if (tq < PAINT_SKETCH_END) {
            paintSketchTo(d, tq / PAINT_SKETCH_END);
            ctx.drawImage(d.sketch, 0, 0);
            return;
        }
        paintColorTo(d, (tq - PAINT_SKETCH_END) / (100 - PAINT_SKETCH_END));
        ctx.putImageData(d.outImg, 0, 0);
    }
    imgEl.addEventListener('load', () => { paintKey = ''; if (currentMode === 'peinture') updateUI(); });

    // ── Visualisation ─────────────────────────────────────────────────────
    function updateMicBar(vol) {
        micBarFill.style.width = Math.min(vol * DC_CONFIG.volumeMultiplier, 100) + '%';
        // Couleur : vert si calme, rouge si trop fort
        const threshold = DC_CONFIG.baseThreshold - (sensValue * DC_CONFIG.sensitivityFactor);
        micBarFill.style.background = vol < threshold ? '#22c55e' : '#ef4444';
    }

    function updateProgress(prog) {
        const pStr = Math.floor(prog) + '%';
        percentBadge.textContent = pStr;
        progBarFill.style.height = pStr;
    }

    // Convertit la progression linéaire (temps) en progression visuelle exponentielle
    function easeReveal(prog) {
        const pts = DC_CONFIG.revealCurve;
        const t = Math.min(100, Math.max(0, prog));
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            if (t <= x1) return y0 + (y1 - y0) * (t - x0) / (x1 - x0);
        }
        return 100;
    }

    function updateImage(rawProg) {
        const prog = easeReveal(rawProg);
        imgEl.style.filter = 'none';
        imgEl.style.transform = 'scale(1)';
        if (currentMode !== 'mosaique') mosaicCanvas.style.display = 'none';
        if (!usesBrush()) brushCanvas.style.display = 'none';
        if (currentMode !== 'peinture') paintCanvas.style.display = 'none';
        if (currentMode === 'peinture') {
            // La peinture suit le temps réel : esquisse sur 80 %, couleur sur les 20 % restants
            drawPaint(rawProg);
        } else if (usesGrid()) {
            revealPixels(prog);
        } else if (currentMode === 'mosaique') {
            drawMosaic(prog);
        } else if (usesBrush()) {
            drawBrush(prog);
        } else if (currentMode === 'flou') {
            imgEl.style.filter = `blur(${40 - prog * 0.4}px)`;
        } else if (currentMode === 'zoom') {
            imgEl.style.transform = `scale(${10 - prog * 0.09})`;
            imgEl.style.filter = `blur(${Math.max(0, 5 - prog * 0.05)}px)`;
        }
        if (apercuActive) { imgEl.style.filter = 'none'; imgEl.style.transform = 'scale(1)'; }
    }

    function updateUI() {
        updateProgress(progress);
        updateImage(progress);
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    async function initAudio() {
        if (audioContext) return true;
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 1024;
            const source = audioContext.createMediaStreamSource(audioStream);
            source.connect(analyser);
            // Pas de scriptProcessor : la lecture du volume se fait dans gameLoop via RAF
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
        if (scriptProcessor) {
            try { scriptProcessor.disconnect(); } catch(e) {}
            scriptProcessor = null;
        }
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

        const threshold = DC_CONFIG.baseThreshold - (sensValue * DC_CONFIG.sensitivityFactor);
        const speed = 100 / totalSeconds;

        if (vol < threshold) {
            progress = Math.min(100, progress + speed * delta);
        } else {
            progress = Math.max(0, progress - speed * delta * 2);
        }
        updateUI();

        if (progress >= 100) {
            isPlaying = false;
            rafId = null;
            btnStart.classList.add('dc-hidden');
            btnStop.classList.add('dc-hidden');
            btnReset.classList.remove('dc-hidden');
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
            btnStart.classList.remove('dc-start');
            btnStop.classList.remove('dc-hidden');
        } else {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            btnStart.textContent = '▶ Reprendre';
            btnStart.classList.add('dc-start');
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
        btnStart.classList.add('dc-hidden');
        btnStart.classList.add('dc-start');
        btnStop.classList.add('dc-hidden');
        btnReset.classList.remove('dc-hidden');
        msgStart.style.display = 'flex';
    }

    function resetDefi() {
        isPlaying = false;
        progress = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopAudio();
        micBarFill.style.width = '0%';
        // Réinitialiser l'aperçu si actif
        if (apercuActive) {
            apercuActive = false;
            pixelGrid.style.opacity = '1';
            mosaicCanvas.style.opacity = '1';
            brushCanvas.style.opacity = '1';
            paintCanvas.style.opacity = '1';
            setApercuButton();
        }
        btnStart.disabled = false;
        updateUI();
        generateGrid();
        btnStart.textContent = '▶ Démarrer';
        btnStart.classList.add('dc-start');
        btnStart.classList.remove('dc-hidden');
        btnStop.classList.add('dc-hidden');
        btnReset.classList.add('dc-hidden');
        msgStart.style.display = 'flex';
    }

    // ── Mode ──────────────────────────────────────────────────────────────
    function setMode(mode) {
        currentMode = mode;
        Object.values(modeBtns).forEach(b => b.classList.remove('active'));
        modeBtns[mode].classList.add('active');
        pixelGrid.style.display = usesGrid() ? 'grid' : 'none';
        lastMosaicKey = '';
        paintLastStep = -1;
        if (usesGrid() || usesBrush()) generateGrid();
        else { imgEl.style.filter = 'none'; imgEl.style.transform = 'scale(1)'; }
        updateUI();
    }

    // ── Image ─────────────────────────────────────────────────────────────
    function applyImage(url) {
        if (!url.trim()) return;
        imgEl.src = url.trim();
        if (usesGrid() || usesBrush()) generateGrid();
    }

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
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Event listeners ───────────────────────────────────────────────────
    // ── Aperçu ────────────────────────────────────────────────────────────
    // Bouton : « 👁 » (aperçu) quand l'image est cachée,
    // « 🙈 » (Cacher l'image) quand elle est visible
    function setApercuButton() {
        if (apercuActive) {
            btnApercu.textContent = '🙈';
            btnApercu.title = 'Cacher l\'image';
            btnApercu.style.background = '#ef4444';
        } else {
            btnApercu.textContent = '👁';
            btnApercu.title = 'Aperçu';
            btnApercu.style.background = '#6366f1';
        }
    }
    // Toute nouvelle image (🎲, 📁 ou URL) reste visible jusqu'au clic
    // sur « Cacher l'image » (ou sur Démarrer)
    function showNewImage() {
        if (!apercuActive) toggleApercu();
    }
    function toggleApercu() {
        apercuActive = !apercuActive;
        if (apercuActive) {
            // Montrer l'image nette par dessus tout
            imgEl.style.filter = 'none';
            imgEl.style.transform = 'scale(1)';
            pixelGrid.style.opacity = '0';
            mosaicCanvas.style.opacity = '0';
            brushCanvas.style.opacity = '0';
            paintCanvas.style.opacity = '0';
            setApercuButton();
        } else {
            pixelGrid.style.opacity = '1';
            mosaicCanvas.style.opacity = '1';
            brushCanvas.style.opacity = '1';
            paintCanvas.style.opacity = '1';
            setApercuButton();
            updateUI(); // remet le bon état visuel
        }
    }

    btnApercu.addEventListener('click', toggleApercu);

    // Fond transparent : cache le panneau de contrôle et rend le widget transparent
    let isTransparent = false;
    btnTransp.addEventListener('click', () => {
        isTransparent = !isTransparent;
        controls.style.display  = isTransparent ? 'none' : 'flex';
        container.style.borderColor = isTransparent ? 'transparent' : '';
        container.style.background  = isTransparent ? 'transparent' : '';
        container.style.boxShadow   = isTransparent ? 'none' : '';
        widget.dataset.transparent  = isTransparent ? 'true' : 'false';
        // En mode transparent, un petit bouton flottant sur l'image permet de revenir
        floatBtn.style.display = isTransparent ? 'flex' : 'none';
        btnTransp.textContent  = isTransparent ? '🔲' : '⬜';
        btnTransp.title        = isTransparent ? 'Afficher les contrôles' : 'Fond transparent';
        btnTransp.style.background = isTransparent ? '#ef4444' : '#374151';
        saveBoard();
    });

    // Bouton flottant pour sortir du mode transparent (visible sur l'image en bas à gauche)
    const floatBtn = document.createElement('button');
    // État normal (au départ ou quand la souris sort)
	const styleNormal = `
		display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
		background: rgba(0,0,0,0.0); border: 1px solid rgba(255,255,255,0.1);
		color: rgba(255, 255, 255, 0.5); font-size: 8px; font-weight: 800; padding: 4px 8px;
		border-radius: 6px; cursor: pointer; 
		text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
	`;

	// État au survol (moins opaque / plus visible)
	const styleHover = `
		display: block; position: absolute; bottom: 8px; right: 15px; z-index: 15;
		background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.8);
		color: rgba(255, 255, 255, 0.8); font-size: 8px; font-weight: 800; padding: 4px 8px;
		border-radius: 6px; cursor: pointer; 
		text-transform: uppercase; letter-spacing: 0.05em; transition: all 0.2s;
	`;

	floatBtn.style.cssText = styleNormal;

	// Gestion du survol
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

    // En plein écran, l'image garde son format 16/9 et occupe la place restante
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
        window._wfMiniBarCollapse(widget, '🤫 Défi calme', { onExpand: updateUI });
    });
    wfMax.addEventListener('click', (e) => {
        e.stopPropagation();
        _isMax = !_isMax;
        container.classList.toggle('wf-fullboard', _isMax);
        widget.classList.toggle('dc-is-full', _isMax);
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

    btnStart.addEventListener('click', () => {
        // Si aperçu actif, le couper avant de démarrer
        if (apercuActive) toggleApercu();
        toggleStart();
    });
    btnStop.addEventListener('click', stopDefi);
    btnReset.addEventListener('click', resetDefi);

    Object.values(modeBtns).forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    timeMinus.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        adjustTime(-1);
        const iv = setInterval(() => adjustTime(-1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('mouseup', stop, { once: true });
    });
    timeMinus.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        adjustTime(-1);
        const iv = setInterval(() => adjustTime(-1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('touchend', stop, { once: true });
    }, { passive: true });
    timePlus.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        adjustTime(1);
        const iv = setInterval(() => adjustTime(1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('mouseup', stop, { once: true });
    });
    timePlus.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        adjustTime(1);
        const iv = setInterval(() => adjustTime(1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('touchend', stop, { once: true });
    }, { passive: true });

    sensMinus.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        adjustSens(-1);
        const iv = setInterval(() => adjustSens(-1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('mouseup', stop, { once: true });
    });
    sensMinus.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        adjustSens(-1);
        const iv = setInterval(() => adjustSens(-1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('touchend', stop, { once: true });
    }, { passive: true });
    sensPlus.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        adjustSens(1);
        const iv = setInterval(() => adjustSens(1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('mouseup', stop, { once: true });
    });
    sensPlus.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        adjustSens(1);
        const iv = setInterval(() => adjustSens(1), 120);
        const stop = () => clearInterval(iv);
        window.addEventListener('touchend', stop, { once: true });
    }, { passive: true });

    urlInput.addEventListener('mousedown', (e) => e.stopPropagation());
    urlInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && urlInput.value.trim()) {
            applyImage(urlInput.value);
            resetDefi();
            showNewImage();
        }
    });
    randBtn.addEventListener('click', () => {
        const url = 'https://picsum.photos/900/500?random=' + Math.floor(Math.random() * 9999);
        urlInput.value = url;
        applyImage(url);
        resetDefi();
        showNewImage();
    });

    btnImport.addEventListener('click', (e) => {
        e.stopPropagation();
        importFileInput.click();
    });
    importFileInput.addEventListener('change', () => {
        const file = importFileInput.files[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        urlInput.value = file.name;
        imgEl.src = objectUrl;
        imgEl.crossOrigin = null;
        if (usesGrid() || usesBrush()) generateGrid();
        resetDefi();
        showNewImage();
        importFileInput.value = '';
    });

    // Ne pas voler le focus sur input/button
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    // ── Thème clair / sombre ─────────────────────────────────────────────
    // Le thème est géré par CSS via body.menu-light — voir les règles en haut du fichier.
    // Le MutationObserver ci-dessous écoute le changement de classe sur body pour
    // régénérer la grille pixels quand le thème bascule (les blocs sont créés en JS
    // et héritent automatiquement du bon style CSS à la recréation).
    const themeObserver = new MutationObserver(() => {
        if (usesGrid()) generateGrid();
        else if (usesBrush()) { brushDrawnIdx = -1; updateUI(); }
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Nettoyer l'audio et les observers quand le widget est supprimé
    const observer = new MutationObserver(() => {
        if (!widget.isConnected) {
            isPlaying = false;
            if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            stopAudio();
            observer.disconnect();
            themeObserver.disconnect();
        }
    });
    observer.observe(widget.parentNode || document.body, { childList: true });

    // ── Init ──────────────────────────────────────────────────────────────
    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    generateGrid();
    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && !_isMax) wfMax.click();
    saveBoard();
    return widget;
}
