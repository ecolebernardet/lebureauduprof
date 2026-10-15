// =========================================================================
// WIDGET « VISUALISEUR » — Le Bureau du Prof
// Fichier autonome : injecte son propre style dans le DOM
// et initialise les widgets de type 'visualiseur'.
// (Même design et mêmes boutons fenêtre que la Calculatrice.)
//
// Affiche en direct l'image d'une caméra branchée en USB sur l'ordinateur :
// visualiseur de documents (HUE, IPEVO, Elmo…) ou simple webcam.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widget-calculatrice.js) :
//      <script src="widget-visualiseur.js"></script>
//   2. Template vide : <template id="template-visualiseur"></template>
//   3. Carte dans le panneau Outils → « Outils divers » :
//      onclick="createWidget('visualiseur');toggleToolsPanel()"
//
// 📌 Sauvegarde (save-load.js) :
//   • widget._visuGetData() → taille, plein écran, réduit, couleur, caméra,
//     résolution, cadrage, rotation, miroirs, noir et blanc, luminosité,
//     contraste, zoom, déplacement, caméra allumée ou non
//   • widget._visuSetData(data) → restauration après actualisation
//     (la caméra se rallume toute seule si elle était allumée)
//
// Fonctionnement :
//   • « Démarrer la caméra » : le navigateur demande l'autorisation la
//     première fois. Une caméra externe (USB) est choisie de préférence
//     à la webcam intégrée de l'ordinateur.
//   • Figer l'image : on peut retirer ou déplacer le document sans que
//     l'image change à l'écran.
//   • Capture : la vue actuelle (zoom compris) est posée sur le tableau
//     comme une image (déplaçable, annotable).
//   • Rotation par quart de tour, miroir horizontal (et vertical dans les
//     réglages), zoom numérique (molette ou − / +), déplacement de l'image
//     zoomée en la faisant glisser.
//   • Réglages : choix de la caméra, résolution, ajuster / remplir,
//     noir et blanc, luminosité, contraste, couleur du cadre.
//   • Si le câble est débranché puis rebranché, l'image revient seule.
//   • Clavier (cliquer d'abord sur le widget) : Espace figer, C capture,
//     R rotation, M miroir, + / − zoom, 0 zoom normal.
//
// Boutons fenêtre (comme les autres widgets) :
//   🟡 Réduire      → mini-barre en haut du tableau (la caméra est libérée)
//   🟢 Plein écran  → le widget occupe tout l'écran (Échap pour sortir)
//   🔴 Fermer       → supprime le widget et éteint la caméra
// =========================================================================

(function () {

    // ── Mini-barre « réduire » partagée (injectée une seule fois) ─────────
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

    // ── Taille des pastilles (identique aux autres widgets) ───────────────
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

    // ── CSS partagé des boutons fenêtre ───────────────────────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .wf-btn { width:22px; height:22px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:14px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:12px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:17px; }
        `;
        document.head.appendChild(ws);
    }

    // Police arrondie partagée avec les autres widgets (repli système si hors-ligne)
    if (!document.getElementById('wpc-font')) {
        var fl = document.createElement('link');
        fl.id = 'wpc-font';
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap';
        document.head.appendChild(fl);
    }

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* Widget parent transparent : visu-outer porte tout le visuel */
    .widget[data-type="visualiseur"],
    .widget[data-type="visualiseur"]:focus-within {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
    }
    .widget[data-type="visualiseur"] .widget-content {
        padding: 0 !important;
        background: transparent !important;
        overflow: visible !important;
    }

    /* ── Rectangle principal ── */
    .widget[data-type="visualiseur"] .visu-outer {
        --visu-ink:   #14202E;
        --visu-glass: rgba(255,255,255,0.62);
        --visu-bg:    #8EC5F2;
        --visu-op:    #2F6FB3;

        position: relative;
        width:  720px;
        height: 540px;
        min-width:  320px;
        min-height: 260px;
        box-sizing: border-box;
        overflow: hidden;
        border-radius: 24px;
        background-color: var(--visu-bg);
        color: var(--visu-ink);
        font-family: 'Quicksand', 'Segoe UI', system-ui, sans-serif;
        user-select: none;
        container-type: size;
        box-shadow: 0 24px 50px -20px rgba(10,20,35,0.55);
        outline: none;
        transition: background-color .3s;
    }
    .widget[data-type="visualiseur"]:hover .visu-outer,
    .widget[data-type="visualiseur"]:focus-within .visu-outer {
        outline: 2px dashed rgba(20,32,46,0.35);
        outline-offset: 2px;
    }

    .visu-sheen {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background:
            radial-gradient(70% 60% at 25% 15%, rgba(255,255,255,0.28), transparent 70%),
            radial-gradient(90% 80% at 50% 110%, rgba(10,20,35,0.16), transparent 70%);
    }

    /* ── Plein écran ── */
    .widget[data-type="visualiseur"] .visu-outer.visu-fullboard {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        min-width: 0 !important;
        min-height: 0 !important;
        z-index: 9999 !important;
        border-radius: 0 !important;
        outline: none !important;
        cursor: default !important;
    }
    .visu-outer.visu-fullboard .visu-resize-handle { display: none; }
    .visu-outer.visu-fullboard .visu-body { left: 10px; right: 10px; bottom: 10px; }

    @media (max-width: 768px), (max-height: 500px) and (pointer: coarse) {
        .widget[data-type="visualiseur"] .visu-outer.visu-fullboard {
            height: 100dvh !important;
            padding: env(safe-area-inset-top) env(safe-area-inset-right)
                     env(safe-area-inset-bottom) env(safe-area-inset-left);
        }
        .visu-outer.visu-fullboard .visu-header { padding-left: 44px; }
        .visu-outer.visu-fullboard .visu-body { left: 44px; right: 10px; bottom: 10px; }
    }

    /* ── En-tête ── */
    .visu-header {
        position: absolute;
        top: 0; left: 0; right: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 16px;
        z-index: 5;
        pointer-events: none;
    }
    .visu-header > * { pointer-events: auto; }
    .visu-title,
    .visu-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--visu-glass);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        border-radius: 999px;
        box-shadow: 0 4px 14px -8px rgba(10,20,35,0.4);
    }
    .visu-title {
        padding: 7px 16px 7px 12px;
        font-size: 15px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        min-width: 0;
    }
    .visu-title span { overflow: hidden; text-overflow: ellipsis; }
    .visu-title svg { width: 18px; height: 18px; flex-shrink: 0; }
    .visu-live-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: rgba(20,32,46,0.3); flex-shrink: 0;
    }
    .visu-outer.is-live .visu-live-dot { background: #E5383B; animation: visu-pulse 1.6s infinite; }
    .visu-outer.is-frozen .visu-live-dot { background: var(--visu-op); animation: none; }
    @keyframes visu-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
    .visu-tools { padding: 5px 12px 5px 6px; flex-shrink: 0; gap: 2px; }
    @container (max-width: 560px) { .visu-title span { display: none; } .visu-title { padding: 7px 10px; } }
    @container (max-width: 420px) { .visu-opt-btn { display: none; } }

    .visu-icon-btn {
        width: 32px; height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--visu-ink);
        cursor: pointer;
        padding: 0;
        transition: background .15s, opacity .15s;
    }
    .visu-icon-btn svg { width: 18px; height: 18px; }
    .visu-icon-btn:hover,
    .visu-icon-btn.is-on { background: rgba(20,32,46,0.12); }
    .visu-icon-btn.is-on.visu-freeze-btn { background: var(--visu-op); color: #fff; }
    .visu-icon-btn:disabled { opacity: .35; cursor: default; background: transparent; }
    .visu-icon-btn:focus-visible { outline: 2px solid var(--visu-ink); outline-offset: 2px; }
    .visu-sep { width: 1px; height: 20px; background: rgba(20,32,46,0.18); margin: 0 6px; }

    /* ── Zone d'image ── */
    .visu-body {
        position: absolute;
        top: 66px; left: 16px; right: 16px; bottom: 16px;
        z-index: 2;
    }
    .visu-stage {
        position: absolute;
        inset: 0;
        overflow: hidden;
        border-radius: 18px;
        background: #0E1116;
        box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
        touch-action: none;
    }
    .visu-outer.visu-fullboard .visu-stage { border-radius: 12px; }
    .visu-stage.is-zoomed { cursor: grab; }
    .visu-stage.is-panning { cursor: grabbing; }
    .visu-video {
        position: absolute;
        left: 50%; top: 50%;
        display: block;
        transform-origin: 50% 50%;
        background: transparent;
        pointer-events: none;
        visibility: hidden;
    }
    .visu-outer.is-live .visu-video { visibility: visible; }

    .visu-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        text-align: center;
        color: rgba(255,255,255,0.85);
        z-index: 2;
    }
    .visu-outer.is-live .visu-placeholder { display: none; }
    .visu-ph-ico svg { width: clamp(40px, 12cqmin, 90px); height: clamp(40px, 12cqmin, 90px); opacity: .7; }
    .visu-ph-msg {
        font-size: clamp(13px, 3.2cqmin, 22px);
        font-weight: 600;
        line-height: 1.4;
        max-width: 520px;
    }
    .visu-ph-msg.is-error { color: #FFB4A9; }
    .visu-start-btn {
        font-family: inherit;
        font-size: clamp(13px, 3cqmin, 20px);
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 10px 22px;
        cursor: pointer;
        background: var(--visu-op);
        color: #fff;
        box-shadow: 0 3px 0 rgba(0,0,0,0.3);
    }
    .visu-start-btn:hover { filter: brightness(1.1); }
    .visu-start-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.3); }
    .visu-start-btn[hidden] { display: none; }
    .visu-spinner {
        width: 34px; height: 34px;
        border-radius: 50%;
        border: 4px solid rgba(255,255,255,0.2);
        border-top-color: #fff;
        animation: visu-spin .9s linear infinite;
        display: none;
    }
    .visu-placeholder.is-loading .visu-spinner { display: block; }
    .visu-placeholder.is-loading .visu-ph-ico { display: none; }
    @keyframes visu-spin { to { transform: rotate(360deg); } }

    .visu-frozen-badge {
        position: absolute;
        top: 12px; left: 12px;
        z-index: 3;
        display: none;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        background: var(--visu-op);
        color: #fff;
        font-size: clamp(11px, 2.4cqmin, 16px);
        font-weight: 700;
        pointer-events: none;
        box-shadow: 0 4px 12px -4px rgba(0,0,0,0.5);
    }
    .visu-outer.is-frozen .visu-frozen-badge { display: flex; }

    .visu-zoombar {
        position: absolute;
        right: 12px; bottom: 12px;
        z-index: 3;
        display: none;
        align-items: center;
        gap: 2px;
        padding: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.85);
        -webkit-backdrop-filter: blur(8px);
                backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px -6px rgba(0,0,0,0.5);
    }
    .visu-outer.is-live .visu-zoombar { display: flex; }
    .visu-zoom-btn {
        width: 28px; height: 28px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--visu-ink);
        font-family: inherit;
        font-size: 18px;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
        display: flex; align-items: center; justify-content: center;
    }
    .visu-zoom-btn:hover { background: rgba(20,32,46,0.12); }
    .visu-zoom-label {
        min-width: 52px;
        text-align: center;
        font-size: 13px;
        font-weight: 700;
        border: none;
        background: transparent;
        color: var(--visu-ink);
        font-family: inherit;
        cursor: pointer;
        padding: 0 2px;
    }

    .visu-flash {
        position: absolute;
        inset: 0;
        background: #fff;
        opacity: 0;
        pointer-events: none;
        z-index: 4;
    }
    .visu-flash.go { animation: visu-flash .45s ease-out; }
    @keyframes visu-flash { 0% { opacity: .85; } 100% { opacity: 0; } }

    .visu-toast {
        position: absolute;
        left: 50%; bottom: 14px;
        transform: translateX(-50%) translateY(10px);
        z-index: 4;
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(20,32,46,0.85);
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s, transform .2s;
    }
    .visu-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

    /* ── Panneaux réglages / aide ── */
    .visu-panel {
        position: absolute;
        top: 62px;
        right: 16px;
        width: 310px;
        max-width: calc(100% - 32px);
        max-height: calc(100% - 80px);
        overflow-y: auto;
        box-sizing: border-box;
        z-index: 6;
        display: none;
        flex-direction: column;
        gap: 11px;
        padding: 14px 16px 14px;
        border-radius: 16px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 16px 34px -16px rgba(10,20,35,0.55);
        user-select: text;
    }
    .visu-panel.open { display: flex; }
    .visu-panel-title { font-size: 13px; font-weight: 700; }
    .visu-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(20,32,46,0.75);
    }
    .visu-row-label { flex: 1; }
    .visu-select {
        flex: 1;
        min-width: 0;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        padding: 5px 8px;
        border-radius: 8px;
        border: 1px solid rgba(20,32,46,0.2);
        background: #fff;
        color: var(--visu-ink);
    }
    .visu-small-btn {
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        border: none;
        border-radius: 999px;
        padding: 5px 11px;
        cursor: pointer;
        background: rgba(20,32,46,0.1);
        color: var(--visu-ink);
        white-space: nowrap;
    }
    .visu-small-btn:hover { background: rgba(20,32,46,0.18); }
    .visu-small-btn.is-danger { color: #C0392B; }
    .visu-seg { display: flex; gap: 4px; background: rgba(20,32,46,0.08); border-radius: 999px; padding: 3px; }
    .visu-seg button {
        font-family: inherit; font-size: 11px; font-weight: 700;
        border: none; border-radius: 999px; padding: 4px 10px; cursor: pointer;
        background: transparent; color: var(--visu-ink);
    }
    .visu-seg button.is-on { background: var(--visu-ink); color: #fff; }
    .visu-range { flex: 1; min-width: 0; accent-color: var(--visu-op); cursor: pointer; }
    .visu-range-val { min-width: 38px; text-align: right; font-size: 11px; }
    .visu-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
    .visu-swatch {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 2px solid rgba(20,32,46,0.15);
        cursor: pointer;
        padding: 0;
    }
    .visu-swatch.is-on { border-color: var(--visu-ink); box-shadow: 0 0 0 2px #fff inset; }
    .visu-switch {
        position: relative;
        width: 40px; height: 22px;
        flex-shrink: 0;
        border: none;
        border-radius: 999px;
        cursor: pointer;
        padding: 0;
        background: rgba(20,32,46,0.2);
        transition: background .2s;
    }
    .visu-switch::after {
        content: '';
        position: absolute;
        top: 3px; left: 3px;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        transition: left .2s;
    }
    .visu-switch[aria-checked="true"] { background: var(--visu-ink); }
    .visu-switch[aria-checked="true"]::after { left: 21px; }
    .visu-divider { height: 1px; background: rgba(20,32,46,0.1); margin: 2px 0; }
    .visu-note { font-size: 11px; font-weight: 600; color: rgba(20,32,46,0.6); line-height: 1.4; }
    .visu-help-list { margin: 0; padding-left: 18px; font-size: 12px; font-weight: 600; line-height: 1.5; color: rgba(20,32,46,0.85); }
    .visu-help-list li { margin-bottom: 4px; }
    .visu-panel kbd {
        display: inline-block;
        min-width: 1.4em;
        padding: 0 5px;
        border-radius: 5px;
        background: rgba(20,32,46,0.08);
        border: 1px solid rgba(20,32,46,0.18);
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        text-align: center;
    }

    /* ── Poignée de redimensionnement ── */
    .visu-resize-handle {
        position: absolute;
        bottom: 6px; right: 6px;
        width: 18px; height: 18px;
        cursor: nwse-resize;
        z-index: 7;
        opacity: 0;
        transition: opacity 0.2s;
        background: radial-gradient(circle, rgba(20,32,46,0.55) 1.3px, transparent 1.7px) 0 0 / 6px 6px;
        -webkit-mask: linear-gradient(135deg, transparent 50%, #000 50%);
                mask: linear-gradient(135deg, transparent 50%, #000 50%);
    }
    .widget[data-type="visualiseur"]:hover .visu-resize-handle,
    .widget[data-type="visualiseur"]:focus-within .visu-resize-handle { opacity: 1; }
    `;

    if (!document.getElementById('visualiseur-style')) {
        var st = document.createElement('style');
        st.id = 'visualiseur-style';
        st.textContent = STYLE;
        document.head.appendChild(st);
    }

    // ── Couleurs disponibles ──────────────────────────────────────────────
    var THEMES = {
        bleu:   { name: 'Bleu',   bg: '#8EC5F2', op: '#2F6FB3' },
        vert:   { name: 'Vert',   bg: '#7FD6A6', op: '#23915A' },
        jaune:  { name: 'Jaune',  bg: '#F6D86A', op: '#B9770E' },
        rose:   { name: 'Rose',   bg: '#F4A9C0', op: '#C2456E' },
        violet: { name: 'Violet', bg: '#C2B2F0', op: '#6A4FC2' },
        gris:   { name: 'Gris',   bg: '#D4DAE2', op: '#4A5868' },
        noir:   { name: 'Ardoise', bg: '#4A525E', op: '#2F6FB3' }
    };
    var RESOLUTIONS = {
        auto:  { name: 'Automatique',           w: null, h: null },
        '720': { name: 'HD (1280 × 720)',        w: 1280, h: 720 },
        '1080':{ name: 'Full HD (1920 × 1080)',  w: 1920, h: 1080 },
        '4k':  { name: '4K (3840 × 2160)',       w: 3840, h: 2160 }
    };
    var DEFAULT_W = 720, DEFAULT_H = 540, MIN_W = 320, MIN_H = 260;
    var ZOOM_MIN = 1, ZOOM_MAX = 8;
    // Noms habituels des caméras intégrées aux ordinateurs portables
    var INTERNAL_RE = /integrated|int[ée]gr[ée]e|built-?in|facetime|internal|interne|front|avant|hd webcam|easycamera|truevision|ir camera/i;
    // Taille maximale d'une capture posée sur le tableau (allège la sauvegarde)
    var BOARD_IMG_MAX = 1600;

    // ── Initialisation d'une instance ─────────────────────────────────────
    window.initVisualiseurWidget = function (widget, savedData) {

        // ── Icônes ──
        var ICON_CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>';
        var ICON_DOCCAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M6 21l3-9"/><path d="M9 12l6-5"/><rect x="13" y="3.5" width="7" height="5" rx="1.5" transform="rotate(20 16.5 6)"/><path d="M9 21h10l-2-5H11z" opacity=".5"/></svg>';
        var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>';
        var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
        var ICON_SNAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M3 16l4-4 4 4 2-2 4 4"/><circle cx="12.5" cy="9.5" r="1.3"/><path d="M20.5 3v6M17.5 6h6"/></svg>';
        var ICON_ROTATE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>';
        var ICON_MIRROR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18" stroke-dasharray="2 2.5"/><path d="M9 7L3.5 12 9 17z"/><path d="M15 7l5.5 5-5.5 5z" fill="currentColor"/></svg>';
        var ICON_SLIDERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
        var ICON_HELP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/></svg>';

        var swatchesHTML = Object.keys(THEMES).map(function (id) {
            return '<button class="visu-swatch" data-theme="' + id + '" title="' + THEMES[id].name
                 + '" style="background:' + THEMES[id].bg + '"></button>';
        }).join('');
        var resOptionsHTML = Object.keys(RESOLUTIONS).map(function (id) {
            return '<option value="' + id + '">' + RESOLUTIONS[id].name + '</option>';
        }).join('');

        // ── Injection HTML ──
        var contentZone = widget.querySelector('.widget-content');
        contentZone.innerHTML =
            '<div class="visu-outer" tabindex="0">'
          +   '<div class="visu-sheen"></div>'
          +   '<div class="visu-header">'
          +     '<div class="visu-title"><span class="visu-live-dot"></span>' + ICON_DOCCAM + '<span>Visualiseur</span></div>'
          +     '<div class="visu-tools">'
          +       '<button class="visu-icon-btn visu-freeze-btn" title="Figer l\'image (Espace)" disabled>' + ICON_PAUSE + '</button>'
          +       '<button class="visu-icon-btn visu-snap-btn" title="Capturer l\'image sur le tableau (C)" disabled>' + ICON_SNAP + '</button>'
          +       '<button class="visu-icon-btn visu-opt-btn visu-rotate-btn" title="Tourner d\'un quart de tour (R)">' + ICON_ROTATE + '</button>'
          +       '<button class="visu-icon-btn visu-opt-btn visu-mirror-btn" title="Miroir horizontal (M)" aria-pressed="false">' + ICON_MIRROR + '</button>'
          +       '<button class="visu-icon-btn visu-settings-btn" title="Réglages">' + ICON_SLIDERS + '</button>'
          +       '<button class="visu-icon-btn visu-help-btn" title="Aide">' + ICON_HELP + '</button>'
          +       '<span class="visu-sep"></span>'
          +       '<div class="wf-btns">'
          +         '<button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>'
          +         '<button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>'
          +         '<button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>'
          +       '</div>'
          +     '</div>'
          +   '</div>'
          +   '<div class="visu-body">'
          +     '<div class="visu-stage">'
          +       '<video class="visu-video" autoplay playsinline muted></video>'
          +       '<div class="visu-placeholder">'
          +         '<div class="visu-ph-ico">' + ICON_CAM + '</div>'
          +         '<div class="visu-spinner"></div>'
          +         '<div class="visu-ph-msg">Branchez le visualiseur (ou la webcam) en USB, puis démarrez la caméra.</div>'
          +         '<button class="visu-start-btn">Démarrer la caméra</button>'
          +       '</div>'
          +       '<div class="visu-frozen-badge">⏸ Image figée</div>'
          +       '<div class="visu-zoombar">'
          +         '<button class="visu-zoom-btn visu-zoom-out" title="Dézoomer (−)">−</button>'
          +         '<button class="visu-zoom-label" title="Revenir à 100 % (0)">100 %</button>'
          +         '<button class="visu-zoom-btn visu-zoom-in" title="Zoomer (+)">+</button>'
          +       '</div>'
          +       '<div class="visu-flash"></div>'
          +       '<div class="visu-toast"></div>'
          +     '</div>'
          +   '</div>'
          +   '<div class="visu-panel visu-settings">'
          +     '<div class="visu-panel-title">Réglages</div>'
          +     '<div class="visu-row"><span class="visu-row-label">Caméra</span>'
          +       '<button class="visu-small-btn visu-refresh-btn" title="Actualiser la liste des caméras">↻ Actualiser</button></div>'
          +     '<div class="visu-row"><select class="visu-select visu-cam-select"><option value="">Aucune caméra détectée</option></select></div>'
          +     '<div class="visu-row"><span class="visu-row-label">Résolution</span>'
          +       '<select class="visu-select visu-res-select" style="flex:0 0 auto;max-width:170px;">' + resOptionsHTML + '</select></div>'
          +     '<div class="visu-row"><span class="visu-row-label">Cadrage</span>'
          +       '<div class="visu-seg visu-fit-seg">'
          +         '<button data-fit="contain" title="Voir toute l\'image">Ajuster</button>'
          +         '<button data-fit="cover" title="Remplir le cadre (les bords peuvent être coupés)">Remplir</button>'
          +       '</div></div>'
          +     '<div class="visu-row"><span class="visu-row-label">Retourner verticalement</span>'
          +       '<button class="visu-switch visu-flipv" role="switch" aria-checked="false" aria-label="Retourner verticalement"></button></div>'
          +     '<div class="visu-row"><span class="visu-row-label">Noir et blanc</span>'
          +       '<button class="visu-switch visu-gray" role="switch" aria-checked="false" aria-label="Noir et blanc"></button></div>'
          +     '<div class="visu-row"><span class="visu-row-label" style="flex:0 0 74px;">Luminosité</span>'
          +       '<input type="range" class="visu-range visu-bright" min="50" max="200" step="5" value="100">'
          +       '<span class="visu-range-val visu-bright-val">100 %</span></div>'
          +     '<div class="visu-row"><span class="visu-row-label" style="flex:0 0 74px;">Contraste</span>'
          +       '<input type="range" class="visu-range visu-contrast" min="50" max="200" step="5" value="100">'
          +       '<span class="visu-range-val visu-contrast-val">100 %</span></div>'
          +     '<div class="visu-row" style="justify-content:flex-end;">'
          +       '<button class="visu-small-btn visu-reset-img" title="Annuler rotation, miroirs, zoom et réglages d\'image">Réinitialiser l\'image</button></div>'
          +     '<div class="visu-divider"></div>'
          +     '<div class="visu-row"><span class="visu-row-label">Couleur du cadre</span></div>'
          +     '<div class="visu-swatches">' + swatchesHTML + '</div>'
          +     '<div class="visu-divider"></div>'
          +     '<div class="visu-row" style="flex-wrap:wrap;">'
          +       '<button class="visu-small-btn visu-download-btn" title="Enregistrer la vue actuelle dans un fichier">⬇ Télécharger une capture</button>'
          +       '<button class="visu-small-btn is-danger visu-stop-btn" title="Éteindre la caméra">⏻ Éteindre la caméra</button>'
          +     '</div>'
          +     '<div class="visu-note">Si la caméra est utilisée par un autre logiciel (Teams, Zoom, logiciel du visualiseur…), fermez-le d\'abord.</div>'
          +   '</div>'
          +   '<div class="visu-panel visu-help">'
          +     '<div class="visu-panel-title">Aide</div>'
          +     '<ul class="visu-help-list">'
          +       '<li>Branchez le visualiseur en <b>USB</b>, puis cliquez sur <b>Démarrer la caméra</b>. Autorisez l\'accès à la caméra quand le navigateur le demande.</li>'
          +       '<li>Une caméra externe est choisie de préférence à la webcam de l\'ordinateur. Pour en changer : <b>Réglages → Caméra</b>.</li>'
          +       '<li><b>Figer</b> (<kbd>Espace</kbd>) : l\'image reste à l\'écran pendant que vous changez de document.</li>'
          +       '<li><b>Capturer</b> (<kbd>C</kbd>) : la vue actuelle est posée sur le tableau comme une image, que l\'on peut déplacer et annoter.</li>'
          +       '<li><b>Rotation</b> (<kbd>R</kbd>) par quart de tour, <b>miroir</b> (<kbd>M</kbd>). Le retournement vertical est dans les réglages.</li>'
          +       '<li><b>Zoom</b> : molette de la souris, boutons <kbd>−</kbd> <kbd>+</kbd> en bas à droite ou touches <kbd>-</kbd> <kbd>+</kbd>. <kbd>0</kbd> ou un clic sur le pourcentage revient à 100 %. Faites glisser l\'image zoomée pour la déplacer.</li>'
          +       '<li><b>Réglages</b> : résolution, ajuster / remplir le cadre, noir et blanc, luminosité, contraste, couleur du cadre.</li>'
          +       '<li>Si le câble est débranché puis rebranché, l\'image revient toute seule.</li>'
          +       '<li>Le clavier fonctionne après un clic sur le widget (ou en plein écran).</li>'
          +       '<li>Poignée en bas à droite pour redimensionner. Pastilles : réduire (la caméra est libérée), plein écran (<kbd>Échap</kbd> pour sortir), fermer.</li>'
          +     '</ul>'
          +   '</div>'
          +   '<div class="visu-resize-handle"></div>'
          + '</div>';

        // ── Références DOM ──
        var outer        = widget.querySelector('.visu-outer');
        var stage        = widget.querySelector('.visu-stage');
        var video        = widget.querySelector('.visu-video');
        var placeholder  = widget.querySelector('.visu-placeholder');
        var phMsg        = widget.querySelector('.visu-ph-msg');
        var startBtn     = widget.querySelector('.visu-start-btn');
        var flashEl      = widget.querySelector('.visu-flash');
        var toastEl      = widget.querySelector('.visu-toast');
        var zoomLabel    = widget.querySelector('.visu-zoom-label');
        var zoomInBtn    = widget.querySelector('.visu-zoom-in');
        var zoomOutBtn   = widget.querySelector('.visu-zoom-out');
        var freezeBtn    = widget.querySelector('.visu-freeze-btn');
        var snapBtn      = widget.querySelector('.visu-snap-btn');
        var rotateBtn    = widget.querySelector('.visu-rotate-btn');
        var mirrorBtn    = widget.querySelector('.visu-mirror-btn');
        var settingsBtn  = widget.querySelector('.visu-settings-btn');
        var helpBtn      = widget.querySelector('.visu-help-btn');
        var settingsEl   = widget.querySelector('.visu-settings');
        var helpEl       = widget.querySelector('.visu-help');
        var camSelect    = widget.querySelector('.visu-cam-select');
        var resSelect    = widget.querySelector('.visu-res-select');
        var refreshBtn   = widget.querySelector('.visu-refresh-btn');
        var fitSeg       = widget.querySelector('.visu-fit-seg');
        var flipVSwitch  = widget.querySelector('.visu-flipv');
        var graySwitch   = widget.querySelector('.visu-gray');
        var brightRange  = widget.querySelector('.visu-bright');
        var brightVal    = widget.querySelector('.visu-bright-val');
        var contrastRange= widget.querySelector('.visu-contrast');
        var contrastVal  = widget.querySelector('.visu-contrast-val');
        var resetImgBtn  = widget.querySelector('.visu-reset-img');
        var downloadBtn  = widget.querySelector('.visu-download-btn');
        var stopBtn      = widget.querySelector('.visu-stop-btn');
        var resizeHandle = widget.querySelector('.visu-resize-handle');
        var wfMin        = widget.querySelector('[data-role="wf-min"]');
        var wfMax        = widget.querySelector('[data-role="wf-max"]');
        var wfClose      = widget.querySelector('[data-role="wf-close"]');

        // ── État ──
        var alive       = true;
        var isMax       = false;
        var theme       = 'bleu';
        var stream      = null;
        var active      = false;   // une image arrive
        var wantActive  = false;   // l'utilisateur veut la caméra allumée
        var starting    = false;
        var startToken  = 0;
        var frozen      = false;
        var devices     = [];
        var deviceId    = '';
        var deviceLabel = '';
        var autoPick    = true;    // préférer une caméra USB à la webcam intégrée
        var resolution  = 'auto';
        var fit         = 'contain';
        var rotation    = 0;       // 0, 90, 180, 270
        var mirror      = false;
        var flipV       = false;
        var gray        = false;
        var brightness  = 100;
        var contrast    = 100;
        var zoom        = 1;
        var panX        = 0, panY = 0;          // en px dans la zone d'image
        var pendingPan  = null;                 // pan relatif à réappliquer (restauration)
        var saveTimer   = null;
        var toastTimer  = null;

        function scheduleSave() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () {
                if (alive && typeof saveBoard === 'function') saveBoard();
            }, 600);
        }

        function miniLabelText() {
            return '📷 Visualiseur' + (deviceLabel ? ' — ' + deviceLabel : '');
        }
        function updateMiniLabel() {
            var lbl = widget.querySelector('.wf-mini-bar > span');
            if (lbl) lbl.textContent = miniLabelText();
        }

        function toast(msg) {
            toastEl.textContent = msg;
            toastEl.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
        }

        // ── Affichage de l'état (attente, chargement, erreur, direct) ──
        function setStatus(kind, msg) {
            placeholder.classList.toggle('is-loading', kind === 'loading');
            phMsg.classList.toggle('is-error', kind === 'error');
            if (kind === 'idle') {
                phMsg.textContent = msg || 'Branchez le visualiseur (ou la webcam) en USB, puis démarrez la caméra.';
                startBtn.hidden = false;
                startBtn.textContent = 'Démarrer la caméra';
            } else if (kind === 'loading') {
                phMsg.textContent = msg || 'Connexion à la caméra…';
                startBtn.hidden = true;
            } else if (kind === 'error') {
                phMsg.textContent = msg;
                startBtn.hidden = false;
                startBtn.textContent = 'Réessayer';
            }
            outer.classList.toggle('is-live', kind === 'live');
            freezeBtn.disabled = kind !== 'live';
            snapBtn.disabled   = kind !== 'live';
            if (kind !== 'live') setFrozen(false);
        }

        // ── Liste des caméras ──
        function camName(d, i) { return d.label || ('Caméra ' + (i + 1)); }
        function refreshDevices() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return Promise.resolve([]);
            return navigator.mediaDevices.enumerateDevices().then(function (list) {
                devices = list.filter(function (d) { return d.kind === 'videoinput'; });
                camSelect.innerHTML = '';
                if (!devices.length) {
                    var o = document.createElement('option');
                    o.value = ''; o.textContent = 'Aucune caméra détectée';
                    camSelect.appendChild(o);
                } else {
                    devices.forEach(function (d, i) {
                        var o2 = document.createElement('option');
                        o2.value = d.deviceId;
                        o2.textContent = camName(d, i) + (d.label && INTERNAL_RE.test(d.label) ? ' (intégrée)' : '');
                        camSelect.appendChild(o2);
                    });
                    if (deviceId && devices.some(function (d) { return d.deviceId === deviceId; })) camSelect.value = deviceId;
                }
                return devices;
            }).catch(function () { return []; });
        }

        // ── Caméra ──
        function stopStream() {
            if (stream) {
                stream.getTracks().forEach(function (t) { t.onended = null; try { t.stop(); } catch (e) {} });
            }
            stream = null;
            active = false;
            try { video.srcObject = null; } catch (e) {}
        }

        function errorMessage(err) {
            var n = err && err.name;
            if (n === 'insecure') return 'La caméra n\'est accessible que sur une page sécurisée (adresse en https).';
            if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError')
                return 'Accès à la caméra refusé. Autorisez la caméra dans le navigateur (icône 🔒 ou 📷 dans la barre d\'adresse), puis réessayez.';
            if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError')
                return 'Aucune caméra détectée. Branchez le visualiseur en USB, attendez quelques secondes puis cliquez sur Réessayer.';
            if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError')
                return 'La caméra est déjà utilisée par un autre logiciel (Teams, Zoom, logiciel du visualiseur…). Fermez-le, puis réessayez.';
            return 'Impossible de démarrer la caméra' + (err && err.message ? ' (' + err.message + ')' : '') + '.';
        }

        function buildConstraints(withDevice) {
            var v = {};
            if (withDevice && deviceId) v.deviceId = { exact: deviceId };
            var r = RESOLUTIONS[resolution];
            if (r && r.w) { v.width = { ideal: r.w }; v.height = { ideal: r.h }; }
            return { video: Object.keys(v).length ? v : true, audio: false };
        }

        function startCamera() {
            if (!alive) return;
            wantActive = true;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatus('error', errorMessage({ name: 'insecure' }));
                return;
            }
            var token = ++startToken;
            starting = true;
            stopStream();
            setStatus('loading');
            navigator.mediaDevices.getUserMedia(buildConstraints(true))
                .catch(function (err) {
                    // Caméra mémorisée absente ou résolution refusée : on réessaie plus simplement
                    if (deviceId && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
                        return navigator.mediaDevices.getUserMedia(buildConstraints(false));
                    }
                    if (err.name === 'OverconstrainedError') return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    throw err;
                })
                .then(function (s) {
                    if (!alive || token !== startToken) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
                    stream = s;
                    var track = s.getVideoTracks()[0];
                    var settings = track && track.getSettings ? track.getSettings() : {};
                    if (settings.deviceId) deviceId = settings.deviceId;
                    deviceLabel = (track && track.label) || '';
                    if (track) track.onended = onTrackEnded;
                    video.srcObject = s;
                    var p = video.play();
                    if (p && p.catch) p.catch(function () {});
                    return refreshDevices().then(function () {
                        if (token !== startToken) return;
                        // Première fois : si c'est la webcam intégrée et qu'une caméra USB existe, on bascule
                        if (autoPick) {
                            autoPick = false;
                            var cur = devices.find(function (d) { return d.deviceId === deviceId; });
                            var curInternal = !cur || !cur.label || INTERNAL_RE.test(cur.label);
                            var ext = devices.find(function (d) { return d.label && !INTERNAL_RE.test(d.label) && d.deviceId !== deviceId; });
                            if (curInternal && ext) {
                                deviceId = ext.deviceId;
                                starting = false;
                                startCamera();
                                return;
                            }
                        }
                        starting = false;
                        active = true;
                        setStatus('live');
                        updateMiniLabel();
                        layoutVideo();
                        scheduleSave();
                    });
                })
                .catch(function (err) {
                    if (!alive || token !== startToken) return;
                    starting = false;
                    stopStream();
                    setStatus('error', errorMessage(err));
                    refreshDevices();
                });
        }

        function stopCamera(userAction) {
            startToken++;
            starting = false;
            stopStream();
            if (userAction) wantActive = false;
            setStatus('idle', userAction ? 'Caméra éteinte.' : undefined);
            scheduleSave();
        }

        function onTrackEnded() {
            if (!alive) return;
            stopStream();
            // wantActive reste vrai : l'image reviendra au rebranchement
            setStatus('error', 'La caméra a été débranchée. Rebranchez-la : l\'image reviendra toute seule (ou cliquez sur Réessayer).');
        }

        function onDeviceChange() {
            if (!alive) return;
            refreshDevices().then(function () {
                if (!wantActive || active || starting) return;
                if (outer.style.display === 'none') return;
                var ok = deviceId ? devices.some(function (d) { return d.deviceId === deviceId; }) : devices.length > 0;
                if (ok) setTimeout(function () { if (alive && wantActive && !active && !starting) startCamera(); }, 800);
            });
        }
        if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
            navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
        }

        // ── Figer / reprendre ──
        function setFrozen(on) {
            frozen = !!on && active;
            outer.classList.toggle('is-frozen', frozen);
            freezeBtn.classList.toggle('is-on', frozen);
            freezeBtn.innerHTML = frozen ? ICON_PLAY : ICON_PAUSE;
            freezeBtn.title = frozen ? 'Reprendre le direct (Espace)' : 'Figer l\'image (Espace)';
            if (!active) return;
            if (frozen) video.pause();
            else { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        }

        // ── Mise en place de la vidéo (rotation, miroirs, zoom, filtres) ──
        function buildFilter() {
            var f = [];
            if (brightness !== 100) f.push('brightness(' + brightness + '%)');
            if (contrast !== 100)   f.push('contrast(' + contrast + '%)');
            if (gray)               f.push('grayscale(1)');
            return f.join(' ');
        }
        // Dimensions de l'image orientée et échelle d'affichage à 100 %
        function geometry() {
            var sW = stage.clientWidth, sH = stage.clientHeight;
            var vw = video.videoWidth || 16, vh = video.videoHeight || 9;
            var swap = rotation % 180 !== 0;
            var fw = swap ? vh : vw, fh = swap ? vw : vh;
            var s = fit === 'cover' ? Math.max(sW / fw, sH / fh) : Math.min(sW / fw, sH / fh);
            return { sW: sW, sH: sH, vw: vw, vh: vh, fw: fw, fh: fh, s: s, swap: swap };
        }
        function clampPan(g) {
            // largeur visible de l'image (limitée au cadre en mode « remplir »)
            var cW = Math.min(g.sW, g.fw * g.s) * zoom, cH = Math.min(g.sH, g.fh * g.s) * zoom;
            var mx = Math.max(0, (cW - g.sW) / 2), my = Math.max(0, (cH - g.sH) / 2);
            panX = Math.max(-mx, Math.min(mx, panX));
            panY = Math.max(-my, Math.min(my, panY));
        }
        function layoutVideo() {
            if (!alive || outer.style.display === 'none') return;
            var g = geometry();
            if (!g.sW || !g.sH) return;
            if (pendingPan && video.videoWidth) {
                panX = pendingPan.x * g.sW; panY = pendingPan.y * g.sH; pendingPan = null;
            }
            video.style.width  = (g.swap ? g.sH : g.sW) + 'px';
            video.style.height = (g.swap ? g.sW : g.sH) + 'px';
            video.style.objectFit = fit;
            clampPan(g);
            video.style.transform = 'translate(-50%,-50%) translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ') rotate(' + rotation + 'deg) scale(' + (mirror ? -1 : 1) + ',' + (flipV ? -1 : 1) + ')';
            video.style.filter = buildFilter();
            zoomLabel.textContent = Math.round(zoom * 100) + ' %';
            stage.classList.toggle('is-zoomed', zoom > 1.001);
            mirrorBtn.classList.toggle('is-on', mirror);
            mirrorBtn.setAttribute('aria-pressed', mirror ? 'true' : 'false');
            rotateBtn.title = 'Tourner d\'un quart de tour (R) — actuellement ' + rotation + '°';
        }

        function setZoom(z, cx, cy) {
            var old = zoom;
            z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
            if (Math.abs(z - old) < 1e-4) return;
            // zoom vers le point visé (cx, cy relatifs au centre de la zone)
            if (cx === undefined) { cx = 0; cy = 0; }
            panX = cx - (cx - panX) * (z / old);
            panY = cy - (cy - panY) * (z / old);
            zoom = z;
            if (zoom <= 1.001) { zoom = 1; panX = 0; panY = 0; }
            layoutVideo();
            scheduleSave();
        }
        function zoomStep(dir) { setZoom(dir > 0 ? zoom * 1.25 : zoom / 1.25); }
        function resetZoom() { zoom = 1; panX = 0; panY = 0; layoutVideo(); scheduleSave(); }

        function rotate() { rotation = (rotation + 90) % 360; panX = 0; panY = 0; layoutVideo(); scheduleSave(); }
        function toggleMirror() { mirror = !mirror; layoutVideo(); scheduleSave(); }

        // ── Capture de la vue actuelle ──
        function captureCanvas() {
            if (!active || !video.videoWidth) return null;
            var g = geometry();
            var full = document.createElement('canvas');
            full.width = g.fw; full.height = g.fh;
            var ctx = full.getContext('2d');
            var flt = buildFilter();
            if (flt && 'filter' in ctx) ctx.filter = flt;
            ctx.translate(g.fw / 2, g.fh / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.scale(mirror ? -1 : 1, flipV ? -1 : 1);
            ctx.drawImage(video, -g.vw / 2, -g.vh / 2, g.vw, g.vh);
            if (!g.sW || !g.sH) return full;

            // Partie réellement visible à l'écran (zoom, déplacement, cadrage)
            var cx = g.sW / 2 + panX, cy = g.sH / 2 + panY;
            var bx0 = cx - g.sW * zoom / 2, bx1 = cx + g.sW * zoom / 2;
            var by0 = cy - g.sH * zoom / 2, by1 = cy + g.sH * zoom / 2;
            var iw = g.fw * g.s * zoom, ih = g.fh * g.s * zoom;
            var ix0 = cx - iw / 2, iy0 = cy - ih / 2;
            var vx0 = Math.max(0, bx0, ix0), vx1 = Math.min(g.sW, bx1, ix0 + iw);
            var vy0 = Math.max(0, by0, iy0), vy1 = Math.min(g.sH, by1, iy0 + ih);
            if (vx1 <= vx0 || vy1 <= vy0) return full;
            var sx = (vx0 - ix0) / iw * g.fw, sy = (vy0 - iy0) / ih * g.fh;
            var sw = (vx1 - vx0) / iw * g.fw, sh = (vy1 - vy0) / ih * g.fh;
            if (sx < 0.5 && sy < 0.5 && sw > g.fw - 1 && sh > g.fh - 1) return full;
            var out = document.createElement('canvas');
            out.width = Math.max(1, Math.round(sw)); out.height = Math.max(1, Math.round(sh));
            out.getContext('2d').drawImage(full, sx, sy, sw, sh, 0, 0, out.width, out.height);
            return out;
        }
        function scaledDataURL(canvas, maxSide) {
            var k = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
            if (k >= 1) return canvas.toDataURL('image/jpeg', 0.9);
            var c = document.createElement('canvas');
            c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
            c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
            return c.toDataURL('image/jpeg', 0.9);
        }
        function flash() {
            flashEl.classList.remove('go');
            void flashEl.offsetWidth;
            flashEl.classList.add('go');
        }
        function timestamp() {
            var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + 'h' + p(d.getMinutes()) + '-' + p(d.getSeconds());
        }
        function downloadCapture() {
            var c = captureCanvas();
            if (!c) { toast('Démarrez d\'abord la caméra'); return; }
            flash();
            var a = document.createElement('a');
            a.href = c.toDataURL('image/jpeg', 0.92);
            a.download = 'visualiseur_' + timestamp() + '.jpg';
            document.body.appendChild(a); a.click(); a.remove();
            toast('Capture téléchargée');
        }
        function captureToBoard() {
            var c = captureCanvas();
            if (!c) return;
            flash();
            if (typeof window._insertImageWidget === 'function') {
                try {
                    window._insertImageWidget(scaledDataURL(c, BOARD_IMG_MAX), 'visualiseur_' + timestamp() + '.jpg');
                    toast('Capture posée sur le tableau');
                    return;
                } catch (e) {}
            }
            downloadCapture();
        }

        // ── Réglages ──
        function setTheme(id) {
            if (!THEMES[id]) id = 'bleu';
            theme = id;
            outer.style.setProperty('--visu-bg', THEMES[id].bg);
            outer.style.setProperty('--visu-op', THEMES[id].op);
            widget.querySelectorAll('.visu-swatch').forEach(function (s) {
                s.classList.toggle('is-on', s.dataset.theme === id);
            });
        }
        function syncSettingsUI() {
            resSelect.value = RESOLUTIONS[resolution] ? resolution : 'auto';
            fitSeg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.fit === fit); });
            flipVSwitch.setAttribute('aria-checked', flipV ? 'true' : 'false');
            graySwitch.setAttribute('aria-checked', gray ? 'true' : 'false');
            brightRange.value = brightness; brightVal.textContent = brightness + ' %';
            contrastRange.value = contrast; contrastVal.textContent = contrast + ' %';
        }
        function closePanels() {
            settingsEl.classList.remove('open'); settingsBtn.classList.remove('is-on');
            helpEl.classList.remove('open');     helpBtn.classList.remove('is-on');
        }
        function togglePanel(panel, btn) {
            var open = !panel.classList.contains('open');
            closePanels();
            panel.classList.toggle('open', open);
            btn.classList.toggle('is-on', open);
            if (open && panel === settingsEl) { syncSettingsUI(); refreshDevices(); }
        }

        // ── Événements : barre d'outils ──
        startBtn.addEventListener('click', function (e) { e.stopPropagation(); startCamera(); });
        freezeBtn.addEventListener('click', function (e) { e.stopPropagation(); setFrozen(!frozen); });
        snapBtn.addEventListener('click', function (e) { e.stopPropagation(); captureToBoard(); });
        rotateBtn.addEventListener('click', function (e) { e.stopPropagation(); rotate(); });
        mirrorBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMirror(); });
        settingsBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(settingsEl, settingsBtn); });
        helpBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(helpEl, helpBtn); });
        zoomInBtn.addEventListener('click', function (e) { e.stopPropagation(); zoomStep(1); });
        zoomOutBtn.addEventListener('click', function (e) { e.stopPropagation(); zoomStep(-1); });
        zoomLabel.addEventListener('click', function (e) { e.stopPropagation(); resetZoom(); });

        // ── Événements : réglages ──
        camSelect.addEventListener('change', function (e) {
            e.stopPropagation();
            if (!camSelect.value) return;
            deviceId = camSelect.value;
            autoPick = false;
            startCamera();
        });
        refreshBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            refreshDevices().then(function (list) { toast(list.length ? list.length + ' caméra(s) détectée(s)' : 'Aucune caméra détectée'); });
        });
        resSelect.addEventListener('change', function (e) {
            e.stopPropagation();
            resolution = resSelect.value;
            if (wantActive) startCamera();
            scheduleSave();
        });
        fitSeg.addEventListener('click', function (e) {
            var b = e.target.closest('button[data-fit]');
            if (!b) return;
            e.stopPropagation();
            fit = b.dataset.fit;
            panX = 0; panY = 0;
            syncSettingsUI(); layoutVideo(); scheduleSave();
        });
        flipVSwitch.addEventListener('click', function (e) { e.stopPropagation(); flipV = !flipV; syncSettingsUI(); layoutVideo(); scheduleSave(); });
        graySwitch.addEventListener('click', function (e) { e.stopPropagation(); gray = !gray; syncSettingsUI(); layoutVideo(); scheduleSave(); });
        brightRange.addEventListener('input', function () { brightness = +brightRange.value; brightVal.textContent = brightness + ' %'; layoutVideo(); scheduleSave(); });
        contrastRange.addEventListener('input', function () { contrast = +contrastRange.value; contrastVal.textContent = contrast + ' %'; layoutVideo(); scheduleSave(); });
        resetImgBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            rotation = 0; mirror = false; flipV = false; gray = false; brightness = 100; contrast = 100;
            zoom = 1; panX = 0; panY = 0;
            syncSettingsUI(); layoutVideo(); scheduleSave();
        });
        downloadBtn.addEventListener('click', function (e) { e.stopPropagation(); downloadCapture(); });
        stopBtn.addEventListener('click', function (e) { e.stopPropagation(); closePanels(); stopCamera(true); });
        widget.querySelectorAll('.visu-swatch').forEach(function (s) {
            s.addEventListener('click', function (e) { e.stopPropagation(); setTheme(s.dataset.theme); scheduleSave(); });
        });

        // ── Zoom à la molette ──
        stage.addEventListener('wheel', function (e) {
            if (!active) return;
            e.preventDefault();
            e.stopPropagation();
            var r = stage.getBoundingClientRect();
            var cx = e.clientX - r.left - r.width / 2, cy = e.clientY - r.top - r.height / 2;
            setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), cx, cy);
        }, { passive: false });

        // ── Déplacement de l'image zoomée (souris, doigt, stylet) ──
        var panning = null;
        stage.addEventListener('pointerdown', function (e) {
            if (!active || zoom <= 1.001) return;
            if (e.target.closest('button')) return;
            e.stopPropagation();
            e.preventDefault();
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            panning = { id: e.pointerId, x: e.clientX, y: e.clientY, px: panX, py: panY };
            stage.classList.add('is-panning');
        });
        stage.addEventListener('pointermove', function (e) {
            if (!panning || e.pointerId !== panning.id) return;
            panX = panning.px + (e.clientX - panning.x);
            panY = panning.py + (e.clientY - panning.y);
            layoutVideo();
        });
        function endPan(e) {
            if (!panning || (e && e.pointerId !== panning.id)) return;
            panning = null;
            stage.classList.remove('is-panning');
            scheduleSave();
        }
        stage.addEventListener('pointerup', endPan);
        stage.addEventListener('pointercancel', endPan);
        // Empêche le tableau de déplacer le widget pendant qu'on déplace l'image
        stage.addEventListener('mousedown', function (e) { if (active && zoom > 1.001) e.stopPropagation(); });
        stage.addEventListener('touchstart', function (e) { if (active && zoom > 1.001) e.stopPropagation(); }, { passive: true });

        // ── Clavier (quand le visualiseur a le focus, ou en plein écran) ──
        var KEYMAP = {
            ' ': 'freeze', 'f': 'freeze', 'F': 'freeze',
            'c': 'capture', 'C': 'capture', 'p': 'capture', 'P': 'capture',
            'r': 'rotate', 'R': 'rotate', 'm': 'mirror', 'M': 'mirror',
            '+': 'zin', '=': 'zin', '-': 'zout', '_': 'zout', '0': 'zreset'
        };
        function doAction(a) {
            switch (a) {
                case 'freeze':  if (active) setFrozen(!frozen); break;
                case 'capture': captureToBoard(); break;
                case 'rotate':  rotate(); break;
                case 'mirror':  toggleMirror(); break;
                case 'zin':     zoomStep(1); break;
                case 'zout':    zoomStep(-1); break;
                case 'zreset':  resetZoom(); break;
            }
        }
        function handleKey(e) {
            if (!alive || outer.style.display === 'none') return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key === 'Escape') {
                if (settingsEl.classList.contains('open') || helpEl.classList.contains('open')) {
                    closePanels(); e.preventDefault(); e.stopPropagation();
                }
                return;                         // en plein écran : laissé au gestionnaire du document
            }
            var a = KEYMAP[e.key];
            if (!a) return;
            e.preventDefault();
            e.stopPropagation();
            doAction(a);
        }
        widget.addEventListener('keydown', handleKey);
        function onDocKey(e) {
            if (isMax && e.key === 'Escape') {
                if (settingsEl.classList.contains('open') || helpEl.classList.contains('open')) return;
                setMax(false);
                return;
            }
            if (isMax && !widget.contains(e.target)) handleKey(e);
        }
        document.addEventListener('keydown', onDocKey);

        // Prendre le focus au toucher pour activer le clavier
        outer.addEventListener('pointerdown', function (e) {
            if (e.target.closest('select, input')) return;
            if (!widget.contains(document.activeElement)) {
                try { outer.focus({ preventScroll: true }); } catch (err) { outer.focus(); }
            }
        });

        // ── Redimensionnement libre (rectangle) ──
        function startResize(clientX, clientY, isTouch) {
            var startX = clientX, startY = clientY;
            var startW = outer.offsetWidth, startH = outer.offsetHeight;
            function apply(x, y) {
                outer.style.width  = Math.max(MIN_W, startW + (x - startX)) + 'px';
                outer.style.height = Math.max(MIN_H, startH + (y - startY)) + 'px';
            }
            function onMouseMove(ev) { apply(ev.clientX, ev.clientY); }
            function onTouchMove(ev) { ev.preventDefault(); apply(ev.touches[0].clientX, ev.touches[0].clientY); }
            function end() {
                document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', isTouch ? onTouchMove : onMouseMove);
                document.removeEventListener(isTouch ? 'touchend' : 'mouseup', end);
                layoutVideo();
                if (typeof saveBoard === 'function') saveBoard();
            }
            if (isTouch) {
                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', end);
            } else {
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', end);
            }
        }
        resizeHandle.addEventListener('mousedown', function (e) {
            if (isMax) return;
            e.preventDefault(); e.stopPropagation();
            startResize(e.clientX, e.clientY, false);
        });
        resizeHandle.addEventListener('touchstart', function (e) {
            if (isMax) return;
            e.preventDefault(); e.stopPropagation();
            startResize(e.touches[0].clientX, e.touches[0].clientY, true);
        }, { passive: false });

        var ro = null;
        if (window.ResizeObserver) {
            ro = new ResizeObserver(function () { if (alive) layoutVideo(); });
            ro.observe(stage);
        }
        video.addEventListener('loadedmetadata', layoutVideo);
        video.addEventListener('resize', layoutVideo);

        // ── Boutons fenêtre : réduire / plein écran / fermer ──
        function setMax(on) {
            isMax = !!on;
            outer.classList.toggle('visu-fullboard', isMax);
            wfMax.title = isMax ? 'Quitter le plein écran' : 'Plein écran';
            outer.style.cursor = '';
            if (isMax) { try { outer.focus({ preventScroll: true }); } catch (err) {} }
            requestAnimationFrame(layoutVideo);
            scheduleSave();
        }

        function collapse() {
            if (widget.querySelector('.wf-mini-bar')) return;
            if (isMax) setMax(false);
            closePanels();
            // La caméra est libérée pendant la réduction, puis rallumée au dépliage
            var restart = wantActive;
            startToken++;
            starting = false;
            stopStream();
            setStatus('idle');
            wantActive = restart;
            outer.style.display = 'none';
            window._wfMiniBarCollapse(widget, miniLabelText(), {
                onExpand: function () {
                    outer.style.display = '';
                    requestAnimationFrame(layoutVideo);
                    if (wantActive) startCamera();
                }
            });
        }

        wfMin.addEventListener('click', function (e) { e.stopPropagation(); collapse(); });
        wfMax.addEventListener('click', function (e) { e.stopPropagation(); setMax(!isMax); });

        function destroy() {
            if (!alive) return;
            alive = false;
            startToken++;
            clearTimeout(saveTimer);
            clearTimeout(toastTimer);
            stopStream();
            if (ro) ro.disconnect();
            document.removeEventListener('keydown', onDocKey);
            if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
                navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
            }
        }

        wfClose.addEventListener('click', function (e) {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            destroy();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });

        // ── Propagation : ne pas déplacer le widget depuis les contrôles ──
        var INTERACTIVE = 'button, input, select, .visu-panel, .visu-resize-handle';
        outer.addEventListener('mousedown', function (e) {
            if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
        });
        outer.addEventListener('touchstart', function (e) {
            if (isMax || e.target.closest(INTERACTIVE)) e.stopPropagation();
        }, { passive: true });
        // Les listes déroulantes et curseurs ne doivent pas déclencher les raccourcis du tableau
        settingsEl.addEventListener('keydown', function (e) {
            if (e.target.closest('select, input')) e.stopPropagation();
        });

        // ── Curseur « déplacer » sur le cadre ──
        outer.addEventListener('mousemove', function (e) {
            if (isMax) { outer.style.cursor = ''; return; }
            if (e.target.closest('button, input, select, .visu-panel')) { outer.style.cursor = ''; return; }
            if (e.target.closest('.visu-resize-handle')) { outer.style.cursor = 'nwse-resize'; return; }
            if (active && zoom > 1.001 && e.target.closest('.visu-stage')) { outer.style.cursor = ''; return; }
            outer.style.cursor = 'move';
        });
        outer.addEventListener('mouseleave', function () { outer.style.cursor = ''; });

        // ── Nettoyage à la suppression (fermeture, « tout effacer », changement de tableau) ──
        var obs = new MutationObserver(function () {
            if (!document.contains(widget)) {
                destroy();
                obs.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });

        // ── Sauvegarde / restauration (utilisé par save-load.js) ──
        widget._visuGetData = function () {
            var sW = stage.clientWidth || 1, sH = stage.clientHeight || 1;
            return {
                w: parseFloat(outer.style.width)  || DEFAULT_W,
                h: parseFloat(outer.style.height) || DEFAULT_H,
                fullboard: isMax,
                collapsed: !!widget.querySelector('.wf-mini-bar'),
                theme: theme,
                active: wantActive,
                deviceId: deviceId,
                deviceLabel: deviceLabel,
                resolution: resolution,
                fit: fit,
                rotation: rotation,
                mirror: mirror,
                flipV: flipV,
                gray: gray,
                brightness: brightness,
                contrast: contrast,
                zoom: zoom,
                panX: pendingPan ? pendingPan.x : panX / sW,
                panY: pendingPan ? pendingPan.y : panY / sH
            };
        };

        widget._visuSetData = function (d) {
            if (!d || typeof d !== 'object') return;
            if (d.w > 0) outer.style.width  = Math.max(MIN_W, Math.min(d.w, window.innerWidth))  + 'px';
            if (d.h > 0) outer.style.height = Math.max(MIN_H, Math.min(d.h, window.innerHeight)) + 'px';
            setTheme(d.theme);
            if (typeof d.deviceId === 'string') deviceId = d.deviceId;
            if (typeof d.deviceLabel === 'string') deviceLabel = d.deviceLabel;
            if (deviceId) autoPick = false;
            resolution = RESOLUTIONS[d.resolution] ? d.resolution : 'auto';
            fit = d.fit === 'cover' ? 'cover' : 'contain';
            rotation = [0, 90, 180, 270].indexOf(d.rotation) >= 0 ? d.rotation : 0;
            mirror = !!d.mirror;
            flipV = !!d.flipV;
            gray = !!d.gray;
            brightness = (d.brightness >= 50 && d.brightness <= 200) ? d.brightness : 100;
            contrast   = (d.contrast   >= 50 && d.contrast   <= 200) ? d.contrast   : 100;
            zoom = (d.zoom >= ZOOM_MIN && d.zoom <= ZOOM_MAX) ? d.zoom : 1;
            pendingPan = zoom > 1 ? { x: +d.panX || 0, y: +d.panY || 0 } : null;
            panX = 0; panY = 0;
            syncSettingsUI();
            updateMiniLabel();
            if (!!d.fullboard !== isMax) setMax(!!d.fullboard);
            if (d.collapsed) {
                // réduit : la caméra se rallumera au dépliage
                wantActive = !!d.active;
                setTimeout(function () { if (alive) collapse(); }, 150);
            } else if (d.active) {
                startCamera();
            }
            layoutVideo();
        };

        widget._visuSetMax = setMax;

        // ── Démarrage ──
        outer.style.width  = DEFAULT_W + 'px';
        outer.style.height = DEFAULT_H + 'px';
        setTheme('bleu');
        syncSettingsUI();
        setStatus('idle');
        refreshDevices();
        if (savedData) widget._visuSetData(savedData);
    };

    // =========================================================================
    // HOOK dans createWidget
    // =========================================================================
    function isPhone() {
        if (typeof window.isPhoneScreen === 'function') return window.isPhoneScreen();
        return !!(window.matchMedia && window.matchMedia('(max-width: 768px), (max-height: 500px) and (pointer: coarse)').matches);
    }
    function installHook(orig) {
        window.createWidget = function (type) {
            var widget = orig.apply(this, arguments);
            if (type === 'visualiseur' && widget) {
                initVisualiseurWidget(widget);
                // Sur téléphone : ouverture directe en plein écran (bouton vert)
                if (isPhone() && widget._visuSetMax) widget._visuSetMax(true);
            }
            return widget;
        };
    }
    if (typeof window.createWidget === 'function') {
        installHook(window.createWidget);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof window.createWidget === 'function') installHook(window.createWidget);
        });
    }

})();
