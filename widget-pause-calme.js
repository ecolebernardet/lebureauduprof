// =========================================================================
// WIDGET PAUSE CALME — Le Bureau du Prof
// Exercice de respiration guidée avec animation de cercle.
// 3 modes : Cohérence Cardiaque / Respiration Carrée / Urgence Calme
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Réutiliser la mini-barre collapse partagée (injectée par widget-monnaie.js ou ici)
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
                e.stopPropagation(); e.preventDefault();
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
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW2 = window.innerWidth;
                    const curVH2 = typeof virtualH === 'function' ? virtualH(curW2) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW2) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH2) * 100;
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

    // CSS boutons fenêtre (partagé, injecté une seule fois)
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

    // CSS spécifique au widget pause-calme
    if (!document.getElementById('wpc-style')) {
        const s = document.createElement('style');
        s.id = 'wpc-style';
        s.textContent = `
        .widget[data-type="pause-calme"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Conteneur principal ── */
        .wpc-container {
            background: #1a1a2e;
            border: 1.5px solid #2d2d4e;
            border-radius: 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 24px rgba(0,0,0,0.35);
            position: relative;
            user-select: none;
            overflow: visible;
            width: 420px;
        }

        /* ── État plein écran board ── */
        .wpc-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            padding-left: 70px;
        }

        /* ── Barre du haut : nom + aide + wf-btns (même structure que monnaie) ── */
        .wpc-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px 8px;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            position: relative;
            border-radius: 16px 16px 0 0;
            overflow: hidden;  /* clip interne au header uniquement */
        }
        .wpc-title {
            font-size: 13px;
            font-weight: 800;
            color: #c8b4f8;
            letter-spacing: 0.3px;
            pointer-events: none;
        }

        /* ── Corps central : colonne centrée ── */
        .wpc-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px 16px 10px 16px;
            gap: 8px;
        }

        .wpc-session-title {
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #a78bfa;
            white-space: nowrap;
            text-align: center;
        }

        .wpc-timer {
            font-weight: 700;
            opacity: 0.45;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #e0d7ff;
            white-space: nowrap;
            text-align: center;
        }

        /* Le cercle avec padding pour absorber le scale(1.2) */
        .wpc-circle-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10%;
        }

        .wpc-circle {
            border-radius: 50%;
            background: radial-gradient(circle at 40% 35%, #a78bfa, #6d28d9);
            opacity: 0.85;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.1s ease-in-out;
            box-shadow: 0 0 32px -6px #8b5cf6, 0 0 60px -20px #7c3aed;
            transform: scale(0.6);
            /* width/height posés par JS */
        }

        .wpc-circle-text {
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #fff;
            pointer-events: none;
            /* font-size posé par JS */
        }

        /* ── Contrôles (musique + bouton démarrer) ── */
        .wpc-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }

        .wpc-btn-main {
            border-radius: 999px;
            border: none;
            font-size: 11px;
            font-weight: 900;
            padding: 8px 24px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: #fff;
            box-shadow: 0 4px 14px rgba(109, 40, 217, 0.45);
            transition: transform .12s, filter .12s;
        }
        .wpc-btn-main:hover { filter: brightness(1.12); }
        .wpc-btn-main:active { transform: scale(0.96); }

        .wpc-music-row {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
        }
        .wpc-music-label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #9ca3af;
            letter-spacing: 0.08em;
        }
        .wpc-switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 18px;
            flex-shrink: 0;
        }
        .wpc-switch input { opacity: 0; width: 0; height: 0; }
        .wpc-slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(128,128,128,0.35);
            transition: 0.3s;
            border-radius: 18px;
        }
        .wpc-slider:before {
            position: absolute;
            content: "";
            height: 12px; width: 12px;
            left: 3px; bottom: 3px;
            background: white;
            transition: 0.3s;
            border-radius: 50%;
        }
        .wpc-switch input:checked + .wpc-slider { background: #7c3aed; }
        .wpc-switch input:checked + .wpc-slider:before { transform: translateX(18px); }
        .wpc-switch input:disabled + .wpc-slider { opacity: 0.5; cursor: not-allowed; }

        /* ── Panneau config ── */
        .wpc-settings {
            background: rgba(255,255,255,0.04);
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 8px 14px 10px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            flex-shrink: 0;
            transition: opacity 0.3s, pointer-events 0.3s;
            border-radius: 0 0 16px 16px;
        }
        .wpc-settings.disabled { opacity: 0.3; pointer-events: none; }
        .wpc-label {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            color: #9ca3af;
            letter-spacing: 0.08em;
            display: block;
            margin-bottom: 3px;
        }
        .wpc-select {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.12);
            color: #e2d9f3;
            padding: 5px 28px 5px 10px;
            border-radius: 8px;
            width: 100%;
            font-weight: 700;
            font-size: 11px;
            appearance: none;
            -webkit-appearance: none;
            cursor: pointer;
        }
        .wpc-select:focus { outline: none; border-color: #7c3aed; }
        .wpc-select-wrap { position: relative; }
        .wpc-select-wrap::after {
            content: '▼';
            font-size: 8px;
            position: absolute;
            right: 10px; top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            opacity: 0.5;
            color: #e2d9f3;
        }
        .wpc-range { accent-color: #7c3aed; width: 100%; }
        .wpc-duration-label { color: #c4b5fd; }

        /* ── Bouton aide ── */
        .wpc-help-btn {
            width: 20px; height: 20px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.07);
            color: #a78bfa;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background .15s;
        }
        .wpc-help-btn:hover { background: rgba(167,139,250,0.2); }

        /* ── Popup aide — positionnée sous le header ── */
        .wpc-help-popup {
            display: none;
            position: absolute;
            top: 34px;
            right: 10px;
            background: #1e1b4b;
            border: 1px solid #3730a3;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            padding: 12px 14px;
            width: 270px;
            font-size: 11px;
            color: #c4b5fd;
            z-index: 20;
            line-height: 1.5;
        }
        .wpc-help-popup.show { display: block; }
        .wpc-help-popup h4 { margin: 0 0 8px; font-size: 12px; font-weight: 800; color: #a78bfa; }
        .wpc-help-section {
            margin-bottom: 7px; padding-bottom: 7px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .wpc-help-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

        /* ── Resize handle ── */
        .wpc-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #555 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .wpc-container:hover .wpc-resize-handle { opacity: 1; }

        .wpc-unit { text-transform: lowercase; }
        `;
        document.head.appendChild(s);
    }
})();

// ── Modes de respiration ──────────────────────────────────────────────────
const WPC_MODES = {
    coherence: { inspire: 5, bloqueIn: 0, expire: 5,  bloqueEx: 0, label: 'Cohérence Cardiaque' },
    carre:     { inspire: 4, bloqueIn: 4, expire: 4,  bloqueEx: 4, label: 'Respiration Carrée'  },
    urgence:   { inspire: 3, bloqueIn: 1, expire: 7,  bloqueEx: 0, label: 'Urgence Calme'       }
};

// ── Créer le widget ───────────────────────────────────────────────────────
function createPauseCalmWidget() {
    // ── DOM widget ────────────────────────────────────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'pause-calme';
    widget.tabIndex = 0;
    widget.style.cssText = 'position:absolute;';

    // Positionnement initial
    const pos = (typeof findFreePosition === 'function')
        ? findFreePosition(370, 440)
        : { left: 60, top: 60 };
    // Le widget s'ouvre à 100px du bord gauche du board.
    widget.style.left = '100px';
    widget.style.top  = pos.top  + 'px';

    // ── Structure du widget (même squelette que widget-monnaie) ──────────
    // Les éléments drag-handle, widget-action-bar, widget-rotate-handle
    // sont injectés par le framework du board via widget.innerHTML.
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

    // ── Contenu principal (construit en JS comme monnaie) ─────────────────
    const container = document.createElement('div');
    container.className = 'wpc-container';
    container.style.width = '420px';

    // ── Header interne : nom + wf-btns (bouton aide inséré avant en JS) ───
    const header = document.createElement('div');
    header.className = 'wpc-header';
    header.innerHTML = `
        <span class="wpc-title">🧘 Pause Calme</span>
        <div class="wf-btns" style="margin-left:auto;">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;

    // Bouton aide inséré avant les wf-btns (comme dans monnaie)
    const helpBtn = document.createElement('button');
    helpBtn.className = 'wpc-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    // Popup aide
    const helpPopup = document.createElement('div');
    helpPopup.className = 'wpc-help-popup';
    helpPopup.innerHTML = `
        <h4>💡 Pause Calme</h4>
        <div class="wpc-help-section">
            <strong style="font-size:10px;text-transform:uppercase;opacity:0.7;">Suivre le guide :</strong><br>
            <span style="font-size:10px;">
                • <b>Cercle qui grossit</b> → Inspirez par le nez<br>
                • <b>Cercle immobile</b> → Retenez doucement<br>
                • <b>Cercle qui rétrécit</b> → Expirez lentement
            </span>
        </div>
        <div class="wpc-help-section">
            <b style="color:#a78bfa;">Cohérence Cardiaque</b><br>
            <span style="font-size:10px;opacity:0.8;">5s inspire / 5s expire. Réduit le stress.</span>
        </div>
        <div class="wpc-help-section">
            <b style="color:#a78bfa;">Respiration Carrée</b><br>
            <span style="font-size:10px;opacity:0.8;">4-4-4-4. Concentration et calme immédiat.</span>
        </div>
        <div class="wpc-help-section">
            <b style="color:#a78bfa;">Urgence Calme</b><br>
            <span style="font-size:10px;opacity:0.8;">3s inspire / 7s expire. Forte émotion ou agitation.</span>
        </div>
        <div style="font-size:9px;opacity:0.6;margin-top:6px;font-style:italic;">Tenez-vous droit, décroisez les jambes, relâchez les épaules.</div>
    `;
    header.appendChild(helpPopup);
    container.appendChild(header);

    // ── Corps central ─────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'wpc-body';
    body.innerHTML = `
        <div class="wpc-session-title" data-role="session-title">Prêt ?</div>
        <div class="wpc-timer" data-role="timer">Durée : 0 <span class="wpc-unit">min</span></div>
        <div class="wpc-circle-wrap">
            <div class="wpc-circle" data-role="circle">
                <span class="wpc-circle-text" data-role="circle-text">...</span>
            </div>
        </div>
    `;
    container.appendChild(body);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'wpc-controls';
    controls.innerHTML = `
        <label class="wpc-music-row">
            <span class="wpc-music-label">♪ Gnossienne n°1 – Satie</span>
            <label class="wpc-switch">
                <input type="checkbox" data-role="toggle-music" checked>
                <span class="wpc-slider"></span>
            </label>
        </label>
        <button class="wpc-btn-main" data-role="btn-main">Commencer</button>
    `;
    container.appendChild(controls);

    // ── Config ────────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'wpc-settings';
    settings.dataset.role = 'settings';
    settings.innerHTML = `
        <div>
            <span class="wpc-label">Type de respiration</span>
            <div class="wpc-select-wrap">
                <select class="wpc-select" data-role="select-type">
                    <option value="coherence">Cohérence cardiaque (5s/5s)</option>
                    <option value="carre">Respiration Carrée (4-4-4-4)</option>
                    <option value="urgence">Urgence Calme (Expiration longue)</option>
                </select>
            </div>
        </div>
        <div>
            <span class="wpc-label">Durée : <span data-role="val-duree" class="wpc-duration-label">2 <span class="wpc-unit">min</span></span></span>
            <input type="range" class="wpc-range" data-role="input-duree" min="0.5" max="5" step="0.5" value="2">
        </div>
    `;
    container.appendChild(settings);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'wpc-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Références DOM ────────────────────────────────────────────────────
    const circle       = container.querySelector('[data-role="circle"]');
    const circleText   = container.querySelector('[data-role="circle-text"]');
    const sessionTitle = container.querySelector('[data-role="session-title"]');
    const timerEl      = container.querySelector('[data-role="timer"]');
    const btnMain      = container.querySelector('[data-role="btn-main"]');
    const selectType   = container.querySelector('[data-role="select-type"]');
    const inputDuree   = container.querySelector('[data-role="input-duree"]');
    const valDuree     = container.querySelector('[data-role="val-duree"]');

    const toggleMusic  = container.querySelector('[data-role="toggle-music"]');

    // ── Mise à l'échelle proportionnelle ──────────────────────────────────
    // Le container a 70px de padding-left. La largeur utile = offsetWidth - 70px.
    // Le cercle occupe ~60% de cette largeur utile, plafonné à 260px.
    const PADDING_LEFT  = 70;
    const CIRCLE_RATIO  = 0.80;
    const MAX_CIRCLE    = 800;

    function applyScale() {
        const usable = Math.max(100, (container.offsetWidth || 420) - PADDING_LEFT);
        const d = Math.min(Math.round(usable * CIRCLE_RATIO), MAX_CIRCLE);
        circle.style.width  = d + 'px';
        circle.style.height = d + 'px';

        // Texte dans le cercle
        circleText.style.fontSize = Math.round(d * 0.13) + 'px';

        // Textes session/timer proportionnels
        const ratio = usable / 350;
        sessionTitle.style.fontSize = Math.min(Math.round(12 * ratio), 15) + 'px';
        timerEl.style.fontSize      = Math.min(Math.round(10 * ratio), 12) + 'px';
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    const audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.innerHTML = `<source src="sons/musique-satie-gnossienne1.mp3" type="audio/mpeg">`;
    widget.appendChild(audio);

    // ── Observateur de redimensionnement ─────────────────────────────────
    // Applique l'échelle à chaque changement de taille du container
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => applyScale());
        ro.observe(container);
    }
    // Applique immédiatement après insertion dans le DOM (via rAF)
    requestAnimationFrame(() => applyScale());

    function audioPlay() {
        if (!toggleMusic.checked) return;
        audio.volume = 0.4;
        const p = audio.play();
        if (p) p.catch(() => {});
    }
    function audioStop() {
        audio.pause();
        audio.currentTime = 0;
    }

    // ── Formatage durée ───────────────────────────────────────────────────
    function formatDuration(minutesDecimal) {
        const totalSeconds = Math.round(minutesDecimal * 60);
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return s === 0
            ? `${m} <span class="wpc-unit">min</span>`
            : `${m} <span class="wpc-unit">min</span> ${s < 10 ? '0' + s : s} <span class="wpc-unit">s</span>`;
    }

    function updateDurationDisplay() {
        valDuree.innerHTML = formatDuration(parseFloat(inputDuree.value));
    }
    updateDurationDisplay();
    inputDuree.addEventListener('input', updateDurationDisplay);

    // ── Respiration ───────────────────────────────────────────────────────
    let isRunning     = false;
    let timerInterval = null;
    let timeLeft      = 0;

    function wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    async function runCycle(mode) {
        if (!isRunning) return;
        // INSPIRE
        circleText.textContent = 'Inspire';
        circle.style.transition = `transform ${mode.inspire}s ease-in-out`;
        circle.style.transform  = 'scale(1.2)';
        await wait(mode.inspire);
        if (!isRunning) return;
        // BLOQUE IN
        if (mode.bloqueIn > 0) {
            circleText.textContent = 'Bloque';
            await wait(mode.bloqueIn);
        }
        if (!isRunning) return;
        // EXPIRE
        circleText.textContent = 'Expire';
        circle.style.transition = `transform ${mode.expire}s ease-in-out`;
        circle.style.transform  = 'scale(0.6)';
        await wait(mode.expire);
        if (!isRunning) return;
        // BLOQUE EX
        if (mode.bloqueEx > 0) {
            circleText.textContent = 'Bloque';
            await wait(mode.bloqueEx);
        }
        if (isRunning) runCycle(mode);
    }

    function startSession() {
        isRunning = true;
        const mode = WPC_MODES[selectType.value];
        timeLeft   = parseFloat(inputDuree.value) * 60;
        audioPlay();
        sessionTitle.textContent = mode.label;
        btnMain.textContent = 'Arrêter';
        settings.classList.add('disabled');
        runCycle(mode);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.innerHTML = `Durée : ${formatDuration(timeLeft / 60)}`;
            if (timeLeft <= 0) stopSession();
        }, 1000);
    }

    function stopSession() {
        isRunning = false;
        clearInterval(timerInterval);
        audioStop();
        btnMain.textContent = 'Commencer';
        sessionTitle.textContent = 'Prêt ?';
        circleText.textContent = '...';
        settings.classList.remove('disabled');
        circle.style.transition = 'transform 0.5s ease-out';
        circle.style.transform  = 'scale(0.6)';
        timerEl.innerHTML = 'Durée : 0 <span class="wpc-unit">min</span>';
    }

    btnMain.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isRunning) stopSession(); else startSession();
    });

    // ── Popup aide ────────────────────────────────────────────────────────
    helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpPopup.classList.toggle('show');
    });
    document.addEventListener('click', () => helpPopup.classList.remove('show'));
    helpPopup.addEventListener('click', e => e.stopPropagation());

    // ── Resize ────────────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            const nw = Math.max(280, startW + ev.clientX - startX);
            const nh = Math.max(240, startH + ev.clientY - startY);
            container.style.width  = nw + 'px';
            container.style.height = nh + 'px';
            applyScale();
        };
        document.onmouseup = () => { document.onmousemove = null; if (typeof saveBoard === 'function') saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            const nw = Math.max(280, startW + t.clientX - startX);
            const nh = Math.max(240, startH + t.clientY - startY);
            container.style.width  = nw + 'px';
            container.style.height = nh + 'px';
            applyScale();
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            if (typeof saveBoard === 'function') saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfMin   = container.querySelector('[data-role="wf-min"]');
    const wfMax   = container.querySelector('[data-role="wf-max"]');
    const wfClose = container.querySelector('[data-role="wf-close"]');

    let _isMax = false;
    let _savedW = null, _savedH = null;

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            window._wfMiniBarCollapse(widget, '🧘 Pause Calme', {
                onExpand: () => {}
            });
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
            stopSession();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Getter/Setter pour save-load ──────────────────────────────────────
    widget._wpcGetData = function() {
        return {
            containerW: container.offsetWidth,
            containerH: container.offsetHeight,
            mode: selectType.value,
            duree: parseFloat(inputDuree.value),
            musicOn: toggleMusic.checked,
            fullboard: container.classList.contains('wf-fullboard')
        };
    };
    widget._wpcSetData = function(d) {
        if (!d) return;
        if (d.mode && selectType.querySelector(`option[value="${d.mode}"]`)) selectType.value = d.mode;
        if (d.duree) { inputDuree.value = d.duree; updateDurationDisplay(); }
        if (d.musicOn !== undefined) toggleMusic.checked = d.musicOn;
        if (d.containerW) container.style.width  = d.containerW + 'px';
        if (d.containerH) container.style.height = d.containerH + 'px';
        if (d.fullboard) container.classList.add('wf-fullboard');
    };

    // ── Init widget dans le board ─────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
        if (typeof bringToFront  === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront  === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
