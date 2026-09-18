// ══════════════════════════════════════════════════════════════════
//  widget-horloge.js  —  Horloge interactive (aiguilles manipulables)
// ══════════════════════════════════════════════════════════════════

function createHorlogeWidget() {

    // ── Injecter le CSS une seule fois ────────────────────────────
    if (!document.getElementById('hrlg-style')) {
        const s = document.createElement('style');
        s.id = 'hrlg-style';
        s.textContent = `
        @font-face {
            font-family: 'MarelleBaton';
            src: url('polices/MarelleBaton-Regular.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        .widget[data-type="horloge"] {
            cursor: move;
            overflow: visible !important;
        }
        .widget[data-type="horloge"] button    { cursor: pointer; }
        .widget[data-type="horloge"] .hrlg-drag-hour,
        .widget[data-type="horloge"] .hrlg-drag-minute { cursor: grab; }
        .widget[data-type="horloge"] .hrlg-drag-hour:active,
        .widget[data-type="horloge"] .hrlg-drag-minute:active { cursor: grabbing; }
        .widget[data-type="horloge"] .custom-resize-handle { cursor: se-resize; }
        .widget[data-type="horloge"] .drag-handle { cursor: move; }

        .hrlg-ec {
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            height: auto !important;
        }
        .hrlg-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto !important;
            font-size: 14px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
        }
        .hrlg-container.wf-fullboard .hrlg-header {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            flex-shrink: 0 !important;
            font-size: 14px !important;
        }
        .hrlg-container.wf-fullboard .hrlg-body {
            width: min(700px, 85vmin) !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding-top: 1em !important;
        }
        .hrlg-container.wf-fullboard .hrlg-time-display {
            font-size: 6em !important;
        }
        .hrlg-container.wf-fullboard .hrlg-toggle-time-btn,
        .hrlg-container.wf-fullboard .hrlg-toggle-min-nums-btn,
        .hrlg-container.wf-fullboard .hrlg-toggle-hour-nums-btn,
        .hrlg-container.wf-fullboard .hrlg-reset-btn {
            font-size: 1em !important;
        }
        .hrlg-container {
            display: flex;
            flex-direction: column;
            background: #12122a;
            border-radius: 14px;
            border: 0.07em solid #2e2e50;
            box-shadow: 0 0.3em 1.4em rgba(0,0,0,.35);
            font-size: 14px;
            min-width: 200px;
            width: 100%;
            overflow: hidden;
            box-sizing: border-box;
        }
        .hrlg-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.55em 0.85em;
            background: #1a1a38;
            border-bottom: 0.07em solid #2e2e50;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            border-radius: 14px 14px 0 0;
        }
        .hrlg-ec.wf-fullboard .hrlg-header { border-radius: 0; }
        .hrlg-title { font-size: 0.82em; font-weight: 700; color: #a5b4fc; letter-spacing: 0.03em; }
        .hrlg-help-btn {
            background: rgba(165,180,252,.12); border: 0.07em solid rgba(165,180,252,.3);
            color: #a5b4fc; font-size: 0.65em; font-weight: 700;
            width: 1.7em; height: 1.7em; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
            flex-shrink: 0;
        }
        .hrlg-help-popup {
            display: none; position: absolute; top: 3em; left: 0.8em; right: 0.8em;
            background: #1e1e40; border: 1px solid #3a3a60; border-radius: 10px;
            padding: 0.8em 1em; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,.5);
            color: #c7d2fe; font-size: 0.8em; line-height: 1.5;
        }
        .hrlg-help-popup.hrlg-help-show { display: block; }
        .hrlg-help-popup h4 { margin: 0 0 0.5em; color: #a5b4fc; font-size: 1em; }
        .hrlg-help-section { margin-bottom: 0.5em; }
        .hrlg-help-section:last-child { margin-bottom: 0; }
        .hrlg-body {
            display: flex; flex-direction: column; align-items: center;
            padding: 1.1em 1em 0.9em; gap: 0.9em;
            flex: 1; min-height: 0;
        }
        .hrlg-clock-wrap { width: 100%; flex: 1; min-height: 0; }
        .hrlg-svg { width: 100%; height: 100%; display: block; overflow: visible; max-height: 100%; }
        .hrlg-face   { fill: #1c1c3a; filter: drop-shadow(0 2px 12px rgba(0,0,0,.5)); }
        .hrlg-border { stroke: #4a4a80; stroke-width: 2.5; fill: none; }
        .hrlg-tick-min  { stroke: #3a3a65; stroke-width: 1; stroke-linecap: round; }
        .hrlg-tick-hour { stroke: #6366f1; stroke-width: 2.5; stroke-linecap: round; }
        .hrlg-number { font-family: 'MarelleBaton', cursive !important; font-weight: 700; fill: #c7d2fe; }
        .hrlg-hand { stroke-linecap: round; pointer-events: none; }
        .hrlg-hand-hour   { stroke: #ef4444; stroke-width: 5; }
        .hrlg-hand-minute { stroke: #3b82f6; stroke-width: 3; }
        .hrlg-drag-hour, .hrlg-drag-minute { stroke: transparent; stroke-width: 18; touch-action: none; }
        .hrlg-center { fill: #6366f1; filter: drop-shadow(0 0 3px rgba(99,102,241,.8)); }
        .hrlg-digital-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.55em; width: 100%; }
        .hrlg-digital {
            background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.3);
            border-radius: 0.5em; padding: 0.3em 1em; min-width: 5em; text-align: center;
        }
        .hrlg-time-display {
            font-family: 'MarelleBaton', cursive !important;
            font-size: 3em; font-weight: 700; color: #a5b4fc;
            letter-spacing: 0.05em; display: block; line-height: 1.2;
        }
        .hrlg-colon { font-family: 'MarelleBaton', sans-serif !important; font-weight: 700; }
        .hrlg-controls { display: flex; gap: 0.5em; align-items: center; justify-content: center; }
        .hrlg-toggle-time-btn {
            background: rgba(99,102,241,.12); border: 0.07em solid rgba(99,102,241,.35);
            color: #a5b4fc; font-size: 0.62em; font-weight: 600;
            padding: 0.35em 0.9em; border-radius: 0.5em; cursor: pointer; white-space: nowrap;
        }
        .hrlg-reset-btn {
            background: rgba(239,68,68,.1); border: 0.07em solid rgba(239,68,68,.35);
            font-size: 0.65em; width: 2em; height: 2em;
            display: flex; align-items: center; justify-content: center;
            border-radius: 0.5em; cursor: pointer;
        }
        body.menu-light .hrlg-container { background: #f4f5ff; border-color: #d4d4e8; }
        body.menu-light .hrlg-header { background: #eef0f8; border-bottom-color: #d4d4e8; }
        body.menu-light .hrlg-title { color: #4338ca; }
        body.menu-light .hrlg-face { fill: #ffffff; }
        body.menu-light .hrlg-border { stroke: #9090c0; }
        body.menu-light .hrlg-tick-min { stroke: #c8c8e0; }
        body.menu-light .hrlg-tick-hour { stroke: #4338ca; }
        body.menu-light .hrlg-number { fill: #333366; }
        body.menu-light .hrlg-hand-hour { stroke: #dc2626; }
        body.menu-light .hrlg-hand-minute { stroke: #2563eb; }
        body.menu-light .hrlg-center { fill: #4338ca; }
        body.menu-light .hrlg-digital { background: rgba(67,56,202,.07); border-color: rgba(67,56,202,.25); }
        body.menu-light .hrlg-time-display { color: #312e81; }
        body.menu-light .hrlg-toggle-time-btn { background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca; }

        /* ── Barre de paramètres ── */
        .hrlg-settings-toggle {
            background: rgba(165,180,252,.12); border: 0.07em solid rgba(165,180,252,.3);
            color: #a5b4fc; font-size: 0.72em;
            width: 1.7em; height: 1.7em; border-radius: 0.4em; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
            transition: background 0.15s;
        }
        .hrlg-settings-toggle.hrlg-settings-open { background: rgba(99,102,241,.3); }
        .hrlg-settings-bar {
            display: flex; flex-wrap: wrap; gap: 0.4em 0.7em;
            padding: 0.55em 0.85em; background: #161630;
            border-bottom: 0.07em solid #2e2e50;
            align-items: center;
        }
        .hrlg-settings-bar.hrlg-settings-hidden { display: none; }
        .hrlg-settings-label {
            display: flex; align-items: center; gap: 0.35em;
            font-size: 0.65em; color: #c7d2fe; cursor: pointer;
            white-space: nowrap; user-select: none;
        }
        .hrlg-settings-label input[type="checkbox"] { accent-color: #6366f1; cursor: pointer; }
        .hrlg-swatch {
            display: inline-block; width: 0.9em; height: 0.9em;
            border-radius: 50%; flex-shrink: 0;
        }
        body.menu-light .hrlg-settings-bar { background: #eef0f8; border-bottom-color: #d4d4e8; }
        body.menu-light .hrlg-settings-label { color: #4338ca; }
        .hrlg-container.wf-fullboard .hrlg-settings-label { font-size: 1em; }
        .hrlg-container.wf-fullboard .hrlg-period-btn { font-size: 1em; }
        .hrlg-settings-sep { width: 1px; height: 1.4em; background: rgba(165,180,252,.25); flex-shrink: 0; align-self: center; }
        .hrlg-period-toggle { display: flex; border-radius: 0.4em; overflow: hidden; border: 0.07em solid rgba(165,180,252,.3); flex-shrink: 0; }
        .hrlg-period-btn {
            background: transparent; border: none; color: #a5b4fc;
            font-size: 0.65em; font-weight: 600; padding: 0.25em 0.6em;
            cursor: pointer; white-space: nowrap; transition: background 0.15s, color 0.15s;
        }
        .hrlg-period-btn.hrlg-period-active { background: rgba(99,102,241,.4); color: #fff; }
        body.menu-light .hrlg-period-btn { color: #4338ca; }
        body.menu-light .hrlg-period-btn.hrlg-period-active { background: rgba(67,56,202,.25); color: #1e1b4b; }


        /* ── Numéros de minutes sur le cadran ── */
        .hrlg-number-min { font-family: 'MarelleBaton', sans-serif; font-weight: 700; fill: #60a5fa; font-size: 7px; }
        body.menu-light .hrlg-number-min { fill: #2563eb; }

        /* ── Boutons numéros minutes / heures ── */
        .hrlg-toggle-min-nums-btn, .hrlg-toggle-hour-nums-btn {
            background: rgba(99,102,241,.12); border: 0.07em solid rgba(99,102,241,.35);
            color: #a5b4fc; font-size: 0.62em; font-weight: 600;
            padding: 0.35em 0.9em; border-radius: 0.5em; cursor: pointer; white-space: nowrap;
        }
        body.menu-light .hrlg-toggle-min-nums-btn, body.menu-light .hrlg-toggle-hour-nums-btn {
            background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca;
        }
        `;
        document.head.appendChild(s);
    }

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'horloge';
    widget.dataset.transparent = 'true';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left  = '100px';
    widget.style.top   = p.y + 'px';
    widget.style.cssText = `left:100px; top:${p.y}px; overflow:visible; flex-direction:row;`;

    widget.addEventListener('mousedown', () => {
        if (typeof isDrawMode   !== 'undefined' && isDrawMode)   return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true' && typeof bringToFront === 'function') bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle"  onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"   onclick="togglePin(this.closest('.widget,.shape-widget'))"    title="Épingler">📌</div>
            <div class="widget-back-handle"  onclick="sendToBack(this.closest('.widget,.shape-widget'))"   title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>`;

    // Construire le container avec overflow:visible en inline style
    const ec = document.createElement('div');
    ec.className = 'hrlg-ec';
    ec.style.overflow = 'visible';

    const initW = Math.min(Math.round(window.innerWidth * 0.25), 400);
    ec.innerHTML = `
        <div class="hrlg-container" style="width:${initW}px">
            <div class="hrlg-header">
                <span class="hrlg-title">🕐 Horloge</span>
                <button class="hrlg-settings-toggle" title="Paramètres">⚙️</button>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="hrlg-help-btn" title="Aide">?</button>
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>
            <div class="hrlg-help-popup">
                <h4>💡 Horloge interactive</h4>
                <div class="hrlg-help-section">
                    <strong>🖱️ Manipuler les aiguilles</strong><br>
                    Faites glisser l'aiguille des <em>heures</em> (courte, rouge) ou des <em>minutes</em> (longue, bleue) pour régler l'heure.
                </div>
                <div class="hrlg-help-section">
                    <strong>👁️ Cacher / afficher l'heure</strong><br>
                    Masque l'affichage numérique pour que les élèves lisent l'heure uniquement sur le cadran.
                </div>
                <div class="hrlg-help-section">
                    <strong>🔢 Nº min</strong><br>
                    Affiche ou cache les numéros des minutes (00, 05, 10…) à l'extérieur du cadran.
                </div>
                <div class="hrlg-help-section">
                    <strong>🔢 Nº h</strong><br>
                    Affiche ou cache les chiffres des heures (1 à 12) sur le cadran — utile pour travailler la lecture sans repères.
                </div>
                <div class="hrlg-help-section">
                    <strong>⚙️ Paramètres</strong><br>
                    Affiche des portions colorées sur le cadran : et quart, et demi, trois-quarts, moins cinq, moins dix, moins le quart, etc.
                </div>
                <div class="hrlg-help-section">
                    <strong>🔄 Réinitialiser</strong><br>
                    Remet les aiguilles à 12h00.
                </div>
            </div>
            <div class="hrlg-settings-bar hrlg-settings-hidden">
                <label class="hrlg-settings-label" title="Et quart : de 12h00 à 3h00">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="quart">
                    <span class="hrlg-swatch" style="background:#34d399"></span> Et quart
                </label>
                <label class="hrlg-settings-label" title="Et demi : de 12h00 à 6h00">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="demi">
                    <span class="hrlg-swatch" style="background:#60a5fa"></span> Et demi
                </label>
                <label class="hrlg-settings-label" title="Trois-quarts : de 12h00 à 9h00">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="troiq">
                    <span class="hrlg-swatch" style="background:#f472b6"></span> Trois-quarts
                </label>
                <label class="hrlg-settings-label" title="Moins cinq : de 55 à 60 min">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="m5">
                    <span class="hrlg-swatch" style="background:#fbbf24"></span> Moins cinq
                </label>
                <label class="hrlg-settings-label" title="Moins dix : de 50 à 60 min">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="m10">
                    <span class="hrlg-swatch" style="background:#fb923c"></span> Moins dix
                </label>
				<label class="hrlg-settings-label" title="Moins le quart : de 45 à 60 min">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="mq">
                    <span class="hrlg-swatch" style="background:#f87171"></span> Moins le quart
                </label>
                <label class="hrlg-settings-label" title="Moins vingt : de 40 à 60 min">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="m20">
                    <span class="hrlg-swatch" style="background:#c084fc"></span> Moins vingt
                </label>
                <label class="hrlg-settings-label" title="Moins vingt-cinq : de 35 à 60 min">
                    <input type="checkbox" class="hrlg-arc-chk" data-arc="m25">
                    <span class="hrlg-swatch" style="background:#e879f9"></span> Moins vingt-cinq
                </label>
                <span class="hrlg-settings-sep"></span>
                <div class="hrlg-period-toggle" title="Afficher l'heure en matin (0–11h) ou après-midi (12–23h)">
                    <button class="hrlg-period-btn" data-period="am">🌅 Matin</button>
                    <button class="hrlg-period-btn" data-period="pm">🌇 Après-midi</button>
                </div>

            </div>
            <div class="hrlg-body">
                <div class="hrlg-clock-wrap">
                    <svg class="hrlg-svg" viewBox="-22 -22 244 244" xmlns="http://www.w3.org/2000/svg">
                        <circle class="hrlg-face"   cx="100" cy="100" r="96"/>
                        <circle class="hrlg-border" cx="100" cy="100" r="96"/>
                        <g class="hrlg-ticks-min"></g>
                        <g class="hrlg-ticks-hour"></g>
                        <g class="hrlg-arcs"></g>
                        <g class="hrlg-numbers"></g>
                        <g class="hrlg-numbers-min"></g>
                        <line class="hrlg-hand hrlg-hand-hour"   x1="100" y1="100" x2="100" y2="46"/>
                        <line class="hrlg-hand hrlg-hand-minute" x1="100" y1="100" x2="100" y2="20"/>
                        <circle class="hrlg-center" cx="100" cy="100" r="4"/>
                        <line class="hrlg-drag-hour"   x1="100" y1="100" x2="100" y2="46"/>
                        <line class="hrlg-drag-minute" x1="100" y1="100" x2="100" y2="20"/>
                    </svg>
                </div>
                <div class="hrlg-digital-wrap">
                    <div class="hrlg-digital">
                        <span class="hrlg-time-display">12<span class="hrlg-colon">:</span>00</span>
                    </div>
                    <div class="hrlg-controls">
                        <button class="hrlg-toggle-time-btn">👁️ Cacher l'heure</button>
                        <button class="hrlg-toggle-min-nums-btn" title="Afficher/cacher les numéros des minutes">🔢 Nº min</button>
                        <button class="hrlg-toggle-hour-nums-btn" title="Afficher/cacher les numéros des heures">🔢 Nº h</button>
                        <button class="hrlg-reset-btn" title="Remettre à 12:00">🔄</button>
                    </div>
                </div>
            </div>
        </div>`;

    widget.appendChild(ec);

    const board = document.getElementById('board');
    board.appendChild(widget);

    if (typeof bringToFront            === 'function') bringToFront(widget);
    if (typeof makeDraggable           === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate     === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle   === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    _initHorlogeResize(widget);

    // ── Injecter CSS wf-btns si pas encore présent ────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
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

    // ── Header comme poignée de déplacement ───────────────────────
    const hrlgHeader = widget.querySelector('.hrlg-header');
    if (hrlgHeader && typeof startWidgetDrag === 'function') {
        hrlgHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        hrlgHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons wf ────────────────────────────────────────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const container = widget.querySelector('.hrlg-container');
    let _hrlgIsMax = false;
    let _savedW = '';

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_hrlgIsMax) wfMax.click();
            if (typeof window._wfMiniBarCollapse === 'function') {
                ec.style.display = 'none';
                window._wfMiniBarCollapse(widget, '🕐 Horloge', {
                    onExpand: () => { ec.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _hrlgIsMax = !_hrlgIsMax;
            if (_hrlgIsMax) {
                _savedW = container.style.width;
                container.classList.add('wf-fullboard');
                requestAnimationFrame(() => { if (widget._hrlgApplyScale) widget._hrlgApplyScale(); });
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedW) container.style.width = _savedW;
                requestAnimationFrame(() => { if (widget._hrlgApplyScale) widget._hrlgApplyScale(); });
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

    // ── Aide ──────────────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.hrlg-help-btn');
    const helpPopup = widget.querySelector('.hrlg-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('hrlg-help-show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('hrlg-help-show'));
    }

    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    _initHorlogeWidget(widget);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();

    return widget;
}

// ── Scaling proportionnel ──────────────────────────────────────────
const HRLG_REF_W   = 320;
const HRLG_BASE_FS = 14;

function _initHorlogeResize(widget) {
    const cont = widget.querySelector('.hrlg-container');
    if (!cont) return;

    // ── Poignée de resize custom (coin bas-droit) ─────────────────
    const handle = document.createElement('div');
    handle.className = 'hrlg-custom-resize-handle';
    handle.title = 'Redimensionner';
    handle.innerHTML = '⤢';
    cont.appendChild(handle);

    // CSS de la poignée (injecté une seule fois)
    if (!document.getElementById('hrlg-resize-handle-style')) {
        const rs = document.createElement('style');
        rs.id = 'hrlg-resize-handle-style';
        rs.textContent = `
        .hrlg-custom-resize-handle {
            position: absolute; bottom: 3px; right: 4px;
            width: 18px; height: 18px;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: rgba(165,180,252,.5);
            cursor: se-resize; user-select: none; z-index: 10;
            transition: color 0.15s;
        }
        .hrlg-custom-resize-handle:hover { color: rgba(165,180,252,.9); }
        .hrlg-container { position: relative; }
        `;
        document.head.appendChild(rs);
    }

    // ── Scaling ────────────────────────────────────────────────────
    function _applyScale() {
        if (cont.classList.contains('wf-fullboard')) return;
        const w = cont.offsetWidth;
        if (!w) return;
        const h = cont.offsetHeight;
        const headerH = Math.round((w / HRLG_REF_W) * 120);
        const availH = h > 0 ? h - headerH : Infinity;
        const ref = Math.min(w, availH > 50 ? availH : w);
        const fs = Math.max(8, Math.round((ref / HRLG_REF_W) * HRLG_BASE_FS * 10) / 10);
        cont.style.fontSize = fs + 'px';
    }

    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(_applyScale);
        ro.observe(cont);
    }
    requestAnimationFrame(_applyScale);
    widget._hrlgApplyScale = _applyScale;
}

// ── Logique interne ────────────────────────────────────────────────
function _initHorlogeWidget(widget) {
    const svg         = widget.querySelector('.hrlg-svg');
    const handHour    = widget.querySelector('.hrlg-hand-hour');
    const handMin     = widget.querySelector('.hrlg-hand-minute');
    const dragHour    = widget.querySelector('.hrlg-drag-hour');
    const dragMin     = widget.querySelector('.hrlg-drag-minute');
    const timeDisplay = widget.querySelector('.hrlg-time-display');
    const toggleBtn   = widget.querySelector('.hrlg-toggle-time-btn');
    const resetBtn    = widget.querySelector('.hrlg-reset-btn');
    const arcsGroup   = widget.querySelector('.hrlg-arcs');

    // ── Définition des arcs ───────────────────────────────────────
    // startMin/endMin : en minutes sur le cadran (0 = 12h, 15 = 3h, 30 = 6h, 45 = 9h)
    const ARC_DEFS = {
        quart: { startMin: 0,  endMin: 15, color: '#34d399', opacity: 0.28 },
        demi:  { startMin: 0,  endMin: 30, color: '#60a5fa', opacity: 0.22 },
        troiq: { startMin: 0,  endMin: 45, color: '#f472b6', opacity: 0.20 },
        m5:    { startMin: 55, endMin: 60, color: '#fbbf24', opacity: 0.38 },
        m10:   { startMin: 50, endMin: 60, color: '#fb923c', opacity: 0.30 },
        m20:   { startMin: 40, endMin: 60, color: '#c084fc', opacity: 0.25 },
        m25:   { startMin: 35, endMin: 60, color: '#e879f9', opacity: 0.22 },
        mq:    { startMin: 45, endMin: 60, color: '#f87171', opacity: 0.30 },
    };

    // Convertit des minutes (0-60) en coordonnées d'arc SVG (centre 100,100, rayon 78)
    function _arcPath(startMin, endMin, r) {
        r = r || 78;
        const toRad = m => ((m * 6) - 90) * Math.PI / 180;
        const s = toRad(startMin === 60 ? 59.99 : startMin);
        const e = toRad(endMin   === 60 ? 59.99 : endMin);
        const x1 = (100 + Math.cos(s) * r).toFixed(3);
        const y1 = (100 + Math.sin(s) * r).toFixed(3);
        const x2 = (100 + Math.cos(e) * r).toFixed(3);
        const y2 = (100 + Math.sin(e) * r).toFixed(3);
        const span = endMin - startMin;
        const large = span > 30 ? 1 : 0;
        return `M 100 100 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    }

    // état des arcs (depuis state)
    const state = { hours: 12, minutes: 0, showTime: true, arcs: {}, period: null, showMinNums: false, showHourNums: true };

    widget._hrlgGetData = () => {
        const cont = widget.querySelector('.hrlg-container');
        const isFullboard = cont && cont.classList.contains('wf-fullboard');
        return { ...state, arcs: { ...state.arcs }, containerW: (!isFullboard && cont) ? cont.offsetWidth : null };
    };
    widget._hrlgSetData = (data) => {
        if (!data) return;
        if (data.hours        !== undefined) state.hours        = data.hours;
        if (data.minutes      !== undefined) state.minutes      = data.minutes;
        if (data.showTime     !== undefined) state.showTime     = data.showTime;
        if (data.period       !== undefined) state.period       = data.period;
        if (data.showMinNums  !== undefined) state.showMinNums  = data.showMinNums;
        if (data.showHourNums !== undefined) state.showHourNums = data.showHourNums;
        if (data.arcs     && typeof data.arcs === 'object') {
            Object.assign(state.arcs, data.arcs);
            // Synchroniser les checkboxes
            widget.querySelectorAll('.hrlg-arc-chk').forEach(chk => {
                chk.checked = !!state.arcs[chk.dataset.arc];
            });
        }
        // Synchroniser boutons period
        widget.querySelectorAll('.hrlg-period-btn').forEach(btn => {
            btn.classList.toggle('hrlg-period-active', btn.dataset.period === state.period);
        });
        if (data.containerW) {
            const cont = widget.querySelector('.hrlg-container');
            if (cont && !cont.classList.contains('wf-fullboard')) cont.style.width = data.containerW + 'px';
        }
        _render();
    };

    _buildClockFace(svg);

    function _render() { _updateHands(); _updateDigital(); _updateToggleBtn(); _updateArcs(); _updateMinNums(); _updateHourNums(); _updateToggleMinNumsBtn(); _updateToggleHourNumsBtn(); }

    function _updateArcs() {
        if (!arcsGroup) return;
        arcsGroup.innerHTML = '';
        Object.entries(ARC_DEFS).forEach(([key, def]) => {
            if (!state.arcs[key]) return;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', _arcPath(def.startMin, def.endMin));
            path.setAttribute('fill', def.color);
            path.setAttribute('fill-opacity', def.opacity);
            path.setAttribute('stroke', def.color);
            path.setAttribute('stroke-opacity', def.opacity * 1.5);
            path.setAttribute('stroke-width', '0.5');
            arcsGroup.appendChild(path);
        });
    }

    function _updateMinNums() {
        const g = svg.querySelector('.hrlg-numbers-min');
        if (!g) return;
        g.innerHTML = '';
        if (!state.showMinNums) return;
        [0,5,10,15,20,25,30,35,40,45,50,55].forEach(n => {
            const a = (n * 6 - 90) * Math.PI / 180;
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            // Rayon 110 = extérieur du cadran (r=96 + marge)
            t.setAttribute('x', (100 + Math.cos(a) * 110).toFixed(2));
            t.setAttribute('y', (100 + Math.sin(a) * 110).toFixed(2));
            t.setAttribute('class', 'hrlg-number-min');
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('dominant-baseline', 'central');
            t.textContent = String(n).padStart(2, '0');
            g.appendChild(t);
        });
    }

    function _updateHourNums() {
        const g = svg.querySelector('.hrlg-numbers');
        if (!g) return;
        g.style.visibility = state.showHourNums ? 'visible' : 'hidden';
    }

    function _updateToggleMinNumsBtn() {
        const btn = widget.querySelector('.hrlg-toggle-min-nums-btn');
        if (btn) btn.textContent = state.showMinNums ? '🔢 Cacher nº min' : '🔢 Nº min';
    }

    function _updateToggleHourNumsBtn() {
        const btn = widget.querySelector('.hrlg-toggle-hour-nums-btn');
        if (btn) btn.textContent = state.showHourNums ? '🔢 Cacher nº h' : '🔢 Nº h';
    }

    function _updateHands() {
        const hAngle = ((state.hours % 12) * 30) + (state.minutes * 0.5);
        const mAngle = state.minutes * 6;
        _setHandAngle(handHour,  hAngle, 46);
        _setHandAngle(handMin,   mAngle, 20);
        _setHandAngle(dragHour,  hAngle, 46);
        _setHandAngle(dragMin,   mAngle, 20);
    }

    function _setHandAngle(line, angleDeg, tipY) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        const len = 100 - tipY;
        line.setAttribute('x2', (100 + Math.cos(rad) * len).toFixed(2));
        line.setAttribute('y2', (100 + Math.sin(rad) * len).toFixed(2));
    }

    function _updateDigital() {
        let h;
        const base = state.hours % 12 || 12; // 1–12
        if (state.period === 'am') {
            // matin : 0–11h → 12 devient 0, 1–11 restent
            h = String(state.hours % 12).padStart(2, '0'); // 0–11
        } else if (state.period === 'pm') {
            // après-midi : 12–23h → 12 reste 12, 1 devient 13, etc.
            const pm = (state.hours % 12) + 12; // 12–23
            h = String(pm).padStart(2, '0');
        } else {
            h = String(base).padStart(2, '0');
        }
        const m = String(state.minutes).padStart(2, '0');
        timeDisplay.innerHTML = h + '<span class="hrlg-colon">:</span>' + m;
        timeDisplay.style.visibility = state.showTime ? 'visible' : 'hidden';
    }

    function _updateToggleBtn() {
        toggleBtn.textContent = state.showTime ? '👁️ Cacher l\'heure' : '👁️ Afficher l\'heure';
    }

    function _getAngleFromEvent(e) {
        const rect = svg.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let angle = Math.atan2(clientX - cx, -(clientY - cy)) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        return angle;
    }

    function _makeDrag(onMove) {
        return function(e) {
            // Bloque toute remontée vers un éventuel gestionnaire de déplacement
            // du widget (mousedown/pointerdown), essentiel avec un stylet de
            // vidéoprojecteur qui émet des Pointer Events plutôt que des
            // événements souris/tactile classiques.
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

            // Capture le pointeur sur la poignée : le drag continue de suivre
            // ce pointeur précis même si le stylet quitte la zone de l'aiguille.
            if (e.pointerId !== undefined && e.target && typeof e.target.setPointerCapture === 'function') {
                try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
            }

            const move = (ev) => {
                ev.preventDefault();
                onMove(_getAngleFromEvent(ev));
                _render();
            };
            const up = (ev) => {
                if (ev) ev.preventDefault();
                document.removeEventListener('mousemove',   move);
                document.removeEventListener('mouseup',     up);
                document.removeEventListener('touchmove',   move);
                document.removeEventListener('touchend',    up);
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup',   up);
                document.removeEventListener('pointercancel', up);
                if (typeof snapshotNow === 'function') snapshotNow();
                if (typeof saveBoard   === 'function') saveBoard();
            };
            document.addEventListener('mousemove',   move);
            document.addEventListener('mouseup',     up);
            document.addEventListener('touchmove',   move, { passive: false });
            document.addEventListener('touchend',    up);
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup',   up);
            document.addEventListener('pointercancel', up);
        };
    }

    function _dragHourMove(a) {
        const h12 = Math.floor(a / 30); // 0–11
        const offset = state.hours >= 12 ? 12 : 0; // conserver matin/après-midi
        state.hours = h12 + offset;
        state.minutes = Math.round((a % 30) / 30 * 60) % 60;
    }
    dragHour.addEventListener('mousedown',  _makeDrag(_dragHourMove));
    dragHour.addEventListener('touchstart', _makeDrag(_dragHourMove), { passive: false });
    dragHour.addEventListener('pointerdown', _makeDrag(_dragHourMove));

    // Drag des minutes : détecte le passage 59→0 (avance) et 0→59 (recule) pour changer d'heure
    let _lastMinAngle = null;
    function _dragMinMove(a) {
        const newMin = Math.round(a / 6) % 60;
        if (_lastMinAngle !== null) {
            const prev = Math.round(_lastMinAngle / 6) % 60;
            // Passage vers l'avant : 59 → 0..4
            if (prev >= 55 && newMin <= 4) {
                state.hours = (state.hours + 1) % 24;
            }
            // Passage vers l'arrière : 0..4 → 59
            if (prev <= 4 && newMin >= 55) {
                state.hours = (state.hours + 23) % 24;
            }
        }
        _lastMinAngle = a;
        state.minutes = newMin;
    }
    function _dragMinStart(onMove) {
        return function(e) {
            _lastMinAngle = null;
            _makeDrag(onMove)(e);
        };
    }
    dragMin.addEventListener('mousedown',   _dragMinStart(_dragMinMove));
    dragMin.addEventListener('touchstart',  _dragMinStart(_dragMinMove), { passive: false });
    dragMin.addEventListener('pointerdown', _dragMinStart(_dragMinMove));

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); state.showTime = !state.showTime; _render();
        if (typeof snapshotNow === 'function') snapshotNow();
        if (typeof saveBoard   === 'function') saveBoard();
    });

    const toggleMinNumsBtn  = widget.querySelector('.hrlg-toggle-min-nums-btn');
    const toggleHourNumsBtn = widget.querySelector('.hrlg-toggle-hour-nums-btn');
    if (toggleMinNumsBtn) {
        toggleMinNumsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); state.showMinNums = !state.showMinNums; _render();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }
    if (toggleHourNumsBtn) {
        toggleHourNumsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); state.showHourNums = !state.showHourNums; _render();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }
    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation(); state.hours = 12; state.minutes = 0; _render();
        if (typeof snapshotNow === 'function') snapshotNow();
        if (typeof saveBoard   === 'function') saveBoard();
    });

    // ── Boutons matin / après-midi ────────────────────────────────
    widget.querySelectorAll('.hrlg-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = btn.dataset.period;
            // toggle : cliquer sur le bouton actif le désactive
            state.period = (state.period === p) ? null : p;
            widget.querySelectorAll('.hrlg-period-btn').forEach(b => {
                b.classList.toggle('hrlg-period-active', b.dataset.period === state.period);
            });
            _render();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Checkboxes d'arcs ─────────────────────────────────────────
    widget.querySelectorAll('.hrlg-arc-chk').forEach(chk => {
        chk.addEventListener('change', (e) => {
            e.stopPropagation();
            state.arcs[chk.dataset.arc] = chk.checked;
            _render();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Bouton paramètres ─────────────────────────────────────────
    const settingsToggle = widget.querySelector('.hrlg-settings-toggle');
    const settingsBar    = widget.querySelector('.hrlg-settings-bar');
    if (settingsToggle && settingsBar) {
        settingsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const hidden = settingsBar.classList.toggle('hrlg-settings-hidden');
            settingsToggle.classList.toggle('hrlg-settings-open', !hidden);
        });
    }

    _render();
}

// ── Cadran ────────────────────────────────────────────────────────
function _buildClockFace(svg) {
    const ticksMin  = svg.querySelector('.hrlg-ticks-min');
    const ticksHour = svg.querySelector('.hrlg-ticks-hour');
    const numbers   = svg.querySelector('.hrlg-numbers');
    if (!ticksMin || !ticksHour || !numbers) return;

    for (let i = 0; i < 60; i++) {
        const a = (i * 6 - 90) * Math.PI / 180;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', (100 + Math.cos(a) * 88).toFixed(2)); l.setAttribute('y1', (100 + Math.sin(a) * 88).toFixed(2));
        l.setAttribute('x2', (100 + Math.cos(a) * 93).toFixed(2)); l.setAttribute('y2', (100 + Math.sin(a) * 93).toFixed(2));
        l.setAttribute('class', 'hrlg-tick-min'); ticksMin.appendChild(l);
    }
    for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', (100 + Math.cos(a) * 82).toFixed(2)); l.setAttribute('y1', (100 + Math.sin(a) * 82).toFixed(2));
        l.setAttribute('x2', (100 + Math.cos(a) * 93).toFixed(2)); l.setAttribute('y2', (100 + Math.sin(a) * 93).toFixed(2));
        l.setAttribute('class', 'hrlg-tick-hour'); ticksHour.appendChild(l);
    }
    [12,1,2,3,4,5,6,7,8,9,10,11].forEach((n, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', (100 + Math.cos(a) * 73).toFixed(2));
        t.setAttribute('y', (100 + Math.sin(a) * 73).toFixed(2));
        t.setAttribute('class', 'hrlg-number');
        t.setAttribute('font-size', '13');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.textContent = n;
        numbers.appendChild(t);
    });
}
