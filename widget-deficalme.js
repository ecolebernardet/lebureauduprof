// =========================================================================
// WIDGET DÉFI CALME — Le Bureau du Prof
// Révèle une image au silence (micro) — 3 modes : pixels, flou, zoom
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

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
            border-top: 1px solid rgba(0,0,0,0.1);
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
            width: 600px;
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
            border-top: 1px solid rgba(255,255,255,0.07);
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
    defaultImageUrl: 'https://picsum.photos/900/500?random=' + Math.floor(Math.random() * 1000)
};

// ── Création du widget ────────────────────────────────────────────────────
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
    imageZone.appendChild(msgStart);
    imageZone.appendChild(micBarWrap);
    imageZone.appendChild(progBarWrap);
    imageZone.appendChild(percentBadge);
    container.appendChild(imageZone);

    // ── Panneau contrôles ─────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'dc-controls';

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
        { key: 'zoom',   label: 'Zoom'   }
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
    groupSens.style.flex = '1';
    groupSens.style.justifyContent = 'center';
    groupSens.appendChild(sensLabel);
    groupSens.appendChild(sensPill);

    const groupDur = document.createElement('div');
    groupDur.className = 'dc-group';
    groupDur.style.flex = '1';
    groupDur.style.justifyContent = 'flex-end';
    groupDur.appendChild(durLabel);
    groupDur.appendChild(timePill);

    row1.appendChild(groupMode);
    row1.appendChild(groupSens);
    row1.appendChild(groupDur);

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
    function generateGrid() {
        const density = Math.max(4, Math.round(3 + (totalSeconds * DC_CONFIG.pixelDensityFactor)));
        const rows = Math.min(density, 40);
        const cols = Math.round(rows * (16 / 9));
        pixelGrid.innerHTML = '';
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
        pixelsOrder.forEach((p, i) => { p.style.opacity = i < n ? '0' : '1'; });
    }

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

    function updateImage(prog) {
        imgEl.style.filter = 'none';
        imgEl.style.transform = 'scale(1)';
        if (currentMode === 'pixels') {
            revealPixels(prog);
        } else if (currentMode === 'flou') {
            imgEl.style.filter = `blur(${40 - prog * 0.4}px)`;
        } else if (currentMode === 'zoom') {
            imgEl.style.transform = `scale(${10 - prog * 0.09})`;
            imgEl.style.filter = `blur(${Math.max(0, 5 - prog * 0.05)}px)`;
        }
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
            btnApercu.textContent = '👁';
            btnApercu.title = 'Aperçu';
            btnApercu.style.background = '#6366f1';
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
        pixelGrid.style.display = mode === 'pixels' ? 'grid' : 'none';
        if (mode === 'pixels') generateGrid();
        else { imgEl.style.filter = 'none'; imgEl.style.transform = 'scale(1)'; }
        updateUI();
    }

    // ── Image ─────────────────────────────────────────────────────────────
    function applyImage(url) {
        if (!url.trim()) return;
        imgEl.src = url.trim();
        if (currentMode === 'pixels') generateGrid();
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
    let apercuActive = false;
    function toggleApercu() {
        apercuActive = !apercuActive;
        if (apercuActive) {
            // Montrer l'image nette par dessus tout
            imgEl.style.filter = 'none';
            imgEl.style.transform = 'scale(1)';
            pixelGrid.style.opacity = '0';
            btnApercu.textContent = '🙈';
            btnApercu.title = 'Cacher l\'aperçu';
            btnApercu.style.background = '#ef4444';
        } else {
            pixelGrid.style.opacity = '1';
            btnApercu.textContent = '👁';
            btnApercu.title = 'Aperçu';
            btnApercu.style.background = '#6366f1';
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
        if (e.key === 'Enter') applyImage(urlInput.value);
    });
    randBtn.addEventListener('click', () => {
        const url = 'https://picsum.photos/900/500?random=' + Math.floor(Math.random() * 9999);
        urlInput.value = url;
        applyImage(url);
        resetDefi();
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
        if (currentMode === 'pixels') generateGrid();
        resetDefi();
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
        if (currentMode === 'pixels') generateGrid();
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
    saveBoard();
    return widget;
}
