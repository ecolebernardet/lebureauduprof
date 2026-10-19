// =========================================================================
// WIDGET PLAN — Le Bureau du Prof
// Affiche un plan de classe interactif avec tables/meubles déplaçables.
// Basé sur outils_plan.html, intégré dans le même système widget que
// widget-monnaie.js.
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        const fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }
    // Taille des pastilles fenêtre (identique aux autres widgets)
    if (!document.getElementById('wf-btns-size')) {
        const wz = document.createElement('style');
        wz.id = 'wf-btns-size';
        wz.textContent = `
    .wf-btns { gap:8px !important; }
    .wf-btns .wf-btn { width:22px !important; height:22px !important;
        min-width:22px !important; min-height:22px !important; padding:0 !important; }
    .wf-btns:hover .wf-btn::after       { font-size:14px !important; }
    .wf-btns:hover .wf-btn-max::after   { font-size:12px !important; }
    .wf-btns:hover .wf-btn-close::after { font-size:17px !important; }
        `;
        document.head.appendChild(wz);
    }

    // Fonction utilitaire mini-barre collapse (injectée une seule fois)
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

    // CSS partagé boutons fenêtre (injecté une seule fois)
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

    // CSS spécifique au widget plan (injecté une seule fois)
    if (!document.getElementById('plan-widget-style')) {
        const s = document.createElement('style');
        s.id = 'plan-widget-style';
        s.textContent = `
        /* ═══ Nouveau graphisme (même charte que Tirage / Équipes / Liste) ═══ */
        .widget[data-type="plan"],
        .widget[data-type="plan"]:focus-within {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        /* ── Cadre coloré ── */
        .plan-container {
            --pw-ink:   #14202E;
            --pw-glass: rgba(255,255,255,0.62);
            --pw-bg:    #7FD6A6;
            --pw-op:    #23915A;
            background-color: var(--pw-bg);
            background-image:
                radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
                radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
            border: none;
            border-radius: 24px;
            padding: 0 16px 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            color: var(--pw-ink);
            box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
            position: relative;
            user-select: none;
            overflow: hidden;
            container-type: inline-size;
            transition: background-color .3s;
        }
        .widget[data-type="plan"]:hover .plan-container,
        .widget[data-type="plan"]:focus-within .plan-container {
            outline: 2px dashed rgba(20,32,46,0.35);
            outline-offset: 2px;
        }
        /* ── En-tête : deux pastilles « verre » ── */
        .plan-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 14px 0 0;
            flex-shrink: 0;
            cursor: move;
            user-select: none;
            border: none;
            background: transparent;
        }
        .plan-title, .plan-tools, .plan-glass {
            background: var(--pw-glass);
            -webkit-backdrop-filter: blur(8px);
                    backdrop-filter: blur(8px);
            box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
        }
        .plan-title, .plan-tools {
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 999px;
        }
        .plan-title {
            padding: 7px 16px 7px 12px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0;
            color: var(--pw-ink);
            white-space: nowrap;
            overflow: hidden;
            min-width: 0;
            pointer-events: none;
        }
        .plan-title span { overflow: hidden; text-overflow: ellipsis; }
        .plan-title svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--pw-op); }
        .plan-tools { padding: 5px 12px 5px 6px; gap: 2px; flex-shrink: 0; }
        @container (max-width: 460px) { .plan-title span { display: none; } .plan-title { padding: 7px 10px; } }
        .plan-icon-btn {
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; border: none; background: transparent;
            color: var(--pw-ink); cursor: pointer; padding: 0;
            transition: background .15s;
        }
        .plan-icon-btn svg { width: 18px; height: 18px; }
        .plan-icon-btn:hover, .plan-icon-btn.is-on { background: rgba(20,32,46,0.12); }
        .plan-hsep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }
        /* ── Panneau « Couleur du cadre » ── */
        .plan-pop {
            display: none;
            position: absolute; top: 62px; right: 16px; z-index: 400;
            width: 250px; max-width: calc(100% - 32px);
            box-sizing: border-box;
            flex-direction: column; gap: 10px;
            padding: 14px 16px;
            border-radius: 16px;
            background: rgba(255,255,255,0.96);
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            color: var(--pw-ink);
            cursor: default;
        }
        .plan-pop.show { display: flex; }
        .plan-pop-title { font-size: 13px; font-weight: 700; }
        .plan-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
        .plan-swatch {
            width: 28px; height: 28px; border-radius: 50%;
            border: 2px solid rgba(20,32,46,0.15); padding: 0; cursor: pointer;
        }
        .plan-swatch.is-on { border-color: var(--pw-ink); box-shadow: 0 0 0 2px #fff inset; }
        /* ── Plein écran : marge à gauche pour laisser visibles les onglets des panneaux ── */
        .plan-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            left: 40px !important;
            width: calc(100vw - 40px) !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            outline: none !important;
        }
        @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
            .plan-container.wf-fullboard { height: 100dvh !important; padding: 0 10px 10px; }
        }

        /* ── Barre d'outils (pastille « verre ») ── */
        .plan-toolbar {
            display: flex;
            gap: 3px;
            align-items: center;
            flex-wrap: wrap;
            padding: 4px;
            border-radius: 18px;
            flex-shrink: 0;
        }
        .plan-btn {
            min-width: 32px;
            height: 32px;
            padding: 0 10px;
            justify-content: center;
            border-radius: 999px;
            border: none;
            font-size: 14px;
            font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            background: transparent;
            color: var(--pw-ink);
            transition: background .15s, transform .1s;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .plan-btn:active { transform: scale(0.94); }
        .plan-btn:hover { background: rgba(20,32,46,0.08); }
        .plan-btn:disabled { opacity: 0.3; pointer-events: none; }
        .plan-btn-lock-active { background: var(--pw-op); color: #fff; box-shadow: 0 2px 0 rgba(0,0,0,0.2); }
        .plan-btn-lock-active:hover { background: var(--pw-op); filter: brightness(1.1); }
        .plan-btn-danger { color: #C0392B; }
        .plan-btn-danger:hover { background: rgba(192,57,43,0.1); }
        .plan-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); flex-shrink: 0; margin: 0 3px; }
        .plan-info {
            font-size: 12px;
            font-weight: 700;
            color: rgba(20,32,46,0.6);
            margin-left: auto;
            padding: 0 10px;
            white-space: nowrap;
        }

        /* ── Zone du plan (zone blanche arrondie) ── */
        .plan-svg-zone {
            flex: 1;
            background: rgba(255,255,255,0.94);
            border: none;
            border-radius: 18px;
            box-shadow: inset 0 2px 8px rgba(10,20,35,0.08);
            overflow: hidden;
            position: relative;
            min-height: 200px;
        }
        .plan-svg-zone svg { display: block; width: 100%; height: 100%; touch-action: none; }

        /* ── Éléments du plan ── */
        .plan-desk-group { cursor: grab; }
        .plan-desk-group:active { cursor: grabbing; }
        .plan-desk-group.plan-locked { cursor: default; }
        .plan-desk-rect { stroke: rgba(0,0,0,0.25); stroke-width: 2; }
        .plan-desk-group.plan-selected .plan-desk-rect { stroke: var(--pw-op); stroke-width: 6; }
        .plan-desk-group.plan-swap-pending .plan-desk-rect { stroke: #f97316; stroke-width: 7; }
        .plan-desk-label {
            fill: #000;
            font-size: 28px;
            font-weight: 700;
            text-anchor: middle;
            dominant-baseline: middle;
            pointer-events: none;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
            text-transform: uppercase;
        }
        .plan-desk-label-light { fill: #fff; }
        .plan-chair-rect { fill: #2e7d32; }

        /* ── Contrôles zoom ── */
        .plan-zoom-ctrl { position: absolute; right: 6px; bottom: 6px; display: flex; flex-direction: column; gap: 4px; z-index: 10; }
        .plan-zoom-btn {
            width: 30px; height: 30px;
            border-radius: 50%;
            border: none;
            background: #fff;
            font-size: 14px; font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 6px -2px rgba(10,20,35,0.35);
            transition: background .12s;
        }
        .plan-zoom-btn:hover { background: #f4f6f9; }

        /* ── Menu « Ajouter » ── */
        .plan-add-menu {
            display: none;
            position: absolute;
            top: 40px;
            left: 0;
            background: rgba(255,255,255,0.97);
            border: none;
            border-radius: 16px;
            padding: 6px;
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            z-index: 200;
            flex-direction: column;
            gap: 2px;
            min-width: 150px;
        }
        .plan-add-menu.show { display: flex; }
        .plan-add-menu-item {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            font-size: 13px; font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            border: none;
            background: transparent;
            color: var(--pw-ink);
            text-align: left;
        }
        .plan-add-menu-item:hover { background: rgba(20,32,46,0.07); }

        /* ── Modales (ajout d'un élève, modification) ── */
        .plan-modal-overlay {
            --pw-ink: #14202E; --pw-op: #23915A;
            display: none;
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(10,20,35,0.35);
            -webkit-backdrop-filter: blur(4px);
                    backdrop-filter: blur(4px);
            align-items: center;
            justify-content: center;
            font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        }
        .plan-modal-overlay.show { display: flex; }
        .plan-modal-box {
            background: rgba(255,255,255,0.98);
            border-radius: 20px;
            padding: 22px;
            width: 300px;
            max-width: 92vw;
            box-sizing: border-box;
            box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
            color: var(--pw-ink);
        }
        .plan-modal-box h3 { margin: 0 0 14px; font-size: 16px; font-weight: 700; color: var(--pw-ink); text-align: center; }
        .plan-modal-box label { color: rgba(20,32,46,0.55) !important; }
        .plan-modal-input {
            width: 100%;
            box-sizing: border-box;
            padding: 9px 14px;
            border: 1.5px solid rgba(20,32,46,0.12);
            border-radius: 999px;
            background: #F4F6F9;
            font-size: 14px;
            font-weight: 600;
            font-family: inherit;
            color: var(--pw-ink);
            outline: none;
            margin-bottom: 14px;
            transition: border-color .2s, background .2s;
        }
        .plan-modal-input:focus { border-color: var(--pw-op); background: #fff; }
        .plan-edit-color-hex { border-radius: 999px !important; padding: 6px 12px !important; font-family: inherit; }
        .plan-edit-color-hex:focus { border-color: var(--pw-op) !important; }
        .plan-modal-btns { display: flex; gap: 8px; }
        .plan-modal-cancel, .plan-modal-ok, .plan-edit-cancel, .plan-edit-ok {
            flex: 1;
            padding: 9px;
            border-radius: 999px;
            border: none;
            font-size: 13px;
            font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            transition: background .15s, filter .15s, transform .1s;
        }
        .plan-modal-cancel, .plan-edit-cancel { background: rgba(20,32,46,0.08); color: var(--pw-ink); }
        .plan-modal-cancel:hover, .plan-edit-cancel:hover { background: rgba(20,32,46,0.15); }
        .plan-modal-ok, .plan-edit-ok { background: var(--pw-op); color: #fff; }
        .plan-modal-ok:hover, .plan-edit-ok:hover { filter: brightness(1.1); }
        .plan-modal-btns button:active { transform: scale(0.96); }

        /* ── Poignée de redimensionnement ── */
        .plan-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 20px; height: 20px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, rgba(20,32,46,0.35) 50%);
            border-radius: 0 0 24px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .plan-container:hover .plan-resize-handle { opacity: 1; }

        /* ── État réduit ── */
        .plan-container.wf-minimized > *:not(.plan-header) { display: none !important; }
        .plan-container.wf-minimized { gap: 0; }
        `;
        document.head.appendChild(s);
    }
})();


// Couleurs du cadre (mêmes que Tirage / Équipes / Liste de classe / Minuteur)
const PLAN_THEMES = {
    bleu:   { name: 'Bleu',    bg: '#8EC5F2', op: '#2F6FB3' },
    vert:   { name: 'Vert',    bg: '#7FD6A6', op: '#23915A' },
    jaune:  { name: 'Jaune',   bg: '#F6D86A', op: '#B9770E' },
    rose:   { name: 'Rose',    bg: '#F4A9C0', op: '#C2456E' },
    violet: { name: 'Violet',  bg: '#C2B2F0', op: '#6A4FC2' },
    gris:   { name: 'Gris',    bg: '#D4DAE2', op: '#4A5868' },
    noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
};
const PLAN_DEFAULT_THEME = 'vert';
const PLAN_ICON_PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="7" r="1.2" fill="currentColor" stroke="none"/></svg>';
const PLAN_ICON_HELP    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';
const PLAN_ICON_TITLE   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M7.5 7h9"/><rect x="6.5" y="11" width="4" height="2.6" rx=".8"/><rect x="13.5" y="11" width="4" height="2.6" rx=".8"/><rect x="6.5" y="16" width="4" height="2.6" rx=".8"/><rect x="13.5" y="16" width="4" height="2.6" rx=".8"/></svg>';

// ── Constantes plan ───────────────────────────────────────────────────────
const PLAN_SVG_NS = "http://www.w3.org/2000/svg";

const PLAN_COULEURS = {
    'CP':     '#ec4899',
    'CE1':    '#3b82f6',
    'CE2':    '#eab308',
    'CM1':    '#ef4444',
    'CM2':    '#22c55e',
    'AUTRE':  '#A58F88',
    'PROF':   '#77615A',
    'MEUBLE': '#8d6e63',
    'PORTE':  '#577A72',
    'TABLEAU':'#1D6353',
};

const PLAN_DIMS = {
    DESK_W:   180,
    DESK_H:   100,
    PROF_W:   360,
    PROF_H:   180,
    MEUBLE_W: 320,
    MEUBLE_H:  80,
    DOOR_W:   200,
    DOOR_H:    40,
    BOARD_W:  900,
    BOARD_H:   40,
};

// ── Création du widget ────────────────────────────────────────────────────
// Sur téléphone, un widget ouvert par l'utilisateur démarre en plein écran
// (bouton vert) — pas lors de la restauration d'un tableau enregistré.
function _wfIsPhoneLaunch() {
    if (window.isInitialLoading || window.isRestoringState) return false;
    if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
    return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
}

function createPlanWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'plan';
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

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'plan-container';

    // Taille initiale
    const initW = Math.min(Math.round(window.innerWidth * 0.75), 800);
    const initH = Math.round(initW * 0.75);
    container.style.width  = initW + 'px';
    container.style.height = initH + 'px';

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'plan-header';
    header.innerHTML = `
        <div class="plan-title">${PLAN_ICON_TITLE}<span>Plan de classe</span></div>
        <div class="plan-tools">
            <button class="plan-icon-btn plan-theme-btn" title="Couleur du cadre">${PLAN_ICON_PALETTE}</button>
            <span class="plan-hsep"></span>
            <div class="wf-btns">
                <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
                <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
            </div>
        </div>
    `;
    container.appendChild(header);

    // ── Barre d'outils ────────────────────────────────────────────────────
    const toolbar = document.createElement('div');
    toolbar.className = 'plan-toolbar plan-glass';

    // Bouton verrouiller
    const btnLock = document.createElement('button');
    btnLock.className = 'plan-btn';
    btnLock.title = 'Verrouiller / Déverrouiller le plan';
    btnLock.innerHTML = '🔓';

    // Bouton undo / redo
    const btnUndo = document.createElement('button');
    btnUndo.className = 'plan-btn';
    btnUndo.title = 'Annuler (Ctrl+Z)';
    btnUndo.textContent = '↶';
    btnUndo.disabled = true;

    const btnRedo = document.createElement('button');
    btnRedo.className = 'plan-btn';
    btnRedo.title = 'Rétablir';
    btnRedo.textContent = '↷';
    btnRedo.disabled = true;

    // Bouton ajouter (avec sous-menu)
    const addWrapper = document.createElement('div');
    addWrapper.style.position = 'relative';

    const btnAdd = document.createElement('button');
    btnAdd.className = 'plan-btn';
    btnAdd.title = 'Ajouter un élément';
    btnAdd.textContent = '➕';

    const addMenu = document.createElement('div');
    addMenu.className = 'plan-add-menu';

    const addMenuItems = [
        { emoji: '🪑', label: 'Élève',   action: 'eleve'   },
        { emoji: '👨‍🏫', label: 'Bureau prof', action: 'prof' },
        { emoji: '⬛', label: 'Tableau',  action: 'tableau' },
        { emoji: '🗄️', label: 'Meuble',   action: 'meuble'  },
        { emoji: '🚪', label: 'Porte',    action: 'porte'   },
    ];
    addMenuItems.forEach(it => {
        const btn = document.createElement('button');
        btn.className = 'plan-add-menu-item';
        btn.innerHTML = `<span>${it.emoji}</span><span>${it.label}</span>`;
        btn.dataset.action = it.action;
        addMenu.appendChild(btn);
    });

    addWrapper.appendChild(btnAdd);
    addWrapper.appendChild(addMenu);

    const btnDelete = document.createElement('button');
    btnDelete.className = 'plan-btn plan-btn-danger';
    btnDelete.title = 'Supprimer l\'élément sélectionné';
    btnDelete.textContent = '🧽';
    btnDelete.disabled = true;

    // Séparateur + importer liste + export/import JSON + tout effacer
    const sep1 = document.createElement('div');
    sep1.className = 'plan-sep';

    // Bouton import liste élèves
    const btnImport = document.createElement('button');
    btnImport.className = 'plan-btn';
    btnImport.title = 'Importer "Ma Classe" (mémorisée) ou un fichier élèves .txt/.csv';
    btnImport.textContent = '📂';

    // Input fichier élèves caché
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.csv';
    fileInput.style.display = 'none';
    container.appendChild(fileInput);

    // Séparateur 2
    const sep2 = document.createElement('div');
    sep2.className = 'plan-sep';

    // Bouton export JSON
    const btnExportJson = document.createElement('button');
    btnExportJson.className = 'plan-btn';
    btnExportJson.title = 'Sauvegarder le plan en fichier JSON';
    btnExportJson.textContent = '💾';

    // Bouton import JSON
    const btnImportJson = document.createElement('button');
    btnImportJson.className = 'plan-btn';
    btnImportJson.title = 'Charger un plan depuis un fichier JSON';
    btnImportJson.textContent = '📤';

    // Input fichier JSON caché
    const fileInputJson = document.createElement('input');
    fileInputJson.type = 'file';
    fileInputJson.accept = '.json';
    fileInputJson.style.display = 'none';
    container.appendChild(fileInputJson);

    const btnClear = document.createElement('button');
    btnClear.className = 'plan-btn plan-btn-danger';
    btnClear.title = 'Vider tout le plan';
    btnClear.textContent = '🗑️';

    // Séparateur + bouton miroir (retourner le plan haut/bas)
    const sepFlip = document.createElement('div');
    sepFlip.className = 'plan-sep';

    const btnFlip = document.createElement('button');
    btnFlip.className = 'plan-btn';
    btnFlip.title = 'Retourner le plan (vue depuis le mur opposé)';
    btnFlip.textContent = '🪞';

    // Séparateur + boutons zoom
    const sep3 = document.createElement('div');
    sep3.className = 'plan-sep';

    const btnZoomIn = document.createElement('button');
    btnZoomIn.className = 'plan-btn';
    btnZoomIn.title = 'Zoom +';
    btnZoomIn.textContent = '＋';

    const btnZoomReset = document.createElement('button');
    btnZoomReset.className = 'plan-btn';
    btnZoomReset.title = 'Zoom 1:1';
    btnZoomReset.style.fontSize = '11px';
    btnZoomReset.textContent = '1:1';

    const btnZoomOut = document.createElement('button');
    btnZoomOut.className = 'plan-btn';
    btnZoomOut.title = 'Zoom −';
    btnZoomOut.textContent = '－';

    // Séparateur + export image
    const sep4 = document.createElement('div');
    sep4.className = 'plan-sep';

    const btnExportPng = document.createElement('button');
    btnExportPng.className = 'plan-btn';
    btnExportPng.title = 'Exporter le plan en image PNG';
    btnExportPng.textContent = '🖼️';

    const btnExportPdf = document.createElement('button');
    btnExportPdf.className = 'plan-btn';
    btnExportPdf.title = 'Exporter le plan en PDF';
    btnExportPdf.textContent = 'PDF';

    // Compteur
    const infoEl = document.createElement('span');
    infoEl.className = 'plan-info';
    infoEl.textContent = '0 élève';

    toolbar.appendChild(btnLock);
    toolbar.appendChild(btnUndo);
    toolbar.appendChild(btnRedo);
    toolbar.appendChild(addWrapper);
    toolbar.appendChild(btnDelete);
    toolbar.appendChild(sep1);
    toolbar.appendChild(btnImport);
    toolbar.appendChild(sep2);
    toolbar.appendChild(btnExportJson);
    toolbar.appendChild(btnImportJson);
    toolbar.appendChild(btnClear);
    toolbar.appendChild(sepFlip);
    toolbar.appendChild(btnFlip);
    toolbar.appendChild(sep3);
    toolbar.appendChild(btnZoomIn);
    toolbar.appendChild(btnZoomReset);
    toolbar.appendChild(btnZoomOut);
    toolbar.appendChild(sep4);
    toolbar.appendChild(btnExportPng);
    toolbar.appendChild(btnExportPdf);
    toolbar.appendChild(infoEl);
    container.appendChild(toolbar);

    // ── Zone SVG ──────────────────────────────────────────────────────────
    const svgZone = document.createElement('div');
    svgZone.className = 'plan-svg-zone';
    svgZone.style.flex = '1';

    const svg = document.createElementNS(PLAN_SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1800 1800');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    // Crucial pour le stylet et le tactile : désactiver le scroll natif sur le SVG
    svg.style.touchAction = 'none';

    const mainLayer = document.createElementNS(PLAN_SVG_NS, 'g');
    mainLayer.id = 'plan-layer-' + Date.now();
    svg.appendChild(mainLayer);
    svgZone.appendChild(svg);
    container.appendChild(svgZone);

    function _positionZoomBtns() {} // no-op, plus utilisé

    // ── Poignée resize ────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'plan-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Modal ajout élève ─────────────────────────────────────────────────
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'plan-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="plan-modal-box">
            <h3>🪑 Nouvelle table</h3>
            <input class="plan-modal-input" type="text" placeholder="Prénom de l'élève" maxlength="30">
            <div class="plan-modal-btns">
                <button class="plan-modal-cancel">Annuler</button>
                <button class="plan-modal-ok">Ajouter</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const modalInput  = modalOverlay.querySelector('.plan-modal-input');
    const modalOk     = modalOverlay.querySelector('.plan-modal-ok');
    const modalCancel = modalOverlay.querySelector('.plan-modal-cancel');

    // ── Modal édition (nom + couleur) ─────────────────────────────────────
    const editOverlay = document.createElement('div');
    editOverlay.className = 'plan-modal-overlay';
    editOverlay.innerHTML = `
        <div class="plan-modal-box" style="width:320px;">
            <h3 class="plan-edit-title">✏️ Modifier</h3>

            <label style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Nom</label>
            <input class="plan-edit-input plan-modal-input" type="text" placeholder="Prénom / libellé" maxlength="30" style="margin-top:4px;margin-bottom:14px;">

            <label style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Couleur</label>
            <div class="plan-edit-colors" style="margin-top:6px;margin-bottom:6px;display:flex;flex-wrap:wrap;gap:7px;"></div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
                <input class="plan-edit-color-hex" type="text" maxlength="7"
                    style="flex:1;padding:5px 8px;border:1.5px solid #e0e0e0;border-radius:7px;font-size:12px;font-weight:600;outline:none;">
                <input class="plan-edit-color-native" type="color"
                    style="width:34px;height:30px;border:1.5px solid #e0e0e0;border-radius:7px;padding:2px;cursor:pointer;background:none;">
                <div class="plan-edit-color-preview"
                    style="width:30px;height:30px;border-radius:7px;border:2px solid #e0e0e0;flex-shrink:0;"></div>
            </div>

            <div class="plan-modal-btns">
                <button class="plan-edit-cancel">Annuler</button>
                <button class="plan-edit-ok">Valider</button>
            </div>
        </div>
    `;
    document.body.appendChild(editOverlay);

    // ── Couleur du cadre (palette, mémorisée dans la sauvegarde du tableau) ──
    const planThemeBtn = container.querySelector('.plan-theme-btn');
    const planPop = document.createElement('div');
    planPop.className = 'plan-pop';
    planPop.innerHTML = '<div class="plan-pop-title">Couleur du cadre</div><div class="plan-swatches">' +
        Object.keys(PLAN_THEMES).map(id =>
            '<button class="plan-swatch" data-theme="' + id + '" title="' + PLAN_THEMES[id].name +
            '" style="background:' + PLAN_THEMES[id].bg + '"></button>').join('') + '</div>';
    container.appendChild(planPop);
    function planApplyTheme(id) {
        if (!PLAN_THEMES[id]) id = PLAN_DEFAULT_THEME;
        widget.dataset.planTheme = id;
        [container, modalOverlay, editOverlay].forEach(el => {
            if (!el) return;
            el.style.setProperty('--pw-bg', PLAN_THEMES[id].bg);
            el.style.setProperty('--pw-op', PLAN_THEMES[id].op);
        });
        planPop.querySelectorAll('.plan-swatch').forEach(b => b.classList.toggle('is-on', b.dataset.theme === id));
        
    }
    widget._planApplyTheme = planApplyTheme;
    planThemeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    planThemeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !planPop.classList.contains('show');
        planPop.classList.toggle('show', open);
        planThemeBtn.classList.toggle('is-on', open);
    });
    planPop.addEventListener('mousedown', (e) => e.stopPropagation());
    planPop.addEventListener('click', (e) => e.stopPropagation());
    planPop.querySelectorAll('.plan-swatch').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        planApplyTheme(b.dataset.theme);
        if (typeof saveBoard === 'function') saveBoard();
    }));
    document.addEventListener('click', () => { planPop.classList.remove('show'); planThemeBtn.classList.remove('is-on'); });
    planApplyTheme(widget.dataset.planTheme || PLAN_DEFAULT_THEME);

    // Palette de couleurs pour le picker
    const EDIT_PALETTE = [
        '#ef4444','#f97316','#eab308','#22c55e','#14b8a6',
        '#3b82f6','#8b5cf6','#ec4899','#f43f5e','#10b981',
        '#0ea5e9','#a855f7','#77615A','#8d6e63','#577A72',
        '#1D6353','#A58F88','#374151','#6b7280','#ffffff',
    ];

    const editColorGrid  = editOverlay.querySelector('.plan-edit-colors');
    const editInput      = editOverlay.querySelector('.plan-edit-input');
    const editHex        = editOverlay.querySelector('.plan-edit-color-hex');
    const editNative     = editOverlay.querySelector('.plan-edit-color-native');
    const editPreview    = editOverlay.querySelector('.plan-edit-color-preview');
    const editOk         = editOverlay.querySelector('.plan-edit-ok');
    const editCancel     = editOverlay.querySelector('.plan-edit-cancel');

    let editCurrentColor = '#A58F88';

    // Construire la grille de couleurs
    EDIT_PALETTE.forEach(c => {
        const swatch = document.createElement('div');
        swatch.dataset.color = c;
        swatch.style.cssText = `width:24px;height:24px;border-radius:6px;background:${c};cursor:pointer;border:2px solid transparent;transition:transform .1s,border-color .1s;flex-shrink:0;`;
        swatch.addEventListener('click', () => setEditColor(c));
        swatch.addEventListener('mouseenter', () => { swatch.style.transform = 'scale(1.2)'; });
        swatch.addEventListener('mouseleave', () => { swatch.style.transform = ''; });
        editColorGrid.appendChild(swatch);
    });

    function setEditColor(c) {
        editCurrentColor = c;
        editHex.value    = c;
        editNative.value = c;
        editPreview.style.background = c;
        // Highlight swatch actif
        editColorGrid.querySelectorAll('div').forEach(sw => {
            const isActive = sw.dataset.color && sw.dataset.color.toLowerCase() === c.toLowerCase();
            sw.style.borderColor = isActive ? '#374151' : 'transparent';
            sw.style.transform   = isActive ? 'scale(1.15)' : '';
        });
    }

    editHex.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(editHex.value)) setEditColor(editHex.value);
    });
    editNative.addEventListener('input', () => setEditColor(editNative.value));

    // Ouvre la modale et pré-remplit avec les données de l'élément sélectionné
    function openEditModal() {
        if (selectedIndex === null) return;
        const s = planData[selectedIndex];
        editInput.value = s.name || '';
        const col = s.color || PLAN_COULEURS[s.niveau] || '#A58F88';
        setEditColor(col);
        editOverlay.classList.add('show');
        setTimeout(() => { editInput.focus(); editInput.select(); }, 80);
    }

    editOk.addEventListener('click', () => {
        if (selectedIndex !== null) {
            pushHistory();
            const n = editInput.value.trim();
            if (n) planData[selectedIndex].name  = n.toUpperCase();
            planData[selectedIndex].color = editCurrentColor;
            syncAndSave();
        }
        editOverlay.classList.remove('show');
    });
    editCancel.addEventListener('click', () => editOverlay.classList.remove('show'));
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') editOk.click();
        if (e.key === 'Escape') editOverlay.classList.remove('show');
    });
    // Bloquer la remontée des events clavier/souris vers le board
    editOverlay.querySelectorAll('input').forEach(el => {
        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('click',     (e) => e.stopPropagation());
    });

    // ── État interne ──────────────────────────────────────────────────────
    let planData      = [];   // [{name, niveau, x, y, r}, ...]
    let historyStack  = [];
    let redoStack     = [];
    let selectedIndex = null;
    let swapIndex     = null; // premier élément pour échange double-clic
    let isLocked      = false;
    let currentScale  = 1;
    let translateX    = 0;
    let translateY    = 0;

    // Drag SVG (pan)
    let svgPanActive = false;
    let svgPanStartX = 0, svgPanStartY = 0;

    // Référence au cadre de sélection courant (mis à jour par drawPlan)
    let currentSelOverlay = null;

    // ── Utilitaires ───────────────────────────────────────────────────────
    function pushHistory() {
        historyStack.push(JSON.stringify(planData));
        if (historyStack.length > 40) historyStack.shift();
        redoStack = [];
        updateButtons();
    }

    function updateButtons() {
        btnUndo.disabled   = historyStack.length === 0;
        btnRedo.disabled   = redoStack.length === 0;
        btnDelete.disabled = selectedIndex === null;
        infoEl.textContent = '';
    }

    function applyTransform() {
        mainLayer.style.transition = 'transform 0.15s ease-out';
        mainLayer.style.transformOrigin = 'center center';
        mainLayer.style.transform = `translate(${translateX}px,${translateY}px) scale(${currentScale})`;
    }

    function getDimsForNiveau(niveau) {
        switch (niveau) {
            case 'PROF':    return { w: PLAN_DIMS.PROF_W,   h: PLAN_DIMS.PROF_H,   chair: false };
            case 'MEUBLE':  return { w: PLAN_DIMS.MEUBLE_W, h: PLAN_DIMS.MEUBLE_H, chair: false };
            case 'PORTE':   return { w: PLAN_DIMS.DOOR_W,   h: PLAN_DIMS.DOOR_H,   chair: false };
            case 'TABLEAU': return { w: PLAN_DIMS.BOARD_W,  h: PLAN_DIMS.BOARD_H,  chair: false };
            default:        return { w: PLAN_DIMS.DESK_W,   h: PLAN_DIMS.DESK_H,   chair: true  };
        }
    }

    // ── Dessin du plan ────────────────────────────────────────────────────
    function drawPlan() {
        mainLayer.innerHTML = '';

        // Fond gris clair de la salle
        const bg = document.createElementNS(PLAN_SVG_NS, 'rect');
        bg.setAttribute('x', 5);
        bg.setAttribute('y', 5);
        bg.setAttribute('width', 1790);
        bg.setAttribute('height', 1790);
        bg.setAttribute('fill', '#d8d8d8');
        bg.style.pointerEvents = 'none';
        mainLayer.appendChild(bg);

        // Murs
        const walls = document.createElementNS(PLAN_SVG_NS, 'rect');
        walls.setAttribute('x', 5);
        walls.setAttribute('y', 5);
        walls.setAttribute('width', 1790);
        walls.setAttribute('height', 1790);
        walls.setAttribute('fill', 'none');
        walls.setAttribute('stroke', '#aaaaaa');
        walls.setAttribute('stroke-width', '10');
        walls.style.pointerEvents = 'none';
        mainLayer.appendChild(walls);

        planData.forEach((item, index) => {
            const g = document.createElementNS(PLAN_SVG_NS, 'g');
            let cls = 'plan-desk-group';
            if (isLocked)             cls += ' plan-locked';
            if (selectedIndex === index) cls += ' plan-selected';
            if (swapIndex === index)     cls += ' plan-swap-pending';
            g.setAttribute('class', cls);

            const x = item.x || 900;
            const y = item.y || 900;
            const r = item.r || 0;
            g.setAttribute('transform', `translate(${x},${y}) rotate(${r})`);
            g.dataset.idx = index;

            const dims = getDimsForNiveau(item.niveau);
            const color = item.color || PLAN_COULEURS[item.niveau] || '#A58F88';

            // Rectangle bureau
            const rect = document.createElementNS(PLAN_SVG_NS, 'rect');
            rect.setAttribute('class', 'plan-desk-rect');
            rect.setAttribute('x', -dims.w / 2);
            rect.setAttribute('y', -dims.h / 2);
            rect.setAttribute('width',  dims.w);
            rect.setAttribute('height', dims.h);
            rect.setAttribute('rx', 5);
            rect.style.fill = color;
            g.appendChild(rect);

            // Chaise
            if (dims.chair) {
                const chair = document.createElementNS(PLAN_SVG_NS, 'rect');
                chair.setAttribute('class', 'plan-chair-rect');
                chair.setAttribute('x', -30);
                chair.setAttribute('y', dims.h / 2 + 5);
                chair.setAttribute('width', 60);
                chair.setAttribute('height', 15);
                chair.setAttribute('rx', 2);
                g.appendChild(chair);
            }

            // Texte
            if (item.name) {
                const text = document.createElementNS(PLAN_SVG_NS, 'text');
                text.setAttribute('x', '0');
                text.setAttribute('y', '0');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'central');
                text.setAttribute('font-family', "'Segoe UI', Arial, sans-serif");
                text.setAttribute('font-weight', '900');
                text.setAttribute('text-transform', 'uppercase');
                // Adapter taille de police si prénom long
                const nameLen = item.name.length;
                const fontSize = Math.min(28, Math.max(14, dims.w / (nameLen * 0.62)));
                text.setAttribute('font-size', fontSize + 'px');
                text.setAttribute('fill', item.niveau === 'TABLEAU' ? '#ffffff' : '#000000');
                if (r > 130 && r < 230) {
                    text.setAttribute('transform', 'rotate(180)');
                }
                text.textContent = item.name.toUpperCase();
                g.appendChild(text);
            }

            // ── Gestion drag & interactions (souris + stylet + tactile) ───
            let dragging = false;
            let dragStartX = 0, dragStartY = 0;
            let origItemX = 0, origItemY = 0;
            let pointerDownTime = 0;
            let singleClickTimer = null; // délai pour distinguer simple-clic et dblclick

            // ── Fonction échange (partagée dblclick + double-tap) ─────────
            function doSwap() {
                if (swapIndex === null) {
                    // 1er double-clic : marquer comme source d'échange
                    swapIndex = index;
                    drawPlan();
                } else if (swapIndex === index) {
                    // Double-clic sur le même : annuler
                    swapIndex = null;
                    drawPlan();
                } else {
                    // 2ème double-clic sur un autre : échanger nom + niveau
                    pushHistory();
                    const a = planData[swapIndex];
                    const b = planData[index];
                    const tempName = a.name;  const tempNiv = a.niveau;
                    a.name = b.name;          a.niveau = b.niveau;
                    b.name = tempName;        b.niveau = tempNiv;
                    swapIndex = null;
                    selectedIndex = null;
                    drawPlan();
                    saveBoard();
                }
            }

            g.addEventListener('pointerdown', (e) => {
                if (isLocked) return;
                e.stopPropagation();
                e.preventDefault();
                dragging = false;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                origItemX  = item.x || 900;
                origItemY  = item.y || 900;
                pointerDownTime = Date.now();
                try { g.setPointerCapture(e.pointerId); } catch(_) {}
            });

            g.addEventListener('pointermove', (e) => {
                if (isLocked) return;
                if (e.buttons === 0) return; // stylet/souris levé
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;
                if (!dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
                    dragging = true;
                    // Annuler le timer de simple-clic si on commence à déplacer
                    if (singleClickTimer) { clearTimeout(singleClickTimer); singleClickTimer = null; }
                    pushHistory();
                }
                if (dragging) {
                    // Conversion précise pixels écran → unités SVG via la matrice de transformation
                    const ctm = svg.getScreenCTM();
                    if (!ctm) return;
                    const scaleX = 1 / ctm.a;
                    const scaleY = 1 / ctm.d;

                    // TABLEAU et PORTE : collés aux murs, en tenant compte de la rotation
                    // (une porte verticale a sa largeur et hauteur inversées)
                    // Tous les autres : marge fixe de 50 unités SVG depuis les murs
                    const wallSnap = ['TABLEAU', 'PORTE'].includes(item.niveau);
                    let minX, maxX, minY, maxY;
                    if (wallSnap) {
                        const rad = (r * Math.PI) / 180;
                        const cosA = Math.abs(Math.cos(rad));
                        const sinA = Math.abs(Math.sin(rad));
                        // Emprise réelle de l'élément après rotation
                        const hw = (dims.w * cosA + dims.h * sinA) / 2;
                        const hh = (dims.w * sinA + dims.h * cosA) / 2;
                        minX = hw + 10;  maxX = 1800 - hw - 10;
                        minY = hh + 10;  maxY = 1800 - hh - 10;
                    } else {
                        minX = 50;  maxX = 1750;
                        minY = 50;  maxY = 1750;
                    }

                    item.x = Math.max(minX, Math.min(maxX, origItemX + dx * scaleX));
                    item.y = Math.max(minY, Math.min(maxY, origItemY + dy * scaleY));
                    g.setAttribute('transform', `translate(${item.x},${item.y}) rotate(${r})`);
                    // Déplacer le cadre de sélection en même temps
                    if (currentSelOverlay) {
                        currentSelOverlay.setAttribute('transform', `translate(${item.x},${item.y}) rotate(${r})`);
                    }
                }
            });

            g.addEventListener('pointerup', (e) => {
                e.stopPropagation();
                if (dragging) {
                    dragging = false;
                    saveBoard();
                    return;
                }
                const elapsed = Date.now() - pointerDownTime;
                if (elapsed > 700) return; // appui long ignoré

                // Sur stylet : détecter le double-tap manuellement
                // (le navigateur ne génère pas toujours dblclick avec un stylet)
                if (e.pointerType === 'pen' || e.pointerType === 'touch') {
                    // On délègue directement à doSwap() — chaque tap = une action d'échange
                    // (même comportement que dblclick natif : 1er tap = marquer, 2ème tap = échanger)
                    if (singleClickTimer) { clearTimeout(singleClickTimer); singleClickTimer = null; }
                    doSwap();
                    return;
                }

                // Sur souris : attendre un court délai pour distinguer simple-clic et dblclick
                // Le dblclick natif annulera ce timer s'il arrive
                if (singleClickTimer) { clearTimeout(singleClickTimer); singleClickTimer = null; }
                singleClickTimer = setTimeout(() => {
                    singleClickTimer = null;
                    // Simple clic : sélection uniquement (pas d'échange)
                    selectedIndex = index;
                    // Ne pas réinitialiser swapIndex ici — seul le fond SVG le fait
                    drawPlan();
                }, 220);
            });

            // dblclick natif (souris PC) — annule le timer simple-clic et déclenche l'échange
            g.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (singleClickTimer) { clearTimeout(singleClickTimer); singleClickTimer = null; }
                doSwap();
            });

            mainLayer.appendChild(g);
        });

        // ── Cadre de sélection avec boutons d'action ──────────────────────
        // On le construit UNE FOIS ici et on garde la référence pour le drag
        let selOverlay = null;
        currentSelOverlay = null; // reset à chaque redraw

        if (selectedIndex !== null && !isLocked) {
            const sel = planData[selectedIndex];
            const dims = getDimsForNiveau(sel.niveau);
            const sx = sel.x || 900;
            const sy = sel.y || 900;
            const sr = sel.r || 0;

            const PAD = 18;
            const BW  = dims.w + PAD * 2;
            const BH  = dims.h + PAD * 2;
            const BR  = 28;
            const FS  = 28;

            selOverlay = document.createElementNS(PLAN_SVG_NS, 'g');
            selOverlay.setAttribute('transform', `translate(${sx},${sy}) rotate(${sr})`);
            selOverlay.style.pointerEvents = 'all';
            selOverlay.dataset.isOverlay = '1';

            // Cadre pointillé
            const frame = document.createElementNS(PLAN_SVG_NS, 'rect');
            frame.setAttribute('x',      -BW / 2);
            frame.setAttribute('y',      -BH / 2);
            frame.setAttribute('width',   BW);
            frame.setAttribute('height',  BH);
            frame.setAttribute('rx',      10);
            frame.setAttribute('fill',    'none');
            frame.setAttribute('stroke',  '#4a90e2');
            frame.setAttribute('stroke-width',    '3');
            frame.setAttribute('stroke-dasharray', '10 6');
            frame.style.pointerEvents = 'none';
            selOverlay.appendChild(frame);

            // ── Fabrique un bouton SVG circulaire ─────────────────────────
            function makeSvgBtn(cx, cy, emoji, bgColor, onDown, onUp) {
                const bg = document.createElementNS(PLAN_SVG_NS, 'circle');
                bg.setAttribute('cx', cx); bg.setAttribute('cy', cy);
                bg.setAttribute('r',  BR);
                bg.setAttribute('fill', bgColor);
                bg.setAttribute('stroke', '#fff');
                bg.setAttribute('stroke-width', '3');
                bg.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))';

                const label = document.createElementNS(PLAN_SVG_NS, 'text');
                label.setAttribute('x', cx); label.setAttribute('y', cy);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('dominant-baseline', 'middle');
                label.style.fontSize = FS + 'px';
                label.style.pointerEvents = 'none';
                label.style.userSelect = 'none';
                label.textContent = emoji;

                const hit = document.createElementNS(PLAN_SVG_NS, 'circle');
                hit.setAttribute('cx', cx); hit.setAttribute('cy', cy);
                hit.setAttribute('r',  BR + 10);
                hit.setAttribute('fill', 'transparent');
                hit.style.cursor = 'pointer';

                [bg, hit].forEach(el => {
                    el.addEventListener('pointerdown', (e) => {
                        e.stopPropagation(); e.preventDefault();
                        if (onDown) onDown(e);
                    });
                    el.addEventListener('pointerup', (e) => {
                        e.stopPropagation();
                        if (onUp) onUp(e);
                    });
                    el.addEventListener('click', (e) => e.stopPropagation());
                });

                selOverlay.appendChild(bg);
                selOverlay.appendChild(label);
                selOverlay.appendChild(hit);
                return { bg, hit };
            }

            // ── Bouton ✕ Supprimer — coin haut droit ──────────────────────
            makeSvgBtn(BW / 2, -BH / 2, '✕', '#ff5f57',
                null,
                () => deleteSelected()
            );

            // ── Bouton ✏ Éditer — coin bas droit ─────────────────────────
            makeSvgBtn(BW / 2, BH / 2, '✏', '#28c840',
                null,
                () => openEditModal()
            );

            // ── Bouton ↻ Rotation par glisser — coin bas gauche ──────────
            // On calcule l'angle entre le centre de l'élément et la position du pointeur
            {
                const rotCX = -BW / 2;
                const rotCY =  BH / 2;
                let rotDragging = false;
                let rotStartAngle = 0;
                let rotOrigR = 0;

                // Convertit un point écran en coordonnées SVG (sans rotation de l'élément)
                function screenToSvgAngle(clientX, clientY) {
                    const ctm = svg.getScreenCTM();
                    if (!ctm) return 0;
                    const svgX = (clientX - ctm.e) / ctm.a;
                    const svgY = (clientY - ctm.f) / ctm.d;
                    const s = planData[selectedIndex];
                    const cx = s ? (s.x || 900) : 900;
                    const cy = s ? (s.y || 900) : 900;
                    return Math.atan2(svgY - cy, svgX - cx) * 180 / Math.PI;
                }

                const rotBg  = document.createElementNS(PLAN_SVG_NS, 'circle');
                rotBg.setAttribute('cx', rotCX); rotBg.setAttribute('cy', rotCY);
                rotBg.setAttribute('r',  BR);
                rotBg.setAttribute('fill', '#febc2e');
                rotBg.setAttribute('stroke', '#fff');
                rotBg.setAttribute('stroke-width', '3');
                rotBg.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))';

                const rotLabel = document.createElementNS(PLAN_SVG_NS, 'text');
                rotLabel.setAttribute('x', rotCX); rotLabel.setAttribute('y', rotCY);
                rotLabel.setAttribute('text-anchor', 'middle');
                rotLabel.setAttribute('dominant-baseline', 'middle');
                rotLabel.style.fontSize = FS + 'px';
                rotLabel.style.pointerEvents = 'none';
                rotLabel.style.userSelect = 'none';
                rotLabel.textContent = '↻';

                const rotHit = document.createElementNS(PLAN_SVG_NS, 'circle');
                rotHit.setAttribute('cx', rotCX); rotHit.setAttribute('cy', rotCY);
                rotHit.setAttribute('r',  BR + 10);
                rotHit.setAttribute('fill', 'transparent');
                rotHit.style.cursor = 'grab';

                [rotBg, rotHit].forEach(el => {
                    el.addEventListener('pointerdown', (e) => {
                        e.stopPropagation(); e.preventDefault();
                        rotDragging = true;
                        rotStartAngle = screenToSvgAngle(e.clientX, e.clientY);
                        rotOrigR = planData[selectedIndex] ? (planData[selectedIndex].r || 0) : 0;
                        pushHistory();
                        try { rotHit.setPointerCapture(e.pointerId); } catch(_) {}
                        rotHit.style.cursor = 'grabbing';
                    });

                    el.addEventListener('pointermove', (e) => {
                        if (!rotDragging) return;
                        if (e.buttons === 0) { rotDragging = false; return; }
                        e.stopPropagation(); e.preventDefault();
                        const currentAngle = screenToSvgAngle(e.clientX, e.clientY);
                        let delta = currentAngle - rotStartAngle;
                        // Snap à 15° si Shift ou stylet
                        const raw = rotOrigR + delta;
                        const snapped = Math.round(raw / 10) * 10;
                        if (planData[selectedIndex]) {
                            planData[selectedIndex].r = ((snapped % 360) + 360) % 360;
                            // Mettre à jour visuellement en temps réel sans redessiner tout
                            const gEl = mainLayer.querySelector(`g[data-idx="${selectedIndex}"]`);
                            const s = planData[selectedIndex];
                            if (gEl) gEl.setAttribute('transform', `translate(${s.x},${s.y}) rotate(${s.r})`);
                            if (selOverlay) selOverlay.setAttribute('transform', `translate(${s.x},${s.y}) rotate(${s.r})`);
                        }
                    });

                    el.addEventListener('pointerup', (e) => {
                        e.stopPropagation();
                        if (rotDragging) {
                            rotDragging = false;
                            rotHit.style.cursor = 'grab';
                            syncAndSave();
                        }
                    });

                    el.addEventListener('click', (e) => e.stopPropagation());
                });

                selOverlay.appendChild(rotBg);
                selOverlay.appendChild(rotLabel);
                selOverlay.appendChild(rotHit);
            }

            mainLayer.appendChild(selOverlay);
            currentSelOverlay = selOverlay;
        }

        applyTransform();
        updateButtons();

        // ── Boutons zoom — repositionnés après chaque redraw ─────────────
        // (la position dépend de la taille réelle du SVG rendu)
        _positionZoomBtns();
    }

    // ── Sync ──────────────────────────────────────────────────────────────
    function syncAndSave() {
        drawPlan();
        saveBoard();
    }

    // ── Ajout d'éléments ──────────────────────────────────────────────────
    function addItem(name, niveau) {
        pushHistory();
        planData.push({ name: name.toUpperCase(), niveau: niveau || 'AUTRE', x: 900, y: 900, r: 0 });
        syncAndSave();
    }

    // ── Suppression ───────────────────────────────────────────────────────
    function deleteSelected() {
        if (selectedIndex === null) return;
        pushHistory();
        planData.splice(selectedIndex, 1);
        selectedIndex = null;
        swapIndex = null;
        syncAndSave();
    }

    // ── Rotation ──────────────────────────────────────────────────────────
    function rotateSelected() {
        if (selectedIndex === null || isLocked) return;
        pushHistory();
        planData[selectedIndex].r = ((planData[selectedIndex].r || 0) + 15) % 360;
        syncAndSave();
    }

    // ── Miroir horizontal + vertical (= retourner le plan à 180°) ──────────
    // Le plan mesure 1800x1800 (viewBox SVG). On applique en même temps :
    //   - le miroir horizontal (haut ↔ bas)  : y → 1800 - y
    //   - le miroir vertical    (gauche ↔ droite) : x → 1800 - x
    // Combiner les deux revient mathématiquement à une rotation de 180° de
    // TOUT le plan (deux réflexions successives = une rotation), donc :
    //   r → r + 180
    // C'est plus fidèle qu'un miroir sur un seul axe : ça ne dépend pas de
    // la symétrie gauche-droite des meubles (porte, tableau, etc.) et ça
    // correspond à "regarder la classe depuis le mur opposé" plutôt qu'à
    // une image inversée. Le texte reste lisible automatiquement grâce à la
    // logique existante qui le redresse pour les angles "inversés".
    // Cliquer une seconde fois annule l'opération (c'est une symétrie).
    function flipVertical() {
        if (!planData.length) return;
        pushHistory();
        planData.forEach(item => {
            item.x = 1800 - (item.x || 900);
            item.y = 1800 - (item.y || 900);
            item.r = ((item.r || 0) + 180) % 360;
        });
        selectedIndex = null;
        swapIndex = null;
        syncAndSave();
    }

    // ── Verrouillage ──────────────────────────────────────────────────────
    function toggleLock() {
        isLocked = !isLocked;
        btnLock.textContent = isLocked ? '🔒' : '🔓';
        btnLock.className = isLocked
            ? 'plan-btn plan-btn-lock-active'
            : 'plan-btn';
        updateButtons();
        drawPlan();
    }

    // ── Zoom ──────────────────────────────────────────────────────────────
    function changeZoom(delta) {
        const ns = Math.min(Math.max(currentScale + delta, 0.5), 4);
        if (ns !== currentScale) {
            currentScale = ns;
            if (ns === 1) { translateX = 0; translateY = 0; }
            applyTransform();
        }
    }

    // ── Undo / Redo ───────────────────────────────────────────────────────
    function undo() {
        if (!historyStack.length) return;
        redoStack.push(JSON.stringify(planData));
        planData = JSON.parse(historyStack.pop());
        selectedIndex = null; swapIndex = null;
        drawPlan();
    }

    function redo() {
        if (!redoStack.length) return;
        historyStack.push(JSON.stringify(planData));
        planData = JSON.parse(redoStack.pop());
        selectedIndex = null; swapIndex = null;
        drawPlan();
    }

    // ── Clear ─────────────────────────────────────────────────────────────
    function clearPlan() {
        if (!planData.length) return;
        if (!window.confirm('Vider tout le plan ?')) return;
        pushHistory();
        planData = [];
        selectedIndex = null;
        swapIndex = null;
        syncAndSave();
    }

    // ── Désélectionner + annuler échange si clic sur SVG vide ────────────
    svg.addEventListener('pointerup', (e) => {
        if (e.target === svg || e.target === mainLayer) {
            if (svgPanActive) return; // pas de désélection si on panait
            selectedIndex = null;
            swapIndex = null;
            drawPlan();
        }
    });

    // ── Pan SVG (souris + stylet + tactile) ──────────────────────────────
    svg.addEventListener('pointerdown', (e) => {
        if (e.target !== svg && e.target !== mainLayer) return;
        if (currentScale <= 1) return;
        svgPanActive = true;
        svgPanStartX = e.clientX;
        svgPanStartY = e.clientY;
        try { svg.setPointerCapture(e.pointerId); } catch(_) {}
        e.preventDefault();
    });
    svg.addEventListener('pointermove', (e) => {
        if (!svgPanActive) return;
        if (e.buttons === 0) { svgPanActive = false; return; }
        e.preventDefault();
        translateX += (e.clientX - svgPanStartX) * 5;
        translateY += (e.clientY - svgPanStartY) * 5;
        svgPanStartX = e.clientX;
        svgPanStartY = e.clientY;
        applyTransform();
    });
    svg.addEventListener('pointerup',     () => { svgPanActive = false; });
    svg.addEventListener('pointercancel', () => { svgPanActive = false; });

    // ── Listeners boutons toolbar ─────────────────────────────────────────
    btnLock.addEventListener('click', (e) => { e.stopPropagation(); toggleLock(); });
    btnFlip.addEventListener('click', (e) => { e.stopPropagation(); flipVertical(); });
    btnUndo.addEventListener('click', (e) => { e.stopPropagation(); undo(); });
    btnRedo.addEventListener('click', (e) => { e.stopPropagation(); redo(); });
    btnDelete.addEventListener('click', (e) => { e.stopPropagation(); deleteSelected(); });
    btnClear.addEventListener('click', (e) => { e.stopPropagation(); clearPlan(); });
    btnZoomIn.addEventListener('click',    (e) => { e.stopPropagation(); changeZoom(0.3); });
    btnZoomOut.addEventListener('click',   (e) => { e.stopPropagation(); changeZoom(-0.3); });
    btnZoomReset.addEventListener('click', (e) => { e.stopPropagation(); currentScale = 1; translateX = 0; translateY = 0; applyTransform(); });

    // ── Export SVG → Canvas (commun PNG et PDF) ───────────────────────────
    function _svgToCanvas(cb) {
        const clone = svg.cloneNode(true);
        clone.setAttribute('width', '1800');
        clone.setAttribute('height', '1800');
        clone.setAttribute('viewBox', '0 0 1800 1800');
        // Retirer le groupe zoom
        const zoomG = clone.querySelector('.plan-svg-zoom-ctrl');
        if (zoomG) zoomG.remove();
        // Réinitialiser le transform du mainLayer (zoom/pan = 1:1 pour l'export)
        const ml = clone.querySelector('g[id^="plan-layer-"]');
        if (ml) { ml.style.transform = ''; ml.style.transition = ''; }
        // Retirer le cadre de sélection s'il existe
        const selG = clone.querySelector('g[data-is-overlay]');
        if (selG) selG.remove();

        const svgData = new XMLSerializer().serializeToString(clone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        const canvas = document.createElement('canvas');
        canvas.width  = 1800;
        canvas.height = 1800;
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1800, 1800);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            cb(canvas);
        };
        img.onerror = () => { URL.revokeObjectURL(url); alert('Erreur lors de la génération de l\'image.'); };
        img.src = url;
    }

    function _getFileName(ext) {
        const d = new Date();
        const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
        const nomProf = (localStorage.getItem('nom_enseignant') || 'plan')
            .toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
        return `plan_classe_${nomProf}_${dateStr}.${ext}`;
    }

    function _downloadBlob(blob, fileName) {
        if (window.Android && window.Android.savePdfFromBase64) {
            const reader = new FileReader();
            reader.onload = () => window.Android.savePdfFromBase64(reader.result.split(',')[1], fileName);
            reader.readAsDataURL(blob);
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
    }

    // ── Export PNG ────────────────────────────────────────────────────────
    btnExportPng.addEventListener('click', (e) => {
        e.stopPropagation();
        btnExportPng.textContent = '⏳';
        btnExportPng.disabled = true;
        _svgToCanvas((canvas) => {
            canvas.toBlob((blob) => {
                _downloadBlob(blob, _getFileName('png'));
                btnExportPng.textContent = '🖼️';
                btnExportPng.disabled = false;
            }, 'image/png');
        });
    });

    // ── Export PDF ────────────────────────────────────────────────────────
    btnExportPdf.addEventListener('click', (e) => {
        e.stopPropagation();
        btnExportPdf.textContent = '⏳';
        btnExportPdf.disabled = true;

        function _doExportPdf() {
            const { jsPDF } = window.jspdf;
            _svgToCanvas((canvas) => {
                const doc = new jsPDF('p', 'mm', 'a4');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('PLAN DE CLASSE', 105, 12, { align: 'center' });
                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                doc.addImage(imgData, 'JPEG', 10, 18, 190, 190);
                const fileName = _getFileName('pdf');
                if (window.Android && window.Android.savePdfFromBase64) {
                    const b64 = doc.output('datauristring').split(',')[1];
                    window.Android.savePdfFromBase64(b64, fileName);
                } else {
                    doc.save(fileName);
                }
                btnExportPdf.textContent = 'PDF';
                btnExportPdf.disabled = false;
            });
        }

        if (window.jspdf && window.jspdf.jsPDF) {
            _doExportPdf();
        } else {
            // Charger jsPDF dynamiquement
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = _doExportPdf;
            script.onerror = () => {
                alert('Impossible de charger jsPDF. Vérifiez votre connexion internet.');
                btnExportPdf.textContent = 'PDF';
                btnExportPdf.disabled = false;
            };
            document.head.appendChild(script);
        }
    });

    // ── Export JSON ───────────────────────────────────────────────────────
    btnExportJson.addEventListener('click', (e) => {
        e.stopPropagation();
        const d = new Date();
        const dateStr = d.getFullYear()
            + String(d.getMonth() + 1).padStart(2, '0')
            + String(d.getDate()).padStart(2, '0');
        const nomProf = (localStorage.getItem('nom_enseignant') || 'plan')
            .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const fileName = `plan_classe_${nomProf}_${dateStr}.json`;

        const exportData = {
            _type:     'lebureauduprof-plan',
            _version:  1,
            exportedAt: Date.now(),
            items: planData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

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

    // ── Import JSON plan ──────────────────────────────────────────────────
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
                const data = JSON.parse(ev.target.result);
                // Accepter notre format ET un tableau brut
                const items = Array.isArray(data) ? data
                    : (data._type === 'lebureauduprof-plan' && Array.isArray(data.items)) ? data.items
                    : null;
                if (!items) { alert('Fichier JSON non reconnu.'); return; }
                if (planData.length > 0 && !window.confirm(
                    'Remplacer le plan actuel par le fichier importé ?'
                )) return;
                pushHistory();
                planData = items;
                selectedIndex = null;
                swapIndex = null;
                syncAndSave();
            } catch (err) {
                alert('Erreur lors de la lecture du fichier JSON.');
            }
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    });

    // ── Import liste élèves ───────────────────────────────────────────────
    btnImport.addEventListener('click', (e) => {
        e.stopPropagation();
        // 1. Essayer d'abord la liste "Ma Classe" mémorisée dans localStorage
        const maListe = localStorage.getItem('maListeEleves');
        if (maListe) {
            try {
                const eleves = JSON.parse(maListe);
                if (Array.isArray(eleves) && eleves.length) {
                    if (planData.length === 0 || window.confirm(
                        `Importer ${eleves.length} élève(s) depuis "Ma Classe" ?\n(Les éléments existants seront conservés)`
                    )) {
                        _importEleves(eleves.map(el => ({
                            prenom: (el.identite || '').split(' ')[0] || el.identite || '',
                            niveau: el.niveau || 'AUTRE'
                        })));
                        return;
                    }
                }
            } catch(_) {}
        }
        // 2. Sinon ouvrir un fichier .txt/.csv
        fileInput.value = '';
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines = ev.target.result.trim().split('\n').filter(l => l.trim());
            const eleves = lines.map(line => {
                const parts = line.split(';').map(s => s.trim());
                return { prenom: parts[0] || '', niveau: (parts[3] || 'AUTRE').toUpperCase() };
            }).filter(el => el.prenom);
            if (!eleves.length) { alert('Aucun élève trouvé dans le fichier.'); return; }
            _importEleves(eleves);
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    });

    function _importEleves(eleves) {
        pushHistory();
        // Disposition automatique en grille (5 par rangée)
        const COLS       = 5;
        const STEP_X     = 260;
        const STEP_Y     = 220;
        const MARGIN_X   = 220;
        const MARGIN_Y   = 200;
        eleves.forEach((el, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            planData.push({
                name:   el.prenom.toUpperCase(),
                niveau: el.niveau || 'AUTRE',
                x: MARGIN_X + col * STEP_X,
                y: MARGIN_Y + row * STEP_Y,
                r: 0
            });
        });
        syncAndSave();
    }

    // Menu ajouter
    btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        addMenu.classList.toggle('show');
    });
    addMenu.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        e.stopPropagation();
        addMenu.classList.remove('show');
        const action = btn.dataset.action;
        if (action === 'eleve') {
            // Ouvrir modale prénom
            modalInput.value = '';
            modalOverlay.classList.add('show');
            setTimeout(() => modalInput.focus(), 80);
        } else {
            const niveauMap = { prof: 'PROF', tableau: 'TABLEAU', meuble: 'MEUBLE', porte: 'PORTE' };
            addItem(action.toUpperCase(), niveauMap[action]);
        }
    });
    document.addEventListener('click', () => addMenu.classList.remove('show'));

    // Modal
    modalOk.addEventListener('click', () => {
        const n = modalInput.value.trim();
        if (n) { addItem(n, 'AUTRE'); }
        modalOverlay.classList.remove('show');
    });
    modalCancel.addEventListener('click', () => modalOverlay.classList.remove('show'));
    modalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { modalOk.click(); }
        if (e.key === 'Escape') { modalOverlay.classList.remove('show'); }
    });
    modalInput.addEventListener('mousedown', (e) => e.stopPropagation());
    modalInput.addEventListener('click', (e) => e.stopPropagation());

    // ── Resize handle ─────────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(300, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(200, startH + ev.clientY - startY) + 'px';
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
            container.style.width  = Math.max(300, startW + t.clientX - startX) + 'px';
            container.style.height = Math.max(200, startH + t.clientY - startY) + 'px';
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
            window._wfMiniBarCollapse(widget, '🏫 Plan de classe', {});
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
            requestAnimationFrame(() => { if (typeof drawPlan === 'function') drawPlan(); });
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
            modalOverlay.remove();
            editOverlay.remove();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Init widget ───────────────────────────────────────────────────────
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
    // Sur téléphone : ouverture directe en plein écran (bouton vert)
    if (_wfIsPhoneLaunch() && wfMax && !_isMax) wfMax.click();

    // Premier rendu
    requestAnimationFrame(() => requestAnimationFrame(() => {
        drawPlan();
    }));

    // ── Exposition pour save-load.js ──────────────────────────────────────
    // widget._planData est lu par buildBoardState() lors de la sauvegarde
    Object.defineProperty(widget, '_planData', { get: () => planData });
    // widget._setPlanData() est appelé par restoreBoardFromJSON() lors du chargement
    widget._setPlanData = function(data) {
        if (Array.isArray(data)) {
            planData = data;
            selectedIndex = null;
            swapIndex = null;
            drawPlan();
        }
    };

    saveBoard();
    return widget;
}

// ── Hook createWidget — intercepter le type 'plan' ────────────────────────
(function patchCreateWidgetForPlan() {
    function doPatch() {
        const _orig = window.createWidget;
        if (typeof _orig !== 'function') return;
        window.createWidget = function (type) {
            if (type === 'plan') return window.createPlanWidget();
            return _orig.apply(this, arguments);
        };
    }
    if (typeof window.createWidget === 'function') doPatch();
    else document.addEventListener('DOMContentLoaded', doPatch);
})();

// ── Couleur du cadre dans la sauvegarde du tableau (correspondance par ordre) ──
(function patchThemePersistPlan() {
    function patchBuild() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function' || _orig._planThemePatched) return;
        const patched = function () {
            const state = _orig.apply(this, arguments);
            try {
                const list = (state && Array.isArray(state.widgets)) ? state.widgets : (Array.isArray(state) ? state : []);
                const saved = list.filter(w => w && w.type === 'plan');
                document.querySelectorAll('.widget[data-type="plan"]').forEach((w, i) => {
                    if (saved[i] && w.dataset.planTheme) saved[i].planTheme = w.dataset.planTheme;
                });
            } catch (e) {}
            return state;
        };
        patched._planThemePatched = true;
        window.buildBoardState = patched;
    }
    function patchRestore() {
        const _orig = window.restoreBoardFromJSON;
        if (typeof _orig !== 'function' || _orig._planThemePatched) return;
        const patched = function (json) {
            let themes = [];
            try {
                const parsed  = JSON.parse(json);
                const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                themes = widgets.filter(w => w && w.type === 'plan').map(w => w.planTheme || '');
            } catch (e) {}
            const res = _orig.apply(this, arguments);
            const apply = () => document.querySelectorAll('.widget[data-type="plan"]').forEach((w, i) => {
                if (themes[i] && typeof w._planApplyTheme === 'function') w._planApplyTheme(themes[i]);
            });
            apply();
            setTimeout(apply, 250);
            return res;
        };
        patched._planThemePatched = true;
        window.restoreBoardFromJSON = patched;
    }
    function doPatch() { patchBuild(); patchRestore(); }
    if (typeof window.buildBoardState === 'function' && typeof window.restoreBoardFromJSON === 'function') doPatch();
    else document.addEventListener('DOMContentLoaded', doPatch);
})();
