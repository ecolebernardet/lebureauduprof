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

    // Police arrondie (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const f = document.createElement('link');
        f.id = 'wpc-font';
        f.rel = 'stylesheet';
        f.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(f);
    }

    // CSS spécifique au widget pause-calme
    if (!document.getElementById('wpc-style-v2')) {
        const s = document.createElement('style');
        s.id = 'wpc-style-v2';
        s.textContent = `
        .widget[data-type="pause-calme"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Palette « lac au crépuscule » ── */
        .wpc-container {
            --wpc-ink:     #EAF0FA;
            --wpc-muted:   #9AABC8;
            --wpc-line:    rgba(234,240,250,0.10);
            --wpc-inhale:  #8EC5FF;
            --wpc-hold:    #F2CF8B;
            --wpc-exhale:  #8FE0C0;
            --wpc-idle:    #A9B6D6;
            --wpc-deep:    #13203A;
            --wpc-phase:   var(--wpc-idle);

            background:
                radial-gradient(120% 70% at 50% 38%, rgba(142,197,255,0.10), transparent 70%),
                linear-gradient(172deg, #1C2846 0%, #243557 55%, #2C4066 100%);
            border: 1px solid rgba(234,240,250,0.08);
            border-radius: 22px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            color: var(--wpc-ink);
            box-shadow: 0 22px 48px -18px rgba(6,12,28,0.65), inset 0 1px 0 rgba(255,255,255,0.05);
            position: relative;
            user-select: none;
            overflow: visible;
            width: 420px;
        }
        .wpc-container[data-phase="inspire"] { --wpc-phase: var(--wpc-inhale); }
        .wpc-container[data-phase="hold"]    { --wpc-phase: var(--wpc-hold); }
        .wpc-container[data-phase="expire"],
        .wpc-container[data-phase="done"]    { --wpc-phase: var(--wpc-exhale); }

        /* ── Plein écran board ── */
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
        .wpc-container.wf-fullboard .wpc-settings { border-radius: 0; }

        /* ── Téléphone : plein écran du bouton vert à la hauteur réelle de l'écran (la marge gauche laisse déjà les onglets visibles) ── */
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .wpc-container.wf-fullboard {
                height: 100dvh !important;
            }
        }

        /* ── En-tête ── */
        .wpc-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 14px 16px 4px 18px;
            cursor: move;
            flex-shrink: 0;
            position: relative;
            z-index: 10;
        }
        .wpc-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 700;
            color: var(--wpc-ink);
            pointer-events: none;
        }
        .wpc-title svg { width: 18px; height: 18px; color: var(--wpc-inhale); }

        /* ── Corps ── */
        .wpc-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4px 20px 6px;
            min-height: 0;
        }
        .wpc-session-title {
            font-weight: 700;
            color: var(--wpc-ink);
            white-space: nowrap;
            text-align: center;
            line-height: 1.3;
        }
        .wpc-timer {
            font-weight: 600;
            color: var(--wpc-muted);
            white-space: nowrap;
            text-align: center;
            font-variant-numeric: tabular-nums;
            margin-top: 2px;
        }

        /* ── Le cercle de respiration ── */
        .wpc-circle-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px 0 6px;
            /* width/height posés par JS */
        }
        .wpc-ripple,
        .wpc-circle {
            position: absolute;
            width: 78%;
            height: 78%;
            border-radius: 50%;
            transform: scale(0.55);
            will-change: transform;
        }
        .wpc-ripple {
            border: 1.5px solid var(--wpc-phase);
            opacity: 0.28;
            transition: border-color 1.2s ease;
        }
        .wpc-ripple.r2 { opacity: 0.14; }
        .wpc-circle {
            background-color: var(--wpc-phase);
            background-image:
                radial-gradient(circle at 34% 28%, rgba(255,255,255,0.65), rgba(255,255,255,0) 55%),
                radial-gradient(circle at 70% 80%, rgba(19,32,58,0.18), rgba(19,32,58,0) 60%);
            box-shadow: 0 0 70px -8px var(--wpc-phase), inset 0 -10px 30px rgba(19,32,58,0.12);
            transition: transform 0.5s ease-out, background-color 1.2s ease, box-shadow 1.2s ease;
        }
        .wpc-center {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none;
            color: var(--wpc-deep);
        }
        .wpc-circle-text { font-weight: 700; line-height: 1.1; }
        .wpc-phase-count {
            font-weight: 600;
            opacity: 0.65;
            font-variant-numeric: tabular-nums;
            line-height: 1.1;
            min-height: 1.1em;
        }

        /* ── Contrôles ── */
        .wpc-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 10px 18px;
            padding: 6px 20px 16px;
            flex-shrink: 0;
        }
        .wpc-btn-main {
            font-family: inherit;
            border-radius: 999px;
            border: 1.5px solid transparent;
            font-size: 15px;
            font-weight: 700;
            padding: 10px 30px;
            cursor: pointer;
            background: var(--wpc-inhale);
            color: var(--wpc-deep);
            box-shadow: 0 8px 22px -8px rgba(142,197,255,0.7);
            transition: transform .12s, filter .15s, background-color .2s, color .2s, box-shadow .2s;
        }
        .wpc-btn-main:hover  { filter: brightness(1.06); }
        .wpc-btn-main:active { transform: scale(0.96); }
        .wpc-container.is-running .wpc-btn-main {
            background: transparent;
            color: var(--wpc-ink);
            border-color: rgba(234,240,250,0.28);
            box-shadow: none;
        }
        .wpc-container.is-running .wpc-btn-main:hover { background: rgba(234,240,250,0.06); }

        .wpc-music-row {
            display: flex;
            align-items: center;
            gap: 9px;
            cursor: pointer;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--wpc-muted);
        }
        .wpc-music-row em { font-style: normal; color: var(--wpc-ink); opacity: 0.85; }
        .wpc-switch-input { position: absolute; opacity: 0; width: 0; height: 0; }
        .wpc-switch {
            position: relative;
            width: 34px; height: 20px;
            border-radius: 20px;
            background: rgba(234,240,250,0.16);
            transition: background .25s;
            flex-shrink: 0;
        }
        .wpc-switch::before {
            content: "";
            position: absolute;
            width: 14px; height: 14px;
            left: 3px; top: 3px;
            border-radius: 50%;
            background: #fff;
            transition: transform .25s;
        }
        .wpc-switch-input:checked + .wpc-switch { background: var(--wpc-exhale); }
        .wpc-switch-input:checked + .wpc-switch::before { transform: translateX(14px); }
        .wpc-switch-input:focus-visible + .wpc-switch { outline: 2px solid var(--wpc-inhale); outline-offset: 2px; }

        /* ── Réglages ── */
        .wpc-settings {
            background: rgba(10,18,36,0.28);
            border-top: 1px solid var(--wpc-line);
            padding: 14px 18px 16px;
            flex-shrink: 0;
            transition: opacity 0.3s;
            border-radius: 0 0 22px 22px;
        }
        .wpc-settings.disabled { opacity: 0.35; pointer-events: none; }
        .wpc-settings-inner {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-width: 560px;
            margin: 0 auto;
        }
        .wpc-modes {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }
        .wpc-mode {
            font-family: inherit;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 9px 10px;
            border-radius: 12px;
            border: 1.5px solid var(--wpc-line);
            background: rgba(234,240,250,0.03);
            color: var(--wpc-ink);
            cursor: pointer;
            transition: border-color .2s, background-color .2s;
        }
        .wpc-mode:hover { background: rgba(234,240,250,0.07); }
        .wpc-mode-name { font-size: 12.5px; font-weight: 700; line-height: 1.2; }
        .wpc-mode-rhythm { font-size: 11px; font-weight: 600; color: var(--wpc-muted); font-variant-numeric: tabular-nums; }
        .wpc-mode[aria-checked="true"] {
            border-color: var(--wpc-inhale);
            background: rgba(142,197,255,0.12);
        }
        .wpc-mode[aria-checked="true"] .wpc-mode-rhythm { color: var(--wpc-inhale); }

        .wpc-duration-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--wpc-muted);
            margin-bottom: 8px;
        }
        .wpc-duration-label { color: var(--wpc-ink); font-weight: 700; font-variant-numeric: tabular-nums; }

        .wpc-range {
            --fill: 50%;
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 6px;
            margin: 0;
            border-radius: 6px;
            background: linear-gradient(to right, var(--wpc-inhale) var(--fill), rgba(234,240,250,0.14) var(--fill));
            cursor: pointer;
        }
        .wpc-range::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px; height: 18px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid var(--wpc-inhale);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .wpc-range::-moz-range-thumb {
            width: 12px; height: 12px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid var(--wpc-inhale);
        }
        .wpc-range:focus-visible { outline: 2px solid var(--wpc-inhale); outline-offset: 6px; }

        .wpc-unit { font-weight: 600; }

        .wpc-btn-main:focus-visible,
        .wpc-mode:focus-visible,
        .wpc-help-btn:focus-visible { outline: 2px solid var(--wpc-inhale); outline-offset: 2px; }

        /* ── Aide ── */
        .wpc-help-btn {
            width: 22px; height: 22px;
            border-radius: 50%;
            border: 1px solid rgba(234,240,250,0.2);
            background: transparent;
            color: var(--wpc-muted);
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-right: 4px;
            transition: background .15s, color .15s;
        }
        .wpc-help-btn:hover { background: rgba(234,240,250,0.08); color: var(--wpc-ink); }

        .wpc-help-popup {
            display: none;
            position: absolute;
            top: 42px;
            right: 12px;
            background: #1A2540;
            border: 1px solid rgba(234,240,250,0.12);
            border-radius: 14px;
            box-shadow: 0 16px 36px -10px rgba(0,0,0,0.6);
            padding: 14px 16px;
            width: 280px;
            font-size: 12.5px;
            font-weight: 500;
            color: var(--wpc-muted);
            z-index: 20;
            line-height: 1.5;
            cursor: default;
        }
        .wpc-help-popup.show { display: block; }
        .wpc-help-popup h4 { margin: 0 0 10px; font-size: 14px; font-weight: 700; color: var(--wpc-ink); }
        .wpc-help-guide { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 5px; }
        .wpc-help-guide li { display: flex; align-items: center; gap: 8px; }
        .wpc-help-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .wpc-help-guide b { color: var(--wpc-ink); font-weight: 700; }
        .wpc-help-section { padding: 8px 0; border-top: 1px solid var(--wpc-line); }
        .wpc-help-section b { color: var(--wpc-ink); font-weight: 700; display: block; }
        .wpc-help-tip { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--wpc-line); font-size: 11.5px; }

        /* ── Poignée de redimensionnement ── */
        .wpc-resize-handle {
            position: absolute;
            right: 4px; bottom: 4px;
            width: 16px; height: 16px;
            cursor: se-resize;
            background:
                radial-gradient(circle, rgba(234,240,250,0.45) 1.2px, transparent 1.6px) 0 0 / 5px 5px;
            -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                    mask: linear-gradient(135deg, transparent 50%, #000 50%);
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .wpc-container:hover .wpc-resize-handle { opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
            .wpc-ripple { display: none; }
        }
        `;
        document.head.appendChild(s);
    }
})();

// ── Modes de respiration ──────────────────────────────────────────────────
const WPC_MODES = {
    coherence: { inspire: 5, bloqueIn: 0, expire: 5,  bloqueEx: 0, label: 'Cohérence cardiaque', rhythm: '5 s / 5 s'      },
    carre:     { inspire: 4, bloqueIn: 4, expire: 4,  bloqueEx: 4, label: 'Respiration carrée',  rhythm: '4 / 4 / 4 / 4'  },
    urgence:   { inspire: 3, bloqueIn: 1, expire: 7,  bloqueEx: 0, label: 'Urgence calme',       rhythm: '3 s / 7 s'      }
};

// ── Créer le widget ───────────────────────────────────────────────────────
// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

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

    // ── Contenu principal ─────────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'wpc-container';
    container.dataset.phase = 'idle';
    container.style.width = '420px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'wpc-header';
    header.innerHTML = `
        <span class="wpc-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>
                <path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity=".55"/>
            </svg>
            Pause calme
        </span>
        <div class="wf-btns" style="margin-left:auto;">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;

    const helpBtn = document.createElement('button');
    helpBtn.className = 'wpc-help-btn';
    helpBtn.title = 'Aide';
    helpBtn.textContent = '?';
    const wfBtnsDiv = header.querySelector('.wf-btns');
    wfBtnsDiv.insertBefore(helpBtn, wfBtnsDiv.firstChild);

    const helpPopup = document.createElement('div');
    helpPopup.className = 'wpc-help-popup';
    helpPopup.innerHTML = `
        <h4>Suivre le cercle</h4>
        <ul class="wpc-help-guide">
            <li><span class="wpc-help-dot" style="background:var(--wpc-inhale)"></span><span><b>Il grandit</b> : on inspire par le nez</span></li>
            <li><span class="wpc-help-dot" style="background:var(--wpc-hold)"></span><span><b>Il s'arrête</b> : on retient doucement</span></li>
            <li><span class="wpc-help-dot" style="background:var(--wpc-exhale)"></span><span><b>Il rétrécit</b> : on expire lentement</span></li>
        </ul>
        <div class="wpc-help-section"><b>Cohérence cardiaque</b>5 s pour inspirer, 5 s pour expirer. Fait baisser le stress.</div>
        <div class="wpc-help-section"><b>Respiration carrée</b>4 temps de 4 s. Aide à se concentrer.</div>
        <div class="wpc-help-section"><b>Urgence calme</b>3 s pour inspirer, 7 s pour expirer. Pour une forte émotion ou de l'agitation.</div>
        <div class="wpc-help-tip">Dos droit, jambes décroisées, épaules relâchées.</div>
    `;
    header.appendChild(helpPopup);
    container.appendChild(header);

    // ── Corps central ─────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.className = 'wpc-body';
    body.innerHTML = `
        <div class="wpc-session-title" data-role="session-title">Prêt ?</div>
        <div class="wpc-timer" data-role="timer"></div>
        <div class="wpc-circle-wrap" data-role="circle-wrap">
            <div class="wpc-ripple r2" data-role="ripple2"></div>
            <div class="wpc-ripple r1" data-role="ripple1"></div>
            <div class="wpc-circle" data-role="circle"></div>
            <div class="wpc-center" aria-live="polite">
                <span class="wpc-circle-text" data-role="circle-text">Prêt ?</span>
                <span class="wpc-phase-count" data-role="phase-count"></span>
            </div>
        </div>
    `;
    container.appendChild(body);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'wpc-controls';
    controls.innerHTML = `
        <label class="wpc-music-row" title="Gnossienne n°1, Erik Satie">
            <input type="checkbox" class="wpc-switch-input" data-role="toggle-music" checked>
            <span class="wpc-switch"></span>
            <span>Musique <em>Satie</em></span>
        </label>
        <button class="wpc-btn-main" data-role="btn-main">Commencer</button>
    `;
    container.appendChild(controls);

    // ── Réglages ──────────────────────────────────────────────────────────
    const settings = document.createElement('div');
    settings.className = 'wpc-settings';
    settings.dataset.role = 'settings';
    const modeButtons = Object.entries(WPC_MODES).map(([key, m]) => `
        <button class="wpc-mode" role="radio" data-mode="${key}" aria-checked="false">
            <span class="wpc-mode-name">${m.label}</span>
            <span class="wpc-mode-rhythm">${m.rhythm}</span>
        </button>`).join('');
    settings.innerHTML = `
        <div class="wpc-settings-inner">
            <div class="wpc-modes" role="radiogroup" aria-label="Type de respiration">${modeButtons}</div>
            <select data-role="select-type" hidden>
                <option value="coherence">Cohérence cardiaque</option>
                <option value="carre">Respiration carrée</option>
                <option value="urgence">Urgence calme</option>
            </select>
            <div>
                <div class="wpc-duration-head">
                    <span>Durée</span>
                    <span data-role="val-duree" class="wpc-duration-label"></span>
                </div>
                <input type="range" class="wpc-range" data-role="input-duree" min="0.5" max="5" step="0.5" value="2" aria-label="Durée de la séance">
            </div>
        </div>
    `;
    container.appendChild(settings);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'wpc-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Références DOM ────────────────────────────────────────────────────
    const circleWrap   = container.querySelector('[data-role="circle-wrap"]');
    const circle       = container.querySelector('[data-role="circle"]');
    const ripple1      = container.querySelector('[data-role="ripple1"]');
    const ripple2      = container.querySelector('[data-role="ripple2"]');
    const circleText   = container.querySelector('[data-role="circle-text"]');
    const phaseCount   = container.querySelector('[data-role="phase-count"]');
    const sessionTitle = container.querySelector('[data-role="session-title"]');
    const timerEl      = container.querySelector('[data-role="timer"]');
    const btnMain      = container.querySelector('[data-role="btn-main"]');
    const selectType   = container.querySelector('[data-role="select-type"]');
    const inputDuree   = container.querySelector('[data-role="input-duree"]');
    const valDuree     = container.querySelector('[data-role="val-duree"]');
    const toggleMusic  = container.querySelector('[data-role="toggle-music"]');
    const modeBtns     = Array.from(container.querySelectorAll('.wpc-mode'));

    // ── Mise à l'échelle proportionnelle ──────────────────────────────────
    // Le cercle suit la largeur utile ; en plein écran ou après un
    // redimensionnement vertical, il est aussi limité par la hauteur.
    const CIRCLE_RATIO = 0.82;
    const MAX_CIRCLE   = 720;
    const MIN_CIRCLE   = 120;

    function applyScale() {
        const cs = getComputedStyle(container);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const usable = Math.max(160, (container.clientWidth || 420) - padL - 40);
        let d = Math.min(Math.round(usable * CIRCLE_RATIO), MAX_CIRCLE);

        const constrained = container.classList.contains('wf-fullboard') || !!container.style.height;
        if (constrained) {
            const fixed = header.offsetHeight + controls.offsetHeight + settings.offsetHeight
                        + sessionTitle.offsetHeight + timerEl.offsetHeight + 40;
            d = Math.min(d, container.clientHeight - fixed);
        }
        d = Math.max(MIN_CIRCLE, d);

        circleWrap.style.width  = d + 'px';
        circleWrap.style.height = d + 'px';
        circleText.style.fontSize = Math.round(d * 0.09) + 'px';
        phaseCount.style.fontSize = Math.round(d * 0.065) + 'px';

        const ratio = Math.min(usable / 360, 1.6);
        sessionTitle.style.fontSize = Math.round(17 * ratio) + 'px';
        timerEl.style.fontSize      = Math.round(13 * ratio) + 'px';
    }

    // ── Audio ─────────────────────────────────────────────────────────────
    const audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.innerHTML = `<source src="sons/musique-satie-gnossienne1.mp3" type="audio/mpeg">`;
    widget.appendChild(audio);

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => applyScale());
        ro.observe(container);
    }
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
        if (m === 0) return `${s} <span class="wpc-unit">s</span>`;
        return s === 0
            ? `${m} <span class="wpc-unit">min</span>`
            : `${m} <span class="wpc-unit">min</span> ${s < 10 ? '0' + s : s}`;
    }
    function formatClock(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' + s : s}`;
    }

    function updateDurationDisplay() {
        valDuree.innerHTML = formatDuration(parseFloat(inputDuree.value));
        const min = parseFloat(inputDuree.min), max = parseFloat(inputDuree.max);
        inputDuree.style.setProperty('--fill', ((inputDuree.value - min) / (max - min) * 100) + '%');
        if (!isRunning) timerEl.innerHTML = `Séance de ${formatDuration(parseFloat(inputDuree.value))}`;
    }

    // ── Choix du mode ─────────────────────────────────────────────────────
    function syncModes() {
        modeBtns.forEach(b => b.setAttribute('aria-checked', b.dataset.mode === selectType.value ? 'true' : 'false'));
        if (!isRunning && container.dataset.phase !== 'done') {
            sessionTitle.textContent = WPC_MODES[selectType.value].label;
        }
    }
    modeBtns.forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        selectType.value = b.dataset.mode;
        if (container.dataset.phase === 'done') resetVisual();
        syncModes();
        if (typeof saveBoard === 'function') saveBoard();
    }));

    // ── Respiration ───────────────────────────────────────────────────────
    let isRunning     = false;
    let timerInterval = null;
    let phaseTick     = null;
    let timeLeft      = 0;
    let sessionId     = 0;

    const SCALE_MIN = 0.55;
    const SCALE_MAX = 1.0;

    updateDurationDisplay();
    inputDuree.addEventListener('input', updateDurationDisplay);
    inputDuree.addEventListener('change', () => { if (typeof saveBoard === 'function') saveBoard(); });
    syncModes();

    function wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    // Les deux ondes s'écartent du cercle à l'inspiration et s'y replient à l'expiration
    function setScale(scale, seconds, easing) {
        const t = (seconds || 0) + 's ' + (easing || 'cubic-bezier(.45,0,.55,1)');
        const k = (scale - SCALE_MIN) / (SCALE_MAX - SCALE_MIN);
        circle.style.transition  = `transform ${t}, background-color 1.2s ease, box-shadow 1.2s ease`;
        ripple1.style.transition = `transform ${t}, border-color 1.2s ease`;
        ripple2.style.transition = `transform ${t}, border-color 1.2s ease`;
        circle.style.transform  = `scale(${scale})`;
        ripple1.style.transform = `scale(${scale * (1 + 0.10 * k)})`;
        ripple2.style.transform = `scale(${scale * (1 + 0.20 * k)})`;
    }

    function setPhase(kind, label, seconds, scale) {
        container.dataset.phase = kind;
        circleText.textContent = label;
        if (scale != null) setScale(scale, seconds);
        clearInterval(phaseTick);
        let n = seconds;
        phaseCount.textContent = n;
        phaseTick = setInterval(() => {
            n--;
            if (n > 0) phaseCount.textContent = n;
            else clearInterval(phaseTick);
        }, 1000);
    }

    async function runCycle(mode, id) {
        const alive = () => isRunning && id === sessionId;
        while (alive()) {
            setPhase('inspire', 'Inspire', mode.inspire, SCALE_MAX);
            await wait(mode.inspire);
            if (!alive()) return;
            if (mode.bloqueIn > 0) {
                setPhase('hold', 'Retiens', mode.bloqueIn, null);
                await wait(mode.bloqueIn);
                if (!alive()) return;
            }
            setPhase('expire', 'Expire', mode.expire, SCALE_MIN);
            await wait(mode.expire);
            if (!alive()) return;
            if (mode.bloqueEx > 0) {
                setPhase('hold', 'Retiens', mode.bloqueEx, null);
                await wait(mode.bloqueEx);
            }
        }
    }

    function startSession() {
        isRunning = true;
        const id = ++sessionId;
        const mode = WPC_MODES[selectType.value];
        timeLeft   = Math.round(parseFloat(inputDuree.value) * 60);
        audioPlay();
        container.classList.add('is-running');
        sessionTitle.textContent = mode.label;
        timerEl.textContent = formatClock(timeLeft);
        btnMain.textContent = 'Arrêter';
        settings.classList.add('disabled');
        runCycle(mode, id);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = formatClock(Math.max(0, timeLeft));
            if (timeLeft <= 0) stopSession(true);
        }, 1000);
    }

    function resetVisual() {
        container.dataset.phase = 'idle';
        circleText.textContent = 'Prêt ?';
        sessionTitle.textContent = WPC_MODES[selectType.value].label;
        updateDurationDisplay();
    }

    function stopSession(finished) {
        sessionId++;
        isRunning = false;
        clearInterval(timerInterval);
        clearInterval(phaseTick);
        audioStop();
        container.classList.remove('is-running');
        btnMain.textContent = 'Commencer';
        settings.classList.remove('disabled');
        phaseCount.textContent = '';
        setScale(SCALE_MIN, 0.8, 'ease-out');
        if (finished === true) {
            container.dataset.phase = 'done';
            sessionTitle.textContent = 'Séance terminée';
            circleText.textContent = 'Bravo';
            timerEl.innerHTML = `Séance de ${formatDuration(parseFloat(inputDuree.value))}`;
        } else {
            resetVisual();
        }
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
    helpPopup.addEventListener('mousedown', e => e.stopPropagation());
    helpPopup.addEventListener('pointerdown', e => e.stopPropagation());

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

    // Au doigt, en plein écran : un appui dans le widget ne doit pas remonter
    // jusqu'au tableau (qui le prendrait pour un déplacement et annulerait le clic)
    {
        const stopInMax = (e) => { if (_isMax) e.stopPropagation(); };
        container.addEventListener('touchstart',  stopInMax, { passive: true });
        container.addEventListener('pointerdown', stopInMax);
        container.addEventListener('mousedown',   stopInMax);
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
            // En plein écran, on enregistre la taille normale du cadre (pas celle de l'écran)
            containerW: _isMax ? (parseFloat(_savedW) || 420) : container.offsetWidth,
            containerH: _isMax ? (parseFloat(_savedH) || container.offsetHeight) : container.offsetHeight,
            mode: selectType.value,
            duree: parseFloat(inputDuree.value),
            musicOn: toggleMusic.checked,
            fullboard: container.classList.contains('wf-fullboard')
        };
    };
    widget._wpcSetData = function(d) {
        if (!d) return;
        if (d.mode && selectType.querySelector(`option[value="${d.mode}"]`)) { selectType.value = d.mode; syncModes(); }
        if (d.duree) { inputDuree.value = d.duree; updateDurationDisplay(); }
        if (d.musicOn !== undefined) toggleMusic.checked = d.musicOn;
        if (d.containerW) container.style.width  = d.containerW + 'px';
        if (d.containerH) container.style.height = d.containerH + 'px';
        if (d.fullboard) container.classList.add('wf-fullboard');
    };

    // ── Init widget dans le board ─────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.closest('input, button, select, label')) return;
        if (typeof bringToFront  === 'function') bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    if (typeof bringToFront  === 'function') bringToFront(widget);
    if (typeof makeDraggable === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate === 'function') makeDraggableRotate(widget);

    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && !_isMax) wfMax.click();

    if (typeof saveBoard === 'function') saveBoard();
    return widget;
}
